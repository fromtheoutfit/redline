# References for Resolve the threads Redline opened (#39)

## Similar Implementations

### Finish and the run-record commit

- **Location:** `workflows/redline-loop.js` `finish()` (1902-1933), `commitRecord()` (1935-1967), `finishPrompt` (1105), `updatePrompt` (1093), `recordStatusPrompt` and `recordCommitPrompt` (1132-1165)
- **Relevance:** the sweep is one more Finish step between the PR description and the closing comment, on the record commit's pattern
- **Key patterns:** the workflow picks what the agent acts on and hands it one literal command; the agent returns a list; an `error` throws `stageError('finish', …)`; `compose(prBody)` builds the comment after the steps it reports on

### Push and reply, outcomes

- **Location:** `workflows/redline-loop.js` push sites (1535-1538, 1794-1798), `pushReplyPrompt` (1066), `replyEntry` (635), `outcomesFor` (1439), `describeOutcome` (1464), `droppedReplies` (1508), `handoffComment` (1808), `humanSummary` (1852), `result()` (1294), `PUSH_REPLY_SCHEMA` (495), `FINISH_SCHEMA` (523)
- **Relevance:** the reply ids the sweep keys on are returned here and dropped; the outcome kinds decide what is settled; the two composers gain the line
- **Key patterns:** `record.commentIds[f.id]` per finding; `record.outcomeKinds[id]`; a body finding has no `commentIds` entry and routes `issue-comment`

### The wrapper's read subcommands

- **Location:** `scripts/redline-gh.sh` `human-review` (252-311), `last-round` (245), `reply` (349), the header (7-74)
- **Relevance:** the two new subcommands follow `human-review`'s shape: pages slurped into temp files, one jq program, JSON only on stdout, exit 2 on usage and on a gh error for a read
- **Key patterns:** `need_int`, `usage`, `trap 'rm -f …' EXIT`, `--slurpfile`

### The gh harness

- **Location:** `tests/gh-test.sh` shim (54-99), fixtures `tests/gh-fixtures/comments-10.json`, `reviews-10.json`
- **Relevance:** the shim refuses `-f`/`-F` today; the `graphql` endpoint is the one place it reads them, serving a query from a fixture and recording a mutation to a log the cases read
- **Key patterns:** `pages=(…)` per endpoint, `jq -s '.'` for `--slurp`, `is`/`has` cases

### The loop harness

- **Location:** `tests/loop-test.mjs` `mock()` (33-134), `go()` (143-162), exact Finish sequences (287, 347, 358, 365, 379, 602, 641, 646), absence checks (387, 616)
- **Relevance:** the push mock returns `replies: []`, so it must return ids for the sweep; an unknown github label falls through to the handoff default (81), so `resolve threads` needs its own branch; the tail check assumes the closing comment is followed by `record files`
- **Key patterns:** `labels(calls)`, `pick`, `comment`, `replies`; checks named `<scenario>: <assertion>`

### The guard's read set and its rows

- **Location:** `scripts/redline-guard.sh` 68 (the gh-read comment), 94-101 (the table), 464 (`GH_READ`), 583-586 (`gh` refused), 597-606 (the subcommand check); `tests/guard-cases.tsv` 136-149 (the `last-round` and `human-review` rows)
- **Relevance:** `threads` joins `GH_READ`; the rows beside the `last-round` rows are the model
- **Key patterns:** allow for github and reviewer, deny for standards-approver and checker; a deny row for the raw `gh` form beside the wrapper's allow

### The human review pass spec

- **Location:** `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/`
- **Relevance:** the last spec that added read subcommands, guard rows, a loop scenario and agent text together; its shape and plan are the style model
- **Key patterns:** the "Decided by" owners; `passOf(record).human`; the summary comment as one line
