# PR #112 review round 2: the hunk stream read as text, the clone's diff read as text, the scratch folder made before the listing, and the harness's own git shut off from the developer's configuration

Spec folder: `agent-os/specs/2026-11-19-1601-112-review-round-2/`

Shaped by Redline in unattended mode, for review round 2 of PR #112 (issue #96), from the round's four findings (`redline/round-2-review.json`, `redline/round-2-findings.json`).

- `fix`, one task each, in finding order: R2-1 (Task 2), R2-2 (Task 3), R2-3 (Task 4), R2-4 (Task 5).
- No `decline`, no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#96)`. No commit subject holds a bare `@word` or an apostrophe.

Line numbers are at `4c8ed6a`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it or should hold it; a replaced line keeps its indentation. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `workflows/`, `agents/`, `skills/`, `templates/`, `hooks/hooks.json`, `scripts/redline-guard.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text, `README.md` or `docs/`. No header of `scripts/redline-gh.sh` changes, so `docs/scripts.md` does not either. The version stays `0.4.3`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

**Task order matters in two files.**

- `scripts/redline-gh.sh`:
  - Task 2 extends `diff_sections`' comment (304-309) and adds `-a` to the three `grep $'^@@@redline-file\t'` lines (361, 428, 720).
  - Task 3 rewrites the flags part of `recover_hunks`' comment (332-335) and the second line of its `git diff` (372).
  - Task 4 moves the scratch block of `place` (536-541) and of `post-review` (707-712) above each one's `all="$(pr_files "$1")"` line (535, 706).
- `tests/gh-test.sh`:
  - Task 2 extends the harness header's PR 20 sentence (47-48) and the PR 20 fixture comment (109-116), adds a base file after 127 and its head change after 138, a listing entry between 181 and 182, a review file and the GNU awk folder after 202, two cases after 509 and one before `echo "# last-round and has-review"` (615).
  - Task 3 adds two cases after 486.
  - Task 4 extends the harness header (before 65), adds a block to the shim after 316, and adds one case before `echo "# last-round and has-review"`, after Task 2's.
  - Task 5 adds the `hgit` helper before 76, routes 76, 126, 148, 149, 152 and 153 through it, turns 173 into the `whole_diff` function, and adds one case right after Task 2's two cases at 509.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-2/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter: the guard refuses `tests/gh-test.sh` run alone to the implementer role (round 1's As built).

**Red before green.** Every task adds its cases first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-2/redline/snapshot.json`, which prints the failing check's output. No case in this round holds before its change. Task 2's red needs GNU awk, since macOS's awk drops the NUL before grep could see it: `which gawk` prints `/opt/homebrew/bin/gawk` on this machine (checked while shaping), and `checks.sh` leaves PATH as it is.

**Expected counts.** Before this round, `tests/gh-test.sh` prints `254 passed, 0 failed` (round 1's As built). Every other harness prints what the baseline prints.

| Task | Adds | Red run | Detail |
| --- | --- | --- | --- |
| Task 2 | 3 | `254 passed, 3 failed` | a NUL in a recovered hunk: `place`'s placement and stderr, `place`'s calls, `post-review`'s too-large refusal |
| Task 3 | 2 | `257 passed, 2 failed` | an attributes file marking the file `-diff`; `core.bigFileThreshold` below its size |
| Task 4 | 1 | `259 passed, 1 failed` | no temp file outside the scratch folder while the listing is read |
| Task 5 | 1 | `260 passed, 1 failed` | the fixture's whole diff made again under a hostile configuration |

So `tests/gh-test.sh` reads `261 passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

**Shellcheck.** Tasks 2 to 5 change a `.sh` file, so CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, is due before the push that carries them (scripts/bash-conventions, line 42). The guard refuses `shellcheck` to the implementer role (round 1, `shape.md` Decision 12), so the implementer does not run it: As built records it as not run here, and CI's required `shellcheck` job runs it on the push.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-19-1601-112-review-round-2/plan.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-2/shape.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-2/standards.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-2/references.md`

**Commit:** `redline: save review round 2 spec for PR #112 (#96)`

## Task 2: R2-1, read the file markers of the recovered hunks as text

`shape.md`, Unattended answer 4 and Decision 1. One NUL in the hunk stream makes grep print no file marker, so every patch-less file's comments go into the body under a false line.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The fixture and the cases, first.** In `tests/gh-test.sh`:
   - **The harness header,** its PR 20 sentence (47-48): the words `a removed file and a 22,000-change file have no patch` (the last word of line 47 and the start of line 48) become `a removed file, a 22,000-change file and a text file whose changed line holds a NUL past byte 8,000 (#112, R2-1) have no patch`, the comment's lines rewrapped to the header's width. Nothing else in the sentence changes.
   - **The PR 20 fixture comment** (109-116): after its last line, `# and in no diff, so nothing supplies its hunks.`, add:

     ```bash
     # src/nul.js, shaped like src/big.js, holds a NUL on its changed line 1500, past the 8,000 bytes
     # git's binary test reads, so git diffs it as text and the NUL reaches the recovered hunks
     # (#112, R2-1).
     ```
   - **Its base,** right after the line `seq 1 3000 | awk '{printf "big %05d %080d\n", $1, 0}' > "$GEN/src/big.js"` (127):

     ```bash
     seq 1 3000 | awk '{printf "nul %05d %080d\n", $1, 0}' > "$GEN/src/nul.js"
     ```
   - **Its head,** right after the line that opens `awk 'NR==100 || (NR>=1001 && NR<=2500) {print $0 " changed"; next} {print}' "$GEN/src/big.js"` (138):

     ```bash
     awk 'NR>=1001 && NR<=2500 {print $0 " changed"; next} {print}' "$GEN/src/nul.js" > "$GEN/t"
     { head -n 1499 "$GEN/t"; printf 'nul 01500 changed, a NUL \0 past byte 8,000\n'; tail -n +1501 "$GEN/t"; } > "$GEN/src/nul.js" && rm "$GEN/t"
     ```

     bash's `printf` writes the NUL, as the harness's `printf 'BIN\0base\n'` (132) already does.
   - **The PR 20 listing:** between its `src/big.js` entry (181) and its `src/small.js` entry (182), add:

     ```text
         {filename: "src/nul.js", status: "modified", previous_filename: null, additions: 1500, deletions: 1500, changes: 3000, patch: null},
     ```
   - **The review file and the GNU awk folder,** right after the line `]}' > "$WORK/review-20-causes.json"` (202):

     ```bash
     jq -n '{body: "Redline round 1\n\nTwo findings.", comments: [
         {path: "src/nul.js", line: 1500, body: "**R1-1** · nit · low · confirmed\n\n**On a line that holds a NUL**"},
         {path: "src/big.js", line: 1500, body: "**R1-2** · nit · low · confirmed\n\n**On another patch-less file**"}
     ]}' > "$WORK/review-20-nul.json"
     # GNU awk keeps a NUL that macOS's awk drops, so the NUL cases run under it when it is installed:
     # a folder holding awk as a link to gawk goes first on PATH for them. On a Linux runner the
     # system awk keeps a NUL already (#112, R2-1).
     mkdir -p "$WORK/gnu-awk"
     if command -v gawk >/dev/null 2>&1; then ln -s "$(command -v gawk)" "$WORK/gnu-awk/awk"; fi
     ```
   - **Two `place` cases,** right after the line that opens `is "place: a name a diff header quotes: placed from the clone, which is asked not to quote it"` (509):

     ```bash
     # A NUL in a recovered hunk (#112, R2-1): the file markers are still read, so both patch-less
     # files keep their hunks and the whole diff is enough.
     : > "$PAGES/api.log"
     nul_out="$(PATH="$WORK/gnu-awk:$PATH" gh place 20 "$WORK/review-20-nul.json" 2>"$WORK/err")"; code=$?
     is "place: a NUL in a recovered hunk: both patch-less files stay inline, nothing on stderr" "$code $(jq -c '[(.comments | length), (.moved | length)]' <<<"$nul_out") $(cat "$WORK/err")" "0 [2,0] "
     is "place: a NUL in a recovered hunk: the whole diff gave both files, so the shas are not read" "$(diff_calls) $(sha_calls 20)" "1 0"
     ```

     The second case pins `recover_hunks`' reader (`found`): with it unread, both files look missing and the clone is asked.
   - **One `post-review` case,** right before the line `echo "# last-round and has-review"`:

     ```bash
     # A NUL in a recovered hunk (#112, R2-1): post-review reads which files were sourced as place
     # does, so GitHub's too-large refusal on that file is acted on.
     fresh_posts; echo "src/nul.js" > "$PAGES/too-large.txt"
     out="$(PATH="$WORK/gnu-awk:$PATH" gh post-review 20 "$WORK/review-20-nul.json" 2>"$WORK/err")"; code=$?
     is "post-review: a NUL in a recovered hunk: the too-large refusal on that file is acted on" "$code $(posts) $(post_paths 2)" "0 2 src/big.js"
     ```

     It pins `post-review`'s own reader (`sourced`, 720), a second call site of the same fault (testing/tests, line 13).

   Run the gate: red, the three new cases. With BSD grep they print `0 [0,2] `, `1 1` and `0 1 ` (both comments moved under the could-not-be-had line, the clone asked, the first post taken with no inline comment). Under GNU grep the first one also shows grep's `binary file matches` note. No other case moves: no other review names `src/nul.js`.
2. **The fix.** In `scripts/redline-gh.sh`:
   - The three lines that read the markers,

     ```bash
         { grep $'^@@@redline-file\t' "$4" || true; } | cut -f2 > "$found"
     ```

     ```bash
         { grep $'^@@@redline-file\t' "$3" || true; } | cut -f2 > "$recovered"
     ```

     ```bash
             { grep $'^@@@redline-file\t' "$hunks" || true; } | cut -f2 > "$sourced"
     ```

     (361 in `recover_hunks`, 428 in `place_comments`, 720 in `post-review`) each read `grep -a $'^@@@redline-file\t'` instead of `grep $'^@@@redline-file\t'`. Nothing else on them changes. `-a` is in BSD and GNU grep alike (scripts/bash-conventions, line 42; checked here on the system grep, `2.6.0-FreeBSD`).
   - `diff_sections`' comment: its last line, `# <wanted> is never empty: recover_hunks returns before this when it is.` (309), is followed by:

     ```bash
     # A hunk line is the diff's bytes as they are, a NUL included where awk keeps one (GNU awk and
     # mawk do; macOS's awk drops it), so every reader of the stream reads it as text, grep with -a:
     # grep takes a file holding a NUL for binary and prints no marker (#112, R2-1).
     ```

   Run the gate: green.
3. **Proof:** the three cases, red then green; `git grep -c -e 'grep -a ' -- scripts/redline-gh.sh` prints `3` (it prints nothing before the change).

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. How the script reads its own hunk stream is internal: the header, `docs/scripts.md`, `docs/running.md` and README Known limits say which findings are placed, and this makes that true on a GNU-tools machine without changing what they say.

**Commit:** `redline: R2-1 read the file markers of the recovered hunks as text (#96)`

## Task 3: R2-2, read every wanted file as text in the clone diff

`shape.md`, Unattended answers 5 and 6 and Decision 2. git's own binary test follows attributes and `core.bigFileThreshold`, which GitHub never sees; a wanted file is text by GitHub's listing.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The cases, first.** In `tests/gh-test.sh`, right after the line that opens `is "place: the clone's diff is pinned against GIT_DIFF_OPTS, which git lets override -U"` (486), add:

   ```bash
   # Git's own binary test, which GitHub does not share (#112, R2-2): a user attributes file that
   # unsets diff for the file, and a big-file threshold between its size (223,200 bytes) and the
   # rename pair's (184,000 and 188,800). The clone's diff reads a wanted file as text, so both
   # place as the default run does.
   printf 'lib/local.txt -diff\n' > "$WORK/attributes"
   printf '[core]\n\tattributesFile = %s\n' "$WORK/attributes" > "$WORK/gitconfig-attributes"
   printf '[core]\n\tbigFileThreshold = 200k\n' > "$WORK/gitconfig-bigfile"
   attributes="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig-attributes" gh place 21 "$WORK/review-21.json")"
   is "place: the clone's diff reads a file a user attributes file marks -diff as text" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$attributes")" '[[1500,98,1300],["R1-3","R1-5"]]'
   bigfile="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig-bigfile" gh place 21 "$WORK/review-21.json")"
   is "place: the clone's diff reads a file past core.bigFileThreshold as text" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$bigfile")" '[[1500,98,1300],["R1-3","R1-5"]]'
   ```

   Run the gate: red, both cases, each printing `[[1300],["R1-1","R1-2","R1-3","R1-5"]]` (`lib/local.txt` comes back `Binary files ... differ`, so its three comments sit under the could-not-be-had line; the rename keeps its hunks).
2. **The fix.** In `scripts/redline-gh.sh`, `recover_hunks`:
   - The second line of the pinned `git diff` (372):

     ```bash
                         --no-color --no-ext-diff --no-textconv --src-prefix=a/ --dst-prefix=b/ \
     ```

     becomes:

     ```bash
                         --no-color --no-ext-diff --no-textconv --text --src-prefix=a/ --dst-prefix=b/ \
     ```
   - The comment above the function, its four lines (332-335):

     ```bash
     #    path, gives the hunks, measured byte-identical to GitHub's whole diff. Its flags are pinned
     #    (algorithm, context, prefixes, rename detection, no external diff, no textconv), and it
     #    runs with GIT_DIFF_OPTS unset, which git lets override -U (#112, R1-4), so the user's git
     #    configuration and environment cannot move a hunk; the paths are literal, never patterns.
     ```

     become:

     ```bash
     #    path, gives the hunks, measured byte-identical to GitHub's whole diff. Its flags are pinned
     #    (algorithm, context, prefixes, rename detection, no external diff, no textconv, and every
     #    file read as text: the listing counts the file's changed lines, while git's own binary
     #    test follows attributes and core.bigFileThreshold, #112, R2-2), and it runs with
     #    GIT_DIFF_OPTS unset, which git lets override -U (#112, R1-4), so the user's git
     #    configuration and environment cannot move a hunk; the paths are literal, never patterns.
     ```

   `--text` is git's own (`git-diff.1:1047-1049`, "Treat all files as text"). Run the gate: green.
3. **Proof:** the two cases, red then green; `git grep -c -e 'no-textconv --text' -- scripts/redline-gh.sh` prints `1`.

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. The pinned flags are described only in `recover_hunks`' comment, which the header and `docs/scripts.md` do not quote; README Known limits and `docs/running.md` describe the clone's diff without its flags (as round 1's Task 2 found).

**Commit:** `redline: R2-2 read every wanted file as text in the clone diff (#96)`

## Task 4: R2-3, make the scratch folder before the listing is read

`shape.md`, Unattended answer 7 and Decision 3. A small refactor: no output, exit code or existing expectation moves.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The shim's watch and the case, first.** In `tests/gh-test.sh`:
   - **The harness header:** right before its line `# Runs in a throwaway repository under the system temp directory.` (65), add:

     ```bash
     # With GH_FAKE_TMP_WATCH=<dir>, a files read logs to $PAGES/tmp-watch.log how many of the
     # script's temp files sit directly in <dir> while it is in flight, which is what an interrupt
     # then would leave behind (#112, R2-3).
     ```
   - **The shim:** right after its line `printf '%s\t%s\n' "$endpoint" "$header" >> "$PAGES/api.log"` (316), add:

     ```bash
     # GH_FAKE_TMP_WATCH=<dir>: on a files read, how many of redline-gh.sh's temp files sit directly
     # in <dir> while the call is in flight, which is what an interrupt then would leave (#112, R2-3).
     if [[ -n "${GH_FAKE_TMP_WATCH:-}" && "$endpoint" == */files ]]; then
         n=0
         for f in "$GH_FAKE_TMP_WATCH"/redline-gh.*; do [[ -f "$f" ]] && n=$((n + 1)); done
         printf '%s\n' "$n" >> "$PAGES/tmp-watch.log"
     fi
     ```

     `-f` counts plain files only, so the scratch folder itself, which sits there too after the change, is not counted.
   - **The case,** right before the line `echo "# last-round and has-review"` (after Task 2's `post-review` case):

     ```bash
     # An interrupt while the listing is read leaves nothing behind (#112, R2-3): pr_files' own temp
     # file is made in the scratch folder too, so none sits directly in the temp directory then.
     mkdir -p "$WORK/tmp-watch"; : > "$PAGES/tmp-watch.log"
     GH_FAKE_TMP_WATCH="$WORK/tmp-watch" TMPDIR="$WORK/tmp-watch" gh place 20 "$WORK/review-20-text.json" >/dev/null 2>&1
     fresh_posts
     GH_FAKE_TMP_WATCH="$WORK/tmp-watch" TMPDIR="$WORK/tmp-watch" gh post-review 20 "$WORK/review-20-listed.json" >/dev/null 2>&1
     is "place and post-review: no temp file sits outside the scratch folder while the listing is read" "$(tr '\n' ' ' < "$PAGES/tmp-watch.log")" "0 0 "
     ```

   Run the gate: red, the new case, `1 1 ` (`pr_files`' own file, made before the scratch folder, once per subcommand).
2. **The change.** In `scripts/redline-gh.sh`:
   - `place` (535-542): the lines

     ```bash
             all="$(pr_files "$1")"
             # Every temp file of this subcommand, the ones recover_hunks and place_comments make
             # included, is made in one folder the EXIT trap removes, so a run that fails or is
             # interrupted leaves none behind (#112, R1-2).
             scratch="$(mktemp -d "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
             trap 'rm -rf "$scratch"' EXIT
             TMPDIR="$scratch"
             hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
     ```

     become:

     ```bash
             # Every temp file of this subcommand, the ones pr_files, recover_hunks and place_comments
             # make included, is made in one folder the EXIT trap removes, made before the listing is
             # read, so a run that fails or is interrupted leaves none behind (#112, R1-2, R2-3).
             scratch="$(mktemp -d "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
             trap 'rm -rf "$scratch"' EXIT
             TMPDIR="$scratch"
             all="$(pr_files "$1")"
             hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
     ```
   - `post-review` (706-713): the same eight lines, which follow its review-file check (`exit 2` / `fi`, 704-705), become the same eight lines as `place`'s above. Its other four `mktemp` lines and its loop stay as they are.

   Under `set -e` a failing `pr_files` still exits with its own status, and the trap then removes the folder (`shape.md`, Unattended answer 7). Run the gate: green.
3. **Proof:** the case, red then green; `git grep -c -e 'the ones pr_files, recover_hunks' -- scripts/redline-gh.sh` prints `2`.

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. Where the temp files sit during a run is internal: the header, `docs/scripts.md` and the README name none of them (as round 1's Task 8 found).

**Commit:** `redline: R2-3 make the scratch folder before the listing is read (#96)`

## Task 5: R2-4, run the gh harness git with the developer configuration shut out

`shape.md`, Unattended answers 8 and 9 and Decision 4. A test-only change.

**Files:** `tests/gh-test.sh`.

1. **The function and the case, first.** In `tests/gh-test.sh`:
   - The line (173)

     ```bash
     git -C "$GEN" -c core.quotepath=true diff --no-color --no-ext-diff --src-prefix=a/ --dst-prefix=b/ -M HEAD~1 HEAD > "$WORK/pages/diff-20.txt"
     ```

     becomes:

     ```bash
     # The whole diff the shim serves as GitHub's, from the fork to the head.
     whole_diff() { git -C "$GEN" -c core.quotepath=true diff --no-color --no-ext-diff --src-prefix=a/ --dst-prefix=b/ -M "$FORK_SHA" "$HEAD_SHA"; }
     whole_diff > "$WORK/pages/diff-20.txt"
     ```

     `FORK_SHA` and `HEAD_SHA` are the `HEAD~1` and `HEAD` of that point (148), so the fixture is the same bytes.
   - **The case,** right after Task 2's line that opens `is "place: a NUL in a recovered hunk: the whole diff gave both files, so the shas are not read"`:

     ```bash
     # The fixture's whole diff is the same under a developer's diff settings and GIT_DIFF_OPTS
     # (#112, R2-4): made again under the hostile configuration above, it matches byte for byte.
     is "the fixture's whole diff ignores the developer's git configuration and GIT_DIFF_OPTS" "$(if GIT_DIFF_OPTS=-u0 GIT_CONFIG_GLOBAL="$WORK/gitconfig" whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"
     ```

     It sits after the quoted-name case, whose `grep -c` pins `diff-20.txt` against a literal (testing/tests, line 29).

   Run the gate: red, the new case, `differs`.
2. **The change.** In `tests/gh-test.sh`:
   - Right before the line `git -C "$WORK/repo" init -q` (76), add:

     ```bash
     # hgit: the harness's own git, with the developer's configuration and environment shut out, so a
     # fixture is the same on every machine: no global or system configuration, no user attributes
     # file, and GIT_DIFF_OPTS unset (#112, R2-4). The script under test runs its own git, which the
     # hostile-configuration cases reach on purpose.
     hgit() { env -u GIT_DIFF_OPTS GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -c core.attributesFile=/dev/null "$@"; }
     ```
   - Every git call the harness makes itself goes through it: in `git -C "$WORK/repo" init -q` (76), in both calls of `gen_commit` (126), in the two `rev-parse` calls (148), the two `checkout` calls (149, 153) and the `rev-parse` call (152), and in `whole_diff`, the word `git` at the start of the call becomes `hgit`. Nothing else on those lines changes; `gen_commit`'s `-c user.name=...` pins stay.

   `env -u` is in BSD and GNU `env` alike, as the script's own clone diff already uses it (scripts/bash-conventions, line 42). Run the gate: green.
3. **Proof:** the case, red then green; `git grep -c -e 'GIT_CONFIG_NOSYSTEM=1' -- tests/gh-test.sh` prints `1`; `git grep -n -w -e 'git -C' -- tests/gh-test.sh` prints nothing (every harness call reads `hgit -C`).

**Docs:** none: `tests/` is not a directory gate step 10 lists.

**Commit:** `redline: R2-4 run the gh harness git with the developer configuration shut out (#96)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: `tests/gh-test.sh` prints `261 passed, 0 failed`, and every other harness prints what the baseline prints.

CI's shellcheck command is not run here (see Shellcheck above); As built says so.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `scripts/redline-gh.sh` (Tasks 2, 3 and 4, each "no reader-facing change" with its reason). `tests/gh-test.sh` (Tasks 2 to 5) is not under a directory this step lists. No config key, subcommand, allow rule or exit code is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.3`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md`, titled `redline: record the round 2 review lessons in the standards (#96)`, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, that CI's shellcheck command was not run here, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 2 for PR #112 (#96)`.

**Files** (this task): `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-19-1601-112-review-round-2/plan.md` and `shape.md` (As built and any deviation).

## As built

Built on `4c8ed6a`, one commit per task, in the plan's order. Every red and green run is the gate, `.claude/redline/checks.sh <snapshot>`, since the guard refuses `tests/gh-test.sh` run alone to the implementer role. The counts are what `tests/gh-test.sh` printed in each run, read from the kept result the gate names (`kept`), because a passing check prints no output.

| Task | Commit | Red | Green |
| --- | --- | --- | --- |
| 1, the spec folder | `ea33462` `redline: save review round 2 spec for PR #112 (#96)` | | |
| 2, R2-1 | `0d49a85` `redline: R2-1 read the file markers of the recovered hunks as text (#96)` | 254 passed, 3 failed: the three new cases, `0 [0,2] `, `1 1` and `0 1 `, as predicted, after the fixture deviation below | 257 passed, 0 failed |
| 3, R2-2 | `332891e` `redline: R2-2 read every wanted file as text in the clone diff (#96)` | 257 passed, 2 failed: the two new cases (their `got` lines fell before the 200 lines the kept result holds) | 259 passed, 0 failed |
| 4, R2-3 | `c1d6756` `redline: R2-3 make the scratch folder before the listing is read (#96)` | 259 passed, 1 failed: the new case, `1 1 `, as predicted | 260 passed, 0 failed |
| 5, R2-4 | `7aec9ab` `redline: R2-4 run the gh harness git with the developer configuration shut out (#96)` | 260 passed, 1 failed: the new case, `differs`, as predicted | 261 passed, 0 failed |
| 6, standards | `27e3714` `redline: record the round 2 review lessons in the standards (#96)` | | the six approved edits, no more |

Every proof grep printed what its task says. `git grep -c -e 'grep -a '` gives `scripts/redline-gh.sh:3`, `no-textconv --text` gives `:1`, `the ones pr_files, recover_hunks` gives `:2`, and `GIT_CONFIG_NOSYSTEM=1` gives `tests/gh-test.sh:1`. `git grep -n -w -e 'git -C' -- tests/gh-test.sh` prints nothing.

The gate after the standards commit, at `27e3714`: `ok: true`, all nine checks exit 0, no `unexpected_files`, nothing in `uncommitted`. The counts: loop 1449, prefs 172, gate 117, setup 512 and background 39, each with 0 failed, as the baseline has them. `tests/gh-test.sh` printed `261 passed, 0 failed`, the count the plan expects.

Version: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` still read `0.4.3`, with no bump.

Docs: each task's entry stands as written: `scripts/redline-gh.sh` changed in Tasks 2, 3 and 4 with no reader-facing change, and no header changed, so `docs/scripts.md` did not either.

CI's shellcheck command was not run here, as the plan says (see Shellcheck above): the guard refuses `shellcheck` to the implementer role, so it is still due before the push that carries this round's `.sh` changes, and CI's required `shellcheck` job runs it on the push.

The deviation, also under Decisions in `shape.md`, and one note:

- **The NUL fixture's path and layout** (Decision 5). As planned, `src/nul.js` put the NUL about 340 KB into the hunk stream, past the 32 KiB the system grep reads to call a file binary, so the three cases held before the fix. The fixture is `lib/nul.txt` instead, which opens the stream. Its line 1500, which holds the NUL, is a hunk of its own ahead of a changed block of lines 2001 to 3000. Its listing entry counts 1,001, 1,001 and 2,002. The cases, their expectations, the fix and the counts are as planned.
- **A lesson the approved standards edits leave out.** The first R2-1 edit to bash-conventions says grep takes a file that holds a NUL for binary. That holds for GNU grep from the buffer that holds the NUL on, but BSD grep checks only the file's first 32 KiB. So a NUL case on macOS needs its NUL in the first 32 KiB of the stream, which the R2-1 edit to testing/tests does not say either. Neither edit was changed here, since only the approved text lands; this is for a later retrospective.
