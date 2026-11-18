Redline handoff

Redline ran 4 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 29 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 12 items: 9 fixed, 2 deferred, 1 overruled by @michaelfromtheoutfit; 13 commits; spec `agent-os/specs/2026-11-17-1643-103-review-round-1`
- Round 2 (fix-diff): 12 items: 9 fixed, 3 declined; 12 commits; spec `agent-os/specs/2026-11-17-1643-103-review-round-2`
- Round 3 (fix-diff): 7 items: 5 fixed, 1 declined, 1 deferred; 8 commits; spec `agent-os/specs/2026-11-17-1643-103-review-round-3`
- Round 4 (final-nit-pass): no new items; 0 commits; spec `agent-os/specs/2026-11-17-1643-103-review-round-4`

### Overruled by @michaelfromtheoutfit (1)

- **R1-6** The deferred outcome's mitigation fallbacks can no longer run: The author has the deferred outcome's unreachable mitigation fallbacks and its mitigation field removed in this pull request, because this pull request is what made them unreachable; if anything still reads the field, the field stays and the change says which reader. Applied in dd1bf10. · decided by: @michaelfromtheoutfit

### Declined by Redline (4)

To overrule one, reply in its thread (for one in the review body, which has no thread, submit a pull request review whose body names its id), then run `/redline:redline-revise 103 review @<login>` with the login of whoever replied, such as `review @michaelfromtheoutfit`.

- **R2-6** A person's deferral whose mitigation commit only mentions its id is replied to as 'No code change.': declined: the pull request posts a deferral with no commit of its own as shipping nothing on purpose, in the decided form as `No code change.` (its description, 'Behaviour that changes on purpose' and 'Known gaps'), and code lands under that reply only when the implementer commits the mitigation under a subject that does not open `redline: <id>` and leaves it unreported, against both halves of its rule 3, when the run's warning names the planned files · decided by: redline
- **R2-10** plannedFiles unions every resolve's tasks for a decided finding, so a replan that drops its task is never seen: declined: the replan it needs takes two agents acting against their prompts in one round: a reshape that raises a judgment call for a finding the person already decided by an override (the reshape prompt keeps the person's decision as it is), then a resolve of that unchanged decision that drops the task the first resolve planned; even then the cost is a bounced plan or a resumable stop at approve, never a wrong commit or reply · decided by: redline
- **R2-12** Whether a deferral's own commit landed is computed three times: declined: what counts as a finding's own commit is defined once, in `ownCommit`, and the three sites only filter the round's commits through it, so a change to that rule is one edit; a shared map would add an argument to `outcomesFor` and change no behaviour · decided by: redline
- **R3-7** isDeferral rebuilds every finding's dispositions, now with plannedFiles, to read one undecided finding: declined: For a finding nobody decided, effectiveDispositions() returns the shaper's own entry unchanged, so the call gives the same answer as reading shaped.findings directly, at the cost of a few dozen object copies per stop over a handful of entries, and reading through the one function that applies the overrides keeps the undecided branch on the list every other reader uses · decided by: redline

### Deferred (3)

- **R1-9** A draft's version ignores the `ships` and `files` the stop now shows, so an answered draft is not raised again when they change: deferred to #104 · decided by: redline
- **R1-4** The unattended section's return example omits the now-required `files`: deferred to #105 · decided by: redline
- **R3-4** A reshape's edit to a decided deferral's task is never read, so the approver keeps seeing the first resolve's files: deferred to #106 · decided by: redline

### Fixed (23)

<details>
<summary>With the commits that fixed each</summary>

- **R1-2** The approver's file-list bounce reads the shaper's files for a finding the person decided: fixed in d1aba94 · decided by: redline
- **R1-10** deferralIds counts a decided call that a reshape re-sorted to defer, so its planned fix is no longer demanded: fixed in 917edb0 · decided by: redline
- **R1-11** A person's override to fix is no longer demanded when the resolve agent returns a filled entry for it: fixed in cfb4a1c · decided by: redline
- **R1-1** Known limits does not say an uncounted mitigation commit goes unreviewed: fixed in 504ebce · decided by: redline
- **R1-3** Stray space before a comma in the plan dial's field list: fixed in a94636b · decided by: redline
- **R1-5** New module-level `filled(item)` is shadowed by a local `filled(s)`: fixed in a92f41b · decided by: redline
- **R1-7** A mitigation's words are hidden whenever the record says nothing ships, contrary to the comment and the docs: fixed in 812bad0 · decided by: redline
- **R1-8** draftsOf's default parameter names a const declared about 150 lines later: fixed in ddf0eed · decided by: redline
- **R1-12** The decided form of the "commit of its own" warning is pinned by no check and described by no doc: fixed in efcadce · decided by: redline
- **R2-7** The result's deferred entry reads empty words as 'nothing shipped', so the closing summary drops a mitigation that shipped: fixed in 6eec2c8 · decided by: redline
- **R2-8** An override to fix or accept keeps the resolve agent's stray deferred entry in the list the approver and the implementer are shown: fixed in c4ae920 · decided by: redline
- **R2-1** The standard's done rule still says a deferral with a mitigation buys the next round with or without a commit: fixed in c5c1862 and f8dbd3b · decided by: redline
- **R2-2** No check pins an accept override beside a filled resolve entry, the neighbour R1-11's comment names: fixed in 51c9767 · decided by: redline
- **R2-3** DEFERRED_SCHEMA's comment says the mitigation is never read to decide, but isDeferral decides from it: fixed in ef0f064 · decided by: redline
- **R2-4** The plan-dial stop returns a deferral's words when nothing is planned, against R1-7's new 'shown only beside a mitigation that ships': fixed in c36df26 and f8dbd3b · decided by: redline
- **R2-5** FILES_ASK's 'an empty list when it has no task' gives an ask a different meaning from the ask-rules block's 'the paths its task would touch': fixed in 5f0d197 · decided by: redline
- **R2-9** shaperPlanned is redundant inside plannedFiles: fixed in 70cbe01 · decided by: redline
- **R2-11** The implementer is still shown the shaper's files for a decided deferral's old disposition: fixed in 0a6ee87 · decided by: redline
- **R3-1** The plan dial still says an empty deferredPlanned mitigation means nothing ships: fixed in 61e0844 · decided by: redline
- **R3-2** The end-of-run stop calls a committed mitigation with empty words 'a planned change': fixed in 55cb11e · decided by: redline
- **R3-3** The closing summary and the draft stop print words that say nothing ships beside a mitigation that shipped: fixed in 4f23088 · decided by: redline
- **R3-5** Three comment lines this pull request added run far past the file's wrap: fixed in 1e585de · decided by: redline
- **R3-6** plannedTask and plannedFiles read one fact about a decided finding two ways: fixed in accf502 · decided by: redline

</details>

### Candidates set aside in round 3 (1)

<details>
<summary>Refuted, collapsed or already tracked</summary>

- `workflows/redline-loop.js:3831` · Already tracked in #99, nothing missing. `isDeferral` now treats any filled `mitigation`, including 'none' or 'n/a', beside a call's planned fix as the person's deferral. `needCommits` then drops that fix's commit through `deferralIds`. · known: #99: a filled resolve entry (`none`, `n/a`) beside a call planned as a fix is read as the person's deferral, and its fix commit drops out of needCommits. #99 tracks this, and this pull request's comment on #99 covers the lost demand. The strayWorded loop test pins it as intended, and round 1 set the same candidate aside as known.

</details>

### Commits

- f855c8c redline: save review round 1 spec for PR #103 (#100)
- d1aba94 redline: R1-2 show the plan approver the files the workflow reads for a decided deferral (#100)
- 917edb0 redline: R1-10 demand a decided call's fix that a reshape re-sorted to defer (#100)
- cfb4a1c redline: R1-11 read an override's own disposition when deciding whether it is a deferral (#100)
- 504ebce redline: R1-1 say that an uncounted mitigation commit is read by no Redline pass (#100)
- a94636b redline: R1-3 remove a stray space before a comma in the plan dial (#100)
- a92f41b redline: R1-5 rename the deferred entry's filled test so no local helper shadows it (#100)
- 812bad0 redline: R1-7 say a mitigation's words are shown only beside one that ships (#100)
- ddf0eed redline: R1-8 pass the files reader at every call of draftsOf (#100)
- efcadce redline: R1-12 pin and document the decided form of the commit-of-its-own warning (#100)
- dd1bf10 redline: R1-6 remove the deferred outcome's unreachable mitigation fallbacks (#100)
- d675667 redline: record what PR #103 round 1 taught in the agent and testing standards (#100)
- 363e445 redline: record the as-built notes for PR #103 round 1 (#100)
- 33c12ba redline: save review round 2 spec for PR #103 (#100)
- 6eec2c8 redline: R2-7 say in the result's deferred entry whether a mitigation shipped, and read it in the closing summary (#100)
- c4ae920 redline: R2-8 drop the resolve agent's entry beside an override that does not defer (#100)
- c5c1862 redline: R2-1 say in the done rule's comment that a deferral buys a round only through its own commit (#100)
- 51c9767 redline: R2-2 pin an override to accept beside a filled resolve entry (#100)
- ef0f064 redline: R2-3 say in the deferred schema's comment that isDeferral reads the field as filled or empty (#100)
- c36df26 redline: R2-4 name the plan dial's list where the words are said to be shown only beside a mitigation that ships (#100)
- 5f0d197 redline: R2-5 ask an ask for the paths its recommended change would touch (#100)
- 70cbe01 redline: R2-9 read the shaper's own list in plannedFiles with no second test of it (#100)
- 0a6ee87 redline: R2-11 show the implementer the files the workflow reads for a decided deferral (#100)
- f8dbd3b redline: record what PR #103 round 2 taught in the agent standard, finishing R2-1 and R2-4 (#100)
- 96f014f redline: record the as-built notes for PR #103 round 2 (#100)
- 933e169 redline: save review round 3 spec for PR #103 (#100)
- 61e0844 redline: R3-1 say in the plan dial's field list that deferredPlanned holds the shaper's words as written (#100)
- 55cb11e redline: R3-2 call a mitigation with empty words a change in its own commit at the end-of-run stop (#100)
- 4f23088 redline: R3-3 state what shipped from ships first and the words after it, in the draft stop and the closing summary (#100)
- 1e585de redline: R3-5 rewrap the comments above draftView and isDeferral at the file's width (#100)
- accf502 redline: R3-6 read a decided finding's planned task through plannedFiles alone (#100)
- 17ff44a redline: record what PR #103 round 3 taught in the agent standard (#100)
- cb7fdc1 redline: record the as-built notes for PR #103 round 3 (#100)
