# PR #103 review round 2: what each agent and reader is shown of a deferral's record — Shaping Notes

Shaped by Redline in unattended mode, for review round 2 of PR #103 (issue #100), from the round's twelve findings (`redline/round-2-review.json`, `redline/round-2-findings.json`). Line numbers are at `363e445`, the head of the pull request's branch.

## Scope

The round's twelve findings, nothing more. Four are correctness findings (R2-6, R2-7, R2-8, R2-10), all low severity. Eight are nits (R2-1, R2-2, R2-3, R2-4, R2-5, R2-9, R2-11, R2-12). The verifier confirmed every finding, so none needs a second look.

- `fix`, nine: R2-7, R2-8, R2-1, R2-2, R2-3, R2-4, R2-5, R2-9, R2-11.
- `decline`, three: R2-6, R2-10, R2-12.
- No `defer`, no `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/` and `scripts/`, every file under `agents/`, and the Verification Gate's text. This round touches none of them. The version stays `0.4.1`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the twelve findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, the pull request's own spec (`agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/`) and round 1's spec (`agent-os/specs/2026-11-17-1643-103-review-round-1/`); see `references.md`. `agent-os/product/` exists, but nothing in this round changes what Redline promises, so it adds no constraint.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 16, 39, 42, 46, 49), workflow/replay (line 21), testing/tests (lines 7, 14, 28, 33), process/docs-gate (lines 5, 8, 15, 16), process/release (line 5) and prompts/attribution. Each was read at `363e445` and is copied in `standards.md`.
   Decided by: redline
3. **R2-6: what does the reply say for a decided deferral whose only commit mentions its id?** The pull request answers this. Under "Behaviour that changes on purpose" its description says: "A deferral whose words describe a mitigation, with no files listed and only a commit that mentions its id, is posted as shipping nothing." It also says: "A 'Mitigate' answer whose task is never built is posted `No code change. Deferred to #<n>.` with the warning." Under "Known gaps" it says: "A mitigation committed under a subject that does not open `redline: <id>`, and not reported for the finding, is not counted." So "shipping nothing" in its decided form, `No code change.`, is the chosen reply. `tests/loop-test.mjs:3157` (`chosenBare`) and `:3162` (`chosenUnbuilt`) pin it. The finding is sorted on that answer (Decision 10).
   Decided by: redline
4. **R2-7: may the result's deferred entry say what shipped through the emptiness of its words?** The pull request answers no: "After this pull request the words decide nothing," and "the skill reads what ships from `ships`." The skill's closing summary (`skills/redline/SKILL.md:264, 268`) still reads an empty `mitigation` as nothing shipped. That disagreement is the finding to fix (Decision 1).
   Decided by: redline
5. **R2-4: does the plan dial show the shaper's words beside an empty file list on purpose?** Yes. The skill's plan dial (`skills/redline/SKILL.md:184`) says `deferredPlanned` "holds each defer's mitigation (empty when nothing ships now)". It also says that for a defer, a task listed in `files` "is what says a mitigation is planned, whatever its words say". So the plan dial is meant to show the shaper's own words beside its file list, and the files decide. The comment at `workflows/redline-loop.js:777-778` and the sentence at `docs/running.md:125` state an absolute that this stop does not meet. Those two texts are what to fix (Decision 6). Blanking `deferredPlanned`'s words would undo the view the skill describes, so it is not taken.
   Decided by: redline
6. **R2-5: what is an ask's `files`?** Three sources agree that it is the paths its recommended change would touch:
   - The ask-rules block (`workflows/redline-loop.js:517`): "every finding's JSON lists files, the paths its task would touch, so the workflow can apply the paths rules".
   - The shaper's own file: rule 7 (`agents/redline-shaper.md:30`, "the paths its task would create or change, so the workflow can apply the `paths` rules to the plan"), and its example R1-3, an ask that lists `config/project/project.yaml`.
   - `docs/contract.md:152`: "The workflow forces `ask` for a finding whose file, or any file its planned task would touch, matches".

   `forceAskRules` (`workflows/redline-loop.js:3229-3231`) is the only reader of an ask's `files`. `FILES_ASK`'s "an empty list when it has no task" disagrees with all of these for an ask, whose plan task holds options rather than a change. That wording is the finding to fix (Decision 7).
   Decided by: redline

## Decisions

1. **R2-7 (correctness, fix).** The result's deferred entry (`deferredEntry`, `workflows/redline-loop.js:3385-3393`) gains `ships`: whether its outcome holds a commit of the finding's own. `draftView` already has this field (3406). The words stay blanked when nothing shipped, as now. The skill's `done` and `capped` sections (`skills/redline/SKILL.md:264, 268`) read `ships` for what shipped and never the emptiness of `mitigation`. When `ships` is true and the words are empty, they print "a change in its own commit", mirroring the drafts stop's "a planned change" (`skills/redline/SKILL.md:220`). Loop checks pin `ships` on the mirror case for both words and on the pinned case, plus the skill's new sentences.
   Decided by: redline
2. **R2-8 (correctness, fix).** In `resolveWith`, an entry the resolve agent returns for a finding whose override is not defer is dropped before the round's list takes it, with a warning: `the resolve agent listed <ids> as deferred, a finding the person changed away from defer; the entry is dropped, since the decision stands`. Today only `isDeferral` ignores such an entry (R1-11). The raw `deferred` list still carries it to the plan approver (3851) and the implementer (3973, printed at 2161-2162), against `awayFromDefer`'s rule (3696-3698) and the R1-11 comment this pull request added (3813-3815): "an override to fix or accept leaves no deferral behind (awayFromDefer), whatever entry the resolve agent returns beside it".

   The drop sits before the draft check, so an undrafted stray entry beside a fix or accept override no longer stops the round at resolve. The person's decision stands whatever the entry holds. On the base branch such an entry was read as a deferral and filed. R1-11 stopped the filing but left the entry in the list, so the list is where this pull request's change still shows. A loop check on `overrideBuilt` pins it: neither prompt holds the entry, and the warning is raised.
   Decided by: redline
3. **R2-1 (nit, fix).** The done rule's statement in `agent-os/standards/workflow/agents.md:42` is still the rule from before #100: "defers with a mitigation ... buys the next round whatever the answer and with or without a commit". So is the comment at `workflows/redline-loop.js:4113-4116` ("in full, or by a deferral's mitigation ... whether or not a commit resulted"). Since #100 a deferral buys a round only through a commit of its own (`buys`, 4132; `docs/running.md:44`). The comment is reworded in this finding's commit, pinned by a source check. The standard's sentence goes through the standards retrospective (item 1 below), whose commit names R2-1, since a standard changes only in its own approved commit. process/docs-gate, line 15, has every statement of the done rule reworded. The others a reader meets (README line 5, "What a clean run means", `docs/running.md:44`) already say a deferral with nothing shipped buys none.
   Decided by: redline
4. **R2-2 (nit, fix).** A loop check pins the accept half of R1-11's rule: an override to `accept` beside a filled resolve entry files nothing, lists nothing under the result's `deferred`, and is posted `Keep it as it is. No code change.`. The comment that names R1-11's neighbours (`tests/loop-test.mjs:3134-3135`) names the new scenario in place of `deferAccepted`, which scripts no resolve entry. After Decision 2 the accept case is guarded twice, by the drop in `resolveWith` and by `isDeferral`. The check pins the outcome, so its red run is a mutation of both layers (testing/tests, line 28: a case per form, each seen red under a mutation of its clause).
   Decided by: redline
5. **R2-3 (nit, fix).** `DEFERRED_SCHEMA`'s comment (`workflows/redline-loop.js:766-769`) says the field is "shown and never read to decide (#100)". `isDeferral` does read it, as filled or empty, for a call's decision (3819), as the comment on `mitigationFilled` a few lines down says. The schema comment is reworded to say so, and its over-long line 767 is rewrapped. workflow/agents, line 16: a comment that restates a rule is changed with it.
   Decided by: redline
6. **R2-4 (nit, fix).** Two texts claim the words are shown only beside a mitigation that ships: the comment above `mitigationFilled` (`workflows/redline-loop.js:777-778`) and the sentence in `docs/running.md:125`. Both are narrowed to the stop's drafts and the result's deferred list. Each names the plan dial's list of the shaper's dispositions as the one place where the shaper's words stand beside its file list, and the files decide (Unattended answer 5). The phrases R1-7 pinned (`only beside a mitigation the record says ships`, `which are shown only beside a mitigation that ships`) stay as they are. The standard's copy of the absolute (`workflow/agents.md:49`) is narrowed through the retrospective (item 2), whose commit names R2-4.
   Decided by: redline
7. **R2-5 (nit, fix).** `FILES_ASK` (`workflows/redline-loop.js:866`) becomes `files (the paths its task creates or changes, an empty list when it has no task; for an ask, the paths its recommended change would touch)`. This agrees with the ask-rules block in the same prompt and with what `forceAskRules` reads (Unattended answer 6). The phrase the loop test pins in every shape prompt and in the shaper's file (`FILES_ASKED`, `an empty list when it has no task`) stays as it is.
   - The skill's plan dial (`skills/redline/SKILL.md:184`) says what an ask's `files` holds.
   - `agents/redline-shaper.md` is left as it is. Its rule 7 and its example R1-3 already give the ask reading, and a changed agent file would put a drift sentence in this run's handoff (#81; workflow/agents, line 44).
   - The scripted shaper keeps `[]` for an ask. Its calls recommend "Keep it", a change that touches nothing, which is the value the real agent would give (testing/tests, line 7).
   Decided by: redline
8. **R2-9 (nit, fix; a small refactor).** In `plannedFiles`' undecided branch, `shaperPlanned(id) ? shaperFiles(id) : []` (3793) equals `shaperFiles(id)` for every input, including repeated ids:
   - When `shaperPlanned` is false, every defer finding with that id has an empty list or none, so `shaperFiles` gives `[]`.
   - When it is true, both read the first defer finding's list.

   So `shaperPlanned` goes, `plannedFiles` reads `shaperFiles` directly, and its comment carries what `shaperPlanned`'s said (#97, R2-6). The schema comment's reference (853) becomes `plannedFiles`. All four small-refactor tests hold:
   - Behaviour is unchanged: no existing expectation is edited, and nothing outside the script names it.
   - It stays inside the pull request: `workflows/redline-loop.js` is a file the pull request changed.
   - It reworks this pull request's code. The call it inlines is on line 3793, which the pull request added. Its helper had one other reader, the `planned` set in the base branch's `outcomesFor` call, which this pull request removed and so left the helper redundant. Line 853 is the pull request's too.
   - It is one inlining of a few lines.
   Decided by: redline
9. **R2-11 (nit, fix).** `effectiveDispositions` (`workflows/redline-loop.js:3775-3778`) builds the list both the plan approver and the implementer are shown. For a deferral the person or autopilot decided, it now carries the files of the task the round planned for it (`plannedFiles`), the list the workflow reads. `approverFindings` (3798, R1-2's narrower fix) goes, and the plan approver's call reads `effectiveDispositions()` again. The condition is R1-2's, unchanged: a decided finding whose disposition after the overrides is `defer`. Every other finding keeps the shaper's list, byte for byte, so the approver's view is the same as today and the implementer's now agrees with it.

   Today the implementer is shown `"disposition": "defer", "files": ["app/x.php"]` for a fix the person changed to a deferral with no task. #100 made `files` required, so that stale list now reaches every repository. No call of `effectiveDispositions` runs before `plannedFiles` is declared: its callers are `isDeferral`, the plan approver's call and `finalDispositions`, all after it. Cost: one function rewritten and one removed, in a file the pull request changed, plus three loop checks.
   Decided by: redline
10. **R2-6 (correctness, decline).** Reason: the pull request posts a deferral with no commit of its own as shipping nothing on purpose, in the decided form as `No code change.` (its description, "Behaviour that changes on purpose" and "Known gaps"). Code lands under that reply only when the implementer commits the mitigation under a subject that does not open `redline: <id>` and also leaves it unreported, against both halves of its rule 3, and then the run's warning names the planned files. The two replies the pull request pins (`chosenBare`, `chosenUnbuilt`) use this wording. Dropping `No code change.` only when a commit mentions the id would make a mention, which this pull request reads as nothing, change what the thread says again.
    Decided by: redline
11. **R2-10 (correctness, decline).** Reason: the failure needs two agents to act against their prompts in one round.
    - First, a reshape raises a judgment call for a finding the person already decided by a disposition override. The reshape prompt forbids this (`workflows/redline-loop.js:2011`, "a decision the person made, or the autopilot applied, stays as it is").
    - Then a resolve of that same, unchanged decision drops the task the first resolve planned.

    Even then the cost is a bounced plan or a resumable stop at approve, never a wrong commit or reply. A reshape's call for a decided finding is the only path to a second resolve for the same id, and keeping every resolve's tasks is #97 R2-14's rule for every other path.
    Decided by: redline
12. **R2-12 (nit, decline).** Reason: what counts as a finding's own commit is defined once, in `ownCommit` (`workflows/redline-loop.js:596-598`). The three sites (2937, 4053, 4061) only filter the round's commits through it, so a change to that rule is one edit. Every commit `ownCommit` accepts is in `outcomesFor`'s `named`, since it is the reported commit or opens with the id. A shared map would add an argument to `outcomesFor` and change no behaviour.
    Decided by: redline

### Proportionality

- **R2-7.** Likelihood: the mirror case the pull request pins, a deferral with empty words whose own commit lands. A shaper or resolve agent that writes `''` and lists files reaches it on any run. Impact: the session's closing summary lists the item with no mitigation, though a reviewed commit shipped one. The reply, the handoff and the result's `outcome` are right. Cost: one field in a function the pull request rewrote, two sentences of a skill file it changed, and six loop checks. No new dependency or abstraction. In proportion: fix.
- **R2-8.** Likelihood: low. The resolve agent returns an entry for an override that does not defer, which its prompt does not ask for (2053). Impact: the plan approver and the implementer are shown a deferral beside a fix. The approver may bounce. The implementer may build only a guard, which `needCommits` takes for the fix, and the reply then reads `Applied in <sha>`. Cost: one filter and one warning in `resolveWith`, in a file the pull request changed, plus one loop check. It makes the code keep a rule this pull request's own comment states. In proportion: fix.
- **R2-6.** Likelihood: needs the implementer to break both halves of its rule 3 for one mitigation. Impact: one thread says no code changed while the run's warning names the planned files and the commit is pushed with the round. Cost of a change: a second wording for the decided reply, driven by a mention, against the pull request's choice. Decline (Decision 10).
- **R2-10.** Likelihood: needs a reshape and a second resolve each to act against their prompts. Impact: a bounced plan and a stop the person can resume, or a warning that names files a later resolve dropped. Cost of the proposed fix: tasks kept per id across resolves, which changes what `needCommits` and `plannedTask` read (#97, R2-14). Decline (Decision 11).

## Declined

- **R2-6:** the pull request posts a deferral with no commit of its own as shipping nothing on purpose, in the decided form as `No code change.` (its description, "Behaviour that changes on purpose" and "Known gaps"), and code lands under that reply only when the implementer commits the mitigation under a subject that does not open `redline: <id>` and leaves it unreported, against both halves of its rule 3, when the run's warning names the planned files.
- **R2-10:** the replan it needs takes two agents acting against their prompts in one round: a reshape that raises a judgment call for a finding the person already decided by an override (the reshape prompt keeps the person's decision as it is), then a resolve of that unchanged decision that drops the task the first resolve planned; even then the cost is a bounced plan or a resumable stop at approve, never a wrong commit or reply.
- **R2-12:** what counts as a finding's own commit is defined once, in `ownCommit`, and the three sites only filter the round's commits through it, so a change to that rule is one edit; a shared map would add an argument to `outcomesFor` and change no behaviour.

## Deferred

None.

## Standards retrospective (proposed)

Each item is proposed, not applied. The standards approver judges the list, and the implementer applies what it approves in its own commit. Items 1 and 2 finish R2-1 and R2-4, so that commit's message names both.

1. `agent-os/standards/workflow/agents.md`, line 42, the done rule's clause that opens "a new correctness finding the shaper fixes, defers with a mitigation or asks about": **contradicted** (R2-1). Drafted wording, replacing from "a new correctness finding the shaper fixes" through "a deferral that ships nothing buys none, as a decline buys none,": "a new correctness finding the shaper fixes or asks about, or a decline the person overrules to a fix, buys the next round whatever the answer and with or without a commit; a deferral buys it only through a commit of its own, since that is the new code, so a planned mitigation the build left out buys nothing and a deferral that ships nothing buys none, as a decline buys none (#100; this clause kept the rule from before #100 until #103, R2-1),".
2. `agent-os/standards/workflow/agents.md`, line 49, "the words are shown only beside a mitigation the record says ships": **contradicted in part** (R2-4). Drafted wording: "the words are shown, in a stop's drafts and the result's deferred list, only beside a mitigation the record says ships (the plan dial's list of the shaper's dispositions shows its words beside the files it listed, and the files say what is planned; #103, R2-4)".
3. `agent-os/standards/workflow/agents.md`, line 49, after "never a failing reason": **missing** (R2-7). Drafted wording: "; every reader of what shipped reads the record, the session's own summary included: the result's deferred entry carries `ships`, since the closing summary read an empty `mitigation` as nothing shipped until #103, R2-7".
4. `agent-os/standards/workflow/agents.md`, line 49, after "the shaper's `files` was asked for only in a repository with ask rules until #100": **missing** (R2-5). Drafted wording: "; and it is asked for in one meaning in every sentence of a prompt that asks for it: `FILES_ASK` gave an ask an empty list while the same prompt's ask-rules block asked for the paths its change would touch, which `forceAskRules` reads, until #103, R2-5".
5. `agent-os/standards/workflow/agents.md`, line 39, after "and a disposition the person changes away from defer drops the shaper's entry": **missing** (R2-8). Drafted wording: ", and the resolve agent's entry beside it, with a warning: one stayed in the list the plan approver and the implementer were shown, though no longer filed, until #103, R2-8".
6. `agent-os/standards/workflow/agents.md`, line 46, at its end: **missing** (R2-11). Drafted wording: "; and every agent the list reaches is shown the same one, built where the dispositions are (`effectiveDispositions`): R1-2 corrected the plan approver's prompt alone, and the implementer was still shown the shaper's `files` beside an overridden disposition until #103, R2-11".
7. Already in a standard, no edit:
   - R2-2: a case per form of a rule, seen red under a mutation of its clause (`testing/tests.md`, line 28).
   - R2-3: a comment that restates a rule is changed with it (`workflow/agents.md`, line 16).
   - R2-1's other statements: the done rule reworded wherever a reader meets it (`process/docs-gate.md`, line 15).
   - R2-9 is one-off code hygiene that no standard needs to state.
   - R2-6, R2-10 and R2-12 are declined and teach nothing a standard lacks.

   No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A. Nothing changes what a run promises.
- **Run caution.** This round changes `workflows/redline-loop.js` and `skills/redline/SKILL.md` on the plugin's own checkout, which loads in place. A relaunch of this run runs the script it launched with (#81; workflow/replay, line 21), so the new prompt text (`FILES_ASK`), the dropped-entry warning and the result's `ships` take effect in a new launch, not in a later round of this run. No agent file changes, so the handoff carries no agent drift sentence for this round.
- **Not run here.** The guard refuses `node` to the shaper. The reviewer's reproduction (`/tmp/redlinerepro/reviewer-r2-repro.mjs`) was read, not run, and every claim above was traced through the code at `363e445`. No scratch Pest test applies: the repository has no PHP.
- **No file is missing.** Every file cited above exists at `363e445`.

## Standards Applied

- workflow/agents: line 16, a comment that restates a rule changes with it (R2-3, R2-1); line 39, a disposition changed away from defer leaves no entry (R2-8); line 42, the done rule (R2-1); line 46, an agent is shown the list the workflow reads (R2-11); line 49, what shipped is read from the record, the words shown only beside it, and a required list asked for in every prompt (R2-4, R2-5, R2-7).
- workflow/replay: line 21, a relaunch runs the launched script (run caution).
- testing/tests: line 7, a mock answers as the agent would (R2-5's scripted shaper); line 14, a check fails and does not throw (the new prompt readers); line 28, a neighbour and a case per form, seen red under a mutation (R2-2); line 33, red before green.
- process/docs-gate: one Docs entry per touched plugin file; the done rule reworded wherever it is stated (R2-1).
- process/release: no second bump within the pull request.
- prompts/attribution: Redline's label only; no model or vendor name.
