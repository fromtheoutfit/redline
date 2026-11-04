Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs.

Resolved 7 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 6 nit; 10 commits; spec `agent-os/specs/2026-11-04-0950-71-review-round-1`
- Round 2 (fix-diff): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-04-0950-71-review-round-2`

### Decisions

- **R1-4** After a dry run, the next launch stops at the precheck; it does not start at round 1: The author has the docs and the review-only summary tell a person to copy a dry run's spec folder out if it is worth keeping and then reset the branch to origin/<branch> before the next run, and will file the workflow change that removes the step as its own issue. · decided by: @michaelfromtheoutfit
- **R1-1** Stale pointer to "Template version" under checks.sh: fixed in 8e08d79 · decided by: redline
- **R1-2** The Claude Code version `claude plugin tag` needs was dropped: fixed in b2964f4 · decided by: redline
- **R1-3** The guard-table timing contradicts itself: fixed in 0110a03 · decided by: redline
- **R1-5** Precheck repeats "The workflow runs in the background": fixed in c6aeb9e · decided by: redline
- **R1-6** "Every script prints one JSON object on stdout" is not true: fixed in e580596 · decided by: redline
- **R1-7** Three sections repeat their heading as a bold lead-in: fixed in 21d038e · decided by: redline

### Commits

- a65c471 redline: save review round 1 spec for PR #71 (#14)
- 8e08d79 redline: R1-1 point "Template version" at docs/contract.md in CONTRIBUTING.md (#14)
- b2964f4 redline: R1-2 say which version the plugin tag subcommand needs, in CONTRIBUTING.md Releases (#14)
- 0110a03 redline: R1-3 say the 78 seconds was the whole baseline, in docs/guard.md (#14)
- c6aeb9e redline: R1-5 drop the repeated background sentence in docs/running.md Precheck (#14)
- e580596 redline: R1-6 say what the scripts print, in docs/scripts.md (#14)
- 21d038e redline: R1-7 drop the bold lead-ins that repeat their headings, in docs/upgrading.md (#14)
- 545b6c9 redline: R1-4 tell a person to drop a dry run's commits before the next run (#14)
- 23755c9 redline: record the round 1 review lessons in the standards (#14)
- 18fea9a redline: record PR #71 round 1 as built (#14)
