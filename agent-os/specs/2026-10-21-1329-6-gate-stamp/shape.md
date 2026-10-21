# #6, first half: the gate stamp — Shaping Notes

## Scope

Issue #6 asks for `/redline:setup` and for a gate stamp that lets a launch refuse a `checks.sh` whose Verification Gate has moved. The owner split it: this spec ships the stamp (`scripts/redline-gate.sh extract|stamp|check`, `tests/gate-test.sh` with fixtures for the gate shapes seen so far, the check as the first step of the main skill's precheck, the template and README updates, and this repository dogfooding it with a sixth gate step and a stamped `checks.sh`). The setup skill is the second spec on #6, after this PR merges.

## Investigation

- The launch precheck is prose in `skills/redline/SKILL.md` section 4 (lines 69 to 81); no script runs it and `workflows/redline-loop.js` checks only its own `args` and the PR state in `gather()`. So the stamp check is one more precheck item, fresh launches only, and the loop and `tests/loop-test.mjs` are untouched.
- `scripts/redline-guard.sh` `script_name()` (lines 473 to 483) knows `checks.sh` and `redline-gh.sh` only; any other plugin script, `redline-prefs.sh` today and `redline-gate.sh` tomorrow, ends at default deny for every role, and the main session is not a role, so the guard is inert for the skill's call. No guard change; the decision is pinned with rows beside the prefs rows (`tests/guard-cases.tsv`, Step 13).
- `.claude/redline/` is refused for every role (guard lines 190 to 192), so no Redline run can restamp `checks.sh`. A finding whose fix changes the gate's backticked text is therefore a `defer` in a run here, like a guard finding (unattended point 11).
- Three gate shapes exist. This repository and Chalkboard: a top-level `## Verification Gate` section (`shape-spec.md` lines 234 and 230) preceded by a decoy `## Task N: Verification Gate` heading inside the Step 7 plan-template fence with prose only. Losers League: the gate is `## Task N (FINAL — ALWAYS INCLUDED): Verification gate` inside that fence (line 266, fence 243 to 286), with four steps, and a later prose-only `## Verification Gate` inside the shape.md template fence (line 404). Chalkboard's steps 4 and 6 hold indented fenced multi-line commands; its step 2 has sub-bullets with backticked commands; this repository's step 5 has an indented continuation line with a dated timing sentence and step 6 a nested `1.` to `5.` list.
- Classification by rule is fragile: Losers League's retrospective step holds `Standards retrospective: no changes` in backticks (a span with spaces), and this repository's Guard step leads with `tests/guard-test.sh` (no space). Hence decision 1.
- The unattended section's point 7 holds a machine-findable `(gate steps M to N` parenthetical in all three files (`1 to 5`, `1 to 7`, `1 to 3: ...`), the default for the stamp's `steps m-n`.
- `scripts/checks-template.sh` prints its header with `sed -n '2,27p'`, a numeric range that rots on every header edit: Chalkboard's copy prints `2,19p` against a 23-line header already. The template moves to `sed -n '2,/^$/p'`.
- `tests/prefs-test.sh` is the harness shape to copy (`set -uo pipefail`, `mktemp -d`, `ok`/`bad`, `N passed, 0 failed`); `scripts/redline-guard.sh` is the pattern for `python3 -I -c "$PYTHON"` fed on stdin.
- No "upgrade notes" exist in the README; an Upgrading subsection is added under Install.

## Unattended answers

Not a Redline run; shaped by a person in plan mode, with two rounds of questions to the owner.

## Decisions

- **Hash scope: every backticked span and fenced block in the whole gate section**, in document order, nested sub-bullets included, whitespace-normalised. Prose edits never change it; any backticked change does. Classification into command and prose steps happens only at setup, where a person confirms it, and never touches the hash; the stamp's `steps m-n` is for the reader. A false positive costs a restamp; a false negative is the drift the stamp exists to catch, so the hash errs toward firing. decided by: @michaelfromtheoutfit
- **A `checks.sh` without a stamp stops the launch**, with the same message shape as a mismatch: a stamp that is optional guards nothing. Chalkboard and Losers League break the moment this merges, until each is stamped once by hand; the README's Upgrading note says so. decided by: @michaelfromtheoutfit
- **Gate stamp first, setup skill later.** This spec ships the script, its test, the precheck, the dogfood step and the template and README updates; `/redline:setup` is the second spec on #6. Until it exists an existing repository is stamped with `scripts/redline-gate.sh stamp` by hand, and the check's failure line says so. decided by: @michaelfromtheoutfit
- **The check runs in the skill's precheck, fresh launches only.** Relaunches keep skipping the precheck; the next fresh launch catches a mid-run gate edit. No workflow or loop-test change. decided by: @michaelfromtheoutfit
- **Three fixtures, synthetic and trimmed**, one per shape (`plugin-shape.md`, `laravel-shape.md`, `fenced-shape.md`), rather than verbatim copies of the model repositories' files. decided by: redline
- **`extract` exits 1, not 2, when the file has no gate**: a missing section is a failed answer, not a bad invocation; `check` exits 1 when the stamped path is missing for the same reason, and 2 only when `checks.sh` itself is missing. decided by: redline
- **`stamp` warns about a numeric `--help` range and does not edit it**: one visible change per invocation in a file the person owns. decided by: redline
- **Gate step 6 is named "Gate stamp"** and its last test case checks this checkout's own stamp, so any backticked edit to the gate list here is followed by a restamp in the same commit. decided by: redline
- **Product docs**: roadmap Phase 1 gains item 7, "Setup and the gate stamp (#6)", naming both halves; tech-stack's step count becomes six. decided by: @michaelfromtheoutfit

### Proportionality

Likely and visible: a gate step added to any repository's `shape-spec.md` leaves `checks.sh` passing without it, silently, on every later run; Losers League's port already showed the gate and CI disagreeing. Cost: one script, one test harness with fixtures, one precheck line, template and documentation edits, and a sixth check here that runs in under a second. Fix.

## Deferred

- **`/redline:setup`** (the second spec on #6): the interactive walk, the rerun diff of command lists, and rewording the check's two failure lines to name the command.

## Context

- **Visuals:** None
- **References:** see `references.md`
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 7 (added by this spec)

## Standards Applied

- scripts/bash-conventions — the script's header, exit codes, stdin-fed python, jq for JSON
- testing/tests — a fourth harness, red before green, writes only under the temp directory
- scripts/guard — no guard change; the skill-only script is pinned with rows beside the prefs rows
- prompts/attribution — nothing in these files names a model or vendor
- process/internal-notes — the README carries the operating text; the rationale stays in the internal record
- workflow/agents — the shaper's unattended point 11 gains the stamp as a thing no role may write
- workflow/replay — the check runs before launch and never enters `args`, so relaunches are unchanged
- process/standards-retrospective — the step number it cites moves from 6 to 7

## Standards retrospective

Items: the four owner decisions above, the four of Redline's own, and two checks that went red during the build and were fixed by learning something: git's toplevel is a physical path while `pwd` is logical (`/var` is `/private/var` on macOS), which broke the repo-relative stamp path; and a comparison of two empty outputs passed vacuously until one side was pinned to a literal. Approved by the owner and applied in their own commit:

- `testing/tests.md`: four harnesses; a bullet for `tests/gate-test.sh`; "a gate case"; the empty-outputs bullet; the stamp bullet. `index.yml`'s description lists the fourth harness.
- `scripts/bash-conventions.md`: `redline-gate.sh` in the script list; a skill-only script needs no guard group; `pwd -P` before comparing with git's toplevel; `--help` prints `sed -n '2,/^$/p'`.
- `process/standards-retrospective.md`: gate step 6 becomes 7.

Deviations from the shaped plan (gate step 8): three fixtures rather than two, one per shape (recorded above); the two model repositories were stamped on temp copies of their files, not in place, since their trees are the person's (the README's Upgrading note is the instruction). decided by: redline
