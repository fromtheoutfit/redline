# Spec: the background test's short-slice wait races the runner's start (CI flake on PR #65)

Spec folder: `agent-os/specs/2026-11-03-0838-background-test-slice-grace-race/`

Shaped by hand on 2026-11-03 with `/agent-os:shape-spec`, on the PR #65 branch; the person makes the commit. Scope: the one flaky case, nothing else.

## Context

Gate run 41644692808 on PR #65 failed on Ubuntu in `tests/background-test.sh`, "a run still going": `wait slow --slice 1` exited 5 (`no run under slow; start it first`) instead of 3. macOS passed, every other check passed, and the case had passed in all eleven earlier gate runs on both runners. The PR touches neither `scripts/redline-background.sh` nor the test.

Mechanism: the test starts the stub gate in the background (`bg slow`, `tests/background-test.sh:107`) and calls `wait` on the next line. `wait` gives a run a grace window to appear before saying none was started, `grace=$(( slice < 10 ? slice : 10 ))` (`scripts/redline-background.sh:116`), so `--slice 1` makes the window one second. On the loaded runner, `start` (a subshell, `cd`, `exec`, `git rev-parse`, `mkdir`, two writes) had not written `slow.pid` within that second. The role's path is unaffected: the checker and the implementer call `wait` with the default slice of 240, so their grace is ten seconds. The `long` case (`:116`, `--slice 5`) has the same shape with a five-second window. The `killed` case already polls for the pid file before acting (`within 5 -f "$FILES/killed.pid"`, `:126`), which is the pattern.

Not a script change: flooring the grace independently of the slice would alter the role's contract to fix a test's choice of slice. The tests standard's caution against waiting for a precondition the role cannot wait for (#41, R1-2) concerned a wait that hid a race on the role's own path; here the role's path has a ten-second grace the test's one-second slice does not, so the poll restores the role's conditions rather than hiding anything.

## Decisions

1. **Fix in the test, not the script**: poll for the pid file after `bg` in the two short-slice cases, with `within`, before the `wait`; the script's grace rule stands. Decided by: @michaelwitwicki (the recommendation accepted with "Fix the flake in this branch").
2. **This branch, its own commit**: the fix rides on PR #65 so its CI goes green; no version bump beyond the PR's `0.1.0` exception (gate step Version). Decided by: @michaelwitwicki.
3. **Standards carried**: `testing/tests` (the harness rule; the retrospective adds the grace line), `process/standards-retrospective`. No Docs entry: `tests/` is outside the Docs step's directories. Visuals: none. Product alignment: n/a. Decided by: redline.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-11-03-0838-background-test-slice-grace-race/` with `plan.md` (this plan, As built filled at the gate), `shape.md` (Scope, the Decisions above, the Context above as evidence, `## Standards retrospective (proposed)`), `standards.md` (the full text of the two standards), `references.md` (the `killed` case's poll, the script's grace line). No `visuals/`.

## Task 2: Poll for the runner's pid file before a short-slice wait

**File:** `tests/background-test.sh`.

1. After `STUB_SLEEP=3 bg slow` (`:107`): `within 5 -f "$FILES/slow.pid" || bad "the slow runner writes its pid file" "no $FILES/slow.pid after 5 s"`, with a comment: the slice sets the grace (`grace = min(slice, 10)` in the script), so a one-second slice gives the runner one second to write its pid file, which a loaded CI runner missed on PR #65; the role's default slice gives ten. The poll puts the test under the role's conditions; the `neverstarted` case still proves exit 5 when nothing was started.
2. The same line for `long` after `STUB_SLEEP=6 bg long` (`:116`), `--slice 5` being the same shape.
3. Header comment (`:10-11`): one clause, "the short-slice cases wait for the runner's pid file first".
4. Prove it: `tests/background-test.sh` green locally; a red run is not reproducible on demand (the race is load-dependent), so the proof of the fix is the mechanism plus CI green on both runners after the push. Note that in As built.

## Task 3: Verification Gate

Run `.claude/redline/checks.sh --baseline` until it exits 0, then `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .`; the Docs step: no entry, `tests/` is outside its directories; the Version step: no bump, PR #65's `0.1.0` exception; the standards retrospective (AskUserQuestion: apply, adjust or none); As built in `plan.md`.

### Standards retrospective (proposed)

- `agent-os/standards/testing/tests.md`, after the `within` bullet (`:15`): "A harness case that shortens a script's window to run fast (`wait --slice 1`, whose grace for the run to appear is the slice, one second) first polls for the file the script under test writes (`within 5 -f "$FILES/slow.pid"`), so the case runs under the role's conditions, whose default slice gives ten seconds; without it a loaded CI runner failed the case once on PR #65 (#16). This is not the wait #41, R1-2 removed: that one hid a race on the role's own path."

## Verification

- `tests/background-test.sh` prints `N passed, 0 failed` locally (N unchanged plus two `within` lines that print nothing on success).
- `.claude/redline/checks.sh --baseline` exit 0.
- After the push, PR #65's gate green on Ubuntu and macOS.

## As built

Built on 2026-11-03 from this plan as written; the person makes the commits. No deviation. `tests/background-test.sh`: 39 passed locally, the two `within` lines silent on success; a red run is not reproducible on demand, since the race is load-dependent, so the proof is the mechanism and CI green on both runners after the push. `.claude/redline/checks.sh --baseline` exit 0; `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .` exit 0. Docs step: no entry, `tests/` is outside its directories. Version step: no bump, PR #65's `0.1.0` exception. Retrospective: approved as proposed and applied to `testing/tests.md` for its own commit.
