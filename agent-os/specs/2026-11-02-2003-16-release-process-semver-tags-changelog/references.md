# References for the release process (#16)

## Claude Code documentation (read 2026-11-02, Claude Code 2.1.316)

- **Plugin loading reference**, "Versions and updates" and "How Claude Code computes the version": https://code.claude.com/docs/en/plugins/loading#versions-and-updates. The manifest's `version` first, the entry's second, the commit SHA third; one `known_marketplaces.json` per user; `--plugin-dir` replaces a same-named marketplace plugin; auto-update off for every marketplace but Anthropic's.
- **Host and maintain a marketplace**, "Keep users up to date", "Release a new version": https://code.claude.com/docs/en/plugins/host-marketplace#keep-users-up-to-date. Users get a new copy only when the computed version changes; a plugin loaded in place is not controlled by `version`.
- **Plugin dependencies**, "Release a plugin that others depend on": https://code.claude.com/docs/en/plugins/dependencies#release-a-plugin-that-others-depend-on. The `<plugin>--v<version>` tag, `claude plugin tag --push` and its four checks.
- **Plugin manifest reference**, `version` and "Metadata precedence": https://code.claude.com/docs/en/plugins/manifest-reference. "`version`: the manifest's `version` overrides the entry's."
- **Create a marketplace**: https://code.claude.com/docs/en/plugins/create-marketplace. The entry fields and the local-directory loop.

## In this repository

### `redline-prefs.sh run check --plugin <dir>`

- **Location:** `scripts/redline-prefs.sh` (header lines 36-41, the `--plugin` parse at line 88)
- **Relevance:** the one place a script already takes the plugin's root as `--plugin <dir>` from the skill (`${CLAUDE_PLUGIN_ROOT}`) to decide whether the repository under review is the plugin
- **Key patterns:** the flag after the positional arguments; the comparison of real paths; the refusal names the plugin

### `redline-setup.sh version <repoRoot>`

- **Location:** `scripts/redline-setup.sh`, `version_compare`, `version_checks`, `version_unattended`, `version_settings`, `cmd_version` (lines 1370-1470)
- **Relevance:** the root form is extended with the in-place part; each part prints its JSON and returns 1 on a warning, exit 2 ends the call
- **Key patterns:** every key present in the JSON; one stderr line per warning, prefixed `redline-setup:`; the cases in `tests/setup-test.sh` from line 755

### The #15 spec: fill-in rerun and the self fixture

- **Location:** `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/`
- **Relevance:** the renumbering of the gate's prose steps is a fill-in change, patched by `redline-setup.sh unattended ... --force`; the setup test's `SFILL` line (`tests/setup-test.sh:595`) must match the committed section's fill-ins
- **Key patterns:** decision 5 (a hand edit on a fill-in line is a hand edit, kept by the patch); the dogfood task 6

### The #13 spec: a prose gate step moves the stamp

- **Location:** `agent-os/standards/process/docs-gate.md`, the bullet "A prose step whose text holds a backticked span is inside the stamp"
- **Relevance:** the Version step's backticks move the hash; the restamp goes in the same commit, and the gate test's last case proves it

### `scripts/redline-guard.sh`, the self-hosted case

- **Location:** lines 237-240 (`PLUGIN_DIRS`, `SELF_HOSTED`) and line 1083 (`sub == "version"` approved for the main session)
- **Relevance:** `--plugin-dir` keeps `CLAUDE_PLUGIN_ROOT` at the checkout, so the self-hosted refusals hold; the new argument needs no guard change
