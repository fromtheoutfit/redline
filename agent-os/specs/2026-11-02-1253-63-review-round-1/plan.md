# PR #63 Review Round 1 — Plan

Shaped by Redline in unattended mode. Four findings, all `fix`: R1-1 (the inventory's step pointer), R1-2 (step 12 keyed on each file's inventory), R1-3 (the this-checkout alias cases as dry runs), R1-4 (`RUN_LINE` names every command form). No judgment calls, nothing deferred.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. The harnesses run through `.claude/redline/checks.sh`: read the `setup` and `loop` entries of its JSON (`exit`, and the `N passed, M failed` line in each one's output). The PR description gives the counts before this round: setup 330, loop 495.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before any finding's commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-02-1253-63-review-round-1/plan.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-1/shape.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-1/standards.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-1/references.md`

**Commit:** `redline: save review round 1 spec for PR #63 (#44)`

## Task 2: R1-1 — the inventory's pointer names the steps that read it

**Files:** `skills/setup/SKILL.md`.

1. Line 19. Replace:

   ```
   5. Inventory, so a rerun updates instead of duplicating; keep it for step 13:
   ```

   with:

   ```
   5. Inventory, so a rerun updates instead of duplicating; keep it for the steps below: steps 5, 11 and 12 read it, and step 14 lists what a rerun checked:
   ```

   The steps that read it are 5 (line 71), 11 (line 143), 12 (line 149) and 14 (line 175); see `shape.md`, R1-1.
2. Proof: `grep -n "keep it for" skills/setup/SKILL.md` prints the new line 19 and nothing else.

**Docs (gate step 10):** `skills/setup/SKILL.md`, no reader-facing change. The README's "Set up a repository" and the Files table row for `skills/setup/SKILL.md` describe the steps, not the inventory's internal pointer.

**Commit:** `redline: R1-1 point the setup inventory at the steps that read it (#44)`

## Task 3: R1-2 — step 12 follows each file's inventory, fresh setup or rerun

**Files:** `skills/setup/SKILL.md`, `README.md`.

1. `skills/setup/SKILL.md`, step 12, line 149. Replace the paragraph that begins "Fresh setup, or a rerun whose inventory found neither file:" with these two paragraphs:

   ```
   Each file follows what step 1's inventory found for it, on a fresh setup and a rerun alike: a fresh setup can find one already there (a hand-written one-liner, as #44 first suggested).

   Neither file present: ask once with `AskUserQuestion`, "Write the short aliases `/redline` and `/redline-revise`?", with **Yes** first (the default; the namespaced commands keep working either way). Nothing records a no, so a later rerun that finds both absent asks again. On a yes, for each of `redline` and `redline-revise`:
   ```

   Keep the code block after it (the `redline-setup.sh command <repoRoot> <name>` line) and line 155, "and say the file it wrote (`status: absent`, `written: true`).", unchanged.
2. `skills/setup/SKILL.md`, line 157. Replace:

   ```
   Rerun with a file present: run the same command with `--dry-run` first, for each name, and read `status`:
   ```

   with:

   ```
   Either file present, fresh setup or rerun: run the same command with `--dry-run` first, for each name, and read `status`:
   ```

3. `skills/setup/SKILL.md`, line 162, the last bullet of that list. Replace:

   ```
   - `absent` for one name while the other is present: ask for that one as a fresh setup does.
   ```

   with:

   ```
   - `absent` for one name while the other is present: ask for that one alone, as for neither present above, and on a yes run the command for it without `--dry-run`.
   ```

   Leave the `unchanged`, `differs` and `foreign` bullets as they are.
4. `README.md`, line 46 ("Set up a repository", item 7). Replace "The template is the file: a rerun reports" with "The template is the file: for a file already there, on a fresh setup or a rerun, the script reports". Leave the rest of the item unchanged.
5. Proof:
   - `grep -n "Rerun with a file present" skills/setup/SKILL.md` prints nothing.
   - `grep -n "Either file present, fresh setup or rerun" skills/setup/SKILL.md` prints one line.
   - `grep -n "a rerun reports" README.md` prints nothing.

**Docs (gate step 10):** `skills/setup/SKILL.md` maps to README "Set up a repository", item 7, updated in this task's commit.

**Commit:** `redline: R1-2 key setup's alias step on each file's inventory, fresh setup or rerun (#44)`

## Task 4: R1-3 — the this-checkout alias cases run as dry runs

**Files:** `tests/setup-test.sh`.

1. Lines 566-567. Replace:

   ```bash
   expect_json "this checkout's /redline alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline
   expect_json "this checkout's /redline-revise alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline-revise
   ```

   with:

   ```bash
   # A dry run: a missing alias file reads absent and stays missing, never written into the checkout (#63, R1-3).
   expect_json "this checkout's /redline alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline --dry-run
   expect_json "this checkout's /redline-revise alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline-revise --dry-run
   ```

2. No red run, and why: see `shape.md`, R1-3 and Unattended answer A4.
   - The reproduction needs an alias file deleted from the checkout, which `testing/tests.md:23` forbids.
   - The cases at lines 528-529 already prove that a dry run on an absent file writes nothing, not even `.claude/`.
3. Proof:
   - `grep -n "alias is the template" tests/setup-test.sh` prints the two lines, each ending in `--dry-run`.
   - Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-1/redline/snapshot.json`. Its `setup` entry must read `330 passed, 0 failed`: the same count, since no case was added.
   - `git status --porcelain -- .claude/commands` prints nothing.

**Docs (gate step 10):** none needed. `tests/setup-test.sh` is not under a Docs directory, and its README Files row does not list cases.

**Commit:** `redline: R1-3 dry-run this checkout's alias cases so the gate never writes into the tree (#44)`

## Task 5: R1-4 — `RUN_LINE` names every Redline command form, red first

**Files:** `tests/loop-test.mjs` (first), `workflows/redline-loop.js`.

The new parenthetical, the same in both files. In `workflows/redline-loop.js`, write each backtick escaped with a backslash, as the template literal already does.

```
(a line holding only a Redline command on a launch or a resume, `/redline:redline <pr> ...`, `/redline:redline-review <pr> ...` or `/redline:redline-revise <pr> ...` or the short forms `/redline <pr> ...` and `/redline-revise <pr> ...`, or the word `relaunch` after a hand-off)
```

It lists exactly what the skill's relaunch rule accepts (`skills/redline/SKILL.md:211`: "`/redline:redline <n> ...` or a variant, or the short form … `/redline <n> ...` and `/redline-revise <n> ...`").

1. **Red first.** `tests/loop-test.mjs`:
   - Line 1231: in `word`, replace the parenthetical "(a line holding only a Redline command on a launch or a resume, `/redline:redline <pr> ...` or its short form `/redline <pr> ...`, or the word `relaunch` after a hand-off)" with the one above. Leave the text before and after it as it is.
   - Line 1229, the comment: replace "the namespaced command and its short alias both (#44)" with "the namespaced commands and their short aliases (#44; #63, R1-4)".
2. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-1/redline/snapshot.json`. Its `loop` entry must show `493 checks passed, 2 failed`, with exactly the two relay checks failing:
   - "relay: every prompt names the two lines the harness may relay";
   - "relay: every relaunched prompt names the two lines too".
   Record the counts under As built.
3. **Then the fix.** `workflows/redline-loop.js`, line 261 (`RUN_LINE`): replace the same parenthetical with the one above, backticks escaped. Change nothing else in the constant.
4. Run the same `checks.sh` command. The `loop` entry must read `495 checks passed, 0 failed`. The `samePrefix` relaunch checks stay green, since both launches build the same `RUN_LINE`.
5. Proof: `grep -c "redline:redline-review <pr>" workflows/redline-loop.js tests/loop-test.mjs` prints `1` for each file.

**Docs (gate step 10):** `workflows/redline-loop.js`, no reader-facing change. README "Launching", the relayed-line paragraph (line 192), already says "a line holding only a Redline command (a launch, a resume; the namespaced form or the short alias, #44)", which covers every form the constant now lists. `skills/redline/SKILL.md` section 7 already names the revise short form.

**Commit:** `redline: R1-4 name the revise and review command forms in RUN_LINE (#44)`

## Task 6: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings.

**Files:**

- `agent-os/standards/testing/tests.md` (line 23)
- `agent-os/standards/workflow/replay.md` (line 17)
- `agent-os/standards/scripts/bash-conventions.md` (line 41)

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the round 1 review lessons in the standards (#44)`

## Task 7: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 330 passed and `loop` at 495 passed, each with 0 failed: no case or check was added, only changed.

10. **Docs:** confirm each entry names its commit or its reason:
    - Task 2 (`skills/setup/SKILL.md`, no reader-facing change);
    - Task 3 (`skills/setup/SKILL.md`: README "Set up a repository" item 7, in Task 3's commit);
    - Task 4 (`tests/setup-test.sh`, not a Docs directory);
    - Task 5 (`workflows/redline-loop.js`, no reader-facing change: README "Launching" is already generic).
    No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective:** Task 6, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder:** add an "As built" section to this file with:
    - Task 5's red count and the green counts;
    - the `git status --porcelain -- .claude/commands` result from Task 4;
    - any deviation.
    Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-1253-63-review-round-1/plan.md`, `agent-os/specs/2026-11-02-1253-63-review-round-1/shape.md`.

**Commit:** `redline: record PR #63 round 1 as built (#44)`

---

## As built

Built as planned, one commit per task:

- Task 1, the spec folder: `4aead51`.
- Task 2, R1-1: `c76e889`. `grep -n "keep it for" skills/setup/SKILL.md` prints line 19 alone.
- Task 3, R1-2: `b48edbd`, `skills/setup/SKILL.md` and README "Set up a repository" item 7 together. The three greps read as the plan says: "Rerun with a file present" and "a rerun reports" print nothing, "Either file present, fresh setup or rerun" prints line 159.
- Task 4, R1-3: `95b7319`. The gate's `setup` entry read `330 passed, 0 failed`, the same count as before. `git status --porcelain -- .claude/commands` printed nothing.
- Task 5, R1-4: `b9ef59b`. With only `tests/loop-test.mjs` changed, the gate's `loop` entry read `493 checks passed, 2 failed`, exactly the two relay checks ("relay: every prompt names the two lines the harness may relay" and "relay: every relaunched prompt names the two lines too"). With `RUN_LINE` changed it read `495 checks passed, 0 failed`. `grep -c "redline:redline-review <pr>"` prints 1 for each file.
- Task 6, the standards retrospective: `ca6e662`, the three approved edits (`testing/tests.md`, `workflow/replay.md`, `scripts/bash-conventions.md`), each a lesson that names no finding's unfinished fix.
- Task 7, the gate: green, `setup` at 330 passed and `loop` at 495 passed, each with 0 failed.

Docs (gate step 10): Task 2 and Task 5, no reader-facing change, as planned; Task 3, README "Set up a repository" item 7, in `b48edbd`; Task 4, not a Docs directory.

Deviations: none. The R1-3 case ran through `checks.sh`, as Task 4 says; the harness itself is not on the implementer's allowlist.
