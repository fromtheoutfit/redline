# #117 and #116: a resumed step is told what its stop was, by a field and never by the error's words — Shaping Notes

## Scope

Issue #117, deferred from pull request #114 (round 2, finding R2-3), and issue #116 (round 2, finding R2-1), which answer a brought in.

A plan the plan approver bounces goes back to the shaper as a reshape (`reshape <tag> #<k>`). When that reshape stops at stage `shape` and the run is resumed, `resumeLine` in `workflows/redline-loop.js` tells it to rewrite the four spec files from scratch, unless the error opens `the reshape left `. By then the folder can hold the entries and tasks the resolve agent wrote for decisions the person or the autopilot made. `resumeLine` picks that exception, and the resolve agent's, by how the error text opens, and the skill tells the person to fix the cause by hand for every resumable stop, those two included.

After this spec no rerun is told to rewrite a folder that can hold a decided entry. One field, `ownCheck`, says a stop was the workflow's own check of what an agent returned. `resumeLine` and the skill both read it, and nothing reads an error's wording.

Out of scope: #104, #105, #109, #115, #118, #119. Not touched: `templates/`, the unattended section, `hooks/`, `scripts/redline-guard.sh`, `scripts/redline-gh.sh`, `tests/gh-test.sh`. Of `scripts/`, only `redline-prefs.sh` changes (decision 12's rider).

## Decisions

Given with the brief, not reopened:

1. The problem is #117's: a reshape resumed after a shape-stage stop other than the hold is told to rewrite the spec folder's four files from scratch, in a folder that by then can hold the entries and tasks written for decisions the person or the autopilot made. After this spec no rerun is told to rewrite a folder that can hold a decided entry.
2. Settle it by class, not by stop. Before planning, shape.md holds a table of every label a run can resume at (resumeLine in workflows/redline-loop.js, and every stageError that names a label), and for each: which stops can end there, what the spec folder and the pull request hold at that moment and who wrote it, what the resume line tells the agent today, whether each sentence of it is true for that stop (including "the person has since fixed the cause by hand"), and what it tells the agent after this change. Measured by running the loop test's scenarios, not traced. A label or a sentence the issue does not name is in scope. The reason is on #75 (the Nov 20 comment) and in the by-hand rounds of #112 and #114.
3. The rewrite-from-scratch sentence stays for a round's first shape (shape r<n>, shape h<n>) only if the table shows no decision can be on disk when it is resumed. If the table shows one can, stop and tell me.
4. The replay standard holds: a resume changes exactly one prompt, a first run's prompts are byte-identical to today's, and the loop test proves both with a sweep as well as a check.
5. The loop case "a reshape resumed after another stop keeps the shaper's own resume line" is changed to expect the new sentence, beside a case that a first shape's resume still rewrites. Every row of the table that changes has a case seen red first, and each new pin is seen red under a mutation.
6. The shaper's rule 9 in agents/redline-shaper.md, the replay standard's resume clause and docs/running.md say what the workflow then does, in the same commits as the code they describe.
7. Out of scope, do not fix here: #104, #105, #109, #115, #118, #119. If a change here touches what one of them describes, say so in shape.md and leave it.
8. Not touched: templates/, the unattended section, scripts/, hooks/ and tests/gh-test.sh. skills/ is touched only if question a says so.
9. The version is bumped as the release standard says; I expect a patch, 0.4.5.
10. If any .sh file changes, run CI's shellcheck command (shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh) before the first commit and after the last.
11. No AI attribution anywhere.

Answered during shaping (2026-11-22):

12. **a. Both read the field.** A stop that is the workflow's own check of what an agent returned sets one field where it is raised. The error result returns it, the run marker carries it, the skill copies it into the resume entry, and `resumeLine` and the skill's error section both read it. This closes #116 whole.

    The cost that decided the files: a fact about a stop reaches the rerun by one road only, error result → the harness's record → the marker → the skill → `args.resume[label]`. `scripts/redline-prefs.sh run save` writes the marker and copied `stage`, `label`, `attempt` and `error` only, so a field the skill alone reads needs no script change and a field `resumeLine` reads does.

    Rider (the user's): decision 8 is lifted for `scripts/redline-prefs.sh`, `docs/scripts.md` and `tests/prefs-test.sh` only. The guard, the hook and `scripts/redline-gh.sh` stay untouched, and decision 10's shellcheck command runs before the first commit and after the last.

    The class is wider than #116 names. It names two openings, `the resolve agent ` and `the reshape left `. The table shows the shaper's result checks are the same kind of stop at a first shape and at a reshape: nothing a person can fix by hand, and the rerun corrects it.
13. **b. The sentence alone.** A resumed reshape's result is not checked for the decided entries. Three reasons. The gap is every reshape's, and the resolve's own write, so checking the resumed one alone is the instance. A stop could not be repaired by its rerun: the reshape prompt names each decided id and its end, never the choice, notes and date. And an entry has no fixed form, so a `git grep` can only count owner lines. The gap is under "Left alone", and an issue for the class is drafted under "For you to open".
14. **c. Two clauses at a reshape**, chosen by the label and the field. After the workflow's own check (the hold, a result check): correct what the error names. After any other stop (the spec check, a crash): restore what is missing. Neither says from scratch, and both apply in a round with no decision too, whose reshape prompt already says "correct them in place".

    The spec check does not carry the field. A missing file can be a refused Write, which a person does fix (PR #54 round 2; #76). So the field's sites are seventeen: the resolve's eight, the hold, and the shaper's eight result checks. (Question a said nine result checks. Counted, they are eight throw sites, and the ninth shape-stage site is the spec check.)
15. **d1. No fallback to wording.** An entry with no field is an ordinary stop, whatever its error says. The user's reason: no run is in flight anywhere, so a fallback protects nothing and keeps the wording reads this spec removes. Rider: the existing resume cases change only by gaining the field on their entries.

    The cost, said to the person in `docs/upgrading.md`: `args.resume` keeps every earlier entry and each one's line is rebuilt on every relaunch. A marker written before 0.4.5 has no field. A run that had already resumed at a resolve check or at a reshape, stopped again later and is relaunched after the update, builds a different line for that step, so the step and everything after it run again.
16. **d2. Three named exceptions in the sweep, plus decision 17's.** 24 scenarios of the loop test pass a resume entry. Four stopped at an own check and gain the field: 5 (`resume: a stop at resolve, resumed`), 9 (`resume: shape stage relaunch`), 22 (`reshape: an override to fix whose task the reshape removed, resumed`) and 24 (`reshape: a fix left with no task and an accept left with one, resumed`). Scenario 23 (`reshape: a reshape of a decided round that left no shape.md, resumed`) is the one decision 5 names. Under decision 14 the hold's clause is widened, so 22 and 24 build a different resumed prompt as well as 23. The field stays yes or no: keeping the hold's bytes would need a field with two values, and with no run in flight it would buy no replay.
17. **d3. A first shape resumed after an own check says nothing was fixed by hand.** It gains the sentence the other two labels carry, before from-scratch, so the skill's report and the rerun's line agree. Scenario 9 is the fourth exception. The other two things the table shows false stay: "a written file stands" beside from-scratch is under "Left alone", and a crash is under "Left alone" and drafted under "For you to open".

Settled by the design:

18. **The field is `ownCheck`, a boolean**, on the error result beside `resumeFrom`, in the marker and in the resume entry under the same name. An absent one reads as false everywhere: a marker or an entry written before 0.4.5, and a result of a script before it.
19. **A reshape is known by its label**, `reshape ` after the shaper's agent type, which is the workflow's own name for the step and no part of an error. The clause does not turn on whether the round has a decision: `resumeLine` cannot see the round's decisions, and correcting in place is right for every reshape.
20. **Decision 6 and the retrospective are two things.** The replay standard's resume clause changes in the commits of the code it describes (decision 6). What the spec taught is put to the user at the gate and lands in its own commit.

As built (2026-11-22; `plan.md`, "As built", has the commits, the sweep and the mutations):

21. **Tasks 4 and 5 landed in one commit**, `a7b99a2`.
22. **The skill's resume question says it too**, for an `error` marker whose `ownCheck` is true: the fourth place in the skill, beside the marker's keys, the resume entry and the error section.
23. **The seventeen sites are pinned by a rule over every scenario's result**, with a check that each stop is reached and two source counts, in place of a check per site.
24. **Every error result holds `ownCheck`**, false where the stop cannot be resumed.
25. **The sweep's exceptions are the four named and two that differ only in a refusal's text**: the malformed-entry message names the new key.
26. **Standards retrospective: seven edits applied**, E1 to E7, in `c4b430f`: the road a stop's fact travels and the cost of rewording a resume sentence (`workflow/replay.md`); counts measured before they are stated, mutations run against a copy, and a field pinned over every result (`testing/tests.md`); a standards sentence that describes the code changes with the code (`process/standards-retrospective.md`); and a change to what an older stopped run does gets an upgrade section (`process/docs-gate.md`).

## The table (decision 2)

Method: `tests/loop-test.mjs` was loaded in memory with `go()` exposed, on `main` at `8cf1595` (618 scenarios, 1614 checks, 0 failed), with no file written. Every stop below was produced by a run, and every line was read off the relaunch's prompt. Where a row cites a count, it is over those 618 scenarios or over the runs named.

### The line, sentence by sentence

- **S1** `Resume attempt <n> of this step.`
- **S2** `The run stopped at this step with an error (<error>);`
- **S3** `the person has since fixed the cause by hand.`
- **S4** `Do the step again from the current state of the repository and the PR.`
- **S5** `What an earlier attempt already made stands (a commit, a posted review or reply, a written file), and the duplicate checks in your instructions apply.`
- **From-scratch** (the shaper): `Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote; never change or remove anything under its redline/ folder.`
- **Correct-task** (the shaper, when the error opens `the reshape left `): `When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md and shape.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct the task the error names, and return the whole result again; never change or remove anything under its redline/ folder.`
- **Resolve-correct** (the resolve agent, when the error opens `the resolve agent `): the same opening, then `read shape.md and plan.md as that attempt left them, the entries it already decided and the tasks it already wrote included, correct what the error names, and return the whole result again.`
- **Comment check** (the three Finish comments) and **commit check** (the record commit): look for what an earlier attempt posted or committed first.

S1, S2 and S4 are true at every stop measured.

### Every label a run can resume at

A decided round with a bounce and the coverage pass on was run once to the end (28 calls), then once per label with that label's call returning nothing. 26 labels are resumable; `gather r<n>` is not (`resumeFrom` null). Every relaunch with the resume entry changed exactly one prompt and finished. The other stops are the 618 scenarios' own, grouped by the label they resume at.

| Label | Stage | Stops that end there | The folder and the pull request at that moment | After S1 to S5 today | S3 | After this spec |
|---|---|---|---|---|---|---|
| `coverage r<n>` | review | returned nothing; the Skill tool denied; no such skill; no fenced JSON array | The round's folder holds `redline/` only (the start snapshot in round 1). Nothing of this round is posted. | nothing | true for a denied tool or a missing skill (the person allows or upgrades); false for returned nothing | same |
| `review r<n>`, `re-review r<n>`, `final nit pass r<n>` | review | returned nothing | as above | nothing | false: nothing to fix | same |
| `post r<n>` | post | returned nothing; posting failed | The findings and review files under `redline/`, written by the GitHub agent. The review may be posted. | nothing | true when GitHub refused (auth, an anchor); false for returned nothing | same |
| `shape r<n>`, `shape h<n>` | shape | eight result checks: a finding left out; the other pass's values (three messages); an ask with no call; a call for a non-ask; `why_human` outside the cases; a decline with no reason; a deferral with no draft | The round's review is posted. The four files as the failed attempt left them, all the shaper's own. No decision of the person or the autopilot (below). | from-scratch | false: the rerun corrects it | **the own sentence, then from-scratch** |
| same | shape | the spec check (no `plan.md`, no `shape.md`, no Decisions section); returned nothing | as above, less what the check missed | from-scratch | true when a Write was refused and the person changed the mode; false otherwise | same, byte for byte |
| `spec status <tag>[ #k]` | shape | returned nothing; the check itself refused | as its shape or reshape left it | nothing | true for a refused command | same |
| `resolve <tag>[ #k]` | resolve | eight `the resolve agent ...` checks | The pending entries and tasks turned into decided ones by the failed attempt, each ending `Decided by: @<login>` or `Decided by: redline (autopilot)`. | resolve-correct, by the error's opening | false, and the clause says so | the same words, **chosen by the field** |
| same | resolve | autopilot could not apply; returned nothing | as above for a crash, possibly half written; pending entries kept for the autopilot stop | nothing | may be true for the autopilot stop; false for returned nothing | same |
| `plan approver <tag>[ #k]`, `standards approver <tag>[ #k]` | approve | returned nothing; not approved after the cap | The decided folder, read only by this step. | nothing | may be true at the cap (a hand edit inside the spec folder is accepted); false for returned nothing | same |
| `reshape r<n> #k`, `reshape h<n> #k` | shape | the hold (`the reshape left ...`) | The entries and tasks the resolve agent wrote for the round's decisions, then the failed reshape's edits. | correct-task, by the error's opening | false, and the clause says so | **the own clause, by the label and the field** |
| same | shape | the eight result checks | same | **from-scratch** | false | **the own clause** |
| same | shape | the spec check; returned nothing | same, less what the check missed, or half written | **from-scratch** | true only for a refused Write | **the restore clause** |
| `snapshot <tag>` | snapshot | returned nothing; the write failed | the approved plan; `redline/snapshot.json` or none | nothing | true for a refused Write | same |
| `baseline`, `check <tag>`, `recheck <tag>` | check | returned nothing; an unreadable result; a usage error; still failing after one repair | The round's commits, the implementer's, on the local branch. | nothing | true for a gate fix committed under `.claude/` (the entry's `hand` list carries it); false for an unreadable result | same |
| `implement <tag>`, `repair <tag>` | implement | returned nothing; blocked | as above, possibly part built | nothing | true when a block was cleared outside the run | same |
| `file deferred <tag>` | defer | filing failed; no filing returned for an id | The drafts under `redline/`. Issues may be open. | nothing | true when GitHub refused; false for a filing left out | same |
| `push and reply <tag>`, `deferred replies <tag>` | push-and-reply | returned nothing; the push or the replies failed | The commits may be pushed and the replies posted. | nothing | true for a rejected push | same |
| `last round`, `PR description`, `resolve threads`, `record files` | finish | returned nothing; the operation failed | Every round built and pushed. | nothing | true when GitHub refused | same |
| `handoff comment`, `cap-hit comment`, `summary comment` | finish | returned nothing; the comment or the review request failed | The comment may be posted. | the comment check | true when GitHub refused | same |
| `record commit` | finish | returned nothing; the commit or the push failed | The record may be committed. | the commit check | true for a rejected push | same |

S5 is true at every label but the shaper's with from-scratch: it says a written file stands, and the next sentence says to replace what the earlier attempt wrote.

### The reshape, by kind of stop

`reshape r1 #1` was stopped eleven ways in each of three rounds: one with an override to fix (plan dial), one where the autopilot took a recommendation, one with no decision. `resolve r1` ran before the reshape in the first two, so the folder held decided entries at every stop.

| Kind | Messages | Rerun told today | After this spec |
|---|---|---|---|
| The hold | `the reshape left R1-1, which <says who> as a fix, with no task with files` | correct-task | the own clause |
| A result check | a finding left out; an ask with no call; a call for a fix; `why_human` outside the cases; a decline with no reason; a deferral with no draft | from-scratch, in all three rounds | the own clause |
| The spec check | no `shape.md`; no `plan.md`; no Decisions section | from-scratch, in all three rounds | the restore clause |
| A crash | `reshape r1 #1 returned nothing (...)` | from-scratch, in all three rounds | the restore clause |

- The hold cannot stop a round with no decision; the other ten stops did, and each rerun was told from-scratch beside a reshape prompt that says "correct them in place".
- A human pass: `reshape h1 #1`, with `resolve h1` before it, was told from-scratch after a missing `shape.md` and after returned nothing.
- The last error wins: a reshape resumed after the hold (attempt 2) that then failed the spec check was told from-scratch on attempt 3.
- 90 reshape calls run over the 618 scenarios; 71 of them run after a resolve of the same pass.

### Decision 3: can a decision be on disk when a first shape is resumed?

No.

- 619 first-shape calls run over the 618 scenarios. None runs after a resolve of the same pass.
- 17 stops are resumable at a first shape. None sits in a launch whose args answer that pass (a decision or a deferral answer for one of its ids).
- 222 scenarios carry answers a relaunch adds (`decisions`, `approvedPlans`, `deferrals`). Each was run again without them, and the 228 first shapes compared vetted the same both ways: 0 differ. So a launch that got past a first shape cannot stop at it on a relaunch. The shaper's result and the spec check replay, and `vetShape` reads nothing a relaunch adds.
- The folder name carries the launch stamp to the minute (`stamp`, from `args.launchedAt`), so another run's round is another folder.

The from-scratch sentence stays for `shape r<n>` and `shape h<n>`.

### What reads the folder

- `spec status` runs two `git grep` commands: the four file names, and the `## Decisions` heading in `shape.md`.
- The hold reads the `files` a reshape returns for each decided finding. It never opens `plan.md`.
- Nothing reads a decided entry or its `Decided by:` line, after a resolve or after a reshape. The plan approver's next pass is shown the round's decisions as JSON beside the folder, and the replies and the handoff are written from the run's args.

### The 24 scenarios that pass a resume entry

Resumed at: `recheck r<n>` 8, `record commit` 3, `reshape r1 #1` 3, `resolve r1` 2, `shape r1` 2, `handoff comment` 2, `check r1` 1, `coverage r2` 1, `push and reply r1` 1, and one refused entry (`x`). Four stopped at an own check: 5, 9, 22 and 24 (decision 16).

## The line, as built

S1 to S5 are unchanged for every entry.

| Label | `ownCheck` | Appended |
|---|---|---|
| a first shape | false | from-scratch, today's bytes |
| a first shape | true | ` When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it.` then from-scratch |
| a reshape | true | ` When that error is the check the workflow runs on what the earlier attempt returned, nothing was fixed by hand for it: read plan.md, shape.md, standards.md and references.md as that attempt left them, the entries the person or the autopilot decided and the tasks written for them included, correct what the error names, and return the whole result again; never change or remove anything under its redline/ folder.` |
| a reshape | false | ` This step is a reshape, so the spec folder already holds the plan: read plan.md, shape.md, standards.md and references.md as they stand, keep any entry the person or the autopilot decided and the task written for it, write again what is missing or left unfinished, and return the whole result again. Never rewrite the four files from scratch, never write a decided entry the folder no longer holds from memory (name it in shape.md as lost), and never change or remove anything under its redline/ folder.` |
| a resolve | true | today's resolve-correct clause, byte for byte |
| a resolve | false | nothing |
| every other label | either | as today |

## Left alone

- **"A written file stands" beside from-scratch at a first shape.** S5 and the shaper's sentence disagree on the four spec files. The second sentence is the specific instruction, and rule 9 of the shaper's file says the same. Rewording it would change every first-shape resume.
- **S3 at a stop that is not an own check.** The line says the person fixed the cause by hand after a crash too, where there was nothing to fix. A crash has no field, and cannot be told from another ordinary stop without reading the error.
- **A resolve resumed after a crash** is told nothing about entries and tasks it may have half written, where decision 14 gives a crashed reshape the restore clause. #108, R4-4 settled that the resolve's clause goes by the stop. Drafted below.
- **Nothing reads a decided entry** (decision 13). Drafted below.
- **A missing `shape.md` after a reshape of a decided round.** The restore clause cannot give back a decision's choice, notes and date, so it bans writing one from memory and has the entry named as lost.
- **The out-of-scope issues.** None is touched. #119's first option would add a stop at the resolve that is the workflow's own check, and it would carry the field; that is left to #119.

## For you to open

### 1. Check that a round's spec folder still records each decided finding

**Found.** In a Redline round the resolve agent writes each decision the person made, or the autopilot applied, into the round's `shape.md` as an entry ending `Decided by: @<login>` or `Decided by: redline (autopilot)`, and plans its task in `plan.md`. When the plan approver sends the plan back, the shaper reshapes the folder in place and is told to keep those entries. The workflow reads two things of the folder after either step: that the four files exist and that `shape.md` has a `## Decisions` heading (`checkSpec` in `workflows/redline-loop.js`, two `git grep` commands). After a reshape it also reads the `files` the reshape returns for each decided finding. It never reads an entry or its owner line, and never opens `plan.md`. So a resolve that leaves an owner line out, or a reshape that drops a decided entry, is seen by nothing, and the round's committed record can lack a decision the person made. What is built and posted does not change: the decisions travel in the run's args, the plan approver is shown them as JSON, and the replies and the handoff are written from them.

**Why it was not fixed with the resumed reshape (#117).** The gap is every reshape's and the resolve's own write, so a check after a resumed reshape alone would settle one instance. A stop could not be repaired by its rerun: the reshape prompt names each decided finding and what its decision ends in, never the choice, the notes and the date, so a lost entry cannot be written back from it. And an entry has no fixed form, so a `git grep` can count owner lines and cannot tie one to a finding.

**The fix proposed.** After the resolve and after every reshape of a round with a decision, count the owner lines per owner against the round's decisions and find each decided fix's id in `plan.md`, through the spec-status call, and stop at stage `shape` or `resolve` on a miss. Decide first: which agent restores an entry and from what (the round's decisions as JSON in a resume line, or a rerun of the resolve); whether the entries get a fixed heading so a line can be tied to its finding; and what the check does to the prompts of a run with no resume, since the spec-status prompt after a reshape would change in every round with a decision.

### 2. Tell a step resumed after a crash what its folder may hold

**Found.** When an agent call returns nothing (skipped, stalled on every attempt, or died on an API error), the run stops with an error that can be resumed at that step. The resume line in `workflows/redline-loop.js` (`resumeLine`) then tells the rerun "the person has since fixed the cause by hand", at every one of the 26 labels a run can resume at, though nothing was fixed. Two agents write the round's spec folder. A reshape resumed after a crash is told to read the four files as they stand and restore what is missing. A resolve resumed after a crash is told nothing more, beside a `shape.md` and a `plan.md` in which its earlier attempt may have decided some entries and not others.

**Why it was not fixed with the resumed reshape (#117).** A crash is not the workflow's own check of what an agent returned, so its stop carries no `ownCheck`. At the resolve it cannot be told from the stop where the autopilot could not apply a decision, whose entries stay pending, without reading the error's words, which that spec removed from `resumeLine`.

**The fix proposed.** Decide how a crash is told from the autopilot stop: a second field on the error result for a call that returned nothing, set in `run()` and carried as `ownCheck` is, or one sentence for the resolve that is true after both. Then give a resolve resumed after a crash a clause that says to leave what is already decided and apply what is pending, and say in the line that no hand fix was made for a call that returned nothing.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`; nothing in it changes.

## Standards Applied

- workflow/replay — a resume changes exactly one prompt, and its resume clause is the one this spec rewrites.
- workflow/agents — an agent file states what the workflow's prompt tells its agent (rule 9).
- testing/tests — red before green, a sweep for byte-identity, a mutation per new pin, a stage error pinned by its `resumeFrom` label.
- scripts/bash-conventions — `redline-prefs.sh` changes, with its header and its test.
- process/docs-gate — one entry per touched plugin file, in `plan.md`.
- process/release — a patch bump, both manifests.
- process/standards-retrospective — the gate's last step, in its own commit.
- process/internal-notes — no design record is copied in.
- prompts/attribution — none, in the code, the docs and the two drafted issues.
