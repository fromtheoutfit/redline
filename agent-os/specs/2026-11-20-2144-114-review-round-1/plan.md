# PR #114 review round 1: what the reshape is asked and told about a decided finding, and how its list is read

Spec folder: `agent-os/specs/2026-11-20-2144-114-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #114 (issue #106), from the round's seven findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- `fix`, one task each, in finding order: R1-1 (Task 2), R1-2 (Task 3), R1-3 (Task 4), R1-4 (Task 5), R1-6 (Task 6), R1-7 (Task 7). Part of R1-1's fix is standards item 1, applied in the round's standards commit (Task 8, step 12).
- `defer`, no task: R1-5. It ships no mitigation. Its drafted issue is under `## Deferred` in `shape.md`, and the run files it.
- No `decline`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#106)`. No commit subject holds a bare `@word`.

Line numbers are at `5a6d018`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `agents/redline-resolve.md`, `agents/redline-plan-approver.md` or the gate's backticked text. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`**, which the pull request's own caution names ("a round that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file, which the skill lists (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). The agent file's edit is one clause that agrees with the prompt either way (`shape.md`, Unattended answer 11).

**Task order matters in four files.**

- `workflows/redline-loop.js`:
  - Task 4 replaces the comment and the first lines of `reshapePrompt` (2054-2063), changes the reshape call in the approve loop (4064), adds `endsIn` after `const stated = {}` (3796) and deletes the `endsIn` line in the reshape loop (4099).
  - Task 5 adds a constant after `FILES_ASK` (911) and changes the Return sentence of `reshapePrompt` (2078).
  - Task 6 replaces the comment and the line of `taskFilesOf` (481-483), and changes the reshape loop's comment (4076) and its `now` line (4079).
  - Task 7 replaces the comments above `deferredEntry` (3456-3460) and inside `draftView` (3478-3481). Its mutation step touches line 4127 and restores it.
- `tests/loop-test.mjs`:
  - Task 2 changes a comment (3309-3310).
  - Task 3 adds two phrases to the `docs/running.md` phrase list (2924).
  - Task 4 changes the shaper mock (216-220) and three checks (3326, 3329, 3353), adds a check after 3331 and a block of checks after 3384.
  - Task 5 adds constants after 368 and lines inside `go()` (after 388), changes `withoutBlock` and its comment (3314-3324) and the check at 3327, adds a check after 3327, and adds a final check after 4053.
  - Task 6 adds checks after Task 4's block (after 3384) and after 3514.
  - Task 7 adds a case after 3313 and one phrase to the list at 2924.
- `docs/running.md`: Tasks 3 and 7 change different sentences of the bullet "A reshape after your decision" (127).
- `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`: Task 2 changes decision 18 (42), and Task 7 changes one row of the reader list (70).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-1/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`. Task 7's case is a pin of behaviour that already holds, so it is seen red under a mutation instead (`testing/tests`, line 35), as that task says.

**Expected counts.** Before this round, the loop prints `1510 checks passed, 0 failed` (the pull request's description and its spec's As built), and the other harnesses print what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 0 | spec records and a test comment; no harness reads them |
| Task 3 | 2 | two docs phrase pins |
| Task 4 | 2 | the block's ends, and the shaper's file; three existing checks change their expected text |
| Task 5 | 2 | the decided round's files clause, and one check over every scenario |
| Task 6 | 4 | three named checks, and the run-record check `go` adds to the path-form run, which reaches Finish |
| Task 7 | 2 | the end-of-run pin, and one docs phrase pin |

So the loop reads `1522 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md` (a run that does or does not reach Finish adds or drops the run-record check `go` adds).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-20-2144-114-review-round-1/plan.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-1/shape.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-1/standards.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #114 (#106)`

## Task 2: R1-1, correct why no round stop shows a decided deferral's reshaped files

`shape.md`, Decision 1 and Unattended answer 8. The standard's own line is corrected through standards item 1 (Task 8, step 12), not in this task.

**Files:**

- `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`
- `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/plan.md`
- `tests/loop-test.mjs`

**Change.**

1. In `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`, decision 18 (line 42), the clause:

   ```
   but a decided deferral's draft is always answered before a reshape can run (the stop after the resolve that drafted it holds the round until it is), and an answered draft
   ```

   becomes:

   ```
   but a decided deferral's draft is either answered before a reshape can run (the stop after the resolve that drafted it holds the round until it is) or, on autopilot or with `defer at end`, never raised at a round's stop at all (`raisesDrafts` is false there), and an answered draft
   ```

   and the decision's last sentence, `See the #104 note.`, becomes:

   ```
   See the #104 note. Corrected in review round 1 of #114 (R1-1): this decision first said the draft is always answered before a reshape can run, which holds only in a round that raises drafts.
   ```

2. In `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/plan.md`, decision 18 (line 38), the clause:

   ```
   but a decided deferral's draft is always answered before a reshape can run, and an answered draft is not raised again (#104).
   ```

   becomes:

   ```
   but a decided deferral's draft is either answered before a reshape can run or, on autopilot or with `defer at end`, never raised at a round's stop at all, and an answered draft is not raised again (#104).
   ```

   and the decision's last sentence:

   ```
   `shape.md` says this change widens #104's case and leaves it.
   ```

   becomes:

   ```
   `shape.md` says this change widens #104's case and leaves it. (Corrected by #114, R1-1.)
   ```

3. In `tests/loop-test.mjs`, the comment (3309-3310):

   ```js
     // The end-of-run stop shows the list too. No round's stop can: a decided deferral's draft is
     // answered before a reshape can run, and an answered draft is not raised again (#104).
   ```

   becomes:

   ```js
     // The end-of-run stop shows the list too. No round's stop can: a decided deferral's draft is
     // answered before a reshape can run, or, on autopilot or with `defer at end`, is never raised at
     // a round's stop, and an answered draft is not raised again (#104; #114, R1-1).
   ```

No other sentence of either decision changes.

**Test.** None: no harness reads these sentences. `grep -n "answered before a reshape can run" tests/loop-test.mjs` prints only the comment line. The reason is the workflow's: `raisesDrafts` is `interrupt !== 'autopilot' && (deferAt === 'round' || pass.human)` (`workflows/redline-loop.js:3704`), and `openDrafts` returns `[]` when it is false (3728).

**Docs entry:** no file under the gate's Docs directories changes; spec records and a test comment only.

**Commit:** `redline: R1-1 correct why no round stop shows a decided deferral's reshaped files (#106)`

## Task 3: R1-2, say which findings were shown the first-planned task, and name the human pass's reshape label

`shape.md`, Decision 2 and Unattended answer 10.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, the `docs/running.md` phrase list (line 2924), right after its element:

```js
'stops the run at stage `shape`, resumable at that reshape'
```

add two elements:

```js
'or `reshape h<n> #<k>` in a human review pass', 'and so, for a deferral, are a draft at the end-of-run stop and the two warnings above'
```

See both new `defer: docs/running.md says "..."` checks fail on a gate run.

**Change.** In `docs/running.md`, section "Deferred items", bullet "A reshape after your decision" (line 127):

1. The clause:

   ```
   and the plan approver's next pass, the implementer, a draft at the end-of-run stop and the two warnings above are shown those files, where they were shown the task as first planned.
   ```

   becomes:

   ```
   and the plan approver's next pass and the implementer are shown those files, and so, for a deferral, are a draft at the end-of-run stop and the two warnings above. Before #106 a deferral you set yourself (`<id>: defer. <reason>`) was shown its task as first planned, and every other finding you or the autopilot decided was shown the shaper's list from before the decision, then the reshape's own.
   ```

2. The clause:

   ```
   resumable at that reshape (`reshape r<n> #<k>`), where
   ```

   becomes:

   ```
   resumable at that reshape (`reshape r<n> #<k>`, or `reshape h<n> #<k>` in a human review pass), where
   ```

No other sentence of the bullet changes. Every phrase the list already pins for this bullet stays in it.

**Docs entry:** this task is the `docs/` change itself; a change to `docs/` needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R1-2 say which findings were shown the first-planned task, and name the human pass's reshape label (#106)`

## Task 4: R1-3, name each decided finding's end in the reshape block

`shape.md`, Decision 3 and Unattended answer 9.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-shaper.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the shaper mock, the lines (216-220):

   ```js
         // The findings a reshape prompt names as decided (#106): for each, files is its task as
         // plan.md holds it, whatever disposition the reshape returns. By default that is what the
         // scripted resolve planned; scenario.reshapeFiles[id] scripts a task the reshape changed.
         const decidedLine = reshape ? prompt.match(/Findings the person or the autopilot decided: ([^.]*)\./) : null
         const namedDecided = decidedLine ? decidedLine[1].split(', ') : []
   ```

   become:

   ```js
         // The findings a reshape prompt names as decided (#106): for each, files is its task as
         // plan.md holds it, whatever disposition the reshape returns. By default that is what the
         // scripted resolve planned; scenario.reshapeFiles[id] scripts a task the reshape changed.
         // Each is named with what its decision ends in (#114, R1-3), so the ids are read off the
         // list by their form.
         const decidedLine = reshape ? prompt.match(/Findings the person or the autopilot decided: ([^.]*)\./) : null
         const namedDecided = decidedLine ? [...decidedLine[1].matchAll(/[RH]\d+-\d+/g)].map((m) => m[0]) : []
   ```

   It reads the list in both forms, so every run is unchanged before the workflow change.

2. Three checks change their expected block text, each found by its name:

   - `reshape: the reshape prompt of a round with a decided finding names it and says its files are its task as plan.md holds it, whatever disposition is returned` (3326): `` `${DECIDED_BLOCK}R1-1. ` `` becomes `` `${DECIDED_BLOCK}R1-1 (deferred). ` ``.
   - `reshape: the block names the decided finding alone, never one left to the person under a rule or one nobody decided` (3329): `` `${DECIDED_BLOCK}R1-1. ` `` becomes `` `${DECIDED_BLOCK}R1-1 (fix). ` ``.
   - `reshape: a call the reshape raises stops the round after a reshape prompt that names the decided finding` (3353): `` `${DECIDED_BLOCK}R1-1. ` `` becomes `` `${DECIDED_BLOCK}R1-1 (deferred). ` ``.

   `emptied` and `raisedStop` decide R1-1 by a defer override. In `twoDecided`, R1-1 is a call the scripted resolve states as a fix, and R1-2, left to the person under a rule, is not named.

3. Right after the check named `reshape: the shaper's file states the same rule for a finding the invoking prompt names as decided` (3331), add:

   ```js
     check('reshape: the shaper\'s file says the invoking prompt names each decided finding with what its decision ends in', shaperFile.includes('each with what its decision ends in (fix, accepted or deferred)'))
   ```

4. Right after the check named `reshape: the stop names every decided fix the reshape left with no task` (3384), add:

   ```js
     // The block names each decided finding with what its decision ends in, read as the hold reads
     // it (#114, R1-3): an override's or a call's own disposition, else what the resolve agent
     // stated. Until then it named the ids alone, and the reshape could learn the end only from the
     // task's wording in plan.md.
     const blockNames = (r, end) => reshapePromptOf(r).includes(`${DECIDED_BLOCK}R1-1 (${end}). Each is named with what its decision ends in. `)
     const blockLine = (r) => (reshapePromptOf(r).match(/Findings the person or the autopilot decided: [^.]*\./) || [''])[0]
     check('reshape: the block names each decided finding with its end: an override, a named call and a stated call, as a fix, as accepted or as deferred', blockNames(emptied, 'deferred') && blockNames(fixEmptied, 'fix') && blockNames(namedFixEmptied, 'fix') && blockNames(statedFixEmptied, 'fix') && blockNames(acceptTasked, 'accepted') && blockNames(statedAcceptTasked, 'accepted'), [emptied, fixEmptied, namedFixEmptied, statedFixEmptied, acceptTasked, statedAcceptTasked].map(blockLine))
   ```

See the three changed checks and the two new ones fail on a gate run.

**Change.** In `workflows/redline-loop.js`:

1. The comment and the first lines of `reshapePrompt` (2054-2063):

   ```js
   // `decided` is the ids of the findings the person or autopilot decided whose task the round reads
   // from its own list (#106). The block that names them says what `files` means for each: every
   // shape prompt asks, for an ask, for the paths of the recommended change, which is the wrong list
   // for a call the person answered, and after a reshape the workflow takes a decided finding's task
   // from this list. The whole ask sits in the block, and the block is in the prompt only when the
   // round has such a finding, so a reshape of any other round keeps the prompt it had before #106.
   function reshapePrompt(pass, specFolder, inScope, adjustments, attempt, decided) {
     const decidedBlock = decided.length
       ? `\n\nFindings the person or the autopilot decided: ${decided.join(', ')}. For each of these, files is the paths of its task as plan.md holds it when you are done, an empty list when it has no task, whatever disposition you return for it: after a reshape the workflow reads a decided finding's task from this list. A finding decided as a fix keeps a task with files, and one decided as accepted keeps none.`
       : ''
   ```

   become:

   ```js
   // `decided` is the findings the person or autopilot decided whose task the round reads from its
   // own list (#106), each as {id, end}: end is what its decision ends in (endsIn in revise(): fix,
   // defer or accept). The block that names them says what `files` means for each: every shape
   // prompt asks, for an ask, for the paths of the recommended change, which is the wrong list for
   // a call the person answered, and after a reshape the workflow takes a decided finding's task
   // from this list. It names each with its end, which the hold after the reshape reads, so the
   // reshape is told which task the hold expects rather than left to infer it from plan.md, since
   // shape.md's decided entry records the choice and not its end (#114, R1-3). The whole ask sits in
   // the block, and the block is in the prompt only when the round has such a finding, so a reshape
   // of any other round keeps the prompt it had before #106.
   function reshapePrompt(pass, specFolder, inScope, adjustments, attempt, decided) {
     // How the block names each end, in the words of the rule after the list (#114, R1-3). An end
     // the round has not read is named by the id alone.
     const endWord = { fix: 'fix', defer: 'deferred', accept: 'accepted' }
     const decidedBlock = decided.length
       ? `\n\nFindings the person or the autopilot decided: ${decided.map((d) => (endWord[d.end] ? `${d.id} (${endWord[d.end]})` : d.id)).join(', ')}. Each is named with what its decision ends in. For each of these, files is the paths of its task as plan.md holds it when you are done, an empty list when it has no task, whatever disposition you return for it: after a reshape the workflow reads a decided finding's task from this list. A finding decided as a fix keeps a task with files, and one decided as accepted keeps none.`
       : ''
   ```

   The block keeps its opening words, which the mock, `DECIDED_BLOCK` and the check over every scenario read.

2. Right after the line (3796):

   ```js
     const stated = {}
   ```

   add:

   ```js
     // What a decided finding's decision ends in (#99; #108, R1-5): its own disposition when it
     // names one, an override's or a call's, and else what the resolve agent stated for the call.
     // The hold after each reshape reads it, and the reshape prompt names it beside each decided
     // finding, so the reshape is told which task the hold expects (#114, R1-3).
     const endsIn = (id) => roundDecisions[id].disposition || stated[id]
   ```

3. In the reshape loop, delete the line (4099):

   ```js
       const endsIn = (id) => roundDecisions[id].disposition || stated[id]
   ```

   The hold below it reads the `endsIn` of step 2, which is the same expression. Its comment (4089-4097) is unchanged.

4. The reshape call in the approve loop (4064), the text:

   ```js
   adjustment + 1, inScope.map((f) => f.id).filter(tracked)), {
   ```

   becomes:

   ```js
   adjustment + 1, inScope.map((f) => f.id).filter(tracked).map((id) => ({ id, end: endsIn(id) }))), {
   ```

   Every tracked id has been through a resolve by then, which states each call or stops the round, so its end is read.

5. In `agents/redline-shaper.md`, rule 10 (line 33), the clause:

   ```
   When you are called again after a bounced plan, the invoking prompt may name the findings the person or the autopilot decided: for each of these,
   ```

   becomes:

   ```
   When you are called again after a bounced plan, the invoking prompt may name the findings the person or the autopilot decided, each with what its decision ends in (fix, accepted or deferred): for each of these,
   ```

   No other sentence of the agent file changes. The phrases the loop test pins in it (`as \`plan.md\` holds it when you are done`, `whatever disposition you return for it`, `keeps a task with files`, `correct the task the error names`) stay.

A reshape prompt with no block is byte-identical to what it was. Only reshape prompts that carry the block change, and those are new in this pull request (workflow/replay, line 23).

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision". No reader-facing change: the bullet says the reshape is asked for each decided finding's task, and naming each decision's end is how the prompt asks it.
- `agents/redline-shaper.md`: the same bullet. No reader-facing change: the README's roles table names the file, and the behaviour is in that bullet.

**Commit:** `redline: R1-3 name each decided finding's end in the reshape block (#106)`

## Task 5: R1-4, ask a decided finding's files in one meaning on a reshape

`shape.md`, Decision 4 and Unattended answer 4.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. Right after the line (368):

   ```js
   const strayDecidedBlock = []
   ```

   add:

   ```js
   // What a reshape prompt that names decided findings asks of a finding's files (#114, R1-4): an
   // ask still pending by its recommended paths, a named finding by its task, and never the clause
   // that covers both (#103, R2-5). Every run is read, and one check at the end names the offenders.
   const FILES_PENDING = 'for an ask, the paths its recommended change would touch)'
   const FILES_DECIDED = 'for an ask still pending, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
   const doubleFilesAsk = []
   ```

2. In `go()`, right after the lines (386-388):

   ```js
       if (c.agentType !== 'redline:redline-shaper' || !c.prompt.includes(DECIDED_BLOCK)) {
         return
       }
   ```

   add:

   ```js
       if (c.prompt.includes(FILES_PENDING)) {
         doubleFilesAsk.push(`${name}: ${c.label}`)
       }
   ```

3. The comment's last line above `reshapePromptOf` (3318):

   ```js
     // prompt is the one the same round has with no decision.
   ```

   becomes:

   ```js
     // prompt is the one the same round has with no decision, once the Return sentence's files
     // clause, which the block qualifies (#114, R1-4), is put back as it reads with no block.
   ```

   and `withoutBlock`'s return line (3323):

   ```js
       return a < 0 || b < 0 ? null : p.slice(0, a) + p.slice(b)
   ```

   becomes:

   ```js
       return a < 0 || b < 0 ? null : p.slice(0, a) + p.slice(b).replace(FILES_DECIDED, FILES_PENDING)
   ```

4. The check named `reshape: the reshape prompt of a round with no decided finding has no such block, and is the decided round's prompt with the block cut out` (3327) is renamed `reshape: the reshape prompt of a round with no decided finding has no such block, and is the decided round's prompt with the block cut out and the files clause put back`. Its condition is unchanged. Before the change it is green as it was, since `FILES_DECIDED` is not in the prompt yet and `replace` leaves it alone.

5. Right after that check, add:

   ```js
     check('reshape: a reshape prompt that names decided findings asks for files in one meaning: an ask still pending by its recommended paths, a named finding by its task', reshapePromptOf(emptied).includes(FILES_DECIDED) && !reshapePromptOf(emptied).includes(FILES_PENDING) && reshapePromptOf(undecided).includes(FILES_PENDING) && !reshapePromptOf(undecided).includes(FILES_DECIDED), reshapePromptOf(emptied).slice(-900))
   ```

6. Right after the last check of the file, `no shaper prompt of any scenario names decided findings unless the plan approver before it was shown a decision` (4053), add:

   ```js
   check('no reshape prompt that names decided findings asks an ask for its recommended paths in a clause that covers them too', doubleFilesAsk.length === 0, doubleFilesAsk.slice(0, 5))
   ```

See the two new checks fail on a gate run. The renamed check is the neighbour and stays green before and after.

**Change.** In `workflows/redline-loop.js`:

1. Right after the line (911):

   ```js
   const FILES_ASK = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask, the paths its recommended change would touch)'
   ```

   add:

   ```js
   // The same ask in a reshape prompt whose block names decided findings (#114, R1-4): the block
   // gives a named finding's files one meaning, its task as plan.md holds it, whatever disposition
   // is returned, so this clause keeps the recommended paths for an ask still pending and sends a
   // named finding to the block, and no sentence of that prompt gives one finding two meanings
   // (#103, R2-5). It is used only beside the block, so a reshape prompt with no block keeps
   // FILES_ASK, byte for byte.
   const FILES_ASK_DECIDED = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask still pending, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
   ```

2. In `reshapePrompt`'s Return sentence (2078), the text:

   ```js
   decidedBy, recommendation and ${FILES_ASK}${pass.human
   ```

   becomes:

   ```js
   decidedBy, recommendation and ${decided.length ? FILES_ASK_DECIDED : FILES_ASK}${pass.human
   ```

   No other prompt uses the new constant. The shape prompts (2012, 2051) keep `FILES_ASK`, and `defer: the shape prompt asks an ask for the paths its recommended change would touch, as the ask-rules block does` (2974) is unchanged. `FILES_ASKED` (`an empty list when it has no task`) is in both clauses, so `filing: the reshape prompt asks for every finding's files` (3620) stays green.

The clause sits outside the block, but only under the block's own condition, so every reshape prompt without the block is byte-identical and still replays. `shape.md`, Unattended answer 4, reads this against workflow/replay, line 23, and standards item 5 records it.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision". No reader-facing change: the bullet already says the reshape is asked for the files of each decided finding's task as `plan.md` holds it, and this makes the prompt's return line agree.

**Commit:** `redline: R1-4 ask a decided finding's files in one meaning on a reshape (#106)`

## Task 6: R1-6, read a decided finding's task paths in one form

`shape.md`, Decision 6 and Unattended answer 7.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. Right after Task 4's check named `reshape: the block names each decided finding with its end: an override, a named call and a stated call, as a fix, as accepted or as deferred`, add:

   ```js
     // A path is read one way, from a resolve's tasks and from a reshape's list alike (#114, R1-6):
     // trimmed, with the repository root or a leading ./ taken off and a blank dropped. A reshape
     // that writes the resolve's file another way lists the same file, so nothing changes and
     // nothing is warned; and a list of blanks is no list, so a decided fix left with one is held.
     const sameFileAnotherWay = await go('reshape: an override to defer whose task the reshape lists in other forms of the same path', deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': ['./app/x.php', '/r/app/x.php', ' app/x.php '] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
     check('reshape: a reshape that lists the resolve\'s file in other forms changes nothing: the second pass is shown it as it was, and nothing is warned', sameFileAnotherWay.res.status === 'done' && approverFiles(sameFileAnotherWay, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(sameFileAnotherWay, 'the reshape changed'), [sameFileAnotherWay.res.status, sameFileAnotherWay.res.error, approverFiles(sameFileAnotherWay, 'R1-1', PASS_2), (sameFileAnotherWay.res || {}).warnings])
     const fixBlanked = await go('reshape: an override to fix whose task the reshape lists as a blank path', { ...overrideDial, decisions: toFix }, { ...declined, reshapeFiles: { 'R1-1': [''] } })
     check('reshape: an override to fix the reshape leaves with only a blank path stops at that reshape, as one with no files does', stopsAtReshape(fixBlanked, NO_TASK('a disposition override names')), stopOf(fixBlanked))
   ```

   The harness's repository root is `/r` (`tests/loop-test.mjs:355`).

2. Right after the check named `filing: a call stated as a fix is held to its own task's files, whatever another call's task lists` (3514), add:

   ```js
     // A blank path is no file at the resolve-time check either (#114, R1-6): it reads the task's
     // files through the same cleanup as the list the round keeps.
     const fixBlankFile = await go('filing: the resolve agent states a fix and plans a task whose only file is blank', { ...baseArgs, interrupt: 'autopilot' }, { ...oneCall, resolveDecided: { 'R1-1': 'fix' }, resolveFiles: { 'R1-1': [''] } })
     check('filing: a call stated as a fix whose task lists only a blank path stops at resolve, as one with no task with files does', stopsAtResolve(fixBlankFile, 'the resolve agent stated fix for R1-1 with no task with files; a fix names the files it changes'), stopDetail(fixBlankFile))
   ```

See the three checks fail on a gate run. The first warns `from app/x.php to ./app/x.php, /r/app/x.php,  app/x.php ` and shows that list on the second pass. The second and the third run past the hold, since `['']` counts one file.

**Change.** In `workflows/redline-loop.js`:

1. The comment and the line of `taskFilesOf` (481-483):

   ```js
   // The files of the tasks a list holds for one finding (#108, R1-7): the resolve-time checks read
   // one resolve's tasks, plannedFiles every resolve's of the round, and both read them this way.
   const taskFilesOf = (tasks, id) => unique(tasks.filter((task) => task.finding === id).flatMap((task) => task.files))
   ```

   become:

   ```js
   // A list of paths as an agent returned it, read one way (#114, R1-6): each path trimmed, the
   // repository root or a leading ./ taken off (planPaths takes the root off the approver's list
   // too), and a blank dropped, so one file written two ways is one file and a list of blanks is no
   // list. A finding's task is read through it from a resolve's tasks and from a reshape's list
   // alike, so the holds, the warnings and the list the round keeps compare one form.
   const cleanPaths = (list) => unique(list.map((path) => String(path).trim()).map((path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path.replace(/^\.\//, ''))).filter(Boolean))
   // The files of the tasks a list holds for one finding (#108, R1-7), read through cleanPaths: the
   // resolve-time checks read one resolve's tasks this way, and so does the list the round keeps for
   // each decided finding (decidedFiles, #106).
   const taskFilesOf = (tasks, id) => cleanPaths(tasks.filter((task) => task.finding === id).flatMap((task) => task.files))
   ```

   The old comment's "plannedFiles every resolve's of the round" is the reading #106 removed, so it changes with the line (workflow/agents, line 17). The source check `defer: a finding's task files are read through one helper, by the resolve-time checks and for the list plannedFiles reads (#108, R1-7; #106)` (2942) still finds `const taskFilesOf = (tasks, id) =>`.

2. In the reshape loop, the comment's last line (4076):

   ```js
       // owner. A finding this reshape left to the person under a rule is no longer tracked.
   ```

   becomes:

   ```js
       // owner. A finding this reshape left to the person under a rule is no longer tracked. The
       // list is read through cleanPaths, as a resolve's is, so one file written another way is no
       // change and a blank is no file (#114, R1-6).
   ```

   and the line (4079):

   ```js
         const now = unique(listed && Array.isArray(listed.files) ? listed.files : [])
   ```

   becomes:

   ```js
         const now = cleanPaths(listed && Array.isArray(listed.files) ? listed.files : [])
   ```

No existing scenario scripts a path that the cleanup changes (no `./`, `/r/`, padded or blank path in any `resolveFiles`, `reshapeFiles`, `resolveExtraTasks` or `files`), so no existing check changes its expectation and no prompt of an existing scenario changes.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision" ("A reshape that lists the same files changes nothing"). No reader-facing change: a path written another way names the same file, which that sentence already promises.

**Commit:** `redline: R1-6 read a decided finding's task paths in one form (#106)`

## Task 7: R1-7, say a decided deferral's words stay the decision's after a reshape, and pin it

`shape.md`, Decision 7 and Unattended answer 6.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. Right after the check named `reshape: the end-of-run stop shows a held draft with the files the reshape left its task` (3313), add:

   ```js
     // The words beside a held draft stay the decision's when a reshape moves its task (#114,
     // R1-7): the reshape's own entry for a decided finding is dropped (#97, R3-6), so the person is
     // shown the words the resolve agent planned the decision with, beside the files as reshaped and
     // a commit that shipped. A pin: it held before R1-7, and a mutation that keeps the reshape's
     // entry turns it red.
     const heldMoved = await go('reshape: an override to defer whose task the reshape moves and restates, a commit of its own landing, held to the end', { ...deferArgs, deferAt: 'end', deferrals: {} }, { ...deferBounced, reshapeFiles: { 'R1-1': ['app/y.php'] }, reshapeDefer: ['R1-1'], reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
     const heldMovedDraft = ((heldMoved.res || {}).drafts || [])[0] || {}
     check('reshape: the end-of-run stop shows a moved decided mitigation with the files as reshaped and the words its resolve planned, the reshape\'s restated entry dropped', heldMoved.res.status === 'handoff' && heldMoved.res.handoffKind === 'deferred' && JSON.stringify([heldMovedDraft.id, heldMovedDraft.ships, heldMovedDraft.mitigation, heldMovedDraft.files]) === '["R1-1",true,"a guard",["app/y.php"]]' && anyWarning(heldMoved, 'the reshape listed R1-1 as deferred'), [heldMoved.res.status, heldMoved.res.handoffKind, heldMoved.res.error, heldMovedDraft, (heldMoved.res || {}).warnings])
   ```

   The resolve's entry is `guardEntry` (`mitigation: 'a guard'`). The reshape's, from `reshapeDefer`, carries the mock's default `a guard clause`.

2. In the `docs/running.md` phrase list (line 2924), right after Task 3's element `'and so, for a deferral, are a draft at the end-of-run stop and the two warnings above'`, add the element:

   ```js
   'stay as the resolve agent wrote them for your decision'
   ```

3. **The mutation, never committed.** In `workflows/redline-loop.js`, replace the line (4127):

   ```js
       const reshaped = shaped.deferred.filter((d) => !roundDecisions[d.id])
   ```

   with:

   ```js
       const reshaped = shaped.deferred.filter(() => true)
   ```

   Run the gate: the new case is red (its view shows `a guard clause`), and so is the new phrase pin. Then put the line back exactly as it was. `git diff -- workflows/redline-loop.js` shows no change to it, and only this task's comment edits below go into the commit. Record the red run under As built (`testing/tests`, line 35: a pin that already held is seen red under a mutation of the clause it turns on).

**Change.**

1. In `workflows/redline-loop.js`, the comment above `deferredEntry` (3456-3460):

   ```js
   // A deferred item as the result and the handoff carry it (#95): the finding, whether a mitigation
   // shipped (`ships`: its outcome holds a commit of the finding's own, #100, which the session's
   // closing summary reads, never the emptiness of the words; #103, R2-7), its mitigation (the words
   // as written when one shipped) and full fix, its draft as filed (for the session's closing
   // summary, which prints it when the setting is print), where it went, and its outcome as posted.
   ```

   becomes:

   ```js
   // A deferred item as the result and the handoff carry it (#95): the finding, whether a mitigation
   // shipped (`ships`: its outcome holds a commit of the finding's own, #100, which the session's
   // closing summary reads, never the emptiness of the words; #103, R2-7), its mitigation (the words
   // as written when one shipped: for a deferral the person or autopilot decided, as its resolve
   // wrote them, whatever a reshape made of its task; #114, R1-7) and full fix, its draft as filed
   // (for the session's closing summary, which prints it when the setting is print), where it went,
   // and its outcome as posted.
   ```

2. In `draftView`, the comment (3478-3481):

   ```js
     // What ships is the round's record, never the words (#100): at a round's stop, before the
     // build, a task planned with files; at the end-of-run stop, where the draft carries its
     // round's outcome, a commit of the finding's own. `files` is the planned task's paths at both.
     // The words are shown only beside a mitigation that ships.
   ```

   becomes:

   ```js
     // What ships is the round's record, never the words (#100): at a round's stop, before the
     // build, a task planned with files; at the end-of-run stop, where the draft carries its
     // round's outcome, a commit of the finding's own. `files` is the planned task's paths at both.
     // The words are shown only beside a mitigation that ships. They are the entry's, which for a
     // deferral the person or autopilot decided is the one its resolve returned, since a reshape's
     // entry for it is dropped (#97, R3-6): after a reshape that changed its task, `files` is the
     // task as reshaped and the words are the decision's as planned (#106; #114, R1-7).
   ```

   No code line changes.

3. In `docs/running.md`, bullet "A reshape after your decision" (127), the sentence:

   ```
   A reshape that lists the same files changes nothing.
   ```

   becomes:

   ```
   A reshape that lists the same files changes nothing. The mitigation's words beside a draft and in the run's deferred list stay as the resolve agent wrote them for your decision, since the reshape's entry is dropped: when a reshape moves the task, its files and the finding's own commit say what ships.
   ```

4. In `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md`, the reader list's `draftStop` row (70), its last cell:

   ```
   | The list. No round stop can show a changed one today (decision 18). |
   ```

   becomes:

   ```
   | `files` and `ships`: the list. The mitigation's words: the entry its resolve returned, as before, since a reshape's entry for a decided finding is dropped (decision 10); this cell read "The list." for all three until #114, R1-7. No round stop can show a changed one today (decision 18). |
   ```

See the case and the phrase pin green on the next gate run.

**Docs entry:** `workflows/redline-loop.js` (comments only): `docs/running.md`, "Deferred items", bullet "A reshape after your decision", the sentence this task adds, which is reader-facing: the person learns where the words beside a moved mitigation come from.

**Commit:** `redline: R1-7 say a decided deferral's words stay the decision's after a reshape, and pin it (#106)`

## Task 8: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1522 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 4 to 7) and `agents/redline-shaper.md` (Task 4), each with the section and the reason given in its task. `docs/running.md` (Tasks 3 and 7) is reader-facing by nature, and Task 7's sentence is the entry for its workflow change. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.4`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/agents.md` (items 1 to 4) and `agent-os/standards/workflow/replay.md` (item 5), each clause read back in its whole line. Title it `redline: record the round 1 review lessons in the standards, finishing R1-1 (#106)` when item 1 is approved, or `redline: record the round 1 review lessons in the standards (#106)` when it is not. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts (Task 7's red under the mutation), and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 1 for PR #114 (#106)`.

**Files** (this task): `agent-os/standards/workflow/agents.md` and `agent-os/standards/workflow/replay.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-20-2144-114-review-round-1/plan.md` and `shape.md` (As built and any deviation).
