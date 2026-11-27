# References for #135: refuse a relaunch under a different plugin version than the run started with

## Similar Implementations

### #81: pin the relaunch script

- **Location:** `agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/` (its `shape.md`, "What the probes did and showed")
- **Relevance:** the pin, the replay key (the prompt sequence, not the script text or the agent body), and the scriptPath denial when only the name is allowed. #135 extends its drift to every repository and settles its two unmeasured lines: one dialog per interactive relaunch, none in bypass-permissions, and an interactive session that reloads.
- **Key patterns:** probe with a throwaway plugin in the scratchpad, nested headless sessions, never a Redline run.

### `run drift` and `run check`

- **Location:**
  - `scripts/redline-prefs.sh`: the `run` block, with drift at line ~215 and check after it;
  - `tests/prefs-test.sh`: `# run drift (#81)` and the check cases.
- **Relevance:** both run before every relaunch and every resume. They are where the skill-side refusal goes.
- **Key patterns:**
  - one JSON object with a `line` the skill says verbatim;
  - exit 1 for a refusal;
  - `refuse <reason> <line>` in check;
  - throwaway git repositories and records shaped as the harness writes them.

### The workflow's #81 startup check

- **Location:** `workflows/redline-loop.js`, the first lines of the `try` (`drift.workflow && !drift.pinned`, line ~6041); `args.drift`'s validation (line ~352).
- **Relevance:** the place, and the result shape (`stage: 'relaunch'`, `resumeFrom: null`), for the version refusal. It runs before any agent.
- **Key patterns:** `result('error', {...})` with no label, which the skill's error section treats as not resumable.

### `redline-setup.sh version`

- **Location:** `cmd_version` and `version_plugin` in `scripts/redline-setup.sh` (line ~1477); its cases in `tests/setup-test.sh`, including "one semver version (#16)" at line ~1002.
- **Relevance:** run at every fresh launch and approved by the guard by real path. It already reports the plugin's own facts (`plugin: {self, inPlace, pluginRoot}`), and its last cases compare the two manifests' versions.
- **Key patterns:** each part prints JSON and returns 1 on a warning; warnings go to stderr, one line each.

### The #839 run records

- **Location:** `~/.claude/projects/-Users-michaelwitwicki-Code-Sites-loser/7ac13c11-582e-4bf7-a550-589f961e50d7/workflows/` (outside the repository).
- **Relevance:** the failure itself:
  - four launches by name with `pluginRoot` 0.4.3;
  - the saved launch records `saved/wf_48810c4f-a9f.launch-{1,2,3}.json` holding 0.4.3's script;
  - the pin now byte-identical to 0.4.5's file.
