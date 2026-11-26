Redline handoff

Redline ran 4 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in round 5's fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 23 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 3 (pr): 11 items: 11 fixed; 14 commits; spec `agent-os/specs/2026-11-25-1418-127-review-round-3`
- Round 4 (fix-diff): 4 items: 4 fixed; 7 commits; spec `agent-os/specs/2026-11-25-1418-127-review-round-4`
- Round 5 (fix-diff): 3 items: 3 fixed; 6 commits; spec `agent-os/specs/2026-11-25-1418-127-review-round-5`
- Round 6 (final-nit-pass): no new items; 0 commits; spec `agent-os/specs/2026-11-25-1418-127-review-round-6`

### Fixed (18)

<details>
<summary>With the commits that fixed each</summary>

- **R3-4** A typed defer at a reshape's left call is read on the relaunch as a plan-dial override, applied before the finding is left: fixed in 865ae26 · decided by: redline
- **R3-5** A class link to a renamed sibling resolves to the earlier finding that had the old id, with no warning: fixed in 4824c91 · decided by: redline
- **R3-6** A call that names a prose rule in why_human but has no askRule tag is applied by Redline as an ordinary call: fixed in 93c01e1 · decided by: redline
- **R3-10** No workflow check keeps a left deferral's mitigation and task empty when its call offered no draft: fixed in a76da6d · decided by: redline
- **R3-1** The contract names the unattended section's marker and precheck warning as v6, while the template is v7: fixed in 30d17e5 · decided by: redline
- **R3-2** Three texts say the shaper's schema refuses every key it does not name, but a deferred entry accepts any key: fixed in 616dffe · decided by: redline
- **R3-3** Deferring a left finding is said to stop the round to show its draft, which never happens under `defer at end`: fixed in 24c62f8 · decided by: redline
- **R3-7** A kept draft's call recommendation doubles a period that ends the draft's title: fixed in a60771e · decided by: redline
- **R3-8** The unmatched-option warning promises a resolve-agent statement that is never asked for a left finding: fixed in c4dafaf · decided by: redline
- **R3-9** A later resolve can replace a left deferral's option draft with no warning: fixed in f51f4a6 · decided by: redline
- **R3-11** For a left deferral with a commit of its own, the warning gives a false reason and implies a reply names the commit: fixed in db59918 · decided by: redline
- **R4-1** A call asked under a declared rule is still run as an ordinary call when its finding carries an undeclared askRule tag: fixed in e68c426 · decided by: redline
- **R4-2** A shaper deferral with an incomplete draft that a rule forces loses its draft with no warning: fixed in a94e5e0 · decided by: redline
- **R4-4** A decided deferral that a reshape newly leaves to the person keeps its first resolve's task with files, and it is built: fixed in 1b4bdb5 · decided by: redline
- **R4-3** A typed defer on a left call with two drafted defer options takes neither draft, with no warning: fixed in d66b6b9 · decided by: redline
- **R5-3** A decided call that a reshape newly leaves to the person keeps its fix or accept disposition beside the new `rule`: fixed in 3e6be84 · decided by: redline
- **R5-1** On a review that was not asked for links, two warnings give a reason for clearing a link that is not the real one: fixed in f54a16f · decided by: redline
- **R5-2** The R4-2 warning says a decided deferral's draft is not kept when a reshape leaves it, while the decision's own draft is filed: fixed in 7753871 · decided by: redline

</details>

### Earlier rounds

- **R1-1** The 0.5.0 note says a review-dial stop replays whole, but on a PR with an earlier Redline run the first review reruns: already handled in round 1: fixed in e70a33c (redline: R1-1 say the 0.5.0 replay note holds only on a pull request with no earlier answered round (#105)). · decided by: redline
- **R1-2** A human review pass's shape prompts say an own-file call is left to the person and drafted, which never applies in that pass: already handled in round 1: fixed in eed6f8b (redline: R1-2 name only a rule call in a human pass's options sentence (#105)). · decided by: redline
- **R1-3** A revise-only pass clears a sameClassAs link with a false reason: the earlier finding was recorded: already handled in round 1: fixed in 38592e4 (redline: R1-3 give a link a revise-only pass clears a true reason (#105)). · decided by: redline
- **R1-4** An ordinary call the forcing point puts under a paths rule stops the round on its undrafted defer option: already handled in round 1: fixed in cf1a39a (redline: R1-4 keep a relabelled call's undrafted options and hold every left call's draft complete (#105)). · decided by: redline
- **R1-5** checkCauses and checkOptions name only the first failure, costing one relaunch per fault: already handled in round 1: deferred to #128. Mitigated in cd69669 (redline: R1-5 name every fault of checkCauses and checkOptions in one error (#105)). · decided by: redline
- **R1-6** The one-place check requires an exact task file, while the outside-path stop beside it says `where` may be a folder: already handled in round 1: fixed in 11b10cc (redline: R1-6 word the outside-path stop of a one-place fix by its contract (#105)). · decided by: redline
- **R2-1** Deferring a left finding is said to stop the round to show the draft, which never happens under `defer at end`: carried forward as R3-3: fixed in 24c62f8 · decided by: redline
- **R2-2** The return example recommends an option ending in accept for a recommendation that adds a comment: resolved: The return example now recommends "Accept, no change." beside its `Accept` option that ends in `accept`, in templates/shape-spec-unattended.md (74, 94), agents/redline-shaper.md (41, 56) and .claude/commands/agent-os/shape-spec.md (65, 85), so the recommendation, `recommended` and `files: []` agree. · decided by: redline
- **R2-3** A kept draft's call recommendation doubles a trailing period from the draft title: carried forward as R3-7: fixed in a60771e · decided by: redline
- **R2-4** The unmatched-option warning promises a statement from the resolve agent that is never asked for a left finding: carried forward as R3-8: fixed in c4dafaf · decided by: redline
- **R2-5** A later resolve can replace a left deferral's option draft without the warning that protects it: carried forward as R3-9: fixed in f51f4a6 · decided by: redline
- **R2-6** Nothing in the workflow keeps a left deferral's mitigation and task empty when the call offered no draft: carried forward as R3-10: fixed in a76da6d · decided by: redline
- **R2-7** For a left deferral with a commit of its own, the warning gives a false reason and says the commit counts when no reply names it: carried forward as R3-11: fixed in db59918 · decided by: redline

### Commits

- cc9af40 redline: save review round 3 spec for PR #127 (#105)
- 865ae26 redline: R3-4 mark a typed defer as a call's answer, so a later stop's defer is never read as an override (#105)
- 4824c91 redline: R3-5 clear a class link that names an id the review renamed (#105)
- 93c01e1 redline: R3-6 hold a finding to the rule its call names when it carries no tag (#105)
- a76da6d redline: R3-10 keep a left finding's entry free of a mitigation and its task free of files (#105)
- 30d17e5 redline: R3-1 name the unattended section's marker as v7 in the contract (#105)
- 616dffe redline: R3-2 say which objects the shaper's and the reviewer's schemas refuse an unnamed key on (#105)
- 24c62f8 redline: R3-3 say a deferred left finding's draft is shown before it is filed, at the round's stop or the end of the run (#105)
- a60771e redline: R3-7 end a kept draft's call recommendation in one period (#105)
- c4dafaf redline: R3-8 word the unmatched-option warning truly for a finding left to the person (#105)
- f51f4a6 redline: R3-9 keep the first entry of a left deferral when a later resolve returns another (#105)
- db59918 redline: R3-11 warn truly of a commit of its own for a finding left to the person (#105)
- aa945f1 redline: record the round 3 review lessons in the standards (#105)
- 20a7603 redline: record the as-built state of review round 3 for PR #127 (#105)
- 152f6e9 redline: save review round 4 spec for PR #127 (#105)
- e68c426 redline: R4-1 hold a finding to the rule its call names when its tag names no declared rule (#105)
- a94e5e0 redline: R4-2 warn when a rule drops a shaper's draft that is short of a field (#105)
- 1b4bdb5 redline: R4-4 hold a decided finding a reshape leaves to the person to no task with files (#105)
- d66b6b9 redline: R4-3 warn when a typed defer names none of a left call's drafted issues (#105)
- 2edf143 redline: record the round 4 review lessons in the standards (#105)
- 10f2630 redline: record the as-built state of review round 4 for PR #127 (#105)
- a1a4df7 redline: save review round 5 spec for PR #127 (#105)
- 3e6be84 redline: R5-3 give a decision a reshape newly leaves to the person what a resolve gives one (#105)
- f54a16f redline: R5-1 clear every link on a review not asked for links with the one true reason (#105)
- 7753871 redline: R5-2 give no call warning in forceAskRules for a finding already decided (#105)
- 09ec719 redline: record the round 5 review lessons in the standards (#105)
- 39807d1 redline: record the as-built state of review round 5 for PR #127 (#105)
