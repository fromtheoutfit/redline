# PR #137 review round 1 — Shaping Notes

Shaped by Redline in unattended mode, for review round 1 of PR #137 (issue #135; plugin 0.5.1, template v7), from the round's eight findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Line numbers are at `57234d0`, the head of the branch.

## Scope

The round's eight findings, nothing more:

- R1-1 (correctness, medium, confirmed): on the plugin's own repository, a round that bumps the version ends the run at its next relaunch, though the pinned script would run the launch's version.
- R1-2 (correctness, medium, confirmed): `run save` finds the harness's record only under `~/.claude/projects`, and since this pull request a failed `run save` ends every hand-off on every repository.
- R1-3 (correctness, low, confirmed): a checkout and a release at one version pass the version check, and the relaunch runs the launch's script under the other copy's agents with no word.
- R1-4 (correctness, medium, confirmed): a runtime jq failure in `version_installs` turns the launch warning into exit 2, which the precheck reads as "not set up".
- R1-5 (correctness, low, unconfirmed): the installs warning counts installs the CLI reports as disabled.
- R1-6 (nit, low, confirmed): "Save the run record" still says to relaunch anyway when the record cannot be found, beside the new rule to stop.
- R1-7 (correctness, low, confirmed): the advice for a fresh launch the workflow refuses for its version reopens without `--plugin-dir`, which runs the installed release.
- R1-8 (nit, low, confirmed): the workflow's startup refusal tells a refused fresh launch to start fresh, in the session that refuses it again.

`.claude/redline.json` declares no `askRules`, so no repository ask rule covers any finding. In this repository the plugin's source is repository content (rule 7). None of the eight needs `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text, so none is deferred under point 11. None is a call on one of Redline's own files.

No open issue tracks any of the eight. `scripts/redline-gh.sh issues-search` was run for `plugin-dir`, `resume`, `reopen` and `CLAUDE_CONFIG_DIR`. It listed #66, #122, #124, #121, #69, #136, #123, #98, #119, #128, #135, #115, #77 and #82. #69 is a session killed with no marker written, a different cause from R1-2's record found in the wrong place. #135 is this pull request's own issue. None of the others covers any of these findings. The PR's comments hold only this round's review.

Dispositions:

- `fix`: R1-2, R1-3, R1-4, R1-6, R1-8.
- `decline`: R1-1, R1-5.
- `defer`, with a mitigation: R1-7.
- No `ask`.

**Plan adjustment 1.** The plan approver bounced the plan once, on Task 4 (R1-4): its second case held only under jq 1.8, and CI's legs run jq 1.7.1. The adjustment is applied, by its option (b), and R1-4 is decided again: see "Plan adjustment 1" under Decisions. No other decision changes.

## Decisions

### R1-1: a self-review's own version bump ends the run at its next relaunch — decline

Confirmed by reading `scripts/redline-prefs.sh` at `57234d0`. `version_line` reads `--plugin`'s manifest version (178) and returns the refusal line when it differs from `args.launch.version` (181-192). `run drift` calls it first (262) and `run check` after `session` (338). On the plugin's own repository loaded in place, `--plugin` is the repository itself, so a round's commit that bumps `plugin.json` makes the next `run drift` answer `refuse`. The reviewer is also right that the pin would have run the launch's version: the pin's `REDLINE_VERSION` is the launch's, and the workflow's startup check would pass.

- **Unattended answer.** The pull request answers the question in two places, in the same words:
  - The PR description, under "Behaviour that changes on purpose": "On the plugin's own repository, a round that changes the version in `plugin.json` ends the run at its next relaunch."
  - Its spec's `plan.md`, "As built", deviation 10: "on the plugin's own repository, a round whose commits change `plugin.json`'s version ends the run at its next relaunch, as a version change."

  The person read every slice boundary and committed it ("Each was reported in the boundary message of its slice, and `@michaelfromtheoutfit` committed every slice after reading it", the PR spec's `shape.md`, "Deviations as built"). So reading (b), which judges a pinned relaunch by the pin's version, would undo a behaviour the pull request records as deliberate. It is not put to the person (unattended point 2).
- **Docs.** Reading (a)'s proposal is already met. `docs/running.md`, "Hand-off and relaunch", line 169, says: "On the plugin's own repository, a round whose commits change the version in `plugin.json` ends the run at its next relaunch." `docs/upgrading.md` line 69 says a version commit "ends a run at the next relaunch, like any version change". The end-of-run drafts stop is a relaunch like any other: "Nothing of Finish has run ... both follow the relaunch" (`skills/redline/SKILL.md` line 263). After the refusal, the open findings are carried into the fresh run's first round (`docs/running.md` line 161). So nothing on GitHub is lost.
- **This round.** It changes no version, so this run's own relaunch is not refused.
- **Reason posted:** The pull request makes this behaviour deliberate: its spec's `plan.md` "As built" deviation 10 and the description's "Behaviour that changes on purpose" say that on the plugin's own repository a round that changes the version in `plugin.json` ends the run at its next relaunch, and `docs/running.md` "Hand-off and relaunch" already says so.

Decided by: redline

### R1-2: the run record is looked for only under `~/.claude` — fix

Confirmed by reading.

- **Where the record is looked for.** `run save` builds its list of matches from `"$HOME"/.claude/projects/*/"$session"/workflows/"$runid".json` alone (213). It exits 2 when that matches nothing or more than one file (214-218), and when no session id is set (210). The skill's "Save the run record" globs the same tree, `~/.claude/projects/*/*/workflows/<runId>.json` (`skills/redline/SKILL.md` line 241).
- **What the base branch did.** On `main`, `run drift` answered `name` on every repository but the plugin's own without reading a marker. The early return is the removed lines at the top of drift in `git diff main...HEAD -- scripts/redline-prefs.sh`. So a `run save` that failed cost only a later resume.
- **What this pull request does.** `run drift` exits 2 with no marker on every repository (257), and "Write the marker" stops on `run save`'s exit 2 (SKILL.md line 243). So with the record outside `~/.claude/projects`, every hand-off, review-dial stop and harness stop ends the run.
- **Measurement.** The guard refuses `redline-prefs.sh run` and `tests/prefs-test.sh` to the shaper ("redline-prefs.sh run is not available to the shaper", "'tests/prefs-test.sh' is not on the shaper's allowlist"). So the search was read, not run. Its own error line names the one pattern it tries (216).

- **The spec's premise.** The PR spec's deviation 7 says `run save` "exits 2 only when the harness's record layout changes". A config directory other than `~/.claude` is a second way, and the fix makes the premise hold. The design it supports stands: `run drift` still needs the marker, and still exits 2 without one. The reviewer's alternative, drift taking the launch from the args the skill holds, would undo deviation 7, so it is not taken.
- **What is not measured.** Where Claude Code keeps a run's record when `CLAUDE_CONFIG_DIR` is set was not measured: the repository holds no file that reads the variable, and the guard refuses an environment prefix to the shaper. This session sets no `CLAUDE_CONFIG_DIR` (the session's environment, by variable name). So `run save` looks under `CLAUDE_CONFIG_DIR` first and then under `~/.claude`. That is right whether the harness follows the variable or not: with it unset, nothing changes. The docs state what the script does, never where Claude Code writes (process/docs-gate, line 18).
- **Proportionality.**
  - Likelihood: low. It needs a session whose config directory is not `~/.claude`. It was not observed.
  - Impact when it fires: every run that stops for the person ends at its first stop, on every repository, and so does every fresh run after it. The line says why ("0 run records match ..."). An autopilot run that never stops is not affected.
  - The regression is this pull request's: before it, only the resume was lost.
  - Cost: in `run save`, the search and its error line; the header, mirrored in `docs/scripts.md`; five prefs cases; in the skill, the copy step takes the record's path from the marker instead of a glob of its own, and three sentences name the new order; one clause of `docs/running.md`. Every file is one the pull request changed. No new dependency.
- **Instance or class.** The cause is a list kept in two places: the record's location is spelled in `run save` and again in the skill's Glob, both as `~/.claude` only. Members:
  - `run save`'s search (`scripts/redline-prefs.sh` 213): exposed. Since this PR its failure ends the run. Closed here.
  - The skill's Glob for the backup copy (`skills/redline/SKILL.md` 241): exposed. Its miss loses only the backup, but it is the same list. Closed here: the copy reads the path `run save` found.
  - No other reader. `grep` for `.claude/projects`, `HOME/.claude` and `~/.claude` over `scripts`, `skills`, `workflows`, `agents`, `hooks`, `commands` and `templates` finds only these two, plus `run save`'s header and its error line. `docs/` and the standards spell the location nowhere.

  Outcome `one-place`. `run save` becomes the one place that finds the record. The skill copies the file named by the marker's `record`, which `run save` prints, so no second spelling is left.
- **The change.** Task 2.
  - `run save` looks under `CLAUDE_CONFIG_DIR`'s `projects/` when the variable is set and not empty, and, when that matches nothing, under `~/.claude/projects/`. It takes the first directory that matches any record, and needs exactly one match there.
  - The skill writes the marker before it copies the record. The copy step names `<config>` as `~/.claude` or the directory `CLAUDE_CONFIG_DIR` names. It takes the path from the marker's `record`: at a stop the one `run save` just printed, on a resume the marker's own.

Decided by: redline

### R1-3: a checkout and a release at one version mix their agents — fix

Confirmed by reading.

- **The version check.** `version_line` treats an equal version string as the launch's build (181).
- **The script.** `run drift` then compares the pin with the live file of `--plugin` (293-294). A pin that differs answers `scriptPath` (309).
- **The agents.** They are listed only when the repository is `--plugin`'s directory (299-302), and they are listed from that repository's own `agents/`. So when the session loads another copy than the one the run launched from, at the same version, the relaunch runs the launch's script under the session's copy's agents. On any repository nothing is said. On the plugin's own repository, reopened without `--plugin-dir`, the repository is no longer `--plugin`, so nothing is listed there either.

The PR spec measured the mixing itself: finding 6, m4-agents-pin-reopen, "the replayed agent's token was 0.0.9's; the agent that reran answered with 0.0.1's". It also measured that a reopen without `--plugin-dir` runs the installed release (rows 6 and 7, m5).

- **Unattended answer: refuse, not warn.** The PR spec's `shape.md`, Context, "Product alignment": "A relaunch that reruns a pushed round under another build, or a run that mixes two builds' agents, is the failure this closes." Its decision 1: "No relaunch runs another build's script without the person being told and choosing Start fresh." Decision 4 covers two installed releases ("another release's agents arrive only with another version") and an agent edit within one checkout ("stays #81's warning sentence"). It does not cover two copies at one version. So the code disagrees with the spec's stated aim at one version, and that disagreement is the fix: refuse, as both layers refuse another version.
- **Proportionality.**
  - Likelihood: low. It needs a copy at a released version with unreleased changes, and a session that switches between that copy and another. On this repository that is a branch not yet bumped, reopened without `--plugin-dir` beside an install at the same version.
  - Impact: the steps that rerun do so under another build's agents, as finding 6 measured. Nothing tells the person.
  - Cost: one block in `run drift` and its header, mirrored in `docs/scripts.md`; one clause of the skill's `refuse` bullet; a bullet and a sentence in `docs/running.md`; prefs cases. All in files the pull request changed. `diff -rq` is BSD and GNU alike (bash-conventions, line 43).
- **Instance or class.** The cause lives in `run drift`. It tells two builds apart by the version string and the workflow file, and never by the copy whose agents the session will run. Members, by the copy the session loads (`--plugin`) against the one the run launched from (`args.pluginRoot`):
  - Another copy, workflow differs from the pin, agents differ: `scriptPath`, mixed. Exposed, the reviewer's case.
  - Another copy, workflow equals the pin, agents differ: `name`, mixed. Exposed. The reviewer's proposed fix, which compares the roots only when the pin differs, would leave this one open.
  - Another copy, workflow differs, agents equal: `scriptPath`, no mixing. Holds.
  - Another copy, both equal (two install directories of one release): `name`. Holds. prefs-test line 427 is its neighbour.
  - Another copy, the launch's copy gone: the agents cannot be compared. Exposed, closed here by refusing.
  - The same copy, in place, edited during the run: decision 4's own case, the warning on the plugin's own repository. Unchanged.
  - A marker with no `args.pluginRoot`: no real launch writes one (SKILL.md section 5; the workflow refuses args without it, `workflows/redline-loop.js` 80-82). Skipped, which keeps the fixtures that hold none as they are.

  Outcome `one-place`. `run drift` runs before every relaunch and every resume (SKILL.md section 2, "Every relaunch here goes through 'The script a relaunch runs' (section 7) first"), so one comparison there closes both the pinned and the by-name relaunch. The members were found by reading; the shaper may not run `run drift`, and each is a prefs case in Task 3.
- **The change.** Task 3. After the version check, when `args.pluginRoot` is set and is another directory than `--plugin`, the two copies' `agents/` are compared with `diff -rq`. The relaunch is refused, with a line naming both copies, when they differ or the launch's copy is no longer a directory. An `agents/` on one side only differs; none on either side agrees.
- **This round.** This run launched in place from this checkout, so `args.pluginRoot` is `--plugin` and the new block is skipped for it.

Decided by: redline

### R1-4: a runtime jq failure turns the installs warning into exit 2 — fix

Confirmed by running the pieces. Decided again at plan adjustment 1, which named Task 4 (the next entry).

- **The program.** `version_installs`' jq program, the reviewer's verbatim copy at `/tmp/redlinerepro/installs.jq`, was run under jq 1.8.2 on the reviewer's `list-numeric.json`. It fails with `split input and separator must be strings`.
- **The empty input.** `printf '' | jq -c '.installs'` prints nothing and exits 0.
- **The caller.** `jq -n --argjson i ''` fails with `invalid JSON text passed to --argjson`.
- **How it travels.** The function runs inside `$(...)`, where bash clears `-e` (bash-conventions, line 8), so `res` comes back empty and the function returns 0 (1509, 1526-1528). `cmd_version`'s final `jq -n ... --argjson i "$ins"` (1556) then fails under `set -euo pipefail` (160), and `version <repoRoot>` exits 2. The precheck reads exit 2 as "this repository is not set up for Redline yet" (SKILL.md line 90). The header promises "[] ... when the CLI is missing, fails or prints no list" (124-128), and the docs say "A warning, never a stop".
- **The end-to-end run.** The whole command could not be run: the guard refuses an environment prefix and `export` to the shaper, and `bash` other than `bash -c` ("'bash' may only be used as 'bash -c <string>'"). So the scratch `/tmp/redlinerepro/shaper-r1-repro.sh` was not run.
- **jq versions.**
  - This machine's PATH gives jq 1.8.2 (`jq --version`). The guard refuses `/usr/bin/jq` to this role ("'/usr/bin/jq' is not on the shaper's allowlist"), so jq 1.7.1 was not run here.
  - CI's legs run jq 1.7.1, as the plan approver read them. `.github/workflows/gate.yml` runs `ubuntu-latest` and `macos-latest` (34-35), puts `/bin` and `/usr/bin` first on macOS (50-52), and prints `jq --version` in its "Tool versions" step (54-57).
  - jq 1.8.2's own `NEWS.md` (Homebrew's copy, `/opt/homebrew/Cellar/jq/1.8.2/NEWS.md`) records the difference. Under 1.8.0, "Make `ltrimstr/1` and `rtrimstr/1` error for non-string inputs" (line 277). Under 1.7.1, only "Fix memory leaks on invalid input for `ltrimstr/1` and `rtrimstr/1`" (line 403). So jq 1.7.1 returns a non-string unchanged.
  - NEWS records no change to `split` or `--argjson`. The `-e` exit-code fix, which makes `-e` answer for the last output, is under 1.7 (line 465), so both versions have it.

- **Proportionality.**
  - Likelihood: low. No known CLI output prints another type or more than one value, and Redline's manifests carry a string.
  - Impact when it fires: every launch stops, with a false reason.
  - Cost, all in one function, its caller and their header and tests: a whole-stream early check, three `tostring`s, a fallback, one line in the caller, four setup cases, and the header line mirrored in `docs/scripts.md`. The function is this pull request's.
- **Instance or class.** The cause lives in `version_installs`. It is the one part of `version <repoRoot>` that reads another program's output and is documented as never a stop, and nothing in it falls back when its own program fails. Its members are every shape of the CLI's output it reads: each field the program reads, and the output as a whole.
  - Each member was run here under jq 1.8.2. Today's program is the reviewer's `/tmp/redlinerepro/installs.jq`. After Task 4 is the planned program, `/tmp/redlinerepro/shaper-r1-installs-b.jq`.
  - The lists: the one-entry lists in `/tmp/redlinerepro/shaper-r1-lists.json`, the second case's list in `/tmp/redlinerepro/shaper-r1-badpath.json`, and two lists in one file in `/tmp/redlinerepro/shaper-r1-twolists.json`.
  - The whole-stream check was run on its own.
  - jq 1.7.1's column is read from NEWS, not run.

  | Member | Today, jq 1.8.2 (run) | Today, jq 1.7.1 (NEWS) | After Task 4, jq 1.8.2 (run) |
  |---|---|---|---|
  | `version` a number (`5`) | `split input and separator must be strings`: exit 2 | the same | listed, `{"scope":"user","version":5,"running":true}` |
  | `version` an array (`[0, 5]`) | the same | the same | listed |
  | `version` `true` | the same | the same | listed |
  | `version` `null` | listed: holds | holds | holds |
  | `projectPath` a number, on a project install | `endswith() requires string inputs`: exit 2 | holds: `rtrimstr` returns the number, which is not the root, so the install is not seen | not seen; beside a user install, `user:0.5.1:true` |
  | `installPath` a number | the same as `projectPath` | holds: not this session's | listed, `running` false |
  | a string version beside a number version | `split ...`: exit 2 | the same | both listed, compared as text |
  | two lists in one output | `jq -e` answers for the last value, so the early check passes. The program prints two objects, and `--argjson` refuses two JSON texts: exit 2. The caller check this plan first wrote (`jq -e 'type == "array"'`) passed the two arrays too | the same | `jq -se 'length == 1 and (.[0] \| type == "array")'` is false: `[]` |
  | a number, then a list | the early check passes; the program fails on the number and reads the list: no stop | the same | `[]`, as for any output that is not one list |
  | not JSON, or no output | `[]`: holds | holds | the whole-stream check is false: `[]` |

  Outcome `one-place`. `version_installs` changes in four ways:
  - It reads exactly one whole list: `jq -se 'length == 1 and (.[0] | type == "array")'` in place of `jq -e 'type == "array"'`.
  - It hands every field that a string builtin reads to that builtin as text: `tostring` before `split` in `num`, and before each `rtrimstr`, in `mine` and in the visible filter. A field of another type is then still listed and compared rather than silencing the list.
  - It prints `[]` and returns 0 on any failure of its program.
  - The caller checks what the function printed, over the whole text, before `--argjson` reads it (bash-conventions, line 8).

  Every row then reads the same under jq 1.7 and 1.8, and that is what the cases pin. Once the fields are text, no input known makes the program fail under either jq. The fallback and the caller's check stay as the guard for any other failure, and Task 4's mutations show them under jq 1.8.
- **Not taken: a timeout on the CLI call.** The reviewer's side note asks for one. macOS ships no `timeout`, and bash-conventions line 43 keeps GNU-only tools out. The PR spec measured the call at 0.57 s (finding 10).
- **The change.** Task 4.

Decided by: redline

### Plan adjustment 1: Task 4's cases under jq 1.7 — option (b), and the output as a whole

The plan approver bounced Task 4 once.
- **The problem.** Its second case (`projectPath: 7`, expecting `.installs | length` of 0) leaned on `rtrimstr` failing on a non-string, which only jq 1.8 does. On CI's jq 1.7.1 the program succeeds and lists the user install. So the case would be green before the change there and red after, and its "Seen red: today exit 2" held only under jq 1.8.
- **What it offered.** (a) assert only exit 0 and an array; or (b) read the paths as text too and expect `user:0.5.1:true`.

- **Taken: (b).**
  - It is the rule R1-4 already took for the version: read it as text, so a field of another type is still listed and compared rather than silencing the list. (a) would keep that rule for the version and silence the whole list for a path, and only under jq 1.8.
  - Under (b) the program gives one output under both versions, so each case pins that output. Under (a) a case could pin only its type, and the warning a person sees would turn on the machine's jq.
  - It is not a judgment call. No known output reaches either path: the CLI and Redline's manifests print strings. So neither option changes what a person sees for any real list, and the warning stays a warning under both. And (b) applies a decision already taken (above), so the two are not both defensible as equals.
  - The second case is now two, one per path: each `tostring` is its own clause (testing/tests, line 30).
- **Also closed: an output of more than one value.** Checking the class again, for what else turns on how jq reads its input, found a member that no field type covers. `jq -e` answers for the last value only, so two lists in one output pass the early check and end in exit 2. This was measured under jq 1.8.2, and by NEWS it is the same under 1.7.1. The caller check this plan first wrote passed them as well. Both checks now read the whole stream, and a fourth case pins it. It is the same function and the same files, so R1-4 stays `one-place`.
- **The fallback.** Kept, as the approver asked, beside the caller's check, as the guard for any other failure. With the fields read as text, no case reaches it under either jq. Task 4's mutations show both guards under jq 1.8, and As built names the jq version of every red run and every mutation.
- **The first case** (a numeric `version`) is unchanged: `split` refuses it under both versions, so it is red today on CI as here.
- **Standards.** Retrospective item 3 gains a sentence on the jq 1.7 and 1.8 difference, and one on the whole-stream check.

Decided by: redline

### R1-5: the installs warning counts disabled installs — decline

The verifier could not confirm it. What would confirm it: with Redline disabled at user scope and enabled at project scope, check that `/reload-plugins` and a reopen never run the disabled install, and that `claude plugin list --json` reports it `enabled: false`.

- **Second look.**
  - The guard refuses `claude` to this role, so the CLI could not be run, and no session could be reloaded or reopened.
  - What the machine's files say, read-only: `~/.claude/plugins/installed_plugins.json` (format version 2) holds `scope`, `installPath`, `version`, `installedAt`, `lastUpdated`, `gitCommitSha` and, for a project install, `projectPath`. It holds no `enabled`.
  - `~/.claude/settings.json` holds `enabledPlugins` keyed by plugin id (`{"redline@redline": true}`).

  So enablement is a setting per plugin id and per settings scope, not a property of an install. What the CLI's per-entry `enabled` means is unknown: it may be each scope's own setting, or the merged setting for the id. If it is the merged setting, a session that sees the user install can still run it. Then dropping a "disabled" entry would hide a real difference, so the guard the reviewer proposes is not right whichever way the claim falls.
- **Harm if true.** One spurious warning line at launch, never a stop. That is not serious.
- **Second look: unconfirmed.**
- **Reason posted:** could not confirm: needs `claude plugin list --json` run with Redline disabled at user scope and enabled at project scope, to see whether its `enabled` is each install's own or the merged setting for the plugin id (the install registry on disk holds no such flag, and enablement lives in settings by plugin id), and a reload and a reopen to see whether the session can still run the install it calls disabled.

Decided by: redline

### R1-6: "Save the run record" still says to relaunch anyway — fix

Confirmed by reading.

- `skills/redline/SKILL.md` line 241 ends "If the record cannot be found, say so in one line and relaunch anyway."
- Line 243, changed by this pull request, says that when `run save` exits 2 the skill says its line and stops.
- `run save` searches the same tree (`scripts/redline-prefs.sh` 213), and `run drift` exits 2 with no marker (257). So "relaunch anyway" is wrong at a stop, and right only on a resume, whose marker already exists.

- **Proportionality.** One sentence; the cost is a contradictory instruction to the skill.
- **Instance or class.** The cause is one stale sentence, the only place the skill says to go on without the record. `grep` for `relaunch anyway` over `skills/`, `docs/` and the README finds it alone. `docs/running.md` line 167 already says "a stop whose marker could not be written (`run save` exits 2) is not relaunched". So no other statement of the rule is left to change (agents.md line 17). Outcome `instance`.
- **The change.** Task 5, after Task 2. With Task 2's copy step taking its path from the marker, the sentence is scoped to a resume: on a resume a missing record file is said and the relaunch goes on, since the copy is only a backup; at a stop, `run save` has printed the path or stopped the run.

Decided by: redline

### R1-7: the advice for a refused fresh launch reopens without `--plugin-dir` — defer, with a mitigation

Confirmed by reading.

- `skills/redline/SKILL.md` line 275 says that reopening with `claude --resume <session id>` and typing the command again "launches under the checkout's current files".
- That case arises only in a session that loads Redline in place (the PR spec's deviation 9).
- The PR spec's own rows 6, 7, 15 and 16 say "A reopen without `--plugin-dir` runs the installed release (m5)", and finding 6 shows the same.
- `docs/running.md` line 169 ("reopen the session and type the command again") and `docs/upgrading.md` line 69 ("until the session is reopened") give the same advice with no flag.

- **Instance or class.** The cause is a class: every line that tells the person how to reopen the run's session omits `--plugin-dir`. For a run launched from a checkout loaded in place, any such reopen runs the installed release (m5). Since this pull request, the next command is then refused for another version, or, after Task 3, for another copy's agents. Members, found with `grep` for `claude --resume` and `reopen`:
  - New in this pull request, and closed by the mitigation:
    - the error section's sentence for a refused fresh launch (SKILL.md 275);
    - `docs/running.md` 169;
    - `docs/upgrading.md` 69.
  - From #10 and #81, and left exposed:
    - `run check`'s `session` line, `reopen it with: claude --resume <id>` (`scripts/redline-prefs.sh` 336, and its header at 58-59);
    - the skill's resume text for that reason (SKILL.md 51);
    - the stopped-run paragraph (181);
    - the denied `scriptPath` relaunch (248). Since this pull request it arises on every repository for a checkout whose workflow changed.
    - the closing sentence of "The script a relaunch runs" (259);
    - the `error` section's resume line (275);
    - `docs/running.md` "Run markers and resume" (224);
    - the README's Known limits bullet on resuming from its own session (125).
  - Next to these: the version line of `run check` and `run drift` says to start fresh. In a session that loads a checkout in place after its version changed, that is refused once more before the reopen advice comes.
- **Proportionality.** Closing the class means a new form for `run check`'s session line, with prefs cases and its header, and a reword of eight sentences in the skill, `docs/` and the README. All of those predate this pull request. Likelihood: low, a run launched in place whose session is lost. Impact: a resume that could have run is refused and the run is started fresh, and nothing on GitHub is lost.
- **So: `defer`.** The pre-existing reopen lines belong to their own change. The mitigation, in this pull request, fixes the advice this pull request added, so the case the finding names is closed here.
- **The mitigation.** Task 6. The refused-fresh-launch sentence in the skill, and the two docs sentences, name `claude --plugin-dir <root> --resume <session id>`, with the skill's root being `${CLAUDE_PLUGIN_ROOT}`. Each says a reopen without the flag runs the installed release.

Decided by: redline

### R1-8: the startup refusal's line is wrong for a refused fresh launch — fix

Confirmed by reading `workflows/redline-loop.js` 49-72.

- The line always ends "a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost. Start fresh: /redline:redline <pr>".
- The PR has its own case of a refused fresh launch: loop-test 17a, `fresh`, and the PR spec's deviation 9. Typing the command again in that session is refused the same way, since the session keeps the workflow it loaded (m6-inplace-edit).
- The workflow cannot tell a fresh launch from a relaunch: a stopped run's relaunch adds nothing to `args`.
- The skill can tell them apart, and its error section gives each its next step. For `resumeFrom` null it says to "name the uncommitted spec folders to commit or remove before a fresh launch". For a refused fresh launch it says to reopen (line 275, with Task 6's flag).

- **Unattended answer.** Decision 3 of the PR spec ("A refusal ... offers Start fresh") is met by the skill, as that spec already says: "The workflow's own refusal is an error at stage `relaunch` with `resumeFrom` null, which the skill already handles that way (#81)" ("How the refusal offers Start fresh"). So the line can drop its next step without losing the offer.
- **Proportionality.** One template literal, its comment, and three existing loop checks plus one new one.
- **Instance or class.** The cause lives in the one template that builds the refusal for both variants: a recorded version, and none. The line names a next step its writer cannot choose. The skill-side version line of `scripts/redline-prefs.sh` is only ever read at a relaunch or a resume, where starting fresh is the way on. Its one gap, a reopen first in a session that loads a checkout in place, is R1-7's class, named in that drafted issue. Outcome `one-place`.
- **The change.** Task 7. The line states both versions and that nothing on GitHub is lost, and names no command. The comment says why.
- **Docs.** `docs/running.md` line 169 describes the line by its facts ("with the same facts in its own line"), which stay, so it is unchanged.
- **This round.** This round changes `workflows/redline-loop.js`. On the plugin's own repository, the run's next relaunch then goes from the pin by `scriptPath` (`docs/running.md`, "Hand-off and relaunch"). In manual and accept-edits mode, Claude Code asks once per relaunch.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)". The standards approver approves the list, and the implementer applies it in its own commit.

Applied as approved, items 1 to 4, in `752840e`.

### Deviations as built

Recorded by the implementer. None changes a disposition or what a task's cases pin. `plan.md`, "As built", has the detail.

1. **Task 2's commit subject** says "the session's config directory" and `~/.claude/`. The guard refuses `CLAUDE_CONFIG_DIR` and a bare `~/.claude` in a commit message as an attribution marker.
2. **Task 2's "Save the run record"** says the `CLAUDE_CONFIG_DIR` location of the record is expected, not measured. This follows the plan approver's note and process/docs-gate line 18.
3. **Task 2's `docs/running.md` clause** comes after the parenthetical list of what the marker holds, so that list still reads as the marker's.
4. **Task 6's three sentences** each end `(#137, R1-7)`, naming the finding the mitigation is for.

Decided by: redline

## Declined

- **R1-1.** The pull request makes this behaviour deliberate: its spec's `plan.md` "As built" deviation 10 and the description's "Behaviour that changes on purpose" say that on the plugin's own repository a round that changes the version in `plugin.json` ends the run at its next relaunch, and `docs/running.md` "Hand-off and relaunch" already says so.
- **R1-5.** could not confirm: needs `claude plugin list --json` run with Redline disabled at user scope and enabled at project scope, to see whether its `enabled` is each install's own or the merged setting for the plugin id (the install registry on disk holds no such flag, and enablement lives in settings by plugin id), and a reload and a reopen to see whether the session can still run the install it calls disabled.

## Deferred

### R1-7: Name --plugin-dir in every reopen line for a run launched from a checkout loaded in place

- **Mitigation, in this pull request (Task 6):** the reopen the skill and the docs give for a fresh launch the workflow refuses for its version names `claude --plugin-dir <root> --resume <session id>`.
- **Found:** A run launched from a checkout loaded in place (`claude --plugin-dir <checkout>`) can be resumed or relaunched only from a session that loads the same checkout, yet the lines that tell the person how to get back to the run's session say plain `claude --resume <session id>`: the `session` line of `redline-prefs.sh run check` (the `refuse session` call in `scripts/redline-prefs.sh` and its header), and in `skills/redline/SKILL.md` the resume's `session` reason in section 2, the stopped-run paragraph, the denied `scriptPath` relaunch, the closing sentence of "The script a relaunch runs" and the `error` section's resume line, with `docs/running.md` "Run markers and resume" and the README's Known limits bullet on resuming from the run's own session. A reopen without `--plugin-dir` runs the installed release instead (measured on Claude Code 2.1.332 with a throwaway plugin, m5 in the #135 spec), so the next command is refused for another version, or, at the same version, for another copy's agent files, and a run that could have been resumed is started fresh; and the version line of `run check` and `run drift` says to start fresh, which in a session that loads a checkout in place after its version changed is refused once more before the reopen advice comes.
- **Why:** These lines predate #135 (#10, #81), and closing them means a new form for `run check`'s `session` line with its prefs cases and header, and a reword in each of eight places in the skill, `docs/` and the README; PR #137 fixed only the advice its own change added, for a fresh launch the workflow refuses for its version.
- **Full fix:** Have `run check` print `claude --plugin-dir <args.pluginRoot> --resume <id>` in its `session` line when the marker's `args.pluginRoot` is not under `plugins/cache/` (a checkout loaded in place), with a prefs-test case for each form, have the version line say to reopen that way before starting fresh in the same case, and have each reopen sentence in the skill, `docs/running.md` and the README name the flag the same way, with the session's `${CLAUDE_PLUGIN_ROOT}` as the root where no marker gives one.

## Unattended answers

1. **R1-1: should a pinned relaunch be judged by the pin's version?** No: the pull request keeps the version refusal on purpose. The PR description, "Behaviour that changes on purpose": "On the plugin's own repository, a round that changes the version in `plugin.json` ends the run at its next relaunch." The PR spec's `plan.md`, deviation 10, says the same.

   Decided by: redline
2. **R1-3: refuse or warn when another copy at one version would run the launch's script under its own agents?** Refuse. The PR spec's `shape.md`, Context, "Product alignment": "A relaunch that reruns a pushed round under another build, or a run that mixes two builds' agents, is the failure this closes." Decision 1: "No relaunch runs another build's script without the person being told and choosing Start fresh." workflow/agents.md line 45 already records that "a script run from the harness's copy under another copy's agents mixes the two".

   Decided by: redline
3. **R1-2: does the fix change deviation 7?** No. Deviation 7 makes `run drift` need the marker, and that stays. Its premise ("It exits 2 only when the harness's record layout changes") is what the fix makes true, by looking where a session's config directory can be.

   Decided by: redline
4. **R1-8: does dropping "Start fresh" from the workflow's line break decision 3?** No. The PR spec, "How the refusal offers Start fresh": "The workflow's own refusal is an error at stage `relaunch` with `resumeFrom` null, which the skill already handles that way (#81)". The skill's error section names the folders to commit or remove before a fresh launch.

   Decided by: redline
5. **R1-4: warning or stop?** Warning. The setup header: "[] when ... the CLI is missing, fails or prints no list"; SKILL.md line 90: "A warning, never a stop"; the PR description: "It is a warning, never a stop."

   Decided by: redline
6. **Measurement.** The guard refuses to the shaper, as seen this round:
   - `redline-prefs.sh run` and the test harnesses;
   - `claude`, an environment prefix and `export`;
   - `bash <file>`;
   - `/usr/bin/jq`;
   - a shell loop.

   So:
   - R1-4's chain and its members were run in pieces with jq 1.8.2.
   - jq 1.7.1, CI's, was read from jq's `NEWS.md`.
   - R1-2's and R1-3's code paths were read.
   - R1-5's second look read the install registry and the settings on disk.

   Each task's cases are the code's measurement, seen red then green through the gate. Task 4's cases expect, after the change, only what jq 1.7 and 1.8 both give.

   Decided by: redline
7. **Version.** Stays `0.5.1`. The pull request bumped it once, and a review round of the same pull request adds no bump. No template body changes, so the marker stays v7.

   Decided by: redline
8. **Self-hosted.** This round changes `workflows/redline-loop.js` and `skills/redline/SKILL.md`.
   - A relaunch of this run runs the script it launched with, from the pin once the file differs (`docs/running.md`, "Hand-off and relaunch").
   - The skill's text already in the conversation keeps the root it was expanded with.
   - No agent file changes.
   - Task 3's check is skipped for this run, whose launch copy is the session's.
   - Task 2's search is unchanged for it, since this session sets no `CLAUDE_CONFIG_DIR`.

   Decided by: redline
9. **Visuals, product context.** None. `agent-os/product/` does not apply to a review round.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:**
  - `scripts/redline-prefs.sh`: `version_line`, `run save`, `run drift` and `run check`.
  - `scripts/redline-setup.sh`: `version_installs` and `cmd_version`.
  - `workflows/redline-loop.js`: the startup refusal.
  - `skills/redline/SKILL.md`: sections 2, 4, 5 and 7, and `error`.
  - `tests/prefs-test.sh`, `tests/setup-test.sh`, and `tests/loop-test.mjs` section 17a.
  - `docs/running.md`, `docs/upgrading.md`, `docs/scripts.md`.
  - `.github/workflows/gate.yml`: the two legs and the macOS PATH.
  - jq 1.8.2's `NEWS.md`: the 1.7 and 1.8 differences.
  - The PR's spec folder.
  - The reviewer's and the shaper's scratch files under `/tmp/redlinerepro/`.

  See `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- **workflow/replay**, line 24: `args.launch` is read at startup only. Task 7 changes a result's error text, which no prompt holds, so no prompt changes.
- **workflow/agents:**
  - line 16: a message says when it fires in the words of the decision behind it (R1-8);
  - line 17: a rule is changed everywhere it is stated (R1-6);
  - line 45: agent files cannot be pinned, and a script under another copy's agents mixes the two (R1-3).
- **scripts/bash-conventions:**
  - line 8: a function inside `$(...)` runs with `-e` off, and what it printed is checked before it is used (R1-4);
  - line 43: bash 3.2 and BSD tools, and the jq CI's legs carry (R1-2's search, R1-3's `diff -rq`, R1-4's jq);
  - line 48: the read-only `version <repoRoot>` (R1-4).
- **testing/tests:**
  - line 30: a case per changed surface with its neighbour, a case per clause (R1-4's two path cases);
  - line 35: red before green, and a pin that holds before is seen red under a mutation;
  - line 49: the stub CLI for setup cases (R1-4).
- **process/docs-gate:**
  - line 5: each touched plugin file names its section;
  - line 16: `docs/scripts.md` follows each header verbatim;
  - line 18: the config directory's unmeasured behaviour is not stated as fact (R1-2).
- **process/release**, line 5: no bump in a review round.
- **prompts/attribution:** Redline only.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 45.** After "so another release's agents arrive only with another version, which a relaunch refuses (#135)", insert: ", and a checkout and a release at one version are two builds, so `run drift` compares the agent files of the copy the run launched from (`args.pluginRoot`) with the session's whenever the two are different directories, and refuses the relaunch when they differ or the launch's copy is gone: compared only by version and workflow file, a reopen across the two ran the launch's script under the other copy's agents with no word (#137, R1-3)".
2. **`agent-os/standards/workflow/agents.md`, line 16.** Append: "; and a line returned for more than one case states only what holds in each and leaves the next step to the reader that can tell them apart: the workflow's startup version refusal, which cannot tell a fresh launch from a relaunch, told a refused fresh launch to start fresh in the session that would refuse it again, until #137, R1-8".
3. **`agent-os/standards/scripts/bash-conventions.md`, line 8.** Append: "; `version_installs` read `claude plugin list --json` with no fallback for its own jq, so a version or a path of another type printed nothing, and `cmd_version`'s `--argjson` of that empty output exited 2, which the launch precheck reads as not set up, where the header promised a warning that never stops (#137, R1-4). A check that a program printed one JSON value reads the whole stream (`jq -se 'length == 1 and (.[0] | type == "array")'`), since `jq -e` answers for the last value only: two lists in one output passed `jq -e 'type == "array"'`, and `--argjson` refused the two arrays the program then printed (#137, R1-4). A jq program that reads another program's JSON hands a string builtin only text (`tostring` first), since jq's versions differ on a non-string: from jq 1.8, `rtrimstr` fails on one, while jq 1.7, the jq of CI's legs, returns it unchanged. A setup case that leaned on that failure was red before the fix and green after under this machine's jq 1.8.2, and would have been green before and red after on CI, until the plan approver of #137's round 1 bounced it. So a case expects only what both versions give, and a spec names the jq version of each red it records".
4. **`agent-os/standards/scripts/bash-conventions.md`, new line after line 48.** "A file Claude Code keeps for a session (a workflow run's record) is looked for by one script, under the directory the session's `CLAUDE_CONFIG_DIR` names and then under `~/.claude`, and the skill reads the path that script printed instead of spelling the location again: `run save` and the skill's own Glob both looked only under `~/.claude`, so with the record elsewhere every hand-off stopped once #135 made the marker required (#137, R1-2). Where Claude Code keeps it under `CLAUDE_CONFIG_DIR` was not measured, so the search covers both."
5. **`agent-os/standards/testing/tests.md`: no change.** The round's cases are instances of lines 30 (a case and its neighbour, a case per clause), 35 (red before green, a pin that holds before seen red under a mutation) and 49 (the stub CLI). The jq-version rule for a case goes with item 3, where the cause is.
6. **`agent-os/standards/process/docs-gate.md`: no change.** R1-7's class (a reopen line for a session that loads Redline in place names `--plugin-dir`) is deferred. A standard for it waits for that issue's fix, since most reopen lines break it today.
