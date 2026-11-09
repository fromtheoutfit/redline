# PR #83 review round 2: the post-tag walk that closes #76, and the bypass clause in the release standard: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The two findings of Redline round 2 on PR #83 (issue #76), both nits, and nothing more. This is the final nit round, and the review reports no correctness finding.

- R2-1 (nit, low, `needsDecision`): the installed-release walk that closes #76 would pass vacuously, which Decision 8 of the #76 spec says it must not.
- R2-2 (nit, low): the bypass-permissions clause R1-6 added sits between the probe's two launches and "in both", so "both" points at the wrong pair.

Line numbers below are at `37c22f9`, the PR head this round reviewed. The `redline/` subfolder is Redline's own record and is untouched. The seven "For the person" lines in the round's review are not findings and are not in scope.

## Decisions

1. **R2-2: fix, through the standards retrospective (item 1 below).** The clause moves, word for word apart from its capital, to its own sentence after "allow rules are not consulted for a subagent's write in either mode." "Both" then has `--plugin-dir` and plain `claude` as its nearest pair again, and the bypass session no longer falls under "The probe, on Claude Code 2.1.319:". Confirmed at `agent-os/standards/process/release.md:12`. The route is the one `agent-os/standards/process/standards-retrospective.md:7` gives a Redline run (Unattended answer 3). Plan Task 2.
   Decided by: redline
2. **R2-1: The installed-release walk that closes #76 would test a copy with no warning code in it.** Chosen: Bump the patch version. The story and the options as returned are under "R2-1, how the walk that closes #76 is made real" below. Plan Task 3.
   The author bumps the patch version because an install moves on the manifest's version and installs already on 0.2.0 from the #80 merge would otherwise be stranded until a hand reinstall, which the per-PR patch bump exists to prevent, so 0.2.0 is never tagged, both manifests go to 0.2.1, the CHANGELOG's heading becomes 0.2.1 holding #80 and #83, the #76 spec's "0.2.0 tag" lines say 0.2.1, and the author redrafts the PR description's version sentence by hand after the run.
   Date: 2026-11-09
   Decided by: @michaelfromtheoutfit
3. **R2-2 moves no version.** It is one sentence in a standard and changes nothing a setup rerun writes. The PR keeps `0.2.0` on purpose (`agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md:16`), the exception `agent-os/standards/process/release.md:5` names. Whether `0.2.0` stays is one of the options under R2-1, so this entry covers R2-2 only. That sentence on the PR keeping `0.2.0` was true at shaping and is stale after Decision 2: the PR moved both manifests to `0.2.1` in `e14ebe4` under R2-1, and R2-2 still moves no version of its own.
   Decided by: redline

### R2-1, how the walk that closes #76 is made real

Decided: see Decision 2. What follows is what the person saw.

Story: #76 is meant to close once a real installed session is seen to stay silent, and the #76 spec delays that walk until after the 0.2.0 tag so that it runs against a copy that has the warning code. That reasoning has gone stale. This machine updated to 0.2.0 from `94f4616`, the #80 merge, before this PR's code existed, so its cached copy has no warning in it (0 matches for "Inline session"). Because this PR keeps 0.2.0, and Claude Code moves an install on the manifest's version rather than on the tag, `claude plugin update` has nothing to move to after the merge. Someone following the spec would open an installed session, see no warning, close #76, and have tested nothing. Nobody using Redline is harmed by the stale copy: the warning only ever fires from a directory load, never from a cached one. What is at stake is whether the last check before #76 closes means anything.

Why a person: Decision 4 (keep the version) and Decision 8 (the shape of the walk) are assumptions in the #76 spec that the person set, Decision 5 is the person's done rule, and two of the three options reverse one of them.

Options:

- **Keep 0.2.0 and reinstall for the walk.** Cost: one reinstall after the tag, by hand, and a check that the cached `skills/redline/SKILL.md` holds "Inline session" before the session counts; two lines change in the #76 spec's `shape.md` and three in its `plan.md`. Effect: the done rule stands with the version kept, the PR description stays true, and the walk cannot pass against a stale copy. Not checked: whether Claude Code refetches a version whose directory is already in its cache (the guard refuses `claude` to the shaper), which is what the cached-file check catches.
- **Bump the patch version.** Cost: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` go to `0.2.1`, reversing Decision 4 and round 1's Decision 5; `CHANGELOG.md`'s untagged `## 0.2.0` heading (line 5) has to be renamed or 0.2.0 is never tagged; the #76 spec's "0.2.0 tag" lines change, and the PR description's "Version stays 0.2.0" is redrafted as this round's `pr-body.md`. Effect: an ordinary `claude plugin update` moves the install, with no special step, and the same applies to anyone else already on 0.2.0.
- **Drop the post-tag walk.** Cost: Decision 8 and the open item are rewritten in the #76 spec, the PR description's "installed-release walk" is redrafted as this round's `pr-body.md`, and #76 closes on the upstream report alone. Effect: the path check before the merge (`plan.md:65`, `plan.md:88`) is the only negative test, and no real installed session ever runs the new text. A false warning would cost one line and stop nothing (Decision 9), so little is lost.

Recommendation: Keep 0.2.0 and reinstall for the walk: it keeps the done rule the person set, moves no version, and costs one reinstall and one count.

### Proportionality

Neither finding is a correctness finding, so the proportionality rule does not apply. R2-2 is one sentence in one file inside the PR's diff.

## Unattended answers

1. **Visuals:** none; this is one sentence in a standard and lines in a spec record.
   Decided by: redline
2. **Product context:** "Honest about its reach" (`agent-os/product/mission.md:17`), the same alignment as the #76 spec. A check that passes against code with no warning in it is the kind of claim that line is against, which is why R2-1 is worth a decision.
   Decided by: redline
3. **R2-2: which route does a standards edit take?** The retrospective. `agent-os/standards/process/standards-retrospective.md:7`: "In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit". Two rounds brought a standards correction this way: #80 round 4 (its `shape.md`, Decision 2, R4-2) and #65 round 2 (its `shape.md`, Unattended answer 4). `agents/redline-implementer.md:19` gives the commit message for it, and the workflow's replies name the commits of a finding fixed that way (`workflows/redline-loop.js:1049`).
   Decided by: redline
4. **R2-2: does moving the clause reopen R1-6?** No. Round 1's Decision 7 decides what is recorded, and the reviewer states the same limit: "What the clause records stays as decided under R1-6; only its place in the bullet is at issue." The person's note calls it "the probe clause" because that is where the shaper's retrospective item 5 drafted it; the sentence stays in the same bullet and records the same session in the same words. Of the reviewer's two proposed fixes, the move is the one that also takes the clause out from under "The probe, on Claude Code 2.1.319:", where "passed under both launches" would leave it there.
   Decided by: redline
5. **R2-1: does the question arise?** Yes, and nothing answers it. Read directly:
   - `~/.claude/plugins/installed_plugins.json:54-62` lists `redline@redline` at `0.2.0` from `94f4616`, installed 2026-11-09.
   - `grep -c "Inline session"` prints `0` for `~/.claude/plugins/cache/redline/redline/0.2.0/skills/redline/SKILL.md` and `2` for this checkout's.
   - `agent-os/standards/process/release.md:9`: "Claude Code moves an install on the manifest's `version`, not on the tag". `docs/upgrading.md:7` names `claude plugin update` as the update route and no forced reinstall.
   - The PR description ("the installed-release walk after the 0.2.0 tag"; "Version stays 0.2.0") states the plan and does not say how the install reaches the new code.

   The #76 spec's premise was true when it was written (Decision 8, shaped at 08:58; the install moved at 14:09 local) and is false now. Unanswered by the shaper; returned as judgment call R2-1.
6. **Known-finding check.** `scripts/redline-gh.sh issues-search "installed-release"` lists #76 and #66, and `issues-search "plugin update"` lists #76; #76 tracks the walk but not that it would pass vacuously, and #66 is about the guard. `scripts/redline-gh.sh pr-comments 83` shows both round reviews, and round 1 raised neither finding. Round 1's spec folder dispositions neither: its Decision 7 is what R2-2 reads against (answer 4).
   Decided by: redline
7. **Who else reads the sentence R2-2 moves?** Nothing mechanical. A search of `tests/`, `workflows/`, `scripts/`, `agents/` and `templates/` for "in both" and "The probe, on Claude Code" hits only unrelated "in both" prose at `scripts/redline-setup.sh:52` and `agents/redline-github.md:16`.
   Decided by: redline
8. **Scratch test.** None written; there is no PHP in this repository, and every question above was settled by reading files.
   Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 2.

## Standards Applied

- process/release: line 12, the bullet R2-2 corrects; line 9, the fact R2-1 turns on; line 5, the version exception.
- process/standards-retrospective: the route for R2-2, and its own-commit rule.
- process/docs-gate: each task names its section or says why there is no reader-facing change.
- prompts/attribution: the spec and the commits carry no attribution marker.

## Standards retrospective (proposed)

1. **R2-2: drift in `agent-os/standards/process/release.md`, line 12.** Two replacements in the one bullet, nothing else on the line moves. The commit that applies this item names R2-2.
   - Replace "written under plain `claude`; bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). The main session's own Writes" with "written under plain `claude`. The main session's own Writes".
   - Replace "in either mode. One launcher Write" with "in either mode. Bypass-permissions is confirmed as a remedy by PR #83 round 1, an inline session in that mode on 2026-11-09, whose review posted with no prompt and no refusal (#83, R1-6). One launcher Write".
2. **R2-1: `agent-os/standards/process/release.md`, line 9.** Drafted for the choice made under R2-1 (Bump the patch version). What it taught: the #76 spec and round 1 kept the version because it was untagged, and untagged does not mean uninstalled. One replacement at the end of the bullet, not a new bullet, so Plan Task 2's count of eight bullets holds. The round's one standards commit carries it.
   - Replace "(plugin loading reference, "How Claude Code computes the version")" with "(plugin loading reference, "How Claude Code computes the version"). A version can be installed from the moment it merges, tag or no tag: an install that updated from that merge stays on those files while later PRs keep the version string, since `claude plugin update` finds nothing to move to, so being untagged is no reason for a PR to keep a merged version (#83, R2-1)".
3. Decision 3 and the unattended answers: the version exception is `process/release.md:5`, and the route is `process/standards-retrospective.md:7`. No change.
