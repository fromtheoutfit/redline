# References for public docs (#14)

## In this repository

### The #16 spec's README task

- **Location:** `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/plan.md`, Task 6
- **Relevance:** the last README rewrite: Install, Upgrading and Contributing as they read today were written there, and the "Developing the plugin" paragraph moves from Install to `CONTRIBUTING.md`
- **Key patterns:** the Install commands as the reader types them; the update paragraph's "a plugin update replaces the plugin's files only"

### `skills/setup/SKILL.md`

- **Location:** `skills/setup/SKILL.md`, steps 1 to 14
- **Relevance:** the source for `docs/setup.md`: what each step reads, asks and writes, with the `redline-setup.sh` command behind it
- **Key patterns:** the inventory in step 1, the command/prose split in step 3, the stamp with `--steps` in step 5 and without in step 10, the hand-back in step 14

### The script headers

- **Location:** `scripts/redline-gh.sh`, `scripts/redline-prefs.sh`, `scripts/redline-gate.sh`, `scripts/redline-setup.sh`, `scripts/redline-background.sh`, `scripts/checks-template.sh` (the comment lines after the shebang up to the first non-comment line); `scripts/redline-guard.sh` likewise, for `docs/guard.md`
- **Relevance:** `docs/scripts.md` quotes each verbatim and says so; the condensed README tables are dropped
- **Key patterns:** the bash-conventions standard's header order (what, usage, environment, output contract, exit codes)

### The old README

- **Location:** `git show main:README.md` once this branch has replaced it
- **Relevance:** the section map in `plan.md` names every heading's new home; the reviewer compares against this copy

### The setup test's live fixture

- **Location:** `tests/setup-test.sh:593-601`
- **Relevance:** this checkout's unattended section is the hand-edit fixture, read live; the edit to point 7 keeps the asserted phrase "gate step 10, Docs"

### `workflows/redline-loop.js`

- **Location:** `handoffComment` (about line 2456), `capComment` (about line 2567), `knownLimits` (line 2451), `RUN_LINE` (line 261)
- **Relevance:** `docs/running.md`'s handoff and cap-hit sections describe these comments; the two expensive references live here
