# References for the gate stamp (#6, first half)

## Similar Implementations

### `scripts/redline-prefs.sh`

- **Location:** `scripts/redline-prefs.sh`
- **Relevance:** a skill-only script with subcommands, a header that is its documentation, exit 2 on a bad argument, JSON through `jq`
- **Key patterns:** `usage()` exiting 2; the header's order (what, usage, words, exit codes); the guard rows that pin it as the skill's and never a role's (`tests/guard-cases.tsv`, Step 13)

### `tests/prefs-test.sh`

- **Location:** `tests/prefs-test.sh`
- **Relevance:** the harness shape for `tests/gate-test.sh`
- **Key patterns:** `set -uo pipefail`, a throwaway directory from `mktemp -d` removed by a trap, `ok`/`bad` counters, `expect` helpers with a `jq` filter, inline exit-code cases, `N passed, 0 failed` last

### `scripts/redline-guard.sh`

- **Location:** `scripts/redline-guard.sh` (the `python3 -I -c "$PYTHON"` block)
- **Relevance:** the one pattern for Python inside a script: standard library only, fed on stdin, writing no file beside the script

### `.claude/redline/checks.sh` and `scripts/checks-template.sh`

- **Location:** `.claude/redline/checks.sh` (header), `scripts/checks-template.sh` (header and the `-h|--help` line)
- **Relevance:** where the stamp line lives and what `stamp` edits; the numeric `--help` range that the template replaces with a blank-line-terminated one

### The three gate shapes

- **Location:** `.claude/commands/agent-os/shape-spec.md` lines 234 to 255 (this repository); `~/Code/Sites/chalkboard/.claude/commands/agent-os/shape-spec.md` lines 230 to 263; `~/Code/Sites/loser/.claude/commands/agent-os/shape-spec.md` lines 266 to 286 and 404 to 408
- **Relevance:** the sources the three fixtures under `tests/gate-fixtures/` reproduce structurally: a top-level section with a fenced decoy before it; indented fenced commands and sub-bullets; a gate heading inside the plan-template fence with a prose-only decoy after it
