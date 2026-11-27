# Standards for PR #137 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `704bbaf`, after round 1's retrospective (`752840e`) and before this round's. For a long file, the lines the round applies are copied, a long one in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied lines, in part)

Line 3 (R2-1: what an agent file is):

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

Line 17 (R2-6: the order is changed everywhere it is stated; R2-1: both readers of agent files):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a step that gains a second time to run is restated with both wherever its time is named, the agent file included: #95's end-of-run filing at Finish reached `docs/running.md` and not the GitHub agent's defer operation, which still said it ran before the push, until #97, R3-1 [...]

Line 45 (R2-1, R2-3; standards item 1):

- An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start and again at `/reload-plugins` or a reopen, when it follows whichever install is then listed first (measured on 2.1.332, #135; first headless under `--plugin-dir`, 2.1.322, #81), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. An installed release's agents come from the same directory as its workflow, so another release's agents arrive only with another version, which a relaunch refuses (#135), and a checkout and a release at one version are two builds, so `run drift` compares the agent files of the copy the run launched from (`args.pluginRoot`) with the session's whenever the two are different directories, and refuses the relaunch when they differ or the launch's copy is gone: compared only by version and workflow file, a reopen across the two ran the launch's script under the other copy's agents with no word (#137, R1-3); a script run from the harness's copy under another copy's agents mixes the two, the replayed steps one copy's and the rerun ones the other's. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)

---

## workflow/replay (applied lines)

Line 23 (R2-6: the script a relaunch runs, on every repository):

- A relaunch runs the script the run launched with, or it does not run, on every repository (`redline-prefs.sh run drift --plugin <the session's copy>`). By name while the session's copy's `workflows/redline-loop.js` equals the copy the harness persisted; from that copy (as `scriptPath`) once it differs, since a checkout loaded in place can change while it reviews any repository; and, with no persisted copy (a launch by the `scriptPath` fallback ran the file itself), by name while the file's blob id is the launch's and refused once it is not. The harness's copy holds what the launch ran, which in a live session is the workflow it loaded even after the file on disk changed, so it is compared with the live file, never with the blob the launch recorded from disk. Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch: it runs with no prompt in auto and bypass-permissions, asks once per relaunch in manual and accept-edits, and is denied in don't-ask and in a headless session outside auto and bypass. Measured on 2.1.332, interactive and headless (#135); first headless under `--plugin-dir` on 2.1.322 (#81)

Line 24 (R2-3, R2-6: both gates refuse another build; standards item 2 goes after it):

- A run never relaunches under another version. The skill records the version it starts under and its workflow file's blob id as `args.launch`, once, at launch; `run check` and `run drift` refuse a resume or a relaunch when the session's copy holds another version, or the marker holds no launch; and the workflow refuses at startup when its `REDLINE_VERSION` is not `args.launch.version`, before any agent and before every other args check, so args an older skill built get the version line rather than a throw about a field this build requires. Only the script that runs can see a switch: a session runs the install listed first among those it sees, another process's install or update reorders the list, a reload or a reopen resolves the name afresh, agents with it, and the skill's text already in the conversation keeps the root it was expanded with. `args.launch` is read at startup only, never in a prompt, and the sweep proves no prompt changed (#135, Losers League #839)

---

## scripts/bash-conventions (applied lines)

Line 8 (Tasks 2 and 4: `agent_list` and `copy_line` run inside `$(...)` with `-e` off, and their callers read what they printed):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header. Under `set -e` a command substitution that fails exits with its command's own status, so a documented exit code holds only where each such call is guarded (`found="$(gh issue list …)" || { echo '…' >&2; exit 1; }`): `defer` exited 4 on a gh that needed a login, while its header said 1, until #97, R4-1. A function run inside `$(...)` runs with `-e` off (bash clears it there outside POSIX mode, and no script here sets `inherit_errexit`), so a failing command inside it does not stop it and its last command's status is the substitution's: what it printed is checked before it is used. [...]

Line 11 (R2-3's `copy` reason, R2-5's exit 2s; standards item 4):

- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)

Line 28 (R2-2, Task 3; standards item 3):

- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`

Line 29 (R2-4's second look: the skill's `repoRoot` is already physical):

- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)

Line 43 (Tasks 2 and 4: `find`, `sort`, `cmp` and `case` under bash 3.2 and BSD tools; shellcheck left to CI):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, and every code `.shellcheckrc` disables names the line that needs it (#17). [...] Until the gate runs it (the issue drafted in that spec), run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, before a push that changes a `.sh` file, and count files with a glob, never `ls | grep` (SC2010)

---

## testing/tests (applied lines, in part)

Line 13 (Task 4, case (e): R2-1's rule pinned at the second gate):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); and a call site pinned only with input the function returns unchanged is not pinned: the handoff's Deferred line under a repository rule was checked with `title R1-2`, which `postedText` returns as it is, so dropping the call there stayed green until a title with a tag and an `@` was pinned (#89, R3-2); and a message the workflow words two ways by a condition is pinned in each wording: the commit-of-its-own warning's decided form was pinned by no check until #103, R1-12

Line 30 (every task: a case per changed surface, with its neighbour; Task 2's case per clause of the rule):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 35 (every task: red before green, and the pins that hold before seen red under a mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed); and a red count a spec records is the harness's own summary line, read off the run: one that was not read is measured again from the commits, the task's committed test against the tree before it, and the record says so (the follow-up of #127)

---

## process/docs-gate (applied lines)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 16 (Tasks 2 and 4: `docs/scripts.md`):

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied line)

Line 5 (the gate's Version step: no bump in a review round):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` and `REDLINE_VERSION` at the top of `workflows/redline-loop.js` carry the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
