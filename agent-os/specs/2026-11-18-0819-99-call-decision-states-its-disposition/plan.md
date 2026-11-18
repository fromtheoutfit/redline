# #99: a call's decision states its disposition

## Context

Issue #99 was deferred from pull request #97 (round 2, finding R2-15); #100 added a comment to it.

When a person or autopilot decides a judgment call, the decision carries `choice`, `notes`, `date` and `decidedBy`, and no disposition. The workflow infers one in `isDeferral` (`workflows/redline-loop.js:3820`):

```js
return resolveDeferred.has(d.id) && (mitigationFilled(d) || plannedFiles(d.id).length === 0)
```

A fix beside a stray filled entry therefore has the shape of a real "Mitigate" answer. Since #100 it is filed as an issue, with no question on autopilot, and if its task is never built it passes the check with a warning, since no commit is demanded of a deferral. The check's demand for a call (`needCommits`, 3981) is inferred the same way, from whether a resolve task has files.

After this spec the resolve agent states what each call's decision ends in (`fix`, `defer` or `accept`), the workflow checks the statement against what the same resolve returned, and reads it in place of the inference.

## Decisions

Given with the brief, not reopened:

1. A call's disposition is learned from something stated. The emptiness and task-files test in `isDeferral` is removed.
2. An override keeps naming its own disposition and keeps deciding (#103, R1-11). Only a call's decision changes.
3. A call decided as a fix is demanded by the check whatever entry stands beside it. A stray entry beside a fix opens no issue, on any dial.
4. What is stated is checked against the round's record before anything is filed or posted (`workflow/agents`, line 46).
5. Three loop pins: a fix beside a stray filled entry, a fix beside a stray empty entry, a real "Mitigate" answer. `strayWorded` changes with them.
6. No template change. #105 is not part of this spec.
7. Patch bump: 0.4.1 to 0.4.2.
8. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
9. CI's shellcheck command runs before the first commit and after the last if any `.sh` file changes. None is planned to.
10. No AI attribution anywhere.

Answered during shaping (2026-11-18):

11. **a. The resolve agent states it.** `RESOLVE_SCHEMA` gains a required list, `decided: [{id, disposition}]`, one entry per call applied. A label pick, free text and autopilot go one way: `autopilotDecision` is unchanged, and the agent names what the recommendation ends in. The shaper's schema, the three shape prompts, the template and the skill are unchanged. Design B (the shaper states a disposition on each option) is recorded in `shape.md` as a noted follow-up, with the one case A does not catch, the resolve agent misreading a picked option whole, and the note says it belongs with the template change #105 needs. No issue is opened or drafted for it.
12. **b. Stop on three, warn on one.** All checks run in `resolveWith`, right after the resolve returns. A stop is a stage error at `resolve`, resumable at the resolve label, with nothing posted.

    | Stated, against the same resolve's record | Result | Posted |
    |---|---|---|
    | `defer`, no deferred entry (or one missing a draft field, which already stops) | Stop | Nothing |
    | `fix`, no task with files | Stop | Nothing |
    | `fix` beside a deferred entry | Warning; the entry is dropped before the round's list takes it; the fix is demanded | `<notes> Applied in <sha>. · decided by: @<login>`; nothing filed |
    | `accept` beside a task with files | Stop | Nothing |
    | `accept` beside a deferred entry | Warning; dropped | `<notes> No code change.` |
    | No statement for a call the resolve applied | Stop | Nothing |
    | Two statements for one id | The first is kept, with a warning | |

    `accept` beside a task with no files, and `defer` beside a drafted entry with or without a task, are the normal shapes.
13. **c. The ask sits in the resolve prompt's calls block only.** The prompt states the whole ask and the schema requires the list, so the answer does not depend on which agent file the session loaded. A resolve with overrides and no call keeps a byte-identical prompt, so an old result can replay with no `decided` key: an absent list is read as empty. The agent file gains the ask and changes no other rule, so an old script reading a new agent's output behaves as it did. No fallback to the old inference, and no version check.
14. **d. The #106 check stop closes as a side effect, pinned.** `isDeferral` no longer reads the mitigation field or `plannedFiles`, so a call answered with a deferral is never demanded, whatever its words say and whatever a reshape did to its task. One loop case pins it. `shape.md` carries a drafted comment for #106, for the person to post. `plannedFiles`, `effectiveDispositions`, the reshape prompt and the plan approver's file are not touched: what the plan approver and the implementer are shown for a decided call is #106's subject.

Settled by the design, recorded so they are visible at approval:

15. **What the three words mean, in the prompt and the agent file.** `fix`: the decision plans a change in this pull request and tracks nothing elsewhere, whatever its size; its commit is demanded. `defer`: it leaves work to an issue, with or without a mitigation. `accept`: nothing changes. A choice that keeps the behaviour and still ships something ("Accept; add a comment") is a `fix`.
16. **The check's demand for a call comes from the statement alone.** `needCommits` becomes the fixes of findings with no statement (the shaper's and an override's, deferrals left out) plus the calls stated `fix`. The concat over `resolvedTasks` with files goes, since it existed to demand a decided call's fix. One corner changes with it: an accepted call that a reshape re-sorts to `fix` is no longer demanded, as #94 R8-6 has a decided call stay the person's whatever a reshape gives it.
17. **A call's decision that names a disposition itself keeps deciding**, as an override's does (decision 2). No statement is required of it, and none is required of a call left to the person under a rule.
18. **The third pin cannot be red before the build.** Today's inference already files a filled entry beside a task, so a real "Mitigate" answer ends the same before and after. It is written with the others and seen red under a mutation of the clause it turns on (the statement's `defer` read as not a deferral), which `testing/tests` line 28 names as a red run. The other pins are red before the build.

## What `strayWorded` pins after

Today it pins that a filled field decides: an entry worded `none` beside a task is filed. After, it keeps its record and its outcome and changes its reason: with `defer` stated, an entry worded `none` is the decision's deferral, filed and posted `Applied in … Deferred to #301`. Its twin is the first pin: a filled entry beside the same task with `fix` stated files nothing. Together with the empty-entry pair they cover both statements over both entries, so neither the words nor the emptiness of the field decides anything:

| Entry | `fix` stated | `defer` stated |
|---|---|---|
| Filled | `strayFilled`: dropped, fix demanded, nothing filed (pin 1) | `strayWorded`, and the plain "Mitigate" (pin 3): filed |
| Empty | `strayResolve`: dropped, fix demanded, nothing filed (pin 2) | `emptyDeferral`: filed, nothing demanded (decision 14) |

## Tasks

The person makes every commit. Tasks 2 and 3 share two files, so each is built, then handed over for its commit before the next starts.

### Task 1: Save spec documentation

Create `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/` with:

- `plan.md`: this plan, with one Docs entry per touched plugin file (below).
- `shape.md`: scope, decisions 1 to 18, the noted follow-up (design B, decision 11), "For you to add to #106" (the drafted comment below), what is left alone (the rerun exposure after an update between a stop and its relaunch, and `docs/running.md:148`'s "never changes during a run"), context, standards applied.
- `standards.md`: the full text of the standards listed below.
- `references.md`: the code and specs studied (below).
- No visuals.

The drafted comment for #106:

> #99 changed what `isDeferral` reads for a call the person or autopilot decided: the disposition the resolve agent states for the decision, checked against that resolve's tasks and entries when it returns, and no longer the entry's mitigation field or whether the finding has a planned task with files. So `isDeferral` no longer reads the resolve's tasks, and the last path in this issue's first paragraph is closed: a call answered with a deferral is never among the commits the check demands, whatever its words say and whatever a reshape did to its task (pinned in `tests/loop-test.mjs`). What is left is the list itself: `plannedFiles` still reads a decided finding's task from the resolve agent's `tasks` alone, so after a reshape changes or removes that task, the plan approver's next pass, the implementer, a draft raised after it and the planned-but-unbuilt warning are shown the files as first planned, and a plan approver that holds the list to the plan can still bounce to `maxPlanAdjustments`. In the proposed fix, "a call whose resolve entry stands" now reads "a call whose stated disposition is `defer`", and `isDeferral` no longer follows `plannedFiles`.

### Task 2: The statement, asked for and read

`tests/loop-test.mjs` first, red, then the rest.

**`tests/loop-test.mjs`**

- The scripted resolve agent (249) returns `decided`, one entry per call id read from the prompt's calls block. Default, what a real agent states for what it returned: `defer` beside its own deferred entry, `accept` for a call in `scenario.acceptedCalls`, `fix` otherwise; none for a decision carrying `rule`. `scenario.resolveDecided[id]` scripts one, `scenario.resolveUnstated` leaves ids out, `scenario.resolveDecidedTwice` repeats one, `scenario.resolveNoDecided` leaves the key out, as a result recorded before #99.
- `strayFilled` (pin 1), autopilot: a filled entry (`a guard`) and a task, `fix` stated, the commit built. Done; no `file deferred r1`; `res.deferred` empty; the reply has ` Applied in ` and no `Deferred to`; round 2 reviews the fix diff; the warning; neither the plan approver's nor the implementer's prompt holds the entry. Red today: filed.
- `strayFilledGuided`: the same on `guided` with the call answered and no draft answer. Done, with no stop for a draft. Red today: stops for the draft.
- `strayFilledUnbuilt`: the same, nothing built. Stops at check after its repair (`no commit names R1-1`), nothing filed. Red today: passes with a warning.
- `strayResolve` (pin 2, 3163) and `strayRaised` (3231) script `fix`; `strayResolve` gains the warning and the two prompts without the entry. Red today on both additions.
- `strayWorded` (3169) scripts `defer`; its check is renamed for what is stated.
- `mitigated` (pin 3): a plain "Mitigate" answer, a filled entry, a task, its commit. Filed; `The author ships a guard now. Applied in 1bbbbbb (redline: R1-1 fix). Deferred to #301. · decided by: @author`. Mutation run, decision 18.
- `emptyDeferral` (decision 14): a call answered with a deferral, an empty entry and a task with files, `defer` stated, `planBounce: 1`, nothing built. Done; filed; `Defer it; nothing ships now. No code change. Deferred to #301. · decided by: @author`; the planned-but-unbuilt warning. Red today: stops at check.
- `acceptBesideEntry`: `accept` stated beside an entry. Done; nothing filed; `No code change.`; the warning.
- `unstated`: stops at resolve, `resumeFrom` `resolve r1`, no plan approver call. Red today: runs on.
- `statedTwice`: the first is kept, with the warning.
- `acceptedResorted` (decision 16): an accepted call, a bounced plan, `reshapeFix`, nothing built. Done, `No code change.` Red today: stops at check.
- `chosen` (3106) rerun with `resolveNoDecided`: the same outcome with no key (decision 13).
- Prompt pins: a resolve prompt with a call holds the ask's key phrase and `return a deferred entry for a call only when its decision defers the finding`; an overrides-only resolve prompt holds neither. This replaces the check at 3173.
- `agents/redline-resolve.md` holds the ask's key phrase.
- The source check at 2868 becomes: the workflow holds neither `mitigationFilled` nor `resolveDeferred`.

**`workflows/redline-loop.js`**

- `RESOLVE_SCHEMA` (875): `decided`, required; items `{id, disposition}` with the enum `fix`, `defer`, `accept`.
- `resolvePrompt` (2053): the R2-15 sentence becomes the ask, in the calls block only. It gives the three meanings (decision 15), says the workflow reads the disposition from `decided` and checks it against the entry and the task, and keeps the entry rule. One more sentence, only when a call's decision carries `rule`: that call has no entry in `decided`.
- `resolveWith` (3718), after the `unresolved` block: read `out.decided || []` through `firstPerId` (810), warn on a repeat, stop on a call with no statement (decision 17 says which calls are asked), and keep the round's statements in a `stated` map beside `resolvedTasks`. The drop that exists for an override (`strayOverride`, 3765) also takes an entry beside a call stated `fix` or `accept`, with its own warning; the override's warning keeps its words. The drop stays before the draft check, as #103 R2-8 placed it.
- `isDeferral` (3820): a decision that names a disposition decides, as today; otherwise `stated[d.id] === 'defer'`.
- `needCommits` (3981): decision 16.
- Removed: `mitigationFilled` (787) with its comment, `resolveDeferred` (3717), and `accepted` (3969), which only the removed concat reads.
- Comments that restate the old rule change with it: `DEFERRED_SCHEMA` (766), `plannedFiles` (3800), `isDeferral` (3810), the reshape's entry drop (3896), `needCommits` (3970).

**`agents/redline-resolve.md`**: step 3 gains the paragraph that asks for `decided`, with the three meanings and what the workflow does with a disagreement; the return block gains the key. No other sentence changes.

Commit: `workflows/redline-loop.js`, `agents/redline-resolve.md`, `tests/loop-test.mjs`.

### Task 3: The statement, checked against the record

`tests/loop-test.mjs` first, red, then `resolveWith`.

- `deferNoEntry`: `defer` stated, no entry. Stops at resolve: `the resolve agent stated defer for R1-1 and returned no deferred entry for it; a deferred item always carries a drafted issue`.
- `fixNoFiles`: `fix` stated, the task with no files. Stops: `the resolve agent stated fix for R1-1 and planned no task with files for it; a fix names the files it changes`.
- `acceptWithFiles`: `accept` stated, a task with files. Stops: `the resolve agent stated accept for R1-1 and planned a task with files for it (app/x.php); an accepted finding changes nothing`.
- Each is pinned by its text, its `resumeFrom` label and the absence of a plan approver call, and is red today, where the round runs on. Their neighbours exist: `chosenBare` (3217, `defer` with an entry and no task), an accepted call with no files, a fix with files.

`resolveWith` reads the files from the same resolve's `out.tasks`, after the drop and the draft check. The override's two stops (`undrafted`, `unentered`) keep their words.

Commit: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

### Task 4: Docs

- `docs/running.md`, "Deferred items": a bullet, "A deferral you chose", saying that the resolve agent states what a call's answer ends in, that the workflow reads only that, what stops the round at resolve and how it is resumed, and the two warnings as the run words them.
- `README.md`, "Known limits": an entry saying that what a call's answer ends in is stated by the agent that applies it; a statement its own tasks and entries contradict stops the round or drops the entry, and an answer misapplied whole agrees with itself and is not caught, so the reply in the thread is where it shows.

Commit: `docs/running.md`, `README.md`.

### Task 5: Version

`0.4.2` in `.claude-plugin/plugin.json` and in the entry of `.claude-plugin/marketplace.json`.

Commit: the two manifests.

### Task 6: Verification Gate

`.claude/redline/checks.sh --baseline` until it exits 0, then:

- **Docs**, one entry per touched plugin file:
  - `workflows/redline-loop.js`: `docs/running.md`, "Deferred items", and `README.md`, "Known limits"; Task 4's commit.
  - `agents/redline-resolve.md`: `docs/running.md`, "Deferred items"; Task 4's commit.
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: no reader-facing change, a version string; the `CHANGELOG.md` entry is the person's step at tag time.
  - No new config key, subcommand, allow rule or exit code. No file under `templates/`, `scripts/`, `skills/` or `hooks/` changes.
- **Version**: the setup test's last cases prove the two strings agree.
- **Standards retrospective**: listed mechanically from `shape.md`'s decisions, the As built deviations and every red run that taught something, then put to the person before any edit. Expected candidates: `workflow/agents.md` line 39's clause on a call's decision, which this spec contradicts; line 46, a statement checked against a record from the same agent's output is a consistency check; `workflow/replay.md`, an ask added to a prompt sits in the block only the calls it concerns carry; `testing/tests.md` line 7, the scripted agent states what a real one would for what it returned. Approved edits land in their own commit.
- **Spec folder**: `plan.md` gains "As built", and every deviation goes under Decisions in `shape.md`.

## Standards applied

`workflow/agents` (lines 6, 9, 16, 36, 37, 39, 46, 49), `workflow/replay` (lines 6, 19, 21), `testing/tests` (lines 7, 13, 14, 15, 28, 33), `process/docs-gate`, `process/release`, `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`. No script changes, so `scripts/bash-conventions` and `scripts/guard` do not apply.

## References

- `workflows/redline-loop.js`: `DEFERRED_SCHEMA` and `mitigationFilled` (766-787), `firstPerId` (803), `RESOLVE_SCHEMA` (875), `autopilotDecision` (1371), `resolvePrompt` (2022), `outcomesFor` (2923), `revise()` with `resolveWith` (3718), `effectiveDispositions` (3795), `plannedFiles` (3809), `isDeferral` (3820), the reshape loop (3861), `needCommits` (3981).
- `agents/redline-resolve.md`, step 3 and the return block.
- `tests/loop-test.mjs`: the scripted resolve agent (249), the filing section (3106-3234).
- Specs: `2026-11-16-1358-97-review-round-2` (R2-15, the finding and its drafted issue), `2026-11-17-1535-100-deferral-ships-from-the-record` (decisions 13 and 14), `2026-11-17-1643-103-review-round-1` and `-2` (R1-11, R2-8), `-3` (R3-4, now #106), `2026-11-12-1852-81-pin-relaunch-script-finish-rule` (the probes).
- Product: `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people" and "Honest about its reach".

## Verification

- Each new loop case is run red before its fix, with `node tests/loop-test.mjs`, and the red output is kept for the hand-over line. Pin 3 and `strayWorded` are run red by mutation, and so is each new clause of `resolveWith`, `isDeferral` and `needCommits`, one mutation a clause.
- `node tests/loop-test.mjs` prints `N checks passed, 0 failed` after each task.
- `.claude/redline/checks.sh --baseline` exits 0 at the end, all nine commands.
- `claude plugin validate .` passes with the new version.
- No `.sh` file is planned to change. If one does, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh` runs before the first commit and after the last.
- Nothing is staged or committed by the build. Each hand-over names the exact files for the commit and the harness that went red then green.
