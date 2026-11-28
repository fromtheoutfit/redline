# References for PR #137 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened for this round; line numbers are at `57234d0`.

## Similar Implementations

### `run save`, `run drift` and `run check`

- **Location:** `scripts/redline-prefs.sh`.
  - The header's `run save` entry (40-50), `run check` (56-73) and `run drift` (74-98).
  - `version_line` (170-193) and the `--plugin` requirement (194-196).
  - `run save`'s search for the record (211-219).
  - `run drift` (254-317): the version refusal (261-266), the start commit on the plugin's own repository (267-274), the pin and the live file (281-295), the agents (296-300).
  - `run check`'s `session` line (336).
- **Relevance:**
  - R1-1: `version_line` reads `--plugin`'s manifest.
  - R1-2: the record is searched under `~/.claude` only.
  - R1-3: `run drift` tells builds apart by version and workflow file only.
  - R1-7's drafted issue: the `session` line.
- **Key patterns:** the version refusal's JSON shape and exit 1, which Task 3's refusal copies. `realdir`, which Task 3 uses to compare the two copies. The `nullglob` search, which Task 2 extends.

### `version_installs` and `cmd_version`

- **Location:** `scripts/redline-setup.sh`: `set -euo pipefail` (160), `CLAUDE_BIN` (169), the header's `installs` sentence (124-128), `version_installs` (1491-1529), `cmd_version` (1533-1558).
- **Relevance:** R1-4. The program's failure inside `$(...)` comes back as empty output, and `cmd_version`'s `--argjson` of it exits 2. The early check `jq -e 'type == "array"'` (1506) answers for the last value only, so two lists in one output reach `--argjson` as two arrays.
- **Key patterns:** each part returns 1 on a warning and its caller reads `part`. The function's own early fallback (1506) is what Task 4 makes read the whole stream, and extends to the program itself.

### The workflow's startup refusal

- **Location:** `workflows/redline-loop.js`: `REDLINE_VERSION` (20-24), the comment (40-48), the `args.launch` shape check (49-54), the refusal (55-72), the `args.pluginRoot` check (80-82).
- **Relevance:** R1-8's line. R1-3's note that every real launch records `args.pluginRoot`.

### The skill's stops, relaunch and error handling

- **Location:** `skills/redline/SKILL.md`.
  - Section 2, "A stopped run" (47-56).
  - The precheck's `version` step (90).
  - Section 5's `launch` and `pluginRoot` (118-163).
  - "stopped before a result" (181).
  - "Save the run record" (241) and "Write the marker" (243).
  - "The script a relaunch runs" (245-259).
  - The deferred hand-off (263).
  - `error` (275).
- **Relevance:**
  - R1-2: the Glob and the order of the marker and the copy.
  - R1-3: the `refuse` bullet.
  - R1-6: "relaunch anyway".
  - R1-7: the reopen sentence.
  - R1-8: the error section gives each refused launch its next step.

### The harnesses

- **Location:**
  - `tests/prefs-test.sh`: the fixtures (176-209), the `run` helpers (212-235), the `run save` cases (236-270), the drift cases (395-492), the neighbour at 427.
  - `tests/setup-test.sh`: the stub CLI (30-42), the installs cases and the `installs` helper (997-1073).
  - `tests/loop-test.mjs`: section 17a (2731-2775).
- **Relevance:** where Tasks 2, 3, 4 and 7 add and change cases.
- **Key patterns:**
  - Records under `$REC` with `L` for `args.launch`.
  - `$DRIFT` for drift's printed fields.
  - `env -u CLAUDE_CODE_SESSION_ID` for a case without the session (266), which Task 2 follows for `CLAUDE_CONFIG_DIR`.
  - `installs` and `STUB_LIST` for a list the CLI prints. The stub prints the file as it is, so two lists in one file are two values in one output.
  - `refusedShape` for a startup refusal.

### The docs

- **Location:**
  - `docs/running.md`: "Hand-off and relaunch" (137-173), "Saved launch settings" (210-220), "Run markers and resume" (222-224).
  - `docs/upgrading.md`: "A stopped run across a version change (#135)" (51-69).
  - `docs/scripts.md`: the `redline-prefs.sh` and `redline-setup.sh` header blocks (236-300, 470-492).
  - `README.md`: Known limits (99-132).
- **Relevance:** each task's Docs entry; R1-7's members; R1-1's reading (a), already met at `docs/running.md` 169.

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-26-1135-135-refuse-relaunch-other-version/`.
  - `shape.md`: decisions 1, 3 and 4; "How the refusal offers Start fresh"; the probes, findings 1, 6, 7 and 10; the 63-row table, rows 6, 7, 15 and 16 (m5); Context, "Product alignment".
  - `plan.md`: "As built", deviations 5, 7, 9 and 10.
- **Relevance:** the unattended answers for R1-1, R1-2, R1-3 and R1-8, and the measurements R1-3 and R1-7 rest on.

### CI's gate and its jq

- **Location:** `.github/workflows/gate.yml`: the `ubuntu-latest` and `macos-latest` legs (34-35), the step that puts `/bin` and `/usr/bin` first on macOS (50-52), and "Tool versions" (54-57), which prints `jq --version`.
- **Relevance:** plan adjustment 1. CI's legs run jq 1.7.1, as the plan approver read them, and this machine's PATH gives jq 1.8.2.

### jq's own release notes

- **Location:** `/opt/homebrew/Cellar/jq/1.8.2/NEWS.md` (Homebrew's copy of jq 1.8.2). Its headings are 1.8.2 (1), 1.8.1 (103), 1.8.0 (136), 1.7.1 (378) and 1.7 (426).
  - Line 277, under 1.8.0: "Make `ltrimstr/1` and `rtrimstr/1` error for non-string inputs."
  - Line 403, under 1.7.1: "Fix memory leaks on invalid input for `ltrimstr/1` and `rtrimstr/1`."
  - Line 465, under 1.7: the `-e` exit-code fix ("true-ish last output value exits with zero").
  - No entry for `split` or `--argjson`.
- **Relevance:** R1-4 and plan adjustment 1. The guard refuses `/usr/bin/jq` to the shaper, so jq 1.7.1's behaviour is read here, not run.

### The scratch files

- **Location:** `/tmp/redlinerepro/`.
  - The reviewer's:
    - `installs.jq`: `version_installs`' program, copied verbatim.
    - `list-numeric.json` and `list-disabled.json`.
    - `plugin`: a stub of `claude plugin list --json`.
  - The shaper's:
    - `shaper-r1-lists.json`: the one-entry lists for R1-4's field members.
    - `shaper-r1-installs-b.jq`: the program as Task 4 leaves it, with `tostring` before `split` and before both `rtrimstr`s.
    - `shaper-r1-badpath.json`: case (2)'s list.
    - `shaper-r1-twolists.json`: two lists in one output, case (4)'s member.
    - `shaper-r1-repro.sh`: written and not run, since the guard refuses `bash <file>`.
- **Relevance:** R1-4's reproduction and its members, run in pieces with jq 1.8.2; the whole-stream check, run on its own on each output; R1-5's disabled-install list.

### The machine's install registry

- **Location:** `~/.claude/plugins/installed_plugins.json`, the Redline entries' fields only, and `~/.claude/settings.json`, `enabledPlugins`. Both read-only.
- **Relevance:** R1-5's second look. An install entry holds no `enabled`; enablement is a setting per plugin id.
