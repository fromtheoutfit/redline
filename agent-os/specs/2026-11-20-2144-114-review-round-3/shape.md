# PR #114 review round 3: the ask rules' reading of a path, a second resolve for an override, and two docs sentences — Shaping Notes

Shaped by Redline in unattended mode, for review round 3 of PR #114 (issue #106), from the round's four findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). Line numbers are at `9ea3ea9`, the head of the pull request's branch.

## Scope

The round's four findings, nothing more. Two are correctness findings (R3-3, low; R3-4, medium). Two are nits (R3-1, R3-2). The verifier confirmed every finding, so none needs a second look.

- `fix`, four: R3-1, R3-2, R3-3, R3-4.
- No `decline`, no `defer`, no `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/`, `scripts/` and `skills/`, every file under `agents/`, and the Verification Gate's text. This round touches none of them. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5; rounds 1 and 2 read it the same way).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the four findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, the pull request's own spec (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/`) and rounds 1 and 2's folders; see `references.md`. `agent-os/product/mission.md:15` is the alignment: "Every verified item is decided, and the real decisions stay with people." Nothing in this round changes it; R3-3 makes the forcing point leave to the person a finding whose task is under a rule however the path is written.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 10, 17, 47, 50), workflow/replay (lines 19, 23), testing/tests (lines 7, 14, 30, 35, 36), process/docs-gate (lines 5, 7, 16, 18), process/release (line 5), process/standards-retrospective and prompts/attribution. Each was read at `9ea3ea9` and is copied in `standards.md`.
   Decided by: redline
3. **Is any finding already known?** No. `scripts/redline-gh.sh issues-search` for `ruleForPaths`, `resolveWith`, `paths rule`, `ask rules`, `override`, `resume` and `running.md` lists #2, #69, #70, #73, #75, #77, #82, #98, #106, #109, #115, #116 and #117. None covers a finding of this round. #117 (round 2's R2-3) tracks changing the resume line for the other shape-stage stops; it does not track R3-2's sentence, which is wrong today for the stop that already has the other line. `scripts/redline-gh.sh pr-comments 114` shows R3-1 to R3-4 only in round 3's review. Round 1's R1-2 wrote the sentence R3-1 corrects (round 1 `shape.md`, Decision 2). Round 2's R2-2 built the cleanup R3-3 measures the ask rules against, and its R2-5 left open the question R3-4 settles (round 2 `shape.md`, Decision 3: "whether a reshape's call for an override's finding should set one off at all is not this finding's question").
   Decided by: redline
4. **R3-4: does the pull request's spec say which resolve sets a decided finding's list?** Yes. Its decision 17 (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md:41`): "**A second resolve sets only the ids it applied.** A reshape that raises a call runs a resolve for that call alone (#97, R2-14). An earlier decided finding keeps the list its own resolve or a later reshape gave it." Its scope line (`shape.md:5`) and the PR description say the same: "set by the resolve that applied the decision, replaced by each reshape's `files`". The comment above `decidedFiles` (`workflows/redline-loop.js:3821-3825`) promises it too: "so an earlier decision keeps the list its own resolve gave it". And the loop test pins it for an earlier decision that the second resolve returns a task for (`tests/loop-test.mjs:3377-3383`, `raisedLater`: "a task that resolve returns for an earlier decision does not undo what the reshape made of it"). An override is an earlier decided finding. A reshape that returns it as a call puts it in `raised` (4161), since `overridesFor` never takes a call (3807), and `resolveWith(raised, [], ...)` (4188) counts it in `applied` (3846), so the loop at 3999-4001 replaces its list with that resolve's tasks alone. The code disagrees with the spec's decision for this one kind of earlier decision, so the disagreement is the fix (point 2; Decision 4). The finding's other option, keeping an override out of `raised`, changes which agents run on a path #97, R2-14 built, and round 2 kept which agents run (its Decision 3); it is not taken.
   Decided by: redline
5. **R3-3: does the evidence say which form of a path the paths rules match?** Yes. The guard, the rule's other layer, folds a target before it matches: `os.path.normpath` (`scripts/redline-guard.sh:520`), then `ask_rule` reads the path relative to the repository (386-403), so `app//billing/x.php` and `app/./billing/x.php` are under `app/billing/**` for the guard. The pull request ties the cleanup to the ask rules' reading of a path: the comment above `relPath` (`workflows/redline-loop.js:481-482`), "A path as the ask rules read it ... so cleanPaths reads it too (#114, R2-2)", and above `cleanPaths` (484-491), "so the holds, the warnings and the list the round keeps compare one form". The pull request's spec relies on the forcing at the reshape reading a decided finding's task (`shape.md:100`, "Since #106 a reshape that follows the approver's bounce lists the task's files for a decided finding, so the workflow leaves it to the person at that reshape"). `ruleForPaths` (534-544) reads a path through `relPath` alone, while the list the round keeps is folded (4128, 4136), so a task listed in a folded form is stored under the rule and never forced. Round 2's Decision 1 left `relPath` unchanged because no finding of that round raised the ask rules' reading; this one does, so the round-2 note is not a decision against it. The code disagrees with the form the round keeps and the guard matches, so the disagreement is the fix (Decision 3). This is not the pull request's "For you to open" item (`shape.md:94-100`), which is the ask rules never running on a resolve's tasks.
   Decided by: redline
6. **R3-1: what did the base show a decided finding?** The base's `effectiveDispositions` (`git show origin/main:workflows/redline-loop.js`, 3934-3937): `const shown = decision && decision.disposition ? { ...f, disposition: decision.disposition } : f` and `return decision && shown.disposition === 'defer' ? { ...shown, files: plannedFiles(f.id) } : shown`, with `plannedFiles` reading `taskFilesOf(resolvedTasks, id)` (3949). `shown.disposition` is the decision's own disposition when it names one, and otherwise the disposition of the current `shaped`, which after a reshape is the reshape's. So the first-planned task was shown whenever a decided finding was shown as `defer`: a decision that names defer (a disposition override, or a call whose decision names one), or a call a reshape re-sorted to defer. Round 1's sentence (`docs/running.md:127`) names only the first, and says every other decided finding was shown the shaper's list. The claim is right (Decision 1).
   Decided by: redline
7. **R3-2: what does a shape-stage resume do today?** `resumeLine` (`workflows/redline-loop.js:585-597`) gives the shaper the correct-in-place clause when the error opens `the reshape left ` (the hold after a reshape, 4151-4158), and the from-scratch clause otherwise. Rule 9 of `agents/redline-shaper.md` and the bullet "A reshape after your decision" (`docs/running.md:127`) say so. The resume section (`docs/running.md:208`) says every shape-stage resume "rewrites the four spec files". The claim is right (Decision 2). #117 would change the sentence again for the other stops when it lands.
   Decided by: redline
8. **This round edits `workflows/redline-loop.js`** again, as rounds 1 and 2 did, and no agent file. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits).
   Decided by: redline
9. **Scratch test.** None written. There is no PHP in this repository, and every question above was settled by reading the files cited and tracing the paths by hand. The harnesses run through `.claude/redline/checks.sh` only, and no role runs an interpreter.
   Decided by: redline

## Decisions

1. **R3-1: fix.** The history sentence in "A reshape after your decision" (`docs/running.md:127`) is reworded from the base's condition (answer 6): before #106 a decided finding was shown its task as first planned whenever it was shown as a deferral, whether its decision named one (`<id>: defer. <reason>`) or a reshape had re-sorted it to one, and otherwise the shaper's list from before the decision, then the reshape's own. The sentence names no call whose decision names defer by that name, since no skill path writes one (the loop test's `forcedDefer` comment, `tests/loop-test.mjs:3371-3373`); "its decision named one" covers it. The rest of the bullet, which describes today's behaviour, is unchanged. One key phrase is pinned in the `docs/running.md` phrase list (`tests/loop-test.mjs:2939`).
   Decided by: redline
2. **R3-2: fix.** The resume paragraph (`docs/running.md:208`) says the shaper never touches `redline/` and rewrites the four spec files, except after the stop that holds a decided finding to its task after a reshape, where it corrects that task and keeps the decided entries, pointing at "A reshape after your decision". The sentence is outside the pull request's diff, but the pull request's `resumeLine` change made it wrong, and the file is one the pull request changed. One key phrase is pinned.
   Decided by: redline
3. **R3-3: fix, by matching a path in both forms.** `ruleForPaths` (534-544) reads each path as written, after `relPath`, as before, and also as `cleanPaths` reads it. A rule matches when either form is under it. Reading only the cleaned form would take one form out from under a rule: `cleanPaths` drops a trailing slash, and `config/project/` is under `config/project/**` as written while `config/project` is not (`globToRegExp`, 502-531, gives `^config/project/.*$`). Reading both only ever forces more, which is the rule's direction. Both callers (`forceAskRules`, 3338, and `ruleOf`, 548) read through it, so the shaper's and a reshape's `files` and the reviewer's file are read one way; a reviewer's repository-relative file reads as before. The comment above `relPath` says how the rules read a path. `docs/contract.md`, "Ask rules" (152), says the workflow reads a path as listed and as the run keeps a task's paths. Cases, each seen red before the change where it turns on a clause: one per folded form at the shape (a doubled slash, a `./` segment, padding), the reviewer's reshape case (a decided fix whose task a reshape lists as `app//billing/charge.php` under `app/billing/**`), and the contract pin. Beside them, two neighbours that hold before and after: a directory with a trailing slash is still forced (red under a mutation that drops the written form), and a path that folds to one outside the rule forces nothing. No existing scenario with an ask rule scripts a path in a form the cleanup folds (every non-canonical path in `tests/loop-test.mjs` searched: they sit in scenarios with no rule), so no existing check moves and no prompt changes.

   The class (workflow/agents, line 10): this is the third round on how a path an agent returns is read (R1-6 built `cleanPaths`, R2-2 folded the forms, R3-3 the rules' reading). Every reader of such a list, set against the code:

   | Reader | What it reads | Before R3-3 | After | Whose |
   | --- | --- | --- | --- | --- |
   | `taskFilesOf` (496) | a resolve's tasks for one finding | `cleanPaths` | unchanged | this PR (R1-6, R2-2) |
   | the reshape loop (4128) | a reshape's `files` for a decided finding | `cleanPaths` | unchanged | this PR (R1-6, R2-2) |
   | `ruleForPaths` from `forceAskRules` (3338) | the finding's file and the shaper's or a reshape's `files` | `relPath` alone | `relPath` and `cleanPaths` | #49; the folded form beside it is this PR's |
   | `ruleForPaths` from `ruleOf` (548) | the reviewer's file | `relPath` alone | `relPath` and `cleanPaths` | #49 |
   | `shaperFiles` (3750) and `effectiveDispositions` for a finding nobody decided (4016) | the shaper's own `files` | as written | unchanged | #100, #103: a finding nobody decided keeps the shaper's list by design (4011), and no finding of this round raises it |
   | `planPaths` (4204) | the plan approver's `planPaths` | root taken off | unchanged | predates the pull request; the approver's list, and no finding of this round raises it |

   The last two rows are outside this round's scope and outside what the pull request set out to do: neither reads a decided finding's task, and no finding names either. They are recorded so the class is settled by reader, not by instance.
   Decided by: redline
4. **R3-4: fix, by setting a list once.** In `resolveWith`, the loop that sets `decidedFiles` (3999-4001) sets it only for an id that has none yet. The resolve that first applies a decision sets its list, and after that only a reshape replaces it, as the spec's decision 17 says (answer 4). Every resolve after the first applies only `raised` calls, whose ids are new to the round, except an override a reshape returned as a call (answer 4), so the condition changes behaviour for that one kind of id. The comment above `decidedFiles` (3821-3825) says so. What stays as it was, on purpose:
   - The checks in `resolveWith` still hold that second resolve to its own tasks (a named fix with no task stops at `resolve`, resumable, #108, R1-5). They are a consistency check on what one resolve returned (workflow/agents, line 47), and such a stop posts nothing.
   - That resolve's deferred entry for a defer override still replaces the first one's (#94, R5-9), and a changed draft is raised again by its version (#95).
   - A second resolve that rewrites the override's task in `plan.md` is not followed: the list is the reshape's until the next reshape, as `raisedLater` already pins for an earlier decision a second resolve returns a task for. Should the two disagree, the plan approver's next pass sees it and bounces, and the next reshape lists the task with the change warned about.

   A mock key, `scenario.resolveFilesAt[label][id]`, scripts the task one resolve alone returns, by that resolve's label, before `scenario.resolveFiles`, which every resolve reads. No existing scenario sets it. Cases: a defer override a reshape returns as a call, whose second resolve (`resolve r1 #1`) plans no task for it, then plans one elsewhere; and a neighbour on `raisedLater` that a call the reshape newly raises still takes its own resolve's task. The only existing scenarios where a resolve applies an override again (`overrideCalled`, `overrideCalledEmptied`) have the second resolve return the reshape's file, so their lists, checks and prompts are unchanged.
   Decided by: redline
5. **Task order.** Tasks 2 and 3 change two sentences of `docs/running.md` (127 and 208) and add one element each to the same phrase list (`tests/loop-test.mjs:2939`), Task 3 after Task 2's. Tasks 4 and 5 both change `workflows/redline-loop.js` and `tests/loop-test.mjs`, in different places; Task 4 adds lines near the top of both files, so each task names its anchors by text, as the tasks before it leave them.
   Decided by: redline

### Proportionality

- **R3-3.** Very unlikely: it needs a paths rule and an agent that writes a path under it with a doubled slash, a `./` segment or padding. When it fires, the forcing point does not leave the finding to the person, and the round keeps and shows the folded path under the rule; the plan approver's rule 5 and the guard, which folds the path and refuses the write, are behind it, so nothing under the rule is written, and the cost is a bounce or a stop at implement. Cost: one function's inner loop, two comments, one docs clause, six loop runs with nine checks (two of them run-record checks), all in files the pull request changed but `docs/contract.md`, a docs clause. In proportion. It is a low-severity correctness finding whose cause is in the previous round's fix diff (`inFixDiff`), so it is fixed like a nit.
- **R3-4.** Unlikely: it needs a reshape that returns a call for a finding the person overrode, against its prompt ("a decision the person made, or the autopilot applied, stays as it is"), and a second resolve that returns no task, or another task, for it. When it fires on a defer override (a fix override stops at `resolve` first), the plan approver's next pass and the implementer are shown a list `plan.md` does not hold, which the approver's rule 1 bounces and can bounce to the cap, and a commit of its own is warned about as beside a task the resolve agent never planned, or a moved task is shown with no warning and no `reshaped` entry. Cost: one filter on one loop, one comment, one mock key, two runs with six checks (two of them run-record checks). Inside code this pull request wrote (`decidedFiles`). In proportion.
- **R3-1, R3-2.** Nits in `docs/running.md`, one sentence each and a pin each. In proportion.

## Declined

None.

## Deferred

None.

## Standards retrospective (proposed)

Listed from Decisions 1 to 5 and the unattended answers; nothing went red while shaping. No item finishes a finding, since every finding's fix is in its own task. Each clause is read back in its whole line once applied (process/standards-retrospective, line 10).

1. **`agent-os/standards/workflow/agents.md`, line 47: contradicted in part once R3-4 lands.** Replace

   ```
   set by the resolve that applied the decision, for the ids that resolve applied, and replaced by each reshape's `files`
   ```

   with

   ```
   set by the resolve that first applied the decision, and replaced by each reshape's `files`
   ```

   and append, after `(#106)` at the end of the line:

   ```
   ; and a resolve that applies a decision again does not set its list: a reshape's call for an override's finding sets off a resolve that applies the override a second time, and that resolve's tasks alone replaced the list the first set and the reshape kept, so a task it did not restate was shown as none and one it moved was shown with no warning, until #114, R3-4
   ```

2. **`agent-os/standards/workflow/agents.md`, line 50: missing (R3-3, Decision 3).** Append, after `until #114, R2-2` at the end of the line:

   ```
   ; and a check that matches such a list against something reads it in the form the round keeps it in as well as as written: the paths ask rules matched the shaper's list as written while the round kept and showed it folded, so a task listed as `app//billing/x.php` under `app/billing/**` was never left to the person, until #114, R3-3, which reads both forms, since one the cleanup drops (a directory's trailing slash) was under a rule as written
   ```

3. **`agent-os/standards/workflow/agents.md`, line 17: missing (R3-2, Decision 2).** Append, after `until #108, R1-2` at the end of the line:

   ```
   ; and an exception a change adds to a rule is stated wherever the rule is, every section of the docs included: #106's correct-in-place resume after the hold reached rule 9 of the shaper's file and the reshape bullet of `docs/running.md`, while the resume section of the same file still said every shape-stage resume rewrites the four spec files, until #114, R3-2
   ```

4. **`agent-os/standards/process/docs-gate.md`: missing (R3-1, Decision 1).** Add one bullet at the end of the file, after the bullet that opens `- A behaviour a spec records as unmeasured`:

   ```
   - A sentence the docs keep about what a reader was shown before a change is read off the base's code, through every branch of its condition, never off a summary of it: the `Before #106` sentence named only a deferral set as a disposition, while the base's condition, `shown.disposition === 'defer'`, read a reshape's disposition for a call too, until #114, R3-1
   ```

5. **`agent-os/standards/testing/tests.md`, line 7: missing (R3-4's mock key, Decision 4).** Append, after `(#114, R2-5)` at the end of the line:

   ```
   ; and the task one resolve alone returns is scripted by that resolve's label (`resolveFilesAt`), so a scenario can have the resolve a reshape's call sets off return no task, or another, for a decision an earlier resolve planned (#114, R3-4)
   ```

Already in a standard, no edit:

- A finding of a class an earlier round fixed is fixed as the class, with the readers listed and set against the code (`workflow/agents.md`, line 10): Decision 3's table.
- A comment that restates a rule changes with it (`workflow/agents.md`, line 17): the comments above `relPath` and `decidedFiles`.
- A case per form, each turning on one clause, and a widened parse pins the form it still refuses (`testing/tests.md`, line 30): R3-3's cases and neighbours.
- A check fails, it does not throw, when its run took another path (`testing/tests.md`, line 14): every new check reads `res` through `|| {}`.
- Red before green, and a pin that held before is seen red under a mutation (`testing/tests.md`, line 35): the trailing-slash neighbour and `raisedLater`'s new check.
- A docs change needs no Docs entry of its own (`process/docs-gate.md`, line 16): Tasks 2 and 3.

No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md:15`: a finding under a repository rule stays the person's however its path is written (R3-3); a decision the person made keeps the task the plan carries for it (R3-4); and the docs say what the run does and did (R3-1, R3-2).

## Standards Applied

- workflow/agents — line 10, a class settled by reader (R3-3); line 17, a rule and its comments and docs changed together (R3-2, R3-3, R3-4); line 47, the decided list set by its resolve and replaced by each reshape (R3-4); line 50, a path list read through one cleanup (R3-3).
- workflow/replay — line 19, the resume line chosen by the stop (R3-2's docs); line 23, no prompt of a round without a decided finding changes, and this round changes no prompt.
- testing/tests — line 7, a mock that scripts one call's result by its label (R3-4's `resolveFilesAt`); line 14, checks that fail rather than throw; line 30, a case per form and the refused neighbour (R3-3); line 35, red before green; line 36, no prompt changes, so no sweep is needed.
- process/docs-gate — one Docs entry per touched plugin file, in its task; a docs change needs none of its own; a new bullet after line 18 (standards item 4).
- process/release — no bump in a review round of the same pull request.
- process/standards-retrospective — the edits are proposed here and applied in one commit; an appended clause is read back in its line.
- prompts/attribution — none anywhere.
