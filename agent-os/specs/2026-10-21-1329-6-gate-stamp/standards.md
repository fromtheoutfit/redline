# Standards for the gate stamp (#6, first half)

The following standards apply to this work, as they read when the spec was shaped (before the retrospective). If this spec changed any of them, `shape.md`'s Standards retrospective says which and why; this file is the snapshot, not the current text.

---

## process/internal-notes

# Internal notes

This is the public repository: it carries the tool and its operating documentation, never the design record.

- Step notes, spike notes, API notes and the design document live in the private sibling repository `redline-internal` (`DESIGN.md`, `docs/`). A spec here may cite one by file name; it never copies the text in
- `README.md` is the only long-form document here: what an agent or a teammate needs while a run is going (install, settings, the commit rules, `checks.sh`, `redline-gh.sh`, the snapshot). A rationale goes to the internal repository; a rule goes to a standard
- Seed PRs and their answer keys live outside this repository, so a reviewer cannot read the answers
- `agent-os/specs/` holds the specs of changes to this repository, including the rounds Redline runs on itself. They are public and carry no attribution and no private detail (no token, no cost figure, no person's name beyond a GitHub login where a decision names its owner)

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 6 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)

---

## scripts/bash-conventions

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- `bash -n` reads its first file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (#5, R1-3)
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it
- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling
- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`
- Never print a token, a header or an environment dump; `redline-gh.sh` leaves authentication to `gh`
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash

---

## scripts/guard

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- The table at the top of the script is the policy: one line per role, its command groups and its write prefixes, both literal. A command a role newly needs is a new member of a group, never a looser parse
- Default deny: a command the classifier cannot place is refused. `bash` only as `bash -c <string>`, checked recursively; interpreters (`python3`, `node`, `php -r`), `gh`, `curl`, `eval`, `source` and `sudo` are refused for every role
- Write targets are checked, not only command names: redirections, `tee`, `sed -i`, `mv`, `cp`, `rm`, `mkdir`, `touch`, `git add` paths, `find -exec` and process substitutions all go through `writable()`
- Redline never edits Redline: the plugin's directory, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json` and the `.claude/{agents,workflows,skills}/redline*` copies are refused for every role, and so is a write that would take a directory holding one of them along (`rm -rf .claude`)
- When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the plugin's source is repository content under the roles' usual prefixes, except `scripts/redline-guard.sh` and `hooks/hooks.json`: the guard that vets the run is changed by a person, never by a Redline role (#4). A finding there is deferred, mitigated by a pinned `tests/guard-cases.tsv` row or a Known limits line, and a person makes the change after the run (#5, R1-1)
- Protected paths are compared case-folded: the default macOS volume is case-insensitive, so `Scripts/redline-guard.sh` is the guard. Folding only ever refuses more; the prefix checks and the self-hosted test stay as spelled, which fails closed (#5, R1-4)
- What the guard allows it also approves (`permissionDecision: allow`), so a role never meets a permission prompt for a vetted command and the shared `settings.json` carries no git write rule
- Every change to the guard adds or changes a row in `tests/guard-cases.tsv` in the same commit, with the `agent_type` Claude Code sends, beside a row for the neighbouring decision that must not change (`allow Write REPO/scripts/redline-guard.sh` in an ordinary repository, next to the self-hosted `deny`)
- An agent's prompt tells it the shape of a command the guard accepts: no `$`, no backticks, no process substitution, one command per call, redirection only into the temp directory. When a prompt and the table disagree, the table wins and the prompt is fixed
- A Redline role is identified by `agent_type` alone (`redline:redline-<role>`, or `redline-<role>` for a copy under `.claude/agents/`); anything else, the main session included, leaves the guard inert with no output
- A guard denial is a sentence a person can act on: which file or command, which rule, and for the self-hosted files, who changes them

---

## testing/tests

# Tests

Three harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input Claude Code would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 346 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check or a prefs case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout
- The gate records its baseline time in `.claude/redline/checks.sh`'s header; a test that doubles it says why in its own header

---

## workflow/agents

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Frontmatter carries `model` (overridden per call from `.claude/redline.json`) and `disallowedTools` as whole tools. Per-command limits are the guard's job: `Bash(git push *)` in `disallowedTools` would remove all of Bash, and a plugin agent's own `hooks` are ignored
- A prompt opens with "This is a Redline agent run on pull request #N" and names the plugin's README path for the git rules. The agent file holds the role; the workflow's prompt holds the round's inputs
- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text. The checker's pass or fail comes from `checks.sh`'s JSON (`ok`, `unexpected_files`, `uncommitted`)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), or `decided by: redline (autopilot)`
- A role's prompt names only the commands the guard allows it, in the exact spelling the guard accepts (`<plugin>/scripts/redline-gh.sh diff <pr>`, `vendor/bin/pest <file>`)
- Haiku for the roles that move files and post (github, checker); Opus for the ones that read code (reviewer, plan approver); the revise model is picked at launch and saved per person
- A role that finds a problem with its own instructions (a command the guard refuses, a file that does not exist) reports it in its JSON rather than working around it

---

## workflow/replay

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- The skill relaunches with byte-identical `args` plus only what the stop asked for, and `resumeFromRunId` set to the run id it recorded at launch. A run the harness stopped is relaunched the same way with nothing added
- A prompt names its inputs by path (`<specFolder>/redline/round-1-findings.json`), not by content, wherever the content can change between launches
- The GitHub agent never posts a round-N review when one already exists on the PR (`redline-gh.sh has-review`), so a fresh run after a lost session cannot double-post
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
