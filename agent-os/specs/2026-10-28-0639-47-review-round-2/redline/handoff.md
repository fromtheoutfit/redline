Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

Resolved 2 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 2 correctness, 0 nit; 5 commits; spec `agent-os/specs/2026-10-28-0639-47-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-28-0639-47-review-round-2`

### Decisions

- **R1-1** shellcheck step exits with sed's status, so the job can never fail: fixed in a465d45 · decided by: redline
- **R1-2** severity=warning may not be a .shellcheckrc key; pass -S warning: The shellcheck command in the workflow gets `-S warning` and the `severity=warning` line is removed from .shellcheckrc, because shellcheck 0.11.0 was verified to ignore the rc key and honour the flag, so the one place that sets the severity is the one that works. · decided by: @michaelfromtheoutfit

### Commits

- 8ee2115 redline: save review round 1 spec for PR #47 (#17)
- a465d45 redline: R1-1 run the shellcheck step under pipefail so a finding or a missing shellcheck fails it (#17)
- 5b9c23b redline: R1-2 set the shellcheck severity only on the command line (#17)
- 7e91246 redline: record the round 1 review lessons in the standards (#17)
- 13d746f redline: record the round 1 as built notes for PR #47 (#17)
