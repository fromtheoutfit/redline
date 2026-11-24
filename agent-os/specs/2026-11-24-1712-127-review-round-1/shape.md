# PR #127 review round 1 — Shaping Notes

Shaped by Redline in unattended mode, for review round 1 of PR #127 (issues #105, #75 and #126; template v6, plugin 0.5.0), from the round's six findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Line numbers are at `d6217dc`, the head of the branch. Corrected twice after the plan approver's adjustments: adjustment 1 (Task 3, R1-4) and adjustment 2 (Task 3, R1-4, and Task 2, R1-1); see "Plan adjustment 1" and "Plan adjustment 2" below.

## Scope

The round's six findings, nothing more:

- R1-1 (correctness): `docs/upgrading.md`, "A stopped run across 0.5.0", says a review-dial stop replays whole, which is false on a pull request where an earlier Redline run replied to a finding with anything other than "not changed in this round".
- R1-4 (correctness): a shaper's ordinary call that `forceAskRules` makes left to the person stops the round on its undrafted defer option.
- R1-2 (nit): a human review pass's shape prompts tell the shaper an own-file call is left to the person and drafted, which never holds in that pass.
- R1-3 (nit): a revise-only pass clears a `sameClassAs` link with a false reason.
- R1-5 (nit): `checkCauses` and `checkOptions` name only their first failure.
- R1-6 (nit): the outside-path stop of `checkCauses` tells a one-place fix that `where` may be a folder, which the one-place check beside it refuses.

No repository ask rules are declared (`.claude/redline.json` has no `askRules`), and no finding is on one of Redline's own files: in this repository the plugin's source is repository content, and none of the six touches `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh` or `checks.json`.

## Decisions

### R1-1: the 0.5.0 replay note holds only on a pull request with no earlier answered round — fix

Confirmed by reading. `trackedList` (`workflows/redline-loop.js:109`) is every prior finding whose disposition is not in `CARRY` (`['none', 'not-changed']`, line 87). `none` is a finding with no reply and `not-changed` one replied to with "not changed in this round." (`scripts/redline-gh.sh`, `classify`, 612-622); every other reply, "carried forward as R<n>-<k>" included (`carried`, 618 and 642), makes the finding tracked. So on a pull request where an earlier Redline run replied to at least one finding with anything other than "not changed in this round", `showsEarlier` (1850) is true for the run's first, whole-PR review, which then carries `LINK_ASK` (1929-1931) and the `REVIEW_SCHEMA_LINKS` schema (3081-3087). That prompt differs from 0.4.5's, so a relaunch across the update reruns the review, and the post after it, whose prompt embeds both files (`postPrompt`, 2197-2221). The PR spec's measurement ("A review-dial stop replays whole (3 of 3)", its `shape.md` line 54) used scenarios with no earlier round, and the PR description's own prompt table records the change ("A review that is shown earlier findings | 467 | 467").

- **Proportionality.** Likelihood: needs an earlier Redline run on the pull request that answered a finding, a stopped run, an update across 0.5.0 before the relaunch, and a repository that is not the plugin's own. Plausible on the repositories Redline is used on, where a second run on one pull request is routine. Impact when it fires: the first review reruns, the post is skipped as already posted but rewrites `round-<n>-review.json` and `round-<n>-findings.json` from the rerun, so the run's ids can name different findings from the ones GitHub shows. The note tells the reader the opposite, so they would not finish the run first. Cost: one paragraph of one doc file, inside the pull request's diff.
- **Instance or class.** Cause: `docs/upgrading.md`, the section "A stopped run across 0.5.0", line 45, is the one place the claim is stated for a reader; a search of `README.md`, `docs/`, `CHANGELOG.md`, `CONTRIBUTING.md`, `skills/`, `agents/` and `workflows/` for "replays whole", "across 0.5.0" and "before its first shape" finds only that line. The PR description states it too, but that is the person's text, which no Redline role writes (For you, below). Outcome `one-place`.
- **The change.** Task 2 rewrites the section's first paragraph so that the review-dial sentence and the later-stop sentence hold for a pull request where no earlier Redline run replied to a finding with anything other than "not changed in this round" (a finding with no reply counting as unanswered), and adds what happens on any other: the first review and the post rerun whatever stopped the run, the review dial included, and the post rewrites the round's two files from the rerun. The condition is stated in the words a reader sees in the thread, never with "carried" as an exception, since a "carried forward" reply makes the finding tracked (Plan adjustment 2). The paragraph's closing advice stands and now covers both cases.

Decided by: redline

### R1-4: a call the forcing point relabels keeps its undrafted options as the shaper wrote them, and every left call's draft is held complete — fix

Decided again after the plan approver's adjustments 1 and 2, both of which named this decision's task; the disposition stays `fix`, and the exemption is narrowed each time (Plan adjustment 1 and Plan adjustment 2, below).

Confirmed by reading. When the shaper already wrote a call, `forceAskRules` keeps it and rewrites only `why_human` (`workflows/redline-loop.js:3823-3825`), then records the finding in `record.forced` (3831-3833). `checkOptions` runs after it (`vetShape`, 4167 then 4183) and, for every call in `record.forced`, stops at `shape` on an option that ends in `defer` without a complete draft (3591-3595). The shaper is told to draft only on a call it knows is left (`OPTIONS_ASK`, 1126, "no other option carries one"; `LEFT_CALL`, 1125, in a repository with rules "a finding left to the person (one a repository ask rule covers, or one on a file of Redline's own)"; `agents/redline-shaper.md` rule 7), so an ordinary call with a Mitigate option, made left by a paths rule the shaper missed or read differently from `ruleForPaths` (638-651), stops the round. `origin/main` had no such check and went on.

- **Proportionality.** Likelihood: low; the shaper has to miss the rule, which is the case the forcing point exists for. Impact: one more stop and relaunch on guided; on autopilot the run ends in an error at `shape` and a person relaunches it. Nothing is lost. Cost: a flag on the forced entry and one condition in `checkOptions`, one sentence in `docs/running.md`, five loop cases; all in files the pull request changed. A check this pull request added on a path the base branch passed weighs toward `fix`.
- **Which way.** The reviewer offers two: keep the undrafted option and let the resolve agent write the draft after a pick, or drop it with a warning. Answered from the evidence (Unattended answers, item 3): the PR description says "Every other answer leaves it as before", and the resolve step already handles a defer on a left call that offered no draft ("Only when the call offered no draft to take does the agent's own entry stand", 4416-4421, and `docs/running.md` line 95, "a typed defer on a call that offered no draft has the resolve agent write one"). Keeping the option is what the base branch showed the person; dropping it would change the options the person sees and could leave `recommended` naming no option. So the option is kept, and the draft check is not applied to it.
- **What is exempt, and what is not.** Only a defer option that carries no draft at all, on a call relabelled from a reason that does not mark a left call. A draft such an option does carry is kept, as on any left call, and on a pick the resolve step builds `optionDraft` from it (4424-4432), which replaces the resolve agent's own entry; one short of a field then stops the round at `resolve` ("the resolve agent deferred ... with no drafted issue", 4474-4477) on every resume, since the option's draft wins again each time. So a partial draft on a relabelled call is held to the check as on any left call and stops at `shape` with today's error, where a resume can put it right. The base branch had no such stop at `resolve`, and the fix must not open one.
- **Instance or class.** Cause: `forceAskRules` in `workflows/redline-loop.js` is the one place a call is made left to the person, so recording there that it relabelled a call the shaper wrote as an ordinary one (and warning once) spares every such call's draftless defer option in `checkOptions`, whatever rule or path put it there. A call is relabelled only when its old `why_human` is not a reason the shaper is told marks a left call: neither `redline's own file` nor any `repository rule <id>`, this rule's or another's. A call the shaper wrote as left (`why_human` `redline's own file` or any `repository rule <id>`, the two reasons `LEFT_CALL` tells it to draft for) is not relabelled, gets no warning and is still held to its draft, and so is any draft a relabelled call carries. Outcome `one-place`.
- **Measurement.** Task 3 has three pins, each stopping at `shape` before the change as after it, so none can be red before the build (testing/tests, line 35): the partial-draft case, seen red under a mutation of the `undrafted` filter that exempts every defer option of a relabelled call; the own-file case, a call the shaper wrote with `why_human` `redline's own file` and a draftless `Mitigate`, seen red under a mutation that drops the `OWN_FILE` exclusion from the `relabelled` condition; and the existing `bareDefer` check, a call written with `repository rule craft-config`, seen red under a mutation that drops the `repository rule ` prefix exclusion. The autopilot case pins the outcome the fix promises: the run finishes, the finding is left under `craft-config` in `res.forced`, and nothing is filed.

Decided by: redline

### R1-2: a human pass's options sentence names only a rule call — fix

Confirmed by reading. `OPTIONS_ASK` (1126) interpolates `LEFT_CALL` (1125), whose own-file clause (all of it in a repository with no rules) reaches `humanShapePrompt` (2319) and the human pass's reshape prompt (2356). In a human pass `forceAskRules` records an own-file call only when `!pass.human` (3773), and `HUMAN_WHY` (447) has no `redline's own file`, so no such call is ever left, and a draft the shaper writes on it is dropped with a warning by `checkOptions` (3596-3600). The reviewer's further claim, an issue filed that the author was not shown, it refuted itself; this decision rests on the confirmed part only.

- **Instance or class.** Cause: `OPTIONS_ASK` in `workflows/redline-loop.js` is the one constant all three shape prompts interpolate; building its left-call clause by pass kind closes the human shape and the human reshape at once and leaves the Redline round's text byte-identical. Outcome `one-place`.
- **The change.** Task 4: the human pass's options sentence names only a finding a repository ask rule covers, and in a repository with no rules carries no left-call clause at all. The Redline round's sentence is unchanged. `agents/redline-shaper.md` rule 8 ("Rule 7 stands: a comment that asks for a change to one of Redline's own files is ask, with options a person carries out by hand") says nothing of a draft, so it is left as it is, and no agent file is edited this round.

Decided by: redline

### R1-3: a revise-only pass clears a link with a reason that is true — fix

Confirmed by reading. A revise-only pass is launched with no prior findings (`skills/redline-revise/SKILL.md:26`) and calls `honourLinks(round, record.findings, true)` (5701) before its record joins `rounds` (5702), so for a link its findings file carries, `linkFault` (3021-3032) finds the id in neither record and gives "<id> names no finding Redline recorded on this pull request". That is false whenever the file was written by a run that held the record (`/redline:redline-review` on a pull request with an earlier round, or a full run's fix-diff round). The clearing itself is the PR spec's decision 41 and stands (Unattended answers, item 4); only the reason changes.

- **Instance or class.** Cause: `honourLinks` in `workflows/redline-loop.js` chooses each cleared link's reason, and the revise-only call site is the one caller that holds no record to check against. Giving that caller its own reason there closes every link that path clears. Outcome `one-place`.
- **The change.** Task 5: a link the revise-only pass cannot check (an id `linkFault` would find in neither record) is cleared with "this revise-only pass holds no record of earlier rounds to check it against". A link to a finding of the same pass keeps its own reason. The loop case at `tests/loop-test.mjs:5056-5059` follows the new text.

Decided by: redline

### R1-5: the two new checks name every failure; the three older ones are deferred — defer, with a mitigation

Confirmed by reading. `checkCauses` (3620-3655) and `checkOptions` (3574-3603) throw at the first fault. A reshape stopped by either is resumed with "correct what the error names" (`resumeLine`, 744), and `agent-os/standards/workflow/replay.md` line 19 says such a stop "names every failure of its check in one error, since each one it leaves out is one more relaunch (#114, R4-6)". `checkDeclineReasons` (3661-3665) and the first half of `checkCalls` (3522-3525) already list every failing id.

- **Instance or class.** The cause is a class: a shaper-result check that throws at its first failing finding or call. Members, found by reading every check `vetShape` (4155-4185) runs after the spec check (the node harness is refused to the shaper, so none was measured by running):

  | Member | Lines | Exposed | Closed by this round |
  |---|---|---|---|
  | `checkCauses` (new in #127) | 3620-3655 | yes | yes, Task 6 |
  | `checkOptions` (new in #127) | 3574-3603 | yes | yes, Task 6 |
  | `checkCalls`, the call for a finding not sorted as ask | 3526-3534 | yes | no |
  | `checkWhy` | 3544-3552 | yes | no |
  | `checkDrafts` | 3691-3698 | yes | no |
  | `checkCalls`, an ask with no call | 3522-3525 | no, lists every id | — |
  | `checkDeclineReasons` | 3661-3665 | no, lists every id | — |
  | the unsorted check in `vetShape` | 4160-4163 | no, lists every id | — |

  Three members stay exposed, so the outcome is not a sweep: the finding is `defer`, its mitigation the fix of the two members this pull request added, and its drafted issue names the three left.
- **Why not all here.** `checkCalls`, `checkWhy` and `checkDrafts` predate this pull request (they are on `origin/main` as they are), so closing them changes stops the pull request did not set out to touch; a gap that predates the pull request is a deferral. The two new checks are this pull request's code, and the standard says how they should read.
- **Mitigation.** Task 6: `checkCauses` and `checkOptions` each collect every fault of every finding or call, and throw one error naming them all; with one fault the error is byte-identical to today's, so every existing case stands. Task 6's `checkOptions` collects the undrafted-defer fault by Task 3's narrowed filter.

Decided by: redline

### R1-6: the outside-path stop says what `where` names by outcome — fix

Confirmed by reading. The one-place check passes only when `repoPath(cause.where).path` is one of the task's cleaned files (3633, 3637-3640), as the contract asks (`CAUSE_ASK`, 1129, "so where is one of its files"; the shaper's rule 3). The outside-path stop beside it (3634-3636) tells every outcome "where names the file or folder the cause lives in", so a one-place fix resumed after that stop can be steered to a folder and stopped again at 3638.

- **Instance or class.** Cause: the one outside-path message in `checkCauses` (`workflows/redline-loop.js`), which every outcome reaches. Wording it by outcome there closes it for every fix. Outcome `one-place`.
- **The change.** Task 7: for a one-place fix the message ends "where names one of the task's files, the one the cause lives in"; for the other outcomes it is unchanged. Whether a folder holding a task file satisfies one-place, and whether a `:<line>` suffix is stripped, are answered by the contract as it stands (Unattended answers, item 5): neither is changed.

Decided by: redline

### Plan adjustment 1 (Task 3, R1-4) — applied

The plan approver found that the first version of Task 3 exempted every defer option of a relabelled call from the draft check while keeping any draft it carried, so a partial draft (only `title`, say) would pass the shape, be shown to the person and, on a pick, become the filed draft (`optionDraft`, `workflows/redline-loop.js:4424-4432`), which stops the round at `resolve` (4474-4477) on every resume. Confirmed by reading those lines: the option's draft replaces the resolve agent's entry whenever the picked option has one, and the resolve check then finds it short. Applied as the approver asked: on a relabelled left call the filter is `option.ends === 'defer' && option.draft !== undefined && draftMissing(option.draft).length`, today's filter stands for a left call that is not relabelled, step 2's sentence and the comment above `checkOptions` say so, and step 1 gains the partial-draft case, which stops at `shape` with the existing error (`("Mitigate": missing found, why, fullFix)`). The `docs/running.md` sentence now says the resolve agent writes the draft for a pick that carries none. Task 6's fault list follows the narrowed filter. No other task changes, and no other decision is reopened. Not a judgment call: none of the five cases holds, since the narrowing keeps what the person sees and what the base branch did for a draftless option and only refuses a draft the run could never file.

Decided by: redline

### Plan adjustment 2 (Task 3, R1-4, and Task 2, R1-1) — applied

Three adjustments, each confirmed by reading and applied as the approver asked.

1. **Task 3, which call is relabelled.** The plan marked a call relabelled whenever its old `why_human` differed from the rule's reason, which also caught a call the shaper wrote as left: one with `why_human` `redline's own file` (`OWN_FILE`, `workflows/redline-loop.js:439`) or one naming a different `repository rule <id>`. `LEFT_CALL` (1125) tells the shaper to draft the defer option of both, so neither has a reason to leave it undrafted, and this record already said such a call is held to its draft (R1-4, "Instance or class"). Applied: step 2 sets `relabelled`, and pushes its warning, only when the old `why_human` is neither `OWN_FILE` nor a string that starts with `repository rule `; step 1 gains the own-file case, the same paths-rule scenario written with `why_human` `redline's own file` and a draftless `Mitigate`, which still stops at `shape` with today's undrafted-defer error. The comment above `checkOptions`, the `docs/running.md` sentence (now "a call the shaper wrote as an ordinary one (for a reason other than a repository rule or Redline's own files)"), R1-4's "Instance or class" and standards item 3 say the same. The own-file case and `bareDefer` are pins, each seen red under a mutation of the clause it turns on (R1-4, "Measurement").
2. **Task 3, the autopilot case.** "Does not end in an error at `shape`" would also pass on a run that stopped or failed elsewhere. Applied: the case checks `status === 'done'`, that `res.forced` holds `R1-1` under `craft-config`, and that nothing is filed (`filedCalls` empty and `res.deferred` empty, as the existing `auto` check reads it), and keeps the claim that the run is not stopped at `shape`.
3. **Task 2, the condition the note states.** The plan worded it "answered at least one finding of (a reply other than carried)". `trackedList` (109) is every earlier finding whose disposition is not in `CARRY` (`none`, `not-changed`; 87), and a "carried forward as R<n>-<k>" reply is `carried` (`scripts/redline-gh.sh` 618, 642), which counts as tracked, so the wording named the wrong exception. Applied: the note states the condition the code reads, a pull request where an earlier Redline run replied to at least one finding with anything other than "not changed in this round" (a finding with no reply counts as unanswered), and does not use "carried" as the exception. R1-1's decision and the Scope line say the same.

No other task changes, and no other decision is reopened. Not a judgment call: none of the five cases holds, since each adjustment brings the plan into line with what the code reads and what this record already decided, and changes nothing a person sees.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)"; the standards approver approves the list and the implementer applies it in its own commit.

## Declined

None.

## Deferred

### R1-5: the shaper's older result checks name only their first failure

- **Mitigation (Task 6):** `checkCauses` and `checkOptions`, the two checks #127 added, name every fault in one error.
- **title:** Name every failure in one error in the shaper's older result checks
- **found:** Three of the checks `vetShape` in `workflows/redline-loop.js` runs on the shaper's result throw at the first failing finding or call: `checkCalls` (a judgment call returned for a finding not sorted as ask), `checkWhy` (a call asked for a reason outside the round's cases) and `checkDrafts` (a deferral with no complete drafted issue). Each is a stop the shaper corrects on a resume, and a reshape is told to "correct what the error names", so a result with two such faults is told of one, corrects it and stops again on the next, one relaunch per fault. `agent-os/standards/workflow/replay.md` asks that such a stop name every failure of its check in one error. `checkDeclineReasons`, the unsorted check and the ask-with-no-call half of `checkCalls` already list every id, and pull request #127 brought its two new checks, `checkCauses` and `checkOptions`, in line. `vetShape` also runs the checks one after another, so a result that fails two different checks still stops once per check.
- **why:** The three checks predate pull request #127, which set out to add the option ends, the cause of a fix and the deferral of a left finding; closing them here would change stops that pull request did not touch.
- **fullFix:** Have `checkCalls`, `checkWhy` and `checkDrafts` each collect every failing finding or call and throw one `checkError` naming them all, as `checkDeclineReasons` does, keeping the text of a single failure byte-identical; consider having `vetShape` gather the faults of every check after `forceAskRules` into one error so a result that fails two checks stops once; add a loop case per check with two failures that names both.

## Unattended answers

1. **Is a fallback for a shape made under an older release in scope for R1-1?** No. The PR description: "No fallback was kept, since a shape made under an older release can never replay under a changed shape prompt." The note is the fix, and the answer the reader acts on stays "Finish or restart a stopped run before updating across 0.5.0".
2. **Who corrects the PR description's "A stop at the review dial replays whole"?** The person: no Redline role writes a pull request's description (rule 2 of the shaper's file; `README.md`, "Git rules for Redline agents"). Listed under For you.
3. **R1-4: keep the undrafted option or drop it?** Kept, from the PR description ("Every other answer leaves it as before") and the code's own comment at 4416-4421 ("Only when the call offered no draft to take does the agent's own entry stand, held to its fields below like any deferral's"): a pick of an undrafted defer option on a left call already has the resolve agent write the draft, as a typed defer on such a call does (`docs/running.md` line 95). The same comment says why a draft the option does carry must be complete: "Its draft is the one the person was shown: the picked option's", so a short one is filed short and stopped at `resolve`; the exemption therefore covers a draftless option only (Plan adjustment 1), and only on a call the shaper wrote as an ordinary one, since `LEFT_CALL` (1125) tells it to draft the defer option of a call it writes for a rule or for one of Redline's own files (Plan adjustment 2). Not a judgment call: one option is what the base branch did and what the pull request says it keeps.
4. **R1-3: should a revise-only pass keep such a link?** No. The PR spec's decision 41 (`agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/shape.md` line 91): "one a revise-only pass reads from an earlier run's findings file: that pass is given no earlier findings, so its record cannot show the fix". The clearing stands; only its reason is put right. The reviewer names passing prior findings to a revise-only launch as "a separate choice", outside this finding.
5. **R1-6: does a folder, or `path:line`, satisfy one-place?** No. `CAUSE_ASK` (1129): "one-place: the fix is made where the cause lives, so where is one of its files"; the shaper's rule 3: "`where` is one of the task's files"; and for every outcome `where` is "a path in the repository", which `app/x.php:42` is not. The code agrees with the contract except for the outside-path message, which is the finding.
6. **Measurement.** The node harness is refused to the shaper (`redline-guard (shaper): 'node' is not available to the shaper`), so the reviewer's reproduction `/tmp/redlinerepro/reviewer-r1-repro.mjs` could not be run here, and no `sweep` outcome is claimed: every fix is `one-place`, and R1-5's member table is from reading, which is why it is a deferral and not a sweep. Each task's new loop cases are the measurement, seen red then green through the gate; Task 3's three pins are each seen red under a mutation.
7. **Self-hosted.** This round edits `workflows/redline-loop.js`, which the PR's caution names. A relaunch runs the script the run launched with (#81; `docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"). No agent file is edited this round.
8. **Version.** Stays `0.5.0`: the pull request bumped it once (minor, for the unattended section's body), and a review round of the same pull request adds no bump. Nothing here changes what a setup rerun writes.
9. **Visuals, product context.** None; `agent-os/product/` does not apply to a review round.

## Context

- **Visuals:** None.
- **References:** `workflows/redline-loop.js` (`forceAskRules`, `checkOptions`, `checkCauses`, `honourLinks`, `linkFault`, `OPTIONS_ASK`, `LEFT_CALL`, `OWN_FILE`, `showsEarlier`, `trackedList`, `postPrompt`, the resolve step's `optionDraft` and its draft check), `scripts/redline-gh.sh` (`prior-findings`, `classify`), `tests/loop-test.mjs` (the `ends:`, `left:` and `class:` sections), `docs/upgrading.md`, `docs/running.md`, the PR's spec folder `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/`. See `references.md`.
- **Product alignment:** N/A.

## Standards Applied

- testing/tests — every fix lands red before green; the loop test gains a case with every change to the workflow; a pin that already holds is seen red under a mutation (Task 3's three pins).
- workflow/replay — line 19: a stop whose resume line says to correct what the error names, names every failure in one error (R1-5).
- workflow/agents — line 11 (`forceAskRules` applies the rules; R1-4), line 16 (a message says when it fires in the words of the decision behind it; R1-3, R1-6).
- process/docs-gate — every task touching `workflows/` names its docs section or says why there is no reader-facing change.
- process/release — no version bump in a review round.
- prompts/attribution — no model or vendor name anywhere.

## For you

- **The PR description.** Correct "A stop at the review dial replays whole" under "A run in flight" the same way as Task 2's note: it holds on a pull request where no earlier Redline run replied to a finding with anything other than "not changed in this round"; on any other, the first review and the post rerun.

## Standards retrospective (proposed)

1. `agent-os/standards/workflow/replay.md`, line 19, append to the clause that ends "until #114, R4-6": "; and a check added beside one that already names every failure follows it: `checkCauses` and `checkOptions`, new in #127, threw at their first fault until #127, R1-5, and the older `checkCalls`, `checkWhy` and `checkDrafts` are a drafted issue".
2. `agent-os/standards/workflow/agents.md`, line 16, append: "; and a stop's message says what its rule asks of the case that reached it: the outside-path stop of `checkCauses` told every fix that `where` may be a folder, beside a one-place check that takes one of the task's files, until #127, R1-6; and a cleared link's reason is true on every path that clears it: a revise-only pass said the earlier finding was never recorded, when it only held no record to check it against, until #127, R1-3".
3. `agent-os/standards/workflow/agents.md`, line 11, append after "Any other answer, and autopilot, leave the finding as before": "; a check of a left call that only the shaper's own drafting could satisfy spares a draftless defer option of a call `forceAskRules` relabelled from a reason that does not mark a left call (neither a `repository rule` nor `redline's own file`, the two the shaper is told to draft for), which keeps its options as written and, on a pick, has the resolve agent write the draft; it holds every defer option of a call the shaper wrote as left to its draft, and every draft a left call does carry complete, since the picked option's draft is the one filed and a short one would stop the round at `resolve` on every resume (#127, R1-4)".
4. `agent-os/standards/process/docs-gate.md`: no change.
5. `agent-os/standards/testing/tests.md`: no change.
