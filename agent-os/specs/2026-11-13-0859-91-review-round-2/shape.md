# PR #91 review round 2: say the pinned relaunch's prompt is expected, not measured: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 2 on PR #91 (issue #81), and nothing more. The round reviewed the fix diff `1c96b8c..ff3f8d5`; `ff3f8d5` is the working tree's HEAD and the PR ref's head. Line numbers here are at that commit. This is the final nit round: the round has no correctness finding.

- **R2-1** (nit, low, confirmed): `docs/running.md:84`. In "Hand-off and relaunch", the bullet "The workflow file changed" says that in bypass-permissions "the relaunch runs with no prompt". The skill's spoken line at `skills/redline/SKILL.md:223` says "In bypass-permissions, which is how the plugin reviews itself, there is no prompt". The #81 spec records that case as not measured. README "Known limits" (line 104) lists as unmeasured only whether the relaunch asks exactly once outside bypass-permissions.

The review's five For the person entries are not findings and are not in scope. They are the reviewer's notes for the author: the Finish read's trust in `round`, which files `run drift` reports, the `scriptPath` fallback, the "Run markers and resume" section, and a human-pass Finish case. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules.

## Decisions

1. **R2-1: fix, three one-clause rewordings, one per file.** Each states the relaunch's prompt behaviour as expected and says it is not measured yet. Each covers both cases the #81 spec lists as unmeasured: no prompt in bypass-permissions, and one prompt per relaunch in any other mode (Unattended answer 3).
   - `docs/running.md:84`, "Hand-off and relaunch", the bullet "The workflow file changed": "the relaunch is expected to run with no prompt, and in any other mode Claude Code is expected to ask once per relaunch to review the script, but neither has been measured yet: only the headless denial below was (#81)."
   - `skills/redline/SKILL.md:223`, section 7, the `scriptPath` line the skill says: "it is expected to run with no prompt, and in any other mode Claude Code is expected to ask once per relaunch to review the script, where approving it relaunches; neither has been measured yet." It stays one line.
   - `README.md:104`, Known limits, the second unmeasured item: "whether a relaunch from the pinned script runs with no prompt in bypass-permissions and asks exactly once in any other mode (#81)."

   This is the reviewer's proposed fix, with one change: the rewording also hedges the other-mode half of the same sentence, so that half does not read as measured by contrast. No harness reads these three files, so the change has no test (Unattended answer 5). Plan Task 2.
   Decided by: redline
2. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.4`, and `main` reads `0.2.3` (`git show main:.claude-plugin/plugin.json`). So this PR already carries its bump. This round changes no file a setup rerun writes: no template, no allow entry, nothing in `scripts/checks-template.sh` and nothing in the unattended section (`process/release`, first bullet).
   Decided by: redline
3. **Docs.** `skills/redline/SKILL.md` is the only touched file under a gate step 10 directory. Its entry names `docs/running.md`, "Hand-off and relaunch", the bullet "The workflow file changed", and README "Known limits", the bullet "A self-review that edits an agent file runs its later rounds under the edit". Both are updated in Task 2's commit. `docs/running.md` and `README.md` are reader-facing by nature and need no entry of their own (`process/docs-gate` lines 5 and 16).
   - Every statement of the claim was searched for in `README.md`, `CONTRIBUTING.md`, `docs/`, `skills/`, `agents/`, `scripts/`, `workflows/`, `tests/`, `templates/`, `agent-os/standards/` and `agent-os/product/`, with `grep -i` for "bypass", "no prompt", "asks once", "once per relaunch", "not measured", "pinned" and "scriptPath".
   - The hits are the three lines above. `docs/running.md:30` names bypass-permissions as the remedy for #76's refused writes and for the coverage pass's prompt, not for the relaunch. `docs/guard.md:178` only points at running.md.
   - `agent-os/standards/workflow/replay.md:19` says only that the allow rule does not cover a `scriptPath` launch, "Measured headless under `--plugin-dir` on 2.1.322 (#81)", which is accurate.

   No config key, subcommand, allow rule or exit code is added.
   Decided by: redline
4. **Nothing under `workflows/` or `agents/` is committed this round.** Task 2 changes two docs files and the skill. So this run's next relaunch, if any, still goes by name, as at every relaunch so far (`git diff --stat 1c96b8c HEAD -- workflows/ agents/` prints nothing). The `skills/redline/SKILL.md` edit takes effect only in a new session; the running session keeps the line it loaded.
   Decided by: redline

### Proportionality

R2-1 is a nit, not a correctness finding, so the rule does not bind it. Recorded all the same:

- **Likelihood and visibility.** A person running a self-review hits it at the first relaunch after a round commits `workflows/redline-loop.js`. That has not happened in this run yet (Unattended answer 1). If bypass-permissions does prompt or deny, the docs promised otherwise. The run itself is unharmed: the skill's denial branch already stops with a line, and the marker stays.
- **Cost of the fix.** Three files, all in the PR's diff, one line each. There is no new dependency, service, abstraction or test, and no harness reads any of them.

## Unattended answers

1. **Is R2-1 real, and is the bypass case still unmeasured?** Yes, on all four sources.
   - The #81 spec's "Unmeasured", second bullet (`agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/shape.md:81`): "Whether a `scriptPath` relaunch raises exactly one permission prompt in an interactive session, and none in bypass-permissions. Only the headless denial was measured."
   - The #81 plan's "Unmeasured, recorded as such" (`plan.md:27`), with the same two cases. Its "How this PR's own Redline review should be run" (`plan.md:134`) says "there should be no permission prompt. A prompt or a denial there is the answer to the unmeasured bypass fact".
   - The PR description, "Not measured yet": "whether a relaunch by `scriptPath` prompts exactly once in an interactive session, and not at all in bypass-permissions. Only the headless denial was measured."
   - Round 1's Decision 4 (`agent-os/specs/2026-11-13-0859-91-review-round-1/shape.md:31`): "whether that prompts in bypass-permissions is still unmeasured".
   - This run has made no `scriptPath` relaunch since: `git diff --stat 1c96b8c HEAD -- workflows/ agents/` prints nothing, so `run drift` has had nothing to pin.

   The docs disagree with that answer, and the disagreement is the fix. The reviewer marked the finding `needsDecision: false`.
   Decided by: redline
2. **Does the #81 spec's decision 4 rider settle the wording?** No, it is kept. The rider (`shape.md:39`) asks that "`docs/running.md` and the skill's line say that a self-review in bypass-permissions ... relaunches by `scriptPath` with no prompt, and that in other modes the person sees one prompt per relaunch". The rewording still says both, as what is expected. The same spec's Unmeasured section and the PR description ("it should run with no prompt; in other modes the person should see one prompt per relaunch") give the qualifier. No assumption of the original spec changes, so this is no question for the person.
   Decided by: redline
3. **Why hedge the other-mode half too, when the finding names bypass?** It is in the same sentence, and every source the answer rests on lists the two cases together: the #81 spec's Unmeasured bullet, the #81 plan's bullet, the PR description's "Not measured yet", and the finding's own README rewording. README Known limits already lists the outside-bypass case as unmeasured. A sentence that hedged only bypass would read the other half, by contrast, as measured. That other half is the disagreement this finding is about, in the same line, and costs no extra file.
   Decided by: redline
4. **Is R2-1 already tracked?** No.
   - `scripts/redline-gh.sh issues-search` for "bypass-permissions", "scriptPath prompt" and "unmeasured" finds no open issue.
   - The PR ref holds one earlier review-round folder, round 1 (`git ls-tree -d --name-only origin/<head> agent-os/specs/`). Its review and findings never mention bypass (`grep -c -i bypass` prints `0` on both).
   Decided by: redline
5. **Does the change need a test?** No. No harness reads `README.md`, `docs/running.md` or `skills/redline/SKILL.md` (`grep -n` for those names in the seven harnesses prints nothing), so none of the three is a tested surface (`testing/tests` line 23). The proof is the greps in Task 2, which pin each old phrase gone and each new one present. The gate's counts stay as round 1 left them.
   Decided by: redline
6. **Visuals, references, product context.**
   - **Visuals:** none.
   - **References:** see `references.md`.
   - **Product context:** `agent-os/product/mission.md`, "Honest about its reach" (line 17). A doc that states an unmeasured behaviour as fact is the same overreach on a smaller scale. No conflict, no mission edit.
   Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach" (Unattended answer 6).
- **The PR description, noted for the person, not a task.** "Permission prompt" already says "it should run with no prompt", and "Not measured yet" already lists both cases. This round makes the docs agree with it, so the description needs no change for R2-1.
- **The #81 spec's Unmeasured section, noted for the person, not a task.** It says this PR's self-review "is where the bypass case gets its first real test; what it shows is recorded here". No `scriptPath` relaunch has happened in this run, so there is nothing to record yet. When one happens, the docs' "expected" wording and README's Known limits item are what to change.
- **Run caution (#81).** Task 2 commits nothing under `workflows/` or `agents/`, so this run's next relaunch, if any, still goes by name.

## Standards Applied

- `process/docs-gate`: lines 5 and 16 (Decision 3); line 15's search-every-statement practice, applied to a claim, not to the done rule (Decision 3); line 17, the nearest rule, for the retrospective's item 1.
- `process/release`: line 5, no version change this round (Decision 2).
- `testing/tests`: line 23, a tested surface gains a case. None is touched here (Unattended answer 5).
- `workflow/replay`: line 19, what the probes measured, for Unattended answer 1.
- `scripts/guard`: lines 6 and 20. Every command the plan gives the implementer is a plain pipeline, with no `$`, no backticks outside single quotes, no process substitution and no interpreter.
- `process/standards-retrospective`: the proposed list below.
- `prompts/attribution`: no model or vendor name in the spec, the docs or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above.

1. **Decision 1 and Unattended answers 1 to 3 (R2-1): missing. One bullet added to `agent-os/standards/process/docs-gate.md` after line 17, its last line.** Line 17 asks that a cost a spec's renderer Evidence records be named in Known limits. No line says that a behaviour a spec records as unmeasured is written as unmeasured wherever the docs state it. Drafted:

   > - A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it: the #81 spec recorded a pinned relaunch's permission prompt as unmeasured both in bypass-permissions and outside it, and `docs/running.md` and the skill's spoken line stated both as fact while Known limits listed only the second, until #91, R2-1

2. **Decision 2 (version): already in a standard.** `agent-os/standards/process/release.md`, line 5.
3. **Decision 3 (Docs): already in a standard.** `process/docs-gate.md` lines 5, 15 and 16.
4. **Decision 4 (no workflow commit): already in a standard.** `workflow/replay.md` line 19 records the pin, and this is a choice for this self-review run.
5. **Unattended answers 4, 5 and 6: no standard item.** Each is evidence for a decision above. Answer 5 applies `testing/tests.md` line 23 as written.
6. **No pattern invented.** Everything the plan uses is in `agent-os/standards/`.

If the standards approver does not approve item 1, the implementer records "Standards retrospective: no changes" under Decisions here at the gate.
