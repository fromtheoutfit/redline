# PR #103 review round 3: what the skill says shipped, and one reader of a decided finding's task — Shaping Notes

Shaped by Redline in unattended mode, for review round 3 of PR #103 (issue #100), from the round's seven findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). Line numbers are at `96f014f`, the head of the pull request's branch.

## Scope

The round's seven findings, nothing more. One is a correctness finding (R3-4, low severity). Six are nits (R3-1, R3-2, R3-3, R3-5, R3-6, R3-7). The verifier confirmed every finding, so none needs a second look.

- `fix`, five: R3-1, R3-2, R3-3, R3-5, R3-6.
- `defer`, one: R3-4, with nothing shipped now.
- `decline`, one: R3-7.
- No `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/` and `scripts/`, every file under `agents/`, and the Verification Gate's text. This round touches none of them. The version stays `0.4.1`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the seven findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, the pull request's own spec (`agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/`) and the spec folders of rounds 1 and 2 (`agent-os/specs/2026-11-17-1643-103-review-round-1/`, `-round-2/`); see `references.md`. `agent-os/product/` exists, but nothing in this round changes what Redline promises, so it adds no constraint.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 9, 16, 39, 46, 49), workflow/replay (line 21), testing/tests (lines 7, 14, 28, 33), process/docs-gate (lines 5, 8, 16), process/release (line 5) and prompts/attribution. Each was read at `96f014f` and is copied in `standards.md`.
   Decided by: redline
3. **R3-1: does an empty mitigation in `deferredPlanned` mean nothing ships?** The same paragraph of the skill answers no. `skills/redline/SKILL.md:184` says a defer's `files` in `plan` are "what says a mitigation is planned, whatever its words say". `docs/running.md:125` says that in the plan dial's list "the shaper's words stand as written beside the files it listed, and the files say whether a task is planned". `deferredPlanned` is `outcome.shaped.deferred` as the shaper returned it (`workflows/redline-loop.js:4694`), so its words can be empty beside a planned task (the loop test's empty-string mirror, `tests/loop-test.mjs:2911-2915`). The parenthetical "(empty when nothing ships now)" disagrees with that answer, so it is the finding to fix (Decision 2).
   Decided by: redline
4. **R3-2 and R3-3: what does the skill print for what shipped?** The pull request answers: "After this pull request the words decide nothing", and "the skill reads what ships from `ships`". The skill's drafts rule says what `ships` is at each stop (`skills/redline/SKILL.md:217`): "before the build a task planned with files, at the end-of-run stop a commit of the finding's own". So what the session prints leads with `ships`, in the words of what the record is at that stop, and the words never stand alone as what shipped. Two sentences disagree with that:
   - `skills/redline/SKILL.md:220` calls a mitigation with empty words "a planned change" at every stop. That includes the end-of-run stop, where `draftView` reads `ships` off the commit (`workflows/redline-loop.js:3414`; every held draft carries its outcome, 4082).
   - `skills/redline/SKILL.md:220` and `:264` print "the mitigation as written" when `ships` is true. `deferredEntry` and `draftView` return the words as written beside `ships: true` (3396, 3416), `none` included: the mirror case pins `mitigation === 'none'` with `ships === true` (`tests/loop-test.mjs:2913-2914`).

   Those sentences are what to fix (Decisions 3 and 4). Leading with the record's words needs no reading of the words, which this pull request removed. Showing the words only "when they describe a change" would have the session judge them again, so it is not taken.
   Decided by: redline
5. **R3-4: what is the record of a decided finding's task?** The pull request answers: "the shaper's `findings[].files` for a finding nobody decided, the resolve agent's tasks for one the person or autopilot decided (the split #97 R2-6 made)". Its spec's decision 13 says the same (`agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/shape.md:28`): one the person or autopilot decided "reads the resolve agent's `tasks[].files` only". The code agrees with that answer (`plannedFiles`, `workflows/redline-loop.js:3810`). The finding shows that the agreed record misses a reshape's edit, so reading a reshape's list would change the split the pull request kept. It is sorted as a deferral (Decision 1), not fixed in this round.
   Decided by: redline
6. **R3-6 and R3-7: is each a small refactor?**
   - **R3-6** rewrites line 3831, which this pull request changed, and removes `plannedTask` (3800-3801). That is a base-branch helper this pull request left as a second reader of what `plannedFiles` reads. Round 2 counted the removal of `shaperPlanned`, a base-branch helper the pull request left redundant, as passing the third test (round 2's `shape.md`, Decision 8), and R3-6 has the same shape.
   - **R3-7** rewrites line 3833 alone. That line is on the base branch unchanged (`git blame` at `96f014f`: `c9b4979d`, 2026-11-16, before the pull request's first commit), so it fails the third test and is not built here. It is declined as not worth doing (Decision 7).
   Decided by: redline

## Decisions

1. **R3-4 (correctness, defer, nothing ships now).** The trace holds at `96f014f`:
   - For a finding the person or autopilot decided, `plannedFiles` reads `resolvedTasks` alone (3810), and only `resolveWith` adds to it (3783).
   - A reshape after a bounced plan rewrites `plan.md` (its prompt, 2017: "Apply each adjustment"). It runs no resolve unless it raises a new call (3911-3914).
   - `effectiveDispositions` (3798) gives every decided deferral that list. The plan approver is shown it on each pass (3863), the implementer through `ctx.shaped` (3985), and the planned-and-unbuilt warning names it (4067-4069).
   - `isDeferral` reads the same tasks for a call (3831). So for a call answered with a deferral in empty words whose task a reshape removed, the check still demands that task (3983).

   It is worth doing, and not here. The record for a decided finding's task, the resolve agent's tasks and no other list, is the split #97 made (R2-6, R2-14) and this pull request kept on purpose (Unattended answer 5). The base branch's `plannedTask`, `isDeferral` and `needCommits` already read those tasks across reshapes, so the gap predates the pull request; the readers this pull request added are where it now shows.

   A full fix must decide whether a reshape may change a decided finding's task at all. That is a change to the contract between the reshape and the resolve agent. The workflow drops a reshape's deferred entry and disposition for a decided finding on purpose (#94, R8-6; #97, R3-6; 3895-3904), so its `files` for one cannot simply be trusted. The loop test's `restated` case (`tests/loop-test.mjs:3198`) is a reshape that lists a decided deferral with no files while the resolve's task stands. Reading that list would show the plan approver a task with no files, which its rule 1 bounces. The other design, holding the reshape to the resolve's files, turns such a bounce into a stop for the person. That choice belongs with its own spec, as round 1 deferred the sibling R1-9 (now #104), a reshape's edit that a draft's version misses.

   No cheap mitigation inside the pull request changes what the failure costs:
   - A comment naming the finding tells no reader of the run anything.
   - A warning that compares the reshape's list with the resolve's would read the same untrusted list the full fix has to rule on.
   - A commit of the finding's own would also buy a whole review round for this deferral (the done rule, 4145), which is out of proportion for a comment.

   So nothing ships now. The drafted issue is under Deferred. R2-10 (declined in round 2) needed two agents to act against their prompts; this needs one reshape that follows its prompt, so it is not declined on the same ground.
   Decided by: redline
2. **R3-1 (nit, fix).** The plan dial's field list (`skills/redline/SKILL.md:184`) says `deferredPlanned` holds each defer's mitigation "as the shaper wrote it, possibly empty, which never says whether one ships (the entry's `files` in `plan` say whether a mitigation is planned)", in place of "(empty when nothing ships now)" (Unattended answer 3). A phrase check and a check that the old parenthetical is gone pin it. The plan dial's other statements, pinned by R2-5's phrases, stay as they are.
   Decided by: redline
3. **R3-2 (nit, fix).** The drafts rule's fallback for empty words (`skills/redline/SKILL.md:220`) depends on the stop, as `ships` does:
   - "a planned change" at a round's stop, before the build;
   - "a change in its own commit" at the end-of-run stop, where the record is the commit. That is the closing summary's wording (264), which R2-7 chose.

   One check pins the end-of-run wording and the old sentence's absence.
   Decided by: redline
4. **R3-3 (nit, fix).** In the drafts rule (220) and the closing summary (264), what shipped is stated from `ships` first, in the record's words. Then come the words as written, labelled as its words, when they are not empty: for example `a change in its own commit (its words: "a log line")`. The words are not checked and can say that nothing ships, so they never stand alone as what shipped. `false` stays "nothing".

   This takes the reviewer's second option. The first, showing the words only when they describe a change, would have the session read the words again (Unattended answer 4).
   - The closing summary's pinned phrase, the one that opens "and what shipped, from", stays.
   - The `capped` section, which defers to `done`, is unchanged.
   - One check pins the new wording in both places and the old one's absence.

   It is built after Task 3, whose fallback it moves to the front of the sentence.
   Decided by: redline
5. **R3-5 (nit, fix).** The comment above `draftView` (3403-3406) and the one above `isDeferral` (3811-3818) are rewrapped at the file's width, 100 columns, with no word changed. Three of their lines run to 146, 181 and 160 columns. The file has 1185 comment lines, 1140 of them at 100 columns or less, and both blocks' other lines are at 100 or less. A source check holds both blocks at 100 columns. An absent anchor reads as an over-long line, so the check fails and does not throw (testing/tests, line 14).
   Decided by: redline
6. **R3-6 (nit, fix; a small refactor).** `isDeferral` reads whether a decided call has a planned task through `plannedFiles(d.id).length === 0` in place of `!plannedTask(d.id)`, and `plannedTask` is removed. The answer is the same for every input:
   - For a decided id, `plannedTask(id)` is true exactly when some resolve task for `id` has files. That is exactly when `plannedFiles(id)`, the union of those tasks' files, is non-empty.
   - `isDeferral` reads it only inside `if (decision)`, where `plannedFiles` reads the resolve's tasks.
   - The resolve schema requires every task's `files` as a list (882).

   Two comments change with it:
   - `plannedTask`'s comment ("what needCommits demands", 3800) goes. `needCommits` reads `resolvedTasks` itself (3983), and `isDeferral` was its only caller.
   - `plannedFiles`' comment drops "(plannedTask reads the same tasks)" and says that `isDeferral` reads its list too. So the stops, the prompts, the warning and `isDeferral` read one fact one way, and a later change to the list, as R3-4's deferred fix would make, reaches them all.

   All four small-refactor tests hold:
   - Behaviour is unchanged: no existing expectation is edited, and nothing outside the script names `plannedTask`; `grep` finds it in `workflows/redline-loop.js` alone.
   - It stays inside the pull request: `workflows/redline-loop.js` and `tests/loop-test.mjs` are files it changed.
   - It reworks this pull request's code. The call site is line 3831, which the pull request changed. The helper it removes is left as a second reader of what `plannedFiles`, which the pull request added, reads (Unattended answer 6; round 2's Decision 8).
   - It is one removal of a few lines.
   Decided by: redline
7. **R3-7 (nit, decline).** Reason: for a finding nobody decided, `effectiveDispositions()` returns the shaper's own entry unchanged (3797), so the call gives the same answer as the direct read. Its cost is a few dozen object copies per stop over a handful of findings, deferrals and tasks. Reading through the one function that applies the overrides keeps the undecided branch on the list every other reader uses, which R3-6 makes the rule for the planned task. The line it would rewrite is the base branch's (Unattended answer 6).
   Decided by: redline

### Proportionality

- **R3-4.** Likelihood: low. It needs three things in one round: a deferral the person or autopilot decided with a planned mitigation, a plan approver bounce on that task, and a reshape that changes or removes it. Each step follows its agent's prompt. Impact when it fires:
  - The plan approver and the implementer are shown the files of the task as first planned.
  - A strict approver can bounce the same plan until `maxPlanAdjustments` (2 by default), and the round stops at approve, which the person resumes.
  - A warning can name files the plan no longer holds.
  - For a call answered with a deferral in empty words whose task the reshape removed, the check demands that task, and the round stops at check after its repair.

  It never makes a wrong commit or a wrong reply. A full fix needs a new rule for when a reshape's list is the plan's for a decided finding. That goes against the workflow's choice to drop what a reshape says of one (#94, R8-6; #97, R3-6). It costs:
  - per-id state in `revise()`;
  - a change to the reshape or resolve prompt;
  - a scripted reshape key in the loop harness;
  - checks for both a changed and an unchanged task.

  It also changes the split this pull request kept. That is out of proportion for a review round, and its design belongs with its own spec: defer, nothing shipped (Decision 1).

## Declined

- **R3-7:** for a finding nobody decided, `effectiveDispositions()` returns the shaper's own entry unchanged, so the call gives the same answer as reading `shaped.findings` directly at the cost of a few dozen object copies per stop over a handful of entries, and reading through the one function that applies the overrides keeps the undecided branch on the list every other reader uses.

## Deferred

### R3-4: Read a reshape's change to the task of a deferral the person or autopilot decided

- **Mitigation:** none; nothing ships now (Decision 1).
- **title:** Read a reshape's change to the task of a deferral the person or autopilot decided
- **found:** When the person or the autopilot decides a finding in a Redline round (a disposition override, or an answer to a judgment call), the workflow reads the task the round planned for it from the resolve agent's `tasks` alone: `resolvedTasks` in `workflows/redline-loop.js`, which only `resolveWith` adds to and which `plannedFiles` and `isDeferral` read. A reshape after a bounced plan rewrites `plan.md` and returns every finding's `files`, but it runs no resolve unless it raises a new call, so when the plan approver bounces such a deferral's mitigation task and the reshape changes or removes that task, the list is never updated. The plan approver's next pass and the implementer are then shown the files of the task as first planned (`effectiveDispositions`), and the planned-but-unbuilt warning can name files the plan no longer holds. An approver that holds the list to the plan, as rule 1 of `agents/redline-plan-approver.md` asks, can bounce the same plan until `maxPlanAdjustments` and stop the round at approve, and for a judgment call answered with a deferral in empty words whose task the reshape removed, `isDeferral` still sees a planned task, so the check demands a commit for it and the round stops at check.
- **why:** Reading a decided finding's task from the resolve agent's tasks and no other list is the split #97 made and pull request #103 kept on purpose, and the base branch's `isDeferral` and check demand already read those tasks across reshapes, so the gap predates that pull request, which only added readers where it shows. Seeing a reshape's edit means deciding whether a reshape may change a decided finding's task at all, a change to the contract between the reshape and the resolve agent: the workflow drops a reshape's deferred entry and disposition for a decided finding on purpose, so its `files` for one cannot simply be trusted, and that choice belongs in its own spec. The failure needs a decided deferral with a planned mitigation, a bounce on that task and a reshape that changes it, and its cost is a resumable stop or a warning that names stale files, never a wrong commit or reply.
- **fullFix:** Keep, for each decided finding, the files of its task as last planned: set from a resolve's `tasks` for the ids that resolve applied, and replaced after each reshape by the reshape's own `files` for a decided finding whose decision makes it a deferral (a `defer` override, or a call whose resolve entry stands), so that `plannedFiles`, and `isDeferral` through it, read the newest plan; the other design is to tell the reshape that a decided finding's task keeps the files the resolve agent gave it and to record an adjustment that needs others as not applied, which keeps the split and ends such a bounce at a stop for the person. Pin either with a loop case: an override to defer whose resolve plans `app/x.php`, a bounced plan, and a reshape that lists no files for it, then check what the second plan approver call is shown (`files: []` under the first design) and that a reshape listing the same files leaves it unchanged.

## Standards retrospective (proposed)

Each item is proposed, not applied. The standards approver judges the list, and the implementer applies what it approves in its own commit. No item finishes a finding: each fix is whole in its own commit, so the commit names no finding.

1. `agent-os/standards/workflow/agents.md`, line 49, after "since the closing summary read an empty `mitigation` as nothing shipped until #103, R2-7": **missing** (R3-1, R3-2, R3-3). Drafted wording: "; and every reader that shows the words beside `ships` states `ships` first, in the words of what the record is at that point (a planned change before the build, a change in its own commit after it), and the words after it, labelled as the words, since they are not checked and can say that nothing ships: the draft stop and the closing summary printed `none` as what shipped beside a commit of the finding's own, the end-of-run stop called a committed mitigation a planned change, and the plan dial's field list said an empty `deferredPlanned` mitigation meant nothing ships, until #103, R3-1 to R3-3".
2. Already in a standard, no edit:
   - R3-5 is one-off formatting that no standard needs to state.
   - R3-6 is one-off code hygiene of the kind round 2's R2-9 was; line 46's R2-11 clause already asks that every agent be shown the list the workflow reads.
   - R3-4 is deferred: what a reshape may do with a decided finding's task is for its own spec to decide, and no standard changes until it does.
   - R3-7 is declined and teaches nothing a standard lacks.

   No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A. Nothing changes what a run promises.
- **Run caution.** This round changes `workflows/redline-loop.js` (comments and a refactor, no prompt text) and `skills/redline/SKILL.md` on the plugin's own checkout, which loads in place. A relaunch of this run runs the script it launched with (#81; workflow/replay, line 21), and the skill's new sentences are read by the session at its next stop. No agent file changes, so the handoff carries no agent drift sentence for this round.
- **Not run here.** The shaper did not run the loop test. Every claim above was traced through the code at `96f014f`. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds round 1's and round 2's only), and no scratch Pest test applies: the repository has no PHP.
- **Already tracked.** `scripts/redline-gh.sh issues-search` finds no open issue for R3-4. Two neighbours are open: #104 is round 1's R1-9 (a draft's version over what its stop shows), a sibling, and #99 is the resolve agent naming each decision's disposition. The reviewer set aside one candidate as tracked in #99.
- **No file is missing.** Every file cited above exists at `96f014f`.

## Standards Applied

- workflow/agents:
  - line 9: the four endings and the five cases (R3-4's defer, R3-7's decline);
  - line 16: a comment that restates a rule changes with it (R3-6's comments);
  - line 39: the split by who decided (R3-4);
  - line 46: an agent is shown the list the workflow reads (R3-4, R3-6);
  - line 49: what shipped is read from the record, and the words are only shown (R3-1, R3-2, R3-3).
- workflow/replay: line 21, a relaunch runs the launched script (run caution).
- testing/tests:
  - line 7: a mock answers as the agent would (R3-4's cost);
  - line 14: a check fails and does not throw (R3-5's anchors);
  - line 28: a case and its neighbour in the same commit;
  - line 33: red before green.
- process/docs-gate: one Docs entry per touched plugin file.
- process/release: no second bump within the pull request.
- prompts/attribution: Redline's label only; no model or vendor name.
