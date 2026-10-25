# Large PRs (#33) and round numbering after posted rounds (#10, first half) — Shaping Notes

## Scope

Issue #33: on a pull request with hundreds of files, `redline-gh.sh files` is capped at 100 paths, GitHub's whole-PR diff endpoint answers 406 over 300 files (which breaks both inline anchoring and the reviewer's round 1 diff), and a review with no inline thread ended the run at `post`. Plus the round-numbering half of #10: a fresh launch on a PR that already has posted Redline rounds numbers its first round after the last posted one and posts its review. The resume-from-error half of #10 stays out.

Shaped by hand with `/agent-os:shape-spec` on 2026-10-24; the person makes the commits and opens the PR.

## Decisions

- **Paginated files.** `files` reads `GET pulls/<n>/files` with `gh api --paginate --slurp`. The precheck cross-checks the count against the local `git diff --name-only origin/<base>...HEAD` and warns on a mismatch, naming the count on each side. (From the issue.)
- **The diff is always synthesized from per-file patches.** Asked 2026-10-24; chosen over a fallback-on-failure and over a local git diff. One header per file (`diff --git a/<f> b/<f>`, `--- a/<f>` or `/dev/null`, `+++ b/<f>` or `/dev/null`, `previous_filename` as the `a/` side of a rename), then the patch verbatim; a file whose patch GitHub omits gets the header and one line `(no patch: binary or too large for GitHub)`. `diff` and `place` share one fetch (`pr_files`), so one code path and one fixture.
- **Anchoring per file** from that file's own patch, never the whole-PR diff. Files without a patch fall back to the body. (From the issue.)
- **Body marker and issue-comment replies.** A comment `place` moves into the body is prefixed with `<!-- redline:<id> -->`, the id parsed from the comment body's leading `**R1-2**`. A later round replies to a body finding with one issue comment per finding whose first line is the marker, then `**R1-2** · `file:line` · from the Redline round N review body`, then the usual reply text. One comment per finding keeps the one-reply-per-finding model.
- **Zero inline threads is a warning, not an error**, in the GitHub agent's instructions and in the loop's `warnings`. The actual failure on #778 was the GitHub agent setting `error` on a posted review with no inline comments; the loop stops on any `posted.error`.
- **Precheck** prints GitHub's file count, warns above 300 (the whole-PR diff is unavailable there; Redline reads per-file patches, and a finding in a file whose patch GitHub omits goes in the body), and refuses above an optional `maxFiles` in `redline.json` with "split the PR". The template `redline.json.example` is unchanged; the README documents the key.
- **First round from args.** The skill runs the new `redline-gh.sh last-round <n>` (the highest posted `Redline round N`, 0 when none) in the precheck and passes `args.firstRound`; the workflow never asks GitHub for it, because every prompt before a stopping point must replay byte-identically (workflow/replay). Every `round === 1` in the loop becomes `round === firstRound`, and the round cap counts from `firstRound`.
- **The gh harness is gate step 8.** Asked 2026-10-24. `tests/gh-test.sh` over `tests/gh-fixtures/` with a fake `gh` on PATH, so the gate edit, `checks.json`, the regenerate, the restamp and the unattended fill-ins all move in one commit, as the testing standard requires.
- **Minimum gh 2.48.0.** `gh api --slurp` arrived in cli/cli v2.48.0 (PR 8620); the script already used it in `review-comments` and `post-review` without saying so. The README's Requirements names the version, and `pr_files` turns `unknown flag: --slurp` into one line naming the installed version and 2.48.0, exit 2, which the precheck relays verbatim.
- **Files without a patch are not read wholesale.** The 56 such files on #778 are built assets, lockfiles and generated code. The reviewer opens one in the tree only when a finding points there.
- **"Guard rows for the new gh api shapes"** is read as rows for the new `redline-gh.sh` subcommand (`last-round`) beside the changed ones; the roles never run `gh` itself.
- Out of scope: resume-from-error (#10 second half), the leftover untracked round folder on #778's branch, `redline-revise`.

## Context

- **Visuals:** None (a CLI plugin; GitHub's rendering of the review body is the only screen).
- **References:** see `references.md`: the hunk walker and move-to-body in `redline-gh.sh`, `has-review`, the loop-test post mock and replay check, the prefs harness, the guard's gh-read rows, and the #778 run record.
- **Product alignment:** `agent-os/product/mission.md` ("Honest about its reach"; "nothing an agent does is hidden from the review thread") and `roadmap.md` Phase 1 (dogfood on Chalkboard, Losers League and this repository; GitHub fixed as the host). The precheck's file count and 300-file warning are the honesty line, the body marker keeps every finding visible on the PR, and #778 is the dogfood PR. Confirmed 2026-10-24.

## Standards Applied

- scripts/bash-conventions — a subcommand added to `redline-gh.sh` joins the guard's `GH_READ` in the same change; the header is the documentation; a read subcommand prints JSON and nothing else; usage errors exit 2
- scripts/guard — every guard change proven by a `guard-cases.tsv` row beside its neighbour
- testing/tests — a tested surface gains a case; red before green; a gate change restamps and regenerates in the same commit
- workflow/replay — the first round number enters through args, never read from GitHub inside the workflow
- workflow/agents — the GitHub agent reports, never works around; prompts name exact command spellings
- process/standards-retrospective — the retrospective at the end of this spec
- prompts/attribution — the issue comments quoting a marker carry no model or vendor name

## Standards retrospective

Applied (for the person's own commit, separate from the code): testing/tests, scripts/bash-conventions, workflow/replay, workflow/agents, process/standards-retrospective; see "As built" in `plan.md` for the lines. scripts/guard and prompts/attribution taught nothing new.

## Deviations

See "As built" in `plan.md`: the `--argjson` overflow found on #778 and its 60,000-line harness case, the awk field-separator fix, three placed comments in the fixture instead of two, `firstRound` in the workflow's result, and the CLAUDE.md step count.
