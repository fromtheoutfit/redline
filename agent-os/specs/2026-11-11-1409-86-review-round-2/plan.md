# PR #86 review round 2: a partly tracked remainder meets every other rule, and the result check is named for what it asserts

Spec folder: `agent-os/specs/2026-11-11-1409-86-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #86 (issue #85), from the round's two findings (`redline/round-2-review.json`, `redline/round-2-findings.json`). Both are nits, and both are `fix`. There is no `defer` and no `ask`. This is the run's final nit round: the plan covers the nits only.

- R2-1 (nit): the partly tracked rule says a remainder caused in the diff is a finding with no condition, beside rules that send such a candidate elsewhere. Task 2.
- R2-2 (nit): a loop check's name claims two things it does not assert. Task 3.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, and files staged by name. Line numbers are at `fd65cb4`, the PR head this round reviewed. Task 2 runs before Task 3, and each task names its anchors by their text as well as their number, since an earlier edit moves later lines. Task 2 adds one line to `tests/loop-test.mjs` after line 1466, so the check Task 3 replaces moves from line 1522 to 1523. It also adds two lines to `workflows/redline-loop.js` after line 1190, so the line Task 3 mutates moves from 1961 to 1963.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter. The loop test's count before this round is 602 checks passed, 0 failed (round 1's As built). Task 2 adds one check, and Task 3 replaces one, so the green count is 603. Every other harness keeps its count. Round 1's As built recorded guard 592, prefs 101, gate 117, setup 468, gh 114 and background 39. The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description.** Under "For the reviewer", "Prompts:", it says "The run's result still carries the coverage counts only; the dropped entries ride on the round record for the handoff." That carries R2-2's inaccuracy: the result also keeps the accounting. This repository has no standard for agent-written PR descriptions, so the round writes no `pr-body.md` (`shape.md`, Unattended answer 7). The reviewer's corrected wording, for the author to paste by hand, is "the result carries the counts and the accounting; the dropped entries with their summaries ride on the round record".
- **Run caution (#81).** Task 2 commits changes to `agents/redline-reviewer.md` and `workflows/redline-loop.js`. Round 1's commits already did. This run is unaffected, and #81 is about a relaunch after such commits. See `shape.md`, Context.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-11-1409-86-review-round-2/plan.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-2/shape.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-2/standards.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #86 (#85)`

## Task 2: R2-1, a partly tracked remainder meets every other rule

`shape.md`, Decision 1 and Unattended answers 4 and 5. Every statement of the partly tracked rule says a remainder caused in the diff "is a finding" with no condition. Meanwhile the removed-guard rule, the disproportionate rule, the not-reproduced rule, a refutation and a collapse each send a candidate elsewhere. The #85 spec's shaping default accounts a remainder by "what its remainder became (`finding`, `forThePerson`, `outside`, `refuted`, `disproportionate`, `duplicate`)", so the other rules win. Each statement gains that condition. "Never a For the person line saying what the issue lacks", #85's guard against fault 1, stays.

**Files:**

- `tests/loop-test.mjs`: the key-phrase list at line 1470, and one comment line after line 1466.
- `agents/redline-reviewer.md`: lines 24, 37 and 65.
- `workflows/redline-loop.js`: line 1205, and two comment lines after line 1190.
- `docs/running.md`: line 36 ("Rounds", step 1) and line 48 ("The coverage pass").

**Red first, `tests/loop-test.mjs`.**

- In the key-phrase list (line 1470, the `for` line that starts `for (const [rule, phrase] of [['partly tracked', ...`), after its last entry, `['a finding entry\'s ref is the finding\'s id alone', 'ref is the finding\'s id alone']`, add a fifth entry:

  ```js
  , ['a partly tracked remainder meets every other rule', 'unless another rule here puts it elsewhere']
  ```

  The comma goes between the two entries, inside the outer array's closing `]`. The loop then also asserts that phrase in the agent file and a covered `review r1` prompt, and its absence from a `coverage off` one.
- Directly after the comment line `  // that did not exist; these checks are what was built in its place.` (line 1466), add:

  ```js
    // The fifth entry pins that a partly tracked remainder meets every other rule (#86, R2-1).
  ```

- Run the gate (command in Task 4). Its `loop` check exits 1 and its output reads `602 checks passed, 1 failed`. The `FAIL` line names `coverage: the agent file and the verify prompt state the rule "a partly tracked remainder meets every other rule", and a coverage-off prompt does not`, with the detail `["unless another rule here puts it elsewhere",false,false,false]`. Record the line under As built.

**Change 1, `agents/redline-reviewer.md` line 24.** Replace the whole line

```text
**A tracked part is not the whole finding.** When an open issue or a teammate's comment covers only part of a candidate finding, the tracked part is known and the remainder is judged as its own candidate, by every rule here. A remainder whose cause is in this pull request's diff is a finding: name the issue or the comment in its description (for example `#41 tracks the case-folding; the check this pull request removed is not in it`), leave `knownAs` empty, and on a round with candidates account for it as `finding`. `knownAs` is for a finding an issue or a comment tracks whole; a neighbouring issue is never a reason to keep a regression out of the plan.
```

with

```text
**A tracked part is not the whole finding.** When an open issue or a teammate's comment covers only part of a candidate finding, the tracked part is known and the remainder is judged as its own candidate, by every rule here. A remainder whose cause is in this pull request's diff is a finding unless another rule here puts it elsewhere, as it would put any candidate (a collapse, a refutation, the disproportionate rule, or For the person for a removed guard or a candidate plausible but not reproduced). As a finding, name the issue or the comment in its description (for example `#41 tracks the case-folding; the check this pull request removed is not in it`), leave `knownAs` empty, and on a round with candidates account for it as `finding`. `knownAs` is for a finding an issue or a comment tracks whole; a neighbouring issue is never a reason to keep a regression out of the plan, nor to put in it a remainder the other rules keep out.
```

**Change 2, `agents/redline-reviewer.md` line 37** (the bullet that opens `- **Run the known-finding check** as above.`). Replace

```text
a cause in the diff makes it a finding that names #N, never a For the person line saying what #N lacks.
```

with

```text
a cause in the diff makes it a finding that names #N unless another rule here puts it elsewhere, and never a For the person line saying what #N lacks.
```

The rest of line 37 is unchanged.

**Change 3, `agents/redline-reviewer.md` line 65** (the bullet that opens `- **For the person.**`). Replace

```text
A part #N does not track whose cause is in the diff is a finding, not an entry here.
```

with

```text
A part #N does not track whose cause is in the diff is a finding unless another rule here puts it elsewhere, never an entry here saying what #N lacks; a removed guard or a candidate plausible but not reproduced comes here on its own merits, as any candidate does.
```

The rest of line 65 is unchanged.

**Change 4, `workflows/redline-loop.js` line 1205**, inside the single-quoted string that opens `'For each candidate: collapse by cause,`. Replace

```text
the tracked part is known and the remainder is judged as its own candidate: a remainder whose cause is in this pull request\'s diff is a finding, with the issue named in its description and knownAs empty, accounted for as finding, never a forThePerson line saying what the issue lacks;
```

with (the one apostrophe escaped as the string already does)

```text
the tracked part is known and the remainder is judged as its own candidate, by every rule here: a remainder whose cause is in this pull request\'s diff is a finding unless another rule here puts it elsewhere, as it would put any candidate (a collapse, a refutation, the disproportionate rule, or forThePerson for a removed guard or a candidate plausible but not reproduced), and as a finding it has the issue named in its description and knownAs empty and is accounted for as finding, never a forThePerson line saying what the issue lacks;
```

The sentence stays in `candidatesBlock`'s branch with candidates, so every `coverage off` prompt stays byte-identical (`workflow/replay.md`). The rest of line 1205 is unchanged.

**Change 5, the comment above `candidatesBlock`.** Directly after the line `// which accountCoverage matches by id alone (#86, R1-4).` (line 1190), and before `// Only the branch with candidates says so, so a coverage-off prompt is unchanged.`, add:

```js
// A partly tracked remainder meets every other rule, as any candidate does: one caused in the diff
// is a finding unless another rule puts it elsewhere (#86, R2-1).
```

**Change 6, `docs/running.md` line 36** ("Rounds", step 1). Replace

```text
and a part whose cause is in this PR's diff is a finding that names the issue (#85).
```

with

```text
and a part whose cause is in this PR's diff is a finding that names the issue unless another of the verifier's rules puts it elsewhere, as it would any candidate (#85; #86, R2-1).
```

**Change 7, `docs/running.md` line 48** ("The coverage pass"). Replace

```text
a remainder whose cause is in this PR's diff is a finding that names the issue in its description, with no `knownAs`, never a note saying what the issue lacks, and two candidates are not one because one issue's title fits both (#85).
```

with

```text
a remainder whose cause is in this PR's diff is a finding that names the issue in its description, with no `knownAs`, unless another of these rules puts it elsewhere as it would any candidate (a collapse, a refutation, the disproportionate guard, or For the person for a removed guard or a candidate plausible but not reproduced), never a note saying what the issue lacks, and two candidates are not one because one issue's title fits both (#85; #86, R2-1).
```

### Proof

- Green: the gate's loop step passes with the fifth key-phrase check among the passed ones: `603 checks passed, 0 failed`.
- The new clause, in every place:
  - `grep -c "unless another rule here puts it elsewhere" agents/redline-reviewer.md` prints `3`. It was `0`; the three places are lines 24, 37 and 65.
  - `grep -c "unless another rule here puts it elsewhere" workflows/redline-loop.js` prints `1` (was `0`).
  - `grep -c "unless another rule here puts it elsewhere" tests/loop-test.mjs` prints `1` (was `0`).
  - `grep -c "unless another of" docs/running.md` prints `2` (was `0`).
  - `grep -c "by every rule here" workflows/redline-loop.js` prints `1` (was `0`).
- The unconditional sentences are gone. Each command was `1` before and prints `0` after:
  - `grep -c "diff is a finding: name the issue" agents/redline-reviewer.md`
  - `grep -c "makes it a finding that names #N, never" agents/redline-reviewer.md`
  - `grep -c "is a finding, not an entry here" agents/redline-reviewer.md`
  - `grep -c "diff is a finding, with the issue named" workflows/redline-loop.js`
  - `grep -c "is a finding that names the issue (#85)" docs/running.md`
  - `grep -c "with no .knownAs., never a note" docs/running.md`
- Neighbours, unchanged unless noted:
  - `grep -c "the remainder is judged as its own candidate" agents/redline-reviewer.md` prints `2`, and the same in `workflows/redline-loop.js` prints `1`. This is the partly tracked key phrase.
  - `grep -c "this pull request stopped handling" agents/redline-reviewer.md` prints `1`, and the same in `workflows/redline-loop.js` prints `1`. This is the removed-guard key phrase.
  - `grep -c "saying what the issue lacks" workflows/redline-loop.js` prints `1`.
  - `grep -c "saying what #N lacks" agents/redline-reviewer.md` prints `2`. It was `1`; line 65 now says it too.
  - `grep -c "by every rule here" agents/redline-reviewer.md` prints `1`.
  - The four other key-phrase checks stay green. So do the partly tracked scenario (`coverage: a partly tracked candidate is a finding naming the issue, confirmed, shaped, and the run goes on`) and every `coverage off` and replay check, since only the covered branch's text moves.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.

**Docs entry:** `agents/redline-reviewer.md` and `workflows/redline-loop.js` (the verify prompt) are described by `docs/running.md` "Rounds", step 1 and "The coverage pass". Changes 6 and 7 update both in this task's commit. The README's "What a clean run means" has no reader-facing change: it says "the part an issue does not track is judged on its own", which the clause keeps. `tests/loop-test.mjs` is not in a Docs-step directory.

**Commit:** `redline: R2-1 say a partly tracked remainder meets every other rule, so one caused in the diff is a finding unless another rule puts it elsewhere (#85)`

## Task 3: R2-2, name the result check for what it asserts, and pin what the result keeps

`shape.md`, Decision 2 and Unattended answer 6. The check `coverage: the round record keeps the dropped entries for the handoff, and the result keeps counts only` asserts that `droppedCandidates` is not a key of `run.res.rounds[0]`, plus three counts. It asserts neither half of its name. The result keeps the accounting by design: `tests/loop-test.mjs:1305` is named for it, and "counts only" in the #85 spec means #80 R1-5's candidate count instead of the candidate list. The replacement says what it asserts and asserts what the result keeps.

**Files:**

- `tests/loop-test.mjs`: the check at line 1522 at `fd65cb4`, line 1523 after Task 2, and a comment above it.
- `workflows/redline-loop.js`: line 1961 at `fd65cb4`, line 1963 after Task 2. It changes **temporarily**, for the red run below, and is restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.** Replace the whole line

```js
  check('coverage: the round record keeps the dropped entries for the handoff, and the result keeps counts only', !('droppedCandidates' in run.res.rounds[0]) && run.res.rounds[0].coverage.counts.refuted === 1 && run.res.rounds[0].coverage.counts.outside === 1 && run.res.rounds[0].coverage.counts.disproportionate === 1, Object.keys(run.res.rounds[0]))
```

with

```js
  // What the result keeps of a covered round (#80, R1-5; #86, R2-2): the candidate count, the
  // counts by outcome and the accounting, each dropped candidate's index, outcome and ref among
  // it, and no droppedCandidates field and no candidate list. The dropped entries, with their
  // file, line and summary, ride on the round record, which only the handoff reads (the handoff
  // check above).
  check('coverage: the result keeps the candidate count, the dropped counts and each dropped candidate\'s index, outcome and ref in the accounting, and no droppedCandidates field or candidate list', !('droppedCandidates' in run.res.rounds[0]) && Object.keys(run.res.rounds[0].coverage).join(',') === 'head,candidates,counts,accounting' && run.res.rounds[0].coverage.candidates === 5 && run.res.rounds[0].coverage.counts.refuted === 1 && run.res.rounds[0].coverage.counts.outside === 1 && run.res.rounds[0].coverage.counts.disproportionate === 1 && run.res.rounds[0].coverage.accounting.every((e) => Object.keys(e).join(',') === 'index,outcome,ref') && dropOut.filter((d) => ['refuted', 'outside', 'disproportionate'].includes(d.outcome)).every((d) => run.res.rounds[0].coverage.accounting.some((e) => e.index === d.index && e.outcome === d.outcome && e.ref === d.ref)), [Object.keys(run.res.rounds[0]), run.res.rounds[0].coverage])
```

`dropOut` is the scenario's accounting, defined in the same block (line 1498). `five` has five candidates, so `coverage.candidates` is `5`. `accountCoverage` trims each ref (`workflows/redline-loop.js:1312`) and builds every entry as `{ index, outcome, ref }` (lines 1316 to 1335). The record's `coverage` is `{ head, candidates, counts, accounting }` (line 2097), and `result()` passes it through as it is (line 1961).

### Proof

Red first, by the finding's own scenario, "a change that put the dropped refs into the result some other way", after the check is replaced:

1. Edit the `result()` line in `workflows/redline-loop.js` (line 1963 after Task 2) from
   `      coverage: record.coverage || null,`
   to
   `      coverage: record.coverage ? { ...record.coverage, list: record.droppedCandidates } : null,`.
   The old check would stay green here: `droppedCandidates` is still not a key of the result's round, and the counts are unchanged.
2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-2/redline/snapshot.json`. Its `loop` check exits 1, and a `FAIL` line names `coverage: the result keeps the candidate count, the dropped counts and each dropped candidate's index, outcome and ref in the accounting, and no droppedCandidates field or candidate list`. The expected output is `602 checks passed, 1 failed`, since no other check reads the result's `coverage` keys (`shape.md`, Unattended answer 8). Record the line, and any other `FAIL` line, under As built. The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.
3. Restore that line with Edit, byte for byte, to `      coverage: record.coverage || null,`. `git diff --stat -- workflows/redline-loop.js` then prints nothing, since Task 2's changes to that file are already committed.

Green: the gate's loop step passes with the new check among the passed ones, `603 checks passed, 0 failed`.

And:

- `grep -c "and the result keeps counts only" tests/loop-test.mjs` prints `0` (was `1`).
- `grep -c "and no droppedCandidates field or candidate list" tests/loop-test.mjs` prints `1` (was `0`).
- `grep -c "list: record.droppedCandidates" workflows/redline-loop.js` prints `0`, so the mutation is gone.
- Neighbours, unchanged and green: `coverage: the result carries each round's For the person and accounting` (line 1305), and the handoff check just before the replaced line, `coverage: the handoff carries the last covered round's dropped block, naming the round, ...` (line 1521 at `fd65cb4`).
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a Docs-step directory. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry. The PR description's matching sentence is the author's (see "For the person" above).

**Commit:** `redline: R2-2 name the result check for what it asserts and pin the accounting the result keeps (#85)`

## Task 4: Verification Gate

**Files:**

- `agent-os/specs/2026-11-11-1409-86-review-round-2/plan.md` and `agent-os/specs/2026-11-11-1409-86-review-round-2/shape.md` (step 13).
- `agent-os/standards/workflow/agents.md` and `agent-os/standards/testing/tests.md` (step 12), only the items the standards approver approves.

1. Steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expected: `loop` at `603 checks passed, 0 failed` (602 plus Task 2's check; Task 3 replaces one). Every other harness is expected at its count before the round, since no other harness, and no file one reads, changes.
2. Step 10, Docs: each task's Docs entry names its section or its reason, and is confirmed against that task's commit. `docs/running.md` "Rounds" step 1 and "The coverage pass" carry the clause in Task 2's commit. There is no new config key, subcommand, allow rule or exit code.
3. Step 11, Version: `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the patch version from `0.2.1` on `main`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 3). The setup test's last cases prove the two agree.
4. Step 12, Standards retrospective: the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved, in one commit of their own after Task 3's: `redline: record the round 2 review lessons in the standards (#85)`.
   - Keep every heading: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`.
   - `git diff --name-only HEAD~1 HEAD` lists only the standards files the approved items touch.
   - If nothing is approved, make no commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
5. Step 13, Spec folder: add an "As built" section to this file. It records:
   - each task's commit;
   - the red lines of Tasks 2 and 3;
   - the proof outputs;
   - the gate's counts;
   - which retrospective items the approver approved, declined or deferred.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #86 round 2 as built (#85)`

## As built

Built in order, one commit per task. Every gate run below is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-2/redline/snapshot.json`; the runs before a task's commit list that task's edits under `uncommitted`, and only their harness output is the evidence.

### Commits

- Task 1: `46c5dce` `redline: save review round 2 spec for PR #86 (#85)` (`plan.md`, `shape.md`, `standards.md`, `references.md`; nothing under `redline/`).
- Task 2, R2-1: `890ac40` `redline: R2-1 say a partly tracked remainder meets every other rule, so one caused in the diff is a finding unless another rule puts it elsewhere (#85)`. `git diff --name-only HEAD~1 HEAD`: `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs`, `workflows/redline-loop.js`.
- Task 3, R2-2: `2e8d556` `redline: R2-2 name the result check for what it asserts and pin the accounting the result keeps (#85)`. `git diff --name-only HEAD~1 HEAD`: `tests/loop-test.mjs`.
- Task 4, step 12: `8807864` `redline: record the round 2 review lessons in the standards, finishing R2-1 (#85)`. `git diff --name-only HEAD~1 HEAD`: `agent-os/standards/testing/tests.md`, `agent-os/standards/workflow/agents.md`.
- Task 4, step 13: this section, in `redline: record PR #86 round 2 as built (#85)`.

### Proof outputs

- Task 2, red. With the fifth key-phrase entry and its comment line added and the wording not yet changed, the gate's `loop` exited 1 with `602 checks passed, 1 failed` and the line `FAIL coverage: the agent file and the verify prompt state the rule "a partly tracked remainder meets every other rule", and a coverage-off prompt does not: ["unless another rule here puts it elsewhere",false,false,false]`, as planned.
- Task 2, green after Changes 1 to 7: `loop` at `603 checks passed, 0 failed`. `grep -c "unless another rule here puts it elsewhere"`: agent file `3`, workflow `1`, loop test `1`. `grep -c "unless another of" docs/running.md` `2`. `grep -c "by every rule here"`: workflow `1`, agent file `1`. Each of the six "gone" greps printed `0`. Neighbours: `the remainder is judged as its own candidate` agent file `2`, workflow `1`; `this pull request stopped handling` agent file `1`, workflow `1`; `saying what the issue lacks` workflow `1`; `saying what #N lacks` agent file `2`.
- Task 3, red. With the check replaced and `result()`'s line mutated to `coverage: record.coverage ? { ...record.coverage, list: record.droppedCandidates } : null,` (line 1963), the gate's `loop` exited 1 with `601 checks passed, 2 failed`. The lines:
  - `FAIL coverage: the result keeps the candidate count, the dropped counts and each dropped candidate's index, outcome and ref in the accounting, and no droppedCandidates field or candidate list`, its detail showing the result's `coverage` with a fifth key, `list`, holding the three dropped entries.
  - `FAIL coverage: the result's coverage record has no candidate list`, an existing check (`tests/loop-test.mjs:1315`) that reads `'list' in run.res.rounds[0].coverage` and so also caught this mutation, which names its key `list`. The plan expected `602 checks passed, 1 failed` (see Deviations).

  The old check would have stayed green under this mutation: the failing detail shows `droppedCandidates` absent from the result's round and `refuted`, `outside` and `disproportionate` each `1`. The line was restored with Edit; `git diff --stat -- workflows/redline-loop.js` then printed nothing. Green: `loop` at `603 checks passed, 0 failed`.
- Task 3 greps: `and the result keeps counts only` `0`, `and no droppedCandidates field or candidate list` `1`, `list: record.droppedCandidates` in the workflow `0`. The neighbours `coverage: the result carries each round's For the person and accounting` and the handoff check before the replaced line stayed green.
- Step 12. `git diff -- agent-os/standards/ | grep -c "^[-+]#"` printed `0` before the commit.

### Gate counts

Every run of the round: `syntax` 0, `validate` passed with warnings (as before), `guard` `592 passed, 0 mismatched`, `prefs` `101 passed, 0 failed`, `gate` `117 passed, 0 failed`, `setup` `468 passed, 0 failed`, `gh` `114 passed, 0 failed`, `background` `39 passed, 0 failed`. Only `loop` moved: 603 after Task 2, and 603 after Task 3, which replaces one check, as planned.

### Docs and Version

- Step 10: each task's Docs entry was confirmed against its commit. `docs/running.md` "Rounds" step 1 (line 36) and "The coverage pass" (line 48) carry the clause in `890ac40`. The README's "What a clean run means" is unchanged, as planned. Task 3 ends with `workflows/redline-loop.js` unchanged. No new config key, subcommand, allow rule or exit code.
- Step 11: `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged.

### Standards retrospective

The standards approver approved items 1 and 2 of `shape.md`'s proposed list, applied as worded in `8807864`: the replacement in `workflow/agents.md` line 37 (R2-1) and the sentence appended to `testing/tests.md` line 23 (R2-2). Items 3 to 7 were already covered or not a standard, with no change. Item 1 carries the last statement of R2-1's rule (`shape.md`, Unattended answer 5, sends it to the retrospective), so the commit names R2-1. Item 2 is a lesson only and names no finding.

### Deviations

- Task 3's red run: `601 checks passed, 2 failed`, not the planned `602 checks passed, 1 failed`. The existing check `coverage: the result's coverage record has no candidate list` (line 1315) also reads the result's `coverage` and caught the mutation's `list` key. The new check is red as planned, the old one it replaces would have stayed green, and the green count is as planned. Recorded in `shape.md`, Decision 5.
- Step 12's commit message is `redline: record the round 2 review lessons in the standards, finishing R2-1 (#85)`, not the plan's text without `finishing R2-1`, since item 1 carries the part of R2-1's fix the plan sends through the retrospective, so R2-1's reply names both commits. Recorded in `shape.md`, Decision 6.

### Notes

- Line numbers moved as the plan foresaw: after Task 2, the replaced check was at `tests/loop-test.mjs:1523` and `result()`'s coverage line at `workflows/redline-loop.js:1963`. Each edit was placed by its text.
- Run caution (#81), for the person: `git diff --stat beb1913..HEAD -- workflows agents` lists `agents/redline-reviewer.md` and `workflows/redline-loop.js`, so a relaunch of this run after these commits meets #81 (`shape.md`, Context).
- The PR description's sentence under "For the reviewer", "Prompts:" is still the author's to correct by hand (For the person, above).
