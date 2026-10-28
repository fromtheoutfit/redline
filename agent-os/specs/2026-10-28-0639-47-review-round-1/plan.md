# PR #47 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 found two correctness bugs, both in the advisory `shellcheck` job that #17 adds.

- **R1-1** is a fix (Task 2): the step runs under pipefail, so a finding or a missing shellcheck fails it.
- **R1-2** went back to the person as a judgment call. They decided option (2), Flag in the workflow, rc line removed (Task 3). shellcheck 0.11.0 was verified to ignore `severity=` in `.shellcheckrc` and to honour `-S warning`.
- Nothing is deferred.

Every commit message starts `redline: ` and references (#17), the issue the PR closes.

Every file named below is under `/Users/michaelwitwicki/Code/Claude/redline/`. No harness reads `.github/workflows/gate.yml`, so the gate cannot prove a change to it. Each task's proof is the step's shell semantics run with `bash -c`, plus a `grep` that places the change in the file. The behavioural proof is the CI run on the round's push, which the person reads afterwards (see After the run).

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-28-0639-47-review-round-1/plan.md`
- `agent-os/specs/2026-10-28-0639-47-review-round-1/shape.md`
- `agent-os/specs/2026-10-28-0639-47-review-round-1/standards.md`
- `agent-os/specs/2026-10-28-0639-47-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never in the same commit as a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #47 (#17)`

## Task 2: R1-1 run the shellcheck step under pipefail

Files: `.github/workflows/gate.yml`

What happens today:
- The shellcheck step (`.github/workflows/gate.yml` 106-111) has no `shell:` key, and the file has no `defaults:` block. GitHub runs a step like that as `bash -e {0}`, without pipefail (GitHub's documented default, as the reviewer cites it).
- Under `set -e` without pipefail, a pipeline's status is its last command's. So line 109, `shellcheck --version | sed -n 2p`, and lines 110-111, `shellcheck -f gcc ... | sed -E ...`, both exit with sed's 0. That holds whatever shellcheck returns: 1 on a finding, 127 when it is missing.
- `continue-on-error: true` (107) never acts. The route to a required check that the comment at 103-105 describes (delete `continue-on-error`, require the job) would give a check that passes on every finding.

Red first. No harness covers the workflow file, so the red case is the step's shell semantics under GitHub's default. Run each command and see the line it prints:
- `bash -c 'set -e; (exit 1) | sed -n 2p; echo step-continues'` prints `step-continues`. A finding (shellcheck exits 1) is swallowed.
- `bash -c 'set -e; (exit 127) | sed -n 2p; echo step-continues'` prints `step-continues`. A missing shellcheck is swallowed too.

Then, in `.github/workflows/gate.yml`:
- Insert `set -euo pipefail` as the first line of the shellcheck step's `run: |` block, directly above `shellcheck --version | sed -n 2p` (line 109). Indent it ten spaces, like the block's other lines, so it stays inside the literal block scalar. Change nothing else in the block.
- Extend the comment above the step (103-105) so that it reads, in full:

  ```
        # Advisory until the first clean pass: findings annotate the pull request and the job
        # stays green. To make it required, delete `continue-on-error` and add this job to the
        # required checks on main (see the #17 spec's Deferred list). The block opens with
        # `set -euo pipefail` because GitHub runs a step with no `shell:` as `bash -e`, without
        # pipefail: a pipe would exit with sed's status and pass on every finding, or with no
        # shellcheck at all. With it, either fails the step, and `continue-on-error` alone keeps
        # the job green (#47, R1-1).
  ```

  The comment keeps its six-space indentation.
- Leave `continue-on-error: true`, the step name `shellcheck (advisory)` and every other step as they are. The job stays advisory.

Unchanged neighbours:
- The gate job's steps (36-93).
- The gate step's explicit `exit "$rc"` (70).
- The upload step's `if: failure()` (87).

Proof:
- `bash -c 'set -euo pipefail; (exit 1) | sed -n 2p' || echo step-fails` prints `step-fails`. So does `bash -c 'set -euo pipefail; (exit 127) | sed -n 2p' || echo step-fails`. With the block's new first line, a finding and a missing shellcheck each fail the step.
- `grep -n -A1 'run: |' .github/workflows/gate.yml` lists four run blocks. The last one, the shellcheck step's, is followed by `set -euo pipefail` indented ten spaces.
- `grep -n 'R1-1' .github/workflows/gate.yml` prints one line, the comment's last.
- `git show --stat HEAD` after the commit lists only `.github/workflows/gate.yml`.
- The gate (Task 5) stays green. It does not read the workflow, so this shows only that nothing else moved.

Commit: `redline: R1-1 run the shellcheck step under pipefail so a finding or a missing shellcheck fails it (#17)`

## Task 3: R1-2 set the shellcheck severity only on the command line

Files:
- `.github/workflows/gate.yml`
- `.shellcheckrc`

Decided by @michaelfromtheoutfit on 2026-10-28: option (2), Flag in the workflow, rc line removed (`shape.md`, Decisions). Their reason: shellcheck 0.11.0 was verified to ignore the rc key and honour the flag, so the one place that sets the severity is the one that works. The change lands in its own commit after Task 2's.

What happens today:
- `.shellcheckrc:3` is `severity=warning`, a key shellcheck 0.11.0 ignores. The shellcheck command (`.github/workflows/gate.yml:110` before Task 2) passes no `-S`.
- So the job runs at ShellCheck's default severity, not at warning as the rc file's header (lines 1-2), the PR description and `agent-os/standards/scripts/bash-conventions.md` line 30 say. It also reports info and style notes. The reviewer names the deliberate `$owner` and `$threadId` inside single quotes in `scripts/redline-gh.sh:122-123` (SC2016, info).
- With Task 2's pipefail those notes fail the step. Once the job is made required (the #17 Deferred list), they would fail every pull request.

Red first. No harness reads the workflow or the rc file, and shellcheck is not installed on the machine the shaper used. The red case is the person's check recorded under Decisions in `shape.md` (the rc key is ignored, the flag is honoured). Its two halves, before the edit:
- `grep -c 'shellcheck -S warning -f gcc' .github/workflows/gate.yml` prints `0`: no flag on the command.
- `grep -c '^severity=' .shellcheckrc` prints `1`: the severity sits only in the key shellcheck ignores.

Then:
- In `.github/workflows/gate.yml`, change the shellcheck command line in the shellcheck step's `run: |` block. It is `shellcheck -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh \`, line 110 before Task 2 and line 115 after it: Task 2 adds four comment lines and `set -euo pipefail`. It becomes:

  ```
            shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh \
  ```

  Keep its ten-space indentation and the trailing backslash.
- In `.shellcheckrc`, replace lines 1-3 (the two-line header comment and `severity=warning`) with this header, so the file sets no severity and says where it is set:

  ```
  # shellcheck settings for scripts/*.sh, tests/*.sh and the generated .claude/redline/checks.sh,
  # as .github/workflows/gate.yml runs them; the severity is its -S warning (advisory until the first clean pass).
  # No severity= line here: shellcheck 0.11.0 ignores that key and honours -S (#47, R1-2).
  ```

  The first two lines are the wording the person saw under option (2). The third gives the reason, so the key is not added back. `shell=bash` stays on line 4.

Unchanged neighbours:
- In `.github/workflows/gate.yml`: the `sed -E` continuation line under the command, Task 2's comment and `set -euo pipefail`, `continue-on-error: true`, the step name `shellcheck (advisory)` and every other step.
- In `.shellcheckrc`: `shell=bash`, the SC2164 comment and `disable=SC2164`.

Proof:
- `grep -n 'shellcheck -S warning -f gcc' .github/workflows/gate.yml` prints one line, 115.
- `grep -c 'shellcheck -f gcc' .github/workflows/gate.yml` prints `0`.
- `grep -c '^severity=' .shellcheckrc` prints `0`.
- `grep -n '^shell=bash' .shellcheckrc` prints `4:shell=bash`, and `grep -n '^disable=SC2164' .shellcheckrc` prints `8:disable=SC2164`.
- `grep -n 'R1-2' .shellcheckrc` prints one line, 3.
- `git show --stat HEAD` after the commit lists only `.github/workflows/gate.yml` and `.shellcheckrc`.
- The gate (Task 5) stays green. It reads neither file, so this shows only that nothing else moved.
- The behavioural proof is the round's CI run (After the run, item 3).

Commit: `redline: R1-2 set the shellcheck severity only on the command line (#17)`

## Task 4: Standards retrospective

Files: `agent-os/standards/scripts/bash-conventions.md`

Item 1 under "Standards retrospective (proposed)" in `shape.md` comes from R1-1: a new bullet directly after line 30. Item 2 comes from R1-2's decision, option (2): a rewording of line 30's closing words, drafted in `shape.md`. Make item 2's edit to line 30 before inserting item 1's bullet after it. Apply only the edits the standards approver approved, in one commit after the finding commits, keeping the file's heading. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when edits are approved): `redline: record the round 1 review lessons in the standards (#17)`

## Task 5: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-28-0639-47-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Standards retrospective**: Task 4, from the proposed list in `shape.md`, as the standards approver approved it.
11. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.

## After the run (the person, on GitHub)

Not an implementer task: no Redline role can read a workflow run, and a throwaway commit breaks the round's one-commit-per-finding rule. These are the round's behavioural proof, the way #17's Task 7 was its own.

1. Open the shellcheck job of the CI run on the round's push. The step's script listing starts with `set -euo pipefail`.
   - A green step means shellcheck found nothing at the severity it ran at.
   - A step marked failed while the job stays green means it found something, and the annotations list what. That is the advisory behaviour the PR describes.
2. Optional red proof, as #17's Task 7 did for the gate:
   - Make one throwaway commit that adds `local x=$(true)` (SC2155, warning level) inside a function of a script under `scripts/`. Pick one other than `scripts/redline-guard.sh`, which the person owns, and `scripts/checks-template.sh`, which the setup test compares.
   - The shellcheck step must show failed, with an annotation on that line, while the job stays green.
   - Then drop the commit before merge.
3. R1-2 was decided as option (2) (Task 3). In the same run, the step's script listing shows `shellcheck -S warning -f gcc ...`, and there are no SC2016 notes on `scripts/redline-gh.sh:122-123`. A note on either line means the flag did not take effect.

## As built

Built as planned. No deviation, so `shape.md` Decisions gains no entry.

- **Task 1** (`8ee2115`): the four spec files, on their own. `redline/` was left to the workflow.
- **Task 2, R1-1** (`a465d45`): red first, both `bash -c 'set -e; (exit 1|127) | sed -n 2p; echo step-continues'` commands printed `step-continues`. After the edit:
  - both `set -euo pipefail` proofs printed `step-fails`;
  - `grep -n -A1 'run: |'` lists four run blocks, the last at 112 with `set -euo pipefail` on 113;
  - `grep -n 'R1-1'` prints one line, 109, the comment's last;
  - the commit lists only `.github/workflows/gate.yml`.
- **Task 3, R1-2** (`5b9c23b`): red first, the flag count printed `0` and the rc key count `1`. After the edit:
  - `shellcheck -S warning -f gcc` is on line 115;
  - the counts of `shellcheck -f gcc` and `^severity=` are `0`;
  - `.shellcheckrc` keeps `4:shell=bash` and `8:disable=SC2164`, with `R1-2` on line 3;
  - the commit lists only `.github/workflows/gate.yml` and `.shellcheckrc`.
- **Task 4** (`7e91246`): the two approved edits to `agent-os/standards/scripts/bash-conventions.md`, line 30's closing words first, then the new bullet after it, in the approved wording. The heading is unchanged. Neither edit carries part of a finding's fix, so the message names no finding.
- **Task 5**: `checks.sh` with the round's snapshot was green on its first run, all nine checks at exit 0, with no unexpected or uncommitted files. Nothing reads the workflow or `.shellcheckrc`, so this shows only that nothing else moved. The behavioural proof is the CI run in After the run above.
