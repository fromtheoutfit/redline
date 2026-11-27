# PR #137 review round 3: another copy refused by its real path, agent names read whole from git, and the installs docblock

Spec folder: `agent-os/specs/2026-11-27-0922-137-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #137 (issue #135), from the round's six findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

## Dispositions

- **`fix`**, one task each, in finding order:
  - R3-2 (Task 2);
  - R3-4 (Task 3);
  - R3-6 (Task 4).
- **`decline`**, with no task: R3-1 and R3-3, both closed by Task 2's change and pinned by its cases, and R3-5. Their reasons are in `shape.md`, "Declined".
- No `defer`, no `ask`.

## Conventions

- **Commits** follow "Git rules for Redline agents" in `README.md`:
  - the `redline:` prefix;
  - one commit per finding;
  - files staged by name;
  - the spec folder in its own first commit, and the As built notes in the last.
- **Commit messages.**
  - Every finding commit opens `redline: <id>` and ends `(#135)`.
  - No commit message holds a bare `@word`.
  - None holds the product name the guard's attribution check matches (round 1, deviation 1). So no subject below names the CLI or its config directory.
- **Line numbers** are at `9532f9d`, the head of the branch.
  - Each task also names its anchor by text, since earlier tasks move later lines.
  - Each task's anchors are as the tasks before it leave them.

## What this plan does not touch

- `hooks/hooks.json`, `scripts/redline-guard.sh`, `tests/guard-cases.tsv`. The guard's refusal of another copy's scripts, which Task 2 rests on, is pinned there today (rows 248 and 553).
- Anything under `templates/`, `agents/` or `workflows/`.
- `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text.
- `README.md` and `docs/upgrading.md`. Neither states the copy rule; `docs/running.md` does, and Task 2 changes it there.
- The version. It stays `0.5.1`: the pull request bumped it once, and a review round adds no bump.

## The plugin's own files

This round edits `scripts/redline-prefs.sh` (Tasks 2 and 3), `scripts/redline-setup.sh` (Task 4) and `skills/redline/SKILL.md` (Task 2). No workflow or agent file changes.

- The skill text already in this run's conversation keeps its old text.
- The scripts are read from disk at each call, so this run's next `run drift` runs the new one:
  - Task 2's `copy_line` lets this run through, since it launched from this checkout loaded in place, so `args.pluginRoot` is `--plugin`;
  - Task 3's list stays empty, since no round of this run changed an agent file.

## Task order matters in three files

- **`scripts/redline-prefs.sh`:**
  - Task 2: the header's `run drift` entry (78-111); the helpers' comment and `agent_list` (140-159); `copy_line` and its comment (228-264); the pin comment in `run drift` (373-378).
  - Task 3: `agent_paths` and the helpers' comment as Task 2 leaves them; the #81 list and its comment (395-400); the header's `agents` sentence as Task 2 leaves it.
- **`tests/prefs-test.sh`:**
  - Task 2: the comments at 457 and 460; `cline` (469); the checks at 470-474; the R2-1 copy block (486-503); the `run check` case at 523-527.
  - Task 3: after `rm "$REPO/agents/notes.txt" "$REPO/agents/.DS_Store"` (594), before `run save "$REPO" 7 --run-id wf_12 --record "$REC/fallback.json"` (595).
- **`docs/scripts.md`**, the `redline-prefs.sh` block (194-311): Tasks 2 and 3.

## Running the plan

- **Snapshot for the gate:** `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-3/redline/snapshot.json`.
- Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`.

**Red before green.** Each task adds its cases first and sees them fail on a gate run, then makes the change and sees them pass.
- **The red run** is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-3/redline/snapshot.json`, which prints the failing case names. The count recorded is the harness's own summary line, read off the run.
- **A pin whose outcome already holds** before the change cannot be red before the build. It is written with the others, As built says so, and it is seen red under the mutation the task names.
- **A mutation** is made with Edit on the file named, and undone by copying back a copy saved before it; `cmp` against that copy and `git diff --quiet` on the file confirm each restore, as round 2 did.
- **Slow gate runs.** If gate runs are slow, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own cases, and the combined run is recorded under As built.

**Existing checks.** Only the checks Task 2 names change their expectation or are removed. Any other existing check that goes red is a fault in the task.

**shellcheck.** Tasks 2 to 4 change `.sh` files. CI's shellcheck job checks `scripts/*.sh` and `tests/*.sh` on the push. It is not on the implementer's allowlist, so As built records that it was left to CI.

**set -e.** `scripts/redline-prefs.sh` runs under `set -euo pipefail`, and a function run inside `$(...)` runs with `-e` off (bash-conventions, line 8). So `agent_paths` returns 0 on every path, and its caller reads only what it printed.

**Escapes.** A typed backslash-u escape can reach a file as the character itself. No task below types one: where a line holds one (the `(this session` label in `scripts/redline-setup.sh`), the task leaves it as it is.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: save review round 3 spec for PR #137 (#135)`.

## Task 2: R3-2 — refuse a relaunch or a resume from any other copy by its real path

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`, `docs/running.md`, `skills/redline/SKILL.md`

**The rule.** When `args.pluginRoot` is set and its real path is not `--plugin`'s (another copy at the run's version, or a launch copy that is gone), `copy_line` prints the refusal line, whatever the two copies' agent files hold. A relaunch keeps `args.pluginRoot`, every agent's prompt names that copy's scripts, and the session's guard runs only its own copy's. The same copy reached through a link is one copy.

### The line

With `<launch copy>` being `args.pluginRoot` as recorded and `<session copy>` being `--plugin`:

`The run on #7 started from the Redline 1.2.3 copy at <launch copy>, and this session loads Redline 1.2.3 from <session copy>, another copy: the rest of the run would call the scripts of the copy it started from, which this session's guard refuses, and run under this copy's agents. Nothing on GitHub is lost; start fresh after committing or removing <folders>`

### 1. Red, in `tests/prefs-test.sh`

1. **`cline` (469).** Its text becomes the line above, with `$1` and `$2` for the two copies and `$FOLDER` for the folders, as today.
2. **The comment at 460.** `# Another copy at the same version (#137, R1-3): its agents are another build's unless they equal the launch copy's.` becomes `# Another copy at the same version (#137, R1-3): refused by its real path, whatever its agent files hold, since a relaunch keeps args.pluginRoot and the session's guard refuses that copy's scripts (#137, R3-2).`
3. **The comment at 457.** `# The same release from another install directory: the record's path is the first install's file.` becomes `# The same release from another install directory, in a marker with no args.pluginRoot, which skips the copy check (a real launch always records one, #137, R3-2): the record's path is the first install's file.` The check under it is unchanged.
4. **The four checks at 470-474 flip.**
   - 470: `runj "drift: another copy at the same version, its workflow and agents as the launch copy's, is refused, naming both copies (#137, R3-2)" "$DRIFT" "false|refuse|||null|$(cline "$PLUG" "$REC/plugin3")" drift "$REPO" 7 --plugin "$REC/plugin3"`
   - 471: `runx "drift: another copy whose files agree exits 1 (#137, R3-2)" 1 drift "$REPO" 7 --plugin "$REC/plugin3"`
   - 473: `runj "drift: another copy, its workflow edited, its agents as the launch copy's, is refused before the pin is read" "$DRIFT" "false|refuse|||null|$(cline "$PLUG" "$REC/plugin3")" drift "$REPO" 7 --plugin "$REC/plugin3"`
   - 474: `runx "drift: another copy whose agents agree, its workflow edited, exits 1" 1 drift "$REPO" 7 --plugin "$REC/plugin3"`
5. **The R2-1 copy block (486-503) is removed**, from its comment `# Only agent files count (#137, R2-1): ...` through the cleanup `rm -rf "$REC/plugin3/agents/.DS_Store" ...`. Its five checks pinned the agent-file comparison this task removes:
   - `drift: files under agents/ that are no agent files, in either copy, are not compared: by name` and its exit check;
   - `drift: a *.md file under a part that starts with a dot is no agent file: by name`;
   - `drift: an agent file only in the session's copy is still refused`;
   - `drift: an agent file in a subdirectory of agents/ counts, so one only in the session's copy is refused`.

   The #81 list's R2-1 case (591-594) stays: `agent_paths` still holds that rule.
6. **In its place**, right after `runx "drift: another copy with no agents/ exits 1" 1 drift "$REPO" 7 --plugin "$REC/plugin4"` (485), add this comment and the cases below:

   `# Refused by the real path, whatever the agent files hold (#137, R3-2): two copies whose agents/ are links (#137, R3-1), and a launch by the scriptPath fallback from a copy edited since (#137, R3-3), are refused as any other copy is.`

   - **(a) Two copies whose `agents/` are links to agent files that differ (R3-1's case).**
     - `cp -R "$PLUG" "$REC/plugin5"`, `rm -r "$REC/plugin5/agents"`, `mkdir -p "$REC/agents5"`, `printf 'shaper v1\n' > "$REC/agents5/redline-shaper.md"`, `ln -s "$REC/agents5" "$REC/plugin5/agents"`.
     - The same for `plugin6`, from `$PLUG`, with `$REC/agents6/redline-shaper.md` holding `shaper v2`.
     - A record `$REC/pinned-linked.json`, built with `printf` as `pinned-copy.json` is (466) but with `"runId":"wf_29"` and `"pluginRoot":"'"$REC"'/plugin5"`; save it: `run save "$REPO" 7 --run-id wf_29 --record "$REC/pinned-linked.json" >/dev/null 2>&1`.
     - `runj "drift: two copies whose agents/ are links to agent files that differ are refused (#137, R3-1)" "$DRIFT" "false|refuse|||null|$(cline "$REC/plugin5" "$REC/plugin6")" drift "$REPO" 7 --plugin "$REC/plugin6"`
     - Seen red: today `name`, since `agent_list` lists nothing through either link and the two empty lists agree.
   - **(b) A fallback launch from a copy edited since (R3-3's case).**
     - A record `$REC/fallback-copy.json`: `{"runId":"wf_30","scriptPath":"<$PLUG>/workflows/redline-loop.js","args":{<L>"pr":7,"pluginRoot":"<$PLUG>"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["<$FOLDER>"]}}`, built with `printf` as the records above it are; save it with `--run-id wf_30`.
     - `printf 'edited launch copy\n' > "$PLUG/workflows/redline-loop.js"`
     - `runj "drift: a fallback launch from a copy edited since, from another copy at the version, is refused for the copy before the record's file is read (#137, R3-3)" "$DRIFT" "false|refuse|||null|$(cline "$PLUG" "$REC/plugin3")" drift "$REPO" 7 --plugin "$REC/plugin3"`
     - Seen red: today `false|scriptPath|<$PLUG>/workflows/redline-loop.js||{...}|`, the launch copy's edited file taken as the pin.
     - **Neighbour:** `runj "drift: the same launch from its own copy has no pin, and its edited file is refused" '[.launch, (.drift.pinned|tostring)] | join("|")' "refuse|false" drift "$REPO" 7 --plugin "$PLUG"`. Holds before and after.
     - Then `printf 'launch script\n' > "$PLUG/workflows/redline-loop.js"`.
   - **(c) Neighbour: the launch copy reached through a link.**
     - `ln -s "$PLUG" "$REC/plug-link"`, then save `wf_26` again (`run save "$REPO" 7 --run-id wf_26 --record "$REC/pinned-copy.json" >/dev/null 2>&1`).
     - `runj "drift: the launch copy reached through a link is the same copy: by name (#137, R3-2)" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$REC/plug-link"`
     - Holds before. Seen red under mutation M1.
   - **The state after these cases** is the one the check at 504 reads today: `$PLUG`'s workflow holds `launch script`, `plugin3`'s agent file `shaper v1`; the cases at 504-508 save their own markers.
7. **The `run check` case at 523-527.** Keep `printf 'shaper v1\n' > "$REC/plugin3/agents/redline-shaper.md"` (523) and the save of `wf_26` (525). Remove the `.DS_Store` lines (524, 527) and replace the check at 526 with:
   - `runj "check: another copy whose agent files agree is refused too, by its path (#137, R3-2)" "$CHECK" "false|copy|$(cline "$PLUG" "$REC/plugin3")" check "$REPO" 7 --plugin "$REC/plugin3"`. Seen red: today `true||`.
   - `runj "check: the launch copy reached through a link is not refused for its copy (#137, R3-2)" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$REC/plug-link"`. Holds before. Seen red under mutation M1 (testing/tests, line 13: the rule pinned at the second gate).

**What the red run shows.** Red: the four flipped checks (470, 471, 473, 474), case (a), case (b)'s first check, and the new `run check` refusal. Red too, from the new `cline` text alone, until the code's line changes: the checks at 476, 479, 484, 506, 512 and 529, whose expected line it builds. Every other check passes.

### 2. Green, in `scripts/redline-prefs.sh`

1. **`copy_line` (236-264).** Keep the `lroot`, `lreal` and `realdir` lines through `[[ "$lreal" != "$(realdir "$plugin")" ]] || return 0` (238-244). Remove the comparison after it (245-259: `differ`, `agent_list`, the `cmp` loop, `[[ "$differ" == true ]] || return 0`). Keep `now` and `folders` (260-261), and echo the line above, with `#$pr`, `$now`, `$lroot`, `$plugin` and `${folders:-its spec folders}` where the current line has them. `local` loses `lagents pagents f differ`. It always returns 0.
2. **Its comment (228-235)** becomes:

   ```
   # The copy a run launched from against the copy this session loaded (#137, R1-3), shared by check
   # and drift, as version_line is (#137, R2-3): prints the refusal line when they are two directories
   # by real path, nothing when they are one, and always returns 0. A relaunch keeps args, and
   # args.pluginRoot names the copy whose scripts every agent's prompt calls (redline-gh.sh,
   # redline-background.sh), while the guard the session's copy registers runs only its own copy's:
   # so another copy is refused whatever its agent files hold, and so is a launch copy that is gone
   # (#137, R3-2). A checkout and a release at one version are two copies, and their agents would mix
   # besides (the #135 spec's m4-agents-pin-reopen). A marker with no args.pluginRoot prints nothing.
   ```
3. **`agent_list` (153-159) is removed**, with its two comment lines; nothing else calls it (`grep -c -F 'agent_list' scripts/redline-prefs.sh` prints `0` after). The shared comment above `agent_paths` (140-143) becomes:

   ```
   # The agent files run drift lists on the plugin's own repository (#81; #137, R2-1): a *.md file
   # under agents/ whose path has no part that starts with a dot. The roles are the Markdown files
   # under agents/, and a .DS_Store, an editor's backup, an AppleDouble ._ file or a scratch note
   # there is no role. A *.md file in a subdirectory counts.
   ```

   `agent_paths` itself is unchanged here (Task 3 changes it).
4. **The pin comment in `run drift` (373-378).** After `with no pin, the launch read the file from disk, whose blob args.launch recorded.` add: `copy_line has already refused any session copy other than args.pluginRoot's, so a fallback launch's recorded file, args.pluginRoot's own, is the live file here (#137, R3-3).`
5. **The header's `run drift` entry.** Lines 83-91, from `Then the copy (#137, R1-3): when` through `A marker with no args.pluginRoot skips this.`, become:

   `Then the copy (#137, R1-3): when args.pluginRoot is another directory than --plugin by real path (a checkout and a release, or two checkouts, at one version, or a launch copy that is gone), launch is refuse, whatever their agent files hold (#137, R3-2): a relaunch keeps args.pluginRoot, every agent's prompt names that copy's scripts, and the guard the session's copy registers runs only its own copy's, so the rest of the run would stop at its first script call, under another build's agents besides; line names both copies, and run check refuses the same copy as its copy reason (#137, R2-3). A marker with no args.pluginRoot skips this.`

   In lines 101-104, `lists every agent file (by the same rule) that differs from the launch commit` becomes `lists every agent file (#137, R2-1: a *.md file under agents/ whose path has no part that starts with a dot, so a .DS_Store or an editor's backup there is none) that differs from the launch commit`.

   Re-wrap to the header's width, keeping `whatever their agent files hold` on one line.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block (194-311) takes the same header lines, verbatim.

### 4. `skills/redline/SKILL.md`

1. **The Resume bullet (51).** `For \`copy\` (#137, R2-3) the session loads another copy of Redline at the run's version than the one the run launched from (a checkout and an installed release, or two checkouts), whose agent files differ from that copy's or which is gone: the rest of the run would mix two builds' agents.` becomes:

   `For \`copy\` (#137, R2-3) the session loads another copy of Redline at the run's version than the one the run launched from (a checkout and an installed release, or two checkouts, or a launch copy that is gone): the rest of the run would call the scripts of the copy it started from, which this session's guard refuses, under this copy's agents (#137, R3-2).`
2. **The `refuse` bullet of "The script a relaunch runs" (251).** `or the session loads another copy of Redline at that version than the one the run launched from (a checkout and an installed release, or two checkouts), whose agent files differ from the launch copy's or cannot be compared with it, so the rest of the run would mix two builds' agents (#137, R1-3);` becomes:

   `or the session loads another copy of Redline at that version than the one the run launched from (a checkout and an installed release, or two checkouts, or a launch copy that is gone), so the rest of the run would call the scripts of the copy it started from, which this session's guard refuses, under this copy's agents (#137, R1-3, R3-2);`

### 5. `docs/running.md`

1. **"Hand-off and relaunch", the bullet `**Another copy at the same version:**` (162)** becomes:

   `- **Another copy at the same version:** the session loads another copy of Redline than the run launched from, at the same version: a checkout loaded in place and an installed release, or two checkouts. The relaunch is refused the same way, whatever the two copies' agent files hold, and so is one whose launch copy is gone: a relaunch keeps the run's arguments, which name the copy it launched from (\`args.pluginRoot\`), so every agent's prompt names that copy's scripts, and the guard the session's copy registers runs only its own copy's, so the rest of the run would stop at its first script call, under the other copy's agents besides (#137, R1-3, R3-2). A resume is refused the same way by \`run check\`, before anything is asked, and the skill offers to start fresh, as for another version (#137, R2-3).`
2. **The bullet `**An agent file changed,**` (166).** `**An agent file changed** (a \`*.md\` file under \`agents/\`, by the same rule), on the plugin's own repository:` becomes `**An agent file changed** (a \`*.md\` file under \`agents/\` whose path has no part that starts with a dot, so a \`.DS_Store\` or an editor's backup there is none; #137, R2-1), on the plugin's own repository:`, since the bullet it pointed to no longer gives the rule.
3. **The paragraph at 172.** `A checkout and a release at one version are two builds too, so \`run drift\` compares their agent files (the bullet above).` becomes `A checkout and a release at one version are two copies, and a relaunch from one under the other is refused (the bullet above).`
4. **"Run markers and resume" (225).** `the session loads another copy of Redline at the run's version than the one the run launched from, whose agent files differ from that copy's or which is gone (#137, R2-3; the line names both copies, and the skill offers to start fresh, as for a version),` becomes `the session loads another copy of Redline at the run's version than the one the run launched from, whatever its agent files hold, since the run's agents call the scripts of the copy it launched from, which the session's guard refuses (#137, R2-3, R3-2; the line names both copies, and the skill offers to start fresh, as for a version),`.

### Mutation M1

After the green run, in `copy_line`, compare the two spellings in place of the real paths (`[[ "$lroot" != "$plugin" ]] || return 0` for the `realdir` comparison). Expected red: case (c) and the `run check` link-spelling case. Restore, then confirm as "Running the plan" says.

### Proof

The gate run shows the new and flipped checks passing. Then:
- `grep -c -F 'agent_list' scripts/redline-prefs.sh` prints `0`.
- `grep -c -F 'cannot be compared with it' scripts/redline-prefs.sh` prints `0`, and so does the same grep of `skills/redline/SKILL.md`.
- `grep -c -F 'mix two builds' skills/redline/SKILL.md` prints `0`.
- `grep -c -F 'whatever their agent files hold' scripts/redline-prefs.sh` prints `1`, and so does the same grep of `docs/scripts.md`.
- `grep -c -F 'R3-2' skills/redline/SKILL.md` prints `2`.
- `grep -c -F 'R1-3, R3-2' docs/running.md` prints `1`, and `grep -c -F 'R2-3, R3-2' docs/running.md` prints `1`.

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block; `docs/running.md`, "Hand-off and relaunch" and "Run markers and resume"; all updated in this task.
- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch" and "Run markers and resume", the same edits.
- No new exit code, subcommand or key: the refusal already exits 1, and `copy` is already a reason.

### Commit

`redline: R3-2 refuse a relaunch or a resume from any other copy by its real path, whatever its agent files hold (#135)`

## Task 3: R3-4 — read agent names from git with `-z`, so a name git would quote is listed whole

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`

After Task 2, which removes `agent_list`, so `agent_paths` has one caller, the #81 list.

### 1. Red

In `tests/prefs-test.sh`, after `rm "$REPO/agents/notes.txt" "$REPO/agents/.DS_Store"` (594) and before `run save "$REPO" 7 --run-id wf_12 --record "$REC/fallback.json"` (595), add this comment and the cases below:

`# A name git would quote is listed as it is named (#137, R3-4): both git listings run with -z, and agent_paths reads NUL-terminated names.`

**The fixtures there:** the marker is `wf_11`, on the plugin's own repository (`--plugin "$REPO"`), and the list holds `agents/redline-reviewer.md` alone, as the check at 593 reads it.

- **(i) A byte above 0x7f, untracked.**
  - `printf 'role\n' > "$REPO/agents/zé.md"`
  - `runj "drift: an untracked agent file whose name holds a byte above 0x7f is listed as it is named (#137, R3-4)" '.agents | join(",")' "agents/redline-reviewer.md,agents/zé.md" drift "$REPO" 7 --plugin "$REPO"`
  - Seen red: today `agents/redline-reviewer.md` alone, since `ls-files` prints the name quoted.
- **(ii) The same file staged, so the diff lists it.**
  - `"${G[@]}" add agents/zé.md`
  - `runj "drift: the same agent file staged is listed from the diff as it is named (#137, R3-4)" '.agents | join(",")' "agents/redline-reviewer.md,agents/zé.md" drift "$REPO" 7 --plugin "$REPO"`
  - Then `"${G[@]}" rm -q --cached agents/zé.md` and `rm "$REPO/agents/zé.md"`.
  - Seen red: today the diff prints the name quoted.
- **(iii) A double quote, which git quotes whatever `core.quotePath` says.**
  - `printf 'role\n' > "$REPO/agents/z\"q.md"`
  - `runj "drift: an agent file whose name holds a double quote is listed as it is named (#137, R3-4)" '.agents | join(",")' 'agents/redline-reviewer.md,agents/z"q.md' drift "$REPO" 7 --plugin "$REPO"`
  - Then `rm "$REPO/agents/z\"q.md"`.
  - Seen red: today dropped.
- **(iv) A newline, kept as one entry.**
  - `printf 'role\n' > "$REPO/agents/z"$'\n'"n.md"`
  - `runj "drift: an agent file whose name holds a newline is listed as one entry (#137, R3-4)" '.agents | tojson' '["agents/redline-reviewer.md","agents/z\nn.md"]' drift "$REPO" 7 --plugin "$REPO"`
  - Then `rm "$REPO/agents/z"$'\n'"n.md"`.
  - Seen red: today dropped.
- Each name sorts after `agents/redline-reviewer.md` in any locale, since `z` follows `r`.
- **Neighbours that must not change.** The list's other checks still pass, their order included: 569, 570, 580, 581, 583, 585, 589 (`agents/redline-new.md,agents/redline-reviewer.md`), 593 (a `.DS_Store` and a `notes.txt` are not listed) and 599.

### 2. Green, in `scripts/redline-prefs.sh`

1. **`agent_paths`.** It reads NUL-terminated paths and prints each agent file as a JSON string on a line of its own:

   ```
   agent_paths() {
       local p
       while IFS= read -r -d '' p; do
           case "/$p" in */.*) continue ;; esac
           case "$p" in *.md) jq -cn --arg p "$p" '$p' ;; esac
       done
       return 0
   }
   ```

   Its one-line comment (`# agent_paths: the paths on stdin, one a line, that are agent files.`) becomes:

   ```
   # agent_paths: the NUL-terminated paths on stdin, as git prints them with -z, that are agent
   # files, each printed as a JSON string on a line of its own. Without -z git quotes a name holding
   # a byte above 0x7f, a double quote, a backslash or a control character, and core.quotePath=false
   # lifts only the first, so such a file was dropped as no *.md (#137, R3-4); as a JSON string a
   # name holding a newline stays one entry.
   ```
2. **The #81 list (399)** becomes:

   `agents="$({ git -C "$root" diff -z --name-only "$start" -- agents/; git -C "$root" ls-files -z --others --exclude-standard -- agents/; } | agent_paths | sort -u | jq -sc .)"`

   Its comment (395-396) becomes `# Agent files: only the plugin's own repository lists them (#81), and only agent files (agent_paths, #137, R2-1), each as it is named (git's -z, #137, R3-4).`
3. **The header's `agents` sentence**, as Task 2 leaves it: after `that differs from the launch commit (args.startSha), uncommitted and untracked ones included` insert `, each as it is named (#137, R3-4: git lists them with -z, so a name it would quote is read whole)`. Re-wrap to the header's width.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block takes the same header lines, verbatim.

### Proof

- The gate run shows the four new checks passing.
- `grep -c -F 'read -r -d' scripts/redline-prefs.sh` prints `1`.
- `grep -c -F 'diff -z --name-only' scripts/redline-prefs.sh` prints `1`, and `grep -c -F 'ls-files -z --others' scripts/redline-prefs.sh` prints `1`.
- `grep -c -F 'R3-4' docs/scripts.md` prints `1`.

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block, updated in this task. `docs/running.md`, "Hand-off and relaunch", the bullet `**An agent file changed**`: no reader-facing change, since it already says the changed agent files are named, and a name git would quote is now named as it is.
- No new exit code, subcommand or key.

### Commit

`redline: R3-4 list agent files with git's -z, so a name git would quote is listed as it is named (#135)`

## Task 4: R3-6 — say that every install sharing the session's folder is marked running, and pin it

**Files:** `scripts/redline-setup.sh`, `tests/setup-test.sh`

### 1. The cases, in `tests/setup-test.sh`

After `expect_json "installs: two lists: none listed" '.installs | length' "0" version "$VR"` (1093) and before `unset STUB_LIST` (1094), add:

```
# Installs at one version share the plugin cache's version folder, so each whose installPath is this
# script's root runs this session's files, and each is marked so (#137, R3-6).
jq -cn --arg pp "$PP" --arg root "$VRP" '[{id: "redline@m", scope: "user", version: "0.5.1", enabled: true, installPath: $pp}, {id: "redline@m", scope: "project", version: "0.5.1", enabled: true, installPath: $pp, projectPath: $root}, {id: "redline@m", scope: "local", version: "0.4.3", enabled: true, installPath: "/c/redline/0.4.3", projectPath: $root}]' > "$WORK/i-shared.json"
export STUB_LIST="$WORK/i-shared.json"
expect_json "installs: two installs sharing this session's folder are each marked running (#137, R3-6)" "$INSTALLS" "user:0.5.1:true,project:0.5.1:true,local:0.4.3:false" version "$VR"
err="$("$SETUP" version "$VR" 2>&1 >/dev/null)"
want="redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.5.1 (this session's), local 0.4.3$LINE_TAIL Update the older one: claude plugin update redline@m --scope local, run from $VRL; then restart the session or run /reload-plugins"
[[ "$err" == "$want" ]] && ok "installs: both are labelled this session's, and only the older one is updated (#137, R3-6)" || bad "installs: both are labelled this session's, and only the older one is updated (#137, R3-6)" "$err"
```

Both hold before the change, since the code already marks each such install. They are written with the comment changes below, and seen red under mutation M2.

### 2. The comments

1. **`scripts/redline-setup.sh`, `version_installs`' docblock (1497-1499).** From `Prints them as [{scope, version, running}], running true for the install whose` through `A root that no seen install uses is no install this session runs, so nothing is listed.`, the text becomes:

   ```
   # relaunch. Prints them as [{scope, version, running}], running true for each install whose
   # installPath is this script's root, the copy the session loaded, and only installs of their id.
   # The plugin cache keeps one folder per version, so installs at one version share it: each of them
   # runs this session's files, whichever the session took as listed first, so each is marked and is
   # labelled this session's in the line (#137, R3-6). A root that no seen install uses is no install
   # this session runs, so nothing is listed.
   ```

   The code is unchanged.
2. **`tests/setup-test.sh`, the block comment (1001-1002).** `claude plugin list --json lists every install; the one this session runs is` / `the one whose installPath is this script's root.` becomes `claude plugin list --json lists every install; the ones whose installPath` / `is this script's root run this session's files, and installs at one version share one cache` / `folder, so there can be more than one (#137, R3-6).`

### Mutation M2

In `version_installs`, mark and label only the user install: in `running: mine` (1522) and in `(if mine then` (1525), insert ` and .scope == "user"` right after `mine`, so the two read `running: (mine and .scope == "user")` and `(if mine and .scope == "user" then`. The rest of line 1525, the jq escape for the label's apostrophe included, is left exactly as it is. Expected red: both new checks. Restore, then confirm as "Running the plan" says.

### Proof

- The gate run shows the two new checks passing.
- `grep -c -F 'R3-6' scripts/redline-setup.sh` prints `1`, and `grep -c -F 'R3-6' tests/setup-test.sh` prints `4` (the block comment, the new comment, the `expect_json` line and the line check).

### Docs

`scripts/redline-setup.sh`: no reader-facing change. The header, the warning line and `installs` are unchanged; only the function's docblock now states the rule the code already follows, so `docs/scripts.md`'s copy of the header stands.

### Commit

`redline: R3-6 say that every install sharing the session's folder is marked running, and pin it (#135)`

## Task 5: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its README or `docs/` section, or "no reader-facing change" with the reason, for every file it touches under `scripts/` and `skills/`. As built records each entry's commit.
- **11. Version.** `0.5.1` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `REDLINE_VERSION`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it.
  - It is applied after the finding commits, in its own commit: `redline: record the round 3 review lessons in the standards (#135)`.
  - Its files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/workflow/replay.md`, `agent-os/standards/scripts/bash-conventions.md`.
- **13. Spec folder.** `plan.md` gains an As built section in the last commit: `redline: record the as-built state of review round 3 for PR #137 (#135)`.
  - It records:
    - each task's commit;
    - its red and green counts, read off the gate's summary lines;
    - every mutation run;
    - which pins held before the change;
    - the existing checks Task 2 changed or removed;
    - that shellcheck was left to CI.
  - Any deviation is recorded under Decisions in `shape.md`.
  - Its files: `agent-os/specs/2026-11-27-0922-137-review-round-3/plan.md`, `agent-os/specs/2026-11-27-0922-137-review-round-3/shape.md`.
