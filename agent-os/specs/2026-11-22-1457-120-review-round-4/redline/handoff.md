Redline handoff

Redline ran 4 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 15 threads; 0 left open.

Agent files changed during this run (`agents/redline-shaper.md`): the rounds after the change may have run under them, while the workflow's own prompts were the launch's.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 4 items: 3 fixed, 1 put to @michaelfromtheoutfit; 7 commits; spec `agent-os/specs/2026-11-22-1457-120-review-round-1`
- Round 2 (fix-diff): 5 items: 3 fixed, 1 declined, 1 deferred; 7 commits; spec `agent-os/specs/2026-11-22-1457-120-review-round-2`
- Round 3 (fix-diff): 6 items: 6 fixed; 9 commits; spec `agent-os/specs/2026-11-22-1457-120-review-round-3`
- Round 4 (final-nit-pass): no new items; 0 commits; spec `agent-os/specs/2026-11-22-1457-120-review-round-4`

### Put to @michaelfromtheoutfit (1)

- **R1-1** A resumed first shape in a revise-only pass can rewrite over an earlier run's decided entries: The author has the resumeLine comment, docs/running.md and the replay standard say that a resumed first shape meets no decision only in a round folder its own launch created, and has an issue drafted for how a revise-only pass should treat a round folder an earlier run already shaped and resolved, so the behaviour stays as it is on main for now and the gap is tracked. Applied in b3ab458. Deferred to #121. · decided by: @michaelfromtheoutfit

### Declined by Redline (1)

To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 120 review @<login>` with the login of whoever replied, such as `review @michaelfromtheoutfit`.

- **R2-4** A missing Decisions heading in a shape.md that was written is reported as a stop to fix by hand: declined: The pull request's spec keeps the whole spec check, its Decisions-heading test included, off ownCheck on purpose (decision 14 in agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/shape.md: "The spec check does not carry the field"), and the stop resumes the shaper once relaunched, so the only cost is a look before the relaunch · decided by: redline

### Deferred (2)

- **R1-1** A resumed first shape in a revise-only pass can rewrite over an earlier run's decided entries: The author has the resumeLine comment, docs/running.md and the replay standard say that a resumed first shape meets no decision only in a round folder its own launch created, and has an issue drafted for how a revise-only pass should treat a round folder an earlier run already shaped and resolved, so the behaviour stays as it is on main for now and the gap is tracked. Applied in b3ab458. Deferred to #121. · decided by: @michaelfromtheoutfit
- **R2-5** At a reshape the spec check cannot see a refused Write, so a result-check stop still says nothing needs fixing by hand: deferred to #122; mitigated in 9e1f5ea · decided by: redline

### Fixed (12)

<details>
<summary>With the commits that fixed each</summary>

- **R1-2** The restore clause tells a resumed reshape to keep a decided task that an adjustment may move: fixed in cef664a · decided by: redline
- **R1-3** A result check that runs before the spec check marks a refused-Write stop as Redline's own: fixed in d30465f · decided by: redline
- **R1-4** Comments still say the resume line reads an error's words, and that a resumed reshape rewrites: fixed in eec1516 · decided by: redline
- **R2-3** A reshape resumed after the workflow's own check is not told never to write a lost decided entry from memory: fixed in 07a7316 · decided by: redline
- **R2-1** No check pins the resume label of the human-pass decline stop: fixed in 896471c · decided by: redline
- **R2-2** R1-1's text says an earlier run's record commit always keeps the entries a revise-only resume rewrites: fixed in 3d0ca14 · decided by: redline
- **R3-1** 'A resume at the shape stage reruns the shaper' is false when the spec-status call itself fails: fixed in cbffb87 · decided by: redline
- **R3-2** 'A run that never resumed at one of those steps is not affected' contradicts the section's first paragraph: fixed in ed731cd · decided by: redline
- **R3-3** The ownCheck-false-equals-absent check runs at a label where the field is never read: fixed in ec0f512 · decided by: redline
- **R3-4** Round 2's fix dropped the space after `=` in the RESTORE constant: fixed in 34485ba · decided by: redline
- **R3-5** The restore clause says the folder already holds the plan, and it is given after a 'no plan.md' stop: fixed in 43bb9ea · decided by: redline
- **R3-6** With the spec check first, a failed spec-status call before a bad result costs a second relaunch: fixed in 6ba2f92 · decided by: redline

</details>

### Candidates set aside in round 3 (1)

<details>
<summary>Refuted, collapsed or already tracked</summary>

- `workflows/redline-loop.js:288` · A resumed run refuses `ownCheck: null`, though the field is optional and normalised with `=== true` on the next line. The skill builds the entry as `"ownCheck": <marker.ownCheck>` (skills/redline/SKILL.md:52), and a marker written before 0.4.5 has no such key, so filling in the template literally gives null. `fail()` then throws at load, before any agent runs. The refusal message also lists ownCheck as if it were required. Fix: treat null as absent (`entry.ownCheck == null || typeof entry.ownCheck === 'boolean'`), or have `run read`/`run check` print `ownCheck: false` when the stored marker has none. · refuted: Claim: the skill builds a resume entry with ownCheck null from a marker written before 0.4.5, and the workflow refuses it. Evidence against: skills/redline/SKILL.md:52 tells the skill that ownCheck is the marker's, `false` when the marker holds none. The workflow takes false and reads it as an ordinary stop (workflows/redline-loop.js:288-291). Refusing any type other than a boolean is the contract the PR description states. Null reaches the check only if the skill ignores that sentence. Round 1 refuted the same candidate on the same evidence.

</details>

### Commits

- a1bebb2 redline: save review round 1 spec for PR #120 (#117)
- cef664a redline: R1-2 let a resumed reshape apply an adjustment to a decided task (#117)
- d30465f redline: R1-3 check the spec folder before the shaper's result (#117)
- eec1516 redline: R1-4 say what the resume line reads in the hold's and the spec check's comments (#117)
- b3ab458 redline: R1-1 say a resumed first shape meets no decision only in its own launch's folder (#117)
- ed4ea0a redline: record the round 1 review lessons in the standards (#117)
- 96eb7aa redline: record the as-built state of review round 1 for PR #120 (#117)
- 2e8b511 redline: save review round 2 spec for PR #120 (#117)
- 896471c redline: R2-1 pin the resume label of the human pass's decline stop (#117)
- 3d0ca14 redline: R2-2 say the spec commit keeps an earlier run's decided entries only once it reached implement (#117)
- 07a7316 redline: R2-3 tell a reshape resumed after the workflow's check never to write a lost decided entry from memory (#117)
- 9e1f5ea redline: R2-5 say the spec check sees a refused Write only where it leaves a file missing (#117)
- 26ff100 redline: record the round 2 review lessons in the standards (#117)
- bf12327 redline: record the as-built state of review round 2 for PR #120 (#117)
- a559a6f redline: save review round 3 spec for PR #120 (#117)
- cbffb87 redline: R3-1 say a resume after the spec check's own failure reruns the check alone (#117)
- ed731cd redline: R3-2 limit the 0.4.5 upgrade note's all-clear to runs not stopped at those steps (#117)
- ec0f512 redline: R3-3 compare ownCheck false with an absent field at a first shape, which reads it (#117)
- 34485ba redline: R3-4 put back the space after the equals sign in the RESTORE constant (#117)
- 43bb9ea redline: R3-5 open the restore clause with what holds after a missing plan.md too (#117)
- 6ba2f92 redline: R3-6 say the spec check first costs a second relaunch after its own call fails beside a refused result (#117)
- 5dcfead redline: record the round 3 review lessons in the standards (#117)
- 270a32e redline: record the as-built state of review round 3 for PR #120 (#117)
