# PR #37 review round 2 (launch 2026-10-26-0844): address R2-1

Shaped by Redline in unattended mode.

## Context

Redline round 2 on PR #37 (#9: a checker result the implementer cannot change stops the run instead of starting a repair pass) reviewed only the round 1 fix diff (`71c2e17..8ddffc7`) and found no correctness bug. This is the final nit round:

- **R2-1** (nit): the checker-text warning in `judge()` says `on a passing gate`, but since R1-3 it also fires on a round that passes with a gate that exited 1 because its only failing checks were failing at baseline. Planned as a **fix**: the warning says `on a round that passes`, the phrase `README.md:226` and `agent-os/standards/workflow/agents.md:15` already use.

Nothing is deferred and nothing is pending. See `shape.md` for the evidence.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them.
- A file a task does not name is not changed in this round. In particular `README.md`, `agents/redline-checker.md` and the round 1 spec folder are not changed: the README and the standard already say "a round that passes", and the checker file's "on a passing gate" sentence is still true of a passing gate (`shape.md`, Unattended answers).
- One commit per finding, in task order, each with the `redline:` prefix and the finding's ID. The spec folder goes in the round's first commit or on its own.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-0844-37-review-round-2/redline/snapshot.json` and read the `loop` check's `stdout` in its JSON. Every other proof is a plain `grep` from the repository root. At the start of the round the loop harness printed `165 checks passed, 0 failed` (round 1 As built, Task 4).
- **How the loop harness counts.** `go()` in `tests/loop-test.mjs` (lines 151-154) adds its own record-commit check to every scenario that reaches Finish. Both scenarios this round touches reach Finish before and after the change, so the only checks that move are the two changed assertions.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-26-0844-37-review-round-2/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` belongs to the workflow and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R2-1, the checker-text warning says "on a round that passes"

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`.

Red first (`testing/tests.md:18`).

1. **`tests/loop-test.mjs`, section 9.** In exactly two assertion strings, change the ending `on a passing gate')` to `on a round that passes')`:
   - line 465, in the check `checker: text on a passing gate is a warning, not a reason`: `run.res.warnings.includes('round 1: the checker reported "note from the checker" on a round that passes')`.
   - line 472, in the check `checker: text on a round whose only failure was failing at baseline is a warning, no repair`: `run.res.warnings.includes('round 1: the checker reported "checks.sh exited 1" on a round that passes')`.

   Keep both check names as they are (the line 465 scenario's gate does pass), and keep every other condition in both checks, including `round 1: guard still failing, as at baseline` at line 472. Leave the neighbours unchanged: the `""` case at line 463 (no warning at all) and `checker: a new failure with text ...` at line 474 (text as detail on a failure). Run the gate script before step 2 and record in this plan's As built that the two changed checks fail (expected: `163 checks passed, 2 failed`).

2. **`workflows/redline-loop.js:1013`, in `judge()`**: the warning becomes

   ```js
   warnings.push(`the checker reported "${said.slice(0, 200)}" on a round that passes`)
   ```

   Nothing else in `judge()` or in the file changes. The comment at line 931 (#34 round 2 "failed a passing gate") stays: that gate did pass.

Proof:
- The gate's `loop` check `stdout` ends `165 checks passed, 0 failed` and lists `ok` for `checker: text on a passing gate is a warning, not a reason`, `checker: text on a round whose only failure was failing at baseline is a warning, no repair`, the line 463 check that ends `the round passes with no repair and no warning`, and `checker: a new failure with text fails on the check, the text added, after one repair pass`.
- `grep -c "on a round that passes" workflows/redline-loop.js` prints 1.
- `grep -c "on a passing gate" workflows/redline-loop.js` prints 0.
- `grep -c "on a round that passes')" tests/loop-test.mjs` prints 2.
- `grep -c "on a passing gate')" tests/loop-test.mjs` prints 0.

## Task 3: Verification Gate

Files: `agent-os/standards/workflow/agents.md` (step 9, the retrospective commit); `agent-os/specs/2026-10-26-0844-37-review-round-2/plan.md` and `shape.md` (step 10).

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-0844-37-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edit is under `## Standards retrospective (proposed)` in `shape.md`: one new bullet in `agent-os/standards/workflow/agents.md`, after the bullet that begins "A message the run shows the person names a plugin file by its absolute path". The standards approver approves the list, and the implementer applies it in its own commit, touching only `agent-os/standards/workflow/agents.md`. The commit's message names no finding: R2-1's plan does not send part of its fix through the retrospective, so the edit is a lesson. If the approver approves no edit, the implementer records "Standards retrospective: no changes" under Decisions in `shape.md` instead.
- **Step 10, spec folder.** `plan.md` gets an As built section with the red run's failing check names, and any deviation is recorded under Decisions in `shape.md`.

Proof (step 9, when item 1 is approved):
- `grep -c "#37, R2-1" agent-os/standards/workflow/agents.md` prints 1.
- `grep -c "^# " agent-os/standards/workflow/agents.md` prints 1 (the file's only heading is unchanged).

## As built

- **Task 1.** The four spec files committed on their own; `redline/` left to the workflow.
- **Task 2, red.** With only the two assertions changed, the gate's `loop` check printed `163 checks passed, 2 failed`, the two failing checks being `checker: text on a passing gate is a warning, not a reason` and `checker: text on a round whose only failure was failing at baseline is a warning, no repair` (each still saw `... on a passing gate` in `warnings`).
- **Task 2, green.** After the one-string change at `workflows/redline-loop.js:1013`, the `loop` check printed `165 checks passed, 0 failed`, and every gate check exited 0. The four grep proofs print 1, 0, 2 and 0.
- **Task 3.** The approved bullet landed in `agent-os/standards/workflow/agents.md` after the `pluginRoot` bullet, in its own commit naming no finding; its two grep proofs print 1 and 1.
- **No deviations.** One note on the shaping record, from the plan approver: the `grep -rn "passing gate"` in `shape.md` prints six lines, not five; the sixth, `agent-os/standards/testing/tests.md:8`, describes a gate that really passes and stays as it is.
