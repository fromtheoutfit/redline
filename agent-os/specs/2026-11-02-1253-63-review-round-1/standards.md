# Standards for PR #63 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time. `testing/tests`, `workflow/replay` and `scripts/bash-conventions` are long and mostly about other surfaces, so only the bullets this round touches are quoted; the full files are under `agent-os/standards/`.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository. […]
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6), and prove this checkout's two alias files under `.claude/commands/` equal their templates (#44)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9)

---

## workflow/replay (excerpt)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
- On an interactive relaunch the harness relays the person's last typed message to every agent with precedence over its task; an `AskUserQuestion` pick is not relayed and a headless session relays nothing. The skill relaunches only from `relaunch` typed alone or a line holding only a Redline command, the namespaced form or the `/redline` alias a repository's `.claude/commands/` provides, and `RUN_LINE` names both lines and both forms (#60, #44)

---

## scripts/bash-conventions (excerpt)

- A file setup writes verbatim from a template (`redline-setup.sh command`, the alias command files under `.claude/commands/`) carries a marker line naming the template, and a rerun compares bytes: equal is `unchanged`, different with the marker is `differs` (exit 1, the unified diff in the JSON, `--force` rewrites), and a file of that name without the marker is a person's own, `foreign`, never written whatever the flags (#44)

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
