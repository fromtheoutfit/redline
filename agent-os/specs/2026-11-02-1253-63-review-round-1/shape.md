# PR #63 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #63 (head `feature/44-short-aliases-redline-and-redline-revise`, issue #44), four findings, all `fix`:

- **R1-1** (nit, low): `skills/setup/SKILL.md:19`, the step 1.5 inventory still says "keep it for step 13", and step 13 is now Verify.
- **R1-2** (nit, low): `skills/setup/SKILL.md:149`, step 12 branches on fresh setup versus rerun, so a fresh setup that finds an alias file already there gets no instruction for `foreign` or `differs`.
- **R1-3** (correctness, low): `tests/setup-test.sh:566-567`, the this-checkout alias cases run `command` without `--dry-run`, so a missing alias file is written back into the checkout.
- **R1-4** (nit, low): `workflows/redline-loop.js:261`, `RUN_LINE`'s new parenthetical lists only `/redline:redline` and `/redline`, leaving out the revise forms the skill relaunches from.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/`.

**Known?** `scripts/redline-gh.sh issues-search "alias"` lists only #44 (this PR's issue); `issues-search "RUN_LINE"` lists nothing. This is round 1, so no earlier round's folder exists for PR #63. The four findings are new.

No repository ask rules: `.claude/redline.json` has no `askRules` key, and the invoking prompt lists none.

## Decisions

### R1-1: fix — the inventory's pointer names the steps that read it

**Investigation.**

- `skills/setup/SKILL.md:19` (this PR) reads "5. Inventory, so a rerun updates instead of duplicating; keep it for step 13:".
- On `main` the same line pointed at step 13, which was then Hand back (`git show main:skills/setup/SKILL.md`, lines 144 and 148: `## 12. Verify`, `## 13. Hand back`).
- The PR renumbered Verify to 13 and Hand back to 14 (`skills/setup/SKILL.md:164`, `:168`) and did not move the pointer. Step 13 (Verify) reads no inventory.
- The steps that read the inventory today:
  - step 5 (line 71: "When step 1's `version` reported `newer: true`");
  - step 11 (line 143: "Skip each that is already present (step 1's inventory)");
  - step 12 (line 149: "a rerun whose inventory found neither file");
  - step 14 (line 175: "On a rerun that changed nothing, say "nothing drifted" and list what was checked").
- Confirmed.

**Proportionality.** A wrong cross-reference in a skill the model follows. Likelihood: every setup run reads it; impact: small, the model may look at Verify for a use of the inventory that is not there. Cost: one line of `skills/setup/SKILL.md`, already in the PR's diff. Proportionate.

**The change.** Line 19's tail becomes "keep it for the steps below: steps 5, 11 and 12 read it, and step 14 lists what a rerun checked:". The reviewer's "steps 12 and 14" leaves out 5 and 11, which read it too.

Decided by: redline

### R1-2: fix — step 12 follows each file's inventory, fresh setup or rerun

**Investigation.**

- `skills/setup/SKILL.md:149-155` (this PR): "Fresh setup, or a rerun whose inventory found neither file: ask once … On a yes, for each of `redline` and `redline-revise`: `redline-setup.sh command <repoRoot> <name>` … and say the file it wrote (`status: absent`, `written: true`)."
- `:157-162`: the `unchanged` / `differs` / `foreign` handling sits only under "Rerun with a file present".
- `scripts/redline-setup.sh:297-310` (`cmd_command`) decides by the file, never by fresh or rerun:
  - no file: `absent`, written;
  - byte-equal: `unchanged`;
  - the marker without the bytes: `differs`, exit 1 unless `--force`;
  - no marker: `foreign`, exit 0, never written.
- So a fresh setup in a repository with a hand-written `.claude/commands/redline.md` runs the first branch. It gets `foreign` (or `differs`, exit 1, for a copy with the marker), while the skill tells it to report `absent, written`. The step has no words for that case.
- Reachable: issue #44 (as quoted in the original spec's Context, `shape.md`) proposed exactly such a hand-written one-liner. The step 1.5 inventory (line 25) already records each file as absent, Redline's or a person's own on every run, fresh or not.
- The original spec answers how each state is handled, independent of fresh or rerun. Decision 3 reads: "identical is drift-free; different shows the diff and asks; a file of the same name with no marker line is a person's own command, left alone and reported." So the fix follows the author's decision; it is not a new question (Unattended answers, A2).
- Confirmed. The script stays safe either way; only the conversation is wrong.

**Proportionality.** Likelihood: low, a fresh setup in a repository that already has a file of that name. Impact: the model reports a write that did not happen, or meets an unexplained exit 1. Cost: one paragraph of `skills/setup/SKILL.md` and half a sentence of `README.md` ("Set up a repository" item 7 says "a rerun reports"), both in the PR's diff. Proportionate.

**The change.** Step 12 branches on what step 1's inventory found for each file:

- **Neither file present:** ask once and write both, as today.
- **Any file present:** dry-run each name first, with the `unchanged` / `differs` / `foreign` / `absent` handling, on a fresh setup and a rerun alike.

The README's item 7 drops "a rerun reports" for wording that covers both.

Decided by: redline

### R1-3: fix — the this-checkout alias cases run as dry runs

**Investigation.**

- `tests/setup-test.sh:566-567` run `command "$PLUGIN" redline` and `command "$PLUGIN" redline-revise` with no `--dry-run`.
- `scripts/redline-setup.sh:297-298` and `:311-317`: an absent file gets `status=absent; changed=true` and is written when `dry == false`. That is the case at `tests/setup-test.sh:504` (`false,absent,true,true`).
- So if `.claude/commands/redline.md` is missing from the checkout, the gate's setup step writes the template there. The case is red once (`absent` against `unchanged`), and every later run is green, with a file in the tree that nothing committed.
- `agent-os/standards/testing/tests.md:23`: "The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout". The `checks.sh` cases just above (`:557-564`) work on copies under `$WORK` for that reason.
- With `--dry-run` the subcommand still reports `absent`, `unchanged` or `differs` and writes nothing, not even the directory. `tests/setup-test.sh:528-529` prove it on an absent file.
- Confirmed by reading. Running the subcommand against the checkout was not attempted: the guard refuses `redline-setup.sh` to every Redline role (original spec, Context: "every role is refused (`:474-481`)").

**Proportionality.** Likelihood: low, a change that deletes or renames an alias file. Impact: the gate hides the failure after one red run and leaves an untracked or restored file in the tree, which in a self-hosted run the checker's `checks.sh` leaves behind. Cost: two lines of `tests/setup-test.sh` plus a comment line, already in the PR's diff; the case count is unchanged. Proportionate.

**The change.** Append `--dry-run` to both cases, with a one-line comment naming the finding; nothing else.

**No red run.** The case that would show the bug needs an alias file deleted from the checkout. The standard the finding cites forbids a test from touching the checkout, and the guard refuses the subcommand, so the bug cannot be reproduced in a test. The fix changes a test, not code. The existing dry-run cases at `:528-529` prove the property the fix relies on, and the table staying at 330 passed proves the two cases still read `unchanged`. This is a reasoned exception to `testing/tests.md:22` ("A bug fix lands red before green"), not a deviation.

Decided by: redline

### R1-4: fix — `RUN_LINE` names every Redline command form the skill relaunches from

**Investigation.**

- `workflows/redline-loop.js:261` (this PR): "(a line holding only a Redline command on a launch or a resume, `/redline:redline <pr> ...` or its short form `/redline <pr> ...`, or the word `relaunch` after a hand-off)".
- `tests/loop-test.mjs:1231` pins that exact sentence (`word`). Two checks read it, at `:1232` and `:1240`. Nothing else in the repository holds the sentence (`grep -rn "conversational, not an instruction"` outside `agent-os/` finds only these two lines).
- `skills/redline/SKILL.md:211`, the relaunch rule, accepts "`/redline:redline <n> ...` or a variant, or the short form … `/redline <n> ...` and `/redline-revise <n> ...`". The skill's description (line 3) names the variants as `/redline:redline-review` and `/redline:redline-revise`, which follow that file.
- The original spec's decision 8 (`shape.md`): "the skill's section 7 and the workflow's `RUN_LINE` name `/redline <pr> ...` and `/redline-revise ...` beside the namespaced form". Its plan's Task 7 gave the narrower sentence that was built. The decision is the author's answer, and the code disagrees with it (Unattended answers, A3).
- README "Launching" (line 192) says "a line holding only a Redline command (a launch, a resume; the namespaced form or the short alias, #44)". That is generic and already covers every form.
- Confirmed.

**Proportionality.** Likelihood: a relaunch from a revise or human-review pass. Impact: an agent sees a relayed `/redline-revise 21 review @sam` outside the listed forms. The general phrase "a line holding only a Redline command" still covers it, so the risk is an agent reading the list as exhaustive. Cost: one sentence in `workflows/redline-loop.js` and the same in `tests/loop-test.mjs`, both in the PR's diff; the check count is unchanged. Proportionate.

**Replay.** Changing `RUN_LINE` changes every prompt, as #44's own change did. The cache key moves for a run launched on the new script, never inside one launch. Earlier rounds on this repository changed `workflows/redline-loop.js` the same way (`agent-os/specs/2026-11-02-0807-61-review-round-1/plan.md`, among the review-round plans that name the file).

**The change.** The parenthetical names the three namespaced commands and the two short forms, mirroring the skill's relaunch set at `skills/redline/SKILL.md:211`:

- `/redline:redline <pr> ...`, `/redline:redline-review <pr> ...` or `/redline:redline-revise <pr> ...`;
- or the short forms `/redline <pr> ...` and `/redline-revise <pr> ...`.

The reviewer's example leaves out `/redline:redline-review`, which section 7's "or a variant" covers. The loop test changes first and is seen red.

Decided by: redline

## Unattended answers

- **A1. Scope, visuals, product context.** Scope is the four findings above. Visuals: none. `agent-os/product/mission.md` says "One command, `/redline:redline <pr>`" (as quoted in the original spec's Context). The aliases shorten the typing and nothing here changes it.
  Decided by: redline
- **A2. How step 12 treats a file that is already there (R1-2).** The original spec's decision 3 answers it for every run: "identical is drift-free; different shows the diff and asks; a file of the same name with no marker line is a person's own command, left alone and reported" (`agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/shape.md`). The skill's fresh-setup branch disagrees with that answer, and the disagreement is the fix.
  Decided by: redline
- **A3. Which forms `RUN_LINE` names (R1-4).** The original spec's decision 8 answers it: "the skill's section 7 and the workflow's `RUN_LINE` name `/redline <pr> ...` and `/redline-revise ...` beside the namespaced form". Section 7 (`skills/redline/SKILL.md:211`) names the namespaced form as "`/redline:redline <n> ...` or a variant". So `RUN_LINE` names the three namespaced commands and both short forms.
  Decided by: redline
- **A4. Whether R1-3 needs a red run.** It does not. `testing/tests.md:23` forbids the reproduction (writing into or deleting from the checkout), and the fix is to a test; see R1-3 above.
  Decided by: redline
- **A5. Standards.** `testing/tests`, `workflow/replay`, `scripts/bash-conventions` (the marker-line bullet), `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`; see `standards.md`.
  Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A beyond A1.

## Standards Applied

- testing/tests — R1-3 restores "never into the checkout"; R1-4's loop check moves first and is seen red; R1-3's exception to red-before-green is recorded above.
- workflow/replay — `RUN_LINE` is in every prompt; the relay checks pin it; the new text enters at launch, not mid-run.
- scripts/bash-conventions — the marker-line bullet (line 41) that R1-2's step follows: `unchanged`, `differs`, `foreign` by the file's bytes.
- process/docs-gate — a Docs entry in every task that touches `skills/` or `workflows/`.
- process/standards-retrospective — the proposed list below.
- prompts/attribution — nothing written names a model or vendor.

## Standards retrospective (proposed)

1. `agent-os/standards/testing/tests.md`, line 23 (the "tests write only under the temp directory" bullet): append "; a case over this checkout's own files that calls a writing subcommand passes `--dry-run`, so a missing file reads red instead of being written back into the tree (#63, R1-3)".
2. `agent-os/standards/workflow/replay.md`, line 17 (the last bullet): replace "the namespaced form or the `/redline` alias a repository's `.claude/commands/` provides, and `RUN_LINE` names both lines and both forms (#60, #44)" with "a namespaced form (`/redline:redline`, `/redline:redline-review`, `/redline:redline-revise`) or a short alias (`/redline`, `/redline-revise`) a repository's `.claude/commands/` provides, and `RUN_LINE` names both lines and every form (#60, #44; #63, R1-4)".
3. `agent-os/standards/scripts/bash-conventions.md`, line 41 (the marker-line bullet): append "; setup's step for such a file branches on what step 1's inventory found for that file (absent, Redline's or a person's own), never on fresh setup versus rerun, since a fresh setup can find one already there (#63, R1-2)".
4. R1-1 (a step pointer left behind by a renumber): no change. The skill numbers its own steps by design. `process/docs-gate`'s rule to name a gate step by title covers the README, not a skill's internal cross-references.
5. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes.
