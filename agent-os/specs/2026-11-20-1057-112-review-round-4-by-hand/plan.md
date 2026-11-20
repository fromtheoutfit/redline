# PR #112 Review Round 4, Fixed by Hand — Plan

Redline's run on PR #112 stopped at its round cap with round 4's seven findings undecided. This plan fixes all seven, and settles once the two classes three of them belong to: the developer's git configuration reaching the clone's diff, and the developer's environment reaching the fixture's git. One commit per task, in the order below. The decisions are in `shape.md`. @michaelfromtheoutfit makes every commit.

## Task 1: Save spec documentation

Create this folder with `plan.md`, `shape.md`, `standards.md` and `references.md`. No visuals.

Before it, run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, and record its output under As built. Run the sweep (shape.md, decisions 9 and 10) and write its table into `shape.md`.

## Task 2: R4-1, the clone also needs the merge base

- **Change:** wording, in four places that state the one condition.
  - `README.md:114` (Known limits): "…when the clone does not hold the PR's base and head commits and their merge base".
  - `scripts/redline-gh.sh:98-101` (the `place` header): "when this clone holds the base and the head commit (their shas read in one call) and their merge base, a local git diff of that merge base against the head", and its verbatim quote in `docs/scripts.md:108-111`.
  - `scripts/redline-gh.sh:333` (`recover_hunks`' comment): "when both commits and their merge base are here" (shape.md, decision 16).
- **Test:** none; the change is wording.
- **Docs:** README, Known limits, and `docs/scripts.md`, section `redline-gh.sh`: updated in this commit.

## Task 3: R4-2, the unclosed parenthesis

- **Change:** `agent-os/standards/testing/tests.md:22`: close the parenthesis after "(#112, R1-10)", so the list of the three answered writes ends there.
- **Test:** none; wording. The line's parentheses are counted before and after (12 and 11, then 12 and 12).

## Task 4: R4-3, the doubled citation

- **Change:** `agent-os/standards/testing/tests.md:28`: drop the trailing " (#112, R2-1)".
- **Test:** none; wording.

## Task 5: R4-4, `-O/dev/null` on the clone's diff

- **Change:** the flag joins the pinned ones on `scripts/redline-gh.sh:380`; `recover_hunks`' comment names it and why.
- **Test:** in `tests/gh-test.sh`, beside the attributes and bigFileThreshold cases: a gitconfig holding `[diff] orderFile = .redline-no-such-orderfile`, then `GIT_CONFIG_GLOBAL=<it> gh place 21 review-21.json`, expecting `[[1500,98,1300],["R1-3","R1-5"]]`. Red: `[[],["R1-1","R1-2","R1-3","R1-4","R1-5"]]`.
- **Also measured here, for the sweep:** the pinned-configuration case is seen red with `-M` taken out of the script, since this repository's history has no rename to show that flag's part.
- **Docs:** README, the `scripts/redline-gh.sh` row of its file table, and `docs/scripts.md`, section `redline-gh.sh`: no reader-facing change. Neither names the pinned flags; `recover_hunks`' comment and `agent-os/standards/scripts/bash-conventions.md` do.

## Task 6: `GIT_ATTR_SOURCE` unset on the clone's diff

No finding names it; the sweep found it (shape.md, decision 10).

- **Change:** `-u GIT_ATTR_SOURCE` joins the `env` line on `scripts/redline-gh.sh:379`; the comment names it.
- **Test:** `GIT_ATTR_SOURCE=refs/heads/redline-no-such-ref gh place 21 review-21.json`, expecting the default placement. Red: every comment moved.
- **Docs:** no reader-facing change, as Task 5.

## Task 7: R4-5, a failed placement step posts nothing

- **Change:** in `scripts/redline-gh.sh`:
  - `place_comments` (`:428-473`): the positions, recovered and kinds steps each end `|| { rm -f "$positions" "$kinds" "$recovered"; return 1; }`, and the last jq's status is kept across the `rm` and returned.
  - `post-review` (`:737`): `placed="$(place_comments …)" || { echo "redline-gh.sh: could not place the comments of $2; nothing was posted" >&2; exit 2; }`. The shape check after it stays, and the comment above says both.
  - The header's `post-review` entry (`:135-137`): "Comments the placement cannot read (its jq fails on one), or a step of the placement that fails, stop it before anything is posted: one line on stderr naming the review file, exit 2", and its quote in `docs/scripts.md`.
  - `place` stays a plain call (shape.md, decision 13).
- **Test:** in `tests/gh-test.sh`, after the R1-9 cases: a `jq` wrapper in `$WORK/old-jq`, first on PATH for the one call, that exits 2 when its arguments hold `--rawfile recovered` and otherwise runs the real jq (shape.md, decision 14); `post-review 20` on a review with `src/small.js:10` and `src/big.js:1500`; expecting exit 2, nothing on stdout, the one line on stderr, and `0 none` from `posts` and `taken`. Red: exit 0, `1 taken`.
- **Docs:** `docs/scripts.md`, section `redline-gh.sh` (the quoted header): updated in this commit. README, the file-table row: no reader-facing change; exit 2 for a failed placement is already what it says.

## Task 8: R4-6 and R4-7, no `GIT_` variable reaches the harness's git

One commit for both findings (shape.md, decision 11).

- **Change:** in `tests/gh-test.sh`:
  - `unset "${!GIT_@}"` at the top of the harness, before its first git call.
  - `hgit` becomes a subshell that runs `unset "${!GIT_@}"`, then `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 exec git -c core.attributesFile=/dev/null -c core.hooksPath=/dev/null "$@"`. The three named `-u` go (shape.md, decision 12).
  - Its comment is rewritten by channel: environment, configuration files, per-user files, hooks. The R2-4 and R3-3 citations stay.
  - The fixture's build moves into `make_fixture`, called once where the lines stood (shape.md, decision 15). A helper `again <dir>` makes a fresh folder, runs `hgit init` and `make_fixture` there in a subshell, and prints its `whole_diff`.
- **Test:** two cases after the R3-3 cases, both written first and seen red.
  - R4-6: a scratch repository `$WORK/other` with one commit. `GIT_DIR="$WORK/other/.git" GIT_INDEX_FILE="$WORK/other/.git/index" again "$WORK/again-dir"` is compared with `diff-20.txt` (`same`), and `$WORK/other`'s HEAD and index checksum are unchanged. Red: its HEAD moved.
  - R4-7: `$WORK/template/hooks/pre-commit` exits 1. `GIT_TEMPLATE_DIR="$WORK/template" again "$WORK/again-template"` is compared with `diff-20.txt`. Red: `differs`, since the commits are refused.
  - `-c core.hooksPath=/dev/null` cannot be red once the prefix unset is in. It is seen red under a mutation: with the unset taken out of `hgit`, the R4-7 case is green with the flag and red without it (testing/tests, line 35).
  - The unset at the top has no case inside the harness, where nothing can export a variable before the harness starts. It is proven by three runs of the whole harness under exported `GIT_DIR`, `GIT_INDEX_FILE` and `GIT_TEMPLATE_DIR` pointing at a scratch repository outside the harness: before the task (cases fail, the scratch repository's HEAD moves), with `hgit` changed only (the scratch repository untouched, the clone cases still failing), and with the unset at the top (all pass, untouched).
- **Docs:** none needed; `tests/` is not a docs-gated folder.

## Task 9: the per-user ignore file

No finding names it (shape.md, decision 11).

- **Change:** `-c core.excludesFile=/dev/null` joins `hgit`; its comment names the file.
- **Test:** `$WORK/xdg/git/ignore` holding `lib/` and `*.json`. `XDG_CONFIG_HOME="$WORK/xdg" again "$WORK/again-ignore"` is compared with `diff-20.txt`. Red: `differs`.
- **Docs:** none needed.

## Task 10: Verification Gate

Run the nine commands of the Verification Gate (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then CONTRIBUTING's other three: `scripts/redline-gate.sh check .`, `scripts/redline-setup.sh version .`, and a clean tree. After the last code commit, run CI's shellcheck command again; it prints nothing.

The remaining gate steps:

- **Docs (step 10):** each entry above names its commit or its reason.
- **Version (step 11):** 0.4.3, kept on purpose (shape.md, decision 3).
- **Standards retrospective (step 12):** the drafts under "Standards retrospective (proposed)" in `shape.md` are put to the person and applied in their own commit.
- **Spec folder (step 13):** this plan's As built section, and any deviation under Decisions in `shape.md`.

## After the push: the seven replies

1. Confirm that `gh pr view 112 --json headRefOid` equals local HEAD.
2. Write `round-4-reply-R4-<k>.md` into `agent-os/specs/2026-11-19-1601-112-review-round-4/redline/`, one line each: `Redline round 4: fixed in <sha> (<subject>). · decided by: @michaelfromtheoutfit`. R4-6 and R4-7 name the same commit.
3. Show all seven to @michaelfromtheoutfit, and ask whether the threads are resolved afterwards (shape.md, decision 17).
4. Post them: `scripts/redline-gh.sh reply 112 <comment id> <file>`, with comment 4637796311 for R4-1, 4637796315 for R4-2, 4637796321 for R4-3, 4637796326 for R4-4, 4637796334 for R4-5, 4637796340 for R4-6 and 4637796347 for R4-7.
5. Check that `scripts/redline-gh.sh prior-findings 112` reads R4-1 to R4-7 as `fixed`.
6. @michaelfromtheoutfit commits the reply files as the record.

## As built

- **Before the first commit** (2026-11-20, shellcheck 0.11.0): CI's command printed nothing and exited 0. `tests/gh-test.sh` under `/bin/bash` (3.2): 268 passed, 0 failed.
- **Task 1:** this folder. The sweep ran on git 2.54.0 at `bc6555f`; its table is in `shape.md`.
