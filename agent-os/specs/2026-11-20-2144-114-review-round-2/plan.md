# PR #114 review round 2: the path cleanup, the files clause, how an override is named, and a decided fix's own task

Spec folder: `agent-os/specs/2026-11-20-2144-114-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #114 (issue #106), from the round's six findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-2 (Task 2), R2-4 (Task 3), R2-5 (Task 4), R2-6 (Task 5). Part of R2-2's fix is standards item 1, applied in the round's standards commit (Task 6, step 12).
- `defer`, no task: R2-1 and R2-3. Neither ships a mitigation. Their drafted issues are under `## Deferred` in `shape.md`, and the run files them.
- No `decline`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#106)`. No commit subject holds a bare `@word`.

Line numbers are at `b5db022`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines (Task 2 moves a line of `workflows/redline-loop.js` up, so every later line there shifts). An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `agents/redline-resolve.md`, `agents/redline-plan-approver.md` or the gate's backticked text. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`**, which the pull request's own caution names ("a round that edits either meets #81"). A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file, which the skill lists (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). The agent file's edit is one clause that agrees with the prompt either way (`shape.md`, Unattended answer 10).

**Task order matters in two files.**

- `workflows/redline-loop.js`:
  - Task 2 deletes the `relPath` line (527) and replaces the comment and the line of `cleanPaths` (481-486) with `relPath`, its comment, and the new `cleanPaths` and its comment.
  - Task 3 replaces the comment and the line of `FILES_ASK_DECIDED` (919-925).
  - Task 4 adds `isOverride` after `let overrides = overridesFor(calls)` (3797), replaces the comment and the line of `isCall` (3901-3908), and changes `saidBy` (4132).
  - Task 5 changes the comment above `reshapePrompt` (2073-2077) and the block's last sentence (2083), and adds two comment lines above `const heldIds` (after 4130).
- `tests/loop-test.mjs`:
  - Task 2 adds a block after the check at 3422.
  - Task 3 changes the comment and `FILES_DECIDED` (371-375), renames the check at 3349, and adds a check after 3376.
  - Task 4 changes the mock's `taskOf` line (223) and adds a block after the check at 3430.
  - Task 5 adds two checks after 3354 and one phrase to the list at 2935.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task adds its checks first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-2/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of several tasks may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round, the loop prints `1522 checks passed, 0 failed` (round 1's As built), and the other harnesses print what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 10 | five named checks (four forms on the reshape side, one on the resolve side), and the run-record check `go` adds to each of those five runs, which reach Finish |
| Task 3 | 1 | one new check; two existing checks change their expected text through `FILES_DECIDED`, one of them renamed |
| Task 4 | 3 | two named checks, and the run-record check of the run that reaches Finish (the other stops at a reshape) |
| Task 5 | 3 | the block, the shaper's file, and one docs phrase pin |

So the loop reads `1539 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md` (a run that does or does not reach Finish adds or drops the run-record check `go` adds).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-20-2144-114-review-round-2/plan.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-2/shape.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-2/standards.md`
- `agent-os/specs/2026-11-20-2144-114-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #114 (#106)`

## Task 2: R2-2, read every path form the cleanup names one way

`shape.md`, Decision 1 and Unattended answer 6. The standard's own clause is corrected through standards item 1 (Task 6, step 12), not in this task.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after the check named `reshape: an override to fix the reshape leaves with only a blank path stops at that reshape, as one with no files does` (3422), add:

```js
  // The cleanup reads each form it folds one way (#114, R2-2), a case per form: the root and then
  // a leading ./ taken off, as relPath takes them for the ask rules, repeated slashes and ./
  // segments folded, and a trailing slash dropped. R1-6 took off the root or a leading ./, never
  // both, and kept the other forms as written, so a reshape that wrote the resolve's file one of
  // these ways was warned about as a change, and a resolve that did was shown in that form.
  for (const form of ['/r/./app/x.php', 'app//x.php', 'app/./x.php', './app/x.php/']) {
    const r = await go(`reshape: an override to defer whose task the reshape lists as ${form}`, deferArgs, { ...deferBounced, reshapeFiles: { 'R1-1': [form] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
    check(`reshape: a reshape that lists the resolve's app/x.php as ${form} changes nothing: the second pass is shown app/x.php, and nothing is warned`, r.res.status === 'done' && approverFiles(r, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(r, 'the reshape changed'), [r.res.status, r.res.error, approverFiles(r, 'R1-1', PASS_2), (r.res || {}).warnings])
  }
  const resolvedOtherForm = await go('reshape: an override to defer whose resolve plans its file with a doubled slash and a trailing slash', deferArgs, { ...deferBounced, resolveFiles: { 'R1-1': ['app//x.php/'] }, reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']] })
  check('reshape: a resolve that plans a file with a doubled slash and a trailing slash is read as that file on both passes, and a reshape that lists it as planned changes nothing', resolvedOtherForm.res.status === 'done' && approverFiles(resolvedOtherForm, 'R1-1') === '["defer",["app/x.php"]]' && approverFiles(resolvedOtherForm, 'R1-1', PASS_2) === '["defer",["app/x.php"]]' && !anyWarning(resolvedOtherForm, 'the reshape changed'), [resolvedOtherForm.res.status, resolvedOtherForm.res.error, approverFiles(resolvedOtherForm, 'R1-1'), approverFiles(resolvedOtherForm, 'R1-1', PASS_2)])
```

The harness's repository root is `/r` (`tests/loop-test.mjs:357`). See the five named checks fail on a gate run: the four form runs warn `from app/x.php to ./app/x.php`, `to app//x.php`, `to app/./x.php` and `to app/x.php/`, and the resolve-side run shows `["defer",["app//x.php/"]]` on both passes. Each form turns on one clause of the new cleanup, which the old code lacks (`testing/tests`, line 30). The five run-record checks pass on the red run too, since every run reaches Finish.

**Change.** In `workflows/redline-loop.js`:

1. First delete the `relPath` line where it is now (527). The two lines:

   ```js
   const pathRules = askRules.filter((rule) => rule.when.paths).map((rule) => ({ rule, regexes: rule.when.paths.map(globToRegExp) }))
   const relPath = (path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path).replace(/^\.\//, '')
   ```

   become:

   ```js
   const pathRules = askRules.filter((rule) => rule.when.paths).map((rule) => ({ rule, regexes: rule.when.paths.map(globToRegExp) }))
   ```

2. Then the comment and the line of `cleanPaths` (481-486):

   ```js
   // A list of paths as an agent returned it, read one way (#114, R1-6): each path trimmed, the
   // repository root or a leading ./ taken off (planPaths takes the root off the approver's list
   // too), and a blank dropped, so one file written two ways is one file and a list of blanks is no
   // list. A finding's task is read through it from a resolve's tasks and from a reshape's list
   // alike, so the holds, the warnings and the list the round keeps compare one form.
   const cleanPaths = (list) => unique(list.map((path) => String(path).trim()).map((path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path.replace(/^\.\//, ''))).filter(Boolean))
   ```

   become:

   ```js
   // A path as the ask rules read it (#49): the repository root taken off, then a leading ./. It
   // sits here, above the ask rules that first used it, so cleanPaths reads it too (#114, R2-2).
   const relPath = (path) => (path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path).replace(/^\.\//, '')
   // A list of paths as an agent returned it, read one way (#114, R1-6, R2-2): each path trimmed,
   // its repeated slashes made one and its ./ segments folded, the repository root and then a
   // leading ./ taken off as relPath takes them (planPaths takes the root off the approver's list
   // too), a trailing slash dropped, and a blank or a bare . dropped, so one file written two ways
   // is one file and a list of blanks is no list. A finding's task is read through it from a
   // resolve's tasks and from a reshape's list alike, so the holds, the warnings and the list the
   // round keeps compare one form. Until R2-2 it took off the root or a leading ./, never both, and
   // kept a doubled slash, a ./ segment and a trailing slash as written.
   const cleanPaths = (list) => unique(list.map((path) => relPath(String(path).trim().replace(/\/+/g, '/').replace(/\/(?:\.\/)+/g, '/')).replace(/\/$/, '')).filter((path) => path !== '' && path !== '.'))
   ```

   `relPath`'s own line is unchanged, so `ruleForPaths` reads every path as before. Every form `shape.md`'s Decision 1 table lists comes out as that table says. R1-6's cases (`sameFileAnotherWay`, `fixBlanked`, `fixBlankFile`) stay green: `./app/x.php`, `/r/app/x.php` and ` app/x.php ` still read `app/x.php`, and `''` is still dropped. `taskFilesOf` and the reshape loop already read through `cleanPaths`, so no call site changes.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision" ("A reshape that lists the same files changes nothing"). No reader-facing change: a path written another way names the same file, which that sentence already promises.

**Commit:** `redline: R2-2 read every path form the cleanup names one way (#106)`

## Task 3: R2-4, keep the recommended paths for an ask the decided block does not name

`shape.md`, Decision 2 and Unattended answer 7.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. The comment and the constants (371-375):

   ```js
   // What a reshape prompt that names decided findings asks of a finding's files (#114, R1-4): an
   // ask still pending by its recommended paths, a named finding by its task, and never the clause
   // that covers both (#103, R2-5). Every run is read, and one check at the end names the offenders.
   const FILES_PENDING = 'for an ask, the paths its recommended change would touch)'
   const FILES_DECIDED = 'for an ask still pending, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
   ```

   become:

   ```js
   // What a reshape prompt that names decided findings asks of a finding's files (#114, R1-4): an
   // ask the block does not name, pending or newly raised, by its recommended paths (#114, R2-4), a
   // named finding by its task, and never the clause that covers both (#103, R2-5). Every run is
   // read, and one check at the end names the offenders.
   const FILES_PENDING = 'for an ask, the paths its recommended change would touch)'
   const FILES_DECIDED = 'for an ask not named above as decided, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
   ```

2. The check named `reshape: a reshape prompt that names decided findings asks for files in one meaning: an ask still pending by its recommended paths, a named finding by its task` (3349) is renamed `reshape: a reshape prompt that names decided findings asks for files in one meaning: an ask the block does not name by its recommended paths, a named finding by its task`. Its condition is unchanged.

3. Right after the check named `reshape: a call the reshape raises stops the round after a reshape prompt that names the decided finding` (3376), add:

   ```js
     // An ask the reshape newly raises is one the block does not name, and the Return sentence's
     // files clause keeps the recommended paths for it, which forceAskRules matches against the
     // paths rules (#114, R2-4): "an ask still pending" left it out, since the same sentence lists
     // the calls "still pending or newly raised" as two kinds.
     check('reshape: the files clause of a decided round\'s reshape covers an ask the reshape newly raises, by its recommended paths', reshapePromptOf(raisedStop).includes(FILES_DECIDED) && reshapePromptOf(raisedStop).includes('every judgment call still pending or newly raised') && !reshapePromptOf(raisedStop).includes('for an ask still pending,'), reshapePromptOf(raisedStop).slice(-900))
   ```

See three checks fail on a gate run: the renamed one, the new one, and `reshape: the reshape prompt of a round with no decided finding has no such block, and is the decided round's prompt with the block cut out and the files clause put back` (3348), whose `withoutBlock` no longer finds the clause to put back. The check over every scenario, `no reshape prompt that names decided findings asks an ask for its recommended paths in a clause that covers them too` (4096), stays green before and after.

**Change.** In `workflows/redline-loop.js`, the comment and the line of `FILES_ASK_DECIDED` (919-925):

```js
// The same ask in a reshape prompt whose block names decided findings (#114, R1-4): the block
// gives a named finding's files one meaning, its task as plan.md holds it, whatever disposition
// is returned, so this clause keeps the recommended paths for an ask still pending and sends a
// named finding to the block, and no sentence of that prompt gives one finding two meanings
// (#103, R2-5). It is used only beside the block, so a reshape prompt with no block keeps
// FILES_ASK, byte for byte.
const FILES_ASK_DECIDED = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask still pending, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
```

become:

```js
// The same ask in a reshape prompt whose block names decided findings (#114, R1-4): the block
// gives a named finding's files one meaning, its task as plan.md holds it, whatever disposition
// is returned, so this clause keeps the recommended paths for every ask the block does not name
// and sends a named finding to the block, and no sentence of that prompt gives one finding two
// meanings (#103, R2-5). It names the asks by the block's own test, never as "still pending":
// the Return sentence lists the calls "still pending or newly raised" as two kinds, so an ask a
// reshape newly raises read as neither and was left the general clause's empty list, which
// forceAskRules matches against the paths rules (#114, R2-4). It is used only beside the block,
// so a reshape prompt with no block keeps FILES_ASK, byte for byte.
const FILES_ASK_DECIDED = 'files (the paths its task creates or changes, an empty list when it has no task; for an ask not named above as decided, the paths its recommended change would touch; for a finding named above as decided, the paths of its task as plan.md holds it)'
```

No other line changes. The constant is used once, in `reshapePrompt`'s Return sentence (2099), only when the block is present, so a reshape prompt with no block is byte-identical (workflow/replay, line 23). `FILES_ASKED` (`an empty list when it has no task`) is still in the clause, so `filing: the reshape prompt asks for every finding's files` stays green.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision" ("The reshape is asked for the files of each decided finding's task as `plan.md` now holds it"). No reader-facing change: the docs do not quote the Return sentence's clause, and an ask the block does not name is asked for its recommended paths, as every other shape prompt asks it.

**Commit:** `redline: R2-4 keep the recommended paths for an ask the decided block does not name (#106)`

## Task 4: R2-5, read whether a decision is an override from the round's overrides

`shape.md`, Decision 3 and Unattended answer 8.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the shaper mock, the line (223):

   ```js
         const taskOf = (id) => (scenario.reshapeFiles && id in scenario.reshapeFiles ? scenario.reshapeFiles[id] : plannedByResolve[id] || [])
   ```

   becomes:

   ```js
         // scenario.reshapeFilesAt[label][id] (#114, R2-5) scripts the task one reshape alone
         // changed, by that reshape's label, before scenario.reshapeFiles, which every reshape reads.
         const filesAt = (scenario.reshapeFilesAt && scenario.reshapeFilesAt[opts.label]) || {}
         const taskOf = (id) => (id in filesAt ? filesAt[id] : scenario.reshapeFiles && id in scenario.reshapeFiles ? scenario.reshapeFiles[id] : plannedByResolve[id] || [])
   ```

   No existing scenario sets `reshapeFilesAt`, so every run is unchanged.

2. Right after the check named `reshape: a decided fix the reshape leaves to the person under a rule is not held to a task` (3430), add:

   ```js
     // Whether a decided finding is a disposition override is read from the round's own overrides,
     // never from the round's calls (#114, R2-5): a reshape that returns a call for an override's
     // finding adds it to `calls`, and the resolve that call sets off and every later reshape's hold
     // then named the override as a call's decision. One run per place that names it: the resolve's
     // stray warning and the hold's stop.
     const STRAY_OVERRIDE = 'round 1: the resolve agent listed R1-1 as deferred, a finding whose disposition the person changed to fix; the entry is dropped, since the decision stands'
     const overrideCalled = await go('reshape: an override to fix that a reshape returns as a call, a stray entry beside it at each resolve', { ...overrideDial, decisions: toFix }, { ...declined, reviews: [[f('R1-1', 'correctness')], []], reshapeAsk: ['R1-1'], resolveDeferred: [guardEntry], commitIds: [['R1-1']] })
     check('reshape: the resolve a reshape\'s call for an override sets off warns of a stray entry as the override\'s, never as a call\'s decision', overrideCalled.res.status === 'done' && labels(overrideCalled.calls).includes('resolve r1 #1') && warned(overrideCalled, STRAY_OVERRIDE) && !anyWarning(overrideCalled, 'a call whose decision names it as'), [overrideCalled.res.status, overrideCalled.res.error, (overrideCalled.res || {}).warnings])
     const overrideCalledEmptied = await go('reshape: an override to fix that a first reshape returns as a call and a second leaves with no task', { ...overrideDial, decisions: toFix }, { ...declined, planBounce: 2, reshapeAsk: ['R1-1'], reshapeFilesAt: { 'reshape r1 #2': { 'R1-1': [] } } })
     check('reshape: the hold names an override a reshape returned as a call as a disposition override, at the later reshape that leaves it with no task', overrideCalledEmptied.res.status === 'error' && overrideCalledEmptied.res.stage === 'shape' && overrideCalledEmptied.res.error === NO_TASK('a disposition override names') && Boolean(overrideCalledEmptied.res.resumeFrom) && overrideCalledEmptied.res.resumeFrom.label === 'reshape r1 #2', stopOf(overrideCalledEmptied))
   ```

   `overrideDial`, `toFix`, `declined`, `guardEntry`, `warned`, `anyWarning`, `NO_TASK` and `stopOf` are declared above in the same block (3288-3395). In the first run, the round's first resolve applies the override and warns of the stray entry as the override's, the reshape returns R1-1 as an ask with a call, and `resolve r1 #1` applies it again. In the second, the first reshape keeps the task and the second (`reshape r1 #2`) lists none.

See both named checks fail on a gate run: the first run warns `round 1: the resolve agent listed R1-1 as deferred, a call whose decision names it as fix; the entry is dropped, since the decision stands`, and the second stops with `the reshape left R1-1, which its decision names as a fix, with no task with files; a fix names the files it changes`. The first run's run-record check passes on the red run too.

**Change.** In `workflows/redline-loop.js`:

1. Right after the line (3797):

   ```js
     let overrides = overridesFor(calls)
   ```

   add:

   ```js
     // Whether a decided finding is a disposition override, read from the round's own overrides as
     // they entered (#114, R2-5), never from `calls`: a reshape that returns a call for an override's
     // finding adds it to `calls` (raised, below), so membership there named the override as a
     // call's decision in the resolve's warnings and stops and in the hold after each reshape.
     const isOverride = (id) => overrides.some((f) => f.id === id)
   ```

   Nothing reassigns `overrides` after this line.

2. In `resolveWith`, the comment's last lines and the line of `isCall` (3901-3908):

   ```js
       // An override is a finding whose disposition the person changed, from whatever the shaper
       // sorted it to (a decline overruled to a fix included), and a call whose decision names its
       // own fix or accept was never a deferral either: each warning says whose decision it is and
       // what it names (#108, R2-3, R3-5). An override is never one of the round's calls (overridesFor).
       // Whether a decision is a call's or an override's, read one way for the stray warnings and
       // the named-check stops (#108, R3-6): `newCalls` is always within `calls`, and `overridesFor`
       // never takes a call.
       const isCall = (id) => calls.some((call) => call.id === id)
   ```

   become:

   ```js
       // An override is a finding whose disposition the person changed, from whatever the shaper
       // sorted it to (a decline overruled to a fix included), and a call whose decision names its
       // own fix or accept was never a deferral either: each warning says whose decision it is and
       // what it names (#108, R2-3, R3-5). Whether a decision is a call's or an override's is read
       // one way for the stray warnings, the named-check stops and the hold after each reshape
       // (#108, R3-6): from the round's own overrides (isOverride), never from `calls`, which a
       // reshape's call for an override's finding joins (#114, R2-5).
       const isCall = (id) => !isOverride(id)
   ```

   Every id `isCall` is asked about is a decided finding this resolve applied (`strayOverride`, `named`), so it is an override or a call, and the negation reads each as before unless a reshape's call made an override look like a call.

3. In the reshape loop, the line (4132):

   ```js
       const saidBy = (id) => (roundDecisions[id].disposition ? (calls.some((call) => call.id === id) ? 'its decision names' : 'a disposition override names') : 'the resolve agent stated')
   ```

   becomes:

   ```js
       const saidBy = (id) => (roundDecisions[id].disposition ? (isOverride(id) ? 'a disposition override names' : 'its decision names') : 'the resolve agent stated')
   ```

No prompt changes, only a message's words in the one case. `namedStray` (`filing: a stray entry beside a call whose decision names a fix is warned as that call's, never as one the person changed away from defer`) and the hold's existing cases (`fixEmptied`, `namedFixEmptied`, `acceptTasked`, `twoEmptied`) are the neighbours that stay green.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullets "A deferral you chose at a call" and "A reshape after your decision". No reader-facing change: neither bullet quotes the owner phrase of the stray warning or of the hold's stop, and the words now name an override as an override in the one case where they named it as a call's decision.

**Commit:** `redline: R2-5 read whether a decision is an override from the round's overrides (#106)`

## Task 5: R2-6, tell the reshape a decided fix keeps a task of its own

`shape.md`, Decision 4 and Unattended answer 9.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-shaper.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. Right after the check named `reshape: the shaper's file says the invoking prompt names each decided finding with what its decision ends in` (3354), add:

   ```js
     // A decided fix's task is its own and counts only for the finding it names, after a reshape as
     // at resolve (#114, R2-6): the hold reads the files the reshape lists for each finding and
     // cannot see which task names it, so a merged task listed for two decided fixes passed it, and
     // the fix the merged commit did not name stopped at the check, which cannot replan.
     check('reshape: the block says a decided fix keeps a task of its own and a task counts only for the finding it names', reshapePromptOf(emptied).includes('A decided fix keeps a task of its own, one that names it; a task counts only for the finding it names'), reshapePromptOf(emptied).slice(-1600))
     check('reshape: the shaper\'s file says the same of a decided fix\'s task after a reshape', shaperFile.includes('a task counts only for the finding it names'))
   ```

2. In the `docs/running.md` phrase list (2935), right after its element `'stay as the resolve agent wrote them for your decision'`, add the element:

   ```js
   'that a task counts only for the finding it names'
   ```

See the two checks and the new `defer: docs/running.md says "that a task counts only for the finding it names"` check fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, the comment above `reshapePrompt`, its last lines (2073-2077):

   ```js
   // from this list. It names each with its end, which the hold after the reshape reads, so the
   // reshape is told which task the hold expects rather than left to infer it from plan.md, since
   // shape.md's decided entry records the choice and not its end (#114, R1-3). The whole ask sits in
   // the block, and the block is in the prompt only when the round has such a finding, so a reshape
   // of any other round keeps the prompt it had before #106.
   ```

   become:

   ```js
   // from this list. It names each with its end, which the hold after the reshape reads, so the
   // reshape is told which task the hold expects rather than left to infer it from plan.md, since
   // shape.md's decided entry records the choice and not its end (#114, R1-3). It says a decided
   // fix keeps a task of its own and a task counts only for the finding it names, as the resolve
   // agent is told, since the hold reads the files listed for each finding and cannot see which
   // task names it: a merged task listed for two decided fixes passed it (#114, R2-6). The whole
   // ask sits in the block, and the block is in the prompt only when the round has such a finding,
   // so a reshape of any other round keeps the prompt it had before #106.
   ```

2. In the block (2083), the text at its end:

   ```js
   A finding decided as a fix keeps a task with files, and one decided as accepted keeps none.`
   ```

   becomes:

   ```js
   A finding decided as a fix keeps a task with files, and one decided as accepted keeps none. A decided fix keeps a task of its own, one that names it; a task counts only for the finding it names, so never list one task's files for two findings.`
   ```

   The block keeps its opening words and its other sentences, which the mock, `DECIDED_BLOCK`, `blockNames` and the check over every scenario read. The sentence sits inside the block, so `withoutBlock` still cuts it out and the undecided round's prompt is unchanged.

3. In the reshape loop, right after the comment line (4130, as Task 4 leaves the lines below it):

   ```js
       // the same words, which the resume line reads (resumeLine).
   ```

   and before `const heldIds = inScope.map((f) => f.id).filter(tracked)`, add:

   ```js
       // It reads the files the reshape lists for each finding, which the block asks for as a task of
       // the finding's own, since a reshape returns no list of tasks (#114, R2-6).
   ```

4. In `agents/redline-shaper.md`, rule 10 (line 33), the text:

   ```
   a finding decided as a fix keeps a task with files, and one decided as accepted keeps none. A `decline` also carries
   ```

   becomes:

   ```
   a finding decided as a fix keeps a task with files, and one decided as accepted keeps none, and a decided fix keeps a task of its own, one that names it: a task counts only for the finding it names, as it does for the tasks the resolve agent plans, so never list one task's files for two findings. A `decline` also carries
   ```

   No other sentence of the agent file changes. The phrases the loop test pins in it (`as \`plan.md\` holds it when you are done`, `whatever disposition you return for it`, `keeps a task with files`, `correct the task the error names`, `each with what its decision ends in (fix, accepted or deferred)`) stay.

5. In `docs/running.md`, section "Deferred items", bullet "A reshape after your decision" (127), the text:

   ```
   posted with its decision`. The decision is held to its task after each reshape, as it is when the resolve agent first plans it:
   ```

   becomes:

   ```
   posted with its decision`. The reshape is told, as the resolve agent is, that a fix you decided keeps a task of its own and that a task counts only for the finding it names, since the workflow holds the decision to the files the reshape lists for that finding and a reshape returns no list of tasks. The decision is held to its task after each reshape, as it is when the resolve agent first plans it:
   ```

   No other sentence of the bullet changes. Every phrase the list already pins for this bullet stays in it.

A reshape prompt with no block is byte-identical to what it was. Only reshape prompts that carry the block change, and those are new in this pull request (workflow/replay, line 23).

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", bullet "A reshape after your decision", the sentence this task adds, which is reader-facing: the person learns what the reshape is told and what the hold reads.
- `agents/redline-shaper.md`: the same bullet and sentence. The README's roles table names the file, and the behaviour is in that bullet.

**Commit:** `redline: R2-6 tell the reshape a decided fix keeps a task of its own (#106)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-20-2144-114-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1539 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 2 to 5) and `agents/redline-shaper.md` (Task 5), each with the section and the reason given in its task. `docs/running.md` (Task 5) is reader-facing by nature, and Task 5's sentence is the entry for its workflow and agent-file changes. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.4`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/agents.md` (items 1, 3 and 4), `agent-os/standards/workflow/replay.md` (item 2) and `agent-os/standards/testing/tests.md` (item 5), each clause read back in its whole line. Title it `redline: record the round 2 review lessons in the standards, finishing R2-2 (#106)` when item 1 is approved, or `redline: record the round 2 review lessons in the standards (#106)` when it is not. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 2 for PR #114 (#106)`.

**Files** (this task): `agent-os/standards/workflow/agents.md`, `agent-os/standards/workflow/replay.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-20-2144-114-review-round-2/plan.md` and `shape.md` (As built and any deviation).
