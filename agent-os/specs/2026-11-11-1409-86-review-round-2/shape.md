# PR #86 review round 2: a partly tracked remainder meets every other rule, and the result check is named for what it asserts: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The two findings of Redline round 2 on PR #86 (issue #85), and nothing more. Both are nits; the round has no correctness finding, and it is the run's final nit round.

- R2-1 (nit, low, likely): `agents/redline-reviewer.md:24`. The partly tracked rule says a remainder caused in the diff "is a finding" with no condition, in the agent file (lines 24 and 65) and the verify prompt (`workflows/redline-loop.js:1205`), while the removed-guard, disproportionate and not-reproduced rules send such a candidate elsewhere. The text does not say which rule wins.
- R2-2 (nit, low, confirmed): `tests/loop-test.mjs:1522`. The check `coverage: the round record keeps the dropped entries for the handoff, and the result keeps counts only` asserts neither half of its name.

The round reviewed the fix diff `beb1913..fd65cb4` and the coverage pass's candidates at `fd65cb4` (`redline/round-2-findings.json`, `range`). Line numbers here are at `fd65cb4`, which is the working tree's HEAD. The `redline/` subfolder is Redline's own record and is untouched. The round's For the person lines and its two dropped candidates are not findings and are not in scope. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares none.

## Decisions

1. **R2-1: fix, in every place the rule is stated.** Every statement of the partly tracked rule now says a remainder caused in the diff is a finding unless another rule puts it elsewhere, as it would put any candidate. The other rules are a collapse, a refutation, the disproportionate rule, and For the person for a removed guard or for a candidate plausible but not reproduced. "Never a For the person line saying what the issue lacks" stays. The places, found by searching for the rule's own words (Unattended answer 5):
   - in the agent file, lines 24, 37 and 65 (the finding named 24 and 65; line 37 says the same thing in the per-candidate list);
   - in the verify prompt, line 1205, which also gains the "by every rule here" that line 24 already has;
   - a comment above `candidatesBlock`;
   - `docs/running.md` "Rounds" step 1 (line 36) and "The coverage pass" (line 48).

   A fifth key-phrase entry pins the clause `unless another rule here puts it elsewhere` in the agent file and a covered verify prompt, and its absence from a `coverage off` one (`testing/tests.md` line 9). It is seen red before the wording lands. The existing key phrase `the remainder is judged as its own candidate` stays in both files, so the partly tracked checks stay green. Confirmed by reading agent lines 24, 37, 39, 46, 48 and 65 and prompt line 1205: the unconditional sentence and the rules that send a candidate elsewhere sit side by side with no order between them. The #85 spec answers which wins (Unattended answer 4). Plan Task 2.
   Decided by: redline
2. **R2-2: fix, named for what it asserts and tightened to what the result keeps.** The check is replaced by one whose name states only what it asserts:
   - the result's covered round has no `droppedCandidates` field;
   - its `coverage` holds exactly `head`, `candidates`, `counts` and `accounting`, so there is no candidate list (#80, R1-5), and `candidates` is the count, 5;
   - the three dropped counts are each 1;
   - every accounting entry holds only `index`, `outcome` and `ref`;
   - each dropped entry of the scenario's `dropOut` is in the accounting with its index, outcome and ref byte for byte.

   A comment above it says that the dropped entries, with their file, line and summary, ride on the round record, which only the handoff reads, and that the handoff check just before it proves that half. The reviewer offered either a rename or a tightening, and this does both in one check line of a file in the PR's diff. The red run is the finding's own scenario: a mutation that puts the dropped entries into the result's `coverage` keeps the old check green and turns the new one red. It is applied and restored within the task. The result keeping the accounting is by design (Unattended answer 6). The PR description's matching sentence is the author's to correct (Unattended answer 7). Plan Task 3.
   Decided by: redline
3. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.2`. `git show origin/main:.claude-plugin/plugin.json` reads `0.2.1`, so the PR already carries its patch bump. This round changes nothing a setup rerun writes: no template, nothing in `scripts/checks-template.sh`, no allow entry, and not the unattended section's body (`process/release`).
   Decided by: redline
4. **Docs.** Task 2 changes `agents/redline-reviewer.md` and `workflows/redline-loop.js`. It updates `docs/running.md` "Rounds" step 1 and "The coverage pass" in its own commit, since both state the rule without the condition. The README's "What a clean run means" (line 100) needs no change: it says "the part an issue does not track is judged on its own", which the clause keeps. Task 3 changes `tests/loop-test.mjs` only, which is not in a Docs-step directory, and ends with `workflows/redline-loop.js` unchanged. Each task's entry in `plan.md` names its section or its reason (`process/docs-gate`).
   Decided by: redline
5. **As built, Task 3: the red run had two failures, not one.** Under the mutation, the existing check `coverage: the result's coverage record has no candidate list` (`tests/loop-test.mjs:1315`) went red beside the new check, since it reads `'list' in run.res.rounds[0].coverage` and the mutation names its key `list`. Unattended answer 8's search looked for `Object.keys(` and `JSON.stringify(` and missed an `in` test. The evidence holds: the new check is red, the old check it replaces would have stayed green (its three counts are each 1 and `droppedCandidates` is not on the result's round), and the green count is the planned 603. No change to the plan's code (`plan.md`, As built, Deviations).
   Decided by: redline
6. **As built, step 12: the standards commit names R2-1.** Item 1 of the proposed retrospective is the last statement of R2-1's rule (Unattended answer 5 sends it there), so the commit is `redline: record the round 2 review lessons in the standards, finishing R2-1 (#85)` and R2-1's reply names both its commits. Item 2 is a lesson only (`plan.md`, As built, Deviations).
   Decided by: redline

### Proportionality

Neither finding is a correctness finding, so the proportionality rule does not apply. For the record:

- R2-1 changes three sentences of one file, one sentence and one comment of another, two sentences of `docs/running.md` and one entry of an existing list of checks. All are in files the PR's diff already touches. There is no new dependency, abstraction or path.
- R2-2 replaces one check line, adds its comment, and applies one temporary mutation that is restored before the commit.

## Unattended answers

1. **Scope.** The round's two findings (`redline/round-2-findings.json`), as the unattended section's point 6 sets.
   Decided by: redline
2. **Visuals.** None. The round changes prompt text, documentation and one loop check.
   Decided by: redline
3. **Product context.** `agent-os/product/mission.md:15`, "Decisions stay with people": neither finding needs a person's decision. Line 17, "Honest about its reach": a check named for what it does not assert (R2-2) overstates what the gate proves. A neighbouring issue that decides whether a remainder becomes a finding (R2-1) makes a clean run depend on what happens to be filed. There is no conflict, and no mission edit.
   Decided by: redline
4. **R2-1: when the partly tracked rule and another rule disagree, which wins?** The other rule wins: the remainder meets every rule as any candidate does. The #85 spec answers this. Its `shape.md`, Shaping defaults, "Accounting a partly tracked candidate", says: "Its index is accounted for by what its remainder became (`finding`, `forThePerson`, `outside`, `refuted`, `disproportionate`, `duplicate`)". A remainder that could only ever be a finding would never be accounted `forThePerson`, `refuted`, `disproportionate` or `duplicate`. The agent file's own line 24 already says the remainder "is judged as its own candidate, by every rule here". Decision 4 of the #85 spec puts a removed guard with implausible conditions under For the person, for any candidate. The unconditional "is a finding" sentences disagree with this evidence, and that disagreement is the finding to fix (the unattended section's point 2). Read literally they would also bring back the dependence #85 removed, in reverse: a neighbouring issue would decide where a candidate goes. The guard against #85's fault 1 stays as it is: a remainder is never put under For the person for what the issue lacks.
   Decided by: redline
5. **R2-1: where is the rule stated?** It was found by searching for its own words (`is a finding`, `caused in the diff`, `whose cause is in`, `saying what`), as `workflow/agents.md` line 16 (#80, R3-3) requires:
   - Agent file line 24: "A remainder whose cause is in this pull request's diff is a finding:".
   - Agent file line 37: "a cause in the diff makes it a finding that names #N, never a For the person line saying what #N lacks". The finding did not name this one, and the plan changes it with the rest, which is the slip round 1's R1-1 corrected.
   - Agent file line 65: "A part #N does not track whose cause is in the diff is a finding, not an entry here."
   - Prompt line 1205: "a remainder whose cause is in this pull request\'s diff is a finding, with the issue named in its description and knownAs empty, accounted for as finding, never a forThePerson line saying what the issue lacks".
   - Comment lines 1184 to 1186 above `candidatesBlock`.
   - `docs/running.md` line 36 ("a part whose cause is in this PR's diff is a finding that names the issue (#85)") and line 48 ("a remainder whose cause is in this PR's diff is a finding that names the issue in its description, with no `knownAs`, never a note saying what the issue lacks").
   - `agent-os/standards/workflow/agents.md` line 37 ("one caused in the diff is a finding naming the issue"), which goes to the retrospective.

   The README's line 100 and line 32 of the agent file ("the part it does not track is judged on its own") already hold, and `tests/loop-test.mjs` lines 1478 to 1481 describe a scenario whose remainder is a plain finding. All three stay as they are.
   Decided by: redline
6. **R2-2: does the result keep the accounting by design?** Yes, so the check's name is what is wrong, not the code. The evidence:
   - `workflows/redline-loop.js:2097` builds the record's `coverage` as `{ head, candidates, counts, accounting }`, and `result()` passes it through (`coverage: record.coverage || null`, line 1961).
   - An existing check is named for it: `coverage: the result carries each round's For the person and accounting` (`tests/loop-test.mjs:1305`), and others read `run.res.rounds[n].coverage.accounting` (lines 1383, 1386, 1391, 1399).
   - "Counts only" in the #85 spec ("the run's result, which keeps counts only (#80, R1-5)") refers to #80 R1-5's rule. The comment at `workflows/redline-loop.js:2098-2099` says "The list the accounting's indexes point into ... for the findings file only; the round record and the result keep the count (#80, R1-5)". The result keeps the candidate count, not the candidate list.
   - `droppedCandidates` is on the round record (line 3350) and out of `result()` (lines 1945 to 1966), as #85's plan says ("It stays out of `result()`").

   The new check pins that contract.
   Decided by: redline
7. **R2-2: does this round correct the PR description's sentence?** No. In "For the reviewer", "Prompts:", the PR description says "The run's result still carries the coverage counts only; the dropped entries ride on the round record for the handoff." It has the same inaccuracy, but the round writes no `pr-body.md`:
   - `docs/running.md:83` says the PR description "is redrafted when the repository has a standard for it".
   - This repository's unattended section has no PR-description point. The template's point 11 (`templates/shape-spec-unattended.md:79`, "When the round's spec redrafts a stale PR description as `pr-body.md` (per the repository's standard for agent-written PR descriptions)") is absent, and this repository's point 11 is the guard and the hook.
   - `agent-os/standards/` has no such standard, and no folder under `agent-os/specs/` has ever held a `pr-body.md`.

   The author can correct the sentence by hand. The reviewer's wording is "the result carries the counts and the accounting; the dropped entries with their summaries ride on the round record". R2-2's recommendation and `plan.md`'s note for the person carry it.
   Decided by: redline
8. **What was run, and what was traced.** No `node` run was attempted this round. Round 1's shaper recorded the guard's refusal ("'node' is not available to the shaper", `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`, Unattended answer 7), and this round's review body says node is refused to the reviewer. `/tmp/redlinerepro/` holds only round 1's files (`reviewer-r1-repro.mjs`, and `reviewer-r1-ReproTest.php` from another repository's run), so the reviewer wrote no reproduction for round 2. The implementer runs the loop test only through `checks.sh` (the unattended section's point 7). R2-1's red run is the new key-phrase check seen red through the gate, and R2-2's is the mutation through the gate. The shaper's traces:
   - R2-1: the key-phrase loop (`tests/loop-test.mjs:1470`) checks `reviewerAgent.includes(phrase) && covered.includes(phrase) && !uncovered.includes(phrase)`. The phrase `unless another rule here puts it elsewhere` is in none of the three files today (`grep -c` printed `0` for the agent file, the workflow, the test and `docs/running.md`), so the fifth entry is red until Task 2's wording lands. It enters only `candidatesBlock`'s branch with candidates, so `uncovered` never holds it.
   - R2-2: the mutation `coverage: record.coverage ? { ...record.coverage, list: record.droppedCandidates } : null` in `result()` (line 1961) leaves `droppedCandidates` out of `run.res.rounds[0]` and the counts unchanged, so the old check stays green, which is the finding. It adds a fifth key to the result's `coverage`, so the new check's key clause is red. No other check compares the result's `coverage` keys or its whole JSON: `grep` for `Object.keys(` and `JSON.stringify(` over a coverage or a whole result found none. So that check is expected to be the only one red. `result()` builds the return value only, so no prompt moves.
   Decided by: redline
9. **Known-finding check.** Neither finding is tracked elsewhere:
   - `scripts/redline-gh.sh issues-search "partly tracked"` and `issues-search "removed guard disproportionate"` list only #85, the issue this PR closes.
   - `issues-search "droppedCandidates"` returns nothing.
   - `issues-search "round record result counts"` lists #68, which is about the checker's output size and is unrelated.
   - `issues-search "relaunch replay"` lists #81 (Context).
   - `scripts/redline-gh.sh pr-comments 86` shows the Redline round 1 and round 2 reviews only.
   - Round 1's spec folder (`agent-os/specs/2026-11-11-1409-86-review-round-1/`) dispositions R1-1 to R1-4, all fixed. None of them is either finding. R1-1 is the slip R2-1's search avoids repeating.
   Decided by: redline
10. **Scratch test.** None written. There is no PHP in this repository, and the shaper cannot run `node`.
    Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 3.
- **Run caution (#81): noted for the person, not a decision and not a finding.** The PR description says: "Caution for a Redline self-review: this PR changes `workflows/` and `agents/`, so a round on it that edits either one meets #81." #81 is open: "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run". Round 1's commits already changed both directories. Task 2 of this round changes `agents/redline-reviewer.md` and `workflows/redline-loop.js` again, and Task 3 edits the workflow only temporarily, restoring it before its commit. The running workflow is unaffected for the rest of this run, including the final nit pass. The exposure is a relaunch (a hand-off or a resume) after these commits land.

## Standards Applied

- `workflow/agents`: the #80 R3-3 rule that a changed rule is applied wherever the prompt and the agent file state it, found by its own words (R2-1, Unattended answer 5). The #85 bullet (line 37) that R2-1's clause refines.
- `workflow/replay`: a `coverage off` prompt stays byte-identical. R2-1's text enters `candidatesBlock`'s branch with candidates only.
- `testing/tests`: the key-phrase pattern (R2-1); a tested surface gains a case; red before green (R2-1's new phrase, R2-2's mutation); a case named for a boundary asserts the boundary itself (R2-2).
- `process/docs-gate`: one entry per touched plugin file. The `docs/running.md` edits are reader-facing by nature.
- `process/release`: the version stays `0.2.2` (Decision 3).
- `process/standards-retrospective`: the proposed list below, applied in its own commit.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above. Each item is proposed, not applied. The standards approver approves the list, and the implementer applies the approved items in one commit after Task 3's: `redline: record the round 2 review lessons in the standards (#85)`.

1. **R2-1, contradicting a standard: `agent-os/standards/workflow/agents.md` line 37**, the #85 bullet. It states the rule without the condition. Replace

   ```text
   one caused in the diff is a finding naming the issue, `knownAs` empty, accounted for as `finding`;
   ```

   with

   ```text
   one caused in the diff is a finding naming the issue, `knownAs` empty, accounted for as `finding`, unless another rule puts it elsewhere as it would any candidate (a collapse, a refutation, the disproportionate rule, or For the person for a removed guard or a candidate plausible but not reproduced), so a neighbouring issue never decides where a remainder goes (#86, R2-1);
   ```

2. **R2-2, missing: `agent-os/standards/testing/tests.md` line 23**, the bullet that opens "A case named for a boundary asserts the boundary itself". Append directly after its closing "(#34, R2-1)":

   ```text
   . A check's name states only what it asserts: #85's result check was named for the round record keeping the dropped entries and the result keeping counts only, asserted neither, and the result keeps the accounting by design, so a change to either stayed green under a name that said otherwise (#86, R2-2)
   ```

3. **R2-1's search, already covered: `agent-os/standards/workflow/agents.md` line 16** (#80, R3-3). A changed rule is applied wherever the prompt and the agent file state it, found by the rule's own words. The search found the fourth statement (agent file line 37) that the finding did not name. No change.
4. **R2-1's key phrase, already covered: `agent-os/standards/testing/tests.md` line 9.** Each verifier rule a prompt states is pinned by a short key phrase in the agent file and a covered prompt, and not in a `coverage off` one. No change.
5. **Decision 4, already covered: `agent-os/standards/process/docs-gate.md`**, line 5 (an entry per touched file) and line 16 (a `docs/` change is reader-facing by nature). No change.
6. **Decision 3, already covered: `agent-os/standards/process/release.md` line 5.** One bump per PR, and this PR already carries it. No change.
7. **Unattended answer 7, not a standard.** `docs/running.md:83` already says the PR description is redrafted only when the repository has a standard for it. No change.

No pattern was invented outside `agent-os/standards/`. Task 2's check is a fifth entry in the existing key-phrase list. Task 3's check reads `run.res` as the section's other result checks do.
