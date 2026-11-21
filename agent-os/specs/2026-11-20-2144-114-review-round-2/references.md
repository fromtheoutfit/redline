# References for PR #114 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `b5db022`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`: Scope (line 7, what is not touched), decision 10 (line 27, the block says what `files` means; no new key), decision 13 (line 34, the hold after each reshape and its resume line), and "Left alone" (line 115, the shaper's resume line on other reshape stops).
- **Relevance:** R2-1 and R2-3 are answered from its Scope and its Left alone; R2-4 and R2-6 are sorted on decision 10; R2-6 keeps its approach.
- **Key patterns:** one block, present only in a round with a decided finding, that says what an existing field means; the hold's stop chosen for the resume line by how its error opens.

### Round 1 of this pull request

- **Location:** `agent-os/specs/2026-11-20-2144-114-review-round-1/shape.md` (Decisions 4 and 6, Unattended answers 4 and 7) and `plan.md` (Tasks 5 and 6, As built).
- **Relevance:** the two fixes R2-4 and R2-2 complete: `FILES_ASK_DECIDED` and `cleanPaths`. Its plan's form (anchors by text in fenced blocks, task order across shared files, red-run and expected-count paragraphs, the #81 caution) is the form this plan follows.

### The path cleanup and the ask rules' reading of a path (#49; #114, R1-6)

- **Location:** `workflows/redline-loop.js`, `unique`, `cleanPaths` and `taskFilesOf` (480-490), `pathRules`, `relPath` and `ruleForPaths` (526-539), the reshape loop's comparison (4110-4121), `planPaths` (4186); `tests/loop-test.mjs`, `baseArgs` (`repoRoot: '/r'`, 357), `sameFileAnotherWay` and `fixBlanked` (3415-3422), `fixBlankFile` (3555), `moved` (3316-3317), `fixMoved` (3427-3428), `viaFiles` (1435-1436).
- **Relevance:** R2-2 builds `cleanPaths` on `relPath`; the neighbours that must not change.
- **Key patterns:** a path read one way everywhere the round compares it; the ask rules read through `relPath` alone.

### The files clause and the block (#103, R2-5; #106; #114, R1-3, R1-4)

- **Location:** `workflows/redline-loop.js`, `FILES_ASK` and `FILES_ASK_DECIDED` (913-925), `reshapePrompt` (2068-2100), `forceAskRules` (3313); `tests/loop-test.mjs`, `DECIDED_BLOCK`, `FILES_PENDING`, `FILES_DECIDED`, `doubleFilesAsk` and `go()` (367-404), the reshape checks (3334-3354), `raisedStop` (3375-3377), the final checks (4095-4096).
- **Relevance:** R2-4's words and pins; R2-6's sentence in the block.
- **Key patterns:** a clause qualified only under the block's condition; a check that cuts the block out and compares; a check over every scenario.

### The hold after a reshape, the raise and how an owner is named (#99; #106; #108, R1-5, R2-3, R3-5, R3-6)

- **Location:** `workflows/redline-loop.js`, `overridesFor` and `overrides` (3794-3797), `tracked`, `stated` and `endsIn` (3814-3827), `resolveWith` with `isCall`, the stray warnings and `whose` (3828-3988), the approve loop and the reshape loop with the hold, `saidBy`, `raised`, `openRaised` and `calls = calls.concat(raised)` (4067-4181), `judge` and `mentions` (2547-2598, 637), `needCommits` (4247); `tests/loop-test.mjs`, the shaper and resolve mocks (193-298), `approverFiles` and `implementerFiles` (3214-3256), `toFix`, `overrideDial`, `declined`, `NO_TASK`, `stopsAtReshape` and the hold's cases (3378-3430), `namedStray` (3529-3534), `overrideBuilt` (3634).
- **Relevance:** R2-5's helper and its two runs; R2-6's trace of the merged task; the mock key `reshapeFilesAt`.
- **Key patterns:** a stage error pinned by its text and `resumeFrom` label; a scenario that scripts one task's files by key.

### The resume line (#10; #106; #108, R3-4, R4-4)

- **Location:** `workflows/redline-loop.js`, `resumeLine` (571-610); `tests/loop-test.mjs`, `resumeLineFor`, `FROM_SCRATCH`, `CORRECT_TASK`, `fixRestored` and `specRestored` (3431-3446); `agents/redline-shaper.md`, rule 9.
- **Relevance:** R2-3's deferral: the clause chosen by the stop, and the case that pins today's sentence.

### What the person and the agents are told about a decided fix's task

- **Location:** `agents/redline-resolve.md`, step 2 (a fix as a task of its own, its `finding` set) and the statement paragraph; `agents/redline-shaper.md`, rule 10; `docs/running.md`, step 3 (39) and "Deferred items" (125-127); `skills/redline/SKILL.md`, section `error` (272).
- **Relevance:** R2-6's sentence follows the resolve agent's rule; R2-1's deferral is the skill's error report.

## Code read

- `workflows/redline-loop.js`: `abs`, `unique`, `cleanPaths`, `taskFilesOf`, `globToRegExp`, `pathRules`, `relPath`, `ruleForPaths`, `ruleOf`, `rulesBlock`, `stageError`, `resumeLine`, `errorText`, `FILES_ASK`, `FILES_ASK_DECIDED`, `SHAPE_SCHEMAS`, `shapePrompt`'s Return sentence, `humanShapePrompt`, `reshapePrompt`, `resolvePrompt`'s opening, `judge`, `vetShape`, and in `revise()`: `raisesDrafts`, `shaperFiles`, `draftsOf`, `settle`, `overridesFor`, `overrides`, `decidedFiles`, `reshapedTasks`, `tracked`, `stated`, `endsIn`, `resolveWith`, `effectiveDispositions`, `plannedFiles`, `isDeferral`, `draftStop`, the approve loop, the reshape loop, the hold, `raised` and `finalDispositions`. The pull request's diff of the file against `main` (`git diff main...HEAD`).
- `agents/redline-shaper.md` (whole), `agents/redline-resolve.md` (steps 2 and 3), `agents/redline-plan-approver.md` (rules 1, 2, 5, 6).
- `tests/loop-test.mjs`: the mocks (150-345), `f`, `goAhead`, `baseArgs`, the constants and `go()` (348-413), the helpers (415-453), the rules cases (1360-1449), the reshape-after-a-decided-ask cases (1675-1690), the overrule cases (2790-2801), the docs phrase list and the source checks (2926-2950), the `filing:` and `reshape:` cases (3205-3560), the block boundaries, the final checks (4095-4096).
- `docs/running.md`: step 3 (39) and "Deferred items" (125-127). `skills/redline/SKILL.md`: sections `done`, `capped` and `error` (262-272).
- `agent-os/standards/` (the files `standards.md` copies, and `index.yml`).
- Issues: the open list through `scripts/redline-gh.sh issues-search`; the PR's comments through `scripts/redline-gh.sh pr-comments 114`.
