# The gate's printed result is sized for the workflow (#68)

Follow-up spec on PR #94's branch. Spec folder: `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/`.

## Context

`checks.sh` prints one JSON object, and the checker can return it only when the Bash tool shows it inline. On PR #94 the result reached 30 to 31 KB twice (round 3, then round 5 of a fresh run), the tool saved it to a file, the checker may read no file, and the run stopped at `check` with a gate that had passed. The size grows with the pull request and with the run: `allowed`, `changed_files` and `commits` are uncapped, and nine passing checks alone were 14.3 KB.

Measured today with `checks.sh --git-only` on the round 5 snapshot: 14.7 KB for the git block alone (102 allowed paths 6.0 KB, 26 commits 3.6 KB, 42 changed files 2.9 KB).

Outcome: the printed result depends on neither the pull request's size nor the run's length, a budget proves it, and a result that still spills no longer stops a round whose gate passed.

## Decisions

Given with the request (1 to 10), not reopened: size for the workflow; counts for `allowed` and changed files; `unexpected_files` and `uncommitted` in full; ANSI stripped before any cap; budget under 10 KB passing and under 25 KB with every check failing, pinned in `tests/setup-test.sh` with the arithmetic in the template's comment; the change is in `scripts/checks-template.sh` with its version raised, `checks.sh` regenerated and restamped; schema, checker agent file, `docs/contract.md` and `docs/scripts.md` follow; version stays 0.3.0; item 10 is reported, not fixed.

Answered while shaping (2026-11-15):

1. **Commits: this round only.** The round snapshot gains `round_sha`, the newest commit an earlier round's check listed, or `start_sha`. `commits` lists `round_sha..HEAD`; `commits_count` counts `start_sha..HEAD`. The four uses (`judge()` prefix check and id check, `revise()` new-commit filter, reply and handoff text) need nothing older.
2. **Rider: the subject is cut at 100 characters**, at the last space at or before 100 so no id is split (`R5-10` never becomes `R5-1`), then `...`, then every finding id found in the part cut off is appended. The rescue matches both id forms the workflow looks for, `R<round>-<n>` and `H<n>-<k>`, with the boundaries `mentions()` uses. Evidence: 12 of 373 `redline:` subjects name an id past column 72 (the standards commit's `finishing R1-1, R1-4 and R1-8`, one fix commit at column 124). The length is stated in the template's comment.
3. **Rider: `round_sha` stays the round's starting commit on a resumed attempt.** It holds by construction (a round's commits join `commitsAll` only after its check passes), and the loop test pins it.
4. **Spill fallback: a kept result and `--verdict`.** No guard change: the guard already lets the checker run the repository's `checks.sh` with any flags (`scripts/redline-guard.sh:1064`), and refuses it every file read.
5. **Rider: where the kept result lives.** Outside the working tree, at `${TMPDIR:-/tmp}/redline-checks/<root key>-<head sha>.json`. The root key is `git hash-object` of the physical path of the repository's top level, so two worktrees of one repository never read each other's. Each run removes this root's earlier files and writes its own, so there is one per root. `--verdict` reads only the file for the current HEAD: HEAD moved, or no run here, is exit 2 and the round stops as today. The plan and the template's comment both say so.

Mine, small enough not to ask (say so at approval if you disagree):

- A passing check prints `name`, `exit`, `recorded` and nothing else. Its output is in the kept result.
- No sample of `allowed` or changed files: counts only, the full lists are in the kept result.
- `formatter_touched_outside_pr` gets the same treatment (`formatter_touched_count`); the workflow never reads it, and such a file also shows under `unexpected_files`.
- A failing check's `cmd` is cut at 120 characters.
- stderr counts toward what the tool shows, so the progress lines name the check and drop its command, and the two failure lines give counts.
- The test for the rescue is permanent, not only red-before-green: a template copy with the rescue line removed must lose the id.

## The printed result (template v3)

```
{"mode":"full","ok":true,
 "checks":[
   {"name":"guard","exit":0,"recorded":false},
   {"name":"loop","cmd":"node tests/loop-test.mjs","exit":1,"recorded":false,
    "truncated":true,"stdout":"...","stderr":"..."}],
 "git":{"start_sha":"<40>","round_sha":"<40>",
   "allowed_count":402,"changed_count":300,
   "unexpected_files":[],"uncommitted":[],
   "commits":[{"sha":"<40>","message":"redline: R5-10 open every handoff ..."}],
   "commits_count":100,"diff_lines":212,"formatter_touched_count":0},
 "kept":"<TMPDIR>/redline-checks/<root key>-<head sha>.json"}
```

Printed with `jq -c`. `checks.sh --verdict [--baseline | --git-only] [<snapshot>]` runs no check and prints the same object from the kept result with `"verdict":true` and no `stdout`, `stderr` or `truncated`; it exits with the kept run's exit code, or 2 when there is no kept result for this root at this HEAD, or its mode or snapshot differ from what was asked.

The kept file: `{root, head, mode, snapshot, exit, result}`, where `result` is the full form: every check with `cmd` and the last 200 lines of each stream (stripped, 64 KB a stream), and the git block with `allowed`, `changed_files`, `formatter_touched_outside_pr` and every commit since `start_sha` with whole subjects.

Compatibility, both ways: an older `checks.sh` ignores `round_sha` and the workflow still filters by sha; an older workflow sends no `round_sha` and the new script lists from `start_sha`. `CHECKER_SCHEMA` keeps the v2 keys as optional.

## Budget (stdout and stderr together; 12 checks, a round of 40 commits)

| Part | Bytes |
|---|---|
| Envelope, the git block's fixed keys, the kept path | 600 |
| stderr: two short lines a check, four more | 960 |
| A passing check: 39 + name | 60 |
| A commit: 64 + subject (100, `...`, rescued ids) | 174 |
| A failing check: 84 + name + `cmd` (120, doubled at worst by escaping) | 344 |
| Failing output: `budget=5120` shared, doubled at worst once encoded | 10,240 |

- Passing: 600 + 960 + 12 x 60 + 40 x 174 = **9,240**, under 10,000.
- Every check failing: 600 + 960 + 12 x 344 + 10,240 + 40 x 174 = **22,888**, under 25,000.
- Nothing in either sum is the number of files, of allowed paths or of commits since the start. Each unexpected or uncommitted path adds its length plus 3, and both lists are empty on a passing gate.
- "Doubled at worst": control bytes other than tab and newline are removed with the ANSI escapes, so JSON escapes only newline, tab, quote and backslash, one extra byte each.

## Tasks

The user makes every commit. Each slice below is built red before green, then I stop with its file list.

### Task 1: Save spec documentation

`plan.md`, `shape.md` (the decisions above, with who decided), `standards.md` (scripts/bash-conventions, scripts/guard, testing/tests, process/release, process/docs-gate, process/standards-retrospective, process/internal-notes, prompts/attribution, workflow/agents, workflow/replay, each in full), `references.md`. No visuals. Product context: the mission's "run the repository's gate" line; no roadmap item moves.

### Task 2: The template, the generator's header, this repository's `checks.sh` (slice A)

`tests/setup-test.sh` first, red: cases under a new `# checks: the printed result is bounded (#68)` block, with `TMPDIR` pointed into the harness's work directory.

- ANSI: a coloured failing check prints no escape byte; a stream over the cap only because of escapes is not `truncated`; an invalid byte does not stop BSD sed (`LC_ALL=C`).
- A passing check has exactly `name`, `exit`, `recorded`.
- `allowed_count` and `changed_count` are numbers; `allowed` and `changed_files` are absent from stdout and whole in the kept file.
- Commits: with `round_sha`, only later commits; without it, all since `start_sha`; `commits_count` either way; a `round_sha` that is no commit exits 2.
- The cut: a 150-character subject is cut at a space, ends `...`; an id that straddles column 100 is not split; a subject whose only mention of `R12-3` (and one of `H2-10`) is past the cut still carries it; with the rescue line removed from a template copy (`REDLINE_TEMPLATE`), it does not.
- Kept and `--verdict`: after a full run, `--verdict <snapshot>` prints `verdict: true`, the checks' exits and no output, and exits with the run's code; a second run leaves one kept file for the root.
- Stale: after one more commit, `--verdict` exits 2 and names the moved HEAD.
- Two worktrees (`git worktree add`): a run in one, `--verdict` in the other at the same commit exits 2.
- Mode: `--verdict --baseline` after a full run exits 2.
- Budget, passing: 300 changed files with 70-character paths, 100 commits since the start with subjects over 100 characters, `round_sha` at the 60th, 12 passing checks: stdout plus stderr under 10,000 bytes; the same with 600 files and 200 commits differs by under 20 bytes.
- Budget, worst: the same repository, 12 checks each failing with 300 coloured 120-character lines on both streams: under 25,000 bytes, every failing check `truncated` with output.
- The existing `runs:` cases follow the new shape (the passing check's stdout case reads the kept file).
- The version comment at line 20 says v3.

Then `scripts/checks-template.sh`:

- Header: the `--verdict` usage line, `round_sha` in the Snapshot line, where the kept result lives, `# redline-template: checks-template.sh v3`.
- `--verdict` in the argument loop; it combines with the two mode flags.
- The comment above the caps, rewritten: the table above, `budget=5120 keep_failed=200 cmd_max=120 subject_max=100`, the kept result's path, key and overwrite rule, and the worktree sentence.
- `plain()`: `LC_ALL=C sed` with the `$'...'` form for CSI, OSC and lone escapes, then `tr -d` for the remaining control bytes. `run_check` strips each stream once, so every count and cap reads stripped text.
- `emit_checks` writes the kept checks and the printed checks; the shared-budget split stays as it is (`scripts/checks-template.sh:121-160`).
- The git block: `round_sha` from the snapshot, the commit cut and rescue in one `awk` pass (the rescue on its own marked line), counts.
- The kept file written through a temp file and `mv`; stdout is a `jq -c` projection of it.

Then `scripts/redline-setup.sh`: the generated header's Usage and Snapshot lines (the `H` list near `:1062` and `:1086`), and its own header if a sentence describes them. `read-checks` must still round-trip (the existing cases prove it).

Then regenerate and restamp, never by hand:

```
scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh
scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

Docs in the same slice (the header is the source): `docs/scripts.md` (`checks-template.sh` block, and `redline-setup.sh`'s if its header moved), `docs/contract.md` (usage block, the output contract and its bullets, the kept result, Exit codes for `--verdict`, Snapshot files for `round_sha`, the template version paragraph: v3 since #68), `docs/upgrading.md` (a `checks-template.sh` v3 section: what a rerun writes, that a v2 `checks.sh` keeps working and can still spill, that it has no `--verdict`).

### Task 3: The workflow, the checker, the loop test (slice B)

`tests/loop-test.mjs` first, red. The checker mock gains a branch for a label ending ` verdict` (it must not shift `commitIds`).

- `snapshot r1` carries `round_sha` equal to the start sha; `snapshot r2` carries round 1's newest commit.
- Resumed attempt (rider 3): after an error at `recheck r1` and a relaunch, `snapshot r1` is byte-identical with the same `round_sha`, the failed attempt's commits are in the round's commits, and one of them without the `redline:` prefix still fails the round.
- Spilled, verdict passes: `check r1` then `check r1 verdict`, the run finishes, one warning names the spill and the verdict.
- Spilled, verdict fails: the repair pass runs, its prompt names the failing checks and says the output was not relayed.
- Spilled, verdict exit 2: stops at `check` as today, the error carries both causes, `resumeFrom` names `check r1` (never the verdict label), and the relaunch reruns the check and the verdict.
- Baseline spilled: `baseline verdict` is asked with `--verdict --baseline`.
- Long gate: the verdict command is the foreground `checks.sh --verdict`, never `redline-background.sh`.
- The existing spilled cases (`:792`, `:810`, `:815`) become the exit 2 path.

Then `workflows/redline-loop.js`:

- `revise()` near `:3109`: `round_sha` in the snapshot, from `commitsAll`'s last sha or `startSha`.
- `CHECKER_SCHEMA` (`:813`): `verdict`, `kept`, `truncated`, `round_sha`, `allowed_count`, `changed_count`, `commits_count`, `formatter_touched_count`; the v2 keys stay optional.
- `checker()` (`:2913`): on `result_unreadable` with `spilled`, one more checker call, label `<label> verdict`, with the verdict command; a read, gate-shaped answer replaces the result and records a warning; anything else keeps the spilled result with the verdict's error added. The verdict prompt carries the attempt number when the check's label is being resumed, so a relaunch never replays a cached verdict.
- `stopReason()` (`:2099`): the spilled cause says the verdict was asked and why it gave nothing, and names `/redline:setup` for a `checks.sh` older than v3.
- The two `stageError('check', ...)` sites pass the check's own label.
- The repair text gains one sentence when the result came from a verdict.

`agents/redline-checker.md`: the third shape (a verdict command line, run once, same reading rules), the new result example, and that `spilled` is now followed by the workflow's verdict call.

Docs in the same slice: `docs/contract.md` (the Exit codes paragraph on `spilled`), `docs/running.md` (Rounds, step 5).

### Task 4: Guard cases (slice C, tests only)

`tests/guard-cases.tsv`, under a comment naming #68, pinning the two decisions the fallback rests on; `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.

- `redline:redline-checker  allow  REPO/.claude/redline/checks.sh --verdict REPO/agent-os/specs/x/redline/snapshot.json`
- `redline:redline-checker  deny   cat /tmp/redline-checks/abc.json`

`tests/guard-test.sh` goes from 594 to 596 passed. If either row mismatches, I stop and ask before anything else.

### Task 5: Verification Gate

`.claude/redline/checks.sh --baseline` until it exits 0 (the regenerated script, so its own output is the first real reading of the new shape), then:

- **Docs (step 10).** `scripts/checks-template.sh`: `docs/scripts.md` "checks-template.sh" and `docs/contract.md` "checks.json → checks.sh", slice A. `scripts/redline-setup.sh`: `docs/scripts.md` "redline-setup.sh" when its header moved, else no reader-facing change (only the generated header's text, which `docs/contract.md` describes). `workflows/redline-loop.js`: `docs/contract.md` "Exit codes" and `docs/running.md` "Rounds", slice B. `agents/redline-checker.md`: `docs/contract.md` "Exit codes", slice B. New flag `--verdict`, new snapshot key `round_sha`, new exit 2 cases: `docs/contract.md`, slice A. `docs/upgrading.md`: the v3 section, slice A.
- **Version (step 11).** Stays 0.3.0 on purpose (same pull request, already a minor bump over main's 0.2.4); recorded in `shape.md`. The marker goes v2 to v3.
- **Standards retrospective (step 12).** Proposed with AskUserQuestion when the build is done, applied in its own commit. Expected candidates: `scripts/bash-conventions.md` (the "whole JSON stays bounded" line gains the pull request's size and the run's length, the kept result and `--verdict`), `testing/tests.md` (a budget is pinned by a synthetic run of the generated file; a rescue is pinned by a mutated template), `workflow/replay.md` (a fallback call carries the attempt so a relaunch does not replay it).
- **Spec folder (step 13).** `plan.md` gets As built.

### Commits, in order

1. The spec folder.
2. Slice A: `scripts/checks-template.sh`, `scripts/redline-setup.sh`, `.claude/redline/checks.sh`, `tests/setup-test.sh`, `docs/scripts.md`, `docs/contract.md`, `docs/upgrading.md`.
3. Slice B: `workflows/redline-loop.js`, `agents/redline-checker.md`, `tests/loop-test.mjs`, `docs/contract.md`, `docs/running.md`.
4. Slice C: `tests/guard-cases.tsv`.
5. The standards edits, if any are approved.
6. The spec folder's As built.

## Verification

- `tests/setup-test.sh`: red after the new cases, green after the template; the two budget cases print their byte counts.
- `node tests/loop-test.mjs`: red after the new checks, green after the workflow.
- `tests/guard-test.sh`: 596 passed, 0 mismatched.
- `.claude/redline/checks.sh --baseline`, then by hand `.claude/redline/checks.sh --git-only agent-os/specs/2026-11-14-1509-94-review-round-5/redline/snapshot.json`: 14.7 KB today, expected under 1 KB plus the listed commits; then `--verdict --git-only` on the same snapshot.
- The real proof is the next Redline round on PR #94, which is yours to run.

## Separately: why rounds 4 and 5 placed nothing inline (reported, nothing planned)

**It is ours, not GitHub refusing the diff.**

- The record: `round-4-review.json` holds 12 comments (11 on `workflows/redline-loop.js`, 1 on `skills/redline-revise/SKILL.md:19`), `round-5-review.json` holds 10, all on `workflows/redline-loop.js`. The posted reviews (5907024107, 5907342043) carry no inline comment; their bodies are 26,267 and 15,950 characters against 5,524 and 4,180 in the files, the difference being "Not placed inline".
- The cause: `post-review` runs `place_comments` (`scripts/redline-gh.sh:215`), which takes a file's hunks only from the `patch` field of GitHub's pull-request files listing. That listing returns no `patch` for `workflows/redline-loop.js` (958 changed lines, 152 KB of diff) or `tests/loop-test.mjs` (921 lines, 252 KB). Every other of the 133 files has one, up to 101 KB, including `tests/setup-test.sh`, listed after `loop-test.mjs`, so it is a per-file omission, not the pull request's total.
- GitHub has the hunks: `gh pr diff 94` returns all 133 files, with 82 hunks for `redline-loop.js` and 47 for `loop-test.mjs`. `place` never looks there, because the whole-diff endpoint refuses a pull request over 300 files (the comment at `scripts/redline-gh.sh:156`).
- It is not new in rounds 4 and 5. Rounds 1 to 3 moved 16 of 16, 14 of 14 and 8 of 8 of their `redline-loop.js` comments into the body too. The only inline comments this pull request ever got are the five on other files (four in round 1, one in round 2). Rounds 4 and 5 had no finding outside that file, except R4-1, on a file the pull request does not change, which GitHub rightly cannot anchor.
- The replies followed by design: no inline comment, so no thread, so a pull-request comment quoting the marker.
- Not verified: that GitHub accepts a review comment on those lines. Redline never sent one, and proving it takes one post, which I did not make. That GitHub serves the hunks makes it likely.
- Known and untracked: `README.md:105` lists it under Known limits ("A file whose patch GitHub omits anchors nothing"), written for lockfiles and built assets; no open issue covers it. PRs 80 to 92 had no such file, so #94 is the first where the omitted file is the one under review.
- A fix would read a patchless file's hunks from the whole-PR diff when GitHub serves it, or from the local `git diff` of the merge base. That is a follow-up issue for the author to open.

## As built

Built 2026-11-15, one slice per commit, each commit made by the author.

**The gate.** `.claude/redline/checks.sh --baseline` exits 0 at `81ca5d3` with all nine checks green: guard 596 passed, 0 mismatched; loop 938 checks passed, 0 failed (899 before this spec); prefs 121; gate 117; setup 506 (474 before); gh 136; background 39. `claude plugin validate .` passes with the known icon warning. `scripts/redline-gate.sh check .` reports a match, since the gate's backticked text did not move, and `scripts/redline-setup.sh version .` reports `checks.sh` at template v3. That baseline run is itself the first real reading of the new shape: 603 bytes of stdout and 471 of stderr, 1,074 together, where the same nine passing checks were 14.3 KB.

**The slices, red then green.**

| Commit | Slice | Harness, red then green |
| --- | --- | --- |
| `dee9bbb` | Task 1, the spec folder | none (documents) |
| `24e0569` | Task 2, slice A: the template, the generator's header, this repository's `checks.sh`, their docs | `tests/setup-test.sh`: 474 passed, 32 failed; then 506 passed, 0 failed |
| `83597db` | Task 3, slice B: the workflow, the checker's agent file, their docs | `node tests/loop-test.mjs`: 910 passed, 22 failed; then 938 passed, 0 failed |
| `0736fa7` | Task 4, slice C: the guard cases | `tests/guard-test.sh`: 596 passed, 0 mismatched. No red run: the two rows pin decisions of the guard as it stands, and the guard did not change |
| `81ca5d3` | Task 5, the standards retrospective | none reads the standards |

**Measured.** The two budget cases in `tests/setup-test.sh` print what they measure: 8,671 bytes for the passing result (300 files, 100 commits since the start, 40 in the round, twelve checks), 8,671 again at 600 files and 200 commits, and 16,028 with all twelve checks failing. Against PR #94's own round 5 snapshot, `checks.sh --git-only` prints 4.6 KB where the v2 script printed 14.7 KB; that snapshot was written before `round_sha` existed, so all 26 commits are listed.

**Deviations from the plan above.** Each is recorded under Decisions in `shape.md`, with its reason: the implementer's agent file follows a key that is no longer printed; the budget's two figures moved by a few bytes; the kept file also holds the printed object; `--verdict` refuses another snapshot as well as another mode; a run that cannot write the temp directory still prints; the workflow hands the label back in one place instead of two; a verdict that cannot be read either is its own message; and the loop test's mock lists commits from `round_sha`.

### Docs (gate step 10)

| File | Section | Commit |
| --- | --- | --- |
| `scripts/checks-template.sh` | `docs/scripts.md`, "checks-template.sh" (its header, verbatim); `docs/contract.md`, "Usage", "Output contract" (the result, the budget, the kept result, `--verdict`), "Exit code", "Template version", "Snapshot file"; `docs/upgrading.md`, "The checks template, v3 (#68)" | `24e0569` |
| `scripts/redline-setup.sh` | no reader-facing change of its own: its header comment did not move, and the text it writes into a generated `checks.sh` (the usage line, the snapshot line, the two sentences on the result's size) is what `docs/contract.md` describes | `24e0569` |
| `.claude/redline/checks.sh` | regenerated from `checks.json` and restamped by the scripts; `docs/contract.md`, "Output contract" | `24e0569` |
| `agents/redline-implementer.md` | `docs/contract.md`, "Output contract" (the formatter's files appear under `git.uncommitted`; `changed_files` is no longer printed) | `24e0569` |
| `workflows/redline-loop.js` | `docs/contract.md`, "Exit code" (the verdict call, the warning, the stop and its resume label) and "Snapshot file" (`round_sha`); `docs/running.md`, "Rounds", step 5 | `83597db`, `24e0569` |
| `agents/redline-checker.md` | `docs/contract.md`, "Exit code"; `docs/running.md`, "Rounds", step 5 | `83597db` |

New flag `--verdict`, new snapshot key `round_sha`, new exit 2 cases (a `round_sha` that is no commit, a `--verdict` with nothing kept for this commit, mode and snapshot): `docs/contract.md`, `24e0569`. No new config key, subcommand or allow rule: the guard already let the checker run the repository's `checks.sh` with any flag, which `0736fa7` pins.

### Version (gate step 11)

0.3.0 in `.claude-plugin/plugin.json` and in the marketplace entry, unchanged on purpose: this is the same pull request as #93, which already made the minor bump over main's 0.2.4 that a template change calls for. The template marker moved, `# redline-template: checks-template.sh v3` (`24e0569`), so a launch on a repository still at v2 warns and names the rerun.

### Standards retrospective (gate step 12)

Ten edits, approved by the author and applied in their own commit, `81ca5d3`. The list is under "Standards retrospective" in `shape.md`.

### Left to the author

- The next Redline round on PR #94, which is the real proof: its checker runs the v3 script against a snapshot that carries `round_sha`.
- A `/redline:setup` rerun in Losers League and Chalkboard to carry template v3.
- The follow-up issue on inline placement for a file whose patch the files listing omits ("Separately", above).
- The tag and the `CHANGELOG.md` entry after the merge; a line under Setup and templates says a rerun regenerates `checks.sh`.
