# PR #86 review round 4: a duplicate's target, by the form of its ref: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The two findings of Redline round 4 on PR #86 (issue #85), and nothing more. This run starts at round 4: rounds 1 to 3 are on the PR, and round 3 had no findings (`agent-os/specs/2026-11-11-1409-86-review-round-3/redline/round-3-findings.json`). The round reviewed the whole pull request at `dbfcd69`, which is the working tree's HEAD (`redline/snapshot-start.json`, `start_sha`). Line numbers here are at that commit.

- **R4-1** (correctness, low, confirmed, needs a decision): `workflows/redline-loop.js:2153`. The parse that gives a duplicate its target reads only a bare `3`, `candidate 3` or `index 3`. This PR's accounting sentence invites a ref with a note after the number, and such a ref gets no target.
- **R4-2** (nit, low, confirmed): `tests/loop-test.mjs:1520`. The parse has no check for `index N`, for any case, for a self-reference, or for an index out of range.

The round's three For the person lines and its five set-aside candidates are not findings and are not in scope. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares none (`askRules` is absent).

## Decisions

1. **R4-2: fix, one sibling scenario with one check per clause of the parse.** A new scenario, `coverage: a duplicate's target by the form of its ref`, goes in `tests/loop-test.mjs` section 15, after the escaping scenario. It has five candidates and one round with no finding. Candidate 1 is `refuted`, and four duplicates carry these refs:
   - `index 1`, lower case: the line gains `(candidate 1, `app/z.php:5`: refuted)`. Only the `index` alternative in the regex reads it.
   - `CANDIDATE 1`, upper case: the same addition. Only the regex's `i` flag reads it.
   - `4`, the entry's own index: shown as written, with no addition. Only the `to !== e.index` guard keeps it so.
   - `99`, past the round's five candidates: shown as written, with no addition. The `byIndex.has(to)` lookup keeps it so.

   The finding proposed `Index 3` for the first two. Splitting it into a lower-case `index` ref and an upper-case `candidate` ref makes each check turn on one clause. One mutation run, with the three mutations the finding names applied together, then turns exactly the first three checks red, each for its own clause (Unattended answer 6). The existing nine-candidate scenario is left byte for byte as it is: its block, label count and result check stay pinned. The new scenario pins no ref that has a note after the index, because that is R4-1's open question (Unattended answer 7). Confirmed by reading the set-aside entries' build (`workflows/redline-loop.js:2145-2156`), `accountCoverage`'s trim (line 1350) and every duplicate entry in the loop test (lines 1519 to 1521, the only three). Plan Task 2.
   Decided by: redline
2. **R4-1: a duplicate ref with a note after the index loses its target in the set-aside block. Decided: option B, widen the parse and tell the verifier.** The question the shaper returned: should a duplicate ref that opens with another candidate's index, then a note, keep its target? And if so, by the parse, by the prompt, or both? Or should the "cannot hide" sentences be narrowed to a bare index ref? The evidence states the aim but not the mechanism (Unattended answers 4 and 5). It was returned as a judgment call (`why_human: "spec assumption"`).
   - **The story, as the person saw it.** The verifier marks candidate 8 as a duplicate of candidate 3. Issue #7 covers only part of candidate 8, so the verifier follows this PR's prompt and writes the ref as `3; #7 tracks the case-folding`. Candidate 3 was refuted, which means candidate 8 is in effect dropped too. With a bare `3`, candidate 8's set-aside line would end `(candidate 3, app/z.php:5: refuted)`. With the note, the line ends at the ref. Block lines carry no index, so someone reading the review or the handoff cannot tell which line is candidate 3 or that it was dropped. They may leave a drop they would have overruled. The docs, the standard and the PR description all promise that such a duplicate cannot hide. Every duplicate ref recorded so far is bare (`3`, `1`, `R5-1`), but all of them predate the two sentences that invite a note. The follow-up spec chose to read only `3`, `candidate 3` and `index 3` and to show every other ref as written. It also said a prompt change needs your say. So the choice is yours: widen the parse, also tell the verifier to put the index first, or narrow the promise.
   - **The options, as the person saw them.**
     - **A: widen the parse.** Cost: one regex token at `workflows/redline-loop.js:2153` (end anchor to word boundary) and one comment line, plus one candidate and one check in `tests/loop-test.mjs`, seen red first. No prompt changes. Effect: a ref that opens with the index keeps its target whatever follows it. A ref that names the index later (`same as candidate 3`) is still shown as written, and a leading number that is not an index would be read as one. This supersedes the follow-up spec's three-form default for this form.
     - **B: widen the parse and tell the verifier.** Cost: option A, plus one clause in the accounting sentence in `workflows/redline-loop.js` (`candidatesBlock`) and `agents/redline-reviewer.md`, and one key-phrase check. Covered verify prompts change; coverage off prompts stay byte-identical. Effect: it also steers the verifier to put the index first, so fewer refs name it later in the text. This is the prompt change the follow-up spec's Decision 6 left to the person.
     - **C: keep the parse, narrow the claim.** Cost: wording only: `docs/running.md`, two comments (workflow and loop test), and the workflow/agents standard through the retrospective. The PR description is changed by hand. No code. Effect: the docs match the code. A partly tracked duplicate that names its issue in its ref still shows no target, so a duplicate of a dropped candidate can stay out of sight.
   - **The shaper's recommendation.** Option A: widen the duplicate-target parse to read a leading index token (`/^(?:(?:candidate|index)\s+)?(\d+)\b/i`), so a note after the index keeps the target, with a loop check seen red first.
   - **Chosen:** B: widen the parse and tell the verifier.
   - **Notes:** The author has the coverage accounting sentence, in the verify prompt and the agent file, say that a duplicate's ref opens with the candidate's index or the finding's id and that anything meant for the reader follows it, and keeps the widened parse that reads a leading index token as the backstop, with prompts under coverage off left byte-identical.
   - **Date:** 2026-11-11.
   - **What it settles.** The choice supersedes the #85 follow-up spec's Shaping default "A duplicate's target" (`agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/shape.md:64-67`) for a ref that opens with the index and carries a note after it, and it is the answer to the prompt change that spec's Decision 6 left to the person. A ref that names the index later in its text is still shown as written. Plan Task 3.

   Decided by: @michaelfromtheoutfit
3. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.2`. `git show origin/main:.claude-plugin/plugin.json` reads `0.2.1`, so the PR already carries its patch bump. Task 2 changes nothing a setup rerun writes: no template, nothing in `scripts/checks-template.sh`, no allow entry, and not the unattended section's body (`process/release`). None of R4-1's options changes such a file either.
   Decided by: redline
4. **Docs.** Task 2 commits `tests/loop-test.mjs` only, which is not in a Docs-step directory. It changes `workflows/redline-loop.js` only temporarily, for the red run, and restores it byte for byte before the commit. So the task needs no Docs entry (`process/docs-gate`). R4-1's Docs entries depend on the option, and Task 3 names them per option.
   Decided by: redline
5. **Plan approver adjustment 1 (Task 3's proof command): applied.** The approver found a `$` inside the quotes of the second half of Task 3's first proof bullet. That half ran `grep -cF` for the parse anchored at both ends, so the pattern carried that anchor's `$`. Two rules forbid it. Point 7 of the unattended section (`.claude/commands/agent-os/shape-spec.md:45`) says every command the plan gives the implementer is a plain pipeline with no `$`. `agent-os/standards/scripts/guard.md:13` says a role's command has the shape the guard accepts, with no `$`. The implementer's guard would refuse the command, and the proof step would stall.
   - **The change.** The second half now reads: `grep -c 'i.exec(e.ref)' workflows/redline-loop.js` prints `1`. The first half is unchanged: `grep -cF '(\d+)\b/i.exec(e.ref)' workflows/redline-loop.js` prints `1`.
   - **Confirmed at `dbfcd69`, by running both halves.** `grep -c 'i.exec(e.ref)'` prints `1`, and its one match is line 2153, the parse anchored at both ends. `grep -cF '(\d+)\b/i.exec(e.ref)'` prints `0`.
   - **Why the pair is a proof.** After Task 3, the parse (moved down by the comment's new lines) is the one match of each command. Neither Task 3's new comment nor its prompt sentence holds `exec(`. So `1` and `1` together show that the one target parse left ends in the word boundary, and the parse anchored at both ends is gone.
   - **What stays.** The `$` in the Edit text of Task 2's step 1, in Task 3's step 3, and in Task 3's "What happens today" is text for Edit and for the reader, not a shell command, and the approver said it can stay.
   - **What it does not change.** One proof command only. No disposition, task, file list or count moves, and no new decision arises.
   - **Commands this reshape ran.** `git rev-parse --short HEAD`, `git status --short`, `grep` and `sed -n` over the workflow, the plan and the standards.
   Decided by: redline

### Proportionality

- **R4-1, the one correctness finding.** It is `ask` for a reason other than cost (Decision 2), but here is the record:
  - **Likelihood: low.** The failure needs a `duplicate` entry whose ref adds a note after the index. Every duplicate ref recorded in a coverage findings file in this repository is bare: `3` and `1` (`agent-os/specs/2026-11-06-1019-80-review-round-1/redline/round-1-findings.json`) and `R5-1` (`agent-os/specs/2026-11-07-0806-80-review-round-5/redline/round-5-findings.json`). The other files hold no duplicate. All three were written before this PR added the two sentences that invite a note: R1-4's "the ref of any other outcome" (`174000d`) and the follow-up's "write each of those refs for the teammate who may overrule it" (`59903d8`). The invitation is real: a partly tracked candidate whose remainder is a duplicate is told to name the issue in its ref, and the ref is also to name the index.
  - **Impact: low and visible only to the person.** The duplicate's own line is still in the block, with its summary and its ref as written. What is lost is the addition: the target's place and outcome. Block lines carry no index, and findings and For the person entries are not in the block, so the person cannot tell which line is the target or that it was dropped. They may then leave a drop they would have overruled. No count, findings file, prompt or disposition changes.
  - **Cost, by option.**
    - Option A: one regex token at line 2153, the comment at lines 2142 to 2144, and one loop-test entry and check. All are in files the PR's diff touches, with no new dependency or abstraction.
    - Option B: option A plus the accounting sentence in two places (`workflows/redline-loop.js:1244`, `agents/redline-reviewer.md:50`) and one key-phrase entry.
    - Option C: comment and docs wording in three files, plus the standard through the retrospective. The PR description changes by hand.
- **R4-2** is a nit, so the rule does not apply. For the record: the task adds one scenario (about 20 lines) to one file in the PR's diff. It also applies two temporary edits to one other file, restored before the commit.

## Unattended answers

1. **Scope.** The round's two findings (`redline/round-4-findings.json`), as the unattended section's point 6 sets.
   Decided by: redline
2. **Visuals.** None. The round adds one loop-test scenario, and R4-1's options change a regex, prompt text or docs.
   Decided by: redline
3. **Product context.** `agent-os/product/mission.md:17`, "Honest about its reach": a block that claims a duplicate of a dropped candidate cannot hide, while one form of ref hides it, overstates what the person is shown. That is R4-1's subject, and the person settles it. Line 15, "Decisions stay with people": R4-1 is returned, not decided, and R4-2 needs no decision. There is no conflict and no mission edit.
   Decided by: redline
4. **R4-1: does the question arise?** Yes. The trace:
   - `accountCoverage` trims each ref (`workflows/redline-loop.js:1350`).
   - The parse is `/^(?:(?:candidate|index)\s+)?(\d+)$/i.exec(e.ref)` (line 2153), anchored at both ends. So `3; #7 tracks the case-folding` and `candidate 3: same missing owner check` do not match, `to` is 0 (line 2154), `into` is `null` (line 2155), and `setAsideBlock`'s `into(e)` adds nothing (line 891).
   - The prompt invites that form. The accounting sentence, in `candidatesBlock` (line 1244) and in `agents/redline-reviewer.md:50`, asks for `duplicate (ref the index or the id it collapses into)`. It also says a partly tracked candidate has "the issue named in the finding's description, the forThePerson line or the ref of any other outcome", and `duplicate` is one of those outcomes. Then it says "write each of those refs for the teammate who may overrule it".
   - The recorded refs were all bare (Proportionality), but all predate both sentences. So the question is live, and the reviewer's `needsDecision` stands.
   Decided by: redline
5. **R4-1: does the PR description, the original spec or the code's docblock answer it?** It answers the aim, not the mechanism, and the two disagree for this form:
   - **The aim.** The follow-up spec's Decision 2, from the brief and "not reopened" (`agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/shape.md:28`): "When that is another candidate's index, the line also gives that candidate's outcome, so a duplicate of a dropped or tracked candidate cannot hide." The PR description says the same: "When that is another candidate, it also gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide." So do `docs/running.md:48`, `agent-os/standards/workflow/agents.md:37` and the comment at `workflows/redline-loop.js:881-883`.
   - **The mechanism.** The follow-up's Shaping default "A duplicate's target" was approved with the plan (`shape.md:64-67`): "A duplicate ref is read as an index when, trimmed, it is `3`, `candidate 3` or `index 3` (any case) … Any other ref (a finding id, or an index out of range or naming the candidate itself) is shown as written, with no addition and no warning." The code's own comment (lines 2142 to 2144) says the same, and the code matches it.
   - **The prompt.** The follow-up's Decision 6 (`shape.md:36`): "No prompt change unless the wider block needs one; in that case, stop and ask." So option B is a question for the person by the spec's own terms.

   Choosing among the options means overriding either the approved default (options A and B) or the brief's aim (option C). That is a change to an assumption of the spec, so it is returned as a judgment call (`why_human: "spec assumption"`), not answered here. The same shape was declined on this PR's round 1, recorded in `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`, Unattended answer 6: loosening the exact `finding` ref match "would change which refs that rule accepts, a change to an earlier round's decision that this finding does not need". That answer is cited as consistent, not as settling this question.
6. **R4-2: does the fix depend on R4-1's answer?** No. Each new ref was traced under each option:
   - **Today's parse:** `index 1` and `CANDIDATE 1` match, giving `to` 1. `4` matches, but `to === e.index`, so `into` is `null`. `99` matches, but `byIndex` (line 2145) holds only the indexes `accountCoverage` kept (1 to 5), so `into` is `null`.
   - **Option A's widened parse, `/^(?:(?:candidate|index)\s+)?(\d+)\b/i`:** the same four results.
   - **Options B and C:** the parse is unchanged.

   So the four checks hold whatever the person picks, and R4-2 has no `dependsOn`. If R4-1 is decided as A or B, its task adds the note form to this scenario (`plan.md`, Task 3).

   The mutation run's attribution, traced against every duplicate in the suite (lines 1519 to 1521 and the new four). Line 2153 is mutated to `/^(?:(?:candidate)\s+)?(\d+)$/` (no `index`, no `i`), and line 2155 drops `to !== e.index &&`.
   - `index 1` fails only for the missing `index`.
   - `CANDIDATE 1` fails only for the missing `i`.
   - `4` gains `(candidate 4, `app/z.php:8`: duplicate)` only for the missing guard.
   - `99` stays as written.
   - The nine-candidate scenario's `3` and lower-case `candidate 2` still match, and neither names itself, so its pinned block stays green.

   The expected red run is `612 checks passed, 3 failed`. The green count is 615: 610 at `59903d8` (the follow-up spec's As built), plus four checks, plus the run-record check `go()` adds for a run that reaches its handoff (`tests/loop-test.mjs:235-239`). `result('done', { handoffPosted, … })` at `workflows/redline-loop.js:3432` puts `handoffPosted` on such a run's result.
   Decided by: redline
7. **R4-2: which forms does the spec name, and which does this round pin?** The follow-up's Shaping default (Unattended answer 5) names five: three accepted forms in any case, and two refused refs (the candidate itself, an index out of range). The suite pinned `3`, lower-case `candidate 2` and the id `R1-1` (`tests/loop-test.mjs:1519-1521`). This round adds `index`, upper case, the candidate itself and an index out of range. It does not pin a ref with a note after the index, as written or with a target: either way it would decide R4-1.
   Decided by: redline
8. **What was run, and what was traced.** No `node` run was attempted. This PR's round 1 shaper recorded the guard's refusal ("'node' is not available to the shaper", `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`, Unattended answer 7). `/tmp/redlinerepro/` holds only round 1's files (`reviewer-r1-repro.mjs`, `reviewer-r1-ReproTest.php`). There is no `reviewer-r4-ReproTest.php`, so the reviewer wrote no reproduction for round 4, and both findings were traced from the code. The implementer runs the loop test only through `checks.sh` (the unattended section's point 7). R4-2's red run is the mutation through the gate. Read-only commands run: `git log`, `git show origin/main:.claude-plugin/plugin.json`, `git diff --stat 8807864 HEAD`, `grep`, `sed -n`, `jq` over the recorded findings files, and the `redline-gh.sh` reads below.
   Decided by: redline
9. **Known-finding check.** Neither finding is tracked elsewhere:
   - `scripts/redline-gh.sh issues-search "duplicate ref"`, `"set-aside block"`, `"duplicate target"` and `"coverage accounting"` return nothing. `issues-search "duplicate"` returns only #20 (learning from post-handoff comments), which is unrelated.
   - `scripts/redline-gh.sh pr-comments 86` has two earlier notes on duplicates, and neither is this:
     - Round 1's coverage candidate 2 (`workflows/redline-loop.js:2102`): a duplicate of a dropped index was not listed. The follow-up spec acted on it and built the target parse this round reviews.
     - Round 2's set-aside candidate (`workflows/redline-loop.js:1206`), ruled `disproportionate`: a duplicate ref that names the issue after an id is not renamed. That is the id path. Its ruling also said "duplicate refs are never validated or counted by id, so no count, list or disposition changes", which the follow-up's target parse has since made untrue for index refs. So it neither covers nor settles R4-1.
   - The PR's round folders: round 1 (R1-1 to R1-4, all fixed), round 2 (R2-1 and R2-2, fixed), round 3 (no findings). None is either finding.
   Decided by: redline
10. **Scratch test.** None written. There is no PHP in this repository, and the shaper cannot run `node`.
    Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 3.
- **Run caution (#81): noted for the person, not a decision and not a finding.** The PR description says a Redline self-review round that edits `workflows/` or `agents/` meets #81. Task 2 edits `workflows/redline-loop.js` only for its red run and restores it, so its commit carries `tests/loop-test.mjs` alone. R4-1, decided as option B (Decision 2), commits `workflows/redline-loop.js` and `agents/redline-reviewer.md` in Task 3. The running workflow is unaffected; the exposure is a relaunch after that commit.

## Standards Applied

- `testing/tests`: a tested surface gains a case beside the neighbouring decision that must not change (line 22); red before green, here by mutation since the code already holds the behaviour (line 27); a check's name states only what it asserts (line 24).
- `workflow/agents`: the #85 bullet (line 37), whose "cannot hide" sentence is R4-1's subject; the #80 R3-3 rule (line 16) that a changed rule is applied wherever the prompt and the agent file state it, which option B must meet.
- `workflow/replay`: Task 2 changes no prompt. Option B's text would enter `candidatesBlock`'s branch with candidates only, so a `coverage off` prompt stays byte-identical (line 15).
- `scripts/guard`: every command the plan gives the implementer has the shape the guard accepts, with no `$`, no backticks and no process substitution (line 13; Decision 5).
- `process/docs-gate`: one entry per touched plugin file, or the reason there is none (Decision 4).
- `process/release`: the version stays `0.2.2` (Decision 3).
- `process/standards-retrospective`: the proposed list below, applied in its own commit.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above. Each item is proposed, not applied. The standards approver approves the list, and the implementer applies the approved items in one commit after Task 3's: `redline: record the round 4 review lessons in the standards (#85)`.

1. **R4-2, missing: `agent-os/standards/testing/tests.md` line 22**, the bullet that opens "A change that touches a tested surface adds a case in the same commit". Append, after its closing "that must not change":

   ```text
   ; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause: the #85 follow-up's duplicate-ref parse (`3`, `candidate 3` or `index 3`, any case; the candidate itself or an index out of range shown as written) was pinned by `3` and a lower-case `candidate 2` alone, so dropping `index`, the case flag or the self guard stayed green (#86, R4-2)
   ```

2. **R4-1, drafted for its decision (option B, Decision 2), two edits to `agent-os/standards/workflow/agents.md`.** The shaper held this item for R4-1; the resolve agent drafted it once the person had decided.
   - **Line 37**, the #85 bullet ("The verifier's rules from the #817 rerun"). In its sentence "a `known` line names the issue, and a `duplicate` of another candidate's index also gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide; nothing set aside, no block", insert after "cannot hide", before the semicolon:

     ```text
     : the accounting sentence, in the verify prompt and the agent file, has a duplicate's ref open with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it, and the workflow reads the target from a leading index token (`3`, `candidate 3` or `index 3`, any case) whatever follows it, so a note after the index keeps the target (#86, R4-1)
     ```

   - **Line 16**, the bullet that opens "A decision that changes a rule a prompt states is applied everywhere". Append, after its closing "(#80, R3-3)":

     ```text
     ; and a prompt sentence that invites more text into a field the workflow parses (a coverage ref) is checked, in the same change, against every parse of that field, so the prompt keeps the text out of the field or after the parsed token and the parse reads past it: R1-4 kept a partly tracked candidate's issue out of a `finding` ref, which the workflow matches by id alone, and R4-1 had a `duplicate` ref open with the index or the id, a note after it, and widened the target parse, anchored at both ends, to read a leading index token (#86, R1-4, R4-1)
     ```

     This is the general lesson the shaper named under any option: R1-4's lesson on finding refs, repeated on duplicate refs.
3. **Decision 1's mutation run, already covered: `agent-os/standards/testing/tests.md` line 27** (red before green). For a check over behaviour the code already has, round 2 of this PR showed red by a temporary mutation restored before the commit (`agent-os/specs/2026-11-11-1409-86-review-round-2/plan.md`, Task 3). No change.
4. **Decision 3, already covered: `agent-os/standards/process/release.md` line 5.** One bump per PR, and this PR already carries it. No change.
5. **Decision 4, already covered: `agent-os/standards/process/docs-gate.md` line 5.** A test file is not in a Docs-step directory, and a file restored before the commit is not altered. No change.
6. **Decision 5, already covered: `agent-os/standards/scripts/guard.md` line 13** ("An agent's prompt tells it the shape of a command the guard accepts: no `$`, no backticks, no process substitution"), and point 7 of the unattended section in `.claude/commands/agent-os/shape-spec.md`, which says the same of every command a plan gives the implementer. A `$` inside a pattern a proof step greps for is the same rule, and the plan approver caught it before any build. No change.

No pattern was invented outside `agent-os/standards/`. Task 2's scenario uses section 15's existing helpers (`fenced`, `cand`, `go`, `covArgs`, `body`).
