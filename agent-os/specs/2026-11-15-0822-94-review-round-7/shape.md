# PR #94 review round 7: nothing dropped, the second look read, and the quoted subject's edge cases — Shaping Notes

Shaped by Redline in unattended mode, for review round 7 of PR #94 (issue #93, with #68 on the same branch), from the round's ten findings (`redline/round-7-review.json`, `redline/round-7-findings.json`). Line numbers are at `8739d8b`, the working tree's HEAD (round 6 as built); only this spec folder and round 6's `redline/` folder are untracked.

## Scope

The round's ten findings, nothing more. One is correctness (R7-10); nine are nits. Every fix is in a file the pull request already changes: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `docs/running.md`, `docs/contract.md`, `skills/redline/SKILL.md`.

- `fix`, nine: R7-10 (Task 2), R7-1 (Task 3), R7-3 (Task 4), R7-4 (Task 5), R7-5 (Task 6), R7-6 (Task 7), R7-7 (Task 8), R7-8 (Task 9), R7-9 (Task 10).
- `decline`, one: R7-2.
- No `defer`, no `ask`. No finding touches one of Redline's own files (`scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline*.json`, `.claude/settings*.json`), and the invoking prompt lists no repository ask rules. Nothing this round plans touches `scripts/checks-template.sh`, `checks.json`, `checks.sh`, the gate's backticked text or anything under `templates/`, so nothing needs a regeneration, a restamp or a version bump.

## Unattended answers

1. **Scope.** The ten findings above. Evidence: the invoking prompt's findings JSON and point 6 of the unattended section ("Scope is the round's findings, nothing more").
   Decided by: redline
2. **Visuals.** None; the findings are about a workflow script, its test, two docs files and a skill file.
   Decided by: redline
3. **References.** `workflows/redline-loop.js` (the ask-rules comment, 112-115; the scope comment, 176-177; `SCOPE_DECLINED`, 341; `scopedLine` and `reviewBody`, 946-1020; `shownSubject` and `replyBody`, 1312-1321; the shaper prompt's return line, 1696; `compactFinding` and `result()`, 2242-2290; `checkDispositions`, 2669-2712; `forceAskRules`, 2809-2866; `checker()`, 2955-2992; `revise()`'s shape and reshape checks, 3010-3015 and 3144-3149; the implement loop and the round's commits, 3221-3271; the handoff's lists, 3395-3480; `humanSummary`, 3505-3549; the human pass's final nit pass, 3896-3930; the main loop's review and post, 3980-4016, and its endings, 4040-4090), `tests/loop-test.mjs` (the mock, 160-260; the scope section, 446-481; round_sha, subject and verdict, 875-950; the human pass, 1030-1090; coverage, 1520-1540; decline under a rule, 2285-2301), `docs/running.md` ("Rounds" step 7, 44-48; "Dispositions", 84-107; "The handoff comment", 141-161; "Decided by", 163-170), `docs/contract.md` (the git block, 56 and 75), `skills/redline/SKILL.md` (the grammar table, 27; the review-only summary, 170; the done summary, 242), `agents/redline-reviewer.md:12`, `agents/redline-shaper.md:21`, `scripts/checks-template.sh` (the budget comment, 150-176; `cut_subjects`, 315-331), and #93's spec, `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/`. Listed in `references.md`.
   Decided by: redline
4. **Product context.** `README.md:56` (the `scope` row): "otherwise every verified item is decided, and a round that fixed only nits ends in one final nit pass"; the skill's description: "every verified item is fixed, declined with a reason, or put to the person". R7-10 is where the code did not keep that. No roadmap item moves.
   Decided by: redline
5. **Standards.** `workflow/agents` (line 15, a message in the words of the decision; line 16, a rule changed everywhere it is stated; line 37, the workflow checks a result before it acts on it; line 39, a list read off each finding's final outcome), `testing/tests` (line 11, a non-ASCII character written as its escape; line 13, a fix pinned at a second call site; line 32, red before green), `scripts/bash-conventions` (line 45, a cut of text the workflow matches), `scripts/guard` (line 9, a template finding is a person's), `process/docs-gate`, `process/release`, `prompts/attribution`. Copied in `standards.md`.
   Decided by: redline
6. **R7-10: the pull request promises that no verified item is dropped, so reading (b) holds.** The finding offers two readings. The evidence answers it: the pull request's title is "every verified candidate is fixed, declined with a reason, or put to the person"; its description says, of the verifier's contract, "Nothing is dropped and nothing is parked"; `README.md:56` says "every verified item is decided"; and #93's spec records no decision to drop what a final nit pass reports. The final nit pass's prompt (`workflows/redline-loop.js:1430`, "Do not report nits") and `docs/running.md:45` ("reports no nits") say what the reviewer is asked to report, not what becomes of a nit it reports anyway. So the code that drops it with a log line (3986-3991, 3911-3915) disagrees with the stated promise, and that disagreement is the finding to fix (unattended section, point 2). The fix follows the pattern the pull request already set for the same situation under `correctness only` (3994-3997): the workflow declines the item with the pass's scope as its reason and lists it once, so it is not a judgment call: what a user sees follows from the promise and the existing pattern, not from a choice between products.
   Decided by: redline
7. **R7-5: the field stays; it is the spec's.** #93's `plan.md:97`: "The second look (decision 14): the shaper returns `secondLook` (`confirmed | refuted | unconfirmed`) for each item the verifier could not confirm, and records what it ran or read." So dropping the field, the finding's second option, would undo a recorded choice (point 4, the small-refactor rule). The workflow reads it instead. A miss is a warning, not a stop: the pull request's description names the two things that stop a round at `shape` ("a judgment call for any other reason stops the run at `shape`, and so does a decline with no reason"), and a third stop would change that contract.
   Decided by: redline
8. **A fix below the template's header is a person's, not the run's.** Point 11 of the unattended section: "So is a finding whose fix touches `scripts/checks-template.sh` below its header ... a person makes the change, regenerates `checks.sh` and restamps after the run." `agent-os/standards/scripts/guard.md:9` says the same. Round 6 (`agent-os/specs/2026-11-15-0822-94-review-round-6/shape.md`, Unattended answer 7) declined the template nits it would not act on anyway with that as where they belong. R7-2 is one.
   Decided by: redline
9. **R7-6 and R7-9 keep R6-5's rule.** Round 6's Decision 7: "`message` stays git's, so `judge()`, `outcomesFor`'s id match (2604) and every other matcher read what they read today." Both fixes change only which reported subject is quoted, never `message`.
   Decided by: redline

## Decisions

1. **R7-10: fix.** Confirmed by reading. In the main loop a final nit pass keeps only correctness findings (`workflows/redline-loop.js:3987`), and the rest become `droppedNits` and a log line (3988-3990); they reach neither `post()` (4008) nor the findings file, and the round record keeps only the count (4009, 2279). The human pass's final nit pass does the same (3911-3915, 3918-3919). Under `correctness only` the same kind of item has been declined visibly since #93 (`scoped`, 3997; `SCOPE_DECLINED`, 4009). Unattended answer 6 settles that the promise covers it. Change: a nit a final nit pass's reviewer reports is declined by the workflow under the pass's scope, as the correctness-only scope declines one: kept in the round's `findings` and `scoped`, its outcome `declined: outside the final nit pass's scope (correctness only) · decided by: redline`, listed once with a plain id and no thread (`scopedLine`) under `### Declined under the final nit pass's scope (correctness only) (n)` in that round's review body and, on a Redline run, in the handoff. It is never shaped and buys nothing. Both paths, the main loop and the human pass. `docs/running.md` and the skill's closing summary say so. Proportionality below. Plan Task 2.
   Decided by: redline
2. **R7-1: fix.** Confirmed: `docs/running.md:165` names "the handoff comment's Decisions list", and `handoffComment` has none since #93 (`workflows/redline-loop.js:3392`, "The single Decisions list is gone"); the owners sit on the item lines under the outcome headings (the `line` helper, 3431, used by Put to, Asked and decided on autopilot, Overruled by, Declined by Redline, Not picked, Not changed and Fixed; `leftToYou`, 3489-3500). Change: the sentence names those lines. Docs only. Plan Task 3.
   Decided by: redline
3. **R7-2: decline.** Confirmed as a description: the subject passes the template's cut and id rescue (`scripts/checks-template.sh:319-331`) and the workflow's `shownSubject` (`workflows/redline-loop.js:1317-1321`). Two of the three edge cases are R7-6 and R7-9, fixed this round in the workflow. The third needs a commit subject that wraps over several lines, which the git rules never make: "Every commit message starts with `redline: ` followed by one sentence" (`README.md:90`), committed by the implementer with one `-m` line. The simplification the finding proposes is in the template below its header, which no Redline role may change or regenerate (Unattended answer 8).
   Reason posted: the first two edge cases are R7-6 and R7-9, fixed this round, and the third needs a subject that wraps over lines, which the git rules' one-sentence subject never makes; removing the cut or the id rescue is a change to scripts/checks-template.sh below its header, which only a person can make and regenerate, so it belongs in a person's next change to the template.
   Decided by: redline
4. **R7-3: fix.** Confirmed: `skills/redline/SKILL.md:170` asks for what would confirm each unconfirmed finding, and the review-only result's `rounds[].findings` come from `compactFinding` (`workflows/redline-loop.js:2242-2244`, 2274), which carries no `wouldConfirm`. Of the two proposed fixes, the result is the clear pick: every other line of that summary reads the result, and the `reviewed` hand-off (SKILL.md:190) already gets `wouldConfirm` from it. `compactFinding` itself is also `history()`'s (2251), which feeds the reviewer's prompt, so the field is added only in `result()`'s round mapping, for an unconfirmed finding, with `not stated` when the verifier gave none, as the review body writes it (939). SKILL.md:170 names the field. Plan Task 4.
   Decided by: redline
5. **R7-4: fix.** Confirmed: line 114 says a rule-covered finding is "never fixed or deferred by Redline" while `rulesBlock` says "never fixed, declined or deferred" (463) and `forceAskRules` turns a decline into an ask (2836-2840); line 176 says the correctness scope "never looks for nits" while a nit a candidate raises is verified and declined under the scope (3997, 4009; `agents/redline-reviewer.md:12`). The lines are unchanged from `main`, but the behaviour they describe is this pull request's. `workflow/agents.md:16` asks for a changed rule to be restated everywhere it is stated, so the skill's grammar table, which says the same of the scope ("the reviewer never looks for nits", `skills/redline/SKILL.md:27`), is corrected in the same task. Plan Task 5.
   Decided by: redline
6. **R7-5: fix.** Confirmed: the schema allows `secondLook` (726), the shaper prompt (1696) and agent file (21, 32) ask for it, and nothing in the workflow reads it. Unattended answer 7 keeps the field. Change: a check beside `checkDispositions`, at both shape sites (3010, 3144), reading the shaper's values before `forceAskRules` rewrites them (`workflow/agents.md:37`), that warns when a finding the verifier could not confirm has no `secondLook`, and when a decline's reason opens `could not confirm` while its `secondLook` is `refuted` or `confirmed`. A Redline round only; a human pass has no unconfirmed finding. `docs/running.md` says so. Plan Task 6.
   Decided by: redline
7. **R7-6: fix.** Confirmed here: `printf 'e\303\251\342\200\224x\n' | awk '{print length()}'` prints `7` with `awk version 20200816`; a 95-character subject of 101 bytes (three em dashes) is cut by the template's logic to `... is three — of them...`, and `shownSubject`'s `whole.length > 100` (1320) then returns the cut form. Change: the length test goes, and the cut is recognised by its marker alone: git's subject has a `...` with text before it, and the implementer's whole line is longer than that part and opens with it. A subject that holds `...` and was not cut is then quoted as the implementer's first line, which for the same commit is the same text. `docs/contract.md:56` and `:75` say the cut counts bytes where awk does, as macOS's does. The template's own comment ("cut at subject_max characters", `scripts/checks-template.sh:155`) is below its header, a person's (Unattended answer 8), and noted under Context. Plan Task 7.
   Decided by: redline
8. **R7-7: fix.** Confirmed by reading: `forceAskRules` sets `record.forced[f.id]` on every pass (2865) and runs after every reshape (3147); a reshape is told to return a rule-covered finding as an ask (463) and may leave out a decided call (1753, `checkCalls`'s `known`), so it builds a fresh call from `s.recommendation` and rewrites the entry without `declined`, and the autopilot Deferred loop (3284-3291) then lists `open: By hand: ...`. Of the two proposed fixes the clear pick is the second: once a finding's call is decided (`decisions[f.id]`, module-level, 196), the forced entry it was decided on stands, whatever a reshape returns. It keeps the record of what was decided equal to what the person or autopilot saw, and does not guess which of an earlier and a later pass's `declined` is right. Plan Task 8.
   Decided by: redline
9. **R7-8: fix.** Confirmed: `checker()` pushes `readStructure`'s warning for the check call (2958-2961) and keeps only `.out` for the verdict call (2985). Change: the verdict call's warning is pushed too, under `<pass> verdict:`. Plan Task 9.
   Decided by: redline
10. **R7-9: fix.** Confirmed by reading: `implemented` is reassigned on each attempt (3229), the repair prompt asks only for its own commits, and the `claimed` lookup (3268) reads `implemented.commits`, the last attempt's, while the git block lists every commit since `round_sha`. Change: every attempt's reported commits are kept and the lookup reads them all. `finding` for such a commit is filled from the same lookup, which `outcomesFor`'s fallback (2615) already covered. Plan Task 10.
    Decided by: redline

### Proportionality

- **R7-10 (correctness).** Likelihood: it needs a final nit pass whose reviewer reports a nit though told not to, the round after a nit-only fix; the prompt is explicit, so it is occasional, not normal. Visible when it fires: the item is in nothing a person reads (no thread, no body line, no handoff line), only in a log line and a count in the result. Impact: a verified item vanishes, which breaks the pull request's stated promise. Cost: in files the pull request changes, about 25 lines of `workflows/redline-loop.js` (a constant, a helper for the scope's name, the two final-nit-pass blocks, two headings and one sentence), two loop checks, two docs sentences and one skill sentence; no new dependency, key or abstraction. Fix.

## Declined

- **R7-2.** The first two edge cases are R7-6 and R7-9, fixed this round, and the third needs a subject that wraps over lines, which the git rules' one-sentence subject never makes; removing the cut or the id rescue is a change to scripts/checks-template.sh below its header, which only a person can make and regenerate, so it belongs in a person's next change to the template.

## Deferred

None.

## Standards retrospective (proposed)

Done against the decisions above.

Already in a standard, no edit:

- A rule changed everywhere it is stated (`workflow/agents.md:16`): R7-4, which also corrects the skill's grammar table.
- A check on a shaper value reads it before the workflow rewrites it (`workflow/agents.md:37`): R7-5.
- A non-ASCII character in a test written as its escape (`testing/tests.md:11`): Task 7's test builds the em dash with `String.fromCharCode(0x2014)`.
- A fix pinned at a second call site (`testing/tests.md:13`): Task 2 pins both final-nit-pass paths.
- A template fix is a person's (`scripts/guard.md:9`): R7-2. The bullet says such a finding "is deferred the same way"; R7-2 is declined instead, since it is a simplification with no failure to mitigate, as round 6 declined R6-3 and R6-6. Proposed edit 5 says so.
- Red before green (`testing/tests.md:32`): Tasks 2, 4, 6, 7, 8, 9, 10.

Proposed edits:

1. `agent-os/standards/workflow/agents.md`, line 39 (the outcome-heading bullet). Append: "; and a verified item the workflow does not act on is declined with its reason and listed, never dropped with a log line and a count: a final nit pass's nits until #94, R7-10, now declined under the pass's scope as the correctness-only scope declines one".
2. `agent-os/standards/workflow/agents.md`, line 37 (the bullet on checking a result). Before "never a synthetic judgment call", insert: "a field the shaper's rules ask for is read by a check, a warning at least, or not asked for: `secondLook` rode along unread until #94, R7-5, and a miss is a warning, since a Redline round's shape stops only on the ask cases and a decline's reason;".
3. `agent-os/standards/workflow/agents.md`, a new bullet after line 39: "- A value a later pass of a loop rebuilds keeps what an earlier pass recorded once the run rests on it: the round's commits read every implement attempt's report, not the repair's alone (#94, R7-9), and a repository rule's forced entry whose call is decided stands through a reshape (#94, R7-7)".
4. `agent-os/standards/scripts/bash-conventions.md`, line 45 (the cut bullet). Append: " A reader of the cut recognises it by its marker, never by the length: macOS's awk counts bytes, so a subject under the limit in characters can be cut (#94, R7-6)".
5. `agent-os/standards/scripts/guard.md`, line 9. After "a person makes the change, regenerates `checks.sh` and restamps after the run (#7, R1-14; #12, R1-1)." insert: " A finding there with no failure to mitigate (a simplification, a cost, a comment) is declined instead, with the template as where it belongs (#94, R6-3, R6-6, R7-2)."

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** Unattended answer 4.
- **Run caution (#81), noted for the person, not a decision.** Tasks 2 and 4 to 10 commit changes to `workflows/redline-loop.js`, and Tasks 2, 4 and 5 change `skills/redline/SKILL.md`. A relaunch runs the script the run launched with, so this run's later rounds are unaffected; the next launch runs the new one. No agent file changes.
- **For a person's next change to the template, noted, not a task.** `scripts/checks-template.sh:155` says a subject is cut at `subject_max` characters, which holds only where awk counts characters (R7-6), and R7-2's simplification of the cut, the id rescue and `shownSubject`. Both sit beside round 6's deferred template fixes (`agent-os/specs/2026-11-15-0822-94-review-round-6/shape.md`, `## Deferred`).
- **The result's `droppedNits`.** After Task 2 nothing sets it, so it reads 0 for every round. It is kept, with a comment, since the existing check at `tests/loop-test.mjs:467` reads it and nothing in the skill or `docs/` does; removing the key is a follow-up a person may take.

## Standards Applied

- workflow/agents — line 15: R7-10's log line says what now happens; line 16: R7-4; line 37: R7-5; line 39: R7-10's list is read off each finding's outcome.
- testing/tests — line 11: Task 7's em dash; line 13: Task 2's two paths; line 32: red before green.
- scripts/bash-conventions — line 45: the cut R7-6 and R7-9 read.
- scripts/guard — line 9: R7-2's template change is a person's.
- process/docs-gate — each touched plugin file names its section in the plan.
- process/release — the version stays 0.3.0: the pull request already bumps the minor version, and nothing this round changes what a setup rerun writes.
- prompts/attribution — nothing posted or committed carries a model or vendor name.
