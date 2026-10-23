# References for /redline:setup

## Similar Implementations

### The settings script and its test

- **Location:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`
- **Relevance:** the skill-only script shape: one script, subcommands, jq for every value, one JSON object on stdout, exit 2 on a bad argument, a temp file beside the target; the harness shape (`set -uo pipefail`, `mktemp -d`, `ok`/`bad`, `N passed, 0 failed`)
- **Key patterns:** `expect` helpers reading a jq filter; a refused write leaves no file

### The gate script and its test

- **Location:** `scripts/redline-gate.sh`, `tests/gate-test.sh`, `tests/gate-fixtures/`
- **Relevance:** `python3 -I -c "$PY"` on stdin for markdown and header surgery, the fence pass the unattended insert reuses, `extract`'s JSON (per-step commands, `steps_default`), `stamp`'s placement rule the generator must respect
- **Key patterns:** fixtures copied to a temp directory and mutated with `sed`/`awk`; pinned hashes; the last case checks this checkout

### The main skill

- **Location:** `skills/redline/SKILL.md`, `skills/redline-review/SKILL.md`
- **Relevance:** the skill file shape (frontmatter, numbered sections naming exact commands, a Rules section, the headless caveat); section 4 is where the version warning goes

### The template and this repository's hand-written gate

- **Location:** `scripts/checks-template.sh`, `.claude/redline/checks.sh`
- **Relevance:** the anchors the generator splices by; the header order; what the generated header must carry

### The two hand ports

- **Location:** `~/Code/Sites/chalkboard` and `~/Code/Sites/loser` (read-only): `.claude/redline/checks.sh`, `.claude/settings.json`, `.claude/redline.json`, `.claude/commands/agent-os/shape-spec.md`, `CLAUDE.md`, `.gitignore`
- **Relevance:** what setup must reproduce; Chalkboard's `vars`, formatter, `base-diff` and octane patterns; Losers League's gate inside the plan-template fence, its three gate-versus-CI disagreements, its 1048 s baseline and `checkerStallMs` 1800000

### The port notes

- **Location:** `redline-internal/docs/STEP14-NOTES.md` (private; cited by name, not copied)
- **Relevance:** the 13 steps as first drafted from the Losers League port, the stale-environment loss, the hang in the Browser suite
