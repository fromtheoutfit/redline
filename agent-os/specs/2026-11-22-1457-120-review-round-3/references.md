# References for PR #120 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `bf12327`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/shape.md`: "Every label a run can resume at" (80-99, the `spec status <tag>[ #k]` row at 92), "The line, as built" (150-160, the restore clause at 156).
- **Relevance:** R3-1 is answered from the table's `spec status` row (the check's own failure resumes at the check); R3-5 from "The line, as built", which records the restore clause's words with no reason given for its opening; R3-6 from the same row (#57's label rule).

### Rounds 1 and 2 of this review

- **Location:** `agent-os/specs/2026-11-22-1457-120-review-round-1/shape.md`, Decision 2 (44) and the proportionality note on R1-3 (63); `agent-os/specs/2026-11-22-1457-120-review-round-2/shape.md`, answer 6 (28) and Decision 3 (49); `agent-os/specs/2026-11-22-1457-120-review-round-2/plan.md`, Task 2 ("The mutation, never committed") and As built.
- **Relevance:** R3-6 is a cost of R1-3's order, which round 1 chose and weighed without the spec-status call's own failure; R3-4 is a slip in round 2's R2-3 commit (`07a7316`); R3-3's red run uses round 2's in-place mutation door; the plan layout, the anchors by text and the base count (1670) are round 2's.

### An in-place mutation in a Redline round

- **Location:** `agent-os/specs/2026-11-20-2144-114-review-round-1/plan.md`, Task 7, as round 2's `references.md` cites it, and round 2's Task 2, read here.
- **Relevance:** R3-3's pin holds before the change; this is how a Redline round sees such a pin red without an interpreter: the line changed in place, the gate run, the line put back, `git diff` showing nothing.
- **Key patterns:** the mutation's text given exactly, occurring once; the red run's failing check names recorded under As built; the mutation made while the file matches HEAD.

### The resume line and its clauses (#116, #117)

- **Location:** `workflows/redline-loop.js`: the `args.resume` normalisation (280-293, the field at 291), `stageError` and `checkError` (651-668), `resumeLine` and its comment (670-747, the function from 680, the shaper's clauses at 713-720, the resolve's at 728-730), `run()` (749-756).
- **Relevance:** R3-3 (where `ownCheck` is read, and the mutation's anchor); R3-5 (the restore clause, 720).

### The spec check and the checks of the shaper's result (#57; #94, R2-9; #120, R1-3, R2-5)

- **Location:** `workflows/redline-loop.js`: `checkDrafts` (3395-3402), `checkSpec` and its comment (3404-3438: the status call at 3413-3415, its own failure at 3416-3418, the missing-file stop at 3422-3431), the comment above `vetShape` and `vetShape` itself (3818-3865).
- **Relevance:** R3-1 (the status failure's label); R3-5 (the stops the restore clause follows); R3-6 (the order R1-3 set, and where the new comment passage goes).

### The docs a person reads before a relaunch or an update

- **Location:** `docs/running.md`, "Run markers and resume" (206-208); `docs/upgrading.md`, "A stopped run across 0.4.5 (#116, #117)" (37-41) and "Unattended section versions (#15)" (31).
- **Relevance:** R3-1 and R3-6 change the first; R3-2 changes the second. Line 31's "where a resume reruns the shaper" is about the drafted-issue stop and is true.

## Code read

- `tests/loop-test.mjs`: the mock's spec-status reply and its scenario keys (100-115, 189), `OWN_CHECKS`, `RESUME_WORDS` and `go()` (380-450), section 13's resume cases (1590-1776), section 14's spec-check cases (1778-1860), the docs phrase list (3100-3122), the reshape resume cases and their constants (3690-3800).
- `agents/redline-shaper.md`, rule 9 (32): it does not repeat the restore clause's opening.
- `agent-os/standards/workflow/replay.md` (lines 17-22), `agent-os/standards/workflow/agents.md` (lines 17, 38, 46), `agent-os/standards/testing/tests.md` (lines 10-40), `agent-os/standards/process/docs-gate.md`, `process/standards-retrospective.md`, `process/release.md` and `prompts/attribution.md` (whole).
- `.claude/commands/agent-os/shape-spec.md` (whole), `agent-os/product/mission.md` (line 15).
- `/tmp/redlinerepro/reviewer-r3-repro.sh`: dated Nov 19, an earlier run's git pathspec probe, read, not run; unrelated to this round.
- Issues and comments: the open list through `scripts/redline-gh.sh issues-search` (`spec status`, `relaunch`, `ownCheck`, `upgrading`, `vetShape`, `restore`, `resume`); the PR's comments through `scripts/redline-gh.sh pr-comments 120`.
- Git: `git log main..HEAD`, `git show 07a7316 -- tests/loop-test.mjs`, `git show 96eb7aa:tests/loop-test.mjs`, `git show --stat 26ff100 bf12327`, and a search for the restore clause's opening outside the spec folders.
