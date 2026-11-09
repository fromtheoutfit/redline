# References for PR #83 review round 1

## In this repository

### The warning and the resume path

- **Location:** `skills/redline/SKILL.md`: section 2, "A stopped run" (lines 47 to 54), section 4's heading and step 1 (lines 81 to 87), and section 7's relaunch rule (lines 212 to 214).
- **Relevance:** R1-4 and R1-5 change where the paragraph is said; R1-6 is about its last sentence.
- **Key patterns:** a warning and never a stop, said verbatim and the launch goes on (the #16 warning at line 86).

### The PR's own spec

- **Location:** `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/` (`plan.md`, `shape.md`).
- **Relevance:** decision 6 says why a resume warns; decision 8 makes the inline walk a condition of the merge; As built is what R1-2 and R1-3 read against.

### What the coverage pass relies on

- **Location:** `README.md`, Known limits (line 101); `docs/running.md`, "What the guard does not vet" (line 56); `docs/guard.md`, "The hook" (line 7); `agent-os/standards/scripts/guard.md` (line 23).
- **Relevance:** R1-6: a `redline-gh.sh` write from the fork is left to the session's permission prompt, which bypass-permissions removes.

### The sentences this PR added

- **Location:** `docs/running.md`, "Precheck" (line 30); `CONTRIBUTING.md`, "Developing the plugin" (line 7).
- **Relevance:** R1-1, and the two sentences R1-6's options reword.

### Commit history

- **Location:** `4edbbb7` (the skill, docs, standards bullet and spec folder together), `00b04f3` (the CHANGELOG line, `CHANGELOG.md:13`).
- **Relevance:** R1-2 and R1-3.

### Who writes and proves the round

- **Location:** `agents/redline-implementer.md` (one commit per finding; never rewrite history), `agents/redline-plan-approver.md` (the checks this plan meets).
- **Relevance:** the task order (R1-5 before R1-4) and why R1-3's split is a person's step.

## Elsewhere

- Issue #76: https://github.com/fromtheoutfit/redline/issues/76
- PR #83: https://github.com/fromtheoutfit/redline/pull/83
