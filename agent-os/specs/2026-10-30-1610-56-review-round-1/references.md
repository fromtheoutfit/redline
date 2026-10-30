# References for PR #56 review round 1

Shaped by Redline in unattended mode. Every location below was opened while shaping.

## Similar Implementations

### The override and the record it leaves

- **Location:** `workflows/redline-loop.js`, lines 1414-1436 (`STRUCTURAL_REASONS`, `gateShaped()`, `readStructure()`), 2007-2016 (`checker()`), 2192-2194 (the baseline stop), 2235-2238 (the per-pass stop), 346-348 (`stageError()`)
- **Relevance:** `readStructure()` returns `{ ...out, status: 'read', reason: '' }` and the warning; `checker()` returns that copy; both stops put it under `detail.checker`. This is what R1-1's sentence must describe.
- **Key patterns:** the override and the `error` normalization in `run()` are both applied once, before any call site; the README names each narrowing of "what the checker returned" in the same sentence.

### The loop test's checker scenario

- **Location:** `tests/loop-test.mjs`, lines 630-637 (helpers, `kept()` at 635), 651-659 (the unreadable stops and what the record keeps, 653), 660-672 (the #55 override checks), 681 (a stop keeps the normalized `error`)
- **Relevance:** 671-672 is the full-pass `git: null` run R1-1 describes; the new check reads `kept(run)` on it, as 653 and 681 do for other stops.

### The README sentence

- **Location:** `README.md`, line 262 (`## checks.sh` → Exit code paragraph); `git blame` gives `95a9706` for the line
- **Relevance:** the #55 override sentence and, right after it, "The run's `detail.checker` keeps whatever the checker returned, its `error` normalized."

### Why detail.checker keeps the checker's return

- **Location:** `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/shape.md`, line 17
- **Relevance:** "The run record keeps whatever the checker did get": the stop carries the checker's return so an unreadable result can be diagnosed.

### The first narrowing of that contract

- **Location:** `agent-os/specs/2026-10-27-0923-43-review-round-1/shape.md`, lines 28-82 (R1-1 and its options; line 65 on the README sentence)
- **Relevance:** the `error` normalization narrowed "whatever the checker returned" by one field, and the README sentence gained "its `error` normalized". The #55 override is a second narrowing of the same kind.

### The PR's own spec

- **Location:** `agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/shape.md`, Scope (line 5) and Decisions 2, 3 and 7
- **Relevance:** the override sets `read` and records the misread as a warning; it lives in `checker()` as the normalization lives in `run()`. These answer which side of R1-1 is right.

### A prior nit round's layout

- **Location:** `agent-os/specs/2026-10-30-0905-52-review-round-2/plan.md` and `shape.md`
- **Relevance:** the format of an unattended round: proof greps, Docs entries table, standards retrospective task.
