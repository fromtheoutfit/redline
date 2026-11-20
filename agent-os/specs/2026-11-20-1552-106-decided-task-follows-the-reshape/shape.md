# #106: a decided finding's task follows the reshape — Shaping Notes

## Scope

Issue #106, deferred from pull request #103 (round 3, finding R3-4), as its Nov 18 comment leaves it: #99 closed the `isDeferral` path, and what is left is the list `plannedFiles` reads. For a finding the person or autopilot decided, the workflow keeps one list, the files of its task as last planned: set by the resolve that applied the decision, replaced by each reshape's `files`. Every reader reads that list, a decided fix or accept is held to it after each reshape, and the approve stop at the cap names the decided tasks the reshapes changed.

Out of scope: #104 (a draft's version ignores `ships` and `files`), #105 (the template's return example), #109 (a dropped stray entry stays in `shape.md`). Not touched: everything under `templates/`, the unattended section, `scripts/redline-gh.sh`, `tests/gh-test.sh`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `skills/`, `agents/redline-plan-approver.md`, `agents/redline-resolve.md`, the Verification Gate's text.

## Decisions

Given with the brief, not reopened:

1. The problem is the one the comment leaves: `plannedFiles` in `workflows/redline-loop.js` reads the task of a decided finding from the resolve agent's tasks alone (`resolvedTasks`), so after a reshape changes or removes that task, everything shown that list is shown the files as first planned.
2. It is settled by class, not by reader. The reader list below names every read of `plannedFiles`, `resolvedTasks` and `taskFilesOf` and every text an agent or the person is shown from them. A reader the issue does not name is in scope. The reason is on #75 (the Nov 20 comment): #112 spent three rounds fixing one reader at a time.
3. The issue's loop case is seen red first, and a reshape listing the same files leaves the list unchanged. Each reader that changes has a case.
4. The replay standard holds: every prompt of a run with no decided finding stays byte-identical, a new ask sits only in the block the calls it concerns carry, and a paused run relaunched after the update still replays.
5. #104, #105 and #109 are not fixed here. Where this change touches what one describes, it is said below and left.
6. No template change. The chosen design needs none.
7. Patch bump: 0.4.3 to 0.4.4.
8. CI's shellcheck command runs before the first commit and after the last if any `.sh` file changes. None is planned to.
9. No AI attribution anywhere.

Answered during shaping (2026-11-20):

10. **a. Follow the reshape.** Of the issue's two designs, the workflow takes a reshape's `files` for a decided finding. The other design, a reshape told that a decided finding's task keeps its files, was not chosen: a reshape is the only agent that can correct a task after a bounce, so any adjustment that changes a decided task's files (a Docs entry adding `README.md`, a missing test file) would end at a stop, and a decided fix is not frozen today, so freezing deferrals alone would keep two rules.

    The reshape prompt gains one block, only in a round with a decided finding, saying what `files` means for the ids it names. Without it the list is ambiguous for a decided call: every shape prompt asks, "for an ask, the paths its recommended change would touch", and a reshape that still returns a decided call as `ask` would list the recommended option's paths, not the task the answer planned. `agents/redline-shaper.md` gains the same sentence and changes no other rule. A warning names every change a reshape makes to a decided finding's files.

    What the workflow trusts and what it drops: it drops a decided finding's disposition and deferred entry from a reshape on purpose (#94, R8-6; #97, R3-6), since they say what was decided. It takes the `files`, which say how the plan carries the decision. It already reads a reshape's `files` for a decided finding in two places: `forceAskRules`, for every finding, and `effectiveDispositions`, for a decided fix.
11. **b. Every decided finding**, not deferrals only: one list, read one way from the first plan approver pass on. This replaces the scoping #103's R2-11 set (`agent-os/specs/2026-11-17-1643-103-review-round-2/shape.md`, Decision 9: "Every other finding keeps the shaper's list, byte for byte"). The reason: that line was set for a nit fix, which carried R1-2's condition over unchanged so the approver's view stayed as it was, and no spec decided against showing a decided fix its task's files.

    What a decided fix was shown until now: on the first pass and in the implementer's prompt, the shaper's list from before the decision (`[]` for a decline overruled to a fix, the old mitigation's files for a deferral changed to a fix, the recommended option's paths for an answered call); after a reshape, the reshape's own list. What the check demands of it is unchanged: a commit naming the finding, whatever its files.
12. **c. `maxPlanAdjustments` stays the only bound.** The workflow is told a bounce as `{task, problem, change}`: a task number in `plan.md` and free text, with no finding id, and a reshape may renumber. So it cannot tell that a bounce concerns a decided finding, or that its reason repeats. After this change a second bounce on the same task is a real disagreement between the approver and the shaper, no longer the stale list. The approve stop keeps its message and its label, and its `detail` gains `reshaped`, only when not empty: `[{id, decidedBy, files: [the list as the resolve planned it, then after each reshape that changed it]}]`. An earlier stop that asks the person to restate the decision was not chosen: it needs the approver to name findings, a new stop in the skill, and a decision taken at a stop that sits after the resolve that applies it, which `workflow/replay` rules out ("a stop takes only a decision whose prompt comes after it").
13. **d1. A decision is held to its task after each reshape.** When a resolve returns, a decided fix has a task with files and a decided accept has none, or the round stops at resolve (#99; #108, R1-5). Nothing repeated that after a reshape. Now, once a reshape's list is taken, a decided fix with no files, or a decided accept with files, stops the round at that reshape: stage `shape`, resumable at the reshape's label, where a rerun replans. Without it a fix with no task reaches the check, fails for no commit, and stops after one repair at a point whose resume starts at the build and cannot replan; and an accepted finding is built against the decision. A decided deferral is never held: a mitigation is optional and no commit is demanded of one (#100). The resumed reshape is told to correct the task the error names and keep the decided entries, as the resolve's rerun is (#108, R3-4), in place of the shaper's line that says to rewrite the four files from scratch. This is a new check, not a stale reader, and goes beyond the issue's words.
14. **d2. The ask-rules neighbour is recorded and drafted, not built.** See "For you to open". #49 is closed, so a note for it would be tracked nowhere.

Settled by the design:

15. **A finding left to the person under a rule is not tracked.** `tracked` is decided and not in `record.forced`. Such a finding keeps today's reading everywhere: it is not named in the reshape block, its list is not replaced, and it is not held. Its task has no files by rule. One edge changes: a defer override that a reshape newly puts under a rule was shown the resolve's list and is now shown the reshape's own, as every other finding left to the person is.
16. **A reshape that lists the same files changes nothing.** The lists are compared as sets. When the set is equal the stored list is kept as it was, so the prompts that follow are byte-identical and no warning is raised.
17. **A second resolve sets only the ids it applied.** A reshape that raises a call runs a resolve for that call alone (#97, R2-14). An earlier decided finding keeps the list its own resolve or a later reshape gave it. `resolvedTasks` is removed, and the per-id list replaces it.
18. **One reader has no case of its own.** A round's draft stop after a reshape reads the new list, but a decided deferral's draft is always answered before a reshape can run (the stop after the resolve that drafted it holds the round until it is), and an answered draft is not raised again while its issue text is unchanged (#104). So no round stop shows the changed files today. The case for that reader is the end-of-run stop, which goes through the same `draftView` and the same list. See the #104 note.
19. **The commit-with-no-files warning is reworded where a reshape emptied the list.** "the resolve agent planned no task with files for it" is false when the resolve did plan one. Both wordings are pinned (`testing/tests`: a message worded two ways by a condition is pinned in each).
20. **Existing expectations that move are listed.** The reshape mock answers the new block, as a real reshape would. Any existing check whose expected value changes is named in `plan.md`'s As built with the reason.

## The reader list

Line numbers are `workflows/redline-loop.js` at `6d769f5`.

### Where the three names are read

| Name | Site | What it reads |
|---|---|---|
| `taskFilesOf` (483) | `taskFiles` in `resolveWith` (3900) | that resolve's own `out.tasks`, for the resolve-time stops (3906, 3910, 3917, 3921) |
| `taskFilesOf` | `plannedFiles` (3949) | `resolvedTasks` |
| `resolvedTasks` (3765) | written in `resolveWith` (3925); read in `plannedFiles` (3949) and nowhere else | every resolve's tasks of the round |
| `plannedFiles` (3949) | `effectiveDispositions` (3937) | a decided finding whose shown disposition is `defer` |
| `plannedFiles` | `draftStop` (3983), through `draftsOf` | the round's deferrals, at a stop after a resolve or a reshape |
| `plannedFiles` | `roundDeferrals` (4209), through `draftsOf` | the round's deferrals, after the check |
| `plannedFiles` | the warning loop (4224) | the round's deferrals |

### What is shown from them

"Tracked" below is a decided finding not left to the person under a rule.

| Reader | Shown to | Today | After |
|---|---|---|---|
| `effectiveDispositions` → `planPrompt`, the findings list (4007) | the plan approver, every pass | A decided finding shown as `defer`: the resolve's tasks, before and after a reshape. Any other decided finding: the shaper's list from before the decision on the first pass, the reshape's own list after one. | The list, for every tracked finding, on every pass. |
| `finalDispositions` → `ctx.shaped.findings` → `implementPrompt` (4142, 4158) | the implementer and the repair pass | The same as the plan approver's last pass. | The same list. |
| `draftStop` → `handoffResult` → `draftView` (3459): `files`, `ships` (files not empty), and the mitigation's words when it ships | the person, at a round's stop after a resolve or a reshape | The resolve's tasks. | The list. No round stop can show a changed one today (decision 18). |
| `roundDeferrals` → `record.held` (4239) → `heldStop` → `draftView`: `files` | the person, at the end-of-run stop | The resolve's tasks. | The list. |
| The planned-but-unbuilt warning (4226) | the result's `warnings` | Names the resolve's files, a file the plan dropped included. | Names the list; absent when a reshape emptied it. |
| The commit-with-no-files warning (4231) | the result's `warnings` | Fires on the resolve's tasks; says "the resolve agent planned no task with files for it". | Fires on the list; says the reshape left the task with no files when that is what happened. |
| `taskFiles` in `resolveWith` | the resolve-time stops | That resolve's own tasks; not stale at its time. | Unchanged. The same rule runs after each reshape, on the list (decision 13). |
| The approve stop at the cap (4023) | the person, through the skill's report of `detail` | The approver's adjustments and notes. | Also `reshaped`, when a reshape changed a decided finding's task (decision 12). |

### The same objects, no file read

`outcomesFor` (2975) reads each finding's disposition, owner, recommendation and reason. `needCommits` (4136) reads dispositions and `stated`. `deferredEntry` (3444) and `fileDeferred` (3407) read the draft. `isDeferral` (3960) reads the decision and `stated`. The draft's version in `draftsOf` (3704) counts the issue text only, which is #104.

### Outside the three names

- `forceAskRules` (3275) reads `shaped.findings[].files`, the shaper's or a reshape's list, for every finding. It never reads a resolve's tasks. See "For you to open".
- `record.dispositions` (3661), in the result's rounds, is the shaper's list as returned, not a reading of a task.
- The plan dial's `plan` list (4850) is shown before any decision.
- `skills/redline/SKILL.md`, "The round's deferred drafts", presents `ships` and `files` from `draftView`. Its text is unchanged.

## The three issues this change sits beside

- **#104, widened and left.** A draft's version counts the issue text, so a change to what its stop shows (`ships`, `files`, the mitigation's words) does not raise an answered draft again. Until now a reshape could not change what a decided deferral's stop shows, since the list never followed it. After this change it can: the person answers a draft shown with `ships: true` and `app/x.php`, a reshape removes the mitigation, and no stop says so. The warning of decision 10 and the reply (`No code change.`) are the record. #104's proposed fix, a second fingerprint over what the stop shows, covers this case as written. Not fixed here.
- **#105, not widened.** The return example in point 10 of the unattended section shows no `files`. This change adds no key to the shaper's schema. It adds a rule about what `files` means on a reshape for a decided finding, stated in the reshape prompt and in `agents/redline-shaper.md`, which the template does not state either. A shaper that copies the template's example meets the retry #105 describes, as before.
- **#109, not touched.** `resolveWith`'s drop of a stray entry is unchanged. The neighbouring drop, a reshape's entry for a decided finding (the `restated` warning), is unchanged too, and that entry stays in the round's `shape.md` as the reshape wrote it.

## For you to open

A drafted issue; opening it is yours.

**Title:** Apply the paths ask rules to the task a resolve plans for a decided finding

**What was found.** A `paths` ask rule in `.claude/redline.json` names globs no Redline role may write under, and a finding whose task would touch one is left to the person. The workflow applies the rules in `forceAskRules` (`workflows/redline-loop.js`), which runs on what the shaper returns, after the shape and after each reshape, and matches the finding's own file and the `files` the shaper listed for it. It never runs on the tasks the resolve agent plans. When the person or autopilot decides a finding (a disposition override, or an answer to a judgment call), the resolve agent plans its task, and that task's files can differ from the list the shaper gave before the decision: a decline overruled to a fix was listed with no files, and a call was listed with the paths of the shaper's recommended option. So a decided finding whose planned task writes under a `paths` rule is not left to the person by the workflow. Two other checks catch it today. The plan approver's rule 5 (`agents/redline-plan-approver.md`) bounces a task that writes under a rule and sends the finding back as a judgment call; that is an agent's judgement. The guard refuses the write; that is certain but late, since the implementer reports blocked and the round stops at implement. Since #106 a reshape that follows the approver's bounce lists the task's files for a decided finding, so the workflow leaves it to the person at that reshape.

**Why it was not fixed in #106.** #106 settled which list holds a decided finding's task files after a reshape. Applying the rules when the resolve returns needs a decision #106 did not take: what a decision becomes when the task planned for it falls under a rule. A rule known before the resolve travels with the decision into the resolve prompt (`rule` on the decision), and the resolve agent writes the finding as left to the person. A hit found after the resolve has no such path: the decision is already applied in `plan.md` and `shape.md`, a rerun of the resolve cannot plan the fix without that path, and a stop that asks the person nothing relaunches into itself.

**Proposed fix: the options, not a pick.**

1. Stop at resolve on a hit, and tell the rerun in its resume line that the finding is left to the person under the rule, the rule joining its decision at the resume point so every earlier prompt replays.
2. No stop: record the finding as left to the person when the resolve returns, as the reshape path does, and tell the plan approver and the implementer through its decision, with the task the resolve wrote still in `plan.md` for the approver to bounce.
3. Leave the workflow as it is, and say in the README's Known limits that the paths rules reach a decided finding's task through the plan approver and the guard.

Whichever is chosen is pinned by a loop case: a decline overruled to a fix whose resolve plans a file under a `paths` rule, with what the plan approver is shown and where the round ends, and its neighbour, the same override planned outside the rule.

## Left alone

- **A relaunch after an update can rerun steps.** On a repository that is not the plugin's own, nothing pins the script. A run paused in a round with a tracked decided finding and relaunched after the update replays through that round's resolve, whose prompt is unchanged, and reruns from the first prompt that differs: the plan approver's, when a decided finding's shown files differ from the shaper's list, or else the reshape's. A run with no tracked decided finding replays whole. This is what `workflow/replay` allows a prompt change to cost, and what #99 accepted for every resolve with a call.
- **The shaper's resume line on other reshape stops.** A reshape resumed after another shape-stage stop (a missing spec file, a decline with no reason) is still told to rewrite the four files from scratch, beside entries the resolve agent decided. Only the stops of decision 13 get the correct-what-you-wrote clause. Not changed here.

## As built: what changed from the shaped decisions

- **Decision 15's edge is narrower than written.** The finding that changes is a call whose decision names `defer` and that a reshape newly puts under a rule, not a defer override. An override so placed becomes a call the round has not seen, so a second resolve applies it and drops its disposition, and it was already shown the reshape's list. No skill path writes a call that names `defer` (#108, R1-5's note); the case is pinned all the same (`forcedDefer`).
- **`agents/redline-shaper.md` changed in Task 4 as well as Task 3.** Its rule 9 said to rewrite the four files from scratch on any resume. It now names the exception the new resume line makes, so the prompt and the file state one rule (`workflow/agents`, line 17).
- **No existing expectation moved** (decision 20). The reshape mock lists, for each finding the block names, what the scripted resolve planned, so every earlier scenario with a bounce and a decided finding ends as it did.
- **One mutation of twenty-eight stayed green, as an equivalent** (three in Task 2, ten in Task 3, fifteen in Task 4, each applied alone). Widening the hold to a finding left to the person under a rule changes nothing: the list of such a finding is never replaced, so no reshape can empty it. That neighbour is pinned through the mutation of the update loop, which is red.

## The prompt sweep (decision 4)

Every scenario of `tests/loop-test.mjs` as built, 564 runs, was run twice from a copy of the harness in the scratchpad: once against `workflows/redline-loop.js` as it read at `6d769f5`, before this spec, and once against the built file. Each call's label, prompt and options were hashed and the two sequences compared.

| | Scenarios |
|---|---|
| Every prompt identical | 451 |
| A prompt differs | 113 |
| No plan approver was shown a decision | 418, all identical |
| A plan approver was shown a decision | 146 |
| ...one not left to the person under a rule (tracked) | 133 |
| A prompt differs with no decision shown | 0 |
| A prompt differs with decisions shown and none tracked | 0 |

Where the 113 first differ:

| First prompt that differs | Scenarios | Why |
|---|---|---|
| The round's first plan approver pass | 96 | A decided fix, accept or answered call is shown its task's files where it was shown the shaper's list from before the decision (decision 11). |
| A reshape | 16 | The block names the round's decided findings (decision 10). The first pass was the same: a decided deferral, already shown its task. |
| A later plan approver pass | 1 | The decision was applied by the resolve that follows a reshape, for a call that reshape raised. |

No resolve prompt differs in any scenario, so a paused run relaunched after the update replays through the round's resolve. Twenty scenarios with a tracked decided finding are identical throughout: a decided deferral with no bounce, or a list the shaper and the resolve agree on. Six of the 113 also end at another call, the stops of decision 13.

## Standards retrospective

Listed from decisions 1 to 20, the as-built deviations and the red runs, and put to the person before any edit. All seven edits were approved on 2026-11-20 and applied in their own commit, `bc5287c`.

The edits:

1. `agent-os/standards/workflow/agents.md`, line 47, appended: **contradicted in part** (decisions 10, 11, 17). The line said the workflow reads a decided finding's task from the resolve agent's tasks, and R2-11's clause showed it beside a deferral only. Appended: the list read for a decided finding is its task as last planned, set by the resolve that applied the decision and replaced by each reshape's `files`, read for every decided finding no rule leaves to the person, from the first plan approver pass on; what a reshape says was decided is still dropped, and a change is warned about with the decision's owner.
2. `agent-os/standards/workflow/agents.md`, line 38, appended: **missing** (decision 13). The hold of a decision to its task runs again after each reshape, on the list the reshape left; a deferral is not held.
3. `agent-os/standards/workflow/agents.md`, line 10, appended: **missing** (decisions 2, 18). A spec shaped by hand settles a class by listing every read and every text shown, each row traced to a path a run can take: the draft-stop row, taken from the issue's words, had none.
4. `agent-os/standards/workflow/replay.md`, line 19, appended: **missing** (decision 13). A reshape stopped by the workflow's check of the task it left a decided finding is told to correct the task and keep the decided entries, chosen by how the error opens; any other reshape resume keeps the shaper's sentence.
5. `agent-os/standards/workflow/replay.md`, line 23, appended: **missing** (decision 10). A block that only says what an existing field means for the findings it names needs no new key.
6. `agent-os/standards/testing/tests.md`, line 7, appended: **missing** (decision 20). A reshape mock asked what a decided finding's task is lists what the scripted resolve planned, kept from the resolve's own result.
7. `agent-os/standards/testing/tests.md`, a new bullet after "A bug fix lands red before green": **missing** (decision 4, the sweep; the equivalent mutation). A byte-identical claim is proven by a sweep of every scenario under the script before and after, with each difference explained; a green mutation is called an equivalent only with the reason and the red neighbour.

Already in a standard, no edit:

- A stage error names the label a resume reruns and is pinned by it (`workflow/agents.md`, line 37; `testing/tests.md`, the `resumeFrom` bullet).
- A message worded by a condition is pinned in each wording, and says when it fires in the words of the decision behind it (`testing/tests.md`; `workflow/agents.md`, line 16).
- A rule a prompt states is changed in the role's agent file too (`workflow/agents.md`, line 17), which is why `agents/redline-shaper.md` changed in Task 4.
- A stop takes only a decision whose prompt comes after it (`workflow/replay.md`, line 6), which ruled out the early stop of decision 12.
- A value a later pass rebuilds keeps what an earlier pass recorded (`workflow/agents.md`, line 41): a second resolve sets only the ids it applied.
- One Docs entry per touched plugin file (`process/docs-gate.md`); a patch bump in both manifests (`process/release.md`).

No pattern was used that the standards do not hold. No code enforces a new rule beyond the loop checks each task landed with.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people": a decision the person made is held to the task the plan carries for it, after the resolve and after every reshape, and a change a reshape makes to that task is named in the run's result. "Fixes go through the repository's own planner": what the plan approver and the implementer are shown is the plan as it stands, not as it first stood.

## Standards Applied

- workflow/replay — line 6, a stop takes only a decision whose prompt comes after it (decision 12); line 7, a draft's version counts the agent's text (#104, left); line 19, a step whose stop is the workflow's own check of what it returned is told so in its resume line, chosen by the stop (decision 13); line 23, a new ask sits in the block only the calls it concerns carry, and the agent file gains the ask and changes no other rule (decision 10).
- workflow/agents — line 6, the prompt holds the round's inputs and the agent file the role; line 16, a message says when it fires in the words of the decision behind it (decision 19); line 17, a rule a prompt states is changed everywhere it is restated; line 37, an error names the label a resume reruns; line 38, the workflow checks a result before it acts on it (decision 13); line 41, a value a later pass rebuilds keeps what an earlier pass recorded (decision 17); line 47, a fact an agent states is checked against the run's record, and every agent is shown the list the workflow reads (decisions 10, 11); line 50, whether an optional step happened is read from the record and never demanded (a deferral is not held).
- testing/tests — a reshape mock returns what the reshape prompt asks for (decision 20); a message worded two ways is pinned in each; a stage error is pinned by its `resumeFrom` label; a rule over every scenario is pinned over every scenario (the block); red before green, and a mutation of each new clause.
- process/docs-gate — one Docs entry per touched plugin file, in `plan.md`.
- process/release — a patch bump in both manifests.
- process/standards-retrospective — at the gate.
- prompts/attribution — none anywhere, the drafted issue included.
