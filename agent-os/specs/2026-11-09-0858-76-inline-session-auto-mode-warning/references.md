# References for issue #76: inline-session auto-mode warning

## In this repository

### The warning for the inverse case (#16)

- **Location:** `skills/redline/SKILL.md`, section 4, step 1, the `redline-setup.sh version` paragraph.
- **Relevance:** the new warning sits directly after it.
- **Key patterns:** a warning, never a stop; said verbatim and the launch goes on.

### How a copy of the plugin knows where it loaded from

- **Location:** `scripts/redline-setup.sh`, `version_plugin`; `tests/setup-test.sh` pins `plugin.pluginRoot`.
- **Relevance:** the path check in the gate reads this value from each copy. Unchanged by this spec.

### The resume path

- **Location:** `skills/redline/SKILL.md`, section 2, "A stopped run", the Resume bullet.
- **Relevance:** a resume skips sections 3, 4 and 5, so the warning is repeated there.

### The variants that follow the skill

- **Location:** `skills/redline-review/SKILL.md`, `skills/redline-revise/SKILL.md`.
- **Relevance:** both read `skills/redline/SKILL.md` and state that the variable is their root, so the warning reaches them without an edit.

## Elsewhere

- Issue #76 and its two Nov 9 comments: https://github.com/fromtheoutfit/redline/issues/76
