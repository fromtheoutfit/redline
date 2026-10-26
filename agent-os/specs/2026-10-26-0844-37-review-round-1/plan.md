# PR #37 review round 1 (launch 2026-10-26-0844): address R1-1, R1-2 and R1-3

Shaped by Redline in unattended mode.

## Context

Redline round 1 on PR #37 (#9: a checker result the implementer cannot change stops the run instead of starting a repair pass) reviewed the whole PR and found three things at the edges of the new rules:

- **R1-1** (nit): a usage error (exit 2) is sent to `result_unreadable` before the exit-2 rule, in the checker's instructions, in the `checkerPrompt` sentence and in `stopReason()`. The stop names the wrong cause. Planned as a **fix**.
- **R1-2** (nit): the spilled stop names `scripts/checks-template.sh` relative to the plugin. Planned as a **fix**.
- **R1-3** (correctness): checker text fails a round whose only failing checks were already failing at baseline. The #9 spec states two rules that give opposite verdicts in this case; the person decided "Text never decides" (`shape.md`, Decisions). Planned as a **fix**.

Nothing is deferred. See `shape.md` for the evidence behind each disposition and the R1-3 decision.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them.
- A file a task does not name is not changed in this round. The #9 spec folder (`agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/`) is a record of what was built and is not edited. `README.md` is not changed by Tasks 2 and 3: its Exit code paragraph (line 226) names neither the check order nor the template path. Task 4 changes that paragraph's two sentences on what the workflow reads and on the checker's `error`, and nothing else in `README.md`.
- One commit per finding, in task order, each with the `redline:` prefix and the finding's ID. The spec folder goes in the round's first commit or on its own.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script. Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-0844-37-review-round-1/redline/snapshot.json` and read the `loop` check's `stdout` in its JSON. Every other proof is a plain `grep` from the repository root. At the start of the round the loop harness printed `160 checks passed, 0 failed` (the #9 spec's As built).
- **How the loop harness counts.** `go()` in `tests/loop-test.mjs` (lines 151-154) adds one check of its own, `<name>: the run-record commit is the last call, after the closing comment`, to every scenario that reaches Finish (`handoffPosted` in the result, or status `capped`) without `recordFiles`. A scenario that stops at `check` adds none. Each expected count below follows from that.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-26-0844-37-review-round-1/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` belongs to the workflow and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R1-1, a usage error is exit 2 before it is unreadable

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`, `agents/redline-checker.md`.

Red first (`testing/tests.md`: a bug fix lands red before green).

1. **`tests/loop-test.mjs`, section 9.** After the existing `checker: exit 2` case and its check (line 483), add:

   ```js
   run = await go('checker: exit 2 read as unreadable', baseArgs, { ...base, checker: (label) => (label === 'check r1' ? { exit: 2, status: 'result_unreadable', reason: 'not_json', result: null, error: 'checks.sh: a snapshot file is required unless --baseline is given' } : null) })
   check('stop: a usage error the checker called unreadable still names exit 2, no repair', stopped(run) && run.res.error.includes('checks.sh exited 2 (usage error)') && !run.res.error.includes('not one JSON object') && run.res.error.includes('the checker said: checks.sh: a snapshot file is required') && run.res.error.includes(`run ${command} by hand`), brief(run))
   check('stop: the checker prompt says a usage error is status read', pick(run.calls, 'check r1').prompt.includes('A usage error (exit 2) is status read with result null, never result_unreadable.'), pick(run.calls, 'check r1').prompt.split('\n').slice(-3))
   ```

   The first case scripts the shape the prompt steers the checker to today, so the mock answers as the real agent would (`testing/tests.md:7`). Leave the neighbours unchanged: the `status: 'read'` exit-2 case (lines 482-483) and the `not_json` case at exit 0 (lines 476-477), which must still say `not one JSON object`. Run the gate script before step 2 and record in this plan's As built that the two new checks fail (expected: `160 checks passed, 2 failed`). The new scenario stops at `check`, so `go()` adds no check of its own, before or after the fix.

2. **`workflows/redline-loop.js`, `stopReason()`** (lines 939-961): move the block

   ```js
   if (out.exit === 2) {
     return `checks.sh exited 2 (usage error)${suffix}${byHand}`
   }
   ```

   from below the `result_unreadable` block to directly above it, after the `byHand` constant. Nothing else in the function changes. The `!out.result` and `needGit` tests stay below both.

3. **`workflows/redline-loop.js`, `checkerPrompt()`** (line 826): after the sentence ending `return status result_unreadable with the reason, as your instructions say.`, add on the same line, after one space: `A usage error (exit 2) is status read with result null, never result_unreadable.` The command line stays the prompt's last line.

4. **`agents/redline-checker.md`, "What you do"**: make the exit-2 rule the step before the unreadable rule.
   - Step 3 becomes the current step 4, reworded: "If the script exits 2 (usage error), it printed a reason on stderr and no JSON: return `status` `read`, `reason` `""`, `result` null, the exit code and the stderr under `error`. That is not `result_unreadable`: there was no output to read."
   - Step 4 becomes the current step 3, opening "Otherwise, if the tool did not show you that JSON, set `status` to `result_unreadable`, ...". Its three reason bullets (`spilled`, `not_json`, `no_git_block`) and the sentence on what the workflow does stay unchanged.
   - Steps 1 and 2, the "In every case" line and "What you return" stay as they are in this task. (Task 4 changes the last sentence of "What you return", in R1-3's commit.)

Proof:
- The gate's `loop` check `stdout` ends `162 checks passed, 0 failed` and lists `ok` for `stop: a usage error the checker called unreadable still names exit 2, no repair` and `stop: the checker prompt says a usage error is status read`.
- `grep -n -e "out.exit === 2" -e "out.status === 'result_unreadable'" workflows/redline-loop.js` prints the `out.exit === 2` line first.
- `grep -c "never result_unreadable" workflows/redline-loop.js` prints 1.
- `grep -n -e "exits 2" -e "result_unreadable" agents/redline-checker.md` prints the `exits 2` step before the first step line that sets `status` to `result_unreadable`.

## Task 3: R1-2, the spilled stop names the template by its absolute path

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`.

Red first.

1. **`tests/loop-test.mjs:472`**: change `run.res.error.includes('emit_checks in scripts/checks-template.sh')` to `run.res.error.includes('emit_checks in /p/scripts/checks-template.sh')` (`baseArgs.pluginRoot` is `/p`, line 131). Keep the case name and its other three conditions. Run the gate script before step 2 and record in As built that `unreadable: stops at check with the cause and the fix, no repair` fails (expected: `161 checks passed, 1 failed`).
2. **`workflows/redline-loop.js:945`**: the `spilled` cause becomes a template literal ending `cap it, see emit_checks in ${pluginRoot}/scripts/checks-template.sh`, with the rest of the sentence unchanged. `pluginRoot` is the module constant at line 43, already used for `GH` at line 131.

Proof:
- The gate's `loop` check `stdout` ends `162 checks passed, 0 failed` (Task 3 changes an assertion and adds none) and lists `ok` for `unreadable: stops at check with the cause and the fix, no repair`.
- `grep -c "pluginRoot}/scripts/checks-template.sh" workflows/redline-loop.js` prints 1.
- `grep -c "see emit_checks in scripts/checks-template.sh" workflows/redline-loop.js` prints 0.
- `grep -c "emit_checks in /p/scripts/checks-template.sh" tests/loop-test.mjs` prints 1.

## Task 4: R1-3, the checker's text never decides the verdict

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`, `agents/redline-checker.md`, `README.md`.

Decided by the person: "Text never decides" (`shape.md`, Decisions). The verdict comes from each check's `exit` against the baseline, the git block and the gate's exit code; the checker's `error` text is carried as a warning on a round that passes, or as detail on a failure those already established. Runs after Tasks 2 and 3, so the loop harness starts at `162 checks passed, 0 failed`.

Red first.

1. **`tests/loop-test.mjs`, section 9.** After the `checker: a failing check is repaired` case and its check (the line after `const failingCheck = ...`), add:

   ```js
   run = await go('checker: baseline failure with text', baseArgs, { ...base, checker: (label, out) => (label === 'baseline' ? failingCheck(out) : full(label) ? { ...failingCheck(out), error: 'checks.sh exited 1' } : null) })
   check('checker: text on a round whose only failure was failing at baseline is a warning, no repair', run.res.status === 'done' && !repaired(run) && !!pick(run.calls, 'push and reply r1') && run.res.warnings.includes('round 1: the checker reported "checks.sh exited 1" on a passing gate') && run.res.warnings.includes('round 1: guard still failing, as at baseline'), [run.res.status, labels(run.calls), run.res.warnings])
   run = await go('checker: new failure with text', baseArgs, { ...base, checker: (label, out) => (full(label) ? { ...failingCheck(out), error: 'checks.sh exited 1' } : null) })
   check('checker: a new failure with text fails on the check, the text added, after one repair pass', run.res.status === 'error' && run.res.stage === 'check' && labels(run.calls).filter((l) => l === 'repair r1').length === 1 && run.res.error.includes('failing checks: guard') && run.res.error.includes('checker error: checks.sh exited 1') && run.res.error.includes('after one repair pass'), brief(run))
   ```

   The first is the reviewer's scenario: the baseline and every full check fail `guard`, and the checker writes a note. The second is its neighbour that must not change: a new failure with the same note still fails after one repair pass, with the check as the reason and the text added. Leave unchanged `checker: ok false with a message` (it still fails after one repair pass, now through the `checks.sh exited 1` fallback with `checker error: guard: 2 mismatched` added) and `checker: text on a passing gate is a warning, not a reason` (the warning string is unchanged). Run the gate script before step 2 and record in As built that the first new check fails and the second passes (expected: `163 checks passed, 1 failed`). The red count goes up by 2 and the green count by 3 because of `go()`'s own check (lines 151-154): before the fix both new scenarios stop at `check` and `go()` adds nothing, while after the fix `checker: baseline failure with text` reaches Finish with `handoffPosted` in its result and no `recordFiles`, so `go()` adds `checker: baseline failure with text: the run-record commit is the last call, after the closing comment`, and the green run is 162 + 2 + 1 = 165.

2. **`workflows/redline-loop.js`, `judge()`** (lines 968-1015): move the `if (out.exit !== 0 && reasons.length === 0 && preExisting.length === 0)` fallback above the checker-text block, so `reasons` holds only what the checks, the git block and the exit code establish. Then the text block becomes:

   ```js
   // The checker's error is text, never a verdict input (#37, R1-3): detail on a failure the
   // checks, the git block or the exit code already established, a warning otherwise.
   const said = errorText(out)
   const warnings = []
   if (said && reasons.length) {
     reasons.push(`checker error: ${said.slice(0, 400)}`)
   } else if (said) {
     warnings.push(`the checker reported "${said.slice(0, 200)}" on a passing gate`)
   }
   ```

   The `result.ok !== true || out.exit !== 0` condition goes; nothing else in `judge()` reads `ok`. The return statement is unchanged.

3. **The two statements that still name `ok` as a verdict input.** Once step 2 removes `judge()`'s only read of `ok`, each would contradict the code and the decision. Only these sentences change in each file.
   - **`workflows/redline-loop.js:924-925`**, the header comment of the checker's-verdict section. The parenthetical `(ok, exit, the checks, the git block)` becomes `(each check's exit against the baseline, the exit code, the git block)`, so the sentence reads "It decides from the gate's own fields (each check's exit against the baseline, the exit code, the git block); the checker's error field is text." The comment keeps saying the error field is text; the comment lines may be rewrapped, and the rest of the header (from "A result the implementer cannot change" on) stays as it is.
   - **`agents/redline-checker.md:44`**, the last sentence of "What you return". It becomes "The workflow decides from `result` (each check's `exit` against the baseline, the exit code, the git block); on a passing gate, text in `error` is at most a warning." The sentences before it on that line stay as they are.

   In `workflows/redline-loop.js`, nothing outside `judge()` and that header comment changes in this task.

4. **`README.md`, the Exit code paragraph (line 226).** Replace "The workflow reads `ok` and the git block; the implementer reads the failing check's output." with "The workflow reads each check's `exit`, the exit code and the git block; the implementer reads the failing check's output." Replace "The checker's own `error` field is text: a warning in the run's `warnings` on a passing gate, part of the reason on a failing one, and `""` counts as empty (#34 round 2 failed a green gate on it)." with "The checker's own `error` field is text and never decides the verdict: it is a warning in the run's `warnings` on a round that passes, a round whose only failing checks were failing at baseline included, and detail added to the reasons on one the checks, the git block or the exit code already failed; `""` counts as empty (#34 round 2 failed a green gate on it; #37, R1-3)." The rest of the paragraph, and the Baseline paragraph, stay as they are.

The `agent-os/standards/workflow/agents.md` wording (lines 7 and 14) goes through the standards retrospective (`shape.md`, items 4 and 5), in its own commit, not in this task's commit.

Proof:
- The gate's `loop` check `stdout` ends `165 checks passed, 0 failed` and lists `ok` for `checker: text on a round whose only failure was failing at baseline is a warning, no repair`, `checker: baseline failure with text: the run-record commit is the last call, after the closing comment`, `checker: a new failure with text fails on the check, the text added, after one repair pass` and `checker: a failing gate's error is the reason, after one repair pass`.
- `grep -c "result.ok !== true" workflows/redline-loop.js` prints 0.
- `grep -n -e "checks.sh exited .{out.exit}" -e "if (said && reasons.length)" workflows/redline-loop.js` prints the `checks.sh exited` line first.
- `grep -c "(ok, exit" workflows/redline-loop.js` prints 0.
- `grep -c "ok., .exit., the checks" agents/redline-checker.md` prints 0, and `grep -c "each check.s .exit. against the baseline, the exit code, the git block" agents/redline-checker.md` prints 1.
- `grep -c "never decides the verdict" README.md` prints 1, and `grep -c "The workflow reads .ok. and the git block" README.md` prints 0.

## Task 5: Verification Gate

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md` (step 9, the retrospective commit); `agent-os/specs/2026-10-26-0844-37-review-round-1/plan.md` and `shape.md` (step 10).

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-0844-37-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`; items 4 and 5 were drafted for R1-3 after the person's decision. Item 4 rewords the checker-`error` sentence of the bullet at `agent-os/standards/workflow/agents.md:14`. Item 5 rewords the second sentence of the bullet at `agent-os/standards/workflow/agents.md:7`, which still names `ok` as the checker's verdict input, and leaves that bullet's first sentence as it is. The standards approver approves the list, and the implementer applies it in its own commit, touching only the files the list names: `agent-os/standards/workflow/agents.md` and `agent-os/standards/testing/tests.md`. The commit's message names no finding unless a finding's plan sends part of its fix through the retrospective, and none here does. If the approver approves no edit, the implementer records "Standards retrospective: no changes" under Decisions in `shape.md` instead.
- **Step 10, spec folder.** `plan.md` gets an As built section with the red runs' failing check names, and any deviation is recorded under Decisions in `shape.md`.

Proof (step 9, when items 4 and 5 are approved):
- `grep -c "JSON (.ok., .unexpected_files" agent-os/standards/workflow/agents.md` prints 0.
- `grep -c "never .ok. and never the checker's error text" agent-os/standards/workflow/agents.md` prints 1.
- `grep -c "never a verdict input" agent-os/standards/workflow/agents.md` prints 1.
- `grep -c "the workflow reads fields, never text" agent-os/standards/workflow/agents.md` prints 1.
