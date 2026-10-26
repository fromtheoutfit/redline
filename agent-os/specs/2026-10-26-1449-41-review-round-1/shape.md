# PR #41 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #41 (issue #40: run a long gate in the background for the checker and the implementer). Three findings, all on files the PR adds or changes, and nothing else:

- **R1-1** (nit): `agent-os/product/tech-stack.md` line 16 lost the separator between the setup script and the GitHub wrapper in the harness list.
- **R1-2** (correctness, low): `scripts/redline-background.sh wait` can return an earlier run's result when it checks before `start` has removed the label's old files.
- **R1-3** (correctness, low): a `checks.sh` exit code other than 0, 1 or 2 is passed through by `wait`, where 3, 4 and 5 read as `wait`'s own answers and a 3 loops the role.

## Unattended answers

- **Scope.** The three findings in the invoking prompt. Evidence: the prompt's findings JSON; `agent-os/specs/2026-10-26-1449-41-review-round-1/redline/round-1-findings.json`.
- **Visuals.** None; the change is a Bash script, its harness and prose.
- **References.** `scripts/redline-background.sh` (whole file), `tests/background-test.sh` (whole file), `scripts/checks-template.sh` lines 1-80, `workflows/redline-loop.js` lines 80-91, 970-1060 and 1690-1745, `agents/redline-checker.md` lines 20-45, `agents/redline-implementer.md` line 20, `README.md` lines 130-140, 154-160, 232-236 and 262-270, `tests/guard-cases.tsv` lines 354-369, and the original spec `agent-os/specs/2026-10-26-1409-40-checker-background-gate/shape.md`. See `references.md`.
- **Product context.** `agent-os/product/tech-stack.md` (the file R1-1 names), lines 10-18. Nothing else in the product folder bears on these findings.
- **Standards.** `scripts/bash-conventions` (the wrapper bullet this PR added), `testing/tests` (the background harness bullet, red before green, bounded polls), `process/standards-retrospective`. `workflow/agents` was read: no prompt changes in this round, so it is not applied.
- **Already known?** `scripts/redline-gh.sh issues-search "redline-background"` and `issues-search "tech-stack"` return no issue covering either (the only hit, #17, is CI). This is round 1, so no earlier review-round folder of PR #41 exists.
- **R1-2: is a rerun under a reused label meant to return only its own result?** Yes. The original spec answers it, `agent-os/specs/2026-10-26-1409-40-checker-background-gate/shape.md`, Decisions, "Tags, not clocks": "`start` removes the label's old files first, so a rerun under the same label never returns an earlier result." The script's header (lines 14-16) says the same of `start`. The code holds that only when `start`'s `rm -f` (line 77, after `git rev-parse` at line 67 and `mkdir -p` at line 76) runs before the next `wait` reaches line 113, and nothing orders the two: `start` is launched with `run_in_background` and returns at once. The harness hides the ordering by waiting for the old `.exit` to vanish (`tests/background-test.sh` line 131) before it calls `wait`. The code disagrees with the stated behaviour, so the disagreement is the finding to fix.
- **R1-2: are the labels reused in practice?** Yes. `workflows/redline-loop.js` line 981 builds the run id from the launch stamp, the PR and the agent label, and the labels are `implement <tag>`, `repair <tag>`, `check <tag>`, `recheck <tag>` and `baseline` (lines 1700, 1729, 1736). The implementer runs every gate of its pass under one id ("run it in two steps every time", line 997), so its second gate run follows a finished first run under the same label. A relaunch keeps the stamp and so the ids, and a checker the stall watchdog restarts runs `start` again under its own id.
- **R1-2: does anything else read the kept files?** No. `tests/guard-cases.tsv` line 367 denies the checker `cat` of a kept file; `grep -rln redline-background` over the repository finds the files read only by the script itself. Removing them once a wait has returned them breaks no reader.
- **R1-3: which exit codes does `checks.sh` have?** 0, 1 and 2. `scripts/checks-template.sh` lines 28-30: "Exit 0 when every non-recorded check passed and git.unexpected_files and git.uncommitted are both empty, else 1. Usage errors exit 2." The wrapper's header (lines 34-41) and `agent-os/standards/scripts/bash-conventions.md` ("takes the codes above them for its own answers (3 still running, 4 past the limit, 5 no result)") reserve 3, 4 and 5 for `wait`. But the template runs under `set -euo pipefail` (line 42) with no exit-code mapping, so a command failing outside `run_check` (jq: 3 on a compile error, 5 on a runtime error) or a signal (128+n) ends `checks.sh` with another code, and `wait` passes it through at line 117. The code disagrees with the documented split between the two scripts' codes, so that is the finding to fix, in the wrapper.
- **R1-3: does a recorded 3 really loop?** Yes, by reading. The `.exit` branch (line 113) runs before the limit check (line 131), so every wait returns 3 at once. The checker's instructions (`agents/redline-checker.md` step 3) and the workflow's prompts (`workflows/redline-loop.js` lines 997 and 1050) say to run the same wait again while it exits 3, and each call is activity for the stall watchdog.
- **R1-3: do the prompts or the workflow change?** No. With the fix a code outside 0, 1 and 2 becomes `wait`'s exit 5, which the checker's step 4 and both prompts already route to `no_result` ("the run ended without a result"), and that text stays accurate. Only the descriptions that say `wait` "exits with its exit code" are reworded (bash-conventions: a change to what a subcommand prints rewords every description of it).
- **R1-1: is the missing separator real?** Yes. `git diff main...HEAD -- agent-os/product/tech-stack.md` shows the PR replaced "`tests/setup-fixtures/`) and the GitHub wrapper" with "`tests/setup-fixtures/`) the GitHub wrapper".

## Decisions

- **R1-1: fix.** Add a comma after the setup script's parenthesis in `agent-os/product/tech-stack.md` line 16: "... over `tests/setup-fixtures/`), the GitHub wrapper (...) and the background runner (...)". One character, in a file the PR already changes.
  Decided by: redline

- **R1-2: fix, by reading a result once.** After `wait` prints a finished run's stderr and stdout, it removes the label's files (`.json`, `.json.part`, `.err`, `.exit`, `.exit.part`, `.pid`, `.started`) and then exits. A later wait under the label finds no `.pid` and waits out the existing grace for the next `start` to write one, so it can only return the new run's result. The header and the README say so. The harness drops the `within` that hid the ordering (line 131), sends `bg again` and `waitfor again` back to back, and replaces "stdout equals the kept file" (line 65) with a case that the label's files are gone after a returned result, which is red against today's script.
  - Likelihood and visibility: not observed. It needs the wait's first check to run before the background start reaches its `rm -f`; the guard hook on the wait call usually gives the start time to finish. Reachable without any person: the implementer's second gate run in a pass, a relaunch, a restarted checker. When it fires, the checker can hand a stale pass or fail (with a stale git block) to the verdict, and the implementer can stop on a stale green.
  - Cost: about 5 lines in `scripts/redline-background.sh`, 3 or 4 cases changed or added in `tests/background-test.sh`, two README sentences. All three files are already in the PR's diff. No new dependency, service or abstraction. Proportionate.
  - What it leaves: a run stopped before any wait read it (its role ended mid-gate) leaves a dead `.pid` and no `.exit`. A wait sent under that label before the next start clears it exits 5, `no_result`, which stops the run with a visible message rather than returning a stale result. The script's header names this.
  Decided by: redline

- **R1-3: fix, by mapping any other code to 5.** In `wait`'s `.exit` branch, 0, 1 and 2 pass through unchanged. Any other recorded code prints `checks.sh`'s stderr and stdout as now, then `redline-background: checks.sh exited <n> without a gate result` on stderr, and exits 5 (after the read-once removal of R1-2). The stub `checks.sh` in the harness already exits with `STUB_EXIT`; a case with `STUB_EXIT=3` asserts exit 5 and the line, red against today's script, and the exit-2 case stays as the neighbour that must not change. The header's exit-code list, the README's table row and its "Long gates" and `no_result` sentences, and the checker's one-line description of `wait` are reworded.
  - Likelihood and visibility: not observed; needs `checks.sh` to leave its 0/1/2 contract (a jq error outside `run_check`, an OOM or other signal). When it fires with 3, the role loops on instant waits that neither the stall watchdog nor `--limit` ends; with 4 or 5 the cause is misreported; with 6 or more the roles have no instruction.
  - Cost: about 6 lines in `scripts/redline-background.sh`, one case and a stub comment in `tests/background-test.sh`, three README phrases, one phrase in `agents/redline-checker.md`. All in the PR's diff. No workflow or prompt change, so no loop-test change. Proportionate.
  Decided by: redline

- **Order.** Tasks run in finding order. R1-3's change sits in the branch R1-2 edits, so R1-3 builds on R1-2's version of it and reuses its removal.
  Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/tech-stack.md` lists the background runner's harness (R1-1). Noticed while reading, outside this round's findings and not acted on: line 12 of the same file still says the gate "runs the eight steps"; the gate has nine since this PR.

## Standards Applied

- scripts/bash-conventions — the wrapper bullet (#40): output and documented exit codes passed through, the codes above them the wrapper's own, stated in the header; the header is the documentation and the README quotes it; a change to what a subcommand prints rewords every description of it
- testing/tests — `tests/background-test.sh`; a change to a tested surface adds a case in the same commit beside a neighbouring one; a bug fix lands red before green; a harness bounds its polls
- process/standards-retrospective — gate step 10 for this round

## Standards retrospective (proposed)

1. `agent-os/standards/scripts/bash-conventions.md`, line 9 (the wrapper bullet, #40). Replace "passes the wrapped script's stdout, stderr and exit codes through unchanged, so the role reads the result as it would the script's own, and takes the codes above them for its own answers (3 still running, 4 past the limit, 5 no result), stated in its header." with: "passes the wrapped script's stdout and stderr through unchanged, and its documented exit codes (0, 1 and 2 for `checks.sh`), so the role reads the result as it would the script's own, and takes the codes above them for its own answers (3 still running, 4 past the limit, 5 no result), stated in its header. Any other code the wrapped script exits with (a command failing under its `set -e`, a signal) is the wrapper's no-result answer with a line naming the code, never passed through: a passed-through 3 reads as still running and loops the role (#41, R1-3). A result the wrapper keeps under a label the workflow reuses is read once: the wait that returns it removes the label's files, so a wait that runs before the next start has cleared them cannot return the earlier run's result (#41, R1-2)." The rest of the bullet ("It runs one fixed script, ...") stays.
2. `agent-os/standards/testing/tests.md`, line 13 (the `tests/background-test.sh` bullet). After "a rerun under the same label" add "with its wait sent at once, a result read once (#41, R1-2), a gate exit outside 0, 1 and 2 reported as no result (#41, R1-3)", so the bullet reads "... a run that died or never started, a rerun under the same label with its wait sent at once, a result read once (#41, R1-2), a gate exit outside 0, 1 and 2 reported as no result (#41, R1-3); `REDLINE_BACKGROUND_POLL` shortens the waits (#40)".
3. `agent-os/standards/testing/tests.md`, the polling bullet (line 14): already covers the harness's bounded `within`; the lesson that a harness's wait for a precondition can hide the very ordering a race needs is new. Add after "(#40)": " A harness never waits for a precondition the role cannot wait for: `background-test.sh` waited for the old result to vanish before calling `wait`, which hid the race the role's back-to-back calls hit (#41, R1-2)".
4. `workflow/agents`, `process/standards-retrospective`: no changes.

Standards retrospective: the edits above are proposed for the standards approver; none is held for a decision.
