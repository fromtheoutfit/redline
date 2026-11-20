# Standards for PR #112 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `34acd12`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## scripts/bash-conventions (applied bullets)

Line 8 (whole; R1-9, and the exit code Task 5 states):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header. Under `set -e` a command substitution that fails exits with its command's own status, so a documented exit code holds only where each such call is guarded (`found="$(gh issue list …)" || { echo '…' >&2; exit 1; }`): `defer` exited 4 on a gh that needed a login, while its header said 1, until #97, R4-1

Line 10 (in part, its opening; Tasks 5 and 6):

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]

Line 11 (whole; Tasks 3, 7 and 9):

- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)

Line 13 (in part, its opening; R1-2, which the reviewer notes this bullet covers only for `defer`'s record):

- A record a subcommand keeps beside what it writes is merged into as the file stands when the entry is written, never into the copy read when the subcommand began, and the temp file it writes beside the record is removed on every way out that does not end in its `mv`, through one `EXIT` trap that names every temp file the subcommand makes: [...]

Line 32 (whole; Tasks 4 and 5):

- `jq` reads and writes every JSON value; no hand-built JSON strings in bash

Line 33 (whole; Task 8 keeps every temp file):

- A JSON value that grows with the pull request (the anchor positions of `place`, megabytes on a 336-file PR) reaches `jq` through `--slurpfile` or `--rawfile` from a temp file, never `--argjson`, which puts it on the command line and fails with "Argument list too long" (#33)

Line 35 (whole; R1-4):

- What GitHub's files listing says about a missing patch: `patch` null with `changes` 0 is a binary file, or with status renamed a rename with nothing changed, and has no hunks; `patch` null with `changes` above 0 is a text file whose patch is past about 100 KiB, and GitHub still takes a comment on its lines. A `git diff` that stands in for GitHub's hunks is the merge base against the head, never the base tip, with its flags pinned (`--diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M`, the `a/` and `b/` prefixes, no external diff, no textconv, `core.quotepath=off`) and its paths literal, so the user's git configuration cannot move a hunk; plain `diff -U3` gives other hunks, and the compare endpoint takes no path and drops more patches than the listing (#96, measured on #97 and #111)

Line 36 (whole; R1-6 and R1-10):

- A write never sends again a call that failed. `post-review` alone posts a second time, and always a different review: GitHub refuses a whole review with a 422 and posts nothing, so when the 422 names a file (`Diff entry <path> diff is too large`) whose hunks did not come from the listing, that file's comments move into the body and the review is posted again, once per such file; any other 422 on a review that placed a comment through another source is answered once, from the listing's patches only. The header states the bound, a handled refusal is one stderr line and exit 0, and a 422 with no such comment fails as it always did, so a new source is never why a round fails to post (#96)

Line 40 (in part; `env -u`, the glob in Task 8's helper, CI's shellcheck command):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, [...] Until the gate runs it (the issue drafted in that spec), run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, before a push that changes a `.sh` file, and count files with a glob, never `ls | grep` (SC2010)

---

## testing/tests (applied bullets)

Line 22 (in part, the gh harness's shim and its patch-less fixtures; Tasks 2 to 6, 8 and 10):

- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) [...] against a fake `gh` first on PATH that serves the fixtures by endpoint [...], refuses every write except three it answers and logs for the cases to read (the one `gh api graphql` call, [...]; `gh issue create`, #95; and PR 20's review, each payload appended to a log and then refused with the 422 bodies GitHub gave the #96 measurement or taken, #96), logs every read, so a case pins how many calls a subcommand made (the whole diff is read once when a comment names a patch-less file and never otherwise), and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33). The patch-less fixtures (PR 20, and PR 21 with 301 files) take their whole diff from git in the harness's own throwaway repository, which is also the clone the script reads: a base that moved on after the head branched, a rename that changed and a name a diff header quotes (#96)

Line 28 (in part, its opening; Task 6's neighbour, Task 8's neighbour):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 33 (whole; every red run, and the pins that hold before their change):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 35 (in part, its opening; Task 8's case writes only under `$WORK`):

- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; [...]

---

## process/docs-gate

Applied as the gate's step 10 states it: one Docs entry per plugin file a task adds or alters under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, naming the README or `docs/` section and its commit or "no reader-facing change" with the reason. Two of its bullets, whole:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)
- A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it: the #81 spec recorded a pinned relaunch's permission prompt as unmeasured both in bypass-permissions and outside it, and `docs/running.md` and the skill's spoken line stated both as fact while Known limits listed only the second, until #91, R2-1

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
