# Standards for PR #12 review round 1

Shaped by Redline in unattended mode.

The following standards apply to this work, as they read at shaping time (the PR's head, b5c9f97). The proposed edits to them are in `shape.md`, under "Standards retrospective (proposed)".

---

## scripts/bash-conventions

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- `bash -n` reads its first file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (#5, R1-3)
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it. A field added to `checks.sh`'s JSON, or a limit changed in it (`run_check` in `scripts/checks-template.sh`), updates the README's output contract in the same change, and a flag that reports a cut is set by every limit that can cut (#7, R1-14). `checks.sh`'s whole JSON stays bounded however many checks fail: the failing checks share one output budget, split evenly among them in a final pass after every check has run, never consumed in run order, because the checker may not Read a result that spills to a file (#7, R1-13)
- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling
- A script only a skill calls (`redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`) needs no guard group: the guard's default deny refuses it to every role, and `tests/guard-cases.tsv` rows pin it as the skill's (#6); when one of its subcommands is reserved for a person, its rule in the shared allow list (`templates/settings.allow.json`, and the repository's `.claude/settings.json`) names only the subcommand the skill runs unprompted (`Bash(/*/scripts/redline-gate.sh check *)`), so the reserved one stays behind the permission prompt (#7, R1-9); `redline-setup.sh`'s subcommands all write a person's files, so it has no allow-list rule at all, and the permission prompt is the person's confirmation (#6)
- A generator that writes a file from a template (`redline-setup.sh checks` from `checks-template.sh`) splices by anchor lines and exits 1 naming a missing one, so the template and the generator cannot drift apart silently, and its output is deterministic: the same input gives the same bytes, and nothing is written when they are unchanged (#6)
- A script that edits a person's file (`.gitignore`, `shape-spec.md`, `settings.json`) preserves a byte-order mark and the file's line endings, writes only when the bytes change and reports `changed: false` otherwise, so a rerun can say nothing drifted; a JSON file is compared with `jq -S`, since a CLI that rewrites it (`claude plugin install`) reorders keys and that is not drift (#6)
- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`
- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)
- A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)
- A script that chooses which part of a file to hash refuses when more than one part qualifies, naming each by line, rather than taking the first: a silent switch moves the hash onto the wrong text and every later check passes against it (#7, R1-6)
- Never print a token, a header or an environment dump; `redline-gh.sh` leaves authentication to `gh`
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash

**How it applies:** R1-2 (a writing subcommand's `--dry-run`), R1-3 and R1-4 (a script that edits a person's file), R1-6 (the generator), R1-7 (the header is the documentation and the README quotes it), R1-8 (the skill-only bullet, pending).

---

## testing/tests

# Tests

Five harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input Claude Code would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 350 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- `tests/gate-test.sh` over `tests/gate-fixtures/`: the gate parser and the stamp of `scripts/redline-gate.sh`, on one synthetic `shape-spec.md` per gate shape seen so far, mutated with `sed` and `awk` in the temp directory; the fixture hashes are pinned inline, and the last case checks this checkout's own stamp (#6)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- `.claude/redline/checks.sh` carries the gate stamp (`# redline-gate:`); a change to the backticked text of the gate list in `shape-spec.md`, or to how `scripts/redline-gate.sh` computes the hash or writes the stamp line, restamps it in the same commit, and the gate test's last case proves it (#6; #7, R1-1). `checks.sh` is generated: a change to a check edits `.claude/redline/checks.json` and regenerates with `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` in the same commit, never a hand edit, and the setup test's last cases prove the two agree (#6)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout
- A stand-in checkout (a copy of the working tree made to prove a rerun or a fresh setup) goes outside the temp directory: the guard's `TMP` prefix lets every role write there, so the guard test's write rows show false allows from a checkout under it (#6)
- The gate records its baseline time in `.claude/redline/checks.sh`'s header; a test that doubles it says why in its own header

**How it applies:** every fix adds setup cases beside a neighbour that must not change, red before green where the bug reproduces on this machine; the dogfood cases constrain every edit (none may move the generated bytes); R1-1 (pending) turns on the dogfood bullet; R1-9 is a fixture mutation.

---

## scripts/guard

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- The table at the top of the script is the policy: one line per role, its command groups and its write prefixes, both literal. A command a role newly needs is a new member of a group, never a looser parse
- Default deny: a command the classifier cannot place is refused. `bash` only as `bash -c <string>`, checked recursively; interpreters (`python3`, `node`, `php -r`), `gh`, `curl`, `eval`, `source` and `sudo` are refused for every role
- Write targets are checked, not only command names: redirections, `tee`, `sed -i`, `mv`, `cp`, `rm`, `mkdir`, `touch`, `git add` paths, `find -exec` and process substitutions all go through `writable()`
- Redline never edits Redline: the plugin's directory, `.claude/redline/`, `.claude/redline*.json`, `.claude/settings*.json` and the `.claude/{agents,workflows,skills}/redline*` copies are refused for every role, and so is a write that would take a directory holding one of them along (`rm -rf .claude`)
- When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the plugin's source is repository content under the roles' usual prefixes, except `scripts/redline-guard.sh` and `hooks/hooks.json`: the guard that vets the run is changed by a person, never by a Redline role (#4). A finding there is deferred, mitigated by a pinned `tests/guard-cases.tsv` row or a Known limits line, and a person makes the change after the run (#5, R1-1). The same holds for a finding whose fix needs `.claude/redline/checks.sh` restamped, which no role may write: one that changes the gate's backticked text, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line. It is deferred with a Known limits line, and a person makes the change and restamps (#7, R1-1, R1-2). A finding whose fix changes `.claude/redline/checks.sh`'s own lines, with no restamp, is deferred the same way: the run fixes `scripts/checks-template.sh` and the README, and a person carries the same lines into `checks.sh` (#7, R1-14). `checks.sh` is generated from `.claude/redline/checks.json`, which no role may write either: a finding whose fix changes a check is deferred the same way, and a person edits `checks.json`, regenerates and restamps (#6)
- Protected paths are compared case-folded: the default macOS volume is case-insensitive, so `Scripts/redline-guard.sh` is the guard. Folding only ever refuses more; the prefix checks and the self-hosted test stay as spelled, which fails closed (#5, R1-4)
- What the guard allows it also approves (`permissionDecision: allow`), so a role never meets a permission prompt for a vetted command and the shared `settings.json` carries no git write rule
- Every change to the guard adds or changes a row in `tests/guard-cases.tsv` in the same commit, with the `agent_type` Claude Code sends, beside a row for the neighbouring decision that must not change (`allow Write REPO/scripts/redline-guard.sh` in an ordinary repository, next to the self-hosted `deny`)
- An agent's prompt tells it the shape of a command the guard accepts: no `$`, no backticks, no process substitution, one command per call, redirection only into the temp directory. When a prompt and the table disagree, the table wins and the prompt is fixed
- A Redline role is identified by `agent_type` alone (`redline:redline-<role>`, or `redline-<role>` for a copy under `.claude/agents/`); anything else, the main session included, leaves the guard inert with no output
- A guard denial is a sentence a person can act on: which file or command, which rule, and for the self-hosted files, who changes them

**How it applies:** R1-1 (pending): the self-hosted bullet's #7 R1-14 sentence is what the dogfood case now contradicts. R1-8 (pending): option (a) needs a line in `.claude/settings.json`, which no role may write. Every planned task stays out of `.claude/redline/` and `.claude/settings.json`; no guard change.

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
- (One bullet, which model tier each role runs on, is left out of this copy: it does not bear on this round. It reads in full in `agent-os/standards/workflow/agents.md`.)
- A role that finds a problem with its own instructions (a command the guard refuses, a file that does not exist) reports it in its JSON rather than working around it

**How it applies:** R1-1, R1-5 and R1-8 are returned as judgment calls with stories, options and recommendations; every decided entry in `shape.md` names its owner. The plan's commands are spelled as the implementer's guard accepts them.

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 8 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

**How it applies:** gate step 8; the proposed list in `shape.md` holds three edits now and three held for the pending decisions. No heading changes and no new standard file.

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)

**How it applies:** nothing in this spec folder, the planned commits or the code comments names a model or a vendor.
