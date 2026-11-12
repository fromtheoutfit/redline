# PR #89 review round 3: name the inline link's cost, pin the rule branch's title, and the backslash trigger

Spec folder: `agent-os/specs/2026-11-12-1337-89-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #89 (issue #87), from the round's three findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). All three are nits. The round has no correctness finding, so this is the final nit round, and the plan covers the nits only.

- **R3-1** (nit): `fix`, Task 2. README Known limits and `docs/running.md` name the inline link whose destination holds `@x` beside the bare URL.
- **R3-2** (nit): `fix`, Task 3. Section 12 of the loop test pins the Deferred line of a finding a repository rule leaves to the person, with a title `postedText` changes.
- **R3-3** (nit, needs a decision): `ask`, decided by the person, Task 4. The whole-text trigger narrows from any backslash to a backslash before a backtick, and README Known limits and `docs/running.md` say so.

There is no `defer`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, and files staged by name. Line numbers are at `0e4a537`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also named by its text. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, so it reads exactly as the file does. No commit subject holds a bare `@word`, since the handoff posts commit subjects as written.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1337-89-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts:

- **Loop test.** `676 checks passed, 0 failed` before this round. That is the #87 follow-up spec's As built gate table (`agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/plan.md`, lines 299 to 305), at `0e4a537`, the working tree's HEAD. Task 2 adds no check. Task 3 adds two: its own check, and the run-record check `go()` adds for a run that reaches its handoff (`tests/loop-test.mjs:246-250`). Task 4 adds two more: a check for case 6 in section 15, and one round-trip mode in section 16, whose `forEach` adds one check per mode. So the round ends at `680 checks passed, 0 failed`.
- **Every other harness** keeps its count: guard 592, prefs 101, gate 117, setup 468, gh 121 and background 39 (the same table). No file one reads changes.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description.** "For the reviewer", "Gate:" says "The loop test passes 676 checks with 0 failed". After this round it is 680. "Known costs" names the bare URL and not the inline link that Task 2 adds. Its trigger list ("unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash, a carriage return or a newline") reads "a backslash before a backtick" after Task 4. The round writes no `pr-body.md`, as round 1 wrote none. The author can correct all three by hand.
- **Run caution (#81).** Tasks 2 and 3 commit `README.md`, `docs/running.md` and `tests/loop-test.mjs` only. Task 3 edits `workflows/redline-loop.js` for its red run and restores it before its commit. Task 4, the person's decision on R3-3, commits `workflows/redline-loop.js`, so a relaunch after Task 4's commit replays a round-edited workflow. No task touches `agents/`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-12-1337-89-review-round-3/plan.md`
- `agent-os/specs/2026-11-12-1337-89-review-round-3/shape.md`
- `agent-os/specs/2026-11-12-1337-89-review-round-3/standards.md`
- `agent-os/specs/2026-11-12-1337-89-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #89 (#87)`

## Task 2: R3-1, name the inline link whose destination holds an `@` among the costs of neutralised text

`shape.md`, Decision 1 and Unattended answer 1. Any text holding `](` is escaped whole (`textParts`, `workflows/redline-loop.js:965`), so an `@` before a letter or digit in a link destination gets `&#8288;`. GitHub decodes it there: the #87 follow-up spec's Evidence (`agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/shape.md:96`) records `[a](https://x.com/@&#8288;click)` rendering with the href `https://x.com/@%E2%81%A0click`. The link text reads as written, so the link looks right and leads elsewhere. README Known limits and `docs/running.md` name only the bare URL. A docs-only change.

**Files:**

- `README.md`: Known limits, the bullet "A finding's description, its proposed fix and Redline's replies are posted as written", its costs list. One line inserted after line 106.
- `docs/running.md`: "How the review is posted", the bullet "What is escaped and neutralised (#87)", line 137. One sentence inserted.

**Change, `README.md`.** After line 106, which reads exactly:

```
  - an email address holding `@x` keeps its text but loses its link, and a bare URL holding `@x` shows `&#8288;` after the `@` and its link breaks, though an `@` inside an autolink is never a mention;
```

insert this line:

```
  - an inline link whose destination holds `@x` keeps its text, but its href gets the joiner after the `@` (`%E2%81%A0`), so the link looks right and leads to another page, though an `@` in a link destination is never a mention (#89, R3-1);
```

Line 106 and the line after it (the code-span cost line, which ends the list with a full stop) stay as they are.

**Change, `docs/running.md`.** In line 137, replace the text

```
A bare URL holding `@x` shows `&#8288;` too, and its link breaks, though an `@` inside an autolink is never a mention. Fields that share a line are read as one text.
```

with

```
A bare URL holding `@x` shows `&#8288;` too, and its link breaks, though an `@` inside an autolink is never a mention. An inline link whose destination holds `@x` keeps its text, but its href gets the joiner after the `@` (`%E2%81%A0`), so the link looks right and leads to another page. Fields that share a line are read as one text.
```

The rest of line 137 stays as it is.

### Proof

No harness reads either file (`shape.md`, Proportionality), so there is no red run, and every count stays as it was before the task. And:

- `grep -c 'an inline link whose destination holds' README.md` prints `1` (was `0`).
- `grep -c 'An inline link whose destination holds' docs/running.md` prints `1` (was `0`).
- `grep -c 'E2%81%A0' README.md` prints `1`, and `grep -c 'E2%81%A0' docs/running.md` prints `1` (both were `0`).
- `grep -c 'bare URL holding' README.md docs/running.md` prints `README.md:1` and `docs/running.md:1`: the neighbouring sentences stay.
- After the commit, `git diff --stat HEAD~1 HEAD` shows `2 files changed, 2 insertions(+), 1 deletion(-)`.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `README.md` and `docs/running.md`.

**Docs entry:** this task is itself the README and `docs/` change. It touches no file under a directory gate step 10 lists, and it adds no config key, subcommand, allow rule or exit code.

**Commit:** `redline: R3-1 name the inline link's broken href among the costs of neutralised text (#87)`

## Task 3: R3-2, pin an escaped title on the Deferred line a repository rule leaves to the person

`shape.md`, Decision 2 and Unattended answers 2, 3 and 7. The handoff's Deferred line has two branches, each with its own `postedText(d.title)`: `workflows/redline-loop.js:2967` for a finding autopilot leaves under a repository rule, and line 2968 for a mitigation. Section 16 pins only line 2968 (`tests/loop-test.mjs:1751`). The one check on line 2967 (`tests/loop-test.mjs:1045`) uses `title R1-2` and `title R1-3`, which `postedText` returns unchanged, so a revert there stays green. Section 12 gains one autopilot run with a tagged title, and one check pinning its Deferred line as the workflow writes it. A test-only commit.

**Files:**

- `tests/loop-test.mjs`: section 12, five lines inserted after line 1046.
- `workflows/redline-loop.js`: line 2967. It changes **temporarily**, for the red run below, and is restored byte for byte before the commit. The commit carries `tests/loop-test.mjs` only.

**Change, `tests/loop-test.mjs`.** After line 1046, the only line that begins

```js
  check('rules: the deferred list carries the rule and no mitigation',
```

and before the blank line and the comment `// The paths rule also catches a finding elsewhere whose task would write under it.`, insert these five lines:

```js
  // Posted text (#87): the Deferred line of a finding autopilot leaves under a rule makes its own
  // postedText call, beside the shipped branch section 16 pins, so it is pinned with a title the
  // function changes: a plain title reads the same with or without the call (#89, R3-2).
  const autoTitled = await go('rules: autopilot, a title with a tag and an @', { ...ruleArgs, interrupt: 'autopilot' }, { ...scenario, reviews: [[three[0], { ...three[1], title: 'Field <b> renamed @config' }, three[2]], []] })
  check('posted text: a Deferred line a rule left to the person escapes and neutralises its title', comment(autoTitled.calls, 'handoff comment').includes(`### Deferred (mitigated now, full fix left open)\n\n- **R1-2** Field &lt;b> renamed @${WJ}config: left to you under repository rule craft-config; open: By hand: fix R1-2 this way.\n`), comment(autoTitled.calls, 'handoff comment'))
```

The run is the autopilot run at line 1039 with R1-2's title changed, in the same way the guided `titled` run at line 1036 changes it. R1-2 stays under the paths rule `craft-config` by its file, so it is still forced and left to the person. `By hand: fix R1-2 this way.` is the forced recommendation the run at line 1039 already pins (line 1045). `WJ` is the constant at line 42. Every other line of the file stays as it is; the lines after the insertion move down by five.

### Proof

Red first, by mutation, since the code already holds the behaviour. With the five lines added:

1. Mutate `workflows/redline-loop.js` with Edit. Line 2967,

   ```js
         ? `- **${d.id}** ${postedText(d.title)}: left to you under repository rule ${d.rule}; open: ${d.fullFix}`
   ```

   becomes

   ```js
         ? `- **${d.id}** ${d.title}: left to you under repository rule ${d.rule}; open: ${d.fullFix}`
   ```

2. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1337-89-review-round-3/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `677 checks passed, 1 failed`. The one `FAIL` line names `posted text: a Deferred line a rule left to the person escapes and neutralises its title`, and its detail holds `- **R1-2** Field <b> renamed @config: left to you under repository rule craft-config`. No other line moves: the run at line 1039 pins plain titles, which read the same under the mutation, and section 16's Deferred check is on line 2968, which is untouched. Record the `FAIL` line, and any other, under As built. The gate's git block also lists the uncommitted edits at this point; only the loop output is the evidence here.
3. Restore line 2967 with Edit, byte for byte, to its text in step 1. `git diff --stat -- workflows/redline-loop.js` then prints nothing.

Green: the gate's loop step passes, `678 checks passed, 0 failed`.

And:

- `grep -c 'autoTitled' tests/loop-test.mjs` prints `2` (was `0`).
- `grep -c 'Field <b> renamed @config' tests/loop-test.mjs` prints `2` (was `1`).
- `grep -c 'Field &lt;b> renamed' tests/loop-test.mjs` prints `2` (was `1`).
- `grep -c 'a Deferred line a rule left to the person escapes and neutralises its title' tests/loop-test.mjs` prints `1`.
- `grep -c 'postedText(d.title)}: left to you under repository rule' workflows/redline-loop.js` prints `1`, and `grep -c '{d.title}: left to you under repository rule' workflows/redline-loop.js` prints `0`, so the mutation is gone.
- Neighbours, unchanged and green: `rules: autopilot lists it under Deferred with no mitigation and under Left to you` (line 1045), and section 16's `posted text: the handoff's Deferred line escapes the title and posts the shaper's mitigation as written`.
- After the commit, `git diff --stat HEAD~1 HEAD` shows `tests/loop-test.mjs` with 5 insertions and no deletion.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** `tests/loop-test.mjs` is not in a directory gate step 10 lists. `workflows/redline-loop.js` ends the task unchanged, so it needs no entry. `docs/running.md:127` already lists the Deferred line as escaped, which this check now proves on both branches.

**Run caution (#81):** this commit carries `tests/loop-test.mjs` only.

**Commit:** `redline: R3-2 pin an escaped title on the Deferred line a repository rule leaves to the person (#87)`

## Task 4: R3-3, narrow the whole-text trigger to a backslash before a backtick

`shape.md`, Decision 3, decided by the person: **Full fix: narrow to a backslash before a backtick.** `textParts` (`workflows/redline-loop.js:965`) escapes a text whole when it holds any backslash, code spans included. So a title such as ``App\Models\User::save drops `<x-slot>` when `$a && $b` `` posts `&lt;x-slot>` and `$a &amp;&amp; $b` inside its spans, and a span holding `@csrf` shows `@&#8288;csrf`. The trigger becomes a backslash directly before a backtick, as on the base (`git show main:workflows/redline-loop.js`, line 917); the carriage return, newline, `](`, `][`, `://` and `www.` triggers stay.

The renderer check `testing/tests` line 10 asks for is the person's, recorded in Decision 3: nine texts through `gh api markdown`, gfm, on 2026-11-12, against a scratch copy of `postedText` narrowed this way. No other backslash changed which backticks GitHub paired, and no raw tag or mention came through. The one cosmetic case left goes in README Known limits: a backslash typed before `<` or `&` outside code shows the entity text (`\<b>` reads `&lt;b>`). `readBack` needs no change. Escaping adds no backslash or backtick and moves none, so a posted text still splits as the raw one did. The new round-trip mode proves it.

**Files:**

- `workflows/redline-loop.js`: `textParts`'s docblock, lines 961 to 963, and its trigger, line 965.
- `tests/loop-test.mjs`:
  - section 15's comment, lines 1595 to 1598;
  - case 14, line 1616, and its expected line, line 1645;
  - the check at line 1662, renamed, with a check for case 6 inserted before it;
  - section 16's `modes` array, one entry inserted after line 1805.

  These are line numbers at `0e4a537`. Task 3's five lines, inserted after line 1046, move each of them down by five (1600 to 1603, 1621, 1650, 1667 and 1810). Each anchor is also given by its text below.
- `docs/running.md`: "How the review is posted", the bullet "What is escaped and neutralised (#87)", line 137. One sentence is changed in the trigger list, and one is inserted after "A summary with a newline is one such text."
- `README.md`: Known limits, the costs list under "A finding's description, its proposed fix and Redline's replies are posted as written". The code-span cost line (line 107 at `0e4a537`, line 108 after Task 2) becomes two lines.

**Change, `tests/loop-test.mjs` (first, for the red run).**

1. Section 15's comment. Replace these four lines:

   ```js
     // code span reads as written. A text holding `](`, `][`, `://`, `www.` (any case), a backslash, a
     // carriage return or a newline is escaped whole, spans included: there GitHub reads a backtick as
     // part of a link or an autolink before it pairs spans (the #87 spec's Evidence). `[` alone is no
     // trigger, so code talk with brackets keeps its spans. An `&` inside a span is left as written,
   ```

   with these five:

   ```js
     // code span reads as written. A text holding `](`, `][`, `://`, `www.` (any case), a backslash
     // before a backtick, a carriage return or a newline is escaped whole, spans included: there GitHub
     // reads a backtick as part of a link or an autolink, or as escaped, before it pairs spans (the #87
     // spec's Evidence). `[` alone is no trigger, nor is a backslash elsewhere, so code talk with
     // brackets or a namespace keeps its spans (#89, R3-3). An `&` inside a span is left as written,
   ```

   The next line (`// beside one outside it that is escaped (#86, R5-1). ...`) stays as it is.
2. Case 14. Replace

   ```js
       cand('app/n.vue', 14, 'a \\<b> and \\& c'),
   ```

   with

   ```js
       cand('app/n.vue', 14, 'App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\<b> and \\& c'),
   ```
3. Its expected line in `escapedLines`. Replace

   ```js
       '- `app/n.vue:14` · a \\&lt;b> and \\&amp; c · outside: untouched code',
   ```

   with

   ```js
       '- `app/n.vue:14` · App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\&lt;b> and \\&amp; c · outside: untouched code',
   ```
4. The backslash check. Replace

   ```js
     check('posted text: a backslash escapes the whole text, so a backslash before < shows the entity', blockLine(14), eb)
   ```

   with these two lines:

   ```js
     check('posted text: a backslash before a backtick escapes the whole text', blockLine(6), eb)
     check('posted text: a backslash not before a backtick is no trigger, so a namespaced text keeps its spans as written', blockLine(14), eb)
   ```

   The carriage-return check before it and the `@` inside a span check after it stay as they are.
5. Section 16's `modes` array. After its last entry, the line

   ```js
       'a typed @&amp;#8288;x stays as typed',
   ```

   and before the closing `]`, insert

   ```js
       'App\\Models\\User::save drops `<x-slot>` and `@csrf` when `$a && $b`, beside a \\&lt;b> and \\&amp; c',
   ```

   That is case 14 as the workflow posts it after this task, so it becomes round trip 12 (`R1-12`). The existing modes keep their numbers.

**Change, `workflows/redline-loop.js` (after the red run).**

1. The trigger, line 965. Replace

   ```js
     if (/\]\(|\]\[|:\/\/|www\.|[\r\n\\]/i.test(text)) {
   ```

   with

   ```js
     if (/\]\(|\]\[|:\/\/|www\.|[\r\n]|\\`/i.test(text)) {
   ```
2. The docblock, lines 961 to 963. Replace

   ```js
   // bare autolink (`://` or `www.`, any case: the link takes the backtick), a backslash, a carriage
   // return or a newline. A span in such a text then shows `&lt;` for a `<`. Each trigger, and each
   // construct that needs none, was checked against GitHub's renderer (the spec's Evidence).
   ```

   with

   ```js
   // bare autolink (`://` or `www.`, any case: the link takes the backtick), a backslash before a
   // backtick (it can escape the backtick, so the pairing turns on more than run lengths), a carriage
   // return or a newline. A span in such a text then shows `&lt;` for a `<`. A backslash anywhere
   // else changes no pairing, so a namespaced text (`App\Models\User`) keeps its spans (#89, R3-3).
   // Each trigger, and each construct that needs none, was checked against GitHub's renderer (the
   // spec's Evidence; for the narrowed backslash, the #89 round 3 spec's Decision 3).
   ```

   The docblock's earlier lines (from "A text cut into its code spans") stay as they are.

**Change, `docs/running.md`.** In line 137, replace the text

```
The exception is a text that holds `](`, `][`, `://`, `www.` (any case), a backslash, a carriage return or a newline. There GitHub can read a backtick as part of a link before it pairs spans, so the whole text is escaped, spans included, and a span holding `<`, `&` or `@x` then shows the entity (`&lt;`, `&amp;`, `@&#8288;x`). A summary with a newline is one such text.
```

with

```
The exception is a text that holds `](`, `][`, `://`, `www.` (any case), a backslash before a backtick, a carriage return or a newline. There GitHub can read a backtick as part of a link, or as escaped, before it pairs spans, so the whole text is escaped, spans included, and a span holding `<`, `&` or `@x` then shows the entity (`&lt;`, `&amp;`, `@&#8288;x`). A summary with a newline is one such text. A backslash anywhere else, as in a namespace (`App\Models\User`), changes no pairing, so that text keeps its spans as written; outside a span, a backslash typed before `<` or `&` shows the entity text (`\<b>` reads `&lt;b>`).
```

The rest of line 137, Task 2's inline-link sentence included, stays as it is.

**Change, `README.md`.** Replace the code-span cost line, which ends the costs list and reads exactly

```
  - in a text escaped whole, a code span holding `<`, `&` or `@x`, or a backslash before `<` or `&`, shows the entity (`&lt;`, `&amp;`, `@&#8288;x`).
```

with these two lines:

```
  - in a text escaped whole (one holding `](`, `][`, `://`, `www.` in any case, a backslash before a backtick, a carriage return or a newline), a code span holding `<`, `&` or `@x` shows the entity (`&lt;`, `&amp;`, `@&#8288;x`); a backslash anywhere else, as in a namespace (`App\Models\User`), triggers nothing, so that text keeps its spans as written (#89, R3-3);
  - a backslash typed before `<` or `&` outside code shows the entity text, in any text (`\<b>` reads `&lt;b>`).
```

Task 2's inline-link line before it stays as it is. The list still ends with a full stop.

### Proof

Red first. With the five test changes in place and `workflows/redline-loop.js` as at `0e4a537`:

1. Run the gate: `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1337-89-review-round-3/redline/snapshot.json`. Its `loop` check exits 1, and its output reads `677 checks passed, 3 failed`. The three `FAIL` lines name:
   - `coverage: the set-aside block escapes & and < and neutralises @ outside code spans, leaves a span as written, and stays one collapsed block, in the review body and the handoff`;
   - `posted text: a backslash not before a backtick is no trigger, so a namespaced text keeps its spans as written`. Its detail, the review body, holds line 14 with `&lt;x-slot>`, `@&#8288;csrf` and `$a &amp;&amp; $b` inside the spans;
   - `posted text: round trip 12, a posted title read back and posted again is unchanged`.

   The new case 6 check passes, since today's trigger also escapes that text whole. Record every `FAIL` line under As built.
2. Make the two changes to `workflows/redline-loop.js` with Edit. Run the gate again: `680 checks passed, 0 failed`.
3. Red for the case 6 check, by mutation, since it pins a trigger the code keeps. Change the trigger at line 965 for one gate run to the narrowed one with its last alternative removed:

   ```js
     if (/\]\(|\]\[|:\/\/|www\.|[\r\n]/i.test(text)) {
   ```

   Run the gate. Its output reads `678 checks passed, 2 failed`, and the two `FAIL` lines are the set-aside block check above and `posted text: a backslash before a backtick escapes the whole text`. Round trip 6 stays green, since a text that pairs its backticks that way reads back the same. Record the `FAIL` lines under As built.
4. Restore line 965 with Edit, byte for byte, to the narrowed trigger in step 2. Run the gate: `680 checks passed, 0 failed`.

And:

- `grep -c -F '[\r\n\\]' workflows/redline-loop.js` prints `0` (was `1`), and `grep -c -F '[\r\n]|' workflows/redline-loop.js` prints `1` (was `0`).
- `grep -c -F 'App\Models\User' workflows/redline-loop.js README.md docs/running.md` prints `1` for each file (each was `0`).
- `grep -c -F 'App\\Models\\User' tests/loop-test.mjs` prints `3` (was `0`): case 14, its expected line and round trip 12.
- `grep -c -F 'blockLine(6)' tests/loop-test.mjs` prints `1` (was `0`), and `grep -c -F 'a backslash escapes the whole text' tests/loop-test.mjs` prints `0` (was `1`).
- `grep -c 'a backslash before a backtick' README.md docs/running.md` prints `README.md:1` and `docs/running.md:1` (both were `0`).
- `grep -c -F 'shows the entity text' README.md docs/running.md` prints `README.md:1` and `docs/running.md:1` (both were `0`).
- `grep -c -F 'or a backslash before' README.md` prints `0` (was `1`), and `grep -c -F '(any case), a backslash, a carriage' docs/running.md` prints `0` (was `1`).
- Neighbours, unchanged and green: `posted text: a carriage return escapes the whole text and neutralises its @`, `posted text: in a text escaped whole, an @ inside a span gets the joiner's reference too` (case 15 still holds `](`), and `posted text: round trip 6, a posted title read back and posted again is unchanged`.
- After the commit, `git diff --stat HEAD~1 HEAD` shows `4 files changed, 20 insertions(+), 13 deletions(-)`. Record any difference under As built.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `README.md`, `docs/running.md`, `tests/loop-test.mjs` and `workflows/redline-loop.js`.

**Docs entry:** `workflows/redline-loop.js`: `docs/running.md`, "How the review is posted", the bullet "What is escaped and neutralised (#87)", and README Known limits, the costs list under "A finding's description, its proposed fix and Redline's replies are posted as written". Both are updated in this task's commit. `tests/loop-test.mjs` is not in a directory gate step 10 lists. No config key, subcommand, allow rule or exit code is added.

**Run caution (#81):** this commit carries `workflows/redline-loop.js`, the cost the person's chosen option named. A relaunch after it replays a round-edited workflow.

**Commit:** `redline: R3-3 narrow the whole-text trigger to a backslash before a backtick (#87)`

## Task 5: Verification Gate

**Files:**

- `agent-os/specs/2026-11-12-1337-89-review-round-3/plan.md` and `agent-os/specs/2026-11-12-1337-89-review-round-3/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only those the standards approver approves from `shape.md`'s "Standards retrospective (proposed)":
  - `agent-os/standards/testing/tests.md` (items 1 and 3);
  - `agent-os/standards/process/docs-gate.md` (item 2);
  - `agent-os/standards/workflow/agents.md` (item 3).

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1337-89-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: `loop` at `680 checks passed, 0 failed`; every other harness at its count before the round, since no file one reads changes (none reads `workflows/redline-loop.js`, `README.md` or `docs/running.md` for its checks).
2. **Step 10, Docs:**
   - Task 2 is itself the README and `docs/` change.
   - Task 3 commits only `tests/loop-test.mjs`, which is in no Docs-step directory. `workflows/redline-loop.js` ends that task unchanged.
   - Task 4 commits `workflows/redline-loop.js`. Its entry is `docs/running.md`, "How the review is posted", the bullet "What is escaped and neutralised (#87)", and README Known limits, both updated in Task 4's commit, which the entry names.
   - There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.3` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.2`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 4). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", item 3 as drafted there after the decision.
   - If the approver approves none, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it approves an edit, the edits go in one commit of their own after the finding commits: `redline: record the round 3 review lessons in the standards (#87)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Task 2's, Task 3's and Task 4's proof outputs, every `FAIL` line of Task 3's and Task 4's red runs included;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #89 round 3 as built (#87)`
