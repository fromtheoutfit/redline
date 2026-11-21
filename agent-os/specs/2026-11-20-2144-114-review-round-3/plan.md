# PR #114 review round 3: the ask rules' reading of a path, a second resolve for an override, and two docs sentences

Spec folder: `agent-os/specs/2026-11-20-2144-114-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #114 (issue #106), from the round's four findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `fix`, one task each, in finding order: R3-1 (Task 2), R3-2 (Task 3), R3-3 (Task 4), R3-4 (Task 5).
- No `decline`, no `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#106)`. No commit subject holds a bare `@word`.

Line numbers are at `9ea3ea9`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines (Task 4 adds lines near the top of `workflows/redline-loop.js` and inside the rules block of `tests/loop-test.mjs`, so every later line there shifts). An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `skills/` or `agents/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`**, which the pull request's own caution names ("a round that edits either meets #81"). A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). No agent file changes.

**Task order matters in two files.**

- `docs/running.md`: Task 2 changes one sentence of line 127, Task 3 one sentence of line 208.
- `workflows/redline-loop.js`:
  - Task 4 replaces the comment above `relPath` (481-482) and the comment and body of `ruleForPaths` (533-544).
  - Task 5 replaces the comment above `const decidedFiles = {}` (3821-3825) and the loop that sets it in `resolveWith` (3999-4001).
- `tests/loop-test.mjs`:
  - Tasks 2 and 3 each add one element to the end of the `docs/running.md` phrase list (2939), Task 3's after Task 2's.
  - Task 4 adds a block after the `viaFiles` check (1440).
  - Task 5 changes the resolve mock's `tasks` line (296) and adds a block after the `raisedLater` check (3383).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task adds its checks first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-3/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round, the loop prints `1539 checks passed, 0 failed` (round 2's As built), and the other harnesses print what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 1 | one docs phrase pin |
| Task 3 | 1 | one docs phrase pin |
| Task 4 | 9 | four form checks (no run-record check: each run stops at the forced call), the folded-outside check and its run-record check, the reshape check and its run-record check, and the contract pin |
| Task 5 | 6 | three named checks on two runs, their two run-record checks, and the `raisedLater` neighbour |

So the loop reads `1556 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md` (a run that does or does not reach Finish adds or drops the run-record check `go` adds).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-20-2144-114-review-round-3/plan.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-3/shape.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-3/standards.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #114 (#106)`

## Task 2: R3-1, record what the base showed a decided finding before #106

`shape.md`, Decision 1 and Unattended answer 6.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the `docs/running.md` phrase list (2939), the end of the line:

```js
'the stop\'s `detail` lists it under `reshaped`']],
```

becomes:

```js
'the stop\'s `detail` lists it under `reshaped`', 'whenever it was shown as a deferral, whether its decision named one']],
```

See `defer: docs/running.md says "whenever it was shown as a deferral, whether its decision named one"` fail on a gate run.

**Change.** In `docs/running.md`, section "Deferred items", bullet "A reshape after your decision" (127), the sentence:

```
Before #106 a deferral you set yourself (`<id>: defer. <reason>`) was shown its task as first planned, and every other finding you or the autopilot decided was shown the shaper's list from before the decision, then the reshape's own.
```

becomes:

```
Before #106 a finding you or the autopilot decided was shown its task as first planned whenever it was shown as a deferral, whether its decision named one (`<id>: defer. <reason>`) or a reshape had re-sorted it to one, and otherwise the shaper's list from before the decision, then the reshape's own.
```

No other sentence of the bullet changes. Every phrase the list already pins for this bullet stays in it.

**Docs entry:** `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R3-1 say which decided findings were shown their first-planned task before #106 (#106)`

## Task 3: R3-2, say the resume after the hold corrects the task in place

`shape.md`, Decision 2 and Unattended answer 7.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the same phrase list (2939), the end of the line as Task 2 leaves it:

```js
'whenever it was shown as a deferral, whether its decision named one']],
```

becomes:

```js
'whenever it was shown as a deferral, whether its decision named one', 'except after the stop that holds a decided finding to its task after a reshape']],
```

See `defer: docs/running.md says "except after the stop that holds a decided finding to its task after a reshape"` fail on a gate run.

**Change.** In `docs/running.md`, section "Run markers and resume" (208), the sentence:

```
A resume at the shape stage reruns the shaper, which rewrites the four spec files and never touches `redline/`.
```

becomes:

```
A resume at the shape stage reruns the shaper, which never touches `redline/` and rewrites the four spec files, except after the stop that holds a decided finding to its task after a reshape, where it corrects that task and keeps the decided entries ("A reshape after your decision" above).
```

No other sentence of the paragraph changes.

**Docs entry:** `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R3-2 say a resume after the hold of a decided task corrects it in place (#106)`

## Task 4: R3-3, match a paths rule on a path as written and as the round keeps it

`shape.md`, Decision 3 and Unattended answer 5.

**Files:**

- `workflows/redline-loop.js`
- `docs/contract.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the rules block, right after the check (1440):

```js
  check('rules: the shaper\'s files force the ask', viaFiles.res.status === 'handoff' && viaFiles.res.judgmentCalls[0].forced.rule === 'craft-config', viaFiles.res)
```

add:

```js
  // A paths rule reads a path as the round keeps it as well as as written (#114, R3-3), a case per
  // form the cleanup folds: a doubled slash, a ./ segment and padding. Until R3-3 the rules read
  // the written form alone, so these were never forced while the round kept and showed the folded
  // path, which is under the rule. Beside them, the form that is under the rule as written and that
  // the cleanup drops, a directory's trailing slash, is still forced, and a path that folds to one
  // outside the rule forces nothing.
  const forcedAs = (r) => ((((r.res || {}).judgmentCalls || [])[0] || {}).forced || {}).rule
  for (const form of ['config//project/project.yaml', 'config/./project/project.yaml', ' config/project/project.yaml ', 'config/project/']) {
    const r = await go(`rules: a task that writes under a paths rule, listed as ${JSON.stringify(form)}`, ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', form] }, commitIds: [[]] })
    check(`rules: the shaper's files force the ask when they list ${JSON.stringify(form)}`, (r.res || {}).status === 'handoff' && forcedAs(r) === 'craft-config', [(r.res || {}).status, (r.res || {}).error, forcedAs(r)])
  }
  const foldedOutside = await go('rules: a task listed with a path that folds to one outside the paths rule', ruleArgs, { reviews: [[f('R1-1', 'correctness')], []], files: { 'R1-1': ['app/x.php', 'config//project.yaml'] }, commitIds: [['R1-1']] })
  check('rules: a path that folds to one outside the paths rule forces nothing, and the fix is built', (foldedOutside.res || {}).status === 'done' && JSON.stringify((foldedOutside.res || {}).forced || []) === '[]', [(foldedOutside.res || {}).status, (foldedOutside.res || {}).error, (foldedOutside.res || {}).forced])
  // The reshape's list is read the same way (#114, R3-3): a call answered with a fix whose task a
  // reshape lists under a paths rule with a doubled slash is left to the person under the rule at
  // that reshape, as one listed as written is, and the round finishes with no repair. Until R3-3
  // it stayed tracked, its list became the folded path under the rule, and the fix was demanded.
  const billingPaths = [{ id: 'billing-code', when: { paths: ['app/billing/**'] }, reason: 'Billing code is changed by finance' }]
  const reshapedUnder = await go('rules: a call answered with a fix whose task a reshape lists under a paths rule with a doubled slash', { ...baseArgs, askRules: billingPaths, decisions: { 'R1-1': { choice: 'Change it', notes: 'Fix it now.', date: '2026-11-21' } } }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeFiles: { 'R1-1': ['app//billing/charge.php'] }, commitIds: [[], []] })
  const reshapedUnderReply = replyFor(reshapedUnder.calls, 'push and reply r1', 'R1-1')
  check('rules: a decided finding whose task a reshape lists under a paths rule with a doubled slash is left to the person under the rule, with no repair', (reshapedUnder.res || {}).status === 'done' && !labels(reshapedUnder.calls).includes('repair r1') && reshapedUnderReply.startsWith('Redline round 1: left to @author under repository rule billing-code'), [(reshapedUnder.res || {}).status, (reshapedUnder.res || {}).error, labels(reshapedUnder.calls).slice(-6), reshapedUnderReply])
  check('rules: docs/contract.md says a paths rule reads a path as listed and as the run keeps it', fs.readFileSync(path.join(here, '..', 'docs', 'contract.md'), 'utf8').includes('read as listed and also as the run keeps a task'))
```

`ruleArgs` (the `craft-config` rule on `config/project/**` and the `billing` prose rule) and `f` are declared above in the same block (1365-1373); `baseArgs`, `labels`, `replyFor`, `fs`, `path` and `here` are top-level. See five checks fail on a gate run: the three folded forms are not forced (the shaper's fix goes on, with no commit, to a repair), the reshape run is not forced at the reshape and its fix is demanded (`repair r1` runs), and the contract pin. The trailing-slash form (`config/project/`) and `foldedOutside` hold before and after: they are the neighbours that must not change (`testing/tests`, lines 30 and 35). Under a mutation that drops the written form from the new read, the trailing-slash check is red. The reshape run's run-record check appears only once it reaches Finish, on the green run.

**Change.**

1. In `workflows/redline-loop.js`, the comment above `relPath` (481-482):

   ```js
   // A path as the ask rules read it (#49): the repository root taken off, then a leading ./. It
   // sits here, above the ask rules that first used it, so cleanPaths reads it too (#114, R2-2).
   ```

   becomes:

   ```js
   // The repository root taken off a path, then a leading ./ (#49). The paths ask rules read a path
   // through it as written, and through cleanPaths, which is built on it, as the round keeps it
   // (ruleForPaths, #114, R3-3). It sits here, above the ask rules, so cleanPaths reads it too
   // (#114, R2-2).
   ```

   The `relPath` line itself is unchanged.

2. In the same file, the comment and the body of `ruleForPaths` (533-544):

   ```js
   // The first paths rule, in list order, that one of the paths falls under; null when none does.
   function ruleForPaths(paths) {
     for (const { rule, regexes } of pathRules) {
       for (const path of paths) {
         const rel = relPath(String(path || '')).toLowerCase()
         if (rel !== '' && regexes.some((re) => re.test(rel))) {
           return rule
         }
       }
     }
     return null
   }
   ```

   become:

   ```js
   // The first paths rule, in list order, that one of the paths falls under; null when none does.
   // A path is read two ways (#114, R3-3): as cleanPaths reads it, the form the round keeps and
   // shows a task's paths in (the guard folds a target's repeated slashes and ./ segments the same
   // way before it matches); and as written, after relPath, so a form cleanPaths drops, a
   // directory's trailing slash, stays under the rule it was under. A rule matches when either
   // form is under it. Until R3-3 only the written form was read, so a task listed as
   // app//billing/x.php, app/./billing/x.php or with padding was never left to the person, while
   // the round kept and showed app/billing/x.php.
   function ruleForPaths(paths) {
     for (const { rule, regexes } of pathRules) {
       for (const path of paths) {
         const raw = String(path || '')
         for (const rel of unique([relPath(raw), cleanPaths([raw])[0] || '']).map((form) => form.toLowerCase())) {
           if (rel !== '' && regexes.some((re) => re.test(rel))) {
             return rule
           }
         }
       }
     }
     return null
   }
   ```

   `unique` (480) and `cleanPaths` (492) are declared above it. Both callers, `ruleOf` (548) and `forceAskRules` (3338), are unchanged. A canonical path reads the same both ways, so every existing case reads as before.

3. In `docs/contract.md`, section "`redline.json`", subsection "Ask rules", the `paths` bullet (152), the text:

   ```
   Globs are matched case-folded against the repository-relative path: `**` spans directories,
   ```

   becomes:

   ```
   Globs are matched case-folded against the repository-relative path, read as listed and also as the run keeps a task's paths (padding trimmed, repeated slashes made one and `./` segments folded; the guard folds a target's slashes and `./` segments the same way before it matches): `**` spans directories,
   ```

   No other sentence of the bullet changes.

No prompt changes: the rules block, the shaper's and the reshape's prompts are as they were, and only which findings are forced changes, for a path no existing scenario scripts (`shape.md`, Decision 3).

**Docs entry:** `workflows/redline-loop.js`: `docs/contract.md`, "`redline.json`", "Ask rules", the `paths` bullet, the clause this task adds, which is reader-facing: a person learns which forms of a path the workflow holds to a rule.

**Commit:** `redline: R3-3 match a paths rule on a path as written and as the round keeps it (#106)`

## Task 5: R3-4, set a decided finding's list once, at the resolve that first applies it

`shape.md`, Decision 4 and Unattended answer 4.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the resolve mock, the line (296):

   ```js
         const tasks = ids.map((id, i) => ({ n: i + 2, title: title(id), files: scenario.resolveFiles && id in scenario.resolveFiles ? scenario.resolveFiles[id] : accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id })).concat(scenario.resolveExtraTasks || [])
   ```

   becomes:

   ```js
         // scenario.resolveFilesAt[label][id] (#114, R3-4) scripts the task one resolve alone
         // returns, by that resolve's label, before scenario.resolveFiles, which every resolve reads.
         const resolveAt = (scenario.resolveFilesAt && scenario.resolveFilesAt[opts.label]) || {}
         const tasks = ids.map((id, i) => ({ n: i + 2, title: title(id), files: id in resolveAt ? resolveAt[id] : scenario.resolveFiles && id in scenario.resolveFiles ? scenario.resolveFiles[id] : accepted.has(id) || left.has(id) ? [] : ['app/x.php'], finding: id })).concat(scenario.resolveExtraTasks || [])
   ```

   No existing scenario sets `resolveFilesAt`, so every run is unchanged. The loop below it, which records `plannedByResolve`, is unchanged.

2. Right after the check named `reshape: a resolve for a raised call leaves an earlier decision's list as the reshape left it` (3383), and before the comment `// Replay: a stop that follows a reshape in a round with a decided finding, and its relaunch.`, add:

   ```js
     // An override a reshape returns as a call is applied again by the resolve that call sets off,
     // and that resolve's tasks do not replace its list either (#114, R3-4): a list is set by the
     // resolve that first applies a decision and replaced by each reshape (the spec's decision 17),
     // so a second resolve that plans no task for the override, or another one, leaves the list as
     // the reshape left it. Until R3-4 the second resolve's tasks alone replaced it.
     const overrideRecalled = (files) => ({ ...deferBounced, reshapeAsk: ['R1-1'], resolveFilesAt: { 'resolve r1 #1': { 'R1-1': files } }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
     const recalledNone = await go('reshape: an override to defer that a reshape returns as a call, whose second resolve plans no task for it', deferArgs, overrideRecalled([]))
     check('reshape: a second resolve that plans no task for an override a reshape returned as a call leaves its list as the reshape left it, on the second pass and at the build', (recalledNone.res || {}).status === 'done' && labels(recalledNone.calls).includes('resolve r1 #1') && approverFiles(recalledNone, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && implementerFiles(recalledNone, 'R1-1') === '["defer",["app/x.php"]]', [(recalledNone.res || {}).status, (recalledNone.res || {}).error, approverFiles(recalledNone, 'R1-1', PASS_2), implementerFiles(recalledNone, 'R1-1')])
     check('reshape: that override\'s commit of its own is not warned about as beside a task with no files', !anyWarning(recalledNone, 'has a commit of its own'), (recalledNone.res || {}).warnings)
     const recalledMoved = await go('reshape: an override to defer that a reshape returns as a call, whose second resolve plans its task elsewhere', deferArgs, overrideRecalled(['app/y.php']))
     check('reshape: a second resolve that plans another task for that override leaves its list as the reshape left it, with no change warned', (recalledMoved.res || {}).status === 'done' && approverFiles(recalledMoved, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(recalledMoved, 'the reshape changed'), [(recalledMoved.res || {}).status, (recalledMoved.res || {}).error, approverFiles(recalledMoved, 'R1-1', PASS_2), (recalledMoved.res || {}).warnings])
     // The neighbour: a call a reshape newly raises has no list yet, and the resolve that applies it sets one.
     check('reshape: a call a reshape raises is shown the task its own resolve planned', approverFiles(raisedLater, 'R1-2', PASS_2) === '["ask",["app/x.php"]]', approverFiles(raisedLater, 'R1-2', PASS_2))
   ```

   `deferArgs`, `deferBounced`, `PASS_2`, `approverFiles`, `implementerFiles`, `anyWarning` and `raisedLater` are declared above in the same block (3218-3382). In each run the round's first resolve applies the defer override and plans `app/x.php`, the plan approver bounces, the reshape lists `app/x.php` for R1-1 as the block asks but returns it as an ask with a call, and `resolve r1 #1` applies the override again, returning no task for it in the first run and `app/y.php` in the second.

See three checks fail on a gate run: the first run's second pass and build are shown `["defer",[]]` and it warns `round 1: R1-1 has a commit of its own (1bbbbbb) and the resolve agent planned no task with files for it; posted with its decision`, and the second run's second pass is shown `["defer",["app/y.php"]]`. The `raisedLater` neighbour holds before and after; under a mutation that sets no list at a later resolve, it is red. Both runs reach Finish, so their run-record checks pass on the red run too.

**Change.** In `workflows/redline-loop.js`:

1. The comment above `const decidedFiles = {}` (3821-3825):

   ```js
     // The files of each decided finding's task, by finding id, as last planned (#106). A resolve
     // sets the list of each id it applied, from its own tasks: a reshape that raises a call runs a
     // resolve for that call alone and `resolved` becomes it, so an earlier decision keeps the list
     // its own resolve gave it (#97, R2-14). Until #106 the round kept every resolve's tasks and
     // read a decided finding's files from them alone.
   ```

   becomes:

   ```js
     // The files of each decided finding's task, by finding id, as last planned (#106). The resolve
     // that first applies a decision sets its list, from its own tasks, and each reshape replaces
     // it: a reshape that raises a call runs a resolve for that call alone and `resolved` becomes
     // it, so an earlier decision keeps the list its own resolve or a later reshape gave it (#97,
     // R2-14), an override a reshape returns as a call included, which that resolve applies again
     // (#114, R3-4). Until #106 the round kept every resolve's tasks and read a decided finding's
     // files from them alone.
   ```

2. In `resolveWith`, the loop (3999-4001):

   ```js
       for (const id of applied) {
         decidedFiles[id] = taskFiles(id)
       }
   ```

   becomes:

   ```js
       // Only an id with no list yet takes this resolve's tasks (#114, R3-4): an override a reshape
       // returned as a call is applied again by the resolve that call sets off (raised), and its
       // tasks alone replaced the list its first resolve set and the reshape kept, so a task it did
       // not restate was shown as none and one it moved was shown with no warning.
       for (const id of applied.filter((x) => !(x in decidedFiles))) {
         decidedFiles[id] = taskFiles(id)
       }
   ```

   The other loop over `applied` at the top of `resolveWith` (3847), which records each decision, is unchanged, and so are the checks between them, which hold this resolve to its own tasks (`shape.md`, Decision 4). No prompt changes: the two existing scenarios where a resolve applies an override again (`overrideCalled`, `overrideCalledEmptied`) have it return the file the reshape listed, so every list they show is as it was.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision" ("the plan approver's next pass and the implementer are shown those files"). No reader-facing change: the bullet already says a decided finding is shown the files the reshape lists for its task, and the fix keeps that promise when a reshape's call for an override's finding sets off a second resolve.

**Commit:** `redline: R3-4 set a decided finding's task list once, at the resolve that first applies it (#106)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1556 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 4 and 5), with the section and the reason given in each task: Task 4's clause in `docs/contract.md`, "Ask rules", is reader-facing, and Task 5 has no reader-facing change. `docs/running.md` (Tasks 2 and 3) and `docs/contract.md` (Task 4) are reader-facing by nature. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.4`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/agents.md` (items 1, 2 and 3), `agent-os/standards/process/docs-gate.md` (item 4) and `agent-os/standards/testing/tests.md` (item 5), each clause read back in its whole line. Title it `redline: record the round 3 review lessons in the standards (#106)`. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 3 for PR #114 (#106)`.

**Files** (this task): `agent-os/standards/workflow/agents.md`, `agent-os/standards/process/docs-gate.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-20-2144-114-review-round-3/plan.md` and `shape.md` (As built and any deviation).

## As built

Built on `9ea3ea9`. Every red and green run below is a run of `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-3/redline/snapshot.json`; the counts are the loop's. Each task saw its own red run, then its own green run, before its commit.

| Task | Commit | Red | Green |
| --- | --- | --- | --- |
| 1, the spec folder | `0ff169f` | none | none |
| 2, R3-1 | `9fb5f15` | 1539 passed, 1 failed: `defer: docs/running.md says "whenever it was shown as a deferral, whether its decision named one"` | 1540 passed, 0 failed |
| 3, R3-2 | `c3548d8` | 1540 passed, 1 failed: `defer: docs/running.md says "except after the stop that holds a decided finding to its task after a reshape"` | 1541 passed, 0 failed |
| 4, R3-3 | `c03af7d` | 1544 passed, 5 failed: the three folded forms (each run went on to a repair and stopped with `checks.sh still fails after one repair pass in round 1: no commit names R1-1`), the reshape run (the same error, after `repair r1` and `recheck r1`), and the contract pin. The trailing-slash form and `foldedOutside` held, and `foldedOutside` reached Finish, so its run-record check passed on the red run | 1550 passed, 0 failed |
| 5, R3-4 | `71e1e40` | 1553 passed, 3 failed: the first run's second pass and build were shown `["defer",[]]` and it warned `round 1: R1-1 has a commit of its own (1bbbbbb) and the resolve agent planned no task with files for it; posted with its decision`, and the second run's second pass was shown `["defer",["app/y.php"]]`. Both runs reached Finish, so their run-record checks passed on the red run, and the `raisedLater` neighbour held | 1556 passed, 0 failed |
| 6, standards | `95b4d62` | none | 1556 passed, 0 failed |

**Mutations.** The two neighbours that held before their change were seen red under a mutation of the clause each turns on, in one gate run on `71e1e40` with both mutations applied and then undone (the tree matched HEAD afterwards): `ruleForPaths` reading the cleaned form alone, and `resolveWith` setting no list at a resolve with a suffix (every resolve after the round's first). 1554 passed, 2 failed: `rules: the shaper's files force the ask when they list "config/project/"` (not forced; the fix went on to a repair) and `reshape: a call a reshape raises is shown the task its own resolve planned` (shown `["ask",[]]`). No other check moved.

**Counts.** The loop reads `1556 checks passed, 0 failed`, as planned. The other harnesses on the green run after the standards commit: guard `601 passed, 0 mismatched`, prefs `172 passed, 0 failed`, gate `117 passed, 0 failed`, setup `512 passed, 0 failed`, gh `279 passed, 0 failed`, background `39 passed, 0 failed`, and syntax and validate exit 0, as in round 2's As built. This round changes no file those harnesses read, and the baseline had no failing check. The gate's JSON: `ok: true`, `git.unexpected_files` and `git.uncommitted` both empty.

**Gate steps 10 to 13.**

- 10, Docs. Each task's entry stands as written, in its own commit. `workflows/redline-loop.js`: Task 4's clause in `docs/contract.md`, "`redline.json`", "Ask rules", the `paths` bullet, is reader-facing and is in `c03af7d`; Task 5 has no reader-facing change, for the reason its entry gives, in `71e1e40`. `docs/running.md` (`9fb5f15`, `c3548d8`) and `docs/contract.md` (`c03af7d`) are reader-facing by nature.
- 11, Version. `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.4`. No bump.
- 12, Standards retrospective. All five approved items were applied in `95b4d62`, `redline: record the round 3 review lessons in the standards (#106)`, which names no finding, since no item finishes one. Items 1, 2 and 3 go to `agents.md` lines 47, 50 and 17, item 4 is a new last bullet of `docs-gate.md` (line 19), and item 5 goes to `tests.md` line 7. Each clause was read back in its whole line. The parentheses and backticks close. No line was added to `agents.md` or `tests.md`, and `docs-gate.md` gained one at its end, so every line citation still holds.
- 13, Spec folder. This section, committed last.

**Deviations.** None. `shape.md` is unchanged.
