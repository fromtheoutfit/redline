# #135: refuse a relaunch under a different plugin version than the run started with

## Context

On loser #839 a session's skill was 0.4.3, but the run's fourth relaunch went by name to 0.4.5's workflow. The harness overwrote the run's pinned script, 9 of 26 saved results replayed, and the run went back to round 1's shape although round 1 was already pushed and its issue filed. `run drift` answered `name` because loser is not the plugin's repository, and nothing compares versions.

The measurements (stage 1, approved and run) reproduced the class:
- A session runs the install listed first in `installed_plugins.json`, and another process reorders that list.
- A live session keeps what it loaded until `/reload-plugins` or a reopen, then resolves the name afresh, agents included.
- Every relaunch by name rewrites the pin.

The outcome wanted:
- a relaunch runs the script the run launched with, or it does not run;
- a refusal names both versions, says nothing on GitHub is lost, and offers Start fresh;
- a launch warns when the installs a session can see differ.

## Decisions

From the brief:
1. A relaunch runs the launch's script or does not run.
2. Measured before choosing (done).
3. A refusal names the two versions, says nothing on GitHub is lost, offers Start fresh, and needs no hand fix.
4. Agent files are covered below.
5. Patch bump in both manifests, 0.5.0 → 0.5.1. The template is not touched. No CHANGELOG entry and no tag.

From the questions:
- **(a) Mechanism: B plus the in-place pin.**
  - The run records `args.launch` (the version and the workflow file's git blob id).
  - The skill refuses before a relaunch and before a resume when the session's version differs.
  - The workflow refuses at startup, before any agent, when its own version constant differs or `args.launch` is absent. This catches #839, where only the script that runs can see the change.
  - #81's pin-versus-live check runs for every repository, so an edited checkout loaded in place relaunches from the pin wherever it reviews.
  - Rider: a test fails when the workflow constant, `plugin.json` and `marketplace.json` do not all agree.
- **(b) A marker with no `args.launch` is refused** as a version difference. Its version is named from `args.pluginRoot`'s manifest; every record on disk holds `pluginRoot`. No derivation and no fallback.
- **(c) A fresh launch warns** through `redline-setup.sh version`, which reads `claude plugin list --json`.
  - Rider: the line gives the update command for the scope that is behind, and that command is checked by running it.
- **Decision 4, agent files.**
  - For installed releases, agents load and reload with the workflow from the same install. So "the launch's script with another version's agents" can only arise through a version change, and that is refused.
  - An agent edit at the same version, on a checkout loaded in place, stays #81's warning sentence (the plugin's own repository).
  - Measured as mixed when not refused (m4-agents-pin-reopen).

## Tasks

### Task 1: Save spec documentation

Create `agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/`. It holds:
- **`plan.md`:** this plan.
- **`shape.md`:**
  - Scope, Decisions (above) and "How the tables were built".
  - The probe findings with the Claude Code version (2.1.332) and file names.
  - **The 63-row table** (7 sites × 9 cases, `m6-table-today.tsv`), with "today" and "as built" columns, and the finding that the site changes nothing.
  - **The one-time gap:** a reload onto an install from before 0.5.1 runs a workflow with no startup check.
  - **For you to open:** one draft, "Relaunch from the launch's file when the workflow's name is not found", since section 6's `scriptPath` fallback covers the launch only. The open list was searched for "fallback", "plugin-dir" and "version", and none covers it.
  - **For you to add, to #27:** the run now records the version it started under, and a launch warns about installs that differ. The handoff comment still carries no version.
  - Standards Applied.
- **`standards.md`:**
  - workflow/replay;
  - workflow/agents;
  - testing/tests;
  - scripts/bash-conventions;
  - scripts/guard (no guard change; the extended subcommands are already approved);
  - process/docs-gate;
  - process/release;
  - process/standards-retrospective;
  - process/internal-notes;
  - prompts/attribution.
- **`references.md`:** the #81 spec (`2026-11-12-1852-81-pin-relaunch-script-finish-rule`) and its probes, `run drift` (`scripts/redline-prefs.sh:215`), the workflow's #81 startup check (`workflows/redline-loop.js:6041`), `cmd_version` (`scripts/redline-setup.sh:1477`) and the #839 run records.
- No visuals.

### Task 2: One version in three places

- Add `const REDLINE_VERSION = '0.5.1'` near the top of `workflows/redline-loop.js`, outside every prompt.
- Bump `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to 0.5.1.
- `tests/setup-test.sh`'s "one semver version" case (line ~1002) reads all three and fails when any differs. Red first: bump the two manifests only.

### Task 3: Record what the run starts under

- **`version_plugin` in `scripts/redline-setup.sh`** (`cmd_version`) adds `version` (this script's own manifest) and `workflow` (`git hash-object` of this script's root `workflows/redline-loop.js`) to the `plugin` object it prints.
- **`skills/redline/SKILL.md` section 5** puts them in `args` as `"launch": {"version": "<v>", "workflow": "<blob>"}`, set once at launch and never changed on a relaunch. The args example and the paragraph under it describe it.
- **Tests:** setup-test cases for the two fields.

### Task 4: The workflow refuses at startup

- In the `try` before the #81 check (`redline-loop.js:6041`), and before any agent:
  - `args.launch` absent, or `args.launch.version !== REDLINE_VERSION`, returns `result('error', {stage: 'relaunch', resumeFrom: null, ownCheck: false})`.
  - The error line: "This run started under Redline <launch or 'a build before 0.5.1'>; the workflow running now is <REDLINE_VERSION>, so a relaunch would rerun recorded steps. Nothing on GitHub is lost. Start fresh: /redline:redline <pr>".
  - Validate `args.launch`'s shape when present (`fail` style).
- **`tests/loop-test.mjs`:**
  - `baseArgs` gain `launch`, read from the workflow file's constant.
  - Three checks: absent, different and equal, the first two refused with no agent called.
- **The "prompt unchanged" claim**, proven by a sweep: every loop scenario run before and after, with every agent prompt dumped and diffed (scratch script, the #105 method). The count goes in As built.

### Task 5: The skill-side refusal and the pin for every in-place load

All in `scripts/redline-prefs.sh`. No new subcommand.

- **One shared function** compares the marker's `args.launch` with `--plugin`'s manifest version:
  - absent: "started under a build before 0.5.1 (<pluginRoot manifest version>)";
  - different: names both versions.
  - The line says nothing on GitHub is lost and to start fresh.
- **`run check`** gains reason `version`, placed right after `session`.
- **`run drift`, on every repository:**
  1. The version refusal: `launch: "refuse"`, exit 1.
  2. The pin must hash to `args.launch.workflow`. If it does not (overwritten by an earlier relaunch by name), refuse.
  3. The live `<plugin>/workflows/redline-loop.js` differs from `args.launch.workflow`: relaunch from the pin (`scriptPath`).
  4. Otherwise relaunch by name.
  5. The agents list and `self` keep their meaning (the plugin's own repository only). The no-pin comparison moves from `git diff startSha` to the blob id.
- **`tests/prefs-test.sh`:**
  - Existing drift and check fixtures gain `args.launch`.
  - New cases, each run red first:
    - absent → refused;
    - version differs → refused, for check and for drift;
    - another repository loaded in place with an edited checkout → `scriptPath`;
    - an overwritten pin → refused.
  - Neighbours that must not change:
    - an installed release at the same version → `name`;
    - the plugin's own repository → as before.
- **Header comment:** updated.

### Task 6: The skill text

`skills/redline/SKILL.md`:
- **Section 2, Resume:** on `version`, say the line, then ask one AskUserQuestion with **Start fresh** first and **Stop** second. Start fresh runs `run clear` and names the spec folders to commit or remove. Headless starts fresh, as now.
- **Section 7, "The script a relaunch runs":** drift now applies on every repository. A version refusal says the line, runs `run clear`, names the folders and stops, so the next `/redline:redline <n>` starts fresh. The `error` section's `resumeFrom: null` list names the version refusal.

### Task 7: The launch warning

- **`redline-setup.sh version`** runs `claude plugin list --json`. The installs a session can see are user, plus project or local whose `projectPath` is the root. The one running is the install whose `installPath` is this script's root.
- **The warning:** when another visible install's version differs, one stderr line names both, with their scopes, and the update command for the lower one: `claude plugin update <id> --scope <scope>`, run from the repository root for project or local, then a restart or `/reload-plugins`. It is a warning, never a stop.
- **When it stays silent:** when the session runs in place, or when the CLI is missing or fails.
- **Before writing the line,** check the command by running it against a throwaway plugin installed at two scopes, as stage 1 did, in both directions, then clean up and diff the three config files.
- **setup-test, with a stub `claude` on PATH:**
  - the session's install behind;
  - the other install behind;
  - versions agree;
  - CLI missing;
  - in place.
- **SKILL.md precheck step 1:** gains the fifth kind of warning.

### Task 8: Docs

- **`docs/running.md`:**
  - "Hand-off and relaunch": the #81 paragraph becomes "the script a relaunch runs", on every repository, with the version refusal and the in-place pin.
  - "Run markers and resume": the `version` reason.
- **`docs/upgrading.md`:** a new section, "A stopped run across a version change (#135)":
  - the first-listed install;
  - both refusals;
  - a marker from before 0.5.1 is refused;
  - the one-time gap;
  - the launch warning and its command.
  - The 0.5.0 section's last paragraph is adjusted.
- **`docs/scripts.md`:** the prefs header for check and drift, and setup version's new fields and warning.
- **`README.md`:** checked for a relaunch line, and changed if one exists.

### Task 9: Verification Gate

- **Steps 1–9:** `.claude/redline/checks.sh --baseline` exits 0, and its JSON is the evidence. Also run shellcheck on each changed `.sh` before each commit boundary.
- **The table as built:** `table.sh` reruns against the new prefs script, with fixtures carrying `args.launch` plus the version cases. Its "as built" column goes into `shape.md`, with rows counted.
- **Docs entry per touched file:**
  - `scripts/redline-prefs.sh` → docs/scripts.md and docs/running.md;
  - `scripts/redline-setup.sh` → docs/scripts.md and docs/upgrading.md;
  - `workflows/redline-loop.js` → docs/running.md;
  - `skills/redline/SKILL.md` → docs/running.md;
  - the two manifests → no reader-facing change beyond the version.
  - Each entry names its commit or its reason.
- **Version:** 0.5.1 in all three places (Task 2's test).
- **Standards retrospective:** proposed with AskUserQuestion, applied in its own commit, or "no changes" recorded.
- **`plan.md` As built:** deviations recorded under Decisions.

## Commit slices (the user commits each)

1. The spec folder (Task 1).
2. Tasks 2–4: the version constant, the bump, `args.launch`, the workflow refusal, and setup-test and loop-test.
3. Tasks 5–6: prefs check and drift, prefs-test, the skill's relaunch and resume text.
4. Task 7: the launch warning.
5. Task 8: docs.
6. The standards retrospective edits.
7. The spec's As built.

At each boundary: the file list, one line on which harness went red then green, and any difference from this plan.

## Verification

- `tests/prefs-test.sh`, `node tests/loop-test.mjs` and `tests/setup-test.sh` are each run red before their change and green after.
- `.claude/redline/checks.sh --baseline` passes at the end.
- The loop prompt sweep shows no agent prompt changed.
- The 63-row table reruns as built.
- The update command is checked live on a throwaway plugin.
- Nothing is staged or committed by me.
