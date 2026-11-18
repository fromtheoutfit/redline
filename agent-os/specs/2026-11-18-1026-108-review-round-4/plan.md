# PR #108 review round 4: a resolve resume clause chosen by the stop, comments and docs brought to the code, and an override's own task put to the person

Spec folder: `agent-os/specs/2026-11-18-1026-108-review-round-4/`

Shaped by Redline in unattended mode, for review round 4 of PR #108 (issue #99), from the round's nine findings (`redline/round-4-review.json`, `redline/round-4-findings.json`).

- `fix`, one task each, in finding order: R4-1 (Task 2), R4-2 (Task 3), R4-3 (Task 4), R4-4 (Task 5), R4-6 (Task 6).
- `defer` with a mitigation: R4-7 (Task 7). Its drafted issue is under Deferred in `shape.md`; the run files it.
- `ask`, decided by the person as a fix: R4-9 (Task 8, "State it in the agent file only"; `shape.md`, Decision 9; its wording corrected after the plan approver's bounce, Decision 10).
- `decline`, no task: R4-5 and R4-8 (`shape.md`, Declined).

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#99)`. No commit subject holds a bare `@word`.

Line numbers are at `8bad058`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.2`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-resolve.md`** (the pull request's own caution, "a round on it that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file. Task 5's prompt change is in the resume line, appended only on a resume, and the agent file's new sentence says what its rule "Apply, never reinterpret" already says (`shape.md`, Unattended answer 8).

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 3 rewrites the comment above the intake loop (238-244).
  - Task 4 replaces the line `decisions[id] = Object.fromEntries(...)` (247).
  - Task 5 rewrites the comment and the first line of `const resolveFix` in `resumeLine` (574-578).
  - Task 6 rewrites the comment above `decided:` in `RESOLVE_SCHEMA` (909-914) and the comment in `isDeferral`'s decided branch (3958-3962).
- `tests/loop-test.mjs`: Task 5 adds two runs and three checks right after the check `resume: the resolve agent's file says the same of a resumed resolve, as the resume line does` (1475). Task 8 adds one check right after the check `filing: the resolve prompt of a run with overrides and no call asks for no disposition` (3353).
- `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126): Task 2 adds a sentence after the repeat warning's quote, and Task 7 one after the stray warning's quote. Task 8 adds "of its own" to the named-decision sentence at the bullet's end.
- `agents/redline-resolve.md`: Task 5 appends a sentence to the Rules bullet `- **On a resume.**` (line 32). Task 8 changes the override paragraph (line 21).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-4/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Task 5 adds its checks first and sees them fail on a gate run, then makes the change and sees them pass. Task 8 does the same with its one check. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-4/redline/snapshot.json`, which prints the failing check names. Task 5's source check holds before the change (it pins the convention the new predicate rests on), so it is written with the others and is not expected red (testing/tests, line 33). Tasks 2, 3, 4, 6 and 7 change a comment, a line of docs or one line of code with the same behaviour, and add no check: their proof is that the gate stays green.

**Expected counts.** Before this round, the loop prints `1444 checks passed, 0 failed` (round 3's As built). The other harnesses print what the baseline prints. A run that reaches Finish adds the run-record check `go` adds; a run that stops or throws does not.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 0 | docs |
| Task 3 | 0 | a comment |
| Task 4 | 0 | a refactor |
| Task 5 | 4 | three named checks, and the run-record check of the resumed run; the first run stops at resolve |
| Task 6 | 0 | comments |
| Task 7 | 0 | docs |
| Task 8 | 1 | one named check on the agent file |

So the loop reads `1449 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-18-1026-108-review-round-4/plan.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-4/shape.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-4/standards.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-4/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 4 spec for PR #108 (#99)`

## Task 2: R4-1, say a first statement outside the three is none

`shape.md`, Decision 1.

**Files:**

- `docs/running.md`

**Change.** In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), the sentence:

```
A second statement for one call is dropped too: `the resolve agent stated a disposition for R1-4 more than once; the first is kept`.
```

becomes:

```
A second statement for one call is dropped too: `the resolve agent stated a disposition for R1-4 more than once; the first is kept`. The first is kept whatever it holds: a statement outside `fix`, `defer` and `accept` is no statement, so a first one like that stops the run at stage `resolve`, as a call with no statement does, even when a valid second one follows it.
```

No other sentence of the bullet changes.

**Test.** No check: a `docs/` sentence. `misstatedFirst` (`tests/loop-test.mjs:3267-3268`) already pins the behaviour it describes. Before committing, `grep -c "The first is kept whatever it holds" docs/running.md` prints `1`.

**Docs entry:** `docs/running.md` is reader-facing by nature; no entry of its own (process/docs-gate).

**Commit:** `redline: R4-1 say a first statement outside the three is none (#99)`

## Task 3: R4-2, narrow the intake comment to the two values it reads as none

`shape.md`, Unattended answer 4 and Decision 2.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`, the comment above `for (const [id, entry] of Object.entries(decisions)) {` (238-244):

```js
// A decision that names its own disposition names one of the three (#108, R2-6): the skill
// records only fix, defer or accept, and every reader of the field matches those exact values,
// so any other would be neither checked at resolve nor demanded at the check. Until #99 a
// resolve task with files was demanded whatever the decision named. An empty or a null one
// names none, as every reader of the field reads it and as run() reads an agent's error (#42):
// it is dropped from the run's copy of the decision, so the resolve prompt shows none either,
// where the check above refused it and a relaunch threw before any agent ran (#108, R3-1).
```

becomes:

```js
// A decision that names its own disposition names one of the three (#108, R2-6): the skill
// records only fix, defer or accept, and every reader of the field matches those exact values,
// so any other would be neither checked at resolve nor demanded at the check. Until #99 a
// resolve task with files was demanded whatever the decision named. An empty string or a null
// names none, as every reader of the field reads it: it is dropped from the run's copy of the
// decision, so the resolve prompt shows none either, where until #108, R3-1 the check below
// refused it and a relaunch threw before any agent ran. Only those two name none: a blank
// string, or "", '' or null in quotes, which errorText also clears from an agent's error (#42),
// is a value outside the three here and is refused, since no path the skill records writes one
// (#108, R4-2).
```

The loop below it is unchanged in this task.

**Test.** No check: a comment. `empty decision disposition` and `bad decision disposition` stay green. Before committing, `grep -c "where the check above refused it" workflows/redline-loop.js` prints `0`. The standard's sentence is narrowed in the standards commit (`shape.md`, Standards retrospective, item 1), which names R4-2.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a comment.

**Commit:** `redline: R4-2 narrow the intake comment to the two values it reads as none (#99)`

## Task 4: R4-3, drop the disposition key with rest destructuring

`shape.md`, Unattended answer 7 and Decision 3. A small refactor; it follows Task 3.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`, the intake loop, the line (247):

```js
    decisions[id] = Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'disposition'))
```

becomes:

```js
    const { disposition: _dropped, ...rest } = entry
    decisions[id] = rest
```

**Test.** No check is added and no check's expectation changes: behaviour is unchanged (`shape.md`, Unattended answer 7). Before committing, with plain pipelines:

- `grep -c "Object.fromEntries(Object.entries(entry)" workflows/redline-loop.js` prints `0`.
- `grep -c "const { disposition: _dropped, ...rest } = entry" workflows/redline-loop.js` prints `1`.

The gate run after the change prints the same count as before it, with `empty decision disposition` and `bad decision disposition` green.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a refactor with the same behaviour.

**Commit:** `redline: R4-3 drop the disposition key with rest destructuring (#99)`

## Task 5: R4-4, choose the resolve resume clause by the stop

`shape.md`, Decision 4 and Proportionality.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-resolve.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `resume: the resolve agent's file says the same of a resumed resolve, as the resume line does` (1475), add:

```js
  // The clause is chosen by the stop (#108, R4-4): the autopilot stop is raised from the resolve
  // agent's own unresolved list, which its rules keep pending, so its resumed prompt ends with the
  // line alone. `resumedResolve` above is the neighbour: a check of the returned result keeps it.
  const unappliedStop = await go('resume: autopilot could not apply a recommendation', { ...baseArgs, interrupt: 'autopilot' }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], unresolved: [{ id: 'R1-1', why: 'no such option' }], commitIds: [['R1-1']] })
  const unappliedError = (unappliedStop.res || {}).error || ''
  const resumedUnapplied = await go('resume: autopilot could not apply a recommendation, resumed', { ...baseArgs, interrupt: 'autopilot', resume: { 'resolve r1': { attempt: 2, error: unappliedError, hand: { commits: [], paths: [] } } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], commitIds: [['R1-1']] })
  const resumedUnappliedPrompt = (pick(resumedUnapplied.calls, 'resolve r1') || { prompt: '' }).prompt
  check('resume: a resumed resolve after autopilot could not apply a recommendation ends with the resume line alone, with no clause to correct what it wrote', unappliedError.startsWith('autopilot could not apply the shaper\'s recommendation for R1-1') && resumedUnappliedPrompt.endsWith(line(unappliedError)) && !resumedUnappliedPrompt.includes(resolveClause), [unappliedError, resumedUnappliedPrompt.slice(-600)])
  check('resume: the resolve agent\'s file says a decision it could not apply stays pending on a resume, as the resume line leaves it', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('An error that says autopilot could not apply a decision is not that check'))
  // The predicate rests on every check of the resolve agent's returned result opening its error
  // with "the resolve agent ", and on the autopilot stop being the one resolve stop that does not.
  const opening = (text) => src.split(text).length - 1
  check('resume: every resolve stage error but the autopilot stop opens with "the resolve agent "', opening("stageError('resolve', `") === opening("stageError('resolve', `the resolve agent ") + 1 && opening("stageError('resolve', `autopilot could not apply ") === 1, [opening("stageError('resolve', `"), opening("stageError('resolve', `the resolve agent ")])
```

`line`, `resolveClause` and `resumedResolve` are the section's (1442, 1469, 1472); `src` is the script's text (18). See the first two checks fail on a gate run: the resumed prompt ends with the line and the clause, and the agent file holds no such sentence. The third holds before the change (`shape.md`, Decision 4). The existing check `resume: a resumed resolve is told the stop was the check of its own result and to correct what it wrote, and the relaunch finishes` (1474) is the neighbour that must not change.

**Change.**

1. In `workflows/redline-loop.js`, `resumeLine`, the comment and the first line of `const resolveFix` (574-578):

   ```js
     // A resolve stop is the workflow's check of what the resolve agent returned (#95, #97 R2-13,
     // #99), not a cause the person fixes by hand, and its first attempt has already turned the
     // pending entries and tasks into decided ones, so the rerun is told to correct what it wrote
     // (#108, R3-4).
     const resolveFix = opts.agentType === 'redline:redline-resolve'
   ```

   become:

   ```js
     // A resolve stop that is the workflow's check of what the resolve agent returned (#95, #97
     // R2-13, #99) is not a cause the person fixes by hand, and its first attempt has already turned
     // the pending entries and tasks into decided ones, so the rerun is told to correct what it wrote
     // (#108, R3-4). The clause is chosen by the stop, not by the agent alone (#108, R4-4): each of
     // those checks opens its error with "the resolve agent ", and neither the autopilot stop nor a
     // crash does. The autopilot stop is raised from the agent's own unresolved list, whose entries
     // its rules keep pending, so its rerun is told nothing more.
     const resolveFix = opts.agentType === 'redline:redline-resolve' && String(entry.error || '').startsWith('the resolve agent ')
   ```

   The two lines after it (the clause's text and `: ''`) and the `return` line are unchanged, so every other resumed prompt is as it was.

2. In `agents/redline-resolve.md`, section "Rules", the bullet that opens `- **On a resume.**` (line 32) ends:

   ```
   correct what the error names, and return the whole result again.
   ```

   Append to the same line, after that sentence:

   ```
    An error that says autopilot could not apply a decision is not that check: it was raised from your own `unresolved` list, its resume line carries no such sentence, and a decision still too unclear to turn into a task stays pending and under `unresolved`, as the rule above says.
   ```

   (one space, then the sentence). No other sentence of the agent file changes.

**Docs entry:** `workflows/redline-loop.js` and `agents/redline-resolve.md`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call". No reader-facing change: the bullet describes only the stops that check what the resolve agent returned, each of which keeps the clause; it says nothing of the autopilot stop's resume.

**Commit:** `redline: R4-4 choose the resolve resume clause by the stop (#99)`

## Task 6: R4-6, name a call whose decision names its own disposition in two comments

`shape.md`, Decision 6.

**Files:**

- `workflows/redline-loop.js`

**Change.** In `workflows/redline-loop.js`:

1. In `RESOLVE_SCHEMA`, the comment above `decided: {` (909-914):

   ```js
       // What each judgment call's decision ends in (#99), one entry per call the resolve applied.
       // The workflow reads a call's disposition from here, never from its deferred entry or its
       // task. An override names its own disposition, and a call left to the person under a rule has
       // none to read, so neither has an entry. The list is required, so an empty one means no call
       // was applied. A result recorded before #99 holds no list, and can replay only for a resolve
       // with no call, whose prompt did not change; resolveWith reads an absent list as empty.
   ```

   becomes:

   ```js
       // What each judgment call's decision ends in (#99), one entry per call the resolve was asked
       // to state. The workflow reads a call's disposition from here, never from its deferred entry
       // or its task. An override and a call whose decision names its own disposition (#108, R1-2)
       // name theirs, and a call left to the person under a rule has none to read, so none of them
       // has an entry. The list is required, so an empty one means no call needed a statement. A
       // result recorded before #99 holds no list, and can replay only for a resolve with no call,
       // whose prompt did not change; resolveWith reads an absent list as empty.
   ```

2. In `isDeferral`, the comment inside `if (decision) {` (3958-3962):

   ```js
         // An override names its disposition, and that decides (#103, R1-11): an override to fix or
         // accept leaves no deferral behind (awayFromDefer), whatever entry the resolve agent returns
         // beside it. A call's decision names none, and is read from what the resolve agent stated
         // for it (#99), never from the entry or the task beside it: resolveWith checked the
         // statement against both when the resolve returned.
   ```

   becomes:

   ```js
         // An override names its disposition, and that decides (#103, R1-11): an override to fix or
         // accept leaves no deferral behind (awayFromDefer), whatever entry the resolve agent returns
         // beside it, and so does a call whose decision names one (#108, R1-2). A call's decision that
         // names no disposition is read from what the resolve agent stated for it (#99), never from
         // the entry or the task beside it: resolveWith checked the statement against both when the
         // resolve returned.
   ```

**Test.** No check: comments, neither pinned. Before committing, with plain pipelines:

- `grep -c "so an empty one means no call needed a statement" workflows/redline-loop.js` prints `1`.
- `grep -c "A call's decision names none, and is read" workflows/redline-loop.js` prints `0`.

The check `defer: isDeferral reads a decided call from what the resolve agent states, ...` (`tests/loop-test.mjs:2918`) and the 100-column check on the comment above `isDeferral` (2917) stay green.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; comments.

**Commit:** `redline: R4-6 name a call whose decision names its own disposition in two comments (#99)`

## Task 7: R4-7 (defer, mitigation), say a dropped stray entry can still be listed in shape.md

`shape.md`, Decision 7. The finding is deferred; this task is its mitigation, and its drafted issue is under Deferred in `shape.md`.

**Files:**

- `docs/running.md`

**Change.** In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), the sentence:

```
A deferred entry beside a fix or an accept is dropped, so no draft is raised for it and no issue is opened, on any dial, with a warning in the run's result: `the resolve agent listed R1-4 as deferred and stated its decision as fix; the entry is dropped, since the statement decides`.
```

becomes:

```
A deferred entry beside a fix or an accept is dropped, so no draft is raised for it and no issue is opened, on any dial, with a warning in the run's result: `the resolve agent listed R1-4 as deferred and stated its decision as fix; the entry is dropped, since the statement decides`. The entry is dropped from the run's list only: the round's `shape.md`, which the resolve agent wrote, can still list the finding under `## Deferred` with its draft, as it can beside a disposition override to fix or accept, so the run's warning and the finding's reply are the record of what the round did (#108, R4-7).
```

No other sentence of the bullet changes.

**Test.** No check: a `docs/` sentence. Before committing, `grep -c "The entry is dropped from the run's list only" docs/running.md` prints `1`.

**Docs entry:** `docs/running.md` is reader-facing by nature; no entry of its own.

**Commit:** `redline: R4-7 say a dropped stray entry can still be listed in the round's shape.md (#99)`

## Task 8: R4-9, say in the resolve agent's file that an override's fix is a task of its own

`shape.md`, Unattended answer 6, Decision 9 and Decision 10. Decided by `@michaelfromtheoutfit`, 2026-11-18: "State it in the agent file only". The overrides block of the resolve prompt in `workflows/redline-loop.js` is not changed, so an overrides-only resolve keeps a byte-identical prompt (the spec's decision 13); `workflows/redline-loop.js` is not touched by this task.

What the checks enforce, which the agent file states: `namedUnplanned` and `namedPlanned` (3909-3916) read `taskFilesOf(out.tasks, id)` (479), the files of the task whose own `finding` is the override's id. So an override's fix needs a task of its own with files, and an accept override's own task carries no files, which means no other finding's change is folded into it. A change for the accepted finding planned in another finding's task does not stop the run, and the agent file does not say it does.

**Files:**

- `agents/redline-resolve.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check `filing: the resolve prompt of a run with overrides and no call asks for no disposition` (3353), add:

```js
  // An override's fix is held to the files of a task whose finding is its own id (namedUnplanned),
  // so the agent file says so; the overrides prompt stays as it was, so an overrides-only resolve
  // still replays after an update (#108, R4-9; the spec's decision 13).
  check('filing: the resolve agent\'s file asks for a task of its own for an override\'s fix', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('`fix` plans the full fix as a task of its own, its `finding` set to the override\'s id (files by path, the change, the test)'))
```

See it fail on a gate run (the agent file holds no such clause), then make the change and see it pass. The check before it, `filing: the resolve prompt of a run with overrides and no call asks for no disposition` (3353), and `filing: a resolve with overrides only and no decided list ends as it does with one` (3360) are the neighbours that must not change: the overrides prompt is untouched.

**Change.**

1. In `agents/redline-resolve.md`, section "What you do", step 3, the paragraph that opens `For a **disposition override**` (line 21):

   ```
   `fix` plans the full fix (files by path, the change, the test);
   ```

   becomes:

   ```
   `fix` plans the full fix as a task of its own, its `finding` set to the override's id (files by path, the change, the test), since the workflow holds an override's fix to the files of that task and a fix folded into another finding's task stops the run;
   ```

   and, in the same paragraph:

   ```
   `accept` turns the task into "Accepted, no change: <id>" with no files. A finding the shaper declined
   ```

   becomes:

   ```
   `accept` turns the task into "Accepted, no change: <id>" with no files, and no other finding's change is folded into that task. A finding the shaper declined
   ```

   No other sentence of the agent file changes.

2. In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), in the sentence that opens `What it names is checked the same way before anything is built (#108):`, the words:

   ```
   a fix with no task that names files
   ```

   become:

   ```
   a fix with no task of its own that names files
   ```

   No other sentence of the bullet changes.

**Test.** The check above, red then green. Before committing, with plain pipelines:

- `grep -c "a fix with no task that names files" docs/running.md` prints `0`.
- `grep -c "plans the full fix as a task of its own, its \`finding\` set to the override's id" agents/redline-resolve.md` prints `1`.
- `grep -c "and no other finding's change is folded into that task" agents/redline-resolve.md` prints `1`.
- `grep -c "no other finding's task carries a change for it" agents/redline-resolve.md` prints `0`.
- `git diff --cached --name-only`, with this task's files staged, lists only the three files above.

**Docs entry:** `agents/redline-resolve.md`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call", changed in this task's commit.

**Commit:** `redline: R4-9 say in the resolve agent's file that an override's fix is a task of its own (#99)`

## Task 9: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-4/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1449 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 3 to 6) and `agents/redline-resolve.md` (Tasks 5 and 8), each with the section and the reason given in its task; `docs/running.md` (Tasks 2, 7 and 8) is reader-facing by nature. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.2`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`; item 3, held for R4-9 until it was decided, is drafted for the option chosen. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/agents.md` and `agent-os/standards/workflow/replay.md`, titled `redline: record the round 4 review lessons in the standards, finishing R4-2 (#99)` when item 1 is approved, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 4 for PR #108 (#99)`.

**Files** (this task): `agent-os/standards/workflow/agents.md` and `agent-os/standards/workflow/replay.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-18-1026-108-review-round-4/plan.md` and `shape.md` (As built and any deviation).

## As built

Built as planned, with no deviation; `shape.md` gains no Decisions entry.

| Task | Commit | Evidence |
| --- | --- | --- |
| Task 1 | `af3de86` | spec folder only, nothing under `redline/` |
| Task 2, R4-1 | `386cd20` | `grep -c "The first is kept whatever it holds" docs/running.md` printed `1` |
| Task 3, R4-2 | `db80099` | `grep -c "where the check above refused it" workflows/redline-loop.js` printed `0` |
| Task 4, R4-3 | `18675f7` | the two greps printed `0` and `1`; the red run of Task 5 passed every earlier check, `empty decision disposition` and `bad decision disposition` included |
| Task 5, R4-4 | `6df0664` | red: `1446 checks passed, 2 failed`, the two expected checks (the resumed prompt ended with the line and the clause; the agent file held no such sentence); the source check held before the change, as planned. Green: loop exit 0, 1448 checks |
| Task 6, R4-6 | `bbe52bc` | the two greps printed `1` and `0` |
| Task 7, R4-7 (mitigation) | `ec6f563` | `grep -c "The entry is dropped from the run's list only" docs/running.md` printed `1` |
| Task 8, R4-9 | `36f9bef` | red: `1448 checks passed, 1 failed`, the agent-file check; green: loop exit 0, 1449 checks. The four greps printed `0`, `1`, `1`, `0`; the staged names were the three files the task lists |
| Standards | `14f26e8` | the three approved edits, to `workflow/agents.md` line 24 and `workflow/replay.md` lines 19 and 23, in a commit naming R4-2 |

**Counts.** The loop reads 1449 checks, as planned (1444 before the round, 4 from Task 5, 1 from Task 8). `checks.sh` records a passing check's exit and no output, so each green count is the red run's total with its failures turned to passes; the final gate run, after the standards commit, returned `ok: true`, every check at exit 0, and no `unexpected_files` or `uncommitted` entry.

**Gate items 10 to 12.** Docs entries are as each task names them. `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.2`. The standards retrospective applied the three edits the standards approver approved, items 1 to 3 of `shape.md`'s proposal.
