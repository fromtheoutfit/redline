# PR #137, round 4 by hand — Shaping Notes

## Scope

Redline's run on pull request #137 (#135, 0.5.1) stopped at its cap of 3 revise rounds. Round 4's review, of the fix diff `9532f9d..148c672` and the whole pull request at `148c672`, left four findings open: R4-1, R4-2 and R4-3 (correctness) and R4-4 (a nit). No further Redline run follows. This spec fixes the four by hand and closes the pull request.

Three of the four are one more member of a class an earlier round had already met. So each class is settled once here, by a table measured by running, before any fix:

- **A.** Every place `scripts/redline-prefs.sh` and `scripts/redline-setup.sh` read a list of paths from git (R3-4, R4-1).
- **B.** Every reader of a version fact (R1-4, R3-5, R4-2).
- **C.** Every sentence the pull request added that tells the person what happens next (R1-7, R1-8, R4-3, R4-4).

Read before shaping: the four round reviews, all 23 threads and the cap-hit comment on #137 (every thread is unresolved; R4-2, R4-3 and R4-4 have no reply, and R4-1 sits in the round 4 review body), the three round folders on this branch and round 4's `redline/`.

Out of scope, by the brief: #138, #136, #133, #129. Table C shows #138 sharing a reader (decision 3); the other three share none.

## Decisions

From the brief:

1. Fix R4-1, R4-2, R4-3 and R4-4. The cases the earlier rounds added stay as they are, unedited, as proof.
2. The three class questions above, each settled once by a table here.
3. The version stays 0.5.1 and the template is not touched.
4. After the build, the replies are drafted in Redline's form in this folder and shown to the person, who posts them through a session after the push.

Decided by: @michaelfromtheoutfit

The person's answers, asked one at a time on 2026-11-27:

- **1. The gate's reads (table A).** `run check` reads both of its lists with `-z`. That closes R4-1 for a name only `git status` quotes or cuts. For a name `git diff --name-only` quotes too, the gate's git block still lists the file in git's quoted spelling, so a resume that `run check` now accepts stops at the check. This round leaves the template alone: a line under Known limits in the README says so, and the template's reads go to a drafted issue (For you to open, 1). Rider, as the person put it: "In the drafted issue, say first what a pull request whose own files include a name git quotes does at the gate on an ordinary round, resume or not, as you measured it."
  - Decided by: @michaelfromtheoutfit
- **2. The workflow's own check of `args.launch` (table B).** It keeps its throw. The precheck stops the one way the skill reaches it (R3-5), so only hand-built args reach it, as with every other args check in the workflow. Loop-test 17a's seven malformed cases stay unedited.
  - Decided by: @michaelfromtheoutfit
- **3. The cell #138 tracks (table C).** Left to #138. The table marks it, and a comment for #138 is drafted (For you to add).
  - Decided by: @michaelfromtheoutfit
- **4. R1-5 and R2-4.** Both can be measured here, and are, as the first build task. Rider, as the person put it: "Tell me when the registry is about to change, and show me the diff against the backup when it is restored, before the first result." Each result is then put as one question.
  - Decided by: @michaelfromtheoutfit
- **5. Round 3's R3-6 case.** `tests/setup-test.sh` pins the installs warning whole in the case "installs: both are labelled this session's, and only the older one is updated (#137, R3-6)", and its fixture holds an install at 0.4.3, so its tail is the sentence R4-3 corrects. Its tail only changes. The labels, the update command, the fixture and the case's name stay. It is the one round case this spec edits.
  - Decided by: @michaelfromtheoutfit

Approved with the plan:

- **6. R4-2 is fixed where the fact is first read, and R3-5 with it.** `version_plugin` reads the loaded copy's version from its `plugin.json` and its `REDLINE_VERSION` from its workflow file. `redline-setup.sh version <repoRoot>` exits 2 with one line naming both files and both values when the manifest's version is absent, is not a string, or is not the constant. Either quote style of the constant is read, so a copy that launches today is not newly refused. The skill's precheck no longer reads every exit 2 as "not set up": it says the script's line and stops. R3-5's decline (round 3) is superseded, and its thread gets a follow-up reply.
- **7. One case of the #135 build changes its fixture.** "a copy at another version reports its own version, blob and root (#135)" builds a copy at 9.8.7 whose workflow still says 0.5.1, which is R4-2's state. The fixture's constant becomes 9.8.7 and the expectation stays; the old fixture is a new case that expects exit 2.
- **8. R4-3's line names the installs it is about.** An install the session could switch onto that is older than 0.5.1 is named, with what a switch onto it does. The line's ending is not touched.
- **9. A staged rename keeps today's reading in `run check`.** The destination is the path; the source is read and dropped. Pinned as the neighbouring decision.

Decided by: @michaelfromtheoutfit

## How the tables were built

Each table is the output of a scratch script, or of a run named in its row, never a reading of the code. The scripts and their raw output were in the shaping session's scratchpad (`A/table-a.sh`, `A/template.sh`, `A/hand-gate.sh`, `B/table-b.sh`, `B/run-wf.mjs`, `C/older-skill.sh`, `C/cells.sh`). They build throwaway repositories under the system temp directory, as `tests/prefs-test.sh` does, and run the scripts of this checkout at `01e60ad`. Measured on macOS, git 2.54.0, jq 1.8.2, bash 3.2, Claude Code 2.1.332. `core.quotePath` is unset here, so it is at its default.

The "Today" columns were measured before any change. At the gate the same scripts run again on the built tree, and an "As built" column is added.

## Table A: lists of paths read from git

**The members.** `scripts/redline-prefs.sh` reads a list of paths from git in four places. `scripts/redline-setup.sh` reads none: its one git call is `git hash-object`.

| Read | Where | `-z` today |
|---|---|---|
| `git diff -z --name-only <start> -- agents/` | `run drift`, the agent list | yes (R3-4) |
| `git ls-files -z --others --exclude-standard -- agents/` | `run drift`, the agent list | yes (R3-4) |
| `git diff --name-only <marker head> <HEAD>` | `run check`, the hand list | no |
| `git status --porcelain --untracked-files=all`, then `cut -c4-` and `sed 's/^.* -> //'` | `run check`, the untracked list | no |

**The names.** One real file of each kind: plain ASCII, a byte above 0x7f (`zé`), a double quote, a backslash, a tab, a newline, a space, and the text ` -> `. In the table a tab shows as ⇥ and a newline as ⏎. Each name is run through each read: a hand commit under `.claude/redline/` after an error stop, an untracked file in the run's own folder, an untracked file outside it, and an agent file on the plugin's own repository, untracked and then committed. Three more rows run a staged rename.

**Rows: 43, counted from the output.**

| # | Read | Kind of name | File | Today |
|---|---|---|---|---|
| 1 | check: hand list (diff --name-only) | plain ASCII | `.claude/redline/plain.json` | exit 0 ok=true reason= hand.paths=[".claude/redline/plain.json"] |
| 2 | check: untracked list (status --porcelain), untracked in the run's folder | plain ASCII | `<run folder>/redline/plain.md` | exit 0 ok=true reason= untracked=["<run folder>/redline/plain.md"] |
| 3 | check: untracked list (status --porcelain), untracked outside the run's folders | plain ASCII | `notes/plain.md` | exit 1 ok=false reason=untracked untracked=["notes/plain.md"] line=commit or remove notes/plain.md, or start fresh |
| 4 | drift: agent list, untracked (ls-files -z --others) | plain ASCII | `agents/plain.md` | exit 0 launch=name agents=["agents/plain.md"] |
| 5 | drift: agent list, committed (diff -z --name-only) | plain ASCII | `agents/plain.md` | exit 0 launch=name agents=["agents/plain.md"] |
| 6 | check: hand list (diff --name-only) | a byte above 0x7f | `.claude/redline/zé.json` | exit 1 ok=false reason=head-moved hand.paths=["\".claude/redline/z\\303\\251.json\""] line=1 commit since the run stopped touch ".claude/redline/z\303\251.json" outside .claude/; start fresh after committing or removing <run folder> |
| 7 | check: untracked list (status --porcelain), untracked in the run's folder | a byte above 0x7f | `<run folder>/redline/zé.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z\\303\\251.md\""] line=commit or remove "<run folder>/redline/z\303\251.md", or start fresh |
| 8 | check: untracked list (status --porcelain), untracked outside the run's folders | a byte above 0x7f | `notes/zé.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z\\303\\251.md\""] line=commit or remove "notes/z\303\251.md", or start fresh |
| 9 | drift: agent list, untracked (ls-files -z --others) | a byte above 0x7f | `agents/zé.md` | exit 0 launch=name agents=["agents/zé.md"] |
| 10 | drift: agent list, committed (diff -z --name-only) | a byte above 0x7f | `agents/zé.md` | exit 0 launch=name agents=["agents/zé.md"] |
| 11 | check: hand list (diff --name-only) | a double quote | `.claude/redline/z"q.json` | exit 1 ok=false reason=head-moved hand.paths=["\".claude/redline/z\\\"q.json\""] line=1 commit since the run stopped touch ".claude/redline/z\"q.json" outside .claude/; start fresh after committing or removing <run folder> |
| 12 | check: untracked list (status --porcelain), untracked in the run's folder | a double quote | `<run folder>/redline/z"q.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z\\\"q.md\""] line=commit or remove "<run folder>/redline/z\"q.md", or start fresh |
| 13 | check: untracked list (status --porcelain), untracked outside the run's folders | a double quote | `notes/z"q.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z\\\"q.md\""] line=commit or remove "notes/z\"q.md", or start fresh |
| 14 | drift: agent list, untracked (ls-files -z --others) | a double quote | `agents/z"q.md` | exit 0 launch=name agents=["agents/z\"q.md"] |
| 15 | drift: agent list, committed (diff -z --name-only) | a double quote | `agents/z"q.md` | exit 0 launch=name agents=["agents/z\"q.md"] |
| 16 | check: hand list (diff --name-only) | a backslash | `.claude/redline/z\q.json` | exit 1 ok=false reason=head-moved hand.paths=["\".claude/redline/z\\\\q.json\""] line=1 commit since the run stopped touch ".claude/redline/z\\q.json" outside .claude/; start fresh after committing or removing <run folder> |
| 17 | check: untracked list (status --porcelain), untracked in the run's folder | a backslash | `<run folder>/redline/z\q.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z\\\\q.md\""] line=commit or remove "<run folder>/redline/z\\q.md", or start fresh |
| 18 | check: untracked list (status --porcelain), untracked outside the run's folders | a backslash | `notes/z\q.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z\\\\q.md\""] line=commit or remove "notes/z\\q.md", or start fresh |
| 19 | drift: agent list, untracked (ls-files -z --others) | a backslash | `agents/z\q.md` | exit 0 launch=name agents=["agents/z\\q.md"] |
| 20 | drift: agent list, committed (diff -z --name-only) | a backslash | `agents/z\q.md` | exit 0 launch=name agents=["agents/z\\q.md"] |
| 21 | check: hand list (diff --name-only) | a tab (control character) | `.claude/redline/z⇥q.json` | exit 1 ok=false reason=head-moved hand.paths=["\".claude/redline/z\\tq.json\""] line=1 commit since the run stopped touch ".claude/redline/z\tq.json" outside .claude/; start fresh after committing or removing <run folder> |
| 22 | check: untracked list (status --porcelain), untracked in the run's folder | a tab (control character) | `<run folder>/redline/z⇥q.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z\\tq.md\""] line=commit or remove "<run folder>/redline/z\tq.md", or start fresh |
| 23 | check: untracked list (status --porcelain), untracked outside the run's folders | a tab (control character) | `notes/z⇥q.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z\\tq.md\""] line=commit or remove "notes/z\tq.md", or start fresh |
| 24 | drift: agent list, untracked (ls-files -z --others) | a tab (control character) | `agents/z⇥q.md` | exit 0 launch=name agents=["agents/z\tq.md"] |
| 25 | drift: agent list, committed (diff -z --name-only) | a tab (control character) | `agents/z⇥q.md` | exit 0 launch=name agents=["agents/z\tq.md"] |
| 26 | check: hand list (diff --name-only) | a newline (control character) | `.claude/redline/z⏎q.json` | exit 1 ok=false reason=head-moved hand.paths=["\".claude/redline/z\\nq.json\""] line=1 commit since the run stopped touch ".claude/redline/z\nq.json" outside .claude/; start fresh after committing or removing <run folder> |
| 27 | check: untracked list (status --porcelain), untracked in the run's folder | a newline (control character) | `<run folder>/redline/z⏎q.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z\\nq.md\""] line=commit or remove "<run folder>/redline/z\nq.md", or start fresh |
| 28 | check: untracked list (status --porcelain), untracked outside the run's folders | a newline (control character) | `notes/z⏎q.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z\\nq.md\""] line=commit or remove "notes/z\nq.md", or start fresh |
| 29 | drift: agent list, untracked (ls-files -z --others) | a newline (control character) | `agents/z⏎q.md` | exit 0 launch=name agents=["agents/z\nq.md"] |
| 30 | drift: agent list, committed (diff -z --name-only) | a newline (control character) | `agents/z⏎q.md` | exit 0 launch=name agents=["agents/z\nq.md"] |
| 31 | check: hand list (diff --name-only) | a space | `.claude/redline/z q.json` | exit 0 ok=true reason= hand.paths=[".claude/redline/z q.json"] |
| 32 | check: untracked list (status --porcelain), untracked in the run's folder | a space | `<run folder>/redline/z q.md` | exit 1 ok=false reason=untracked untracked=["\"<run folder>/redline/z q.md\""] line=commit or remove "<run folder>/redline/z q.md", or start fresh |
| 33 | check: untracked list (status --porcelain), untracked outside the run's folders | a space | `notes/z q.md` | exit 1 ok=false reason=untracked untracked=["\"notes/z q.md\""] line=commit or remove "notes/z q.md", or start fresh |
| 34 | drift: agent list, untracked (ls-files -z --others) | a space | `agents/z q.md` | exit 0 launch=name agents=["agents/z q.md"] |
| 35 | drift: agent list, committed (diff -z --name-only) | a space | `agents/z q.md` | exit 0 launch=name agents=["agents/z q.md"] |
| 36 | check: hand list (diff --name-only) | the text ' -> ' | `.claude/redline/a -> b.json` | exit 0 ok=true reason= hand.paths=[".claude/redline/a -> b.json"] |
| 37 | check: untracked list (status --porcelain), untracked in the run's folder | the text ' -> ' | `<run folder>/redline/a -> b.md` | exit 1 ok=false reason=untracked untracked=["b.md\""] line=commit or remove b.md", or start fresh |
| 38 | check: untracked list (status --porcelain), untracked outside the run's folders | the text ' -> ' | `notes/a -> b.md` | exit 1 ok=false reason=untracked untracked=["b.md\""] line=commit or remove b.md", or start fresh |
| 39 | drift: agent list, untracked (ls-files -z --others) | the text ' -> ' | `agents/a -> b.md` | exit 0 launch=name agents=["agents/a -> b.md"] |
| 40 | drift: agent list, committed (diff -z --name-only) | the text ' -> ' | `agents/a -> b.md` | exit 0 launch=name agents=["agents/a -> b.md"] |
| 41 | check: untracked list (status --porcelain), a staged rename to a quoted name, a modified and a deleted file, all in the run's folder | rename | `<run folder>/redline/old.md -> new é.md` | exit 1 ok=false reason=untracked untracked=["<run folder>/redline/del.md","<run folder>/redline/mod.md","\"<run folder>/redline/new \\303\\251.md\""] line=commit or remove "<run folder>/redline/new \303\251.md", or start fresh |
| 42 | check: untracked list (status --porcelain), a staged rename out of the run's folder | rename | `<run folder>/redline/old.md -> notes/moved.md` | exit 1 ok=false reason=untracked untracked=["notes/moved.md"] line=commit or remove notes/moved.md, or start fresh |
| 43 | check: untracked list (status --porcelain), a staged rename into the run's folder from outside | rename | `notes/old.md -> <run folder>/redline/moved.md` | exit 0 ok=true reason= untracked=["<run folder>/redline/moved.md"] line= |

**What it shows.**

- `run drift`'s two reads list every kind of name as it is named (16 rows).
- `run check`'s hand list refuses a hand fix the rule allows for five kinds: a byte above 0x7f, a double quote, a backslash, a tab and a newline. The line says the commit touches a path "outside .claude/". A space and ` -> ` pass: `git diff --name-only` quotes neither.
- `run check`'s untracked list refuses a file in the run's own folder for seven kinds: those five, a space, which `git status` quotes, and ` -> `, which the `sed` meant for a rename cuts the name at.
- A staged rename is read by its destination alone (rows 41 to 43). That stays.

### The other scripts

| Script | Read | What a name git quotes does there |
|---|---|---|
| `scripts/checks-template.sh`, the git block's changed list | `git diff --name-only <start_sha>` and `git ls-files --others --exclude-standard`, no `-z` | Measured with a generated `checks.sh` (`A/template.sh`): a committed change to `docs/zé.md`, the one file the snapshot allows, gives `unexpected_files: ["\"docs/z\\303\\251.md\""]` and exit 1. `docs/plain.md` and `docs/z q.md` give `[]` and exit 0 |
| `scripts/checks-template.sh`, `tree_state` | `git status --porcelain=v1 -z`, turned into lines with `tr` | The same three files, modified and uncommitted, are each listed under `uncommitted` as named. A name holding a newline would split, and one holding ` -> ` would be cut by the same `sed`; neither was run |
| `scripts/checks-template.sh`, the untracked line count | `git ls-files --others --exclude-standard -z` into `xargs -0` | Reads with `-z` |
| `scripts/redline-gh.sh`, `recover_hunks` | a diff, not a list: `git -c core.quotepath=off diff ... -- <path>` | Its header records the limit: a path git quotes regardless is found by neither source and stays without hunks (#112) |
| `scripts/redline-guard.sh`, `redline-gate.sh`, `redline-background.sh` | none | |

**The gate against the hand list** (`A/hand-gate.sh`). The workflow excuses a hand-committed path by exact string against the gate's `unexpected_files`. A hand commit to `.claude/redline/plain.json` or `.claude/redline/z q.json` is listed by the gate as named. One to `.claude/redline/zé.json` is listed as `"\".claude/redline/z\\303\\251.json\""`, which no hand list that names the file can match. So with `run check` fixed, a resume with such a name stops at the check (decision 1).

The template is not touched here (the brief's decision 3). What was found there is drafted under "For you to open", 1.

## Table B: readers of a version fact

**The facts.** The version in `.claude-plugin/plugin.json`; the marketplace entry's; `REDLINE_VERSION` in `workflows/redline-loop.js`; `args.launch`; a marker's `args.launch`, and the manifest of the release it was launched from; an install's, as `claude plugin list --json` prints it.

**The readers.** Eight, each run with the fact absent, not a string, and disagreeing with another:

1. `redline-setup.sh version` (`version_plugin`), followed through the launch it records: its `plugin.version` and `plugin.workflow` are passed to the same copy's workflow as `args.launch`, run to its first agent call by `B/run-wf.mjs`.
2. The marketplace entry, which nothing reads at run time: `version`, then `claude plugin validate`.
3. `run check` and `run drift` (`version_line`), the session's copy's manifest.
4. The same, the marker's `args.launch`.
5. The same, the manifest of the release a marker with no launch came from.
6. `run check` and `run drift` (`copy_line`), the session's copy's manifest, for its line.
7. The workflow at startup.
8. `redline-setup.sh version` (`version_installs`), an install's version.

**Rows: 60, counted from the output.** `<tmp>` stands for the fixture's directory, `<blob>` for a blob id, and `...` for the middle of a line quoted whole elsewhere in this table.

| # | Reader | Fact | Condition | Today |
|---|---|---|---|---|
| 1 | setup version (version_plugin), then the launch it records | plugin.json | as shipped | version exit 0, plugin.version "0.5.1" -> workflow: starts: reaches its first agent |
| 2 | setup version (version_plugin), then the launch it records | plugin.json | absent | version exit 0, plugin.version "" -> workflow: THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"","workflow":"<blob>"} |
| 3 | setup version (version_plugin), then the launch it records | plugin.json | null | version exit 0, plugin.version "" -> workflow: THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"","workflow":"<blob>"} |
| 4 | setup version (version_plugin), then the launch it records | plugin.json | an empty string | version exit 0, plugin.version "" -> workflow: THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"","workflow":"<blob>"} |
| 5 | setup version (version_plugin), then the launch it records | plugin.json | a number (5) | version exit 0, plugin.version "5" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record Redline 5: ... Nothing on GitHub is lost. |
| 6 | setup version (version_plugin), then the launch it records | plugin.json | false | version exit 0, plugin.version "" -> workflow: THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"","workflow":"<blob>"} |
| 7 | setup version (version_plugin), then the launch it records | plugin.json | an object | version exit 0, plugin.version "{\n  \"major\": 0\n}" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record Redline {   "major": 0 }: ... Nothing on GitHub is lost. |
| 8 | setup version (version_plugin), then the launch it records | plugin.json | an array | version exit 0, plugin.version "[\n  \"0.5.1\"\n]" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record Redline [   "0.5.1" ]: ... Nothing on GitHub is lost. |
| 9 | setup version (version_plugin), then the launch it records | plugin.json | disagrees with REDLINE_VERSION (0.5.2 against 0.5.1; R4-2) | version exit 0, plugin.version "0.5.2" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record Redline 0.5.2: ... Nothing on GitHub is lost. |
| 10 | setup version (version_plugin), then the launch it records | REDLINE_VERSION | disagrees with plugin.json (0.5.0 against 0.5.1) | version exit 0, plugin.version "0.5.1" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5.0 workflow is running, and this run's args record Redline 0.5.1: ... Nothing on GitHub is lost. |
| 11 | setup version (version_plugin), then the launch it records | REDLINE_VERSION | absent | version exit 0, plugin.version "0.5.1" -> workflow: THROWS: REDLINE_VERSION is not defined |
| 12 | setup version (version_plugin), then the launch it records | REDLINE_VERSION | not a string (0.5) | version exit 0, plugin.version "0.5.1" -> workflow: refused at stage relaunch, resumeFrom null: The Redline 0.5 workflow is running, and this run's args record Redline 0.5.1: ... Nothing on GitHub is lost. |
| 13 | setup version (version_plugin), then the launch it records | REDLINE_VERSION | the same version in double quotes | version exit 0, plugin.version "0.5.1" -> workflow: starts: reaches its first agent |
| 14 | the marketplace entry (no reader at run time; setup version, then claude plugin validate) | marketplace.json | absent | version exit 0, plugin.version "0.5.1" -> workflow: starts: reaches its first agent \|\| validate: ⚠ Found 1 warning: ⚠ Found 1 plugin directory warning: ✔ Validation passed with warnings  |
| 15 | the marketplace entry (no reader at run time; setup version, then claude plugin validate) | marketplace.json | a number (5) | version exit 0, plugin.version "0.5.1" -> workflow: starts: reaches its first agent \|\| validate: ✘ Found 1 error:   ❯ plugins.0.version: Invalid input: expected string, received number ⚠ Found 1 warning: ⚠ Found 1 plugin directory warning:  |
| 16 | the marketplace entry (no reader at run time; setup version, then claude plugin validate) | marketplace.json | disagrees with plugin.json (0.5.0) | version exit 0, plugin.version "0.5.1" -> workflow: starts: reaches its first agent \|\| validate: ⚠ Found 1 warning:   ❯ plugins[0].version: Entry declares version "0.5.0" but .claude-plugin/plugin.json says "0.5.1". At install time, plugin.json wins (calculatePluginVersion precedence) — the entry version is silently ignored. Update this entry to "0.5.1" to match. ⚠ Found 1 warning: ⚠ Found 1 plugin directory warning:  |
| 17 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | as launched | check exit 0 :  \|\| drift exit 0 name:  |
| 18 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | absent | check exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] \|\| drift exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] |
| 19 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | null | check exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] \|\| drift exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] |
| 20 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | an empty string | check exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] \|\| drift exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] |
| 21 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | a number (5) | check exit 1 version: The run on #7 started under Redline 1.2.3, and this session loads Redline 5: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 1.2.3, and this session loads Redline 5: ... start fresh after committing or removing agent-os/specs/x |
| 22 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | an object | check exit 1 version: The run on #7 started under Redline 1.2.3, and this session loads Redline {   "major": 0 }: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 1.2.3, and this session loads Redline {   "major": 0 }: ... start fresh after committing or removing agent-os/specs/x |
| 23 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | another version (1.2.4) | check exit 1 version: The run on #7 started under Redline 1.2.3, and this session loads Redline 1.2.4: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 1.2.3, and this session loads Redline 1.2.4: ... start fresh after committing or removing agent-os/specs/x |
| 24 | run check and run drift (version_line): the session's copy's plugin.json | plugin.json of --plugin | not JSON | check exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] \|\| drift exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] |
| 25 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | no launch, launched from a checkout | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 26 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | launch null | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 27 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | launch a string | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x [stderr: jq: error (at <stdin>:1): Cannot index string with string ("version")] \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x [stderr: jq: error (at <stdin>:1): Cannot index string with string ("version")] |
| 28 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | launch with no version | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 29 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | version an empty string | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 30 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | version a number (5) | check exit 1 version: The run on #7 started under Redline 5, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 5, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 31 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | version an object | check exit 1 version: The run on #7 started under Redline {   "a": 1 }, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline {   "a": 1 }, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 32 | run check and run drift (version_line): the marker's args.launch | the marker's args.launch.version | another version (1.2.2) | check exit 1 version: The run on #7 started under Redline 1.2.2, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 1.2.2, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 33 | run check and run drift (version_line): a marker with no launch, named from args.pluginRoot's manifest under plugins/cache/ | the launch release's plugin.json | the release holds a version (0.4.3) | check exit 1 version: The run on #7 started under Redline 0.4.3, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 0.4.3, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 34 | run check and run drift (version_line): a marker with no launch, named from args.pluginRoot's manifest under plugins/cache/ | the launch release's plugin.json | absent | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 35 | run check and run drift (version_line): a marker with no launch, named from args.pluginRoot's manifest under plugins/cache/ | the launch release's plugin.json | a number (4) | check exit 1 version: The run on #7 started under Redline 4, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under Redline 4, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 36 | run check and run drift (version_line): a marker with no launch, named from args.pluginRoot's manifest under plugins/cache/ | the launch release's plugin.json | the directory is gone | check exit 1 version: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: ... start fresh after committing or removing agent-os/specs/x |
| 37 | run check and run drift (copy_line): the session's copy's plugin.json, for the line | plugin.json of --plugin | a version | check exit 1 copy: The run on #7 started from the Redline 1.2.3 copy at <tmp>/rec/plugin2, and this session loads Redline 1.2.3 from <tmp>/rec/plugin, another copy: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started from the Redline 1.2.3 copy at <tmp>/rec/plugin2, and this session loads Redline 1.2.3 from <tmp>/rec/plugin, another copy: ... start fresh after committing or removing agent-os/specs/x |
| 38 | run check and run drift (copy_line): the session's copy's plugin.json, for the line | plugin.json of --plugin | absent | check exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] \|\| drift exit 2  [stderr: redline-prefs: <tmp>/rec/plugin/.claude-plugin/plugin.json holds no version] |
| 39 | run check and run drift (copy_line): the session's copy's plugin.json, for the line | plugin.json of --plugin | a number (5) | check exit 1 copy: The run on #7 started from the Redline 5 copy at <tmp>/rec/plugin2, and this session loads Redline 5 from <tmp>/rec/plugin, another copy: ... start fresh after committing or removing agent-os/specs/x \|\| drift exit 1 refuse: The run on #7 started from the Redline 5 copy at <tmp>/rec/plugin2, and this session loads Redline 5 from <tmp>/rec/plugin, another copy: ... start fresh after committing or removing agent-os/specs/x |
| 40 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | absent | refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record no version, as a Redline build before 0.5.1 launched it: ... Nothing on GitHub is lost. |
| 41 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | null | refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record no version, as a Redline build before 0.5.1 launched it: ... Nothing on GitHub is lost. |
| 42 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | a string | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got "0.5.1" |
| 43 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | an array | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got [] |
| 44 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | version absent | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"workflow":"<blob>"} |
| 45 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | version an empty string | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"","workflow":"<blob>"} |
| 46 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | version a number | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":5,"workflow":"<blob>"} |
| 47 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | another version (0.4.3) | refused at stage relaunch, resumeFrom null: The Redline 0.5.1 workflow is running, and this run's args record Redline 0.4.3: ... Nothing on GitHub is lost. |
| 48 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | the same version | starts: reaches its first agent |
| 49 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | the same version, no blob id | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"0.5.1"} |
| 50 | the workflow at startup: args.launch against REDLINE_VERSION | args.launch | the same version, a blob id that is not hex | THROWS: redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {"version":"0.5.1","workflow":""} |
| 51 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | all agree | exit 0 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":"0.5.1","running":false}] stderr:  |
| 52 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | absent on the other install | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":null,"running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project null; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |
| 53 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | null on the other install | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":null,"running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project null; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |
| 54 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | a number (5) on the other install | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":5,"running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 5; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope user; then restart the session or run /reload-plugins |
| 55 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | the word unknown on the other install | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":"unknown","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project unknown; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |
| 56 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | absent on this session's install | exit 1 installs [{"scope":"user","version":null,"running":true},{"scope":"project","version":"0.5.1","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user null (this session's), project 0.5.1; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope user; then restart the session or run /reload-plugins |
| 57 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | the other install older, at 0.5.1 or later (0.5.1 against 0.5.2) | exit 1 installs [{"scope":"user","version":"0.5.2","running":true},{"scope":"project","version":"0.5.1","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.2 (this session's), project 0.5.1; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |
| 58 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | the other install older than 0.5.1 (0.4.5; R4-3) | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":"0.4.5","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.4.5; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |
| 59 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | this session's install older than 0.5.1 is impossible: this script is 0.5.1; this session's the older of two at 0.5.1 or later | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":"0.6.0","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.6.0; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope user; then restart the session or run /reload-plugins |
| 60 | setup version (version_installs): an install's version in claude plugin list --json | an install's version | two that differ only past the numbers (0.5.1 against 0.5.1-rc1) | exit 1 installs [{"scope":"user","version":"0.5.1","running":true},{"scope":"project","version":"0.5.1-rc1","running":false}] stderr: redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.5.1-rc1; ... a run that switches stops at its next relaunch. Update the older one: claude plugin update redline@redline --scope project, run from <tmp>; then restart the session or run /reload-plugins |

**What it shows.** No row may end in a loop, an args throw, or advice that leads back to the same refusal.

- **Rows 2 to 12 fail that, all behind one reader.** `version_plugin` prints whatever the manifest holds and never looks at the constant.
  - Absent, null, empty or false (rows 2, 3, 4, 6): the workflow throws on `args.launch` (R3-5).
  - A number, an object or an array (rows 5, 7, 8): the workflow refuses the fresh launch for its version. The skill's error section then says to reopen the session, which loads the same files.
  - The manifest and the constant disagreeing, either way round (rows 9, 10): the same refusal and the same advice (R4-2).
  - No constant (row 11): the workflow file throws before its first line of checks. A constant that is not a string (row 12): the refusal again.
  - Fixed at that reader (decision 6): each of these stops at the precheck with a line naming the file and the value.
- **Rows 42 to 46, 49 and 50 throw**, the workflow's own check of `args.launch`. They stay (decision 2): after decision 6 only hand-built args reach them.
- **The marketplace entry (rows 14 to 16)** changes nothing at run time. `claude plugin validate`, the gate's step 2, warns on a disagreement and fails on a number.
- **`version_line` and `copy_line` (rows 17 to 39)** end in exit 2 with the file named, or in a refusal whose line says to start fresh. A fresh launch from a copy whose manifest holds a number or an object (rows 21, 22, 39) then stops at the fixed precheck with the cause. Row 27 prints jq's own error beside the refusal; a marker cannot hold a launch that is a string unless it was edited by hand.
- **`version_installs` (rows 51 to 60)** never stops. Rows 57 and 58 are R4-3's two cases: the line says the same for an install at 0.5.1 and for one at 0.4.5. A version the CLI prints as no string (rows 52 to 56) gives a warning that names it; Redline's manifest carries a string, so none was seen.

## Table C: sentences that tell the person what happens next

**The rows.** Every sentence pull request #137 added (`git diff main...HEAD`) that says what happens next or what to do: in the two scripts' lines and the workflow's refusal, the launch skill, `docs/running.md`, `docs/upgrading.md`, `docs/setup.md` with the setup skill, the README and CONTRIBUTING. A sentence quoted in two files with the same words is one row naming both.

**The columns.** Is it true on a fresh launch; on a relaunch or a resume; for an installed release; for a checkout loaded in place; and when the other install is older than 0.5.1. A cell reads **true**, **not said** (the sentence is not reached there), or says what is false.

**The evidence, by key.**

- A-n and B-n: a row of table A or B.
- OW: each of the six releases in this machine's plugin cache (0.2.0, 0.4.0, 0.4.1, 0.4.2, 0.4.3, 0.4.5), its own `workflows/redline-loop.js` run with args that record a 0.5.1 launch. Every one reaches its first agent; none refuses.
- OS: a marker of a 0.5.1 run put through 0.4.5's own `run check` and `run drift`: `ok` and `name`. From the 0.5.1 copy, as a live session's skill still names it, `run drift` also answers `name`.
- CE: `run drift` with the record file present and gone, the workflow as launched and edited; and on the plugin's own repository reviewed by another copy, after a commit to the repository's `plugin.json`.
- 17a: loop-test section 17a. ST: the installs cases of `tests/setup-test.sh`. PT: `tests/prefs-test.sh`.
- m-numbers: the #135 spec's probes of what a session loads, with a throwaway plugin (its `shape.md`, "What the probes did and showed"). They ran on Claude Code 2.1.332, the version here, and are cited, not rerun.

**Rows: 50.**

| # | Sentence (where) | Fresh launch | Relaunch or resume | Installed release | Loaded in place | Other install older than 0.5.1 | Found |
|---|---|---|---|---|---|---|---|
| 1 | "... a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing <folders>" (`redline-prefs.sh`, `version_line`) | not said | true: refused, and a fresh launch then starts (B-23, B-1) | true (m3d) | after a version commit under a live session, the fresh launch is refused once more by the workflow the session holds, then the reopen advice comes (B-9, m6-inplace-edit) | not said: the skill is then the older release's, which has no such line (OS), and the relaunch goes ahead (OW) | already tracked in #138 |
| 2 | "... the rest of the run would call the scripts of the copy it started from ... Nothing on GitHub is lost; start fresh ..." (`redline-prefs.sh`, `copy_line`) | not said | true (B-37, PT) | true: a fresh launch from the session's copy starts (B-1) | true | not said (OS) | holds |
| 3 | "... so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline <pr>" (`redline-prefs.sh`, `run drift`; from #81, on every repository since #135) | not said | true for a launch by the fallback (PT). Said too when the record file is gone, where its reason is wrong and its outcome safe (CE) | not said for a release, whose files do not change | true | not said (OS) | For you to open, 2 |
| 4 | "a reload or a reopen runs whichever is listed first" (`redline-setup.sh`, the installs line) | true (m3d, m3e, m3h) | not said: the precheck runs on a fresh launch only | true | not said: `--plugin-dir` hides every install (ST, m1-inline) | true | holds |
| 5 | "and a run that switches stops at its next relaunch" (the same line) | true when the install switched onto is at 0.5.1 or later (B-57, B-59, 17a) | not said | true, with the same condition | not said | **false**: the older workflow starts (OW), and the line says the same for 0.4.5 as for 0.5.1 (B-58) | R4-3, Task 5 |
| 6 | "Update the older one: claude plugin update <id> --scope <scope>[, run from <root>]" (the same line) | true (the #135 spec, answer c's rider; ST) | not said | true | not said | true | holds |
| 7 | "then restart the session or run /reload-plugins" (the same line) | true of how an update reaches a session (m3d, m3e). It is said while the launch goes on: when this session's install is one of the older (B-59), a reload during the run switches it, and the run stops at its next relaunch | not said | true | not said | true | a caution in the skill and `docs/upgrading.md`, Task 5 |
| 8 | "... so it stops here, before any agent. Nothing on GitHub is lost." (`redline-loop.js`, the startup refusal) | true, and it names no next step (17a, B-9) | true (17a, B-47) | true | true | not said: an older workflow has no such line (OW) | holds |
| 9 | "For either, nothing needs fixing by hand. Say the line, then ask ... Start fresh first and Stop second" (skill, section 2, Resume) | not said | true (B-23, B-37) | true | for `version` after a version commit, as row 1 | not said (OS) | already tracked in #138 |
| 10 | "On exit 2, say the script's stderr line and stop, and leave the marker" (skill, section 2, Resume) | not said | true: the line names the file (B-18 to B-20, B-24) | not said: a release's manifest holds a version | true | not said | holds |
| 11 | "... can switch to another during the run, and the run then stops at its next relaunch" (skill, section 4, step 1) | as row 5 | not said | as row 5 | not said | **false**, as row 5 | R4-3, Task 5 |
| 12 | "On exit 0 or 1, keep its `plugin.version` and `plugin.workflow` ... which section 5 records as `args.launch`" (skill, section 4, step 1) | true for a copy whose two version places agree; for one that disagrees or holds no version string, the launch it records is refused or throws (B-2 to B-12) | not said | true: a release passed the gate | as the first cell | true | R4-2 and R3-5, Task 4 |
| 13 | "... the workflow refuses at startup, before any agent, to run under another version, and `run check` and `run drift` compare it with this session's copy before a resume or a relaunch" (skill, section 5) | true | true | true | true | **false** for a switch onto it: its workflow refuses nothing (OW) and its scripts compare nothing (OS) | reworded with a pointer to the gap, Task 5 |
| 14 | "At every stop that waits for the person (a hand-off of either kind, a `reviewed` result), write the marker and run `run drift` ... so a relaunch that cannot run is said before any question and no answer is lost to it" (skill, section 7) | not said | true of what the skill does; "either kind" counts two of the three hand-off kinds | true | true | a relaunch that should not run is not said: `run drift` answers `name` (OS) | R4-4, Task 6 |
| 15 | "On a resume, if the file at the marker's `record` is gone, say so in one line and relaunch anyway: the copy is only a backup, and the marker holds what `run drift` reads" (skill, "Save the run record") | not said | **false in part**: `run drift` reads the pinned copy's path from that file. With it gone the relaunch is by name while the workflow file's blob is the launch's, and refused once it is not (CE) | true while the file is as launched | as the second cell | not said | reworded, Task 6 |
| 16 | "At a stop ... a `run save` that finds no record stops the run (below), so nothing relaunches without one" (the same paragraph) | not said | true (PT: `run save` and `run drift` exit 2) | true | true | not said | holds |
| 17 | "(a `handoff` of either kind, ...) ... If the script exits 2 (no record, no session id), say its line and stop, before any question ... the run is finished with a fresh one" (skill, "Write the marker") | not said | true; "either kind", as row 14 | true | true | not said | R4-4, Task 6 |
| 18 | "A relaunch runs the workflow script the run launched with, or it does not run." (skill, "The script a relaunch runs"; `docs/running.md`, "What `relaunch` runs") | not said | true (PT, 17a) | true between installs at 0.5.1 or later | true (m4, m6-inplace-edit) | **false**: the older script runs (OW) | a pointer to the gap in both, Task 5 |
| 19 | "Before every relaunch (a hand-off of either kind, ...) ... Where the person is asked anything before the relaunch (a hand-off of either kind, ...), run it twice ... the relaunch follows that run's answer" (skill, the same paragraph) | not said | true; "either kind", twice | true | true | as row 14 | R4-4, Task 6 |
| 20 | "Say `line` verbatim, run ... `run clear` ..., and stop, so the next `/redline:redline <n>` starts fresh." (skill, the `refuse` bullet) | not said | true (B-23, B-37, CE) | true | after a version commit, as row 1 | not said (OS) | already tracked in #138 |
| 21 | "On exit 2, say the script's line and stop. The line names the cause: no marker, or ... a marker with no start commit ...; or a `--plugin` whose manifest holds no version" (skill, the same section) | not said | true (B-18, PT) | true | true | not said | holds |
| 22 | "... relaunch with `args.deferrals`, the marker having been written, and `run drift` run, before the first draft was presented" (skill, the `deferred` hand-off) | not said | names the first of the two runs only; a reader can relaunch on the earlier answer | the same | the same, and it matters there: the workflow file can change while the drafts are answered | not said | R4-4, Task 6 |
| 23 | "... or because the workflow running is another version than the run started under, #135 ... first run `run clear` ..., then say the run cannot be resumed and name the uncommitted spec folders to commit or remove before a fresh launch" (skill, `error`) | not said | true (17a); the fresh launch starts from the install the session then runs (m3d) | true | not said: a live session relaunches the workflow it loaded (m6-inplace-edit) | not said (OW) | holds |
| 24 | "When the workflow refused a fresh launch (section 6) for its version ... a commit changed the plugin's version after the session loaded it. ... reopening the session with the checkout still loaded in place ... and typing the command again launches under the checkout's current files; a reopen without `--plugin-dir` runs the installed release instead" (skill, `error`) | true when the checkout's files agree with themselves (m6-inplace-edit, m6-inplace-reopen, m5) | not said | not said: a session's skill root and workflow move together (m3c, m3d) | **false** for a copy whose `plugin.json` and `REDLINE_VERSION` disagree: the reopen loads the same files and is refused again (B-9, B-10, B-12) | not said (OW) | R4-2, Task 4 |
| 25 | "... warnings only, each saying to rerun `/redline:setup`, to start the session with `claude --plugin-dir`, or which `claude plugin update` brings an older install up to date" (`docs/running.md`, the precheck) | true (B-58, ST) | not said | true | true | true | holds |
| 26 | "... the skill clears the marker and stops, so the next `/redline:redline <pr>` starts fresh, and its first round carries the open findings forward" (`docs/running.md`, "Another version") | not said | true | true | as row 1 | not said | already tracked in #138 |
| 27 | "The relaunch is refused the same way ... A resume is refused the same way by `run check`, before anything is asked, and the skill offers to start fresh" (`docs/running.md`, "Another copy at the same version") | not said | true (B-37, PT) | true | true | not said | holds |
| 28 | "... the relaunch runs the copy of the script the harness kept at launch ... in auto and bypass-permissions mode it runs with no prompt; ... asks once per relaunch ...; ... it is denied, and the skill says to relaunch from an interactive session or start fresh" (`docs/running.md`, "The workflow file changed") | not said | true (CE, m4) | not said: a release's file does not change | true | not said | holds |
| 29 | "The relaunch is refused with a line naming the file, and the run is finished with a fresh one, whose first round carries the open findings forward." (`docs/running.md`, "no copy was kept") | not said | true (PT, CE) | not said | true | not said | holds |
| 30 | "The relaunch goes on, the skill says ..., and the handoff comment says the same in the past tense" (`docs/running.md`, "An agent file changed") | not said | true (A-4, A-5 and their like; PT) | not said | true, on the plugin's own repository | not said | holds |
| 31 | "... a stop whose marker could not be written (`run save` exits 2) is not relaunched: the run is finished with a fresh one. ... said before any question as well" (`docs/running.md`) | not said | true (PT) | true | true | not said | holds |
| 32 | "... refuses a relaunch under any other version ... so after this refusal the run is finished, and a fresh launch is the way on." (`docs/running.md`, "The workflow, at startup") | not said | true (17a, m5) | true | true | **false** for a switch onto it (OW); the paragraph does not say so | a pointer to the gap, Task 5 |
| 33 | "In a session that loads Redline in place, a commit that changes the plugin's version after the session loaded it gets a fresh launch refused the same way ...: reopen the session with the checkout loaded in place ... and type the command again" (`docs/running.md`, the same paragraph) | true (m6-inplace-edit, m6-inplace-reopen) | not said | not said | true, but for the copy that disagrees with itself, as row 24 | not said | R4-2, Task 4 |
| 34 | "On the plugin's own repository, a round whose commits change the version in `plugin.json` ends the run at its next relaunch." (`docs/running.md`, the same paragraph) | not said | true (B-23) | **false** when a release reviews the repository: its own manifest did not change, and `run drift` answers `name` (CE) | true | not said | reworded: loaded in place, Task 6 |
| 35 | "... another release's agents arrive only with another version, which both layers refuse." (`docs/running.md`) | not said | true | true between installs at 0.5.1 or later | true | **false**: neither layer of the older release refuses (OW, OS) | the same pointer as row 32, Task 5 |
| 36 | "... the line names both versions, and since nothing needs fixing by hand the skill then offers to start fresh ..." and "... the line names both copies, and the skill offers to start fresh, as for a version" (`docs/running.md`, "Run markers and resume") | not said | true (B-23, B-37) | true | for a version, as row 1 | not said | already tracked in #138 |
| 37 | "Update every scope that holds Redline for a repository ...: a session runs whichever is listed first, so installs at different versions can switch a session mid-run, and the launch warns when they differ" (`docs/upgrading.md`) | true (B-57, B-58) | not said | true | not said: the warning says nothing for a checkout (ST) | true | holds |
| 38 | "From 0.5.1 a stopped run is not relaunched under another version at all, on any repository: it is refused and started fresh" (`docs/upgrading.md`) | not said | true between installs at 0.5.1 or later | the same | true | **false** (OW, OS); the next section says so four paragraphs on | reworded, Task 5 |
| 39 | "... a relaunch or a resume under another version is refused, never run" (`docs/upgrading.md`, "A stopped run across a version change") | not said | as row 38 | as row 38 | true | **false**, as row 38 | reworded, Task 5 |
| 40 | "Either refusal names both versions, says nothing on GitHub is lost, and leads to a fresh run ...; nothing needs fixing by hand." (the same section) | not said | true (B-23, 17a) | true | as row 1 | not said | already tracked in #138 |
| 41 | "... is refused like any version change. The line names the version from the manifest of the release ..., or says a build before 0.5.1 ... Finish a stopped run before updating to 0.5.1, or start it fresh after." (the same section) | not said | true (B-25, B-33, B-34) | true | true: named as a build before 0.5.1 | not said | holds |
| 42 | "A session that launched under 0.5.1 and then reloads, or is reopened, onto an install from before 0.5.1 runs that build's workflow, which has no check: the relaunch goes ahead ...; typing the command again runs that build's skill, which has no check either. ... bring the older install up to date." (the same section) | not said | true (OW, OS) | true | not said | true: this is the case | holds |
| 43 | "That is what the launch warning is for. ... says so in one line and gives the update for each older one" (the same section) | true (B-58) | not said | true | not said | true, though the line itself says the run stops (row 5) | holds once row 5 is fixed |
| 44 | "A project or local update is run from the repository's root ... Then restart the session or run `/reload-plugins`. The warning never stops a launch, and it says nothing when the session loads Redline from a checkout ... or when the `claude` CLI is missing or fails." (the same section) | true (ST) | not said | true | true | true | the caution of row 7, Task 5 |
| 45 | "A commit that changes its version ends a run at the next relaunch, like any version change, and a fresh launch in a session that loaded the checkout before such a commit is refused until the session is reopened with the checkout loaded in place" (the same section) | true (m6-inplace-edit, m6-inplace-reopen) | true (B-23) | not said | true, but for the copy that disagrees with itself, as row 24 | not said | R4-2, Task 4 |
| 46 | "... the skill and the workflow both refuse a relaunch or a resume under another, naming both versions: nothing on GitHub is lost, and a fresh run's first round carries the open findings forward. ... A session reloaded onto an install from before 0.5.1 runs a workflow with no such check, so the launch warns ..." (README, Known limits) | not said | true | true | true | true: the bullet states the gap | holds |
| 47 | "A relaunch from the pinned script runs with no prompt in auto and bypass-permissions mode, asks once per relaunch in manual and accept-edits mode, and is denied in don't-ask mode and in a headless session in any other mode" (README, Known limits) | not said | true (m4, m4i) | not said | true | not said | holds |
| 48 | "`version` also exits 1 when the Redline installs the repository sees are at different versions: no setup step changes that, so its line ... is said and the setup goes on" (`docs/setup.md`, Verify; the setup skill, step 8) | true (B-57, B-58) | not said | true | not said | true | holds; both gain the exit 2 of decision 6, Task 4 |
| 49 | "... the workflow refuses a relaunch under any version but the one a run started with, which it reads off that constant" (CONTRIBUTING, the gate's Version step) | not said | true of this workflow (17a) | true | true | not said: the sentence is about this build's workflow | holds |
| 50 | "... `launch` ({version, workflow}) stays as the launch recorded it: a script of another version refuses the relaunch at startup, before any agent" (`redline-loop.js`, the result's `relaunch.how`, read by the session) | not said | true of this workflow (17a) | true | true | not said | holds |

**What it shows.**

- **R4-3** is rows 5 and 11, and the same claim without its limit in rows 13, 18, 32, 35, 38 and 39. Row 42 and the README (row 46) already state the limit; the others are brought in line with them.
- **R4-4** is rows 14, 17, 19 and 22.
- **R4-2** is rows 12, 24, 33 and 45: each is true but for a copy that disagrees with itself, which decision 6 stops before any of them is reached.
- **New:** row 15 (what `run drift` reads when the record is gone), row 34 (true only when loaded in place) and row 7 (the advice is said while the launch goes on). Each is a rewording. Row 3's wrong reason with the record gone is left and drafted (For you to open, 2).
- **#138:** rows 1, 9, 20, 26, 36 and 40 share one cell: "start fresh" after a version commit under a live session that loaded the checkout in place is refused once more first. #138's last clause tracks it (decision 3).

A sentence the pull request did not add but this spec changes: the precheck's "A warning, never a stop; on exit 2, stop as section 1 does" (#15). R3-5 was declined on it, since every exit 2 of `version` read as "not set up". Decision 6 rewords it.

## R1-5 and R2-4

Both were declined as unconfirmed, each for want of a run of `claude` that the shaper's role could not make. Both can be measured here: Claude Code is 2.1.332, the #135 probe plugin `probe135` and its local marketplace are still on disk, `claude plugin list --json` prints `enabled` for each install, `claude plugin disable` takes `--scope`, and `/tmp` is a link to `/private/tmp`, which gives a scratch repository a symlinked spelling. Task 2 measured them (decision 4).

**How.** A copy of `probe135` in a marketplace of its own, `probe137-mkt`, installed at user scope at 0.0.1 and then, after the plugin's repository moved to 0.0.2, at project scope in a scratch repository. That install was made from the repository's symlinked spelling, `/tmp/.../T2/work`, with the shell's directory and `PWD` both at it. Small headless sessions (`claude -p --output-format stream-json`) show which install a session loads in their `init` event; an interactive one, driven with `expect`, invoked the probe's skill before and after `/reload-plugins`. The registry's three files were backed up first and diffed after the probe and its marketplace were removed: identical. The person was told before the first change and shown the diff before the first result. Raw output was in the session's scratchpad (`T2/out/`).

**R2-4: refuted.** Claude Code recorded the project install's `projectPath` as the physical path, `/private/tmp/.../T2/work`, in `claude plugin list --json` and in `installed_plugins.json`, though the install was made from the `/tmp` spelling. `git rev-parse --show-toplevel` prints the physical path from that spelling too. So `version_installs`, which compares `projectPath` with the root's physical path, sees the install. Sessions started from either spelling loaded the same install.

- Asked on 2026-11-28: record it, with no change to the code. One sentence in `version_installs`' docblock says `projectPath` is the physical path, as measured (Task 5), and a follow-up reply for the thread is drafted.
- Decided by: @michaelfromtheoutfit

**R1-5: refuted.**

| State | `enabled` in the list, read inside the repository | read outside it | What a session in the repository loaded |
|---|---|---|---|
| both scopes enabled | user true, project true | not read | 0.0.1, the user install, listed first (a fresh session from each spelling) |
| user disabled, project enabled | user true, project true | user false, project false | 0.0.1, the user install: a fresh session, a reopen of the earlier one, and a session before and after `/reload-plugins` |
| user enabled, project disabled | user false, project false | user true, project true | none |

- `enabled` is not an install's own. It is the merged setting for the plugin id, as seen from the directory the CLI runs in, and both installs always read alike.
- A session ran the install at the scope that was disabled. Enablement decides whether the id loads; which install runs is still the one listed first.
- So dropping an entry whose `enabled` is false, the finding's proposed fix, would hide the install the session runs.
- Outside the repository, where only the user install is seen and it is disabled, a session loaded none.
- Asked on 2026-11-28: record it, with no change to the code. One sentence in `version_installs`' docblock says why `enabled` is not read (Task 5), a setup-test case pins that an install whose `enabled` is false is still listed, seen red under a mutation that drops it, and a follow-up reply for the thread is drafted.
- Decided by: @michaelfromtheoutfit

Nothing is left over for an issue from either.

## For you to open

Drafted in the form of this repository's issues. No open issue covers either: the open list was read on 2026-11-27 and searched for "quotePath", "quoted name", "name-only", "non-ASCII", "unexpected_files", "ls-files", "tree_state", "symlink" and "enabled". #50's fourth part is the same file's untracked line count, a different read.

### 1. Read the gate's file lists with -z, so a file whose name git quotes is not reported as unexpected

**What was found.** A pull request whose own files include a name git quotes fails the gate's git block on every round, resume or not. Measured with a `checks.sh` generated from the template: with `docs/zé.md` the one file the snapshot allows and one commit that changes it, `checks.sh --git-only` reports `unexpected_files: ["\"docs/z\\303\\251.md\""]` and exits 1, where `docs/plain.md` and `docs/z q.md` give an empty list and exit 0. The git block builds its changed list from `git diff --name-only <start_sha>` and `git ls-files --others --exclude-standard` without `-z`. With `core.quotePath` at its default git prints a name holding a byte above 0x7f, a double quote, a backslash or a control character in quoted form, which matches no entry of the allowed list. So Redline cannot finish a round on a pull request that touches a file with an accented or non-Latin name: the checker's verdict names a file the pull request itself lists.

Two more things follow from the same reads. A hand fix committed under `.claude/` after an error stop is excused by the workflow only by exact string against `unexpected_files`, so one whose name git quotes is never excused: since #137's round 4, `redline-prefs.sh run check` accepts that resume (it reads its own lists with `-z`), and the run then stops at the check. And `tree_state` reads `git status --porcelain=v1 -z` but turns the NULs into newlines and strips a rename with `sed 's/^.* -> //'`, so a name holding a newline would split and one holding ` -> ` would be cut; neither was run.

**Why it was not fixed in #137.** The lines are in `scripts/checks-template.sh` below its header. A change there alters what a setup rerun writes, so it takes a template version and a minor bump, and every repository reruns `/redline:setup`. #137 kept 0.5.1 and did not touch the template.

**Proposed fix.** Read both lists with `-z` and compare NUL-terminated names with the allowed list (the snapshot's `files` and `plan_paths` are already the names as they are); read `tree_state`'s entries NUL by NUL, taking a rename's second field as its source. Print each name in the JSON as a JSON string. Pin it with a checks case: a pull request whose one file is `docs/zé.md` passes the git block, and its neighbour, a file outside the allowed list with such a name, is still unexpected and named as it is. Then remove the Known limits line #137 added to the README.

Drafted in the round 4 by-hand spec of #137 (`agent-os/specs/2026-11-27-1642-137-review-round-4-by-hand/shape.md`, "For you to open").

### 2. Say that the run record is gone when run drift finds no pinned copy for a launch that went by name

**What was found.** `redline-prefs.sh run drift` finds the script a run launched with through the harness's record of the run, whose path the marker holds. When that file is gone, drift has no pinned copy to compare, and reads the launch as one that ran the workflow file itself: it answers `name` while the file's blob id is the launch's, and `refuse` once it is not, with the line "... changed since this run launched, and the launch ran from the file itself, so no pinned copy exists". Measured: with the record present and the workflow edited the answer is `scriptPath`, and with the record removed it is that refusal. The outcome is safe, since nothing relaunches under an edited script. The reason is wrong: the launch went by name and the harness kept a copy; it is the record that is missing.

**Why it was not fixed in #137.** The line is #81's, pinned by cases from #81, #135 and #137's rounds, and the state needs a session's data to have been removed between a stop and its resume. #137's round 4 corrected the skill's sentence that said the marker holds what `run drift` reads.

**Proposed fix.** Tell the two apart in `run drift`: when the marker names a record that does not exist, say so in the line, and keep the same answers. Add a prefs case for a marker whose record is gone, with the workflow as launched and edited.

Drafted in the round 4 by-hand spec of #137 (`agent-os/specs/2026-11-27-1642-137-review-round-4-by-hand/shape.md`, "For you to open").

## For you to add

### To #138

The round 4 by-hand spec of #137 ran every sentence #137 added that says what happens next (its `shape.md`, table C). Six of them say to start fresh after a version refusal and share the cell this issue's last clause describes: the version line of `run check` and `run drift`; the skill's Resume bullet for `version` and its `refuse` bullet; and in `docs/running.md` the "Another version" bullet and "Run markers and resume", with `docs/upgrading.md`'s "Either refusal ... leads to a fresh run". In a session that loaded a checkout in place before a commit changed its version, that fresh launch is refused once more by the workflow the session still holds, and only then does the reopen advice come. Since that spec, a copy whose `plugin.json` and `REDLINE_VERSION` disagree is stopped earlier, at the precheck, with a line naming both files, so the refused fresh launch that is left is always the live session's older workflow, and the reopen with `--plugin-dir` is the right advice for it.

## Standards retrospective

Put to the person at the gate (Task 7), and recorded here then.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach". Each of the four findings is something the run says that is not quite true; the tables are there so the same kind of sentence is not found again one member at a time.

## Standards Applied

- scripts/bash-conventions: a list of paths read from git is read with `-z` and a NUL-delimited read, the line round 3 added; R4-1 applies it to the two reads round 3 did not reach. A header change is mirrored in `docs/scripts.md` in the same commit.
- testing/tests: each case red before green, with its neighbour; every count read off a run; a stub CLI for the installs.
- process/docs-gate: each touched plugin file names its section in the gate's Docs step.
- process/release: the version is kept at 0.5.1 on purpose (the brief's decision 3); the pull request already carries its bump from 0.5.0.
- workflow/replay: `workflows/redline-loop.js` is not changed, so no prompt changes.
- workflow/agents: no agent file is changed.
- scripts/guard: the guard and the hook are not changed.
- prompts/attribution: the lines name Redline only.
- process/standards-retrospective: proposed at the gate, applied in its own commit.
- process/internal-notes: the measurements recorded here are this spec's own.
