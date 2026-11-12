Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 6 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 4 (pr): 1 correctness, 1 nit; 5 commits; spec `agent-os/specs/2026-11-11-1952-86-review-round-4`
- Round 5 (fix-diff): 0 correctness, 4 nit; 7 commits; spec `agent-os/specs/2026-11-11-1952-86-review-round-5`
- Round 6 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-11-1952-86-review-round-6`

### Earlier rounds

- **R1-1** The known-finding section's opening sentence was not narrowed to 'in full': already handled in round 1: fixed in e815af8 (redline: R1-1 open the reviewer's known-finding check on what is already tracked in full (#85)). · decided by: redline
- **R1-2** The handoff's 'last covered round, not the last round with drops' rule is only half pinned: already handled in round 1: fixed in 049ec27 (redline: R1-2 pin that the handoff carries the last covered round's dropped block, not the last round with drops (#85)). · decided by: redline
- **R1-3** droppedBlock repeats personLine's line template by hand: already handled in round 1: fixed in 564d349 (redline: R1-3 build the dropped-candidate line with personLine (#85)). · decided by: redline
- **R1-4** The accounting sentence invites a finding ref that names the issue, and the exact-id match rejects it: already handled in round 1: fixed in 174000d (redline: R1-4 say where a partly tracked candidate's issue is named, since a finding ref is the finding's id alone (#85)). · decided by: redline
- **R2-1** The partly tracked rule says a diff-caused remainder is a finding without saying the other rules still apply, which contradicts the removed-guard rule: already handled in round 2: fixed in 890ac40 (redline: R2-1 say a partly tracked remainder meets every other rule, so one caused in the diff is a finding unless another rule puts it elsewhere (#85)) and 8807864 (redline: record the round 2 review lessons in the standards, finishing R2-1 (#85)). · decided by: redline
- **R2-2** The round-record check's name claims two things the check does not assert: already handled in round 2: fixed in 2e8d556 (redline: R2-2 name the result check for what it asserts and pin the accounting the result keeps (#85)). · decided by: redline

### Decisions

- **R4-1** A duplicate ref written as the accounting sentences ask gets no target, so a duplicate of a dropped candidate can hide again: The author has the coverage accounting sentence, in the verify prompt and the agent file, say that a duplicate's ref opens with the candidate's index or the finding's id and that anything meant for the reader follows it, and keeps the widened parse that reads a leading index token as the backstop, with prompts under coverage off left byte-identical. · decided by: @michaelfromtheoutfit
- **R4-2** The duplicate-target parse has no check for `index N`, any case, a self-reference or an out-of-range index: fixed in 82bdccb · decided by: redline
- **R5-1** No escaping case puts `&` inside a code span, so 'a span is left as written' is pinned for `<` only: fixed in c6a5b0e · decided by: redline
- **R5-2** The duplicate-target parse's new `\b` end anchor and its `\s+` have no case that turns on them: fixed in 021e3c1 · decided by: redline
- **R5-3** LISTED_ELSEWHERE's comment says a `finding` entry covers Already tracked, but those candidates are `known` and set aside: fixed in f9fd6b4 · decided by: redline
- **R5-4** A duplicate of a candidate that became a finding names the target's place and outcome, but not the finding's id: fixed in 22944c6 · decided by: redline

### For the person

- `workflows/redline-loop.js:896` · Coverage candidate 2, plausible but not rendered here (the markdown API is refused to the reviewer). blockText escapes only `&` and `<`, so a bare `@word` outside backticks in a finder's summary, such as `@param`, `@click` or a Blade `@csrf`, is a live mention in every round body and the handoff. GitHub notifies that account. Before this PR only an unaccounted or misaccounted candidate's summary reached GitHub raw; the block now posts every set-aside one. Decisions 4 and 10 escape `&` and `<` only, so whether the block should also neutralise `@` is yours to decide.
- `workflows/redline-loop.js:911` · Coverage candidate 6, true and cosmetic. Outside a code span, a backslash before `<` or `&` becomes `\&lt;` or `\&amp;`. CommonMark reads `\&` as an escaped ampersand, so `\<word\>` shows as `&lt;word>`. Unescaped, it would show `<word>`, so neither version reads as written. Also escaping `\` outside spans would fix it, but on its own it is not worth a plan task.
- `workflows/redline-loop.js:2146` · Coverage candidate 8, plausible but not reproduced. It widens round 2's For the person note on that round's candidate 2 from drops to collapses. The block now posts each settled, known and duplicate entry with its ref, so a later pass that reads earlier bodies (CLAUDE.md's check-before-reporting rule) could take a wrong collapse as settled. One sample points the other way: this round's pass read rounds 1 and 2's bodies and re-raised, with reasons, two candidates they had ruled on (candidates 4 and 8) instead of leaving them out.
- `workflows/redline-loop.js:2148` · Coverage candidate 1, traced: the block skips every `forThePerson` entry on trust that a For the person line exists. A verifier that accounts a candidate as forThePerson but writes no line leaves it as a count only. That trust is #79's accountCoverage (line 1373), not this PR, and since For the person lines carry no index there is no exact check. A count check (fewer lines than forThePerson entries gives a warning) is the cheap alternative.
- `workflows/redline-loop.js:912` · Coverage candidates 2 and 5, plausible but not reproduced here (the markdown API and node are refused to the reviewer). In CommonMark a link's destination or title is parsed at `]`, before a backtick inside it is paired, so in '[a](/u "`") </details> `' blockText pairs that backtick with the last one and leaves `</details>` raw. With round 4's lone CR, this is a second gap in the hand-written pairing model. The docs' 'no tag ... can end the block' is stronger than the code. Candidate 5's alternative: keep a span unescaped only when the text holds none of `[`, `\r`, `\` or a newline, and escape the whole text otherwise.
- `workflows/redline-loop.js:863` · Coverage candidate 10: the set-aside block has no heading of its own. In a round with no For the person entries it follows straight after Already tracked or Findings in the body, and after Rounds in the handoff, so a reader scanning headings sees it inside that section. docs/running.md places it 'after For the person'. Whether it gets its own heading, or sits under For the person always, is a copy choice.

<details>
<summary>Candidates set aside in round 5 (3): collapsed, already tracked or dropped</summary>

- `workflows/redline-loop.js:2130` · When the reviewer returns a bare-number finding id, the id rename also rewrites a `duplicate` ref with the same text. A bare index, which R4-1 made the documented first form of a duplicate ref, becomes a finding id, and the duplicate's real target is lost. · disproportionate: Conditions: the reviewer must return a malformed finding id that is a bare number, and the same round must account for a duplicate by a bare index equal to that number. In that case the ref really is ambiguous between the two. Round 2 ruled the same rename path disproportionate.
- `workflows/redline-loop.js:2156` · Duplicate refs are not checked the way `finding` refs are. Two candidates marked as duplicates of each other collapse into nothing, and the count sentence still says they collapsed into findings already reported or settled. · disproportionate: Conditions: the verifier must collapse two candidates into each other, with neither collapsing into a finding. Even then both still show in the block, each with its own summary and '(candidate N, ...: duplicate)', so neither is hidden; only the count sentence's group name is wrong for them.
- `workflows/redline-loop.js:912` · Altitude: the escaping depends on a hand-written model of GitHub's inline parser (backtick runs, plus fallbacks for `\n` and backslash-backtick). Every construct the model leaves out (link destinations and titles, lone `\r`, backslash escapes) is a separate hole, each patched one special case at a time. · duplicate: 2; same cause, blockText's hand-written model of GitHub's inline parser. The simpler rule it proposes is on candidate 2's For the person line.

</details>

### Commits

- 49434ca redline: save review round 4 spec for PR #86 (#85)
- 82bdccb redline: R4-2 pin each form of a duplicate's ref that the target parse reads or shows as written (#85)
- ee7fbbe redline: R4-1 have a duplicate's ref open with the index or the id, and read a leading index as its target (#85)
- 81ac40e redline: record the round 4 review lessons in the standards (#85)
- dd42671 redline: record PR #86 round 4 as built (#85)
- 96953bc redline: save review round 5 spec for PR #86 (#85)
- c6a5b0e redline: R5-1 pin an ampersand inside a code span of the set-aside block as written (#85)
- 021e3c1 redline: R5-2 pin the duplicate-target parse's word boundary and its space after candidate (#85)
- f9fd6b4 redline: R5-3 say that a candidate behind an Already tracked finding is set aside as known (#85)
- 22944c6 redline: R5-4 name the finding's id on a duplicate of a candidate that became a finding (#85)
- 6ecc028 redline: record the round 5 review lessons in the standards (#85)
- 1a715c1 redline: record PR #86 round 5 as built (#85)
