# PR #137 review round 2 — Shaping Notes

Shaped by Redline in unattended mode, for review round 2 of PR #137 (issue #135; plugin 0.5.1, template v7), from the round's six findings (`redline/round-2-review.json`, `redline/round-2-findings.json`). The round reviewed round 1's fix diff, `57234d0..704bbaf`. Line numbers are at `704bbaf`, the head of the branch.

## Scope

The round's six findings, nothing more:

- **R2-1** (correctness, low, confirmed): the copy check R1-3 added compares the two copies' `agents/` with `diff -rq`. So a `.DS_Store`, an editor's backup or a scratch file in either copy refuses a relaunch that could run.
- **R2-2** (nit, low, confirmed): `run drift` hashes a relative `--plugin` against the repository root (`git -C "$root" hash-object`). Every other read of it uses the caller's directory.
- **R2-3** (correctness, low, confirmed; `sameClassAs` R1-3): `run check` has no copy check. So a hand-off resume presents every call, and only the relaunch's `run drift` refuses, discarding the answers.
- **R2-4** (correctness, low, unconfirmed): the installs warning may miss a project or local install whose `projectPath` Claude Code records through a symlink.
- **R2-5** (nit, low, confirmed): the skill gives no instruction for `run check`'s exit 2, and its sentence for `run drift`'s exit 2 names only a missing marker.
- **R2-6** (correctness, low, confirmed): at a stop, `run save` and `run drift` run only after the person has answered every call and typed `relaunch`. So a refusal found there discards every answer.

Other facts that bound the round:

- **Ask rules.** `.claude/redline.json` declares no `askRules`, so no repository ask rule covers any finding.
- **Redline's own files.** In this repository the plugin's source is repository content (rule 7). None of the six needs `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `scripts/checks-template.sh` or the gate's backticked text, so none is deferred under point 11. None is on a file of Redline's own.
- **Earlier issues.** `scripts/redline-gh.sh issues-search` was run for `agent files`, `run drift`, `projectPath` and `marker`. It listed #119, #131, #1, #124, #115, #123, #104, #109, #122, #66, #58, #50, #133, #19, #3, #101, #138, #118, #2 and #88, and none of them covers any of the six. #138 is round 1's drafted issue for R1-7, now filed: every reopen line names `--plugin-dir` for a run launched in place. It bears on R2-3's line, below.
- **The PR's comments** (`redline-gh.sh pr-comments 137`) hold the round 1 and round 2 reviews and nothing else.

Dispositions:

- `fix`: R2-1, R2-2, R2-3, R2-5, R2-6.
- `decline`: R2-4.
- No `defer`, no `ask`.

## Decisions

### R2-1: the copy check counts files that are no agent files — fix

Confirmed by running the comparison it makes.

- **The code.** The copy block of `run drift` (`scripts/redline-prefs.sh` 290-318) sets `differ=true` when `diff -rq "$lroot/agents" "$plugin/agents"` exits non-zero (307). Drift then prints `launch: refuse` with the copy line (309-315). The skill says the line, runs `run clear` and stops (`skills/redline/SKILL.md` line 249).
- **Measured.** Two scratch copies were written with Write:
  - `/tmp/redlinerepro/shaper-r2-launch/agents/redline-shaper.md`;
  - `/tmp/redlinerepro/shaper-r2-session/agents/redline-shaper.md` (the same bytes), beside a `.DS_Store` and a `redline-shaper.md~`.

  `diff -rq` printed `Only in .../shaper-r2-session/agents: .DS_Store` and `Only in .../shaper-r2-session/agents: redline-shaper.md~`, and exited non-zero, so `differ` was true. The planned comparison's pieces, run on the same two copies, list `redline-shaper.md` on each side, and `cmp -s` finds the pair equal.
- **Such files are real.**
  - This repository's `.gitignore` lists `.DS_Store`, so a checkout can carry one in `agents/` unseen.
  - A release can carry a non-agent file there too: the plugin cache's `claude-plugins-official/expo/1.13.9/agents/` holds only `openai.yaml`.
- **Unattended answer: what an agent file is.** The repository names its roles by file. The README's file table lists "`agents/redline-*.md` | The eight roles", and workflow/agents.md line 3 says "One role per file under `agents/`, loaded as `redline:redline-<role>`". So an agent file is a `*.md` file under `agents/`.
  - Paths with a part that starts with a dot are left out. This drops a `.DS_Store`, an editor's swap file, and the AppleDouble `._<name>.md` that macOS writes beside each file on a volume without its metadata.
  - A `*.md` in a subdirectory of `agents/` still counts. Whether Claude Code loads one there was not measured, and counting it keeps R1-3's recursive reach. A difference there is then refused rather than missed, and a missed difference is the silent mixing this pull request closes.
- **Proportionality.**
  - Likelihood: low. It needs a run whose launch copy and session copy are two directories at one version, plus a file in either `agents/` that is no agent file. It was not observed in a run.
  - Impact when it fires: a relaunch that could run is refused. The skill clears the marker, the person starts fresh and answers the calls again, and nothing on GitHub is lost.
  - Cost: two small helpers in `scripts/redline-prefs.sh`, the copy block's comparison read through them, one filter on the #81 list, the header mirrored in `docs/scripts.md`, two clauses of `docs/running.md`, and prefs cases. Every file is one the pull request changed. No new dependency: `find`, `sort` and `cmp` are POSIX (bash-conventions, line 43).
- **Instance or class.** The cause is what counts as an agent file. `run drift` reads agent files in two places, and both count files that are no agent files:
  - **The copy comparison** (290-318) counts every file under both `agents/`, hidden ones included. Exposed: this finding. Closed here.
  - **The #81 list** of changed agent files, on the plugin's own repository (349-353), counts every file under `agents/` that git does not ignore. A `.DS_Store` sits in this repository's `.gitignore`, but an editor's backup (`redline-shaper.md~`) or a scratch note does not. Such a file is named in the skill's agent line, in `args.drift` and in the handoff comment. Exposed. Closed here by the same rule.
  - **No other reader.** `grep` for `agents` in `scripts/redline-prefs.sh` finds only these two reads of the directory (306-307 and 352). Its other lines are the header and the output's `agents` field.

  Outcome `one-place`. Two helpers beside `realdir` hold the rule:
  - `agent_paths` keeps, from a list of paths, the `*.md` files with no part that starts with a dot;
  - `agent_list` lists a copy's agent files through it.

  The copy comparison compares the two copies' lists by path and then each pair by its bytes. The #81 list is read through `agent_paths`. Task 4 (R2-3) moves the copy comparison into a helper `run check` calls too, so the rule reaches the resume's gate as well. R2-3's cases pin it there with a stray file (testing/tests, line 13).
- **The change.** Task 2.

Decided by: redline

### R2-2: a relative `--plugin` is hashed against the repository root — fix

Confirmed by reading.

- **Where `$plugin` is read.**
  - Drift's blob comparison runs `git -C "$root" hash-object --no-filters "$live"` (347), with `live="$plugin/workflows/redline-loop.js"` (333).
  - `git -C <path>` runs "as if git was started in `<path>`", so a relative `$live` is read under the repository root.
  - Every other read takes the caller's directory: `version_line`'s manifest (186), `realdir` (281, 302, 339), the copy block's comparison (307) and `cmp` (345).
- **The guard.** It refuses `git hash-object` to the shaper ("git hash-object is not available to the shaper"), so this was read, not run.
- **Unattended answer.** bash-conventions line 28: "A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is". The code disagrees with it, and that is the fix. `-C "$root"` stays: the PR spec's deviation 2 hashes the blob in the repository's own object format ("hashed with `git -C <repoRoot> hash-object --no-filters` by setup and drift alike"), so the reviewer's other option, dropping `-C`, is not taken.
- **How it is made absolute.** `--plugin` is made absolute once, after its check (203), by prefixing `$PWD` when it does not start with `/`.
  - An absolute path is kept byte for byte, so every line that names the copy still names it as the skill passed it.
  - A `cd && pwd` would collapse a doubled slash. On this machine `TMPDIR` ends in a slash, and the prefs harness builds `$REC` as `${TMPDIR:-/tmp}/redline-prefs-records.XXXXXX`, so a collapse could move the copy lines the R1-3 cases pin.
- **Instance or class.** The cause is that `$plugin` is used as passed, and one of its readers runs under `git -C`. Members, the reads of `--plugin` in check and drift:
  - the manifest read in `version_line`;
  - `realdir` for `self`, for the copy check and for the pin;
  - the copy comparison;
  - `cmp` of the pin and the live file;
  - `hash-object` under `git -C "$root"`.

  All but the last read the caller's directory and hold. The last is exposed. Outcome `one-place`: making `--plugin` absolute where it is parsed closes every reader at once. `scripts/redline-setup.sh` hashes its own `PLUGIN_ROOT`, already absolute (`cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd`, 164), so it is not a member.
- **Cost.** One line, its comment, and a prefs case that runs drift from `$REC` with `--plugin plugin`.
- **The change.** Task 3. No header change: every documented call passes an absolute path, and the script now reads a relative one where it already read it everywhere else.

Decided by: redline

### R2-3: `run check` does not refuse another copy at the run's version — fix

Confirmed by reading.

- **Where each check runs.** `run check` refuses another version through `version_line` (389-390), and nothing in it (373-457) reads `args.pluginRoot` or `agents/`. R1-3's copy check lives in `run drift` alone (290-318).
- **The resume.** The skill runs `run check` first (`skills/redline/SKILL.md` line 51). For a `handoff` or `reviewed` marker it then presents the calls, drafts or findings and records the answers (53), and only the relaunch runs `run drift` (55, "Every relaunch here goes through "The script a relaunch runs" (section 7) first").
- **R1-3's premise.** R1-3's `cause.why` reads "`run drift` runs before every relaunch and resume". That holds for the relaunch, not for a hand-off resume's questions.
- **Unattended answer: how a copy refusal is offered on a resume.** The PR spec's `shape.md`, "How the refusal offers Start fresh": "On a resume, `run check`'s `version` reason is said, then one question offers Start fresh first and Stop second." Its answer (a): "The skill refuses before a relaunch (`run drift`) and before a resume (`run check`)."
  - Another copy is another build, as another version is, and needs no hand fix. So it is `run check`'s reason, said and offered the same way.
  - Stop keeps the marker. A person who reopens with the launch's copy loaded can then still resume, where `run drift`'s refusal clears the marker.
- **The line.** `run check` says the copy line `run drift` already prints, unchanged. A line naming the reopen with `--plugin-dir <launch copy>` belongs to #138's class (every reopen line names the flag), so it is not added here.
- **Proportionality.**
  - Likelihood: low. It needs a checkout and a release, or two checkouts, at one version with differing agent files, and a reopen that switches between them at a hand-off or a review stop.
  - Impact when it fires: the person answers every call, then the relaunch is refused and the marker cleared, so the answers are lost, and so is the marker that a reopen with the launch's copy could have resumed. Nothing on GitHub is lost.
  - Cost: the copy block moves into one helper (code this pull request wrote), and one `refuse` line goes in `run check`. Then the header mirrored in `docs/scripts.md`, one clause of the skill's resume bullet, two clauses of `docs/running.md`, and prefs cases. Every file is one the pull request changed.
- **Instance or class.** The finding is linked to R1-3 (`sameClassAs`), so it is a class. The cause is a refusal applied at one of the skill's two gates and not at its sibling. Members, the gates that must refuse another copy before the person answers anything:
  - **`run drift`, the relaunch's gate:** refuses (R1-3). Holds.
  - **`run check`, the resume's gate:** has no copy check. Exposed: this finding. Closed here.
  - **No other caller.** `grep` for `pluginRoot` in `scripts/redline-prefs.sh` finds only `version_line`'s naming of a marker with no launch, the copy block and the header.

  `run drift`'s other refusal, a workflow file that changed with no pin, is a check of the script, not of the copy. On a hand-off resume it is also found only after the answers. That is R2-6's cause, and Task 6 closes it by running `run drift` before anything is presented on such a resume.

  Outcome `one-place`. The comparison becomes one helper, `copy_line`, beside `version_line`. `run check` calls it as its `copy` reason, after `version` and before `branch`, and `run drift` calls it where the block stood. Its comparison is R2-1's, so R2-1's rule reaches both gates.
- **The change.** Task 4, after Task 2.

Decided by: redline

### R2-4: the installs warning may miss a project install recorded through a symlink — decline

The verifier could not confirm it. What would confirm it: install Redline at project scope from a repository opened through a symlinked directory, and read `projectPath` in `claude plugin list --json`.

- **Second look.**
  - The guard refuses `claude` to this role, so neither the install nor the CLI's list could be run.
  - The install registry on disk, read-only (`~/.claude/plugins/installed_plugins.json`), records every Redline project install under `/Users/michaelwitwicki/Code/...`. No component of those paths is a symlink (`ls -ld` of `/Users`, the home directory, `Code`, `Code/Claude` and `Code/Sites`). So no entry shows how Claude Code spells a project path reached through a link.
  - The session directories under `~/.claude/projects/` that came from the temp directory are named `-private-tmp-...`. Those sessions were started at the `/private/tmp` spelling, so they do not tell either way.
  - No git repository sits under `/private/tmp` to test `git rev-parse --show-toplevel` through `/tmp` (`find /private/tmp -maxdepth 4 -name .git`).
- **Second look: unconfirmed.**
- **A cheap guard?** None that is right whether or not the claim holds.
  - The cheap one, comparing `projectPath` with `$root` as well as `$rootp` as `mine` does, changes nothing for the skill. The skill's `repoRoot` is `git rev-parse --show-toplevel` (SKILL.md line 15), and bash-conventions line 29 records that "git prints the physical path".
  - The guard that would hold either way, resolving each listed `projectPath` with `pwd -P` before comparing, is a per-entry loop in `version_installs`, with a symlinked fixture and the header. That is not cheap for one warning line.
- **Harm if true.** One launch warning line is not printed. The warning is never a stop (the setup header; the PR description, "It is a warning, never a stop"), and the workflow's startup check still refuses a relaunch under another version. That is not serious in the sense of rule 3, so the finding is not put to the person.
- **Reason posted:** could not confirm: needs `claude plugin list --json` read after a project-scope install made from a repository opened through a symlinked path, to see whether `projectPath` is that path or its physical one, which is what `version_installs` compares with. Every project install on this machine sits under a path with no symlink, and this role cannot run `claude`.

Decided by: redline

### R2-5: the skill has no instruction for `run check`'s exit 2 — fix

Confirmed by reading.

- **The script.**
  - `version_line` returns 2 when `--plugin`'s manifest holds no version (186-187), and check and drift pass it on with `|| exit $?` (284, 389).
  - `run check` also exits 2 with no `--plugin` (203), when the saved file is not JSON (160-161) and outside a git repository (384).
  - The headers give both exits: `run check` (74-75) and `run drift` (105-106).
- **The skill.**
  - The Resume bullet (SKILL.md line 51) handles exit 1 and exit 0 of `run check` only.
  - Section 7 (251) says drift's exit 2 means "no marker, or, on the plugin's own repository, a marker with no start commit", which is wrong for a manifest with no version.
- **What the base branch did.** On `main` the header gave `run check` "Exit 0 ok, 1 refused". So exit 2 is this pull request's, and so is the gap (`git show main:scripts/redline-prefs.sh`).
- **Cost.** Two sentences in the skill. No shipped copy lacks a version, since the setup test requires the three version places to agree.
- **Instance or class.** The cause is the skill's instructions for the run subcommands' exits. The skill is the only reader of them. Every exit those headers give was read against what the skill says:
  - `run save`'s exit 2: handled ("Write the marker", 243).
  - `run save`'s exit 1: only for a `resumeFrom` that is null, which the skill never saves.
  - `run read`: exits 0 for the skill's arguments.
  - `redline-setup.sh version`'s exit 2: handled (90).
  - The two gaps: `run check`'s exit 2 and `run drift`'s exit-2 sentence. Both are closed here.

  Outcome `one-place`, in `skills/redline/SKILL.md`.
- **The change.** Task 5, after Task 4, which edits the same bullet.

Decided by: redline

### R2-6: at a stop, the marker and `run drift` come after every answer — fix

Confirmed by reading `skills/redline/SKILL.md`.

- **Where the marker and `run drift` sit today.**
  - "Write the marker" (243) runs `run save` "before saving the run record", and the record is saved "before the relaunch overwrites it" (241).
  - "The script a relaunch runs" (245) runs `run drift` "Before every relaunch ..., after the marker is written".
  - The stops place those steps in the relaunch turn, after the answers and the word:
    - the plan dial: "ask for the word ..., save the run record, and relaunch" (194);
    - the review dial: the same (200);
    - the deferred hand-off: "ask for the word ..., write the marker, save the run record, and relaunch" (263);
    - the decisions hand-off: the word first (237), then these paragraphs.
- **Why it matters now.** This pull request made both a stop. `run save`'s exit 2 now says its line and stops (243), and `run drift` refuses another version or another copy on every repository (249). So a refusal found there discards every answer the person gave, which are held only in the conversation.
- **What the base branch did.** On `main` the same order held, but on every repository but the plugin's own `run drift` answered `name` without a marker, and a failed `run save` went on.
- **Unattended answer: when the marker is written.** The skill's opening (line 9): "Every stop leaves a run marker in the same file (`redline-prefs.sh run save`), so the next `/redline:redline <pr>` can offer to resume it". `docs/running.md`, "Run markers and resume": "Every stop leaves a marker under `runs` ... a hand-off, the review dial, a run the harness stopped".
  - A marker written only in the relaunch turn leaves none for a hand-off the person walks away from. So the skill's order disagrees with its own stated rule, and that disagreement is the fix.
  - The PR spec's "How the refusal offers Start fresh" ("At a relaunch in the session, `run drift` refuses, and the skill clears the marker ... and stops") still holds: `run drift` still runs at the relaunch, refuses the same way, and is handled the same way, and it now also runs first.
- **Proportionality.**
  - Likelihood: reachable on this repository. A self-review whose round bumps `plugin.json` refuses at the next hand-off: the reviewer reports a missing Version bump as a nit (gate step 11), and R1-1 kept that refusal as deliberate. So does any `run save` that exits 2 (no session id, or zero or two matching records).
  - Impact when it fires: every answer at that stop is lost and asked again in the fresh run. Nothing on GitHub is lost.
  - The regression is this pull request's.
  - Cost: no code. The skill's wording in section 7's opening and in three of its paragraphs, the resume bullet for `handoff` and `reviewed`, and two sentences of `docs/running.md`, all in files the pull request changed. No harness reads the sentences: only `tests/loop-test.mjs` reads the skill, and a `grep` of it for their words finds none.
- **Instance or class.** The cause is where the skill places `run save` and the first `run drift`: in the relaunch turn. Members, every point where the skill can relaunch:
  - **The decisions hand-off:** asks first. Exposed. Closed here.
  - **The plan hand-off:** asks first. Exposed. Closed here.
  - **The review dial's stop (`reviewed`):** asks first. Exposed. Closed here.
  - **The end-of-run drafts (`deferred`):** asks first, and writes the marker after the word in so many words. Exposed. Closed here.
  - **A resume of a `handoff` or `reviewed` marker:** asks first, and `run drift` runs at the relaunch. Exposed for drift's own refusals, the no-pin workflow change included. Closed here by running `run drift` before anything is presented. Another version is `run check`'s already, and another copy is `run check`'s from Task 4.
  - **A run stopped before a result:** asks nothing but, at most, the word. Holds.
  - **An `error` or `stopped` resume:** relaunches in the same turn. Holds.
  - **An `error` with `resumeFrom`:** writes the marker and does not relaunch. Holds.

  Outcome `one-place`. When the marker is written and `run drift` first runs is set in "Write the marker" and "The script a relaunch runs", which every stop and every resume follows. A pointer at the top of section 7 sends each stop there before it presents anything. The one sentence that put the marker after the word (263) is changed with them (workflow/agents, line 17).
- **The change.** Task 6, after Tasks 4 and 5.
  - At a stop that asks the person, the marker is written and `run drift` run as soon as the stop is reported, before anything is presented.
  - On a `handoff` or `reviewed` resume, `run drift` runs right after `run check`.
  - A `refuse` or an exit 2 there is handled as it is today, before any question.
  - `name` and `scriptPath` say nothing yet.
  - `run drift` runs again in the relaunch turn, and the relaunch follows that answer.
- **This run.** The skill text already in this conversation keeps its old order, so this run's own stops are unchanged. The change reaches the next session that loads the skill.

Decided by: redline

### Standards retrospective

Proposed below, under "Standards retrospective (proposed)". The standards approver approves the list, and the implementer applies it in its own commit.

Decided by: redline

## Declined

- **R2-4.** could not confirm: needs `claude plugin list --json` read after a project-scope install made from a repository opened through a symlinked path, to see whether `projectPath` is that path or its physical one, which is what `version_installs` compares with. Every project install on this machine sits under a path with no symlink, and this role cannot run `claude`.

## Deferred

None this round.

## Unattended answers

1. **R2-1: what is an agent file?** A `*.md` file under `agents/` whose path has no part that starts with a dot.
   - The README's file table: "`agents/redline-*.md` | The eight roles". workflow/agents.md line 3: "One role per file under `agents/`".
   - A release can hold other files there: `expo/1.13.9/agents/openai.yaml` in the plugin cache.
   - A subdirectory's `*.md` counts, as R1-3's recursive `diff -rq` counted it, since whether Claude Code loads one there was not measured.

   Decided by: redline
2. **R2-2: how is `--plugin` made absolute?** Once, as bash-conventions line 28 says ("made absolute once ... and used as is"), and with `-C "$root"` kept for the blob, by the PR spec's deviation 2. An absolute path is kept as passed.

   Decided by: redline
3. **R2-3: how is a copy refusal offered on a resume?** As the version refusal is. The PR spec, "How the refusal offers Start fresh": "On a resume, `run check`'s `version` reason is said, then one question offers Start fresh first and Stop second." Its answer (a): "The skill refuses ... before a resume (`run check`)".

   Decided by: redline
4. **R2-6: when is the marker written?** At the stop. SKILL.md line 9: "Every stop leaves a run marker in the same file (`redline-prefs.sh run save`), so the next `/redline:redline <pr>` can offer to resume it". `docs/running.md`, "Run markers and resume": "Every stop leaves a marker under `runs` ...: a hand-off, the review dial, a run the harness stopped". Running `run drift` at the stop as well keeps the spec's "At a relaunch in the session, `run drift` refuses".

   Decided by: redline
5. **R2-4: is it serious if true?** No. The setup header and the PR description: the installs warning is "a warning, never a stop", and the workflow's startup check still refuses a relaunch under another version. So it is declined for want of confirmation, not put to the person.

   Decided by: redline
6. **Measurement.** The guard refuses to the shaper, as seen this round:
   - `git hash-object` ("not available to the shaper");
   - `mktemp`;
   - a `for` loop ("a role runs plain pipelines");
   - `claude`;
   - from round 1, `redline-prefs.sh run` and the harnesses.

   So:
   - R2-1's comparison was measured with `diff -rq`, `ls` and `cmp` on scratch copies written under `/tmp/redlinerepro/`.
   - R2-2, R2-3, R2-5 and R2-6 were read.
   - R2-4's second look read the install registry and the session directories on disk.

   Each task's cases are the code's measurement, seen red then green through the gate.

   Decided by: redline
7. **Version.** Stays `0.5.1`. The pull request bumped it once, and a review round adds no bump (process/release, line 5). No template body changes, so the marker stays v7.

   Decided by: redline
8. **Self-hosted.** This round changes `scripts/redline-prefs.sh` and `skills/redline/SKILL.md`, and no workflow or agent file.
   - The skill text already in the conversation keeps its old text.
   - The script is read from disk at each call, so this run's next `run drift` runs the new one. There:
     - R2-1's filter leaves the agent list as it is, since no round of this run changed an agent file;
     - the copy check is skipped, since this run launched from this checkout loaded in place, so `args.pluginRoot` is `--plugin`;
     - R2-2 changes nothing for an absolute `--plugin`.

   Decided by: redline
9. **Visuals, product context.** None. `agent-os/product/` does not apply to a review round.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`. In short:
  - `scripts/redline-prefs.sh`: `realdir`, `version_line`, the `--plugin` check, `run drift`'s copy block, its blob comparison and its #81 list, and `run check`.
  - `skills/redline/SKILL.md`: sections 2 and 7.
  - `docs/running.md`: "Hand-off and relaunch" and "Run markers and resume".
  - `docs/scripts.md`: the `redline-prefs.sh` block.
  - `tests/prefs-test.sh`: the fixtures, the drift cases and the R1-3 block.
  - `scripts/redline-setup.sh`: `version_installs`.
  - The PR spec and round 1's spec.
  - The scratch copies under `/tmp/redlinerepro/`.
- **Product alignment:** N/A.

## Standards Applied

- **workflow/agents:**
  - line 3: one role per file under `agents/`, the definition R2-1 reads;
  - line 17: a rule is changed everywhere it is stated (R2-6's restatements, R2-1's two readers);
  - line 45: agent files cannot be pinned, and a checkout and a release at one version are two builds (R2-1, R2-3).
- **workflow/replay:**
  - line 23: the script a relaunch runs, on every repository;
  - line 24: `run check` and `run drift` refuse a resume or a relaunch under another build (R2-3, R2-6).
- **scripts/bash-conventions:**
  - line 8: a function inside `$(...)` runs with `-e` off, and its caller reads what it printed (`copy_line`, `agent_list`);
  - line 11: a change to what a subcommand prints rewords every description of it (R2-3's `copy` reason, R2-5);
  - line 28: a path the script receives is made absolute once (R2-2);
  - line 29: git prints the physical path (R2-4);
  - line 43: bash 3.2 and BSD tools (`find`, `sort`, `cmp`; no `mapfile`).
- **testing/tests:**
  - line 13: a fix for one call site is pinned at a second (R2-1's rule pinned at `run check` in Task 4);
  - line 30: a case per changed surface with its neighbour, and a case per clause (R2-1's rules);
  - line 35: red before green, and a pin that holds before is seen red under a mutation.
- **process/docs-gate:**
  - line 5: each touched plugin file names its section;
  - line 16: `docs/scripts.md` follows each header verbatim.
- **process/release**, line 5: no bump in a review round.
- **prompts/attribution:** Redline only.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 45.** After "with no word (#137, R1-3)" and before "; a script run from the harness's copy", insert: "; an agent file there is a `*.md` file under `agents/` whose path has no part that starts with a dot, one rule that both the copy comparison and the #81 list of changed agent files read: compared as whole directories, a `.DS_Store` or an editor's backup in one copy refused a relaunch that would have run (#137, R2-1); and `run check` makes the same comparison as its `copy` reason, through the helper `run drift` calls, since a resume of a hand-off or a review stop presents every call before `run drift` runs, and R1-3 had put the comparison in `run drift` alone (#137, R2-3)".
2. **`agent-os/standards/workflow/replay.md`, new line after line 24.** "- A refusal of the relaunch is found before the person is asked anything: at a stop that asks the person (a hand-off of either kind, a review-dial stop), the skill writes the marker and runs `run drift` as soon as the stop is reported, and on a resume of such a stop it runs `run drift` right after `run check`, before presenting anything; the relaunch turn runs it again, and the relaunch follows that answer. Written and run only in the relaunch turn, a `run save` that exits 2 or a `run drift` that refuses discarded every answer the person had given, once #135 made both a stop on every repository (#137, R2-6)".
3. **`agent-os/standards/scripts/bash-conventions.md`, line 28.** Append: "; `run drift` hashed its `--plugin`'s workflow file under `git -C <repoRoot>`, which reads a relative path against the repository root, while every other read of `--plugin` used the caller's directory, until `--plugin` was made absolute once after its check, an absolute path kept as passed so the lines that name it read as the skill passed it (#137, R2-2)".
4. **`agent-os/standards/scripts/bash-conventions.md`, line 11.** Append: "; and an exit code a change adds to a subcommand the skill calls gets the skill's instruction for it in the same change: #135 documented `run check`'s exit 2 (no `--plugin`, or a manifest with no version) while the skill's resume handled only 0 and 1, and the skill's sentence for `run drift`'s exit 2 named only a missing marker, until #137, R2-5".
5. **`agent-os/standards/testing/tests.md`: no change.** The round's cases are instances of lines 13 (R2-1's rule pinned at the second gate), 30 (a case and its neighbour, a case per clause) and 35 (red before green, a pin that holds before seen red under a mutation).
6. **`agent-os/standards/process/docs-gate.md`: no change.** Each task names its sections under the existing lines 5 and 16.
