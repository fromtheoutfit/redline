# References for PR #120 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `47952b1`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/shape.md`: decision 3 (19), decision 14 (39-41), decisions 18 and 19 (50-51), "The table" (63-145), "The line, as built" (147-159), "Left alone" and "For you to open" (161-186); its `plan.md` As built counts (188-192).
- **Relevance:** R1-1 is answered from decision 3 ("If the table shows one can, stop and tell me") and the measurement of one launch (126-135); R1-3 from decision 14 (the spec check carries no field); R1-2's clause is the "a reshape | false" row of "The line, as built"; drafted issue 1 covers R1-3's resolve half.

### The resume line and the field (#116, #117)

- **Location:** `workflows/redline-loop.js`: `stageError` and `checkError` (651-668), `resumeLine` and its comment (670-730), `args.resume` intake (277-291), the error result (5462-5477); `skills/redline/SKILL.md`, the marker keys and the resume entry (49, 52) and the error report (272); `docs/running.md`, "A reshape after your decision" (127) and "Run markers and resume" (206-208); `docs/upgrading.md`, "A stopped run across 0.4.5" (37-41); `agents/redline-shaper.md`, rule 9 (32), and its diff against `main`.
- **Relevance:** R1-2's clause and its three restatements; R1-4's comments; R1-3's path from `checkError` to the skill's "nothing needs fixing by hand".

### The shaper's checks and the spec check (#57; #94, R2-9, R8-5)

- **Location:** `workflows/redline-loop.js`: `checkDispositions` (3235-3288), `checkSecondLook` (3290-3308), `checkCalls` (3310-3332), `checkWhy` (3334-3349), `checkDeclineReasons` (3351-3371), `checkDrafts` (3378-3392), `checkSpec` and its comment (3394-3427), `vetShape` and its comment (3807-3843), `revise()`'s first shape (3846-3854), the approve loop, the reshape and the hold (4225-4310); `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/plan.md` (59-60, 151); `agent-os/specs/2026-11-14-1509-94-review-round-4/shape.md` (37, 63).
- **Relevance:** R1-3's order and label fix, modelled on the checks that already name the shaper's label after the spec-status call; the #57 reason for the old order; the #94 round 4 reason the spec check's diagnosis comes first.
- **Key patterns:** a check after another agent's call names the shaper's label itself (`shaperLabel`), never `lastLabel`.

### The reshape prompt (#106; #114, R1-3, R2-6)

- **Location:** `workflows/redline-loop.js`, `reshapePrompt` (2191-2226) and `maxPlanAdjustments` (111).
- **Relevance:** R1-2's evidence: "Apply each adjustment" and the decided block's "as plan.md holds it when you are done".

### The revise-only entry point

- **Location:** `skills/redline-revise/SKILL.md` (steps 2 to 6, 14-29); `workflows/redline-loop.js`, `specFolderFor` (448) and the revise-only branch (5274-5299).
- **Relevance:** R1-1: the folder a revise-only pass shapes in can be an earlier run's.

## Code read

- `tests/loop-test.mjs`: the mocks (95-125, 194-263), `OWN_CHECKS`, `RESUME_WORDS` and `go()` (380-468), `labels`, `pick` and `samePrefix` (470-508), the human-pass stops (1329-1331, 2698-2707), the resume block (1600-1700), the spec-check section (1779-1860), the docs phrase list (3086-3106), the reshape helpers and cases (3501-3580, 3684-3775).
- `agent-os/standards/`: `index.yml`, and the files `standards.md` copies.
- `.claude/commands/agent-os/shape-spec.md` (whole), `README.md` ("Git rules for Redline agents", Known limits 115 and 125), `docs/guard.md` (174-178), `docs/running.md` (150-155), `.claude-plugin/plugin.json`.
- Issues and comments: the open list through `scripts/redline-gh.sh issues-search` (`redline-revise`, `revise-only`, `vetShape`, `spec check`, `resume`); the PR's comments through `scripts/redline-gh.sh pr-comments 120`.
- Git: `git log main..HEAD`, `git diff main...HEAD -- agents/redline-shaper.md docs/running.md agent-os/standards/workflow/replay.md`, `git log -S` for the `vetShape` order.
