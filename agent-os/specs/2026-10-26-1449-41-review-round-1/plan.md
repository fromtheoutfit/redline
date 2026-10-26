# PR #41 review round 1 — Plan

Shaped by Redline in unattended mode. Findings R1-1, R1-2 and R1-3 are all `fix`; nothing is deferred and no decision is pending. Every commit message starts `redline: ` and references (#40), the PR's issue.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-26-1449-41-review-round-1/plan.md`, `shape.md`, `standards.md`, `references.md` (already written by the shaper). Commit them in the round's first commit or on their own, never with a finding's change; leave `redline/` under the folder to the workflow.

## Task 2: R1-1 — separate the setup script and the GitHub wrapper in the harness list

Files: `agent-os/product/tech-stack.md`

- Line 16: add a comma after the setup script's closing parenthesis, so the list reads "... the setup script (`tests/setup-test.sh` over `tests/setup-fixtures/`), the GitHub wrapper (`tests/gh-test.sh` over `tests/gh-fixtures/`, with a fake `gh`) and the background runner (...)". Change nothing else in the file.
- Proof: `grep -c "setup-fixtures/.), the GitHub wrapper" agent-os/product/tech-stack.md` prints `1`.
- Commit: `redline: R1-1 separate the setup script and the GitHub wrapper in the harness list (#40)`

## Task 3: R1-2 — a background result is read once

Files: `tests/background-test.sh`, `scripts/redline-background.sh`, `README.md`

Red first (tests/tests: a bug fix lands red before green), in `tests/background-test.sh`:

- Replace the case "exit 0: stdout equals the kept file" (line 65) with a case that the label's files are gone once a wait has returned its result: `same "a returned result is read once: the label's files are gone" "$(ls "$FILES" | grep -c '^pass0\.')" "0"`.
- After it, add: `waitfor pass0 --slice 2`, then `same "a wait on a label whose result was read exits 5" "$code" "5"`.
- In "# a rerun under the same label": keep the first run and its "first run under the label passes" case; then remove the `within 5 ! -f "$FILES/again.exit" || bad ...` line (line 131), so the rerun's `STUB_SLEEP=2 STUB_EXIT=1 bg again` is followed at once by `waitfor again`, as a role's back-to-back calls would be. Keep the case "a rerun's wait returns the new result, not the earlier one" (exit 1) and add `same "a rerun's wait prints the new run's JSON" "$(jq -r '.ok' <<<"$out")" "false"`.
- Run `tests/background-test.sh` and see the read-once cases fail against today's script.

Then the fix, in `scripts/redline-background.sh`:

- In `wait`'s `.exit` branch (lines 113-118): after printing `<label>.err` to stderr and `<label>.json` to stdout, remove the label's files with the same list `start` clears at line 77 (`"$base.json" "$base.json.part" "$base.err" "$base.exit" "$base.exit.part" "$base.pid" "$base.started"`), then exit with the code. Remove only after printing.
- Header: in the `wait` paragraph (lines 18-24), add: "A finished result is read once: the wait that returns it removes the label's files, so a later wait under the label waits for the next start's pid and never returns an earlier run's result (#41, R1-2). A run stopped before any wait read it leaves a pid and no exit code; a wait sent before the next start clears them exits 5." In the `start` paragraph (lines 14-16), keep "Removes the label's earlier files".

And `README.md`, section "`redline-background.sh`":

- The paragraph at line 264: after "Its files live under `$TMPDIR/redline-background/<label>.*`", add "until a wait has returned the run's result: each result is read once, so a rerun under the same label never returns the earlier run's".
- The `wait` row of the table (line 269): after "prints its stderr and stdout as `checks.sh` printed them" add ", then removes the label's files".

Proof: `tests/background-test.sh` prints `N passed, 0 failed`.

Commit: `redline: R1-2 read a background result once, so a rerun's wait never returns the earlier run's (#40)`

## Task 4: R1-3 — a checks.sh exit outside 0, 1 and 2 is reported as no result

Files: `tests/background-test.sh`, `scripts/redline-background.sh`, `README.md`, `agents/redline-checker.md`

Red first, in `tests/background-test.sh`:

- The stub already exits with `STUB_EXIT` and prints its JSON for any value but 2. Update the header comment (line 10) from "STUB_EXIT (0, 1 or 2)" to "STUB_EXIT (0, 1, 2, or 3 for a checks.sh that left its contract)".
- After the exit-2 cases (line 76), add: `STUB_EXIT=3 bg exit3 snap.json`, `waitfor exit3`, then `same "exit 3 from checks.sh: wait exits 5, not still running" "$code" "5"` and `has "exit 3 from checks.sh: says checks.sh gave no gate result" "$err" "checks.sh exited 3 without a gate result"`. The exit-2 cases above stay unchanged as the neighbouring decision.
- Run `tests/background-test.sh` and see the new cases fail against the Task 3 script.

Then the fix, in `scripts/redline-background.sh`:

- In `wait`'s `.exit` branch: print stderr and stdout as now and remove the label's files (Task 3). Then, when the code is 0, 1 or 2, exit with it; otherwise print `redline-background: checks.sh exited <code> without a gate result` on stderr and exit 5.
- Header: lines 22-23, "and exits with checks.sh's exit code" becomes "and exits with checks.sh's exit code when that is 0, 1 or 2". In "Exit codes of wait" (lines 34-41), the 5 entry adds "or checks.sh exited with a code other than 0, 1 or 2 (a command failing under its set -e, a signal), named on stderr (#41, R1-3)".

`README.md`:

- Line 232, the `no_result` parenthetical: "`no_result` when a background run's wait reported the limit passed or the run gone" becomes "`no_result` when a background run's wait reported the limit passed, the run gone, or a `checks.sh` exit other than 0, 1 or 2".
- Line 236 ("Long gates"): "The wait prints what `checks.sh` printed and exits with its exit code" becomes "The wait prints what `checks.sh` printed and exits with its exit code when that is 0, 1 or 2 (any other code is the wait's 5, no result)".
- The `wait` row of the table (line 269), exit column: "5 the run ended without a result, or never started" becomes "5 the run ended without a result, never started, or `checks.sh` exited with another code".

`agents/redline-checker.md`, line 25: "then prints what `checks.sh` printed and exits with its exit code, or says it is still running" becomes "then prints what `checks.sh` printed and exits with its exit code when that is 0, 1 or 2, or says it is still running, past its limit or without a result". Steps 3 to 5 under "A start command and a wait command" stay as they are.

No change to `workflows/redline-loop.js`: its prompts already send a wait's 5 to `no_result`, and "the run ended without a result" stays accurate.

Proof: `tests/background-test.sh` prints `N passed, 0 failed`; `grep -c "without a gate result" scripts/redline-background.sh` prints at least `1`.

Commit: `redline: R1-3 report a checks.sh exit outside 0, 1 and 2 as no result, so a wait cannot loop on 3 (#40)`

## Task 5: Standards retrospective

Files: `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/testing/tests.md`

Apply only the edits the standards approver approved from `shape.md`, "Standards retrospective (proposed)", in one commit after the finding commits, keeping each file's headings. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when edits are approved): `redline: record the round 1 review lessons in the standards (#40)`

## Task 6: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-1449-41-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Standards retrospective** — Task 5, from the proposed list in `shape.md`, as the standards approver approved it.
11. **Spec folder** — `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md` (the As built notes land in the round's last commit).

## As built

(filled in by the implementer)
