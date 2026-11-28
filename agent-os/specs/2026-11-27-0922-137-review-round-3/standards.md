# Standards for PR #137 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `9532f9d`, after round 2's retrospective (`52c1d04`) and before this round's. For a long file, the lines the round applies are copied, a long one in part, as earlier review rounds did; `[...]` marks a cut.

---

## workflow/agents (applied lines, in part)

Line 3 (the roles are the files under `agents/`, which R3-4's list names):

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

Line 16 (R3-2: the refusal line says when it fires in the words of the decision behind it):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1); [...] and a line returned for more than one case states only what holds in each and leaves the next step to the reader that can tell them apart: the workflow's startup version refusal, which cannot tell a fresh launch from a relaunch, told a refused fresh launch to start fresh in the session that would refuse it again, until #137, R1-8

Line 17 (R3-2: the copy rule changed everywhere it is stated; R3-6: the docblock and the test comment):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`): [...] and an exception a change adds to a rule is stated wherever the rule is, every section of the docs included [...]

Line 45 (R3-2; standards item 1):

- An agent file cannot be pinned: an agent type resolves only from the session's registry, read at session start and again at `/reload-plugins` or a reopen, when it follows whichever install is then listed first (measured on 2.1.332, #135; first headless under `--plugin-dir`, 2.1.322, #81), and a copy run without its type is `workflow-subagent` to the hook, outside the guard. An installed release's agents come from the same directory as its workflow, so another release's agents arrive only with another version, which a relaunch refuses (#135), and a checkout and a release at one version are two builds, so `run drift` compares the agent files of the copy the run launched from (`args.pluginRoot`) with the session's whenever the two are different directories, and refuses the relaunch when they differ or the launch's copy is gone: compared only by version and workflow file, a reopen across the two ran the launch's script under the other copy's agents with no word (#137, R1-3); an agent file there is a `*.md` file under `agents/` whose path has no part that starts with a dot, one rule that both the copy comparison and the #81 list of changed agent files read: compared as whole directories, a `.DS_Store` or an editor's backup in one copy refused a relaunch that would have run (#137, R2-1); and `run check` makes the same comparison as its `copy` reason, through the helper `run drift` calls, since a resume of a hand-off or a review stop presents every call before `run drift` runs, and R1-3 had put the comparison in `run drift` alone (#137, R2-3); a script run from the harness's copy under another copy's agents mixes the two, the replayed steps one copy's and the rerun ones the other's. A changed agent file is reported (the skill's line, the handoff comment), never worked around (#81)

---

## workflow/replay (applied lines)

Line 23 (R3-3: the script a relaunch runs, and the pin compared with the live file):

- A relaunch runs the script the run launched with, or it does not run, on every repository (`redline-prefs.sh run drift --plugin <the session's copy>`). By name while the session's copy's `workflows/redline-loop.js` equals the copy the harness persisted; from that copy (as `scriptPath`) once it differs, since a checkout loaded in place can change while it reviews any repository; and, with no persisted copy (a launch by the `scriptPath` fallback ran the file itself), by name while the file's blob id is the launch's and refused once it is not. The harness's copy holds what the launch ran, which in a live session is the workflow it loaded even after the file on disk changed, so it is compared with the live file, never with the blob the launch recorded from disk. Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. [...] Measured on 2.1.332, interactive and headless (#135); first headless under `--plugin-dir` on 2.1.322 (#81)

Line 24 (R3-2: both gates refuse another build; standards item 2 goes in it):

- A run never relaunches under another version. The skill records the version it starts under and its workflow file's blob id as `args.launch`, once, at launch; `run check` and `run drift` refuse a resume or a relaunch when the session's copy holds another version, or the marker holds no launch; and the workflow refuses at startup when its `REDLINE_VERSION` is not `args.launch.version`, before any agent and before every other args check, so args an older skill built get the version line rather than a throw about a field this build requires. Only the script that runs can see a switch: a session runs the install listed first among those it sees, another process's install or update reorders the list, a reload or a reopen resolves the name afresh, agents with it, and the skill's text already in the conversation keeps the root it was expanded with. `args.launch` is read at startup only, never in a prompt, and the sweep proves no prompt changed (#135, Losers League #839)

---

## scripts/bash-conventions (applied lines)

Line 8 (Task 3: `agent_paths` runs inside `$(...)` with `-e` off, and its caller reads what it printed):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. [...] A function run inside `$(...)` runs with `-e` off (bash clears it there outside POSIX mode, and no script here sets `inherit_errexit`), so a failing command inside it does not stop it and its last command's status is the substitution's: what it printed is checked before it is used. [...]

Line 11 (R3-2's line and R3-4's list: every description of what a subcommand prints is reworded):

- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1); and an exit code a change adds to a subcommand the skill calls gets the skill's instruction for it in the same change: #135 documented `run check`'s exit 2 (no `--plugin`, or a manifest with no version) while the skill's resume handled only 0 and 1, and the skill's sentence for `run drift`'s exit 2 named only a missing marker, until #137, R2-5

Line 29 (R3-2: two copies compared by physical path; standards item 3 goes after it):

- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)

Line 43 (`read -d`, `find`, `ln -s` in the harness, BSD and GNU alike):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, and every code `.shellcheckrc` disables names the line that needs it (#17). [...] and `checks.sh` does not run shellcheck, so a gate that passes on a developer's machine or in a Redline round can still push a warning CI fails on [...]

---

## testing/tests (applied lines)

Line 13 (R3-2's real path pinned at `run check` as well as `run drift`):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); [...]

Line 30 (a case per changed surface and its neighbour; a case per form, R3-4's names):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 35 (red before green; R3-2's link spelling and R3-6's two installs, which hold before, seen red under a mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. [...] a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed); and a red count a spec records is the harness's own summary line, read off the run: one that was not read is measured again from the commits, the task's committed test against the tree before it, and the record says so (the follow-up of #127)

Line 39 (the new fixtures, links and odd names included, are written under the temp directory):

- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9); a case over this checkout's own files that calls a writing subcommand passes `--dry-run`, so a missing file reads red instead of being written back into the tree (#63, R1-3)

---

## process/docs-gate (applied lines)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 16:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied line, in part)

Line 5:

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` and `REDLINE_VERSION` at the top of `workflows/redline-loop.js` carry the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
