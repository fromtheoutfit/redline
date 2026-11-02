Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

Resolved 2 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 1 nit; 5 commits; spec `agent-os/specs/2026-11-02-0807-61-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-02-0807-61-review-round-2`

### Decisions

- **R1-2** A reshape after a decided ask fails the new checkCalls: fixed in 8e2dda2 · decided by: redline
- **R1-1** Relaunch rule leaves out relaunching a stopped run from a command line: fixed in 5bfb628 · decided by: redline

### Commits

- 7e6502c redline: save review round 1 spec for PR #61 (#57)
- 8e2dda2 redline: R1-2 let a reshape leave out a judgment call the round already decided (#57)
- 5bfb628 redline: R1-1 let a stopped run relaunch from the command line in the relaunch rule and the README (#60)
- dc0f6da redline: record the round 1 review lessons in the standards (#57)
- a276f2b redline: record PR #61 round 1 as built (#57)
