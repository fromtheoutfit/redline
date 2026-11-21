# PR #114 review round 2: the path cleanup, the files clause, how an override is named, and a decided fix's own task — Shaping Notes

Shaped by Redline in unattended mode, for review round 2 of PR #114 (issue #106), from the round's six findings (`redline/round-2-review.json`, `redline/round-2-findings.json`). Line numbers are at `b5db022`, the head of the pull request's branch.

## Scope

The round's six findings, nothing more. Four are correctness findings (R2-2, R2-3, R2-4, R2-6, all low). Two are nits (R2-1, R2-5). The verifier confirmed every finding, so none needs a second look.

- `fix`, four: R2-2, R2-4, R2-5, R2-6.
- `defer`, two: R2-1 and R2-3, each with no mitigation. Their drafted issues are under `## Deferred`.
- `decline`, none.
- No `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/`, `scripts/` and `skills/`, the resolve agent's and the plan approver's files, and the Verification Gate's text. This round touches none of them. The version stays `0.4.4`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5; round 1 read it the same way).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the six findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, the pull request's own spec (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/`) and round 1's folder (`agent-os/specs/2026-11-20-2144-114-review-round-1/`); see `references.md`. `agent-os/product/mission.md` is the alignment the pull request's spec already records ("Every verified item is decided, and the real decisions stay with people"); nothing in this round changes it.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 17, 38, 41, 47, 50), workflow/replay (lines 19, 23), testing/tests (lines 7, 16, 30, 35, 36), process/docs-gate (lines 5, 7, 8, 16), process/release (line 5), process/standards-retrospective and prompts/attribution. Each was read at `b5db022` and is copied in `standards.md`.
   Decided by: redline
3. **Is any finding already known?** No. `scripts/redline-gh.sh issues-search` for `fixed by hand`, `resume line`, `reshape`, `error report`, `SKILL.md`, `cleanPaths`, `override`, `from scratch` and `merged task` lists #2, #3, #22, #29, #31, #50, #69, #70, #73, #75, #77, #82, #98, #104, #106, #109 and #115. None covers a finding of this round: #115 is round 1's R1-5, the shown disposition of a decided call, and #104 counts a draft's version. `scripts/redline-gh.sh pr-comments 114` shows only the two Redline reviews. Round 1's folder fixed R1-4 (the files clause) and R1-6 (the path cleanup); R2-4 and R2-2 are what those fixes left, which the reviewer marks `inFixDiff`.
   Decided by: redline
4. **R2-3: did the pull request's spec decide the shaper's resume line on other reshape stops?** Yes, to leave it. Its "Left alone" (`agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/shape.md:115`): "**The shaper's resume line on other reshape stops.** A reshape resumed after another shape-stage stop (a missing spec file, a decline with no reason) is still told to rewrite the four files from scratch, beside entries the resolve agent decided. Only the stops of decision 13 get the correct-what-you-wrote clause. Not changed here." The rewrite sentence predates the pull request (the removed line in its diff of `resumeLine`), and the loop test pins it as it stands (`tests/loop-test.mjs:3444-3445`, "a reshape resumed after another stop keeps the shaper's own resume line"). So the gap is known and set aside, and no issue tracks it: it is worth doing and not here. Sorted as a deferral (Decision 6).
   Decided by: redline
5. **R2-1: is the skill in this pull request's scope?** No. The spec's Scope (`shape.md:7`): "Not touched: everything under `templates/`, the unattended section, `scripts/redline-gh.sh`, `tests/gh-test.sh`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `skills/`, ...". The error report's sentence (`skills/redline/SKILL.md:272`, "say in one line that once the cause is fixed by hand, `/redline:redline <n>` offers to resume from `<label>`") has been read the same way at every resolve-check stop since #99 and #108; `docs/running.md` already tells the person that neither kind of stop needs a hand fix ("so nothing needs fixing by hand first", lines 126 and 127). So the cause is in a file the pull request did not change, and the fix belongs with the whole class. Sorted as a deferral (Decision 5).
   Decided by: redline
6. **R2-2: does the code's own docblock answer which forms the cleanup reads?** Yes. The comment above `cleanPaths` (`workflows/redline-loop.js:481-485`): "so one file written two ways is one file and a list of blanks is no list ... so the holds, the warnings and the list the round keeps compare one form", and the standard says the same (`agent-os/standards/workflow/agents.md:50`, "so one file written two ways is one file"). The code disagrees with that promise for `/r/./app/x.php`, `app//x.php`, `app/./x.php` and a trailing slash, so the disagreement is the fix (point 2). The finding offers two ways: build the cleanup on `relPath`, or narrow the comment and the standard. Narrowing would shrink the promise and leave `relPath`, which the ask rules read, and `cleanPaths` reading `/r/./app/x.php` two ways, against the reason the round's list exists (`plannedFiles`'s comment, 4004-4005: "so the stops, the prompts and the warnings read one fact one way (#103, R3-6)"). So the clear pick is the code (Decision 1).
   Decided by: redline
7. **R2-4: what does the decided round's files clause mean for an ask?** The pull request's spec answers: the block's meaning for the findings it names, and every other ask keeps what every shape prompt asks. Decision 10 (`shape.md:27`): the block says "what `files` means for the ids it names", and "every shape prompt asks, 'for an ask, the paths its recommended change would touch'". Round 1's Decision 4 qualified the Return sentence for that alone: "It keeps the recommended paths for 'an ask still pending' and sends 'a finding named above as decided' to its task". The same Return sentence (`workflows/redline-loop.js:2099`) counts the calls as "every judgment call still pending or newly raised", two kinds, so by its own words "an ask still pending" leaves out an ask the reshape newly raises, which then falls to the general clause's empty list, while `forceAskRules` (3313) matches a paths rule on that list. The words are narrower than the decision, so the words are the fix (Decision 2).
   Decided by: redline
8. **R2-5: what does the code say about whether an override can be one of the round's calls?** That it never is. The comment above `isCall` (`workflows/redline-loop.js:3904-3907`): "An override is never one of the round's calls (overridesFor). Whether a decision is a call's or an override's, read one way for the stray warnings and the named-check stops (#108, R3-6): `newCalls` is always within `calls`, and `overridesFor` never takes a call." `overridesFor` (3796) never takes a call, but `raised` (4143) takes every call a reshape returns whose id is not in `calls`, an override's finding included, and `calls = calls.concat(raised)` (4168) adds it. `openRaised` (4161) keeps it out of the stop only because it is in `decisions`. From then on `isCall` (3908) and the hold's `saidBy` (4132), which reads `calls` the same way, name the override as a call's decision. The comment's premise is what the code does not keep, so the fix reads the round's own overrides (Decision 3).
   Decided by: redline
9. **R2-6: what does the pull request promise about the hold after a reshape, and what does it say about the reshape's return?** The promise, `docs/running.md:127`: "The decision is held to its task after each reshape, as it is when the resolve agent first plans it". At resolve time a task counts for the finding it names (`taskFilesOf`, `workflows/redline-loop.js:490`), and the resolve agent is told so (`agents/redline-resolve.md`, step 2: "`fix` plans the full fix as a task of its own, its `finding` set to the override's id ... a fix folded into another finding's task stops the run"). The reshape's return is a list of `files` per finding, with no task list, by the spec's decision 10 ("The reshape prompt gains one block, only in a round with a decided finding, saying what `files` means for the ids it names") and the replay standard (`workflow/replay`, line 23: "a block that only says what an existing field means for the findings it names needs no new key"). So the hold cannot see which task names a finding, and the reshape is never told what the resolve agent is told. The docs promise more than the reshape is asked for: the fix tells the reshape the resolve agent's rule, in the block and the agent file, and the docs say what the hold reads. A task list in the reshape's return, the finding's other option, is the approach the spec chose against, so it is not taken (Decision 4).
   Decided by: redline
10. **This round edits `workflows/redline-loop.js` and `agents/redline-shaper.md`** again, as round 1 did. A relaunch of this run runs the script it launched with, and later rounds run under the edited agent file, which the skill lists (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"; README Known limits). Rule 10 of the agent file gains one clause, which agrees with the prompt either way: a block that states it, or one from before this round that does not.
    Decided by: redline
11. **Scratch test.** None written. There is no PHP in this repository, and every question above was settled by reading the files cited. The new cleanup was traced by hand, form by form (Decision 1's table); the harnesses run through `.claude/redline/checks.sh` only, and no role runs an interpreter.
    Decided by: redline

## Decisions

1. **R2-2: fix.** `cleanPaths` (486) is built on `relPath` (527), which moves up beside it unchanged, so the cleanup and the ask rules take a root and a leading `./` off one way. Before `relPath`, each path is trimmed, its runs of slashes are made one and its `./` segments are folded. After it, a trailing slash is dropped, and so is a blank or a bare `.`. The comment says what it reads and what it read until R2-2. `relPath` itself, which `ruleForPaths` reads, is unchanged: folding separators there would change which paths a paths rule matches, a question no finding of this round raises. The standard's clause that lists the forms (`agent-os/standards/workflow/agents.md:50`) is corrected through standards item 1, in the round's standards commit, which names R2-2. Each form gets a case of its own (`testing/tests`, line 30), each seen red before the change, where the clause it turns on is missing, and one case reads a resolve's task written another way.

   | Path as listed | `cleanPaths` at `b5db022` | After R2-2 |
   | --- | --- | --- |
   | `/r/./app/x.php` | `./app/x.php` | `app/x.php` |
   | `app//x.php` | `app//x.php` | `app/x.php` |
   | `app/./x.php` | `app/./x.php` | `app/x.php` |
   | `./app/x.php/` | `app/x.php/` | `app/x.php` |
   | `app//x.php/` | `app//x.php/` | `app/x.php` |
   | `./app/x.php`, `/r/app/x.php`, ` app/x.php ` (R1-6's forms) | `app/x.php` | `app/x.php` |
   | `''`, `./`, `/r/` | dropped | dropped |
   | `.` | `.` | dropped |

   The harness's repository root is `/r` (`tests/loop-test.mjs:357`). No existing scenario scripts a path with a doubled slash, a `./` segment or a trailing slash (searched every `files:` list), so no existing check changes its expectation and no prompt of an existing scenario changes. The neighbours stand: R1-6's forms (`sameFileAnotherWay`, 3419-3420) and a task moved to another file, still a change (`fixMoved`, 3427-3428; `moved`, 3316-3317).
   Decided by: redline
2. **R2-4: fix.** `FILES_ASK_DECIDED` (925) names the asks it keeps the recommended paths for by the block's own test: "for an ask not named above as decided". That covers an ask still pending and one the reshape newly raises, and leaves "a finding named above as decided" to its task. The comment above it (919-924) says why. The test constant `FILES_DECIDED` (`tests/loop-test.mjs:375`) follows the words, so the two checks that read it, `withoutBlock`'s comparison (3348) and the one-meaning check (3349, renamed to say what it now asserts), are red before the change. One new check reads the reshape prompt of a decided round that raises a call (`raisedStop`). Only reshape prompts that carry the block change, and those are new in this pull request (`workflow/replay`, line 23). The workflow's second layer, `forceAskRules` reading a finding's listed files, is already pinned (`viaFiles`, `tests/loop-test.mjs:1435-1436`). The mock answers `files` by scenario key and never reads the clause, so a forcing pin in a decided round would hold before and after: the fix's tests are the prompt's words, as R1-4's were.
   Decided by: redline
3. **R2-5: fix.** One helper, `isOverride`, right after `let overrides = overridesFor(calls)` (3797), reads the round's overrides as they entered, a list nothing reassigns. `isCall` (3908) becomes its negation, and the hold's `saidBy` (4132) reads it, so the stray warnings, the named-check stops and the hold name an override one way (#108, R3-6). The comment above `isCall`, whose premise is false once a raised call joins `calls`, is rewritten (`workflow/agents`, line 17). For the hold's case the reshape mock gains `scenario.reshapeFilesAt[label]`, a task one reshape alone changed, since `reshapeFiles` is read by every reshape and a later reshape's hold needs an earlier one that keeps the task. No existing scenario sets it, and no existing scenario returns a call for an override's finding, so no existing check moves. The neighbour pins stand: `namedStray` (3533-3534) for a real call's wording and `overrideBuilt` for an override's. What changes is a message's words, and no prompt. The second resolve that the raise sets off for the override is the path #97, R2-14 built for a raised call; whether a reshape's call for an override's finding should set one off at all is not this finding's question, and nothing here changes which agents run.
   Decided by: redline
4. **R2-6: fix, by telling the reshape the resolve agent's rule.** The block (2083) gains one sentence after its fix and accept rule: "A decided fix keeps a task of its own, one that names it; a task counts only for the finding it names, so never list one task's files for two findings." The comment above `reshapePrompt` and the hold's comment say why. Rule 10 of `agents/redline-shaper.md` gains the same rule (`workflow/agents`, line 17). `docs/running.md`'s bullet says what the reshape is told and that the hold reads the files the reshape lists for each finding, so its promise no longer reaches past what the run checks. Three key-phrase pins: the block, the agent file and the docs. The existing pins (`keeps a task with files`) stay. The block is new in this pull request, so no prompt of a round without a decided finding changes, and the `withoutBlock` check still holds, since the sentence sits inside the block. A reshape that ignores the sentence still meets the failure the finding traces, a stop at the check after a repair. That stop is loud and posts nothing wrong, and a structural check would need the task list answer 9 sets aside.
   Decided by: redline
5. **R2-1: defer, with no mitigation.** The cause is the skill's error report (`skills/redline/SKILL.md:272`), in a file this pull request did not change and whose spec lists `skills/` as not touched (answer 5). Every resolve-check stop has met the same sentence since #99 and #108, and this pull request adds one more stop to that class. No cheap mitigation fits inside the pull request: `docs/running.md` already says both stops need no hand fix, and the skill is the only text the person meets at the stop. Drafted issue under `## Deferred`.
   Decided by: redline
6. **R2-3: defer, with no mitigation.** The pull request's spec set it aside (answer 4). Widening the correct-in-place clause changes the resume prompt of every reshape stop, needs wording that fits each stop's error rather than "the task the error names", and changes the expectation of the case that pins today's sentence (`specRestored`). No cheap mitigation helps a person at the stop: a code comment would tell no reader the run meets. Drafted issue under `## Deferred`.
   Decided by: redline
7. **Task order.** Tasks 2 to 5 all change `workflows/redline-loop.js` and `tests/loop-test.mjs`, in different places. Task 2 moves `relPath` up, so every later line number in the workflow file moves by a few lines: each task names its anchors by text, as the tasks before it leave them. Task 4 changes the mock's `taskOf` line (`tests/loop-test.mjs:223`), which no other task touches. Tasks 4 and 5 both touch the hold, Task 4 its `saidBy` line and Task 5 the comment line above `const heldIds`.
   Decided by: redline

### Proportionality

- **R2-2.** Unlikely: it needs an agent that writes a path in one of the four forms. Visible when it fires: a false `the reshape changed` warning in the run's result and the cap's `reshaped` detail, and the odd form shown to every later reader. Cost: one line moved, one line rewritten, one comment, five loop runs with five checks. All inside code this pull request wrote (R1-6). In proportion.
- **R2-4.** Unlikely: it needs a round with a decided finding, a bounced plan, a reshape that raises an ask whose recommended change touches a paths-rule glob while its own file does not, and a model that reads "still pending" narrowly. When it fires, the workflow does not force the call, and on autopilot the call can be decided, then bounced by the plan approver or stopped at implement by the guard, the two layers behind it. Cost: one constant's words and its comment, one test constant, one renamed check, one new check. Inside code this pull request wrote (R1-4). In proportion.
- **R2-5.** A nit. Only a message's words change, and only after a reshape returns a call for a finding the person overrode, against its prompt. Cost: one helper, two predicates, one comment, a mock key, two runs. In proportion.
- **R2-6.** Unlikely: it needs an adjustment that merges two decided fixes' tasks, a reshape that lists the merged task's files for both, and a merged commit that names only one. When it fires, the round stops at stage `check` after a repair, and that stop's resume starts at the build and cannot replan. Cost: one sentence in the block, one clause in the agent file, one docs sentence, two comment lines, three pins. Inside code this pull request wrote. In proportion. The structural option, a task list in the reshape's return held through `taskFilesOf`, adds a key to the shaper's schema, which every shaper call carries, and the spec chose against it (answer 9).
- **R2-3.** Unlikely: it needs a reshape in a decided round that stops on another shape-stage check, then a rerun that drops a decided entry. When it fires, the person's recorded decision in `shape.md` and its task can be lost, and only a decided fix's task is caught again by the hold. The full fix changes every reshape's resume line and a pinned case, for a stop class this pull request did not add. Deferred (unattended section, point 4: "a gap that predates it").
- **R2-1.** A nit, in a file outside the pull request, for a class of stops older than it. Deferred.

## Declined

None.

## Deferred

### R2-1: say in the skill's error report when a resumable stop needs no hand fix

- **title:** Tell the person when a resumable stop needs no hand fix before the relaunch
- **mitigation:** (empty: nothing ships in this pull request)
- **found:** When a Redline run stops with an error it can resume from, the `/redline:redline` skill's error report (`skills/redline/SKILL.md`, section `error`) always says that once the cause is fixed by hand, `/redline:redline <n>` offers to resume from the stopped step, and that a hand fix touching anything outside `.claude/` means a fresh run. Two kinds of stop are the workflow's own check of what an agent returned and need no hand fix: an error that opens `the resolve agent ` (a stated or named disposition that the same resolve's tasks or entries cannot support, or a deferral with no entry, since #99 and #108), and an error that opens `the reshape left ` (a reshape that left a decided fix with no task, or a decided accept with one, since #106). For both, the resume line in `workflows/redline-loop.js` (`resumeLine`) tells the rerun agent that nothing was fixed by hand and to correct what it wrote, and `docs/running.md` tells the person "so nothing needs fixing by hand first". The skill still tells them to fix the cause first, so a person may edit `plan.md` in the spec folder by hand, or start a fresh run, when a plain relaunch was all the stop needed.
- **why:** The report's wording predates the pull request it was found in. That pull request added one more stop of this kind, the hold of a decided finding to its task after a reshape, and did not set out to change the skill. The wording belongs with the whole class, the resolve-check stops included, as a change to the skill's error section of its own.
- **fullFix:** Have the workflow say in an error result that the stop is its own check of an agent's result, chosen where `resumeLine` already chooses its clause (an error opening `the resolve agent ` at a resolve step, or `the reshape left ` at a reshape), for example as a field beside `resumeFrom`, so the skill reads a field and never the error's words. Then, in the `error` section of `skills/redline/SKILL.md`, say for such a stop that `/redline:redline <n>` resumes from the step as it stands with nothing to fix by hand, and keep the current sentence for every other resumable stop. Add loop cases for a resolve-check stop, a reshape-hold stop and an ordinary stop, and pin both wordings of the skill by key phrase.

  Decided by: redline

### R2-3: tell a reshape resumed after any shape-stage stop to correct its spec folder in place

- **title:** Tell a reshape resumed after any shape-stage stop to correct its spec folder in place
- **mitigation:** (empty: nothing ships in this pull request)
- **found:** In a Redline round, a plan the plan approver bounces goes back to the shaper as a reshape (label `reshape r<n> #<k>`). Its prompt says to read the spec folder's four files, correct them in place, and keep every decision the person made or the autopilot applied. When that reshape stops at stage `shape`, the relaunch resumes at it, and `resumeLine` in `workflows/redline-loop.js` appends the shaper's resume sentence: "Rewrite plan.md, shape.md, standards.md and references.md in the spec folder from scratch, replacing what the earlier attempt wrote". The stop can be a missing `shape.md` or `## Decisions` section, a decline with no reason, a deferral with no drafted issue, or a `why_human` outside the round's cases. In a round where the person or the autopilot decided a finding, the folder by then holds the entries and tasks the resolve agent wrote for those decisions, each ending `Decided by: @<login>` or `Decided by: redline (autopilot)`. So the rerun is told two contradictory things, and a rewrite can drop the record of the person's decision and the task planned for it. Only a stop whose error opens `the reshape left ` gets the sentence that says to correct the task in place. A resume keeps the last error, so a reshape resumed after that stop that then fails another check is told to rewrite on its next resume. A decided fix that loses its task is caught again by the hold after the reshape, and nothing checks that `shape.md` still records the decision.
- **why:** The rewrite sentence, and its use on every shaper resume, predate the pull request this was found in. That pull request added only the narrow exception for its own new stop and recorded the rest as left alone in its spec ("The shaper's resume line on other reshape stops ... Not changed here"). Widening it changes the resume prompt of every reshape stop, needs wording that fits each stop's error rather than "the task the error names", and changes a loop case that pins today's sentence.
- **fullFix:** In `resumeLine`, give a shaper resumed at a reshape label (`opts.label` starting `reshape `) a sentence that says to read the four files as the earlier attempt left them, keep every entry the person or the autopilot decided and the tasks written for them, correct what the error names, and return the whole result again. Keep the rewrite sentence for the first shape of a round (`shape r<n>`, `shape h<n>`), which runs before any decision, and keep the hold's own clause or fold it into the new one. Update rule 9 of `agents/redline-shaper.md`, the replay standard's resume clause and `docs/running.md`. Change the loop case `a reshape resumed after another stop keeps the shaper's own resume line` to expect the new sentence, beside a case where the first shape's resume still rewrites.

  Decided by: redline

## Standards retrospective (proposed)

Listed from Decisions 1 to 7 and the unattended answers; nothing went red while shaping. Item 1 carries part of R2-2's fix and is named in the standards commit's message (`finishing R2-2`). Items 2 to 5 are lessons and finish no finding. Each clause is read back in its whole line once applied (process/standards-retrospective, line 10).

1. **`agent-os/standards/workflow/agents.md`, line 50: contradicts the code once R2-2 lands.** In the line's last clause, replace

   ```
   each path trimmed, the repository root or a leading `./` taken off and a blank dropped (`cleanPaths`)
   ```

   with

   ```
   each path trimmed, its repeated slashes made one and its `./` segments folded, the repository root and then a leading `./` taken off as the ask rules take them (`relPath`), a trailing slash dropped, and a blank or a bare `.` dropped (`cleanPaths`)
   ```

   and append, after `until #114, R1-6` at the end of the line:

   ```
   ; and a cleanup that promises one file written two ways is one file is traced through every form it names and every way they combine: R1-6's took off the root or a leading `./`, never both, and kept `app//x.php`, `app/./x.php` and a trailing slash as written, so a reshape that wrote the resolve's file one of those ways was still warned about as a change, until #114, R2-2
   ```

2. **`agent-os/standards/workflow/replay.md`, line 23: missing (R2-4, Decision 2).** Append, after `until #114, R1-4` at the end of the line:

   ```
   ; and the qualified clause names what it covers by the block's own test (an ask not named above as decided), never by a state word the same prompt uses for a narrower set: `an ask still pending` left out an ask the reshape newly raises, which the same Return sentence lists beside the pending ones, until #114, R2-4
   ```

3. **`agent-os/standards/workflow/agents.md`, line 41: missing (R2-5, Decision 3).** Append, after `until #97, R4-4` at the end of the line:

   ```
   ; and what a decided finding is to the round, a call or a disposition override, is read from what the round recorded when the decision entered (its overrides), never from a list a later pass grows: a reshape's call for an override's finding joined `calls`, and the resolve it set off and every later reshape's hold named the override as a call's decision, until #114, R2-5
   ```

4. **`agent-os/standards/workflow/agents.md`, line 38: missing (R2-6, Decision 4).** Append, after `until #114, R1-3` at the end of the line:

   ```
   ; and a hold that reads a list per finding is matched, in the block, by the rule that makes the list per finding, as the agent that first planned it is told: a decided fix keeps a task of its own and a task counts only for the finding it names, since the hold after a reshape reads the files the reshape lists and cannot see which task names them, so a merged task listed for two decided fixes passed it, until #114, R2-6
   ```

5. **`agent-os/standards/testing/tests.md`, line 7: missing (R2-5's mock key, Decision 3).** Append, after `and no earlier scenario with a bounce and a decision changed its outcome (#106)` at the end of the line:

   ```
   ; and a task one reshape alone changed is scripted by that reshape's label (`reshapeFilesAt`), so a scenario can keep a task through one reshape and change it at the next, which a later reshape's hold needs (#114, R2-5)
   ```

Already in a standard, no edit:

- A case per form, each turning on one clause and seen red where the clause is missing (`testing/tests.md`, line 30): R2-2's cases, Decision 1.
- A comment that restates a rule changes with it, and a rule a prompt states is stated in the role's agent file (`workflow/agents.md`, line 17): Decisions 2, 3 and 4.
- A rule over every prompt is pinned over every scenario (`testing/tests.md`, line 16): `doubleFilesAsk` still reads every reshape prompt with the block, Decision 2.
- Red before green (`testing/tests.md`, line 35): every new check of Tasks 2 to 5 fails before its change.
- A docs change needs no Docs entry of its own (`process/docs-gate.md`, line 16): Task 5's sentence.
- The resume line's current clause choice (`workflow/replay.md`, line 19) stays true; R2-3's drafted issue carries the change.

No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, as the pull request's spec records it: a decision the person made is held to the task the plan carries for it, and the reshape is told the same rule the resolve agent is (R2-6); what the run says about a decision names its owner rightly (R2-5); and a path is one file however an agent writes it (R2-2).

## Standards Applied

- workflow/agents — line 17, a rule a prompt states is changed in the agent file and in every comment that restates it (R2-4, R2-5, R2-6); line 38, the hold after each reshape (R2-6); line 41, a value a later pass rebuilds keeps what an earlier pass recorded (R2-5); line 47, every agent the list reaches is shown the same list, now in one form (R2-2); line 50, a list is asked for in one meaning, and read through one cleanup (R2-2, R2-4).
- workflow/replay — line 19, the resume line's clause is chosen by the stop (R2-3, left); line 23, a new ask sits in the block, and a sentence outside it is qualified under the block's condition (R2-4, R2-6).
- testing/tests — line 7, a reshape mock answers what the prompt asks and scripts a changed task by key (R2-5's `reshapeFilesAt`); line 16, a rule over every prompt is pinned over every scenario; line 30, a case per form (R2-2); line 35, red before green; line 36, the byte-identical claim (no prompt of a round without a decided finding changes).
- process/docs-gate — one Docs entry per touched plugin file, in its task; a docs change needs none of its own.
- process/release — no bump in a review round of the same pull request.
- process/standards-retrospective — the edits are proposed here and applied in one commit; an appended clause is read back in its line.
- prompts/attribution — none anywhere, the drafted issues included.
