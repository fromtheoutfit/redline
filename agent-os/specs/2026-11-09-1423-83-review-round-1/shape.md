# PR #83 review round 1: where the inline-session warning is said, its wording, and the spec's record: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The six findings of Redline round 1 on PR #83 (issue #76, the launch warning for a session that loads the plugin from a directory), and nothing more:

- R1-4 (correctness, low): on a resume the warning comes after the person's last chance to act on it.
- R1-6 (correctness, medium, `needsDecision`): the warning recommends bypass-permissions without saying it removes the coverage pass's stated safety.
- R1-1 (nit, low): the inserted sentences change what "reviewed without it" refers to in `CONTRIBUTING.md`.
- R1-2 (nit, low): the #76 spec's As built is stale against the branch and the PR body.
- R1-3 (nit, low, `needsDecision`): the approved standards edit did not land in its own commit.
- R1-5 (nit, low): the hand-off exemption inside the Resume bullet contradicts it for `handoff` and `reviewed` markers.

Line numbers below are at `00b04f3`, the PR head this round reviewed. The `redline/` subfolder is Redline's own record and is untouched.

## Decisions

1. **R1-1: fix.** "reviewed without it" becomes "reviewed without `--plugin-dir`" (`CONTRIBUTING.md:7`). The #16 warning fires when a self-hosted session is not on `--plugin-dir` (`skills/redline/SKILL.md:86`), so the sentence as it now reads says the opposite. Plan Task 2.
   Decided by: redline
2. **R1-2: fix.** As built says Task 3 waits and the inline session was not walked (`agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/plan.md:87,91`). Commit `00b04f3` added the `#83` line (`CHANGELOG.md:13`), and the PR description records the walk (Unattended answer 4). The resume path and the installed-release session stay not walked. Line 84 is left for R1-3. Plan Task 3.
   Decided by: redline
3. **R1-4: fix.** The Inline session paragraph is said before the Resume or Start fresh question, under its condition, and comes out of the exit-0 sequence. Saying it there also reaches a headless resume and a `run check` that stops at exit 1, at the cost of a line. A Start fresh would otherwise hear it twice, since section 4 says it again, so the paragraph gains one sentence saying it is not said twice. The sentence claims only what is certain: the person can leave the question, change the mode and type the command again, and leaving the question changes nothing, since the marker is rewritten only by the next stop (`skills/redline/SKILL.md:53`). Whether Claude Code lets a person change the mode while the question is open was not checked, so the text does not rely on it. Plan Task 5.
   Decided by: redline
4. **R1-5: fix.** The clause "a relaunch after a hand-off does not repeat it" is deleted (Unattended answer 6). Plan Task 4.
   Decided by: redline
5. **This round keeps the version on purpose.** `0.2.0` is undated and untagged (`git tag --list` prints only `redline--v0.1.0`; `CHANGELOG.md:5`), and the #76 spec keeps the version on purpose (`agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md:16`), the exception `agent-os/standards/process/release.md:5` names. No fix changes what a setup rerun writes. `CHANGELOG.md` already carries the PR's `#83` line and gains none.
   Decided by: redline
6. **Task order: R1-5 before R1-4.** The unattended section asks for finding order, but R1-5's clause sits inside the sentence R1-4 moves. Taking the clause out first gives each finding a commit of its own, which is what "one commit per finding" in `agents/redline-implementer.md:18` needs.
   Decided by: redline
7. **R1-6: The launch warning offers bypass-permissions without saying what it removes. Decided: Keep it and state the cost.** Plan Task 6; the standards half is retrospective items 2 and 5.
   Story, as returned: Someone working on Redline itself starts a session with `claude --plugin-dir`, reads the new warning and switches to bypass-permissions, because it is offered as an equal remedy. The run's coverage pass then reads the pull request's text in a fork the guard does not vet. Until now, the permission prompt that fires when that fork tries to post a review, reply or resolve threads was its backstop (README Known limits; #80, R2-5). In bypass-permissions that prompt is gone, so text in a PR that steers the fork could post on GitHub with nobody asked. This is the first place Redline tells a person to use that mode. The other side: accept-edits needs someone present to approve each prompt, so dropping bypass-permissions leaves a headless inline session with no stated remedy.
   Options, as returned:
   - Keep it and state the cost. Cost: one sentence each in `skills/redline/SKILL.md`, `docs/running.md`, `CONTRIBUTING.md` and the README's Known limits bullet. Effect: both remedies stay, and the person choosing bypass-permissions learns that it removes the coverage pass's prompt and that a fresh launch with coverage off runs without the pass (a resume ignores that word).
   - Drop bypass-permissions. Cost: the same four files; the sentences name only accept-edits and the README says why. Effect: Redline never recommends the mode, and a headless inline session has no stated remedy for the auto-mode refusals.
   - Leave the sentences as they are. Cost: none. Effect: the warning keeps offering the mode as an equal remedy, while the README still names the permission prompt as the coverage pass's safety.
   Recommendation, as returned: Keep it and state the cost: it is the only remedy for an unattended inline session, and one sentence makes the trade visible at the moment the person chooses.
   The author keeps bypass-permissions as a remedy and has the skill, docs/running.md, CONTRIBUTING.md and the README's Known limits state that it removes the coverage pass's permission prompt, the one check the guard cannot provide, and that a fresh launch with coverage off runs without the pass, because it is the only remedy for an unattended inline session; the probe clause in agent-os/standards/process/release.md also records PR #83 round 1, an inline session in bypass-permissions on 2026-11-09, as the session confirming that remedy, the review having posted with no prompt and no refusal.
   Date: 2026-11-09
   Decided by: @michaelfromtheoutfit
8. **R1-3: The standards edit landed in the same commit as the code. Decided: Keep the history and record the deviation.** Plan Task 7.
   Story, as returned: The standards bullet this PR adds landed in `4edbbb7` beside the skill, the docs and the spec folder, though `CLAUDE.md`, the gate and this PR's own spec say it goes in its own commit, and the spec says it was built with no deviation. Merges here keep their commits, so the lump stays on main and the spec's record is wrong. Making the history match means you split the commit by hand and force-push once this run is over: no Redline role may rewrite history, and a hand commit on this repository means a fresh run rather than a resume. It also changes the commit ids this round's replies name. Alternatively the history stays and the spec says so.
   Options, as returned:
   - Split `4edbbb7` by hand. Cost: a rebase and force-push by you after the run; every later commit id on the branch changes, including those named in this round's replies. Effect: the standards bullet stands alone in the history and the spec's statement becomes true.
   - Keep the history and record the deviation. Cost: one Decision in the #76 spec's `shape.md`, a corrected line 33 there, and a corrected As built line in its `plan.md`. Effect: the commit stays combined on main, and the spec states what happened instead of claiming otherwise.
   Recommendation, as returned: Keep the history and record the deviation: two lines of record against a force-push for the sake of one bullet's separation.
   The author keeps commit 4edbbb7 combined and has the #76 spec record that the standards edit landed with the code rather than in its own commit, in a Decision in its shape.md and corrected lines in shape.md and the As built of plan.md, because two lines of accurate record cost far less than a force-push that would change every later commit id on the branch for the sake of one bullet's separation.
   Date: 2026-11-09
   Decided by: @michaelfromtheoutfit

### Proportionality (correctness findings)

| Finding | Likelihood and visibility | What it costs | Verdict |
| --- | --- | --- | --- |
| R1-4 | Needs an inline session (the plugin's own self-review, in practice), auto mode and a stopped run that is resumed; not observed yet. Traced: the paragraph is said after the question (`skills/redline/SKILL.md:47`) and after `run check` exits 0 (`49`), and an `error` or `stopped` resume relaunches in that turn (`50`, `52`, `53`). When it fires, the same post is refused again and the person resumes a second time. Nothing is lost. | One sentence moved and one added, in one file, inside the PR's diff. No new dependency or abstraction. | fix |
| R1-6 | Needs a person who picks bypass-permissions on the warning's advice and a coverage fork that runs a write subcommand, which the skill's read-only recipe did not do in the spike or either corpus run (`docs/running.md:56`); the reachable route is text in the PR under review steering the fork. Traced: a `redline-gh.sh` write from the fork is left to the session's permission prompt (`README.md:101`; `agent-os/standards/scripts/guard.md:23`). In bypass-permissions there is no prompt to leave it to. When it fires, a post, reply or thread resolve reaches GitHub unasked. | Four files, one sentence each, whichever way it goes. | ask (which remedy Redline recommends is the person's) |

## Unattended answers

1. **Visuals:** none; this is a skill's prose, two documents and a spec record.
   Decided by: redline
2. **Product context:** "Honest about its reach" (`agent-os/product/mission.md:17`), the same alignment as the #76 spec; no conflict. R1-6 is the one finding that touches it, and the person decided it (Decision 7).
   Decided by: redline
3. **Known-finding check.** `scripts/redline-gh.sh issues-search "bypass-permissions"` and `issues-search "permission"` list only #76. `issues-search "resume"` lists #69, #77 and #81, none about when the warning is said. This is the PR's first round, so no earlier round has dispositioned anything. The two files under `/tmp/redlinerepro/` (`reviewer-r1-ReproTest.php`, `reviewer-r1-repro.mjs`) are left from runs on other pull requests and hold nothing for this round; no scratch test was written.
   Decided by: redline
4. **R1-2: was the inline walk done?** Yes. The PR description: "Walked: `/redline:redline 80 dry run review only` from this checkout under `claudeline` shows the warning at precheck step 1 and stops at the branch check." The same description says the installed-release walk comes "after the 0.2.0 tag". As built disagrees with it, so As built is the fix (Decision 2).
   Decided by: redline
5. **R1-4: why does a resume warn at all?** The #76 spec answers it (`agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md:21`): "someone resuming in auto mode would hit the same refusal unwarned". The code warns at a point where the person cannot act before the relaunch, so that person still hits the refusal. The placement is the fix (Decision 3).
   Decided by: redline
6. **R1-5: does the #76 spec need the hand-off exemption in this bullet?** No. Its decision 6 reads "A hand-off relaunch stays silent: same session, already said" (`shape.md:21`), and that is a section 7 relaunch: it starts from the word `relaunch` (`skills/redline/SKILL.md:212-214`) and never reaches section 2. Section 4's heading says "fresh launches only" and its first line says "Skip this on a relaunch after a hand-off" (`81`, `83`), so that relaunch stays silent with no clause. A `handoff` or `reviewed` marker reached through section 2, typed in the same session or after `claude --resume`, is a resume, which `docs/running.md:30` promises a warning. The clause reads as an exception for that marker, and that disagreement is the fix (Decision 4).
   Decided by: redline
7. **R1-6: does the question arise?** Yes, and nothing answers it. The #76 spec's core sentence names bypass-permissions (`plan.md:48`) and never weighs it against the coverage pass. The README's Known limits say the pass's safety is "the skill's own read-only recipe ... and the session's permission mode" (`README.md:101`). The PR description does not mention the mode's cost. Accept-edits needs someone to approve each prompt, so it does not cover a headless inline session, which is why dropping bypass-permissions has a cost too. `coverage off` is a launch word and a resume ignores it (`skills/redline/SKILL.md:49`), so any sentence naming it says "a fresh launch", as `docs/running.md:54` does.
   Unanswered by the shaper; returned as judgment call R1-6 and decided by the person (Decision 7).
8. **R1-3: does the question arise?** Yes. `git show --stat 4edbbb7` lists `agent-os/standards/process/release.md` beside `skills/redline/SKILL.md`, `docs/running.md`, `CONTRIBUTING.md` and the spec folder, and the PR's two commits are that one and `00b04f3`. The #76 spec says otherwise (`plan.md:79`, `plan.md:84`, `shape.md:33`), and the rule is in `CLAUDE.md` and gate step 12. Whether to rewrite reviewed history for one bullet is the person's: no Redline role may rewrite history (`agents/redline-implementer.md:26`), and any hand commit on this repository means a fresh run rather than a resume (`skills/redline/SKILL.md:49`).
   Unanswered by the shaper; returned as judgment call R1-3 and decided by the person (Decision 8).
9. **Who else reads the changed wording?** Nothing mechanical. A search of `tests/`, `workflows/`, `scripts/`, `agents/` and `templates/` for "Inline session", "reviewed without", "does not repeat it" and "in bypass-permissions" finds nothing.
   Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 2.

## Standards Applied

- process/release: the version exception, and line 12, which says where the launch skill warns.
- process/docs-gate: each task names its `docs/` or README section or says why there is no reader-facing change.
- process/standards-retrospective: the proposed list below, and the own-commit rule R1-3 reads against the history.
- scripts/guard: the skill-fork bullet, which R1-6 reads against the warning.
- prompts/attribution: the spec and the commits carry no attribution marker.

## Standards retrospective (proposed)

1. `agent-os/standards/process/release.md`, line 12: replace "on a fresh launch and on a resume, a warning and never a stop since a skill cannot read the permission mode (#76)" with "on a fresh launch and, before the Resume or Start fresh question, on a resume, since an `error` or `stopped` resume relaunches in that same turn (#83, R1-4); a warning and never a stop since a skill cannot read the permission mode (#76)".
2. `agent-os/standards/scripts/guard.md`, line 23, the skill-fork bullet, where the session's permission mode is named as the pass's safety: replace "and `docs/guard.md` say the same (#80, R2-5, R4-2)" with "and `docs/guard.md` say the same (#80, R2-5, R4-2). In bypass-permissions that prompt does not exist, so wherever Redline offers that mode it says the mode removes the pass's prompt, the one check the guard cannot provide, and that a fresh launch with `coverage off` runs without the pass: the launch skill's Inline session paragraph, `docs/running.md`, `CONTRIBUTING.md` and the README's Known limits (#83, R1-6)". Drafted for Decision 7 (the choice: keep it and state the cost).
3. R1-3: already in `agent-os/standards/process/standards-retrospective.md:6` and gate step 12. No change under either option.
4. R1-1, R1-2, R1-5 and Decisions 5 and 6: gate step 13 covers a stale As built; the version exception is `process/release.md:5`; the other three are one-off wording or ordering and teach nothing a standard should carry. No change.
5. `agent-os/standards/process/release.md`, line 12, the probe clause: replace "refused under `--plugin-dir` and written under plain `claude`. The main session's" with "refused under `--plugin-dir` and written under plain `claude`; bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). The main session's". Drafted for Decision 7, whose notes name this clause. It does not overlap item 1, which edits the end of the same line.
