# Spike #72: a second reviewer on whole-PR rounds — Shaping Notes

Shaped by hand on 2026-11-04 with `/agent-os:shape-spec` in plan mode, on `spike/72-spike-a-second-reviewer-on-whole-pr-rounds-the-code-review-skills-method-merged-into-redlines-findings` at e957077 with a clean tree. Issues #73, #74, #75 and #20 were read for what this spike is not asked to cover: the regression pass, the `cost` class and the "for the person" list (#73), review-only rounds at coverage (#74), the shaper's class-or-instance check (#75) and learning from the teammate's post-handoff comments (#20) stay their own issues whatever this spike decides. The person makes every commit.

## Scope

A spike, not a feature. Its deliverable is the answer to the four numbered questions in #72 and the decision at the end:

1. Can a dynamic-workflow subagent load the `code-review` skill (the Skill tool, or its text from the plugin cache), or must the main session run it before the workflow and pass its output in args? Record what works and what the harness forbids.
2. Run both on #817 at the pre-Redline SHA (`da44437`) and on one Chalkboard PR with a known answer. Which of the teammate's items does each find? What does the union cost in time and tokens against today's single pass?
3. Merge: the skill's findings become candidates alongside Redline's reviewer's; duplicates collapse; each candidate goes through the known-finding check and, for correctness, reproduction; confirmed ones get ids and severities as today; the rest go under `### For the person`, never shaped or fixed. The reviewer prompt is unchanged in this spike.
4. Drift: record the Claude Code version the skill was validated against in `agent-os/product/tech-stack.md`; #19's benchmark checks later versions.

Decision at the end: a spec for the two-reviewer round, or a record of why not.

What lands in this repository: this spec folder and one clause in `agent-os/product/tech-stack.md`. No code, prompt or template change; `agents/redline-reviewer.md` is untouched. Spike notes, raw outputs, measurements and the decision record live in `redline-internal` (`docs/SPIKE-72-NOTES.md`, `docs/spike-72/`), cited here by file name only.

## Decisions

See `plan.md`, "Decisions", for the ten decisions and their owners. The shaping evidence behind each, with what was read:

1. **Both reviewers, not a swap.** From the issue's "Why". Evidence that Redline's reviewer is the precision pass: `agents/redline-reviewer.md` line 8 ("precision matters more than coverage"); that the skill is the coverage pass: its description as the harness shows it ("from few high-confidence findings to many, some uncertain"). Decided by: @michaelwitwicki.
2. **Question 1 first, subagent route first.** From the invoking prompt. Decided by: @michaelwitwicki.
3. **Corpus is #817 only.** Asked at shaping which Chalkboard seed to use (#114, the missed race, was recommended); the answer: the Chalkboard repository is locked for changes until the hackathon is over, so the seed is skipped. The decision at the end is made on one PR and says so; rerunning the union on a seed is the first thing the next issue does once the lock lifts. Decided by: @michaelwitwicki, 2026-11-04.
4. **Baseline through a throwaway draft PR.** Evidence: the #817 round 1 run record (`wf_b10c7a4b-d65`, 2026-11-03) carries `null` tokens and duration for `review r1`, since a relaunch rewrites the record and no `saved/` copy was taken; `skills/redline/SKILL.md` section 4 steps 3 and 5 (branch equals `headRefName`, HEAD equals `headRefOid`) refuse a launch at `da44437` on #817, whose head is `aebc2561f`; the reviewer's known-finding check (`agents/redline-reviewer.md` line 19) would read the teammate's 2026-11-04 comments. The person pushes `da44437` as `spike/817-second-reviewer-baseline`, opens a draft PR with #817's title and body (`Closes` to `Covers` on line 1 so nothing is linked for closing), and `dry run review only` runs there. The branch predates Losers League's 2026-11-02 setup rerun, so the old-contract warning at launch is expected and is not fixed (merging `main` would move the SHA). The dry run's record commit stays on the throwaway branch. Decided by: @michaelwitwicki, 2026-11-04.
5. **The skill's pass runs at `xhigh`.** Evidence: Losers League `.claude/redline.json` sets `reviewerFirstRound` to `claude-opus-5-5` at `xhigh`; the skill's effort table, read from the Claude Code 2.1.318 binary, maps `xhigh` on the opus-5 family to ten inline angles with no subagents, and `max` to a fan-out through the Agent tool, which a workflow subagent never has. Decided by: @michaelwitwicki, 2026-11-04.
6. **Version stays `0.1.1` on purpose.** Gate step 11's exception for a PR whose spec keeps the version; precedent #16 (`0.1.0`), `agent-os/standards/process/release.md`. A spec folder and a product-doc clause change nothing a setup rerun writes or a user installs. Decided by: @michaelwitwicki, 2026-11-04.
7. **Measurements from the harness run records.** The workflow script records no time or tokens (`workflows/redline-loop.js` line 24: no clock reads in a script); the harness record under `~/.claude/projects/<project>/<session>/workflows/<runId>.json` holds `durationMs`, `tokens` and `toolCalls` per `workflow_agent`. Figures go to the internal note only (`process/internal-notes`: no token or cost figure in a public spec). Decided by: @michaelwitwicki (the issue) and the standard.
8. **The merge is simulated by hand.** The issue keeps the reviewer prompt unchanged, so question 3 is answered by applying the reviewer's own rules (`agents/redline-reviewer.md` lines 16 to 22 and 26 to 27) to the skill's candidates by hand and recording each outcome. Decided by: redline (shaping).
9. **Two places to run.** `skills/redline/SKILL.md` section 1 resolves `repoRoot` with `git rev-parse --show-toplevel` from the shell's working directory; this session's shell returns to the plugin checkout outside its working directories, so the Losers League runs happen after `/add-dir <worktree>` here or in a session opened in the worktree. Decided by: redline (shaping).
10. **Names.** Spec folder slug within Step 6's 40 characters; internal note `SPIKE-72-NOTES.md` beside the RevRev `SPIKE-NOTES.md`; throwaway branch `spike/817-second-reviewer-baseline` so the skill's issue inference (`skills/redline/SKILL.md` section 5 item 3) gives 817. Decided by: redline (shaping).

## Unattended answers

Not applicable: shaped by hand, questions asked one at a time with AskUserQuestion (baseline route, seed PR, skill effort, version).

## Context

- **Visuals:** none.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md` ("The second developer's review stays in place"; "A clean run means no correctness bug in the changed code that the reviewer could read or reproduce") and `agent-os/product/roadmap.md` item 5 (seeded PRs with the answer key outside the repository measure the reviewer's recall). A second pass for coverage serves the first line without changing the second: what Redline acts on stays what it could reproduce.

## Answers

The evidence for each answer is `redline-internal/docs/SPIKE-72-NOTES.md` (sections 2 to 6) and the raw files under `redline-internal/docs/spike-72/`, cited by name; the public spec carries no figure.

1. **Can a workflow subagent load the skill?** Yes. A default workflow subagent calls `Skill("code-review", "xhigh <branch>")` and the harness runs the skill as a foreground fork with Bash and Read, without the Agent tool, returning the fork's final text (the skill's JSON array and its summary) as the Skill tool result; nothing was refused. There is no plugin-cache text to read: the skill is bundled in the Claude Code binary. Three things the harness allows that a design must not lean on: the guard does not see a skill fork (under the reviewer's agent type the fork ran commands the reviewer row refuses, with no guard decision); a Redline role's output contract leaks into the fork (under the reviewer's agent type the fork called StructuredOutput itself and the caller got nothing); and the run record sees only the calling agent, so a skill pass is measured from the fork's transcript. The saved `--max-findings` choice is read from `~/.claude.json`, so a spec passes it explicitly. (Note, section 2.)
2. **Which of the teammate's items does each pass find, and at what cost?** On #817 at `da44437` (PR #818), today's reviewer reported three confirmed findings and none of the teammate's seven primary items outright (the instance of item 6). The skill's pass as a default workflow agent reported seventeen, none wrong: the reviewer's three, five of the seven primary items, three of the five nits, and five untracked observations. The union is therefore the skill's list; what the reviewer adds is the contract, not findings. The skill's fork took about a third more wall time and output than the reviewer's pass; run in parallel the Review phase grows by about two fifths in wall time and about two and a half times in tokens. The Chalkboard seed was not run (Decision 3), so this is one PR. (Note, sections 3 and 4.)
3. **The merge.** Simulated by hand on the skill's seventeen: three collapse into the reviewer's by cause (none by line, one not even by file), the known-finding check tags parts of two against #816, #812 and #797, three correctness candidates are cheap to reproduce with the reviewer's scratch-test recipe (not run here; the PR's own later fix commit and the teammate's check stand as the evidence), and the sort leaves eleven confirmable, three for the person. Everything the skill's output lacks (`category`, `severity`, `confidence`, `side`, a line inside the diff, `needsDecision`, `askRule`, `knownAs`, a reproduction) is what the reviewer already produces for its own findings, so the merge is a verify stage with the reviewer's rules, not a new vocabulary. (Note, section 5.)
4. **Drift.** `agent-os/product/tech-stack.md` line 5 records Claude Code 2.1.318 as the version the skill's recipe was read from and its route checked against, and that #19's benchmark checks later versions. (Note, section 6.)

## Decision

**Spec it.** A whole-PR round runs both: the skill's pass for coverage as a default workflow agent in parallel with the reviewer, then a verify stage in which the reviewer applies its own rules to the skill's candidates, a `### For the person` section in the review body and the handoff, a `models.coverage` entry and a dial to turn the pass off, a Known limits line that the guard does not vet a skill fork, and a loop-test scenario list of its own. The reviewer prompt changes in that issue, not here. Its first task is the Chalkboard seed rerun once the lock lifts, since this decision rests on one PR. The shape is drafted in the note's section 7 for the next issue's body; #73, #74 and #75 stay open for what the pass does not cover. Decided by: @michaelwitwicki, on the spike's evidence, 2026-11-05.

## Standards retrospective

Run at the gate on 2026-11-05 over Decisions 1 to 10, the As built deviations in `plan.md`, and the build's red checks (none: `checks.sh --baseline` exited 0 on its first run). Items reviewed: Decisions 1 to 10 (1, 2, 5, 6, 7 and 10 already covered by `process/internal-notes`, `process/release`, `workflow/replay` and `prompts/attribution`; 3, 4, 8 and 9 are spike-only), the seven As built deviations, and no red check. Three items were missing from a standard and were presented with AskUserQuestion on 2026-11-05; all three approved as proposed, decided by: @michaelwitwicki. Applied, for their own commit: `workflow/agents.md` (a workflow subagent never has the Agent tool; a skill runs as a foreground fork with the caller's tools and output contract; the run record sees the calling agent only), `scripts/guard.md` (the guard does not see a skill fork, so a skill-based pass is a plain workflow agent, never a role), `process/internal-notes.md` (a baseline for a moved PR head is measured on a throwaway draft PR at the old SHA; probe scripts and run-record copies live beside the spike note). No pattern was invented outside the standards: the probe script follows `workflow/replay` (no clock reads, everything through `args`).

## Standards Applied

- process/internal-notes — where the notes, raw outputs and figures go; what the public spec may cite
- prompts/attribution — no model or vendor name in the spec, the note's public citations or any commit message
- process/release — the version is kept on purpose (Decision 6)
- process/docs-gate — the two touched paths need no reader-facing change, and the plan says why
- process/standards-retrospective — the gate's last step
- workflow/agents — what a workflow agent is given and denied; where the probe's findings about the harness would be recorded
- scripts/guard — role detection by `agent_type`, inert for a non-Redline agent; what the reviewer row allows the skill's commands
- workflow/replay — no clock reads in the probe script; everything variable comes in through `args`
