# References for PR #108 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened at `253052a`.

## Similar Implementations

### The pull request's own spec

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/shape.md`
- **Relevance:** decisions 2 (overrides unchanged), 12 (the stops and the repeat warning), 14 (`effectiveDispositions` kept), 16 (what the check demands of a call), 17 (a named call needs no statement) and 20 (a value outside the three is no statement) answer R1-5, R1-4, R1-3, R1-8, R1-2 and R1-6.
- **Key patterns:** a prompt sentence added only when a call in the block needs it (the `rule` sentence), so other prompts replay byte-identically.

### resolveWith and the statement checks

- **Location:** `workflows/redline-loop.js:3739-3860`
- **Relevance:** `asked` (3787), the statement checks (3843-3856), `unentered` (3829) and the comment above `const statements` (3775-3782): R1-2, R1-4, R1-5, R1-6, R1-7.
- **Key patterns:** a stage error at `resolve` names the resolve label that ran (`stageError`, 536-538).

### resolvePrompt's calls block

- **Location:** `workflows/redline-loop.js:2035-2089`
- **Relevance:** the `decided` ask (2072) and the conditional `rule` sentence (`anyRule`, 2041-2043): R1-2.
- **Key patterns:** a sentence present only under a condition, read off `callDecisions`.

### needCommits and the removed clause

- **Location:** `workflows/redline-loop.js:4044-4065`; the pull request's diff of the same file (the removed `.concat(resolvedTasks.filter(... !record.forced[task.finding] ...))`)
- **Relevance:** R1-8: the base branch's forced guard, and the stated branch that lacks it.
- **Key patterns:** `isDeferral` (3892-3909) and `outcomesFor` (2966-2969) keep the forced test.

### forceAskRules on a reshape

- **Location:** `workflows/redline-loop.js:3250-3314`
- **Relevance:** R1-8: a reshape sets `record.forced` on a decided finding not yet forced (3265-3266, 3310-3311).

### plannedFiles and taskFiles

- **Location:** `workflows/redline-loop.js:3843`, `3881`, `unique` at 459, `draftsOf`'s `filesOf` parameter at 3670
- **Relevance:** R1-7.

### The resolve agent's file

- **Location:** `agents/redline-resolve.md:24`
- **Relevance:** R1-2: the exemption sentence restates the prompt's.

### The docs bullet

- **Location:** `docs/running.md:126` ("Deferred items", "A deferral you chose at a call"); `docs/running.md:149-152` (#81, what a relaunch runs); `docs/contract.md:139-150` ("Ask rules")
- **Relevance:** R1-1, and the docs entries of Tasks 3 to 6.

### The loop test

- **Location:** `tests/loop-test.mjs`: the shaper mock (190-248, the `askRule` line at 228), the resolve mock (249-273), the `filing` cases on statements (3195-3270, `namedCall` 3233, `namedUnbuilt` 3235, `statedTwice` 3224, `misstated` 3228, the prompt checks 3266), the source checks of the defer section (2861-2868), the ask-rule scenarios (1303-1362).
- **Relevance:** where each task's checks go, and the neighbours already pinned.

### The skill's records of a disposition

- **Location:** `skills/redline/SKILL.md:189`, `:190`, `:222`
- **Relevance:** R1-5's reachability: where a decision is recorded with `disposition`.

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r1-repro.mjs`
- **Relevance:** R1-8's scenario (a reshape-only `askRule` tag, `planBounce: 1`), which Task 6's loop case follows. Not run: `node` is refused to the shaper.
