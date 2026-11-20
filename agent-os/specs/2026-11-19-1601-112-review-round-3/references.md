# References for PR #112 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened while shaping, at `e068d94`.

## The code under review

### `scripts/redline-gh.sh`

- **Location:** the `post-review` header (117-137), its promise for comments the placement cannot read (135-137); `set -euo pipefail` (183); `wanted_files` (292-302) and its binding of every comment's path (298); `recover_hunks` (325-386), the comment on its flags and environment (335-340), its call of `wanted_files` (351), the clone's pinned `git diff` (376-378) and its loop that skips a failing file (375-381); `place_comments` (424-469), the `nopatch` kind (443) and its line (450); the `place` subcommand (536-550); the `post-review` subcommand (703-777), its up-front check (707-710), its `recover_hunks` call (723) and R1-9's check of what the placement printed (734-737).
- **Relevance:** R3-1's call and comment; R3-2's up-front check, the call that fails before R1-9's check, and the header that promises exit 2.
- **Key patterns:** `env -u` on the one git call that stands in for GitHub's hunks; a review file checked with one `jq -e` before anything is read; a failing per-file diff skipped with its stderr discarded.
- **Blame:** the up-front check predates the pull request (`dbb27ec`); `wanted_files` and `recover_hunks` are its own (`2d3e788`, `86be1bd`), the `env -u GIT_DIFF_OPTS` prefix R1-4's (`3626170`) and `--text` R2-2's (`332891e`).

### `tests/gh-test.sh`

- **Location:** the harness header (1-71), its opening sentence (3-5), its line on the writes it answers (8-9) and its account of PR 20's review (59-65); `hgit` (80-84); the PR 21 review file (181-187); the hostile `gitconfig` (189); `whole_diff` (190-192); the patch-less `place` cases (469-504), the context-line cases (475-477); the clone cases (506-565): the default run (510-518), the pinned-configuration and `GIT_DIFF_OPTS` cases (519-522), R2-2's attributes and threshold cases (523-533), the quoted-name case (552-556) and the R2-4 case (563-565); the `post-review` section (567-682), with `fresh_posts`, `posts`, `post_paths` (579-583) and R1-9's cases and `taken` (633-642); the shim's read log (345) and the gh wrapper (417-419).
- **Relevance:** Task 2 adds its cases after 533, Task 3 after 642, Task 4 after 565 and changes `hgit`.
- **Key patterns:** a per-case setting passed as a variable before `gh` or `whole_diff` (`GIT_DIFF_OPTS=-u0`, `GIT_CONFIG_GLOBAL=`); a review file written with `jq -n` into `$WORK`; a count of the shim's logged reads (`api.log`) and posts (`posts`, `taken`); a `cmp` of the whole diff made again against `diff-20.txt`.

### `docs/scripts.md`

- **Location:** the `redline-gh.sh` section's paragraph (9) and the quoted header (11-192), its `post-review` promise (145-147).
- **Relevance:** R3-4's sentence; the quoted header Tasks 2 and 3 leave unchanged. `git show main:docs/scripts.md` gives the same sentence on the base, whose harness header said its shim "refuses every write" (`git show main:tests/gh-test.sh`, line 8).

## The pull request's own spec and earlier rounds

### `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/`

- **Location:** `shape.md`, decision 12 (line 28, "the diff flags pinned so the user's git config cannot move a hunk") and decision 21 (line 46, "The pinned `git diff` also runs with `--literal-pathspecs`, so a path is never read as a pattern").
- **Relevance:** Unattended answers 4 and 5: the promise R3-1 breaks and the choice its fix keeps.

### `agent-os/specs/2026-11-19-1601-112-review-round-1/` and `-round-2/`

- **Location:** round 1's `shape.md`, unattended answer 8 and decisions 1, 5 and 12 (R1-4, R1-9, the shellcheck deviation); round 2's `shape.md`, unattended answers 8 and 9 and decisions 4 and 5 (R2-4, the NUL fixture), and its `plan.md`, Task 5 and As built (the counts, `261 passed, 0 failed`, and the last note left for a later retrospective).
- **Relevance:** R3-1 sits beside R1-4, R3-2 before R1-9's check, R3-3 in R2-4's fix; the counts this round starts from; the guard refusing `tests/gh-test.sh` alone and `shellcheck` to the implementer role.

## Repository texts

- `agents/redline-github.md:16` (the review file's shape, each comment `{"path", "line", "side", "body"}`) and `:22` (post-review: any non-zero exit is reported with the script's stderr).
- `README.md`, "Git rules for Redline agents": the commit rules. `README.md`, `docs/running.md` and `docs/scripts.md`, searched for `pinned`, `literal` and `git config`: none describes the clone's diff by its flags or its environment, so Task 2 needs no doc.
- `git grep -n -e 'must be JSON with body'`: only `scripts/redline-gh.sh:708`, so Task 3's reworded line is in no doc and no case.

## Outside the repository

- The reviewer's reproduction script, `/tmp/redlinerepro/reviewer-r3-repro.sh`: `env "<VAR>=1" -u GIT_DIFF_OPTS git --literal-pathspecs ...` for the three pathspec variables. The guard refuses this role both `bash <file>` and a `GIT_ICASE_PATHSPECS=` prefix, so the same check was made with git's own flags (`shape.md`, Unattended answer 4). No `reviewer-r3-ReproTest.php` was written, and no scratch test by this role.
- git on this machine, `2.54.0 (Apple Git-157)`: `git --icase-pathspecs --literal-pathspecs diff --stat HEAD~1 HEAD -- README.md` exits 128 with `fatal: global 'literal' pathspec setting is incompatible with all other global pathspec settings`; `--glob-pathspecs` gives the same; `--noglob-pathspecs` exits 0. `grep -a -c` of that message in `/Library/Developer/CommandLineTools/usr/bin/git` prints 2.
- jq on this machine, `jq-1.8.2`, on stdin: `[.comments[].path] | unique` over `{"body":"Redline round 1","comments":[1]}` prints `jq: error (at <stdin>:0): Cannot index number with string ("path")`; the extended check prints `false` for `[1]`, `true` for `[{"path":"a"},{}]` and for `[]`, and `false` with no error for `comments: 5`.
- git's manual, `/Library/Developer/CommandLineTools/usr/share/man/`:
  - `man1/git.1:297-327`: `--literal-pathspecs`, `--glob-pathspecs`, `--noglob-pathspecs` and `--icase-pathspecs`, each "equivalent to setting the" matching `GIT_*_PATHSPECS` "environment variable to 1"; `--icase-pathspecs` adds "icase" magic "to all pathspec" (321-327).
  - `man1/git.1:2028-2058`: the four `GIT_*_PATHSPECS` variables.
  - `man1/git-config.1:803-810`: `GIT_CONFIG_COUNT` with `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>`, added to the runtime configuration and overriding configuration files. No page under `man1/git*.1` has an entry for `GIT_CONFIG_PARAMETERS`.
- bash's manual, `/usr/share/man/man1/bash.1:7545-7561`: under `-e` the shell does not exit when the failing command is part of a `&&` or `||` list (`shape.md`, Unattended answer 7).
- `scripts/redline-gh.sh issues-search` for `pathspec`, `GIT_CONFIG`, `post-review` and `scripts.md`, and `pr-comments 112`: nothing tracks these findings (`shape.md`, Unattended answer 3).
