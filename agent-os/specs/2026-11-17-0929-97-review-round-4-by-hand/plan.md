# PR #97 Review Round 4, Fixed by Hand — Plan

Redline's run on PR #97 stopped at its round cap with round 4's seven findings undecided, and CI's shellcheck job is red. This plan fixes all seven as the review proposes, plus the shellcheck warning, one commit each, in the order below. The decisions are in `shape.md`. @michaelfromtheoutfit makes every commit.

## Task 1: Save spec documentation

Create this folder with `plan.md`, `shape.md`, `standards.md` and `references.md`. No visuals.

Before Task 2, run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, and record its output under As built.

## Task 2: SC2010 in `tests/gh-test.sh:461`

- **Change:** add a `leftover <dir>` helper modelled on `keptfiles` (`tests/setup-test.sh:504`). It loops over `"$1"/.redline-deferred.*`, the name `defer`'s `mktemp` uses (`scripts/redline-gh.sh:201`), counts with `[[ -e ]]`, and prints `0` when nothing is there. Line 461 uses it in place of `ls -A … | grep -c`.
- **Test:** red is shellcheck's SC2010 warning. Green: shellcheck is clean, `tests/gh-test.sh` passes, and the helper prints `1` on a scratch folder that holds one such file.
- **Docs:** none needed; `tests/` is not a docs-gated folder.

## Task 3: R4-1, a failed lookup or create in `defer` exits 1

- **Change:** in `scripts/redline-gh.sh`, guard the lookup (`:633`) with `|| { echo 'redline-gh.sh: the lookup on GitHub failed' >&2; exit 1; }` and the create (`:643`) with the same, naming the create.
- **Test:** in `tests/gh-test.sh`, the fake gh gains `GH_FAKE_FAIL_CODE` (default 1), read by `GH_FAKE_LIST_FAIL` and `GH_FAKE_CREATE_FAIL`. Two new cases use code 4. A failed lookup exits 1, names the lookup, creates nothing and records nothing. A failed create exits 1, names the create and records nothing. The existing failed-create case gains the second stderr line. Red: both new cases exit 4.
- **Docs:** README, the `scripts/redline-gh.sh` row of its file table, and `docs/scripts.md`, section `redline-gh.sh` (it quotes the `defer` header): no reader-facing change. Both already say a failed lookup or create exits 1, and the code now does.

## Task 4: R4-2, the shape schema's comment on `reason`

- **Change:** reword the comment in `workflows/redline-loop.js:847-849` to: "A decline's reason (#93), the sentence a teammate reads in the thread: why Redline does not act. It never points at follow-up work, which is a defer (#95). Required for a decline, which checkDeclineReasons holds the shaper to."
- **Test:** none; the change is a comment.
- **Docs:** none needed; a code comment.

## Task 5: R4-3, a dropped draft of a deferral the person chose keeps their reason

- **Change:** in `workflows/redline-loop.js`:
  - `outcomesFor`'s decided branch (`:2942`) gains `dropNotes`, the drop answer's notes, trimmed.
  - `draftClose` (`:2974`) closes a dropped draft with ` <dropNotes, or "<Person> does not want this tracked."> No issue was opened.` That one change reaches `replyBody`'s decided branch, `describeOutcome`, the handoff line and `result.decided`.
  - The decided entry at `:4022` is overruled when its draft was dropped.
  - `settleHeld` carries `dropNotes` from the answer (`:3451`) and marks the entry overruled on `outcome.dropped` (`:3458`).
- **Test:** loop cases on `chosenScenario`, with the call answered "Mitigate" and then `deferrals: {'R1-2': answer('drop', {notes: why})}`.
  - The reply equals `Redline round 1: Defer the rewrite behind a guard. Applied in 2bbbbbb (redline: R1-2 fix). @author does not want this tracked: the client is replaced next quarter. No issue was opened. · decided by: @author`.
  - The handoff lists it under `### Overruled by @author (1)`, with no `### Put to @author`, and `decided` marks it overruled.
  - A drop with no notes says `@author does not want this tracked.`
  - At `deferAt: 'end'`, the held reply posted by `deferred replies r1` and the handoff line are the same.
  - Red: every case.
- **Docs:** `docs/running.md`, Deferred items, "What you can do with a draft" (`:129`): a drop of a deferral you chose keeps your decision and its commit, then your reason.

## Task 6: R4-4, each warning once

- **Change:** `result()` returns `warnings: unique(warnings)` (`workflows/redline-loop.js:2607`).
- **Test:** a loop case with a decline whose reason is `a follow-up PR` and `planBounce: 2`; the warning appears once. Red: three times.
- **Docs:** none needed; `warnings` (`skills/redline/SKILL.md:172`) already lists each line, and now does so once.

## Task 7: R4-5, a cited follow-up spec is not follow-up work

- **Change:** `FOLLOW_UP`'s first alternative becomes `\bfollow[- ]?up\b(?!\s+spec)` (`workflows/redline-loop.js:3143`).
- **Test:** the loop test's `stands` list gains `the #85 follow-up spec decided the point (its Decision 2)`. Red: it warns today.
- **Docs:** none needed; `docs/running.md:86` states the rule, not the word list.

## Task 8: R4-6, the decline rule's own phrasings warn

- **Change:** `FOLLOW_UP` gains `\b(?:another|a separate|a new|a later)\s+(?:pull request|PR|issue|change)\b` and `\bin an issue\b`. Every other alternative stays, the article-free `separate …` one included (shape.md, decision 13).
- **Test:** the loop test's `points` list gains four forms, each with the phrase its warning should quote: `belongs in another PR` (`another PR`), `worth a new issue` (`a new issue`), `leave it for a later change` (`a later change`) and `track it in an issue` (`in an issue`). R1-4 to R1-6's quoted matches take their article. Red: the four new forms are silent today.
- **Docs:** none needed, as in Task 7.

## Task 9: R4-7, the human summary names a nit-pass deferral and never calls it fixed

- **Change:** in `workflows/redline-loop.js`, the human-review block (`:4697-4706`) keeps `record: roundRecord` and `fixedIds: fix.fixed` on `nitPass`. `humanSummary` (`:4295-4305`) counts when the summary is written: "deferred" is the nit-pass items that were filed or are of kind `deferred`, and "fixed" is `fixedIds` without them. When nothing is deferred, today's sentences stand. Otherwise the sentence is `Final nit pass (Redline round N): K correctness item(s) in the fixes: ` followed by these clauses, each only when its count is not zero, joined with `; `:
  - `F fixed in one more pass that was not re-reviewed`
  - `<id> deferred to #n`, worded by `deferredTo`
  - `M not changed, answered in its thread` (or `their threads`)
- **Test:** a loop case: a human pass whose final nit pass defers one item with a mitigation. The summary names the id and `#301` and does not say `fixed in one more pass`. Red: today it says fixed and names neither.
- **Docs:** `docs/running.md`, A human review pass (`:245`): the summary also says where a nit-pass deferral went, and never calls a deferred item fixed.

## Task 10: Verification Gate

Run the nine commands of the Verification Gate (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then CONTRIBUTING's other three: `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .`, and a clean tree. After the last code commit, run CI's shellcheck command again; it prints nothing.

The remaining gate steps:

- **Docs (step 10):** each entry above names its commit or its reason.
- **Version (step 11):** 0.4.0, kept on purpose (shape.md, decision 4).
- **Standards retrospective (step 12):** list every decision, every As built deviation and every check that went red. Classify each against the standards and put the edits to the person; they are applied in their own commit. One lesson is known already (decision 7). It is proposed for `agent-os/standards/scripts/bash-conventions.md:38`: `checks.sh` does not run shellcheck, so a gate that passes locally can still push a warning CI fails on (#97, R1-3); until the gate runs it, run CI's command before a push that changes a `.sh` file.
- **Spec folder (step 13):** this plan's As built section, and any deviation under Decisions in `shape.md`.

## After the push: the seven replies

1. Confirm that `gh pr view 97 --json headRefOid` equals local HEAD.
2. Write `round-4-reply-R4-<k>.md` into `agent-os/specs/2026-11-16-1358-97-review-round-4/redline/`. R4-1's file is one line: `Redline round 4: fixed in <sha> (<subject>). · decided by: @michaelfromtheoutfit`. Each of R4-2 to R4-7 has:
   - `<!-- redline:R4-<k> -->`
   - `**R4-<k>** · <file and line, in backticks> · from the Redline round 4 review body`
   - a blank line
   - the same reply, as `round-3-reply-R3-4.md` does.
3. Post them. R4-1: `scripts/redline-gh.sh reply 97 4600544011 <file>`. R4-2 to R4-7: `scripts/redline-gh.sh comment 97 <file>`, one each. Then resolve R4-1's thread with `scripts/redline-gh.sh resolve-threads 97 4600544011 <reply id>`.
4. Check that `scripts/redline-gh.sh prior-findings 97` reads R4-1 to R4-7 as `fixed`.
5. @michaelfromtheoutfit commits the reply files as the record.

## As built

- **Before the first commit** (2026-11-17, shellcheck 0.11.0): CI's command printed one warning and exited 1.

  ```
  tests/gh-test.sh:461:112: warning: Don't use ls | grep. Use a glob or a for loop with a condition to allow non-alphanumeric filenames. [SC2010]
  ```
- **Task 2** (SC2010): `leftover <dir>` sits beside the other helpers in `tests/gh-test.sh`. Red: CI's shellcheck command, above. Green: that command prints nothing and exits 0. The helper prints `1` on a scratch folder holding `.redline-deferred.AbC123` and a record, and `0` on an empty one. `tests/gh-test.sh` under `/bin/bash` (3.2): 179 passed, 0 failed.
- **Task 3** (R4-1): both `gh` calls in `defer` exit 1 on failure and name the call. The fake gh reads `GH_FAKE_FAIL_CODE`. Red: 178 passed, 3 failed. The two new cases got `4 0 list no` and `4 0 no`, and the reworded failed-create case lacked the second line. Green: 181 passed, 0 failed, and shellcheck is clean. The header and `docs/scripts.md` are unchanged.
- **Task 4** (R4-2): the schema comment on `reason` now says a decline never points at follow-up work, which is a defer (#95), and names checkDeclineReasons as the check. It is a comment only, so there is no test. `node --check` passes, and the loop test shows 1293 checks passed, 0 failed.
- **Task 5** (R4-3): a decided outcome carries `dropNotes`, and `draftClose` gives the reason (or `<Person> does not want this tracked.`) before `No issue was opened.`. The decided entry is overruled when the draft was dropped, both in the round and in `settleHeld`. Five loop checks were added after `chosenOn`. Red: 1297 passed, 4 failed; the fifth, that the end-of-run scenario holds the draft, passed, as expected. Green: 1301 passed, 0 failed. Three mutations each turned one check red: settleHeld's overruled flag, the in-round overruled flag, and settleHeld's `dropNotes`. Docs: `docs/running.md`, Deferred items, "What you can do with a draft".
