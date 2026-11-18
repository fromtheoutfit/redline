# PR #103 review round 3: what the skill says shipped, and one reader of a decided finding's task

Spec folder: `agent-os/specs/2026-11-17-1643-103-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #103 (issue #100), from the round's seven findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `fix`, one task each, in finding order: R3-1 (Task 2), R3-2 (Task 3), R3-3 (Task 4), R3-5 (Task 5), R3-6 (Task 6).
- `defer`, no task: R3-4, which ships nothing now. Its drafted issue is under `## Deferred` in `shape.md`.
- `decline`, no task: R3-7. Its reason is under `## Declined` in `shape.md`.
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#100)`. No commit subject holds a bare `@word`.

Line numbers are at `96f014f`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text or any file under `agents/`. The version stays `0.4.1` (`shape.md`, Scope). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**Task order matters in three files.**

- `skills/redline/SKILL.md`:
  - Task 2 changes the plan dial's field list (line 184).
  - Task 3 changes the drafts rule (line 220).
  - Task 4 changes that same sentence again, as Task 3 leaves it, and the `done` section (line 264).

  No task adds or removes a line of this file.
- `workflows/redline-loop.js`:
  - Task 5 rewraps the comment above `draftView` (3403-3406, still four lines) and the one above `isDeferral` (3811-3818, eight lines that become ten).
  - Task 6 changes the `plannedTask` and `plannedFiles` block (3800-3809), above the comment Task 5 rewraps, and one line of `isDeferral` (3831 at `96f014f`, 3833 after Task 5).
- `tests/loop-test.mjs`:
  - Task 2 adds a phrase to the defer section's statement loop (line 2836).
  - Tasks 2 to 6 each add checks, in that order, right after the check named `defer: plannedFiles reads the shaper's own list through shaperFiles alone, with no second test of it` (line 2851).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task adds its check first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-3/redline/snapshot.json`, which prints the failing check names. Gate runs may be slow, as they were partway through round 2 (its `shape.md`, Decision 13). If so, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round, the loop prints `1378 checks passed, 0 failed` (round 2's As built), and the other harnesses print what the baseline prints. This round adds six loop checks and no run, so no run-record check:

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 2 | a skill phrase in the statement loop, and a check that the old parenthetical is gone |
| Task 3 | 1 | |
| Task 4 | 1 | |
| Task 5 | 1 | |
| Task 6 | 1 | |

So the loop reads `1384 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-3/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-3/shape.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-3/standards.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-3/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 3 spec for PR #103 (#100)`

## Task 2: R3-1, say in the plan dial's field list that deferredPlanned holds the shaper's words as written

`shape.md`, Decision 2 and Unattended answer 3.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. In the defer section's statement loop, the entry for the skill's plan dial (line 2836):

   ```js
       ['the skill\'s plan dial', read('skills', 'redline', 'SKILL.md'), ['`files` (the paths its task touches, empty when it has no task;', 'for an ask, the paths its recommended change would touch; for a defer']],
   ```

   becomes:

   ```js
       ['the skill\'s plan dial', read('skills', 'redline', 'SKILL.md'), ['`files` (the paths its task touches, empty when it has no task;', 'for an ask, the paths its recommended change would touch; for a defer', 'holds each defer\'s mitigation as the shaper wrote it']],
   ```

2. Right after the check named `defer: plannedFiles reads the shaper's own list through shaperFiles alone, with no second test of it` (line 2851), add:

   ```js
     check('defer: the skill\'s plan dial no longer reads an empty mitigation in deferredPlanned as nothing shipping', !read('skills', 'redline', 'SKILL.md').includes('holds each defer\'s mitigation (empty when nothing ships now)'))
   ```

The red run: both checks fail.

**Change.** In `skills/redline/SKILL.md`, the plan dial's field list (line 184), the text

```
`deferredPlanned` holds each defer's mitigation (empty when nothing ships now) and its drafted issue
```

becomes

```
`deferredPlanned` holds each defer's mitigation as the shaper wrote it, possibly empty, which never says whether one ships (the entry's `files` in `plan` say whether a mitigation is planned), and its drafted issue
```

This is one line in the file. The rest of the sentence after "its drafted issue" stays as it is.

**Proof:** the gate is green with both checks passing, and the plan dial's other two phrases (line 2836) pass unchanged. `grep -c 'empty when nothing ships now' skills/redline/SKILL.md` prints `0`.

**Docs entry:** `skills/redline/SKILL.md`: no README or `docs/` change. `docs/running.md`, "Deferred items", Whether a mitigation shipped, already says that the plan dial's list shows the shaper's words as written beside the files it listed and that the files say whether a task is planned; this brings the skill's field list into line with it.

**Commit:** `redline: R3-1 say in the plan dial's field list that deferredPlanned holds the shaper's words as written (#100)`

## Task 3: R3-2, call a mitigation with empty words a change in its own commit at the end-of-run stop

`shape.md`, Decision 3 and Unattended answer 4.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after Task 2's check (named `defer: the skill's plan dial no longer reads an empty mitigation in deferredPlanned as nothing shipping`), add:

```js
  check('defer: the skill\'s draft stop calls a mitigation with empty words a planned change only at a round\'s stop, and a change in its own commit at the end-of-run stop', read('skills', 'redline', 'SKILL.md').includes('"a change in its own commit" at the end-of-run stop') && !read('skills', 'redline', 'SKILL.md').includes('or "a planned change" when the words are empty'))
```

The red run: the check fails.

**Change.** In `skills/redline/SKILL.md`, the drafts rule, "Three drafts or fewer: one at a time" (line 220), the text

```
(true: the mitigation as written, or "a planned change" when the words are empty, with the files it touches; false: nothing ships)
```

becomes

```
(true: the mitigation as written, or, when the words are empty, "a planned change" at a round's stop and "a change in its own commit" at the end-of-run stop, where the record is the commit, with the files it touches; false: nothing ships)
```

**Proof:** the gate is green with the new check passing and Task 2's checks passing unchanged.

**Docs entry:** `skills/redline/SKILL.md`: no README or `docs/` change. `docs/running.md`, "Deferred items", Whether a mitigation shipped, already says that the record is the plan before the build and the commit after it; this is the session's spoken wording of the same record.

**Commit:** `redline: R3-2 call a mitigation with empty words a change in its own commit at the end-of-run stop (#100)`

## Task 4: R3-3, state what shipped from ships first and the words after it, in the draft stop and the closing summary

`shape.md`, Decision 4 and Unattended answer 4.

**Files:**

- `skills/redline/SKILL.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, right after Task 3's check, add:

```js
  // What shipped is stated from `ships` first, and the words follow it labelled as its words
  // (#103, R3-3): they are not checked and can say that nothing ships, so the draft stop and the
  // closing summary never print them alone as what shipped.
  check('defer: the skill\'s draft stop and closing summary state what shipped from ships first and the words after it, labelled as its words', read('skills', 'redline', 'SKILL.md').split('then the words as written, labelled as its words, when they are not empty').length === 3 && !read('skills', 'redline', 'SKILL.md').includes('true: the mitigation as written'), [read('skills', 'redline', 'SKILL.md').split('then the words as written, labelled as its words, when they are not empty').length - 1, read('skills', 'redline', 'SKILL.md').includes('true: the mitigation as written')])
```

The red run: the check fails, with `[0, true]`.

**Change.** In `skills/redline/SKILL.md`:

1. The drafts rule (line 220), the text as Task 3 left it:

   ```
   (true: the mitigation as written, or, when the words are empty, "a planned change" at a round's stop and "a change in its own commit" at the end-of-run stop, where the record is the commit, with the files it touches; false: nothing ships)
   ```

   becomes

   ```
   (true: "a planned change" at a round's stop, or "a change in its own commit" at the end-of-run stop, where the record is the commit, with the files it touches, then the words as written, labelled as its words, when they are not empty, since they are not checked and can say that nothing ships, as in `a planned change in app/Jobs/SyncOrders.php (its words: "none")`; false: nothing ships)
   ```

2. The `done` section (line 264), the text

   ```
   (true: the mitigation as written, or "a change in its own commit" when the words are empty; false: nothing)
   ```

   becomes

   ```
   (true: "a change in its own commit", then the words as written, labelled as its words, when they are not empty, since they are not checked and can say that nothing ships, as in `a change in its own commit (its words: "a log line")`; false: nothing)
   ```

   The words before it on that line, from "and what shipped, from" on, stay as they are. The `capped` section (line 268) says "as that section says" and is not changed.

**Proof:** the gate is green with the new check passing, and these pass unchanged:

- Task 3's check: its phrase, the end-of-run wording, is kept in the new sentence at line 220.
- Task 2's checks.
- The statement loop's two phrases for the skill's closing summary (line 2837).

`grep -c 'true: the mitigation as written' skills/redline/SKILL.md` prints `0`.

**Docs entry:** `skills/redline/SKILL.md`: no README or `docs/` change. `docs/running.md`, "Deferred items", Whether a mitigation shipped, already says that what shipped is read from the record and never from the words; the skill now prints it that way.

**Commit:** `redline: R3-3 state what shipped from ships first and the words after it, in the draft stop and the closing summary (#100)`

## Task 5: R3-5, rewrap the comments above draftView and isDeferral at the file's width

`shape.md`, Decision 5.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 4's check, add:

```js
  // The comments this pull request added above draftView and isDeferral wrap at the file's width
  // (#103, R3-5). An anchor that is absent reads as one over-long line, so the check fails and
  // does not throw.
  const commentLines = (start, end) => {
    const a = src.indexOf(start)
    const b = a < 0 ? -1 : src.indexOf(end, a)
    return a < 0 || b < 0 ? ['x'.repeat(101)] : src.slice(a, b).split('\n')
  }
  const wrapped = [commentLines('// A draft as a stop shows it to the person', 'function draftView('), commentLines('  // The round\'s deferrals as they stand', '  const isDeferral = ')]
  check('defer: the comments above draftView and isDeferral wrap at 100 columns', wrapped.every((lines) => lines.every((line) => line.length <= 100)), wrapped.map((lines) => Math.max(...lines.map((line) => line.length))))
```

`commentLines` and `wrapped` are names the test file does not use yet. Each anchor appears once in `workflows/redline-loop.js`. The red run: the check fails, with `[146, 181]`.

**Change.** In `workflows/redline-loop.js`, no word changes; only the line breaks move.

1. The comment above `draftView` (lines 3403-3406):

   ```js
   // A draft as a stop shows it to the person (#95): the finding, what ships in the round (`ships`,
   // with the words and the planned files), where the draft goes, the title and body as they will be filed, and its version, which the answer names.
   // `canFix` says whether turning it back into a fix can still be built in this round: only at the
   // stop no resolve of the round has run before.
   ```

   becomes:

   ```js
   // A draft as a stop shows it to the person (#95): the finding, what ships in the round (`ships`,
   // with the words and the planned files), where the draft goes, the title and body as they will
   // be filed, and its version, which the answer names. `canFix` says whether turning it back into
   // a fix can still be built in this round: only at the stop no resolve of the round has run before.
   ```

2. The comment above `isDeferral` (lines 3811-3818):

   ```js
     // The round's deferrals as they stand (#95): an entry whose finding is deferred, by the shaper
     // or by the person's override. A finding the person or autopilot decided is a deferral only
     // when the decision made it one (#97, R1-10): a defer override, and no other override whatever entry stands beside it (#103, R1-11), or, for a call, the resolve agent's own entry
     // when its mitigation field is filled or the finding has no planned task with files, since a
     // deferral that ships nothing has no task. The field is read as filled or empty, never by its
     // words (#100); the resolve agent naming each decision's disposition replaces this test (#99). A reshape's disposition or entry never makes a decided finding
     // one (#94, R8-6). A decline or a fix beside a leftover entry is none (#94, R4-9), and neither is
     // a finding left to the person under a rule, which has no entry at all.
   ```

   becomes:

   ```js
     // The round's deferrals as they stand (#95): an entry whose finding is deferred, by the shaper
     // or by the person's override. A finding the person or autopilot decided is a deferral only
     // when the decision made it one (#97, R1-10): a defer override, and no other override whatever
     // entry stands beside it (#103, R1-11), or, for a call, the resolve agent's own entry when its
     // mitigation field is filled or the finding has no planned task with files, since a deferral
     // that ships nothing has no task. The field is read as filled or empty, never by its words
     // (#100); the resolve agent naming each decision's disposition replaces this test (#99). A
     // reshape's disposition or entry never makes a decided finding one (#94, R8-6). A decline or a
     // fix beside a leftover entry is none (#94, R4-9), and neither is a finding left to the person
     // under a rule, which has no entry at all.
   ```

**Proof:** the gate is green with the new check passing and the loop otherwise unchanged. `grep -c 'the title and body as they will be filed, and its version' workflows/redline-loop.js` and `grep -c 'whatever entry stands beside it' workflows/redline-loop.js` each print `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change; comments are rewrapped with no word changed.

**Commit:** `redline: R3-5 rewrap the comments above draftView and isDeferral at the file's width (#100)`

## Task 6: R3-6, read a decided finding's planned task through plannedFiles alone

`shape.md`, Decision 6 and Unattended answer 6. This is a small refactor, so behaviour is unchanged.

**Files:**

- `tests/loop-test.mjs`
- `workflows/redline-loop.js`

**Test first.** In `tests/loop-test.mjs`, right after Task 5's check, add:

```js
  check('defer: isDeferral reads whether a decided finding has a planned task through plannedFiles, with no second reader of the resolve\'s tasks', !src.includes('plannedTask') && src.includes('mitigationFilled(d) || plannedFiles(d.id).length === 0'))
```

The red run: the check fails.

**Change.** In `workflows/redline-loop.js`, in `revise()`:

1. The block from the line that opens `  // A task one of the round's resolves planned with files for a finding:` through the end of `plannedFiles`' comment (lines 3800-3809), which reads:

   ```js
     // A task one of the round's resolves planned with files for a finding: what needCommits demands.
     const plannedTask = (id) => resolvedTasks.some((task) => task.finding === id && task.files.length > 0)
     // The files of the task the round planned for a deferral (#100), none when it planned no task.
     // A finding the person or autopilot decided is read from the resolve's tasks (plannedTask reads
     // the same tasks), whatever the shaper listed for it. One nobody decided is read from the
     // shaper's own list for its deferral (#97, R2-6): a finding's `files` are the paths its task
     // touches (the shaper's schema), so a deferral listed with files has a task whatever its
     // mitigation says, and shaperFiles reads only a finding the shaper deferred, so no other test of
     // the list is needed (#103, R2-9). Nothing is demanded of the gate for it: no deferral's commit
     // is (#100).
   ```

   is replaced by:

   ```js
     // The files of the task the round planned for a deferral (#100), none when it planned no task.
     // A finding the person or autopilot decided is read from the resolve's tasks, whatever the
     // shaper listed for it; isDeferral reads whether such a finding has a planned task from this
     // list too, so the stops, the prompts, the warning and isDeferral read one fact one way (#103,
     // R3-6). One nobody decided is read from the shaper's own list for its deferral (#97, R2-6): a
     // finding's `files` are the paths its task touches (the shaper's schema), so a deferral listed
     // with files has a task whatever its mitigation says, and shaperFiles reads only a finding the
     // shaper deferred, so no other test of the list is needed (#103, R2-9). Nothing is demanded of
     // the gate for it: no deferral's commit is (#100).
   ```

   The `plannedFiles` line after it (line 3810) stays as it is.

2. In `isDeferral` (line 3831 at `96f014f`, 3833 after Task 5), the line

   ```js
         return resolveDeferred.has(d.id) && (mitigationFilled(d) || !plannedTask(d.id))
   ```

   becomes:

   ```js
         return resolveDeferred.has(d.id) && (mitigationFilled(d) || plannedFiles(d.id).length === 0)
   ```

**Proof:** the gate is green with the new check passing and no existing check edited. These pass unchanged, since they read `isDeferral`'s branch for a call:

- `strayResolve`, an empty resolve entry beside a planned task, still a fix (line 3147).
- `strayWorded`, a filled entry beside a planned task, the decision's deferral (3153).
- `chosenBare`, an empty entry with no task, the person's deferral (3201).
- `chosenUnbuilt` (3206).
- `strayReshape` and `strayReshapeUnbuilt` (3158, 3163).
- `shortReshape` (3193) and `restated` (3199).

`grep -c 'plannedTask' workflows/redline-loop.js` prints `0`.

**Docs entry:** `workflows/redline-loop.js`: no reader-facing change. This is a refactor inside the script, with behaviour unchanged.

**Commit:** `redline: R3-6 read a decided finding's planned task through plannedFiles alone (#100)`

## Task 7: Verification Gate

1. **Gate steps 1 to 9.** Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-17-1643-103-review-round-3/redline/snapshot.json` until it exits 0. Its JSON is the evidence.
2. **Docs (gate step 10).** The entries, one per touched plugin file:
   - `skills/redline/SKILL.md` (Tasks 2, 3, 4): no README or `docs/` change, for the reasons in each task. `docs/running.md`, "Deferred items", Whether a mitigation shipped, already states the rule the three edits bring the skill into line with.
   - `workflows/redline-loop.js` (Tasks 5, 6): no reader-facing change: a rewrap of two comments, and a refactor with behaviour unchanged.
   - No new config key, subcommand, allow rule or exit code.
3. **Version (gate step 11).** No bump. The pull request already moved `0.4.0` to `0.4.1` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, and this round changes nothing a setup rerun writes.
4. **Standards retrospective (gate step 12).** Apply the edits the standards approver approved from `shape.md`, "Standards retrospective (proposed)", in their own commit: `redline: record what PR #103 round 3 taught in the agent standard (#100)`. The commit may change only `agent-os/standards/workflow/agents.md` (item 1). It names no finding, since item 1 is a lesson and every fix is whole in its own commit. If item 1 is not approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
5. **Spec folder (gate step 13).** Write `## As built` at the end of this `plan.md`: each task's commit, its red and green counts, and any deviation. Record each deviation also under Decisions in `shape.md`. Commit it last, with `shape.md` if it changed: `redline: record the as-built notes for PR #103 round 3 (#100)`. Never stage anything under the spec folder's `redline/` folder.

**Files:**

- `agent-os/specs/2026-11-17-1643-103-review-round-3/plan.md`
- `agent-os/specs/2026-11-17-1643-103-review-round-3/shape.md`
- `agent-os/standards/workflow/agents.md`
