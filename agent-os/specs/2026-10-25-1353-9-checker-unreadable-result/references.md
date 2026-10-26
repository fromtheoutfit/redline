# References for checker results that stop the run (#9)

## Similar Implementations

### The judge and the check loop

- **Location:** `workflows/redline-loop.js:928-976` (`judge()`), `:1217-1221` (`checker()`), `:1394-1417` (implement, check, repair), `:373-408` (`CHECKER_SCHEMA`), `:157-167` (`stageError`, `run`), `:1756-1759` (the top-level catch: `detail` is the error's `extra`)
- **Relevance:** the code that read `error: '""'` as a failure and sent an unreadable result to repair
- **Key patterns:** reasons are built from the gate's own fields; the verdict is a plain object the loop reads; `stageError(stage, message, extra)` carries what the result reports under `detail`

### An agent's `error` recorded as a warning when the result checks out (#33, #34 R1-8)

- **Location:** `workflows/redline-loop.js:1121-1136` (`post()`), `agent-os/standards/workflow/agents.md` ("A degraded result is data, not an error")
- **Relevance:** the same rule for the GitHub agent: `error` is not taken on trust in either direction
- **Key patterns:** check the result's own fields first, then record `error` as a warning and continue

### The checker role

- **Location:** `agents/redline-checker.md`
- **Relevance:** step 3 ("If the script exits 2 or the output is not JSON, return what it printed under `error`") is what the status replaces
- **Key patterns:** one command, once, returned unread; the guard refuses everything but `checks.sh`, including the file the Bash tool spills to

### The loop-test mock

- **Location:** `tests/loop-test.mjs:112-118` (the checker mock), `:380-440` (section 8: scenario-keyed overrides `postError`, `postReviewId`, `postDrop`; asserting status, stage, error text, warnings and labels)
- **Relevance:** the pattern for scripting one agent's result per call and asserting the run's shape
- **Key patterns:** a scenario key the mock reads; `labels(calls)`, `pick(calls, label)`, `run.res.warnings`

### The output cap the spilled message names

- **Location:** `scripts/checks-template.sh:85-160` (`emit_checks`, the 16 KB budget)
- **Relevance:** the fix for a result that spills to a file; `.claude/redline/checks.sh` is generated from this template

### Run records

- `agent-os/specs/2026-10-24-1831-34-review-round-2/redline/` (PR #34 round 2, the `""` round); issue #9 and its addendum
