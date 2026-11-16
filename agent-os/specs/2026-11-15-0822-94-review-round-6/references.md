# References for PR #94 Review Round 6

Shaped by Redline in unattended mode. Every file below was opened at `9d22ff8`.

## Similar Implementations

### The kept result and `--verdict`

- **Location:** `scripts/checks-template.sh`, lines 21-49 (header), 86-126 (the kept path and `--verdict`), 139-187 (the budget comment and `plain`), 424-462 (the git block), 473-509 (keeping and printing).
- **Relevance:** R6-1, R6-2, R6-3, R6-4, R6-6, R6-7 and R6-8 are all here, below the header except R6-1's line.
- **Key patterns:** the result is printed only after it is kept, under `set -euo pipefail`; the fixes a person makes are under `shape.md`, `## Deferred`.

### `run()`, `stageError` and the verdict call

- **Location:** `workflows/redline-loop.js`, 478-483 (`lastLabel`, `stageError`), 518-529 (`run()`), 2944-2971 (`checker()`), 2120-2140 (`stopReason`), 4075-4083 (the stop's `resumeFrom`).
- **Relevance:** R6-10.
- **Key patterns:** `run()` sets `lastLabel` before the call and builds the stop from it; a call made on a step's behalf must hand the step's label back.

### The command builders

- **Location:** `workflows/redline-loop.js`, 1834-1836 (`checkerCommand`, on `main` at 1677), 1838-1851 (`gateRun`), 1926-1928 (`verdictCommand`).
- **Relevance:** R6-9.

### The round's commits and the text that quotes them

- **Location:** `workflows/redline-loop.js`, 790-799 (`IMPLEMENT_SCHEMA`), 1312-1320 (`replyBody`), 2180-2186 (`judge()`'s commit checks), 2604 (`outcomesFor`'s id match), 3240-3250 (the round's commits), 3457-3459 (the handoff's Commits list).
- **Relevance:** R6-5.
- **Key patterns:** matching reads git's text; only posted text changes.

### The loop test

- **Location:** `tests/loop-test.mjs`, 46-53 (`mock()`'s head), 200-248 (the implementer and checker mocks), 269-293 (`go()` and its run-record check), 295-319 (`pick`, `comment`, `replyFor`), 855-934 (the round_sha and verdict section).
- **Relevance:** Tasks 6 and 7 add their checks here; the mock had no way to return nothing for a label.

### The checker's instructions

- **Location:** `agents/redline-checker.md`.
- **Relevance:** the verdict command line and the `spilled` reason; no change.

### The documents

- **Location:** `docs/contract.md`, "Output contract" (the commit `message` bullet, "The budget", "The kept result", "`--verdict`") and "Exit code"; `docs/running.md`, "Rounds" step 6 and "The handoff comment"; `README.md`, Known limits (lines 96-117).
- **Relevance:** the Docs entries, and the Known limits bullet Tasks 2 to 5 add.

### #68's spec

- **Location:** `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/shape.md` (decisions 1, 2, 4 and 5; deviations 14, 16 and 19) and `plan.md` (As built, the gate counts).
- **Relevance:** Unattended answers 6, 8, 9 and 10; the expected counts.

### The environment the agent calls share

- **Observed:** `printenv TMPDIR` in this shaper prints `/var/folders/l4/jz4g7psj5h1gxvk_6zp29rvm0000gn/T/`, and its `redline-checks/` holds the kept file written at 08:09 by the build's gate run. `/tmp/redline-checks` does not exist on this machine.
- **Relevance:** R6-1's second look.
