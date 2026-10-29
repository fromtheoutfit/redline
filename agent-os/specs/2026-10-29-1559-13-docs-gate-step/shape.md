# Gate step: every spec names the README and template changes it needs — Shaping Notes (#13)

## Scope

A prose **Docs** step in this repository's Verification Gate (`.claude/commands/agent-os/shape-spec.md`), inserted as step 10 before the standards retrospective, with the issue's wording plus `agents/`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section (and template, if any) and either the commit that updated it or "no reader-facing change" with the reason. With it: the renumbering of the retrospective (11) and the spec-folder check (12) and every reference to those numbers; the unattended section's point 7 naming the step as something the shaper applies when it writes the plan; the restamp; the standard `agent-os/standards/process/docs-gate.md`; one nit rule for the reviewer and one check for the plan approver; two sentences in the README's Contributing section; and this spec's own Docs entries, the first plan the rule applies to.

Not in scope: `templates/shape-spec-unattended.md` (the Docs step is this repository's own); `.claude/redline/checks.json` and the generated `checks.sh` beyond the stamp line (the step is prose, not a command); any other repository's gate.

## Decisions

The shaping prompt's nine decisions stand except where amended below. Each amendment was answered by the person on 2026-10-29.

1. **Docs step as gate step 10**, retrospective 11, spec folder 12. Every number reference moves: unattended point 7 ("Steps 10 and 11 stay as written") and point 8 ("Gate step 10's edits"), the Task N text, the Step 9 summary line, "all eleven", the Tips line, and, found while surveying, `agent-os/standards/process/standards-retrospective.md:5` ("Gate step 10").
2. **Amended: the restamp goes in the same commit as the gate edit.** The prompt said the stamp covers steps 1 to 9 only, so no restamp. Measured on scratch copies with `scripts/redline-gate.sh extract`: the hash covers every backticked span in the whole gate section (README, "Gate stamp"), so the issue's wording, with the directories in backticks, moves it from `3ec7834b…` (51 items) to `c2f61f80…` (57 items); written as plain prose the hash stays. Options put to the person: plain prose with no restamp (recommended at the time), or the issue's backticks with a restamp. **Answer: the backticks and the restamp; "Decision 2 was wrong".** The stamp's `steps 1-9` range is read from point 7's `(gate steps 1 to 9` parenthetical and does not move. Decided by: @michaelwitwicki.
3. **The unattended section is edited by hand here**, not through the template. Point 7 keeps the fill-in sentence first ("Steps 10, 11 and 12 stay as written") and adds the Docs sentence after it, saying "gate step 10" in lower case: `redline-setup.sh unattended` reads the fill-ins back with case-sensitive, leftmost-match regexes (`scripts/redline-setup.sh:299-311`), and a capital "Step" earlier on the line would be read as the fill-in. `templates/shape-spec-unattended.md` is unchanged.
4. **Setup rerun** with `--gate-steps 1-9 --prose-steps "10, 11 and 12" --retro-step 11 --no-pr-body --dry-run` reads back `changed: false` after the edit; before it, the same command exits 1 with `differs` naming `proseSteps` and `retroStep`. `.claude/redline/checks.json` records only the nine command steps, so nothing there changes; `tests/setup-test.sh` is unaffected.
5. **The rule is a standard**, `agent-os/standards/process/docs-gate.md`, listed in `index.yml` before `internal-notes` (keys alphabetised by folder and file), so the retrospective can refine it.
6. **Amended: `agents/` joins the directory list.** The issue lists six directories; the README's Files table describes `agents/redline-*.md` as the eight roles and Known limits cites a reviewer section by name, so a role change is reader-facing. This spec itself edits two agent files. Decided by: @michaelwitwicki. The reviewer (`agents/redline-reviewer.md`, "How to review") gains one bullet: in a repository whose gate has a Docs step, a change under the listed directories or a new config key, subcommand, allow rule or exit code with no README section named in the plan is a `nit` with the fix "update section X of the README". The plan approver (`agents/redline-plan-approver.md`) gains check 8: the plan carries a Docs entry per touched file when the gate has the step.
7. **README: two sentences in `## Contributing`**, not "Set up a repository": Contributing describes this repository's own gate (it was created for CI in #17); "Set up a repository" is other repositories' contract.
8. **This plan carries a Docs entry for every file it touches**, including the ones outside the listed directories (`shape-spec.md`, the standards, the spec folder), with "no reader-facing change" and the reason where the README has nothing to say.
9. **Done when** the gate has the step, numbered, the stamp matches, the unattended section points at it and reads back clean, the standard exists and is indexed, the reviewer and plan approver carry the rule, the README says so, and this plan's Docs entries each name a commit or a reason.
10. **Standards retrospective: applied** (2026-10-29): the four items under "Standards retrospective (applied)" below; nothing recorded as "no changes".
11. **Standards carried: four** (answered 2026-10-29): `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`, `workflow/agents`. `testing/tests` was offered and declined: the restamp is the gate's own step 6 instruction, not a test change.

## Context

- **Visuals:** None.
- **References:** see `references.md`. The survey read the gate script's `extract` on two scratch copies of `shape-spec.md`, the setup script's fill-in regexes and their test, the README's Files, Contributing and Gate stamp sections, the two agent files' rule lists, the standards' format and index, and the last hand-shaped spec (#17).
- **Product alignment:** N/A. `agent-os/product/` (`mission.md`, `roadmap.md`, `tech-stack.md`) does not mention the README rule; `tech-stack.md:12` ("nine steps") still describes the nine command steps and is unchanged.

## Standards retrospective (applied)

Presented at the gate on 2026-10-29 and approved (decided by: @michaelwitwicki). The items, all landed in the standards commit:

- `agent-os/standards/process/docs-gate.md`: created by Task 3; it is the rule this spec adds, so the retrospective's "missing standard" item is already landed when the gate runs.
- `agent-os/standards/process/standards-retrospective.md:5`: "Gate step 10" → "Gate step 11" (Task 3; a consequence of the renumbering).
- The hash lesson (a prose step with a backticked span is inside the stamp; the restamp goes in the same commit) is a bullet of `docs-gate.md`, so it is recorded with the rule it belongs to rather than in `standards-retrospective.md`.
- Learned while shaping and approved at the gate: `redline-setup.sh unattended` reads the fill-ins back by leftmost regex match, so point 7's "Steps … stay as written" sentence stays first on its line and later text says "gate step" in lower case. Recorded as the last bullet of `docs-gate.md`.

No check went red during the build. No pattern was used that is not in `agent-os/standards/`.

## Standards Applied

- process/standards-retrospective — the retrospective is renumbered and its own text cites the step; its format and the `index.yml` rule shape the new standard
- process/internal-notes — the README is the only long-form document here, which is why a gate step guards it; a rule goes to a standard, a rationale to the internal repository
- prompts/attribution — the spec folder, the standard and the commits carry no model or vendor name
- workflow/agents — one role per file; the reviewer's and plan approver's new rules name the file the agent reads to decide, so the rule is inert in a repository without the step
