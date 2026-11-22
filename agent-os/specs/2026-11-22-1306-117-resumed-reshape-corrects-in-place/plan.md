# #117 and #116: a resumed step is told what its stop was, by a field and never by the error's words — Plan

Spec folder: `agent-os/specs/2026-11-22-1306-117-resumed-reshape-corrects-in-place/`. Version 0.4.4 → 0.4.5. The pull request closes #117 and #116.

## Context

A plan the plan approver bounces goes back to the shaper as a reshape (`reshape <tag> #<k>`). When that reshape stops at stage `shape` and the run is resumed, `resumeLine` in `workflows/redline-loop.js` tells it to rewrite the four spec files from scratch, unless the error opens `the reshape left `. By then the folder can hold the entries and tasks the resolve agent wrote for decisions the person or the autopilot made (#117). `resumeLine` picks that exception, and the resolve agent's, by how the error text opens, and the skill tells the person to fix the cause by hand for every resumable stop, those two included (#116).

After this spec: no rerun is told to rewrite a folder that can hold a decided entry; one field, `ownCheck`, says a stop was the workflow's own check of what an agent returned; `resumeLine` and the skill both read it; nothing reads an error's wording.

## Decisions

1 to 11 are the user's, copied into `shape.md` verbatim. The answers given while shaping (2026-11-22):

12. **a: both read the field.** Set at each own-check throw site, returned on the error result, carried by the marker, copied into `args.resume` by the skill, read by `resumeLine` and by the skill's error section. Closes #116 whole. Rider: decision 8 is lifted for `scripts/redline-prefs.sh`, `docs/scripts.md` and `tests/prefs-test.sh` only; the guard, the hook and `scripts/redline-gh.sh` stay untouched; decision 10's shellcheck command runs before the first commit and after the last.
13. **b: the sentence alone.** No check of the decided entries. The gap is recorded as left alone and an issue for the class is drafted for the user to open.
14. **c: two clauses at a reshape**, chosen by the label and the field. The spec check does not carry the field (a missing file can be a refused Write a person fixes: PR #54 round 2, #76), so the field's sites are the resolve's eight, the hold and the shaper's eight result checks: seventeen.
15. **d1: no fallback to wording.** An entry with no field is an ordinary stop. No run is in flight anywhere, so a fallback protects nothing. Rider: the existing resume cases change only by gaining the field on their entries.
16. **d2: three named exceptions in the sweep, plus d3's.** Of the 24 scenarios that pass a resume entry, 23 differs by decision 5 and 22 and 24 by answer c. The field stays yes or no.
17. **d3: a first shape resumed after an own check gains the sentence the other two labels carry.** Scenario 9 is the fourth exception. Left alone with its reason: "a written file stands" beside from-scratch. Left alone and drafted as an issue: a crash.

## Measured (decision 2's table; `shape.md` holds it with the per-stop column)

Method: `tests/loop-test.mjs` loaded in memory with `go()` exposed, on `main` at `8cf1595` (618 scenarios, 1614 checks, 0 failed). Every stop was produced by a run and every line read off the relaunch's prompt.

The line today: S1 `Resume attempt <n> of this step.` S2 `The run stopped at this step with an error (<error>);` S3 `the person has since fixed the cause by hand.` S4 `Do the step again from the current state of the repository and the PR.` S5 `What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.` Then, by agent: the shaper's from-scratch or correct-task sentence, the resolve agent's correct clause, a Finish comment's or the record commit's duplicate check.

| Label | Stage | Stops that end there | After S1 to S5 today | After this spec |
|---|---|---|---|---|
| `gather r<n>` | gather | not resumable | no line | same |
| `coverage r<n>` | review | returned nothing; Skill denied; no skill; no JSON array | nothing | same |
| `review`, `re-review`, `final nit pass r<n>` | review | returned nothing | nothing | same |
| `post r<n>` | post | returned nothing; posting failed | nothing | same |
| `shape r<n>`, `shape h<n>` | shape | 8 result checks | from-scratch | **own sentence + from-scratch** |
| same | shape | spec check (3 messages); returned nothing | from-scratch | same, byte for byte |
| `spec status <tag>[ #k]` | shape | returned nothing; the check refused | nothing | same |
| `resolve <tag>[ #k]` | resolve | 8 `the resolve agent ...` checks | correct clause, by the error's opening | same words, **by the field** |
| same | resolve | autopilot could not apply; returned nothing | nothing | same |
| `plan`/`standards approver <tag>[ #k]` | approve | returned nothing; the cap | nothing | same |
| `reshape r<n> #k`, `reshape h<n> #k` | shape | the hold | correct-task, by the error's opening | **own clause, by label and field** |
| same | shape | 8 result checks | **from-scratch** | **own clause** |
| same | shape | spec check; returned nothing | **from-scratch** | **restore clause** |
| `snapshot`, `baseline`, `check`, `recheck`, `implement`, `repair`, `file deferred`, `push and reply`, `deferred replies` | their own | returned nothing; the operation or the gate failed | nothing | same |
| `last round`, `PR description`, `resolve threads`, `record files` | finish | returned nothing; the operation failed | nothing | same |
| the three Finish comments; `record commit` | finish | returned nothing; the operation failed | their duplicate check | same |

- 26 labels resumable in a decided round with a bounce; every relaunch changed exactly one prompt.
- The reshape rows held in three rounds (an override to fix, an autopilot answer, no decision) and on `reshape h1 #1`. `resolve <tag>` ran before the reshape in the two decided rounds, so the folder held decided entries at each stop. 71 of the harness's 90 reshape calls run after a resolve of the same pass.
- The last error wins: a reshape resumed after the hold that then fails the spec check is told from-scratch on attempt 3.
- S3 is false for every own-check stop and for `returned nothing`; `shape.md` carries the per-stop column.

**Decision 3: no decision can be on disk when a first shape is resumed.** 0 of 619 first-shape calls run after a resolve of the same pass; 0 of 17 first-shape stops sit in a launch whose args answer that pass; over the 222 scenarios that carry relaunch answers, their 228 first shapes vet identically with and without them. The folder name carries the launch stamp, so another run's folder is another folder. The from-scratch sentence stays.

**What reads the folder:** `spec status` runs two `git grep` commands (the four file names, the `## Decisions` heading); the hold reads the `files` a reshape returns. Nothing reads an entry or its `Decided by:` line.

**The 24 scenarios that pass a resume entry:** 4 stopped at an own check (5 `resume: a stop at resolve, resumed`; 9 `resume: shape stage relaunch`; 22 and 24, the hold's two). 23 is decision 5's.

## Design

**The field.** `ownCheck`, a boolean: the stop is the workflow's own check of what the step's agent returned, so the rerun corrects it and nothing needs fixing by hand.

- `stageError` gains the flag through one helper (`checkError`), used at the seventeen sites: the resolve's eight (`the resolve agent ...`), the hold, and the shaper's eight result checks in `checkDispositions` (2), `checkCalls` (2), `checkWhy`, `checkDeclineReasons`, `checkDrafts` and `vetShape`'s missing disposition. Not the spec check, the autopilot stop, `returned nothing` or any other stop.
- The error result carries `ownCheck: true|false` beside `resumeFrom`, and `relaunch.how` names it with what the relaunch passes.
- `scripts/redline-prefs.sh run save` copies it into the marker (`ownCheck`, false when the result has none).
- The skill copies the marker's value into the resume entry: `{attempt, error, hand, ownCheck}`.
- `args.resume` accepts an optional boolean `ownCheck` and refuses any other type; absent reads as false.

**The line, as built** (S1 to S5 unchanged for every entry):

| Label | `ownCheck` | Appended |
|---|---|---|
| a first shape | false | from-scratch, today's bytes |
| a first shape | true | ` When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it.` then from-scratch |
| a reshape | true | ` When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never change or remove anything under its redline/ folder.` |
| a reshape | false | ` This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided and the task written for it, write again what is missing or left unfinished, and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.` |
| a resolve | true | today's correct clause, byte for byte |
| a resolve | false | nothing |
| every other label | either | as today |

A reshape is known by the shaper's agent type and a label that starts `reshape `. Both `startsWith` reads of the error leave `resumeLine`.

## Tasks

The user makes every commit. Each task is one commit; the tasks share files, so the build stops after each for the commit, with the exact file list and one line on what went red then green. Before Task 1's commit and after the last: `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`.

### Task 1: save the spec folder

`plan.md` (this plan), `shape.md` (decisions 1 to 17, the measured table with its per-stop truth column, Left alone, For you to open), `standards.md`, `references.md`. No visuals.

### Task 2: `ownCheck` from the stop to the rerun and to the person (#116)

No resume prompt changes in this task: the two selectors move from the error's opening to the field, with their words as they are.

- `workflows/redline-loop.js`: `checkError`; the seventeen sites; the result's `ownCheck`; `args.resume` intake; `resumeLine`'s resolve and hold clauses chosen by `entry.ownCheck`; `relaunch.how`. The comments above `resumeLine` say the clause is chosen by the field.
- `scripts/redline-prefs.sh`: `run save` copies the field; the header's entry line names it. `docs/scripts.md` quotes the header.
- `tests/prefs-test.sh`, seen red first: a record with `ownCheck` true saves it; one without saves false; a hand-off marker saves false.
- `skills/redline/SKILL.md`: the marker's keys (section 2), the resume entry, and the `error` section: for `ownCheck` true, the stop is Redline's own check of what the step returned, nothing needs fixing by hand, and `/redline:redline <n>` resumes from `<label>` as it stands; the current sentence for every other resumable stop.
- `agent-os/standards/workflow/replay.md`, the resume clause: the sentence is chosen by the field the stop set, never by the error's words (decision 6 puts this in the code's commit; the retrospective's edits stay in their own).
- `docs/running.md`, "Run markers and resume": the field, which stops carry it, what the skill says for each kind. `docs/contract.md`: the marker's key, where it lists them.
- `tests/loop-test.mjs`, each seen red first:
  - the result carries `ownCheck` true for a stop of each of the seventeen sites, by `resumeFrom` label and text, and false for the neighbours: the spec check, `returned nothing`, the autopilot stop, a failed gate;
  - the structural pin `every resolve stage error but the autopilot stop opens with "the resolve agent "` becomes: every resolve-stage site but the autopilot stop, the hold, and the eight shaper sites are raised through `checkError`, and no other site is;
  - scenarios 5, 22 and 24 gain `ownCheck: true` on their entries and build the prompts they built;
  - no fallback: a resolve entry with no field whose error opens `the resolve agent ` gets the line alone, and a hold entry with no field gets no correct-task clause;
  - `args.resume` refuses a non-boolean `ownCheck` and accepts none;
  - `relaunch.how` names the field; the skill's two wordings and the standard's clause by key phrase.

### Task 3: a resumed reshape is told to correct or restore, never to rewrite (#117)

- `workflows/redline-loop.js`: `resumeLine`'s shaper branch by label and field, the two clauses above.
- `agents/redline-shaper.md`, rule 9: a resumed first shape rewrites the four files; a resumed reshape never does, and follows its resume line, correcting what the error names after the workflow's own check and restoring what is missing after any other stop, with the from-memory ban and the `redline/` ban.
- `agent-os/standards/workflow/replay.md` resume clause and `docs/running.md` (the resume paragraph and "A reshape after your decision"): what the workflow now does.
- `tests/loop-test.mjs`, each seen red first:
  - decision 5: `a reshape resumed after another stop keeps the shaper's own resume line` becomes the restore clause, beside a case that the same round's first shape, resumed after its spec check, still rewrites, byte for byte;
  - a reshape resumed after a result check in a decided round (a decline with no reason), after the hold (22, 24, the widened clause), after a crash, in a round with no decision, on a human pass (`reshape h1 #1`), and on attempt 3 after the hold then the spec check: none holds from-scratch;
  - each resume changes exactly one prompt and the prefix replays (`samePrefix`);
  - over every scenario: no reshape prompt holds the from-scratch sentence, and no prompt of a run with no resume entry holds any resume clause;
  - the shaper's file by key phrase.

### Task 4: a first shape resumed after an own check says nothing was fixed by hand

- `workflows/redline-loop.js`: the own sentence before from-scratch when the field is set at a first shape.
- `agents/redline-shaper.md` rule 9, the standard's clause and `docs/running.md`, one sentence each.
- `tests/loop-test.mjs`, seen red first: scenario 9 gains the field and the sentence; scenario 16 (a spec check, no field) keeps today's bytes; `shape h1` after a human pass's own check.

### Task 5: version and the upgrade note

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: 0.4.5 (a patch: nothing a setup rerun writes changes).
- `docs/upgrading.md`: finish or restart a stopped run before updating across 0.4.5. A marker written before it has no `ownCheck`, so its resume reads as an ordinary stop, and a run that had already resumed at a resolve check or at a reshape reruns from that step.

### Task 6: the sweep and the mutations, recorded in the spec folder

- **Sweep** (decision 4), in the scratchpad: the as-built harness run once under `git show 8cf1595:workflows/redline-loop.js` and once under the workflow as built, hashing every call's label, prompt and options. Expected: every scenario with no resume entry identical; of the 24 earlier ones with an entry, 20 identical and 9, 22, 23, 24 each differing in the one resumed prompt; the spec's own cases listed. Any other difference stops the build for a question.
- **Mutations**, one per new pin, each seen red, a crash reported as a crash: the flag dropped at one resolve site; set at the spec check; set at the autopilot stop; left off the result; a wording fallback put back at the resolve; the reshape test narrowed to `reshape r`; the reshape's clause chosen without the label; from-scratch put back for a field-less reshape; the from-memory ban dropped; `what the error names` put back to `the task the error names`; the own sentence dropped at a first shape; the own sentence given to a field-less first shape; a non-boolean `ownCheck` accepted.

### Task 7: Verification Gate

`.claude/redline/checks.sh --baseline` green; the Docs entries below each named with its commit; the version step; the standards retrospective put to the user and applied in its own commit, or "no changes" recorded; `plan.md`'s As built.

## Docs entries (gate step 10)

| File | Section it changes | Task |
|---|---|---|
| `workflows/redline-loop.js` | `docs/running.md`, "Run markers and resume" and "A reshape after your decision" | 2, 3, 4 |
| `skills/redline/SKILL.md` | `docs/running.md`, "Run markers and resume" | 2 |
| `scripts/redline-prefs.sh` | `docs/scripts.md` (the quoted header); `docs/contract.md`, the marker | 2 |
| `agents/redline-shaper.md` | `docs/running.md`, "Run markers and resume" | 3, 4 |
| `.claude-plugin/*.json` | `docs/upgrading.md`, a new section for 0.4.5 | 5 |

`agents/redline-resolve.md` is not changed: its "On a resume" rule already reads the line's own sentence.

## Recorded in `shape.md`

**Left alone**
- "A written file stands" (S5) beside from-scratch at a first shape: the second sentence is the specific instruction and rule 9 says the same.
- S3 at every stop that is not an own check, a crash included.
- Nothing reads a decided entry or its `Decided by:` line (answer b).
- A missing `shape.md` after a reshape of a decided round: the restore clause cannot give back a decision's choice, notes and date, so it bans writing one from memory.
- The out-of-scope issues: none is touched. #119's first option would add an own-check stop at the resolve, which would carry the field; left to that issue.

**For you to open** (drafted, standing on their own, no attribution)
1. Check that the round's `shape.md` still holds every decided entry with its owner line, and `plan.md` its task, after the resolve and after every reshape, with the repair path: which agent restores an entry, and from what.
2. A step resumed after a crash: a resolve is told nothing about entries and tasks it may have half written, and the line tells every crashed step a hand fix was made. The open decision: how a crash is told from the autopilot stop without reading the error.

## Shaping answers taken from the repository

- Visuals: none.
- References: `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/` (the hold, its resume clause, "Left alone" line 115), `agent-os/specs/2026-11-21-1501-114-review-round-4-by-hand/` (R4-1, R4-6), `agent-os/specs/2026-11-18-1026-108-review-round-3/` and `-4/` (R3-4, R4-4), `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/`, #75's 2026-11-20 comment.
- Product: `agent-os/product/mission.md`; nothing in it changes.
- Standards: workflow/replay, workflow/agents, testing/tests, scripts/bash-conventions, process/docs-gate, process/release, process/standards-retrospective, process/internal-notes, prompts/attribution.

## Verification

1. `node tests/loop-test.mjs`: 0 failed, the count above 1614 recorded per task, each new case red before its change.
2. `tests/prefs-test.sh`: 0 failed, the three new cases red first.
3. The sweep and the mutation run of Task 6, with their counts in `plan.md`'s As built.
4. `.claude/redline/checks.sh --baseline`: one JSON object, all nine checks green.
5. The shellcheck command, before Task 1's commit and after the last, with its output recorded.
6. `git diff --stat main -- templates/ hooks/ scripts/redline-guard.sh scripts/redline-gh.sh tests/gh-test.sh .claude/commands/` prints nothing.

## As built

Built 2026-11-22 on `refactor/117-tell-a-reshape-resumed-after-any-shape-stage-stop-to-correct-its-spec-folder-in-place`.

| Task | Commit | Red, then green |
|---|---|---|
| 1, the spec folder | `35d90e6` | shellcheck clean before it |
| 2, `ownCheck` end to end (#116) | `b140f33` | loop: 14 failed, then 1630 passed, 0 failed. prefs: 3 failed, then 175 passed, 0 failed |
| 3, the reshape's two clauses (#117) | `67b77ab` | loop: 13 failed, then 1653 passed, 0 failed |
| 4, the first shape's own sentence | `a7b99a2` | loop: 3 failed, then 1658 passed, 0 failed |
| 5, the version and the upgrade note | `a7b99a2`, with Task 4 | setup: 512 passed, 0 failed |
| the standards retrospective, E1 to E7 | `c4b430f` | loop: 1658 passed, 0 failed |

The gate: `.claude/redline/checks.sh --baseline` printed `"ok":true`, all nine checks exit 0 (syntax, validate, guard, loop, prefs, gate, setup, gh, background), on the tree of `a7b99a2`. Shellcheck was clean before the first commit and after the last code commit. `git diff --stat main -- templates/ hooks/ scripts/redline-guard.sh scripts/redline-gh.sh tests/gh-test.sh .claude/commands/` prints nothing.

### Docs entries

| File | Section | Commit |
|---|---|---|
| `workflows/redline-loop.js` | `docs/running.md`, "Run markers and resume" and "A reshape after your decision" | `b140f33`, `67b77ab`, `a7b99a2` |
| `skills/redline/SKILL.md` | `docs/running.md`, "Run markers and resume" | `b140f33` |
| `scripts/redline-prefs.sh` | `docs/scripts.md`, the quoted header; `docs/contract.md`, the marker | `b140f33` |
| `agents/redline-shaper.md` | `docs/running.md`, "Run markers and resume" | `67b77ab`, `a7b99a2` |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | `docs/upgrading.md`, "A stopped run across 0.4.5" | `a7b99a2` |

### The sweep (decision 4)

The harness as built was run once under `git show 8cf1595:workflows/redline-loop.js` and once under the workflow as built, each in its own process, and every call's label, prompt and options were hashed.

- 637 scenarios. 621 build the same calls under both. 16 differ.
- Every scenario that passes no resume entry is identical: a first run's prompts are byte for byte what they were.
- 37 scenarios pass a resume entry: the 24 that did at `8cf1595` and 13 this spec added.
- Of the 24, 19 are identical. Four differ, each in one call, the resumed one:
  - `resume: shape stage relaunch` (9), at `shape r1`: the own sentence (decision 17);
  - `reshape: an override to fix whose task the reshape removed, resumed` (22) and `reshape: a fix left with no task and an accept left with one, resumed` (24), at `reshape r1 #1`: the widened clause (decision 14);
  - `reshape: a reshape of a decided round that left no shape.md, resumed` (23), at `reshape r1 #1`: from-scratch to the restore clause (decision 5).
- The 24th, `resume: bad attempt`, builds no call under either script and differs only in the refusal it throws, which now names the key (`{attempt, error, hand}` became `{attempt, error, hand, ownCheck}`). `resume: bad shape`, which passes a list and so is not among the 24, differs the same way.
- The other ten are this spec's own cases: nine each differ in the one resumed call (the two no-fallback cases, the human pass's first shape, and six resumed reshapes), and `resume: an ownCheck that is not a boolean` runs to the end under the old script and is refused under the new one. Its other three cases build the same calls under both.
- The four that gained the field on their entries are 5, 9, 22 and 24; 5 (`resume: a stop at resolve, resumed`) builds the same prompts.

### The mutations (decision 5)

Nineteen, each applied to a copy of the workflow in the scratchpad and run through the harness with its read of the workflow pointed at the copy. Every one applied and each was red. The nineteenth crashed the harness on its first run and was fixed before it was called pinned (below).

| # | Mutation | Failed | Red among them |
|---|---|---|---|
| 1 | the flag dropped at one resolve site | 4 | the site count; the rule over every result |
| 2 | the flag dropped at the hold | 3 | the site count; the hold not reached with `ownCheck` |
| 3 | the flag dropped at a shaper result check | 5 | the first shape's result; a reshape's result check |
| 4 | the flag set at the spec check | 5 | the site count; decision 5's case |
| 5 | the flag set at the autopilot stop | 4 | the neighbours say false |
| 6 | the field left off the error result | 8 | both result checks |
| 7 | a wording fallback put back at the resolve | 1 | the resolve's no-fallback case |
| 8 | a wording fallback put back at the hold | 1 | the hold's no-fallback case |
| 9 | an absent `ownCheck` read as true | 7 | every entry with no field |
| 10 | the reshape test narrowed to `reshape r` | 2 | the human pass's reshape; the rule over every reshape prompt |
| 11 | the clause chosen without the label | 5 | the first shape's cases, decision 5's neighbour among them |
| 12 | from-scratch put back for a field-less reshape | 7 | decision 5's case; the rule over every reshape prompt |
| 13 | the from-memory ban dropped | 6 | every restore case |
| 14 | `what the error names` put back to `the task the error names` | 4 | 22, 24, the result check's case |
| 15 | the own sentence dropped at a first shape | 2 | 9; the human pass's first shape |
| 16 | the own sentence given to a field-less first shape | 3 | 16; decision 5's neighbour |
| 17 | a non-boolean `ownCheck` accepted | 1 | its refusal |
| 18 | the relaunch note left without the field | 1 | its check |
| 19 | an `ownCheck` of false refused at intake | 8 | the false-reads-as-absent case; every resumed reshape whose stop gave false |

Three pins held before the build and could not be red first, so they are seen red here: decision 5's neighbour (9, 11, 16), a first shape resumed from an entry with no field (9, 11, 16), and the false-reads-as-absent case (19).

Mutation 19 was added while this section was written, since no earlier one turned the false-reads-as-absent case red. Its first run printed no count: `Cannot read properties of undefined (reading 'status')`. The third-attempt check read `thirdTime.res.status` and passed `stopOf(thirdTime)` as its detail, and a refused launch has no result. The check now reads `(thirdTime.res || {})` and fails instead of throwing, in its own commit after the standards. The loop test stayed at 1658 passed, 0 failed, and the rerun of 19 printed 1645 passed, 8 failed. The standards line E4 added said eighteen, the count when it was written; it now states the rule with no count, changed in its own commit, and this section holds the number.

### Differences from the plan

- **Tasks 4 and 5 are one commit**, `a7b99a2`.
- **The skill says it in the resume question too.** The plan named three places in `skills/redline/SKILL.md`; a fourth was added: for an `error` marker whose `ownCheck` is true, the resume question says nothing needs fixing by hand, since that is where the person decides.
- **The seventeen sites are pinned by a rule over every scenario**, not by seventeen checks: `go()` reads each error result against a table of the eighteen messages (one site words its stop two ways), a second check requires each to be reached, and two source counts pin where `checkError` is called.
- **`ownCheck` is false on a stop that cannot be resumed**, and the relaunch refusal's result carries it too, so every error result holds the key.
- **The refusal of a malformed `args.resume` names the key.** Its text changed, which the sweep shows on two scenarios.
- **An earlier docs pin was repointed.** The loop test pinned `docs/running.md`'s "except after the stop that holds a decided finding to its task after a reshape", which Task 3 rewrote; it now pins three phrases of the new sentence.
- **Between `b140f33` and `67b77ab`** a reshape entry with the field got the hold's old words whatever its stop, since Task 2 moved the selector and Task 3 the words.
- **Nineteen mutations**, not thirteen: the flag dropped at the hold and at a shaper site, the fallback at the hold, an absent field read as true, the relaunch note and a false refused at intake were added.
- **One check was fixed after the standards commit**: the third-attempt case threw under mutation 19 where it should have failed.
- **`docs/running.md` does not link `docs/upgrading.md`**; the upgrade section links back to it.
