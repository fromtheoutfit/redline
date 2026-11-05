# Issue #79: two-reviewer whole-PR round — Shaping Notes

Shaped by hand on 2026-11-05 with `/agent-os:shape-spec` in plan mode, on `feature/79-two-reviewer-whole-pr-round-the-code-review-skill-as-the-finder-redlines-reviewer-as-the-verifier-a-second-corpus-pr-decides-whether-the-independent-pass-stays` at dfc9190 with a clean tree. Read first: issue #79, PR #78's body, the spike's spec folder `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/`, the three harness facts in `agent-os/standards/workflow/agents.md`, `scripts/guard.md` and `process/internal-notes.md`, and `redline-internal/docs/SPIKE-72-NOTES.md` §2 to §5 and §7 (cited by file name only; no figure from it enters this folder). The person makes every commit, push, PR and close.

## Scope

On whole-PR rounds the built-in `code-review` skill is the **finder** and Redline's reviewer the **verifier**: the skill, run from a plain workflow agent over the head branch, returns candidates; the reviewer applies its own contract to each (collapse by cause, the known-finding check, reproduction for correctness, a line inside the diff, category, severity, confidence, `needsDecision`, `askRule`) and sends the rest to a new `### For the person` section in the review body and the handoff comment. Fix-diff rounds (round 2 and later, the final nit pass) keep today's reviewer unchanged. A `coverage off` word, or `models.coverage: null` in `redline.json`, runs today's reviewer-only round as the fallback. Whether the reviewer's independent whole-PR pass stays beside the skill's (the union) or only behind the dial (verify-only) is decided by a second corpus PR, Task 2, before the code is built.

In scope, from the issue: tasks 1 to 6 (the corpus PR, the coverage agent, the verify stage, `### For the person`, the dial and docs, the drift line), #73's items 3 and 4 (the "for the person" list and the reworded precision sentence). Out of scope: #73's regression pass and `cost` class, #74 (review-only at coverage) and #75 (the shaper's class check).

## Decisions

The nineteen decisions, each with its evidence and owner, are in `plan.md` under "Decisions (for `shape.md`, each with its owner)". In brief, with what was read for each:

1. **Corpus PR #778 at `db3eedbe2`.** Evidence: both PRs' teammate comments read with `gh pr view <n> --comments` on 2026-11-05; #778's key is seven correctness items and five nits at a file and line each (the 2026-10-25 and 2026-10-26 comments), in a 374-file PR; #790's (F1 to F10) is half ops and discussion and its code items are one class. Decided by: @michaelwitwicki, 2026-11-05.
2. **The decision rule is applied in Task 3**, before Tasks 4 to 10; the mode goes under `## Decision` below. Decided by: @michaelwitwicki (the issue).
3. **No candidates is a stage error with three named causes; an empty array is zero candidates.** Evidence: `workflow/agents` ("a degraded result is data, not an error ... `error` is reserved for an operation that failed"); the issue's "coverage off ... the fallback, never the default". Decided by: @michaelwitwicki, 2026-11-05.
4. **`--max-findings all`, always.** Evidence: the spike's probe A reported "it reused `--max-findings all` from a previous choice" (`redline-internal/docs/spike-72/skill-pass-A.json`, `context`), and `~/.claude.json` holds `codeReviewLastMaxFindings: "all"` on this machine. The decision rule's evidence is therefore for `all`; a later cap is measured, not assumed. Decided by: @michaelwitwicki, 2026-11-05.
5. **Default workflow agent, no schema; the workflow reads only the skill's fenced array and two marker lines.** Evidence: `scripts/guard.md` (the guard does not see a skill fork), `workflow/agents.md` (a role launched with a `schema` makes the fork call StructuredOutput itself), the workflow-authoring reference (`agent()` without `schema` returns the final text as a string). Decided by: @michaelwitwicki (type and schema), redline (the extraction).
6. **`coverage off` is per-run and never saved; `models.coverage: null` is the persistent form; absent means on with `reviewerFirstRound`'s model and effort.** Evidence: `skills/redline/SKILL.md` section 3 (`autopilot` and `review only` are per-run verbs the prefs script keeps out of the file). Decided by: @michaelwitwicki (the dial), redline (not saved).
7. **Effort is always passed** (`models.coverage.effort`, else `reviewerFirstRound.effort`, else `high`). Evidence: the skill reuses the level typed last when none is given (its description); spike note §2 (`max` fans out through the Agent tool a workflow subagent never has; `xhigh` on opus-5 is inline). Decided by: redline.
8. **Labels**: `coverage r<n>` then `review r<n>`; `verify r<n>` only under the union. Evidence: `workflows/redline-loop.js` `run()` keys resume on `opts.label`; the docs and the loop test name `review r<n>`. Decided by: redline.
9. **The reviewer prompt under `coverage off` is byte-identical to today's**; the candidates block is added only when a coverage pass ran; the For the person instruction lives in the agent file. Evidence: `workflow/replay`. Decided by: redline.
10. **The verifier accounts for every candidate** (`coverage[]`); an unaccounted one is listed under For the person as reported, with a warning. Evidence: the carry-forward rule in `workflow/agents.md` ("the workflow carries what it did not account for, with a warning, rather than dropping it"). Decided by: redline.
11. **For the person entries** `{file, line, text}`, rendered after Already tracked in the body and after Left to you in the handoff, carried verbatim; never read back as a finding. Evidence: `scripts/redline-gh.sh` header lines 26 to 28 (a finding is a `- **R<n>-<k>** · ...` line). Decided by: redline.
12. **The verifier keeps its rule-driven checks** (scheduled-and-queued overlap, the Docs nit, the Version nit) and drops only the open-ended read. Evidence: `agents/redline-reviewer.md` lines 28, 34, 35; README Known limits ("The reviewer is now asked for that overlap"). Decided by: redline.
13. **#73 items 3 and 4 move in; #73's regression pass and `cost` class, #74, #75 stay open.** Decided by: @michaelwitwicki.
14. **The guard cannot vet the fork**; the docs and Known limits say so and list what it runs. Evidence: `scripts/guard.md` last bullet; spike note §2 point 1; `docs/guard.md` "The hook" (read-only git approved for any session). Decided by: @michaelwitwicki.
15. **Minor bump to `0.2.0`; `CHANGELOG.md` entry undated.** Evidence: `process/release` (a template change bumps the minor version); `templates/redline.json.example` gains `coverage`. Decided by: @michaelwitwicki.
16. **No AI attribution anywhere.** Decided by: @michaelwitwicki.
17. **Nine standards in `standards.md`**; `scripts/bash-conventions` out. Decided by: @michaelwitwicki.
18. **The #817 rerun is the end-to-end verification**, on a fresh throwaway PR. Decided by: redline.
19. **Task 2 passes `--max-findings all` through `args.extra`** in the spike's private script. Decided by: redline.

## Decision

Pending Task 3. Filled from §9 of `redline-internal/docs/SPIKE-72-NOTES.md` once the #778 runs are measured: **verify-only**, **union**, or **reopened**, with the sections cited, and the note that the evidence is for `--max-findings all`.

## Unattended answers

Not applicable: shaped by hand, questions asked one at a time with AskUserQuestion (the corpus PR, no candidates, max findings, the standards).

## Context

- **Visuals:** none.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md` ("The second developer's review stays in place"; "A clean run means no correctness bug in the changed code that the reviewer could read or reproduce") and `agent-os/product/roadmap.md` item 5 (seeded PRs with the answer key outside the repository). Both hold: what Redline acts on is still what the verifier reproduced, and `### For the person` serves the teammate's read without becoming a plan task. `agent-os/product/tech-stack.md` line 5 already records Claude Code 2.1.318 as the version the skill's recipe was validated against.

## Standards retrospective

Filled at the gate (Task 10.4).

## Standards Applied

- workflow/agents — a skill pass is a plain workflow agent; a role's `schema` swallows the fork's output; the run record counts the caller; carry-forward accounting is the model for candidate accounting
- scripts/guard — the guard does not see a skill fork, so the pass is never a role and the Known limits say so
- workflow/replay — no clock reads; the coverage prompt is built from `args`; the reviewer prompt under `coverage off` stays byte-identical
- testing/tests — the loop test gains a check for every new behaviour, red before green; the mock refuses the forbidden options
- process/docs-gate — one Docs entry per touched file in `plan.md`
- process/release — minor bump for the template change; the version in both manifests
- process/internal-notes — the #778 figures and raw outputs go to redline-internal; the spec cites them by name
- process/standards-retrospective — the gate's last step
- prompts/attribution — no model or vendor name in the spec, the prompts' wording or any commit message
- scripts/bash-conventions — not applied: nothing under `scripts/` changes
