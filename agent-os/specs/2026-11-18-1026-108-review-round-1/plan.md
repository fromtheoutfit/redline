# PR #108 review round 1: the forced guard on a stated fix, and what the resolve prompt asks of a named call

Spec folder: `agent-os/specs/2026-11-18-1026-108-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #108 (issue #99), from the round's eight findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- `fix`, one task each, in finding order: R1-1 (Task 2), R1-2 (Task 3), R1-5 (Task 4), R1-7 (Task 5), R1-8 (Task 6). R1-5 is a fix by the person's disposition override of the shaper's deferral (`shape.md`, Decision 5); nothing is deferred, so nothing is filed.
- `decline`, no task: R1-3, R1-4, R1-6. Their reasons are under `## Declined` in `shape.md`.
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#99)`. No commit subject holds a bare `@word`.

Line numbers are at `253052a`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.2`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-resolve.md`** (the pull request's own caution, "a round on it that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file, which the skill lists (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). The agent file's edit is one clause that agrees with the prompt either way (`shape.md`, Unattended answer 9).

**Task order matters in two files.**

- `workflows/redline-loop.js`:
  - Task 3 adds four lines after `const anyRule` (2043) and changes the end of the `decided` ask (2072).
  - Task 4 adds a sentence to the end of the comment above `const statements` (3780-3782), replaces the `unentered` block and its comment (3825-3832), and adds two checks after the `planned` check (3853-3856).
  - Task 5 adds a helper after `const unique` (459), and changes `taskFiles` (3843) and `plannedFiles` (3881).
  - Task 6 changes the comment above `needCommits` (4055-4061) and its last line (4065).
- `tests/loop-test.mjs`:
  - Task 3 adds two checks right after the check named `filing: a call whose decision names a fix is demanded: left unbuilt, the round stops at the check` (line 3236).
  - Task 4 adds one comment line and one key to the resolve mock (lines 254 and 272), and four runs and four checks right after the check named `filing: a call stated as accepted beside a task with files stops at resolve, resumable there, before the plan approver` (line 3256), since they read `stopsAtResolve` (3243).
  - Task 5 adds one check right after the check named `defer: plannedFiles reads the shaper's own list through shaperFiles alone, with no second test of it` (line 2868).
  - Task 6 adds one line to the shaper mock (after line 228), and one run and two checks right after Task 4's checks.
- `docs/running.md`: Task 2 changes a clause in the middle of the bullet "A deferral you chose at a call", and Task 4 adds a sentence at its end.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a check adds it first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-1/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round, the loop prints `1416 checks passed, 0 failed` (the pull request's description and its spec's As built), and the other harnesses print what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 0 | a docs sentence; no harness reads it |
| Task 3 | 2 | the prompt's sentence on a named call, and the agent file's clause |
| Task 4 | 5 | four named checks (three stops and the allowance's neighbour), and the run-record check `go` adds to the neighbour's run, which reaches Finish |
| Task 5 | 1 | a source check on the helper |
| Task 6 | 3 | two named checks, and the run-record check `go` adds to a run that reaches Finish |

So the loop reads `1427 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-18-1026-108-review-round-1/plan.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-1/shape.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-1/standards.md`
- `agent-os/specs/2026-11-18-1026-108-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #108 (#99)`

## Task 2: R1-1, name every label the resolve stop takes in docs/running.md

`shape.md`, Decisions 2 and 3.

**Files:**

- `docs/running.md`

In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call" (line 126), the clause:

```
stops the run at stage `resolve`, resumable at `resolve r<n>`, where the resolve agent runs again, and nothing is posted:
```

becomes:

```
stops the run at stage `resolve`, resumable at the resolve step that ran (`resolve r<n>`, `resolve r<n> #<k>` for a call a reshape raised, or `resolve h<n>` in a human review pass), where the resolve agent runs again, and nothing is posted:
```

No other sentence of the bullet changes.

**Test.** None: no harness reads this sentence (`grep -n "resolve r<n>" tests/loop-test.mjs` prints nothing). The labels are the workflow's: the resolve label is built from the pass's tag and a suffix (`workflows/redline-loop.js:3760`), the suffix is `' #<k>'` for a reshape's raised calls (3990), and the tag is `h<n>` in a human review pass (438).

**Docs entry:** this task is the `docs/` change itself; a change to `docs/` needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R1-1 name every label the resolve stop takes (#99)`

## Task 3: R1-2, ask no statement of a call whose decision names its own disposition

`shape.md`, Unattended answer 3 and Decision 4.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-resolve.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `filing: a call whose decision names a fix is demanded: left unbuilt, the round stops at the check` (line 3236), add:

```js
  // A call whose decision names its own disposition is asked for no statement (#108, R1-2), as
  // a call left to the person under a rule is not: the prompt says so only when a call carries
  // one (`callResolve` below holds no such sentence), and the agent file says it too.
  const NAMED_EXEMPT = 'A call whose decision carries `disposition` names its own and has no entry in decided.'
  const namedResolve = (pick(namedCall.calls, 'resolve r1') || { prompt: '' }).prompt
  check('filing: the resolve prompt says a call whose decision names its own disposition has no entry in decided', namedResolve.includes(NAMED_EXEMPT), namedResolve.slice(-1500))
  check('filing: the resolve agent\'s file says a call whose decision carries a disposition has no entry in decided', fs.readFileSync(path.join(here, '..', 'agents', 'redline-resolve.md'), 'utf8').includes('and so does a call whose decision carries `disposition`'))
```

See both fail on a gate run.

The neighbour that must not change is already pinned: the check named `filing: the resolve prompt of a run with a call asks for each call's disposition and says an entry is returned only for a decision that defers` (line 3266) requires that a call with no named disposition (`strayResolve`) has a prompt holding no `has no entry in decided`.

**Change.** In `workflows/redline-loop.js`, `resolvePrompt`:

1. Right after the line (2043):

   ```js
     const anyRule = Object.values(callDecisions).some((d) => d && d.rule)
   ```

   add:

   ```js
     // A call whose decision names its own disposition decides as an override's does, so no
     // statement is asked of it (#99, its spec's decision 17), and the sentence that says so is in
     // the prompt only when a call carries one, as for a rule (#108, R1-2).
     const anyNamed = Object.values(callDecisions).some((d) => d && d.disposition)
   ```

2. At the end of the `decided` ask (2072), the tail:

   ```js
   So return a deferred entry for a call only when its decision defers the finding (#97, R2-15; #99).${anyRule ? ' A call whose decision carries `rule` is left to the person and has no entry in decided.' : ''}`,
   ```

   becomes:

   ```js
   So return a deferred entry for a call only when its decision defers the finding (#97, R2-15; #99).${anyRule ? ' A call whose decision carries `rule` is left to the person and has no entry in decided.' : ''}${anyNamed ? ' A call whose decision carries `disposition` names its own and has no entry in decided.' : ''}`,
   ```

   A forced call has its `disposition` deleted before the prompt is built (3749), so a call never carries both `disposition` and `rule`. A prompt with no such call is byte-identical to what it was, so every recorded resolve still replays (workflow/replay, line 23).

3. In `agents/redline-resolve.md`, the last sentence of the "State what each call's decision ends in" paragraph (line 24):

   ```
   A disposition override names its own disposition, and a decision carrying `rule` is left to the person: neither has an entry in `decided`.
   ```

   becomes:

   ```
   A disposition override names its own disposition, and so does a call whose decision carries `disposition`; a decision carrying `rule` is left to the person: none of these has an entry in `decided`.
   ```

   No other sentence of the agent file changes.

The comment above `const statements` (3780-3782) already says neither such call "is asked for one"; with this change the prompt agrees with it.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call". No reader-facing change: the bullet already says that a disposition you changed yourself "names its own and needs no statement"; the new sentence tells the resolve agent the same.
- `agents/redline-resolve.md`: the same section. No reader-facing change, for the same reason.

**Commit:** `redline: R1-2 ask no statement of a call that names its own disposition (#99)`

## Task 4: R1-5, hold a decision that names its own disposition to the resolve-time checks, by what it names

`shape.md`, Decision 5: the person's disposition override to `fix` of the shaper's deferral. The fix is the shaper's draft's full fix (`shape.md`, "Overruled deferral (not filed)"). The code comment the shaper planned as a mitigation is not written.

The three checks run over every decision `resolveWith` applied, forced findings excluded, by its effective disposition: a call with no named disposition by what the resolve agent stated (`asked`, unchanged, with its three checks and messages as they are), and a decision that names its own disposition (an override, or a call whose decision carries `disposition`) by what it names. A named deferral keeps the allowance `unentered` makes for an entry the round already holds (the shaper's own deferral), and a defer override's message is byte-identical, so the existing check `defer: a defer override with no deferred entry stops at resolve, resumable there` (line 2982) is the unchanged neighbour.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`:

1. In the resolve mock, right after the line (254):

   ```js
         // scenario.resolveDeferred (#94, R5-9): the deferred list the resolve agent returns.
   ```

   add:

   ```js
         // scenario.resolveFiles[id] (#108, R1-5) scripts one task's files, [] for none, whatever its decision.
   ```

2. In the resolve mock's return (272), the task's files:

   ```js
   files: accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id
   ```

   become:

   ```js
   files: scenario.resolveFiles && id in scenario.resolveFiles ? scenario.resolveFiles[id] : accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id
   ```

   No existing scenario sets `resolveFiles`, so every existing run is unchanged.

3. Right after the check named `filing: a call stated as accepted beside a task with files stops at resolve, resumable there, before the plan approver` (line 3256; it reads `stopsAtResolve`, `stopDetail` and `oneCall`, defined at 3243-3245), add:

   ```js
     // A decision that names its own disposition is held to the same three checks, by what it names
     // (#108, R1-5): until #108 only a defer override was, by its entry. A call whose decision names
     // a deferral and comes back with no deferred entry, a decline the person overrules to a fix
     // planned with no task with files, and a fix the person changes to accept planned beside a task
     // with files each stop at resolve before the plan approver. Their neighbours run on: `namedCall`
     // above (a named fix with files), `fixAccepted` (an accept override with no files), and the
     // shaper's own deferral below, which stands in for a defer override's entry as before.
     const deferNamed = { 'R1-1': { choice: 'defer', notes: 'Defer it behind a log line.', date: '2026-11-18', disposition: 'defer' } }
     const namedDeferNoEntry = await go('filing: a call whose decision names a deferral, with no deferred entry', { ...baseArgs, decisions: deferNamed }, { ...oneCall, resolveUnstated: ['R1-1'] })
     check('filing: a call whose decision names a deferral with no deferred entry stops at resolve, resumable there, before the plan approver', stopsAtResolve(namedDeferNoEntry, 'the resolve agent returned no deferred entry for R1-1, which its decision deferred; a deferred item always carries a drafted issue'), stopDetail(namedDeferNoEntry))
     const fixOverrideNoFiles = await go('filing: a decline the person overrules to a fix, planned with no task with files', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'fix', notes: 'Fix it in full.', date: '2026-11-18', disposition: 'fix' } } }, { reviews: [[f('R1-1', 'correctness')]], decline: ['R1-1'], resolveFiles: { 'R1-1': [] }, commitIds: [['R1-1']] })
     check('filing: an override to fix planned with no task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(fixOverrideNoFiles, 'the resolve agent planned no task with files for R1-1, which a disposition override names as a fix; a fix names the files it changes'), stopDetail(fixOverrideNoFiles))
     const acceptOverrideWithFiles = await go('filing: a fix the person changes to accept, planned with a task with files', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: { 'R1-1': { choice: 'accept', notes: 'Keep it as it is.', date: '2026-11-18', disposition: 'accept' } } }, { reviews: [[f('R1-1', 'correctness')]], resolveFiles: { 'R1-1': ['app/x.php'] }, commitIds: [[]] })
     check('filing: an override to accept planned beside a task with files stops at resolve, resumable there, before the plan approver', stopsAtResolve(acceptOverrideWithFiles, 'the resolve agent planned a task with files for R1-1 (app/x.php), which a disposition override names as accepted; an accepted finding changes nothing'), stopDetail(acceptOverrideWithFiles))
     const restatedBare = await go('filing: a defer override on the shaper\'s own deferral, with no entry from the resolve agent', { ...baseArgs, interrupt: 'plan', approvedPlans: [1], decisions: deferNamed, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], commitIds: [['R1-1']] })
     check('filing: a defer override whose entry the round already holds from the shaper runs on past resolve with no entry of its own', !(restatedBare.res.status === 'error' && restatedBare.res.stage === 'resolve') && labels(restatedBare.calls).includes('plan approver r1'), stopDetail(restatedBare))
   ```

See the first three fail on a gate run. The fourth is the neighbour and is green before and after the change; say so under As built. If the neighbour's run does not reach Finish, it adds no run-record check: record the count under As built with that reason.

**Change.** In `workflows/redline-loop.js`, `resolveWith`:

1. The end of the comment above `const statements` (3780-3782 at `253052a`, four lines lower after Task 3):

   ```js
       // its own disposition decides as an override's does (#103, R1-11), and a call left to the
       // person under a rule has no disposition to read, so neither is asked for one.
   ```

   becomes:

   ```js
       // its own disposition decides as an override's does (#103, R1-11), and a call left to the
       // person under a rule has no disposition to read, so neither is asked for one. A decision
       // that names its own disposition is checked below by what it names (#108, R1-5).
   ```

2. The `unentered` block and its comment (3825-3832):

   ```js
       // A deferral the person chose by a disposition override comes back with its entry (#97,
       // R2-13): one the resolve agent left out would be neither drafted nor filed, and its reply would
       // close the person's deferral with no issue and no warning. An entry the round already holds
       // for it (the shaper's own deferral) stands in, as it does when the resolve returns none.
       const unentered = newOverrides.filter((f) => roundDecisions[f.id].disposition === 'defer' && !fresh.some((item) => item.id === f.id) && !deferred.some((d) => d.id === f.id))
       if (unentered.length) {
         throw stageError('resolve', `the resolve agent returned no deferred entry for ${unentered.map((f) => f.id).join(', ')}, which a disposition override deferred; a deferred item always carries a drafted issue`)
       }
   ```

   becomes:

   ```js
       // A decision that names its own disposition, an override or a call whose decision carries
       // one, is checked by what it names, as a stated call is by its statement (#108, R1-5); a
       // finding left to the person under a rule names none (its disposition was deleted above).
       // Until #108 only a defer override was checked, by its entry.
       const named = newCalls.map((call) => call.id).concat(newOverrides.map((f) => f.id)).filter((id) => !record.forced[id] && roundDecisions[id].disposition)
       const namedAs = (disposition) => named.filter((id) => roundDecisions[id].disposition === disposition)
       const whose = (id) => (newOverrides.some((f) => f.id === id) ? 'a disposition override' : 'its decision')
       // A deferral the person chose comes back with its entry (#97, R2-13): one the resolve agent
       // left out would be neither drafted nor filed, and its reply would close the person's
       // deferral with no issue and no warning. An entry the round already holds for it (the
       // shaper's own deferral) stands in, as it does when the resolve returns none.
       const unentered = namedAs('defer').filter((id) => !fresh.some((item) => item.id === id) && !deferred.some((d) => d.id === id))
       if (unentered.length) {
         throw stageError('resolve', `the resolve agent returned no deferred entry for ${unentered.map((id) => `${id}, which ${whose(id)} deferred`).join('; ')}; a deferred item always carries a drafted issue`)
       }
   ```

   For one defer override the message is the one it was, word for word.

3. Right after the `planned` check (3853-3856):

   ```js
       const planned = statedAs('accept').filter((id) => taskFiles(id).length > 0)
       if (planned.length) {
         throw stageError('resolve', `the resolve agent stated accept beside a task with files for ${planned.map((id) => `${id} (${taskFiles(id).join(', ')})`).join(', ')}; an accepted finding changes nothing`)
       }
   ```

   add:

   ```js
       // A decision that names a fix or an accept is held to its tasks the same way (#108, R1-5):
       // until #108 a named fix with no task with files stopped at the check after a repair, which
       // resumes at the build and cannot replan, and a named accept beside a task with files was built.
       const namedUnplanned = namedAs('fix').filter((id) => taskFiles(id).length === 0)
       if (namedUnplanned.length) {
         throw stageError('resolve', `the resolve agent planned no task with files for ${namedUnplanned.map((id) => `${id}, which ${whose(id)} names as a fix`).join('; ')}; a fix names the files it changes`)
       }
       const namedPlanned = namedAs('accept').filter((id) => taskFiles(id).length > 0)
       if (namedPlanned.length) {
         throw stageError('resolve', `the resolve agent planned a task with files for ${namedPlanned.map((id) => `${id} (${taskFiles(id).join(', ')}), which ${whose(id)} names as accepted`).join('; ')}; an accepted finding changes nothing`)
       }
   ```

   Task 5 later changes only the body of `taskFiles`, which these lines call.

4. In `docs/running.md`, section "Deferred items", bullet "A deferral you chose at a call", the bullet's last sentence:

   ```
   A disposition you changed yourself (`<id>: <fix|defer|accept>. <reason>`) names its own and needs no statement.
   ```

   becomes:

   ```
   A disposition you changed yourself (`<id>: <fix|defer|accept>. <reason>`) names its own and needs no statement. What it names is checked the same way before anything is built (#108): a fix with no task that names files, or an accept beside a task that names files, stops the run at stage `resolve` as a statement does, and so does a deferral with no deferred entry, unless the round already holds the shaper's own entry for it.
   ```

   No other sentence of the bullet changes; Task 2's clause, earlier in the bullet, is untouched.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A deferral you chose at a call", the sentence this task adds (a reader-facing change: an override to fix or accept, or a named deferral, can now stop at `resolve`).

**Commit:** `redline: R1-5 hold a named decision to the resolve-time checks (#99)`

## Task 5: R1-7, read a finding's task files through one helper

`shape.md`, Unattended answer 8 and Decision 6.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `defer: plannedFiles reads the shaper's own list through shaperFiles alone, with no second test of it` (line 2868), add:

```js
  check('defer: a finding\'s task files are read through one helper, by the resolve-time checks and by plannedFiles (#108, R1-7)', src.includes('const taskFilesOf = (tasks, id) =>') && src.includes('taskFilesOf(out.tasks, id)') && src.includes('taskFilesOf(resolvedTasks, id)') && !src.includes('unique(out.tasks.filter((task) => task.finding === id)') && !src.includes('unique(resolvedTasks.filter((task) => task.finding === id)'))
```

See it fail on a gate run.

**Change.** In `workflows/redline-loop.js`:

1. Right after the line (459):

   ```js
   const unique = (list) => [...new Set(list)]
   ```

   add:

   ```js
   // The files of the tasks a list holds for one finding (#108, R1-7): the resolve-time checks read
   // one resolve's tasks, plannedFiles every resolve's of the round, and both read them this way.
   const taskFilesOf = (tasks, id) => unique(tasks.filter((task) => task.finding === id).flatMap((task) => task.files))
   ```

   The name is not `filesOf`, which `draftsOf` already uses for its reader parameter (3670).

2. In `resolveWith` (3843):

   ```js
       const taskFiles = (id) => unique(out.tasks.filter((task) => task.finding === id).flatMap((task) => task.files))
   ```

   becomes:

   ```js
       const taskFiles = (id) => taskFilesOf(out.tasks, id)
   ```

3. `plannedFiles` (3881):

   ```js
     const plannedFiles = (id) => (roundDecisions[id] ? unique(resolvedTasks.filter((task) => task.finding === id).flatMap((task) => task.files)) : shaperFiles(id))
   ```

   becomes:

   ```js
     const plannedFiles = (id) => (roundDecisions[id] ? taskFilesOf(resolvedTasks, id) : shaperFiles(id))
   ```

Behaviour is unchanged: every existing loop check stays green with its expectation as it is.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items". No reader-facing change: one expression moved into a helper, behaviour unchanged.

**Commit:** `redline: R1-7 read a finding's task files through one helper (#99)`

## Task 6: R1-8, keep the forced guard on a stated fix's demand

`shape.md`, Decision 1 and the Proportionality entry for R1-8.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the shaper mock, right after the line (228):

   ```js
             ...(scenario.askRule && scenario.askRule[id] ? { askRule: scenario.askRule[id] } : {}),
   ```

   add:

   ```js
             // scenario.reshapeAskRule (#108, R1-8) adds an ask-rule tag on a reshape alone, as a
             // reshape that newly puts a decided call under a rule returns it.
             ...(reshape && scenario.reshapeAskRule && scenario.reshapeAskRule[id] ? { askRule: scenario.reshapeAskRule[id] } : {}),
   ```

2. Right after Task 4's checks, add:

   ```js
     // A call stated as a fix that a reshape then leaves to the person under a rule is not
     // demanded (#108, R1-8), as the clause the statement replaced had it: the finding is posted
     // as left to the person. Its neighbour, a call stated as a fix and not forced, is demanded
     // (`strayFilledUnbuilt` above).
     const billingRule = [{ id: 'billing', when: { prose: 'the change alters what a customer is charged' }, reason: 'Billing changes are reviewed by finance' }]
     const forcedLater = await go('filing: a call stated as a fix that a reshape leaves to the person under a rule, the fix left out', { ...baseArgs, askRules: billingRule, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-18' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeAskRule: { 'R1-1': 'billing' }, commitIds: [[], []] })
     const forcedReply = replyFor(forcedLater.calls, 'push and reply r1', 'R1-1')
     check('filing: a call stated as a fix that a reshape leaves to the person under a rule is not demanded, so the round finishes with no repair', forcedLater.res.status === 'done' && !labels(forcedLater.calls).includes('repair r1'), [forcedLater.res.status, forcedLater.res.stage, forcedLater.res.error, labels(forcedLater.calls).slice(-6)])
     check('filing: that call is posted as left to the person under the rule', forcedReply.startsWith('Redline round 1: left to @author under repository rule billing'), forcedReply)
   ```

See the first check fail on a gate run: the round stops at the check after a repair with `no commit names R1-1` (the reviewer's trace; `shape.md`, Decision 1). If the second check is already green before the change, say so under As built: the reply is read from `outcomesFor`, which keeps its forced test, so only the first check turns on this clause.

**Change.** In `workflows/redline-loop.js`, `needCommits`:

1. The comment above it (4055-4061):

   ```js
     // What the check demands of a call the person or autopilot decided is read from what the
     // resolve agent stated for it, and from nothing else (#99): a call stated as a fix is demanded
     // whatever entry stood beside it and whatever a reshape made of its finding, and one stated as
     // a deferral or as accepted is not, whatever its task lists. Until #99 a call's fix was
     // demanded through the resolve's tasks, any with files whose finding was not read as a
     // deferral, the inference isDeferral made from the other side. Every other finding is demanded
     // by its final disposition, as before.
   ```

   becomes:

   ```js
     // What the check demands of a call the person or autopilot decided is read from what the
     // resolve agent stated for it, and from nothing else (#99): a call stated as a fix is demanded
     // whatever entry stood beside it and whatever a reshape made of its finding, and one stated as
     // a deferral or as accepted is not, whatever its task lists. One exception: a call a reshape
     // leaves to the person under a rule after its resolve is demanded of nothing, as isDeferral
     // and the outcomes treat it, and as the clause before #99 had it (#108, R1-8). Until #99 a
     // call's fix was demanded through the resolve's tasks, any with files whose finding was not
     // read as a deferral, the inference isDeferral made from the other side. Every other finding
     // is demanded by its final disposition, as before.
   ```

2. Its last line (4065):

   ```js
       .concat(Object.keys(stated).filter((id) => stated[id] === 'fix'))
   ```

   becomes:

   ```js
       .concat(Object.keys(stated).filter((id) => stated[id] === 'fix' && !record.forced[id]))
   ```

**Docs entry:** `workflows/redline-loop.js`: `docs/contract.md`, "Ask rules" ("A finding a rule covers is the person's"), and `docs/running.md`, "Deferred items". No reader-facing change: it restores what the base branch did for a finding a reshape leaves to the person under a rule, which is posted as left to them with no commit demanded, as "Ask rules" already says.

**Commit:** `redline: R1-8 keep the forced guard on a stated fix's demand (#99)`

## Task 7: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-18-1026-108-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1427 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 3 to 6) and `agents/redline-resolve.md` (Task 3), each with the section and the reason given in its task; `docs/running.md` (Tasks 2 and 4) is reader-facing by nature, and Task 4's sentence is the entry for its workflow change. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.2`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 1 for PR #108 (#99)`.
