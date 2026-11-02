# References for PR #59 review round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## Similar Implementations

### The resume line and its Finish clauses

- **Location:** `workflows/redline-loop.js`, `FINISH_COMMENT_LABELS` and `resumeLine()` (lines 378-398)
- **Relevance:** R2-1's clause is the `finishComment` string at line 392; the `recordCommit` clause beside it already tells the agent which fields to set (`committed` true, `sha` from `git rev-parse HEAD`) and is the pattern the fixed clause follows.
- **Key patterns:** a clause by label, appended to the generic resume sentence only, so a first run's prompts stay byte-identical.

### The Finish prompt and the fields the workflow reads

- **Location:** `workflows/redline-loop.js`, `FINISH_SCHEMA` (lines 713-724), `finishPrompt()` (line 1383), `finish()` (line 2495), the results at lines 2812, 2906-2946
- **Relevance:** Step 2 of the Finish prompt posts with `redline-gh.sh comment` and returns its URL; the resume clause skips that step. The workflow reads `posted` into `handoffPosted`, `capCommentPosted` and `humanReview.summaryPosted`, and never reads `comment_url`.

### The pr-comments subcommand

- **Location:** `scripts/redline-gh.sh`, lines 14 and 261-264
- **Relevance:** `pr-comments` is `gh pr view <n> --comments`; run on #59 it prints author, association, edited, status and body per comment and no URL (`grep -c http` prints `0`). The `comment` subcommand (README "`redline-gh.sh`" table, line 362) is the one that returns a comment URL.

### The GitHub role

- **Location:** `agents/redline-github.md`, the `comment` operation (line 25), Rules ("`gh` is refused by the guard"), and the output shape (`posted`, `comment_url`, lines 44-65)
- **Relevance:** the agent has no other way to a comment's URL; "Fill only the fields the operation produced" means an empty `comment_url` is a valid result.

### The loop test's resume checks

- **Location:** `tests/loop-test.mjs`, the GitHub mock's Finish return (lines 94-96) and the R1-6 resume checks (lines 1115-1132)
- **Relevance:** `commentClause` pins the clause's text; `reposted` is the resumed handoff relaunch whose result the new check reads.

### Round 1's shaping of the clause

- **Location:** `agent-os/specs/2026-11-01-0935-59-review-round-1/shape.md` (Decisions, "R1-6 fix") and `plan.md` (Task 6, As built)
- **Relevance:** where the clause's wording "post nothing, return that comment's URL" came from; it did not check what `pr-comments` prints.

### README

- **Location:** `README.md`, "Launching" (line 189)
- **Relevance:** "A resume at the closing comment first looks for the comment an earlier attempt posted ... retried without posting or committing twice": the stated behaviour the fix brings the returned fields in line with; no README change is needed.
