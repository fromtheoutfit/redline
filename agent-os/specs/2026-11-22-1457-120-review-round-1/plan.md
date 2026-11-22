# PR #120 review round 1: a decided task an adjustment moves, the spec check first, three stale comments, and the first-shape claim

Spec folder: `agent-os/specs/2026-11-22-1457-120-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #120 (issues #117 and #116), from the round's four findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- `fix`, one task each, in finding order: R1-2 (Task 2), R1-3 (Task 3), R1-4 (Task 4).
- `ask`: R1-1, decided by the person (`@michaelfromtheoutfit`) after shaping: `defer`, with a mitigation that ships here (Task 5); the revise-only path goes to the drafted issue under Deferred in `shape.md` (Decision 4).
- No `decline`, and no `defer` from the shaper.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#117)`. No commit subject holds a bare `@word`.

Line numbers are at `47952b1`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.5`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5, as earlier review rounds read it). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`**, which the pull request's own caution names ("a round that edits one of them meets #81"). A relaunch of this run runs the script it launched with, and the skill reports the changed agent file, which the handoff comment repeats (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits, "A self-review that edits an agent file runs its later rounds under the edit").

**Task order matters in five files.**

- `workflows/redline-loop.js`:
  - Task 2 changes one sentence of the comment in `resumeLine` (694-697) and the restore clause (712).
  - Task 3 changes `checkDispositions` (3235-3256), `checkCalls` (3310-3330) and `vetShape` (3807-3825).
  - Task 4 changes the comment above `checkSpec` (3397-3400) and two comments in the hold after a reshape (4289-4290, 4295-4296).
  - Task 5 changes the opening of the comment in `resumeLine` (682-685), above Task 2's sentence.
- `docs/running.md`, section "Run markers and resume" (208): Task 3 changes the sentence that opens "A missing `plan.md`", Task 2 the clause that opens "it reads the four files as they stand", Task 5 the sentence that opens "At a round's first shape". Different sentences of one paragraph.
- `agents/redline-shaper.md`: Task 2 alone, one sentence of rule 9 (32).
- `tests/loop-test.mjs`:
  - Task 2 changes `RESTORE` (3697), adds a check after the `specRestored` check (3709) and one after the shaper-file check whose name opens "reshape: the shaper's file says a resumed reshape never rewrites" (3717), and adds one element to the end of the `docs/running.md` phrase list (3096).
  - Task 3 changes three checks (1331, 1812, 2701), adds a block after the `extra` check (1814) and one after the `reshapeDropped` check (1847), and adds one element to the same phrase list, after Task 2's.
  - Task 4 changes one comment (3721-3723).
  - Task 5 changes two comments (3691-3692, 3710-3712) and adds one element to the same phrase list, after Task 3's.
- `agent-os/standards/workflow/replay.md`, line 19: Task 5 rewords the clause that opens "The from-scratch sentence stays for a round's first shape", in the middle of the line; the standards commit in Task 6 appends item 1 to the end of the same line afterwards.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds checks adds them first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-1/redline/snapshot.json`, which prints the failing check names. If gate runs are slow, the red runs of Tasks 2, 3 and 5 may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round the loop prints `1658 checks passed, 0 failed` (the pull request's description, over the tree at `47952b1`), and every other harness prints what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 3 | the restore clause's phrase on a resumed prompt, the shaper file's phrase, one docs phrase pin. The six existing checks that compare against `RESTORE` go red on the red run and green after the change |
| Task 3 | 3 | two combined-stop checks (no run-record check: both runs stop at shape), one docs phrase pin. The three changed checks go red on the red run and green after the change |
| Task 4 | 0 | comments only |
| Task 5 | 1 | one docs phrase pin; the two comments and the standard's clause add no check |

So the loop reads `1665 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-22-1457-120-review-round-1/plan.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-1/shape.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-1/standards.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #120 (#117)`

## Task 2: R1-2, a resumed reshape keeps a decided task unless an adjustment changes it

`shape.md`, Decision 1 and Unattended answer 5.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-shaper.md`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. The `RESTORE` constant (3697):

   ```js
     const RESTORE = ' This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided and the task written for it, write again what is missing or left unfinished, and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

   becomes:

   ```js
     const RESTORE = ' This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task, then write again what is missing or left unfinished and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

2. After the check whose name opens "reshape: a reshape resumed after another stop is told to restore what is missing and keep the decided entries" (3709), add:

   ```js
     // A decided finding's task follows an adjustment the reshape applies (#106), so the restore
     // clause keeps a decided task unless an adjustment changes it (#120, R1-2): until R1-2 it said
     // to keep the task, beside a reshape prompt that says to apply each adjustment.
     check('reshape: a reshape resumed after another stop keeps a decided task unless an adjustment above changes it', reshapePromptOf(specRestored).includes('keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task'), reshapePromptOf(specRestored).slice(-700))
   ```

3. After the check whose name opens "reshape: the shaper's file says a resumed reshape never rewrites from scratch" (3717), add:

   ```js
     check('reshape: the shaper\'s file says a reshape resumed after any other stop keeps a decided task unless an adjustment changes it', shaperFile.includes('keep every decided entry, and its task unless an adjustment changes that task'))
   ```

4. In the `docs/running.md` phrase list (3096), the end of the line:

   ```js
   'named in `shape.md` as lost, never written back from memory']],
   ```

   becomes:

   ```js
   'named in `shape.md` as lost, never written back from memory', 'and their tasks unless an adjustment changes one']],
   ```

See the three new checks fail on a gate run, beside the six existing checks that compare against `RESTORE`: the ones named "reshape: an entry with no ownCheck is an ordinary stop whatever its error says: a reshape resumed from one ...", "reshape: a reshape resumed after another stop is told to restore what is missing ...", "reshape: a reshape of a decided round resumed after it returned nothing ...", "reshape: a reshape of a round with no decision resumed after its spec check ...", "reshape: a human review pass's reshape resumed after its spec check ..." and "reshape: a third attempt after the hold and then the spec check ...".

**Change.**

1. In `workflows/redline-loop.js`, `resumeLine`, the restore clause (712):

   ```js
           : ' This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided and the task written for it, write again what is missing or left unfinished, and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

   becomes:

   ```js
           : ' This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided, and the task written for it unless an adjustment above changes that task, then write again what is missing or left unfinished and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

   The clause still opens "This step is a reshape, so the spec folder already holds the plan", which `RESUME_WORDS` in the loop test reads over every scenario.

2. In the same function's comment (695-696), the text:

   ```
     // returned nothing) the folder may be incomplete, so the rerun restores what is missing, and
     // never writes from memory a decided entry the folder no longer holds: the reshape prompt
   ```

   becomes:

   ```
     // returned nothing) the folder may be incomplete, so the rerun restores what is missing, keeps
     // each decided entry and its task unless an adjustment changes that task (#120, R1-2), and
     // never writes from memory a decided entry the folder no longer holds: the reshape prompt
   ```

3. In `agents/redline-shaper.md`, rule 9 (32), the sentence:

   ```
   After any other stop, read the four files as they stand, keep every decided entry and its task, write again what is missing or left unfinished, and return the whole result again; never write a decided entry the folder no longer holds from memory, name it in `shape.md` as lost.
   ```

   becomes:

   ```
   After any other stop, read the four files as they stand, keep every decided entry, and its task unless an adjustment changes that task, then write again what is missing or left unfinished and return the whole result again; never write a decided entry the folder no longer holds from memory, name it in `shape.md` as lost.
   ```

   No other sentence of rule 9 changes. The phrases the loop test pins in the file ("A resumed reshape never rewrites from scratch", "correct what the error names", "write again what is missing or left unfinished", "never write a decided entry the folder no longer holds from memory", and the sentence that bans touching `redline/`) stay as they are.

4. In `docs/running.md`, section "Run markers and resume" (208), the text:

   ```
   it reads the four files as they stand, keeps the decided entries and their tasks, and writes again what is missing;
   ```

   becomes:

   ```
   it reads the four files as they stand, keeps the decided entries, and their tasks unless an adjustment changes one, and writes again what is missing;
   ```

   No other sentence of the paragraph changes.

**Proof:** `grep -c "and the task written for it unless an adjustment above changes that task" workflows/redline-loop.js tests/loop-test.mjs` prints `workflows/redline-loop.js:1` and `tests/loop-test.mjs:2` (`RESTORE` and the new check), and `grep -c "keep every decided entry, and its task unless an adjustment changes that task" agents/redline-shaper.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit.
- `agents/redline-shaper.md`: the same section, updated in this task's commit.
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R1-2 let a resumed reshape apply an adjustment to a decided task (#117)`

## Task 3: R1-3, check the spec folder before the shaper's result

`shape.md`, Decision 2 and Unattended answer 6.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. The check named "spec: an ask without a judgment call stops at shape before the check" (1812):

   ```js
     check('spec: an ask without a judgment call stops at shape before the check', noCall.res.status === 'error' && noCall.res.stage === 'shape' && noCall.res.error === 'the shaper marked R1-1 as ask but returned no judgment call for it' && JSON.stringify(noCall.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }) && !labels(noCall.calls).includes('spec status r1'), [noCall.res.status, noCall.res.stage, noCall.res.error, noCall.res.resumeFrom, labels(noCall.calls)])
   ```

   becomes:

   ```js
     check('spec: an ask without a judgment call stops at shape after the check, resumable at the shaper', noCall.res.status === 'error' && noCall.res.stage === 'shape' && noCall.res.error === 'the shaper marked R1-1 as ask but returned no judgment call for it' && JSON.stringify(noCall.res.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }) && labels(noCall.calls).slice(-1)[0] === 'spec status r1', [noCall.res.status, noCall.res.stage, noCall.res.error, noCall.res.resumeFrom, labels(noCall.calls)])
   ```

2. After the check named "spec: a judgment call for a finding sorted fix stops at shape" (1814), add:

   ```js
     // The spec check runs before the checks of the result (#120, R1-3): a missing file can be a
     // refused Write, which a person fixes, so an attempt that both left a file out and returned a
     // result a check refuses stops at the spec check, with no ownCheck, resumable at the shaper.
     // Until R1-3 the result check stopped it first, and the result said nothing needed fixing by hand.
     const droppedAndLost = await go('spec: a finding left out and no shape.md', baseArgs, { ...two, shaperDrop: ['R1-2'], specMissing: 'shape' })
     const lostRes = droppedAndLost.res || {}
     check('spec: an attempt that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the shaper', lostRes.status === 'error' && lostRes.stage === 'shape' && lostRes.error === `the shaper wrote no usable spec in ${folder}: no shape.md` && lostRes.ownCheck === false && JSON.stringify(lostRes.resumeFrom) === JSON.stringify({ label: 'shape r1', attempt: 2 }), [lostRes.status, lostRes.error, lostRes.ownCheck, lostRes.resumeFrom])
   ```

3. After the check named "reshape: a reshape that leaves a finding out stops at shape, as the first shape does" (1847), add:

   ```js
     // The same at a reshape (#120, R1-3): the spec check comes first, so the stop is its own, with
     // no ownCheck, resumable at the reshape, and the rerun is given the restore clause.
     const reshapeDroppedLost = await go('reshape: a finding left out and no shape.md', baseArgs, { reviews: [[f('R1-1', 'correctness'), f('R1-2', 'correctness')], []], planBounce: 1, reshapeDrop: ['R1-2'], specMissing: { 'spec status r1 #1': 'shape' }, commitIds: [['R1-1', 'R1-2']] })
     const reshapeLostRes = reshapeDroppedLost.res || {}
     check('reshape: a reshape that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the reshape', reshapeLostRes.status === 'error' && reshapeLostRes.stage === 'shape' && reshapeLostRes.error === `the shaper wrote no usable spec in ${folder}: no shape.md` && reshapeLostRes.ownCheck === false && JSON.stringify(reshapeLostRes.resumeFrom) === JSON.stringify({ label: 'reshape r1 #1', attempt: 2 }), [reshapeLostRes.status, reshapeLostRes.error, reshapeLostRes.ownCheck, reshapeLostRes.resumeFrom])
   ```

   `folder` and `two` are the section's own constants (1789, 1792): the round 1 folder of the scenarios' launch stamp, and a round of one correctness finding and one nit.

4. In the check named "human: a defer stops the run at shape" (1331), the text `labels(run.calls).join('|') === 'shape h1'` becomes `labels(run.calls).join('|') === 'shape h1|spec status h1'`.

5. In the check named "human: a decline stops the pass at shape" (2701), the same text becomes the same, `labels(run.calls).join('|') === 'shape h1|spec status h1'`. Find each of the two by its check's name, since both lines hold the same text.

6. In the `docs/running.md` phrase list (3096), the end of the line as Task 2 leaves it:

   ```js
   'and their tasks unless an adjustment changes one']],
   ```

   becomes:

   ```js
   'and their tasks unless an adjustment changes one', 'The folder is checked before the result the shaper returned']],
   ```

See the two new checks, the docs pin and the three changed checks fail on a gate run: before the change the combined attempts stop with `the shaper gave no disposition for R1-2` and `ownCheck` true, and the three stops run no `spec status` call.

**Change.**

1. In `workflows/redline-loop.js`, `vetShape`, the lines from the `unsorted` check to `forceAskRules`:

   ```js
     const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
     if (unsorted.length) {
       throw checkError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`)
     }
     checkDispositions(pass, shaped)
     checkSecondLook(pass, shaped, inScope)
     checkCalls(shaped, known)
     await checkSpec(pass, record.specFolder, label, suffix)
     forceAskRules(record, pass, inScope, shaped)
   ```

   become:

   ```js
     await checkSpec(pass, record.specFolder, label, suffix)
     const unsorted = inScope.filter((f) => !shaped.findings.some((s) => s.id === f.id)).map((f) => f.id)
     if (unsorted.length) {
       throw checkError('shape', `the shaper gave no disposition for ${unsorted.join(', ')}`, {}, label)
     }
     checkDispositions(pass, shaped, label)
     checkSecondLook(pass, shaped, inScope)
     checkCalls(shaped, known, label)
     forceAskRules(record, pass, inScope, shaped)
   ```

   The folder warning above them (`shaper reported spec folder`) stays first.

2. The comment above `vetShape` (3807-3813):

   ```
   // The checks on the shaper's output, after the shape and after each reshape, in one order (#94,
   // R8-5): the spec folder it reports, a disposition for every finding (the reshape prompt asks for
   // every finding, as the shape prompt does), then the eight checks, forceAskRules among them, each
   // finding's files read one way (#114, R4-4), and the round's dispositions. `known` is the round's
   // calls so far, [] on the shape; `label` names the shaper call for the checks that stop on it, and
   // `suffix` its spec-status call. `decided` is the ids of the round's decided findings, [] on the
   // shape, which the draft check skips (#97, R3-4).
   ```

   becomes:

   ```
   // The checks on the shaper's output, after the shape and after each reshape, in one order (#94,
   // R8-5): the spec folder it reports, the folder itself (the spec check), a disposition for every
   // finding (the reshape prompt asks for every finding, as the shape prompt does), then the eight
   // checks, forceAskRules among them, each finding's files read one way (#114, R4-4), and the
   // round's dispositions. The spec check runs before the checks of the result (#120, R1-3): its
   // stop carries no ownCheck, since a file can be missing because a Write was refused, which a
   // person fixes, so an attempt that both left a file out and returned a result a check refuses
   // stops there and the skill says to fix the cause first. Until R1-3 the result checks ran first,
   // and such an attempt was marked as needing no hand fix. Every check after the spec check names
   // the shaper's label itself, since lastLabel would name the spec-status call (#94, R2-9).
   // `known` is the round's calls so far, [] on the shape; `label` names the shaper call for the
   // checks that stop on it, and `suffix` its spec-status call. `decided` is the ids of the round's
   // decided findings, [] on the shape, which the draft check skips (#97, R3-4).
   ```

3. `checkDispositions` (3235-3256). The end of its comment and its signature:

   ```
   // rather than reaching a plan.
   function checkDispositions(pass, shaped) {
   ```

   become:

   ```
   // rather than reaching a plan. It runs after the `spec status` call, so it names the shaper's
   // label itself (#120, R1-3).
   function checkDispositions(pass, shaped, shaperLabel) {
   ```

   Each of its two throws gains `{}, shaperLabel` as its last two arguments. The first throw becomes:

   ```js
       throw checkError('shape', `the shaper declined ${declined.map((f) => f.id).join(', ')}; in a human review pass a comment is fix, ask or none, never a decline of Redline's own, since what a teammate asked for is the author's to answer`, {}, shaperLabel)
   ```

   and the last line of the second throw becomes:

   ```js
         : `the shaper sorted ${ids} with a human review pass's values (none, or decidedBy reviewer) in a Redline round`, {}, shaperLabel)
   ```

4. `checkCalls` (3310-3330). The end of its comment and its signature:

   ```
   // newly raised (#61, R1-2).
   function checkCalls(shaped, known = []) {
   ```

   become:

   ```
   // newly raised (#61, R1-2). It runs after the `spec status` call, so it names the shaper's label
   // itself (#120, R1-3).
   function checkCalls(shaped, known, shaperLabel) {
   ```

   Its two throws gain `{}, shaperLabel` the same way:

   ```js
       throw checkError('shape', `the shaper marked ${noCall.join(', ')} as ask but returned no judgment call for ${noCall.length === 1 ? 'it' : 'them'}`, {}, shaperLabel)
   ```

   and

   ```js
         throw checkError('shape', `the shaper returned a judgment call for ${call.id}, which it sorted as ${f ? f.disposition : 'nothing'}`, {}, shaperLabel)
   ```

   `vetShape` is the only caller of either function, and it always passes `known` (`[]` on the shape).

5. In `docs/running.md`, section "Run markers and resume" (208), the sentence:

   ```
   A missing `plan.md`, `shape.md` or Decisions section is not such a stop, since a file can be missing because a Write was refused, which is yours to fix.
   ```

   becomes:

   ```
   A missing `plan.md`, `shape.md` or Decisions section is not such a stop, since a file can be missing because a Write was refused, which is yours to fix. The folder is checked before the result the shaper returned, so an attempt that left a file out stops there, as a stop to fix by hand, even when its result also fails one of those checks (#120, R1-3).
   ```

No prompt text changes. A run whose shaper result passes its checks makes the same calls in the same order, since the checks that move are synchronous and call no agent; a run stopped by one of them makes one more call, `spec status`, before the stop. The source counts the loop test pins hold: `throw checkError('shape', ` still opens nine sites, and `throw checkError(` seventeen.

Neighbours, green before and after: "resume: a missing disposition names shape r1" (1669), "reshape: a reshape that leaves a finding out stops at shape, as the first shape does" (1847), "spec: a judgment call for a finding sorted fix stops at shape" (1814), "reshape: a new ask without a call still stops at shape" (1841), "spec: a failed check names the status label, not the shaper" (1810), the four "spec: <kind> missing" pairs (1802-1803), and the two rules over every scenario ("every error result of every scenario says in ownCheck ...", "each stop that is the workflow's own check is reached ..."). The first four pin the shaper's label on a result-check stop, which the move without the label arguments would turn to `spec status ...` (testing/tests, line 15).

**Proof:** `grep -c ", {}, shaperLabel)" workflows/redline-loop.js` prints `7` (it printed `3`), `grep -c "{}, label)" workflows/redline-loop.js` prints `1`, and `grep -n "await checkSpec(pass, record.specFolder, label, suffix)\|const unsorted = inScope" workflows/redline-loop.js` prints the `checkSpec` line first.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit.
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R1-3 check the spec folder before the shaper's result (#117)`

## Task 4: R1-4, three comments say what the resume line reads now

`shape.md`, Decision 3 and Unattended answer 7.

**Files:**

- `workflows/redline-loop.js`
- `tests/loop-test.mjs`

**Change.** Comments only.

1. In `workflows/redline-loop.js`, the comment above `checkSpec` (3397-3400):

   ```
   // four files and the Decisions heading, and the script decides. A missing plan.md, shape.md or
   // Decisions section is a shape-stage error that names the shaper, so a resume reruns it with the
   // replace sentence; the check's own failure keeps its own label, so a resume reruns the check.
   // A missing standards.md or references.md is a warning.
   ```

   becomes:

   ```
   // four files and the Decisions heading, and the script decides. A missing plan.md, shape.md or
   // Decisions section is a shape-stage error that names the shaper, so a resume reruns it with the
   // sentence resumeLine gives that step (#117); it carries no ownCheck, since a file can be missing
   // because a Write was refused, which a person fixes (#116). The check's own failure keeps its own
   // label, so a resume reruns the check. A missing standards.md or references.md is a warning.
   ```

2. In the hold after a reshape, the end of the comment (4289-4290):

   ```
       // mitigation is optional, and no commit is demanded of one (#100). Both messages open with
       // the same words, which the resume line reads (resumeLine).
   ```

   becomes:

   ```
       // mitigation is optional, and no commit is demanded of one (#100). The stop is raised through
       // checkError, so the error result carries ownCheck, and resumeLine reads that field, never the
       // message's words (#116).
   ```

3. The next comment (4295-4296):

   ```
       // Both kinds are named in one stop (#114, R4-6): the resume line tells the rerun to correct
       // the task the error names, so a stop that named only the fixes had a reshape that also gave
   ```

   becomes:

   ```
       // Both kinds are named in one stop (#114, R4-6): the resume line tells the rerun to correct
       // what the error names, so a stop that named only the fixes had a reshape that also gave
   ```

4. In `tests/loop-test.mjs`, the comment above `BOTH` (3722):

   ```
     // the resume line tells the rerun to correct the task the error names, so an error that named
   ```

   becomes:

   ```
     // the resume line tells the rerun to correct what the error names, so an error that named
   ```

No code, prompt or check changes; the loop's count is unchanged.

**Proof:** `grep -c "the task the error names" workflows/redline-loop.js tests/loop-test.mjs` prints `0` for each file, `grep -c "which the resume line reads" workflows/redline-loop.js` prints `0`, and `grep -c "replace sentence; the check" workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change: comments only.

**Commit:** `redline: R1-4 say what the resume line reads in the hold's and the spec check's comments (#117)`

## Task 5: R1-1, the mitigation: a resumed first shape meets no decision only in a round folder its own launch created

`shape.md`, Decision 4 and Unattended answer 4. Decided by the person (`@michaelfromtheoutfit`, 2026-11-22): "Correct the claim and draft an issue", so R1-1 is a `defer` with a mitigation. This task is the mitigation, option 1's wording. The revise-only path itself is the drafted issue under Deferred in `shape.md`; this task changes no prompt and no behaviour.

The claim that no decision of the person or the autopilot can be on disk when a round's first shape is resumed holds for every round folder a launch creates under its own stamp. It does not hold for `/redline:redline-revise <pr> round <N>`, which shapes in the newest folder of that round (`skills/redline-revise/SKILL.md`, step 2; `workflows/redline-loop.js:5280`), one an earlier run may have shaped and resolved. A first shape resumed there is told to rewrite the four files from scratch, as it always has been. The four statements below are scoped to a round folder its own launch created, and each says the revise-only pass is the exception.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `agent-os/standards/workflow/replay.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the `docs/running.md` phrase list (3096), the end of the line as Task 3 leaves it:

```js
'The folder is checked before the result the shaper returned']],
```

becomes:

```js
'The folder is checked before the result the shaper returned', 'in a round folder its own launch created, nothing you or the autopilot decided can be there yet']],
```

See the new check, `defer: docs/running.md says "in a round folder its own launch created, nothing you or the autopilot decided can be there yet"`, fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, the opening of the comment in `resumeLine` (682-685):

   ```
     // The shaper's sentence goes by the step and by what its stop was (#117). A round's first shape
     // runs before any decision, so its resume rewrites the four files from scratch, as it always
     // has: the #117 spec measured that no decision of the person or the autopilot can be on disk
     // when one is resumed. A reshape runs after the round's resolve, so its folder can hold the
   ```

   becomes:

   ```
     // The shaper's sentence goes by the step and by what its stop was (#117). A round's first shape
     // runs before the round's resolve, so its resume rewrites the four files from scratch, as it
     // always has: the #117 spec measured that no decision of the person or the autopilot can be on
     // disk when one is resumed in a round folder its own launch created. A revise-only pass over an
     // earlier run's round (/redline:redline-revise <pr> round <N>) shapes in that run's folder,
     // which can hold its decided entries, so a resume of its first shape rewrites them, as it
     // always has, and that run's record commit keeps them in git history (#120, R1-1). A reshape
     // runs after the round's resolve, so its folder can hold the
   ```

   The next line, which opens "entries and tasks the resolve agent wrote for the round's decisions", continues it unchanged, and Task 2's sentence further down the same comment is not touched. No code changes.

2. In `docs/running.md`, section "Run markers and resume" (208), the sentence:

   ```
   At a round's first shape (`shape r<n>`, `shape h<n>`) it rewrites the four spec files: nothing you or the autopilot decided can be in the folder yet.
   ```

   becomes:

   ```
   At a round's first shape (`shape r<n>`, `shape h<n>`) it rewrites the four spec files: in a round folder its own launch created, nothing you or the autopilot decided can be there yet. A revise-only pass over a round an earlier run shaped and resolved (`/redline:redline-revise <pr> round <N>`) shapes in that run's folder, so a resume of its first shape rewrites that run's decided entries, as it always has; the earlier run's record commit keeps them in git history (#120, R1-1).
   ```

   No other sentence of the paragraph changes; the next one, "After a stop that is the workflow's own check of the shaper's result, it is told first that nothing was fixed by hand.", stays as it is.

3. In `agent-os/standards/workflow/replay.md`, line 19, the clause:

   ```
   The from-scratch sentence stays for a round's first shape, which no decision of the person or the autopilot can precede, as the #117 spec measured over every scenario of the loop test;
   ```

   becomes:

   ```
   The from-scratch sentence stays for a round's first shape, which no decision of the person or the autopilot can precede in a round folder its own launch created, as the #117 spec measured over every scenario of the loop test; a revise-only pass over a round an earlier run shaped and resolved (`/redline:redline-revise <pr> round <N>`) shapes in that run's folder, so a resume of its first shape rewrites that run's decided entries, as it always has, and that run's record commit keeps them in git history (#120, R1-1);
   ```

   The rest of the line, from "and a first shape resumed after the workflow's own check is told so too" on, stays as it is. The clause states what the code does, so it changes in this task's commit, not in the standards commit (process/standards-retrospective, line 11); read the whole line back once it is changed (line 10).

4. In `tests/loop-test.mjs`, the end of the comment above `resumeLineFor` (3691-3692):

   ```
     // rewrite. The from-scratch sentence stays for a round's first shape, which no decision
     // can precede.
   ```

   becomes:

   ```
     // rewrite. The from-scratch sentence stays for a round's first shape, which no decision can
     // precede in a round folder its own launch created; a revise-only pass over an earlier run's
     // round shapes in that run's folder, where a resume still rewrites the decided entries, as it
     // always has (#120, R1-1).
   ```

5. In the same file, the comment above `firstLost` (3710-3712):

   ```
     // The neighbour: the first shape of the same round, stopped by the same check, still rewrites.
     // No decision can be on disk when a first shape is resumed (the #117 spec's measurement), and
     // its line is the one it had, byte for byte.
   ```

   becomes:

   ```
     // The neighbour: the first shape of the same round, stopped by the same check, still rewrites.
     // No decision can be on disk when a first shape is resumed in a round folder its own launch
     // created (the #117 spec's measurement; a revise-only pass over an earlier run's round is the
     // exception, #120, R1-1), and its line is the one it had, byte for byte.
   ```

No prompt, code or other check changes: every resumed first shape still gets the sentence it had, byte for byte. Neighbours, green before and after: "reshape: the first shape of the same round, resumed after its spec check, still rewrites the four files from scratch, its line byte for byte as it was" (3716); "resume: the shaper's file, the replay standard and docs/running.md say a first shape resumed after the workflow's check is told nothing was fixed by hand" (1684), whose phrases "a first shape resumed after the workflow's own check is told so too" (the replay standard) and "it is told first that nothing was fixed by hand" (the docs) are kept; and the phrase list's "At a reshape after a bounced plan (`reshape r<n> #<k>`, `reshape h<n> #<k>`) it never rewrites them".

**Proof:** `grep -c "own launch created" workflows/redline-loop.js docs/running.md agent-os/standards/workflow/replay.md tests/loop-test.mjs` prints `1` for each of the first three files and `2` for `tests/loop-test.mjs` (the pin and the comment above `resumeLineFor`); each printed `0` before. `grep -c "nothing you or the autopilot decided can be in the folder yet" docs/running.md` prints `0`, and `grep -c "which no decision of the person or the autopilot can precede, as" agent-os/standards/workflow/replay.md` prints `0`.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit (the same claim, corrected; the script's change is a comment).
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).
- `agent-os/standards/workflow/replay.md` is a standard, not a plugin file; it changes here because it states what the code does.

**Commit:** `redline: R1-1 say a resumed first shape meets no decision only in its own launch's folder (#117)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1665 checks passed, 0 failed` (Task 5 adds one pin), and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 2, 3, 4 and 5) and `agents/redline-shaper.md` (Task 2), with the section and the reason given in each task: Tasks 2, 3 and 5 update `docs/running.md`, "Run markers and resume", and Task 4 has no reader-facing change. `docs/running.md` is reader-facing by nature. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.5`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/replay.md` (items 1 and 2; item 1 appends to the end of line 19 as Task 5 leaves it) and `agent-os/standards/testing/tests.md` (item 3, drafted once R1-1 was decided), each clause read back in its whole line. Title it `redline: record the round 1 review lessons in the standards (#117)`. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 1 for PR #120 (#117)`.

**Files** (this task): `agent-os/standards/workflow/replay.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-22-1457-120-review-round-1/plan.md` and `shape.md` (As built and any deviation).
