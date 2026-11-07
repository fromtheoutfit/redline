# References for PR #80 Review Round 5

Shaped by Redline in unattended mode. Everything below was opened at `61068fc`.

## Similar Implementations

### Round 1 of this PR: R1-1, a description reworded to the done rule

- **Location:** `agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md`, Decision 6
- **Relevance:** R1-1 gave the skill's `description` the workflow's own done-rule wording ("re-reviews until a round confirms no new correctness finding", `skills/redline/SKILL.md:3`). R5-1's E1 to E3 do the same for the README's opening line and both manifest descriptions, which R1-1 did not name.
- **Key patterns:** the done clause takes the words already in `workflows/redline-loop.js:3`; no version change, since the PR already bumps the minor version.

### The #79 spec: the done rule and the product alignment note

- **Location:** `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md:35` (Decision 21, the done rule), `:54` (product alignment); `plan.md:168` (Task 8, the README's loop paragraph), `:175` (Task 9, the manifests' version)
- **Relevance:** the done rule's words that every option uses, and the alignment judgment ("Both hold") that R5-1 asks the person to revisit after R3-4.

### Round 3 and round 4 of this PR: the R3-4 decision

- **Location:** `agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md`, Decision 4; `agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md`, Unattended answer 4
- **Relevance:** the person's option B, a decided finding stays settled and a candidate that still reproduces it goes under For the person while the run ends. This is the second reason "What a clean run means" says more than a clean run checks.

## Code studied

### The README

- **Location:** `README.md:3` (the opening line), `:5` (the loop paragraph, already reworded), `:96` to `:108` (Known limits: `:100` "What a clean run means", `:102` "Each coverage pass is a sample")
- **Relevance:** E1 and E4. The handoff comment links Known limits (`docs/running.md:83`), so `:100` is what the teammate reads.

### The manifests

- **Location:** `.claude-plugin/plugin.json:5` (`description`), `:4` (`version`); `.claude-plugin/marketplace.json:13` (the plugin entry's `description`), `:11` (`version`), `:7` (the marketplace's own description)
- **Relevance:** E2 and E3; the version lines are neighbours that do not change.

### The product mission

- **Location:** `agent-os/product/mission.md:9` (Target Users), `:13` ("One command"), `:17` ("Honest about its reach")
- **Relevance:** E5, option A only.

### The verifier's contract

- **Location:** `agents/redline-reviewer.md:28` ("you run no discovery pass of your own"), `:30` ("A decided finding stays settled whatever its commits"); `workflows/redline-loop.js:1162`, `:1168` (the candidates block's same sentence), `:3` (the workflow meta's done rule)
- **Relevance:** the two facts E4 and E5 state.

### The run docs

- **Location:** `docs/running.md:42` (Rounds, step 7: the done rule, the reopen rule and R3-4), `:83` (The handoff comment: Deferred, For the person and the link to Known limits)
- **Relevance:** E4 cites step 7 and names the handoff's Deferred and For the person lists.

### Tests

- **Location:** `tests/` (searched for "correctness bugs remain", "clean run" and "re-review the fixes": no match); `tests/setup-test.sh`'s last cases (the two versions agree)
- **Relevance:** no option changes a harness count; gate step 2 parses the manifests.

### Specs read for the evidence

- This round's `redline/round-5-review.json` and `redline/round-5-findings.json`
- Round 2's `redline/round-2-findings.json`, `forThePerson` (the handoff sentence at `workflows/redline-loop.js:2785`, observed and not in scope)
