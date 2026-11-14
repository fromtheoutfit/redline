# PR #94 review round 4: the decision-rule, hand-off, bookkeeping and wording fixes the fourth review found

Spec folder: `agent-os/specs/2026-11-14-1509-94-review-round-4/`

Shaped by Redline in unattended mode, for review round 4 of PR #94 (issue #93), from the round's twelve findings (`redline/round-4-review.json`, `redline/round-4-findings.json`).

- `fix`, one task each, in finding order: R4-4 (Task 2), R4-5 (Task 3), R4-6 (Task 4), R4-8 (Task 5), R4-9 (Task 6), R4-11 (Task 7), R4-12 (Task 8), R4-2 (Task 9), R4-3 (Task 10).
- `decline`, no task: R4-1, R4-7, R4-10. The reasons are under Declined in `shape.md`.
- No `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `4227e11`, the PR head this round reviewed and the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-14-1509-94-review-round-4/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes a check does that first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names). It then makes the change and sees it pass. A check that pins a neighbour (named in its task) is green before and after.

**Expected counts.** Before this round: loop `869 checks passed, 0 failed`, gh `136 passed, 0 failed`, guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, background `39` (round 3's As built, `agent-os/specs/2026-11-13-1329-94-review-round-3/plan.md`, "Gate counts"; the commits since touch only spec folders). This round adds eight `check()` calls to the loop test (Tasks 2, 3, 4, 5, 6, 8, 9 and 10, one each), plus the run-record checks `go()` adds for each new run that reaches its end (Tasks 4, 6, 8 and 10). Tasks 7 and 8 change existing expectations (two and three) and Task 7 adds none. The other harnesses keep their counts, since none reads a file this round changes. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-14-1509-94-review-round-4/plan.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-4/shape.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-4/standards.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-4/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 4 spec for PR #94 (#93)`

## Task 2: R4-4, give the resolve agent a rule in which an override replaces the shaper's decision

`shape.md`, Decision 1 and Unattended answer 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `decline: the resolve agent gets the override and is told a decline can be changed` (line 2128), add:

```js
  // The resolve agent's rule says an override replaces the shaper's decision, a decline included,
  // and never that a shaper's decision is never reopened; the implementer keeps that sentence
  // (#94, R4-4).
  check('decline: the resolve rule says an override replaces the shaper\'s decision, and the implementer keeps never reopened', resolve.includes('A disposition override is the person\'s decision and replaces the shaper\'s, a decline included.') && !resolve.includes('never reopened') && (pick(second.calls, 'implement r1') || { prompt: '' }).prompt.includes('is applied as recorded and never reopened.'), resolve.slice(-900))
```

Red: the resolve prompt carries `NOT_YOURS`, which holds `never reopened`.

**Change.** In `workflows/redline-loop.js`:

- Replace the line `const NOT_YOURS = '...'` (line 343) with:

  ```js
  const PENDING_IS_THEIRS = 'A decision that is still pending is the person\'s: you do not pick an option, you do not implement a default, and you do not treat an earlier spec as having settled it.'
  const NOT_YOURS = `${PENDING_IS_THEIRS} A decision already made, the shaper's own included (a fix, a decline with its reason, a deferral), is applied as recorded and never reopened.`
  // The resolve agent applies the person's decisions, and a disposition override is one: it
  // replaces the shaper's own, a decline included (the #93 spec, decision 7), so its rule never
  // says that a shaper's decision is never reopened (#94, R4-4).
  const RESOLVE_RULE = `${PENDING_IS_THEIRS} A disposition override is the person's decision and replaces the shaper's, a decline included. Every other decision already made, the shaper's own included, is applied as recorded.`
  ```

  `NOT_YOURS` keeps its exact text, so the standards approver's and the implementer's prompts do not change.
- In the comment above `decideRule` (lines 352-353), after `(#93; #94, R1-9).`, add: `It serves the standards approver and the implementer; the resolve agent and the plan approver have rules of their own (#94, R4-4, R4-5).`
- In `resolvePrompt` (line 1748), replace

  ```js
      `${decideRule(pass)} You apply the decisions verbatim.
  ```

  with

  ```js
      `${pass.human ? NEVER_DECIDE : RESOLVE_RULE} You apply the decisions verbatim.
  ```

  The rest of that template literal is unchanged.

Neighbours, green before and after: the same check at line 2128 (`A decision that is still pending is the person's` is still in the resolve prompt), `decline: the implementer is told a declined finding has no task` (line 2070), and `human: resolve and approvers are told it is the human pass` (line 940).

**Proof:** `grep -c 'const RESOLVE_RULE' workflows/redline-loop.js` prints `1`, and `grep -c 'NEVER_DECIDE : RESOLVE_RULE' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: prompt wording only; `docs/running.md`, "Overruling a decline", already says an override is applied as the person's decision.

**Commit:** `redline: R4-4 tell the resolve agent an override replaces the shaper's decision (#93)`

## Task 3: R4-5, give the plan approver a rule that lets it check the shaper's dispositions, and the reshape a way to decide one again

`shape.md`, Decision 2 and Unattended answer 2. Run it after Task 2, which adds `PENDING_IS_THEIRS`.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `overrule: a reshape's decisions stop lists no declines and names them for after the run` (line 2291), add:

```js
  // The plan approver checks the shaper's own dispositions and sends one back, and the reshape
  // decides again a decision of its own that an adjustment names (#94, R4-5).
  const lateApprover = (pick(lateStop.calls, 'plan approver r1') || { prompt: '' }).prompt
  const lateReshape = (pick(lateStop.calls, 'reshape r1 #1') || { prompt: '' }).prompt
  check('overrule: the plan approver is told it checks the shaper\'s dispositions, and the reshape decides one an adjustment names again', lateApprover.includes('a bounce sends one back to the shaper to decide again') && !lateApprover.includes('never reopened') && lateReshape.includes('except one of your own (Decided by: redline) that an adjustment names, which you decide again') && lateReshape.includes('a decision the person made, or the autopilot applied, stays as it is'), [lateApprover.slice(-1400), lateReshape.slice(-1200)])
```

Red: the approver prompt carries `NOT_YOURS`, and the reshape prompt has neither phrase.

**Change.** In `workflows/redline-loop.js`:

- Right after `RESOLVE_RULE` (Task 2), add:

  ```js
  // The plan approver checks the shaper's own dispositions (agents/redline-plan-approver.md,
  // points 2 and 6), so its rule applies the person's decisions as recorded and sends a
  // disposition it bounces back to the shaper, whose reshape decides it again (#94, R4-5).
  const APPROVER_RULE = `${PENDING_IS_THEIRS} A decision made outside the shaper (by the person, or by the autopilot taking the shaper's recommendation) is applied as recorded. The shaper's own dispositions (a fix, a decline with its reason, a deferral) are what you check, as your instructions say, and a bounce sends one back to the shaper to decide again.`
  ```
- In `planPrompt`'s Redline branch (line 1775), replace

  ```js
  : `${NOT_YOURS} A task that turns a still-pending decision into a change is a bounce.
  ```

  with

  ```js
  : `${APPROVER_RULE} A task that turns a still-pending decision into a change is a bounce.
  ```

  The rest of that template literal is unchanged.
- In `reshapePrompt` (line 1708), replace

  ```
  Every task still names its files by path. Decisions already recorded as decided in shape.md stay as they are. ${pass.human
  ```

  with

  ```
  Every task still names its files by path. ${pass.human ? 'Decisions already recorded as decided in shape.md stay as they are.' : 'Decisions already recorded as decided in shape.md stay as they are, except one of your own (Decided by: redline) that an adjustment names, which you decide again; a decision the person made, or the autopilot applied, stays as it is.'} ${pass.human
  ```

  A human pass's reshape prompt is byte-identical to before.

Neighbours, green before and after: `decline: the plan approver sees the decline with its reason and is told it has no task` (line 2069), `overrule: the relaunch from a reshape stop` (the `samePrefix` at line 2293), and `human: resolve and approvers are told it is the human pass` (line 940).

**Proof:** `grep -c 'APPROVER_RULE' workflows/redline-loop.js` prints `2`, and `grep -c 'which you decide again; a decision the person made' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: prompt wording only; `docs/running.md`, "Rounds", step 3, already says a bounced plan is reshaped.

**Commit:** `redline: R4-5 let the plan approver check the shaper's dispositions and the reshape decide one again (#93)`

## Task 4: R4-6, number a renamed reviewer id after the highest id in use

`shape.md`, Decision 3 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: a renamed finding keeps its accounting` (line 1495), add:

```js
  // A renamed id is numbered after the highest id in use, so it never takes another finding's id
  // and a ref to that finding stays with it (#94, R4-6).
  run = await go('coverage: a renamed id takes the next free number', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-3', 'correctness'), f('X', 'correctness')], []], commitIds: [['R1-1', 'R1-3', 'R1-4']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-3' }, { index: 2, outcome: 'verified', ref: 'X' }], settledAll] })
  const freeRound = run.res.rounds[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a renamed id takes the next free number, and a ref to the id it would have taken stays with its own finding', JSON.stringify(freeRound.findings.map((x) => x.id)) === '["R1-1","R1-3","R1-4"]' && (freeRound.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:verified:R1-3,2:verified:R1-4' && run.res.warnings.includes('round 1: reviewer returned id "X"; renamed R1-4'), [freeRound.findings.map((x) => x.id), freeRound.coverage, run.res.warnings])
```

Red: the ids read `["R1-1","R1-3","R1-3"]` and the warning says `renamed R1-3`.

**Change.** In `review()` (`workflows/redline-loop.js:2304-2316`), replace from the comment `// IDs are the script's to trust` through the line that assigns `f.id` the renamed id and the `if` block's closing brace with:

```js
  // IDs are the script's to trust: renumber anything that does not carry this round's prefix.
  // Each rename is recorded, old id to new, so the coverage refs naming it follow (#80, R2-3); the
  // first finding with an old id keeps it. A renamed id is numbered after the highest id of the
  // round's form in use, as reconcilePrior and accountCoverage number theirs, so it never takes an
  // id another finding already has (#94, R4-6).
  const idForm = new RegExp(`^R${round}-\\d+$`)
  let nextId = Math.max(0, ...out.findings.filter((f) => idForm.test(f.id)).map((f) => Number(f.id.split('-')[1]) || 0))
  const renamed = new Map()
  out.findings.forEach((f) => {
    if (!idForm.test(f.id)) {
      const newId = `R${round}-${++nextId}`
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)}; renamed ${newId}`)
      const oldId = typeof f.id === 'string' ? f.id.trim() : f.id
      if (!renamed.has(oldId)) {
        renamed.set(oldId, newId)
      }
      f.id = newId
    }
```

The rest of the `forEach` body (from `f.carriedFrom = ...`) is unchanged; it does not read `index`. Neighbour, green before and after: `coverage: a renamed finding keeps its accounting` (line 1495), a lone `X-1` renamed `R1-1` as before.

**Proof:** `grep -c 'renamed R.{round}-.{index + 1}' workflows/redline-loop.js` prints `0`, and `grep -c 'const idForm = new RegExp' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: an id is renumbered only when the reviewer breaks its contract, and the warning keeps its form.

**Commit:** `redline: R4-6 number a renamed reviewer id after the highest id in use (#93)`

## Task 5: R4-8, hand back an override the resolve agent could not apply, for the person to restate

`shape.md`, Decision 4 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `overrule: a second decisions stop leaves out a decline the person already overruled` (line 2284), add:

```js
  // An override the resolve agent cannot apply is handed back with its line and its why, and is a
  // decision the stop needs, so the stop has something to ask (#94, R4-8).
  const stuckOverride = await go('overrule: an override the resolve cannot apply', { ...covArgs, askRules: rules, decisions }, { ...scenario, unresolved: [{ id: 'R1-7', why: 'the notes do not say what to fix' }] })
  check('overrule: an override the resolve agent cannot apply is handed back with its why and is a decision needed', stuckOverride.res.status === 'handoff' && stuckOverride.res.handoffKind === 'decisions' && JSON.stringify(stuckOverride.res.decisionsNeeded) === '["R1-7"]' && JSON.stringify(stuckOverride.res.overridesUnresolved) === JSON.stringify([{ id: 'R1-7', title: 'title R1-7', disposition: 'fix', notes: 'Fix it now; a third caller lands next week.', why: 'the notes do not say what to fix' }]), [stuckOverride.res.status, stuckOverride.res.decisionsNeeded, stuckOverride.res.overridesUnresolved])
```

Red: `decisionsNeeded` is `[]` and `overridesUnresolved` is absent.

**Change.** In `workflows/redline-loop.js`:

- In `resolveWith` (lines 2940-2946), replace

  ```js
      const ids = out.unresolved.map((item) => item.id)
      if (interrupt === 'autopilot') {
        throw stageError('resolve', `autopilot could not apply the shaper's recommendation for ${ids.join(', ')}`, { unresolved: out.unresolved })
      }
      return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), calls, unresolved: out.unresolved, shaped, afterApproval: suffix !== '' }
  ```

  with

  ```js
      const ids = out.unresolved.map((item) => item.id)
      // An override is the person's line, not a call, so one the resolve agent could not apply is
      // handed back on its own, with the agent's why, for the person to restate: otherwise the stop
      // has nothing to ask and every relaunch replays the same refusal (#94, R4-8).
      const stuck = newOverrides.filter((f) => ids.includes(f.id)).map((f) => f.id)
      if (interrupt === 'autopilot') {
        const recommended = ids.filter((id) => !stuck.includes(id))
        const what = [recommended.length ? `the shaper's recommendation for ${recommended.join(', ')}` : '', stuck.length ? `the person's disposition override for ${stuck.join(', ')}` : ''].filter(Boolean).join(' or ')
        throw stageError('resolve', `autopilot could not apply ${what}`, { unresolved: out.unresolved })
      }
      return { handoff: true, kind: 'decisions', pending: newCalls.filter((call) => ids.includes(call.id)), overridesUnresolved: out.unresolved.filter((item) => stuck.includes(item.id)), calls, unresolved: out.unresolved, shaped, afterApproval: suffix !== '' }
  ```

  With no override among the ids, the autopilot message is the same text as before.
- In `handoffResult`'s decisions result (lines 3681-3682), replace

  ```js
      unresolved: outcome.unresolved || [],
      decisionsNeeded: outcome.pending.map((call) => call.id),
  ```

  with

  ```js
      unresolved: outcome.unresolved || [],
      // A disposition the person changed that the resolve agent could not turn into a task, with
      // the line as recorded and the agent's why: the skill asks the person to restate it, so its
      // id is a decision the stop needs (#94, R4-8).
      overridesUnresolved: (outcome.overridesUnresolved || []).map((item) => ({ id: item.id, title: findingOf(item.id).title || '', disposition: (decisions[item.id] || {}).disposition || '', notes: (decisions[item.id] || {}).notes || '', why: (item.why || '').trim() })),
      decisionsNeeded: outcome.pending.map((call) => call.id).concat((outcome.overridesUnresolved || []).map((item) => item.id)),
  ```

In `skills/redline/SKILL.md`, right after the paragraph that starts `**The round's declines.**` (line 208), add a paragraph:

```
**An override the run could not apply.** `overridesUnresolved` lists each disposition the person changed (a decline overruled at a stop, or a disposition changed on the plan dial) that the resolve agent could not turn into a task, with the line as recorded (`disposition`, `notes`) and the agent's `why`; its ID is in `decisionsNeeded`. After the calls and the declines, show each in one line (ID, title, the line, the why) and ask the person to restate it in the answer form, `<id>: <fix|defer|accept>. <reason>`, with what the why asks for (`accept` on a decline makes no change, recorded as the person's decision). Record the restatement under its ID as `{"choice": "<fix|defer|accept>", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>", "disposition": "<fix|defer|accept>"}`, say it back in one line as any answer, and pass it in `args.decisions`. The changed line is what lets the relaunch rerun the round's resolve; relaunching the same line replays the same refusal.
```

In `docs/running.md` ("Hand-off and relaunch"), right after the bullet that starts `` - **`autopilot`** never stops. `` (line 126), add a paragraph:

```
A disposition you changed (a decline overruled at a stop, or a change on the plan dial) that the run cannot turn into a task comes back at the next stop with the resolve agent's reason, as a decision the stop needs: restate it as `<id>: <fix|defer|accept>. <reason>`, saying what the reason asks for, then type `relaunch`. A relaunch with the same line would only replay the same refusal.
```

Neighbours, green before and after: `overrule: a second decisions stop leaves out a decline the person already overruled` (line 2284; its unresolved id is a call, so `overridesUnresolved` is `[]`) and `autopilot: an unresolved decision is an error, not a hand-off` (line 348; its id is a call, so the message is unchanged).

**Proof:** `grep -c 'overridesUnresolved' workflows/redline-loop.js` prints `3`, `grep -c 'overridesUnresolved' skills/redline/SKILL.md` prints `1`, and `grep -c 'A relaunch with the same line would only replay the same refusal' docs/running.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — `docs/running.md`, "Hand-off and relaunch", the paragraph after the dial list, updated in this task's commit. The hand-off's new field is read by the skill only.
- `skills/redline/SKILL.md` — the same `docs/running.md` paragraph, updated in this task's commit.

**Commit:** `redline: R4-8 hand back an override the resolve agent could not apply, for the person to restate (#93)`

## Task 6: R4-9, list under Deferred only what ended deferred

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `decline: an overruled decline is fixed, decided by the person` (line 2129), add:

```js
  // A defer the reshape re-sorts to decline is posted as declined and never listed under Deferred;
  // the deferred entry the reshape left beside it is dropped with a warning, and the implementer is
  // not given it (#94, R4-9). The mock's reshape keeps the entry for a scenario's defer ids.
  const deferResorted = await go('decline: a reshape re-sorts a defer to decline', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-4', 'nit')], []], defer: ['R1-4'], planBounce: 1, reshapeDecline: ['R1-4'], commitIds: [['R1-1']] })
  check('decline: a defer re-sorted to decline is posted as declined, never listed under Deferred, and its stray entry is dropped with a warning', deferResorted.res.status === 'done' && (replyFor(deferResorted.calls, 'push and reply r1', 'R1-4') || '').startsWith('Redline round 1: declined: ') && !comment(deferResorted.calls, 'handoff comment').includes('### Deferred') && deferResorted.res.deferred.length === 0 && !(pick(deferResorted.calls, 'implement r1') || { prompt: '' }).prompt.includes('"mitigation": "a guard clause"') && deferResorted.res.warnings.some((w) => w.includes('R1-4') && w.includes('as deferred, but its disposition is not defer')), [deferResorted.res.status, deferResorted.res.deferred, deferResorted.res.warnings])
```

Red: the handoff lists R1-4 under Deferred as shipped, and no warning names it.

**Change.** In `workflows/redline-loop.js`:

- At the end of `checkDispositions`, after the `if (pass.human) { ... }` block (line 2619) and before the function's closing brace, add:

  ```js
    // A deferred entry stands beside a finding the shaper deferred, and nothing else: one beside a
    // decline or a fix would be listed under Deferred as shipped with no mitigation planned, so it
    // is dropped with a warning (#94, R4-9).
    const deferredIds = new Set(shaped.findings.filter((f) => f.disposition === 'defer').map((f) => f.id))
    const stray = (shaped.deferred || []).filter((d) => !deferredIds.has(d.id))
    if (stray.length) {
      warnings.push(`${pass.name}: the shaper listed ${stray.map((d) => d.id).join(', ')} as deferred, but its disposition is not defer; the entry is dropped`)
      shaped.deferred = shaped.deferred.filter((d) => deferredIds.has(d.id))
    }
  ```
- In the reshape branch (line 3004), replace

  ```js
      deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id)))
  ```

  with

  ```js
      // An earlier entry stays only while its finding is still deferred or a decision stands on it:
      // a defer the reshape re-sorted is no deferral any more (#94, R4-9).
      const stillDeferred = (id) => Boolean(roundDecisions[id]) || shaped.findings.some((s) => s.id === id && s.disposition === 'defer')
      deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id) && stillDeferred(item.id)))
  ```
- Move the two `deferredAll` loops (lines 3109-3122: `for (const item of deferred) { ... }`, the comment `// On autopilot a finding a repository ask rule covers is deferred with no mitigation (#49): ...` and its `for (const [id, forced] of Object.entries(record.forced)) { ... }`) to right after the line `const outcomes = outcomesFor(pass, inScope, { ...shaped, findings: finalDispositions }, deferred, roundDecisions, roundCommits, record.forced)` (line 3124), in the same order. `outcomesFor` does not read `deferredAll`. Then replace the first loop's head

  ```js
    for (const item of deferred) {
  ```

  with

  ```js
    // Only an item that ended deferred, or decided with a mitigation the resolve agent planned, is
    // listed under Deferred, so a decline or a fix beside a leftover entry is never called shipped
    // (#94, R4-9).
    for (const item of deferred.filter((d) => outcomes[d.id] && ['deferred', 'decided'].includes(outcomes[d.id].kind))) {
  ```

Neighbours, green before and after: `defer: deferred list` (line 466), a plain deferral still listed, and `rules: the deferred list carries the rule and no mitigation` (line 1115), whose autopilot entries keep their order.

**Proof:** `grep -c 'as deferred, but its disposition is not defer' workflows/redline-loop.js` prints `1`, `grep -c 'const stillDeferred' workflows/redline-loop.js` prints `1`, and `grep -c "includes(outcomes.d.id..kind)" workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md`, "The handoff comment", already says the Deferred list shows what shipped and what is left open; the fix makes the list keep that.

**Commit:** `redline: R4-9 list under Deferred only what ended deferred (#93)`

## Task 7: R4-11, say whose login goes in the handoff's overrule command

`shape.md`, Decision 6.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, change the two expectations that quote the line:

- line 2324:

  ```
      'To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 114 review @author`.',
  ```

  becomes

  ```
      'To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 114 review @<login>` with the login of whoever replied, such as `review @author`.',
  ```
- line 2369: inside the check `layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login`, replace

  ```
  then run `/redline:redline-revise 114 review @<your login>`.')
  ```

  with

  ```
  then run `/redline:redline-revise 114 review @<login>` with the login of whoever replied.')
  ```

Red: the guided layout check and the no-login check fail.

**Change.** In `handoffComment` (`workflows/redline-loop.js:3275`), in the Declined by Redline line, replace

```
then run \`/redline:redline-revise ${pr} review ${login ? `@${login}` : '@<your login>'}\`.`
```

with

```
then run \`/redline:redline-revise ${pr} review @<login>\` with the login of whoever replied${login ? `, such as \`review @${login}\`` : ''}.`
```

Every `@` stays in a code span, so no account is notified.

In `docs/running.md:114` ("Overruling a decline", "After the run, or for an earlier round"), replace `A teammate overrules the same way from their own review. Use` followed by `` `review @<login>`: `` with:

```
A teammate overrules the same way from their own review, with their own login: the handoff comment's line says the login is whoever replied. Use `review @<login>`:
```

**Proof:** `grep -c 'with the login of whoever replied' workflows/redline-loop.js` prints `1`, and `grep -c 'with their own login: the handoff comment' docs/running.md` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "Dispositions", "Overruling a decline", updated in this task's commit.

**Commit:** `redline: R4-11 say whose login goes in the handoff's overrule command (#93)`

## Task 8: R4-12, run a human review pass's final nit pass only when a fix was committed

`shape.md`, Decision 7 and Unattended answer 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`:

- Change the three expectations that end `No commits, so no final nit pass.'` to end `No fix was committed, so no final nit pass.'`: the checks `human: the summary says so` (line 961), `rules: the human summary says so` (line 1152) and `rules: the human summary says the comment asked for nothing` (line 1156).
- Right after the check `human: the summary says so` (line 961), add:

  ```js
  // A pass whose only commit is its spec folder fixed nothing: it runs no final nit pass and posts
  // no Redline round over an empty diff (#94, R4-12).
  run = await go('human: only the spec folder committed', humanArgs([h('H1-1', { description: 'Nice.' })]), { reviews: [], none: ['H1-1'], commitIds: [['redline: save human review 1 spec for PR #114 (#114)']] })
  check('human: a pass that committed only its spec folder runs no final nit pass, and the summary says no fix was committed', run.res.status === 'done' && !labels(run.calls).some((l) => l.startsWith('final nit pass') || l.startsWith('post r')) && run.res.humanReview.nitPassRound === 0 && comment(run.calls, 'summary comment').includes('No fix was committed, so no final nit pass.'), [labels(run.calls), comment(run.calls, 'summary comment')])
  ```

Red: the four sentence checks fail, and the new run posts a final nit pass.

**Change.** In `workflows/redline-loop.js`:

- In the human-review path (line 3726), replace `    if (outcome.newHead) {` with:

  ```js
    // The final nit pass reads the fixes, so it runs when the pass committed one, as the main loop
    // gates on fixedAny; the spec folder's own commit is no fix diff (#94, R4-12).
    if (outcome.fixed.length > 0) {
  ```

  The range below it keeps `to: outcome.newHead`.
- In `humanSummary` (line 3371), replace `'No commits, so no final nit pass.'` with `'No fix was committed, so no final nit pass.'`.

In `docs/running.md:226` ("A human review pass"), replace the words `After the fixes are pushed and every thread answered, the reviewer reads the fix diff once as the next` followed by `` `Redline round`, `` with:

```
After the fixes are pushed and every thread answered, the reviewer reads the fix diff once as the next `Redline round` when the pass committed a fix (a pass that committed only its spec folder has no fix diff, runs no such round, and its summary says so),
```

Neighbours, green before and after: `human: finishes` (line 926, the nit pass still runs as round 3 after fixes) and `human: no commits, no nit pass, still the summary` (line 960).

**Proof:** `grep -c 'if (outcome.newHead)' workflows/redline-loop.js` prints `0`, `grep -c 'No fix was committed, so no final nit pass.' workflows/redline-loop.js` prints `1`, and `grep -c 'No commits, so no final nit pass' tests/loop-test.mjs` prints `0`.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "A human review pass", updated in this task's commit.

**Commit:** `redline: R4-12 run a human review pass's final nit pass only when a fix was committed (#93)`

## Task 9: R4-2, name decline in the ask-rules block and in the approver's rule bounces

`shape.md`, Decision 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `agents/redline-plan-approver.md`

**Test first.** In `tests/loop-test.mjs`, right after the check `rules: the plan approver sees the rules and the asks` (line 1094), add:

```js
  // The ask-rules block names decline beside fix and defer, and the approver bounces a decline of a
  // finding a prose rule covers, in its prompt and in its agent file (#94, R4-2).
  const approverAgent = fs.readFileSync(path.join(here, '..', 'agents', 'redline-plan-approver.md'), 'utf8')
  check('rules: the ask-rules block says never fixed, declined or deferred, and a decline a prose rule covers is a bounce', pick(second.calls, 'shape r1').prompt.includes('never fixed, declined or deferred by Redline') && pick(second.calls, 'plan approver r1').prompt.includes('and a decline of a finding a prose rule covers') && approverAgent.includes('or a `decline` of such a finding (it has no task: read the dispositions)'), pick(second.calls, 'plan approver r1').prompt.slice(0, 2500))
```

Red: none of the three phrases exists.

**Change.**

- `workflows/redline-loop.js`, `rulesBlock` (line 446). Replace `never fixed or deferred by Redline:` with `never fixed, declined or deferred by Redline:`, and replace `The plan approver bounces a task that writes under a paths rule or fixes a finding a prose rule covers.` with `The plan approver bounces a task that writes under a paths rule or fixes a finding a prose rule covers, and a decline of a finding a prose rule covers.` A repository with no rules keeps byte-identical prompts, since the block is still empty.
- `agents/redline-plan-approver.md:20`, point 5. Replace

  ```
  or a `fix` or `defer` task for a finding whose change does what a `prose` rule's sentence says, is bounced naming the rule,
  ```

  with

  ```
  or a `fix` or `defer` task for a finding whose change does what a `prose` rule's sentence says, or a `decline` of such a finding (it has no task: read the dispositions), is bounced naming the rule,
  ```

`forceAskRules` is not changed (`shape.md`, Decision 8). Neighbours, green before and after: `rules: the reviewer, the shaper and the plan approver get the rule list` (line 1087) and the `samePrefix('rules', ...)` at line 1091.

**Proof:** `grep -c 'never fixed, declined or deferred by Redline' workflows/redline-loop.js` prints `1`, and `grep -c 'it has no task: read the dispositions' agents/redline-plan-approver.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — no reader-facing change: `skills/redline/SKILL.md:98` and the shaper's rule 7 already say a rule-covered finding is never fixed, declined or deferred by Redline; the prompt now agrees.
- `agents/redline-plan-approver.md` — no reader-facing change: `docs/running.md`, "Rounds", step 3, says the approver checks the plan against the ask rules, which now covers a decline.

**Commit:** `redline: R4-2 name decline in the ask-rules block and in the approver's rule bounces (#93)`

## Task 10: R4-3, capitalise the person's label where it starts a decision's sentence

`shape.md`, Decision 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login` (line 2369), add:

```js
  // With no login, a decision with no notes starts its sentence with a capital (#94, R4-3).
  const noNotes = await go('layout: no login, a decision with no notes', { ...covArgs, askRules: rules, login: '', decisions: { ...decisions, 'R1-2': { choice: 'Keep it', date: '2026-11-13' } } }, scenario)
  const noNotesReply = replyFor(noNotes.calls, 'push and reply r1', 'R1-2') || ''
  check('layout: with no login a decision with no notes starts its sentence with a capital', noNotesReply.startsWith('Redline round 1: The person running Redline chose: Keep it.') && noNotesReply.endsWith('· decided by: the person running Redline'), noNotesReply)
```

Red: the reply reads `Redline round 1: the person running Redline chose: Keep it. ...`.

**Change.** In `workflows/redline-loop.js`:

- Right after the `personLabel` line (line 190), add:

  ```js
  // The label where it starts a sentence: a login as it is, the no-login words with a capital
  // (#94, R1-17, R4-3).
  const personLabelStart = personLabel.charAt(0).toUpperCase() + personLabel.slice(1)
  ```
- In `decisionSentence` (line 1135), replace `${human ? 'The author' : personLabel} chose:` with `${human ? 'The author' : personLabelStart} chose:`.
- In `capComment` (line 3388), replace `${personLabel.charAt(0).toUpperCase()}${personLabel.slice(1)} will pick these up.` with `${personLabelStart} will pick these up.`

Neighbours, green before and after: `layout: a human-review pass with no login still says the author, as it always did` (line 2374) and every cap-comment check (the text is unchanged).

**Proof:** `grep -c 'personLabelStart' workflows/redline-loop.js` prints `3`, and `grep -c 'personLabel.charAt(0).toUpperCase()}' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: it reaches only a hand-built relaunch with no login and a decision with no notes; `docs/running.md`, "Decided by", already names the no-login words.

**Commit:** `redline: R4-3 capitalise the person's label where it starts a decision's sentence (#93)`

## Task 11: Verification Gate

**Files:**

- `agent-os/specs/2026-11-14-1509-94-review-round-4/plan.md` and `agent-os/specs/2026-11-14-1509-94-review-round-4/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/agents.md` (items 1, 2, 3, 4, 6 and 7).
  - `agent-os/standards/workflow/replay.md` (item 5).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-14-1509-94-review-round-4/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected:
   - loop at its count before the round plus what Tasks 2 to 10 add (see Expected counts above);
   - guard `594 passed, 0 mismatched`;
   - gh, prefs, gate, setup and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as each task's Docs entry says. Every touched file under `agents/`, `skills/` and `workflows/` has its entry, and each names this round's commit for it or "no reader-facing change" with its reason. No new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.3.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.4`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 13). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves none, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves any, the edits go in one commit of their own after the finding commits: `redline: record the round 4 review lessons in the standards (#93)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - each task's red run (the failing check names) and its green run;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #94 round 4 as built (#93)`

---

## As built

Every gate run below is `.claude/redline/checks.sh` with this folder's `redline/snapshot.json`. Each task's red run is the gate run after its test was added; its green run is the next one, which was also the following task's red run where one followed.

| Task | Finding | Commit | Red (the failing loop check) | Green |
| --- | --- | --- | --- | --- |
| 1 | spec | `6b37b61` | | |
| 2 | R4-4 | `5b2e654` | `decline: the resolve rule says an override replaces the shaper's decision, and the implementer keeps never reopened` (869 passed, 1 failed) | 870 passed |
| 3 | R4-5 | `f5ba33c` | `overrule: the plan approver is told it checks the shaper's dispositions, and the reshape decides one an adjustment names again` (870 passed, 1 failed) | 872 passed |
| 4 | R4-6 | `7297810` | `coverage: a renamed id takes the next free number, and a ref to the id it would have taken stays with its own finding`; ids read `["R1-1","R1-3","R1-3"]` (872 passed, 1 failed) | 873 passed |
| 5 | R4-8 | `af0a244` | `overrule: an override the resolve agent cannot apply is handed back with its why and is a decision needed`; `decisionsNeeded` `[]`, `overridesUnresolved` absent (873 passed, 1 failed) | 874 passed, gate green |
| 6 | R4-9 | `6386727` | `decline: a defer re-sorted to decline is posted as declined, never listed under Deferred, and its stray entry is dropped with a warning`; `deferred` held R1-4's guard clause (875 passed, 1 failed) | 876 passed, gate green |
| 7 | R4-11 | `13dca22` | `layout: the handoff, every heading in order with its line, is the layout the spec shows` and `layout: with no login the person running Redline stands in everywhere, and the overrule line asks for a login` (874 passed, 2 failed) | 876 passed, gate green |
| 8 | R4-12 | `79efa91` | `human: the summary says so`, `rules: the human summary says so`, `rules: the human summary says the comment asked for nothing`, and the new `human: a pass that committed only its spec folder runs no final nit pass, and the summary says no fix was committed` (it ran `gather r3` and `final nit pass r3`) | 878 passed, gate green |
| 9 | R4-2 | `4fd4b36` | `rules: the ask-rules block says never fixed, declined or deferred, and a decline a prose rule covers is a bounce` (878 passed, 1 failed) | 879 passed, gate green |
| 10 | R4-3 | `edf9ecf` | `layout: with no login a decision with no notes starts its sentence with a capital`; the reply read `Redline round 1: the person running Redline chose: Keep it. ...` (880 passed, 1 failed) | 881 passed, gate green |
| 11 | retrospective | `2c36d78` | | |

Every task's Proof greps printed the counts the task names.

**Gate counts** (the green run after Task 10): loop `881 checks passed, 0 failed` (869 before, plus eight new checks and four run-record checks for the new runs of Tasks 4, 6, 8 and 10), guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, gh `136`, background `39`; syntax and validate exit 0. The guard and the other harnesses kept their counts.

**Standards retrospective:** the standards approver approved items 1 to 7 of `shape.md`'s proposal, applied as drafted in `2c36d78`: `agent-os/standards/workflow/agents.md` (items 1, 2, 3, 4, 6, 7) and `agent-os/standards/workflow/replay.md` (item 5). `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` printed `0`. The commit names no finding: every edit is a lesson, and no finding's fix was sent through the retrospective.

**Deviations:**

- Task 8: the new run `human: only the spec folder committed` sits after the neighbour check `human: the push prompt does not push`, not right after `human: the summary says so` as the plan placed it. That neighbour reads `run` from `human: nothing to commit`; placed as planned, the new run replaced `run` before it and the neighbour failed (the new run has a commit, so its push prompt pushes). `shape.md`, Decision 15.
- Task 4: the rename comment keeps its first two lines and appends the plan's new sentence, which is the plan's comment text.
- Task 9 changes `rulesBlock` only, as planned; the code comment at `workflows/redline-loop.js:114` ("never fixed or deferred by Redline") still names fix and defer only. It is a comment, not a prompt, and the plan's Proof counts one site, so it was left for a later change.
