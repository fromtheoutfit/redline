# PR #94 review round 7: nothing dropped, the second look read, and the quoted subject's edge cases

Spec folder: `agent-os/specs/2026-11-15-0822-94-review-round-7/`

Shaped by Redline in unattended mode, for review round 7 of PR #94 (issue #93, with #68 on the same branch), from the round's ten findings (`redline/round-7-review.json`, `redline/round-7-findings.json`).

- `fix`, one task each, in finding order: R7-10 (Task 2), R7-1 (Task 3), R7-3 (Task 4), R7-4 (Task 5), R7-5 (Task 6), R7-6 (Task 7), R7-7 (Task 8), R7-8 (Task 9), R7-9 (Task 10).
- `decline`, no task and no commit: R7-2 (`shape.md`, `## Declined`).
- No `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `8739d8b`, the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/checks-template.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `scripts/redline-guard.sh`, `hooks/hooks.json`, any agent file or anything under `templates/`. The version stays 0.3.0 (`shape.md`, Standards Applied, process/release).

Task order matters: Tasks 2 and 4 to 10 all change `workflows/redline-loop.js` and `tests/loop-test.mjs`, in different places; each task's anchors are as the tasks before it leave them. Tasks 2, 4 and 5 all change `skills/redline/SKILL.md`, on different lines. Tasks 2, 3 and 6 all change `docs/running.md`, on different lines.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-7/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a loop check (2, 4, 6, 7, 8, 9, 10) adds it first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. Tasks 3 and 5 change text only.

**Expected counts.** Before this round: loop `944 checks passed, 0 failed`, guard `596 passed, 0 mismatched`, prefs `121`, gate `117`, setup `506`, gh `136`, background `39` (round 6's As built). This round adds ten `check()` calls to the loop test (Task 2 two, Tasks 4, 6, 7, 8, 9 and 10 one each, Task 6's and Task 8's in new runs), plus the run-record check `go()` adds for each new run that reaches Finish (Task 2's two runs and the one new run each of Tasks 6, 7, 8, 9 and 10: seven), so loop should read 961. **A deviation to watch:** Task 2 changes what a final nit pass does with a nit its reviewer reports. A scenario elsewhere in the loop test whose final nit pass scripts a nit would now see it declined, and a check pinning that round's body or the handoff's Rounds line (`no new items`) would go red. None was found by reading (`shape.md`, Decision 1), but if one goes red, update it only to the text Task 2 specifies and record it under Decisions in `shape.md` as a deviation. The other harnesses keep their counts. The first green gate run's counts are the evidence, recorded under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-15-0822-94-review-round-7/plan.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-7/shape.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-7/standards.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-7/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 7 spec for PR #94 (#93)`

## Task 2: R7-10, a final nit pass declines a nit its reviewer reports, never drops it

`shape.md`, Decision 1 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`
- `skills/redline/SKILL.md`

**Test first.** In `tests/loop-test.mjs`:

1. In the scope section, right after the check that opens `check('scope: the closing sentence says the items declined under the scope have no inline comment and no reply` (line 480), add:

   ```js
     // A final nit pass reports correctness only, and a nit its reviewer reports anyway is declined
     // by the workflow under the pass's scope, never dropped (#94, R7-10): kept in the round with its
     // outcome, listed once in the round's review body and in the handoff, with no thread, never shaped.
     const nitPassNit = await go('scope: a nit the final nit pass reports anyway', baseArgs, { reviews: [[f('R1-1', 'nit')], [f('R2-1', 'nit')]], commitIds: [['R1-1']] })
     const nitPassPost = (pick(nitPassNit.calls, 'post r2') || { prompt: '' }).prompt
     const nitPassHandoff = comment(nitPassNit.calls, 'handoff comment') || ''
     check('scope: a nit the final nit pass reports is declined under the pass\'s scope, kept in the round, listed in its review body and the handoff, never shaped', nitPassNit.res.status === 'done' && JSON.stringify((nitPassNit.res.rounds[1].scoped || []).map((x) => x.id)) === '["R2-1"]' && (nitPassNit.res.rounds[1].outcomes || {})['R2-1'] === 'declined: outside the final nit pass\'s scope (correctness only) · decided by: redline' && nitPassPost.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\\n\\n- R2-1 · `app/x.php:1` · title R2-1') && nitPassHandoff.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\n\n- R2-1 · `app/x.php:1` · title R2-1') && !labels(nitPassNit.calls).includes('shape r2'), [nitPassNit.res.status, labels(nitPassNit.calls), nitPassHandoff])
   ```

2. In the human pass section, right after the check that opens `check('human: the result records the pass and the owners'` (line 1081), add:

   ```js
     // The human pass's final nit pass declines a nit its reviewer reports the same way (#94, R7-10).
     const humanNit = await go('human: the final nit pass reports a nit anyway', decided, { ...scenario, reviews: [[f('R3-1', 'nit')]] })
     check('human: a nit the final nit pass reports is declined under the pass\'s scope and listed in its review body, never shaped', humanNit.res.status === 'done' && JSON.stringify((humanNit.res.rounds[1].scoped || []).map((x) => x.id)) === '["R3-1"]' && (pick(humanNit.calls, 'post r3') || { prompt: '' }).prompt.includes('### Declined under the final nit pass\'s scope (correctness only) (1)\\n\\n- R3-1 · `app/x.php:1` · title R3-1') && !labels(humanNit.calls).includes('shape r3'), [humanNit.res.status, labels(humanNit.calls)])
   ```

Red: both runs record no `scoped` for the nit pass round, and neither body lists the nit.

**Change.** In `workflows/redline-loop.js`:

1. Right after the line `const SCOPE_DECLINED = ...` (line 341), add:

   ```js
   // What became of a nit a final nit pass's reviewer reported though the pass reports correctness
   // only (#94, R7-10): the workflow declines it under the pass's scope, never drops it.
   const NIT_PASS_DECLINED = `declined: outside the final nit pass's scope (correctness only) · decided by: redline`
   // The scope a workflow decline names: the final nit pass's in that pass, else the run's.
   const scopeName = (reviewed) => (reviewed === 'final-nit-pass' ? 'the final nit pass\'s scope' : 'this run\'s scope')
   ```

2. In `reviewBody`, replace

   ```js
       lines.push('', `### Declined under this run's scope (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
   ```

   (the one inside `reviewBody`, line 995) with

   ```js
       lines.push('', `### Declined under ${scopeName(reviewed)} (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
   ```

   and in the closing sentence (line 1013) replace

   ```js
   ${scoped.length ? ' The items declined under this run\'s scope have no inline comment and no reply.' : ''}
   ```

   with

   ```js
   ${scoped.length ? ` The items declined under ${scopeName(reviewed)} have no inline comment and no reply.` : ''}
   ```

   The comment above that block ("Under correctness only, what is not a correctness item is declined ...", lines 991-993) gains: "A final nit pass declines a nit its reviewer reports the same way, under its own scope (#94, R7-10)."

3. In `result()`'s round mapping (line 2279), replace `      droppedNits: record.droppedNits || 0,` with

   ```js
         // Nothing a final nit pass reports is dropped since #94, R7-10, so this reads 0; the key
         // is kept for readers of the result.
         droppedNits: record.droppedNits || 0,
   ```

4. In `handoffComment`, replace (line 3447)

   ```js
       lines.push('', `### Declined under this run's scope (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
   ```

   with

   ```js
       lines.push('', `### Declined under ${scopeName(scope === 'correctness' ? 'pr' : 'final-nit-pass')} (correctness only) (${scoped.length})`, '', ...scoped.map(scopedLine))
   ```

   and the comment above it ("What the workflow declined under a correctness-only scope ...", line 3444) gains: "On any other run only a final nit pass declines one (#94, R7-10)."

5. In the human pass's final nit pass (lines 3911-3919), replace

   ```js
         const considered = reviewOut.findings.filter((f) => f.category === 'correctness')
         const droppedNits = reviewOut.findings.length - considered.length
         const known = considered.filter((f) => f.knownAs)
         const active = considered.filter((f) => !f.knownAs)
         log(`round ${round} (final nit pass over ${source}): ${active.length} correctness, ${known.length} already tracked, ${droppedNits} nit(s) dropped`)
   ```

   with

   ```js
         // A nit the reviewer reports though the pass reports correctness only is declined under the
         // pass's scope, as in a Redline run's final nit pass, never dropped (#94, R7-10).
         const considered = reviewOut.findings
         const known = considered.filter((f) => f.knownAs)
         const scoped = considered.filter((f) => !f.knownAs && f.category !== 'correctness')
         const active = considered.filter((f) => !f.knownAs && !scoped.includes(f))
         log(`round ${round} (final nit pass over ${source}): ${active.length} correctness, ${known.length} already tracked, ${scoped.length} nit(s) declined under the final nit pass's scope`)
   ```

   In the `post(...)` call two lines below, `{ ...reviewOut, findings: considered }` becomes `{ ...reviewOut, findings: considered, scoped }`; in `roundRecord`, `findings: considered, droppedNits,` becomes `findings: considered, scoped, outcomes: Object.fromEntries(scoped.map((f) => [f.id, NIT_PASS_DECLINED])),`.

6. In the main loop (lines 3984-4001), replace

   ```js
       let considered = reviewOut.findings
       let droppedNits = 0
       if (reviewed === 'final-nit-pass') {
         considered = reviewOut.findings.filter((f) => f.category === 'correctness')
         droppedNits = reviewOut.findings.length - considered.length
         if (droppedNits) {
           log(`round ${round}: dropped ${droppedNits} nit(s) the reviewer reported; the final nit pass reports correctness only`)
         }
       }
       const known = considered.filter((f) => f.knownAs)
   ```

   with

   ```js
       const considered = reviewOut.findings
       const known = considered.filter((f) => f.knownAs)
   ```

   then add to the comment above `const scoped` (it opens "Under correctness only, a verified item that is not a correctness one is declined by the"): "A final nit pass reports correctness only, so a nit its reviewer reports anyway is declined the same way, under the pass's scope, never dropped (#94, R7-10)." Replace

   ```js
       const scoped = scope === 'correctness' && reviewed !== 'final-nit-pass' ? considered.filter((f) => !f.knownAs && f.category !== 'correctness') : []
   ```

   with

   ```js
       const scoped = scope === 'correctness' || reviewed === 'final-nit-pass' ? considered.filter((f) => !f.knownAs && f.category !== 'correctness') : []
   ```

   and in the log line below it replace `declined under the scope (correctness only)` with `declined under ${scopeName(reviewed)} (correctness only)`. In `const record = { ... }` (line 4009), remove `droppedNits, ` and replace `outcomes: Object.fromEntries(scoped.map((f) => [f.id, SCOPE_DECLINED]))` with `outcomes: Object.fromEntries(scoped.map((f) => [f.id, reviewed === 'final-nit-pass' ? NIT_PASS_DECLINED : SCOPE_DECLINED]))`.

`post()`'s findings file (2557-2560) already writes `scoped` apart from `findings` for any round, and `scopedLine`'s plain id keeps `redline-gh.sh prior-findings` from reading the line back, as under `correctness only`. Neighbours, green before and after: every check in the scope section (446-481), `scope all: the final nit pass still runs` (477), `nit pass: lastFixUnreviewed` (494), `plan: handoff comment names the approvals` (407, its round 3 scripts no finding), and the human pass call-sequence check.

In `docs/running.md`:

- "Rounds" step 7, "What ends the run" (line 44): after "in which the reviewer alone reads those fixes and reports only correctness bugs they introduced." insert "A nit it reports anyway is declined with the pass's scope as its reason, listed once in that round's review body and in the handoff, with no thread, and is never shaped."
- "The handoff comment" (line 153): the bullet becomes "- `### Declined under this run's scope (correctness only) (n)`: on a `correctness only` run, what the scope declined; on any other run, `### Declined under the final nit pass's scope (correctness only) (n)`: a nit the final nit pass's reviewer reported though that pass reports correctness only."

In `skills/redline/SKILL.md`, line 242, replace "as declined under this run's scope (correctness only), with no thread and no reply." with "as declined under this run's scope (correctness only), or, in a final nit pass's round, under that pass's scope, with no thread and no reply."

**Proof:** `grep -c 'NIT_PASS_DECLINED' workflows/redline-loop.js` prints `3`; `grep -c 'droppedNits' workflows/redline-loop.js` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — `docs/running.md`, "Rounds" step 7 ("What ends the run") and "The handoff comment", updated in this task's commit.
- `skills/redline/SKILL.md` — the skill's own text, updated in this commit; `docs/running.md` as above is the reader-facing description.

**Commit:** `redline: R7-10 decline a nit the final nit pass reports under its scope, never drop it (#93)`

## Task 3: R7-1, "Decided by" names the handoff's outcome lines

`shape.md`, Decision 2.

**Files:**

- `docs/running.md`

**Change.** In "Decided by" (line 165), replace "and each line of the handoff comment's Decisions list ends with one of:" with "and each item line the handoff comment lists under an outcome heading (Put to, Asked and decided on autopilot, Overruled by, Declined by Redline, Left to, Not picked, Not changed and Fixed; see \"The handoff comment\" above) ends with one of:".

**Proof:** `grep -c 'Decisions list' docs/running.md` prints `0`.

**Docs entry:** `docs/running.md` is reader-facing by nature and needs no entry of its own.

**Commit:** `redline: R7-1 name the handoff's outcome lines in Decided by (#93)`

## Task 4: R7-3, the result carries what would confirm an unconfirmed finding

`shape.md`, Decision 4.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`

**Test first.** In `tests/loop-test.mjs`, in the coverage section, right after the check that opens `check('coverage: the result carries each round` (line 1538), add:

```js
  // The result carries what would confirm an unconfirmed finding, so the review-only summary can say
  // it; a confirmed finding has no such key (#94, R7-3).
  check('coverage: the result carries wouldConfirm for an unconfirmed finding, and none for a confirmed one', (run.res.rounds[0].findings.find((x) => x.id === 'R1-2') || {}).wouldConfirm === 'a browser on the page' && !('wouldConfirm' in (run.res.rounds[0].findings.find((x) => x.id === 'R1-1') || {})), run.res.rounds[0].findings)
```

`run` there is the `every` scenario's run (line 1525), whose R1-2 is unconfirmed with `wouldConfirm: 'a browser on the page'`. Red: R1-2 has no `wouldConfirm`.

**Change.** In `workflows/redline-loop.js`, `result()`'s round mapping (line 2274), replace `      findings: record.findings.map(compactFinding),` with

```js
      // What would confirm an unconfirmed finding rides with it, so the skill's review-only summary
      // can say it (#94, R7-3); compactFinding stays as history() uses it in the reviewer's prompt.
      findings: record.findings.map((f) => ({ ...compactFinding(f), ...(f.confidence === 'unconfirmed' ? { wouldConfirm: f.wouldConfirm || 'not stated' } : {}) })),
```

In `skills/redline/SKILL.md`, line 170, replace "(`confidence` `unconfirmed`, each with what would confirm it)" with "(`confidence` `unconfirmed`, each with what would confirm it, its `wouldConfirm`)".

Neighbours, green before and after: `coverage: unaccounted, unknown-outcome and no-finding-ref candidates become unconfirmed findings as reported` (1625), which reads named fields only, and every `history()`-fed prompt check, since `compactFinding` does not change.

**Proof:** `grep -c 'wouldConfirm: f.wouldConfirm' workflows/redline-loop.js` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js` — no reader-facing change: the result is read by the skill, whose text this commit updates; no `docs/` file describes the result's fields.
- `skills/redline/SKILL.md` — the skill's own text, updated in this commit.

**Commit:** `redline: R7-3 carry wouldConfirm in the result for the review-only summary (#93)`

## Task 5: R7-4, two comments and the grammar table state the rules as they now are

`shape.md`, Decision 5.

**Files:**

- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`

**Change.** In `workflows/redline-loop.js`:

- Line 114: "never fixed or deferred by Redline." becomes "never fixed, declined or deferred by Redline."
- Lines 176-177: the comment becomes

  ```js
  // Finding scope: 'all' reviews for correctness bugs and nits; under 'correctness' the reviewer runs
  // no nit checks of its own, a nit a candidate raises is still verified and declined by the
  // workflow with the scope as its reason, and a round without a correctness finding is done (no
  // final nit pass).
  ```

In `skills/redline/SKILL.md`, the grammar table's `correctness only` row (line 27): "the reviewer never looks for nits, and a round without a correctness finding is done" becomes "the reviewer runs no nit checks of its own, a nit it verifies is declined with the scope as its reason, and a round without a correctness finding is done".

**Proof:** `grep -c 'never looks for nits' workflows/redline-loop.js skills/redline/SKILL.md` prints `workflows/redline-loop.js:0` and `skills/redline/SKILL.md:0`.

**Docs entries:**

- `workflows/redline-loop.js` — no reader-facing change: comments only.
- `skills/redline/SKILL.md` — the skill's own text, corrected in this commit; `README.md:56` and `docs/running.md:48` already describe the scope this way.

**Commit:** `redline: R7-4 state the scope and the ask-rule outcomes as they now are (#93)`

## Task 6: R7-5, the workflow reads the shaper's second look

`shape.md`, Decision 6 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the check that opens `check('decline: a rule-covered decline on autopilot is listed as what Redline would have declined, with no open change'` (line 2301), add:

```js
  // The second look is read (#94, R7-5): a finding the verifier could not confirm that the shaper
  // gives no secondLook, and a decline as could not confirm whose second look refuted the claim,
  // each leave a warning; a decline as could not confirm whose second look stayed unconfirmed, none.
  const looks = await go('second look: read and checked', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a browser' }), f('R1-3', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a queue' }), f('R1-4', 'nit', { confidence: 'unconfirmed', wouldConfirm: 'a cron' })], []], decline: ['R1-2', 'R1-3', 'R1-4'], reason: { 'R1-2': 'could not confirm: needs a browser', 'R1-3': 'could not confirm: needs a queue', 'R1-4': 'could not confirm: needs a cron' }, secondLook: { 'R1-3': 'refuted', 'R1-4': 'unconfirmed' }, commitIds: [['R1-1']] })
  check('second look: a missing one and a refuted one declined as could not confirm each leave a warning, and a consistent one none', looks.res.status === 'done' && looks.res.warnings.includes('round 1: the shaper gave no second look (secondLook) for R1-2, which the verifier could not confirm') && looks.res.warnings.includes('round 1: the shaper declined R1-3 as could not confirm, but its second look says refuted') && !looks.res.warnings.some((w) => w.includes('R1-4')), looks.res.warnings)
```

Red: neither warning is written.

**Change.** In `workflows/redline-loop.js`, right after `checkDispositions` ends (the closing `}` after the stray-deferred block, line 2712), add:

```js

// The second look (#93; #94, R7-5): a finding the verifier could not confirm carries the shaper's
// secondLook, and a decline whose second look refuted or confirmed the claim does not give
// "could not confirm" as its reason. Read before forceAskRules rewrites a disposition. A miss is a
// warning: a Redline round's shape stops only on the ask cases and a decline with no reason.
function checkSecondLook(pass, shaped, inScope) {
  if (pass.human) {
    return
  }
  const unconfirmed = new Set(inScope.filter((f) => f.confidence === 'unconfirmed').map((f) => f.id))
  const missing = shaped.findings.filter((s) => unconfirmed.has(s.id) && !s.secondLook).map((s) => s.id)
  if (missing.length) {
    warnings.push(`${pass.name}: the shaper gave no second look (secondLook) for ${missing.join(', ')}, which the verifier could not confirm`)
  }
  for (const s of shaped.findings) {
    if (s.disposition === 'decline' && s.secondLook && s.secondLook !== 'unconfirmed' && /^could not confirm/i.test((s.reason || '').trim())) {
      warnings.push(`${pass.name}: the shaper declined ${s.id} as could not confirm, but its second look says ${s.secondLook}`)
    }
  }
}
```

and call it right after each `checkDispositions(pass, shaped)` in `revise()` (lines 3010 and 3144): `checkSecondLook(pass, shaped, inScope)`.

In `docs/running.md`, "Dispositions", at the end of the paragraph that opens "**A finding the verifier could not confirm** gets the shaper's second look first" (line 107), add: "The shaper returns what it found as `secondLook`; the run warns when a finding the verifier could not confirm has none, or when a decline gives `could not confirm` as its reason though the second look refuted or confirmed the claim."

Neighbours, green before and after: `coverage: unaccounted, unknown-outcome and no-finding-ref candidates become unconfirmed findings as reported` and the warning checks after it (1625-1627), which read named warnings with `includes` and `some`.

**Proof:** `grep -c 'checkSecondLook(pass, shaped, inScope)' workflows/redline-loop.js` prints `3`, the definition and the two calls.

**Docs entry:** `workflows/redline-loop.js` — `docs/running.md`, "Dispositions", the second-look paragraph, updated in this task's commit.

**Commit:** `redline: R7-5 read the shaper's second look and warn on a miss (#93)`

## Task 7: R7-6, a cut subject is recognised by its marker, not its length

`shape.md`, Decision 7 and Unattended answer 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/contract.md`

**Test first.** In `tests/loop-test.mjs`, right after the check that opens `check('subject: with no report, or one that does not open with the cut` (line 899), add the case below. The em dash is built with `String.fromCharCode(0x2014)`, never typed and never as a backslash-u escape in this file (`testing/tests.md:11`):

```js
  // A subject under 100 characters but over 100 bytes is cut by macOS's awk, which counts bytes,
  // and is still quoted whole (#94, R7-6): the workflow knows the cut by its marker, not its length.
  const dash = String.fromCharCode(0x2014)
  const wideWhole = `redline: R1-1 quote the whole subject when awk counts bytes ${dash} a dash ${dash} is three ${dash} of them (#93)`
  const wideCut = `redline: R1-1 quote the whole subject when awk counts bytes ${dash} a dash ${dash} is three ${dash} of them...`
  const wide = await go('subject: a subject cut in bytes', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[wideCut]], implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: wideWhole }] })
  check('subject: a subject under 100 characters that awk cut in bytes is quoted whole', wide.res.status === 'done' && wideWhole.length < 100 && replyFor(wide.calls, 'push and reply r1', 'R1-1').includes(`fixed in 1bbbbbb (${wideWhole})`) && comment(wide.calls, 'handoff comment').includes(`- 1bbbbbb ${wideWhole}`), [brief(wide), replyFor(wide.calls, 'push and reply r1', 'R1-1')])
```

`wideCut` is what the template's `cut_subjects` makes of `wideWhole` under `awk version 20200816` (95 characters, 101 bytes; `shape.md`, Decision 7). Red: the reply quotes `wideCut`.

**Change.** In `workflows/redline-loop.js`, replace `shownSubject` and its comment (lines 1312-1321) with:

```js
// What a reply and the handoff quote for a commit (#94, R6-5): its subject as written. A checks.sh
// of template v3 cuts a long subject for what the workflow matches (#68), so when git's subject was
// cut, the first line of the message the implementer reported for that commit is quoted, taken only
// when it is longer than the part the cut kept and opens with it. The cut is known by its "..."
// marker, never by the length: macOS's awk counts bytes, so a subject under 100 characters can be
// cut (#94, R7-6). message stays git's, and every match on a commit reads git's text.
function shownSubject(message, claimed) {
  const whole = claimed && typeof claimed.message === 'string' ? claimed.message.split('\n')[0].trim() : ''
  const kept = (message || '').lastIndexOf('...')
  return kept > 0 && whole.length > kept && whole.startsWith(message.slice(0, kept)) ? whole : message
}
```

In `docs/contract.md`, line 56, "subject line, cut at 100 characters" becomes "subject line, cut at 100 characters (bytes where awk counts bytes)"; line 75, after "A subject over 100 characters is cut at the last space at or before 100 and ends `...`," insert " counted in bytes where `awk` counts bytes, as macOS's does, so a subject with non-ASCII characters can be cut under 100 characters;".

Neighbours, green before and after: the three R6-5 subject checks (896-899), whose `otherText` case does not open with the kept part, and `round_sha: an older checks.sh lists every commit since the start` (881).

**Proof:** `grep -c 'whole.length > 100' workflows/redline-loop.js` prints `0`.

**Docs entries:**

- `workflows/redline-loop.js` — `docs/contract.md`, "Output contract", the git block's `commits` and the bullet on a commit's `message`, updated in this task's commit.

**Commit:** `redline: R7-6 know a cut subject by its marker, since macOS awk counts bytes (#93)`

## Task 8: R7-7, a decided rule-covered call's forced entry stands through a reshape

`shape.md`, Decision 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check `second look: a missing one and a refuted one declined as could not confirm each leave a warning, and a consistent one none` (Task 6), add:

```js
  // A reshape after autopilot settled the call keeps what Redline would have declined (#94, R7-7):
  // the reshape returns the rule-covered finding as an ask with no call, as it is told to, and the
  // forced entry the decided call rests on stands.
  run = await go('decline: under a repository rule, on autopilot, after a reshape', { ...baseArgs, askRules: rules, interrupt: 'autopilot' }, { ...ruled, planBounce: 1, reshapeAsk: ['R1-2'], reshapeOmitCall: ['R1-2'] })
  const reshapedHandoff = comment(run.calls, 'handoff comment') || ''
  check('decline: after a reshape returns it as an ask, a rule-covered decline on autopilot is still listed as what Redline would have declined', run.res.status === 'done' && labels(run.calls).includes('reshape r1 #1') && reshapedHandoff.includes('- **R1-2** title R1-2: left to @author under repository rule craft-config; Redline would have declined it: the handle is renamed on purpose.') && !reshapedHandoff.includes('open: By hand') && ((run.res.deferred || []).find((d) => d.id === 'R1-2') || {}).fullFix === 'Redline would have declined it: the handle is renamed on purpose.', [run.res.status, labels(run.calls), reshapedHandoff, run.res.deferred])
```

`rules` and `ruled` are the scenario of the R5-8 checks above it. Red: the handoff lists `open: By hand: ask R1-2 this way.`

**Change.** In `forceAskRules` (line 2865), replace

```js
    // A decline the rule overrides is recorded with what Redline would have done, for the
    // autopilot's Deferred entry, which has no change left open (#94, R5-8).
    record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation, ...(wouldDecline ? { declined: wouldDecline } : {}) }
```

with

```js
    // A decline the rule overrides is recorded with what Redline would have done, for the
    // autopilot's Deferred entry, which has no change left open (#94, R5-8). Once the finding's
    // call is decided, the entry it was decided on stands: a reshape returns the finding as an ask
    // with no call, and an entry rebuilt from that would drop what Redline would have declined
    // (#94, R7-7).
    if (!(decisions[f.id] && record.forced[f.id])) {
      record.forced[f.id] = { rule: rule.id, reason: rule.reason, recommendation: call.recommendation, ...(wouldDecline ? { declined: wouldDecline } : {}) }
    }
```

Neighbours, green before and after: the four R5-6 and R5-8 checks (2289-2301), and every check in the rules section (from 1200), whose first shape sets the entry with no decision yet.

**Proof:** `grep -c 'decisions\[f.id\] && record.forced\[f.id\]' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md` and the skill already say a rule-covered finding Redline would have declined is listed as such; the code now does so after a reshape too.

**Commit:** `redline: R7-7 keep a decided rule-covered call's forced entry through a reshape (#93)`

## Task 9: R7-8, the verdict call's structural override leaves its warning

`shape.md`, Decision 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check that opens `check('verdict: a verdict call that returns nothing stops at check, resumable from the check, never from the verdict'` (line 944), add:

```js
  // A verdict the checker misread as not JSON, though it is the gate's shape, is overridden and
  // read, and the override leaves its warning as the check call's does (#94, R7-8).
  const misread = await go('verdict: the verdict call misread as not JSON', baseArgs, { ...base, checker: onSpill((out) => ({ ...out, status: 'result_unreadable', reason: 'not_json' })) })
  check('verdict: a structural misread of the verdict is overridden with its own warning, and the verdict is read', misread.res.status === 'done' && misread.res.warnings.some((w) => w.startsWith('round 1 verdict: the checker said result_unreadable (not_json)')) && misread.res.warnings.includes(`round 1: ${warning}`), [brief(misread), misread.res.warnings])
```

Red: no `round 1 verdict:` warning.

**Change.** In `checker()` (line 2985), replace

```js
  const verdict = readStructure(asked).out
```

with

```js
  // A structural misread of the verdict is overridden as the check call's is, and says so (#94, R7-8).
  const readVerdict = readStructure(asked)
  if (readVerdict.warning) {
    warnings.push(`${prefix} verdict: ${readVerdict.warning}`)
  }
  const verdict = readVerdict.out
```

Neighbours, green before and after: `verdict: one warning names the spill and the verdict` (926), which counts the warnings that hold `--verdict` (the new one does not), and the override checks at 836-841.

**Proof:** `grep -c 'readVerdict.warning' workflows/redline-loop.js` prints `2`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/contract.md`, "Exit code", describes the verdict; the run's warnings are not documented line by line.

**Commit:** `redline: R7-8 record the verdict call's structural override as a warning (#93)`

## Task 10: R7-9, every implement attempt's reported commits are read

`shape.md`, Decision 10 and Unattended answer 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In `mock()`, the implementer's result (line 230) becomes:

   ```js
         // scenario.implementerCommits (#94, R6-5): the commits the implementer reports, by default none;
         // scenario.repairCommits (#94, R7-9): what a repair pass reports, by default none.
         const reported = typeof opts.label === 'string' && opts.label.startsWith('repair') ? scenario.repairCommits : scenario.implementerCommits
         return { commits: reported ? reported.slice() : [], checks: { ok: true, runs: 1 }, deviations: [], blocked: [] }
   ```

2. Right after the check that opens `check('round_sha: and they are checked: one without the redline: prefix still fails the resumed round'` (line 914), add:

   ```js
     // After a repair pass a commit the first attempt made is quoted whole too (#94, R7-9): the
     // workflow reads every attempt's report, not the last one's.
     const afterRepair = await go('subject: a long subject from the attempt before a repair', baseArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [[cutSubject], ['redline: R1-1 the repair']], implementerCommits: [{ sha: SHA(1), finding: 'R1-1', message: whole }], repairCommits: [{ sha: SHA(2), finding: 'R1-1', message: 'redline: R1-1 the repair' }], checker: (label, out) => (label === 'check r1' ? failing(out) : null) })
     check('subject: after a repair pass the first attempt\'s commit is quoted whole in the reply and the handoff', afterRepair.res.status === 'done' && labels(afterRepair.calls).includes('repair r1') && replyFor(afterRepair.calls, 'push and reply r1', 'R1-1').includes(`1bbbbbb (${whole})`) && comment(afterRepair.calls, 'handoff comment').includes(`- 1bbbbbb ${whole}`), [brief(afterRepair), replyFor(afterRepair.calls, 'push and reply r1', 'R1-1')])
   ```

   `whole`, `cutSubject` and `failing` are the R6-5 and round_sha constants above it in the same block. Red: the reply quotes `cutSubject`.

**Change.** In `revise()`, the implement loop (lines 3221-3233): right after `let implemented = null` add

```js
  // Every attempt's reported commits (#94, R7-9): a repair is a fresh implementer call that reports
  // only its own, and the round's commits include the attempt's before it.
  const reported = []
```

and right after the `if (implemented.blocked.length) { ... }` block inside the loop add `    reported.push(...implemented.commits)`. In the round's commits (line 3268), `implemented.commits.find(` becomes `reported.find(`.

Neighbours, green before and after: the three R6-5 subject checks (896-899), the checker repair checks (806-813), and the round_sha resume checks (905-914).

**Proof:** `grep -c 'reported.find(' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js` — no reader-facing change: `docs/running.md`, "Rounds" step 6 (`fixed in <sha> (...)`), already says a reply names each commit with its subject; the code now does so after a repair pass too.

**Commit:** `redline: R7-9 read every implement attempt's reported commits for the quoted subject (#93)`

## Task 11: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-7/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 961 checks passed, 0 failed; guard 596; prefs 121; gate 117; setup 506; gh 136; background 39.

10. **Docs.** Each entry above names its section or its reason: Task 2, `docs/running.md` ("Rounds" step 7 and "The handoff comment") and the skill; Task 3, `docs/running.md` itself; Task 4, the skill, and no `docs/` section for the result's fields; Task 5, comments and the skill; Task 6, `docs/running.md`, "Dispositions"; Task 7, `docs/contract.md`, "Output contract"; Tasks 8, 9 and 10, no reader-facing change with the reason given. No config key, subcommand, allow rule or exit code is added.
11. **Version.** Stays 0.3.0: the pull request already carries the minor bump; nothing this round changes what a setup rerun writes, and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 7 review lessons in the standards (#93)`. When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final `redline:` commit.
