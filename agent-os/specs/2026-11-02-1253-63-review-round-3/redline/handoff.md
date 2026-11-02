Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 5 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 3 nit; 7 commits; spec `agent-os/specs/2026-11-02-1253-63-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 3 commits; spec `agent-os/specs/2026-11-02-1253-63-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-02-1253-63-review-round-3`

### Decisions

- **R1-3** This-checkout alias cases write into the checkout when a file is missing: fixed in 95b7319 · decided by: redline
- **R1-1** Inventory still says to keep it for step 13, which is now Verify: fixed in c76e889 · decided by: redline
- **R1-2** Step 12's fresh-setup branch doesn't cover an alias file already present: fixed in b48edbd · decided by: redline
- **R1-4** RUN_LINE's new parenthetical leaves out the revise command forms: fixed in b9ef59b · decided by: redline
- **R2-1** Inventory's new step list leaves out step 8, which line 21 says reads it: fixed in 068f26e · decided by: redline

### Commits

- 4aead51 redline: save review round 1 spec for PR #63 (#44)
- c76e889 redline: R1-1 point the setup inventory at the steps that read it (#44)
- b48edbd redline: R1-2 key setup's alias step on each file's inventory, fresh setup or rerun (#44)
- 95b7319 redline: R1-3 dry-run this checkout's alias cases so the gate never writes into the tree (#44)
- b9ef59b redline: R1-4 name the revise and review command forms in RUN_LINE (#44)
- ca6e662 redline: record the round 1 review lessons in the standards (#44)
- 6dafa4d redline: record PR #63 round 1 as built (#44)
- 93ef073 redline: save review round 2 spec for PR #63 (#44)
- 068f26e redline: R2-1 keep the setup inventory's pointer open so no step is left out (#44)
- f7072cf redline: record PR #63 round 2 as built (#44)
