# PR #38 review round 2 (launch 2026-10-26-1023) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

This round covers the one finding from Redline round 2 on PR #38 (issue #36: `/redline:redline-revise <pr> review <id | @login | latest>`, a revise pass over a teammate's review comments). The round reviewed only the round 1 fix diff (`d7b7c86..5365811`, `redline/round-2-review.json`) and found no correctness bug, so this is the final nit round. Nothing else is in scope.

- **R2-1** (nit, low, confirmed): the user-facing paragraph on the human review pass (`README.md:67`) still describes the review-body selection from before R1-3. Planned as a **fix**.

One observation stays out of scope. The PR description's "What" bullet repeats the same pre-R1-3 wording ("the body of their newest review that has one; an id takes that review's"). It is not a repository file, so no task in this round changes it.

## Unattended answers

- **What are we building?** A rewrite of one sentence in `README.md:67`: the sentence that says what each selector form of `review` takes. No code, no test, no new file and no new dependency.
  Decided by: redline
- **Visuals?** None. This is one sentence of documentation.
  Decided by: redline
- **References?** The script header (`scripts/redline-gh.sh:21-43`) and the `human-review` filter (`:281-307`). Also the README's `redline-gh.sh` table row (`README.md:288`), `skills/redline-revise/SKILL.md:16`, the round 1 spec for this PR (the R1-2 and R1-3 decisions, and Task 6 of its plan), commit `d9b584e`, and the #36 spec. See `references.md`.
  Decided by: redline
- **Product context?** `agent-os/product/mission.md` says the author keeps every decision and that nothing an agent does is hidden from the review thread. The README paragraph is the only place the person reads what a `review` pass will pick up before launching one. If it says an answered body comes back, the person expects a duplicate finding where the pass now stops with "nothing to revise". It also does not tell them that an older note surfaces on the next pass. Nothing on the roadmap bears on the wording.
  Decided by: redline
- **Standards?** `scripts/bash-conventions.md`, `testing/tests.md`, `workflow/agents.md`, `process/standards-retrospective.md`, `process/internal-notes.md` and `prompts/attribution.md`. See `standards.md`. `workflow/replay.md` and `scripts/guard.md` do not bind, because no prompt, workflow file or guard file changes.
  Decided by: redline
- **Already tracked?** No.
  - `redline-gh.sh issues-search "human-review README"` and `issues-search "review body selector"` return no open issue.
  - `redline-gh.sh pr-comments 38` holds the round 1 review and the round 2 review. Round 1's R1-3 was anchored on `scripts/redline-gh.sh:288`, not on the README paragraph.
  - The PR's earlier round folder, `agent-os/specs/2026-10-26-1023-38-review-round-1/`, planned the doc side of R1-3 in Task 6 of its `plan.md`. Step 4 changed the README table row (line 288) and step 5 changed `skills/redline-revise/SKILL.md:16`. Neither step named line 67, so the paragraph was missed, not deliberately kept.
  - The finding carries no `knownAs`.
  Decided by: redline
- **Did the reviewer leave a reproduction?** No, not for this round. `/tmp/redlinerepro/reviewer-r2-ReproTest.php` exists, but it is dated 2026-10-25 and is a Laravel test from another repository's run, so it has nothing to do with this nit. None is needed: the finding is about wording, and reading the code settles it.
  Decided by: redline
- **R2-1: is the finding real?** Yes, confirmed by reading.
  - `README.md:67` says: "`review @login` takes every inline comment by that login that no Redline reply has answered yet, replies inside Redline threads included, plus the body of their newest review that has one; `review <id>` takes that review's unanswered comments and body; `latest` is the newest review that is not Redline's and not the author's."
  - The filter now skips an answered body. `open_body` is "`(.body // "") != "" and (.id as $r | $answered_bodies | index($r) | not)`" (`scripts/redline-gh.sh:282`). An id takes its body only when `open_body` holds (`:301`). `@login` takes the newest of that login's reviews for which `open_body` holds (`:302`). `latest` picks the newest human review not by the gh user with `open_body` or an open comment (`:292`).
  - Commit `d9b584e` (R1-3) changed `README.md` only in the table row, as `git show d9b584e -- README.md` shows. Line 67 was added in this PR (`git diff main...HEAD -- README.md`).
  - The wording is stale. A reader is told that a repeat pass hands back a body that Redline already answered, which R1-3 removed, and is not told that an older unanswered note comes up on a later pass.
  Decided by: redline
- **R2-1: which words replace the stale ones?** The evidence answers this.
  - The person's R1-3 decision (round 1 `shape.md`, Decisions): "makes human-review skip a body whose review a Redline human-review comment already names, and keeps one body per pass (the newest one not yet answered), so a repeat pass over an answered review stops with nothing to revise and an older note comes up on the next pass".
  - The script header (`scripts/redline-gh.sh:32-41`): "An id keeps that review's open comments and its body when not empty and not answered ... @login keeps every open comment by that login (matched in any case, as GitHub matches logins), replies inside Redline threads included, and the body of their newest review that has one not answered (one body per pass); latest is the newest review that is not Redline's and not by the gh user (the author running Redline) with an open comment or an unanswered body".
  - `scripts/bash-conventions.md:9` says the README quotes the header rather than restating it, so the sentence follows the header.
  - `skills/redline-revise/SKILL.md:16` already words the answered check as "that no Redline human review comment has answered". The paragraph uses the same words so the two read alike.
  - The reviewer's proposed wording is kept in substance. "The body of their newest review whose body Redline has not answered yet" becomes "the newest of their review bodies that no Redline human review comment has answered yet", which drops the doubled "body".
  Decided by: redline
- **R2-1: does the fix also cover `latest` and the case-insensitive match?** Yes. Both sit in the same sentence, and the finding's own description names them.
  - **`latest`.** The finding cites `scripts/redline-gh.sh:292` and says an id "or `latest` skips a review whose body is answered". The paragraph's `latest` clause does not say a review must still have something open, which the header does say ("with an open comment or an unanswered body"). Before R1-3 the header said "with an open comment or a body", so the clause was already incomplete, and R1-3 made the gap matter. Today, after a pass has answered everything in the newest review, a second `review latest` moves on to an older review that still has something open. The paragraph does not tell the reader that.
  - **The match in any case.** R1-2 made `@login` match in any case. The header and the table row say so (`README.md:288`, "matched in any case"); the paragraph does not. The finding calls this omission harmless.
  - Covering all three clauses in one edit costs a few words and makes the sentence agree with the header. The reviewer's proposed fix covered two of the three clauses.
  Decided by: redline
- **R2-1: does the fix need a test case?** No.
  - No harness reads `README.md`. `grep -n README tests/*.sh tests/*.mjs .claude/redline/checks.sh` finds only a fixture review body at `tests/gh-test.sh:189` and a header comment in `checks.sh:34`.
  - `testing/tests.md:14` asks a change to a tested surface to add a harness case, and the paragraph is not a tested surface.
  - The proof is a set of `grep -c` counts on the old and new phrases, plus `wc -l` to show that no line was added. The gate still runs in full.
  Decided by: redline

## Decisions

- **R2-1 · fix.** In `README.md:67`, replace the selector sentence:
  - Today it reads: "`review @login` takes every inline comment by that login that no Redline reply has answered yet, replies inside Redline threads included, plus the body of their newest review that has one; `review <id>` takes that review's unanswered comments and body; `latest` is the newest review that is not Redline's and not the author's."
  - It becomes: "`review @login` takes every inline comment by that login (matched in any case) that no Redline reply has answered yet, replies inside Redline threads included, plus the newest of their review bodies that no Redline human review comment has answered yet (one body per pass, so an older one comes up on the next pass); `review <id>` takes that review's unanswered comments and its body, unless a Redline human review comment has already answered it; `latest` is the newest review that is not Redline's, not the author's, and still has an unanswered comment or body."
  - Nothing else on the line changes, and no other line changes.
  - **Likelihood and impact.** Anyone who reads the README's usage section before a `review` pass reads this sentence. It is the only user-facing description of the selector forms. As written, it says a repeat pass hands back an answered body, it hides that an older note comes up on the next pass, and it hides that `latest` moves past a review that is fully answered. No behaviour is wrong, because the script, the header, the table row and the skill all agree with each other.
  - **Cost.** One line in `README.md`, a file in the PR's diff. No code, no test, no new file.
  - **Verdict.** Proportionate.
  Decided by: redline

## Deferred

None.

## Standards retrospective (proposed)

1. **R2-1**: missing from `agent-os/standards/scripts/bash-conventions.md`.
   - **What is already covered.** Line 9 says the header is the documentation and the README quotes it, and that a change to `checks.sh`'s JSON updates the README's output contract in the same change.
   - **What is missing.** Nothing says a change to a subcommand's behaviour must reach every place that describes it. R1-3 updated the header, the README table row and the revise skill, and missed the README's user-facing paragraph.
   - **Proposed new bullet**, after the bullet at line 9 ("The header comment is the documentation, in this order: ..."): "A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)".
2. **Already covered, no edit.**
   - `testing/tests.md:14` and `:18` apply to a tested surface, and the README paragraph is not one (see Unattended answers).
   - `prompts/attribution.md` covers the commit message and this folder.
   - `process/internal-notes.md:6` keeps the README as the operating document, and the change stays a description of behaviour with no rationale.
   - `workflow/agents.md:20` already states the rule the paragraph now summarises.

Item 1 does not depend on a decision. If the approver declines it, record "Standards retrospective: no changes" under Decisions instead.

## Context

- **Visuals:** None
- **References:**
  - `README.md:67` and `:288`
  - `scripts/redline-gh.sh`: header 21-43, `human-review` filter 281-307
  - `skills/redline-revise/SKILL.md:16`
  - commit `d9b584e` (R1-3)
  - the round 1 spec for PR #38: `shape.md` Decisions R1-2 and R1-3, `plan.md` Task 6 steps 4 and 5
  - the #36 spec: `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/plan.md:12`
- **Product alignment:** `agent-os/product/mission.md`, "Decisions stay with people", and the problem statement that "nothing an agent does is hidden from the review thread"

## Standards Applied

- scripts/bash-conventions — the header is the documentation and the README quotes it rather than restating it; the target of the proposed retrospective bullet
- testing/tests — why a README-only change adds no harness case; the gate still runs in full
- workflow/agents — every decision names its owner; line 20 is the rule the paragraph summarises
- process/standards-retrospective — the proposed edit above, in its own commit
- process/internal-notes — the README is the operating document; this folder carries no private detail
- prompts/attribution — the commit and this folder carry no model or vendor name
