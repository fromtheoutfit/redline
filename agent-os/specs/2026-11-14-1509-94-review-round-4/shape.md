# PR #94 review round 4: the decision-rule, hand-off, bookkeeping and wording fixes the fourth review found — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The twelve findings of Redline round 4 on PR #94 (issue #93), and nothing more. The round reviewed the whole pull request at `4227e11`, which is the working tree's HEAD (the range in `redline/round-4-findings.json` is `4227e11..4227e11`; the commits after round 3's fixes touch only spec folders, `git show --name-only 4227e11`). Line numbers here are at that commit. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

Sorted:

- `fix` (9): R4-4, R4-5, R4-6, R4-8, R4-9, R4-11, R4-12 (correctness); R4-2, R4-3 (nits).
- `decline` (3): R4-1, R4-7, R4-10.
- No `defer` and no `ask`. No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`). This repository is the plugin, loaded in place, so `agents/`, `skills/`, `workflows/`, `tests/` and `docs/` are planned like any other file (the shaper's rule 7). No task touches the gate's backticked text, `checks.json`, `checks-template.sh` or anything under `templates/`, so nothing needs a restamp, a regeneration or a version bump.

## Decisions

1. **R4-4: fix.** The resolve prompt's last rule is `decideRule(pass)`, which on a Redline round is `NOT_YOURS` (`workflows/redline-loop.js:343`, `354`, `1748`): "A decision already made, the shaper's own included (a fix, a decline with its reason, a deferral), is applied as recorded and never reopened." Six lines earlier the same prompt says "a finding the shaper declined is overruled the same way" (line 1742), and `agents/redline-resolve.md:14` and `21` tell the agent to apply that overrule. The resolve prompt gets its own Redline rule, `RESOLVE_RULE`: a pending decision is the person's; a disposition override is the person's decision and replaces the shaper's, a decline included; every other decision is applied as recorded. `NOT_YOURS` keeps its bytes (built from a shared first sentence) for the standards approver and the implementer, which `decideRule` still serves. A human review pass keeps `NEVER_DECIDE`. Unattended answer 2. Plan Task 2.
   Decided by: redline
2. **R4-5: fix.** The plan approver's Redline branch opens with `NOT_YOURS` (line 1775), while its agent file, changed in this pull request, bounces a disproportionate fix, a decline a teammate cannot check, a decline of a finding unconfirmed and serious if true, and a refactor that fails one of the four tests (`agents/redline-plan-approver.md:17`), and the prompt's next sentence makes a decline with no reason a bounce. The approver gets its own rule, `APPROVER_RULE`: a pending decision is the person's; a decision made outside the shaper is applied as recorded; the shaper's own dispositions are what it checks, and a bounce sends one back to the shaper to decide again. The reshape prompt's Redline branch (line 1708) says a decided entry of the shaper's own that an adjustment names is decided again, and a decision the person made or the autopilot applied stays as it is; a human pass keeps its sentence byte for byte. Unattended answer 2. Plan Task 3.
   Decided by: redline
3. **R4-6: fix.** `review()` renames an id outside the round's form to `R<round>-<index+1>` (lines 2308-2316) without checking that it is free, so `['R2-1', 'R2-3', 'X']` gives two `R2-3`. The rename numbers after the highest id of the round's form in use, as `reconcilePrior` (line 2442) and `accountCoverage` (line 1576) number theirs. The rename map is kept. A single rename with no other finding, or one whose position matches, gets the id it got before, so the warning the loop test pins (`renamed R1-1`, `tests/loop-test.mjs:1495`) is unchanged. Unattended answer 6. Plan Task 4.
   Decided by: redline
4. **R4-8: fix, by handing back an override the resolve agent could not apply as something the stop asks.** `resolveWith`'s hand-off lists only judgment calls under `pending` (line 2945), so an unresolved override reaches the result only as `unresolved`, which nothing in `skills/` or `docs/` reads. The hand-off gains `overridesUnresolved` (each with the id, the title, the disposition and notes as recorded, and the agent's why), and their ids join `decisionsNeeded`. The skill shows each after the calls and the declines and asks the person to restate it in the answer form (`<id>: <fix|defer|accept>. <reason>`); the restated line changes the resolve prompt, so the relaunch reruns the round's first resolve instead of replaying the refusal. On autopilot the stage error names an override as the person's, not as the shaper's recommendation. Unattended answer 7. Plan Task 5.
   Decided by: redline
5. **R4-9: fix.** Every entry of the round's `deferred` list goes into `deferredAll` (lines 3109-3112), whatever its finding's final outcome, so a declined finding with a deferred entry is posted `declined:` and also listed under Deferred as `shipped <mitigation>`. Three changes, one rule (a deferred entry stands only beside a deferral): `checkDispositions` drops, with a warning, a shaper's deferred entry whose finding's disposition is not `defer`; after a reshape (line 3004) an earlier entry is kept only while its finding is still deferred or a decision stands on it; and the two `deferredAll` loops move after `outcomesFor` (line 3124), keeping their order, with the first one taking only an item whose outcome is `deferred` or `decided` (a decision the resolve agent planned a mitigation for). Plan Task 6.
   Decided by: redline
6. **R4-11: fix.** The Declined by Redline heading's overrule line fills the command with the runner's login (line 3275), and the `@login` selector keeps only that login's comments (`scripts/redline-gh.sh:428-432`), while the handoff is addressed to the teammate. The line names a placeholder and says whose login goes in: `` then run `/redline:redline-revise <pr> review @<login>` with the login of whoever replied, such as `review @<runner>` `` (the example only when a login is known; every `@` stays in a code span). The two loop expectations that quote the line follow it (`tests/loop-test.mjs:2324`, `2369`), and `docs/running.md:114` says the same. Plan Task 7.
   Decided by: redline
7. **R4-12: fix.** The human-review path runs its final nit pass when `outcome.newHead` is set (line 3726), and the implementer always commits the spec folder (`agents/redline-implementer.md:17`), so a pass that fixed nothing reviews an empty diff and posts a Redline round for it. The gate reads `outcome.fixed.length > 0`, as the main loop's `fixedAny` does since round 1's R1-20; `newHead` stays the range's end. The no-pass sentence becomes `No fix was committed, so no final nit pass.` (line 3371), three loop expectations follow (`tests/loop-test.mjs:961`, `1152`, `1156`), and `docs/running.md:226` says the pass runs when a fix was committed. No prompt of the human pass changes. Unattended answer 5. Plan Task 8.
   Decided by: redline
8. **R4-2: fix.** `rulesBlock` (line 446) still says a rule-covered finding is "never fixed or deferred by Redline" and that the approver bounces a task that "fixes a finding a prose rule covers", while this pull request made decline a disposition and updated the same rule in the shaper (`agents/redline-shaper.md:29`), the skill (`skills/redline/SKILL.md:98`) and `forceAskRules`'s comment (line 2698). The block says "never fixed, declined or deferred by Redline" and adds a decline of a finding a prose rule covers to the approver's bounces, and point 5 of `agents/redline-plan-approver.md:20` adds the same bounce, since a decline has no task to bounce. `forceAskRules` is not changed: the reviewer's tag is advisory by #49's design (`agent-os/standards/workflow/agents.md:10`, "the reviewer's tag is advisory and only marks the review"). The prompts change only in repositories that declare ask rules. Plan Task 9.
   Decided by: redline
9. **R4-3: fix.** With no login, `decisionSentence`'s fallback starts a sentence with `the person running Redline chose:` (line 1135). One constant, `personLabelStart`, the label capitalised where it starts a sentence, is used there and in `capComment`, which since R1-17 capitalises it inline (line 3388); with a login both read `@<login>` as before, and a human-review run keeps "The author". Plan Task 10.
   Decided by: redline
10. **R4-1: decline.** The reason is under Declined. No task. Unattended answer 4.
    Decided by: redline
11. **R4-7: decline**, as round 3 declined it as R3-5 (`agent-os/specs/2026-11-13-1329-94-review-round-3/shape.md`, Declined). Round 3's run stopped before its replies reached that thread (`4227e11` records the stopped run), so the verifier carried it; nothing in the code moved since. The reason is under Declined. No task.
    Decided by: redline
12. **R4-10: decline.** The reason is under Declined. No task. Unattended answer 3.
    Decided by: redline
13. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.3.0`, and `main` reads `0.2.4` (round 1's Decision 21, round 3's Decision 9). This round changes nothing a setup rerun writes (`agent-os/standards/process/release.md`, first bullet).
    Decided by: redline
14. **Run caution.** Task 9 changes `agents/redline-plan-approver.md`, and the rest of this run's rounds may run under the edit (README Known limits, "A self-review that edits an agent file runs its later rounds under the edit"); the edit only adds a bounce the prompt already implies. Task 5 changes `skills/redline/SKILL.md`'s decisions stop, which a later stop of this run reads only if the session reloads the skill. `workflows/redline-loop.js` changes in all nine tasks; a relaunch runs the script the run launched with (`agent-os/standards/workflow/replay.md:19`).
    Decided by: redline
15. **As built, Task 8's check placement.** The new run `human: only the spec folder committed` and its check go after the neighbour `human: the push prompt does not push`, which reads `run` from `human: nothing to commit`: placed right after `human: the summary says so`, as the plan said, the new run replaced `run` first and that neighbour failed. The check and the change are as planned. `plan.md`, As built.
    Decided by: redline

### Proportionality (the correctness findings)

- **R4-4.** Likelihood: every Redline round whose resolve agent applies an override (a typed decline overrule, a plan-dial change); the contradiction is in every such prompt. Impact: an agent that follows the last rule keeps the decline against the person's line, or lists it unresolved, which on guided gives the empty stop of R4-8. Cost: one constant and one interpolation in one file the pull request changed, one loop check.
- **R4-5.** Likelihood: every Redline round's approver prompt; it bites when the approver should bounce a decline or a fix. Impact: the only layer after the shaper that checks a decline against the unconfirmed-serious case is told not to reopen it, and a bounced decline can be kept by the reshape until the run stops at `approve`. Cost: one constant, two interpolations, one loop check.
- **R4-6.** Likelihood: low; the reviewer returns an id outside the round's form and its own numbering skips or reorders. Impact: two findings share an id, so this pull request's coverage accounting counts a ref against the wrong one, both replies go to one thread, and `prior-findings` reads two lines with one id. Cost: four lines in the function this pull request's coverage accounting reads, one loop check.
- **R4-8.** Likelihood: rare; the resolve agent finds an override's line too unclear, which its agent file tells it to do (`agents/redline-resolve.md:29`). Impact: the guided stop has nothing to ask, and every relaunch replays the same refusal, so the run cannot go on without editing args by hand. Cost: about ten lines in the workflow, one paragraph in the skill, one sentence in `docs/running.md`, one loop check; all three files are in the pull request's diff.
- **R4-9.** Likelihood: a shaper that returns a stray deferred entry, or a reshape that re-sorts a defer to a decline or a fix. Impact: the handoff says a mitigation shipped that never did, and the skill's `done` walk offers it as one. Cost: three small changes in one file, one loop check.
- **R4-11.** Likelihood: any handoff with a declined finding, read by a teammate who replies. Impact: the posted command selects the runner's comments, so the teammate's reply is not read and the pass may stop with nothing to revise. Cost: one string, two loop expectations, one doc sentence.
- **R4-12.** Likelihood: any human review pass whose comments were all `none`, or asks answered with no change. Impact: an empty Redline round is posted, uses a round number, and the summary says the nit pass found no bugs. Cost: one condition, one sentence, three loop expectations, one new check, one doc sentence.

## Declined

The reason below is the sentence posted in the finding's thread.

- **R4-1** (`needsDecision` in the human-review finding template): The pull request keeps a human review pass's prompts as they were ("A human review pass's own prompts are as they were", its description), the file is outside its diff, and the field is always false and read by no instruction, so dropping it belongs with the next change to the human review pass, in a follow-up issue.
- **R4-7** (run `forceAskRules` and `checkWhy` before `checkSpec`): As round 3 decided for R3-5, the reorder is no small refactor, since `forceAskRules` after `checkSpec` is `main`'s order and the call it saves is spent only when the shaper's schema, which already refuses an outside reason (`judgmentCallSchema`), is not enforced; in that path the spec check's diagnosis of a halted shaper (#57) runs first, which is worth the one call.
- **R4-10** (a correctness fix changed to accept on the plan dial still buys a round): The #93 spec's decision 1 says a new correctness item the shaper fixes or puts to the person buys the next round "whatever the person answered", and the code reads the shaper's own disposition on purpose (`workflows/redline-loop.js:3127-3131`), so this is the agreed done rule, not a defect.

## Unattended answers

1. **Are the findings real?** Each was traced in the code at `4227e11`. The shaper's guard refuses interpreters, so no harness was run here. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds only round 1 files from another run), and no scratch test was needed: every claim is a reading of prompt text or of a few lines of bookkeeping.
   - R4-4: `NOT_YOURS` (343) ends "applied as recorded and never reopened"; `decideRule` (354) gives it to the resolve prompt (1748), after the override sentence (1742). `git show origin/main:workflows/redline-loop.js` line 1623 carried `NEVER_DECIDE`.
   - R4-5: `planPrompt`'s Redline branch opens with `NOT_YOURS` (1775) and makes an unreadable decline a bounce in the next sentence; `reshapePrompt` keeps "Decisions already recorded as decided in shape.md stay as they are" for both kinds of pass (1708).
   - R4-6: the rename uses `index + 1` (2310-2315); `reconcilePrior` numbers after the highest id (2442); `accountCoverage`'s `byId` (1530) keeps the last finding with an id.
   - R4-8: `resolveWith` filters `pending` to calls (2945); `handoffResult` returns `unresolved` (3681) and `decisionsNeeded` from `pending` only (3682); `grep -n unresolved skills/redline/SKILL.md docs/*.md README.md` prints nothing.
   - R4-9: `deferredAll` takes every `deferred` entry (3109-3112) before `outcomesFor` (3124), which files a finding as deferred only when its disposition is `defer` (2541); line 3004 keeps every earlier entry the reshape's list does not name; the loop mock's reshape keeps a deferred entry for a scenario's `defer` ids whatever it re-sorts them to (`tests/loop-test.mjs:190`).
   - R4-11: line 3275 fills `@${login}`; `docs/running.md:114` says "A teammate overrules the same way from their own review".
   - R4-12: the human path's gate is `outcome.newHead` (3726); `newHead` is the last new commit (3152); the main loop gates on `fixed` (3166, 3910).
   - R4-2: `rulesBlock` (446) and point 5 of `agents/redline-plan-approver.md:20` name fix and defer only.
   - R4-3: `decisionSentence` (1133-1136); `personLabel` (190); `capComment`'s inline capital (3388).
   - R4-1: `skills/redline-revise/SKILL.md:19`; `git diff --name-only origin/main...HEAD` does not list the file.
   - R4-7: `checkSpec` (2876) before `forceAskRules` (2877) and `checkWhy` (2878); round 3's Declined entry for R3-5.
   - R4-10: `bought` reads `shaperOwn` (3131, 3165), with the comment at 3127-3130.

   Decided by: redline
2. **R4-4 and R4-5: does the #93 spec already settle what the resolve agent and the plan approver are told?** It settles both directions, and the code states only one. The spec's Task 3 deviation: "On a Redline round those now say that a pending decision is the person's and a decision already made, the shaper's own included, is applied as recorded" (`agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md:60`). Its decision 7: "A decline is overruled through two doors that exist today: a typed line at a stop the run already makes in that round" (line 48), which the resolve agent applies (`agents/redline-resolve.md:14`, "A finding the shaper declined on its own can be overruled this way"). This pull request's approver file bounces declines and disproportionate fixes (`agents/redline-plan-approver.md:17`). "Never reopened" contradicts the last two, so it is the disagreement to fix; "applied as recorded" stays for every decision of the person's and for the implementer and the standards approver.

   Decided by: redline
3. **R4-10: should a plan-dial accept of a correctness fix buy the round?** Yes, from the pull request's spec: "When a round verifies a new correctness item that the shaper fixes or puts to the person, the next round runs the coverage pass again, whatever the person answered and whether or not a commit resulted" (`agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md:42`), restated in `docs/running.md:43` ("This holds whatever you answered"). The code agrees, and its comment says why (`workflows/redline-loop.js:3127-3131`).

   Decided by: redline
4. **R4-1: leftover or on purpose?** On purpose for this pull request, from its description: "Prompts. Every Redline round's prompts change. A human review pass's own prompts are as they were". Removing the field changes the human pass's shaper prompt (`workflows/redline-loop.js:1682` prints the findings JSON). The field is inert (always false, no instruction defines it), so it is declined here, and its removal belongs with the next change to the human pass.

   Decided by: redline
5. **R4-12: is the human pass's nit-pass gate inside this pull request?** Yes. The pull request states the done rule as "after one final nit pass over the fixes when one was" committed, and says "the final nit pass that follows one is a Redline round and has the new ones" (its description, "Prompts"). Round 1's R1-20 moved the main loop's gate to `fixed` for this reason (`agent-os/specs/2026-11-13-1329-94-review-round-1/shape.md:27`), and the human path is the one site left on `newHead`. The fix changes no prompt of the human pass, so the description's "prompts are as they were" still holds; only its summary sentence changes, and the description already says that sentence changed ("unchanged but for one wording").

   Decided by: redline
6. **R4-6: is the rename inside this pull request?** The rename lines predate it (`git show origin/main:workflows/redline-loop.js`, line 2182), but this pull request's coverage accounting reads ids by `byId` (line 1530) and its minting and carrying number after the highest id (lines 1576, 2442), so a duplicate id now miscounts this pull request's own accounting. The fix is four lines in the same `forEach` this pull request edited (lines 2317-2332) and follows its own numbering; it is a fix, not a reach outside.

   Decided by: redline
7. **R4-8: list the override under `declined`, or apart?** Apart. An override is not always a decline: the plan dial changes a fix to defer or accept too (`docs/running.md:123`), so `declined` (the shaper's declines, with their reasons) would mislabel it. A field of its own, with the ids in `decisionsNeeded`, uses the skill's existing rule that a stop relaunches only once every id it needs is answered (`skills/redline/SKILL.md:214`). The answer form the skill already takes for an overrule (`<id>: fix. <reason>`, line 208) is the restatement, with `accept` added for a plan-dial override.

   Decided by: redline
8. **Questions Steps 1 to 5 would ask.** Scope: the round's findings (unattended point 6). Visuals: none. References: the code each finding names, and round 3's spec as the plan's format (`references.md`). Product context: `agent-os/product/mission.md`, through the #93 spec's Context; nothing here moves it. Standards: those under Standards Applied, read at `4227e11`.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond the #93 spec's; these findings make the prompts, the hand-off and the handoff comment keep what that spec built.

## Standards Applied

- workflow/agents — line 9 (no other role decides a pending call or reopens a decision made; R4-4, R4-5), line 10 (the reviewer's ask-rule tag is advisory; R4-2), line 11 (the two doors to overrule a decline; R4-8, R4-11), line 16 (a changed rule applied everywhere it is stated; R4-2), line 18 (a posted command is the namespaced form; R4-11), line 37 (the workflow checks a shaper's result; R4-9).
- workflow/replay — line 6 (decisions enter after the prompt they answer; R4-8), line 16 (the relaunch scenarios), line 19 (a relaunch runs the script the run launched with).
- testing/tests — red before green; a neighbour for each decision that must not change; a check fails rather than throws (line 14); a mock answers as the real agent would (line 7).
- process/docs-gate — one Docs entry per touched plugin file.
- process/release — no bump: nothing a setup rerun writes changes.
- prompts/attribution — no model or vendor name in any commit or spec file.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 9 (the shaper-decides bullet).** At the end, after "No other role decides a pending call or reopens a decision made", append: ", except where its job is to: a disposition override is the person's decision and replaces the shaper's, a decline included, and the plan approver checks the shaper's own dispositions and a bounce sends one back to the shaper to decide again, so the resolve and plan approver prompts carry rules of their own and not the implementer's 'never reopened' (#94, R4-4, R4-5)".
2. **`agent-os/standards/workflow/agents.md`, line 16 (the changed-rule bullet).** At the end of the bullet, append: "; and a new disposition is added to every rule that lists the old ones, found by searching for the list itself (`fixed or deferred`): after #93 added decline, the ask-rules block still said a covered finding is 'never fixed or deferred by Redline' until #94, R4-2".
3. **`agent-os/standards/workflow/agents.md`, after line 37 (the workflow-checks-a-result bullet).** A new bullet:
   > - A finding's id is unique in its round: every id the workflow gives (a rename of a reviewer's id outside the round's form, a minted candidate, a carried finding) is numbered after the highest id of the round's form in use, since coverage refs, inline comments and replies are all matched by id (#94, R4-6)
4. **`agent-os/standards/workflow/agents.md`, after the new bullet of item 3.** A new bullet:
   > - A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, so the shaper's stray entries are dropped with a warning and a reshape's re-sort drops the earlier one
5. **`agent-os/standards/workflow/replay.md`, after line 8 (the relaunch-args bullet).** A new bullet:
   > - Every item a stop hands back is one the skill asks about and counts in `decisionsNeeded`: an override the resolve agent could not apply comes back as `overridesUnresolved` with its why, for the person to restate, since a stop with nothing to ask relaunches with the same args and replays the same refusal every time (#94, R4-8)
6. **`agent-os/standards/workflow/agents.md`, line 18 (the namespaced-command bullet).** At the end, append: "; a posted command that takes a login names whose login goes in (`review @<login>` with the login of whoever replied), never the runner's alone, since the handoff is read by the teammate it is addressed to (#94, R4-11)".
7. **`agent-os/standards/workflow/agents.md`, line 12 (the human-review-pass bullet).** At the end, append: "; its final nit pass runs when the pass committed a fix (`fixed`), as the main loop's does, never on a new head alone, since the spec folder's own commit is no fix diff (#94, R4-12)".
8. **No change for R4-3**: the fix is one constant for the label where it starts a sentence, which R1-17 already taught; no standard line is wrong.
