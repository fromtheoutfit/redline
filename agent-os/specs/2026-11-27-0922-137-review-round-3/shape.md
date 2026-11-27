# PR #137 review round 3 — Shaping Notes

Shaped by Redline in unattended mode, for review round 3 of PR #137 (issue #135; plugin 0.5.1, template v7), from the round's six findings (`redline/round-3-review.json`, `redline/round-3-findings.json`). The round reviewed round 2's fix diff, `704bbaf..9532f9d`. Line numbers are at `9532f9d`, the head of the branch.

## Scope

The round's six findings, nothing more:

- **R3-1** (correctness, low, confirmed; `sameClassAs` R2-1): `agent_list` lists a copy's agent files with `find agents -type f`, which does not enter an `agents/` that is a link and does not match an agent file that is one. So two linked copies compare two empty lists and agree.
- **R3-2** (correctness, medium, confirmed; `sameClassAs` R1-3): `copy_line` lets another copy at the run's version through when the two copies' agent files agree. The relaunch keeps `args.pluginRoot`, every agent's prompt names that copy's scripts, and the session's guard refuses any other copy's, so the run stops at its first script call.
- **R3-3** (correctness, medium, confirmed): after a launch by the `scriptPath` fallback from copy A, a session that loads copy B treats A's live, possibly edited, workflow file as the pin.
- **R3-4** (correctness, low, confirmed; `sameClassAs` R2-1): git C-quotes an agent file name holding a byte above 0x7f, a double quote, a backslash or a control character, and `agent_paths` drops the quoted name, which ends in `.md"`.
- **R3-5** (nit, low, confirmed): a loaded copy whose `plugin.json` holds no version launches into the workflow's args-validation throw rather than a plain line.
- **R3-6** (nit, low, confirmed): the installs warning labels every install whose `installPath` is the session's cache folder "(this session's)", while the docblock speaks of one install.

Other facts that bound the round:

- **Ask rules.** `.claude/redline.json` declares no `askRules` (`jq '.askRules // "none"'` prints `"none"`), so no repository ask rule covers any finding.
- **Redline's own files.** In this repository the plugin's source is repository content (rule 7). None of the six needs `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `scripts/checks-template.sh` or the gate's backticked text. So none is deferred under point 11, and none is a call on one of Redline's own files.
- **Earlier issues.** `scripts/redline-gh.sh issues-search` was run for `pluginRoot`, `symlink`, `quotePath`, `fallback`, `installPath`, `plugin.json version` and `guard copy scripts`. It listed #138, #3, #50, #73, #132, #27, #66 and #2, and none covers any of the six. #138 (name `--plugin-dir` in every reopen line) makes R3-2's switch less likely but does not track its failure, as the reviewer says. #27 is the version-checks backlog.
- **The PR's comments** (`redline-gh.sh pr-comments 137`) hold the round 1, 2 and 3 reviews and nothing else.
- **The reviewer's scratch** for this round is `/tmp/redlinerepro/c/` (copies A and B, a repository, a record). It holds no harness run; the reviewer could not run `redline-prefs.sh run` either.

Dispositions:

- `fix`: R3-2, R3-4, R3-6.
- `decline`: R3-1, R3-3 (both closed by R3-2's change), R3-5.
- No `defer`, no `ask`.

## Decisions

### R3-2: another copy at the run's version passes when its agent files agree, and the relaunch meets the guard — fix

Confirmed by reading.

- **The copy check.** `copy_line` (`scripts/redline-prefs.sh` 236-264) returns nothing when `args.pluginRoot` is another directory than `--plugin` by `realdir` and `agent_list` finds the two copies' agent files equal (244-259). `run check` (438-439) and `run drift` (359-364) both call it, so both gates let the relaunch through.
- **What the relaunch keeps.** SKILL.md line 163: "On a relaunch, `decisions`, `approvedPlans`, `selected` and `deferrals` are added as step 7 says, and nothing else changes." So `args.pluginRoot` stays the launch copy's root.
- **What every agent is given.** `workflows/redline-loop.js` builds `GH = ${pluginRoot}/scripts/redline-gh.sh` (484) and `BACKGROUND = ${pluginRoot}/scripts/redline-background.sh` (486), and `RUN_LINE`, the opening of every agent's prompt, names `${pluginRoot}/README.md` (488).
- **What the session's guard runs.** `hooks/hooks.json` registers `"${CLAUDE_PLUGIN_ROOT}/scripts/redline-guard.sh"`. The guard takes `PLUGIN` from `CLAUDE_PLUGIN_ROOT` (`scripts/redline-guard.sh` 62, 132). `script_name` (749-762) returns `bad-path:<name>` for a Redline script whose real path is not `PLUGIN/scripts/<name>`, and the role is denied "'<path>' is not the Redline plugin's scripts/<name>" (1063).
  - A copy elsewhere is pinned refused today by `tests/guard-cases.tsv` 248 (a `cp` of `redline-gh.sh` to `/tmp`, then run, for the GitHub agent) and 553 (`/tmp/redline-background.sh start ...` for the checker).
  - The guard refuses its own harness to this role, so no row with another `CLAUDE_PLUGIN_ROOT` was run here.
- **So.** After a reopen that switches between a checkout loaded in place and an installed release at one version, or between two checkouts, both gates pass when the agent files agree. Then the first rerun agent that calls `redline-gh.sh` or `redline-background.sh` is refused, and every resume meets the same refusal, since the args never change. Start fresh recovers, and nothing on GitHub is lost, but a round can stop part way.
- **No other way to run the relaunch.** Rewriting `args.pluginRoot` to the session's copy would change `RUN_LINE` in every prompt, so nothing would replay: the failure #135 exists to prevent (Unattended answers 1). So the relaunch from another copy cannot run, whatever its agent files hold, and refusing it before any agent is the one fix.
- **Unattended answer: not a question for the person** (Unattended answers 2). The PR spec's decision 1: "A relaunch runs the script the run launched with, or it does not run. No relaunch runs another build's script without the person being told and choosing Start fresh." Its decision 3: "A refusal says which two versions, says nothing on GitHub is lost, and offers Start fresh." The other option is today's behaviour, a relaunch that stops at its first script call, which no reading of the spec defends. R1-3's "when they agree, the relaunch goes on" was this run's own round 1 decision, decided by redline before the guard's refusal was seen, and a past decision does not settle a new finding.
- **Proportionality.**
  - Likelihood: medium-low. It needs a reopen between a checkout and a release at one version, or two checkouts. On this repository that is a branch not yet bumped, reopened without `--plugin-dir` beside an install at the same version (R1-3's own example). R1-7 and #138 exist because a reopen without the flag happens.
  - Impact when it fires: the round stops at its first script call, after replaying, with a guard denial the person cannot act on, and every resume stops the same way.
  - Cost: `copy_line` loses its agent-file comparison, and `agent_list` goes with it, since nothing else calls it. Then the line, its comment, the header mirrored in `docs/scripts.md`, two sentences of the skill, four places in `docs/running.md`, and prefs cases. Every file is one the pull request changed. No new dependency.
- **Instance or class.** The finding is linked to R1-3 (`sameClassAs`), so it is a class. The cause lives in `copy_line`: it decides whether another copy may relaunch by its agent files, where what the relaunch would use is the copy's path. Members, every way a relaunch or a resume reaches the copy rule:
  - **`run drift`, before every relaunch** (359-364): through `copy_line`. Exposed. Closed here.
  - **`run check`, before a resume** (438-439): through `copy_line`. Exposed. Closed here.
  - **R3-1's linked copies**, which `agent_list` reads as two empty lists: through `copy_line`. Exposed. Closed here: no agent file is read any more.
  - **R3-3's fallback launch from another copy**, whose recorded file `run drift` reads after `copy_line` passes: exposed. Closed here: `copy_line` refuses first (see R3-3).
  - **A launch copy that is gone:** refused today, and still refused, since `realdir` of a missing directory is empty.
  - **The same copy reached through a link:** `realdir` resolves both, so it is one copy. Holds, and a case pins it.
  - **A marker with no `args.pluginRoot`:** skipped, as today. No real launch writes one (SKILL.md section 5, line 123; the workflow refuses args without it, `workflows/redline-loop.js` 82-84).

  Outcome `one-place`. `copy_line` is the one rule both gates call, so refusing there by real path closes every relaunch and every resume from another copy at once.
- **Not this cause.** A conversation reopened without `--plugin-dir` keeps the skill text it was expanded with, so a `relaunch` typed there passes `--plugin` as the launch copy's root while the session loads another. The PR names this limit ("the skill text already in the conversation keeps its old root. So the skill cannot see the switch"), and the workflow's startup check closes it for a version. The skill's documented way back after a reopen is the command (SKILL.md line 183: "`/redline:redline <n>` in the reopened session"), which expands the skill afresh, and there `run check` now refuses the copy. It is not raised as a finding this round, and nothing here changes it.
- **The change.** Task 2.
  - `copy_line` prints its line whenever `args.pluginRoot` is set and its real path is not `--plugin`'s, a gone launch copy included, whatever the agent files hold.
  - The line keeps the agents only as a reason: `... another copy: the rest of the run would call the scripts of the copy it started from, which this session's guard refuses, and run under this copy's agents. ...`.
  - `agent_list` is removed, and the R2-1 cases of the copy comparison go with it. The #81 list's R2-1 case stays.
- **This run.** It launched in place from this checkout, so `args.pluginRoot` is `--plugin` and the change lets its own relaunch through.

Decided by: redline

### R3-1: the copy check lists no agent files through a link — decline

Confirmed by measuring the listing it makes.

- **The code.** `agent_list` (155-159) gates on `[[ -d "$1/agents" ]]`, which follows a link, then runs `cd "$1"` and `find agents -type f`, under find's default `-P`.
- **Measured on this machine.** `/tmp` is a link to `private/tmp` (`ls -ld /tmp`).
  - `cd / && find tmp -maxdepth 1 -type f` printed 0 lines; `find -L tmp ...` printed 25, and `find tmp/ ...` 25. So find does not enter a start directory that is a link.
  - `/opt/homebrew/bin` holds 589 links: `-type f` found 1 file there, `-type l` 589, and `find -L ... -type f` 590. So `-type f` does not match a link.
- **Why it is declined.** R3-2's fix refuses a relaunch or a resume from any copy other than the one the run launched from, by real path and whatever its `agents/` holds. It also removes `agent_list`, the one reader that listed a copy's `agents/` with find (`grep` for `agent_list` finds only its definition and the two calls in `copy_line`, 249-250). So a link there no longer decides anything, and R3-2's cases pin two copies whose `agents/` are links to differing agent files as refused. Making `agent_list` follow links is work on a function this round deletes.
- **The rest of R2-1's class.** The one reader of agent files left is the #81 list on the plugin's own repository, which reads git. Git tracks a link as a link, and no agent file here is one (`git ls-files -s agents/` lists eight files, all mode `100644`). Its other gap, git's quoting, is R3-4, fixed below.
- **Reason posted:** R3-2's fix in this round refuses a relaunch or a resume from any copy other than the one the run launched from, by real path and whatever its `agents/` holds, and removes `agent_list`, the one reader that listed a copy's `agents/` with find, so a link there no longer decides anything; R3-2's cases pin two copies whose `agents/` are links to differing agent files as refused.

Decided by: redline

### R3-3: after a fallback launch, drift reads another copy's live file as the pin — decline

Confirmed by reading, as the reviewer traced it.

- **Today.** `run drift` counts the record's `scriptPath` as a pin whenever it is not the session copy's workflow file (385-387). With copy B passing `copy_line`, a fallback record's `A/workflows/redline-loop.js` is that, and line 391 compares its bytes with B's file. `args.launch.workflow` is read only with no pin (393).
- **What a fallback launch records** (Unattended answers 3). The PR spec's probe 8: "A launch by the `scriptPath` fallback records the live file as the record's `scriptPath`". SKILL.md section 6 (167) calls `Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/redline-loop.js", args})`, and line 123 sets `args.pluginRoot` to the same `${CLAUDE_PLUGIN_ROOT}`. So a fallback record's file is always `args.pluginRoot`'s own workflow file.
- **After R3-2.** `copy_line` runs before the pin is read (drift 359-364, then 379-394), and it now refuses any session copy whose real path is not `args.pluginRoot`'s. Line 385 is reached only when the two are one copy, so a fallback record's file is the live file, which line 385 already treats as no pin, and the blob is compared with `args.launch.workflow` (393): `name` while it is the launch's, `refuse` once edited. That is the reviewer's first proposed fix, holding without a second check. The other inputs line 385 meets are the harness's own pin under the session's `workflows/scripts/`, a pin as before, and a marker with no `args.pluginRoot`, which no real launch writes.
- **The reviewer's second option** (require a pin's own blob to equal `args.launch.workflow`) would undo the PR spec's deviation 5: "No 'overwritten pin' refusal: a pin is compared with the live file, and the launch blob only when there is no pin, since a live session runs the workflow it loaded after the file on disk changes (m6-inplace-edit)". So it is not taken (Unattended answers 4).
- **Pinned.** R3-2's cases include this launch: a fallback record from `$PLUG`, `$PLUG`'s workflow edited, drift from another copy at the version, expected `refuse` for the copy. Its neighbour, the same record read from `$PLUG` itself, expects `refuse` with no pin, as today.
- **Reason posted:** R3-2's fix in this round refuses any other copy before `run drift` reads the record's path, and a fallback launch records `args.pluginRoot`'s own workflow file, so once the session's copy must be that copy by real path the recorded file is the live file, which drift already treats as no pin and compares by blob; R3-2's cases pin this launch from another copy, its file edited, as refused.

Decided by: redline

### R3-4: an agent file whose name git quotes is dropped from drift's list — fix

Confirmed by measuring git's output.

- **The code.** The #81 list (399) pipes `git -C "$root" diff --name-only "$start" -- agents/` and `git -C "$root" ls-files --others --exclude-standard -- agents/` through `agent_paths`, which keeps a path only when it matches `*.md` (149). `core.quotePath` is unset in this repository (`git config --get core.quotePath` printed nothing), so it is at its default, true.
- **Measured.** Two scratch trees written with Write, `/tmp/redlinerepro/shaper-r3-q/a/agents/` and `.../b/agents/`, each holding `redline-plain.md`, `zé.md` and `z"q.md` with differing bytes. `git diff --no-index --name-only` of the two printed:
  - `/tmp/redlinerepro/shaper-r3-q/b/agents/redline-plain.md`;
  - `"/tmp/redlinerepro/shaper-r3-q/b/agents/z\"q.md"`;
  - `"/tmp/redlinerepro/shaper-r3-q/b/agents/z\303\251.md"`.

  The two quoted lines end in `.md"`, so `agent_paths` drops them. With `-z`, piped through `tr '\000' '\n'`, the same call printed all three names as they are.
- **Why `-z` and not `core.quotePath=false`** (Unattended answers 5). Git's own documentation, git-config(1), `core.quotePath`: "If this variable is set to false, bytes higher than 0x80 are not considered "unusual" any more. Double-quotes, backslash and control characters are always escaped regardless of the setting of this variable. ... Many commands can output pathnames completely verbatim using the -z option." And git-ls-files(1), `-z`: "\0 line termination on output and do not quote filenames". The guard refuses `git -c` to this role, so `quotePath=false` was read, not run.
- **What the base did.** Before R2-1 the list was `... | sort -u | jq -R . | jq -sc .`, so such a file was listed in its quoted spelling (the reviewer quotes the removed line). R2-1's `*.md` filter turned a wrong spelling into a dropped file.
- **Proportionality.**
  - Likelihood: low. It needs a round on the plugin's own repository that adds or edits an agent file with such a name. Every agent file today has an ASCII name (`agents/redline-*.md`).
  - Impact when it fires: the skill's line and the handoff comment do not name an agent file the run edited, so the teammate is not told the later rounds ran under it.
  - Cost: `-z` on the two git calls, a NUL-delimited read in `agent_paths`, which prints each kept name as a JSON string, the line's `jq` step, the header mirrored in `docs/scripts.md`, and four prefs cases. All in files the pull request changed. No new dependency: bash 3.2's `read` takes `-d delim` (`/usr/share/man/man1/bash.1` 7381, 7412), and BSD and GNU git both take `-z`.
- **Instance or class.** The finding is linked to R2-1 (`sameClassAs`), so it is a class. Its cause is where a name reaches `agent_paths` in another spelling than its own. Readers of agent names:
  - **The #81 list's two git calls** (399): the one place agent paths come from git. Exposed for every kind git quotes: a byte above 0x7f and a double quote were measured, and a backslash and a control character are in git's own list. Closed here: `-z` turns quoting off for both calls.
  - **A name holding a newline**, once git prints it verbatim, would split on a line-oriented read. Closed here as well: `agent_paths` reads NUL-terminated names, and prints each kept one as a JSON string, so a newline is `\n` inside one entry. `printf 'agents/z\nn.md' | jq -Rsc .` printed `"agents/z\nn.md"`.
  - **`agent_list`'s find:** removed by R3-2 (Task 2), so no reader lists names from find any more.
  - **The rest of the line:** `sort -u` and `jq -sc .` read one JSON string a line, and the skill's line and the handoff comment print each list entry as it is.

  Outcome `one-place`. The two git calls are the one place agent paths come from git, and `agent_paths` is their one reader once R3-2 removes `agent_list`, so `-z` there with a NUL-delimited read closes every name git would quote.
- **The change.** Task 3, after Task 2, which removes `agent_list` and rewords the helpers' comment.

Decided by: redline

### R3-5: a copy whose manifest holds no version throws at launch — decline

Confirmed by reading.

- **The code.** `version_plugin` reads `.version // empty` (`scripts/redline-setup.sh` 1480) and prints `version: ""`, returning 0. The skill records it as `args.launch.version` (SKILL.md 90, 163). The workflow then fails with `redline-loop: args.launch must be {version, workflow} as redline-setup.sh version prints them under plugin; got {...}` (`workflows/redline-loop.js` 51-55), before any agent.
- **Who reaches it.** Only a loaded copy whose `plugin.json` lost its version. This repository's setup test refuses such a manifest ("plugin.json carries a semver version", `tests/setup-test.sh` 1129, gate step 7), so no committed copy carries one.
- **What it costs today.** The launch stops before any agent and nothing is lost. The throw names `args.launch` and shows the empty version.
- **What the proposed fix would say.** `die2` makes `version` exit 2, and the precheck reads every exit 2 of `version` as "stop as section 1 does" (SKILL.md 90), whose one line is "this repository is not set up for Redline yet" (SKILL.md 15). That says less than the throw (Unattended answers 7). A clear line would also need the skill's exit-2 handling changed, beside the script, its header in `docs/scripts.md` and a setup case, for a state the gate already keeps out.
- **Reason posted:** Only a loaded copy whose `plugin.json` holds no version reaches this, which this repository's setup test refuses ("plugin.json carries a semver version", gate step 7), and its launch still stops at the workflow's first args check before any agent, with nothing lost and a line that shows the empty version; an exit 2 from `version` there would be read by the precheck as "this repository is not set up for Redline yet", which says less.

Decided by: redline

### R3-6: every install sharing the session's folder is labelled the session's — fix

Confirmed by reading, and by the install registry on disk.

- **The code.** `mine` is true for every seen install whose `installPath` is this script's root (`scripts/redline-setup.sh` 1515). `running` is `mine` for each (1522), and the line labels each such install "(this session's)" (1525).
- **On disk.** `~/.claude/plugins/installed_plugins.json`, read-only: the user install and a project install for another repository on this machine are both at 0.4.5, with one `installPath`, `cache/redline/redline/0.4.5`. So installs at one version share the cache's version folder.
- **The docblock.** Lines 1497-1498: "running true for the install whose installPath is this script's root, the copy the session loaded", in the singular. The setup test's comment says the same (1001-1002): "the one this session runs is the one whose installPath is this script's root".
- **Which reading is right** (Unattended answers 6). Each install that shares the folder runs the files this session loaded, so marking each, and labelling each "(this session's)", is true of the files. Marking only the first would rest on the CLI's list order, and the PR spec measured the session's choice against `installed_plugins.json` ("A session runs the install listed first in `installed_plugins.json`", probe 1), not against `claude plugin list --json`'s order. So the code stays, and the docblock and the test's comment, which disagree with it, are put right. No reader uses `running` (`grep` of `skills/`, `workflows/` and `agents/` finds none), and the update commands name only the older install.
- **Cost.** Two comments and two setup checks, in files the pull request changed.
- **Instance or class.** The cause is the docblock's wording of the rule `mine` applies, stated once in `version_installs` and restated in the setup test's comment. The setup header (124-128) says only which id is listed ("of the id of the one whose installPath is this script's root"), which is right: installs sharing a folder share an id, since the cache path holds the marketplace. Outcome `one-place`, in `scripts/redline-setup.sh`, with the test comment changed beside it (workflow/agents, line 17).
- **The change.** Task 4. The new setup checks hold before the change, since the code already marks each install. They are seen red under a mutation that marks only the user install.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)". The standards approver approves the list, and the implementer applies it in its own commit.

Decided by: redline

## Declined

- **R3-1.** R3-2's fix in this round refuses a relaunch or a resume from any copy other than the one the run launched from, by real path and whatever its `agents/` holds, and removes `agent_list`, the one reader that listed a copy's `agents/` with find, so a link there no longer decides anything; R3-2's cases pin two copies whose `agents/` are links to differing agent files as refused.
- **R3-3.** R3-2's fix in this round refuses any other copy before `run drift` reads the record's path, and a fallback launch records `args.pluginRoot`'s own workflow file, so once the session's copy must be that copy by real path the recorded file is the live file, which drift already treats as no pin and compares by blob; R3-2's cases pin this launch from another copy, its file edited, as refused.
- **R3-5.** Only a loaded copy whose `plugin.json` holds no version reaches this, which this repository's setup test refuses ("plugin.json carries a semver version", gate step 7), and its launch still stops at the workflow's first args check before any agent, with nothing lost and a line that shows the empty version; an exit 2 from `version` there would be read by the precheck as "this repository is not set up for Redline yet", which says less.

## Deferred

None this round.

## Unattended answers

1. **R3-2: can a relaunch rewrite `args.pluginRoot` to the session's copy?** No.
   - SKILL.md line 163: "On a relaunch, `decisions`, `approvedPlans`, `selected` and `deferrals` are added as step 7 says, and nothing else changes."
   - `workflows/redline-loop.js` 484-488: `GH`, `BACKGROUND` and `RUN_LINE` are built from `pluginRoot`, and `RUN_LINE` opens every agent's prompt. A changed root changes every prompt, so nothing would replay.

   Decided by: redline
2. **R3-2: is refusing an agreeing copy a question for the person?** No.
   - The PR spec's decision 1: "A relaunch runs the script the run launched with, or it does not run. No relaunch runs another build's script without the person being told and choosing Start fresh." Its decision 3: the refusal "offers Start fresh. It is not a stop that needs a hand fix."
   - The other option is a relaunch that stops at its first script call. R1-3's "when they agree, the relaunch goes on" was Redline's own round 1 decision, made before the guard's refusal was seen.

   Decided by: redline
3. **R3-3: what does a fallback launch record?** `args.pluginRoot`'s own workflow file. The PR spec's probe 8: "A launch by the `scriptPath` fallback records the live file as the record's `scriptPath`". SKILL.md section 6 (167) and line 123 build that path and `args.pluginRoot` from one `${CLAUDE_PLUGIN_ROOT}`.

   Decided by: redline
4. **R3-3: should a pin's blob equal the launch's?** No. The PR spec's deviation 5: "No 'overwritten pin' refusal: a pin is compared with the live file, and the launch blob only when there is no pin, since a live session runs the workflow it loaded after the file on disk changes (m6-inplace-edit)".

   Decided by: redline
5. **R3-4: `-z` or `core.quotePath=false`?** `-z`. git-config(1), `core.quotePath`: "Double-quotes, backslash and control characters are always escaped regardless of the setting of this variable. ... Many commands can output pathnames completely verbatim using the -z option."

   Decided by: redline
6. **R3-6: is `running` one install or each sharing the folder?** Each. The code marks each, and each runs this session's files. The PR spec measured which install a session runs against `installed_plugins.json` (probe 1), not against the CLI list's order, so marking the first would claim what was not measured. The docblock, which says "the install", is what disagrees, and it is put right.

   Decided by: redline
7. **R3-5: what would an exit 2 from `version` say?** "This repository is not set up for Redline yet". SKILL.md line 90: "on exit 2, stop as section 1 does"; line 15: "stop with one line: this repository is not set up for Redline yet (see `${CLAUDE_PLUGIN_ROOT}/docs/setup.md`)".

   Decided by: redline
8. **Measurement.** The guard refused to the shaper, as seen this round:
   - a `for` loop ("a role runs plain pipelines");
   - `git -c` ("a configuration key can name a program");
   - `cd <dir> && git` outside the repository root;
   - `man` and `/bin/bash`;
   - from round 1, `redline-prefs.sh run` and the harnesses.

   So:
   - R3-1's listing was measured with `find` on `/tmp` and `/opt/homebrew/bin`;
   - R3-4's quoting with `git diff --no-index` from the repository root on scratch trees, and git's and bash's own man sources read with `grep`;
   - R3-2, R3-3, R3-5 and R3-6 were read, R3-6 with the install registry on disk.

   Each task's cases are the code's measurement, seen red then green through the gate.

   Decided by: redline
9. **Version.** Stays `0.5.1`. The pull request bumped it once, and a review round adds no bump (process/release, line 5). No template body changes, so the marker stays v7.

   Decided by: redline
10. **Self-hosted.** This round changes `scripts/redline-prefs.sh`, `scripts/redline-setup.sh` and `skills/redline/SKILL.md`, and no workflow or agent file.
    - The skill text already in the conversation keeps its old text.
    - The scripts are read from disk at each call, so this run's next `run drift` runs the new one. There:
      - `copy_line` lets the run through, since it launched from this checkout loaded in place, so `args.pluginRoot` is `--plugin`;
      - the #81 list stays empty, since no round of this run changed an agent file.

    Decided by: redline
11. **Visuals, product context.** None. `agent-os/product/` does not apply to a review round.

    Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`. In short:
  - `scripts/redline-prefs.sh`: the header, `realdir`, `agent_paths`, `agent_list`, `version_line`, `copy_line`, `run drift`'s pin and #81 list, and `run check`;
  - `scripts/redline-setup.sh`: `version_plugin` and `version_installs`;
  - `scripts/redline-guard.sh`: `PLUGIN`, `script_name` and the deny for a bad path;
  - `workflows/redline-loop.js`: the version check and `GH`, `BACKGROUND`, `RUN_LINE`;
  - `skills/redline/SKILL.md`: sections 1, 2, 4, 5, 6 and 7;
  - `docs/running.md`, `docs/scripts.md`, `docs/upgrading.md`, `README.md`;
  - `tests/prefs-test.sh`, `tests/setup-test.sh`, `tests/guard-cases.tsv`, `tests/guard-test.sh`;
  - the PR spec and rounds 1 and 2's specs;
  - the scratch trees under `/tmp/redlinerepro/shaper-r3-q/`.
- **Product alignment:** N/A.

## Standards Applied

- **workflow/agents:**
  - line 16: a message says when it fires in the words of the decision behind it, so R3-2's line drops "whose agent files differ";
  - line 17: a rule is changed everywhere it is stated (R3-2's copy rule in the header, the skill and `docs/running.md`; R3-6's docblock and test comment);
  - line 45: the copy rule this round changes (standards item 1).
- **workflow/replay:**
  - line 23: the script a relaunch runs, which R3-3 reads;
  - line 24: both gates refuse another build (standards item 2).
- **scripts/bash-conventions:**
  - line 8: a function inside `$(...)` runs with `-e` off, and its caller reads what it printed (`agent_paths`);
  - line 11: a change to what a subcommand prints rewords every description of it (R3-2's line, R3-4's list);
  - line 29: two copies are compared by physical path (`realdir`, `pwd -P`);
  - line 43: bash 3.2 and BSD tools (`read -d`, `find`, `ln -s` in the harness);
  - a new line for git's `-z` (standards item 3).
- **testing/tests:**
  - line 13: a fix for one call site is pinned at a second (R3-2's real path at `run check` as well as `run drift`);
  - line 30: a case per changed surface with its neighbour, and a case per form (R3-4's byte above 0x7f, double quote, newline; the diff and the untracked listing);
  - line 35: red before green, and a pin that holds before is seen red under a mutation (R3-2's link spelling, R3-6's two installs);
  - line 39: the tests write only under the temp directory.
- **process/docs-gate:**
  - line 5: each touched plugin file names its section;
  - line 16: `docs/scripts.md` follows each header verbatim.
- **process/release**, line 5: no bump in a review round.
- **prompts/attribution:** Redline only.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 45.** After "since a resume of a hand-off or a review stop presents every call before `run drift` runs, and R1-3 had put the comparison in `run drift` alone (#137, R2-3)" and before "; a script run from the harness's copy under another copy's agents mixes the two", insert: "; and the copy is refused by its real path alone, whatever its agent files hold, since a relaunch keeps `args.pluginRoot`, every agent's prompt names that copy's `scripts/redline-gh.sh` and `scripts/redline-background.sh`, and the guard the session's copy registers runs only its own copy's scripts: compared by agent files, two copies whose agent files agreed relaunched, and every agent's script call was refused, so the agent-file comparison is gone and the rule for an agent file above holds for the #81 list alone (#137, R3-2)".
2. **`agent-os/standards/workflow/replay.md`, line 24.** After "so args an older skill built get the version line rather than a throw about a field this build requires." insert: " Nor does it relaunch from another copy at that version: a relaunch keeps `args.pluginRoot`, which every agent's prompt names for the plugin's scripts, so `run check` and `run drift` refuse when the session's copy is another directory by real path, before any agent; a copy whose agent files agreed relaunched, and its first script call met the session's guard (#137, R3-2)."
3. **`agent-os/standards/scripts/bash-conventions.md`, new line after line 29.** "- A list of paths read from git (`diff --name-only`, `ls-files`) is read with `-z` and a NUL-delimited read (`while IFS= read -r -d '' p`): without it git C-quotes a name holding a byte above 0x7f, a double quote, a backslash or a control character, and `core.quotePath=false` lifts only the first, so `run drift`'s list of changed agent files dropped such a file, whose quoted name ends in `.md"` and so matched no `*.md`, until #137, R3-4; a name kept for JSON is printed as a JSON string, one a line (`jq -cn --arg p "$p" '$p'`), so one holding a newline stays one entry".
4. **`agent-os/standards/testing/tests.md`: no change.** The round's cases are instances of lines 13 (the real path pinned at both gates), 30 (a case per form, with its neighbour) and 35 (red before green; the link spelling and the two installs seen red under a mutation).
5. **`agent-os/standards/process/docs-gate.md`: no change.** Each task names its sections under the existing lines 5 and 16.
