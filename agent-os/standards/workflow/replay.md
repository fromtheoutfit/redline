# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- The skill relaunches with byte-identical `args` plus only what the stop asked for, and `resumeFromRunId` set to the run id it recorded at launch. A run the harness stopped is relaunched the same way with nothing added
- A prompt names its inputs by path (`<specFolder>/redline/round-1-findings.json`), not by content, wherever the content can change between launches
- The GitHub agent never posts a round-N review when one already exists on the PR (`redline-gh.sh has-review`), so a fresh run after a lost session cannot double-post
- The first round number enters through `args.firstRound`: the skill reads the highest posted round with `redline-gh.sh last-round` before the launch and passes the next one, and the workflow never asks GitHub for it, since the answer changes as soon as the run posts (#33; #10, round numbering). A human review pass's number enters the same way, through `args.revise.n` from `redline-gh.sh last-human-review`, with the ingested comments as `args.revise.findings` (#36)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
