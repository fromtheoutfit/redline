# References for PR #7 review round 1

## Similar Implementations

### The original spec for the gate stamp

- **Location:** `agent-os/specs/2026-10-21-1329-6-gate-stamp/` (`shape.md`, `plan.md`)
- **Relevance:**
  - R1-2: the Investigation says a `checks.sh` finding is `defer`.
  - R1-8: Task 5 says "as section 1 does".
  - R1-9: Task 4 gives the allow rule's purpose as "so the precheck never prompts".
  - R1-6: the Decisions fix the hash scope and the first-qualifying-section rule.
- **Key patterns:** a false positive costs a restamp; a false negative is the drift the stamp exists to catch.

### The previous self-hosted round

- **Location:** `agent-os/specs/2026-10-21-1108-5-review-round-1/shape.md`, Decisions R1-1
- **Relevance:** R1-1 and R1-2. That round added point 11 and the matching exception to rule 7 of `agents/redline-shaper.md`, for the guard and the hook. This round extends both to `checks.sh` and to a change in the hash definition.
- **Key patterns:** a `defer` in this repository is mitigated by a file the run may write (a Known limits line), because the workflow needs a commit for every `fix` and `defer` finding.

### The gate stamp script and its harness

- **Location:** `scripts/redline-gate.sh` (`PARSE` pass 2 at 108-121, `cmd_stamp` at 237-284, `cmd_check` at 294-326), `tests/gate-test.sh` (helpers at 29-55, the stamp cases at 154-173, the last case at 232), `tests/gate-fixtures/`
- **Relevance:** R1-6, R1-7, R1-10, and the constraint that no fix moves this checkout's hash.
- **Key patterns:**
  - `expect_exit` for exit codes.
  - Each new case sits beside the case for the neighbouring behaviour.
  - Fixture hashes are pinned inline.

### The Implement stage

- **Location:** `workflows/redline-loop.js:1351-1352`
- **Relevance:** R1-1. An implementer that cannot turn the gate green returns `blocked`, and the round ends in a stage error.

### The self-hosted guard rows

- **Location:** `tests/guard-cases.tsv`, Step 13 (lines 282-302) and the `# @cwd PLUGIN` section (328-384)
- **Relevance:**
  - R1-1: the implementer may edit `scripts/redline-gate.sh` but may not stamp or edit `.claude/redline/checks.sh`.
  - R1-9: `.claude/settings.json` is refused to every role.

### This repository's stamped checks.sh

- **Location:** `.claude/redline/checks.sh:22-40`
- **Relevance:** R1-3 (the baseline time, line 24) and R1-5 (the restamp command written out, lines 38-39).

### The precheck

- **Location:** `skills/redline/SKILL.md`, section 4 (lines 69-82)
- **Relevance:** R1-4 (items 3 to 5 tie the checkout to the PR head), R1-8 (lines 73 and 79), R1-9 (line 82 reserves stamping for a person).
