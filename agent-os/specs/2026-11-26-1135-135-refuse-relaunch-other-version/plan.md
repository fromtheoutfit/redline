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

## As built

Built in five commits, each made by the person at a slice boundary:

- `b32c624` the spec folder (Task 1);
- `b2d81dd` the version in three places, `args.launch` and the workflow's refusal (Tasks 2 to 4);
- `f5a888b` `run check`'s `version` reason, `run drift` on every repository and the skill's relaunch and resume text (Tasks 5 and 6);
- `a99b03f` the launch warning (Task 7);
- `be26543` the docs (Task 8).

### Harnesses, red then green

- **setup-test:**
  - the three-way version case failed with only the manifests bumped;
  - the `version` and `workflow` fields failed before the script printed them;
  - 9 launch-warning cases failed first, plus a later one for a root that only another repository's install uses;
  - it ends at 547 passed.
- **loop-test:**
  - section 17a had 15 checks failing before the refusal existed, and one more before the `relaunch.how` sentence;
  - it ends at 2067 passed.
- **prefs-test:**
  - 19 cases failed first;
  - the neighbours passed throughout (an installed release at the same version goes by name, another session comes first, the plugin's own repository as before);
  - it ends at 197 passed.
- **The prompt sweep:** HEAD's test and workflow against the built ones, every agent call dumped:
  - 833 runs in both, 13,865 calls compared (label, agent type, prompt and options), 0 differ;
  - the 14 runs found only after are section 17a's.
- **The table as built:** 77 rows (`m9-table-built.tsv`, counted from the output). The 63 site-by-case rows are in `shape.md` with an "As built" column, and the 14 version cases are in a table of their own. Each case gives one answer at all 7 sites.
- **The update command, run live** on a throwaway plugin (Claude Code 2.1.332):
  - user behind: updated from 0.0.1 to 0.0.2, run from outside the project;
  - project behind: updated from 0.0.2 to 0.0.3;
  - two projects holding a project install, the command run from outside both: it picked the other project, said "already at the latest version" and left the one behind unchanged; run from that project's root, it updated;
  - local behind: updated, from 0.0.2 to 0.0.3;
  - cleanup: the three config files are identical to their backups, and the probe's cache directory is removed.

### Deviations from the plan

1. **Task 4: the version check runs first, before every other args check, not in the `try`.** So args an older skill built, which may lack a field this build requires, get the version line rather than a throw about the field. `result()` reads constants declared later, so the refusal builds its error result itself: stage `relaunch`, `resumeFrom` null, `ownCheck` false, and no rounds, commits or spec folders.
2. **Tasks 3 to 5: the blob id is `git -C <repoRoot> hash-object --no-filters` on both sides.** Setup and drift then hash the same way wherever the file sits.
3. **Task 4: `args.launch.workflow` takes a 40- or a 64-hex id,** for a repository that uses SHA-256 object ids.
4. **Task 4: the result's `relaunch.how` names the launch rule,** pinned by a loop-test check.
5. **Task 5: no "overwritten pin" refusal.**
   - Measurement m6-inplace-edit shows a live session keeps running the workflow it loaded after the file on disk changes. So in a session that loads Redline in place, a fresh launch after a commit edited the workflow runs the older copy, while `args.launch.workflow` records the edited file.
   - The planned check (the pin's blob against `args.launch.workflow`) would refuse that consistent run. The planned comparison of the live file with the launch blob would also answer `name`, and after a reopen the name runs the edited file.
   - So a pin is compared with the live file, as #81 did, and the blob only when there is no pin (a fallback launch, which read the file from disk). A prefs case pins it.
6. **Task 5: `run check` and `run drift` require `--plugin`** (exit 2 without it, or when its manifest holds no version). The version is read from it, and the skill always passes it.
7. **Task 5: `run drift` needs the marker on every repository** (exit 2 without one). So a `run save` that exits 2 now stops the relaunch (SKILL.md, section 7). It exits 2 only when the harness's record layout changes.
8. **Task 5: how a marker with no `args.launch` names its version.** It is read from `args.pluginRoot`'s manifest only when that root is an installed release (under `plugins/cache/`, a version directory an update leaves in place). Otherwise the line says "a Redline build before 0.5.1", since a checkout's manifest may have moved on since the launch: this repository's stale PR 71 marker would otherwise read as started under 0.5.1.
9. **Task 6: the skill's error section says what a refused fresh launch means.** A fresh launch the workflow refuses for its version happens only in a session that loads Redline in place after a commit changed the version, and the section says to reopen the session.
10. **Task 6, a consequence recorded in the docs:** on the plugin's own repository, a round whose commits change `plugin.json`'s version ends the run at its next relaunch, as a version change.
11. **Task 7: the installs are a top-level `installs` key,** and `REDLINE_CLAUDE` overrides the CLI for tests, as the template overrides do.
12. **Task 7: "the one running" is found among the installs this repository sees,** not among all installs. Run against this machine's real list, a root used only by another repository's install produced a line marking none of this repository's installs as this session's.
13. **Task 8: `skills/setup/SKILL.md` and `docs/setup.md` changed too.** Their Verify step expected `version` to exit 0, and it exits 1 when the installs differ, which no setup step changes. They now say to say that line and go on.
14. **Task 8: one claim narrowed.** A live session keeping an agent file edited in a checkout was not measured (the in-place probe edited only the workflow), and README and running.md say so.
15. **Task 9: the gate's step 11 text.** It named only the two manifests, while the setup test checks three places. Changing it moves the gate stamp, so it went to the person with the standards retrospective as edit 9. It was applied, with `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` in the same commit.

### Docs (gate step 10)

- **`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`** (`b2d81dd`): no reader-facing change beyond the version. CONTRIBUTING.md "Releases" names the third place the version lives (`be26543`).
- **`workflows/redline-loop.js`** (`b2d81dd`, `f5a888b`):
  - docs/running.md "Hand-off and relaunch", for the startup refusal and what a relaunch runs;
  - CONTRIBUTING.md "Releases", for `REDLINE_VERSION`;
  - both in `be26543`.
- **`scripts/redline-setup.sh`** (`b2d81dd`, `f5a888b`, `a99b03f`), all in `be26543`:
  - docs/scripts.md, the `redline-setup.sh` header block, regenerated verbatim;
  - docs/running.md "Precheck";
  - docs/upgrading.md "A stopped run across a version change (#135)";
  - docs/setup.md "13. Verify".
- **`scripts/redline-prefs.sh`** (`f5a888b`), all in `be26543`:
  - docs/scripts.md, the `redline-prefs.sh` header block, regenerated verbatim;
  - docs/running.md "Hand-off and relaunch", "Saved launch settings" and "Run markers and resume".
- **`skills/redline/SKILL.md`** (`b2d81dd`, `f5a888b`, `a99b03f`), all in `be26543`:
  - docs/running.md "Precheck", "Hand-off and relaunch" and "Run markers and resume";
  - README.md "Known limits".
- **`skills/setup/SKILL.md`** (`be26543`): docs/setup.md "13. Verify" (`be26543`).
- **New exit codes and reasons,** all in `be26543`:
  - `run check` and `run drift` exit 2 without `--plugin`, and `run drift` exits 2 without a marker on any repository: docs/scripts.md, the prefs header;
  - `run check`'s `version` reason: docs/running.md "Run markers and resume";
  - `version <repoRoot>` exits 1 on the installs line: docs/scripts.md, docs/setup.md and docs/upgrading.md.
- **New environment variable `REDLINE_CLAUDE`** (tests only): the setup header in docs/scripts.md (`be26543`).
- **No new config key, subcommand or allow rule.**

### Standards retrospective (gate step 12)

Nine edits were drafted in `shape.md`, "Standards retrospective": `workflow/replay.md` (line 23 rewritten, and a new line for the version), `workflow/agents.md` (line 45), `process/release.md` (lines 5, 6 and 11, and a new line for the installs), `testing/tests.md` (a new line for the stub CLI), `scripts/bash-conventions.md` (line 48), and the gate's step 11. @michaelfromtheoutfit applied all nine. They are in their own commit, with the gate's re-stamp in `.claude/redline/checks.sh`.

