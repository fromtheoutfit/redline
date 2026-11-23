# PR #120 review round 3: what a shape-stage resume reruns, the upgrade all-clear, a pin that reads the field, the restore clause's opening, and the cost of the spec check first — Shaping Notes

Shaped by Redline in unattended mode, for review round 3 of PR #120 (issues #117 and #116), from the round's six findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). Line numbers are at `bf12327`, the head of the pull request's branch.

## Scope

The round's six findings, nothing more. This is the final nit round: every finding is a nit, each low, and the verifier confirmed every one, so none needs a second look.

- `fix`, six: R3-1, R3-2, R3-3, R3-4, R3-5, R3-6.
- No `decline`, no `defer`, no `ask`.

Out of scope, as the pull request has it: `scripts/`, `hooks/hooks.json`, `scripts/redline-guard.sh`, `scripts/redline-gh.sh`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/` and `skills/`, the unattended section, and the Verification Gate's text. This round touches none of them, and it does not touch `agents/redline-shaper.md` either. The version stays `0.4.5`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the six findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, the pull request's own spec (`agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/`) and the folders of rounds 1 and 2; see `references.md`. The product alignment is `agent-os/product/mission.md` (line 15, every decision posted with its owner and the real decisions kept with people); R3-1, R3-2 and R3-6 make what the person reads before a relaunch or an update true.
   Decided by: redline
2. **Which standards apply.** workflow/replay (lines 19, 20, 21), workflow/agents (line 46), testing/tests (lines 13, 14, 31, 32, 35, 36, 37), process/docs-gate (lines 5, 7, 16, 19, 20), process/release (line 5), process/standards-retrospective (lines 7, 10, 11) and prompts/attribution (lines 6, 9). Each was read at `bf12327` and is copied in `standards.md`.
   Decided by: redline
3. **Is any finding already known?** No. `scripts/redline-gh.sh issues-search` for `spec status` lists #122; for `relaunch`, #69, #116, #117 and #122; for `ownCheck`, #122; for `vetShape`, #122; for `restore`, #118 and #121; for `resume`, #69, #77, #98, #115 to #117, #119, #121 and #122; for `upgrading`, nothing. #116 and #117 are this pull request's own issues; #121 is round 1's deferral (the revise-only path, R1-1) and #122 round 2's (a reshape whose Writes were refused, R2-5), neither of which covers a finding of this round; the rest are unrelated. `scripts/redline-gh.sh pr-comments 120` raises these points only in this round's review. Rounds 1 and 2 dispositioned R1-1 to R1-4 and R2-1 to R2-5: R3-6 is a cost of R1-3's fix, not a re-raise of it, and R3-4 is a slip in R2-3's commit.
   Decided by: redline
4. **R3-1: does the pull request's spec say where a resume after the spec-status call's own failure goes?** Yes. Its table "Every label a run can resume at" (`shape.md:92`) lists `spec status <tag>[ #k]` at stage `shape`, for the stops "returned nothing; the check itself refused", with nothing appended to its line. `checkSpec`'s comment says the same (`workflows/redline-loop.js:3410-3411`: "The check's own failure keeps its own label, so a resume reruns the check"), and the code agrees: the throw at 3417 passes no label, so `stageError` (655-657) falls back to `lastLabel`, which `run()` set to the spec-status call (750, 3414). The loop test pins it ("spec: a failed check names the status label, not the shaper", `tests/loop-test.mjs:1809-1810`). `docs/running.md` (208) disagrees: "A resume at the shape stage reruns the shaper". That disagreement is the fix (point 2's last sentence; Decision 1). No other reader-facing file states it: `README.md` and `docs/contract.md` do not name the spec-status call, and `docs/upgrading.md`'s "where a resume reruns the shaper" (31) is about the drafted-issue stop, which does resume at the shaper.
   Decided by: redline
5. **R3-2: does the pull request say which stopped runs an update across 0.4.5 changes?** Yes. Its description: "A marker written before 0.4.5 has no `ownCheck`, so its resume reads as an ordinary stop", and, under "Behaviour that changes on purpose", "An entry with no `ownCheck` whose error opens `the resolve agent ` gets the line alone. It got the correct-what-you-wrote clause" and "A reshape resumed after a result check, the spec check or a crash is told to correct or restore. It was told to rewrite from scratch." The code agrees: an absent field reads as false (`workflows/redline-loop.js:291`), the resolve's clause needs it true (728), and a reshape's clause goes by the label (713-720). So a run stopped now at a resolve check or at a reshape is changed by the update, though it never resumed. A first shape keeps its line byte for byte for an entry with no field (description: "byte for byte for an entry with no field"; the check "resume: a first shape resumed from an entry with no ownCheck ...", `tests/loop-test.mjs:1683`), so a run stopped there is not. The section's first paragraph (`docs/upgrading.md:39`) says the first half; its last sentence (41) contradicts it. The fix is that sentence (Decision 2).
   Decided by: redline
6. **R3-3: is the check vacuous, and how is the fix seen red?** Yes, it is vacuous. `resumeLine` reads `entry.ownCheck` for the shaper (714-720) and the resolve agent (728) only; at `recheck r1` the checker's line is the same whatever the field holds, so `ownCheck: false` and an absent field build the same prompts under any normalisation at 291. The fix runs the comparison at `shape r1`, against the run that already resumes there from an entry with no field (`reshapedFieldless`, `tests/loop-test.mjs:1682`), on the same scenario (`two`) and the same error. Two runs of `two` build the same prompts: the mock reads a round's findings by index (`tests/loop-test.mjs:189`), `go()` copies the commit lists (421), `two` holds neither of the things testing/tests line 36 names the mock consuming across runs in one process (the heads a gather reads, a filed record), and `samePrefix` already compares two runs of `two` (1677). The pin holds before and after the change, so it cannot be red before the build; it is seen red under the mutation the finding names, `ownCheck: entry.ownCheck !== undefined` at 291, whose anchor `ownCheck: entry.ownCheck === true }` occurs once (testing/tests, line 35). The door testing/tests line 36 names, a mutated copy in the temp directory, needs an interpreter no Redline role may run, so the mutation is made in place, run through the gate and undone before the commit, as round 2's Task 2 and PR #114 round 1's Task 7 did (round 2's `shape.md`, answer 6).
   Decided by: redline
7. **R3-4: is the slip real?** Yes. `git show 07a7316 -- tests/loop-test.mjs` shows the removed line `const RESTORE = ' This step is a reshape, ...` and the added `const RESTORE =' This step is a reshape, ...`, with the same string; at `96eb7aa` the file held `const RESTORE = '` once. The constants beside it (`FROM_SCRATCH`, `REWRITTEN`, `CORRECT_IN_PLACE`, 3711-3713) keep `= '`. It changes no behaviour, so no check can see it.
   Decided by: redline
8. **R3-5: does the pull request's spec record the restore clause's opening as a deliberate choice?** No. Its decision 14 sets the clause by what it does (after any stop that is not the workflow's own check, restore what is missing), and "The line, as built" (`shape.md:156`) records the clause's text as that spec built it, with no reason given for the words "already holds the plan". Rewording the opening keeps the spec's approach, so it is a fix; the spec's record is left as it is and this folder records the new words, as round 2's Decision 3 did for the clause beside it. The opening is in three places only (a search outside the spec folders): `workflows/redline-loop.js:720`, `RESUME_WORDS` (`tests/loop-test.mjs:416`) and `RESTORE` (3714). Rule 9 of `agents/redline-shaper.md` (32), `docs/running.md` (208) and the replay standard (line 19) say what the clause has the rerun do and none repeats the opening, so none changes. The clause is given after the spec check's three stops (no `plan.md`, no `shape.md`, no Decisions section, 3422-3431) and after a call that returned nothing; the new opening, "already holds the earlier work of this round, though part of it may be missing", is true after each, since a reshape runs only after the first shape passed the spec check.
   Decided by: redline
9. **R3-6: what settles the order's cost?** Round 1's Decision 2 (`agent-os/specs/2026-11-22-1457-120-review-round-1/shape.md:44`) ran the spec check first so that a missing file stops as a stop to fix by hand, and said of the other proposed fix that it "makes the same calls and stops with more code"; it did not weigh the spec-status call's own failure. That failure keeps the call's label on purpose, a rule older than this pull request: `checkSpec`'s comment ("The check's own failure keeps its own label, so a resume reruns the check", 3410-3411, #57) and the pull request's own table (`shape.md:92`). The finding's second option, giving that failure the shaper's label when a result check would also stop, would undo #57's rule for one combination; its first option, accepting the extra relaunch and saying so, keeps it. Round 1's folder is that round's record and keeps its text; this round's comment and docs sentence state the cost (Decision 6).
   Decided by: redline
10. **This round edits `workflows/redline-loop.js`**, which the pull request's description cautions about ("a round that edits one of them meets #81"). It is repository content here: the repository is the plugin, loaded in place (shaper rule 7; `docs/guard.md`, the self-hosted case). A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"). No agent file changes, so the skill reports no agent drift for this round.
    Decided by: redline
11. **Scratch test.** None written. There is no PHP in this repository. The one round-3 file under `/tmp/redlinerepro/` is `reviewer-r3-repro.sh`, dated Nov 19, an earlier run's git pathspec probe, unrelated to this pull request; it was read, not run. Every question above was settled by reading the files cited and tracing the paths by hand.
    Decided by: redline
12. **No sweep.** A sweep (testing/tests, line 36) runs the harness under two scripts with an interpreter, which no role of a Redline round may run; rounds 1 and 2 recorded the same. R3-5 changes one resume clause, which only a reshape resumed with `ownCheck` false is given, and the rule over every scenario (`RESUME_WORDS`, read by `go()`) proves no prompt of a run without a resume entry holds a resume line; it carries the new opening once Task 6 lands. R3-6 changes a comment; R3-3 and R3-4 change tests; R3-1 and R3-2 change docs. So a first run's prompts are byte for byte what they were.
    Decided by: redline
13. **No upgrade note.** R3-2 corrects `docs/upgrading.md`'s own section. R3-5 rewords a clause this pull request added and no release has shipped (the tag is a person's step after the merge), so no older run's line changes because of it (process/docs-gate, line 20).
    Decided by: redline

## Decisions

1. **R3-1: fix, by saying where the spec-status call's own failure resumes.** In `docs/running.md`, "Run markers and resume" (208), "A resume at the shape stage reruns the shaper, which never touches `redline/`." gains ", unless the spec check's own call failed (below)", and after the sentence that describes the spec check (it ends "the one call the workflow writes is the repository-rule ask).") a sentence says that when that call itself fails, the stop is at stage `shape`, as one to fix by hand, and keeps the call's own label, so a resume reruns the check alone and the shaper's result replays from cache. A docs phrase pin is red first. The finding's own wording ("reruns the step its label names") is not taken whole: the paragraph's next sentences use "it" for the shaper, so the exception is named beside the spec check, where the paragraph already describes it.
   Decided by: redline
2. **R3-2: fix, by limiting the all-clear to the runs it is true of.** In `docs/upgrading.md`, "A stopped run across 0.4.5" (41), "A run that never resumed at one of those steps is not affected." becomes "A run that never resumed at one of those steps, and is not stopped at one now, is not affected." So the sentence agrees with the first paragraph (answer 5), and "Finish or restart a stopped run before updating across 0.4.5" before it stands for both. A docs phrase pin is red first.
   Decided by: redline
3. **R3-3: fix, by running the comparison where the field is read.** The scenario at `tests/loop-test.mjs:1765` resumes at `shape r1` with `ownCheck: false`, on `two` with the error `the shaper gave no disposition for R1-2`, and the check at 1767 compares every prompt with `reshapedFieldless`'s, and pins the shaper's prompt against the literal line and the from-scratch sentence (testing/tests, line 31: a comparison of two outputs passes when both are empty). Its name says it runs at a first shape, whose line reads the field (line 32). It is seen red under the in-place mutation of 291 (answer 6), with four reshape checks that pass `ownCheck: false` red beside it.
   Decided by: redline
4. **R3-4: fix, by putting the space back.** `const RESTORE =' This` becomes `const RESTORE = ' This`. No check changes, and no red run is possible.
   Decided by: redline
5. **R3-5: fix, by opening the restore clause with what is true after every stop it follows.** In `workflows/redline-loop.js:720`, " This step is a reshape, so the spec folder already holds the plan: read ..." becomes " This step is a reshape, so the spec folder already holds the earlier work of this round, though part of it may be missing: read ...". The rest of the clause keeps its bytes. `RESTORE` and `RESUME_WORDS` follow the new words, so the six checks that compare a resumed prompt with `RESTORE` are red first, with one new check on the resumed reshape after the "no plan.md" stop (`plainLost`). No apostrophe in the new words, so neither string needs an escape.
   Decided by: redline
6. **R3-6: fix, by accepting the extra relaunch and saying so (the finding's first option).** The comment above `vetShape` (3818-3835) gains a passage before "Every check after the spec check names the shaper's label itself": the spec-status call's own failure keeps its label (#57), so its resume replays the shaper's result and a result a later check refuses stops the relaunch again, at the shaper, with nothing to fix by hand; it needs both in one attempt, the checks after the spec check had it before R1-3, and the other option would undo #57's rule, so it is accepted. `docs/running.md` says the same after R3-1's sentence. A docs phrase pin is red first. The behaviour itself is pinned in its parts: the status failure's label (`tests/loop-test.mjs:1809-1810`), the result check's stop at the shaper after the spec check, with `ownCheck` true (1811-1812 and the `OWN_CHECKS` rule), and a resume line appended to the one label its entry names (`run()`, 749-756; "resume: no other prompt carries the line", 1609).
   Decided by: redline
7. **Task order.** Task 4's mutation is the round's first edit of `workflows/redline-loop.js`, made and undone while the file still matches HEAD, so `git diff` can show it undone; Tasks 6 and 7 change the file afterwards, in different places. Tasks 2 and 7 change `docs/running.md:208` in different sentences, Task 7's after Task 2's. Tasks 2, 3 and 7 change the `docs/running.md` phrase list (`tests/loop-test.mjs:3111`): Task 2 appends to the `docs/running.md` row, Task 3 adds a `docs/upgrading.md` row after it, Task 7 appends to the `docs/running.md` row as Task 2 leaves it. Tasks 5 and 6 change the same line (3714): Task 5 its spacing, Task 6 its string. Each task names its anchors by text, as the tasks before it leave them.
   Decided by: redline

### Proportionality

Every finding is a nit, so the rule's record is not required; the costs are noted all the same.

- **R3-1, R3-2.** One docs sentence changed and one added; one docs sentence changed; one phrase pin each. In files the pull request changed. In proportion.
- **R3-3.** One scenario and one check rewritten, seen red under a mutation undone before the commit. In proportion.
- **R3-4.** One character.
- **R3-5.** One clause opening in `workflows/redline-loop.js`, two test strings and one check. The clause is this pull request's own and unreleased, so rewording it costs no replay (workflow/replay, line 21). In proportion.
- **R3-6.** Rare: it needs a spec-status call that fails itself (its `git grep` refused, or the GitHub agent failing) in the same attempt as a shaper result one of the checks after the spec check refuses. Not observed. When it fires, the person fixes the refused call, relaunches, and the run stops once more at the shaper, where the skill says nothing needs fixing by hand; nothing is lost. The finding's second option costs a `try` around the result checks after a failed status call and a relabelled throw in `vetShape`, and changes where a status failure resumes, a #57 rule; the first option costs one comment passage, one docs sentence and one pin. The first is in proportion; the second is not worth its change to #57's rule.

## Declined

None.

## Deferred

None.

## Standards retrospective (proposed)

Listed from Decisions 1 to 7 and the unattended answers; nothing went red while shaping. No item finishes a finding, since every finding's fix is in its own task. Each clause is read back in its whole line once applied (process/standards-retrospective, line 10).

1. **`agent-os/standards/process/docs-gate.md`, line 19: missing (R3-1, Decision 1).** Append, after `until #120, R2-2` at the end of the line:

   ```
   ; and a sentence that says what a resume at one stage reruns is read against every stop that stage raises, the one that keeps another call's label included: `docs/running.md` said a resume at the shape stage reruns the shaper, while the spec-status call's own failure keeps that call's label (#57) and reruns the check alone, until #120, R3-1
   ```

2. **`agent-os/standards/process/docs-gate.md`, line 20: missing (R3-2, Decision 2).** Append, after `before updating across 0.4.5` at the end of the line:

   ```
   ; and the section's closing all-clear is read against each of its paragraphs: it said a run that never resumed at a resolve check or at a reshape is not affected, while its first paragraph says a run stopped at one now resumes without the clause its stop had, until #120, R3-2
   ```

3. **`agent-os/standards/workflow/replay.md`, line 19: missing (R3-5, Decision 5).** Append, after `until #120, R2-3` at the end of the line:

   ```
   ; and a clause given after several stops opens with what is true after each: the restore clause said the spec folder already holds the plan, and the spec check's `no plan.md` stop is one it follows, until #120, R3-5
   ```

4. **`agent-os/standards/workflow/replay.md`, line 20: missing (R3-6, Decision 6).** Append, after `(#120, R2-5, deferred)` at the end of the line:

   ```
   ; and a change to the order of two checks is weighed for every stop either raises, the first check's own failure included: R1-3 ran the spec check first, and a spec-status call that fails itself keeps its own label (#57), so its resume replays a shaper result a later check refuses and the run stops twice, which the comment on `vetShape` and `docs/running.md` say (#120, R3-6)
   ```

5. **`agent-os/standards/testing/tests.md`, line 36: missing (R3-3, Decision 3; and round 2's R2-1).** The line says a mutation run goes through a mutated copy in the temp directory, "so the checkout is never edited"; a Redline round cannot, since its roles run no interpreter, and three rounds have used another door that no standard records. Append, after `is reported as a crash (#117)` at the end of the line:

   ```
   ; and a Redline round, whose roles may run no interpreter, makes the mutation in place instead: the line changed, the gate run, the line put back before the commit with `git diff` on the file printing nothing, so the mutation is the first edit the round makes to that file (PR #114 round 1, Task 7; #120, R2-1, R3-3)
   ```

The replay standard's clauses that describe the restore clause by what it does (line 19, "after any other stop (a missing spec file, a call that returned nothing), restore what is missing") stay true after R3-5, so no task changes them in its own commit (process/standards-retrospective, line 11).

Already in a standard, no edit:

- A call site pinned only with input the function returns unchanged is not pinned (`testing/tests.md`, line 13): R3-3 is that pattern, a comparison run at a label whose line never reads the field.
- A pin that held before is seen red under a mutation of the clause it turns on (`testing/tests.md`, line 35): R3-3. Item 5 adds the door a Redline round uses.
- A comparison of two outputs pins one side against a literal (`testing/tests.md`, line 31), and a check's name states what it asserts (line 32): R3-3's rewritten check.
- `stageError` falls back to the last label (`workflow/agents.md`, line 46), and the spec-status call's own failure keeps its label by design (#57, `checkSpec`'s comment): R3-1 and R3-6.
- A count stated is read off a run or a search of the source (`testing/tests.md`, line 37): the expected counts in `plan.md` add each task's checks to round 2's measured 1670, and the red counts are read off the checks that compare against `RESTORE` and the entries that pass `ownCheck: false`.
- A docs change needs no Docs entry of its own (`process/docs-gate.md`, line 16), and an older stopped run's changed line gets an upgrade section (line 20): answer 13, no new section.
- R3-4 teaches nothing a standard should hold: a scripted replace dropped a space in a line whose string it kept, and the gate has no JavaScript formatter (`.claude/redline/checks.json`, `formatter: null`), which no Redline role may change.

No pattern is used that the standards do not hold, except the in-place mutation, which item 5 proposes.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`: every decision is posted with its owner and the person can overrule it. R3-1 and R3-6 tell the person truly what a relaunch after a shape-stage stop reruns and when a second one follows; R3-2 tells them truly which stopped runs an update changes.

## Standards Applied

- workflow/replay — line 19, the resume clauses (R3-5, standards item 3); line 20, the road a stop's fact travels and the order of the checks that set it (R3-6, standards item 4); line 21, the cost of rewording a resume sentence (R3-5: unreleased, so none).
- workflow/agents — line 46, `stageError`'s fallback to the last label (R3-1, R3-6).
- testing/tests — line 13, a call site pinned with input it returns unchanged (R3-3); line 14, checks that fail rather than throw; line 31, one side pinned against a literal (R3-3); line 32, a check's name (R3-3, R3-5); line 35, red before green and a pin red under a mutation (R3-3); line 36, the sweep and the mutation door (answers 6 and 12, standards item 5); line 37, counts read off the source.
- process/docs-gate — one Docs entry per touched plugin file, in its task (lines 5, 7); a docs change needs none of its own (line 16); a docs sentence read against the code (line 19, standards item 1); the upgrade section (line 20, answer 13, standards item 2).
- process/release — no bump in a review round of the same pull request.
- process/standards-retrospective — the edits proposed here and applied in one commit (line 7); an appended clause read back in its line (line 10); a standards sentence that states what the code does changes with the code (line 11: none does this round).
- prompts/attribution — none anywhere.
