# References for the unattended-section version marker and merge (#15)

## Similar Implementations

### `redline-setup.sh version` and the checks template's version line

- **Location:** `scripts/redline-setup.sh` (`cmd_version`), `scripts/checks-template.sh` (`# redline-template: checks-template.sh v2`), `tests/setup-test.sh` ("# version" cases)
- **Relevance:** the shape the issue asks the section marker to copy: `{template, file, match, newer}`, exit 1 on a mismatch, the three stderr lines, versions derived in the test from the template (`TV`/`TN`)
- **Key patterns:** `version_compare` is factored out of it and shared by the three forms; the root form composes them

### `redline-setup.sh unattended`

- **Location:** `scripts/redline-setup.sh` (`PY_UNATTENDED`, `cmd_unattended`), `tests/setup-test.sh` ("# unattended" cases)
- **Relevance:** the insert, the fill-in read-back and `--force` patch this spec extends; `apply()` is the fill-in normaliser the merge reuses on every side
- **Key patterns:** python fed on stdin with argv, BOM and CRLF kept, `tmp_beside`/`commit_tmp`, `--dry-run` decided in bash

### `redline-setup.sh command` (#44)

- **Location:** `scripts/redline-setup.sh` (`cmd_command`)
- **Relevance:** the one subcommand that already returns a unified diff in its JSON (`diff`), the shape `templateDiff` and `handEdits` follow

### `redline-setup.sh settings` and `templates/settings.retired.json` (#50)

- **Location:** `scripts/redline-setup.sh` (`cmd_settings`), `templates/settings.allow.json`, `templates/settings.retired.json`
- **Relevance:** `added` and `stale` are what the root form of `version` reports as `missing` and `stale`

### The guard's main-session approval (#50, #54)

- **Location:** `scripts/redline-guard.sh:1083`, `tests/guard-cases.tsv` (the `# #50` block)
- **Relevance:** `sub == "version"` is why the precheck's one command is a form of `version`; the rows pin the new shapes

### The launch precheck and the setup skill

- **Location:** `skills/redline/SKILL.md` section 4 step 1; `skills/setup/SKILL.md` steps 1, 10, 13
- **Relevance:** the text that runs the version check and the rerun conversation this spec rewrites

### The three template bodies

- **Location:** `git show dbb27ec:templates/shape-spec-unattended.md`, `89d0e00`, `e7d030d` (current)
- **Relevance:** the frozen copies v1 and v2 are these files with their marker line added; the live sections in `~/Code/Sites/chalkboard`, `~/Code/Sites/loser` and `~/Code/Sites/vestmark` match v1, v2 and v2
