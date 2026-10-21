Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. Only round 1 reviewed the whole PR; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 3 nit; 7 commits; spec `agent-os/specs/2026-10-21-1533-7-review-round-1`
- Round 2 (fix-diff): 0 correctness, 1 nit; 3 commits; spec `agent-os/specs/2026-10-21-1533-7-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-21-1533-7-review-round-3`

### Decisions

- **R1-13** The output cap is per check and per stream, so the checker's result is still unbounded: The author chose a single shared output budget for checks.sh, split evenly among the failing checks in a final pass rather than consumed in run order, so the checker's result stays bounded however many checks fail, and will carry the matching change into .claude/redline/checks.sh by hand after the round. · decided by: @michaelfromtheoutfit
- **R1-11** Setup step 1 stamps before step 5 adds the parenthetical that stamp reads: fixed in 896fef3 · decided by: redline
- **R1-12** Gate stamp says any step added or removed moves the hash; a step with no backticks does not: fixed in 330690a · decided by: redline
- **R1-14** `truncated` misses the byte cap, and the README contract still says 200 lines: deferred; mitigated in 579c0a5: scripts/checks-template.sh sets truncated when a stream exceeds keep lines or cap bytes, and README.md's output contract shows the template's numbers, a truncated field and a bullet saying what it means. · decided by: redline
- **R2-1** A failing check's stderr never gets the share stdout leaves unused: deferred; mitigated in 7d92b87: scripts/checks-template.sh's emit_checks counts stdout's kept bytes and lets stderr take the share stdout leaves unused (each stream keeps at least half when both are long, the per-check total stays the share); the template comment and README.md:213's truncated bullet describe it. Proven by the syntax check and grep. · decided by: redline

### Deferred (mitigated now, full fix left open)

- **R1-14** `truncated` misses the byte cap, and the README contract still says 200 lines: shipped scripts/checks-template.sh sets truncated when a stream exceeds keep lines or cap bytes, and README.md's output contract shows the template's numbers, a truncated field and a bullet saying what it means.; open: A person makes the same truncated change in this repository's .claude/redline/checks.sh (run_check, lines 97 to 112) after the run, carrying any new caps R1-13 settles; no restamp is needed because the header does not change.
- **R1-13** The output cap is per check and per stream, so the checker's result is still unbounded: shipped scripts/checks-template.sh records each check and, in a final pass, splits one 16 KB budget evenly among the failing checks; the README output contract and truncated bullet describe it.; open: The author carries the matching change into this repository's .claude/redline/checks.sh by hand after the round (the run_check block and the final jq -n that assembles checks); until then this repository's checker result stays unbounded when more than one long check fails. No restamp is needed.
- **R2-1** A failing check's stderr never gets the share stdout leaves unused: shipped scripts/checks-template.sh's emit_checks counts stdout's kept bytes and lets stderr take the share stdout leaves unused (each stream keeps at least half when both are long, the per-check total stays the share); the template comment and README.md:213's truncated bullet describe it. Proven by the syntax check and grep.; open: The author carries the same out_kept and err_cap lines into this repository's .claude/redline/checks.sh, in the same hand edit that brings over round 1's R1-13 final pass and R1-14 truncated; the change is below the header, so no restamp is needed.

### Commits

- 6b6e488 redline: save review round 1 spec for PR #7 (#6)
- 896fef3 redline: R1-11 stamp checks.sh in setup step 5, after the unattended section adds the step range (#6)
- 330690a redline: R1-12 say only steps that hold a backticked span move the gate hash, and pin a prose-only step added (#6)
- 579c0a5 redline: R1-14 set the template's truncated when the byte cap cuts a stream, and bring the README output contract up to date (#6)
- 5e6b249 redline: R1-13 share one 16 KB output budget evenly among the failing checks in a final pass of the template (#6)
- 5be9760 redline: record the round 1 review lessons in the standards (#6)
- 1089c42 redline: record what round 1 built for PR #7 (#6)
- b583478 redline: save review round 2 spec for PR #7 (#6)
- 7d92b87 redline: R2-1 let a failing check's stderr take the share its stdout leaves unused in the template, and say so in the README (#6)
- 3225dba redline: record what round 2 built for PR #7 (#6)
