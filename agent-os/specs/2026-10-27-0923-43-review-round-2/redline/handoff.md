Redline handoff

Redline ran 2 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-10-27-0923-43-review-round-1`
- Round 2 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-27-0923-43-review-round-2`

### Decisions

- **R1-1** errorText is applied at eight call sites, not once at parse time as #42 asks: Normalize every agent's error field once, as run() returns it, so any later check can read .error safely; this is the fix #42 asked for and removes the failure instead of documenting it, and the only cost is that detail.checker keeps the normalized error, not the raw one. · decided by: @michaelfromtheoutfit

### Commits

- dde1db8 redline: save review round 1 spec for PR #43 (#42)
- f2bb9f1 redline: R1-1 normalize every agent's error once, as run() returns it (#42)
- 7b8da7e redline: record the round 1 review lessons in the standards, finishing R1-1 (#42)
- 74412bc redline: record the round 1 as-built notes for PR #43 (#42)
