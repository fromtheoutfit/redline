# #96: place findings inline on a file whose patch the files listing omits — Shaping Notes

## Scope

Issue #96. `post-review` runs `place_comments` in `scripts/redline-gh.sh`, which takes a file's hunks only from the `patch` field of GitHub's pull-request files listing. GitHub leaves `patch` out of a file whose patch is over about 100 KiB, so every finding on such a file went into the review body under "Not placed inline", with no thread. This spec gets those hunks another way, so the finding is placed inline and gets a thread like any other, and gives every finding that still cannot be anchored one line in the review body saying why.

Out of scope: the `diff` subcommand, which still prints `(no patch: ...)` for a patch-less file, so what the reviewer reads does not change. `workflows/redline-loop.js`, `tests/loop-test.mjs`, the reply routes and `prior-findings`. `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`, `.claude/redline/checks.json`, everything under `templates/` and the Verification Gate's text.

## Decisions

Given with the brief, not reopened:

1. Measure before building, on a throwaway pull request on this repository, and record the measurement here. If GitHub refuses, stop before planning anything else.
2. When the files listing gives no patch for a text file a finding names, `place_comments` gets that file's hunks another way, and the finding is placed inline and gets a thread like any other.
3. A finding that still cannot be anchored keeps today's behaviour, and the review body says why in one line for each cause: the file is binary and has no hunks, the patch could not be had, the line is not in the diff, or the file is not in the pull request at all (seen on #103, R1-4).
4. A gh-test fixture with a patch-less text file is seen red first, and a binary file gets a case of its own. Every other placement case in `tests/gh-test.sh` stays as it is.
5. The README's Known limits line is narrowed to what remains, or removed if nothing remains.
6. Runs in flight and older rounds are not rewritten: a finding an earlier round left in the review body keeps its marker comment and its replies, and `prior-findings` still reads them.
7. The version follows the release standard: patch, 0.4.2 to 0.4.3, with no template change.
8. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched. The guard decides a `redline-gh.sh` call by its subcommand (the `gh-read` and `gh-all` lists) and no subcommand is added, so the new reads need no guard row.
9. CI's shellcheck command runs before the first commit and after the last: `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`.
10. No AI attribution anywhere. The author makes every commit.

Answered during shaping (2026-11-19):

11. **The too-large refusal is acted on, with a fallback.** The measurement found a limit of GitHub's own past which it takes no comment on a file (below). Offered: act on the refusal (recommended); bisect the limit and pre-check; both; leave the post failing. Chosen: no guessed threshold. When the review's post is refused with a 422 naming `Diff entry <path> diff is too large`, `post-review` moves that file's comments into the body with their cause and posts again, at most once per file whose hunks came from the new sources. The author's rider: when a 422 on the review cannot be tied to a file (the message changes, or names none), post again with only the findings on files the listing gave a patch for, which is today's behaviour, and say so in the review body. The retries are bounded, and a round never fails to post because of the new path. A gh-test case covers the refusal and the fallback.
    Decided by: the author.
12. **The hunks come from GitHub's whole-pull-request diff, then from local git.** Offered: whole diff then local git (recommended); local git first; whole diff then the two blobs; all three. Chosen, in order: the listing's patch, at no extra call; the whole diff, one call however many patch-less files, made only when a comment names a patch-less text file and the listing counts 300 files or fewer; local `git diff <merge base> <head>` for that path when the pull request is over 300 files or the whole diff is refused, one small call for the two shas, the diff flags pinned so the user's git config cannot move a hunk; otherwise the comment goes in the body with "the patch could not be had". No blob route (one megabyte-sized compare call and two contents calls per file, for a pull request over 300 files in a clone without the base commit, which no run on record has hit) and no compare endpoint (measured unusable).
    Decided by: the author.
13. **The real pull request is #111 posted through the built script, and a replay of #94.** Offered: post on #111 and replay #94 (recommended); this change's own self-review; the replay only; the next run that hits it. Chosen: after the build #111 is reopened and `post-review` posts one review there with a comment per cause; then `place`, read-only, replays #94's recorded round 9. The self-review of this change's own pull request is recorded too, whatever it shows.
    Decided by: the author.
14. **Two stale texts are corrected; the workflow does not change.** Offered: correct the two texts (recommended); leave the agent file alone; carry the cause to the handoff's warning. Chosen: `agents/redline-github.md` (its post-review paragraph) and `skills/redline/SKILL.md` (step 7's over-300-files warning). The workflow's closing line, its two warnings and the issue-comment reply route stay true as written; `movedToBody` stays a list of ids and the script's `moved` keeps `[{id, path, line, side}]`. The self-review will report agent drift for `agents/redline-github.md`; that is expected.
    Decided by: the author.

Made while planning, shown to the author in the plan and approved with it:

15. A file's cause is read from the listing where the listing can tell: `patch` null with `changes` 0 is a binary file, or, with status renamed, a rename with no text changes, and neither costs a call. A rename with no text changes gets a cause line of its own.
16. The body groups the moved comments by cause, each group under its one line, in a fixed order; the comments of a group keep the review's order, and `moved` keeps the review's comment order.
17. gh's own stderr for a refusal the script handles is held back and replaced by one line, and the exit code is 0.
18. `place`, being read-only, cannot know the too-large cause; its header says so.

## The measurement (2026-11-19)

Read-only, on merged pull requests of this repository:

- The listing's limit is per file and on the patch's size, about 100 KiB: a 101,452-byte patch is listed (#94, `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/standards.md`) and an added file of 104,029 bytes is not (#108, `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/standards.md`). Patch-less on #94: `workflows/redline-loop.js` (+971 -336), `tests/loop-test.mjs` (+1004 -205) and one `standards.md`. On #97: the same two and two `standards.md`. On #108: one `standards.md`. On #103: none.
- #103 and #108 moved findings on `workflows/redline-loop.js` for another cause: the file had a patch, and R2-8 (`:3771`), R3-1 (`:181`) and R3-2 (`:2652`) name lines outside its hunks. #103's R1-4 names `templates/shape-spec-unattended.md`, a file that pull request does not change. This spec gives those a cause line and does not place them.
- The whole-pull-request diff (`pulls/<n>` with `Accept: application/vnd.github.diff`) carries the hunks of the patch-less files: #97 gives 128 files and 1,713,553 bytes; #94 as merged gives 206 files, 21,316 lines and 2,587,705 bytes.
- `git diff <merge base> <head>` run locally is byte-identical to that diff on #97 (1,713,553 bytes each) and on #111 (1,544,246 bytes each), with git 2.54.0 and no diff setting in the configuration.
- The compare endpoint takes no path, and its listing drops more patches than the files listing: 18 files without a patch on #97 against 4, the later files in path order, so its limit is cumulative. Its response for #97 is 1,357,445 bytes.
- The two blobs of `workflows/redline-loop.js` on #97 (contents API, raw, at the merge base and the head) diffed with `git diff --no-index` give GitHub's 68 hunks; plain `diff -U3` gives 67. A local diff has to be git's.
- In the listing a binary file has `changes` 0 and a patch-less text file has `changes` above 0.

On the throwaway draft pull request #111 (`throwaway/96-head` into `throwaway/96-base`, four files under `t96/`), one single-comment review per case, event `COMMENT`:

| Case | File | In the listing | In the whole diff | Comment | GitHub |
| --- | --- | --- | --- | --- | --- |
| 1 | `t96/small.txt` | patch, 108 B | 13 lines | RIGHT 10 | accepted, thread |
| 2 | `t96/mid.txt` | no patch (+1501 -1501) | 3,020 lines, 289,607 B | RIGHT 1500, added | accepted, thread |
| 3 | `t96/mid.txt` | | | LEFT 1500, removed | accepted, thread |
| 4 | `t96/mid.txt` | | | RIGHT 98, context | accepted, thread |
| 5 | `t96/mid.txt` | | | RIGHT 500, outside every hunk | 422 `Line could not be resolved` |
| 6 | `t96/huge.txt` | no patch (+11000 -11000) | 22,008 lines, 1,254,292 B | RIGHT 5000, added | 422 `Diff entry t96/huge.txt diff is too large` |
| 7 | `t96/blob.bin` | no patch, `changes` 0 | `Binary files ... differ` | RIGHT 1 | 422 `Line could not be resolved` |
| 8 | `README.md` | not in the pull request | | RIGHT 1 | 422 `Path could not be resolved` |
| 9 | `mid.txt` and `huge.txt` in one review | | | RIGHT 100, RIGHT 11002 | 422 `Diff entry t96/huge.txt diff is too large`, nothing posted |

`threads 111` lists four threads, one per accepted comment.

What it shows:

- GitHub accepts a review comment on an added, a removed or a context line of a file whose patch the listing omits, and the comment opens a thread like any other. The premise of #96 holds.
- The whole-pull-request diff answered for #111 at 25,044 lines and 1.5 MB with a 22,000-change file in it, and for #94 at 2.6 MB, so no size limit of that endpoint was found.
- There is a second, larger limit that is GitHub's own: past it GitHub takes no comment on the file, whatever supplies the hunks. It lies between 289,607 B / 3,020 lines (accepted) and 1,254,292 B / 22,008 lines (refused). The refusal names the file, and one such comment fails the whole review with nothing posted.
- The refusals have three messages: `Path could not be resolved` (the file is not in the pull request), `Line could not be resolved` (the line is outside the hunks, and a binary file), `Diff entry <path> diff is too large`.

#111 was closed after the measurement and is reopened for the evidence below.

## Evidence on real pull requests

(filled by Task 6)

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Every verified item is decided, and the real decisions stay with people": a decision is answered, and a decline overruled, in the item's thread, which a finding left in the review body does not have. No roadmap item moves.

## Standards Applied

- scripts/bash-conventions — the header is the documentation and `docs/scripts.md` quotes it; a value that grows with the pull request reaches `jq` and `awk` through a temp file; the line saying `redline-gh.sh` never reads the whole-pull-request diff is the one this spec changes, in the retrospective.
- scripts/guard — no guard change and no new subcommand, so no row.
- testing/tests — `tests/gh-test.sh` gains a case with every change to `place` and `post-review`, red before green; a fixture is made large enough to hit the limit it guards.
- workflow/agents — a degraded result is data, not an error; a rule the agent file states is corrected where it is stated.
- workflow/replay — no workflow prompt changes, so every prompt replays as it was.
- process/docs-gate — each touched plugin file names its `docs/` section in the plan.
- process/release — a patch bump in both manifests; no template marker moves.
- process/standards-retrospective — the gate's last step.
- process/internal-notes — no design record is copied in; the measurement above is this spec's own.
- prompts/attribution — nothing posted or committed carries a model or vendor name, the throwaway pull request and its reviews included.
