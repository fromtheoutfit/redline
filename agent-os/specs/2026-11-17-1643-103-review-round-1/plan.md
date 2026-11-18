# PR #103 review round 1: decided deferrals, the commit demand and the record a deferral is read from

Spec folder: `agent-os/specs/2026-11-17-1643-103-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #103 (issue #100), from the round's twelve findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- `fix`, one task each, in finding order: R1-2 (Task 2), R1-10 (Task 3), R1-11 (Task 4), R1-1 (Task 5), R1-3 (Task 6), R1-5 (Task 7), R1-7 (Task 8), R1-8 (Task 9), R1-12 (Task 10); then R1-6 (Task 11), a fix by the person's disposition override (`shape.md`, Decision 12), planned after the shaper's tasks so their numbers and anchors stand.
- `defer`, none shipping a mitigation, so none has a task: R1-9, R1-4. Their drafted issues are under `## Deferred` in `shape.md`; the run files them.
- No `decline`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#100)`. No commit subject holds a bare `@word`.

Line numbers are at `5a9c2f1`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines; an anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text or any file under `agents/`. The version stays `0.4.1` (`shape.md`, Scope). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

Task order matters in two files. In `workflows/redline-loop.js`: Task 2 adds a helper after `plannedFiles` and changes the plan approver's call; Task 3 changes the `deferralIds` line and the two reads of `deferred.filter(isDeferral)` after the build; Task 4 changes `isDeferral` and its comment; Task 7 renames `filled` at its declaration and in `isDeferral` as Task 4 left it; Task 8 changes one sentence of the comment above the helper Task 7 renamed; Task 9 changes `draftsOf` and its two calls that pass no reader, one of them as Task 3 left it; Task 11 changes the `deferred` cases of `replyBody` and `describeOutcome` and the deferred outcome in `outcomesFor`, lines no earlier task touches. In `tests/loop-test.mjs`: Tasks 2, 3, 4 and 10 add runs to the filing section; Tasks 5, 6, 8, 9, 10 and 11 add phrases or checks to the statement block of the defer section.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check makes the test change first and sees it fail on a gate run (`.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-1/redline/snapshot.json` prints the failing check names), then makes the change and sees it pass. A check named as a neighbour that must not change is green on both runs. Task 10's run check pins behaviour that is already right, so its red run is a mutation, made and undone inside the task and never committed.

**Expected counts.** Before this round (the pull request's As built): loop `1339 checks passed, 0 failed`; the other harnesses as the baseline prints them. `go()` adds one run-record check for each run that reaches Finish (`tests/loop-test.mjs:344-349`), so a red run whose scenario stops elsewhere counts differently from its green one. This round adds 20 loop checks: Task 2, six (three checks, and three runs that reach Finish); Task 3, one (its run stops at the check once green); Task 4, three (two checks, and one run that reaches Finish); Task 5, two phrases; Task 6, one; Task 8, two; Task 9, one; Task 10, three (a check, a run that reaches Finish, a phrase); Task 11, one (a source check, no run). So the loop reads `1359 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built; a count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-1/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-1/shape.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-1/standards.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #103 (#100)`

## Task 2: R1-2, show the plan approver the files the workflow reads for a decided deferral

`shape.md`, Decision 1.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, after the check on the `chosen` run (the check named `filing: a deferral the person chose is filed, and its reply ends with where it went, as their decision`, line 3077), add:

```js
  // The plan approver is shown the files the workflow reads (#103, R1-2): for a deferral the
  // person decided, the task the resolve agent planned, never the shaper's list for the finding's
  // old disposition. An absent heading or JSON that does not parse reads as null, so a run that
  // took another path fails the check and does not throw.
  const approverFiles = (r, id) => {
    const p = (pick(r.calls, 'plan approver r1') || { prompt: '' }).prompt
    const head = "The shaper's dispositions and deferred list, as JSON:\n"
    const a = p.indexOf(head)
    const b = a < 0 ? -1 : p.indexOf('\n\nDecisions made outside the shaper', a)
    if (a < 0 || b < 0) {
      return null
    }
    try {
      const entry = JSON.parse(p.slice(a + head.length, b)).findings.find((x) => x.id === id)
      return entry ? JSON.stringify([entry.disposition, entry.files]) : null
    } catch {
      return null
    }
  }
  const draftFor = (id) => ({ fullFix: 'a lock', title: `Lock ${id}`, found: `found ${id}`, why: `why ${id}` })
  const toDefer = (notes) => ({ 'R1-1': { choice: 'defer', notes, date: '2026-11-17', disposition: 'defer' } })
  const declineToDefer = await go('filing: a decline the person overrules to a deferral with a mitigation', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: toDefer('Defer it behind a guard.'), deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', ...draftFor('R1-1') }], commitIds: [['R1-1']] })
  check('filing: the plan approver is shown the resolve agent\'s files for a decline the person overruled to a deferral with a task', approverFiles(declineToDefer, 'R1-1') === '["defer",["app/x.php"]]', [declineToDefer.res.status, declineToDefer.res.error, approverFiles(declineToDefer, 'R1-1')])
  const fixToDefer = await go('filing: a fix the person changes to a deferral that ships nothing', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: toDefer('Defer it; nothing ships now.'), deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], acceptedCalls: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: '', ...draftFor('R1-1') }], commitIds: [[]] })
  check('filing: the plan approver is shown no files for a fix the person changed to a deferral with no task, whatever the shaper listed', approverFiles(fixToDefer, 'R1-1') === '["defer",[]]', [fixToDefer.res.status, fixToDefer.res.error, approverFiles(fixToDefer, 'R1-1')])
  // The neighbour: a deferral nobody decided is shown with the shaper's own list, as before.
  const ownDefer = await go('filing: the shaper\'s own deferral, as the plan approver is shown it', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], files: { 'R1-1': ['app/y.php'] }, commitIds: [['R1-1']] })
  check('filing: the plan approver is shown the shaper\'s own files for a deferral nobody decided', approverFiles(ownDefer, 'R1-1') === '["defer",["app/y.php"]]', [ownDefer.res.status, ownDefer.res.error, approverFiles(ownDefer, 'R1-1')])
```

(`acceptedCalls` makes the scripted resolve agent plan the finding's task with no files, `tests/loop-test.mjs:255-258`, which is the resolve agent's task for a deferral that ships nothing.) The red run: the first two checks fail (`["defer",[]]` and `["defer",["app/x.php"]]`, the shaper's lists); the neighbour passes.

**Change.** In `workflows/redline-loop.js`, in `revise()`, right after the `plannedFiles` declaration (it ends `: shaperPlanned(id) ? shaperFiles(id) : [])`, line 3791), add:

```js
  // What the plan approver is shown of each finding (#103, R1-2): its disposition after the
  // overrides, and for a deferral the person or autopilot decided, the files of the task the round
  // planned for it (plannedFiles), which is the list the workflow reads, never the shaper's list
  // for the finding's old disposition. Every other finding is shown as the shaper returned it.
  const approverFindings = () => effectiveDispositions().map((f) => (roundDecisions[f.id] && f.disposition === 'defer' ? { ...f, files: plannedFiles(f.id) } : f))
```

and in the plan approver's call (line 3838), replace `{ findings: effectiveDispositions(), deferred }` with `{ findings: approverFindings(), deferred }`.

**Proof:** the gate green, with the three checks above and the existing check that reads the plan approver's prompt (`defer: the plan approver and the implementer are shown the entry with its draft`, line 2856) passing.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. The approver's prompt now carries the list the workflow already reads; `docs/running.md`, "Deferred items", Whether a mitigation shipped, already says a deferral you chose is read from the resolve agent's planned task, and `agents/redline-plan-approver.md` rule 1 is unchanged and now true for it.

**Commit:** `redline: R1-2 show the plan approver the files the workflow reads for a decided deferral (#100)`

## Task 3: R1-10, demand a decided call's fix that a reshape re-sorted to defer

`shape.md`, Decision 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check on the `strayReshape` run (the check named `filing: a reshape's entry beside a decided call raises no draft and files nothing, and the fix is posted as the person's`, line 3094), add:

```js
  // A decided call a reshape re-sorts to defer is no deferral (#97, R1-10), so its planned fix is
  // still demanded (#103, R1-10): left unbuilt, the round stops at the check after its repair, as
  // on the base branch, and files nothing. The run above, with its commit, is the neighbour.
  const strayReshapeUnbuilt = await go('filing: a reshape defers a decided call\'s finding, and the fix is left out', { ...baseArgs, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-16' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, commitIds: [[], []] })
  check('filing: a decided call\'s fix that a reshape re-sorted to defer is still demanded: left unbuilt, the round stops at the check after its repair and files nothing', strayReshapeUnbuilt.res.status === 'error' && strayReshapeUnbuilt.res.stage === 'check' && (strayReshapeUnbuilt.res.error || '').includes('no commit names R1-1') && labels(strayReshapeUnbuilt.calls).includes('repair r1') && !labels(strayReshapeUnbuilt.calls).includes('file deferred r1'), [strayReshapeUnbuilt.res.status, strayReshapeUnbuilt.res.stage, strayReshapeUnbuilt.res.error, labels(strayReshapeUnbuilt.calls).slice(-6)])
```

The red run: the check fails (the run ends `done`, its reply `Fix it now. No code change.`). The neighbour, the `strayReshape` check above, passes on both runs.

**Change.** In `workflows/redline-loop.js`, after the build's baseline block:

1. The comment above `deferralIds` (lines 3944-3948, opening `// No commit is demanded of a deferral (#100), Redline's own or one the person chose: a`) stays, and the `deferralIds` line (3949), which opens `const deferralIds = new Set(deferred.filter(isDeferral)`, is replaced, whole, by:

   ```js
     // The findings read as deferrals, and only those (#103, R1-10): a final disposition of defer
     // alone is not one, since a reshape's re-sort of a decided call is no deferral (#94, R8-6), and
     // that call's planned task is still demanded. Read once here; the filing and the outcomes
     // below reuse it, since nothing they read changes after the approve loop.
     const roundDeferred = deferred.filter(isDeferral)
     const deferralIds = new Set(roundDeferred.map((d) => d.id))
   ```

2. `const roundDeferrals = draftsOf(deferred.filter(isDeferral))` (line 4022) becomes `const roundDeferrals = draftsOf(roundDeferred)`.
3. In the `outcomesFor` call (line 4030), the argument `deferred.filter(isDeferral)` becomes `roundDeferred`.

**Proof:** the gate green, with the new check, `strayReshape` (line 3094), `strayRaised` (line 3119) and the defer section's checks unchanged.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. It restores what `docs/running.md`, "Deferred items", Whether a mitigation shipped, already states: the repair pass runs "for a failing check or a fix with no commit, never for a deferral", and a call answered with a fix is a fix.

**Commit:** `redline: R1-10 demand a decided call's fix that a reshape re-sorted to defer (#100)`

## Task 4: R1-11, read an override's own disposition in isDeferral

`shape.md`, Decision 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 3's check, add:

```js
  // An override names its disposition, and that decides (#103, R1-11): a filled entry the resolve
  // agent returns beside an override to fix is no deferral, so the fix is demanded and nothing is
  // filed. The neighbours that must not change: `chosen` above, a defer override filed, and
  // `deferAccepted` in the defer section, an accept override that buys nothing.
  const fixOverride = { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-17', disposition: 'fix' } }
  const strayOverrideEntry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const overrideArgs = { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: fixOverride, deferrals: goAhead('R1-1') }
  const overrideUnbuilt = await go('filing: a deferral the person changes to a fix, beside a filled resolve entry, the fix left out', overrideArgs, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [[], []] })
  check('filing: an override to fix beside a filled resolve entry is still demanded: left unbuilt, the round stops at the check after its repair and files nothing', overrideUnbuilt.res.status === 'error' && overrideUnbuilt.res.stage === 'check' && (overrideUnbuilt.res.error || '').includes('no commit names R1-1') && labels(overrideUnbuilt.calls).includes('repair r1') && !labels(overrideUnbuilt.calls).includes('file deferred r1'), [overrideUnbuilt.res.status, overrideUnbuilt.res.stage, overrideUnbuilt.res.error, labels(overrideUnbuilt.calls).slice(-6)])
  const overrideBuilt = await go('filing: a deferral the person changes to a fix, beside a filled resolve entry, the fix built', overrideArgs, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [['R1-1']] })
  check('filing: an override to fix beside a filled resolve entry files nothing and is posted as applied', overrideBuilt.res.status === 'done' && !labels(overrideBuilt.calls).includes('file deferred r1') && (overrideBuilt.res.deferred || []).length === 0 && replyFor(overrideBuilt.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Fix it in full. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author', [overrideBuilt.res.status, overrideBuilt.res.error, labels(overrideBuilt.calls).slice(-8), replyFor(overrideBuilt.calls, 'push and reply r1', 'R1-1')])
```

The red run: both checks fail (the first run ends `done` with the draft filed; the second files the draft and its reply ends `Deferred to #301.`). `chosen` (line 3077) and `deferAccepted` (line 2913) pass on both runs.

**Change.** In `workflows/redline-loop.js`, in `isDeferral` (line 3804), the block

```js
    const decision = roundDecisions[d.id]
    if (decision) {
      return decision.disposition === 'defer' || (resolveDeferred.has(d.id) && (filled(d) || !plannedTask(d.id)))
    }
```

becomes

```js
    const decision = roundDecisions[d.id]
    if (decision) {
      // An override names its disposition, and that decides (#103, R1-11): an override to fix or
      // accept leaves no deferral behind (awayFromDefer), whatever entry the resolve agent returns
      // beside it. Only a call's decision, which names none, is read from the resolve agent's entry.
      if (decision.disposition) {
        return decision.disposition === 'defer'
      }
      return resolveDeferred.has(d.id) && (filled(d) || !plannedTask(d.id))
    }
```

In the comment above `isDeferral` (lines 3792-3799), the words `when the decision made it one (#97, R1-10): a defer override, or the resolve agent's own entry` become `when the decision made it one (#97, R1-10): a defer override, and no other override whatever entry stands beside it (#103, R1-11), or, for a call, the resolve agent's own entry`.

**Proof:** the gate green, with the two new checks, `chosen`, `deferAccepted`, `restated` (line 2522), `strayResolve` (line 3083), `strayWorded` (line 3089), `chosenBare` (line 3109) and `chosenUnbuilt` (line 3114) passing.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. `docs/running.md` and the skill's plan dial describe a disposition you change as built as changed; this makes an override to fix a fix whatever the resolve agent returns, as they already say.

**Commit:** `redline: R1-11 read an override's own disposition when deciding whether it is a deferral (#100)`

## Task 5: R1-1, say that an uncounted mitigation commit is read by no Redline pass

`shape.md`, Decision 4.

**Files:**

- `README.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the defer section's statement loop (lines 2831-2837), add the phrase `'read by no Redline pass'` to the list for `docs/running.md` (line 2834) and to the list for the README's Known limits (line 2835). The red run: two checks fail.

**Change.**

1. `README.md`, Known limits, the bullet `**No commit is demanded of a deferral.**` (line 111): the words `is not counted, so it is pushed with the round and named in no reply.` become `is not counted, so it is pushed with the round, named in no reply and read by no Redline pass unless something else in the round earns a final nit pass or a next round, whose review range holds it.`
2. `docs/running.md`, "Deferred items", the bullet `**Whether a mitigation shipped.**` (line 125): before its last sentence, `A mitigation the build left out is not retried: the repair pass runs for a failing check or a fix with no commit, never for a deferral.`, insert the sentence `A commit that is not counted is pushed with the round, named in no reply and read by no Redline pass unless something else in the round earns a final nit pass or a next round, whose review range holds it.` followed by one space.

**Proof:** the gate green, with the two phrase checks passing and the existing phrases of both lists (`**No commit is demanded of a deferral.**`, `**Whether a mitigation shipped.**`) still found.

**Docs entry:** `README.md` and `docs/running.md` are the docs; this task touches no file under the Docs step's directories.

**Commit:** `redline: R1-1 say that an uncounted mitigation commit is read by no Redline pass (#100)`

## Task 6: R1-3, remove the stray space before a comma in the plan dial's field list

`shape.md`, Decision 5.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the statement loop's closing brace (line 2841), add:

```js
  check('defer: the skill\'s plan dial has no space before the comma after a decline\'s reason', !read('skills', 'redline', 'SKILL.md').includes('thread) ,'))
```

The red run: the check fails.

**Change.** In `skills/redline/SKILL.md`, line 184, the text

```
(the sentence Redline will post in the finding's thread) , `decidedBy`
```

becomes

```
(the sentence Redline will post in the finding's thread), `decidedBy`
```

**Proof:** the gate green, with the new check and the statement loop's `the skill's plan dial` phrase passing; `grep -c 'thread) ,' skills/redline/SKILL.md` prints `0`.

**Docs entry:** `skills/redline/SKILL.md`: no reader-facing change; punctuation only, in the plan dial paragraph.

**Commit:** `redline: R1-3 remove a stray space before a comma in the plan dial (#100)`

## Task 7: R1-5, rename the entry helper so no local helper shadows it

`shape.md`, Decision 6. A small refactor: behaviour unchanged.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`:

1. Line 783, `const filled = (item) => Boolean(item) && typeof item.mitigation === 'string' && item.mitigation.trim() !== ''`: `const filled` becomes `const mitigationFilled`.
2. In `isDeferral`, as Task 4 left it, `return resolveDeferred.has(d.id) && (filled(d) || !plannedTask(d.id))` becomes `return resolveDeferred.has(d.id) && (mitigationFilled(d) || !plannedTask(d.id))`.

The coverage parser's local `const filled = (s) =>` (line 1717) is left as it is.

**Proof:** the gate green with no loop check added or edited: `strayResolve` (line 3083), `strayWorded` (line 3089), `chosenBare` (line 3109) and `chosenUnbuilt` (line 3114), which turn on the filled-or-empty reading, pass. `grep -c 'mitigationFilled' workflows/redline-loop.js` prints `2`, and `grep -c 'const filled' workflows/redline-loop.js` prints `1` (the coverage parser's).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a rename inside the script.

**Commit:** `redline: R1-5 rename the deferred entry's filled test so no local helper shadows it (#100)`

## Task 8: R1-7, say the words are shown only beside a mitigation that ships

`shape.md`, Decision 7 and Unattended answer 3.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the statement loop, add the phrase `'which are shown only beside a mitigation that ships'` to the list for `docs/running.md`.
2. Right after Task 6's check, add:

   ```js
     check('defer: the script\'s comment on the mitigation field says the words are shown only beside a mitigation that ships', src.includes('only beside a mitigation the record says ships'))
   ```

The red run: both checks fail.

**Change.**

1. `workflows/redline-loop.js`, the comment above `mitigationFilled` (line 777): the words `The words are shown, at a stop and in the result, beside what the record says.` become `The words are shown, at a stop and in the result, only beside a mitigation the record says ships.` Rewrap that comment's lines only, keeping them to the width of the lines around them, and keep the phrase `only beside a mitigation the record says ships` on one line, since the source check reads it whole.
2. `docs/running.md`, "Deferred items", Whether a mitigation shipped (line 125): `never from the words of the mitigation, which are only shown (#100)` becomes `never from the words of the mitigation, which are shown only beside a mitigation that ships (#100)`.

**Proof:** the gate green, with both checks and the stop's view checks (`tests/loop-test.mjs:3167-3171`) passing unchanged.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", Whether a mitigation shipped, updated in this task's commit.

**Commit:** `redline: R1-7 say a mitigation's words are shown only beside one that ships (#100)`

## Task 9: R1-8, pass the files reader at every call of draftsOf

`shape.md`, Decision 8. A small refactor: behaviour unchanged.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 8's source check, add:

```js
  check('defer: every call of draftsOf passes its files reader, with no default that names a later declaration', !src.includes('filesOf = plannedFiles'))
```

The red run: the check fails.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. `const draftsOf = (list, filesOf = plannedFiles) =>` (line 3641) becomes `const draftsOf = (list, filesOf) =>`.
2. The comment above it (lines 3639-3640) gains a last sentence: `Every call passes its reader, since plannedFiles is declared after the first stop (#103, R1-8).`
3. In `draftStop` (line 3814), `const open = openDrafts(draftsOf(deferred.filter(isDeferral)))` becomes `const open = openDrafts(draftsOf(deferred.filter(isDeferral), plannedFiles))`.
4. `const roundDeferrals = draftsOf(roundDeferred)` (as Task 3 left it) becomes `const roundDeferrals = draftsOf(roundDeferred, plannedFiles)`.

The first stop's call, `draftsOf(..., shaperFiles)` (line 3653), already passes its reader and is left as it is.

**Proof:** the gate green, with the new check and the checks that read each stop's draft files passing unchanged: the first stop (`tests/loop-test.mjs:3167-3171`), the stop after a resolve, and the end-of-run stop (`heldShown`, line 3233).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the calls pass what the default gave them.

**Commit:** `redline: R1-8 pass the files reader at every call of draftsOf (#100)`

## Task 10: R1-12, pin the decided form of the commit-of-its-own warning

`shape.md`, Decision 9.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.**

1. In `tests/loop-test.mjs`, in the filing section, right after the check on the `chosenUnbuilt` run (the check named `filing: a deferral the person chose whose mitigation is not built is a warning, never a stop, and is still filed`, line 3114), add:

   ```js
     // The commit-of-its-own warning in its decided form (#103, R1-12): a "Mitigate" answer whose
     // resolve agent planned no task with files, and whose commit is the finding's own.
     const chosenUnlisted = await go('filing: a call answered with a mitigation, no task with files, and a commit of its own', { ...baseArgs, decisions: mitigateCall, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], acceptedCalls: ['R1-1'], resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
     check('filing: a decided deferral with a commit of its own and no task with files is posted with its decision, and the warning says the resolve agent planned none', chosenUnlisted.res.status === 'done' && replyFor(chosenUnlisted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && (chosenUnlisted.res.warnings || []).includes('round 1: R1-1 has a commit of its own (1bbbbbb) and the resolve agent planned no task with files for it; posted with its decision') && !(chosenUnlisted.res.warnings || []).some((w) => w.includes('the shaper listed no files')), [chosenUnlisted.res.status, chosenUnlisted.res.error, replyFor(chosenUnlisted.calls, 'push and reply r1', 'R1-1'), chosenUnlisted.res.warnings])
   ```

2. In the statement loop, add the phrase `'the resolve agent planned no task with files for it; posted with its decision'` to the list for `docs/running.md`.

The red run: the phrase check fails. The run check pins behaviour that is already right, so it is seen red by a mutation instead: swap the two quoted texts of the ternary in the second warning (`workflows/redline-loop.js:4044`, `'the resolve agent planned no task with files for it; posted with its decision'` and `'the shaper listed no files for its task; posted as its mitigation'`), run the gate, see this check and `defer: a commit of its own with no files listed is counted` (line 2907) fail, and put the line back exactly as it was before going on. The mutation is never committed, and `git diff workflows/redline-loop.js` shows nothing from it before this task's commit.

**Change.** `docs/running.md`, "Deferred items", Whether a mitigation shipped (line 125): right after the backticked warning that ends `the shaper listed no files for its task; posted as its mitigation` and before the full stop that follows it, insert:

```
; for a deferral you or the autopilot chose, it reads `R1-4 has a commit of its own (<sha>) and the resolve agent planned no task with files for it; posted with its decision`
```

**Proof:** the gate green, with the run check and the phrase check passing.

**Docs entry:** `docs/running.md` is the doc; this task touches no file under the Docs step's directories.

**Commit:** `redline: R1-12 pin and document the decided form of the commit-of-its-own warning (#100)`

## Task 11: R1-6, remove the deferred outcome's unreachable mitigation fallbacks

`shape.md`, Decision 12: the shaper deferred it, and the person changed it to a fix by a disposition override, since this pull request is what made the fallbacks unreachable. Behaviour unchanged: the removed branches cannot run, and no existing expectation is edited.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Reader check first.** Before any edit, find every reader of the deferred outcome's `mitigation` field:

- `grep -n 'outcome\.mitigation' workflows/redline-loop.js` prints the two fallbacks only, at the `deferred` cases of `replyBody` (line 1523) and `describeOutcome` (line 2993).
- `grep -rn 'outcome\.mitigation' scripts skills agents docs README.md tests` prints nothing.
- `grep -n '\.mitigation' workflows/redline-loop.js` prints six lines (at `5a9c2f1`, lines 783, 1523, 2954, 2993, 3387 and 3407; Task 8's rewrap may move them): the entry helper as Task 7 renamed it, the two fallbacks, the field's own write in `outcomesFor`, `deferredEntry` and `draftView`. Apart from the two fallbacks and the field's own write (2954), each reads a deferred entry's words (`item.mitigation`, `deferredItem.mitigation`, `d.item.mitigation`), never the outcome's: `deferredEntry` (3387) and `draftView` (3407) read `d.item`, the run's result carries a round's outcomes as their text (`outcomes: record.outcomes`, line 2581), never the object, and `settleHeld` spreads a held outcome (3467-3468) only into `describeOutcome` and `deferredEntry`.

This is the state at `5a9c2f1`, so the field goes. If any grep prints a reader not listed here, the field stays, as the person's decision says: step 3 of the change is not made, the check below drops its second clause, and As built and a deviation under Decisions in `shape.md` name that reader by file and line. The two fallbacks go either way.

**Test first.** In `tests/loop-test.mjs`, right after Task 9's source check, add:

```js
  check('defer: a deferred outcome carries no mitigation words, so no reply or outcome line can post them without a commit of its own', !src.includes('outcome.mitigation') && !src.includes('mitigation: shipsNothing ? \'\' : deferredItem.mitigation'))
```

The red run: the check fails, since both texts are in the script.

**Change.** In `workflows/redline-loop.js`:

1. `replyBody`, the `deferred` case (line 1523), the line

   ```js
         return `${pass.title}: ${outcome.filed ? deferredTo(outcome.filed) : 'deferred'}.${commits ? ` Mitigated in ${commits}.${local}` : outcome.mitigation ? ` Mitigation: ${outcome.mitigation}.` : ''}${owner}`
   ```

   becomes

   ```js
         return `${pass.title}: ${outcome.filed ? deferredTo(outcome.filed) : 'deferred'}.${commits ? ` Mitigated in ${commits}.${local}` : ''}${owner}`
   ```

2. `describeOutcome`, the `deferred` case (line 2993), the line

   ```js
         return `${outcome.filed ? deferredTo(outcome.filed) : outcome.held ? HELD : 'deferred'}${outcome.commits.length ? `; mitigated in ${andList(outcome.commits.map((c) => short(c.sha)))}` : outcome.mitigation ? `; mitigation: ${outcome.mitigation}` : ''}${owner}`
   ```

   becomes

   ```js
         return `${outcome.filed ? deferredTo(outcome.filed) : outcome.held ? HELD : 'deferred'}${outcome.commits.length ? `; mitigated in ${andList(outcome.commits.map((c) => short(c.sha)))}` : ''}${owner}`
   ```

3. `outcomesFor`, the deferred outcome (line 2954), the line

   ```js
         outcomes[f.id] = { kind: 'deferred', commits: shipped, fullFix: deferredItem.fullFix, mitigation: shipsNothing ? '' : deferredItem.mitigation, decidedBy: owner, filed: filed[f.id] || null, held: held.has(f.id) }
   ```

   becomes

   ```js
         outcomes[f.id] = { kind: 'deferred', commits: shipped, fullFix: deferredItem.fullFix, decidedBy: owner, filed: filed[f.id] || null, held: held.has(f.id) }
   ```

`shipsNothing` stays: `const shipped = shipsNothing ? [] : named` (line 2938) still reads it. The comments above the two `deferred` cases (lines 1520-1522 and 2991-2992) and the one above `shipsNothing` (lines 2929-2935, "its words are not posted") already say what the code now does, and stay as they are.

**Proof:** the gate green, with the new check passing and, unchanged, the checks that pin a deferral's reply and outcome line with no commit of its own: `defer: with no mitigation the reply says where the item went and is not called mitigated` (line 2862), `defer: with no mitigation the handoff line says where the item went and names no mitigation` (line 2865), the no-task checks at line 2875, `pinned` (line 2885), `unbuiltMitigation` (line 2890), `mentionedBare` (line 2920) and the end-of-run checks at lines 3288 and 3289; and those with a commit of its own, `defer: R1-1 reply` (line 563) and the result check at line 3013 (`deferred to #301; mitigated in 1bbbbbb`). `grep -c 'outcome\.mitigation' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. The removed branches could not run, so no reply, handoff line or result field changes; the result's `deferred[].mitigation` is `deferredEntry`'s, read from the entry and the outcome's commits, and stays.

**Commit:** `redline: R1-6 remove the deferred outcome's unreachable mitigation fallbacks (#100)`

## Task 12: Verification Gate

1. **Gate steps 1 to 9.** Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.
2. **Docs (gate step 10).** The entries, one per touched plugin file:
   - `workflows/redline-loop.js` (Tasks 2, 3, 4, 7, 8, 9, 11): `docs/running.md`, "Deferred items", Whether a mitigation shipped, updated in Task 8's commit for the comment's rule; for Tasks 2, 3, 4, 7, 9 and 11, no reader-facing change, with each task's reason above.
   - `skills/redline/SKILL.md` (Task 6): no reader-facing change; punctuation only.
   - `README.md` and `docs/running.md` (Tasks 5, 8, 10) are the docs themselves.
   - No new config key, subcommand, allow rule or exit code.
3. **Version (gate step 11).** No bump: the pull request already moved `0.4.0` to `0.4.1` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, and this round changes nothing a setup rerun writes.
4. **Standards retrospective (gate step 12).** Apply the edits the standards approver approved from `shape.md`, "Standards retrospective (proposed)", in their own commit, `redline: record what PR #103 round 1 taught in the agent and testing standards (#100)`. The files it may change: `agent-os/standards/workflow/agents.md` (items 1 to 4) and `agent-os/standards/testing/tests.md` (item 5). If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
5. **Spec folder (gate step 13).** Write `## As built` at the end of this `plan.md`: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last, with `shape.md` if it changed: `redline: record the as-built notes for PR #103 round 1 (#100)`. Never stage anything under the spec folder's `redline/` folder.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-1/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-1/shape.md`
- `agent-os/standards/workflow/agents.md`
- `agent-os/standards/testing/tests.md`
