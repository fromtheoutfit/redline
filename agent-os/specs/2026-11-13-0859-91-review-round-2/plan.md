# PR #91 review round 2: say the pinned relaunch's prompt is expected, not measured

Spec folder: `agent-os/specs/2026-11-13-0859-91-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #91 (issue #81), from the round's one finding (`redline/round-2-review.json`, `redline/round-2-findings.json`). This is the final nit round: there is no correctness finding.

- **R2-1** (nit, low, confirmed): `fix`, Task 2. `docs/running.md` and the skill's spoken `scriptPath` line state the relaunch's prompt behaviour as fact: no prompt in bypass-permissions, one prompt per relaunch otherwise. Neither case was measured. Both now say it is expected and not measured yet, and README Known limits lists both cases.

There is no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name. Line numbers are at `ff3f8d5`, the PR head this round reviewed and the working tree's HEAD. Each anchor is also given as its exact text, in a fenced block, so it reads exactly as the file does. No commit subject holds a bare `@word`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

Expected counts: every harness keeps the count round 1's As built recorded, since no harness reads a file this round changes:

- guard `594 passed, 0 mismatched`;
- loop `725 checks passed, 0 failed`;
- prefs `121 passed, 0 failed`;
- gate `117 passed, 0 failed`;
- setup `468 passed, 0 failed`;
- gh `121 passed, 0 failed`;
- background `39 passed, 0 failed`.

The first gate run's counts are the evidence, and any difference is recorded under As built.

**For the person (not a task).**

- **The PR description** needs no change for R2-1: "Permission prompt" already says "it should run with no prompt", and "Not measured yet" lists both cases.
- **Run caution (#81).** Task 2 commits nothing under `workflows/` or `agents/`, so this run's next relaunch, if any, still goes by name. The `skills/redline/SKILL.md` edit takes effect only in a new session.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-13-0859-91-review-round-2/plan.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-2/shape.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-2/standards.md`
- `agent-os/specs/2026-11-13-0859-91-review-round-2/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 2 spec for PR #91 (#81)`

## Task 2: R2-1, say the pinned relaunch's prompt is expected and not measured yet, in the docs and the skill's line

`shape.md`: Decision 1 and Unattended answers 1 to 3. The #81 spec's Unmeasured section (`agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/shape.md:81`) and the PR description record that a `scriptPath` relaunch's prompt was not measured, in bypass-permissions or outside it. Only the headless denial was. Three lines say otherwise. Each gets one clause reworded with Edit, and nothing else in the file changes.

**Files:**

- `docs/running.md`: "Hand-off and relaunch", the bullet "The workflow file changed", line 84.
- `skills/redline/SKILL.md`: section 7, "The script a relaunch runs (#81)", the `scriptPath` bullet, line 223.
- `README.md`: "Known limits", the bullet "A self-review that edits an agent file runs its later rounds under the edit", line 104.

**Change, `docs/running.md`.** In line 84, replace the text

```
in bypass-permissions, which is how the plugin reviews itself, the relaunch runs with no prompt, and in any other mode Claude Code asks once per relaunch to review the script.
```

with

```
in bypass-permissions, which is how the plugin reviews itself, the relaunch is expected to run with no prompt, and in any other mode Claude Code is expected to ask once per relaunch to review the script, but neither has been measured yet: only the headless denial below was (#81).
```

The text before it ("The allow rule covers the workflow by name only: ") and the sentence after it ("A headless session cannot answer that prompt, ...") stay as they are.

**Change, `skills/redline/SKILL.md`.** In line 223, inside the quoted line the skill says, replace the text

```
In bypass-permissions, which is how the plugin reviews itself, there is no prompt; in any other mode Claude Code asks once per relaunch to review the script, and approving it relaunches.
```

with

```
In bypass-permissions, which is how the plugin reviews itself, it is expected to run with no prompt, and in any other mode Claude Code is expected to ask once per relaunch to review the script, where approving it relaunches; neither has been measured yet.
```

The closing `"` after it and the rest of line 223, from "Then call `Workflow({scriptPath: ..." on, stay as they are. The quoted line stays one line.

**Change, `README.md`.** In line 104, replace the text

```
and whether a relaunch from the pinned script asks exactly once outside bypass-permissions (#81).
```

with

```
and whether a relaunch from the pinned script runs with no prompt in bypass-permissions and asks exactly once in any other mode (#81).
```

The rest of line 104 stays as it is.

### Proof

No harness reads these three files (`shape.md`, Unattended answer 5), so the proof is these greps, then the gate in Task 3.

- `grep -c -F 'the relaunch runs with no prompt' docs/running.md` prints `0` (was `1`).
- `grep -c -F 'there is no prompt;' skills/redline/SKILL.md` prints `0` (was `1`).
- `grep -c -F 'asks once per relaunch' docs/running.md skills/redline/SKILL.md` prints `docs/running.md:0` and `skills/redline/SKILL.md:0` (both were `1`).
- `grep -c -F 'neither has been measured yet' docs/running.md skills/redline/SKILL.md` prints `docs/running.md:1` and `skills/redline/SKILL.md:1` (both were `0`).
- `grep -c -F 'only the headless denial below was (#81)' docs/running.md` prints `1` (was `0`).
- `grep -c -F 'asks exactly once outside bypass-permissions (#81)' README.md` prints `0` (was `1`), and `grep -c -F 'runs with no prompt in bypass-permissions and asks exactly once in any other mode (#81)' README.md` prints `1` (was `0`).
- After the commit, `git diff --stat HEAD~1 HEAD` shows `3 files changed, 3 insertions(+), 3 deletions(-)`. Record any difference under As built.
- `git diff --name-only HEAD~1 HEAD` lists exactly `README.md`, `docs/running.md` and `skills/redline/SKILL.md`.

**Docs entry:**

- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", the bullet "The workflow file changed", and `README.md`, "Known limits", the bullet "A self-review that edits an agent file runs its later rounds under the edit". Both are updated in this task's commit.
- `docs/running.md` and `README.md` are reader-facing by nature and need no entry of their own (`process/docs-gate` line 16).
- No config key, subcommand, allow rule or exit code is added.

**Run caution (#81):** this commit carries nothing under `workflows/` or `agents/`.

**Commit:** `redline: R2-1 say the pinned relaunch prompt is expected and not measured yet, in the docs and the skill line (#81)`

## Task 3: Verification Gate

**Files:**

- `agent-os/specs/2026-11-13-0859-91-review-round-2/plan.md` and `agent-os/specs/2026-11-13-0859-91-review-round-2/shape.md` (step 13, and step 12 if nothing is approved).
- Standards, only if the standards approver approves `shape.md`'s "Standards retrospective (proposed)" item 1: `agent-os/standards/process/docs-gate.md`.

1. **Steps 1 to 9:** run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-13-0859-91-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. Expected: every harness at the count listed at the top of this plan.
2. **Step 10, Docs:** as Task 2's Docs entry says.
   - `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", and README "Known limits", each updated in Task 2's commit, which the entry names.
   - There is no new config key, subcommand, allow rule or exit code.
3. **Step 11, Version:** `0.2.4` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged by this round. `main` carries `0.2.3`, so this PR already has its bump, and this round changes nothing a setup rerun writes (`shape.md`, Decision 2). The setup test's last cases prove the two versions agree.
4. **Step 12, Standards retrospective:** apply item 1 of `shape.md`'s "Standards retrospective (proposed)" if the standards approver approves it, as drafted there. It is one bullet appended after line 17, the last line of `agent-os/standards/process/docs-gate.md`.
   - If the approver does not approve it, make no standards commit, and add "Standards retrospective: no changes" under Decisions in this folder's `shape.md`.
   - If it does, the edit goes in one commit of its own after the finding commit: `redline: record the round 2 review lessons in the standards (#81)`. `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` then prints `0`, so no heading moved.
5. **Step 13, Spec folder:** add an "As built" section to this file. It records:
   - each task's commit;
   - Task 2's proof outputs;
   - the gate's counts;
   - the retrospective's outcome.

   A deviation from this plan is also recorded under Decisions in `shape.md`. This lands in the round's last commit.

**Commit:** `redline: record PR #91 round 2 as built (#81)`
