# Standards for PR #112 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `4c8ed6a`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## scripts/bash-conventions (applied bullets)

Line 10 (in part, its opening; no header changes this round, so `docs/scripts.md` does not either):

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]

Line 14 (whole; R2-3, and the retrospective's third edit):

- A subcommand that makes temp files, directly or through the functions it calls, makes them in one `mktemp -d` directory its `EXIT` trap removes (`place` and `post-review` point `TMPDIR` at it), so a failure or an interrupt leaves nothing in the temp directory: a function that removes its own files on return leaves them behind when the subcommand stops inside it (#112, R1-2)

Line 33 (whole; Task 2's listing entry and review file are written with `jq -n`):

- `jq` reads and writes every JSON value; no hand-built JSON strings in bash

Line 37 (whole; R2-2, and the retrospective's second edit):

- What GitHub's files listing says about a missing patch: `patch` null with `changes` 0 is a binary file, or with status renamed a rename with nothing changed, and has no hunks; `patch` null with `changes` above 0 is a text file whose patch is past about 100 KiB, and GitHub still takes a comment on its lines. A `git diff` that stands in for GitHub's hunks is the merge base against the head, never the base tip, with its flags pinned (`--diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M`, the `a/` and `b/` prefixes, no external diff, no textconv, `core.quotepath=off`) and its paths literal, and it runs with `GIT_DIFF_OPTS` unset (`env -u GIT_DIFF_OPTS git ...`), since git lets that variable override `-U` whatever the command line says (#112, R1-4), so the user's git configuration cannot move a hunk; plain `diff -U3` gives other hunks, and the compare endpoint takes no path and drops more patches than the listing (#96, measured on #97 and #111)

Line 38 (in part; R2-2's unmeasured edge ends in this bounded fallback, and R2-1's `post-review` case reads it):

- A write never sends again a call that failed. `post-review` alone posts a second time, and always a different review: GitHub refuses a whole review with a 422 and posts nothing, so when the 422 names a file (`Diff entry <path> diff is too large`) whose hunks did not come from the listing, that file's comments move into the body and the review is posted again, once per such file; any other 422 on a review that placed a comment through another source is answered once, from the listing's patches only; [...] The header states the bound, a handled refusal is one stderr line and exit 0, and a 422 with no such comment fails as it always did, so a new source is never why a round fails to post (#96)

Line 42 (in part; `grep -a` and `env -u`, and CI's shellcheck command):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, [...] Until the gate runs it (the issue drafted in that spec), run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, before a push that changes a `.sh` file, and count files with a glob, never `ls | grep` (SC2010)

---

## testing/tests (applied bullets)

Line 13 (in part, its opening; Task 2's `post-review` case pins a second reader of the hunk stream):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); [...]

Line 22 (in part, the gh harness's shim and its patch-less fixtures; every task, and the retrospective's sixth edit):

- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) [...] against a fake `gh` first on PATH that serves the fixtures by endpoint [...], refuses every write except three it answers and logs for the cases to read ([...]; and PR 20's review, each payload appended to a log and then refused with the 422 bodies GitHub gave the #96 measurement or taken, #96, or, with `GH_FAKE_NO_STATUS=1`, the same bodies without their `status` field, as a host may give them (#112, R1-10), logs every read, so a case pins how many calls a subcommand made (the whole diff is read once when a comment names a patch-less file and never otherwise), and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33). The patch-less fixtures (PR 20, and PR 21 with 301 files) take their whole diff from git in the harness's own throwaway repository, which is also the clone the script reads: a base that moved on after the head branched, a rename that changed and a name a diff header quotes (#96)

Line 26 (whole; Task 2's NUL sits past byte 8,000, the limit it guards):

- A fixture is made large enough to hit the limit it guards: the gh harness's 150 small files passed while Losers League #778 (336 files, a 1.8 MB diff) overflowed the command line, so it also carries a 60,000-line patch (#33)

Line 28 (in part, its opening):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 29 (whole; Task 5's comparison follows a literal pin of `diff-20.txt`):

- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)

Line 33 (whole; every red run):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 35 (in part, its opening; every new file is under `$WORK`):

- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; [...]

Line 38 (in part, its opening; R2-1 and R2-4 are faults of one OS's tools or one machine's configuration):

- The gate runs in CI (`.github/workflows/gate.yml`) on every push to a pull request and to `main`, on Ubuntu and macOS, as the checker runs it (`checks.sh --baseline`), [...] and a harness that fails on one OS is fixed on that OS, never skipped or weakened in the workflow (#17)

---

## process/docs-gate

Applied as the gate's step 10 states it: one Docs entry per plugin file a task adds or alters under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, naming the README or `docs/` section and its commit or "no reader-facing change" with the reason. One of its bullets, whole:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release

Line 5 (in part, its opening):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes [...]; major for a contract change a rerun cannot carry; patch otherwise. [...]

The pull request bumped to `0.4.3` once; this round adds no bump.

---

## prompts/attribution

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. [...]
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
