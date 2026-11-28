# #135: refuse a relaunch under a different plugin version than the run started with — Shaping Notes

## Scope

Issue #135. A relaunch replays a run's saved results only while the script builds the same prompts. Nothing records which plugin version a run started under, and nothing compares it on a relaunch.

On `fromtheoutfit/loser` #839 (2026-11-23), a session's skill had loaded Redline 0.4.3 while the project's install was 0.4.5. The run's fourth launch resolved the workflow by name to 0.4.5's script, which replaced the run's pinned copy. 9 of 26 saved results replayed, and the run went back to round 1's shape with that round already pushed and its issue filed. `run drift` answered `name`, because loser is not the plugin's repository.

This spec makes a relaunch run the script the run launched with, or refuse. It names both versions in the refusal and offers Start fresh, and it has a launch warn when the installs a session can see differ.

Out of scope, by the brief: #136, #69, #124, #121, #122, #123, #104. The table showed none of them sharing a reader this spec changes, so none was put as a question.

## Decisions

From the brief:

1. A relaunch runs the script the run launched with, or it does not run. No relaunch runs another build's script without the person being told and choosing Start fresh.
2. Measure before choosing the mechanism. Done; see "What the probes did and showed".
3. A refusal says which two versions, says nothing on GitHub is lost, and offers Start fresh. It is not a stop that needs a hand fix.
4. Agent files cannot be pinned. What the chosen mechanism does with another version's agents is stated below.
5. A patch bump in both manifests, 0.5.0 to 0.5.1. The template is not touched. No changelog entry and no tag in this pull request.

The person's answers, asked one at a time:

- **(a) The mechanism: record and refuse in two layers, and #81's pin check for every checkout loaded in place.**
  - The skill records `args.launch` at launch: the version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`, and the workflow file's git blob id.
  - The skill refuses before a relaunch (`run drift`) and before a resume (`run check`) when the session's root holds another version.
  - The workflow refuses at startup, before any agent, when its own version constant differs from `args.launch.version` or `args.launch` is absent. Only the script that runs can see #839's case.
  - `run drift` compares the pin with the live workflow file on every repository, not only the plugin's own. So an edited checkout loaded in place relaunches from the pin wherever it reviews.
  - Rider, as the person put it: "A test must fail when the workflow's version constant differs from plugin.json and marketplace.json, so a release cannot bump two of the three."
  - Decided by: @michaelfromtheoutfit
- **(b) A marker written before this change is refused.**
  - A marker with no `args.launch` is refused like any version difference. The line names the version it started under, from `args.pluginRoot`'s manifest (every record on disk holds `pluginRoot`), and the session's version. It says nothing on GitHub is lost and offers Start fresh.
  - No derivation and no fallback: only a build before this one writes a marker without the field, so the missing field is itself the evidence.
  - Decided by: @michaelfromtheoutfit
- **(c) A fresh launch warns when the installs a session can see differ.**
  - The warning comes through `redline-setup.sh version`, which reads `claude plugin list --json`. It is one line, never a stop, and fresh launches only, since a resume is refused on a difference anyway.
  - Rider, as the person put it: "The line also says how to make the installs agree: the update command for the scope that is behind, checked by running it."
  - Decided by: @michaelfromtheoutfit
- **Decision 4, agent files.**
  - For an installed release, the agents load and reload with the workflow from the same install directory (measurements 2 and 6). So "the launch's script with another version's agents" arises only through a version change, and both layers refuse that.
  - An agent edit at the same version, on a checkout loaded in place, stays #81's warning sentence on the plugin's own repository.
  - Measured as mixed when nothing refuses it: m4-agents-pin-reopen, below.
- **How the refusal offers Start fresh.**
  - On a resume, `run check`'s `version` reason is said, then one question offers Start fresh first and Stop second.
  - At a relaunch in the session, `run drift` refuses, and the skill clears the marker, names the spec folders to commit or remove, and stops, so the next `/redline:redline <n>` starts fresh.
  - The workflow's own refusal is an error at stage `relaunch` with `resumeFrom` null, which the skill already handles that way (#81).

### Deviations as built

Each is recorded with its reason in `plan.md`, "As built", under the same number:

1. The workflow's version check runs before every other args check, with its error result built by hand.
2. The blob id is hashed with `git -C <repoRoot> hash-object --no-filters` by setup and drift alike.
3. `args.launch.workflow` takes a 40- or a 64-hex id.
4. The result's `relaunch.how` names the launch rule.
5. No "overwritten pin" refusal: a pin is compared with the live file, and the launch blob only when there is no pin, since a live session runs the workflow it loaded after the file on disk changes (m6-inplace-edit).
6. `run check` and `run drift` require `--plugin`.
7. `run drift` needs the marker on every repository, so a failed `run save` stops the relaunch.
8. A marker with no `args.launch` is named from `args.pluginRoot`'s manifest only for an installed release, otherwise as a build before 0.5.1.
9. A fresh launch the workflow refuses for its version (in place, after a version commit) tells the person to reopen the session.
10. On the plugin's own repository, a round that changes `plugin.json`'s version ends the run at its next relaunch.
11. The installs are a top-level `installs` key, and `REDLINE_CLAUDE` overrides the CLI for tests.
12. "The one running" is found among the installs the repository sees.
13. The setup skill's and docs/setup.md's Verify step accept the installs line.
14. The live-session claim for an agent file edited in a checkout is marked unmeasured.
15. The gate's step 11 text now names the three version places; it moved the stamp, so it went to the person with the standards retrospective and was applied there, with `checks.sh` re-stamped (edit 9).

Each was reported in the boundary message of its slice, and @michaelfromtheoutfit committed every slice after reading it.

## What the probes did and showed

**Setup.**
- A throwaway plugin `probe135`. Its workflow makes four agent calls: the second carries the script's `VERSION` in its prompt, the third and fourth run an agent file whose body holds its own token, and the fourth's prompt carries a per-launch nonce. It also has a skill that prints its `${CLAUDE_PLUGIN_ROOT}`.
- It was installed from a local marketplace whose plugin source is a git URL, so each version is a cache directory as Redline's are. 0.0.1 went to user scope and 0.0.2 to project scope in a throwaway repository.
- A copy at 0.0.9 served `--plugin-dir`.

**How it was driven.**
- Nested headless sessions (`claude -p --output-format stream-json`), and interactive sessions driven with `expect`.
- The real Redline installs, with `redline:redline-loop` launched with empty args. It throws at its first args check, before any agent.

**Caveats and files.**
- **Every fact below was measured on Claude Code 2.1.332, macOS.**
- Raw output was in the shaping session's scratchpad (`probe135/out/`, file names below).
- Cleanup: the plugin and marketplace were removed, and `~/.claude/settings.json`, `installed_plugins.json` and `known_marketplaces.json` were diffed against backups. They are the same but for the official marketplace's own `lastUpdated` refresh.

The findings:

1. **A session runs the install listed first in `installed_plugins.json`,** among the entries it can see (user, and project or local for its directory). Scope does not decide it.
   - User listed first: the session ran the user install (m3a). Project listed first: the project install (m3g, m3f).
   - Another process's install, update or uninstall reorders the list (m3h).
   - In this repository today a session runs 0.4.5 (user, listed first) although the project scope pins 0.4.3. By name, `redline:redline-loop` runs 0.4.5's script (m1-real).
2. **A live session keeps what it loaded until it reloads.**
   - A plugin update or a reorder in another process does not reach it: a relaunch by name runs the cached script (m3c, and m3h before its reload).
   - After `/reload-plugins` or a reopen with `claude --resume`, the name resolves to whichever install is then first, and the agents and the skill root move with it (m3d, m3e, m3h).
   - The skill text already in the conversation keeps the root it was expanded with. That is why #839's skill-side check, run from 0.4.3's skill, saw nothing.
   - The trigger of #839's switch between 16:31Z and 17:34Z is not in any transcript. Its records match this mechanism exactly: launches 1 to 3 ran 0.4.3's script (sha `191d7c6c…`), and launch 4's pin is byte-identical to 0.4.5's file (sha `ab7ac5b8…`), with an mtime of 17:34Z.
3. **Every relaunch by name rewrites the pin** under the session's `workflows/scripts/` with what the name resolved to (m3d, m3h, m5, m6-inplace-reopen). Three relaunches from the pin left it unchanged (m4).
4. **A relaunch from the pin by `scriptPath`** is not covered by the `Workflow(<plugin>:<name>)` allow rule.

   | Mode | Headless (`-p`) | Interactive |
   |---|---|---|
   | manual | denied: "Review dynamic workflow before running" | one "Run a dynamic workflow?" dialog per relaunch (Yes, run it / View raw script / No; no "don't ask again"); approved, it runs with a full replay |
   | acceptEdits | denied, same text | one dialog per relaunch, as in manual |
   | auto | runs, no prompt | runs, no prompt ("Allowed by auto mode") |
   | dontAsk | denied ("running in don't ask mode") | denied, same text |
   | bypassPermissions | runs, no prompt | runs, no prompt |

   Each relaunch that ran replayed everything before the nonce and left the pin unchanged (m4-headless-*, m4i-*). This also settles #81's unmeasured line: in an interactive session there is exactly one dialog per relaunch, and none in bypass-permissions.
5. **The workflow can refuse at its own startup.** A script launched with `args.launch.version` 0.0.9 was relaunched by name in a session that resolves to 0.0.1.
   - 0.0.1's script returned its refusal before any agent, and the journal gained no entry.
   - The pin was overwritten with 0.0.1's script all the same (m5). After a refusal the run is finished; Start fresh is the way on.
6. **A pinned script runs with the session's agents.** Launched at 0.0.9 under `--plugin-dir`, reopened without it (installed 0.0.1), and relaunched from the pin, the run mixed two versions (m4-agents-pin-reopen):
   - the script was 0.0.9's;
   - the replayed agent's token was 0.0.9's;
   - the agent that reran answered with 0.0.1's.

   Replay does not key on agent text.
7. **A checkout loaded in place** (`--plugin-dir`):
   - It hides every install of the plugin; the session lists only `<name>@inline` (m1-inline).
   - An edit to its workflow does not reach the live session (m6-inplace-edit).
   - After a reopen the edited file runs, the version in `plugin.json` is unchanged, and the replay breaks at the first changed prompt (m6-inplace-reopen).
8. **A launch by the `scriptPath` fallback** records the live file as the record's `scriptPath`: for an install, the file in its cache version directory. A later relaunch by name runs what the name now resolves to, and writes a session pin then (m6-fallback).
9. **What is on disk.**
   - 49 Redline run records, every one launched by name, every one holding `args.pluginRoot`, none holding `args.launch`: 42 from this checkout, 7 from cache versions 0.1.0 to 0.4.5.
   - One marker: PR 71's error marker in this repository, from 2026-11-04, which is stale.
   - The workflow file is byte-identical in 0.4.2 and 0.4.3. A version number does not tell every two builds apart, and a script cannot hash itself, so the workflow compares a version constant, and the skill also compares the file's blob id.
10. **`claude plugin list --json`** lists every install with `id`, `scope`, `version`, `installPath` and `projectPath`, in 0.57 s. `installed_plugins.json` (format version 2) holds the same, in an internal format.

## How the table was built

- **The 7 sites:**
  - a decisions hand-off;
  - a plan hand-off;
  - the end-of-run drafts hand-off;
  - a draft stop (a decisions hand-off with drafts and no call);
  - a reviewed result;
  - a stopped run;
  - an error resume.
- **The 9 cases:** the 6 variations of the brief, with "changed in place", "in place" and "fallback" each run on the plugin's own repository and on another. The other three are installed-release cases, and exist only on another repository.
- **Each pair, run:** a fixture git repository, a run record shaped as the harness writes one (`scriptPath`, `args.pluginRoot`, `args.startSha`, the site's `result`) and a pin. On it `redline-prefs.sh run save`, `run check` (the resume path) and `run drift` were run with the session's plugin root, from a scratch script (`table.sh`, output `m6-table-today.tsv`).
- **Which script a call runs:** the Workflow call each pair leads to is matched to the probe that measured it.
- **Rows:** 63, counted from the output.

**The site changes nothing.** Each of the 9 cases gave the same `run check` and `run drift` at all 7 sites, and `run check` printed `ok` in all 63 rows, since no check reads a version. The class is the way the script can differ, not the place that relaunches. At the gate the "As built" column replaced "As planned": the same pairs, run against the built scripts by a second scratch script (`table-built.sh`, output `m9-table-built.tsv`). Its fixtures carry what a 0.5.1 launch records (`args.launch`, the version and the workflow file's blob id), the stand-in installs and checkout carry a manifest, a checkout changed in place is changed after the launch on another repository too, and each installed-release case is run twice: with the session's copy still the launch's, as the live session's skill sees it, and with the other install's, as a reopened session's skill sees it. Where only the script that runs can see the case, the column cites loop-test section 17a, which runs the workflow under another version. Each of the 9 cases again gave one answer at all 7 sites.

## The relaunch-site table (63 rows)

| # | Site | Variation | Repository | `run check` / `run drift` today | What runs today | As built |
|---|---|---|---|---|---|---|
| 1 | decisions hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 2 | decisions hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 3 | decisions hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 4 | decisions hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 5 | decisions hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 6 | decisions hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 7 | decisions hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 8 | decisions hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 9 | decisions hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 10 | plan hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 11 | plan hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 12 | plan hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 13 | plan hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 14 | plan hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 15 | plan hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 16 | plan hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 17 | plan hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 18 | plan hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 19 | end-of-run drafts hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 20 | end-of-run drafts hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 21 | end-of-run drafts hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 22 | end-of-run drafts hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 23 | end-of-run drafts hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 24 | end-of-run drafts hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 25 | end-of-run drafts hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 26 | end-of-run drafts hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 27 | end-of-run drafts hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 28 | draft stop | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 29 | draft stop | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 30 | draft stop | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 31 | draft stop | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 32 | draft stop | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 33 | draft stop | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 34 | draft stop | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 35 | draft stop | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 36 | draft stop | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 37 | reviewed result | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 38 | reviewed result | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 39 | reviewed result | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 40 | reviewed result | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 41 | reviewed result | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 42 | reviewed result | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 43 | reviewed result | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 44 | reviewed result | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 45 | reviewed result | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 46 | stopped run | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 47 | stopped run | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 48 | stopped run | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 49 | stopped run | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 50 | stopped run | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 51 | stopped run | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 52 | stopped run | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 53 | stopped run | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 54 | stopped run | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |
| 55 | error resume | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | `ok / scriptPath (pin)`: from the pin, the launch's script, on another repository too, at the same permission cost as the plugin's own row (m4) |
| 56 | error resume | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | `ok / scriptPath (pin)`, agent change warned: as today |
| 57 | error resume | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | In the live session, whose skill still names the launch's root: `ok / name`, and the other install's script refuses at startup before any agent (loop-test 17a, "another version"). After a reopen, where the skill is expanded from the other install: `refused:version / refuse`, before the call. Start fresh |
| 58 | error resume | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | While nothing moves: `ok / name`, the launch's. Once a reload moves it: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 59 | error resume | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | Live: `ok / name`, the launch's script, cached (m3c). After a reload: by name, refused by the workflow at startup (loop-test 17a). After a reopen: `refused:version / refuse` |
| 60 | error resume | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 61 | error resume | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | `ok / name`: as today |
| 62 | error resume | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | `ok / name`: by name, and the workflow compares its version at startup: the same version runs, another is refused (loop-test 17a) |
| 63 | error resume | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | `ok / refuse`: as today, refused, no pin (#81) |

### The version cases, as built (14 rows)

Two more cases at each of the 7 sites, in a session that loads 0.5.1, from the same script:

| Case | Rows | `run check` / `run drift` | What runs |
|---|---|---|---|
| a marker with no `args.launch`, launched from 0.4.3's cache directory (written before 0.5.1) | 7 | `refused:version / refuse`, the line naming 0.4.3 and 0.5.1 | no call: refused before the relaunch. Start fresh |
| a marker launched under 0.5.0 | 7 | `refused:version / refuse`, the line naming 0.5.0 and 0.5.1 | no call: refused before the relaunch. Start fresh |

Rows: 63 in the table above and 14 here, 77 in `m9-table-built.tsv`, counted from the output.

## The one-time gap

The startup check lives in the workflow, so only a workflow from this change on carries it. Suppose a session that launched under 0.5.1 or later reloads, or is reopened, onto an install from before this change. It runs that build's workflow, which ignores `args.launch`: the run is not refused and replays only up to that build's first changed prompt, as before. A reopen is no better: the person types the command again, the skill is then the older install's, and that skill has no check either.

So the direction "newer launch, older install" stays open once, until every install a session can see is 0.5.1 or later. `docs/upgrading.md` says so, and the launch warning (answer c) names the older install and the command that updates it. No code can close it: the older build's files are what run.

## Unmeasured

- **What switched #839's session at 17:34Z.** No transcript shows a reload. The trace of the harness shows the workflow cache, together with the agents, is also cleared by a plugin install in the same process and by an agent-registry refresh. Only `/reload-plugins` and a reopen were reproduced. The design does not depend on the trigger, since the workflow's own check sees the script whatever moved it.
- **A session in which the workflow's name is not found at a relaunch.** The skill's `scriptPath` fallback exists for a launch whose name is not found; no session was found that lists the skill and not its workflow. See "For you to open".

## For you to open

Drafted in the form of this repository's issues. No open issue covers it: the open list was read on 2026-11-26 and searched for "fallback", "plugin-dir" and "version". The nearest are #27 and #135 itself.

### 1. Relaunch from the launch's file when the workflow's name is not found

**What was found.** Section 6 of the launch skill falls back to `Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/redline-loop.js"})` when the workflow's name is not found, since a session started before the plugin was installed or updated may not list it. A relaunch has no such fallback: "The script a relaunch runs" ends in a call by name, or by the pin's `scriptPath` when the workflow file changed.

A run that launched by the fallback in a session that still does not list the name would fail at its first relaunch with the harness's error, and the skill has no instruction for that error. Measured on Claude Code 2.1.332 (#135's probes): after a fallback launch, a relaunch by name runs whatever the name resolves to and writes a session pin then. Since #135, a different version is refused at startup, so what is left is the not-found error alone. No session that lists the skill but not its workflow was found, so the case itself is unmeasured.

**Why it is not fixed in #135.** #135 settles which script a relaunch runs when one can be found. This is the call that finds none, a path no measured session takes. A fix needs a session that reproduces it first.

**Proposed fix.** Reproduce a session where the skill is listed and the workflow's name is not (a plugin installed or enabled mid-session, then `/reload-plugins`, on the oldest supported Claude Code). If it exists: when a relaunch by name fails as not found, relaunch from the record's `scriptPath` when that file's blob id equals `args.launch.workflow`, else refuse with the run's version and Start fresh. Pin it with a prefs-test case for the drift answer and a line in "The script a relaunch runs".

Drafted in the #135 spec (`agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/shape.md`, "For you to open").

## For you to add

### To #27

#27's idea lists "Every run record and handoff comment carries the plugin version and commit". Since #135 a run records the version it started under, and the workflow file's blob id, in its args (`args.launch`), so every run record and run marker holds it. A launch also warns when the installs a session can see differ, naming the update command. The handoff comment still carries no version, and nothing records the plugin's commit.

## Standards retrospective

What the spec taught, against `agent-os/standards/` as it reads after `be26543`. The nine edits below were put to the person with AskUserQuestion on 2026-11-27, and all nine were applied as drafted, in their own commit, with `.claude/redline/checks.sh` re-stamped for edit 9.

Decided by: @michaelfromtheoutfit

**Already in a standard, no edit:**
- the prompt sweep (testing/tests, line 36);
- red before green (line 35);
- every count read off a run (line 37);
- a version read off its source, never spelled (line 45: loop-test reads `REDLINE_VERSION`, setup-test the manifest);
- an unmeasured behaviour stated as expected (process/docs-gate, line 18: the narrowed agent claim);
- no guard change (scripts/guard).

**Proposed edits:**

1. **workflow/replay.md, line 23, contradicted** ("which only the plugin's own repository can see"; measured headless only). Replace with:
   > - A relaunch runs the script the run launched with, or it does not run, on every repository (`redline-prefs.sh run drift --plugin <the session's copy>`). By name while the session's copy's `workflows/redline-loop.js` equals the copy the harness persisted; from that copy (as `scriptPath`) once it differs, since a checkout loaded in place can change while it reviews any repository; and, with no persisted copy (a launch by the `scriptPath` fallback ran the file itself), by name while the file's blob id is the launch's and refused once it is not. The harness's copy holds what the launch ran, which in a live session is the workflow it loaded even after the file on disk changed, so it is compared with the live file, never with the blob the launch recorded from disk. Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch: it runs with no prompt in auto and bypass-permissions, asks once per relaunch in manual and accept-edits, and is denied in don't-ask and in a headless session outside auto and bypass. Measured on 2.1.332, interactive and headless (#135); first headless under `--plugin-dir` on 2.1.322 (#81)
2. **workflow/replay.md, new line after it, missing:**
   > - A run never relaunches under another version. The skill records the version it starts under and its workflow file's blob id as `args.launch`, once, at launch; `run check` and `run drift` refuse a resume or a relaunch when the session's copy holds another version, or the marker holds no launch; and the workflow refuses at startup when its `REDLINE_VERSION` is not `args.launch.version`, before any agent and before every other args check, so args an older skill built get the version line rather than a throw about a field this build requires. Only the script that runs can see a switch: a session runs the install listed first among those it sees, another process's install or update reorders the list, a reload or a reopen resolves the name afresh, agents with it, and the skill's text already in the conversation keeps the root it was expanded with. `args.launch` is read at startup only, never in a prompt, and the sweep proves no prompt changed (#135, Losers League #839)
3. **workflow/agents.md, line 45, contradicted** ("read at session start"). Replace with:
   > - An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start and again at `/reload-plugins` or a reopen, when it follows whichever install is then listed first (measured on 2.1.332, #135; first headless under `--plugin-dir`, 2.1.322, #81), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. An installed release's agents come from the same directory as its workflow, so another release's agents arrive only with another version, which a relaunch refuses (#135); a script run from the harness's copy under another copy's agents mixes the two, the replayed steps one copy's and the rerun ones the other's. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)
4. **process/release.md, lines 5 and 6, missing the third place.**
   - Line 5's "and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string" becomes "and the marketplace entry in `.claude-plugin/marketplace.json` and `REDLINE_VERSION` at the top of `workflows/redline-loop.js` carry the same string".
   - Line 6 becomes:
   > - The three are kept equal, never one without the others: Claude Code reads the manifest's first and ignores the entry's when both are set, `claude plugin validate` warns on a disagreement and `claude plugin tag` refuses one, and the workflow refuses a relaunch whose `args.launch.version` is not its constant (#135); `tests/setup-test.sh`'s last cases prove the three agree and are semver
5. **process/release.md, line 11, contradicted** ("so it takes no flag for it": `redline-prefs.sh run check` and `run drift` take `--plugin`, required since #135), **and missing the launch fields.** Line 11 becomes:
   > - A script the skill runs by `${CLAUDE_PLUGIN_ROOT}` knows which copy the session loaded from its own path, so it takes no flag for it, except `redline-prefs.sh run check` and `run drift`, which take that copy as `--plugin` (#81; required since #135): `redline-setup.sh version <repoRoot>` reports a self-hosted root that is not the loaded copy (`plugin: {self, inPlace, pluginRoot, version, workflow}`, the last two what a run records as `args.launch`, #135) and the launch precheck warns with the `claude --plugin-dir` line, never stops
6. **process/release.md, new line after line 11, missing:**
   > - A session runs the install listed first among those it sees (user scope, and project or local scope for its directory), whatever their scopes; another process's install or update reorders the list, and an update leaves the older version's directory in the plugin cache. So `redline-setup.sh version <repoRoot>` also lists those installs from `claude plugin list --json` (`installs`, this session's found by `installPath` among them), and the launch precheck warns when their versions differ, with `claude plugin update <id> --scope <scope>` for each older one, a project or local one run from the repository root: run from elsewhere, the command picked another repository's install of the same scope and reported it already up to date. Measured on 2.1.332 with a throwaway plugin at two scopes (#135)
7. **testing/tests.md, new line after line 48, missing:**
   > - A script that reads the machine's own state through a CLI is pointed at a stub for every case of its harness by an environment override (`REDLINE_CLAUDE` in `tests/setup-test.sh`, a stub that serves `claude plugin list --json` from a file the case names), so no case reads the developer's installs; the code is also run once against the real CLI's output at the gate, and what that found is recorded in the spec: #135's run found a root that only another repository's install used counted as this session's (#135)
8. **scripts/bash-conventions.md, line 48, missing the new parts.** "(`redline-setup.sh version <repoRoot>`: `checks.sh`, the unattended section, `settings.json`)" becomes "(`redline-setup.sh version <repoRoot>`: `checks.sh`, the unattended section, `settings.json`, the loaded copy and, since #135, the installs the repository sees)".
9. **The gate's step 11, `.claude/commands/agent-os/shape-spec.md`, contradicted** (it names two places, and the setup test checks three). "`.claude-plugin/plugin.json` carries the plugin's semver version and the entry in `.claude-plugin/marketplace.json` the same string; the setup test's last cases check they agree" becomes "`.claude-plugin/plugin.json` carries the plugin's semver version, and the entry in `.claude-plugin/marketplace.json` and `REDLINE_VERSION` in `workflows/redline-loop.js` the same string; the setup test's last cases check the three agree". Since this is backticked gate text, the same commit runs `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` (gate step 6).

No pattern outside `agent-os/standards/` was invented. The stub CLI follows the template override (`REDLINE_TEMPLATE`, tests line 48) and gh-test's fake `gh`; edit 7 names it.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach". A relaunch that reruns a pushed round under another build, or a run that mixes two builds' agents, is the failure this closes. The refusal says what happened, which versions, and that nothing on GitHub is lost.

## Standards Applied

- workflow/replay: every prompt before a stopping point stays byte-identical. `args.launch` is read only at startup, outside every prompt, and the sweep proves no prompt changed.
- workflow/agents: decision 4, agent files cannot be pinned, and a version change is refused rather than run with another build's agents.
- testing/tests:
  - prefs-test, loop-test and setup-test cases, each red before green;
  - the version test across three files;
  - a stub `claude` on PATH for the launch warning.
- scripts/bash-conventions: no new subcommand; `run check` gains a reason, `run drift` a refusal and `setup version` two fields and a warning, each on the existing JSON and exit codes.
- scripts/guard: no guard change. `redline-prefs.sh` and `redline-setup.sh version` are already approved by real path for the session.
- process/docs-gate: each touched plugin file names its section in the gate's Docs step.
- process/release: 0.5.1 in both manifests and the workflow's constant. The tag and the CHANGELOG entry are the person's step.
- process/standards-retrospective: proposed at the gate.
- process/internal-notes: the probe results recorded here are this spec's own; nothing is copied from `redline-internal`.
- prompts/attribution: the refusal lines and the warning name Redline only.
