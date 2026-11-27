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

**The site changes nothing.** Each of the 9 cases gave the same `run check` and `run drift` at all 7 sites, and `run check` printed `ok` in all 63 rows, since no check reads a version. The class is the way the script can differ, not the place that relaunches. The "As planned" column is replaced at the gate by what the built scripts print for the same fixtures, plus the version cases.

## The relaunch-site table (63 rows)

| # | Site | Variation | Repository | `run check` / `run drift` today | What runs today | As planned |
|---|---|---|---|---|---|---|
| 1 | decisions hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 2 | decisions hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 3 | decisions hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 4 | decisions hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 5 | decisions hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 6 | decisions hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 7 | decisions hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 8 | decisions hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 9 | decisions hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 10 | plan hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 11 | plan hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 12 | plan hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 13 | plan hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 14 | plan hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 15 | plan hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 16 | plan hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 17 | plan hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 18 | plan hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 19 | end-of-run drafts hand-off | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 20 | end-of-run drafts hand-off | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 21 | end-of-run drafts hand-off | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 22 | end-of-run drafts hand-off | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 23 | end-of-run drafts hand-off | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 24 | end-of-run drafts hand-off | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 25 | end-of-run drafts hand-off | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 26 | end-of-run drafts hand-off | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 27 | end-of-run drafts hand-off | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 28 | draft stop | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 29 | draft stop | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 30 | draft stop | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 31 | draft stop | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 32 | draft stop | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 33 | draft stop | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 34 | draft stop | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 35 | draft stop | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 36 | draft stop | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 37 | reviewed result | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 38 | reviewed result | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 39 | reviewed result | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 40 | reviewed result | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 41 | reviewed result | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 42 | reviewed result | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 43 | reviewed result | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 44 | reviewed result | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 45 | reviewed result | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 46 | stopped run | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 47 | stopped run | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 48 | stopped run | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 49 | stopped run | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 50 | stopped run | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 51 | stopped run | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 52 | stopped run | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 53 | stopped run | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 54 | stopped run | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |
| 55 | error resume | workflow changed in place | another | ok / name | by name. Live session: the launch's script, cached (m6-inplace-edit). After a reopen: the edited script; replay breaks at its first changed prompt; pin overwritten (m6-inplace-reopen) | from the pin: drift compares the checkout's live file with `args.launch.workflow` on every repository |
| 56 | error resume | workflow changed in place | the plugin's own | ok / scriptPath (pin) | from the pin: the launch's script (#81). One dialog per relaunch in manual and acceptEdits, none in auto and bypass, denied in dontAsk and headless outside auto and bypass (m4); agent change warned | as today |
| 57 | error resume | name resolves to another install | another | ok / name | by name: the other install's script and agents; pin overwritten; replay breaks (#839, m3h) | refused by the workflow at startup, before any agent: the skill text in the session still names the launch's root, so only the script that runs sees it (m5). Start fresh |
| 58 | error resume | session's version differs from the project's | another | ok / name | by name: the session's version, the launch's while nothing reloads (m3a, m3b); after a reload or a reopen that lists the other install first, as the row for another install | as today while nothing moves; once a reload or reopen moves it, refused (reopen: by the skill; reload: by the workflow) |
| 59 | error resume | plugin update mid-session | another | ok / name | by name. Live session: the launch's, cached (m3c). After a reload or reopen: the update's script and agents; replay breaks (m3d) | live: as today. After a reopen: refused by the skill before the call. After a reload: refused by the workflow at startup |
| 60 | error resume | checkout loaded in place, unchanged | another | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 61 | error resume | checkout loaded in place, unchanged | the plugin's own | ok / name | by name: the live file, the launch's (m1-inline). A reopen without `--plugin-dir` runs the installed release (m5) | as today. A reopen without `--plugin-dir`: refused when the installed version differs, from the pin when it is the same |
| 62 | error resume | launch by the scriptPath fallback | another | ok / name | by name: whatever the name resolves to now, and the pin is written then (m6-fallback); a name still not found fails the relaunch, which has no fallback | by name; the workflow compares its version: the same version runs, another is refused |
| 63 | error resume | launch by the scriptPath fallback | the plugin's own | ok / refuse | no call: refused, no pin (#81) | as today: refused |

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
