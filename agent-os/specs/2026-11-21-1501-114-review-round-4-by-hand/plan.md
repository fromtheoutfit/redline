# PR #114 Review Round 4, Fixed by Hand — Plan

Redline's run on PR #114 stopped at its round cap with round 4's six findings undecided. This plan fixes all six, and settles once the class three of them belong to: a path an agent returns is read in more than one form. One commit per task, in the order below. The decisions are in `shape.md`. @michaelfromtheoutfit makes every commit.

Line numbers are at `4200467`. Every count is `node tests/loop-test.mjs`; it stood at `1556 checks passed, 0 failed` before the first commit.

## Task 1: Save spec documentation

Create this folder with `plan.md`, `shape.md`, `standards.md` and `references.md`. No visuals.

Before it, measure the table (`shape.md`, decision 2): a throwaway script lifts the workflow's path functions from the source as it stands and runs them, and the guard as it stands, on every form, beside the draft of the normaliser. Its three tables go into `shape.md` under "The table".

## Task 2: R4-1, the exception in rule 9 and the resume clause

- **Change:**
  - `agents/redline-shaper.md`, rule 9: "The one exception to rewriting from scratch is a resume line that says ...", ending with the sentence that the `redline/` folder is left alone there as well.
  - `workflows/redline-loop.js`, `resumeLine` (607): the correct-in-place clause ends "; never change or remove anything under its redline/ folder." The comment above it says so.
- **Test:** in `tests/loop-test.mjs`, `CORRECT_TASK` (3511) carries the new ending and is changed first, so the resumed-reshape check (3515) is red before the clause is. A check beside it reads rule 9 for "The one exception to rewriting from scratch". The neighbour is unedited: a reshape resumed after another stop keeps `FROM_SCRATCH` (3519).
- **Docs:** `agents/redline-shaper.md` and `workflows/redline-loop.js`: `docs/running.md`, "Run markers and resume", already says the shaper never touches `redline/` on any shape-stage resume: no reader-facing change.

## Task 3: R4-2 and R4-3, one normaliser for the decided list and the paths rules

One commit for both findings, since one change turns both sets of cases green (`shape.md`, decisions 11, 15, 18, 19).

- **Change:** in `workflows/redline-loop.js`:
  - `repoPath(raw)`, above the ask rules where `relPath` stood (481-485): the text trimmed, joined to the repository root unless it is absolute, its segments walked (a blank or `.` skipped, `..` taking the last one off), and the root taken off. It returns `path` (`''` for a blank or the root itself; relative inside the repository; absolute outside it), `outside`, `dir` (the trimmed text ends in `/`, `/.` or `/..`) and `up` (a `..` segment in the text).
  - `cleanPaths` (494): the list through `repoPath`, the blanks dropped, each path once.
  - `ruleForPaths` (543-555): each path through `repoPath`; a blank or an outside path is under no rule; the path, and the path with a slash when `dir`, are matched case-folded.
  - `relPath` is deleted. The comments above the three are rewritten, the R1-6, R2-2 and R3-3 history kept as history.
- **Docs:** `docs/contract.md`, "Ask rules" (152): the paths bullet says the workflow reads a path once, as the guard reads a write target (the list of what is folded), that a path written as a directory is matched with its slash, and the two differences (padding trimmed; no links, which the guard alone resolves). Updated in this commit.
- **Test:** in `tests/loop-test.mjs`, each case written first and seen red unless marked.
  - Beside the R2-2 forms (3481): a reshape lists the resolve's `app/x.php` as `app/sub/../x.php`, `app/x.php/.` and `../r/app/x.php`: the second pass is shown `app/x.php` and nothing is warned.
  - Beside `resolvedOtherForm` (3485): a resolve plans `app/sub/../x.php`, read as `app/x.php` on both passes.
  - Beside `fixBlanked` (3474): an override to fix that a reshape leaves with only `/r`, or only `app/..`, stops at that reshape as one with no files does.
  - A reshape that lists `../x.php` is warned about as a change to `/x.php`. A reshape that lists `/etc/x.php` is warned about as a change to `/etc/x.php` (held before; red under a mutation that drops an outside path).
  - Beside the R3-3 forms (1451): `config//project/`, `config/./project/`, ` config/project/ `, `config/other/../project/`, `app/../config/project/x.yaml` and `../r/config/project/x.yaml` are left to the person. `config/project/.` still is (held before; red under a mutation of the directory test).
  - `config/project/../other.yaml`, and `/etc/a.secret.yaml` under a rule `*.secret.yaml`, force nothing and the fix is built.
  - Under a comment naming the drafted issue (`shape.md`, "For you to open"): `config/project` and `config/` are not left (held before; red under a mutation that adds the slash to every path), and `config/project/..` is no longer left (decision 16).
  - The contract pin (1465) reads the new phrase.
  - Unedited and still green: every R1-6, R2-2 and R3-3 case (1451-1464, 3472-3486, 3627).

## Task 4: R4-4, the shaper's own list

- **Change:** `workflows/redline-loop.js`, `vetShape` (3722): straight after `forceAskRules`, each finding whose `files` is a list has it replaced by `cleanPaths(files)` (`shape.md`, decision 20). The comments above `shaperFiles` (3760) and `plannedFiles` (4040) say the list arrives cleaned.
- **Test:** in `tests/loop-test.mjs`, written first and seen red.
  - A shaper deferral listed with `['']`, and one with `['  ']`: the round's draft stop shows `ships: false` and `files: []`, and the finished run has no "planned a mitigation in" warning.
  - A fix nobody decided, listed as `./app/x.php`: the plan approver and the implementer are shown `app/x.php`.
  - The order is pinned by Task 3's `config//project/` case, which lists the directory through the shaper's `files`: with the rewrite moved above `forceAskRules` it is red (mutation).
  - Unedited and still green: `foldedOutside` (1455), whose shaper lists `config//project.yaml`.
- **Docs:** `workflows/redline-loop.js`: neither the README nor `docs/` describes the form of the shaper's list: no reader-facing change.

## Task 5: `planPaths`, the plan approver's list

No finding names it; the table does (`shape.md`, decisions 11, 12, 17, 21).

- **Change:** in `workflows/redline-loop.js`:
  - `planEntry(raw)`, beside `repoPath`: the entry as the allowed list takes it, or the reason it is dropped. A blank is dropped silently. The root itself, a path outside the repository and a directory written through `..` are dropped with a reason. Otherwise the path, with a slash when it was written as a directory.
  - `planPaths` (4221) is built with it, each drop warned about once: `<round>: the plan approver listed <the entry as written>, which <reason>; it is not among the allowed paths`.
  - The fix-diff compare (5200) reads the reviewer's file through `repoPath`; its warning still shows the file as written.
- **Docs:** `docs/contract.md`, "Snapshot file" (204): `plan_paths` is each path the plan approver listed, read as the guard reads a write target, a directory keeping its slash, and an entry that is the repository root, outside it or a directory reached through `..` is left out with a warning. Updated in this commit.
- **Test:** in `tests/loop-test.mjs`, written first and seen red.
  - An approver's list of mixed forms (` ./app//x.php`, `/r/app/sub/../y.php`, `app/Services/`, `tests/./`, `app/z/.`): the round snapshot's `plan_paths` holds `app/x.php`, `app/y.php`, `app/Services/`, `tests/`, `app/z/` and the spec folder.
  - `.`, `/r`, `app/..`, `../x.php`, `/etc/x.php`, `app/sub/../` and `app/sub/..`: none is in `plan_paths`, and each is warned about by name; a blank is absent with no warning.
  - The never-widen pin (decision 12): for every entry of those two lists, what the snapshot holds ends in `/` only when the entry as written ended in `/` or `/.` and held no `..`, and no entry is empty or `/`. Red under a mutation that writes a `..` directory as its folded prefix, and under one that keeps the root.
  - Beside the fix-diff cases (4055): a reviewer's `./app/Services/Retry.php` under a plan path `app/Services/`, and a file `app/x.php` under a plan path written `./app//x.php`, are honoured as in the fix diff.
  - Unedited and still green: the fix-diff cases (4055-4061) and the `plan_paths` checks (1035, 1605).

## Task 6: R4-5, the named-fix check at a second resolve

- **Change:** `workflows/redline-loop.js`, `resolveWith` (4004): `namedUnplanned` leaves out an id that already has a list in `decidedFiles`. `namedPlanned` (4008) is unchanged. The comments above both say which place decides what (`shape.md`, decision 14), and the comment above the set-once loop (4012) no longer implies that both checks read that resolve's tasks.
- **Test:** in `tests/loop-test.mjs`, beside `overrideRecalled` (3414).
  - An override to fix that a reshape returns as a call, whose second resolve (`resolve r1 #1`) plans no task for it. Written first and seen red: the run stops at `resolve r1 #1` with "the resolve agent planned no task with files for R1-1, which a disposition override names as a fix". Green: the run finishes, and the second pass and the implementer are shown the list as the reshape left it.
  - An override to accept that a reshape returns as a call, whose second resolve returns a task with files: the run stops at `resolve r1 #1` with "the resolve agent planned a task with files for R1-1 (app/y.php), which a disposition override names as accepted". It held before; red under a mutation that leaves an id with a list out of `namedPlanned` too.
  - The neighbour: a first resolve is still held to its own tasks. The existing #108, R1-5 cases are unedited; they are red under a mutation that leaves every id out of `namedUnplanned`.
- **Docs:** `workflows/redline-loop.js`: no stop, message or key is added. `docs/running.md` is searched for the named-fix stop at the build; if it describes the stop for every resolve, the sentence is narrowed in this commit, and otherwise there is no reader-facing change.

## Task 7: R4-6, the hold names both kinds at once

- **Change:** `workflows/redline-loop.js`, the hold (4166-4175): both lists are computed, then one error is thrown. With one kind the message is the one it is today, byte for byte. With both: `the reshape left <the fix clause>; a fix names the files it changes; and <the accept clause>; an accepted finding changes nothing`.
- **Test:** in `tests/loop-test.mjs`, beside `twoEmptied` (3459), written first and seen red: two overrides, R1-1 to fix and R1-2 to accept, and one reshape that empties R1-1's task and gives R1-2 `app/y.php`. Red: the stop names R1-1 alone. Green: one stop at `reshape r1 #1` that names both, and the resumed reshape's prompt ends with the correct-in-place clause. Unedited and still green: `NO_TASK` and `A_TASK` in every case that reads them (3449-3460, 3504).
- **Docs:** `workflows/redline-loop.js`: `docs/running.md`, "A reshape after your decision", says the stop is at stage `shape`, resumable at that reshape, and does not quote the error: no reader-facing change.

## Task 8: Verification Gate

Run the nine commands of the Verification Gate (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then CONTRIBUTING's other three: `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .`, and a clean tree.

- **The sweep** (`testing/tests.md`, line 36): a copy of the harness in the temp directory runs every scenario under the script as it read at `4200467` and as built, and compares each call's label, prompt and options. As built records the counts and explains every scenario that differs.
- **The table as built:** the measuring script is run against the functions as built, and As built records any cell that differs from `shape.md`'s.
- **Docs (step 10):** each entry above names its commit or its reason.
- **Version (step 11):** 0.4.4, kept on purpose (`shape.md`, decision 6).
- **Standards retrospective (step 12):** the drafts under "Standards retrospective (proposed)" in `shape.md` are put to the person and applied in their own commit.
- **Spec folder (step 13):** this plan's As built section, and any deviation under Decisions in `shape.md`.

## After the push: the six replies

1. Confirm that `gh pr view 114 --json headRefOid` equals local HEAD.
2. Write `round-4-reply-R4-<k>.md` into `agent-os/specs/2026-11-20-2144-114-review-round-4/redline/`. Each of R4-1, R4-2, R4-3, R4-5 and R4-6 is one line: `Redline round 4: fixed in <sha> (<subject>). · decided by: @michaelfromtheoutfit`. R4-2 and R4-3 name Task 3's commit. R4-4's file has:
   - `<!-- redline:R4-4 -->`
   - `**R4-4** · \`workflows/redline-loop.js:3761\` · from the Redline round 4 review body`
   - a blank line
   - the same reply, naming Task 4's commit.
3. Show all six to @michaelfromtheoutfit, and ask whether the five threads are resolved afterwards.
4. Post them: `scripts/redline-gh.sh reply 114 <comment id> <file>`, with comment 4653942695 for R4-1, 4653942703 for R4-2, 4653942709 for R4-3, 4653942714 for R4-5 and 4653942719 for R4-6; and `scripts/redline-gh.sh comment 114 <file>` for R4-4.
5. Check that `scripts/redline-gh.sh prior-findings 114` reads R4-1 to R4-6 as `fixed`.
6. @michaelfromtheoutfit commits the reply files as the record.

## As built

- **Before the first commit** (2026-11-21, `4200467`, node 22.23.2): `node tests/loop-test.mjs` printed `1556 checks passed, 0 failed`. Every count below is that command's.
- **Task 1** (`945dd1e`): this folder. The measuring script ran at `4200467`: 30 forms against the two file lists and the plan approver's list, 34 forms under the two paths rules, each beside the guard's own decision, and 11 pairs for the fix-diff compare. Its three tables are in `shape.md`.
- **Task 2** (R4-1, `941e4d8`): `CORRECT_TASK` and a check on rule 9 were changed and added first. Red: 1555 passed, 2 failed (the resumed reshape's prompt; rule 9's sentence). Green: 1557 passed, 0 failed.
- **Task 3** (R4-2 and R4-3, `4225c1f`): the cases were added first. Red: 1569 passed, 18 failed: six forms under the rule that were not left to the person, three that were and should not be, `config/project/..`, the contract pin, three reshape forms warned about as a change, the resolve's `..`, the two forms of the root counted as a file, and `../x.php` shown as written. Five held before, as planned. Green: 1591 passed, 0 failed; with the case-fold pin below, 1592.
  - **Deviation: three cases beyond the plan's list.** `config/project/sub/../../other.yaml` beside the other path out of the rule; a path inside the repository under the rule with no slash, as the neighbour of `/etc/a.secret.yaml`; and a path in another case. The last was found by a mutation: with the rules' case fold taken out, every check stayed green, since no loop case had pinned it before `ruleForPaths`' loop was rewritten. It is pinned now and red under that mutation.
  - **Deviation: `repoPath` stands on a helper, `pathSegments`,** which folds the segments of the root and of the path the same way.
  - Mutations, each on a scratch copy of the workflow, the working tree untouched: no path written as a directory, 6 failed (`config/project/` and `config/project/.` among them); a list that drops a path outside the repository, 2 failed; a slash added to every path, 1 failed (`config/project`); a rule also taking a path its pattern starts with, 3 failed (`config/project`, `config/`, `config/project/..`, the drafted issue's pins); the rules reading a path outside the repository, 1 failed; a `..` segment kept, 11 failed; a `.` segment kept, 7 failed, R2-2's and R3-3's unedited cases among them; the root itself a path, 2 failed; no trim, 3 failed, R1-6's and R3-3's unedited cases among them; the rules skipping every path outside `config/`, 3 failed (the neighbour inside the repository among them). One mutation, every path read as outside the repository, printed no count: it crashed in an existing check that reads `judgmentCalls[0].forced.rule` unguarded (`tests/loop-test.mjs`, "rules: the shaper's files force the ask"), so it was replaced by the last one above. That check is left as it is.
- **Task 4** (R4-4, `f96a758`): the cases were added first. Red: 1594 passed, 4 failed: the two drafts listed with a blank said `ships: true` with `files` of `[""]` and `["  "]`, the push warned "R1-1 planned a mitigation in  and no commit of its own landed", and the plan approver and the implementer were shown the list as written. Green: 1598 passed, 0 failed; with the neighbour below, 1600.
  - **Deviation: one neighbour beyond the plan.** A finding returned with no list keeps none, so a result recorded before the list was required replays with the prompts it had. It held before and is red under a mutation that reads an absent list as an empty one.
  - Mutations: the rewrite moved above `forceAskRules`, 6 failed (`config/project/` and the five directory forms); an absent list read as empty, 1 failed; no rewrite, 4 failed.
- **Task 5** (the plan approver's list, `260f3b9`): the cases were added first. Red: 1603 passed, 5 failed: the two fix-diff compares, the snapshot's list as the approver wrote it, no warning, and the never-widen pin. Green: 1608 passed, 0 failed.
  - **Deviation: `repoPath` gained `up` and `blank` in this commit,** where `planEntry` first reads them, and not in Task 3's.
  - **Deviation: the list holds each entry once,** in the approver's order. `approvedPaths` was already each path once.
  - The warning reads `round 1: the plan approver listed \`app/sub/../\`, which names a directory through a .. segment; it is not among the allowed paths`; the other two reasons are `is the repository root` and `is outside the repository`.
  - Mutations: a directory through `..` written as its folded prefix, 3 failed; the root kept, 3 failed; a path outside the repository kept, 3 failed (the never-widen pin is among the three each time); the compare reading the file as written, 1 failed; every entry a prefix, 16 failed; a file through `..` left out too, 2 failed; a blank read as the root, 1 failed; no entry keeping its slash, 4 failed, the unedited folder case among them.
  - **The table as built:** the measuring script, run against `repoPath`, `cleanPaths`, `ruleForPaths` and `planEntry` as built, printed tables byte for byte the same as `shape.md`'s.
- **Task 6** (R4-5, `98df00f`): the two cases were added first. Red: 1609 passed, 1 failed: the override to fix stopped at `resolve r1 #1` with "the resolve agent planned no task with files for R1-1, which a disposition override names as a fix; a fix names the files it changes". The accept case held before, as planned. Green: 1611 passed, 0 failed.
  - `docs/running.md`, "A deferral you chose at a call", said the named check holds for every resolve, so one sentence was added there in this commit, as the task allowed for.
  - Mutations: the accept check also skipping a finding with a list, 1 failed (the accept case); no finding held for a named fix, 1 failed (the unedited #108, R1-5 case: the first resolve is still held); the fix check holding a finding with a list again, 1 failed; no finding held for a named accept, 2 failed.
- **Task 7** (R4-6, `60607d5`): the two cases were added first. Red: 1613 passed, 1 failed: the stop named R1-1 alone. The resumed reshape's case held before, since the resume line reads only how the error opens. Green: 1614 passed, 0 failed.
  - Mutations: the fixes alone named when both are broken, 1 failed; an accept left with a task not held, 3 failed, two unedited `A_TASK` cases among them; a fix left with no task not held, 9 failed, the unedited `NO_TASK` cases among them; the two clauses joined another way, 1 failed; the resume line reading another opening, 1 failed (the resumed case).
- **Task 8, gate steps 1 to 9:** `.claude/redline/checks.sh --baseline` exited 0 with every check (syntax, validate, guard, loop, prefs, gate, setup, gh, background) at 0, on the clean tree at `60607d5` and again at `8319e8a`, with the standards in. CONTRIBUTING's other three at `60607d5`: `scripts/redline-gate.sh check .` gave `match`, exit 0; `scripts/redline-setup.sh version .` reported `checks` and `unattended` current, exit 0; the tree was clean. Harness counts: loop 1614 checks passed, 0 failed; guard 601 passed, 0 mismatched.
- **The sweep:** the harness as it stands ran whole, once under the script as it read at `4200467` and once under the script as built, each run recording the label, prompt and options of every call. 618 scenarios, 590 identical, 28 that differ.
  - 25 of the 28 are this spec's own cases (35 were added; the other 10 are the pins that held before, identical under both scripts).
  - 3 existed at `4200467`. "rules: a task listed with a path that folds to one outside the paths rule" and "rules: a call answered with a fix whose task a reshape lists under a paths rule with a doubled slash" script `config//project.yaml` and `app//billing/charge.php` in a shaper's list, which the plan approver is now shown folded (Task 4). "reshape: an override to fix whose task the reshape removed, resumed" reads the resume line R4-1 changed.
  - **Deviation: two whole runs, not two scripts in one `go()`.** The first attempt ran each scenario under both scripts in one process and showed 39 as differing. Eleven of those were identical: the mock consumes what a scenario holds (the heads a gather reads, a filed record kept across launches), so the second run in the process started from what the first had left.
- **Step 10, Docs:**
  - `agents/redline-shaper.md` and `workflows/redline-loop.js`, R4-1 (`941e4d8`): no reader-facing change. `docs/running.md`, "Run markers and resume", already says the shaper never touches `redline/` on a shape-stage resume.
  - `workflows/redline-loop.js`, R4-2 and R4-3 (`4225c1f`): `docs/contract.md`, "Ask rules", updated in `4225c1f`.
  - `workflows/redline-loop.js`, R4-4 (`f96a758`): no reader-facing change. Neither the README nor `docs/` describes the form of the shaper's list.
  - `workflows/redline-loop.js`, the plan approver's list (`260f3b9`): `docs/contract.md`, "Snapshot file", updated in `260f3b9`.
  - `workflows/redline-loop.js`, R4-5 (`98df00f`): `docs/running.md`, "A deferral you chose at a call", updated in `98df00f`.
  - `workflows/redline-loop.js`, R4-6 (`60607d5`): no reader-facing change. `docs/running.md`, "A reshape after your decision", names the stop and its stage and does not quote the error.
  - No new config key, subcommand, allow rule or exit code.
- **Step 11, Version:** 0.4.4 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, kept on purpose (`shape.md`, decision 6).
- **Step 12, Standards retrospective:** all seven drafted edits were approved (E1 to E7 in `shape.md`) and landed in `8319e8a`: line 50 of `workflow/agents.md` reworded from the R1-6 sentence on, clauses on its lines 10, 17 and 47, one on line 19 of `workflow/replay.md` and one on line 36 of `testing/tests.md`. Each edited line was read back whole. No heading changed, and no new rule needs enforcing code.
- **Step 13, Spec folder:** this section, and the deviations above under decision 25 in `shape.md`.
- **Commits:** `945dd1e` spec · `941e4d8` R4-1 · `4225c1f` R4-2 and R4-3 · `f96a758` R4-4 · `260f3b9` the plan approver's list · `98df00f` R4-5 · `60607d5` R4-6 · `8319e8a` standards.
