# PR #43 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #43 (issue #42, "Normalize every agent's error field once, at parse time"). It is the final nit round: no correctness finding, one nit, and nothing else.

- **R1-1** (nit, low, confirmed, needs a decision): `errorText` is applied at each check of the GitHub agent's `error`, not once where agent results come in, as #42's title says. Returned as a **judgment call**, decided (A), normalize once as `run()` returns, on 2026-10-27 by @michaelfromtheoutfit (see Decisions).

## Unattended answers

- **Scope.** The one finding in the invoking prompt. Evidence: the prompt's findings JSON; `agent-os/specs/2026-10-27-0923-43-review-round-1/redline/round-1-findings.json` and `round-1-review.json`.
- **Visuals.** None; the change is the workflow script, its mock harness and prose.
- **References.** `workflows/redline-loop.js` lines 223-233, 248-254, 286-316, 443-455, 485-531, 1157-1253, 1341-1423, 1523-1543, 1636-1755, 1900-1965 and 2198-2203; `tests/loop-test.mjs` lines 1-140, 350-420 and 459-507; `README.md` (whole file, line 232 in particular); `agent-os/standards/workflow/agents.md` lines 16-17; `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/shape.md` line 17 and `plan.md` line 22. See `references.md`.
- **Product context.** `agent-os/product/` holds `mission.md`, `roadmap.md` and `tech-stack.md`; a search for the error field, `errorText`, #42 and "parse" finds nothing that bears on this finding.
- **Standards.** `workflow/agents` (the empty-text rule, lines 16-17), `testing/tests` (a tested surface gains a case; red before green; the loop-test mock scripts each agent's result shape), `workflow/replay` (Option A must not change a prompt), `process/standards-retrospective`, `prompts/attribution` (commit messages and this folder).
- **Already known?** `scripts/redline-gh.sh issues-search "errorText"` returns nothing; `issues-search "error field"` and `issues-search "parse time"` return only #42, the issue this PR closes. `redline-gh.sh pr-comments 43` shows only this round's review. `git ls-tree -d --name-only origin/bugfix/42-normalize-every-agents-error-field-once-at-parse-time agent-os/specs/` holds no earlier `-43-` review-round folder.
- **R1-1: is the finding real?** Yes, by reading.
  - `run()` (227-233) returns the agent's result as the model wrote it.
  - The PR wraps nine checks in `errorText()`, across eight operations (push-and-reply has two, at 1533 in `replyDropped` and 1792 in `revise`; the review says eight sites but lists nine lines).
  - The loop test scripts `'""'` at one of them: the PR description update (mock line 67, cases 356-359). The other scripted GitHub errors are real text: `postError` (409-415) and `recordError` (387-388). On real text, `if (x.error)` and `if (errorText(x))` agree. So reverting any of the other eight checks to a bare truthiness test leaves the suite green.
  - The guard refuses `node` to the shaper, so the harness was not run here. The reviewer wrote no reproduction (`/tmp/redlinerepro/` does not exist).
- **R1-1: does the PR description, the issue or the docblock settle "once in run()" against "at each check"?** No. The sources disagree with each other:
  - Issue #42's title, and the branch name, say "Normalize every agent's error field once, at parse time".
  - The PR's title says "with errorText", and its description says "Gather, post, push-and-reply, snapshot, the PR description update, the finish comment, the record status listing and the record commit now all go through errorText, as the other agents' error fields already did". That describes the per-site form and does not say why it differs from the issue.
  - The docblock the PR adds (1164-1166), "Every agent's error field goes through it, the GitHub agent's too", fits either form.
  - `README.md:232`, "The run's `detail.checker` keeps whatever the checker returned", is a documented contract that "once in run()" would narrow.
  - The issue's body cannot be read through the shaper's wrapper subcommands, so only its title is cited. With the issue and the PR saying different things, and a README contract at stake, the question goes to the person.
- **R1-1: would "once in run()" reach every agent?** Yes. Every `agent()` call is the one in `run()` (line 228): the GitHub agent's calls, the checker's (`checker()`, 1539-1543) and the approvers' (inside `parallel()`, 1638-1645). Only the GitHub agent's schemas and the checker's carry `error`: `GATHER_SCHEMA` 250, `POST_SCHEMA` 288, `FILE_OP_SCHEMA` 314, `CHECKER_SCHEMA` 445, `PUSH_REPLY_SCHEMA` 487, `UPDATE_SCHEMA` 509, `FINISH_SCHEMA` 515, `RECORD_SCHEMA` 529.
- **R1-1: would "once in run()" break replay?** No. It changes no prompt. A replayed result goes through `run()` again, and `errorText` gives the same text on text it already normalized.
- **R1-1: what is `detail.checker` kept for?** The #9 spec: "The run record keeps whatever the checker did get" (`agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/shape.md:17`). Its plan says the stop's `stageError` carries the checker's whole return (`plan.md:22`). The loop test asserts its `status`, `reason` and partial `result` (cases 488, 494, 496, 571), never its `error`. Normalizing `error` would leave those fields alone. This is an input to the person's decision, not an answer to it.

## Decisions

- **R1-1: Normalize the error once in `run()`, or keep `errorText` at each check?** Decided.
  - Option chosen: (A) Normalize once, as run() returns.
  - Notes: Normalize every agent's error field once, as run() returns it, so any later check can read .error safely; this is the fix #42 asked for and removes the failure instead of documenting it, and the only cost is that detail.checker keeps the normalized error, not the raw one.
  - Date: 2026-10-27.
  - The change is `plan.md` Task 2. The story, the options and the shaper's recommendation the person saw are under Judgment calls below. R1-1 is now a fix this round, which replaces the pending state the entry below describes; nothing is deferred.
  Decided by: @michaelfromtheoutfit

- **No fix or defer this round.** The round's only finding is a judgment call, so the plan carries no code change until it is decided, and nothing is deferred.
  Decided by: redline

- **As built: the standards commit names R1-1.** `plan.md` Task 2 sends part of R1-1's fix (the empty-text rule written for the checker only at `agent-os/standards/workflow/agents.md:17`, which the finding names) through Task 3, so the standards commit is `redline: record the round 1 review lessons in the standards, finishing R1-1 (#42)` and R1-1's reply names both of its commits. No code or file list changed.
  Decided by: redline

### Judgment calls

- **R1-1: Normalize the error once in `run()`, or keep `errorText` at each check?**
  - **The question.** Issue #42 asked for every agent's `error` to be normalized once, at parse time. The PR normalizes it at each of the nine places that read it instead. Should the loop clean the field once as each agent's result comes back (and say in the README that `detail.checker` then holds the cleaned text), or keep the per-check calls and write the rule down as a standard?
  - **Story.** Next month someone adds a GitHub step to the loop and writes `if (out.error)`, as every check read before this PR. On a good run the model answers `'""'` for "no error". The run stops at that step with an error that is empty to the eye, after a full round of review and fixes. That is how Losers League #790 stopped at Finish. The PR fixes the nine existing checks one at a time, and the loop test proves only the PR description one. Nothing would catch the new step, or a later edit that drops `errorText` from one of the other eight.
  - **Why it goes to the person.** A spec assumption. Issue #42's title says "once, at parse time". The PR title, description and docblock describe the per-check form and do not say why. And `README.md:232` promises that `detail.checker` keeps whatever the checker returned, which the issue's form would narrow.
  - **Options** (the chosen one, (A), is by file in `plan.md` Task 2):
    - **(A) Normalize once, as `run()` returns.**
      - Cost:
        - In `workflows/redline-loop.js`, a file the PR already changes, about 15 lines: `run()` returns a copy with `error` replaced by `errorText(out)`. `errorText` moves beside `run()`. The nine checks and the checker's two reads go back to `.error`.
        - In `tests/loop-test.mjs`: one mock line and three cases. A checker stop keeps `''` in `detail.checker` (red first). Post and push-and-reply each answer `'""'` and the run goes on.
        - Two phrases in `README.md:232` and one standards line.
        - No new dependency or abstraction, and no prompt changes.
      - Effect:
        - A new agent call can write `if (out.error)` safely.
        - `detail.checker.error`, the post warning and every stop message carry the trimmed, normalized text.
        - The README's "whatever the checker returned" is narrowed by that one field. Its status, reason and partial result are kept as #9 intended.
    - **(B) Keep the per-check calls and write the rule down.**
      - Cost:
        - In `workflows/redline-loop.js`, about 8 lines moved: `errorText` goes beside `run()` with a docblock naming the rule. No behaviour change.
        - In `tests/loop-test.mjs`: one mock line and the post and push-and-reply `'""'` cases. These are green today and pin two more of the nine checks.
        - One phrase in `README.md:232`.
        - One line in `agent-os/standards/workflow/agents.md` saying every check of an agent's `error` reads it through `errorText`.
      - Effect:
        - Today's behaviour stays, and so does `detail.checker`'s raw value.
        - The next new check is protected by a standard and by review, not by code.
        - Six of the nine checks still have no `'""'` case.
    - **(C) Accept as built.**
      - Cost: none. The reply says the per-check form is the chosen one.
      - Effect:
        - `errorText` stays under the checker's section, and the rule stays written for the checker only (`agents.md:17`, `README.md:232`).
        - One of the nine checks has a `'""'` case.
        - A new `if (out.error)` would repeat #790.
  - **Shaper's recommendation: (A).** It is what #42's title asked for, and it removes the failure rather than documenting it. It costs about what (B) costs, in the same files. What it gives up is the raw `'""'` in `detail.checker`, which tells nobody anything. The status, reason and partial result that #9 keeps the record for are untouched.

## Deferred

None.

## Proportionality

- **R1-1** (a nit; recorded for the options, not to choose one).
  - **Likelihood and visibility.** Not observed in the per-check form; the PR fixes every check that exists today. It fires when a new check is written as `if (out.error)`, or when a later change drops `errorText` from one of the eight checks the loop test does not script `'""'` at. When it fires, the run stops at that stage with an error that reads as empty, after a full round's work, and a relaunch replays to the same stop (the #790 shape).
  - **Cost.**
    - Options A and B: one file in the PR's diff (`workflows/redline-loop.js`, about 15 or 8 lines), `tests/loop-test.mjs` (in the diff; one mock line and two or three cases), one phrase or two in `README.md` and one standards line (both outside the diff).
    - Option C: nothing.
    - No option adds a dependency, a service or an abstraction, and none is out of proportion. What decides it is the issue's stated approach against the README's contract, which is why it goes to the person.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A; nothing in `agent-os/product/` bears on this finding.

## Standards Applied

- workflow/agents: the `error` rules this finding is about. Line 16: the GitHub agent's `error` is not taken on trust. Line 17: the checker's `""`, `''` and `null` are empty. Also: judgment calls are returned, never decided, and every decision names its owner.
- testing/tests: a tested surface gains a case in the same commit beside a neighbour that must not change; a bug fix lands red before green; the loop-test mock scripts each agent's result shape.
- workflow/replay: Option A changes no prompt, so a relaunch replays as before.
- process/standards-retrospective: gate step 10 for this round; both items are drafted from R1-1's decision (A).
- prompts/attribution: the commit messages in `plan.md` and this folder carry Redline's name only.

## Standards retrospective (proposed)

1. **Drafted for R1-1 (A)** (it was held for that decision): `agent-os/standards/workflow/agents.md`, lines 16-17 (the GitHub agent's `error` and the checker's empty-text clause, "`""`, `''` and `null` as its text are empty (#9; #34 round 2; #37, R1-3)").
   - Edit 1: a new bullet after line 16 (the "A degraded result is data, not an error" bullet):
     "- Every agent's `error` is normalized once, as `run()` returns the result: `""`, `''` and `null` are empty and the text is trimmed, so a call site reads `.error` as it is, and a new call cannot stop a run on `'""'` as Losers League #790 did at Finish. The run record's `detail.checker` keeps the normalized text, beside the status, reason and partial result #9 keeps it for (#42; #43, R1-1)"
   - Edit 2: in line 17 (line 18 once the new bullet is in), "`""`, `''` and `null` as its text are empty (#9; #34 round 2; #37, R1-3)" becomes "`""`, `''` and `null` as its text are empty, by the normalization in the bullet above (#9; #34 round 2; #37, R1-3)".
   - What the shaper drafted for (B) and (C) is not taken.
2. **Drafted for R1-1 (A)** (it was held for that decision): `agent-os/standards/testing/tests.md`, a new bullet after line 8, the loop-test result-shape bullet ("A loop-test scenario scripts the checker's result shape per call ..."):
   "- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1)"
3. `workflow/replay`, `process/standards-retrospective`, `prompts/attribution`, `process/internal-notes`: no changes.

Standards retrospective: items 1 and 2 are drafted from R1-1's decision (A) for the standards approver to judge. If the approver declines both, record "Standards retrospective: no changes" under Decisions instead.
