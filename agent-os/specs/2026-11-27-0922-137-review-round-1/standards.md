# Standards for PR #137 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `57234d0`, before this round's retrospective. For a long file, the lines the round applies are copied, a long one in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/replay (applied line)

Line 24 (R1-8, Task 7: the refusal is read at startup only, and its line is no prompt):

- A run never relaunches under another version. The skill records the version it starts under and its workflow file's blob id as `args.launch`, once, at launch; `run check` and `run drift` refuse a resume or a relaunch when the session's copy holds another version, or the marker holds no launch; and the workflow refuses at startup when its `REDLINE_VERSION` is not `args.launch.version`, before any agent and before every other args check, so args an older skill built get the version line rather than a throw about a field this build requires. Only the script that runs can see a switch: a session runs the install listed first among those it sees, another process's install or update reorders the list, a reload or a reopen resolves the name afresh, agents with it, and the skill's text already in the conversation keeps the root it was expanded with. `args.launch` is read at startup only, never in a prompt, and the sweep proves no prompt changed (#135, Losers League #839)

---

## workflow/agents (applied lines, in part)

Line 16 (R1-8, Task 7; standards item 2):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1); and a stop's message says what its rule asks of the case that reached it [...]

Line 17 (R1-6, Task 5):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]

Line 45 (R1-3, Task 3; standards item 1):

- An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start and again at `/reload-plugins` or a reopen, when it follows whichever install is then listed first (measured on 2.1.332, #135; first headless under `--plugin-dir`, 2.1.322, #81), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. An installed release's agents come from the same directory as its workflow, so another release's agents arrive only with another version, which a relaunch refuses (#135); a script run from the harness's copy under another copy's agents mixes the two, the replayed steps one copy's and the rerun ones the other's. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)

---

## scripts/bash-conventions (applied lines)

Line 8 (R1-4, Task 4: the fallback, the caller's check over the whole text, and the whole-stream early check; standards item 3, with plan adjustment 1's sentences on the jq versions and the whole stream):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header. Under `set -e` a command substitution that fails exits with its command's own status, so a documented exit code holds only where each such call is guarded (`found="$(gh issue list …)" || { echo '…' >&2; exit 1; }`): `defer` exited 4 on a gh that needed a login, while its header said 1, until #97, R4-1. A function run inside `$(...)` runs with `-e` off (bash clears it there outside POSIX mode, and no script here sets `inherit_errexit`), so a failing command inside it does not stop it and its last command's status is the substitution's: what it printed is checked before it is used. `post-review` posted a review of one newline when the jq inside `place_comments` failed, until #112, R1-9. A check of what it printed cannot see a step that failed and left the last one a well-formed result to print, so such a function returns non-zero when a step fails and its caller reads the status as well: an empty kinds file made `place_comments` print every comment under 'The file is not in this pull request:', and `post-review` posted it and exited 0, until #112, R4-5. A documented exit code for an input the script cannot read holds only when the input's whole shape is checked before any jq reads a field of it, each element of a list included: `post-review` checked only that `comments` was an array, so a number in it reached the jq in `wanted_files`, which a plain function call under `set -e` turned into jq's exit 5 and message while the header promised one line and exit 2 (#112, R3-2); line 24 is the same rule for a validator [...]

Line 43 (R1-2, R1-3, R1-4: bash 3.2 and BSD tools; for R1-4, also the jq the gate's legs run, 1.7.1 as the plan approver read them, against this machine's 1.8.2):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, and every code `.shellcheckrc` disables names the line that needs it (#17). [...] Until the gate runs it (the issue drafted in that spec), run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, before a push that changes a `.sh` file, and count files with a glob, never `ls | grep` (SC2010)

Line 48 (R1-4, Task 4; standards item 4 goes after it):

- A read-only subcommand the launch precheck runs takes the repository root and answers every contract question in one call (`redline-setup.sh version <repoRoot>`: `checks.sh`, the unattended section, `settings.json`, the loaded copy and, since #135, the installs the repository sees), since the guard approves the main session by subcommand word (`version`) and a read-only flag on a writing subcommand (`unattended --version`, `settings --dry-run`) would stop at the permission prompt on every launch (#15)

---

## testing/tests (applied lines, in part)

Line 30 (every task: a case per changed surface, with its neighbour; Task 4's case per `tostring` clause):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 35 (every task: red before green; Task 4 names the jq version of each red):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed); and a red count a spec records is the harness's own summary line, read off the run: one that was not read is measured again from the commits, the task's committed test against the tree before it, and the record says so (the follow-up of #127)

Line 49 (R1-4, Task 4: the stub CLI):

- A script that reads the machine's own state through a CLI is pointed at a stub for every case of its harness by an environment override (`REDLINE_CLAUDE` in `tests/setup-test.sh`, a stub that serves `claude plugin list --json` from a file the case names), so no case reads the developer's installs; the code is also run once against the real CLI's output at the gate, and what that found is recorded in the spec: #135's run found a root that only another repository's install used counted as this session's (#135)

---

## process/docs-gate (applied lines)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 16 (Tasks 2, 3 and 4: `docs/scripts.md`):

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

Line 18 (R1-2, Task 2: where Claude Code keeps the record under `CLAUDE_CONFIG_DIR` is unmeasured, so the docs state only what the script does):

- A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it: the #81 spec recorded a pinned relaunch's permission prompt as unmeasured both in bypass-permissions and outside it, and `docs/running.md` and the skill's spoken line stated both as fact while Known limits listed only the second, until #91, R2-1

---

## process/release (applied line)

Line 5 (the gate's Version step: no bump in a review round):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` and `REDLINE_VERSION` at the top of `workflows/redline-loop.js` carry the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` [...]
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
