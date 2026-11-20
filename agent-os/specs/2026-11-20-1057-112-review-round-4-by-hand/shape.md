# PR #112 Review Round 4, Fixed by Hand — Shaping Notes

## Scope

Redline's run on PR #112 (#96) stopped at its round cap after round 4, with round 4's seven findings undecided. This spec fixes the seven, and settles once the two classes that three of them are the fourth round of. It changes nothing else. The brief is the record in `agent-os/specs/2026-11-19-1601-112-review-round-4/redline/` (`round-4-findings.json`, `round-4-review.json`, `cap-hit.md`). That folder has no `shape.md`, because the run stopped before shaping. The findings were read from the pull request's round 4 review (5986662289) and its seven inline comments.

- **R4-1** (nit, `README.md:114`): Known limits and the `place` header say the clone supplies a patch-less file's hunks when it holds the base and the head commit. The code also needs their merge base.
- **R4-2** (nit, `agent-os/standards/testing/tests.md:22`): the gh-test entry opens a parenthesis it never closes.
- **R4-3** (nit, `agent-os/standards/testing/tests.md:28`): the NUL-case line ends with a doubled citation.
- **R4-4** (correctness, low, `scripts/redline-gh.sh:380`): a `diff.orderFile` the repository root cannot read makes the clone's `git diff` exit 128, so every comment the clone would place goes to the body.
- **R4-5** (correctness, medium, `scripts/redline-gh.sh:438`): a failing kinds step inside `place_comments` still yields a well-formed placement, so `post-review` posts every comment under "The file is not in this pull request:".
- **R4-6** (correctness, medium, `tests/gh-test.sh:86`): `hgit` leaves `GIT_DIR` and `GIT_INDEX_FILE` in place, so the fixture's commits and index entries land in another repository when they are set.
- **R4-7** (nit, `tests/gh-test.sh:86`): `hgit` leaves `GIT_TEMPLATE_DIR` in place, so a developer's template hooks run on the fixture's commits.

Two classes run through the four rounds:

- **The developer's git configuration reaches the diff that stands in for GitHub's hunks** (`scripts/redline-gh.sh`): R1-4 (`GIT_DIFF_OPTS`), R2-2 (attributes and `core.bigFileThreshold`), R3-1 (the pathspec variables), now R4-4 (`diff.orderFile`). Each round added one flag or one unset.
- **The developer's environment reaches the fixture's git** (`tests/gh-test.sh`): R2-4 (configuration files and `GIT_DIFF_OPTS`), R3-3 (`GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`), now R4-6 and R4-7. Each round named one or two variables.

CI's shellcheck command printed nothing before the first commit (shellcheck 0.11.0, 2026-11-20), and `tests/gh-test.sh` stood at 268 passed, 0 failed.

## Decisions

Decisions 1 to 8 are @michaelfromtheoutfit's, given with the request. Decisions 9 to 12 are their answers while shaping. Decisions 13 to 17 were made while shaping, from the code, and approved with the plan.

1. **All seven findings are handled here.** R4-1, R4-2, R4-3 and R4-5 are fixed as the review proposes: for R4-5, `place_comments` returns non-zero when any step fails, `post-review` exits 2 and posts nothing, and the case is seen red first.
2. **R4-4, R4-6 and R4-7 are settled as their classes, once.** Decisions 9 to 12 say how and why.
3. **Nothing else changes.** No new source of hunks, no change to the cause lines, the retry rules, `workflows/redline-loop.js`, `tests/loop-test.mjs`, the guard, the hook or any template. The version stays 0.4.3: this is the same pull request.
4. **Every fix has a case seen red first, except a wording fix.** The placement cases that exist are not edited.
5. **CI's shellcheck command runs before the first commit and after the last:** `shellcheck -S warning -f gcc scripts/*.sh tests/*.sh .claude/redline/checks.sh`.
6. **The seven findings are answered on PR #112 in Redline's own reply form, after the push,** one reply in each round 4 thread, naming the commit, so `redline-gh.sh prior-findings` reads each as settled. @michaelfromtheoutfit sees the seven replies before they are posted.
7. **The standards retrospective is its own commit.** A lesson about fixing a class once belongs there if the standards do not already say it. They do not: no line of `agent-os/standards/` speaks of a class of finding.
8. **No AI attribution anywhere,** in commits, replies or the spec.
9. **(a) The clone's diff: one flag, and a sweep that shows it is the last.** `-O/dev/null` is added, as R4-4 proposes. What settles the class is the table under "The sweep" below: every `diff.*` and `core.*` key git-config(1) lists, the attribute sources and every variable git(1) lists, each set against the pinned call, with what covers it and what was measured. A later finding in this class has to name a setting outside the table. Shutting the developer's global and system configuration out of the call (`GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1`) was the other choice, and was not taken:
   - It does not cover the repository's own `.git/config`, the files that includes, or worktree configuration. A `diff.orderFile` set there still ends the call (measured in a scratch clone, the table's last row of that group), so `-O/dev/null` is needed anyway and no pinned flag could be dropped.
   - It breaks `safe.directory`, which git honours only from the global, system or command scope (git-config(1), "only respected in protected configuration"). In a checkout owned by another user, as in a container mount, this one call would die while the script's other git calls pass, and every clone-sourced comment would go to the body with nothing printed.
   - It breaks a partial clone's lazy fetch of a blob, which loses the credential helper, `url.*.insteadOf` and proxy settings.
   - `GIT_CONFIG_GLOBAL` needs git 2.32.
10. **(a, rider) The sweep covers the `core.*` keys and the attribute sources too, since R2-2 came through one of those; and a setting that moves a position or fails the call stops the build for a question before a flag is added.** One did, while shaping: `GIT_ATTR_SOURCE` naming a tree the repository does not hold makes `git diff` exit 128 (`fatal: bad --attr-source or GIT_ATTR_SOURCE`), while `rev-parse`, `cat-file` and `merge-base` exit 0. It is the shape of R3-1. The answer: unset it on the diff's `env` line, as its own task and commit after R4-4's, its case seen red first, the way the #97 by-hand spec carried SC2010 beside its seven findings. R4-4's reply then names a commit that holds only R4-4.
11. **(b) The harness's git: no `GIT_` variable, harness-wide.** `hgit` drops every `GIT_` variable by prefix (`unset "${!GIT_@}"`, in a subshell) and then sets its own two, so no variable has to be named again. The harness also unsets them once at its top, so the script under test starts with none, and each hostile case still adds its own on the call, as now.
    - *Does the script under test need the same?* It only reads through git (`rev-parse`, `cat-file`, `merge-base`, `diff`), so an inherited `GIT_DIR` cannot make it write anywhere. But it would read the developer's repository in place of the fixture, so where the variables are exported (the hook R4-6 names) the gate would be safe and still red. The unset at the top makes it green there. The script keeps the developer's configuration files, which its pinned flags answer for.
    - `-c core.hooksPath=/dev/null` goes in with it, as R4-7 proposes, so no hook runs on the fixture whatever its source.
    - **One commit settles R4-6 and R4-7,** since one change turns both cases green; both replies name it.
    - **The per-user ignore file is one more way in, which no finding names.** `core.excludesFile` defaults to `$XDG_CONFIG_HOME/git/ignore`, or `~/.config/git/ignore`, whatever `GIT_CONFIG_GLOBAL` says, and `hgit` read it (measured: this machine's own file matched a path under `hgit`'s exact environment). A developer whose file lists `lib/` or `*.json` gets a fixture with files missing from `add -A`. `-c core.excludesFile=/dev/null` shuts it, in its own commit with its own red case.
    - **As built, `hgit` takes each variable out with `env -u`, the names still found by prefix, and does not use `unset`.** Inside a function whose call carries the variable, bash's `unset` removes that one and uncovers the exported value beneath it; the whole harness under an exported `GIT_DIR` showed it, where every case had passed (`plan.md`, As built, Task 8). The unset at the top of the harness runs outside any function and stays.
    - `env -i` was not taken: it also drops `HOME`, `TMPDIR` and the locale, and breaks a git that is a version manager's shim. Naming the variables the findings name was not taken: git(1) lists 70, and the next one would be a fifth round.
12. **(c) What the answers make unnecessary in the earlier rounds' fixes.** In `scripts/redline-gh.sh`, nothing: every pinned flag and every `-u` still answers for a setting the repository's own configuration or the caller's environment can make (the table's last two groups). In `tests/gh-test.sh`, one thing: `hgit`'s named unsets, `-u GIT_DIFF_OPTS` (R2-4) and `-u GIT_CONFIG_PARAMETERS -u GIT_CONFIG_COUNT` (R3-3), which the prefix unset replaces on the same line. Their four cases stay unedited and now prove the prefix unset for those variables. `-c core.attributesFile=/dev/null` and `hgit`'s `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_NOSYSTEM` stay: none is a `GIT_` variable the developer exports. Nothing else is trimmed (`-c commit.gpgsign=false`, `whole_diff`'s flags, the script's `-u GIT_NOGLOB_PATHSPECS`): each is harmless, and none came in through a finding this spec handles.
13. **R4-5: `place` is left a plain call.** Under `set -e` it ends with status 1 after jq's own message, where it ended with jq's status before. Nothing reads `place`'s failure status: only its header and `docs/scripts.md` name the subcommand. `post-review`'s header sentence is widened to cover a step that fails, with its quote in `docs/scripts.md`, in the same commit.
14. **R4-5's jq wrapper fails the kinds step only** (arguments holding `--rawfile recovered`), not every `--rawfile` as the finding sketches. The gh shim calls `jq --rawfile` itself when it takes a post (`tests/gh-test.sh:337`), so the finding's wrapper would break the shim in the red run, and the case would be red for the wrong reason.
15. **The fixture's build becomes a function, `make_fixture`,** so a case can make the fixture again in a second folder under a hostile environment, as R4-6 and R4-7 propose. Its lines are moved, not changed, and no case is edited.
16. **R4-1 also corrects `recover_hunks`' own comment** (`scripts/redline-gh.sh:333`, "when both commits are here"), beside the three texts the finding names. It states the same condition and was wrong the same way.
17. **Resolving the seven threads after the replies,** as the #97 round did, is asked when the replies are shown.

### Proportionality

- **R4-4.** It needs a developer whose git configuration names an order file that is missing from the repository Redline runs in, and the clone as the source of hunks. Rare. When it fires, every clone-sourced comment loses its thread under a line that says the patch could not be had, which is false, and nothing is printed. The fix is one flag on a line the pull request added and one case. It is in proportion, and the sweep is what keeps it from being a fifth round.
- **R4-5.** It needs a jq older than 1.6, or a failed write in the scratch folder. Rare. When it fires, a whole round is posted with no inline comment and every finding under a false line, exit 0. The fix is a status on a function the pull request rewrote, one guard at its call and one case. It is in proportion.
- **R4-6.** It needs the gate run with `GIT_DIR` or `GIT_INDEX_FILE` set, as from a hook. When it fires, the harness commits into the developer's own repository or rewrites its index. That is data the developer did not offer, so the cost of the full fix is not weighed against rarity. The fix is in `tests/gh-test.sh` only.

### Noted, not in scope

- `GIT_DIR`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` pointed at nothing end the script's diff too (the table). They say which repository git reads, not how it diffs, and a caller who exports them has chosen that repository for every git call the script makes. Left as it is.
- A malformed value (`diff.context=abc`) ends git whatever the command line pins: git refuses the configuration before it reads a flag. That developer's own `git diff` is dead too. Left as it is.
- `place`'s exit status on a failed placement step (decision 13).
- The sweep is of git 2.54.0, the keys and variables its manual lists. A key a later git adds is outside it, and the table says which version it read.

## The sweep

Run on 2026-11-20 with git 2.54.0 (Apple Git-157), by a throwaway script, on this branch at `bc6555f`. The call is the script's own as it stands after Tasks 5 and 6: `env -u GIT_DIFF_OPTS -u GIT_GLOB_PATHSPECS -u GIT_NOGLOB_PATHSPECS -u GIT_ICASE_PATHSPECS -u GIT_ATTR_SOURCE git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M -O/dev/null --no-color --no-ext-diff --no-textconv --text --src-prefix=a/ --dst-prefix=b/ <merge base> <head> -- scripts/redline-gh.sh`, over `950804f..bc6555f` (365 lines of diff, 424 positions). The positions are read by `diff_positions`' own awk.

How to read it:

- A key is set with `git -c`, the command scope, which outranks every configuration file, so one row stands for the key in the system, global, local and worktree files alike. The repository's own files are measured once more in a scratch clone.
- "Same bytes" means the diff is byte for byte the baseline. "Bytes differ, positions same" means the diff's text changed and every position `place` can anchor is the same.
- A row in bold moves a position or ends the call. Every such row is either one an unset answers for, shown without its unset, or one of the three variables that name the repository (Noted, not in scope).

What it found:

- `diff.orderFile` naming a missing file ended the call (exit 128) and `-O/dev/null` cures it (R4-4, the last table).
- `GIT_ATTR_SOURCE` naming a tree the repository does not hold ended the call (exit 128); unset on the call, it does not (decision 10).
- Four settings change bytes and no position: `diff.suppressBlankEmpty`, a driver's `xfuncname` (and the built-in `bash` driver), and `core.abbrev`. None is pinned.
- Nothing else moved a byte: the other 29 `diff.*` values (27 keys, the manual's whole list beside the driver's), 7 driver keys, 64 `core.*` values (61 keys, the manual's whole list), 11 attribute lines, both attribute trees, the repository's own attribute files and configuration, and 70 settings of git(1)'s 69 variables and three it does not list (`GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`, `GIT_TEMPLATE_DIR`).
- Two flags show no difference when taken away here. `-M` has no rename to follow in this repository's history; the harness's pinned-configuration case sets `renames = false` on PR 21's renamed file and is what answers for it (As built, Task 5, records the mutation). `diff.mnemonicPrefix` does not apply to a diff between two commits.

**`diff.*` keys**

| Setting | Covered by | Measured |
|---|---|---|
| `diff.autoRefreshIndex=false` | nothing pinned: read for a diff against the working tree | same bytes |
| `diff.dirstat=files` | nothing pinned: read with `--dirstat` | same bytes |
| `diff.statNameWidth=5` | nothing pinned: read with `--stat` | same bytes |
| `diff.statGraphWidth=5` | nothing pinned: read with `--stat` | same bytes |
| `diff.context=0` | `-U3` | same bytes |
| `diff.interHunkContext=40` | `--inter-hunk-context=0` | same bytes |
| `diff.external=false` | `--no-ext-diff` | same bytes |
| `diff.trustExitCode=true` | `--no-ext-diff`: no external diff runs | same bytes |
| `diff.ignoreSubmodules=all` | nothing pinned: the call names a text file | same bytes |
| `diff.mnemonicPrefix=true` | `--src-prefix=a/ --dst-prefix=b/` | same bytes |
| `diff.noPrefix=true` | `--src-prefix=a/ --dst-prefix=b/` | same bytes |
| `diff.srcPrefix=x/` | `--src-prefix=a/` | same bytes |
| `diff.dstPrefix=y/` | `--dst-prefix=b/` | same bytes |
| `diff.relative=true` | nothing pinned: the script runs from the repository root | same bytes |
| `diff.orderFile=.redline-no-such-orderfile` | `-O/dev/null` (R4-4) | same bytes |
| `diff.renameLimit=1` | nothing pinned: the call names one path, two for a rename | same bytes |
| `diff.renames=false` | `-M` | same bytes |
| `diff.renames=copies` | `-M` | same bytes |
| `diff.suppressBlankEmpty=true` | not pinned: an empty context line loses its leading space, and the positions awk reads it as context either way | bytes differ, positions same |
| `diff.submodule=log` | nothing pinned: the call names a text file | same bytes |
| `diff.wordRegex=.` | nothing pinned: read with `--word-diff` | same bytes |
| `diff.indentHeuristic=false` | `--indent-heuristic` | same bytes |
| `diff.algorithm=patience` | `--diff-algorithm=myers` | same bytes |
| `diff.algorithm=histogram` | `--diff-algorithm=myers` | same bytes |
| `diff.algorithm=minimal` | `--diff-algorithm=myers` | same bytes |
| `diff.wsErrorHighlight=all` | `--no-color` | same bytes |
| `diff.colorMoved=zebra` | `--no-color` | same bytes |
| `diff.colorMovedWS=ignore-all-space` | `--no-color` | same bytes |
| `diff.tool=false` | nothing pinned: read by `git difftool` | same bytes |
| `diff.guitool=false` | nothing pinned: read by `git difftool` | same bytes |

**`diff.<driver>.*` keys, with `core.attributesFile` holding `* diff=foo`**

| Setting | Covered by | Measured |
|---|---|---|
| `diff.foo.command=false` | `--no-ext-diff` | same bytes |
| `diff.foo.trustExitCode=true` | `--no-ext-diff`: no external diff runs | same bytes |
| `diff.foo.xfuncname=^zzz$` | not pinned: the text after a hunk header's second `@@`, which no position reads | bytes differ, positions same |
| `diff.foo.binary=true` | `--text` | same bytes |
| `diff.foo.textconv=sed s/^/x/` | `--no-textconv` | same bytes |
| `diff.foo.wordRegex=.` | nothing pinned: read with `--word-diff` | same bytes |
| `diff.foo.cachetextconv=true` | `--no-textconv` | same bytes |
| `diff.foo.algorithm=patience` | `--diff-algorithm=myers` | same bytes |

**`core.*` keys**

| Setting | Covered by | Measured |
|---|---|---|
| `core.abbrev=4` | not pinned: the length of the `index` line's object names, which no position reads | bytes differ, positions same |
| `core.abbrev=40` | not pinned: the length of the `index` line's object names, which no position reads | bytes differ, positions same |
| `core.alternateRefsCommand=false` | nothing pinned | same bytes |
| `core.alternateRefsPrefixes=x` | nothing pinned | same bytes |
| `core.askPass=false` | nothing pinned | same bytes |
| `core.attributesFile=<scratch>/attr-foo` | `--text`, `--no-textconv`, `--no-ext-diff`, `--diff-algorithm=myers` (see the attribute lines below) | same bytes |
| `core.autocrlf=true` | nothing pinned | same bytes |
| `core.autocrlf=input` | nothing pinned | same bytes |
| `core.bare=true` | nothing pinned | same bytes |
| `core.bigFileThreshold=1` | `--text` (R2-2) | same bytes |
| `core.checkRoundtripEncoding=UTF-16` | nothing pinned | same bytes |
| `core.checkStat=minimal` | nothing pinned | same bytes |
| `core.commentChar=;` | nothing pinned | same bytes |
| `core.commitGraph=false` | nothing pinned | same bytes |
| `core.compression=0` | nothing pinned | same bytes |
| `core.createObject=rename` | nothing pinned | same bytes |
| `core.deltaBaseCacheLimit=1` | nothing pinned | same bytes |
| `core.editor=false` | nothing pinned | same bytes |
| `core.eol=crlf` | nothing pinned | same bytes |
| `core.excludesFile=/dev/null` | nothing pinned | same bytes |
| `core.fileMode=false` | nothing pinned | same bytes |
| `core.filesRefLockTimeout=0` | nothing pinned | same bytes |
| `core.fsmonitor=true` | nothing pinned | same bytes |
| `core.fsmonitor=false` | nothing pinned | same bytes |
| `core.fsmonitorHookVersion=1` | nothing pinned | same bytes |
| `core.fsync=all` | nothing pinned | same bytes |
| `core.fsyncMethod=fsync` | nothing pinned | same bytes |
| `core.fsyncObjectFiles=true` | nothing pinned | same bytes |
| `core.gitProxy=false` | nothing pinned | same bytes |
| `core.hideDotFiles=true` | nothing pinned | same bytes |
| `core.hooksPath=/dev/null` | nothing pinned | same bytes |
| `core.ignoreCase=true` | nothing pinned | same bytes |
| `core.ignoreCase=false` | nothing pinned | same bytes |
| `core.ignoreStat=true` | nothing pinned | same bytes |
| `core.lockfilePid=true` | nothing pinned | same bytes |
| `core.logAllRefUpdates=always` | nothing pinned | same bytes |
| `core.looseCompression=0` | nothing pinned | same bytes |
| `core.maxTreeDepth=1` | nothing pinned | same bytes |
| `core.multiPackIndex=false` | nothing pinned | same bytes |
| `core.notesRef=refs/notes/x` | nothing pinned | same bytes |
| `core.packedGitLimit=1` | nothing pinned | same bytes |
| `core.packedGitWindowSize=1` | nothing pinned | same bytes |
| `core.packedRefsTimeout=0` | nothing pinned | same bytes |
| `core.pager=false` | nothing pinned | same bytes |
| `core.precomposeUnicode=true` | nothing pinned | same bytes |
| `core.precomposeUnicode=false` | nothing pinned | same bytes |
| `core.preferSymlinkRefs=true` | nothing pinned | same bytes |
| `core.preloadIndex=false` | nothing pinned | same bytes |
| `core.protectHFS=true` | nothing pinned | same bytes |
| `core.protectNTFS=true` | nothing pinned | same bytes |
| `core.quotePath=true` | `-c core.quotepath=off` on the call, which outranks every file | same bytes |
| `core.repositoryFormatVersion=99` | nothing pinned | same bytes |
| `core.safecrlf=true` | nothing pinned | same bytes |
| `core.sharedRepository=group` | nothing pinned | same bytes |
| `core.sparseCheckout=true` | nothing pinned | same bytes |
| `core.sparseCheckoutCone=true` | nothing pinned | same bytes |
| `core.splitIndex=true` | nothing pinned | same bytes |
| `core.sshCommand=false` | nothing pinned | same bytes |
| `core.symlinks=false` | nothing pinned | same bytes |
| `core.trustctime=false` | nothing pinned | same bytes |
| `core.unsetenvvars=PATH` | nothing pinned | same bytes |
| `core.untrackedCache=true` | nothing pinned | same bytes |
| `core.useReplaceRefs=false` | nothing pinned | same bytes |
| `core.warnAmbiguousRefs=false` | nothing pinned | same bytes |
| `core.whitespace=cr-at-eol,tabwidth=3` | nothing pinned | same bytes |
| `core.worktree=/nonexistent` | nothing pinned | same bytes |

**Attribute lines, one at a time in `core.attributesFile`, the `foo` driver's `binary`, `textconv`, `command` and `algorithm` keys all set**

| Setting | Covered by | Measured |
|---|---|---|
| `* -diff` | `--text` (R2-2) | same bytes |
| `* binary` | `--text` (R2-2) | same bytes |
| `* -text` | nothing pinned: not a diff attribute | same bytes |
| `* text eol=crlf` | nothing pinned: not a diff attribute | same bytes |
| `* working-tree-encoding=UTF-16` | nothing pinned: not a diff attribute | same bytes |
| `* ident` | nothing pinned: not a diff attribute | same bytes |
| `* filter=x` | nothing pinned: not a diff attribute | same bytes |
| `* whitespace=-trailing-space` | nothing pinned: not a diff attribute | same bytes |
| `* diff=foo` | `--no-textconv`, `--no-ext-diff`, `--text`, `--diff-algorithm=myers` | same bytes |
| `* diff=bash` | `--no-textconv`, `--no-ext-diff`, `--text`, `--diff-algorithm=myers` | bytes differ, positions same |
| `* merge=binary` | nothing pinned: not a diff attribute | same bytes |
| `* export-subst` | nothing pinned: not a diff attribute | same bytes |

**Attribute sources by tree**

| Setting | Covered by | Measured |
|---|---|---|
| `attr.tree=<does not resolve>` | `--text`, `--no-textconv`, `--no-ext-diff`, `--diff-algorithm=myers` | same bytes |
| `attr.tree=<a commit here>` | `--text`, `--no-textconv`, `--no-ext-diff`, `--diff-algorithm=myers` | same bytes |

**Attribute files of the repository itself, in a scratch clone**

| Setting | Covered by | Measured |
|---|---|---|
| `the clone, nothing set` | the same call in a second clone | same bytes |
| `.git/info/attributes: * -diff` | `--text` (R2-2) | same bytes |
| `.git/info/attributes: * diff=foo, driver keys set` | `--text`, `--no-textconv`, `--no-ext-diff` | same bytes |
| `in-tree .gitattributes: * -diff` | `--text` (R2-2) | same bytes |

**The repository's own configuration, in the scratch clone**

| Setting | Covered by | Measured |
|---|---|---|
| `local diff.orderFile (missing), diff.context=0, diff.noprefix` | every pinned flag: a file scope is outranked by the command line | same bytes |
| `the same clone, global and system shut out, no pinned flag` | nothing: the call a round would have made with configuration shut out and no flag | fatal: failed to read orderfile '.redline-no-such-orderfile': No such file or directory |

**git(1)'s variables, each exported for the call**

| Setting | Covered by | Measured |
|---|---|---|
| `GIT_ADVICE=0` | nothing pinned | same bytes |
| `GIT_ALLOW_PROTOCOL=none` | nothing pinned | same bytes |
| `GIT_ALTERNATE_OBJECT_DIRECTORIES=/nonexistent` | nothing pinned | same bytes |
| `GIT_ASKPASS=false` | nothing pinned | same bytes |
| `GIT_ATTR_SOURCE=refs/heads/redline-no-such-ref` | unset on the call (Task 6) | same bytes |
| `GIT_ATTR_SOURCE=<a commit here>` | unset on the call (Task 6) | same bytes |
| `GIT_AUTHOR_DATE=@1` | nothing pinned | same bytes |
| `GIT_AUTHOR_EMAIL=x@example.invalid` | nothing pinned | same bytes |
| `GIT_AUTHOR_NAME=x` | nothing pinned | same bytes |
| `GIT_CEILING_DIRECTORIES=/` | nothing pinned | same bytes |
| `GIT_COMMIT_GRAPH_PARANOIA=1` | nothing pinned | same bytes |
| `GIT_COMMITTER_DATE=@1` | nothing pinned | same bytes |
| `GIT_COMMITTER_EMAIL=x@example.invalid` | nothing pinned | same bytes |
| `GIT_COMMITTER_NAME=x` | nothing pinned | same bytes |
| `GIT_COMMON_DIR=/nonexistent` | not covered: it names the repository git reads | **exit 129** |
| `GIT_CONFIG_GLOBAL=/dev/null` | configuration: covered key by key above | same bytes |
| `GIT_CONFIG_NOSYSTEM=1` | configuration: covered key by key above | same bytes |
| `GIT_DEFAULT_HASH=sha256` | nothing pinned | same bytes |
| `GIT_DEFAULT_REF_FORMAT=reftable` | nothing pinned | same bytes |
| `GIT_DIFF_OPTS=-u0` | unset on the call (R1-4) | same bytes |
| `GIT_DIFF_PATH_COUNTER=9` | nothing pinned | same bytes |
| `GIT_DIFF_PATH_TOTAL=9` | nothing pinned | same bytes |
| `GIT_DIR=/nonexistent` | not covered: it names the repository git reads, which is the caller's choice | **exit 129** |
| `GIT_DISCOVERY_ACROSS_FILESYSTEM=0` | nothing pinned | same bytes |
| `GIT_EDITOR=false` | nothing pinned | same bytes |
| `GIT_EXTERNAL_DIFF=false` | `--no-ext-diff` | same bytes |
| `GIT_EXTERNAL_DIFF_TRUST_EXIT_CODE=1` | `--no-ext-diff`: no external diff runs | same bytes |
| `GIT_FLUSH=1` | nothing pinned | same bytes |
| `GIT_GLOB_PATHSPECS=1` | unset on the call (R3-1) | same bytes |
| `GIT_ICASE_PATHSPECS=1` | unset on the call (R3-1) | same bytes |
| `GIT_INDEX_FILE=/nonexistent/index` | nothing pinned: the diff is between two commits | same bytes |
| `GIT_INDEX_VERSION=4` | nothing pinned | same bytes |
| `GIT_LITERAL_PATHSPECS=0` | `--literal-pathspecs` on the call | same bytes |
| `GIT_MERGE_VERBOSITY=5` | nothing pinned | same bytes |
| `GIT_NAMESPACE=x` | nothing pinned | same bytes |
| `GIT_NO_LAZY_FETCH=1` | nothing pinned | same bytes |
| `GIT_NO_REPLACE_OBJECTS=1` | nothing pinned | same bytes |
| `GIT_NOGLOB_PATHSPECS=1` | unset on the call (R3-1) | same bytes |
| `GIT_OBJECT_DIRECTORY=/nonexistent` | not covered: it names the repository git reads | **exit 129** |
| `GIT_OPTIONAL_LOCKS=0` | nothing pinned | same bytes |
| `GIT_PAGER=false` | nothing pinned: the output is not a terminal | same bytes |
| `GIT_PRINT_SHA1_ELLIPSIS=yes` | nothing pinned | same bytes |
| `GIT_PROGRESS_DELAY=0` | nothing pinned | same bytes |
| `GIT_PROTOCOL=version=2` | nothing pinned | same bytes |
| `GIT_PROTOCOL_FROM_USER=0` | nothing pinned | same bytes |
| `GIT_REDIRECT_STDIN=/dev/null` | nothing pinned | same bytes |
| `GIT_REF_PARANOIA=1` | nothing pinned | same bytes |
| `GIT_REFERENCE_BACKEND=reftable` | nothing pinned | same bytes |
| `GIT_REFLOG_ACTION=x` | nothing pinned | same bytes |
| `GIT_SEQUENCE_EDITOR=false` | nothing pinned | same bytes |
| `GIT_SSH=false` | nothing pinned | same bytes |
| `GIT_SSH_VARIANT=ssh` | nothing pinned | same bytes |
| `GIT_SSL_NO_VERIFY=1` | nothing pinned | same bytes |
| `GIT_TERMINAL_PROMPT=0` | nothing pinned | same bytes |
| `GIT_TRACE=1` | nothing pinned | same bytes |
| `GIT_TRACE2=1` | nothing pinned | same bytes |
| `GIT_TRACE2_EVENT=1` | nothing pinned | same bytes |
| `GIT_TRACE2_PERF=1` | nothing pinned | same bytes |
| `GIT_TRACE_CURL=1` | nothing pinned | same bytes |
| `GIT_TRACE_CURL_NO_DATA=1` | nothing pinned | same bytes |
| `GIT_TRACE_FSMONITOR=1` | nothing pinned | same bytes |
| `GIT_TRACE_PACK_ACCESS=1` | nothing pinned | same bytes |
| `GIT_TRACE_PACKET=1` | nothing pinned | same bytes |
| `GIT_TRACE_PACKFILE=1` | nothing pinned | same bytes |
| `GIT_TRACE_PERFORMANCE=1` | nothing pinned | same bytes |
| `GIT_TRACE_REDACT=0` | nothing pinned | same bytes |
| `GIT_TRACE_REFS=1` | nothing pinned | same bytes |
| `GIT_TRACE_SETUP=1` | nothing pinned | same bytes |
| `GIT_TRACE_SHALLOW=1` | nothing pinned | same bytes |
| `GIT_WORK_TREE=/nonexistent` | nothing pinned: the diff is between two commits | same bytes |
| `GIT_CONFIG_COUNT=1` | configuration (`diff.context=0` given this way): `-U3` | same bytes |
| `GIT_CONFIG_PARAMETERS='diff.context=0'` | configuration (`diff.context=0` given this way): `-U3` | same bytes |
| `GIT_TEMPLATE_DIR=/nonexistent` | nothing pinned | same bytes |

**Each unset taken away: the variable exported, the call without its `-u`**

| Setting | Covered by | Measured |
|---|---|---|
| `GIT_DIFF_OPTS=-u0, no unset` | the `-u` this row takes away | **positions differ** |
| `GIT_GLOB_PATHSPECS=1, no unset` | the `-u` this row takes away | **exit 128** |
| `GIT_NOGLOB_PATHSPECS=1, no unset` | the `-u` this row takes away | same bytes |
| `GIT_ICASE_PATHSPECS=1, no unset` | the `-u` this row takes away | **exit 128** |
| `GIT_ATTR_SOURCE=refs/heads/redline-no-such-ref, no unset` | the `-u` this row takes away | **exit 128** |

**Each pinned flag taken away, under the setting it answers for** (the whole diff `a8c7f56..bc6555f`, 475 files)

| Flag | Setting | Without the flag | With it |
|---|---|---|---|
| `--diff-algorithm=myers` | `diff.algorithm=patience` | differs | same |
| `--diff-algorithm=myers` | `diff.algorithm=histogram` | differs | same |
| `-U3` | `diff.context=0` | differs | same |
| `--inter-hunk-context=0` | `diff.interHunkContext=40` | differs | same |
| `--indent-heuristic` | `diff.indentHeuristic=false` | differs | same |
| `-M` | `diff.renames=false` | same | same |
| `-O/dev/null` | `diff.orderFile=<missing>` | exit 128 | same |
| `--no-color` | `color.diff=always` | differs | same |
| `--no-ext-diff` | `diff.external=false` | exit 128 | same |
| `--no-textconv` | `diff=foo, diff.foo.textconv` | differs | same |
| `--text` | `a -diff attribute` | differs | same |
| `--text` | `core.bigFileThreshold=1` | differs | same |
| `--src-prefix=a/ --dst-prefix=b/` | `diff.noPrefix=true` | differs | same |
| `--src-prefix=a/ --dst-prefix=b/` | `diff.mnemonicPrefix=true` | same | same |

## For you to decide when the replies are shown

Whether the seven threads are resolved after the replies (decision 17). `scripts/redline-gh.sh resolve-threads 112 <the seven comment ids> <the seven reply ids>` resolves a thread only when every comment in it is Redline's.

## Standards retrospective (proposed)

All five edits below were approved by @michaelfromtheoutfit, E1 as a new line in `workflow/agents.md` after line 9, and landed in `195970d`.

Gate step 12, item by item: the decisions above, the As built deviations, and the checks that went red. Drafted while shaping, and E3 redrafted after Task 8, whose hook proof went red on the shaped `hgit` and taught the `unset` lesson.

**Already in a standard:**

- Decision 3 (version kept): `process/release.md`, and the gate's step 11.
- Decision 4 (red first; a pin that cannot be red is seen red under a mutation): `testing/tests.md`, line 35.
- Decision 5 (CI's shellcheck command before a push that changes a `.sh` file): `scripts/bash-conventions.md`, the shellcheck line.
- Decision 6 (replies in Redline's form): `workflow/agents.md`, line 29.
- Decision 8 (no attribution): `prompts/attribution.md`.
- Decisions 13 and 16, and R4-1 (a header and its quote in `docs/scripts.md` change in one commit): `scripts/bash-conventions.md`, the header line.
- Decision 14 (a case is red for its own reason): `testing/tests.md`, red before green.

**Missing or contradicted**, each drafted as a clause on the line named:

- **E1**, the class lesson, a new line (decisions 2, 7, 9 and 11): a finding of a class an earlier round of the same pull request already fixed is fixed as the class, not as one more instance: name the promise the earlier fixes each patched, list every member of the class from its source (git-config(1)'s `diff.*` and `core.*` keys, git(1)'s variables), set each against the code and record the table in `shape.md`, and take a mechanism that needs no list where one exists (a prefix unset over named variables). #112 took one flag or one variable a round on two classes for four rounds (R1-4, R2-2, R3-1, R4-4; R2-4, R3-3, R4-6, R4-7), and the round cap ended the run with both open.
- **E2**, `scripts/bash-conventions.md:37` (decisions 9 and 10; contradicted in part: "so the user's git configuration cannot move a hunk" did not hold for `diff.orderFile` or `GIT_ATTR_SOURCE`): add `-O/dev/null` and the `GIT_ATTR_SOURCE` unset with their reasons, and end the account on what was measured, the sweep of git 2.54's documented keys and variables, in place of the unbounded promise.
- **E3**, `testing/tests.md:38` (decisions 11 and 12, and Task 8's deviation; contradicted in part: its list of named variables): `hgit` by channel (every `GIT_` variable found by prefix and taken out with `env -u`, the global and system files, the per-user attributes and ignore files, no hook); why `env -u` and never `unset`, and that a helper meant to stand alone is proven with its backstop taken away; the unset at the top of the harness and why the script under test gets it; and a case that makes the fixture again for each way in; the R2-4 and R3-3 history kept.
- **E4**, `scripts/bash-conventions.md`, the `set -e` line (decision 1, R4-5): a function whose output a command substitution captures returns non-zero when a step fails, and the caller reads that status; a check of the output's shape cannot see a failed step that left a well-formed result.
- **E5**, `process/standards-retrospective.md` (R4-2, R4-3): a clause appended to a standards line is read back in the whole line, closing what it opens and replacing the citation it supersedes.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, as the pull request's spec read it: a finding's thread is where a decision is answered and a decline overruled. R4-4 and R4-5 keep a finding on a patch-less file in the thread the pull request promises; R4-1 keeps the texts true; R4-6 and R4-7 keep the harness from writing outside its own folder.

## Standards Applied

- process/docs-gate — every touched plugin file names its README or docs section, or says why there is no reader-facing change.
- process/standards-retrospective — the gate's step 12; a round finished by hand still owes its record in the same pull request.
- process/release — the version stays 0.4.3 on purpose (decision 3).
- prompts/attribution — the commits, the spec and the seven replies carry no model or vendor name (decision 8).
- scripts/bash-conventions — the pinned `git diff` (line 37); a header and its quote change together; bash 3.2 and BSD tools; CI's shellcheck command.
- testing/tests — red before green, a mutation for a pin that cannot be red; the gh harness's fake `gh`; the harness's own git (line 38); the tests write only under the temp directory.
- workflow/agents — the evidence of a disposition is the Redline reply answering the finding (line 29).
