Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 6 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 1 correctness, 3 nit; 7 commits; spec `agent-os/specs/2026-11-11-1409-86-review-round-1`
- Round 2 (fix-diff): 0 correctness, 2 nit; 5 commits; spec `agent-os/specs/2026-11-11-1409-86-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-11-1409-86-review-round-3`

### Decisions

- **R1-4** The accounting sentence invites a finding ref that names the issue, and the exact-id match rejects it: fixed in 174000d · decided by: redline
- **R1-1** The known-finding section's opening sentence was not narrowed to 'in full': fixed in e815af8 · decided by: redline
- **R1-2** The handoff's 'last covered round, not the last round with drops' rule is only half pinned: fixed in 049ec27 · decided by: redline
- **R1-3** droppedBlock repeats personLine's line template by hand: fixed in 564d349 · decided by: redline
- **R2-1** The partly tracked rule says a diff-caused remainder is a finding without saying the other rules still apply, which contradicts the removed-guard rule: fixed in 890ac40 and 8807864 · decided by: redline
- **R2-2** The round-record check's name claims two things the check does not assert: fixed in 2e8d556 · decided by: redline

### For the person

- `workflows/redline-loop.js:2102` · A candidate accounted for as `duplicate` of a dropped index (the schema allows the ref to be an index) is in effect dropped, but the block filters on each entry's own outcome, so it is not listed, and the count sentence calls it 'collapsed into findings already reported or settled'. A wrong collapse into a dropped candidate would hide its own claim. Decision 5 names three outcomes, so whether the block follows a duplicate to its root's outcome is yours to decide (coverage candidate 2, traced).
- `workflows/redline-loop.js:511` · A candidate the verifier accounts for directly as `known` (no finding carrying a knownAs) reaches the person only as 'N already tracked'. `### Already tracked` lists findings only, so the issue it was matched to appears nowhere in the review or the handoff. That is fault 1's path if a verifier still matches a partly tracked candidate as tracked whole. Decision 5 keeps `known` out of the block, so listing those entries with their ref is yours to decide (coverage candidate 3).
- `workflows/redline-loop.js:512` · Altitude (coverage candidate 9): the partly tracked outcome exists only in prose. COVERAGE_SCHEMA has no field for the tracking issue, so its name rides in a description or a ref, where the workflow cannot check or render it (R1-4 is one symptom). Decision 11 chose no schema change; an optional `tracks` field is the alternative if that is revisited.
- `workflows/redline-loop.js:3347` · Simplification (coverage candidate 11): the round record's droppedCandidates could be derived from the accounting plus the candidate list. But #80 R1-5 keeps that list off the record, and nothing writes the accounting after line 2101 derives the subset, so the two copies cannot disagree today.
- `workflows/redline-loop.js:861` · Coverage candidate 2, plausible but not reproduced: the dropped block puts each drop and its reason into the review body. A later coverage pass that follows this repository's CLAUDE.md check-before-reporting rule ('gh pr view <n> --comments') may read a wrongly dropped candidate there as already raised and leave it out. Its line then lives only in that round's body, since the handoff carries only the last covered round's block (decision 14). Findings and For the person lines were already readable there before #85.
- `workflows/redline-loop.js:889` · Coverage candidate 5, plausible but not checked on GitHub: the dropped line puts the skill's summary and the verifier's ref inside the <details> block unescaped. A bare closing details tag in either text would end the collapse early. A bare opening one would fold everything after it, including the 'Not placed inline' section the post script appends, into a collapsed block. An HTML comment would vanish from the rendered page. Escaping '<' would break the 'summary byte for byte' rule the loop test pins, so the fix is a choice. This is a different cause from round 1's newline drop.
- `README.md:100` · Coverage candidate 6: 'What a clean run means' names the deferred findings, a decided finding still reproduced, and the dropped block. It does not name a guard this PR removed whose conditions are implausible today, which the verifier lists under For the person instead of reporting as a finding. So a run can end clean with that regression still in place, and the paragraph could say so beside the decided-finding sentence.
- `docs/running.md:48` · Coverage candidate 7: the README and docs/running.md say the dropped block lets you 'overrule a drop', but the run has no action for that. The review dial offers only findings to pick from, so an overruled drop is fixed by hand or opened as an issue outside the run. The sentence could say how.
- `tests/loop-test.mjs:1465` · Coverage candidate 8: the agent file's partly tracked paragraph also governs coverage-off and final-nit-pass rounds, so a coverage-off reviewer's behaviour changed even though its prompt is byte-identical. The spec intends this (shape.md, 'the agent file states them for both modes'), but the comment's 'coverage off stays as before' refers only to the prompt, and no check pins the coverage-off behaviour.
- `workflows/redline-loop.js:2878` · Coverage candidate 10, cleanup: review() sets droppedCandidates on both branches, and lastCovered only picks records that have coverage. So the `|| []` fallbacks at 859, 2879 and the round record are never used on a covered round, and `rounds.slice().reverse().find(...)` could be `findLast`. Defensive, harmless, and not worth a plan task.

<details>
<summary>Dropped candidates in round 2 (2): refuted, outside the diff or disproportionate</summary>

- `agents/redline-reviewer.md:39` · The refutation rule sends 'such a candidate' (one whose only counter-evidence is a neighbouring claim or an intent comment) straight to For the person, and neither the agent file nor the prompt (workflows/redline-loop.js:1205) says to try reproducing it first. A reproducible regression is never shaped. · refuted: Claim: neither the agent file nor the prompt says to try reproducing such a candidate before sending it to For the person. Evidence against: the agent file's 'For each candidate' list has 'Reproduce a correctness candidate where it is cheap' (line 38) as a step for every candidate, and line 48 sends to For the person only 'what is left, plausible but not reproduced'. The verify prompt's 'For each candidate' sentence (workflows/redline-loop.js:1205) says 'reproduce a correctness candidate where it is cheap' before the refutation rule. A candidate the verifier reproduces has evidence for its claim, so it is a finding, not a refutation case.
- `workflows/redline-loop.js:1206` · The R1-4 wording tells the verifier to name the issue in 'the ref of any other outcome', and that includes `duplicate`. But review() rewrites a duplicate ref after a renumber only when the whole ref equals an old id (lines 2087-2095), so a ref that also names the issue is not updated. This is R1-4's problem again, on another outcome. · disproportionate: Conditions: two things must coincide. The reviewer must return a finding id that is not R<n>-<k> (the rename path), and the same round must account for a partly tracked candidate as a duplicate whose ref adds the issue's name after that malformed id. Even then the only effect is a stale id in the findings file's accounting text: duplicate refs are never validated or counted by id, so no count, list or disposition changes.

</details>

### Commits

- aa067ba redline: save review round 1 spec for PR #86 (#85)
- e815af8 redline: R1-1 open the reviewer's known-finding check on what is already tracked in full (#85)
- 049ec27 redline: R1-2 pin that the handoff carries the last covered round's dropped block, not the last round with drops (#85)
- 564d349 redline: R1-3 build the dropped-candidate line with personLine (#85)
- 174000d redline: R1-4 say where a partly tracked candidate's issue is named, since a finding ref is the finding's id alone (#85)
- 7a16400 redline: record the round 1 review lessons in the standards (#85)
- fd65cb4 redline: record PR #86 round 1 as built (#85)
- 46c5dce redline: save review round 2 spec for PR #86 (#85)
- 890ac40 redline: R2-1 say a partly tracked remainder meets every other rule, so one caused in the diff is a finding unless another rule puts it elsewhere (#85)
- 2e8d556 redline: R2-2 name the result check for what it asserts and pin the accounting the result keeps (#85)
- 8807864 redline: record the round 2 review lessons in the standards, finishing R2-1 (#85)
- 966fbc5 redline: record PR #86 round 2 as built (#85)
