Redline handoff

Redline ran 3 review rounds; the last one found no correctness bugs.

Resolved 5 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 3 nit; 7 commits; spec `agent-os/specs/2026-11-03-0852-65-review-round-1`
- Round 2 (fix-diff): 1 correctness, 0 nit; 4 commits; spec `agent-os/specs/2026-11-03-0852-65-review-round-2`
- Round 3 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-03-0852-65-review-round-3`

### Decisions

- **R1-3** Guard and hook files go unprotected when the run loads the cached release: The author keeps the precheck warning and corrects the README's Known limits, CLAUDE.md and point 11 of the unattended section to say the guard refuses the guard and hook files only when the checkout loads in place, leaving a guard that protects them by manifest to a follow-up issue for 0.1.1. · decided by: @michaelfromtheoutfit
- **R1-1** Version step says the reviewer flags a missing bump, but no Redline role is told to: The author names the Redline reviewer as the one that reports a missing version bump, with a Version bullet beside Docs in its instructions that excepts a PR whose spec keeps the version on purpose, so a forgotten bump is caught before the merge instead of by claude plugin tag afterwards. · decided by: @michaelfromtheoutfit
- **R1-2** Releases tags before the CHANGELOG commit; Task 8 commits it first: fixed in e522439 and a3d420b · decided by: redline
- **R1-4** Header's exit-2 list leaves out a root plugin.json that is not JSON: fixed in 7536d4f · decided by: redline
- **R2-1** Corrected docs credit the plan approver with a guard-file check it does not have: fixed in d763617 and 425df9a · decided by: redline

### Deferred (mitigated now, full fix left open)

- **R1-3** Guard and hook files go unprotected when the run loads the cached release: shipped The README's Known limits bullet, CLAUDE.md:57 and point 11 of the unattended section in .claude/commands/agent-os/shape-spec.md say the guard refuses scripts/redline-guard.sh and hooks/hooks.json only when the checkout loads in place; from a cached release, point 11, the plan approver and the teammate's review keep them out of a run, and the launch precheck keeps its warning (plan.md, Task 4).; open: A person, outside any Redline run and under a follow-up issue for 0.1.1, changes scripts/redline-guard.sh so a repository whose .claude-plugin/plugin.json names redline protects the two files whatever CLAUDE_PLUGIN_ROOT is, and in the same commit adds tests/guard-cases.tsv rows for the new deny and the neighbouring allow (a repository whose manifest names another plugin) and a fixture repository that tests/guard-test.sh prepares; no Redline role may write the guard.

### Commits

- abc1e08 redline: save review round 1 spec for PR #65 (#16)
- e522439 redline: R1-2 commit the CHANGELOG entry before the tag in the README's Releases paragraph (#16)
- 7536d4f redline: R1-4 name a root plugin.json that is not JSON in the version header's exit-2 list (#16)
- 4884677 redline: R1-3 say the guard refuses its own two files only when the checkout loads in place (#16)
- 57664a5 redline: R1-1 the Redline reviewer reports a missing version bump as a nit (#16)
- a3d420b redline: record the round 1 review lessons in the standards, finishing R1-1 and R1-2 (#16)
- 862ab55 redline: record PR #65 round 1 as built (#16)
- b23d603 redline: save review round 2 spec for PR #65 (#16)
- d763617 redline: R2-1 drop the plan approver from what keeps the guard and hook files out of a cached-mode run (#16)
- 425df9a redline: record the round 2 review lessons in the standards, finishing R2-1 (#16)
- 57c96d0 redline: record PR #65 round 2 as built (#16)
