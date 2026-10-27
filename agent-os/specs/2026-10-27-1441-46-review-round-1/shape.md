# PR #46 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #46, which closes issue #35 ("Known-finding check: a recorded finding with no disposition is carried forward, not skipped as already tracked"). This round covers its five findings and nothing else, all in `workflows/redline-loop.js`:

- **R1-1** (correctness, low, confirmed): `review()` keeps a reviewer's `carriedFrom` on a re-review's or final nit pass's finding (line 1493). **Fix.**
- **R1-2** (correctness, medium, confirmed): a finding with both `carriedFrom` and `knownAs` counts as carried, but is then skipped as known (line 1517). Returned as a **judgment call**, decided on 2026-10-27 by @michaelfromtheoutfit: option (B). **Fix.**
- **R1-3** (correctness, low, confirmed): the fallback carry's id `R<round>-<count+1>` can duplicate a reviewer id when the reviewer's ids skip a number (line 1533). **Fix.**
- **R1-4** (correctness, low, confirmed): an earlier thread stays open as `no reply posted` when its carrying finding sits in the review body (line 2177). **Fix.**
- **R1-5** (nit, low, confirmed): the handoff calls a finding an earlier run carried `already handled` and quotes its stale reply (line 2210). **Fix.**

## Unattended answers

- **Scope.** The five findings in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-1-findings.json` and `redline/round-1-review.json` in this folder.
- **Visuals.** None. The change is the workflow script, its harness and one README paragraph. GitHub's review, thread and handoff views are the only screens.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** `agent-os/product/mission.md`: "nothing an agent does is hidden from the review thread" (Problem) and "**Decisions stay with people.**" (Solution). Each fix keeps what the run posts true. R1-2's options are weighed against both lines, and neither settles it on its own.
- **Standards.** These apply:
  - `workflow/agents`: line 23, the #35 bullet; line 27, the #39 sweep; line 14, a message says when it fires in the words of the decision behind it; judgment calls returned, never decided; an owner on every decision.
  - `testing/tests`: line 6, the loop-test carry-forward scenario; line 9, a fix pinned at a second call site; a tested surface gains a case; red before green.
  - `workflow/replay`: line 12, `args.priorFindings`; no fix reads the clock or GitHub.
  - `prompts/attribution`, `process/standards-retrospective`, `process/internal-notes`.

  `scripts/bash-conventions` and `scripts/guard` do not apply: no option touches a script or the guard.
- **Already known?**
  - `scripts/redline-gh.sh issues-search "carriedFrom"` and `issues-search "knownAs"` return nothing. `issues-search "carry forward"` returns only #35, the issue this PR closes. `issues-search "resolve threads"` returns nothing. `issues-search "handoff"` returns #35 and backlog issues #2, #14, #19, #20, #23 and #27, none of which covers these findings.
  - `redline-gh.sh pr-comments 46` shows only this round's review.
  - This folder is the PR's first review-round folder.

  All five findings are new.
- **Reproductions.**
  - The reviewer wrote `/tmp/redlinerepro/reviewer-r1-repro.mjs`, a node script with one scenario per finding on the loop-test mock. The guard refuses `node` to the shaper (`redline-guard (shaper): 'node' is not available to the shaper`), so the shaper traced every scenario by reading the code instead.
  - The shaper wrote no scratch test. This repository has no PHP and no Pest, and every finding settles by reading.
- **R1-1: is it real?** Yes.
  - `review()` trims `carriedFrom` on every finding (`workflows/redline-loop.js:1487`). Its else branch (1492-1495) resets only `out.carried` and `out.resolved`.
  - The finding's `carriedFrom` then drives three outputs:
    - the `### Carried forward` heading and the `first reported as` suffix (`reviewBody` 600-612, `findingLine` 587);
    - the inline note (`commentBody` 629-631);
    - a reply in the earlier thread (`carriedReplies` 719-723, which needs only `priorById[f.carriedFrom]`, true for any prior id).
  - Round 3's reply in R1-2's thread is in round 3's `replyIds`, not in round 2's candidate (`threadCandidates` 2171-2180). So `resolve-threads` meets a comment that is not in its list, and `sweepThreads` reports it as `a reply after Redline's` (2255).
  - `history()` passes each finding's `carriedFrom` to later reviewers (`compactFinding` 1385-1387, `history` 1389-1398).
  - The same else branch also runs for a first-round `pr` review with no earlier findings, so the fix covers that entry too.
- **R1-1: does the spec answer it?** Yes. The original plan's decision 10 (`agent-os/specs/2026-10-27-1345-35-carry-forward-undispositioned-findings/plan.md:24`): "**Only the run's first round carries** (the whole-PR review). Re-reviews, final nit passes, `redline-revise round N` and human review passes are unchanged; `carriedFrom` defaults to `""` there." The shape.md's decision 9 says the same (`shape.md:25`). The code disagrees by keeping a reviewer's value, and that disagreement is the fix.
- **R1-2: is it real?** Yes.
  - `reconcilePrior` (1504-1544) counts a finding with a valid `carriedFrom` as carried (1517) and never reads `knownAs`.
  - The main loop puts every finding with a `knownAs` in `known` and leaves it out of `active` (2468-2469). So R2-1 gets no inline comment and no `first reported as` suffix, and is listed only under `### Already tracked` (619).
  - With no active finding, the round ends through `replyStandalone` (2519-2522). `droppedReplies` and `resolvedReplies` (1673-1703) have nothing to answer, so R1-2's thread gets nothing.
  - `earlierRoundsLines` still writes `carried forward as R2-1` (2207). `threadCandidates` leaves R1-2 open as `not settled` (2178).
  - `prior-findings` reads `carried_from` only from a finding line (`scripts/redline-gh.sh:343`), and the Already tracked line has no ` · ` after its id. Since R1-2 has no reply either, the next run reads it as `none` again.
- **R1-2: does the question arise?** Yes, in two shapes.
  - The reviewer's prompt gives tracked findings to `knownAs` and carry-forward ones to `carriedFrom` (`reviewPrompt` 847-850). A `knownAs` naming the very id it carries contradicts that split.
  - The prompt also says "A known finding goes in knownAs" after an `issues-search` for each candidate (854), and the reviewer's first known-finding step is open issues (`agents/redline-reviewer.md:18`). The PR's expected path is `review only`, read, then `/redline:redline <pr>` (PR description; `README.md:117`). That gap leaves the author time to open an issue for a finding instead of replying, and the next run's reviewer then finds the issue.
- **R1-2: does the PR, the spec or the docblock settle it?** Only the Redline-id shape.
  - The original shape.md's decision 7: "A carry-forward id the reviewer neither carried nor resolved is carried by the loop ... rather than dropped: the issue's failure was a silent drop". A finding that is both carried and known is that silent drop.
  - Decision 6 of the same file: "Issues, teammate comments and human-review folders stay the reviewer's own free check, as today". Today a finding an open issue covers is listed as known and not acted on, as `CLAUDE.md`'s known-finding rule asks ("an open issue covering it means cite the number, not re-report it").
  - For a carried finding that an issue also covers, decisions 6 and 7 give opposite answers. The spec never weighed the combination. Choosing between them changes an assumption the original spec made, so it goes to the person. Every option fixes the Redline-id shape the same way.
- **R1-3: is it real?** Yes. The fallback id is `R${round}-${out.findings.length + 1}` (1533). `review()` renames only ids without this round's prefix (1482-1486). The reviewer is asked to number "in file order" (`agents/redline-reviewer.md:66`), but nothing checks that the ids are dense. Every per-finding map is keyed by id: `commentIds` (1585-1588), `record.outcomes` and `outcomeKinds` (1979-1980), `replyIds` (1727-1736) and `record.carried` (1542).
- **R1-3: does the spec answer it?** Yes. The original plan's Task 3 names the fallback `id R<round>-<n+1>`: the next id, which assumes dense numbering. The highest id plus one keeps that intent and gives the same id whenever the ids are dense (the existing check at `tests/loop-test.mjs:503` expects `R2-3` after `R2-1, R2-2` either way). This is a correction of the mechanism, not of the spec's assumption.
- **R1-4: is it real?** Yes.
  - A body finding has no `commentIds` entry (1585-1588), and its reply is an issue comment that reports `reply_id` 0 (`agents/redline-github.md:23`). `keepReplyIds` keeps only ids above 0 (1730), so `replyIds[newId]` is never set for it.
  - The earlier thread's own reply is a thread reply with an id, but the settle test needs both ids (2177). The candidate is unsettled with the reason `no reply posted` (2178), which is untrue.
- **R1-4: does the spec answer it?** Yes.
  - The original plan's Task 4: "settled when the carried finding's kind is fixed/deferred/decided and both replies posted".
  - Its shape.md's decision 3: the sweep names "the earlier root, any earlier Redline reply in it and this round's reply". These are the earlier thread's own ids. The new finding's reply is not among them.
  - `workflow/agents` line 27: "a body finding has no thread".
  - "Both replies posted" cannot be observed for a body finding. What the earlier thread needs, its own reply carrying the outcome, is observed. The fix keeps the two-reply test where the carrying finding has a thread and drops it where it cannot, which the spec's intent covers.
- **R1-5: is it real?** Yes.
  - `earlierRoundsLines` prefers `p.reply.body` for a tracked prior (2210).
  - `tests/gh-test.sh:219` pins R1-5 on fixture PR 14 as `["carried","R2-2","not changed in this round. Disposition fix; no commit names it. · decided by: redline"]`: carried by round 2's line while its own thread holds only round 1's reply (`tests/gh-fixtures/comments-14.json`, comment 1415).
  - With that list, the handoff line reads `already handled in round 1: not changed in this round. ...`.
- **R1-5: does the spec answer it?** Yes. `README.md:306` (the `prior-findings` row): "`carried` whenever a later round's line says `first reported as` this id, whatever its thread says". The handoff should read the same disposition the wrapper computed, not the thread's text. The original decision 9 lists the handoff forms but none for a finding an earlier run carried, so the README paragraph that lists them gains one.

## Decisions

- **R1-1: a review with no carry-forward list clears `carriedFrom`.** Fix. In `review()`'s else branch, every finding with a `carriedFrom` gets a warning, `round N: the reviewer marked R3-1 as carried from R1-2, but this review has no carry-forward list; cleared`, and its `carriedFrom` is set to `""`. The wording fits both entries to the branch, a later round and a first round with no earlier findings, as `workflow/agents` line 14 asks. Two loop-test pins, one per entry (`testing/tests` line 9). `plan.md` Task 2.
  Decided by: redline

- **R1-3: the fallback carry is numbered after the highest id in use.** Fix. `reconcilePrior` starts a counter at the highest number among this round's ids and gives each fallback the next one. One loop-test check with a gapped list. `plan.md` Task 3.
  Decided by: redline

- **R1-4: an earlier thread settles on its own reply when its carrying finding has no thread.** Fix. The settle test becomes "kind fixed, deferred or decided, the earlier thread's reply posted, and the carrying finding's reply posted when it has a thread". One line and a comment. One loop-test case with `moved: ['R2-1']`, plus a neighbour check on the two replies' routes. `plan.md` Task 4.
  Decided by: redline

- **R1-5: the handoff names an earlier run's carry by its new id.** Fix. The tracked branch of `earlierRoundsLines` checks `disposition === 'carried'` first and writes `carried forward as R2-2 in round 2`. The round is read from the id, as `commentBody` reads a `carriedFrom` (630). The reviewer proposed "in an earlier run". "In round 2" is used because it matches the existing `already handled in round 1` phrasing and names the round the teammate can open. The README's list of handoff forms gains this one. `plan.md` Task 5.
  Decided by: redline

- **Task order.** R1-3, R1-4 and R1-5 land before anything R1-2's decision brings. Every R1-2 option edits `reconcilePrior` (R1-3's function), and option (B) also edits `threadCandidates` and `earlierRoundsLines` (R1-4's and R1-5's).
  Decided by: redline

- **R1-2: a carried finding the reviewer also marks as known.** Decided on 2026-10-27: **(B) Known by an issue, answered in its thread.** The story, the options and the shaper's recommendation the person saw are kept under Judgment calls below. `plan.md` Task 6.
  - Notes: The author clears a known mark that names an earlier Redline finding so that finding is carried, and keeps a carried finding known by an issue or a comment as already tracked while answering its earlier thread with 'carried forward; already tracked in #N', because an author who opens an issue between a review-only run and a full run has made a choice to respect, and the answered thread stops the finding being raised again.
  - What it means for the plan, as option (B) states it:
    - `reconcilePrior` clears a `knownAs` naming a Redline id on a finding it counts as carried, with a warning, so that finding is posted, shaped and answered as carried.
    - A `knownAs` naming an issue or a teammate's comment keeps the finding under `### Already tracked`, with ` · first reported as R1-2` on its line, unshaped.
    - Its earlier thread gets `Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline`, from `revise()`'s batch or `replyStandalone()`, and stays open with the reason `already tracked`.
    - The handoff's Earlier rounds line reads `carried forward as R2-1: already tracked in #41`.
    - `scripts/redline-gh.sh` does not change: the reply opens `carried forward as R2-1`, which `prior-findings` reads as `carried` (`scripts/redline-gh.sh:337`, `:357`), so the next run does not raise R1-2 again.
  Decided by: @michaelfromtheoutfit

### Judgment calls

- **R1-2: a carried finding the reviewer also marks as known**
  - **Story.**
    - On Monday the author runs `review only` on their PR, and Redline posts R1-2, a real bug. The author reads it, decides it belongs to a later change, and opens issue #41 for it instead of replying.
    - On Tuesday they run `/redline:redline`. The new round's reviewer re-checks R1-2, finds it still holds, and carries it as R2-1. Its own known-finding check finds #41 too, so it also marks R2-1 as known.
    - The run counts R1-2 as carried but sets R2-1 aside as already tracked. It gets no inline comment, no shaping and no reply in R1-2's thread. The handoff says "carried forward as R2-1", and R1-2's thread stays open as "not settled".
    - On the next run R1-2 still has no answer, so it is carried again, and again after that.
    - Without any issue, the same happens when the reviewer writes R1-2 itself as the known id. Then a real bug the earlier round found is silently set aside, which is exactly what #35 set out to stop.
  - **Why it goes to the person.** A spec assumption. The original spec keeps issues and teammate comments as the reviewer's own known-finding check "as today" (its decision 6), and makes the loop carry every undispositioned finding "rather than dropped" (decision 7). It never weighed a finding that is both, and the two decisions give opposite answers. All three options clear a known id that names a Redline finding. They differ only on a known id that names an issue or a teammate's comment.
  - **Options:**
    - **(A) Carry regardless.**
      - Cost: about 6 lines in `reconcilePrior` (clear any `knownAs` on a counted carry, with a warning that quotes it), 2 loop-test checks, and one sentence in `agents/redline-reviewer.md`.
      - Effect: every carried finding is posted, shaped and answered, its earlier thread gets the carried-forward reply, and nothing repeats. A finding the author chose to track in #41 is re-posted as a finding of this PR, though, and the shaper must defer or ask it citing #41: one more item to triage each time, against `CLAUDE.md`'s rule to cite a known issue rather than re-report it.
    - **(B) Known by an issue, answered in its thread.**
      - Cost: about 35 lines in `workflows/redline-loop.js` (`reconcilePrior`; a reply entry for a known carried finding in `revise()`'s batch and in `replyStandalone()`; `threadCandidates`; `earlierRoundsLines`), about 5 loop-test checks, a sentence in `agents/redline-reviewer.md`, and one in the README's Earlier rounds paragraph. All are files the PR already changes, and `scripts/redline-gh.sh` does not change.
      - Effect:
        - A known id naming a Redline finding is cleared, so that finding is carried.
        - One naming an issue or a comment keeps the finding listed as known, and the earlier thread gets `Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline`.
        - The Already tracked line ends `first reported as R1-2`, and the handoff says `carried forward as R2-1: already tracked in #41`.
        - The earlier thread stays open with the reason `already tracked`.
        - That reply makes the next run read R1-2 as carried, so it is not raised again.
        - Both rules hold: nothing is silently set aside, and the author's choice to track it in an issue is kept and visible where the finding was first posted.
    - **(C) Redline id only; a Known limit for the rest.**
      - Cost: about 6 lines, 2 loop-test checks, a sentence in `agents/redline-reviewer.md`, and one Known limits bullet in `README.md`.
      - Effect: the silent set-aside of a real bug is closed. A carried finding known by an issue stays as today: listed under Already tracked in every run, its earlier thread unanswered and left open as "not settled", and the handoff saying "carried forward" with no outcome.
  - **Shaper's recommendation: (B).** The path the PR recommends, `review only` and then a full run, leaves the author time to open an issue for a finding. When they do, (B) respects that choice and still answers the thread the finding was posted in, while (A) re-raises it and (C) leaves the thread silent and repeats it on every run. The extra cost stays inside files the PR already changes.
  - **Decided:** (B), by @michaelfromtheoutfit on 2026-10-27. See the R1-2 entry under Decisions above.

## Deferred

None.

## Proportionality

- **R1-1.**
  - Likelihood: a round-3 reviewer sees R2-1's `carriedFrom` in the history block and may copy it onto a re-raised finding. Reachable on any run that carried something and runs past one re-review. Not observed.
  - Impact: a second, contradictory `carried forward` reply in an earlier thread on GitHub, a re-review body that calls a fresh finding carried, and a thread the handoff misreports as having a teammate's reply.
  - Cost: about 6 lines in `workflows/redline-loop.js` and four loop-test checks, both in the PR's diff. No dependency, service or abstraction.
  - Proportionate: fix.
- **R1-3.**
  - Likelihood: needs both a reviewer whose ids skip a number and a carry-forward id it did not account for. Low. Not observed.
  - Impact: two findings share an id. One thread gets the other's reply, and one outcome is lost from the handoff.
  - Cost: two lines and one loop-test check, in the PR's diff.
  - Proportionate: fix.
- **R1-4.**
  - Likelihood: any carried finding the post cannot anchor inline. Most likely for the fallback carry, whose old `file:line` may no longer sit in a hunk. Not observed.
  - Impact: the handoff says an earlier thread is left open because no reply was posted, which is untrue, and the teammate is left to resolve the thread by hand.
  - Cost: one line, a comment and two loop-test checks, in the PR's diff.
  - Proportionate: fix.
- **R1-5.** A nit. Likelihood: the chain the PR targets (a round posted, then a hand-off or an error before its replies), seen in the PR's own fixture. Impact: a self-contradictory handoff line that hides where the finding went. Cost: a few lines, one loop-test check and one README phrase. Proportionate: fix.
- **R1-2** (recorded for the options, not to choose one).
  - Likelihood: the Redline-id shape needs a reviewer to fill both fields. The issue shape needs an issue opened between a `review only` run and a full run, which the PR's own expected path makes room for. Not observed.
  - Impact: a re-verified correctness bug is set aside with no answer in its thread and is carried again on every run.
  - Cost: (A) about 6 lines, (B) about 35, (C) about 6 and a README bullet. All stay inside the PR's diff, and none adds a dependency, service or abstraction. What decides it is the original spec's assumption, which is why it goes to the person.
  - Decided: (B), by @michaelfromtheoutfit. About 35 lines in `workflows/redline-loop.js` and seven loop-test checks, with a sentence each in `agents/redline-reviewer.md` and `README.md`, all files the PR already changes. Fix.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`: "nothing an agent does is hidden from the review thread", and "Decisions stay with people". R1-1, R1-4 and R1-5 keep what the run posts in threads and in the handoff true. R1-3 keeps one finding's reply out of another's thread. R1-2's options are weighed against both lines.

## Standards Applied

- **workflow/agents.** Line 23, the #35 carry-forward bullet, is the rule every finding here sharpens. Line 27, the #39 sweep, says a body finding has no thread (R1-4). Line 14 asks for a message in the words of the decision behind it (R1-1's warning). Also: judgment calls are returned, never decided (R1-2), and every decision names its owner.
- **testing/tests.** Line 6, the loop-test carry-forward scenario, gains each fix's case. Line 9 asks for a fix pinned at a second call site (R1-1's two entries). Also: a tested surface gains a case beside a neighbour that must not change, and a bug fix lands red before green.
- **workflow/replay.** Line 12: the earlier findings enter through `args.priorFindings`, and no fix reads them any other way. No change reads the clock or GitHub, so a relaunch still replays.
- **prompts/attribution.** The commit messages in `plan.md` and this folder carry Redline's name only.
- **process/standards-retrospective.** Gate step 10, proposed below.
- **process/internal-notes.** This folder cites no private note and carries no private detail.

## Standards retrospective (proposed)

1. **R1-1, R1-4 and R1-5**, in `agent-os/standards/workflow/agents.md`, line 23 (the #35 bullet). After its closing "(#35)", append: ". Only the run's first round carries: a `carriedFrom` on any review with no carry-forward list (a re-review, a final nit pass, a first round with no earlier findings) is cleared with a warning, since the history block shows later reviewers the carried ids (#46, R1-1). An earlier thread is swept on its own reply when the finding that carries it sits in the review body, which has no thread to reply in (#46, R1-4). The handoff names an earlier finding by its disposition before its reply text: one a later round's line already carried reads `carried forward as R2-2 in round 2`, whatever its own thread's last reply says (#46, R1-5)".
2. **R1-3**, in `agent-os/standards/workflow/agents.md`, a new bullet directly after line 23: "- An id the workflow mints beside the reviewer's is numbered after the highest in use, never by count: a reviewer's ids can skip a number, and every record of a run (comment ids, dispositions, outcomes, reply ids, the carried map) is keyed by id (#46, R1-3)".
3. **R1-1, R1-3, R1-4 and R1-5**, in `agent-os/standards/testing/tests.md`, line 6. After "and that the loop carries a finding the reviewer did not account for (#35)", insert ", that a review with no carry-forward list clears a `carriedFrom`, that a fallback carry is numbered after a gap in the reviewer's ids, that an earlier thread is swept when its carrying finding sits in the review body, and that a finding an earlier run carried is named by its new id (#46)".
4. **R1-2**, drafted for the decision, option (B) (Decided by: @michaelfromtheoutfit). Two edits:
   1. In `agent-os/standards/workflow/agents.md`, line 23 (the #35 bullet). Append after item 1's text, or after the bullet's closing "(#35)" if item 1 is declined: ". A carried finding is never known by a Redline id: a `knownAs` naming one is cleared with a warning and the finding is carried. One naming an issue or a teammate's comment keeps the author's choice to track it there: the finding stays under Already tracked with `first reported as R1-2` on its line, unshaped, and its earlier thread is answered `carried forward as R2-1; already tracked in #41 · decided by: redline` and left open as `already tracked`. That reply is what the next run reads as carried, so the finding is neither set aside unanswered nor raised again (#46, R1-2)".
   2. In `agent-os/standards/testing/tests.md`, line 6. Append after item 3's inserted text, or after "(#35)" if item 3 is declined: ". It also proves that a carried finding the reviewer marks known by a Redline id is still carried, and that one an issue tracks stays known, with its earlier thread answered `carried forward as R2-1; already tracked in #41` from both the revise pass and a round with no revise pass, and left open (#46, R1-2)".
5. `workflow/replay`, `scripts/bash-conventions`, `scripts/guard`, `prompts/attribution`, `process/standards-retrospective`, `process/internal-notes`, `index.yml`: no changes.

If the standards approver declines items 1 to 4, record "Standards retrospective: no changes" under Decisions instead.
