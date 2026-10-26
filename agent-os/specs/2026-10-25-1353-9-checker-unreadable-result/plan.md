# Spec: checker results the implementer cannot repair stop the run (#9)

Spec folder: `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/`

Shaped by hand with `/agent-os:shape-spec` on 2026-10-25. The person makes the commits.

## Context

Two runs ended at stage `check` after a repair pass that could not have helped:

1. **#7, first full run.** `checks.sh`'s output (54 KB, the guard table) went over the Bash tool's inline limit. The harness spilled it to a file the checker's guard does not let it read, so the checker returned a partial object with no `git` block. `judge()` read that as a failing gate ("the checker result has no git block"), sent the round to a repair pass, the recheck hit the same wall, and the run ended in error. `emit_checks` now caps the output, but the workflow's handling is unchanged.
2. **#34, round 2 (the addendum).** The checker returned `exit: 0`, `ok: true`, every check at exit 0, and `error: "\"\""` (the two-character string `""`). `judge()` at `workflows/redline-loop.js:933` pushes a reason for any non-empty `error`, so the round failed with `checker error: ""`, the repair pass changed nothing, the recheck returned the same, and the run stopped: no push, no R2-1 reply, no handoff, no round 3.

Both are the workflow trusting the shape of the checker's answer less than its contents. The fix: decide from the gate's own fields (`ok`, `exit`, the checks, the git block); treat `error` as text; and stop the run at once, naming the cause and the fix, on any result the implementer cannot change.

## Decisions (go into shape.md)

- **Decide on `ok` and `exit`, not `error`.** `error` is text. On a passing gate (`ok` true, `exit` 0) a non-empty `error` is a warning in the run's `warnings`, never a reason. On a failing gate it is one of the reasons. The strings `""`, `''` and `null` (and a non-string value) count as empty. (From the issue addendum and the launch decisions.)
- **`result_unreadable` is a status the checker returns**, with a `reason` from a fixed set: `spilled` (the tool saved the output to a file), `not_json` (stdout is not one JSON object), `no_git_block` (the object has no `git` key). The free text of what the checker saw goes in `error`. The status is an enum because the workflow reads fields, never text (workflow/agents). Status values: `read` and `result_unreadable`; `reason` is `""` with `read`.
- **A result the implementer cannot change stops the run at stage `check` with no repair pass.** Asked 2026-10-25: stop on all of them, not only `result_unreadable`. That is `result_unreadable` (any reason), a missing `result`, `exit 2` (usage error) and a `result` with no `git` block in a full or git-only run. Only failing checks and git-block findings (unexpected files, uncommitted changes, unprefixed commits, a finding with no commit) send a repair pass. The stop applies to the `--baseline` run too: the #7 incident's first oversized output was a baseline.
- **The message names the cause and the fix**, per reason: spilled: `checks.sh output exceeded the Bash tool's inline limit and was saved to a file the checker may not read; cap it, see emit_checks in scripts/checks-template.sh`; not JSON / no git block / no result / exit 2: the cause plus `run <the exact checks.sh command line> by hand and read its output`. The checker's `error` text follows, cut at 400 characters.
- **The run record keeps whatever the checker did get.** The stop's `stageError` carries `{ checker: <the checker's whole return> }` in `extra`, which the result reports under `detail`; the round's `record.check` is set before the throw so `rounds[].check` shows the stop too.
- **Schema.** `CHECKER_SCHEMA` gains `status` (enum `read`, `result_unreadable`) and `reason` (enum `""`, `spilled`, `not_json`, `no_git_block`), both required; `result` becomes `['object', 'null']`.
- **Exit 2 at the checker.** `checks.sh` prints its usage error on stderr and no JSON: the checker returns `status: read`, `result: null`, `exit: 2`, the stderr under `error`. The loop stops on the null result and the exit code; `result_unreadable` is reserved for output the script did print and the checker could not read.
- Out of scope: the guard (`scripts/redline-guard.sh`), `checks.sh`/`checks.json`/the template (the cap is already in), the gate text in `shape-spec.md` (no restamp), the skill (it already relays `stage`, `error`, `detail`; `skills/redline/SKILL.md:215`).

## Tasks

### Task 1: Save spec documentation

`agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/`: `plan.md` (this plan), `shape.md` (scope; the Decisions above; Context: visuals none, references below, product alignment: `mission.md` "Honest about its reach" and "nothing an agent does is hidden from the review thread", confirmed 2026-10-25; roadmap has nothing on #9), `standards.md` (full text of workflow/agents, testing/tests, scripts/bash-conventions, process/standards-retrospective, prompts/attribution; confirmed 2026-10-25), `references.md` (below). No `visuals/`.

### Task 2: loop-test cases, red first (`tests/loop-test.mjs`)

The testing standard lands a bug fix red before green, so the cases come first and are seen to fail against today's loop. Add to the checker mock a scenario hook `scenario.checker(label, defaultResult)` that returns an override for a given call label (`baseline`, `check r1`, `recheck r1`, ...) or nothing, so every existing scenario keeps the default result. Every default result gains `status: 'read', reason: ''`. New section 9, "Checker results (#9)":

- **ok true, error `'""'`** on every full check: `status === 'done'`, no label starting `repair`, `push and reply r1` ran, and no warning mentions the checker (the string counts as empty). Neighbour: the same with `error: 'note from the checker'` passes with a warning `round 1: the checker reported "note from the checker" on a passing gate` and still no repair.
- **ok false, exit 1, error `'guard: 2 mismatched'`**, checks all exit 0, on `check r1` and `recheck r1`: `repair r1` runs once, then `status === 'error'`, `stage === 'check'`, `error` includes `checker error: guard: 2 mismatched` and `after one repair pass`. Neighbour (the repair path's only test today): a failing check (`exit 1`, `ok false`, `error ''`) on `check r1` and the default on `recheck r1`: `repair r1` runs, the repair prompt carries `This is a repair pass` and the check's name, and the run reaches `done`.
- **result_unreadable, reason spilled** on `check r1`: `status === 'error'`, `stage === 'check'`, no `repair r1`, `error` includes `exceeded the Bash tool's inline limit` and `emit_checks in scripts/checks-template.sh`, `detail.checker.status === 'result_unreadable'`, `rounds[0].check.pass === false`. Same for `reason: not_json` and `no_git_block` with `result: null` / a partial object: the message names the cause and `run ` + the checks.sh command line + ` by hand`.
- **baseline unreadable** (`spilled` on label `baseline`): stops at `check` before any `implement r1`.
- **judge-detected stops**: `status: read` with `result: null, exit: 2, error: 'checks.sh: no snapshot'` stops with `exited 2 (usage error)` and the text, no repair; `status: read` with a result whose `git` key is missing stops with `no git block`, no repair.
- Every existing check still passes (the default result is unchanged in shape apart from the two new fields).

Run `node tests/loop-test.mjs` and record the failing cases in `plan.md` As built before Task 3.

### Task 3: the loop (`workflows/redline-loop.js`)

- `CHECKER_SCHEMA` (line 373): `required: ['exit', 'status', 'reason', 'result', 'error']`; `status: { type: 'string', enum: ['read', 'result_unreadable'] }`; `reason: { type: 'string', enum: ['', 'spilled', 'not_json', 'no_git_block'] }`; `result: { type: ['object', 'null'], ... }`.
- New `errorText(out)`: the trimmed `error` when it is a string, `''` otherwise; `''` when the trimmed text is `""`, `''` or `null`.
- New `unreadableMessage(out, command)`: by `reason`, the sentences in Decisions, then `; the checker said: <errorText cut at 400>` when non-empty.
- `checker(flag, snapshot, octane, label)` (line 1217): after `run`, when `out.status === 'result_unreadable'` throw `stageError('check', `${label}: the checker could not read checks.sh's result: ${unreadableMessage(out, checkerCommand(flag, snapshot, octane))}`, { checker: out })`. Covers the baseline.
- `judge(out, baselineFailing, needCommits)` (line 928) returns `{ pass, stop, reasons, warnings, preExisting, diffLines }`:
  - `stop` (a string, else `null`), checked first and returned alone: no `result` → `the checker returned no result`; `exit === 2` → `checks.sh exited 2 (usage error)`; no `git` block → `the checker result has no git block`. Each followed by `: <errorText>` when non-empty.
  - `reasons` as today for failing checks and the git block, minus the `checker error:` and exit-2 pushes; then, when `result.ok !== true || out.exit !== 0` and `errorText` is non-empty, `checker error: <text cut at 400>`.
  - `warnings`: when `result.ok === true && out.exit === 0` and `errorText` is non-empty, `the checker reported "<text cut at 200>" on a passing gate`.
  - the `exit !== 0 && reasons.length === 0 && preExisting.length === 0` fallback stays.
- The round loop (lines 1394 to 1417): after `judge`, when `verdict.stop`, set `record.check = { pass: false, stop: verdict.stop, reasons: [], preExisting: [], diffLines: null }` and throw `stageError('check', `round ${round} ${label}: ${verdict.stop}; run ${command} by hand and read its output`, { checker: checked })`, where `command` is the same `checkerCommand(...)` the call used (compute it once above the call and pass it to `checker`, or have `checker` return it). Push each `verdict.warnings` entry as `round ${round}: ${w}` whether or not the round passed. Everything else unchanged: `ctx.repair` keeps `verdict.reasons` and `failingExcerpt`.
- `checkerPrompt` (line 819): one added sentence: `If the tool shows you no complete JSON (the output was saved to a file, is not one JSON object, or has no git key), return status result_unreadable with the reason, as your instructions say.`
- Comment at line 920 ("The checker's verdict. The script decides, never an agent."): add that a result the implementer cannot change stops the run.

### Task 4: the checker agent (`agents/redline-checker.md`)

- Step 3 replaced by the status rule: `status: read` when the tool showed the script's whole stdout as one JSON object with a `git` key (`null` in `--baseline` is a key); `status: result_unreadable` otherwise, with `reason`: `spilled` when the tool result says the output was too large and was saved to a file (never read that file; the guard refuses it; quote the tool's notice under `error`), `not_json` when stdout is not one JSON object (the first 400 characters under `error`), `no_git_block` when the object has no `git` key (`result` is the partial object). Exit 2: `status: read`, `result: null`, the stderr under `error`. Never retry, never run anything else.
- The returned JSON example gains `"status": "read", "reason": ""`.
- The intro keeps "You do not judge the result; the workflow does": reading whether a JSON object is whole is relaying, not judging.

### Task 5: README

- Files table, `workflows/redline-loop.js` row (line 119): add "and the stop on a checker result the implementer cannot change".
- `checks.sh` section, the **Exit code** paragraph (line 226): after "The workflow reads `ok` and the git block", add: the checker's `error` is text, a warning on a passing gate and part of the reason on a failing one (`""` counts as empty); a result the checker could not read (`result_unreadable`: output saved to a file, not JSON, no `git` key), a missing result, exit 2 or a result with no `git` block stops the run at `check` naming the cause and the fix, with no repair pass; the implementer repairs only failing checks and git-block findings.
- Known limits: no new line (this is a fix, not a limit).

### Task 6: Verification Gate

Run `.claude/redline/checks.sh --baseline` (steps 1 to 8; the loop test is step 4) until it exits 0; report failing output verbatim. No guard, gate text, `checks.json` or template change, so no `guard-cases.tsv` row, no regenerate, no restamp. Then the standards retrospective (step 9), applied in its own commit, the person titles it:

- `agent-os/standards/workflow/agents.md`: after the "A degraded result is data, not an error" bullet, add: "An agent that could not read what it was asked to relay returns a distinct status (`result_unreadable`, with a reason from a fixed set) and whatever it did get, never a partial object that looks like a failing result. The workflow stops on that status, and on any result the implementer cannot change (no result, exit 2, no git block), naming the cause and the fix; it sends to repair only failing checks and git-block findings. The checker's `error` is text: a warning on a passing gate, part of the reason on a failing one, and `""`, `''` and `null` as its text are empty (#9; #34 round 2)". Extend the "does not take an agent's `error` on trust in either direction" bullet's parenthetical with `#9`.
- `agent-os/standards/testing/tests.md`: after the "A loop-test mock answers as the real agent would" bullet, add: "A loop-test scenario scripts the checker's result shape per call (a passing gate with a stray `error`, a failing gate, an unreadable result, a baseline that cannot be read), as it scripts the reviewer's findings, so the stop and the repair paths are both asserted (#9)".
- scripts/bash-conventions, process/standards-retrospective, prompts/attribution: expected "no changes" (confirm at the gate).

Then step 10: `plan.md` As built (the red run's failing case names, any deviation) and Decisions deviations in `shape.md`.

## References (go into references.md)

- `workflows/redline-loop.js:928-976` `judge()`, `:1217-1221` `checker()`, `:1394-1417` the implement/check/repair loop, `:373-408` `CHECKER_SCHEMA`, `:157-167` `stageError`/`run`, `:1756-1759` the top-level catch (`detail` from `extra`), `:1121-1136` the #33 pattern of an agent `error` recorded as a warning when the result checks out.
- `agents/redline-checker.md`: the role; step 3 is what changes.
- `tests/loop-test.mjs:112-118` the checker mock, `:380-440` section 8 as the pattern for a scenario-keyed override (`postError`, `postReviewId`, `postDrop`) and for asserting status, stage, error text, warnings and labels.
- `scripts/checks-template.sh:85-160` `emit_checks` and the 16 KB budget, the fix the spilled message names.
- Run records: `agent-os/specs/2026-10-24-1831-34-review-round-2/redline/` (the `""` round), issue #9 and its addendum.

## Verification

1. `node tests/loop-test.mjs` before Task 3: the new section 9 cases fail (record which); after Task 3 and 4: `N checks passed, 0 failed` with N up by the new cases.
2. `.claude/redline/checks.sh --baseline` exits 0 and prints one JSON object with every check at exit 0.
3. `claude plugin validate .` still passes with the edited agent file.
4. Read-through: `grep -n '"status"\|result_unreadable' agents/redline-checker.md workflows/redline-loop.js README.md` names the status in all three.

## As built

Built 2026-10-25. Gate: `.claude/redline/checks.sh --baseline` green, `ok: true`, all eight checks at exit 0; `node tests/loop-test.mjs` prints `160 checks passed, 0 failed` (150 before this spec; the stopped runs do not add the run-record-commit check that a finished run does, so the count is up by ten for sixteen new checks).

**Red first.** With section 9 in place and the loop unchanged: `155 checks passed, 11 failed`. The failing cases: `'""' is empty; the round passes with no repair and no warning` (the run ended in error after `repair r1` with `checker error: ""`), `text on a passing gate is a warning, not a reason`, `stops at check with the cause and the fix, no repair`, `the record keeps what the checker returned`, `not JSON names the cause and the command to run by hand`, `a partial object is kept in the record`, `a baseline the checker cannot read stops before implement`, `a usage error stops with the script's message, no repair`, `a missing result stops, no repair`, `a result with no git block stops, no repair`, `a baseline with no result stops instead of passing silently` (the run reached `done`, which confirms the silent pass). The two neighbours passed before the fix as they should: `a failing check sends one repair pass and the recheck passes` and `the command line is the prompt's last line`.

**Deviations from the shaped plan:**

- The stop is decided by one function, `stopReason(out, command, needGit)`, that `judge()` calls first and the baseline site calls directly, instead of a throw inside `checker()`. Reason: the round loop owns `record`, so the throw from there can set `record.check` before it leaves, as the plan asked; a throw inside `checker()` could not. `checker()` is unchanged.
- `exit 2` is checked before a missing `result`. The decided shape for a usage error is `result: null` with `exit: 2`, and the no-result check fired first on it, so the message said "returned no result" instead of "exited 2 (usage error)". Found by the red run's one remaining failure after the fix.
- The "run by hand" sentence is part of every stop message except `spilled`, whose fix is the output cap; the plan said per reason, and this is that.
- The test section's failure dumps are trimmed to status, stage and error (`brief(run)`) after the red run printed the whole result object per failure.
- `record.check` gains `stop` (`null` on a normal verdict, the stop text on a stop) so a reader of `rounds[].check` sees why a round ended at check.

**Not changed:** `scripts/redline-guard.sh`, `tests/guard-cases.tsv`, `.claude/redline/checks.sh`, `checks.json`, `scripts/checks-template.sh`, the gate text in `shape-spec.md` (no restamp), `skills/redline/SKILL.md`.
