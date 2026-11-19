# Place findings inline on a file whose patch the files listing omits (#96)

Spec folder: `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/`

## Context

`post-review` runs `place_comments` in `scripts/redline-gh.sh`, which takes a file's hunks only from the `patch` field of GitHub's pull-request files listing. GitHub leaves `patch` out of a file whose patch is over about 100 KiB, so every finding on such a file (here: `workflows/redline-loop.js`, `tests/loop-test.mjs`, a spec's `standards.md`) goes into the review body under "Not placed inline", gets no thread, and is answered by a pull-request comment quoting its marker. Since #93 the thread is where a decline is overruled, so the files that change most in a long review are the ones that lose it. Issue #96 is the brief; the earlier investigation is in `agent-os/specs/2026-11-15-0730-68-gate-result-sized-for-the-workflow/shape.md`, "Reported, not built".

Outcome: a finding on a patch-less text file is placed inline and gets a thread; a finding that still cannot be anchored stays in the body, under one line that says why.

## Decisions made before shaping (not reopened)

1. Measure first, on a throwaway pull request, and record it in the spec.
2. When the listing gives no patch for a text file a finding names, `place_comments` gets that file's hunks another way and the finding is placed inline.
3. A finding that still cannot be anchored keeps today's behaviour, and the review body says why in one line per cause.
4. A gh-test fixture with a patch-less text file is seen red first; a binary file gets its own case; every other placement case in `tests/gh-test.sh` stays as it is.
5. The README's Known limits line is narrowed to what remains.
6. Runs in flight and older rounds are not rewritten; `prior-findings` still reads marker comments and their replies.
7. Version: a patch, 0.4.2 to 0.4.3, no template change.
8. `scripts/redline-guard.sh` and `hooks/hooks.json` untouched. The guard decides a `redline-gh.sh` call by its subcommand and none is added, so no guard row is needed.
9. CI's shellcheck command before the first commit and after the last: `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`.
10. No AI attribution anywhere. The author makes every commit.

## The measurement (2026-11-19)

Read-only, on merged pull requests of this repository:

- The listing's limit is per file and on the patch's size, about 100 KiB: a 101,452-byte patch is listed (#94, `...93-verify-facts-shaper-decides/standards.md`) and an added file of 104,029 bytes is not (#108, `...99-call-decision-states-its-disposition/standards.md`). Patch-less on #94: `workflows/redline-loop.js` (+971 -336), `tests/loop-test.mjs` (+1004 -205), one `standards.md`. On #97: the same two and two `standards.md`. On #108: one `standards.md`. On #103: none.
- #103 and #108 moved findings on `workflows/redline-loop.js` for another cause: the file had a patch, and R2-8 (`:3771`), R3-1 (`:181`) and R3-2 (`:2652`) name lines outside its hunks. #103's R1-4 names a file the pull request does not change. This change gives those a cause line and does not place them.
- The whole-pull-request diff (`pulls/<n>`, `Accept: application/vnd.github.diff`) carries the hunks of the patch-less files: #97 gives 128 files, 1,713,553 bytes; #94 as merged gives 206 files, 21,316 lines, 2,587,705 bytes.
- `git diff <merge base> <head>` run locally is byte-identical to that diff on #97 and on #111.
- The compare endpoint takes no path, and its listing drops more patches than the files listing (18 against 4 on #97; its limit is cumulative).
- The file's two blobs diffed with `git diff --no-index` give GitHub's 68 hunks for `workflows/redline-loop.js` on #97; plain `diff -U3` gives 67. A local diff has to be git's.
- In the listing a binary file has `changes` 0 and a patch-less text file has `changes` above 0.

On the throwaway draft pull request #111 (`throwaway/96-head` into `throwaway/96-base`), one single-comment review per case, event `COMMENT`:

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

What it shows: GitHub accepts a comment on an added, removed or context line of a patch-less file and it opens a thread, so #96's premise holds. The whole diff answered at 25,044 lines and 1.5 MB, so no size limit of that endpoint was found. There is a second limit, GitHub's own: between 289,607 B / 3,020 lines (accepted) and 1,254,292 B / 22,008 lines (refused) GitHub stops taking any comment on the file, the refusal names the file, and one such comment fails the whole review.

#111 is closed. Its branches stay until Task 6 has used them.

## Shaping answers (each asked and answered 2026-11-19)

**a. Act on the too-large refusal, with a fallback.** No guessed threshold. On a 422 naming `Diff entry <path> diff is too large`, `post-review` moves that file's comments into the body with their cause and posts again, at most once per file whose hunks came from the new sources. The author's rider: when a 422 cannot be tied to a file, post once more with only the comments on files the listing gave a patch for (today's behaviour) and say so in the review body. The posts are bounded, and a round never fails to post because of the new path. A gh-test case covers the refusal and the fallback.

**b. Whole-pull-request diff, then local git.** In order: the listing's patch, at no extra call; the whole diff, one call however many patch-less files, only when a comment names a patch-less text file and the listing counts 300 files or fewer; local `git diff <merge base> <head>` for that path when the pull request is over 300 files or the whole diff is refused, one small call for the two shas; otherwise "the patch could not be had". No blob route, no compare endpoint.

**c. The real pull request is #111 posted through the built script, plus a replay of #94.** After the build #111 is reopened and `post-review` posts one review with a comment per cause; then `place` (read-only) replays #94's recorded round 9 (seven comments on `workflows/redline-loop.js`, none placed at the time; five are inside the merged diff's hunks, two are not). The self-review of this change's own pull request is recorded too, whatever it shows.

**d. Correct the two stale texts; the workflow does not change.** `agents/redline-github.md` (its post-review paragraph) and `skills/redline/SKILL.md` (step 7's over-300-files warning) are corrected. `workflows/redline-loop.js`, `tests/loop-test.mjs`, the reply routes, `prior-findings` and the shape of `moved` stay as they are. **The self-review will report agent drift for `agents/redline-github.md`; that is expected.**

Answered from the brief, not asked: no visuals; references are the #68 spec's report and the placement code of #33; product alignment is `agent-os/product/mission.md` (the round's review is where each item is decided, in its thread); standards as listed under Task 1.

## Design

All in `scripts/redline-gh.sh`. `diff_positions`, the jq of `place_comments` and the output keys `{body, comments, moved}` are reused; `moved` keeps `[{id, path, line, side}]` in the review's comment order.

**Which files need a source.** From the listing already in hand: a comment's file is *wanted* when its entry has `patch` null and `changes` above 0. With no wanted file nothing new is called, so a pull request without one costs what it costs today.

**Source 1, the whole diff.** `gh api "repos/{owner}/{repo}/pulls/<n>" -H "Accept: application/vnd.github.diff"` into a temp file, when the listing has 300 files or fewer. An awk pass splits it on `diff --git`, reads each section's path from its `+++ b/` line (`--- a/` for a removed file) while still in the section's header, and writes the wanted files' hunks in the stream `diff_positions` already reads (`@@@redline-file<TAB>path`, then the hunks). A refused call is not an error: source 2 is tried.

**Source 2, local git.** For wanted files still without hunks: `gh api "repos/{owner}/{repo}/pulls/<n>" --jq '.base.sha, .head.sha'`, both commits checked with `git cat-file -e`, `git merge-base`, then per file `git diff` with the flags pinned (`--diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M --no-color --no-ext-diff --no-textconv --src-prefix=a/ --dst-prefix=b/`), the previous name added to the pathspec for a rename. Any failure leaves the file without hunks.

**The positions** are the listing's patches plus the recovered hunks, through the same awk, into the same temp file (megabytes never reach a command line, `scripts/bash-conventions`).

**Causes.** Each moved comment gets one of:

| Cause | When | Line in the body |
| --- | --- | --- |
| not in the pull request | the path is not in the listing | `The file is not in this pull request:` |
| line not in the diff | the file has hunks (listing or a source) and the line is outside them | `The line is not in the pull request's diff:` |
| binary | `patch` null, `changes` 0, not a rename | `The file is binary and has no hunks:` |
| renamed only | `patch` null, `changes` 0, status renamed | `The file was renamed with no text changes and has no hunks:` |
| too large | GitHub refused the post naming the file | `GitHub takes no comment on a diff this large:` |
| patch could not be had | wanted, and neither source gave hunks | `The file's patch could not be had from GitHub's listing, its whole diff or this clone:` |
| refused | the fallback of answer a | `GitHub refused a review that placed these inline (<its message>), so they are here:` |

**The body.** Comments are grouped by cause in the table's order, each group under its one line, the comments of a group in the review's order. Every existing assertion in `tests/gh-test.sh` still holds: the heading is followed by a blank line, and a marker is still followed by its path line, a blank line and the comment.

```
<the review's body>

### Not placed inline

The line is not in the pull request's diff:

<!-- redline:R1-3 -->
`app/Models/Order.php:30`

**R1-3** · nit · low · confirmed

<the comment>

The file is binary and has no hunks:

<!-- redline:R1-4 -->
`public/build/app.js:1`

**R1-4** · ...
```

**The post.** `post-review` places, then posts. On a failure whose response is a 422:

1. an error `Diff entry <path> diff is too large` whose path is a file placed from a source: that file joins the too-large set, the review is placed again and posted again;
2. any other 422 while at least one comment is inline through a source: the review is placed once more from the listing's patches only, the comments on patch-less files go to the body under the refused line with GitHub's message, and it is posted again;
3. anything else, or a failure of the fallback post: GitHub's message on stderr and exit 1, as today.

At most one post per source-placed file plus one fallback. With no comment placed through a source, a 422 is today's failure with a single post. A refused post posts nothing (case 9), so posting again cannot duplicate. gh's own stderr for a handled refusal is held back and replaced by one line (`redline-gh.sh: GitHub takes no comment on <path>; posting again with its comments in the review body`); exit 0. `place`, being read-only, cannot know the too-large cause; its header says so.

The header's "nothing here retries" is amended to name these two cases, and the `place` and `post-review` entries are rewritten; `docs/scripts.md` quotes the header and moves in the same commit.

Out of scope: the `diff` subcommand still prints `(no patch: ...)` for a patch-less file, so what the reviewer reads does not change.

## Tasks

The slices share `scripts/redline-gh.sh` and `tests/gh-test.sh`, so each is built, shown red then green, and handed over as an exact file list for one commit before the next starts. Nothing is staged or committed by the session.

### Task 1: Save spec documentation

Run decision 9's shellcheck command first. Create the spec folder with `plan.md` (this plan), `shape.md` (scope, the ten decisions, the measurement above in full, answers a to d with their dates and "Decided by: the author", context, standards applied), `standards.md` (full text of: scripts/bash-conventions, scripts/guard, testing/tests, workflow/agents, workflow/replay, process/docs-gate, process/release, process/standards-retrospective, process/internal-notes, prompts/attribution) and `references.md` (`place_comments`, `diff_positions`, `pr_files` and `post-review` in `scripts/redline-gh.sh`; the place cases and the shim in `tests/gh-test.sh`; the #68 spec's report; #33's placement). No `visuals/`.

Commit 1: the spec folder.

### Task 2: The whole diff as a source, and the cause lines

Red first. In `tests/gh-test.sh`: the shim learns `-H` with the diff media type on `pulls/<n>` (serves `$PAGES/diff-<n>.txt`, else answers GitHub's 406) and logs every call to `$PAGES/api.log`; PR 20's listing and whole diff are generated in the harness as PR 7's and PR 9's are (a text file with `patch` null and a diff section over 100 KiB, a binary with `changes` 0, a small file with a patch). New cases, run and seen failing before the script changes:

- a comment on an added, a removed and a context line of the patch-less text file stays inline (the red one);
- the binary file, a case of its own: moved, under the binary line, and no diff call when it is the only patch-less file named;
- one review with a comment per cause: the body's full layout, group order, and `moved` in comment order;
- call counts from `api.log`: no diff call when no comment names a wanted file (PR 7's two reviews), exactly one with two wanted files.

Then the build: the wanted set, source 1, the causes and the grouped body. PR 7's and PR 9's cases are not edited and stay green. Header and `docs/scripts.md` updated.

Commit 2: `scripts/redline-gh.sh`, `tests/gh-test.sh`, `docs/scripts.md`.

### Task 3: Local git as the second source

Red first: PR 21, a generated listing of 301 files with one wanted text file; the harness's throwaway repository gets a base and a head commit that change it; the shim serves `pulls/21` with those shas. Cases: over 300 files no diff call is made and the comment is placed from the clone; a rename places with its previous name; with shas the clone does not hold, the comment is moved under the could-not-be-had line; on PR 20 with the whole diff refused (406), the clone is used.

Commit 3: `scripts/redline-gh.sh`, `tests/gh-test.sh`, `docs/scripts.md`.

### Task 4: The refusal and the fallback in `post-review`

Red first: the shim answers the review POST for PR 20 only (every other write is still refused), logs each payload, refuses with GitHub's measured 422 bodies by a scripted rule, and serves the posted comments back. Cases:

- too large: two posts, the second without that file's comments; `moved` and the body's too-large line; exit 0; the one stderr line;
- a 422 that names no file: two posts, the second from the listing's patches only, the refused line with GitHub's message in the body; exit 0;
- the fallback refused as well: exit 1 with GitHub's message, three posts at most;
- the neighbour that must not change: a 422 on a review with nothing placed through a source is one post and exit 1.

Commit 4: `scripts/redline-gh.sh`, `tests/gh-test.sh`, `docs/scripts.md`.

### Task 5: The texts and the version

- `agents/redline-github.md`, the post-review paragraph: the hunks come from the listing, else from GitHub's whole diff or the clone; each moved comment sits under a line saying why; a refusal the script handled and posted past (exit 0) is not an error. Nothing else in the file.
- `skills/redline/SKILL.md`, step 7: the over-300-files warning is narrowed (the hunks of a patch-less text file then come from the clone; a binary file, or one GitHub takes no comment on, goes in the body).
- `README.md`, Known limits: the line becomes a binary file, and a file whose diff is past GitHub's own comment limit (measured between 290 KB and 1.25 MB of diff), with the cause lines named; the over-300-files-without-the-commits case in one clause.
- `docs/running.md`: the launch paragraph, step 1's last sentence and "How the review is posted".
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: 0.4.3.

Commit 5: those seven files.

### Task 6: Evidence on real pull requests

- The session reopens #111 (`gh pr reopen 111`) and runs the built `scripts/redline-gh.sh post-review 111 <file>` on a review file kept in the scratchpad: `mid.txt:1500` (inline, thread), `mid.txt:500` (line not in the diff), `huge.txt:5000` (refused once, then too large), `blob.bin:1` (binary), `README.md:1` (not in the pull request), `small.txt:10` (inline). `threads 111` confirms the threads. #111 is closed again. The author then deletes `throwaway/96-base` and `throwaway/96-head`, remote and local.
- `scripts/redline-gh.sh place 94 agent-os/specs/2026-11-15-0822-94-review-round-9/redline/round-9-review.json`: expected five inline and two under the line-not-in-the-diff line, against none placed at the time.
- Both results are recorded in `shape.md`, as measured, whatever they show.

### Task 7: Verification Gate

`.claude/redline/checks.sh --baseline` until green, then decision 9's shellcheck command again after the last commit. Then:

- **Docs (step 10).** `scripts/redline-gh.sh`: `docs/scripts.md` (the quoted header), `docs/running.md` "How the review is posted", README Known limits; commits 2 to 5. `agents/redline-github.md`: `docs/running.md` "How the review is posted"; commit 5. `skills/redline/SKILL.md`: `docs/running.md`, the launch paragraph; commit 5. `.claude-plugin/plugin.json` and `marketplace.json`: no reader-facing change, the CHANGELOG entry is a person's step at tag time. No new subcommand, config key, allow rule or exit code.
- **Version (step 11).** 0.4.3 in both files; no template marker moves.
- **Standards retrospective (step 12).** Listed mechanically and put to the author with AskUserQuestion; approved edits land in their own commit. Known candidates: `scripts/bash-conventions.md`, the line saying `redline-gh.sh` never reads the whole-pull-request diff (now: never `gh pr diff`, and the diff media type only as the second source for a patch-less file at 300 files or fewer); a line on when a write may post again (a refusal tied to the new path, bounded, never a retry of the same request); `testing/tests.md`, the gh-test entry (PR 20, PR 21, the one review POST the shim answers).
- **Spec folder (step 13).** `plan.md` gains "As built"; deviations go under Decisions in `shape.md`.

Commit 6: the spec folder as built. Commit 7, if any: the standards edits.

## Verification

- `tests/gh-test.sh` prints `N passed, 0 failed`, each new case having been seen red; the PR 7 and PR 9 placement cases are byte-for-byte as they were.
- `.claude/redline/checks.sh --baseline` is green; shellcheck is clean before commit 1 and after the last.
- On GitHub: the review posted on #111 shows a thread on `t96/mid.txt` and the four cause lines in its body; the replay of #94's round 9 prints five inline comments.
- Later, by the author: the Redline self-review of this change's pull request, which will report agent drift for `agents/redline-github.md`.
