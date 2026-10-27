# PR #43 review round 1 — Plan

Shaped by Redline in unattended mode. This is the final nit round: round 1 found no correctness bug and one nit, R1-1, which needs a decision. It was returned to the person as a judgment call, and the person chose (A), normalize once as `run()` returns (decided by @michaelfromtheoutfit, 2026-10-27; see Decisions in `shape.md`). Task 2 is that change. Nothing is deferred. Every commit message starts `redline: ` and references (#42), the PR's issue.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-27-0923-43-review-round-1/plan.md`, `agent-os/specs/2026-10-27-0923-43-review-round-1/shape.md`, `agent-os/specs/2026-10-27-0923-43-review-round-1/standards.md`, `agent-os/specs/2026-10-27-0923-43-review-round-1/references.md` (already written by the shaper). Commit them in the round's first commit or on their own, never with a finding's change; leave `redline/` under the folder to the workflow.

## Task 2: R1-1 normalize every agent's error once, as run() returns it

Decided (A), normalize once, as `run()` returns, by @michaelfromtheoutfit on 2026-10-27: "Normalize every agent's error field once, as run() returns it, so any later check can read .error safely; this is the fix #42 asked for and removes the failure instead of documenting it, and the only cost is that detail.checker keeps the normalized error, not the raw one." The story, the options and the recommendation are under Decisions in `shape.md`.

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `README.md` (and `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md` through Task 3).

Today: `run()` (`workflows/redline-loop.js` 227-233) returns each agent's `error` as the model wrote it, and nine checks across eight operations read it through `errorText()` (gather 1345, post 1399, push-and-reply 1533 and 1792, snapshot 1691, the PR description update 1913, the finish comment 1925, the record status listing 1943, the record commit 1961), beside the checker's two (`stopReason` 1175, `judge` 1245). `errorText` (1164-1170) sits under "The checker's verdict" (1157-1162). The loop test scripts `'""'` at one of the nine (the description update, cases 356-359). `detail.checker` is the result `run()` returned (`stageError` extras at 1704 and 1748), so it will hold the normalized `error`.

Red first, in `tests/loop-test.mjs`:

- The push mock (line 63) returns `error: scenario.pushError || ''`, with a one-line comment like the `postError` and `updateError` ones.
- Section 9 (checker results, 459-507): a stop on `check r1` with `exit: 2`, `status: 'read'`, `result: null`, `error: '""'` asserts the run stops at check and `kept(run).error === ''`. Name it `checker: a stop keeps the checker's error normalized in the record`. Red against today's loop, which keeps `'""'`.
- Beside the #778 cases (409-415): `postError: '""'` on a consistent review (every finding inline) asserts `status === 'done'`, `shape r1` ran, and no warning contains `reported an error`.
- Beside the description cases (356-359): `pushError: '""'` asserts `status === 'done'` and `handoff comment` is among the labels.
- Unchanged neighbours: the description `'""'` and `gh: HTTP 422` cases (356-359), the failed record commit (387-388), the #778 text cases (409-415), the checker text cases (473-485).

Then `workflows/redline-loop.js`:

- Move `errorText` and its docblock (1164-1170) out of "The checker's verdict" to just above `run()` (after `stageError`, 223-225). The docblock says `run()` applies it to every agent's result as it comes back, so a call site reads `.error` as it is.
- `run()`: after the null check, when the result is an object with an `error` key, return `{ ...out, error: errorText(out) }` (a copy, so the object `agent()` handed back is left as it was); otherwise return `out`.
- The nine checks read the field again: `if (facts.error)` (1345), `if (posted.error)` (1399), `if (pushed.error)` (1533, 1792), `if (written.error)` (1691), `if (updated.error)` (1913), `if (out.error)` (1925, 1961), `if (status.error)` (1943). Their messages already use `.error`, which is now the normalized text. `stopReason` (1175) and `judge` (1245) read `out.error`, so `errorText` has one caller.

And `README.md`, line 232:

- "`""` counts as empty (#34 round 2 failed a green gate on it; #37, R1-3)" becomes "`""`, `''` and `null` count as empty, for this and every agent's `error`, which the workflow normalizes once as each result comes back (#34 round 2 failed a green gate on `""`; #37, R1-3; #42)".
- "The run's `detail.checker` keeps whatever the checker returned." becomes "The run's `detail.checker` keeps whatever the checker returned, its `error` normalized."

Proof: the gate's `loop` check prints `N checks passed, 0 failed`, the new checker case seen red first; `grep -c "if (errorText(" workflows/redline-loop.js` prints `0`.

Commit: `redline: R1-1 normalize every agent's error once, as run() returns it (#42)`

Options (B), keep the per-check calls and write the rule down, and (C), accept as built, were not chosen; they stay in `shape.md` as the record of what the person saw.

## Task 3: Standards retrospective

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`

Both items under "Standards retrospective (proposed)" in `shape.md` are drafted from R1-1's decision (A). Apply only the edits the standards approver approved, in one commit after the finding commit, keeping each file's headings. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when edits are approved): `redline: record the round 1 review lessons in the standards (#42)`

## Task 4: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-27-0923-43-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Standards retrospective** — Task 3, from the proposed list in `shape.md`, as the standards approver approved it.
11. **Spec folder** — `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md` (the As built notes land in the round's last commit).

## As built

- **Task 1** as planned: the four spec files in their own commit; `redline/` left to the workflow.
- **Task 2** as planned. `errorText` and its docblock sit just above `run()`, after `stageError`; `run()` returns `{ ...out, error: errorText(out) }` when the result is an object with an `error` key, and `out` otherwise. The nine checks read `.error`, and `stopReason` and `judge` read `out.error`, so `errorText` has one caller (`grep -c "if (errorText(" workflows/redline-loop.js` prints `0`). The push mock takes `scenario.pushError`; the three cases sit where the plan put them. `README.md:232` carries both phrases.
  - The guard refuses `node` to the implementer, so the loop test ran through the gate. With only the test edits in place the `loop` check printed `260 checks passed, 1 failed`, the one failure the new `checker: a stop keeps the checker's error normalized in the record` (`detail.checker.error` was `'""'`); the post and push-and-reply `'""'` cases were green against the per-check form, as the plan expected. After the fix it printed `261 checks passed, 0 failed`.
- **Task 3**: the three approved edits, two in `agent-os/standards/workflow/agents.md` and one in `agent-os/standards/testing/tests.md`, with no heading changed. Deviation: the commit message is `redline: record the round 1 review lessons in the standards, finishing R1-1 (#42)`, not the message above, because Task 2 sends part of R1-1's fix (the empty-text rule the finding names at `agents.md:17`) through this commit, so R1-1's reply names both commits. Recorded under Decisions in `shape.md`.
- **Task 4**: the gate green; its JSON is the evidence.
