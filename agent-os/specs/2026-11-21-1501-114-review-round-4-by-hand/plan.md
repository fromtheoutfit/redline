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

Written as each task lands.
