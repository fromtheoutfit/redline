# PR #89 review round 1: name the round-trip check for what it asserts

Spec folder: `agent-os/specs/2026-11-12-1044-89-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #89 (issue #87), from the round's one finding (`redline/round-1-review.json`, `redline/round-1-findings.json`). It is a nit; the round has no correctness finding, so this is the final nit round, and the plan covers the nit only.

- **R1-1** (nit): `fix`, Task 2. The round-trip check drops its `WJ + WJ` clause, which no posted text can satisfy, and is renamed for the two clauses it keeps.

There is no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, and files staged by name. Line numbers are at `1a7bf67`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also named by its text. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, so it reads exactly as the file does.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1044-89-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts:

- **Loop test.** `670 checks passed, 0 failed` before this round (the #87 spec's As built, `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/plan.md`, gate table; `git diff --stat eaa37b8 1a7bf67` touches no file under `tests/` or `workflows/`). Task 2 renames one check and adds none, so the round ends at 670.
- **Every other harness** keeps its count: guard 592, prefs 101, gate 117, setup 468, gh 121 and background 39 (the same table). No file one reads changes.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**Run caution (#81, not a task).** Task 2 commits `tests/loop-test.mjs` only. No round commit touches `workflows/` or `agents/`, so a relaunch replays this run with the workflow and agents it launched with (`shape.md`, Context).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-12-1044-89-review-round-1/plan.md`
- `agent-os/specs/2026-11-12-1044-89-review-round-1/shape.md`
- `agent-os/specs/2026-11-12-1044-89-review-round-1/standards.md`
- `agent-os/specs/2026-11-12-1044-89-review-round-1/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 1 spec for PR #89 (#87)`

## Task 2: R1-1, drop the round-trip check's joiner clause and name the check for what it asserts

`shape.md`, Decision 1 and Unattended answers 1 to 3. `postedText` adds a word joiner only after an `@` directly before an ASCII letter or digit (`workflows/redline-loop.js:930`, `/@(?=[A-Za-z0-9])/g`), and U+2060 is neither, so no posted text can hold two joiners in a row, whether or not `readBack` (line 939) strips the joiner. The `|| t.includes(WJ + WJ)` clause can never go red. The strip is pinned by the carry-list check at line 1760, which reads the reviewer's prompt, not posted text. A test-only change.

**Files:**

- `tests/loop-test.mjs`: line 1770, the check named `posted text: nothing read back is escaped twice or neutralised twice`, and two comment lines inserted directly above it.

**Change.** Replace line 1770, which reads exactly:

```js
  check('posted text: nothing read back is escaped twice or neutralised twice', ![r2.body, ...r2.comments.map((c) => c.body), handoff].some((t) => t.includes('&amp;lt;') || t.includes('&amp;amp;') || t.includes(WJ + WJ)), [r2.body, handoff])
```

with these three lines:

```js
  // postedText adds a joiner only before an ASCII letter or digit, so no posted text can show a
  // joiner readBack left in place: the carry-list check above pins the strip (#89, R1-1).
  check('posted text: nothing read back is escaped twice', ![r2.body, ...r2.comments.map((c) => c.body), handoff].some((t) => t.includes('&amp;lt;') || t.includes('&amp;amp;')), [r2.body, handoff])
```

The check's two remaining clauses, its subject list (`r2.body`, every inline comment body, `handoff`) and its detail argument stay as they are. Every other line of the file stays as it is; the lines after it move down by two. `WJ` (line 36) stays, since other checks use it.

### Proof

No check is added and none is removed, so the gate's loop step stays at `670 checks passed, 0 failed`. There is no red run: no behaviour changes, and the clause dropped is the one no input can turn red (`shape.md`, Unattended answer 2). The carry-list check, `posted text: the reviewer's carry list shows a read-back title decoded, the joiner stripped`, stays green and unchanged.

And:

- `grep -c 'WJ + WJ' tests/loop-test.mjs` prints `0` (was `1`).
- `grep -c 'neutralised twice' tests/loop-test.mjs` prints `0` (was `1`).
- `grep -c "check('posted text: nothing read back is escaped twice'" tests/loop-test.mjs` prints `1`.
- `grep -c 'the carry-list check above pins the strip (#89, R1-1)' tests/loop-test.mjs` prints `1`.
- `grep -c "the joiner stripped'" tests/loop-test.mjs` prints `1`: the carry-list check is still there.
- After the commit, `git diff --stat HEAD~1 HEAD` shows `tests/loop-test.mjs` with 3 insertions and 1 deletion.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `tests/loop-test.mjs`.

**Docs entry:** none needed. `tests/loop-test.mjs` is not under a directory gate step 10 lists, and the change adds no config key, subcommand, allow rule or exit code. `docs/running.md` and `README.md` do not name this check (`grep -rn -e 'neutralised twice' README.md docs` finds nothing).

**Run caution (#81):** this commit carries `tests/loop-test.mjs` only.

**Commit:** `redline: R1-1 drop the round-trip check's joiner clause, which cannot fail, and name the check for what it asserts (#87)`

## Task 3: Verification Gate

**Files:**

- `agent-os/specs/2026-11-12-1044-89-review-round-1/plan.md` and `agent-os/specs/2026-11-12-1044-89-review-round-1/shape.md` (step 13, and step 12 if nothing is approved).
- No standards file: the proposed retrospective is "no changes" (`shape.md`, "Standards retrospective (proposed)"). Should the standards approver approve an edit instead, it names the file, and only that file is added.

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-12-1044-89-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: `loop` at `670 checks passed, 0 failed`; every other harness at its count before the round, since no file one reads changes.
2. **Step 10, Docs:** Task 2's commit touches only `tests/loop-test.mjs`, which is in no Docs-step directory, so there is no Docs entry. There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.2` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. The #87 spec keeps `0.2.2` on purpose (its `shape.md`, decision 9), and this round changes nothing a setup rerun writes (`shape.md`, Decision 2). The round 1 review raised that decision under For the person; it is the person's, not this round's. The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)". The proposal is "no changes". If the approver approves none, make no standards commit and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`. If it approves an edit, that edit goes in one commit of its own after Task 2's: `redline: record the round 1 review lessons in the standards (#87)`, with `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` printing `0`.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Task 2's proof outputs;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #89 round 1 as built (#87)`

---

## As built

Built as planned, with no deviation.

- **Task 1:** `8d1adb0`, `redline: save review round 1 spec for PR #89 (#87)`.
- **Task 2:** `6ceb736`, `redline: R1-1 drop the round-trip check's joiner clause, which cannot fail, and name the check for what it asserts (#87)`. Proof outputs: `grep -c 'WJ + WJ'` printed `0`; `grep -c 'neutralised twice'` printed `0`; the renamed check's grep printed `1`; the comment's grep printed `1`; the carry-list check's grep printed `1`. `git diff --stat HEAD~1 HEAD` showed `tests/loop-test.mjs | 4 +++-`, 3 insertions and 1 deletion, and `git diff --name-only HEAD~1 HEAD` listed exactly `tests/loop-test.mjs`.
- **Gate (steps 1 to 9):** `checks.sh` with this folder's snapshot passed on its first run: syntax, validate, guard `592 passed, 0 mismatched`, loop `670 checks passed, 0 failed`, prefs `101 passed`, gate `117 passed`, setup `468 passed`, gh `121 passed`, background `39 passed`, every one with 0 failed; `unexpected_files` and `uncommitted` empty. Every count matches the plan's expected counts.
- **Step 10, Docs:** none needed, as Task 2 states.
- **Step 11, Version:** `0.2.2`, unchanged.
- **Step 12, Standards retrospective:** no edit approved; "Standards retrospective: no changes" is recorded under Decisions in `shape.md` (Decision 4), and there is no standards commit.
- **Step 13:** this section and Decision 4 land in `redline: record PR #89 round 1 as built (#87)`.
