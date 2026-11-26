# PR #127 review round 4: a rule named only in a call beside an undeclared tag, a draft too short to keep, a decided finding a reshape leaves with its task, and a typed defer on a call with two drafts

Spec folder: `agent-os/specs/2026-11-25-1418-127-review-round-4/`

Shaped by Redline in unattended mode, for review round 4 of PR #127 (issues #105, #75 and #126), from the round's four findings (`redline/round-4-review.json`, `redline/round-4-findings.json`). Reshaped twice after the plan approver's bounces, both on Task 4 (adjustment 1, then adjustment 2): see "Adjustment 1" and "Adjustment 2" in `shape.md`.

- `fix`, one task each, in finding order: R4-1 (Task 2), R4-2 (Task 3), R4-4 (Task 4), R4-3 (Task 5).
- No `decline`, no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#105)`. No commit subject holds a bare `@word`.

Line numbers are at `20a7603`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`, `skills/redline/SKILL.md` and `agents/redline-shaper.md`**, which the pull request's own caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"), and a changed agent file is reported, never pinned.

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 2: `forceAskRules`, the call-reason lookup (3973-3986).
  - Task 3: `forceAskRules`, after `const kept` (4018).
  - Task 4: `forceAskRules`, the line `s.askRule = rule.id` (4021) and the function's first line (3959), as Tasks 2 and 3 leave them; the approve loop: the reshape call (4945), after `vetShape` (4948), the hold (4984-4998); and `reshapePrompt`'s block (2398-2401).
  - Task 5: `resolveWith`, the `optionDraft` loop (4693-4702).
- `tests/loop-test.mjs`: every task adds checks. Task 4 also changes five existing scenarios and two existing checks (named there).
  - Each block named below goes after the check named, as the tasks before it leave the file.
  - The `left:` block's helpers (`rules`, `ruleArgs`, `cfg`, `BY_HAND`, `ACCEPT`, `DEFER`, `pickOf`, `typedDefer`, `filedCalls`, `deferredUnderRule`, 4821-4836; `billing`, `guard`, `later`, 5027-5029; `untagged`, `UNTAGGED`, `shownFiles`, 5082-5089; `CLEARED`, `markedTyped`, 5106-5112) are in scope there.
- `docs/running.md`: Task 3 (95), Task 4 (128), Task 5 (95). Tasks 3 and 5 change different clauses of line 95, each found by its own anchor text, and neither anchor lies in the text the other changes.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-4/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task adds its checks first and sees them fail on a gate run, then makes the change and sees them pass.
- The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-4/redline/snapshot.json`, which prints the failing check names. The count recorded is the harness's own summary line, read off the run.
- A pin whose outcome already holds before the change cannot be red before the build. It is written with the others, As built says so, and it is seen red under a mutation of the clause it turns on.
- If gate runs are slow, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own checks, and the combined run is recorded under As built.

**Existing checks.** A check whose scenario or expectation pins the behaviour a task removes follows the task in the same commit, and As built names it with the reason. Any other check that goes red is a fault in the task.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: save review round 4 spec for PR #127 (#105)`.

## Task 2: R4-1 — a call asked under a declared rule holds its finding to that rule, whatever its tag names

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/contract.md`

The warning for a tag that names no declared rule beside a call that names one is, for the scenario below, exactly:

`round 1: the shaper asked about R1-1 because of repository rule billing and tagged the finding with ask rule "billing-typo", which .claude/redline.json does not declare; it is left to the person under billing`

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after the check whose name opens `left: a call asked under a paths rule whose finding lies outside its paths is held to that rule`, add (`TYPO` the message above):
   - **Autopilot.** `go('left: a call asked under a prose rule, its finding tagged with a rule the repository does not declare, on autopilot', { ...baseArgs, askRules: billing, interrupt: 'autopilot' }, { ...untagged, askRule: { 'R1-1': 'billing-typo' } })`. Check:
     - the run is `done`;
     - `res.forced` holds `R1-1` under `billing`;
     - the `resolve r1` prompt includes `"rule": "billing"`;
     - the reply for `R1-1` opens `Redline round 1: left to @author under repository rule billing`;
     - `res.warnings` includes `TYPO`, and no warning includes `did not tag the finding` or `does not declare; ignored`.
   - **Guided, a pick of the option that ends in fix.** The same scenario with `decisions: pickOf('Change it', 'The author changes it.')`. Check:
     - the reply opens `Redline round 1: left to @author under repository rule billing`;
     - `shownAs(..., 'implement r1', 'R1-1') === 'ask'` and `shownFiles(..., 'implement r1', 'R1-1') === '[]'`;
     - no `repair r1` call.
   - **Neighbours that must not change.** The existing `left:` checks of the untagged call (R3-6) and the tagged one, and the `rules:` check whose name opens `rules: an unknown tag is cleared with a warning, by the reviewer and by the shaper`. That one covers a fix with an unknown tag and no call: it is still fixed, with the `ignored` warning.
   - Seen red: both new cases.
2. **Green.** In `forceAskRules` (3979), the condition `if (!rule && !tagged && s.disposition === 'ask')` becomes `if (!rule && s.disposition === 'ask')`.
   - When `named` names a declared rule, the warning pushed is the message above when `tagged` is set, and R3-6's (`... and did not tag the finding with it; it is left to the person under that rule`) when it is not.
   - The branch at 3987-3990 is unchanged, so a tag that names no declared rule with no rule found by any input is still warned about as ignored.
   - The comment above the lookup says why: R3-6 gated the lookup on the tag being absent, where the question is whether any input named a declared rule, so an undeclared tag ran the call as an ordinary one (#127, R4-1).
3. In `docs/contract.md`, "Ask rules", the `prose` bullet (153): "a call the shaper asks under `repository rule <id>` with no tag on its finding is held to that rule the same way, with a warning" becomes "a call the shaper asks under `repository rule <id>` with no tag on its finding, or with a tag that names no declared rule, is held to that rule the same way, with a warning".

**Proof:** the gate run shows the new checks passing, and `grep -c 'or with a tag that names no declared rule, is held to that rule the same way' docs/contract.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/contract.md`, "Ask rules", updated in this task.

**Commit:** `redline: R4-1 hold a finding to the rule its call names when its tag names no declared rule (#105)`

## Task 3: R4-2 — a shaper deferral whose draft a rule cannot keep is warned about

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

The warning is, for the first scenario below, exactly:

`round 1: the shaper deferred R1-1 with no complete drafted issue (missing why); repository rule craft-config leaves it to the person, and the draft is not kept as an option of its call, since only a complete one is`

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after the R3-7 check that reads the `periodTitle` scenario (the one after the check whose name opens `left: the call for a finding the shaper deferred under a rule keeps the drafted issue`), add:
   - **A blank field.** `go('left: the shaper deferred a finding under a rule with a draft short of a field', ruleArgs, { ...deferredUnderRule, drafts: { 'R1-1': { why: '   ' } } })`. Check:
     - the run stops at the hand-off (`status === 'handoff'`);
     - the call for `R1-1` lists `[["Make the change by hand after the run","fix"],["Accept, no change","accept"]]` as label and end, and `recommended` is `BY_HAND`;
     - `res.warnings` includes the message above.
   - **No draft at all.** The same with `noDraft: ['R1-1']` in place of `drafts` (the mock's entry then carries `fullFix` alone). `res.warnings` includes the same message with `missing title, found, why`.
   - **Neighbour that must not change.** The existing check whose name opens `left: the call for a finding the shaper deferred under a rule keeps the drafted issue` still passes, and its run's warnings hold no `with no complete drafted issue`.
   - Seen red: both new cases.
2. **Green.** In `forceAskRules`, after `const kept = ...` (4018): when `s.disposition === 'defer'` and `kept` is null, push the message above, with the fields `draftMissing(shaperEntry)` names joined by `, ` (an absent entry names all four). The comment at 4012-4016 gains: a draft that cannot be kept is warned about with what it lacks (#127, R4-2). No stop is raised, as the comment already says, since the option would be one the shaper never wrote.
3. In `docs/running.md`, "Left to you" (95): after the anchor `the draft the workflow kept, offered as \`Defer to an issue\` and recommended`, insert `; a draft short of a field is not kept, and the run warns with what it lacks`. The `.` that follows stays.

**Proof:** the gate run shows the new checks passing, and `grep -c 'a draft short of a field is not kept, and the run warns with what it lacks' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Left to you", updated in this task.

**Commit:** `redline: R4-2 warn when a rule drops a shaper's draft that is short of a field (#105)`

## Task 4: R4-4 — a decided finding a reshape leaves to the person is held to no task with files

**Files:** `workflows/redline-loop.js`, `agents/redline-shaper.md`, `tests/loop-test.mjs`, `docs/running.md`

**The rule's clause, stated once.** The reshape prompt's block (step 2) and `agents/redline-shaper.md` rule 10 (step 4) both gain this clause, word for word (`LEFT_KEEPS_NONE`):

`and one left to the person keeps none: its task is "Left to the person: <id>" with no files`

In each place it follows `and one decided as accepted keeps none` after `, `. Every check below that reads the clause reads this text, and its phrase `one left to the person keeps none` is in it.

The hold names a decided finding left to the person with a task with files in one of two wordings. Each is the case's own: what the rule asks of it, and the way out a resumed reshape can take (agents.md line 16).

- **Left by a tag, a call's reason, its own file, or before this reshape** (`KEPT_TASK(rule, files)`). For the first scenario below it is exactly:

  `the reshape left R1-1, a finding decided by @author and left to the person under repository rule billing, with a task with files (app/x.php); no task writes anything for a finding left to the person`

  The finding stays left when its files go: its tag, its call's reason or its own file still names the rule, or the entry `record.forced` holds for a decided finding left before stands (`forceAskRules`, "the entry it was decided on stands"). Two or more such findings join with `; `, each named as above, before the one closing clause.
- **Newly left only through the files this reshape lists** (`BY_TASK(id, rule, files)`). Here the rule comes only from a paths rule on the files the reshape lists for the finding: not from its own file, not from a declared tag, and not from its call's `repository rule <id>`. Removing those files alone takes the finding out from under the rule: the resumed reshape is shown it with its decision, and `forceAskRules` finds no rule. A fix is then held again as a fix with no task. For the rewritten `reshapedUnder` scenario the wording is exactly:

  `the reshape left R1-1, a finding decided by @author, under repository rule billing-code only through the files of its task (app/billing/charge.php); to keep the decision, move the change off the rule's paths, and to leave it to the person, return it as an ask with no files whose call names repository rule billing-code, since removing its files alone takes it out from under the rule`

  Each such finding is its own clause.

Each clause is one entry of the hold's `left` list, so it joins the hold's other kinds with `; and `, as they join each other (4997).

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after the check whose name opens `left: a decided deferral a reshape leaves to the person is shown with no mitigation after the reshape`, add (`KEPT_TASK(rule, files)` builds the first message above):
   - **A decided deferral whose task the reshape keeps.** `go('left: a call whose decision names defer, left to the person by a reshape that keeps its task', { ...baseArgs, askRules: billing, decisions: typedDefer(), deferrals: goAhead('R1-1') }, { ...later, reshapeFiles: { 'R1-1': ['app/x.php'] }, commitIds: [['R1-1'], []] })`. Check:
     - `status === 'error'`, `stage === 'shape'`, `ownCheck === true`, `resumeFrom.label === 'reshape r1 #1'`;
     - `error === KEPT_TASK('billing', 'app/x.php')`;
     - no `plan approver r1 #2` and no `implement r1` call.
   - **A decided fix whose task the reshape keeps.** The same with `decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } }` and no `resolveDeferred`. The same stop and message.
   - **The task left with no files.** The `later` scenario as step 3 changes it. Check:
     - the run is `done`;
     - the `plan approver r1 #2` prompt shows `R1-1`'s decision with `"rule": "billing"`.
   - **A finding already left at a later reshape.**
     - Setup: `ruleArgs`, the shaper's deferral of `cfg` under `craft-config`, the person picks `DEFER` (`pickOf(DEFER, tracked)`), `deferrals: goAhead('R1-1')`, `planBounce: 2`, `reshapeFilesAt: { 'reshape r1 #2': { 'R1-1': ['app/x.php'] } }`.
     - Check the stop: at `shape`, `resumeFrom.label === 'reshape r1 #2'`, `error === KEPT_TASK('craft-config', 'app/x.php')`.
     - Check the prompts: the `reshape r1 #1` prompt includes `Findings the person or the autopilot decided: R1-1 (left to the person).` and `LEFT_KEEPS_NONE`.
   - **Neighbour that must not change.** The `reshape:` check whose name opens `reshape: the block names each decided finding with its end` still passes. A reshape prompt that names no left finding holds no `one left to the person keeps none`: check that on the existing `emptied` run.
   - **The shaper's file.** In the `reshape:` section, after the check whose name opens `reshape: the shaper's file says the invoking prompt names each decided finding with what its decision ends in` (3614), add `check('reshape: the shaper\'s file says a decided finding left to the person keeps no task', shaperFile.includes(LEFT_KEEPS_NONE))`. Before step 4 it is red: `grep -c -F 'one left to the person keeps none' agents/redline-shaper.md` prints `0`. After step 4 the same command prints `1`.
   - **Left only through the reshape's files, and the way out.** In the `rules:` section, beside `reshapedUnder` (1626), whose check step 3 rewrites (`BY_TASK` the second message above):
     - `go('rules: a call answered with a fix that a reshape returns as an ask under the paths rule its task named, with no files', { ...baseArgs, askRules: billingPaths, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-21' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAsk: ['R1-1'], callAt: { 'reshape r1 #1': { 'R1-1': { why_human: 'repository rule billing-code' } } }, reshapeFiles: { 'R1-1': [] }, commitIds: [[], []] })`. The call's reason is scripted on the reshape alone (`callAt`), since `whyHuman` reaches the first shape too and would leave the finding there, before the reshape the case is about. Check:
     - the run is `done`, with no `repair r1` call;
     - `res.forced` holds `R1-1` under `billing-code`;
     - the reply for `R1-1` opens `Redline round 1: left to @author under repository rule billing-code`;
     - no error or warning includes `only through the files of its task`.
   - Seen red: every check above but the neighbour, the rewritten `reshapedUnder` check (it finishes `done` before the change), and the two existing checks step 3 rewrites (their new expectations do not hold before the change). The way-out case finishes `done` before the change as well, since today's hold reads no left finding. It is a pin that holds before the build: As built says so, and it is seen red under a mutation that holds every newly left decided finding whatever its files (the left kinds' `.length > 0` test dropped).
2. **Green.** In `workflows/redline-loop.js`:
   - **What `forceAskRules` found the rule by.** Add a module-level `const leftByTask = new Set()` beside `forceAskRules`, cleared on the function's first line (`leftByTask.clear()`). Just before `s.askRule = rule.id` (4021), add `f.id` to it when the rule came only from the files the shaper lists for the finding. That holds when all three of these hold, read before the call's reason is rewritten below:
     - `ruleForPaths([f.file || ''])` is null;
     - `tagged` names no declared rule (`!(tagged && ruleById[tagged])`);
     - the shaper's call for the finding, if any, does not give `repository rule <id>` for a declared `<id>`. This is read as Task 2's lookup reads `named`, for any ask, not only when no rule was found.

     The set is read only by the hold right after the same `vetShape`. It is never written to the record, so the record, the prompts and every replayed result are unchanged. The comment says why: a rule found only through the listed files goes when they go, so the hold's message for such a finding names the two ways out (#127, R4-4).
   - **The decided list** (4945): before the reshape call, take `const named = inScope.map((f) => f.id).filter((id) => roundDecisions[id])` and `const leftBefore = new Set(Object.keys(record.forced))`. Pass `named.map((id) => ({ id, end: record.forced[id] ? 'left' : endsIn(id) }))` to `reshapePrompt`, where it passes `.filter(tracked)` today. A tracked finding is named as today.
   - **`reshapePrompt`** (2398-2401): `endWord` gains `left: 'left to the person'`. When any named finding's end is `left`, the block's sentence `A finding decided as a fix keeps a task with files, and one decided as accepted keeps none.` becomes `A finding decided as a fix keeps a task with files, and one decided as accepted keeps none, ` followed by `LEFT_KEEPS_NONE` and `.`. With none it reads as today, byte for byte.
   - **After `vetShape`** (4948): for each id of `named` in `record.forced` and not in `leftBefore`, set `rule` on `roundDecisions[id]` to `record.forced[id].rule`, and `own` to true when `record.forced[id].own`, as `resolveWith` does (4633-4636). The comment says why: no resolve applies such a decision again, so the plan approver's next pass and the implementer would otherwise be shown it without the rule (#127, R4-4).
   - **The hold** (4984-4998). Take `const leftTasked = named.filter((id) => record.forced[id] && cleanPaths(...the files the reshape lists for id...).length > 0)`, the files read as the list update reads them (4961-4962). Split it in two:
     - `byTask`: the ids in `leftByTask` and not in `leftBefore`. Each is its own entry of `left`, worded as `BY_TASK` with `roundDecisions[id].decidedBy`, `record.forced[id].rule` and the files.
     - The rest: one entry of `left`, worded as `KEPT_TASK` with `roundDecisions[id].decidedBy`, `leftUnder(record.forced[id])` and the files.

     Both go through the one `throw checkError('shape', \`the reshape left ${left.join('; and ')}\`, ...)`.
   - The comment above the hold says a decided finding left to the person is held to no task with files there (#127, R4-4). The reason: the resolve that applies a left call rewrites its task (R3-10's check), but a decided call a reshape newly leaves sets off no resolve, and one left before is not named to a reshape as tracked. It also says why one left only through its listed files is worded apart: removing the files alone un-leaves it, so the message names the change that keeps the decision and the return that leaves it to the person.
   - The `resume:` pins at 1731-1732 do not move: no throw site is added. Read `sites("throw checkError('shape', ")` and `sites("throw checkError('shape', \`the reshape left ")` off the source with `grep -c` after the change, and confirm they still read `11` and `1`.
3. **Existing scenarios and checks that follow.**
   - **Scenarios whose reshape keeps a left finding's task.** Each scripts a reshape that leaves a decided finding to the person while keeping the task its first resolve planned. The mock reshape lists that task by default (`taskOf`, `tests/loop-test.mjs:233`). Each now gets the state the rule asks for, so it keeps proving what it was written for:
     - `later` (5029), read by `namedLater` and `statedLater`: add `reshapeFiles: { 'R1-1': [] }`.
     - `forcedLater` (4022) and `forcedNamed` (4029): add `reshapeFiles: { 'R1-1': [] }`.
     - `forcedDefer` (3631): `reshapeFiles: { 'R1-1': ['app/y.php'] }` becomes `{ 'R1-1': [] }`, and its check's `'["ask",["app/y.php"]]'` becomes `'["ask",[]]'`. Its name's claim, that the files are not taken or warned about, still holds.
     - `reshapedUnder` (1626): the reshape's task, `app//billing/charge.php`, is what puts the finding under `billing-code`, so the run now stops at that reshape. Its check becomes:
       - `status === 'error'`, `stage === 'shape'`, `ownCheck === true`, `resumeFrom.label === 'reshape r1 #1'`;
       - `error === BY_TASK` for `R1-1`, `billing-code` and `app/billing/charge.php`, the message pinned in full.

       That still proves what #114, R3-3 pinned: the doubled slash is read as under the rule, and the message names the path as read once. Its comment says so, and says the new case beside it is the way out the message names.
   - **`twoDecided`'s check** (`tests/loop-test.mjs:3610-3611`, the `reshape:` section). In that scenario R1-2 is a call left to the person under `billing` at the first shape and decided by the person. Today the block leaves it out, and the check pins that, in its expectation and in its name. Task 4 names every decided finding to the reshape, a left one as left to the person, so the block now reads `R1-1 (fix), R1-2 (left to the person). `. The scenario stays as it is. The check becomes:
     - name: `reshape: the block names each decided finding, a left one as left to the person, and never one nobody decided`;
     - expectation: `twoDecided.res.status === 'done'`, the reshape prompt includes `${DECIDED_BLOCK}R1-1 (fix), R1-2 (left to the person). `, and it includes `LEFT_KEEPS_NONE`.

     The run still finishes `done`: R1-2's first resolve planned no files for it (the mock resolve gives a left call `[]`, `tests/loop-test.mjs:335`), so the reshape lists none, and the hold has nothing to stop on. R1-3, which nobody decided, is still not named.
   - **The shaper's file check of the ends** (`tests/loop-test.mjs:3614`). It pins `each with what its decision ends in (fix, accepted or deferred)`, which step 4 rewrites. Its expectation becomes `each with what its decision ends in (fix, accepted, deferred or left to the person)`. Its name, which says the shaper's file names each decided finding with what its decision ends in, still holds and stays.
   - As built names each of these with its change and the reason: the behaviour it pinned, a left finding's task read by no check after a reshape or a left finding left out of the block, is the one this task removes.
   - Any other check the change turns red is a fault. The only exceptions are another scenario whose reshape keeps a left finding's task, and another check that pins the decided block's list or rule 10's words as they read before the change. Such a check follows the same way, and As built names it with its change and the reason.
4. In `agents/redline-shaper.md`, rule 10 (34):
   - "each with what its decision ends in (fix, accepted or deferred)" becomes "each with what its decision ends in (fix, accepted, deferred or left to the person)".
   - "and one decided as accepted keeps none" becomes "and one decided as accepted keeps none, " followed by `LEFT_KEEPS_NONE`, that is: "and one decided as accepted keeps none, and one left to the person keeps none: its task is "Left to the person: <id>" with no files".

   The rest of the sentence stays, so the text that follows still opens ", and a decided fix keeps a task of its own".
5. In `docs/running.md`, "A reshape after your decision" (128), the closing sentence "A finding left to you under a repository rule is outside all of this: no task writes anything for it." becomes "A finding left to you under a repository rule keeps no task that names files, and the same stop holds it to that: the reshape is told it is left to you, and one that keeps or gives it such a task, a decided finding the reshape itself has just left to you included, stops the run at stage `shape`, resumable at that reshape (#127, R4-4); when only the files of that task put it under a paths rule, the stop names the two ways out, since removing the files alone takes it out from under the rule: move the change off the rule's paths to keep your decision, or return the finding as an ask with no files whose call names the rule to leave it to you." The phrases the `docs:` check at `tests/loop-test.mjs:3194` pins on that line are kept.

**Proof:** the gate run shows the new checks passing, and the five scenarios and two checks above green with their changes. `grep -c -F 'one left to the person keeps none' agents/redline-shaper.md` prints `1`. `grep -c 'when only the files of that task put it under a paths rule, the stop names the two ways out' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js` and `agents/redline-shaper.md`: `docs/running.md`, "Deferred items", "A reshape after your decision", updated in this task.

**Commit:** `redline: R4-4 hold a decided finding a reshape leaves to the person to no task with files (#105)`

## Task 5: R4-3 — a typed defer on a left call with more than one drafted issue is warned about

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `skills/redline/SKILL.md`, `docs/running.md`

The warning is, for the scenario below, exactly:

`round 1: the decision for R1-1 is a defer typed for a call that offers 2 drafted issues (Track it, Track the class); none of them is taken, so the draft filed is one the resolve agent writes, shown before it is filed; a pick of one of those options files its draft`

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after the check whose name opens `left: a later resolve's entry for a left deferral an earlier resolve applied is dropped with a warning`, add:
   - **The scenario.**
     - Args: `ruleArgs`, `decisions: markedTyped`, `deferrals: goAhead('R1-1')`.
     - Scenario: `{ reviews: [[cfg], []], ask: ['R1-1'], whyHuman: { 'R1-1': 'repository rule craft-config' }, callOf: { 'R1-1': { options: [...], recommended: 'Track it', recommendation: 'Track it' } }, resolveDeferred: [{ id: 'R1-1', mitigation: '', fullFix: 'the agent lock', title: 'Agent title', found: 'found by the agent', why: 'why the agent' }], commitIds: [[]] }`.
     - The three options: `{ label: BY_HAND, cost: 'c', effect: 'e', ends: 'fix' }`; `{ label: 'Track it', cost: 'c', effect: 'e', ends: 'defer', draft: { title: 'Track one', found: 'f1', why: 'w1', fullFix: 'x1' } }`; `{ label: 'Track the class', cost: 'c', effect: 'e', ends: 'defer', draft: { title: 'Track all', found: 'f2', why: 'w2', fullFix: 'x2' } }`.
   - **Check:**
     - the run is `done`;
     - the `file deferred r1` prompt includes `# Agent title` and neither `Track one` nor `Track all`;
     - `res.warnings` includes the message above.
   - **Neighbour that must not change.** A typed defer on the shaper's own deferral under the rule, whose call carries one drafted option (`DEFER`), files that option's draft with no such warning: `{ ...ruleArgs, decisions: markedTyped, deferrals: goAhead('R1-1') }` over `deferredUnderRule`, its `file deferred r1` prompt including `# Lock R1-1`.
   - **The texts.** `skills/redline/SKILL.md` includes `or more than one, one the resolve agent writes`, and `docs/running.md` includes `and so does one on a call that offered more than one, with a warning`.
   - Seen red: the warning and the two text checks.
2. **Green.** In `resolveWith`, in the loop over left deferrals (4693-4702), after `const source = ...`: when `!picked`, `roundDecisions[id].option === undefined` and `drafted.length > 1`, push the message above. The options are named by `optionLabel`, joined with `, `, and the count is `drafted.length`. The comment above the loop (4684-4691) gains: a typed defer names none of several drafted options, so none is taken, and the run says so (#127, R4-3).
3. In `skills/redline/SKILL.md`, "Deferring a finding left to the person (#126)" (213), "It defers the finding the same way, with the draft of the call's one drafted option or, when the call offered none, one the resolve agent writes." becomes "It defers the finding the same way, with the draft of the call's one drafted option or, when the call offered none or more than one, one the resolve agent writes; when it offered more than one, say so when you say the answer back, and that picking one of those options would file its draft." The words the `left:` checks pin there are kept.
4. In `docs/running.md`, "Left to you" (95), "(a typed defer on a call that offered no draft has the resolve agent write one)" becomes "(a typed defer on a call that offered no draft has the resolve agent write one, and so does one on a call that offered more than one, with a warning, since it names none of them: pick the option to file its draft)".

**Proof:** the gate run shows the new checks passing.

**Docs:** `workflows/redline-loop.js` and `skills/redline/SKILL.md`: `docs/running.md`, "Dispositions", "Left to you", updated in this task.

**Commit:** `redline: R4-3 warn when a typed defer names none of a left call's drafted issues (#105)`

## Task 6: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-4/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its README or `docs/` section for every file it touches under `workflows/`, `skills/` and `agents/`. As built records each entry's commit.
- **11. Version.** `0.5.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it, applied in its own commit after the finding commits: `redline: record the round 4 review lessons in the standards (#105)`.
- **13. Spec folder.** `plan.md` gains an As built section in the last commit: `redline: record the as-built state of review round 4 for PR #127 (#105)`. It records each task's commit, its red and green counts read off the gate's summary line, every mutation run, and every existing check that followed a task and why. Any deviation is recorded under Decisions in `shape.md`.
