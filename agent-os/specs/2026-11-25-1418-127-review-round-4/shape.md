# PR #127 review round 4 — Shaping Notes

Shaped by Redline in unattended mode, for review round 4 of PR #127 (issues #105, #75 and #126; template v7, plugin 0.5.0), from the round's four findings (`redline/round-4-review.json`, `redline/round-4-findings.json`). Line numbers are at `20a7603`, the head of the branch. Reshaped twice after the plan approver bounced Task 4 (adjustments 1 and 2 of at most 2): see "Adjustment 1" and "Adjustment 2" below.

## Scope

The round's four findings, nothing more:

- R4-1 (correctness, medium, `sameClassAs` R3-6): a call asked under a declared rule runs as an ordinary call when its finding carries an `askRule` tag that names no declared rule.
- R4-2 (correctness, low): a shaper deferral that a rule forces, whose draft is short of a field, loses its draft with no word.
- R4-4 (correctness, medium, `sameClassAs` R3-10): a decided finding that a reshape newly leaves to the person keeps the task its first resolve planned, with files, and it is built.
- R4-3 (nit, low): a typed defer on a left call that offers two drafted defer options takes neither draft, with no word.

`.claude/redline.json` declares no `askRules`, so no repository ask rule covers any finding. In this repository the plugin's source is repository content (rule 7), and none of the four touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text, so none is deferred under point 11 and none is a call on one of Redline's own files.

No open issue tracks any of the four: `scripts/redline-gh.sh issues-search` for `askRule` and `reshape` listed #104, #115, #119, #121, #122, #123, #124 and #128. #119 is the paths rules on the task a resolve plans for a decided finding, a different reader from R4-4's (a prose rule or a paths rule that a reshape applies after the task was planned, read at the hold after that reshape). None of the others is one of these.

Every finding is `fix`. No `decline`, `defer` or `ask`.

## Decisions

### R4-1: a call asked under a declared rule holds its finding to that rule whatever the finding's tag names — fix

Confirmed by reading `workflows/redline-loop.js` at `20a7603`. `forceAskRules` reads `tagged` (3971), then `rule` from the paths and from `ruleById[tagged]` (3972). R3-6's lookup of the call's reason runs only when `!rule && !tagged` (3979). A tag that names no declared rule (`billing-typo`) leaves `rule` null and skips the lookup, so the branch at 3987-3990 warns that the tag is ignored and `continue`s, and `record.forced` is never set. `checkWhy` (3652) accepts the call, since `repository rule billing` names a declared rule exactly. The call runs as an ordinary one: on autopilot `autopilotDecision` picks `recommended`, and `resolveWith` gives the decision that option's end (4603-4604, `!forced`); on guided a pick of an option that ends in fix is built the same way. The reviewer's reproduction (`/tmp/redlinerepro/reviewer-r4-repro.mjs`, case `c1`) scripts exactly this; node is refused to the shaper, so it was read, not run.

- **Proportionality.** Likelihood: low. The shaper has to write a tag that names no declared rule beside a call that names a declared one, two places in one result, where rule 7 asks for both. Impact when it fires: a change the repository says a person is always brought in for is planned and built by Redline. Under a prose rule nothing refuses the write; under a paths rule the guard does. Cost: one condition and one warning in `forceAskRules`, one clause of `docs/contract.md`, loop cases. Every file is one the pull request changed.
- **Instance or class.** The verifier links this finding to R3-6, so the question is answered: a class, closed `one-place`. The cause lives in `forceAskRules` in `workflows/redline-loop.js`. That is the one place a finding is left under a rule (agents.md line 11: "One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape"). R3-6 put the call's reason behind the wrong condition: it asked whether a tag was present, when the question is whether any input named a declared rule. The members are every input from which `forceAskRules` can learn that a rule covers an `ask`. They were found by reading, since node is refused to the shaper.
  - A paths rule on the finding's file: holds.
  - A paths rule on the files the shaper lists: holds.
  - A declared tag: holds.
  - No tag, an empty tag, a blank tag or a tag that is no string (each reads as `''`) beside a call naming a declared rule: holds (R3-6).
  - A tag that names no declared rule beside a call naming a declared rule: exposed, closed here.
  - A call naming a rule the repository does not declare (`repository rule billing-typo`), or a reason spelled another way (`Repository rule billing`): neither is forced, and `checkWhy` stops the round on it, since it takes only the exact `repository rule <id>` of a declared rule: holds.
  - A call on a finding the shaper did not sort `ask`: `checkCalls` (3631-3638) stops the round before `forceAskRules` runs: holds.

  The fix gates the lookup on no rule having been found, tagged or not, so every input that names a declared rule leaves the finding to the person, on the first shape and on every reshape.
- **The change.** Task 2. The condition becomes `!rule && s.disposition === 'ask'`. When the call names a declared rule and the finding's tag named none, one warning says both: the tag named no declared rule, and the finding is left under the call's rule. With no tag the warning is R3-6's, unchanged. When no rule is found at all, the existing "does not declare; ignored" warning still fires. `s.askRule` is then set to the call's rule (4021), as today.

Decided by: redline

### R4-2: a shaper deferral whose draft a rule cannot keep is warned about — fix

Confirmed by reading. In `forceAskRules`, `kept` is null unless the shaper's entry passes `draftMissing` (4017-4018). The entry is still dropped (4022), the finding becomes `ask` (4019), and the call is built with `Make the change by hand after the run` and `Accept, no change` alone (4035-4039). `vetShape` runs `forceAskRules` (4399) before `checkDrafts` (4413), so by then the finding is no deferral and `checkDrafts` does not see it. The only warning is the generic one at 4003. A deferral with no entry at all reaches the same place: `shaperEntry` is undefined, so `kept` is null. The PR description promises: "When the shaper had deferred the finding, the workflow keeps its draft as that option, `Defer to an issue`, and recommends it."

- **Unattended answer: warn, not stop.** The code's own comment answers which. "Only a complete draft is kept: one short of a field would stop the round below for an option the shaper never wrote" (4015-4016). Not stopping is deliberate, so the fix is the notice the reviewer finds missing, not `checkDrafts`' stop. The person can still type `<id>: defer.`, and the resolve agent then writes the draft (`docs/running.md:95`).
- **Proportionality.** Likelihood: low; the shaper has to defer a finding a rule covers and leave a draft field blank. Impact: the person is offered no way to defer by a pick, and nothing says a draft was dropped. Cost: one warning in `forceAskRules`, one clause of `docs/running.md`, loop cases.
- **Instance or class.** The cause lives in `forceAskRules` in `workflows/redline-loop.js`, the one place a shaper's deferral is turned into a left call's option. `checkCalls` stops a deferral that carries a call before `forceAskRules` runs, so the `!call` branch is the only one a shaper's deferral reaches. Members:
  - A complete draft: holds; kept as the option.
  - A draft short of a field: exposed, closed here.
  - A deferral with no entry: exposed, closed here, since `draftMissing` of no entry names all four fields.
  - The first shape and every reshape: the same function, so both are covered.

  Outcome `one-place`.
- **The change.** Task 3. Right after `kept`, a deferral of the shaper's with no kept draft is warned about. The warning names the missing fields and says the draft is not kept as an option of the call, since only a complete one is. `docs/running.md`, "Left to you", says so where it describes the kept draft.

Decided by: redline

### R4-4: a decided finding a reshape leaves to the person is held to no task with files at the hold after that reshape — fix

Decided again in each reshape, since both adjustments name its task (Task 4). The disposition, the cause and the outcome stand. Adjustment 1 gave the stop a second wording and a case for its way out. Adjustment 2 states the rule's new clause once, so the shaper's file check reads the text step 4 writes, and names two existing checks the change turns red ("Adjustment 1" and "Adjustment 2" below).

Confirmed by reading, the reviewer's case `c2` read and not run. Take a call answered with a typed defer on an ordinary call. The first resolve applies it while the finding is not forced, plans its mitigation task with files, and `decidedFiles` takes that list (4826-4828). The plan bounces. The reshape is told the finding is decided as deferred (`reshapePrompt`'s block, 2399-2401), so it keeps the task and lists its files, and it tags the finding with a prose rule, so `forceAskRules` sets `record.forced` (4063-4065). From then on nothing reads the task:
- `tracked` is false for a forced id (4540), so neither the list update (4960) nor the hold (4984-4998) reads it.
- R3-10's `leftTasked` (4784) runs only over the ids a resolve applies, and no resolve reapplies this one, since its call is already in `calls` and is not `raised` (5001).
- `leftEntry` at the rebuild (5018) clears the entry's mitigation with a warning that says "no task writes anything for it", which is false here.
- The plan approver's copy of the decision carries no `rule`, since `rule` is set only in `resolveWith` (4633). Its rule 1 ("a task that changes a file for it is a bounce") keys on that.

The implementer builds whatever task the plan holds. The loop test shows the path already passes: `namedLater` (`tests/loop-test.mjs:5030`) scripts it, and the mock reshape lists the first resolve's `app/x.php` for a decided finding by default (`taskOf`, 233). Its checks at 5031 and 5127 pass with that task in place. The same holds for a decided fix (`forcedLater`, `forcedNamed`, 4022-4031) and for a decided fix whose reshape task is the very path that puts it under a paths rule (`reshapedUnder`, 1626).

- **Unattended answer: may such a finding keep a task with files?** No. `docs/running.md:128` ends "A finding left to you under a repository rule is outside all of this: no task writes anything for it", and `docs/running.md:95` says "no task is planned and nothing is written under the rule". `agents/redline-plan-approver.md` rule 1 says of a finding left to the person: "a task that changes a file for it is a bounce". The loop test's own comment (3752-3755) says "A finding the reshape leaves to the person under a rule is skipped, its task having no files by rule". The PR spec's decision 20, "A fix or an accept a reshape puts under a rule is as today (row 20)", is about the outcome: row 20 reads "kind `left`; nothing demanded". That stands, since a finding held here is still left and still demands nothing. So the code disagrees with the stated answer, and the disagreement is the fix, not a question.
- **Proportionality.** Likelihood: low. It needs a bounced plan whose reshape newly puts a decided finding under a rule while keeping its task, and a plan approver that passes the task although the finding is shown as `ask` under the rule. Impact when it fires: under a prose rule the change is built and pushed, the stake the ask rules exist for. Its reply names no commit, and R3-11's warning fires after the push. Under a paths rule the guard refuses the write and the build fails. Cost: in `workflows/redline-loop.js`, one widened list passed to the reshape prompt, one clause of its block, one more kind in the hold's existing stop with two wordings, a transient set `forceAskRules` fills, and `rule` and `own` set on the round's copy of a newly left decision. Also one clause in `agents/redline-shaper.md` rule 10, one sentence of `docs/running.md`, loop cases, and five existing scenarios and two existing checks that follow. Every file is one the pull request changed. Recorded as one-place in R3-10, the class came back, so it is closed here as a class, not deferred: its cost is in proportion.
- **Instance or class.** The verifier links this finding to R3-10, so the question is answered: a class, closed `one-place`. R3-10's `why` was "a left finding's task is read only from the resolve that applies it". That is false for a decided finding a reshape later leaves to the person, whose task its first resolve planned before it was left. The cause lives in the hold after each reshape in `workflows/redline-loop.js` (4984-4998). After the first resolve, that hold is the one place a decided finding's task is read again, and it reads only a tracked one. The members are every way a task with files can stand in the plan for a left finding. They were found by reading, since node is refused to the shaper.
  1. The first shape forces a finding, whatever the shaper sorted it: its call is decided (by the person, or autopilot's `leftDecision`) and applied by a resolve, which rewrites its task to "Left to the person", and `leftTasked` holds that resolve's tasks: holds.
  2. A reshape raises a left call for a finding nobody decided: it is `raised`, a resolve applies it, and `leftTasked` holds it: holds.
  3. A reshape newly forces a disposition override: `forceAskRules` gives it a call, which is not among `calls`, so it is `raised` and applied again by a resolve, and `leftTasked` holds it: holds.
  4. A reshape newly forces a decided call (a deferral, a fix, an accept; picked, typed or stated) by a tag, its call's reason or its own file: its call is already in `calls`, no resolve runs for it, and nothing holds the task: exposed, closed here. Emptying the task keeps it left, since the tag, the reason or the file still names the rule.
  5. A reshape newly forces a decided call only through the files it lists for the finding, under a paths rule (`reshapedUnder`): exposed as 4 is, closed here. Emptying the task alone takes it out from under the rule. A resumed reshape is shown the finding with its decision, since the resume replays the state before that reshape, and `forceAskRules` finds no rule without the files. So the hold's message names this case's own two ways out (adjustment 1).
  6. A later reshape keeps or adds a task for a decided finding left before it: such a finding is not named in the reshape's block, so its `files` are an ask's recommended paths (`FILES_ASK_DECIDED`) and the workflow cannot read a task from them: exposed, closed here by naming every decided finding in the block, a left one as `(left to the person)`, so the hold reads its task too. Emptying the task keeps it left, since the entry `record.forced` holds for a decided finding stands (`forceAskRules`, "the entry it was decided on stands").

  One hold over every decided finding the reshape is told of, left ones included, closes 4 to 6 at the place the cause lives. The resolve-time check already closes 1 to 3.
- **The change.** Task 4.
  - **The rule's clause, stated once** (adjustment 2). The reshape prompt's block and `agents/redline-shaper.md` rule 10 both gain, word for word, `and one left to the person keeps none: its task is "Left to the person: <id>" with no files` (`LEFT_KEEPS_NONE` in the plan), after `and one decided as accepted keeps none` and `, `. Every check of the clause reads this text.
  - The approve loop builds the reshape's decided list from every decided finding, not only the tracked ones. A finding left to the person is named with the end `left`, which the block writes as `left to the person`. When one is named, the block's rule gains the clause above. A prompt that names no left finding is byte-identical to today's.
  - After `vetShape`, for each decided finding this reshape newly left (in `record.forced` now and not before), the round's copy of the decision gains `rule`, and `own` when it has one, as `resolveWith` gives a left decision. The plan approver's next pass and the implementer are then told the finding is left.
  - `forceAskRules` notes, in a transient set read by the hold after the same `vetShape` and never written to the record, each finding whose rule came only from the files the shaper lists. A rule from its own file, a declared tag or its call's `repository rule <id>` keeps it off the set.
  - The hold's one stop (`the reshape left ...`) gains a third kind. A decided finding in `record.forced` whose files the reshape lists (read through `cleanPaths`) are not empty is named with its owner, its rule and its files, in one of two wordings:
    - members 4 and 6 close `; no task writes anything for a finding left to the person`;
    - member 5 names the two ways out: move the change off the rule's paths to keep the decision, or return it as an ask with no files whose call names `repository rule <id>` to leave it to the person, since removing its files alone takes it out from under the rule.

    The stop stays one throw site, so the `resume:` pins do not move. A resume reruns that reshape, which corrects what the error names.
  - `agents/redline-shaper.md` rule 10 says the same of a decided finding named as left to the person (agents.md line 17: a rule is changed everywhere it is stated). Its list of ends becomes `(fix, accepted, deferred or left to the person)`, and it gains the clause above.
  - `docs/running.md`, "A reshape after your decision", says the hold covers a finding left to the person, with one clause for member 5's two ways out.
  - Five existing scenarios whose reshape keeps the first resolve's task for a finding it leaves follow the change. Four get a reshape scripted to leave the task with no files, the state the rule asks for, so they keep proving what they were written for. `reshapedUnder` now stops, its message pinned in full. A new case beside it takes the way out and finishes `done` (Task 4 lists each).
  - Two existing checks that pin the words this task changes follow it (adjustment 2): `twoDecided`'s check of the block (`tests/loop-test.mjs:3611`) and the shaper's file check of the ends (3614).

Decided by: redline

### R4-3: a typed defer on a left call that offers more than one drafted issue is warned about — fix

Confirmed by reading. In `resolveWith` the draft for a left deferral comes from the picked option or, for a typed defer, from the call's single drafted option (`drafted.length === 1 ? drafted[0] : null`, 4698). `checkOptions` (3687-3749) does not limit a left call to one drafted defer option. With two, `source` is null, `optionDraft` has no entry, the resolve agent's entry is kept (`returned`, 4707) and filed, and the `rewritten` warning (4711-4714) compares only against `optionDraft`, so it says nothing. The person was shown two drafts at the call, and a third is the one filed. It is shown first at the round's draft stop or the end-of-run stop (`draftStop`, `raisesDrafts`, 4443), so the person can still drop it.

- **Unattended answer: warn, not refuse.** The skill's own pattern for an answer that does not do what its words suggest is to say so when it says the answer back (`skills/redline/SKILL.md:213`: "when you say such an answer back, say that it is recorded as left to them, that nothing is filed for it, and that picking the option that ends in an issue ... would file one"). The workflow's pattern is a warning, as for an option that names none of its call's options (4601). The draft stop shows the agent's draft before anything is filed. So a warning, the skill's say-back and the two docs sentences are the clear pick. Refusing the typed defer at the stop would make the skill reject an answer that today files a draft the person can see first. Limiting `checkOptions` to one drafted option would add a stop at `shape` for a call the shaper is allowed to write. Neither is the clear pick, so neither is planned, and no decision in one of the five cases is needed.
- **Instance or class.** The cause lives in `resolveWith`'s choice of a left deferral's draft (`source`, 4697-4698, `workflows/redline-loop.js`), the one place that choice is made. Members:
  - A pick of a drafted option: holds.
  - A typed defer with one drafted option: holds.
  - A typed defer with none: holds; the resolve agent writes the draft, as documented.
  - A typed defer with more than one: exposed, closed here.
  - Autopilot: holds; it never defers a left finding.

  Outcome `one-place`.
- **The change.** Task 5: when a typed defer meets a left call with more than one drafted option, the run warns. The warning names the options and says none of them is taken, so the draft filed is one the resolve agent writes, shown before it is filed, and that a pick of one of those options files its draft. `skills/redline/SKILL.md:213` and `docs/running.md:95` describe the case beside the one-draft and no-draft ones.

Decided by: redline

### Adjustment 1: the hold names the way out for a finding left only through its task's files — applied

The plan approver bounced Task 4. The planned stop closed every left finding with `no task writes anything for a finding left to the person`. In `reshapedUnder` that is no way out. There the finding is left only because the reshape lists `app//billing/charge.php` under the `billing-code` paths rule: not its own file, not a tag, not its call. Read at `20a7603`, the approver's chain holds:
- The resume replays the state before the reshape, so the resumed reshape is shown `R1-1 (fix)` with "A finding decided as a fix keeps a task with files".
- `forceAskRules` finds no rule once the files are gone: `ruleForPaths([f.file].concat([]))` is null for `app/x.php`, and the `!rule` branch keeps no entry for a finding not yet forced.
- The finding is then a tracked fix with no files, and the hold stops again with `a fix names the files it changes`.

That breaks agents.md line 16, "a stop's message says what its rule asks of the case that reached it".

Applied as asked:
- `forceAskRules` notes a finding whose rule came only from its listed files.
- The hold words such a finding apart, naming both ways out. Moving the change off the rule's paths keeps the decision. Returning it as an `ask` with no files whose call names `repository rule <id>` leaves it to the person, since R3-6's lookup then finds the rule from the call.
- The rewritten `reshapedUnder` check pins that message in full.
- A new `rules:` case takes the second way out and finishes `done`, its reply opening `Redline round 1: left to @author under repository rule billing-code`.
- The prose-rule and already-left wordings stay as planned.
- `docs/running.md` gains the clause beside Task 4's sentence.

The way out is the approver's. Which of the two a resumed reshape takes is the shaper's reading of the person's decision at that point, so the message offers both and picks neither. That is no new question for the person in this round.

One change from the approver's text. The approver's case scripts the call's reason with `whyHuman`. The mock applies `whyHuman` to the first shape too (`tests/loop-test.mjs:294`), so the first shape would already leave the finding under R3-6, before the reshape the case is about. The case scripts it on the reshape alone with `callAt: { 'reshape r1 #1': ... }`, which replaces that call's fields for that label only (`tests/loop-test.mjs:297`). `reshapeAsk` is kept as the approver wrote it. It is redundant beside `ask: ['R1-1']` and harmless.

Decided by: redline

### Adjustment 2: the shaper's file check reads the clause step 4 writes, and two existing checks that follow are named — applied

The plan approver bounced Task 4 again, on two points. Both hold, read at `20a7603`.

1. **The shaper's file check could not turn green.** Step 1 checked `agents/redline-shaper.md` for `one left to the person keeps none`, while step 4 wrote "and so does one left to the person, whose task is ...", which lacks the phrase. Applied as the approver's second way: the clause is stated once (`LEFT_KEEPS_NONE`, `and one left to the person keeps none: its task is "Left to the person: <id>" with no files`), and step 2's block and step 4's rule 10 both gain it word for word. The new check reads `shaperFile.includes(LEFT_KEEPS_NONE)`, red before step 4 (`grep -c -F 'one left to the person keeps none' agents/redline-shaper.md` prints `0` today) and green after it. The text after the insertion in rule 10 (", and a decided fix keeps a task of its own") is unchanged, so the sentence still reads as one list.
2. **`twoDecided`'s check goes red and was not named.** In that scenario (`tests/loop-test.mjs:3610`) R1-2 is a call left to the person under `billing` at the first shape and decided with `changeIt`. Its check (3611) pins `${DECIDED_BLOCK}R1-1 (fix). ` and says in its name that the block never names one left to the person, the rule Task 4 removes. Applied as asked: step 3 lists it among the checks that follow, renamed `reshape: the block names each decided finding, a left one as left to the person, and never one nobody decided`, expecting `done`, `${DECIDED_BLOCK}R1-1 (fix), R1-2 (left to the person). ` and the clause. The run still finishes `done`. The mock resolve gives a left call's task no files (`tests/loop-test.mjs:335`, `left.has(id) ? []`), so `plannedByResolve['R1-2']` is empty. The mock reshape then lists none for it when named (`taskOf`, 233; `files`, 256), and the hold has nothing to stop on. R1-2 was left before the reshape, so nothing about its decision changes after `vetShape`. The block names findings in the order of `inScope`, so R1-1 comes before R1-2.

One more, found while applying point 2. `tests/loop-test.mjs:3614` pins `shaperFile.includes('each with what its decision ends in (fix, accepted or deferred)')`, and step 4 rewrites that phrase to `(fix, accepted, deferred or left to the person)`. So it would turn red as `twoDecided`'s did. Step 3 names it too: its expectation becomes the new phrase, and its name stays, since it still holds. That check also takes the place of the earlier `or left to the person` text check, which the full phrase covers. The catch-all in step 3 now names exactly what else may follow: another scenario whose reshape keeps a left finding's task, or another check that pins the decided block's list or rule 10's words as they read before the change. Anything else that turns red is still a fault.

Also read, and unchanged by the wider block. Every prompt with the decided block must follow a plan approver shown a decision (`strayDecidedBlock`, 498-509). The approver is shown `roundDecisions` in full (`workflows/redline-loop.js:2517`), and a left finding's decision is among them, so a block that now names only a left finding still has one before it. No such prompt carries `FILES_PENDING` (`doubleFilesAsk`), since the files clause switches with `decided.length` (2416). The `ends:` check (4649) reads no block only for `bounced`, which has no decision.

Decided by: redline

### As built: where Task 4's neighbour and clause constant sit — recorded

Two placements in `tests/loop-test.mjs` differ from the plan's wording, with no change to what is checked. The `emptied` neighbour is a `reshape:` check, since `emptied` is out of scope in the `left:` block. `LEFT_KEEPS_NONE` is a top-level constant, since both sections read it. The Task 4 mutation run aborted the harness before its summary line, so it is recorded as a red exit. See "As built" in `plan.md`.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)"; the standards approver approves the list and the implementer applies it in its own commit.

## Declined

None.

## Deferred

None.

## Unattended answers

1. **R4-4: may a decided finding a reshape leaves to the person keep a task with files?** No.
   - `docs/running.md:128`: "A finding left to you under a repository rule is outside all of this: no task writes anything for it."
   - `docs/running.md:95`: "no task is planned and nothing is written under the rule".
   - `agents/redline-plan-approver.md` rule 1: "a task that changes a file for it is a bounce".
   - `tests/loop-test.mjs:3754`: "its task having no files by rule".
   - The PR spec's decision 20 ("A fix or an accept a reshape puts under a rule is as today (row 20)") keeps the outcome row 20 names, "kind `left`; nothing demanded", which a held finding still has.
2. **R4-2: warn or stop?** Warn. `workflows/redline-loop.js:4015-4016`: "Only a complete draft is kept: one short of a field would stop the round below for an option the shaper never wrote."
3. **R4-1: is a call's reason enough when the tag names no declared rule?** Yes. R3-6's answer stands: the call's reason is the shaper's judgment as much as the tag is (the comment above `forceAskRules`, 3942-3945, "a prose rule is the shaper's own askRule tag or, with no tag, the rule its call names"). A tag that names no declared rule names nothing, so the call's reason is the only input that does. `docs/contract.md:153` says the workflow "holds to" the shaper's sorting under a prose rule.
4. **R4-3: warn or refuse?** Warn. `skills/redline/SKILL.md:213` says an answer back when it does not do what its words suggest; the draft stop shows the agent's draft before it is filed (`docs/running.md`, "Deferred items", "The draft").
5. **Measurement.** The node harness is refused to the shaper (`redline-guard (shaper): 'node' is not available to the shaper`, seen this round). So the reviewer's reproduction `/tmp/redlinerepro/reviewer-r4-repro.mjs` was read and not run. Every fix is `one-place`, each with its members found by reading and listed in its entry. Each task's new loop cases are the code's measurement, seen red then green through the gate.
6. **Self-hosted.** This round edits `workflows/redline-loop.js`, `skills/redline/SKILL.md` and `agents/redline-shaper.md`, which the PR's caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"), and a changed agent file is reported, never pinned (agents.md line 45).
7. **Version.** Stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No template body changes, so the marker stays v7. `reshapePrompt` is the workflow's, not the template's.
8. **Visuals, product context.** None; `agent-os/product/` does not apply to a review round.
9. **Adjustment 1: does the transient set change what a relaunch replays?** No. It is filled and read inside one `vetShape` and the hold after it, and never written to the record or to a prompt. So every prompt before a stopping point is byte-identical between a launch and its relaunch (replay.md, the file's opening line).
10. **Adjustment 2: which of the approver's two ways?** The second, one clause in both places. The approver offered either, and agents.md line 17 asks that a rule be stated in the same words everywhere it is stated. The reshape prompt's clause was already planned with the phrase, so the shaper's file takes that clause rather than the prompt taking the file's wording.

## Context

- **Visuals:** None.
- **References:** `workflows/redline-loop.js` (`forceAskRules`, `ruleForPaths`, `checkCalls`, `checkWhy`, `checkOptions`, `checkDrafts`, `draftMissing`, `vetShape`, `resolveWith`, `leftEntry`, `leftUnder`, the approve loop's reshape, list update, hold and rebuild, `reshapePrompt`, `planPrompt`, `rulesBlock`), `tests/loop-test.mjs` (the mock shaper and resolve, `callAt`, the harness-wide block checks, the `rules:`, `reshape:`, `filing:`, `ends:`, `left:` and `resume:` sections), `agents/redline-plan-approver.md`, `agents/redline-shaper.md`, `skills/redline/SKILL.md`, `docs/running.md`, `docs/contract.md`; the PR's spec folder and round 3's. See `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- workflow/agents: line 10 (a class an earlier round fixed is fixed as the class; R4-1, R4-4), line 11 (`forceAskRules` applies the rules; R4-1, R4-2), line 16 (a message says when it fires in the words of the decision behind it, and a stop's message says what its rule asks of the case that reached it; R4-1, R4-2, R4-3, and R4-4's two wordings after adjustment 1), line 17 (a rule is changed everywhere it is stated, in the same words; R4-4's `agents/redline-shaper.md` clause, stated once after adjustment 2), line 47 (a claim the workflow cannot honour is cleared or held, never trusted; R4-4).
- workflow/replay: a prompt that names no left decided finding is byte-identical to today's, and the transient set of adjustment 1 reaches no prompt (R4-4).
- testing/tests: line 35, red before green; line 30, a case per changed surface with its neighbour; line 37, a count read off the source (the `resume:` pins, unchanged).
- process/docs-gate: every task touching `workflows/`, `skills/` or `agents/` names its docs section.
- process/release: no version bump in a review round.
- prompts/attribution: no model or vendor name anywhere.

## Standards retrospective (proposed)

1. `agent-os/standards/workflow/agents.md`, line 10, append: "; and a fix recorded as one-place names every path into the place it closes, found by asking where else the state it guards is set, not only by the case that was reported: R3-6 read a call's reason only when the finding had no tag, where the question was whether any input named a declared rule, so an undeclared tag still ran the call as an ordinary one (#127, R4-1); and R3-10 held a left finding's task at the resolve that applies it, while a decided finding a reshape later left to the person set off no resolve, so the task its first resolve planned was built (#127, R4-4)".
2. `agent-os/standards/workflow/agents.md`, line 11, append: "; and the call's reason is read whenever neither a paths rule nor a declared tag names one, with a warning that says which input named nothing (#127, R4-1); a shaper's deferral whose draft is short of a field is not kept as an option of its call, and the run says so with the fields it lacks (#127, R4-2); and the hold after each reshape names every decided finding to the reshape, a left one as left to the person, and stops on a left one whose task has files, since no resolve rewrites the task of a decided finding a reshape leaves to the person (#127, R4-4)".
3. `agent-os/standards/workflow/agents.md`, line 16, append: "; and a stop a resume is asked to correct names a correction that clears it for every input that reaches it, found by asking what the rerun is shown and what the check reads once the named change is made: the hold after a reshape told a decided finding left to the person only by the paths rule on its task's files that no task writes for it, when removing those files took it out from under the rule and stopped the rerun again as a fix with no task (#127, R4-4, adjustment 1)".
4. `agent-os/standards/testing/tests.md`: no change. Adjustment 2's two points are instances of line 35 (a check is seen red, then green, so a check that cannot turn green is caught at the plan) and of the plan's own rule that a check pinning what a task removes follows it and is named. The approver caught both, as that rule intends.
5. `agent-os/standards/process/docs-gate.md`: no change.
