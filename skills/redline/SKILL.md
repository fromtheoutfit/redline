---
name: redline
description: "Redline review/revise loop on a pull request: /redline:redline <pr> [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run] [review only]. Reviews the PR, posts one Redline review per round, shapes and implements the fixes through Agent OS, checks, pushes, replies and re-reviews until no correctness bugs remain, then hands the PR to the teammate. Use only when the person types /redline:redline (or /redline:redline-review, /redline:redline-revise, which follow this file). Never start a run on your own initiative."
argument-hint: "<pr> [max N rounds] [revise fable|opus] [reviewer @handle] [no push] [dry run] [review only]"
---

# /redline:redline

You are the only part of Redline that can talk to the person. You parse what they typed, check the checkout, write the start snapshot, launch the plugin's `redline:redline-loop` workflow, and handle what it returns: a hand-off (judgment calls to decide), a finished run (deferred items to triage), a capped run, or an error. The workflow, the agents and the scripts do everything else; see `${CLAUDE_PLUGIN_ROOT}/README.md`.

Arguments: `$ARGUMENTS`

## 1. Resolve the repository

Run `git rev-parse --show-toplevel`. That absolute path is `repoRoot`; every path below is absolute from it. Read `<repoRoot>/.claude/redline.json` (the per-repo config). If it does not exist, stop with one line: this repository is not set up for Redline yet (see "Set up a repository" in `${CLAUDE_PLUGIN_ROOT}/README.md`).

The plugin's root is `${CLAUDE_PLUGIN_ROOT}`: its scripts, workflow and README are there. Everything per repository (`checks.sh`, `redline.json`, the spec folders) is under `repoRoot`.

## 2. Parse the arguments

The grammar, in any order, case-insensitive:

| Typed | Meaning | Default (from `redline.json`, then built in) |
| --- | --- | --- |
| `<n>` or `#<n>` | PR number. **Required.** | none: stop with "Usage: /redline:redline <pr> [...]" |
| `max <N> rounds`, `max <N> round`, `max <N>` | `maxRounds = N` (revise rounds allowed while correctness bugs remain) | `maxRounds`, else 3 |
| `revise fable`, `revise opus` | `models.revise.model`: `claude-fable-5-1` or `claude-opus-5-5` | ask (step 3) |
| `reviewer @handle` | `reviewer = handle` (the `@` is dropped) | `reviewer` |
| `no push` | `push = false` (commit locally only) | `push`, else true |
| `dry run` | `postToGitHub = false` and `push = false`: every body is written under the spec folder's `redline/`, nothing reaches GitHub | `postToGitHub = true` |
| `review only` | `reviewOnly = true`: stop after the round 1 review is posted (or written, in a dry run) | false |

A word that fits none of these stops the launch with one line naming it. Do not guess.

## 3. Ask the revise model (only if needed)

If `revise fable|opus` was not typed and the run is not `review only`, ask one question with `AskUserQuestion`: "Which model should revise this PR (shape, resolve, implement)?" with the options **Opus 5.5** (`claude-opus-5-5`; never spends Fable budget by accident) and **Fable** (`claude-fable-5-1`; the better result when the budget allows). The pick holds for every round of the run and every relaunch.

A `review only` run never starts a revise agent, so skip the question and set `models.revise.model` to `claude-opus-5-5` as a placeholder.

## 4. Precheck (fresh launches only)

Skip this on a relaunch after a hand-off: the round's spec folder is uncommitted in the tree by design.

1. `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh pr <n>`: the PR must be `OPEN`, except in a `dry run`, which posts and pushes nothing and so may read a closed PR (a seed for a recall test). Keep `headRefName`, `headRefOid`, `baseRefName`, `title`.
2. `git rev-parse --abbrev-ref HEAD` must equal `headRefName`.
3. `git status --porcelain` must print nothing.
4. `git rev-parse HEAD` must equal `headRefOid`.

Run the git commands plainly, from the session's working directory, which step 1 established is inside the checkout: the shared allow rules are `Bash(git status:*)` and `Bash(git rev-parse:*)`, and a `git -C <path> ...` spelling matches neither, so it asks the person before running.
5. When `reviewer` is set: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh login` must not equal it (GitHub ignores a review request to the PR's own author).

Any failure stops the launch with one line saying which check failed and what to do (`check out <branch>`, `commit or stash your changes`, `pull or push so HEAD matches the PR`, `pick another reviewer`). Never fix the checkout yourself.

## 5. Write the start snapshot and assemble `args`

1. `launchedAt`: run `date +%Y-%m-%dT%H:%M:%S%z` once and keep the output (for example `2026-10-18T09:30:00-0400`). The workflow derives the spec-folder timestamp `YYYY-MM-DD-HHMM` from it, so the same value must be reused on every relaunch.
2. `files`: `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh files <n>` (a JSON array).
3. `issue`: the issue number in the head branch (`feature/42-...` gives 42), else the `(#N)` in the PR title, else the PR number.
4. Write the start snapshot with the Write tool to `<repoRoot>/agent-os/specs/<YYYY-MM-DD-HHMM>-<n>-review-round-1/redline/snapshot-start.json`:

   ```json
   {"pr": 43, "start_sha": "<headRefOid>", "base_ref": "<baseRefName>", "files": ["..."], "plan_paths": []}
   ```

   It sits under `agent-os/specs/`, which every `checks.sh` allowed list includes, and it is committed with round 1's spec folder as the run's record.
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
     "launchedAt": "2026-10-18T09:30:00-0400",
     "snapshotPath": "/abs/path/agent-os/specs/2026-10-18-0930-43-review-round-1/redline/snapshot-start.json",
     "maxRounds": 3,
     "maxPlanAdjustments": 2,
     "reviewer": "handle",
     "checker": "full",
     "checkerStallMs": 300000,
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

   `pluginRoot` is the plugin's root exactly as written above; the workflow script has no environment of its own and finds `redline-gh.sh` and the README through it. The `models` entries other than `revise` come from `redline.json` verbatim; `models.revise.effort` too, when `redline.json` sets one.

## 6. Launch

Call `Workflow({name: "redline:redline-loop", args})`. If the name is not found (a session started before the plugin was installed or updated does not list its workflow), call `Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/redline-loop.js", args})` instead. **Record the `runId`** from the result; a relaunch needs it. Keep `args` exactly as sent. In a headless session (`claude -p`) the harness stops background tasks ten minutes after the session's last turn, which kills a run mid-phase: such a session is started with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` so it waits for the workflow (step 7).

Tell the person in one or two lines that the run has started, what it will do (review only, dry run, rounds, revise model, reviewer), and that they can watch it in `/workflows`. Then wait for the workflow's completion notification; never predict its result.

## 7. Handle the result

The workflow returns `{status, rounds, judgmentCalls, deferred, openFindings, decided, commits, specFolders, warnings, ...}`.

### `review-only`

Summarise the round 1 review in a few lines: how many findings by category, the correctness ones by title, and where the review sits (`reviewFile`; in a dry run, say plainly that nothing was posted). Stop.

### stopped before a result

The workflow was stopped without returning (the harness's background-task ceiling in a headless session, or the person stopping it). Nothing was decided. Save the run record (see "Save the run record" below), then relaunch **in this session** with the same `args`, no new `decisions`, and `resumeFromRunId` set to the recorded `runId`: the agents that finished replay from cache, the interrupted one reruns (a shaper completes the folder it started), and the run id is kept. Then handle the new result as below. If the session is gone, say so, as in the `handoff` case.

### `handoff`

The run stopped because the shaper returned judgment calls. Present them **in the order `judgmentCalls` lists them** (the shaper orders them so that a call whose options turn on another's answer comes after it, and names that call in `dependsOn`), **one at a time, conversationally, in prose**, never as an `AskUserQuestion` list:

- the finding (ID, file, line, title) in one line;
- when `dependsOn` is not empty, which earlier answer this one builds on, and what that answer means for these options;
- the story, in plain language: who does what, what happens, why it matters;
- each option with its cost and effect;
- the shaper's recommendation and why.

Then wait for the person. They may pick an option, answer in their own words, or push back and ask questions; answer from the spec folder (`<repoRoot>/<specFolder>/shape.md`) and the code, and never decide for them.

**Record each answer** as `{"choice": "<option label or their words>", "notes": "<the restatement>", "date": "<YYYY-MM-DD today>"}` under its ID. The restatement is **one standalone sentence**: the choice and the person's reasoning, written so a reader who never saw the conversation understands what was decided and why, with no quoted chat, no "I'll take your recommendation", and no Redline role names. When the person gave no reason beyond agreeing, the reason is the recommendation's, stated as theirs ("The author keeps the current default so the list always agrees with the detail page."). Say the restatement back to the person in one line, then move to the next call. `notes` is the decision as it is recorded and published: the spec's Decisions entry, the reply in the finding's thread, and the handoff comment print it and nothing the person typed.

**Confirm before relaunching.** When every call in `decisionsNeeded` has an answer, list the restatements, one line per ID, then ask one `AskUserQuestion`: "Relaunch with these decisions?" with the options **Relaunch with these decisions** (first) and **Let me change one**. On "Let me change one", ask in prose which one and what changes, record it again (a new restatement, said back), and confirm again. Relaunch only on "Relaunch with these decisions". Every agent's prompt says that whatever line of the conversation the harness relays to it is conversational and `args.decisions` is the only authority, so the pick is the safe last message, not a new instruction.

**Save the run record** before the relaunch overwrites it: the harness keeps one record per run id, `~/.claude/projects/<project>/<session>/workflows/<runId>.json`, and a relaunch with `resumeFromRunId` rewrites it. Find it with Glob (`~/.claude/projects/*/*/workflows/<runId>.json`) and copy it beside itself, into a `saved/` folder, as `<runId>.launch-<n>.json`, where `n` counts this run's launches so far (1 before the first relaunch): `mkdir -p <dir>/saved && cp <dir>/<runId>.json <dir>/saved/<runId>.launch-<n>.json`. The copy stays outside the repository. If the record cannot be found, say so in one line and relaunch anyway.

Then relaunch **in this session**:

```
Workflow({name: "redline:redline-loop", args: {...the same args, decisions: {...every decision so far, unchanged, plus the new ones}}, resumeFromRunId: "<the runId you recorded>"})
```

Change nothing else in `args`: the cached agents (review, post, shape) replay only while every earlier prompt and option is identical, and a changed earlier decision would rerun a round that already committed. Record the new `runId`. If the session that started the run is gone, do not relaunch with half the state: say so, and suggest a fresh `/redline:redline` after the person commits or removes the uncommitted spec folder (the GitHub agent will not post a second review for a round that already has one).

### `done`

Report in a few lines: rounds, commits, whether the PR description was replaced (`prBody.file`, and the old body's `copy` in the round's `redline/` folder, or that no round wrote a `pr-body.md`), whether the handoff comment was posted and the review requested (or, in a dry run, where `handoff.md` was written), any `warnings`, and any Redline files left uncommitted (`git status --porcelain`; the reply and handoff files are written after the round's last commit). Then walk the `deferred` list **one item at a time**, in prose: the finding, the mitigation that shipped, the full fix left open, and three choices:

- **Open an issue**: write the body to `<repoRoot>/<specFolder>/redline/issue-<id>.md` (PR, finding ID, story, the mitigation shipped, the full fix proposed; no AI attribution) and run `${CLAUDE_PLUGIN_ROOT}/scripts/redline-gh.sh issue-create "<title>" <file>`. In a dry run, write the file only.
- **Decline**: update the code comment that names the finding so a later reviewer does not re-find it (say it was declined and why, in the person's words). Leave the change uncommitted; outside a Redline run the person commits.
- **Reopen as a judgment call**: present it as in a hand-off and record the decision; the follow-up is a new `/redline:redline` run or a hand-made change, the person's call.

### `capped`

The round cap was hit with correctness bugs open: the cap-hit comment was posted (or written), and no review was requested. List `openFindings` one line each and stop. The person picks them up by hand or with another `/redline:redline`.

### `error`

Report `stage`, `error` and anything useful in `detail` (blocked tasks, the approver's adjustments, the checker's reasons), plus the commits made so far and `git status`. Do not retry and do not fix anything yourself.

## Rules

- Nothing here posts to GitHub except through the workflow's GitHub agent, and the deferred-issue triage above when the person picks it.
- Never write a model name, vendor name or AI-assistant marker into anything that reaches the repository or GitHub. Redline labels its work as Redline.
- Outside the workflow, the repo's CLAUDE.md Git section stands: you never commit, push or stage.

## Variants

- `/redline:redline-review <pr> [...]` is `/redline:redline <pr> review only [...]` (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-review/SKILL.md`).
- `/redline:redline-revise <pr> [...]` runs one revise pass over a review already on file (see `${CLAUDE_PLUGIN_ROOT}/skills/redline-revise/SKILL.md`).
