# References for PR #47 review round 1

Every file below was opened while shaping. Line numbers are at the PR's head, 9f7b1c8.

## The workflow

- **Location:** `.github/workflows/gate.yml`
- **Relevance:** the file both findings sit in, and the only file R1-1's fix changes.
- **Key lines:**
  - 1-4: the contract comment. The gate step is the repository's own `checks.sh`, and nothing may weaken a check to pass on one OS.
  - 54-57: "Tool versions", a print-only pipe.
  - 59-70: the gate step. Its `|| rc=$?` and `exit "$rc"` make its status the gate's own, whatever its summary pipe does.
  - 78-84: the clean-tree step, which has no pipe.
  - 95-111: the `shellcheck` job:
    - 103-105: the comment giving the route to a required check;
    - 106: the step name;
    - 107: `continue-on-error: true`;
    - 108-111: the run block, whose two pipes end in `sed`.
  - No step has a `shell:` key, and the file has no `defaults:` block.
- **Key patterns:** the gate step's explicit exit code is the existing way this file keeps a pipe from deciding a step. R1-1 applies the bash-conventions way, `set -euo pipefail`, to the one block that has no explicit exit.

## The shellcheck configuration

- **Location:** `.shellcheckrc`
- **Relevance:** R1-2.
- **Key lines:**
  - 1-2: the header naming the scope and "severity warning, advisory until the first clean pass".
  - 3: `severity=warning`.
  - 4: `shell=bash`.
  - 5-8: `disable=SC2164`, with the two lines that need it.
- **Outside the repository:** Homebrew's own `.shellcheckrc`, the only shellcheck file on the shaping machine. It sets `source-path`, `external-sources` and `disable`, so it neither confirms nor refutes a `severity` key.

## The lines R1-2's evidence turns on

- **Location:** `scripts/redline-gh.sh` 118-123.
- **Relevance:**
  - 118 is `set -euo pipefail`, the convention R1-1 brings to the run block.
  - 122-123 are the two GraphQL strings, `THREADS_QUERY='query($owner: ...'` and `RESOLVE_MUTATION='mutation($threadId: ...'`. They hold `$` names in single quotes with no disable directive. The reviewer says SC2016, an info-level note, fires on them at the default severity and not at warning.

## The #17 spec

- **Location:** `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/`
- **Relevance:** the spec this PR builds. It records the shellcheck decisions and the first CI run.
- **Key lines:**
  - `shape.md` 19: decision 4, shellcheck its own job with `continue-on-error: true`.
  - `shape.md` 20: decision 5, the minimal `.shellcheckrc` with `severity=warning`.
  - `shape.md` 34-36: Deferred, "shellcheck required": delete `continue-on-error`, require the job.
  - `shape.md` 40: "the workflow's `run:` blocks and the shellcheck configuration follow the same rules the scripts do".
  - `plan.md` 25: decision 4, severity warning.
  - `plan.md` 54: "the first advisory run settles whether SC2209 ... or SC2046 ... fire".
  - `plan.md` 144-149: the step as planned.
  - `plan.md` 196: the follow-up issue.
  - `plan.md` 209: As built, "`shellcheck` all passed ... shellcheck reported no findings on its first pass".
  - `plan.md` 220: shellcheck was not installed locally then either.

## Standards and documents

- `agent-os/standards/scripts/bash-conventions.md`:
  - line 5: `set -euo pipefail` in every script;
  - line 30: bash 3.2 and 5, and shellcheck's scope and severity (#17).
- `agent-os/standards/testing/tests.md`:
  - line 21: red before green;
  - line 25: the CI bullet (#17).
- `README.md` 158-160: `## Contributing`. It says shellcheck is "advisory until its first clean pass" and does not list shellcheck among the four local commands.
- `agent-os/product/tech-stack.md` 17: the CI line, "with shellcheck advisory beside it".
- `agent-os/product/mission.md` 14-15: the repository's gate, and decisions staying with people.

## Redline's own process files read

- `.claude/commands/agent-os/shape-spec.md`: the unattended-mode section and the Verification Gate.
- `README.md` 171-182: Git rules for Redline agents.
- `agents/redline-resolve.md` and `agents/redline-plan-approver.md`: how a pending task is read and finalised.
- `scripts/redline-guard.sh`:
  - 93-102: the role table;
  - 444-447: the read commands;
  - 569-572: `bash -c` admitted with its text vetted. This is why Task 2's proof commands run for the implementer.
