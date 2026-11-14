# PR #94 review round 5: the id, coverage, deferral and check-order fixes the fifth review found — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The ten findings of Redline round 5 on PR #94 (issue #93), and nothing more. The round reviewed the fix diff `4227e11..583ac3b` (`redline/round-5-findings.json`, `range`), and `583ac3b` is the working tree's HEAD. Line numbers here are at that commit. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

Sorted:

- `fix` (10): R5-3, R5-5, R5-9 (correctness); R5-1, R5-2, R5-4, R5-6, R5-7, R5-8, R5-10 (nits). R5-1 and R5-10 are small refactors.
- No `decline`, no `defer`, no `ask`.
- No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`). This repository is the plugin, loaded in place, so `workflows/` and `tests/` are planned like any other file (the shaper's rule 7). Every task changes only `workflows/redline-loop.js` and `tests/loop-test.mjs`, both in the pull request's diff. No task touches the gate's backticked text, `checks.json`, `checks-template.sh` or anything under `templates/`, so nothing needs a restamp, a regeneration or a version bump.

## Decisions

1. **R5-3: fix.** The rename of coverage refs in `review()` matches the whole ref only (`workflows/redline-loop.js:2382`), and R2-5's leading-id read in `accountCoverage` accepts only an `R<n>-<k>` id (line 1567), so `X1 (the lock)` or `R0-1: the lock`, naming a finding the review renamed, mints a second, correctness finding for the same candidate (lines 1572-1575, 1596-1606). For a `verified` or `unconfirmed` entry whose whole ref is not in the rename map, the ref's leading token (up to the first space, colon, comma, semicolon or parenthesis) is looked up in it, and when found it is replaced by the new id with the note kept; `accountCoverage` then reads the ref by its leading id with its R2-5 warning, so the note is handled in one place. A `duplicate` entry keeps the whole-ref rename only, since its ref may open with another candidate's index (lines 2408-2409). Unattended answer 1. Plan Task 2.
   Decided by: redline
2. **R5-5: fix.** The rename in `review()` (lines 2323-2335) renumbers only ids outside the round's form, so two findings returned as `R1-1` keep one id, and every map keyed by id (`commentIds`, outcomes, replies, `byId`) keeps one of them. A set of ids taken is kept in the same pass; a finding whose id of the round's form is already taken is renamed to the next free number with a warning, as a non-form id is. The rename map does not record it, so a ref to the id stays with the first finding, which keeps it. Unattended answer 2. Plan Task 3.
   Decided by: redline
3. **R5-9: fix.** A shaper deferral the person changes on the plan dial to fix or accept keeps its entry in `deferred` (`shaped.deferred.slice()`, line 2947), passes the R4-9 filter (kind `decided`, line 3151), and is listed under Deferred as shipped, while the same handoff lists it as overruled; a restated defer keeps the shaper's mitigation, since line 2981 skips the resolve agent's entry for an id already present. One helper, `awayFromDefer(id)`, is true when the round's decision on the id carries a disposition other than `defer`. The entry is dropped in `resolveWith` after the decisions are recorded and in the reshape's merge (line 3041); the resolve agent's entry for an id replaces an earlier one in place, so a restated deferral posts the person's mitigation. Unattended answer 3. Plan Task 4.
   Decided by: redline
4. **R5-1: fix, a small refactor.** `AGENTS_CHANGED` and `AGENTS_CHANGED_HANDOFF` build the same backticked list inline (lines 252 and 257). One constant, `agentList`, holds it and both sentences use it. The four tests are in Unattended answer 6. Plan Task 5.
   Decided by: redline
5. **R5-2: fix.** A bad first coverage entry (an outcome the schema does not name, line 1557, or a ref naming no finding, line 1572) warns "kept as an unconfirmed finding as reported" and adds its index to `told` but not to `seen`, so a second entry for the same index passes the duplicate check (line 1553), is accepted, and the candidate is set aside while the warning says it was kept. The duplicate check reads `seen.has(index) || told.has(index)`: `told` holds exactly the indexes whose first entry was bad (its only writers are lines 1559 and 1574), so a later entry is ignored with the "twice; the first entry stands" warning and the candidate is minted, as the first warning said, with no second "did not account" warning. Plan Task 6.
   Decided by: redline
6. **R5-4: fix.** `relaunch.how`'s decisions clause (line 2260) says every decision so far goes back "unchanged", while R4-8's hand-off asks the person to restate an override the resolve agent could not apply (`skills/redline/SKILL.md:210`) and the restatement replaces the refused decision. A sentence follows the clause: for each id in `overridesUnresolved`, the restated decision (`{"choice", "notes", "date", "disposition": "fix|defer|accept"}`) replaces the one the resolve agent could not apply. The clause itself keeps its words, so the loop check that pins it (`tests/loop-test.mjs:1194`) is the neighbour. Unattended answer 7. Plan Task 7.
   Decided by: redline
7. **R5-6: fix, by moving the decline-reason check after `forceAskRules`, as `checkWhy` was.** `checkDispositions` throws for a reasonless decline (lines 2611-2614) before `forceAskRules` (line 2905) would turn a rule-covered decline into an ask, which needs no reason. The check becomes its own function, `checkDeclineReasons(shaped, shaperLabel)`, called right after `forceAskRules` in the shape path (line 2905) and the reshape path (line 3029), naming the shaper's label itself, since the `spec status` call runs before it (R2-9). `forceAskRules` then sees a reasonless decline, so its call says "Redline would have declined it." and recommends "Accept, no change." when no reason was given, instead of `By hand: <the decline's recommendation>`. Unattended answer 4. Plan Task 8.
   Decided by: redline
8. **R5-7: fix, by running the human-values check before the decline owner loop.** In `checkDispositions` the decline loop (lines 2615-2620) rewrites `decidedBy` to `redline` before the `bad` filter (2621-2623) reads `decidedBy === 'reviewer'`, so a decline marked `reviewer` only warns while a fix marked `reviewer` stops the run. The `bad` block moves before the decline loop, so both stop at shape with the same message; a decline marked with any other wrong owner (`pending`) is still rewritten with its warning. Unattended answer 5. Plan Task 9.
   Decided by: redline
9. **R5-8: fix.** On autopilot, a rule-covered finding the shaper declined goes into the Deferred list with `fullFix` set to its call's recommendation, `Accept, no change: <reason>.` (lines 2778, 2785, 3163), and the handoff prints it after `open:` (line 3324), which reads as a change left open. `forceAskRules` records the would-be decline on the forced entry (`declined: "Redline would have declined it: <reason>."`, from Task 8's wording); the autopilot loop gives the deferred entry that text as its `fullFix` with `declined: true`; and the handoff's rule line drops `open: ` for such an entry. `fullFix` stays "what Redline would have done", as the skill's done walk reads it (`skills/redline/SKILL.md:242`). The judgment call's own recommendation and option effect are unchanged (`tests/loop-test.mjs:2125` is the neighbour). Unattended answer 8. Plan Task 10.
   Decided by: redline
10. **R5-10: fix, a small refactor.** `handoffComment`'s `ran` clause (line 3231) is used in three branches, while the final-nit-pass branches spell `Redline ran ${reviews} review rounds.` by hand (lines 3234, 3235, 3237, 3239, 3241). The five lines use `${ran}.`. A final nit pass always follows at least one round, so `reviews` is at least 2 there and every sentence reads as before. The four tests are in Unattended answer 6. Plan Task 11.
    Decided by: redline
11. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.3.0`, and `main` reads `0.2.4` (round 4's Decision 13). This round changes nothing a setup rerun writes (`agent-os/standards/process/release.md`, first bullet).
    Decided by: redline
12. **Run caution.** Every task changes `workflows/redline-loop.js`, and a relaunch of this run runs the script the run launched with (`agent-os/standards/workflow/replay.md:20`), so this run's later rounds keep the launch's checks. No agent file and no skill changes this round, so the handoff's changed-agent-files sentence does not fire for it.
    Decided by: redline

### Proportionality (the correctness findings)

- **R5-3.** Likelihood: low; it needs two reviewer slips at once, an id outside the round's form and a note after it in a coverage ref. Impact: a second, unconfirmed correctness finding for a candidate already reported, posted with a thread, shaped, and able to buy a round. Cost: one token lookup in the loop that already renames refs, about six lines in one file the pull request changed, one loop check over two runs.
- **R5-5.** Likelihood: low; the reviewer repeats an id. Impact: one thread never gets its reply or its sweep, one outcome is lost, the coverage accounting counts a ref against one of the two, and a later `prior-findings` maps both body lines to one root, all with no warning. Cost: a set and an `else if` of four lines in the `forEach` R4-6 rewrote, one loop check.
- **R5-9.** Likelihood: any plan-dial run where the person changes a shaper deferral, which the plan dial offers for every disposition (`docs/running.md:123`). Impact: the handoff says a mitigation shipped that never did, beside the same finding listed as overruled and applied; the stale entry reaches the plan approver and the implementer, and the skill's done walk offers it as a deferral; a restated defer plans and posts the shaper's mitigation over the person's. Cost: one helper, two filters and one replacement in `revise()`, a mock key and two loop checks over three runs.

## Declined

None. Every finding of this round is fixed.

## Unattended answers

1. **Are the findings real?** Each was traced in the code at `583ac3b`. The shaper's guard refuses interpreters, so no harness was run here. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds only round 1 files from another run), and no scratch test was needed: every claim is a reading of a few lines of bookkeeping or prompt text, each traced below.
   - R5-3: `renamed.has(ref)` with the whole trimmed ref (2381-2384); the leading-id regex `/^(R\d+-\d+)(?![\w-])/` (1567); a miss adds to `told` (1574) and the mint loop adds a correctness, unconfirmed finding (1596-1606). The loop check for R2-5 (`tests/loop-test.mjs:1511-1512`) covers a note after a valid id only.
   - R5-5: the rename's `if (!idForm.test(f.id))` (2327) is the only renumbering; `byId` is a Map by id (1544); `commentIds[comment.finding] = comment.id` (2526) keeps one per id. `git show origin/main:workflows/redline-loop.js` has the same gap in its rename.
   - R5-9: `deferred = shaped.deferred.slice()` (2947); `overridesFor` (2944) and `roundDecisions[id] = decision` (2963); `outcomesFor` files a decision as `decided` before it looks at a deferral (2558-2561); the R4-9 filter admits `decided` (3151); line 2981 skips an id already present; the handoff prints `shipped <mitigation>; open: <fullFix>` (3325); `planPrompt` receives `deferred` (3004).
   - R5-1: lines 251-258.
   - R5-2: `seen` is set only at 1578, 1585, 1588 and 1607; `told` at 1559 and 1574; the duplicate check reads `seen` only (1553).
   - R5-4: `relaunch.how` (2260); `overridesUnresolved` and `decisionsNeeded` (3725-3726); the skill's restatement paragraph (`skills/redline/SKILL.md:210`).
   - R5-6: `checkDispositions` (2902) before `checkCalls` (2903), `checkSpec` (2904), `forceAskRules` (2905) and `checkWhy` (2906); the same order on a reshape (3026-3030); the reasonless throw (2611-2614).
   - R5-7: the decline loop (2615-2620) before `bad` (2621-2629).
   - R5-8: `forceAskRules`'s recommendation (2778) stored on `record.forced` (2785); the autopilot loop's `fullFix: forced.recommendation` (3163); the rule line's `open: ${d.fullFix}` (3324).
   - R5-10: `ran` (3231) and its three uses (3243, 3245, 3247); the five hand-spelled openings (3234, 3235, 3237, 3239, 3241).

   Decided by: redline
2. **R5-5: is the rename inside this pull request?** The verifier states the cause predates it (`outsideDiff` true; `origin/main` has the same rename). Round 4 answered the same question for R4-6 (`agent-os/specs/2026-11-14-1509-94-review-round-4/shape.md`, Unattended answer 6): "this pull request's coverage accounting reads ids by `byId` ... so a duplicate id now miscounts this pull request's own accounting. The fix is four lines in the same `forEach` this pull request edited". The same holds here: the fix is four lines in the `forEach` R4-6 rewrote, and it follows the numbering R4-6 gave it, so it is a fix inside the pull request, not a reach outside it.

   Decided by: redline
3. **R5-9: the override case predates this pull request; is it inside it?** Yes, from the code's own comment. The R4-9 filter this pull request added says: "Only an item that ended deferred, or decided with a mitigation the resolve agent planned, is listed under Deferred, so a decline or a fix beside a leftover entry is never called shipped (#94, R4-9)" (`workflows/redline-loop.js:3148-3150`). A deferral changed to fix is a fix beside a leftover entry, and it is called shipped, so the code disagrees with its docblock, and that disagreement is the finding to fix (unattended point 2).

   Decided by: redline
4. **R5-6: skip rule-covered declines in the check, or move the check?** Move it, from this pull request's own precedent. Round 1's R1-13 moved `checkWhy` after `forceAskRules` so a call a rule covers is judged by the reason the rule gives it (`agent-os/standards/workflow/agents.md:37`: "the workflow's test is the second layer, run after `forceAskRules`"), and round 2's R2-9 made such a check name the shaper's label, since the `spec status` call runs before it (same line). Moving keeps the rule-coverage test in `forceAskRules` alone; skipping would need a second copy of its paths-and-tag test in `checkDispositions`. The stage error keeps its text and its `resumeFrom` label (`shape r1`), which the existing check `decline: a decline with no reason stops at shape, resumable at the shaper` (`tests/loop-test.mjs:2089`) pins, as `agent-os/standards/testing/tests.md:15` asks.

   Decided by: redline
5. **R5-7: reorder the checks, or say in a comment that a decline's owner is always rewritten?** Reorder, from the check's own words: its stage error says the shaper "sorted ... with a human review pass's values (none, or decidedBy reviewer) in a Redline round" (`workflows/redline-loop.js:2628`), with no exception for a decline, and a human review pass has no decline at all (2608-2610), so a decline marked `reviewer` is the same mix of the two passes' values. The code disagrees with that message only because the loop above rewrites the owner first; the reorder makes it agree. A decline with any other wrong owner keeps the warning and the rewrite.

   Decided by: redline
6. **R5-1 and R5-10: are they small refactors?** Both pass the four tests.
   - Behaviour unchanged: R5-1 builds the same string once (`tests/loop-test.mjs:1995-1996` pin both sentences byte for byte); R5-10's `ran` is `Redline ran ${reviews} review round${reviews === 1 ? '' : 's'}`, and a final nit pass follows at least one round, so `reviews` is 2 or more wherever the five lines run and each sentence is byte-identical (the final-nit-pass checks at `tests/loop-test.mjs:2246-2264` pin them). No test expectation changes.
   - Inside the pull request: both change only `workflows/redline-loop.js`, which it changed.
   - Code the pull request wrote: `AGENTS_CHANGED_HANDOFF` (line 257) is this pull request's (`git blame`: `471d4816`, not on `main`), and line 252 is a call site of the extracted list in the same file. `ran` and four of the five lines are this pull request's (`b4e08d7f`, not on `main`); line 3241 is `main`'s (`d46e7713`), a call site of the `ran` extraction this pull request made, in the same function.
   - One idea, smaller than the pull request: one extraction and one use of an existing one, each a few lines.

   Decided by: redline
7. **R5-4: who reads `relaunch.how`, and does the skill already say what it should?** The session that relaunches reads the result; the skill's paragraph "An override the run could not apply" already says to record the restatement under its id and that "relaunching the same line replays the same refusal" (`skills/redline/SKILL.md:210`), and `docs/running.md` ("Hand-off and relaunch") says the same. Only the note disagrees, so the note is the fix, and no skill or doc changes.

   Decided by: redline
8. **R5-8: drop `open:`, or give the entry another `fullFix`?** Both, as one change. `fullFix` for such an entry becomes "Redline would have declined it: <reason>.", which is what the skill's done walk calls it ("`fullFix` is what Redline would have done", `skills/redline/SKILL.md:242`) and what the call's first option already says (`workflows/redline-loop.js:2775`); the handoff line drops `open: ` for it, since nothing is left open. A non-decline rule entry keeps `open: By hand: ...` (`tests/loop-test.mjs:1128` is the neighbour).

   Decided by: redline
9. **Questions Steps 1 to 5 would ask.** Scope: the round's findings (unattended point 6). Visuals: none. References: the code each finding names, and round 4's spec as the plan's format (`references.md`). Product context: `agent-os/product/mission.md`, through the #93 spec's Context; nothing here moves it. Standards: those under Standards Applied, read at `583ac3b`.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond the #93 spec's; these findings keep the coverage accounting, the Deferred list and the shaper checks saying what that spec built.

## Standards Applied

- workflow/agents — line 30 (a rename renames every ref to the id; R5-3), line 37 (the workflow checks a result, the second layer runs after `forceAskRules`, and names the shaper's label; R5-6, R5-7), line 38 (a finding's id is unique in its round; R5-5), line 39 (a list under an outcome's heading is read off the final outcome; R5-9, R5-8), line 10 (a rule-covered finding is the person's; R5-6, R5-8).
- workflow/replay — line 9 (every item a stop hands back is asked about; R5-4), line 20 (a relaunch runs the launch's script; Decision 12).
- testing/tests — red before green; a neighbour for each decision that must not change; line 7 (a mock answers as the real agent would; the two new mock keys), line 13 (a fix pinned at a second call site; R5-3, R5-9), line 14 (a check fails, it does not throw), line 15 (a stage error pinned by its `resumeFrom` label; R5-6, R5-7).
- process/docs-gate — one Docs entry per touched plugin file.
- process/release — no bump: nothing a setup rerun writes changes.
- prompts/attribution — no model or vendor name in any commit or spec file.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 30 (the rename bullet).** At the end, after "or the entry looks like one naming no finding (#80, R2-3)", append: "; a `verified` or `unconfirmed` ref with a note after the renamed id is renamed by its leading token with the note kept, so the leading-id read finds the finding and the note never mints a second one (#94, R5-3)".
2. **`agent-os/standards/workflow/agents.md`, line 38 (the unique-id bullet).** At the end, append: "; an id of the round's form the reviewer repeats is one of them: the second and later findings with it are renamed to the next free number with a warning, and a ref to the id stays with the first (#94, R5-5)".
3. **`agent-os/standards/workflow/agents.md`, line 39 (the outcome-list bullet).** At the end, append: "; and a disposition the person changes away from defer drops the shaper's entry, while the resolve agent's entry for a decision it planned replaces an earlier one for the same id (#94, R5-9)".
4. **`agent-os/standards/workflow/agents.md`, line 37 (the workflow-checks bullet).** After "(`checkWhy` runs after the `spec status` call and names the shaper, #94, R2-9)", insert: ", the decline-reason check runs there too, so a decline a rule turns into an ask is never stopped for its missing reason (#94, R5-6), and a check on a value the shaper returned reads it before any line of the workflow rewrites it (#94, R5-7)".
5. **`agent-os/standards/workflow/replay.md`, line 9 (the stop-items bullet).** At the end, append: "; a field a stop adds to the result is named in `relaunch.how` in the same commit, with what the relaunch passes for it, since a session reading the note would otherwise send the refused decision back unchanged (#94, R5-4)".
6. **No change for R5-2**: "the first entry stands" is the code's own rule, and the fix makes a bad first entry count as one; no standard line is wrong or missing.
7. **No change for R5-8**: line 39 (item 3) already says a list posted under an outcome's heading is read off the final outcome; the fix makes the rule line's label agree.
8. **No change for R5-1 and R5-10**: small refactors that teach nothing new.
