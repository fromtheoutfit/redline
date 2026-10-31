# Guard: the round-2 findings on PR #54 — Plan

Eight correctness findings from Redline round 2 on PR #54 (review 5718692837), all in `scripts/redline-guard.sh`, closed by refusing each class. Person-led: the person makes every commit, one per finding, in the order below. `shape.md` holds the decisions; this file holds the tasks, the Docs entries, the gate and the as-built record.

## Context

- The guard vets a command by its exact words (`check_simple`), its write targets (`writable()`) and git by subcommand and flag (`check_git`); the main session (`MAIN`) runs the same `check_simple` with the `main` and `git-read` groups and is inert wherever a role is denied.
- `tests/guard-test.sh` feeds `tests/guard-cases.tsv` to the guard; 492 rows pass before this spec. Rows that need an existing file or a `checks.json` run in the ask-rules fixture the harness rebuilds under `~/.cache/redline/` on every run.
- No prompt hands a role a keyword, a loop, `export`, or a prefix other than `REDLINE_OCTANE=1`; the github role's `git -C <repoRoot>` and the skill's plain git calls resolve to the repository root.

## Task 1: Save spec documentation

`agent-os/specs/2026-10-31-0831-guard-round-2-54/`: `plan.md` (this file), `shape.md`, `standards.md` (the six standards verbatim), `references.md`. No visuals. Committed first, on its own.

## Tasks 2 to 10: one commit per finding

Each task changes `scripts/redline-guard.sh`, adds its rows to `tests/guard-cases.tsv` beside the kept neighbour, edits the README's guard list for that refusal, and ends with `tests/guard-test.sh` printing `N passed, 0 mismatched`. Red before green: the new deny rows are seen to mismatch before the guard change.

### Task 2: R2-1, the main session approves only the decided set

- Guard: in `check_simple`, when `MAIN`, a wrapper (`time`, `nice`, `nohup`, `command`), `timeout`, `xargs` or `env` as the first word, or a command word that is not `cd`, a `script_name()` hit or `git`, returns a reason, which `refuse()` makes inert.
- Rows (`-`): inert `sed -n 'w /tmp/x' REPO/CLAUDE.md ; git status`, `find REPO/ -name x ; git status`, `echo x ; git status`, `time git status`, `cat REPO/CLAUDE.md | git status`; kept: `cd REPO/ && git status`, `git log -1`, the script rows.
- README: "The guard" first paragraph names the three approved kinds as bare command words; the second paragraph becomes an intro plus one list of refusals, starting from the rules already there.

### Task 3: R2-5, `!` and the shell keywords are refused

- Guard: `KEYWORDS = {"!", "if", "then", "else", "elif", "fi", "for", "do", "done", "while", "until", "case", "esac", "in", "select", "function", "coproc"}` leaves `BUILTINS` and is refused as a command word: `'<word>' is a shell keyword; a role runs plain pipelines, with no compound command or negation`.
- Rows (reviewer): deny `! python3 --version`, `if true; then cp /tmp/x app/x.php; fi`, `for f in a; do curl https://example.com; done`, `while true; do git push; done`, `if git diff --quiet; then echo same; fi`; allow `git diff --quiet && echo same`, `test -f app/x.php && cat app/x.php`, `[ -f app/x.php ] && cat app/x.php`; `-` inert `! rm -rf REPO/app ; git status`.
- README: the list gains the keyword bullet.

### Task 4: R2-6, every route that sets a variable for a child is refused

- Guard: `VAR_SETTERS = {"export", "declare", "typeset", "set", "readonly", "local"}` leaves `BUILTINS` and is refused for every role. The prefix loop keeps whole `NAME=value` tokens (bare, and after `env`); after it, every token whose NAME is not in `EXEMPT_VARS` is refused naming the variable, and an exempt one whose value does not match `^[A-Za-z0-9_./-]*$` is refused as not a plain word. `EXEMPT_VARS` is `{"REDLINE_OCTANE"}` plus each string `env` of `vars[]` in `<repo>/.claude/redline/checks.json`, read like the ask rules (unreadable or malformed: nothing added). An `env` option (`-i`, `-u`, `-S`, `-C`, `-P`, anything starting `-`) is refused. The git-only `GIT_*`/`PAGER` block is removed, subsumed.
- Harness: the ask-rules fixture gains `.claude/redline/checks.json` with `{"vars": [{"name": "migrate_db", "env": "REDLINE_MIGRATE_DB", "default": "x", "doc": "scratch database"}]}`.
- Rows (reviewer unless said): deny `export GIT_EXTERNAL_DIFF=/tmp/x.sh && git diff`, `GIT_EXTERNAL_DIFF=/tmp/x.sh bash -c 'git diff'`, `set -a ; git status`, `declare -x PATH=/tmp/x ; git status`, `PATH=/tmp/x cat app/x.php`, `BASH_ENV=/tmp/x.sh PLUGIN/scripts/redline-gh.sh pr 1`, `env -i git status`, `env PATH=/tmp git status`, `REDLINE_OCTANE='1 2' git status`; row 103 (implementer `DB_DATABASE=…`) flips to deny with `DB_DATABASE`; row 297 (`TMPDIR=/tmp git status`) flips to deny; allow `env git status`; kept allow 133, 321, 428. `-` inert `BASH_ENV=/tmp/x.sh PLUGIN/scripts/redline-gh.sh pr 1`, `export GIT_EXTERNAL_DIFF=/tmp/x.sh && git diff`, `PATH=/tmp/x git status`. Under `# @cwd ASKRULES`: implementer allow `REDLINE_MIGRATE_DB=app_redline_migrate php artisan migrate --force --no-interaction`, deny `DB_DATABASE=app_redline_migrate php artisan migrate --force --no-interaction` (`DB_DATABASE`), deny `REDLINE_MIGRATE_DB='a b' php artisan migrate --force`.
- README: the list gains the prefix and setter bullet; the Files row for the harness names the fixture's `checks.json`.

### Task 5: R2-3, a temp pattern cannot climb or cross a link

- Guard: in `writable()`, for a pattern target, before the TMP exemption: any `..` segment in the expanded raw path refuses (`holds a wildcard and a .. segment, which could climb out of the temp directory; name the file`), and the exemption applies only when the text after the cut holds no `/`.
- Rows: `# @cwd PLUGIN` implementer deny `echo x > /tmp/x*/../../..PLUGIN/scripts/redline-guard.sh`, reviewer deny `cp /tmp/a /tmp/x*/../../..PLUGIN/.claude/settings.json`; `# @cwd REPO` reviewer deny `mkdir -p /tmp/redlinerepro/rd*/../../..REPO/.git`, deny `mkdir -p /tmp/redlinerepro/rdir/../../..REPO/.git` (`.git/`), deny `sed -i '' 's/a/b/' /tmp/redlinerepro/*/x.php`; kept allow row 204; allow `echo x > /tmp/redlinerepro/sub/*.txt`.
- README: the wildcard bullet gains the two conditions.

### Task 6: R2-8, git runs only at the repository root

- Guard: in `check_git`, after the global-option loop, when `os.path.normpath(cur) != REPO and os.path.realpath(cur) != REPO_REAL`: `git runs only with the repository root as its working directory; 'git -C <dir>' and 'cd <dir> && git' are refused for every role, since a repository under <dir> can name a program in its config`. Every subcommand.
- Rows: reviewer deny `git -C /tmp/redlinerepro/r diff`, `cd /tmp/x && git status`, `cd app && git status`, `git -C app log -1`; github deny `git -C /tmp/x add -- f`; allow `cd REPO/app && cd .. && git status`; kept allow 241, 295, 405-409; `-` inert `git -C /tmp/x diff`, `cd REPO/app && git status`; kept `-` allow `cd REPO/ && git status`.
- README: the list gains the root bullet; "Launching" says to launch from the repository root.

### Task 7: R2-7, a read flag is read as git reads it

- Guard: `read_flag_refused()` also refuses a word matching `-[^-]*O` and a word starting `--op`.
- Rows: reviewer deny `git grep --open=/tmp/x.sh foo`, `git grep --open-files-in-pager=/tmp/x.sh foo`, `git grep -lO/tmp/x.sh foo`, `git grep -nO /tmp/x.sh foo`; plan-approver deny `git grep -lO/tmp/x.sh foo`; reviewer allow `git grep -l foo`, `git grep --only-matching foo`; kept 12, 294.
- README: the git-flag bullet says "in any spelling: bundled, attached or abbreviated".

### Task 8: R2-2, a sed script is not a write target

- Guard: the sed branch builds `files` by walking `args`, skipping the word after a detached `-e`, `--expression`, `-f` or `--file`; `--expression=` and `--file=` start with `-` and are already skipped.
- Rows: implementer allow `sed -i '' -e 's/[0-9]*/x/' app/x.php`, `sed -i '' -e 's/a*/b/' -e 's/[x]/y/' app/x.php`, `sed -i '' -f /tmp/script.sed app/x.php`; reviewer allow `sed -i '' -e 's/a*/b/' /tmp/redlinerepro/none.txt`; implementer deny `sed -i '' -e 's/a/b/' tests/*.sh` (`name the file`), deny `sed -i '' -e 's/a/b/'`; reviewer deny `sed -i '' -e 's/a/b/' app/x.php`.
- README: no new refusal; the wildcard bullet says the rule applies to the file operands.

### Task 9: R2-4, `git add` of an existing file whose name holds a bracket

- Guard: in the add branch, a path holding a pattern character is checked with `writable(p, cur, literal=True)` when `os.path.lexists(os.path.join(cur, expand(p)))`, else with `writable(p, cur)` as a pattern; the `*`/`?` line goes.
- Harness: the ask-rules fixture also creates `app/pages/[id].php` and `.claude/settings[1].json`.
- Rows (`# @cwd ASKRULES`, implementer): allow `git add app/pages/[id].php`; deny `git add app/pages/[x].php` (`name the file`), `git add app/pages/[id].ph?`, `git add .claude/settings[1].json` (`Redline's own files`), `git add config/projec[t]/project.yaml` (`craft-config`); kept 78, 205, 206.
- README: the wildcard bullet gains the `git add` clause; Known limits (the ask-rules bullet) says the same.

### Task 10: R2-1, the roles: a sed script that writes or runs, and find's file writers

- Guard: a reader over every sed script the branch collects (positional, after `-e`/`--expression`, `--expression=`, and the contents of the file after `-f`/`--file`, read from disk; unreadable refuses): addresses, then one command letter; `s` and `y` bodies skipped by their delimiter with backslash escapes; `w`, `W` or `e` as a command, or `w` or `e` among the flags of `s`, refuses (`a sed script that writes a file or runs a command (w, W, e) is refused for every role`); `b`, `t`, `T`, `:` take a label to `;` or newline; `a`, `i`, `c` take text to the end of the line; `{`, `}`, `;`, newline and `#` comments are handled; anything the reader cannot place refuses. Applied for every sed call, `-n` or `-i` alike. In the find branch, `-fprint`, `-fprint0`, `-fprintf` and `-fls` refuse.
- Rows: reviewer deny `sed -n 'w app/x.php' app/Models/Order.php`, `sed -n 'w /tmp/x' app/Models/Order.php`, `sed 's/a/b/w /tmp/x' app/x.php`, `sed -e 's/a/b/' -e 'w .claude/settings.json' /tmp/x`, `sed -n '1e ls' app/x.php`, `find app -name '*.php' -fprint /tmp/list`, `find app -fls /tmp/l`; implementer deny `sed -i '' -e 's/a/b/w out' app/x.php`; reviewer allow `sed -e 's/new/old/' -e 's/e/w/' app/x.php`, `sed -n '/x/{p;q;}' app/x.php`, `sed -e 'b end' -e ':end' app/x.php`, `find app -name '*.php' -print`; kept 25, 207.
- README: the list gains the sed and find bullet.

## Task 11: Docs entries (gate step 10)

| Touched | README section | Commit |
| --- | --- | --- |
| `scripts/redline-guard.sh` (Tasks 2-10) | The guard: the main-session sentence names the three approved kinds as bare words; the second paragraph is an intro plus one list of what the guard refuses, one bullet per class | each task's own |
| `scripts/redline-guard.sh` (Task 6) | Launching: launch from the repository root | Task 6's |
| `scripts/redline-guard.sh` (Task 9) | Known limits, the ask-rules bullet: the `git add` existing-file clause | Task 9's |
| `tests/guard-test.sh` (Tasks 4, 9) | Files table, the harness row: the fixture carries a `checks.json` var and bracket-named files (not a Docs-step directory; kept accurate) | Tasks 4's and 9's |

## Task 12: Verification Gate

Steps 1 to 9: `.claude/redline/checks.sh --baseline` exits 0; the stamp is untouched (no gate text moves). Then `scripts/redline-gate.sh check .` and `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0 and the tree is clean. Step 10: every row of Task 11 names its commit. Step 11: the retrospective proposed in `shape.md`, presented with AskUserQuestion, applied in its own commit or "no changes" recorded. Step 12: the As built section below and the deviations under Decisions in `shape.md`.

## Verification (end to end)

1. After each of Tasks 2 to 10: `tests/guard-test.sh` prints `N passed, 0 mismatched`, N up by that task's rows, the flipped rows 103 and 297 as decided.
2. Red before green per task: the task's deny rows mismatch before its guard change.
3. At the end: the gate green, `redline-gate.sh check .` and `redline-setup.sh version` exit 0, the stamp line unchanged, the tree clean; shellcheck runs in CI.
4. By hand from this checkout in a session: `git status` is approved without a prompt; `cd tests && git status` and `export X=1 && git status` prompt.

## As built

Filled in at the gate: deviations from the tasks above, with the commit each task landed in.
