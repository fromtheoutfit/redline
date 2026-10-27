# References for PR #43 review round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## Similar Implementations

### Where every agent's result comes in

- **Location:** `workflows/redline-loop.js`, lines 223-233 (`stageError`, `run()`)
- **Relevance:** `run()` is the one place an agent's result enters the loop (`agent()` is called only at line 228). It throws on a null result and otherwise returns the result as the model wrote it. Option A adds the normalization here.
- **Key patterns:** a stage error names the stage and the agent's label; the result is returned unchanged today.

### errorText and the checker's verdict

- **Location:** `workflows/redline-loop.js`, lines 1157-1170 (the "The checker's verdict" header and `errorText`), 1174-1198 (`stopReason`, its read at 1175), 1205-1253 (`judge`, its read at 1245)
- **Relevance:** `errorText` treats `""`, `''` and `null` (after trimming) as empty, and returns `''` for a non-string. It sits under the checker's section header although the PR's docblock (1164-1166) says every agent's error goes through it. The checker's two reads are the original callers (#34 round 2; #37, R1-3).
- **Key patterns:** the checker's text is detail on a failure or a warning on a pass, never a verdict input.

### The nine GitHub-agent checks the PR changed

- **Location:** `workflows/redline-loop.js`:
  - gather: 1341-1347
  - post: 1391-1409, with the #778 consistency check at 1399-1408
  - push-and-reply in `replyDropped`: 1530-1535
  - snapshot: 1688-1693
  - push-and-reply in `revise`: 1789-1794
  - the PR description update: 1910-1915
  - the finish comment: 1922-1927
  - the record status listing: 1940-1945
  - the record commit: 1958-1963
- **Relevance:** each check now reads `if (errorText(x))`, and each message still quotes the raw `x.error`. These are nine checks across eight operations.
- **Key patterns:** `throw stageError('<stage>', '<what failed>: ' + error)`. Post alone turns an error on a consistent review into a warning.

### Every agent goes through run()

- **Location:** `workflows/redline-loop.js`, lines 1539-1543 (`checker()`), 1636-1660 (the approvers inside `parallel()`, the reshape), 1696-1755 (baseline and check, with `detail.checker` set at 1704 and 1748), 2198-2203 (the run's error result, `detail: error.extra`)
- **Relevance:** Option A reaches the checker and every other agent with no further call site; `detail.checker` is the checker's whole return as `run()` gave it.

### Which agents carry an error field

- **Location:** `workflows/redline-loop.js`, the schemas at 248-254 (`GATHER_SCHEMA`), 286-316 (`POST_SCHEMA`, `FILE_OP_SCHEMA`), 443-455 (`CHECKER_SCHEMA`), 485-531 (`PUSH_REPLY_SCHEMA`, `UPDATE_SCHEMA`, `FINISH_SCHEMA`, `RECORD_SCHEMA`)
- **Relevance:** only the GitHub agent's operations and the checker return `error`, as a required string. The reviewer, shaper, resolve, approvers and implementer return none.

### The loop test

- **Location:** `tests/loop-test.mjs`:
  - the GitHub mock: 39-81 (`postError` at 57, the push mock at 63, `updateError` at 67, `recordError` at 78)
  - the checker mock: 118-129
  - the PR's two description cases: 356-359
  - the failed record commit: 387-388
  - the #778 `postError` cases: 409-415
  - section 9, checker results: 459-507 (`kept()` reads `detail.checker` at 470; it is asserted at 488, 494, 496 and, in the background section, 571)
- **Relevance:** only the description update scripts `'""'`. The post and record errors are real text, where a bare truthiness test and `errorText` agree, so they cannot tell the two forms apart. `detail.checker` is asserted for `status`, `reason` and `result`, never `error`.
- **Key patterns:** a scenario field per scripted error (`postError`, `updateError`, `recordError`), defaulting to `''`; `go(name, args, scenario)`, `labels()`, `pick()`, `kept()`.

### The documented contract

- **Location:** `README.md`, line 232 (the checker's `error` paragraph under "Exit code")
- **Relevance:** "`""` counts as empty (#34 round 2 failed a green gate on it; #37, R1-3)" is written for the checker only; "The run's `detail.checker` keeps whatever the checker returned" is what Option A would narrow.

### Why detail.checker keeps the checker's return

- **Location:** `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/shape.md` line 17, `plan.md` line 22
- **Relevance:** "The run record keeps whatever the checker did get": the stop carries the checker's whole return so its status, reason and partial result survive. This is an input to R1-1's decision.

### The issue and the PR

- **Location:** issue #42 (title only, from `redline-gh.sh issues-search`), PR #43 (`redline-gh.sh pr 43`), commit `ca2e96f`
- **Relevance:** the issue's title says "once, at parse time"; the PR's title, description and commit message describe the per-check form.
