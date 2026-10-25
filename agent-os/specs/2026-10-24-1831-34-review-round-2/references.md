# References for PR #34 review round 2

Shaped by Redline in unattended mode.

## Similar Implementations

### The `# usage` section of the gh harness

- **Location:** `tests/gh-test.sh:137-144`; helpers `is` and `has` at lines 27-30
- **Relevance:** R2-1's case is line 143. Line 141 captures `gh --help`'s stderr into `"$WORK/err"`, line 142 pins exit 2, line 144 pins that the output stops before `set -euo pipefail`.
- **Key patterns:** `has <name> <haystack> <needle>` is a fixed-string containment check; a haystack built from a plain pipeline over `"$WORK/err"` (as line 144 does with `grep -c`) keeps the case one line.

### The header `--help` prints

- **Location:** `scripts/redline-gh.sh:1-47`, `usage()` at line 50
- **Relevance:** `sed -n '2,/^$/p'` prints lines 2 to 47; line 42 holds `update <n> <title|-> <file> [<copy>]`, line 46 is the last non-blank line (`... unless it already exists (a re-run keeps the first, older body)`), line 47 is the blank line that ends the range and is printed too.
- **Key patterns:** the case must read the last non-blank line, since `tail -1` alone returns line 47's empty line.

### Round 1, R1-2

- **Location:** `agent-os/specs/2026-10-24-1831-34-review-round-1/plan.md` (Task 4) and `shape.md` (Unattended answers and Decisions, R1-2); commit `cb40600`
- **Relevance:** R1-2 replaced the numeric range `2,34p` with `2,/^$/p` and added the three `--help` cases; Task 4 suggested the needle R2-1 tightens.
- **Key patterns:** the neighbouring cases at lines 142 and 144 stay as R1-2 left them.
