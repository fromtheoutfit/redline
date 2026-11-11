# PR #86 review round 1: where the #85 verifier rules meet the rest of the loop: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The four findings of Redline round 1 on PR #86 (issue #85), and nothing more:

- R1-1 (nit, low, confirmed): the opening sentence of "Check for known findings first" (`agents/redline-reviewer.md:16`, outside the diff; anchored at line 24) still reports what is "already tracked" with no "in full".
- R1-2 (nit, low, confirmed): `tests/loop-test.mjs:1528`. No check tells "the last covered round" from "the last round with drops" in the handoff.
- R1-3 (nit, low, confirmed): `workflows/redline-loop.js:888`. `droppedBlock` repeats `personLine`'s line template by hand.
- R1-4 (correctness, low, likely): `workflows/redline-loop.js:1203` and `agents/redline-reviewer.md:50`. "With the issue named" does not say where the name goes, and a `finding` ref that carries it is rejected by the exact-id match.

Line numbers are at `beb1913`, the PR head this round reviewed (`redline/snapshot-start.json`). The `redline/` subfolder is Redline's own record and is untouched. The round's four For the person lines and three dropped candidates are not findings and are not in scope. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares none.

## Decisions

1. **R1-1: fix.** Narrow line 16 to "already tracked in full", with a parenthesis pointing at "A tracked part is not the whole finding", keeping the colon and the list after it. Add one loop check that finds `look for what is already tracked in full` in the agent file. The review prompt's own known-finding sentence (`workflows/redline-loop.js:1166`) is not touched (Unattended answer 5). Confirmed by reading line 16 and the #85 diff (`git diff origin/main..HEAD -- agents/redline-reviewer.md`, which leaves line 16 as it was). The #85 plan's Task 3 lists `already tracked in #N` among the words to search for, and its As built searched for `#N lacks`, `one sentence why` and `already tracks` only. Plan Task 2.
   Decided by: redline
2. **R1-2: fix.** Add one check beside the `a dropped candidate with no reason` check: that scenario's handoff has no `<details>`, with the scenario's premise asserted in the same check (round 1's body has a block, `coverage r2` ran). Red first, by the mutation the finding names, applied to line 2875 and restored before the commit. Traced, not run (Unattended answer 7): every other handoff scenario in section 15 has drops in its last covered round (`the dropped block`, `before a final nit pass`) or in none (`partly tracked`, `coverage off`), so the mutation changes only this scenario's handoff. Plan Task 3.
   Decided by: redline
3. **R1-3: fix.** Build the dropped line with `personLine({ file, line, text })`, byte-identical, and say so in the comment above `droppedBlock`. No new check: four existing checks compare the block byte for byte in the body and the handoff, and one reads the empty-ref fallback. Confirmed by reading `personLine` (`workflows/redline-loop.js:872-874`) and `droppedBlock` (`882-892`). Plan Task 4.
   Decided by: redline
4. **R1-4: fix, the wording and its key-phrase check.** In both statements of the accounting sentence (`agents/redline-reviewer.md:50`, `workflows/redline-loop.js:1203`), "with the issue named" becomes "with the issue named in the finding's description, the For the person line or the ref of any other outcome, since a `finding` entry's ref is the finding's id alone". A fourth entry in the key-phrase list pins `ref is the finding's id alone` in the agent file and a covered prompt, and its absence from a `coverage off` one, as the three #85 rules are pinned (`testing/tests.md`). Confirmed by reading `accountCoverage` (`workflows/redline-loop.js:1291-1346`). A `finding` entry's ref is trimmed and looked up with `byId.get(ref)` (line 1311). A miss pushes the candidate's own summary under For the person (line 1315), records the warning (line 1314) and accounts the entry `forThePerson`, so `counts.finding` drops by one. The finding is still shaped, since the done rule reads the round's findings, not the counts (`workflows/redline-loop.js:3378-3398`). The optional hardening is not planned (Unattended answer 6). Plan Task 5.
   Decided by: redline
5. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.2`; `git show origin/main:.claude-plugin/plugin.json` reads `0.2.1`, so the PR already carries its patch bump. This round changes nothing a setup rerun writes: no template, no `scripts/checks-template.sh`, no allow entry, not the unattended section's body (`process/release`).
   Decided by: redline
6. **Docs: no reader-facing change in any task.** `docs/running.md` "Rounds" step 1 already says a finding an issue or a comment "already tracks in full is reported as `already tracked`" (R1-1). "The coverage pass" and "The handoff comment" describe the dropped line, which is byte-identical after R1-3. "The coverage pass" already says a remainder caused in the diff "is a finding that names the issue in its description", and that a candidate accounted for as a finding the round does not have is listed under For the person with a warning (R1-4). Each task's entry in `plan.md` names its section and this reason (`process/docs-gate`).
   Decided by: redline

### Proportionality

- **R1-4, the one correctness finding.**
  - Likelihood: plausible, not observed. The finding is a trace, and the reviewer's reproduction script was never run (Unattended answer 7). The verify prompt's sentence just before it (`workflows/redline-loop.js:1202`) already says "with the issue named in its description". The sentence the finding names sits in the paragraph that defines each ref, so a verifier can read it as "name the issue in the ref".
  - Impact when it fires: a misleading review and handoff, not a lost fix. The count sentence reads one confirmed fewer, the candidate's summary appears under For the person beside the finding it became, and the run records a warning. The finding is still shaped, and the done rule is unaffected.
  - Cost of the fix: one sentence in each of two files and one entry in an existing list of checks. All three files are in the PR's diff. There is no new dependency, abstraction or path.
  - Proportionate, so it is `fix`.
- **R1-1, R1-2, R1-3 (nits).** The proportionality rule does not apply. Each is one sentence, one check or one line in a file in the PR's diff.

## Unattended answers

1. **Scope.** The round's four findings (`redline/round-1-findings.json`), as the unattended section's point 6 sets.
   Decided by: redline
2. **Visuals.** None; the round changes prompt text, a comment, one line of code and loop checks.
   Decided by: redline
3. **Product context.** `agent-os/product/mission.md:17`, "Honest about its reach": a count sentence that reads 0 confirmed beside a confirmed finding (R1-4) is the kind of misstatement that line is against. Line 15, "Decisions stay with people": no finding here needs a person's decision. No conflict, and no mission edit.
   Decided by: redline
4. **R1-4: where does a partly tracked candidate's issue go?** The #85 spec answers it. Its `shape.md`, Shaping defaults, "Accounting a partly tracked candidate": "Its index is accounted for by what its remainder became (`finding`, `forThePerson`, `outside`, `refuted`, `disproportionate`, `duplicate`), with the issue or comment named in the finding's description, the For the person line or the ref". The agent file (line 24: "name the issue or the comment in its description") and the prompt (line 1202: "with the issue named in its description and knownAs empty") say the same for a finding. The ref of a `finding` entry is "the finding's id" (agent file line 50, prompt line 1203). The workflow matches it exactly: #80 R1-4 (`agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md`, Decision 3 and Adjustment 1), and `workflow/agents.md`: "A `finding` entry whose ref names no finding of the round is listed under For the person as reported". The accounting sentence disagrees only by leaving the place out, so the fix is the wording that names the places, as Task 5 drafts it.
   Decided by: redline
5. **R1-1: does the narrowing reach the review prompt?** No. The #85 spec, Shaping defaults: "The rules enter the verify prompt only. ... so a `coverage off` prompt stays byte-identical (`workflow/replay.md`); the agent file states them for both modes". The PR description: "`coverage off` prompts are byte-identical, since the rules enter only the prompt branch that has candidates". The review prompt's `A known finding goes in knownAs.` (`workflows/redline-loop.js:1166`) is in every review prompt, covered or not, so it stays. The finding says the same ("left unchanged on purpose, per Task 3"). The new check therefore reads the agent file alone.
   Decided by: redline
6. **R1-4: is the optional hardening part of the fix?** No. The finding offers it as optional: "Optionally, also make accountCoverage match a leading `R<n>-<k>` token of a finding ref". The wording closes the invitation the finding names, and the exact match is #80 R1-4's rule (answer 4). Loosening it would change which refs that rule accepts, a change to an earlier round's decision that this finding does not need, so it is not planned. Nothing here decides whether the match should ever be loosened; a person can raise that as its own issue. The reviewer's For the person line on `COVERAGE_SCHEMA` (an optional `tracks` field) is the same question at a larger scale, and it is not a finding of this round.
   Decided by: redline
7. **What was run, and what was traced.** The guard refused `node` to the shaper ("'node' is not available to the shaper"), and the review body says node is refused to the reviewer. `/tmp/redlinerepro/reviewer-r1-repro.mjs` exists, but nothing it would write does: its generated files (`reviewer-r1-gen-a.mjs`, `reviewer-r1-gen-b.mjs`, `reviewer-r1-mut-loop.js`) are absent from `/tmp/redlinerepro/`. `/tmp/redlinerepro/reviewer-r1-ReproTest.php` is a PHP test from another repository's run (written at 09:58, before this run's 14:09 launch) and is not this round's. The implementer runs the loop test only through `checks.sh` (the unattended section's point 7), so R1-2's red run is the mutation through the gate, and R1-4's is the new key-phrase check seen red through the gate. The shaper's own traces:
   - R1-2: `handoffComment` takes `rounds.slice().reverse().find((record) => record.coverage)` (`workflows/redline-loop.js:2875`). In the `no reason` scenario (`tests/loop-test.mjs:1527`), round 1 accounts candidate 2 as `refuted` with ref `'  '`, and round 2 accounts both as `settled`, so round 2's `droppedCandidates` is `[]`. The scenario ends `done` after round 2 with no findings (`workflows/redline-loop.js:3394-3398`), so a handoff is posted. Round 2 ran the pass: covered runs carry the `coverage r2` label, as the check at `tests/loop-test.mjs:1294` shows.
   - R1-4: as Decision 4.
   - R1-3: `personLine` returns ``- `<file>:<line>` · <text>``, and the text Task 4 passes is `<summary> · <outcome>: <ref or 'no reason given'>`. Put together, that is the hand-built line character for character.
   Decided by: redline
8. **Known-finding check.** `scripts/redline-gh.sh issues-search "accountCoverage"` and `issues-search "finding ref"` return nothing. `issues-search "relaunch replay"` lists #81, which covers no finding here (Context). `scripts/redline-gh.sh pr-comments 86` shows only the Redline round 1 review. This is round 1, so the PR has no earlier review-round folder.
   Decided by: redline
9. **Does an earlier decision settle any of the four?** No. The #85 spec's Decision 14 states the rule R1-2 pins. Its Shaping default states the places R1-4 names (answer 4). Its Task 3 lists the search word R1-1 says was missed. None of them disposes of a finding: each is the evidence the fix agrees with.
   Decided by: redline
10. **Scratch test.** None written. There is no PHP in this repository, and the shaper cannot run `node`.
    Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 3.
- **Run caution (#81): noted for the person, not a decision and not a finding.** The PR description: "Caution for a Redline self-review: this PR changes `workflows/` and `agents/`, so a round on it that edits either one meets #81." #81 is open: "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run". Tasks 2, 4 and 5 commit changes to `agents/redline-reviewer.md` and `workflows/redline-loop.js`. The running workflow is unaffected for the rest of this run; the exposure is a relaunch (a hand-off or a resume) after those commits land. Before any relaunch of this run, `git diff --stat beb1913..HEAD -- workflows agents` shows whether they have.

## Standards Applied

- `workflow/agents`: the #85 bullet (partly tracked, the dropped block and its line shape) that R1-3 and R1-4 refine. The #80 R1-4 rule on a `finding` ref that names no finding, which R1-4 keeps. The #80 R3-3 rule that a changed rule is applied wherever the prompt and the agent file state it, found by its own words (R1-1).
- `workflow/replay`: a `coverage off` prompt stays byte-identical. R1-4's text enters `candidatesBlock`'s branch with candidates only, and R1-1 leaves the review prompt alone.
- `testing/tests`: a tested surface gains a case (R1-1, R1-2, R1-4); the key-phrase pattern (R1-4); red before green (R1-2's mutation, R1-4's phrase); a check is never vacuous (R1-2 asserts its premise).
- `process/docs-gate`: one entry per touched plugin file, each with its section and its reason.
- `process/release`: the version stays `0.2.2` (Decision 5).
- `process/standards-retrospective`: the proposed list below, applied in its own commit.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above. Each item is proposed, not applied. The standards approver approves the list, and the implementer applies the approved items in one commit after Task 5's (`redline: record the round 1 review lessons in the standards (#85)`).

1. **R1-2, missing: `agent-os/standards/testing/tests.md`, a new bullet directly after line 23** (the bullet that opens "A case named for a boundary asserts the boundary itself"). Drafted:

   ```text
   - A rule that picks one record from several is pinned by a scenario in which the nearest wrong pick gives a different answer, and a check reads that answer: every #85 scenario whose handoff was checked had drops in its last covered round or in none, so picking the last round with drops instead of the last round that ran the pass stayed green until the no-reason scenario's handoff, whose round 1 dropped a candidate and round 2 none, was checked (#86, R1-2)
   ```

2. **R1-1, missing: `agent-os/standards/testing/tests.md` line 9**, the bullet that opens "`tests/loop-test.mjs` also reads `agents/redline-reviewer.md`". Append to the end of the bullet, directly after its closing "(#85)":

   ```text
   . A sentence only the agent file states, because its prompt counterpart is left as it was so a `coverage off` prompt is unchanged, is pinned in the agent file alone: the known-finding check's opening, narrowed to what is tracked in full (#86, R1-1)
   ```

3. **R1-4, missing: `agent-os/standards/workflow/agents.md` line 37**, the #85 bullet. Replace

   ```text
   a partly tracked candidate is accounted for by what its remainder became, `known` being for one tracked whole;
   ```

   with

   ```text
   a partly tracked candidate is accounted for by what its remainder became, with the issue named in the finding's description, the For the person line or another outcome's ref, never in a `finding` ref, which the workflow matches by id alone (#86, R1-4), `known` being for one tracked whole;
   ```

4. **R1-3, missing: `agent-os/standards/workflow/agents.md` line 37**, the same bullet's last sentence. Replace

   ```text
   The line opens with the backticked place, never a finding id, so `redline-gh.sh prior-findings` never reads it back
   ```

   with

   ```text
   The line is built by `personLine`, as a For the person line is, so it opens with the backticked place, never a finding id, and `redline-gh.sh prior-findings` never reads it back (#86, R1-3)
   ```

5. **R1-1, already covered: `agent-os/standards/workflow/agents.md` line 16.** The #80 R3-3 bullet already says a changed rule is applied "everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words ..., not only in the sentence the finding quoted". The #85 build searched for a subset of the words its plan listed, which is a slip against that rule, not a gap in it. No change.
6. **Decision 5, already covered: `agent-os/standards/process/release.md` line 5.** One bump per PR, and this PR already carries it. No change.
7. **Decision 6, already covered: `agent-os/standards/process/docs-gate.md`**, "no reader-facing change" with the reason. No change.
8. **Unattended answers 5 and 6, already covered.** `agent-os/standards/workflow/replay.md`, the dial bullet: a `coverage off` prompt stays byte-identical. `workflow/agents.md`: the #80 R1-4 rule on a `finding` ref. No change.

No pattern was invented outside `agent-os/standards/`. Task 2's check reads the agent file through the same harness and the same `reviewerAgent` read the key-phrase checks use, for a sentence no prompt carries; item 2 records that use in the bullet that describes those checks.
