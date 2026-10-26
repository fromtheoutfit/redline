Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 5 correctness, 0 nit; 8 commits; spec `agent-os/specs/2026-10-26-1023-38-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-10-26-1023-38-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-26-1023-38-review-round-3`

### Decisions

- **R1-1** A Redline reply at a thread's root marks every earlier comment in that thread answered: The author has each human-pass reply list, in a hidden line, the comment ids it answers, and counts a comment as answered only when a reply in its thread names it, with the thread rule kept for replies that don't have the line, so a later pass over another reviewer's review still finds the comments left in a shared thread. · decided by: @michaelfromtheoutfit
- **R1-2** The @login selector matches the login case-sensitively: fixed in 7a273e6 · decided by: redline
- **R1-3** An already-answered review body is ingested again on every later pass: The author has the body reply name the review it answers, makes human-review skip a body whose review a Redline human-review comment already names, and keeps one body per pass (the newest one not yet answered), so a repeat pass over an answered review stops with nothing to revise and an older note comes up on the next pass. · decided by: @michaelfromtheoutfit
- **R1-4** Two findings in one thread: the second reply is skipped as a duplicate: fixed in 1e9f836 · decided by: redline
- **R1-5** Approving the human pass's plan also approves the nit-pass fix plan when n equals firstRound: fixed in 3321009 · decided by: redline
- **R2-1** README's human review paragraph still describes the body selection from before R1-3: fixed in 24ecd55 · decided by: redline

### Commits

- 6f6c6e1 redline: save review round 1 spec for PR #38 (#36)
- 7a273e6 redline: R1-2 match a login in any case in human-review and take the owner from the script (#36)
- 1e9f836 redline: R1-4 merge a human review pass's replies that share a thread into one reply (#36)
- 3321009 redline: R1-5 key each plan approval by the pass, h<n> for a human review pass (#36)
- f700ae3 redline: R1-1 name the comments a human-pass reply answers, and count only those as answered (#36)
- d9b584e redline: R1-3 name the review in a body reply and skip an answered body in human-review (#36)
- b48d37b redline: record the round 1 review lessons in the standards (#36)
- 5365811 redline: record the round 1 as-built notes for PR #38 (#36)
- 79da417 redline: save review round 2 spec for PR #38 (#36)
- 24ecd55 redline: R2-1 describe the human review body selection as built in the README paragraph (#36)
- 0481cd4 redline: record the round 2 review lessons in the standards (#36)
- 4f948c2 redline: record the round 2 as-built notes for PR #38 (#36)
