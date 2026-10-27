# References for CI: run the gate on every PR push (#17)

No code changes; these are the lines the workflow's behaviour rests on.

## The gate script

- **Location:** `.claude/redline/checks.sh`
- **Relevance:** the one command the workflow runs; CI must fail on its exit code and keep its JSON.
- **Key lines:** 46 (`set -euo pipefail`), 52-76 (`--baseline`, `cd` to `git rev-parse --show-toplevel`), 78-79 (`mktemp -d` under `$TMPDIR`, removed on exit: nothing is written into the tree), 87-94 and 124-163 (output budgets: a failing check keeps 200 lines, so the artifact is where its output lives), 105 (`bash -c "$cmd" </dev/null`), 207-236 (the nine checks; `--baseline` skips the git block, so `fetch-depth: 1` is enough), 320-328 (one JSON object on stdout last, progress on stderr, exit 0/1/2).

## The stamp and version checks

- **Location:** `scripts/redline-gate.sh` 307-342 (`cmd_check`); `scripts/redline-setup.sh` 77 (`REDLINE_TEMPLATE` defaults to the plugin's own template), 963-993 (`cmd_version`).
- **Relevance:** both run from the repository root with no environment, need only `python3`, `jq`, `grep` and `awk`, and exit 0 on a match and 1 otherwise.

## The guard's view of the runner

- **Location:** `scripts/redline-guard.sh` 187-189 (temp prefixes: `tempfile.gettempdir()`, `/tmp`, `/private/tmp`, `$TMPDIR`, the scratchpad), 222-233 (case folding, plugin containment); `tests/guard-test.sh` 25-36 (`set -uo pipefail`; the stand-in repository under `${XDG_CACHE_HOME:-$HOME/.cache}/redline/guard-test-repo`); `tests/guard-cases.tsv` (only `REPO/`, `PLUGIN/` and `/tmp` paths).
- **Relevance:** GitHub's workspace (`/home/runner/work/...`, `/Users/runner/work/...`) is under no temp prefix and HOME is not one, so no row's decision changes between the author's machine, Ubuntu and macOS. A checkout under `$RUNNER_TEMP` would turn write rows into false allows (`testing/tests`).

## The harnesses' host needs

- `tests/setup-test.sh` 50-58 (regenerates `checks.sh` into the temp directory and compares; never into the tree), 333 (the only commit, with `git -c user.email=t@t -c user.name=t`).
- `tests/background-test.sh` 17-18 (`kill $(jobs -p)` in a trap), 35 (its own `TMPDIR`), 119-124 (`set -m`, `kill -TERM -- -pgid`); about 11 s of deliberate waits.
- `tests/gh-test.sh` 36 (`set -uo pipefail`), 65-146 (the fake `gh` first on PATH; nothing reaches GitHub), 147 (`cd "$WORK/repo"`, the SC2164 site).
- `tests/loop-test.mjs` 13-15 (imports only `node:fs`, `node:path`, `node:url`).

## Documents this spec edits

- `agent-os/product/tech-stack.md` 5 (versions proven, not a pin), 12 ("eight steps", stale), 17 ("no CI yet").
- `README.md` 22 (requirements), 44 (the four local verification commands the Contributing section repeats), 158 (`## Known limits`, before which Contributing goes).

## Earlier specs on the gate

- `agent-os/specs/2026-10-21-1329-6-gate-stamp/` (the stamp that `redline-gate.sh check` verifies) and `2026-10-26-1409-40-checker-background-gate/` (the ninth check and the 78 s baseline).
