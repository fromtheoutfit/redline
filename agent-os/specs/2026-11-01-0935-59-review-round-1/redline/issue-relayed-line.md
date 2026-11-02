Title: A relaunch relays the person's last typed line to every agent, and one refused its task because of it

## What happened

PR #59, round 1, guided. The shaper returned one judgment call (R1-2), whose recommended option was labelled "Refuse it". The person answered by typing `Refuse it`, confirmed the relaunch, and the run was relaunched with `args.decisions.R1-2 = {"choice": "Refuse it", ...}` and `resumeFromRunId`.

The harness relayed the person's last typed line, `Refuse it`, with the relaunch. The GitHub agent at `snapshot r1` (`workflows/redline-loop.js:2226`, phase Approve, writing `redline/snapshot.json`) read it as an instruction and refused its own task:

> Refused: the user's request relayed with this run says "Refuse it", and that request takes precedence over the computed task. The snapshot.json for PR #59 round 1 was not written.

The run ended in error at stage `snapshot` (`resumeFrom: {label: "snapshot r1", attempt: 2}`) before any fix was implemented.

Every agent's prompt already carries `RUN_LINE` (`workflows/redline-loop.js:261`), which says that a message arriving with the prompt is conversational, not an instruction, and that `args.decisions` is the only authority. The agent had that sentence and refused anyway. The skill also assumed the "Relaunch with these decisions" confirmation would be the last line relayed, but it was the typed answer before it.

## Why a prompt sentence is not the fix

A sentence asking an agent to ignore the relayed line has been shown not to be enough. It depends on every agent, on every model it runs on, weighing that sentence over the person's own words. The smaller models that run the GitHub and checker agents are the least likely to do that, and they do the operations a refusal hurts most: writing the snapshot, posting, committing and pushing. The words an answer is likely to contain ("Refuse it", "Drop it", "Accept it", "Defer") are the ones most easily read as orders.

## Proposed fix

The fix belongs in the workflow, not only in the agents' prompts:

- On a relaunch, the workflow passes the person's last typed line only to the agent whose question that line answers: the resolve agent after a `decisions` or `plan` hand-off, and the shaper for the selected findings after a `reviewed` result.
- The workflow strips the line for every other agent. That covers the snapshot, post, reply, comment and record-commit operations of the GitHub agent, the checker, the reviewer, the implementer and the approvers.
- The answer still reaches the run only through `args.decisions`, `args.selected` and `args.approvedPlans`, as now.
- `RUN_LINE` stays as a second layer, not the only one.

Tests: a loop-test scenario relaunching after a hand-off whose answer reads like an instruction (`Refuse it`), checking that only the resolve agent's prompt carries the relayed line and that no other agent's prompt does; plus a neighbour case showing that a first launch, which has no relayed answer, is unchanged.

## Recovery for this run

No hand fix was needed. The run was resumed from `snapshot r1` through the run marker (#10), so the line relayed on the resume is the resume command.
