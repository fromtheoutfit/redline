# PR #120 review round 3: what a shape-stage resume reruns, the upgrade all-clear, a pin that reads the field, the restore clause's opening, and the cost of the spec check first

Spec folder: `agent-os/specs/2026-11-22-1457-120-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #120 (issues #117 and #116), from the round's six findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). This is the final nit round, and the plan covers its six nits.

- `fix`, one task each, in finding order: R3-1 (Task 2), R3-2 (Task 3), R3-3 (Task 4), R3-4 (Task 5), R3-5 (Task 6), R3-6 (Task 7).
- No `decline`, no `defer`, no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#117)`. No commit subject holds a bare `@word`.

Line numbers are at `bf12327`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, `agents/`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.5`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`**, which the pull request's own caution names ("a round that edits one of them meets #81"). A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"). No agent file changes.

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 4 edits the `args.resume` normalisation (291) for its mutation only and puts it back before its commit, so it is the round's first edit of the file, made while the file matches HEAD.
  - Task 6 changes the restore clause (720).
  - Task 7 adds to the comment above `vetShape`, between its lines 3830 and 3831.
- `docs/running.md`, section "Run markers and resume" (208): Task 2 changes the sentence that opens "A resume at the shape stage reruns the shaper" and adds a sentence after the one that ends "the one call the workflow writes is the repository-rule ask)."; Task 7 adds a sentence after Task 2's new one.
- `tests/loop-test.mjs`:
  - Task 2 appends one element to the `docs/running.md` row of the phrase list (3111).
  - Task 3 adds a `docs/upgrading.md` row right after that row.
  - Task 4 rewrites one scenario and its check (1765-1767).
  - Task 5 changes the spacing of `RESTORE` (3714).
  - Task 6 changes `RESUME_WORDS` (416) and the string of `RESTORE` (3714, as Task 5 leaves it), and adds one check after the `plainLost` check (3786).
  - Task 7 appends one element to the `docs/running.md` row, after Task 2's.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes checks makes that test change first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-3/redline/snapshot.json`, which prints the failing check names. Task 4's pin already holds, so it is seen red under a mutation instead (testing/tests, line 35), as that task says. Task 5 changes whitespace only, so it has no red run. If gate runs are slow, the red runs of Tasks 2, 3 and 7 may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round the loop prints `1670 checks passed, 0 failed` (round 2's As built, over the tree at `9e1f5ea`; the two commits after it, `26ff100` and `bf12327`, change only standards and round 2's `plan.md`), and every other harness prints what the baseline prints.

| Task | Adds | Red run | Green run |
| --- | --- | --- | --- |
| Task 2 | 1, a docs phrase pin | `1670 checks passed, 1 failed` | `1671 checks passed, 0 failed` |
| Task 3 | 1, a docs phrase pin | `1671 checks passed, 1 failed` | `1672 checks passed, 0 failed` |
| Task 4 | 0 (one scenario and its check rewritten) | under the mutation: `1667 checks passed, 5 failed` | `1672 checks passed, 0 failed` |
| Task 5 | 0 | none | `1672 checks passed, 0 failed` |
| Task 6 | 1, the restore clause after a "no plan.md" stop. The six existing checks that compare against `RESTORE` go red on the red run and green after the change | `1666 checks passed, 7 failed` | `1673 checks passed, 0 failed` |
| Task 7 | 1, a docs phrase pin | `1673 checks passed, 1 failed` | `1674 checks passed, 0 failed` |

So the loop reads `1674 checks passed, 0 failed`. The red counts are read off the source: the checks that name `RESTORE` (3721, 3731, 3781, 3786, 3794, 3798) and the resume entries that pass `ownCheck: false` (the `resumedReshape` helper's `crashed`, `plainLost` and `humanLost`, and `thirdTime`). The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with every failing check's name and its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-22-1457-120-review-round-3/plan.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-3/shape.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-3/standards.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #120 (#117)`

## Task 2: R3-1, say where a resume after the spec-status call's own failure goes

`shape.md`, Decision 1 and Unattended answer 4.

**Files:**

- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the phrase list (3111), the end of the `docs/running.md` row:

```js
'The check sees a refused Write only where it leaves a file missing']],
```

becomes:

```js
'The check sees a refused Write only where it leaves a file missing', 'so a resume reruns the check alone']],
```

That text occurs once. See the new check, `defer: docs/running.md says "so a resume reruns the check alone"`, fail on a gate run.

**Change.** In `docs/running.md`, section "Run markers and resume" (208):

1. The sentence:

   ```
   A resume at the shape stage reruns the shaper, which never touches `redline/`.
   ```

   becomes:

   ```
   A resume at the shape stage reruns the shaper, which never touches `redline/`, unless the spec check's own call failed (below).
   ```

2. After the sentence that ends:

   ```
   and a resume reruns the shaper (#57; the one call the workflow writes is the repository-rule ask).
   ```

   add, as the next sentence of the same paragraph:

   ```
   When that call itself fails (a refused `git grep`, say), the stop is at stage `shape` too, as one to fix by hand, but it keeps the call's own label (`spec status r<n>`, `spec status h<n>`, and `spec status r<n> #<k>` or `spec status h<n> #<k>` after a reshape), so a resume reruns the check alone and the shaper's result replays from cache (#120, R3-1).
   ```

   The next sentence, which opens "The record folder holds only what the run wrote", follows it unchanged. No other sentence of the paragraph changes.

Neighbours, green before and after: "spec: a failed check names the status label, not the shaper" (1809-1810), the phrase list's `The check sees a refused Write only where it leaves a file missing`, and "resume: docs/running.md says which stops need no hand fix and that the marker carries ownCheck" (1775).

**Proof:** `grep -c "unless the spec check's own call failed (below)" docs/running.md` prints `1`, and `grep -c "so a resume reruns the check alone" docs/running.md tests/loop-test.mjs` prints `1` for each file (each printed `0` before).

**Docs entry:** no plugin file changes in this task; `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R3-1 say a resume after the spec check's own failure reruns the check alone (#117)`

## Task 3: R3-2, limit the upgrade section's all-clear to the runs it is true of

`shape.md`, Decision 2 and Unattended answer 5.

**Files:**

- `docs/upgrading.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the phrase list, right after the `docs/running.md` row as Task 2 leaves it (the line that ends `'so a resume reruns the check alone']],`), add this row, indented as the rows beside it:

```js
    ['docs/upgrading.md', read('docs', 'upgrading.md'), ['and is not stopped at one now, is not affected']],
```

The row after it, which opens `['the README\'s Known limits'`, does not change. See the new check, `defer: docs/upgrading.md says "and is not stopped at one now, is not affected"`, fail on a gate run.

**Change.** In `docs/upgrading.md`, section "A stopped run across 0.4.5 (#116, #117)" (41), the sentence:

```
A run that never resumed at one of those steps is not affected.
```

becomes:

```
A run that never resumed at one of those steps, and is not stopped at one now, is not affected.
```

The sentence before it, "Finish or restart a stopped run before updating across 0.4.5.", and the section's first paragraph (39) do not change.

**Proof:** `grep -c "and is not stopped at one now, is not affected" docs/upgrading.md tests/loop-test.mjs` prints `1` for each file, and `grep -c "A run that never resumed at one of those steps is not affected" docs/upgrading.md` prints `0`.

**Docs entry:** no plugin file changes in this task; `docs/upgrading.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R3-2 limit the 0.4.5 upgrade note's all-clear to runs not stopped at those steps (#117)`

## Task 4: R3-3, compare ownCheck false with an absent field where the line reads it

`shape.md`, Decision 3 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs` (the change, committed)
- `workflows/redline-loop.js` (the mutation only, put back before the commit; this task commits no change to it)

**Test change.** In `tests/loop-test.mjs`, section 13, these three lines (1765-1767):

```js
  const falseOwn = await go('resume: ownCheck false', { ...baseArgs, resume: { 'recheck r1': { attempt: 2, error: errorText, hand: { commits: [], paths: [] }, ownCheck: false } } }, onlyFirst)
  const everyPrompt = (r) => r.calls.map((c) => `${c.label}\n${c.prompt}`).join('\n')
  check('resume: an entry that says ownCheck false builds the prompts of one that says nothing', !falseOwn.thrown && falseOwn.res.status === 'done' && everyPrompt(falseOwn) === everyPrompt(second), falseOwn.thrown ? falseOwn.thrown.message : labels(falseOwn.calls))
```

become these six:

```js
  // ownCheck false reads as an entry with no field (#116). The comparison runs at a first shape,
  // whose line reads the field: until #120, R3-3 it ran at recheck r1, whose line never does, so
  // a normalisation that read false as true stayed green here.
  const falseOwn = await go('resume: shape stage relaunch from an entry with ownCheck false', { ...baseArgs, resume: { 'shape r1': { attempt: 2, error: 'the shaper gave no disposition for R1-2', hand: { commits: [], paths: [] }, ownCheck: false } } }, two)
  const everyPrompt = (r) => r.calls.map((c) => `${c.label}\n${c.prompt}`).join('\n')
  check('resume: an entry that says ownCheck false builds the prompts of one that says nothing, at a first shape, whose line reads the field', !falseOwn.thrown && falseOwn.res.status === 'done' && shapePromptOf(falseOwn).endsWith(line('the shaper gave no disposition for R1-2') + shaperLine) && everyPrompt(falseOwn) === everyPrompt(reshapedFieldless), falseOwn.thrown ? falseOwn.thrown.message : shapePromptOf(falseOwn).slice(-600))
```

Every name it uses is defined earlier in the same block: `two` (1667), `line` (1595), `shaperLine` (1596), `shapePromptOf` (1678) and `reshapedFieldless` (1682), which resumes at `shape r1` on `two` with the same error and no `ownCheck`. The shaper's prompt is pinned against the literal line as well as compared with the other run's, since a comparison of two outputs passes when both are empty (testing/tests, line 31). `second` and `onlyFirst` stay in use by the checks before this one.

**The mutation, never committed.** The pin holds before and after this task, so it cannot be red before a change; it is seen red under a mutation of the clause it turns on (testing/tests, line 35). The door testing/tests line 36 names, a mutated copy in the temp directory, needs an interpreter no Redline role may run, so the mutation is made in place, as round 2's Task 2 and PR #114 round 1's Task 7 did:

1. In `workflows/redline-loop.js`, the end of the `args.resume` normalisation (291):

   ```js
   ownCheck: entry.ownCheck === true }
   ```

   becomes:

   ```js
   ownCheck: entry.ownCheck !== undefined }
   ```

   That text occurs once in the file.

2. Run the gate. Expected: `1667 checks passed, 5 failed`, the failing checks being "resume: an entry that says ownCheck false builds the prompts of one that says nothing, at a first shape, whose line reads the field", "reshape: a reshape of a decided round resumed after it returned nothing is told to restore what is missing, never to rewrite", "reshape: a reshape of a round with no decision resumed after its spec check is told to restore what is missing, never to rewrite", "reshape: a human review pass's reshape resumed after its spec check is told to restore what is missing, never to rewrite" and "reshape: a third attempt after the hold and then the spec check is told to restore what is missing, never to rewrite". Record every failing check's name under As built; the first one must be among them.
3. Put the line back exactly as it was. `git diff -- workflows/redline-loop.js` prints nothing.
4. Run the gate again. Expected: `1672 checks passed, 0 failed`.

Neighbours, green before and after: "resume: a first shape resumed from an entry with no ownCheck ends with the line and the replace sentence, as it always did" (1683), "resume: an ownCheck that is neither true nor false is refused" (1764), "resume: the resumed prompt ends with the resume line" (1608), and the two rules over every scenario that read `ownCheck` on every error result.

**Proof:** `grep -c "at a first shape, whose line reads the field" tests/loop-test.mjs` prints `1`, `grep -c "everyPrompt(second)" tests/loop-test.mjs` prints `0`, and `git diff -- workflows/redline-loop.js` prints nothing.

**Docs entry:** no plugin file changes in this task's commit (`tests/loop-test.mjs` only); no reader-facing change.

**Commit** (stage `tests/loop-test.mjs` alone): `redline: R3-3 compare ownCheck false with an absent field at a first shape, which reads it (#117)`

## Task 5: R3-4, put back the space after `=` in the RESTORE constant

`shape.md`, Decision 4 and Unattended answer 7.

**Files:**

- `tests/loop-test.mjs`

**Change.** In `tests/loop-test.mjs` (3714), the start of the line:

```js
  const RESTORE =' This step is a reshape,
```

becomes:

```js
  const RESTORE = ' This step is a reshape,
```

The rest of the line, the string included, does not change. The change is whitespace, so no check can be red before it.

**Proof:** `grep -c "const RESTORE = ' This step is a reshape" tests/loop-test.mjs` prints `1` and `grep -c "const RESTORE ='" tests/loop-test.mjs` prints `0`; the gate prints `1672 checks passed, 0 failed`.

**Docs entry:** no plugin file changes in this task; no reader-facing change.

**Commit:** `redline: R3-4 put back the space after the equals sign in the RESTORE constant (#117)`

## Task 6: R3-5, open the restore clause with what is true after every stop it follows

`shape.md`, Decision 5 and Unattended answer 8.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In `RESUME_WORDS` (416), the element:

   ```js
   'This step is a reshape, so the spec folder already holds the plan'
   ```

   becomes:

   ```js
   'This step is a reshape, so the spec folder already holds the earlier work of this round'
   ```

2. In `RESTORE` (3714, as Task 5 leaves it), the start of the string:

   ```js
   const RESTORE = ' This step is a reshape, so the spec folder already holds the plan: read plan.md,
   ```

   becomes:

   ```js
   const RESTORE = ' This step is a reshape, so the spec folder already holds the earlier work of this round, though part of it may be missing: read plan.md,
   ```

   The rest of the string does not change.

3. After the check whose name opens "reshape: a reshape of a round with no decision resumed after its spec check is told to restore what is missing" (3786), add:

   ```js
     // The restore clause opens with what is true after every stop it follows (#120, R3-5): the spec
     // check's no plan.md stop is one of them, and until R3-5 the clause opened by saying the folder
     // already held the plan.
     check('reshape: a reshape resumed after its spec check found no plan.md is told part of the folder may be missing, never that the folder already holds the plan', plainLost.error.endsWith(': no plan.md') && plainLost.prompt.includes('already holds the earlier work of this round, though part of it may be missing') && !plainLost.prompt.includes('already holds the plan'), shown(plainLost))
   ```

See the new check fail on a gate run, beside the six existing checks that compare against `RESTORE`: the ones whose names open "reshape: an entry with no ownCheck is an ordinary stop whatever its error says" (3721), "reshape: a reshape resumed after another stop is told to restore what is missing and keep the decided entries" (3731), "reshape: a reshape of a decided round resumed after it returned nothing" (3781), "reshape: a reshape of a round with no decision resumed after its spec check" (3786), "reshape: a human review pass's reshape resumed after its spec check" (3794) and "reshape: a third attempt after the hold and then the spec check" (3798). Expected: `1666 checks passed, 7 failed`.

**Change.** In `workflows/redline-loop.js`, `resumeLine`, the restore clause (720), the start of the string:

```js
        : ' This step is a reshape, so the spec folder already holds the plan: read plan.md,
```

becomes:

```js
        : ' This step is a reshape, so the spec folder already holds the earlier work of this round, though part of it may be missing: read plan.md,
```

The rest of the clause keeps its bytes, its ban on writing a lost decided entry from memory and its ban on touching `redline/` included. No other clause changes: the first shape's sentences, the clause after the workflow's own check and the resolve's clause keep their bytes, and no prompt of a run without a resume entry changes. `RESUME_WORDS` now names the new opening, so the rule over every scenario still proves no prompt of a run without a resume entry holds the clause. Rule 9 of `agents/redline-shaper.md`, `docs/running.md` and the replay standard describe what the clause has the rerun do and do not repeat its opening, so none changes; the pull request's own spec records the clause as that spec built it, and that record is left as it is.

Neighbours, green before and after: "reshape: a reshape resumed after another stop keeps a decided task unless an adjustment above changes it" (3735), "reshape: a reshape of a round with no decision resumed after a check of its result is told to correct what the error names" (3788), the four checks that compare against `CORRECT_IN_PLACE`, the rule over every scenario that no prompt of a run without a resume entry holds a resume line, and the rule that no reshape is told to rewrite.

**Proof:** `grep -c "already holds the plan" workflows/redline-loop.js` prints `0`; `grep -c "already holds the earlier work of this round, though part of it may be missing" workflows/redline-loop.js tests/loop-test.mjs` prints `workflows/redline-loop.js:1` and `tests/loop-test.mjs:2` (`RESTORE` and the new check); `grep -c "so the spec folder already holds the earlier work of this round'" tests/loop-test.mjs` prints `1` (`RESUME_WORDS`).

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume": no reader-facing change, since the section says what the restore clause has the reshape do ("it reads the four files as they stand, keeps the decided entries, and their tasks unless an adjustment changes one, and writes again what is missing"), which this rewording keeps; only the clause's opening words change.

**Commit:** `redline: R3-5 open the restore clause with what holds after a missing plan.md too (#117)`

## Task 7: R3-6, say that the spec check first costs a second relaunch when its own call fails beside a refused result

`shape.md`, Decision 6 and Unattended answer 9.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the phrase list, the end of the `docs/running.md` row as Task 2 leaves it:

```js
'so a resume reruns the check alone']],
```

becomes:

```js
'so a resume reruns the check alone', 'so that case takes two relaunches']],
```

See the new check, `defer: docs/running.md says "so that case takes two relaunches"`, fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, the comment above `vetShape`, between the line that ends `telling a refused Write from a rerun that rightly changed no file needs a check of its own).` (3830) and the line that opens `// Every check after the spec check names the shaper's label itself` (3831), add these six lines:

   ```
   // The order costs a relaunch in one case. The spec-status call's own failure keeps that call's
   // label (checkSpec, #57), so its resume replays the shaper's result unchanged, and a result one
   // of the checks below refuses then stops the relaunch again, at the shaper, with nothing to fix
   // by hand. It needs a failed status call and a refused result in one attempt, the checks after
   // the spec check had it before R1-3, and giving the status failure the shaper's label would
   // undo #57's rule that the check's own failure reruns the check, so it is accepted (#120, R3-6).
   ```

   No code changes, and the order of the checks stays as R1-3 set it.

2. In `docs/running.md`, section "Run markers and resume" (208), after the sentence Task 2 added, which ends:

   ```
   so a resume reruns the check alone and the shaper's result replays from cache (#120, R3-1).
   ```

   add, as the next sentence of the same paragraph:

   ```
   If that result also fails one of the shaper's checks of its own result, the relaunch stops again, at the shaper, with nothing to fix by hand, since the folder is checked before the result, so that case takes two relaunches (#120, R3-6).
   ```

   No other sentence of the paragraph changes.

The behaviour the sentence states is pinned in its parts already: the status failure's label ("spec: a failed check names the status label, not the shaper", 1809-1810), the result check's stop at the shaper after the spec check ("spec: an ask without a judgment call stops at shape after the check, resumable at the shaper", 1811-1812) with `ownCheck` true (the `OWN_CHECKS` rule), and a resume line appended only at the label its entry names ("resume: no other prompt carries the line", 1609). Those are the neighbours, green before and after, with "spec: an attempt that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the shaper" (1821).

**Proof:** `grep -c "so that case takes two relaunches" docs/running.md tests/loop-test.mjs` prints `1` for each file (each printed `0` before), and `grep -c "so it is accepted (#120, R3-6)." workflows/redline-loop.js` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit (the cost the comment states, said to the person).
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R3-6 say the spec check first costs a second relaunch after its own call fails beside a refused result (#117)`

## Task 8: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1674 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 6 and 7; Task 4 commits no change to it), with the section and the reason given in each task: Task 6 has no reader-facing change, since `docs/running.md` describes the restore clause by what it does, and Task 7 updates `docs/running.md`, "Run markers and resume". `docs/running.md` and `docs/upgrading.md` are reader-facing by nature. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.5`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/process/docs-gate.md` (items 1 and 2), `agent-os/standards/workflow/replay.md` (items 3 and 4) and `agent-os/standards/testing/tests.md` (item 5), each clause appended to the end of its line and read back in its whole line. Title it `redline: record the round 3 review lessons in the standards (#117)`. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts (Task 4's red under the mutation, with every failing check's name), and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 3 for PR #120 (#117)`.

**Files** (this task): `agent-os/standards/process/docs-gate.md`, `agent-os/standards/workflow/replay.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-22-1457-120-review-round-3/plan.md` and `shape.md` (As built and any deviation).

## As built

Every count below is the loop harness's own line, read off a gate run (`.claude/redline/checks.sh` with this round's snapshot); every other harness exited 0 on every run. Each red run was its own gate run, so no red runs were combined. No deviation from the plan: every count matched the table above, and `shape.md` needs no deviation entry.

| Task | Finding | Commit | Red run | Green run |
| --- | --- | --- | --- | --- |
| Task 1 | spec folder | `a559a6f` | none | none |
| Task 2 | R3-1 | `cbffb87` | `1670 checks passed, 1 failed` (`defer: docs/running.md says "so a resume reruns the check alone"`) | `1671 checks passed, 0 failed` |
| Task 3 | R3-2 | `ed731cd` | `1671 checks passed, 1 failed` (`defer: docs/upgrading.md says "and is not stopped at one now, is not affected"`) | `1672 checks passed, 0 failed` |
| Task 4 | R3-3 | `ec0f512` | under the mutation: `1667 checks passed, 5 failed` | `1672 checks passed, 0 failed` |
| Task 5 | R3-4 | `34485ba` | none (whitespace) | `1672 checks passed, 0 failed` |
| Task 6 | R3-5 | `43bb9ea` | `1666 checks passed, 7 failed` | `1673 checks passed, 0 failed` |
| Task 7 | R3-6 | `6ba2f92` | `1673 checks passed, 1 failed` (`defer: docs/running.md says "so that case takes two relaunches"`) | `1674 checks passed, 0 failed` |
| Task 8 | standards retrospective | `5dcfead` | none | `1674 checks passed, 0 failed` |

**The gate at `5dcfead`.** `done: PASS`, `ok: true`, all nine checks exit 0, the loop printing `1674 checks passed, 0 failed` as the plan expected, with `git.unexpected_files` and `git.uncommitted` both empty.

**Task 4's mutation.** `ownCheck: entry.ownCheck === true }` at `workflows/redline-loop.js:291` became `ownCheck: entry.ownCheck !== undefined }`, the round's first edit of that file, made while it matched HEAD. The gate printed `1667 checks passed, 5 failed`, the five being:

- resume: an entry that says ownCheck false builds the prompts of one that says nothing, at a first shape, whose line reads the field (the rewritten check, first among them)
- reshape: a reshape of a decided round resumed after it returned nothing is told to restore what is missing, never to rewrite
- reshape: a reshape of a round with no decision resumed after its spec check is told to restore what is missing, never to rewrite
- reshape: a human review pass's reshape resumed after its spec check is told to restore what is missing, never to rewrite
- reshape: a third attempt after the hold and then the spec check is told to restore what is missing, never to rewrite

The line was then put back exactly as it was, `git diff -- workflows/redline-loop.js` printed nothing, and the next gate run printed `1672 checks passed, 0 failed`. The commit staged `tests/loop-test.mjs` alone.

**Task 6's red run.** The seven failing checks were the six that compare against `RESTORE` and the new one:

- reshape: an entry with no ownCheck is an ordinary stop whatever its error says: a reshape resumed from one is told to restore what is missing, never that the stop was the workflow's check
- reshape: a reshape resumed after another stop is told to restore what is missing and keep the decided entries, never to rewrite the folder, and the relaunch finishes
- reshape: a reshape of a decided round resumed after it returned nothing is told to restore what is missing, never to rewrite
- reshape: a reshape of a round with no decision resumed after its spec check is told to restore what is missing, never to rewrite
- reshape: a reshape resumed after its spec check found no plan.md is told part of the folder may be missing, never that the folder already holds the plan (new)
- reshape: a human review pass's reshape resumed after its spec check is told to restore what is missing, never to rewrite
- reshape: a third attempt after the hold and then the spec check is told to restore what is missing, never to rewrite

**Proofs.** Each task's `grep` proof printed what the task says: Task 2 `1` and `1` per file; Task 3 `1` per file and `0` for the old sentence; Task 4 `1`, `0` and an empty `git diff`; Task 5 `1` and `0`; Task 6 `0`, `workflows/redline-loop.js:1`, `tests/loop-test.mjs:2` and `1`; Task 7 `1` per file and `1`.

**Gate step 10, Docs.** `workflows/redline-loop.js` is the one plugin file the round's commits change: Task 6 (`43bb9ea`) has no reader-facing change, for the reason Task 6 gives, and Task 7 (`6ba2f92`) updated `docs/running.md`, "Run markers and resume". Task 4's commit holds no change to it. `docs/running.md` and `docs/upgrading.md` are reader-facing by nature.

**Gate step 11, Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both still read `0.4.5`; no file under `.claude-plugin/` changed.

**Gate step 12, Standards retrospective.** The five approved edits were applied as approved in `5dcfead`, each clause appended to the end of its line and read back in its whole line (parentheses closed, no citation superseded): `process/docs-gate.md` lines 19 and 20, `workflow/replay.md` lines 19 and 20, `testing/tests.md` line 36. No edit finishes a finding (`shape.md`, "Standards retrospective (proposed)"), so the commit names none.
