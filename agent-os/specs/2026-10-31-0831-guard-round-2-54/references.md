# References for the guard: round-2 findings on PR #54

Line numbers are as of the survey on 2026-10-31, before any change.

## The guard

- **`scripts/redline-guard.sh`** 41-60 (the bash fast path: `main_shape` sends a non-role's Bash call to Python when it names a script or a `git` word), 180-204 (`MAIN`, `GROUPS = {main, git-read}`, `refuse()` inert for the main session), 227-245 (`TMP_DIRS`, the protected sets, `ENV_OK`, `REPO_REAL`), 331-358 (`load_ask_rules()`: the pattern a `checks.json` reader follows), 473-515 (`writable()`: the cut at 489-491, the TMP exemption at 500, the prefix loop), 685-688 (`BUILTINS` holding `!`, the keywords and the setters; `WRAPPERS`), 756-800 (`check_simple()`: the prefix loop at 771-773 keeps names only, `env` at 778-783, `timeout`, `xargs`), 804-809 (the git-only `GIT_*`/`PAGER` refusal), 817-834 (`bash -c`, `cd`, the builtins pass at 828, the refused interpreters), 836-865 (the script branch, `script_name()` at 711-724), 890-901 (the sed branch: `files` at 892-894), 906-929 (the find branch), 968-976 (`read_flag_refused()`), 979-1039 (`check_git()`: the global loop at 981-992 with `-C` at 990-991, the read dispatch at 997-1001, the add branch at 1018-1039 with the glob line at 1034), 1041-1074 (`commit -F` reads its file: the pattern the sed `-f` reader follows).
- **Relevance:** every refusal lands in one of three functions shared by the roles and the main session, so a row for a role and an `inert` row for `-` pin the same line.

## The harness and the case table

- **`tests/guard-test.sh`** 39-44 (the cache repository when run from the plugin), 46-67 (the ask-rules fixtures rebuilt each run: where a `checks.json` var and a bracket-named file go), 76-104 (the hook input, the decision, the fifth column).
- **`tests/guard-cases.tsv`** 10-42 (the reviewer's baseline rows: 25 `sed -n '1,20p'`, 35 `cd app && cat`, 39 `bash -c "git log -1"`), 78 (`git add app/*.php`), 103 (`DB_DATABASE=… php artisan migrate`), 133 (`REDLINE_OCTANE=1 … checks.sh`), 203-206 (the #53 rows: 204 the temp pattern allow, 205-206 `[id].php`), 241 (`git -C REPO/ log`), 279-305 (the #50 git-flag rows: 287 `-O`, 289-291 the env prefixes with their fifth column, 294 `git grep -n foo`, 295 `git -C REPO/ status`, 297 `TMPDIR=/tmp git status`), 307-336 (the main-session rows: 321 `REDLINE_OCTANE=1`, 331 `cd REPO/ && git status`, 332-335 inert), 405-421 (the github role's `git -C REPO/` record-commit rows), 428 (`REDLINE_OCTANE=1 … redline-background.sh start`), 444-515 (`# @cwd PLUGIN`: 472-482 the #53 pattern rows), 521-564 (`# @cwd ASKRULES`: 525-527 the pattern rows naming a rule, 557-564 the Redline-file patterns).
- **Relevance:** each new row sits beside the neighbour named here; the flipped rows are 103 and 297.

## The reviews

- **PR #54 review 5718692837** (round 2): the eight findings, each with its inline comment and proposed fix; **review 5715390081** (round 1): R1-1 to R1-5, the origin of R2-2, R2-3, R2-6, R2-7 and R2-8, and the options for R1-5. No round-1 spec folder exists on the PR ref (`git ls-tree -d origin/<branch> agent-os/specs/` lists none for 54).

## The parent spec

- **`agent-os/specs/2026-10-30-1131-guard-hardening-53-50/shape.md`** decisions 1-3 (the pattern refusal with the prefix checks first, the main-session approval that is inert and never a deny, refuse-all for `-c` and `GIT_*`), 10 (the deviations), the applied retrospective; **`plan.md`** Task 7 (the Docs table this spec's Task 11 follows).

## README, prompts and product

- **`README.md`** 166-172 (The guard: 168 the main-session sentence, 170 the paragraph that becomes the list), 174-176 (Launching), 184-192 (Known limits: 191 the ask-rules bullet with its `[` clause), 158 (the Files row for the harness).
- **`skills/redline/SKILL.md`** 15 (`git rev-parse --show-toplevel` is `repoRoot`), 80 (the skill's git runs plainly from the session directory, "inside the checkout"); **`agents/redline-implementer.md`** 29 (Bash without `$`, name the file); **`agents/redline-github.md`** 30-31 and **`workflows/redline-loop.js`** 1377-1400 (`git -C <repoRoot>`).
- **`.claude/redline/checks.json`** (`vars: []` here) and **`tests/setup-fixtures/checks-input-laravel.json`** 6-8 (a `vars` entry: `name`, `env`, `default`, `doc`); **`scripts/redline-setup.sh`** 73, 648-657 (the entry's validation).
- **`agent-os/product/mission.md`** 16, **`roadmap.md`** 26.
