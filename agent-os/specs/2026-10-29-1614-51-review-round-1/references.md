# References for PR #51 review round 1

Every file below was opened while shaping. Line numbers are at the PR's head, 589a5ee.

## The gate text, the source every finding is measured against

- **Location:** `.claude/commands/agent-os/shape-spec.md`
- **Relevance:** all three findings are places where another file describes the Docs step differently from this one. No task changes it.
- **Key lines:**
  - 44, unattended point 7: "Steps 10, 11 and 12 stay as written, and gate step 10, Docs, is applied when you write the plan: a task that adds or alters a file under scripts/, ... names the README section (and template, if any) it updates or says "no reader-facing change" and why". The entry sits in the task, and names no commit (R1-2, R1-3).
  - 45, point 8: the retrospective's edits are proposed, approved by the standards approver and applied in their own commit (R1-2's route).
  - 69, point 11: the files no role may write (`scripts/redline-guard.sh`, `hooks/hooks.json`, `checks.sh` and its stamp). This round touches none of them.
  - 234-260, the Verification Gate section. 250, step 10, Docs: "The shaper writes these entries into the plan, one per touched file; the gate confirms each names its commit or its reason". No location, and the commit is confirmed at the gate.
- **Key patterns:** the gate text is the authority; a standard or an agent instruction that narrows it is the drift.

## The README

- **Location:** `README.md`
- **Relevance:** R1-1's file and the Docs entries' target.
- **Key lines:**
  - 121-145, the Files table. Line 128 is the `agents/redline-*.md` row ("The eight roles: ...").
  - 158, `## Contributing`. 160, the CI paragraph. 162, the paragraph this PR adds, opening "The gate's step 10 is a Docs step:".
  - 173-184, "Git rules for Redline agents": one commit per finding, the standards commit on its own, the spec folder first.
  - 269, "`/redline:setup` stamps `checks.sh` as its step 10": the setup skill's own step, not a gate step.
- **On `main`:** `git show main:README.md | grep -n "step [0-9]"` finds only the setup skill's steps (38, 42, 47, 267), so no gate step number before this PR.

## The plan approver

- **Location:** `agents/redline-plan-approver.md`
- **Relevance:** R1-3's file.
- **Key lines:**
  - 1-6, frontmatter.
  - 16-22, checks 1 to 7. 22, check 7: "The tasks follow `agent-os/standards/` as `standards.md` records them" (why R1-2 can bounce a plan).
  - 23, check 8, this PR's: "a README section (and template, if any) with the commit or a "no reader-facing change" reason".
- **Neighbour:** `agents/redline-reviewer.md:34`, the reviewer's Docs bullet, asks only for "a README section named for it in the PR's spec plan", with no commit. It is consistent already and is not changed.

## The standard

- **Location:** `agent-os/standards/process/docs-gate.md`
- **Relevance:** R1-2's file, and where the retrospective items go.
- **Key lines:** 5, the rule (section and template, then the commit or the reason); 7, "under a "Docs entries" heading in `plan.md`; the gate confirms each names its commit or its reason"; 8, the Redline roles; 9-10, the two #13 lessons. 10 is why R1-3 changes check 8 rather than point 7.
- **Index:** `agent-os/standards/index.yml`, the `docs-gate` description. It stays accurate, so it is unchanged.
- **Format model:** `agent-os/standards/process/standards-retrospective.md` (lines 6-7: the retrospective route; line 9: headings kept).

## The workflow, for the order of roles and what a bounce costs

- **Location:** `workflows/redline-loop.js`
- **Key lines:**
  - 965, the shaper's reshape prompt after a bounce.
  - 1120, the implementer's prompt: "The standards commit's message names every finding whose fix one of these edits carries". The standards commit can carry R1-2.
  - 1343, the checker's verdict: a `fix` finding that no commit names fails the round. Met for R1-2 by the standards commit.
  - 1874 and 1877, the plan approver and the standards approver (phase Approve); 1966, the implementer (phase Implement). The approver reads the plan before any commit exists.
  - 1888-1889, the stop after `maxPlanAdjustments` bounces.
  - 1947-1950, `needCommits`: every `fix` and `defer` finding.
  - 1968-1969, a `blocked` implementer stops the run for the person (Task 3's fallback).
- **Configuration:** `.claude/redline.json:3`, `"maxPlanAdjustments": 2`.

## Earlier specs

- `agent-os/specs/2026-10-29-1559-13-docs-gate-step/`: this PR's spec. `plan.md` Task 3 drafted the standard's heading rule; Task 4 drafted check 8; Task 5 drafted the README sentence; Task 6 is its Docs entries table, naming "Task 5's commit". `shape.md` decision 3 explains point 7's fill-in order.
- `agent-os/specs/2026-10-23-0710-12-review-round-1/plan.md:222`: a finding whose standards line changes through the retrospective, not in the finding's commit.
- `agent-os/specs/2026-10-27-1215-45-review-round-1/plan.md` (Task 5 and As built): a standards commit that names the finding whose fix it carries.
- `agent-os/specs/2026-10-28-0639-47-review-round-1/`: the last review round, the model for this folder's layout, grep-based proofs where no harness reads the file, and the precedent of recording a caveat about another spec instead of rewriting it.

## Commits

- `bc6a18d` (#40): added gate step 9 and moved the retrospective from 9 to 10.
- `836c4b6` (#13): the gate edit, the restamp, both agent files, the README sentence and the #13 spec folder, in one commit.
- `589a5ee` (#13): the `docs-gate` standard, its index entry and the retrospective's renumbering.

## Tests that do not read these files

- `tests/loop-test.mjs:18` reads only `workflows/redline-loop.js`. No `tests/*.sh` reads `agents/` or `README.md` (`grep -rn "agents/redline\|README" tests/*.sh` finds only a fixture string in `tests/gh-test.sh:253`). Gate step 2, `claude plugin validate .`, parses the agent files.
- `tests/guard-cases.tsv` 388-404: the self-hosted rows. The implementer may write `agents/redline-reviewer.md`, `README.md` and `agent-os/standards/scripts/guard.md` in this checkout, the same prefixes this round's files sit under.
