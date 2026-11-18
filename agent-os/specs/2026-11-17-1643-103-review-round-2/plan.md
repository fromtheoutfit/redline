# PR #103 review round 2: what each agent and reader is shown of a deferral's record

Spec folder: `agent-os/specs/2026-11-17-1643-103-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #103 (issue #100), from the round's twelve findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-7 (Task 2), R2-8 (Task 3), R2-1 (Task 4), R2-2 (Task 5), R2-3 (Task 6), R2-4 (Task 7), R2-5 (Task 8), R2-9 (Task 9), R2-11 (Task 10).
- `decline`, no task: R2-6, R2-10, R2-12. Their reasons are under `## Declined` in `shape.md`.
- No `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#100)`. No commit subject holds a bare `@word`.

Line numbers are at `363e445`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text or any file under `agents/`. The version stays `0.4.1` (`shape.md`, Scope). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 2 changes `deferredEntry`.
  - Task 3 changes one line of `resolveWith`.
  - Task 4 changes the done rule's comment near the end of `revise()`.
  - Task 6 changes the comment above `DEFERRED_SCHEMA`.
  - Task 7 changes the comment above `mitigationFilled`, two lines further down.
  - Task 8 changes `FILES_ASK` and its comment.
  - Task 9 changes the `shaperPlanned` and `plannedFiles` block and one schema comment.
  - Task 10 changes `effectiveDispositions`, removes `approverFindings`, which sits after `plannedFiles` as Task 9 left it, and changes the plan approver's call.
- `skills/redline/SKILL.md`: Task 2 changes the `done` and `capped` sections, and Task 8 changes the plan dial's field list.
- `tests/loop-test.mjs`:
  - Tasks 2, 4, 6, 7 and 9 add checks, in that order, after the defer section's source check `defer: a deferred outcome carries no mitigation words, ...` (line 2845).
  - Tasks 2, 7 and 8 add phrases to its statement loop (lines 2831-2837).
  - Task 2 adds checks beside the pinned case and the mirror.
  - Task 8 adds one after the shape prompt's files check (line 2859).
  - Tasks 3, 5 and 10 add runs and checks to the filing section.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check makes the test change first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-2/redline/snapshot.json`, which prints the failing check names. A check named as a neighbour that must not change is green on both runs. Task 5's check pins behaviour that is already right, so its red run is a mutation, made and undone inside the task and never committed.

**Expected counts.** Before this round, the loop prints `1359 checks passed, 0 failed` (round 1's As built), and the other harnesses print what the baseline prints. `go()` adds one run-record check for each run that reaches Finish (`tests/loop-test.mjs:344-350`). This round adds 19 loop checks:

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 6 | two mirror checks, one pinned check, two skill phrases, one negative skill check |
| Task 3 | 1 | |
| Task 4 | 1 | |
| Task 5 | 2 | a check, and a run that reaches Finish |
| Task 6 | 1 | |
| Task 7 | 2 | a doc phrase and a source check |
| Task 8 | 2 | a skill phrase and a prompt check |
| Task 9 | 1 | |
| Task 10 | 3 | |

So the loop reads `1378 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-2/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-2/shape.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-2/standards.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #103 (#100)`

## Task 2: R2-7, say in the result's deferred entry whether a mitigation shipped, and have the closing summary read it

`shape.md`, Decision 1 and Unattended answer 4.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the defer section's statement loop, right after the entry for the skill's plan dial (line 2836, the one that opens `['the skill\'s plan dial', read('skills', 'redline', 'SKILL.md'),`), add the entry:

   ```js
       ['the skill\'s closing summary', read('skills', 'redline', 'SKILL.md'), ['and what shipped, from `ships` and never from whether `mitigation` is empty', 'and what shipped, from `ships`, as that section says']],
   ```

2. Right after the check named `defer: a deferred outcome carries no mitigation words, so no reply or outcome line can post them without a commit of its own` (line 2845), add:

   ```js
     check('defer: the skill\'s closing summary no longer reads an empty mitigation as nothing shipped', !read('skills', 'redline', 'SKILL.md').includes('(`mitigation` is empty when nothing shipped)'))
   ```

3. Right after the check named `defer: the result's entry for the pinned case carries no mitigation words, since nothing shipped` (line 2890), add:

   ```js
     check('defer: the result\'s entry for the pinned case says nothing shipped', ((pinned.res.deferred || [])[0] || {}).ships === false, pinned.res.deferred)
   ```

4. Inside the mirror loop (lines 2903-2906), right after its check (the one whose name opens `` `defer: a planned task with files and a commit of its own ships, with the mitigation worded as ${name} ``), add:

   ```js
       check(`defer: the result's entry says a mitigation shipped, read off its own commit, with the mitigation worded as ${name}`, ((mirror.res.deferred || [])[0] || {}).ships === true, mirror.res.deferred)
   ```

The red run: the six new checks fail (`ships` is absent, and the skill's sentences are the old ones).

**Change.**

1. In `workflows/redline-loop.js`, `deferredEntry` (lines 3381-3388). The comment and the opening lines:

   ```js
   // A deferred item as the result and the handoff carry it (#95): the finding, its mitigation (the
   // words as written when its outcome holds a commit, which is what says one shipped, #100) and
   // full fix, its draft as filed (for the session's closing summary, which prints it when the
   // setting is print), where it went, and its outcome as posted.
   function deferredEntry(pass, record, d, filedTo, outcome) {
     return {
       id: d.item.id, round: record.round, title: d.f.title, file: d.f.file, line: d.f.line, specFolder: record.specFolder, commentId: record.commentIds[d.item.id] || 0,
       mitigation: outcome && Array.isArray(outcome.commits) && outcome.commits.length ? d.item.mitigation : '', fullFix: d.item.fullFix,
   ```

   become:

   ```js
   // A deferred item as the result and the handoff carry it (#95): the finding, whether a mitigation
   // shipped (`ships`: its outcome holds a commit of the finding's own, #100, which the session's
   // closing summary reads, never the emptiness of the words; #103, R2-7), its mitigation (the words
   // as written when one shipped) and full fix, its draft as filed (for the session's closing
   // summary, which prints it when the setting is print), where it went, and its outcome as posted.
   function deferredEntry(pass, record, d, filedTo, outcome) {
     const ships = Boolean(outcome && Array.isArray(outcome.commits) && outcome.commits.length)
     return {
       id: d.item.id, round: record.round, title: d.f.title, file: d.f.file, line: d.f.line, specFolder: record.specFolder, commentId: record.commentIds[d.item.id] || 0,
       ships, mitigation: ships ? d.item.mitigation : '', fullFix: d.item.fullFix,
   ```

   The rest of the function (`draft`, `...filedTo`, `outcome`) stays as it is.

2. In `skills/redline/SKILL.md`, the `done` section (line 264), the text

   ```
   and the mitigation that shipped, when one did (`mitigation` is empty when nothing shipped).
   ```

   becomes

   ```
   and what shipped, from `ships` and never from whether `mitigation` is empty (true: the mitigation as written, or "a change in its own commit" when the words are empty; false: nothing).
   ```

3. In `skills/redline/SKILL.md`, the `capped` section (line 268), the text

   ```
   and the mitigation that shipped, when one did; when `deferTo` is `print`
   ```

   becomes

   ```
   and what shipped, from `ships`, as that section says; when `deferTo` is `print`
   ```

**Proof:** the gate is green with the six new checks passing, and these pass unchanged: the mirror's own checks (`mitigation === word`, line 2905), the pinned case's `mitigation === ''` check (line 2890), the no-task loop's `mitigation === ''` (line 2879), `restated`'s `mitigation === 'a log line'` (line 2523), and the result's draft checks (lines 3017, 3032 and 3050). Also, `grep -c 'is empty when nothing shipped' skills/redline/SKILL.md` prints `0`.

**Docs entry:**

- `workflows/redline-loop.js`: the result's `deferred[]` gains `ships`. Its reader is the skill's `done` and `capped` sections, updated in this task's commit. No README or `docs/` section describes the result's deferred entries: `docs/running.md`'s closing-summary paragraph (line 118) names the fixed and declined lists only.
- `skills/redline/SKILL.md`: no README or `docs/` change. The closing summary's deferred line now prints what the record says shipped, which `docs/running.md`, "Deferred items", Whether a mitigation shipped, already states.

**Commit:** `redline: R2-7 say in the result's deferred entry whether a mitigation shipped, and read it in the closing summary (#100)`

## Task 3: R2-8, drop the resolve agent's entry beside an override that does not defer

`shape.md`, Decision 2.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check on the `overrideBuilt` run (the check named `filing: an override to fix beside a filled resolve entry files nothing and is posted as applied`, line 3142), add:

```js
  // An override to fix or accept leaves no deferral behind in any list an agent is shown (#103,
  // R2-8): the resolve agent's entry beside it is dropped with a warning, so neither the plan
  // approver nor the implementer is shown it. A prompt that is absent reads as '' and fails.
  const shownStray = ['plan approver r1', 'implement r1'].map((label) => (pick(overrideBuilt.calls, label) || { prompt: '' }).prompt)
  check('filing: the resolve agent\'s entry beside an override to fix is dropped with a warning, and neither the plan approver nor the implementer is shown it', shownStray.every((p) => p !== '' && !p.includes('"mitigation": "a guard"')) && (overrideBuilt.res.warnings || []).includes('round 1: the resolve agent listed R1-1 as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands'), [shownStray.map((p) => p.includes('"mitigation": "a guard"')), overrideBuilt.res.warnings])
```

`"mitigation": "a guard"` is the resolve agent's stray entry (`strayOverrideEntry`, line 3137). The shaper's own entry for R1-1 reads `"mitigation": "a guard clause"`, which `awayFromDefer` already drops (line 3729), and it does not match, since the quote follows `guard` only in the stray entry. The red run: the check fails, because both prompts hold the entry and there is no warning.

**Change.** In `workflows/redline-loop.js`, in `resolveWith`, the line `    const fresh = once.kept` (line 3753) is replaced, whole, by:

```js
    // An override to fix or accept leaves no deferral behind (awayFromDefer), whatever entry the
    // resolve agent returns beside it (#103, R2-8): the entry is dropped with a warning before the
    // round's list takes it, so the plan approver and the implementer are never shown one, and no
    // draft check stops the round for it.
    const strayOverride = once.kept.filter((item) => awayFromDefer(item.id)).map((item) => item.id)
    if (strayOverride.length) {
      warnings.push(`${pass.name}: the resolve agent listed ${strayOverride.join(', ')} as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands`)
    }
    const fresh = once.kept.filter((item) => !awayFromDefer(item.id))
```

**Proof:** the gate is green with the new check passing, and these pass unchanged: `overrideUnbuilt` (line 3140), `overrideBuilt` (line 3142), `chosen` (line 3081), `declineToDefer` (line 3104), `fixToDefer` (line 3106), `restated` (line 2523), `twiceResolved` (line 3006), the resolve's undrafted stop (line 2934) and the defer override's missing entry (`unentered`, line 2939).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. `docs/running.md` lists none of the workflow's dropped-entry warnings (neither the reshape's nor the repeated entry's). What a person sees of a disposition they changed to fix or accept is unchanged: nothing filed and nothing listed under Deferred.

**Commit:** `redline: R2-8 drop the resolve agent's entry beside an override that does not defer (#100)`

## Task 4: R2-1, say in the done rule's comment that a deferral buys a round only through its own commit

`shape.md`, Decision 3. The standard's sentence (`agent-os/standards/workflow/agents.md:42`) is reworded through the standards retrospective, item 1 (Task 11, step 4), not in this task.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 2's check named `defer: the skill's closing summary no longer reads an empty mitigation as nothing shipped`, add:

```js
  check('defer: the script\'s done-rule comment says a deferral buys a round only through a commit of its own', !src.includes('(in full, or by a deferral\'s mitigation) or puts to the') && src.includes('A deferral buys it only through a commit of its own'))
```

The red run: the check fails.

**Change.** In `workflows/redline-loop.js`, near the end of `revise()`, the first four lines of the done rule's comment (lines 4113-4116):

```js
  // The done rule (#93): a round is bought by what it finds, not by what it commits. A new
  // correctness item the shaper fixes (in full, or by a deferral's mitigation) or puts to the
  // person buys the next round, whatever the person answered and whether or not a commit resulted;
  // so does a decline the person overruled to a fix. A decline of the shaper's own buys nothing,
```

become:

```js
  // The done rule (#93): a round is bought by what it finds, not by what it commits. A new
  // correctness item the shaper fixes or puts to the person buys the next round, whatever the
  // person answered and whether or not a commit resulted; so does a decline the person overruled
  // to a fix. A deferral buys it only through a commit of its own, as the paragraph below says
  // (#100; #103, R2-1). A decline of the shaper's own buys nothing,
```

The line after them, which opens `  // and neither does any item that is not a correctness one.`, and the rest of the comment stay as they are.

**Proof:** the gate is green with the new check passing. Every done-rule check passes unchanged: the defer section's `mitigated` (line 2853), `bare` (line 2865), `unbuiltMitigation` (line 2895), the mirror (line 2905), `deferAccepted` (line 2917) and `fixAccepted` (line 2919).

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; this is a comment. `docs/running.md:44` ("What buys the next round") already says that a deferral buys a round only through a commit of its own.

**Commit:** `redline: R2-1 say in the done rule's comment that a deferral buys a round only through its own commit (#100)`

## Task 5: R2-2, pin an override to accept beside a filled resolve entry

`shape.md`, Decision 4.

**Files:**

- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the filing section:

1. Right after Task 3's check (named `filing: the resolve agent's entry beside an override to fix is dropped with a warning, ...`), add:

   ```js
     // The accept half of R1-11's rule (#103, R2-2): an override to accept beside a filled entry the
     // resolve agent returns is no deferral either, so nothing is filed or listed as deferred, and the
     // reply is the person's decision with no code change.
     const acceptOverride = { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-17', disposition: 'accept' } }
     const overrideAccepted = await go('filing: a deferral the person changes to accept, beside a filled resolve entry', { ...overrideArgs, decisions: acceptOverride }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], resolveDeferred: [strayOverrideEntry], commitIds: [[]] })
     check('filing: an override to accept beside a filled resolve entry files nothing, lists nothing as deferred and is posted as kept with no code change', overrideAccepted.res.status === 'done' && !labels(overrideAccepted.calls).includes('file deferred r1') && (overrideAccepted.res.deferred || []).length === 0 && replyFor(overrideAccepted.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: Keep it as it is. No code change. · decided by: @author', [overrideAccepted.res.status, overrideAccepted.res.error, labels(overrideAccepted.calls).slice(-8), replyFor(overrideAccepted.calls, 'push and reply r1', 'R1-1')])
   ```

2. In the comment above `fixOverride` (lines 3132-3135), the last two lines:

   ```js
     // filed. The neighbours that must not change: `chosen` above, a defer override filed, and
     // `deferAccepted` in the defer section, an accept override that buys nothing.
   ```

   become:

   ```js
     // filed. The neighbours that must not change: `chosen` above, a defer override filed, and
     // `overrideAccepted` below, an accept override beside the same entry, which files nothing
     // (#103, R2-2).
   ```

The scripted resolve agent plans the accept as a task with no files (`tests/loop-test.mjs:255-258`), so no commit is demanded, and the one review ends the run, since a deferral changed to accept buys nothing (`deferAccepted`, line 2917).

**Red run, by a mutation.** The check pins behaviour that is already right, and it is guarded twice since Task 3. So the red run mutates both layers in `workflows/redline-loop.js`:

- In `resolveWith`, `    const fresh = once.kept.filter((item) => !awayFromDefer(item.id))` (Task 3's line) becomes `    const fresh = once.kept`.
- In `isDeferral`, `      if (decision.disposition) {` becomes `      if (decision.disposition && decision.disposition !== 'accept') {`.

Run the gate. It should print `1367 checks passed, 2 failed`: this check (the stray entry is filed, and the reply ends `Deferred to #301.`) and Task 3's check (both prompts hold the entry). Then put both lines back exactly as they were before going on. The mutation is never committed, and `git diff workflows/redline-loop.js` shows nothing before this task's commit.

**Change.** None beyond the test. The behaviour is the R1-11 rule, which Task 3 now keeps in the list as well.

**Proof:** the gate is green with the new check and its run-record check passing, and `overrideUnbuilt`, `overrideBuilt`, Task 3's check, `chosen` and `deferAccepted` passing unchanged.

**Docs entry:** no plugin file under the Docs step's directories is touched.

**Commit:** `redline: R2-2 pin an override to accept beside a filled resolve entry (#100)`

## Task 6: R2-3, say in the deferred schema's comment that isDeferral reads the field as filled or empty

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 4's check, add:

```js
  check('defer: the deferred schema\'s comment says the field is read once, as filled or empty, by isDeferral', src.includes('read once, as filled or empty, by isDeferral') && !src.includes('shown and never read to decide'))
```

The red run: the check fails.

**Change.** In `workflows/redline-loop.js`, the comment above `DEFERRED_SCHEMA` (lines 766-769):

```js
// A deferred item (#95): worth doing, not in this pull request. `mitigation` is the words for what
// ships now, an empty string when nothing does, shown and never read to decide (#100); `title`, `found`, `why` and `fullFix` are its drafted issue, which
// stands on its own. The draft fields are checked by the workflow, not required here, since the
// resolve agent's entry for a finding left to the person under a repository rule carries none.
```

becomes:

```js
// A deferred item (#95): worth doing, not in this pull request. `mitigation` is the words for what
// ships now, an empty string when nothing does. The words never decide what ships (#100): the
// field is read once, as filled or empty, by isDeferral for a call's decision (mitigationFilled
// below, #99; #103, R2-3). `title`, `found`, `why` and `fullFix` are its drafted issue, which
// stands on its own. The draft fields are checked by the workflow, not required here, since the
// resolve agent's entry for a finding left to the person under a repository rule carries none.
```

Keep `read once, as filled or empty, by isDeferral` on one line, since the source check reads it whole.

**Proof:** the gate is green with the new check passing. `grep -c 'shown and never read to decide' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; this is a comment.

**Commit:** `redline: R2-3 say in the deferred schema's comment that isDeferral reads the field as filled or empty (#100)`

## Task 7: R2-4, name the plan dial's list where the words are said to be shown only beside a mitigation that ships

`shape.md`, Decision 6 and Unattended answer 5.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the statement loop, add the phrase `'except in the plan dial\'s list of the shaper\'s dispositions'` to the list for `docs/running.md` (line 2834).
2. Right after Task 6's check, add:

   ```js
     check('defer: the comment on the mitigation field names the plan dial\'s list as the one that shows the shaper\'s words', src.includes('the plan dial\'s list of the shaper\'s'))
   ```

The red run: both checks fail.

**Change.**

1. In `workflows/redline-loop.js`, the comment above `mitigationFilled`, from the line `// commit. The words are shown, at a stop and in the result,` through the line `// plan had no task for (#97, R1-7, R3-2).` (lines 779-785 after Task 6, 777-783 at `363e445`), is replaced by:

   ```js
   // commit. The words are shown, in a stop's drafts and in the result's deferred list,
   // only beside a mitigation the record says ships; the plan dial's list of the shaper's
   // dispositions shows them as the shaper wrote them, beside the files it listed (#103, R2-4).
   // This test has one reader, isDeferral, which the record alone cannot serve: there a person's
   // "Mitigate" answer and a fix with a stray entry are both an entry beside a task with files, and
   // a filled field is what tells them apart until the resolve agent names the disposition (#99).
   // Until #100 a list of phrases for nothing (none, n/a, nothing ships now) was read here as well,
   // and a wording it missed demanded a commit the plan had no task for (#97, R1-7, R3-2).
   ```

   The three lines above it (opening `// Whether a deferred entry's mitigation field holds anything (#100).`) stay as they are. Keep `only beside a mitigation the record says ships` and `the plan dial's list of the shaper's` each on one line, since source checks read them whole.

2. In `docs/running.md`, "Deferred items", Whether a mitigation shipped (line 125), the words

   ```
   which are shown only beside a mitigation that ships (#100).
   ```

   become

   ```
   which are shown only beside a mitigation that ships (#100), except in the plan dial's list of the shaper's dispositions, where the shaper's words stand as written beside the files it listed, and the files say whether a task is planned.
   ```

**Proof:** the gate is green with both checks passing, and R1-7's checks passing unchanged: the source check `only beside a mitigation the record says ships` (line 2843) and the `docs/running.md` phrase `which are shown only beside a mitigation that ships`. The first stop's view checks (`tests/loop-test.mjs:3216-3223`) also pass unchanged.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", Whether a mitigation shipped, is updated in this task's commit.

**Commit:** `redline: R2-4 name the plan dial's list where the words are said to be shown only beside a mitigation that ships (#100)`

## Task 8: R2-5, ask an ask for the paths its recommended change would touch

`shape.md`, Decision 7 and Unattended answer 6.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`:

1. In the statement loop, add the phrase ``'for an ask, the paths its recommended change would touch; for a defer'`` to the list for the skill's plan dial (line 2836), after its existing phrase.
2. Right after the check named `defer: the shape prompt of a repository with no ask rules asks for every finding's files` (line 2859), add:

   ```js
     check('defer: the shape prompt asks an ask for the paths its recommended change would touch, as the ask-rules block does', shape.includes('for an ask, the paths its recommended change would touch'), shape.slice(-900))
   ```

The red run: both checks fail.

**Change.**

1. In `workflows/redline-loop.js`, `FILES_ASK` and its comment (lines 864-866 at `363e445`; Tasks 6 and 7 move them):

   ```js
   // How every shape prompt asks for a finding's files (#100). Until then only a repository with ask
   // rules was asked (rulesBlock), and a list left out read the same as a task that touches nothing.
   const FILES_ASK = 'files (the paths its task creates or changes, an empty list when it has no task)'
   ```

   become:

   ```js
   // How every shape prompt asks for a finding's files (#100). Until then only a repository with ask
   // rules was asked (rulesBlock), and a list left out read the same as a task that touches nothing.
   // An ask's task holds options until the person decides, so its files are the paths its
   // recommended change would touch, as the ask-rules block asks for them and forceAskRules reads
   // them (#103, R2-5).
   const FILES_ASK = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask, the paths its recommended change would touch)'
   ```

2. In `skills/redline/SKILL.md`, the plan dial's field list (line 184), the text

   ```
   `files` (the paths its task touches, empty when it has no task; for a defer, a task listed here
   ```

   becomes

   ```
   `files` (the paths its task touches, empty when it has no task; for an ask, the paths its recommended change would touch; for a defer, a task listed here
   ```

   (one line in the file; the rest of the sentence, `is what says a mitigation is planned, whatever its words say)`, stays).

`agents/redline-shaper.md` is not changed (`shape.md`, Decision 7), and neither is the scripted shaper, whose asks keep `[]`.

**Proof:** the gate is green with both checks passing, and these pass unchanged: the checks that read `FILES_ASKED` (`an empty list when it has no task`) in the shape, human-pass and reshape prompts and in the shaper's file (lines 2451, 2858, 2859 and 3153), the skill's plan dial phrase `` `files` (the paths its task touches, empty when it has no task; ``, and every ask-rules scenario (section 12, lines 1281-1396).

**Docs entry:**

- `workflows/redline-loop.js`: no reader-facing change beyond the prompt. `docs/contract.md`, "Ask rules", the `paths` bullet ("any file its planned task would touch"), already says what the workflow checks, and this asks the shaper for that list.
- `skills/redline/SKILL.md`: no README or `docs/` change. The plan dial's field list is the skill's own, and `docs/running.md`'s `plan` bullet (line 139) lists no fields.

**Commit:** `redline: R2-5 ask an ask for the paths its recommended change would touch (#100)`

## Task 9: R2-9, read the shaper's own list in plannedFiles with no second test of it

`shape.md`, Decision 8. This is a small refactor, so behaviour is unchanged.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 7's source check, add:

```js
  check('defer: plannedFiles reads the shaper\'s own list through shaperFiles alone, with no second test of it', !src.includes('shaperPlanned'))
```

The red run: the check fails.

**Change.** In `workflows/redline-loop.js`:

1. In `revise()`, the block from the comment that opens `  // A task the shaper planned with files for one of its own deferrals (#97, R2-6): a finding's` through the end of `plannedFiles` (lines 3781-3793 at `363e445`):

   ```js
     // A task the shaper planned with files for one of its own deferrals (#97, R2-6): a finding's
     // `files` are the paths its task touches (the shaper's schema), so a deferral listed with files
     // has a task whatever its mitigation says, and the commit that task makes is the item's, never
     // zeroed as shipping nothing. A finding the person or autopilot decided is read from the
     // resolve's tasks instead (plannedTask), whatever the shaper listed for it. Nothing is demanded
     // of the gate for it: no deferral's commit is (#100).
     const shaperPlanned = (id) => !roundDecisions[id] && shaped.findings.some((s) => s.id === id && s.disposition === 'defer' && Array.isArray(s.files) && s.files.length > 0)
     // The files of the task the round planned for a deferral (#100), none when it planned no task:
     // the resolve's tasks for a finding the person or autopilot decided, the shaper's own list for
     // one nobody decided (R2-6's split).
     const plannedFiles = (id) => (roundDecisions[id]
       ? unique(resolvedTasks.filter((task) => task.finding === id).flatMap((task) => task.files))
       : shaperPlanned(id) ? shaperFiles(id) : [])
   ```

   is replaced by:

   ```js
     // The files of the task the round planned for a deferral (#100), none when it planned no task.
     // A finding the person or autopilot decided is read from the resolve's tasks (plannedTask reads
     // the same tasks), whatever the shaper listed for it. One nobody decided is read from the
     // shaper's own list for its deferral (#97, R2-6): a finding's `files` are the paths its task
     // touches (the shaper's schema), so a deferral listed with files has a task whatever its
     // mitigation says, and shaperFiles reads only a finding the shaper deferred, so no other test of
     // the list is needed (#103, R2-9). Nothing is demanded of the gate for it: no deferral's commit
     // is (#100).
     const plannedFiles = (id) => (roundDecisions[id] ? unique(resolvedTasks.filter((task) => task.finding === id).flatMap((task) => task.files)) : shaperFiles(id))
   ```

   The `plannedTask` line above it and the block after it stay as they are.

2. In `shapeSchema`, the comment on `files` (line 853), `            // shaperPlanned reads the paths of a deferral (#100).` becomes `            // plannedFiles reads the paths of a deferral (#100).`

**Proof:** the gate is green with the new check passing and no existing check edited. These pass unchanged: the checks that read `plannedFiles` for a deferral nobody decided, which are `ownDefer` (line 3109), the mirror (line 2905), `unlisted` (line 2911), `mentionedBare` (line 2924), `unbuiltMitigation` (line 2894) and the first stop's view (lines 3216-3223). `grep -c 'shaperPlanned' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. This is an inlining inside the script.

**Commit:** `redline: R2-9 read the shaper's own list in plannedFiles with no second test of it (#100)`

## Task 10: R2-11, show the implementer the files the workflow reads for a decided deferral

`shape.md`, Decision 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check named `filing: the plan approver is shown the shaper's own files for a deferral nobody decided` (line 3109), add:

```js
  // The implementer is shown the same list (#103, R2-11): for a deferral the person decided, the
  // files of the task the resolve agent planned, never the shaper's list for the old disposition.
  // An absent heading or JSON that does not parse reads as null, so a run that took another path
  // fails the check and does not throw.
  const IMPLEMENT_HEAD = 'a declined finding has no task and no commit), as JSON:\n'
  const implementerFiles = (r, id) => {
    const p = (pick(r.calls, 'implement r1') || { prompt: '' }).prompt
    const a = p.indexOf(IMPLEMENT_HEAD)
    const b = a < 0 ? -1 : p.indexOf('\n\nDecisions made outside the shaper', a)
    if (a < 0 || b < 0) {
      return null
    }
    try {
      const entry = JSON.parse(p.slice(a + IMPLEMENT_HEAD.length, b)).findings.find((x) => x.id === id)
      return entry ? JSON.stringify([entry.disposition, entry.files]) : null
    } catch {
      return null
    }
  }
  check('filing: the implementer is shown the resolve agent\'s files for a decline the person overruled to a deferral with a task', implementerFiles(declineToDefer, 'R1-1') === '["defer",["app/x.php"]]', [declineToDefer.res.status, implementerFiles(declineToDefer, 'R1-1')])
  check('filing: the implementer is shown no files for a fix the person changed to a deferral with no task, whatever the shaper listed', implementerFiles(fixToDefer, 'R1-1') === '["defer",[]]', [fixToDefer.res.status, implementerFiles(fixToDefer, 'R1-1')])
  // The neighbour: a deferral nobody decided is shown with the shaper's own list, as before.
  check('filing: the implementer is shown the shaper\'s own files for a deferral nobody decided', implementerFiles(ownDefer, 'R1-1') === '["defer",["app/y.php"]]', [ownDefer.res.status, implementerFiles(ownDefer, 'R1-1')])
```

`IMPLEMENT_HEAD` is the end of the implement prompt's heading for a Redline round (`workflows/redline-loop.js:2161`), and `\n\nDecisions made outside the shaper` opens the section after its JSON (2164). The red run: the first two checks fail, showing the shaper's lists `["defer",[]]` and `["defer",["app/x.php"]]`. The neighbour passes.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. `effectiveDispositions` and its comment (lines 3774-3778 at `363e445`):

   ```js
     // Dispositions after the overrides: what the implementer builds and the replies report.
     const effectiveDispositions = () => shaped.findings.map((f) => {
       const decision = roundDecisions[f.id]
       return decision && decision.disposition ? { ...f, disposition: decision.disposition } : f
     })
   ```

   become:

   ```js
     // Dispositions after the overrides: what the plan approver and the implementer are shown, what
     // the implementer builds and the replies report. A deferral the person or autopilot decided
     // carries the files of the task the round planned for it (plannedFiles, below), the list the
     // workflow reads, never the shaper's list for the finding's old disposition (#103, R1-2, R2-11);
     // every other finding keeps the shaper's. Its first call comes after plannedFiles is declared.
     const effectiveDispositions = () => shaped.findings.map((f) => {
       const decision = roundDecisions[f.id]
       const shown = decision && decision.disposition ? { ...f, disposition: decision.disposition } : f
       return decision && shown.disposition === 'defer' ? { ...shown, files: plannedFiles(f.id) } : shown
     })
   ```

2. The `approverFindings` block, right after `plannedFiles` as Task 9 left it:

   ```js
     // What the plan approver is shown of each finding (#103, R1-2): its disposition after the
     // overrides, and for a deferral the person or autopilot decided, the files of the task the round
     // planned for it (plannedFiles), which is the list the workflow reads, never the shaper's list
     // for the finding's old disposition. Every other finding is shown as the shaper returned it.
     const approverFindings = () => effectiveDispositions().map((f) => (roundDecisions[f.id] && f.disposition === 'defer' ? { ...f, files: plannedFiles(f.id) } : f))
   ```

   is removed, all five lines.

3. In the plan approver's call (line 3851), `{ findings: approverFindings(), deferred }` becomes `{ findings: effectiveDispositions(), deferred }`.

The condition is R1-2's, unchanged: a decided finding whose disposition after the overrides is `defer`, a reshape's re-sort of a decided call included. So the plan approver's prompt is byte for byte what it was.

**Proof:** the gate is green with the three new checks passing, and these pass unchanged: R1-2's three plan approver checks (lines 3104, 3106 and 3109), `defer: the plan approver and the implementer are shown the entry with its draft` (line 2860), `strayReshape` (line 3126), `strayReshapeUnbuilt` (line 3131) and the defer section's override checks (`noDeferral`, line 2521). `grep -c 'approverFindings' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. The implementer's prompt now carries the list the workflow already reads. `agents/redline-implementer.md` rule 1 reads `plan.md` for each task's files and is unchanged.

**Commit:** `redline: R2-11 show the implementer the files the workflow reads for a decided deferral (#100)`

## Task 11: Verification Gate

1. **Gate steps 1 to 9.** Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-2/redline/snapshot.json` until it exits 0. Its JSON is the evidence.
2. **Docs (gate step 10).** The entries, one per touched plugin file:
   - `workflows/redline-loop.js` (Tasks 2, 3, 4, 6, 7, 8, 9, 10): `docs/running.md`, "Deferred items", Whether a mitigation shipped, is updated in Task 7's commit. Each other task gives its reason for no reader-facing change above.
   - `skills/redline/SKILL.md` (Tasks 2, 8): no README or `docs/` change, for the reasons in each task.
   - `docs/running.md` (Task 7) is a doc itself.
   - No new config key, subcommand, allow rule or exit code. The result's `deferred[]` gains a field, `ships`, whose reader is the skill (Task 2).
3. **Version (gate step 11).** No bump. The pull request already moved `0.4.0` to `0.4.1` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, and this round changes nothing a setup rerun writes.
4. **Standards retrospective (gate step 12).** Apply the edits the standards approver approved from `shape.md`, "Standards retrospective (proposed)", in their own commit: `redline: record what PR #103 round 2 taught in the agent standard, finishing R2-1 and R2-4 (#100)`. The commit may change only `agent-os/standards/workflow/agents.md` (items 1 to 6). If item 1 or item 2 is not approved, drop that id from the message. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
5. **Spec folder (gate step 13).** Write `## As built` at the end of this `plan.md`: each task's commit, its red and green counts, and any deviation. Record each deviation also under Decisions in `shape.md`. Commit it last, with `shape.md` if it changed: `redline: record the as-built notes for PR #103 round 2 (#100)`. Never stage anything under the spec folder's `redline/` folder.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-2/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-2/shape.md`
- `agent-os/standards/workflow/agents.md`
