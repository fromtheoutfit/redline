# CI: run the gate on every PR push, on Linux and macOS (#17)

Spec folder: `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/`

## Context

The gate (`.claude/redline/checks.sh --baseline`, nine checks, 78 s) runs only on the author's machine. A push from a phone, a late edit, or a teammate's branch reaches `main` with nothing checking it, and this repository's rule is that `main` is green. Issue #17 asks for one GitHub Actions workflow that runs the same gate the Redline checker runs, nothing more and nothing less, on Linux and macOS, then proves the stamp, the template version and a clean tree, with shellcheck advisory beside it. `agent-os/product/tech-stack.md:17` still says "no CI yet"; there is no `.github/`, `.nvmrc`, `package.json` or `.shellcheckrc`.

What the survey established (all by reading; nothing changes in the scripts):

- `checks.sh --baseline` needs a git checkout, `jq` 1.6+, `node`, `python3` and `claude` on PATH; prints one JSON object on stdout, progress on stderr; exit 0/1/2. It writes nothing into the tree (`mktemp -d` under `$TMPDIR`, removed on exit). `tests/guard-test.sh` writes to `${XDG_CACHE_HOME:-$HOME/.cache}/redline/guard-test-repo`; `tests/setup-test.sh` commits with `git -c user.email=t@t -c user.name=t`, so no global git identity is needed. No test regenerates a tracked file, so the clean-tree check is meaningful.
- `claude plugin validate .` passes with an empty HOME (checked locally on 2.1.312): no auth needed, so the check stays in CI. Decision 5's "skip if auth is needed" branch is not taken.
- The checkout must not sit under a temp dir (guard `TMP` prefix, `testing/tests`); GitHub's workspace `/home/runner/work/...` and `/Users/runner/work/...` is fine, and no guard row depends on HOME or the workspace path (`scripts/redline-guard.sh:187-189, 222-233`; `tests/guard-cases.tsv` uses only `REPO/`, `PLUGIN/` and `/tmp` paths).
- `tech-stack.md` pins no Claude Code version (decided 2026-10-27: pin 2.1.312 in the workflow and record it in `tech-stack.md`).
- The issue's `templates/checks-template.sh` does not exist; the template is `scripts/checks-template.sh`, already inside `scripts/*.sh`. `templates/` holds no `.sh`.
- shellcheck is not installed locally. By reading, the only warning-level hit is SC2164 (`cd` without `|| exit`) in `tests/guard-test.sh:35` and `tests/gh-test.sh:147`, which run under `set -uo pipefail` by design (`bash-conventions`). `bash -c "$cmd"` in `run_check` is a quoted string and trips nothing at severity warning.

Shaped by hand on 2026-10-27 with `/agent-os:shape-spec`; the person makes the commits.

## Decisions (the eight from the prompt, plus the ones made while shaping)

1. **One workflow, `.github/workflows/gate.yml`**, on `pull_request` (every push to a PR's head) and `push` to `main`. The gate step is `.claude/redline/checks.sh --baseline`, failing on its exit code; a new gate step reaches CI with no workflow edit. The JSON goes to `$RUNNER_TEMP/gate.json` (outside the tree) and is uploaded as an artifact on failure, one per matrix leg.
2. **After the gate**, in order: `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .claude/redline/checks.sh`, then `git status --porcelain` must print nothing (the step prints the status and diff when it does not).
3. **Matrix `ubuntu-latest` and `macos-latest`**, `fail-fast: false`, both required. Job name `gate (${{ matrix.name }})` with `name: ubuntu | macos` so the check names stay stable if the runner label is pinned later. No script is weakened to pass; a script that fails on one OS is fixed on that OS. **The macOS leg runs Apple's bash 3.2 and BSD tools** (shaping decision): a step prepends `/bin:/usr/bin` to `GITHUB_PATH` on macOS so `#!/usr/bin/env bash` and `bash -c` resolve to `/bin/bash`, which is what a stock macOS user has; otherwise Homebrew's bash 5 would make the macOS leg a second Linux leg with BSD `sed`. A "Tool versions" step prints `command -v bash`, bash, jq, python3, node and claude versions so the first run confirms it.
4. **shellcheck is its own job, `shellcheck`, ubuntu only** (shaping decision: it is preinstalled there and the files are the same bytes on both OSes), over `scripts/*.sh tests/*.sh .claude/redline/checks.sh` (the generated file is included because it is what runs; a finding there that the template lacks points at the generator), severity warning, `.shellcheckrc` with `severity=warning`, `shell=bash` and `disable=SC2164` with a comment naming the two lines. `-f gcc` output is rewritten to `::warning file=,line=,col=::` so findings annotate the PR. `continue-on-error: true` on the step. **Follow-up, not this PR**: to make it required, remove that one line and add `shellcheck` to the required checks; the spec records this under `## Deferred` and the hand checklist opens a follow-up issue.
5. **Dependencies**: `actions/checkout@v4` (`persist-credentials: false`), `actions/setup-node@v4` with `node-version-file: .nvmrc` (new file, `22`; no `cache:` since there is no lockfile), `npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}` with `CLAUDE_CODE_VERSION: 2.1.312` as a workflow `env` (one place to bump). `jq`, `python3`, `git` are preinstalled on both images. `tech-stack.md` records the pin.
6. **Branch protection is hand work**, after the first green run on this PR: the last task is the checklist (required checks `gate (ubuntu)` and `gate (macos)`, require a PR before merging, no direct pushes; `shellcheck` not required). The README gains a `## Contributing` section (shaping decision on placement: before `## Known limits`, since the README has no contributing text today) saying the gate runs in CI on both OSes, how to run it locally, and the two stamp/version commands.
7. **Not in scope**: running Redline in CI; Chalkboard and LL CI; making shellcheck required; pinning runner images.
8. **Done when** a PR that breaks a gate check, drops the stamp, or leaves the tree dirty shows red on both OSes before review. Proved on this PR by one throwaway commit (Task 7).
9. **Workflow hygiene** (shaping decisions): `permissions: contents: read`; `concurrency` group `${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress` only for `pull_request` events (pushes to `main` queue); job `timeout-minutes: 20`, gate step `timeout-minutes: 15` so a hung background test fails inside the job; a `GITHUB_STEP_SUMMARY` table of check name and pass/fail built with `jq` from the JSON when the file exists.
10. **`tech-stack.md` drive-by** (shaping decision, flagged): while replacing line 17's "no CI yet", line 12's "eight steps" becomes "nine steps" (stale since #40). Line 5's "proven on" list is left alone; the pin is a new clause.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/` with:
- `plan.md`: this plan.
- `shape.md`: scope (the issue's six parts, with the template-path correction), the decisions above with the two answers of 2026-10-27 (pin 2.1.312; all four standards) and their reasoning, the survey facts under Context (visuals: none; references below; product alignment: tech-stack "no CI yet" line retired), `## Deferred` (shellcheck required: remove `continue-on-error`, add to required checks, after the first clean pass), and `## Standards retrospective (proposed)` filled at Task 8.
- `standards.md`: full text of `scripts/bash-conventions`, `testing/tests`, `process/standards-retrospective`, `prompts/attribution`.
- `references.md`: `.claude/redline/checks.sh` 46-110 (`set -euo pipefail`, `run_check`, stderr log), 207-236 (the nine checks, `--baseline` skips git), 320-328 (JSON last, exit code); `scripts/redline-gate.sh` 307-342 (`cmd_check`); `scripts/redline-setup.sh` 77 (`REDLINE_TEMPLATE`), 963-993 (`cmd_version`); `scripts/redline-guard.sh` 187-189, 222-233 (temp prefixes, containment); `tests/guard-test.sh` 25-36 (cache repo, `set -uo pipefail`); `tests/setup-test.sh` 50-58, 333; `tests/background-test.sh` 17-18, 35, 119-124; `tests/gh-test.sh` 36, 65-146, 147; `agent-os/product/tech-stack.md` 5, 12, 17; `README.md` 22, 44, 158.

## Task 2: `.nvmrc` and `.shellcheckrc`

**Files:** new `.nvmrc` (`22` and a newline), new `.shellcheckrc`.

```
# shellcheck settings for scripts/*.sh, tests/*.sh and the generated .claude/redline/checks.sh
severity=warning
shell=bash
# SC2164 (cd without || exit): the harnesses run under set -uo pipefail by design and cd into a
# path they just resolved (tests/guard-test.sh:35) or created (tests/gh-test.sh:147).
disable=SC2164
```

Nothing else is disabled: the first advisory run settles whether SC2209 (`truncated=false`) or SC2046 (`kill $(jobs -p)` in a trap) fire, and the follow-up adds them with a line each if they are deliberate.

## Task 3: `.github/workflows/gate.yml`

**Files:** new `.github/workflows/gate.yml`.

```yaml
name: gate

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  CLAUDE_CODE_VERSION: 2.1.312

jobs:
  gate:
    name: gate (${{ matrix.name }})
    runs-on: ${{ matrix.os }}
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        include:
          - { name: ubuntu, os: ubuntu-latest }
          - { name: macos,  os: macos-latest }
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
      - name: Install Claude Code
        run: npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"
      - name: Run the scripts under Apple's bash 3.2 and BSD tools
        if: runner.os == 'macOS'
        run: printf '%s\n' /bin /usr/bin >> "$GITHUB_PATH"
      - name: Tool versions
        run: |
          command -v bash; bash --version | head -1
          jq --version; python3 --version; node --version; claude --version
      - name: Gate, as the checker runs it
        timeout-minutes: 15
        run: |
          rc=0
          .claude/redline/checks.sh --baseline > "$RUNNER_TEMP/gate.json" || rc=$?
          if [ -s "$RUNNER_TEMP/gate.json" ]; then
            {
              echo '| check | result |'; echo '|---|---|'
              jq -r '.checks[] | "| \(.name) | \(if .exit == 0 then "pass" else "**fail (exit \(.exit))**" end) |"' "$RUNNER_TEMP/gate.json"
            } | tee -a "$GITHUB_STEP_SUMMARY"
          fi
          exit "$rc"
      - name: Gate stamp matches the gate text
        run: scripts/redline-gate.sh check .
      - name: checks.sh is generated from the shipped template
        run: scripts/redline-setup.sh version .claude/redline/checks.sh
      - name: Working tree is clean after the gate
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git status --porcelain
            git --no-pager diff
            exit 1
          fi
      - name: Upload the gate's JSON
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: gate-${{ matrix.name }}
          path: ${{ runner.temp }}/gate.json
          if-no-files-found: ignore
          retention-days: 14

  shellcheck:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: shellcheck (advisory until the first clean pass; see the spec's Deferred list)
        continue-on-error: true
        run: |
          shellcheck --version | sed -n 2p
          shellcheck -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh \
            | sed -E 's/^([^:]+):([0-9]+):([0-9]+): (warning|error|note|style): (.*)$/::warning file=\1,line=\2,col=\3::\5/'
```

A comment at the top of the file states the contract in two lines: the gate step is the repository's own `checks.sh`, so a check is added by editing `checks.json` and regenerating, never here; and nothing in this file may skip or weaken a check to pass on one OS. Check names as GitHub shows them: `gate (ubuntu)`, `gate (macos)`, `shellcheck`.

## Task 4: README `## Contributing`

**Files:** `README.md`, new section before `## Known limits` (line 158).

Three sentences: every push to a PR and to `main` runs the gate in GitHub Actions on Ubuntu and macOS (`.github/workflows/gate.yml`), the same `.claude/redline/checks.sh --baseline` the checker runs, then `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .claude/redline/checks.sh` and a clean-tree check; run the same four locally before pushing; a check that fails on one OS is fixed on that OS, never skipped in the workflow. One line that shellcheck runs advisory on Ubuntu.

## Task 5: `agent-os/product/tech-stack.md`

**Files:** `agent-os/product/tech-stack.md` lines 12 and 17.

- Line 12: "eight steps" becomes "nine steps".
- Line 17 becomes: no framework, no package manager, no lockfile, no build step; CI is `.github/workflows/gate.yml` (Ubuntu and macOS, the gate as the checker runs it, stamp, version and clean-tree checks; shellcheck advisory), with Claude Code pinned to 2.1.312 there for `claude plugin validate` and Node 22 from `.nvmrc`.

## Task 6: Local verification before the push

Run, from the checkout, and report the output:
- `.claude/redline/checks.sh --baseline` exits 0 (no script changed, so the baseline is unchanged; the gate's step 1 glob `scripts/*.sh` sees no new file).
- `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0; `git status --porcelain` empty after the gate.
- `bash -n` is not applicable to the YAML; if `actionlint` or `shellcheck` is installed locally, run it over the workflow's `run:` blocks, else note that the first CI run is the YAML's first parse.

## Task 7: First CI run and the red proof (the person, on GitHub)

1. Push the branch, open the PR for #17. Both `gate (...)` legs green; `shellcheck` green with annotations listed in the PR comment thread (copy the list into the follow-up issue of Task 9).
2. Read the macOS leg's "Tool versions" step: `command -v bash` must print `/bin/bash` and the version 3.2.57. If Homebrew's bash wins anyway, fix the PATH step before merging.
3. One throwaway commit that edits one backticked word in the gate list of `.claude/commands/agent-os/shape-spec.md` (steps 1 to 9) without restamping: both legs must go red twice over (gate check `gate` and the stamp step), and the `gate-ubuntu` and `gate-macos` artifacts must appear. Then drop the commit (`git revert`, or rebase it out before merge; the person's choice) and see green again.
4. Record both run URLs under `## As built` in `plan.md`.

## Task 8: Verification Gate

Run the nine commands (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then the standards retrospective (gate step 10), then confirm the spec folder (step 11). Fix anything that fails and rerun. Candidates for the retrospective, to present with AskUserQuestion:
- `testing/tests`: a line that the gate runs in CI (`.github/workflows/gate.yml`) on Ubuntu and macOS as the checker runs it, followed by the stamp, version and clean-tree checks; a harness that fails on one OS is fixed there, never skipped in the workflow; the workflow adds no check of its own, so a new gate step is an edit to `checks.json` (#17).
- `scripts/bash-conventions`: a line that `shellcheck` runs over `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, advisory until the first clean pass, with every disabled code in `.shellcheckrc` tied to a line (#17); and that the macOS leg runs Apple's bash 3.2, so bash 4 features stay out.
- `process/internal-notes` or `prompts/attribution`: likely "already in a standard".
Approved edits land in their own commit; otherwise "Standards retrospective: no changes" under Decisions in `shape.md`.

## Task 9: Branch protection and follow-up (hand checklist, after the first green run)

In GitHub settings for `main` (classic branch protection or a ruleset):
- Require a pull request before merging.
- Require status checks to pass: `gate (ubuntu)` and `gate (macos)`; require branches to be up to date is optional (the gate does not depend on the base).
- Do not allow bypassing the above (include administrators), so there are no direct pushes.
- Leave `shellcheck` out of the required list.
- Open a follow-up issue: "shellcheck required: fix the advisory findings, delete `continue-on-error` in `gate.yml`, add `shellcheck` to the required checks", listing the first run's annotations.
- Close #17 by the PR.

## Verification

End to end: Task 6 locally, Task 7 on the PR (green on both OSes, then a deliberate red on both with artifacts, then green), Task 8's gate green with the retrospective landed or recorded, Task 9 applied and checked by pushing nothing directly to `main`.

## As built (2026-10-27)

Tasks 1 to 6 and 8 landed as shaped, with no deviation. Task 7 (the first CI run and the red proof) and Task 9 (branch protection, the follow-up issue) are the person's, after the push; their run URLs go here.

Local verification (Task 6), from this checkout on macOS, bash 3.2.57, Claude Code 2.1.312, node 22.23.2, jq 1.8.2, python 3.14.7:

- `.claude/redline/checks.sh --baseline`: exit 0, `ok: true`, all nine checks exit 0 (syntax, validate, guard, loop, prefs, gate, setup, gh, background).
- `scripts/redline-gate.sh check .`: exit 0, `reason: match`, steps 1-9, sha256 `3ec7834b…`.
- `scripts/redline-setup.sh version .claude/redline/checks.sh`: exit 0, template v1, file v1, `match: true`.
- `git status --porcelain` after the gate lists only this spec's own uncommitted files; the gate dirtied nothing.
- `.github/workflows/gate.yml` parses as YAML (ruby `YAML.load_file`); each `run:` block passes `bash -n`; the step-summary `jq` filter prints the expected table from the gate's JSON. Neither `actionlint` nor `shellcheck` is installed locally, so the first CI run is the workflow's first run and shellcheck's first pass.

Standards retrospective (gate step 10): two bullets approved and applied, in `agent-os/standards/testing/tests.md` and `agent-os/standards/scripts/bash-conventions.md`, for their own commit; see `shape.md`.
