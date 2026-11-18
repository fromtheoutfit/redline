# PR #108 review round 3: empty dispositions read as none, the first statement picked before it is read, a resume line for a resolve stop, and the stray warnings worded by what the decision names

Spec folder: `agent-os/specs/2026-11-18-1026-108-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #108 (issue #99), from the round's six findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `fix`, one task each, in finding order: R3-1 (Task 2), R3-2 (Task 3), R3-3 (Task 4), R3-4 (Task 5), R3-5 (Task 6), R3-6 (Task 7).
- No `decline`, no `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#99)`. No commit subject holds a bare `@word`.

Line numbers are at `da09090`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.2`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-resolve.md`** (the pull request's own caution, "a round on it that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file. The agent file's new bullet (Task 5) speaks only to a resumed resolve, and the prompt clause is appended only on a resume, so the two agree (`shape.md`, Unattended answer 8).

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 2 changes the comment and the loop after `const decisions` (238-246).
  - Task 5 adds a constant in `resumeLine` after `const shaper` (566-568) and one interpolation in its return (575).
  - Task 3 changes one clause of `relaunch.how` (2652).
  - Task 4 replaces `const statements = ...` (3797).
  - Task 6 rewrites the comment and the first warning of the stray block (3820-3828).
  - Task 7 adds `isCall` above `const strayOverride`, and changes `strayNamed` (3824) and `whose` (3853).
- `tests/loop-test.mjs`:
  - Task 2 adds one run and one check right after the check `bad decision disposition: refused before any agent runs` (607).
  - Task 3 adds one check right after the check `resume: the relaunch note says a restated override replaces the one the resolve agent could not apply` (1456).
  - Task 5 adds two runs and two checks right after Task 3's check.
  - Task 4 adds one run and one check right after the check `filing: a stated disposition outside fix, defer and accept is no statement, so the round stops at resolve` (3243).
  - Task 6 changes the expectation of the check `filing: the resolve agent's entry beside an override to fix is dropped with a warning, ...` (3361) and adds one run and one check right after the check that follows `const overrideAccepted` (3367).
- `agents/redline-resolve.md`: Task 5 adds one bullet to Rules.
- `docs/running.md`: Task 5 changes one clause of the bullet "A deferral you chose at a call" (line 126).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-3/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`. Task 7 is a refactor with no check of its own: its proof is that the gate stays green.

**Expected counts.** Before this round, the loop prints `1435 checks passed, 0 failed` (round 2's As built). The other harnesses print what the baseline prints. A run that reaches Finish adds the run-record check `go` adds; a run that stops or throws does not.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 2 | one named check, and the run-record check of a run that reaches Finish |
| Task 3 | 1 | the relaunch note's plan clause |
| Task 4 | 1 | one named check; the run stops at resolve |
| Task 5 | 3 | two named checks, and the run-record check of the resumed run; the first run stops at resolve |
| Task 6 | 2 | one named check, and the run-record check of a run that reaches Finish; one existing check's expectation changes |
| Task 7 | 0 | a refactor |

So the loop reads `1444 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-18-1026-108-review-round-3/plan.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-3/shape.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-3/standards.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #108 (#99)`

## Task 2: R3-1, an empty or null disposition names none

`shape.md`, Unattended answer 5 and Decision 1.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `bad decision disposition: refused before any agent runs` (607), add:

```js
  // An empty or a null disposition names none (#108, R3-1), as every reader of the field reads it:
  // the decision runs on as a call with no disposition, its resolve prompt shows none, and the
  // agent states one. The neighbour above, a value outside the three, is still refused.
  run = await go('empty decision disposition', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: '' }, 'R1-2': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: null } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-1', 'R1-2'], commitIds: [['R1-1', 'R1-2']] })
  const emptyResolve = (pick(run.calls, 'resolve r1') || { prompt: '' }).prompt
  check('empty decision disposition: an empty and a null one each run on as no disposition, and the resolve prompt shows neither', !run.thrown && (run.res || {}).status === 'done' && emptyResolve !== '' && !emptyResolve.includes('"disposition": ""') && !emptyResolve.includes('"disposition": null'), [run.thrown && run.thrown.message, (run.res || {}).status, (run.res || {}).error])
```

See it fail on a gate run: the run throws `args.decisions must give a disposition of fix | defer | accept`.

**Change.** In `workflows/redline-loop.js`, the block after `const decisions = ...` (238-246):

```js
// A decision that names its own disposition names one of the three (#108, R2-6): the skill
// records only fix, defer or accept, and every reader of the field matches those exact values,
// so any other would be neither checked at resolve nor demanded at the check. Until #99 a
// resolve task with files was demanded whatever the decision named.
for (const [id, entry] of Object.entries(decisions)) {
  if (entry && typeof entry === 'object' && entry.disposition !== undefined && !CALL_ENDS.includes(entry.disposition)) {
    fail(`args.decisions must give a disposition of ${CALL_ENDS.join(' | ')} when it gives one; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  }
}
```

becomes:

```js
// A decision that names its own disposition names one of the three (#108, R2-6): the skill
// records only fix, defer or accept, and every reader of the field matches those exact values,
// so any other would be neither checked at resolve nor demanded at the check. Until #99 a
// resolve task with files was demanded whatever the decision named. An empty or a null one
// names none, as every reader of the field reads it and as run() reads an agent's error (#42):
// it is dropped from the run's copy of the decision, so the resolve prompt shows none either,
// where the check above refused it and a relaunch threw before any agent ran (#108, R3-1).
for (const [id, entry] of Object.entries(decisions)) {
  if (entry && typeof entry === 'object' && (entry.disposition === null || entry.disposition === '')) {
    decisions[id] = Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'disposition'))
  } else if (entry && typeof entry === 'object' && entry.disposition !== undefined && !CALL_ENDS.includes(entry.disposition)) {
    fail(`args.decisions must give a disposition of ${CALL_ENDS.join(' | ')} when it gives one; got ${JSON.stringify(id)}: ${JSON.stringify(entry)}`)
  }
}
```

`decisions` is a shallow copy of `args.decisions` (237), so the entry is replaced in the copy and `args` is left as it was. The `fail` line is unchanged, and `bad decision disposition` (606-607) stays green.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Hand-off and relaunch". No reader-facing change: the skill records a disposition only as `fix`, `defer` or `accept` (`skills/redline/SKILL.md`, lines 189, 215, 224, 228) and an ask with none (line 232), so no run the skill launches holds an empty one.

**Commit:** `redline: R3-1 read an empty or null decision disposition as none (#99)`

## Task 3: R3-2, the relaunch note gives a plan dial ask no disposition

`shape.md`, Unattended answer 6 and Decision 2.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `resume: the relaunch note says a restated override replaces the one the resolve agent could not apply` (1456), add:

```js
  // The plan clause gives an ask the shape the skill records for it, with no disposition, and a
  // changed disposition its own (#108, R3-2): since #99 a disposition on a call's decision decides it.
  check('resume: the relaunch note gives a plan dial ask no disposition, and a changed disposition its own', first.res.relaunch.how.includes('plus decisions for every ask ({"choice", "notes", "date"}) and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"})'), first.res.relaunch.how)
```

See it fail on a gate run.

**Change.** In `workflows/redline-loop.js`, `relaunch.how` (2652), the clause:

```
plus decisions for every ask and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"})
```

becomes:

```
plus decisions for every ask ({"choice", "notes", "date"}) and every changed disposition ({"choice", "notes", "date", "disposition": "fix|defer|accept"})
```

The string is single-quoted and the clause holds no single quote, so nothing needs escaping. No other word of the note changes, and the checks at `tests/loop-test.mjs:1452-1456` stay green.

**Docs entry:** `workflows/redline-loop.js`: `skills/redline/SKILL.md`, the section for a hand-off whose `handoffKind` is plan (the plan dial). No reader-facing change: the skill already records an ask with no disposition (line 191, then line 232) and a changed disposition with one (line 189); the note is brought to it.

**Commit:** `redline: R3-2 give a plan dial ask no disposition in the relaunch note (#99)`

## Task 4: R3-3, the first statement is picked before its value is read

`shape.md`, Unattended answer 4 and Decision 3.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `filing: a stated disposition outside fix, defer and accept is no statement, so the round stops at resolve` (3243), add:

```js
  // One statement a call is the first returned, whatever it holds (#108, R3-3; the spec's
  // decisions 12 and 20): a first statement outside the three is no statement, so the round stops
  // at resolve even with a valid second one beside it. `statedTwice` above is the neighbour, two
  // valid statements, the first kept.
  const misstatedFirst = await go('filing: the resolve agent states a disposition the workflow does not know, then a fix, for one call', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'], resolveDecided: { 'R1-1': 'mitigate' }, resolveDecidedTwice: { 'R1-1': 'fix' }, commitIds: [['R1-1']] })
  check('filing: of two statements for one call the first is kept even when it is outside the three, so the round stops at resolve', (misstatedFirst.res || {}).status === 'error' && misstatedFirst.res.stage === 'resolve' && (misstatedFirst.res.error || '').startsWith('the resolve agent stated no disposition for R1-1') && Boolean(misstatedFirst.res.resumeFrom) && misstatedFirst.res.resumeFrom.label === 'resolve r1', [(misstatedFirst.res || {}).status, (misstatedFirst.res || {}).stage, (misstatedFirst.res || {}).error])
```

See it fail on a gate run: the valid second statement is kept and the round goes on.

**Change.** In `workflows/redline-loop.js`, `resolveWith`, the line (3797):

```js
    const statements = firstPerId((out.decided || []).filter((item) => CALL_ENDS.includes(item.disposition)))
```

becomes:

```js
    // The first statement is picked before its value is read, so a first one outside the three
    // leaves the call with no statement, a valid second beside it included (#108, R3-3).
    const firstStated = firstPerId(out.decided || [])
    const statements = { kept: firstStated.kept.filter((item) => CALL_ENDS.includes(item.disposition)), repeated: firstStated.repeated }
```

The comment above (3788-3796), the repeat warning and every later read of `statements.kept` are unchanged. `statedTwice` (3238-3239) and `misstated` (3242-3243) stay green.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call". No reader-facing change: the bullet already says "A second statement for one call is dropped too: `the resolve agent stated a disposition for R1-4 more than once; the first is kept`", which is now what the code does whatever the first holds.

**Commit:** `redline: R3-3 pick the first statement before reading its value (#99)`

## Task 5: R3-4, a resumed resolve is told the stop was the check of its own result

`shape.md`, Decision 4 and Proportionality.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-resolve.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after Task 3's check `resume: the relaunch note gives a plan dial ask no disposition, and a changed disposition its own`, add:

```js
  // A stop at resolve is the workflow's check of what the resolve agent returned, so its resume
  // line tells the rerun to correct what its first attempt wrote, decided entries included (#108,
  // R3-4). The recheck above is the neighbour: its resumed prompt ends with the line alone.
  const resolveClause = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read shape.md and plan.md as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.'
  const stoppedAtResolve = await go('resume: a stop at resolve', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveUnstated: ['R1-1'], commitIds: [['R1-1']] })
  const resolveError = (stoppedAtResolve.res || {}).error || ''
  const resumedResolve = await go('resume: a stop at resolve, resumed', { ...baseArgs, interrupt: 'autopilot', resume: { 'resolve r1': { attempt: 2, error: resolveError, hand: { commits: [], paths: [] } } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  const resumedResolvePrompt = (pick(resumedResolve.calls, 'resolve r1') || { prompt: '' }).prompt
  check('resume: a resumed resolve is told the stop was the check of its own result and to correct what it wrote, and the relaunch finishes', resolveError.startsWith('the resolve agent stated no disposition for R1-1') && resumedResolvePrompt.endsWith(line(resolveError) + resolveClause) && (resumedResolve.res || {}).status === 'done', [resolveError, resumedResolvePrompt.slice(-600), (resumedResolve.res || {}).status])
  check('resume: the resolve agent\'s file says the same of a resumed resolve, as the resume line does', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again'))
```

`line` is the section's helper (1435). See both fail on a gate run. The existing check `resume: the resumed prompt ends with the resume line` (1449) is the neighbour that must not change: a recheck's resumed prompt still ends with the line alone.

**Change.**

1. In `workflows/redline-loop.js`, `resumeLine` (564-576), right after the `const shaper = ...` statement (566-568), add:

   ```js
     // A resolve stop is the workflow's check of what the resolve agent returned (#95, #97 R2-13,
     // #99), not a cause the person fixes by hand, and its first attempt has already turned the
     // pending entries and tasks into decided ones, so the rerun is told to correct what it wrote
     // (#108, R3-4).
     const resolveFix = opts.agentType === 'redline:redline-resolve'
       ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read shape.md and plan.md as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.'
       : ''
   ```

   The sentence holds no single quote, so nothing needs escaping. In the `return` line (575), the end of the template:

   ```
   ${shaper}${finishComment}${recordCommit}`
   ```

   becomes:

   ```
   ${shaper}${resolveFix}${finishComment}${recordCommit}`
   ```

   No other word of the line changes, so every other agent's resumed prompt is as it was.

2. In `agents/redline-resolve.md`, section "Rules", right after the bullet that opens `- **Apply, never reinterpret.**`, add:

   ```
   - **On a resume.** A prompt that ends with a resume line reruns this step after the run stopped at it. When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read `shape.md` and `plan.md` as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.
   ```

   No other sentence of the agent file changes.

3. In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), the clause:

   ```
   where the resolve agent runs again, and nothing is posted:
   ```

   becomes:

   ```
   where the resolve agent runs again, told that the stop was the check the workflow runs on what it returned and asked to correct what it wrote, so nothing needs fixing by hand first, and nothing is posted:
   ```

   No other sentence of the bullet changes.

**Docs entry:** `workflows/redline-loop.js` and `agents/redline-resolve.md`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call", changed in this task's commit.

**Commit:** `redline: R3-4 tell a resumed resolve the stop was the check of its own result (#99)`

## Task 6: R3-5, word an override's stray warning by the disposition it was changed to

`shape.md`, Decision 5.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the check `filing: the resolve agent's entry beside an override to fix is dropped with a warning, and neither the plan approver nor the implementer is shown it` (3361), the expected warning:

   ```
   'round 1: the resolve agent listed R1-1 as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands'
   ```

   becomes:

   ```
   'round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands'
   ```

2. Right after the check that follows `const overrideAccepted` (3367, `filing: an override to accept beside a filled resolve entry files nothing, ...`), add:

   ```js
     // An override's stray warning names the disposition the person changed the finding to, since
     // an override need not have been a deferral (#108, R3-5): here the shaper declined the finding
     // and the person overruled it to a fix.
     const declineStray = await go('filing: a decline the person overrules to a fix, beside a filled resolve entry', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: fixOverride }, { reviews: [[f('R1-1', 'correctness')], []], decline: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [['R1-1']] })
     check('filing: a stray entry beside a decline overruled to a fix is warned with the disposition the person chose, never as a change away from defer', ((declineStray.res || {}).warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands') && !((declineStray.res || {}).warnings || []).some((w) => w.includes('changed away from defer')), [(declineStray.res || {}).status, (declineStray.res || {}).warnings])
   ```

See both fail on a gate run: each warning reads `a finding the person changed away from defer`.

**Change.** In `workflows/redline-loop.js`, `resolveWith`, the comment (3820-3822):

```js
    // An override is a finding the person changed away from defer; a call whose decision names
    // its own fix or accept was never a deferral, and its warning says whose decision it is
    // (#108, R2-3). An override is never one of the round's calls (overridesFor).
```

becomes:

```js
    // An override is a finding whose disposition the person changed, from whatever the shaper
    // sorted it to (a decline overruled to a fix included), and a call whose decision names its
    // own fix or accept was never a deferral either: each warning says whose decision it is and
    // what it names (#108, R2-3, R3-5). An override is never one of the round's calls (overridesFor).
```

and the block (3826-3828):

```js
    if (strayChanged.length) {
      warnings.push(`${pass.name}: the resolve agent listed ${strayChanged.join(', ')} as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands`)
    }
```

becomes:

```js
    for (const id of strayChanged) {
      warnings.push(`${pass.name}: the resolve agent listed ${id} as deferred, a finding whose disposition the person changed to ${roundDecisions[id].disposition}; the entry is dropped, since the decision stands`)
    }
```

The named-call warning after it (3829-3831), `strayCall` and every use of `strayOverride` (`fresh`) are unchanged. `namedStray` (3262-3263) stays green. The comments at 3736 and 4006, which describe `awayFromDefer` dropping the shaper's own deferral, are left as they are.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call". No reader-facing change: the bullet quotes only the warning for a call whose decision is stated, which this task does not change, and quotes no override's warning.

**Commit:** `redline: R3-5 word an override's stray warning by the disposition it was changed to (#99)`

## Task 7: R3-6, one predicate tells a call from an override in resolveWith

`shape.md`, Unattended answer 7 and Decision 6. A small refactor; it follows Task 6.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`, `resolveWith`:

1. Right above `const strayOverride = once.kept.filter((item) => awayFromDefer(item.id)).map((item) => item.id)` (after Task 6's comment), add:

   ```js
       // Whether a decision is a call's or an override's, read one way for the stray warnings and
       // the named-check stops (#108, R3-6): `newCalls` is always within `calls`, and `overridesFor`
       // never takes a call.
       const isCall = (id) => calls.some((call) => call.id === id)
   ```

2. The line:

   ```js
       const strayNamed = strayOverride.filter((id) => calls.some((call) => call.id === id))
   ```

   becomes:

   ```js
       const strayNamed = strayOverride.filter(isCall)
   ```

3. The line (3853):

   ```js
       const whose = (id) => (newOverrides.some((f) => f.id === id) ? 'a disposition override' : 'its decision')
   ```

   becomes:

   ```js
       const whose = (id) => (isCall(id) ? 'its decision' : 'a disposition override')
   ```

**Test.** No check is added and no check's expectation changes: behaviour is unchanged (`shape.md`, Unattended answer 7). Before committing, with plain pipelines:

- `grep -c "const isCall = (id) => calls.some((call) => call.id === id)" workflows/redline-loop.js` prints `1`.
- `grep -c "newOverrides.some((f) => f.id === id)" workflows/redline-loop.js` prints `0`.

The gate run after the change prints the same count as before it, with `namedStray`, `overrideBuilt`, `declineStray` and every named-check stop (`namedUnbuilt`, `namedDeferNoEntry` and the round 1 R1-5 runs) green.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with the same messages.

**Commit:** `redline: R3-6 tell a call from an override with one predicate in resolveWith (#99)`

## Task 8: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1444 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 2 to 7) and `agents/redline-resolve.md` (Task 5), each with the section and the reason given in its task; `docs/running.md` (Task 5) is reader-facing by nature, and Task 5's clause is the entry for its workflow and agent-file change. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.2`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 3 for PR #108 (#99)`.
