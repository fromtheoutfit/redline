# PR #59 review round 2 — Shaping Notes

Shaped by Redline in unattended mode. Round 2 of PR #59 (issue #10), launch timestamp 2026-11-01-0935.

## Scope

The round's one finding, as the invoking prompt lists it:

- R2-1 the Finish comment resume clause asks for a URL `pr-comments` cannot give and leaves `posted` unset (`workflows/redline-loop.js:392`).

It is `fix`. Nothing is deferred and nothing is asked.

## Unattended answers

- **Scope.** The round's findings as the invoking prompt lists them. Evidence: the invoking prompt; the unattended section's point 6 in `.claude/commands/agent-os/shape-spec.md`.
- **Visuals.** None: a command-line plugin with no interface to mock.
- **References.** The file the finding names, its callers and its test, listed in `references.md`. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds only `reviewer-r1-marker.sh`, round 1's).
- **Product context.** `agent-os/product/mission.md`, "Decisions stay with people": nothing in this finding turns on a product or design decision; it is a prompt that asks an agent for a value the script it runs cannot print.
- **Standards.** `workflow/replay`, `workflow/agents`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution` (see `standards.md`).
- **Known-finding check.** `redline-gh.sh issues-search "pr-comments URL"` and `issues-search "handoffPosted"` find no open issue on it (the first returns only #2, "Phase 2: code host and issue tracker providers", unrelated). Round 1's `shape.md` (this PR's `agent-os/specs/2026-11-01-0935-59-review-round-1/shape.md`, Decisions, "R1-6 fix") is where the clause was shaped, with the same wording "post nothing, return that comment's URL and go on to Step 3"; it did not consider what `pr-comments` prints, so nothing there answers this finding.
- **R2-1, confirmed by running the script.** `scripts/redline-gh.sh` lines 261-264: `pr-comments` is `gh pr view "$1" --comments`. Run on #59 (`scripts/redline-gh.sh pr-comments 59`), it prints for each comment `author:`, `association:`, `edited:`, `status:`, `--`, the body, `--`, and no URL or id: `grep -c http` over its output prints `0`. The GitHub role may not call `gh` itself (`agents/redline-github.md`, Rules: "`gh` is refused by the guard"), so on that path it has no way to the URL the clause asks for. The clause (`workflows/redline-loop.js` line 392) says "post nothing, return that comment's URL" and says nothing about `posted`. The result reads `finished.posted` directly: `handoffPosted: finished.posted` (lines 2906, 2915, 2923, 2929, 2946), `capCommentPosted: finished.posted` (line 2935), `summaryPosted: finished.posted` (line 2812). `comment_url` is never read by the workflow (it appears only in `FINISH_SCHEMA`, lines 715 and 720), so an empty one costs nothing. The PR's own README sentence ("Launching": "A resume at the closing comment first looks for the comment an earlier attempt posted, ... so a request-review or a push that failed after them is retried without posting or committing twice") says the comment found is the posted one: a `done` result that says it was not posted disagrees with that. The code disagrees with the stated behaviour: that is the fix.

## Decisions

### R2-1 fix: the Finish comment clause sets posted true and an empty comment_url

In `resumeLine()` (`workflows/redline-loop.js`), the Finish comment clause becomes:

" Before Step 2, run `${GH} pr-comments ${pr}`: when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, set posted true and comment_url to "" (the script prints no comment URL), and go on to Step 3."

Only the words after "post nothing," change. The clause still rides on the resume line alone, so a first run's Finish prompts stay byte-identical, and the record commit clause is untouched. The loop test's `commentClause` constant changes with it (red first), its Finish mock takes the `comment_url` from the scenario so the resumed relaunch can answer as the real agent now would (`posted: true`, `comment_url: ""`, per `testing/tests`: "A loop-test mock answers as the real agent would for the run's settings"), and one check asserts that relaunch's result carries `handoffPosted: true`.

The reviewer's alternative wording ("set posted true and comment_url to \"\"") is taken as proposed; the parenthesis saying why the URL is empty is added so the agent does not treat the empty field as a failure and set `error`, the second failure mode the finding names.

- Likelihood and impact: reached only on a resume at `handoff comment`, `cap-hit comment` or `summary comment` after an earlier attempt posted the comment and then failed (a review request GitHub refused). Uncommon, but it is the case the clause exists for. When it fires, the `done` result says the handoff comment was not posted although it is on the PR, and the skill reports that to the person; or the agent sets `error` on the missing URL and the resume stops at the same label again, so the run can never finish by resuming.
- Cost: one line in `workflows/redline-loop.js`, one constant, one mock field and one check in `tests/loop-test.mjs`. Both files are in the PR's diff. No new dependency, abstraction or subcommand; no README change (see the plan's Docs entry).

Decided by: redline

## Context

- **Visuals:** None
- **References:** `workflows/redline-loop.js` (`resumeLine()`, `finishPrompt()`, `finish()`, the `done` and `capped` results), `scripts/redline-gh.sh` (`pr-comments`), `agents/redline-github.md` (the `comment` operation and the output shape), `tests/loop-test.mjs` (the Finish mock and the R1-6 resume checks), README "Launching". See `references.md`.
- **Product alignment:** N/A beyond the mission's "Decisions stay with people", which this finding does not touch.

## Standards Applied

- workflow/replay — the clause stays on the resume line only, so a first run's prompts are byte-identical
- workflow/agents — a duplicate check over `pr-comments` reads only what that command prints (the bullet on checks that something was already posted); the agent's `posted` must match what is on the PR
- testing/tests — the loop test pins the new clause, red before green, and its mock answers as the real agent would on the resumed path
- process/docs-gate — the plan names the README section for the `workflows/redline-loop.js` change, or why there is no reader-facing change
- process/standards-retrospective — the proposed edits below
- prompts/attribution — the spec folder, the prompt clause and the commit carry no model or vendor name

## Standards retrospective (proposed)

Proposed at shaping; the standards approver approves the list and the implementer applies it in its own commit.

1. `agent-os/standards/workflow/agents.md`, the bullet "A check that something was already posted looks for text only that post carries. ..." (line 22): append "; and it prints no URL or id, so a prompt whose duplicate check finds the post asks the agent to report it posted (`posted` true) with an empty `comment_url`, never for a field the script cannot give: a request for one leaves the agent to report the post missing or set `error` (#59, R2-1)".
2. `agent-os/standards/testing/tests.md`, the `node tests/loop-test.mjs` bullet (line 6), its last sentence ("Its resume scenario proves ..."): after "a shape-stage rerun," insert "a Finish comment resume that finds its comment already posted and reports it posted (#59, R2-1),".

If the approver declines both, `shape.md` records "Standards retrospective: no changes" under Decisions.
