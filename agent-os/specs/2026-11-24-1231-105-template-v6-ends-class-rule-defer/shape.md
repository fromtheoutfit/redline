# Template v6: option ends, instance or class, a rule call the person defers (#105, #75, #126) — Shaping Notes

## Scope

Three open issues change the body of the unattended section, so they ride one template version (v5 to v6, plugin 0.4.5 to 0.5.0).

- **#105.** The shaper's schema requires `files` on every finding and its agent file shows it, but point 10 of the template shows it on none. Its comment adds the per-option disposition the #99 spec noted and left out: the shaper states what each option of a judgment call ends in before anyone decides, and the workflow holds the resolve agent's statement to the picked option's.
- **#75.** The shaper fixes each finding as reported and never asks whether the cause is one place. #112 hit the round cap on two classes fixed one instance a round (evidence in the Nov 20 comment).
- **#126.** A finding a repository ask rule covers ends `left to the person` whatever the answer, so a person who answers "defer it" gets no issue filed (`loser` #839, R1-3, filed by hand as `loser` #843).

Out of scope, by issue: #119, #118, #115, #104, #121, #122, #123, #124, #109, #88, #101, #98, #82. Where a table showed one of them shares a reader this spec changes, it was put to the person as a question and is recorded with its answer below. `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json` and every script under `scripts/` are not touched. No changelog entry and no tag.

## Decisions

Given with the brief, not reopened:

1. One spec, one template version: marker to v6, v5 body frozen under `templates/history/`, pinned in `tests/setup-test.sh`, setup rerun for this repository's copy. `.claude/redline/checks.sh` is never hand-edited. Minor bump in both manifests. No changelog entry, no tag.
2. #105: point 10's example and the sentence under it show `files` on every finding, as `agents/redline-shaper.md` does.
3. #105's comment: every option of a judgment call states what it ends in (`fix`, `defer`, `accept`). A pick by the person or the autopilot holds the resolve agent's statement to the option's end. A free-text answer rests on the resolve agent's statement alone. A named field, never read from a label or prose.
4. #75: a step between investigating and sorting. For each fix: where the cause lives, instance or class. Three valid outcomes, recorded in `shape.md` with the reason: the one-place fix (inside the proportionality rule); the instance fix plus a recorded sweep, measured and written into the spec; the instance fix alone, with why the cause is not a class. A second finding of one class in the same run forces the question whatever an earlier round decided.
5. #126: an option of a rule call may end in `defer` and carry a drafted issue. When the person picks it, Redline files the draft, the decision is the person's, and the thread says the change is theirs under the rule and names the issue. No Redline role plans a task or writes under the rule.
6. Nothing an agent writes in free text decides what the run does. Every new fact is a named field, checked against the run's record wherever it can be. Where a check is an agent's judgement, `shape.md` says so and names the agent.
7. Template, agent files and workflow prompts stay in step: one rule, stated in all of them, changed in all of them.

Rules the brief set for this spec:

- Out of scope, by issue: #119, #118, #115, #104, #121, #122, #123, #124, #109, #88, #101, #98, #82. Where a table shows one shares a reader this spec changes, it is put to the person as a question, never folded in.
- Defer means tracked: anything found and left alone gets a drafted issue under "For you to open" in `shape.md`, in the form of this repository's issues, after a check that no open issue covers it.
- A prompt kept byte-identical still replays after a plugin update. A new ask goes only in the block the calls it concerns carry. A claim that a prompt is unchanged is proven by a sweep of every loop scenario before and as built, each exception named.
- No schema on an agent that calls the Skill tool. `scripts/redline-guard.sh` and `hooks/hooks.json` are not changed.
- The gate does not run shellcheck: if any `.sh` file changes, CI's shellcheck command runs before the commit boundary and its result is shown.
- No text an agent copies into a file depends on an invisible character. A count goes in the spec's As built section, never in a standard, the template or an agent file. No AI attribution.
- Stop at each commit boundary and say what to commit; the person makes every commit. One question at a time.

Answered during shaping (2026-11-24), in the order asked:

8. **a (2026-11-24). `cause` on the shaper's own fix, and nowhere else.** Every finding the shaper sorts as `fix` in a Redline round carries `cause: {where, outcome, why}`: `where` a repository path, `outcome` one of `one-place`, `sweep`, `instance`, `why` one sentence. Not on a deferral's mitigation, not on an option of a call, not on what the resolve agent plans, not in a human review pass. A drafted issue goes under "For you to open": a fix the resolve agent plans (a picked option, an override, a free-text answer) is never asked instance or class.

9. **b (2026-11-24). The verifier states it.** A finding gains `sameClassAs`, the ids of earlier findings whose cause is the same class. The ask and the schema key sit only in a review prompt that carries earlier findings (this run's history block, or the block of findings Redline's earlier rounds on the pull request handled), so a first round's review call on a pull request with no earlier round is byte-identical. The workflow honours an id against the record and clears one it cannot honour, with a warning, before the review is posted. A link that stands puts a block in that round's shape prompt, and a `fix` the shaper returns for the finding may not say `outcome: "instance"`: the round stops at shape, the workflow's own check. A defer, an ask or a decline is not held. A link to a finding an earlier run on the same pull request fixed stands too (table D). Judgement, to be named in `shape.md`: the verifier's, that two findings are one class.

10. **b, follow-up (2026-11-24). A link names a finding recorded as `fixed`, and no other.** This run: `record.outcomeKinds[id] === 'fixed'`. An earlier run on the pull request: `priorById[id].disposition === 'fixed'`, as the script prints it, a "resolved; first reported as" reply included; no reply text is read, and if #82 changes that reading this follows it. Every other id is cleared with a warning (table D, rows 2 to 12, 17, 18). The draft from answer a also says that a `sameClassAs` link cannot name a fix made at a call or a shipped mitigation, since those carry no recorded cause.

11. **c (2026-11-24). A picked option's end travels as the decision's own `disposition`.** No statement is asked of the resolve agent for a pick, and no new stop exists: the path a decision that names its disposition already uses carries it, and its three record checks hold it (`unentered`: defer with no drafted entry; `namedUnplanned`: fix with no task with files; `namedPlanned`: accept beside a task with files), each already raised through `checkError`, resumed at the resolve's label with the resolve's own-check sentence, unchanged. A pick is known by a named field: the skill records the picked option's label as `option`, autopilot's decision carries the call's `recommended` label, and the workflow sets `disposition` from that option's `ends` when the resolve applies the decision. The skill never writes a `disposition` for a call. A decision with no `option` is a free-text answer and is stated by the resolve agent, as today.
12. **c, follow-up (2026-11-24). A picked call is shown by its end, and #115 narrows.** Measured on four pairs of runs: against today's stated path the result is identical and three prompts differ (the resolve prompt's decision carries `disposition`; the plan approver's and the implementer's show the call by its end, where a stated call is shown as `ask` or as a reshape's re-sort). `effectiveDispositions` is not edited. #115 stays open for a call answered in free text; a comment for it goes under "For you to add".

13. **d (2026-11-24). A human review pass's options carry `ends` too.** One `judgmentCallSchema`, one dial, one path for both passes; an option may end in `defer`, since choosing it is the author's decision. The human pass's plan-approver sentence is reworded in this spec, because picks now reach it. Measured: a human-pass decision that names `defer` is shown to the plan approver as `H1-1: defer` in a prompt that also says "no finding is deferred by the shaper; a disposition of defer here is a bounce" (reachable today by a plan-dial change to defer; the loop's stub approves, so no test sees it). Reworded: a disposition of defer that no decision names is a bounce.

14. **e, part 1 (2026-11-24). Autopilot leaves a rule call and files nothing**, as today, whatever its recommended option ends in. The Left to line says `open: <the recommended option>`; the draft stays in the round's `shape.md` under the call.
15. **e, part 2 (2026-11-24). A rule call is deferred by a named field only.** Two ways: a pick of the defer option (`option`), or the typed form `<id>: defer. <reason>`, which the skill already records as `disposition: "defer"`. The workflow keeps a `defer` on a finding left to the person, where today it drops it; `fix` and `accept` are still dropped (a typed one with today's warning). The resolve agent states nothing for a rule call, as today; it drafts the issue only when the typed form defers a call that offered no drafted option, and plans no task. Any other wording is left to the person, and the skill says so when it says the answer back. The draft is raised at the round's draft stop before it is filed, as for every deferral the person chooses at a call.
16. **e, part 3 (2026-11-24). A finding on one of Redline's own files gets the same.** One record (`record.forced`) and one function serve both. Its reply keeps its opening and gains the same closing sentence; `prior-findings` reads it as `decided`, as today.

17. **f (2026-11-24). No fallback and no refusal; `docs/upgrading.md` says both.** Measured:
    - *A v5 section under the new plugin.* `redline-setup.sh unattended --version` on a section one version behind (the frozen v4 body against today's v5 template) exits 1 with one line, and the skill's precheck says it and goes on (`skills/redline/SKILL.md`, section 4, step 1). The run has the new shaper file and the new prompts, which state the whole ask, so nothing the workflow reads depends on the section's version; only the section's example and step text are stale, as its `files` is today.
    - *A run stopped under 0.4.5, relaunched after the update.* Ten kinds of stop, each relaunched under a stand-in for the v6 script (today's script with a marker in each text this spec changes). A review-dial stop replays whole (3 of 3). Every stop after shaping replays 3 calls (gather, review, post) and reruns from `shape r1`: the guided hand-off, the plan dial and the draft stop in round 1 (nothing built yet), and five stops that come after round 1 was built and pushed (a hand-off in round 2, an error at the check, at push and reply and at the handoff comment, and the end-of-run draft stop), where the round reruns over its own commits. A human review pass's hand-off reruns from `shape h1`. On this repository a relaunch runs the launch's script (#81), so nothing reruns.
    - No absent-key fallback: a shape result from 0.4.5 can never replay under a changed shape prompt, so an option with no `ends` cannot reach the new workflow.
    - `docs/upgrading.md` gains v6 in "Unattended section versions" and a section "A stopped run across 0.5.0". The as-built sweep of every loop scenario names each prompt that changed.

18. **g (2026-11-24). Done is shown by a loop replay of #112, with the limit stated.** The workflow half is pinned by a loop scenario built from #112's evidence (a later round's finding linked to the round before): red before the build (today's script fixes an instance a round to the cap), green as built (an `instance` answer under a link stops at shape; a stub that answers `sweep` or `one-place` lets the run go on), with one case per check beside it and source pins of the step's key phrases in the template, the shaper's and the plan approver's files and each shape prompt. `shape.md` says that a real shaper's judgement is not shown by this pull request, and names the two live checks that are the person's after the build: the self-review of this pull request, and the #817 rerun. A comment for #75 goes under "For you to add".

19. **The sweep's check (2026-11-24; #122 and #123 share the spec check, so it was asked). A named field, and the spec check is not touched.** A `fix` whose `cause.outcome` is `sweep` carries `cause.swept`, what the sweep covered: a list of `{member, found}`, `found` one of `holds` (the code already handles it) or `fixed` (this task fixes it). The workflow checks it is present and not empty for a sweep; a miss stops at shape, the workflow's own check (`ownCheck`). The plan approver still judges that the table in `shape.md` was measured by running and is complete. `checkSpec`, `specStatusPrompt`, `SPEC_STATUS_SCHEMA` and the GitHub agent's spec-status operation are not edited. (My option had a floor of two rows; the person's wording, present, is the rule.)

20. **Row 21 (2026-11-24; #119 shares `forceAskRules` and the resolve-time handling, so it was asked). One rule for defer.** A finding left to the person is filed whenever its decision ends in defer, however it came to be left: a rule call, an own-file call, or a decided finding a reshape later puts under a rule (table C, row 21, which today ends with the approved draft not filed and no warning). `isDeferral`'s forced early return goes for a decision that ends in defer and stays for every other. A fix or an accept a reshape puts under a rule is as today (row 20). #119 is not touched: the paths rules still never run on a resolve's tasks. A comment for #119 goes under "For you to add". The template says what each `found` value of `cause.swept` means.

21. **A sweep's open member (2026-11-24). Not a sweep.** `found` has two values, both meaning closed once the task lands: `holds`, the member was measured and the code as it stands already handles it, so nothing changes for it; `fixed`, it was measured exposed and this task's change closes it. A member that is neither means the outcome is not `sweep`: the finding is `defer` (its mitigation the instance fix with whatever members it does close, its drafted issue naming the members left exposed and the fix proposed), or `ask` when one of point 3's cases holds. The schema's enum refuses a third value in the shaper's own run, and the plan approver bounces a sweep whose table shows a member exposed and unfixed. The template defines both values.

22. **A left finding is shown as today (2026-11-24; #115's function, so it was asked). One clause.** `effectiveDispositions` gains `&& !record.forced[f.id]`, so a finding left to the person keeps the disposition and the paths the shaper returned, whatever its decision names. A deferred rule call is shown as `ask` beside a decision carrying `rule` and `disposition: "defer"`, with its drafted issue in the deferred list.
23. **The thread (2026-11-24). Resolved when its draft was filed.** Settled is fixed, deferred, declined, decided, or left with its draft filed (an issue, or a draft file under `defer to spec` and `print`). By hand, accepted, a dropped draft and autopilot keep the thread open, as today. The finding is listed under both Left to and Deferred in the handoff.
24. **The remaining drop (2026-11-24; #109, so it was asked). Left as it is.** An entry the resolve agent returns for a left finding whose decision does not defer is still filtered silently. A comment for #109 goes under "For you to add".

Settled by the design, not asked, and approved with the plan (decisions 25 to 34):

25. **What a left call's options state.** "Make the change by hand" states `fix`, "accept" `accept`, "defer" `defer`. Of a left finding's end the workflow reads one thing: whether it is `defer`. A `fix` or `accept` is not kept on its decision (a typed one with today's warning, a picked one silently), so the finding is shown and recorded as every left finding is today.
26. **Where `draft` is read.** On a defer option of a call left to the person, and there it is complete (`title`, `found`, `why`, `fullFix`) or the round stops at shape. On any other option it is dropped with a warning: an ordinary call's deferral is drafted by the resolve agent after the decision, with its mitigation, as today. A typed `<id>: defer.` takes the call's draft when exactly one option carries one; otherwise the resolve agent writes it.
27. **Whose draft is filed.** The workflow takes a picked option's draft as the round's entry and drops a different one the resolve agent returns for it, with a warning: the option's was stated before the decision.
28. **A deferred rule call stops once more for its draft**, at the round's draft stop after the resolve, or at the end-of-run stop under `defer at end`, as every deferral chosen at a call does. No new stop, and nothing changes in how a draft's version is counted (#104's reader).
29. **A malformed pick.** `option` and `disposition` together on one of `args.decisions` are refused at launch, before any agent runs. An `option` that names no option of its call is read as the person's own words, with a warning, and the resolve agent states its end.
30. **No resume sentence is added or reworded.** Every new stop is raised through `checkError` at `shape`, so `ownCheck` is true and today's sentences apply (a first shape rewrites its folder, a reshape corrects in place). No `args.resume` entry of a run in flight builds a different line.
31. **A round with no link keeps its prompts.** `sameClassAs` is removed from a finding when nothing in it stands, and the review call's schema carries the key only when its prompt carries the ask.
32. **One existing loop check moves on purpose.** `reshape: a call whose decision names defer, left to the person under a rule by the reshape` is shown to the plan approver as `ask`, where today it reads `defer`, and its draft is now filed (table C, row 21).
33. **The template is the last code slice.** Gate step 7 holds this checkout's section to the template's marker (`tests/setup-test.sh:922`), and a setup rerun merges a body once per marker, so the bump, the frozen v5, the pin and the rerun are one commit. Until it, this checkout is a v5 repository under the new workflow, the state answer f measured.
34. **Counts leave two comments.** The comment on `checkError` ("Seventeen sites") and the loop test's ("the seventeen sites below") name their groups without a number, since this spec adds sites.

## How the tables were built

By running `workflows/redline-loop.js` through the harness of `tests/loop-test.mjs` (its `mock`, `go` and fixtures, loaded from the file up to its first scenario; nothing written to disk), not by tracing:

- **Differential runs.** Two runs of one scenario that differ in one thing only (the options the shaper returns; the pick; the recommendation; what the resolve agent states, with its tasks and deferred entry the same in both). Every agent prompt, every schema and every key of the result that differs is a reader of that thing. 13 pairs for the options, 5 for the pick and the recommendation, 7 for the end.
- **Scenario runs** for table C: one run per way a finding is left to the person, printing the decision as the resolve prompt holds it, the round's outcome, the `decided`, `forced` and `deferred` entries, the reply, the closing comment's lines, whether a `file deferred` call was made, and the thread sweep. 33 runs.
- **Scripts.** `grep` over `scripts/*.sh` for `options`, `judgmentCalls`, `decisions`, `disposition`; the `classify` filter of `redline-gh.sh prior-findings` run with `jq` on each reply opening; `diff` of the template body against this repository's copy.

A row marked *code* was read, not run, and says so.

## Table A: every reader of a call's options, of the pick, and of what a decision ends in

### A1. The options (20 rows)

| # | Where | What it does with the options | Pass | Found by | v6 |
|---|---|---|---|---|---|
| 1 | `judgmentCallSchema` (`redline-loop.js:924`), in both shaper schemas, each built with and without rule reasons (4 schemas seen) | requires `label`, `cost`, `effect` | both | schema dump | **changes**: each option requires `ends`; `draft` optional; the call requires `recommended` |
| 2 | Template point 10, the example's `options` line and the sentence under it | states the shape | both | read | **changes** |
| 3 | This repository's copy, `.claude/commands/agent-os/shape-spec.md` | the same text; 5 hand-edit hunks against the template, one of them the `story` line two lines above `options` | both | `diff` | **changes**, by the setup rerun's three-way merge |
| 4 | `templates/history/` v1 to v4 | frozen bodies | n/a | setup test | no: frozen and pinned; v5 joins them |
| 5 | `agents/redline-shaper.md` rule 1, rule 7 (a rule call's and an own-file call's options), rule 8 (a human pass's options), rule 10 and its example | states the shape and who the options belong to | both | read | **changes** |
| 6 | The spec folder: the pending entry under `## Decisions` and the `Pending decision <id>` task (template points 3 and 7) | holds the options for the resolve agent | both | read | **changes**: the entry lists each option's end, and a draft under an option that carries one |
| 7 | `forceAskRules` (`:3450`), the one call the workflow writes | writes two options, "Make the change by hand after the run" and "Accept, no change" | both | C1, C8, C9, C14 | **changes**: each carries its end, and a third option carries the shaper's draft when the shaper deferred the finding (table C, row 9) |
| 8 | `forceAskRules` on a call the shaper wrote (a rule call, an own-file call) | keeps the shaper's options, rewrites `why_human` | both | C6, pair "a rule call the shaper wrote itself" | **changes**: its options are checked like any call's |
| 9 | `vetShape`: `checkCalls`, `checkWhy` | read the call, never its options | both | *code* | **changes**: one new check of the options (below) |
| 10 | The hand-off result, `judgmentCalls[].options`: the decisions stop, the plan stop, a reshape's stop | the only key of the result that differed at 6 stops | both | 6 pairs | **changes**: carries `ends`, `draft`, `recommended` |
| 11 | `skills/redline/SKILL.md`, the `decisions` and `plan` hand-offs; `skills/redline-revise/SKILL.md` follows it | shows each option with cost and effect, the recommended one first; says a forced call's options are carried out outside the run | both | read | **changes** |
| 12 | The resolve prompt, "Judgment calls as the shaper wrote them, as JSON" (`:2268`) | the only prompt that differed, in 7 runs | both | 7 pairs | **changes** |
| 13 | `agents/redline-resolve.md`: what you receive, step 2, "names an option that does not exist" | reads the options | both | read | **changes** |
| 14 | The plan approver's prompt | the options never reach it | both | 7 pairs, unchanged | no: every call is decided before it runs, on every dial |
| 15 | The implementer's and the standards approver's prompts | never reach them | both | 7 pairs, unchanged | no |
| 16 | Replies, review body, handoff comment, human summary, cap comment | never reach them | both | 7 pairs, unchanged | no |
| 17 | The result after the stop (`rounds[].dispositions` holds findings, not calls), the findings file, the run marker | options are not kept | both | pairs; *code* for the marker | no |
| 18 | `scripts/*.sh` | no script reads options or judgment calls (0 lines) | n/a | `grep` | no |
| 19 | `tests/loop-test.mjs`: the mock shaper's options (`:263`), the checks that pin the synthesised options (`:1430`) | scripts and pins them | both | read | **changes** |
| 20 | `docs/running.md` (Dispositions, Hand-off), `docs/contract.md` (Ask rules), `README.md` | describe them | both | `grep` | **changes** |

### A2. The pick (9 rows)

| # | Where | What it does with the pick | Found by | v6 |
|---|---|---|---|---|
| 21 | `SKILL.md`, "Record each answer" and the answer form | records `{choice, notes, date}`; `choice` is a label or the person's words | read | **changes**: a pick of a listed option also records which one, as a named field |
| 22 | `relaunch.how` in `result()` (`:2844`) | tells a session the shape of a decision | read | **changes**, in the same commit (`workflow/replay`, line 10) |
| 23 | Intake of `args.decisions` (`:237`) | validates `disposition` only | *code* | **changes**: the new field is validated |
| 24 | `autopilotDecision` (`:1566`) | `choice` is the recommendation's prose; the resolve agent is told it "may paraphrase the label" | pair "autopilot: recommendation" | **changes**: carries the call's `recommended` option |
| 25 | `leftDecision` (`:1578`), autopilot on a forced call | `choice: "Left to the person"` | C11 to C13 | no: autopilot leaves a rule call as today (answer e, part 1) |
| 26 | `roundDecisions[id]` as JSON in the resolve prompt, the plan approver's prompt and the implementer's prompt | the three prompts where `choice` differed | 2 pairs | **changes**: the new field rides along; the resolve prompt's wording changes |
| 27 | `decisionSentence` (`:1549`) | posts `choice` only when `notes` is empty: reply, re-review history, handoff | pair "no notes" | no |
| 28 | `decided[].choice` in the result, the skill's `done` summary | reports it | pairs | no |
| 29 | `redline-prefs.sh run save` | copies `args` whole, so a decision's new key rides through | *code* | no script change |

### A3. What a decision ends in (16 rows)

| # | Where | What it reads | Found by | v6 |
|---|---|---|---|---|
| 30 | `RESOLVE_SCHEMA.decided` (`:1076`), the resolve prompt's ask (`:2277`), `agents/redline-resolve.md` | the statement | read | **changes** |
| 31 | `resolveWith` (`:4002`): no statement; an entry beside a fix or an accept; defer with no entry; fix with no task files; accept beside task files; the three checks of a decision that names its own disposition | holds the statement to the same resolve's tasks and entries | *code*; the 8 stops are in the loop test's `OWN_CHECKS` | **changes**: one new stop, the statement against the picked option's end |
| 32 | `isDeferral` (`:4211`) and through it the plan approver's and the implementer's `deferred` list, the draft stops, the `file deferred` call, `deferredAll`, `rounds[].files` | the statement, or the decision's own disposition; a forced finding is never one (`:4212`) | 5 pairs | **changes**: the forced early return, for a decision that ends in defer |
| 33 | `needCommits` (`:4455`) | demands a stated fix ("no commit names R1-1") | pair "no commit lands" | no: a forced finding is still demanded of nothing |
| 34 | `endsIn` (`:4001`): the reshape prompt's decided block and the hold after a reshape | "(fix)", "(deferred)", "(accepted)" | 2 pairs | no: a forced finding is not tracked |
| 35 | `effectiveDispositions` (`:4185`) | a decision that names its disposition is shown by it; a stated call is not (#115, open) | pair "names its own disposition" | no: #115 is left as it is |
| 36 | `outcomesFor` (`:3147`), `describeOutcome`, `replyBody` | kind `left` or `decided`; `filed`, `dropped`, `held` only on `decided` and `deferred` | 5 pairs, C runs | **changes**: a `left` outcome can carry a filing |
| 37 | The re-review prompt's history | the outcome text | 5 pairs | follows 36 |
| 38 | The handoff comment (Rounds counts, Put to, Left to, Deferred), the cap comment, the human summary | the outcome kinds and `record.filed` | pairs, C runs | **changes** |
| 39 | The thread sweep (`SETTLED_KINDS`, `:408`) | `left` stays open | C runs | **changes**: a left finding whose draft was filed is settled, and its thread resolved |
| 40 | `heldStop`, `settleHeld` (`:3660`, `:3694`), deferred items raised at the end | complete a `decided` or `deferred` outcome | run "defer at end" | **changes**: a `left` outcome's draft can be held |
| 41 | `redline-gh.sh prior-findings`, `classify` | the reply's first words: "left to @x under repository rule" is `left`; "left to @x under the rule on Redline's own files" is `decided` (`workflow/agents`, line 11) | `jq` | no script change: a reply that still opens "left to ... under repository rule" and ends "Deferred to #N." reads `left`. One fixture case pins it |
| 42 | `redline-gh.sh defer` | files a draft and keeps its record | read | no |
| 43 | The result's `forced[]`, `deferred[]`, `decided[]`, and the skill's `done` and `capped` sections | report them | C runs | **changes**: the skill's wording for a forced item that was deferred |
| 44 | `README.md` Known limits ("What an answer to a judgment call ends in is stated by the agent that applies it"), `docs/running.md` ("A deferral you chose at a call", "Left to you"), `docs/contract.md` ("Ask rules") | describe it | `grep` | **changes** |
| 45 | `bought` (`:4628`) | the shaper's own and final dispositions and the commits that landed, never the statement | pairs: same rounds either way | no |

**45 rows.** Two readers the issues do not name: row 3 (the hand-edited `story` line sits two lines above the `options` line, so the merge is checked with `--dry-run` before it is written) and row 41 (the script that reads a reply's first words back on the next run).

## Table B: every place the shaper's return shape is stated or checked (30 rows)

| # | Where | Stated or checked | Found by | v6 |
|---|---|---|---|---|
| 1 | Template point 10, the JSON example | stated: no `files` on any finding | `grep`: 0 of 4 findings | **changes** (#105) |
| 2 | Template point 10, the field sentence ("Every finding carries ...") | stated: leaves `files` out | read | **changes** |
| 3 | Template points 3 to 5 (what a call, a deferral and a second look carry) | stated | read | **changes**: the new step, the option's end, a rule call's defer option |
| 4 | Template's opening paragraph (what a finding given to the shaper carries) | stated | read | **changes**: a finding can carry `sameClassAs` |
| 5 | This repository's copy | the same text, by setup | `diff` | **changes**, by the rerun |
| 6 | `templates/history/` v1 to v4 | frozen | setup test | no |
| 7 | `agents/redline-shaper.md` rule 10 and its example (`files` on 6 of 6 findings) | stated | `grep` | **changes** |
| 8 | `shapePrompt`'s Return sentence | stated: names no field of a call but `dependsOn` and `why_human` | run, 1 wording | **changes** |
| 9 | `humanShapePrompt`'s Return sentence | stated | run, 1 wording | **changes** |
| 10 | `reshapePrompt`'s Return, a round with no decided finding | stated | run | **changes** |
| 11 | `reshapePrompt`'s Return, a round with a decided finding | stated | run | **changes** |
| 12 | `reshapePrompt`'s Return, a human pass with no decided finding | stated | run | **changes** |
| 13 | `reshapePrompt`'s Return, a human pass with a decided finding | stated | run | **changes** |
| 14 | `FILES_ASK`, `FILES_ASK_DECIDED` (`:1046`, `:1056`) | feed rows 8 to 13 | *code* | no |
| 15 | `rulesBlock` (`:635`): "in the shaper's JSON it is ask with why_human ..., askRule ..., its recommendation what the person would do themselves" | stated, in a repository with rules | run | **changes** |
| 16 | The reshape's decided-findings block (`:2217`) | says what `files` means for a decided finding | run | no |
| 17 | The resume lines | appended after the Return sentence; restate nothing of the shape | 2 resumed runs | no, so `args.resume` entries of a run in flight keep their lines byte for byte |
| 18 | `planPrompt`: "The shaper's dispositions and deferred list, as JSON" | shows the findings as returned | pairs | follows the schema: the new finding field is shown |
| 19 | `implementPrompt`: "Dispositions and deferred items" | the same list | pairs | follows the schema |
| 20 | `agents/redline-plan-approver.md` points 1, 2, 5 and 6 | reads dispositions, files, drafts | read | **changes** |
| 21 | `SKILL.md`, the plan hand-off's description of `plan` and `deferredPlanned` | stated | read | **changes** |
| 22 | `docs/contract.md` ("The unattended section"), `docs/upgrading.md` ("Unattended section versions"), `docs/running.md` (Shape) | stated | `grep` | **changes** |
| 23 | `shapeSchema`, a Redline round's | checked in the shaper's own run | schema dump | **changes** |
| 24 | `shapeSchema`, a human pass's | checked | schema dump | **changes** for a call's options; no `cause` in a human pass (answer a) |
| 25 | `DEFERRED_SCHEMA` (shared with the resolve agent's) | checked | schema dump | no |
| 26 | `vetShape` (`:3842`): the spec check, unsorted ids, `checkDispositions`, `checkSecondLook`, `checkCalls`, `forceAskRules`, the path cleanup, `checkDeclineReasons`, `checkDrafts`, `checkWhy`, after the shape and every reshape | checked by the workflow | *code*; its stops are in `OWN_CHECKS` | **changes**: the new checks join the one function |
| 27 | The hold after a reshape (`:4328`) | checked | pairs | no |
| 28 | `tests/loop-test.mjs`: the mock shaper (`:193`), `whyEnum`, `dispositionEnum`, `findingRequired`, `OWN_CHECKS` | scripts and pins it | read | **changes** |
| 29 | `tests/setup-test.sh`: `ubody_pin` v1 to v5 and the history checks | pins each body | read | **changes**: v6's pin |
| 30 | `scripts/redline-setup.sh unattended` | inserts and merges the body; never parses the shape | read | no |

Six Return sentences and two schema builders carry the shape in the workflow. None of the six names an option's fields, so the new ones are asked for in each (`workflow/agents`, line 50: a field the record is read from is required in its schema and asked for in every prompt that returns it).

## Table C: every way a finding left to the person ends today (26 rows)

All measured. In every row the round's outcome kind is `left`, nothing is filed, no `file deferred` call is made, and the result's `deferred` is empty, unless the row says otherwise.

| # | Way | Recorded | Posted | Filed | v6 |
|---|---|---|---|---|---|
| 1 | A paths rule on its file; guided; the person picks "Make the change by hand after the run" | decision `{choice, notes, decidedBy: @login, rule}`; `decided[]` kind `left`; `forced[]` | reply `left to @author under repository rule <id> (<reason>). <notes> · decided by: @author`; handoff `### Left to @author (repository rules)`; thread left open, named with the rule | nothing | no change |
| 2 | The same; the person picks "Accept, no change" | the same shape; only `notes` differ | the same shape | nothing | no change |
| 3 | The same; a free-text answer, "file the drafted issue and add the index by hand" (`loser` #839) | the same shape | the same shape | **nothing** | no change: only a pick or the typed `<id>: defer.` defers (answer e, part 2); the skill says so when it says the answer back |
| 4 | A paths rule on a file the shaper's task lists (`files`) | forced the same way | as row 1 | nothing | as rows 1 to 3 |
| 5 | A prose rule (the shaper's `askRule` tag) | forced the same way | as row 1 | nothing | as rows 1 to 3 |
| 6 | One of Redline's own files | decision carries `rule: "redline's own file"`, `own: true` | reply `left to @author under the rule on Redline's own files (no Redline role may write them). ...`, which `prior-findings` reads as `decided` | nothing | the same treatment as a rule call (answer e, part 3) |
| 7 | The shaper wrote the rule call itself | its own options, not the workflow's two | as row 1 | nothing | **changes**: its options carry ends, and a defer option its draft |
| 8 | The shaper declined it | `forced.declined`; the call recommends "Accept, no change: <reason>" | as row 1 | nothing | no change |
| 9 | The shaper deferred it, with a drafted issue | **the draft is dropped at the forcing point**: the stop's `drafts` and `deferredPlanned` are empty, and the call offers the two options | as row 1 | nothing | **changes**: the draft is kept as the call's defer option |
| 10 | Plan dial: the person changes its disposition to fix or defer | warning "the disposition \"fix\" is not applied" | as row 1, with the person's notes | nothing | no change for fix or accept; **changes** for defer: kept, drafted, raised and filed |
| 11 | Autopilot, a rule | decision `{choice: "Left to the person", decidedBy: redline (autopilot), rule}`; `forced[].open: "open: By hand: ..."` | reply `... No change made; @author makes it. · decided by: redline (autopilot)`; handoff line with `open: <what Redline would have done>` | nothing | no change (answer e, part 1) |
| 12 | Autopilot, Redline's own file | the same, `own: true` | the same | nothing | no change |
| 13 | Autopilot, the shaper declined it | `open` is the decline, with no "open: " | the same | nothing | no change |
| 14 | A human review pass, guided | as row 1 | reply `Redline human review 1: left to the author under repository rule ...`, with its `redline:answers` line; summary "H1-1 left to @author under repository rule <id>" | nothing | as rows 1 to 3; the summary names the issue once |
| 15 | A human review pass, autopilot | as row 11, "the person makes it" | as row 14 | nothing | no change |
| 16 | A human pass's comment that asks for nothing, on a rule file | kind `none`, not forced | "no change requested" | nothing | no change |
| 17 | A revise-only pass, guided and autopilot | as rows 1 and 11 | the replies; no handoff, no sweep | nothing | as the rows it repeats |
| 18 | Resumed after an error at push and reply | the same outcome on the resume | the same reply | nothing | no change: nothing new is read before the resume point |
| 19 | Relaunched after the stop (the marker's args) | the decisions replay | as row 1 | nothing | no change |
| 20 | A call the person answered, stated a fix, that a reshape then puts under a rule | kind `left`; nothing demanded (#108, R1-8) | reply `left to @author under repository rule billing ...` with the person's notes | nothing | no change |
| 21 | A call the person answered with a deferral, whose draft they let go ahead, that a reshape then puts under a rule | kind `left`; **no warning** | the same reply; no issue named | **nothing: the deferral the person approved is not filed** | **changes**: a left finding whose decision ends in defer is filed |
| 22 | A final nit pass's finding under a rule | as row 11 in that round | as row 11 | nothing | as row 11 |
| 23 | A dry run; `no push` | as row 1 | a dry run writes the reply file only; `no push` posts it | nothing | a dry run files nothing, as for every draft |
| 24 | Not picked on the review dial | kind `dropped`; never forced | "not acted on in this run" | nothing | no change: it never reaches the forcing point |
| 25 | A nit on a rule file under `correctness only` | declined under the scope; never forced | no reply | nothing | no change |
| 26 | Already tracked (`knownAs`) on a rule file | never shaped | no reply; thread "not settled" | nothing | no change |

Found by running, in no open issue (searched: #119 covers the resolve's task under a paths rule, #115 the disposition shown, #109 the stray entry in `shape.md`):

- **Row 9.** The shaper's drafted issue for a rule-covered finding is thrown away before the person sees the call. On `loser` #839 the draft survived only as prose in `shape.md`.
- **Row 21.** A deferral the person approved is silently not filed when a reshape later tags its finding under a rule. The #106 spec's decision 15 kept "today's reading everywhere" for a finding left under a rule; this spec replaces that reading for the defer end only.

## Table D: every earlier finding a `sameClassAs` link can name, and what the record shows of it (20 rows)

Added with answer b. The replies are the ones a run really posts (two loop runs, one reply per outcome), each fed through `classify` as cut from `scripts/redline-gh.sh` lines 612 to 622.

| # | The earlier finding | This run's record (`outcomeKinds`) | An earlier run's record (`prior-findings` `disposition`, from the reply's first words) | Does the record show it was fixed? |
|---|---|---|---|---|
| 1 | A fix the shaper decided, committed | `fixed` | `fixed` ("fixed in 1bbbbbb ...") | yes, both |
| 2 | A call the person or autopilot answered with a fix, committed | `decided`, with the commit on the outcome | `decided` ("The author changes it. Applied in ...") | this run: by the commit. An earlier run: **only in the reply's words** |
| 3 | A deferral whose mitigation was committed | `deferred`, with the commit | `deferred` ("deferred to #301. Mitigated in ...") | the same as row 2 |
| 4 | A deferral that ships nothing | `deferred` | `deferred` | no: nothing was fixed |
| 5 | A decline | `declined` | `declined` | no |
| 6 | Left under a rule | `left` | `left` | no |
| 7 | A call the person accepted | `decided` | `decided` | no |
| 8 | Not picked on the review dial | `dropped` | `dropped` | no |
| 9 | A fix the build left out | none: the round stops at check | no reply, so `none` | no |
| 10 | Declined under the scope | no kind | never read back (its id is not bold) | no |
| 11 | Already tracked (`knownAs`) | no outcome | not a finding line | no |
| 12 | A finding of the same round | not earlier | n/a | the link is cleared |
| 13 | A human review pass's fix, named by its final nit pass | `fixed` | not read back by `prior-findings` (it reads `R<n>-<k>` lines) | this run only |
| 14 | An earlier run's finding, fixed by that run | n/a | `fixed` | yes |
| 15 | An earlier run's finding a later run's reviewer found gone | n/a | `fixed` ("resolved; first reported as R1-1 ...": **no commit of Redline's is named**) | the code no longer has it; who fixed it is not shown. This is the reading #82 is about |
| 16 | An earlier run's finding carried into a later run and fixed there | n/a | `carried`, `carried_to: R2-1` ("carried forward as R2-1; fixed in ...") | under the later id, R2-1, which reads `fixed` |
| 17 | An earlier run's finding with no reply, or `not changed` | it is carried into this run's first round as a finding of this run (`carriedFrom`) | `none`, `not-changed` | no |
| 18 | An id of this run's own round form that names nothing | none | none | the link is cleared |
| 19 | The earlier finding's `cause`, as its round recorded it | in `rounds[].dispositions` once the field exists | **not in the record**: `prior-findings` reads the review and the threads, never a spec folder | this run only |
| 20 | An earlier finding of a run made before v6 | n/a | as rows 14 to 17, with no `cause` | as above |

What it shows: the `prior-findings` record can show that an earlier run fixed a finding, through `disposition: "fixed"`, a field the script already prints. It cannot show two things. A fix made at a call or as a mitigation reads `decided` or `deferred`, and only the reply's words say a commit was made (rows 2 and 3). And the cause an earlier run recorded is not in it (row 19), so the shape prompt's block can name an earlier run's finding by id, title, place and reply, never by its recorded cause.

## Judgements, and the agent that makes each (decision 6)

Every new fact an agent states is a named field. These are the ones no check of the workflow can settle, each with the agent that judges it and what the workflow still checks around it.

- **That two findings are of one class.** The verifier (`redline-reviewer`), in `sameClassAs`. The workflow checks only that each id it names is recorded as `fixed`, in this run's rounds or in the pull request's `prior-findings` entries, and clears the rest.
- **Where a cause lives, and whether it is an instance or a class.** The shaper (`redline-shaper`), in `cause`. The workflow checks the field is there, that `where` is a path inside the repository, that a `one-place` fix lists that path among its own files, that a `sweep` returns what it covered, and that a fix under a standing link is not `instance`.
- **That the shaper's answer is right.** The plan approver (`redline-plan-approver`): the cause is where the shaper says; an `instance` is no class (its own plan does not admit that a later input will need the same); a sweep's table in `shape.md` lists the class from a named source, was measured by running and is complete, with no member left exposed and unfixed. A miss is a bounce, which the reshape repairs inside the run.
- **What an option ends in.** The shaper, in `ends`, before anyone decides. The workflow checks the value is one of the three and the call's shape (unique labels, a `recommended` that names one, a left call's draft complete). It does not judge that the end fits the option's words: the end is what the dial shows the person, and a pick is held to it.
- **What an answer in the person's own words ends in.** The resolve agent (`redline-resolve`), in `decided`, as since #99, held to the tasks and entries the same resolve returned. That is a consistency check, and the README's Known limits says what it cannot see.
- **The drafted issue for a typed `defer` on a left call that offered no drafted option.** The resolve agent. The workflow checks the entry is there and its draft complete, and the person sees it at the draft stop before it is filed.
- **Which listed option an answer picks.** The session (the skill), in `option`: recorded only for a pick in the question or the label typed as written, and said back. The workflow checks it names an option of the call.

## For you to open

Drafted in the form of this repository's issues. No open issue covers any of them (the open list was read on 2026-11-24; the nearest are #75, which this spec closes, #104 and #115).

### 1. Ask instance or class of a fix the resolve agent plans, and let a class link name one

**What was found.** Since template v6 the shaper answers one question for every finding it sorts as `fix` in a Redline round: where the cause lives, and whether it is one instance or a class (`cause` on the finding, its `outcome` one of `one-place`, `sweep` or `instance`). A fix that reaches the plan another way is never asked: a judgment call the person or the autopilot answered with an option that ends in `fix`, a disposition the person changed to `fix` (a decline overruled, a deferral turned back into a fix), and a free-text answer the resolve agent plans as a change. The resolve agent applies a decision and does not investigate, so its task carries no `cause`, the plan approver has nothing to hold it to, and the round's record keeps none. Two things follow. Such a fix can be one more instance of a class, with nothing asking. And the verifier's `sameClassAs` link, which makes a later round's shaper close the class, stands only for an earlier finding recorded as `fixed`: a fix made at a call is recorded as `decided` and a shipped mitigation as `deferred`, in the run's own record and in `redline-gh.sh prior-findings`, so a link that names one is cleared with a warning and the second instance is fixed as the first was.

**Why it was not fixed with template v6 (#75).** The step was built where its evidence is: every instance fix of #112's two classes was the shaper's own. A fix planned from a decision is the person's, or the autopilot's taking of the shaper's recommendation, and asking the class question of it needs a design of its own: who answers (the shaper, on each option that ends in `fix`, before the decision, or the resolve agent, which would then investigate), what an override and a free-text answer carry, and whether a `decided` or a `deferred` outcome with a commit of its own may start a class. An earlier run's record shows a commit for those two kinds only in the words of its reply.

**Proposed fix.** Have the shaper state `cause` on every option of a judgment call that ends in `fix`, so a picked option carries it into the round's record, and decide what an override and a free-text answer do: asked of the resolve agent, or exempt and said so. Then let a `sameClassAs` link stand for any earlier finding whose record holds a cause, whatever its outcome kind. Pin each with a loop case: a picked fix option's cause is in the round's dispositions and a link to it stands, and its neighbour, a link to an accepted call, is cleared.

Drafted in the #105 spec (`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`, "For you to open").

### 2. Show the shaper the cause an earlier run recorded for a finding a class link names

**What was found.** When the verifier links a finding to an earlier one of the same class (`sameClassAs`) and the link stands, the round's shape prompt names the earlier finding. For a finding of the same run it gives the `cause` that round's shaper recorded: where it lives, and whether it was fixed in one place, swept, or fixed as an instance. For a finding an earlier run on the pull request fixed it gives the id, the title, the place and the reply only: `redline-gh.sh prior-findings` reads the posted reviews and the threads, never a spec folder, so the workflow holds no cause for it. The shaper can open the earlier round's `shape.md` under `agent-os/specs/`, when that run's folder was committed, but nothing tells it which folder holds it or that it is there.

**Why it was not fixed with template v6 (#75).** The hold on the link does not need it: a fix under a standing link may not say `instance`, whatever the earlier cause was. Carrying a cause across runs means a new read at launch and a new key in `priorFindings`, or a cause written into posted text that `prior-findings` reads back, and each is a change to the launch's contract with the script.

**Proposed fix.** Decide where an earlier run's cause is read from. The round's `redline/` folder, which the run-record commit keeps, is the candidate: write each fix's `cause` beside the findings there, and have the skill, or `prior-findings`, read it at launch. Pass it in `priorFindings` and show it in the block. Add a `gh-test.sh` case if the script reads it, and loop cases that the block carries an earlier run's cause when the entry holds one and none when it does not.

Drafted in the #105 spec (`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`, "For you to open").

### 3. File a rule call's drafted option without a second stop when the person picks it

**What was found.** Since #126 an option of a judgment call left to the person (under a repository ask rule, or on one of Redline's own files) can end in `defer` and carry its drafted issue, and the session shows that draft's title with the option. When the person picks it, the round relaunches, the resolve agent records the deferral, and the round stops a second time, at its draft stop, to show the same draft and ask whether it goes ahead, as it does for every deferral chosen at a call. For a deferral the resolve agent drafts after the decision, that second stop is the first time the person sees the text. For a picked option it is a repeat, and it costs a relaunch.

**Why it was not fixed with template v6 (#126).** Skipping the stop means the pick itself answers the draft: the first stop would have to give the option's draft a version, and the skill would record an entry in `args.deferrals` for it beside the decision. That adds a producer to `record.drafts`, whose version counts the issue text alone (#104 proposes to count what the stop shows), and the first stop would have to show the whole body, not the title, for the rule that every body is shown before anything is filed to hold.

**Proposed fix.** At a stop that carries a left call with a drafted defer option, give the draft its version and show its title and whole body with the option. When the person picks it, record the go-ahead in `args.deferrals` with that version, so the round's draft stop finds it answered. Settle it together with #104. Loop cases: a pick files with one stop; a draft a reshape changed after the pick is raised again; a pick of another option records no answer for the draft.

Drafted in the #105 spec (`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`, "For you to open").

## For you to add

Drafted comments; posting is yours.

### To #115

> Template v6 (#105) closed part of this without changing what `effectiveDispositions` reads. A judgment call answered by picking one of its options now carries the option's stated end as the decision's own `disposition`: the workflow sets it from the option's `ends`, and from the call's `recommended` option on autopilot. `effectiveDispositions` already shows a decision's own disposition, so a picked call is shown to the plan approver and the implementer as `fix`, `defer` or `accept`, whatever a reshape re-sorts its finding to (measured on four pairs of runs: `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`, the follow-up to answer c). What is left is a call answered in the person's own words: its decision names no disposition, the resolve agent states its end, and it is still shown as `ask`, or as a reshape's re-sort. The case in this issue, a reshape that re-sorts a call stated as a fix to `decline`, now needs a free-text answer. One clause was added to the function for another reason: a finding left to the person keeps the disposition the shaper returned, whatever its decision names, so a deferred rule call is shown as `ask`, and so is a decided fix that a reshape later leaves to the person, which was shown as `fix` until then. In the proposed fix, "a call the round tracks whose decision names no disposition" stands, and such a call is now always a free-text answer.

### To #119

> Template v6 (#126) changed what a finding left to the person can end in, which bears on the options here. A left finding whose decision ends in defer is now filed: `isDeferral` reads it as a deferral when its decision names `defer` or the resolve agent stated `defer`, however the finding came to be left. That includes a decided call a reshape later puts under a rule. Before, a deferral the person had approved was then not filed, and nothing said so (table C, row 21, in `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md`); a fix or an accept so placed is unchanged in what the round does: left, with nothing demanded. What its later passes are shown did change, by one clause in `effectiveDispositions`: every finding left to the person is shown to the plan approver and the implementer as the shaper returned it, an `ask`, where a decided fix a reshape had put under a rule was still shown as `fix` (the loop test's `filing: a call whose decision names a fix that a reshape leaves to the person under a rule` pins it). So under option 2 here (record the finding as left to the person when the resolve returns), a decided deferral would be filed and a decided fix would not be built, as on the reshape path. Still as this issue describes: the paths rules never run on a resolve's tasks. And one more gap of the same kind: the workflow does not check that the resolve agent planned no task with files for a finding left to the person, a typed `defer` on a rule call included. The plan approver's rule 5 and the guard are what catch one.

### To #109

> Template v6 (#126) leaves a third place where an entry leaves the workflow's list while `shape.md` is not touched, beside the override and the stated call this issue names. For a finding left to the person (under a repository ask rule, or on one of Redline's own files), `resolveWith` filters out a deferred entry the resolve agent returns unless the decision ends in defer, and it does so with no warning, as it did before v6 for every such entry. The resolve agent is told not to list such a finding under `## Deferred`, so the file should not hold it, but nothing checks that. The fix proposed here, naming the dropped ids to the implementer, would cover it if the filter recorded what it dropped. The other drop v6 touched is gone: at the forcing point the shaper's own deferred entry for a rule-covered finding used to be dropped while `## Deferred` kept it, and it is now kept as the call's defer option.

### To #75

> Built in template v6, with two changes from the text above and one thing not shown.
>
> Changed. The step has three valid outcomes, recorded on the finding as `cause` (`where`, `outcome`, `why`): `one-place`; `sweep`, the instance fix plus the class measured, each member returned in `cause.swept` as `holds` or `fixed`, with the table in `shape.md`; and `instance`, with why the cause is not a class. The instance fix is not offered to the person as a fallback: a class the shaper cannot close in proportion is a `defer` or an `ask`. And the cue from the comment above is a field: the verifier states `sameClassAs` on a finding, the workflow honours it against the record of what was fixed (this run's rounds and the pull request's earlier runs), and a fix under a standing link may not say `instance`.
>
> Shown. The loop test replays #112's first class: red before the build, an instance fix a round to the cap; green as built. One case per check stands beside it.
>
> Not shown. This issue's own Done when. Whether a real shaper offers the `resolve()`-level fix first on #817 at R1-2 is a judgement no stub shows, and that rerun is still to be made. A fix the resolve agent plans is not asked the question; a separate issue is drafted for it in the spec.

## Yours after the build

Every commit; the pull request; its self-review, where a real shaper returns `cause` on every fix; the #817 rerun; the setup rerun in each other repository; the four comments and the three issues above.

## Not shown by this pull request

That a real shaper names the right cause, that a real plan approver bounces a sweep that was traced and not run, and that a real verifier links a second instance to the first. The loop's stubs cannot show an agent's judgement. The source pins show that each agent is told the rule; the two live checks above show whether it follows it.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people": a pick is held to the end the person was shown, a rule call stays the person's and its deferral is tracked when they choose it, and autopilot still decides nothing on one. "Honest about its reach": `shape.md` and the README say what the checks cannot see.

## Standards Applied

- workflow/agents — line 9, the shaper decides and a person is asked in named cases; line 10, a class is settled by a table built by running, and a finding of a class an earlier round fixed is fixed as the class; line 11, the `left` outcome and what `prior-findings` reads of its reply; line 17, a rule a prompt states is changed everywhere it is stated, and an exception written after two rules says which one it lifts; line 38, the workflow checks a result before it acts on it, the shaper's checks run in one function after the shape and every reshape, and the reshape prompt asks for every field they read; line 40, a list posted under an outcome's heading is read off each finding's final outcome, and a decided finding is a deferral only when its decision made it one; line 41, a value a later pass rebuilds keeps what an earlier pass recorded; line 47, a fact an agent states is checked against the run's record, and a check that would see a wrong statement compares against something stated before that agent ran; line 50, a field the record is read from is required in its schema and asked for in every prompt that returns it.
- workflow/replay — line 6, decisions enter after the prompt they answer; line 10, a field a stop adds is named in `relaunch.how` in the same commit, with the skill section that records it; line 16, a block appended to an existing interpolation keeps a repository without it byte-identical; line 19, a stop that is the workflow's own check is told so by the field it set; line 21, a reworded resume sentence changes a run in flight, so none is reworded; line 25, a new ask sits in the block only the calls it concerns carry, and the prompt states the whole ask.
- testing/tests — line 7, a mock answers as the real agent would and returns every required key; line 9, a rule stated in an agent file and a prompt is pinned by a key phrase in both; line 14, a check fails and does not throw; line 15, a stage error is pinned by its `resumeFrom` label; line 16, a rule about every prompt is pinned over every scenario; line 30, a tested surface gains a case and its neighbour in the same commit; line 33, a rule that picks one record is pinned where the nearest wrong pick gives another answer; line 35, red before green; line 36, a claim that prompts stay byte-identical is proven by a sweep; line 37, a count is read off a run; line 38, a merge case pins a conflict's extent.
- process/docs-gate — one Docs entry per touched plugin file; line 20, a change to what a stopped run does under the new release gets a section in `docs/upgrading.md`.
- process/release — a minor bump in both manifests with the template marker, since the unattended section's body changes; the tag and the changelog are a person's step after the merge.
- process/standards-retrospective — the retrospective is put to the person before any edit, and lands in its own commit.
- process/internal-notes — nothing copied in from the private repository.
- prompts/attribution — no model or vendor name anywhere.
