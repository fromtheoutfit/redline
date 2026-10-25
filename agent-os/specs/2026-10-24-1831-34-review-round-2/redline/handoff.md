Redline handoff

Redline ran 2 review rounds; the last one found no correctness bugs. Its one nit, R2-1, was fixed in 72ebef0, but the final nit pass over that fix did not run: the loop read the checker's result after round 2 as a failure although all eight checks passed, and stopped (tracked in #9). Please look at 72ebef0 first. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 3 correctness, 5 nit; 11 commits; spec `agent-os/specs/2026-10-24-1831-34-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 4 commits; spec `agent-os/specs/2026-10-24-1831-34-review-round-2`

### Decisions

- **R1-1** Checking pr-comments for the marker always finds it in the review body, so a body finding's reply can be skipped: fixed in 0c0fc29 · decided by: redline
- **R1-7** comment_id 0 now always means "post an issue comment for a body finding", including when no review exists: fixed in d80b9a3 · decided by: redline
- **R1-8** The #778 failure shape still ends the run at post; only the agent prompt changed: The loop treats a posted review that carries an agent error as a warning and continues into shaping when the review has an id and every finding is inline or moved to the body, and still stops the run otherwise, so the #778 failure no longer ends the run at post while a partly failed post is still caught. · decided by: @michaelfromtheoutfit
- **R1-2** usage() still prints header lines 2 to 34, which now cuts off the writes section: fixed in cb40600 · decided by: redline
- **R1-3** A renamed file without a patch is always described as "contents unchanged": fixed in 4c62688 · decided by: redline
- **R1-4** The review body still says every finding has an inline comment above the "Not placed inline" section: fixed in a9eb6a2 · decided by: redline
- **R1-5** The precheck counts hundreds of git diff lines by eye: fixed in 2f9ef30 · decided by: redline
- **R1-6** Review body reads "Rounds 1 to 1 were posted by an earlier run": fixed in 9a13558 · decided by: redline
- **R2-1** The --help test says it checks the header's last line but matches a line four lines earlier: fixed in 72ebef0 · decided by: redline

### Commits

- c019ed0 redline: save review round 1 spec for PR #34 (#33)
- 0c0fc29 redline: R1-1 check for a body finding's reply by its own second line, never the marker the review body also carries (#33)
- d80b9a3 redline: R1-7 route each reply from whether the review is on GitHub, so a dry run or an unposted review writes reply files only (#33)
- cb40600 redline: R1-2 print redline-gh.sh's whole header on --help with sed -n '2,/^$/p' (#33)
- 4c62688 redline: R1-3 call a patch-less rename unchanged only when GitHub counts no changes, so a changed one reads as binary or too large (#33)
- a9eb6a2 redline: R1-4 word the review body's closing line so it holds when findings sit under Not placed inline (#33)
- 2f9ef30 redline: R1-5 read the precheck's local file count from git diff --shortstat instead of counting paths (#33)
- 9a13558 redline: R1-6 say Round 1 is already on this PR, or Rounds 1 to N, instead of Rounds 1 to 1 (#33)
- db4414d redline: R1-8 continue with a warning when the GitHub agent reports an error on a posted review that accounts for every finding, and stop otherwise (#33)
- 343036d redline: record the round 1 review lessons in the standards (#33)
- dafef60 redline: record the round 1 as-built notes for PR #34 (#33)
- 5bca2ad redline: save review round 2 spec for PR #34 (#33)
- 72ebef0 redline: R2-1 match the --help case against the header's last non-blank line instead of the update entry four lines earlier (#33)
- 61f02e2 redline: record the round 2 review lessons in the standards (#33)
- b118fa1 redline: record the round 2 as-built notes for PR #34 (#33)