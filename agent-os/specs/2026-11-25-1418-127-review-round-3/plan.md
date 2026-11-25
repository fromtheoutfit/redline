# PR #127 review round 3: a typed defer at a later stop, a renamed link, a rule named only in a call, a left finding's task and mitigation, and seven texts and warnings put right

Spec folder: `agent-os/specs/2026-11-25-1418-127-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #127 (issues #105, #75 and #126), from the round's eleven findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). Corrected in place after the plan approver's first bounce (adjustment 1 of at most 2): Tasks 3, 5 and 7, as `shape.md`, "Plan adjustments", records.

- `fix`, one task each, in finding order: R3-4 (Task 2), R3-5 (Task 3), R3-6 (Task 4), R3-10 (Task 5), R3-1 (Task 6), R3-2 (Task 7), R3-3 (Task 8), R3-7 (Task 9), R3-8 (Task 10), R3-9 (Task 11), R3-11 (Task 12).
- No `decline`, no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#105)`. No commit subject holds a bare `@word`.

Line numbers are at `b696aee`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines; each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`, `skills/redline/SKILL.md`, `agents/redline-shaper.md` and `agents/redline-reviewer.md`**, which the pull request's own caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"), and a changed agent file is reported, never pinned.

**Task order matters in four files.**

- `workflows/redline-loop.js`:
  - Task 2: decision intake (237-283), the shaper's draft filter (4405-4406), `overridesFor` (4443), the approve loop's end (before `const finalDispositions`), `relaunch.how` (3025).
  - Task 3: `review()`, between the rename loop's end and `honourLinks(round, out.findings, linksAsked)` (3196).
  - Task 4: `forceAskRules`, the `tagged` and `rule` lines (3919-3920).
  - Task 5: `resolveWith`, after `const taskFiles` (4685) and at `deferred = deferred.map(...)` (4727); the reshape's rebuild `deferred = reshaped.concat(...)` (4916).
  - Task 7: `checkDrafts` (3846-3853).
  - Task 9: `forceAskRules`, the call's `recommendation` (3975).
  - Task 10: `resolveWith`, the unmatched-option warning (4514).
  - Task 11: `resolveWith`, `const returned` (4615).
  - Task 12: the own-commit loop (5102-5115).
- `tests/loop-test.mjs`: Tasks 2, 3, 4, 5, 7, 9, 10, 11 and 12 add checks; Task 5 changes the two count pins in the `resume:` section (1731-1732). Each block named below is added after the check named, as the tasks before it leave the file. The `left:` block's helpers (`rules`, `ruleArgs`, `cfg`, `BY_HAND`, `ACCEPT`, `DEFER`, `pickOf`, `typedDefer`, `filedCalls`, 4819-4832) are in scope there; a prose rule is written as the `reshape:` block's `chargeRule` is (`billing`, 3539).
- `skills/redline/SKILL.md`: Task 2, then Task 8, both at "Deferring a finding left to the person" (213); Task 8 also at 228.
- `docs/running.md`: Task 3 (86, the sentence that opens "The verifier marks a finding whose cause is one class"), then Task 7 (86, the sentence that opens "Each key is read in one place"), then Task 8 (95). Tasks 3 and 7 change different sentences of line 86, each found by its own anchor text, and neither anchor lies in the text the other changes, so neither edit moves the other's.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds checks adds them first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-3/redline/snapshot.json`, which prints the failing check names; the count recorded is the harness's own summary line, read off the run. A pin whose outcome already holds before the change cannot be red before the build: it is written with the others, As built says so, and it is seen red under a mutation of the clause it turns on. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built.

**Existing checks.** A check whose expectation pins the behaviour a task removes follows the task in the same commit, and As built names it with the reason; any other check that goes red is a fault in the task.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: shape PR #127 review round 3 (#105)`.

## Task 2: R3-4 — a typed defer for a left call is marked as a call's answer

**Files:** `workflows/redline-loop.js`, `skills/redline/SKILL.md`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`, at the end of the `left:` block, after the check whose name opens `left: the result tells a relaunching session how a finding left to the person is deferred`, add a block. Its scenario is the reviewer's: `askRules` the prose rule `billing`, two correctness findings `R1-1` and `R1-2`, `planBounce: 1`, `reshapeAskRule: { 'R1-1': 'billing' }`, `commitIds: [['R1-2'], []]`, guided.
   - **The stop.** The first launch stops at the reshape's raised call for `R1-1` (`status === 'handoff'`, `decisionsNeeded` `["R1-1"]`), and no `resolve r1` ran.
   - **The relaunch with a marked typed defer.** Relaunch with `decisions: { 'R1-1': { choice: 'defer', notes: 'The author defers R1-1 to an issue.', date: '2026-11-25', disposition: 'defer', call: true } }`, `deferrals: goAhead('R1-1')`, and a resolve that returns `[{ id: 'R1-1', mitigation: '', ...draftFor('R1-1') }]` (`draftFor` as the `reshape:` block writes it). Check: every call of the first launch has the same label and prompt in the relaunch, up to the stop; `resolve r1` does not run; `resolve r1 #1` runs and its prompt names `R1-1` with `"rule": "billing"` and `"disposition": "defer"`; no prompt of the relaunch holds `"call": true`; the run makes a `file deferred r1` call, and the reply for `R1-1` opens `left to` and ends `Deferred to #` and a number.
   - **The same answer unmarked** (no `call` key): `resolve r1` runs and its prompt holds the "Disposition overrides" block naming `R1-1`. This pins the reading this task keeps on purpose, the neighbour that must not change: a decision with a disposition and no marker is still a plan-dial override.
   - **A marker the round raises no call for.** A run with no ask rule and no bounce, the marked decision above on `R1-1`, a finding the shaper fixed: the run is `done`, `R1-1` is posted as the shaper's fix, and `res.warnings` holds `round 1: the decision for R1-1 answers a judgment call, but no shape of round 1 raised one for it; it is not applied`.
   - **Intake.** `call: 'yes'` and `call: false` are each refused before any agent runs, with a message that opens `args.decisions must give call as true, the mark of an answer to a judgment call, when it gives one; got "R1-1": `.
   - **The skill and the relaunch text.** `skills/redline/SKILL.md` includes `"disposition": "defer", "call": true`, and the result's `relaunch.how` includes `recorded with "call": true beside it`.
   - Seen red: the relaunch's checks, the warning, the intake refusals and the two text checks.
2. **Green.** In `workflows/redline-loop.js`:
   - **Intake** (after the `option` loop, 283): for each entry with `call !== undefined`, refuse any value but `true` with the message above; for `true`, add the id to a new set, `callAnswers`, and drop the key from the run's copy (`decisions[id] = rest`), so no prompt shows it. A comment says why: the typed defer for a finding left to the person is the one answer to a call that carries a disposition (#126), and a decision answering a call a reshape raised enters only with that call (`agent-os/standards/workflow/replay.md`, line 6), never as a plan-dial override (#127, R3-4).
   - **The shaper's draft filter** (4405-4406): `.filter((d) => !(decisions[d.item.id] && decisions[d.item.id].disposition && !callAnswers.has(d.item.id)))`.
   - **`overridesFor`** (4443): leave out an id in `callAnswers`. The comment above it says a decision marked as a call's answer is no override, whichever call it answers.
   - **The unapplied warning**: once the approve loop ends (before `const finalDispositions = effectiveDispositions()`), warn once for each in-scope id in `callAnswers` that is in no call of `calls`: `` `${pass.name}: the decision for ${id} answers a judgment call, but no shape of ${pass.name} raised one for it; it is not applied` ``. A warning, not a stop: the decision is the person's, and a round whose shapes replay raises the same calls.
   - **`relaunch.how`** (3025): after `or by "disposition": "defer" typed for it`, add `, recorded with "call": true beside it, since it answers a call`, keeping the words the `left:` check pins.
3. In `skills/redline/SKILL.md`, "Deferring a finding left to the person (#126)" (213): the record form reads `{"choice": "defer", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>", "disposition": "defer", "call": true}`, and one sentence after it says why, at every stop: the key marks an answer to a call, so a defer typed at a stop the round reaches after its first resolve (a reshape's) is applied by the resolve that call sets off and is never read as a disposition changed on the plan dial. Keep the words `` `<id>: defer. <reason>` typed for such a finding is recorded with `"disposition": "defer"` `` that the `left:` check pins. No other record form gains the key: a decline overrule, an override restated from `overridesUnresolved` and a draft's fix or accept are dispositions the person changed, applied by the round's first resolve.

**Proof:** the gate run after step 3 shows the new checks passing and nothing else red.

**Docs:** `workflows/redline-loop.js` and `skills/redline/SKILL.md`: `docs/running.md`, "Dispositions", "Left to you": no reader-facing change, since a typed defer now does at a reshape's stop what that section already says it does; the key is the session's record form, stated in `skills/redline/SKILL.md` and in `relaunch.how`, which this task updates.

**Commit:** `redline: R3-4 mark a typed defer as a call's answer, so a later stop's defer is never read as an override (#105)`

## Task 3: R3-5 — a class link that names a renamed id is cleared as ambiguous

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

1. **Red.** In `tests/loop-test.mjs`, at the end of the `class:` block, after the check whose name opens `class: the skill names a fix's cause in the plan dial's list`, add the reviewer's scenario: round 1 reviews `f('R1-1', 'correctness')`, fixed; round 2's review returns `f('R1-1', 'correctness')` and `f('R1-2', 'correctness', { sameClassAs: ['R1-1'] })`, which the rename makes `R2-1` and `R2-2`; `commitIds: [['R1-1'], ['R2-1', 'R2-2'], []]`. Check: `res.warnings` holds `round 2: the reviewer linked R2-2 to R1-1 as one class (sameClassAs), but this review renamed a finding it returned as R1-1 to R2-1, so the link is ambiguous; the link is cleared`; the `shape r2` prompt does not hold `Findings of this round that the verifier links to an earlier finding`; and the findings file in the `post r2` prompt gives `R2-2` no `sameClassAs`. Neighbour that must not change: the existing `class:` check of a link to a fixed earlier finding whose id the review did not rename still keeps the link. Seen red: the warning and the two prompt checks.
2. **Green.** In `review()`, after the rename loop and before `honourLinks(round, out.findings, linksAsked)`, for each finding whose `sameClassAs` is a list, remove every entry that, trimmed, is a key of `renamed`, pushing for each `` `round ${round}: the reviewer linked ${f.id} to ${old} as one class (sameClassAs), but this review renamed a finding it returned as ${old} to ${renamed.get(old)}, so the link is ambiguous; the link is cleared` ``; a list left empty is deleted, as `honourLinks` deletes one. A list in another form is left for `honourLinks`, which warns of it. A comment says why: the old id may name the sibling or the earlier finding, so it is cleared, never trusted or mapped (#127, R3-5).
3. In `docs/running.md`, "Dispositions", "Instance or class" (86), in the sentence that opens "The verifier marks a finding whose cause is one class": insert `, and one that names an id the review renamed, which may mean either finding` directly after the anchor text `refuses both in the reviewer's own run, and this is the second layer)` and before the `; and a fix for a finding that keeps one may not be an` that follows it. The clause goes after the parenthetical, never before it, so the parenthetical's "both" still names only the two cases the link-asking schema refuses in the reviewer's own run (a link beside `findings`, and one in a form that is no list of ids). That schema puts no pattern on a link's ids (`reviewSchema`, `workflows/redline-loop.js:889-901`), and a renamed id is cleared in `review()` alone, so the sentence must not say the schema refuses it. The sentence then reads: "...or in a form that is no list of ids (the schema of a review that is asked for links refuses both in the reviewer's own run, and this is the second layer), and one that names an id the review renamed, which may mean either finding; and a fix for a finding that keeps one may not be an `instance`." Task 7 later changes the earlier sentence of the same line that opens "Each key is read in one place"; this anchor is not in the text it changes.

**Proof:** the gate run shows the new checks passing, and `grep -c 'and this is the second layer), and one that names an id the review renamed, which may mean either finding; and a fix' docs/running.md` prints `1`.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Instance or class", updated in this task.

**Commit:** `redline: R3-5 clear a class link that names an id the review renamed (#105)`

## Task 4: R3-6 — a call asked under a repository rule holds its finding to that rule

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/contract.md`

1. **Red.** In `tests/loop-test.mjs`, at the end of the `left:` block (after Task 2's), add, with the prose rule `billing` and one correctness finding `R1-1` the shaper asks about (`ask: ['R1-1']`) with `whyHuman: { 'R1-1': 'repository rule billing' }` and no `askRule`:
   - **Autopilot.** The run is `done`; `res.forced` holds `R1-1` under `billing`; the `resolve r1` prompt shows `R1-1`'s decision with `"rule": "billing"`; the reply for `R1-1` opens `left to` and names `repository rule billing`; `res.warnings` holds `round 1: the shaper asked about R1-1 because of repository rule billing and did not tag the finding with it; it is left to the person under that rule`.
   - **Guided, a pick of the call's option that ends in fix** (`option: 'Change it'`, the mock call's): the finding is left, its reply opens `left to`, and the `implement r1` prompt lists no task with files for it.
   - **The same call with the tag** (`askRule: { 'R1-1': 'billing' }`), the neighbour: left as before, with no such warning.
   - **A paths rule named in the call** (`ruleArgs`, `craft-config`, the finding on `app/x.php`, outside its paths, `whyHuman: { 'R1-1': 'repository rule craft-config' }`): forced under `craft-config` with the same warning naming that rule.
   - Seen red: the untagged autopilot case, the guided pick and the paths-rule case.
2. **Green.** In `forceAskRules` (3919-3920), after `tagged` is read: when no paths rule matches, `tagged` is empty and the finding is an `ask`, read the call the shaper wrote for it; when its `why_human` is `repository rule <id>` and `ruleById[<id>]` exists, that rule covers the finding, and the warning above is pushed. The lookup runs before `call.why_human` is rewritten, and such a call keeps `relabelled` false, as a tagged one does (its old reason starts with `repository rule `). The comment above `forceAskRules` ("a prose rule is the shaper's own askRule tag") gains "or, with no tag, the rule its call names".
3. In `docs/contract.md`, "Ask rules", the `prose` bullet (153), after "the shaper sorts a finding the sentence covers as `ask` and tags it, which the workflow then holds to", add "; a call the shaper asks under `repository rule <id>` with no tag on its finding is held to that rule the same way, with a warning".

**Proof:** the gate run shows the new checks passing.

**Docs:** `workflows/redline-loop.js`: `docs/contract.md`, "Ask rules", updated in this task.

**Commit:** `redline: R3-6 hold a finding to the rule its call names when it carries no tag (#105)`

## Task 5: R3-10 — a left finding's entry carries no mitigation, and its task no files

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`, at the end of the `left:` block (after Task 4's), add:
   - **A typed defer on a call with no option that ends in defer.** `ruleArgs` and the scenario `{ reviews: [[cfg], []], ask: ['R1-1'], ends: { 'R1-1': 'fix' }, resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [[]] }`. The shaper's call for `cfg` is the mock's, relabelled under `craft-config` and keeping its two options. The mock makes its `Keep it` option end in defer whenever `resolveDeferred` lists the id (`tests/loop-test.mjs:295`), so `ends: { 'R1-1': 'fix' }` scripts it to end in fix; `Change it` ends in fix already. Neither option ends in defer, so the call offers no draft and the typed defer is the only way the finding is deferred. First, a check that pins the setup: the same scenario run with no decisions stops at the hand-off, and its call for `R1-1` lists `[["Keep it","fix"],["Change it","fix"]]` as label and end. Then the run with `decisions` the marked typed defer of Task 2 for `R1-1` (`{ 'R1-1': { ...typedDefer()['R1-1'], call: true } }`) and `deferrals: goAhead('R1-1')`. Check: the `plan approver r1` and `implement r1` prompts show `R1-1`'s entry with `"mitigation": ""`; `res.warnings` holds `round 1: the resolve agent gave R1-1, a finding left to the person under repository rule craft-config, the mitigation "a guard"; it is cleared, since no task writes anything for it`; the draft is filed.
   - **A pick of a relabelled call's undrafted Mitigate.** The block's `relabelledCall('outside the pull request')` (its `Mitigate` option ends in defer with no draft), with `resolveDeferred` the entry above and the person's pick `pickOf('Mitigate', tracked)`, `deferrals: goAhead('R1-1')`. The same three checks.
   - **A task with files.** Each of the two above with `resolveFiles: { 'R1-1': ['app/x.php'] }`: the run stops at `resolve` (`status === 'error'`, `stage === 'resolve'`, `ownCheck === true`, `resumeFrom.label === 'resolve r1'`) with `the resolve agent planned a task with files for R1-1 (app/x.php), a finding left to the person under repository rule craft-config; no task writes anything for it`. The same for a left finding nobody deferred: the relabelled call, the person picks `Full fix` (its option that ends in fix).
   - **A reshape that newly leaves a decided deferral.** The existing `forcedDefer` scenario (the check whose name opens `reshape: a decided finding the reshape leaves to the person under a rule`), whose first resolve's entry carries `a guard`: the `plan approver r1 #2` and `implement r1` prompts show `R1-1`'s entry with an empty mitigation, and the warning is pushed.
   - Seen red: every check above but the setup pin, which holds before the change; As built says so, and it is seen red under a mutation that drops `ends` from the scenario.
2. **Green.** In `resolveWith`:
   - After `const taskFiles` (4685), stop on a left id this resolve applies whose task has files: `applied.filter((id) => record.forced[id] && taskFiles(id).length > 0)`, thrown as `checkError('resolve', ...)` with the message above, naming each id with its files and `leftUnder(record.forced[id])`, joined with `; `.
   - A helper beside `leftDeferred`, `leftEntry(d)`, returns `d` for an id not in `record.forced` and `{ ...d, mitigation: '' }` otherwise, pushing the warning above when `d.mitigation` held words. Apply it to the entries `deferred` takes at `deferred = deferred.map(...)` (4727) and at the reshape's rebuild (4916). A comment cites `docs/running.md`, "Left to you": "no task is planned and nothing is written under the rule" (#127, R3-10).
3. In the `resume:` section, the two count pins follow the new stop: `sites("throw checkError('resolve', \`the resolve agent ")` and `sites("checkError('resolve', ")` from 8 to 9 (1731), and `sites('throw checkError(')` from 19 to 20 (1732). Read each count off the source with `grep -c` before writing it.

**Proof:** the gate run shows the new checks passing.

**Docs:** `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Left to you": no reader-facing change, since the section already says no task is planned and nothing is written under the rule; this task makes the workflow hold to it.

**Commit:** `redline: R3-10 keep a left finding's entry free of a mitigation and its task free of files (#105)`

## Task 6: R3-1 — the contract names the current marker as v7

**Files:** `docs/contract.md`

On line 118 ("Template version"), `<!-- redline-unattended: v6 -->` becomes `<!-- redline-unattended: v7 -->`, and the quoted warning's "the plugin ships v6" becomes "the plugin ships v7". Nothing else on the line changes.

**Proof:** `grep -n -e 'ships v6' -e 'unattended: v6' docs/contract.md` prints nothing.

**Docs:** this task is the docs change; it touches no file under the directories gate step 10 lists.

**Commit:** `redline: R3-1 name the unattended section's marker as v7 in the contract (#105)`

## Task 7: R3-2 — the statements of what a schema refuses name its objects

**Files:** `docs/upgrading.md`, `docs/running.md`, `agents/redline-shaper.md`, `agents/redline-reviewer.md`, `workflows/redline-loop.js`, `tests/loop-test.mjs`

The stop's message when a deferred entry carries a `draft` object is, for the scenario below, exactly:

`the shaper deferred R1-1 with no drafted issue (missing title, found, why); a deferred item always carries one; this entry carries a draft object, which is not read on a deferred entry: the entry holds title, found, why and fullFix itself, beside mitigation`

It keeps today's message, `the shaper deferred <id> with no drafted issue (missing <fields>); a deferred item always carries one`, whole, and appends after it the clause `; this entry carries a draft object, which is not read on a deferred entry: the entry holds title, found, why and fullFix itself, beside mitigation`. With no `draft` object the message is today's, byte for byte.

1. **Red.** In `tests/loop-test.mjs`, at the end of the `places:` block, after the check whose name opens `places: the shaper's file and the reviewer's say a key the schema does not name is refused`, add:
   - A check that `agents/redline-shaper.md` includes `a deferred entry is open` and `agents/redline-reviewer.md` includes `refuses a key it does not name on the result and on a finding`.
   - A shaper result that defers `R1-1` with the entry `{ id: 'R1-1', mitigation: '', fullFix: 'a lock', draft: { title: 'Lock R1-1', found: 'found', why: 'why' } }`, scripted as `defer: ['R1-1']` with `shapeKeys: { deferred: [<that entry>] }` (the mock spreads `shapeKeys` after its own `deferred` list, so it replaces it): `stopsAtShape(r, <the message above>)` holds, the error compared by equality. Neighbour: the existing check whose name opens `defer: a deferral with no drafted issue stops at shape` (3318) still passes with today's text.
   - Seen red: both.
2. **Green.**
   - `docs/upgrading.md:45`: "The shaper's output schema requires the new keys and refuses any key it does not name, and so does the schema of a review that is asked for class links." becomes, in substance: the shaper's output schema requires the new keys and refuses a key it does not name on the result, a finding, `cause`, an entry of `swept`, a call, an option and its `draft`, while a deferred entry stays open and the workflow's draft check holds it; the schema of a review that is asked for class links refuses one on the result and on a finding.
   - `docs/running.md:86`, in the sentence that opens "Each key is read in one place": "the shaper's output schema refuses a key it does not name, so one written a level out is refused in the shaper's own run" becomes "the shaper's output schema refuses a key it does not name on the result, a finding, `cause`, an entry of `swept`, a call, an option and its `draft` (a deferred entry is open, and the workflow's draft check holds it), so one written a level out there is refused in the shaper's own run"; the rest of the sentence stays, and so does Task 3's clause later on the line.
   - `agents/redline-shaper.md:34` (rule 10): "the tool you return through refuses a key it does not name, one written a level out included (`swept` on the finding beside `cause`, `ends` or `draft` on the call), and names the path and the key, so put it in its place and return again" becomes "the tool you return through refuses a key it does not name on the result, a finding, `cause`, an entry of `swept`, a call, an option and its `draft`, one written a level out included (`swept` on the finding beside `cause`, `ends` or `draft` on the call), and names the path and the key, so put it in its place and return again; a deferred entry is open, so its drafted issue's fields sit on the entry itself, beside `mitigation`, and one missing there is the workflow's stop".
   - `agents/redline-reviewer.md:78`: "the tool you return through refuses a key it does not name" becomes "the tool you return through refuses a key it does not name on the result and on a finding (a `resolved` or `coverage` entry is open)"; the rest of the sentence stays.
   - `checkDrafts` (3846-3853): build the message as a string before the one `throw checkError('shape', ...)` that is there now: today's text, then, when the deferred entry is found and its `draft` is an object (not an array), the clause above. One throw site, as now, so the `resume:` pin `sites("throw checkError('shape', ") === 11` (1732) does not move.

**Proof:** the gate run shows the new checks passing, the existing `places:` check that pins `refuses a key it does not name` in both agent files still passes, and the `resume:` shape pin is unchanged.

**Docs:** `agents/redline-shaper.md`, `agents/redline-reviewer.md` and `workflows/redline-loop.js`: `docs/running.md`, "Dispositions", "Instance or class", and `docs/upgrading.md`, "A stopped run across 0.5.0", both updated in this task.

**Commit:** `redline: R3-2 say which objects the shaper's and the reviewer's schemas refuse an unnamed key on (#105)`

## Task 8: R3-3 — a deferred left finding's draft is shown before it is filed, whenever that is

**Files:** `skills/redline/SKILL.md`, `docs/running.md`

- `skills/redline/SKILL.md:213`: "Either way the round stops once more to show the draft before it is filed ("The round's deferred drafts" below), with `canFix` false." becomes "Either way the draft is shown before it is filed ("The round's deferred drafts" below), with `canFix` false: at a stop of the round, or, when deferred items are raised at the end of the run, at the end-of-run stop."
- `skills/redline/SKILL.md:228`: "is drafted after that stop, so the round stops once more to show its draft" becomes "is drafted after that stop, so its draft is shown before it is filed: at a later stop of the round, or at the end-of-run stop when deferred items are raised at the end of the run".
- `docs/running.md:95` ("Left to you"): "Either way the round stops once more to show the draft first, as for any deferral you choose at a call," becomes "Either way the draft is shown before it is filed, at a stop of the round or, when deferred items are raised at the end of the run, at the end-of-run stop, as for any deferral you choose at a call,"; the rest of the sentence stays.

**Proof:** `grep -n -e 'stops once more to show' skills/redline/SKILL.md docs/running.md` prints nothing, and the existing `left:` check that pins `shown with its draft's title` still passes.

**Docs:** `skills/redline/SKILL.md`: `docs/running.md`, "Dispositions", "Left to you", updated in this task.

**Commit:** `redline: R3-3 say a deferred left finding's draft is shown before it is filed, at the round's stop or the end of the run (#105)`

## Task 9: R3-7 — a kept draft's recommendation ends in one period

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`, in the `left:` block, after the check whose name opens `left: the call for a finding the shaper deferred under a rule keeps the drafted issue`, add the same scenario with the shaper's draft titled `Lock R1-1.`: the call's `recommendation` and `forced.recommendation` are `Defer to an issue: Lock R1-1.`; on autopilot, the result's Left to entry for `R1-1` (`open: ...`) ends `Lock R1-1.` and holds no `..`. Seen red: both.
2. **Green.** In `forceAskRules` (3975): `` `${DEFER_TO_ISSUE}: ${draftTitle(kept.title).replace(/\.$/, '')}.` ``. The option's effect, which quotes the title, is unchanged.

**Proof:** the gate run shows the new checks passing, and the existing check of `Defer to an issue: Lock R1-1.` still passes.

**Docs:** `workflows/redline-loop.js`: no reader-facing change: no README or `docs/` sentence quotes the recommendation's text.

**Commit:** `redline: R3-7 end a kept draft's call recommendation in one period (#105)`

## Task 10: R3-8 — the unmatched-option warning says what is true for a left finding

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In the `left:` block (after Task 5's), a call left to the person under `craft-config` (the shaper's deferral of `cfg`, so its options are `BY_HAND`, `ACCEPT` and `DEFER`) answered with `option: 'Defer it now'`, a label of none of them: the run is `done`, nothing is filed, and `res.warnings` holds `round 1: the decision for R1-1 names the option "Defer it now", which is the label of none of its call's options (Make the change by hand after the run, Accept, no change, Defer to an issue); it is read as an answer in the person's own words: R1-1 stays left to the person, and nothing is filed`. Neighbour: the existing check of the same warning on an ordinary call keeps `and the resolve agent states what it ends in`. Seen red: the left case.
2. **Green.** In `resolveWith` (4514), word the warning's ending by `forced`: for a left finding, `` `: ${id} stays left to the person, and nothing is filed` ``; otherwise unchanged. The comment above it says so.

**Proof:** the gate run shows the new check passing and the ordinary-call neighbour unchanged.

**Docs:** `workflows/redline-loop.js`: no reader-facing change: no README or `docs/` sentence quotes the warning.

**Commit:** `redline: R3-8 word the unmatched-option warning truly for a finding left to the person (#105)`

## Task 11: R3-9 — a resolve takes a left finding's entry only when it applies that finding

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In the `left:` block (after Task 10's): `ruleArgs`, two findings, `cfg` (`R1-1`, the shaper's own deferral under the rule, so its call has the drafted `DEFER` option) and `R1-2`, `planBounce: 1`, `reshapeAsk: ['R1-2']`; the person picks `DEFER` for `R1-1` (`pickOf(DEFER, ...)`) and answers `R1-2` in their own words (`typedAnswer('R1-2')`); `deferrals: goAhead('R1-1')`; every resolve returns `[{ id: 'R1-1', mitigation: '', fullFix: 'another lock', title: 'Another title', found: 'found again', why: 'why again' }]`. Check: the draft filed for `R1-1` is the option's (`Lock R1-1`, never `Another title`), and `res.warnings` holds `round 1: the resolve agent returned a deferred entry for R1-1, a finding left to the person that an earlier resolve of the round applied; the earlier entry stands`. Seen red: both.
2. **Green.** In `resolveWith` (4615): `const returned = out.deferred.filter((item) => !record.forced[item.id] || (leftDeferred(item.id) && applied.includes(item.id)))`; for each id that is a left deferral this resolve did not apply and that the agent returned an entry for, push the warning above, once per id. An entry for a left finding nobody deferred is dropped without one, as before (#109). The comment at 4597-4603 says so.

**Proof:** the gate run shows the new checks passing.

**Docs:** `workflows/redline-loop.js`: no reader-facing change: `docs/running.md`, "The draft", already says the filed draft is the one the call's option carries.

**Commit:** `redline: R3-9 keep the first entry of a left deferral when a later resolve returns another (#105)`

## Task 12: R3-11 — a left finding's own commit is warned about truly

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In the `left:` block (after Task 11's): the shaper's deferral of `cfg` under `craft-config`, the person picks `DEFER`, `deferrals: goAhead('R1-1')`, and a commit whose subject opens with `R1-1` (`commitIds: [['R1-1'], []]`): `res.warnings` holds `round 1: R1-1 has a commit of its own (<its short sha>), but it is left to the person under repository rule craft-config: no task writes anything for it, and its reply and the handoff name no commit`, and no warning that says `the resolve agent planned no task with files for it`. The same scenario with the person picking `ACCEPT`, a left finding nobody deferred: the same warning. Neighbour: the existing own-commit warning of an ordinary deferral is unchanged. Seen red: all three.
2. **Green.** In the loop at 5102-5115, skip an id in `record.forced`. After it, for each in-scope id in `record.forced` with a commit of its own (`landed`), push the warning above, its shas read as the loop reads them and its rule by `leftUnder`.

**Proof:** the gate run shows the new checks passing.

**Docs:** `workflows/redline-loop.js`: no reader-facing change: no README or `docs/` sentence quotes the own-commit warnings.

**Commit:** `redline: R3-11 warn truly of a commit of its own for a finding left to the person (#105)`

## Task 13: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its README or `docs/` section, or "no reader-facing change" with the reason, for every file it touches under `workflows/`, `skills/` and `agents/`. As built records each entry's commit.
- **11. Version.** `0.5.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it, applied in its own commit after the finding commits: `redline: record the round 3 review lessons in the standards (#105)`.
- **13. Spec folder.** `plan.md` gains an As built section (each task's commit, its red and green counts read off the gate's summary line, every mutation run, every existing check that followed a task and why), and any deviation is recorded under Decisions in `shape.md`, in the last commit: `redline: record the as-built state of review round 3 for PR #127 (#105)`.

---

## As built

Built by the Redline implementer on the PR's head branch, from `b696aee`. Every count below is the loop harness's own summary line (`<n> checks passed, <m> failed`), read off the kept result of a run of `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-25-1418-127-review-round-3/redline/snapshot.json`; in every run below every other gate check exited 0. Each task was built red, then green, and committed before the next was begun, so each commit holds only its own checks.

| Task | Finding | Commit | Red | Green |
|---|---|---|---|---|
| 1 | spec folder | `cc9af40` | | |
| 2 | R3-4 | `865ae26` | 1964 passed, 6 failed | 1971 passed, 0 failed |
| 3 | R3-5 | `4824c91` | 1971 passed, 2 failed | 1974 passed, 0 failed |
| 4 | R3-6 | `93c01e1` | 1976 passed, 3 failed | 1982 passed, 0 failed |
| 5 | R3-10 | `a76da6d` | 1988 passed, 6 failed | 1991 passed, 0 failed |
| 6 | R3-1 | `30d17e5` | docs only | `grep -n -e 'ships v6' -e 'unattended: v6' docs/contract.md` prints nothing |
| 7 | R3-2 | `616dffe` | 1991 passed, 2 failed | 1993 passed, 0 failed |
| 8 | R3-3 | `24c62f8` | docs only | `grep -n -e 'stops once more to show' skills/redline/SKILL.md docs/running.md` prints nothing; the next run (Task 9's red) kept the `left:` check that pins `shown with its draft's title` passing |
| 9 | R3-7 | `a60771e` | 1994 passed, 2 failed | 1996 passed, 0 failed |
| 10 | R3-8 | `c4dafaf` | 1997 passed, 1 failed | 1998 passed, 0 failed |
| 11 | R3-9 | `f51f4a6` | 1998 passed, 1 failed | 2000 passed, 0 failed |
| 12 | R3-11 | `db59918` | 2002 passed, 2 failed | 2004 passed, 0 failed |
| 12 (standards) | | `aa945f1` | | the four approved edits, as `shape.md` proposes them |

Per task:

- **Task 2.** Red: the relaunch's replay pin and its no-override check, the unapplied warning, the two intake refusals and the text check. The check that the marked defer files its draft and replies `left to ... Deferred to #301.` held before the change, since the override path the bug took also filed it: it was seen red under a mutation of the clause it turns on (`resolveWith`'s left-finding branch dropping a typed `defer` with the other dispositions), at 1977 passed, 31 failed, and the mutation was reverted. The first green run read 1970 passed, 1 failed: the stray-mark check expected the reply to say `Applied in`, where a shaper's fix replies `fixed in`; the check was corrected to the exact reply and the next run was green. The `reshape:` block's `draftFor` is out of the `left:` block's scope, so the block has its own `draftOf`.
- **Task 3.** Red: the warning and the prompt checks (the run stopped at `shape r2` on the instance fix under the link). `grep -c 'and this is the second layer), and one that names an id the review renamed, which may mean either finding; and a fix' docs/running.md` prints `1`.
- **Task 4.** Red: the untagged autopilot case, the guided pick and the paths-rule case; the tagged neighbour held. Each red case stopped at the check for want of a commit for `R1-1`.
- **Task 5.** Red: every new check but the setup pin. The setup pin held before the change and was seen red under a mutation that drops `ends` from the scenario, with the change in place: 1990 passed, 1 failed, the pin alone; the mutation was reverted. The `resume:` pins followed the new stop, each count read off the source with `grep -o ... | wc -l` before it was written: `sites("throw checkError('resolve', \`the resolve agent ")` and `sites("checkError('resolve', ")` from 8 to 9, `sites('throw checkError(')` from 19 to 20.
- **Task 7.** Red: the agent-file check and the nested-draft stop. The existing `places:` pin of `refuses a key it does not name` in both agent files, the `defer:` check of today's message, and `sites("throw checkError('shape', ") === 11` stayed green.
- **Task 9 to Task 12.** Red as the plan says; each neighbour named there is an existing check and stayed green.

Docs entries (gate step 10), each with its commit: Task 2, `skills/redline/SKILL.md` and `relaunch.how` updated, `docs/running.md` no reader-facing change (`865ae26`); Task 3, `docs/running.md`, "Instance or class" (`4824c91`); Task 4, `docs/contract.md`, "Ask rules" (`93c01e1`); Task 5, no reader-facing change (`a76da6d`); Task 7, `docs/running.md` and `docs/upgrading.md` (`616dffe`); Task 8, `docs/running.md`, "Left to you" (`24c62f8`); Tasks 9 to 12, no reader-facing change (`a60771e`, `c4dafaf`, `f51f4a6`, `db59918`).

Version (gate step 11): `0.5.0`, unchanged. Standards retrospective (gate step 12): the four approved edits, in `aa945f1`, a commit of lessons that finishes no finding.

Deviations, each recorded under Decisions in `shape.md` ("As built"):

1. Task 1's commit subject is `redline: save review round 3 spec for PR #127 (#105)`, the implementer's form that every earlier round's spec commit used, not `redline: shape PR #127 review round 3 (#105)`.
2. Task 5's reshape case reads the `left:` block's `namedLater` run, not `forcedDefer`: `forcedDefer` is scoped to the `reshape:` block, and `namedLater` is the same case (a call whose decision names defer, a first resolve entry with the mitigation `a guard`, a reshape that leaves the finding under `billing`).
3. Task 11's two checks, the filed draft and the warning, are one check over the same run.
