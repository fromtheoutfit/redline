# References for running a long gate in the background (#40)

## Similar Implementations

### The implementer's background rule

- **Location:** `agents/redline-implementer.md`, step 5 ("If a gate could outlast ten minutes, run it with `run_in_background: true` and read the output file it names when the exit notification arrives")
- **Relevance:** the rule the issue asked the checker to copy, and the one this spec replaces: a subagent's background task is terminated at its final response, so "when the notification arrives" never comes if the agent ends its turn to wait
- **Key patterns:** none to keep; both roles now take the start/wait pair from the prompt

### Checker results that stop the run (#9)

- **Location:** `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/`; `workflows/redline-loop.js` (`CHECKER_SCHEMA`, `stopReason()`, `judge()`, `checker()`); `agents/redline-checker.md`
- **Relevance:** `result_unreadable` with a reason from a fixed set, and a stop that names the cause and the fix, are what the two new reasons extend
- **Key patterns:** a specific case before the general rule (exit 2 before unreadable); the run record keeps what the checker returned; the message ends with the exact command to run by hand

### A gate step added with its harness (#33)

- **Location:** commit `b649acd`: `tests/gh-test.sh` became gate step 8, touching `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.json`, the regenerated `.claude/redline/checks.sh`, `CLAUDE.md`, `README.md` and `agent-os/product/tech-stack.md`
- **Relevance:** the cascade gate step 9 repeats
- **Key patterns:** edit `checks.json`, regenerate with `redline-setup.sh checks`, restamp with `redline-gate.sh stamp`; the gate test's and the setup test's last cases prove the checkout agrees

### A plugin script in a guard group

- **Location:** `scripts/redline-guard.sh` (`script_name()`, the `GH_READ` set, the `checks` group); `tests/guard-cases.tsv`
- **Relevance:** how a plugin script is admitted only at its own path and only for named subcommands
- **Key patterns:** a copy of the script anywhere else is `bad-path`; a subcommand outside the set is refused with a sentence naming the role

### A harness in a throwaway repository

- **Location:** `tests/prefs-test.sh` (a repository under `mktemp -d`, `ok`/`bad` counters, `N passed, 0 failed`)
- **Relevance:** the shape of `tests/background-test.sh`
- **Key patterns:** `set -uo pipefail` so one failing case does not stop the table; everything under the temp directory

### Run records and design notes

- The LL #790 checker transcript (the tool's notice quoted in `shape.md`) and the task output file ending in `[killed]`, both in the LL session's project directory on this machine
- `redline-internal` STEP14-NOTES.md §6 item 2 ("The checker's baseline outlasts the Bash tool"), and DESIGN.md on the stall window, cited by name only (process/internal-notes)
