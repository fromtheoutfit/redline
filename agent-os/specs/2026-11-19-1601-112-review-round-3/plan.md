# PR #112 review round 3: the clone's diff kept clear of the other global pathspec settings, a review file's comments checked as objects up front, the harness's git shut off from configuration given through the environment, and post-review named among what the gh harness pins

Spec folder: `agent-os/specs/2026-11-19-1601-112-review-round-3/`

Shaped by Redline in unattended mode, for review round 3 of PR #112 (issue #96), from the round's four findings (`redline/round-3-review.json`, `redline/round-3-findings.json`).

- `fix`, one task each, in finding order: R3-1 (Task 2), R3-2 (Task 3), R3-3 (Task 4), R3-4 (Task 5).
- No `decline`, no `defer` and no `ask`.

Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, one commit per finding, files staged by name, the spec folder in its own first commit and the As built notes in the last. Every finding commit opens `redline: <id>` and ends `(#96)`. No commit subject holds a bare `@word` or an apostrophe.

Line numbers are at `e068d94`, the head of the branch. Each task also names its anchor by text, since earlier tasks move later lines. An anchor or a replacement that holds a backtick or a quote is given in a fenced block, exactly as the file holds it or should hold it; a replaced line keeps its indentation. Each task's anchors are as the tasks before it leave them.

Nothing in this plan touches `workflows/`, `agents/`, `skills/`, `templates/`, `hooks/hooks.json`, `scripts/redline-guard.sh`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, the gate's backticked text or `README.md`. No header of `scripts/redline-gh.sh` changes, so `docs/scripts.md`'s quoted block does not either; Task 5 changes only the prose sentence above it. The version stays `0.4.3`: the pull request bumped it once, and a review round of the same pull request adds no bump (process/release, line 5).

**Task order matters in two files.**

- `scripts/redline-gh.sh`:
  - Task 2 extends the last line of `recover_hunks`' flags comment (340) and splits the first line of its `git diff` (376) in two.
  - Task 3 adds a comment above `post-review`'s up-front check and changes the check and its message (707-708).
- `tests/gh-test.sh`:
  - Task 2 adds two cases after the `core.bigFileThreshold` case (533).
  - Task 3 adds one review file and three cases after R1-9's last case (642).
  - Task 4 rewrites the `hgit` comment and line (80-84) and adds two cases after the R2-4 case (565).

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-3/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter: the guard refuses `tests/gh-test.sh` run alone to the implementer role (round 1's As built).

**Red before green.** Every task that adds cases adds them first and sees them fail on a gate run, then makes the change and sees them pass. The red run is `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-3/redline/snapshot.json`, which prints the failing check's output. No case in this round holds before its change. A case that does hold on its red run is recorded under As built and as a deviation under Decisions in `shape.md`, with what it printed; the change it pins is still made.

**Expected counts.** Before this round, `tests/gh-test.sh` prints `261 passed, 0 failed` (round 2's As built). Every other harness prints what the baseline prints.

| Task | Adds | Red run | Detail |
| --- | --- | --- | --- |
| Task 2 | 2 | `261 passed, 2 failed` | the clone's diff under `GIT_ICASE_PATHSPECS=1` and under `GIT_GLOB_PATHSPECS=1` |
| Task 3 | 3 | `263 passed, 3 failed` | a review file whose comments are `[1]`: the exit, the line, nothing read or sent |
| Task 4 | 2 | `266 passed, 2 failed` | the fixture's whole diff under `GIT_CONFIG_COUNT` and under `GIT_CONFIG_PARAMETERS` |
| Task 5 | 0 | none | a sentence of `docs/scripts.md` |

So `tests/gh-test.sh` reads `268 passed, 0 failed`. The first green gate run's counts are the evidence, recorded under As built. A count that differs is recorded there with its reason, and as a deviation under Decisions in `shape.md`.

**Shellcheck.** Tasks 2 to 4 change a `.sh` file, so CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, is due before the push that carries them (scripts/bash-conventions, line 43). The guard refuses `shellcheck` to the implementer role (round 1, `shape.md` Decision 12), so the implementer does not run it: As built records it as not run here, and CI's required `shellcheck` job runs it on the push.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-19-1601-112-review-round-3/plan.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-3/shape.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-3/standards.md`
- `agent-os/specs/2026-11-19-1601-112-review-round-3/references.md`

**Commit:** `redline: save review round 3 spec for PR #112 (#96)`

## Task 2: R3-1, unset the other global pathspec settings on the clone diff

`shape.md`, Unattended answers 4 and 5 and Decision 1. git refuses `--literal-pathspecs` beside `GIT_ICASE_PATHSPECS` or `GIT_GLOB_PATHSPECS` and exits, so with either exported every file the clone would place keeps no hunks.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The cases, first.** In `tests/gh-test.sh`, right after the line that opens `is "place: the clone's diff reads a file past core.bigFileThreshold as text"` (533), add:

   ```bash
   # A global pathspec setting beside the clone diff's --literal-pathspecs (#112, R3-1): git refuses
   # glob or icase together with literal and exits, so the script unsets them on that call, and both
   # place as the default run does.
   icase="$(GIT_ICASE_PATHSPECS=1 gh place 21 "$WORK/review-21.json")"
   is "place: the clone's diff runs with GIT_ICASE_PATHSPECS unset, which git refuses beside literal pathspecs" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$icase")" '[[1500,98,1300],["R1-3","R1-5"]]'
   globbed="$(GIT_GLOB_PATHSPECS=1 gh place 21 "$WORK/review-21.json")"
   is "place: the clone's diff runs with GIT_GLOB_PATHSPECS unset, which git refuses beside literal pathspecs" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$globbed")" '[[1500,98,1300],["R1-3","R1-5"]]'
   ```

   Run the gate: red, both cases, each printing `[[],["R1-1","R1-2","R1-3","R1-4","R1-5"]]` (every per-file diff exits 128, so both files sit under the could-not-be-had line). No other case moves: no other case sets either variable.
2. **The fix.** In `scripts/redline-gh.sh`, `recover_hunks`:
   - The first line of the clone's `git diff` (376):

     ```bash
                     if env -u GIT_DIFF_OPTS git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M \
     ```

     becomes two lines:

     ```bash
                     if env -u GIT_DIFF_OPTS -u GIT_GLOB_PATHSPECS -u GIT_NOGLOB_PATHSPECS -u GIT_ICASE_PATHSPECS \
                         git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M \
     ```

     The two lines after it (`--no-color ...` and `"$fork" "$head" -- ...`) stay as they are. `env -u` given several times is in BSD and GNU `env` alike (scripts/bash-conventions, line 43).
   - The last line of the comment above the function (340):

     ```bash
     #    configuration and environment cannot move a hunk; the paths are literal, never patterns.
     ```

     becomes:

     ```bash
     #    configuration and environment cannot move a hunk; the paths are literal, never patterns,
     #    with every other global pathspec setting unset (GIT_GLOB_PATHSPECS, GIT_NOGLOB_PATHSPECS,
     #    GIT_ICASE_PATHSPECS): git refuses --literal-pathspecs beside glob or icase and exits, which
     #    left every such file without hunks (#112, R3-1).
     ```

   Run the gate: green.
3. **Proof:** the two cases, red then green; `git grep -c -e 'env -u GIT_DIFF_OPTS -u GIT_GLOB_PATHSPECS -u GIT_NOGLOB_PATHSPECS -u GIT_ICASE_PATHSPECS' -- scripts/redline-gh.sh` prints `scripts/redline-gh.sh:1` (it prints nothing before the change).

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. The environment the clone's diff runs in is described only in `recover_hunks`' comment; the header, `docs/scripts.md`, `docs/running.md` and README Known limits describe the clone's diff without its flags or its environment (searched for `pinned`, `literal` and `git config` while shaping), as round 2's Task 3 found.

**Commit:** `redline: R3-1 unset the other global pathspec settings on the clone diff (#96)`

## Task 3: R3-2, refuse a review file whose comments are not all objects before the listing is read

`shape.md`, Unattended answers 6 and 7 and Decision 2. `post-review`'s header promises exit 2 and one line naming the review file; a non-object comment reached `wanted_files`' jq first and exited 5 with jq's message.

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`.

1. **The review file and the cases, first.** In `tests/gh-test.sh`, right after the line that opens `is "post-review: comments that cannot be placed: GitHub is sent no review"` (642), add:

   ```bash
   # A comment that is not an object (#112, R3-2): the review file's own check reads every comment's
   # shape, so post-review stops before the listing is read, with its own line and exit 2, never jq's.
   jq -n '{body: "Redline round 1", comments: [1]}' > "$WORK/review-20-nonobject.json"
   fresh_posts; : > "$PAGES/api.log"
   out="$(gh post-review 20 "$WORK/review-20-nonobject.json" 2>"$WORK/err")"; code=$?
   is "post-review: a comment that is not an object: exit 2, nothing on stdout" "$code $out" "2 "
   is "post-review: a comment that is not an object: one line naming the review file" "$(cat "$WORK/err")" "redline-gh.sh: $WORK/review-20-nonobject.json must be JSON with body (string) and comments (an array of objects)"
   is "post-review: a comment that is not an object: nothing is read and no review is sent" "$(wc -l < "$PAGES/api.log" | tr -d ' ') $(posts) $(taken)" "0 0 none"
   ```

   Run the gate: red, the three new cases: `5 `, jq's own error (`Cannot index number with string ("path")`), and `1 0 none` (the listing was read once). R1-9's three cases just above stay green: their comment is an object.
2. **The fix.** In `scripts/redline-gh.sh`, `post-review`, the two lines

   ```bash
           if ! jq -e '(.body | type == "string") and (.comments | type == "array")' "$2" >/dev/null 2>&1; then
               echo "redline-gh.sh: $2 must be JSON with body (string) and comments (array)" >&2
   ```

   (707-708) become:

   ```bash
           # Every comment is an object: recover_hunks reads each one's path before the placement's
           # own check below, and a jq error there stops the script under set -e with jq's exit 5
           # and message, not the exit 2 and line the header promises (#112, R3-2).
           if ! jq -e '(.body | type == "string") and (.comments | type == "array") and (.comments | all(type == "object"))' "$2" >/dev/null 2>&1; then
               echo "redline-gh.sh: $2 must be JSON with body (string) and comments (an array of objects)" >&2
   ```

   The `exit 2` and `fi` after them stay as they are. The `and` before the new clause keeps `all` from running on a `comments` that is no array (`shape.md`, Unattended answer 7). Run the gate: green.
3. **Proof:** the three cases, red then green; R1-9's three cases green throughout; `git grep -c -e 'all(type == "object")' -- scripts/redline-gh.sh` prints `scripts/redline-gh.sh:1`.

**Docs:** `scripts/redline-gh.sh`: no reader-facing change. The header already promises one line naming the review file and exit 2 for comments the placement cannot read (135-137, quoted at `docs/scripts.md:145-147`) and already gives the comments as objects (117); this makes that hold. The line's words appear in no doc (`git grep -n -e 'must be JSON with body'` finds only the script), and `agents/redline-github.md:22` reports the script's stderr on any non-zero exit, as before.

**Commit:** `redline: R3-2 refuse a review file whose comments are not all objects before the listing is read (#96)`

## Task 4: R3-3, shut configuration given through the environment out of the gh harness git

`shape.md`, Unattended answers 8 and 9 and Decision 3. A test-only change.

**Files:** `tests/gh-test.sh`.

1. **The cases, first.** In `tests/gh-test.sh`, right after the line that opens `is "the fixture's whole diff ignores the developer's git configuration and GIT_DIFF_OPTS"` (565), add:

   ```bash
   # The same under configuration given through the environment rather than a file (#112, R3-3):
   # GIT_CONFIG_COUNT with a key and value pair, and GIT_CONFIG_PARAMETERS, which git -c hands to
   # what it runs (an alias, a hook). Either would shrink the whole diff's context to none.
   is "the fixture's whole diff ignores git configuration given through GIT_CONFIG_COUNT" "$(if GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=diff.context GIT_CONFIG_VALUE_0=0 whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"
   is "the fixture's whole diff ignores git configuration given through GIT_CONFIG_PARAMETERS" "$(if GIT_CONFIG_PARAMETERS="'diff.context=0'" whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"
   ```

   Both sit after the quoted-name case, whose `grep -c` pins `diff-20.txt` against a literal (testing/tests, line 30). Run the gate: red, the two new cases, each `differs`.
2. **The change.** In `tests/gh-test.sh`, the `hgit` comment and line (80-84):

   ```bash
   # hgit: the harness's own git, with the developer's configuration and environment shut out, so a
   # fixture is the same on every machine: no global or system configuration, no user attributes
   # file, and GIT_DIFF_OPTS unset (#112, R2-4). The script under test runs its own git, which the
   # hostile-configuration cases reach on purpose.
   hgit() { env -u GIT_DIFF_OPTS GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -c core.attributesFile=/dev/null "$@"; }
   ```

   become:

   ```bash
   # hgit: the harness's own git, with the developer's configuration and environment shut out, so a
   # fixture is the same on every machine: no global or system configuration, no user attributes
   # file, GIT_DIFF_OPTS unset (#112, R2-4), and no configuration given through the environment,
   # GIT_CONFIG_COUNT with its key and value pairs or the GIT_CONFIG_PARAMETERS that git -c hands to
   # what it runs (#112, R3-3). The script under test runs its own git, which the
   # hostile-configuration cases reach on purpose.
   hgit() { env -u GIT_DIFF_OPTS -u GIT_CONFIG_PARAMETERS -u GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -c core.attributesFile=/dev/null "$@"; }
   ```

   With `GIT_CONFIG_COUNT` unset its key and value pairs are never read (`git-config.1:805`), so they need no `-u` of their own. Every git call the harness makes itself already goes through `hgit`, so nothing else changes. Run the gate: green.
3. **Proof:** the two cases, red then green; the R2-4 case at 565 green throughout; `git grep -c -e 'env -u GIT_DIFF_OPTS -u GIT_CONFIG_PARAMETERS -u GIT_CONFIG_COUNT' -- tests/gh-test.sh` prints `tests/gh-test.sh:1`.

**Docs:** none: `tests/` is not a directory gate step 10 lists.

**Commit:** `redline: R3-3 shut configuration given through the environment out of the gh harness git (#96)`

## Task 5: R3-4, name post-review among what the gh harness pins

`shape.md`, Unattended answer 10 and Decision 4. A docs-only change.

**Files:** `docs/scripts.md`.

1. **The change.** In `docs/scripts.md`, the `redline-gh.sh` section's paragraph (9), the sentence

   ```text
   `tests/gh-test.sh` pins the read subcommands, `resolve-threads` and `defer` against a fake `gh` that serves `tests/gh-fixtures/`.
   ```

   becomes:

   ```text
   `tests/gh-test.sh` pins the read subcommands, `post-review`, `resolve-threads` and `defer` against a fake `gh` that serves `tests/gh-fixtures/`; for `post-review` the fake takes PR 20's review or refuses it with the 422 bodies GitHub gave the #96 measurement, so the cases pin every review the script sends after a refusal.
   ```

   Nothing else in the paragraph changes, and the quoted header below it is untouched.
2. **Proof:** `git grep -c -e 'refuses it with the 422 bodies' -- docs/scripts.md` prints `docs/scripts.md:1`. Run the gate: green, the counts of Task 4's green run.

**Docs:** none of its own: a change to `docs/` is reader-facing by nature (process/docs-gate, line 16).

**Commit:** `redline: R3-4 name post-review among what the gh harness pins (#96)`

## Task 6: Verification Gate

Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-19-1601-112-review-round-3/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of the Verification Gate's steps 1 to 9 in `.claude/commands/agent-os/shape-spec.md`, so the gate text stays the source. Expected: `tests/gh-test.sh` prints `268 passed, 0 failed`, and every other harness prints what the baseline prints.

CI's shellcheck command is not run here (see Shellcheck above); As built says so.

Then, as written in the gate:

10. **Docs.** Each task above names its entry. Touched plugin files: `scripts/redline-gh.sh` (Tasks 2 and 3, each "no reader-facing change" with its reason). `tests/gh-test.sh` (Tasks 2 to 4) is not under a directory this step lists, and `docs/scripts.md` (Task 5) is a reader doc itself. No config key, subcommand, allow rule or exit code is added: Task 3 makes `post-review` give the exit 2 its header already documents. Confirm each entry names its commit or its reason.
11. **Version.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read `0.4.3`, as the pull request set them; this round adds no bump.
12. **Standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver judges them; apply the approved ones in their own commit, after the finding commits, to `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md`, titled `redline: record the round 3 review lessons in the standards (#96)`, or record "Standards retrospective: no changes" under Decisions in `shape.md` if none is approved.
13. **Spec folder.** Add an `## As built` section at the end of this file: each task's commit, its red and green counts, that CI's shellcheck command was not run here, and any deviation, each deviation also recorded under Decisions in `shape.md`. Commit it last: `redline: record the as-built state of review round 3 for PR #112 (#96)`.

**Files** (this task): `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/testing/tests.md` (the standards commit, only as approved), and `agent-os/specs/2026-11-19-1601-112-review-round-3/plan.md` and `shape.md` (As built and any deviation).
