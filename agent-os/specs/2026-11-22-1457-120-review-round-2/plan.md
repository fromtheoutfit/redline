# PR #120 review round 2: the lost-entry ban after the workflow's check, a pinned label, the spec commit, and the spec check's reach

Spec folder: `agent-os/specs/2026-11-22-1457-120-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #120 (issues #117 and #116), from the round's five findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-1 (Task 2), R2-2 (Task 3), R2-3 (Task 4).
- `defer`, with a mitigation that ships here: R2-5 (Task 5). Its drafted issue is under Deferred in `shape.md` and is filed by the run, never by the implementer.
- `decline`: R2-4, with its reason under Declined in `shape.md`. No task, no change, no commit.
- No `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#117)`. No commit subject holds a bare `@word`.

Line numbers are at `96eb7aa`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/` or `skills/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.5`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5). No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`**, which the pull request's own caution names ("a round that edits one of them meets #81"). A relaunch of this run runs the script it launched with, and the skill reports the changed agent file, which the handoff comment repeats (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits, "A self-review that edits an agent file runs its later rounds under the edit").

**Task order matters in four files.**

- `workflows/redline-loop.js`:
  - Task 2 edits the human-decline throw in `checkDispositions` (3250) for its mutation only and puts it back before its commit, so it runs first, while the file matches HEAD.
  - Task 3 changes the comment in `resumeLine` (685-689).
  - Task 4 changes the same comment further down (699-705) and the clause after the workflow's own check (716).
  - Task 5 changes the comment above `vetShape` (3822-3824).
- `docs/running.md`, section "Run markers and resume" (208): Task 3 changes the sentence that opens "A revise-only pass over a round", Task 4 the sentence that opens "After any other stop, a missing spec file", Task 5 adds a sentence after the one that opens "The folder is checked before the result". Different sentences of one paragraph.
- `tests/loop-test.mjs`:
  - Task 2 changes one check (2713).
  - Task 3 adds one element to the end of the `docs/running.md` phrase list (3108).
  - Task 4 changes `CORRECT_IN_PLACE` (3710), adds a check after the `restoredPrompt` check (3719) and one after the shaper-file check whose name opens "reshape: the shaper's file says a reshape resumed after any other stop" (3737), and adds one element to the same phrase list, after Task 3's.
  - Task 5 adds one element to the same phrase list, after Task 4's.
- `agent-os/standards/workflow/replay.md`, line 19: Task 3 rewords the clause that opens "so a resume of its first shape rewrites that run's decided entries", Task 4 the clause that opens "after any other stop (a missing spec file", both in the middle of the line; the standards commit in Task 6 appends item 1 to the end of the same line afterwards.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds or changes checks makes that test change first and sees it fail on a gate run, then makes the change and sees it pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-2/redline/snapshot.json`, which prints the failing check names. Task 2's pin already holds, so it is seen red under a mutation instead (testing/tests, line 35), as that task says. If gate runs are slow, the red runs of Tasks 3, 4 and 5 may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

**Expected counts.** Before this round the loop prints `1665 checks passed, 0 failed` (round 1's As built, over the tree at `96eb7aa`), and every other harness prints what the baseline prints.

| Task | Adds | Red run | Green run |
| --- | --- | --- | --- |
| Task 2 | 0 (one check changed) | under the mutation: `1664 checks passed, 1 failed` | `1665 checks passed, 0 failed` |
| Task 3 | 1, a docs phrase pin | `1665 checks passed, 1 failed` | `1666 checks passed, 0 failed` |
| Task 4 | 3: the resumed prompt's ban, the shaper file's ban, a docs phrase pin. The four existing checks that compare against `CORRECT_IN_PLACE` go red on the red run and green after the change | `1662 checks passed, 7 failed` | `1669 checks passed, 0 failed` |
| Task 5 | 1, a docs phrase pin | `1669 checks passed, 1 failed` | `1670 checks passed, 0 failed` |

So the loop reads `1670 checks passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-22-1457-120-review-round-2/plan.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-2/shape.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-2/standards.md`
- `agent-os/specs/2026-11-22-1457-120-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #120 (#117)`

## Task 2: R2-1, pin the resume label of the human pass's decline stop

`shape.md`, Decision 1 and Unattended answer 6.

**Files:**

- `tests/loop-test.mjs` (the change, committed)
- `workflows/redline-loop.js` (the mutation only, put back before the commit; this task commits no change to it)

**Test change.** In `tests/loop-test.mjs`, the check named "human: a decline stops the pass at shape" (2713):

```js
  check('human: a decline stops the pass at shape', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper declined H1-1') && run.res.error.includes('never a decline of Redline\'s own') && labels(run.calls).join('|') === 'shape h1|spec status h1', [run.res.status, run.res.error, labels(run.calls)])
```

becomes these four lines:

```js
  // The stop resumes at the shaper, whose label the throw passes itself: the spec check runs first,
  // so lastLabel names the spec-status call, and a resume there would replay the refused result
  // (#120, R1-3). Until R2-1 no check read this stop's label.
  check('human: a decline stops the pass at shape, resumable at the shaper', run.res.status === 'error' && run.res.stage === 'shape' && run.res.error.includes('the shaper declined H1-1') && run.res.error.includes('never a decline of Redline\'s own') && labels(run.calls).join('|') === 'shape h1|spec status h1' && (run.res.resumeFrom || {}).label === 'shape h1', [run.res.status, run.res.error, labels(run.calls), run.res.resumeFrom])
```

Find it by its name: the check named "human: a defer stops the run at shape" (1331) holds the same `labels(...)` text and does not change. `run.res.resumeFrom` is read through `|| {}`, so a run that took another path fails the check rather than throwing (testing/tests, line 14).

**The mutation, never committed.** The pin holds before and after this task, so it cannot be red before a change; it is seen red under a mutation of the clause it turns on (testing/tests, line 35). The door testing/tests line 36 names, a mutated copy in the temp directory, needs an interpreter no Redline role may run, so the mutation is made in place, as PR #114 round 1's Task 7 did:

1. In `workflows/redline-loop.js`, `checkDispositions`, the end of the human-decline throw (3250):

   ```js
   since what a teammate asked for is the author's to answer`, {}, shaperLabel)
   ```

   becomes:

   ```js
   since what a teammate asked for is the author's to answer`)
   ```

   That text occurs once in the file.

2. Run the gate. Expected: `1664 checks passed, 1 failed`, the failing check "human: a decline stops the pass at shape, resumable at the shaper", its detail showing `resumeFrom` with the label `spec status h1`. Record every failing check's name under As built.
3. Put the line back exactly as it was. `git diff -- workflows/redline-loop.js` prints nothing.
4. Run the gate again. Expected: `1665 checks passed, 0 failed`.

Neighbours, green before and after: "human: a first shape resumed after that check is told nothing was fixed by hand, then to rewrite the four files" (2718), "human: a defer stops the run at shape" (1331), and the two rules over every scenario ("every error result of every scenario says in ownCheck ...", "each stop that is the workflow's own check is reached ...").

**Proof:** `grep -c "a decline stops the pass at shape, resumable at the shaper" tests/loop-test.mjs` prints `1`, and `git diff -- workflows/redline-loop.js` prints nothing.

**Docs entry:** no plugin file changes in this task's commit (`tests/loop-test.mjs` only); no reader-facing change.

**Commit** (stage `tests/loop-test.mjs` alone): `redline: R2-1 pin the resume label of the human pass's decline stop (#117)`

## Task 3: R2-2, say the spec commit keeps an earlier run's decided entries only once that run reached its implement step

`shape.md`, Decision 2 and Unattended answer 7.

The record commit stages only the `redline/` folders and the start snapshot, so it never holds `shape.md`; the round's spec commit, made when a run reaches its implement step, does. Round 1's mitigation for R1-1 said "that run's record commit keeps them in git history" in three places. Each is corrected here. No prompt or code changes.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `agent-os/standards/workflow/replay.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the `docs/running.md` phrase list (3108), the end of the line:

```js
'in a round folder its own launch created, nothing you or the autopilot decided can be there yet']],
```

becomes:

```js
'in a round folder its own launch created, nothing you or the autopilot decided can be there yet', 'once that run reached its implement step']],
```

See the new check, `defer: docs/running.md says "once that run reached its implement step"`, fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, the comment in `resumeLine` (685-689):

   ```
     // disk when one is resumed in a round folder its own launch created. A revise-only pass over an
     // earlier run's round (/redline:redline-revise <pr> round <N>) shapes in that run's folder,
     // which can hold its decided entries, so a resume of its first shape rewrites them, as it
     // always has, and that run's record commit keeps them in git history (#120, R1-1). A reshape
     // runs after the round's resolve, so its folder can hold the
   ```

   becomes:

   ```
     // disk when one is resumed in a round folder its own launch created. A revise-only pass over an
     // earlier run's round (/redline:redline-revise <pr> round <N>) shapes in that run's folder,
     // which can hold its decided entries, so a resume of its first shape rewrites them, as it
     // always has (#120, R1-1). That run's spec commit keeps them in git history only once the run
     // reached its implement step; one that stopped before it (at its resolve, its plan approver or
     // a reshape) left them uncommitted, and the rewrite loses them; the record commit holds only
     // redline/ (#120, R2-2). A reshape runs after the round's resolve, so its folder can hold the
   ```

   The next line, which opens "entries and tasks the resolve agent wrote for the round's decisions", continues it unchanged. No code changes.

2. In `docs/running.md`, section "Run markers and resume" (208), the sentence:

   ```
   A revise-only pass over a round an earlier run shaped and resolved (`/redline:redline-revise <pr> round <N>`) shapes in that run's folder, so a resume of its first shape rewrites that run's decided entries, as it always has; the earlier run's record commit keeps them in git history (#120, R1-1).
   ```

   becomes:

   ```
   A revise-only pass over a round an earlier run shaped and resolved (`/redline:redline-revise <pr> round <N>`) shapes in that run's folder, so a resume of its first shape rewrites that run's decided entries, as it always has (#120, R1-1): the earlier run's spec commit keeps them in git history once that run reached its implement step, and an earlier run that stopped before it left them uncommitted, so the rewrite loses them (#120, R2-2).
   ```

   No other sentence of the paragraph changes.

3. In `agent-os/standards/workflow/replay.md`, line 19, the clause:

   ```
   so a resume of its first shape rewrites that run's decided entries, as it always has, and that run's record commit keeps them in git history (#120, R1-1);
   ```

   becomes:

   ```
   so a resume of its first shape rewrites that run's decided entries, as it always has (#120, R1-1), and that run's spec commit keeps them in git history only once that run reached its implement step, since one that stopped before it left them uncommitted (#120, R2-2);
   ```

   The rest of the line stays as it is. The clause states what the code does, so it changes in this task's commit, not in the standards commit (process/standards-retrospective, line 11); read the whole line back once it is changed (line 10).

Neighbours, green before and after: the phrase list's `in a round folder its own launch created, nothing you or the autopilot decided can be there yet`, and "reshape: the first shape of the same round, resumed after its spec check, still rewrites the four files from scratch, its line byte for byte as it was" (3735).

**Proof:** `grep -c "record commit keeps them in git history" workflows/redline-loop.js docs/running.md agent-os/standards/workflow/replay.md` prints `0` for each file (each printed `1` before), and `grep -c "reached its implement step" workflows/redline-loop.js docs/running.md agent-os/standards/workflow/replay.md tests/loop-test.mjs` prints `1` for each.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit (the same claim, corrected; the script's change is a comment).
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).
- `agent-os/standards/workflow/replay.md` is a standard, not a plugin file; it changes here because it states what the code does.

**Commit:** `redline: R2-2 say the spec commit keeps an earlier run's decided entries only once it reached implement (#117)`

## Task 4: R2-3, a reshape resumed after the workflow's check never writes a lost decided entry from memory

`shape.md`, Decision 3 and Unattended answer 4.

**Files:**

- `workflows/redline-loop.js`
- `agents/redline-shaper.md`
- `docs/running.md`
- `agent-os/standards/workflow/replay.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`:

1. The `CORRECT_IN_PLACE` constant (3710):

   ```js
     const CORRECT_IN_PLACE = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never change or remove anything under its redline/ folder.'
   ```

   becomes:

   ```js
     const CORRECT_IN_PLACE = ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

2. After the check whose name opens "reshape: a reshape resumed after that stop is told to correct what the error names and keep the decided entries" (3719), add:

   ```js
     // The clause after the workflow's own check bans writing a lost decided entry back from memory,
     // as the restore clause does (#120, R2-3): the reshape prompt names each decided finding and its
     // end, never the person's words, and a reshape the hold or a check of its result stopped may
     // have dropped an entry as well as a task. Until R2-3 only the restore clause said so.
     check('reshape: a reshape resumed after the workflow\'s check is told never to write a decided entry the folder no longer holds from memory', restoredPrompt.includes('correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost)'), restoredPrompt.slice(-700))
   ```

3. After the check whose name opens "reshape: the shaper's file says a reshape resumed after any other stop keeps a decided task" (3737), add:

   ```js
     check('reshape: the shaper\'s file says a reshape resumed after the workflow\'s check never writes a lost decided entry from memory', shaperFile.includes('the decided entries and their tasks included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory'))
   ```

4. In the `docs/running.md` phrase list (3108), the end of the line as Task 3 leaves it:

   ```js
   'once that run reached its implement step']],
   ```

   becomes:

   ```js
   'once that run reached its implement step', 'After either kind of stop, an entry of yours the folder no longer holds is named in `shape.md` as lost']],
   ```

See the three new checks fail on a gate run, beside the four existing checks that compare against `CORRECT_IN_PLACE`: the ones named "reshape: a reshape resumed after that stop is told to correct what the error names and keep the decided entries, never to rewrite the folder, and the relaunch finishes" (3719), "reshape: a reshape resumed after the stop for both is told to correct what the error names, and the relaunch finishes" (3751), "reshape: a reshape of a decided round resumed after a check of its result (a decline with no reason) is told to correct what the error names and keep the decided entries" (3770) and "reshape: a reshape of a round with no decision resumed after a check of its result is told to correct what the error names" (3779).

**Change.**

1. In `workflows/redline-loop.js`, `resumeLine`, the clause after the workflow's own check (716):

   ```js
           ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never change or remove anything under its redline/ folder.'
   ```

   becomes:

   ```js
           ? ' When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.'
   ```

   The clause still holds "nothing was fixed by hand for it", which `RESUME_WORDS` in the loop test reads over every scenario, and it still ends with the ban on touching `redline/` (#114, R4-1).

2. In the same function's comment (699-705), the text:

   ```
     // returned nothing) the folder may be incomplete, so the rerun restores what is missing, keeps
     // each decided entry and its task unless an adjustment changes that task (#120, R1-2), and
     // never writes from memory a decided entry the folder no longer holds: the reshape prompt
     // names each decided finding and its end, never the choice, the notes and the date. Both hold
     // in a round with no decision too: the line cannot see the round's decisions, and correcting
     // in place is right for every reshape. Each clause ends with the ban on touching redline/ that
     // the from-scratch sentence carries (#114, R4-1).
   ```

   becomes:

   ```
     // returned nothing) the folder may be incomplete, so the rerun restores what is missing and
     // keeps each decided entry and its task unless an adjustment changes that task (#120, R1-2).
     // After either, the rerun never writes from memory a decided entry the folder no longer holds:
     // the reshape prompt names each decided finding and its end, never the choice, the notes and
     // the date, and a reshape the hold or a check of its result stopped may have dropped an entry
     // as well as a task (#120, R2-3). Both hold in a round with no decision too: the line cannot
     // see the round's decisions, and correcting in place is right for every reshape. Each clause
     // ends with the ban on touching redline/ that the from-scratch sentence carries (#114, R4-1).
   ```

3. In `agents/redline-shaper.md`, rule 9 (32), the sentence:

   ```
   When the line says the stop was the workflow's check of what your earlier attempt returned, nothing was fixed by hand for it: read the four files as that attempt left them, the decided entries and their tasks included, correct what the error names, and return the whole result again.
   ```

   becomes:

   ```
   When the line says the stop was the workflow's check of what your earlier attempt returned, nothing was fixed by hand for it: read the four files as that attempt left them, the decided entries and their tasks included, correct what the error names, and return the whole result again; never write a decided entry the folder no longer holds from memory, name it in `shape.md` as lost.
   ```

   Find it by the text "the decided entries and their tasks included, correct what the error names", which occurs once; rule 9's first-shape sentence that opens "When its resume line says" does not change. No other sentence of rule 9 changes. The phrases the loop test pins in the file ("A resumed reshape never rewrites from scratch", "correct what the error names", "write again what is missing or left unfinished", "never write a decided entry the folder no longer holds from memory", "keep every decided entry, and its task unless an adjustment changes that task", and the sentence that bans touching `redline/`) stay as they are.

4. In `docs/running.md`, section "Run markers and resume" (208), the sentence:

   ```
   After any other stop, a missing spec file or a call that returned nothing, it reads the four files as they stand, keeps the decided entries, and their tasks unless an adjustment changes one, and writes again what is missing; an entry of yours the folder no longer holds is named in `shape.md` as lost, never written back from memory, since the reshape is told which findings you decided and what each decision ends in, not your words.
   ```

   becomes:

   ```
   After any other stop, a missing spec file or a call that returned nothing, it reads the four files as they stand, keeps the decided entries, and their tasks unless an adjustment changes one, and writes again what is missing. After either kind of stop, an entry of yours the folder no longer holds is named in `shape.md` as lost, never written back from memory, since the reshape is told which findings you decided and what each decision ends in, not your words (#120, R2-3).
   ```

   The phrases the loop test pins in the paragraph (`it corrects what the error names and keeps the decided entries`, `named in `shape.md` as lost, never written back from memory`, `and their tasks unless an adjustment changes one`) stay. No other sentence of the paragraph changes.

5. In `agent-os/standards/workflow/replay.md`, line 19, the clause:

   ```
   after any other stop (a missing spec file, a call that returned nothing), restore what is missing, and never write from memory a decided entry the folder no longer holds.
   ```

   becomes:

   ```
   after any other stop (a missing spec file, a call that returned nothing), restore what is missing; and after either, never write from memory a decided entry the folder no longer holds (#120, R2-3).
   ```

   The rest of the line, as Task 3 leaves it, stays as it is. The clause states what the code does, so it changes in this task's commit (process/standards-retrospective, line 11); read the whole line back once it is changed (line 10).

Only the clause a reshape resumed after the workflow's own check is given changes. No prompt of a run without a resume entry changes, and the restore clause, the first shape's sentences and the resolve's clause keep their bytes. Neighbours, green before and after: "reshape: an entry with no ownCheck is an ordinary stop whatever its error says ..." (3718), "reshape: a reshape resumed after another stop is told to restore what is missing ..." (3723), "reshape: the shaper's file says a resumed reshape never rewrites from scratch ..." (3736), the two `redline/` pins (3740), "resume: the shaper's file, the replay standard and docs/running.md say a first shape resumed after the workflow's check is told nothing was fixed by hand", the rule over every scenario that no prompt of a run without a resume entry holds a resume line, and the rule that no reshape is told to rewrite.

**Proof:** `grep -c "and return the whole result again; never write a decided entry the folder no longer holds from memory (name it in shape.md as lost)" workflows/redline-loop.js tests/loop-test.mjs` prints `workflows/redline-loop.js:1` and `tests/loop-test.mjs:2` (`CORRECT_IN_PLACE` and the new prompt check); `grep -o "never write a decided entry the folder no longer holds from memory" agents/redline-shaper.md | wc -l` prints `2` (it printed `1`); `grep -c "After either kind of stop, an entry of yours the folder no longer holds" docs/running.md tests/loop-test.mjs` prints `1` for each; and `grep -c "and after either, never write from memory a decided entry" agent-os/standards/workflow/replay.md` prints `1`.

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit.
- `agents/redline-shaper.md`: the same section, updated in this task's commit.
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).
- `agent-os/standards/workflow/replay.md` is a standard, not a plugin file; it changes here because it states what the code does.

**Commit:** `redline: R2-3 tell a reshape resumed after the workflow's check never to write a lost decided entry from memory (#117)`

## Task 5: R2-5 (deferred), the mitigation: say the spec check sees a refused Write only where it leaves a file missing

`shape.md`, Decision 4, Unattended answer 5 and Deferred. R2-5 is a `defer`: the full fix, a spec check that tells a call that wrote nothing from one that wrote, is the drafted issue under Deferred in `shape.md`, which the run files. This task is the mitigation: a comment and a docs sentence that state the limit, with a pin. It changes no code and no prompt.

**Files:**

- `workflows/redline-loop.js`
- `docs/running.md`
- `tests/loop-test.mjs`

**Test first.** In `tests/loop-test.mjs`, in the `docs/running.md` phrase list (3108), the end of the line as Task 4 leaves it:

```js
'After either kind of stop, an entry of yours the folder no longer holds is named in `shape.md` as lost']],
```

becomes:

```js
'After either kind of stop, an entry of yours the folder no longer holds is named in `shape.md` as lost', 'The check sees a refused Write only where it leaves a file missing']],
```

See the new check, `defer: docs/running.md says "The check sees a refused Write only where it leaves a file missing"`, fail on a gate run.

**Change.**

1. In `workflows/redline-loop.js`, the comment above `vetShape` (3822-3824):

   ```
   // stops there and the skill says to fix the cause first. Until R1-3 the result checks ran first,
   // and such an attempt was marked as needing no hand fix. Every check after the spec check names
   // the shaper's label itself, since lastLabel would name the spec-status call (#94, R2-9).
   ```

   becomes:

   ```
   // stops there and the skill says to fix the cause first. Until R1-3 the result checks ran first,
   // and such an attempt was marked as needing no hand fix. The check of the folder, though,
   // sees a refused Write only where it leaves a file missing, as at a round's first shape: at a
   // reshape the four files are already on disk, so a reshape whose Writes were all refused passes
   // it, and a check of its result or the hold after it still sets ownCheck (#120, R2-5, deferred:
   // telling a refused Write from a rerun that rightly changed no file needs a check of its own).
   // Every check after the spec check names the shaper's label itself, since lastLabel would name
   // the spec-status call (#94, R2-9).
   ```

   The comment names the finding, as a deferral's mitigation does. No code changes.

2. In `docs/running.md`, section "Run markers and resume" (208), after the sentence:

   ```
   The folder is checked before the result the shaper returned, so an attempt that left a file out stops there, as a stop to fix by hand, even when its result also fails one of those checks (#120, R1-3).
   ```

   add, as the next sentence of the same paragraph:

   ```
   The check sees a refused Write only where it leaves a file missing, as at a round's first shape: at a reshape the four files are already there, so a reshape whose Writes were refused passes it, and a stop at one of those checks, or at the hold of a decided finding to its task, is still marked as needing no hand fix, though the Writes have to be allowed before the relaunch (#120, R2-5).
   ```

   No other sentence of the paragraph changes.

Neighbours, green before and after: the phrase list's `The folder is checked before the result the shaper returned`, and the two R1-3 checks "spec: an attempt that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the shaper" and "reshape: a reshape that leaves a finding out and writes no shape.md stops at the spec check, with no ownCheck, resumable at the reshape".

**Proof:** `grep -c "sees a refused Write only where it leaves a file missing" workflows/redline-loop.js docs/running.md tests/loop-test.mjs` prints `1` for each file (each printed `0` before).

**Docs entries:**

- `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", updated in this task's commit (the limit the comment states, said to the person).
- `docs/running.md` is reader-facing by nature and needs no entry of its own (process/docs-gate, line 16).

**Commit:** `redline: R2-5 say the spec check sees a refused Write only where it leaves a file missing (#117)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-22-1457-120-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: the loop prints `1670 checks passed, 0 failed`, and every other harness prints what the baseline prints.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `workflows/redline-loop.js` (Tasks 3, 4 and 5; Task 2 commits no change to it) and `agents/redline-shaper.md` (Task 4), with the section and the reason given in each task: Tasks 3, 4 and 5 update `docs/running.md`, "Run markers and resume", and Task 2 has no reader-facing change. `docs/running.md` is reader-facing by nature. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.5`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them. Apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/workflow/replay.md` (items 1 and 2; item 1 appends to the end of line 19 as Tasks 3 and 4 leave it), `agent-os/standards/testing/tests.md` (item 3) and `agent-os/standards/process/docs-gate.md` (item 4), each clause read back in its whole line. Title it `redline: record the round 2 review lessons in the standards (#117)`. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts (Task 2's red under the mutation), and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 2 for PR #120 (#117)`.

**Files** (this task): `agent-os/standards/workflow/replay.md`, `agent-os/standards/testing/tests.md` and `agent-os/standards/process/docs-gate.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-22-1457-120-review-round-2/plan.md` and `shape.md` (As built and any deviation).
