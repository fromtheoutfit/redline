# PR #137 review round 2: only agent files compared, another copy refused at the resume, `--plugin` made absolute, the skill's exit 2s, and the marker and drift before the first question

Spec folder: `agent-os/specs/2026-11-27-0922-137-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #137 (issue #135), from the round's six findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

## Dispositions

- **`fix`**, one task each, in finding order:
  - R2-1 (Task 2);
  - R2-2 (Task 3);
  - R2-3 (Task 4);
  - R2-5 (Task 5);
  - R2-6 (Task 6).
- **`decline`**, with no task: R2-4. Its reason is in `shape.md`, "Declined".
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
  - None holds the product name the guard's attribution check matches (round 1, deviation 1: it refused `CLAUDE_CONFIG_DIR` and a bare `~/.claude`). So no subject below names the config directory.
- **Line numbers** are at `704bbaf`, the head of the branch.
  - Each task also names its anchor by text, since earlier tasks move later lines.
  - Each task's anchors are as the tasks before it leave them.

## What this plan does not touch

- `hooks/hooks.json`, `scripts/redline-guard.sh`, `tests/guard-cases.tsv`.
- Anything under `templates/`, `agents/` or `workflows/`.
- `scripts/redline-setup.sh`: R2-4 is declined.
- `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text.
- `README.md`. Its Known limits bullet on a self-review that edits an agent file still holds.
- The version. It stays `0.5.1`: the pull request bumped it once, and a review round adds no bump.

## The plugin's own files

This round edits `scripts/redline-prefs.sh` (Tasks 2, 3 and 4) and `skills/redline/SKILL.md` (Tasks 4, 5 and 6). No workflow or agent file changes.

- The skill text already in this run's conversation keeps its old text.
- The script is read from disk at each call, so this run's next `run drift` runs the new one:
  - Task 2's filter leaves the agent list as it is, since no round of this run changed an agent file;
  - the copy check is skipped, since this run launched from this checkout loaded in place, so `args.pluginRoot` is `--plugin`;
  - Task 3 changes nothing for an absolute `--plugin`.

## Task order matters in five files

- **`scripts/redline-prefs.sh`:**
  - Task 2: beside `realdir` (133); the comparison in `run drift`'s copy block (290-318) and its comment; the #81 list (349-353); the header's `run drift` entry (76-106).
  - Task 3: right after the `--plugin` check (202-204).
  - Task 4: the copy block as Task 2 leaves it moves into a helper after `version_line` (178-201); `run check`'s version refusal (389-390); the header's `run check` (58-75) and `run drift` entries.
- **`tests/prefs-test.sh`:**
  - Task 2: after the check `drift: another copy with no agents/ exits 1` (480), and after `rm "$REPO/agents/redline-new.md"` (545).
  - Task 3: after the check `drift: another repository, a launch that ran the file itself, as launched: by name` (451).
  - Task 4: after the line that saves `wf_26` again (485), before the check `drift: the copy the run launched from, its agents as launched: by name` (486).
- **`docs/scripts.md`**, the `redline-prefs.sh` block (194-311): Tasks 2 and 4.
- **`skills/redline/SKILL.md`:**
  - Task 4: line 51, the `version` clause.
  - Task 5: line 51, before `On exit 0`, and line 251.
  - Task 6: lines 53, 173, 243, 245 and 263.
- **`docs/running.md`:**
  - Task 2: 162 and 166.
  - Task 4: 162 and 225.
  - Task 6: 159 and 168.

## Running the plan

- **Snapshot for the gate:** `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-2/redline/snapshot.json`.
- Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`.

**Red before green.** Each task adds its cases first and sees them fail on a gate run, then makes the change and sees them pass.
- **The red run** is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-2/redline/snapshot.json`, which prints the failing case names. The count recorded is the harness's own summary line, read off the run.
- **A pin whose outcome already holds** before the change cannot be red before the build. It is written with the others, As built says so, and it is seen red under the mutation the task names.
- **Slow gate runs.** If gate runs are slow, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own cases, and the combined run is recorded under As built.

**Existing checks.** No existing check's expectation changes in this round. Any existing check that goes red is a fault in the task.

**shellcheck.** Tasks 2 to 4 change `.sh` files. CI's shellcheck job checks `scripts/*.sh` and `tests/*.sh` on the push. It is not on the implementer's allowlist, so As built records that it was left to CI.

**set -e.** `scripts/redline-prefs.sh` runs under `set -euo pipefail`, and a function run inside `$(...)` runs with `-e` off (bash-conventions, line 8). So:
- each new helper returns 0 on every path;
- a pipeline in it whose first command can fail (a `find` that meets an unreadable directory) has that command guarded (`|| true` inside a brace group);
- every caller reads only what the helper printed.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: save review round 2 spec for PR #137 (#135)`.

## Task 2: R2-1 — compare and list only agent files

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`, `docs/running.md`

**The rule.** An agent file is a `*.md` file under `agents/` whose path has no part that starts with a dot. A copy with no `agents/` has none. Two copies' agent files agree when their lists of paths are equal and each pair is equal byte for byte.

### 1. Red

**The copy comparison.** In `tests/prefs-test.sh`, after the check `drift: another copy with no agents/ exits 1` (480) and before the line that writes `$REC/pinned-gone.json` (481), add this comment and the cases below:

`# Only agent files count (#137, R2-1): a *.md file under agents/ whose path has no part that starts with a dot.`

The marker is `wf_26`, whose `args.pluginRoot` is `$PLUG`. Both `agents/redline-shaper.md` files hold `shaper v1`. Read each case with `$DRIFT`, `runx` and `cline` as above it, with `--plugin "$REC/plugin3"`.

- **(i) Files that are no agent files, in either copy.**
  - `printf 'finder\n' > "$REC/plugin3/agents/.DS_Store"`
  - `printf 'shaper v0\n' > "$REC/plugin3/agents/redline-shaper.md~"`
  - `printf 'notes\n' > "$PLUG/agents/notes.txt"`
  - `runj "drift: files under agents/ that are no agent files, in either copy, are not compared: by name" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$REC/plugin3"`
  - `runx "drift: another copy whose agent files agree beside such files exits 0" 0 drift "$REPO" 7 --plugin "$REC/plugin3"`
  - Seen red: today `refuse` and exit 1, since `diff -rq` reports `Only in`.
- **(ii) A `*.md` file whose path has a part that starts with a dot.**
  - `printf 'apple double\n' > "$REC/plugin3/agents/._redline-shaper.md"`
  - `mkdir -p "$REC/plugin3/agents/.trash"`, then `printf 'shaper v0\n' > "$REC/plugin3/agents/.trash/redline-shaper.md"`
  - `runj "drift: a *.md file under a part that starts with a dot is no agent file: by name" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$REC/plugin3"`
  - Seen red: today `refuse`.
- **(iii) Neighbour: an agent file only in the session's copy.**
  - `printf 'new role\n' > "$REC/plugin3/agents/redline-new.md"`
  - `runj "drift: an agent file only in the session's copy is still refused" "$DRIFT" "false|refuse|||null|$(cline "$PLUG" "$REC/plugin3")" drift "$REPO" 7 --plugin "$REC/plugin3"`
  - Then `rm "$REC/plugin3/agents/redline-new.md"`.
  - Holds before. Seen red under a mutation that compares each of the launch copy's agent files with `cmp` and never the two lists.
- **(iv) Neighbour: an agent file in a subdirectory, only in the session's copy.**
  - `mkdir -p "$REC/plugin3/agents/extra"`, then `printf 'extra role\n' > "$REC/plugin3/agents/extra/redline-extra.md"`
  - `runj "drift: an agent file in a subdirectory of agents/ counts, so one only in the session's copy is refused" "$DRIFT" "false|refuse|||null|$(cline "$PLUG" "$REC/plugin3")" drift "$REPO" 7 --plugin "$REC/plugin3"`
  - Then `rm -r "$REC/plugin3/agents/extra"`.
  - Holds before. Seen red under a mutation that lists only the top of `agents/`.
- **Afterwards:** `rm -rf "$REC/plugin3/agents/.DS_Store" "$REC/plugin3/agents/redline-shaper.md~" "$REC/plugin3/agents/._redline-shaper.md" "$REC/plugin3/agents/.trash" "$PLUG/agents/notes.txt"`. Every case after these then reads the fixtures as before.
- **Neighbours that must not change.** The checks `drift: another copy, its workflow and an agent edited, is refused, naming both copies` (471) and `drift: another copy, its workflow as launched and an agent edited, is refused too` (474) still pass. An agent file whose bytes differ is still refused. Seen red under a mutation that compares the two lists and drops the `cmp`.

**The #81 list.** After the check `drift: an untracked agent file counts` (544) and its `rm "$REPO/agents/redline-new.md"` (545), add:

- `printf 'notes\n' > "$REPO/agents/notes.txt"`
- `printf 'finder\n' > "$REPO/agents/.DS_Store"`
- `runj "drift: an untracked file under agents/ that is no agent file is not listed (#137, R2-1)" '.agents | join(",")' "agents/redline-reviewer.md" drift "$REPO" 7 --plugin "$REPO"`
- Then `rm "$REPO/agents/notes.txt" "$REPO/agents/.DS_Store"`.
- Seen red: today `agents/.DS_Store`, `agents/notes.txt` and `agents/redline-reviewer.md` are listed, in the order `sort -u` gives.
- **Neighbour:** the check at 544, an untracked `agents/redline-new.md`, still counts.

### 2. Green

**Two helpers**, right after `realdir` (133):

- `agent_paths`: reads paths, one a line, on stdin, and prints each that is an agent file. It is pure bash: a `while IFS= read -r` loop, `case "/$p" in */.*) continue ;; esac` to drop a path with a part that starts with a dot, then `case "$p" in *.md) printf '%s\n' "$p" ;; esac`. It always returns 0.
- `agent_list <copy>`: prints nothing when `<copy>/agents` is not a directory. Otherwise it prints the copy's agent files as paths from the copy's root (`agents/...`), sorted under `LC_ALL=C`, from `find agents -type f` run in the copy (`cd "$1"` in a subshell), through `agent_paths`. It always returns 0, `find`'s failure guarded as "Running the plan" says.

A comment above them:

`# The agent files of a copy (#137, R2-1): a *.md file under agents/ whose path has no part that starts with a dot. The roles are the Markdown files under agents/, and a .DS_Store, an editor's backup, an AppleDouble ._ file or a scratch note there is no role. A *.md file in a subdirectory counts, as the comparison it replaces counted it.`

**The copy comparison**, in `run drift` (306-308). Replace the `elif [[ -d "$lroot/agents" || -d "$plugin/agents" ]]` branch and its `diff -rq` with an `else` branch that:
- reads `agent_list "$lroot"` and `agent_list "$plugin"` into two variables;
- sets `differ=true` when they differ;
- otherwise, when the list is not empty, runs `cmp -s "$lroot/$f" "$plugin/$f"` for each path `f` in it, in a `while IFS= read -r` loop fed by a here-string, and sets `differ=true` and stops at the first pair that differs.

In the block's comment (290-295), `the two agents/ must agree; an agents/ on one side only differs, and a launch copy that is gone cannot be compared` becomes `their agent files must agree (agent_list, #137, R2-1): a copy with no agents/ has none, and a launch copy that is gone cannot be compared`.

**The #81 list** (352). Read the two `git` listings through `agent_paths` before `sort -u`: `{ git -C "$root" diff --name-only "$start" -- agents/; git -C "$root" ls-files --others --exclude-standard -- agents/; } | agent_paths | sort -u | jq -R . | jq -sc .`. Its comment (349), `# Agent files: only the plugin's own repository lists them (#81).`, becomes `# Agent files: only the plugin's own repository lists them (#81), and only agent files (agent_paths, #137, R2-1).`

**The header's `run drift` entry** (76-106).
- `launch is refuse when the two copies' agents/ differ (an agents/ on one side only differs, none on either side agrees) or args.pluginRoot is no longer a directory,` becomes:

  `launch is refuse when the two copies' agent files differ (#137, R2-1: an agent file is a *.md file under agents/ whose path has no part that starts with a dot, so a .DS_Store or an editor's backup there is none; the two lists are compared by path, then each pair by its bytes, and a copy with no agents/ has none) or args.pluginRoot is no longer a directory,`
- `lists every file under agents/ that differs from the launch commit` becomes `lists every agent file (by the same rule) that differs from the launch commit`.
- Re-wrap to the header's width, keeping `an agent file is a *.md file` on one line.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block (194-311) takes the same header lines, verbatim.

### 4. `docs/running.md`, "Hand-off and relaunch"

- **The bullet `**Another copy at the same version:**` (162).** `When their agent files differ, or the copy the run launched from is gone,` becomes `When their agent files differ (the \`*.md\` files under each copy's \`agents/\` whose path has no part that starts with a dot, so a \`.DS_Store\` or an editor's backup there is no agent file; #137, R2-1), or the copy the run launched from is gone,`.
- **The bullet `**An agent file changed,**` (166).** `**An agent file changed,** on the plugin's own repository:` becomes `**An agent file changed** (a \`*.md\` file under \`agents/\`, by the same rule), on the plugin's own repository:`.

### Proof

The gate run shows the six new checks passing. Each of these prints `1`:
- `grep -c -F 'an agent file is a *.md file' scripts/redline-prefs.sh`
- `grep -c -F 'an agent file is a *.md file' docs/scripts.md`
- `grep -c -F '#137, R2-1' docs/running.md`

And `grep -c -F 'diff -rq' scripts/redline-prefs.sh` prints `0`.

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block, and `docs/running.md`, "Hand-off and relaunch", both updated in this task.
- No new exit code, subcommand or key.

### Commit

`redline: R2-1 compare and list only agent files, the *.md files under agents/ (#135)`

## Task 3: R2-2 — `--plugin` is made absolute once

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`

### 1. Red

In `tests/prefs-test.sh`, after the check `drift: another repository, a launch that ran the file itself, as launched: by name` (451) and before the comment `# The same release from another install directory` (452), add:

```
# A relative --plugin is read from the caller's directory, its workflow's blob included (#137, R2-2).
pushd "$REC" >/dev/null
runj "drift: a relative --plugin is read from the caller's directory, the blob of its workflow too (#137, R2-2)" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin plugin
runx "drift: a relative --plugin whose workflow is as launched exits 0" 0 drift "$REPO" 7 --plugin plugin
popd >/dev/null
```

**The fixtures there.**
- The marker is `wf_22` (`$REC/fallback-other.json`), a launch by the `scriptPath` fallback whose record names `$PLUG/workflows/redline-loop.js`, so there is no pin.
- `$PLUG` is `$REC/plugin`, and its workflow file holds `launch script`, whose blob is `args.launch.workflow`.

**Seen red:** today `refuse` and exit 1. `git -C "$REPO" hash-object` reads `$REPO/plugin/workflows/redline-loop.js`, which does not exist, so the blob is not the launch's.

### 2. Green

Right after the `--plugin` check (`[[ -n "$plugin" && -d "$plugin" ]] || { ...; exit 2; }`, 203), still inside its `if`, add:

```
    # A path the script receives is made absolute once (bash-conventions), so every read of --plugin
    # (its manifest, its agent files, its workflow file and that file's blob, hashed under git -C
    # <repoRoot>) reads one directory (#137, R2-2). An absolute path is kept as passed, so a line
    # that names the copy names it as the skill passed it.
    case "$plugin" in /*) ;; *) plugin="$PWD/$plugin" ;; esac
```

Not `cd && pwd`: that collapses a doubled slash, and the harness's `$REC` is built from a `TMPDIR` that ends in a slash on macOS, so the copy lines the R1-3 cases pin could move. `-C "$root"` on `hash-object` stays: the PR spec's deviation 2 hashes the blob in the repository's own object format.

### Proof

- The gate run shows the two new checks passing.
- `grep -c -F '#137, R2-2' scripts/redline-prefs.sh` prints `1`.

### Docs

`scripts/redline-prefs.sh`: no reader-facing change. The skill passes `${CLAUDE_PLUGIN_ROOT}`, an absolute path. A relative `--plugin` now reads where the script's other reads of it already did, and the header, which names no form, is unchanged.

### Commit

`redline: R2-2 make the --plugin of run check and run drift absolute once, so drift hashes the file it compares (#135)`

## Task 4: R2-3 — `run check` refuses another copy at the run's version

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`, `skills/redline/SKILL.md`, `docs/running.md`

After Task 2, whose comparison this task moves.

### The line

`run check`'s `copy` line is the line `run drift` already prints for another copy, unchanged. With `<launch copy>` being `args.pluginRoot` as recorded and `<session copy>` being `--plugin`:

`The run on #7 started from the Redline 1.2.3 copy at <launch copy>, and this session loads Redline 1.2.3 from <session copy>, another copy whose agent files differ from that one's or cannot be compared with it: a relaunch would run the rest of the run under another build's agents. Nothing on GitHub is lost; start fresh after committing or removing <folders>`

### 1. Red

In `tests/prefs-test.sh`, after the line that saves `wf_26` again (485) and before the check `drift: the copy the run launched from, its agents as launched: by name` (486), add this comment and the cases below:

`# Another copy is refused at the resume too, before any question, by the helper drift uses (#137, R2-3).`

**The fixtures there:**
- the marker is `wf_26` (`args.pluginRoot` `$PLUG`, kind `handoff`);
- both `agents/redline-shaper.md` files hold `shaper v1`, as Task 2's cleanup leaves them;
- HEAD is the marker's head, on branch `work`.

Let `CHECK` stand for the filter `'[(.ok|tostring), .reason, .line] | join("|")'`.

- **(a) Another copy whose agent file differs.**
  - `printf 'shaper v2\n' > "$REC/plugin3/agents/redline-shaper.md"`
  - `runj "check: another copy at the run's version whose agent files differ is refused before any question, naming both copies (#137, R2-3)" <CHECK> "false|copy|$(cline "$PLUG" "$REC/plugin3")" check "$REPO" 7 --plugin "$REC/plugin3"`
  - `runx "check: another copy whose agent files differ exits 1" 1 check "$REPO" 7 --plugin "$REC/plugin3"`
  - Seen red: today `true||` and exit 0.
- **(b) The copy before the branch.**
  - `"${G[@]}" checkout -q -b other`
  - `runj "check: another copy comes before the branch" '.reason' "copy" check "$REPO" 7 --plugin "$REC/plugin3"`
  - Then `"${G[@]}" checkout -q work` and `"${G[@]}" branch -q -D other`.
  - Seen red: today `branch`.
- **(c) Neighbour: the copy the run launched from.**
  - `runj "check: the copy the run launched from is not refused for its copy" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$PLUG"`
  - Holds before.
- **(d) The version before the copy, at both gates.**
  - Write `$REC/copy-old.json`: `{"runId":"wf_28","scriptPath":"<$CPIN>","args":{"launch":{"version":"1.2.2","workflow":"<$LBLOB>"},"pr":7,"pluginRoot":"<$PLUG>"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["<$FOLDER>"]}}`, built with `printf` as the records above it are.
  - Save it: `run save "$REPO" 7 --run-id wf_28 --record "$REC/copy-old.json" >/dev/null 2>&1`.
  - `runj "check: another version comes before another copy" '.reason' "version" check "$REPO" 7 --plugin "$REC/plugin3"`
  - `runj "drift: another version comes before another copy" '.line | startswith("The run on #7 started under Redline 1.2.2")' "true" drift "$REPO" 7 --plugin "$REC/plugin3"`
  - Both hold before. Each is seen red under a mutation that calls the copy check before the version check in that subcommand.
- **(e) R2-1's rule at the second gate.**
  - `printf 'shaper v1\n' > "$REC/plugin3/agents/redline-shaper.md"`, `printf 'finder\n' > "$REC/plugin3/agents/.DS_Store"`, and save `wf_26` again (`run save "$REPO" 7 --run-id wf_26 --record "$REC/pinned-copy.json" >/dev/null 2>&1`).
  - `runj "check: another copy whose agent files agree beside a .DS_Store is not refused (#137, R2-1)" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$REC/plugin3"`
  - Then `rm "$REC/plugin3/agents/.DS_Store"`.
  - Holds before, since `run check` has no copy check today. Seen red under a mutation that puts `diff -rq` back in the helper (testing/tests, line 13).
- **(f) The launch copy gone.**
  - `run save "$REPO" 7 --run-id wf_27 --record "$REC/pinned-gone.json" >/dev/null 2>&1`
  - `runj "check: a launch copy that is gone is refused, naming it" <CHECK> "false|copy|$(cline "$REC/gone" "$PLUG")" check "$REPO" 7 --plugin "$PLUG"`
  - Seen red: today `true||`.
- **Afterwards:** `run save "$REPO" 7 --run-id wf_26 --record "$REC/pinned-copy.json" >/dev/null 2>&1`, so the check at 486 reads the marker it reads today.
- **Neighbours that must not change.**
  - Every `run check` case above (304-412) still passes. None of their records holds an `args.pluginRoot` that is another directory with other agent files, and the two that hold one (`no-launch.json`, `no-launch-inplace.json`) are refused for their version first.
  - Every drift case of the R1-3 block still passes.

### 2. Green

**The helper.** Move the copy block of `run drift`, as Task 2 leaves it, into `copy_line`, defined right after `version_line` and before the `--plugin` check.
- It prints the line above when `args.pluginRoot` is set, is another directory than `--plugin` by `realdir`, and the launch copy is gone or the two copies' agent files differ. It prints nothing otherwise.
- It always returns 0. It reads `$entry`, `$plugin` and `$pr` as `version_line` does.
- Its comment is the block's comment, reworded for a function that prints the refusal line or nothing, with `shared by check and drift, as version_line is (#137, R2-3)` added.

**`run drift`.** Where the block stood:
```
        cline="$(copy_line)"
        if [[ -n "$cline" ]]; then
            jq -n --argjson self "$self" --arg wf "$wf" --arg line "$cline" \
                '{self: $self, launch: "refuse", scriptPath: "", workflow: $wf, agents: [], drift: null, line: $line}'
            exit 1
        fi
```

**`run check`.** After `[[ -z "$vline" ]] || refuse version "$vline"` (390), add:
```
    cline="$(copy_line)"
    [[ -z "$cline" ]] || refuse copy "$cline"
```

**The header.**
- **The `run check` entry (58-75).** After `else as a build before 0.5.1),` insert:

  ` copy (#137, R2-3: the copy check run drift makes, below, so a resume is refused before any question; the line is the same, and nothing needs fixing by hand),`
- **The `run drift` entry.** `line names both copies. A marker with no args.pluginRoot skips this.` becomes `line names both copies, and run check refuses the same copy as its copy reason (#137, R2-3). A marker with no args.pluginRoot skips this.`
- Re-wrap to the header's width, keeping `so a resume is refused before any question` on one line.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block takes the same header lines, verbatim.

### 4. `skills/redline/SKILL.md`, the Resume bullet (51)

`For \`version\` (#135) the run started under another version of Redline than this session loads, or under a build before 0.5.1, which records none: a relaunch would rerun steps already recorded, and nothing needs fixing by hand.`

becomes:

`For \`version\` (#135) the run started under another version of Redline than this session loads, or under a build before 0.5.1, which records none: a relaunch would rerun steps already recorded. For \`copy\` (#137, R2-3) the session loads another copy of Redline at the run's version than the one the run launched from (a checkout and an installed release, or two checkouts), whose agent files differ from that copy's or which is gone: the rest of the run would mix two builds' agents. For either, nothing needs fixing by hand.`

The next sentence, `Say the line, then ask one \`AskUserQuestion\`, **Start fresh** first and **Stop** second; ...`, is unchanged and now serves both.

### 5. `docs/running.md`

- **"Hand-off and relaunch", the bullet `**Another copy at the same version:**` (162).** After `when they agree, the relaunch goes on as below (#137, R1-3).`, add ` A resume is refused the same way by \`run check\`, before anything is asked, and the skill offers to start fresh, as for another version (#137, R2-3).`
- **"Run markers and resume" (225).** After the parenthetical that ends `or as a build before 0.5.1 when it was launched from a checkout),`, insert ` the session loads another copy of Redline at the run's version than the one the run launched from, whose agent files differ from that copy's or which is gone (#137, R2-3; the line names both copies, and the skill offers to start fresh, as for a version),`.

### Proof

The gate run shows the eight new checks passing. Each of these prints `1`:
- `grep -c -F 'refuse copy' scripts/redline-prefs.sh`
- `grep -c -F 'so a resume is refused before any question' scripts/redline-prefs.sh`
- `grep -c -F 'so a resume is refused before any question' docs/scripts.md`
- `grep -c -F 'differ from that copy' skills/redline/SKILL.md`

And `grep -c -F '#137, R2-3' docs/running.md` prints `2`.

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block; `docs/running.md`, "Run markers and resume" and "Hand-off and relaunch"; all updated in this task.
- `skills/redline/SKILL.md`: `docs/running.md`, "Run markers and resume", the same edit.
- No new exit code: `run check`'s refusal already exits 1. `copy` is a new value of `reason`, given in the header.

### Commit

`redline: R2-3 refuse another copy at the run's version in run check too, before a resume asks anything (#135)`

## Task 5: R2-5 — the skill says what `run check`'s and `run drift`'s exit 2 mean

**Files:** `skills/redline/SKILL.md`

After Task 4, which edits the same bullet.

1. **The Resume bullet (51).** Before `On exit 0, skip sections 3, 4 and 5`, insert:

   `On exit 2, say the script's stderr line and stop, and leave the marker: it could not read what it checks, a \`--plugin\` whose manifest holds no version, the saved file or the repository (#137, R2-5).`
2. **Section 7, after the `agents` paragraph of "The script a relaunch runs" (251).**

   `On exit 2 (no marker, or, on the plugin's own repository, a marker with no start commit), say the script's line and stop: without the marker the launch's script is unknown, so the run is finished with a fresh one.`

   becomes:

   `On exit 2, say the script's line and stop. The line names the cause: no marker, or, on the plugin's own repository, a marker with no start commit, so the launch's script is unknown and the run is finished with a fresh one; or a \`--plugin\` whose manifest holds no version, so the version this session loads is unknown (#137, R2-5).`

### Proof

- `grep -c -F '#137, R2-5' skills/redline/SKILL.md` prints `2`.
- `grep -c -F 'On exit 2 (no marker' skills/redline/SKILL.md` prints `0`.
- No harness reads these sentences. The gate run stays green.

### Docs

`skills/redline/SKILL.md`: no reader-facing change. `docs/running.md` describes a resume's refusals by their reasons, not by exit codes, and the `redline-prefs.sh` block of `docs/scripts.md` already gives both exit 2s.

### Commit

`redline: R2-5 say in the skill what run check's and run drift's exit 2 mean (#135)`

## Task 6: R2-6 — write the marker and run drift before a stop asks anything

**Files:** `skills/redline/SKILL.md`, `docs/running.md`

After Tasks 4 and 5.

### 1. `skills/redline/SKILL.md`

1. **Section 7's opening (173).** After the paragraph that begins `The workflow returns`, add a paragraph:

   `At every stop that waits for the person (a hand-off of either kind, a \`reviewed\` result), write the marker and run \`run drift\` as soon as the stop is reported, before presenting anything ("Write the marker" and "The script a relaunch runs", in the \`decisions\` hand-off below), so a relaunch that cannot run is said before any question and no answer is lost to it (#137, R2-6).`
2. **"Write the marker" (243).**
   - `at every stop that waits for the person (a \`handoff\` of either kind, a \`reviewed\` result, a run stopped before a result): before saving the run record, run` becomes `at every stop that waits for the person (a \`handoff\` of either kind, a \`reviewed\` result, a run stopped before a result), as soon as the stop is reported, before anything is presented or asked, and so before saving the run record (#137, R2-6): run`.
   - `If the script exits 2 (no record, no session id), say its line and stop:` becomes `If the script exits 2 (no record, no session id), say its line and stop, before any question:`.
3. **"The script a relaunch runs" (245).** After the sentence that ends `and read its JSON, on every repository.`, insert:

   ` Where the person is asked anything before the relaunch (a hand-off of either kind, a \`reviewed\` result, and a resume of a \`handoff\` or \`reviewed\` marker), run it twice (#137, R2-6). First before anything is presented: right after the marker is written, or, on such a resume, right after \`run check\` passes, since its marker is already written. Act there on \`refuse\` and on exit 2, as below, so the person answers nothing for a run that cannot relaunch, and say nothing yet for \`name\` or \`scriptPath\`. Then again in the relaunch turn, after the word: the relaunch follows that run's answer, its \`launch\`, \`scriptPath\`, \`agents\` and \`drift\`.`
4. **The deferred hand-off (263).** `ask for the word ("Relaunch only from the word"), write the marker, save the run record, and relaunch with \`args.deferrals\`.` becomes `ask for the word ("Relaunch only from the word"), save the run record, and relaunch with \`args.deferrals\`, the marker having been written, and \`run drift\` run, before the first draft was presented ("Write the marker" and "The script a relaunch runs" above).`
5. **The Resume bullet, `handoff` or `reviewed` (53).** `read \`result\` from the marker's \`record\` file (the harness's own record of the run) and continue as that result's section below says:` becomes `read \`result\` from the marker's \`record\` file (the harness's own record of the run), run \`run drift\` before presenting anything, as section 7's "The script a relaunch runs" says for such a resume, and continue as that result's section below says:`.

### 2. `docs/running.md`, "Hand-off and relaunch"

1. **159.** `**The skill, before every relaunch and every resume,** runs \`redline-prefs.sh run drift --plugin <the session's copy>\` on every repository (a resume runs \`run check\` first, below):` becomes:

   `**The skill, before every relaunch and every resume,** runs \`redline-prefs.sh run drift --plugin <the session's copy>\` on every repository (a resume runs \`run check\` first, below). Where you are asked something first, at a hand-off, a review-dial stop or the end-of-run drafts, or on a resume of one, it also runs it before the first question, right after it writes the marker (on a resume, right after \`run check\`), so a relaunch it refuses is said before you answer anything; the run just before the relaunch is the one the relaunch follows (#137, R2-6):`
2. **168.** After `is not relaunched: the run is finished with a fresh one.`, add ` The skill writes the marker as soon as the stop is reported, so that is said before any question as well (#137, R2-6).`

### Proof

- `grep -c -F '#137, R2-6' skills/redline/SKILL.md` prints `3`.
- `grep -c -F '#137, R2-6' docs/running.md` prints `2`.
- `grep -c -F 'write the marker, save the run record' skills/redline/SKILL.md` prints `0`.
- No harness reads these sentences (`grep` of `tests/` for "Write the marker", "before saving the run record" and "after the marker is written" finds none). The gate run stays green.

### Docs

`skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", updated in this task. "Run markers and resume" already says every stop leaves a marker.

### Commit

`redline: R2-6 write the marker and run drift before a stop asks anything (#135)`

## Task 7: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its README or `docs/` section, or "no reader-facing change" with the reason, for every file it touches under `scripts/` and `skills/`. As built records each entry's commit.
- **11. Version.** `0.5.1` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `REDLINE_VERSION`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it.
  - It is applied after the finding commits, in its own commit: `redline: record the round 2 review lessons in the standards (#135)`.
  - Its files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/workflow/replay.md`, `agent-os/standards/scripts/bash-conventions.md`.
- **13. Spec folder.** `plan.md` gains an As built section in the last commit: `redline: record the as-built state of review round 2 for PR #137 (#135)`.
  - It records:
    - each task's commit;
    - its red and green counts, read off the gate's summary lines;
    - every mutation run;
    - which pins held before the change;
    - that shellcheck was left to CI.
  - Any deviation is recorded under Decisions in `shape.md`.
  - Its files: `agent-os/specs/2026-11-27-0922-137-review-round-2/plan.md`, `agent-os/specs/2026-11-27-0922-137-review-round-2/shape.md`.

## As built

Built by the implementer, one task at a time: each task's cases were added, seen red on a gate run, then the change was made, seen green on a gate run, and committed with only its own cases. Ten gate runs in all: a red and a green run for each of Tasks 2, 3 and 4, three mutation runs, and the final run.

### Commits

| Task | Finding | Commit |
|---|---|---|
| 1 | spec folder | `fe3d0e3` |
| 2 | R2-1 | `5fa5631` |
| 3 | R2-2 | `c49dea2` |
| 4 | R2-3 | `d4c68b6` |
| 5 | R2-5 | `234a836` |
| 6 | R2-6 | `2679035` |
| 7, step 12 | standards retrospective | `52c1d04` |
| 7, step 13 | As built | this commit |

### Red and green, read off the gate's summary lines

The gate prints a harness's output only for a check that fails, so a green run shows prefs exiting 0 and no summary line. Each task's new checks are read passing on the next task's red run instead, as the deviation in `shape.md` records.

- **Task 2, red run:** prefs `221 passed, 4 failed`: case (i)'s two checks, case (ii) and the #81 list's case. Cases (iii) and (iv) held before, as planned.
- **Task 2, green run:** every check exits 0. On Task 3's red run, which holds Task 2's commit, Task 2's six new checks all read `ok`.
- **Task 3, red run:** prefs `225 passed, 2 failed`: the two new checks.
- **Task 3, green run:** every check exits 0. On Task 4's red run, Task 3's two new checks read `ok`.
- **Task 4, red run:** prefs `231 passed, 4 failed`: case (a)'s two checks, case (b) and case (f). Cases (c), (d) (both checks) and (e) held before, as planned.
- **Task 4, green run:** every check exits 0. No later red run holds all eight of its checks, so the count was not read; the total from the red run is 235.
- **Tasks 5 and 6** change only text no harness reads (`grep` of `tests/` for the changed sentences finds none). The final run stays green.
- **Final run, the committed tree (`52c1d04`):** `done: PASS`, every check exits 0, and `git.unexpected_files` and `git.uncommitted` are empty.

### Mutations, each run once on the tree at `d4c68b6`

Each was made with Edit on `scripts/redline-prefs.sh`, and undone by copying back a copy saved before it. `cmp` against that copy and `git diff --quiet` confirmed each restore. They ran after Task 4, so Task 2's mutations were made in `copy_line`, where Task 4 had moved the comparison.

- **Run 1** (prefs `231 passed, 4 failed`):
  - (A) each of the launch copy's agent files compared with `cmp`, the two lists never compared: case (iii) and case (iv) red.
  - (D) in `run check`, the copy check called before the version check: case (d)'s check red (`copy`).
  - (E) in `run drift`, the copy check called before the version check: case (d)'s drift red.
- **Run 2** (prefs `227 passed, 8 failed`):
  - (B) only the top of `agents/` listed (`find agents -maxdepth 1 -type f`): case (iv) red.
  - (C) the two lists compared and the `cmp` dropped: the neighbours at 471 and 474 red, with their exit checks at 472 and 475, and Task 4's cases (a) (both checks) and (b).
- **Run 3** (prefs `231 passed, 4 failed`):
  - (F) `diff -rq` put back in `copy_line`: case (e) red, and Task 2's cases (i) (both checks) and (ii).

### Pins that held before the change

- Task 2: cases (iii) and (iv), seen red under A and B. The neighbours at 471 and 474 were seen red under C.
- Task 4: case (c), which still holds under every mutation above. Case (d)'s two checks, seen red under D and E. Case (e), seen red under F.

### Small additions beside the plan

- `agent_paths` and `agent_list` each carry a one-line comment under the shared comment the plan gives.
- The #81 list's comment wraps onto two lines.
- `run drift` names `copy_line` in a one-line comment where the block stood.
- The harness defines `CHECK` as a shell variable for the filter Task 4 names.

### Existing checks

No existing check's expectation changed, and none went red outside the mutation runs.

### shellcheck

Tasks 2 to 4 change `.sh` files. shellcheck is not on the implementer's allowlist, so it was left to CI's shellcheck job on the push.

### Docs (gate step 10)

- `scripts/redline-prefs.sh`, Task 2: `docs/scripts.md`, the `redline-prefs.sh` header block, and `docs/running.md`, "Hand-off and relaunch", in `5fa5631`.
- `scripts/redline-prefs.sh`, Task 3: no reader-facing change (`c49dea2`). The skill passes an absolute path.
- `scripts/redline-prefs.sh`, Task 4: `docs/scripts.md`, the header block, and `docs/running.md`, "Run markers and resume" and "Hand-off and relaunch", in `d4c68b6`.
- `skills/redline/SKILL.md`, Task 4: `docs/running.md`, "Run markers and resume", in `d4c68b6`.
- `skills/redline/SKILL.md`, Task 5: no reader-facing change (`234a836`). `docs/scripts.md` already gives both exit 2s.
- `skills/redline/SKILL.md`, Task 6: `docs/running.md`, "Hand-off and relaunch", in `2679035`.
- `docs/scripts.md`'s block was diffed against the script's header after Tasks 2 and 4, and matches it.

### Version and standards

- **Version:** `0.5.1`, unchanged.
- **Standards retrospective:** the four approved edits, in `52c1d04`. No finding's fix ran through them, so the commit names none.
