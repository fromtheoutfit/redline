# #106: a decided finding's task follows the reshape

## Context

Issue #106 was deferred from pull request #103 (round 3, finding R3-4). Its Nov 18 comment supersedes the body: #99 closed the `isDeferral` path, and what is left is the list `plannedFiles` reads.

For a finding the person or autopilot decided, `plannedFiles` in `workflows/redline-loop.js` reads the task from the resolve agent's tasks alone (`resolvedTasks`, which only `resolveWith` adds to). A reshape after a bounced plan rewrites `plan.md` and returns every finding's `files`, but nothing takes them for a decided finding. So after a reshape changes or removes that task, every reader is shown the files as first planned. The plan approver's rule 1 then bounces a `defer` whose list and plan disagree, no reshape can change what it is shown, and the round runs to `maxPlanAdjustments` and stops at approve.

After this spec the workflow keeps one list per decided finding, the files of its task as last planned: set by the resolve that applied the decision, replaced by each reshape's `files`. Every reader reads that list.

## Decisions

Given with the brief, not reopened:

1. The problem is the one the comment leaves: `plannedFiles` reads `resolvedTasks` alone for a decided finding.
2. Settled by class. `shape.md` lists every read of `plannedFiles`, `resolvedTasks` and `taskFilesOf` and every text shown from them, each with what it reads today after a reshape and after this change. A reader the issue does not name is in scope (#75, the Nov 20 comment).
3. The issue's loop case is seen red first, with its neighbour (a reshape listing the same files changes nothing). Each reader that changes has a case.
4. The replay standard holds: every prompt of a run with no decided finding stays byte-identical, a new ask sits only in the block the calls it concerns carry, and a paused run relaunched after the update still replays.
5. Out of scope: #104, #105, #109. Where this change touches what one describes, `shape.md` says so and leaves it.
6. Not touched: `templates/`, the unattended section, `scripts/redline-gh.sh`, `tests/gh-test.sh`, `scripts/redline-guard.sh`, `hooks/hooks.json`. The chosen design needs no template change.
7. Patch bump: 0.4.3 to 0.4.4.
8. CI's shellcheck command runs before the first commit and after the last if any `.sh` file changes. None is planned to.
9. No AI attribution anywhere.

Answered during shaping (2026-11-20):

10. **a. Follow the reshape.** The workflow takes a reshape's `files` for a decided finding. The reshape prompt gains one block, only in a round with a decided finding, saying what `files` means for those ids (today "for an ask" means the recommended option's paths, the wrong list for a decided call). `agents/redline-shaper.md` gains the same sentence. A warning names every change a reshape makes to a decided finding's files. No new stop, result field, skill change or template change. What the workflow drops from a reshape on purpose stays dropped: a decided finding's disposition and deferred entry.
11. **b. Every decided finding**, not deferrals only: one list, read one way from the first plan approver pass on. This replaces #103's R2-11 scoping ("every other finding keeps the shaper's list"). `shape.md` records that, with the reason: the line was set for a nit fix, and no spec decided against showing a decided fix its task's files.
12. **c. `maxPlanAdjustments` stays the only bound.** The approve stop's message is unchanged. Its `detail` gains `reshaped`, only when not empty: each decided finding whose task a reshape changed, as `{id, decidedBy, files: [as the resolve planned it, then after each reshape that changed it]}`.
13. **d1. A decision is held to its task after each reshape.** A decided fix left with no files, or a decided accept left with files, stops the round at that reshape (stage `shape`, resumable there). A decided deferral is never held (#100). The resumed reshape is told to correct the task the error names and keep the decided entries, in place of the shaper's rewrite-from-scratch line.
14. **d2. The ask-rules neighbour is recorded and drafted, not built.** `forceAskRules` never reads a resolve's task files. `shape.md` carries a drafted issue under "For you to open": the gap, the two nets that catch it today (the plan approver's rule 5, the guard), and the open decision (what a decision becomes when its task hits a rule). #49 is closed, so a note for it would be tracked nowhere.

Settled by the design, visible here for approval:

15. **A finding left to the person under a rule is not tracked.** It keeps today's reading everywhere: it is not named in the reshape block, its list is not replaced, and it is not held. Its task has no files by rule. One edge changes: a defer override that a reshape newly puts under a rule is shown the reshape's list where it was shown the resolve's. It gets a case.
16. **A reshape that lists the same files changes nothing.** Lists are compared as sets, and the stored list is kept when the set is equal, so the next prompts are byte-identical and no warning is raised.
17. **A second resolve sets only the ids it applied.** A reshape that raises a call runs a resolve for that call alone (#97, R2-14). An earlier decided finding keeps the list its own resolve or a later reshape gave it. `resolvedTasks` is removed; the per-id list replaces it.
18. **One reader has no case of its own.** A round's draft stop after a reshape reads the new list, but a decided deferral's draft is always answered before a reshape can run, and an answered draft is not raised again (#104). So no round stop can show the changed files today. The case for that reader is the end-of-run stop, which goes through the same `draftView` and the same list. `shape.md` says this change widens #104's case and leaves it.
19. **The reverse warning is reworded where a reshape emptied the list.** "the resolve agent planned no task with files for it" is false when the resolve did plan one. Both wordings are pinned.
20. **Existing expectations that move are listed, not hidden.** The reshape mock must answer the new block (`testing/tests`: a reshape mock returns what the reshape prompt asks for). Any existing check whose expected value changes is named in As built with the reason.

## The reader list (goes into `shape.md` in full)

| Reader | Shown to | Today, after a reshape | After |
|---|---|---|---|
| `effectiveDispositions` → `planPrompt` | plan approver, every pass | resolve's list (deferral); reshape's or shaper's own list (fix, accept) | the list, every tracked decided finding |
| `finalDispositions` → `implementPrompt` | implementer, repair | same | same list |
| `draftStop` → `draftView` | the person, a round's stop | resolve's list | the list (no reachable case, decision 18) |
| round-end `draftsOf` → `record.held` → `heldStop` | the person, end-of-run stop | resolve's list | the list |
| planned-but-unbuilt warning | result | names the resolve's files | names the list |
| commit-with-no-files warning | result | "the resolve agent planned no task" | reworded when a reshape emptied it |
| `taskFiles` in `resolveWith` | resolve-time stops | that resolve's tasks | unchanged; the same rule now also runs after a reshape |
| `outcomesFor`, `needCommits`, `deferredEntry`, `fileDeferred`, `isDeferral` | | read no files | unchanged |
| `forceAskRules` (outside the three names) | the forcing point | shaper's or reshape's list, never a resolve's | unchanged; drafted issue |

## Tasks

The tasks share `workflows/redline-loop.js` and `tests/loop-test.mjs`. Each is one slice: cases first and seen red, then the build, then stop for your commit.

### Task 1: Save spec documentation

Create `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/` with `plan.md` (this plan), `shape.md` (scope, decisions 1 to 20, the reader list in full, the R2-11 rider, the #104, #105 and #109 notes, "For you to open"), `standards.md` (each applied standard copied whole, as at HEAD) and `references.md`. No visuals.

### Task 2: One list, read from the first pass

`workflows/redline-loop.js`:

- Replace `resolvedTasks` with a per-id list of the files of each decided finding's task. `resolveWith` sets it, through `taskFilesOf(out.tasks, id)`, for the ids that resolve applied, where it pushes to `resolvedTasks` today.
- `plannedFiles(id)` reads that list for a tracked finding (decided and not left to the person under a rule), `shaperFiles(id)` otherwise.
- `effectiveDispositions` shows `plannedFiles` for every tracked finding, not only a `defer`.
- Update the comments that restate the old rule (above `resolvedTasks`, `effectiveDispositions`, `plannedFiles`, and the `files` key in the shape schema).

Cases, red first: the first plan approver pass and the implementer are shown the task's files for a decline overruled to a fix (`[]` today), a call answered with a fix whose shaper list differs, and a call answered with no change (`[]` after). Neighbours: an undecided fix keeps the shaper's list; a finding left to the person keeps today's. The source pin at `tests/loop-test.mjs:2914` (`taskFilesOf(resolvedTasks, id)`) is rewritten for the one reading.

Docs entry: `workflows/redline-loop.js` → `docs/running.md`, "Deferred items" (Task 5).

### Task 3: The list follows the reshape

`workflows/redline-loop.js`:

- `reshapePrompt` takes the tracked ids and appends one block, empty when there are none: for each id named, `files` is the paths of its task as `plan.md` holds it when the reshape is done, an empty list when it has no task, whatever disposition is returned; a fix the person decided keeps a task with files and an accepted finding keeps none.
- After `vetShape` on a reshape, each tracked id takes the reshape's `files` (decision 16), with a warning naming the change and the owner (`from app/x.php to none`), and the history kept for Task 4's detail.
- The commit-with-no-files warning's second wording (decision 19).

`agents/redline-shaper.md`: the same rule beside rule 10's `files` sentence, and no other rule changed.

`tests/loop-test.mjs`: the reshape mock answers the block (for each named id, what the scripted resolve planned, or `scenario.reshapeFiles[id]`).

Cases, red first:

- The issue's case: an override to defer whose resolve plans `app/x.php`, a bounce, a reshape listing no files; `plan approver r1 #2` is shown `["defer", []]`. The implementer is shown the same.
- Its neighbour: a reshape listing the same files leaves the second approver's list equal to the first's, with no warning.
- The reverse: the resolve plans no task, the reshape lists `app/y.php`.
- The end-of-run stop shows the new list (decision 18).
- The planned-but-unbuilt warning names the new files, and is absent when the reshape emptied them; the reworded warning beside the existing one.
- The block: present and naming the tracked ids only; the reshape prompt of a decided run with the block removed equals the prompt of the same scenario without the decision; over every scenario, one check at the end that a reshape prompt holds the block only in a round with a tracked decided finding.
- Replay: a relaunch after a stop that follows a reshape, in a round with a decided finding, replays every prompt before it (`samePrefix`).
- Decision 15's edge and decision 17's neighbour.

Docs entries: `workflows/redline-loop.js` → `docs/running.md`, "Deferred items" and step 3 (Task 5). `agents/redline-shaper.md` → no reader-facing change: the README's roles table names the file, and the behaviour is described in `docs/running.md`.

### Task 4: Hold the decision, and name the tasks at the cap

`workflows/redline-loop.js`:

- After the list is taken on a reshape: a tracked fix (override, named or stated) with no files, or a tracked accept with files, is a stage error at `shape` on the reshape's label. Both messages open `the reshape left `.
- `resumeLine`: for the shaper, an error opening `the reshape left ` gets the correct-what-you-wrote clause in place of the rewrite-from-scratch clause, chosen by the stop as the resolve's is (#108, R3-4, R4-4).
- The approve stop at the cap passes `reshaped` in its detail when not empty.

Cases, red first: each stop by text and `resumeFrom` label, for an override, a named call and a stated call, with no second plan approver call; the neighbours (a deferral emptied is no stop, a fix moved to other files is no stop, a finding left to the person is skipped); the resumed reshape's prompt ends with the new clause, and a reshape resumed after another shape error keeps the old one; `detail.reshaped` at the cap, and its absence from the existing exhausted-approval scenario.

Docs entry: `workflows/redline-loop.js` → `docs/running.md`, step 3 (Task 5).

### Task 5: Docs

`docs/running.md`: step 3 (Approve) gains the clause on the stop's detail and the reshape stop; "Deferred items" says a reshape after a bounced plan may change the task of a finding you decided, that the run follows the plan as reshaped and warns, and that an answered draft is not shown again for it (the existing limit, #104). The loop test's doc key-phrase pins gain the new phrases.

### Task 6: Version

`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to `0.4.4`. No reader-facing change: the changelog entry is written at tag time.

### Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` until green, then the Docs step, the Version step, the standards retrospective (proposed with a question, applied only after your answer, in its own commit) and the spec folder's As built.

## Verification

- `node tests/loop-test.mjs` after each slice: the new cases red before the build, then `N checks passed, 0 failed`.
- Each new clause seen red under a mutation (count-asserted replace scripts in the scratchpad, long runs in the background).
- A fingerprint sweep for decision 4: a scratchpad copy of the loop test runs every scenario against `HEAD`'s workflow and against the built one (`go()` takes the script as an argument) and compares every prompt. Expected: identical for every scenario with no tracked decided finding; each scenario that differs is listed in `shape.md` with the decided finding that explains it.
- `.claude/redline/checks.sh --baseline` green at the end; `claude plugin validate .` inside it.
- No `.sh` file changes, so shellcheck is not run; if one does, CI's command runs before the first commit and after the last.

## Critical files

- `workflows/redline-loop.js`: `resolveWith`, `effectiveDispositions`, `plannedFiles`, the approve loop, `reshapePrompt`, `resumeLine`, the two warnings
- `tests/loop-test.mjs`: the shaper mock, the cases near the `filing:` section
- `agents/redline-shaper.md`, `docs/running.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

I make no commit and stage nothing. Each slice ends with the file list for your commit.
