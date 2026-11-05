# References for spike #72: a second reviewer on whole-PR rounds

## In this repository

### The reviewer call in the workflow

- **Location:** `workflows/redline-loop.js`: `review()` (about line 1717, the single `agent()` with `agentType: 'redline:redline-reviewer'`, `modelOpts('reviewerFirstRound')`, `schema: REVIEW_SCHEMA`), `reviewPrompt()` (about 1009 to 1060), `FINDING_SCHEMA` and `REVIEW_SCHEMA` (446 to 479), `reviewBody()` (769 to 801: `### Findings`, `### Carried forward from earlier rounds`, `### Resolved from earlier rounds`, `### Already tracked`), `handoffComment()` (2455 to 2507), the Approve phase's `parallel([...])` (about 2272).
- **Relevance:** where a second reviewer call would sit (beside the first, in parallel, in the Review phase), what its output would have to be merged into, and where `### For the person` would be rendered.
- **Key patterns:** one agent per role, JSON in and out, the workflow reads fields never text; `agent()` has no `tools` option, so what a subagent may do is decided by its agent definition and the harness.

### The reviewer's instructions

- **Location:** `agents/redline-reviewer.md` (frontmatter `disallowedTools: Edit, MultiEdit, NotebookEdit, Agent, WebFetch, WebSearch`; lines 16 to 22 the known-finding check and carry-forward; 26 to 27 reproduction and scratch tests; 33 categories, severities, confidence; 36 judgment calls; 37 ask rules; 70 ids).
- **Relevance:** the rules the merge simulation applies to the skill's candidates, and the contract fields the skill's output lacks.

### The launch skill

- **Location:** `skills/redline/SKILL.md` sections 1 (resolve the repository from the shell's working directory), 2 (the argument grammar: `dry run`, `review only`), 4 (the precheck: open PR unless dry run, branch, clean tree, HEAD equals the PR head, the 300-file warning, `last-round`, `prior-findings`), 5 item 3 (the issue number from the branch name), and "Save the run record" (the harness record path and the `saved/` copy).
- **Relevance:** why the baseline needs a throwaway PR and a worktree session; where the figures come from.

### The guard's role detection

- **Location:** `docs/guard.md` line 7 and the role table (reviewer: `read tests gh-read`, Write under temp only); `scripts/redline-guard.sh` lines 38 to 45 and 178 to 196.
- **Relevance:** probe variant A runs with the guard inert (no Redline `agent_type`); variant B runs under the reviewer row, which allows read-only git and refuses a raw `gh`.

### The loop test's reviewer mock

- **Location:** `tests/loop-test.mjs` about lines 110 to 114 (every `redline:redline-reviewer` call is counted in order and answered from `scenario.reviews`).
- **Relevance:** a second reviewer call in the Review phase shifts the scripted reviews; a spec would have to give the coverage pass its own agent type or its own scenario list.

### A hand-shaped spec and a docs-only round, for the conventions

- **Location:** `agent-os/specs/2026-11-03-1259-14-public-docs/` (plan with Decisions, Docs entries table, Commits, As built) and `agent-os/specs/2026-11-04-0950-71-review-round-1/plan.md` (a round that changed docs only: the Version and Docs paragraphs, the retrospective wording).
- **Relevance:** the shape of this folder.

## Outside this repository, cited by name only

- redline-internal `docs/API-NOTES.md` §i: background subagents keep the `Skill` tool; `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` and `Workflow` are removed from every non-fork subagent (as of 2.1.302).
- redline-internal `docs/STEP10-NOTES.md` §4 ("Planted versus raised", the recall table shape) and §8 ("Totals", the per-agent time and token table shape).
- redline-internal `docs/SPIKE-NOTES.md`: the structure of a spike note (header with the Claude Code version, runs table, what worked, what did not, where it contradicts or refines `DESIGN.md`).
- redline-internal `DESIGN.md` line on seeded-branch answer keys living outside the repo.
- The teammate's review comment on Losers League #817 (2026-11-04T15:26Z, at `3ac4c1de2`): the answer key, items 1 to 7 primary and 8 to 12 secondary. Quoted in the internal note only.
