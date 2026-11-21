# References for PR #114 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping; line numbers are at `5a6d018`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md` (decisions 10, 11, 16 and 18; the reader list, line 70) and `plan.md` (decision 18).
- **Relevance:** what the pull request decided about a decided finding's files, the reshape block and a reshape's deferred entry; R1-4, R1-6 and R1-7 are answered from it, and R1-1 corrects decision 18.
- **Key patterns:** a reshape's disposition and entry for a decided finding are dropped, and its `files` are taken; the lists are compared as sets.

### The block and the files clause (#103, R2-5; #106)

- **Location:** `workflows/redline-loop.js`, `FILES_ASK` (911) and `reshapePrompt` (2054-2079); `tests/loop-test.mjs`, `DECIDED_BLOCK`, `strayDecidedBlock` and the check at the end (365-393, 4053), `withoutBlock` and the reshape checks (3314-3331).
- **Relevance:** where R1-3 names each finding's end and R1-4 qualifies the Return sentence.
- **Key patterns:** a block present only in a round with a decided finding; a check that cuts the block out and compares with the undecided round's prompt; a check over every scenario that names its offenders.

### The hold after a reshape and its stops (#106; #108, R1-5)

- **Location:** `workflows/redline-loop.js`, the reshape loop (4064-4108), `stated` and `tracked` (3788-3796), the resolve-time holds (3927-3951); `tests/loop-test.mjs`, `stopsAtReshape`, `NO_TASK`, `fixEmptied`, `statedAcceptTasked` (3362-3392), `stopsAtResolve` and `oneCall` (3504-3516).
- **Relevance:** `endsIn`, which R1-3 hoists; the two places R1-6's cleanup reaches; the scenarios R1-3's and R1-6's checks read.
- **Key patterns:** a stage error pinned by its text and `resumeFrom` label; a scenario that scripts one task's files (`resolveFiles`, `reshapeFiles`).

### One helper for a finding's task files (#108, R1-7)

- **Location:** `workflows/redline-loop.js`, `unique` and `taskFilesOf` (480-483); `planPaths` (4154); `agent-os/specs/2026-11-18-1026-108-review-round-1/plan.md`, Task 5.
- **Relevance:** where R1-6's `cleanPaths` goes, and the one existing path cleanup (the repository root off the approver's list).
- **Key patterns:** one expression read through one helper, pinned by a source check that still holds (`tests/loop-test.mjs:2942`).

### What a held draft shows (#95, #100, #103 R3-1 to R3-3)

- **Location:** `workflows/redline-loop.js`, `deferredEntry` (3456-3470), `draftView` (3472-3488), `heldStop` (3497-3517), `record.held` (4321), the reshape's `restated` drop and `stillDeferred` (4112-4128); `tests/loop-test.mjs`, `heldEmptied` (3309-3313), `deferArgs` and `deferBounced` (3277-3283).
- **Relevance:** R1-7's comments, its pin and its mutation.
- **Key patterns:** a held draft carries its round's outcome, so `ships` is a commit of the finding's own; the reshape's entry for a decided finding never replaces the resolve's (#97, R3-6).

### The shown disposition of a decided call (R1-5)

- **Location:** `workflows/redline-loop.js`, `effectiveDispositions` (3966-3970), `isDeferral` (3992-4010), `needCommits` (4215-4219), `implementPrompt` (2222-2251), `planPrompt` (2143-2163); `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md`, decision 14; `agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md`, Unattended answer 6 and Declined.
- **Relevance:** why R1-5 is deferred: the view predates this pull request, #99 left it to #106, and #106 took the files only.

### A standards correction through the retrospective (#83, R2-2)

- **Location:** `agent-os/specs/2026-11-09-1423-83-review-round-2/shape.md` (Unattended answer 3) and `plan.md` (Task 2); `agent-os/standards/process/standards-retrospective.md`; `agents/redline-implementer.md`, rule 4.
- **Relevance:** R1-1's standards half, applied in the round's standards commit, whose message names the finding.

### The plan's form (#108, round 1)

- **Location:** `agent-os/specs/2026-11-18-1026-108-review-round-1/plan.md`.
- **Relevance:** anchors by text in fenced blocks, task order across shared files, the red-run and expected-count paragraphs, the #81 caution.

## Code read

- `workflows/redline-loop.js`: `repoRoot` (37), `unique`, `taskFilesOf`, `resumeLine`, `FILES_ASK`, `SHAPE_SCHEMAS`, `RESOLVE_SCHEMA`, `issueDraft`, `reshapePrompt`, `planPrompt`, `implementPrompt`, `result`, `outcomesFor`, `describeOutcome`, `fileDeferred`, `deferredEntry`, `draftView`, `heldStop`, `passOf` (the human pass's tag), and in `revise()`: `raisesDrafts`, `openDrafts`, `decidedFiles`, `reshapedTasks`, `tracked`, `stated`, `resolveWith`, `effectiveDispositions`, `plannedFiles`, `isDeferral`, `draftStop`, the approve loop, the reshape loop, `needCommits`, `roundDeferrals` and the two warnings.
- `agents/redline-shaper.md` (rules 9 and 10), `agents/redline-resolve.md` (steps 2 and 3), `agents/redline-implementer.md` (rules 3 and 4).
- `tests/loop-test.mjs`: the shaper and resolve mocks (193-296), `go` and the checks over every scenario (362-402), the docs phrase list (2916-2931), the source check (2942), the `filing:` and `reshape:` cases (3196-3416, 3498-3516), the final checks (4052-4053).
- `docs/running.md`: step 3 (39) and "Deferred items" (124-129).
- `.claude/redline.json` (no ask rules), `agent-os/standards/` (the files `standards.md` copies, and `index.yml`).
- Issues: the open list through `scripts/redline-gh.sh issues-search`; the PR's comments through `scripts/redline-gh.sh pr-comments 114`.
