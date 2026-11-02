# PR #63 Review Round 2 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 2 on PR #63 (head `feature/44-short-aliases-redline-and-redline-revise`, issue #44). This is the final nit round: the reviewer found no correctness bug. One finding, `fix`:

- **R2-1** (nit, low): `skills/setup/SKILL.md:19`. Round 1's R1-1 fix turned the inventory's pointer into a closed list ("steps 5, 11 and 12 read it, and step 14 lists what a rerun checked"). Two lines down, the same inventory item says "step 8 reports them as `stale`", so the list leaves out a step that reads it.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/`. Round 1's spec is `agent-os/specs/2026-11-02-1253-63-review-round-1/`.

**Known?**

- `scripts/redline-gh.sh issues-search "setup inventory"` and `issues-search "SKILL.md step"` print no open issue.
- Round 1's `shape.md` dispositioned the line as R1-1 (fix, built in `c76e889`). R2-1 is a defect in that fix's wording, not a re-report of R1-1. The finding's `carriedFrom` is empty.
- So the finding is new.

No repository ask rules: the invoking prompt lists none.

## Decisions

### R2-1: fix — the inventory's pointer stays open instead of listing step numbers

**Investigation.**

- `skills/setup/SKILL.md:19` reads: "5. Inventory, so a rerun updates instead of duplicating; keep it for the steps below: steps 5, 11 and 12 read it, and step 14 lists what a rerun checked:". `git log -L19,19:skills/setup/SKILL.md main..HEAD` shows this text came from `c76e889` (R1-1). Before that the line read "keep it for step 13:".
- `skills/setup/SKILL.md:21`, a sub-bullet of the same item, names `templates/settings.retired.json` and says "step 8 reports them as `stale`". Step 8 (`:111-117`) shows `stale` on a rerun's `--dry-run`. So step 8 acts on what the inventory recorded, and the closed list contradicts its own sub-bullet. Confirmed.
- Step 8 is not the only one left out. The inventory exists "so a rerun updates instead of duplicating", and it lists more items than steps 5, 8, 11 and 12 cover:
  - `.claude/redline.json` (`:21`): step 7 (`:109`, "On a rerun it updates only `checker`…");
  - the `.gitignore` line (`:21`): step 9 (`:121`, "`changed: false` on a rerun");
  - the `## Unattended mode (Redline)` heading (`:22`): step 10 (`:130-131`, "Fresh: …", "Rerun: …").
  Each of these steps acts on whether the item is already there. A closed list that was complete would read roughly "steps 5 and 7 to 12". The next renumber would make that stale too, as #44's renumber did to "step 13".
- Round 1's R1-1 investigation counted only the steps whose own text says "step 1's" or "inventory" (round 1 `shape.md`, R1-1). That is how steps 7 to 10 were missed.
- Nothing pins the line's wording:
  - `grep -rn "steps 5, 11\|lists what a rerun checked\|setup/SKILL.md" tests/` finds nothing.
  - `README.md` names the skill only in "Set up a repository" (`:38`) and the Files table (`:149`), not the inventory's pointer.

**Which of the reviewer's two wordings.** The reviewer offers two fixes: add step 8 to the list, or drop the closed list. Both are one line in a file already in the PR's diff. Neither is a product question, so this is not a judgment call. The open wording is the one that is right for this file:

- adding step 8 still leaves out steps 7, 9 and 10;
- an open pointer cannot go stale on a renumber.

Line 19 becomes: "5. Inventory, so a rerun updates instead of duplicating; keep it for the steps below and for step 14's list of what a rerun checked:". That is the reviewer's second wording, as given.

**Proportionality.** Likelihood: every setup run reads the line. Impact: small. A model following the skill may treat steps 7 to 10 as not consulting the inventory, while their own text still says what a rerun does. Cost: one line of `skills/setup/SKILL.md`, already in the PR's diff, with no test or README change. Proportionate.

Decided by: redline

## Unattended answers

- **A1. Scope, visuals, product context.** Scope is R2-1 alone; the invoking prompt says the round has no correctness findings. Visuals: none. Product context: the line is internal to the setup skill and changes nothing a user types.
  Decided by: redline
- **A2. Which wording R2-1 takes.** Neither the PR description nor the original spec sets out the inventory's pointer. The PR description says only "the inventory in 1.5 lists the two files". The code answers it: the inventory's items feed steps 5 and 7 to 12, and step 14 lists them (see R2-1). So the open wording is the one the file supports.
  Decided by: redline
- **A3. Standards.** `process/docs-gate` (the Docs entry for `skills/setup/SKILL.md`), `process/standards-retrospective`, `prompts/attribution`; see `standards.md`. No test changes, so `testing/tests` does not apply. The line is a wording change, so there is no red run to see.
  Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond A1.

## Standards Applied

- process/docs-gate — Task 2's Docs entry: `skills/setup/SKILL.md`, no reader-facing change.
- process/standards-retrospective — the proposed list below.
- prompts/attribution — nothing written names a model or vendor.

## Standards retrospective (proposed)

1. R2-1 (a closed list of step numbers that was incomplete when written and drifts on a renumber): no change. Round 1 recorded the same class (its retrospective item 4) as needing no standard: the skill numbers its own steps by design, and `process/docs-gate`'s "name a gate step by its title" rule is about the README. The fix removes the closed list, so nothing is left to enforce.
2. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes.

If the standards approver approves this list as it stands, the as-built commit records "Standards retrospective: no changes" under Decisions in this file.
