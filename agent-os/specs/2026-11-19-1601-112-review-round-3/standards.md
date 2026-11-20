# Standards for PR #112 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `e068d94`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## scripts/bash-conventions (applied bullets)

Line 8 (whole; R3-2, and the retrospective's second edit):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header. Under `set -e` a command substitution that fails exits with its command's own status, so a documented exit code holds only where each such call is guarded (`found="$(gh issue list …)" || { echo '…' >&2; exit 1; }`): `defer` exited 4 on a gh that needed a login, while its header said 1, until #97, R4-1. A function run inside `$(...)` runs with `-e` off (bash clears it there outside POSIX mode, and no script here sets `inherit_errexit`), so a failing command inside it does not stop it and its last command's status is the substitution's: what it printed is checked before it is used. `post-review` posted a review of one newline when the jq inside `place_comments` failed, until #112, R1-9

Line 10 (in part, its opening; no header changes this round, so `docs/scripts.md`'s quoted block does not either):

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]

Line 24 (whole; R3-2's up-front check is the same object filter at a second site):

- A validator that shares its messages with another (`ask_rules_fault` in `redline-setup.sh`, `rule_fault` in the guard, the workflow's launch check) shares its tests too: a key's presence (`has("paths")`), never a non-null value, so `{"paths": null}` gets the shared message instead of passing, and a list's elements are filtered to objects (`objects`) before a field of each is read, so a non-object element gets `not an object` and exit 2 instead of jq's own error and exit 5 under `set -e` (#52, R1-2), and a pattern is matched against the whole string, `\A...\z` in jq: jq's `$` also matches before a final newline, so `^[a-z][a-z0-9-]*$` passed the id `"a\n"`, which the guard's `fullmatch` and the workflow's `/^...$/` refuse, and setup wrote a list that then stopped every run (#52, R2-1)

Line 37 (whole; R3-1, and the retrospective's first edit):

- What GitHub's files listing says about a missing patch: `patch` null with `changes` 0 is a binary file, or with status renamed a rename with nothing changed, and has no hunks; `patch` null with `changes` above 0 is a text file whose patch is past about 100 KiB, and GitHub still takes a comment on its lines. A `git diff` that stands in for GitHub's hunks is the merge base against the head, never the base tip, with its flags pinned (`--diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M`, the `a/` and `b/` prefixes, no external diff, no textconv, every file read as text (`--text`), since the listing counts the file's changed lines and git's own binary test follows attributes (`.git/info/attributes`, `core.attributesFile`) and `core.bigFileThreshold`, none of which GitHub sees (#112, R2-2), `core.quotepath=off`) and its paths literal, and it runs with `GIT_DIFF_OPTS` unset (`env -u GIT_DIFF_OPTS git ...`), since git lets that variable override `-U` whatever the command line says (#112, R1-4), so the user's git configuration cannot move a hunk; plain `diff -U3` gives other hunks, and the compare endpoint takes no path and drops more patches than the listing (#96, measured on #97 and #111)

Line 38 (whole; the retrospective's fifth item, carried from round 2's As built):

- A file of diff text (the hunk stream `diff_sections` writes) is read as text by every tool that reads it, `grep -a` for grep: grep takes a file that holds a NUL for binary and prints no matching line (BSD grep prints `Binary file ... matches` in its place, which `cut -f2` passed on as a path), and GNU awk keeps a NUL that macOS's awk drops, so one NUL past the first 8,000 bytes of a text file, where git's binary test stops looking, moved every patch-less file's comments under the could-not-be-had line on a Linux runner until #112, R2-1

Line 43 (in part; `env -u` given several times, and CI's shellcheck command):

- Every script runs under Apple's bash 3.2 with BSD tools (the macOS CI leg pins `/bin/bash`) and under bash 5 with GNU tools (Ubuntu), so bash 4 features (`declare -A`, `mapfile`, `${x,,}`) and GNU-only flags stay out; shellcheck covers `scripts/*.sh`, `tests/*.sh` and the generated `checks.sh` at severity warning, set by `-S warning` on the workflow's command, required, [...] and `checks.sh` does not run shellcheck, so a gate that passes on a developer's machine or in a Redline round can still push a warning CI fails on [...]. Until the gate runs it (the issue drafted in that spec), run CI's command, `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`, before a push that changes a `.sh` file, and count files with a glob, never `ls | grep` (SC2010)

---

## testing/tests (applied bullets)

Line 22 (in part; R3-4 names the subcommand this entry already lists the shim answering for):

- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) [...] against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write except three it answers and logs for the cases to read (the one `gh api graphql` call, [...] #39; `gh issue create`, #95; and PR 20's review, each payload appended to a log and then refused with the 422 bodies GitHub gave the #96 measurement or taken, #96, or, with `GH_FAKE_NO_STATUS=1`, the same bodies without their `status` field, as a host may give them (#112, R1-10); with `GH_FAKE_TMP_WATCH=<dir>` it logs, on each files read, how many of the script's temp files sit directly in `<dir>`, which is what an interrupt then would leave behind (#112, R2-3), logs every read, so a case pins how many calls a subcommand made (the whole diff is read once when a comment names a patch-less file and never otherwise), and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33). The patch-less fixtures (PR 20, and PR 21 with 301 files) take their whole diff from git in the harness's own throwaway repository, which is also the clone the script reads: a base that moved on after the head branched, a rename that changed and a name a diff header quotes (#96)

Line 27 (whole; the retrospective's fifth item):

- A case about bytes one tool keeps and another drops runs under the tool that keeps them when it is installed: the NUL cases of `tests/gh-test.sh` run with a folder holding `awk` as a link to `gawk` first on PATH, since macOS's awk drops a NUL before the script's grep could see it, and on a Linux runner the system awk keeps it already; the NUL sits past byte 8,000 of its file, where git's binary test stops looking, so git still diffs the file as text (#112, R2-1)

Line 29 (in part, its opening; every task's neighbour that must not change):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 30 (whole; R3-3's cases follow the quoted-name case):

- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)

Line 34 (whole; red before green):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 36 (whole; the new review file is under `$WORK`):

- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9); a case over this checkout's own files that calls a writing subcommand passes `--dry-run`, so a missing file reads red instead of being written back into the tree (#63, R1-3)

Line 37 (whole; R3-3, and the retrospective's third edit):

- A harness's own git (the fixture repository's init, commits and checkouts, and the whole diff the gh shim serves as GitHub's) runs with the developer's configuration and environment shut out, through one helper (`hgit` in `tests/gh-test.sh`: `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `-c core.attributesFile=/dev/null`, `GIT_DIFF_OPTS` unset), and a case proves it by making the fixture again under a hostile configuration: the whole diff followed a developer's `diff.context`, `diff.interHunkContext` and `GIT_DIFF_OPTS`, so three placement cases failed on that machine while CI passed (#112, R2-4). A case that sets a hostile configuration on purpose sets it on the script's call alone

---

## process/docs-gate (applied bullets)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 10:

- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`

Line 16:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

Line 5:

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
