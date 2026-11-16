# PR #94 review round 2: the read-back, accounting, outcome and handoff fixes the second review found — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The fifteen findings of Redline round 2 on PR #94 (issue #93), and nothing more. The round reviewed round 1's fix diff (`3d23086..e788107`) and the coverage pass's candidates over the whole pull request at `e788107`, which is the working tree's HEAD. Line numbers here are at that commit. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

Sorted:

- `fix` (13): R2-1, R2-5, R2-6, R2-10, R2-11 (correctness); R2-2, R2-3, R2-7, R2-8, R2-9, R2-13, R2-14, R2-15 (nits). R2-8 and R2-13 are small refactors.
- `defer` (1): R2-12.
- `decline` (1): R2-4.
- No `ask`. No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`). This repository is the plugin, loaded in place, so `agents/`, `workflows/`, `scripts/redline-gh.sh`, `tests/` and `docs/` are planned like any other file (the shaper's rule 7). No task touches the gate's backticked text, `checks.json`, `checks-template.sh` or anything under `templates/`, so nothing needs a restamp, a regeneration or a version bump.

## Decisions

1. **R2-1: fix.** Both login alternatives in `prior-findings` take an underscore: `@[A-Za-z0-9-]+` becomes `@[A-Za-z0-9_-]+` in `classify` (`scripts/redline-gh.sh:358`) and in the title's rule-tail capture (line 365). A GitHub Enterprise Managed User login is `<handle>_<shortcode>`, and `personLabel` writes whatever login `args.login` carries (`workflows/redline-loop.js:185-190`), so the rule reply and the review-body tail this pull request now write by login (`findingLine`, line 906; `describeOutcome`, line 2545) are read back wrong for such a login: the reply falls to `decided` and the tail stays in the title. A new gh fixture, PR 18, pins it. `scripts/redline-setup.sh:796`, which rejects an underscore in `--reviewer`, is outside this pull request's diff and is not touched. Plan Task 2.
   Decided by: redline
2. **R2-5: fix.** For a `verified` or `unconfirmed` entry, `accountCoverage` reads the ref's leading `R<n>-<k>` token (`workflows/redline-loop.js:1535-1537`), so `R1-1 (the guard)` counts as R1-1, with a warning that text followed the id, and mints nothing. A ref whose leading token names no finding of the round still becomes an unconfirmed finding as reported, as the #93 spec's default says ("a bad ref", its `shape.md:86`). The verify prompt and the agent file keep asking for the id alone (the #86 round 1 key phrase `ref is the finding's id alone`, pinned at `tests/loop-test.mjs:1562`). The #86 round 1 spec left the loosening open ("Nothing here decides whether the match should ever be loosened", its Unattended answer 6), and #93 raised its cost: the same slip on `main` gave a For the person line, and now it mints a correctness finding that can buy a round. The standard asks that a parse read past a note after the parsed token (`agent-os/standards/workflow/agents.md:16`), as the `duplicate` parse already does (line 2363). Plan Task 3.
   Decided by: redline
3. **R2-6: fix, by minting at a placeholder the reader accepts.** A candidate with no file is minted at `(no file)`, line 0 (`workflows/redline-loop.js:1567`), so its body line reads `` `(no file):0` `` and `prior-findings`' `` `(?<file>[^`]+):(?<line>[0-9]+)` `` (`scripts/redline-gh.sh:343`) reads it back: a later run sees it as a finding with a disposition and its reply has a line to attach to. The post script already moves a comment whose path is in no hunk into the review body (`scripts/redline-gh.sh:211-231`), so the placeholder posts as the empty path did. The reviewer's other options are not taken: the PR's first changed file would name a file the finding is not about, and a body marker the reader reads would change `findingLine` and `prior-findings` together for one edge. PR 18 gains the line and a case. Plan Task 4.
   Decided by: redline
4. **R2-10: fix, by not calling an accept that keeps a decline an overrule.** `overruled` (`workflows/redline-loop.js:3102`) leaves out an item the shaper declined whose decision is `accept`. The skill says only a change to fix or defer overrules a decline (`skills/redline/SKILL.md:183`), and an accept changes nothing Redline does. The item stays the person's decision with their reason, as the skill asks for an accept ("for an `accept` the reason the behaviour stands"), so it is listed under `### Put to @<login>`, counted as put to the person in the Rounds line and in the skill's closing summary (`overruled` false), and its reply is the person's sentence, as today. No new group or wording is added. `docs/running.md:148-149` say so. An accept on a fix or a defer is still an overrule; the plan-dial run in section 3 of the loop test (`1 overruled by @author`) is the neighbour. Plan Task 5.
   Decided by: redline
5. **R2-11: fix.** `bought` (`workflows/redline-loop.js:3127`) also counts a correctness item that has a judgment call in `calls`, which keeps every call the round raised (line 2866, and the concat at 2978), so a call put to the person buys the round even when a reshape re-sorts its finding afterwards. The done rule says so: "A new correctness finding the shaper fixes or asks about buys the next round, whatever the answer" (the PR description; the #93 spec's answer 1). Plan Task 6.
   Decided by: redline
6. **R2-12: defer.** The mitigation: `fixed` (`workflows/redline-loop.js:3128`) leaves out an item whose outcome is `declined` or `none`, so a commit message that mentions a declined id never makes a final-nit-pass sentence call it fixed, which is the promise the PR description makes ("never says fixed of an item that was declined") and the comment at lines 3147-3150 states. A deferral's mitigation commit stays counted: it is unreviewed code, so it must still buy the final nit pass in the main loop (`fixedAny`, line 3857) and set `lastFixUnreviewed` (lines 3702, 3830). A comment at the count names R2-12 and says the final-nit-pass sentences still call a mitigated item fixed. The full fix is under Deferred. Plan Task 7.
   Decided by: redline
7. **R2-2: fix.** `KINDS` (`workflows/redline-loop.js:346`) is split so its last sentence is the pass's: every prompt but a final nit pass keeps "a correctness finding the run acts on buys another round." byte for byte, and a final nit pass's prompt says instead that in this final nit pass such a finding gets one more revise pass, and then the run ends (lines 3817-3830; 3696-3705 after a human pass). The agent file's kind bullet (`agents/redline-reviewer.md:65`) gains the same parenthetical, since the standard applies a changed rule wherever the prompt and the agent file state it (`agent-os/standards/workflow/agents.md:16`). Plan Task 8.
   Decided by: redline
8. **R2-3: fix.** `shapeSchema` takes the pass's disposition enum beside its reasons (`workflows/redline-loop.js:675`, `692`, `719`): `['fix', 'decline', 'defer', 'ask']` for a Redline round and `['fix', 'ask', 'none']` for a human review pass, so the other pass's value is refused in the shaper's own run, as R1-12 did for `why_human`. `checkDispositions` stays the second layer. Plan Task 9.
   Decided by: redline
9. **R2-7: fix.** `relaunch.how`'s decisions clause (`workflows/redline-loop.js:2220`) adds that a decline overruled at that stop carries `"disposition": "fix|defer"`, as the skill records it (`skills/redline/SKILL.md:208`) and `overridesFor` reads it (line 2888). The line is outside the diff, but the overrule at that stop is this pull request's, so the stale clause is within what it set out to do. Plan Task 10.
   Decided by: redline
10. **R2-8: fix, a small refactor.** `checkCalls` drops its unused `pass` parameter (`workflows/redline-loop.js:2603`, call sites 2847 and 2965), which puts back `main`'s signature (`git show main:workflows/redline-loop.js`, line 2463: `function checkCalls(shaped, known = [])`). All four tests hold: behaviour unchanged, no check edited; one file the pull request changed; the parameter and both call sites are lines the pull request wrote; one removal. Plan Task 11.
    Decided by: redline
11. **R2-9: fix.** `checkWhy` takes the shaper's label and throws with it (`workflows/redline-loop.js:2630`), so `resumeFrom` names `shape r<n>` or `reshape r<n> #N`, not the `spec status` call that ran last (`stageError` defaults to `lastLabel`, lines 460-463; `run()` sets it, line 499). The claim does not need a schema leak to be seen: the loop test's `ask: outside the cases` run already reaches `checkWhy`, since the mock does not apply a schema. Round 1's As built says "The error text and the resume label are unchanged" for this move (its `plan.md:599`); that sentence was wrong about the label, and this round's As built records the correction, since no role writes round 1's folder now. Plan Task 12.
    Decided by: redline
12. **R2-13: fix, a small refactor.** In `handoffComment`, the group tests (lines 3189-3195) become named predicates that the Rounds counts (lines 3202-3210) read too, so a grouping changes in one place. All four tests hold: every comment byte for byte, no check edited; one file; lines `471d4816` wrote (`git blame`); one extraction, a few lines. Plan Task 13.
    Decided by: redline
13. **R2-14: fix.** The Fixed caption (`workflows/redline-loop.js:3254`) becomes "With the commits that fixed each", since one item can have two commits and two can share one (this PR's round 1: R1-5 and R1-12 share `c5a2d90`). `docs/running.md:154` says the same. The three loop expectations that quote the caption follow it (`tests/loop-test.mjs:323`, `1864`, `2267`). Plan Task 14.
    Decided by: redline
14. **R2-15: fix.** `handoffResult`'s `declined` (`workflows/redline-loop.js:3627`) leaves out an id whose decision in `decisions` carries a disposition: the person already overruled it, the overrule is applied on the relaunch, and listing it again tells the person it will be posted as declined. Leaving it out, rather than marking it, keeps the skill as it is (`skills/redline/SKILL.md:208` lists what `declined` holds). Plan Task 15.
    Decided by: redline
15. **R2-4: decline.** The reason is under Declined. No task.
    Decided by: redline
16. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.3.0`; `main` reads `0.2.4` (round 1's Decision 21). This round changes nothing a setup rerun writes (`agent-os/standards/process/release.md`, first bullet).
    Decided by: redline
17. **Run caution.** Task 8 changes `agents/redline-reviewer.md`. The rest of this run's rounds run under the edit, and the skill names the file (README Known limits, "A self-review that edits an agent file runs its later rounds under the edit"). The edit only adds a parenthetical for the final nit pass, which that pass's prompt already states after Task 8. `workflows/redline-loop.js` changes in most tasks; a relaunch runs the script the run launched with (`agent-os/standards/workflow/replay.md`, the #81 bullet).
    Decided by: redline
18. **Built: Task 6's scenario marks the answered call as no change.** As planned, the R2-11 scenario stopped at `check r1` before and after the fix (`no commit names R1-2`), because the resolve mock gives an answered call a task with a file. The scenario adds `acceptedCalls: ['R1-2']`, since "Keep it" changes no code. The check and its red and green results are as the plan gives them (`plan.md`, As built).
    Decided by: redline

### Proportionality (the correctness findings)

- **R2-1.** Likelihood: any run whose login has an underscore, which is every Enterprise Managed User login; not reachable on a personal account (letters, digits and hyphens only). Impact: the next run's handled list and the handoff's Earlier rounds show a title with the rule tail in it, and a rule-left finding reads as `decided`; both are tracked, so nothing is raised again. Cost: two characters in two patterns, three fixture files, two gh cases; no file outside the diff.
- **R2-5.** Likelihood: needs the verifier to add a note after the id against the prompt; the #86 round 1 spec saw the same slip once in its review. Impact: a second, unconfirmed correctness finding repeating one already reported, posted inline, shaped on its own, and able to buy a round or reach the cap-hit comment. Cost: one parse and one warning in `accountCoverage`, one loop check, one doc sentence.
- **R2-6.** Likelihood: needs the finder to return a candidate with no file and the verifier to leave it out; the parser already defaults a missing file to `''` (line 1476). Impact: a finding with an id and a reply that no later run reads back, so it is neither carried nor settled and may come back as new. Cost: a constant and one expression, one loop check, one fixture line and one gh case, one doc sentence.
- **R2-10.** Likelihood: the plan dial, with a person typing `accept` on a decline rather than approving as is. Impact: the handoff, its Rounds line and the closing summary say the person overruled Redline when they agreed with it. Cost: one condition (the shaper's disposition read once, before the decided list), one loop check, two doc lines.
- **R2-11.** Likelihood: needs a reshape to re-sort a decided call's finding against its prompt ("Decisions already recorded as decided in shape.md stay as they are", line 1686). Impact: the run ends a round early, against the done rule. Cost: one clause in `bought`, one scenario key in the shaper mock, one loop check.
- **R2-12.** See Deferred.

## Declined

The reason below is the sentence posted in the finding's thread.

- **R2-4** (one field for the person label on `passOf`): The five ternaries keep the two words a human review pass has always used ("the author" at three, "the person" at two, as `main` writes them), which the #93 spec keeps unchanged on purpose (its `shape.md`, the Task 6 deviation: "A run that is a human-review pass keeps 'the author' ... so nothing in that pass changes"), and three of the five sites receive a `human` flag rather than a pass, so one field on `passOf` would need two words and new parameters on `decisionSentence`, `leftDecision` and `describeOutcome` and their callers for no change in what is posted.

## Deferred

- **R2-12** (`fixed` counts a deferral's mitigation as fixed). Shipped this round: `fixed` leaves out a declined item and a none, so no wording calls a declined item fixed, and a comment at the count names R2-12. Left open: the final nit pass's opening sentence in `handoffComment` (`workflows/redline-loop.js:3154-3162`) and the human review pass's summary line in `humanSummary` (lines 3332-3336) count a deferred item whose mitigation was committed as fixed. The full fix names it apart, for example "1 deferred, its mitigation committed in one more pass that was not re-reviewed", in both, with loop checks for a final nit pass that defers one item. It extends the three wordings the owner approved in the #93 spec (its answer 10 and the Task 5 deviation) for a case they did not cover, so the wording is worth the owner's eye. Likelihood: a final nit pass correctness item the shaper defers rather than fixes, which no run has produced yet. Impact: the opening sentence says "fixed" while the Deferred list below it shows the full fix open, and the commit is still flagged for a look. Cost of the full fix: four sentence branches across two functions, their docs line and three or four loop checks.

## Unattended answers

1. **Are the findings real?** Each was traced in the code at the lines the Decisions cite. The shaper's guard refuses interpreters, so no harness was run here. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds only round 1 files from another run), and no scratch test of the shaper's was needed.
   - R2-1: `classify` (line 358) and the title capture (line 365) allow `@[A-Za-z0-9-]+` only.
   - R2-5: `byId.get(ref)` with the whole trimmed ref (lines 1535-1537); a miss adds the index to `told` (1541), and the fill loop mints (1556-1571).
   - R2-6: the parser defaults `file` to `''` (1476), the mint copies it (1567), `findingLine` writes `` `${f.file}:${f.line}` `` (908), and `finding_lines` needs one character or more before the colon (`scripts/redline-gh.sh:343`).
   - R2-10: `overruled` is `kind === 'decided' && !calls.some(...)` (3102); `outcomesFor` gives `decided` whenever a decision exists (2513-2514); `overridesFor` takes any decision with a disposition (2888).
   - R2-11: `bought` reads `shaperOwn` and `finalOwn` only (3125-3127); `checkCalls` skips a decided call's finding on a reshape (2609-2611); the decision `Keep it` has no disposition, so `effectiveDispositions` keeps the reshape's `decline` (2930-2933).
   - R2-12: `fixed` is every in-scope item with a commit (3128); a deferred item's `commits` is `named` (2516), and so is a declined one's (2519).
   - R2-2: `reviewPrompt` pushes `KINDS` on every review, the final nit pass included (1389).
   - R2-3: one `disposition` enum in `shapeSchema` (692) for both passes (719).
   - R2-7: the decisions clause (2220) has no `disposition`; `overridesFor` needs one (2888).
   - R2-8: `checkCalls` (2603-2618) reads `shaped` and `known` only.
   - R2-9: `checkWhy` throws `stageError('shape', ...)` with no label (2630), after `checkSpec`'s `spec status` run (2848-2850, 2966-2968).
   - R2-13: the tests at 3189-3195 and again at 3202-3210.
   - R2-14: the caption at 3254; `describeOutcome` lists every commit that names an item (2537).
   - R2-15: `declined` reads `outcome.shaped.findings` and nothing in `decisions` (3627); an unresolved call hands back the same `shaped` (2917).
   - R2-4: the five ternaries at 1130, 1160, 1296, 2512 and 2545; `main` writes "The author" (1049), "the person" (1079, 2397) and "the author" (1211, 2423).

   Decided by: redline
2. **R2-5: does an earlier spec settle that a `verified` or `unconfirmed` ref must match exactly?** No. The exact match is #80 round 1's rule for "a ref that names no finding" (`agent-os/specs/2026-11-06-1019-80-review-round-1/shape.md:22`), and the #86 round 1 spec declined to loosen it only because that finding did not need it: "Loosening it would change which refs that rule accepts, a change to an earlier round's decision that this finding does not need, so it is not planned. Nothing here decides whether the match should ever be loosened" (`agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md:54`). A ref that opens with a finding's id names that finding, so the rule for one that names none still applies to every ref whose leading token is not an id of the round.

   Decided by: redline
3. **R2-10: where does an accepted decline go?** The skill answers what it is: "changing a decline to `fix` or `defer` overrules it" (`skills/redline/SKILL.md:183`), so an `accept` does not, and the person's reason is recorded ("for an `accept` the reason the behaviour stands"). The workflow already sorts a person's decision that is not an overrule under Put to (`workflows/redline-loop.js:3189`). The plan dial put the item to the person, who decided it, so that group is honest and needs no new heading. Listing it under Declined by Redline would drop the person's reason, which the skill records.

   Decided by: redline
4. **R2-11: does the PR answer whether an ask buys the round when its finding is later re-sorted?** Yes. The PR description: "A new correctness finding the shaper fixes or asks about buys the next round, whatever the answer and with or without a commit." The #93 spec's answer 1: "When a round verifies a new correctness item that the shaper fixes or puts to the person, the next round runs the coverage pass again, whatever the person answered". The item was put to the person, so it buys the round; the code disagrees, and that is the fix.

   Decided by: redline
5. **R2-12: does the PR answer what a mitigation counts as?** In part. For the main loop, `docs/running.md:43`: "a new correctness finding that the shaper fixed (in full, or by a deferral's mitigation) or put to you", and a mitigation is a commit the final nit pass must read, so it keeps counting there. For the final nit pass's sentence, the #93 spec's answer 10 and its Task 5 deviation give three wordings (all fixed, none changed, some of each) and say the sentence counts "what a commit fixed"; they do not say what a deferred item is, which is why the wording is deferred to the owner rather than invented here.

   Decided by: redline
6. **Questions Steps 1 to 5 would ask.** Scope: the round's findings (unattended point 6). Visuals: none. References: the code each finding names, and round 1's spec as the plan's format (`references.md`). Product context: `agent-os/product/mission.md`, through the #93 spec's Context; nothing here moves it. Standards: those under Standards Applied, read at `e788107`.

   Decided by: redline
7. **Plan approver adjustment 1: the `workflow/agents` line numbers.** Both adjustments are applied. At `e788107`, `agent-os/standards/workflow/agents.md` holds the coverage-pass bullet ("becomes a finding of the round as reported (a new id, `correctness`, `unconfirmed`), with a warning,") on line 38 and the #85 verifier-rules bullet ("never in a `verified` or `unconfirmed` ref, which the workflow matches by id alone (#86, R1-4)") on line 39, checked with `grep -n`; lines 29 and 30 hold the minted-id numbering bullet and the answered-review-body bullet. Retrospective items 1 and 3, Standards Applied and `standards.md` now cite 39 and 38; no item's wording changed. Items 2, 4 and 5 (lines 16, 36 and 11) and item 6 (`testing/tests.md` line 14) were re-checked the same way and stand. `plan.md` cites no line of `agents.md`, so it is unchanged.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond the #93 spec's; these findings tighten what that spec built.

## Standards Applied

- workflow/agents — line 16 (a changed rule applied wherever the prompt and the agent file state it; a parse reads past a note after its token; R2-2, R2-5), line 39 (a `verified` or `unconfirmed` ref matched by id alone; R2-5), line 38 (a left-out candidate minted as a finding; R2-6), line 36 (the workflow's checks and `resumeFrom`; R2-3, R2-9), line 9 (the shaper's cases), line 12 (a human review pass never declines or defers; R2-3).
- workflow/replay — the #81 bullet: a relaunch runs the script the run launched with.
- testing/tests — red before green; a neighbour for each decision that must not change; a check fails rather than throws; a reshape mock answers what the reshape prompt asks for (R2-11's new mock key).
- scripts/bash-conventions — the `redline-gh.sh` header is quoted in `docs/scripts.md`; this round leaves the header as it is.
- process/docs-gate — one Docs entry per touched plugin file.
- process/release — no bump: nothing a setup rerun writes changes.
- prompts/attribution — no model or vendor name in any commit or spec file.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 39 (the #85 verifier-rules bullet).** Replace "never in a `verified` or `unconfirmed` ref, which the workflow matches by id alone (#86, R1-4)" with:
   > never in a `verified` or `unconfirmed` ref, which the workflow reads by its leading id: a note after the id is read past with a warning, so it never mints a second finding for a candidate already reported, and a ref whose leading token names no finding of the round is kept as an unconfirmed finding (#86, R1-4; #94, R2-5)
2. **`agent-os/standards/workflow/agents.md`, line 16 (the changed-rule bullet).** Replace "R1-4 kept a partly tracked candidate's issue out of a `finding` ref, which the workflow matches by id alone" with "R1-4 kept a partly tracked candidate's issue out of a `finding` ref, which the workflow then matched by id alone and since #94, R2-5, reads by its leading id".
3. **`agent-os/standards/workflow/agents.md`, line 38 (the coverage-pass bullet).** After "becomes a finding of the round as reported (a new id, `correctness`, `unconfirmed`), with a warning,", insert "at `(no file)`, line 0, when the finder gave no file, so `redline-gh.sh prior-findings` reads its line back (#94, R2-6),".
4. **`agent-os/standards/workflow/agents.md`, line 36 (the workflow-checks-a-result bullet).** Replace "the shaper's output schema is built per pass, so its enum is that pass's reasons and the rule reasons" with "the shaper's output schema is built per pass, so its enums are that pass's dispositions (a Redline round's `fix`, `decline`, `defer`, `ask`; a human review pass's `fix`, `ask`, `none`) and that pass's reasons and the rule reasons (#94, R2-3)". After "an unusable result is a stage error with `resumeFrom` naming the agent to rerun", insert ", the agent the error is about, passed by name when another agent ran after it (`checkWhy` runs after the `spec status` call and names the shaper, #94, R2-9)".
5. **`agent-os/standards/workflow/agents.md`, line 11 (the owner bullet).** After "or a reply in the thread and a human review pass over their own login (#93).", insert "An `accept` that keeps a decline changes nothing Redline does: it is the person's decision, listed under Put to with their reason, never an overrule (#94, R2-10)."
6. **`agent-os/standards/testing/tests.md`, after line 14 (the check-fails-not-throws bullet).** A new bullet:
   > - A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9)
