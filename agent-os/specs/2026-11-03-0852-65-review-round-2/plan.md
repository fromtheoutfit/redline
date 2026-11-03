# PR #65 Review Round 2 — Plan

Shaped by Redline in unattended mode. One finding, R2-1, and it is `fix`. Round 1's R1-3 rewording says the plan approver helps keep `scripts/redline-guard.sh` and `hooks/hooks.json` out of a run that loads a cached release, but the approver has no check that names either file. Task 2 removes the approver from the three sentences that make the claim in `README.md`, `CLAUDE.md` and point 11 of the unattended section. The fourth sentence, in `agent-os/standards/scripts/guard.md`, is corrected through the standards retrospective (Task 3, item 1). No code changes and no case is added.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-03-0852-65-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run through `.claude/redline/checks.sh`, so read its JSON: each check's `exit`, and its `N passed, M failed` line. Counts before this round, from round 1's As built: `guard` 588 passed, `loop` 495, `prefs` 101, `gate` 117, `setup` 468, `gh` 113, `background` 39. No task adds or changes a case, so every harness should end the round at its count before the round. If a count you see before Task 2 differs, record it under As built.

Version step: this round keeps `0.1.0`. Decision 3 of the #16 plan makes this PR the exception, the first release (shape.md, Unattended answer 3).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding's commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-03-0852-65-review-round-2/plan.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-2/shape.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-2/standards.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-2/references.md`

**Commit:** `redline: save review round 2 spec for PR #65 (#16)`

## Task 2: R2-1 — drop the plan approver from what keeps the guard and hook files out of a cached-mode run

**Files:** `README.md`, `CLAUDE.md`, `.claude/commands/agent-os/shape-spec.md`.

The plan approver's checks (`agents/redline-plan-approver.md`) name neither file, and its file-scope check covers the loaded plugin's directory, which is the cache in that mode (shape.md, Decisions, R2-1). Each sentence loses the approver and nothing else. Do not touch `agents/redline-plan-approver.md`. The reviewer's alternative, a new check there, is not planned (shape.md, R2-1, "Not planned"). Do not touch round 1's spec folder either. `agent-os/standards/scripts/guard.md` changes only in Task 3, if approved.

1. `README.md`, line 221, the Known limits bullet "A run on this repository runs the PR's own code only when the plugin loads in place." Replace exactly:

   ```text
   only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md`, the plan approver and the teammate's review keep a change to them out of a run, behind the precheck's warning.
   ```

   with:

   ```text
   only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the teammate's review keep a change to them out of a run, behind the precheck's warning.
   ```

   Change nothing else in the bullet.
2. `CLAUDE.md`, line 57, the bullet under "This repository" that opens "**Every guard change updates `tests/guard-cases.tsv`**". Replace exactly:

   ```text
   so point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the plan approver are what keep them out of a run.
   ```

   with:

   ```text
   so only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` keeps them out of a plan.
   ```

   Change nothing else in the bullet or the file.
3. `.claude/commands/agent-os/shape-spec.md`, line 70, point 11 of the unattended section. Replace exactly:

   ```text
   so this point and the plan approver are what keep them out of a plan.
   ```

   with:

   ```text
   so only this point keeps them out of a plan.
   ```

   Keep the point's title, `11. **The guard and the hook.**`, which `tests/setup-test.sh:599` reads as a hand edit, and keep the rest of the point as it is. Point 11 is outside the Verification Gate section, so the gate stamp in `.claude/redline/checks.sh` does not move. The section's `<!-- redline-unattended: v3 -->` marker stays: this is this checkout's own hand edit, and `templates/shape-spec-unattended.md` does not change.
4. Proof:
   - `grep -c "the plan approver and the teammate's review" README.md` prints `0` (was `1`).
   - `grep -c "shape-spec.md. and the teammate's review keep a change to them out of a run" README.md` prints `1` (was `0`).
   - `grep -c "plan approver" README.md` prints `7` (was `8`; the other seven lines are about ask rules, the Docs step, the allowed list and the snapshot, and stay).
   - `grep -c "plan approver" CLAUDE.md` prints `0` (was `1`).
   - `grep -c "so only point 11 of the unattended section" CLAUDE.md` prints `1` (was `0`).
   - `grep -c "plan approver" .claude/commands/agent-os/shape-spec.md` prints `0` (was `1`).
   - `grep -c "so only this point keeps them out of a plan" .claude/commands/agent-os/shape-spec.md` prints `1` (was `0`).
   - `grep -c "^11\. \*\*The guard and the hook\.\*\*" .claude/commands/agent-os/shape-spec.md` prints `1` (unchanged).
5. No harness reads these three sentences, so no case is added. Task 4's run checks that nothing else moved: `setup` stays at 468 passed, since its hand-edit case still finds "The guard and the hook" and its `--merge` case still reproduces the section; `gate` stays at 117 passed, since its last case checks this checkout's stamp.

**Docs (gate step 10):** none of the three files is under a Docs directory, and the README's Known limits bullet is itself the reader-facing text. No new config key, subcommand, allow rule or exit code.

**Commit:** `redline: R2-1 drop the plan approver from what keeps the guard and hook files out of a cached-mode run (#16)`

## Task 3: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings. Item 1 finishes R2-1 in its fourth file, so the commit names R2-1 when item 1 is applied. Item 3 needs no change.

**Files:**

- `agent-os/standards/scripts/guard.md` (line 9: item 1)
- `agent-os/standards/workflow/agents.md` (a new bullet after line 17: item 2)

Proof, for each item applied:

- Item 1: `grep -c "plan approver" agent-os/standards/scripts/guard.md` prints `0` (was `1`); `grep -c "the plan approver has no check that names them" agent-os/standards/scripts/guard.md` prints `1`.
- Item 2: `grep -c "credits a role only with a check its prompt carries" agent-os/standards/workflow/agents.md` prints `1` (was `0`).

If the approver approves neither item, change no file, and record "Standards retrospective: no changes" under Decisions in `shape.md` in the as-built commit. If item 1 is not approved, also record under Decisions that `guard.md:9` still names the plan approver, as a deviation from R2-1's planned change.

**Commit:** `redline: record the round 2 review lessons in the standards, finishing R2-1 (#16)`, or, when item 1 is not applied, `redline: record the round 2 review lessons in the standards (#16)`.

## Task 4: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-03-0852-65-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 468 passed, 0 failed, `gate` at 117 passed, 0 failed, and every other harness at its count before the round, because Tasks 2 and 3 add no case.

10. **Docs:** confirm each entry names its commit or its reason.
    - Task 2 (`README.md`, `CLAUDE.md`, `.claude/commands/agent-os/shape-spec.md`): none is under a Docs directory, and the README's Known limits bullet is itself the reader-facing text.
    - Task 3 (`agent-os/standards/scripts/guard.md`, `agent-os/standards/workflow/agents.md`): standards, not under a Docs directory.
    No new config key, subcommand, allow rule or exit code.
11. **Version:** `.claude-plugin/plugin.json` and the marketplace entry stay `0.1.0`. This PR is the exception, the first release (decision 3 of the #16 plan; shape.md, Unattended answer 3). The setup test's last cases prove the two agree.
12. **Standards retrospective:** Task 3, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder:** add an "As built" section to this file with each task's commit, the proof outputs, the gate's counts and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-03-0852-65-review-round-2/plan.md`, `agent-os/specs/2026-11-03-0852-65-review-round-2/shape.md`.

**Commit:** `redline: record PR #65 round 2 as built (#16)`
