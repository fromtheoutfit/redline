# References for the checks.sh header and the read-checks bootstrap (#18)

## Similar Implementations

### The generator's header and its escaping

- **Location:** `scripts/redline-setup.sh` 748-749 (`dq`, the escaping applied on the `run_check` line only), 764-771 (the header's environment and checks lines), 812-822 (the `run_check` lines, untouched)
- **Relevance:** item 1 and item 2 change two header lines here and nothing below the header
- **Key patterns:** the header is built as a list `H` of comment lines; the body is spliced from the template by anchors (832-833) and is not touched

### The reader

- **Location:** `scripts/redline-setup.sh` 912 (header lines joined into `htext`), 920-943 (`repo`, `gateFile`, `self_hosted`, `baseline`, the docs regex), 947-972 (`RUN`, `COMMENT`, `VAR`, `unescape`, `expands`), 978-1011 (the line loop: `ALWAYS_ALLOWED`, vars, guards, `run_check`), 1012-1041 (the `input` assembly)
- **Relevance:** item 3 and the docs regex of item 2 live here; `unescape` (950) is the rule `PY_CHECKS` mirrors for item 1
- **Key patterns:** a hand-written spelling the generator replaced is still accepted (the generated form first, the hand-written form after it)

### The template's allowed line

- **Location:** `scripts/checks-template.sh` 251-255 (`printf '%s\n' 'agent-os/specs/' 'agent-os/standards/' ${ALWAYS_ALLOWED[@]+"${ALWAYS_ALLOWED[@]}"}`), 19-22 (the template's own environment block, unchanged)
- **Relevance:** the hard-coded hand-written form replaces the array expansion with the entries themselves

### The setup test

- **Location:** `tests/setup-test.sh` 351-411 (the Laravel shape, the `read-checks` cases, the `stale.sh` sed-copy pattern at 403), 440-482 (bad input), 503-511 (this checkout's regeneration and stamp)
- **Relevance:** the new cases go beside the Laravel shape's; a hand-written copy is `sed … > <copy>` in `$WORK`
- **Key patterns:** `check` for a grep, `expect_json` for a jq filter over the script's JSON; a case named for its decision, and a neighbour beside it

### Fixtures

- `tests/setup-fixtures/checks-input-laravel.json`: the one var, the `env` base-diff `source` step, `alwaysAllowed: ["openapi.json"]`
- `tests/gate-fixtures/checks-no-stamp.sh` 3-4: a hand-written header whose `(<file>)` sits on the line after "Verification Gate"

### The live case

- Chalkboard's original hand-written gate, `~/Code/Sites/chalkboard-feature-redline-plugin/.claude/redline/checks.sh` (commit 44f9a33): 3-4 the gate line, 13-15 the vars line with its default on the next line, 181 the hard-coded allowed list; its bootstrapped `checks.json` in `~/Code/Sites/chalkboard/.claude/redline/`, and the regenerated `checks.sh` there (16, the `=migrate_db` line the issue quotes). Read only; cited, not copied
- This repository's pre-generator gate, `git show 7ac2d65^:.claude/redline/checks.sh`: `ALWAYS_ALLOWED=()` already, so the hard-coded form is Chalkboard's generation

### Docs

- `README.md` 223-281 (the `checks.sh` section, no header shown), 325-333 (the `redline-setup.sh` table); `skills/setup/SKILL.md` 76-80 (the bootstrap paragraph)
- `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/` for the spec folder's format
