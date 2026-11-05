# References for issue #79: two-reviewer whole-PR round

## In this repository

### The reviewer call and its prompt

- **Location:** `workflows/redline-loop.js`: `run()` (409: wraps `agent()`, throws on null, resume by label, copies `error` only on an object), `modelOpts()` (357), `review()` (1717: one `agent()` per round, `agentType: 'redline:redline-reviewer'`, `modelOpts('reviewerFirstRound')` on `reviewed === 'pr'`, `label: review r<n>`, `phase: 'Review'`, `schema: REVIEW_SCHEMA`), `reviewPrompt()` (1009 to 1060), `FINDING_SCHEMA` and `REVIEW_SCHEMA` (446 to 479), `reviewBody()` (769 to 801), `handoffComment()` (2455 to 2507), `result()` (1644: the round mapping the skill reads), the main loop (2934 to 3047: `reviewed` picked per round at 2936, the final-nit-pass, done, cap and revise branches from 2992), `history()` (1633: every earlier finding of the run with its outcome, in every re-review prompt), the handoff's whole-PR sentences (2460, 2462), the Approve phase's `parallel([...])` (2272).
- **Relevance:** where the coverage call goes (before the reviewer's, in `review()`), what the verify block is added to, where `### For the person` renders, what the union would copy from Approve.
- **Key patterns:** one agent per call, JSON in and out through a schema, the workflow reads fields; the one exception this spec adds is the coverage agent's text, read only for the skill's own fenced array and two marker lines.

### The reviewer's instructions

- **Location:** `agents/redline-reviewer.md`: line 8 (the precision sentence), 16 to 22 (the known-finding check and carry-forward), 26 to 27 (reproduction and scratch tests), 28 (scheduled and queued work), 32 (a line inside the diff), 33 (category, severity, confidence), 34 and 35 (the Docs and Version nits), 36 (judgment calls), 37 (ask rules), the return block (43 to 70).
- **Relevance:** the rules the verifier applies to each candidate; the checks that survive a verify-only round; the block `forThePerson` and `coverage` join.

### The loop test

- **Location:** `tests/loop-test.mjs`: the mock's dispatch on `opts.agentType` (36 to 115; the reviewer branch counts `reviewN`), `baseArgs` (about 188), `go()` (195), `labels`, `pick`, `comment`, `samePrefix()` (the replay rule), the `relay` scenario at the end (every prompt names the two relayable lines).
- **Relevance:** the coverage call needs a branch keyed by label; `baseArgs.models.coverage = null` keeps every existing check; the new scenarios follow the existing shapes.

### The launch skill

- **Location:** `skills/redline/SKILL.md` section 2 (the argument table; a word that fits none stops the launch), section 3 (per-run verbs are never saved), section 5 item 5 (the `args` block; `models` entries from `redline.json` verbatim), section 6 (the launch line), section 7 `review-only` (the summary).
- **Relevance:** where `coverage off` is parsed, how it reaches the workflow, what the person is told.

### The config template and its test

- **Location:** `templates/redline.json.example`; `tests/setup-test.sh:200` ("models as the template"); `docs/contract.md` "`redline.json`" (the `models` row).
- **Relevance:** the `coverage` entry and its documentation; the test compares against the template itself.

### What reads a review body back

- **Location:** `scripts/redline-gh.sh` header lines 18 to 32 (`prior-findings`: a finding is a `- **R<n>-<k>** · <category> · <severity> · <confidence> · \`file:line\` · title` line; an "Already tracked" line is not one).
- **Relevance:** a `### For the person` line carries no id, so it is never read back as a finding.

### The spike

- **Location:** `agent-os/specs/2026-11-04-2058-72-spike-second-reviewer-whole-pr/` (shape.md's Answers and Decision; plan.md's Facts and As built deviations 1, 3, 5 and 7).
- **Relevance:** the probe route, the worktree-session rule, the exposure method, the measurement method.

### A hand-shaped spec, for the conventions

- **Location:** `agent-os/specs/2026-11-03-1259-14-public-docs/`.
- **Relevance:** the shape of a plan with Decisions, a Docs table, Commits and As built.

## Outside this repository, cited by name only

- `redline-internal/docs/SPIKE-72-NOTES.md` §1 (the runs and transcript paths), §2 (the three harness facts, the saved `--max-findings` choice, the fork's CLAUDE.md-driven known-finding reads), §3 (the recall table and the exposure method), §4 (the cost table and the transcript method), §5 (the merge simulated by hand: what the skill's output lacks), §7 (the spec's drafted shape). §9 (#778: the base of the throwaway PR, the recall table with exposure, the non-key findings checked in the tree, the cost tables, the decision rule's inputs, the correction to §2 point 2).
- `redline-internal/docs/spike-72/skill-pass.workflow.js` (the probe script Task 2 reuses, with `args.extra`), `RUNBOOK.md` and `RUNBOOK-778.md` (the worktree session, `--plugin-dir`, the permission mode), `skill-pass-A.json` (`context`: the saved choice was `all`).
- Task 2's raw files, same folder: `skill-pass-778-A.json` and `skill-findings-778-A.json` (the run record and the swallowed return), `skill-pass-778-A-fork-final-text.md` and `skill-findings-778-A-recovered.json` (the fork's review, recovered from its transcript), `baseline-778.json` (the dry run's record) and `baseline-778-round-1/redline/` (the round's findings and review files).
- Losers League PR #778, the teammate's comments of 2026-10-25T21:53Z (F4-1 to F4-11) and 2026-10-26T14:27Z (F5-1): the answer key, quoted in the internal note only. PR #790's comments, read and not chosen (Decision 1).
