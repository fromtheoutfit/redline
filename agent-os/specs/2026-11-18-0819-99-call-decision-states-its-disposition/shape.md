# #99: a call's decision states its disposition — Shaping Notes

## Scope

Issue #99, deferred from pull request #97 (round 2, finding R2-15), with the comment #100 added. When the person or autopilot decides a judgment call, the resolve agent states what the decision ends in (`fix`, `defer` or `accept`). The workflow checks the statement against what the same resolve returned and reads it where it used to infer a disposition from the resolve agent's deferred entry and from whether a task has files.

Out of scope: #106 (a reshape's change to a decided deferral's task) and #105 (the template's return example). `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/`, `scripts/` and `skills/`, and the Verification Gate's text are not touched.

## Decisions

Given with the brief, not reopened:

1. For a judgment call the person or autopilot decided, the workflow learns the disposition the decision ends in from something stated. The test in `isDeferral` that read whether the entry's mitigation field is filled, or whether the finding has a planned task with files, is removed.
2. An override keeps naming its own disposition and keeps deciding, as #103 R1-11 left it. Only how a call's decision is read changes.
3. A call decided as a fix is demanded by the check whatever entry stands beside it. A stray deferred entry beside a fix opens no issue, on any dial.
4. What is stated is checked against what the run recorded before anything is filed or posted: a stated disposition the record cannot support is never trusted on its own (`workflow/agents`, line 46).
5. The issue's three pins are loop tests: a fix beside a stray filled entry, a fix beside a stray empty entry, and a real "Mitigate" answer. The `strayWorded` test from #103 changes with them.
6. No template change.
7. The version follows the release standard: patch, 0.4.1 to 0.4.2, since a setup rerun writes nothing new.
8. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
9. CI's shellcheck command runs before the first commit and after the last if any `.sh` file changes.
10. No AI attribution anywhere.

Answered during shaping (2026-11-18):

11. **The resolve agent states it.** `RESOLVE_SCHEMA` gains a required list, `decided`, with one entry per call applied (`id`, `disposition`). A label pick, a free-text answer and autopilot's recommendation all go one way: the agent that applies the choice names what it ends in. The shaper's schema, the three shape prompts, the template and the skill are unchanged. The other design is under "Noted follow-up" below.
12. **A disagreement stops three ways and warns one way.** Every check runs in `resolveWith`, right after the resolve returns, so before a draft stop, the plan approver, the build, the filing and the replies. A stop is a stage error at `resolve`, resumable at the resolve label, with nothing posted.
    - `defer` with no deferred entry: stop, as a `defer` override with no entry stops (#97, R2-13). An entry missing a draft field already stops.
    - `fix` with no task with files: stop. Left to the check it fails later, since the plan approver's `planPaths` holds no path for it, and that stop resumes at the build, which cannot replan.
    - `fix` beside a deferred entry: a warning. The entry is dropped before the round's list takes it, as beside an override (#103, R2-8), and the fix is demanded.
    - `accept` beside a task with files: stop. The workflow cannot take a task out of `plan.md`, and the implementer builds the plan as written.
    - `accept` beside a deferred entry: a warning and a drop, as beside a fix.
    - No statement for a call the resolve applied: stop. A schema cannot require one entry per id.
    - Two statements for one id: the first is kept, with a warning, as for a deferred entry (#97, R2-12).
    - No second resolve call is made on a disagreement: the workflow's one automatic second try is the repair pass after a failing check, and a resume is the person's choice (`workflow/agents`, line 36).
13. **The ask sits in the resolve prompt's calls block and nowhere else in the prompt.** Three mixes of old and new can meet a run in flight:
    - An old script with the new agent file (the plugin's own repository, the script pinned, the session reopened): the old prompt does not ask, the old schema does not list `decided`, and nothing reads it, so that run keeps the launch's inference until the next launch. The agent file gains the ask and changes no other rule, so the old inference is fed what it was fed before. Not measured: whether the harness passes or strips a key a schema does not list; the old script reads it in neither case.
    - A new script with the old agent file (a session that re-reads the workflow and not its agent registry): the prompt states the whole ask and the schema requires the list, so the answer does not depend on the agent file the session loaded.
    - A new script with an old run's cache (an ordinary repository whose plugin was updated between a stop and its relaunch): a resolve with a call has a changed prompt, so it never replays; it runs live and states. A resolve with overrides and no call keeps a byte-identical prompt, so an old result can replay with no `decided` key: an absent list is read as empty, and nothing is needed from it, since no call was applied.
    No path falls back to the old inference, and no version check is added.
14. **The check stop #106 names closes as a side effect, and is pinned.** `isDeferral` no longer reads the mitigation field or `plannedFiles`, so a call answered with a deferral is never among the commits the check demands, whatever its words say and whatever a reshape did to its task. One loop case pins it (`emptyDeferral`). `plannedFiles`, `effectiveDispositions`, the reshape prompt and the plan approver's file are not touched: a decided call is still shown to the plan approver and the implementer as the shaper sorted it, with the decision beside it, since what they are shown is #106's subject.

Settled by the design:

15. **What the three words mean.** `fix`: the decision plans a change in this pull request and tracks nothing elsewhere, whatever its size; its commit is demanded. `defer`: it leaves work to an issue, with or without a mitigation now. `accept`: nothing changes. A choice that keeps the behaviour and still ships something ("Accept; add a comment") is a `fix`. The prompt and the agent file say so.
16. **The check's demand for a call comes from the statement alone.** `needCommits` is the fixes of findings with no statement (the shaper's and an override's, deferrals left out) plus the calls stated `fix`. The concat over the resolve's tasks with files goes: it existed to demand a decided call's fix. One corner changes with it: an accepted call that a reshape re-sorts to `fix` is no longer demanded, as #94 R8-6 has a decided call stay the person's whatever a reshape gives it.
17. **A call's decision that names a disposition itself keeps deciding**, as an override's does. No statement is required of it, and none of a call left to the person under a rule.
18. **The third pin cannot be red before the build.** Today's inference already files a filled entry beside a task, so a real "Mitigate" answer ends the same before and after. It is written with the others and seen red under a mutation of the clause it turns on, the statement's `defer` read as no deferral (`testing/tests`, line 28). The other pins are red before the build.

Behaviour that changes on purpose:

- A filled entry beside a call stated `fix` is dropped with a warning: no issue is filed, no draft is raised, and the fix is demanded. Before, it was filed and its fix was not demanded.
- An empty entry beside a task with files, with `defer` stated, is the decision's deferral: filed, with nothing demanded. Before, it was read as a fix with a stray entry.
- A call's `fix` with no task with files, a call's `accept` beside a task with files, and a call's `defer` with no entry each stop the round at resolve. Before, the first was posted `No code change.`, the second was built and posted `Applied in`, and the third was built with no issue filed.
- An accepted call that a reshape re-sorts to `fix` is not demanded.

## What `strayWorded` pins after

Before, it pinned that a filled field decides: an entry worded `none` beside a task was filed. After, it keeps its record and its outcome and changes its reason: with `defer` stated, an entry worded `none` is the decision's deferral, filed and posted as applied. Four cases cover both statements over both entries, so neither the words nor the emptiness of the field decides anything:

| Entry | `fix` stated | `defer` stated |
|---|---|---|
| Filled | `strayFilled`: dropped, the fix demanded, nothing filed (pin 1) | `strayWorded`, and the plain "Mitigate" answer (pin 3): filed |
| Empty | `strayResolve`: dropped, the fix demanded, nothing filed (pin 2) | `emptyDeferral`: filed, nothing demanded (decision 14) |

## Noted follow-up: the shaper states a disposition on each option

Not built, and no issue is opened for it.

The other design has the shaper state, on each option of a judgment call, the disposition that option ends in, and name the recommended option by its label. A picked option, and autopilot's pick, then carry a disposition that was stated before anyone decided, and the resolve agent states one only for a free-text answer.

What it adds is the one case this spec does not catch: the resolve agent misreading a picked option whole. A "Mitigate" answer planned as a full fix, with no entry and `fix` stated, agrees with itself, since the statement and the record are one agent's output, so the checks of decision 12 pass. With the option's own disposition to compare against, the record would hold no draft for an option that says `defer`, and the round would stop at resolve.

It belongs with the template change #105 needs: the option's disposition and the recommended label would be fields of the judgment call in point 10's return example, which the shaper copies, so doing it without the template widens the retry #105 describes, and doing it with the template is a new section marker, a minor bump and a setup rerun in every repository. It would also change every shape prompt, and the skill would record a pick's label exactly as given.

## For you to add to #106

A drafted comment; posting it is yours.

> #99 changed what `isDeferral` reads for a call the person or autopilot decided: the disposition the resolve agent states for the decision, checked against that resolve's tasks and entries when it returns, and no longer the entry's mitigation field or whether the finding has a planned task with files. So `isDeferral` no longer reads the resolve's tasks, and the last path in this issue's first paragraph is closed: a call answered with a deferral is never among the commits the check demands, whatever its words say and whatever a reshape did to its task (pinned in `tests/loop-test.mjs`). What is left is the list itself: `plannedFiles` still reads a decided finding's task from the resolve agent's `tasks` alone, so after a reshape changes or removes that task, the plan approver's next pass, the implementer, a draft raised after it and the planned-but-unbuilt warning are shown the files as first planned, and a plan approver that holds the list to the plan can still bounce to `maxPlanAdjustments`. In the proposed fix, "a call whose resolve entry stands" now reads "a call whose stated disposition is `defer`", and `isDeferral` no longer follows `plannedFiles`.

## Left alone

- **A relaunch after an update can rerun steps.** On a repository that is not the plugin's own, nothing pins the script: an installed update is loaded on a restart or a plugin reload, and a relaunch after one runs the new script against the old run's cache. Where a changed prompt belongs to a step that already ran (here, a resolve with a call), that step and every step after it run again. This holds for every release that changes a prompt; #81's read of the highest posted round at Finish is the backstop. This spec neither closes nor widens it.
- **`docs/running.md`, "Hand-off and relaunch"** says the installed workflow "never changes during a run", which an update between a stop and its relaunch makes untrue. Not reworded here.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people": a person's answer to a call is read from what the run states it ends in, and a statement the run's own record contradicts stops the round before anything is built or posted. "Honest about its reach": the README's Known limits says what the checks do not catch.

## Standards Applied

- workflow/agents — line 6, the prompt holds the round's inputs and the agent file the role; line 9, the four endings and who decides a call; line 16, a rule a prompt states is changed in the agent file and in every comment that restates it; line 36, a resume is the person's choice; line 37, the workflow checks a result before it acts on it, and an unusable one is a stage error naming the agent to rerun; line 39, a decided finding is a deferral only when its decision made it one (the clause on a call's decision, which this spec replaces); line 46, a fact an agent states is checked against the run's record; line 49, a field the record is read from is required in its schema and asked for in the prompt.
- workflow/replay — line 6, decisions enter after the prompt they answer; line 19, a resume changes one prompt; line 21, a relaunch runs the launch's script and replay follows the prompt sequence.
- testing/tests — line 7, a mock answers as the real agent would and returns every required key; line 13, a message worded two ways is pinned in each; line 14, a check fails and does not throw; line 15, a stage error is pinned by its `resumeFrom` label; line 28, a case per form, each seen red; line 33, red before green.
- process/docs-gate — one entry per touched plugin file; a cost the spec records is named in the README's Known limits.
- process/release — patch bump, both manifests.
- process/standards-retrospective — the retrospective is put to the person before any edit.
- process/internal-notes — nothing copied in from the private repository.
- prompts/attribution — no model or vendor name anywhere.
