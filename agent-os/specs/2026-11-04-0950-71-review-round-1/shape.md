# PR #71 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #71 (head `task/14-public-docs-readme-for-installation-and-use-reference-moved-to-docs`, issue #14), a whole-PR review of the README split: the README cut to installation and use, the reference moved to `docs/`, Contributing to `CONTRIBUTING.md`. Seven findings:

- **R1-1** (nit): `CONTRIBUTING.md:7` still points at "Template version" under `checks.sh`, a section of the old README; the heading is now in `docs/contract.md`.
- **R1-2** (nit): the old README's "`claude plugin tag` is 2.1.316's" has no destination; `CONTRIBUTING.md` "Releases" runs the subcommand without saying which Claude Code has it.
- **R1-3** (nit): `docs/guard.md:170` puts "60 ms a row" beside "389 rows took 78 seconds", which do not fit; 78 seconds was the whole baseline.
- **R1-4** (correctness, needs a decision): after a dry run, the next launch stops at the precheck because the dry run's local record commit puts HEAD ahead of the PR; `docs/running.md` and `skills/redline/SKILL.md:167` say it starts at round 1.
- **R1-5** (nit): `docs/running.md` "Precheck" says "The workflow runs in the background and the session waits for it." twice.
- **R1-6** (nit): `docs/scripts.md:5` says every script prints one JSON object on stdout, which several subcommands do not.
- **R1-7** (nit): three sections of `docs/upgrading.md` repeat their heading as a bold lead-in.

Nothing else is in scope. The original spec is `agent-os/specs/2026-11-03-1259-14-public-docs/`. Outcome: R1-1, R1-2, R1-3, R1-5, R1-6 and R1-7 are `fix`; R1-4 was `ask`, a judgment call returned to the person, who decided it on 2026-11-04 as "Docs: drop the commits before the next run" (Decisions, R1-4). Nothing is deferred.

## Unattended answers

1. **Scope.** The seven findings of the invoking prompt, nothing more (unattended point 6). Every finding was opened at its file and line and confirmed by reading; none needed a scratch test, since each is a claim in a doc checked against the code or the old README. No reproduction for this round exists: the file at `/tmp/redlinerepro/reviewer-r1-ReproTest.php` is a Pest test dated 2026-11-03, before this run's launch, from an earlier run in another repository, and was not used.
   Decided by: redline
2. **Visuals.** None; the findings are about text.
   Decided by: redline
3. **References.** The code each finding names, its callers and the original spec, listed in `references.md`.
   Decided by: redline
4. **Product context.** `agent-os/product/roadmap.md:15`, item 9: "**Public docs** (#14): the README for installation and use, the reference under `docs/` ..., Contributing at the root, every reference to a README section moved with its section". R1-1 and R1-2 are both places where that last clause did not hold; their fixes finish it.
   Decided by: redline
5. **Standards.** From `agent-os/standards/index.yml`: `process/docs-gate`, `process/internal-notes`, `process/release`, `process/standards-retrospective`, `prompts/attribution`, `scripts/bash-conventions` (see Standards Applied).
   Decided by: redline
6. **Version.** The PR already bumps `0.1.0` to `0.1.1` (`.claude-plugin/plugin.json:4`, `.claude-plugin/marketplace.json:11`; `git show main:.claude-plugin/plugin.json` has `0.1.0`), which is decision 7 of the #14 plan ("Patch bump to `0.1.1` ...: no template changes"). This round changes docs and, at most, one sentence of a skill, so nothing is bumped again: gate step 11 asks for a bump per PR, not per round.
   Decided by: redline
7. **Where R1-2's clause goes.** The reviewer offers `CONTRIBUTING.md` "Releases" or the README's Requirements line. The #14 plan's decision 1 says "each reference moves with its section in the same commit", and `CONTRIBUTING.md` is where Releases moved (decision 10). The clause was added for the tag step: the #16 plan, `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/plan.md:118`, "Requirements: add 2.1.316 to the proven versions (`claude plugin tag`)". The new README's Requirements is for a person installing Redline, who never runs `claude plugin tag`. So it goes to Releases, beside the command.
   Decided by: redline
8. **R1-4: what the PR description and the original spec say.** The PR description: "A dry run's record commit stays local, and the next run starts at round 1 with nothing carried over." The #14 spec's walkthrough log, `shape.md` item 4: "The dry run committed its record locally ... and pushed nothing". Both state the intent (the commit stays local; the next run is a fresh round 1) but not what the person does with the commit before the next launch, and they cannot both hold without some action, since the precheck refuses a HEAD ahead of the PR. The same PR's `skills/redline/SKILL.md:167` calls the dry run's review "the record under the round's spec folder", which dropping the commit would delete. So the evidence informs the recommendation (it leans to keeping the commit off GitHub) but does not settle the question, and R1-4 goes to the person.
   Decided by: redline

## Decisions

### R1-1: fix — point "Template version" at docs/contract.md in CONTRIBUTING.md

**Investigation.** `CONTRIBUTING.md:7`: "The launch precheck warns when this repository is reviewed without it (`redline-setup.sh version`, "Template version" under `checks.sh`)." The old README's paragraph (`git show main:README.md`, line 20) is the same, word for word, and there "under `checks.sh`" meant the README's `## checks.sh` section. Neither the new README nor `CONTRIBUTING.md` has that section; `git grep -n "Template version" -- README.md docs CONTRIBUTING.md` finds only this line and `docs/contract.md:97`, `## Template version`. That section's paragraph (`docs/contract.md:99`) ends with the warning this sentence means: "The same call warns, on this repository only, when the session loads Redline from a copy that is not the checkout under review (`this repository is the plugin, but the run loads Redline from <dir>; ...`, #16 ...)". `git grep` for other old-section pointers (`under \`checks.sh\``, `under "Settings"`, `see "The guard"`, `see "Upgrading"`) across `README.md`, `docs`, `CONTRIBUTING.md`, `skills` and `agents` finds only this line.

**Proportionality.** A nit. Cost: one parenthetical in a file the PR adds. No test reads it.

**The change.** "Template version" under `checks.sh` becomes "Template version" in [docs/contract.md](docs/contract.md) (the reviewer's wording). plan.md, Task 2.

Decided by: redline

### R1-2: fix — say which Claude Code `claude plugin tag` needs, in CONTRIBUTING.md "Releases"

**Investigation.** `git show main:README.md`, line 24: "Requirements: Claude Code with dynamic workflows (proven on 2.1.303 to 2.1.316; `claude plugin tag` is 2.1.316's), ...". The new `README.md:9` reads "proven on 2.1.303 to 2.1.316" and `docs/setup.md:16` the same; `git grep -n "2.1.316"` finds no other line outside the specs that carries the clause. `CONTRIBUTING.md:29` ("Releases") runs `claude plugin tag --dry-run .` and `claude plugin tag --push` with no version. The #16 spec proved the subcommand on 2.1.316 (`agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/shape.md:19`, "`claude --version` is 2.1.316 on this machine"). Nothing records whether an older Claude Code lacks it, so the restored clause says only what the old README said.

**Proportionality.** A nit: the one piece of the old README the reviewer found with no destination. Cost: one parenthetical in a file the PR adds.

**The change.** After `claude plugin tag --push` in "Releases": "(`claude plugin tag` is Claude Code 2.1.316's)". Placement: Unattended answer 7. plan.md, Task 3.

**As built (deviation).** The commit message plan.md gave Task 3 names the subcommand and its host, and the guard's `ATTRIBUTION` pattern refuses that name in any case in a commit message. The commit went in as `redline: R1-2 say which version the plugin tag subcommand needs, in CONTRIBUTING.md Releases (#14)` (`b2964f4`). The file change is the planned one. A later plan that names a commit message should keep the product name out of it, even where the finding is about that product's version.

Decided by: redline

### R1-3: fix — say the 78 seconds was the whole baseline, in docs/guard.md

**Investigation.** `docs/guard.md:170`: "About 60 ms a row (389 rows took 78 seconds on 2026-10-26, most of this repository's gate)." The source is `.claude/redline/checks.sh:28`: "Baseline on 2026-10-26: 78 seconds, most of it the guard table (389 rows at about 60 ms each)", from `.claude/redline/checks.json:10-12` (`"seconds": 78`, the note). There 78 seconds is the whole baseline. 389 rows at 60 ms is about 23 seconds, so "389 rows took 78 seconds" does not hold. The old README's guard section (`git show main:README.md`, line 194) had no timing sentence; this one is new. `tests/guard-cases.tsv` now has 588 case rows (its non-comment, non-empty lines), as the reviewer counts. The new sentence gives no current count, so it cannot go stale on the next row.

**Proportionality.** A nit. Cost: one sentence in a file the PR adds.

**The change.** "About 60 ms a row; this repository's whole baseline, the guard table included (389 rows then), took 78 seconds on 2026-10-26." (the reviewer's first wording). It does not repeat "most of", which the arithmetic does not bear out. plan.md, Task 4.

**Outside this round.** The source line itself, `.claude/redline/checks.sh:28`, and the note it is generated from, `.claude/redline/checks.json:12`, say "most of it the guard table (389 rows at about 60 ms each)", which the same arithmetic questions. No Redline role may write either file (unattended point 11: a person edits `checks.json` and regenerates). It is not a finding of this round, so nothing is planned. It is noted here for the person.

Decided by: redline

### R1-5: fix — drop the repeated background sentence in docs/running.md "Precheck"

**Investigation.** `docs/running.md:27`, the first paragraph of "Precheck", second sentence: "The workflow runs in the background and the session waits for it." `docs/running.md:29`, the second paragraph, which opens "Before any of that, the precheck runs `redline-gate.sh check` ...", ends with the same sentence. `grep -cF` counts 2. The sentence belongs once in the section, and line 29 describes the step before the launch, so the copy there is the one to drop.

**Proportionality.** A nit. Cost: one sentence deleted from a file the PR adds.

**The change.** Delete the last sentence of line 29 (the reviewer's fix). plan.md, Task 5.

Decided by: redline

### R1-6: fix — say what the scripts print, in docs/scripts.md

**Investigation.** `docs/scripts.md:5`: "Every script starts `set -euo pipefail`, prints one JSON object on stdout and progress on stderr, and exits 2 on a usage error; a script whose exit code is an answer says so in its header." The headers the same file quotes say otherwise for several subcommands: `scripts/redline-gh.sh:9-13`, `diff`, "a diff --git header per file, then its patch"; `:14-15`, `pr-comments` ("issue comments and reviews on the PR") and `issues-search`, which print text (run in this session, `issues-search "dry run"` printed a tab-separated row and `pr-comments 71` printed `author:` blocks); `:18`, `has-review`, "exit 0 if ..., 1 if none, 2 on error"; `scripts/redline-gate.sh:12-13`, `stamp`, "Print the stamp line". `grep -L "set -euo pipefail" scripts/*.sh` lists no file, so that clause holds. The sentence is new in this PR. It paraphrases the `bash-conventions` index description ("set -euo pipefail, one JSON object on stdout and progress on stderr, usage errors exit 2", `agent-os/standards/index.yml:19`), which is itself wider than the code: see Standards retrospective, items 1 and 2.

**Proportionality.** A nit. Cost: one sentence in a file the PR adds. No quoted header changes, so the file's "copied verbatim at version 0.1.1" stays true.

**The change.** "Every script starts `set -euo pipefail`, writes progress to stderr and exits 2 on a usage error. What a subcommand prints is in its header: most print one JSON object, but `redline-gh.sh diff` prints a unified diff, `pr-comments` and `issues-search` print text, `redline-gate.sh stamp` prints the stamp line, and a subcommand whose exit code is the answer (`redline-gh.sh has-review`) says so." This is the reviewer's wording, with `pr-comments`, `issues-search` and `has-review` named too, since the reviewer's description lists them. plan.md, Task 6.

Decided by: redline

### R1-7: fix — drop the bold lead-ins that repeat their headings, in docs/upgrading.md

**Investigation.** `docs/upgrading.md:5` `## Updating the plugin`, then `:7` opens `**Updating the plugin.**`; `:19` `## Allow-list entries retired by #50`, then `:21` opens `**Allow-list entries retired by #50.**`; `:23` `## Unattended section versions (#15)`, then `:25` opens `**Unattended section versions (#15).**`. The old README's Upgrading section used the bold lead-ins as its only subheadings; the move made them headings and kept the lead-ins.

**Proportionality.** A nit. Cost: three lead-ins deleted from a file the PR adds.

**The change.** Delete each bold lead-in and the space after it; keep the headings (the reviewer's fix). plan.md, Task 7.

Decided by: redline

### R1-4: decided — After a dry run, what the docs tell you to do with its local record commit before the next run

**Investigation.** Confirmed by reading the workflow, the skill and the docs.

- A dry run commits its record and does not push it. `workflows/redline-loop.js:2968-2972`: "if (reviewOnly) { // The review-only run commits its record too (#10), so the next launch finds a clean tree. ... recordCommit = await commitRecord()". `recordCommitPrompt` (`:1466-1469`) gives the GitHub agent, when `push` is false, "Step 3. Do not push (... 'this is a dry run'); set pushed false." `skills/redline/SKILL.md:32`: `dry run` sets `postToGitHub = false` and `push = false`. A full dry run (not `review only`) makes the round's commits as well, none pushed (`docs/running.md:23`, "the round's spec commit, one per finding, and the run-record commit").
- The next fresh launch stops. `skills/redline/SKILL.md` section 4 (precheck), step 5 (`:89`): "`git rev-parse HEAD` must equal `headRefOid`". `:98`: "Any failure stops the launch with one line saying which check failed and what to do (... `pull or push so HEAD matches the PR` ...)". The README's Git rule 7 (`README.md:93`): "A fresh launch requires the PR's head branch, a clean tree and HEAD equal to the PR's head SHA." The review-only result clears the run marker first (`SKILL.md:167`, "Run `redline-prefs.sh run clear` first"), so no resume path catches it either.
- What the PR says instead. `docs/running.md:23`: "Because nothing was posted, the next `/redline:redline <pr>` finds no Redline round on the PR (`redline-gh.sh last-round` reads the posted reviews) and starts at round 1 with no carried findings". `skills/redline/SKILL.md:167`: "in a dry run say instead that nothing reached GitHub, so a later run starts at round 1 and carries nothing, and the review is the record under the round's spec folder." `docs/running.md:104` ("The run record"): "its commits, the record included, stay on the local branch." Each is true once HEAD matches the PR again, but none says how it gets there.
- The path is a recommended one. `skills/setup/SKILL.md:178`: "Then recommend: merge the setup PR first, then `/redline:redline <pr> dry run review only` on a real PR before the first real run." `docs/setup.md:144` recommends a dry run on a seeded PR.
- Not already tracked: `redline-gh.sh issues-search "dry run"` lists only #70 (setup with no gate); `"precheck HEAD"` lists nothing; `"record commit"` lists #21, #27, #30, #68 and #1, none about this. `pr-comments 71` holds only this round's review. This is round 1, and no other `*-71-review-round-*` folder exists.

**Proportionality.** Likelihood: high for anyone who follows setup's hand-back. The first real launch after the recommended dry run stops every time. Visible: yes, at once, with a one-line stop. Nothing is lost or corrupted. Impact: the docs and the skill's own summary told the person something else, and the stop line's "push" is the obvious reading. Pushing puts the dry run's spec folder on the PR branch, where the teammate sees it and the next round 1 reviews it as part of the change. Cost of a docs fix: a few sentences in `docs/running.md`, `skills/redline/SKILL.md` and `docs/setup.md`, all files this PR already changes; a patch-level change with no template impact. Cost of a workflow fix: `workflows/redline-loop.js`, the precheck, a `tests/loop-test.mjs` check and the docs, outside this PR (which leaves `workflows/` untouched), and a design question against #10's clean-tree rule.

**Why it goes to the person (product decision).** The reviewer marked it `needsDecision`, and the question does arise: something must happen to the commit before the next run, and every choice trades something the person owns. Dropping it deletes the dry run's record, which the same PR calls "the record under the round's spec folder". Pushing it publishes a dry run that "posts and pushes nothing" (`README.md:39`). Changing the workflow is a design change outside this PR. The PR description's "stays local" leans to dropping (Unattended answer 8) but does not choose for the person.

**The judgment call as returned (why a person: product decision).**

Story: You finish setting up Redline and, as setup suggests, try `/redline <pr> dry run review only` on a real PR. It writes the review under the spec folder and commits it on your branch without pushing. The docs, and Redline's own summary at the end of that run, tell you the next `/redline <pr>` starts fresh at round 1. Instead it refuses to start: "pull or push so HEAD matches the PR", because the dry run's commit put your branch one commit ahead of GitHub. Nothing tells you what to do with that commit. "Push" is the obvious move, and it puts the dry run's spec folder on your PR, where your teammate sees it and the next review reads it as part of the change.

Options:

1. **Docs: drop the commits before the next run.** Cost: a few sentences in `docs/running.md` ("Launching a run", "The run record"), the review-only summary in `skills/redline/SKILL.md:167` and one pointer in `docs/setup.md` ("Before the first real PR"), all files the PR already changes; a patch, no template change. Effect: the docs match the tool. The person copies the round's spec folder outside the repository if the review is worth keeping, runs `git reset --hard origin/<branch>`, and the next run starts at round 1 with nothing carried. The dry run's record survives only where the person copied it.
2. **Docs: push the commits before the next run.** Cost: the same files. Effect: the next run starts at round 1 and the record is kept on the branch. But the dry run's spec folder lands in the PR's diff, the next round 1 reviews it, the teammate sees it, and a seed PR's branch gains commits. It also sits awkwardly with "`dry run` posts and pushes nothing".
3. **Docs: state the stop only.** Cost: two sentences, in `docs/running.md:23` and `skills/redline/SKILL.md:167`. Effect: no false claim, but each person chooses between reset and push alone, and the stop line still steers toward push.
4. **Workflow: a dry run leaves nothing for the next launch to stop on, in its own issue.** Cost: `workflows/redline-loop.js`, the precheck in `skills/redline/SKILL.md`, a `tests/loop-test.mjs` check and the docs. It is outside this PR, which leaves `workflows/` untouched, and it is a design question against #10's clean-tree rule (Git rule 7); it needs a follow-up issue and spec. Effect: the docs' current claim becomes true once it ships. Until then this round still needs option 1, 2 or 3.

Recommendation as returned: option 1. The docs and the SKILL.md summary say to copy the round's spec folder out if it is worth keeping, then drop the dry run's commits with `git reset --hard origin/<branch>` before the next run. Option 4 can follow as its own issue if the person wants the step gone.

**Decision.** Option 1, "Docs: drop the commits before the next run".

**Notes.** The author has the docs and the review-only summary tell a person to copy a dry run's spec folder out if it is worth keeping and then reset the branch to origin/<branch> before the next run, and will file the workflow change that removes the step as its own issue.

**Date.** 2026-11-04.

**The change.** `docs/running.md` "Launching a run" (line 23) says a dry run's commits put HEAD ahead of the PR's head, so the next launch stops at the precheck until they are gone, and tells the person not to push them: copy the round's spec folder outside the repository if the review is worth keeping, then `git reset --hard origin/<branch>`. `docs/running.md` "The run record" (line 104) says the commits stay local until dropped before the next launch. The `review-only` summary in `skills/redline/SKILL.md:167` says the same in its dry-run clause. `docs/setup.md` "Before the first real PR" (line 144) points at "Launching a run". The wording is the shaper's draft for option 1, with one clause of line 23 adjusted so it no longer says the record stays under the spec folder after the reset. plan.md, Task 8.

**Outside this round.** The workflow change (option 4) is the person's own follow-up issue, as the notes say. This round plans nothing for it and defers nothing: option 1 makes the docs match the tool, which is the finding.

Decided by: @michaelfromtheoutfit

## Deferred

None.

## Standards retrospective (proposed)

Items reviewed, mechanically (gate step 12):

- **R1-1** (a pointer inside moved text left naming the old section): the #14 plan's decision 1 ("each reference moves with its section in the same commit") is the rule; no standard carries it, and a README split is a one-off. No change.
- **R1-2** (a clause with no destination after the move): the #14 plan's decision 5 (the section map, checked by this round) is the check; one-off to the move. No change.
- **R1-3** (a figure quoted out of its context): no standard covers figures in prose. No change.
- **R1-5**, **R1-7** (text repeated after the move): editorial, one-off. No change.
- **R1-6** (the doc claimed every script prints one JSON object): **contradicts a standard.** `agent-os/standards/scripts/bash-conventions.md:6` reads "`redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else". `diff`, `pr-comments` and `issues-search` are read subcommands (`GH_READ`, `scripts/redline-guard.sh:737`) that print a diff or text, and `has-review` prints nothing. The index description (`agent-os/standards/index.yml:19`) says "one JSON object on stdout" with no qualifier, which is what the new doc sentence repeated.
- **R1-4** (the docs and a skill summary said what the next launch does, and the precheck did otherwise): decided as option 1, a docs fix. Item 3 below.
- No pattern was invented for this round. The fixes are doc edits under `process/docs-gate` as it reads.

Proposed edits:

1. `agent-os/standards/scripts/bash-conventions.md`, line 6, the end of the bullet. Replace "`redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else" with: "`redline-prefs.sh resolve` and every `redline-gh.sh` read subcommand whose header says JSON print JSON and nothing else; a subcommand a role reads as text says what it prints instead (`diff` a unified diff, `pr-comments` and `issues-search` text), and one whose answer is yes or no (`has-review`) prints nothing and answers by exit code (#71, R1-6)". The rule itself ("A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr") is unchanged.
2. `agent-os/standards/index.yml`, the `bash-conventions` description. Replace "set -euo pipefail, one JSON object on stdout and progress on stderr, usage errors exit 2, every subcommand in the guard's groups" with "set -euo pipefail, one JSON object on stdout for what a workflow reads and progress on stderr, usage errors exit 2, every subcommand in the guard's groups".
3. **R1-4** (decided 2026-11-04, option 1). No change. The choice is a person's step after a dry run, written in `docs/running.md`, `docs/setup.md` and one sentence of `skills/redline/SKILL.md`. It is not a rule an agent, a script or a shaper follows, so no standard carries it. The requirement behind the stop is already the README's Git rule 7 (`README.md:93`, "A fresh launch requires the PR's head branch, a clean tree and HEAD equal to the PR's head SHA"), which the new wording now spells out for the dry-run case. The doc edits fall under `process/docs-gate` as it reads. The standards line option 4 would have needed, recording what a dry run leaves in the repository, belongs to the spec of the workflow issue the person will file, not to this round.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** roadmap Phase 1, item 9, public docs (#14), `agent-os/product/roadmap.md:15`. Every fix finishes that item's "every reference to a README section moved with its section".
- **Open issues checked:** `issues-search "dry run"` (#70 only, a gate made optional; not these findings), `"precheck HEAD"` (none), `"record commit"` (#21, #27, #30, #68, #1; none about these findings). `pr-comments 71`: only this round's review.
- **Ask rules:** `.claude/redline.json` declares none.
- **Redline's own files:** no finding touches one. `.claude/redline/checks.sh` and `checks.json` appear only under R1-3's "Outside this round", with nothing planned.

## Standards Applied

- process/docs-gate — Tasks 2 to 7 change `CONTRIBUTING.md` or `docs/`, which need no Docs entry; the R1-4 task (Task 8) names its entry for `skills/redline/SKILL.md`: `docs/running.md` "Launching a run", updated in the same commit
- process/internal-notes — the README, `docs/` and `CONTRIBUTING.md` are the long-form documents; the fixes stay in them and copy no internal note
- process/release — R1-2 restores the Claude Code version beside the tag step; the PR's patch bump to `0.1.1` covers this round
- process/standards-retrospective — the proposed edits above, applied in their own commit if approved
- prompts/attribution — every commit and spec file names Redline only
- scripts/bash-conventions — R1-6's wording describes the scripts' output as their headers state it; items 1 and 2 above correct the standard where it overstates
