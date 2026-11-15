# PR #94 review round 8: a collapse that names nothing, Redline's own files on autopilot, and three single-source refactors

Spec folder: `agent-os/specs/2026-11-15-0822-94-review-round-8/`

Shaped by Redline in unattended mode, for review round 8 of PR #94 (issue #93, with #68 on the same branch), from the round's seven findings (`redline/round-8-review.json`, `redline/round-8-findings.json`).

- `fix`, one task each, in finding order: R8-2 (Task 2), R8-4 (Task 3), R8-6 (Task 4), R8-1 (Task 5), R8-3 (Task 6), R8-5 (Task 7), R8-7 (Task 8).
- No `decline`, no `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Line numbers are at `754aa67`, the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/checks-template.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `scripts/redline-guard.sh`, `hooks/hooks.json`, `scripts/redline-gh.sh`, any agent file or anything under `templates/`. The version stays 0.3.0 (`shape.md`, Standards Applied, process/release).

Task order matters: every finding task changes `workflows/redline-loop.js`, and Tasks 2, 3, 4, 7 and 8 change `tests/loop-test.mjs`, in different places; each task's anchors are as the tasks before it leave them. Tasks 2 and 3 both change `docs/running.md`, on different lines.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-8/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes a loop check (2, 3, 4, 7, 8) makes the test change first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. Tasks 5 and 6 are refactors: the loop count does not move, and the green gate run is their evidence.

**Expected counts.** Before this round: loop `959 checks passed, 0 failed`, guard `596 passed, 0 mismatched`, prefs `121`, gate `117`, setup `506`, gh `136`, background `39` (round 7's As built). This round adds eight `check()` calls to the loop test (Task 2 three, Task 3 two, Tasks 4, 7 and 8 one each) and changes two (Task 2), plus the run-record check `go()` adds for each new run that reaches Finish (`tests/loop-test.mjs:293-299`): Task 2's new run, Task 3's and Task 8's, three. Task 4's run stops at a hand-off and Task 7's at an error, so neither adds one. So loop should read 970. The other harnesses keep their counts. If a count differs, the first green gate run's counts are the evidence, recorded under As built with the reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-15-0822-94-review-round-8/plan.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-8/shape.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-8/standards.md`
- `agent-os/specs/2026-11-15-0822-94-review-round-8/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 8 spec for PR #94 (#93)`

## Task 2: R8-2, a collapse whose ref names nothing is kept as an unconfirmed finding

`shape.md`, Decision 1 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, in the scenario that opens `run = await go('coverage: a duplicate\'s target by the form of its ref'` (line 2012):

1. Give that run's scenario two declines with a second look, so the two candidates it now keeps as findings end the run in round 1. Replace

   ```js
   run = await go('coverage: a duplicate\'s target by the form of its ref', covArgs, { reviews: [[]], coverage: [forms], coverageOut: [formsOut] })
   ```

   with

   ```js
   run = await go('coverage: a duplicate\'s target by the form of its ref', covArgs, { reviews: [[]], decline: ['R1-1', 'R1-2'], secondLook: { 'R1-1': 'unconfirmed', 'R1-2': 'unconfirmed' }, coverage: [forms], coverageOut: [formsOut] })
   ```

2. Replace the two checks that open `check('coverage: a duplicate ref naming the candidate itself is shown as written` (line 2016) and `check('coverage: a duplicate ref past the round\'s last candidate is shown as written` (line 2017) with

   ```js
     // A ref naming the candidate itself, or an index past the round's last, names nothing it
     // collapses into, so the candidate is kept as an unconfirmed finding with a warning (#94, R8-2).
     check('coverage: a duplicate ref naming the candidate itself names nothing it collapses into, so the candidate is kept as an unconfirmed finding with a warning', fb.includes('\n- **R1-1** · correctness · medium · unconfirmed · `app/z.php:8` · a ref naming itself\n') && !fb.includes('· duplicate: 4\n') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 4 as duplicate with ref "4", which names nothing it collapses into; kept as an unconfirmed finding as reported'), [fb, run.res.warnings])
     check('coverage: a duplicate ref past the round\'s last candidate names nothing it collapses into, so the candidate is kept as an unconfirmed finding with a warning', fb.includes('\n- **R1-2** · correctness · medium · unconfirmed · `app/z.php:9` · a ref past the last candidate\n') && !fb.includes('· duplicate: 99\n') && run.res.warnings.includes('round 1: the reviewer accounted for coverage candidate 5 as duplicate with ref "99", which names nothing it collapses into; kept as an unconfirmed finding as reported'), [fb, run.res.warnings])
   ```

3. Right after the check that opens `check('coverage: a duplicate of a candidate that became a finding names the finding\'s id` (line 2029), add

   ```js

     // A collapse names what it collapses into (#94, R8-2): two duplicates naming each other, a
     // duplicate of an id no finding has and a settled ref naming no earlier finding each name
     // nothing, so each candidate is kept as an unconfirmed finding with a warning; a duplicate ref
     // in words names something and stays as written in the block, with no warning.
     const nameless = fenced([cand('app/q.php', 1, 'a pair, one way'), cand('app/q.php', 2, 'a pair, the other way'), cand('app/q.php', 3, 'a duplicate of a finding no round has'), cand('app/q.php', 4, 'settled into a finding no round has'), cand('app/q.php', 5, 'a duplicate in words')])
     const namelessOut = [
       { index: 1, outcome: 'duplicate', ref: '2' },
       { index: 2, outcome: 'duplicate', ref: 'candidate 1' },
       { index: 3, outcome: 'duplicate', ref: 'R1-9' },
       { index: 4, outcome: 'settled', ref: 'R1-8 was decided' },
       { index: 5, outcome: 'duplicate', ref: 'the same cause as the owner check' },
     ]
     run = await go('coverage: a collapse whose ref names nothing', covArgs, { reviews: [[]], decline: ['R1-1', 'R1-2', 'R1-3', 'R1-4'], secondLook: { 'R1-1': 'unconfirmed', 'R1-2': 'unconfirmed', 'R1-3': 'unconfirmed', 'R1-4': 'unconfirmed' }, coverage: [nameless], coverageOut: [namelessOut] })
     const nb = body(run.calls, 'post r1')
     const namesNothing = (index, outcome, ref) => run.res.warnings.includes(`round 1: the reviewer accounted for coverage candidate ${index} as ${outcome} with ref ${JSON.stringify(ref)}, which names nothing it collapses into; kept as an unconfirmed finding as reported`)
     check('coverage: two duplicates that name each other name nothing, so each is kept as an unconfirmed finding with a warning', nb.includes('\n- **R1-1** · correctness · medium · unconfirmed · `app/q.php:1` · a pair, one way\n') && nb.includes('\n- **R1-2** · correctness · medium · unconfirmed · `app/q.php:2` · a pair, the other way\n') && namesNothing(1, 'duplicate', '2') && namesNothing(2, 'duplicate', 'candidate 1'), [nb, run.res.warnings])
     check('coverage: a duplicate of an id no finding has, and a settled ref whose id no earlier finding has, are each kept as an unconfirmed finding with a warning', nb.includes('\n- **R1-3** · correctness · medium · unconfirmed · `app/q.php:3` · a duplicate of a finding no round has\n') && nb.includes('\n- **R1-4** · correctness · medium · unconfirmed · `app/q.php:4` · settled into a finding no round has\n') && namesNothing(3, 'duplicate', 'R1-9') && namesNothing(4, 'settled', 'R1-8 was decided'), [nb, run.res.warnings])
     check('coverage: a duplicate ref in words names something, so it stays as written in the block, with no warning', nb.includes('### Candidates set aside (1)') && nb.includes('\n- `app/q.php:5` · a duplicate in words · duplicate: the same cause as the owner check\n') && !run.res.warnings.some((w) => w.includes('coverage candidate 5')), [nb, run.res.warnings])
   ```

   The comment above the `forms` scenario (it ends at line 2001, "one check each for the `\b` and the `\s+` (#86, R5-2).") gains a last line: "A ref naming the candidate itself or an index past the last candidate names nothing, so its candidate is kept as an unconfirmed finding (#94, R8-2)."

Red: the five checks fail (both forms candidates are still in the block, and none of the new scenario's four candidates is minted).

**Every other collapse ref in the loop test names something,** traced at `754aa67`, so no other check moves: the duplicates `R1-1`, `3` and `candidate 2` (1845-1847) and `index 1`, `CANDIDATE 1`, `1; #7 tracks the case-folding` (2004, 2005, 2008) name a candidate or a finding of the round, `1st pass missed it` and `candidate1` (2009, 2010) are refs in words, and `1` (2027) names candidate 1; every `settled` ref (1551, 1585, 1592, 1608, 1631, 1635, 1654, 1703, 1708, 1728, 1767, 1820, 1883, 2420-2455, 2521) opens with an id of an earlier round of its run or of its `priorFindings`. If one goes red, it is a case this trace missed: record it under Decisions in `shape.md` as a deviation, with the ref and why it names nothing.

**Change.** In `workflows/redline-loop.js`, in `accountCoverage`:

1. The function's comment (lines 1562-1568) gains after "(#80, R1-4)," the words "or collapsed with a ref that names nothing it collapses into (#94, R8-2),".
2. Right after the accounting loop closes, that is after

   ```js
       seen.set(index, { index, outcome: entry.outcome, ref })
     }
   ```

   (lines 1626-1627) and before the line that opens `let next = Math.max(0,` (line 1628), add

   ```js
     // A collapse names what it collapses into (#94, R8-2). A duplicate whose ref opens with an index
     // (`3`, `candidate 3`, `index 3`, as the set-aside block reads it) names another candidate of the
     // round, and one whose duplicates do not lead back to it; a duplicate or settled ref that opens
     // with an id names a finding of this round, of an earlier round of this run or of an earlier run
     // on the PR. One that names nothing is a bad ref: the candidate is kept as an unconfirmed finding
     // with a warning, as a verified ref naming no finding is. A ref that opens with neither, a note
     // in words, names something and is shown as written in the set-aside block (#86, R4-1, R5-2).
     const named = new Set([...byId.keys(), ...Object.keys(priorById), ...rounds.flatMap((r) => (r.findings || []).map((x) => x.id))])
     const targetOf = (e) => (e.outcome === 'duplicate' ? Number((/^(?:(?:candidate|index)\s+)?(\d+)\b/i.exec(e.ref) || [])[1]) || 0 : 0)
     const namesNothing = (e) => {
       if (e.outcome !== 'duplicate' && e.outcome !== 'settled') {
         return false
       }
       const to = targetOf(e)
       if (!to) {
         const id = (/^([RH]\d+-\d+)(?![\w-])/.exec(e.ref) || [])[1] || ''
         return id !== '' && !named.has(id)
       }
       const visited = new Set([e.index])
       for (let at = to; ; at = targetOf(seen.get(at))) {
         if (at < 1 || at > candidates.length || visited.has(at)) {
           return true
         }
         if (!seen.has(at) || !targetOf(seen.get(at))) {
           return false
         }
         visited.add(at)
       }
     }
     for (const e of [...seen.values()].filter(namesNothing)) {
       warnings.push(`round ${round}: the reviewer accounted for coverage candidate ${e.index} as ${e.outcome} with ref ${JSON.stringify(e.ref)}, which names nothing it collapses into; kept as an unconfirmed finding as reported`)
       seen.delete(e.index)
       told.add(e.index)
     }
   ```

   The filter runs over every entry before any is taken out, so both of a mutual pair are found. A candidate a duplicate leads to that is not in `seen` (left out, or with a bad entry) is minted as a finding below, so the duplicate collapses into that finding and names something. `rounds` and `priorById` are module-level, and `rounds` holds this run's earlier rounds while a round is reviewed.

In `docs/running.md`, "The coverage pass", the paragraph that opens `**Nothing leaves quietly.**` (line 69): replace "or accounted for with a ref that names no finding of the round, becomes a finding of the round as reported" with

```
accounted for with a ref that names no finding of the round, or collapsed with a ref that names nothing it collapses into (a `duplicate` of itself, of an index past the round's last candidate, or of a duplicate that leads back to it, or a `duplicate` or `settled` ref whose leading id no finding of the round, of the run or of the PR's earlier runs has; #94, R8-2), becomes a finding of the round as reported
```

and add, after the sentence "A ref that opens with a finding's id and adds a note after it names that finding, with a warning.", the sentence "A collapse whose ref opens with neither an index nor an id, a note in words, names something and is shown as written in the set-aside block."

**Proof:** `grep -c "which names nothing it collapses into" workflows/redline-loop.js` prints `1`; `grep -c "names nothing it collapses into" docs/running.md` prints `1`.

**Docs entry:** `workflows/redline-loop.js` is described in `docs/running.md`, "The coverage pass", the "Nothing leaves quietly" paragraph, updated in this commit.

**Commit:** `redline: R8-2 keep a collapse whose ref names nothing as an unconfirmed finding (#93)`

## Task 3: R8-4, a finding on Redline's own files is left to the person on autopilot, as a rule-covered one is

`shape.md`, Decision 2 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `skills/redline/SKILL.md`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, right after the `for (const reason of [...])` loop whose check opens `` check(`ask: "${reason}" is a reason the person is asked for, and the run stops for them` `` (lines 2297-2300), add

```js

  // A finding on one of Redline's own files is the person's on every dial, as a rule-covered one is
  // (#94, R8-4): on autopilot it is left to them and never decided, its reply opens "left to", it is
  // listed under Deferred with no mitigation and under Left to, and the resolve agent is told no task
  // writes anything for it.
  const ownFile = await go('ask: redline\'s own file, on autopilot', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness', { file: '.claude/redline.json', line: 3 })], []], ask: ['R1-2'], whyHuman: { 'R1-2': 'redline\'s own file' }, commitIds: [['R1-1']] })
  const ownHandoff = comment(ownFile.calls, 'handoff comment') || ''
  const ownReply = replyFor(ownFile.calls, 'push and reply r1', 'R1-2') || ''
  check('ask: on autopilot a finding on Redline\'s own files is left to the person, never decided: its reply opens "left to", and it is listed under Deferred with no mitigation and under Left to', ownFile.res.status === 'done' && ownReply.startsWith('Redline round 1: left to @author under the rule on Redline\'s own files (no Redline role may write them).') && ownReply.endsWith(' · decided by: redline (autopilot)') && ownHandoff.includes('- **R1-2** title R1-2: left to @author under the rule on Redline\'s own files; open: Keep it') && ownHandoff.includes('### Left to @author (Redline\'s own files)') && !ownHandoff.includes('Autopilot took the shaper\'s recommendation: Keep it'), [ownFile.res.status, ownReply, ownHandoff])
  check('ask: the result names a finding on Redline\'s own files as left to the person, and the resolve agent is told no task writes anything for it', JSON.stringify((ownFile.res.forced || []).map((x) => [x.id, x.own === true])) === '[["R1-2",true]]' && ((ownFile.res.deferred || []).find((d) => d.id === 'R1-2') || {}).mitigation === 'none (the rule on Redline\'s own files)' && (pick(ownFile.calls, 'resolve r1') || { prompt: '' }).prompt.includes('A decision carrying `own` is on a finding on one of Redline\'s own files'), [ownFile.res.forced, ownFile.res.deferred])
```

Red: both checks fail (autopilot decides R1-2 with the shaper's recommendation, and the result's `forced` is empty).

**Change.** In `workflows/redline-loop.js`:

1. Right before the comment that opens `// The sixth, "redline's own file", is no case of judgment:` (line 350), add

   ```js
   // A finding on one of Redline's own files (#94, R8-4): the why_human its call gives, and the reason
   // its forced entry records. forceAskRules records it as it records a finding a repository ask rule
   // covers, so it is left to the person on every dial: on autopilot it is never decided, it is
   // listed under Deferred with no mitigation, its thread stays open, and Redline makes no change.
   const OWN_FILE = "redline's own file"
   const OWN_FILE_REASON = 'no Redline role may write them'
   // What a finding left to the person is left under: its repository rule, or Redline's own files.
   const leftUnder = (forced) => (forced.own ? "the rule on Redline's own files" : `repository rule ${forced.rule}`)
   ```

   and in `ROUND_WHY` (line 353) replace the last element `"redline's own file"` with `OWN_FILE`.

2. `leftDecision` (lines 1196-1207): the comment above it reads

   ```js
   // autopilot on a finding a repository ask rule covers (#49), or one on Redline's own files (#94,
   // R8-4): nothing is applied; the finding is left to the person, with the rule as the reason.
   ```

   its `notes` line becomes

   ```js
       notes: `${forced.own ? "Redline's own files" : `Repository rule ${forced.rule}`}: ${forced.reason}. No change made; ${human ? 'the person' : personLabel} makes it.`,
   ```

   and after `rule: forced.rule,` add `...(forced.own ? { own: true } : {}),`.

3. `replyBody`'s `case 'left':` (line 1350): replace `under repository rule ${outcome.rule} (${outcome.reason})` with `under ${leftUnder(outcome)} (${outcome.reason})`.

4. `resolvePrompt`: right after the `...(askRules.length ? [...] : []),` element that holds "A decision carrying \`rule\`" (lines 1777-1779), add

   ```js
       ...(Object.values(callDecisions).some((d) => d && d.own)
         ? [`- A decision carrying \`own\` is on a finding on one of Redline's own files, which no Redline role may write, left to the person the same way (#94, R8-4): whatever its choice, no task writes anything. Its plan task becomes "Left to the person: <id> (Redline's own files)" with no files, or "Accepted, no change: <id>" when the choice is to accept; its Decisions entry records the choice and the notes with its owner; and the finding goes under Deferred in shape.md with the mitigation "none (the rule on Redline's own files)" and the shaper's recommendation as the full fix.`]
         : []),
   ```

   The sentence is added only when a decision carries `own`, so every other resolve prompt is byte for byte as it was.

5. `result()`'s `forced:` list (line 2309): after `rule: x.rule,` add `...(x.own ? { own: true } : {}),`, so a rule's entry keeps its shape.

6. `outcomesFor`'s `left` outcome (line 2635): after `kind: 'left', rule: left.rule,` add `...(left.own ? { own: true } : {}),`.

7. `describeOutcome`'s `case 'left':` (line 2668): replace `under repository rule ${outcome.rule}:` with `under ${leftUnder(outcome)}:`.

8. `forceAskRules`, inside the block that opens `if (!rule) {` (line 2857), right before its `continue`, add

   ```js
         // A finding on one of Redline's own files (#94, R8-4) is recorded as a rule-covered one is,
         // so it is left to the person on every dial. The entry its call was decided on stands, as a
         // rule's does (#94, R7-7); one a reshape no longer asks about this way is dropped while undecided.
         const ownCall = !pass.human && s.disposition === 'ask' ? shaped.judgmentCalls.find((c) => c.id === f.id && c.why_human === OWN_FILE) : null
         if (ownCall && !(decisions[f.id] && record.forced[f.id])) {
           record.forced[f.id] = { rule: OWN_FILE, own: true, reason: OWN_FILE_REASON, recommendation: ownCall.recommendation }
         } else if (!ownCall && !decisions[f.id] && record.forced[f.id] && record.forced[f.id].own) {
           delete record.forced[f.id]
         }
   ```

   The function's comment (lines 2834-2841, opening "The forcing point (#49)") gains: "A finding on one of Redline's own files, a Redline round's ask whose call gives `redline's own file`, is recorded the same way, marked `own` (#94, R8-4)."

9. `settle()`'s log (line 3085): replace `(repository rule ${forced.rule})` with `(${leftUnder(forced)})`.

10. `resolveWith` (lines 3115-3118): in the warning replace `under repository rule ${forced.rule};` with `under ${leftUnder(forced)};`, and after `decision.rule = forced.rule` add `if (forced.own) { decision.own = true }`, written on three lines in the file's style.

11. The autopilot Deferred loop: its comment (lines 3331-3332) gains "or one on Redline's own files (#94, R8-4)" after "a finding a repository ask rule covers"; in its `deferredAll.push` (line 3339) the `mitigation` value `none (repository rule ${forced.rule})` becomes `none (${leftUnder(forced)})`, and after `rule: forced.rule,` add `...(forced.own ? { own: true } : {}),`.

12. The handoff's Deferred line (line 3501): replace `left to ${personLabel} under repository rule ${d.rule};` with `left to ${personLabel} under ${leftUnder(d)};`.

13. The handoff's Left-to heading (lines 3504-3507): replace

    ```js
      if (left.length) {
        lines.push('', `### Left to ${personLabel} (repository rules)`, '', ...left)
      }
    ```

    with

    ```js
      if (left.length) {
        // The heading names what the findings are left under: repository rules, Redline's own files
        // (#94, R8-4), or both.
        const under = unique(rounds.flatMap((record) => Object.values(record.forced || {}).map((x) => (x.own ? "Redline's own files" : 'repository rules'))))
        lines.push('', `### Left to ${personLabel} (${under.join(' and ')})`, '', ...left)
      }
    ```

14. `leftToYou` (lines 3539-3548): its comment gains "or on Redline's own files (#94, R8-4)" after "under a repository ask rule (#49)"; the fallback outcome `left to ${personLabel} under repository rule ${forced.rule}` becomes `left to ${personLabel} under ${leftUnder(forced)}`; and the pushed line becomes

    ```js
          lines.push(`- **${id}** ${f ? postedText(f.title) : ''}: ${forced.own ? "Redline's own files" : `rule ${forced.rule}`} (${forced.reason}); ${outcome}`)
    ```

15. The thread sweep's two reasons (lines 3690 and 3712): the `left` branch, `` `repository rule ${((record.forced || {})[f.id] || {}).rule}` ``, becomes `leftUnder((record.forced || {})[f.id] || {})`, and the same at 3712 with `newId` in place of `f.id`. For a rule's entry the text is as it was.

`humanSummary` (line 3581) is unchanged: a human pass records no own-file entry (step 8's `!pass.human`).

In `skills/redline/SKILL.md`:

- Line 184 (the plan dial's "answer an ask"): after "(`forced.rule`, `forced.reason`)" insert ", or, when `forced.own` is true, one on Redline's own files, which no Redline role may write".
- Line 204: replace "(its `why_human` reads `repository rule <id>`) is a finding the repository's ask rules leave to the person: say which rule and quote its reason (`forced.reason`)," with "(its `why_human` reads `repository rule <id>`, or `redline's own file` when `forced.own` is true) is a finding the repository's ask rules, or Redline's own files, leave to the person: say which rule and quote its reason (`forced.reason`), or say that no Redline role may write Redline's own files," and at the end of the paragraph replace "as `left to @<login> under repository rule <id>`." with "as `left to @<login> under repository rule <id>` (`left to @<login> under the rule on Redline's own files` for one with `forced.own`)."
- Line 242 (`done`): replace "Then the findings left to the person under a repository ask rule (`forced`: each with its rule id; their threads stay open)" with "Then the findings left to the person under a repository ask rule or on Redline's own files (`forced`: each with its rule id, or `own` true; their threads stay open)", and "An item with `rule` was left to the person on autopilot under that repository ask rule:" with "An item with `rule` was left to the person on autopilot under that repository ask rule, or, with `own`, as one on Redline's own files:".

In `docs/running.md`:

- "Dispositions", the **Left to you** bullet (line 92): after "is put to you the same way, since no Redline role may write them." add " Its reply reads `left to @<login> under the rule on Redline's own files`, its thread stays open whatever you answer, and on autopilot it is listed under Deferred with no mitigation (#94, R8-4)."
- "The handoff comment" (line 154): replace "and `### Left to @<login> (repository rules)`." with "and `### Left to @<login> (repository rules)`, which reads `(Redline's own files)`, or `(repository rules and Redline's own files)`, when it lists findings on Redline's own files."

**Proof:** `grep -c "leftUnder(" workflows/redline-loop.js` prints `9` (its nine uses; the definition reads `leftUnder = (forced)`); `grep -c "under repository rule" workflows/redline-loop.js` prints `1` (`humanSummary`'s, a human pass's line).

**Docs entries:** `workflows/redline-loop.js` is described in `docs/running.md`, "Dispositions" (the Left to you bullet) and "The handoff comment" (the Left-to heading), both updated in this commit; `skills/redline/SKILL.md` is itself the text the person meets (its `handoff` sections and `done` summary), updated in this commit.

**Commit:** `redline: R8-4 leave a finding on the Redline files to the person on autopilot, as a rule-covered one (#93)`

## Task 4: R8-6, a decided call's finding is never handed back as a Redline decline

`shape.md`, Decision 3.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after the check that opens `check('overrule: a reshape\'s decisions stop lists no declines and names them for after the run'` (line 2546), add

```js
  // A finding whose call the person already answered is theirs, whatever a reshape sorts it as: a
  // reshape that returns it as a decline and raises a new call never hands it back as Redline's
  // decline to overrule after the run (#94, R8-6).
  const decidedLate = await go('overrule: a reshape declines a decided call\'s finding and raises a new call', { ...baseArgs, decisions: { 'R1-2': { choice: 'Keep it', notes: 'The author keeps it as it is.', date: '2026-11-02' } } }, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], ask: ['R1-2'], planBounce: 1, reshapeDecline: ['R1-2'], reshapeAsk: ['R1-1'], commitIds: [['R1-1']] })
  check('overrule: a finding whose call was decided is never listed as Redline\'s decline at a reshape\'s stop', decidedLate.res.status === 'handoff' && decidedLate.res.handoffKind === 'decisions' && JSON.stringify(decidedLate.res.decisionsNeeded) === '["R1-1"]' && JSON.stringify(decidedLate.res.declined) === '[]' && JSON.stringify(decidedLate.res.declinedAfterRun) === '[]', [decidedLate.res.status, decidedLate.res.handoffKind, decidedLate.res.decisionsNeeded, decidedLate.res.declined, decidedLate.res.declinedAfterRun])
```

Red: `declinedAfterRun` is `["R1-2"]`.

**Change.** In `workflows/redline-loop.js`, `handoffResult` (line 3881): in `const roundDeclines = ...` replace `!(decisions[x.id] && decisions[x.id].disposition)` with `!decisions[x.id]`. In the comment below it (lines 3887-3890), replace "A decline the person already overruled is left out: the overrule is in the decisions the relaunch carries, and it is applied there (#94, R2-15)." with "A finding the person or autopilot decided is left out: an overrule is in the decisions the relaunch carries and is applied there (#94, R2-15), and an answered call is the person's decision, posted as theirs, whatever disposition a reshape gave its finding (#94, R8-6)."

**Proof:** `grep -c "decisions\[x.id\].disposition" workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, "Overruling a decline", already describes the stop's list as Redline's own declines, which this makes true.

**Commit:** `redline: R8-6 never hand back a decided call's finding as a Redline decline (#93)`

## Task 5: R8-1, the scope a workflow decline names comes from one helper

`shape.md`, Decision 4. A small refactor: no posted or logged text changes, and no check is added or changed.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`:

1. Lines 342-348, from the comment `// What became of a finding the workflow declined under a correctness-only scope (#93).` through the line `const scopeName = ...`, are replaced with the block below, placed right above the two-line comment that opens `// The outcomes that settle a finding's thread once its reply is posted` (lines 340-341), so that comment sits right above `SETTLED_KINDS` again:

   ```js
   // The scope a workflow decline names (#94, R7-10, R8-1): a final nit pass's own, else the run's.
   const scopeName = (nitPass) => (nitPass ? 'the final nit pass\'s scope' : 'this run\'s scope')
   // What became of a finding the workflow declined under a correctness-only scope (#93), or of a nit
   // a final nit pass's reviewer reported though the pass reports correctness only (#94, R7-10): the
   // workflow declines it under that scope, never drops it.
   const declinedUnder = (nitPass) => `declined: outside ${scopeName(nitPass)} (correctness only) · decided by: redline`
   ```

2. `reviewBody` (lines 1003 and 1021): `scopeName(reviewed)` becomes `scopeName(reviewed === 'final-nit-pass')`, twice.
3. The handoff (line 3497): `scopeName(scope === 'correctness' ? 'pr' : 'final-nit-pass')` becomes `scopeName(scope !== 'correctness')`.
4. The human pass's final nit pass: in the log line (line 3967) replace `declined under the final nit pass's scope` with `declined under ${scopeName(true)}`, inside the same template literal, and in its round record (line 3971) `NIT_PASS_DECLINED` becomes `declinedUnder(true)`.
5. The main loop: the log line (line 4046) `scopeName(reviewed)` becomes `scopeName(reviewed === 'final-nit-pass')`, and in the round record (line 4055) `reviewed === 'final-nit-pass' ? NIT_PASS_DECLINED : SCOPE_DECLINED` becomes `declinedUnder(reviewed === 'final-nit-pass')`.

Every string these build is the one the replaced code built, so the scope checks (the `scope:` section and `human: a nit the final nit pass reports`) stay green as they are.

**Proof:** `grep -cE "SCOPE_DECLINED|NIT_PASS_DECLINED" workflows/redline-loop.js` prints `0`; `grep -c "declinedUnder(" workflows/redline-loop.js` prints `2` (the two round records; the definition reads `declinedUnder = (nitPass)`); the gate's loop count is unchanged from Task 4's green run.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the posted and logged text is unchanged.

**Commit:** `redline: R8-1 build the scope decline from one helper (#93)`

## Task 6: R8-3, one helper gives the round's next finding number

`shape.md`, Decision 5. A small refactor: behaviour unchanged, and no check is added or changed.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`:

1. Right before the comment block that opens `// The accounting for the coverage pass's candidates (#79, the mirror of reconcilePrior; #93)` (line 1562), add

   ```js
   // The highest finding number of the round's form in use (#94, R4-6, R8-3). review() renames every
   // id outside the form before reconcilePrior and accountCoverage run, and every path that gives an
   // id numbers after this one, so no two findings of a round share an id.
   function lastFindingNumber(round, findings) {
     const idForm = new RegExp(`^R${round}-\\d+$`)
     return Math.max(0, ...findings.filter((f) => idForm.test(String(f.id))).map((f) => Number(String(f.id).split('-')[1]) || 0))
   }
   ```

2. `accountCoverage` (line 1628 at `754aa67`, below Task 2's new block): `let next = Math.max(0, ...out.findings.map((x) => Number(String(x.id).split('-')[1]) || 0))` becomes `let next = lastFindingNumber(round, out.findings)`.
3. `review()` (line 2385): `let nextId = Math.max(0, ...out.findings.filter((f) => idForm.test(f.id)).map((f) => Number(f.id.split('-')[1]) || 0))` becomes `let nextId = lastFindingNumber(round, out.findings)`. The `idForm` on the line before stays: the rename loop below it reads it. In the comment above (lines 2380-2383) replace "as reconcilePrior and accountCoverage number theirs" with "by lastFindingNumber, as reconcilePrior and accountCoverage number theirs".
4. `reconcilePrior` (line 2539): `let next = Math.max(0, ...out.findings.map((x) => Number(x.id.split('-')[1]) || 0))` becomes `let next = lastFindingNumber(round, out.findings)`.

**Proof:** `grep -c "lastFindingNumber(round, out.findings)" workflows/redline-loop.js` prints `3`; `grep -cF "Math.max(0, ...out.findings" workflows/redline-loop.js` prints `0`; the gate's loop count is unchanged from Task 5's green run (the id checks of #46, R1-3, and #94, R4-6 and R5-5, pin the numbering).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; ids are numbered as before.

**Commit:** `redline: R8-3 number every minted id from one helper (#93)`

## Task 7: R8-5, the shape and every reshape are vetted by one function

`shape.md`, Decision 6 and Unattended answer 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the shaper mock, the `ids` line (line 166): after `.filter((id) => !(scenario.shaperDrop || []).includes(id))` add `.filter((id) => !(typeof opts.label === 'string' && opts.label.startsWith('reshape') && (scenario.reshapeDrop || []).includes(id)))`, and the comment above it (line 165) gains: "scenario.reshapeDrop (#94, R8-5): the ids a reshape alone leaves out, a shape-stage error since the reshape is vetted as the shape is."
2. Right after the check that opens `check('reshape: a new call for a finding sorted fix still stops at shape'` (line 1515), add

   ```js
     // The reshape is vetted as the first shape is (#94, R8-5): one that leaves a finding out stops at
     // shape, naming the reshape as the step to resume.
     const reshapeDropped = await go('reshape: a finding left out', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, reshapeDrop: ['R1-2'], commitIds: [['R1-1', 'R1-2']] })
     check('reshape: a reshape that leaves a finding out stops at shape, as the first shape does', reshapeDropped.res.status === 'error' && reshapeDropped.res.stage === 'shape' && reshapeDropped.res.error === 'the shaper gave no disposition for R1-2' && JSON.stringify(reshapeDropped.res.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [reshapeDropped.res.status, reshapeDropped.res.stage, reshapeDropped.res.error, reshapeDropped.res.resumeFrom])
   ```

   The `resumeFrom` shape is the one the neighbouring reshape checks pin (line 1513).

Red: the run finishes (`done`), since the reshape does not check for a missing disposition.

**Change.** In `workflows/redline-loop.js`:

1. Right before the comment that opens `// One revise pass for a round: Shape, hand-off, Resolve, Approve, Implement, Check, Push and reply.` (line 3037), add

   ```js
   // The checks on the shaper's output, after the shape and after each reshape, in one order (#94,
   // R8-5): the spec folder it reports, a disposition for every finding (the reshape prompt asks for
   // every finding, as the shape prompt does), then the seven checks, forceAskRules among them, and
   // the round's dispositions. `known` is the round's calls so far, [] on the shape; `label` names
   // the shaper call for the checks that stop on it, and `suffix` its spec-status call.
   async function vetShape(pass, record, inScope, shaped, known, label, suffix) {
     if (shaped.specFolder.replace(/\/+$/, '') !== record.specFolder) {
       warnings.push(`${pass.name}: shaper reported spec folder ${shaped.specFolder}, expected ${record.specFolder}`)
     }
     const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
     if (unsorted.length) {
       throw stageError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`)
     }
     checkDispositions(pass, shaped)
     checkSecondLook(pass, shaped, inScope)
     checkCalls(shaped, known)
     await checkSpec(pass, record.specFolder, label, suffix)
     forceAskRules(record, pass, inScope, shaped)
     checkDeclineReasons(shaped, label)
     checkWhy(pass, shaped, known, label)
     record.dispositions = shaped.findings
   }
   ```

2. In `revise()`, replace lines 3046-3060, from `if (shaped.specFolder.replace(/\/+$/, '') !== specFolder) {` through `record.dispositions = shaped.findings`, with

   ```js
     await vetShape(pass, record, inScope, shaped, [], `shape ${pass.tag}`, '')
   ```

3. In the reshape loop, replace lines 3188-3195, from `checkDispositions(pass, shaped)` through `record.dispositions = shaped.findings`, with

   ```js
       await vetShape(pass, record, inScope, shaped, calls, `reshape ${pass.tag} #${adjustment + 1}`, ` #${adjustment + 1}`)
   ```

`record.specFolder` is the `specFolder` `revise()` reads it into (line 3039), and `checkCalls(shaped)` on the shape was `checkCalls(shaped, [])` by its default, so the shape's checks run as before. The missing-disposition stop takes `stageError`'s default label, the last agent run, which on a reshape is the reshape itself.

**Proof:** `grep -c "await vetShape(" workflows/redline-loop.js` prints `2`; `grep -c "checkDeclineReasons(shaped, label)" workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the reshape now keeps the stop the shape already had, and no doc lists the shape stage's stops one by one.

**Commit:** `redline: R8-5 vet the shape and every reshape in one function (#93)`

## Task 8: R8-7, the review dial says none was picked only when findings were dropped

`shape.md`, Decision 7.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in section 4 (the review dial), right after the check that opens `check('review: nothing selected replies and finishes without a revise pass'` (line 441), add

```js
  // A round with no finding to pick is not one whose findings were all dropped (#94, R8-7): the
  // handoff opens with the generic ending and the note says there was nothing to pick, while a round
  // whose findings were all dropped still says none was picked.
  const nothingToPick = await go('review: a round with no finding to pick', { ...reviewArgs, selected: { act: [], dropped: {} } }, { reviews: [[]] })
  const nothingHandoff = comment(nothingToPick.calls, 'handoff comment') || ''
  check('review: a round with no finding to pick opens the handoff with the generic ending, and one whose findings were all dropped says none was picked', nothingToPick.res.status === 'done' && nothingHandoff.includes('Redline ran 1 review round; the last one verified no new correctness item to fix or ask about.') && !nothingHandoff.includes('none of its findings was picked') && nothingToPick.res.note === 'The round had no finding to pick, so there was no revise pass.' && (comment(none.calls, 'handoff comment') || '').includes('Redline ran 1 review round; none of its findings was picked to act on.') && none.res.note === 'No finding was selected to act on, so there was no revise pass.', [nothingToPick.res.status, nothingToPick.res.note, nothingHandoff])
```

Red: the new run's handoff says none was picked, and its note is the dropped one.

**Change.** In `workflows/redline-loop.js`, the review dial's `if (active.length === 0) {` block (lines 4080-4084): replace

```js
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment({ notPicked: true }, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: 'No finding was selected to act on, so there was no revise pass.' })
```

with

```js
        // "None was picked" only when findings were dropped: a round with nothing to pick has the
        // generic ending, as before #93 (#94, R8-7).
        const notPicked = record.dropped.length > 0
        const finished = await finish('handoff', record, (prBody, threads) => handoffComment({ notPicked }, prBody, threads))
        return result('done', { handoffPosted: finished.posted, reviewRequested: finished.reviewRequested, prBody: finished.prBody, note: notPicked ? 'No finding was selected to act on, so there was no revise pass.' : 'The round had no finding to pick, so there was no revise pass.' })
```

**Proof:** `grep -c "notPicked: true" workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; the opening is the one the handoff already uses when nothing new was verified, and no doc states the review dial's opening.

**Commit:** `redline: R8-7 open the handoff with the generic ending when the round had nothing to pick (#93)`

## Task 9: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-15-0822-94-review-round-8/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 970 checks passed, 0 failed; guard 596; prefs 121; gate 117; setup 506; gh 136; background 39.

10. **Docs.** Each entry above names its section or its reason: Task 2, `docs/running.md`, "The coverage pass"; Task 3, `docs/running.md`, "Dispositions" and "The handoff comment", and the skill itself; Tasks 4 to 8, no reader-facing change with the reason given. No config key, subcommand, allow rule or exit code is added.
11. **Version.** Stays 0.3.0: the pull request already carries the minor bump; nothing this round changes what a setup rerun writes, and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 8 review lessons in the standards (#93)`. The file is `agent-os/standards/workflow/agents.md`. When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final commit: `redline: record review round 8 as built for PR #94 (#93)`.

**Files (steps 12 and 13):**

- `agent-os/standards/workflow/agents.md` (step 12, only the approved edits)
- `agent-os/specs/2026-11-15-0822-94-review-round-8/plan.md` (step 13)
- `agent-os/specs/2026-11-15-0822-94-review-round-8/shape.md` (step 13)
