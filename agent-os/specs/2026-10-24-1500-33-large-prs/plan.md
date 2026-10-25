# Spec: large PRs (#33) and round numbering after posted rounds (#10, first half)

Spec folder: `agent-os/specs/2026-10-24-1500-33-large-prs/`

## Context

The first run on a large PR (Losers League #778, 336 files per GitHub today; the issue said 333) hit three things:

1. `redline-gh.sh files` uses `gh pr view --json files`, capped at 100 paths, so the snapshot and the reviewer missed 236 files.
2. `gh pr diff` (the whole-PR diff endpoint) answers `406 diff exceeded the maximum number of files (300)` on #778 (confirmed 2026-10-24). That breaks `place`/`post-review` anchoring **and** the reviewer's round 1 diff (`redline-gh.sh diff`), a gap the issue did not list. All three findings went to the body under "Not placed inline".
3. The GitHub agent then reported the zero-inline review as `error` ("Review posted, but no inline comments were placed…", run record `wf_dd6e8938-55c` in the `loser-epic-723-live-commenting` project dir), and the loop stops on any `posted.error`. The round ended at `post`: no shaping, no fixes.

A fresh launch today would also start at round 1 again on a PR that already has a posted "Redline round 1", and `has-review` would skip the post (#10). The round-numbering half of #10 is in scope: a fresh launch numbers its first round after the last posted one and posts. The resume-from-error half stays out.

## Decisions (go into shape.md)

- **`files`** paginates `GET pulls/<n>/files`; precheck cross-checks the count against the local `git diff --name-only origin/<base>...HEAD` and warns on a mismatch (counts on each side). Decided by the issue.
- **`diff` is always synthesized** from the per-file `patch` of the paginated files response (asked 2026-10-24): one `diff --git a/<f> b/<f>` + `--- a/<f>` (or `/dev/null` for added) + `+++ b/<f>` (or `/dev/null` for removed) header per file, `previous_filename` as the `a/` side of a rename, then the patch verbatim; a file whose patch GitHub omits (binary, or over its per-file limit; 56 of 336 on #778) gets the header and one line `(no patch: binary or too large for GitHub)`. `place` and `diff` share one fetch (`pr_files()`), so anchoring works at any file count.
- **Anchoring per file** from that file's own patch, never the whole-PR diff. Files without a patch fall back to the body.
- **Body marker.** A comment `place` moves into the body is prefixed with `<!-- redline:<id> -->` (the id parsed from the comment body's leading `**R1-2**`). Later rounds reply to a body finding with an **issue comment** whose first line is the marker, then `**R1-2** · \`file:line\` · from the Redline round N review body`, then the usual reply body. One issue comment per finding, so the one-reply-per-finding model holds.
- **Zero inline threads is a warning, not an error**, in the GitHub agent's instructions and in the loop (`warnings`), so the run continues into shape and fix.
- **Precheck** prints the GitHub file count, warns above 300 (the whole-PR diff endpoint is unavailable; Redline reads per-file patches, and findings in a file whose patch GitHub omits go in the body), and refuses above an optional `maxFiles` in `redline.json` ("split the PR"). The template is unchanged; the README documents the key.
- **First round from args.** The skill runs the new `redline-gh.sh last-round <n>` (highest posted `Redline round N`, 0 when none) in the precheck and passes `args.firstRound = last + 1`; the workflow never asks GitHub for it (replay standard). Every `round === 1` in the loop becomes `round === firstRound`; the cap is relative (`round - firstRound + 1 > maxRounds`).
- **gh harness is gate step 8** (asked 2026-10-24): `tests/gh-test.sh` over `tests/gh-fixtures/` with a fake `gh` on PATH. Costs the gate edit, `checks.json` + regenerate, the restamp, the unattended fill-ins (`gate steps 1 to 8`, `Steps 9 and 10`, retro step 9) and the testing standard.
- "Guard rows for the new gh api shapes" is read as rows for the new `redline-gh.sh` subcommand (`last-round`) and the changed ones (`files`, `diff`, `place`); the roles never run `gh` itself.
- **Minimum gh version 2.48.0** (`gh api --slurp`, added in cli/cli v2.48.0, PR 8620; the script already relied on it in `review-comments` and `post-review` without saying so). The README's Requirements line records it. `pr_files` catches a gh failure whose stderr says `unknown flag: --slurp` and exits 2 with one line: `redline-gh.sh: gh <installed version> does not know --slurp; Redline needs gh 2.48.0 or newer`. The precheck's `files` step stops the launch with that line verbatim (the skill already relays a failing script's line).
- **Files without a patch are not read wholesale.** The 56 such files on #778 are built assets, lockfiles and large generated code; the reviewer prompt says a file that shows as a header only is read in the tree only when a finding points there, never as a pass over all of them.
- Scope out: resume-from-error (#10 second half), the leftover untracked round folder, `redline-revise`.

## Tasks

### Task 1: Save spec documentation
`agent-os/specs/2026-10-24-1500-33-large-prs/`: `plan.md` (this plan), `shape.md` (scope, the Decisions above, Context: visuals none; references; product alignment: mission "Honest about its reach" / "nothing hidden from the review thread", roadmap Phase 1 dogfood on #778), `standards.md` (full text of scripts/bash-conventions, scripts/guard, testing/tests, workflow/replay, workflow/agents, process/standards-retrospective, prompts/attribution), `references.md` (below). No visuals/.

### Task 2: `redline-gh.sh`: paginated files, synthesized diff, per-file anchoring, markers, `last-round`
File: `scripts/redline-gh.sh`. Reuse the awk hunk walker in `diff_positions` (lines 57-73) per file.
- `pr_files <n>`: `gh api --paginate --slurp "repos/{owner}/{repo}/pulls/<n>/files" | jq '[.[][]]'` (no `--jq`, so the test shim serves raw JSON). Fetched once per invocation. On failure, when gh's stderr contains `unknown flag: --slurp`, print the one gh-version line decided above (with `gh --version`'s first line) and exit 2; otherwise gh's own error, exit 1.
- `files`: `pr_files | jq '[.[].filename]'`.
- `diff`: synthesized as decided (jq emits header + patch per file; `\n`-joined; `-r`).
- `diff_positions`: iterate `pr_files` items with a patch; feed each patch to the awk walker with the path passed in (`-v path=`), hunks only (no `diff --git` state needed).
- `place_comments`: unchanged logic; the moved section becomes `<!-- redline:<id> -->\n\`path:line\`\n\n<body>` per moved comment (id from `^\*\*(R[0-9]+-[0-9]+)\*\*`; no marker when absent). `moved` entries gain `id`.
- `last-round <n>`: reviews bodies (as `has-review`), `grep -o '^Redline round [0-9]\+'`, print the max as a bare JSON number, `0` when none; exit 2 on gh error. Header comment: usage lines for `last-round`, the new `files`/`diff` sources, the marker.
- Proof: Task 5's harness (red before green: write the cases first).

### Task 3: guard group and rows
Files: `scripts/redline-guard.sh` (line 462 `GH_READ` adds `"last-round"`; header line 67), `tests/guard-cases.tsv` (same commit): `redline:redline-github allow … last-round 42`, `redline:redline-reviewer allow … last-round 42`, neighbours `redline:redline-standards-approver deny … last-round 42` and `redline:redline-checker deny … last-round 42`; keep rows 135/388 (`files 42`, `diff 5`). Proof: `tests/guard-test.sh`.

### Task 4: the loop
File: `workflows/redline-loop.js`.
- `args.firstRound` (integer ≥ 1, default 1; `fail` otherwise). `let round = firstRound`. Replace `round === 1` / `round > 1` / `round - 1` at 465, 569, 1049, 1053-1054, 1611, 1616, 1619, 1623, 1640, 1649 with `firstRound`-relative forms; cap at 1690 → `round - firstRound + 1 > maxRounds`; 1423/1425 "Only round 1" → `round ${firstRound}`.
- `reviewBody`: for `reviewed === 'pr'` with `firstRound > 1`, append `Rounds 1 to ${firstRound - 1} were posted by an earlier run; this run starts at round ${firstRound}.`
- `post()`: after the agent returns, when `posted.posted && active.length && posted.review.comments.length === 0` push a warning (`round N: no finding could be placed inline; replies go as issue comments quoting the body marker`); when `movedToBody.length` push a warning naming them. Never throw for placement.
- `postPrompt`: drop the 422 re-post clause; say the script moves what it cannot anchor, reports it in `moved`, and a review with no inline comment is a valid result: `error` only when the post itself failed.
- Replies: when `comment_id` is 0, compose the body as decided (marker first line, the `**R1-2** · file:line · from the Redline round N review body` line, then `replyBody`); `pushReplyPrompt` step 2: comment_id 0 → `${GH} comment ${pr} <file>` once per such reply (`reply_id` 0). Applies to `droppedReplies` and the revise replies (1145, 1396); dry run writes the file only.
- Proof: Task 6.

### Task 5: `tests/gh-test.sh` and `tests/gh-fixtures/` (new; gate step 8)
Pattern: `tests/prefs-test.sh` (`ok`/`bad`, temp git repo, `set -uo pipefail`). A `gh` shim written into the temp dir and put first on PATH; it serves raw JSON by endpoint and pr number from `tests/gh-fixtures/` (`--paginate --slurp` → the array of pages), and exits 1 with a 406-style message for `pr diff` (pinning that nothing calls it). Fixture: 150 files over two pages (100 + 50), filler generated with jq plus hand-written specials in `files-special.json`: a modified file with two hunks, an added file with no patch, a renamed file with `previous_filename`, a removed file. `reviews-7.json`: bodies `Redline round 1`, `Redline round 2…`, a human review, `Redline roundabout`. `review-7.json`: comments on an added line (RIGHT), a context line (LEFT), an off-hunk line, and a line in the no-patch file.
Cases: an old-gh shim (prints `unknown flag: --slurp` to stderr, exit 1, when it sees `--slurp`) makes `files` exit 2 with the version line naming 2.48.0; `files` → 150 paths in page order; `diff` → 150 `diff --git` headers, the rename's `a/` side, the no-patch line, hunks verbatim; `place` → 2 placed, 2 moved, markers `<!-- redline:R1-3 -->`/`R1-4` in the body, `moved[].id`; `last-round` → 2; on a reviews fixture without Redline → 0; `has-review 7 2` exit 0 and `has-review 7 3` exit 1 (neighbours); usage errors exit 2. Prints `N passed, 0 failed`.

### Task 6: loop-test checks
File: `tests/loop-test.mjs`. New section 8: (a) zero-thread continuation: post mock returns `comments: []`, `movedToBody` = every id; assert `status === 'done'`, the warning, the push-and-reply prompt carries `comment_id: 0` replies whose bodies start with `<!-- redline:R1-1 -->` and the prompt names `redline-gh.sh comment`; (b) `firstRound: 2`: labels `gather r2|review r2|post r2|…`, spec folder `…-114-review-round-2`, reviewer prompt `R2-<n>` and `reviewed "pr"`, review body line about rounds 1 to 1 posted by an earlier run, `has-review 114 2` in the post prompt, handoff comment "Only round 2 reviewed the whole PR", cap relative (`maxRounds 1` with `firstRound 2` caps at round 3, not 2); (c) existing scenarios unchanged (default firstRound 1; replay prefix checks still pass).

### Task 7: the skill and the agents
- `skills/redline/SKILL.md` §4 precheck: new steps after 6: `redline-gh.sh files <n>` (moved here from §5 step 2; keep the array for the snapshot), print the count, cross-check against `git diff --name-only origin/<baseRefName>...HEAD` (run plainly; count the lines yourself; a git failure is a warning), warn above 300 with the text decided, refuse above `maxFiles` when `redline.json` sets it ("split the PR"); `redline-gh.sh last-round <n>` → `firstRound`. §5: snapshot folder `…-<n>-review-round-<firstRound>`; `args.firstRound`. §7: "round 1" → "the first round (`firstRound`)" at 148, 168; §2 table rows 26, 41-42 likewise.
- `agents/redline-github.md`: post-review paragraph (the script anchors from per-file patches; `moved` is reported as `movedToBody`; **a review with no inline comment is not an error**); reply paragraph (comment_id 0 → `redline-gh.sh comment <pr> <file>` with the marker body; never twice: check `pr-comments` when unsure).
- `agents/redline-reviewer.md` line 30 and `reviewPrompt` (loop line 570): unchanged command names; add that `diff` is built from GitHub's per-file patches, that a file whose patch GitHub omits shows as a header plus one `(no patch…)` line, and that such a file (built assets, lockfiles, generated code, binaries) is opened in the tree **only when a finding points there**, never read as a pass over all of them.
- `skills/redline/SKILL.md` precheck: the `files` step stops the launch when the script exits 2 with the gh-version line, verbatim.

### Task 8: gate, checks.json, stamp, unattended section, docs
Same commit: `.claude/commands/agent-os/shape-spec.md` gate step **8. GitHub wrapper** — `tests/gh-test.sh` prints `N passed, 0 failed`; a change to `scripts/redline-gh.sh` adds a case; the fake `gh` serves `tests/gh-fixtures/`; renumber retrospective → 9, spec folder → 10; step 7's tail "Steps 1 to 7" → "1 to 8"; plan template line 204 "seven" → "eight". Unattended fill-ins via `scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-8 --prose-steps "9 and 10" --retro-step 9 --no-pr-body --force`. `.claude/redline/checks.json` step 8 `{"step": 8, "name": "gh", "title": "GitHub wrapper", "cmd": "tests/gh-test.sh"}`; regenerate `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`; restamp `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`. Also `templates/settings.allow.json`: nothing (the skill's calls are covered by `Bash(/*/scripts/redline-gh.sh *)` and `Bash(git diff:*)`).
- `README.md`: Requirements line adds `gh` 2.48.0 or newer (`gh api --slurp`); `redline-gh.sh` tables (`files`, `diff`, `place`, `post-review`, new `last-round`), "Rules the agent follows" (marker, issue-comment reply, zero inline not an error), Files table (`tests/gh-test.sh`, `tests/gh-fixtures/`), Launching/Use (file count, 300 warning, `maxFiles`, first round after the last posted), Known limits (a file whose patch GitHub omits anchors nothing: its findings sit in the body with a marker), snapshot `files` wording, Settings note on `maxFiles`.
- `agent-os/product/tech-stack.md` "seven steps" → "eight"; standards edits go through the retrospective (Task 9).

### Task 9: Verification Gate
Run `.claude/redline/checks.sh --baseline` (steps 1 to 8) until green; report failing output verbatim. Then the standards retrospective, applied in its own commit: `testing/tests` (six harnesses; `tests/gh-test.sh` with a fake `gh` on PATH; a subcommand that the shim must serve calls `gh api` without `--jq`), `scripts/bash-conventions` (`last-round` in GH_READ; `diff` and `place` share `pr_files`; a read subcommand that prints a number prints it as JSON), `workflow/replay` (the first round number enters through `args.firstRound`, read by the skill from `redline-gh.sh last-round`, never inside the workflow), `process/standards-retrospective` ("Gate step 8" → 9), `workflow/agents` (placement into the body is reported, never an error). Then `plan.md` As built + Decisions deviations.

## Verification on Losers League (the real test)

Before launching, from `~/Code/Sites/loser` on `epic/723-live-commenting` (after the person commits the leftover round 1 folder, per the issue's "Done when"), read-only checks with the plugin's script: `redline-gh.sh files 778 | jq length` → 336; `redline-gh.sh diff 778 | grep -c '^diff --git'` → 336, and 56 `(no patch…)` lines; `redline-gh.sh last-round 778` → 1; `redline-gh.sh place 778 <round-1-review.json from that folder>` shows which of R1-1..R1-3 now anchor (R1-2 `SingleEmoji.php:51` and R1-3 `useLiveCommentThread.ts:139` should; GitHub omitted no patch for those).

Then `/redline:redline 778`. Look for: the precheck prints `336 files on GitHub` and the local count, warns above 300, no `maxFiles` refusal; the round is numbered **2** (`last-round` → 1), the spec folder is `…-778-review-round-2`, `snapshot-start.json` lists all 336 files; the review posts as `Redline round 2`, findings inline where GitHub allows and in the body with `<!-- redline:R2-n -->` where not; the run continues into shape and fix (no `error` at `post`); a body finding's reply arrives as an issue comment quoting its marker.

## References (references.md)
- `scripts/redline-gh.sh` `diff_positions`/`place_comments` (57-91): the hunk walker and the move-to-body, reused per file.
- `scripts/redline-gh.sh` `has-review` (148-157): the reviews fetch `last-round` shares.
- `tests/loop-test.mjs` `post r1` mock (43-46) and `samePrefix`: the zero-thread scenario and the replay checks.
- `tests/prefs-test.sh` (1-30): harness shape for `tests/gh-test.sh`.
- `tests/guard-cases.tsv` rows 135, 141-144, 388: the gh-read rows to pin beside the new ones.
- Run record `~/.claude/projects/-Users-michaelwitwicki-Code-Sites-loser-epic-723-live-commenting/18d8d4cf-…/workflows/wf_dd6e8938-55c.json`: the actual `post` failure text.

## Commits (the person makes them)
Suggested boundaries: (1) spec folder; (2) gh script + `tests/gh-test.sh` + fixtures (red case first, then green); (3) guard + rows; (4) loop + loop-test; (5) skill + agents; (6) gate text + `checks.json` + regenerated `checks.sh` + restamp + unattended fill-ins + README + tech-stack; (7) standards retrospective; (8) as-built. PR body cites #33 and the first half of #10 (which stays open for resume-from-error). No AI attribution anywhere.

## As built (2026-10-24)

Built as planned, with these deviations:

- **A second bug surfaced on #778.** The 150-file fixture passed while the real PR (336 files, a 1.8 MB diff) failed `place` with `jq: Argument list too long`: the positions list went through `--argjson`. It now goes through `--slurpfile` from a temp file, and the harness carries a 60,000-line patch (PR 9) that reproduces the overflow. Recorded in testing/tests and scripts/bash-conventions.
- **The per-file walker's first draft** used `awk -F '\t'`, which broke the hunk-header fields; the harness caught it red and the sentinel line is now read with `substr`.
- `place` on the fixture leaves 3 comments inline and moves 2 (the plan said 2 and 2): a comment in the renamed file anchors under its new name, which is the behaviour wanted.
- `result()` reports `firstRound`, so the skill can name the round it summarises.
- `CLAUDE.md`'s Specs line said the gate "runs its six commands" (already stale at seven); it now says eight.
- GitHub lists 336 files on #778 today, not the 333 the issue named; the precheck prints both counts, which is the point of the cross-check.
- On #778, with the new `place`, all three round 1 findings anchor inline (`moved: []`), so the round 2 run should show inline threads rather than body markers; the marker path is proven by the harness and the loop test.

Gate: `.claude/redline/checks.sh --baseline` green with eight checks (guard 366 rows, loop 129 checks, prefs 44, gate 117, setup 240, gh 42), stamp `steps 1-8` matching. Standards retrospective applied: testing/tests (six harnesses; the gh harness; a fixture large enough for its limit), scripts/bash-conventions (`--slurpfile` over `--argjson`; no `gh pr diff` or `gh pr view --json files`; gh 2.48.0; a numeric answer as a JSON number), workflow/replay (`args.firstRound`), workflow/agents (a degraded result is data), process/standards-retrospective (gate step 9).
