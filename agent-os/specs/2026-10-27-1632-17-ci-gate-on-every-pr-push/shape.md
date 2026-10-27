# CI: run the gate on every PR push, on Linux and macOS — Shaping Notes (#17)

## Scope

One GitHub Actions workflow, `.github/workflows/gate.yml`, that runs this repository's gate as the Redline checker runs it, on every push to a pull request and every push to `main`, on Ubuntu and macOS, followed by the stamp check, the template version check and a clean-tree check, with shellcheck advisory beside it. Supporting files: `.nvmrc`, `.shellcheckrc`, a README Contributing section, and the tech-stack line that said "no CI yet". Branch protection on `main` is a hand checklist, not a file.

The issue's six parts are implemented as written, with two corrections found while shaping:

- The issue names `templates/checks-template.sh`; the template is `scripts/checks-template.sh`, already inside the `scripts/*.sh` glob, and `templates/` holds no shell file. shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `.claude/redline/checks.sh`.
- `claude plugin validate .` passes with an empty HOME (checked on 2.1.312 on 2026-10-27), so it needs no auth and stays in CI. The "drop that one check" branch of the issue's part 6 is not taken.

## Decisions

The eight decisions in the shaping prompt stand as given. The ones made while shaping, each with its reason:

1. **Claude Code pinned to 2.1.312, recorded in `tech-stack.md`** (answered 2026-10-27). The prompt pointed at the version in `agent-os/product/tech-stack.md`, which pins nothing (line 5 lists versions dynamic workflows were proven on). Pinning the version on the author's machine keeps CI and the local gate on the same CLI; `CLAUDE_CODE_VERSION` in the workflow's `env` is the one place to bump, and the tech-stack line names it so the two cannot drift silently. Alternatives not taken: 2.1.306 (older than what runs locally), unpinned (a CLI release could turn the check red with no change here).
2. **Standards carried: all four** (answered 2026-10-27): `scripts/bash-conventions`, `testing/tests`, `process/standards-retrospective`, `prompts/attribution`.
3. **The macOS leg runs Apple's bash 3.2 and BSD tools.** A step prepends `/bin:/usr/bin` to `GITHUB_PATH` on macOS so `#!/usr/bin/env bash` and `checks.sh`'s `bash -c` resolve to `/bin/bash`. Without it, Homebrew's bash 5 on the runner would make the macOS leg a second Linux leg with BSD `sed`, and the combination a stock macOS user has (the one the scripts were written on) would go untested. The "Tool versions" step prints `command -v bash` so the first run confirms which bash ran.
4. **shellcheck is its own job, Ubuntu only.** shellcheck is preinstalled on `ubuntu-latest`, not on `macos-latest`, and the files are the same bytes on both; a second leg would add a Homebrew install for no information. Its findings are rewritten to `::warning` annotations so they show on the PR. `continue-on-error: true` sits on the step, so the job stays green and its name is not a required check.
5. **`.shellcheckrc` is minimal.** `severity=warning`, `shell=bash`, and `disable=SC2164` only, each disabled code tied to a line (`tests/guard-test.sh:35`, `tests/gh-test.sh:147`, which run under `set -uo pipefail` by design, so shellcheck's `set -e` suppression does not apply). Nothing else was found at severity warning by reading; the first advisory run settles whether SC2209 or SC2046 fire, and the follow-up adds them with a line each if they are deliberate. The issue's example, `bash -c "$cmd"` in `run_check`, is a quoted string and trips nothing.
6. **README gets a `## Contributing` section before `## Known limits`.** The prompt's "contributing line" has no home: the README has no contributing text. Three sentences, nothing about process beyond the gate.
7. **Workflow hygiene**: `permissions: contents: read`; `concurrency` group per workflow and ref, cancelling only `pull_request` runs (pushes to `main` queue, so a merge is never half-checked); `persist-credentials: false` on checkout; `fail-fast: false` so a macOS-only failure still reports; job timeout 20 minutes with the gate step capped at 15 so a hung background test fails inside the job; a step-summary table of check and result built with `jq` from the gate's JSON; the JSON uploaded from `$RUNNER_TEMP` on failure, one artifact per leg, kept 14 days.
8. **`tech-stack.md` drive-by**: while retiring line 17's "no CI yet", line 12's "eight steps" becomes "nine steps" (stale since #40 added the background check). Line 5's "proven on" list is left alone.
9. **The red proof is a throwaway commit on this PR** (Task 7): one backticked word in the gate list of `shape-spec.md` without a restamp turns both legs red at the gate step and again at the stamp step, and produces both artifacts. The person drops the commit afterwards.
10. **Not in scope**: running Redline in CI; Chalkboard and LL CI; making shellcheck required; pinning runner images to a version; `workflow_dispatch`.

## Context

- **Visuals:** None.
- **References:** see `references.md`. The survey read the gate script, the stamp and version subcommands, the guard's temp-directory prefixes and every harness for host dependencies; nothing in the scripts depends on the workspace path, HOME, a git identity or a tty, and no test regenerates a tracked file.
- **Product alignment:** `agent-os/product/tech-stack.md:17` ("no CI yet") is retired by this spec; the roadmap's Phase 1 (GitHub as the only host) is unchanged, and GitHub Actions is the host's own CI.

## Deferred

- **shellcheck required.** After the first advisory run is clean: delete `continue-on-error: true` from the shellcheck step in `.github/workflows/gate.yml`, add `shellcheck` to the required status checks on `main`, and add any further deliberate pattern to `.shellcheckrc` with a line naming where it occurs. A follow-up issue is opened from Task 9's checklist with the first run's annotations.

## Standards Applied

- scripts/bash-conventions — the workflow's `run:` blocks and the shellcheck configuration follow the same rules the scripts do; the macOS leg pins bash 3.2.
- testing/tests — the harnesses write only to the temp directory and `~/.cache/redline/`, which is what makes the clean-tree check meaningful, and the checkout must not sit under a temp directory, which GitHub's workspace satisfies.
- process/standards-retrospective — gate step 10, below.
- prompts/attribution — the PR body and commits carry no AI attribution.

## Standards retrospective (proposed)

Done mechanically over the ten decisions above and the build (gate step 10, 2026-10-27). Nothing went red during the build, and no standard is contradicted.

- Already in a standard: no AI attribution (`prompts/attribution`); design record outside this repository (`process/internal-notes`); tests write only under the temp directory and `~/.cache/redline/` (`testing/tests`, the `sed -i` line); a stand-in checkout outside the temp directory (`testing/tests`, the line after it), which is why GitHub's workspace is safe for the guard test.
- Missing, approved 2026-10-27 and applied in their own commit: `agent-os/standards/testing/tests.md`, a last bullet recording that the gate runs in CI on both OSes as the checker runs it, followed by the stamp, version and clean-tree checks, that the workflow adds no check of its own, and that a harness failing on one OS is fixed there, never skipped (#17); `agent-os/standards/scripts/bash-conventions.md`, a last bullet recording that every script runs under bash 3.2 with BSD tools and bash 5 with GNU tools, so bash 4 features stay out, and the shellcheck scope, severity and the rule that every disabled code names its line (#17).
- Not a standard: the Claude Code pin lives in the workflow's `env` and `agent-os/product/tech-stack.md`, a product fact, not a rule.
- No pattern was invented outside `agent-os/standards/`.
