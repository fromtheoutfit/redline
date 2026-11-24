# PR #127 review round 1: the 0.5.0 replay note, a relabelled call's options, the human pass's options sentence, a revise-only link's reason, every fault in one error, and the outside-path stop

Spec folder: `agent-os/specs/2026-11-24-1712-127-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #127 (issues #105, #75 and #126), from the round's six findings (`redline/round-1-review.json`, `redline/round-1-findings.json`). Corrected twice after the plan approver's adjustments: adjustment 1 (Task 3) and adjustment 2 (Tasks 2 and 3); see "Plan adjustment 1" and "Plan adjustment 2" under Decisions in `shape.md`.

- `fix`, one task each, in finding order: R1-1 (Task 2), R1-4 (Task 3), R1-2 (Task 4), R1-3 (Task 5), R1-6 (Task 7).
- `defer` with a mitigation that ships here: R1-5 (Task 6); its drafted issue is under Deferred in `shape.md`.
- No `decline` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#105)`. No commit subject holds a bare `@word`.

Line numbers are at `d6217dc`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `scripts/`, `hooks/hooks.json`, anything under `templates/`, `skills/` or `agents/`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.5.0`: the pull request bumped it once, and a review round of the same pull request adds no bump. No `.sh` file changes, so CI's shellcheck command is not rerun for this round.

**This round edits `workflows/redline-loop.js`**, which the pull request's own caution names. A relaunch of this run runs the script it launched with (`docs/running.md`, "What `relaunch` runs on the plugin's own repository (#81)"). No agent file is edited.

**Task order matters in three files.**

- `workflows/redline-loop.js`:
  - Task 3 changes the else branch of `forceAskRules` where a call the shaper wrote is kept (3823-3825), the `record.forced` entry it writes (3831-3833), and the `undrafted` line of `checkOptions` (3592) with the comment above `checkOptions` (3568-3573).
  - Task 4 changes `LEFT_CALL` and `OPTIONS_ASK` (1118-1126) and their uses in `humanShapePrompt` (2319) and the reshape prompt (2356).
  - Task 5 changes `honourLinks` (3033-3053) and its revise-only call (5698-5701).
  - Task 6 rewrites the throws of `checkOptions` (3574-3603, as Task 3 leaves it) and `checkCauses` (3620-3655) to collect.
  - Task 7 changes the outside-path message of `checkCauses` (3634-3636, as Task 6 leaves it).
- `tests/loop-test.mjs`:
  - Task 3 adds a block after the `ordinary` check (the one whose name opens "left: a draft on an option of an ordinary call is dropped", 4922).
  - Task 4 changes the `returns` check (4603-4609) and the check whose name opens "left: a human pass's shape prompt asks for the draft" (4942), and adds checks after it.
  - Task 5 changes the `reviseOnly` check (5056-5059).
  - Task 6 adds a block after the `instanceAlone` check (5088) and one after the `bareDefer` check (4917).
  - Task 7 changes `OUTSIDE` (5073) and adds a check after the `outside` check (5075).
- `docs/running.md`: Task 3 alone, one sentence in "Left to you" (95).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Each task that adds checks adds them first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`, which prints the failing check names. A pin whose outcome already holds before the change (Task 3's partial-draft case and its own-file case, and the `bareDefer` neighbour it leans on) cannot be red before the build: it is written with the others, `shape.md` says so, and it is seen red under a mutation of the clause it turns on. If gate runs are slow, the red runs of Tasks 3 to 7 may be seen together in one gate run; each task is still committed with only its own checks, and the combined run is recorded under As built and as a deviation under Decisions in `shape.md`.

---

## Task 1: Save spec documentation

Commit the spec folder as it stands (`plan.md`, `shape.md`, `standards.md`, `references.md`; never anything under `redline/`) on its own: `redline: shape PR #127 review round 1 (#105)`.

## Task 2: R1-1 — say when the 0.5.0 replay note holds

**Files:** `docs/upgrading.md`

In "A stopped run across 0.5.0" (43-49), replace the first paragraph (45), from "So every shape prompt changed" to the end of the paragraph, so it reads in substance:

- Every shape prompt changed. On a pull request where no earlier Redline run replied to a finding with anything other than "not changed in this round" (a finding with no reply counts as unanswered), a stopped run relaunched after the update replays only what came before its first shape: a run stopped at the review dial, before any shaping, replays whole and goes on, and a run stopped anywhere later (keep the existing list of stops) replays its gather, review and post and then runs again from the first round's shape, as the sentence says today (keep "a round that was already built and pushed is shaped and built again over its own commits" and the human review pass sentence).
- New: on a pull request where an earlier Redline run replied to at least one finding with anything other than "not changed in this round", the run's first review is asked whether each finding is one class with an earlier fixed one (`sameClassAs`), so its prompt changed too. There a stopped run replays only what comes before that review, whatever stopped it, the review dial included: the review runs again, and so does the post, which finds the round already posted and posts nothing, but writes the round's `round-<n>-review.json` and `round-<n>-findings.json` again from the rerun's findings, which need not be the findings GitHub shows under the same ids.
- Keep "Finish or restart a stopped run before updating across 0.5.0; a decision you had already given is kept in the run's arguments and applied again, as an answer in your own words", now after both cases, and say it holds for a review-dial stop on such a pull request too.

The paragraph does not name the reply's dispositions by their internal names: the condition is the one `trackedList` (`workflows/redline-loop.js:109`) reads, every earlier finding whose disposition is not in `CARRY` (`none`, no reply, and `not-changed`, line 87), written in the words a reader sees in the thread.

The second paragraph (47) stays.

**Proof:** `git diff -- docs/upgrading.md` shows only that paragraph changed; the gate's checks are unchanged by it.

**Docs:** this task is the docs change; it touches no file under the directories gate step 10 lists.

**Commit:** `redline: R1-1 say the 0.5.0 replay note holds only on a pull request with no earlier answered round (#105)`

## Task 3: R1-4 — a call the forcing point relabels keeps its options as the shaper wrote them

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`

1. **Red.** In `tests/loop-test.mjs`, after the `ordinary` check (4923), add a block. Every scenario in it uses `ruleArgs` (the paths rule `craft-config`) and the finding `cfg` (`R1-1` on `config/project/project.yaml`), with `ask: ['R1-1']` and `commitIds: [[]]`, as `shaperCall` does; its call's options are `Full fix` (ends `fix`), `Mitigate` (ends `defer`) and `Accept` (ends `accept`), `recommended: 'Full fix'`.
   - **Relabelled, to the hand-off.** `whyHuman: { 'R1-1': 'outside the pull request' }`, `Mitigate` with no `draft` key at all. Check it reaches the hand-off (`status === 'handoff'`), its call is returned with `why_human` `repository rule craft-config` and all three options as written, `Mitigate` with no `draft`, and `res.warnings` includes step 2's warning exactly: `round 1: the shaper asked about R1-1 because of "outside the pull request"; repository rule craft-config leaves it to the person, and its call keeps the options the shaper wrote`.
   - **Relabelled, on autopilot.** The same scenario with `interrupt: 'autopilot'`. Check the run finishes (`status === 'done'`) and is not stopped at `shape` (its `stage` is not `shape`); the finding is left to the person under the rule (`(res.forced || []).some((x) => x.id === 'R1-1' && x.rule === 'craft-config')`); and nothing is filed (`filedCalls(r).length === 0` and `(res.deferred || []).length === 0`), as the existing `auto` check reads it.
   - **Relabelled, a partial draft.** The relabelled scenario whose `Mitigate` option carries a draft with only `title` (`draft: { title: 'Lock R1-1' }`). Check it stops at `shape` (`status === 'error'`, `stage === 'shape'`, `ownCheck === true`, `resumeFrom.label === 'shape r1'`) with the existing undrafted-defer error, its text containing `("Mitigate": missing found, why, fullFix)` and opening `the shaper gave R1-1, a call for a finding left to the person, an option that ends in defer with no complete drafted issue`. This is a pin: it stops the same way before the change, so it passes on the red run; it is seen red under a mutation of step 2's `undrafted` filter that drops `option.draft !== undefined` and exempts every defer option of a relabelled call (the first version of this plan), and the mutation is recorded under As built.
   - **Written as left, an own-file reason.** `whyHuman: { 'R1-1': 'redline\'s own file' }`, `Mitigate` with no `draft` key at all. The shaper was told by `LEFT_CALL` to draft such a call's defer option, so it is not relabelled. Check it stops at `shape` (`status === 'error'`, `stage === 'shape'`, `ownCheck === true`, `resumeFrom.label === 'shape r1'`) with today's undrafted-defer error, its text containing `("Mitigate": missing title, found, why, fullFix)` and opening the same way as the partial-draft case. This is a pin: it stops the same way before the change; it is seen red under a mutation of step 2's `relabelled` condition that drops the `OWN_FILE` exclusion, and the mutation is recorded under As built.
   - **Written as left, a rule's reason.** A neighbour that must not change: the `bareDefer` and `noOptionDraft` checks (4914-4917), where the shaper wrote the call with `why_human` `repository rule craft-config`, still stop at `shape` with today's error. Leave them as they are; they are the pin for a call the shaper wrote under a `repository rule <id>` reason. `bareDefer` is seen red under a mutation of step 2's `relabelled` condition that drops the `repository rule ` prefix exclusion, and the mutation is recorded under As built.
   - Seen red: the relabelled hand-off check and the relabelled autopilot check fail with the error at `shape`.
2. **Green.** In `workflows/redline-loop.js`, `forceAskRules`:
   - In the branch where the shaper already wrote the call (`} else { call.why_human = why }`, 3823-3825), before `why_human` is overwritten, read whether the call is relabelled: its old `why_human` is not a reason the shaper is told marks a left call, that is, it is neither `OWN_FILE` nor a string that starts with `repository rule ` (any rule's id, this one's or another's). Only then push one warning: `` `${pass.name}: the shaper asked about ${f.id} because of ${JSON.stringify(<the old why_human>)}; repository rule ${rule.id} leaves it to the person, and its call keeps the options the shaper wrote` ``. A call whose old `why_human` is `OWN_FILE` or any `repository rule <id>` is relabelled to this rule's reason as today, with no warning and no flag: the shaper was told by `LEFT_CALL` (1125) to draft its defer option, so it is held to the draft.
   - In the `record.forced[f.id]` entry it writes (3831-3833), add `relabelled: true` for a relabelled call only. The entry is written only when the finding is not already decided, as today, so a decided call keeps its entry.
   - In `checkOptions` (3592), `const left = Boolean((record.forced || {})[call.id])` stays as it is, and so does the draft-dropping loop after it. The `undrafted` filter becomes, on a left call:
     - not relabelled (a call the workflow wrote, or one the shaper wrote as left): today's filter, `option.ends === 'defer' && draftMissing(option.draft).length`;
     - relabelled: `option.ends === 'defer' && option.draft !== undefined && draftMissing(option.draft).length`.
     So only a defer option that carries no draft at all, on a call relabelled from a reason that does not mark a left call, is exempt. A partial draft there stops at `shape` with today's exact error text, as on any left call, since a kept draft on a left call is the one the resolve step files on a pick (`optionDraft`, 4424-4432), and one short of a field would stop the round at `resolve` on every resume (4474-4477). A complete draft is kept, as on any left call.
   - Update the comment above `checkOptions` (3568-3573) by one sentence: a call `forceAskRules` relabelled from a reason that does not mark a left call (neither `redline's own file` nor a `repository rule`, the two `LEFT_CALL` tells the shaper to draft for) was written as an ordinary call, so a defer option of it that carries no draft is not held to one, and a pick of it has the resolve agent write the draft, as a typed defer on a call that offered no draft does; a draft such an option does carry is the one filed on a pick, so it is held complete like any left call's, and a call the shaper wrote as left is held to its draft as before.
   - No other reader of `record.forced` reads the new key.
3. In `docs/running.md`, "Left to you" (95), after "(a typed defer on a call that offered no draft has the resolve agent write one)", add one sentence: a call the shaper wrote as an ordinary one (for a reason other than a repository rule or Redline's own files), for a finding a paths rule turns out to cover, is left to you with the options it was written with, and a pick of one of them that ends in an issue and carries no draft has the resolve agent write the draft the same way.

**Proof:** the new checks pass, `bareDefer` and `noOptionDraft` still pass, under `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`; the three pins are each seen red under their mutation (the partial-draft case under the filter mutation, the own-file case under the `OWN_FILE` mutation, `bareDefer` under the prefix mutation), one mutation at a time, and each mutation is reverted before the commit.

**Docs:** `workflows/redline-loop.js` → `docs/running.md`, "Dispositions", "Left to you", updated in this task.

**Commit:** `redline: R1-4 keep a relabelled call's undrafted options and hold every left call's draft complete (#105)`

## Task 4: R1-2 — a human pass's options sentence names only a rule call

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`:
   - After the check whose name opens "left: a human pass's shape prompt asks for the draft" (4942), add: a human pass in a repository with no ask rules (`humanArgs` over `baseArgs` with `askRules: []`, any scenario that reaches `shape h1`): its `shape h1` prompt contains no `file of Redline's own` and no `on a call for`; and its `reshape h1 #1` prompt after one bounce the same.
   - Change the check at 4942 to expect, for a human pass in a repository with rules, `on a call for a finding a repository ask rule covers, which is left to the person` followed by `DRAFT_ASK`, and no `file of Redline's own`.
   - A neighbour that must not change: the round's `LEFT_ASK` and `OWN_ASK` checks (4932-4933) stand as they are.
   - In the `returns` check (4603-4609), the `OPTIONS_ASK` constant ends in `on a call for `, which a human pass in a repository with no rules no longer carries: cut the constant to end at `the option you recommend)`, so every prompt in `returns` still matches it, and keep the rest of the check.
   - Seen red: the new no-rules checks and the changed 4942 check fail.
2. **Green.** In `workflows/redline-loop.js` (1118-1126), build the options sentence by pass kind: keep `LEFT_CALL` and the Redline round's sentence byte-identical, and add a human pass's form whose left-call clause is `; on a call for a finding a repository ask rule covers, which is left to the person, an option that ends in defer also carries draft, ...` (the same tail) when `askRules.length`, and empty otherwise. Use it in `humanShapePrompt` (2319) and in the reshape prompt (2356) when `pass.human`. Update the comment above `LEFT_CALL` (1118-1124) by one sentence: a human pass never leaves an own-file finding to the person (`forceAskRules` records one only when `!pass.human`), so its sentence names a rule call alone.

**Proof:** the new and changed checks pass, and every other `ends:` and `left:` check still passes, under `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`.

**Docs:** `workflows/redline-loop.js` → no reader-facing change: the sentence is the shaper's prompt in a human review pass; `docs/running.md`, "Left to you", and `docs/contract.md`, "Ask rules", describe what a person sees, which is unchanged.

**Commit:** `redline: R1-2 name only a rule call in a human pass's options sentence (#105)`

## Task 5: R1-3 — a revise-only pass clears a link with a reason that is true

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`, change the `reviseOnly` check (5059) to expect `CLEARED(2, 'R2-1', 'R1-1', 'this revise-only pass holds no record of earlier rounds to check it against')`, and update the comment above it (5056-5057) to say the reason. Neighbours that must not change: every `CLEARED(...)` in the `cleared`, `partly`, `priorOther` and `unasked` checks (5046-5055). Seen red: the changed check fails.
2. **Green.** In `workflows/redline-loop.js`, `honourLinks` (3033-3053): give it a way to know the pass holds no record (a fourth parameter, or a value of `asked`), and for such a pass replace the `linkFault(id)` reason with `this revise-only pass holds no record of earlier rounds to check it against`; a link to a finding of the same pass keeps `${id} is a finding of this round`. Pass it at the revise-only call (5701), and update the comment above that call (5698-5700) to say what the warning says. The other call (3136) is unchanged.

**Proof:** the changed check and its neighbours pass under `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`.

**Docs:** `workflows/redline-loop.js` → no reader-facing change: `docs/running.md`, "Dispositions", "Instance or class", says a link the record cannot show as fixed is cleared with a warning, which still holds; only the warning's reason changes.

**Commit:** `redline: R1-3 give a link a revise-only pass clears a true reason (#105)`

## Task 6: R1-5 (deferred, mitigation) — the two new checks name every failure in one error

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`:
   - After the `instanceAlone` check (5088), add: a round with two correctness findings, `R1-1` and `R1-2`, both fixes, `causeOf: { 'R1-1': null, 'R1-2': { where: 'app/x.php', outcome: 'sweep', why: 'w' } }`. Check it stops at `shape` (`stopsAtShape`, `shape r1`) with one error that contains `NO_CAUSE('R1-1', 'no cause')` and `NO_SWEEP('R1-2', 'no swept list')`.
   - After the `bareDefer` check (4917), add: a call left under the rule whose options have two faults (a repeated label and a `recommended` that names none of them), or two such calls. Check it stops at `shape` with one error that names both faults.
   - Neighbours that must not change: every existing single-fault check in the `ends:`, `left:` and `class:` sections keeps its exact error text (`noCause`, `noWhy`, `outside`, `elsewhere`, `unswept`, `emptySweep`, `openMember`, `noOptionDraft`, Task 3's partial-draft and own-file pins, the `stopsAtShape` checks with `INSTANCE(...)`).
   - Seen red: both new checks fail, each error naming only the first fault.
2. **Green.** In `workflows/redline-loop.js`:
   - `checkOptions` (as Task 3 leaves it): for every call still open, collect each fault message exactly as it reads today (no label or no end, repeated label, `recommended` naming no option, undrafted defer on a left call by Task 3's filter, which exempts only a draftless defer option of a relabelled call) instead of throwing; the draft-dropping warnings run as today. After the loop, when any fault was collected, throw one `checkError('shape', <the messages joined with '; also, '>, {}, shaperLabel)`.
   - `checkCauses`: for every fix, collect its faults in the same way: a missing or broken cause is one fault and the finding's other checks are skipped; a `where` outside the repository is one fault and the one-place check is skipped; otherwise the one-place miss, the unusable sweep and the instance under a link each add one. After the loop, throw one `checkError` the same way.
   - With one fault, each error is byte-identical to today's.
   - Update the comment above each function by one sentence: it names every fault in one error, since a reshape is told to correct what the error names (`agent-os/standards/workflow/replay.md`, line 19).

**Proof:** the two new checks pass and every neighbour keeps its text, under `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`.

**Docs:** `workflows/redline-loop.js` → no reader-facing change: `docs/running.md`, "Run markers and resume", lists these stops as the workflow's own checks of the shaper's result, which they still are; what they stop on and how a resume reruns them are unchanged, only an error with several faults now names all of them.

**Commit:** `redline: R1-5 name every fault of checkCauses and checkOptions in one error (#105)`

## Task 7: R1-6 — the outside-path stop says what `where` names by outcome

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`

1. **Red.** In `tests/loop-test.mjs`, at `OUTSIDE` (5073), keep the constant as it is for the existing `outside` check (outcome `instance`, which must not change), and add a one-place form: `` `the shaper said the cause of ${id} lives at ${JSON.stringify(where)}, which is no path inside the repository; a one-place fix's where names one of the task's files, the one the cause lives in` ``. After the `outside` check (5075), add a check: a one-place fix with `where: '../other/app/x.php'` stops at `shape` with the one-place form. Seen red: it fails with the "file or folder" text.
2. **Green.** In `workflows/redline-loop.js`, the outside-path message of `checkCauses` (3634-3636, as Task 6 leaves it): when `cause.outcome === 'one-place'`, end it "; a one-place fix's where names one of the task's files, the one the cause lives in"; otherwise keep "; where names the file or folder the cause lives in".

**Proof:** the new check and the existing `outside` check pass under `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json`.

**Docs:** `workflows/redline-loop.js` → no reader-facing change: `docs/running.md`, "Dispositions", "Instance or class", already says a one-place fix's task touches the place it names; only the stop's wording changes.

**Commit:** `redline: R1-6 word the outside-path stop of a one-place fix by its contract (#105)`

## Task 8: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-24-1712-127-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text stays the source.

10. **Docs.** Each task's Docs entry names its section or its reason:
    - Task 2: `docs/upgrading.md`, "A stopped run across 0.5.0", is the change itself.
    - Task 3: `workflows/redline-loop.js` → `docs/running.md`, "Dispositions", "Left to you", updated in Task 3's commit.
    - Tasks 4, 5, 6, 7: `workflows/redline-loop.js` → no reader-facing change, each with its reason in its task.
    Confirm each names its commit (As built) or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both stay `0.5.0`; the setup test's last cases check they agree.
12. **Standards retrospective.** Apply the list under "Standards retrospective (proposed)" in `shape.md` as the standards approver approved it, in its own commit (`redline: land the PR #127 round 1 standards retrospective (#105)`), staging only the standards files it names; or, if it approved none, record "Standards retrospective: no changes" under Decisions in `shape.md`.
13. **Spec folder.** Add an "As built" section to this file with each task's commit, its red and green runs, the three mutation runs of Task 3's pins, and any deviation, and record each deviation under Decisions in `shape.md`; commit both in the round's last commit.
