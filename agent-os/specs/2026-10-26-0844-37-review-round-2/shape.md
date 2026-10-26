# PR #37 review round 2 (launch 2026-10-26-0844) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 2 on PR #37 (issue #9: a checker result the implementer cannot change stops the run instead of starting a repair pass). The round reviewed only the round 1 fix diff (`71c2e17..8ddffc7`, `redline/round-2-review.json`) and found no correctness bug, so this is the final nit round. Nothing else is in scope.

- **R2-1** (nit): since R1-3, `judge()` turns checker text into a warning on any round that passes, including one whose gate exited 1 with only baseline failures, but the warning still says `on a passing gate`. Planned as a **fix**.

## Unattended answers

- **What are we building?** A wording change to one warning string in `judge()` (`workflows/redline-loop.js:1013`) and the two loop-test assertions that pin that string (`tests/loop-test.mjs:465` and `:472`). No new file, no new case, no new dependency.
  Decided by: redline
- **Visuals?** None; a workflow string and two test assertions.
  Decided by: redline
- **References?** `judge()` and its caller in the check loop in `workflows/redline-loop.js`, loop-test section 9, the round 1 spec for PR #37 (`agent-os/specs/2026-10-26-0844-37-review-round-1/`), `README.md:226`, `agent-os/standards/workflow/agents.md:15`. See `references.md`.
  Decided by: redline
- **Product context?** `agent-os/product/mission.md` asks that nothing an agent does is hidden from the person and that Redline is honest about its reach (both cited in the round 1 shape). A warning that contradicts the line beside it in the same `warnings` list works against both. Nothing on the roadmap bears on the wording.
  Decided by: redline
- **Standards?** `workflow/agents.md`, `testing/tests.md`, `process/standards-retrospective.md`, `prompts/attribution.md`. See `standards.md`. `workflow/replay.md` does not bind: the warning is built after the checker returns, not part of any prompt before a stopping point.
  Decided by: redline
- **Already tracked?** No. `redline-gh.sh issues-search "passing gate"` and `issues-search "checker warning"` return only #9 (this PR's own issue) and #17 (CI on every push, unrelated). `redline-gh.sh pr-comments 37` holds the round 1 and round 2 reviews only; round 1's findings (R1-1 to R1-3) do not name the warning text. The PR's only earlier review-round folder, `agent-os/specs/2026-10-26-0844-37-review-round-1/` (on `HEAD`, `git ls-tree -d --name-only HEAD agent-os/specs/`), wrote the string itself in its Task 4 step 2 and asserted it in Task 4 step 1, and its Task 4 step 1 note says "the warning string is unchanged": the wording was carried over from the #9 code, not decided. No finding carries `knownAs`.
  Decided by: redline
- **R2-1: is the finding real?** Confirmed by reading. `judge()` (`workflows/redline-loop.js:968-1015`) moves the `checks.sh exited` fallback above the text block and skips it when `preExisting` is non-empty (line 1003). A round whose full check returns `exit: 1`, `ok: false` and only the baseline's failing `guard` therefore has empty `reasons`, so non-empty checker text takes the `else if (said)` branch at line 1012 and pushes `the checker reported "..." on a passing gate` (line 1013). The check loop prefixes it with `round N:` (line 1454) and, after the round passes, adds `round N: guard still failing, as at baseline` (line 1471). The section 9 scenario `checker: baseline failure with text` asserts both strings together (`tests/loop-test.mjs:472`). The gate in that scenario exited 1, so "passing gate" is wrong about it.
  Decided by: redline
- **R2-1: which words replace "on a passing gate"?** The evidence answers it. The person's R1-3 decision (round 1 `shape.md`, Decisions): "text is carried as a warning or as detail on a failure the data already established". `README.md:226`: "it is a warning in the run's `warnings` on a round that passes, a round whose only failing checks were failing at baseline included". `agent-os/standards/workflow/agents.md:15`: "the text is a warning on a round that passes (a round whose only failing checks were failing at baseline included)". The reviewer offered "on a round that passes" or "on a passing round"; the first is the phrase both documents already use, so the warning reads `the checker reported "<text>" on a round that passes`.
  Decided by: redline
- **R2-1: what else says "passing gate", and does it change?** `grep -rn "passing gate" workflows tests agents README.md agent-os/standards` prints five lines. Only the warning string (`workflows/redline-loop.js:1013`) and the two assertions that match it (`tests/loop-test.mjs:465`, `:472`) change. The rest stay, because each is true of what it describes: the comment at `workflows/redline-loop.js:931` records that #34 round 2 failed a passing gate (it did: `exit` 0, `ok` true); the check name at `tests/loop-test.mjs:465` ("text on a passing gate is a warning, not a reason") names a scenario whose gate does pass (`exit` 0, `ok` true); the section 9 header comment (`tests/loop-test.mjs:448-449`) says a stray `error` on a passing gate is a warning at most, which still holds; and `agents/redline-checker.md:44` tells the checker that on a passing gate its text is at most a warning, also still true, and the checker does not see the baseline in any case.
  Decided by: redline
- **R2-1: does the fix need a new loop check?** No. `testing/tests.md:14` asks a change to a tested surface to add a case; here the two existing section 9 cases already cover both paths that emit the warning (a gate that passes, and a round that passes on baseline failures) and pin its exact text, so changing their expected string is the case. The neighbour that must not change, `checker: ok true, error '""'` (no warning at all, `tests/loop-test.mjs:463`), and `checker: a new failure with text ...` (text as detail on a failure, `:474`) stay as they are and must still pass.
  Decided by: redline

## Decisions

- **R2-1 · fix.** `workflows/redline-loop.js:1013` becomes `` warnings.push(`the checker reported "${said.slice(0, 200)}" on a round that passes`) ``. The two section 9 assertions that match the old string (`tests/loop-test.mjs:465` and `:472`) expect `... on a round that passes`, changed first so they go red. Likelihood and impact: the warning fires only when the checker writes text on a round that passes. On a round whose gate exited 1 with only baseline failures it sits next to "still failing, as at baseline" and the two read as contradictory, which can send the person to look for a gate failure that was accepted by design. Nothing about the verdict changes. Cost: one string in one file and two assertion strings in another, both in the PR's diff, no new helper, no new case. Proportionate.
  Decided by: redline

## Deferred

None.

## Standards retrospective (proposed)

1. **R2-1**: missing from `agent-os/standards/workflow/agents.md`. R1-3 widened the condition under which the checker-text warning fires (it now includes a round whose gate exited 1 with only baseline failures) and kept the message's words, which described the old condition. The rule the words should have followed is already stated at `agent-os/standards/workflow/agents.md:15` ("a warning on a round that passes"); what is missing is that a message moves with its condition. Proposed new bullet after the bullet at line 11 ("A message the run shows the person names a plugin file by its absolute path from `pluginRoot`, ..."): "A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)".

If the approver declines item 1, record "Standards retrospective: no changes" under Decisions instead.

## Context

- **Visuals:** None
- **References:** `workflows/redline-loop.js` (`errorText()` 929-935, `judge()` 968-1015, the check loop 1445-1471), `tests/loop-test.mjs` (`go()` and its record-commit check 136-156, section 9 446-475), `README.md:226`, `agent-os/standards/workflow/agents.md:11` and `:15`, `agents/redline-checker.md:44`, the round 1 spec for PR #37
- **Product alignment:** `agent-os/product/mission.md`, as cited in the round 1 shape; nothing on the roadmap beyond this PR

## Standards Applied

- workflow/agents — the workflow reads fields, never text; the checker's `error` is text, a warning on a round that passes; messages the run shows the person
- testing/tests — a tested surface changes with its case; red before green; the neighbouring decision that must not change
- process/standards-retrospective — the proposed edit above
- prompts/attribution — the commit, the message and this folder carry no model or vendor name
