# References for PR #137 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened for this round; line numbers are at `9532f9d`.

## Similar Implementations

### `copy_line`, `run drift` and `run check`

- **Location:** `scripts/redline-prefs.sh`.
  - The header's `run check` entry (58-77) and `run drift` entry (78-111), its copy paragraph (83-91) and its `agents` sentence (101-104).
  - `realdir` (138), `agent_paths` (140-152) and `agent_list` (153-159).
  - The `--plugin` check and its absolute path (265-272).
  - `version_line` (204-227) and `copy_line` (228-264), the comparison by `agent_list` and `cmp` at 245-259 and the line at 262.
  - `run drift` (344-418): the version refusal (352-357), the copy refusal (358-364), the live file and the pin (373-388), the blob comparison (389-394), the #81 list (395-400).
  - `run check` (420-): `version` (436-437) and `copy` (438-439).
- **Relevance:**
  - R3-1: `agent_list`'s `find agents -type f`.
  - R3-2: `copy_line`'s rule, called by both gates.
  - R3-3: the pin rule at 385 and the blob comparison at 393.
  - R3-4: the two git listings at 399 and `agent_paths`' `*.md` match.
- **Key patterns:**
  - `version_line` and `copy_line`: helpers shared by check and drift that print a refusal line or nothing.
  - `realdir` (`pwd -P`) for comparing two copies, which makes a link to the launch copy the same copy.

### What every agent is given, and what refuses it

- **Location:**
  - `workflows/redline-loop.js`: the version check (40-74), the `pluginRoot` check (80-85), `GH` (484), `BACKGROUND` (486) and `RUN_LINE` (488).
  - `scripts/redline-guard.sh`: `REDLINE_GUARD_PLUGIN_ROOT` (62), `PLUGIN` (132), `script_name` (749-762), the checks before it (1020-1056) and the deny for a bad path (1058-1063).
  - `hooks/hooks.json`: the hook registered at `${CLAUDE_PLUGIN_ROOT}/scripts/redline-guard.sh`.
  - `tests/guard-cases.tsv`: rows 248 (a copy of `redline-gh.sh` under `/tmp`, refused to the GitHub agent), 406 (a copy elsewhere, inert to the main session) and 553 (`/tmp/redline-background.sh`, refused to the checker); `tests/guard-test.sh` 82-112, how a row's fifth column is matched.
- **Relevance:** R3-2's premise, that a relaunch keeps `args.pluginRoot` in every prompt and the session's guard refuses another copy's scripts. None of these files changes this round.

### `version_plugin` and `version_installs`

- **Location:** `scripts/redline-setup.sh`.
  - `die2` (177).
  - The header's `version` entry (124-140), mirrored in `docs/scripts.md` (480-500).
  - `version_plugin` (1469-1492): the version read at 1480.
  - `version_installs` (1493-1534): its docblock (1493-1507), `mine` (1515), `running` (1522) and the label (1525).
  - `cmd_version` (1535-1564): how a part's exit 2 ends the call.
- **Relevance:** R3-5's claim and the precheck's reading of exit 2; R3-6's docblock and label.

### The skill

- **Location:** `skills/redline/SKILL.md`.
  - Section 1 (15): the "not set up" line.
  - Section 2's Resume bullet (51), with the `copy` reason.
  - Precheck step 1 (90): exit 1 and exit 2 of `version`.
  - Section 5 (123, 163): `pluginRoot`, `launch`, and "nothing else changes" on a relaunch.
  - Section 6 (167): the `scriptPath` fallback.
  - Section 7: "stopped before a result" (183), "The script a relaunch runs" (247-253) and its `refuse` bullet (251).
- **Relevance:** R3-2's sentences (51, 251) and its unattended answer (163); R3-3's fallback (167, 123); R3-5's exit 2 (15, 90).

### The harnesses

- **Location:**
  - `tests/prefs-test.sh`: the fixtures and helpers (172-234); the drift cases (415-604): `$DRIFT` (431), the fallback marker `wf_22` (446-451), the relative `--plugin` (452-456), the same release from another install directory (457-459), the copy block with `cline`, `CPIN`, `plugin3` and `plugin4` (460-485), R2-1's copy block (486-503), the gone launch copy (504-507), the `run check` copy cases (509-529), the same copy (530-533), the #81 list (561-600).
  - `tests/setup-test.sh`: the installs cases (998-1094), with the `installs` helper (1006-1017), `LINE_TAIL` (1018) and `INSTALLS` (1076); the version-agreement cases (1123-1133).
  - `tests/loop-test.mjs`: its reads of `skills/redline/SKILL.md` (1870-1874, 3260-3271), none of which holds a sentence Task 2 changes.
- **Relevance:** where Tasks 2, 3 and 4 add, change and remove cases, and the state each insertion point leaves.
- **Key patterns:**
  - Records under `$REC` with `L` for `args.launch`, saved with `run save ... --record`.
  - `cline` for the copy line, `$CHECK` and `$DRIFT` for the filters.
  - The setup test's lists built with `jq -cn --arg pp "$PP"` when the `installs` helper cannot express one (1081, 1085).

### The docs

- **Location:**
  - `docs/running.md`: "Hand-off and relaunch" (137-174), its bullets on another copy (162) and an agent file changed (166), and the paragraph on two builds (172); "Run markers and resume" (225).
  - `docs/scripts.md`: the `redline-prefs.sh` block (194-311) and the `redline-setup.sh` `version` entry (480-500).
  - `docs/upgrading.md`: "A stopped run across a version change" (60-69), which does not state the copy rule.
  - `README.md`: Known limits (99-133), whose version bullet (124) does not state the copy rule.
- **Relevance:** each task's Docs entry.

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/`.
  - `shape.md`: decisions 1 to 5; answers (a) to (c); "Decision 4, agent files"; "How the refusal offers Start fresh"; the deviations as built, 5 and 7; the probes, findings 1 (which install a session runs), 6 (a pinned script runs with the session's agents), 7 (a checkout loaded in place) and 8 (a launch by the fallback).
  - `plan.md`: Task 5's neighbours (an installed release at the same version goes by name).
- **Relevance:** the unattended answers for R3-2, R3-3 and R3-6.

### Rounds 1 and 2's specs

- **Location:** `agent-os/specs/2026-11-27-0922-137-review-round-1/shape.md` (R1-3, R1-4, R1-7) and `agent-os/specs/2026-11-27-0922-137-review-round-2/` (`shape.md`, R2-1, R2-3 and the measurement notes; `plan.md`, the tasks and As built).
- **Relevance:** R3-2's `sameClassAs` R1-3 and the decision it revisits; R3-1's and R3-4's `sameClassAs` R2-1; the commit-message constraint; the mutation and restore procedure.

### The standards

- **Location:** `agent-os/standards/`.
  - `workflow/agents.md` 3, 16, 17 and 45.
  - `workflow/replay.md` 23 and 24.
  - `scripts/bash-conventions.md` 8, 11, 29 and 43.
  - `testing/tests.md` 13, 30, 35 and 39.
  - `process/docs-gate.md` 5 and 16.
  - `process/release.md` 5.
  - `prompts/attribution.md`.
- **Relevance:** `standards.md` copies the applied lines; the retrospective items name where each goes.

### The measurements

- **Location:**
  - `/tmp` (a link to `private/tmp`) and `/opt/homebrew/bin` (589 links), listed with `find`, `find -L` and `-type l`.
  - `/tmp/redlinerepro/shaper-r3-q/a/agents/` and `.../b/agents/`: `redline-plain.md`, `zé.md` and `z"q.md`, compared with `git diff --no-index --name-only`, with and without `-z`.
  - `/Library/Developer/CommandLineTools/usr/share/man/man1/git-config.1` (`core.quotePath`, 3419-3433) and `git-ls-files.1` (`-z`, 118-121, 347); `/usr/share/man/man1/bash.1` (`read -d`, 7381, 7412).
  - `printf ... | jq -Rsc .` for a name with a newline, an accent and a double quote (jq 1.8.2).
  - `~/.claude/plugins/installed_plugins.json`, read-only: the Redline installs' scopes, versions and install paths.
  - `/tmp/redlinerepro/c/`: the reviewer's fixture for this round.
- **Relevance:** R3-1's and R3-4's confirmation; R3-6's shared folder.

### Open issues and the PR's comments

- **Location:**
  - `scripts/redline-gh.sh issues-search` for `pluginRoot`, `symlink`, `quotePath`, `fallback`, `installPath`, `plugin.json version` and `guard copy scripts`;
  - `scripts/redline-gh.sh pr-comments 137`.
- **Relevance:** none of the round's findings is already tracked. #138 (reopen lines naming `--plugin-dir`) bears on R3-2's trigger, not its failure.
