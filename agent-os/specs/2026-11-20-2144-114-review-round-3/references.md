# References for PR #114 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `9ea3ea9`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`: the scope line (5), decision 10's reasons (27, 29), decision 14 (35), decisions 16 to 18 (40-42), the reader list's `forceAskRules` row (83) and "For you to open" (94-100).
- **Relevance:** R3-4 is answered from decision 17 ("An earlier decided finding keeps the list its own resolve or a later reshape gave it"); R3-3 rests on the spec's statement that a reshape's list for a decided finding is what the forcing point reads at that reshape; "For you to open" is a different gap (a resolve's tasks), not R3-3.

### Rounds 1 and 2 of this pull request

- **Location:** `agent-os/specs/2026-11-20-2144-114-review-round-1/shape.md` (answer 10 and Decision 2, R1-2's docs sentence); `agent-os/specs/2026-11-20-2144-114-review-round-2/shape.md` (Decision 1, `cleanPaths` built on `relPath` and `relPath` left alone; Decision 3, the second resolve for an override's call left as it ran) and `plan.md` (its form and As built counts).
- **Relevance:** R3-1 corrects round 1's sentence; R3-3 finishes the reading round 2 left; R3-4 settles the question round 2 set aside. Round 2's plan's form (anchors by text in fenced blocks, task order across shared files, red-run and expected-count paragraphs, the #81 caution) is the form this plan follows.

### The ask rules' reading of a path (#49; #114, R1-6, R2-2)

- **Location:** `workflows/redline-loop.js`, `unique`, `relPath`, `cleanPaths` and `taskFilesOf` (480-496), `globToRegExp`, `pathRules`, `ruleForPaths` and `ruleOf` (502-549), `forceAskRules` (3314-3396), the reshape loop's comparison (4126-4137), `planPaths` (4204); `scripts/redline-guard.sh`, `ask_rule` (386-403) and the target's resolution (516-522); `docs/contract.md`, "Ask rules" (139-155); `tests/loop-test.mjs`, the rules block (1364-1473: `rules`, `ruleArgs`, `viaFiles`), the path-form cases (3430-3448), `forcedLater` and `forcedNamed` (3615-3626).
- **Relevance:** R3-3's fix, its class table and its cases; the guard as the evidence for the folded form; `forcedLater` as the model for a decided finding a reshape leaves to the person.
- **Key patterns:** a path read one way wherever the round keeps it; a rule that only ever forces more; a case per folded form and the neighbour a cleanup would drop.

### The decided list and the resolves that set it (#97, R2-14; #106; #114, R2-5)

- **Location:** `workflows/redline-loop.js`, `overridesFor`, `overrides` and `isOverride` (3807-3813), `decidedFiles`, `reshapedTasks`, `tracked`, `stated` and `endsIn` (3821-3843), `resolveWith` (3844-4004: `applied`, the checks, `taskFiles`, the loop that sets the list), `effectiveDispositions` and `plannedFiles` (4005-4028), the reshape loop, the hold, `raised`, `openRaised` and the raised resolve (4110-4199), the end-of-run warnings (4347-4365); the base's `effectiveDispositions`, `resolvedTasks` and `plannedFiles` (`git show origin/main:workflows/redline-loop.js`, 3765, 3925, 3934-3949); `agents/redline-resolve.md` (whole); `tests/loop-test.mjs`, the shaper and resolve mocks (193-301), `approverFiles` and `implementerFiles` (3218-3260), the reshape fixtures and cases (3286-3466: `deferArgs`, `deferBounced`, `PASS_2`, `raisedLater`, `overrideCalled`, `overrideCalledEmptied`).
- **Relevance:** R3-4's trace, its fix and its cases; R3-1's reading of the base's condition; the new mock key `resolveFilesAt`, modelled on `reshapeFilesAt`.
- **Key patterns:** a list set once by its first writer and replaced only by a reshape; a scenario that scripts one call's result by its label.

### The resume line (#10; #106; #108, R3-4, R4-4)

- **Location:** `workflows/redline-loop.js`, `resumeLine` (576-615); `agents/redline-shaper.md`, rule 9; `docs/running.md`, "A reshape after your decision" (127) and "Run markers and resume" (206-208).
- **Relevance:** R3-2's sentence and the clause it now names.

## Code read

- `workflows/redline-loop.js`: the lines above, and `vetShape` (3692-3716) and `revise()`'s opening through the approve loop (3719-4199).
- `tests/loop-test.mjs`: `check`, the mocks, `f`, `goAhead`, `baseArgs`, the constants and `go()` (20-417), the helpers (419-460), the rules block (1364-1473), the docs phrase list (2917-2947), the filing and reshape cases (3205-3482), `forcedLater` and `forcedNamed` (3612-3626), the block boundaries (3105 onward).
- `docs/running.md` (100-250), `docs/contract.md` ("Ask rules"), `agents/redline-shaper.md`, `agents/redline-resolve.md`, `.claude/commands/agent-os/shape-spec.md` (whole), `agent-os/product/mission.md` (15, 17).
- `agent-os/standards/` (the files `standards.md` copies, and `index.yml`).
- Issues: the open list through `scripts/redline-gh.sh issues-search`; the PR's comments through `scripts/redline-gh.sh pr-comments 114`; round 2's filings (`agent-os/specs/2026-11-20-2144-114-review-round-2/redline/round-2-deferred.json`: #116, #117).
