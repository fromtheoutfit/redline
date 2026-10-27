# Resolve the threads Redline opened (#39)

Spec folder: `agent-os/specs/2026-10-27-1150-39-resolve-redline-threads/`

## Context

Redline opens an inline thread per finding, fixes it, replies with the commit, and leaves the thread unresolved. The author resolves every one by hand before merging, and the unresolved count stops meaning "still needs eyes": a teammate opening a PR after two rounds sees twenty open threads and cannot tell which are theirs. Issue #39 asks Redline to resolve the threads it opened once their findings are settled, never a human's, and to say so in the handoff comment.

Shaped by hand on 2026-10-27 with `/agent-os:shape-spec`; the person makes the commits.

## Decisions (from the issue, plus the ones made while shaping)

1. **Settled** = outcome kind `fixed`, `deferred` or `decided` (an ask the person answered, whatever they chose), as `outcomesFor` records it (`workflows/redline-loop.js:1439`). `not-changed` and **`dropped` (review dial) stay open**: the person chose not to act, the teammate should still see it. A body finding (in `post.movedToBody`, no `commentIds` entry) has nothing to resolve and is not listed.
2. **Never a human's thread.** Human-pass records (`record.human`, the H threads are the teammate's roots) are never swept. A Redline thread with a human reply after Redline's last reply stays open.
3. **Redline's comments are known by id**, since Redline posts from the person's login: the inline id `record.commentIds[f.id]` (kept today) and the reply id, which the GitHub agent already returns (`PUSH_REPLY_SCHEMA.replies[].reply_id`) but the loop drops. The loop starts keeping `record.replyIds`.
4. **Wrapper input: one list, both ends must be Redline's.** `resolve-threads <pr> <ids…>` gets every settled finding's inline id and reply id. A thread is resolved only when its first comment and its last comment are both in the list; the wrapper enforces "never a human's thread" on its own, whatever the loop selects.
5. **Sweep before the handoff comment**, after the PR description: Finish order becomes PR description, `resolve threads`, handoff comment + request-review, record files, record commit. The handoff line reports the wrapper's real result. A sweep error stops the run at `finish`, as a PR-description error does.
6. **Which Finish sweeps:** the handoff and the human summary (only the nit-pass round's own threads). A capped run sweeps nothing. Skipped when `postToGitHub` is false (dry run) or `push` is false (the fix commits are not on GitHub). `review only` and a hand-off never reach Finish.
7. **The line:** `Resolved n threads; m left open: R1-2 (a reply after Redline's), R2-1 (not changed)` in the handoff comment, after the round sentence; appended as one more sentence to the human summary. Omitted when the sweep did not run.
8. **Guard:** read-only `threads` joins `GH_READ` (the standard); `resolve-threads` needs no guard line (`gh-all`). The guard checks only the subcommand word and refuses raw `gh` everywhere, so **the mutation string is pinned by a gh-test case**, not a guard row; a guard row pins that raw `gh api graphql` with the mutation is refused even for the github role. The person makes the guard commit.
9. **GraphQL pinned as two fixed strings** in `redline-gh.sh`, parameterised by `-F` variables only (`owner`, `name`, `number`, `endCursor`, `threadId`), never built from arguments.

## Task 1: Save spec documentation

Create the spec folder with `plan.md`, `shape.md` (scope, the decisions above, context: visuals none, references, product alignment with "nothing an agent does is hidden from the review thread" and "Decisions stay with people"), `standards.md` (full text of scripts/bash-conventions, scripts/guard, testing/tests, workflow/agents, workflow/replay, prompts/attribution, process/standards-retrospective, process/internal-notes), `references.md`:
- `workflows/redline-loop.js`: `finish()` 1902-1933, `commitRecord()` 1935-1967 (workflow picks, agent calls), `finishPrompt` 1105, `updatePrompt` 1093, `pushReplyPrompt` 1066, `recordCommitPrompt` 1144, push sites 1535-1538 and 1794-1798, `outcomesFor` 1439, `droppedReplies` 1508, `handoffComment` 1808, `humanSummary` 1852, `result()` 1294, meta 16, `PUSH_REPLY_SCHEMA` 495, `FINISH_SCHEMA` 523.
- `scripts/redline-gh.sh`: `human-review` 252-311 (temp files, jq over slurped pages), `reply` 349, header 7-74.
- `tests/gh-test.sh` shim 54-99 (refuses `-f/-F`), `tests/gh-fixtures/comments-10.json`; `tests/loop-test.mjs` mock 33-134 (push returns `replies: []`, unknown github labels fall through to the handoff default at 81), `go()` tail check 157-161, exact Finish sequences at 287, 347, 358, 365, 379, 602, 641, 646.
- `scripts/redline-guard.sh` 68, 94-101, 464, 583-586, 597-606; `tests/guard-cases.tsv` 136-149; `agents/redline-github.md`; `README.md` 3, 106-115, 162-172, 286-323; the #36 spec.

## Task 2: `redline-gh.sh threads` and `resolve-threads` (gh-test first)

**Files:** `scripts/redline-gh.sh`, `tests/gh-test.sh`, new `tests/gh-fixtures/threads-13.json`, `README.md` wrapper tables.

- Two pinned strings near the top of the script, e.g. `THREADS_QUERY` and `RESOLVE_MUTATION`:
  - query: `repository(owner:$owner, name:$name) { pullRequest(number:$number) { reviewThreads(first:100, after:$endCursor) { pageInfo { hasNextPage endCursor } nodes { id isResolved path line comments(first:100) { nodes { databaseId author { login } } } } } } }`, run as `gh api graphql --paginate --slurp -F owner='{owner}' -F name='{repo}' -F number=<n> -f query="$THREADS_QUERY"` (gh fills `{owner}`/`{repo}` in `-F` values; `--paginate` follows `pageInfo` with `$endCursor`; gh 2.48+ already required).
  - mutation: `mutation($threadId: ID!) { resolveReviewThread(input: {threadId: $threadId}) { thread { id isResolved } } }`, run once per thread with `-F threadId=<node id>`.
- `threads <n>` (read, `GH_READ`): prints `[{id, resolved, path, line, comments: [{id, user}]}]`, threads in path, line, first-comment-id order, the pages joined through a temp file as `human-review` does. Exit 2 usage, exit 2 on a gh error (as `last-round`).
- `resolve-threads <n> <id…>` (write): every id `need_int`, none is usage. Reads the threads once, then for each thread that holds a given id: resolve when not resolved and its first and last comment ids are both in the list; else skip with one of `already resolved`, `opened by comment <first id>, not Redline's`, `last comment <id> is not Redline's`; a given id in no thread is `no thread holds comment <id>`. A thread is handled once however many of its ids were given. Prints `{resolved: [{id: <first comment id>, thread: <node id>}], skipped: [{id, reason}]}` (ids are review-comment ids, which the loop maps back to findings through `record.commentIds`). A failed mutation prints gh's stderr and exits 1 after the ones already done; nothing retries.
- Header: both subcommands documented; `--help` last-line case keeps passing.
- Shim: `graphql` endpoint. `-f query=` and `-F` are parsed instead of refused there (every other `-f/-F/--method/--input` stays refused). A query (`-F number=13`) serves `$PAGES/threads-13.json` as pages; a mutation appends `threadId` and the query text to `$PAGES/resolved.log` and prints `{"data":{"resolveReviewThread":{"thread":{"id":…,"isResolved":true}}}}`.
- Fixture PR 13 (ids 1301…): T1 Redline root + Redline reply (resolvable); T2 Redline root, Redline reply, then a teammate's reply (skipped: last comment not Redline's); T3 a teammate's root with a Redline human-review reply (skipped: not Redline's, even when both ids are given); T4 already resolved; T5 a Redline root with no reply yet (not given, untouched); two pages so pagination is proven.
- Cases (red first): `threads 13` shape, order and page count; `resolve-threads 13 1301 1302 1303 1304 1306 1307 1308 1309 1399`: resolved exactly T1, skipped list with the four reasons, the log holds T1's node id only and the **mutation text byte for byte** (the pin); given only T1's root id (no reply id) T1 is skipped as `last comment … not Redline's`; usage: no ids, a non-number, exit 2.

## Task 3: Guard rows (the person's commit)

**Files:** `scripts/redline-guard.sh` (line 68 comment, `GH_READ` line 464), `tests/guard-cases.tsv`.

Beside the `last-round` rows: `threads 42` allow for github and reviewer, deny for standards-approver and checker; `resolve-threads 42 901 903` allow for github, deny for reviewer and shaper; `gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "x"}) { thread { id } } }'` deny for github, under a comment naming #39 (the wrapper is the only route). `hooks/hooks.json` unchanged.

## Task 4: The sweep in the loop (loop-test first)

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs`.

1. **Keep reply ids:** at both push sites, `record.replyIds = {finding: reply_id}` for entries with `reply_id > 0`. `result().rounds[]` gains `replyIds` and `threads`.
2. **`settledThreads()`:** over `rounds` with no `record.human`: for each finding with a `commentIds` entry, settled when `outcomeKinds[id]` ∈ {fixed, deferred, decided} and a `replyIds` entry exists → `{id, round, commentId, replyId}`; otherwise open with a reason: `not changed`, `dropped (@login's pick)` (from `record.dropped`), `no reply posted`, `cap hit` is unreachable (no sweep on cap-hit).
3. **`sweepThreads()`** in `finish()` for kinds `handoff` and `human-summary`, only when `postToGitHub && push`: one GitHub-agent call, label `resolve threads`, phase Finish, schema `RESOLVE_SCHEMA` `{operation, resolved: [{id, thread}], skipped: [{id, reason}], error}`, prompt `resolveThreadsPrompt(ids)`: "Run `${GH} resolve-threads ${pr} <ids…>` once, exactly as given, and nothing else; set resolved and skipped from its JSON; on a non-zero exit set error to its stderr". No call when the settled list is empty. `error` → `stageError('finish', …)`. The result `{resolved, skipped, open}` is mapped back to finding ids and passed to `compose(prBody, threads)`.
4. **Text:** `handoffComment(lastFixUnreviewed, prBody, threads)` adds the line after the round sentence; `humanSummary(record, nitPass, threads)` appends the sentence. Wording: `Resolved ${n} thread(s); ${m} left open: R1-2 (a reply after Redline's), R2-1 (not changed).` with `; 0 left open.` when none; the wrapper's reasons are rendered as `a reply after Redline's`, `already resolved`, `not Redline's thread`, `no thread`.
5. Meta Finish detail names the sweep; `done` result gains `threads`.
6. **loop-test:** the push mock returns `replies` from the prompt's Replies JSON (`reply_id` 200+i for route `thread`, 0 otherwise); a `resolve threads` branch returns every given inline id as resolved unless `scenario.threadsSkipped` names some with a reason. Update the tail check in `go()` and the exact sequences (287, 347, 358, 365, 379, 602, 641, 646) for `resolve threads` between `PR description` and `handoff comment`, and before `summary comment`. New checks: the prompt's id list holds the inline and reply ids of fix, defer and answered-ask findings and not the not-changed, dropped or body ones; no `resolve threads` call on dry run, `no push`, `review only`, a hand-off result, and a capped run; the handoff line text, including a skipped id under left open with its reason; the human pass passes only the r3 ids and never an H root; the summary sentence; a sweep `error` ends as `error` at stage `finish` with no handoff comment; existing checks unchanged.

## Task 5: Agents and skills

**Files:** `agents/redline-github.md`, `skills/redline/SKILL.md`, `skills/redline-revise/SKILL.md`.

- GitHub agent: new operation **resolve-threads** (Finish, after the PR description and before the handoff comment or the human summary: the one command the prompt gives, resolved and skipped from its JSON, never another thread, never `gh`); the operation enum; the reply operation says every `reply_id` the script printed is reported because the sweep keys on it.
- `redline` skill `done`: report `threads` (how many resolved, which left open and why); `redline-revise` step 7 likewise.

## Task 6: README

**Files:** `README.md`: intro line 3 ("resolves the threads it opened"); the Decided-by/handoff paragraph (the handoff's `Resolved n threads` line); Git rule 1 (order: PR description, the thread sweep, the handoff or summary comment, the record commit); the wrapper tables (a `threads` read row, a `resolve-threads` write row naming the two pinned GraphQL strings and the both-ends rule); Known limits: one line, a thread a human opened or last spoke in is never resolved by Redline, and a `no push` or dry run resolves nothing.

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` (gate steps 1 to 9) until it exits 0; report failures verbatim. No gate text changes, so no restamp and no `checks.json` edit. Then the standards retrospective (step 10), expected edits: scripts/bash-conventions (GraphQL as pinned strings with `-F` variables; `gh api graphql --paginate --slurp` with `$endCursor`; `threads` joins `GH_READ`), testing/tests (the gh harness serves a GraphQL query by fixture and records the mutation, which pins its text), workflow/agents (the sweep: the workflow picks the settled ids, the agent calls once; both ends of a thread must be Redline's; reply ids kept per round), scripts/guard (a deny row for raw `gh api graphql` pins the wrapper as the only route). Present with AskUserQuestion; apply in their own commit or record "no changes". Step 11: `plan.md` As built and `shape.md` Decisions record deviations.

## Verification

- `tests/gh-test.sh`: the PR 13 cases pass, the mutation string is pinned; `tests/guard-test.sh`: `N passed, 0 mismatched`; `node tests/loop-test.mjs`: `N checks passed, 0 failed`; `claude plugin validate .`; `.claude/redline/checks.sh --baseline` exits 0.
- End to end, after the person commits: `/redline:redline <pr> dry run` on a seeded PR shows no `resolve threads` call; a live run leaves unresolved only the threads a human opened or last spoke in, and the handoff comment carries the `Resolved n threads` line.

## As built

Built 2026-10-27; the gate (`.claude/redline/checks.sh --baseline`) is green: syntax, validate, guard 397 rows, loop 285 checks, prefs, gate, setup, gh 93, background. Deviations from the plan above:

- **Task 2, the human-opened thread case.** The plan's fixture case gave both ids of a thread a teammate opened. The teammate's root id is never one Redline posted, so the loop could never pass it; the case gives only the Redline reply's id, and the wrapper's `opened by comment <id>, not Redline's` reason is what proves the rule. The `--help` last-line case now pins the last line of the `resolve-threads` entry.
- **Task 4, the schema name.** `RESOLVE_SCHEMA` already belongs to the resolve agent; the sweep's is `SWEEP_SCHEMA`.
- **Task 4, "not changed" is unreachable in a finished run.** The gate refuses a round whose `fix` has no commit, so a finished run never carries a `not-changed` outcome with a thread; the branch stays in `threadCandidates` as a defence, and the loop-test's open cases are a thread the script skipped (a teammate's later reply) and a dropped finding.
- **Task 4, the dropped reason.** `dropped by @<login>`, not `dropped (@<login>'s pick)`, so the handoff line does not nest parentheses.
- **Task 4, the line is absent when no Redline thread exists.** A human review pass whose nit pass found nothing has no candidate thread, so its summary stays the one line it was; the plan said the line is omitted only when the sweep is off.
- **Task 4, the prompt.** The `resolve threads` prompt lists each settled finding with its round and its two ids above the one command line, as the record commit's prompt lists its files, so the spec folder's audit trail says what was swept and why.
- **Task 4, merged human-pass replies.** `keepReplyIds` reads a reply entry's `findings` list when one is present (two findings of one thread), so a nit pass after a human pass keys on the right ids.
- **Task 5.** The GitHub agent's frontmatter description names the sweep beside its other operations.
