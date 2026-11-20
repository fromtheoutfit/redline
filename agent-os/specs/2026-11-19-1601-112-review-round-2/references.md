# References for PR #112 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping, at `4c8ed6a`.

## The code under review

### `scripts/redline-gh.sh`

- **Location:** `set -euo pipefail` (183); `pr_files` (254-274), its temp file (261) and its return paths (265, 269, 272); `diff_sections` (304-320); `recover_hunks` (322-381), the comment on its flags (332-335), the `found` reader (361) and the pinned `git diff` (370-373); `diff_positions` (383-402); `place_comments` (404-464), the `recovered` reader (428) and the kinds (429-438); the `place` subcommand (531-545) and its scratch block (536-541); the `post-review` subcommand (698-), its scratch block (707-712), the `sourced` reader (720) and the refusal loop (724-758).
- **Relevance:** R2-1's three readers, R2-2's command and comment, R2-3's two scratch blocks and the `pr_files` call they follow.
- **Key patterns:** the `@@@redline-file` stream both sources write and three readers parse; the scratch folder the `EXIT` trap removes, with `TMPDIR` pointed at it; `env -u GIT_DIFF_OPTS` on the one git call that stands in for GitHub's hunks.
- **Blame:** the scratch blocks are R1-2's (`4563cae`); the `all="$(pr_files "$1")"` lines predate the pull request (`b649acd`).

### `tests/gh-test.sh`

- **Location:** the harness header (1-67), its PR 20 sentence (47-50) and the shim's switches (58-64); `leftover_gh` (90-95); the PR 20 and PR 21 fixtures (109-202): `GEN` and `gen_commit` (124-126), the base and head files (127-147), the shas and the base's later commit (148-155), the hostile `gitconfig` (171-172), the whole diff (173), the PR 20 listing (174-183) and its review files (184-202); the shim's review POST (290-313), its read log (315-316) and its whole-diff route (317-329); the patch-less `place` cases (433-468); the clone cases (470-509), the pinned-configuration and `GIT_DIFF_OPTS` cases (483-486) and the quoted-name case (505-509); the `post-review` cases (511-613) with `fresh_posts`, `posts`, `post_paths` (523-527) and R1-2's leftover cases (600-606).
- **Relevance:** every task adds its cases here, beside these; Task 5 changes the fixture's own git calls (76, 126, 148-153, 173). `git blame`: line 76 predates the pull request (`b649acd`); 126, 148-153 and 173 are its own (`2d3e788`, `86be1bd`, `004a5af`).
- **Key patterns:** a fixture file made in the harness's own repository and committed with `gen_commit`; a review file written with `jq -n` into `$WORK`; a per-case setting passed as a variable before `gh` (`TMPDIR=`, `GH_FAKE_NO_STATUS=1`, `GIT_CONFIG_GLOBAL=`); a fixture swapped and restored (`pull-21.json`, 487-493); a count of the shim's logged calls (`diff_calls`, `sha_calls`).

## The pull request's own spec and round 1

### `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/`

- **Location:** `shape.md`, decision 12 (line 28), the measurement (67-73), with line 70 (the local diff byte-identical to GitHub's with no diff setting) and line 73 (a binary file has `changes` 0).
- **Relevance:** Unattended answers 5, 6 and 9: the pinned flags' stated purpose, the listing as GitHub's verdict that a file is text, and git's defaults as what GitHub serves.

### `agent-os/specs/2026-11-19-1601-112-review-round-1/`

- **Location:** `shape.md`, unattended answers 8 and 9 and decisions 1, 8 and 12; `plan.md`, Tasks 2 and 8 and As built (lines 527-557).
- **Relevance:** R1-4 and R1-2, whose fixes R2-2 and R2-3 complete; the counts this round starts from (`254 passed, 0 failed`); the guard refusing `tests/gh-test.sh` alone and `shellcheck` to the implementer role; the spec commit's subject.

## Repository texts

- `README.md`, "Git rules for Redline agents" (87-97): the commit rules. Known limits (99-132), its patch-less bullet (114): no limit this round changes.
- `docs/running.md:218` and `docs/scripts.md:110`: the clone's diff is described without its flags, so no doc changes.
- `.github/workflows/gate.yml`: the gate on Ubuntu and macOS (macOS with `/bin` and `/usr/bin` first on PATH), and the required `shellcheck` job.
- `.claude/redline/checks.sh:27, 360`: the gh check runs `tests/gh-test.sh` with PATH as it is.
- `scripts/redline-guard.sh:114-123`: the role table (the shaper reads, runs tests and reads GitHub; the implementer has no `shellcheck`).

## Outside the repository

- The reviewer's reproduction inputs: `/tmp/redlinerepro/nul-hunks.txt` (a marker line, a hunk header and a hunk line holding a NUL), `/tmp/redlinerepro/attrs.txt` (`*.md -diff`) and `/tmp/redlinerepro/gitconfig.txt` (`core.attributesFile` pointing at it). No `reviewer-r2-ReproTest.php` was written.
- Tools on this machine, run on stdin: the system grep, `grep (BSD grep, GNU compatible) 2.6.0-FreeBSD`, prints `Binary file (standard input) matches` for a marker line followed by a line holding a NUL, which `cut -f2` passes on whole; with `-a` it prints the marker line, which `cut -f2` cuts to `src/big.js`; `grep -c` still counts correctly in such a stream. `/opt/homebrew/bin/gawk` keeps a NUL through `{print}` (`a\0b\n`); `/usr/bin/awk` drops the rest of the line (`a\n`). git is `2.54.0 (Apple Git-157)`.
- git's manual, `/Library/Developer/CommandLineTools/usr/share/man/`:
  - `man1/git-diff.1:1047-1049`: `-a, --text`, "Treat all files as text".
  - `man1/git-config.1:3629-3668`: `core.bigFileThreshold`, files above it "Will be treated as if they were labeled "binary" [...] git-diff will not compute diffs".
  - `man1/git-config.1:3709-3719`: `core.attributesFile`, defaulting to `$XDG_CONFIG_HOME/git/attributes` or `$HOME/.config/git/attributes`.
  - `man5/gitattributes.5:841-859`: an unset `diff` attribute generates `Binary files differ`; an unspecified one is text only if it "looks like text and is smaller than core.bigFileThreshold".
  - `man1/git.1:1655-1657`: `GIT_DIFF_OPTS` overrides `-U`; `man1/git.1:1840-1860`: `GIT_CONFIG_GLOBAL` replaces `$HOME/.gitconfig` and `$XDG_CONFIG_HOME/git/config`, and `GIT_CONFIG_NOSYSTEM` skips the system file.
- `scripts/redline-gh.sh issues-search` for `NUL`, `gitattributes`, `attributes`, `temp file`, `binary`, `recover_hunks`, `git config` and `gh-test`, and `pr-comments 112`: nothing tracks these findings (`shape.md`, Unattended answer 3).
