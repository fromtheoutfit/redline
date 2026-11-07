# PR #80 review round 5: the done rule and what a clean run means, in the README, the plugin descriptions and the mission

Spec folder: `agent-os/specs/2026-11-07-0806-80-review-round-5/`

Shaped by Redline in unattended mode, for review round 5 of PR #80 (issue #79), from the round's one finding (`redline/round-5-review.json`, `redline/round-5-findings.json`). This is the final nit round: the round has no correctness finding.

- R5-1 (nit, `needsDecision`), decided by the person as option A (`shape.md`, Decision 1; decided by @michaelfromtheoutfit). The README's opening line and both plugin descriptions still say Redline hands the PR over "once no correctness bugs remain", which the PR description's done rule answers. "What a clean run means" in Known limits and the product mission still promise more than a clean run checks since verify-only and R3-4. Task 2 rewords all four files with the exact text of each edit.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the finding it fixes, files staged by name. Line numbers are at `61068fc`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-07-0806-80-review-round-5/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter. Counts before this round, from round 4's As built at `61068fc`: `guard` 592, `loop` 581, `gh` 114, `prefs` 101, `gate` 117, `setup` 468, `background` 39. Task 2 adds or changes no case, so every count stays. The first gate run's counts are the evidence: record any difference under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding's commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-07-0806-80-review-round-5/plan.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-5/shape.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-5/standards.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-5/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 5 spec for PR #80 (#79)`

## Task 2: R5-1, state the done rule and what a clean run checks in the README, the plugin descriptions and the mission

Decided by the person: option A, reword the README, both plugin descriptions and the mission (`shape.md`, Decision 1; decided by @michaelfromtheoutfit). The README, both plugin descriptions and the product mission state the done rule, that a round confirms no new correctness finding; the README's "What a clean run means" and the mission's "Honest about its reach" say what a clean run checked and that it is not a promise that no correctness bug remains, so the mission and the README's Known limits it cites agree. Edits E1 to E5 below land in one commit.

**Files:**

- `README.md` (line 3, E1; line 100, E4)
- `.claude-plugin/plugin.json` (line 5, E2)
- `.claude-plugin/marketplace.json` (line 13, E3)
- `agent-os/product/mission.md` (lines 9, 13 and 17, E5). It is outside the PR's diff; it is named here so it reaches the snapshot's `plan_paths`.

No test file changes: no harness reads these lines (`shape.md`, Proportionality), so the proof is the `grep` counts below and the gate's `validate` step, which parses both manifests.

**The done-rule edits** (the part the evidence answers, `shape.md`, Unattended answer 4). The PR description states the done rule: "a round whose verifier confirms no new correctness finding ends the run". The skill's description, the workflow's meta, the README's loop paragraph and `docs/running.md` already use those words. Three places do not:

- **E1. `README.md` line 3.** Replace "and hands the PR to a teammate once no correctness bugs remain." with "and hands the PR to a teammate once a round confirms no new correctness finding." The rest of the line is unchanged.
- **E2. `.claude-plugin/plugin.json` line 5** (`description`). Replace "re-review the fixes, and hand the PR to a teammate once no correctness bugs remain." with "re-review the whole PR and the fixes, and hand the PR to a teammate once a round confirms no new correctness finding." The sentence before it and "One command, /redline:redline <pr>, with a per-role command guard on every agent." after it are unchanged.
- **E3. `.claude-plugin/marketplace.json` line 13** (the plugin entry's `description`). The same replacement as E2. The marketplace's own `description` (line 7) and the `version` (line 11) are unchanged.

**The clean-run edits** (the part the person decided, option A):

- **E4. `README.md` line 100**, the Known limits bullet "What a clean run means". Replace its first sentence, "No correctness bug in the changed code that the reviewer could read or reproduce.", with:

  ```text
  A round's verifier confirmed no new correctness finding: no candidate of that round's coverage pass, and nothing in the fix diff it rechecked, was a bug it could reproduce or trace that was not already reported, settled, carried or tracked ([docs/running.md](docs/running.md), "Rounds", step 7). That is not a promise that no correctness bug remains. With the pass on, the reviewer verifies the candidates and runs no discovery pass of its own, so a bug no pass sampled is never read (see "Each coverage pass is a sample" below). A finding the run deferred is listed under Deferred in the handoff, and a decided finding the verifier still reproduced under For the person, naming the earlier id (#80, R3-4). With `coverage off`, it means no correctness bug in the changed code that the reviewer could read or reproduce.
  ```

  The rest of the bullet, from "It says nothing about the change running at the same time" to "concurrency belongs to the human review.", is unchanged. The heading `## Known limits` stays: the handoff links it (`process/docs-gate`).
- **E5. `agent-os/product/mission.md`**, three sentences:
  - Line 9: replace "Redline hands the PR to them once a round finds no correctness bug," with "Redline hands the PR to them once a round confirms no new correctness finding,". The rest of the line is unchanged.
  - Line 13: replace "and re-reviews the fix diff until a round finds no correctness bug." with "and re-reviews the whole PR and the fix diff until a round confirms no new correctness finding.". The rest of the bullet is unchanged.
  - Line 17: replace "A clean run means no correctness bug in the changed code that the reviewer could read or reproduce." with "A clean run means a round confirmed no new correctness finding among what its coverage pass sampled and its recheck of the fixes read, not that no bug remains: what the run found and did not fix (deferred, or decided and kept by a person) is listed in the handoff." The bullet's title, "**Honest about its reach.**", and its last sentence, "Concurrency between the change and scheduled or queued work still belongs to the human review (README, Known limits).", are unchanged.

The decision rewords neither E4 nor E5, so the text above is the text that lands. The options B and C the person did not choose, and the shaper's recommendation, are recorded in `shape.md`, Decision 1.

**Effect:** every place a reader meets the done rule says "a round confirms no new correctness finding". "What a clean run means", which the handoff links, and the mission's "Honest about its reach" both say what a clean run checked, and that what the run deferred or a person kept is listed in the handoff. The `coverage off` meaning is kept and stated as such. No version change (`shape.md`, Decision 2).

### Proof

Each command prints the count shown. A count was `0` before unless it says otherwise.

- The done-rule edits (E1 to E3):
  - `grep -c "once no correctness bugs remain" README.md` prints `0` (was `1`).
  - `grep -c "once no correctness bugs remain" .claude-plugin/plugin.json` prints `0` (was `1`).
  - `grep -c "once no correctness bugs remain" .claude-plugin/marketplace.json` prints `0` (was `1`).
  - `grep -c "once a round confirms no new correctness finding" README.md` prints `1`.
  - `grep -c "once a round confirms no new correctness finding" .claude-plugin/plugin.json` prints `1`.
  - `grep -c "once a round confirms no new correctness finding" .claude-plugin/marketplace.json` prints `1`.
  - `grep -c "re-review the whole PR and the fixes" .claude-plugin/plugin.json` prints `1`, and the same in `.claude-plugin/marketplace.json` prints `1`.
  - Neighbours, unchanged: `grep -c "with a per-role command guard on every agent" .claude-plugin/plugin.json` prints `1`; `grep -c "0.2.0" .claude-plugin/plugin.json` prints `1`; `grep -c "0.2.0" .claude-plugin/marketplace.json` prints `1`.
- The README's clean-run line (E4):
  - `grep -c "No correctness bug in the changed code that the reviewer could read or reproduce" README.md` prints `0` (was `1`).
  - `grep -c "runs no discovery pass of its own, so a bug no pass sampled is never read" README.md` prints `1`.
  - `grep -c "With .coverage off., it means no correctness bug in the changed code" README.md` prints `1`.
  - Neighbour, unchanged: `grep -c "Until a seed shows the check working, concurrency belongs to the human review." README.md` prints `1`.
- The mission (E5):
  - `grep -c "finds no correctness bug" agent-os/product/mission.md` prints `0` (was `2`).
  - `grep -c "confirms no new correctness finding" agent-os/product/mission.md` prints `2`.
  - `grep -c "not that no bug remains" agent-os/product/mission.md` prints `1`.
  - `grep -c "no correctness bug in the changed code" agent-os/product/mission.md` prints `0` (was `1`).
  - Neighbours, unchanged: `grep -c "Honest about its reach" agent-os/product/mission.md` prints `1`; `grep -c "Concurrency between the change and scheduled or queued work still belongs to the human review (README, Known limits)." agent-os/product/mission.md` prints `1`.
- The commit: `git diff --name-only HEAD~1 HEAD` lists exactly `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, `README.md` and `agent-os/product/mission.md`.

**Docs entry:**
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: the README's opening paragraph (line 3) states the same done rule and is reworded in this same commit (E1). No new config key, subcommand, allow rule or exit code. `CHANGELOG.md` is written at tag time (`process/release`).
- `README.md` and `agent-os/product/mission.md` are not under a Docs-step directory; the README edit is itself the reader-facing change.

**Commit:** `redline: R5-1 state the done rule and what a clean run checks in the README, the plugin descriptions and the mission (#79)`

## Task 3: Verification Gate

**Files:**

- `agent-os/specs/2026-11-07-0806-80-review-round-5/plan.md` and `agent-os/specs/2026-11-07-0806-80-review-round-5/shape.md` (step 13).
- `agent-os/standards/process/docs-gate.md` (step 12), only if the standards approver approves retrospective item 1.

1. Steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-07-0806-80-review-round-5/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expected counts: every harness at its count before the round (see the top of this plan), since Task 2 adds or changes no case. `validate` (step 2) parses both manifests after E2 and E3.
2. Step 10, Docs: Task 2's Docs entry names its section or its reason, and is confirmed against Task 2's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the minor version, and Task 2 does not change what a setup rerun writes (`shape.md`, Decision 2). The setup test's last cases prove the two agree.
4. Step 12, Standards retrospective: the items the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved, in one commit of their own after Task 2's. Item 1 was held for R5-1 and is drafted for the person's choice, option A (`shape.md`, Standards retrospective (proposed), item 1); it inserts one bullet after line 14 of `agent-os/standards/process/docs-gate.md` and changes that file only. Keep every heading: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`, and `git diff --name-only HEAD~1 HEAD` lists only `agent-os/standards/process/docs-gate.md`. The commit names R5-1: `redline: R5-1 record that a done-rule change rewords every statement of it in the standards (#79)`. If nothing is approved, make no commit, and "Standards retrospective: no changes" goes under Decisions in this folder's `shape.md`.
5. Step 13, Spec folder: add an "As built" section to this file. It records the person's choice for R5-1 and its owner, each task's commit, the proof outputs, the gate's counts, and which retrospective items the approver approved, declined or deferred. It also records any deviation, which goes under Decisions in `shape.md` too. This lands in the round's last commit.

**Commit:** `redline: record PR #80 round 5 as built (#79)`
