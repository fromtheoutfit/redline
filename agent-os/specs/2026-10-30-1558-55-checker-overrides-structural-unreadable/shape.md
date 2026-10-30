# Checker reports no_git_block on a baseline whose git key is null — Shaping Notes (#55)

## Scope

Both changes of issue #55, as written there. `agents/redline-checker.md` says in one sentence that `git: null` is a present key and that `no_git_block` is only for an object with no `git` key at all, with the baseline example. `workflows/redline-loop.js` stops trusting the checker's reading of structure it can check itself: when the checker returns `result_unreadable` with a reason that makes a claim about the JSON's shape, the workflow checks the JSON it holds; when the structure is in fact valid it overrides the status to `read`, records the checker's misread as a warning naming the reason and the override, and goes on. A loop-test check scripts a baseline with `git: null` and a checker stub returning `no_git_block`, beside the neighbouring decisions that must not change. Known limits: nothing added; the warning is the record.

Not in scope: the checker prompt text in the workflow (`workflows/redline-loop.js:1268`, `:1284`), which already says "has no git key" and is pinned byte-for-byte by the loop test; `CHECKER_SCHEMA`; the three run-level reasons.

## Decisions

The shaping prompt's decisions stand; three questions were put to the person on 2026-10-30, one at a time, and answered as recorded.

1. **Both changes as the issue writes them**: the checker sentence, the workflow override, the loop-test check. No Known limits entry.
2. **The override covers the two structural reasons, `not_json` and `no_git_block`.** Offered: those two with a full structure test (recommended); any reason whenever the result is well-formed; those two with a `git`-key-only test. **Answer: the recommended option.** A valid structure is a `result` that is a non-null, non-array object whose `checks` is an array and that has a `git` key with any value, so `null` at baseline counts. `spilled`, `backgrounded` and `no_result` claim the output went where the checker could not read it, which the JSON cannot refute: they stop as today. In a full pass a `git: null` is overridden to `read` and then stops on the existing "the checker result has no git block" check in `stopReason()`, so a real missing block is never hidden. Decided by: @michaelwitwicki.
3. **The warning names the reason, the evidence and the override.** Offered: that wording (recommended); a shorter reason-and-override line; the same plus the checker's own error text. **Answer: the recommended wording**: `<prefix>: the checker said result_unreadable (<reason>), but the JSON it returned is one object with a checks array and a git key; the workflow overrode the status and read the result`, with `baseline:` or `round N:` as its neighbours in `warnings` use. Decided by: @michaelwitwicki.
4. **The checker role change is one sentence with the baseline example**, on the `no_git_block` bullet of `agents/redline-checker.md`. The workflow's prompt text is unchanged (accurate, and pinned).
5. **Docs step**: the README's `## checks.sh` Exit code paragraph names every `result_unreadable` reason, so it gains one sentence. No other section names the statuses.
6. **Standards carried: five.** Offered: the five (recommended); the five plus `workflow/replay`; only agents, tests and docs-gate. **Answer: the five**: `workflow/agents`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. `workflow/replay` declined: no prompt text changes and warnings are not prompts. Decided by: @michaelwitwicki.
7. **The override lives in `checker()`**, the one function both the baseline and the per-pass check call, so a second call site cannot miss it (as `run()` normalizes `error` once for every agent). `stopReason()` and `judge()` are unchanged.
8. The person makes every commit.
9. **Standards retrospective: applied** (2026-10-30): the two items under "Standards retrospective (applied)" below. Decided by: @michaelwitwicki.
10. **As built, one deviation from the plan:** three of the four new loop-test checks were red before the override, not two. The fourth check (a full pass with `git: null`) asserts the override warning beside the downstream stop, so it cannot pass until the override exists. The plan's "the last two pass" was wrong about it; the test is as the plan describes.

## Context

- **Visuals:** None.
- **References:** see `references.md`. The survey read the checker role's reading rules, `stopReason()`, `judge()`, `checker()` and its two call sites with their warning prefixes, `run()`'s normalization, the loop test's checker mock and section 9, the README's Exit code paragraph, and the last hand-shaped spec (#13).
- **Product alignment:** N/A. `agent-os/product/mission.md` ("Decisions stay with people"; the verdict comes from the script) and `agent-os/standards/workflow/agents.md` ("The script decides, never an agent") already say what this change enforces for the checker's structural claims. No product adjustment.

## Standards retrospective (applied)

Proposed at shaping, presented at the gate on 2026-10-30 and approved as proposed (decided by: @michaelwitwicki); both landed in the standards commit. Nothing went red during the build except the new loop-test checks, as intended. No pattern was used that is not in `agent-os/standards/`.

- `agent-os/standards/workflow/agents.md`, the bullet beginning "An agent that could not read what it was asked to relay returns a distinct status": append "A reason that claims something the workflow can check from the JSON it holds (`not_json`, `no_git_block`) is checked: when the result is one object with a `checks` array and a `git` key, the workflow reads it and records the misread as a warning naming the reason, since a Haiku checker read `git: null` as a missing key and stopped #54 at baseline. A reason about where the output went (`spilled`, `backgrounded`, `no_result`) stops as before: the JSON cannot refute it (#55)."
- `agent-os/standards/testing/tests.md`, the bullet "A loop-test scenario scripts the checker's result shape per call (...)": add "a structural misread the workflow overrides, beside the run-level reason that still stops (#55)" to the parenthetical.

## Standards Applied

- workflow/agents — the checker returns a distinct status and the workflow decides from the JSON; this spec applies that rule to the checker's own claims about the JSON's shape
- testing/tests — a change to a tested surface adds a case in the same commit, red before green, with a row for the neighbouring decision; the loop-test's checker scenario gains four checks
- process/docs-gate — the plan carries a Docs entry per touched file; the README's Exit code paragraph is the section
- process/standards-retrospective — the proposed edits above are presented at the gate and land in their own commit or are recorded as "no changes"
- prompts/attribution — the spec folder and the commits carry no model or vendor name; "Haiku" names the checker's model in a bug record, which is a fact of the run, not attribution of the work
