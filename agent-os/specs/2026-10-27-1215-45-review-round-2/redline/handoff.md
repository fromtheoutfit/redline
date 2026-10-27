Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

Resolved 3 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 2 correctness, 1 nit; 6 commits; spec `agent-os/specs/2026-10-27-1215-45-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-27-1215-45-review-round-2`

### Decisions

- **R1-2** A thread holding a teammate's comment between Redline's root and Redline's reply is resolved: The author chose to keep a thread open whenever any comment in it is not Redline's, because a teammate's comment anywhere in the thread is a human's and folding it away would break the promise that Redline never resolves a human's thread. · decided by: @michaelfromtheoutfit
- **R1-3** A thread that is already resolved is listed under "left open" in the handoff line: fixed in 8a57ef8 · decided by: redline
- **R1-1** The GitHub agent's return contract now has two `skipped` keys of different types: fixed in ab6d1f8 · decided by: redline

### Commits

- 64429fa redline: save review round 1 spec for PR #45 (#39)
- ab6d1f8 redline: R1-1 give the GitHub agent's return block one skipped key (#39)
- 8a57ef8 redline: R1-3 leave a thread already resolved out of the handoff's left open list (#39)
- bec2673 redline: R1-2 keep a thread open when any comment in it is not Redline's (#39)
- 568d179 redline: record the round 1 review lessons in the standards, finishing R1-2 (#39)
- 17b410a redline: record the round 1 as-built notes for PR #45 (#39)
