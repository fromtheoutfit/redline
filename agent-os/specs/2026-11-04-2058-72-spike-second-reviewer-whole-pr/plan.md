# Spike #72: a second reviewer on whole-PR rounds, the code-review skill's method, merged into Redline's findings

Spec folder: `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/`

Shaped by hand on 2026-11-04 with `/agent-os:shape-spec` in plan mode, on `spike/72-spike-a-second-reviewer-on-whole-pr-rounds-the-code-review-skills-method-merged-into-redlines-findings` at e957077 with a clean tree. The person makes every commit. Nothing is committed, pushed or staged by the implementation.

## Context

The teammate's review of Losers League #817 (marcamos, 2026-11-04T15:26Z, at `3ac4c1de2`) found seven findings Redline's rounds 1 and 2 missed, none wrong: items 1 to 7 of that comment (two regressions against `main`, one cost regression, copy, a lost fallback, a one-field-at-a-time error layer, a missing 503 test), plus five nits (items 8 to 12). Redline's reviewer is tuned for precision because its findings become plan tasks unread; Claude Code's `code-review` skill is tuned for coverage because a person reads its output. Issue #72 asks whether a whole-PR round should run both, and answers four numbered questions before deciding.

**Deliverable.** The answers to #72's four questions and the decision at the end: a spec for a two-reviewer whole-PR round (the next issue's work) or a record of why not. No code, prompt or template change lands. `agents/redline-reviewer.md` is unchanged. What lands in this repository: one spec folder and one line in `agent-os/product/tech-stack.md` (#72 item 4). Everything else (spike notes, raw outputs, measurements, the decision record) goes to `redline-internal/docs/`, cited here by file name only.

## Decisions

1. **Both reviewers, not a swap.** The skill's pass is for coverage; Redline's reviewer stays for precision and everything the contract needs (known-finding check, reproduction, ids, severities, ask rules, carry-forward). Decided by: @michaelwitwicki (the issue).
2. **Question 1 first, subagent route first.** Try the workflow-subagent route before any main-session fallback; record exactly what the harness allows and refuses. Decided by: @michaelwitwicki.
3. **Corpus is #817 only.** The Chalkboard repository is locked until the hackathon ends, so the seed PR (#112/#113/#114) is skipped; the spec records the decision as made on one PR and names the seed rerun as the first thing the next issue does when the lock lifts. Decided by: @michaelwitwicki (shaping, 2026-11-04).
4. **Baseline on #817 through a throwaway draft PR.** The round 1 run record `wf_b10c7a4b-d65` was overwritten by the relaunch and carries no tokens or time for `review r1`, and a launch on #817 itself is refused while HEAD (da44437) differs from the PR head (aebc2561f) and would see the teammate's comments in the known-finding check. The person pushes da44437 as a new branch and opens a draft PR; `dry run review only` runs there. Expect the old-contract warning at launch (the branch predates the Nov 2 setup rerun); never merge `main` into it; the dry run's record commit stays on the throwaway branch and dies with it. Decided by: @michaelwitwicki (shaping, 2026-11-04).
5. **The skill's pass runs at `xhigh`**, matching `reviewerFirstRound.effort` in Losers League's `.claude/redline.json`, so the cost comparison is like for like. On the opus-5 family `xhigh` is ten inline angles with no subagents, so the denied Agent tool costs nothing; `max` would degrade to a single pass. Decided by: @michaelwitwicki (shaping, 2026-11-04).
6. **Version stays `0.1.1` on purpose** (gate step 11's exception, as #16 kept `0.1.0`): a spec folder and a product-doc line are not a release. Recorded in `shape.md` so the reviewer reports no nit. Decided by: @michaelwitwicki (shaping, 2026-11-04).
7. **Measurements are the union's time and tokens against today's single pass, per PR**, from the harness run records (`~/.claude/projects/<project>/<session>/workflows/<runId>.json`: `durationMs`, `tokens`, `toolCalls` per `workflow_agent`). Token and cost figures go to redline-internal only (process/internal-notes). Decided by: @michaelwitwicki (the issue; the standard).
8. **The merge (question 3) is simulated by hand in this spike**, not implemented: the skill's candidates are deduplicated against Redline's (same file and cause), each goes through the known-finding check and, for correctness, a reproduction where cheap; the outcome per candidate (confirmed / for the person / duplicate / known) is recorded. Decided by: redline (shaping; the issue says the reviewer prompt is unchanged).
9. **Two places to run.** Redline's launch resolves `repoRoot` from the shell's working directory (`skills/redline/SKILL.md` section 1), and this session's shell returns to the plugin checkout when it leaves its working directories, so everything that touches the Losers League worktree runs either after `/add-dir <worktree>` in this session (recommended: one context, one record) or in a session opened in the worktree following the runbook the spike writes. The person picks at execution. Decided by: redline (shaping).
10. **Names.** Spec folder `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/` (slug 38 chars). Internal note `redline-internal/docs/SPIKE-72-NOTES.md` (the existing uppercase `*-NOTES.md` convention; `SPIKE-NOTES.md` is the RevRev spike and stays). Raw outputs under `redline-internal/docs/spike-72/`. Throwaway branch `spike/817-second-reviewer-baseline` (the skill reads the issue number from the branch, so the dry run's local record commit says `(#817)`). Decided by: redline (shaping).

## Facts established during shaping (the evidence the tasks build on)

- **The skill is bundled, not on disk.** `claude --version` is `2.1.318 (Claude Code)`; `/code-review` is registered inside the binary (`name:"code-review", aliases:["review"]`), with no SKILL.md anywhere. The official-marketplace `code-review` plugin under `~/.claude/plugins/marketplaces/` is an older PR-only command and is not installed. So "its text from the plugin cache" (issue question 1) is not a route; the routes are the `Skill` tool and a `skills:` preload in an agent's frontmatter.
- **Workflow subagents never get the Agent tool.** The default workflow agent disallows `Agent` and `Workflow`, and a custom `agentType`'s `disallowedTools` are merged with that list. `agent()` has no `tools` option (workflow-authoring reference), so a script cannot grant it. The skill's `max` recipe (ten finders through the Agent tool, then verify) therefore falls back to its single-pass variant and must say so in its summary; `xhigh` on the opus-5 family is inline by design.
- **Skill from a subagent is a foreground fork.** With an `agentId` set the skill's context resolves to `fork`, running on `general-purpose` at depth parent+1 with the caller's tools; ReportFindings is off for any subagent, so the contract is a ```json array of `{file, line, summary, failure_scenario}` returned as the Skill tool result. This is read from the binary, not yet observed: question 1 is answered only when the probe runs.
- **The guard is inert for a non-Redline agent type** (`docs/guard.md` line 7): a default workflow subagent gets ordinary permission handling; `redline:redline-reviewer` gets the reviewer row (`read tests gh-read`, Write only under temp), which allows the skill's `git diff` and refuses a raw `gh`. `agents/redline-reviewer.md` denies `Agent` but not `Skill`; `redline-checker` and `redline-github` deny `Skill`.
- **Today's reviewer** is one `agent()` call per round (`workflows/redline-loop.js` ~1717), `agentType: 'redline:redline-reviewer'`, `claude-opus-5-5` at `xhigh` in round 1, returning `REVIEW_SCHEMA`. Nothing in the repository mentions a second reviewer or `### For the person`.
- **Run records lose usage on relaunch.** `wf_b10c7a4b-d65` (#817, 2026-11-03) has `review r1 = null`; the Chalkboard seed records (2026-10-19 and 2026-10-20) keep theirs, and the earlier guided runs give the range a whole-PR review costs. The figures are in the internal note, not here.
- **The precheck** (`skills/redline/SKILL.md` section 4): PR `OPEN` unless `dry run`; branch equals `headRefName`; clean tree; HEAD equals `headRefOid`; over 300 files GitHub's whole-PR diff is unavailable and Redline reads per-file patches (#817 is 334 files; the skill's own `gh pr diff` path may hit the same limit, so the skill targets the branch name, which diffs locally).
- **Known-finding sources the throwaway PR changes:** `issues-search` still finds #816 and #797 (realistic); `pr-comments`/`review-comments` on the new PR are empty, which is the pre-teammate state the key was produced against.

## Tasks

### Task 1: Save spec documentation

Create `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/`:

- `plan.md`: this plan, with the As built section filled at the end (what each run returned, deviations).
- `shape.md`: Scope (the four questions and the decision at the end); Decisions 1 to 10 above with their evidence; Context (visuals: none; references; product alignment: roadmap item on seeded PRs and the "second developer's review stays in place" line in `mission.md`); `## Answers` (one short entry per question, the evidence being the internal note's section, cited by name only); `## Decision` (spec it, or why not); Standards retrospective; Standards Applied.
- `standards.md`: full text, as it reads at shaping time, of `process/internal-notes`, `prompts/attribution`, `process/release`, `process/docs-gate`, `process/standards-retrospective`, `workflow/agents`, `scripts/guard` (the role-detection and refusal rules the probe exercises), `workflow/replay` (no clock reads in a script; timestamps through args).
- `references.md`: `workflows/redline-loop.js` (`review()`, `reviewPrompt`, `REVIEW_SCHEMA`, `reviewBody`, `handoffComment`), `agents/redline-reviewer.md`, `skills/redline/SKILL.md` sections 1, 4 and the run-record paragraph, `docs/guard.md` role detection, `tests/loop-test.mjs` reviewer mock (what a second reviewer call would shift), and, by name only, redline-internal `docs/API-NOTES.md` §i (background subagents keep `Skill`), `docs/STEP10-NOTES.md` §4 and §8 (the recall and totals table shapes to reuse), `docs/SPIKE-NOTES.md` (the note structure).
- No `visuals/`.

**Docs entry:** spec folder only; no reader-facing change. **Commit:** the person's, `Save the spike #72 spec folder` or as they title it.

### Task 2: The throwaway PR and the worktree (the person's step, then mine)

The person, in the Losers League checkout:

```
git fetch origin
git push origin da4443727a9082d896e314cef8ea3e7023a68840:refs/heads/spike/817-second-reviewer-baseline
gh pr view 817 --json body -q .body | sed '1s/^Closes/Covers/' > /tmp/spike-817-body.md
gh pr create --draft --base main --head spike/817-second-reviewer-baseline --title "Document head in PHP with laravel/head, and JSON-LD structured data on every public page (epic #624)" --body-file /tmp/spike-817-body.md
```

The body is #817's body byte for byte except the first word, `Closes` to `Covers`, so the draft links no issue for closing. The title is #817's. Do not merge `main` into the branch.

Then (mine, or the person's): `git worktree add ~/Code/Sites/loser-spike-817-second-reviewer-baseline spike/817-second-reviewer-baseline`, provisioned the way the other eight loser worktrees are (vendor, `.env`, test database), since the reviewer's scratch tests and the merge simulation's reproductions run `vendor/bin/pest` there. Then either `/add-dir` that path in this session or open a session there.

Record the new PR number as `<spikePr>`; the spec folder and the internal note name it.

### Task 3: Question 1, the harness probe (the skill from a workflow subagent)

A minimal workflow script, written to `redline-internal/docs/spike-72/skill-pass.workflow.js` (private; the plugin's `workflows/` is untouched) and launched with `Workflow({scriptPath, args})` from the worktree context. The person has asked for this probe in the issue ("Can a dynamic-workflow subagent load the code-review skill"), which is the explicit opt-in the Workflow tool requires; each launch is one agent.

```js
export const meta = {
  name: 'spike-72-skill-pass',
  description: 'Spike #72: one subagent runs the code-review skill over a branch and returns its findings',
  phases: [{ title: 'Skill pass' }],
}
const SCHEMA = { type: 'object', properties: {
  loaded: { type: 'string' },          // "skill" | "refused" | "absent"
  context: { type: 'string' },         // what the skill reported: fork / inline / single-pass note
  refusals: { type: 'array', items: { type: 'string' } },
  raw: { type: 'string' },             // the Skill tool result verbatim
  findings: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, line: { type: 'integer' }, summary: { type: 'string' }, failure_scenario: { type: 'string' } },
    required: ['file', 'summary'] } },
}, required: ['loaded', 'raw', 'findings', 'refusals'] }
const opts = { label: `skill pass ${args.variant}`, phase: 'Skill pass', schema: SCHEMA,
  model: args.model, effort: args.effort }
if (args.agentType) opts.agentType = args.agentType
const out = await agent(
  `Working directory: ${args.repoRoot}. Invoke the Skill tool with skill "code-review" and args "${args.effort} ${args.branch}". ` +
  `Do not review the diff yourself: the skill does it. Return what the Skill tool returned, verbatim, in raw; ` +
  `set loaded to "refused" if the Skill tool was denied or missing, and list every denied or refused tool call in refusals. ` +
  `Parse the skill's JSON findings array into findings when it returned one.`, opts)
return out
```

Variants, in order, each a separate launch with `args` `{variant, repoRoot, branch: 'spike/817-second-reviewer-baseline', effort: 'xhigh', model: 'claude-opus-5-5', agentType?}`:

- **A** no `agentType` (the default workflow subagent; guard inert; permission mode of the session applies). This is the question-1 answer.
- **B** `agentType: 'redline:redline-reviewer'`, only if A loaded the skill: does the reviewer's guard row let the skill's Phase 0 run (`git diff main...<branch>` allowed; `gh` refused), and does the reviewer's own system prompt fight the skill's output contract?
- **C** (optional, only if A refused the Skill tool): a temporary agent file `.claude/agents/spike-skill-pass.md` in the worktree with `skills: [code-review]` frontmatter, launched as `agentType: 'spike-skill-pass'`, then deleted; never committed.
- **D** fallback if A and C both refuse: the main session runs `/code-review xhigh spike/817-second-reviewer-baseline` itself and the findings are passed in `args`; the probe then only proves a subagent can consume them.

Record for each: whether `Skill` was offered and allowed, the context the skill reported (fork/single-pass note), every refusal verbatim, the Skill tool result verbatim, wall time and tokens from the run record (`workflowProgress[].tokens`, `durationMs`), and whether the fork's usage is counted inside the calling agent's figure. Save the run record copy under `redline-internal/docs/spike-72/` as `skill-pass-<variant>.json`, and the findings as `skill-findings-<variant>.json`.

### Task 4: Question 2, today's single pass on #817 at da44437

In the worktree context: `/redline <spikePr> dry run review only`. Expected: the old-contract warning (noted, not fixed), `334 files on GitHub` and the over-300 warning, round 1, nothing posted. Save the run record copy as `redline-internal/docs/spike-72/baseline-817.json` before anything can overwrite it; copy `agent-os/specs/<round folder>/redline/round-1-findings.json` and `round-1-review.json` beside it. The record commit stays on the throwaway branch.

### Task 5: Question 2, recall against the key and the cost table

Answer key: items 1 to 7 of the teammate's 2026-11-04T15:26Z comment on #817 (primary), items 8 to 12 (secondary), read from the PR comment at execution time and quoted into the internal note only. For each key item: found by today's Redline (R1-n, from Task 4), by the skill's pass (Task 3 A), by both, by neither; "found" means the same file and cause, the line within the same chain. Also list every non-key finding each pass raised, so precision is visible. Table shape as STEP10-NOTES.md §4.

Cost, per pass and for the union: wall time, tokens, tool calls, from the two run records. The union's tokens are the sum; its wall time is the longer of the two when both run in the Review phase in parallel (`parallel([...])`, as the Approve phase does), and the sum when sequential; report both.

### Task 6: Question 3, the merge, simulated by hand

Take the skill's findings from Task 3 A as candidates beside Redline's R1-n:

1. Collapse duplicates: same file and same cause (not same line) as an R1-n finding.
2. Known-finding check per surviving candidate, as the reviewer does it: `issues-search` keywords, `pr-comments`/`review-comments <spikePr>` (empty by construction), the `*-<pr>-human-review-*` folders (none).
3. For a correctness candidate, reproduce where cheap: a scratch Pest test under `/tmp/redlinerepro/spike72-ReproTest.php` in the worktree, the reviewer's own recipe (`uses(Tests\TestCase::class, LazilyRefreshDatabase::class)`, `Http::preventStrayRequests()`), run with `vendor/bin/pest <path>`.
4. Sort each candidate: confirmed (would get an id and severity as today), for the person (plausible, unreproduced; would go under `### For the person` in the review body and the handoff, never shaped or fixed), duplicate, known.

Record the per-candidate outcome and what the merge needed that the skill's output lacks (no severity, no side, no `needsDecision`, lines possibly outside the diff), since that is what a spec would have to add.

### Task 7: Question 4, drift

Edit `agent-os/product/tech-stack.md` line 5 to add one clause after the proven-on list: the `code-review` skill's recipe was read from and its subagent route validated against Claude Code 2.1.318 (2026-11-0x, spike #72), with the version `claude --version` prints at execution time if it differs. Nothing else in the file changes; #19's benchmark is named as what checks later versions, as the issue says.

**Docs entry:** `agent-os/product/` is not a Docs-step directory; no reader-facing change. **Commit:** the person's, `Record the Claude Code version the code-review skill was validated against (#72)`.

### Task 8: The decision record

In `shape.md` under `## Decision`, and in the internal note's last section: **spec it** or **why not**, decided from Tasks 3 to 6 with the recall, the cost and the merge gaps as the evidence. If spec it: the next issue's draft body goes in the internal note (scope: a second `agent()` in the Review phase, the merge rules from Task 6, `### For the person` in `reviewBody` and `handoffComment`, the loop-test shift, the docs entries), for the person to file. If why not: the reasons, and what #73/#74/#75 should pick up instead. Either way the sibling issues stay open.

### Task 9: The internal note

`redline-internal/docs/SPIKE-72-NOTES.md`, header in the step-note style (date, Claude Code version, plugin commit, Losers League worktree and SHA), sections: What was run (table: run id, how launched, result), Question 1 (allowed/refused, verbatim), Question 2 (recall table, cost table), Question 3 (merge simulation), Question 4 (drift line), Decision, and "Where this contradicts or refines DESIGN.md". Raw files under `docs/spike-72/`. The person commits it in redline-internal.

### Task 10: Verification Gate

1. Run `.claude/redline/checks.sh --baseline` in this checkout until it exits 0; its JSON is the evidence (gate steps 1 to 9; nothing under `scripts/`, `tests/`, `workflows/`, `agents/`, `hooks/` or `.claude-plugin/` changes, so every harness ends at its count before the spike).
2. Docs (step 10): the two touched paths above, each "no reader-facing change" with its reason.
3. Version (step 11): `0.1.1` kept on purpose, Decision 6.
4. Standards retrospective (step 12): list Decisions 1 to 10, the As built deviations, and any check that went red; classify each (already in a standard / missing / contradicting). Candidates to expect: `process/internal-notes` may gain "a run record copy and a probe script are internal notes too"; `workflow/agents` may gain the harness fact that a workflow subagent never has the Agent tool and can invoke a skill as a foreground fork, once Task 3 confirms it. Present with AskUserQuestion: apply, adjust, or none; approved edits land in their own commit (the person's); otherwise `shape.md` records "Standards retrospective: no changes".
5. Spec folder (step 13): `plan.md` reflects what was run; deviations under Decisions in `shape.md`.

Then the person closes the throwaway PR and deletes `spike/817-second-reviewer-baseline` and the worktree.

## Commits (the person makes them, in this order)

1. `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/` (Task 1, updated through Task 10).
2. `agent-os/product/tech-stack.md` (Task 7).
3. Standards edits, if any (Task 10.4), on their own.
4. In redline-internal: `docs/SPIKE-72-NOTES.md` and `docs/spike-72/`.

## Verification (end to end)

- `.claude/redline/checks.sh --baseline` exits 0 with every harness at its prior count.
- `git status` in this checkout shows only the spec folder and `tech-stack.md` (plus standards edits if approved); `git diff --stat` touches nothing under `agents/`, `workflows/`, `scripts/`, `templates/`, `hooks/`, `.claude-plugin/`.
- `grep -ri "claude\|anthropic\|co-authored" agent-os/specs/2026-11-04-2058-72-*/` finds only product-version strings ("Claude Code 2.1.318") in the spec, none in any commit message; no token or cost figure in the public spec.
- The internal note answers all four questions with run ids, and `shape.md`'s `## Decision` matches it.
- The throwaway PR is closed and its branch gone.

## As built (2026-11-05)

Runs, all in a session opened in the Losers League worktree with `claude --plugin-dir` on this checkout (e957077), recorded in `redline-internal/docs/SPIKE-72-NOTES.md` section 1 with their run ids: probe A (the skill from a default workflow subagent), the `dry run review only` baseline on PR #818, probe B (the skill under the reviewer's agent type). Probes C and D were gated on A failing and did not run.

What landed in this repository: this spec folder; one clause in `agent-os/product/tech-stack.md` line 5 (Task 7). Nothing under `agents/`, `workflows/`, `scripts/`, `templates/`, `hooks/`, `tests/` or `.claude-plugin/`. The version stays `0.1.1` (Decision 6).

Deviations from the plan:

1. **Task 2, where the runs happen.** Not `/add-dir`: a subagent's shell runs in the session's starting directory, so the skill's `git diff` and the reviewer's `vendor/bin/pest` only work from a session opened in the worktree. Decision 9's second route was the one used, with the runbook at `redline-internal/docs/spike-72/RUNBOOK.md`. The session also had to load this checkout with `--plugin-dir`: the `redline` marketplace on this machine is now the GitHub source at release 0.1.0, not the checkout.
2. **Task 2, the worktree.** `vendor` and `.env` were copied from the feature-624 worktree (the lockfiles are identical between `da44437` and that head); tests use in-memory SQLite, so no database was set up.
3. **Task 3, the script.** The Workflow tool refused `scriptPath` for a file outside the session's readable directories; the script was passed inline, unchanged. Variant B's findings never reached the calling agent (the fork called StructuredOutput itself) and were recovered from the fork's transcript into `redline-internal/docs/spike-72/skill-findings-B-recovered.json`.
4. **Task 4.** The baseline's local record commit was reset away before probe B so both probes reviewed the same tree; the round's files are kept only under `redline-internal/docs/spike-72/`.
5. **Task 5, exposure.** Both forks read PR #817's review rounds late in their pass, because Losers League's CLAUDE.md asks reviewers to check for known findings. The note's recall table marks, per item, the first tool call that touched it against the call that read the teammate's items, and labels the two items probe B picked up after that point as adopted. Probe A's five primary hits all precede its exposure.
6. **Task 6, reproduction.** The three correctness candidates were not reproduced with scratch tests in the spike. The PR's later fix commit for items 1 and 2 and the teammate's check of every fix stand as the evidence; the note says what a real merge would run.
7. **Measurement.** The run record's `tokens` and `toolCalls` for an agent that forks a skill cover the calling agent only, so the cost table uses the transcripts (assistant messages deduplicated by message id) and first-to-last timestamps.

Gate (2026-11-05): `.claude/redline/checks.sh --baseline` exit 0, PASS, in 80 s, on the first run; no harness changed, so every count is the count before the spike. Step 10, Docs: both touched paths are "no reader-facing change" (a spec folder; a product doc outside the Docs-step directories). Step 11, Version: `0.1.1` kept on purpose. Step 12: three standards edits approved and applied (`workflow/agents.md`, `scripts/guard.md`, `process/internal-notes.md`), for their own commit; see `shape.md`, "Standards retrospective". Step 13: this section.

After the gate, the person's steps: commit the spec folder and `tech-stack.md` here, the note and `docs/spike-72/` in redline-internal, any approved standards edit on its own; close PR #818 and delete `spike/817-second-reviewer-baseline` and the worktree; file the next issue from the note's section 7.
