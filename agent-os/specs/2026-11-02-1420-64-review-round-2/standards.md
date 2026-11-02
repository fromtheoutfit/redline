# Standards for PR #64 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time. `testing/tests` and `scripts/bash-conventions` are long and mostly about other surfaces, so only the bullets this round applies are quoted; the full files are under `agent-os/standards/`.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)
- A merge case pins a conflict's extent, not only its count: #15's conflict case hand-edited one line, so its hunk was one line long and a whole-hunk conflict passed; a case with a one-sided change beside the conflicting line, picked both ways, proves a pick settles that line alone (#64, R1-1)
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9); a case over this checkout's own files that calls a writing subcommand passes `--dry-run`, so a missing file reads red instead of being written back into the tree (#63, R1-3)
- A version case derives the older and newer versions from the template's own `# redline-template:` line (`TV`, `TN` in `tests/setup-test.sh`), never spelling them, so a template bump changes no test (#50); the unattended section's cases derive theirs from `templates/shape-spec-unattended.md`'s marker the same way (`UV`, `UN`), and a case over `templates/history/` fails a bump that forgot to freeze the previous body, or froze the current one (#15); the one exception is the unattended body's pinned hashes: `tests/setup-test.sh` holds the sha256 of the body below the first `---` line for every version, the current template's and each frozen copy's (`ubody_pin`), so a body change that left the marker where it was, or an edit to a frozen copy, fails, and a bump adds its version's hash to the test, the visible reminder to freeze the previous body, the way `tests/gate-test.sh` pins its fixture hashes (#64, R1-2)

---

## scripts/bash-conventions (excerpt)

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, and every code `.shellcheckrc` disables names the line that needs it (#17). `.shellcheckrc` holds no severity: shellcheck 0.11.0 ignores a `severity=` key there and honours `-S`, so a severity in the rc file reads as set and is not (#47, R1-2)
- A template whose body a repository copies (`templates/shape-spec-unattended.md`) carries a version marker in the body (`<!-- redline-unattended: vN -->`, the section's first line); a body change bumps it and freezes the previous file under `templates/history/shape-spec-unattended.v<N-1>.md` in the same commit, and pins the new body's sha256 in `tests/setup-test.sh` (#64, R1-2), since an installed plugin has no git history to show from; a rerun merges three ways (the frozen base at the section's version, the repository's copy, the current template), every side with the wanted fill-ins applied first so fill-in phrases never conflict, keeping hand edits and deletions, merging a same-length hunk line by line (adjacent lines changed on different sides: Chalkboard's hand-edited story line beside the `why_human` line #49 changed), and asking on a line changed differently on both sides (`--pick <n>=ours|theirs`); that line alone is the conflict, so a pick never settles the lines beside it (#64, R1-1); a section with no marker is matched to the nearest body and reported as guessed; the marker is bumped alone only on `--keep`, so the launch keeps warning otherwise (#15)

---

## process/docs-gate

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

---

## process/standards-retrospective

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

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
