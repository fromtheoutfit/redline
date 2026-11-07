# PR #80 review round 4: round 3's retrospective, the guard standard after the narrowing, and a resolved finding read back as decided — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The three findings of Redline round 4 on PR #80 (issue #79, the coverage pass: the `code-review` skill as the finder on every round, Redline's reviewer as the verifier), and nothing more:

- R4-3 (correctness, low, confirmed, `needsDecision`): Redline's own `resolved; first reported as ...` reply is read back by `redline-gh.sh prior-findings` as `decided`, so a later run keeps a finding an earlier run resolved settled even when a coverage candidate shows it still reproduces.
- R4-1 (nit, low, confirmed): round 3's standards retrospective never landed, and round 3's `shape.md` still records R3-4 as pending.
- R4-2 (nit, low, confirmed): `agent-os/standards/scripts/guard.md` still says a skill fork is approved every `redline-gh.sh` subcommand and that the narrowing is pending.

Line numbers below are at `a70c243`, the PR head this round reviewed (`origin` and the working tree agree; only this spec folder is untracked). Two commits since round 3 was shaped are the person's own: `6ef58a9` applied R3-1 to R3-4 (R3-4 as option B), and `a70c243` landed R2-5's deferred guard narrowing. The `redline/` subfolder is Redline's own record and is untouched.

## Decisions

1. **R4-1: fix, in two commits.** Round 3's standards items land through this round's standards retrospective, so the standards approver approves them and they go in the round's one standards commit (Unattended answer 5). Item 1 below carries round 3's item 1 (R3-3) and its held item 3 as the person decided it (R3-4, option B), worded as `6ef58a9` built them. Item 2 below is round 3's item 2, the general lesson. Then round 3's `shape.md` records what happened, in a commit of its own that names the standards commit:
   - Decision 4 records the person's choice of B, applied by hand in `6ef58a9`, with the person as its owner (Unattended answer 4).
   - A new Decisions entry records that R3-1 to R3-4 landed in that one hand commit, not one commit per finding, so gate step 13's deviation is on file.
   - The retrospective heading records what landed and in which commit, or "Standards retrospective: no changes" for an item the approver declined. The proposed list stays below it as the record.
   Round 3's `redline/` folder and `plan.md` are not touched. Plan Tasks 2 and 3.
   Decided by: redline
2. **R4-2: fix, through the standards retrospective (item 3 below).** `guard.md` line 14 names `redline-gh.sh`'s read subcommands among the scripts approved for any non-role session, and line 23 says the fork is approved only those and a write is inert, as `a70c243` made the guard do. The README and `docs/` already say this and do not change (Unattended answer 6). Plan Task 2.
   Decided by: redline
3. **R4-3: Should a finding an earlier run resolved reopen, like a fixed one, when the coverage pass finds it again? Decided: A. Read a resolved reply as fixed.** Should a coverage candidate that still reproduces a finding an earlier run resolved count as new, as one that still reproduces a fixed finding does? The shaper returned this as a judgment call (spec assumption; Unattended answer 7). Neither of the person's done-rule decisions names a resolved finding: R2-1 reopens findings "marked fixed" (round 2 `shape.md`, Decision 4), and R3-4 keeps decided findings settled because "an applied decision is often a deliberate keep or mitigation" (`6ef58a9`). A resolved reply is neither a fix nor a person's decision: it is Redline's reviewer saying the code no longer has the bug.
   - Story, as the person saw it: When a new Redline run starts on a PR that already has Redline rounds, its reviewer re-checks the old findings nobody answered. For each one the code no longer has, Redline replies in the finding's thread 'resolved; first reported as R3-3 ...'. That is Redline's own judgment that the bug is gone; no person decided anything. The next run reads that reply back as 'decided'. The script that reads old replies has no word for 'resolved', and it treats any reply it does not recognise as your decision. Since R3-4, a decided finding stays settled whatever happens. So say the resolution was wrong, or the bug comes back, and the coverage pass finds it again. The verifier lists it under For the person and the run ends. A fixed finding whose fix did not fully land would be reopened instead. Inside one run it goes the other way: a later round lists the resolved finding nowhere, so finding it again counts as new. This round resolves R3-1 to R3-4, so this PR's next run will read them this way. Nothing is hidden, since the bug shows under For the person in the review and the handoff. But the run stops without trying to fix it.
   - Option A. Read a resolved reply as fixed. Cost: About six files, all but docs/running.md outside the PR's diff, and no workflow prompt changes. In scripts/redline-gh.sh, one line in prior-findings' classify plus its header, which docs/scripts.md quotes. A resolved reply in the PR 14 fixtures, with one tests/gh-test.sh case. A sentence in the Earlier rounds paragraph of docs/running.md. Effect: A later run treats a resolved finding like a fixed one. A candidate that still reproduces it is new and runs one more round under maxRounds, as a later round of the same run already would. One the code really dropped no longer reproduces and settles. The verifier sees it listed as fixed beside its resolved reply.
   - Option B. Give resolved a disposition of its own. Cost: About ten files, and the coverage-round prompt text changes; coverage off prompts stay the same. The same script, test and docs as A. Plus PRIOR_DISPOSITIONS and the two coverage-round sentences in workflows/redline-loop.js, agents/redline-reviewer.md, the tracked list in skills/redline/SKILL.md, and loop-test checks. Effect: The same behaviour as A, and every list and knownAs says resolved instead of fixed.
   - Option C. Keep it settled, and say so. Cost: Four files, all in the PR's diff. The handled-list header and the candidates block in workflows/redline-loop.js, agents/redline-reviewer.md and docs/running.md say a finding an earlier run resolved reads as decided and stays settled. Two loop-test checks. Effect: The run still ends, and a resolved bug found again is listed under For the person, now on purpose. A later run and a later round of the same run still treat it differently.
   - Option D. Accept as written. Cost: Nothing. Effect: The same behaviour as C, but no sentence says so. The verifier sees 'decided' next to a reply that reads 'resolved' and has to reconcile the two itself.
   - Shaper's recommendation: A: read a resolved reply as fixed. It is Redline's own claim that the bug is gone, the same claim a fixed reply makes. R3-4's reason for keeping decided findings settled, your deliberate keep or mitigation, does not apply to it. It is the smallest change and moves no workflow prompt. It also makes a later run treat the finding the way a later round of the same run already does.
   - Chosen: A. Read a resolved reply as fixed. Plan Task 4 is the change (`scripts/redline-gh.sh`, `docs/scripts.md`, the PR 14 fixtures, `tests/gh-test.sh`, `docs/running.md`); held standards item 5 is drafted for A and goes to the standards approver in Task 2.
   - Notes: The author has a later run read an earlier run's "resolved" reply as fixed, so a coverage candidate that still reproduces a resolved finding reopens as a new finding within the round cap. A resolved reply is Redline's own claim that the bug is gone, not a decision the author made.
   - Date: 2026-11-07
   Decided by: @michaelfromtheoutfit
4. **No version change.** The PR already bumps to `0.2.0` (#79 Decision 15). Tasks 2 and 3 change standards and a spec folder, which no setup rerun writes. None of R4-3's options touches a template, `scripts/checks-template.sh`, an allow entry or the unattended section either.
   Decided by: redline
5. **Task order: the standards commit comes before round 3's record.** R4-1's second commit names the standards commit's sha, so Task 2 (the standards retrospective, which is the whole of R4-2's fix and the standards half of R4-1's) runs before Task 3. #65 round 2 ran its retrospective as a task of its own before the gate the same way (its `plan.md`, Task 3). An item held for R4-3 joins Task 2's one commit once the person decides, before the standards approver runs; Task 4's code, if any, follows it.
   Decided by: redline

### Proportionality (correctness findings)

| Finding | Likelihood and visibility | What it costs | Verdict |
| --- | --- | --- | --- |
| R4-3 | It needs three things. (1) An earlier run resolved a finding: its first round carried a finding with no Redline reply and the reviewer put it in `resolved`. This is routine after a hand fix: this very round resolves R3-1 to R3-4. (2) The resolution was wrong, or the bug came back. (3) A later run's coverage pass re-finds it. Traced: `resolvedReplies()` writes `resolved; first reported as <id> in Redline round <n>. <why> · decided by: redline` (`workflows/redline-loop.js:2411`). `prior-findings`' `classify` has no branch for it, so it falls to `decided` (`scripts/redline-gh.sh:342`). The handled list shows `decided` (`workflows/redline-loop.js:1127`), and on a coverage round the header (`1126`) and the candidates block (`1169`) keep a decided one settled, with a still-reproducing candidate under For the person. Not observed. When it fires, the run ends with the bug listed under For the person in the review body and the handoff: visible, but not fixed and not another round. | Option-dependent; see Task 4 in `plan.md`. A is about six files, all outside the PR's diff except `docs/running.md` (`scripts/redline-gh.sh`, `docs/scripts.md`, two `tests/gh-fixtures/` files, `tests/gh-test.sh`, `docs/running.md`), with no workflow prompt change. B is about ten. C is four files inside the diff. | ask (the question is the done rule, which the person set in R2-1 and R3-4, not the cost) |

R4-1 and R4-2 are nits. Both are prose in standards and a spec folder. No harness reads them (`tests/` names `agent-os/standards/` only inside fixture strings), and `checks.sh` always allows `agent-os/specs/` and `agent-os/standards/` (`.claude/redline/checks.sh:31`). `agent-os/standards/process/standards-retrospective.md` (item 4) is the one file outside the PR's diff.

## Unattended answers

1. **Visuals:** none; this is standards prose, a spec record and, for R4-3, a script's classification.
   Decided by: redline
2. **Product context:** the #79 spec's alignment holds (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md`, Context). R4-1 and R4-2 make the standards the next shaper reads say what the code does. R4-3 is a question about the done rule the PR description states: "a round whose verifier confirms no new correctness finding ends the run".
   Decided by: redline
3. **Known-finding check.**
   - `scripts/redline-gh.sh issues-search` for each finding:
     - "resolved": nothing.
     - "prior-findings": #73, about a regression pass, a cost class and a for-the-person list.
     - "retrospective": #58, #1 and #20.
     - "guard.md": nothing.
     - "reopen": #69 and #79.
     - "decided": #21, #28 and #79.
     - "narrow": #50.

     #79 is this PR's issue. None of the titles covers a resolved reply's classification, round 3's retrospective or the guard standard's sentence.
   - `redline-gh.sh pr-comments 80`: rounds 1 to 4 and their replies. The round 4 review lists R3-1 to R3-4 under "Resolved from earlier rounds".
   - The PR's round folders, read off `HEAD` = `origin/<branch>` = `a70c243` (`git ls-tree -d --name-only HEAD agent-os/specs/`): rounds 1, 2 and 3.
     - Round 2's retrospective item 5 is the origin of R4-2: "The narrowing itself is recorded in this bullet by the person's own change, not by this run". `a70c243` did not record it.
     - Round 3's Decision 4 and its retrospective (`shape.md:28`, `:105`) are the origin of R4-1.
     - No round dispositions R4-3. Round 3's R3-4 asked about a decided finding applied in commits, not about a resolved reply.
   - No reviewer reproduction exists for round 4 (`/tmp/redlinerepro/` holds round 1's files only). The shaper ran the `classify` rule with `jq` on a resolved reply's text, and it printed `decided`.
   Decided by: redline
4. **R4-1: who decided R3-4, and how?** The person decided it as option B and applied it by hand in `6ef58a9`. This round records that decision; it does not make it. Evidence:
   - Round 3's `redline/` folder holds only `round-3-findings.json` and `round-3-review.json`. It has no `snapshot.json`, which the workflow writes after the plan is approved, and no reply files. So the run stopped before plan approval, and no resolve agent recorded a decision.
   - `6ef58a9`'s message: "A decided finding now stays settled whatever its commits, because an applied decision is often a deliberate keep or mitigation. A coverage candidate that still reproduces one goes under For the person, naming the earlier id, and counts as no finding, so the run still ends (#80, R3-4)." Its diff adds option B's sentence (round 3 `plan.md`, Task 5, B) in the person's own words to these places:
     - the candidates block and the handled-list header (`workflows/redline-loop.js:1126`, `1169`);
     - `agents/redline-reviewer.md:20` and `:30`;
     - `docs/running.md` step 7 and "The coverage pass";
     - two loop-test checks (`tests/loop-test.mjs:1357-1363`).
   - The round 4 review lists R3-1 to R3-4 under "Resolved from earlier rounds". Only the carry-forward list feeds that heading (findings with no Redline reply: `workflows/redline-loop.js:101`, `2402-2412`). The review also says "The person chose option B in 6ef58a9".
   - On this PR, Redline's replies give the person's decisions the owner `decided by: @michaelfromtheoutfit` (round 2's `redline/round-2-reply-R2-1.md` and `round-2-reply-R2-5.md`). `redline-gh.sh pr-comments 80` shows the same login as the author.

   So round 3's Decision 4 gains `Decided by: @michaelfromtheoutfit`. That records the person's own decision, made and committed by them.
   Decided by: redline
5. **R4-1: where do round 3's standards items go?** Through this round's standards retrospective. `agent-os/standards/process/standards-retrospective.md:7`: "In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit." Round 3's items were never approved or applied. `agent-os/standards/workflow/agents.md` has no R3-3 or R3-4 text: the coverage-pass bullet's reopen clause ends at "(#80, R2-1)" (line 35). Item 3 was held for R3-4, and the person's B is now in the code, so it is drafted as B. #65 round 2 brought a standards correction the same way (its `shape.md`, Unattended answer 4).
   Decided by: redline
6. **R4-2: what does the guard do now, and what do the docs say?** The guard approves the main group the read subcommands only, and the docs already say so; the standard is the one place left behind.
   - `scripts/redline-guard.sh:1071-1078`: `gh-all` gets every subcommand. `gh-read` or `main` gets the `GH_READ` set only (`:738`), under the comment "a write is left to the permission prompt (#80, R2-5)".
   - `tests/guard-cases.tsv`, as of `a70c243`: the non-role `reply` row is `inert`. Beside it are `general-purpose allow ... pr 1`, `general-purpose inert ... post-review` and a main-session `issue-create` row, `inert`.
   - `docs/guard.md` ("The hook"), `docs/running.md` ("What the guard does not vet") and the README's Known limits ("The coverage pass runs outside the guard") describe the narrowing as landed.
   - `agent-os/standards/scripts/guard.md:23` still reads "(every `redline-gh.sh` subcommand, the writes included)" and "name the narrowing as pending". `:14` lists `redline-gh.sh` whole among the scripts "approved for any session".

   The standard disagrees with the code, so the standard is the fix (Decision 2).
   Decided by: redline
7. **R4-3: should a finding an earlier run resolved reopen like a fixed one?** The evidence does not settle it, so it is pending (Decision 3).

   The question arises:
   - `resolvedReplies()` (`workflows/redline-loop.js:2402-2412`) posts `resolved; first reported as <id> in Redline round <n>. <why> · decided by: redline`.
   - `prior-findings`' `classify` (`scripts/redline-gh.sh:335-342`) reads `fixed in`, `mitigated`, `not acted on in this run.`, `not changed in this round.`, `carried forward as R` and `left to the author`, and gives any other reply `decided`. Run with `jq` on that reply text, the rule prints `decided`.
   - The script's header says the same: "any other reply decided" (`:42`). `tests/gh-test.sh:220` pins "any other reply is decided" on a keep reply.
   - The handled list then shows the finding as `decided` beside its reply text (`workflows/redline-loop.js:1127`). On a coverage round, the header (`1126`) and the candidates block (`1169`) say a decided finding stays settled whatever its commits, and that a candidate that still reproduces one goes under For the person.
   - Within one run it goes the other way. A later round's prompt lists a resolved finding nowhere: the carry-forward list is the first round's only (`1120`, `1129`), and `history()` lists only this run's own findings (`1887-1896`). So a later round of the same run has nothing to collapse a re-found one into, while a later run settles it.

   Why no evidence answers it:
   - #35 made a resolved reply fall through to decided when it named the tracked labels "`fixed`, `deferred`, `decided`, `dropped`, `carried`" (`agent-os/specs/2026-10-27-1345-35-carry-forward-undispositioned-findings/shape.md:18`). There was no coverage pass and no reopen rule then, so whether a resolved finding settles or reopens a later candidate was never asked.
   - The docblock's "any other reply decided" describes the classification. It does not say how a resolved finding should count under a done rule that came later.
   - R2-1 names only findings "marked fixed". R3-4's reason for keeping decided findings settled is the person's deliberate choice, and a resolved finding has none.

   Changing what settles a candidate changes the run's done rule, which the person set, so this is a spec-assumption judgment call.
   Unanswered; returned as judgment call R4-3. The person answered it as A (Decision 3).
8. **Which standards apply?** From `agent-os/standards/index.yml`; see `standards.md`.
   - `workflow/agents`: the coverage-pass bullet, which R4-1 brings up to date and R4-3 asks about; the disposition bullet; "Judgment calls are returned, never decided"; owners on every decision.
   - `scripts/guard`: the main-session and skill-fork bullets, which R4-2 corrects.
   - `process/standards-retrospective`: the route for R4-1 and R4-2, and item 4.
   - `process/docs-gate`, including the `docs/scripts.md` rule for a header change under R4-3's options.
   - `process/release`: no second bump.
   - `workflow/replay`: R4-3's options and which prompts they move.
   - `testing/tests`: the gh-test and loop-test bullets for R4-3's options.
   - `prompts/attribution`.
   Decided by: redline

## Deferred

None this round.

## Observed, not in scope

- `docs/running.md:98` ("Earlier rounds") still says "A finding with a disposition is matched into `knownAs` (`R1-1: fixed`) and never re-raised." On a coverage round, a fixed one that still reproduces is reopened with an empty `knownAs` (R2-1, R3-3). R3-3's fix reached the header and the reviewer's `knownAs` example, but not this sentence. It is not a finding of this round and is not planned. Options A, B and C of R4-3 each edit this paragraph, so the person can fold the correction into the chosen option if they want it. The person's decision (A, Decision 3) does not fold it in, so Task 4 adds its own sentence to the paragraph and leaves this one as it is.
- The round 4 review's For the person entry on `workflows/redline-loop.js:1892` (`history()` gives the verifier outcome text, not `outcomeKinds`) is the remaining point of R3-4 and is not a finding of this round.

## Context

- **Visuals:** None.
- **References:** see `references.md`. Code studied:
  - `workflows/redline-loop.js`: `PRIOR_DISPOSITIONS`, `CARRY`, `trackedList`, `reviewPrompt()`'s handled list and header, `candidatesBlock()`, `history()`, `resolvedReplies()`, and every use of `resolvedPrior`.
  - `scripts/redline-gh.sh`: the `prior-findings` header and `classify`.
  - `scripts/redline-guard.sh`: `GH_READ` and the `redline-gh.sh` branch of `check_simple`.
  - `tests/guard-cases.tsv` (the #50 and R2-5 rows).
  - `tests/gh-test.sh` (the prior-findings cases) and the PR 14 fixtures.
  - `tests/loop-test.mjs`: the resolved-reply check at 630 and the R3-4 checks at 1357-1363.
  - `agents/redline-reviewer.md`.
  - `docs/running.md`: step 7, "The coverage pass" and "Earlier rounds".
  - `docs/scripts.md`, `docs/guard.md`, the README's Known limits and its git rules.
  - The round 2 and round 3 spec folders, the #35 and #79 spec folders, and #65 round 2's spec folder (the precedent).
  - The two hand commits, `6ef58a9` and `a70c243`.
- **Product alignment:** as Unattended answer 2.

## Standards Applied

- workflow/agents: the coverage-pass bullet (line 35) gains R3-3 and R3-4 through items 1 and 2. R4-3 asks whether `fixed` stays "the one disposition a candidate may reopen"; decided A (Decision 3), it does, and the disposition bullet (line 25) says a resolved reply reads as `fixed` through item 5. Owners on every decision: round 3's Decision 4 is recorded with the person as owner.
- scripts/guard: lines 14 and 23 are corrected through item 3.
- process/standards-retrospective: R4-1's standards items and R4-2 go through the proposed list, the approver and one commit. Item 4 adds the lesson the two hand commits taught.
- process/docs-gate: Tasks 2 and 3 touch no Docs directory. R4-3's options name `docs/running.md` "Earlier rounds" and, for a header change under `scripts/`, `docs/scripts.md`.
- process/release: no second bump (Decision 4).
- workflow/replay: Tasks 2 and 3 move no prompt. Option A moves none either, since `prior-findings` runs at launch in the skill. B and C change coverage-branch prompt text only, so `coverage off` prompts stay byte-identical.
- testing/tests: Tasks 2 and 3 add no case, since no harness reads these files. Each R4-3 option that changes a tested surface adds a case and keeps a neighbour; under A, Task 4 adds one gh-test case on PR 14's R2-4 and keeps the `any other reply is decided` case, and item 5 names it in the gh-test bullet.
- prompts/attribution: the spec and the commits carry no model or vendor name.

## Standards retrospective (proposed)

1. **R4-1: round 3's items 1 and 3 (R3-4 as option B).** Missing from a standard. `agent-os/standards/workflow/agents.md`, the coverage-pass bullet (line 35). After "while a re-sampled finding the fix did close no longer reproduces and settles (#80, R2-1)", insert:

   "; a reopened finding carries no `knownAs`, since the workflow counts a finding with one as already tracked and a round of those confirms nothing new, and every sentence the verifier reads states the reopen rule, the handled-list header of an earlier run's findings included, which names the exception only when the pass ran, so a `coverage off` prompt is as before (#80, R3-3); a `decided` finding stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation: a candidate that still reproduces one goes under For the person naming the earlier id and is accounted for as `forThePerson`, never as a finding, so the run still ends (#80, R3-4)"

   The rest of the bullet is unchanged. This records what `6ef58a9` built (`workflows/redline-loop.js:1124-1127`, `1169`; `agents/redline-reviewer.md:20`, `:30`, `:98`). It applies round 3's item 1 and its held item 3 as the person decided, so the commit that applies it names R4-1.
2. **R4-1: round 3's item 2, the general lesson.** Missing. `agent-os/standards/workflow/agents.md`: insert one bullet directly after line 15 (the bullet that opens "A message the run shows the person says when it fires"):

   "- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted: R2-1's reopen changed the candidates block and two paragraphs of the agent file but left the handled-list header and the `knownAs` example saying a fixed match is never re-raised (#80, R3-3)"

   No heading changes.
3. **R4-2: contradicting a standard.** `agent-os/standards/scripts/guard.md`. The lines now wrong are line 14's "(`redline-gh.sh`, `redline-prefs.sh`, `redline-gate.sh check`, `redline-setup.sh version`) ... is approved for any session", and line 23's "(every `redline-gh.sh` subcommand, the writes included) ... until a person narrows the main row to `redline-gh.sh`'s read subcommands; ... name the narrowing as pending". The edits:
   - Line 14: replace "(`redline-gh.sh`, `redline-prefs.sh`, `redline-gate.sh check`, `redline-setup.sh version`)" with "(`redline-gh.sh`'s read subcommands, `redline-prefs.sh`, `redline-gate.sh check`, `redline-setup.sh version`)". Replace the closing "(#50; #54, R2-1)" with "(#50; #54, R2-1; #80, R2-5)".
   - Line 23: replace everything from "(every `redline-gh.sh` subcommand, the writes included)" to the end of the bullet with:

     "(of `redline-gh.sh`, only its read subcommands), the repository's `checks.sh` and read-only git are approved for it with no prompt, and a `redline-gh.sh` write (a review, a reply, a comment, an issue, a thread resolve) is inert, never a deny, so the session's permission prompt decides; `tests/guard-cases.tsv` pins the write as `inert` beside a read row that stays `allow`, and the README's Known limits, `docs/running.md` and `docs/guard.md` say the same (#80, R2-5, R4-2)"

   The rest of both bullets is unchanged. This records what `a70c243` made the guard do (`scripts/redline-guard.sh:1071-1078`; the tsv rows in Unattended answer 6). Round 2's item 5 left that record to the person's change, which did not make it. The commit that applies this item names R4-2.
4. **R4-1 and R4-2: the lesson the two hand commits taught.** Missing. `agent-os/standards/process/standards-retrospective.md`: insert one bullet directly after line 8 (the bullet that opens "When nothing changes"):

   "- A round a person finishes by hand, outside the run (a pending decision applied, a deferred full fix made), still owes its record in the same PR: the round's `shape.md` records the decision with its owner and commit, its proposed retrospective lands or reads 'Standards retrospective: no changes', and every standard that named the change pending says what landed, not only the README and `docs/`: `6ef58a9` applied R3-4 with neither record, and `a70c243` narrowed the guard while `scripts/guard.md` still called it pending, until the next round found both (#80, R4-1, R4-2)"

   `CLAUDE.md` (Specs) already says a spec is not complete until its retrospective lands, "whether or not the command was used to shape it". What is missing is the hand-finish case: the pending decision's record and the standards that name a change pending. The approver may judge the first half already covered and approve the second alone. The file is outside the PR's diff; `checks.sh` allows `agent-os/standards/`.
5. **R4-3: a resolved reply reads as fixed (drafted for option A, the person's decision, Decision 3).** Missing from a standard. The shaper held this item for R4-3 and listed a line per option (A: the disposition bullet and the gh-test bullet; B: those and the coverage-pass bullet; C: the coverage-pass bullet; D: no change). The person chose A, so these are the edits:
   - `agent-os/standards/workflow/agents.md`, the disposition bullet (line 25, the bullet that opens "A finding an earlier round recorded is not one it dispositioned"). Replace "(`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round)" with:

     "(`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round; a later run's `resolved; first reported as` reply reads as `fixed`, since it is Redline's own claim that the code no longer has the bug, not a decision a person made, so a coverage candidate that still reproduces it reopens it as one that still reproduces a fixed finding does, #80, R4-3)"

     The rest of the bullet is unchanged. The coverage-pass bullet (line 35) needs no edit: "`fixed` is the one disposition a candidate may reopen" stays true, since a resolved reply now reads as `fixed`.
   - `agent-os/standards/testing/tests.md`, the gh-test bullet (line 14). Replace "an Already tracked line that is not a finding, and a round that carried an earlier finding; #35)" with:

     "an Already tracked line that is not a finding, a round that carried an earlier finding; #35; and a later run's `resolved; first reported as` reply, read as `fixed`; #80, R4-3)"

     The rest of the bullet is unchanged.

   This records what Task 4 builds (`scripts/redline-gh.sh`'s `classify`, PR 14's R2-4). The commit that applies it names R4-3. Proof: `grep -c "#80, R4-3" agent-os/standards/workflow/agents.md` prints `1`, and `grep -c "#80, R4-3" agent-os/standards/testing/tests.md` prints `1` (both `0` before).
6. **Decisions 4 and 5 of this round.** Already covered: the version rule is in `process/release.md:5`, and a standards task of its own before the gate is #65 round 2's precedent. No change.
