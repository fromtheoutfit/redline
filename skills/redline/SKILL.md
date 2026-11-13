---
name: redline
description: "Redline review/revise loop on a pull request: /redline:redline <pr> [autopilot|guided|plan|review|review only] [correctness only] [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run] [coverage off]. Reviews the PR, posts one Redline review per round, shapes and implements the fixes through Agent OS, checks, pushes, replies and re-reviews while a round finds a new correctness item to fix or ask about, then hands the PR to the teammate; every verified item is fixed, declined with a reason, or put to the person. The interrupt dial says where it stops for the person; .claude/redline.local.json remembers the settings. Use only when the person types /redline:redline (or /redline:redline-review, /redline:redline-revise, which follow this file). Never start a run on your own initiative."
argument-hint: "<pr> [autopilot|guided|plan|review|review only] [correctness only] [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run] [coverage off]"
---

# /redline:redline

You are the only part of Redline that can talk to the person. You parse what they typed, settle the run's settings (asked once, then remembered in `.claude/redline.local.json`), check the checkout, write the start snapshot, launch the plugin's `redline:redline-loop` workflow, and handle what it returns: a hand-off (judgment calls to decide, or a plan to approve), a posted review to pick findings from, a finished run (deferred items to triage), a capped run, or an error. Every stop leaves a run marker in the same file (`redline-prefs.sh run save`), so the next `/redline:redline <pr>` can offer to resume it, from the session that launched it (#10). The workflow, the agents and the scripts do everything else; see `${CLAUDE_PLUGIN_ROOT}/README.md` and `${CLAUDE_PLUGIN_ROOT}/docs/`.

Arguments: `$ARGUMENTS`

## 1. Resolve the repository

Run `git rev-parse --show-toplevel`. That absolute path is `repoRoot`; every path below is absolute from it. Read `<repoRoot>/.claude/redline.json` (the per-repo config). If it does not exist, stop with one line: this repository is not set up for Redline yet (see `${CLAUDE_PLUGIN_ROOT}/docs/setup.md`).

The plugin's root is `${CLAUDE_PLUGIN_ROOT}`: its scripts, workflow, README and `docs/` are there. Everything per repository (`checks.sh`, `redline.json`, the spec folders) is under `repoRoot`.

## 2. Parse the arguments

The grammar, in any order, case-insensitive:

| Typed | Meaning | Default (from `redline.json`, then built in) |
| --- | --- | --- |
| `<n>` or `#<n>` | PR number. **Required.** | none: stop with "Usage: /redline:redline <pr> [...]" |
| `autopilot`, `guided`, `plan`, `review`, `review only` | `interrupt`: the dial, where the run stops for the person (see "The interrupt dial" below). `review only` also sets `reviewOnly = true`: stop after the first round's review is posted (or written, in a dry run) | saved, else `guided` (step 3) |
| `correctness only` | `scope = "correctness"`: the reviewer never looks for nits, and a round without a correctness finding is done, with no final nit pass | saved, else `all` (step 3) |
| `max <N> rounds`, `max <N> round`, `max <N>` | `maxRounds = N` (revise rounds allowed while correctness bugs remain) | saved, else `maxRounds` in `redline.json`, else 3 (step 3) |
| `revise fable`, `revise opus` | `models.revise.model`: `claude-fable-5-1` or `claude-opus-5-5` | saved, else ask (step 3) |
| `reviewer @handle` | `reviewer = handle` (the `@` is dropped) | `reviewer` |
| `no push` | `push = false` (commit locally only) | `push`, else true |
| `dry run` | `postToGitHub = false` and `push = false`: every body is written under the spec folder's `redline/`, nothing reaches GitHub | `postToGitHub = true` |
| `coverage off` | `models.coverage = null` in `args`: every round runs the reviewer alone, with no coverage pass and the done rule from before the pass existed. The fallback when the built-in `code-review` skill is absent on this Claude Code or its recipe has drifted, never the default; a per-run word, never saved | `models.coverage` from `redline.json` (absent: on, at `reviewerFirstRound`'s model and effort) |

A word that fits none of these stops the launch with one line naming it. Do not guess.

**The interrupt dial.** Five levels, each a stopping point the loop already has:

- `autopilot`: never asks. At a judgment call the shaper's recommendation becomes the decision and the run goes on; each such decision is attributed `redline (autopilot)` in the spec, the thread and the handoff comment.
- `guided` (the default): the run ends only when the shaper returns a judgment call (`ask`), which it does in five cases only, beside the repository's ask rules and Redline's own files; everything else it decides itself, a decision to decline included, and the run does not stop for it; you present the calls, record the answers and relaunch.
- `plan`: after shaping, every round, the run ends with the full disposition list; you present it, the person approves it as-is or changes a disposition or answers an ask, and you relaunch.
- `review`: the run ends after the first round's review is posted; you present the findings, the person picks which to act on (and drops the rest, each with a reason), and you relaunch. Later rounds behave as `guided`.
- `review only`: stop after the first round's review; nothing is revised.

### A stopped run

Once the PR number is parsed, before section 3 asks or saves anything, run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run read <repoRoot> <n>`. It prints `null` when no run on this PR is waiting: go on to section 3. Otherwise it prints the marker the last stop left (`kind`: `error`, `handoff`, `reviewed` or `stopped`; `stage`, `label`, `error`, `round`, `handoffKind`, `specFolders`, `runId`, `session`, `record`, `args`). Say the Inline session paragraph (section 4, step 1) under its condition first: a resume skips the precheck, and an `error` or `stopped` resume relaunches in the same turn, so this is the last point at which the person can leave the question, change the session's permission mode and type the command again (#83, R1-4). Ask one `AskUserQuestion`: "The last run on #<n> stopped <with an error at <stage> (<error>) | at a hand-off with <k> judgment calls open | after posting the round <round> review for you to pick from | before returning a result>. Resume it, or start fresh?", with **Resume** first and **Start fresh** second. In a headless session (`claude -p`), resume when the check below passes, else start fresh, and say which in one line.

- **Resume.** Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run check <repoRoot> <n> --plugin ${CLAUDE_PLUGIN_ROOT}`. On exit 1, say its `line` verbatim and stop: for `session` the line carries `claude --resume <id>` (the harness replays a run only from the session that launched it, so the person reopens that session and types the command again there); for `branch`, `head-moved`, `plugin` and `untracked` it says what to do (any hand commit after a stop that was not an error, a fix outside `.claude/` after an error, or any hand commit when this repository is the plugin, means a fresh run, whose first round carries the findings forward). On exit 0, skip sections 3, 4 and 5, and say in one line that the run resumes with its original settings: the marker's `args.interrupt`, its revise model (`args.models.revise.model`), `args.maxRounds` and `args.scope`. When words were typed after the PR number (`dry run`, `no push`, `autopilot` and the rest), name each one in that line as ignored, since a resume keeps the run's args; when none were typed, say nothing about them. Save the run record copy as section 7 says ("Save the run record"). Then, by `kind`:
  - `error`: relaunch in this session with the marker's `args` exactly, plus `resume`: the marker's `args.resume` (or `{}`) with one entry added under the marker's `label`, `{"attempt": <marker.attempt>, "error": "<marker.error>", "hand": <the check's hand>}` (the script has already merged the label's earlier entry, so copy it as printed), and `resumeFromRunId` set to the marker's `runId`. The agents before that label replay from cache; that one reruns with one added line and everything after it runs again.
  - `handoff` or `reviewed`: read `result` from the marker's `record` file (the harness's own record of the run) and continue as that result's section below says: present the calls or the findings, record the answers, confirm, relaunch with the marker's `args` plus what the stop asked for.
  - `stopped`: relaunch with the marker's `args` unchanged and `resumeFromRunId`, as "stopped before a result" says.
  Every relaunch here goes through "The script a relaunch runs" (section 7) first. Record the new `runId`. The next stop rewrites the marker; a run that finishes clears it. An `error` or `stopped` resume relaunches from the line holding only the command the person typed, which the relaunch rule (section 7) accepts; nothing else is typed first. A `handoff` or `reviewed` resume relaunches from the word, as its section says ("Relaunch only from the word"), since the person answers there first.
- **Start fresh.** Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>`, then go on to section 3. When precheck step 4 (a clean tree) fails and the marker named spec folders, the one line names them: `commit or remove <folders>` (the earlier run's record; a hand-off or an error that was not resumed leaves it, since `review only` and revise-only runs commit their own).

## 3. Settle the settings (fresh launches only)

Skip this on a relaunch after a hand-off or a `reviewed` result, and on a resume (section 2, "A stopped run"): the settings were settled at the first launch and `args` is reused byte for byte. The only typed line a relaunch needs is `relaunch` (section 7, the relaunch rule).

Four settings are remembered per person per repository in `<repoRoot>/.claude/redline.local.json` (ignored by git): `interrupt`, `revise` (the model id), `maxRounds` and `scope`. The merge rules live in one script; run it once with the words from the command line (only the ones typed), and read its JSON:

```
${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh resolve <repoRoot> [--interrupt <word>] [--revise fable|opus] [--max-rounds <N>] [--scope all|correctness]
```

It prints `effective` (command line over saved file over defaults: `guided`, `claude-opus-5-5`, `redline.json`'s `maxRounds` or 3, `all`), `sources` (where each came from), `ask`, `confirm` and `summary`. Then:

- **`confirm` is false (no saved file).** Ask one `AskUserQuestion` with one field per name in `ask` (at most four; a `review only` run asks only for the scope, since no revise agent starts), each with the sensible default first:
  - "Where should the run stop for you?" **Guided (Recommended)** · Autopilot · Plan · Review, with one line each from the dial above.
  - "Which model should revise this PR (shape, resolve, implement)?" **Opus 5.5** (`claude-opus-5-5`; never spends Fable budget by accident) · **Fable 5.1** (`claude-fable-5-1`; the better result when the budget allows).
  - "How many revise rounds at most?" **3** · 2 · 1 · 5.
  - "What should the reviewer look for?" **Everything** (`all`: correctness bugs and nits) · **Correctness only** (no nits, no final nit pass).
- **`confirm` is true (a saved file).** Ask one `AskUserQuestion`: "Settings for this run?" whose first option is the script's `summary` verbatim (`Run with: <interrupt> · <model> · <N> rounds · <scope>`, with `(command line)` after each value typed in the command, which overrides the saved one), and whose second option is **Change something**. On "Change something", ask the fields above that were not typed on the command line (every field in `applies`), with the saved values as the first options.

A headless session (`claude -p`) has no `AskUserQuestion`: there, take the script's `effective` values without asking (the command line, the saved file and the defaults, in that order) and say so in one line. Pass every setting on the command line when a headless run must not rely on the saved file.

Whatever the run uses is the new saved set, however it was chosen: run `redline-prefs.sh save <repoRoot> --interrupt <word> --revise <model id> --max-rounds <N> --scope <word>` with the four effective values before launching. The script itself keeps `autopilot` and `review only` out of the file (they are per-run verbs; the previous saved interrupt stays), so always pass what the run uses. The saved file is one of Redline's own: no Redline role may write it, and you write it only through the script.

The revise model holds for every round of the run and every relaunch. A `review only` run never starts a revise agent; its `models.revise.model` is whatever was settled, as a placeholder.

## 4. Precheck (fresh launches only)

Skip this on a relaunch after a hand-off: the round's spec folder is uncommitted in the tree by design.

1. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>` must exit 0: the gate stamp in `<repoRoot>/.claude/redline/checks.sh` still matches the repository's Verification Gate (see "Gate stamp" in `${CLAUDE_PLUGIN_ROOT}/docs/contract.md`). On exit 1, stop the launch with the script's one stderr line, verbatim: the gate has changed since `checks.sh` was stamped, or `checks.sh` carries no stamp. On exit 2, stop as section 1 does: this repository is not set up for Redline yet.
   Then `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh version <repoRoot>`, the contract's versions in one read-only call (#15): on exit 1, say each stderr line it printed, verbatim, and go on. There are four kinds: `checks.sh` was made from an older template, or carries no version line (run `/redline:setup` to port it), or from a newer one than this plugin ships (update the plugin); the unattended section in `shape-spec.md` was made from an older template, or carries no version marker (run `/redline:setup` to see the change), or a newer one (update the plugin); `settings.json` lacks entries the plugin now expects, or carries entries it retired (run `/redline:setup`); and, when this repository is the plugin itself, the session loads Redline from another copy, so the run would review the branch with the released skill, workflow, agents and guard instead of its own (start the session with `claude --plugin-dir <repoRoot>`, #16). A warning, never a stop; on exit 2, stop as section 1 does.
   **Inline session.** When `${CLAUDE_PLUGIN_ROOT}` does not contain `/plugins/cache/`, the session loads Redline from a directory rather than an installed release. Say this paragraph, with that path as `<root>`, whatever else this step warned, and go on: "This session loads Redline from `<root>`, not an installed release. In auto mode, Claude Code refuses the Redline agents' file writes with no verdict, and the run fails at its first file write, normally its first post. Run this session in accept-edits and approve each prompt, or in bypass-permissions (#76). Bypass-permissions also removes the coverage pass's permission prompt, the one check the guard cannot provide; a fresh launch with `coverage off` runs without the pass." A warning, never a stop, and said in every permission mode, since the skill cannot read the mode. A Start fresh (section 2) has said it already, so it is not said twice.
2. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh pr <n>`: the PR must be `OPEN`, except in a `dry run`, which posts and pushes nothing and so may read a closed PR (a seed for a recall test). Keep `headRefName`, `headRefOid`, `baseRefName`, `title`.
3. `git rev-parse --abbrev-ref HEAD` must equal `headRefName`.
4. `git status --porcelain` must print nothing.
5. `git rev-parse HEAD` must equal `headRefOid`.

Run the git commands plainly, from the session's working directory, which section 1 established is inside the checkout: the shared allow rules are `Bash(git status:*)` and `Bash(git rev-parse:*)`, and a `git -C <path> ...` spelling matches neither, so it asks the person before running.
6. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh login` prints the login Redline posts as: keep it as `login` (every decision the person makes is attributed `@<login>`). When `reviewer` is set, it must not equal `reviewer` (GitHub ignores a review request to the PR's own author).
7. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh files <n>` prints every changed path as a JSON array (every page of GitHub's files endpoint, where `gh pr view` stops at 100); keep it as `files` for the snapshot in section 5. On exit 2, stop with its one stderr line verbatim (a `gh` older than 2.48.0 does not know `--slurp`). Say the count in one line, `<N> files on GitHub`. Cross-check it against `git diff --shortstat origin/<baseRefName>...HEAD`, run plainly: its one line starts with the local count (`336 files changed`, `1 file changed`; no output means 0), with the same rename handling as GitHub's list, so read the number, never count paths: when the counts differ, warn in one line naming both (`GitHub lists 336 files, the local diff against origin/main 333; the snapshot uses GitHub's list`); when git fails (`origin/<baseRefName>` not fetched), warn and go on. Above 300 files, warn: `over 300 files: GitHub's whole-PR diff is unavailable, so Redline reads per-file patches; a finding in a file whose patch GitHub omits (binary, or too large) goes in the review body behind a marker`. When `redline.json` sets `maxFiles` and the count exceeds it, stop: `<N> files is over maxFiles (<M>) in .claude/redline.json; split the PR`.
8. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh last-round <n>` prints the highest Redline round already posted on the PR, `0` when none (exit 2 stops the launch with its line). `firstRound` is that number plus one: a PR that already carries rounds 1 and 2 from an earlier run gets round 3 from this one, so every finding of this run gets its own review and threads, and nothing is skipped as already posted (#10). Say it in one line when it is not 1: `rounds 1 to 2 are already posted; this run starts at round 3`.
9. When `firstRound` is not 1: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh prior-findings <n>` prints every finding those rounds posted with its disposition, read from the Redline reply in its thread (exit 2 stops the launch with its line); keep the JSON array as `priorFindings`. A finding with no reply, or a `not changed` one, has no disposition and is carried into this run's first round, where the reviewer re-verifies it; the rest (`fixed`, `declined`, `deferred`, `decided`, `dropped`, `carried`, or `left` to the person under a repository ask rule) are tracked and never re-raised (#35). Say it in one line: `3 earlier findings have no disposition and are carried into round 3: R1-2, R1-5, R2-1`, or `every earlier finding has a disposition`. When `firstRound` is 1, `priorFindings` is `[]` and nothing runs.
10. The repository's **ask rules** (#49): `askRules` in `redline.json`, read in section 1, is a list of `{id, when, reason}`, or absent. Check each rule by reading it: `id` matches `[a-z][a-z0-9-]*` and is unique; `when` holds exactly one of `paths` (a non-empty list of non-empty strings, none holding `!` or `[`) or `prose` (a non-empty string); `reason` is one non-empty line. A rule that fails stops the launch with one line naming it (`askRules[2]: rule 'billing': reason must be one non-empty line; fix .claude/redline.json`): the guard refuses every write by a Redline role while the list is malformed, so the run could not build anything. Keep the list as `askRules` (`[]` when the key is absent or empty) and say in one line how many apply and their ids (`2 ask rules: craft-project-config, billing`); say nothing when there are none. A finding a rule covers comes back as a judgment call naming the rule, is never fixed, declined or deferred by Redline, and is listed as the person's in the handoff.

Any failure stops the launch with one line saying which check failed and what to do (the gate script's own line, `check out <branch>`, `commit or stash your changes`, `pull or push so HEAD matches the PR`, `pick another reviewer`, `split the PR`, the gh version line). Never fix the checkout yourself, and never stamp or edit `checks.sh`: a person does that.

## 5. Write the start snapshot and assemble `args`

1. `launchedAt`: run `date +%Y-%m-%dT%H:%M:%S%z` once and keep the output (for example `2026-10-18T09:30:00-0400`). The workflow derives the spec-folder timestamp `YYYY-MM-DD-HHMM` from it, so the same value must be reused on every relaunch.
2. `files`: the JSON array from precheck step 7.
3. `issue`: the issue number in the head branch (`feature/42-...` gives 42), else the `(#N)` in the PR title, else the PR number.
4. Write the start snapshot with the Write tool to `<repoRoot>/agent-os/specs/<YYYY-MM-DD-HHMM>-<n>-review-round-<firstRound>/redline/snapshot-start.json` (`firstRound` from precheck step 8; `1` on a PR with no posted Redline round):

   ```json
   {"pr": 43, "start_sha": "<headRefOid>", "base_ref": "<baseRefName>", "files": ["..."], "plan_paths": []}
   ```

   It sits under `agent-os/specs/`, which every `checks.sh` allowed list includes, and it is committed as the run's record: with the first round's spec folder, or by the run-record commit at Finish when no round committed it.
5. Assemble `args` (every field, every time; the workflow reads nothing else):

   ```json
   {
     "repoRoot": "/abs/path",
     "pluginRoot": "${CLAUDE_PLUGIN_ROOT}",
     "pr": 43,
     "headRef": "<headRefName>",
     "baseRef": "<baseRefName>",
     "startSha": "<headRefOid>",
     "files": ["..."],
     "issue": 42,
     "firstRound": 1,
     "priorFindings": [],
     "askRules": [],
     "login": "<login>",
     "launchedAt": "2026-10-18T09:30:00-0400",
     "snapshotPath": "/abs/path/agent-os/specs/2026-10-18-0930-43-review-round-<firstRound>/redline/snapshot-start.json",
     "interrupt": "guided",
     "scope": "all",
     "maxRounds": 3,
     "maxPlanAdjustments": 2,
     "reviewer": "handle",
     "checker": "full",
     "checkerStallMs": 300000,
     "baselineSeconds": 33,
     "push": true,
     "postToGitHub": true,
     "reviewOnly": false,
     "models": {
       "revise": {"model": "claude-opus-5-5"},
       "reviewerFirstRound": {"model": "claude-opus-5-5", "effort": "xhigh"},
       "coverage": {"model": "claude-opus-5-5", "effort": "xhigh"},
       "reviewerLaterRounds": {"model": "claude-opus-5-5", "effort": "high"},
       "planApprover": {"model": "claude-opus-5-5", "effort": "high"},
       "standardsApprover": {"model": "claude-sonnet-5-5"},
       "checker": {"model": "claude-haiku-5-5"},
       "github": {"model": "claude-haiku-5-5"}
     }
   }
   ```

   `pluginRoot` is the plugin's root exactly as written above; the workflow script has no environment of its own and finds `redline-gh.sh` and the README through it. `firstRound` is precheck step 8's value: the workflow numbers its rounds from it and never asks GitHub, so a relaunch replays. `priorFindings` is step 9's array, exactly as printed (`[]` at round 1): the workflow carries the undispositioned ones into its first round and never reads the threads itself, since its own replies change them. `askRules` is step 10's list, exactly as `redline.json` holds it (`[]` when absent): the workflow injects it into the reviewer's, the shaper's and the plan approver's prompts and forces an `ask` for a finding a rule covers, so a rule edit needs no setup rerun, only a fresh launch; a relaunch keeps the list the run started with. `interrupt`, `scope`, `maxRounds` and `models.revise.model` are the effective settings from step 3 (`interrupt` is the command-line word, `review only` included; `reviewOnly` is true exactly then). The `models` entries other than `revise` come from `redline.json` verbatim; `models.revise.effort` too, when `redline.json` sets one. `models.coverage` is the coverage pass (the built-in `code-review` skill as the finder on every whole-PR and fix-diff round): from `redline.json` verbatim, `null` when `coverage off` was typed (the one per-run override of a `models` entry, never saved), and left out when `redline.json` has no such key, which means on at `reviewerFirstRound`'s model and effort. `baselineSeconds` is `baseline.seconds` from `<repoRoot>/.claude/redline/checks.json` (read it with the Read tool), or `null` when the file, the `baseline` or its `seconds` is absent: over 480, or null, the workflow has the checker and the implementer run the gate in the background, since it will not fit in one foreground Bash call (#40). On a relaunch, `decisions`, `approvedPlans` and `selected` are added as step 7 says, and nothing else changes.

## 6. Launch

Call `Workflow({name: "redline:redline-loop", args})`. If the name is not found (a session started before the plugin was installed or updated does not list its workflow), call `Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/redline-loop.js", args})` instead. **Record the `runId`** from the result; a relaunch needs it. The result also names the script the run launched with (a copy the harness keeps under the session's `workflows/scripts/` when the launch went by name); the harness writes that path into the run's record, which is where a relaunch finds it ("The script a relaunch runs", section 7). Keep `args` exactly as sent. In a headless session (`claude -p`) the harness stops background tasks ten minutes after the session's last turn, which kills a run mid-phase: such a session is started with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` so it waits for the workflow (step 7).

Tell the person in one or two lines that the run has started, what it will do (the dial, the scope, dry run, rounds, revise model, reviewer, and `coverage off` when it was typed), and that they can watch it in `/workflows`. Then wait for the workflow's completion notification; never predict its result.

## 7. Handle the result

The workflow returns `{status, rounds, judgmentCalls, deferred, openFindings, decided, commits, specFolders, warnings, ...}`. Every decision in `decided`, in the spec folder's `shape.md`, in each finding's thread and in the handoff comment names its owner: `decided by: redline` (the shaper settled it from the evidence), `decided by: @<login>` (the person, at a hand-off, with the restated reasoning), or `decided by: redline (autopilot)`.

### `review-only`

Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` first. Summarise the first round's review (round `firstRound`) in a few lines: how many findings by category, the correctness ones by title (a finding with `carriedFrom` as "first reported as <that id>"), how many of them the verifier could not confirm (`confidence` `unconfirmed`, each with what would confirm it) and, when the round ran the coverage pass (`rounds[0].coverage` not null), how many candidates it returned and how many became findings (`coverage.candidates`; `coverage.counts.verified` plus `coverage.counts.unconfirmed`), where the review sits (`reviewFile`; in a dry run, say plainly that nothing was posted), and the run-record commit (`recordCommit`: the review-only run commits its review, findings and start snapshot like a full run, so the tree is clean for the next launch). Say in one line that a later `/redline:redline <pr>` carries these findings into its first round, so no separate revise launch is needed; in a dry run say instead that nothing reached GitHub and the record commit is local only: before the next launch, copy the round's spec folder outside the repository if the review is worth keeping and drop the commit (`git reset --hard origin/<branch>`), since the precheck stops while HEAD is ahead of the PR; a later run then starts at round 1 and carries nothing, and the review is the record under the round's spec folder until then. Stop.

### stopped before a result

The workflow was stopped without returning (the harness's background-task ceiling in a headless session, or the person stopping it). Nothing was decided. Save the run record (see "Save the run record" below) and write the marker (`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>`, kind `stopped`), then relaunch **in this session** with the same `args`, no new `decisions`, and `resumeFromRunId` set to the recorded `runId`, under the relaunch rule (section 7: when the last typed line is neither `relaunch` nor a line holding only a Redline command, ask for `relaunch` first) and after "The script a relaunch runs" below: the agents that finished replay from cache, the interrupted one reruns (a shaper completes the folder it started), and the run id is kept. Then handle the new result as below. If this session ends first, the marker is the way back: `/redline:redline <n>` in the reopened session (`claude --resume <session id>`, which `run check` prints) offers to resume it.

### `handoff` with `handoffKind: "plan"` (the `plan` dial)

The run stopped after shaping round `handoffRound`, as the dial asks, with the round's whole disposition list in `plan`: one entry per finding with `finding` (ID, file, line, title, category), `disposition` (`fix`, `decline`, `defer` or `ask`), `recommendation` (one sentence: the change planned, the decision to decline, the mitigation chosen, or the option recommended), for a decline its `reason` (the sentence Redline will post in the finding's thread) and `decidedBy` (`redline` for a fix, a decline or a defer; empty for an ask, which is still pending). `deferredPlanned` holds the mitigation and the full fix of each defer; `judgmentCalls` the asks, each with its story, options and recommendation, in answering order.

Present the list, one line per finding (ID, title, disposition, recommendation, and for a decline its reason), then ask one `AskUserQuestion`, "Approve the plan as-is?", with **Approve as-is** first and **Change a disposition** second; then the asks as in the `decisions` hand-off below, one at a time. The person may:

- **approve as-is**: nothing to record beyond the asks' answers;
- **change a disposition** of a fix, decline or defer finding to `fix`, `defer` or `accept` (no change, with a reason); changing a decline to `fix` or `defer` overrules it, and Redline then builds it as the person's decision: on "Change a disposition", say that each change is one line in the answer form, `<id>: <fix|defer|accept>. <reason>`, in the Other field or typed; record each under its ID as `{"choice": "<fix|defer|accept>", "notes": "<the restatement>", "date": "<today>", "disposition": "<fix|defer|accept>"}`. The restatement rule below applies; for a `defer` it names the mitigation the person wants; for an `accept` the reason the behaviour stands. Say each back in one line, then ask "Approve the plan as-is?" again;
- **answer an ask**: record it as in the `decisions` hand-off below. An entry whose `forced` is not null is a finding a repository ask rule covers (`forced.rule`, `forced.reason`): it is always an ask, and it cannot be changed to `fix` or `defer` (the workflow refuses the override and the guard refuses the write); say so when the person tries, and record their answer as an ask's.

Every ask must be answered before the relaunch (an approved round whose ask is still open stops again as a `decisions` hand-off). When everything is answered, list the approvals and changes one line each, ask for the word as below ("Relaunch only from the word"), save the run record, and relaunch with `args.approvedPlans` set to `approveWith.approvedPlans` from the result (every pass approved so far, this one added: a Redline round by its number, a human review pass as `h<n>`; pass the list exactly as given) and `args.decisions` holding every decision so far plus the new ones. The plan dial stops again after the next round's shaping; repeat.

### `reviewed` (the `review` dial)

The run stopped after posting the first round's review (`reviewedRound`; `reviewFile`, in a dry run written only). `findings` holds every open finding in full (ID, file, line, category, severity, confidence, title, description, proposed fix, `wouldConfirm` for one the verifier could not confirm, and `carriedFrom`, the earlier round's id it carries forward, or empty); `known` the ones already tracked, which need nothing.

Summarise the review as in `review-only`, then present the findings one at a time, in prose (a carried one as "first reported as <id>"), and ask which to act on with `AskUserQuestion`, multiSelect, "Which findings does this run act on?": up to four findings per question, in review order (the label the ID and title, the description the proposed fix), as many questions as the review needs. Every finding not picked is dropped **with a reason**, one standalone sentence in the restatement style below (it is posted in the finding's thread and listed in the handoff comment as `decided by: @<login>`): "Not selected for this run." unless the person gives one as a line `<id>: drop. <reason>` (Other or typed); say each back in one line. Then list the selection one line each, ask for the word as in the `decisions` hand-off ("Relaunch only from the word"), save the run record, and relaunch with `args.selected` set to `{"act": ["R1-1", ...], "dropped": {"R1-2": "<reason>", ...}}`. The loop shapes only the selected findings; later rounds hand off their judgment calls as `guided` does.

### `handoff` with `handoffKind: "decisions"` (the `guided` dial, and the others when an ask is open)

The run stopped because the shaper returned judgment calls. Present them **in the order `judgmentCalls` lists them** (the shaper orders them so that a call whose options turn on another's answer comes after it, and names that call in `dependsOn`), **one at a time**, each in prose first and then as one `AskUserQuestion`:

- the finding (ID, file, line, title) in one line;
- when `dependsOn` is not empty, which earlier answer this one builds on, and what that answer means for these options;
- the story, in plain language: who does what, what happens, why it matters;
- each option with its cost and effect;
- the shaper's recommendation and why.

A call whose `forced` is not null (its `why_human` reads `repository rule <id>`) is a finding the repository's ask rules leave to the person: say which rule and quote its reason (`forced.reason`), and say that Redline makes no change for it whatever the answer: the options are the person's to carry out outside the run (make the change by hand after the run, or accept it as it is), and the answer is recorded and posted in the finding's thread as `left to @<login> under repository rule <id>`.

Then ask one `AskUserQuestion` for the call: the question names the finding (ID and title); the options are the shaper's labels in its order, the recommended one first with "(Recommended)" appended, each description its cost and effect; a call with more than four options shows the recommended one and the next three and says the rest are answered through Other.

**The round's declines.** `declined` lists what the shaper declined on its own in this round, each with its `reason` (empty when it declined nothing). After the last call, list them in prose, one line each (ID, title, reason), and say that a line in the answer form, `<id>: fix. <reason>` or `<id>: defer. <reason>`, overrules one before the relaunch, and that a decline nobody overrules is posted with its reason when the round goes on. This is a list, not a question: ask nothing about it, since the run never stops for a decline. Record an overrule under its ID as `{"choice": "<fix|defer>", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>", "disposition": "<fix|defer>"}`, say it back in one line as any answer, and pass it in `args.decisions` with the answers. A decline of an earlier round is already posted: it is overruled on GitHub, as the `done` section says.

**The answer form.** An answer in the person's own words, or with their own reasoning, is one line, `<id>: <choice>. <reason>`: the choice an option label or their own words, the reason optional. It is accepted in the Other field (where the `<id>:` prefix may be omitted, since the question names the call) or as a typed chat line. A typed line not in the form is a question or pushback: answer it from the spec folder (`<repoRoot>/<specFolder>/shape.md`) and the code, never decide for them, and ask the call again. Nothing else is read as an answer.

**Record each answer** as `{"choice": "<option label or their words>", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>"}` under its ID (the workflow adds `decidedBy: "@<login>"` from `args.login`; you never write an owner). The restatement is **one standalone sentence**: the choice and the person's reasoning, written so a reader who never saw the conversation understands what was decided and why, with no quoted chat, no "I'll take your recommendation", and no Redline role names. When the person gave no reason beyond agreeing, the reason is the recommendation's, stated as theirs ("The author keeps the current default so the list always agrees with the detail page."). Say the restatement back to the person in one line, then move to the next call. `notes` is the decision as it is recorded and published: the spec's Decisions entry, the reply in the finding's thread, and the handoff comment print it and nothing the person typed.

**Relaunch only from the word.** When every call in `decisionsNeeded` has an answer, list the restatements, one line per ID, and say: type `relaunch` to relaunch with these decisions, or a line in the answer form to change one. A form line is recorded again (a new restatement, said back) and the word is asked for again. The relaunch happens in the turn that starts with the word, under this rule:

**The relaunch rule.** `Workflow(...)` is called only when the person's last typed line is exactly `relaunch`, or, on a launch, a resume (section 2) or the in-session relaunch of a stopped run ("stopped before a result"), a line holding only a Redline command (`/redline:redline <n> ...` or a variant, or the short form a repository's `.claude/commands/redline.md` and `redline-revise.md` provide, `/redline <n> ...` and `/redline-revise <n> ...`, which `/redline:setup` writes; #44). The turn that relaunches need not be the person's (a stopped run is seen in the workflow's notification); the line that counts is still the last one they typed. The harness relays the person's last typed message verbatim to every agent of the run, with precedence over the agent's task; an `AskUserQuestion` pick is never relayed, and a headless session relays nothing. PR #59 showed that a typed answer (`Refuse it`) stops an agent whatever its prompt says, so the only lines Redline ever relaunches from are the word and the command line, and every agent's prompt names those two as conversational, with `args.decisions`, `args.selected` and `args.approvedPlans` the only authority (#60). When the last typed line is anything else, do not relaunch: say in one line that the relaunch needs `relaunch` typed on its own, and wait.

**Save the run record** before the relaunch overwrites it: the harness keeps one record per run id, `~/.claude/projects/<project>/<session>/workflows/<runId>.json`, and a relaunch with `resumeFromRunId` rewrites it. Find it with Glob (`~/.claude/projects/*/*/workflows/<runId>.json`) and copy it beside itself, into a `saved/` folder, as `<runId>.launch-<n>.json`, where `n` counts this run's launches so far (1 before the first relaunch): `mkdir -p <dir>/saved && cp <dir>/<runId>.json <dir>/saved/<runId>.launch-<n>.json`. The copy stays outside the repository. If the record cannot be found, say so in one line and relaunch anyway.

**Write the marker** at every stop that waits for the person (a `handoff` of either kind, a `reviewed` result, a run stopped before a result): right after saving the record, run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>`. It reads the run's args and result from the harness record, the session id from its own environment and HEAD from git, and writes them under `runs` in `.claude/redline.local.json`, so a `/redline:redline <n>` typed later, in this session or the reopened one, offers to pick the stop up (section 2, "A stopped run"). If the script exits 2 (no record, no session id), say its line and go on: the relaunch in this session does not need the marker.

**The script a relaunch runs (#81).** A relaunch runs the workflow script the run launched with. Before every relaunch (a hand-off of either kind, a `reviewed` result, a stopped run, a resume), after the marker is written, run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run drift <repoRoot> <n> --plugin ${CLAUDE_PLUGIN_ROOT}` and read its JSON. On every repository but the plugin's own it prints `launch: "name"` with nothing to say: relaunch by name, as below. When this repository is the plugin itself, loaded in place, a round's commits can change `workflows/redline-loop.js` or an agent file, and a relaunch that ran the edited workflow would replay nothing after its first changed prompt and rerun rounds already posted (PR #80). So, by `launch`:

- `name`: the workflow file is as launched. Relaunch by name, as below.
- `scriptPath`: the workflow file changed since launch. Say in one line: "`workflows/redline-loop.js` changed since this run launched, so this relaunch runs the launch's script from `<scriptPath>`. In bypass-permissions, which is how the plugin reviews itself, it is expected to run with no prompt, and in any other mode Claude Code is expected to ask once per relaunch to review the script, where approving it relaunches; neither has been measured yet." Then call `Workflow({scriptPath: "<scriptPath>", args: {...}, resumeFromRunId: "<runId>"})` in place of the call by name, with the same `args` and run id. If the call is denied (a headless session cannot answer the prompt), say so in one line and stop: the marker stays, so the person relaunches from an interactive session (`claude --resume <session id>`, then `/redline:redline <n>`) or starts fresh.
- `refuse` (exit 1): the workflow file changed and the launch kept no pinned copy, since it went by the `scriptPath` fallback of section 6 and ran the file itself. Say `line` verbatim, run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>`, and stop. Do not launch.

When `agents` is not empty, agent files changed since launch. They cannot be pinned (an agent run from a copy has no role, so no guard), and they do not stop the relaunch: say `line` verbatim, the sentence naming them, and go on; the handoff comment carries the same sentence for the list in `drift`, for the teammate. When `drift` is not null, set `args.drift` to it exactly as printed, replacing the one an earlier relaunch set; when it is null, leave `args.drift` out. The workflow reads it only at startup and at Finish. Finish's prompts replay on a resume past them, and the handoff comment is the one that names the agent list, so on an `error` or `stopped` marker `run drift` prints `drift` with the list the marker's own args passed, while `agents` and `line` still name every changed file: a resume after the comment posted then replays it, or its duplicate check finds it, and it is never posted twice (#91, R1-1). Only a hand-off or a `reviewed` relaunch, both before Finish, reads the list afresh. On exit 2 (the plugin's own repository with no marker, or a marker with no start commit), say the script's line and stop: without the marker the launch's script is unknown, so the run is finished with a fresh one.

Then relaunch **in this session**:

```
Workflow({name: "redline:redline-loop", args: {...the same args, decisions: {...every decision so far, unchanged, plus the new ones}}, resumeFromRunId: "<the runId you recorded>"})
```

Change nothing else in `args` (a plan hand-off adds `approvedPlans`, a `reviewed` result adds `selected`, and a resume adds `resume`, as their sections say; all three are kept, unchanged, on every later relaunch; `drift` is set or left out afresh at each relaunch, as "The script a relaunch runs" says): the cached agents (review, post, shape) replay only while every earlier prompt and option is identical, and a changed earlier decision would rerun a round that already committed. Record the new `runId`. Never relaunch from a session other than the one that launched the run: the harness has nothing to resume there. The marker (section 2, "A stopped run") and `claude --resume <session id>` are the way back when this session is gone; a fresh `/redline:redline` after the person commits or removes the uncommitted spec folder is the other path (the GitHub agent will not post a second review for a round that already has one).

### `done`

Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` first: the run finished, so no marker waits. Then report in a few lines: rounds, commits, and the decisions (`decided`, one entry per item with its `kind`), grouped so the person does not have to open GitHub to learn what Redline decided alone: first what it fixed (`kind` `fixed`), one line each with the ID, the title and the commit; then what it declined on its own (`kind` `declined`), one line each with the ID, the title and the `reason`, followed by one line on how to overrule one: reply in its thread on the pull request (for one in the review body, which has no thread, a pull request review whose body names its id), then `/redline-revise <pr> review @<login>` (the namespaced `/redline:redline-revise` where the repository has no alias). After those, in a line each: what was put to the person (`kind` `decided`, `overruled` false; how many by `@<login>`, how many by `redline (autopilot)`), what the person overruled (`overruled` true), and what was deferred, not picked or not changed. Then the findings left to the person under a repository ask rule (`forced`: each with its rule id; their threads stay open), whether the PR description was replaced (`prBody.file`, and the old body's `copy` in the round's `redline/` folder, or that no round wrote a `pr-body.md`), whether the handoff comment was posted and the review requested (or, in a dry run, where `handoff.md` was written), the threads (`threads`: how many Redline resolved and, for each left open, the finding and why; `null` when nothing was swept, as in a dry run or with `no push`), any `warnings`, and the run-record commit (`recordCommit`: its short SHA, how many files, whether it was pushed, or that nothing was left to commit). Then run `git status --porcelain`: a finished run leaves a clean tree, so name anything it prints. Then walk the `deferred` list **one item at a time**, in prose: the finding, the mitigation that shipped, the full fix left open, and three choices. An item with `rule` was left to the person on autopilot under that repository ask rule: no mitigation shipped, `fullFix` is what Redline would have done, and the choices are to open an issue, to make the change by hand, or to accept it; the "Decline" choice below does not apply, since no code comment names it. For the rest:

- **Open an issue**: write the body to the session's scratchpad directory (the one the harness names; `/tmp/redline/` when none is named) as `redline-issue-<pr>-<id>.md` (PR, finding ID, story, the mitigation shipped, the full fix proposed; no AI attribution) and run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh issue-create "<title>" <that path>`. In a dry run, write the file only and name the path. Never under the repository: nothing a person or this skill adds belongs in a round's record folder, which the record commit and the resume's untracked-path check read as the run's.
- **Decline**: update the code comment that names the finding so a later reviewer does not re-find it (say it was declined and why, in the person's words). Leave the change uncommitted; outside a Redline run the person commits.
- **Reopen as a judgment call**: present it as in a hand-off and record the decision; the follow-up is a new `/redline:redline` run or a hand-made change, the person's call.

### `capped`

Run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` first. The round cap was hit with correctness bugs open: the cap-hit comment was posted (or written), the run record was committed (`recordCommit`), and no review was requested. List `openFindings` one line each and stop. The person picks them up by hand or with another `/redline:redline`.

### `error`

Report `stage`, `error` and anything useful in `detail` (blocked tasks, the approver's adjustments, the checker's reasons), plus the commits made so far and `git status`. Then, when `resumeFrom` is not null (the agent label the run reruns from, and the attempt the relaunch would be): save the run record and write the marker (`${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run save <repoRoot> <n> --run-id <runId>`), and say in one line that once the cause is fixed by hand, `/redline:redline <n>` offers to resume from `<label>`, from this session or `claude --resume <session id>`; a hand fix that touches only `.claude/` files may be committed on top, anything else means a fresh run. When `resumeFrom` is null (a `gather` error, or no agent behind the stop, a relaunch the workflow refused at stage `relaunch`, or a stop at stage `finish` because the run was finishing from a round below the highest one posted, #81), first run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` (an earlier stop of the same run may have left a marker that no longer describes it), then say the run cannot be resumed and name the uncommitted spec folders to commit or remove before a fresh launch. Do not retry and do not fix anything yourself.

## Rules

- Nothing here posts to GitHub except through the workflow's GitHub agent, and the deferred-issue triage above when the person picks it.
- Never write a model name, vendor name or AI-assistant marker into anything that reaches the repository or GitHub. Redline labels its work as Redline.
- Outside the workflow, the repo's CLAUDE.md Git section stands: you never commit, push or stage.
- The run marker is written, read and cleared only through `redline-prefs.sh run`; on a resume, `args` come from the marker, never from memory.
- Relaunch only from `relaunch` typed on its own or a line holding only a Redline command, namespaced or the short alias (section 7, the relaunch rule); never from any other typed line.

## Variants

- `/redline:redline-review <pr> [...]` is `/redline:redline <pr> review only [...]` (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-review/SKILL.md`).
- `/redline:redline-revise <pr> [...]` runs one revise pass over a review already on file, or, with `review <id|@login|latest>`, over a teammate's review comments (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-revise/SKILL.md`).
