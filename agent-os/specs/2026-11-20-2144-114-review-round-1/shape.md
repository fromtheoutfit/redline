# PR #114 review round 1: what the reshape is asked and told about a decided finding, and how its list is read — Shaping Notes

Shaped by Redline in unattended mode, for review round 1 of PR #114 (issue #106), from the round's seven findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Line numbers are at `5a6d018`, the head of the pull request's branch.

## Scope

The round's seven findings, nothing more. Four are correctness findings (R1-4, medium; R1-5, R1-6, R1-7, low). Three are nits (R1-1, R1-2, R1-3). The verifier confirmed every finding, so none needs a second look.

- `fix`, six: R1-1, R1-2, R1-3, R1-4, R1-6, R1-7.
- `defer`, one: R1-5, with no mitigation; its drafted issue is under `## Deferred`.
- `decline`, none.
- No `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/`, `scripts/` and `skills/`, the resolve agent's and the plan approver's files, and the Verification Gate's text. This round touches none of them. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5; the same reading as #108's round 1).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the seven findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, and the pull request's own spec (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/`); see `references.md`. `agent-os/product/mission.md` is the alignment the pull request's spec already records ("Every verified item is decided, and the real decisions stay with people"); nothing in this round changes it.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 10, 17, 38, 47, 50), workflow/replay (lines 19, 23), testing/tests (lines 7, 16, 35, 36), process/docs-gate (lines 5, 7, 8, 16), process/release (line 5), process/standards-retrospective (lines 7, 10) and prompts/attribution. Each was read at `5a6d018` and is copied in `standards.md`.
   Decided by: redline
3. **Is any finding already known?** No. `scripts/redline-gh.sh issues-search` for `effectiveDispositions`, `disposition shown call`, `reshape`, `mitigation words`, `stated`, `re-sort` and `implementer shown` lists only #1, #75, #104, #105, #106 and #109, none of which covers a finding of this round (#104 counts a draft's version and is the candidate the verifier set aside). `scripts/redline-gh.sh pr-comments 114` shows only this round's review. This pull request has no earlier review-round folder. #108's round 1 declined a neighbour of R1-5 (answer 5).
   Decided by: redline
4. **R1-4: what does the pull request's spec say `files` means for a decided call on a reshape?** Its decision 10 (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md:27`): "The reshape prompt gains one block, only in a round with a decided finding, saying what `files` means for the ids it names. Without it the list is ambiguous for a decided call: every shape prompt asks, 'for an ask, the paths its recommended change would touch', and a reshape that still returns a decided call as `ask` would list the recommended option's paths, not the task the answer planned." So the answer is the block's meaning, the task as `plan.md` holds it. The Return sentence after the block (`workflows/redline-loop.js:2078`) still asks, through `FILES_ASK` (911), "for an ask, the paths its recommended change would touch", which covers a decided call returned as `ask`. That disagreement is the finding to fix (unattended section, point 2), and `agent-os/standards/workflow/agents.md:50` says how: a list "is asked for in one meaning in every sentence of a prompt that asks for it" (#103, R2-5, the same clause against the ask-rules block). The qualification sits outside the block, which `agent-os/standards/workflow/replay.md:23` ("A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt") reads against at first sight. Its reason is byte-identity, and the clause is qualified only under the block's own condition (`decided.length`), so every reshape prompt without the block stays byte for byte as it is. Both lines hold; standards item 5 below records how.
   Decided by: redline
5. **R1-5: did a spec decide what a decided call is shown as?** It was left, then not taken. #99's spec, decision 14 (`agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md:41`): "`plannedFiles`, `effectiveDispositions`, the reshape prompt and the plan approver's file are not touched: a decided call is still shown to the plan approver and the implementer as the shaper sorted it, with the decision beside it, since what they are shown is #106's subject." #108's round 1 declined the same view on that decision (`agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md`, Unattended answer 6 and Declined, R1-3). This pull request, #106, settles the files shown and not the disposition: its decision 11 is about the list, and its own check pins an answered call as shown `["ask",["app/x.php"]]` (`tests/loop-test.mjs:3260`). The PR description lists "the resolve agent's and the plan approver's files" as unchanged. So no spec decided against showing the stated end, and once #106 closes nothing tracks it. The `shown` line (3968) is context in this pull request's diff. Sorted as a deferral (Decision 5).
   Decided by: redline
6. **R1-7: which words does a decided deferral show after a reshape moves its task?** The pull request's spec answers: the decision's. Its decision 10 (`shape.md:29`): "it drops a decided finding's disposition and deferred entry from a reshape on purpose (#94, R8-6; #97, R3-6), since they say what was decided. It takes the `files`, which say how the plan carries the decision." The entry is where the mitigation's words live. The workflow says the same at the drop (`workflows/redline-loop.js:4118-4122`): "a reshape's entry for it would replace that one, so a restated draft would swap the one filed and a restated mitigation the words shown beside it." So taking the reshape's words would undo a choice the spec records as deliberate. Showing none would also break with it: the person would no longer see the words they decided. What disagrees with the answer is the spec's own reader list, whose `draftView` row (`shape.md:70`) gives "The list." as what "the mitigation's words when it ships" read after the change, plus the view's comment and the docs, which do not say where the words come from. That disagreement is the fix (point 2): the row, the two comments and the docs say the words are the decision's, and a loop case pins it (Decision 7).
   Decided by: redline
7. **R1-6: does the pull request's spec say how a reshape's list is compared?** Only as sets. Decision 16 (`shape.md:40`): "The lists are compared as sets. When the set is equal the stored list is kept as it was". Nothing in it, in `vetShape` or in the `strings` schema (649) reads a path's form. The approver's list is the one place a path is read another way: `planPaths` takes off `${repoRoot}/` (4154). So one form for a task's paths is new here and decided on its merits (Decision 6).
   Decided by: redline
8. **R1-1: which route does a standards correction take?** The retrospective. `agent-os/standards/process/standards-retrospective.md:7`: "In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit". #83's round 2 brought a standards correction this way (`agent-os/specs/2026-11-09-1423-83-review-round-2/shape.md`, Unattended answer 3, R2-2), and `agents/redline-implementer.md`, rule 4, gives the commit message that names the finding it finishes. The spec records and the loop test's comment that give the same reason are plan files, corrected in R1-1's own task.
   Decided by: redline
9. **R1-3: is the reshape told what each decided finding's decision ends in?** No. `reshapePrompt` (2060) takes the ids alone, and `stated` lives in `revise()`. The resolve agent's decided entry records "the finding ID and title, the option chosen, the decision's `notes` verbatim, its date, and the line `Decided by: ...`" (`agents/redline-resolve.md`, step 2), not the end it states. The hold that reads the end, `endsIn` (4099), is the one place that knows it. So the reshape can only infer it from the task's wording, and an answer that keeps the behaviour and ships a comment is a fix (`agents/redline-resolve.md`: "A choice that keeps the behaviour and still ships something, a code comment say, is a `fix`").
   Decided by: redline
10. **R1-2: is the claim right?** Yes. The removed line in this pull request's diff, `return decision && shown.disposition === 'defer' ? { ...shown, files: plannedFiles(f.id) } : shown`, gave the resolve's task only to a finding shown as `defer`; every other decided finding was shown `f.files`, the shaper's list on the first pass and the reshape's after one. The spec's decision 11 says so (`shape.md:32`). The draft and both warnings read `roundDeferrals` (4288, 4302), deferrals only. The reshape's label is `reshape ${pass.tag} #${adjustment + 1}` (4065), and `pass.tag` is `h${n}` in a human review pass (459).
    Decided by: redline
11. **This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`.** The pull request's description warns that "a round that edits either meets #81". In this repository a relaunch runs the script the run launched with, and later rounds load the edited agent file (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). Rule 10 of the agent file gains one clause, which agrees with the prompt either way: a prompt that names each decided finding with its end, or one that names the ids alone.
    Decided by: redline
12. **Scratch test.** None written. There is no PHP in this repository, and every question above was settled by reading the files cited. The harnesses run through `.claude/redline/checks.sh` only.
    Decided by: redline

## Decisions

1. **R1-1: fix.** The reason is wrong for two settings. `raisesDrafts` is `interrupt !== 'autopilot' && (deferAt === 'round' || pass.human)` (3704), and `openDrafts` returns `[]` when it is false (3728). So on autopilot, and with `defer at end` on a Redline round, no round stop raises the draft at all. The standard's clause (`agent-os/standards/workflow/agents.md:10`), the spec's decision 18 (`shape.md:42` and `plan.md:38`) and the loop test's comment (`tests/loop-test.mjs:3309-3310`) each give "answered before a reshape can run" as the only way. The spec records and the comment are corrected in Task 2. The standard's line is corrected through standards item 1, in the round's standards commit, which names R1-1. The pull request's description gives the same reason, and no Redline role edits it.
   Decided by: redline
2. **R1-2: fix.** The bullet in `docs/running.md` (127) is reworded. The plan approver's next pass and the implementer are shown the reshaped files, and so, for a deferral, are the end-of-run draft and the two warnings. Before #106, only a deferral set as a disposition was shown its task as first planned, and every other decided finding the shaper's list, then the reshape's. The resume label gains `reshape h<n> #<k>`. Two key phrases are pinned beside the bullet's others (`tests/loop-test.mjs:2924`).
   Decided by: redline
3. **R1-3: fix.** `endsIn` moves from the reshape loop (4099) up beside `stated`, unchanged. The reshape call passes each tracked id with its end, and the block names each as `R1-1 (fix)`, `R1-2 (accepted)` or `R1-3 (deferred)`, then says "Each is named with what its decision ends in." The block still opens with the words the mock and the loop checks read. Rule 10 of `agents/redline-shaper.md` says the prompt names each with its end. Only reshape prompts that carry the block change, and those are new in this pull request.
   Decided by: redline
4. **R1-4: fix.** A second constant, `FILES_ASK_DECIDED`, beside `FILES_ASK` (911). It keeps the recommended paths for "an ask still pending" and sends "a finding named above as decided" to its task as `plan.md` holds it. The reshape's Return sentence uses it only when the block is present. A reshape prompt with no block keeps `FILES_ASK`, byte for byte. The existing check that cuts the block out and compares with the undecided round's prompt also puts the clause back. One check pins the decided round's clause, and one check over every scenario names any reshape prompt that carries the block beside the unqualified clause, as `strayDecidedBlock` does for the block (`testing/tests`, line 16).
   Decided by: redline
5. **R1-5: defer, with no mitigation.** The cause is the `shown` line in `effectiveDispositions` (3968), which this pull request did not change. The scenario's implementer view is the same before and after it (the verifier's own trace). The full fix changes what the plan approver and the implementer are shown in every round with an answered call, so the agents' rules for a shown `accept` have to be read first. That is a change beyond the task list #106 settled (answer 5). No cheap mitigation fits inside the pull request. R1-3's block makes the re-sort it needs less likely, since the reshape is told the call's end, but R1-3 is its own fix and is not this finding's task. Drafted issue under `## Deferred`.
   Decided by: redline
6. **R1-6: fix.** A helper, `cleanPaths`, beside `taskFilesOf` (483). Each path is trimmed, `${repoRoot}/` or a leading `./` is taken off, and a blank is dropped, before `unique`. `taskFilesOf` reads its result, so the resolve-time holds and the list the round keeps (`decidedFiles`, set from `taskFiles` at 3953) read one form. The reshape loop reads the reshape's `files` through it (4079). That one placement also closes the resolve-time `['']` gap the verifier notes as predating this pull request (3933, 3944), at no extra cost and with a case of its own. Leaving it would keep the holds on the raw list and the stored list clean, two readings of one fact (#103, R3-6). `taskFilesOf`'s comment, which still says "plannedFiles every resolve's of the round", the reading #106 removed, is corrected in the same edit (`workflow/agents`, line 17: a comment that restates a rule is changed with it).
   Decided by: redline
7. **R1-7: fix, by recording and pinning what the spec chose.** The words stay the decision's (answer 6). The reader-list row in the pull request's `shape.md` (70) is corrected to say so. The comments on `draftView` (3478-3481) and `deferredEntry` (3456-3460) say where the words come from after a reshape. `docs/running.md`'s bullet says it to the person. A loop case on the end-of-run stop pins the view: a reshape that moves a decided deferral's task and restates its entry, with a commit of its own landing, shows `ships: true`, the resolve's words and the reshaped files. The pin held before this round, so it is seen red under a mutation of the drop it turns on (`testing/tests`, line 35).
   Decided by: redline
8. **Task order.** Tasks 4 and 5 both change `reshapePrompt` and `tests/loop-test.mjs`. Tasks 3 and 7 both change the same bullet of `docs/running.md`. Tasks 2 and 7 both change the pull request's `shape.md`. Each task's anchors are as the tasks before it leave them, and each task changes different sentences.
   Decided by: redline
9. **As built: Task 3's green was seen one run late.** Task 3 was committed after a `grep -cF` found each of its three bullet phrases once, and before a gate run of its own. Its two pins were seen passing in the next gate run, Task 4's red run (1509 passed, 5 failed, all five Task 4's). Every other task saw its green before its commit. No change to any task or count follows. See `plan.md`, As built.
   Decided by: redline

### Proportionality

- **R1-4.** Likely and visible: the contradiction is in the prompt text of every reshape in a round with a decided call. Which sentence a reshape follows is model behaviour. When it follows the Return sentence, an accepted call listed with the recommended paths stops the round at stage `shape` against a correct `plan.md`, and a call stated as a fix carries the recommended option's paths to the plan approver and the implementer. Cost: one constant, one interpolation, one existing check's comparison widened, two checks. All inside code this pull request wrote. In proportion.
- **R1-5.** Unlikely. It needs a reshape that re-sorts a decided call, against its prompt's "a decision the person made, or the autopilot applied, stays as it is", and then an implementer that follows the shown disposition over `plan.md`'s task and the decision printed beside it. When it fires, the round stops at stage `check` after a repair, and nothing wrong is posted. The fix is one line, but it changes two agents' prompts in every round with an answered call, it needs the plan approver's and the implementer's handling of a shown `accept` or `defer` on a call checked, and its cause predates this pull request. Deferred (unattended section, point 4: "a cause in code it did not change").
- **R1-6.** Unlikely: it needs a resolve and a reshape that write one path two ways, or an agent that returns a blank path. Visible when it fires. A false warning goes into the run's result and the cap's `reshaped` detail, an odd path form is shown to every later reader, or a decided fix with only a blank path passes the hold and stops at the check after a repair, the failure the hold exists to prevent. Cost: one helper of one line, two call sites, one comment, three loop cases. Inside the pull request's file, and no existing scenario scripts a path the cleanup changes (searched), so no existing expectation moves. In proportion.
- **R1-7.** Unlikely: it needs a reshape that moves a decided deferral's mitigation and a commit of its own landing. Visible when it fires: the person sees words naming one file beside a list naming another. The record (`ships`, `files`) is right. Cost: two comments, one table row, one docs sentence, one loop case and one phrase pin. In proportion.

## Declined

None.

## Deferred

### R1-5: show a decided call by what the resolve agent stated it ends in

- **title:** Show a decided call to the plan approver and the implementer by what the resolve agent stated it ends in
- **mitigation:** (empty: nothing ships in this pull request)
- **found:** In a Redline round, `effectiveDispositions` in `workflows/redline-loop.js` builds the dispositions the plan approver and the implementer are shown for each finding. For a judgment call the person or the autopilot answered, the decision names no disposition, so the call is shown with the shaper's disposition (`ask`), or with whatever a reshape after a bounced plan re-sorted it to, and never with what the resolve agent stated the decision ends in (`stated`: `fix`, `defer` or `accept`), which `isDeferral`, `needCommits` and the hold after each reshape all read. A reshape that re-sorts a call stated as a fix to `decline`, against its prompt, therefore shows the implementer `decline` beside the line that a declined finding has no task and no commit, while `needCommits` still demands the call's commit, so an implementer that follows the shown disposition rather than the plan and the decision beside it skips the task, the check fails, the repair runs, and the round stops at stage `check`, whose resume starts at the build and cannot replan. The #99 spec left this view to #106 (its decision 14), and #106 settled only the files shown beside it.
- **why:** The line that builds the shown disposition predates the pull request it was found in, which changed only the files shown beside it, and the full fix changes what the plan approver and the implementer are shown in every round with an answered call, so their handling of a shown `accept` or `defer` on a call has to be checked first, which is a change of its own beyond that pull request's task list.
- **fullFix:** In `effectiveDispositions`, show a call the round tracks whose decision names no disposition by its stated end (the decision's own disposition when it names one, else `stated` for the call), check that the first branch of `needCommits` still leaves stated calls out and that `outcomesFor` reads a decided call by its decision as before, read the plan approver's and the implementer's agent files for how they treat a shown `accept`, and add loop cases: a call stated as a fix that a reshape re-sorts to `decline` is shown `fix` to the implementer and built, a call stated as accepted is shown `accept`, and a round with no answered call keeps its prompts byte for byte.

  Decided by: redline

## Standards retrospective (proposed)

Listed from Decisions 1 to 8 and the unattended answers; nothing went red while shaping. Item 1 carries part of R1-1's fix and is named in the standards commit's message (`finishing R1-1`). Items 2 to 5 are lessons and finish no finding. Each clause is appended to the end of its line, which it closes, and is read back in the whole line (process/standards-retrospective, line 10).

1. **`agent-os/standards/workflow/agents.md`, line 10: contradicts the code (R1-1).** Replace the line's last clause

   ```
   had none: a decided deferral's draft is answered before a reshape can run (#106)
   ```

   with

   ```
   had none: a decided deferral's draft is answered before a reshape can run, or, on autopilot or with `defer at end`, is never raised at a round's stop (#106; #114, R1-1)
   ```

2. **`agent-os/standards/workflow/agents.md`, line 10: missing (R1-7, Decision 7).** Append, after item 1's clause (or after `(#106)` when item 1 is not approved):

   ```
   ; and each thing a row says is shown is traced to what it is read from, one by one: the draft view's row gave the list as the source of the mitigation's words beside `files` and `ships`, and the words are read from the decision's entry, which no reshape replaces (#114, R1-7)
   ```

3. **`agent-os/standards/workflow/agents.md`, line 38: missing (R1-3, Decision 3).** Append, after `and a deferral is not held, since its mitigation is optional (#106)`:

   ```
   ; and the reshape is told what each decided finding's decision ends in, read as the hold reads it, beside its id, since an agent held to a rule by class can follow it only when told each item's class: the block named the decided ids alone, so a fix worded like an accept could be dropped and stop the round, until #114, R1-3
   ```

4. **`agent-os/standards/workflow/agents.md`, line 50: missing (R1-6, Decision 6).** Append, after `until #97, R4-5 and R4-6`:

   ```
   ; and a list of paths an agent returns is read through one cleanup before it is compared, stored or counted, each path trimmed, the repository root or a leading `./` taken off and a blank dropped (`cleanPaths`), so one file written two ways is one file and a list of blanks is no list: a reshape's `./app/x.php` was warned about as a change from the resolve's `app/x.php`, and `['']` passed the hold that stops a decided fix with no files, until #114, R1-6
   ```

5. **`agent-os/standards/workflow/replay.md`, line 23: missing, reconciling two lines (R1-4, Decision 4).** Append, after `in a round with a finding the person or autopilot decided and in no other (#106)`:

   ```
   ; and a sentence elsewhere in that prompt that states the field's general meaning is qualified under the block's own condition, so no sentence gives a finding the block names a second meaning (workflow/agents, line 50) and a prompt without the block stays byte-identical: the reshape's Return sentence still asked an ask for the paths of its recommended change beside the block until #114, R1-4
   ```

Already in a standard, no edit:

- A comment that restates a rule changes with it (`workflow/agents.md`, line 17): `taskFilesOf`'s comment, Decision 6.
- A rule over every prompt is pinned over every scenario (`testing/tests.md`, line 16): R1-4's check, Decision 4.
- A pin that already held is seen red under a mutation (`testing/tests.md`, line 35): R1-7's case, Decision 7.
- A docs change needs no Docs entry of its own (`process/docs-gate.md`, line 16): Tasks 3 and 7.

No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, as the pull request's spec records it: a decision the person made is held to the task the plan carries for it, and a reshape is told what that decision is (R1-3, R1-4); what the person is shown about a mitigation says where each part comes from (R1-7).

## Standards Applied

- workflow/agents — line 10, a class is settled by tracing each row to a path a run can take (R1-1, R1-7); line 17, a rule a prompt states is changed in the agent file and in every comment that restates it (R1-3, R1-6); line 38, the hold after each reshape (R1-3, R1-6); line 47, every agent is shown the list the workflow reads (R1-6, R1-7); line 50, a list is asked for in one meaning in every sentence, and the words are shown only beside a mitigation that ships (R1-4, R1-7).
- workflow/replay — line 19, a reshape stopped by the workflow's check is told to correct the task (R1-3's stops, unchanged); line 23, a new ask sits in the block, and a block that only says what a field means needs no new key (R1-3, R1-4).
- testing/tests — line 7, a reshape mock answers what the prompt asks, read from the prompt (R1-3's parse); line 16, a rule over every prompt is pinned over every scenario (R1-4); line 35, red before green, and a pin seen red under a mutation (R1-7); line 36, the byte-identical claim (R1-3, R1-4 and R1-6 change no prompt of a round without a decided finding).
- process/docs-gate — one Docs entry per touched plugin file, in its task; a docs change needs none of its own.
- process/release — no bump in a review round of the same pull request.
- process/standards-retrospective — the edits are proposed here and applied in one commit; an appended clause is read back in its line.
- prompts/attribution — none anywhere, the drafted issue included.
