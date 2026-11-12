# PR #86 review round 4: pin each form of a duplicate's ref, and keep its target when a note follows the index

Spec folder: `agent-os/specs/2026-11-11-1952-86-review-round-4/`

Shaped by Redline in unattended mode, for review round 4 of PR #86 (issue #85), from the round's two findings (`redline/round-4-review.json`, `redline/round-4-findings.json`).

- **R4-2** (nit): `fix`, Task 2. The duplicate-target parse gains one check per clause.
- **R4-1** (correctness): `ask`, decided by @michaelfromtheoutfit as option B (`shape.md`, Decision 2), Task 3. The accounting sentence has a duplicate's ref open with the index or the id, anything meant for the reader after it, and the target parse reads a leading index token as the backstop.

There is no `defer`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, and files staged by name. Line numbers are at `dbfcd69`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also named by its text, since an earlier edit moves later lines. Task 2 runs on the parse as it reads at `dbfcd69`, before any change Task 3's decision brings.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-4/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts:

- **Loop test.** Its count before this round is `610 checks passed, 0 failed` (the follow-up spec's As built, at `59903d8`; no later commit touches the test or the workflow). Task 2 adds four checks, and `go()` adds one run-record check for its run, so the green count is 615. Task 3 adds two more (the note form and one key phrase), so the round ends at 617.
- **Every other harness** keeps its count. Round 2's As built recorded guard 592, prefs 101, gate 117, setup 468, gh 114 and background 39, and `git diff --stat 8807864 HEAD` touches none of their files.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description's gate line.** "For the reviewer", "Gate:" says "The loop test passes 610 checks with 0 failed." After Task 2 it is 615, and after Task 3 it is 617. This repository has no standard for agent-written PR descriptions, so the round writes no `pr-body.md` (round 2's `shape.md`, Unattended answer 7, gives the evidence). The author can correct the number by hand.
- **Run caution (#81).** Task 2 commits `tests/loop-test.mjs` only. Task 3, option B as decided, commits `workflows/redline-loop.js` and `agents/redline-reviewer.md`. See `shape.md`, Context.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-11-1952-86-review-round-4/plan.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-4/shape.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-4/standards.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-4/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 4 spec for PR #86 (#85)`

## Task 2: R4-2, pin each form of a duplicate's ref the target parse reads or refuses

`shape.md`, Decision 1 and Unattended answers 6 and 7. The follow-up spec's Shaping default reads a duplicate ref as an index when it is `3`, `candidate 3` or `index 3`, in any case, and names another candidate of the round. It shows a ref naming the candidate itself, or an index out of range, as written. The suite pins only `3`, lower-case `candidate 2` and `R1-1`. A sibling scenario adds one check per clause of the parse. The nine-candidate scenario stays byte for byte as it is.

**Files:**

- `tests/loop-test.mjs`: a new scenario in section 15, inserted before line 1603.
- `workflows/redline-loop.js`: lines 2153 and 2155. They change **temporarily**, for the red run below, and are restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.** Directly before the line `  // coverage off: no candidates, so no set-aside block anywhere.` (line 1603), insert the lines below, followed by one blank line. They come after the escaping scenario's last check, `coverage: a For the person line is not escaped, so the escaping is the set-aside block's alone` (line 1601), and the blank line 1602.

```js
  // A duplicate's target, by the form of its ref (the #85 follow-up spec's shaping default "A
  // duplicate's target"; #86, R4-2): `index N` in lower case and `candidate N` in upper case each
  // read as another candidate's index and give its place and outcome, while a ref naming the
  // candidate itself, or an index past the round's candidates, is shown as written with no
  // addition. Each check turns on one clause of the parse: the `index` alternative, the case flag,
  // the self guard and the lookup of the index among the round's candidates.
  const forms = fenced([cand('app/z.php', 5, 'the target'), cand('app/z.php', 6, 'a lower-case index ref'), cand('app/z.php', 7, 'an upper-case candidate ref'), cand('app/z.php', 8, 'a ref naming itself'), cand('app/z.php', 9, 'a ref past the last candidate')])
  const formsOut = [
    { index: 1, outcome: 'refuted', ref: 'The claim is one thing; the code does another.' },
    { index: 2, outcome: 'duplicate', ref: 'index 1' },
    { index: 3, outcome: 'duplicate', ref: 'CANDIDATE 1' },
    { index: 4, outcome: 'duplicate', ref: '4' },
    { index: 5, outcome: 'duplicate', ref: '99' },
  ]
  run = await go('coverage: a duplicate\'s target by the form of its ref', covArgs, { reviews: [[]], coverage: [forms], coverageOut: [formsOut] })
  const fb = body(run.calls, 'post r1')
  check('coverage: a lower-case `index N` duplicate ref reads as another candidate\'s index and gives its place and outcome', fb.includes('\n- `app/z.php:6` · a lower-case index ref · duplicate: index 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: an upper-case `CANDIDATE N` duplicate ref reads as another candidate\'s index, since the parse ignores case', fb.includes('\n- `app/z.php:7` · an upper-case candidate ref · duplicate: CANDIDATE 1 (candidate 1, `app/z.php:5`: refuted)\n'), fb)
  check('coverage: a duplicate ref naming the candidate itself is shown as written, with no addition', fb.includes('\n- `app/z.php:8` · a ref naming itself · duplicate: 4\n'), fb)
  check('coverage: a duplicate ref past the round\'s last candidate is shown as written, with no addition', fb.includes('\n- `app/z.php:9` · a ref past the last candidate · duplicate: 99\n'), fb)
```

The separator `·` is the same character (U+00B7) the section's other expected lines use, for example line 1533. `run` is the section's `let run`. `fenced`, `cand`, `covArgs` and `body` are the section's helpers (lines 1277 to 1284). `forms`, `formsOut` and `fb` are new names in section 15. The scenario's shape, one round with no finding, is the escaping scenario's (line 1588).

Do not add a ref with a note after the index (for example `1; #7 tracks the case-folding`) in this task. Task 3 adds it for R4-1's decision, seen red before the parse widens, so this task's commit runs on the parse as it reads at `dbfcd69`.

### Proof

Red first, by mutation, since the code already holds the behaviour. The scenario is inserted first; then:

1. Apply both mutations to `workflows/redline-loop.js` with Edit.
   - **Line 2153.** Change
     `        const target = e.outcome === 'duplicate' ? /^(?:(?:candidate|index)\s+)?(\d+)$/i.exec(e.ref) : null`
     to
     `        const target = e.outcome === 'duplicate' ? /^(?:(?:candidate)\s+)?(\d+)$/.exec(e.ref) : null`.
     This drops the `index` alternative and the `i` flag.
   - **Line 2155.** Change the opening `        const into = to !== e.index && byIndex.has(to) ? {` to `        const into = byIndex.has(to) ? {`. This drops the self guard; the rest of the line is unchanged.
2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-4/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `612 checks passed, 3 failed`. The three `FAIL` lines name:
   - `coverage: a lower-case `index N` duplicate ref reads as another candidate's index and gives its place and outcome` (the missing `index`);
   - `coverage: an upper-case `CANDIDATE N` duplicate ref reads as another candidate's index, since the parse ignores case` (the missing `i`);
   - `coverage: a duplicate ref naming the candidate itself is shown as written, with no addition`. Its detail shows the line ending `duplicate: 4 (candidate 4, `app/z.php:8`: duplicate)` (the missing guard).

   `coverage: a duplicate ref past the round's last candidate is shown as written, with no addition` stays green, since `99` is never in `byIndex`. So does the nine-candidate scenario, whose `3` and lower-case `candidate 2` still match and name no candidate itself. Each red check turns on one mutation only (`shape.md`, Unattended answer 6). Record the three lines, and any other `FAIL` line, under As built. The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.
3. Restore both lines with Edit, byte for byte, to their text in step 1. `git diff --stat -- workflows/redline-loop.js` then prints nothing, since the PR's changes to that file are already committed.

Green: the gate's loop step passes with the four new checks among the passed ones, `615 checks passed, 0 failed`.

And:

- `grep -c "outcome: 'duplicate'" tests/loop-test.mjs` prints `7` (was `3`).
- `grep -c "ref: 'CANDIDATE 1'" tests/loop-test.mjs` prints `1` (was `0`).
- `grep -c "const into = to .== e.index" workflows/redline-loop.js` prints `1`, so the guard is back.
- `git diff --stat -- workflows/redline-loop.js` prints nothing.
- Neighbours, unchanged and green: the nine-candidate scenario's checks, `coverage: the review body lists every candidate that is neither a finding nor For the person after For the person, in index order, with its own summary, the outcome and the ref` and the label-count check after it, whose pinned block holds `duplicate: 3 (candidate 3, `app/z.php:5`: refuted)` and `duplicate: candidate 2 (candidate 2, `app/y.php:9`: forThePerson)`; and the escaping scenario's two checks.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a Docs-step directory. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry.

**Commit:** `redline: R4-2 pin each form of a duplicate's ref that the target parse reads or shows as written (#85)`

## Task 3: R4-1, have a duplicate's ref open with the index or the id, and read a leading index as its target

Decided as option B, "widen the parse and tell the verifier", by @michaelfromtheoutfit on 2026-11-11 (`shape.md`, Decision 2; Unattended answers 4 and 5). The accounting sentence, in the verify prompt and the agent file, says a duplicate's ref opens with the index of the candidate or the id of the finding it collapses into, with anything meant for the reader after it. The target parse reads a ref that opens with an index whatever follows it, as the backstop. Prompts under `coverage off` stay byte-identical, since the sentence is in `candidatesBlock`'s branch with candidates (`workflow/replay`, line 15).

**What happens today.** The parse at `workflows/redline-loop.js:2153`, `/^(?:(?:candidate|index)\s+)?(\d+)$/i`, is anchored at both ends. A duplicate ref such as `3; #7 tracks the case-folding` therefore gets no target. The accounting sentence invites that form, in `candidatesBlock` (line 1244) and `agents/redline-reviewer.md:50`: "the ref of any other outcome" for a partly tracked candidate, and "write each of those refs for the teammate who may overrule it". The duplicate's line then shows no place and no outcome for the candidate it collapsed into, while `docs/running.md:48`, `agent-os/standards/workflow/agents.md:37`, the comment at `workflows/redline-loop.js:881-883` and the PR description say a duplicate of a dropped or tracked candidate cannot hide. Those "cannot hide" sentences stay as they are; under this decision they hold for every ref that opens with the index.

This task runs after Task 2's commit, so `workflows/redline-loop.js` reads as at `dbfcd69` (Task 2 restored it) and `tests/loop-test.mjs` holds Task 2's scenario. Line numbers are at `dbfcd69` for the workflow and the agent file; each anchor is also named by its text.

**Files:**

- `tests/loop-test.mjs`: Task 2's scenario, `coverage: a duplicate's target by the form of its ref`; the key-phrase list at line 1476 and the comment above it (lines 1465 to 1471).
- `workflows/redline-loop.js`: the set-aside build's comment (lines 2142 to 2144), the target parse (line 2153), and the accounting sentence in `candidatesBlock` (line 1244).
- `agents/redline-reviewer.md`: the paragraph opening `**Account for every candidate**` (line 50).
- `docs/running.md`: "The coverage pass" (line 48).

**Change, `tests/loop-test.mjs` (made first, for the red run).**

1. Task 2's scenario.
   - Its comment: after its last line, `  // the self guard and the lookup of the index among the round's candidates.`, add these lines, indented two spaces like the rest:

     ```js
     // A ref that opens with the index and carries a note after it keeps its target, since the
     // parse reads a leading index token and the accounting sentence asks for the index first (#86,
     // R4-1).
     ```

   - `forms`: append a sixth candidate, `cand('app/z.php', 10, 'a ref with a note after the index')`, after `cand('app/z.php', 9, 'a ref past the last candidate')`.
   - `formsOut`: append `{ index: 6, outcome: 'duplicate', ref: '1; #7 tracks the case-folding' },` after the entry `{ index: 5, outcome: 'duplicate', ref: '99' },`.
   - After the check `coverage: a duplicate ref past the round's last candidate is shown as written, with no addition`, add:

     ```js
       check('coverage: a duplicate ref that opens with another candidate\'s index keeps its place and outcome with a note after the index', fb.includes('\n- `app/z.php:10` · a ref with a note after the index · duplicate: 1; #7 tracks the case-folding (candidate 1, `app/z.php:5`: refuted)\n'), fb)
     ```

   Task 2's four checks hold unchanged: `99` is still past the round's six candidates, `4` still names itself, and the four lines they look for are still in the block (`shape.md`, Unattended answer 6, traced under the widened parse). The separator `·` is U+00B7, as in Task 2.
2. The key-phrase list at line 1476 (`  for (const [rule, phrase] of [['partly tracked', ...`): append a seventh entry after `['the review body lists every candidate that is neither a finding nor a For the person entry', 'every candidate that is neither a finding nor']`:

   ```js
   , ['a duplicate\'s ref opens with the index or the id', 'opening with the index of the candidate or the id of the finding']
   ```

   In the comment above the list, after "The sixth pins the accounting sentence that says what the set-aside block lists, widened with the block (the #85 follow-up spec, answer 11).", add "The seventh pins that a duplicate's ref opens with the index or the id, so the target parse reads it (#86, R4-1).", rewrapped at the comment's width.

**Change, `workflows/redline-loop.js`, the parse (green, first step).**

3. Line 2153: change
   `        const target = e.outcome === 'duplicate' ? /^(?:(?:candidate|index)\s+)?(\d+)$/i.exec(e.ref) : null`
   to
   `        const target = e.outcome === 'duplicate' ? /^(?:(?:candidate|index)\s+)?(\d+)\b/i.exec(e.ref) : null`.
   Only the end anchor `$` becomes the word boundary `\b`.

   The comment at lines 2142 to 2144: change "A duplicate whose ref is another candidate's index (`3`, `candidate 3` or `index 3`) carries that candidate's place and outcome in `into`, one hop, so its line shows where it went; any other ref is shown as written." to "A duplicate whose ref opens with another candidate's index (`3`, `candidate 3` or `index 3`, any case), with any note after it as the accounting sentence asks, carries that candidate's place and outcome in `into`, one hop, so its line shows where it went; any other ref is shown as written (#86, R4-1).", rewrapped at the comment's width. The parse line moves down by any line the comment gains.

**Change, the prompt and the agent file (green, second step).**

4. `workflows/redline-loop.js` line 1244, the line opening `    'Account for every index in coverage, one entry each, with outcome and ref:`: change `duplicate (ref the index or the id it collapses into)` to `duplicate (ref opening with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it)`. Nothing else on the line changes.
5. `agents/redline-reviewer.md` line 50, the paragraph opening `**Account for every candidate**`: change `` `duplicate` (the index or the id it collapses into) `` to `` `duplicate` (opening with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it) ``. Nothing else changes.

   A search of both files for the rule's own words (`collapses into`, `duplicate`) finds no other statement of what a duplicate's ref holds: the agent file's return block (line 97) gives `"ref": "R1-1"` for its one example entry, and the workflow's other uses are the outcome list (line 507), the count sentence (line 937), the id rename (lines 2122 to 2132) and the parse itself (`workflow/agents`, line 16, #80 R3-3).
6. `docs/running.md`, "The coverage pass", line 48: change "a `duplicate` line names what it collapsed into, plus, when that is another candidate, that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide." to "a `duplicate` line names what it collapsed into, its ref opening with the candidate's index or the finding's id and anything meant for the reader after it, plus, when it opens with another candidate's index (`3`, `candidate 3` or `index 3`), that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide (#86, R4-1)."

### Proof

Red first.

1. With steps 1 and 2 made and nothing else, run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-4/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `615 checks passed, 2 failed`. The two `FAIL` lines name:
   - `coverage: a duplicate ref that opens with another candidate's index keeps its place and outcome with a note after the index`. Its detail shows the line ending `duplicate: 1; #7 tracks the case-folding` with no addition (the parse anchored at both ends).
   - `coverage: the agent file and the verify prompt state the rule "a duplicate's ref opens with the index or the id", and a coverage-off prompt does not`. Its detail shows the phrase in neither the agent file nor the covered prompt.
2. Make step 3 (the parse and its comment) and run the gate again: `616 checks passed, 1 failed`. The one `FAIL` line left is the key-phrase check, so the parse alone turns the note check green.
3. Make steps 4 to 6 and run the gate again.

Record both red runs' `FAIL` lines, and any other, under As built. The gate's git block lists the uncommitted edits at these points; only the loop output is the evidence there.

Green: the gate's loop step passes, `617 checks passed, 0 failed`. Every other harness keeps its count: `tests/guard-cases.tsv` names these paths, but no guard row or guard file changes.

And:

- `grep -cF '(\d+)\b/i.exec(e.ref)' workflows/redline-loop.js` prints `1`, and `grep -c 'i.exec(e.ref)' workflows/redline-loop.js` prints `1`. The second prints `1` at `dbfcd69` too, where the parse at line 2153 is that pattern's only match, so together they show that the one target parse left ends in the word boundary and the parse anchored at both ends is gone (`shape.md`, Decision 5).
- `grep -c "opening with the index of the candidate or the id of the finding" workflows/redline-loop.js` prints `1`, and the same command over `agents/redline-reviewer.md` prints `1`.
- `grep -c "the index or the id it collapses into" workflows/redline-loop.js` prints `0`, and the same command over `agents/redline-reviewer.md` prints `0`.
- `grep -c "outcome: 'duplicate'" tests/loop-test.mjs` prints `8` (was `7` after Task 2).
- `grep -c "opening with the candidate's index or the finding's id" docs/running.md` prints `1`.
- Neighbours, unchanged and green: Task 2's four checks; the nine-candidate scenario's pinned block, with `duplicate: 3 (candidate 3, `app/z.php:5`: refuted)`, `duplicate: candidate 2 (candidate 2, `app/y.php:9`: forThePerson)` and `duplicate: R1-1` as written, and its label-count check; the six earlier key-phrase checks; and every pre-existing scenario under `coverage off`, so a coverage-off prompt is byte-identical (`workflow/replay`, line 15).
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.

**Not changed, for the person.** The id rename before the accounting (`workflows/redline-loop.js:2122-2132`, `if (renamed.has(ref))`) matches a `finding` or `duplicate` ref whole. A duplicate ref that opens with an id the rename changed and carries a note after it keeps the old id. The decided sentence asks for the id first with a note after it, which makes that form likelier. Round 2 of this PR set the same case aside as `disproportionate` (`shape.md`, Unattended answer 9). The decision names no change there, and this task makes none.

**Docs entry:** `docs/running.md`, "The coverage pass", updated in this task's commit for the changes to `workflows/redline-loop.js` and `agents/redline-reviewer.md`. `tests/loop-test.mjs` is not in a Docs-step directory. There is no template, config key, subcommand, allow rule or exit code.

**Version:** none (`shape.md`, Decision 3). Nothing a setup rerun writes changes.

**Run caution (#81):** this commit carries `workflows/redline-loop.js` and `agents/redline-reviewer.md` (`shape.md`, Context).

**Commit:** `redline: R4-1 have a duplicate's ref open with the index or the id, and read a leading index as its target (#85)`, staging the four files above by name.

## Task 4: Verification Gate

**Files:**

- `agent-os/specs/2026-11-11-1952-86-review-round-4/plan.md` and `agent-os/specs/2026-11-11-1952-86-review-round-4/shape.md` (step 13).
- `agent-os/standards/testing/tests.md` (step 12, item 1), and `agent-os/standards/workflow/agents.md` (step 12, item 2, drafted for R4-1's decision: lines 16 and 37). Only the items the standards approver approves.

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-4/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: `loop` at `617 checks passed, 0 failed` after Task 3 (615 after Task 2). Every other harness is expected at its count before the round, since no file one reads changes.
2. **Step 10, Docs:** each task's Docs entry names its section or its reason, and is confirmed against that task's commit. Task 2 has none, since its commit is a test file only. Task 3's entry is `docs/running.md`, "The coverage pass", in Task 3's commit. There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the patch version from `0.2.1` on `main`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 3). The setup test's last cases prove the two agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved. They go in one commit of their own after the finding commits: `redline: record the round 4 review lessons in the standards (#85)`.
   - Item 2 is drafted for R4-1's decision (option B), and the standards approver judges it like the others.
   - Keep every heading: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`.
   - `git diff --name-only HEAD~1 HEAD` lists only the standards files the approved items touch.
   - If nothing is approved, make no commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Task 2's red lines;
   - the proof outputs;
   - the gate's counts;
   - R4-1's decision, with its owner;
   - which retrospective items the approver approved, declined or deferred.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #86 round 4 as built (#85)`

---

## As built

Built by the Redline implementer on 2026-11-11, on top of `dbfcd69`. No deviation from the plan.

### Commits

- Task 1: `49434ca` `redline: save review round 4 spec for PR #86 (#85)`: `plan.md`, `shape.md`, `standards.md` and `references.md`, nothing under `redline/`.
- Task 2 (R4-2): `82bdccb` `redline: R4-2 pin each form of a duplicate's ref that the target parse reads or shows as written (#85)`. `git diff --name-only HEAD~1 HEAD` listed exactly `tests/loop-test.mjs`.
- Task 3 (R4-1): `ee7fbbe` `redline: R4-1 have a duplicate's ref open with the index or the id, and read a leading index as its target (#85)`. `git diff --name-only HEAD~1 HEAD` listed exactly `agents/redline-reviewer.md`, `docs/running.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.
- Task 4, step 12: `81ac40e` `redline: record the round 4 review lessons in the standards (#85)`: `agent-os/standards/testing/tests.md` and `agent-os/standards/workflow/agents.md`.
- Task 4, step 13: this section, in the round's last commit, `redline: record PR #86 round 4 as built (#85)`.

### Task 2's red run

Both mutations applied with Edit (line 2153 without `index` and without `i`; line 2155 without `to !== e.index &&`), then the gate. Its `loop` check exited 1 with `612 checks passed, 3 failed`:

- `FAIL coverage: a lower-case `index N` duplicate ref reads as another candidate's index and gives its place and outcome`
- `FAIL coverage: an upper-case `CANDIDATE N` duplicate ref reads as another candidate's index, since the parse ignores case`
- `FAIL coverage: a duplicate ref naming the candidate itself is shown as written, with no addition`, its detail holding the line `- `app/z.php:8` · a ref naming itself · duplicate: 4 (candidate 4, `app/z.php:8`: duplicate)`

The out-of-range check (`99`) and the nine-candidate scenario stayed green, and there was no other `FAIL` line. Both lines were restored with Edit; `git diff --stat -- workflows/redline-loop.js` then printed nothing.

Green: `615 checks passed, 0 failed`. `grep -c "outcome: 'duplicate'" tests/loop-test.mjs` printed `7`, `grep -c "ref: 'CANDIDATE 1'" tests/loop-test.mjs` printed `1`, and `grep -c "const into = to .== e.index" workflows/redline-loop.js` printed `1`.

### Task 3's red runs

R4-1 was decided as option B, "widen the parse and tell the verifier", by @michaelfromtheoutfit on 2026-11-11 (`shape.md`, Decision 2).

1. Steps 1 and 2 only (the note candidate and check, the seventh key phrase): `615 checks passed, 2 failed`.
   - `FAIL coverage: the agent file and the verify prompt state the rule "a duplicate's ref opens with the index or the id", and a coverage-off prompt does not`, detail `["opening with the index of the candidate or the id of the finding",false,false,false]`.
   - `FAIL coverage: a duplicate ref that opens with another candidate's index keeps its place and outcome with a note after the index`, the block's line reading `- `app/z.php:10` · a ref with a note after the index · duplicate: 1; #7 tracks the case-folding` with no addition.
2. Step 3 added (the parse ends in `\b`, and its comment): `616 checks passed, 1 failed`, the one `FAIL` line the key-phrase check above.
3. Steps 4 to 6 added: `617 checks passed, 0 failed`.

No other `FAIL` line in any run.

Proof outputs after Task 3:

- `grep -cF '(\d+)\b/i.exec(e.ref)' workflows/redline-loop.js`: `1`; `grep -c 'i.exec(e.ref)' workflows/redline-loop.js`: `1`.
- `grep -c "opening with the index of the candidate or the id of the finding"`: `1` in `workflows/redline-loop.js`, `1` in `agents/redline-reviewer.md`.
- `grep -c "the index or the id it collapses into"`: `0` in both files.
- `grep -c "outcome: 'duplicate'" tests/loop-test.mjs`: `8`.
- `grep -c "opening with the candidate's index or the finding's id" docs/running.md`: `1`.

### Gate

The last run of `.claude/redline/checks.sh` with this round's snapshot, after Task 3: syntax, validate, guard `592 passed, 0 mismatched`, loop `617 checks passed, 0 failed`, prefs `101 passed, 0 failed`, gate `117 passed, 0 failed`, setup `468 passed, 0 failed`, gh `114 passed, 0 failed` and background `39 passed, 0 failed`, each as the plan expected. `git.unexpected_files` was empty throughout.

- **Docs (step 10).** Task 2 has no entry: its commit is a test file only. Task 3's entry, `docs/running.md`, "The coverage pass", landed in `ee7fbbe`.
- **Version (step 11).** `0.2.2`, unchanged.

### Standards retrospective

The standards approver approved items 1 and 2 of `shape.md`'s "Standards retrospective (proposed)", applied as worded in `81ac40e`:

- Item 1: `testing/tests.md` line 22, a case per accepted and refused form (R4-2).
- Item 2: `workflow/agents.md` line 37, the #85 bullet (R4-1), and line 16, a prompt sentence that invites text into a parsed field (R1-4, R4-1).

Items 3 to 6 were proposed as already covered, with no change. None was declined or deferred. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` printed `0`.
