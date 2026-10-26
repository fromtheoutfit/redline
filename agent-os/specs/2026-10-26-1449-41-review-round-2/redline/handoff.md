Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 2 correctness, 1 nit; 6 commits; spec `agent-os/specs/2026-10-26-1449-41-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-26-1449-41-review-round-2`

### Decisions

- **R1-2** wait can return an earlier run's result if it runs before start clears the label: fixed in b33a94f · decided by: redline
- **R1-3** A checks.sh exit of 3, 4 or 5 reads as wait's own answer, and a 3 loops forever: fixed in 820345d · decided by: redline
- **R1-1** Missing separator before 'the GitHub wrapper' in the harness list: fixed in 2f2e9bb · decided by: redline

### Commits

- 55e496e redline: save review round 1 spec for PR #41 (#40)
- 2f2e9bb redline: R1-1 separate the setup script and the GitHub wrapper in the harness list (#40)
- b33a94f redline: R1-2 read a background result once, so a rerun's wait never returns the earlier run's (#40)
- 820345d redline: R1-3 report a checks.sh exit outside 0, 1 and 2 as no result, so a wait cannot loop on 3 (#40)
- f2c66b0 redline: record the round 1 review lessons in the standards (#40)
- 56334a4 redline: record the round 1 as-built notes for PR #41 (#40)
