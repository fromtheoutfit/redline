# PR #97 Review Round 4, Fixed by Hand — Shaping Notes

## Scope

Redline's run on PR #97 (#95) stopped at its round cap after round 4, with round 4's seven findings undecided, and CI's shellcheck job is red. This spec fixes the seven findings as the review proposes and fixes the shellcheck warning. It changes nothing else. The brief is the record in `agent-os/specs/2026-11-16-1358-97-review-round-4/redline/` (`round-4-findings.json`, `round-4-review.json`, `cap-hit.md`). That folder has no `shape.md`, because the run stopped before shaping.

- **R4-1** (nit, `scripts/redline-gh.sh:128`): the `defer` header says a failed lookup or create exits 1, but under `set -e` the script exits with gh's own status (4 when authentication is required).
- **R4-2** (nit, `workflows/redline-loop.js:848`): the shape schema's comment on `reason` still says a decline names where the finding belongs, which #95 forbids, and it names the wrong check.
- **R4-3** (correctness, low, `workflows/redline-loop.js:2942`): when the person drops the draft of a deferral they chose themselves, their reason for the drop is lost, and the item is not listed under Overruled.
- **R4-4** (nit, `workflows/redline-loop.js:3138`): the follow-up warning is pushed again on every reshape that keeps the same decline.
- **R4-5** (nit, `workflows/redline-loop.js:3143`): `FOLLOW_UP` flags a decline that cites a spec named "the … follow-up spec".
- **R4-6** (correctness, low, `workflows/redline-loop.js:3143`): `FOLLOW_UP` misses the phrasings the decline rule names (another PR, an issue, a later change).
- **R4-7** (correctness, low, `workflows/redline-loop.js:4278`): a human review pass's summary leaves out what its final nit pass deferred, and counts a mitigated deferral as fixed.
- **Shellcheck:** `tests/gh-test.sh:461:112`, SC2010 (`ls | grep`), added by R1-3 (`4430429`). CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, reports it and nothing else (shellcheck 0.11.0, 2026-11-17).

The code lines the review cites have not moved since `2b1fcb7`; `82ffcee` added only record files.

## Decisions

Decisions 1 to 10 are @michaelfromtheoutfit's, given with the request or answered while shaping. Decisions 11 to 14 were made while shaping, from the code.

1. **All seven findings are fixed as the review proposes.** That is R4-3, R4-6 and R4-7 (correctness, low) and R4-1, R4-2, R4-4 and R4-5 (nits). Each proposed fix names its test; the test is written first and seen red. R4-2 changes a comment only, so it has no test.
2. **R4-6 widens `FOLLOW_UP` as proposed and no further.** Reading free text for a rule is #100's subject for the mitigation field. It is not redesigned here.
3. **The shellcheck failure is fixed with a glob count**, the way `tests/setup-test.sh` does since `f3445a6`. CI's own command runs before the first commit and after the last, and anything else it reports in a file this pull request changed is fixed too.
4. **The version stays 0.4.0.** This is the same pull request.
5. **`scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.** If a fix seems to need either, the build stops and asks.
6. **No AI attribution anywhere, and this spec opens no issue.**
7. **The standards retrospective runs as usual.** One lesson is already known: a gate that cannot run shellcheck locally lets a round push a warning CI then fails on.
8. **(a) R4-3's form: the reason comes before the close.** A dropped draft of a deferral the person chose reads: the call's decision sentence, `Applied in <sha> (...)` (or `No code change.`), the drop's restatement, then `No issue was opened.` The handoff lists it under `### Overruled by @login`, not `### Put to @login`. A drop with no reason says `@login does not want this tracked.`, as a drop of Redline's own deferral does. This keeps the form R2-7's decline settled (the decision sentence, its `Applied in`, and the `No issue was opened.` close; `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md`, decision 11) and adds what R2-7 did not cover: the reason. In the round, the reply posts at `push and reply`. At the end of the run, the same text posts at `deferred replies` after the end stop. The handoff line is the same in both cases.
9. **(b) The seven findings are answered on PR #97 in Redline's own form, after the push.** R4-1 is answered in its thread (review comment 4600544011), and the thread is then resolved. R4-2 to R4-7 sit in the round 4 review body (no thread; GitHub's files listing omits `workflows/redline-loop.js`'s patch, #96), so each gets an issue comment that opens `<!-- redline:R4-<k> -->`. Each reply says `fixed in <sha> (<subject>). · decided by: @michaelfromtheoutfit`. `redline-gh.sh prior-findings` reads a finding as settled only from such a reply, so a single summary comment would have left all seven to be carried into a later run.
10. **(c) The gate does not run shellcheck in this spec; that is its own issue, which @michaelfromtheoutfit opens.** A check in `scripts/checks-template.sh` changes what a setup rerun writes, so it needs a minor bump and a new template marker, which decision 4 rules out. A check in this repository's `checks.json` changes the gate's backticked text and every "nine commands" line. And "when installed" passes silently on a machine without shellcheck, which is the gap this check would close. The draft is under "For you to open" below.
11. **R4-1: the documented exit holds.** The review offered two fixes: reword the header, or guard the calls. This spec guards both `gh` calls in `defer`, with `|| { echo 'redline-gh.sh: the lookup on GitHub failed' >&2; exit 1; }` and the same for the create, so the header and `docs/scripts.md` (which quotes it) stay true as written. gh's own error line still comes first on stderr, and the existing failed-create case gains the second line.
12. **R4-4: warnings are de-duplicated once, in `result()`.** `warnings: unique(warnings)` (`unique`, `workflows/redline-loop.js:459`). This covers every check in vetShape that warns, which the finding says share the problem, and it needs no helper at each push. Warnings from different rounds never collide, since each starts with its pass's name.
13. **R4-6: nothing that warns today stops warning.** The proposal's two alternatives are added, and the old article-free `\bseparate (?:issue|pull request|PR)\b` is kept. Without it, the proposal's regex would stop matching "the separate issue". A regex reports its leftmost match, so the three existing cases that say "a separate …" now quote the phrase with its article (`a separate issue`, `a separate pull request`, `a separate PR`), and those three test expectations move.
14. **R4-7: a nit pass's deferrals are named in its own sentence.** The nit-pass sentence is the one place that counts the pass's items, so it is where they go: `Final nit pass (Redline round N): K correctness item(s) in the fixes: <F fixed in one more pass that was not re-reviewed>; <id deferred to #n>; <M not changed, answered in its thread>`, each clause only when its count is not zero. When the nit pass deferred nothing, today's three sentences stay as they are. The counts are read when the summary is written, after `settleHeld`, so a draft held to the end is counted where it went. `lastFixUnreviewed` still counts a mitigation's commit, since that commit is unreviewed code.

### Proportionality

- **R4-3.** It fires on a guided run when the person defers at a call and then drops the draft. Their reason for not tracking the work is posted nowhere, and the handoff lists the item as put to them, not overruled. Three texts promise the opposite: `skills/redline/SKILL.md:224`, `#95`'s `plan.md` decision 14c and its line 146. The fix is one field on the decided outcome, one clause in `draftClose`, and the overruled flag in two places, all in `workflows/redline-loop.js`. It is in proportion.
- **R4-6.** The warning is advisory, and the plan approver's bounce still applies, so the harm is a missed warning. The fix is one regex and four test reasons. It is in proportion, and decision 2 bounds it.
- **R4-7.** It fires on a human review pass whose final nit pass defers an item. The one summary that replaces the handoff never says where the item went, and it calls a mitigated deferral fixed. The fix is in `humanSummary` and the block that calls it. It is in proportion.

### Noted, not in scope

- The Redline run's own handoff (`handoffComment`, `final.fixed`) counts a final nit pass's mitigated deferral as fixed in the same way, as the comment above revise's `fixed` says ("R2-12, deferred"). R4-7 names the human summary only, so the handoff is left as it is.

## For you to open

This is the drafted issue for decision 10. This spec does not open it (decision 6).

**Title:** Run shellcheck in the gate when it is installed, so a round never pushes a warning CI fails on

**What was found:** PR #97's round 1 fix for R1-3 (`4430429`) added `ls -A … | grep -c` to `tests/gh-test.sh`, which shellcheck reports as SC2010. `.claude/redline/checks.sh` does not run shellcheck, so the round's gate passed on the implementer's machine, the round pushed, and CI's required shellcheck job went red after the push. Three more rounds pushed on top of the red job before the run reached its cap.

**Why it is not fixed in #97:** A check in `scripts/checks-template.sh` changes what a setup rerun writes, so it bumps the minor version and the template marker, and #97 keeps 0.4.0. A check in this repository's `.claude/redline/checks.json` alone changes the Verification Gate's backticked text, so it needs a restamp, and every "nine commands" line moves with it.

**Proposed fix:** Add a check that runs CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, when shellcheck is on PATH. When shellcheck is missing, the check should say so in its result (`skipped: shellcheck not installed`) rather than pass silently. Decide whether the check belongs in the template, so every repository gets it on its next setup rerun, or only in this repository's `checks.json`. Either way, regenerate `checks.sh`, restamp the gate, and move each "nine commands" line.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A. There is no `agent-os/product/` folder.

## Standards Applied

- process/docs-gate — every touched plugin file names its README or docs section, or says why there is no reader-facing change.
- process/standards-retrospective — the gate's step 12, with the shellcheck lesson already known (decision 7).
- process/release — the version stays 0.4.0 on purpose (decision 4).
- prompts/attribution — the commits, the spec and the seven replies carry no model or vendor name (decision 6).
- scripts/bash-conventions — R4-1's guards and the shellcheck fix; bash 3.2 and BSD tools; shellcheck at warning.
- testing/tests — red before green; gh-test's fake gh; loop-test scenarios.
- workflow/agents — decline reasons never point at follow-up work; a decision names its owner; an outcome that changes after its round rewrites its decided entry.
- workflow/replay — R4-3's drop restatement enters the outcome text only after the stop that asked for it.
