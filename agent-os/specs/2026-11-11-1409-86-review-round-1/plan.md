# PR #86 review round 1: the known-finding check opens on "in full", the handoff rule is pinned both ways, the dropped line reuses personLine, and a finding ref is the finding's id alone

Spec folder: `agent-os/specs/2026-11-11-1409-86-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #86 (issue #85), from the round's four findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Every finding is `fix`; there is no `defer` and no `ask`.

- R1-1 (nit): the opening sentence of "Check for known findings first" in `agents/redline-reviewer.md` was not narrowed to "in full". Task 2.
- R1-2 (nit): the handoff's "last covered round, not the last round with drops" rule is pinned only one way. Task 3.
- R1-3 (nit): `droppedBlock` builds its line by hand with the template `personLine` already builds. Task 4.
- R1-4 (correctness, low): the accounting sentence's "with the issue named" does not say where the name goes, and a `finding` ref that carries it is matched by id and rejected. Task 5.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, files staged by name. Line numbers are at `beb1913`, the PR head this round reviewed. Tasks 2 to 5 run in this order, and each names its anchors by their text as well as their number, since an earlier task's edit can move a later line: Task 2's new check (four lines after `tests/loop-test.mjs:1471`) moves the test lines after it by four, and Task 4's comment edit may move the lines of `workflows/redline-loop.js` after 881 by one.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter. The loop test's count before this round is 599 checks passed, 0 failed (the PR description, and the #85 spec's As built). This round adds three checks: one in Task 2, one in Task 3 and one in Task 5, so the green count is 602. Every other harness keeps its count; the first gate run's counts are the evidence, and any difference is recorded under As built.

**Run caution, for the person (not a task).** Tasks 2, 4 and 5 commit changes to `agents/redline-reviewer.md` and `workflows/redline-loop.js`. The PR description says: "Caution for a Redline self-review: this PR changes `workflows/` and `agents/`, so a round on it that edits either one meets #81." This round runs to its end unaffected; #81 is about a relaunch after such commits. See `shape.md`, Context.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-11-1409-86-review-round-1/plan.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-1/standards.md`
- `agent-os/specs/2026-11-11-1409-86-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #86 (#85)`

## Task 2: R1-1, the known-finding check opens on what is already tracked in full

`shape.md`, Decision 1. Line 16 of `agents/redline-reviewer.md` is the first sentence of "Check for known findings first" and still tells the verifier to report what is "already tracked" with no "in full". The paragraph #85 added at line 24 qualifies it eight lines later. The review prompt's own known-finding sentence, `A known finding goes in knownAs.` (`workflows/redline-loop.js:1166`), stays as it is, so every `coverage off` prompt stays byte-identical (`shape.md`, Unattended answer 5).

**Files:**

- `agents/redline-reviewer.md` (line 16)
- `tests/loop-test.mjs` (a new check directly after line 1471)

**Change 1, `agents/redline-reviewer.md` line 16.** Replace the whole line

```text
Before you report anything, look for what is already tracked, and report such a finding as "already tracked in #N" (or "R1-2: fixed") rather than re-raising it:
```

with

```text
Before you report anything, look for what is already tracked in full, and report such a finding as "already tracked in #N" (or "R1-2: fixed") rather than re-raising it (the part an issue or a comment does not track is judged on its own; see "A tracked part is not the whole finding" below):
```

The line still ends with the colon, and the numbered list after it (lines 18 to 20) is unchanged.

**Change 2, `tests/loop-test.mjs`.** Directly after the closing `}` of the key-phrase loop (line 1471, the loop that starts `for (const [rule, phrase] of [['partly tracked', ...`), add:

```js
  // The known-finding section opens on what is tracked in full (#86, R1-1). The review prompt's own
  // known-finding sentence stays as it was, so a coverage-off prompt is unchanged, and this sentence
  // is pinned in the agent file alone.
  check('coverage: the agent file opens its known-finding check on what is already tracked in full', reviewerAgent.includes('look for what is already tracked in full'), 'agents/redline-reviewer.md, "Check for known findings first"')
```

`reviewerAgent` is the agent file as the test reads it (`tests/loop-test.mjs:22`).

### Proof

- Before Change 1: `grep -c "look for what is already tracked in full" agents/redline-reviewer.md` prints `0`, so the new check is red on the old text.
- After Change 1: the same command prints `1`.
- Neighbours, unchanged:
  - `grep -c "^1. Open issues" agents/redline-reviewer.md` prints `1` (the list after the colon).
  - `grep -c "A known finding goes in knownAs." workflows/redline-loop.js` prints `1` (the review prompt's sentence).
  - `grep -c "the remainder is judged as its own candidate" agents/redline-reviewer.md` prints the same count before and after (the partly tracked key phrase).
- The gate (Task 6): the loop step passes with this check among the passed ones.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `agents/redline-reviewer.md` and `tests/loop-test.mjs`.

**Docs entry:** `agents/redline-reviewer.md` is covered by `docs/running.md` "Rounds", step 1. No reader-facing change: that step already says "A finding an open issue or a teammate's comment already tracks in full is reported as `already tracked`", and the agent file's opening sentence now says the same. `tests/loop-test.mjs` is not in a Docs-step directory.

**Commit:** `redline: R1-1 open the reviewer's known-finding check on what is already tracked in full (#85)`

## Task 3: R1-2, pin that the handoff carries the last covered round's block, not the last round with drops

`shape.md`, Decision 2. Decision 14 of the #85 spec says the handoff carries the block of the last round that ran the coverage pass, and earlier rounds' drops are not repeated. Only the scenario `coverage: a dropped candidate with no reason` tells "the last covered round" apart from "the last round with drops": its round 1 drops candidate 2 and its round 2 drops nothing. Its one check reads the round 1 body and the warning, never the handoff.

**Files:**

- `tests/loop-test.mjs` (a new check directly after the check `coverage: a dropped candidate with no reason reads "no reason given", with a warning naming its index`, line 1528 at `beb1913`, line 1532 after Task 2)
- `workflows/redline-loop.js` (line 2875), **temporarily** for the red run below, restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.** Directly after that check, inside the same block and before the `// coverage off: no candidates, so no dropped block anywhere.` comment, add:

```js
  // The handoff carries the last covered round's block, not the last round with drops (#85,
  // decision 14; #86, R1-2): round 1 dropped candidate 2, round 2 ran the pass and dropped nothing,
  // so the handoff has no block.
  check('coverage: the handoff carries the last covered round\'s block, not the last round with drops, so a last covered round that dropped nothing leaves no block though an earlier round dropped one', body(run.calls, 'post r1').includes('<details>') && labels(run.calls).includes('coverage r2') && !comment(run.calls, 'handoff comment').includes('<details>'), comment(run.calls, 'handoff comment'))
```

The first two clauses pin the scenario's premise (round 1 has a block, round 2 ran the pass), so the check cannot pass on a run whose round 1 dropped nothing or whose round 2 had no pass. `body`, `labels` and `comment` are the section's own helpers (`tests/loop-test.mjs:1281`, `243`, `245`).

### Proof

Red first, by the mutation the finding names, after the check is added:

1. Edit `workflows/redline-loop.js` line 2875 from
   `  const lastCovered = rounds.slice().reverse().find((record) => record.coverage)`
   to
   `  const lastCovered = rounds.slice().reverse().find((record) => (record.droppedCandidates || []).length)`.
2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-1/redline/snapshot.json`. Its `loop` check exits 1, its output reads `600 checks passed, 1 failed`, and the `FAIL` line names this check. Record the line under As built. (The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.)
3. Restore line 2875 with Edit to its text above, byte for byte. `git diff --stat -- workflows/redline-loop.js` then prints nothing (no task before this one changes that file).

Green: the gate's loop step passes with this check among the passed ones (601 before Task 5, 602 at Task 6).

Neighbours, unchanged: the handoff checks `coverage: the handoff carries the last covered round's dropped block, naming the round, ...` (line 1516 at `beb1913`) and `coverage: after a final nit pass the handoff carries the round before it, named` (line 1523) stay green.

The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a Docs-step directory. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry.

**Commit:** `redline: R1-2 pin that the handoff carries the last covered round's dropped block, not the last round with drops (#85)`

## Task 4: R1-3, build the dropped line with personLine

`shape.md`, Decision 3. `droppedBlock` builds each line by hand with the template `personLine` builds (`workflows/redline-loop.js:872-874`). Both depend on the line opening with the backticked place, so `redline-gh.sh prior-findings` never reads it back.

**Files:**

- `workflows/redline-loop.js` (the comment at lines 876 to 881, and line 888)

**Change 1, line 888.** Replace

```js
    ...entries.map((e) => `- \`${e.file}:${e.line}\` · ${e.summary} · ${e.outcome}: ${e.ref || 'no reason given'}`),
```

with

```js
    ...entries.map((e) => personLine({ file: e.file, line: e.line, text: `${e.summary} · ${e.outcome}: ${e.ref || 'no reason given'}` })),
```

`personLine` returns `` `- \`${entry.file}:${entry.line}\` · ${entry.text}` ``, so each line is byte-identical to today's.

**Change 2, the comment above `droppedBlock`.** In lines 879 to 880, replace "Like a For the person line it opens with the backticked place, never a finding id, so redline-gh.sh prior-findings never reads it back." with "Each line is built by personLine, so it opens with the backticked place as a For the person line does, never a finding id, and redline-gh.sh prior-findings never reads it back (#86, R1-3)." The rest of the comment is unchanged.

### Proof

No new check: the output is byte-identical, and existing checks pin it byte for byte. They stay green unchanged:

- `coverage: the review body lists every dropped candidate after For the person, in index order, with its own summary unedited and the reason` (line 1512 at `beb1913`), which compares the whole block.
- `coverage: no dropped line opens with a finding id, so prior-findings never reads one back` (line 1513).
- `coverage: the handoff carries the last covered round's dropped block, naming the round, ...` (line 1516) and `coverage: after a final nit pass the handoff carries the round before it, named` (line 1523), which compare the handoff's block.
- `coverage: a dropped candidate with no reason reads "no reason given", with a warning naming its index` (line 1528), which reads the empty-ref fallback.

And:

- `grep -c "personLine({ file: e.file, line: e.line" workflows/redline-loop.js` prints `1` (was `0`).
- `grep -c "e.line}.. · .{e.summary}" workflows/redline-loop.js` prints `0` (was `1`, the hand-built template).
- Neighbour: `grep -c "function personLine(entry)" workflows/redline-loop.js` prints `1`, unchanged.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `workflows/redline-loop.js`.

**Docs entry:** `workflows/redline-loop.js` (the dropped block) is covered by `docs/running.md` "The coverage pass" and "The handoff comment". No reader-facing change: the line each one describes (the candidate's file and line, its own summary, the outcome and the reason) is byte-identical.

**Commit:** `redline: R1-3 build the dropped-candidate line with personLine (#85)`

## Task 5: R1-4, a finding entry's ref is the finding's id alone, and the issue's name goes elsewhere

`shape.md`, Decision 4 and Unattended answer 4. The accounting sentence in the agent file (line 50) and the verify prompt (`workflows/redline-loop.js:1203`) says a partly tracked candidate "is accounted for by what its remainder became, with the issue named", in the paragraph that defines each ref, and does not say where the name goes. A `finding` ref that carries it (`R1-1 (#7 tracks the case-folding)`) is matched exactly by `accountCoverage` (`byId.get(ref)`, line 1311), so the candidate is listed under For the person as reported, with a warning, and the count sentence reads 0 confirmed. The #85 spec's shaping default already names the places: "the finding's description, the For the person line or the ref".

**Files:**

- `tests/loop-test.mjs` (the key-phrase list at line 1469, and its comment at lines 1462 to 1465)
- `agents/redline-reviewer.md` (line 50)
- `workflows/redline-loop.js` (line 1203, and the comment above `candidatesBlock` at lines 1183 to 1189)

**Red first, `tests/loop-test.mjs`.**

- In the key-phrase list (line 1469), after the entry `['a removed guard is not disproportionate', 'this pull request stopped handling']`, add a fourth entry:
  `['a finding entry\'s ref is the finding\'s id alone', 'ref is the finding\'s id alone']`.
  The loop then also asserts that phrase in the agent file and a covered `review r1` prompt, and its absence from a `coverage off` one.
- In the comment above it (lines 1462 to 1465), replace "The verifier's three rules (#85), each pinned" with "The verifier's three rules (#85), and where a partly tracked candidate's issue is named (#86, R1-4), each pinned". The rest of the comment is unchanged.
- Run the gate (command in Task 6). Its `loop` check exits 1, its output reads `601 checks passed, 1 failed`, and the `FAIL` line names `coverage: the agent file and the verify prompt state the rule "a finding entry's ref is the finding's id alone", and a coverage-off prompt does not`. Record the line under As built.

**Change 1, `agents/redline-reviewer.md` line 50.** Replace

```text
A candidate an issue or a comment tracks only in part is accounted for by what its remainder became, with the issue named; `known` is for one tracked whole.
```

with

```text
A candidate an issue or a comment tracks only in part is accounted for by what its remainder became, with the issue named in the finding's description, the For the person line or the ref of any other outcome, since a `finding` entry's ref is the finding's id alone; `known` is for one tracked whole.
```

The rest of line 50 is unchanged.

**Change 2, `workflows/redline-loop.js` line 1203**, inside the single-quoted string. Replace

```text
A candidate an issue or a comment tracks only in part is accounted for by what its remainder became, with the issue named; known is for one tracked whole.
```

with (apostrophes escaped as the string already does)

```text
A candidate an issue or a comment tracks only in part is accounted for by what its remainder became, with the issue named in the finding\'s description, the forThePerson line or the ref of any other outcome, since a finding entry\'s ref is the finding\'s id alone; known is for one tracked whole.
```

The sentence stays in `candidatesBlock`'s branch with candidates, so every `coverage off` prompt stays byte-identical (`workflow/replay.md`). The rest of line 1203 is unchanged.

**Change 3, the comment above `candidatesBlock`.** Directly before its last line, `// Only the branch with candidates says so, so a coverage-off prompt is unchanged.` (line 1189), add:

```js
// A partly tracked candidate's issue is named in the finding's description, never in a finding ref,
// which accountCoverage matches by id alone (#86, R1-4).
```

`accountCoverage` is unchanged: a `finding` ref naming no finding of the round is still listed under For the person as reported, with its warning (#80, R1-4). The finding's optional hardening, matching a leading `R<n>-<k>` token of a `finding` ref, is not part of this task (`shape.md`, Unattended answer 6).

### Proof

- Green: the gate's loop step passes with the fourth key-phrase check among the passed ones, 602 checks, 0 failed.
- `grep -c "ref is the finding's id alone" agents/redline-reviewer.md` prints `1` (was `0`).
- `grep -c "ref is the finding..s id alone" workflows/redline-loop.js` prints `1` (was `0`; the two dots match the escaped apostrophe).
- `grep -c "with the issue named; " agents/redline-reviewer.md` prints `0` (was `1`).
- `grep -c "with the issue named; " workflows/redline-loop.js` prints `0` (was `1`).
- Neighbours, unchanged:
  - `grep -c "which is not a finding of this round; listed under For the person as reported" workflows/redline-loop.js` prints `1` (the exact-match warning).
  - The three #85 key-phrase checks, the partly tracked scenario (`coverage: a partly tracked candidate is a finding naming the issue, confirmed, shaped, and the run goes on`), and every `coverage off` and replay check stay green, since only the covered branch's text moves.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `agents/redline-reviewer.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.

**Docs entry:** `agents/redline-reviewer.md` and `workflows/redline-loop.js` (the verify prompt) are covered by `docs/running.md` "The coverage pass". No reader-facing change: that section already says a remainder whose cause is in this PR's diff "is a finding that names the issue in its description", and that a candidate "accounted for as a finding the round does not have, is listed under `### For the person` as reported, with a warning in the run". The fix makes the accounting sentence agree with both. `tests/loop-test.mjs` is not in a Docs-step directory.

**Commit:** `redline: R1-4 say where a partly tracked candidate's issue is named, since a finding ref is the finding's id alone (#85)`

## Task 6: Verification Gate

**Files:**

- `agent-os/specs/2026-11-11-1409-86-review-round-1/plan.md` and `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md` (step 13).
- `agent-os/standards/testing/tests.md` and `agent-os/standards/workflow/agents.md` (step 12), only the items the standards approver approves.

1. Steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expected: `loop` at `602 checks passed, 0 failed` (599 plus the three checks of Tasks 2, 3 and 5); every other harness at its count before the round, since no other harness or the files it reads changes.
2. Step 10, Docs: each task's Docs entry names its section or its reason, and is confirmed against that task's commit. No new config key, subcommand, allow rule or exit code.
3. Step 11, Version: `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the patch version from `0.2.1` on `main`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 5). The setup test's last cases prove the two agree.
4. Step 12, Standards retrospective: the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved, in one commit of their own after Task 5's: `redline: record the round 1 review lessons in the standards (#85)`. Keep every heading: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`, and `git diff --name-only HEAD~1 HEAD` lists only the standards files the approved items touch. If nothing is approved, make no commit, and "Standards retrospective: no changes" goes under Decisions in this folder's `shape.md`.
5. Step 13, Spec folder: add an "As built" section to this file. It records each task's commit, the red lines of Tasks 3 and 5, the proof outputs, the gate's counts, and which retrospective items the approver approved, declined or deferred. A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #86 round 1 as built (#85)`

## As built

Built in order, one commit per task. Every gate run below is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1409-86-review-round-1/redline/snapshot.json`; the runs before a task's commit list that task's edits under `uncommitted`, as Task 3 expects, and only their harness output is the evidence.

### Commits

- Task 1: `aa067ba` `redline: save review round 1 spec for PR #86 (#85)` (`plan.md`, `shape.md`, `standards.md`, `references.md`; nothing under `redline/`).
- Task 2, R1-1: `e815af8` `redline: R1-1 open the reviewer's known-finding check on what is already tracked in full (#85)`. `git diff --name-only HEAD~1 HEAD`: `agents/redline-reviewer.md`, `tests/loop-test.mjs`.
- Task 3, R1-2: `049ec27` `redline: R1-2 pin that the handoff carries the last covered round's dropped block, not the last round with drops (#85)`. `git diff --name-only HEAD~1 HEAD`: `tests/loop-test.mjs`.
- Task 4, R1-3: `564d349` `redline: R1-3 build the dropped-candidate line with personLine (#85)`. `git diff --name-only HEAD~1 HEAD`: `workflows/redline-loop.js`.
- Task 5, R1-4: `174000d` `redline: R1-4 say where a partly tracked candidate's issue is named, since a finding ref is the finding's id alone (#85)`. `git diff --name-only HEAD~1 HEAD`: `agents/redline-reviewer.md`, `tests/loop-test.mjs`, `workflows/redline-loop.js`.
- Task 6, step 12: `7a16400` `redline: record the round 1 review lessons in the standards (#85)`. `git diff --name-only HEAD~1 HEAD`: `agent-os/standards/testing/tests.md`, `agent-os/standards/workflow/agents.md`.
- Task 6, step 13: this section, in `redline: record PR #86 round 1 as built (#85)`.

### Proof outputs

- Task 2. Before Change 1, `grep -c "look for what is already tracked in full" agents/redline-reviewer.md` printed `0`; after, `1`. Neighbours: `^1. Open issues` `1`, `A known finding goes in knownAs.` in the workflow `1`, `the remainder is judged as its own candidate` in the agent file `2` before and after. Gate: `loop` at `600 checks passed, 0 failed`.
- Task 3, red. With line 2875 mutated to `find((record) => (record.droppedCandidates || []).length)`, the gate's `loop` exited 1 with `600 checks passed, 1 failed` and the line `FAIL coverage: the handoff carries the last covered round's block, not the last round with drops, so a last covered round that dropped nothing leaves no block though an earlier round dropped one: Redline handoff`. Line 2875 was restored with Edit; `git diff --stat -- workflows/redline-loop.js` then printed nothing. Green: `loop` at `601 checks passed, 0 failed`.
- Task 4. `grep -c "personLine({ file: e.file, line: e.line" workflows/redline-loop.js` `1` (was `0`), `grep -c "e.line}.. · .{e.summary}" workflows/redline-loop.js` `0` (was `1`), `grep -c "function personLine(entry)" workflows/redline-loop.js` `1`. Gate: `loop` at `601 checks passed, 0 failed`, the dropped-block checks unchanged and green.
- Task 5, red. With the fourth key-phrase entry added and the wording not yet changed, the gate's `loop` exited 1 with `601 checks passed, 1 failed` and the line `FAIL coverage: the agent file and the verify prompt state the rule "a finding entry's ref is the finding's id alone", and a coverage-off prompt does not: ["ref is the finding's id alone",false,false,false]`. Green after Changes 1 to 3: `602 checks passed, 0 failed`. `grep -c "ref is the finding's id alone" agents/redline-reviewer.md` `1`, `grep -c "ref is the finding..s id alone" workflows/redline-loop.js` `1`, `grep -c "with the issue named; "` `0` in both files, the exact-match warning `which is not a finding of this round; listed under For the person as reported` `1`.
- Step 12. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` printed `0`.

### Gate counts

Every run of the round: `syntax` 0, `validate` passed with warnings (as before), `guard` `592 passed, 0 mismatched`, `prefs` `101 passed, 0 failed`, `gate` `117 passed, 0 failed`, `setup` `468 passed, 0 failed`, `gh` `114 passed, 0 failed`, `background` `39 passed, 0 failed`. Only `loop` moved: 600 after Task 2, 601 after Tasks 3 and 4, 602 after Task 5, as planned.

### Docs and Version

- Step 10: each task's Docs entry was confirmed against its commit. `docs/running.md` "Rounds" (line 32) holds "already tracks in full is reported as"; "The coverage pass" (line 46) holds "is a finding that names the issue in its description" and the For the person listing "as reported, with a warning"; "The handoff comment" (line 81) describes the dropped line, which Task 4 leaves byte-identical. No new config key, subcommand, allow rule or exit code.
- Step 11: `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged.

### Standards retrospective

The standards approver approved items 1 to 4 of `shape.md`'s proposed list, applied as worded in `7a16400`: the new `testing/tests.md` bullet after line 23 (R1-2), the sentence appended to `testing/tests.md` line 9 (R1-1), and the two replacements in `workflow/agents.md` line 37 (R1-4, R1-3). Items 5 to 8 were already covered, with no change. Each edit is a lesson only; every finding's fix is in its own task commit, so the commit names no finding.

### Deviations

- Task 5, the comment above the key-phrase list in `tests/loop-test.mjs`: the replacement text is as planned, and the comment's four lines were rewrapped into five so no line runs past the file's width. The words after the replacement are unchanged. Recorded in `shape.md`, Decision 7.

### Notes

- Line numbers moved as the plan foresaw: after Task 4's comment edit (one line longer), the accounting sentence Task 5 changed was at `workflows/redline-loop.js:1204`, not 1203. Each edit was placed by its text.
- Run caution (#81), for the person: `git diff --stat beb1913..HEAD -- workflows agents` now lists `agents/redline-reviewer.md` and `workflows/redline-loop.js`, so a relaunch of this run after these commits meets #81 (`shape.md`, Context).
