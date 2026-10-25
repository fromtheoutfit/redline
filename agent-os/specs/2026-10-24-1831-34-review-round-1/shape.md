# PR #34 review round 1 (launch 2026-10-24-1831) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The eight findings of Redline round 1 on PR #34 (large PRs, #33, and the round-numbering half of #10): three correctness (R1-1, R1-7, R1-8) and five nits (R1-2 to R1-6). Nothing else. Seven are planned as fixes; R1-8 was a judgment call returned to the person, who chose option A (2026-10-25), so it is planned as a fix too. No finding is deferred.

None of the fixes touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `scripts/checks-template.sh`, `scripts/redline-gate.sh` or the Verification Gate's text, so point 11 of the unattended section does not apply to any of them.

## Unattended answers

- **Step 1, what are we building?** The round's findings, as listed in the invoking prompt; scope as above.
- **Step 2, visuals.** None: a CLI plugin, and GitHub's rendering of the review body is the only screen.
- **Step 3, references.** The code each finding names, its callers and tests; see `references.md`.
- **Step 4, product context.** `agent-os/product/mission.md:5`: "nothing an agent does is hidden from the review thread", and line 17, "Honest about its reach". R1-1, R1-4 and R1-7 are about what reaches the PR thread and whether it is true; R1-8 is about a run that stops before any finding is acted on.
- **Step 5, standards.** scripts/bash-conventions, testing/tests, workflow/agents, workflow/replay, prompts/attribution, process/standards-retrospective (see `standards.md`). scripts/guard is not applied: no guard change, no new `redline-gh.sh` subcommand.
- **R1-2, how is a header printed?** Answered by the standard: `agent-os/standards/scripts/bash-conventions.md:19`, "A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)". Confirmed: `sed -n '2,34p' scripts/redline-gh.sh` ends at `#   post-review <n> <json-file> ...` (line 34), while the header runs to line 46 and line 47 is blank; `sed -n '2,/^$/p'` ends at line 46, `update`'s last line.
- **R1-5, does `git diff --shortstat` count what `--name-only` lists?** Yes, with the same rename detection: on this branch `git diff --shortstat 5f6e12b...HEAD` prints `29 files changed, 771 insertions(+), 95 deletions(-)`, and `git diff --name-only 5f6e12b...HEAD | wc -l` prints 29, the count in this round's `snapshot-start.json`. `Bash(git diff:*)` is in `templates/settings.allow.json:24` and `.claude/settings.json:15`, so the new spelling needs no rule.
- **R1-7, is "a review exists" knowable without asking GitHub inside the workflow?** Yes. The main loop has it in the post result (`posted.posted`, `posted.skipped`, `workflows/redline-loop.js:1662`). The revise skill already branches on it: `skills/redline-revise/SKILL.md:15`, "When the review was posted, run ... review-comments ... In a dry run, or when nothing was posted, leave it empty." It only has to pass that answer on, so the replay rule (`workflow/replay.md`: nothing inside the workflow asks GitHub for a value that changes) holds.
- **R1-7, what did comment_id 0 mean before this PR?** `git diff 5f6e12b HEAD -- workflows/redline-loop.js`, the old `pushReplyPrompt`: "A reply whose comment_id is 0 has no thread (its finding sits in the review body): write its file and do not call reply." The file-only route restores that for a run with no review on GitHub.
- **R1-8, does the PR or the original spec settle whether the loop overrides an agent's `error`?** No. The PR description says "A review with no inline thread, or with findings moved to the body, is a warning. The run continues into shape and fix." The original spec (`agent-os/specs/2026-10-24-1500-33-large-prs/shape.md`, Decisions) places that in "the GitHub agent's instructions and in the loop's `warnings`", and `agent-os/standards/workflow/agents.md` says `error` "is reserved for an operation that failed". Neither covers an agent that sets `error` on a posted review anyway, which is what it did on #778 (`references.md` of that spec: `posted: true`, `comments: []`, every finding in `movedToBody`, and an `error` string). Whether the loop second-guesses the agent's own `error` field is a new question, so it is returned as a judgment call (R1-8 under Decisions).
- **Already tracked?** `redline-gh.sh issues-search` for "redline-revise", "posted error", "marker" and "usage" finds #10 and #33 (this PR's own issues) and unrelated phase issues; none covers a finding here. `redline-gh.sh pr-comments 34` shows only this round's review. This PR has no earlier review-round folder.

## Decisions

- **R1-1 · fix.** `pr-comments` is `gh pr view --comments` (`scripts/redline-gh.sh:169`), which prints review bodies as well as issue comments (`README.md:279`), and `place_comments` writes `<!-- redline:<id> -->` into the round's own review body (`scripts/redline-gh.sh:139`). So the check `agents/redline-github.md:23` names ("check `redline-gh.sh pr-comments <pr>` for the marker when unsure") always succeeds and turns into a skipped reply, reported as `reply_id` 0 like a posted one. The check becomes the reply's second line, `**<id>** · ... · from the Redline round <n> review body`, which `replyEntry` writes (`workflows/redline-loop.js:545`) and the review body never carries. This keeps the original spec's decision that the reply's first line is the marker (`2026-10-24-1500-33-large-prs/shape.md`, "Body marker and issue-comment replies"); a second marker would change it.
  Proportionality: likely whenever the agent runs the check (a rerun of push-and-reply, or any agent that is "unsure"); when it fires, a finding's outcome never reaches the PR and nothing reports it. Cost: one sentence in `agents/redline-github.md`, one in `pushReplyPrompt`, the matching line in `README.md:303`, one loop-test check; all four files are in the PR's diff.
  Decided by: redline
- **R1-7 · fix.** `replyEntry` (`workflows/redline-loop.js:538-547`) and `pushReplyPrompt` (`:825`) treat every missing thread id as a body finding. In a dry run the post prompt returns `review.comments []` (`:620`), so every reply file is written in the marker form; in `/redline:redline-revise` over a review that was never posted, `revise.commentIds` is empty (`skills/redline-revise/SKILL.md:15`) and, with posting on, one PR comment per finding goes out quoting a marker and a review body that do not exist. The route now comes from whether a review is on GitHub: a thread id gives `thread`; no id and a posted (or already-posted) review gives `issue-comment` with the marker body; no review gives `file-only` with the plain body and no GitHub call, as before this PR. The revise skill passes `revise.posted` from `has-review`. The loop-test post mock answers a dry run as the real agent does, which is why the dry-run case did not catch this.
  Proportionality: low likelihood (the revise debug entry point after a dry-run or unposted review, and dry-run reply files), visible when it fires (spurious PR comments citing a review that is not there); a regression this PR introduced. Cost: `workflows/redline-loop.js` (about 15 lines), `agents/redline-github.md` (one sentence), `skills/redline-revise/SKILL.md` (two sentences, outside the PR's diff), `README.md:303`, `tests/loop-test.mjs` (the mock and two scenarios). No new dependency or abstraction beyond a `route` field on each reply.
  Decided by: redline
- **R1-8 · fix (decided: A. Continue on a consistent posted review): the #778 failure shape still ends the run at post.** `post()` throws on any non-empty `posted.error` (`workflows/redline-loop.js:1106-1107`) before the new warning branch. Only the agent's instructions (`agents/redline-github.md:22`, `postPrompt` at `:620`) keep the #778 shape (`posted: true`, `comments: []`, every finding in `movedToBody`, plus an `error`) from stopping the run again; no loop test feeds a posted review that carries an `error`. Trusting `posted: true` alone is not safe: `post-review` can exit non-zero after the POST succeeded (the comments fetch at `scripts/redline-gh.sh:245` runs under `set -e`). Then the review is on GitHub with no thread ids, and the agent has no `moved` list to report. Why a person: the original spec assumed the agent's instructions were enough, and whether the loop overrides the agent's own `error` field is a new question.
  Options, none implemented until the person picks:
  - **A. Continue on a consistent posted review.** In `post()`, when `posted.posted`, `posted.review.id > 0`, and every active finding is in `review.comments` or `review.movedToBody`, push the agent's `error` text as a warning and continue; otherwise throw as today. Loop-test: the #778 shape continues with the warning; `posted: true` with `id` 0, or with a finding in neither list, still throws.
  - **B. Keep stopping, deliberately.** No loop change; a loop-test case pins that the #778 shape with an `error` throws at post, and the PR description's "the run continues into shape and fix" gains "when the GitHub agent reports no error".
  - **C. Accept as is.** No change; rely on the agent's instructions.
  Recommendation: A.
  Chosen: **A. Continue on a consistent posted review.**
  The loop treats a posted review that carries an agent error as a warning and continues into shaping when the review has an id and every finding is inline or moved to the body, and still stops the run otherwise, so the #778 failure no longer ends the run at post while a partly failed post is still caught.
  Date: 2026-10-25
  Decided by: @michaelfromtheoutfit
- **R1-2 · fix.** `usage()` at `scripts/redline-gh.sh:50` becomes `sed -n '2,/^$/p' "$0" >&2; exit 2`, as the standard says; a gh-test case pins that `--help` prints the last write subcommand. Cost: one line and one case.
  Decided by: redline
- **R1-3 · fix.** `synthesize_diff` (`scripts/redline-gh.sh:97`) says "renamed, contents unchanged" for every patch-less rename. A rename with `changes` above 0 falls through to "(no patch: binary or too large for GitHub)". A rename with no line changes says "(no patch: renamed, no text changes)", not "contents unchanged": GitHub counts no lines for a binary file, so a renamed binary whose bytes changed also reports 0, and "no text changes" is true in both cases. Two patch-less renames join the fixture, one per message.
  Decided by: redline
- **R1-4 · fix.** The sentence comes from `reviewBody` (`workflows/redline-loop.js:485`), written before placement is known, so it is reworded there to cover both cases, rather than adding a second sentence in `place_comments`. One place, true whether or not anything moved. A loop-test check pins it.
  Decided by: redline
- **R1-5 · fix.** Precheck step 7 (`skills/redline/SKILL.md:82`) reads the count from `git diff --shortstat origin/<baseRefName>...HEAD` (`N files changed`; `1 file changed`; no output means 0) instead of counting `--name-only` lines by eye. This keeps the original spec's cross-check and changes only how the count is read.
  Decided by: redline
- **R1-6 · fix.** The `reviewBody` sentence (`workflows/redline-loop.js:470`) reads "Round 1 is already on this PR; this run starts at round 2." for `firstRound` 2 and "Rounds 1 to N are already on this PR; this run starts at round N+1." above that. It also stops saying how many runs posted them, which the workflow does not know. The loop-test check at `tests/loop-test.mjs:394` follows, and a `firstRound` 4 case pins the plural.
  Decided by: redline
- **One commit per finding, in task order.** The spec folder goes in the round's first commit or on its own. R1-1 lands before R1-7 because both edit `pushReplyPrompt` and the reply paragraph of `agents/redline-github.md`; R1-7 builds on R1-1's sentence.
  Decided by: redline

## Deferred

None.

## Standards retrospective (proposed)

1. **R1-1**, `agent-os/standards/workflow/agents.md`, after the last bullet: "- A check that something was already posted looks for text only that post carries. `redline-gh.sh pr-comments` prints review bodies and issue comments together, so a body finding's marker, which the review body also holds, proves nothing; the reply's own `from the Redline round N review body` line does (#34, R1-1)"
2. **R1-7**, `agent-os/standards/workflow/agents.md`, after item 1: "- A reply's route comes from whether a review is on GitHub, never from a missing thread id alone: a thread id replies in the thread, a body finding of a posted review gets an issue comment behind its marker, and a dry run or an unposted review writes the reply file and posts nothing (#34, R1-7)"
3. **R1-7**, `agent-os/standards/testing/tests.md`, after the `node tests/loop-test.mjs` bullet: "- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7)"
4. **R1-5**, `agent-os/standards/workflow/agents.md`, after item 2: "- A count a skill or prompt needs comes from a command that prints the number (`git diff --shortstat`, `jq length`), never from counting printed lines by eye (#34, R1-5)"
5. **R1-2, R1-3, R1-4, R1-6**: no changes. R1-2 broke `scripts/bash-conventions.md:19`, which already says it; R1-3, R1-4 and R1-6 are wording that taught no rule.
6. **R1-8** (decided A, 2026-10-25), `agent-os/standards/workflow/agents.md:13`, the "A degraded result is data" bullet: before its closing parenthesis, replace "and `error` is reserved for an operation that failed (#33: a review with every finding in the body ended the run at `post`)" with "and `error` is reserved for an operation that failed. The workflow does not take an agent's `error` on trust in either direction: an `error` on a review that is posted, has a review id and accounts for every finding (inline or in `movedToBody`) is recorded as a warning and the run continues, while one on a result that fails that check still stops the run (#33: a review with every finding in the body ended the run at `post`; #34, R1-8)"

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md` lines 5 and 17, as under Unattended answers.

## Standards Applied

- scripts/bash-conventions — R1-2 (`sed -n '2,/^$/p'`), R1-3 (`jq` builds every message)
- testing/tests — every task adds a case; red before green; the gh and loop harnesses run through the gate script
- workflow/agents — R1-1 and R1-7 change the GitHub agent's reply rule and the prompt that names it; R1-8 (decided A) applies the "degraded result is data" bullet in the loop itself
- workflow/replay — R1-7's `revise.posted` enters through args, read by the skill, never inside the workflow
- prompts/attribution — the reworded review body and reply lines carry no model or vendor name
- process/standards-retrospective — the proposed list above
