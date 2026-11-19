# PR #112 review round 1: the clone's diff pinned against GIT_DIFF_OPTS, a path-less comment moved again, nothing posted when placement fails, a 422 read from gh as well, the fallback's line made true, and the texts brought to the code

Spec folder: `agent-os/specs/2026-11-19-1601-112-review-round-1/`

Shaped by Redline in unattended mode, for review round 1 of PR #112 (issue #96), from the round's eleven findings (`redline/round-1-review.json`, `redline/round-1-findings.json`).

- `fix`, one task each, in finding order: R1-4 (Task 2), R1-6 (Task 3), R1-8 (Task 4), R1-9 (Task 5), R1-10 (Task 6), R1-1 (Task 7), R1-2 (Task 8), R1-3 (Task 9), R1-11 (Task 10).
- `decline`, no task: R1-5 and R1-7 (`shape.md`, Declined).
- No `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#96)`. No commit subject holds a bare `@word` or an apostrophe.

Line numbers are at `34acd12`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it or should hold it. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `workflows/`, `agents/`, `templates/`, `hooks/hooks.json`, `scripts/redline-guard.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh` or the gate's backticked text. The version stays `0.4.3`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

**Task order matters in four files.**

- `scripts/redline-gh.sh`:
  - Task 2 rewrites the end of `recover_hunks`'s comment (328-329) and the `git diff` line (365).
  - Task 3 rewrites the `--arg refused` line (440).
  - Task 4 rewrites `def placed` and `def cause` (446-447).
  - Task 5 extends the `post-review` header entry's last line (132) and adds a check after the `placed=` line in the loop (709).
  - Task 6 extends the same entry's sixth line (122) and adds a line after `status=` in the loop (715).
  - Task 8 rewrites the temp-file lines of `place` (530-531) and `post-review` (695-701).
- `tests/gh-test.sh`:
  - Task 6 extends the harness header (62) and the shim's `refuse` (292-296).
  - Task 8 adds a helper after `leftover()` (83-88).
  - Task 4 adds cases after `has "place: PR 7's no-patch comment sits under its cause" ...` (451).
  - Task 2 adds a case after `is "place: the clone's diff is pinned against the user's git configuration" ...` (467).
  - Task 3 edits the expectation of `is "post-review: a 422 that names no file: the body says so, with GitHub's message" ...` (530) and adds cases after `is "post-review: a 422 that names no file: one line on stderr" ...` (532).
  - Tasks 5, 6, 8 and 10 each add their cases right before the line `echo "# last-round and has-review"` (547), so they stand in task order.
- `docs/scripts.md`: Task 5 mirrors its header lines (141-142), and Task 6 mirrors its header lines (131-132).
- `docs/running.md`: Task 9 edits the Precheck paragraph (29), and Task 7 edits step 1 of Rounds (37).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-1/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter.

**Red before green.** Tasks 2, 3, 4, 5, 6 and 8 add their cases first and see them fail on a gate run, then make the change and see them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-1/redline/snapshot.json`, which prints the failing check's output. Three pins hold before their change and cannot be red before the build (testing/tests, line 33): Task 6's neighbour (a 422 with nothing placed through a source), Task 8's `post-review` neighbour and Task 10's three cases. Each is written with the others, the task says so, and Task 10's are seen red under the mutation that task names. Tasks 7 and 9 change only prose and add no case: their proof is a `git grep` and the gate staying green.

**Expected counts.** Before this round, `tests/gh-test.sh` prints `237 passed, 0 failed` (the pull request's As built). Every other harness prints what the baseline prints.

| Task | Adds | Detail |
| --- | --- | --- |
| Task 2 | 1 | the `GIT_DIFF_OPTS` case |
| Task 3 | 2 | the fallback with an off-hunk comment; one existing expectation follows the new words |
| Task 4 | 2 | a path-less comment: exit, `moved` |
| Task 5 | 3 | unplaceable comments: exit and stdout, the stderr line, no review sent |
| Task 6 | 4 | a 422 body with no status: fallback, its stderr line, too large, the neighbour |
| Task 7 | 0 | docs |
| Task 8 | 2 | no temp file left by a failing `place`, and by a failing `post-review` |
| Task 9 | 0 | docs |
| Task 10 | 3 | two too-large files: exit and posts, the body, the stderr lines |

So `tests/gh-test.sh` reads `254 passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

**Shellcheck.** Tasks 2 to 6, 8 and 10 change a `.sh` file, so CI's command runs once after Task 10 (Task 11): `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh` (scripts/bash-conventions, line 40).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-19-1601-112-review-round-1/plan.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-1/shape.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-1/standards.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-1/references.md`

**Commit:** `redline: add the review round 1 spec for PR #112 (#96)`

## Task 2: R1-4, run the clone's pinned diff with GIT_DIFF_OPTS unset

`shape.md`, Decision 1. git lets `GIT_DIFF_OPTS` override the `-U3` the clone's diff pins (`git.1:1657`), so a variable the user's profile exports moves its hunks.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The case, first.** In `tests/gh-test.sh`, right after the line that opens `is "place: the clone's diff is pinned against the user's git configuration"` (467), add:

   ```bash
   diffopts="$(GIT_DIFF_OPTS=-u0 gh place 21 "$WORK/review-21.json")"
   is "place: the clone's diff is pinned against GIT_DIFF_OPTS, which git lets override -U" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$diffopts")" '[[1500,98,1300],["R1-3","R1-5"]]'
   ```

   Run the gate: red, the context line 98 moved (the case prints `[[1500,1300],["R1-2","R1-3","R1-5"]]`).
2. **The fix.** In `scripts/redline-gh.sh`, `recover_hunks`, the line (365):

   ```bash
                   if git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M \
   ```

   becomes:

   ```bash
                   if env -u GIT_DIFF_OPTS git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M \
   ```

   and the comment above the function, its two lines (328-329):

   ```bash
   #    (algorithm, context, prefixes, rename detection, no external diff, no textconv) so the
   #    user's git configuration cannot move a hunk, and the paths are literal, never patterns.
   ```

   become:

   ```bash
   #    (algorithm, context, prefixes, rename detection, no external diff, no textconv), and it
   #    runs with GIT_DIFF_OPTS unset, which git lets override -U (#112, R1-4), so the user's git
   #    configuration and environment cannot move a hunk; the paths are literal, never patterns.
   ```

   `env -u` is in BSD and GNU `env` alike (scripts/bash-conventions, line 40). Run the gate: green.
3. **Proof:** the case above, red then green; `git grep -c -e 'env -u GIT_DIFF_OPTS git' -- scripts/redline-gh.sh` prints `1`.

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. The pinned flags are described only in `recover_hunks`'s comment, which the header and `docs/scripts.md` do not quote; README Known limits and `docs/running.md` describe the clone's diff without its flags.

**Commit:** `redline: R1-4 run the pinned clone diff with GIT_DIFF_OPTS unset (#96)`

## Task 3: R1-6, reword the fallback's line so it claims no comment was placed inline

`shape.md`, Unattended answer 5 and Decision 3. The grouping is the pull request's design and stays; only the line's words change.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The cases, first.** In `tests/gh-test.sh`:
   - In the expectation of `is "post-review: a 422 that names no file: the body says so, with GitHub's message"` (530), replace the text

     ```text
     GitHub refused a review that placed these inline (Line could not be resolved), so they are here:
     ```

     with

     ```text
     GitHub refused a review that placed comments through its whole diff or this clone (Line could not be resolved), so these comments, on files its listing gives no patch for, are here:
     ```

     Nothing else in that case changes.
   - Right after the line that opens `is "post-review: a 422 that names no file: one line on stderr"` (532), add:

     ```bash
     # The fallback with a comment the first pass found off the recovered hunks (#112, R1-6): it is
     # on a sourced file, so it sits under the refused line too, whose words claim no placement.
     jq -n '{body: "Redline round 1\n\nThree findings.", comments: [
         {path: "src/small.js", line: 10, body: "**R1-1** · nit · low · confirmed\n\n**On a listed patch**"},
         {path: "src/big.js", line: 1500, body: "**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**"},
         {path: "src/big.js", line: 500, body: "**R1-3** · nit · low · confirmed\n\n**Off the recovered hunks**"}
     ]}' > "$WORK/review-20-fallback.json"
     fresh_posts; echo "src/big.js" > "$PAGES/unresolved.txt"
     out="$(gh post-review 20 "$WORK/review-20-fallback.json" 2>"$WORK/err")"; code=$?
     is "post-review: the fallback with an off-hunk comment: exits 0 after two posts, the second from the listing's patch" "$code $(posts) $(post_paths 2)" "0 2 src/small.js"
     is "post-review: the fallback with an off-hunk comment: both sit under the refused line, which claims no placement" "$(post_body 2)" $'Redline round 1\n\nThree findings.\n\n### Not placed inline\n\nGitHub refused a review that placed comments through its whole diff or this clone (Line could not be resolved), so these comments, on files its listing gives no patch for, are here:\n\n<!-- redline:R1-2 -->\n`src/big.js:1500`\n\n**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**\n\n<!-- redline:R1-3 -->\n`src/big.js:500`\n\n**R1-3** · nit · low · confirmed\n\n**Off the recovered hunks**'
     ```

   Run the gate: red, the edited expectation and the new body case (the line still reads `placed these inline`).
2. **The fix.** In `scripts/redline-gh.sh`, `place_comments`, the line (440):

   ```bash
           --arg refused "GitHub refused a review that placed these inline ($message), so they are here:" '
   ```

   becomes:

   ```bash
           --arg refused "GitHub refused a review that placed comments through its whole diff or this clone ($message), so these comments, on files its listing gives no patch for, are here:" '
   ```

   Run the gate: green.
3. **Proof:** the two cases, red then green; `git grep -c -e 'placed these inline' -- scripts tests docs README.md` prints nothing (the pull request's built spec, `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/plan.md:88`, keeps the old words as the record of what was built; this round's `shape.md` records the change).

**Docs:** `scripts/redline-gh.sh`: no reader-facing change beyond the posted line. No README or `docs/` text quotes the line; `docs/running.md`, "How the review is posted" ("with the rest in the body under GitHub's message"), the `post-review` header entry and `place_comments`'s comment stay true as written.

**Commit:** `redline: R1-6 reword the fallback line so it claims no comment was placed inline (#96)`

## Task 4: R1-8, move a comment with no path into the body again

`shape.md`, Decision 4. jq fails on an object indexed with null, and `//` does not catch it.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The cases, first.** In `tests/gh-test.sh`, right after the line that opens `has "place: PR 7's no-patch comment sits under its cause"` (451), add:

   ```bash
   # A comment with no path, as only a hand-written review file has (#112, R1-8): moved into the
   # body, as before #96, never a jq error.
   jq -n '{body: "Redline round 1\n\nTwo findings.", comments: [
       {line: 3, body: "**R1-1** · nit · low · confirmed\n\n**No path**"},
       {path: "README.md", line: 1, body: "**R1-2** · nit · low · confirmed\n\n**Outside the pull request**"}
   ]}' > "$WORK/review-20-nopath.json"
   nopath_out="$(gh place 20 "$WORK/review-20-nopath.json" 2>"$WORK/err")"; code=$?
   is "place: a comment with no path: exits 0, nothing on stderr" "$code $(cat "$WORK/err")" "0 "
   is "place: a comment with no path: moved into the body, with the other" "$(jq -c '.moved' <<<"$nopath_out")" '[{"id":"R1-1","path":null,"line":3,"side":"RIGHT"},{"id":"R1-2","path":"README.md","line":1,"side":"RIGHT"}]'
   ```

   Run the gate: red, `Cannot index object with null` on stderr and nothing on stdout.
2. **The fix.** In `scripts/redline-gh.sh`, `place_comments`, the two lines (446-447):

   ```bash
           def placed: $kind[.path] == "hunks" and $ok[key] == true;
           def cause: ($kind[.path] // "absent") as $k | if $k == "hunks" then "offhunk" else $k end;
   ```

   become:

   ```bash
           def placed: $kind[(.path // "")] == "hunks" and $ok[key] == true;
           def cause: ($kind[(.path // "")] // "absent") as $k | if $k == "hunks" then "offhunk" else $k end;
   ```

   Run the gate: green.
3. **Proof:** the two cases, red then green.

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. A comment with no path is moved into the body as it was before #96, under the line every path the listing lacks gets, which the header already lists ("the file is not in the pull request").

**Commit:** `redline: R1-8 move a comment with no path into the body again (#96)`

## Task 5: R1-9, stop post-review before posting when its comments cannot be placed

`shape.md`, Decision 5. `place_comments` runs inside `$(...)`, where bash clears `-e`, so a jq failure inside it left `placed` empty and the loop posted a body of one newline.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`, `docs/scripts.md`.

1. **The cases, first.** In `tests/gh-test.sh`, right before the line `echo "# last-round and has-review"`, add:

   ```bash
   # Comments the placement cannot read (#112, R1-9): a moved comment whose body is no string, which
   # the jq that writes the review body cannot join, so post-review stops before it posts anything.
   jq -n '{body: "Redline round 1\n\nOne finding.", comments: [{path: "README.md", line: 1, body: 5}]}' > "$WORK/review-20-unplaceable.json"
   # taken: whether the shim took a review since fresh_posts, which a taken post writes comments-20.json for.
   taken() { if [[ -e "$PAGES/comments-20.json" ]]; then echo taken; else echo none; fi; }
   fresh_posts
   out="$(gh post-review 20 "$WORK/review-20-unplaceable.json" 2>"$WORK/err")"; code=$?
   is "post-review: comments that cannot be placed: exit 2, nothing on stdout" "$code $out" "2 "
   has "post-review: comments that cannot be placed: one line naming the review file" "$(cat "$WORK/err")" "redline-gh.sh: could not place the comments of $WORK/review-20-unplaceable.json; nothing was posted"
   is "post-review: comments that cannot be placed: GitHub is sent no review" "$(posts) $(taken)" "0 none"
   ```

   Run the gate: red, the stderr line and `GitHub is sent no review` (the shim took an empty review: `0 taken`). The first case happens to hold before the fix, since jq then fails on an empty `--argjson` with exit 2.
2. **The fix.** In `scripts/redline-gh.sh`, `post-review`, right after the loop's first line,

   ```bash
               placed="$(place_comments "$all" "$2" "$hunks" "$too_large" "$listing_only" "$refusal")"
   ```

   add:

   ```bash
               # place_comments runs in a command substitution, where bash clears -e, so a jq that
               # fails inside it does not stop it: what it printed is checked before anything is
               # posted (#112, R1-9).
               if ! jq -e '(.body | type == "string") and (.comments | type == "array") and (.moved | type == "array")' <<<"$placed" >/dev/null 2>&1; then
                   echo "redline-gh.sh: could not place the comments of $2; nothing was posted" >&2
                   exit 2
               fi
   ```

   Every earlier pass of the loop was a refused post, which posts nothing, so "nothing was posted" holds on any pass.
3. **The header.** The `post-review` entry's last two lines (131-132):

   ```text
   #                                  A 422 with no such comment, or after the second case, is the
   #                                  failure it always was: GitHub's reason on stderr, exit 1
   ```

   become:

   ```text
   #                                  A 422 with no such comment, or after the second case, is the
   #                                  failure it always was: GitHub's reason on stderr, exit 1.
   #                                  Comments the placement cannot read (its jq fails on one) stop
   #                                  it before anything is posted: one line on stderr naming the
   #                                  review file, exit 2
   ```

   `docs/scripts.md` quotes the header verbatim: make the same change to its copy of those two lines (141-142), in the same commit (scripts/bash-conventions, line 10).
4. Run the gate: green.
5. **Proof:** the three cases, red then green; `git grep -c -e 'Comments the placement cannot read' -- scripts/redline-gh.sh docs/scripts.md` prints `1` for each file.

**Docs:** `scripts/redline-gh.sh`: `docs/scripts.md`, the `redline-gh.sh` block (its quoted header), updated in this commit. The exit code 2 is new for `post-review` on this path; `agents/redline-github.md` already has the agent report the script's stderr and stop on any non-zero exit (its post-review bullet, line 22), so it needs no change.

**Commit:** `redline: R1-9 stop post-review before posting when its comments cannot be placed (#96)`

## Task 6: R1-10, read a refusal as a 422 from gh's line when the body has no status

`shape.md`, Unattended answer 4 and Decision 6. Decision 11 of the pull request's spec: "a round never fails to post because of the new path".

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`, `docs/scripts.md`.

1. **The shim and its header, first.** In `tests/gh-test.sh`:
   - The harness header, the line (62) `# GH_FAKE_REFUSE_ALL=1, for every post; a post it takes is served back as the pull request's`: after `GH_FAKE_REFUSE_ALL=1, for every post`, insert `, each body without its status field with GH_FAKE_NO_STATUS=1, as a host may give it`, so the sentence reads `... or, with GH_FAKE_REFUSE_ALL=1, for every post, each body without its status field with GH_FAKE_NO_STATUS=1, as a host may give it; a post it takes is served back as the pull request's review comments, ...` (rewrap the comment lines as needed; no other words change).
   - The shim's `refuse` (292-296):

     ```bash
         refuse() {
             jq -cn --arg e "$1" '{message: "Unprocessable Entity", errors: [$e], documentation_url: "https://docs.github.com/rest/pulls/reviews#create-a-review-for-a-pull-request", status: "422"}'
             echo "gh: Unprocessable Entity (HTTP 422)" >&2
             exit 1
         }
     ```

     becomes:

     ```bash
         # GH_FAKE_NO_STATUS=1 leaves the body's status field out, as a host's error body may (#112, R1-10).
         refuse() {
             jq -cn --arg e "$1" --arg nostatus "${GH_FAKE_NO_STATUS:-0}" '{message: "Unprocessable Entity", errors: [$e], documentation_url: "https://docs.github.com/rest/pulls/reviews#create-a-review-for-a-pull-request"} + (if $nostatus == "1" then {} else {status: "422"} end)'
             echo "gh: Unprocessable Entity (HTTP 422)" >&2
             exit 1
         }
     ```

     Without the variable the body is byte for byte what it was (`status` last), so no existing case moves.
2. **The cases.** Right before the line `echo "# last-round and has-review"` (after Task 5's cases), add:

   ```bash
   # A 422 whose body carries no status (#112, R1-10): gh's own line says 422, and the refusal is acted on.
   fresh_posts; echo "src/big.js" > "$PAGES/unresolved.txt"
   out="$(GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
   is "post-review: a 422 body with no status: the fallback still posts, from the listing's patches" "$code $(posts) $(post_paths 2)" "0 2 src/small.js"
   is "post-review: a 422 body with no status: one line on stderr" "$(cat "$WORK/err")" "redline-gh.sh: GitHub refused the review (Line could not be resolved); posting again with only the comments on files the listing gives a patch for"
   fresh_posts; echo "data/huge.json" > "$PAGES/too-large.txt"
   out="$(GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
   is "post-review: a too-large 422 with no status: posted again without that file's comment" "$code $(posts) $(post_paths 2)" "0 2 src/small.js,src/big.js"
   fresh_posts
   out="$(GH_FAKE_REFUSE_ALL=1 GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-listed.json" 2>"$WORK/err")"; code=$?
   is "post-review: a 422 with no status and nothing placed through a source: one post, exit 1, as before" "$code $(posts) $out" "1 1 "
   ```

   Run the gate: red, the first three (exit 1 after one post). The fourth, the neighbour that must not change, holds before the fix and is written with the others (testing/tests, line 33).
3. **The fix.** In `scripts/redline-gh.sh`, `post-review`, right after the line

   ```bash
               status="$(jq -r '.status // ""' "$response" 2>/dev/null || true)"
   ```

   add:

   ```bash
               # A host's error body may carry no status; gh's own line names the code whatever the
               # body holds (#112, R1-10).
               if [[ -z "$status" ]] && grep -qF '(HTTP 422)' "$gh_err"; then status=422; fi
   ```
4. **The header.** The `post-review` entry's fifth and sixth lines (121-122):

   ```text
   #                                  A refused post posts nothing, and two refusals are answered
   #                                  with a different review, never the same one again (#96). A 422
   ```

   become:

   ```text
   #                                  A refused post posts nothing, and two refusals are answered
   #                                  with a different review, never the same one again (#96). A
   #                                  refusal is a 422 by the status in GitHub's body or, when the
   #                                  body has none, by the "(HTTP 422)" gh prints (#112, R1-10). A 422
   ```

   Make the same change to `docs/scripts.md`'s copy of those two lines (131-132), in the same commit.
5. Run the gate: green.
6. **Proof:** the cases, red then green; `git grep -c -e 'body has none, by the' -- scripts/redline-gh.sh docs/scripts.md` prints `1` for each file.

**Docs:** `scripts/redline-gh.sh`: `docs/scripts.md`, the `redline-gh.sh` block (its quoted header), updated in this commit. `docs/running.md`, "How the review is posted", says what a refusal leads to, not how it is read, and stays true.

**Commit:** `redline: R1-10 read a refusal as a 422 from the gh line when the body has no status (#96)`

## Task 7: R1-1, list in Known limits every case that still lands in the review body

`shape.md`, Decision 7. The pull request's decision 5: "The README's Known limits line is narrowed to what remains".

**Files:** `README.md`, `docs/running.md`.

1. **`README.md`, Known limits,** the bullet that opens `- **A binary file, and a file whose diff GitHub takes no comment on, anchor nothing.**` (114). Keep its opening, through `so the reviewer opens it in the tree only when a finding points there.`, as it is. Replace the rest of the bullet, from `A finding in such a text file is still placed inline` to its end, with:

   ```text
   A finding in such a text file is still placed inline, with a thread: the hunks come from GitHub's whole-PR diff, read on a PR of 300 files or fewer, and, for a file that diff does not give, from the clone, on a PR of any size (#96). What stays in the review body, behind `<!-- redline:<id> -->` and under one line saying why, where later rounds reply with an issue comment quoting the marker: a finding in a binary file, or in a file renamed with no text changes, neither of which has hunks; one in a file whose diff is past a size at which GitHub refuses every comment (measured on this repository: accepted at 290 KB of diff, refused at 1.25 MB); one on a line outside the diff's hunks, or in a file the PR does not change; one in a patch-less file neither source gives the hunks of: a file whose path a diff header quotes whatever git is told (a tab, a newline, a quote or a backslash in it), or one the whole diff does not give (a PR over 300 files, a refused read) when the clone does not hold the PR's base and head commits; and, when GitHub refuses a review for any reason but a file's size, every finding on a file whose hunks came from the whole diff or the clone, since `post-review` then posts again from the listing's patches only.
   ```
2. **`docs/running.md`, Rounds, step 1** (37): in the sentence `A finding GitHub cannot anchor (a binary file, a line outside the diff, a file the pull request does not change, a diff too large for GitHub to take a comment on) goes in the body behind a marker, under one line saying why (see "How the review is posted").`, the parenthetical becomes `(a binary file, a line outside the diff, a file the pull request does not change, a diff too large for GitHub to take a comment on, among others)`. Nothing else in the sentence changes; "How the review is posted" lists every cause.
3. **Proof:** `git grep -c -e 'renamed with no text changes, neither of which' -- README.md` prints `1`; `git grep -c -e 'on a PR of any size' -- README.md` prints `1`; `git grep -c -e 'take a comment on, among others' -- docs/running.md` prints `1`. The gate stays green (the loop test pins other Known limits bullets by their openings, and this one's opening does not change).

**Docs:** `README.md` and `docs/running.md` are reader-facing by nature and need no Docs entry of their own (process/docs-gate).

**Commit:** `redline: R1-1 list in Known limits every case that still lands in the review body (#96)`

## Task 8: R1-2, make the temp files of place and post-review in one folder their trap removes

`shape.md`, Unattended answer 9 and Decision 8. A small refactor: no output, exit code or existing expectation moves.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The helper and the cases, first.** In `tests/gh-test.sh`:
   - Right after the `leftover()` function (83-88), add:

     ```bash
     # leftover_gh <dir>: how many of redline-gh.sh's temp files or folders are left in the folder.
     leftover_gh() {
         local f n=0
         for f in "$1"/redline-gh.*; do [[ -e "$f" ]] && n=$((n + 1)); done
         printf '%s\n' "$n"
     }
     ```
   - Right before the line `echo "# last-round and has-review"` (after Task 6's cases), add:

     ```bash
     # A run that fails leaves no temp file behind (#112, R1-2): every one sits in a folder the trap removes.
     mkdir -p "$WORK/tmp-place" "$WORK/tmp-post"
     TMPDIR="$WORK/tmp-place" gh place 20 "$WORK/review-20-unplaceable.json" >/dev/null 2>&1
     is "place: a run that fails leaves no temp file behind" "$(leftover_gh "$WORK/tmp-place")" "0"
     fresh_posts
     TMPDIR="$WORK/tmp-post" gh post-review 20 "$WORK/review-20-unplaceable.json" >/dev/null 2>&1
     is "post-review: a run that fails leaves no temp file behind" "$(leftover_gh "$WORK/tmp-post")" "0"
     ```

   Run the gate: red, the `place` case (`3`: `place_comments`'s positions, kinds and recovered files). The `post-review` case holds before the change, since `place_comments` runs there in a subshell with `-e` off and reaches its own `rm -f`; it is the neighbour, written with the other (testing/tests, line 33).
2. **The change.** In `scripts/redline-gh.sh`:
   - `place`: the two lines (530-531)

     ```bash
             hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
             trap 'rm -f "$hunks"' EXIT
     ```

     become:

     ```bash
             # Every temp file of this subcommand, the ones recover_hunks and place_comments make
             # included, is made in one folder the EXIT trap removes, so a run that fails or is
             # interrupted leaves none behind (#112, R1-2).
             scratch="$(mktemp -d "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
             trap 'rm -rf "$scratch"' EXIT
             TMPDIR="$scratch"
             hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
     ```
   - `post-review`: right after its line `all="$(pr_files "$1")"` (695), add the same comment and the three lines `scratch=...`, `trap 'rm -rf "$scratch"' EXIT` and `TMPDIR="$scratch"`; leave its five `mktemp` lines as they are, and remove its old trap line:

     ```bash
             trap 'rm -f "$hunks" "$response" "$gh_err" "$sourced" "$too_large"' EXIT
     ```

   The functions' own `rm -f` calls stay. Run the gate: green.
3. **Proof:** the `place` case, red then green; `git grep -c -e "trap 'rm -rf" -- scripts/redline-gh.sh` prints `2` (it prints nothing before the change).

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. Where the temp files sit during a run is internal: the header, `docs/scripts.md` and the README name none of them.

**Commit:** `redline: R1-2 make the temp files of place and post-review in one folder their trap removes (#96)`

## Task 9: R1-3, state the clone's base and head condition in the skill's warning and the Precheck docs

`shape.md`, Unattended answer 7 and Decision 9. `README.md:114` states the condition; these two texts promise the clone's hunks without it.

**Files:** `skills/redline/SKILL.md`, `docs/running.md`.

1. **`skills/redline/SKILL.md`, step 7** (99), in the over-300-files warning, the words

   ```text
   and the hunks of a text file whose patch GitHub omits come from this clone; a finding in a binary file,
   ```

   become:

   ```text
   and the hunks of a text file whose patch GitHub omits come from this clone when it holds the PR's base and head commits; a finding in a binary file,
   ```

   Nothing else in the step changes.
2. **`docs/running.md`, Precheck,** its paragraph (29), which the pull request's spec calls the launch paragraph: the words

   ```text
   and takes the hunks of a text file whose patch GitHub omits from the clone, so inline anchoring still works, except
   ```

   become:

   ```text
   and takes the hunks of a text file whose patch GitHub omits from the clone when it holds the PR's base and head commits, so inline anchoring still works there, except
   ```
3. **Proof:** `git grep -c -e 'come from this clone when it holds' -- skills/redline/SKILL.md` prints `1`; `git grep -c -e 'from the clone when it holds' -- docs/running.md` prints `1`. The gate stays green.

**Docs:** `skills/redline/SKILL.md`: `docs/running.md`, "Precheck", its paragraph, updated in this commit.

**Commit:** `redline: R1-3 state the base and head condition of the clone in the skill warning and the precheck docs (#96)`

## Task 10: R1-11, pin two too-large files in one review

`shape.md`, Decision 10. A test only: the loop's per-file bound already holds, so the cases cannot be red before the build.

**Files:** `tests/gh-test.sh`.

1. **The cases.** Right before the line `echo "# last-round and has-review"` (after Task 8's cases), add:

   ```bash
   # Two files GitHub takes no comment on in one review (#112, R1-11): one post more for each, then the post.
   fresh_posts; printf 'data/huge.json\nsrc/big.js\n' > "$PAGES/too-large.txt"
   out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
   is "post-review: two too-large files: exits 0 after three posts, the last with the listing's patch only" "$code $(posts) $(post_paths 3)" "0 3 src/small.js"
   is "post-review: two too-large files: both sit under the too-large line, in the review's order" "$(post_body 3)" $'Redline round 1\n\nFour findings.\n\n### Not placed inline\n\n'"$BINARY_GROUP"$'\n\nGitHub takes no comment on a diff this large:\n\n<!-- redline:R1-2 -->\n`src/big.js:1500`\n\n**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**\n\n<!-- redline:R1-3 -->\n`data/huge.json:5000`\n\n**R1-3** · nit · low · confirmed\n\n**In a very large diff**'
   is "post-review: two too-large files: one stderr line each, in the order GitHub named them" "$(cat "$WORK/err")" $'redline-gh.sh: GitHub takes no comment on src/big.js (its diff is too large); posting again with its comments in the review body\nredline-gh.sh: GitHub takes no comment on data/huge.json (its diff is too large); posting again with its comments in the review body'
   ```

   The shim names the first payload path its list holds, so the first refusal names `src/big.js` and the second `data/huge.json`.
2. **The red under a mutation** (testing/tests, line 33). In `scripts/redline-gh.sh`, `post-review`, add ` && ! [[ -s "$too_large" ]]` to the end of the condition `if [[ -n "$named" ]] && grep -qxF -- "$named" "$sourced" && ! grep -qxF -- "$named" "$too_large"; then`, so the loop handles one too-large file only; run the gate: red, the body and stderr cases (the second file falls to the fallback's line). Undo the mutation, run the gate: green. The mutation is never committed: stage only `tests/gh-test.sh`.
3. **Proof:** the three cases green, and red under the mutation.

**Docs:** none: `tests/` is not a directory gate step 10 lists.

**Commit:** `redline: R1-11 pin two too-large files in one review (#96)`

## Task 11: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: `tests/gh-test.sh` prints `254 passed, 0 failed`, and every other harness prints what the baseline prints.

Then run CI's shellcheck command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, which must exit 0 (scripts/bash-conventions, line 40).

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `scripts/redline-gh.sh` (Tasks 2 to 6 and 8; `docs/scripts.md`'s quoted header in Tasks 5 and 6, no reader-facing change with its reason in Tasks 2, 3, 4 and 8) and `skills/redline/SKILL.md` (Task 9; `docs/running.md`, "Precheck", its paragraph). `README.md` and `docs/` (Tasks 5, 6, 7, 9) are reader-facing by nature. `post-review` gains exit 2 for comments the placement cannot read, stated in its header and quoted in `docs/scripts.md` (Task 5); no config key, subcommand or allow rule is added. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.3`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md`, titled `redline: record the round 1 review lessons in the standards (#96)`, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, the shellcheck result, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 1 for PR #112 (#96)`.

**Files** (this task): `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-19-1601-112-review-round-1/plan.md` and `shape.md` (As built and any deviation).
