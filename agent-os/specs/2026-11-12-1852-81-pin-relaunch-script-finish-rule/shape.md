# Issue #81: pin the relaunch script, the Finish rule — Shaping Notes

## Scope

Issue #81 is the whole brief. When Redline reviews its own repository from the checkout, a round that commits a change to `workflows/redline-loop.js` changes the script the next relaunch loads; replay matches prompts byte for byte, so every step after the first changed prompt reruns, and on PR #80 a re-run round 1 ended the run with a false handoff.

Built here:

- A relaunch runs the script the first launch ran: by name while the live workflow file is unchanged, by `scriptPath` to the harness's persisted copy once it differs.
- A changed agent file is reported, in the skill's line and in the handoff comment; the run goes on.
- Finish opens with a read of the highest posted round, and a run finishing from a lower round stops before anything is posted.
- Version 0.2.4.

Not built: the issue's "Also" (an addendum review), see Decisions.

## Decisions

Made by the author before shaping, not reopened:

- Probe before designing; report; then ask which fix to build.
- Prefer pinning if the workflow and the agents can both be pinned with every role under the guard; a mix is allowed when only the workflow can be.
- A run can never finish from a re-run earlier round.
- Nothing changes for a repository that is not the plugin's own; round prompts stay byte-identical, `coverage off` ones included.
- `scripts/redline-guard.sh` and `hooks/hooks.json` do not change without asking. They do not change here.
- Patch bump to 0.2.4. The author makes every commit.

Made during shaping:

1. **Fix: pin the workflow, warn on an agent change.** The probes showed the workflow can be pinned and agent files cannot (an agent run from a copied file has no role to the guard). A changed agent file does not stop the relaunch. Riders: the warning names the changed agent files and says that this run's remaining rounds may run under them while the workflow's own prompts are the launch's; the same sentence goes into the handoff comment, so the teammate knows the later rounds ran under instructions the run itself edited.
2. **Finish rule: a new GitHub read at Finish, on every repository.** One call, `redline-gh.sh last-round`, before the PR description, the sweep, the closing comment and the review request. It sits after every stopping point, as the thread sweep does, so it breaks no replay rule; no conflict was found. The error says which round the run was finishing from, which is the highest posted, and that the person should start a fresh run; nothing is posted after it. The loop test covers a normal finish, a dry run and a finish from a re-run earlier round.
3. **No addendum review.** After the pin, no path reruns a posted review. The paths checked:
   - A relaunch after a hand-off, a `reviewed` stop or a harness stop runs the launch's script with the launch's args plus what the stop asked for, so every recorded step replays (probe a).
   - An error resume reruns from the label it names, forward only. A resume at `coverage rN` or `review rN` happens before round N is posted. A resume at `post rN` reuses the cached review, and `has-review` skips the post. A resume at any later label reruns that step and the ones after it, never an earlier round's review.
   - A lost session is refused by `run check` (reason `session`); the fresh run that follows numbers its rounds after the posted ones and carries undispositioned findings forward.
   - A first launch by the `scriptPath` fallback (workflow name not found) ran the live file, so it has no pinned copy: a relaunch after the workflow file changed is refused, with a message naming the file.
   - An agent file change cannot rerun a recorded step: the agent file's body is not in the replay key (probe a).
   - The Finish rule is the backstop for a path not listed here.
   If one turns up, this list is where to start.
4. **Pin delivery: by name unless the workflow changed.** A relaunch by `scriptPath` is not covered by the `Workflow(redline:redline-loop)` allow rule (probe d), so it is used only when the live file differs from the launch's. No allow-list change, so the patch bump stands. Riders: `docs/running.md` and the skill's line say that a self-review in bypass-permissions, which is how the plugin reviews itself, relaunches by `scriptPath` with no prompt, and that in other modes the person sees one prompt per relaunch.
5. **The launch skill had no warning about this fault.** Searched `skills/`, `README.md` and `docs/`: the nearest text is `run check`'s `plugin` refusal, which covers hand commits and stays. Nothing was removed; the new paragraph in section 7 is the skill's statement on it.
6. **The refusal has two layers.** `redline-prefs.sh run drift` prints `launch: "refuse"` and the skill stops without launching; the workflow refuses the same state from `args.drift` before any agent call, which is what the loop test pins.
7. **Standards:** the eight proposed plus workflow/agents and process/internal-notes.

Deviations from the shaped plan, found while building:

8. **`agents/redline-github.md` gains the `last-round` operation.** The plan listed the agent files as untouched. The Finish read is a new operation of the GitHub agent, and its file lists every operation and the fields each returns, so the list, the enum and a `round` field were added. No role's permissions change: `last-round` was already among the guard's read subcommands.
9. **`run drift` reads no marker on a repository that is not the plugin's own.** A marker can be missing there (a `run save` that exited 2 is tolerated by the skill), and nothing may change for such a repository, so the script answers `launch: "name"` first. On the plugin's own repository a missing marker or start commit is exit 2 and the skill stops: without the marker the launch's script is unknown.
10. **The Finish stop carries a `fresh` flag.** `stageError` falls back to the last agent label, which would have made the stop resumable at `last round`; the flag keeps `resumeFrom` null. A failed read is a different error and stays resumable there.
11. **The Finish read covers every Finish kind that holds a Redline round:** the handoff, the cap-hit comment, and a human review pass's summary when it ran a nit pass. A human pass with no nit pass has no Redline round and runs no read.

12. **Standards retrospective: five edits, approved by the author and applied in their own change.** `workflow/replay.md`: the bullet calling the thread sweep "the one place" the workflow asks GitHub is reworded for the two Finish reads; two bullets added (a relaunch runs the launch's script, with the replay key as probed; `args.drift` and the Finish rule). `workflow/agents.md`: two bullets added (an agent file cannot be pinned, with its measurement caveat; a stop that must not be resumed carries its own flag). No pattern was used that the standards did not already hold or now hold.

## What the probes did and showed

A throwaway plugin in the session scratchpad: one workflow of three one-line agents, an agent file whose body names a token (three versions), a hook that logs `agent_type`. Driven from nested headless sessions (`claude -p --plugin-dir`), never a Redline run. **Every fact below was measured headless, under `--plugin-dir`, on Claude Code 2.1.322; an interactive session or an installed plugin may differ.**

**a. Replay from a copied script.**
- A run launched by name, relaunched with `scriptPath` to a byte-identical copy and `resumeFromRunId`: all agents cached, same run id.
- A copy with changed non-agent code: all cached, the new code ran.
- A copy with only an agent's `label` changed: all cached.
- A copy with one agent's prompt changed: the agents before it cached, that one and every later one live.
- The same relaunches after the agent file on disk had changed: still cached.
- So replay follows the prompt sequence; script path, script text, label and the agent file's body are not in the key. A changed `model`, `agentType` or `schema` was not tested.
- `scriptPath` must be under the session's working directory or a path the Workflow tool returned; a copy elsewhere was refused.
- Each launch by name is persisted at `<session>/workflows/scripts/<name>-<runId>.js`, byte-identical to the launched file (a Redline run's copy compared equal to the committed `workflows/redline-loop.js` of its commit). That path was accepted after the session was reopened. A relaunch by name overwrites it with the live script; after three relaunches by `scriptPath` it was unchanged.

**b. When an agent file is read.**
- In one process, the agent answered with the first version's token while the file on disk went through two more, across agent calls in one run and across new launches. A named workflow behaved the same: a fresh launch by name ran the old script after the file was replaced.
- A reopened session (`claude --resume`) re-read both: the new script ran and the agent answered with the new token, while the earlier run's cache still replayed.

**c. A pinned agent file as a role.**
- `agentType` set to a file path threw `agent type '...' not found`: it resolves only from the session's registry.
- The hook saw a typed workflow agent as `<plugin>:<role>` and an untyped one as `workflow-subagent`. An agent run from a copied file would be untyped, so outside the guard.

**d. The allow rule.**
- With only `Workflow(<plugin>:<name>)` allowed, the launch by name ran and both relaunches by `scriptPath` (the persisted copy, and a copy in the working directory) were denied: `Review dynamic workflow before running`.

## Unmeasured

- **Whether an interactive session reloads an agent file or the named workflow mid-session.** PR #80's saved run records hold three different script texts under one session id, so the workflow changed between launches there; the transcript does not show whether the session was reopened. The design does not depend on the answer: the workflow is pinned by comparing the persisted copy with the live file, whatever the session has loaded, and an agent change is read from git and reported, whatever the session has loaded.
- **Whether a `scriptPath` relaunch raises exactly one permission prompt in an interactive session, and none in bypass-permissions.** Only the headless denial was measured. This PR's own self-review, run in bypass-permissions, is where the bypass case gets its first real test; what it shows is recorded here.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach" and "nothing an agent does is hidden from the review thread": a false handoff and findings without threads are the failures this closes, and the handoff sentence about edited agent files is the same honesty applied to a self-review.

## Standards Applied

- workflow/replay — the pinned relaunch, the Finish read after every stopping point, `args.drift` read only at startup and Finish.
- workflow/agents — no agent file changes; the spec reasons about when agent files are read and why they cannot be pinned.
- testing/tests — loop-test and prefs-test cases, red before green.
- scripts/bash-conventions — the new `run drift` subcommand: one JSON object on stdout, usage errors exit 2.
- scripts/guard — rows in `tests/guard-cases.tsv` for the subcommand; no guard change.
- process/docs-gate — each touched plugin file names its section.
- process/release — 0.2.4 in both manifests; the tag and the CHANGELOG entry are the person's step.
- process/standards-retrospective — proposed at the gate.
- process/internal-notes — the probe results recorded here are this spec's own; nothing is copied from `redline-internal`.
- prompts/attribution — the handoff sentence and the error texts name Redline only.
