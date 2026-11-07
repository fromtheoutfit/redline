# PR #80 review round 5: the done rule and what a clean run means, in the README, the plugin descriptions and the mission — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 5 on PR #80 (issue #79, the coverage pass: the `code-review` skill as the finder on every round, Redline's reviewer as the verifier), and nothing more. This is the final nit round: the round has no correctness finding.

- R5-1 (nit, low, confirmed, `needsDecision`): the README's Known limits line "What a clean run means", the README's opening line and the two plugin descriptions still state the done rule and the clean-run guarantee from before verify-only and R3-4.

Line numbers below are at `61068fc`, the PR head this round reviewed. `HEAD` and `origin/<branch>` are both `61068fc`; the working tree differs only by round 4's and this round's `redline/` folders, which are Redline's own record and are untouched.

## Decisions

1. **R5-1: What a clean run promises, in the README, the plugin listings and the mission. Decided: A. Reword the README, both plugin descriptions and the mission.** Should "What a clean run means" (`README.md:100`) and the product mission (`agent-os/product/mission.md:9`, `:13`, `:17`) change to say what a clean run checks since verify-only and R3-4, and how far? The finding is `needsDecision`, and the investigation shows the question arises (Unattended answer 5). The part the evidence answers is not in question: every option rewords the README's opening line and both plugin descriptions to the done rule the PR description states (Unattended answer 4). What is left is product wording: what Redline promises a teammate about a clean run, in the README the handoff links to and in the mission that cites it. Returned as judgment call R5-1 (product decision), with three options and the drafted text of each in `plan.md`, Task 2:
   - Story, as the person saw it: When a Redline run ends, the handoff comment tells your teammate the PR is ready and links to the README's Known limits. The section 'What a clean run means' there says: no correctness bug in the changed code that the reviewer could read or reproduce. Since this PR, a clean run checks less than that. The reviewer now only verifies what the code-review skill's sample turned up and does not search the rest of the PR for bugs, so nobody looks at a bug the sample missed. Since your R3-4 decision, a bug you chose to keep that the verifier still reproduces goes under For the person, and the run ends anyway. So your teammate can read 'no reproducible bug remains' while the handoff itself lists one. The README's first line and the plugin's descriptions in the plugin and marketplace listings still say Redline hands the PR over 'once no correctness bugs remain'. The PR description, the skill and the workflow say 'once a round confirms no new correctness finding'. The PR description already settles the done rule, so every option below fixes those three lines. The open question is what Redline promises. The product mission (agent-os/product/mission.md) repeats the README's clean-run sentence word for word and states the old done rule twice. The #79 spec judged it still held, but that was before R3-4.
   - Option A. Reword the README, both plugin descriptions and the mission. Cost: One commit, four files, about six sentences of prose (README lines 3 and 100, plugin.json and marketplace.json descriptions, mission.md lines 9, 13 and 17). The mission is outside the PR's diff, so the plan names it. No test reads these lines and the version stays 0.2.0. Effect: Every place a reader meets the done rule says 'a round confirms no new correctness finding'. The README's clean-run line, which the handoff links to, and the mission's 'Honest about its reach' both say what a clean run checked and that it is not a promise that no bug remains. What the run deferred or you kept is listed in the handoff. The coverage off meaning is kept and labelled.
   - Option B. Reword the README and both plugin descriptions; keep the mission as it is. Cost: One commit, three files, all already in the PR's diff. Effect: The README and the plugin listings are accurate. The mission still states the old done rule and the old clean-run promise, which now says more than the README section it cites.
   - Option C. Reword only the done rule's copy (the README's opening line and both plugin descriptions); keep "What a clean run means" and the mission. Cost: One commit, three lines: README line 3 and the two plugin descriptions. Effect: The done rule reads the same everywhere. 'What a clean run means' and the mission still say a clean run leaves no correctness bug the reviewer could reproduce, which a run that ends with a decided finding under For the person contradicts.
   - Shaper's recommendation: A: the mission's 'Honest about its reach' cites the README's Known limits, so changing one without the other leaves them disagreeing, and the mission's other two sentences state the done rule this PR replaced.
   - Chosen: A. Reword the README, both plugin descriptions and the mission. Edits E1 to E5 as drafted; the decision rewords neither E4 nor E5. Plan Task 2.
   - Notes: The author has the README, both plugin descriptions and the product mission reworded to state the new done rule, that a round confirms no new correctness finding. Each now says a clean run reports what the run checked and doesn't promise that no correctness bug remains. The mission cites the README's Known limits, so the two have to agree.
   - Date: 2026-11-07
   Decided by: @michaelfromtheoutfit
2. **No version change.** The PR already bumps to `0.2.0` (#79 Decision 15; `.claude-plugin/plugin.json:4`, `.claude-plugin/marketplace.json:11`). None of R5-1's options changes what a setup rerun writes: a manifest's `description`, the README and `agent-os/product/` are not a template, `scripts/checks-template.sh`, an allow entry or the unattended section (`agent-os/standards/process/release.md:5`).
   Decided by: redline

### Proportionality

R5-1 is a nit, so the proportionality rule for correctness findings does not apply. For the record: every option is prose in at most four files, one commit. The README and both manifests are in the PR's diff; `agent-os/product/mission.md` is not, and option A names it so it reaches the snapshot's `plan_paths`. No harness reads these lines (`grep` over `tests/` for "correctness bugs remain", "clean run" and "re-review the fixes" finds nothing). `claude plugin validate .` (gate step 2) parses both manifests, and the setup test's last cases compare only their versions.

## Unattended answers

1. **Visuals:** none; this is README, manifest and product-doc prose.
   Decided by: redline
2. **Product context.** `agent-os/product/mission.md` read in full. It states the old done rule twice ("Redline hands the PR to them once a round finds no correctness bug", line 9; "re-reviews the fix diff until a round finds no correctness bug", line 13) and the clean-run guarantee in the README's own words ("A clean run means no correctness bug in the changed code that the reviewer could read or reproduce", line 17, under "Honest about its reach", which cites "README, Known limits"). The #79 spec judged both sentences of line 17's kind still hold: "what Redline acts on is still what the verifier reproduced" (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md:54`). That judgment was made before R3-4 and is a past spec's, so it is not treated as settling the question R3-4 raised (Unattended answer 5). Whether the mission changes is the open part of R5-1.
   Unanswered; returned as judgment call R5-1. Decided by the person as option A, the mission is reworded (Decision 1).
3. **Known-finding check.**
   - `scripts/redline-gh.sh issues-search` for "clean run", "mission", "plugin.json", "Known limits", "done rule" and "description": #27, #31, #30, #76, #3, #66, #70, #79, #74, #75, #73, #2 and #77. None covers the README's clean-run line, its opening line, the manifest descriptions or the mission. #79 is this PR's issue.
   - `redline-gh.sh pr-comments 80`: the subject appears only in the round 5 review (R5-1, and its For the person list).
   - The PR's round folders, read off `HEAD` = `origin/<branch>` = `61068fc` (rounds 1 to 4):
     - Round 1's Decision 6 (R1-1) reworded the skill's description ("The description's done clause takes the workflow's own wording", `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md:29`). It named the skill and the alias template only, not the manifests or the README.
     - Round 2's review listed the handoff sentence "the last one found no correctness bugs" (`workflows/redline-loop.js:2785`) under For the person. That is a different file and not R5-1's subject (Observed, not in scope).
     - No round dispositions `README.md:3`, `README.md:100`, the manifest descriptions or the mission.
   - The #79 plan's Task 8 reworded the README's loop paragraph (line 5) to the new done rule and left line 3; its Task 9 changed the manifests' version only (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/plan.md:168`, `:175`). No decision there keeps the old wording on purpose.
   - No reviewer reproduction exists for round 5 (`/tmp/redlinerepro/` holds round 1's files only); none is needed for prose.
   Decided by: redline
4. **What is the done rule's wording?** The PR description answers it: "The run's done rule is now the manual loop's: a round whose verifier confirms no new correctness finding ends the run, under `maxRounds`." So does the #79 spec, Decision 21: "the run finishes when a round's verifier confirms no new correctness finding" (`agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md:35`). The skill's description and the workflow's meta already say it in those words ("re-reviews until a round confirms no new correctness finding", `skills/redline/SKILL.md:3`; `workflows/redline-loop.js:3`), as do the README's loop paragraph (`README.md:5`) and `docs/running.md:42`, `:83`. Three places still disagree with that answer:
   - `README.md:3`: "hands the PR to a teammate once no correctness bugs remain".
   - `.claude-plugin/plugin.json:5` and `.claude-plugin/marketplace.json:13`: "re-review the fixes, and hand the PR to a teammate once no correctness bugs remain". With the pass on, the re-review is the coverage pass over the whole PR at the new head plus the fix-diff recheck (`docs/running.md:42`).

   Under the unattended section's point 2, a disagreement with an answered question is the thing to fix, so every option of R5-1 rewords these three to the done rule's words, and none leaves them as written. The review's `README.md:2` is line 3 at `61068fc` (the hunk header `@@ -2,11 +2,11 @@` starts at the blank line 2). Its `marketplace.json:11` is the `version` line; the description is line 13.
   Decided by: redline
5. **Does the clean-run question arise?** Yes. `README.md:100` says a clean run means "No correctness bug in the changed code that the reviewer could read or reproduce". Two things this PR built make that sentence say more than a clean run checks:
   - Verify-only. With the pass on, "On a round with candidates you verify; you run no discovery pass of your own over the pull request" (`agents/redline-reviewer.md:28`), and the candidates block says the same (`workflows/redline-loop.js:1162`, `:1168`). A bug no pass sampled is never read. The README's own "Each coverage pass is a sample" (`README.md:102`) already says a hand-run pass after a run can still find something.
   - R3-4, the person's decision B. "A decided finding stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation: a candidate that still reproduces one is listed under For the person, naming the earlier id, in the review and the handoff, and the run still ends (#80, R3-4)" (`docs/running.md:42`; `agents/redline-reviewer.md:30`). So a run can end with a correctness bug the verifier reproduced and a person chose to keep.

   The teammate reads this line: the handoff comment links to Known limits in the README (`docs/running.md:83`). The evidence settles the facts but not the promise. No line of the PR description, the #79 spec or a docblock says what a clean run should promise once a reproduced, decided finding can remain. The #79 spec's alignment note (Unattended answer 2) predates R3-4, and rewording the mission is a product decision. So this is a judgment call, product decision (Decision 1).
   Unanswered; returned as judgment call R5-1. Decided by the person as option A (Decision 1).
6. **Ask rules.** `.claude/redline.json` declares none (its keys are `checker`, `checkerStallMs`, `maxPlanAdjustments`, `maxRounds`, `models`, `push`, `reviewer`), and the invoking prompt lists none. No file R5-1's options touch is one of Redline's own files (rule 7): `README.md`, `.claude-plugin/` and `agent-os/product/` are repository content here.
   Decided by: redline
7. **Which standards apply?** From `agent-os/standards/index.yml`; see `standards.md`.
   - `workflow/agents`: judgment calls returned, never decided; an owner on every decision; the coverage-pass bullet, which states the verify-only and R3-4 rules the clean-run line must match.
   - `process/docs-gate`: the Docs entry for each `.claude-plugin/` file an option changes; the precedent of the launch-word bullet (#80, R1-1) for a phrase that must match in every place a reader meets it.
   - `process/release`: no second bump.
   - `process/standards-retrospective`: the held item below.
   - `prompts/attribution`.
   Decided by: redline

## Deferred

None this round.

## Observed, not in scope

- The handoff's "Redline ran N review rounds; the last one found no correctness bugs." (`workflows/redline-loop.js:2785`) and the final nit pass's "no correctness bugs" (`:2783`, `:2889`) still use the pre-pass wording. Round 2's review listed `:2785` under For the person. They are not R5-1's subject and are not planned; a change there is a workflow text change with loop-test checks of its own.
- `skills/redline/SKILL.md:28` glosses `max <N> rounds` as "revise rounds allowed while correctness bugs remain". It describes the cap, not the done rule, and is not planned.
- The round 5 review's other For the person entries (`redline/round-5-findings.json`, `forThePerson`) are the person's to read and are not shaped.

## Context

- **Visuals:** None.
- **References:** see `references.md`. Read at `61068fc`:
  - `README.md` (lines 3, 5, 96 to 108);
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`;
  - `agent-os/product/mission.md`;
  - `agents/redline-reviewer.md:28`, `:30`;
  - `docs/running.md:42`, `:83`;
  - `skills/redline/SKILL.md:3`, `workflows/redline-loop.js:3`, `:1162`, `:1168`, `:2783` to `:2785`;
  - the #79 spec's `shape.md` and `plan.md`, and rounds 1 to 4 of this PR.
- **Product alignment:** the open question of R5-1 (Unattended answer 2).

## Standards Applied

- workflow/agents: R5-1 was returned as a judgment call with a story, options and a recommendation, and decided by the person; Decision 1 carries the person's owner line. The coverage-pass bullet (line 36) is the rule the clean-run line is checked against: the reviewer "runs no discovery pass of its own over the PR", and "a `decided` finding stays settled whatever its commits".
- process/docs-gate: each option that changes `.claude-plugin/plugin.json` or `.claude-plugin/marketplace.json` names the README's opening paragraph, reworded in the same commit, as its Docs entry (`plan.md`, Task 2).
- process/release: no second bump (Decision 2).
- process/standards-retrospective: the proposed list below, with item 1 drafted for R5-1's option A.
- prompts/attribution: the spec and the commits carry no model or vendor name.

## Standards retrospective (proposed)

1. **R5-1 (decided A, Decision 1).** Missing from a standard: a done-rule change reworded the skill's description (R1-1) and the README's loop paragraph (#79, Task 8) but left the README's opening line and both plugin descriptions on the old rule until round 5. `agent-os/standards/process/docs-gate.md`: insert one bullet directly after line 14 (the launch-word bullet, #80, R1-1), before line 15 (the `docs/` bullet), worded:

   ```text
   - A change to the run's done rule rewords every statement of it a reader meets, found by searching for the old rule's words, not only in the file the change touched: the README's opening paragraph and its Known limits ("What a clean run means", which the handoff links), `docs/`, the skills' descriptions, both `.claude-plugin/` descriptions and `agent-os/product/mission.md`, whose "Honest about its reach" cites the README's Known limits and says what a clean run checked in the same words. A clean run is stated as what the run checked, never as a promise that no correctness bug remains, since the reviewer verifies the coverage pass's candidates and a decided finding it still reproduces is listed under For the person. #79 reworded the skill's description and the README's loop paragraph and left the README's opening line, both plugin descriptions and the mission on the old rule until round 5 (#80, R5-1)
   ```

   Every other line of the file, and every heading, is unchanged. Drafted by the resolve agent for the person's choice; the standards approver judges it.
2. **Decision 2 (no version change).** Already covered: `agent-os/standards/process/release.md:5`. No change.
