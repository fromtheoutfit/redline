# PR #83 review round 2: the post-tag walk that closes #76, and the bypass clause in the release standard

Spec folder: `agent-os/specs/2026-11-09-1423-83-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #83 (issue #76), from the round's two findings (`redline/round-2-findings.json`). R2-2 is `fix`. R2-1 was a judgment call, decided as "Bump the patch version" (`shape.md`, Decision 2). Line numbers are at `37c22f9`, the PR head this round reviewed.

No test reads `agent-os/standards/process/release.md` or a spec folder (`shape.md`, Unattended answer 7), so the proof is a set of plain `grep` counts, and the gate shows that nothing else moved. Every command below is a plain pipeline, run from the repository root.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-09-1423-83-review-round-2/` with four files. `plan.md` is this plan. `shape.md` holds the scope, the decisions with owners, the judgment call as the person saw it, the unattended answers and the proposed standards retrospective. `standards.md` holds the applied standards as they read at shaping time. `references.md` lists the code studied. No `visuals/`. The `redline/` subfolder is Redline's own record and is not touched.

Files: the four files above (already written by the shaper).

**Docs entry:** spec folder only; no reader-facing change.

## Task 2: R2-2, move the bypass clause out of the probe's comparison, through the standards retrospective

Apply `shape.md`'s "Standards retrospective (proposed)" item 1, as the standards approver approves it, in the round's one standards commit, whose message names R2-2 (`redline: record the round 2 review lessons in the standards, finishing R2-2 (#76)`). `shape.md`, Unattended answer 3, says why a standards correction goes this way. If the approver rejects the item, nothing lands and the task goes under `blocked`.

Files:

- `agent-os/standards/process/release.md`

Change, line 12, two replacements:

1. Replace

   ```
   written under plain `claude`; bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). The main session's own Writes
   ```

   with

   ```
   written under plain `claude`. The main session's own Writes
   ```

2. Replace

   ```
   in either mode. One launcher Write
   ```

   with

   ```
   in either mode. Bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). One launcher Write
   ```

Proof, each printing the count shown:

- `grep -c "written under plain .claude.; bypass-permissions" agent-os/standards/process/release.md` prints `0` (was `1`).
- `grep -c "written under plain .claude.. The main session's own Writes passed in both" agent-os/standards/process/release.md` prints `1`.
- `grep -c "in either mode. Bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). One launcher Write" agent-os/standards/process/release.md` prints `1`.

Neighbours that must not change: `grep -c "on a fresh launch and, before the Resume or Start fresh question, on a resume" agent-os/standards/process/release.md` prints `1`, `grep -c "^# Release" agent-os/standards/process/release.md` prints `1`, and `grep -c "^- " agent-os/standards/process/release.md` prints `8`.

**Docs entry:** `agent-os/standards/` is not under a Docs-step directory; no reader-facing change.

## Task 3: R2-1, bump the patch version to 0.2.1, and say so in the #76 spec

The person chose "Bump the patch version" (`shape.md`, Decision 2). 0.2.0 is never tagged. This reverses Decision 4 of the #76 spec and round 1's Decision 5; round 1's spec folder is the record of that round and is not edited.

No `pr-body.md` is written: the author redrafts the PR description's version sentence by hand after the run, so this round's spec folder must not hold that file (`workflows/redline-loop.js:2915` would post it).

Files:

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `CHANGELOG.md`
- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md`
- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/plan.md`

Change, the version:

1. `.claude-plugin/plugin.json:4` and `.claude-plugin/marketplace.json:11`: `"version": "0.2.0"` becomes `"version": "0.2.1"`. Nothing else in either file moves.
2. `CHANGELOG.md:5`: `## 0.2.0` becomes `## 0.2.1`. The groups under it, with the #80 and #83 lines, stay as they are.

Change, `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md`:

3. Line 16 (Decision 4): after "once the PR number exists." add " Reversed by #83 round 2, R2-1: an install already on 0.2.0 from the #80 merge would not move, so both manifests went to 0.2.1, 0.2.0 is never tagged, and the CHANGELOG heading is 0.2.1."
4. Line 23 (Decision 8): replace "After the 0.2.0 tag: one real installed-release session, the last item before #76 closes. The only installed release today is 0.1.0, which has no warning code and would pass vacuously." with "After the 0.2.1 tag: one real installed-release session, the last item before #76 closes. An install still on 0.2.0 from the #80 merge has no warning code and would pass vacuously, so the session counts only on an install moved to 0.2.1 by `claude plugin update` (#83, R2-1)."
5. Line 42: "after the 0.2.0 tag" becomes "after the 0.2.1 tag".

Change, `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/plan.md`:

6. Line 14: after "once the PR number exists." add " Reversed by #83 round 2, R2-1: both manifests are 0.2.1 and the CHANGELOG heading is 0.2.1."
7. Line 20: replace "After the 0.2.0 tag: one real installed-release session, the last item before #76 closes, because 0.1.0 has no warning code and would pass vacuously." with "After the 0.2.1 tag: one real installed-release session, the last item before #76 closes, because an install still on 0.2.0 from the #80 merge has no warning code and would pass vacuously (#83, R2-1)."
8. Line 54: "under `## 0.2.0`" becomes "under `## 0.2.1`".
9. Line 73: "after the 0.2.0 tag" becomes "after the 0.2.1 tag".
10. Line 90: replace "kept at 0.2.0 on purpose; both manifests agree." with "kept at 0.2.0 on purpose when built, moved to 0.2.1 by #83 round 2, R2-1; both manifests agree."
11. Line 91: "waits for the 0.2.0 tag" becomes "waits for the 0.2.1 tag".

Proof, each printing the count shown (`S` below stands for `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning`; write the path out in the command):

- `grep -c '"version": "0.2.1"' .claude-plugin/plugin.json` prints `1`, and the same for `.claude-plugin/marketplace.json`.
- `grep -c '"version": "0.2.0"' .claude-plugin/plugin.json` prints `0`, and the same for `.claude-plugin/marketplace.json`.
- `grep -c "^## 0\.2\.1$" CHANGELOG.md` prints `1`, and `grep -c "^## 0\.2\.0" CHANGELOG.md` prints `0`.
- `grep -c "0\.2\.0 tag" S/shape.md` prints `0` and `grep -c "0\.2\.0 tag" S/plan.md` prints `0`.
- `grep -c "0\.2\.1 tag" S/shape.md` prints `2` and `grep -c "0\.2\.1 tag" S/plan.md` prints `3`.
- `grep -c "The only installed release today is 0\.1\.0" S/shape.md` prints `0`.
- `grep -c "Reversed by #83 round 2, R2-1" S/shape.md` prints `1` and the same for `S/plan.md`.
- The gate's `tests/setup-test.sh` still passes "the marketplace entry carries the same version" (Task 4).

Neighbours that must not change: `grep -c "^- #80 " CHANGELOG.md` prints `1`, `grep -c "^- #83 " CHANGELOG.md` prints `1`, and `grep -c "^## 0\.1\.0 (2026-11-03)$" CHANGELOG.md` prints `1`.

**Docs entry:** `CHANGELOG.md`'s heading is the one reader-facing change, and this task makes it. The two manifests are a version string only; `README.md`, `docs/` and `CONTRIBUTING.md` name no 0.2.0, and `docs/upgrading.md` names no release number. The #76 spec files: spec folder only; no reader-facing change.

## Task 4: Verification Gate

Files: `agent-os/standards/process/release.md` (step 4's standards commit; Task 2 is that commit), and this spec folder's `plan.md` and `shape.md` (step 5).

1. Steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-09-1423-83-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. Every harness stays at its prior count: no task adds or removes a case. `tests/setup-test.sh`'s last cases read the two manifests Task 3 moves, and pass at 0.2.1.
2. Step 10, Docs: each task's Docs entry above names its section or its reason, and is confirmed against the task's commit.
3. Step 11, Version: `0.2.1` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, moved by Task 3 (`shape.md`, Decision 2), and the two agree. R2-2 moves no version of its own (`shape.md`, Decision 3).
4. Step 12, Standards retrospective: apply the list under `## Standards retrospective (proposed)` in `shape.md`, as the standards approver approves it, in its own commit. Item 1 is Task 2's change. Item 2 is the sentence drafted for R2-1, on line 9 of `agent-os/standards/process/release.md`, and adds no bullet, so Task 2's count stays `8`; if the approver rejects it, Task 2's change still lands. Item 3 changes nothing.
5. Step 13, Spec folder: `plan.md` reflects what was built; any deviation is recorded under Decisions in `shape.md`.

## As built

Built as planned, with no deviation.

- Task 1: the four spec files, `0e177a6`. The `redline/` subfolder is not in it.
- Task 3 (R2-1): `e14ebe4`. Both manifests and the CHANGELOG heading read 0.2.1, and the #76 spec's lines are corrected. Every count under the task printed as shown. No `pr-body.md` is in this folder; the author redrafts the PR description's version sentence by hand after the run.
- Task 2 (R2-2): `c90356f`, the round's one standards commit, which also carries retrospective item 2 (line 9, the lesson from R2-1). Every count under the task printed as shown, including the eight bullets. Item 3 changed nothing.
- Task 4: `checks.sh` passed all nine checks with no unexpected or uncommitted file. Docs (step 10): each task's Docs entry stands as written. Version (step 11): 0.2.1 in both manifests, and they agree.
- Step 13: at the plan approver's note, Decision 3 in `shape.md` now says its sentence on the PR keeping `0.2.0` is stale after Decision 2.
