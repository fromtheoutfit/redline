# PR #51 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 found one correctness bug and two nits. All three are places where the PR's new Docs step is described a little differently from the gate text itself (`.claude/commands/agent-os/shape-spec.md:250`) and from point 7 of the unattended section (line 44). All three are fixes; nothing is deferred and nothing goes back to the person.

- **R1-1** (Task 2): the README's Contributing sentence names the Docs step by its title instead of "step 10".
- **R1-2** (Task 3, landed by Task 5): the `process/docs-gate` standard accepts a Docs entry inside the task that touches the file, as point 7 writes it, as well as under one Docs entries heading. The edit is a standards edit, so it goes through the standards retrospective and its commit names R1-2.
- **R1-3** (Task 4): plan approver check 8 asks for the README section or the reason, never a commit the plan cannot name yet.

Every commit message starts `redline: ` and references (#13), the issue the PR closes. Every path below is under `/Users/michaelwitwicki/Code/Claude/redline/`.

No harness reads `README.md`, an agent's prompt text or a standard: `tests/loop-test.mjs` reads only `workflows/redline-loop.js` (line 18), and no `tests/*.sh` reads `agents/` or the README. So each task's proof is red-first `grep` counts that place the change in the file, plus the gate (Task 6), whose step 2 (`claude plugin validate .`) parses the agent file. No edit touches the Verification Gate section of `shape-spec.md`, `.claude/redline/checks.json` or `.claude/redline/checks.sh`, so the gate hash does not move and nothing is restamped.

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-29-1614-51-review-round-1/plan.md`
- `agent-os/specs/2026-10-29-1614-51-review-round-1/shape.md`
- `agent-os/specs/2026-10-29-1614-51-review-round-1/standards.md`
- `agent-os/specs/2026-10-29-1614-51-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never in the same commit as a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #51 (#13)`

## Task 2: R1-1 name the Docs step by its title in the README

Files: `README.md`

What happens today:
- `README.md:162`, the paragraph this PR adds under `## Contributing`, opens "The gate's step 10 is a Docs step:".
- The gate's numbers move whenever a step is inserted before them. `bc6a18d` (#40) added the Background step and moved the retrospective from 9 to 10; this PR moved it from 10 to 11.
- Before this PR the README cited no gate step number. On `main`, `grep -n "step [0-9]"` finds only the setup skill's own steps (README lines 38, 42, 47 and 267 there).
- A later gate edit touches `.claude/commands/agent-os/shape-spec.md` and `.claude/redline/checks.sh`. Neither is under a directory the Docs step lists, so no Docs entry would flag this sentence once its number goes stale.

Red first: `grep -c "step 10 is a Docs step" README.md` prints `1`.

Change, on line 162 only: replace the opening words

> The gate's step 10 is a Docs step:

with

> The gate has a Docs step:

Leave the rest of the paragraph exactly as it is, from "a spec that adds or alters a file under" to "the plan approver sends back a plan missing one."

Unchanged neighbours:
- Line 160, the CI paragraph.
- Line 269, "`/redline:setup` stamps `checks.sh` as its step 10". That is the setup skill's own step 10, not a gate step.

Proof:
- `grep -c "step 10 is a Docs step" README.md` prints `0`.
- `grep -n "The gate has a Docs step:" README.md` prints one line, 162.
- `grep -n "step 1[0-9]" README.md` prints one line, 269 (the setup skill's step).
- `git show --stat HEAD` after the commit lists only `README.md`.

Docs: this task is the README edit itself, in Contributing. `README.md` is not under a directory the Docs step lists (see Docs entries below).

Commit: `redline: R1-1 name the Docs step by its title in the README, not by its number (#13)`

## Task 3: R1-2 let the docs-gate standard accept a Docs entry inside its task

Files: `agent-os/standards/process/docs-gate.md`. It changes in Task 5's commit, as standards retrospective item 1, not in a commit of this task's own. Standards edits go through the retrospective and the standards approver (`agent-os/standards/process/standards-retrospective.md` lines 6-7). The #12 round 1 plan did the same for a finding that needed a standards line (`agent-os/specs/2026-10-23-0710-12-review-round-1/plan.md:222`).

What happens today:
- `agent-os/standards/process/docs-gate.md:7`: "The entries are written at shaping time, one per touched file, under a "Docs entries" heading in `plan.md`; the gate confirms each names its commit or its reason".
- Gate step 10 (`shape-spec.md:250`) sets no location: "The shaper writes these entries into the plan, one per touched file".
- Point 7 (`shape-spec.md:44`) puts each entry inside its task: "a task that adds or alters a file under scripts/, ... names the README section (and template, if any) it updates or says "no reader-facing change" and why".
- Plan approver check 7 (`agents/redline-plan-approver.md:22`) holds tasks to the standards as `standards.md` records them. A plan written as point 7 says can therefore be bounced for having no Docs entries heading.

Red first: `grep -c 'under a "Docs entries" heading' agent-os/standards/process/docs-gate.md` prints `1`.

Change: retrospective item 1 under "Standards retrospective (proposed)" in `shape.md`, applied in Task 5.

Proof, after Task 5's commit:
- `grep -c 'under a "Docs entries" heading' agent-os/standards/process/docs-gate.md` prints `0`.
- `grep -n "in the task that touches the file" agent-os/standards/process/docs-gate.md` prints one line, 7.
- `grep -c "^# Docs gate" agent-os/standards/process/docs-gate.md` prints `1` (the heading is unchanged).

If the standards approver declines item 1, R1-2 has no fix this round. Do not edit the standard outside the approved list. Report it under `blocked` (task 3, finding R1-2), with the approver's reason, so the run returns it to the person.

Docs: no reader-facing change. The file is not under a directory the Docs step lists, and the README does not describe `agent-os/standards/`.

## Task 4: R1-3 have check 8 ask for the README section or the reason, never a commit

Files: `agents/redline-plan-approver.md`

What happens today:
- `agents/redline-plan-approver.md:23`, check 8, asks each Docs entry for "a README section (and template, if any) with the commit or a "no reader-facing change" reason".
- The plan approver runs before the implementer (`workflows/redline-loop.js:1874` against `1966`), so no commit exists yet when it reads the plan.
- Point 7 (`shape-spec.md:44`) asks the shaper only for the section the task updates, or the reason. Gate step 10 (`shape-spec.md:250`) confirms the commit at the gate: "the gate confirms each names its commit or its reason".
- A bounce sends the plan back to the shaper (`workflows/redline-loop.js:965`), which cannot name a commit that does not exist. After `maxPlanAdjustments` bounces (2, `.claude/redline.json:3`) the run stops at Approve (`workflows/redline-loop.js:1888-1889`).

Red first: `grep -c "with the commit or a" agents/redline-plan-approver.md` prints `1`.

Change: replace line 23 with this line, exactly:

```
8. **Docs entries.** When the repository's Verification Gate has a Docs step (read `.claude/commands/agent-os/shape-spec.md`), the plan carries a Docs entry for every file a task touches under the directories that step lists, and for every new config key, subcommand, allow rule or exit code: the README section (and template, if any) the task updates, or "no reader-facing change" with the reason. You run before the implementer, so no entry can name a commit yet: the commit is the task's own, and the gate's Docs step confirms it once the task lands. Never bounce an entry for naming no commit. A plan missing an entry is bounced with the file named.
```

Unchanged neighbours:
- The frontmatter (lines 1-6).
- Checks 1 to 7 (lines 16-22).
- The Bash paragraph after the list, and the return block.

Proof:
- `grep -c "with the commit or a" agents/redline-plan-approver.md` prints `0`.
- `grep -n "Never bounce an entry for naming no commit" agents/redline-plan-approver.md` prints one line, 23.
- `grep -c "^[0-9]\. \*\*" agents/redline-plan-approver.md` prints `8` (still eight checks).
- `grep -c "^name: redline-plan-approver" agents/redline-plan-approver.md` prints `1`.
- `git show --stat HEAD` after the commit lists only `agents/redline-plan-approver.md`.
- Gate step 2 (`claude plugin validate .`, in Task 6) passes, so the agent file still parses.

Docs (the file is under `agents/`): README sections Contributing (line 162, "the plan approver sends back a plan missing one") and Files (the `agents/redline-*.md` row); no template. No reader-facing change: both sentences stay true. The Contributing sentence already describes an entry as the section a spec updates or the reason, which is what check 8 now asks for.

Commit: `redline: R1-3 have plan approver check 8 ask for the README section or the reason, never a commit the plan cannot name yet (#13)`

## Task 5: Standards retrospective

Files: `agent-os/standards/process/docs-gate.md`

Items 1 to 3 under "Standards retrospective (proposed)" in `shape.md`:
- Item 1 carries R1-2's whole fix (Task 3).
- Item 2 is R1-3's lesson; item 3 is R1-1's.

Apply them in this order: item 1 rewrites line 7; item 2's bullet goes directly after it; item 3's bullet goes directly after item 2's. If item 2 is declined, item 3's bullet goes directly after line 7.

Apply only the edits the standards approver approved, in one commit after the finding commits, keeping the file's heading. Item 1 carries R1-2's fix, so the commit message names R1-2 whenever item 1 is approved. If item 1 is declined, follow Task 3's last paragraph. If nothing is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when item 1 is approved): `redline: record the round 1 review lessons in the standards, fixing R1-2 (#13)`

## Docs entries

Gate step 10, one row per file the round touches. Each task above carries the same entry in its own Docs line, as point 7 writes it.

| File | README section (template) | Commit or reason |
| --- | --- | --- |
| `README.md` | Contributing | Task 2's commit, named in As built (the README edit itself). Not under a listed directory |
| `agents/redline-plan-approver.md` | Contributing (the plan approver sentence), Files (`agents/redline-*.md`); no template | no reader-facing change: both sentences stay true, and Contributing already describes an entry as a section or a reason |
| `agent-os/standards/process/docs-gate.md` | none | no reader-facing change: the README does not describe `agent-os/standards/`. Not under a listed directory |
| `agent-os/specs/2026-10-29-1614-51-review-round-1/` | none | no reader-facing change: spec folders are the record, not the README |

The round adds no config key, subcommand, allow rule or exit code, and touches nothing under `templates/`.

## Task 6: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-29-1614-51-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Docs**: every row under Docs entries names its commit or its reason. The `README.md` row's commit is Task 2's, listed by hash in As built.
11. **Standards retrospective**: Task 5, from the proposed list in `shape.md`, as the standards approver approved it.
12. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.
