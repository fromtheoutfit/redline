# PR #80 review round 3: the reopen rule in the handled-list header and the knownAs contract, decided findings, and two stale doc sentences — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The four findings of Redline round 3 on PR #80 (issue #79, the coverage pass: the `code-review` skill as the finder on every round, Redline's reviewer as the verifier), and nothing more:

- R3-3 (correctness, low, likely): the handled-list header for an earlier run's findings, and the reviewer's `knownAs` example, still say a `fixed` match is never re-raised, against the R2-1 reopen rule.
- R3-4 (correctness, low, confirmed, `needsDecision`): a finding the person decided, whose decision was applied in commits, never reopens, and the verifier cannot tell it was fixed.
- R3-1 (nit, low): `agent-os/product/tech-stack.md` still calls the `code-review` skill a candidate second reviewer, and the edited sentence has lost its subject.
- R3-2 (nit, low): `docs/running.md` says an empty candidates list leaves the reviewer on "the recheck and the carry-forward list alone", which is wrong for both kinds of round.

Line numbers below are at `474593f`, the PR head this round reviewed (the working tree; only spec folders are untracked). The `redline/` subfolder is Redline's own record and is untouched.

## Decisions

1. **R3-3: fix.** The R2-1 decision (round 2 `shape.md`, Decision 4, decided by the person) settles which rule wins: a candidate matching a finding marked fixed that still reproduces at the round's head is new. Two places the verifier reads still state the old rule, and the `knownAs` path can undo the reopen even when the verifier follows it (Unattended answer 4). The fix is prompt text only, on the coverage branch only:
   - `reviewPrompt()`'s handled-list header (`workflows/redline-loop.js:1124`) gains the exception when `candidates` is an array. With `candidates` null (`coverage off`) the header stays byte-identical (`workflow/replay`).
   - `candidatesBlock()`'s reopen sentence (`1165`) says a reopened finding's `knownAs` stays empty and the earlier id goes in its description only.
   - `agents/redline-reviewer.md` says the same at lines 16, 20, 30 and 98.
   No workflow-side clearing of `knownAs` is planned. The workflow cannot tell a reopened finding tagged `R1-3: fixed` from a re-sampled finding the reviewer correctly settled with the same tag, since both carry that value by the same contract (`agents/redline-reviewer.md:98`). A rule that cleared it would turn every settled re-sample into a new finding and another round. Plan Task 2.
   Decided by: redline
2. **R3-1: fix.** Rewrite the sentence in `agent-os/product/tech-stack.md:5` so the skill is the finder on every whole-PR and fix-diff round, as the PR description says (Unattended answer 7). The spike facts and the #19 benchmark clause stay. Plan Task 3.
   Decided by: redline
3. **R3-2: fix.** Replace the last sentence of the three-causes paragraph in `docs/running.md` (line 54) with what `candidatesBlock()`'s empty branch (`workflows/redline-loop.js:1157-1159`) and `reviewPrompt()` (`1120-1128`) actually give the reviewer (Unattended answer 6). Plan Task 4.
   Decided by: redline
4. **R3-4: Should a decided finding whose decision was applied in commits reopen? Decided: B. Keep it settled, say so, and show the gap.** Should a coverage candidate that matches a finding the person decided, whose decision was applied in commits, and that still reproduces at this head, be new? Returned as judgment call R3-4 (spec assumption; Unattended answer 5). Options and the shaper's recommendation are in Plan Task 5. The R2-1 decision names only findings marked fixed, so it does not settle this. The R2-1 reasoning would carry over, but a decision applied in commits is not always a fix. Two kinds are not: a decision to keep the code, applied as a comment (`tests/loop-test.mjs:279`, "The author keeps it ... Applied in 2bbbbbb"), and a mitigation the person chose on purpose (R2-5 in this PR: docs and a pinned guard row, with the guard itself left to a person).
   - Chosen: B, by the person, outside the run. The run stopped after shaping, before plan approval (this folder's `redline/` holds no `snapshot.json`). The person applied B by hand in `6ef58a9` (`redline: R3-3, R3-4 keep a decided finding settled and put the reopen exception in the handled-list header (#79)`), whose message says: "A decided finding now stays settled whatever its commits, because an applied decision is often a deliberate keep or mitigation. A coverage candidate that still reproduces one goes under For the person, naming the earlier id, and counts as no finding, so the run still ends (#80, R3-4)." Plan Task 5's option B is that commit's change. Recorded by Redline round 4 (#80, R4-1).
   Decided by: @michaelfromtheoutfit
5. **No version change.** The PR already bumps to `0.2.0` (#79 Decision 15). No fix changes what a setup rerun writes: the unattended section, the templates and `checks-template.sh` are untouched. R3-3 corrects prompt text the PR adds, and adds no `CHANGELOG.md` line.
   Decided by: redline
6. **As built: R3-1 to R3-4 landed by hand in one commit, `6ef58a9`,** not one commit per finding as `plan.md` planned, and in the person's own wording where it differs from Tasks 2 to 5; that commit's diff is the as-built text. No implementer ran this round, so `plan.md` has no As built section. Redline round 4 resolved R3-1 to R3-4 from its carry-forward list at `a70c243` (#80, R4-1).
   Decided by: @michaelfromtheoutfit

### Proportionality (correctness findings)

| Finding | Likelihood and visibility | What it costs | Verdict |
| --- | --- | --- | --- |
| R3-3 | It needs one of two things. (a) A launch on a PR that already carries posted Redline rounds, with an earlier finding whose reply reads `fixed in` (`trackedList`, `workflows/redline-loop.js:101-102`, `86-87`), that a coverage candidate re-finds still reproducing. Every coverage round then shows the header at `1124`, whose "never re-raise one" contradicts the reopen sentence at `1165`. (b) Any reopened finding the verifier tags with `knownAs` as `<id>: fixed`, as the contract's own example invites (`agents/redline-reviewer.md:98`, "`R1-2: fixed`"). Traced: `accountCoverage()` counts a finding with a `knownAs` as `known` (`1291-1293`). The main loop's known split lists it under Already tracked (`3282-3283`; the nit-pass branch does the same at `3203-3204`). `reconcilePrior()` clears a Redline id from `knownAs` only on a carried finding (`2094-2097`). So the round confirms nothing new and the run ends with the bug the R2-1 decision meant to reopen. Whether it fires depends on which sentence the model follows; not observed. | Three sentences of prompt text in `workflows/redline-loop.js` (one header line made conditional on `Array.isArray(candidates)`, one clause in the reopen sentence). Four short edits in `agents/redline-reviewer.md`. Three loop-test checks. Both source files are in the PR's diff. No new dependency or abstraction; `coverage off` prompts unchanged. | fix |
| R3-4 | It needs a `needsDecision` finding the person decided, applied in commits that cover only part of its cause, and a later coverage pass that re-finds the uncovered part. Traced: `outcomesFor()` records any finding with a decision as `decided`, whatever its commits (`2199-2200`). `describeOutcome()` gives the decision sentence and owner only (`2221-2222`), and `history()` hands the verifier that text (`1883-1892`). Across runs, `prior-findings` classifies an `Applied in` reply as `decided` (`scripts/redline-gh.sh:335-342`). The prompt's history line (`1112`) and the reviewer's rule (`agents/redline-reviewer.md:22`) say a decided finding is not raised again. When it fires, the run ends with the gap unreported, as R2-1 was before its fix. | Option-dependent; see Task 5 in `plan.md`. Every option is a few sentences and at most two loop-test checks. Option A also changes the history text the verifier sees. | ask (the question is the done rule itself, which the person set in R2-1, not the cost) |

## Unattended answers

1. **Visuals:** none; this is a workflow, its prompts and its docs.
   Decided by: redline
2. **Product context:** the #79 spec's alignment holds (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md`, Context). R3-1 is the product file itself (`agent-os/product/tech-stack.md`). R3-3 keeps the done rule the person set in R2-1 consistent across every sentence the verifier reads. R3-2 makes the operating doc say what an empty pass leaves the reviewer to do.
   Decided by: redline
3. **Known-finding check.** Three issue searches found nothing that covers these findings:
   - `scripts/redline-gh.sh issues-search "reopen"` lists #69 and #79.
   - `issues-search "knownAs"` lists nothing.
   - `issues-search "decided"` lists #21, #28 and #79.

   #79 is this PR's own issue, and none of the titles covers the handled-list header, the `knownAs` of a reopened finding, a decided finding's reopen or the two doc sentences. The round 2 spec (`agent-os/specs/2026-11-06-1019-80-review-round-2/`, committed at `474593f`) built R2-1 as option A. Its Task 5 changed `candidatesBlock()`, `agents/redline-reviewer.md` lines 20 and 30 and `docs/running.md`. It did not change the header at `workflows/redline-loop.js:1124` or the `knownAs` example at `agents/redline-reviewer.md:98`. So R3-3 is the gap that fix left, and R3-4 is the neighbouring case the decision did not name. The round 1 spec dispositions R1-1 to R1-6, none of which is these. No reviewer reproduction exists for round 3 (`/tmp/redlinerepro/` holds round 1's files only).
   Decided by: redline
4. **R3-3: does the handled-list header cover a `fixed` finding, and which rule wins?** It covers one, and the reopen rule wins.
   - `trackedList` is every prior finding whose disposition is not in `CARRY` (`workflows/redline-loop.js:101-102`). `fixed` is one of `PRIOR_DISPOSITIONS` (`86`), so a fixed finding sits under the header that says "never re-raise one" (`1124`).
   - The header shows on every coverage round when `trackedList` is not empty (`1121`, `handledBlock`).
   - The person decided R2-1 as option A (round 2 `shape.md`, Decision 4: "a coverage candidate that matches a finding marked fixed but still reproduces at the round's head" is new).
   - `candidatesBlock()`'s comment states it too (`1150-1153`): "A fixed finding is the one outcome a candidate may reopen".

   The header and the `knownAs` example disagree with that decision, so the disagreement is the finding to fix (Decision 1), not a question.
   Decided by: redline
5. **R3-4: is a decided finding whose decision was applied in commits "fixed" for the reopen rule?** Not settled by the evidence, so it is pending (Decision 4). The question arises: the trace in the proportionality table is confirmed by reading `outcomesFor()`, `describeOutcome()`, `replyBody()` (`1061`, "Applied in") and `prior-findings`' `classify` (`scripts/redline-gh.sh:335-342`, "any other reply decided"). The evidence points both ways:
   - Settled: the prompt's history line (`workflows/redline-loop.js:1112`) says "never re-raise a declined, deferred or decided one". The reviewer's rule (`agents/redline-reviewer.md:22`) says "A finding an earlier round declined, deferred or decided is not raised again". The R2-1 decision names only findings "marked fixed".
   - Reopen: the R2-1 reasoning, a fix that did not fully land keeps the run going, applies to a decided fix too.
   - Against reopening: an applied decision is not always a fix. `tests/loop-test.mjs:279` pins a decision to keep the code, "The author keeps it because the board already shows it. Applied in 2bbbbbb". R2-5 in this PR is a mitigation the person chose, with the rest left to a person.

   Changing what settles a candidate changes the run's done rule, which the person set, so this is a spec-assumption judgment call.
   Unanswered; returned as judgment call R3-4.
6. **R3-2: what does the reviewer still do when the pass returns an empty array?** `candidatesBlock()`'s empty branch (`workflows/redline-loop.js:1157-1159`) says: run no discovery pass of your own; on a fix-diff round, the recheck of the fix diff stays; the scheduled-and-queued, Docs and Version checks still apply. Two lists sit outside that branch:
   - The carry-forward list is added by `reviewPrompt()` only on a whole-PR round with earlier findings that have no disposition (`1120`, `1126-1128`), so only on a run's first round.
   - The handled list follows the same gate whether or not candidates are empty (`1121`).

   So "the reviewer runs on the recheck and the carry-forward list alone" (`docs/running.md:54`) is wrong on both kinds of round. A whole-PR round has no recheck, a fix-diff round has no carry-forward list, and the rule checks are left out. The doc is the fix (Decision 3).
   Decided by: redline
7. **R3-1: what is the skill's role since #79?** The PR description: "On every round the `code-review` skill runs as a coverage pass over the whole PR". `docs/running.md:50`: "Every whole-PR and fix-diff round opens with the coverage pass, the finder". "A candidate second reviewer on whole-PR rounds" (`agent-os/product/tech-stack.md:5`) is the pre-#79 wording, and "runs it as the coverage pass" leaves the skill running itself. The sentence is the fix (Decision 2).
   Decided by: redline

## Deferred

None this round.

## Context

- **Visuals:** None.
- **References:** see `references.md`. Code studied:
  - `workflows/redline-loop.js`: `PRIOR_DISPOSITIONS`, `CARRY` and `trackedList`; `reviewPrompt()`; `candidatesBlock()`; `accountCoverage()`; `replyBody()`; `history()`; `reconcilePrior()`; `outcomesFor()`; `describeOutcome()`; the main loop's known split and the nit-pass branch's.
  - `agents/redline-reviewer.md`.
  - `scripts/redline-gh.sh`: the `prior-findings` header and `classify`.
  - `tests/loop-test.mjs`: `prior()`, section 15's coverage scenarios and the decided replies at 279 and 297.
  - `docs/running.md`: steps 1 and 7, and "The coverage pass".
  - `agent-os/product/tech-stack.md`.
  - The round 2 spec folder, this round's `redline/round-3-review.json` and the #79 spec folder.

  The shaper's guard does not allow `node`, so the traces are by reading.
- **Product alignment:** as Unattended answer 2.

## Standards Applied

- workflow/agents: the coverage-pass bullet (the definition of new and the R2-1 reopen, which R3-3 makes every sentence agree with and R3-4 asks about), and "Judgment calls are returned, never decided" (R3-4).
- workflow/replay: `coverage off` keeps every prompt byte-identical. R3-3 changes only the coverage branch of the header, and the candidates block, which exists only when a pass ran.
- testing/tests: each fix to the workflow lands red before green with a loop-test check and a neighbour that must not change; a fix at one call site is pinned at a second (the header and the candidates block both carry R3-3's rule).
- process/docs-gate: each task names its `docs/` or README section or says why there is no reader-facing change; a change to `docs/` is reader-facing by nature.
- process/release: no second version bump.
- process/standards-retrospective: the proposed list below.
- prompts/attribution: the spec and the commits carry no model or vendor name.

## Standards retrospective

Landed through Redline round 4's standards retrospective (`agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md`, items 1 and 2) in `2118e85` (#80, R4-1): items 1 and 3 (3 as option B, the person's decision) as round 4's item 1, and item 2 as round 4's item 2. Items 4 and 5: no change, as proposed. The list below is the proposal as shaped.

1. R3-3: `agent-os/standards/workflow/agents.md`, the coverage-pass bullet (line 35). After "while a re-sampled finding the fix did close no longer reproduces and settles (#80, R2-1)", insert: "; every sentence the verifier reads states that rule, the handled-list header of an earlier run's findings and the `knownAs` example included, and a reopened finding carries no `knownAs`, since the workflow counts a finding with one as already tracked and a round of those confirms nothing new (#80, R3-3)".
2. R3-3, general lesson: `agent-os/standards/workflow/agents.md`, a new bullet after "A message the run shows the person says when it fires ...". Draft: "A decision that changes a rule a prompt states is applied to every place the prompt and the role's agent file state the old rule, found by searching both for the rule's words (`never re-raise`, the example values), not only to the sentence the finding quoted: R2-1's reopen changed the candidates block and two paragraphs of the agent file but left the handled-list header and the `knownAs` example saying a fixed match is never re-raised (#80, R3-3)".
3. R3-4: Held for R3-4. Once the person decides, the coverage-pass bullet (line 35) records the answer:
   - A: `decided` joins `fixed` as a disposition a candidate may reopen when its decision was applied in commits.
   - B: a decided finding stays settled whatever its commits, and a candidate that still reproduces one goes under For the person with the earlier id named.
   - C: no change.
4. R3-2: a doc sentence that describes what a prompt branch tells an agent is read off that branch. Already covered in spirit by `workflow/agents.md`'s bullet "A sentence that says what keeps a change out of a run ... credits a role only with a check its prompt carries, read in that prompt before the sentence is written". Proposed as no change.
5. R3-1: a stale product sentence; no lesson beyond the docs gate. No change.
