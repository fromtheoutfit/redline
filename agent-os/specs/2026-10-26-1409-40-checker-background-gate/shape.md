# Running a long gate in the background (#40) — Shaping Notes

## Scope

Issue #40. Losers League PR #790 stopped at the baseline before any fix. The checker ran `checks.sh --baseline` in the foreground with the Bash tool's 600 s cap, and LL's gate takes about 732 s (`baseline.seconds` in LL's `checks.json`). The tool moved the run to the background and answered the checker, verbatim from the run's transcript:

> Command did not complete within its 600s timeout and was moved to the background (ID: buvcnrgdt). Output is being written to: …/tasks/buvcnrgdt.output. If it exits while you are still working you will be notified, but it is terminated when you give your final response and no notification can follow that — so do not end your turn to wait for it; if you need its result, wait for it before giving your final response.

The checker may not read files, so it returned `result_unreadable` with reason `spilled` and ended its turn. The task's output file ends in `[killed]` and `Terminated: 15`: the gate died with the checker.

The change: when the recorded baseline is over 480 s or unknown, the workflow gives the checker and the implementer a start/wait pair (`scripts/redline-background.sh`), so a long gate runs to completion and its JSON and exit code come back exactly as a foreground run prints them. Short gates keep today's foreground path with the same prompt text. The README says that `git-only` saves the per-round check, not the baseline. A foreground run the tool moves to the background anyway stops with a message naming the recorded baseline.

Shaped by hand with `/agent-os:shape-spec` on 2026-10-26; the person makes the commits.

## Decisions

- **The checker and the implementer both get the pair.** Asked 2026-10-26. The implementer's rule ("run it with `run_in_background: true` and read the output file it names when the exit notification arrives") has the same flaw: a subagent's background task is terminated at its final response, and there is nothing to do while waiting. In `git-only` mode (LL) the implementer's run is the only test run a round gets, so fixing the checker alone would move where LL stalls.
- **A plugin script owns the run; the agent runs two commands.** Asked 2026-10-26. `start` runs the repository's own `checks.sh` and keeps its stdout, stderr and exit code in files under `$TMPDIR/redline-background/`, with a pid file. `wait` blocks for up to one slice, then replays them as a foreground run would print them. It exits 3 while the gate is still running, 4 past `--limit`, and 5 when the run is gone with no result. The issue's "redirect stdout to a file and poll it" would need the checker to read files, which #9 kept from it on purpose. It would also lose the exit code (the verdict reads it, never `ok`; workflow/agents) and leave a Haiku polling turn after turn: Claude Code blocks a long foreground `sleep` ("Long leading `sleep` commands are blocked").
- **`start` runs under the harness's `run_in_background`; it does not detach itself.** The harness keeps a background task alive while the agent works and kills it when the agent ends, so a run that stops leaves no 12-minute gate running behind it. `start` runs only `<toplevel>/.claude/redline/checks.sh`, never a command it is given, so the guard admits it as part of the `checks` group without vetting an inner command.
- **The threshold is 480 s, and an unknown baseline backgrounds.** As the issue says: the Bash tool's foreground cap is 600 s, and 480 leaves a fifth for a slow day. The skill passes `baselineSeconds` from `.claude/redline/checks.json` (`baseline.seconds`, null when absent). A run launched before this change has no field, so it backgrounds, which is what the #790 relaunch needs.
- **`--limit` bounds the wait, not the stall watchdog.** The issue says "the stall watchdog (`checkerStallMs`) already covers a hang". The watchdog restarts an agent after it has been *silent* for the window (DESIGN.md: "A silent agent is restarted automatically after the stall window; give the checker a long `stallMs` on slow suites"). In background mode the agent makes a new `wait` call every slice, which is activity, so the watchdog never fires on a hung gate. The workflow passes `--limit <checkerStallMs in seconds>`: the window setup sized as the longest a gate may run (1.7 times the baseline, rounded up to five minutes) bounds the background gate the way it bounds a foreground one. The slice (240 s) stays under both the tool's 600 s cap and setup's 300000 ms floor for the window, so no single call trips the watchdog.
- **Two new reasons, not a reworded `spilled`.** Asked 2026-10-26. `backgrounded`: a foreground run the tool moved to the background. Its message is the issue's, `the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: <n> s)`, and its fix is to re-record `baseline.seconds`. `no_result`: a background run whose wait reported the limit passed or the run gone. `spilled` keeps its output-size cause and its fix (cap the output). Two causes with two fixes are two reasons, because the message is what the person acts on.
- **The script's harness is gate step 9.** Asked 2026-10-26. `tests/background-test.sh`, the way #33 made `tests/gh-test.sh` step 8. The retrospective becomes step 10 and the spec folder step 11. `checks.json` gains the step, `checks.sh` is regenerated and restamped, and CLAUDE.md, the gate's prose and the standards that count the steps move with it.
- **Tags, not clocks.** A run's files are named `<stamp>-<pr>-<tag>`, the tag taken from the agent's label (`baseline`, `check-r1`, `implement-r1`, …), so every prompt is deterministic and a relaunch replays (workflow/replay). `start` removes the label's old files first, so a rerun under the same label never returns an earlier result.
- **Deviations while building** (see `plan.md`, As built): the foreground checker prompt names `backgrounded` (one sentence), because its "saved to a file" also fit the moved-to-background notice. A `--git-only` check stays in the foreground, since it runs no command. The implementer reports wait exit 4 or 5 under `blocked`. The checker returns `exit: -1` when there is no exit code. The baseline is re-measured at 78 s.
- **Out of scope:** `checks.sh` and the template (the gate runs unchanged inside `start`); `redline-setup.sh config` (the window rule stands); the Monitor tool, which the hook matcher does not cover (noted below, not changed).

## Context

- **Visuals:** None.
- **References:** see `references.md`: the implementer's background rule this replaces, the #9 spec behind `result_unreadable` and `stopReason()`, commit `b649acd` (#33) for adding a gate step, and `redline-internal`'s STEP14-NOTES.md §6 item 2, which named this as untested.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach": a run that stops names its cause and its fix, and a long gate no longer ends a run for a reason the person cannot see. Nothing in the roadmap covers #40.

## Standards Applied

- scripts/bash-conventions — the new script's header, its one JSON object, exit 2 for usage, and exit codes that are an answer stated in the header
- scripts/guard — a new member of the `checks` group, never a looser parse; every guard change proven by a `tests/guard-cases.tsv` row beside a neighbouring one
- testing/tests — a new harness, red before green, a boundary case that asserts the boundary, outputs pinned against a literal before comparing them
- workflow/agents — the checker's distinct status and reasons; a role's prompt names only commands the guard allows; the verdict reads the exit code, never `ok`
- workflow/replay — no clock in the workflow; `baselineSeconds` enters through `args`; a relaunch keeps `args` byte-identical
- process/standards-retrospective — gate step 10 of this spec
- prompts/attribution — no model or vendor name in the script, the agents or the messages

## Standards retrospective

Approved and applied 2026-10-26, for the person's own commit, separate from the code:
- `agent-os/standards/workflow/agents.md`: a new bullet (a role never ends its turn to wait on a background task; the start/wait pair for a gate over 480 s or with no recorded baseline; `--limit`, not the stall watchdog, bounds a hung gate), and the `result_unreadable` bullet gains "two causes with two fixes are two reasons" (`backgrounded`, not `spilled`).
- `agent-os/standards/scripts/bash-conventions.md`: a new bullet (a wrapper passes the wrapped script's output and exit codes through, takes the codes above them for its own, and runs one fixed script).
- `agent-os/standards/testing/tests.md`: "Seven harnesses"; a bullet for `tests/background-test.sh`; a bullet on bounding a harness's poll, from the red run that hung.
- `agent-os/standards/process/standards-retrospective.md`: "Gate step 10"; `agent-os/standards/index.yml`: the testing description lists `background-test.sh`.

scripts/guard, workflow/replay and prompts/attribution: no changes (the guard grew by a new member of a group, as its standard says; the run labels read no clock, as replay says).

## Noticed, outside #40

`hooks/hooks.json` matches Bash, Write, Edit, MultiEdit and NotebookEdit. If a subagent can call the Monitor tool (it runs a shell command, and no role's `disallowedTools` lists it), that command runs without the guard. Not confirmed; worth an issue once it is.
