# References for PR #41 review round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## Similar Implementations

### The background runner under review

- **Location:** `scripts/redline-background.sh`
- **Relevance:** R1-2 and R1-3 are both in `wait`'s `.exit` branch (lines 113-118). `start` clears a label's files at line 77, after `git rev-parse` (line 67) and `mkdir -p` (line 76). The header (lines 11-43) is the documentation the README quotes, including the exit codes 3, 4 and 5 that `wait` keeps for itself.
- **Key patterns:** the file list `start` clears at line 77 is the list a read-once `wait` removes; usage errors exit 2 with a `redline-background:` line.

### Its harness

- **Location:** `tests/background-test.sh`
- **Relevance:** the stub `checks.sh` (lines 22-33) exits with `STUB_EXIT` and prints its JSON for any value but 2, so an exit-3 case needs no new stub. The rerun block (lines 126-133) waits for the old `.exit` to vanish (line 131) before calling `wait`, which is why the R1-2 ordering is untested. Line 65 reads the kept file after a wait; read-once replaces that case.
- **Key patterns:** `bg`, `waitfor`, `within`, `same`, `has`; `REDLINE_BACKGROUND_POLL=0.2`; each case pinned against a literal.

### The gate's own exit-code contract

- **Location:** `scripts/checks-template.sh`, lines 28-30 and 42
- **Relevance:** "Exit 0 when ... else 1. Usage errors exit 2." under `set -euo pipefail` with no mapping, so a failure outside `run_check` or a signal leaves the contract (R1-3).

### Where the commands come from

- **Location:** `workflows/redline-loop.js`, lines 84-91 (`baselineSeconds`, `backgroundGate`), 970-1000 (`gateRun`, `gateLine`), 1032-1058 (`checkerPrompt`), 1695-1740 (the labels `baseline`, `implement`/`repair`, `check`/`recheck`)
- **Relevance:** the run id is `<stamp>-<pr>-<label>`, so labels are reused within an implementer pass, on a relaunch and on a restarted checker (R1-2). The prompts send a wait's 3 back to the same wait and its 4 or 5 to `no_result`; they need no change for R1-3.

### The roles' instructions

- **Location:** `agents/redline-checker.md` lines 20-45; `agents/redline-implementer.md` line 20
- **Relevance:** the checker's one-line description of `wait` (line 25) is the description R1-3 rewords; its steps 3-5 already route a 5 to `no_result`.

### The guard rows for the runner

- **Location:** `tests/guard-cases.tsv` lines 354-369
- **Relevance:** line 367 denies `cat` of a kept file, so no role reads the files `wait` would remove (R1-2). No guard change in this round.

### The README

- **Location:** `README.md` line 140 (the harness row), 232 (the `no_result` reason), 236 ("Long gates"), 262-270 (the `redline-background.sh` section and table)
- **Relevance:** the descriptions R1-2 and R1-3 reword.

### The original spec

- **Location:** `agent-os/specs/2026-10-26-1409-40-checker-background-gate/shape.md`
- **Relevance:** Decisions, "Tags, not clocks": "`start` removes the label's old files first, so a rerun under the same label never returns an earlier result." The stated behaviour R1-2 makes true.

### The product file

- **Location:** `agent-os/product/tech-stack.md`, line 16
- **Relevance:** R1-1's missing comma; `git diff main...HEAD` shows the PR's edit that dropped the "and".
