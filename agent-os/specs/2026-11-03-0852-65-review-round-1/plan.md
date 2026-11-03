# PR #65 Review Round 1 — Plan

Shaped by Redline in unattended mode. Four findings. R1-2 is `fix`: README "Releases" commits the CHANGELOG entry before the tag, as Task 8 of the #16 plan does. R1-4 is `fix`: the `version <repoRoot>` header names a root `plugin.json` that is not JSON among its exit-2 cases. R1-3 (the guard and hook files when a run loads the cached release) and R1-1 (which reviewer flags a missing bump) went to the person, who decided both on 2026-11-03. R1-3: keep the precheck warning and correct three sentences to say the guard refuses its two files only when the checkout loads in place; the guard that protects them by manifest is left to a person (shape.md, Deferred). R1-1: the Redline reviewer reports a missing bump as a nit, with a Version bullet beside Docs.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-03-0852-65-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. The harnesses run through `.claude/redline/checks.sh`, so read its JSON (each check's `exit`, and its `N passed, M failed` line). The PR description gives the counts before this round: `tests/setup-test.sh` 468 passed, `tests/gate-test.sh` 117 passed. Neither fix task adds or changes a case, so every harness should end the round at its count before the round. If a count you see before Task 2 differs, record it under As built.

Version step: this round keeps `0.1.0`. Decision 3 of the #16 plan makes this PR the exception, the first release (shape.md, Unattended answer 2).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the findings' commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-03-0852-65-review-round-1/plan.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-1/shape.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-1/standards.md`
- `agent-os/specs/2026-11-03-0852-65-review-round-1/references.md`

**Commit:** `redline: save review round 1 spec for PR #65 (#16)`

## Task 2: R1-2 — commit the CHANGELOG entry before the tag in README "Releases"

**Files:** `README.md`.

1. `README.md`, line 210, the "Releases" paragraph under Contributing. Replace exactly this sentence:

   ```text
   After the merge, on `main`, clean, from the plugin root: `claude plugin tag --dry-run .`, then `claude plugin tag --push`, which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag; then the `CHANGELOG.md` entry, one heading for the version and one line per PR merged since the previous tag, grouped as the file says, committed on `main`.
   ```

   with:

   ```text
   After the merge, on `main`, from the plugin root: first the `CHANGELOG.md` entry, one heading for the version with the tag date and one line per PR merged since the previous tag, grouped as the file says, committed on `main`, so the tag names a commit that carries its own entry (`claude plugin tag` refuses a dirty tree, so the entry cannot wait uncommitted); then, on the clean tree, `claude plugin tag --dry-run .` and `claude plugin tag --push`, which validates the manifest, requires the two versions to agree, a clean tree and no `redline--v<version>` tag yet, and pushes the annotated tag.
   ```

   Change nothing else in the paragraph. In particular, leave the sentence before it, which holds "the reviewer treats a missing bump as a nit": Task 5 (R1-1) changes that clause in its own commit. Leave `CHANGELOG.md`, gate step 11 and the Files table row as they are. They say "at tag time" or "after the merge", which holds for either order. `agent-os/standards/process/release.md` changes only in Task 6, if approved.
2. Proof: `grep -c "so the tag names a commit that carries its own entry" README.md` prints `1` (was `0`); `grep -c "pushes the annotated tag; then the" README.md` prints `0` (was `1`); `grep -c "the reviewer treats a missing bump as a nit" README.md` prints `1` (unchanged).
3. No harness covers the README. The gate run in Task 7 is the check that nothing else moved.

**Docs (gate step 10):** `README.md` is the reader-facing text itself. No file under a Docs directory changes, and nothing adds a config key, subcommand, allow rule or exit code.

**Commit:** `redline: R1-2 commit the CHANGELOG entry before the tag in the README's Releases paragraph (#16)`

## Task 3: R1-4 — name a root plugin.json that is not JSON in the version header's exit-2 list

**Files:** `scripts/redline-setup.sh`.

1. `scripts/redline-setup.sh`, lines 122-123, the end of the `version <repoRoot>` paragraph in the header comment. Replace:

   ```text
   #       warning, and exits 1 when any part warns; 2 when checks.sh or shape-spec.md is missing or
   #       settings.json is not JSON or has a byte-order mark.
   ```

   with:

   ```text
   #       warning, and exits 1 when any part warns; 2 when checks.sh or shape-spec.md is missing,
   #       settings.json is not JSON or has a byte-order mark, or
   #       <repoRoot>/.claude-plugin/plugin.json is not JSON.
   ```

   Keep the seven spaces after `#` on each line. Change nothing else. Leave line 121 above it, the general "Exit codes" paragraph (lines 141-145, which already says "a file that is not JSON"), `usage()` and every line of code as they are.
2. Proof: `grep -c "plugin.json is not JSON" scripts/redline-setup.sh` prints `2` (was `1`, the `die2` at line 1460); `grep -c "byte-order mark, or" scripts/redline-setup.sh` prints `1` (was `0`); `bash -n scripts/redline-setup.sh` exits 0.
3. No new case. The behaviour the header now states is already pinned: `tests/setup-test.sh:806`, "a root whose manifest is not JSON: exit 2". The setup count stays at its count before the round (468 passed, 0 failed) in Task 7's run.

**Docs (gate step 10):** `scripts/redline-setup.sh`: no reader-facing change. The README's `redline-setup.sh` table row for `version <repoRoot>` (line 349) already names "a `settings.json` or root `plugin.json` that is not JSON" among the exit-2 cases; the header now matches it. No new config key, subcommand, flag, allow rule, JSON key or exit code.

**Commit:** `redline: R1-4 name a root plugin.json that is not JSON in the version header's exit-2 list (#16)`

## Task 4: R1-3 — say the guard refuses its own two files only when the checkout loads in place

Decided by the person (shape.md, Decisions, R1-3: "Keep the warning, correct the docs"; Decided by: @michaelfromtheoutfit). The launch precheck keeps its warning; `skills/redline/SKILL.md` does not change. Three sentences change, one per file. The guard that protects the two files by manifest is a person's change, outside the run (shape.md, Deferred, R1-3): no task touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `tests/guard-cases.tsv` or `tests/guard-test.sh`.

**Files:** `README.md`, `CLAUDE.md`, `.claude/commands/agent-os/shape-spec.md`.

1. `README.md`, line 221, the Known limits bullet "A run on this repository runs the PR's own code only when the plugin loads in place." Replace exactly this sentence:

   ```text
   The guard script and the hook registration are refused for every role here, so a run cannot loosen the guard that vets it; everything else the PR changes is what runs.
   ```

   with:

   ```text
   Loaded in place, the guard refuses the guard script and the hook registration to every role here, so a run cannot loosen the guard that vets it, and everything else the PR changes is what runs. Loaded from a cached release, the guard treats this checkout as an ordinary repository and does not refuse those two files: only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md`, the plan approver and the teammate's review keep a change to them out of a run, behind the precheck's warning.
   ```

   Change nothing else in the bullet.
2. `CLAUDE.md`, line 57, the bullet under "This repository" that opens "**Every guard change updates `tests/guard-cases.tsv`**". Replace exactly:

   ```text
   the guard refuses them for every role even when this repository is the one under review.
   ```

   with:

   ```text
   when this checkout loads in place, the guard refuses them for every role even when this repository is the one under review; loaded from a cached release, it treats this checkout as an ordinary repository and does not refuse them, so point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the plan approver are what keep them out of a run.
   ```

   The start of the sentence ("`scripts/redline-guard.sh` and `hooks/hooks.json` are changed by a person, never by a Redline run:") and the rest of the file stay as they are.
3. `.claude/commands/agent-os/shape-spec.md`, line 70, point 11 of the unattended section. Replace exactly:

   ```text
   In this repository the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` to every role, so a finding whose fix is in either file is `defer`, never `fix`: a person makes the change after the run.
   ```

   with:

   ```text
   In this repository, when the checkout loads in place, the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` to every role; loaded from a cached release, it treats the checkout as an ordinary repository and does not refuse them, so this point and the plan approver are what keep them out of a plan. Either way a finding whose fix is in either file is `defer`, never `fix`: a person makes the change after the run.
   ```

   Keep the point's title, `11. **The guard and the hook.**`, which `tests/setup-test.sh:599` reads as a hand edit, and the rest of the point as it is. Point 11 is outside the Verification Gate section, so the gate stamp in `.claude/redline/checks.sh` does not move. The section's `<!-- redline-unattended: v3 -->` marker stays: this is this checkout's own hand edit, and `templates/shape-spec-unattended.md` does not change.
4. Proof:
   - `grep -c "Loaded from a cached release, the guard treats this checkout as an ordinary repository" README.md` prints `1` (was `0`); `grep -c "are refused for every role here" README.md` prints `0` (was `1`).
   - `grep -c "loaded from a cached release, it treats this checkout as an ordinary repository" CLAUDE.md` prints `1` (was `0`); `grep -c "when this checkout loads in place, the guard refuses them for every role" CLAUDE.md` prints `1` (was `0`).
   - `grep -c "loaded from a cached release, it treats the checkout as an ordinary repository" .claude/commands/agent-os/shape-spec.md` prints `1` (was `0`); `grep -c "In this repository the guard refuses" .claude/commands/agent-os/shape-spec.md` prints `0` (was `1`); `grep -c "^11\. \*\*The guard and the hook\.\*\*" .claude/commands/agent-os/shape-spec.md` prints `1` (unchanged).
5. No harness reads these three sentences (no test greps them). No case is added; Task 7's run is the check that nothing else moved: `setup` stays at 468 passed (its hand-edit case still finds "The guard and the hook") and `gate` at 117 passed (its last case checks this checkout's stamp).

**Docs (gate step 10):** none of the three files is under a Docs directory; the README's Known limits bullet is the reader-facing text itself. No new config key, subcommand, allow rule or exit code.

**Commit:** `redline: R1-3 say the guard refuses its own two files only when the checkout loads in place (#16)`

## Task 5: R1-1 — the Redline reviewer reports a missing version bump as a nit

Decided by the person (shape.md, Decisions, R1-1: "The Redline reviewer"; Decided by: @michaelfromtheoutfit). The reviewer learns the check, with the exception for a PR whose spec keeps the version on purpose, and the gate and the README name it. `agent-os/standards/process/release.md` line 5 changes only in Task 6, if approved (retrospective item 3).

**Files:** `agents/redline-reviewer.md`, `.claude/commands/agent-os/shape-spec.md`, `README.md`.

1. `agents/redline-reviewer.md`: insert one bullet directly after the Docs bullet (line 34, "- **Docs.** In a repository whose Verification Gate has a Docs step ...") and before the "Judgment calls are returned, never decided" bullet:

   ```text
   - **Version.** In a repository whose Verification Gate has a Version step (read `.claude/commands/agent-os/shape-spec.md`), on a whole-PR review, a PR that leaves the `version` in `.claude-plugin/plugin.json` equal to the base branch's is a `nit` on that file's `version` line, whose `proposedFix` names the bump the step asks for: minor, with the template markers it touches, when the change alters what a setup rerun writes; major for a contract change a rerun cannot carry; patch otherwise. Read the base branch's name (`baseRefName`) from `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh pr <pr>`, then its manifest with `git show origin/<base>:.claude-plugin/plugin.json`. The `version` line may sit outside the diff: the post moves a comment it cannot anchor into the review body. The exception is a PR whose spec (a `plan.md` or `shape.md` the PR adds under `agent-os/specs/`) records keeping the version on purpose, as #16 keeps `0.1.0` for the first release: that is no finding.
   ```

   Change nothing else in the file. The bullet follows the file's rules for commands: literal arguments, no `$` in a Bash call (`${CLAUDE_PLUGIN_ROOT}` is the form the file already uses at line 18), one command per call.
2. `.claude/commands/agent-os/shape-spec.md`, line 252, gate step 11 (**Version**). Replace exactly:

   ```text
   The reviewer treats a missing bump as a nit.
   ```

   with:

   ```text
   The Redline reviewer reports a missing bump as a nit, except in a PR whose spec keeps the version on purpose.
   ```

   Prose only: no backticked span or fenced block in the step changes, so the gate hash and the stamp in `.claude/redline/checks.sh` do not move (`scripts/redline-gate.sh`: prose outside backticks never changes it). Change nothing else in the step.
3. `README.md`, line 210, the "Releases" paragraph under Contributing, the sentence before the one Task 2 rewrote. Replace exactly:

   ```text
   patch otherwise; the reviewer treats a missing bump as a nit.
   ```

   with:

   ```text
   patch otherwise; the Redline reviewer reports a missing bump as a nit, except in a PR whose spec keeps the version on purpose.
   ```

   Change nothing else in the paragraph; Task 2's sentence after it stays as Task 2 left it.
4. Proof:
   - `grep -c "^- \*\*Version\.\*\*" agents/redline-reviewer.md` prints `1` (was `0`).
   - `grep -c "The Redline reviewer reports a missing bump as a nit" .claude/commands/agent-os/shape-spec.md` prints `1` (was `0`); `grep -c "The reviewer treats a missing bump as a nit" .claude/commands/agent-os/shape-spec.md` prints `0` (was `1`).
   - `grep -c "the Redline reviewer reports a missing bump as a nit" README.md` prints `1` (was `0`); `grep -c "the reviewer treats a missing bump as a nit" README.md` prints `0` (was `1`).
5. No harness reads a role's prompt (`tests/loop-test.mjs` reads only `workflows/redline-loop.js`), so no case is added and none can pin the bullet; the grep counts are the proof. Task 7's run shows `gate` at 117 passed, whose last case checks this checkout's stamp after the step 11 rewording.

**Docs (gate step 10):** `agents/redline-reviewer.md`: README Contributing, "Releases", the sentence naming the Redline reviewer, updated in this task's commit (step 3). The Files table row for `agents/redline-*.md` is unchanged: no role is added. No new config key, subcommand, allow rule or exit code.

**Version step:** the round still keeps `0.1.0` (shape.md, Unattended answer 2); this PR's own spec records that, so the new bullet's exception covers it.

**Commit:** `redline: R1-1 the Redline reviewer reports a missing version bump as a nit (#16)`

## Task 6: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings. Items 3 (R1-1) and 4 (R1-3) are drafted for the person's decisions.

**Files:**

- `agent-os/standards/process/release.md` (line 8: item 1; line 5: item 3)
- `agent-os/standards/scripts/guard.md` (line 9: item 4)

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the round 1 review lessons in the standards (#16)`

## Task 7: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-03-0852-65-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 468 passed, 0 failed, `gate` at 117 passed, 0 failed, and every other harness at its count before the round: Tasks 2 to 5 add no case.

10. **Docs:** confirm each entry names its commit or its reason:
    - Task 2 (`README.md`): the reader-facing text itself; not a Docs directory.
    - Task 3 (`scripts/redline-setup.sh`): no reader-facing change, since the README's `redline-setup.sh` table row for `version <repoRoot>` already names the case.
    - Task 4 (`README.md`, `CLAUDE.md`, `.claude/commands/agent-os/shape-spec.md`): none is under a Docs directory; the README's Known limits bullet is the reader-facing text itself.
    - Task 5 (`agents/redline-reviewer.md`): README Contributing, "Releases", updated in Task 5's commit.
    No new config key, subcommand, allow rule or exit code.
11. **Version:** `.claude-plugin/plugin.json` and the marketplace entry stay `0.1.0`. This PR is the exception, the first release (decision 3 of the #16 plan; shape.md, Unattended answer 2). The setup test's last cases prove the two agree.
12. **Standards retrospective:** Task 6, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder:** add an "As built" section to this file with each task's commit, the proof outputs, the gate's counts and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-03-0852-65-review-round-1/plan.md`, `agent-os/specs/2026-11-03-0852-65-review-round-1/shape.md`.

**Commit:** `redline: record PR #65 round 1 as built (#16)`

---

## As built

Built as planned, one commit per task, on top of `3587774`.

| Task | Finding | Commit | Message |
|---|---|---|---|
| 1 | spec | `abc1e08` | `redline: save review round 1 spec for PR #65 (#16)` |
| 2 | R1-2 | `e522439` | `redline: R1-2 commit the CHANGELOG entry before the tag in the README's Releases paragraph (#16)` |
| 3 | R1-4 | `7536d4f` | `redline: R1-4 name a root plugin.json that is not JSON in the version header's exit-2 list (#16)` |
| 4 | R1-3 | `4884677` | `redline: R1-3 say the guard refuses its own two files only when the checkout loads in place (#16)` |
| 5 | R1-1 | `57664a5` | `redline: R1-1 the Redline reviewer reports a missing version bump as a nit (#16)` |
| 6 | R1-1, R1-2 | `a3d420b` | `redline: record the round 1 review lessons in the standards, finishing R1-1 and R1-2 (#16)` |
| 7 | as built | this commit | `redline: record PR #65 round 1 as built (#16)` |

**Proofs.** Every grep count came out as the plan says:

- Task 2: `so the tag names a commit that carries its own entry` 1; `pushes the annotated tag; then the` 0; `the reviewer treats a missing bump as a nit` 1 (before Task 5).
- Task 3: `plugin.json is not JSON` 2; `byte-order mark, or` 1.
- Task 4: README `Loaded from a cached release, the guard treats this checkout as an ordinary repository` 1, `are refused for every role here` 0; CLAUDE.md `loaded from a cached release, it treats this checkout as an ordinary repository` 1, `when this checkout loads in place, the guard refuses them for every role` 1; shape-spec.md `loaded from a cached release, it treats the checkout as an ordinary repository` 1, `In this repository the guard refuses` 0, `^11\. \*\*The guard and the hook\.\*\*` 1.
- Task 5: reviewer `^- \*\*Version\.\*\*` 1; shape-spec.md `The Redline reviewer reports a missing bump as a nit` 1, `The reviewer treats a missing bump as a nit` 0; README `the Redline reviewer reports a missing bump as a nit` 1, `the reviewer treats a missing bump as a nit` 0.

**Task 6.** All three approved edits were applied as written: `release.md` line 5 (item 3, R1-1) and line 8 (item 1, R1-2), and `guard.md` line 9 (item 4, R1-3). The commit names R1-1 and R1-2, whose fixes the plan sends partly through the retrospective (shape.md: R1-2, "The change"; R1-1, option 1's cost, and Task 5). Item 4 is a lesson: R1-3's mitigation is Task 4's three sentences, so the commit does not name it. Headings unchanged.

**Gate (Task 7).** `checks.sh` with the round's snapshot exited 0 on its first run: `syntax` 0, `validate` 0 (the usual CLAUDE.md-at-root and missing-icon warnings), `guard` 588 passed, 0 mismatched, `loop` 495 passed, 0 failed, `prefs` 101 passed, 0 failed, `gate` 117 passed, 0 failed (this checkout's stamp still matches after the step 11 rewording), `setup` 468 passed, 0 failed (the hand-edit case still finds "The guard and the hook"), `gh` 113 passed, 0 failed, `background` 39 passed, 0 failed. No `unexpected_files`, nothing `uncommitted`. Every count is the same as before the round.

**Docs (gate step 10).** As planned: Task 2, Task 4: the README is the reader-facing text; Task 3: no reader-facing change, since the README's `version <repoRoot>` row already lists the case; Task 5: README Contributing, "Releases", in `57664a5`.

**Version (gate step 11).** `.claude-plugin/plugin.json` and the marketplace entry stay `0.1.0`; the setup test's last cases pass.

**Deviation.** Task 3's proof `bash -n scripts/redline-setup.sh` was not run on its own: the guard refuses `bash` to the implementer except as `bash -c <string>`. The gate's `syntax` check runs `bash -n` over every script under `scripts/`, this one included, and exited 0. Recorded under Decisions in `shape.md`.
