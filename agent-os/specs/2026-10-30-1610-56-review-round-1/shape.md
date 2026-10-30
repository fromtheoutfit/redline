# PR #56 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #56, which closes issue #55 ("Checker reports no_git_block on a baseline whose git key is null"). The reviewer read the whole pull request and found no correctness bug and one nit. This is the final nit round, and it covers that finding and nothing else:

- **R1-1** (nit, low, confirmed): `README.md:262` says the run's `detail.checker` "keeps whatever the checker returned", but after a structural override it holds the copy `readStructure()` made, with `status: 'read'` and `reason: ''`. **Fix**: the README sentence says what the record holds, and a loop-test check pins it.

## Unattended answers

- **Scope.** The one finding in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-1-findings.json` and `redline/round-1-review.json` in this folder.
- **Visuals.** None. The change is one README sentence and one loop-test check.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** No product line changes. The README is brought in line with what the workflow already records.
- **Repository ask rules.** The invoking prompt lists none, and `.claude/redline.json` (read in full) has no `askRules` key. No finding is forced to `ask` by a rule. Neither file the fix touches is one of Redline's own files under rule 7, and neither is `scripts/redline-guard.sh`, `hooks/hooks.json` or `.claude/redline/checks.sh`.
- **Standards.** These apply: `workflow/agents` (line 19, what `detail.checker` keeps; line 20, the #55 override), `testing/tests` (line 8, the checker scenario; line 18, a case per tested surface; line 22, red before green), `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`. `scripts/bash-conventions`, `scripts/guard` and `workflow/replay` do not apply: no script, guard row or prompt text changes.
- **Already known?**
  - `scripts/redline-gh.sh issues-search "detail.checker"` and `issues-search "readStructure"` return nothing.
  - `git ls-tree -d --name-only origin/bugfix/55-checker-reports-no_git_block-on-a-baseline-whose-git-key-is-null agent-os/specs/` lists no `*-56-review-round-*` folder, so no earlier round dispositioned this. HEAD and the PR ref are both `57044e8`.
  - `git blame -L 262,262 README.md` gives `95a9706`, this PR's own commit, which added the override sentence beside the older `detail.checker` sentence.

  R1-1 is new.
- **R1-1: is it real?** Yes, by reading; the shaper's guard does not admit `node`, so the loop test was not run.
  - `workflows/redline-loop.js:1428-1436`: `readStructure()` returns `{ out: { ...out, status: 'read', reason: '' }, warning: ... }` when a structural reason meets a gate-shaped result.
  - `workflows/redline-loop.js:2008-2016`: `checker()` pushes the warning and returns `read.out`, the overridden copy.
  - `workflows/redline-loop.js:2235-2238`: on a stop the per-pass check throws `stageError('check', ..., { checker: checked })`, so `detail.checker` is that copy. The baseline stop (2192-2194) does the same with `baseline`.
  - `tests/loop-test.mjs:671-672`: the full-pass `git: null` case stops on "the checker result has no git block" and asserts the warning, but nothing reads `kept(run)` (defined at 635) for it.
  - So for that case `detail.checker.status` is `read` and `reason` is `''`, while `README.md:262` says the record "keeps whatever the checker returned, its `error` normalized". The checker's `result_unreadable` and `no_git_block` survive only in `res.warnings`.
- **R1-1: which side is right, the record or the sentence?** The record, from the PR's own evidence; this is answered, not escalated.
  - The #55 spec's Scope (`agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/shape.md:5`): "when the structure is in fact valid it overrides the status to `read`, records the checker's misread as a warning naming the reason and the override, and goes on."
  - Its decision 7 (same file): "**The override lives in `checker()`**, the one function both the baseline and the per-pass check call, so a second call site cannot miss it (as `run()` normalizes `error` once for every agent)."
  - The PR description: "It is applied once, in `checker()`, which both the baseline and the per-pass check go through, so no call site can miss it" and "No Known limits entry: the warning is the record."
  - So the overridden copy is what `checker()` is meant to return, and the warning is where the misread is meant to be recorded. The README already narrows "whatever the checker returned" for the `error` normalization that decision 7 cites as the model (#43, R1-1, `agent-os/specs/2026-10-27-0923-43-review-round-1/shape.md:65`: "The README's 'whatever the checker returned' is narrowed by that one field"). The override is a second narrowing of the same kind, and the sentence did not say so. The disagreement is the finding to fix, in the sentence, with a check that pins the stated behaviour.
  - The reviewer's other option, keeping the checker's words on the copy (an `overrode` field), would add a field to the run's returned `detail` that neither the #9 spec nor the #55 spec asks for, when the warning already carries the reason in the same returned result. It is not planned.
- **R1-1: does this contradict the #9 decision?** No more than #43 did. `agent-os/specs/2026-10-25-1353-9-checker-unreadable-result/shape.md:17`: "The run record keeps whatever the checker did get." #9 keeps the record so a stop on an unreadable result can be diagnosed. An overridden result is not an unreadable one: its full `result` (with `git: null`) is still in `detail.checker`, and the checker's reason is in `warnings`. The `workflow/agents` line 19 ("The run record's `detail.checker` keeps the normalized text, beside the status, reason and partial result #9 keeps it for") stays true for every result the override does not touch; retrospective item 1 below adds the override case.
- **The code comment at `workflows/redline-loop.js:2236`**, "stop now, keeping what the checker returned", names `checked`, which is `checker()`'s return. It reads correctly of the function and is left alone; the round touches no file under `workflows/`.
- **Reproductions.** The reviewer left no round 1 reproduction for this PR (`/tmp/redlinerepro/` holds files from other runs: `reviewer-r1-bashenv.sh`, `reviewer-r1-usehttp422.mjs`, ask-rules fixtures and an unrelated `shaper-r1-ReproTest.php`). This repository has no PHP and no Pest, so the shaper wrote no scratch test.

## Decisions

- **R1-1: the README sentence says what the record holds after an override.** In `README.md`'s `checks.sh` → Exit code paragraph (line 262), the sentence "The run's `detail.checker` keeps whatever the checker returned, its `error` normalized." becomes "The run's `detail.checker` keeps what the checker returned, its `error` normalized; after a structural override it holds the copy the workflow read, `status` `read` and `reason` empty, and the warning is where the checker's own reason is kept (#56, R1-1)." `plan.md` Task 2.
  Decided by: redline

- **R1-1: the record stays as the code makes it.** No `overrode` field and no change to `readStructure()` or `checker()`: the #55 spec and the PR description place the misread in the warning (Unattended answers).
  Decided by: redline

- **R1-1: one loop-test check pins the record.** A new check directly after `tests/loop-test.mjs:672`, on the same full-pass `git: null` run, asserts `detail.checker` holds `status: 'read'`, `reason: ''` and the full `result` with `git: null` and a `checks` array. It pins behaviour that is already as designed, so it passes at once: there is no red run, since no code changes. The existing check at 672 is left as it is. `plan.md` Task 2.
  Decided by: redline

- **As built: a period before the appended standards sentence.** Retrospective item 1 appends to a sentence ending "(#55)" with no period, since it was the bullet's last; the implementer put a period after "(#55)" so the bullet's new last sentence starts a sentence, as the bullet's other sentences do. The approved text is otherwise as written. `plan.md` As built.
  Decided by: redline

## Deferred

None.

## Proportionality

- **R1-1** (nit, low). Likelihood: low. The record differs from the sentence only when the checker misreads a structural reason and the run then stops: in practice a full or git-only pass whose result carries `git: null`, which `checks.sh` prints only in `--baseline` mode. Impact: a person reading `detail.checker` after such a stop sees `status: read` and has to look in `warnings` for the checker's own words, while the README told them the record holds them. Nothing is lost from the run's result. Cost: one sentence in `README.md` and one line in `tests/loop-test.mjs`, both in the PR's diff; no code, no new field, no dependency. Fix.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A. No product line changes.

## Standards Applied

- **workflow/agents.** Line 19 says what `detail.checker` keeps (the normalized `error` beside #9's status, reason and partial result); line 20 records the #55 override. The fix keeps the README in step with both, and retrospective item 1 adds the override case to line 20.
- **testing/tests.** A change to a documented surface is pinned by a case in the same commit (line 18); the checker scenario (line 8) gains what the stop record keeps after the override (retrospective item 2). The bug-fix red-before-green rule (line 22) has nothing to make red here: the code is as designed and only the sentence changes.
- **process/docs-gate.** The finding's change is itself the README edit; `plan.md` carries the Docs entries.
- **process/standards-retrospective.** The items below are proposed. The standards approver approves them and the implementer applies them in one commit (`plan.md` Task 3).
- **prompts/attribution.** Commit messages and this folder carry only Redline's name.

## Standards retrospective (proposed)

Done mechanically over the Decisions above. Nothing has been built yet, so there is no As built deviation and no red check to list.

1. **R1-1** (missing), `agent-os/standards/workflow/agents.md`, the bullet beginning "An agent that could not read what it was asked to relay" (line 20). After its last sentence, which ends "the JSON cannot refute it (#55)", append:

   " The run record's `detail.checker` then holds the copy the workflow read (`status` `read`, `reason` empty), and the warning is where the checker's own reason is kept; a change that rewrites a result before a call site stores it rewords every sentence that says what the record keeps, as #55 left the README saying `detail.checker` kept whatever the checker returned (#56, R1-1)"

2. **R1-1** (missing), `agent-os/standards/testing/tests.md`, the bullet "A loop-test scenario scripts the checker's result shape per call" (line 8). In its parenthesis, replace

   "a structural misread the workflow overrides beside the run-level reason that still stops, #55"

   with

   "a structural misread the workflow overrides beside the run-level reason that still stops, #55, and what the stop record keeps after the override, #56, R1-1"

Neither item depends on a pending decision; the round has none.
