# PR #127 review round 3 — Shaping Notes

Shaped by Redline in unattended mode, for review round 3 of PR #127 (issues #105, #75 and #126; template v7, plugin 0.5.0), from the round's eleven findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). Line numbers are at `b696aee`, the head of the branch. This run was started fresh after the round 2 run stopped at its shape (see the key places spec, `agent-os/specs/2026-11-25-1108-127-key-places-by-hand/`); six of the findings carry round 2's (`carriedFrom` R2-1 and R2-3 to R2-7), and R2-2 was fixed by hand in that spec. Corrected in place after the plan approver's first bounce (adjustment 1 of at most 2); see "Plan adjustments" under Decisions.

## Scope

The round's eleven findings, nothing more:

- R3-4 (correctness): a typed `<id>: defer.` for a left call a reshape raised is read on the relaunch as a plan-dial override, before the finding is left.
- R3-5 (correctness, low): a class link to a sibling the review renamed resolves to the earlier finding that had the old id, with no warning.
- R3-6 (correctness): a call that names a repository rule in `why_human` with no `askRule` tag on its finding is applied as an ordinary call.
- R3-10 (correctness, carried from R2-6): no workflow check keeps a left deferral's mitigation and task empty when its call offered no draft.
- R3-1 (nit): `docs/contract.md` names the unattended marker and the precheck warning as v6; the template is v7.
- R3-2 (nit): three texts say the shaper's schema refuses every key it does not name; a deferred entry accepts any key.
- R3-3 (nit, carried from R2-1): deferring a left finding is said to stop the round to show its draft, which never happens under `defer at end`.
- R3-7 (nit, carried from R2-3): a kept draft's call recommendation doubles a period that ends the draft's title.
- R3-8 (nit, carried from R2-4): the unmatched-option warning promises a resolve-agent statement that is never asked for a left finding.
- R3-9 (nit, carried from R2-5): a later resolve can replace a left deferral's option draft with no warning.
- R3-11 (nit, carried from R2-7): for a left deferral with a commit of its own, the warning gives a false reason and implies a reply names the commit.

`.claude/redline.json` declares no `askRules`, so no repository ask rule covers any finding. In this repository the plugin's source is repository content (rule 7), and none of the eleven touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text, so none is deferred under point 11 and none is a call on one of Redline's own files.

No open issue tracks any of the eleven: `redline-gh.sh issues-search` for `askRule`, `sameClassAs`, `left to the person`, `prose rule` and `override` found only #126 (which this pull request closes), #119 (a resolve's task for a decided finding under a paths rule, a different reader), #118, #115, #109, #101, #69, #25 and #20, none of which is one of these.

Every finding is `fix`. No `decline`, `defer` or `ask`.

## Decisions

### R3-4: a typed defer for a left call is marked as a call's answer, so no reader before the first resolve takes it as an override — fix

Confirmed by reading. `skills/redline/SKILL.md:213` records `<id>: defer. <reason>` for a left finding with `"disposition": "defer"` at any stop, and `relaunch.how` (`workflows/redline-loop.js:3025`) says the same. A reshape can raise a left call: `forceAskRules` runs on every reshape (`vetShape`), a reshape that tags a finding with a rule or lists a rule's path for it forces it, and the call is `raised` (4899) and stops the round with `afterApproval: true` (4919-4921). On the relaunch the first shape replays, and it did not force the finding, so `overridesFor(calls)` (4443) counts the decision as a plan-dial override (a disposition, an id that is no call of the first shape). `resolve r1` then runs where the first launch ran none, its "Disposition overrides" block tells the agent to "plan the mitigation the notes describe as a task", and the decision carries no `rule`, since the finding is not forced yet. From that resolve on nothing replays. The shaper's draft filter (4405-4406) reads the same field the same way, so a shaper's own deferral that a reshape later forced, and that the person then typed a defer for, also loses its draft at the relaunch's first stop.

- **Unattended answer.** Whether such a decision may be taken as an override is answered by `agent-os/standards/workflow/replay.md` line 6: "a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve: a later stop of the round (a reshape after a bounced plan, a draft the resolve agent wrote) takes none". SKILL.md:217 refuses a typed decline overrule at such a stop for that reason. The typed defer of #126 is the one answer to a call that carries a disposition, and nothing marks it as such, so the workflow cannot keep it out of the readers that run before the first resolve. Not a judgment call: the standard and the pull request's own promise ("A pick of it, or `<id>: defer. <reason>` typed for the finding, has Redline file the draft", the PR description) both stand, and only the record cannot be read the way they require.
- **Which way.** The reviewer offers two. (a) The skill marks the answer and the workflow's pre-resolve readers skip a marked decision. (b) The skill records the typed defer at a later stop without `disposition`, and `resolveWith` reads it as a defer when the raised call is applied. (b) needs a marker too: a decision with no disposition on a left call is an answer in the person's own words, which the PR spec says leaves the finding ("Autopilot leaves a rule call and files nothing. A rule call is deferred only by a pick or the typed `<id>: defer.`; other wording is left"), so `resolveWith` could only tell the two apart by a key. (a) keeps the decision's form, the named-disposition path the PR spec chose for it, and adds one key. Refusing the typed defer at a later stop, as SKILL.md:217 does for an overrule, would take away the only way to defer a left call that offers no drafted option. So (a) is the clear pick, and none of the five cases holds.
- **Proportionality.** Likelihood: low; it needs the guided or plan dial, a bounced plan whose reshape newly leaves a finding to the person, and a typed defer rather than a pick at that stop. Impact when it fires: the round's first resolve plans a mitigation for a finding the rule leaves to the person, every prompt after it reruns, and, when the rerun reshape does not force the finding again, it posts as an ordinary decided deferral with its mitigation built (under a prose rule nothing refuses the write). Cost: in `workflows/redline-loop.js`, one intake loop, one set, two filters and one warning; one sentence each in `skills/redline/SKILL.md` and `relaunch.how`; loop cases. Every file is one the pull request changed.
- **Instance or class.** The cause lives in `workflows/redline-loop.js`: the readers that run before the round's first resolve (`overridesFor`, 4443, and the shaper's draft filter, 4405-4406) take every decision that carries a disposition and names no call of the first shape as one the person changed after seeing the plan. Members of the class (every answer that carries a disposition and can be recorded at a stop after the first resolve), found by reading the skill's record rules, since the node harness is refused to the shaper: a typed defer for a left call (exposed, closed by this task); a typed decline overrule (refused by SKILL.md:217, and such a stop lists no declines, 5766); a draft's `fix` or `accept` (refused: `canFix` is false at such a stop, 5728); a restated override from `overridesUnresolved` (an override already, applied by the resolve that raised it). The two readers are the only readers of a decision's `disposition` outside `roundDecisions` before the first resolve (a search of the source for `.disposition` beside `decisions`). One set, built where the decisions enter, is read by both, so every marked answer is closed at once. Outcome `one-place`.
- **The change.** Task 2. Intake: a decision may carry `"call": true`; any other value of `call` is refused, as a decision's other faults are; the key is moved off the run's copy into a set, so no prompt shows it. `overridesFor` and the draft filter skip an id in the set. A marked decision whose finding no shape or reshape of the round raised a call for is warned about once, before the round's dispositions are final, and is not applied. The skill records a typed defer for a left finding with `"call": true` beside `"disposition": "defer"`, at every stop, and `relaunch.how` says so. At the first stop the marker changes nothing, since the call is one of the first shape's.

Decided by: redline

### R3-5: a class link that names an id the review renamed is cleared as ambiguous — fix

Confirmed by reading. `review()` renames every finding whose id lacks the round's prefix (3143-3166) and records each rename in `renamed`; only the coverage refs follow that map (3220-3238). `honourLinks` runs after the rename (3196) and tests a link to the same round by the renamed ids (3092), so a link naming the old id of a renamed sibling is looked up by `linkFault` among earlier rounds (3061-3072) and stands when an earlier round recorded that id as fixed, with no warning beyond the renames.

- **Proportionality.** Likelihood: low; it needs a reviewer that numbers its findings with an earlier round's prefix (the case the rename exists for) and links one of them to a sibling. Impact: the finding is shaped as one class with an unrelated earlier finding, and an `instance` fix for it stops the round at `shape`; nothing is posted wrong. Cost: a few lines in `review()`, one clause of `docs/running.md`, one loop case.
- **Which way.** Clear, never map. A misnumbered id meant as the earlier finding reads the same as one meant as the sibling, so the id is ambiguous; mapping it to the new id would clear it as "a finding of this round" and say nothing of the ambiguity, and keeping it trusts an id the workflow has just found misnumbered. `agent-os/standards/workflow/agents.md` line 47: "a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred".
- **Instance or class.** The cause lives in `review()` in `workflows/redline-loop.js`, where the rename map is the one record of which ids changed. Readers of a finding's id in the review's own result: the coverage refs (they follow the map, 3220-3238; holds), `sameClassAs` (exposed, closed here), `carriedFrom` and `knownAs` (they name earlier rounds' findings, which the rename never touches). Clearing a renamed id there, before `honourLinks`, closes every link that names one. Outcome `one-place`.
- **The change.** Task 3: before `honourLinks`, every `sameClassAs` id that is a key of `renamed` is removed from its finding's list with a warning that says the review renamed a finding it returned under that id, so the link is ambiguous; a finding left with no link carries no key, as `honourLinks` leaves one. In `docs/running.md:86` the clause for it goes after the parenthetical that says the link-asking schema "refuses both", never before it: that schema puts no pattern on a link's ids (`reviewSchema`, `workflows/redline-loop.js:889-901`), so the sentence must not count a renamed id among what it refuses (plan adjustment, below).

Decided by: redline

### R3-6: a call asked under a repository rule holds its finding to that rule when the finding carries no tag — fix

Confirmed by reading. `forceAskRules` takes a prose rule only from the finding's `askRule` tag (3919-3920). A call whose `why_human` is `repository rule <id>`, on a finding with no tag and no matching paths rule, passes the schema (the enum allows the value, 988) and `checkWhy` (3607), and is never put in `record.forced`. On autopilot `autopilotDecision` picks the call's `recommended` option and `resolveWith` gives the decision that option's end (4516-4518), so the recommended change is planned and built and its reply reads `decided by: redline (autopilot)`; on guided a pick of an option that ends in `fix` is built the same way; a drafted option on the call is dropped with a warning by `checkOptions`, since the call is not forced.

- **Proportionality.** Likelihood: plausible; the shaper writes the call's reason and the finding's tag in two places of one result, and its rule 7 asks for both. Impact: a change the repository says a person is always brought in for is built by Redline, the stake the ask rules exist for. Before this pull request the resolve agent stated each call's end and read the call as it did; since #105 a pick's end is taken from the option, with no agent reading the call. Cost: one lookup and one warning in `forceAskRules`, one clause of `docs/contract.md`, loop cases. The tag lookup predates this pull request, but it sits in the function this pull request rewrote for #126, the fix is a few lines there, and the pull request made the consequence worse, so it is not a deferral.
- **Instance or class.** The cause lives in `forceAskRules` in `workflows/redline-loop.js`, the one place a finding is left to the person under a rule (agents.md line 11: "One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape"). The ways it can learn that a rule covers a finding: a paths rule on the finding's file or on its task's files (holds), the shaper's `askRule` tag (holds), the reason of the call the shaper wrote (exposed, closed here). Reading the call's reason there, after the paths and the tag, covers a paths rule and a prose rule alike, on the first shape and on every reshape. Outcome `one-place`.
- **The change.** Task 4: when no paths rule matches and the finding carries no tag, an `ask` finding whose call's `why_human` is `repository rule <id>` for a declared rule is forced under that rule, with a warning that the shaper did not tag the finding. A call under that reason was written as left, so it is not relabelled and its defer option is held to its draft, as a tagged one's is today.

Decided by: redline

### R3-10: a left finding's deferred entry carries no mitigation, and a resolve that plans a task with files for a left finding stops — fix

Confirmed by reading (R2-6 re-verified at this head). For a left finding the person deferred, `resolveWith` clears `mitigation` only when the picked option, or the call's single drafted option, carries a draft (4604-4614); otherwise `once` keeps the resolve agent's entry as written, mitigation included (4620). Two answers reach that path: a typed defer on a call that offered no draft, and, since round 1's R1-4 fix, a pick of a relabelled call's undrafted defer option. The entry joins `deferred` (4727), which the implementer is given under "a defer task ships only the mitigation". No check holds a left finding's task to no files: `named` includes a left deferral (4664) but `namedAs('defer')` checks only an entry; the fix and accept checks do not apply; `tracked` excludes forced ids (4470), so neither the hold after a reshape nor `plannedFiles` reads its task; `needCommits` drops forced ids. A reshape that newly forces a decided deferral keeps its earlier entry, mitigation included (`stillDeferred`, 4905-4916).

- **Unattended answer.** What the round promises is stated: `docs/running.md:95`, "no task is planned and nothing is written under the rule", and the resolve prompt's bullet for a left finding the person deferred, "No task writes anything for it either". The code disagrees with that answer, so the disagreement is the fix.
- **Proportionality.** Likelihood: low; it needs a resolve agent that departs from its bullet and a plan approver that passes it. Impact: under a prose rule a mitigation is built under a rule that leaves the change to the person, and its reply names no commit (`commits: []`, 3427); under a paths rule the guard blocks the build. Cost: one helper used at two places, one check beside the resolve's other task checks, the two source-count pins, loop cases. Every file is one the pull request changed.
- **Instance or class.** The cause lives in `resolveWith` in `workflows/redline-loop.js`: the round takes the resolve agent's entries and tasks for a left finding as written. A left finding's entry enters `deferred` at two places, the end of `resolveWith` and the reshape's rebuild, and a left finding's task is read only from the resolve that applies it (a reshape lists an ask's recommended paths, never a task, and `tracked` is false for it). One helper at both entry points and one check over every left id a resolve applies, deferred or not, close every path. Outcome `one-place`.
- **The change.** Task 5: every entry `deferred` takes for an id in `record.forced` has `mitigation: ''`, at the end of `resolveWith` and at the reshape's rebuild, and a mitigation cleared there is warned about. `resolveWith` stops at `resolve` (a `checkError`, so `ownCheck` is set and the resume reruns the resolve agent) when a task it returned with files names a left id it applies. The check covers a left finding nobody deferred as well, since no task writes anything for one either. The loop case for a typed defer scripts the mock's call so that no option ends in defer (`ends: { 'R1-1': 'fix' }`), and pins that setup, so it proves the path it is named for (plan adjustment, below).

Decided by: redline

### R3-1: the contract names the current marker and warning as v7 — fix

Confirmed by reading: `docs/contract.md:118` says `<!-- redline-unattended: v6 -->` and "the plugin ships v6", while `templates/shape-spec-unattended.md:35` and this checkout's section (`.claude/commands/agent-os/shape-spec.md:26`) are v7, and `docs/contract.md:175` and `docs/upgrading.md:31` already say v7.

- **Instance or class.** The current version is stated in several documents, a list kept in many places. Swept by search (table below). Outcome `sweep`.
- **The change.** Task 6: both mentions on line 118 read v7.

#### Sweep for R3-1: every statement of the unattended section's current marker

Measured with `grep -rn -e 'ships v6' -e 'unattended: v6' -e 'ships v7' -e 'unattended: v7'` over `README.md`, `docs`, `skills`, `agents`, `workflows`, `templates`, `tests`, `scripts`, `CONTRIBUTING.md` and `.claude/commands`, the frozen bodies under `templates/history/` left out.

| Member | Found |
|---|---|
| `docs/contract.md:118`, the marker and the quoted warning | fixed |
| `docs/contract.md:175`, the unattended section's marker | holds |
| `docs/upgrading.md:31`, the marker and the quoted warning | holds |
| `templates/shape-spec-unattended.md:35` | holds |
| `.claude/commands/agent-os/shape-spec.md:26` | holds |
| `tests/loop-test.mjs:5431`, the marker pin | holds |

Decided by: redline

### R3-2: the statements of what a schema refuses name the objects it refuses on — fix

Confirmed by reading. `DEFERRED_SCHEMA` (`workflows/redline-loop.js:1019-1022`) has no `additionalProperties: false`, on purpose (the comment at 1068-1069; the key places spec, decision 21), and of the draft fields only `fullFix` is required. `docs/upgrading.md:45`, `docs/running.md:86` and `agents/redline-shaper.md:34` say the shaper's schema refuses any key it does not name. A shaper that nests a deferred entry's draft under `draft`, as an option's is, passes the schema and meets `checkDrafts`' stop, "with no drafted issue (missing title, found, why)" (3850), which names no place. The same search found one more: `agents/redline-reviewer.md:78` says the link-asking review's tool refuses a key it does not name, while `reviewSchema` (891-899) refuses one on the result and on a finding only; a `resolved` or `coverage` entry is open.

- **Instance or class.** A rule stated in several places (agents.md line 17). Swept by search (table below). The stop the misled shaper meets is a member too: agents.md line 17, as the follow-up of #127 extended it, asks that a key's stop say "where it found one a level out". Outcome `sweep`.
- **The change.** Task 7: the four sentences name the objects their schema refuses an unnamed key on, and say a deferred entry is open (for the reviewer: a `resolved` or `coverage` entry), keeping the words `refuses a key it does not name` that the loop check `places:` pins in both agent files. `checkDrafts` keeps today's message whole, `...; a deferred item always carries one`, and, when the entry carries a `draft` object, appends `; this entry carries a draft object, which is not read on a deferred entry: the entry holds title, found, why and fullFix itself, beside mitigation`, built before its one throw site, so the `resume:` count pins do not move (plan adjustment, below).

#### Sweep for R3-2: every statement of what a schema refuses

Measured with `grep -rn -e 'refuses any key' -e 'refuses a key' -e 'additionalProperties' -e 'refuses an unknown' -e 'refuses unknown'` over `README.md`, `docs`, `skills`, `agents`, `templates`, `workflows`, `CONTRIBUTING.md` and `.claude/commands`, the frozen bodies left out, each statement read against the schema it describes.

| Member | Found |
|---|---|
| `docs/upgrading.md:45`, "refuses any key it does not name, and so does the schema of a review that is asked for class links" | fixed |
| `docs/running.md:86`, "the shaper's output schema refuses a key it does not name" | fixed |
| `agents/redline-shaper.md:34`, "the tool you return through refuses a key it does not name, one written a level out included" | fixed |
| `agents/redline-reviewer.md:78`, the same for a review asked for `sameClassAs` | fixed |
| `workflows/redline-loop.js:3846-3852`, `checkDrafts`' stop for a deferred entry's draft fields | fixed |
| `workflows/redline-loop.js:1061-1069`, the comment above `CAUSE_SCHEMA` ("A deferred entry keeps the schema it shares with the resolve agent's") | holds |
| `workflows/redline-loop.js:884-887`, the comment above `reviewSchema` ("on the result and on a finding") | holds |
| `workflows/redline-loop.js:976-978`, the comment above `judgmentCallSchema` | holds |
| `templates/shape-spec-unattended.md` | holds: it states no schema's reach (the key places spec, decision 23) |

Decided by: redline

### R3-3: a deferred left finding's draft is shown before it is filed, at the round's stop or at the end-of-run stop — fix

Confirmed by reading (R2-1 re-verified at this head). Under `defer at end`, `raisesDrafts` is false (4376), so `openDrafts` returns nothing (4401) and `draftStop` never stops; `holdsDrafts` holds the draft for the end-of-run stop (SKILL.md:262). SKILL.md:213 and `docs/running.md:95` say the round stops once more to show it, and SKILL.md:228 says the same of any typed defer (a sentence that predates this pull request, in a file it changed).

- **Instance or class.** One sentence about when a chosen deferral's draft is shown, kept in several places. Swept by search (table below). Outcome `sweep`.
- **The change.** Task 8: the three sentences say the draft is shown before it is filed: at a stop of the round, or, when deferred items are raised at the end of the run, at the end-of-run stop.

#### Sweep for R3-3: every statement of when a chosen deferral's draft is shown

Measured with `grep -rn -e 'stops once more' -e 'once more to show' -e 'drafted after' -e 'stops again' -e 'shown before it is filed'` over `README.md`, `docs`, `skills`, `agents`, `templates`, `workflows` and `CONTRIBUTING.md`, each hit read against `raisesDrafts` and `holdsDrafts`.

| Member | Found |
|---|---|
| `skills/redline/SKILL.md:213`, "Either way the round stops once more to show the draft before it is filed" | fixed |
| `skills/redline/SKILL.md:228`, "is drafted after that stop, so the round stops once more to show its draft" | fixed |
| `docs/running.md:95`, "Either way the round stops once more to show the draft first" | fixed |
| `docs/running.md:132`, "When you are asked" (each round, or at the end of the run) | holds |
| `docs/running.md:134`, "is shown before it is filed" | holds |
| `skills/redline/SKILL.md:262`, the end-of-run stop | holds |
| `README.md:50`, the plan dial's row | holds |

Decided by: redline

### R3-7: a kept draft's call recommendation ends in one period — fix

Confirmed by reading (R2-3 re-verified). `forceAskRules` writes `` `${DEFER_TO_ISSUE}: ${draftTitle(kept.title)}.` `` (3975); `draftTitle` (1618-1621) keeps a trailing period, so a title "The retry policy is missing." gives "...missing..". The text is the call's recommendation, `record.forced[id].recommendation`, and autopilot's Left to line (5128).

- **Instance or class.** The cause lives at that one template string in `workflows/redline-loop.js`. Every other sentence there that adds a period after the shaper's text strips one first (`recommendation` and `declineReason`, a few lines above it); the option's effect quotes the title and adds none, and the issue heading (1637) adds none. Stripping there closes every period-ended title, guided and on autopilot. Outcome `one-place`.
- **The change.** Task 9: strip one trailing period from the cleaned title before the period is added.

Decided by: redline

### R3-8: the unmatched-option warning says what is true for a left finding — fix

Confirmed by reading (R2-4 re-verified). When a decision's `option` names no label of its call, the warning says the resolve agent states what it ends in (4514). For a finding in `record.forced` no statement is asked (`asked`, 4586), no disposition is set, nothing is filed, and the finding posts as left. The neighbouring no-option branch (4519-4535) already words the left case truly (the key places spec, decision 16).

- **Instance or class.** The cause lives in that one warning in `resolveWith` (`workflows/redline-loop.js`), the only message for an unmatched option; wording it by whether the finding is left covers every such decision. Outcome `one-place`.
- **The change.** Task 10: for a left finding the warning ends that the answer is read as the person's own words, so the finding stays left to the person and nothing is filed; for any other it is unchanged.

Decided by: redline

### R3-9: a resolve takes an entry for a left finding only when it applies that finding — fix

Confirmed by reading (R2-5 re-verified). `optionDraft` is built only for the ids this resolve applies (4605), while `returned` admits an entry for any left deferral (4615), one an earlier resolve of the round applied included. A later resolve set off by a reshape's raised call can return an entry for it; it gets no `rewritten` warning, `stated` holds nothing for a left id so it is no `strayCall`, and it replaces the option's draft in `deferred`, against the rule in the comment at 4597-4603 ("Its draft is the one the person was shown").

- **Instance or class.** The cause lives in the `returned` filter in `resolveWith` (`workflows/redline-loop.js`), the one place every resolve's entries pass. Admitting a left finding's entry only from the resolve that applies it, and dropping any other with a warning, closes the path for every later resolve and every left deferral, drafted or not. Of the reviewer's two fixes this is the one that keeps the earlier entry whatever it came from; building `optionDraft` for every earlier left deferral would cover only those whose call had a drafted option. Outcome `one-place`.
- **The change.** Task 11: `returned` admits an entry for an id in `record.forced` only when it is a left deferral this resolve applies; an entry for a left deferral an earlier resolve applied is dropped with a warning that the earlier entry stands. An entry for a left finding nobody deferred is dropped without one, as before (#109).

Decided by: redline

### R3-11: a left finding's own commit is warned about truly — fix

Confirmed by reading (R2-7 re-verified). Since #126 a left deferral is in `roundDeferrals` (5088), so it reaches the own-commit loop (5102-5115). `plannedFiles` takes `shaperFiles` for it (`tracked` is false), which is always empty for an ask, so a commit of the finding's own gives "the resolve agent planned no task with files for it; posted with its decision", false whenever the resolve agent did plan files, and the left outcome posts `commits: []` (3427), so no reply names the commit. A left finding nobody deferred is not in that list, so its own commit is warned about by nothing.

- **Instance or class.** The cause lives in that warning loop in `workflows/redline-loop.js`, the one place a finding's own commit is compared with its plan after the build. Skipping left findings there and warning once for every left finding of the round with a commit of its own covers a left deferral and a left finding nobody deferred alike. Outcome `one-place`.
- **The change.** Task 12: the loop skips an id in `record.forced`; one loop over the round's left findings warns that the finding is left to the person under its rule, that no task writes anything for it, and that its reply and the handoff name no commit. With Task 5's check in place, such a commit is one the plan never asked for.

Decided by: redline

### Plan adjustments (the plan approver's first bounce)

The plan approver sent back three tasks. Each adjustment is applied in `plan.md`; none changes a finding's disposition, its cause or its outcome, and none needs a decision in one of the five cases, so none is a judgment call. Each was checked against the code before it was applied.

1. **Task 3 (R3-5), the docs clause.** The plan put `, or naming an id the review renamed, which may mean either finding` in front of the parenthetical "(the schema of a review that is asked for links refuses both in the reviewer's own run, and this is the second layer)" on `docs/running.md:86`, so "both" would have followed three cases and the sentence would have said the link-asking schema refuses a renamed id. It does not: `reviewSchema` (`workflows/redline-loop.js:884-901`, read for this) types `sameClassAs` as a list of strings with no pattern, and the clearing is in `review()` alone. The clause now goes after the parenthetical, as `, and one that names an id the review renamed, which may mean either finding`, inserted after the anchor text `refuses both in the reviewer's own run, and this is the second layer)`; the plan gives the sentence as it reads after the edit and a `grep -c` proof. The plan's header also gave the order of the two edits on line 86 as Task 7 then Task 3, against the tasks' own order; it now names each edit by its sentence and says the two anchors are disjoint, so neither moves the other.
2. **Task 7 (R3-2), `checkDrafts`' message.** The plan said both that the message was "otherwise unchanged", which keeps `; a deferred item always carries one`, and that the red check expects a text without that tail; the `places:` block's `stopsAtShape` compares the error by equality (`tests/loop-test.mjs:5221`, read for this), so both could not hold. The plan now states the one message word for word: today's text kept whole, then `; this entry carries a draft object, which is not read on a deferred entry: the entry holds title, found, why and fullFix itself, beside mitigation`; the red check uses the same text, the neighbour is the existing `defer:` check of today's text (3318), and the message is built before the one throw site, so `sites("throw checkError('shape', ") === 11` (1732) does not move. The plan also says how the scenario is scripted (`shapeKeys: { deferred: [...] }`, which the mock spreads after its own list).
3. **Task 5 (R3-10), the typed-defer scenario.** The mock's `Keep it` option ends in defer whenever `scenario.resolveDeferred` lists the id (`tests/loop-test.mjs:295`, read for this), so the scenario as written gave the call an undrafted option that ends in defer. The scenario now scripts `ends: { 'R1-1': 'fix' }`, so neither of the call's two options ends in defer, and adds a pin of that setup (the call's labels and ends on a run with no decisions); the Mitigate case is spelled with the block's own helpers (`relabelledCall`, `pickOf`).

Decided by: redline

### As built

Three deviations from the plan, none of which changes a finding's disposition, cause or outcome; `plan.md`, "As built", has the counts.

1. **Task 1's commit subject.** `redline: save review round 3 spec for PR #127 (#105)`, the implementer's form, which every earlier round's spec commit used (`966ca1b` for round 1 of this pull request), where the plan wrote `redline: shape PR #127 review round 3 (#105)`.
2. **Task 5's reshape case.** The check reads the `left:` block's `namedLater` run, not `forcedDefer`, which is scoped to the `reshape:` block; the two are the same case (a call whose decision names defer, a first resolve entry with the mitigation `a guard`, a reshape that leaves the finding under `billing`), and the check holds the warning and the empty mitigation in the `plan approver r1 #2` and `implement r1` prompts as the plan says.
3. **Task 11's checks.** The filed draft and the warning are one check over the same run.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)"; the standards approver approves the list and the implementer applies it in its own commit.

## Declined

None.

## Deferred

None.

## Unattended answers

1. **R3-4: may a typed defer at a later stop be taken as a plan-dial override?** No. `agent-os/standards/workflow/replay.md` line 6: "a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve". SKILL.md:217 already refuses a typed decline overrule at such a stop for the same reason. The PR description keeps the typed defer as a way to defer a left call ("A pick of it, or `<id>: defer. <reason>` typed for the finding, has Redline file the draft"), so the answer is to mark it, not to refuse it.
2. **R3-10: does a left finding the person deferred ship a mitigation?** No. `docs/running.md:95`: "no task is planned and nothing is written under the rule"; the resolve prompt's bullet: "No task writes anything for it either". The PR description: "No task is planned and nothing is written under the rule."
3. **R3-6: is a call's reason enough to force its finding?** Yes. The forcing point takes a prose rule from "the shaper's own askRule tag" (the comment above `forceAskRules`); a call whose `why_human` names a declared rule is the same judgment, made by the same agent in the same result. `docs/contract.md:153` says the workflow "holds to" the shaper's sorting under a prose rule.
4. **R3-5: clear or map?** Clear. `agent-os/standards/workflow/agents.md` line 47: "a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred".
5. **R3-2: should a deferred entry's schema refuse unknown keys instead?** No. The key places spec, decision 21: "a deferred entry and the resolve agent's schema stay open", and the comment above `DEFERRED_SCHEMA`: "The draft fields are checked by the workflow, not required here, since the resolve agent's entry for a finding left to the person under a repository rule carries none." The sentences are the finding.
6. **Measurement.** The node harness is refused to the shaper (`redline-guard (shaper): 'node' is not available to the shaper`), so the reviewer's reproduction `/tmp/redlinerepro/reviewer-r3-repro.mjs` could not be run here. The code findings are fixed `one-place`, each with its members found by reading and listed in its entry; the three sweeps are of statements in documents, measured by search, with the command and every hit listed. Each task's new loop cases are the code's measurement, seen red then green through the gate.
7. **Self-hosted.** This round edits `workflows/redline-loop.js`, `skills/redline/SKILL.md`, `agents/redline-shaper.md` and `agents/redline-reviewer.md`, which the PR's caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"), and a changed agent file is reported, never pinned (agents.md line 45).
8. **Version.** Stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No template body changes, so the marker stays v7.
9. **Last round.** `maxRounds` is 3 (`.claude/redline.json`), so this is the run's last round: its fixes are built and gated, and no Redline review reads them after. That is no reason to defer a fix whose cost is in proportion.
10. **Visuals, product context.** None; `agent-os/product/` does not apply to a review round.

## Context

- **Visuals:** None.
- **References:** `workflows/redline-loop.js` (decision intake, `overridesFor`, the shaper's draft filter, `review()`'s rename, `honourLinks`, `linkFault`, `forceAskRules`, `resolveWith`, the reshape's rebuild, the own-commit warnings, `checkDrafts`, the schemas), `skills/redline/SKILL.md`, `agents/redline-shaper.md`, `agents/redline-reviewer.md`, `tests/loop-test.mjs` (the `left:`, `class:`, `places:`, `reshape:` and `resume:` sections), `docs/running.md`, `docs/upgrading.md`, `docs/contract.md`; the PR's spec folder, round 1's and the key places spec. See `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- workflow/replay — line 6: a decision enters only after the prompt it answers, and a later stop takes no override (R3-4).
- workflow/agents — line 11 (`forceAskRules` applies the rules; R3-6, R3-10), line 16 (a message says when it fires in the words of the decision behind it; R3-8, R3-11), line 17 (a rule is changed everywhere it is stated; R3-2, R3-3), line 31 (every ref to a renamed id follows the rename; R3-5), line 47 (a claim the workflow cannot honour is cleared with a warning; R3-5).
- testing/tests — line 35, red before green; line 30, a case per changed surface with its neighbour; line 37, a count read off the source (the `resume:` pins).
- process/docs-gate — every task touching `workflows/`, `skills/` or `agents/` names its docs section or says why there is no reader-facing change.
- process/release — no version bump in a review round.
- prompts/attribution — no model or vendor name anywhere.

## Standards retrospective (proposed)

1. `agent-os/standards/workflow/replay.md`, line 6, append: "; and an answer to a call that carries a disposition (the typed `<id>: defer.` for a finding left to the person, #126) is marked as a call's answer (`"call": true`), so no reader before the round's first resolve takes it as an override: a typed defer at a reshape's stop was read on the relaunch as a plan-dial override and set off a first resolve the launch had not run, until #127, R3-4".
2. `agent-os/standards/workflow/agents.md`, line 11, append: "; and `forceAskRules` holds a finding to a rule its call names in `why_human` when the finding carries no tag, with a warning, since the reason is the shaper's judgment as much as the tag is (#127, R3-6); and a left finding's deferred entry carries no mitigation, and a resolve that plans a task with files for a left finding stops at `resolve`, so 'nothing is written under the rule' is the workflow's check and not the prompt's alone (#127, R3-10)".
3. `agent-os/standards/workflow/agents.md`, line 31, append: "; and a class link that names an id the review renamed is cleared with a warning, since the old id may name the sibling or the earlier finding (#127, R3-5)".
4. `agent-os/standards/workflow/agents.md`, line 17, append: "; and a sentence that says what a schema refuses names the objects it refuses on, since an open object beside strict ones (a deferred entry, a review's `resolved` entry) makes 'refuses any key it does not name' false (#127, R3-2)".
5. `agent-os/standards/testing/tests.md`: no change.
6. `agent-os/standards/process/docs-gate.md`: no change.
