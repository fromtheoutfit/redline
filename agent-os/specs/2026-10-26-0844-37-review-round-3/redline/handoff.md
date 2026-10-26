Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 2 nit; 6 commits; spec `agent-os/specs/2026-10-26-0844-37-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-10-26-0844-37-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-26-0844-37-review-round-3`

### Decisions

- **R1-3** Checker text fails a round whose only failures were already failing at baseline: The checker's error text is never a verdict input; verdicts come from each check's exit code against the baseline, the git block and the gate's exit code, and the text is carried only as a warning on a passing round or as detail on a failure the data already established. · decided by: @michaelfromtheoutfit
- **R1-1** A usage error is routed to result_unreadable before the exit-2 rule: fixed in 9a7ad95 · decided by: redline
- **R1-2** The spilled stop gives the template's path relative to the plugin: fixed in 0f46709 · decided by: redline
- **R2-1** The checker-text warning says "on a passing gate" when the gate exited 1: fixed in 6a342b0 · decided by: redline

### Commits

- 331e51c redline: save review round 1 spec for PR #37 (#9)
- 9a7ad95 redline: R1-1 name a usage error as exit 2 before the unreadable status (#9)
- 0f46709 redline: R1-2 name the checks template by its absolute plugin path in the spilled stop (#9)
- dd39eaf redline: R1-3 never let the checker's text decide the verdict, so a round failing only at baseline passes (#9)
- 8741d45 redline: record the round 1 review lessons in the standards (#9)
- 8ddffc7 redline: record the round 1 as-built notes for PR #37 (#9)
- 57b8313 redline: save review round 2 spec for PR #37 (#9)
- 6a342b0 redline: R2-1 word the checker-text warning as on a round that passes, since the gate may have exited 1 on baseline failures (#9)
- 0bdbffb redline: record the round 2 review lessons in the standards (#9)
- 4d84e3a redline: record the round 2 as-built notes for PR #37 (#9)
