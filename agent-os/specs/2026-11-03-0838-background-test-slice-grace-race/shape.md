# The background test's short-slice wait races the runner's start — Shaping Notes

## Scope

One flaky case in `tests/background-test.sh`, seen once on Ubuntu in PR #65's gate run 41644692808: "a run still going" called `wait slow --slice 1` before the background `start` had written `slow.pid`, and `wait`'s grace window, the slice when the slice is under ten seconds, had run out. The fix is in the test, on the PR #65 branch, in its own commit. Nothing in `scripts/redline-background.sh` changes.

## Decisions

See `plan.md`, "Decisions": the fix in the test, not the script (the role's path has a ten-second grace the test's one-second slice does not); this branch, its own commit, no version bump beyond the PR's `0.1.0` exception; `testing/tests` and `process/standards-retrospective` carried. Each names its owner there.

## Context

- **Evidence:** the failing log line `redline-background: no run under slow; start it first` under "FAIL --slice: still running exits 3, got: 5" in the gate's uploaded `gate.json` for job 125946851934; `grace=$(( slice < 10 ? slice : 10 ))` at `scripts/redline-background.sh:116` and the `no run under` exit at `:148-149`; the back-to-back `bg slow` / `waitfor slow --slice 1` at `tests/background-test.sh:107-108`; the `killed` case's existing poll at `:126`. The PR's diff touches neither file; the case passed in the eleven gate runs before it on both runners.
- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** n/a.

## Standards retrospective

Proposed under `plan.md`, Task 3, presented with AskUserQuestion at the gate on 2026-11-03 and approved as proposed, decided by: @michaelwitwicki. Applied: one bullet in `testing/tests.md` after the `within` bullet, for its own commit. Items reviewed: the three decisions (1 is the new bullet; 2 is gate step Version's own text; 3 cites the standards) and no red run during the build.

## Standards Applied

- testing/tests — the harness bounds its polls with `within`; the fix reuses it, and the retrospective records when a poll before a wait is right
- process/standards-retrospective — the one bullet lands in its own commit or "no changes" is recorded
