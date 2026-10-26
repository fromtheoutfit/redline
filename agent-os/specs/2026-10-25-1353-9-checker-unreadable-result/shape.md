# Checker results that stop the run (#9) — Shaping Notes

## Scope

Issue #9 and its addendum. Two runs ended at stage `check` after a repair pass that could not have helped: on #7 the checker's `checks.sh` output spilled to a file it may not read and came back as a partial object with no `git` block, which `judge()` read as a failing gate; on PR #34 round 2 the checker returned a passing gate (`exit 0`, `ok true`, every check at 0) with `error: "\"\""`, the two-character string, and `judge()` failed the round on any non-empty `error`. The round's commits were not pushed, the R2-1 reply and the handoff were not posted, round 3 never ran.

The change: the loop decides from the gate's own fields; `error` is text; a result the implementer cannot change stops the run at `check`, naming the cause and the fix, with no repair pass. The checker returns a distinct status, `result_unreadable`, with a reason, instead of a partial object.

Shaped by hand with `/agent-os:shape-spec` on 2026-10-25; the person makes the commits.

## Decisions

- **Decide on `ok` and `exit`, not `error`.** `error` is text. On a passing gate (`ok` true, `exit` 0) a non-empty `error` is a warning in the run's `warnings`, never a reason. On a failing gate it is one of the reasons. The strings `""`, `''` and `null`, and a non-string value, count as empty. (From the issue addendum and the launch decisions.)
- **`result_unreadable` is a status the checker returns, with a reason from a fixed set.** `spilled` (the tool saved the output to a file), `not_json` (stdout is not one JSON object), `no_git_block` (the object has no `git` key). What the checker saw goes in `error` as free text. The status and reason are enums because the workflow reads fields, never text (workflow/agents). Status values: `read` and `result_unreadable`; `reason` is `""` with `read`.
- **Every result the implementer cannot change stops the run, not only `result_unreadable`.** Asked 2026-10-25. A missing `result`, `exit 2` (usage error) and a `result` with no `git` block in a full or git-only run stop the same way: today each sends a repair pass that hits the same wall. Only failing checks and git-block findings (unexpected files, uncommitted changes, unprefixed commits, a finding with no commit) send a repair pass. The `--baseline` run is covered too: the #7 incident's first oversized output was a baseline, and a baseline with no result used to pass silently.
- **The message names the cause and the fix.** Spilled: `checks.sh output exceeded the Bash tool's inline limit and was saved to a file the checker may not read; cap it, see emit_checks in scripts/checks-template.sh`. Not JSON, no git block, no result, exit 2: the cause, then `run <the exact checks.sh command line> by hand and read its output`. The checker's `error` text follows as `the checker said: ...`, cut at 400 characters.
- **The run record keeps whatever the checker did get.** The stop's `stageError` carries `{ checker: <the checker's whole return> }` in `extra`, reported under `detail`; the round's `record.check` is set before the throw, so `rounds[].check` shows the stop.
- **Schema.** `CHECKER_SCHEMA` gains `status` (enum `read`, `result_unreadable`) and `reason` (enum `""`, `spilled`, `not_json`, `no_git_block`), both required; `result` becomes `['object', 'null']`.
- **Exit 2 at the checker.** `checks.sh` prints its usage error on stderr and no JSON, so the checker returns `status: read`, `result: null`, `exit: 2`, the stderr under `error`. The loop stops on the null result and the exit code. `result_unreadable` is reserved for output the script did print and the checker could not read.
- **Out of scope:** the guard, `checks.sh`/`checks.json`/the template (the output cap is already in, #7), the gate text in `shape-spec.md` (no restamp), the skill (it already relays `stage`, `error` and `detail`).

## Context

- **Visuals:** None (a workflow and an agent file; the only screen is the run's result JSON).
- **References:** see `references.md`: `judge()`, `checker()` and the check loop; the #33 pattern of an agent `error` recorded as a warning; the checker role; the loop-test mock and section 8; `emit_checks`; the PR #34 round 2 run record.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach" and "nothing an agent does is hidden from the review thread": a run that stops naming the cause and the fix, instead of a repair pass that reads as the implementer's failure. The roadmap has nothing on #9. Confirmed 2026-10-25.

## Standards Applied

- workflow/agents — the workflow reads fields, never text; a degraded result is data; an agent's `error` is not taken on trust in either direction
- testing/tests — a change to the loop adds a check; a bug fix lands red before green; a mock answers as the real agent would
- scripts/bash-conventions — `checks.sh`'s one-JSON-object-on-stdout contract is what the checker relays and what `not_json` means
- process/standards-retrospective — the retrospective at the end of this spec
- prompts/attribution — the agent file and the messages carry no model or vendor name

## Standards retrospective

Approved and applied 2026-10-26, for the person's own commit separate from the code: a bullet in `agent-os/standards/workflow/agents.md` (an agent that could not read what it relays returns a distinct status; the stop on what the implementer cannot change; `error` as text, with `""` empty) and `#9` on its "not taken on trust in either direction" bullet; a bullet in `agent-os/standards/testing/tests.md` (a loop-test scenario scripts the checker's result shape per call). scripts/bash-conventions, process/standards-retrospective and prompts/attribution: no changes.

## Deviations

See "As built" in `plan.md`: the stop lives in `stopReason()`, called by `judge()` and the baseline site, not thrown inside `checker()`, so the round record keeps the stop; exit 2 is checked before a missing result; `record.check` carries `stop`.
