# PR #137 review round 1: the run record under another config directory, another copy's agents at one version, the installs warning that stopped a launch, and three lines of advice

Spec folder: `agent-os/specs/2026-11-27-0922-137-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #137 (issue #135), from the round's eight findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

## Dispositions

- `fix`, one task each, in finding order: R1-2 (Task 2), R1-3 (Task 3), R1-4 (Task 4), R1-6 (Task 5), R1-8 (Task 7).
- `defer` with a mitigation: R1-7 (Task 6). Its drafted issue is in `shape.md`, "Deferred".
- `decline`, with no task: R1-1 and R1-5. Their reasons are in `shape.md`, "Declined".
- No `ask`.
- **Plan adjustment 1.** The plan approver bounced Task 4 once, because its second case held only under jq 1.8. Task 4 now expects, after the change, only what jq 1.7 and 1.8 both give (`shape.md`, "Plan adjustment 1").

## Conventions

- **Commits** follow "Git rules for Redline agents" in `README.md`:
  - the `redline:` prefix;
  - one commit per finding;
  - files staged by name;
  - the spec folder in its own first commit, and the As built notes in the last.
- Every finding commit opens `redline: <id>` and ends `(#135)`. No commit subject holds a bare `@word`.
- **Line numbers** are at `57234d0`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. Each task's anchors are as the tasks before it leave them.

## What this plan does not touch

- `hooks/hooks.json`, `scripts/redline-guard.sh`, `tests/guard-cases.tsv`.
- Anything under `templates/` or `agents/`.
- `.claude/commands/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text.
- The version. It stays `0.5.1`: the pull request bumped it once, and a review round adds no bump.
- `scripts/redline-setup.sh` changes only in `version_installs`, `cmd_version` and the header's `installs` sentence, none of which `redline-setup.sh checks` writes, so `checks.sh` is not regenerated.

## The plugin's own files

This round edits `workflows/redline-loop.js` (Task 7) and `skills/redline/SKILL.md` (Tasks 2, 3, 5 and 6).

- A relaunch of this run runs the script it launched with: from the pin by `scriptPath` once the file differs (`docs/running.md`, "Hand-off and relaunch").
- The skill's text already in the conversation is unchanged by an edit.
- Task 3's new check is skipped for this run, since it launched from this checkout loaded in place, so `args.pluginRoot` is `--plugin`.
- Task 2's search is unchanged for it, since this session sets no `CLAUDE_CONFIG_DIR`.

## Task order matters in five files

- `scripts/redline-prefs.sh`:
  - Task 2: the header's `run save` entry (40-50), and `run save`'s search and its error line (211-219).
  - Task 3: the header's `run drift` entry (74-98), and `run drift`, right after the version check (261-266).
- `tests/prefs-test.sh`:
  - Task 2: after the check `run: a bad subcommand exits 2` (269), before the line that saves `wf_1` again (270).
  - Task 3: after the check `drift: the same version from another install directory goes by name` (427).
- `docs/scripts.md`, the verbatim header blocks:
  - Task 2 (238-243);
  - Task 3 (274-300);
  - Task 4 (474-478).
- `skills/redline/SKILL.md`:
  - Task 2: 181, 241 (all but its last sentence), 243, 263, and 275's clause for `resumeFrom` not null.
  - Task 3: 249.
  - Task 5: 241's last sentence.
  - Task 6: 275's sentence for a refused fresh launch.
- `docs/running.md`:
  - Task 2: 224;
  - Task 3: after 161, and 171;
  - Task 6: 169.

## Running the plan

- **Snapshot for the gate:** `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-1/redline/snapshot.json`.
- Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`.

**Red before green.** Each task adds its cases first and sees them fail on a gate run, then makes the change and sees them pass.
- The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-1/redline/snapshot.json`, which prints the failing case names. The count recorded is the harness's own summary line, read off the run.
- A pin whose outcome already holds before the change cannot be red before the build. It is written with the others, As built says so, and it is seen red under a mutation of the clause it turns on.
- If gate runs are slow, the red runs of several tasks may be seen together in one gate run. Each task is still committed with only its own cases, and the combined run is recorded under As built.

**Existing checks.** A check whose expectation pins the behaviour a task removes follows the task in the same commit, and As built names it with the reason: Task 7's three loop checks, named there. Any other check that goes red is a fault in the task.

**shellcheck.** Tasks 2 to 4 change `.sh` files. CI's shellcheck job checks `scripts/*.sh` and `tests/*.sh` on the push. It is not on the implementer's allowlist, so As built records that it was left to CI.

**jq.** This machine's PATH gives jq 1.8.2. CI's two legs run jq 1.7.1 (`.github/workflows/gate.yml`, which puts `/bin` and `/usr/bin` first on macOS and prints `jq --version` in "Tool versions"). A case passes on CI only if it expects what both versions give. Run `jq --version` once before the first red run, and As built names that version for every red run and every mutation it records.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: save review round 1 spec for PR #137 (#135)`.

## Task 2: R1-2 — `run save` finds the record under `CLAUDE_CONFIG_DIR` too, and the skill copies the record it found

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`, `skills/redline/SKILL.md`, `docs/running.md`

### 1. Red

In `tests/prefs-test.sh`, after the check `run: a bad subcommand exits 2` (269) and before the line that saves `wf_1` again (270), add a comment `# The harness's record under the session's config directory (#137, R1-2)` and these cases.

Each case runs `run save` with no `--record`:

`env HOME=<home> CLAUDE_CONFIG_DIR=<cfg> CLAUDE_CODE_SESSION_ID=s1 "$PREFS" run save "$REPO" 7 --run-id <id>`

A case with the variable unset uses `env -u CLAUDE_CONFIG_DIR HOME=<home> ...`. Each record is a copy of `$REC/handoff.json` placed at `<dir>/projects/p/s1/workflows/<id>.json`.

**Setup.**
- Create `$REC/cfg/projects/p/s1/workflows`, `$REC/home/.claude/projects/p/s1/workflows`, `$REC/cfg-empty` and `$REC/home-empty`.
- Copy the record to `$REC/cfg/projects/p/s1/workflows/wf_30.json` and to `$REC/home/.claude/projects/p/s1/workflows/wf_31.json`.

**Cases.**
- **(a) Under `CLAUDE_CONFIG_DIR`.** `HOME` is `$REC/home-empty`, `CLAUDE_CONFIG_DIR` is `$REC/cfg`, run id `wf_30`.
  - The printed `.record` is `$REC/cfg/projects/p/s1/workflows/wf_30.json`.
  - The saved `.runs."7".record` is the same.
  - Seen red: today it exits 2.
- **(b) `CLAUDE_CONFIG_DIR` set, the record under `~/.claude`.** `HOME` is `$REC/home`, `CLAUDE_CONFIG_DIR` is `$REC/cfg-empty`, run id `wf_31`. The printed `.record` is `$REC/home/.claude/projects/p/s1/workflows/wf_31.json`. It holds before the change; seen red under a mutation that searches `CLAUDE_CONFIG_DIR` alone.
- **(c) Neighbour: the variable unset.** `HOME` is `$REC/home`, run id `wf_31`. The printed `.record` is the same as in (b), as today.
- **(d) Neither.** `HOME` is `$REC/home-empty`, `CLAUDE_CONFIG_DIR` is `$REC/cfg-empty`, run id `wf_32`.
  - Exit 2.
  - The stderr line holds both `$REC/cfg-empty/projects/*/s1/workflows/wf_32.json` and `$REC/home-empty/.claude/projects/*/s1/workflows/wf_32.json`.
  - Seen red: today the line names `~/.claude` only.
- **(e) `CLAUDE_CONFIG_DIR` is `~/.claude` itself.** `HOME` is `$REC/home`, `CLAUDE_CONFIG_DIR` is `$REC/home/.claude`, run id `wf_31`.
  - Exit 0, the same `.record`.
  - No stderr line `2 run records match`.
  - It holds before the change; seen red under a mutation that searches both directories and joins their matches.

### 2. Green

In `run save` (211-219), replace the one pattern with a search over the config directories, in order:
- `CLAUDE_CONFIG_DIR` (its trailing `/` dropped), when it is set and not empty;
- then `$HOME/.claude`.

For each directory:
- Glob `<dir>/projects/*/<session>/workflows/<runId>.json` under the existing `nullglob`.
- Stop at the first directory with any match.
- Exactly one match there is the record.
- No match in any directory, or more than one in the first that matches, exits 2 with `redline-prefs: <n> run records match <pattern>[ or <pattern>]; pass --record <file>`. The line names every pattern searched, as expanded.

Keep it bash 3.2 (bash-conventions, line 43): a plain indexed array that is never empty under `set -u`, no `declare -A` or `mapfile`.

The header's `run save` entry (40-50): the text `Write the marker from the harness's own record of the run: ~/.claude/projects/*/<session>/workflows/<runId>.json (or --record)` becomes:

`Write the marker from the harness's own record of the run: <config>/projects/*/<session>/workflows/<runId>.json, <config> being the directory CLAUDE_CONFIG_DIR names when it is set and holds the record, else ~/.claude (#137, R1-2), or --record; the entry's record is the file it read`

Re-wrap to the header's width.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block (238-243) takes the same lines, verbatim.

### 4. `skills/redline/SKILL.md`

- **Line 243, "Write the marker".**
  - `right after saving the record, run` becomes `before saving the run record, run`.
  - After `It reads the run's args and result from the harness record`, insert `, which it finds under the directory \`CLAUDE_CONFIG_DIR\` names when the session sets it and then under \`~/.claude\``.
  - After `writes them under \`runs\` in \`.claude/redline.local.json\``, insert `, and prints the marker, whose \`record\` is the path of that record`.
  - The rest of the paragraph, the exit 2 sentence included, is unchanged.
- **Line 241, "Save the run record", all but its last sentence.**
  - `the harness keeps one record per run id, \`~/.claude/projects/<project>/<session>/workflows/<runId>.json\`,` becomes `the harness keeps one record per run id, \`<config>/projects/<project>/<session>/workflows/<runId>.json\` (\`<config>\` is \`~/.claude\`, or the directory \`CLAUDE_CONFIG_DIR\` names),`.
  - `Find it with Glob (\`~/.claude/projects/*/*/workflows/<runId>.json\`) and copy it beside itself` becomes `Its path is the marker's \`record\`: at a stop, the one \`run save\` printed when it wrote the marker (below), and on a resume, the marker's own. Copy it beside itself`.
  - After the `mkdir -p ... && cp ...` command, insert `, \`<dir>\` being the record's folder`.
  - Leave the last sentence, `If the record cannot be found, say so in one line and relaunch anyway.`, to Task 5.
- **Line 181, "stopped before a result".** `Save the run record (see "Save the run record" below) and write the marker (\`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>\`, kind \`stopped\`)` becomes `Write the marker (\`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>\`, kind \`stopped\`) and save the run record (see "Save the run record" below)`.
- **Line 263, the deferred hand-off.** `save the run record, write the marker, and relaunch with \`args.deferrals\`` becomes `write the marker, save the run record, and relaunch with \`args.deferrals\``.
- **Line 275, `error`.** `save the run record and write the marker (\`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>\`)` becomes `write the marker (\`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>\`) and save the run record`.

### 5. `docs/running.md`

"Run markers and resume" (224): after `The skill writes it with \`redline-prefs.sh run save\` from the harness's own record of the run`, insert `, which the script looks for under the directory \`CLAUDE_CONFIG_DIR\` names when the session sets it, then under \`~/.claude\``.

This states what the script does, not where Claude Code writes the record (process/docs-gate, line 18).

### Proof

The gate run shows the five cases passing. Each of these prints `1`:
- `grep -c -F 'CLAUDE_CONFIG_DIR names when it is set and holds the record' scripts/redline-prefs.sh`
- `grep -c -F 'CLAUDE_CONFIG_DIR names when it is set and holds the record' docs/scripts.md`
- `grep -c -F 'before saving the run record, run' skills/redline/SKILL.md`

And `grep -c -F 'Find it with Glob' skills/redline/SKILL.md` prints `0`.

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block, updated verbatim in this task; `docs/running.md`, "Run markers and resume", updated in this task.
- `skills/redline/SKILL.md`: `docs/running.md`, "Run markers and resume", the same edit. The order of the marker and the copy is the skill's own step, with no other reader-facing change.
- No new exit code: `run save` already exits 2 when no record matches.

### Commit

`redline: R1-2 find the run record under CLAUDE_CONFIG_DIR as well as ~/.claude, and copy the one run save found (#135)`

## Task 3: R1-3 — refuse a relaunch from another copy at the same version whose agent files differ

**Files:** `scripts/redline-prefs.sh`, `tests/prefs-test.sh`, `docs/scripts.md`, `skills/redline/SKILL.md`, `docs/running.md`

### The line

For the first refused case below, the line is exactly (`<launch copy>` is `args.pluginRoot` as recorded, `<session copy>` is `--plugin` as passed):

`The run on #7 started from the Redline 1.2.3 copy at <launch copy>, and this session loads Redline 1.2.3 from <session copy>, another copy whose agent files differ from that one's or cannot be compared with it: a relaunch would run the rest of the run under another build's agents. Nothing on GitHub is lost; start fresh after committing or removing <folders>`

`<folders>` is filled as `version_line` fills it (`${folders:-its spec folders}`).

### 1. Red

In `tests/prefs-test.sh`, after the check `drift: the same version from another install directory goes by name` (427), add a comment `# Another copy at the same version (#137, R1-3): its agents are another build's unless they equal the launch copy's.` and these cases.

**Setup.**
- `mkdir -p "$PLUG/agents"`, then `printf 'shaper v1\n' > "$PLUG/agents/redline-shaper.md"`.
- `cp -R "$PLUG" "$REC/plugin3"`.
- A pin `$REC/redline-loop-wf_26.js` holding `launch script`.
- A record `$REC/pinned-copy.json`: `{"runId":"wf_26","scriptPath":"<that pin>","args":{<L>"pr":7,"pluginRoot":"<$PLUG>"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["<$FOLDER>"]}}`, saved as `run save "$REPO" 7 --run-id wf_26 --record "$REC/pinned-copy.json"`.

Read each case with `$DRIFT` and `runx`, `--plugin` as named.

**Cases.**
- **(i) Another copy, workflow and agents equal.** `--plugin "$REC/plugin3"`: `false|name|||null|`, exit 0. Holds before; seen red under a mutation that refuses whenever the two directories differ.
- **(ii) Another copy, workflow edited, agents equal.**
  - Write `checkout script` to `$REC/plugin3/workflows/redline-loop.js`.
  - Expect `false|scriptPath|<pin>||{"workflow":"workflows/redline-loop.js","pinned":true,"agents":[]}|`, exit 0. Holds before.
- **(iii) Another copy, workflow edited, an agent edited.**
  - Write `shaper v2` to `$REC/plugin3/agents/redline-shaper.md`.
  - Expect `false|refuse|||null|<the line above, with $PLUG and $REC/plugin3>`, exit 1.
  - Seen red: today `scriptPath`.
- **(iv) Another copy, workflow as launched, an agent edited.**
  - Write `launch script` back to `$REC/plugin3/workflows/redline-loop.js`.
  - Expect the same refusal and exit 1.
  - Seen red: today `name`.
- **(v) Another copy with no `agents/`.**
  - `cp -R "$REC/plugin3" "$REC/plugin4"`, `rm -r "$REC/plugin4/agents"`, then write `shaper v1` back to `$REC/plugin3/agents/redline-shaper.md`.
  - `--plugin "$REC/plugin4"`: refused, exit 1.
  - Seen red: today `name`.
- **(vi) The launch copy is gone.**
  - A record `$REC/pinned-gone.json`, as `pinned-copy.json` with `"pluginRoot":"<$REC>/gone"` and run id `wf_27`, saved.
  - `--plugin "$PLUG"`: refused, exit 1. The line names `$REC/gone`.
  - Seen red: today `name`.
- **(vii) Neighbour: the same copy.**
  - Save `wf_26` again.
  - `--plugin "$PLUG"`, whose `agents/` holds `shaper v1`: `false|name|||null|`, as today.
  - Then write `shaper v2` to `$PLUG/agents/redline-shaper.md`: still `name`, since an edit within the copy the run launched from is decision 4's case, not this one.

**Afterwards.**
- `rm -r "$PLUG/agents"`, so every fixture after these cases is as before.
- Save `wf_22` again (`--record "$REC/fallback-other.json"`), the marker the next existing case reads.

**Neighbour that must not change.** The check at 427 (no `args.pluginRoot`, another install directory, live file equal to the pin: `name`) still passes.

### 2. Green

In `run drift`, right after the version check's block (261-266) and before `start=""`:
- Read `args.pluginRoot` from the marker.
- When it is not empty and `realdir` of it is not `realdir` of `--plugin`, the session loads another copy at the run's version. Compare the copies' agents:
  - The launch copy is not a directory: they differ.
  - Else, when either copy has `agents/`: `diff -rq "<launch copy>/agents" "<session copy>/agents" >/dev/null 2>&1` exiting non-zero means they differ. An `agents/` on one side only is a non-zero exit.
  - Neither has `agents/`: they agree.
- When they differ, print `{self, launch: "refuse", scriptPath: "", workflow, agents: [], drift: null, line}` with the line above, and exit 1, as the version refusal does.
- A comment above the block says why: a checkout and a release at one version are two builds, and a relaunch under the session's copy would run the launch's script, or the name, under that copy's agents, which mix with the replayed steps' (the #135 spec's m4-agents-pin-reopen, #137, R1-3).

The header's `run drift` entry (74-98): after the sentence that ends `launch is refuse and line is run check's version line.`, insert:

`Then the copy (#137, R1-3): when args.pluginRoot is another directory than --plugin (a checkout and a release, or two checkouts, at one version), launch is refuse when the two copies' agents/ differ (an agents/ on one side only differs, none on either side agrees) or args.pluginRoot is no longer a directory, since the launch's script would run under another build's agents; line names both copies. A marker with no args.pluginRoot skips this.`

Re-wrap to the header's width.

### 3. `docs/scripts.md`

The `redline-prefs.sh` block (274-300) takes the same lines, verbatim.

### 4. `skills/redline/SKILL.md`

Line 249, the `refuse` bullet: after `names the spec folders to commit or remove (#135);`, insert:

` or the session loads another copy of Redline at that version than the one the run launched from (a checkout and an installed release, or two checkouts), whose agent files differ from the launch copy's or cannot be compared with it, so the rest of the run would mix two builds' agents (#137, R1-3);`

### 5. `docs/running.md`, "Hand-off and relaunch"

- **After the bullet `**Another version:**` (161),** add this bullet:

  `- **Another copy at the same version:** the session loads another copy of Redline than the run launched from, at the same version: a checkout loaded in place and an installed release, or two checkouts. When their agent files differ, or the copy the run launched from is gone, the relaunch is refused the same way, since the launch's script would run the rest of the run under the other copy's agents; when they agree, the relaunch goes on as below (#137, R1-3).`

- **Line 171:** after `which both layers refuse.`, insert ` A checkout and a release at one version are two builds too, so \`run drift\` compares their agent files (the bullet above).`

### Proof

The gate run shows the seven cases passing. Each of these prints `1`:
- `grep -c -F 'another copy whose agent files differ from that one' scripts/redline-prefs.sh`
- `grep -c -F 'Then the copy (#137, R1-3)' docs/scripts.md`
- `grep -c -F 'Another copy at the same version:' docs/running.md`
- `grep -c -F 'so the rest of the run would mix two builds' skills/redline/SKILL.md`

### Docs

- `scripts/redline-prefs.sh`: `docs/scripts.md`, the `redline-prefs.sh` header block; `docs/running.md`, "Hand-off and relaunch"; both updated in this task.
- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", updated in this task.
- No new exit code: `run drift`'s refusal already exits 1.

### Commit

`redline: R1-3 refuse a relaunch from another copy at the same version whose agent files differ (#135)`

## Task 4: R1-4 — the installs warning stays a warning when the CLI's output cannot be read

**Files:** `scripts/redline-setup.sh`, `tests/setup-test.sh`, `docs/scripts.md`

**jq versions.**
- From jq 1.8.0, `rtrimstr` fails on a non-string. jq 1.7.1, CI's, returns it unchanged (jq's `NEWS.md`, 1.8.0: "Make `ltrimstr/1` and `rtrimstr/1` error for non-string inputs").
- `split` refuses a non-string under both.
- `-e` answers for the last output under both (its fix is under 1.7).
- So every case below expects, after the change, only what both versions give. A red seen only under jq 1.8 is marked so.

### 1. Red

In `tests/setup-test.sh`, after the check `installs: no CLI: none listed` (1072) and before `unset STUB_LIST` (1073), add this comment and the cases below:

```
# A CLI output the program cannot read is no stop (#137, R1-4). A version or a path that is not a
# string is read as its text: jq 1.8's rtrimstr fails on a non-string, and jq 1.7's, CI's, returns
# it unchanged, so as text a list reads alike under both. Only one whole list is read.
```

`$PP` is this script's root, as above them.
- Lists (1) to (3) are built with `jq -cn --arg pp "$PP"`, written to the file named, and named by `export STUB_LIST=<that file>`.
- Every `expect_json` of a list's installs uses the filter `'[.installs[] | "\(.scope):\(.version):\(.running)"] | join(",")'`.

- **(1) A version that is a number.**
  - The list `[{"id": "redline@m", "scope": "user", "version": 5, "enabled": true, "installPath": "<$PP>"}]`, in `$WORK/i-numver.json`.
  - `expect_exit "installs: a version that is a number is read as text: exit 0" 0 version "$VR"`.
  - `expect_json "installs: and is listed" <the filter> "user:5:true" version "$VR"`.
  - Seen red: today exit 2 and no JSON, under jq 1.7 and 1.8 alike.
- **(2) A `projectPath` that is a number.**
  - The list `[{"id": "redline@m", "scope": "user", "version": "0.5.1", "enabled": true, "installPath": "<$PP>"}, {"id": "redline@m", "scope": "project", "version": "0.4.3", "enabled": true, "installPath": "/c/redline/0.4.3", "projectPath": 7}]`, in `$WORK/i-numproject.json`.
  - `expect_exit "installs: a projectPath that is not a string is read as its text: exit 0" 0 version "$VR"`.
  - `expect_json "installs: so that project install is not seen, and the user install is listed" <the filter> "user:0.5.1:true" version "$VR"`.
  - Seen red under jq 1.8 only: today exit 2 (`endswith() requires string inputs`). Under jq 1.7 it holds before the change, with the same output.
- **(3) An `installPath` that is a number.**
  - The list `[{"id": "redline@m", "scope": "user", "version": "0.5.1", "enabled": true, "installPath": "<$PP>"}, {"id": "redline@m", "scope": "user", "version": "0.5.1", "enabled": true, "installPath": 7}]`, in `$WORK/i-numinstall.json`.
  - `expect_exit "installs: an installPath that is not a string is read as its text: exit 0" 0 version "$VR"`.
  - `expect_json "installs: so that install is listed, and is not this session's" <the filter> "user:0.5.1:true,user:0.5.1:false" version "$VR"`.
  - Seen red as (2): under jq 1.8 today exit 2; under jq 1.7 it holds before.
- **(4) Two lists in one output.**
  - `installs "$WORK/i-one.json" user:0.5.1:self`, then `cat "$WORK/i-one.json" "$WORK/i-one.json" > "$WORK/i-twolists.json"`, and `export STUB_LIST="$WORK/i-twolists.json"`.
  - `expect_exit "installs: an output of two lists is no list: exit 0" 0 version "$VR"`.
  - `expect_json "installs: two lists: none listed" '.installs | length' "0" version "$VR"`.
  - Seen red: today exit 2. The early check passes, the program prints one object per list, and `--argjson` refuses two JSON texts. Measured in pieces under jq 1.8.2 in shaping. By jq's NEWS it is the same under 1.7.
- **Neighbours that must not change.** Every `installs:` case above them still passes, the line texts included. The `not json` output, the failing CLI and the missing CLI are no list under the new check as under the old.

### 2. Green

In `version_installs` (1503-1529):
- **The early check (1506).** `jq -e 'type == "array"' >/dev/null 2>&1 <<<"$list" || { echo '[]'; return 0; }` becomes `jq -se 'length == 1 and (.[0] | type == "array")' >/dev/null 2>&1 <<<"$list" || { echo '[]'; return 0; }`. The output must be exactly one JSON value, and that value a list. No output, `not json` and two values all fall back.
- **`num`.** `def num: .version // "" | split(".") | map(tonumber? // 0);` becomes `def num: .version // "" | tostring | split(".") | map(tonumber? // 0);`.
- **`mine`.** `(.installPath // "" | rtrimstr("/"))` becomes `(.installPath // "" | tostring | rtrimstr("/"))`.
- **The visible filter.** `(.projectPath // "" | rtrimstr("/")) == $rootp` becomes `(.projectPath // "" | tostring | rtrimstr("/")) == $rootp`.
- **The program.** `res="$(jq -c ... <<<"$list")"` gains `|| { echo '[]'; return 0; }`. Once every field a string builtin reads is text, no known input makes it fail under jq 1.7 or 1.8. The fallback is the guard for any other failure, and no case reaches it; step 3 shows it under a mutation.
- **The comment above it (1491-1502).** Its last sentence, `Prints [] and returns 0 when the session runs no install (a checkout loaded in place: --plugin-dir hides every install), or when the CLI is missing, fails or prints no list.`, becomes:

  `Prints [] and returns 0 when the session runs no install (a checkout loaded in place: --plugin-dir hides every install), or when the CLI is missing, fails or prints anything but one JSON list, or when this program fails on the list (#137, R1-4). A version, installPath or projectPath that is not a string is read as its text: jq 1.8's rtrimstr fails on a non-string where jq 1.7's returns it unchanged, and as text the list reads alike under both.`

In `cmd_version`, after `ins="$(version_installs "$root")" || part=$?` (1554), add `jq -se 'length == 1 and (.[0] | type == "array")' >/dev/null 2>&1 <<<"$ins" || ins='[]'`. What the function printed is checked before `--argjson` reads it (bash-conventions, line 8). The check reads the whole text, since `--argjson` takes exactly one JSON value. `jq -e 'type == "array"'` alone passed two arrays (measured in shaping, jq 1.8.2).

The header (124-128): `[] when no seen install is this script's root (a checkout loaded in place) or the CLI is missing, fails or prints no list.` becomes:

`[] when no seen install is this script's root (a checkout loaded in place), or the CLI is missing, fails, or prints anything but one list, or one this script cannot read (#137, R1-4); a version or a path that is not a string is read as its text, so a list reads alike under jq 1.7 and 1.8.`

Re-wrap to the header's width, keeping `reads alike under jq 1.7 and 1.8` on one line.

### 3. Mutations

Run each mutation once. As built records each one with the jq version it ran under.
- **`num`.** Drop `tostring` from `num` and keep the fallback: case (1) is red on its `expect_json`. This holds under jq 1.7 and 1.8 alike.
- **The two guards, under jq 1.8 only.** Drop the `tostring` from the visible filter, then:
  - keep the fallback and the caller's check: case (2) exits 0 and is red on its `expect_json` (none listed);
  - also drop the fallback, keeping the caller's check: the same;
  - also drop the caller's check: case (2) exits 2.

  This is the one jq that can reach the guards. Under jq 1.7, once the version is read as text, nothing in the program fails.
- **The whole-stream checks.** Put the early check back to `jq -e 'type == "array"'` and keep the caller's whole-stream check: case (4) still passes. Put the caller's check back to `jq -e 'type == "array"'` as well: case (4) exits 2.

### 4. `docs/scripts.md`

The `redline-setup.sh` block (474-478) takes the same lines, verbatim.

### Proof

The gate run shows the eight checks passing. These print `1`:
- `grep -c -F 'reads alike under jq 1.7 and 1.8' scripts/redline-setup.sh`
- `grep -c -F 'reads alike under jq 1.7 and 1.8' docs/scripts.md`

And `grep -c -F 'length == 1 and' scripts/redline-setup.sh` prints `2`.

### Docs

- `scripts/redline-setup.sh`: `docs/scripts.md`, the `redline-setup.sh` header block, updated in this task.
- `docs/running.md` "Precheck" and `docs/upgrading.md` "A stopped run across a version change (#135)" already say the warning never stops a launch: no reader-facing change there.
- No new exit code.

### Commit

`redline: R1-4 keep the installs warning a warning when the CLI's list cannot be read (#135)`

## Task 5: R1-6 — relaunch without the record's copy only on a resume

**Files:** `skills/redline/SKILL.md`

After Task 2, which makes the copy take its path from the marker. In "Save the run record" (241), the last sentence:

`If the record cannot be found, say so in one line and relaunch anyway.`

becomes:

`On a resume, if the file at the marker's \`record\` is gone, say so in one line and relaunch anyway: the copy is only a backup, and the marker holds what \`run drift\` reads. At a stop the path is the one \`run save\` printed, and a \`run save\` that finds no record stops the run (below), so nothing relaunches without one.`

### Proof

- `grep -c -F 'If the record cannot be found' skills/redline/SKILL.md` prints `0`.
- `grep -c -F 'so nothing relaunches without one' skills/redline/SKILL.md` prints `1`.
- No harness reads this sentence. The gate run stays green.

### Docs

`skills/redline/SKILL.md`: no reader-facing change. `docs/running.md`, "Hand-off and relaunch", already says "a stop whose marker could not be written (`run save` exits 2) is not relaunched".

### Commit

`redline: R1-6 relaunch without the record's copy only on a resume (#135)`

## Task 6: R1-7 (deferred; the mitigation) — name `--plugin-dir` in the reopen for a fresh launch refused for its version

**Files:** `skills/redline/SKILL.md`, `docs/running.md`, `docs/upgrading.md`

The rest of the class, every other reopen line, is the drafted issue in `shape.md`, "Deferred". This task changes only the advice this pull request added.

1. **`skills/redline/SKILL.md`, `error` (275).**

   `Say so, and that reopening the session (\`claude --resume <session id>\`) and typing the command again launches under the checkout's current files.`

   becomes:

   `Say so, and that reopening the session with the checkout still loaded in place (\`claude --plugin-dir <root> --resume <session id>\`, \`<root>\` being \`${CLAUDE_PLUGIN_ROOT}\`) and typing the command again launches under the checkout's current files; a reopen without \`--plugin-dir\` runs the installed release instead.`
2. **`docs/running.md`, "Hand-off and relaunch" (169).**

   `reopen the session and type the command again.`

   becomes:

   `reopen the session with the checkout loaded in place (\`claude --plugin-dir <checkout> --resume <session id>\`; a reopen without the flag runs the installed release) and type the command again.`
3. **`docs/upgrading.md`, "A stopped run across a version change (#135)" (69).**

   `is refused until the session is reopened.`

   becomes:

   `is refused until the session is reopened with the checkout loaded in place (\`claude --plugin-dir <checkout> --resume <session id>\`), since a reopen without the flag runs the installed release.`

### Proof

Each of these prints `1`:
- `grep -c -F 'claude --plugin-dir <root> --resume <session id>' skills/redline/SKILL.md`
- `grep -c -F 'claude --plugin-dir <checkout> --resume <session id>' docs/running.md`
- `grep -c -F 'claude --plugin-dir <checkout> --resume <session id>' docs/upgrading.md`

No harness reads these sentences. The gate run stays green.

### Docs

- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", and `docs/upgrading.md`, "A stopped run across a version change (#135)", both updated in this task.

### Commit

`redline: R1-7 name --plugin-dir in the reopen for a fresh launch refused for its version (#135)`

## Task 7: R1-8 — the startup refusal states both versions and leaves the next step to the skill

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

### The new line

For a recorded version (the `other` run of loop-test 17a), exactly:

`The Redline ${RUNNING_VERSION} workflow is running, and this run's args record Redline 0.4.3: a run runs only under the version its launch recorded, since a relaunch under another would rerun steps already recorded, so it stops here, before any agent. Nothing on GitHub is lost.`

For none (the `old` run), exactly:

`The Redline ${RUNNING_VERSION} workflow is running, and this run's args record no version, as a Redline build before 0.5.1 launched it: a run runs only under the version its launch recorded, since a relaunch under another would rerun steps already recorded, so it stops here, before any agent. Nothing on GitHub is lost.`

### 1. Red

In `tests/loop-test.mjs`, section 17a:
- **The check `launch: the refusal names both versions, says nothing on GitHub is lost and how to start fresh` (2747).** Its expected text becomes the first line above. Its name becomes `launch: the refusal names both versions and says nothing on GitHub is lost`.
- **The check `launch: its line says the run started under a build before 0.5.1` (2753).** Its expected text becomes the second line above. Its name becomes `launch: its line says a build before 0.5.1 launched the run`.
- **The check `launch: a fresh launch whose skill is another version is refused too, before any agent` (2763).** `fresh.res.error.startsWith('This run started under Redline 9.0.0, and the workflow running now is Redline ')` becomes `fresh.res.error.startsWith('The Redline ' + RUNNING_VERSION + ' workflow is running, and this run\'s args record Redline 9.0.0: ')`.
- **After that check, add:**

  `check('launch: the refusal names no command, so a refused fresh launch is not told to type one in the session that refuses it again (#137, R1-8)', [other, old, fresh].every((r) => r.res && !r.res.error.includes('/redline:redline')), [other, old, fresh].map((r) => r.res && r.res.error))`

Seen red: all four, since today's line differs and holds `/redline:redline 114`. The three existing checks follow the task, since they pin the line it changes.

### 2. Green

In `workflows/redline-loop.js` (61), the `error:` template becomes:

`` `The Redline ${REDLINE_VERSION} workflow is running, and this run's args record ${launchedUnder ? `Redline ${launchedUnder}` : 'no version, as a Redline build before 0.5.1 launched it'}: a run runs only under the version its launch recorded, since a relaunch under another would rerun steps already recorded, so it stops here, before any agent. Nothing on GitHub is lost.` ``

The comment above the check (40-48) gains a last sentence: `The line names no next step: a fresh launch and a relaunch reach it alike, and the skill's error section, which knows which it made, gives each its own (#137, R1-8).`

### Proof

- The gate run shows section 17a passing.
- `grep -c -F 'Start fresh: /redline:redline' workflows/redline-loop.js` prints `0`.

The sweep of the #135 spec is not rerun: no prompt changes, since the line is the error of a result returned before any agent (workflow/replay, line 24).

### Docs

`workflows/redline-loop.js`: no reader-facing change. `docs/running.md`, "Hand-off and relaunch", describes the line by its facts ("with the same facts in its own line"): both versions, and nothing on GitHub lost. Those stay. The skill's error section gives the next step, as it already does.

### Commit

`redline: R1-8 leave the next step out of the workflow's version refusal (#135)`

## Task 8: Verification Gate

Gate steps 1 to 9: run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-27-0922-137-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.

Steps 10, 11, 12 and 13 stay as written:

- **10. Docs.** Each task above names its README or `docs/` section, or "no reader-facing change" with the reason, for every file it touches under `scripts/`, `skills/` and `workflows/`. As built records each entry's commit.
- **11. Version.** `0.5.1` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `REDLINE_VERSION`, unchanged: the pull request bumped it, and no template body changes this round.
- **12. Standards retrospective.** The list under "Standards retrospective (proposed)" in `shape.md`, as the standards approver approves it.
  - It is applied after the finding commits, in its own commit: `redline: record the round 1 review lessons in the standards (#135)`.
  - Its files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/scripts/bash-conventions.md`.
- **13. Spec folder.** `plan.md` gains an As built section in the last commit: `redline: record the as-built state of review round 1 for PR #137 (#135)`. It records:
  - each task's commit;
  - its red and green counts, read off the gate's summary lines;
  - every mutation run;
  - the jq version (`jq --version`) of every red run and every mutation, and, for Task 4, which of its reds held under jq 1.8 only;
  - every existing check that followed a task, and why;
  - that shellcheck was left to CI.

  Any deviation is recorded under Decisions in `shape.md`. Its files: `agent-os/specs/2026-11-27-0922-137-review-round-1/plan.md`, `agent-os/specs/2026-11-27-0922-137-review-round-1/shape.md`.

---

## As built

Built by the implementer. Every gate run and every mutation below ran under jq 1.8.2 (`jq --version` before the first red run), the jq on this machine's PATH. jq 1.7.1, CI's, was not run here.

### Commits

| Task | Finding | Commit |
|---|---|---|
| 1 | spec folder | `a5be716` |
| 2 | R1-2 | `2bf2678` |
| 3 | R1-3 | `fc3d7aa` |
| 4 | R1-4 | `9d64705` |
| 5 | R1-6 | `247ba99` |
| 6 | R1-7 (the mitigation) | `23a4460` |
| 7 | R1-8 | `30524ea` |
| 8, step 12 | standards retrospective | `752840e` |
| 8, step 13 | As built | this commit |

### Red and green, read off the gate's summary lines

The gate runs were slow enough to share, as "Running the plan" allows: the red runs of Tasks 2, 4 and 7 were seen in one run, and Task 3's red run and green run each carried one of Task 4's mutations, which only the setup harness reads. Each task was still committed with only its own cases.

- **Red run 1 (Tasks 2, 4 and 7):**
  - loop `2064 checks passed, 4 failed`: Task 7's three re-pinned checks and its new one.
  - prefs `202 passed, 3 failed`: case (a)'s two checks and case (d)'s line. Case (d)'s exit 2 held already, as planned. Cases (b), (c) and (e) held before.
  - setup `547 passed, 8 failed`: all four cases, two checks each. Under jq 1.8 only: cases (2) and (3), four checks, which by jq's NEWS hold before the change under jq 1.7. Under both versions: case (1), since `split` refuses a non-string under both, and case (4), measured here and by NEWS the same under 1.7.
- **Green run 1 (Tasks 2, 4 and 7):** loop `2068 checks passed, 0 failed`, prefs `205 passed, 0 failed`, setup `555 passed, 0 failed`.
- **Red run 2 (Task 3):** prefs `211 passed, 8 failed`: cases (iii), (iv), (v) and (vi), two checks each. Cases (i), (ii) and (vii), and the existing check at 427, held before.
- **Green run 2 (Task 3):** prefs `219 passed, 0 failed`.
- **Tasks 5 and 6** change only text no harness reads. The final run below stays green.
- **Final run, the committed tree:** every check exits 0. loop `2068 checks passed, 0 failed`, prefs `219 passed, 0 failed`, setup `555 passed, 0 failed`; `git.unexpected_files` and `git.uncommitted` empty.

### Mutations, each run once, all under jq 1.8.2

Each mutation was undone afterwards, and the script was compared byte for byte with a copy saved before it (`cmp`).

- **Run A** (prefs `203 passed, 2 failed`, setup `554 passed, 1 failed`):
  - Task 2, searching `CLAUDE_CONFIG_DIR` alone: case (b) red, and case (d)'s line, which then names one pattern.
  - Task 4, `num` without `tostring`, the fallback kept: case (1) red on its `expect_json`, its exit 0 held.
  - Task 4, the early check put back to `jq -e 'type == "array"'`, the caller's whole-stream check kept: case (4) still passed.
- **Run B** (prefs `203 passed, 2 failed`, setup `552 passed, 3 failed`):
  - Task 2, both directories searched and their matches joined: case (e) red on both checks (`2 run records match`).
  - Task 4, the visible filter without `tostring`, the fallback and the caller's check kept: case (2) exit 0 and red on its `expect_json`.
  - Task 4, the early check and the caller's check both put back to `jq -e 'type == "array"'`: case (4) exits 2, both its checks red.
- **With red run 2** (setup `554 passed, 1 failed`): Task 4, the visible filter without `tostring` and the fallback dropped, the caller's check kept. Case (2) exit 0 and red on its `expect_json`.
- **With green run 2** (setup `553 passed, 2 failed`): Task 4, as above, the caller's check dropped too. Case (2) exits 2.
- **Run D** (prefs `215 passed, 4 failed`): Task 3, refusing whenever the two directories differ. Cases (i) and (ii) red, two checks each.

### Existing checks that followed a task

Task 7's three loop checks in section 17a, `launch: the refusal names both versions ...` (2747), `launch: its line says ...` (2753) and `launch: a fresh launch whose skill is another version is refused too, before any agent` (2763). Each pins the line Task 7 changes, so its expected text and name follow the new line in the same commit. No other existing check went red.

### shellcheck

Tasks 2 to 4 change `.sh` files. shellcheck is not on the implementer's allowlist, so it was left to CI's shellcheck job on the push.

### Docs (gate step 10)

- `scripts/redline-prefs.sh`, Task 2: `docs/scripts.md`, the header block, and `docs/running.md`, "Run markers and resume", in `2bf2678`.
- `skills/redline/SKILL.md`, Task 2: `docs/running.md`, "Run markers and resume", in `2bf2678`.
- `scripts/redline-prefs.sh`, Task 3: `docs/scripts.md`, the header block, and `docs/running.md`, "Hand-off and relaunch", in `fc3d7aa`.
- `skills/redline/SKILL.md`, Task 3: `docs/running.md`, "Hand-off and relaunch", in `fc3d7aa`.
- `scripts/redline-setup.sh`, Task 4: `docs/scripts.md`, the `redline-setup.sh` header block, in `9d64705`.
- `skills/redline/SKILL.md`, Task 5: no reader-facing change, as the task says, in `247ba99`.
- `skills/redline/SKILL.md`, Task 6: `docs/running.md`, "Hand-off and relaunch", and `docs/upgrading.md`, "A stopped run across a version change (#135)", in `23a4460`.
- `workflows/redline-loop.js`, Task 7: no reader-facing change, as the task says, in `30524ea`.

### Version (gate step 11)

`0.5.1`, unchanged in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `REDLINE_VERSION`.

### Deviations

Each is also recorded under "Deviations as built" in `shape.md`, Decisions.

1. **Task 2's commit subject.** The planned subject names `CLAUDE_CONFIG_DIR` and `~/.claude`. The guard refuses both in a commit message, since its attribution check matches the name and strips only `.claude/` and `CLAUDE.md`. So the subject says "the session's config directory" and `~/.claude/`: `redline: R1-2 find the run record under the session's config directory as well as ~/.claude/, and copy the one run save found (#135)`.
2. **Task 2, `skills/redline/SKILL.md`, "Save the run record".** The plan's `<config>` text stated as fact that the harness keeps the record under `CLAUDE_CONFIG_DIR`, which was not measured. The plan approver noted this, and process/docs-gate line 18 asks for "expected" wording. So the text reads `` (`<config>` is `~/.claude`, or, as expected but not measured, the directory `CLAUDE_CONFIG_DIR` names when the session sets it) ``.
3. **Task 2, `docs/running.md`, "Run markers and resume".** The clause on where the script looks is placed after the parenthetical that lists what the marker holds, not straight after "from the harness's own record of the run". In the planned place the list would have read as the contents of `~/.claude`.
4. **Task 6.** Each of the three sentences ends `(#137, R1-7)`, since a deferral's mitigation names its finding.
