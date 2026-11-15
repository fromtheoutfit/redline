# Issue #68: the gate's printed result is sized for the workflow — Shaping Notes

## Scope

Issue #68 and its comment are the brief, shaped as a follow-up on PR #94's branch. `checks.sh` prints one JSON object and the checker can return it only when the Bash tool shows it inline. On PR #94 the result reached 30 to 31 KB twice (round 3, then round 5 of a fresh run), the tool saved it to a file, the checker may read no file, and the run stopped at `check` with a gate that had passed.

Built here:

- The printed result depends on neither the pull request's size nor the run's length: counts for the allowed and changed files, this round's commits only, no output for a passing check, a shared budget for the failing ones, ANSI escapes stripped before any cap.
- A budget, pinned by two synthetic runs in `tests/setup-test.sh` and written out in the template's comment: under 10 KB passing, under 25 KB with every check failing.
- A kept result outside the working tree and a `--verdict` mode, so a result that still spills does not stop a round whose gate passed.
- Template v3. The plugin's version stays 0.3.0.

Not built: inline placement for a file whose patch GitHub's files listing omits. Reported under "Reported, not built" below.

## Decisions

Made by the author before shaping, not reopened:

- The goal is that the gate's printed result no longer depends on the pull request's size or the run's length.
- Size the result for what the workflow reads, not for a person. A passing check needs its name, its exit code and whether it was recorded; a failing check keeps its capped output. The git block gives counts for allowed and changed files and keeps `unexpected_files` and `uncommitted` in full.
- The commits list is read by the workflow, so its form is found from its uses and asked.
- ANSI escapes are stripped before any cap is measured.
- The budget: a passing result for a 300-file pull request with 100 commits since the start stays under 10 KB, the worst case with every check failing under 25 KB; `tests/setup-test.sh` pins both and the arithmetic is in the template's comment.
- A result that still spills must not stop a round whose gate passed. `scripts/redline-guard.sh` and `hooks/hooks.json` do not change without asking. They do not change here.
- The change is in `scripts/checks-template.sh`, its version raised; this repository's `checks.sh` is regenerated and restamped, never edited by hand.
- The workflow's schema for the checker's result, the checker's agent file, `docs/contract.md` and `docs/scripts.md` follow the new keys.
- The version stays 0.3.0: this is the same pull request, already a minor bump over main's 0.2.4. The gate's Version step allows a pull request whose spec keeps the version on purpose; this is that record.
- The author makes every commit.

Made during shaping, each asked and answered on 2026-11-15:

1. **Commits: this round only.** Offered: this round only (recommended); every commit since the start with the subject cut; every sha since the start with subjects for this round only. The workflow reads `git.commits` in four places (`judge()`'s `redline:` prefix check and its id check, `revise()`'s filter for commits it does not know yet, and the reply and handoff text built from those), and none needs a commit older than the previous round's check. The round snapshot gains `round_sha`: the newest commit an earlier round's check listed, or `start_sha`. `commits` lists `round_sha..HEAD` and `commits_count` counts `start_sha..HEAD`.
   Decided by: the author.
2. **The subject is cut at 100 characters, and ids past the cut are rescued.** The author's rider on decision 1 asked for a fixed cut that keeps the finding id, on the premise that the id sits at the start. It does for a finding's own commit; 12 of this repository's 373 `redline:` subjects name an id past column 72 (eleven standards commits, `...finishing R1-1, R1-4 and R1-8`, and one fix commit naming a second finding at column 124). Offered: cut at 100 with a rescue (recommended); cut at 72 with a rescue; a plain cut at 100; ids first in the standards subject with a plain cut. Chosen: the cut falls at the last space at or before 100, so no id is split into a different one, then `...`, then every finding id in the part cut off. The author's riders: the rescue matches every form of id the workflow looks for, `R<round>-<n>` and `H<n>-<k>`, and a test covers a subject whose only mention of an id is past the cut, proven red with the rescue removed.
   Decided by: the author.
3. **`round_sha` stays the round's starting commit on a resumed attempt**, so the commits a failed attempt made are still listed and checked; the loop test covers it. It holds by construction: a round's commits join `commitsAll` only after its check passes.
   Decided by: the author (rider on decision 1).
4. **The spill fallback is a kept result and `--verdict`.** Two facts from the guard decide what is possible without changing it: the checker can read no file at all (`Read` is off in its agent file and the guard refuses it `cat`), and it may run the repository's `checks.sh` with any flags (`scripts/redline-guard.sh`, the `checks.sh` branch of the script rule). Offered: a kept result and `--verdict` (recommended); a `--git-only` reread that trusts the exit code the checker reported; a guard change. Chosen: every run also writes its full result to a file, `checks.sh --verdict` runs no check and prints the smallest form of it, and on `spilled` the workflow sends the checker that one command and judges from the script's own verdict.
   Decided by: the author.
5. **Where the kept result lives.** Outside the working tree, at `${TMPDIR:-/tmp}/redline-checks/<root key>-<head sha>.json`, keyed by the repository's root and the commit it was produced at, overwritten by each run. Two worktrees of one repository must not read each other's: the root key is `git hash-object` of the physical path of the top level. A kept result for another commit is never read: HEAD moved is exit 2 and the round stops as today, with a test. The template's comment says all of this.
   Decided by: the author (rider on decision 4).

Made while planning, small enough not to ask, shown to the author in the plan and approved with it:

6. A passing check prints `name`, `exit` and `recorded`, nothing else. Its output is in the kept result.
7. No sample of the allowed or changed files: counts only; the full lists are in the kept result.
8. `formatter_touched_outside_pr` becomes `formatter_touched_count` in the printed result. The workflow never reads it, and a file it would name also shows under `unexpected_files`.
9. A failing check's `cmd` is cut at 120 characters.
10. stderr counts toward what the tool shows, so the progress lines name the check and drop its command, and the two failure lines give counts.
11. The test of the rescue is permanent: a template copy with the rescue line removed must lose the id.

## Reported, not built: why rounds 4 and 5 of PR #94 placed no finding inline

Asked for with the brief, as a report only. It is a limit of Redline's, not GitHub refusing the diff.

- The record: `agent-os/specs/2026-11-14-1509-94-review-round-4/redline/round-4-review.json` holds 12 comments (11 on `workflows/redline-loop.js`, one on `skills/redline-revise/SKILL.md:19`) and `round-5-review.json` holds 10, all on `workflows/redline-loop.js`. The posted reviews carry no inline comment; the comments are in the bodies under "Not placed inline".
- The cause: `post-review` runs `place_comments` in `scripts/redline-gh.sh`, which takes a file's hunks only from the `patch` field of GitHub's pull-request files listing. On 2026-11-15 that listing returns no `patch` for `workflows/redline-loop.js` (958 changed lines, 152 KB of diff) or `tests/loop-test.mjs` (921 lines, 252 KB). Every other of the 133 files has one, the largest 101 KB, including a file listed after `tests/loop-test.mjs`, so the omission is per file.
- GitHub has the hunks: `gh pr diff 94` returns all 133 files, with 82 hunks for `workflows/redline-loop.js` and 47 for `tests/loop-test.mjs`. `place` does not look there because the whole-diff endpoint refuses a pull request over 300 files.
- It is not new in rounds 4 and 5: rounds 1 to 3 moved 16 of 16, 14 of 14 and 8 of 8 of their `workflows/redline-loop.js` comments into the body. The pull request's only inline comments are the five on other files. Rounds 4 and 5 had no finding outside that file, except R4-1, on a file the pull request does not change.
- The replies followed by design: no inline comment, so no thread, so a pull-request comment quoting the marker.
- Not verified: that GitHub accepts a review comment on those lines. Redline never sent one.
- The README lists the behaviour under Known limits ("A file whose patch GitHub omits anchors nothing"); no open issue covers it. A follow-up issue is the author's to open.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Fixes go through the repository's own planner": each round runs the repository's gate and acts on its result. This spec keeps that result readable on a long run; no roadmap item moves.

## Standards Applied

- scripts/bash-conventions — the header is the documentation and `docs/scripts.md` quotes it; one JSON object on stdout, progress on stderr, usage errors exit 2; the line on `checks.sh`'s JSON staying bounded is the one this spec extends.
- testing/tests — `tests/setup-test.sh` and `tests/loop-test.mjs` gain a case with every change, red before green; the checker's result shape is scripted per call in the loop test.
- scripts/guard — no guard change; `tests/guard-cases.tsv` gains rows pinning the two decisions the fallback rests on.
- workflow/agents — the checker relays and never judges; a result it could not read has a distinct status and a fixed reason.
- workflow/replay — the snapshot prompt stays byte-identical on a relaunch; the verdict call is a new call only after a spilled result, and no prompt reads the clock.
- process/release — the template marker moves with the template's body; the version is kept on purpose and recorded.
- process/docs-gate — each touched plugin file names its `docs/` section in the plan.
- process/standards-retrospective — the gate's last step.
- process/internal-notes — no design record is copied in; the measurements above are this pull request's own.
- prompts/attribution — nothing posted or committed carries a model or vendor name.
