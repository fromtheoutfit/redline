# PR #59 review round 1 — Shaping Notes

Shaped by Redline in unattended mode. PR #59 (issue #10, resume a run that ended in error), round 1, launch timestamp 2026-11-01-0935. The original feature spec is `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/`.

## Scope

The six findings of Redline round 1 on PR #59, and nothing else:

- R1-1 `run check` refuses the run's own files when the result does not list their folder (`scripts/redline-prefs.sh`).
- R1-2 a `.claude/` hand commit passes the check for every marker kind but is excused only on an error resume (`scripts/redline-prefs.sh`).
- R1-3 the settings are asked and saved before the resume question (`skills/redline/SKILL.md`).
- R1-4 a second resume at the same label drops the first resume's hand commits (`skills/redline/SKILL.md`, `scripts/redline-prefs.sh`).
- R1-5 a non-resumable error leaves the earlier stop's marker in place (`skills/redline/SKILL.md`).
- R1-6 the resume line promises duplicate checks that two Finish operations lack (`workflows/redline-loop.js`).

Five are `fix`, one (R1-2) is `ask`. Nothing is deferred. R1-2 was decided by the author on 2026-11-01: refuse it (see its entry under Decisions).

## Unattended answers

- **Scope.** The round's findings as the invoking prompt lists them. Evidence: the invoking prompt; the unattended section's point 6 in `.claude/commands/agent-os/shape-spec.md`.
- **Visuals.** None: a command-line plugin with no interface to mock.
- **References.** The files each finding names, their callers and their tests, listed in `references.md`. The reviewer's reproduction `/tmp/redlinerepro/reviewer-r1-marker.sh` was read (its four scenarios A to D match R1-1 (1), R1-1 (2), R1-2 and R1-5). The guard refuses `bash <file>` to the shaper, so it was not run; every finding below was confirmed by reading the code paths it names.
- **Product context.** `agent-os/product/mission.md`, "Decisions stay with people": a finding that needs a product or design decision goes back to the author. R1-2 is such a finding (see its entry below). No other product adjustment.
- **Standards.** `workflow/replay`, `workflow/agents`, `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution` (see `standards.md`): the same seven the original spec carried, since this round touches the same files.
- **R1-1, answered by the original spec.** Its Scope says resume checks "that the only untracked or modified paths are under the run's spec folders", and Decision 3 says "untracked or modified paths only under the run's spec folders". The run's spec folders are every folder the run writes: the start snapshot's folder (written by the skill before launch, `skills/redline/SKILL.md` section 5 step 4) and each round's folder (`specFolderFor` and `humanFolderFor`, `workflows/redline-loop.js` lines 264-265). The code lists only the folders the result recorded (`scripts/redline-prefs.sh` lines 158-161): a record with no result lists none (pinned by the prefs case "save: no result is a stopped run", `specFolders` `[]`), and a round joins `rounds` only after `post()` returns (`workflows/redline-loop.js`, the `rounds.push(record)` after `post`), so an error at `post r2` lists round 1 only while round 2's review files sit untracked. The code disagrees with the stated behaviour: that is the fix.
- **R1-3, answered by the skill's own text.** `skills/redline/SKILL.md` line 46: "Skip this on a relaunch after a hand-off or a `reviewed` result, and on a resume (section 4, "A stopped run")". The resume is decided in section 4, after section 3 has already asked and saved the settings, so the stated skip cannot be followed. The order is the fix.
- **R1-4, answered by the original spec.** Decision 10: "A hand commit's `.claude/` paths and SHAs ride in `hand`: the judge excuses the paths and the commits". The skill writes the label's entry as `{attempt, error, hand: <the check's hand>}` (line 76), replacing any entry already under that label, and `run check` computes `hand` only from the marker's head to HEAD (`scripts/redline-prefs.sh` lines 196-198). A second failure at the same label writes a marker whose head already holds the first hand commit, so the next entry drops it, and `judge()` (`workflows/redline-loop.js`, `excused` and `unprefixed`) then reports it. A second resume with no new hand commit drops it too (HEAD equals the marker's head, `hand` stays empty). The code disagrees with the decision: that is the fix.
- **R1-5, answered by the original spec.** Decision 12: a non-resumable error writes no marker "and the skill says fresh is the only path". The error handler's null branch (`skills/redline/SKILL.md` line 233) neither writes nor clears, so a marker an earlier stop of the same run left (a hand-off, written at line 209) survives and the next launch offers "Resume it?" for a stop that is gone, then reads `result` from a record the relaunch overwrote with the error. `run save` refuses and keeps the old entry (prefs case "save: a refused save leaves the entry"). Clearing it, as the `done`, `capped` and `review-only` handlers do, is the fix.
- **R1-6, answered by the PR's own docs.** README "Launching" names `handoff comment` as a resume label ("one entry for the agent label the error named (`recheck r1`, `shape r1`, `handoff comment`)"), and the original spec's Context says "nothing a resume does is hidden from the review thread, since the rerun agent's duplicate checks and the record commit are the same as a first run's". `resumeLine()` (`workflows/redline-loop.js`) tells every rerun agent "the duplicate checks in your instructions apply". `finishPrompt()` has none (it writes the file, posts with `comment`, then requests the review), and the GitHub role's `comment` bullet (`agents/redline-github.md` line 25) has none; `recordCommitPrompt()` stages, commits and pushes with no check for a commit an earlier attempt made, and the commit then fails "nothing to commit" (the loop test's "record: the commit fails" scripts that error). The code disagrees with the stated behaviour: that is the fix.
- **R1-2, not answered by the evidence.** The sources disagree on which stops a `.claude/` hand commit is allowed after. The original spec's Scope applies it to every resume: "HEAD (equal to the run's last commit, or on top of it with hand commits that touch only `.claude/` paths, which the checker then treats as pre-existing)", and the marker covers every stop (Decision 1). But the only path that carries `hand` into the workflow is `args.resume`, keyed by an error's label (Decision 10), and README "Launching" gives the rule's reason as "a fix to the gate's `checks.json`, `redline.json` or `settings.json` is expected after an error". Whether a hand-off, review-dial or harness stop accepts such a commit (and so the workflow must carry it) or refuses it is an assumption of the original spec, the person's to settle. It is a judgment call below.

## Decisions

### R1-1 fix: the run's own folders come from its args

`run save` takes the start snapshot's folder from the result's `snapshotStart`, else from `args.snapshotPath` (the same `ltrimstr` of `args.repoRoot` and the same fixed `/redline/snapshot-start.json` tail, never a split on `/redline/`). `run check` counts a path as the run's when it sits under a listed folder, or under `agent-os/specs/<stamp>-<pr>-review-round-` or `agent-os/specs/<stamp>-<pr>-human-review-`, where `<stamp>` is derived from `marker.args.launchedAt` exactly as the workflow derives its `stamp` (`workflows/redline-loop.js` lines 48-52). A marker whose args carry no well-formed `launchedAt` falls back to the listed folders.

- Likelihood and impact: every resume of a `stopped` marker is refused (its record has no result, so `specFolders` is `[]`, while the start snapshot is always untracked until a commit holds it), and so is every error at `post r<n>` after the first round. Both are reachable in normal use; a `stopped` marker is the headless-session case the marker exists for. The refusal tells the person to commit or remove the run's own record, which either breaks the baseline checker (removing `snapshot-start.json`) or turns the refusal into `head-moved` (committing it).
- Cost: one file in the PR's diff (`scripts/redline-prefs.sh`, about ten lines of jq in `run save` and `run check`), its header line, three or four prefs cases, one README sentence. No new dependency or abstraction.

Decided by: redline

### R1-3 fix: the stopped-run step moves before the settings

The "A stopped run" block moves out of section 4 to the end of section 2 of `skills/redline/SKILL.md`, right after the arguments are parsed, so a Resume skips sections 3 to 5 before anything is asked or saved. On Resume the skill says in one line that the run resumes with its original settings (the marker's `args`: interrupt, revise model, rounds, scope) and names any word typed after the PR number that it ignores. Every reference to "section 4, "A stopped run"" is updated.

- Likelihood and impact: every interactive resume, in order as written: the person answers the settings question, the answers are saved as the new defaults, and then the resume ignores them; typed words (`dry run`, `no push`, `autopilot`) are dropped without a word. Low severity, but on every resume, and `dry run` silently ignored is a surprise worth naming.
- Cost: one file in the PR's diff (prose moved, references updated), plus one README sentence.

Decided by: redline

### R1-4 fix: `run check` prints the cumulative hand list

`run check` merges the marker's earlier entry for its own label, `marker.args.resume[marker.label].hand`, into the `hand` it prints (commits and paths, each list without duplicates), whether or not HEAD moved since the marker's head. The new commits are still the ones checked for a path outside `.claude/` and counted for the plugin refusal. The skill copies one value; its line 76 says the script already merged it.

- Likelihood and impact: a resume that fails again at the same step after a hand fix (a gate fix that was not enough) is plausible, and a resume whose cause was transient (a GitHub flake) with a hand commit from an earlier attempt drops the commit too. Once it fires, every later attempt fails at the checker with "commits without the redline: prefix" and "files outside the approved plan changed", so the run can only be started fresh.
- Cost: `scripts/redline-prefs.sh` (a few lines of jq), one prefs case and its neighbour, one loop-test check, one sentence each in the skill and the README. All in the PR's diff.

Decided by: redline

### R1-5 fix: a non-resumable error clears the marker

In the `error` handler's `resumeFrom` null branch, the skill runs `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh run clear <repoRoot> <n>` before naming the folders, as the `done`, `capped` and `review-only` handlers do.

- Likelihood and impact: needs a stop that wrote a marker, then a relaunch in the same session that ends in a non-resumable error (a later round's `gather` finding the PR closed). The next launch asks "stopped at a hand-off ... Resume it?" for a stop that no longer exists; the check usually refuses on `head-moved`, but the question itself is wrong, and when it passes the skill reads a `result` the relaunch overwrote with the error.
- Cost: one line in `skills/redline/SKILL.md`. No test harness covers the skill's prose; the proof is the line itself.

Decided by: redline

### R1-6 fix: the resume line gives the two Finish operations their duplicate checks

`resumeLine()` in `workflows/redline-loop.js` adds one clause by label, as it already adds the shaper's replace sentence:

- for a Finish comment (`handoff comment`, `cap-hit comment`, `summary comment`) when `postToGitHub` is true: before Step 2, run `${GH} pr-comments ${pr}`; when a comment there has exactly the body of the file Step 1 wrote, an earlier attempt posted it, so post nothing, return that comment's URL and go on to Step 3;
- for `record commit`: before Step 1, run `git -C ${repoRoot} status --porcelain --untracked-files=all -- <the paths Step 1 names>`; when it prints nothing, an earlier attempt committed them, so skip Steps 1 and 2, set `committed` true and `sha` to what `git -C ${repoRoot} rev-parse HEAD` prints, and do Step 3.

The clause rides on the resume line only, so a first run's Finish prompts stay byte-identical (the replay standard's "a resume after an error changes exactly one prompt"), and the generic sentence's promise becomes true for every label a resume can land on. Every command in the clauses is one the guard already allows the GitHub agent (`tests/guard-cases.tsv` rows 490 and 493 for the two git spellings; `pr-comments` is a read subcommand).

The reviewer's alternative (narrow the generic sentence to the operations that have a check) was weighed: it is cheaper but leaves a resume at `record commit` unable ever to pass, and a resume at `handoff comment` posting a second handoff. The clause is the proportionate fix.

- Likelihood and impact: a `request-review` refused after the comment posted (a reviewer GitHub will not accept), or a push rejected after the record commit, both plausible on a real PR. The first posts one extra `Redline handoff` comment per attempt, visible to the teammate; the second can never be resumed.
- Cost: `workflows/redline-loop.js` (two clauses in `resumeLine()`), two loop-test checks (a resume at each label ends with the line and its clause) plus a mock field for a Finish comment error, one README sentence. All in the PR's diff.

Decided by: redline

### R1-2 decided: a `.claude/` hand commit after a hand-off, review-dial or harness stop is refused

Finding: R1-2, "A .claude/ hand commit after a hand-off, review-dial or harness stop: refuse it, or carry it into the relaunch?" (why it went to the person: spec assumption).

Story, as the shaper put it: A run on guided stops to ask you two questions. While answering, you notice the gate's checks.json is wrong and commit a fix under .claude/. You type /redline:redline 59 and pick Resume: the check passes, so the run relaunches with your answers and implements the whole round. Then the checker fails it, because your commit has no redline: prefix and touches a file outside the plan. A repair cannot undo a commit, so the run ends in error. Resuming from that error does not help either, because the new marker's head is already past your commit, so nothing ever excuses it. The round's work is done, and the only way forward is a fresh run. The original spec allows .claude/ hand commits on any resume and says the checker treats them as already there. But only an error resume carries them into the workflow, and the README explains the rule as a fix made after an error. Which stops accept such a commit is your call.

Options, as the shaper gave them:

- **Refuse it** (recommended). Cost: about five lines in run check (refuse a moved HEAD unless the marker's kind is error), one prefs case plus the existing error case as its neighbour, and a sentence each in the skill's Resume bullet and the README's Launching and Known limits. Effect: after a hand-off, the review dial or a harness stop, any commit on top is refused before launch with a line saying to start fresh, so no run fails halfway. A .claude/ fix stays possible after an error, which is the case the README gives.
- **Carry it**. Cost: a new args field that the skill passes on every kind's relaunch and the workflow reads into handCommits and handPaths (judge only, no prompt change), plus a loop-test scenario, skill and README text, and a replay standard bullet. It changes what the workflow reads. Effect: matches the original spec's Scope sentence for every stop: the hand commit is excused on any resume, and the relaunch passes the checker.
- **Accept it**. Cost: one README Known limits line. Effect: the check still passes and the relaunch still fails at the checker. The person learns from the README that a .claude/ commit is only excused after an error, and starts fresh.

Shaper's recommendation: Refuse it: it is the cheapest change, it matches the README's stated reason for the .claude/ rule (a gate fix after an error), and it turns a failure deep in the run into a clear refusal before launch.

Chosen: **Refuse it**.

Notes: The author refuses any commit on top of a stopped run unless it stopped with an error, so a .claude/ fix stays possible after an error and every other stop with a hand commit is refused before launch with a line saying to start fresh, instead of failing at the checker halfway through the round.

Date: 2026-11-01

Decided by: @michaelfromtheoutfit

### Standards retrospective

Standards retrospective: no changes. The standards approver approved none of the proposed edits below, so none was applied.

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`: the author keeps every decision. R1-2 went back to the author, who chose to refuse a hand commit after any stop but an error; the five fixes make the resume do what the original spec and the README already say it does.

## Standards Applied

- workflow/replay — R1-6's clauses ride on the resume line, so a first run's prompts stay byte-identical; R1-4 keeps the resume map's earlier entries meaningful across relaunches
- workflow/agents — R1-1 and R1-5 keep the marker an accurate record of the stop; the error result's `resumeFrom` is unchanged
- scripts/bash-conventions — `redline-prefs.sh` keeps one JSON object on stdout, exit 2 on usage, `jq` for every JSON value, read-only git, bash 3.2 and BSD tools
- testing/tests — each fix lands red before green with a case for the neighbouring decision that must not change
- process/docs-gate — every task that touches `scripts/`, `skills/` or `workflows/` names its README section
- process/standards-retrospective — the proposed edits below
- prompts/attribution — the spec folder, the prompt clauses and the commits carry no model or vendor name

## Standards retrospective (proposed)

Proposed at shaping; the standards approver approves the list and the implementer applies it in its own commit.

1. `agent-os/standards/workflow/replay.md`, last bullet ("A resume after an error changes exactly one prompt ..."): append "The resume line also gives the rerun agent the duplicate check its operation's prompt lacks (a Finish comment whose body is already on the PR, a record commit an earlier attempt made), so an operation with two effects resumes after the first one landed, and a first run's prompts stay as they were (#59, R1-6)".
2. `agent-os/standards/workflow/agents.md`, last bullet ("An error result names the agent label ..."): append "A marker names the run's own files from its args (the launch stamp and the PR give every spec folder the run can write, the snapshot path the start snapshot's), never only from a result a stop may lack; a hand list is cumulative, so a second resume at the same label carries the first's hand commits; and a stop that cannot be resumed clears the marker an earlier stop left (#59, R1-1, R1-4, R1-5)".
3. `agent-os/standards/testing/tests.md`, the `tests/prefs-test.sh` bullet: append "; a stopped record whose start snapshot is untracked, an error before a later round is recorded, a folder of another launch stamp still refused, and a second resume at one label that keeps the first's hand commits (#59)".
4. R1-2 (drafted for the author's choice, Refuse it): `agent-os/standards/workflow/agents.md`, line 31, the last bullet ("An error result names the agent label ..."), after item 2's text: append "; only an error marker accepts a hand commit on top of its head, since only an error resume carries the hand list into the workflow, so `run check` refuses any other stop (a hand-off, the review dial, a run stopped before a result) whose HEAD moved, before launch, with a line saying to start fresh (#59, R1-2)". No `workflow/replay.md` change: the workflow reads nothing new.
5. R1-3: no change. The skill's step order is the skill's; no standard covers skill step order and one finding does not make a rule.

Already covered: R1-1's "never split on `/redline/`" is the tests standard's existing prefs bullet; the red-before-green rule is `testing/tests`.
