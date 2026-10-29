# Gate step: every spec names the README and template changes it needs (#13)

Spec folder: `agent-os/specs/2026-10-29-1559-13-docs-gate-step/`

Shaped by hand on 2026-10-29 with `/agent-os:shape-spec`; the person makes the commits. Issue #13 is the source of truth; the nine decisions in the shaping prompt are listed under Decisions as amended.

## Context

This repository is public and the README is the only thing a visitor reads. Specs #5, #7 and #12 updated it because their plans happened to list it; nothing checked. Issue #13 adds a prose **Docs** step to the Verification Gate in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under the plugin's directories, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template) that describes it, and either the commit that updated it or "no reader-facing change" with the reason. The shaper applies it when writing the plan; the Redline reviewer treats a missing entry as a nit; the rule becomes a standard so the retrospective can refine it.

What the survey established (by reading and by `redline-gate.sh extract` on scratch copies, nothing changed in the tree):

- The gate today has 11 steps; the stamp in `.claude/redline/checks.sh:44` reads `steps 1-9 sha256:3ec7834b…`, and `scripts/redline-gate.sh check .` exits 0 (`reason: match`).
- **The issue's wording moves the hash.** The hash covers every backticked span in the whole gate section (README "Gate stamp", line 253). With the directories in backticks the section hashes to `c2f61f80…` (57 items, 12 steps); without them it stays `3ec7834b…`. **Decided 2026-10-29: keep the backticks and restamp in the same commit as the gate edit.** Decision 2 of the prompt ("no restamp") is recorded as overridden in `shape.md`.
- **Decided 2026-10-29: `agents/` joins the directory list** (seven directories: scripts/, skills/, agents/, templates/, workflows/, hooks/, .claude-plugin/). README's Files table describes `agents/redline-*.md` and Known limits cites a reviewer section by name, so a role change is reader-facing.
- `redline-setup.sh unattended` reads the fill-ins back with three regexes (`scripts/redline-setup.sh:299-311`): `\(gate steps (\d+) to (\d+)`, `Gate step (\d+)'s edits`, and `\bSteps? (.+?) stays? as written` (case-sensitive, leftmost match). So point 7's new Docs sentence must come **after** the "Steps … stay as written" sentence on that line and say "gate step 10" in lower case, or the rerun reads the wrong text back. `.claude/redline/checks.json` records only the nine command steps; nothing there changes.
- `agent-os/standards/process/standards-retrospective.md:5` says "Gate step 10 in `.claude/commands/agent-os/shape-spec.md`" and must become 11 (not in the prompt's list; found while surveying).
- Number references that move (all in `shape-spec.md`): unattended point 7 "Steps 10 and 11 stay as written" (line 44), point 8 "Gate step 10's edits" (line 45), the Task N text (line 204), the Step 9 summary line (line 229), "Only after all eleven pass" (line 259), the Tips line "gate step 10" (line 349). `README.md`, `CLAUDE.md` ("nine commands"), `agent-os/product/tech-stack.md:12` ("nine steps") and `templates/shape-spec-unattended.md` (its own numbering, for other repositories) are unchanged.
- The reviewer's nit rule lives in `agents/redline-reviewer.md` ("How to review", the Category bullet, line 33); the plan approver's checks are a numbered list 1 to 7 in `agents/redline-plan-approver.md:16-22`.
- The index convention: `index.yml` keys are the file name without `.md`, alphabetised by folder and file, so `process: docs-gate:` goes before `internal-notes`.
- `agent-os/product/`: `mission.md`, `roadmap.md`, `tech-stack.md`; none mentions #13 or the README rule. No product adjustment.

Standards carried (decided 2026-10-29): `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`, `workflow/agents`. Visuals: none. The person makes every commit.

## Decisions (the prompt's nine, as amended while shaping)

1. Docs step inserted as gate step 10, with the issue's wording plus `agents/`; retrospective becomes 11, spec folder 12; every number reference above moves.
2. **Amended:** the backticked directories move the hash, so `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` runs in the same commit as the gate edit. `check .` is run before (match on `3ec7834b…`) and after (match on the new hash).
3. The unattended section is edited by hand here; `templates/shape-spec-unattended.md` is unchanged.
4. Setup rerun: `--prose-steps "10, 11 and 12" --retro-step 11` reads back `changed: false`; `tests/setup-test.sh` still passes.
5. Standard `agent-os/standards/process/docs-gate.md`, listed in `index.yml`.
6. Reviewer gains one nit sentence; plan approver gains check 8.
7. README: two sentences in `## Contributing` (this repository's own gate lives there, not under "Set up a repository", which is other repositories' contract).
8. This plan carries a Docs entry per touched file (section "Docs entries" below).
9. Done when all of the above hold and the gate is green.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-10-29-1559-13-docs-gate-step/` with:
- `plan.md`: this plan, including the Docs entries table.
- `shape.md`: scope, the decisions above with the three answers of 2026-10-29 (restamp; `agents/`; four standards) and their reasons, the hash measurements, context (visuals none; references; product N/A), `## Standards retrospective (proposed)` filled at Task 7.
- `standards.md`: full text of `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`, `workflow/agents`.
- `references.md`: `scripts/redline-setup.sh` 299-311 (read_fillins regexes), 318-322 (apply); `scripts/redline-gate.sh` (`extract`, `stamp`, `check`); `README.md` 253 (what the hash covers), 121-145 (Files table), 158-160 (Contributing); `agents/redline-reviewer.md` 14-23, 33; `agents/redline-plan-approver.md` 16-22; `agent-os/standards/process/standards-retrospective.md` (format model); `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/` (last hand-shaped spec, plan shape).

## Task 2: The gate step, the renumbering and the restamp

**Files:** `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.sh` (stamp line only, written by the script).

1. Run `scripts/redline-gate.sh check .`; expect exit 0 and sha `3ec7834b…`. If not, stop and say so.
2. Insert after the step 9 continuation line (line 249), as step 10, before the retrospective:

   > 10. **Docs** — For each file the change added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code: name the README section (and template, if any) that describes it, and either the commit that updated it or the words "no reader-facing change" with the reason. A plan that cannot name the section adds one. The shaper writes these entries into the plan, one per touched file; the gate confirms each names its commit or its reason.

   Renumber: `10. **Standards retrospective**` → 11, `11. **Spec folder**` → 12. "Only after all eleven pass" → "all twelve".
3. Unattended section, point 7 (line 44): replace "Steps 10 and 11 stay as written." with "Steps 10, 11 and 12 stay as written, and gate step 10, Docs, is applied when you write the plan: a task that adds or alters a file under scripts/, skills/, agents/, templates/, workflows/, hooks/ or .claude-plugin/, or adds a config key, subcommand, allow rule or exit code, names the README section (and template, if any) it updates or says "no reader-facing change" and why, so the round's commits carry the README edit." (The fill-in sentence stays first and "gate step" is lower case, for the setup script's regexes.) Point 8 (line 45): "Gate step 10's edits" → "Gate step 11's edits".
4. Task N text (line 204): "…then the Docs step and the standards retrospective. … the Docs entries name their commits, and the retrospective has either landed…". Step 9 summary (line 229): "ending with the Docs step and the standards retrospective". Tips (line 349): "gate step 11".
5. Restamp: `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`, then `scripts/redline-gate.sh check .` exits 0 with 12 steps and the new hash; `steps` stays `1-9`.
6. `scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-9 --prose-steps "10, 11 and 12" --retro-step 11 --no-pr-body --dry-run` prints `"changed": false` (before the edit the same command exits 1 with `differs` naming `proseSteps` and `retroStep`).

Gate edit and restamp land in one commit (the user titles it).

## Task 3: The standard

**Files:** new `agent-os/standards/process/docs-gate.md`, `agent-os/standards/index.yml`, `agent-os/standards/process/standards-retrospective.md` (line 5: "Gate step 10" → "Gate step 11").

`docs-gate.md`, in the house format (title, one-sentence rule, bullets):

> # Docs gate
>
> Every spec names the README and template changes it needs, so a public reader is never behind the code.
>
> - Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template, if any) and either the commit that updated it or "no reader-facing change" with the reason
> - A plan that cannot name the section adds one; the entry then names the new section
> - The entries are written at shaping time, one per touched file, under a "Docs entries" heading in `plan.md`; the gate confirms each names its commit or its reason
> - In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README"
> - A prose step whose text holds a backticked span is inside the stamp: adding this step moved the hash, and the restamp went in the same commit (#13)

`index.yml`: under `process:`, before `internal-notes`: `docs-gate:` with description "Every spec names the README section (and template) each touched plugin file needs, or says why there is no reader-facing change".

## Task 4: The reviewer and the plan approver

**Files:** `agents/redline-reviewer.md`, `agents/redline-plan-approver.md`.

- Reviewer, "How to review", a new bullet after the Category bullet (line 33): "**Docs.** In a repository whose Verification Gate has a Docs step (read `.claude/commands/agent-os/shape-spec.md`), a change under the directories that step lists, or a new config key, subcommand, allow rule or exit code, with no README section named for it in the PR's spec plan, is a `nit` whose `proposedFix` is "update section X of the README" (name the section, or say a new one is needed)."
- Plan approver, "What you check", new item 8: "**Docs entries.** When the repository's Verification Gate has a Docs step, the plan carries a Docs entry for every file a task touches under the directories that step lists, and for every new config key, subcommand, allow rule or exit code: a README section (and template, if any) with the commit or a "no reader-facing change" reason. A plan missing one is bounced with the file named."

No loop-test or guard change: neither file is read by a test, and the workflow's prompts do not change.

## Task 5: README

**Files:** `README.md`, `## Contributing` (line 160), two sentences appended: "The gate's step 10 is a Docs step: a spec that adds or alters a file under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, or adds a config key, subcommand, allow rule or exit code, names in its plan the README section (and template) it updates, or says why there is no reader-facing change. The Redline reviewer reports a change with no such entry as a nit, and the plan approver sends back a plan missing one."

## Task 6: Docs entries for this spec

| File | README section (template) | Commit or reason |
| --- | --- | --- |
| `.claude/commands/agent-os/shape-spec.md` | Contributing (new sentences) | Task 5's commit. Not under a listed directory; entry under decision 8 |
| `.claude/redline/checks.sh` (stamp line) | none | no reader-facing change: "Gate stamp" already says the stamp moves with the backticked text; the hash value is not documented |
| `agents/redline-reviewer.md` | Contributing (the nit sentence) | Task 5's commit |
| `agents/redline-plan-approver.md` | Contributing (the bounce sentence) | Task 5's commit |
| `agent-os/standards/process/docs-gate.md`, `index.yml`, `standards-retrospective.md` | none | no reader-facing change: the README does not describe `agent-os/standards/`; `CLAUDE.md` points at it |
| `README.md` | Contributing | Task 5's commit (the change itself) |
| `agent-os/specs/2026-10-29-1559-13-docs-gate-step/` | none | no reader-facing change: spec folders are the record, not the README |
| `templates/shape-spec-unattended.md` | not touched | the Docs step is this repository's own; README step 5 of "Set up a repository" is unchanged |

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` (steps 1 to 9; expect every check at its baseline exit, the stamp case of `tests/gate-test.sh` green after the restamp, `tests/setup-test.sh` green), then:

- Step 10, Docs: every row of Task 6 names a commit or a reason.
- Step 11, standards retrospective: the proposed items are (a) `docs-gate.md` created by Task 3 (the rule itself), (b) `standards-retrospective.md:5` renumbered, (c) the hash lesson recorded as the last bullet of `docs-gate.md`. Present with AskUserQuestion; approved edits that are not already in Task 3 go in their own commit; otherwise record "Standards retrospective: no further changes" under Decisions in `shape.md`.
- Step 12: `plan.md` As built; deviations under Decisions.

Also, from the repository root: `scripts/redline-gate.sh check .` exit 0, `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0, `git status --porcelain` empty after the commits. CI (`.github/workflows/gate.yml`) runs the same on the PR.

## Verification (end to end)

1. Before Task 2: `scripts/redline-gate.sh check .` → `ok: true`, sha `3ec7834b…`, `actual.steps: 11`.
2. After Task 2: same command → `ok: true`, `actual.steps: 12`, new sha; `stamp.steps` still `1-9`.
3. `scripts/redline-setup.sh unattended .claude/commands/agent-os/shape-spec.md --gate-steps 1-9 --prose-steps "10, 11 and 12" --retro-step 11 --no-pr-body --dry-run` → `"changed": false`.
4. `.claude/redline/checks.sh --baseline` → exit 0; `tests/gate-test.sh` and `tests/setup-test.sh` print `N passed, 0 failed`.
5. `claude plugin validate .` passes (the two agent files still parse).
6. Read the gate aloud: steps 1 to 12 numbered in order; "all twelve"; the Tips line says 11; point 7 and point 8 of the unattended section say 10/11/12 and 11.

## Suggested commit split (the user commits)

1. spec folder (Task 1); 2. gate edit + restamp + unattended section (Task 2); 3. standard, index, retrospective line (Task 3); 4. agents (Task 4); 5. README (Task 5); 6. any retrospective edit beyond Task 3, then the As built commit.

## As built (2026-10-29)

- Built as shaped; no deviation from the tasks above.
- Before Task 2 `scripts/redline-gate.sh check .` reported `match`, 11 steps, `3ec7834b…`; after the restamp it reports `match`, 12 steps, `stamp.steps` still `1-9`, sha `a7ef5783091d2ba1689c382f161341c962a856bcb84eb80ed8f9b76372d5e298`.
- `redline-setup.sh unattended … --prose-steps "10, 11 and 12" --retro-step 11 --dry-run` exited 1 before the edit (`differs`: proseSteps `10 and 11`, retroStep 10) and prints `changed: false` after it.
- `.claude/redline/checks.sh --baseline`: all nine checks exit 0 (syntax, validate, guard, loop, prefs, gate, setup, gh, background); `redline-setup.sh version` matches v1.
- Step 10 (Docs): every row of Task 6 names a commit or a reason.
- Step 11 (retrospective): approved as proposed plus one bullet learned while shaping (the fill-in ordering rule), all in `process/docs-gate.md`; see `shape.md`.
- The person makes the commits; the Task 6 entries name them by task.
