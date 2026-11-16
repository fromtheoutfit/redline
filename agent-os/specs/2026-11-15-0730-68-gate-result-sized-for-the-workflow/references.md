# References for issue #68: the gate result sized for the workflow

## Similar Implementations

### The shared output budget

- **Location:** `scripts/checks-template.sh`, `run_check` and `emit_checks`
- **Relevance:** the existing bound on the result: a final pass after every check has run, one budget split evenly among the failing checks. The split stays; what it measures (stripped text), what a passing check prints (nothing) and the budget's size change.
- **Key patterns:** each check's streams sit in `$work/<name>.out` and `.err`; the JSON is assembled once, at the end; `truncated` is set by every limit that can cut.

### How a generated `checks.sh` is made and pinned

- **Location:** `scripts/redline-setup.sh`, `PY_CHECKS` and `cmd_checks`; `tests/setup-test.sh`, "checks: a generated file runs" and "this checkout: checks.sh is checks.json generated and stamped"
- **Relevance:** the template's body is carried verbatim from `set -euo pipefail` on, around four anchors; the generated header's Usage and Snapshot lines are written by the generator, not copied from the template. The last cases regenerate this checkout's `checks.sh` and compare bytes.
- **Key patterns:** a scratch repository under the harness's work directory, a small `checks.json`, the generated file run with `--baseline` or a snapshot and its JSON read with `jq`; `REDLINE_TEMPLATE` pointing the generator at a changed copy of the template (the "template missing an anchor" case).

### Files kept outside the tree, under the temp directory

- **Location:** `scripts/redline-background.sh`
- **Relevance:** the precedent for the kept result: files under `${TMPDIR:-/tmp}/redline-background/`, written through a `.part` file and `mv`, with the header saying where they live and that `start` and `wait` must see the same `TMPDIR`.
- **Key patterns:** write to a temp name, rename into place; a reader that finds nothing exits with a code that is an answer, named on stderr.

### The checker's verdict and the unreadable stop

- **Location:** `workflows/redline-loop.js`: `CHECKER_SCHEMA`, `checkerCommand`, `checkerPrompt`, `readStructure`, `stopReason`, `judge`, `failingExcerpt`, `checker()`
- **Relevance:** every place the workflow reads the gate's result. `judge()` reads each check's `name`, `exit` and `recorded`, `git.unexpected_files`, `git.uncommitted`, `git.commits` and `git.diff_lines`; `failingExcerpt()` reads a failing check's `cmd`, `stdout` and `stderr`; nothing reads `allowed`, `changed_files` or `formatter_touched_outside_pr`.
- **Key patterns:** `run('check', prompt, {agentType: 'redline:redline-checker', label, schema: CHECKER_SCHEMA})`; `stageError('check', message, extra, label)` takes the label a resume should name.

### Where the round's commits are read

- **Location:** `workflows/redline-loop.js`, `revise()`: the snapshot built before the implement step, and the block after the verdict that builds `roundCommits` from `checked.result.git.commits`
- **Relevance:** `round_sha` is added to the snapshot there, from `commitsAll`'s last sha or `startSha`. `commitsAll` grows only after a round's check passes, which is why a resumed attempt of the same round keeps the same `round_sha`.
- **Key patterns:** `mentions(message, id)` is the id test the cut must not break: an id preceded by the start or a character outside `[A-Za-z0-9-]`, and followed by a non-digit or the end.

### The checker scenarios and the resume scenarios of the loop test

- **Location:** `tests/loop-test.mjs`: the checker mock (`scenario.checker(label, out)`), the "checker: result unreadable" cases, the `resume:` scenarios and `samePrefix`
- **Relevance:** the spilled cases become the path where the verdict gives nothing; the new cases script `check r1` and `check r1 verdict` separately. The resume scenarios show how a relaunch is built from the first run's args and how a snapshot prompt's JSON is read back.
- **Key patterns:** the mock shifts `scenario.commitIds` on every round check, so a verdict label needs its own branch.

### The guard's rule for `checks.sh`

- **Location:** `scripts/redline-guard.sh`, the "Redline's own scripts" branch; `tests/guard-cases.tsv`, the checker rows
- **Relevance:** read, not changed. The checker may run the repository's `checks.sh` whatever its flags and may read no file; the new rows pin both.

### PR #94's run records

- **Location:** `agent-os/specs/2026-11-14-1509-94-review-round-4/redline/` and `agent-os/specs/2026-11-14-1509-94-review-round-5/redline/`
- **Relevance:** the round 5 snapshot is the real input the new git block is measured against (14.7 KB with the v2 script), and the two review files are the evidence for the inline-placement report in `shape.md`.
