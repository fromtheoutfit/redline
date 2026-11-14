# PR #94 review round 5: the id, coverage, deferral and check-order fixes the fifth review found

Spec folder: `agent-os/specs/2026-11-14-1509-94-review-round-5/`

Shaped by Redline in unattended mode, for review round 5 of PR #94 (issue #93), from the round's ten findings (`redline/round-5-review.json`, `redline/round-5-findings.json`).

- `fix`, one task each, in finding order: R5-3 (Task 2), R5-5 (Task 3), R5-9 (Task 4), R5-1 (Task 5), R5-2 (Task 6), R5-4 (Task 7), R5-6 (Task 8), R5-7 (Task 9), R5-8 (Task 10), R5-10 (Task 11). R5-1 and R5-10 are small refactors.
- No `decline`, no `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `583ac3b`, the PR head this round reviewed and the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Task order matters in two places: Task 8 (R5-6) and Task 10 (R5-8) both change `forceAskRules`, and Task 10 uses the `wouldDecline` constant Task 8 adds; Task 8 and Task 9 (R5-7) both change `checkDispositions`, and Task 9's anchors are as Task 8 leaves them.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-14-1509-94-review-round-5/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes a check does that first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names). It then makes the change and sees it pass. A check that pins a neighbour (named in its task) is green before and after. Tasks 5 and 11 are refactors with no new check: their neighbours are green before and after.

**Expected counts.** Before this round: loop `881 checks passed, 0 failed`, gh `136 passed, 0 failed`, guard `594 passed, 0 mismatched`, prefs `121`, gate `117`, setup `470`, background `39` (round 4's As built, `agent-os/specs/2026-11-14-1509-94-review-round-4/plan.md`, "Gate counts"; the commits since touch only spec folders and standards). This round adds nine `check()` calls to the loop test (Tasks 2, 3, 6, 7, 8, 9 and 10 one each, Task 4 two), plus the run-record checks `go()` adds for each new run that reaches its end. No existing expectation changes. The other harnesses keep their counts, since none reads a file this round changes. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-14-1509-94-review-round-5/plan.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-5/shape.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-5/standards.md`
- `agent-os/specs/2026-11-14-1509-94-review-round-5/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 5 spec for PR #94 (#93)`

## Task 2: R5-3, rename a coverage ref's leading id when a note follows it

`shape.md`, Decision 1.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: a ref with a note after the id counts as that finding and mints nothing` (line 1512), add:

```js
  // A ref with a note after an id the rename changed follows the rename: its leading token is
  // renamed with the note kept and read past by its leading id, so the candidate is counted as that
  // finding and mints nothing, whether a space or a colon ends the id (#94, R5-3).
  run = await go('coverage: a ref with a note after a renamed id', covArgs, { reviews: [[f('X1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'X1 (the lock)' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const noteRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  const noteWarnings = run.res.warnings || []
  run = await go('coverage: a ref with a note after a wrong-round id', covArgs, { reviews: [[f('R0-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R0-1: the lock' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const colonRenamed = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  const firstEntry = (r) => (r.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] || ''
  check('coverage: a ref with a note after a renamed id counts as the renamed finding and mints nothing', JSON.stringify(noteRenamed.findings.map((x) => x.id)) === '["R1-1"]' && firstEntry(noteRenamed) === '1:verified:R1-1' && noteWarnings.includes('round 1: reviewer returned id "X1"; renamed R1-1') && noteWarnings.some((w) => w.includes('with ref "R1-1 (the lock)"') && w.includes('read as R1-1')) && JSON.stringify(colonRenamed.findings.map((x) => x.id)) === '["R1-1"]' && firstEntry(colonRenamed) === '1:verified:R1-1', [noteRenamed.findings.map((x) => x.id), noteRenamed.coverage, colonRenamed.findings.map((x) => x.id), colonRenamed.coverage, noteWarnings])
```

Red: each run mints a second finding, `R1-2`, for candidate 1.

**Change.** In `review()` (`workflows/redline-loop.js:2374-2385`), replace

```js
    // A finding or duplicate entry naming an id the rename above changed names that finding by its
    // new id, a finding of this round, so the R1-4 rule for a ref naming no finding does not apply
    // to it (#80, R2-3).
    for (const entry of out.coverage) {
      if (!LISTED_ELSEWHERE.includes(entry.outcome) && entry.outcome !== 'duplicate') {
        continue
      }
      const ref = typeof entry.ref === 'string' ? entry.ref.trim() : entry.ref
      if (renamed.has(ref)) {
        entry.ref = renamed.get(ref)
      }
    }
```

with

```js
    // A finding or duplicate entry naming an id the rename above changed names that finding by its
    // new id, a finding of this round, so the R1-4 rule for a ref naming no finding does not apply
    // to it (#80, R2-3). A verified or unconfirmed ref with a note after a renamed id follows the
    // rename too: its leading token is renamed and the note kept, so accountCoverage reads it by its
    // leading id with a warning, as it reads any ref with a note (#94, R2-5, R5-3). A duplicate's
    // ref may open with another candidate's index, so only its whole ref is renamed.
    for (const entry of out.coverage) {
      if (!LISTED_ELSEWHERE.includes(entry.outcome) && entry.outcome !== 'duplicate') {
        continue
      }
      const ref = typeof entry.ref === 'string' ? entry.ref.trim() : entry.ref
      if (renamed.has(ref)) {
        entry.ref = renamed.get(ref)
        continue
      }
      const token = LISTED_ELSEWHERE.includes(entry.outcome) && typeof ref === 'string' ? (/^[^\s:,;()]+/.exec(ref) || [''])[0] : ''
      if (token && renamed.has(token)) {
        entry.ref = `${renamed.get(token)}${ref.slice(token.length)}`
      }
    }
```

`accountCoverage` is not changed: its leading-id read (line 1567) takes `R1-1 (the lock)` and `R1-1: the lock` as R1-1.

Neighbours, green before and after: `coverage: a renamed finding keeps its accounting` (line 1503, a whole-ref rename), `coverage: a ref with a note after the id counts as that finding and mints nothing` (line 1512, a note after a valid id), and `coverage: the warnings name the index, the new id and the bad ref` (line 1491, `R9-9` still names no finding).

**Proof:** `grep -c 'renamed.has(token)' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: a ref is renamed only when the reviewer writes it against the accounting sentence; `docs/running.md`, "The coverage pass", is unchanged.

**Commit:** `redline: R5-3 rename a coverage ref's leading id when a note follows it (#93)`

## Task 3: R5-5, rename an id of the round's form the reviewer repeats

`shape.md`, Decision 2 and Unattended answer 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: a renamed id takes the next free number, and a ref to the id it would have taken stays with its own finding` (line 1508), add:

```js
  // An id of the round's form the reviewer returns twice is renamed the second time, to the next
  // free number with a warning, so the two findings keep their own threads and outcomes, and a ref
  // to the id stays with the first (#94, R5-5).
  run = await go('coverage: a repeated id', covArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-1', 'nit', { file: 'app/y.php', line: 9 })], []], commitIds: [['R1-1', 'R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const twiceRound = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: an id returned twice is renamed the second time with a warning, and a ref to it stays with the first', JSON.stringify(twiceRound.findings.map((x) => `${x.id}:${x.file}`)) === '["R1-1:app/x.php","R1-2:app/y.php"]' && ((twiceRound.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`)[0] || '') === '1:verified:R1-1' && (run.res.warnings || []).includes('round 1: reviewer returned id "R1-1" again; renamed R1-2') && Boolean(replyFor(run.calls, 'push and reply r1', 'R1-2')), [twiceRound.findings.map((x) => x.id), twiceRound.coverage, run.res.warnings])
```

Red: both findings keep `R1-1`, and no warning names the repeat.

**Change.** In `review()` (`workflows/redline-loop.js:2325-2335`), replace

```js
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

with

```js
  const renamed = new Map()
  // An id of the round's form another finding already has is renamed the same way, with a warning,
  // so no two findings share an id; a ref naming it stays with the first finding, which keeps it,
  // so the rename map does not record it (#94, R5-5).
  const taken = new Set()
  out.findings.forEach((f) => {
    if (!idForm.test(f.id)) {
      const newId = `R${round}-${++nextId}`
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)}; renamed ${newId}`)
      const oldId = typeof f.id === 'string' ? f.id.trim() : f.id
      if (!renamed.has(oldId)) {
        renamed.set(oldId, newId)
      }
      f.id = newId
    } else if (taken.has(f.id)) {
      const newId = `R${round}-${++nextId}`
      warnings.push(`round ${round}: reviewer returned id ${JSON.stringify(f.id)} again; renamed ${newId}`)
      f.id = newId
    }
    taken.add(f.id)
```

The rest of the `forEach` body (from `f.carriedFrom = ...`) is unchanged. `nextId` starts after the highest id of the round's form, so a renamed id is never taken.

Neighbours, green before and after: `coverage: a renamed finding keeps its accounting` (line 1503) and `coverage: a renamed id takes the next free number, and a ref to the id it would have taken stays with its own finding` (line 1508).

**Proof:** `grep -c 'const taken = new Set()' workflows/redline-loop.js` prints `1`, and `grep -c 'again; renamed' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: an id is renumbered only when the reviewer breaks its contract, and the warning keeps the rename's form.

**Commit:** `redline: R5-5 rename an id of the round's form the reviewer repeats (#93)`

## Task 4: R5-9, drop a deferral the person changed away from defer, and let the resolve agent's entry replace the shaper's

`shape.md`, Decision 3 and Unattended answer 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

- In the resolve mock (line 204), replace `deferred: [], unresolved:` with `deferred: scenario.resolveDeferred ? scenario.resolveDeferred.slice() : [], unresolved:`, and add to the comment above it (after the line that starts `// scenario.acceptedCalls (#93)`): `// scenario.resolveDeferred (#94, R5-9): the deferred list the resolve agent returns.` Every other scenario's resolve result is unchanged.
- Right after the check `decline: a defer re-sorted to decline is posted as declined, never listed under Deferred, and its stray entry is dropped with a warning` (line 2151), add:

```js
  // A shaper deferral the person changes on the plan dial is no deferral any more: changed to fix,
  // it leaves no entry under Deferred and none reaches the implementer, with or without a reshape;
  // restated as defer with the person's own mitigation, the resolve agent's entry replaces the
  // shaper's (#94, R5-9).
  const deferToFix = { ...planArgs, approvedPlans: [1], decisions: { 'R1-4': { choice: 'fix', notes: 'Fix it properly now.', date: '2026-11-14', disposition: 'fix' } } }
  const deferScenario = { reviews: [[f('R1-1', 'correctness'), f('R1-4', 'nit')], []], defer: ['R1-4'], commitIds: [['R1-1', 'R1-4']] }
  const changedPlain = await go('defer: changed to fix on the plan dial', deferToFix, deferScenario)
  const changedBounced = await go('defer: changed to fix on the plan dial, then a reshape', deferToFix, { ...deferScenario, planBounce: 1 })
  const noDeferral = (x) => x.res.status === 'done' && (x.res.deferred || []).length === 0 && !(comment(x.calls, 'handoff comment') || '').includes('### Deferred') && !(pick(x.calls, 'implement r1') || { prompt: '' }).prompt.includes('"mitigation": "a guard clause"')
  check('defer: a deferral the person changes to fix on the plan dial is never listed under Deferred nor given to the implementer, with or without a reshape', noDeferral(changedPlain) && noDeferral(changedBounced), [changedPlain.res.status, changedPlain.res.deferred, changedBounced.res.status, changedBounced.res.deferred])
  const restated = await go('defer: restated with the person\'s mitigation on the plan dial', { ...planArgs, approvedPlans: [1], decisions: { 'R1-4': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-14', disposition: 'defer' } } }, { ...deferScenario, resolveDeferred: [{ id: 'R1-4', mitigation: 'a log line', fullFix: 'a lock' }] })
  check('defer: a deferral restated on the plan dial lists the resolve agent\'s mitigation, not the shaper\'s', restated.res.status === 'done' && (restated.res.deferred || []).length === 1 && restated.res.deferred[0].mitigation === 'a log line' && (comment(restated.calls, 'handoff comment') || '').includes('- **R1-4** title R1-4: shipped a log line; open: a lock'), [restated.res.status, restated.res.deferred])
```

Red: both changed runs list R1-4 under Deferred as `shipped a guard clause`, and the restated run keeps the shaper's `a guard clause`.

**Change.** In `revise()` (`workflows/redline-loop.js`):

- Right after `let roundDecisions = {}` (line 2946), add:

  ```js
  // A disposition the person changed away from defer (to fix or accept) leaves no deferral behind:
  // the shaper's entry would be listed under Deferred as shipped and handed to the plan approver
  // and the implementer (#94, R5-9).
  const awayFromDefer = (id) => Boolean(roundDecisions[id] && roundDecisions[id].disposition && roundDecisions[id].disposition !== 'defer')
  ```
- In `resolveWith`, right after the `for (const id of newCalls.map(...)...) { ... }` loop that ends with `roundDecisions[id] = decision` and its closing brace (line 2964), and before `const out = await run('resolve', ...`, add:

  ```js
      deferred = deferred.filter((d) => !awayFromDefer(d.id))
  ```
- Replace line 2981

  ```js
      deferred = deferred.concat(out.deferred.filter((item) => !deferred.some((d) => d.id === item.id) && !record.forced[item.id]))
  ```

  with

  ```js
      // The resolve agent's entry for a decision it planned replaces an earlier one for the same id,
      // in place, so a deferral the person restated with their own mitigation is the one planned and
      // posted (#94, R5-9). A finding a repository ask rule covers keeps none (#49).
      const fresh = out.deferred.filter((item) => !record.forced[item.id])
      deferred = deferred.map((d) => fresh.find((item) => item.id === d.id) || d).concat(fresh.filter((item) => !deferred.some((d) => d.id === item.id)))
  ```
- In the reshape branch, replace line 3041

  ```js
      deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id) && stillDeferred(item.id)))
  ```

  with

  ```js
      deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id) && stillDeferred(item.id))).filter((d) => !awayFromDefer(d.id))
  ```

  and add to the comment above `stillDeferred` (after `(#94, R4-9).`): `An entry for a finding the person changed away from defer is dropped, whichever list holds it (#94, R5-9).`

Neighbours, green before and after: `defer: deferred list` (line 466), `decline: a defer re-sorted to decline is posted as declined, never listed under Deferred, and its stray entry is dropped with a warning` (line 2151), and `rules: the deferred list carries the rule and no mitigation` (the autopilot rule entries, around line 1115).

**Proof:** `grep -c 'awayFromDefer' workflows/redline-loop.js` prints `3`, and `grep -c 'deferred.map((d) => fresh.find' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md`, "The handoff comment", already says the Deferred list shows what shipped and what is left open, and "Hand-off and relaunch" says the plan dial changes a disposition; the fix makes the list keep that.

**Commit:** `redline: R5-9 drop a deferral the person changed away from defer, and keep the resolve agent's entry (#93)`

## Task 5: R5-1, build the changed-agent-files list once (small refactor)

`shape.md`, Decision 4 and Unattended answer 6.

**Files:**

- `workflows/redline-loop.js`

**Change.** Replace lines 251-258

```js
const AGENTS_CHANGED = drift.agents.length
  ? `Agent files changed since this run launched (${drift.agents.map((p) => `\`${p}\``).join(', ')}): this run's remaining rounds may run under them, while the workflow's own prompts are the launch's.`
  : ''
// The same fact as the handoff comment states it (#93): the comment is posted after the last round,
// so it says what happened, where the warning above, shown while rounds are ahead, says what may.
const AGENTS_CHANGED_HANDOFF = drift.agents.length
  ? `Agent files changed during this run (${drift.agents.map((p) => `\`${p}\``).join(', ')}): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.`
  : ''
```

with

```js
// The changed agent files as both sentences below name them, built once so the two never name
// different files (#94, R5-1).
const agentList = drift.agents.map((p) => `\`${p}\``).join(', ')
const AGENTS_CHANGED = drift.agents.length
  ? `Agent files changed since this run launched (${agentList}): this run's remaining rounds may run under them, while the workflow's own prompts are the launch's.`
  : ''
// The same fact as the handoff comment states it (#93): the comment is posted after the last round,
// so it says what happened, where the warning above, shown while rounds are ahead, says what may.
const AGENTS_CHANGED_HANDOFF = drift.agents.length
  ? `Agent files changed during this run (${agentList}): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.`
  : ''
```

No check is added: behaviour is unchanged. Neighbours, green before and after: the drift checks that pin both sentences byte for byte (`tests/loop-test.mjs:1995-1996` and the checks that read `sentence` and `past`).

**Proof:** `grep -c 'drift.agents.map' workflows/redline-loop.js` prints `1`, and `grep -c 'agentList}' workflows/redline-loop.js` prints `2`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: a refactor; both sentences are byte-identical.

**Commit:** `redline: R5-1 build the changed-agent-files list once (#93)`

## Task 6: R5-2, keep a bad first coverage entry as the one that stands

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `coverage: each one goes to the shaper with a line on what would confirm it, is decided, and the next round collapses it as settled` (line 1492), and before the comment that opens `// An unconfirmed finding that says nothing on what would confirm it`, add:

```js
  // A bad first entry for a candidate is the entry that stands: a later entry for the same index is
  // ignored with the twice warning, and the candidate is minted as the first warning said (#94,
  // R5-2).
  run = await go('coverage: a bad entry, then another for the same index', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1', 'R1-2']], coverage: [two, two], coverageOut: [[{ index: 1, outcome: 'verified', ref: 'R1-1' }, { index: 2, outcome: 'nope' }, { index: 2, outcome: 'refuted', ref: 'not reachable' }], settledAll] })
  const badFirst = (run.res.rounds || [])[0] || { findings: [], coverage: { accounting: [] } }
  check('coverage: a bad first entry stands, a later one for its index is ignored, and the candidate is minted as the warning says', JSON.stringify(badFirst.findings.map((x) => x.id)) === '["R1-1","R1-2"]' && (badFirst.coverage || { accounting: [] }).accounting.map((e) => `${e.index}:${e.outcome}:${e.ref}`).join(',') === '1:verified:R1-1,2:unconfirmed:R1-2' && (run.res.warnings || []).includes('round 1: the reviewer accounted for coverage candidate 2 twice; the first entry stands') && !(run.res.warnings || []).some((w) => w.includes('did not account for coverage candidate 2')), [badFirst.findings.map((x) => x.id), badFirst.coverage, run.res.warnings])
```

The check at line 1492 reads `run` from the run before it, so the new run goes after it. Red: candidate 2 is accounted `refuted` and no finding is minted.

**Change.** In `accountCoverage` (`workflows/redline-loop.js:1553`), replace

```js
    if (seen.has(index)) {
      warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} twice; the first entry stands`)
```

with

```js
    // A bad first entry (an outcome the schema does not name, or a ref naming no finding) is the
    // entry that stands too: its index is in `told`, so a later entry is ignored and the candidate
    // is minted as the first warning said (#94, R5-2).
    if (seen.has(index) || told.has(index)) {
      warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${index} twice; the first entry stands`)
```

The mint loop's own `seen.has(index)` (line 1593) is unchanged.

Neighbours, green before and after: `coverage: the warnings name the index, the new id and the bad ref` (line 1491) and `coverage: a ref that names no finding is not counted verified` (line 1490).

**Proof:** `grep -c 'seen.has(index) || told.has(index)' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: it reaches only a reviewer that accounts for one candidate twice; the warnings keep their text.

**Commit:** `redline: R5-2 keep a bad first coverage entry as the one that stands (#93)`

## Task 7: R5-4, say in the relaunch note that a restated override replaces the refused one

`shape.md`, Decision 6 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `resume: the relaunch note says a decline overruled at a decisions stop carries its disposition` (line 1194), add:

```js
  // An override the resolve agent could not apply is restated, and the restatement replaces it in
  // the relaunch's decisions (#94, R5-4).
  check('resume: the relaunch note says a restated override replaces the one the resolve agent could not apply', first.res.relaunch.how.includes('For each id in overridesUnresolved, the restated decision ({"choice", "notes", "date", "disposition": "fix|defer|accept"}) replaces the one the resolve agent could not apply.'), first.res.relaunch.how)
```

Red: the note has no such sentence.

**Change.** In `handoffResult`'s `relaunch.how` (`workflows/redline-loop.js:2260`), replace

```
plus "disposition": "fix|defer" on a decline overruled at that stop). handoff (plan):
```

with

```
plus "disposition": "fix|defer" on a decline overruled at that stop). For each id in overridesUnresolved, the restated decision ({"choice", "notes", "date", "disposition": "fix|defer|accept"}) replaces the one the resolve agent could not apply. handoff (plan):
```

The string is single-quoted, and the new sentence holds no single quote.

Neighbour, green before and after: `resume: the relaunch note says a decline overruled at a decisions stop carries its disposition` (line 1194), whose clause keeps its words.

**Proof:** `grep -c 'replaces the one the resolve agent could not apply' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `skills/redline/SKILL.md`, "An override the run could not apply", and `docs/running.md`, "Hand-off and relaunch", already say the person restates it; the note now agrees.

**Commit:** `redline: R5-4 say in the relaunch note that a restated override replaces the refused one (#93)`

## Task 8: R5-6, check a decline's reason after forceAskRules

`shape.md`, Decision 7 and Unattended answer 4. Run it before Tasks 9 and 10.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `decline: its call says what Redline would have done and recommends no change` (line 2125), add:

```js
  // A rule-covered decline with no reason is put to the person under the rule, recommending no
  // change, never stopped for its missing reason: the reason check runs after forceAskRules, as
  // checkWhy does (#94, R5-6).
  run = await go('decline: no reason, under a repository rule', { ...baseArgs, askRules: rules }, { ...ruled, declineNoReason: ['R1-2'] })
  const noReasonCall = (run.res.judgmentCalls || [])[0] || { options: [{}] }
  check('decline: a rule-covered decline with no reason is put to the person under the rule, recommending no change', run.res.status === 'handoff' && JSON.stringify(run.res.decisionsNeeded) === '["R1-2"]' && noReasonCall.why_human === 'repository rule craft-config' && noReasonCall.recommendation === 'Accept, no change.' && noReasonCall.options[0].effect === 'Redline would have declined it.', [run.res.status, run.res.error, run.res.judgmentCalls])
```

Red: the run stops at shape with `the shaper declined R1-2 with no reason`.

**Change.** In `workflows/redline-loop.js`:

- In `checkDispositions`, remove the four lines (2611-2614)

  ```js
    const noReason = declined.filter((f) => typeof f.reason !== 'string' || f.reason.trim() === '').map((f) => f.id)
    if (noReason.length) {
      throw stageError('shape', `the shaper declined ${noReason.join(', ')} with no reason; a decline carries the reason a teammate reads in the thread`)
    }
  ```
- Right after `checkWhy`'s closing brace (line 2689), add:

  ```js

  // A decline carries the reason a teammate reads in the thread (#93). Runs after forceAskRules, as
  // checkWhy does, so a decline a repository rule turns into an ask, which needs no reason, never
  // stops the round (#94, R1-13, R5-6); it runs after the `spec status` call, so it names the
  // shaper's label itself (#94, R2-9).
  function checkDeclineReasons(shaped, shaperLabel) {
    const noReason = shaped.findings.filter((f) => f.disposition === 'decline' && (typeof f.reason !== 'string' || f.reason.trim() === '')).map((f) => f.id)
    if (noReason.length) {
      throw stageError('shape', `the shaper declined ${noReason.join(', ')} with no reason; a decline carries the reason a teammate reads in the thread`, {}, shaperLabel)
    }
  }
  ```
- In `forceAskRules` (lines 2758-2778), replace

  ```js
      // What the shaper would have declined is still the person's under the rule (#93): the call
      // says so and recommends no change, with the shaper's reason.
      const declineReason = s.disposition === 'decline' ? (s.reason || '').trim().replace(/\.$/, '') : ''
  ```

  with

  ```js
      // What the shaper would have declined is still the person's under the rule (#93): the call
      // says so and recommends no change, with the shaper's reason when it gave one; a decline with
      // none reaches here, since the reason check runs after this function (#94, R5-6).
      const wasDecline = s.disposition === 'decline'
      const declineReason = wasDecline ? (s.reason || '').trim().replace(/\.$/, '') : ''
      const wouldDecline = wasDecline ? `Redline would have declined it${declineReason ? `: ${declineReason}` : ''}.` : ''
  ```

  then, in the call it builds, replace the first option's

  ```js
  effect: declineReason ? `Redline would have declined it: ${declineReason}.` : recommendation ?
  ```

  with

  ```js
  effect: wouldDecline || (recommendation ?
  ```

  closing the new parenthesis after `'The finding is settled by the person.'` (so the line ends `'The finding is settled by the person.') },`), and replace

  ```js
          recommendation: declineReason ? `Accept, no change: ${declineReason}.` : recommendation ?
  ```

  with

  ```js
          recommendation: wasDecline ? `Accept, no change${declineReason ? `: ${declineReason}` : ''}.` : recommendation ?
  ```
- In `revise()`, right after `forceAskRules(record, pass, inScope, shaped)` in the shape path (line 2905), add `  checkDeclineReasons(shaped, \`shape ${pass.tag}\`)`, written as:

  ```js
    checkDeclineReasons(shaped, `shape ${pass.tag}`)
  ```

  and right after `forceAskRules(record, pass, inScope, shaped)` in the reshape path (line 3029), add:

  ```js
      checkDeclineReasons(shaped, `reshape ${pass.tag} #${adjustment + 1}`)
  ```

Neighbours, green before and after: `decline: a decline with no reason stops at shape, resumable at the shaper` (line 2089: same text, `resumeFrom` label `shape r1`), `decline: its call says what Redline would have done and recommends no change` (line 2125: a decline with its reason keeps `Accept, no change: the handle is renamed on purpose.` and `Redline would have declined it: the handle is renamed on purpose.`), and `human: a decline stops the pass at shape` (line 2112).

**Proof:** `grep -c 'function checkDeclineReasons' workflows/redline-loop.js` prints `1`, `grep -c 'checkDeclineReasons(shaped' workflows/redline-loop.js` prints `2`, and `grep -c 'const noReason' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/contract.md`, the ask-rules paragraph (line 130), already says Redline never chooses `decline` for a rule-covered finding; a reasonless decline still stops at shape.

**Commit:** `redline: R5-6 check a decline's reason after forceAskRules (#93)`

## Task 9: R5-7, check the human pass's values before rewriting a decline's owner

`shape.md`, Decision 8 and Unattended answer 5. Run it after Task 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

- In the shaper mock (line 177), replace

  ```js
      const owner = (id) => (disposition(id) === 'ask' ? 'pending' : disposition(id) === 'fix' && human ? scenario.shaperOwner || 'reviewer' : 'redline')
  ```

  with

  ```js
      // scenario.ownerOf[id] (#94, R5-7) is the decidedBy the shaper writes for that id, to prove the
      // workflow's check of it.
      const owner = (id) => (scenario.ownerOf && scenario.ownerOf[id]) || (disposition(id) === 'ask' ? 'pending' : disposition(id) === 'fix' && human ? scenario.shaperOwner || 'reviewer' : 'redline')
  ```

  Every other scenario's shaper result is unchanged.
- Right after the check `decline: a decline with no reason stops at shape, resumable at the shaper` (line 2089), add:

```js
  // In a Redline round decidedBy reviewer is a human review pass's value whatever the disposition,
  // so a decline that carries it stops at shape as a fix does; a decline with another wrong owner
  // is still rewritten to redline with a warning (#94, R5-7).
  run = await go('decline: decided by reviewer', baseArgs, { ...scenario, ownerOf: { 'R1-3': 'reviewer' } })
  const reviewerOwned = [run.res.status, run.res.stage, run.res.error, (run.res.resumeFrom || {}).label].join('|')
  run = await go('decline: decided by pending', baseArgs, { ...scenario, ownerOf: { 'R1-3': 'pending' } })
  check('decline: a decline marked decided by reviewer stops at shape as a fix does, and one marked pending is rewritten with a warning', reviewerOwned === 'error|shape|the shaper sorted R1-3 with a human review pass\'s values (none, or decidedBy reviewer) in a Redline round|shape r1' && run.res.status === 'done' && (run.res.warnings || []).includes('round 1: the shaper marked the decline of R1-3 as decided by pending; a decline is Redline\'s own') && (replyFor(run.calls, 'push and reply r1', 'R1-3') || '').endsWith(' · decided by: redline'), [reviewerOwned, run.res.status, run.res.warnings])
```

Red: the reviewer-owned decline is rewritten with a warning and the run goes on.

**Change.** In `checkDispositions` (`workflows/redline-loop.js`, as Task 8 leaves it), move the block

```js
  const bad = pass.human
    ? shaped.findings.filter((f) => f.disposition === 'defer')
    : shaped.findings.filter((f) => f.disposition === 'none' || f.decidedBy === 'reviewer')
  if (bad.length) {
    const ids = bad.map((f) => f.id).join(', ')
    throw stageError('shape', pass.human
      ? `the shaper deferred ${ids}; in a human review pass a comment is fix, ask or none, never defer, since nothing a teammate asked for is deferred by Redline on its own`
      : `the shaper sorted ${ids} with a human review pass's values (none, or decidedBy reviewer) in a Redline round`)
  }
```

from after the `for (const f of declined) { ... }` loop to right before it, with this comment above it:

```js
  // The other pass's values are read as the shaper wrote them, before the loop below rewrites a
  // decline's owner, so a decline marked reviewer stops here as a fix marked reviewer does (#94,
  // R5-7).
```

Nothing else in the function changes. In a human pass a decline has already thrown above it, so the human branch is unaffected.

Neighbours, green before and after: `human: a decline stops the pass at shape` (line 2112) and `human: the shaper writes the wrong owner on a fix` (the check after line 984).

**Proof:** `grep -n -e 'const bad = pass.human' -e 'for (const f of declined)' workflows/redline-loop.js` prints the `const bad` line first.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: it reaches only a shaper that writes a human pass's owner on a Redline round's decline; the stage error keeps its text.

**Commit:** `redline: R5-7 check the human pass's values before rewriting a decline's owner (#93)`

## Task 10: R5-8, list a rule-forced decline as what Redline would have declined, with nothing left open

`shape.md`, Decision 9 and Unattended answer 8. Run it after Task 8, which adds `wouldDecline`.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 8's check `decline: a rule-covered decline with no reason is put to the person under the rule, recommending no change`, add:

```js
  // On autopilot a rule-covered finding the shaper declined is listed under Deferred with what
  // Redline would have done, never as a change left open (#94, R5-8).
  run = await go('decline: under a repository rule, on autopilot', { ...baseArgs, askRules: rules, interrupt: 'autopilot' }, ruled)
  const ruledHandoff = comment(run.calls, 'handoff comment') || ''
  check('decline: a rule-covered decline on autopilot is listed as what Redline would have declined, with no open change', run.res.status === 'done' && ruledHandoff.includes('- **R1-2** title R1-2: left to @author under repository rule craft-config; Redline would have declined it: the handle is renamed on purpose.') && !ruledHandoff.includes('open: Accept, no change') && ((run.res.deferred || []).find((d) => d.id === 'R1-2') || {}).fullFix === 'Redline would have declined it: the handle is renamed on purpose.', [run.res.status, ruledHandoff, run.res.deferred])
```

Red: the line reads `... craft-config; open: Accept, no change: the handle is renamed on purpose.`

**Change.** In `workflows/redline-loop.js`:

- In `forceAskRules`, replace

  ```js
      record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation }
  ```

  with

  ```js
      // A decline the rule overrides is recorded with what Redline would have done, for the
      // autopilot's Deferred entry, which has no change left open (#94, R5-8).
      record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation, ...(wouldDecline ? { declined: wouldDecline } : {}) }
  ```
- In the autopilot loop over `record.forced` (line 3163), replace `fullFix: forced.recommendation, rule: forced.rule,` with `fullFix: forced.declined || forced.recommendation, ...(forced.declined ? { declined: true } : {}), rule: forced.rule,`.
- In `handoffComment`'s Deferred list (line 3324), replace

  ```js
        ? `- **${d.id}** ${postedText(d.title)}: left to ${personLabel} under repository rule ${d.rule}; open: ${d.fullFix}`
  ```

  with

  ```js
        ? `- **${d.id}** ${postedText(d.title)}: left to ${personLabel} under repository rule ${d.rule}; ${d.declined ? '' : 'open: '}${d.fullFix}`
  ```

Neighbours, green before and after: `posted text: a Deferred line a rule left to the person escapes and neutralises its title` (line 1128: a non-decline rule entry keeps `open: By hand: fix R1-2 this way.`), `rules: the deferred list carries the rule and no mitigation` (around line 1115), and `decline: its call says what Redline would have done and recommends no change` (line 2125: the call's recommendation is unchanged).

**Proof:** `grep -c 'forced.declined || forced.recommendation' workflows/redline-loop.js` prints `1`, and `grep -c "d.declined ? '' : 'open: '" workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md`, "The handoff comment" (line 154), gives only a mitigated entry's form, and `skills/redline/SKILL.md`'s done walk already reads a rule entry's `fullFix` as what Redline would have done, which the new text is.

**Commit:** `redline: R5-8 list a rule-forced decline as what Redline would have declined (#93)`

## Task 11: R5-10, open every handoff sentence with the ran clause (small refactor)

`shape.md`, Decision 10 and Unattended answer 6.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `handoffComment` (`workflows/redline-loop.js:3234-3241`), in each of the five lines that open with

```
`Redline ran ${reviews} review rounds. The
```

(lines 3234, 3235, 3237, 3239 and 3241), replace `Redline ran ${reviews} review rounds.` with `${ran}.`, so each opens `` `${ran}. The ``. Nothing else on those lines changes.

No check is added: behaviour is unchanged, since a final nit pass follows at least one round and `ran` reads `review rounds` for two or more. Neighbours, green before and after: the final-nit-pass sentence checks (`tests/loop-test.mjs:2246`, `2253`, `2255`, `2264`) and every check that reads the handoff's first line after a final nit pass.

**Proof:** `grep -c 'review rounds[.] The' workflows/redline-loop.js` prints `0`, and `grep -c 'ran}[.] The' workflows/redline-loop.js` prints `5`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: a refactor; every sentence is byte-identical.

**Commit:** `redline: R5-10 open every handoff sentence with the ran clause (#93)`

## Task 12: Verification Gate

**Files:**

- `agent-os/specs/2026-11-14-1509-94-review-round-5/plan.md` and `agent-os/specs/2026-11-14-1509-94-review-round-5/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/workflow/agents.md` (items 1, 2, 3 and 4).
  - `agent-os/standards/workflow/replay.md` (item 5).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-14-1509-94-review-round-5/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected:
   - loop at its count before the round plus what Tasks 2 to 10 add (see Expected counts above);
   - guard `594 passed, 0 mismatched`;
   - gh, prefs, gate, setup and background at their counts before the round, since none reads a file this round changes.
2. **Step 10, Docs:** as each task's Docs entry says. The only touched file under the gate's plugin directories is `workflows/redline-loop.js`, and each task's entry for it names "no reader-facing change" with its reason. No new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.3.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.4`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 11). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", as drafted there.
   - If the approver approves none, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves any, the edits go in one commit of their own after the finding commits: `redline: record the round 5 review lessons in the standards (#93)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - each task's red run (the failing check names) and its green run;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #94 round 5 as built (#93)`
