# #40: Run the gate in the background when the recorded baseline won't fit the Bash tool's foreground cap

## Context

Losers League PR #790 stopped at the baseline before any fix. The checker ran `checks.sh --baseline` in the foreground with the Bash tool's 600 s cap; LL's gate takes about 732 s. The tool moved the run to the background and told the checker (verbatim, from the run's transcript): *"it is terminated when you give your final response and no notification can follow that — so do not end your turn to wait for it"*. The checker can't read files, so it returned `result_unreadable`/`spilled`, ended its turn, and the gate was killed (`[killed]` in the task's output file).

Three facts shape the fix:
- A subagent's background task lives only while the agent keeps working, and Claude Code blocks a long foreground `sleep`. "Redirect and poll the file" needs a blocking wait the guard can vet.
- The implementer's rule ("background a gate over ten minutes, read the file when notified") has the same flaw. In `git-only` mode (LL), the implementer's run is the only test run a round gets.
- The stall watchdog restarts an agent only after it has been *silent* for the window (DESIGN.md: "A silent agent is restarted automatically after the stall window"). Repeated wait calls count as activity, so the watchdog bounds each call but not the loop. The script's `--limit` (from `checkerStallMs`) is what bounds the loop.

Outcome: when the recorded baseline is over 480 s or unknown, the workflow gives the checker and the implementer a start/wait pair, so a long gate runs to completion and its JSON and exit code come back exactly as a foreground run would print them. Short gates (this repo 33 s, Chalkboard 18 s) keep today's foreground path, with the same prompt text.

Decisions taken in shaping (all yours): fix both roles; a plugin script owns the run (pid, output and exit files) and the agent runs two commands; its harness becomes gate step 9; a foreground run the tool moved gets a new reason `backgrounded` (`spilled` keeps its output-size meaning), and a background run with no result gets `no_result`.

Spec folder: `agent-os/specs/2026-10-26-1409-40-checker-background-gate/`. No visuals. Commits are yours (CLAUDE.md); I'll suggest the split at the end.

## Task 1: Save spec documentation

`plan.md` (this plan), `shape.md` (scope, the decisions above, the transcript evidence and the three facts, `## Standards Applied`), `standards.md` (full text of the standards below), `references.md`:
- `agents/redline-implementer.md:20`: the existing background rule, which this replaces.
- `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/`: how `result_unreadable` and `stopReason()` came to be.
- Commit `b649acd` (#33): how `gh-test.sh` joined the gate as step 8 (the cascade this spec repeats).
- `redline-internal` STEP14-NOTES.md §6 item 2, cited by name only (internal-notes standard).

Standards: scripts/bash-conventions, scripts/guard, testing/tests, workflow/agents, workflow/replay, process/standards-retrospective, prompts/attribution.

## Task 2: `scripts/redline-background.sh` (new)

Header per bash-conventions (what, usage, environment, output, exit codes); `set -euo pipefail`; `jq` for JSON. Files live under `${TMPDIR:-/tmp}/redline-background/<label>.*`; a label matches `^[A-Za-z0-9][A-Za-z0-9._-]*$`.

- `start <label> [--baseline | --git-only] [<snapshot>]`: launched by the agent with `run_in_background: true`, so the harness keeps it alive while the agent waits and kills it when the agent ends (no leaked 12-minute gate after a stop). It finds the repository with `git rev-parse --show-toplevel` (`pwd -P`) and runs only that repository's `.claude/redline/checks.sh` with the remaining args (an inherited `REDLINE_OCTANE=1` reaches it). Order: remove old `<label>.*`, write `<label>.pid` and `<label>.started` (epoch seconds), write stdout to `.json.part` and stderr to `.err`, rename `.json.part` to `.json`, then write the exit code to `.exit` via a temp file and rename. It prints `{label, exit}` and exits with checks.sh's exit code.
- `wait <label> [--limit <s>] [--slice <s>]`: polls once a second.
  - `.exit` exists: print `.err` to stderr and `.json` to stdout, and exit with the recorded code. 0, 1 and 2 pass through, so the checker reads the result exactly as it reads a foreground run.
  - Still running after the slice (default 240 s, under the tool's 600 s cap and setup's 300000 ms floor for `checkerStallMs`): print one stderr line and exit **3**.
  - Running longer than `--limit` since `.started`: exit **4**.
  - No live pid and no `.exit` (the run died), or no `.pid` within 10 s (it never started): exit **5**.
  - Usage error: exit 2.

## Task 3: Guard: `scripts/redline-guard.sh` + `tests/guard-cases.tsv`

- `script_name()` learns `redline-background.sh` at the plugin's `scripts/` (a copy elsewhere is `bad-path`, and the deny message names the right script). The `checks` group, which the checker and the implementer already have, admits `start` and `wait` only. Update the group's line in the header comment.
- New rows: checker allows `start` (bare and with `REDLINE_OCTANE=1`) and `wait`; implementer allows both; reviewer and github deny both (not in the group); checker denies `/tmp/redline-background.sh start …` (a copy) and an unknown subcommand. Neighbouring rows that must not change: checker still denies `cat` of a file under the temp directory, and a `checks.sh … > /tmp/x` redirect (NONE). Plus one `# @cwd PLUGIN` row: the checker allows `start` in the self-hosted checkout.

## Task 4: Workflow: `workflows/redline-loop.js`

- `args.baselineSeconds` (an integer, or null) and `const FOREGROUND_MAX_S = 480`, with a comment that the Bash tool's foreground cap is 600 s and 480 leaves a fifth for a slow day. `backgroundGate = baselineSeconds === null || baselineSeconds > 480`.
- One helper builds the gate instruction from (flag, snapshot, octane, tag). In the foreground it is today's checker text, byte-identical, plus today's implementer line. In the background it is: the recorded baseline (or "no baseline is recorded"); step 1, `<octane prefix><pluginRoot>/scripts/redline-background.sh start <stamp>-<pr>-<tag> <flag> <snapshot>` with `run_in_background: true`; step 2, `… wait <stamp>-<pr>-<tag> --limit <ceil(checkerStallMs/1000)>` with `timeout: 600000`, repeated while it exits 3, ignoring the start's completion notice; exit 4 or 5 means `no_result`. Tags come from the agent labels (`baseline`, `check-r1`, `recheck-r1`, `implement-r1`, `repair-r1`, `check-h1`): deterministic and free of clock reads, as the replay rule requires.
- `checkerPrompt()` and `implementPrompt()`'s "The gate:" line use it. `checkerCommand()` stays for the "run … by hand" messages.
- `CHECKER_SCHEMA.reason` adds `backgrounded` and `no_result`. `stopReason()` gains two messages:
  - `backgrounded`: `the gate took longer than the Bash tool allows in the foreground; the checker must background it (recorded baseline: <n> s)`, plus the fix: re-record `baseline.seconds` in `.claude/redline/checks.json`; over 480 s the checker backgrounds the gate.
  - `no_result`: `the gate run in the background gave no result`, plus the checker's quoted wait line and the run-by-hand suffix.
  - The `spilled` message is unchanged.
- One `log()` line at the baseline when the gate runs in the background.

## Task 5: Agents

- `agents/redline-checker.md`: "What you receive" lists two shapes, a single command line or a start/wait pair. "What you do" in the foreground: as today, and if the tool says the command was moved to the background, return `result_unreadable`/`backgrounded` quoting the notice. In the background: start once, wait until it exits other than 3, then apply the existing read, exit-2 and unreadable rules to the wait's output; exit 4 or 5 is `no_result` with the wait's line under `error`. Replace "Never run it in the background" with "only as the prompt's start command"; "no other command" becomes "no command the prompt does not give". `disallowedTools` is unchanged (still no Read).
- `agents/redline-implementer.md` step 5: drop the run-in-the-background-and-read-when-notified sentence. When the prompt gives the start/wait pair, run the gate that way every time; never run `checks.sh` itself in the background.

## Task 6: Skill: `skills/redline/SKILL.md` §5

Read `<repoRoot>/.claude/redline/checks.json` with the Read tool and pass `"baselineSeconds": <baseline.seconds>` in `args`, or `null` when the file or field is absent. It joins the example `args` block and its explanation paragraph. Check that `skills/redline-revise/SKILL.md` picks it up through "the same `args` as `/redline:redline`" (no edit expected). A relaunch keeps `args` byte-identical; a run launched before this change has no field, counts as unknown and backgrounds.

## Task 7: Loop test: `tests/loop-test.mjs` (red before green)

`baseArgs` gains `baselineSeconds: 33` (the skill always sends it). New checks:
- 732 s with `checkerStallMs: 1500000`: the baseline and `check r1` prompts carry `redline-background.sh start 2026-10-20-1600-114-baseline --baseline …`, `run_in_background: true`, `wait … --limit 1500`, `recorded baseline: 732 s`. The `implement r1` prompt carries its own pair.
- Boundary: 480 runs in the foreground, 481 in the background (the case asserts the boundary itself). With no field, it backgrounds and says "no baseline is recorded".
- The octane prefix lands on `start`. With 33 s, the foreground checker prompt equals today's text exactly.
- Stops: `backgrounded` gives the issue's sentence with `(recorded baseline: 33 s)`, no repair; `no_result` quotes the wait line and says run by hand, no repair; a baseline `no_result` stops before implement.

## Task 8: `tests/background-test.sh` (new harness, gate step 9)

It runs against a throwaway git repository under its own `TMPDIR`, with a stub `.claude/redline/checks.sh` (progress on stderr, sleep and exit set by environment, JSON echoing its args and `REDLINE_OCTANE`). `set -uo pipefail`; prints `N passed, 0 failed`. Cases:
- exit 0 and exit 1 pass through with the JSON verbatim; exit 2 has empty stdout, the reason on stderr, exit 2.
- Args and `REDLINE_OCTANE=1` reach checks.sh; `start` from a subdirectory finds the toplevel.
- `--slice 1` on a slow stub exits 3, then a second wait returns the JSON; `--limit 1` exits 4.
- A killed runner exits 5; a label never started exits 5.
- A rerun under the same label never returns the earlier `.exit`; a bad label exits 2.
- At least one output is pinned against a literal before any comparison (tests standard).

## Task 9: Gate step 9 cascade (as #33 did for step 8)

- `.claude/commands/agent-os/shape-spec.md`: add step 9 **Background**: `tests/background-test.sh` prints `N passed, 0 failed`, and a change to `scripts/redline-background.sh` adds a case. Renumber the retrospective to 10 and the spec folder to 11. "Steps 1 to 9 are what…", "Only after all eleven pass", the Step 7 template's "nine commands", the Tips' "gate step 10", and in the unattended section "(gate steps 1 to 9", "Steps 10 and 11 stay as written", "Gate step 10's edits".
- `CLAUDE.md`: "runs its nine commands". `agent-os/product/tech-stack.md`: add the harness.
- `.claude/redline/checks.json`: step 9 `{name: background, title: Background, cmd: tests/background-test.sh}`, and the baseline re-measured (seconds, date). Then `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`, then `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh`. `Bash(tests/*.sh:*)` already allows the harness.

## Task 10: README

- Under `checks.sh`, in the "Baseline." paragraph: in `git-only` mode the checker still runs the full `--baseline` once per run (the workflow needs it to tell a pre-existing failure from a new one), so `git-only` saves the per-round check, not the baseline.
- A short "Long gates" paragraph: the threshold, `baselineSeconds` from `checks.json`, the start/wait pair for the checker and implementer, `--limit` from `checkerStallMs` as the bound on the whole wait, and the two new reasons in the exit-code paragraph's list.
- A `redline-background.sh` table (subcommands and exit codes; the header is the reference).
- Rows in the Files table for the script and the harness; the guard paragraph's `checks` group mention.

## Task 11: Verification Gate

1. `.claude/redline/checks.sh --baseline` runs gate steps 1 to 9 until it exits 0; report any failure verbatim.
2. Gate step 10, the standards retrospective, proposed with AskUserQuestion and landed in their own commit. Likely candidates:
   - workflow/agents: a subagent's background task dies at its final response; a long gate is started and waited on in slices under both the tool's cap and the stall window.
   - bash-conventions: a wrapper passes the wrapped script's exit codes through and takes 3 and up for its own.
   - testing/tests: seven harnesses, plus a bullet for the new one.
   - process/standards-retrospective: "Gate step 10".
   - `index.yml`: the testing description.
3. Gate step 11: `plan.md` As built, deviations recorded in `shape.md`.

End to end (the issue's "Done when", which you run): a fresh `/redline:redline` on an LL PR gets past the baseline and through the first implement and check without anyone touching it. The relaunch of #790 with `resumeFromRunId` replays review, post, shape and approve from cache and reruns only the checker. Its `args` lack `baselineSeconds`, which counts as unknown, so the checker backgrounds the gate.

## Noticed, outside #40

`hooks/hooks.json` matches only Bash, Write, Edit, MultiEdit and NotebookEdit. If a subagent can call the Monitor tool, which runs a shell command, that shell runs unvetted for every role (none disallows Monitor). Worth an issue after confirming that subagents get Monitor; this spec doesn't depend on it.

## As built

Built as planned, with these deviations (each also under Decisions in `shape.md`):

- **The foreground checker prompt gained one sentence.** The plan kept it byte-identical, but its "the output was saved to a file" also fits the tool's "moved to the background … Output is being written to" notice, and Haiku took that for `spilled` on LL #790. The prompt now says: `If the tool moves the command to the background instead, return status result_unreadable with reason backgrounded and its notice under error.` before the existing sentence, which now reads `…no complete JSON otherwise…`. The loop test pins the whole foreground text.
- **A `--git-only` check stays in the foreground** even when the gate is long: it runs no command, only the git block. The baseline and the implementer's full gate still background. The loop test pins both.
- **The implementer on wait exit 4 or 5** reports the gate under `blocked` with the wait's line, rather than restarting it: a hang would only repeat.
- **The checker returns `exit: -1`** with `backgrounded`, or when `start` is refused (there is no exit code yet), and the wait's own code (4 or 5) with `no_result`.
- **The harness bounds its own polling** (`within <seconds> <test>`): the first red run, with the script missing, hung on an `until` loop waiting for a pid file.
- **The baseline is re-measured:** 78 s on 2026-10-26 (33 s on 2026-10-22, before the guard table grew to 389 rows), with about 11 s of it the new harness's waits. `checks.json`'s `baseline` is updated and `checks.sh` regenerated; the stamp was kept (`steps 1-9`).
- **The `process/standards-retrospective` renumber** (gate step 9 to 10) goes with the standards commit, not the code: it is a standards file.

Files: `scripts/redline-background.sh` and `tests/background-test.sh` (new); `scripts/redline-guard.sh`, `tests/guard-cases.tsv`; `workflows/redline-loop.js`, `tests/loop-test.mjs`; `agents/redline-checker.md`, `agents/redline-implementer.md`; `skills/redline/SKILL.md`; `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`; `CLAUDE.md`, `README.md`, `agent-os/product/tech-stack.md`.

Gate: `.claude/redline/checks.sh --baseline` exits 0, every check at 0 (guard 389 passed, 0 mismatched; loop 253; prefs 44; gate 117; setup 240; gh 76; background 35).
