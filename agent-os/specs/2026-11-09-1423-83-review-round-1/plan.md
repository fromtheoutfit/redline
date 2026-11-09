# PR #83 review round 1: where the inline-session warning is said, its wording, and the spec's record

Spec folder: `agent-os/specs/2026-11-09-1423-83-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #83 (issue #76), from the round's six findings (`redline/round-1-findings.json`). Four are `fix`: R1-1, R1-2, R1-4 and R1-5. Two were judgment calls the person has decided: R1-6 and R1-3 (`shape.md`, Decisions 7 and 8; Tasks 6 and 7). Each fix task is one commit whose message names its finding id, following "Git rules for Redline agents" in `README.md`. Line numbers are at `00b04f3`, the PR head this round reviewed.

No test reads `skills/redline/SKILL.md`, `CONTRIBUTING.md` or a spec folder (a search of `tests/`, `workflows/`, `scripts/`, `agents/` and `templates/` for the sentences below finds nothing), so each proof is a set of plain `grep` counts, and the gate shows that nothing else moved. Every command below is a plain pipeline.

R1-5 comes before R1-4, against finding order: R1-5's clause is inside the sentence R1-4 moves, so taking the clause out first gives each finding its own commit (`shape.md`, Decision 6).

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-09-1423-83-review-round-1/` with four files. `plan.md` is this plan. `shape.md` holds the scope, the decisions with owners, the proportionality table, the unattended answers and the proposed standards retrospective. `standards.md` holds the applied standards as they read at shaping time. `references.md` lists the code studied. No `visuals/`. The `redline/` subfolder is Redline's own record and is not touched.

Files: the four files above (already written by the shaper).

**Docs entry:** spec folder only; no reader-facing change.

## Task 2: R1-1, name `--plugin-dir` in the sentence the new text separated from it

Files:

- `CONTRIBUTING.md`

Change: in "Developing the plugin" (line 7), replace "The launch precheck warns when this repository is reviewed without it (" with "The launch precheck warns when this repository is reviewed without `--plugin-dir` (". Nothing else on the line moves.

Proof: `grep -c "reviewed without it" CONTRIBUTING.md` prints `0`, and `grep -c "reviewed without .--plugin-dir" CONTRIBUTING.md` prints `1`. Neighbour that must not change: `grep -c "An installed release runs clean" CONTRIBUTING.md` prints `1`.

**Docs entry:** `CONTRIBUTING.md` is not under a Docs-step directory and is itself the reader-facing text.

## Task 3: R1-2, bring the #76 spec's As built up to date with the branch and the PR body

Files:

- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/plan.md`

Change, in "As built":

1. Line 87, "- Task 3 waits for the PR number.", becomes:

   ```
   - Task 3 landed in `00b04f3`, the `#83` line under `### Fixes` in `CHANGELOG.md`.
   ```

2. Line 91, "- Not walked yet: ...", becomes:

   ```
   - Walked: the inline session, `/redline:redline 80 dry run review only` from this checkout, which showed the warning at precheck step 1 and stopped at the branch check (PR #83's description). Not walked: the resume path (needs a stopped run's marker; confirmed by reading the bullet). The installed-release session waits for the 0.2.0 tag.
   ```

Line 84 ("Built as shaped, with no deviation.") is not touched here: Task 7 corrects it for R1-3, in that finding's commit.

Proof, with the path above as `plan.md`: `grep -c "Task 3 waits" plan.md` prints `0`, `grep -c "Not walked yet" plan.md` prints `0`, `grep -c "Task 3 landed in" plan.md` prints `1`, and `grep -c "Walked: the inline session" plan.md` prints `1`. Neighbour that must not change: `grep -c "The installed-release session waits for the 0.2.0 tag" plan.md` prints `1`.

**Docs entry:** a spec folder only; no reader-facing change.

## Task 4: R1-5, take the hand-off exemption out of the Resume bullet

Files:

- `skills/redline/SKILL.md`

Change: in the Resume bullet (line 49), replace "since a resume skips the precheck; a relaunch after a hand-off does not repeat it." with "since a resume skips the precheck." A section 7 relaunch never comes through this bullet, and section 4's heading ("Precheck (fresh launches only)") and first line already keep it silent, so the sentence stays true of a section 7 relaunch with no clause (`shape.md`, Unattended answer 6).

Proof: `grep -c "a relaunch after a hand-off does not repeat it" skills/redline/SKILL.md` prints `0`. Neighbour that must not change: `grep -c "Skip this on a relaunch after a hand-off:" skills/redline/SKILL.md` prints `1`.

**Docs entry:** `skills/redline/SKILL.md`: `docs/running.md`, "Precheck", says the warning comes "on a fresh launch and on a resume", which is what the bullet now says for every marker kind. No reader-facing change.

## Task 5: R1-4, say the inline-session warning before the Resume or Start fresh question

Files:

- `skills/redline/SKILL.md`

Change, three edits:

1. Section 2, "A stopped run" (line 47): directly before "Ask one `AskUserQuestion`:", insert:

   ```
   Say the Inline session paragraph (section 4, step 1) under its condition first: a resume skips the precheck, and an `error` or `stopped` resume relaunches in the same turn, so this is the last point at which the person can leave the question, change the session's permission mode and type the command again (#83, R1-4).
   ```

   The headless sentence at the end of the line follows it, so a headless session says the paragraph too.

2. The Resume bullet (line 49): delete "Then say the Inline session paragraph (section 4, step 1) under its condition, since a resume skips the precheck. " (as it reads after Task 4), so the bullet goes from the `args` sentence straight to "Save the run record copy".

3. Section 4, step 1, the Inline session paragraph (line 87): after the closing "since the skill cannot read the mode.", append " A Start fresh (section 2) has said it already, so it is not said twice."

Proof: `grep -c "Then say the Inline session paragraph" skills/redline/SKILL.md` prints `0`; `grep -n "Say the Inline session paragraph" skills/redline/SKILL.md` prints one line, numbered 47; `grep -c "has said it already, so it is not said twice" skills/redline/SKILL.md` prints `1`. Neighbours that must not change: `grep -c "This session loads Redline from" skills/redline/SKILL.md` prints `1`, and `grep -c "Save the run record copy as section 7 says" skills/redline/SKILL.md` prints `1`.

**Docs entry:** `skills/redline/SKILL.md`: `docs/running.md`, "Precheck" (line 30), says the warning comes "on a fresh launch and on a resume"; both still hold, and only the moment inside a resume moves. No reader-facing change.

## Task 6: R1-6, say what bypass-permissions removes wherever the warning offers it

Decided by the person: keep bypass-permissions and state its cost (`shape.md`, Decision 7).

Files:

- `skills/redline/SKILL.md`
- `docs/running.md`
- `CONTRIBUTING.md`
- `README.md`

The sentence, the same in the first three files:

```
Bypass-permissions also removes the coverage pass's permission prompt, the one check the guard cannot provide; a fresh launch with `coverage off` runs without the pass.
```

The words are "a fresh launch" because `coverage off` is a launch word and a resume ignores it (`skills/redline/SKILL.md:49`).

Change, four edits:

1. `skills/redline/SKILL.md`, the Inline session paragraph (line 87): replace `or in bypass-permissions (#76)."` with `or in bypass-permissions (#76). ` followed by the sentence and the closing `"`. The sentence goes inside the quotation, because the quotation is what the session says.
2. `docs/running.md`, "Precheck" (line 30): after "or in bypass-permissions (#76).", at the end of the paragraph, add a space and the sentence.
3. `CONTRIBUTING.md`, "Developing the plugin" (line 7): after "or in bypass-permissions (#76).", add a space and the sentence, before " An installed release runs clean."
4. `README.md`, Known limits, the bullet "The coverage pass runs outside the guard" (line 101): replace the bullet's last sentence, "`coverage off` runs without it ([docs/running.md](docs/running.md), "The coverage pass").", with:

   ```
   In bypass-permissions, the mode the launch warning offers an inline session (#76), that prompt does not exist, which removes the one check the guard cannot provide (#83, R1-6). A fresh launch with `coverage off` runs without the pass ([docs/running.md](docs/running.md), "The coverage pass").
   ```

   "it" in the old sentence would otherwise point at the prompt; the new sentence names the pass.

Proof: `grep -c "the one check the guard cannot provide" <file>` prints `1` for each of the four files. `grep -c "runs without the pass.. A warning, never a stop" skills/redline/SKILL.md` prints `1` (the sentence is inside the quotation). `grep -c "runs without it (.docs/running" README.md` prints `0`. Neighbours that must not change: `grep -c "or in bypass-permissions (#76)" <file>` prints `1` for `skills/redline/SKILL.md`, `docs/running.md` and `CONTRIBUTING.md`, and `grep -c "meets the session's permission prompt (#80, R2-5)" README.md` prints `1`.

The standards half of this decision is not this task: `agent-os/standards/process/release.md` and `agent-os/standards/scripts/guard.md` change in Task 8's standards commit (`shape.md`, retrospective items 2 and 5).

**Docs entry:** `skills/redline/SKILL.md`: `docs/running.md`, "Precheck", and `README.md`, "Known limits", both updated by this task.

## Task 7: R1-3, record in the #76 spec that the standards edit landed with the code

Decided by the person: keep the history and record the deviation (`shape.md`, Decision 8). No commit is rewritten.

Files:

- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/plan.md`
- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md`

Change, four edits:

1. `plan.md`, As built, line 84, "Built as shaped, with no deviation.", becomes:

   ```
   Built as shaped, with one deviation from "Commits": the standards bullet in `agent-os/standards/process/release.md` landed in `4edbbb7` beside the skill, the docs and the spec folder, not on its own (`shape.md`, Decision 12).
   ```

2. `shape.md`, after Decision 11 and before "## Standards retrospective", add:

   ```
   Recorded at review (PR #83, round 1):

   12. **The standards bullet landed with the code.** `4edbbb7` holds `agent-os/standards/process/release.md` beside `skills/redline/SKILL.md`, `docs/running.md`, `CONTRIBUTING.md` and this spec folder, against the rule that a standards edit goes on its own. The history is kept: two lines of accurate record cost far less than a force-push that would change every later commit id on the branch for the sake of one bullet's separation (#83, R1-3).
      Decided by: @michaelfromtheoutfit
   ```

3. `shape.md`, "Standards retrospective" (line 33): replace "approved at the gate, in its own commit." with "approved at the gate, and committed in `4edbbb7` with the skill and the docs rather than on its own (Decision 12)."
4. `shape.md`, "Standards Applied" (line 50): replace "the harness fact lands in its own commit." with "the harness fact was meant to land on its own and landed in `4edbbb7` (Decision 12)."

Proof, with the two paths above as `plan.md` and `shape.md`: `grep -c "with no deviation" plan.md` prints `0`; `grep -c "with one deviation from" plan.md` prints `1`; `grep -c "in its own commit" shape.md` prints `0`; `grep -c "The standards bullet landed with the code" shape.md` prints `1`; `grep -c "Decision 12" shape.md` prints `2`. Neighbours that must not change: `grep -c "standards/process/release.md., on its own" plan.md` prints `1` (the "Commits" list's item 3), and `grep -c "No heading changed" shape.md` prints `1`.

**Docs entry:** spec folder only; no reader-facing change.

## Task 8: Verification Gate

Files: `agent-os/standards/process/release.md` and `agent-os/standards/scripts/guard.md` (step 4's standards commit), and this spec folder's `plan.md` and `shape.md` (step 5).

1. Steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-09-1423-83-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Every harness stays at its prior count: no task touches a tested surface.
2. Step 10, Docs: each task's Docs entry above names its section or its reason, and is confirmed against the task's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. This round keeps the version on purpose (`shape.md`, Decision 5).
4. Step 12, Standards retrospective: apply the list under `## Standards retrospective (proposed)` in `shape.md`, as the standards approver approves it, in its own commit. Items 1 and 5 edit `agent-os/standards/process/release.md`, and item 2 edits `agent-os/standards/scripts/guard.md`.
5. Step 13, Spec folder: `plan.md` reflects what was built; any deviation is recorded under Decisions in `shape.md`.
