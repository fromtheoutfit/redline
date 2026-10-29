# PR #51 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #51, which closes issue #13 ("Gate step: every spec names the README and template changes it needs"). This round covers its three findings and nothing else. All three are places where the PR describes its new Docs step a little differently from the gate text (`.claude/commands/agent-os/shape-spec.md:250`) and from point 7 of the unattended section (line 44):

- **R1-1** (nit, low, likely): the README's new Contributing sentence names the Docs step as "step 10", a number that moves, and that no Docs entry would flag going stale (`README.md:162`). **Fix.**
- **R1-2** (nit, low, likely): the `process/docs-gate` standard puts Docs entries under a "Docs entries" heading, while point 7 puts each in its task (`agent-os/standards/process/docs-gate.md:7`). **Fix**, through the standards retrospective.
- **R1-3** (correctness, low, likely): plan approver check 8 asks each Docs entry for a commit, which no plan can name before the implementer runs (`agents/redline-plan-approver.md:23`). **Fix.**

## Unattended answers

- **Scope.** The three findings in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-1-review.json` and `redline/round-1-findings.json` in this folder.
- **Visuals.** None. Every change is a sentence of prose in a Markdown file.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** `agent-os/product/tech-stack.md:26`: "this repository carries the tool and its README only". The README is what a public reader sees, which is why the Docs step exists. None of the three fixes changes product scope.
- **Standards.** These apply: `process/docs-gate` (the rule all three findings are about), `process/standards-retrospective` (R1-2's fix goes through it), `process/internal-notes` (the README is the only long-form document; this folder carries no private detail), `prompts/attribution` (the commit messages), `workflow/agents` (R1-3 edits an agent file) and `testing/tests` (red before green; no harness covers these files). `scripts/bash-conventions`, `scripts/guard` and `workflow/replay` do not apply: no script, guard rule or workflow prompt changes.
- **Already known?**
  - `scripts/redline-gh.sh issues-search "Docs step"` returns #13 (the issue this PR closes) and #14 ("Public docs: README for installation and use, reference moved to docs/"). #14 is about where the README's reference material lives, not about any of these three sentences.
  - `issues-search "plan approver"` returns #49, #1, #3, #50 and #2. None is about check 8 or Docs entries.
  - `issues-search README` returns #14, #13, #44, #16 and #50. None covers these findings.
  - `redline-gh.sh pr-comments 51` shows only this round's review. `redline-gh.sh review-comments 51` shows only this round's three inline comments (4417461526 on `README.md:162`, 4417461554 on `docs-gate.md:7`, 4417461563 on `redline-plan-approver.md:23`).
  - `git ls-tree -d --name-only origin/feature/13-gate-step-every-spec-names-the-readme-and-template-changes-it-needs agent-os/specs/` lists no `-51-review-round-` folder, so this is the PR's first review round.

  All three findings are new.
- **Reproductions.** `/tmp/redlinerepro/` does not exist, so the reviewer wrote no reproduction. This repository has no PHP and no Pest, so the shaper wrote no scratch test either. Each finding is about text, and was confirmed by reading the lines it names and by the `grep` counts the plan uses as its red cases (all run while shaping: each prints `1` today).
- **R1-1: is it real? Does the evidence answer it?** Yes and yes.
  - `README.md:162` opens "The gate's step 10 is a Docs step:".
  - `bc6a18d` (#40) added the Background step as gate step 9 and moved the retrospective from 9 to 10 (its diff of `shape-spec.md`). This PR moved it from 10 to 11.
  - On `main`, `git show main:README.md | grep -n "step [0-9]"` finds only the setup skill's own steps (lines 38, 42, 47, 267). So the README cited no gate step number before this PR.
  - The PR description gives the intent: "**README**, Contributing: two sentences saying the gate has the step and what it asks for." The step's number is not part of it. The sentence is reworded to say the gate has the step, which is the fix the reviewer proposed.
- **R1-2: is it real? Does the evidence answer it?** Yes and yes.
  - `docs-gate.md:7`: "under a "Docs entries" heading in `plan.md`".
  - Gate step 10 (`shape-spec.md:250`), the source the standard records: "The shaper writes these entries into the plan, one per touched file". No location.
  - Point 7 (`shape-spec.md:44`): "a task that adds or alters a file under scripts/, ... names the README section (and template, if any) it updates or says "no reader-facing change" and why". The entry sits in the task.
  - The PR description: "**Unattended section, point 7** names the step as something the shaper applies when it writes the plan".
  - Plan approver check 7 (`agents/redline-plan-approver.md:22`): "The tasks follow `agent-os/standards/` as `standards.md` records them".
  - The #13 spec's own plan uses a separate task with a table, "Task 6: Docs entries for this spec" (`agent-os/specs/2026-10-29-1559-13-docs-gate-step/plan.md`).
  - So the gate text allows either placement, and the Redline text uses the in-task one. The standard narrowed the gate text to the hand-shaped spec's layout. The fix lets the standard accept both. It drops no assumption, since the heading form stays allowed.
- **R1-3: is it real? Does the evidence answer it?** Yes and yes.
  - Check 8 (`agents/redline-plan-approver.md:23`): "a README section (and template, if any) with the commit or a "no reader-facing change" reason".
  - The plan approver runs before the implementer: `workflows/redline-loop.js:1874` (plan approver, phase Approve) against `1966` (implementer, phase Implement).
  - The PR description: "the plan approver bounces a plan missing a Docs entry". The bounce is for a missing entry, not a missing commit.
  - Gate step 10 (`shape-spec.md:250`): "The shaper writes these entries into the plan, one per touched file; the gate confirms each names its commit or its reason". The commit is confirmed at the gate, after the tasks land.
  - The standard (`docs-gate.md:7`): "The entries are written at shaping time ...; the gate confirms each names its commit or its reason".
  - Check 8 disagrees with all three, and that disagreement is the fix.
  - Whether an approver would in fact bounce on it was not observed: this is the first round since check 8 landed. This round's own plan avoids the question: its one entry under a listed directory (`agents/redline-plan-approver.md`) gives a reason, which meets either reading.

## Decisions

- **R1-1: the README names the Docs step by its title.** Fix. In `README.md:162`, "The gate's step 10 is a Docs step:" becomes "The gate has a Docs step:". The rest of the paragraph is unchanged. `plan.md` Task 2.
  Decided by: redline

- **R1-1: no position or count replaces the number.** The reviewer's first example, "after its nine command steps", carries a count that goes stale the same way, the next time a command step is added. "The gate has a Docs step" is the PR description's own wording and holds whatever the numbering.
  Decided by: redline

- **R1-2: the standard accepts a Docs entry in its task or under one heading.** Fix, through the standards retrospective: item 1 below rewrites `docs-gate.md:7`. The heading form stays allowed, so the #13 spec's layout still meets it. The commit that applies item 1 names R1-2 (`plan.md` Tasks 3 and 5). If the standards approver declines item 1, the implementer reports R1-2 as blocked rather than editing the standard outside the approved list.
  Decided by: redline

- **R1-2: the fix goes through the retrospective, not a finding commit.** A standards edit is approved by the standards approver and lands in the standards commit (`agent-os/standards/process/standards-retrospective.md` lines 6-7). The #12 round 1 plan sent a finding's standards line the same way (`agent-os/specs/2026-10-23-0710-12-review-round-1/plan.md:222`). The workflow already supports a standards commit that carries a finding's fix: the implementer's prompt says the commit "names every finding whose fix one of these edits carries" (`workflows/redline-loop.js:1120`). The checker's "no commit names" check (line 1343) is met by that commit.
  Decided by: redline

- **R1-3: check 8 asks for the section or the reason, never a commit.** Fix. Line 23 of `agents/redline-plan-approver.md` asks for the README section (and template) the task updates, or "no reader-facing change" with the reason. It says the commit is the task's own, which the gate's Docs step confirms once the task lands, and that no entry is bounced for naming no commit. This matches point 7, gate step 10 and the standard. `plan.md` Task 4.
  Decided by: redline

- **R1-3: check 8 is changed, not point 7.** The reviewer offered a second route: have point 7 tell the shaper to write "this task's commit" as each entry's commit. That edits the unattended section, whose point 7 line `redline-setup.sh unattended` reads back by leftmost match (`docs-gate.md:10`), and it would add a placeholder to every entry. Changing check 8 touches one agent file in the PR's diff and makes the approver ask for what exists when it runs.
  Decided by: redline

- **R1-3: the #13 spec's Task 6 rows are left as written.** That plan names the README commit as "Task 5's commit", and its As built says "the Task 6 entries name them by task". In fact the README edit landed in `836c4b6` together with the gate edit and both agent files (`git show 836c4b6 --stat`). This round's scope is its findings (point 6), and the reviewer's proposed fix does not touch that spec. After R1-3's fix, an entry that names its task's commit is the form check 8 accepts at plan time. This round records the caveat here instead of rewriting another spec's record.
  Decided by: redline

- **This round's plan gives each entry in its task and again under a Docs entries heading.** `standards.md` records `process/docs-gate` as it reads at shaping time, with the heading rule, and point 7 asks for the in-task form. So this round's plan meets both until R1-2 lands.
  Decided by: redline

## Deferred

None.

## Proportionality

- **R1-3** (correctness).
  - Likelihood: every Redline round on this repository whose plan touches a file under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/` (the plugin's whole source, so nearly every round) reaches check 8. Whether the approver bounces depends on how literally it reads "with the commit". Not observed yet: this is the first round since check 8 landed.
  - Impact: a bounce happens before any code changes, so no wrong code lands. Each bounce costs a reshape that cannot supply the commit. After two (`.claude/redline.json:3`) the run stops at Approve and returns to the person (`workflows/redline-loop.js:1888-1889`), losing the unattended round.
  - Cost: one line in `agents/redline-plan-approver.md`, a file in the PR's diff. No dependency, service or abstraction; no test or gate change.
  - Proportionate: fix.
- **R1-1** (nit). Likelihood: certain to go stale the next time a step is inserted before the Docs step; nothing flags it. Impact: a public reader is told the wrong step number. Cost: four words on one line of `README.md`, a line this PR adds. Fix.
- **R1-2** (nit). Likelihood: any round whose `standards.md` carries `process/docs-gate` (likely whenever a finding sits in a listed directory) gives the approver two placements that conflict. Impact: a possible bounce, as for R1-3. Cost: one bullet of a standard this PR adds, through the retrospective. Fix.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/tech-stack.md:26` (the repository carries the tool and its README only). No product line changes.

## Standards Applied

- **process/docs-gate.** The rule every finding is about. Line 7 is R1-2's subject; lines 5 and 7 say the gate confirms the commit, which R1-3's fix matches. This round's plan carries its own Docs entries (`plan.md`, Docs entries, and each task's Docs line).
- **process/standards-retrospective.** Lines 6-7: R1-2's edit is a retrospective item, approved by the standards approver and applied in its own commit. Line 9: the edit keeps `docs-gate.md`'s heading.
- **process/internal-notes.** Line 6: the README is the only long-form document, which is why R1-1 matters. Line 8: this folder carries no private detail.
- **prompts/attribution.** The commit messages in `plan.md` and this folder carry Redline's name only.
- **workflow/agents.** Line 3: one role per file; R1-3 changes one check of the plan approver's instructions and nothing in its frontmatter. Line 16: a role told to ask for something that cannot exist yet is the instruction problem R1-3 fixes.
- **testing/tests.** Line 21: a bug fix lands red before green. No harness reads these files, so each red case is a `grep` count run before the edit, and gate step 2 parses the agent file.

## Standards retrospective (proposed)

Done mechanically over the Decisions above. Nothing has been built yet, so there is no As built deviation and no red check to list.

1. **R1-2** (contradicting a standard), in `agent-os/standards/process/docs-gate.md`, line 7. This item carries R1-2's whole fix. Replace the line

   "- The entries are written at shaping time, one per touched file, under a "Docs entries" heading in `plan.md`; the gate confirms each names its commit or its reason"

   with

   "- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)"

2. **R1-3** (missing), in `agent-os/standards/process/docs-gate.md`. Add a new bullet directly after line 7 (item 1's line):

   "- No commit exists at shaping time: a plan's entry names the README section (and template) its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)"

3. **R1-1** (missing), in `agent-os/standards/process/docs-gate.md`. Add a new bullet directly after item 2's (directly after line 7 if item 2 is declined):

   "- The README names a gate step by its title, never by its number: the numbers move whenever a step is inserted before them (#40 moved the retrospective from 9 to 10, #13 from 10 to 11), and a gate edit touches no directory this step lists, so no Docs entry would flag the stale number (#51, R1-1)"

4. The other Decisions teach no further rule: the R1-1 wording choice is covered by item 3; R1-2's route through the retrospective is already `standards-retrospective.md` lines 6-7; R1-3's choice of check 8 over point 7 is covered by item 2; leaving the #13 spec's rows and giving this plan's entries in both forms are one-offs. `process/standards-retrospective`, `process/internal-notes`, `prompts/attribution`, `workflow/agents`, `testing/tests` and `index.yml` (the `docs-gate` description stays accurate): no changes. No pattern is invented outside `agent-os/standards/`.

If the standards approver declines items 1 to 3, record "Standards retrospective: no changes" under Decisions instead, and report R1-2 as blocked (`plan.md` Task 3).
