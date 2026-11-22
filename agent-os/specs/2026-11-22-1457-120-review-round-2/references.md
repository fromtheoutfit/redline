# References for PR #120 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `96eb7aa`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/shape.md`: decision 13 (38), decision 14 (39-41), "What reads the folder" (137-141), "The line, as built" (147-159), "Left alone" (161-168), "For you to open" (170-186).
- **Relevance:** R2-3 is answered from decision 14 (two clauses, by what each does) and "Left alone" (the ban's reason, which is the reshape prompt's); R2-4 from decision 14 ("The spec check does not carry the field"; the spec check is one site); R2-5 from "What reads the folder" (the spec check's two `git grep` lines). Its drafted issue 1 is adjacent to R2-3 and does not cover it.

### Round 1 of this review

- **Location:** `agent-os/specs/2026-11-22-1457-120-review-round-1/`: `shape.md` (Decisions 1, 2 and 4, Deferred), `plan.md` (Tasks 2, 3 and 5, As built), `redline/issue-R1-1.md` and `redline/round-1-deferred.json` (#121).
- **Relevance:** R2-1 is a gap in R1-3's tests (Task 3); R2-2 a gap in R1-1's mitigation (Task 5), whose claim #121's body repeats; the plan layout, the anchors by text and the counts (1665) are round 1's.

### An in-place mutation in a Redline round

- **Location:** `agent-os/specs/2026-11-20-2144-114-review-round-1/plan.md`, Task 7 ("The mutation, never committed") and its As built row.
- **Relevance:** R2-1's pin held before; this is how a Redline round has seen such a pin red without an interpreter: the line changed in place, the gate run, the line put back, `git diff` showing nothing.
- **Key patterns:** the mutation's text given exactly, occurring once; the red run's failing check names recorded under As built.

### The resume line and its clauses (#116, #117)

- **Location:** `workflows/redline-loop.js`: `stageError` and `checkError` (651-668), `resumeLine` and its comment (670-735), `run()` setting `lastLabel` (746-747), the error result (5477-5491); `agents/redline-shaper.md`, rule 9 (32); `docs/running.md`, "A reshape after your decision" (127) and "Run markers and resume" (208); `skills/redline/SKILL.md`, the resume opening (49), the Inline session paragraph (91) and the error report (272).
- **Relevance:** R2-3's clause and its four restatements; R2-5's path from `checkError` to "nothing needs fixing by hand", and the skill's existing warning about refused writes before a resume.

### The reshape prompt and the hold (#106; #114, R1-3, R2-6, R4-6)

- **Location:** `workflows/redline-loop.js`, `reshapePrompt` and its decided block (2196-2231), the approve loop, the reshape and the hold (4240-4322).
- **Relevance:** R2-3: the decided block names each decided id and its end, never the person's words, and the hold fires on a task, not on an entry.

### The shaper's checks and the spec check (#57; #94, R2-9, R8-5; #120, R1-3)

- **Location:** `workflows/redline-loop.js`: `checkDispositions` (3240-3294), `checkCalls` (3316-3339), `checkWhy` (3341-3356), `checkDeclineReasons` (3358-3378), `checkDrafts` (3385-3399), `checkSpec` and its comment (3401-3435), `vetShape` and its comment (3815-3857), `revise()`'s first shape (3860-3868).
- **Relevance:** R2-1's throw and label; R2-4's heading test inside the spec check; R2-5's existence test and the order R1-3 set.

### The record commit and the spec commit

- **Location:** `workflows/redline-loop.js`, `commitRecord` (5104-5131); `docs/running.md` (212); `agents/redline-implementer.md`, "How you work", item 2; `skills/redline-revise/SKILL.md` (15, 26).
- **Relevance:** R2-2: the record commit stages only `redline/`; the spec commit is made at the implement step; a revise-only pass accepts uncommitted files in its folder.

## Code read

- `tests/loop-test.mjs`: `OWN_CHECKS`, `RESUME_WORDS` and `go()` (380-459), the human-pass checks (1260-1331, 2708-2725), the docs phrase list (3100-3125), the reshape resume cases and their constants (3690-3797).
- `/tmp/redlinerepro/reviewer-r2-mutate.mjs`: the reviewer's mutation runner for R2-1, read, not run.
- `agent-os/standards/`: `index.yml`, and the files `standards.md` copies.
- `.claude/commands/agent-os/shape-spec.md` (whole), `agents/redline-shaper.md` (whole), `README.md` (sections and Known limits), `agent-os/product/mission.md` (line 15).
- Issues and comments: the open list through `scripts/redline-gh.sh issues-search` (`revise-only`, `reshape`, `spec folder`, `spec-status`, `ownCheck`, `Decisions heading`, `refused`, `Write`, `plugin-dir`, `spec check refused Write`); the PR's comments through `scripts/redline-gh.sh pr-comments 120`.
- Git: `git log main..HEAD`, `git diff --stat main...HEAD`, `git grep -n "git history"` outside the spec folders.
