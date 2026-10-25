# References for PR #34 review round 1

Shaped by Redline in unattended mode. Every location below was opened while shaping; line numbers are at the PR's head (`2744c4b`).

## The code the findings name

### The reply route and its prompt

- **Location:** `workflows/redline-loop.js`: `replyEntry` (538-547), `replyBody` (550-), `pushReplyPrompt` (819-835), `droppedReplies` (1164-1177), the revise replies (1421), the revise-only record (1608-1626), the main-loop record (1662)
- **Relevance:** R1-1 and R1-7. `replyEntry` writes the marker body for every reply without a thread id; `pushReplyPrompt` sends each through `comment`. The record already holds `post.posted` and `post.skipped`, and the revise-only record holds what the skill passes.
- **Key patterns:** the reply body is built in the workflow, never by the agent, so the route belongs there too.

### The post step

- **Location:** `workflows/redline-loop.js`: `POST_SCHEMA` (220-244), `postPrompt` (618-645, the dry-run branch at 621), `post()` (1091-1122; the `error` throw at 1106-1107, the warning branch at 1111-1116)
- **Relevance:** R1-8 (the throw before the warning) and R1-7 (a dry run returns `review.comments []`).

### The review body

- **Location:** `workflows/redline-loop.js`: `reviewBody` (468-488; the `firstRound` sentence at 470, the closing sentence at 485)
- **Relevance:** R1-4 and R1-6.

### The GitHub wrapper

- **Location:** `scripts/redline-gh.sh`: header (2-46), `usage()` (50), `synthesize_diff` (90-99), `place_comments` (125-144, the marker at 139), `pr-comments` (166-170), `post-review`'s comments fetch (245)
- **Relevance:** R1-2 (`usage`), R1-3 (`synthesize_diff`), R1-1 (`pr-comments` prints review bodies; the marker sits in the body), R1-8 (a non-zero exit after the POST succeeded).

### The GitHub agent

- **Location:** `agents/redline-github.md:22` (post-review), `:23` (reply)
- **Relevance:** R1-1 (the marker check), R1-7 (the comment_id 0 rule), R1-8 (the instruction that a thread-less review is not an error).

### The skills

- **Location:** `skills/redline/SKILL.md:82` (precheck step 7), `:83` (step 8); `skills/redline-revise/SKILL.md:15` (thread ids "when the review was posted"), `:18` (the `revise` args)
- **Relevance:** R1-5; R1-7 (the revise skill already knows whether the review was posted and passes only `commentIds`).

### README

- **Location:** `README.md:153` (Known limits, a file without a patch), `:279` (`pr-comments` row: "issue comments and review bodies"), `:303` (a body finding's reply)
- **Relevance:** the evidence for R1-1, and the line Tasks 2 and 3 update.

## The tests

### Loop harness

- **Location:** `tests/loop-test.mjs`: `mock()`'s post branch (43-49, which returns inline ids even in a dry run), `go()` (123-), `replies`/`replyFor` (151-159), the dry-run checks (302-304, 345-347), section 8 (368-407; the "Rounds 1 to 1" pin at 394)
- **Relevance:** where every loop check of Tasks 2, 3, 6, 8 and 9 goes, and why the dry-run path of R1-7 went untested. No scenario exercises `args.revise` today.

### gh harness

- **Location:** `tests/gh-test.sh` (filler pages at 32-33, the shim at 40-73, the diff cases at 93-102, usage at 134-137), `tests/gh-fixtures/files-7-special.json`, `tests/gh-fixtures/review-7.json`
- **Relevance:** Tasks 4 and 5. The fixture's one rename carries a patch, so R1-3's branch has no case; `review-7.json` names only the special files, so shrinking the filler to keep 150 files moves no `place` expectation.

## The original spec

- **Location:** `agent-os/specs/2026-10-24-1500-33-large-prs/shape.md` and `plan.md` (Decisions: "Body marker and issue-comment replies", "Zero inline threads is a warning, not an error", "First round from args"; Task 4's reply bullet: "dry run writes the file only"), `references.md` (the #778 `post r1` result)
- **Relevance:** the decisions R1-1 keeps (the marker is the reply's first line), the dry-run intent R1-7 restores, and the evidence R1-8 turns on.

## Before this PR

- **Location:** `git diff 5f6e12b HEAD -- workflows/redline-loop.js` (the old `pushReplyPrompt`: "A reply whose comment_id is 0 has no thread (its finding sits in the review body): write its file and do not call reply.")
- **Relevance:** R1-7's file-only route is the behaviour this PR replaced.
