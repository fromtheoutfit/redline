# PR #127 review round 5 — Shaping Notes

Shaped by Redline in unattended mode, for review round 5 of PR #127 (issues #105, #75 and #126; template v7, plugin 0.5.0), from the round's three findings (`redline/round-5-review.json`, `redline/round-5-findings.json`). Line numbers are at `10f2630`, the head of the branch.

## Scope

The round's three findings, nothing more:

- R5-3 (correctness, low, `sameClassAs` R4-4): a decided call that a reshape newly leaves to the person keeps its `fix` or `accept` disposition beside the new `rule`, so the plan approver's next pass and the implementer are shown both.
- R5-1 (nit, low, `sameClassAs` R1-3): on a review that was not asked for links, two warnings (a key beside `findings`, a link to a renamed id) give a reason for clearing the link that is not the real one.
- R5-2 (nit, low): the R4-2 warning and the R1-4 relabel warning fire for a finding already decided, whose call is never shown again, and say a draft is not kept while the decision's own draft is filed.

`.claude/redline.json` declares no `askRules`, so no repository ask rule covers any finding. In this repository the plugin's source is repository content (rule 7), and none of the three touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text, so none is deferred under point 11 and none is a call on one of Redline's own files.

No open issue tracks any of the three. `scripts/redline-gh.sh issues-search` for `reshape left`, `sameClassAs`, `forceAskRules` and `warning` listed #28, #66, #70, #109, #115, #119, #121 and #128. #115 is how a call answered in the person's own words is shown, by what the resolve agent stated; R5-3 is a picked or named disposition that a reshape newly leaves, a different reader. #119 is the paths rules on a resolve's task. None of the others is one of these. Round 4's `shape.md` (`agent-os/specs/2026-11-25-1418-127-review-round-4/shape.md`) disposes of R4-1 to R4-4 only.

Every finding is `fix`. No `decline`, `defer` or `ask`.

## Decisions

### R5-3: a decision a reshape newly leaves to the person is given what a resolve gives a left decision, through one helper — fix

Confirmed by reading `workflows/redline-loop.js` at `10f2630`.

- `resolveWith`, for a finding not forced, gives a picked option's end to the decision (4633-4640): `decision.disposition = option.ends`. Autopilot's `autopilotDecision` (1705-1714) names `option: call.recommended`, so it takes the same path.
- For a forced finding, the block at 4663-4671 drops any disposition other than `defer`, with the warning `<pass>: <id> is left to the person under <rule>; the disposition "<d>" is not applied`. It then sets `rule` and, for Redline's own files, `own`. A forced pick never gets a non-defer disposition at all (`!forced || option.ends === 'defer'`, 4638), so no warning fires for one. The loop test pins that (`tests/loop-test.mjs:4789`, "a pick on a call left to the person keeps no disposition and warns of none").
- The R4-4 loop after the reshape's `vetShape` (4996-5004) handles a decided call that this reshape newly left. It sets `rule` and `own` "as resolveWith gives a left decision", and nothing else. A pick that ended in `fix` or `accept` before the finding was forced keeps that disposition.
- The plan approver's next pass is shown `roundDecisions` whole (`planPrompt`, 2524), and so is the implementer (2602).
  - `agents/redline-plan-approver.md` rule 1 says a decision carrying `rule` has a `Left to the person` task with no files.
  - Its rule 6 says "a disposition the person overrode (`disposition` in the decision) is the one the plan must follow", and that a picked option's `disposition` is followed "the same way".

  So the approver is given two readings of one finding. The comment at 2446-2448 ("the one decision carrying `rule` that also carries a disposition, since resolveWith keeps no other on one") is false after that loop.
- What bounds it, read:
  - `needCommits` drops forced ids (5200);
  - `isDeferral` reads `leftDeferred` (4916), which needs `defer`;
  - the R4-4 hold (5060-5068) refuses a left task with files.

  So nothing is demanded and nothing under the rule is built. The harm is an approver that can bounce a correct left task as a missing fix, spending an adjustment.

- **Proportionality.** Likelihood: low. It needs a call answered by a pick (or autopilot) that ends in fix or accept, or a disposition named for a call, then a bounced plan whose reshape newly puts the finding under a rule. Impact when it fires: the approver sees a fix and a left task for one finding and may bounce, toward the adjustment cap; nothing wrong is built or posted. Cost: one helper of about ten lines in `workflows/redline-loop.js`, two call sites, a comment, loop cases and one sentence of `docs/running.md`. Every file is one the pull request changed.
- **Instance or class.** The verifier links this finding to R4-4, so the question is answered: a class, closed `one-place`. R4-4's `why` was "the hold after each reshape is the one place a decided finding's task is read again". Its loop then copied part of `resolveWith`'s left treatment into the approve loop. The cause is that treatment kept in two places, one copy short: the drop of a non-defer disposition. The cause lives in `workflows/redline-loop.js`. The fix moves the treatment into one helper, `leaveDecision`, which `resolveWith` and the reshape loop both call, so every decision that becomes left gets the same fields whatever path made it left. The members are every way a decision becomes left, and what it carries after. They were found by reading, since node is refused to the shaper (round 4's Unattended answers, item 5).
  1. A call left at the first shape, applied by a resolve: `resolveWith`'s block: holds.
  2. A call a reshape raises for a finding nobody decided, applied by a resolve: `resolveWith`'s block: holds.
  3. A disposition override a reshape newly forces: `forceAskRules` gives it a call, which is `raised` and applied again by `resolveWith`: holds.
  4. A decided call a reshape newly leaves, its decision a pick or autopilot's take that ends in fix or accept: exposed, closed here.
  5. A decided call a reshape newly leaves, its decision a disposition named as fix or accept (`forcedNamed`, `tests/loop-test.mjs:4047`): exposed, closed here.
  6. A decided call a reshape newly leaves, its decision a deferral, named or picked: holds; `defer` is kept, `leftDeferred` reads it and its draft is filed (`namedLater`, 5062).
  7. A decided call a reshape newly leaves, its decision in the person's own words: holds. It carries no disposition. What the resolve agent stated lives in `stated`, which no prompt shows and `needCommits` reads only for ids not forced (`forcedLater`, 4040).
  8. A decided finding left before the reshape: it was forced when its resolve ran, so member 1's block gave it the fields: holds.

  One helper both paths call closes 4 and 5 and keeps 1 to 3 and 6 to 8 as they are.
- **Unattended answer: does a pick's dropped disposition warn?** No. `resolveWith` never warns for a pick on a left finding, and the loop test pins that (`tests/loop-test.mjs:4789`). The helper warns only when the decision names no option, which is exactly when `resolveWith` warns today. So the resolve path is unchanged, and the reshape path gives a named fix or accept (member 5) the same warning a typed one has always had.
- **The change.** Task 2.

Decided by: redline

### R5-1: a review that was not asked for links clears every link it returns with the one true reason — fix

Confirmed by reading `workflows/redline-loop.js` at `10f2630`.

- `linksAsked` is false on the first review of a pull request with no earlier round (`showsEarlier`, 1910; 3159). That review gets `REVIEW_SCHEMA`, built by `reviewSchema(false)`, which sets no `additionalProperties: false` (909-923). So a key beside `findings`, a link on a finding in any form, and a link to a renamed id can all reach the workflow on that review.
- The block at 3219-3222 warns that a top-level `sameClassAs` sits "where the workflow does not read it; a link is a key of its finding (findings[].sameClassAs), so no link is kept from it". That implies a link on a finding would be kept, and on this review it would not.
- The rename loop at 3229-3247 runs whatever `linksAsked` is and calls a link to a renamed id "ambiguous".
- `honourLinks`' form check (3114-3116) runs before its `!asked` reason (3119). So a link that is no list of ids is cleared as "no list of finding ids", which a well-formed list on the same review would be cleared for anyway.
- Only after all of these does `honourLinks` give the real reason, "this review was shown no earlier finding", and only for a well-formed list.

- **Proportionality.** A nit: a warning's reason, with no change to what is kept. Cost: one function in `workflows/redline-loop.js` of about twenty lines, one guard around the two blocks and the `honourLinks` call, one parameter removed from `honourLinks`, loop cases and one clause of `docs/running.md`.
- **Instance or class.** The verifier links this finding to R1-3, so the question is answered: a class, closed `one-place`. agents.md line 16 records R1-3 as "a cleared link's reason is true on every path that clears it". The cause is that every reader of a link reads it before anything asks whether this review was asked for links; the question is asked last, per id, inside `honourLinks`. The cause lives in `review()` in `workflows/redline-loop.js`. The fix asks it once, first: on a review not asked for links, one function clears every link the review returned, with the one reason, and the three readers run only on a review that was asked. The members are every way a link can reach the workflow on a review not asked for links, found by reading:
  1. A list of ids on a finding: holds; cleared per id as "this review was shown no earlier finding" (`tests/loop-test.mjs:5310`). Its words are kept.
  2. An empty list on a finding: holds; dropped with no warning.
  3. `sameClassAs` beside `findings`: exposed, closed here.
  4. A link that names an id this review renamed: exposed, closed here.
  5. A link that is no list of ids (a string, a list holding a number or an object): exposed, closed here.
  6. A review that was asked for links: unchanged; its readers keep their reasons (`BESIDE`, `UNREADABLE`, `renamedLink` and the `CLEARED` cases, all on round 2).
  7. The revise-only pass (6074): unchanged; it passes its own `noRecord` reason (R1-3).
- **The change.** Task 3.

Decided by: redline

### R5-2: forceAskRules gives no call-shaped warning for a finding already decided — fix

Confirmed by reading `workflows/redline-loop.js` at `10f2630`.

- `vetShape` runs `forceAskRules` on every shape and reshape (4434) and passes it nothing about the round's decisions. `checkDrafts` (3898-3899) and `checkCauses` (3789) get `decided` and skip those ids: "the decision stands whatever the reshape lists, so a restatement is not held to a draft of its own" (3895-3897).
- The R4-2 warning (4043-4045) and the R1-4 relabel warning (4088-4090) describe the call the person is about to be shown: the draft "is not kept as an option of its call", and "its call keeps the options the shaper wrote".
- For a decided finding, that call is never shown. Its id is in `calls`, so `raised` (5074) leaves the reshape's copy out, and no resolve applies it again.
- For a decided deferral, `stillDeferred` keeps the resolve's entry at the rebuild (5080-5091), `leftDeferred` (4592) reads it, and that draft is filed. So the person is told a draft is lost while the run files the decision's draft.
- The same holds for a finding left and decided at the first shape that a later reshape returns as `defer` with a short entry: its call was decided and is not raised again.
- On the first shape the round has applied no decision (`decided` is `[]`), so a relaunch with the person's answers still warns about the call they were shown. That warning is true.

- **Proportionality.** A nit: two warnings that describe a call nobody will see. Cost: one parameter on `forceAskRules`, two conditions, one comment, loop cases and one clause of `docs/running.md`.
- **Instance or class.** The cause lives in `forceAskRules` in `workflows/redline-loop.js`, the one place a call is built or relabelled for a left finding. It is not told which findings the round already decided, so its warnings about that call fire for a call that will not be shown. One parameter, read as `checkDrafts` reads it, closes every such warning at once: `one-place`. The members are every warning `forceAskRules` gives, set against a decided finding, found by reading:
  1. `the shaper sorted <id> as <d>; repository rule <r> makes it an ask for the person` (4025): holds; the finding is left from then on, whoever decided it.
  2. R3-6 and R4-1's `the shaper asked about <id> because of repository rule <r> ... it is left to the person under ...` (4001-4006): holds; true for a decided finding.
  3. `the shaper tagged <id> with ask rule ... which .claude/redline.json does not declare; ignored` (4011): holds; about the tag, not the call.
  4. R4-2's `... the draft is not kept as an option of its call, since only a complete one is` (4044): exposed, closed here.
  5. R1-4's `... and its call keeps the options the shaper wrote` (4089): exposed, closed here.
- **The change.** Task 4.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)"; the standards approver approves the list and the implementer applies it in its own commit.

### As built deviations

`plan.md`, "As built", "Deviations", records three. None changes a decision above:

- where Task 2's `forcedLater` neighbour sits;
- the two copies of the prompt reader in the loop test;
- how Task 3's empty-list mutation is written.

## Declined

None.

## Deferred

None.

## Unattended answers

1. **R5-3: is a decision a reshape newly leaves shown without its fix or accept?** Yes.
   - The comment at `workflows/redline-loop.js:2446-2448`: "the one decision carrying `rule` that also carries a disposition, since resolveWith keeps no other on one".
   - `agents/redline-plan-approver.md` rule 1: "When that decision also carries `disposition` `defer`, the person deferred the finding to an issue (#126)". That is the only disposition the file pairs with `rule`.
   - The PR description: "A finding left to the person is shown to the plan approver and the implementer as the shaper returned it, whatever its decision names."

   So the code disagrees with the stated answer, and the disagreement is the fix.
2. **R5-3: does the helper warn for a pick?** No, as `resolveWith` does not (`tests/loop-test.mjs:4789`); it warns for a named disposition, as `resolveWith` does (`tests/loop-test.mjs:4792`, `4945`, `1663`).
3. **R5-1: which reason is the real one on a review not asked for links?** `honourLinks`' own, "this review was shown no earlier finding" (`workflows/redline-loop.js:3119`). The comment above `reviewSchema` (900-908) says why the review is not asked: "the first review of a pull request with no earlier round is the call it was before #75 and replays".
4. **R5-2: skip the warnings or reword them?** Skip. `checkDrafts`' comment (3895-3897) gives the rule for a decided finding on a reshape: "the decision stands whatever the reshape lists". The reviewer's proposed rewording ("the draft its resolve wrote is the one filed") would be false for a decided fix or accept, where nothing is filed.
5. **Measurement.** The node harness is refused to the shaper, as round 4 recorded. No reviewer reproduction was written for this round (`/tmp/redlinerepro/` holds none for r5). Every fix is `one-place`, each with its members found by reading and listed in its entry. Each task's new loop cases are the code's measurement, seen red then green through the gate.
6. **Self-hosted.** This round edits `workflows/redline-loop.js`, which the PR's caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"). No agent file changes.
7. **Replay.** Task 2 changes the plan approver's and the implementer's prompts only after a reshape that newly leaves a decided fix or accept. Tasks 3 and 4 change warnings only, which reach no prompt. Every other prompt is byte-identical (replay.md, the file's opening line).
8. **Version.** Stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No template body changes, so the marker stays v7.
9. **Visuals, product context.** None; `agent-os/product/` does not apply to a review round.

## Context

- **Visuals:** None.
- **References:** `workflows/redline-loop.js` (`resolveWith`, the approve loop's reshape, the R4-4 loop and hold, `leftDeferred`, `isDeferral`, `needCommits`, `planPrompt`, the implementer's decisions line, `resolvePrompt`'s `anyLeftDeferred`, `review()`'s link section, `honourLinks`, `reviewSchema`, `showsEarlier`, the revise-only pass, `forceAskRules`, `checkDrafts`, `checkCalls`, `vetShape`), `tests/loop-test.mjs` (the `filing:`, `left:`, `class:` and `places:` sections; the mock shaper's `reshapeDefer`, `reshapeDrafts`, `reviewKeys` and `acceptedCalls`), `agents/redline-plan-approver.md`, `docs/running.md`; round 4's spec folder. See `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- workflow/agents: line 10 (a class an earlier round fixed is fixed as the class; R5-3, R5-1), line 11 (`forceAskRules` applies the rules; R5-2, R5-3), line 16 (a message says when it fires in the words of the decision behind it; a cleared link's reason is true on every path; R5-1, R5-2, and R5-3's warning for a named disposition).
- workflow/replay: prompts before every stopping point are unchanged, except the plan approver and implementer after a reshape that newly leaves a decided fix or accept (R5-3).
- testing/tests: line 30, a case per changed surface with its neighbour; line 35, red before green, and a pin that already holds is seen red under a mutation.
- process/docs-gate: every task touching `workflows/` names its docs section.
- process/release: no version bump in a review round.
- prompts/attribution: no model or vendor name anywhere.

## Standards retrospective (proposed)

1. `agent-os/standards/workflow/agents.md`, line 10, append: "; and a one-place fix that copies part of a treatment from the place it already lives moves the treatment into one function both call, since a copy is a list kept in two places: R4-4 gave a decision a reshape newly leaves to the person the rule `resolveWith` gives a left one, and not the drop of a fix or an accept that comes with it, so the plan approver was shown a left decision with a fix (#127, R5-3)".
2. `agent-os/standards/workflow/agents.md`, line 11, append: "; and `forceAskRules` is told which findings the round already decided, as `checkDrafts` is, and gives no warning about the call it builds or relabels for one, since a decided finding's call is not shown again (#127, R5-2)".
3. `agent-os/standards/workflow/agents.md`, line 16, after "until #127, R1-3", insert: "; and whether a link was asked for at all is checked before any other reading of it, so a review that was not asked for links clears every link it returns, in any place or form, with that one reason (#127, R5-1)".
4. `agent-os/standards/testing/tests.md`: no change. The new cases are instances of lines 30 and 35.
5. `agent-os/standards/process/docs-gate.md`: no change.
