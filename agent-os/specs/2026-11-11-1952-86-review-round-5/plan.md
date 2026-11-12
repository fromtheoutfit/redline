# PR #86 review round 5: pin an `&` in a span and the parse's last two clauses, and name a duplicate's finding

Spec folder: `agent-os/specs/2026-11-11-1952-86-review-round-5/`

Shaped by Redline in unattended mode, for review round 5 of PR #86 (issue #85), from the round's four findings (`redline/round-5-review.json`, `redline/round-5-findings.json`). All four are nits; the round has no correctness finding, so this is the final nit round, and a final nit pass reviews these fixes.

- **R5-1** (nit): `fix`, Task 2. The escaping scenario gains an `&` inside a span beside one outside it.
- **R5-2** (nit): `fix`, Task 3. The duplicate-forms scenario gains `1st pass missed it` and `candidate1`, one check each.
- **R5-3** (nit): `fix`, Task 4. The comment above `LISTED_ELSEWHERE` says a candidate behind an Already tracked finding is set aside as `known`.
- **R5-4** (nit): `fix`, Task 5. A duplicate of a candidate that became a finding names the finding's id after the outcome.

There is no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, and files staged by name. Line numbers are at `dd42671`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also named by its text, since an earlier edit moves later lines: Task 4 adds three lines to `workflows/redline-loop.js` above every anchor Task 5 uses, and Tasks 2 and 3 add lines to `tests/loop-test.mjs` above the anchors after them. An anchor or a replacement that holds a backtick is given in a fenced block, so it reads exactly as the file does.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-5/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts:

- **Loop test.** `617 checks passed, 0 failed` before this round (round 4's As built; `git diff --stat ee7fbbe dd42671` touches only the round 4 plan and two standards). Task 2 adds no check, since its case joins an existing one. Task 3 adds two. Task 4 adds none. Task 5 adds one, plus the run-record check `go()` adds for a run that reaches its handoff (`tests/loop-test.mjs:233-239`). So the round ends at 621.
- **Every other harness** keeps its count: guard 592, prefs 101, gate 117, setup 468, gh 114 and background 39 (round 4's As built). No file one reads changes.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description.** "For the reviewer", "Gate:" says "The loop test passes 610 checks with 0 failed." It is 617 now and 621 after this round. "What lands" says a duplicate line "also gives that candidate's place and outcome". After Task 5 it also gives the finding's id when that candidate became a finding. The round writes no `pr-body.md`, since this repository has no standard for agent-written PR descriptions (`shape.md`, Context). The author can correct both by hand.
- **Run caution (#81).** Tasks 2 and 3 commit `tests/loop-test.mjs` only. Task 4 commits a comment in `workflows/redline-loop.js`. Task 5 commits `workflows/redline-loop.js`, `tests/loop-test.mjs` and `docs/running.md`. See `shape.md`, Context, which also records that the posted round 5 body already shows a line rendered by a workflow from before `ee7fbbe`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-11-1952-86-review-round-5/plan.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-5/shape.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-5/standards.md`
- `agent-os/specs/2026-11-11-1952-86-review-round-5/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 5 spec for PR #86 (#85)`

## Task 2: R5-1, pin an `&` inside a code span of the set-aside block as written

`shape.md`, Decision 1 and Unattended answer 4. `blockText` escapes `&` and `<` only outside paired code spans, but no case has an `&` inside a span, so a `blockText` that escaped `&` across the whole text before the pairing stays green. The escaping scenario gains one candidate whose summary holds `&` inside a span and outside it.

**Files:**

- `tests/loop-test.mjs`: the escaping scenario, lines 1568 to 1601.
- `workflows/redline-loop.js`: line 911. It changes **temporarily**, for the red run below, and is restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.**

1. The scenario's comment, line 1572: replace

   ```js
     // a backslash before a backtick, is escaped whole. For the person lines are not escaped.
   ```

   with these two lines:

   ```js
     // a backslash before a backtick, is escaped whole. For the person lines are not escaped. An `&`
     // inside a span is left as written, beside one outside it that is escaped (#86, R5-1).
   ```

2. `tags`: after the line (1579)

   ```js
       cand('app/f.vue', 6, 'an escaped \\` then <i>`'),
   ```

   add:

   ```js
       cand('app/g.vue', 7, 'a span `a && b <c>` keeps its ampersands & this one does not'),
   ```

3. `tagsOut`: after the line `    { index: 6, outcome: 'outside', ref: 'untouched code' },` (line 1587, the only line with that text), add:

   ```js
       { index: 7, outcome: 'outside', ref: 'untouched code' },
   ```

4. `escapedLines`: after the line (1596)

   ```js
       '- `app/f.vue:6` · an escaped \\` then &lt;i>` · outside: untouched code',
   ```

   add:

   ```js
       '- `app/g.vue:7` · a span `a && b <c>` keeps its ampersands &amp; this one does not · outside: untouched code',
   ```

5. The check `coverage: the set-aside block escapes & and < outside code spans, leaves a span as written, and stays one collapsed block, in the review body and the handoff` (line 1601): change `Candidates set aside (6)` to `Candidates set aside (7)`, and `Candidates set aside in round 1 (6)` to `Candidates set aside in round 1 (7)`. Nothing else on the line changes.

The separator `·` is U+00B7, the character the section's other expected lines use. The check's name is unchanged: it already says it leaves a span as written.

### Proof

Red first, by mutation, since the code already holds the behaviour. With steps 1 to 5 made:

1. Mutate `workflows/redline-loop.js` with Edit. Line 911,

   ```js
     const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
   ```

   becomes these two lines, which escape `&` across the whole text before the span pairing:

   ```js
     text = text.replace(/&/g, '&amp;')
     const escape = (s) => s.replace(/</g, '&lt;')
   ```

2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-5/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `616 checks passed, 1 failed`. The one `FAIL` line names `coverage: the set-aside block escapes & and < outside code spans, leaves a span as written, and stays one collapsed block, in the review body and the handoff`, and its detail holds ``a span `a &amp;&amp; b <c>` keeps its ampersands``. Candidate 1's ref and the two fallback lines read the same under the mutation (`shape.md`, Unattended answer 4), so no other line moves. Record the `FAIL` line, and any other, under As built. The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.
3. Restore line 911 with Edit, byte for byte, to its text in step 1: the two lines become the one line again. `git diff --stat -- workflows/redline-loop.js` then prints nothing.

Green: the gate's loop step passes, `617 checks passed, 0 failed`.

And:

- `grep -c "cand('app/g.vue', 7" tests/loop-test.mjs` prints `1` (was `0`).
- `grep -c 'Candidates set aside (6)' tests/loop-test.mjs` prints `0` (was `1`), and `grep -c 'Candidates set aside in round 1 (7)' tests/loop-test.mjs` prints `1` (was `0`).
- `grep -cF "const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')" workflows/redline-loop.js` prints `1`, and `grep -c 'text = text.replace' workflows/redline-loop.js` prints `0`, so the mutation is gone.
- Neighbours, unchanged and green: the scenario's six earlier lines in the same check, and `coverage: a For the person line is not escaped, so the escaping is the set-aside block's alone`.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a Docs-step directory. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry.

**Commit:** `redline: R5-1 pin an ampersand inside a code span of the set-aside block as written (#85)`

## Task 3: R5-2, pin the target parse's word boundary and the space after `candidate`

`shape.md`, Decision 2 and Unattended answer 5. The parse `/^(?:(?:candidate|index)\s+)?(\d+)\b/i` (`workflows/redline-loop.js:2154`) refuses a leading number that runs into a word and a `candidate` with no space before the number, but no case turns on either clause. The duplicate-forms scenario gains one ref for each, shown as written.

**Files:**

- `tests/loop-test.mjs`: the duplicate-forms scenario, lines 1603 to 1628.
- `workflows/redline-loop.js`: line 2154. It changes **temporarily**, for the red run below, and is restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.** Task 2 adds four lines above this scenario, so each line number here is four more after Task 2; each anchor is also named by its text.

1. The scenario's comment: after its last line, `  // R4-1).` (line 1612, the only line with that text, after `  // parse reads a leading index token and the accounting sentence asks for the index first (#86,`), add:

   ```js
     // A leading number that runs into a word (`1st`) is not an index token, since the index ends at
     // a word boundary, and `candidate` with no space before the number is not the `candidate N`
     // form, so both are shown as written: one check each for the `\b` and the `\s+` (#86, R5-2).
   ```

2. `forms` (line 1613): after `cand('app/z.php', 10, 'a ref with a note after the index')`, inside the array, append:

   ```js
   , cand('app/z.php', 11, 'a ref whose number runs into a word'), cand('app/z.php', 12, 'a ref with no space after candidate')
   ```

3. `formsOut`: after the line `    { index: 6, outcome: 'duplicate', ref: '1; #7 tracks the case-folding' },` (line 1620), add:

   ```js
       { index: 7, outcome: 'duplicate', ref: '1st pass missed it' },
       { index: 8, outcome: 'duplicate', ref: 'candidate1' },
   ```

4. After the check whose name is `coverage: a duplicate ref that opens with another candidate\'s index keeps its place and outcome with a note after the index` (line 1628), add:

   ```js
     check('coverage: a duplicate ref whose leading number runs into a word is shown as written, with no addition', fb.includes('\n- `app/z.php:11` · a ref whose number runs into a word · duplicate: 1st pass missed it\n'), fb)
     check('coverage: a duplicate ref with no space between `candidate` and the number is shown as written, with no addition', fb.includes('\n- `app/z.php:12` · a ref with no space after candidate · duplicate: candidate1\n'), fb)
   ```

The separator `·` is U+00B7. `fb` is the scenario's body. Round 4's five checks hold unchanged: `99` is still past the round's candidates, now eight, and `4` still names itself.

### Proof

Red first, by mutation, since the code already holds the behaviour. With steps 1 to 4 made:

1. Mutate `workflows/redline-loop.js` with Edit. Line 2154,

   ```js
           const target = e.outcome === 'duplicate' ? /^(?:(?:candidate|index)\s+)?(\d+)\b/i.exec(e.ref) : null
   ```

   becomes

   ```js
           const target = e.outcome === 'duplicate' ? /^(?:(?:candidate|index)\s*)?(\d+)/i.exec(e.ref) : null
   ```

   This drops the word boundary and loosens the space after `candidate` or `index`.
2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-5/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `617 checks passed, 2 failed`. The two `FAIL` lines name:
   - ``coverage: a duplicate ref whose leading number runs into a word is shown as written, with no addition``, its detail holding ``duplicate: 1st pass missed it (candidate 1, `app/z.php:5`: refuted)`` (the missing `\b`);
   - ``coverage: a duplicate ref with no space between `candidate` and the number is shown as written, with no addition``, its detail holding ``duplicate: candidate1 (candidate 1, `app/z.php:5`: refuted)`` (the loosened `\s+`).

   Each turns on one clause only, and every other duplicate ref in the suite reads the same under both (`shape.md`, Unattended answer 5). Record both lines, and any other `FAIL` line, under As built. The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.
3. Restore line 2154 with Edit, byte for byte, to its text in step 1. `git diff --stat -- workflows/redline-loop.js` then prints nothing.

Green: the gate's loop step passes, `619 checks passed, 0 failed`.

And:

- `grep -c "ref: '1st pass missed it'" tests/loop-test.mjs` prints `1`, and `grep -c "ref: 'candidate1'" tests/loop-test.mjs` prints `1`.
- `grep -c "outcome: 'duplicate'" tests/loop-test.mjs` prints `10` (was `8`).
- `grep -cF '(\d+)\b/i.exec(e.ref)' workflows/redline-loop.js` prints `1`, so the parse is back.
- Neighbours, unchanged and green: round 4's five checks in this scenario, and the nine-candidate scenario's pinned block with ``duplicate: 3 (candidate 3, `app/z.php:5`: refuted)``, ``duplicate: candidate 2 (candidate 2, `app/y.php:9`: forThePerson)`` and `duplicate: R1-1` as written.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a Docs-step directory. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry.

**Commit:** `redline: R5-2 pin the duplicate-target parse's word boundary and its space after candidate (#85)`

## Task 4: R5-3, say that a candidate behind an Already tracked finding is set aside as `known`

`shape.md`, Decision 3 and Unattended answer 6. The comment above `LISTED_ELSEWHERE` says the round lists "a finding under Findings or Already tracked" elsewhere. But `accountCoverage` accounts for a `finding` entry whose finding carries a `knownAs` as `known` before the set-aside filter runs, so that candidate is set aside and in the block. A comment change only.

**Files:**

- `workflows/redline-loop.js`: the comment at lines 508 to 512, directly above `const LISTED_ELSEWHERE = ['finding', 'forThePerson']` (line 513).

**Change.** Replace the five comment lines that open `// The outcomes the round lists elsewhere: a finding under Findings or Already tracked, an entry` and end `// person can overrule a drop, a collapse or a match to an issue without opening the round folder.` with these eight lines:

```js
// The outcomes the round lists elsewhere: a finding under Findings (or Carried forward, when it
// carries an earlier round's), an entry under For the person. Every other candidate is set aside,
// by this one rule and not by a list of outcomes, so an outcome the schema adds later is listed too
// (#85; the #85 follow-up spec): the review body lists each in its set-aside block, and the handoff
// the last covered round's, so the person can overrule a drop, a collapse or a match to an issue
// without opening the round folder. A candidate behind a finding under Already tracked is among
// them: accountCoverage accounts for it as `known`, its ref the finding's id and the issue, so the
// finding is listed under Already tracked and its candidate in the block (#86, R5-3).
```

`const LISTED_ELSEWHERE = ['finding', 'forThePerson']` and every other line stay as they are. Every line after the comment moves down by three.

### Proof

No check is added, since no behaviour, prompt or output changes. The gate's loop step stays at `619 checks passed, 0 failed`, and the partly tracked scenario's check that the set-aside block lists the tracked part as `known`, and the nine-candidate scenario's block, stay green.

And:

- `grep -c 'a finding under Findings or Already tracked' workflows/redline-loop.js` prints `0` (was `1`).
- `grep -c 'A candidate behind a finding under Already tracked' workflows/redline-loop.js` prints `1`.
- `grep -cF "const LISTED_ELSEWHERE = ['finding', 'forThePerson']" workflows/redline-loop.js` prints `1`.
- After the commit, `git diff -U0 HEAD~1 HEAD -- workflows/redline-loop.js | grep '^[-+]' | grep -v '^+++' | grep -v '^---' | grep -vc '^[-+]//'` prints `0`: every changed line is a comment line.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `workflows/redline-loop.js`.

**Docs entry:** `workflows/redline-loop.js`, a comment only: `docs/running.md`, "The coverage pass", already says the block lists every candidate that is neither a finding nor a For the person entry, `known` among them, and that a finding the round lists under Already tracked counts as already tracked. No reader-facing change, since no behaviour, prompt or output changes.

**Run caution (#81):** this commit carries `workflows/redline-loop.js`, a comment only, which changes no prompt.

**Commit:** `redline: R5-3 say that a candidate behind an Already tracked finding is set aside as known (#85)`

## Task 5: R5-4, name the finding's id on a duplicate of a candidate that became a finding

`shape.md`, Decision 4 and Unattended answer 7. When a duplicate's target candidate is accounted for as `finding`, the line names the target's place and the word `finding`, but not the finding, which the block does not list and which may be anchored on another line. `into` carries the target entry's ref, which is the finding's id, when its outcome is `finding`, and the line renders it after the outcome. A target of any other outcome gets no id.

This task runs after Task 4, so every `workflows/redline-loop.js` line number below is three more than at `dd42671`; each anchor is also named by its text.

**Files:**

- `tests/loop-test.mjs`: a new scenario, inserted directly before the line `  // coverage off: no candidates, so no set-aside block anywhere.` (line 1630 at `dd42671`).
- `workflows/redline-loop.js`: the `setAsideBlock` comment (lines 882 and 883 at `dd42671`), its `into` renderer (line 891), the set-aside build's comment (line 2145) and the `into` builder (line 2156).
- `docs/running.md`: "The coverage pass" (line 48).

**Change, `tests/loop-test.mjs` (made first, for the red run).** Directly before the line `  // coverage off: no candidates, so no set-aside block anywhere.`, insert the lines below, followed by one blank line. They come after Task 3's last check, ``coverage: a duplicate ref with no space between `candidate` and the number is shown as written, with no addition``, and the blank line after it.

```js
  // A duplicate of a candidate that became a finding (#86, R5-4): the block does not list the
  // finding, which sits under Findings and may be anchored on another line than the candidate, so
  // the duplicate's line names the finding's id after the target's place and outcome. A target of
  // any other outcome gets no id: the refuted and For the person targets above end at the outcome.
  const intoFinding = fenced([cand('app/x.php', 3, 'the real one'), cand('app/x.php', 8, 'the same cause, seen from the save')])
  run = await go('coverage: a duplicate of a candidate that became a finding', covArgs, { reviews: [[f('R1-1', 'correctness')], []], commitIds: [['R1-1']], coverage: [intoFinding, two], coverageOut: [[{ index: 1, outcome: 'finding', ref: 'R1-1' }, { index: 2, outcome: 'duplicate', ref: '1' }], settledAll] })
  const ib = body(run.calls, 'post r1')
  check('coverage: a duplicate of a candidate that became a finding names the finding\'s id after the target\'s place and outcome', ib.includes('\n- `app/x.php:8` · the same cause, seen from the save · duplicate: 1 (candidate 1, `app/x.php:3`: finding R1-1)\n'), ib)
```

The separator `·` is U+00B7. `fenced`, `cand`, `go`, `covArgs`, `body`, `two`, `settledAll` and `f` are the section's and the file's helpers. `intoFinding` and `ib` are new names in section 15. The run's shape (a correctness finding in round 1, then a re-review with `two` and `settledAll`) is the nine-candidate scenario's, so it reaches its handoff, and `go()` adds its run-record check.

**Change, `workflows/redline-loop.js` (green).**

1. The `into` builder, line 2156 at `dd42671`: change

   ```js
           const into = to !== e.index && byIndex.has(to) ? { index: to, file: candidates[to - 1].file, line: candidates[to - 1].line, outcome: byIndex.get(to).outcome } : null
   ```

   to

   ```js
           const into = to !== e.index && byIndex.has(to) ? { index: to, file: candidates[to - 1].file, line: candidates[to - 1].line, outcome: byIndex.get(to).outcome, id: byIndex.get(to).outcome === 'finding' ? byIndex.get(to).ref : '' } : null
   ```

2. The set-aside build's comment, line 2145 at `dd42671`: replace

   ```js
       // hop, so its line shows where it went; any other ref is shown as written (#86, R4-1).
   ```

   with these three lines:

   ```js
       // hop, so its line shows where it went; any other ref is shown as written (#86, R4-1). When
       // that candidate is accounted for as a finding, `into` also carries its ref, the finding's id,
       // since the block does not list the finding (#86, R5-4).
   ```

3. The `into` renderer in `setAsideBlock`, line 891 at `dd42671`: change

   ```js
     const into = (e) => (e.into ? ` (candidate ${e.into.index}, \`${e.into.file}:${e.into.line}\`: ${e.into.outcome})` : '')
   ```

   to

   ```js
     const into = (e) => (e.into ? ` (candidate ${e.into.index}, \`${e.into.file}:${e.into.line}\`: ${e.into.outcome}${e.into.id ? ` ${e.into.id}` : ''})` : '')
   ```

   The id goes through `blockText` with the rest of the line, as the target's place does.
4. The `setAsideBlock` comment, lines 882 and 883 at `dd42671`: replace the two lines

   ```js
   // gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate
   // cannot hide. The label's three groups are the count sentence's, so its count is theirs added up.
   ```

   with these four lines:

   ```js
   // gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate
   // cannot hide, and, when that candidate became a finding, which the block does not list, the
   // finding's id after the outcome (#86, R5-4). The label's three groups are the count sentence's,
   // so its count is theirs added up.
   ```

**Change, `docs/running.md`.**

5. "The coverage pass", line 48: change "that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide (#86, R4-1)." to "that candidate's place and outcome, and the finding's id when that candidate became a finding, so a duplicate of a dropped or tracked candidate cannot hide (#86, R4-1, R5-4)." Nothing else on the line changes.

### Proof

Red first.

1. With the loop-test change made and nothing else, run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-5/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `620 checks passed, 1 failed`. The one `FAIL` line names `coverage: a duplicate of a candidate that became a finding names the finding's id after the target's place and outcome`, and its detail shows the line ending ``(candidate 1, `app/x.php:3`: finding)``. The scenario's run-record check passes. Record the `FAIL` line, and any other, under As built. The gate's git block lists the uncommitted edits at this point; only the loop output is the evidence there.
2. Make steps 1 to 5 and run the gate again.

Green: the gate's loop step passes, `621 checks passed, 0 failed`. Every other harness keeps its count.

And:

- `grep -c "outcome === 'finding' ? byIndex.get(to).ref : ''" workflows/redline-loop.js` prints `1`.
- `grep -c 'e.into.id ?' workflows/redline-loop.js` prints `1`.
- `grep -c 'finding R1-1)' tests/loop-test.mjs` prints `1` (was `0`).
- `grep -c "and the finding's id when that candidate became a finding" docs/running.md` prints `1`.
- Neighbours, unchanged and green:
  - the nine-candidate scenario's pinned block, whose duplicates end ``(candidate 3, `app/z.php:5`: refuted)`` and ``(candidate 2, `app/y.php:9`: forThePerson)`` with no id, and whose `duplicate: R1-1` is as written;
  - the duplicate-forms scenario's checks, whose targets are a refuted candidate;
  - `coverage: no set-aside line opens with a finding id, so prior-findings never reads one back`;
  - the result check, which finds no `setAsideCandidates` field on a round of the result and only `index`, `outcome` and `ref` on each accounting entry, so `into` stays on the round record;
  - every pre-existing scenario under `coverage off`, which has no set-aside block, so a coverage-off prompt is byte-identical (`workflow/replay`, line 15).
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `docs/running.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.

**Docs entry:** `docs/running.md`, "The coverage pass", updated in this task's commit for the change to `workflows/redline-loop.js`. The README's "What a clean run means" describes the block by outcome and ref only, so it needs no change. `tests/loop-test.mjs` is not in a Docs-step directory. There is no template, config key, subcommand, allow rule or exit code.

**Version:** none (`shape.md`, Decision 5). Nothing a setup rerun writes changes.

**Run caution (#81):** this commit carries `workflows/redline-loop.js` (`shape.md`, Context). The round's findings file holds the accounting and the candidate list, not `into` (`workflows/redline-loop.js:2235`), and a target of any outcome but `finding` renders as before, so a post prompt changes only where a duplicate names a candidate accounted for as `finding`.

**Commit:** `redline: R5-4 name the finding's id on a duplicate of a candidate that became a finding (#85)`, staging the three files above by name.

## Task 6: Verification Gate

**Files:**

- `agent-os/specs/2026-11-11-1952-86-review-round-5/plan.md` and `agent-os/specs/2026-11-11-1952-86-review-round-5/shape.md` (step 13).
- `agent-os/standards/testing/tests.md` (step 12, items 1 and 2: lines 10 and 22) and `agent-os/standards/workflow/agents.md` (step 12, items 3 and 4: line 37). Only the items the standards approver approves.

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-11-1952-86-review-round-5/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: `loop` at `621 checks passed, 0 failed` after Task 5 (617 after Task 2, 619 after Tasks 3 and 4). Every other harness is expected at its count before the round, since no file one reads changes.
2. **Step 10, Docs:** each task's Docs entry names its section or its reason, and is confirmed against that task's commit. Tasks 2 and 3 have none, since each commit is a test file only. Task 4's entry is `docs/running.md`, "The coverage pass", with "no reader-facing change" (a comment only). Task 5's entry is `docs/running.md`, "The coverage pass", in Task 5's commit. There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the patch version from `0.2.1` on `main`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 5). The setup test's last cases prove the two agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved. They go in one commit of their own after the finding commits: `redline: record the round 5 review lessons in the standards (#85)`.
   - Keep every heading: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`.
   - `git diff --name-only HEAD~1 HEAD` lists only the standards files the approved items touch.
   - If nothing is approved, make no commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Tasks 2, 3 and 5's red lines;
   - the proof outputs;
   - the gate's counts;
   - which retrospective items the approver approved, declined or deferred.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #86 round 5 as built (#85)`
