Redline handoff

Redline ran 3 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 8 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 2 correctness, 4 nit; 9 commits; spec `agent-os/specs/2026-11-09-1423-83-review-round-1`
- Round 2 (fix-diff): 0 correctness, 2 nit; 4 commits; spec `agent-os/specs/2026-11-09-1423-83-review-round-2`
- Round 3 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-09-1423-83-review-round-3`

### Decisions

- **R1-4** The resume warning comes after the person's last chance to act on it: fixed in f75e4c0 · decided by: redline
- **R1-6** The warning recommends bypass-permissions without saying it removes the coverage pass's stated safety: The author keeps bypass-permissions as a remedy and has the skill, docs/running.md, CONTRIBUTING.md and the README's Known limits state that it removes the coverage pass's permission prompt, the one check the guard cannot provide, and that a fresh launch with coverage off runs without the pass, because it is the only remedy for an unattended inline session; the probe clause in agent-os/standards/process/release.md also records PR #83 round 1, an inline session in bypass-permissions on 2026-11-09, as the session confirming that remedy, the review having posted with no prompt and no refusal. · decided by: @michaelfromtheoutfit
- **R1-1** The inserted sentences change what "reviewed without it" refers to: fixed in 40eab5b · decided by: redline
- **R1-2** plan.md's As built is stale against the branch and the PR body: fixed in 5f904f3 · decided by: redline
- **R1-3** The approved standards edit did not land in its own commit: The author keeps commit 4edbbb7 combined and has the #76 spec record that the standards edit landed with the code rather than in its own commit, in a Decision in its shape.md and corrected lines in shape.md and the As built of plan.md, because two lines of accurate record cost far less than a force-push that would change every later commit id on the branch for the sake of one bullet's separation. · decided by: @michaelfromtheoutfit
- **R1-5** The hand-off exemption inside the Resume bullet contradicts it for `handoff` and `reviewed` markers: fixed in 109e1bc · decided by: redline
- **R2-1** The post-tag walk that closes #76 would pass vacuously, which Decision 8 says it must not: The author bumps the patch version because an install moves on the manifest's version and installs already on 0.2.0 from the #80 merge would otherwise be stranded until a hand reinstall, which the per-PR patch bump exists to prevent, so 0.2.0 is never tagged, both manifests go to 0.2.1, the CHANGELOG's heading becomes 0.2.1 holding #80 and #83, the #76 spec's "0.2.0 tag" lines say 0.2.1, and the author redrafts the PR description's version sentence by hand after the run. · decided by: @michaelfromtheoutfit
- **R2-2** The inserted bypass clause leaves "in both" pointing at the wrong pair: fixed in c90356f · decided by: redline

### For the person

- `skills/redline/SKILL.md:87` · The bypass-permissions remedy is not part of the recorded probe, which covered auto and accept-edits; nothing on file shows a subagent Write passing under `--plugin-dir` in bypass, so one real session would confirm it.
- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md:27` · The condition also fires for the local-directory marketplace, which the probe did not cover; there the warning's flat claim about auto mode is untested, and it asks the person to give up auto mode, so "costs a line" may understate it.
- `agent-os/standards/process/release.md:12` · The bullet says one launcher Write was refused where `shape.md` says refused twice, and "in either mode", following a both-launches comparison, can read as covering plain `claude`.
- `CHANGELOG.md:13` · The header and gate step 11 say the entry is written by the person at tag time from merged PR titles; #80 set the same early-entry precedent and this line differs from the PR title, so either the rule or the practice could change.
- `skills/redline/SKILL.md:87` · A one-line subagent Write probe at launch could detect the refusal directly, avoiding the false alarm in accept-edits and bypass and the roughly 23-minute loss before `post r<n>` in auto mode; a larger design than this PR chose.
- `skills/redline/SKILL.md:87` · The inline test and its verbatim paragraph live only in prompt prose that no test reads; an `inline` field from `redline-setup.sh version` and `redline-prefs.sh run check` would put them under the script tests, which decision 1 excluded for this PR.
- `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md:37` · Already tracked in #76, which lacks this: once #76 closes after the installed-release walk, the unfiled upstream report has no open home, and nothing says when to remove the warning after Claude Code fixes the refusal.
- `skills/redline/SKILL.md:87` · On a fresh launch the warning comes after the settings question and is followed by "go on", so nothing waits. The minutes before the first post leave time to stop the run, and the failure resumes with a warning first (R1-4 covered only the resume); saying it before section 3 would give a pause without making it a stop, against Decision 2's placement.
- `skills/redline/SKILL.md:87` · The test reads only Redline's own root, so an installed Redline in a session that loads some other plugin with `--plugin-dir` gets no warning, if the refusal follows any inline plugin as #76's Nov 9 comments suggest; not reproduced. Already tracked in #76, which lacks this consequence for `CONTRIBUTING.md:7` and `release.md:12` ("an installed release is clean").
- `skills/redline/SKILL.md:47` · Changing mode to bypass may need a restart with a flag, and the `claude --resume <id>` line (`scripts/redline-prefs.sh:187`) omits `--plugin-dir`; a session reopened that way loads the cached copy, the warning goes silent, and the `plugin` check (line 217) runs only when HEAD moved. Harness behaviour not reproduced.
- `skills/redline/SKILL.md:87` · The warning offers "accept-edits and approve each prompt" with no qualifier, though line 47 also has a headless resume say it, where nobody can approve; bypass is the only remedy there and only the round 1 spec says so. Headless behaviour not run.
- `skills/redline/SKILL.md:107` · The warning says the launcher's first file write can be refused (Nov 6), but section 5 step 4 names no failure path for the `snapshot-start.json` Write, so the launcher would improvise; code this PR did not change.
- `docs/running.md:56` · R1-6 was decided, and this still reproduces it: "What the guard does not vet" says a fork's write is left to the session's permission prompt with no bypass caveat, and the caveat sits only in Precheck (line 30).
- `skills/redline/SKILL.md:87` · The warning is said from two sites and reconciled by a "not said twice" sentence; one site after the PR number is parsed would cover every path and would also give a fresh launch the pause noted above.
- `.claude-plugin/plugin.json:4` · R2-1's decision has the PR description's version sentence redrafted by hand, but its opening line also says "the installed-release walk after the 0.2.0 tag", and 0.2.0 is now never tagged, so that line needs the same edit to 0.2.1.

### Commits

- 5fafa57 redline: save review round 1 spec for PR #83 (#76)
- 40eab5b redline: R1-1 name --plugin-dir in the sentence the new text separated from it (#76)
- 5f904f3 redline: R1-2 bring the #76 spec's As built up to date with the branch and the PR body (#76)
- 109e1bc redline: R1-5 take the hand-off exemption out of the Resume bullet (#76)
- f75e4c0 redline: R1-4 say the inline-session warning before the Resume or Start fresh question (#76)
- bf63a87 redline: R1-6 say what bypass-permissions removes wherever the warning offers it (#76)
- c440071 redline: R1-3 record in the #76 spec that the standards edit landed with the code (#76)
- 9dfa88b redline: record the round 1 review lessons in the standards, finishing R1-6 (#76)
- 37c22f9 redline: record PR #83 round 1 as built (#76)
- 0e177a6 redline: save review round 2 spec for PR #83 (#76)
- e14ebe4 redline: R2-1 bump the version to 0.2.1 so an install on 0.2.0 moves, and correct the #76 spec's post-tag walk (#76)
- c90356f redline: record the round 2 review lessons in the standards, finishing R2-2 (#76)
- a327e96 redline: record PR #83 round 2 as built (#76)
