# References for PR #12 review round 1

Shaped by Redline in unattended mode.

Every reference below was opened during shaping.

## The code under review

### The setup script

- **Location:** `scripts/redline-setup.sh`
- **Relevance:** R1-2 (`cmd_checks`, lines 676 to 713; `tmp_beside`, line 79), R1-3 and R1-4 (`cmd_settings`, lines 85 to 130), R1-5 (`cmd_config`, lines 408 to 466), R1-6 (`PY_CHECKS` validation, lines 478 to 556, and what each field becomes, lines 589 to 668), R1-7 (`cmd_version`, lines 868 to 888), and the header that documents them (lines 10 to 62).
- **Key patterns:** the docblock is the reference the README quotes; every writer goes through a temp file and `commit_tmp`; `gitignore` and `unattended` already keep CRLF, in Python, which is the pattern R1-4 follows.

### The setup test

- **Location:** `tests/setup-test.sh`, `tests/setup-fixtures/`
- **Relevance:** every fix adds cases here. The settings block (lines 64 to 112), config (141 to 175), the `--force` hand-edit case (207), checks (238 to 292), bad input (309 to 332), version (334 to 343), and the dogfood cases (345 to 353) that R1-1 is about and that constrain every edit this round.
- **Key patterns:** `expect_json`, `expect_exit`, `expect_stderr`, `same`, `check`; fixtures copied or mutated into `$WORK` with `sed`, `awk` and `jq`; a neighbour case beside each new one.

### The template

- **Location:** `scripts/checks-template.sh`
- **Relevance:** R1-1. Its header (lines 1 to 39) is not copied into a generated `checks.sh`; its body from `set -euo pipefail` (line 42) on is, by anchor lines. Lines 37 to 38 ("a launch warns when the plugin's template is newer") answer R1-7.

### The skills

- **Location:** `skills/setup/SKILL.md`, `skills/redline/SKILL.md`
- **Relevance:** the setup skill's promises answer R1-2, R1-3 and R1-6 (lines 11, 62, 72, 106, 114); the precheck (`skills/redline/SKILL.md:74`, `:80`) is R1-8's subject and gains R1-7's newer-file line.

### Templates and this repository's contract

- **Location:** `templates/settings.allow.json`, `templates/redline.json.example`, `.claude/settings.json`, `.claude/redline.json`, `.claude/redline/checks.json`
- **Relevance:** R1-3 (the template the merge applies; this repository's settings show no conflict under the planned merge), R1-5 (the config template and this repository's copy), R1-8 (no allow rule for `redline-setup.sh version` in either settings file), R1-1 and R1-6 (this repository's `checks.json`, which the new validation must accept unchanged).

### README

- **Location:** `README.md`
- **Relevance:** the setup steps (lines 38 to 44), Known limits (152), the Template version paragraph (250), the `redline-setup.sh` intro and table (254 to 264). Each fix updates the line that documents it.

## Rules a Redline run follows here

### The guard and its cases

- **Location:** `scripts/redline-guard.sh` (the role table, lines 92 to 101, and the self-hosted note, 86 to 90), `tests/guard-cases.tsv` (lines 304 to 315 and 340 to 347)
- **Relevance:** R1-1: no role runs `redline-setup.sh` or writes `.claude/redline/`, while `scripts/redline-setup.sh` and `scripts/checks-template.sh` are writable here. The shaper's own role (`read tests gh-read`) is why this shaping read code and ran jq rather than the harnesses.

### The unattended section and the shaper

- **Location:** `.claude/commands/agent-os/shape-spec.md` (point 11, line 69; the Verification Gate, lines 234 to 257), `agents/redline-shaper.md` (rule 7)
- **Relevance:** R1-1 (point 11 defers only "a finding whose fix changes a check"); every plan constraint on the gate hash.

### The original feature spec

- **Location:** `agent-os/specs/2026-10-22-2149-6-redline-setup-skill/` (`plan.md`, `shape.md`)
- **Relevance:** answers R1-2 (`plan.md:27`), R1-3 (`plan.md:17`, `:41`) and R1-4's BOM (`plan.md:31`); records the assumptions R1-5 (`plan.md:44`) and R1-8 (`shape.md:27`) would change.

### The previous self-hosted round that changed the template

- **Location:** `agent-os/specs/2026-10-21-1533-7-review-round-1/` (`shape.md`, `plan.md`)
- **Relevance:** R1-1's precedent: Tasks 4 and 5 changed `scripts/checks-template.sh` in the run and left `.claude/redline/checks.sh` to a person, the pattern `guard.md:9` records and the new dogfood case would make red. Also the folder layout, the Pending entries' shape, and the copy of `workflow/agents` this round's `standards.md` follows.

## Reproductions

- **Location:** `/tmp/redlinerepro/reviewer-r1-settings-merge.jq`, `/tmp/redlinerepro/reviewer-r1-settings-existing.json` (the reviewer's), `/tmp/redlinerepro/shaper-r1-ReproTest.php` (the shaper's; a jq program at the fixed scratch path)
- **Relevance:** R1-3. The reviewer's filter reproduces the overwrite and the mixed source; the shaper's checks the planned entry-level merge on the reviewer's file, the other-keys fixture and this repository's settings. Both are outside the repository and are not committed.

## Issues and the PR

- `redline-gh.sh issues-search` (`redline-setup`, `checks-template`, `settings.json`, `template version`): #11, #9, #1, #3; none tracks these findings (R1-7 is next to #11, which covers an older file only).
- `redline-gh.sh pr-comments 12`: this round's review only.
