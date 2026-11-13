# PR #91 review round 1: keep the agent list an error or stopped resume passes, so the handoff comment is never posted twice: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 1 on PR #91 (issue #81), and nothing more. The round reviewed the whole pull request at `1c96b8c`, which is the working tree's HEAD and the start snapshot's `start_sha`. Line numbers here are at that commit.

- **R1-1** (correctness, medium, confirmed): `workflows/redline-loop.js:2990`. The handoff comment carries `AGENTS_CHANGED`, built from `args.drift`. The skill recomputes `args.drift` at every relaunch, error and stopped resumes included. So a resume past the comment changes the comment's prompt. A resume at `record files` or `record commit`, or a stopped run relaunched after the comment posted, reruns the comment with no duplicate check, and a resume at `handoff comment` itself has a duplicate check that looks for the new body, which is not the posted one. Either way the comment is posted a second time and review is requested again.

The review's twelve For the person entries are not findings and are not in scope. One of them (`workflows/redline-loop.js:244`: the agent sentence exists only when a relaunch passed `args.drift`, so an autopilot self-review reports nothing) is about the same sentence but asks a different question, what the comment should report. This round does not answer it (Unattended answer 7). The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

## Decisions

1. **R1-1: fix, in `redline-prefs.sh run drift`, with the skill and the docs reworded.** On an `error` or `stopped` marker, the `drift` that `run drift` prints keeps the agent list the marker's own `args.drift` passed (`[]` when it passed none). `agents` and `line` still name every changed file. `workflow` and `pinned` are computed as today, and so is `drift` being null when the workflow file is as launched and the list is empty. At a `handoff` or `reviewed` marker the list is read afresh, as today. Both of those stops come before Finish. The skill keeps setting `args.drift` to `drift` "exactly as printed", so the rule lives in the script and has prefs cases, as `run check`'s merged `hand` list does (Unattended answer 3).
   - `skills/redline/SKILL.md` section 7 (line 226) loses "so no replayed prompt depends on it", which the finding disproves, and says why the list is kept on those two markers.
   - `docs/running.md`, "Hand-off and relaunch" (line 86), `README.md` Known limits (line 104) and the script's header, with its verbatim copy in `docs/scripts.md`, say the same.
   - `tests/prefs-test.sh` gains four cases: an error marker keeps its list (red before the fix), its line still names every changed file, a stopped marker with no drift keeps an empty list (red before the fix), and a reviewed marker reads the list afresh (the neighbour, beside the hand-off case at line 309).
   - `tests/loop-test.mjs` section 17 pins the workflow's side of the contract. On a `record commit` resume with the held list, every prompt through the handoff comment equals the first attempt's. With the list read afresh, the comment is the first prompt to change. On a `handoff comment` resume with the held list, the comment's body is the posted one, so its duplicate check can match. Those checks pass as soon as they are added, so one gate run shows them red under a temporary edit that drops the sentence from `handoffComment`.

   This is the reviewer's smallest fix, the skill-side one, with two changes:
   - **Where it lives.** The rule goes in the script the skill copies from, not in skill prose. Unattended answer 3 gives the reasons: a red prefs case, the running session, and `run check`'s precedent.
   - **What it keeps.** It keeps only the agent list, not the whole marker `drift`. `workflow` and `pinned` are in no prompt (`workflows/redline-loop.js:240-241` and `3407` are their only reads), and keeping them fresh means the workflow still refuses a changed workflow file with no pinned copy on an error resume (the #81 spec's decision 6, two layers; Unattended answer 4).

   The reviewer's alternative, a Finish agent call that reads the agent files itself, is out of proportion (Unattended answer 7). Plan Task 2.
   Decided by: redline
2. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.4`, and `main` reads `0.2.3` (`git show main:.claude-plugin/plugin.json`). So this PR already carries its bump. This round changes no file a setup rerun writes: no template, no allow entry, nothing in `scripts/checks-template.sh` and nothing in the unattended section (`process/release`, first bullet).
   Decided by: redline
3. **Docs.** `scripts/redline-prefs.sh`: the header change goes into `docs/scripts.md`, "`redline-prefs.sh`", the verbatim header block (lines 196 to 199) (`process/docs-gate` line 16; `scripts/bash-conventions` line 10), and the behaviour goes into `docs/running.md`, "Hand-off and relaunch". `skills/redline/SKILL.md`: `docs/running.md`, "Hand-off and relaunch", and README "Known limits", whose line 104 says the handoff comment "repeats" what the skill says. Every description of the printed `drift` was searched for across `README.md`, `docs/`, `skills/` and `agents/` (`scripts/bash-conventions` line 11). The hits are the three above. `docs/running.md:118` and `docs/scripts.md:135` name `run drift` without describing `drift`, and `docs/guard.md:178` only points at running.md. No config key, subcommand, allow rule or exit code is added. `workflows/redline-loop.js` changes only for the red run and ends the task unchanged, so it needs no entry. Each entry's commit is Task 2's.
   Decided by: redline
4. **Nothing under `workflows/` or `agents/` is committed this round.** The workflow's own comment on `args.drift` (`workflows/redline-loop.js:229-231`) says it "is read in two places only, both outside every replayed prompt". The Finish read is inside the handoff comment's prompt, which a resume past it replays, so the wording is imprecise after this round too. Only the value it reads becomes stable. Fixing a comment's wording would commit `workflows/redline-loop.js` in this self-review. The next relaunch of this run would then go by `scriptPath`, and whether that prompts in bypass-permissions is still unmeasured (the #81 spec's "Unmeasured", second bullet). So the wording is left for the person (Context, third note), with a draft. The red run's edit of the file is restored before the commit.
   Decided by: redline

### Proportionality

- **Likelihood and visibility.** The fault needs four things together:
  - a self-review of this repository loaded in place, which is how every PR here is reviewed;
  - a round that commits a change under `agents/`, as this PR's own `ad81b68` did to `agents/redline-github.md` before this run launched;
  - for autopilot, any such edit, since autopilot never relaunches before Finish; for guided, an edit after the last hand-off;
  - an error or a harness stop after the handoff comment posted: a rejected push at the record commit, or a review request GitHub refused after the post. Those are the cases #59, R1-6 added the Finish duplicate checks for (`workflows/redline-loop.js:436-441`).

  It has not been seen yet, and a normal self-review can reach it. When it fires, the teammate gets a second `Redline handoff` comment, differing from the first by one sentence, and a second review request. Nothing is lost, but it is visible, noisy, and it breaks a guarantee the docs state: "a request-review or a push that failed after them is retried without posting or committing twice" (`docs/running.md:122`).
- **Cost of the fix.** Every file is in the PR's diff, and nothing new is added: no dependency, service, abstraction or prompt.
  - `scripts/redline-prefs.sh`: one `jq` line and one binding, a four-line comment, and four header lines that become eight. `docs/scripts.md` copies the header.
  - `tests/prefs-test.sh`: sixteen lines.
  - `tests/loop-test.mjs`: twenty-one lines.
  - One sentence each in `skills/redline/SKILL.md`, `docs/running.md` and `README.md`.
  - A temporary three-line edit of `workflows/redline-loop.js`, restored.

  That is in proportion to a medium finding, so it is `fix`.
- **What it gives up.** Today, an error resume before Finish (a failed gate at `recheck r2`, say) refreshes the list, so a comment not yet posted can name an agent file a round changed after the last hand-off. After this round it names the list the run last read at a hand-off or a `reviewed` stop. The skill's line at that resume still names every changed file. An autopilot run that never errs already names nothing (the For the person entry at `workflows/redline-loop.js:244`), so the comment now behaves the same whether or not an error came first. A rule that refreshed the list before Finish and held it only once the comment could have posted would need the workflow's label names in the script. For a `stopped` marker the script cannot tell where the run stopped at all. Unattended answer 2 is why the simpler rule is the answer the evidence gives.

## Unattended answers

1. **Is R1-1 real?** Yes. Reading the code confirms it, and no step of the trace depends on a model's choice.
   - `AGENTS_CHANGED` is built from `args.drift.agents` at startup (`workflows/redline-loop.js:234-246`), pushed to `warnings` (line 2047) and added to the handoff comment's text (lines 2989-2991). The comment's text is inlined in its prompt (`finishPrompt`, line 1804, "Write this file with the Write tool, byte for byte").
   - `finish()` (line 3117) runs `last round`, `PR description`, `resolve threads`, the comment, then `commitRecord()` (line 3325): `record files`, `record commit`.
   - `resumeLine` (line 443) adds the Finish duplicate checks only to the label `args.resume` names (`resume[opts.label]`). A resume at `record commit` therefore reruns a changed `handoff comment` prompt with no check. `tests/loop-test.mjs:1207` pins exactly that: "the handoff comment before a record commit resume carries no clause".
   - The GitHub agent's `comment` operation has no duplicate check of its own (`agents/redline-github.md:25`).
   - A resume at `handoff comment` gets the check, "when a comment there has exactly the body of the file Step 1 wrote" (line 449). The file Step 1 writes is the new text, so a changed list never matches.
   - The skill sets `args.drift` afresh "before every relaunch (a hand-off of either kind, a `reviewed` result, a stopped run, a resume)" (`skills/redline/SKILL.md:220`, `:226`). Section 2 routes every resume through it ("Every relaunch here goes through 'The script a relaunch runs' (section 7) first", line 53). `run drift` lists every file under `agents/` that differs from the launch commit (`scripts/redline-prefs.sh:219`), whatever an earlier relaunch passed.
   - The shaper's guard refuses interpreters, so neither the loop test nor the reviewer's `/tmp/redlinerepro/reviewer-r1-repro.mjs` was run here. The trace above settles it. The file `/tmp/redlinerepro/reviewer-r1-ReproTest.php` is a leftover from another repository (a PHP notification test) and is unrelated to this round.

   Decided by: redline
2. **Does the evidence already say which relaunch sets `args.drift`?** Yes. Every statement about an error or stopped resume except the new paragraph says it keeps the marker's args. The new paragraph's own goal is that no replayed prompt depends on `drift`.
   - `agent-os/standards/workflow/replay.md:8`: "The skill relaunches with byte-identical `args` plus only what the stop asked for ... A run the harness stopped is relaunched the same way with nothing added".
   - `skills/redline/SKILL.md:50`: "`error`: relaunch in this session with the marker's `args` exactly, plus `resume`". Line 52: "`stopped`: relaunch with the marker's `args` unchanged".
   - `docs/running.md:122`: "Then it relaunches with the marker's args plus `resume`", and "so a request-review or a push that failed after them is retried without posting or committing twice".
   - `skills/redline/SKILL.md:226`: "The workflow reads it only at startup and at Finish, so no replayed prompt depends on it". The PR description says the same: "`args.drift` is read only at startup and at Finish".

   The #81 plan's "replaced on each relaunch" (`agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/plan.md:68`) is the mechanism that breaks that goal at a Finish resume. That disagreement is the fix, not a question for the person. The answer: an error or stopped resume keeps the agent list the marker's args passed. Only a hand-off or a `reviewed` relaunch, both stops before Finish, reads it afresh. The reviewer marked the finding `needsDecision: false`.

   Decided by: redline
3. **Why the script and not skill prose?** Three reasons, each from the code.
   - **Precedent.** `run check` already merges marker state for the skill to copy: "the script has already merged the label's earlier entry, so copy it as printed" (`skills/redline/SKILL.md:50`). The script's header says "The skill calls this script so the merge rules live in one tested place" (`scripts/redline-prefs.sh:6`).
   - **A red test.** A prefs case can reproduce the bug red before the fix (`testing/tests` line 28). Skill prose has no harness, and the loop checks the reviewer asked for pass on arrival, since they pin the precondition and the risk, not the rule.
   - **The running session.** A round that edits the skill takes effect only in a new session (the #81 plan, "How this PR's own Redline review should be run"). The skill calls `${CLAUDE_PLUGIN_ROOT}/scripts/redline-prefs.sh`, which is this checkout's live file, so this run's own later relaunches get the rule. The running session's skill already says "set `args.drift` to it exactly as printed".

   Decided by: redline
4. **Why keep only the agent list and not the whole marker `drift`?** The agent list is the only part of `drift` a prompt names (`AGENTS_CHANGED`, line 244). `workflow` and `pinned` are read once, at startup, before any agent runs (line 3407), to refuse a changed workflow with no pinned copy. Keeping the whole marker `drift`, as the reviewer's fix reads, would leave that refusal blind on an error or stopped resume. The workflow would then rely on the skill's own `refuse` alone there, while the #81 spec's decision 6 gives the refusal two layers (`shape.md:41`). Recomputing those two fields changes no prompt.
   Decided by: redline
5. **What carries the red run?** Two parts, in one gate run.
   - **The prefs cases.** The error and stopped cases fail against today's script, which prints the fresh list (`agents/redline-reviewer.md`, `agents/redline-shaper.md`).
   - **The loop checks.** They pin the workflow's side, which already holds, so they are shown red by a temporary edit. Lines 2989-2991 (`if (AGENTS_CHANGED) { lines.push('', AGENTS_CHANGED) }`) are removed for that run and restored byte for byte before the commit. That is PR #89 round 3's Task 3 pattern (`agent-os/specs/2026-11-12-1337-89-review-round-3/plan.md`, Task 3: "It changes **temporarily**, for the red run below, and is restored byte for byte before the commit"). The comparison checks also require each side to be well formed (`testing/tests` line 24): a non-empty prefix, a first changed index above 0, and the agent file in the posted comment.

   Decided by: redline
6. **Is R1-1 already tracked?** No.
   - `scripts/redline-gh.sh issues-search` for "handoff comment", "drift" and "resume duplicate" finds #81 itself (this PR's issue, whose fix this finding is in), #20, #88, #70, #27, #23, #19, #2 and #73, none about a second Finish post.
   - This is round 1, so the PR has no earlier review-round folders. `agent-os/specs/` holds no other folder for PR #91.
   - The #81 spec's decision 3 checked the paths that could rerun a posted review. It did not check a Finish comment rerun by a changed prompt.

   Decided by: redline
7. **Is the reviewer's alternative, a Finish call that reads the agent files itself, needed?** No. It would add a prompt and a schema at Finish, and every loop-test check that lists Finish's calls would change, as five did for `last round`. It would need `git diff` for the GitHub role, which the guard grants or not, and a guard change is a person's. It would also make `args.drift.agents` redundant across `run drift`, the skill and the prefs cases. It would change what the comment reports, for autopilot too. That is the For the person entry at `workflows/redline-loop.js:244`, a reporting question for the author, not this finding's. The fix above closes the double post at a fraction of that cost.
   Decided by: redline
8. **Visuals, references, product context.**
   - **Visuals:** none.
   - **References:** see `references.md`.
   - **Product context:** `agent-os/product/mission.md`, "Honest about its reach" (line 17), and the #81 spec's alignment note ("nothing an agent does is hidden from the review thread"). A second handoff comment and a second review request are noise in that thread. No conflict, no mission edit.

   Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach" (Unattended answer 8).
- **Run caution (#81), noted for the person, not a decision.**
  - Task 2 commits `scripts/redline-prefs.sh`, `skills/redline/SKILL.md`, two tests and three docs files. Nothing under `workflows/` or `agents/` is committed, so this run's next relaunch, if any, still goes by name.
  - The running session keeps the skill it loaded. `run drift` is read live from this checkout, so it answers with the new rule from the next relaunch on: unchanged at a hand-off or `reviewed` stop, and the held list on an error or stopped resume.
  - The red run's edit of `workflows/redline-loop.js` is restored before the commit.
- **The workflow's comment on `args.drift`, noted for the person, not a task (Decision 4).** `workflows/redline-loop.js:229-231` reads "It is read in two places only, both outside every replayed prompt: at startup, ..., and at Finish, where the handoff comment says which agent files changed." A wording that holds after this round: "It is read in two places only: at startup, before any prompt, where ..., and at Finish, in the handoff comment, which says which agent files changed; a resume past that comment replays it, so an error or stopped resume passes the agent list its marker held (redline-prefs.sh run drift; #91, R1-1)." It can be applied by hand after the run, or in a PR that is not reviewed from the checkout it changes.
- **The PR description, noted for the person, not a task.** "For the reviewer", "Gate:" says the loop test passes 718 checks and the prefs test 117. After this round they are 725 and 121. "Prompts:" says "`args.drift` is read only at startup and at Finish", which stays true. A sentence that an error or stopped resume keeps the agent list would describe this round. No standard here asks a round to redraft the description, so the round writes no `pr-body.md`. The author can correct it by hand.
- **Plan approver adjustment 1.** The `testing/tests` citations now read line 24 (well-formed comparisons) and line 25, its second sentence (a check's name states only what it asserts), at `1c96b8c` and in the working tree alike. That covers `standards.md`, Standards Applied, Unattended answer 5, and the retrospective's item 3, which carried the same wrong line 25 for well-formed comparisons. Nothing else changed.

## Standards Applied

- `workflow/replay`:
  - line 8, byte-identical args on a relaunch, nothing added for a harness stop (Unattended answer 2);
  - line 17, a resume reruns forward from its label (Unattended answer 1);
  - line 20, `args.drift` (retrospective item 1).
- `testing/tests`:
  - line 23, a case per form and the neighbouring decision: the error and stopped markers each turn on one clause, and the hand-off and reviewed markers are the neighbours;
  - line 24, a comparison requires well-formed sides;
  - line 25, its second sentence, a check's name states only what it asserts;
  - line 28, red before green (Unattended answer 5).
- `scripts/bash-conventions`:
  - line 10, the header is the documentation and `docs/scripts.md` quotes it;
  - line 11, every description of what a subcommand prints is reworded (Decision 3);
  - line 29, only a small value goes through `--argjson`: the held list, never the whole marker entry, whose `args.files` grows with the PR;
  - the retrospective's item 2.
- `process/docs-gate`: lines 5 and 16 (Decision 3).
- `process/release`: line 5, no version change this round (Decision 2).
- `scripts/guard`: line 6. Every command the plan gives the implementer is a plain pipeline, with no `$`, no backticks outside single quotes, no process substitution and no interpreter.
- `process/standards-retrospective`: the proposed list below.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above.

1. **Decision 1 and Unattended answer 2 (R1-1): contradicting `agent-os/standards/workflow/replay.md` line 20.** Its "is read only at startup and at Finish; the loop test proves every prompt before Finish equals the run without it" reads as if Finish's own prompts were outside replay. R1-1 showed that a resume past the handoff comment replays that prompt. Replace line 20 with:

   > - What changed since launch enters as `args.drift` on a relaunch and is read only at startup and at Finish; the loop test proves every prompt before Finish equals the run without it. Finish's own prompts replay on a resume past them, and the handoff comment names `drift.agents`, so an error or stopped resume passes the agent list its marker's args held (`redline-prefs.sh run drift` prints it so), only a hand-off or a `reviewed` relaunch reads it afresh, and the loop test proves every prompt through the comment replays on a record-commit resume with the held list (#91, R1-1). A run never finishes from a round below the highest posted: that stop is not resumable (#81)

2. **Unattended answer 3 (where the rule lives): missing, one bullet added to `agent-os/standards/scripts/bash-conventions.md` after line 13.** The code already follows it (`run check`'s merged `hand`), and no standard states it. Drafted:

   > - A value the skill passes into `args` from the run marker is computed by `redline-prefs.sh run` and copied as printed, so its rule has a prefs case where skill prose would have none: `run check`'s `hand`, with the label's earlier entry merged in (#10), and `run drift`'s `drift`, whose agent list an error or stopped marker keeps as its own args passed it (#91, R1-1)

3. **Unattended answer 5 (the red run): already in a standard.** `testing/tests.md` line 28 (red before green), line 23 (a case per form and its neighbour) and line 24 (well-formed comparisons). The temporary mutation is PR #89 round 3's Task 3 pattern.
4. **Decision 2 (version): already in a standard.** `agent-os/standards/process/release.md`, line 5.
5. **Decision 3 (Docs): already in a standard.** `process/docs-gate.md` lines 5 and 16, and `scripts/bash-conventions.md` lines 10 and 11.
6. **Decision 4 (no workflow commit): no standard item.** It is a choice for this self-review run, with the docblock wording noted for the person. The run caution it answers is #81's, which `workflow/replay.md` line 19 records.
7. **Unattended answers 1, 4, 6, 7 and 8: no standard item.** Each is evidence for a decision above, or a rejected alternative.
8. **No pattern invented.** Item 2 states a practice the code already has. Everything else the plan uses is in `agent-os/standards/`.

If the standards approver approves neither item 1 nor item 2, the implementer records "Standards retrospective: no changes" under Decisions here at the gate.
