# PR #94 review round 3: the posted-text, reopen, minting, alias and result fixes the third review found — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The eight findings of Redline round 3 on PR #94 (issue #93), and nothing more. The round reviewed round 2's fix diff (`e788107..dae81d4`) and the coverage pass's candidates over the whole pull request at `dae81d4`, which is the working tree's HEAD. Line numbers here are at that commit. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares no `askRules`.

Sorted:

- `fix` (6): R3-2, R3-3, R3-4 (correctness); R3-1, R3-6, R3-8 (nits).
- `decline` (1): R3-5.
- `ask` (1): R3-7, a spec assumption, decided by the person on 2026-11-14 as Narrow the door, built as a fix in Plan Task 8 (Decision 8).
- No `defer`. No finding touches one of Redline's own files (`.claude/redline*.json`, `.claude/settings*.json`, `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.sh`). This repository is the plugin, loaded in place, so `agents/`, `skills/`, `workflows/`, `tests/` and `docs/` are planned like any other file (the shaper's rule 7). No task touches the gate's backticked text, `checks.json`, `checks-template.sh` or anything under `templates/`, so nothing needs a restamp, a regeneration or a version bump.

## Decisions

1. **R3-2: fix.** `commentBody` passes the Would confirm text through `postedText` (`workflows/redline-loop.js:1117`), as `findingLine` already does on the body line (line 910). `wouldConfirm` is one of the verifier's short fields, and `agent-os/standards/workflow/agents.md:17` says the workflow neutralises those itself; only a description, a reply, a mitigation or a commit subject is posted as written. #88 tracks the free text that is posted as written and the newline half of the candidate; this field is not in it. `docs/running.md:203` names the inline comment beside the review body. Plan Task 2.
   Decided by: redline
2. **R3-3: fix, by stating the coverage-off condition where the reopen is stated without one (the verifier's reading (b)).** The agent file (`agents/redline-reviewer.md:22`), the README's Known limits (`README.md:103`, "A decline is Redline's judgment") and `docs/running.md:45` say the decline reopen needs a coverage candidate, and that with `coverage off` (and on a final nit pass) a declined finding stays settled. The prompt is not changed: it already withholds the reopen when the round has no candidates (lines 1354-1357), on purpose, as Unattended answer 2 says. The loop test pins the new sentence in the agent file. Plan Task 3.
   Decided by: redline
3. **R3-4: fix, by giving a minted finding a title and a description that say what it lacks.** In `accountCoverage`'s mint (`workflows/redline-loop.js:1580-1584`), the title falls back from the summary to the failure scenario and then to `coverage candidate <index> (no summary given)`, and the description falls back from the scenario to the summary and then to a fixed sentence (`MINTED_NO_CLAIM`). The candidate is kept, not dropped, as Unattended answer 3 says. `coverageCandidates` is not changed. `docs/running.md:69` gains one sentence. Plan Task 4.
   Decided by: redline
4. **R3-1: fix, in the docs.** `docs/upgrading.md` gains a short section: from 0.3.0 a review body writes `unconfirmed` as the confidence word and the rule tail by login, which an older `redline-gh.sh prior-findings` does not read. So a pull request a 0.3.0 run reviewed is continued with 0.3.0 or later, and 0.3.0 reads the older forms too (`scripts/redline-gh.sh:343`). The failing code is an older release, which this pull request cannot change. The format change is this pull request's, and `docs/upgrading.md` is in its diff. The CHANGELOG entry is the owner's step at release (`agent-os/standards/process/release.md`, the CHANGELOG bullet), so the plan does not write it. Plan Task 5.
   Decided by: redline
5. **R3-6: fix, by naming the namespaced command in the posted line.** The Declined by Redline heading's overrule line (`workflows/redline-loop.js:3263`) names `/redline:redline-revise`, which always exists. `docs/running.md:24` says "the namespaced form always works", and the alias is optional (`skills/setup/SKILL.md:152`). The workflow is never told whether a repository has the alias, so it cannot pick one form or the other. The two loop expectations that quote the line follow it (`tests/loop-test.mjs:2297`, `2342`). `docs/running.md:114` names the namespaced form and the short one where the alias exists. The skill's closing summary already allows for both (`skills/redline/SKILL.md:240`), so it stays as it is. Plan Task 6.
   Decided by: redline
6. **R3-8: fix, by returning the scope-declined items apart in the result and naming them in the skill's summaries.** `result()`'s round entries gain `scoped` (`workflows/redline-loop.js:2204`), the round's scope-declined items in `compactFinding` form. `findings` stays as it is, every finding of the round, since the record keeps them on purpose (Unattended answer 5). The skill's review-only summary leaves `scoped` out of its by-category count and names those items in one line (`skills/redline/SKILL.md:170`). Its `done` summary adds one line for them after the declines (`skills/redline/SKILL.md:240`). `docs/running.md:116` says the closing summary names them. Plan Task 7.
   Decided by: redline
7. **R3-5: decline.** The reason is under Declined. No task.
   Decided by: redline
8. **R3-7: A decline overruled at a reshape's decisions stop is applied before that stop, so the relaunch can lose the person's other answer. Decided: Narrow the door.** A judgment call, `why_human: "spec assumption"`, put to the person.
   - Story, as the shaper wrote it: You run guided. The plan approver bounces the round's plan once, and the reshape raises a new question (say R1-2), so the run stops a second time in that round. The skill lists the round's declines too, and you answer R1-2 and type 'R1-5: fix' beside it. On the relaunch the workflow applies your R1-5 overrule at the round's first resolve, which ran before this stop. The first resolve and the first plan approver therefore rerun with new prompts instead of replaying. If the approver now approves, no reshape runs, so your answer to R1-2 reaches no resolve and R1-2 keeps the first shaper's disposition, with nothing telling you. That breaks the rule that decisions enter only after the prompt they answer. The path is rare: it needs a bounce, a reshape that raises a new call, and a decline in the same round. The #93 spec promised an overrule 'at a stop the run already makes in that round', and the two fixes either narrow that promise or extend the decisions record, so the choice is yours.
   - Options: **Narrow the door** (recommended): offer the round's declines only at stops reached before any plan approver of the round has run, and at a reshape's stop say to overrule on GitHub after the run. **Keep the door**: the hand-off names its stop and the workflow applies an overrule in the resolve after that stop, a new field on the decisions record. **Accept**: one line under README Known limits. Their costs and effects are in Plan Task 8 as the shaper wrote them.
   - Chosen: **Narrow the door.** @michaelfromtheoutfit offers a round's declines for in-session overrule only at stops reached before any plan approver of that round has run; at a reshape's stop the skill says in one line that the round's declines can be overruled after the run, by a reply in the thread and the human review pass, and the spec's shape.md records that decision 7's promise is narrowed, because an overrule applied before that stop changes earlier prompts and can lose the person's other answer on the relaunch.
   - Recorded as the notes ask: this narrows decision 7 of the #93 spec ("a typed line at a stop the run already makes in that round", `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md:48`, restated in `agent-os/standards/workflow/agents.md:11`). The in-session door now holds at a stop no plan approver of the round has run before: the first shape's stop, the first resolve's unresolved stop, and the plan dial. At a reshape's stop, or its resolve's, the round's declines are overruled by the after-run door only. Plan Task 8. Retrospective item 5 is drafted for it.
   - Date: 2026-11-14.
   Decided by: @michaelfromtheoutfit
9. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.3.0`, and `main` reads `0.2.4` (round 1's Decision 21, round 2's Decision 16). This round changes nothing a setup rerun writes (`agent-os/standards/process/release.md`, first bullet).
   Decided by: redline
10. **Run caution.** Task 3 changes `agents/redline-reviewer.md`, and the rest of this run's rounds run under the edit. The skill names the file (README Known limits, "A self-review that edits an agent file runs its later rounds under the edit"). The edit only states the condition the prompt already applies. Task 7 changes `skills/redline/SKILL.md`'s summaries, which this run's own closing summary may or may not read, depending on whether the session reloads the skill. `workflows/redline-loop.js` changes in four tasks. Since R3-7 was decided (Decision 8), Task 8 changes it too, five tasks in all, and changes `skills/redline/SKILL.md`'s declines paragraph, which a later stop of this run reads only if the session reloads the skill. A relaunch runs the script the run launched with (`agent-os/standards/workflow/replay.md:19`).
    Decided by: redline

### Proportionality (the correctness findings)

- **R3-2.** Likelihood: an unconfirmed finding whose wouldConfirm holds a bare `@` identifier, such as a decorator or a docblock tag named in what would confirm a claim. The same run's verifier writes `@param` in this field in the loop test's own escaping scenario (`tests/loop-test.mjs:1729`). Impact: the account named is notified from the inline comment, and a bare tag formats what follows it. Cost: one call in one line, one loop check, one doc clause; no file outside the diff.
- **R3-3.** Likelihood: any `coverage off` run of round 2 or later whose history holds a decline for want of confirmation and whose fix diff confirms it. Impact: the agent file and the prompt disagree, so the reviewer either keeps a confirmed bug settled against the README's promise, or re-raises it and buys a round the prompt withholds. Cost: three sentences and one loop check; no file outside the diff.
- **R3-4.** Likelihood: needs the skill to return an object entry with neither field beside a well-formed one, and the verifier to leave that index out. Impact: a correctness finding with no claim is posted with an empty title and an empty bold line, and handed to the shaper, where a fix or an ask buys a round. Cost: two fallbacks and one constant in one function, one loop check, one doc sentence.
- **R3-7.** See the judgment call in Task 8 of `plan.md`; decided by the person as Narrow the door (Decision 8).

## Declined

The reason below is the sentence posted in the finding's thread.

- **R3-5** (run `forceAskRules` and `checkWhy` before `checkSpec`): The reorder is no small refactor, since `forceAskRules` after `checkSpec` is `main`'s order (`git show origin/main:workflows/redline-loop.js`, lines 2690-2691) and the call it saves is spent only when the shaper's schema, which already refuses an outside reason (`judgmentCallSchema`), is not enforced; in that path the spec check's diagnosis of a halted shaper (#57) runs first, which is worth the one call.

## Unattended answers

1. **Are the findings real?** Each was traced in the code at the lines the Decisions cite. The shaper's guard refuses interpreters, so no harness was run here. No reviewer reproduction exists for this round (`/tmp/redlinerepro/` holds only round 1 files from another run), and no scratch test was needed.
   - R3-2: `commentBody` pushes `(f.wouldConfirm || 'not stated').trim()` raw (1117); its title goes through `postedText` (1106), and `findingLine` passes wouldConfirm through it (910).
   - R3-3: the history header adds the reopen only when `Array.isArray(candidates)` (1356), and so does the handled-list header (1371). `agents/redline-reviewer.md:22`, `README.md:103` and `docs/running.md:45` state the reopen with no condition.
   - R3-4: `coverageCandidates` rejects an array only when no entry has a summary or a scenario (1474), and keeps every other object entry with `''` for each (1478-1483). The mint copies both as they are (1582).
   - R3-7: `overrides` is computed once, after the first shape's stop (2904-2905), and the first resolve and the first plan approver's prompt both read it (2930-2958, through `roundDecisions`). `handoffResult` offers the round's declines at every decisions stop (3661), including the reshape's (2990) and the reshape resolve's (2996-2998). The loop test pins the overrule only at the first shape's stop (2261-2270).
   - R3-1: `findingLine` writes `unconfirmed` and ` · left to @<login> under rule <id>` (909-911). `main`'s `prior-findings` matches `confirmed|likely|unsure` only (`git show origin/main:scripts/redline-gh.sh`, line 334).
   - R3-5: `checkSpec` (2864) runs before `forceAskRules` (2865) and `checkWhy` (2866), as on `main` (2690-2691) but for `checkWhy`, which this pull request added.
   - R3-6: the line at 3263 names `/redline-revise` with no condition.
   - R3-8: the record keeps `findings: considered`, which holds the scoped items (3805, 3817). `result()` returns them under `findings` with no `scoped` field (2204).

   Decided by: redline
2. **R3-3: which reading, (a) or (b)?** Reading (b), from this pull request's own round 1 decision and the replay standard. Round 1's Decision 1 kept the history header unchanged under `coverage off` on purpose: "only when the round has candidates, so a `coverage off` prompt keeps its header (the reopen is the candidates block's rule, `agent-os/standards/workflow/replay.md:15`)" (`agent-os/specs/2026-11-13-1329-94-review-round-1/shape.md:17`). The standard: "the coverage call, the candidates block and its rules exist only when a pass ran" (`agent-os/standards/workflow/replay.md:15`). The agent file's own reopen paragraph already reads it so: "two exceptions that a coverage candidate can show" (`agents/redline-reviewer.md:20`). The code agrees with that answer, and the three unconditional sentences are the disagreement to fix.

   Decided by: redline
3. **R3-4: drop such a candidate, or keep it with a placeholder?** Keep it, from the PR description: "A candidate the verifier leaves out, or accounts for with a bad ref, becomes an unconfirmed finding of the round, with a warning. Nothing is dropped and nothing is parked." A candidate with a file and a line but no words is still something the finder pointed at. The shaper's second look can decline it with `could not confirm`.

   Decided by: redline
4. **R3-6: can the workflow tell whether the repository has the alias?** No. Its args carry no such field (`skills/redline/SKILL.md:120-156` lists them), and the alias files are the repository's (`skills/setup/SKILL.md:148`). The namespaced command works everywhere: "the namespaced form always works" (`docs/running.md:24`). So the posted line names it, and the docs name the short form where the alias exists.

   Decided by: redline
5. **R3-8: should `findings` in the result leave the scope-declined items out?** No. The pull request keeps them as findings of the round on purpose: "it stays a finding of the round, so a later round collapses a repeat as settled, but it is never posted inline, shaped or replied to" (`workflows/redline-loop.js:3801-3803`). The loop test pins two findings for that round (`tests/loop-test.mjs:442`). The result adds `scoped` beside them, so no reader of `findings` changes.

   Decided by: redline
6. **R3-7: does the #93 spec already answer it?** Not the choice between the fixes. Its decision 7 says the door exists: "a typed line at a stop the run already makes in that round" (`agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md:48`), restated in `agent-os/standards/workflow/agents.md:11`. A reshape's stop is one such stop. The replay standard says "Decisions ... enter the workflow only after the prompt they answer" (`agent-os/standards/workflow/replay.md:6`). At a reshape's stop the two cannot both hold as the code stands. Keeping the door means the decision record has to carry the stop it was typed at, a new field the skill writes and the workflow reads. Closing the door at that stop narrows decision 7. Either way something the spec agreed changes, so the finding is put to the person (Decision 8), and this answer settles only that the spec does not decide it.

   Decided by: redline
7. **Questions Steps 1 to 5 would ask.** Scope: the round's findings (unattended point 6). Visuals: none. References: the code each finding names, and round 2's spec as the plan's format (`references.md`). Product context: `agent-os/product/mission.md`, through the #93 spec's Context; nothing here moves it. Standards: those under Standards Applied, read at `dae81d4`.

   Decided by: redline

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond the #93 spec's; these findings tighten what that spec built.

## Standards Applied

- workflow/agents — line 17 (the workflow neutralises the verifier's short fields; R3-2), line 16 (a changed rule applied with the same wording and condition everywhere it is stated; R3-3), line 38 (a left-out candidate minted as a finding; R3-4), line 11 (the two doors to overrule a decline; R3-7), line 36 (the workflow's checks; R3-5).
- workflow/replay — line 6 (decisions enter after the prompt they answer; R3-7), line 15 (the candidates block's rules exist only when a pass ran; R3-3), line 19 (a relaunch runs the script the run launched with).
- testing/tests — red before green; a neighbour for each decision that must not change; escaped text pinned as the escaped string (line 10; R3-2); a check fails rather than throws.
- process/docs-gate — one Docs entry per touched plugin file.
- process/release — no bump: nothing a setup rerun writes changes. The CHANGELOG is the owner's step at release (R3-1).
- prompts/attribution — no model or vendor name in any commit or spec file.

## Standards retrospective (proposed)

1. **`agent-os/standards/workflow/agents.md`, line 17 (the posted-words bullet).** After "The workflow neutralises the finder's and the verifier's short fields itself", insert ", in every post that carries one: the Would confirm line went through `postedText` in the review body and was posted raw in the inline comment until #94, R3-2".
2. **`agent-os/standards/workflow/agents.md`, line 16 (the changed-rule bullet).** After "left the agent file's "is not raised again", the history header, the README's Known limits and `docs/running.md` unconditional until #94, R1-1", insert "; and a rule the prompt states only on some rounds (with candidates) is stated with the same condition wherever it is restated, since R1-1 made the agent file, the README and `docs/running.md` say the decline reopen with no condition while the prompt withholds it under `coverage off`, until #94, R3-3".
3. **`agent-os/standards/workflow/agents.md`, line 38 (the coverage-pass bullet).** After "at `(no file)`, line 0, when the finder gave no file, so `redline-gh.sh prior-findings` reads its line back (#94, R2-6),", insert "with a title and a description that say so when the finder gave neither a summary nor a failure scenario (#94, R3-4),".
4. **`agent-os/standards/workflow/agents.md`, after line 17.** A new bullet:
   > - A command a posted line tells a reader to run is the namespaced form (`/redline:redline-revise <pr> review @<login>`), since the short aliases are a repository's own optional files and the workflow is never told whether they exist; the session's own summaries may name the short form with the namespaced one beside it (#94, R3-6)
5. **For R3-7 (decided: Narrow the door).** Two edits.
   - `agent-os/standards/workflow/agents.md`, line 11 (the owner bullet). After "a typed line at a stop the run already makes in that round", insert " that no plan approver of the round has run before (a reshape's stop, or its resolve's, lists no declines and says they are overruled after the run, since the round's first resolve applies an overrule and that resolve ran before the stop; #94, R3-7)".
   - `agent-os/standards/workflow/replay.md`, line 6 (the decisions bullet). At the end of the bullet, after "a prompt before that point never mentions them", append "; and a stop takes only a decision whose prompt comes after it, so a decline overrule, which the round's first resolve applies, is taken only at a stop no plan approver of the round has run before (#94, R3-7)".
