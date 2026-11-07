Redline handoff

Redline ran 1 review round; the last one found no correctness bugs.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-06-1019-80-review-round-1`

### For the person

- `workflows/redline-loop.js:1165` · This relaunch is not a replay of round 1. The plugin loads in place, and the round 1 reviewer prompt now carries the R2-1 reopen sentence, which was absent at 48c971b. So the reviewer reran at 474593f on the cached coverage r1 candidates, while the prompt still names 48c971b. The agents after it rerun as well. post r1 rewrites the untracked round-1-findings.json and round-1-review.json in the round 1 folder before has-review skips the post. A round 1 with no new finding then hands the PR off (line 3339) while R3-3 and R3-4 are still open. Neither the README's in-place Known limit nor agent-os/standards/workflow/replay.md says that a self-hosted relaunch stops replaying once a round changes prompt text.
