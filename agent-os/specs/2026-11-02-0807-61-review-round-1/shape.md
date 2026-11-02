# PR #61 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #61 (head `bugfix/57-workflow-hands-back-one-placeholder-judgment-call-per-finding-when-the-shaper-writes-no-spec`, issues #57 and #60), two findings:

- **R1-2** (correctness, medium): a reshape after a decided ask fails the new `checkCalls` in `workflows/redline-loop.js`.
- **R1-1** (nit, low): the relaunch rule in `skills/redline/SKILL.md`, the "stopped before a result" section, the section 2 resume sentence and `README.md`'s relayed-line paragraph disagree about when a bare Redline command line relaunches a stopped run.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/`.

## Decisions

### R1-2: fix — the reshape check accepts what the round already decided

**Investigation.** `revise()` calls `checkCalls(shaped)` after the first shape (`workflows/redline-loop.js:2173`) and, new in this PR, after every reshape (`:2290`). `checkCalls` (`:1951-1962`) throws when an `ask` has no call and when a call's finding is not sorted `ask`. The reshape prompt (`reshapePrompt`, `:1172`) asks for "every judgment call still pending or newly raised". By the time a reshape runs, every call in `calls` has been decided (by the person at a hand-off, or by `settle()` on autopilot, `:2192-2209`) and written into `shape.md` by the resolve agent (`:2247-2253`). So a reshape that follows its prompt returns the decided ask's finding with no call, and `checkCalls` throws `the shaper marked R1-2 as ask but returned no judgment call for it` at stage `shape` with `resumeFrom` `reshape r1 #1`. A reshape that re-sorts the decided finding to match its decision (shaper rule 10: a `fix` has no call) but still lists the call hits the other branch. Before this PR, the reshape path checked neither: `raised` (`:2296`) looks only at calls the round has not seen, which is why both shapes worked. A resume reruns the same prompt, so it can fail the same way. The loop test's shaper mock (`tests/loop-test.mjs:115-140`) returns a call for every ask on every call, the reshape included, so section 14 never sees the shape the prompt asks for. The guard refuses `node` to the shaper, so the reviewer's scratch harness (`/tmp/redlinerepro/reviewer-r1-repro.mjs`) was read, not run. The code path is direct enough to confirm from reading.

**Proportionality.** Likelihood: a plan bounce after a decided ask in the same round. The approver's adjustment loop exists for bounces (`tests/loop-test.mjs:151-152` scripts them with `planBounce`), and asks are common, so a normal guided or autopilot run can reach this. Neither a bounce of this kind nor this failure has been observed yet: the check is new in this PR. (`agent-os/specs/2026-10-29-1614-51-review-round-1/shape.md`, lines 49 and 84, records #51 R1-3 the same way: a bounce that could happen and was not observed.) Impact: the run stops at `shape` after the person already answered, and a resume can stop again; on autopilot it stops with nobody watching. Cost: one function signature and one call site in `workflows/redline-loop.js` (about ten lines), four mock scenario keys and five scenarios in `tests/loop-test.mjs` (plan.md Task 2, steps 1 and 2), and one clause in `README.md`. All three files are already in the PR's diff, with no new dependency or abstraction. Proportionate: `fix`.

**The change.** `checkCalls(shaped, known = [])`: an `ask` whose id is in `known` needs no call, and a call whose id is in `known` is not checked against its finding's disposition. The first shape calls it as today (`known` empty, so section 14's existing checks are unchanged); the reshape passes the round's `calls`. A reshape's new ask without a call, or a new call for a non-ask, still stops at `shape`. The reshape prompt is left as it is: the reviewer's own proposed fix says only the script check makes it certain, and an unchanged prompt keeps every existing reshape check in the loop test intact.

Decided by: redline

### R1-1: fix — one wording for when a command line relaunches

**Investigation.** `skills/redline/SKILL.md:211` (the relaunch rule) allows a bare command line only "on a launch or a resume (section 2)" and is worded as "a turn whose user message is". `SKILL.md:171` ("stopped before a result") relaunches in the same session "under the relaunch rule (section 7: when the last typed line is neither `relaunch` nor a line holding only a Redline command, ask for `relaunch` first)", so it accepts a command line for a stopped run. `README.md:189` lists "a stopped run" among the cases that need `relaunch` typed. `SKILL.md:52` says every relaunch from a marker "starts from the line holding only the command the person typed ... nothing else is typed first". But the `handoff` and `reviewed` sections it hands on to (`SKILL.md:173-209`) collect typed answer-form lines and end at "Relaunch only from the word". The turn that sees a stopped run is the workflow's task notification, not a user message, so the rule's own wording forbids the relaunch section 171 describes.

**Proportionality.** A nit: three sentences, in two files already in the PR's diff. A skill that follows the rule or the README literally asks for `relaunch` after a stop even when the launch line is still the last typed one, and a headless session (the first stop that section names) cannot answer. `fix`.

**The change.** The rule names the in-session relaunch of a stopped run beside a launch and a resume, and speaks of the last typed line. The README's paragraph lists a stopped run under both lines. `SKILL.md:52` is limited to the `error` and `stopped` kinds, with `handoff` and `reviewed` pointing to their sections' word. See Unattended answers for the evidence that settles which reading is intended.

Decided by: redline

### Plan adjustment 1 (plan approver)

1. Task 4 and the proposed retrospective cited standards lines from this folder's `standards.md` compilation instead of the standards files. Corrected to the files' own lines, checked with `grep -n`: `agent-os/standards/workflow/agents.md` line 32, `agent-os/standards/testing/tests.md` line 7, `agent-os/standards/workflow/replay.md` line 17 (also in `references.md`).
2. R1-2's Proportionality paragraph misdescribed #51 R1-3 as a plan bounced repeatedly and counted three loop-test scenarios. Reworded to what that folder records (a bounce that could happen, not observed) and to the five scenarios and four mock keys plan.md Task 2 adds. Neither change alters a disposition.

Decided by: redline

### Standards retrospective

Proposed below; the standards approver approves the list and the implementer applies it in its own commit.

## Unattended answers

1. **Does a bare command line relaunch a stopped run in its own session, or must the person type `relaunch`? (R1-1)** Answered by the original spec. `agent-os/specs/2026-11-02-0744-57-60-relaunch-path-spec-check-and-relay/plan.md`, Task 5, item 5: "A resume and a stopped-run relaunch start from the command line, which the rule accepts; 'stopped before a result' adds: when the last typed line is neither the word nor a command line, ask for `relaunch` first." Its `shape.md`, decision 5: "`relaunch`, and a line holding only a Redline command also passes, so a first launch and an error resume stay as they are". So a stopped run takes either line. The rule at `SKILL.md:211` and the README's list are what disagree with the spec, and they are the fix.
   Decided by: redline
2. **Is the rule's object the turn's user message or the last typed line? (R1-1)** Answered by the original spec's `shape.md` line 8: "the relaunch happens only when `relaunch` is the last typed line", and by the rule's own second sentence: "The harness relays the person's last typed message verbatim to every agent". The relayed line is what the rule guards, so "the last typed line" is the wording, which also covers the notification turn of a stopped run.
   Decided by: redline
3. **Is the reshape meant to return a decided call? (R1-2)** Answered by the prompt itself: `reshapePrompt` (`workflows/redline-loop.js:1172`) asks for "every judgment call still pending or newly raised", and the script's own comment at `:2294-2295` reads the reshape's calls only for "A call the reshape raised that this round has not seen". A decided call is neither pending nor new, so its absence is the prompted shape, and the check is what disagrees.
   Decided by: redline
4. **Scope, visuals, references, product context.** Scope is the two findings. No visuals. References are listed under Context. Product context: `agent-os/product/mission.md`, "Decisions stay with people. A finding that needs a product or design decision is returned to the author in their session, never decided by an agent". R1-2 keeps a decision the person already made from stopping the run; neither fix changes who decides.
   Decided by: redline
5. **Known already?** `scripts/redline-gh.sh issues-search reshape` and `issues-search relaunch` list only #60, #57 and #14 as open. #57 and #60 are this PR's own issues, and neither mentions the reshape check or the stopped-run wording. This is the PR's first Redline round, so no earlier round folder holds a disposition. Both findings are new.
   Decided by: redline

## Context

- **Visuals:** None
- **References:** `workflows/redline-loop.js` (`checkCalls`, `revise`, `reshapePrompt`, `forceAskRules`), `tests/loop-test.mjs` (shaper and plan-approver mocks, section 14), `skills/redline/SKILL.md` (sections 2 and 7), `README.md` (Launching), the original spec folder, the reviewer's scratch harness. See `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Decisions stay with people": a person's answer must not be what stops the run.

## Standards Applied

- workflow/agents — the bullet on the workflow checking a result before acting on it (#57) is the rule R1-2 refines; every decision names its owner
- workflow/replay — the relaunch rule's two lines (#60) are what R1-1 words consistently; the reshape runs after the stopping point, so changing its check moves no replayed prompt
- testing/tests — red before green; a loop-test mock answers as the real agent would; a tested surface gains a case with a neighbouring case that must not change
- process/docs-gate — each touched plugin file names its README section
- process/standards-retrospective — the proposed list below
- prompts/attribution — no model or vendor name in commits or spec files

## Standards retrospective (proposed)

1. **Contradicting** `agent-os/standards/workflow/agents.md`, line 32, which reads "an `ask` must have its judgment call". After R1-2, a reshape's ask that the round already decided needs none. Proposed wording: replace "an `ask` must have its judgment call" with "an `ask` must have its judgment call, except, on a reshape, one the round already decided, since the reshape returns only the calls still pending or newly raised (#61, R1-2)".
2. **Missing instance** in `agent-os/standards/testing/tests.md`, line 7 ("A loop-test mock answers as the real agent would for the run's settings"). Proposed addition at the end of that bullet: "; a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2)".
3. **R1-1: already in a standard.** `agent-os/standards/workflow/replay.md`, line 17, says the skill relaunches only from `relaunch` typed alone or a line holding only a Redline command. The fix makes the skill and the README agree with it, so no change.
