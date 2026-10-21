# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- `bash -n` reads its first file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (#5, R1-3)
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it
- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling
- A script only the skill calls (`redline-prefs.sh`, `redline-gate.sh`) needs no guard group: the guard's default deny refuses it to every role, and `tests/guard-cases.tsv` rows pin it as the skill's (#6); when one of its subcommands is reserved for a person, its rule in the shared allow list (`templates/settings.allow.json`, and the repository's `.claude/settings.json`) names only the subcommand the skill runs unprompted (`Bash(/*/scripts/redline-gate.sh check *)`), so the reserved one stays behind the permission prompt (#7, R1-9)
- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`
- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)
- A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)
- A script that chooses which part of a file to hash refuses when more than one part qualifies, naming each by line, rather than taking the first: a silent switch moves the hash onto the wrong text and every later check passes against it (#7, R1-6)
- Never print a token, a header or an environment dump; `redline-gh.sh` leaves authentication to `gh`
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash
