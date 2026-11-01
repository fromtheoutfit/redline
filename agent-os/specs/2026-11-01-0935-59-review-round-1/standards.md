# Standards for PR #59 review round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time (2026-11-01). The four short ones are given in full. `workflow/agents`, `scripts/bash-conventions` and `testing/tests` are long; for them the heading line and every bullet this round applies are quoted verbatim, and the full file is at the path named.

---

## workflow/replay

`agent-os/standards/workflow/replay.md`, in full:

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- A plan approval is keyed by the pass, not by a bare round number: `passOf(record).planKey` is a Redline round's number, or `h<n>` for a human review pass, since a human pass and its final nit pass can carry the same number (#38, R1-5)
- The skill relaunches with byte-identical `args` plus only what the stop asked for, and `resumeFromRunId` set to the run id it recorded at launch. A run the harness stopped is relaunched the same way with nothing added
- A prompt names its inputs by path (`<specFolder>/redline/round-1-findings.json`), not by content, wherever the content can change between launches
- The GitHub agent never posts a round-N review when one already exists on the PR (`redline-gh.sh has-review`), so a fresh run after a lost session cannot double-post
- The first round number enters through `args.firstRound`: the skill reads the highest posted round with `redline-gh.sh last-round` before the launch and passes the next one, and the workflow never asks GitHub for it, since the answer changes as soon as the run posts (#33; #10, round numbering). A human review pass's number enters the same way, through `args.revise.n` from `redline-gh.sh last-human-review`, with the ingested comments as `args.revise.findings` (#36)
- The findings of the PR's earlier Redline rounds and their dispositions enter through `args.priorFindings`: the skill reads them with `redline-gh.sh prior-findings` after `last-round` and passes the list, and the workflow never reads the threads itself, since the run's own carried-forward replies change them (#35)
- Finish's thread sweep is the one place the workflow asks GitHub for state that changes as the run posts (which threads are open, and who spoke last in them), and it sits after every stopping point, so no prompt a relaunch replays depends on it (#39)
- A per-repository list the prompts need (`askRules`, #49) enters through `args` at launch, read by the skill from `.claude/redline.json`, and is injected by appending to an existing interpolation, empty when there is none, so a repository without one keeps byte-identical prompts; the loop test proves it by comparing every prompt of a run with no key against one with `[]`
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. A hand commit's paths join `approvedPaths` at that label, never at startup, so the cached snapshot prompt stays byte-identical (#10)

**Applies to:** R1-6 (the two clauses ride on the resume line, so a first run's prompts stay byte-identical), R1-4 (the resume map keeps every earlier entry), R1-2's "Carry" option (no prompt may change before the stopping point).

---

## workflow/agents

`agent-os/standards/workflow/agents.md`, excerpt (the heading line and the bullets this round applies):

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- A role's prompt names only the commands the guard allows it, in the exact spelling the guard accepts (`<plugin>/scripts/redline-gh.sh diff <pr>`, `vendor/bin/pest <file>`)
- A check that something was already posted looks for text only that post carries. `redline-gh.sh pr-comments` prints review bodies and issue comments together, so a body finding's marker, which the review body also holds, proves nothing; the reply's own `from the Redline round N review body` line does (#34, R1-1)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49)
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36)
- An error result names the agent label that caused the stop (`resumeFrom`), and the skill writes a marker through `redline-prefs.sh run save`; a resume is the person's choice at the next launch, never a retry by the skill or the workflow, and a `gather` error is not resumable (#10)

**Applies to:** R1-6 (the clauses use only the guard's allowed spellings; the comment check matches the whole body, text only that post carries), R1-1 and R1-5 (the marker), R1-2 (returned, not decided).

---

## scripts/bash-conventions

`agent-os/standards/scripts/bash-conventions.md`, excerpt:

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it. [...]
- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header [...] (#38, R2-1)
- A jq program that holds a quote goes in a quoted heredoc (`prog="$(cat <<'JQ' ... JQ)"`, then `jq "$prog"`), never in a bash single-quoted string [...] (#49)
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash
- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning [...] (#17) [...]
- A prompt, skill or workflow sets no variable prefix on a command other than `REDLINE_OCTANE=1` or a gate variable the repository's `checks.json` declares, puts no wrapper (`time`, `env`, `timeout`) in front of a script, uses no shell keyword, and runs git from the repository root [...] (#54)

(`[...]` marks text of the bullet cut here; the full bullet is in the file.)

**Applies to:** R1-1 and R1-4 (`run check` and `run save` change what they print: header first, every description reworded, jq for every value, bash 3.2), R1-6 (the clauses' commands are plain, from the repository root).

---

## testing/tests

`agent-os/standards/testing/tests.md`, excerpt:

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. [...] Its resume scenario proves the error result's `resumeFrom`, the byte-identical prefix up to the resumed label, the resume line on that prompt alone, a shape-stage rerun, an excused hand commit beside an unexcused unexpected file, a non-resumable gather error, and the record commit that ends `review only` and revise-only runs (#10)
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1)
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory, and the run marker (`run save|read|check|clear`) with every refusal (session, branch, head, plugin, untracked) in a throwaway git repository there, on records whose repository path holds `/redline/` as this checkout's does (#10)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A case named for a boundary asserts the boundary itself [...] (#34, R2-1)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. [...] (#54)
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout [...] (#12, R1-9)

**Applies to:** every fix task: red before green, a neighbour case per decision, prefs cases in the throwaway repository, loop checks on prompt text.

---

## process/docs-gate

`agent-os/standards/process/docs-gate.md`, in full:

# Docs gate

Every spec names the README and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template, if any) and either the commit that updated it or "no reader-facing change" with the reason
- A plan that cannot name the section adds one; the entry then names the new section
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section (and template) its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)
- The README names a gate step by its title, never by its number: the numbers move whenever a step is inserted before them (#40 moved the retrospective from 9 to 10, #13 from 10 to 11), and a gate edit touches no directory this step lists, so no Docs entry would flag the stale number (#51, R1-1)
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README"
- A prose step whose text holds a backticked span is inside the stamp: adding this step moved the hash, and the restamp went in the same commit (#13)
- Point 7 of the unattended section keeps its "Steps … stay as written" sentence first on its line and says "gate step" in lower case after it: `redline-setup.sh unattended` reads the fill-ins back by leftmost match, so an earlier capital "Step" on that line would be read as the fill-in (#13)

**Applies to:** each task names README "Launching" or its reason.

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

**Applies to:** the proposed list in `shape.md`.

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

**Applies to:** the spec folder, the R1-6 prompt clauses, the commit messages.
