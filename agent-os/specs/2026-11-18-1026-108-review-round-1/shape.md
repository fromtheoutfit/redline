# PR #108 review round 1: the forced guard on a stated fix, and what the resolve prompt asks of a named call — Shaping Notes

Shaped by Redline in unattended mode, for review round 1 of PR #108 (issue #99), from the round's eight findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Line numbers are at `253052a`, the head of the pull request's branch.

## Scope

The round's eight findings, nothing more. Two are correctness findings (R1-8, medium; R1-5, low). Six are nits (R1-1, R1-2, R1-3, R1-4, R1-6, R1-7). The verifier confirmed every finding, so none needs a second look.

- `fix`, five: R1-1, R1-2, R1-5, R1-7, R1-8. R1-5 is `fix` by the person's disposition override; the shaper sorted it as `defer`, with a code comment as its mitigation (Decision 5).
- `defer`, none.
- `decline`, three: R1-3, R1-4, R1-6.
- No `ask`.

Out of scope, as the pull request has it: `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/`, `scripts/` and `skills/`, and the Verification Gate's text. This round touches none of them. The version stays `0.4.2`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

## Unattended answers

1. **Scope, visuals, references, product context.** The scope is the eight findings (unattended section, point 6). There are no visuals. The references are the files each finding names, their callers and tests, and the pull request's own spec (`agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/`); see `references.md`. `agent-os/product/` exists, but nothing in this round changes what Redline promises, so it adds no constraint.
   Decided by: redline
2. **Which standards apply.** workflow/agents (lines 9, 16, 37, 39, 46), workflow/replay (lines 21, 23), testing/tests (lines 7, 13, 14, 28, 33), process/docs-gate (lines 5, 8, 16), process/release (line 5) and prompts/attribution. Each was read at `253052a` and is copied in `standards.md`.
   Decided by: redline
3. **R1-2: is a statement asked of a call whose decision names its own disposition?** The pull request's spec answers no. Its decision 17 (`agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md:47`): "A call's decision that names a disposition itself keeps deciding, as an override's does. No statement is required of it, and none of a call left to the person under a rule." The workflow's own comment says the same (`workflows/redline-loop.js:3780-3782`: "so neither is asked for one"), and `asked` (3787) reads no statement for it. The prompt disagrees: it asks for "one entry per call above" and exempts only a call carrying `rule` (2072), and the agent file exempts only overrides and `rule` (`agents/redline-resolve.md:24`). That disagreement is what to fix (Decision 4), in the prompt and in the agent file, which restates the prompt's rule (workflow/agents, line 16). Of the reviewer's two options, the first is the one that agrees with decision 17; the second, reading the statement and warning, would make a decision that names its disposition depend on a statement, which decision 17 rules out.
   Decided by: redline
4. **R1-6: should a value outside the three get its own message?** The pull request's spec answers no. Its decision 20 (`shape.md:60`): "A value outside the three is no statement. The schema's enum refuses one in the agent's own run, and the workflow's filter is the second layer [...] The round then stops at resolve as it does for a call with no statement (`misstated`)." The pull request's description lists the case under the same message: "a call with no statement, or with a value outside the three: `the resolve agent stated no disposition for R1-4, [...]`". The code agrees (3783, 3790), and `misstated` pins it (`tests/loop-test.mjs:3228-3229`). Declined (Declined, R1-6).
   Decided by: redline
5. **R1-4: should the repeated-statement warning fire only when the repeats differ?** The pull request's spec answers no. Its decision 12 (`shape.md:34`): "Two statements for one id: the first is kept, with a warning, as for a deferred entry (#97, R2-12)." The warning is for any second statement, as the deferred entries' warning is for any second entry (3798-3800), and `statedTwice` pins it (`tests/loop-test.mjs:3224-3225`). Declined (Declined, R1-4).
   Decided by: redline
6. **R1-3: should `effectiveDispositions` read a call's statement?** The pull request's spec answers no. Its decision 14 (`shape.md:41`): "`plannedFiles`, `effectiveDispositions`, the reshape prompt and the plan approver's file are not touched: a decided call is still shown to the plan approver and the implementer as the shaper sorted it, with the decision beside it, since what they are shown is #106's subject." The reviewer's proposed fix changes that view, so it would undo a choice the spec records as deliberate (unattended section, point 4). Declined (Declined, R1-3).
   Decided by: redline
7. **R1-5: did the pull request set out to hold overrides to the statement checks?** No. The spec's decision 2 (`shape.md:14`): "An override keeps naming its own disposition and keeps deciding, as #103 R1-11 left it. Only how a call's decision is read changes." The pull request's description: "A disposition override keeps naming its own (#103, R1-11)". The reviewer's three cases each behave the same on `main`, so the gap predates this pull request. It is sorted as a deferral (Decision 5). The person overruled that to `fix` (Decision 5).
   Decided by: redline
8. **R1-7: is it a small refactor?** All four tests hold.
   - Behaviour is unchanged: the helper returns what both expressions return, no existing check's expectation changes, and nothing outside the code reads either name.
   - It stays inside the pull request: `workflows/redline-loop.js` and `tests/loop-test.mjs` are both in its diff.
   - It reworks code this pull request wrote: `taskFiles` (3843) is the pull request's (`git blame`: `7c58af4f`). `plannedFiles` (3881) is on the base branch (`70cbe01d`), and it becomes a call site of the extracted helper in the same file, which the third test allows ("plus the call sites of what it extracts in those same files"). The duplicate is the pull request's: it wrote the second copy.
   - It is one idea, one extraction touching three lines, far smaller than the pull request.
   Decided by: redline
9. **Does this round's edit to `workflows/redline-loop.js` and `agents/redline-resolve.md` need a decision (#81)?** No. The pull request's description cautions that "a round on it that edits either meets #81", and `docs/running.md:149-152` says what a relaunch runs: "the relaunch runs the copy of the script the harness kept at launch", while README Known limits says "A self-review that edits an agent file runs its later rounds under the edit", and the skill lists the agent files that changed. This run's later rounds would then run under an agent file that exempts a named call from `decided`, beside the launch's script, whose `asked` (3787) reads no statement for such a call. The two agree, so nothing stops. R1-8 needs the workflow edit in any case.
   Decided by: redline

## Decisions

1. **R1-8 (correctness, fix).** The trace holds at `253052a`. The clause this pull request removed from `needCommits` read `resolvedTasks.filter((task) => task.files.length && task.finding && !accepted.has(task.finding) && !record.forced[task.finding] && !deferralIds.has(task.finding))` (the pull request's diff of `workflows/redline-loop.js`). The new clause (4065) has no forced test. `stated` is set when the resolve returns (3792-3794), for a call that was not forced then (`asked`, 3787). A reshape after a bounced plan can force it afterwards: `forceAskRules` sets `record.forced` on a decided finding not yet forced when the reshape tags it with a rule (3310-3311) or gives its call the own-file reason (3265-3266). `finalDispositions` then shows it as `ask`, and `isDeferral` (3893) and `outcomesFor` (2966-2969) both treat it as left to the person, but the concat demands its commit. Built, a commit ships for a finding posted as left to the person with no commit listed; left out, the round stops at the check after a repair with `no commit names R1-1`. The fix puts the guard back on the stated branch (Task 6) and pins it with a loop case.
   The reviewer's harness (`/tmp/redlinerepro/reviewer-r1-repro.mjs`) was not run: `node` is refused to the shaper as to the reviewer. The trace is read from the lines cited, and Task 6's red run is the proof.
   Decided by: redline
2. **R1-1 (nit, fix).** The stop takes the label of the resolve that ran: `label: \`resolve ${pass.tag}${suffix}\`` (3760) and `stageError`'s `lastLabel` (536-538), so `resolve r<n> #<k>` for a call a reshape raised (3990) and `resolve h<n>` in a human review pass (438). The doc names `resolve r<n>` alone (`docs/running.md:126`). Task 2 names all three.
   Decided by: redline
3. **R1-1's scope.** Only the bullet the finding names changes. Other labels in the same document (`file deferred r<n>`, line 129) are written the same short way, and no finding names them.
   Decided by: redline
4. **R1-2 (nit, fix).** Unattended answer 3. The prompt gains one sentence, only when a call in its block carries `disposition`, as the `rule` sentence is there only when a call carries `rule` (2041-2043, 2072), so every other resolve prompt is byte-identical and still replays (workflow/replay, line 23). The agent file's last sentence of the paragraph names the same exemption. Two loop checks pin the prompt sentence on `namedCall` and the agent file's clause; the existing check at `tests/loop-test.mjs:3266` already pins the neighbour, a call with no named disposition whose prompt holds no such sentence (Task 3).
   Decided by: redline
5. **R1-5 (correctness, fix, by the person's disposition override).** The shaper sorted it as `defer`, mitigated by a code comment; its reasoning, as the person saw it, follows. Unattended answer 7. The trace holds: the statement checks (3843-3856) run over `asked` (3787), which leaves out every decision that names its own disposition, and `unentered` (3829) covers only an override to `defer`. Each of the reviewer's three cases behaves the same on `main`, since the override path, `isDeferral`'s named branch (3903-3904) and `unentered` are unchanged. Holding overrides to the stops would change when an override's round stops, which the pull request kept as it was. The mitigation is a comment in `resolveWith` that says so and names the finding, so the next reader of the checks does not take the comment at 3780-3782 ("decides as an override's does") to mean they are held to the same checks (Task 4). The drafted issue is under Deferred.
   Decided by: redline
   **Disposition override (2026-11-18): `fix`.** @michaelfromtheoutfit has the three resolve-time checks run over every decision resolveWith applies, by its effective disposition, with the draft's three loop cases, and keeps the allowance for an entry the round already holds, since the checks now exist and this pull request is the place to apply them.
   The fix planned is the shaper's drafted issue's full fix: run the three checks over every decision `resolveWith` applied, forced findings excluded, by its effective disposition (the decision's own `disposition` when it names one, else the stated one); keep the allowance `unentered` makes for an entry the round already holds (the shaper's own deferral); and pin a `fix` override with no task with files, an `accept` override beside a task with files, and a call naming `defer` with no deferred entry, each with a loop case that stops at `resolve r1` before the plan approver. A fourth loop case pins the allowance as the neighbour that must not change. The code comment the shaper planned as the mitigation is not written; Task 4 now plans the full fix, and the finding is no longer under Deferred. A stated call keeps its three checks and their messages as they are; a decision that names its own disposition is checked by what it names, with messages of its own, and a defer override's message is unchanged.
   Decided by: @michaelfromtheoutfit
6. **R1-7 (nit, fix).** Unattended answer 8. One module-level helper, `taskFilesOf(tasks, id)`, read by `taskFiles` and `plannedFiles` (Task 5). A source check pins that both read it.
   Decided by: redline

### Proportionality

- **R1-8.** Likelihood: rare. It needs a reshape after a bounced plan that newly puts a call the person or autopilot decided under a repository ask rule, or gives its call the own-file reason. The reviewer traced it and did not observe it in a run. Impact when it fires: either a commit ships for a finding Redline posts as left to the person, or the round stops at the check after a repair, which on `main` finishes. Cost: one clause in `workflows/redline-loop.js` and a comment, one mock key, one loop run and two checks in `tests/loop-test.mjs`, both files in the pull request's diff. The guard is one the base branch had and this pull request removed, which weighs toward `fix`. In proportion.
- **R1-5.** Likelihood: low. Case (a) needs a call decision that names `defer`, which no skill path writes: the skill records `disposition` for an override on the plan dial (`skills/redline/SKILL.md:189`) and for a draft turned back with `fix` or `accept` (`:190`, `:222`). Cases (b) and (c) need the resolve agent to plan against the disposition an override names. Impact: (b) stops at the check after a repair rather than at resolve; (c) builds an accepted override's task; (a) posts a deferral with no issue. None is a regression. Cost of the full fix: the three checks reworked over every decision by an effective disposition, two or three new loop cases, and a change to when an override's round stops, behaviour the pull request kept. Out of proportion for this round, and outside what it set out to do, so `defer`, with the comment as a cheap mitigation. Overruled by the person to `fix` (Decision 5): the cost is taken in this round, in the two files already in the pull request's diff (Task 4).

## Declined

- **R1-3.** The view `effectiveDispositions` gives the plan approver and the implementer is kept on purpose by the pull request's spec (decision 14, as #106's subject), and the one concrete cost the finding names, the forced test missing from `needCommits`, is fixed in this round as R1-8.
  Decided by: redline
- **R1-4.** The pull request's spec chose a warning for any second statement of one call, as for a second deferred entry (decision 12, after #97 R2-12), and a repeat is the agent departing from the ask whether or not the two agree, which is what the warning reports.
  Decided by: redline
- **R1-6.** The pull request's spec chose one message for a missing statement and for one outside the three (decision 20, pinned by `misstated`); the message names the three values a statement may hold, and the schema's enum refuses any other in the agent's own run.
  Decided by: redline

## Deferred

None. The shaper deferred R1-5; the person overruled it to `fix` (Decision 5), so no issue is drafted for filing.

## Overruled deferral (not filed)

The shaper's draft for R1-5, kept as the record of what the person saw. It is not filed; Task 4 plans its full fix.

- **Title:** Hold a decision that names its own disposition to the resolve-time checks a stated call meets
- **Found:** In `workflows/redline-loop.js`, `resolveWith` checks what the resolve agent states a judgment call's decision ends in (`fix`, `defer` or `accept`) against the tasks and deferred entries the same resolve returned, and stops the round at stage `resolve` when they disagree. Those checks run over `asked`, which leaves out every decision that names its own disposition: a disposition override, and a call whose decision carries `disposition`. Such a decision is held only to `unentered`, which stops an override to `defer` that comes back with no deferred entry. So a decline overruled to `fix` on the plan dial, or a call whose decision names `fix`, with no task with files is not stopped at `resolve`: the check demands its commit, and the round stops at the check after a repair, a stop that resumes at the build, which cannot replan. An `accept` override beside a task with files is built as the plan says. A call whose decision names `defer` and comes back with no deferred entry is posted with no issue and no warning, though no skill path writes such a decision today.
- **Why:** The pull request that added the checks (#108, for #99) changed how a call's decision is read and kept every override as it was (its spec, decision 2), and each case above behaves the same on the base branch; holding overrides to the same stops changes when an override's round stops, which is a change of its own.
- **Full fix:** Run the three checks over every decision `resolveWith` applied, forced findings excluded, by its effective disposition: the decision's own `disposition` when it names one, else the stated one. Keep the allowance `unentered` makes for an entry the round already holds (the shaper's own deferral). Pin a `fix` override with no task with files, an `accept` override beside a task with files, and a call naming `defer` with no deferred entry, each with a loop case that stops at `resolve r1` before the plan approver.

## Standards retrospective (proposed)

Listed from Decisions 1 to 6, the declines and the unattended answers. Proposed, not applied: the standards approver judges them, and the implementer applies the approved ones in their own commit.

1. `agent-os/standards/workflow/agents.md`, line 39: **contradicted** by R1-8's fix (Decision 1). The clause "and what the check demands of a call is its statement alone" becomes: "and what the check demands of a call is its statement alone, except a call a reshape leaves to the person under a rule after its resolve, which nothing demands, as `isDeferral` and the outcomes read it: the stated branch of `needCommits` lost the forced test the clause it replaced carried until #108, R1-8".
2. `agent-os/standards/testing/tests.md`, line 28, appended: **missing** (Decision 1). "; and a clause rewritten to read from a new source is listed with every exclusion the clause it replaces carried (a forced finding, an accepted one, a deferral), each kept and pinned or recorded in the spec as dropped: the stated-fix clause of `needCommits` kept the deferral test and dropped the forced one, unpinned, until #108, R1-8".
3. `agent-os/standards/workflow/agents.md`, line 16, appended: **missing** (Decision 4). "; and an ask a prompt puts to every item of a block names, with the same condition, every item the workflow does not read it for, so an agent is never asked for what is discarded unread: the resolve prompt asked a statement of a call whose decision names its own disposition, which `asked` leaves out, until #108, R1-2".
4. R1-1, R1-5, R1-7 and the three declines: **no change**. A label written with every form it takes is a correction of one sentence, not a pattern; R1-5's fix, overruled from the shaper's deferral (Decision 5), applies the existing rule that the workflow checks a result before it acts on it (workflow/agents, line 37) to the decisions the checks left out, and the declines settle nothing new; the helper follows the existing rule that one fact is read one way (workflow/agents, line 46).

No pattern is used that the standards do not hold.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people": a finding a repository rule leaves to the person is never demanded of the build, which R1-8 restores.

## Standards Applied

- workflow/agents — line 9, the four endings and the named cases; line 16, a rule a prompt states is changed in the agent file that restates it, with the same condition; line 37, a result is checked before it is acted on; line 39, a decided finding is a deferral only when its decision made it one, and what the check demands of a call; line 46, one fact read one way.
- workflow/replay — line 21, a relaunch runs the launch's script; line 23, a new ask sits in the block only its calls carry, so other prompts replay.
- testing/tests — line 7, a mock answers as the real agent would (the reshape-only ask-rule tag); line 13, a rule pinned at its neighbour; line 14, a check reads an absent prompt as `''`; line 28, a case per clause and a row for the neighbour; line 33, red before green.
- process/docs-gate — lines 5, 8 and 16, one entry per touched plugin file, and a `docs/` change needs none of its own.
- process/release — line 5, one bump per pull request, already made.
- prompts/attribution — no model or vendor name anywhere.
