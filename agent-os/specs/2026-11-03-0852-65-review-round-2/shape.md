# PR #65 Review Round 2 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 2 on PR #65 (head `feature/16-release-process-semver-in-pluginjson-redline--v-tags-update-instructions-changelog`, issue #16). The review covered only round 1's fix diff (`3587774..862ab55`). It has one finding, low severity:

- **R2-1** (correctness, confirmed, no decision needed): round 1's R1-3 rewording says that when a run loads a cached release, the plan approver helps keep `scripts/redline-guard.sh` and `hooks/hooks.json` out of a run. The approver has no check that names either file. The claim is in four places: `README.md:221`, `CLAUDE.md:57`, point 11 of the unattended section (`.claude/commands/agent-os/shape-spec.md:70`) and `agent-os/standards/scripts/guard.md:9`.

Nothing else is in scope. The original spec is `agent-os/specs/2026-11-02-2003-16-release-process-semver-tags-changelog/`. Round 1's spec is `agent-os/specs/2026-11-03-0852-65-review-round-1/`, and R2-1 comes from its Task 4 (`4884677`) and its retrospective item 4 (`a3d420b`). Outcome: R2-1 is `fix`. The plan removes the plan approver from the three sentences in `README.md`, `CLAUDE.md` and point 11. The `guard.md` sentence is corrected through the standards retrospective, item 1.

## Decisions

### R2-1: fix — drop the plan approver from the sentences on what keeps the guard and hook files out of a cached-mode run

**Investigation.** Confirmed by reading.

- The claim, as the PR head (`862ab55`) has it:
  - `README.md:221` (Known limits): "Loaded from a cached release, the guard treats this checkout as an ordinary repository and does not refuse those two files: only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md`, the plan approver and the teammate's review keep a change to them out of a run, behind the precheck's warning."
  - `CLAUDE.md:57`: "... loaded from a cached release, it treats this checkout as an ordinary repository and does not refuse them, so point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the plan approver are what keep them out of a run."
  - `.claude/commands/agent-os/shape-spec.md:70` (point 11): "... loaded from a cached release, it treats the checkout as an ordinary repository and does not refuse them, so this point and the plan approver are what keep them out of a plan."
  - `agent-os/standards/scripts/guard.md:9`: "Loaded from a cached release, the guard treats the checkout as an ordinary repository, and point 11 of the unattended section and the plan approver keep the two files out of a plan (#65, R1-3)."
- What the approver actually does. `agents/redline-plan-approver.md` has eight checks, and none names `scripts/redline-guard.sh` or `hooks/hooks.json`. Check 5 (file scope, `:20`) bounces a task naming "one of Redline's own files (the Redline plugin's own directory, `.claude/redline/`, ...)". From a cached release, the plugin's own directory is the cache, not this checkout. Round 1 recorded this itself (round 1 `shape.md:51`: "names 'the Redline plugin's own directory', which in that mode is the cache, not the checkout"). Check 7 (standards, `:22`) holds a task to `agent-os/standards/` "as `standards.md` records them", so the approver would catch a guard edit only when the shaper put `scripts/guard` into `standards.md`. And `guard.md:9` names the approver as the protection, so the argument is circular.
- The workflow passes nothing more. `planPrompt` in `workflows/redline-loop.js` (`:1217-1240`) gives the approver the spec folder, the PR's files, earlier approved paths, the ask-rules block (`rulesBlock`, `:351-355`, the repository's `.claude/redline.json` rules, none here), the findings, the dispositions and the decisions. It has no guard-file rule. The shaper's own rule 7 (`agents/redline-shaper.md:25`) makes the guard and hook files `defer` only "When the repository is the plugin itself (its checkout loaded in place)", and points to "the repository's unattended-mode section". So in cached mode, point 11 is the one instruction that names them.
- The checker would not catch a planned edit either. Its allowed list is the approved plan (`README.md:286`: "'Unexpected' therefore means 'outside the approved plan', and the plan approver's file-scope review is what makes the list right").
- How the claim got in. R1-3's option 3, as returned to the person, said "from a cached release only point 11 and the plan approver keep them out" (round 1 `shape.md:68`). The same shaper's investigation two bullets earlier said the approver's check covers the cache. The person chose option 3, whose stated effect is "the docs say what the code does", and Task 4 and retrospective item 4 carried the approver into all four files.

**Proportionality.** Likelihood: the sentences sit in files every agent and reader in this repository meets. `CLAUDE.md` is loaded into every session, point 11 is in every shaper's instructions, and the README and `guard.md` are each one read away. Nothing misbehaves today, though. The claim only matters in a cached-mode run on this checkout, and the machine's marketplace still loads the checkout in place (round 1 `shape.md:56`). Impact: low. A reader, a shaper or an approver who trusts the sentence counts on a check that does not exist, so the precheck warning looks better backed than it is. Cost: three sentences in a fix task, plus one sentence of a standard through the retrospective. All four files are already in the PR's diff (`git diff --stat origin/main...HEAD`). There is no code change and no test, since no harness reads these sentences. Proportionate.

**The change.** The plan removes the plan approver from each sentence and changes nothing else:

- `README.md:221`: "only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the teammate's review keep a change to them out of a run, behind the precheck's warning."
- `CLAUDE.md:57`: "so only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` keeps them out of a plan." The reviewer's wording says "out of a plan", which matches point 11 and `guard.md`.
- Point 11: "so only this point keeps them out of a plan." The point keeps its title, `11. **The guard and the hook.**`.
- `guard.md:9`: "and only point 11 of the unattended section keeps the two files out of a plan; the plan approver has no check that names them (#65, R1-3, R2-1)". This is a standards edit, so it goes through retrospective item 1 (Unattended answer 4).

Plan: Task 2 (the three sentences) and Task 3 (the retrospective, item 1).

**Not planned: the reviewer's alternative.** The reviewer's other fix would make the claim true by giving check 5 of `agents/redline-plan-approver.md` a sentence that bounces a task on either file when the repository's manifest names `redline`. That file is not in the PR's diff, and the change would add a new safeguard, not correct a sentence. The person's R1-3 decision was to correct the docs so they say what the code does, and to leave protection of the two files to a person's follow-up (Unattended answer 1). The alternative therefore stays open beside that follow-up (round 1 `shape.md`, Deferred, R1-3), for a person to take up. The round does not add it.

**Round 1's record stays as written.** Round 1's `shape.md` (its R1-3 option 3, its Deferred mitigation at `:127` and its retrospective item 4 at `:152`) and its `plan.md` Task 4 still name the plan approver. They record what round 1 shaped and built, so this round leaves them alone and records the correction here.

Decided by: redline

### As built: retrospective item 1's "plan approver" count is 1, not 0

plan.md Task 3 expects `grep -c "plan approver" agent-os/standards/scripts/guard.md` to print `0` once item 1 is applied. The approved replacement sentence says "the plan approver has no check that names them", so line 9 still holds the phrase and the count is `1`. The plan's second proof for item 1 expects that same phrase to count `1`, and it does. The removed claim (`and the plan approver keep the two files`) counts `0`. The edit went in as approved. Only the plan's first expected count was wrong.

Decided by: redline

## Unattended answers

1. **Does R2-1 correct the docs or add the check to the approver?** It corrects the docs. The evidence is the person's R1-3 decision on this PR (round 1 `shape.md:42`): "The author keeps the precheck warning and corrects the README's Known limits, CLAUDE.md and point 11 of the unattended section to say the guard refuses the guard and hook files only when the checkout loads in place, leaving a guard that protects them by manifest to a follow-up issue for 0.1.1." The chosen option's effect (round 1 `shape.md:68`): "the docs say what the code does". The PR description: "A warning, never a stop; no new argument, so no guard change." The code (`agents/redline-plan-approver.md`, `workflows/redline-loop.js` `planPrompt`) has no check that names the two files. So the docs disagree with the code on that point, and the docs are what change. The reviewer marked the finding `needsDecision: false` and gave the doc correction as its first fix.
   Decided by: redline
2. **Is it known already?** No. `scripts/redline-gh.sh issues-search` results:
   - "plan approver": #1, #2, #3 and #50, whose titles are about planners, providers, stack configuration and guard and setup-template hardening from another repository's review.
   - "self-hosted": only #14 (public docs).
   - "redline-guard.sh": #3 and #50.
   - "manifest": #25, #16 and #3.
   - "guard hooks.json", "cached release" and "0.1.1": nothing.

   `scripts/redline-gh.sh pr-comments 65` shows only the round 1 and round 2 reviews. The PR branch holds one earlier round folder, `agent-os/specs/2026-11-03-0852-65-review-round-1/`, which is this finding's origin and does not disposition it. R2-1 is new.
   Decided by: redline
3. **Does this round bump the version (gate step 11)?** No. The original `plan.md:28`, decision 3, says: "This PR is the exception: it keeps `0.1.0`, the first release, never tagged yet." The PR description says: "This PR is the exception: it keeps `0.1.0`, the first release." `.claude-plugin/plugin.json` reads `0.1.0`. The round's commits are part of this PR, and the Redline reviewer's Version bullet excepts "a PR whose spec ... records keeping the version on purpose".
   Decided by: redline
4. **Where does the `guard.md` correction go?** Through the standards retrospective, as item 1, not through the fix task. `agent-os/standards/process/standards-retrospective.md` says: "In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit". Round 1 brought the same sentence in that way (item 4, `a3d420b`).
   Decided by: redline
5. **Does the change move the gate stamp or the setup test?** No to both.
   - Gate stamp: point 11 is at `shape-spec.md:70`, under `## Unattended mode (Redline)` (`:25`). The Verification Gate is the section at `:235`. `scripts/redline-gate.sh`'s header says "The hash covers every backticked span and every fenced block in the section ... Prose outside backticks never changes it". The changed sentence is outside that section.
   - Setup test: it reads this checkout's section as its hand-edit fixture (`tests/setup-test.sh:593-602`). It looks for "The guard and the hook" (`:599`), which stays. It checks that a `--merge` reproduces the section byte for byte (`:601`), which holds for any wording of the hand-edited line. Round 1 made the same kind of edit to point 11, and `setup` stayed at 468 passed (round 1 `plan.md`, As built).
   Decided by: redline
6. **Scope, visuals, references, product context.** The scope is the one finding. There are no visuals, and the reviewer wrote no reproduction (`/tmp/redlinerepro/` does not exist). None was needed, since the finding is a statement in four files, confirmed by reading. References are in `references.md`. Product context: the release process is the PR's subject (issue #16), and R2-1 changes no part of it.
   Decided by: redline
7. **Which standards apply?** These, from `agent-os/standards/index.yml`. See `standards.md`.
   - `scripts/guard`: the self-hosted bullet R2-1 corrects.
   - `workflow/agents`: what a role's prompt carries; retrospective item 2.
   - `process/standards-retrospective`: the route for item 1.
   - `process/docs-gate`: gate step 10 entries.
   - `process/release`: the Version step's exception.
   - `prompts/attribution`.
   - `testing/tests`: why no case is added.
   Decided by: redline

## Deferred

None this round. R1-3's full fix, a guard that protects the two files by manifest, is still open as round 1 recorded it (round 1 `shape.md`, Deferred), and it is a person's change. The issue searches in Unattended answer 2 found no open issue for it.

## Context

- **Visuals:** None
- **References:** `agents/redline-plan-approver.md`, `agents/redline-shaper.md`, `workflows/redline-loop.js` (`planPrompt`, `rulesBlock`), the four files carrying the claim, `README.md:182-186` and `:286`, `tests/setup-test.sh:593-602`, `scripts/redline-gate.sh` (header), round 1's `shape.md` and `plan.md`, and the original spec's `plan.md` (decision 3). See `references.md`.
- **Product alignment:** N/A beyond the PR's subject, the release process (#16).
- **Not run.** No reproduction was needed or written. Harness counts before the round come from round 1's `plan.md` As built: `guard` 588 passed, `loop` 495, `prefs` 101, `gate` 117, `setup` 468, `gh` 113, `background` 39.

## Standards Applied

- scripts/guard: the self-hosted bullet (line 9) is one of the four sentences R2-1 corrects, through the retrospective.
- workflow/agents: a role's prompt is where its checks live, so a sentence that credits a role with a check must find it there (retrospective item 2).
- process/standards-retrospective: the `guard.md` correction is a proposed standards edit, applied in its own commit once approved.
- process/docs-gate: none of the touched files is under a Docs directory, and the README sentence is itself the reader-facing text.
- process/release: this PR keeps `0.1.0` (Unattended answer 3).
- prompts/attribution: no model or vendor name in the commits or the spec.
- testing/tests: no harness reads these sentences. The change is prose in four files, so no case is added, and the gate run proves nothing else moved.

## Standards retrospective (proposed)

1. **R2-1, contradicting a standard.** `agent-os/standards/scripts/guard.md`, line 9, the self-hosted bullet. The sentence now wrong: "Loaded from a cached release, the guard treats the checkout as an ordinary repository, and point 11 of the unattended section and the plan approver keep the two files out of a plan (#65, R1-3)." Replace it with: "Loaded from a cached release, the guard treats the checkout as an ordinary repository, and only point 11 of the unattended section keeps the two files out of a plan; the plan approver has no check that names them (#65, R1-3, R2-1)." The rest of the bullet stays as it is.
2. **R2-1, missing.** `agent-os/standards/workflow/agents.md`. Insert one bullet directly after line 17 (the bullet that opens "A role that finds a problem with its own instructions"): "- A sentence that says what keeps a change out of a run, in the README, `CLAUDE.md`, a standard or a prompt, credits a role only with a check its prompt carries, read in that prompt before the sentence is written: #65's R1-3 correction credited the plan approver with keeping the guard and hook files out of a cached-mode plan, while its file-scope check names the loaded plugin's directory, which is then the cache, and the claim reached four files before R2-1 removed it (#65, R2-1)". No heading changes.
3. **The Version step's exception, already in a standard.** `agent-os/standards/process/release.md:5`: "except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)". No change.
