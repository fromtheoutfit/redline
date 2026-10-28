# PR #47 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #47, which closes issue #17 ("CI: run the gate on every PR push, on Linux and macOS, with stamp, version and clean-tree checks"). This round covers its two findings and nothing else. Both are in the advisory `shellcheck` job:

- **R1-1** (correctness, medium, confirmed): the shellcheck step runs without pipefail, so it exits with sed's status and can never fail (`.github/workflows/gate.yml:110`). **Fix.**
- **R1-2** (correctness, low, unsure): `severity=warning` may not be a key ShellCheck reads from `.shellcheckrc`, so the job may run at the default severity (`.shellcheckrc:3`). Returned as a **judgment call** (`unsure`). The person decided option (2), **Flag in the workflow, rc line removed** (see Decisions).

## Unattended answers

- **Scope.** The two findings in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-1-review.json` in this folder.
- **Visuals.** None. The change is one GitHub Actions workflow file. GitHub's checks list and the job's step log are the only screens.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** `agent-os/product/mission.md:14`: "run the repository's gate (`.claude/redline/checks.sh`)". `agent-os/product/tech-stack.md:17` records the CI as "the gate as the checker runs it ... with shellcheck advisory beside it". Neither finding touches the gate job. Both concern the advisory job and its route to becoming a required check, so this round changes no product line.
- **Standards.** These apply:
  - `scripts/bash-conventions`: line 5, every script starts `set -euo pipefail`; line 30, shellcheck's scope and severity (#17).
  - `testing/tests`: line 21, a bug fix lands red before green; line 25, the CI bullet (#17).
  - `process/standards-retrospective`, `prompts/attribution`, `process/internal-notes`.

  `scripts/guard`, `workflow/agents` and `workflow/replay` do not apply: no option touches the guard, an agent file or the loop.
- **Already known?**
  - `scripts/redline-gh.sh issues-search shellcheck` returns only #17, the issue this PR closes.
  - `issues-search pipefail` returns nothing.
  - `issues-search severity` returns #17 and the backlog issues #19, #21 and #28. None of the backlog issues is about shellcheck.
  - `redline-gh.sh pr-comments 47` shows only this round's review. `redline-gh.sh review-comments 47` shows only this round's two inline comments (4399637287 on `gate.yml:110`, 4399637302 on `.shellcheckrc:3`).
  - `git ls-tree -d --name-only origin/feature/17-ci-run-the-gate-on-every-pr-push-on-linux-and-macos-with-stamp-version-and-clean-tree-checks agent-os/specs/` lists no `-47-review-round-` folder, so this is the PR's first review round.

  Both findings are new.
- **Reproductions.**
  - `/tmp/redlinerepro/reviewer-r1-repro.mjs` exists, but its header says "Scratch reproduction for PR 46 round 1". It belongs to an earlier run and has nothing to do with this round. The reviewer wrote no reproduction file for PR #47.
  - The shaper wrote no scratch Pest test. This repository has no PHP and no Pest.
  - The shaper ran the step's shell semantics with `bash -c` (bash 3.2.57 on this machine). The outputs are quoted under R1-1 below.
  - shellcheck is not installed on this machine: `which shellcheck` prints `shellcheck not found`. A `find` over `/opt/homebrew`, `/usr/local`, the editor and cache folders and the other checkouts under `~/Code` finds no binary. The only shellcheck file on the machine is Homebrew's own `.shellcheckrc`, which sets only `source-path`, `external-sources` and `disable`. That neither confirms nor refutes a `severity` key.
  - `docker` is not among the guard's read commands (`scripts/redline-guard.sh:444-447`), so the shaper cannot run shellcheck in a container either.
- **R1-1: is it real?** Yes.
  - The shellcheck step (`.github/workflows/gate.yml` 106-111) has no `shell:` key. The file has no `defaults:` block (read whole, lines 1-111).
  - The reviewer cites GitHub's documented default for a step with no `shell:` on Linux: `bash -e {0}`, which has no pipefail. With `shell: bash` it is `bash --noprofile --norc -eo pipefail {0}`. The shaper could not open GitHub's documentation from this machine, and nothing on disk records it. The planned fix does not depend on this: a first line of `set -euo pipefail` sets pipefail whatever bash the step starts with.
  - The shell behaviour reproduces here:
    - `bash -c 'set -e; false | cat; echo reached-without-pipefail'` prints `reached-without-pipefail`.
    - `bash -c 'set -e; (exit 127) | sed -n 2p; echo exit-127-swallowed-by-sed'` prints `exit-127-swallowed-by-sed`. This is line 109's shape with a missing shellcheck.
    - `bash -c 'set -eo pipefail; (exit 127) | sed -n 2p; echo not-reached' || echo step-fails-with-pipefail` prints only `step-fails-with-pipefail`.
  - So line 109 (`shellcheck --version | sed -n 2p`) and lines 110-111 (`shellcheck -f gcc ... | sed -E ...`) both exit with sed's 0. That happens whatever shellcheck returns: 1 on a finding, 127 when it is missing.
  - `continue-on-error: true` (107) never acts.
  - The comment at 103-105 and the #17 Deferred entry (`agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/shape.md:36`) describe one route to a required check: delete `continue-on-error` and require the job. Today that route gives a check that passes on every finding.
- **R1-1: does the PR, the spec or the code answer it?** Yes.
  - The PR description: shellcheck is "Advisory until its first clean pass; the spec's Deferred list says what makes it required". The #17 shape.md Deferred entry (line 36): "delete `continue-on-error: true` from the shellcheck step ..., add `shellcheck` to the required status checks". So the job is meant to become a real check by deleting one line.
  - The #17 shape.md, Standards Applied (line 40): "the workflow's `run:` blocks and the shellcheck configuration follow the same rules the scripts do".
  - `scripts/bash-conventions` line 5: "Every script starts `#!/usr/bin/env bash` and `set -euo pipefail`".
  - The run block disagrees with both, and that disagreement is the fix.
- **R1-2: is it real?** Unconfirmed either way.
  - **For:** the reviewer's reading of ShellCheck's documentation lists `disable`, `enable`, `source`, `source-path`, `shell`, `external-sources` and `extended-analysis` as directives, with severity set only by `-S` or `SHELLCHECK_OPTS`. The shaper could not open that documentation or run shellcheck here (see Reproductions).
  - **Against:** the #17 As built (`agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/plan.md:209`) records "shellcheck reported no findings on its first pass". Yet `scripts/redline-gh.sh:122-123` hold `$owner` and `$threadId` in single quotes with no disable directive. The reviewer says SC2016, an info-level note, fires there at the default severity. If the first run's annotations were read and were empty, the rc line was honoured. Otherwise the annotations were missed.
  - This role cannot read the run's annotations: none of the wrapper's read subcommands returns check-run output.
  - The finding cannot be confirmed or refuted, so it goes to the person as `unsure`.
- **R1-2: does the PR, the spec or the code answer the intended severity?** Yes, and it is not in question:
  - the PR description: "at severity warning";
  - `.shellcheckrc:1-3`;
  - `scripts/bash-conventions` line 30: "at severity warning";
  - the #17 plan's decision 4 (`plan.md:25`).

  What is open is whether the rc line delivers that severity. That is a fact about ShellCheck nobody in this run could check.

## Decisions

- **R1-1: the shellcheck step runs under pipefail.** Fix. `set -euo pipefail` becomes the first line of the step's `run:` block. A finding (exit 1) or a missing shellcheck (exit 127) then fails the step, and `continue-on-error: true` alone keeps the job green while it is advisory. The comment above the step gains the reason, citing (#47, R1-1), so the line is not removed as noise. `plan.md` Task 2.
  Decided by: redline

- **R1-1: the mechanism is a line in the block, not `shell: bash`.** The reviewer offered both. The in-block line is chosen because:
  - it is `scripts/bash-conventions` line 5's own first line, which the #17 spec applied to the run blocks (its shape.md line 40);
  - it reads the same in the block as in a script;
  - its effect reproduces locally with `bash -c`, while `shell: bash` takes its pipefail from GitHub's shell template, which a reader must know and which cannot be shown off GitHub;
  - it does not depend on GitHub's default shell either way.
  Decided by: redline

- **R1-1: the other run blocks stay as they are.** None of them has a pipe whose left side's exit status decides the step:
  - the gate step exits with the gate's own code, `exit "$rc"` (`gate.yml:70`), and its summary pipe only formats a table;
  - "Tool versions" (55-57) only prints versions, and a missing tool fails it under `-e`;
  - the clean-tree step (79-84) has no pipe.

  Changing them is outside the finding.
  Decided by: redline

- **R1-1: the #17 As built line is left as written.** `agent-os/specs/2026-10-27-1632-17-ci-gate-on-every-pr-push/plan.md:209` says `shellcheck` passed and "reported no findings on its first pass".
  - Annotations come from sed's rewrite whatever shellcheck's exit status, so "no findings" rests on the annotation list, not the job status. It may still be accurate.
  - This round records the caveat here instead of rewriting another spec's record. Whether that pass ran at warning is R1-2's question.
  Decided by: redline

- **R1-2: the intended severity is warning (unattended answer).** Answered from the PR description ("at severity warning"), `.shellcheckrc:1-3`, `scripts/bash-conventions` line 30 and the #17 plan's decision 4 (`plan.md:25`). No option below changes it. They differ only in how the job is made to run at it.
  Decided by: redline

- **R1-2: `severity=warning` may not be read from `.shellcheckrc`.** Decided 2026-10-28: option (2), **Flag in the workflow, rc line removed**. The story, options and recommendation the person saw are under Judgment calls below. `plan.md` Task 3.
  - Notes: The shellcheck command in the workflow gets `-S warning` and the `severity=warning` line is removed from .shellcheckrc, because shellcheck 0.11.0 was verified to ignore the rc key and honour the flag, so the one place that sets the severity is the one that works.
  - Date: 2026-10-28.
  Decided by: @michaelfromtheoutfit

### Judgment calls

- **R1-2: `severity=warning` may not be read from `.shellcheckrc`**
  - **Story.**
    - The shellcheck job is meant to report only warnings and errors: the PR description, the rc file's own comment and the bash conventions all say "severity warning", and the rc file sets it with `severity=warning`.
    - The reviewer reads ShellCheck's documentation as having no such rc key, with severity set only on the command line. If so, the key is ignored and the job runs at ShellCheck's default, which also reports info and style notes. One example is the deliberate `$owner` inside single quotes in `scripts/redline-gh.sh`'s GraphQL strings (lines 122-123).
    - Today nobody sees a difference. The job is advisory, and until R1-1 lands it cannot fail at all.
    - The day someone follows the #17 Deferred list and makes the job required, every pull request would fail on those notes, and the fix would be found under pressure.
    - It may also be that ShellCheck does read the key. The #17 As built says the first run reported no findings, which points that way.
    - shellcheck is not installed on the machine this run used, and the run's annotations cannot be read from here, so neither reading could be checked.
  - **Why it goes to the person.** Unsure. The intended severity is settled (warning). Whether the rc line delivers it could not be confirmed or refuted in this run.
  - **Options:**
    - **(1) Flag in the workflow.**
      - Cost: add `-S warning` to the shellcheck command in `.github/workflows/gate.yml` (line 110 today), one commit. No other file changes.
      - Effect: CI runs at warning whether or not ShellCheck reads the rc line. `.shellcheckrc` keeps `severity=warning`: harmless if it is read, inert if not. A bare local `shellcheck` run keeps whatever the rc file gives it. The round's CI run can no longer show which case holds.
    - **(2) Flag in the workflow, rc line removed.**
      - Cost: option (1), plus delete `.shellcheckrc:3` and reword its header comment (lines 1-2) to say the severity is the workflow's `-S warning`. Two files, both added by this PR, about three lines.
      - Effect: the severity is set in one place, and it is right whichever way ShellCheck behaves. If ShellCheck did read the rc line, a bare local `shellcheck` run now drops to the default severity. No local shellcheck run is part of the README's Contributing steps (`README.md:160`).
    - **(3) Settle it on the next CI run.**
      - Cost: no change this round. Afterwards, one look at the shellcheck step of the CI run on this round's push. R1-1's fix makes that step's status meaningful: a step marked failed, with notes on `scripts/redline-gh.sh:122-123`, means the rc line is ignored. Option (1) or (2) is then made by hand or in a later round.
      - Effect: nothing changes on an unverified claim. Until then the job may run at the default severity. That blocks nothing while it is advisory, but the step may show as failed on every push. The #17 Deferred step (make the job required) waits for the answer.
    - **(4) Accept.**
      - Cost: none.
      - Effect: if the rc line is ignored, making the job required later fails every pull request on deliberate info and style notes, until someone finds this.
  - **Shaper's recommendation: (1) Flag in the workflow.** It makes CI run at the stated severity whichever way the open question falls. It costs one flag in a file this PR adds, and it removes nothing that might be working.
  - **Decided:** option (2), Flag in the workflow, rc line removed, by @michaelfromtheoutfit on 2026-10-28. The entry under Decisions above carries the notes.

## Deferred

None.

## Proportionality

- **R1-1.**
  - Likelihood: certain. The step exits with sed's status on every run, whatever shellcheck finds. It cannot be observed from the job status, which is exactly the problem.
  - Impact: today, no merge is affected, since the job is advisory and not a required check. The job's green is no evidence that shellcheck passed, though. The documented route to a required check (`gate.yml:103-105`; #17 `shape.md:36`) would give a check that passes on every finding, and also when shellcheck is missing from the runner.
  - Cost: one line in the run block plus a four-line extension of the comment above it, in `.github/workflows/gate.yml`, a file this PR adds. No dependency, service or abstraction.
  - Proportionate: fix.
- **R1-2** (recorded for the options, not to choose one).
  - Likelihood: unknown. It depends on a ShellCheck behaviour this run could not check, and the repository's own evidence points both ways.
  - Impact: none while the job is advisory. Once the job is required, every pull request fails on deliberate info and style notes.
  - Cost: (1) one flag in one line. (2) That plus three lines in `.shellcheckrc`. (3) and (4) nothing now.
  - All stay inside files this PR adds. What decides it is a fact nobody here could verify, which is why it goes to the person.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md:14` (the repository's gate) and `agent-os/product/tech-stack.md:17` (shellcheck advisory beside the gate). Neither line changes: the job stays advisory, and only its exit status becomes real.

## Standards Applied

- **scripts/bash-conventions.** Line 5 (`set -euo pipefail`) is the rule the R1-1 fix brings to the run block, as the #17 spec said the run blocks follow. Line 30 states the shellcheck scope and severity that R1-2 is about.
- **testing/tests.**
  - Line 21: a bug fix lands red before green. No harness covers the workflow file, so the red case is the step's shell semantics, run with `bash -c` before the edit, and the behavioural proof is the round's CI run (`plan.md`, After the run).
  - Line 25: the workflow adds no check of its own, and this round adds none.
- **process/standards-retrospective.** Gate step 10, proposed below.
- **prompts/attribution.** The commit messages in `plan.md` and this folder carry Redline's name only.
- **process/internal-notes.** This folder cites no private note and carries no private detail.

## Standards retrospective (proposed)

Done mechanically over the Decisions above. Nothing has been built yet, so there is no As built deviation and no red check to list.

1. **R1-1**, in `agent-os/standards/scripts/bash-conventions.md`. It is missing from the standards: line 5 covers scripts, not workflow run blocks. Add a new bullet directly after line 30 (the #17 bullet):
   "- A workflow `run:` block whose exit status rides on a pipe opens with `set -euo pipefail`, as a script does: GitHub runs a step with no `shell:` as `bash -e`, without pipefail, so the advisory shellcheck step's `shellcheck ... | sed ...` exited with sed's status and passed on every finding, and on a runner with no shellcheck (#47, R1-1)"
2. **R1-2**, in `agent-os/standards/scripts/bash-conventions.md`, line 30 (the #17 bullet). Drafted for the person's decision, option (2). The bullet says the severity is at warning but not where it is set, and #17 set it in a place shellcheck does not read. In line 30, replace the bullet's closing words "at severity warning, advisory until its first clean pass, and every code `.shellcheckrc` disables names the line that needs it (#17)" with:
   "at severity warning, set by `-S warning` on the workflow's command, advisory until its first clean pass, and every code `.shellcheckrc` disables names the line that needs it (#17). `.shellcheckrc` holds no severity: shellcheck 0.11.0 ignores a `severity=` key there and honours `-S`, so a severity in the rc file reads as set and is not (#47, R1-2)"
   The rest of line 30 is unchanged. Item 1's new bullet still goes directly after it.
3. The R1-1 mechanism decision (a line in the block over `shell: bash`) is covered by item 1's wording. R1-2's choice of the flag with the rc line removed, over the flag beside the rc line, is covered by item 2's wording. The decision to leave the other run blocks, the #17 As built line, and R1-2's intended severity teach no rule.
4. `testing/tests`, `process/standards-retrospective`, `prompts/attribution`, `process/internal-notes`, `index.yml`: no changes. No pattern is invented outside `agent-os/standards/`.

If the standards approver declines items 1 and 2, record "Standards retrospective: no changes" under Decisions instead.
