# Issue #81: a relaunch runs the launch's workflow, and a run never finishes from a re-run round

## Context

When Redline reviews its own repository from the checkout (`--plugin-dir`), a round that commits a change to `workflows/redline-loop.js` changes the script the next relaunch loads. Replay matches prompts byte for byte, so every step after the first changed prompt reruns. On PR #80 that reran rounds 1 to 3, left rerun-only findings without threads, and on the third relaunch a re-run round 1 ended the run with a false handoff while round 3 was open.

The fix, as decided during shaping:

1. **Pin the workflow.** A relaunch runs the script the first launch ran. By name while the live file is unchanged (today's call, so nothing changes on any other repository); by `scriptPath` to the harness's persisted copy once it differs.
2. **Agent files cannot be pinned** without losing their guard role, so a changed agent file gives a warning that names the files, and the same sentence goes in the handoff comment. The run goes on.
3. **Finish rule.** Finish opens with a read of the highest posted round; a run finishing from a lower round stops before anything is posted.
4. **No addendum review.** After the pin no path reruns a posted review; `shape.md` lists the paths checked.

I make no commits; the user commits. Version goes to 0.2.4.

## What the probes measured (goes into shape.md)

All measured headless, under `--plugin-dir`, on Claude Code 2.1.322, with a throwaway plugin in the scratchpad. An interactive session or an installed plugin may differ.

- **a.** `Workflow({scriptPath: <copy>, resumeFromRunId})` replays a run launched by name: all agents cached. Replay follows the prompt sequence; script path, script text, an agent's `label` and the agent file's body do not enter the key (`model`, `agentType`, `schema` not tested). A changed prompt reruns that agent and every later one. `scriptPath` must be under the working directory or a path the tool returned. The persisted copy (`<session>/workflows/scripts/<name>-<runId>.js`) is byte-identical to the launched file (checked against commit `dbbdc79`), survives a session reopen, and is overwritten by a by-name relaunch only.
- **b.** Agent files and the named workflow are read once, at process start: edits mid-session changed neither the next agent call nor the next launch. A reopened session (`claude --resume`) re-reads both; the earlier run's cache still replays.
- **c.** `agentType` resolves only from the registry (a file path throws `not found`). The hook sees a typed agent as `<plugin>:<role>` and an untyped one as `workflow-subagent`, so a pinned agent copy would run outside the guard.
- **d.** With only `Workflow(<plugin>:<name>)` allowed, a relaunch by `scriptPath` is denied headless (`Review dynamic workflow before running`).

**Unmeasured, recorded as such:**
- Whether an interactive session reloads an agent file or the named workflow mid-session (PR #80's records show three script texts under one session id; the transcript does not say whether the session was reopened). The design does not depend on the answer: the workflow is pinned by content comparison, and agent changes are reported from git whatever the session loaded.
- Whether an interactive session shows exactly one permission prompt for a `scriptPath` relaunch, and none in bypass-permissions. This PR's own self-review is the first real test of the bypass case.

## Design

### `scripts/redline-prefs.sh`: new `run drift` subcommand

`redline-prefs.sh run drift <repoRoot> <pr> --plugin <dir>` reads the run marker and prints one JSON object:

```json
{"self": true, "launch": "name|scriptPath|refuse", "scriptPath": "", "workflow": "workflows/redline-loop.js", "agents": ["agents/redline-reviewer.md"], "drift": {"workflow": "", "pinned": true, "agents": []}, "line": ""}
```

- `self`: `realdir(--plugin) == realdir(repoRoot)` (reuse `realdir`, as `run check`'s `plugin` reason does). Not self: `launch: "name"`, empty lists, `drift: null`. Exit 0.
- Pinned copy: `.scriptPath` of the marker's `record` file, when it is a file and is not the plugin's live `workflows/redline-loop.js` (the fallback launch ran the live file, so it has no pin).
- Workflow changed: `cmp -s <pinned> <live>` when a pin exists; without one, `git diff --quiet <args.startSha> -- workflows/redline-loop.js` (working tree, so an uncommitted edit counts).
- Agents changed: `git diff --name-only <args.startSha> -- agents/`.
- `launch`: `name` when the workflow is unchanged; `scriptPath` (with the pin's path) when changed and pinned; `refuse` when changed with no pin, exit 1, `line`: `workflows/redline-loop.js changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline <pr>`.
- When `agents` is not empty, `line` carries the agent sentence (below). `drift` is what the skill passes as `args.drift`; `null` when nothing changed.
- Header comment documents the subcommand; `run_usage` and the `case` gain `drift`. No marker: exit 2 with a line.

**The agent sentence**, one wording in the script, the workflow and both tests:
`Agent files changed since this run launched (<files, comma separated, each in backticks>): this run's remaining rounds may run under them, while the workflow's own prompts are the launch's.`

**Guard:** `scripts/redline-guard.sh` already approves every `redline-prefs.sh` call for the main session and refuses it to roles (line 1082), so the guard and `hooks/hooks.json` do not change. `tests/guard-cases.tsv` gains two rows beside the existing prefs rows: main session `run drift` allowed, a role denied.

### `workflows/redline-loop.js`

- **`args.drift`** (absent on every launch and on every relaunch where nothing changed): validated at startup as `{workflow: string, pinned: boolean, agents: string[]}`; malformed fails as other args do.
- **Second layer for the refusal:** `drift.workflow` set and `pinned` false returns `result('error', {stage: 'relaunch', error: <the refuse line>, resumeFrom: null})` before any agent call.
- **Agent sentence:** when `drift.agents` is not empty, pushed to `warnings` and added to `handoffComment()` as its own paragraph. Read nowhere before Finish, so every earlier prompt is byte-identical with or without it.
- **Finish rule:** `finish()` opens with one new call, label `last round`, `redline:redline-github`, running `${GH} last-round ${pr}` (already in the guard's `GH_READ`), with a small schema `{round, error}`. It runs for every `kind` when the run holds a Redline round record, before `PR description`, the sweep, the closing comment and `commitRecord()`. If the posted round is above the round the run is finishing from: `stageError('finish', ...)` with no label, so `resumeFrom` is null. Message: `the run was finishing from round <N>, but the highest Redline round posted on PR #<pr> is <M>, so round <N> is a re-run of an earlier round; nothing was posted after this check. Start a fresh run: /redline:redline <pr>`. Equal or lower (a dry run posts nothing) goes on. An agent `error` stops at stage `finish`.
- Round prompts, `coverage off` ones included, are untouched. The only new call sits after every stopping point.

### `skills/redline/SKILL.md`

- **Section 6:** record the script path the launch result returns beside the `runId`.
- **Section 7, new paragraph "The script a relaunch runs"** (referenced from Resume in section 2, "stopped before a result", and the two hand-off relaunches): after the marker is written and before `Workflow(...)`, run `run drift`.
  - `launch: "name"`: relaunch exactly as today.
  - `launch: "scriptPath"`: say one line first (the workflow file changed since launch, so this relaunch runs the launch's script from `<path>`; in bypass-permissions, which is how the plugin reviews itself, there is no prompt; in other modes one permission prompt per relaunch), then `Workflow({scriptPath: <path>, args, resumeFromRunId})`. If the call is denied (a headless session), say so and stop: relaunch from an interactive session or start fresh.
  - `launch: "refuse"`: say `line` verbatim, `run clear`, stop.
  - `agents` not empty: say `line` (the agent sentence) and go on.
  - `drift` not null: add it as `args.drift`; it is the one further key a relaunch may add, replaced on each relaunch.
- **Existing warning (decision 7):** the skill carries no warning about this fault today (searched `skills/`, `README.md`, `docs/`); the nearest text is `run check`'s `plugin` refusal for hand commits, which stays. So nothing is removed; the new paragraph is the skill's statement on it.
- **`done` / `error`:** the `error` section names stage `relaunch` and the Finish stop as not resumable (already covered by `resumeFrom` null; one clause each).

### Tests

`tests/loop-test.mjs` (new section; `go()` gains an optional script-body argument; the mock answers `last round` with `scenario.lastPosted`, else the highest round a non-dry `post` call posted):
1. **Changed workflow file:** launch to a hand-off; relaunch with a body whose review prompt text is edited: the prefix check fails at the first changed label (the fault, pinned as a check that the prompts differ). Relaunch with the launch's body while the "live" body differs: `samePrefix` holds and the run finishes.
2. **Fallback, no pin:** `drift: {workflow: 'workflows/redline-loop.js', pinned: false, agents: []}` returns `error` at stage `relaunch`, the message names the file, zero agent calls, `resumeFrom` null.
3. **Agent sentence:** with `drift.agents` set, the handoff comment and `warnings` hold the exact sentence, and every prompt before Finish equals the run without `drift`; absent or empty lists leave the handoff comment byte-identical to today's.
4. **Finish rule, three cases:** normal finish (posted equals the round, goes on); dry run (nothing posted, goes on); finish from a re-run earlier round (`lastPosted` above the round: `error` at `finish`, the last call is `last round`, no `PR description`, no `handoff comment`, no `record commit`, `reviewRequested` absent).
5. Malformed `args.drift` fails at startup.
6. Existing checks that list Finish's calls gain `last round`; the `coverage off` proof and every replay prefix check must hold unchanged.

`tests/prefs-test.sh`, `# run drift` cases in the throwaway repositories `run check` uses: not the plugin; plugin unchanged (`name`); workflow changed with a pin (`scriptPath`, the path); workflow changed, record's script path is the live file (`refuse`, exit 1, line names the file); agents changed (list and exact sentence); an uncommitted agent edit counts; no marker exits 2.

`tests/guard-cases.tsv`: the two rows above. Red before green for each.

### Docs and version

- `docs/running.md`: "Hand-off and relaunch" gains what `relaunch` runs on the plugin's own repository (the launch's script, by name or pinned; the prompt and bypass sentence; the fallback refusal; the agent warning and its handoff sentence). "The handoff comment" gains the Finish read and its stop. "Run markers and resume" names `run drift`.
- `docs/scripts.md`: the `redline-prefs.sh` header block is regenerated to match the script's header.
- `docs/guard.md`, "Self-hosted": one sentence pointing at running.md.
- `README.md`: Known limits gains the unmeasured interactive facts in one line.
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: `0.2.4`.

## Files

- `scripts/redline-prefs.sh`, `tests/prefs-test.sh`
- `workflows/redline-loop.js`, `tests/loop-test.mjs`
- `skills/redline/SKILL.md`
- `tests/guard-cases.tsv`
- `docs/running.md`, `docs/scripts.md`, `docs/guard.md`, `README.md`
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- `agent-os/specs/<stamp>-81-pin-relaunch-script-finish-rule/`
- Not touched: `scripts/redline-guard.sh`, `hooks/hooks.json`, `agents/*.md`, `templates/`, `.claude/redline/checks.*`, the unattended section.

## Tasks

**Task 1: Save spec documentation.** Create `agent-os/specs/<YYYY-MM-DD-HHMM>-81-pin-relaunch-script-finish-rule/` (stamp from `date` at save time) with:
- `plan.md`: this plan.
- `shape.md`: scope; the decisions above with the user's riders; the probe report (what each did and showed, which facts are headless and `--plugin-dir` only); the two unmeasured facts and why the design does not depend on the first; the addendum decision with the paths checked (a pinned relaunch replays every recorded step; an error resume at `coverage rN` or `review rN` happens before that round is posted; a resume at `post rN` reuses the cached review; a resume at a later label reruns forward only; a lost session is refused by `run check` and a fresh run numbers after the posted rounds; the fallback launch with a changed workflow is refused; the Finish rule is the backstop); that the skill had no existing warning.
- `standards.md`: full text of workflow/replay, workflow/agents, testing/tests, scripts/bash-conventions, scripts/guard, process/docs-gate, process/release, process/standards-retrospective, process/internal-notes, prompts/attribution.
- `references.md`: `run check` and its `plugin` reason in `scripts/redline-prefs.sh`; `sweepThreads` and `finish()` in the workflow (the Finish-only GitHub read); the `askRules` byte-identical proof and the resume section in `tests/loop-test.mjs`; PR #80's run records as the fault's evidence (cited, not copied).
- No visuals. Product alignment: read `agent-os/product/` and note it.

**Task 2: `run drift`.** Cases first in `tests/prefs-test.sh` (red), then the subcommand and header in `scripts/redline-prefs.sh`. Rows in `tests/guard-cases.tsv`.

**Task 3: The workflow.** Checks first in `tests/loop-test.mjs` (red), then `args.drift`, the startup refusal, the handoff sentence and the Finish read in `workflows/redline-loop.js`.

**Task 4: The skill.** Section 6, the new section 7 paragraph and its references, the `error` clauses.

**Task 5: Docs and version.** As listed; 0.2.4 in both manifests.

**Task 6: Verification Gate.** `.claude/redline/checks.sh --baseline` until green (its nine commands), then:
- **Docs (step 10):** `scripts/redline-prefs.sh` → `docs/scripts.md` "`redline-prefs.sh`" and `docs/running.md` "Run markers and resume"; `workflows/redline-loop.js` → `docs/running.md` "Hand-off and relaunch" and "The handoff comment"; `skills/redline/SKILL.md` → `docs/running.md` "Hand-off and relaunch"; `.claude-plugin/*.json` → no reader-facing change beyond the version (the CHANGELOG entry is the person's step after the merge). Each names its commit once the user has made it.
- **Version (step 11):** patch, 0.2.4; no setup-rerun surface changes.
- **Standards retrospective (step 12), proposed for approval then:** `workflow/replay.md`: the Finish sweep is no longer "the one place" the workflow asks GitHub (now two, both after every stopping point); a relaunch runs the launch's script, by name while unchanged and by the persisted copy otherwise; `args.drift` enters at relaunch and is read only at startup and Finish; the replay key as probed. `workflow/agents.md`: agent files are read at process start and cannot be pinned by path. `testing/tests.md` only if a new pattern was needed. Applied in their own commit, which the user makes.
- **Spec folder (step 13):** `plan.md` as built, deviations under Decisions.

## How this PR's own Redline review should be run

This PR edits `workflows/` and the launch skill, so its review meets the fault and is the first real use of the fix.

- Start a new session with `claude --plugin-dir <repo>` in bypass-permissions, on the PR's head, so the script the launch persists is this PR's, Finish rule included.
- Run `guided`, so a hand-off exercises the relaunch. Do not reopen the session mid-run unless needed; if it is reopened, the agent warning is expected.
- At each relaunch read the skill's line: once a round has edited `workflows/redline-loop.js` it must say the relaunch runs the pinned script, and there should be no permission prompt. A prompt or a denial there is the answer to the unmeasured bypass fact: record it in `shape.md`.
- After each relaunch, confirm in `/workflows` that the rounds before the stop show as cached, not running. If a posted round starts to rerun, stop the workflow and finish with a fresh run.
- A round that edits the skill itself takes effect only in a new session; the running session keeps the skill it loaded.
- At `done`, check the rounds reported equal `redline-gh.sh last-round`. A stop at stage `finish` naming a lower round is the new rule working; start fresh.
- If the pinned relaunch fails in any way the plan did not foresee, fall back to `autopilot` on a fresh run (no hand-off, so no relaunch) and open an issue with what was seen.

## Verification

- `tests/prefs-test.sh`, `node tests/loop-test.mjs`, `tests/guard-test.sh`: new cases red before the change, green after; all earlier checks unchanged apart from Finish call lists gaining `last round`.
- `.claude/redline/checks.sh --baseline` exits 0.
- `claude plugin validate .` passes; both manifests read 0.2.4.
- End to end: the self-review above.
- The scratch probe files under the session scratchpad are throwaway and are not part of the change.

## As built

Built 2026-11-12. `.claude/redline/checks.sh --baseline` exits 0 with all nine checks green (guard 594, loop 718, prefs 117). Deviations from the plan above, each recorded under Decisions in `shape.md`:

- `agents/redline-github.md` was edited after all: the new Finish read is a new operation (`last-round`) of the GitHub agent, so its operation list, its return shape (`round`) and the operation enum name it.
- `run drift` answers `self: false, launch: "name"` before it reads the marker, so a repository that is not the plugin's own needs no marker and sees no new failure; on the plugin's own repository a missing marker or start commit is exit 2 and the skill stops.
- The Finish stop is made non-resumable with a `fresh` flag on the error, since `stageError` falls back to the last agent label; a failed read (the agent's `error`) stays resumable at `last round`.
- The Finish read applies to every Finish kind that holds a Redline round: the handoff, the cap-hit comment, and a human review pass's summary when it ran a nit pass.
- The result's `relaunch.how` note names `drift`.
- Loop test: besides the planned cases, a capped run from a lower round and a failed read. Five earlier checks that list Finish's calls gained `last round`; no other earlier check changed.

### Docs (gate step 10)

Each entry names its commit once the author has made it.

- `scripts/redline-prefs.sh`: `docs/scripts.md`, "`redline-prefs.sh`" (the header block and the intro line); `docs/running.md`, "Saved launch settings" (the `run` subcommands) and "Hand-off and relaunch". Commit: ad81b68.
- `workflows/redline-loop.js`: `docs/running.md`, "Hand-off and relaunch" (what `relaunch` runs on the plugin's own repository) and "The handoff comment" (the read of the highest posted round). Commit: ad81b68.
- `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch"; `README.md`, "Known limits". Commit: ad81b68.
- `agents/redline-github.md`: `docs/running.md`, "The handoff comment" (the GitHub agent's read at Finish). Commit: ad81b68.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: no reader-facing change beyond the version, 0.2.4; the CHANGELOG entry is the person's step after the merge.
- `docs/guard.md`, "Self-hosted": one sentence pointing at running.md.
- New subcommand `redline-prefs.sh run drift`: as the first entry. New exit codes: its 1 (refused) and 2, in the header. No new config key or allow rule.
