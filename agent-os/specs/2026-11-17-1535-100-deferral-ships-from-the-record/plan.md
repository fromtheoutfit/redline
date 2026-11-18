# #100: a deferral's mitigation is read from the round's record, never from its words

## Context

Redline decides whether a deferred item ships a mitigation from the words of its free-text `mitigation` field (`hasMitigation` and the `NOTHING_SHIPS` phrase list, `workflows/redline-loop.js:784-788`). A wording the list misses, such as `No code ships in this pull request.`, reads as a mitigation: the check demands a commit the plan has no task for, the repair has nothing to build, and the round stops at the check on every resume. #97 widened the list twice (R1-7, R3-2) and deferred the real fix as #100.

After this change the words decide nothing. The round's own record does: the plan before the build, the finding's own commit after it. A deferral can no longer stop a round.

## Decisions (from the brief and the four answers; the record is in shape.md)

1. **Signal: the round's own record.** No `ships` field, no template change, no setup rerun.
2. **A deferral's commit is never demanded.** It is out of `needCommits`, so it neither fails the check nor reaches the repair pass. A fix with no commit still stops the round as today.
3. **After the check, a commit of the finding's own decides.** `ownCommit` (`loop.js:596`, #97 R3-5): the implementer reported it for the finding, or its subject opens `redline: <id>`. A commit that only mentions the id is not one.
4. **Two warnings, both from the record, none from the words.**
   - Planned task with files, no commit of its own: posted as shipping nothing, draft still filed. `round 1: R1-4 planned a mitigation in app/Jobs/SyncOrders.php and no commit of its own landed; posted as shipping nothing`
   - Commit of its own, no files listed: counted and posted as the mitigation. `round 1: R1-4 has a commit of its own (abc1234) and the shaper listed no files for its task; posted as its mitigation`
   - Words that describe a mitigation with no task and no commit: no warning. It is the same record as the pinned wording.
5. **What buys the next round:** a correctness deferral buys it only when a commit of its own landed. A planned task with no commit of its own buys nothing.
6. **"Planned" is split by who decided (R2-6 kept).** Nobody decided the finding: the shaper's `findings[].files` on its own defer. The person or autopilot decided it: the resolve agent's `tasks[].files` only.
7. **`files` becomes required** in the shape schema, and the shape, human-pass and reshape prompts each ask for it, so an empty list means no task.
8. **`isDeferral` reads filled or empty, no phrase list.** `NOTHING_SHIPS` and `hasMitigation` are deleted. One emptiness test stays at the line #99 replaces.
9. Version 0.4.0 to 0.4.1 (patch). Guard, hook, `checks.sh`, `checks.json`, the template and the gate text are not touched.

## Call sites: what each reads after the change

All in `workflows/redline-loop.js`. `planned(id)` is `plannedTask(id) || shaperPlanned(id)` (both exist); `landed(id)` is new: a round commit that passes `ownCommit`.

| Site (today's line) | Today | After |
|---|---|---|
| `NOTHING_SHIPS`, `hasMitigation` (784-788) | the words | deleted; a one-line `filled(item)` (non-empty after trim) for `isDeferral` only |
| `needCommits`, `mitigated` (3921-3925) | defer demanded when words say so; every resolve task with files | final `fix` ids and resolve tasks with files, each minus the round's deferrals (`deferred.filter(isDeferral)`), accepted and forced ids |
| `outcomesFor` `shipsNothing`, `shipped` (2934-2935) | words, then `planned` | for a deferral: commits that name it when one of them is its own, else none. The `planned` argument goes |
| deferred outcome's `mitigation` (2951) | words unless `shipsNothing` | same line, now fed by the commit rule |
| "Mitigated in" / "Applied in" clauses (1522, 1528, 2990, 2993) | `outcome.commits` | unchanged code; the commits come from the rule above |
| `deferredEntry` (3383), the filed draft's entry in the result | words when `hasMitigation` | words when the outcome has commits, else `''` |
| `draftView` (3397), the stop's view | words when `hasMitigation` | words and a new `files` list when planned; `''` and `[]` when not. At the end-of-run stop, after the build, words when the held outcome has commits |
| `isDeferral` (3782) | `hasMitigation(d) \|\| !plannedTask` | `filled(d) \|\| !plannedTask` |
| `bought`, `shaperMitigated` (4067-4072) | words of the shaper's and the final entry | `own === 'defer' && landed(id)` for both the shaper's own and the final disposition |
| new, after `outcomesFor` | | the two warnings of decision 4, over the round's deferrals |

Prompt text in the same file: the three `Return only the JSON object` sentences (1954, 1993, 2011) gain `files (the paths its task creates or changes, an empty list when it has no task)`; the implement prompt's `a deferred finding with an empty mitigation has no task and no commit` (2159) becomes `a deferred finding with no task in plan.md gets no change and no commit`. `shapeSchema`'s finding `required` gains `files` (831).

Behaviour that changes on purpose, recorded in `shape.md`:
- R2-6's pin (`plannedBare`): an empty mitigation with files and its own commit now buys the round (`fix-diff`, was `final-nit-pass`).
- The shaper's mitigated deferral that the person changes to accept no longer buys a round (no commit of its own can land). A shaper fix changed to accept still buys (#93).
- A resolve entry worded `none` beside a task now reads as the person's deferral (the phrase list read it as a fix).
- A mitigation committed under a subject that does not open with its id, and not reported for it, is not counted.

## What #99 still has to do

Have the resolve agent name each decision's disposition and have `isDeferral` read it in place of `filled(d) || !plannedTask(d.id)`; pin a fix beside a stray filled entry, a fix beside a stray empty entry and a real "Mitigate" answer. New from this spec: a finding read as a deferral is never demanded by the check, so a fix read as one through a stray filled entry is not demanded either. `shape.md` carries a drafted comment for #99 saying so, under "For you to add to #99"; you post it.

## Tasks

Spec folder: `agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/`. Every loop check is seen red before its code. The build stops after each task with the file list for that task's commit; nothing is staged.

**Task 1: Save spec documentation.** `plan.md`, `shape.md` (the decisions above, the four answers, the changed behaviours, the #99 note), `standards.md` (workflow/agents, workflow/replay, testing/tests, process/docs-gate, process/release, process/standards-retrospective, process/internal-notes, prompts/attribution), `references.md` (#95 decision 35; #97 R1-7, R1-10, R2-6, R2-15, R3-2, R3-5).

**Task 2: `files` is required and always asked for.**
- `workflows/redline-loop.js`: schema and the three return sentences.
- `tests/loop-test.mjs`: the scripted shaper returns `files` on every finding (`scenario.files[id]` when scripted; else `['app/x.php']` for a fix and for a defer whose scripted mitigation is not `''`; `[]` otherwise). Checks: `files` is a required key in both passes' schemas; the three prompts carry `an empty list when it has no task`.
- `agents/redline-shaper.md` rule 10: every finding lists `files`, empty when it has no task, and the workflow reads a deferral's planned mitigation from it, never from the words.

**Task 3: the check never demands a deferral's commit.** `needCommits`, the planned-and-unbuilt warning, the implement prompt sentence. Checks, red first:
- the pinned case: `No code ships in this pull request.`, no files, no commit: done, no `no commit names`, reply `Redline round 1: deferred to #301. · decided by: redline`, no warning;
- planned, no commit: done with no `repair r1` call, draft filed, the warning with the file, one round;
- a "Mitigate" answer whose task is not built: done, `No code change. Deferred to #301.`, the warning;
- neighbours that stay red-proof: a fix with no commit, and `unbuilt` (a decided fix), still stop at the check.

**Task 4: the commit of its own decides the outcome and the next round.** `outcomesFor`, `deferredEntry`, `bought`, the built-and-unlisted warning. Checks, red first:
- the mirror: mitigation `none`, files, its own commit: `Mitigated in 1bbbbbb (redline: R1-1 fix).` and the next round is `fix-diff`; `plannedBare` flips the same way;
- words that describe a mitigation, no files, only a commit that mentions the id: nothing posted as mitigated, one round (the old phrase loop becomes this loop, with a real mitigation sentence added);
- no files, its own commit: counted, the warning, next round bought;
- `mentionedBare` (R3-5) keeps its reply and gains the planned-and-unbuilt warning;
- the shaper's deferral changed to accept buys nothing.

**Task 5: `isDeferral`, the stop's view, and the deletion.** `filled`, `draftView` with `files`, `NOTHING_SHIPS` and `hasMitigation` removed, comments rewritten. Checks: a resolve entry worded `none` beside a task is filed as the person's deferral (red first); `strayResolve` and `strayRaised` unchanged; the stop's draft carries words and files when planned and `''`, `[]` for the pinned wording; the script holds neither `NOTHING_SHIPS` nor `hasMitigation`.

**Task 6: the prose.** Statement checks in `tests/loop-test.mjs` for each.
- `agents/redline-plan-approver.md` rule 1: a defer whose `files` is empty has no task; a defer that lists files with no task in `plan.md`, or has a task and lists none, is a bounce.
- `agents/redline-implementer.md` rule 3: a mitigation's commit opens `redline: <id>` and is reported with its `finding`; only that commit is counted. `agents/redline-resolve.md`: no change.
- `skills/redline/SKILL.md` (the drafts stop): what ships is read from `files`; an empty list means nothing ships whatever was written.
- `docs/running.md`: "What buys the next round", the `defer` disposition, and a new bullet under "Deferred items" (what decides whether a mitigation shipped, never a stop, the two warnings). `README.md`, Known limits: a skipped mitigation is not retried, and a mitigation commit under another subject is not counted.

**Task 7: version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to `0.4.1`.

**Task 8: Verification Gate.** `.claude/redline/checks.sh --baseline` green; CI's shellcheck command once (no `.sh` file is planned to change; if one does, before the first commit and after the last); Docs entries per touched file; the standards retrospective put to you before any edit (`workflow/agents.md` line 49 is now wrong, and line 39's R1-10, R2-6 and R3-5 clauses change); "As built" in `plan.md`.

## Docs entries (gate step 10)

- `workflows/redline-loop.js`: `docs/running.md` (the three places in Task 6) and README Known limits, Task 6's commit.
- `agents/redline-shaper.md`, `redline-plan-approver.md`, `redline-implementer.md`: `docs/running.md`, "Dispositions" and "Deferred items", Task 6's commit.
- `skills/redline/SKILL.md`: `docs/running.md`, "Deferred items", When you are asked, Task 6's commit.
- `.claude-plugin/*.json`: no reader-facing change; the version only, and the changelog entry is yours at tag time.

## Verification

- `node tests/loop-test.mjs` after each task: the new checks red before the code, then `N checks passed, 0 failed`.
- `.claude/redline/checks.sh --baseline` at the end: all nine green.
- `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`: clean.
- `git status` shows no change to `scripts/redline-guard.sh`, `hooks/hooks.json`, `templates/` or `.claude/redline/`.

## As built

- **Task 1** (`9d8f688`): the spec folder.
- **Task 2** (`cd2a438`): `files` joined the required keys of a shaped finding, `FILES_ASK` went into the shape, human-pass and reshape return sentences, and the shaper's file says the workflow reads a deferral's planned mitigation from the list. The scripted shaper returns `files` on every finding. Red: five checks. Green: 1316 passed, 0 failed. The no-task scenario worded `None; nothing ships in this pull request.` scripted an empty list, since the scripted shaper gives every other worded deferral a task.
- **Task 3** (`0a11b26`): `needCommits` holds no deferral, `plannedFiles` and `landed` were added, and the planned-and-unbuilt warning is raised after the check. Red: four checks (the pinned case, a planned mitigation left out, a "Mitigate" answer left out, the implement prompt's sentence). Green: 1323 passed, 0 failed; the neighbour, a fix with no commit, stopped after its repair before and after. **Deviation:** `outcomesFor` reading a deferral's own commit moved here from Task 4. The pinned case's reply depends on it: with the commit demand gone and the words still read, the reply was `deferred to #301. Mitigation: No code ships in this pull request..`
- **Task 4** (`0de0e1d`): `bought` reads `landed` for the shaper's own and the final disposition, `deferredEntry` carries the words when its outcome holds a commit, and the built-and-unlisted warning was added. Red: eight checks. Green: 1319 passed, 0 failed; the neighbour, a fix the person changed to accept, bought its round before and after. The ten-phrase loop became a six-wording loop with no task and a commit that only names the finding; `nothingBut`, `nothingComma` and `worded` went, since their reason was the phrase list; `plannedBare` became the mirror loop over `none` and an empty string. What buys a round is read off the handoff's `changed no code` sentence: with the coverage pass off, a bought round with no fix and a round that bought nothing both end after one round, and only the sentence tells them apart.
- **Task 5** (`51e291d`): `filled` replaced `hasMitigation` in `isDeferral`, and `NOTHING_SHIPS` and `hasMitigation` are gone. Red: eight checks. Green: 1328 passed, 0 failed; `strayResolve` and `strayRaised` did not move. **Deviations:** the draft view gained a `ships` boolean beside `files`, since at the end-of-run stop the build is over and a file list no longer says what shipped (`ships` is a planned task with files before the build and a commit of the finding's own after it); and the skill's two sentences on the drafts stop landed here, not in Task 6, as `workflow/replay` asks of a field a stop adds. `draftsOf` takes the list to read the files from, `shaperFiles` at the stop before the round's decisions and `plannedFiles` after them, since `plannedFiles` is declared after that first stop.
- **Task 6** (`f87e478`): the plan approver's and the implementer's files, the skill's plan dial, `docs/running.md` and README Known limits. Red: eleven statement checks. Green: 1339 passed, 0 failed. `agents/redline-resolve.md` is unchanged.
- **Task 7:** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.4.1`.
- **Shellcheck:** no `.sh` file changed. CI's command printed nothing and exited 0 after Task 7.
- **Docs entries:** `workflows/redline-loop.js`, the three agent files and `skills/redline/SKILL.md` are described by `docs/running.md` ("What buys the next round", the `defer` disposition, "Deferred items", Whether a mitigation shipped) and README Known limits ("No commit is demanded of a deferral"), all in `f87e478`. `.claude-plugin/*.json`: no reader-facing change, the version only.
- **Standards retrospective:** four edits, approved and applied in their own commit: `agent-os/standards/workflow/agents.md` lines 39 and 49, `agent-os/standards/testing/tests.md` lines 7 and 31. `shape.md` lists each with its classification.
- **Verification Gate:** `.claude/redline/checks.sh --baseline` exits 0 with all nine checks at exit 0, run over the tree with all of the above in place (2026-11-17): syntax, validate, guard, loop (1339 checks passed, 0 failed), prefs, gate, setup, gh, background.
