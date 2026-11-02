# PR #63 Review Round 2 — Plan

Shaped by Redline in unattended mode. The final nit round has one finding, `fix`: R2-1, the inventory's pointer stays open instead of listing step numbers. No judgment calls, nothing deferred.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-2/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. Counts before this round, from round 1's As built: setup 330, loop 495.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding's commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-02-1253-63-review-round-2/plan.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-2/shape.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-2/standards.md`
- `agent-os/specs/2026-11-02-1253-63-review-round-2/references.md`

**Commit:** `redline: save review round 2 spec for PR #63 (#44)`

## Task 2: R2-1 — the inventory's pointer stays open instead of listing step numbers

**Files:** `skills/setup/SKILL.md`.

1. Line 19. Replace:

   ```
   5. Inventory, so a rerun updates instead of duplicating; keep it for the steps below: steps 5, 11 and 12 read it, and step 14 lists what a rerun checked:
   ```

   with:

   ```
   5. Inventory, so a rerun updates instead of duplicating; keep it for the steps below and for step 14's list of what a rerun checked:
   ```

   Change nothing else in the file. Line 21's "step 8 reports them as `stale`" stays as it is. Why the open wording: the inventory's items feed steps 5 and 7 to 12, not only the ones round 1 listed (see `shape.md`, R2-1).
2. Proof:
   - `grep -n "keep it for" skills/setup/SKILL.md` prints the new line 19 and nothing else.
   - `grep -n "steps 5, 11 and 12" skills/setup/SKILL.md` prints nothing.

**Docs (gate step 10):** `skills/setup/SKILL.md`, no reader-facing change. README "Set up a repository" and the Files table row for `skills/setup/SKILL.md` describe the steps. Neither describes the inventory's internal pointer.

**Commit:** `redline: R2-1 keep the setup inventory's pointer open so no step is left out (#44)`

## Task 3: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1253-63-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 330 passed and `loop` at 495 passed, each with 0 failed. No case or check changes this round.

10. **Docs:** confirm the entry names its reason: Task 2 (`skills/setup/SKILL.md`, no reader-facing change). No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective:** `shape.md`'s proposed list is "no changes". If the standards approver approves it, add "Standards retrospective: no changes" under Decisions in `shape.md`. If the approver adds an edit instead, apply it in a commit of its own titled `redline: record the round 2 review lessons in the standards (#44)`, naming the standard file it changes. Keep that file's headings.
12. **Spec folder:** add an "As built" section to this file with the Task 2 proof output, the gate's `setup` and `loop` counts, and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-1253-63-review-round-2/plan.md`, `agent-os/specs/2026-11-02-1253-63-review-round-2/shape.md`.

**Commit:** `redline: record PR #63 round 2 as built (#44)`
