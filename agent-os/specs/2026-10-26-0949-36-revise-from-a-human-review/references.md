# References for Revise from a human review (#36)

## Similar Implementations

### The revise-only path of the loop

- **Location:** `workflows/redline-loop.js` (`if (A.revise ...)` near the end; `revise()`, `replyEntry`, `replyBody`, `outcomesFor`, `finish`, `commitRecord`, `reviewBody`, `history()`)
- **Relevance:** the human pass is a revise pass with a different source of findings, different owners and a different finish
- **Key patterns:** one revise pass per record; decisions enter after shaping; the reply route from `reviewPosted` and the thread id; the run-record commit at Finish

### `redline-gh.sh` read subcommands

- **Location:** `scripts/redline-gh.sh` (`review-comments`, `has-review`, `last-round`, `pr_files`)
- **Relevance:** `human-review` and `last-human-review` follow `review-comments` (paginated, slurped, filtered with jq) and `last-round` (a bare JSON number, `0` for none, exit 2 on a gh error)
- **Key patterns:** `gh api --paginate --slurp`, one JSON object on stdout, the header as the documentation

### The gh harness

- **Location:** `tests/gh-test.sh`, `tests/gh-fixtures/`
- **Relevance:** the fake `gh` serves fixtures by endpoint; PR 10 is the human-review fixture
- **Key patterns:** `is`/`has` assertions, a fixture per endpoint, usage cases

### The loop harness

- **Location:** `tests/loop-test.mjs` (the mock, scenario 8's `reviseArgs`, `samePrefix`)
- **Relevance:** scenario 10 scripts a human pass: H ids, the author as decider, the no-handoff finish, the final nit pass
- **Key patterns:** scripted agents by `agentType` and `label`; prompts asserted by text; the replay rule

### The skills and agents

- **Location:** `skills/redline-revise/SKILL.md`, `skills/redline/SKILL.md` (sections 4 to 7), `agents/redline-shaper.md`, `agents/redline-github.md`, `agents/redline-reviewer.md`
- **Relevance:** the grammar, the precheck (`last-round` is the model for `last-human-review`), the start snapshot, the `done` handling; the shaper's overriding rules; the GitHub agent's reply rule

### The guard

- **Location:** `scripts/redline-guard.sh` (`GH_READ`), `tests/guard-cases.tsv` (the `last-round` rows)
- **Relevance:** a read subcommand joins `GH_READ` with rows beside the neighbouring decision
