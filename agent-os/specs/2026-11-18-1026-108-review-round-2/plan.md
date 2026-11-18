# PR #108 review round 2: the forced test on the whole demand, decisions checked at intake, and a mock that leaves named calls unstated

Spec folder: `agent-os/specs/2026-11-18-1026-108-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #108 (issue #99), from the round's seven findings (`redline/round-2-review.json`, `redline/round-2-findings.json`). Corrected once after the plan approver's first adjustment (Task 3's comment wrap; `shape.md`, Plan adjustments).

- `fix`, one task each, in finding order: R2-1 (Task 2), R2-2 (Task 3), R2-3 (Task 4), R2-4 (Task 5), R2-5 (Task 6), R2-6 (Task 7).
- `decline`, no task: R2-7. Its reason is under `## Declined` in `shape.md`.
- No `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#99)`. No commit subject holds a bare `@word`.

Line numbers are at `81565cc`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.2`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-resolve.md`** (the pull request's own caution, "a round on it that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file, which the skill lists. The agent file's edit (Task 5) asks for one task per call stated `fix`, which the launch's script already enforces, so the two agree (`shape.md`, Unattended answer 8).

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 3 rewrites the comment above `const DEFERRED_SCHEMA` (769-776) and removes the one above `const DRAFT_FIELDS` (781-790).
  - Task 4 replaces the `strayOverride` warning (3814-3817).
  - Task 5 changes one parenthesis of the `decided` ask (2079).
  - Task 6 changes the comment above `needCommits` (4081-4089) and its last line (4093).
  - Task 7 moves `CALL_ENDS` and its comment (878-880) to just above `const decisions` (234) and adds a check after it.
- `tests/loop-test.mjs`:
  - Task 2 changes the resolve mock (lines 262-275) and drops `resolveUnstated` from the named-call scenarios (3238, 3240, 3277).
  - Task 4 adds one run and one check right after the check named `filing: the resolve agent's file says a call whose decision carries a disposition has no entry in decided` (3248).
  - Task 5 adds two checks right after the check named `filing: the resolve prompt of a run with overrides and no call asks for no disposition` (3306).
  - Task 6 adds one run and two checks right after the check named `filing: that call is posted as left to the person under the rule` (3293).
  - Task 7 adds one run and one check right after the check `bad scope: refused` (598).
- `agents/redline-resolve.md`: Task 5 changes one parenthesis of step 3's "State what each call's decision ends in" (line 24).
- `docs/running.md`: Task 5 changes one clause of the bullet "A deferral you chose at a call" (line 126).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-2/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`. A check that is already green before its change (Task 2 adds none; Task 5's two text checks are red before it) is recorded under As built with the reason.

**Expected counts.** Before this round, the loop prints `1427 checks passed, 0 failed` (round 1's As built), and the other harnesses print what the baseline prints. A run that reaches Finish adds the run-record check `go` adds; a run that stops does not.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 0 | the mock change; three scenarios lose a key |
| Task 3 | 0 | a comment; the three source checks that read the two comments (`tests/loop-test.mjs:2865`, 2870, 2871) stay green, since the new comment keeps each of their phrases on one line |
| Task 4 | 2 | one named check, and the run-record check of a run that reaches Finish |
| Task 5 | 2 | the prompt's clause and the agent file's clause |
| Task 6 | 3 | two named checks, and the run-record check of a run that reaches Finish |
| Task 7 | 1 | the refusal, which runs no agent |

So the loop reads `1435 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-18-1026-108-review-round-2/plan.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-2/shape.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-2/standards.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #108 (#99)`

## Task 2: R2-1, the resolve mock states nothing for a call whose decision names its own disposition

`shape.md`, Decision 1.

**Files:**

- `tests/loop-test.mjs`

**Change.** In the resolve mock (`tests/loop-test.mjs`, lines 262-275):

1. After the line that builds `left`:

   ```js
         const left = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"rule": "/g)].map((m) => m[1]))
   ```

   add:

   ```js
         // A call whose decision carries its own disposition has no entry in decided (#108, R1-2,
         // R2-1), as the prompt says, so the mock leaves it out as a real agent would, unless
         // scenario.resolveDecided scripts a statement for it.
         const named = new Set([...prompt.matchAll(/"([RH]\d+-\d+)": \{[^}]*"disposition": "/g)].map((m) => m[1]))
   ```

2. The comment above `callsFrom` (lines 262-268) says, after "one entry per call of the prompt's calls block, none for a call left to the person under a rule", also ", and none for a call whose decision names its own disposition". No other sentence of it changes.

3. The `decided` filter (line 274):

   ```js
           .filter((id) => !left.has(id) && !(scenario.resolveUnstated || []).includes(id))
   ```

   becomes:

   ```js
           .filter((id) => !left.has(id) && !(named.has(id) && !(scenario.resolveDecided && id in scenario.resolveDecided)) && !(scenario.resolveUnstated || []).includes(id))
   ```

4. Drop `resolveUnstated: ['R1-1']` from the scenarios of `namedCall` (3238), `namedUnbuilt` (3240) and `namedDeferNoEntry` (3277), now that the mock leaves a named call out by default. Find any other scenario whose decision for a call carries `disposition` and passes `resolveUnstated` for it (`grep -n "resolveUnstated" tests/loop-test.mjs`), and drop it there too. Keep `resolveUnstated` where it scripts a call with no named disposition (`unstated`, 3225). Any check that needs a statement for a named call scripts it with `resolveDecided`.

**Test.** No check is added and no check's expectation changes: the three scenarios pass with the key removed, so the gate run after the change prints `1427 checks passed, 0 failed`. To show the mock now carries the pin, mutate `asked` in `workflows/redline-loop.js` (3795) by dropping `&& !roundDecisions[call.id].disposition`, run the gate, see `namedCall` red (it stops at resolve with `the resolve agent stated no disposition for R1-1`, since the mock states none), and revert the mutation before committing. Record the mutation run under As built. The workflow file is not committed in this task.

**Docs entry:** test file only; no plugin file is touched.

**Commit:** `redline: R2-1 leave a named call out of the resolve mock's decided list (#99)`

## Task 3: R2-2, one telling of the mitigation field's history, in the deferred schema's comment

`shape.md`, Decision 2 and Unattended answer 7.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`:

1. The comment above `const DEFERRED_SCHEMA` (769-776):

   ```js
   // A deferred item (#95): worth doing, not in this pull request. `mitigation` is the words for what
   // ships now, an empty string when nothing does. The words never decide what ships (#100), and
   // since #99 nothing reads the field to decide anything: whether a call's decision deferred its
   // finding is read from what the resolve agent states (`decided` in RESOLVE_SCHEMA), where the
   // field was read as filled or empty until then (#103, R2-3). `title`, `found`, `why` and `fullFix`
   // are its drafted issue, which stands on its own. The draft fields are checked by the workflow,
   // not required here, since the resolve agent's entry for a finding left to the person under a
   // repository rule carries none.
   ```

   becomes, line for line as written here (each line is at most 99 columns):

   ```js
   // A deferred item (#95): worth doing, not in this pull request. `mitigation` is the words for what
   // ships now, an empty string when nothing does. The words never decide what ships (#100): before
   // the build that is the task the round planned with files, and after it the commit of the
   // finding's own, so no wording can stop a round or demand a commit. The words are shown, in a
   // stop's drafts and in the result's deferred list, only beside a mitigation the record says ships;
   // the plan dial's list of the shaper's dispositions shows them as the shaper wrote them, beside
   // the files it listed (#103, R2-4). Until #100 a list of phrases for nothing (none, n/a, nothing
   // ships now) was read from the field, and a wording it missed demanded a commit the plan had no
   // task for (#97, R1-7, R3-2). And since #99 nothing reads the field to decide anything: whether a
   // call's decision deferred its finding is read from what the resolve agent states (`decided` in
   // RESOLVE_SCHEMA), where the field was read as filled or empty until then, to tell a person's
   // "Mitigate" answer from a fix with a stray entry (#103, R2-3). `title`, `found`, `why` and
   // `fullFix` are its drafted issue, which stands on its own. The draft fields are checked by the
   // workflow, not required here, since the resolve agent's entry for a finding left to the person
   // under a repository rule carries none.
   ```

   Do not rewrap it. Three source checks in `tests/loop-test.mjs` read a phrase of these comments with `src.includes`, and each phrase stays whole on one line of the new comment:

   - 2865, `defer: the script's comment on the mitigation field says the words are shown only beside a mitigation that ships`: `only beside a mitigation the record says ships` (line 5 of the new comment; today its only occurrence is 784, in the comment item 2 removes).
   - 2870, `defer: the deferred schema's comment says nothing reads the mitigation field to decide anything, since a call's decision is read from what is stated (#99)`: `since #99 nothing reads the field to decide anything` (line 9). The same check's negatives, `read once, as filled or empty, by isDeferral` and `shown and never read to decide`, appear nowhere in it.
   - 2871, `defer: the comment on the mitigation field names the plan dial's list as the one that shows the shaper's words`: `the plan dial's list of the shaper's` (line 6; today 785).

   The comment names neither `mitigationFilled` nor `resolveDeferred`, which the check at 2890 requires `src` not to hold. These are every `src.includes` phrase of the loop test that occurs in lines 765-795 today (each phrase of the file's `src.includes` calls was searched for in `workflows/redline-loop.js`, and only these three land there).

2. The ten-line comment above `const DRAFT_FIELDS` (781-790), from `// What a deferral ships is never read from the mitigation field either (#100): before the build` to `// do: both are an entry beside a task with files.`, is removed. `const DRAFT_FIELDS` then follows the closing `}` of `DEFERRED_SCHEMA` directly; the comment on `draftMissing` after it is unchanged.

**Test.** No check is added: a comment changes. Before committing, confirm each phrase is on one line of the source, with plain pipelines:

- `grep -c "only beside a mitigation the record says ships" workflows/redline-loop.js` prints `1`.
- `grep -c "since #99 nothing reads the field to decide anything" workflows/redline-loop.js` prints `1`.
- `grep -c "the plan dial's list of the shaper's" workflows/redline-loop.js` prints `1`.
- `grep -c "What a deferral ships is never read from the mitigation field either" workflows/redline-loop.js` prints `0`.

The gate run after the change prints the same count as before it, with the three checks at `tests/loop-test.mjs:2865`, 2870 and 2871 green, and the check at 2890 green.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a code comment only.

**Commit:** `redline: R2-2 tell the mitigation field's history once, in the deferred schema's comment (#99)`

## Task 4: R2-3, word a stray entry's warning by whose decision it is

`shape.md`, Decision 3.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `filing: the resolve agent's file says a call whose decision carries a disposition has no entry in decided` (3248), add:

```js
  // A stray entry beside a call whose decision names its own disposition is dropped as one beside
  // an override is, and its warning says whose decision it is (#108, R2-3): the call was never a
  // deferral the person changed away from. The override's own wording is pinned by
  // `overrideBuilt` below.
  const namedStray = await go('filing: a stray entry beside a call whose decision names a fix', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], resolveDeferred: [{ id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }], commitIds: [['R1-1']] })
  check('filing: a stray entry beside a call whose decision names a fix is warned as that call\'s, never as one the person changed away from defer', (namedStray.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a call whose decision names it as fix; the entry is dropped, since the decision stands') && !(namedStray.res.warnings || []).some((w) => w.includes('changed away from defer')), [namedStray.res.status, namedStray.res.warnings])
```

See it fail on a gate run: the warning reads `a finding the person changed away from defer`.

**Change.** In `workflows/redline-loop.js`, `resolveWith`, the block (3814-3817):

```js
    const strayOverride = once.kept.filter((item) => awayFromDefer(item.id)).map((item) => item.id)
    if (strayOverride.length) {
      warnings.push(`${pass.name}: the resolve agent listed ${strayOverride.join(', ')} as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands`)
    }
```

becomes:

```js
    // An override is a finding the person changed away from defer; a call whose decision names
    // its own fix or accept was never a deferral, and its warning says whose decision it is
    // (#108, R2-3). An override is never one of the round's calls (overridesFor).
    const strayOverride = once.kept.filter((item) => awayFromDefer(item.id)).map((item) => item.id)
    const strayNamed = strayOverride.filter((id) => calls.some((call) => call.id === id))
    const strayChanged = strayOverride.filter((id) => !strayNamed.includes(id))
    if (strayChanged.length) {
      warnings.push(`${pass.name}: the resolve agent listed ${strayChanged.join(', ')} as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands`)
    }
    for (const id of strayNamed) {
      warnings.push(`${pass.name}: the resolve agent listed ${id} as deferred, a call whose decision names it as ${roundDecisions[id].disposition}; the entry is dropped, since the decision stands`)
    }
```

The comment above the block (3810-3813) is unchanged, and so is every use of `strayOverride` after it (`fresh`, 3827). The override's wording stays exactly as it was: the check named `filing: the resolve agent's entry beside an override to fix is dropped with a warning, and neither the plan approver nor the implementer is shown it` (`tests/loop-test.mjs:3334`) pins it and stays green.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call". No reader-facing change: the bullet quotes only the warning for a call whose decision is stated (`the resolve agent listed R1-4 as deferred and stated its decision as fix; ...`), which this task does not change, and quotes neither an override's warning nor this one.

**Commit:** `redline: R2-3 word a stray entry's warning by whose decision it is (#99)`

## Task 5: R2-4, ask for a task of its own for each call stated as a fix

`shape.md`, Unattended answer 4 and Decision 4.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-resolve.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `filing: the resolve prompt of a run with overrides and no call asks for no disposition` (3306), add:

```js
  // A call stated as a fix is held to the files of its own task (`fixNoFilesBeside` above), so the
  // ask says each has a task of its own, its finding the call's id, in the prompt and in the agent
  // file (#108, R2-4).
  check('filing: the resolve prompt asks for a task of its own for each call stated as a fix', callResolve.prompt.includes('(a task of its own, its finding set to the call\'s id, names its files, and the check demands its commit;'), callResolve.prompt.slice(-2400))
  check('filing: the resolve agent\'s file asks for a task of its own for each call stated as a fix, as the prompt does', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('(a task of its own, its `finding` set to the call\'s id, names its files, and the check demands its commit)'))
```

See both fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, `resolvePrompt`, the `decided` ask (2079), the parenthesis:

   ```
   (its task names its files, and the check demands its commit; a choice that keeps the behaviour and still ships something, a code comment say, is a fix)
   ```

   becomes:

   ```
   (a task of its own, its finding set to the call's id, names its files, and the check demands its commit; a choice that keeps the behaviour and still ships something, a code comment say, is a fix)
   ```

   No other word of the sentence changes. The text holds no backtick, so nothing in the template literal needs escaping.

2. In `agents/redline-resolve.md`, step 3, the paragraph "State what each call's decision ends in" (line 24), the parenthesis:

   ```
   (its task names its files, and the check demands its commit)
   ```

   becomes:

   ```
   (a task of its own, its `finding` set to the call's id, names its files, and the check demands its commit)
   ```

   No other sentence of the agent file changes.

3. In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), the clause:

   ```
   a deferral with no deferred entry, a fix with no task that names files, an accept beside a task that names files, or a call with no statement at all.
   ```

   becomes:

   ```
   a deferral with no deferred entry, a fix with no task of its own that names files (one task planned for two calls counts for the call it names), an accept beside a task that names files, or a call with no statement at all.
   ```

   No other sentence of the bullet changes.

The stop itself is unchanged and stays pinned by `fixNoFilesBeside` (`tests/loop-test.mjs:3268-3269`), the loop case of one call's task with files beside another call stated `fix` with none.

**Docs entry:** `workflows/redline-loop.js` and `agents/redline-resolve.md`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call", changed in this task's commit.

**Commit:** `redline: R2-4 ask for a task of its own for each call stated as a fix (#99)`

## Task 6: R2-5, the forced test on the whole demand

`shape.md`, Unattended answer 5 and Decision 5.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `filing: that call is posted as left to the person under the rule` (3293), add:

```js
  // The same holds for a call whose decision names its own fix (#108, R2-5): no statement is
  // asked of it, so it is demanded through its final disposition, and a reshape that leaves it
  // to the person under a rule after its resolve takes it out of the demand as well.
  const forcedNamed = await go('filing: a call whose decision names a fix that a reshape leaves to the person under a rule, the fix left out', { ...baseArgs, askRules: billingRule, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, commitIds: [[], []] })
  const forcedNamedReply = replyFor(forcedNamed.calls, 'push and reply r1', 'R1-1')
  check('filing: a call whose decision names a fix that a reshape leaves to the person under a rule is not demanded, so the round finishes with no repair', forcedNamed.res.status === 'done' && !labels(forcedNamed.calls).includes('repair r1'), [forcedNamed.res.status, forcedNamed.res.stage, forcedNamed.res.error, labels(forcedNamed.calls).slice(-6)])
  check('filing: that named call is posted as left to the person under the rule', forcedNamedReply.startsWith('Redline round 1: left to @author under repository rule billing'), forcedNamedReply)
```

See the first check fail on a gate run: the round stops at the check after `repair r1` with `no commit names R1-1` (the reviewer's trace; `shape.md`, Decision 5). If the reply check is already green before the change, say so under As built, as round 1's `forcedLater` reply check was not: `outcomesFor` reads the forced record whatever the demand did.

**Change.** In `workflows/redline-loop.js`, `needCommits`:

1. In the comment above it (4081-4089), the sentence:

   ```js
     // a deferral or as accepted is not, whatever its task lists. One exception: a call a reshape
     // leaves to the person under a rule after its resolve is demanded of nothing, as isDeferral
     // and the outcomes treat it, and as the clause before #99 had it (#108, R1-8). Until #99 a
   ```

   becomes:

   ```js
     // a deferral or as accepted is not, whatever its task lists. One exception: a decided finding
     // a reshape leaves to the person under a rule after its resolve is demanded of nothing, a call
     // stated as a fix, a call whose decision names its own fix and an override to fix alike, as
     // isDeferral and the outcomes treat it, and as the clause before #99 had it for a stated call
     // (#108, R1-8); the test is on the whole list, since a decision that names its fix is demanded
     // through its final disposition (#108, R2-5). Until #99 a
   ```

   The rest of the comment is unchanged.

2. The list (4090-4093):

   ```js
     const needCommits = finalDispositions
       .filter((f) => f.disposition === 'fix' && !deferralIds.has(f.id) && !(f.id in stated))
       .map((f) => f.id)
       .concat(Object.keys(stated).filter((id) => stated[id] === 'fix' && !record.forced[id]))
   ```

   becomes:

   ```js
     const needCommits = finalDispositions
       .filter((f) => f.disposition === 'fix' && !deferralIds.has(f.id) && !(f.id in stated))
       .map((f) => f.id)
       .concat(Object.keys(stated).filter((id) => stated[id] === 'fix'))
       .filter((id) => !record.forced[id])
   ```

A finding nobody decided that a rule covers is sorted `ask` by `forceAskRules` (3289), so it never reaches the first branch; the test changes only a decided finding forced after its resolve. `forcedLater` (round 1's pin of the stated branch) stays green, so the test is pinned at both of its call sites (testing/tests, line 13).

**Docs entry:** `workflows/redline-loop.js`: `docs/contract.md`, "Ask rules" ("A finding a rule covers is the person's"). No reader-facing change: it makes the check agree with what that section and the reply already say, that a finding a rule covers is posted as left to the person with no commit (`outcomesFor`, 2973-2976).

**Commit:** `redline: R2-5 keep the forced test on the whole demand (#99)`

## Task 7: R2-6, refuse a decision whose disposition is not fix, defer or accept

`shape.md`, Decision 6.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `bad scope: refused` (598), add:

```js
  // A decision's disposition is one of the three when it names one (#108, R2-6): every reader of
  // it matches the exact values, so any other is refused before any agent runs. Its neighbour, a
  // lower-case fix, runs on (`namedCall`), and so does a decision with no disposition at all.
  run = await go('bad decision disposition', { ...baseArgs, decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'Fix' } } }, { reviews: [[f('R1-1', 'correctness')]], ask: ['R1-1'] })
  check('bad decision disposition: refused before any agent runs', Boolean(run.thrown) && /args\.decisions must give a disposition of fix \| defer \| accept/.test(run.thrown.message) && run.calls.length === 0, run.thrown && run.thrown.message)
```

See it fail on a gate run: the run is not refused.

**Change.** In `workflows/redline-loop.js`:

1. Move `CALL_ENDS` and its comment (878-880):

   ```js
   // What a judgment call's decision can end in (#99): a change in this pull request whose commit
   // the check demands, an issue with or without a mitigation, or no change.
   const CALL_ENDS = ['fix', 'defer', 'accept']
   ```

   to just above `const decisions` (234), unchanged. The top-level code at 234 runs before line 878 is reached, so a check there cannot read a `const` declared later (it would throw on first read). Its two readers below (the `decided` schema, 899, and `statements`, 3791) read it as before.

2. Right after `const decisions = ...` (234), add:

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

No existing scenario passes a disposition outside the three (`grep -n "disposition: '" tests/loop-test.mjs` shows only `fix`, `defer` and `accept`), so no other check changes.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Hand-off and relaunch". No reader-facing change: the skill records a disposition only as `fix`, `defer` or `accept` (`skills/redline/SKILL.md`, lines 189, 215, 224, 228), so no run the skill launches meets the refusal; it is the workflow's second layer behind the skill's form, as the other argument checks are.

**Commit:** `redline: R2-6 refuse a decision whose disposition is not fix, defer or accept (#99)`

## Task 8: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1435 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 3 to 7) and `agents/redline-resolve.md` (Task 5), each with the section and the reason given in its task; `docs/running.md` (Task 5) is reader-facing by nature, and Task 5's clause is the entry for its workflow and agent-file change. No config key, subcommand or allow rule is added; Task 7's refusal is an argument check, which the skill's own form never meets, not a new exit code. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.2`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, Task 2's mutation run, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 2 for PR #108 (#99)`.
