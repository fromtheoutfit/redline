# PR #65 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #65 (head `feature/16-release-process-semver-in-pluginjson-redline--v-tags-update-instructions-changelog`, issue #16), a whole-PR review. Four findings, all low severity:

- **R1-1** (nit, needs a decision): gate step 11 says "The reviewer treats a missing bump as a nit", but no Redline role carries that rule, and the text does not say which reviewer it means.
- **R1-2** (nit): README "Releases" tags first and commits the `CHANGELOG.md` entry afterwards; the spec's Task 8 commits the entry first so the tag points at it.
- **R1-3** (correctness, needs a decision): when a session on this checkout loads the cached release instead of the checkout, the guard no longer refuses `scripts/redline-guard.sh` and `hooks/hooks.json`, while the README's Known limits bullet and CLAUDE.md say it refuses them to every role.
- **R1-4** (nit): the `version <repoRoot>` header in `scripts/redline-setup.sh` leaves a root `plugin.json` that is not JSON out of its exit-2 list.

Nothing else is in scope. The original spec is `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/`. Outcome: R1-2 and R1-4 are `fix`; R1-1 and R1-3 went to the person as judgment calls and were decided on 2026-11-03 (R1-1: the Redline reviewer; R1-3: keep the warning, correct the docs). R1-3's guard that protects the two files by manifest is left to a person, under Deferred.

## Decisions

### R1-2: fix — commit the CHANGELOG entry before the tag in README "Releases"

**Investigation.** `README.md:210`, as the PR has it: "After the merge, on `main`, clean, from the plugin root: `claude plugin tag --dry-run .`, then `claude plugin tag --push`, which ... pushes the annotated tag; then the `CHANGELOG.md` entry, one heading for the version and one line per PR merged since the previous tag, grouped as the file says, committed on `main`." The original plan's Task 8 (`plan.md:150-152`) does the opposite: step 2, "`CHANGELOG.md`: `## 0.1.0 (unreleased)` → `## 0.1.0 (<today>)`, the `#NN` line filled; commit `redline: CHANGELOG for 0.1.0`. (The tag then points at this commit.)"; step 3, "`claude plugin tag --push`". Followed as the README says, the tag `redline--v0.1.0` names a commit whose `CHANGELOG.md` still reads `## 0.1.0 (unreleased)` with the `#NN` line (`CHANGELOG.md:5`, `:23`). The entry cannot wait uncommitted at tag time either: `claude plugin tag` refuses a dirty tree (original `shape.md`, "an uncommitted change to `README.md`: exit 1, `Uncommitted changes affecting this release — commit them first ...`"). `CHANGELOG.md:3`, `agent-os/standards/process/release.md:8` and gate step 11 (`.claude/commands/agent-os/shape-spec.md:252`) say only "at tag time" or "a person's step after the merge", so they hold either order and need no change for this finding. The order is settled from the evidence (Unattended answer 1).

**Proportionality.** Likelihood: every release from 0.1.0 on is cut by a person reading this paragraph; a person following it tags a commit without its own entry. Impact: low; the tag still names the right version, but the released commit's changelog lacks its own heading, and for 0.1.0 it carries the `#NN` placeholder. Cost: one sentence of `README.md`, already in the PR's diff. No test (the README has none), no new file. Proportionate.

**The change.** Rewrite the paragraph's procedure sentence so the entry is written, dated and committed on `main` first, and the dry run and the tag follow on the clean tree. The sentence before it, which holds "the reviewer treats a missing bump as a nit", is left as it is by this task: R1-1 was pending on that clause when shaped, and its decided task (plan.md, Task 5) changes it. `release.md`'s CHANGELOG bullet gets the same order through the standards retrospective (item 1 below), not through this task.

Decided by: redline

### R1-4: fix — name a root plugin.json that is not JSON in the header's exit-2 list

**Investigation.** `scripts/redline-setup.sh:121-123`, the `version <repoRoot>` header: "... one stderr line per warning, and exits 1 when any part warns; 2 when checks.sh or shape-spec.md is missing or settings.json is not JSON or has a byte-order mark." `version_plugin` (`:1449-1468`) also exits 2 through `die2 "$root/.claude-plugin/plugin.json is not JSON"` (`:1460`), and `cmd_version` passes that through (`:1491-1492`, `[[ $part -ne 2 ]] || exit 2`). The README's `redline-setup.sh` table row for `version <repoRoot>` (`README.md:349`) already lists it ("2 `checks.sh` or `shape-spec.md` missing, or a `settings.json` or root `plugin.json` that is not JSON"), and `tests/setup-test.sh:805-806` pins it ("a root whose manifest is not JSON: exit 2"). The general exit-code paragraph (`scripts/redline-setup.sh:141-145`, "2 on a bad invocation, a file that is not JSON, ...") covers it in general terms; the per-subcommand sentence is the one place that names the cases and misses this one. `agent-os/standards/scripts/bash-conventions.md` says "The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it", so the header should carry what the README row quotes.

**Proportionality.** A comment-only nit. Cost: two lines of the header become three, in a file already in the PR's diff. No behaviour change, so no new test: the existing case at `tests/setup-test.sh:806` is the proof of the behaviour the header now states. Not a fix that touches `scripts/checks-template.sh` or what `redline-setup.sh checks` writes into `checks.sh` (point 11 of the unattended section), so no restamp.

**The change.** The header's exit sentence ends "2 when checks.sh or shape-spec.md is missing, settings.json is not JSON or has a byte-order mark, or <repoRoot>/.claude-plugin/plugin.json is not JSON." (the reviewer's wording, with the list's "or" moved to its last item).

Decided by: redline

### R1-3: Keep the warning, correct the docs — guard and hook files go unprotected when a run on this checkout loads the cached release

**Option chosen:** Keep the warning, correct the docs.

**Decision (2026-11-03):** The author keeps the precheck warning and corrects the README's Known limits, CLAUDE.md and point 11 of the unattended section to say the guard refuses the guard and hook files only when the checkout loads in place, leaving a guard that protects them by manifest to a follow-up issue for 0.1.1.

Planned as plan.md, Task 4. The guard that protects the two files by manifest (option 2) is under Deferred below, a person's change. The standards item held for this decision is drafted as item 4 of the proposed retrospective below.

**Investigation.** Confirmed by reading.

- `scripts/redline-guard.sh:237-243`: `SELF_HOSTED = os.path.realpath(REPO) in {os.path.realpath(p) for p in PLUGIN_DIRS}`, and only `if SELF_HOSTED:` adds `SELF_HOSTED_FILES = ["scripts/redline-guard.sh", "hooks/hooks.json"]` to `PROTECTED_FILES`. `PLUGIN` comes from `CLAUDE_PLUGIN_ROOT` (`:62`, `:132`).
- `tests/guard-cases.tsv:445-450` pin the other side: "In a repository that is not the plugin, a file by one of the plugin's names is ordinary content", with `allow Write REPO/scripts/redline-guard.sh` and `allow Edit hooks/hooks.json`. The self-hosted denies are the `# @cwd PLUGIN` block (`:543-546` onward).
- After Task 8 of the original plan, the machine's `redline` marketplace is the GitHub one, and a session on this checkout loads the cached release unless started with `claude --plugin-dir` (original `plan.md` decision 8; `README.md:20`). The precheck then warns and the launch goes on: `skills/redline/SKILL.md:85`, "A warning, never a stop"; `agent-os/standards/process/release.md:11`, "the launch precheck warns with the `claude --plugin-dir` line, never stops".
- In that mode the cached guard sees this checkout as an ordinary repository, so a role may write the checkout's guard and hook files. What still holds them out of a plan: point 11 of the unattended section (`.claude/commands/agent-os/shape-spec.md:70`, defer, never fix) and the plan approver's file-scope check (`agents/redline-plan-approver.md:20`), which names "the Redline plugin's own directory", which in that mode is the cache, not the checkout. The checker's allowed list is the PR's files plus the approved plan, so it would not catch a planned guard edit.
- What the docs claim: `CLAUDE.md:57`, "the guard refuses them for every role even when this repository is the one under review"; `README.md:221`, "The guard script and the hook registration are refused for every role here, so a run cannot loosen the guard that vets it". `README.md:184` (The guard) and `agent-os/standards/scripts/guard.md:9` already qualify it as "this checkout loaded in place" / "its checkout loaded in place", so they are accurate. Point 11 says "In this repository the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` to every role", which is also not true in that mode.
- The same path comparison sets `/redline:setup`'s `selfHosted` (`skills/setup/SKILL.md:25`); a rerun from the cached copy would show a diff in `checks.sh`'s header paths, which the person sees before anything is written.
- In that mode the guard that vets the run is the cache's, so a run cannot loosen it by writing the checkout's file; what is lost is the promise in CLAUDE.md that the guard and hook files are changed by a person, never by a Redline run.

**Proportionality.** Likelihood: low. It needs a session on this checkout started without `--plugin-dir` after Task 8, a person who goes on past the precheck's warning, and a shaper that ignores point 11. Not observed: today the machine's marketplace is still the local directory, which loads the checkout in place. Impact if it fires: an unreviewed change to the guard or hook lands on a PR branch, where the teammate's human review is the last check. The fixes range from a few sentences to a guard change only a person may make.

**Why it goes to the person.** Decision 8 of the original plan, the author's own, chose "a warning the skill says and goes on from"; it did not weigh this consequence, and stopping instead would reverse it (a spec assumption). The guard change is in a file no Redline role may write (point 11). And the doc-only option accepts a weaker promise than CLAUDE.md makes today. The reviewer marked it `needsDecision`, and the question does arise.

**The judgment call as returned (why a person: spec assumption).**

Story: After 0.1.0 is tagged, this machine's `redline` marketplace becomes the GitHub one. Someone opens a session on the Redline checkout without `claude --plugin-dir` and runs `/redline:redline` on a Redline PR. The precheck prints its warning and the run carries on with the released copy. That copy's guard treats the checkout like any other repository, so it no longer refuses writes to the checkout's `scripts/redline-guard.sh` and `hooks/hooks.json`. The only things keeping a Redline run from editing them are a sentence in the shaper's instructions and the plan approver's judgment. CLAUDE.md and the README still say the guard refuses those two files to every role, which is not true in that mode.

Options:

1. **Stop the launch.** Cost: a few sentences. The precheck in `skills/redline/SKILL.md` (section 4, step 1) stops with the stderr line when `version <repoRoot>`'s JSON has `plugin.self` true and `plugin.inPlace` false. The README's "Developing the plugin" (`:20`), the "Template version" paragraph and the Known limits bullet (`:221`) change from "warns" to "stops". `release.md`'s last bullet changes in the retrospective. Reverses decision 8. Effect: no Redline run on this repository ever runs from a cached copy, so the guard's self-hosted protection holds for every run. Reviewing this repository with the released Redline (useful when a PR breaks the workflow it would review itself with) is no longer possible.
2. **Guard protects by manifest, by hand.** Cost: a person, after the run, changes `scripts/redline-guard.sh` so a repository whose `.claude-plugin/plugin.json` names `redline` protects the two files whatever `CLAUDE_PLUGIN_ROOT` is. They add `tests/guard-cases.tsv` rows for the new deny and the neighbouring allow (a repository whose manifest names another plugin), and a fixture repository that `tests/guard-test.sh` prepares. It protects cached-mode runs only once a release that carries it is installed. Meanwhile this round could ship option 3's sentences. Effect: CLAUDE.md's sentence holds in both modes.
3. **Keep the warning, correct the docs.** Cost: one sentence each in `README.md`'s Known limits bullet (`:221`), `CLAUDE.md:57` and point 11 of the unattended section (`.claude/commands/agent-os/shape-spec.md:70`, outside the gate section, so no restamp; keep its "The guard and the hook" title, which `tests/setup-test.sh:599` reads as a hand edit). Each says the guard refuses the two files only when the checkout loads in place, and from a cached release only point 11 and the plan approver keep them out. Effect: the docs say what the code does. The gap stays, behind the precheck warning, point 11 and the teammate's review.

Recommendation as returned: option 3. Keep the warning and correct the three sentences. Option 2 can follow by hand if the person wants the guarantee in both modes.

Decided by: @michaelfromtheoutfit

### R1-1: The Redline reviewer — which reviewer treats a missing version bump as a nit

**Option chosen:** The Redline reviewer.

**Decision (2026-11-03):** The author names the Redline reviewer as the one that reports a missing version bump, with a Version bullet beside Docs in its instructions that excepts a PR whose spec keeps the version on purpose, so a forgotten bump is caught before the merge instead of by claude plugin tag afterwards.

Planned as plan.md, Task 5. The standards item held for this decision is drafted as item 3 of the proposed retrospective below.

**Investigation.** Confirmed by reading. Gate step 11 (`.claude/commands/agent-os/shape-spec.md:252`): "The reviewer treats a missing bump as a nit." The same words are in `README.md:210` ("the reviewer treats a missing bump as a nit") and `agent-os/standards/process/release.md:5` ("and the reviewer treats a missing bump as a nit"). The PR description says the same, and so does decision 3 of the original plan ("the reviewer treats a missing bump as a nit", a rule the author set). None of them names the reviewer. `git grep -i -E "bump|semver|version step"` over `agents`, `workflows`, `templates` and `skills` finds only `templates/shape-spec-unattended.md:28`, the template's own marker note. The Docs step's counterpart is wired into two roles: `agents/redline-reviewer.md:34` (the Docs bullet) and `agents/redline-plan-approver.md:23` (check 8), and the README names "The Redline reviewer" for it (`README.md:208`). `agent-os/standards/process/docs-gate.md` uses the same bare phrase, "the reviewer reports a change with no entry as a nit", for the Redline reviewer. That analogy points one way but does not answer the question. No harness reads the reviewer's prompt (`tests/loop-test.mjs:18` reads only `workflows/redline-loop.js`). The gate hash covers backticked spans and fenced blocks only ("Prose outside backticks never changes it", `scripts/redline-gate.sh:26-28`), so rewording "The reviewer" in step 11 needs no restamp.

**Why it goes to the person.** Who checks the bump is product intent. Wiring it into the Redline reviewer changes what Redline reports on every Redline PR; naming the teammate leaves it to people. Neither the PR description nor the original spec says which (Unattended answer 4). The reviewer marked it `needsDecision`.

**The judgment call as returned (why a person: product decision).**

Story: A contributor opens a Redline PR and forgets to bump the version in `plugin.json`. The gate says "the reviewer treats a missing bump as a nit", but the Redline reviewer has no such instruction, so its review says nothing. A teammate reading "the reviewer" may assume Redline already checked. The miss shows up only after the merge, when `claude plugin tag` refuses because the version's tag already exists, and a follow-up PR is needed just to bump. What happens next depends on which reviewer the sentence means: either Redline learns the check, or the sentence names the teammate.

Options:

1. **The Redline reviewer.** Cost: one bullet beside Docs in `agents/redline-reviewer.md`. In a repository whose Verification Gate has a Version step, on a whole-PR review, a PR whose `.claude-plugin/plugin.json` version equals the base branch's (read with `git show origin/<base>:.claude-plugin/plugin.json`) is a nit whose `proposedFix` names the bump the step asks for (minor with the markers when it changes what a setup rerun writes, major for a contract change a rerun cannot carry, patch otherwise). The exception is a PR whose spec records keeping the version on purpose, as #16 keeps 0.1.0 for the first release. Also "The Redline reviewer" in gate step 11 (prose, no restamp) and in `README.md:210`, a Docs entry for `agents/redline-reviewer.md` naming Contributing, "Releases", and `release.md`'s first bullet in the retrospective. No harness covers it. Effect: a forgotten bump is reported before the merge, as a missing Docs entry is today.
2. **The teammate.** Cost: "the teammate reviewing the PR" in gate step 11, `README.md:210` and `release.md` (retrospective); no role changes, no restamp. Effect: no automated check. A forgotten bump is caught by the teammate or, failing that, by `claude plugin tag` after the merge.
3. **Both.** Cost: option 1's bullet, plus naming both reviewers in the three places. Effect: Redline reports it, and the teammate is told to look too.

Recommendation as returned: option 1. Name the Redline reviewer and give `agents/redline-reviewer.md` a Version bullet beside Docs, with the exception for a PR whose spec keeps the version on purpose.

Decided by: @michaelfromtheoutfit

## Unattended answers

1. **In which order do the CHANGELOG commit and the tag go? (R1-2)** The entry is committed first and the tag points at it. The evidence: the original `plan.md`, Task 8, step 2: "commit `redline: CHANGELOG for 0.1.0`. (The tag then points at this commit.)", then step 3: "`claude plugin tag --push`". Decision 4: "The `0.1.0` entry is written by this spec (Task 5) with `(unreleased)` after the heading, which the tag checklist replaces with the tag date". The PR description, "After merging": "Task 8 of the plan, by hand: fill the CHANGELOG's date and this PR's line, `claude plugin tag --push`, ...". Task 6.3's earlier draft of the README ("then the `CHANGELOG.md` entry ..., in the same commit as the next bump or on its own") put the entry after the tag. The as-built README dropped its "same commit as the next bump" half and kept the order, and the plan's own release checklist, written for the actual release with a stated reason, and the PR description both reverse that order. So the README disagrees with the answer, and the README is what changes.
   Decided by: redline
2. **Does this round bump the version? (gate step 11)** No. The original `plan.md`, decision 3: "This PR is the exception: it keeps `0.1.0`, the first release, never tagged yet." The PR description: "This PR is the exception: it keeps `0.1.0`, the first release." The round's commits are part of this PR, so the exception covers them, whatever R1-1 decides.
   Decided by: redline
3. **Does decision 8 settle R1-3?** No. Decision 8, the author's own, chose a warning that "the skill says and goes on from". It records nothing about the guard's self-hosted protection in that mode, which is the new question. Treating it as settled would decide option 3 for the person. It goes back as a judgment call.
   Decided by: redline
4. **Does the evidence say which reviewer step 11 means? (R1-1)** No. Gate step 11, `README.md:210`, `release.md:5`, decision 3 and the PR description all say "the reviewer" and nothing more. The only nearby precedent (`docs-gate.md`, "the reviewer reports a change with no entry as a nit") is an analogy, not an answer. It goes back as a judgment call.
   Decided by: redline
5. **Known already?** `scripts/redline-gh.sh issues-search` for "version bump" lists only #16 (this PR's issue). "self-hosted guard" lists only #14 (public docs). "SELF_HOSTED" and "hooks.json" list nothing. "CHANGELOG", "plugin tag" and "plugin.json" list #16 and #27 ("Backlog: the plugin checks its own version and state at launch", title only; it names neither the guard nor the changelog order). "redline-setup.sh version" lists #50 (guard and setup-template hardening from vestmark-com#13) and #14. `scripts/redline-gh.sh pr-comments 65` shows only this round's review. This is the PR's first round: `agent-os/specs/` holds no other `*-65-review-round-*` folder in the tree or on the PR branch. All four findings are new.
   Decided by: redline
6. **Scope, visuals, references, product context.** The scope is the four findings. No visuals. The references are in `references.md`. Product context: `agent-os/product/roadmap.md:14`, item 8, "Release process (#16)": "`claude plugin tag --push` by hand after the merge; `CHANGELOG.md` at tag time". R1-2's order fits it.
   Decided by: redline
7. **Which standards apply?** From `agent-os/standards/index.yml`: `process/release` (R1-1, R1-2, R1-3), `process/docs-gate` (gate step 10 entries; R1-1's precedent), `process/standards-retrospective`, `prompts/attribution`, `scripts/bash-conventions` (R1-4: the header is the documentation), `scripts/guard` (R1-3: the self-hosted case), and `testing/tests` (why R1-4 adds no case). See `standards.md`.
   Decided by: redline

## Deferred

### R1-3: a guard that protects the guard and hook files by manifest

- **Mitigation (this round, plan.md Task 4):** the README's Known limits bullet, `CLAUDE.md:57` and point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` say the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` only when the checkout loads in place; from a cached release, point 11, the plan approver and the teammate's review keep them out of a run. The launch precheck keeps its warning.
- **Full fix (left open, a follow-up issue for 0.1.1):** a person, outside any Redline run, changes `scripts/redline-guard.sh` so a repository whose `.claude-plugin/plugin.json` names `redline` protects the two files whatever `CLAUDE_PLUGIN_ROOT` is, and in the same commit adds `tests/guard-cases.tsv` rows for the new deny and the neighbouring allow (a repository whose manifest names another plugin) and a fixture repository that `tests/guard-test.sh` prepares. No Redline role may write the guard (point 11). It covers a cached-mode run only once a release that carries it is installed.

## Context

- **Visuals:** None
- **References:** the original spec (decisions 3, 4 and 8; Tasks 6 and 8), `README.md` (Install, Contributing, Known limits, the `redline-setup.sh` table), `CLAUDE.md`, `scripts/redline-setup.sh`, `scripts/redline-guard.sh`, `tests/guard-cases.tsv`, `tests/setup-test.sh`, `skills/redline/SKILL.md`, `skills/setup/SKILL.md`, `agents/redline-reviewer.md`, `agents/redline-plan-approver.md`, `CHANGELOG.md`, `scripts/redline-gate.sh`. See `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, item 8 (Release process, #16).
- **Not run.** No reproduction was needed or written: every finding is a statement in a file, confirmed by reading. The reviewer wrote none (`/tmp/redlinerepro/` does not exist). The harness counts before the round are the PR description's: `tests/setup-test.sh` 468 passed, `tests/gate-test.sh` 117 passed.

## Standards Applied

- process/release — R1-2 makes the README's release order match Task 8. R1-1 and R1-3 turn on its first and last bullets.
- process/docs-gate — each touched plugin file names its README section or its reason (Task 3: `scripts/redline-setup.sh`, no reader-facing change, the README row already says it). The README names the gate's steps by title.
- process/standards-retrospective — the proposed list below.
- prompts/attribution — no model or vendor name in the commits or the spec.
- scripts/bash-conventions — the header comment is the documentation, exit codes included, and the README quotes from it (R1-4).
- scripts/guard — the self-hosted case (R1-3). Point 11: the guard and hook files are a person's to change.
- testing/tests — a change that touches a tested surface adds a case. R1-4 changes a comment only, and `tests/setup-test.sh:806` already pins the behaviour it describes.

## Standards retrospective (proposed)

1. **R1-2, missing detail** in `agent-os/standards/process/release.md`, line 8 (the `CHANGELOG.md` bullet). After "`CHANGELOG.md` is written at tag time" insert: ", dated and committed on `main` before `claude plugin tag`, so the tag names a commit that carries its own entry (#65, R1-2)". The rest of the bullet stays as it is.
2. **R1-4, already in a standard.** `agent-os/standards/scripts/bash-conventions.md`, the header bullet: "The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it." No change.
3. **R1-1, missing detail** in `agent-os/standards/process/release.md`, line 5, the end of the first bullet (drafted for the person's choice, the Redline reviewer; was held for R1-1). Replace "and the reviewer treats a missing bump as a nit" with "and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)". The rest of the bullet stays as it is.
4. **R1-3, missing detail** in `agent-os/standards/scripts/guard.md`, line 9, the self-hosted bullet (drafted for the person's choice, keep the warning and correct the docs; was held for R1-3). After "the guard that vets the run is changed by a person, never by a Redline role (#4)." insert the sentence "Loaded from a cached release, the guard treats the checkout as an ordinary repository, and point 11 of the unattended section and the plan approver keep the two files out of a plan (#65, R1-3)." The rest of the bullet stays as it is. `agent-os/standards/process/release.md`, line 11 ("the launch precheck warns with the `claude --plugin-dir` line, never stops"): no change, since the warning stays.
