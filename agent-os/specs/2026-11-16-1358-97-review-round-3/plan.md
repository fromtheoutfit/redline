# PR #97 review round 3: a decided deferral through a reshape, and what a deferral's words and commits are read as

Spec folder: `agent-os/specs/2026-11-16-1358-97-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #97 (issue #95), from the round's seven findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `defer`, each with its mitigation as its task, in finding order: R3-2 (Task 2), R3-3 (Task 3). Their drafted issues are under `## Deferred` in `shape.md`; the run files them, and no task here starts either full fix.
- `fix`, one task each, in finding order: R3-4 (Task 4), R3-5 (Task 5), R3-6 (Task 6), R3-1 (Task 7), R3-7 (Task 8).
- No `decline`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every commit message names the finding and ends `(#95)`. A deferral's mitigation commit names its finding too, and its code comment names the finding id. Line numbers are at `ff5b0a8`, the working tree's HEAD. Each task also names its anchor by text, since earlier tasks move later lines; every anchor below occurs once in its file. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. No commit subject holds a bare `@word`.

Nothing in this plan touches `scripts/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `hooks/hooks.json` or anything under `templates/`. The version stays 0.4.0 (`shape.md`, Standards Applied, process/release). Task 7 changes one agent file, `agents/redline-github.md` (`shape.md`, Context, the run caution).

Task order matters. Tasks 2 to 6 and 8 all change `workflows/redline-loop.js`, each in its own place: Task 2 the comment and line of `NOTHING_SHIPS`; Task 3 a constant right after `draftMissing`, `issueDraft`'s comment, and one sentence each in `shapePrompt`, `reshapePrompt` and `resolvePrompt`; Task 4 `checkDrafts`, `vetShape` and the reshape's `vetShape` call in `revise()`; Task 5 a helper right after `mentions` and two lines of `outcomesFor`; Task 6 the rebuild of `deferred` after a reshape in `revise()`; Task 8 two lines of `humanSummary`. In `tests/loop-test.mjs`, Tasks 2, 3 and 5 add to the defer section (Task 2 edits the word loop and adds after the `nothingBut` check, Task 5 after the `plannedBare` check, Task 3 after the `bounced` check), Tasks 4 and 6 add to the filing section after the `strayReshape` check (Task 6 after Task 4's), Task 8 at the end of the filing section, and Task 7 at the end of the statements block. Each task's anchors are as the tasks before it leave them.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds a case (2 to 8) makes the test change first and sees it fail on a gate run (`.claude/redline/checks.sh <snapshot>` prints the failing check names), then makes the change and sees it pass. A check named as the neighbour that must not change is green on both runs.

**Expected counts.** Before this round (round 2's As built): loop `1273 checks passed, 0 failed`, guard `601 passed, 0 mismatched`, prefs `172`, gate `117`, setup `512`, gh `179`, background `39`. `go()` adds one run-record check for each run that reaches Finish (`tests/loop-test.mjs:340-346`), so a red run that stops elsewhere counts fewer. This round adds to the loop: Task 2, 10 (three entries in the word loop, each a check and a run that reaches Finish; one check and a run that reaches Finish once green; one check and a run that reaches Finish), so its red run reads `1278 checks passed, 4 failed` and its green one 1283; Task 3, 1 (a check on runs that exist): red `1283 passed, 1 failed`, green 1284; Task 4, 2 (a check and a run that reaches Finish once green; its red run stops at shape): red `1284 passed, 1 failed`, green 1286; Task 5, 2: red `1287 passed, 1 failed`, green 1288; Task 6, 2: red `1289 passed, 1 failed`, green 1290; Task 7, 1: red `1290 passed, 1 failed`, green 1291; Task 8, 2: red `1292 passed, 1 failed`, green 1293. So the loop reads 1293. The other harnesses keep their counts. If a count differs, the first green gate run's counts are the evidence, recorded under As built with the reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-16-1358-97-review-round-3/plan.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-3/shape.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-3/standards.md`
- `agent-os/specs/2026-11-16-1358-97-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #97 (#95)`

## Task 2: R3-2 (defer), its mitigation: a no-mitigation word followed by its reason reads as no mitigation

`shape.md`, Decision 1, Unattended answer 6 and `## Deferred`. This task is the mitigation, the only change the round ships for R3-2. Its full fix (a reading that rests on no free text) is the drafted issue under `## Deferred`, which the run files.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the defer section:

1. The word loop's opening line (line 2827), which opens `for (const [word, name] of [['none', 'the word none'],`, becomes, whole:

   ```js
     for (const [word, name] of [['none', 'the word none'], ['None (nothing cheap exists).', 'none with a note'], ['', 'an empty string'], ['N/A', 'n/a'], ['Nothing ships now.', 'nothing ships now'], ['Nothing.', 'nothing'], ['No mitigation (the client is replaced next quarter).', 'no mitigation with a note'], ['None; nothing ships in this pull request.', 'none with its reason after a semicolon'], [`N/A ${String.fromCharCode(0x2014)} the full fix is deferred`, 'n/a with its reason after a dash'], ['No mitigation: the client is replaced next quarter.', 'no mitigation with its reason after a colon']]) {
   ```

   The em dash is built with `String.fromCharCode`, as the loop test already does (line 964), so the source holds no non-ASCII character (`testing/tests.md:11`). The comment above the loop (lines 2824-2826, it opens `// "none", and the plain words for nothing (#97, R1-7)`) gains a sentence at its end: "So do those words followed by their reason after a semicolon, a colon or a spaced dash (#97, R3-2)."

2. Right after the check that opens `check('defer: a mitigation that only begins with "nothing ships now" still ships, is demanded and buys the round'` (line 2836), add:

   ```js
     // A wording the list reads as no mitigation demands no commit (#97, R3-2): before, the gate
     // demanded one the plan had no task for, and the round stopped at the check after its repair.
     const worded = await go('defer: no mitigation worded as a sentence, and no commit', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': 'None; nothing ships in this pull request.' }, commitIds: [[]] })
     check('defer: a no-mitigation word with its reason after a semicolon demands no commit, so the round ends with no stop at the check', worded.res.status === 'done' && !(worded.res.error || '').includes('no commit names') && replyFor(worded.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline', [worded.res.status, worded.res.stage, worded.res.error, replyFor(worded.calls, 'push and reply r1', 'R1-1')])
     // The neighbour (#97, R3-2): a comma goes on into what ships, so the words before it are a mitigation.
     const nothingComma = await go('defer: a mitigation that begins with the words nothing ships now and a comma', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')], []], defer: ['R1-1'], mitigations: { 'R1-1': 'Nothing ships now, but a log line with the retry count' }, commitIds: [['R1-1']] })
     check('defer: a mitigation that begins with "nothing ships now" and a comma still ships, is demanded and buys the round', nothingComma.res.status === 'done' && nothingComma.res.rounds.length === 2 && nothingComma.res.rounds[1].reviewed === 'fix-diff', [nothingComma.res.status, nothingComma.res.rounds.map((r) => r.reviewed)])
   ```

Red: four checks fail: the three new word-loop checks (each reply reads `Mitigated in` the commit that only names the finding, and the run buys a round) and the `worded` check (the run stops at `check`: `checks.sh still fails after one repair pass in round 1: no commit names R1-1`). The comma neighbour and the two neighbours above it (`noneOf`, `nothingBut`, lines 2832-2836) are green on both runs.

**Change.** In `workflows/redline-loop.js`:

1. The comment above `NOTHING_SHIPS` (lines 766-770, it ends `say "that nothing ships now" (#97, R1-7).`) gains, wrapped to the comment's width:

   ```js
   // So do those words followed by their reason after a full stop, a semicolon, a colon or a spaced
   // dash (`None; nothing ships here.`, `N/A - the full fix is deferred`): the value comes first and
   // its reason after (#97, R3-2). A comma or a word goes on into what ships, so `Nothing ships now,
   // but a log line` is a mitigation. Any other wording still reads as one; a reading that rests on
   // no free text is the drafted issue of #97, R3-2.
   ```

2. The line

   ```js
   const NOTHING_SHIPS = /^(none|n\/a|nothing|nothing ships( now)?|no mitigation)(\s*\(.*\))?\.?$/i
   ```

   becomes

   ```js
   const NOTHING_SHIPS = /^(none|n\/a|nothing|nothing ships( now)?|no mitigation)((\s*\(.*\))?\.?$|\s*[.;:]|\s+\p{Pd})/iu
   ```

   The first branch is the R1-7 form, unchanged; the second reads the word followed by `.`, `;` or `:`; the third by a space and a dash (`\p{Pd}`, any Unicode dash, which the `u` flag enables, so no dash character is typed). `hasMitigation` (772-775) is unchanged: it still trims the text and reads `''` as nothing first.

Proof: `grep -c 'p{Pd})/iu' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, Dispositions, `defer`, says a deferral that ships nothing has no task and no commit, and no doc lists the words read as nothing.

**Commit:** `redline: R3-2 read a no-mitigation word followed by its reason as no mitigation (#95)`

## Task 3: R3-3 (defer), its mitigation: each drafted issue field is asked for as one paragraph

`shape.md`, Decision 2, Unattended answer 7 and `## Deferred`. This task is the mitigation, the only change the round ships for R3-3. Its full fix (escaping a body by Markdown block, measured against GitHub's renderer) is the drafted issue under `## Deferred`, which the run files.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`
- `docs/running.md`

**Test first.** In `tests/loop-test.mjs`, in the defer section, right after the check that opens `check('defer: the reshape prompt asks for the mitigation and the drafted issue'` (line 2857), add:

```js
  // Each drafted issue's body field is asked for as one paragraph (#97, R3-3): a field with a line
  // break is escaped whole, its code spans included, so the shape, reshape and resolve prompts ask
  // for one paragraph with code in inline spans.
  const oneParagraph = 'found, why and fullFix each as one paragraph with no line break'
  check('defer: the shape, reshape and resolve prompts ask for each drafted issue field as one paragraph', [(pick(mitigated.calls, 'shape r1') || { prompt: '' }).prompt, (pick(bounced.calls, 'reshape r1 #1') || { prompt: '' }).prompt, (pick(resolved.calls, 'resolve r1') || { prompt: '' }).prompt].every((p) => p.includes(oneParagraph)), 'shape r1, reshape r1 #1, resolve r1')
```

`mitigated` (line 2808), `resolved` (2848) and `bounced` (2856) are runs defined above it in the same block; the check adds no run. Red: the check fails.

**Change.** In `workflows/redline-loop.js`:

1. Right after the line that opens `const draftMissing = (item) => DRAFT_FIELDS.filter(` (line 779) and before the comment that opens `// One deferred entry per finding (#97, R2-12)`, add:

   ```js
   // How a drafted issue's body fields are asked for (#97, R3-3): issueDraft passes each through
   // postedText as one text, and a text with a line break is escaped whole, its code spans included
   // (#87), so code in a field written over several lines would show its entities in the filed
   // issue. One paragraph a field, with code in inline code spans, keeps each span as written. A
   // rule that escapes a body by Markdown block waits on a measurement of GitHub's renderer, the
   // drafted issue of #97, R3-3.
   const DRAFT_FORM = 'Write a drafted issue\'s found, why and fullFix each as one paragraph with no line break, and quote code in inline code spans: a field with a line break is escaped whole, its code spans included, so a `<`, an `&` or an `@word` in its code would show as an entity in the filed issue.'
   ```

2. In `shapePrompt`, in the paragraph that opens `Sort each finding into fix, decline, defer or ask per the unattended-mode section and your rules.` (line 1930), the sentence

   ```
   A deferred finding is worth doing and not in this pull request, and it always carries a drafted issue that stands on its own.
   ```

   becomes

   ```
   A deferred finding is worth doing and not in this pull request, and it always carries a drafted issue that stands on its own. ${DRAFT_FORM}
   ```

3. In `reshapePrompt`, the line that opens `Apply each adjustment, or record in shape.md why it cannot be applied.` (line 1987) ends with the characters below (the sentence's full stop, the backtick that closes its nested template literal, and the brace that closes the interpolation):

   ```
   never a quiet change.`}
   ```

   Append, at the very end of that line, the interpolation below, so the sentence follows on a Redline round's reshape while a human pass's reshape (which never defers) is unchanged:

   ```
   ${pass.human ? '' : ` ${DRAFT_FORM}`}
   ```

4. In `resolvePrompt`, the last `lines.push(` (lines 2033-2038) holds `''`, the line that opens `${pass.human ? NEVER_DECIDE : RESOLVE_RULE} You apply the decisions verbatim.`, `''` and the line below. Right before that line

   ```js
       'Return only the JSON your instructions specify.',
   ```

   add the two items

   ```js
       DRAFT_FORM,
       '',
   ```

   so every resolve prompt, a human pass's included (whose author's deferral the resolve agent drafts), says it before its last line.

5. In the comment above `issueDraft` (lines 1285-1294), the sentence that ends with the words "while a code span stays as written." becomes, wrapped to the comment's width: "...no tag in it can break the body and no @word notifies, while a code span stays as written in a field with no line break; a field with one is escaped whole, its spans included (#87), so the prompts ask for each field as one paragraph (DRAFT_FORM; #97, R3-3)."

The sentence is constant, so every prompt of a launch and its relaunch carries it alike (`workflow/replay`, line 6). It holds no text the scripted shaper or resolve agent parses for ids (an `"id":` key, or an id followed by `": {`).

In `docs/running.md`, How the review is posted, the "What is escaped and neutralised (#87)" list's item that opens `the body of a deferred item's drafted issue, field by field` (line 227): right after its sentence that ends with the words "would land in a new place (#95).", add:

```markdown
The shaper and the resolve agent are asked to write each of those fields as one paragraph with no line break, since a field with one is escaped whole, as below, and a code span in it would show the entity (#97, R3-3).
```

Proof: `grep -c '{DRAFT_FORM}' workflows/redline-loop.js` prints `2`, and `grep -c 'DRAFT_FORM,' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, How the review is posted, What is escaped and neutralised, the drafted issue's item, updated in this commit.

**Commit:** `redline: R3-3 ask for each drafted issue field as one paragraph (#95)`

## Task 4: R3-4, a reshape's draft check skips a finding the person or autopilot decided

`shape.md`, Decision 3 and Unattended answer 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check that opens `check('filing: a reshape\'s entry beside a decided call raises no draft and files nothing` (line 2995), add:

```js
  // A reshape that restates a deferral the person chose is not held to a draft of its own (#97,
  // R3-4): the decision's entry carries the resolve agent's draft, so a short one in the
  // restatement stops nothing.
  const mitigateCall = { 'R1-1': { choice: 'Mitigate', notes: 'The author ships a guard now.', date: '2026-11-16' } }
  const chosenEntry = { id: 'R1-1', mitigation: 'a guard', fullFix: 'a lock', title: 'Lock R1-1', found: 'found R1-1', why: 'why R1-1' }
  const shortReshape = await go('filing: a reshape restates a deferral the person chose, its draft short', { ...baseArgs, interrupt: 'autopilot', decisions: mitigateCall }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], reshapeDrafts: { 'R1-1': { found: '' } }, resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
  check('filing: a reshape that restates a decided deferral with a short draft does not stop the round, and the deferral is filed', shortReshape.res.status === 'done' && labels(shortReshape.calls).includes('reshape r1 #1') && labels(shortReshape.calls).includes('file deferred r1'), [shortReshape.res.status, shortReshape.res.stage, shortReshape.res.error])
```

Red: the check fails (the run ends with status error, stage shape: `the shaper deferred R1-1 with no drafted issue (missing found); a deferred item always carries one`). R1-10's `strayReshape` check just above it and the `undrafted` check (line 2845, a shaper's own deferral with no draft, still stopped at shape) are the neighbours, green on both runs.

**Change.** In `workflows/redline-loop.js`:

1. `checkDrafts` (lines 3119-3130). Its comment (it ends `since the spec check ran after the shaper.`) gains, wrapped to the comment's width: "On a reshape it skips the round's decided findings (`decided`): a deferral the person or autopilot made carries the resolve agent's draft, which resolveWith checked, and the decision stands whatever the reshape lists, so a restatement is not held to a draft of its own (#97, R3-4)." Its first two lines

   ```js
   function checkDrafts(shaped, shaperLabel) {
     for (const f of shaped.findings.filter((s) => s.disposition === 'defer')) {
   ```

   become

   ```js
   function checkDrafts(shaped, shaperLabel, decided = []) {
     for (const f of shaped.findings.filter((s) => s.disposition === 'defer' && !decided.includes(s.id))) {
   ```

2. `vetShape` (lines 3531-3553). Its comment (it ends with the words "its spec-status call.") gains: "`decided` is the ids of the round's decided findings, [] on the shape, which the draft check skips (#97, R3-4)." Its signature `async function vetShape(pass, record, inScope, shaped, known, label, suffix) {` becomes `async function vetShape(pass, record, inScope, shaped, known, label, suffix, decided = []) {`, and its line `  checkDrafts(shaped, label)` becomes `  checkDrafts(shaped, label, decided)`.

3. In `revise()`, the reshape's call (line 3798)

   ```js
       await vetShape(pass, record, inScope, shaped, calls, `reshape ${pass.tag} #${adjustment + 1}`, ` #${adjustment + 1}`)
   ```

   becomes

   ```js
       await vetShape(pass, record, inScope, shaped, calls, `reshape ${pass.tag} #${adjustment + 1}`, ` #${adjustment + 1}`, Object.keys(roundDecisions))
   ```

   The shape's call (line 3564) is unchanged, so the first shape's checks, which replay from cache on a relaunch, read no decision.

Proof: `grep -c 'checkDrafts(shaped, label, decided)' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, Dispositions, `defer`, says a deferral without its draft stops the run at shaping, which stays true of the shaper's own, and a decided finding's draft is the resolve agent's, which `docs/running.md`, Deferred items, The draft, already says stops the run at `resolve` when it is missing.

**Commit:** `redline: R3-4 skip a decided finding in a reshape's draft check (#95)`

## Task 5: R3-5, a planned deferral that ships nothing counts its own commit alone

`shape.md`, Decision 4 and Unattended answer 9.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the defer section, right after the check that opens `check('defer: a commit for a task the shaper planned with files is posted with the item and read by the final nit pass'` (line 2841), add:

```js
  // Only a planned deferral's own commit is posted with it when it ships nothing (#97, R3-5): the
  // standards commit names a finding it finishes, and a commit that only mentions the id is no
  // mitigation, so the reply names none and no final nit pass follows.
  const mentionedBare = await go('defer: the shaper lists files for a deferral that ships nothing, and only the standards commit names it', { ...baseArgs, deferrals: goAhead('R1-1') }, { reviews: [[f('R1-1', 'correctness')]], defer: ['R1-1'], mitigations: { 'R1-1': '' }, files: { 'R1-1': ['app/x.php'] }, commitIds: [['redline: record the round 1 review lessons in the standards, finishing R1-1 (#95)']] })
  check('defer: a commit that only mentions a planned deferral that ships nothing is not posted as its mitigation and earns no final nit pass', mentionedBare.res.status === 'done' && replyFor(mentionedBare.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: deferred to #301. · decided by: redline' && mentionedBare.res.rounds.length === 1 && !labels(mentionedBare.calls).includes('gather r2'), [mentionedBare.res.status, replyFor(mentionedBare.calls, 'push and reply r1', 'R1-1'), mentionedBare.res.rounds.map((r) => r.reviewed)])
```

The scripted checker gives a commit id that opens with `redline:` its own message (`tests/loop-test.mjs:293`), and the scripted implementer reports no commit, so the commit's `finding` is empty. Red: the check fails (the reply reads `Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: record the round 1 review lessons in the standards, finishing R1-1 (#95)). · decided by: redline`, and a final nit pass runs). R2-6's `plannedBare` check just above it, whose commit `redline: R1-1 fix` opens with the id, is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`:

1. Right after `mentions` (lines 588-590), add:

   ```js

   // A commit that is a finding's own (#97, R3-5): the one the implementer reported for it, or one
   // whose subject opens with its id, as a finding's own commit does (`redline: R1-2 reject ...`). A
   // commit that names the id later, as the standards commit does when it finishes a finding, only
   // mentions it.
   function ownCommit(commit, id) {
     return commit.finding === id || new RegExp(`^redline: ${id.replace(/[-]/g, '\\-')}([^0-9]|$)`).test(commit.message || '')
   }
   ```

2. In `outcomesFor`, the comment above `shipsNothing` (lines 2902-2905, it ends `and the commit is its own (#97, R1-10).`) gains: "Such a task's commit is its own alone: one the implementer reported for the finding or whose subject opens with its id, never one that only mentions it (#97, R3-5)." The line

   ```js
       const shipped = shipsNothing ? [] : named
   ```

   becomes

   ```js
       const shipped = shipsNothing ? [] : deferredItem && !hasMitigation(deferredItem) ? named.filter((c) => ownCommit(c, f.id)) : named
   ```

   A deferral with a mitigation, and every finding that is no deferral, keep `named`, so a standards commit that finishes a mitigated finding is still posted with it (`agents/redline-implementer.md:19`).

Proof: `grep -c 'ownCommit(c, f.id)' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, Rounds, step 6, says a deferral's reply gives `Mitigated in <sha> (...)` when a mitigation shipped, which this keeps true of a deferral that ships nothing.

**Commit:** `redline: R3-5 count only a planned deferral's own commit when it ships nothing (#95)`

## Task 6: R3-6, a decided finding keeps its deferred entry through a reshape

`shape.md`, Decision 5 and Unattended answer 8.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, in the filing section, right after the check Task 4 added (it opens `check('filing: a reshape that restates a decided deferral with a short draft does not stop the round, and the deferral is filed'`), add:

```js
  // The person's deferral stands through a reshape (#97, R3-6): a reshape that restates it with
  // another mitigation or another draft has its entry dropped, with a warning, and the resolve
  // agent's entry is the one filed and posted.
  const restated = await go('filing: a reshape restates a deferral the person chose, shipping nothing and with another draft', { ...baseArgs, interrupt: 'autopilot', decisions: mitigateCall }, { reviews: [[f('R1-1', 'correctness')], []], ask: ['R1-1'], planBounce: 1, reshapeDefer: ['R1-1'], mitigations: { 'R1-1': '' }, reshapeDrafts: { 'R1-1': { found: 'found R1-1 by the reshape' } }, resolveDeferred: [chosenEntry], commitIds: [['R1-1']] })
  check('filing: a reshape\'s entry for a decided deferral is dropped with a warning, and the resolve agent\'s draft is filed and its reply says where it went', restated.res.status === 'done' && ((draftsOf(restated)[0] || {}).content || '').includes('\nfound R1-1\n') && replyFor(restated.calls, 'push and reply r1', 'R1-1') === 'Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author' && (restated.res.warnings || []).includes('round 1: the reshape listed R1-1 as deferred, a finding the person or autopilot decided; the reshape\'s entry is dropped, since the decision stands'), [restated.res.status, draftsOf(restated), replyFor(restated.calls, 'push and reply r1', 'R1-1'), restated.res.warnings])
```

`mitigateCall` and `chosenEntry` are the constants Task 4 defined just above. The scripted shaper's `mitigations` reaches only the reshape's entry, since the first shape sorts R1-1 as an ask. Red: the check fails (no `file deferred r1` call is made, and the reply reads `Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author`). The stops section's `changed` run (lines 3096-3101), whose reshape changes a draft of the shaper's own deferral and is raised again as version 2, and R1-10's `strayReshape` run (2994-2995) are the neighbours, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `revise()`, in the bounced-plan loop, the line right after the one that opens `const stillDeferred = (id) => ` (line 3808)

```js
    deferred = shaped.deferred.concat(deferred.filter((item) => !shaped.deferred.some((d) => d.id === item.id) && stillDeferred(item.id))).filter((d) => !awayFromDefer(d.id))
```

becomes

```js
    // A finding the person or autopilot decided keeps the entry its decision was planned with (#97,
    // R3-6): a reshape's entry for it would replace that one, and isDeferral reads the entry, so a
    // restated mitigation could undo the person's deferral and a restated draft swap the one filed.
    // The reshape's entry is dropped with a warning; stillDeferred keeps the earlier one.
    const restated = shaped.deferred.filter((d) => roundDecisions[d.id]).map((d) => d.id)
    if (restated.length) {
      warnings.push(`${pass.name}: the reshape listed ${restated.join(', ')} as deferred, a finding the person or autopilot decided; the reshape's entry is dropped, since the decision stands`)
    }
    const reshaped = shaped.deferred.filter((d) => !roundDecisions[d.id])
    deferred = reshaped.concat(deferred.filter((item) => !reshaped.some((d) => d.id === item.id) && stillDeferred(item.id))).filter((d) => !awayFromDefer(d.id))
```

`shaped.deferred` itself is left as the reshape returned it, so `shaperMitigated` in the done rule reads the reshape's own list as before. The comment above the rebuild (lines 3802-3806) is unchanged.

Proof: `grep -c 'entry is dropped, since the decision stands' workflows/redline-loop.js` prints `1`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; a deferral you chose staying yours through a reshape is what `docs/running.md`, Deferred items ("A draft that changes is shown again") and Decided by already describe, and the warning is the run's own.

**Commit:** `redline: R3-6 keep a decided finding's deferred entry through a reshape (#95)`

## Task 7: R3-1, the GitHub agent's defer operation names the end-of-run filing

`shape.md`, Decision 6 and Unattended answer 10.

**Files:**

- `tests/loop-test.mjs`
- `agents/redline-github.md`

**Test first.** In `tests/loop-test.mjs`, at the end of the statements block, right after the check that opens `check('statements: the docs and the skill say a headless run that must not stop uses autopilot'` (line 3355) and before the block's closing `}` (line 3356), add:

```js
  // The defer operation runs at two times, and the GitHub agent's file names both (#97, R3-1).
  check('statements: the GitHub agent\'s defer operation names the end-of-run filing at Finish', read('agents', 'redline-github.md').includes('or, with deferred items raised at the end of the run, at Finish, before the replies those items waited for'), 'agents/redline-github.md, defer')
```

Red: the check fails.

**Change.** In `agents/redline-github.md`, the `defer` bullet (line 28) opens

```markdown
- **defer.** After the checker passed and before the push and the replies, only when the pass deferred something:
```

and becomes

```markdown
- **defer.** After the checker passed and before the push and the replies, or, with deferred items raised at the end of the run, at Finish, before the replies those items waited for, only when the pass deferred something:
```

The rest of the bullet is unchanged.

Proof: `grep -c 'at Finish, before the replies those items waited for' agents/redline-github.md` prints `1`.

**Docs entry:** `agents/redline-github.md`: no reader-facing change; `docs/running.md`, Deferred items, Filing, already says the drafts are filed "before its push and replies (or, with deferred items raised at the end of the run, when the run finishes)", and the README's Known limits entry "A self-review that edits an agent file runs its later rounds under the edit" covers this run's later rounds.

**Commit:** `redline: R3-1 name the end-of-run filing in the GitHub agent's defer operation (#95)`

## Task 8: R3-7, the human review summary words a draft's place as the replies do

`shape.md`, Decision 7 and Unattended answer 11.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, at the end of the filing section, right after the check that opens `check('filing: a human pass\'s reply and summary say where the deferral went'` (line 3019) and before the section's closing `}` (line 3020), add:

```js
  // The summary words a draft's place as the replies and the handoff do (#97, R3-7).
  const humanSpec = await go('filing: a human pass, the author defers a comment, drafts to the spec folder', { ...filedArgs, deferTo: 'spec', firstRound: 3, decisions: { 'H1-1': { choice: 'Mitigate', notes: 'The author defers the rewrite behind a guard.', date: '2026-11-16' } }, revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: humanFolder, findings: [h], commentIds: { 'H1-1': 900 }, posted: true } }, { reviews: [[]], ask: ['H1-1'], commitIds: [['H1-1'], []], resolveDeferred: [{ id: 'H1-1', mitigation: 'a guard', fullFix: 'a rewrite', title: 'Rewrite H1-1', found: 'found H1-1', why: 'why H1-1' }] })
  check('filing: a human pass\'s summary gives a draft\'s place in the words the replies use', humanSpec.res.status === 'done' && handoffOf(humanSpec, 'summary comment').includes(`H1-1 deferred; the issue draft is at \`${humanFolder}/redline/issue-H1-1.md\``), [humanSpec.res.status, handoffOf(humanSpec, 'summary comment')])
```

`h`, `humanFolder` and `filedArgs` are the constants of the run above it. Red: the check fails (the summary reads `H1-1 deferred to the draft at` and the path). The check on line 3019, whose summary reads `H1-1 deferred to #301`, is the neighbour, green on both runs.

**Change.** In `workflows/redline-loop.js`, in `humanSummary`:

1. The comment above the filed part (lines 4235-4236, it ends `so no finding has the kind.`) gains: "Each part reads as the replies and the handoff say where an item went (deferredTo; #97, R3-7)."

2. The line (4239)

   ```js
       parts.push(andList(filed.map((id) => (record.filed[id].where === 'issue' ? `${id} deferred to #${record.filed[id].number}` : `${id} deferred to the draft at \`${record.filed[id].path}\``))))
   ```

   becomes

   ```js
       parts.push(andList(filed.map((id) => `${id} ${deferredTo(record.filed[id])}`)))
   ```

Proof: `grep -c 'deferred to the draft at' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; `docs/running.md`, A human review pass, says "the summary line says where it went", which stays true.

**Commit:** `redline: R3-7 word a draft's place in the human review summary as the replies do (#95)`

## Task 9: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-16-1358-97-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text in `.claude/commands/agent-os/shape-spec.md` stays the source. Expected: loop 1293 checks passed, 0 failed; guard 601; prefs 172; gate 117; setup 512; gh 179; background 39.

10. **Docs.** Each entry above names its section or its reason: Task 3, `docs/running.md`, How the review is posted, What is escaped and neutralised; Tasks 2, 4, 5, 6, 7 and 8, no reader-facing change with the reason given. No config key, subcommand, allow rule or exit code is added.
11. **Version.** Stays 0.4.0: the pull request already carries the minor bump; nothing this round changes what a setup rerun writes (no template, allow entry, checks template or unattended body moves), and no template marker moves.
12. **Standards retrospective.** Apply only the edits the standards approver approves from `shape.md`, `## Standards retrospective (proposed)`, in their own commit after the finding commits: `redline: record the round 3 review lessons in the standards (#95)`. The file is `agent-os/standards/workflow/agents.md`. When none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** `plan.md` gains an As built section with each task's commit and its red and green counts, and any deviation is recorded under Decisions in `shape.md`, in a final commit: `redline: record review round 3 as built for PR #97 (#95)`.

**Files (steps 12 and 13):**

- `agent-os/standards/workflow/agents.md` (step 12, only the approved edits)
- `agent-os/specs/2026-11-16-1358-97-review-round-3/plan.md` (step 13)
- `agent-os/specs/2026-11-16-1358-97-review-round-3/shape.md` (step 13)

## As built

Counts are read off each gate run's kept result (`checks.sh` names the file under `kept`), red before the change and green after it. Every count matched the plan's arithmetic.

- **Task 1**, `e7870fa`: the spec folder.
- **Task 2 (R3-2, its mitigation)**, `bbf194a`. Red: loop `1278 checks passed, 4 failed`: the three new word-loop entries replied `Mitigated in 1bbbbbb (redline: standards edits for R1-1)` and bought round 2, and the `worded` run stopped at `check` with `checks.sh still fails after one repair pass in round 1: no commit names R1-1`; the comma neighbour, `noneOf` and `nothingBut` passed. Green: 1283. Proof: `1`.
- **Task 3 (R3-3, its mitigation)**, `4fb228f`. Red: `1283 checks passed, 1 failed`. Green: 1284. Proof: `2` and `1`.
- **Task 4 (R3-4)**, `6f26222`. Red: `1284 checks passed, 1 failed`: the run stopped at shape with `the shaper deferred R1-1 with no drafted issue (missing found); a deferred item always carries one`; `strayReshape` and `undrafted` passed. Green: 1286. Proof: `1`.
- **Task 5 (R3-5)**, `fb71400`. Red: `1287 checks passed, 1 failed`: the reply read `Redline round 1: deferred to #301. Mitigated in 1bbbbbb (redline: record the round 1 review lessons in the standards, finishing R1-1 (#95)). · decided by: redline` and a final nit pass ran; `plannedBare` passed. Green: 1288. Proof: `1`.
- **Task 6 (R3-6)**, `4b25d8d`. Red: `1289 checks passed, 1 failed`: no draft was filed, the reply read `Redline round 1: The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). · decided by: @author`, and no warning was recorded; `changed` and `strayReshape` passed. Green: 1290. Proof: `1`.
- **Task 7 (R3-1)**, `78e7e06`. Red: `1290 checks passed, 1 failed`. Green: 1291. Proof: `1`.
- **Task 8 (R3-7)**, `951fd40`. Red: `1292 checks passed, 1 failed`: the summary read `H1-1 deferred to the draft at` and the path; the issue-form neighbour passed. Green: 1293. Proof: `0`.
- **Standards retrospective**, `77cbd73`: the five approved edits to `agent-os/standards/workflow/agents.md` (lines 49, 39, 40, 47 and 16, each at the end of its bullet). They are lessons; no finding's fix runs through them, so the message names none.
- Final counts, the gate at `77cbd73` (`ok` true, no unexpected or uncommitted file): loop 1293, guard 601, prefs 172, gate 117, setup 512, gh 179, background 39.
- Each task's red run came after the previous task's commit, so no gate run served two tasks. Each commit staged its own task's files by name.

No deviation from the plan, so `shape.md` gains no Decision.
