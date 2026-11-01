# Standards for PR #59 review round 2

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time (2026-11-01). The short ones are given in full. `workflow/agents` and `testing/tests` are long; for them the heading line and every bullet this round applies are quoted verbatim, and the full file is at the path named.

---

## workflow/replay

`agent-os/standards/workflow/replay.md`, the heading and the bullets this round applies (the full file is 16 lines; the other bullets cover the clock, decisions, plan keys, round numbers, prior findings, the thread sweep and ask rules):

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. A hand commit's paths join `approvedPaths` at that label, never at startup, so the cached snapshot prompt stays byte-identical (#10)

**Applies to:** R2-1 (the changed clause is on the resume line only; a first run's Finish prompts stay byte-identical).

---

## workflow/agents

`agent-os/standards/workflow/agents.md`, the heading and the bullets this round applies:

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- A degraded result is data, not an error: the GitHub agent returns a posted review with no inline comment as `posted` true with every finding in `movedToBody`, the workflow records a warning, and `error` is reserved for an operation that failed. (The bullet continues on the workflow not taking an agent's `error` on trust; #33, #34, #9.)
- A check that something was already posted looks for text only that post carries. `redline-gh.sh pr-comments` prints review bodies and issue comments together, so a body finding's marker, which the review body also holds, proves nothing; the reply's own `from the Redline round N review body` line does (#34, R1-1)

**Applies to:** R2-1 (a comment found already posted is a result, `posted` true, not an `error`; the duplicate check reads only what `pr-comments` prints, which has no URL). The proposed retrospective item 1 extends the second bullet.

---

## testing/tests

`agent-os/standards/testing/tests.md`, the heading and the bullets this round applies:

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. (The bullet continues with the scenarios it proves, ending "Its resume scenario proves the error result's `resumeFrom`, the byte-identical prefix up to the resumed label, the resume line on that prompt alone, a shape-stage rerun, an excused hand commit beside an unexcused unexpected file, a non-resumable gather error, and the record commit that ends `review only` and revise-only runs (#10)".)
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1)

**Applies to:** R2-1 (the prompt text changes, so the check pinning it changes first; the Finish mock returns an empty `comment_url` on the resumed path, as the agent now would). The proposed retrospective item 2 extends the first bullet.

---

## process/docs-gate

`agent-os/standards/process/docs-gate.md`, the heading and the bullets this round applies:

# Docs gate

Every spec names the README and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template, if any) and either the commit that updated it or "no reader-facing change" with the reason
- No commit exists at shaping time: a plan's entry names the README section (and template) its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate.

**Applies to:** R2-1 touches `workflows/redline-loop.js`; its entry names README "Launching" with the reason there is no reader-facing change.

---

## process/standards-retrospective

`agent-os/standards/process/standards-retrospective.md`, in full:

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 11 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## prompts/attribution

`agent-os/standards/prompts/attribution.md`, in full:

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
