---
name: redline
description: "Redline review/revise loop on a pull request: /redline:redline <pr> [autopilot|guided|plan|review|review only] [correctness only] [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run]. Reviews the PR, posts one Redline review per round, shapes and implements the fixes through Agent OS, checks, pushes, replies and re-reviews until no correctness bugs remain, then hands the PR to the teammate. The interrupt dial says where it stops for the person; .claude/redline.local.json remembers the settings. Use only when the person types /redline:redline (or /redline:redline-review, /redline:redline-revise, which follow this file). Never start a run on your own initiative."
argument-hint: "<pr> [autopilot|guided|plan|review|review only] [correctness only] [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run]"
---

# /redline:redline

You are the only part of Redline that can talk to the person. You parse what they typed, settle the run's settings (asked once, then remembered in `.claude/redline.local.json`), check the checkout, write the start snapshot, launch the plugin's `redline:redline-loop` workflow, and handle what it returns: a hand-off (judgment calls to decide, or a plan to approve), a posted review to pick findings from, a finished run (deferred items to triage), a capped run, or an error. The workflow, the agents and the scripts do everything else; see `${CLAUDE_PLUGIN_ROOT}/README.md`.

Arguments: `$ARGUMENTS`

## 1. Resolve the repository

Run `git rev-parse --show-toplevel`. That absolute path is `repoRoot`; every path below is absolute from it. Read `<repoRoot>/.claude/redline.json` (the per-repo config). If it does not exist, stop with one line: this repository is not set up for Redline yet (see "Set up a repository" in `${CLAUDE_PLUGIN_ROOT}/README.md`).

The plugin's root is `${CLAUDE_PLUGIN_ROOT}`: its scripts, workflow and README are there. Everything per repository (`checks.sh`, `redline.json`, the spec folders) is under `repoRoot`.

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

A word that fits none of these stops the launch with one line naming it. Do not guess.

**The interrupt dial.** Five levels, each a stopping point the loop already has:

- `autopilot`: never asks. At a judgment call the shaper's recommendation becomes the decision and the run goes on; each such decision is attributed `redline (autopilot)` in the spec, the thread and the handoff comment.
- `guided` (the default): the run ends only when the shaper returns a judgment call (`ask`); you present the calls, record the answers and relaunch.
- `plan`: after shaping, every round, the run ends with the full disposition list; you present it, the person approves it as-is or changes a disposition or answers an ask, and you relaunch.
- `review`: the run ends after the first round's review is posted; you present the findings, the person picks which to act on (and drops the rest, each with a reason), and you relaunch. Later rounds behave as `guided`.
- `review only`: stop after the first round's review; nothing is revised.

## 3. Settle the settings (fresh launches only)

Skip this on a relaunch after a hand-off or a `reviewed` result: the settings were settled at the first launch and `args` is reused byte for byte. The only question on a relaunch is the confirm in step 7.

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

1. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>` must exit 0: the gate stamp in `<repoRoot>/.claude/redline/checks.sh` still matches the repository's Verification Gate (see "Gate stamp" in the README). On exit 1, stop the launch with the script's one stderr line, verbatim: the gate has changed since `checks.sh` was stamped, or `checks.sh` carries no stamp. On exit 2, stop as section 1 does: this repository is not set up for Redline yet.
   Then `${CLAUDE_PLUGIN_ROOT}/scripts/redline-setup.sh version <repoRoot>/.claude/redline/checks.sh`: on exit 1, say its one stderr line (`checks.sh` was made from an older template, or carries no version line: run `/redline:setup` to port it; or from a newer one than this plugin ships: update the plugin) and go on. A warning, never a stop.
2. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh pr <n>`: the PR must be `OPEN`, except in a `dry run`, which posts and pushes nothing and so may read a closed PR (a seed for a recall test). Keep `headRefName`, `headRefOid`, `baseRefName`, `title`.
3. `git rev-parse --abbrev-ref HEAD` must equal `headRefName`.
4. `git status --porcelain` must print nothing.
5. `git rev-parse HEAD` must equal `headRefOid`.

Run the git commands plainly, from the session's working directory, which section 1 established is inside the checkout: the shared allow rules are `Bash(git status:*)` and `Bash(git rev-parse:*)`, and a `git -C <path> ...` spelling matches neither, so it asks the person before running.
6. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh login` prints the login Redline posts as: keep it as `login` (every decision the person makes is attributed `@<login>`). When `reviewer` is set, it must not equal `reviewer` (GitHub ignores a review request to the PR's own author).
7. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh files <n>` prints every changed path as a JSON array (every page of GitHub's files endpoint, where `gh pr view` stops at 100); keep it as `files` for the snapshot in section 5. On exit 2, stop with its one stderr line verbatim (a `gh` older than 2.48.0 does not know `--slurp`). Say the count in one line, `<N> files on GitHub`. Cross-check it against `git diff --shortstat origin/<baseRefName>...HEAD`, run plainly: its one line starts with the local count (`336 files changed`, `1 file changed`; no output means 0), with the same rename handling as GitHub's list, so read the number, never count paths: when the counts differ, warn in one line naming both (`GitHub lists 336 files, the local diff against origin/main 333; the snapshot uses GitHub's list`); when git fails (`origin/<baseRefName>` not fetched), warn and go on. Above 300 files, warn: `over 300 files: GitHub's whole-PR diff is unavailable, so Redline reads per-file patches; a finding in a file whose patch GitHub omits (binary, or too large) goes in the review body behind a marker`. When `redline.json` sets `maxFiles` and the count exceeds it, stop: `<N> files is over maxFiles (<M>) in .claude/redline.json; split the PR`.
8. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh last-round <n>` prints the highest Redline round already posted on the PR, `0` when none (exit 2 stops the launch with its line). `firstRound` is that number plus one: a PR that already carries rounds 1 and 2 from an earlier run gets round 3 from this one, so every finding of this run gets its own review and threads, and nothing is skipped as already posted (#10). Say it in one line when it is not 1: `rounds 1 to 2 are already posted; this run starts at round 3`.
9. When `firstRound` is not 1: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh prior-findings <n>` prints every finding those rounds posted with its disposition, read from the Redline reply in its thread (exit 2 stops the launch with its line); keep the JSON array as `priorFindings`. A finding with no reply, or a `not changed` one, has no disposition and is carried into this run's first round, where the reviewer re-verifies it; the rest are tracked and never re-raised (#35). Say it in one line: `3 earlier findings have no disposition and are carried into round 3: R1-2, R1-5, R2-1`, or `every earlier finding has a disposition`. When `firstRound` is 1, `priorFindings` is `[]` and nothing runs.

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
       "reviewerLaterRounds": {"model": "claude-opus-5-5", "effort": "high"},
       "planApprover": {"model": "claude-opus-5-5", "effort": "high"},
       "standardsApprover": {"model": "claude-sonnet-5-5"},
       "checker": {"model": "claude-haiku-5-5"},
       "github": {"model": "claude-haiku-5-5"}
     }
   }
   ```

   `pluginRoot` is the plugin's root exactly as written above; the workflow script has no environment of its own and finds `redline-gh.sh` and the README through it. `firstRound` is precheck step 8's value: the workflow numbers its rounds from it and never asks GitHub, so a relaunch replays. `priorFindings` is step 9's array, exactly as printed (`[]` at round 1): the workflow carries the undispositioned ones into its first round and never reads the threads itself, since its own replies change them. `interrupt`, `scope`, `maxRounds` and `models.revise.model` are the effective settings from step 3 (`interrupt` is the command-line word, `review only` included; `reviewOnly` is true exactly then). The `models` entries other than `revise` come from `redline.json` verbatim; `models.revise.effort` too, when `redline.json` sets one. `baselineSeconds` is `baseline.seconds` from `<repoRoot>/.claude/redline/checks.json` (read it with the Read tool), or `null` when the file, the `baseline` or its `seconds` is absent: over 480, or null, the workflow has the checker and the implementer run the gate in the background, since it will not fit in one foreground Bash call (#40). On a relaunch, `decisions`, `approvedPlans` and `selected` are added as step 7 says, and nothing else changes.

## 6. Launch

Call `Workflow({name: "redline:redline-loop", args})`. If the name is not found (a session started before the plugin was installed or updated does not list its workflow), call `Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/redline-loop.js", args})` instead. **Record the `runId`** from the result; a relaunch needs it. Keep `args` exactly as sent. In a headless session (`claude -p`) the harness stops background tasks ten minutes after the session's last turn, which kills a run mid-phase: such a session is started with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` so it waits for the workflow (step 7).

Tell the person in one or two lines that the run has started, what it will do (the dial, the scope, dry run, rounds, revise model, reviewer), and that they can watch it in `/workflows`. Then wait for the workflow's completion notification; never predict its result.

## 7. Handle the result

The workflow returns `{status, rounds, judgmentCalls, deferred, openFindings, decided, commits, specFolders, warnings, ...}`. Every decision in `decided`, in the spec folder's `shape.md`, in each finding's thread and in the handoff comment names its owner: `decided by: redline` (the shaper settled it from the evidence), `decided by: @<login>` (the person, at a hand-off, with the restated reasoning), or `decided by: redline (autopilot)`.

### `review-only`

Summarise the first round's review (round `firstRound`) in a few lines: how many findings by category, the correctness ones by title (a finding with `carriedFrom` as "first reported as <that id>"), and where the review sits (`reviewFile`; in a dry run, say plainly that nothing was posted). Say in one line that a later `/redline:redline <pr>` carries these findings into its first round, so no separate revise launch is needed. Stop.

### stopped before a result

The workflow was stopped without returning (the harness's background-task ceiling in a headless session, or the person stopping it). Nothing was decided. Save the run record (see "Save the run record" below), then relaunch **in this session** with the same `args`, no new `decisions`, and `resumeFromRunId` set to the recorded `runId`: the agents that finished replay from cache, the interrupted one reruns (a shaper completes the folder it started), and the run id is kept. Then handle the new result as below. If the session is gone, say so, as in the `handoff` case.

### `handoff` with `handoffKind: "plan"` (the `plan` dial)

The run stopped after shaping round `handoffRound`, as the dial asks, with the round's whole disposition list in `plan`: one entry per finding with `finding` (ID, file, line, title, category), `disposition` (`fix`, `defer` or `ask`), `recommendation` (one sentence: the change planned, the mitigation chosen, or the option recommended) and `decidedBy` (`redline` for a fix or defer; empty for an ask, which is still pending). `deferredPlanned` holds the mitigation and the full fix of each defer; `judgmentCalls` the asks, each with its story, options and recommendation, in answering order.

Present the list, one line per finding (ID, title, disposition, recommendation), then the asks as in the `decisions` hand-off below, one at a time, in prose. The person may:

- **approve as-is**: nothing to record beyond the asks' answers;
- **change a disposition** of a fix or defer finding to `fix`, `defer` or `accept` (no change, with a reason): record it under its ID as `{"choice": "<fix|defer|accept>", "notes": "<the restatement>", "date": "<today>", "disposition": "<fix|defer|accept>"}`. The restatement rule below applies; for a `defer` it names the mitigation the person wants; for an `accept` the reason the behaviour stands;
- **answer an ask**: record it as in the `decisions` hand-off below.

Every ask must be answered before the relaunch (an approved round whose ask is still open stops again as a `decisions` hand-off). When everything is answered, confirm as below ("Relaunch with these decisions?", listing the approvals and changes one line each), save the run record, and relaunch with `args.approvedPlans` set to `approveWith.approvedPlans` from the result (every pass approved so far, this one added: a Redline round by its number, a human review pass as `h<n>`; pass the list exactly as given) and `args.decisions` holding every decision so far plus the new ones. The plan dial stops again after the next round's shaping; repeat.

### `reviewed` (the `review` dial)

The run stopped after posting the first round's review (`reviewedRound`; `reviewFile`, in a dry run written only). `findings` holds every open finding in full (ID, file, line, category, severity, confidence, title, description, proposed fix, needsDecision, and `carriedFrom`, the earlier round's id it carries forward, or empty); `known` the ones already tracked, which need nothing.

Summarise the review as in `review-only`, then present the findings one at a time, in prose (a carried one as "first reported as <id>"), and let the person pick which to act on. Every finding not picked is dropped **with a reason**, one standalone sentence in the restatement style below (it is posted in the finding's thread and listed in the handoff comment as `decided by: @<login>`); say it back in one line. A finding the person does not mention is dropped with "Not selected for this run." Then confirm with one `AskUserQuestion`, "Relaunch with this selection?" (**Relaunch with this selection** first, **Let me change one** second), save the run record, and relaunch with `args.selected` set to `{"act": ["R1-1", ...], "dropped": {"R1-2": "<reason>", ...}}`. The loop shapes only the selected findings; later rounds hand off their judgment calls as `guided` does.

### `handoff` with `handoffKind: "decisions"` (the `guided` dial, and the others when an ask is open)

The run stopped because the shaper returned judgment calls. Present them **in the order `judgmentCalls` lists them** (the shaper orders them so that a call whose options turn on another's answer comes after it, and names that call in `dependsOn`), **one at a time, conversationally, in prose**, never as an `AskUserQuestion` list:

- the finding (ID, file, line, title) in one line;
- when `dependsOn` is not empty, which earlier answer this one builds on, and what that answer means for these options;
- the story, in plain language: who does what, what happens, why it matters;
- each option with its cost and effect;
- the shaper's recommendation and why.

Then wait for the person. They may pick an option, answer in their own words, or push back and ask questions; answer from the spec folder (`<repoRoot>/<specFolder>/shape.md`) and the code, and never decide for them.

**Record each answer** as `{"choice": "<option label or their words>", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>"}` under its ID (the workflow adds `decidedBy: "@<login>"` from `args.login`; you never write an owner). The restatement is **one standalone sentence**: the choice and the person's reasoning, written so a reader who never saw the conversation understands what was decided and why, with no quoted chat, no "I'll take your recommendation", and no Redline role names. When the person gave no reason beyond agreeing, the reason is the recommendation's, stated as theirs ("The author keeps the current default so the list always agrees with the detail page."). Say the restatement back to the person in one line, then move to the next call. `notes` is the decision as it is recorded and published: the spec's Decisions entry, the reply in the finding's thread, and the handoff comment print it and nothing the person typed.

**Confirm before relaunching.** When every call in `decisionsNeeded` has an answer, list the restatements, one line per ID, then ask one `AskUserQuestion`: "Relaunch with these decisions?" with the options **Relaunch with these decisions** (first) and **Let me change one**. On "Let me change one", ask in prose which one and what changes, record it again (a new restatement, said back), and confirm again. Relaunch only on "Relaunch with these decisions". Every agent's prompt says that whatever line of the conversation the harness relays to it is conversational and `args.decisions` is the only authority, so the pick is the safe last message, not a new instruction.

**Save the run record** before the relaunch overwrites it: the harness keeps one record per run id, `~/.claude/projects/<project>/<session>/workflows/<runId>.json`, and a relaunch with `resumeFromRunId` rewrites it. Find it with Glob (`~/.claude/projects/*/*/workflows/<runId>.json`) and copy it beside itself, into a `saved/` folder, as `<runId>.launch-<n>.json`, where `n` counts this run's launches so far (1 before the first relaunch): `mkdir -p <dir>/saved && cp <dir>/<runId>.json <dir>/saved/<runId>.launch-<n>.json`. The copy stays outside the repository. If the record cannot be found, say so in one line and relaunch anyway.

Then relaunch **in this session**:

```
Workflow({name: "redline:redline-loop", args: {...the same args, decisions: {...every decision so far, unchanged, plus the new ones}}, resumeFromRunId: "<the runId you recorded>"})
```

Change nothing else in `args` (a plan hand-off adds `approvedPlans`, a `reviewed` result adds `selected`, as their sections say; both are kept, unchanged, on every later relaunch): the cached agents (review, post, shape) replay only while every earlier prompt and option is identical, and a changed earlier decision would rerun a round that already committed. Record the new `runId`. If the session that started the run is gone, do not relaunch with half the state: say so, and suggest a fresh `/redline:redline` after the person commits or removes the uncommitted spec folder (the GitHub agent will not post a second review for a round that already has one).

### `done`

Report in a few lines: rounds, commits, the decisions by owner (`decided`: how many by `redline`, by `@<login>`, by `redline (autopilot)`), whether the PR description was replaced (`prBody.file`, and the old body's `copy` in the round's `redline/` folder, or that no round wrote a `pr-body.md`), whether the handoff comment was posted and the review requested (or, in a dry run, where `handoff.md` was written), the threads (`threads`: how many Redline resolved and, for each left open, the finding and why; `null` when nothing was swept, as in a dry run or with `no push`), any `warnings`, and the run-record commit (`recordCommit`: its short SHA, how many files, whether it was pushed, or that nothing was left to commit). Then run `git status --porcelain`: a finished run leaves a clean tree, so name anything it prints. Then walk the `deferred` list **one item at a time**, in prose: the finding, the mitigation that shipped, the full fix left open, and three choices:

- **Open an issue**: write the body to `<repoRoot>/<specFolder>/redline/issue-<id>.md` (PR, finding ID, story, the mitigation shipped, the full fix proposed; no AI attribution) and run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh issue-create "<title>" <file>`. In a dry run, write the file only.
- **Decline**: update the code comment that names the finding so a later reviewer does not re-find it (say it was declined and why, in the person's words). Leave the change uncommitted; outside a Redline run the person commits.
- **Reopen as a judgment call**: present it as in a hand-off and record the decision; the follow-up is a new `/redline:redline` run or a hand-made change, the person's call.

### `capped`

The round cap was hit with correctness bugs open: the cap-hit comment was posted (or written), the run record was committed (`recordCommit`), and no review was requested. List `openFindings` one line each and stop. The person picks them up by hand or with another `/redline:redline`.

### `error`

Report `stage`, `error` and anything useful in `detail` (blocked tasks, the approver's adjustments, the checker's reasons), plus the commits made so far and `git status`. Do not retry and do not fix anything yourself.

## Rules

- Nothing here posts to GitHub except through the workflow's GitHub agent, and the deferred-issue triage above when the person picks it.
- Never write a model name, vendor name or AI-assistant marker into anything that reaches the repository or GitHub. Redline labels its work as Redline.
- Outside the workflow, the repo's CLAUDE.md Git section stands: you never commit, push or stage.

## Variants

- `/redline:redline-review <pr> [...]` is `/redline:redline <pr> review only [...]` (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-review/SKILL.md`).
- `/redline:redline-revise <pr> [...]` runs one revise pass over a review already on file, or, with `review <id|@login|latest>`, over a teammate's review comments (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-revise/SKILL.md`).
