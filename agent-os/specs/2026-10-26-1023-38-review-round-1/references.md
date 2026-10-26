# References for PR #38 review round 1

Shaped by Redline in unattended mode. Every location below was opened while shaping, on the PR's head (`d7b7c86`).

## Similar Implementations

### The human-review ingest

- **Location:** `scripts/redline-gh.sh` (header 21-41; `human-review` 245-298, the jq filter 266-297; `last-human-review` 300-306)
- **Relevance:** R1-1, R1-2 and R1-3 all sit in one filter. The open rule is line 275, the `$pick` login 282, the `@login` comment selection 286, the body selection 288-289. Today it reads only `pulls/<n>/reviews` and `pulls/<n>/comments` (264-265).
- **Key patterns:** both lists reach jq through temp files and `--slurpfile` (`scripts/bash-conventions.md`, "A JSON value that grows with the pull request ..."). `last-human-review` already reads `issues/<n>/comments`, the pattern R1-3's option 1 would follow. The header is the documentation the README row quotes.

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/hr.jq` (byte-identical to `scripts/redline-gh.sh:267-297`; checked with `sed` and `diff`), `/tmp/redlinerepro/s1-reviews.json`, `s1-comments.json`, `s2-reviews.json`, `s2-comments.json`, `s3-comments.json`
- **Relevance:** running `jq -n --slurpfile reviews <r> --slurpfile comments <c> --arg selector <s> --arg me author -f hr.jq` reproduces R1-1 (s2 and s3 with `@sam`, `latest` and `@marcamos`, all empty), R1-3 (s1 with `latest`, which keeps the body), R1-4 (s2 with `@marcamos`, whose `[id, thread_id]` pairs are `[905,905]` and `[912,905]`), and, over `tests/gh-fixtures/reviews-10.json` and `comments-10.json`, R1-2 (`@MarcAmos` empty, `@marcamos` `[904,907,905,909]`).
- **Key patterns:** the s2/s3 shape is the fixture R1-1's option 1 would add as PR 11.

### The pass descriptor and the replies

- **Location:** `workflows/redline-loop.js`: `passOf()` 170-193, `PUSH_REPLY_SCHEMA` 472-487, `decidedBy()` 574-576, `replyEntry()` 600-621, `replyBody()` 625-643, `pushReplyPrompt()` 940-965 (the human `twice` text 947-949), `revise()` 1427-1676 (the reply build 1664, `record.files` 1672)
- **Relevance:** R1-4 merges entries at line 1664, using `passOf()`'s `title` and `replyFile`. R1-5 adds `planKey` to `passOf()`. R1-3's option 1 changes `bodyHeader` and `bodyHeaderHint`.
- **Key patterns:** every label, file name and title comes from `passOf()`, so a Redline round's prompts stay byte-identical. Nothing reads the GitHub agent's `replies` back, so the workflow owns how many replies a thread gets.

### The plan dial

- **Location:** `workflows/redline-loop.js`: the `approvedPlans` parse 112-113, the plan stop in `revise()` 1445-1454, `handoffResult()` 1848-1874 (`approveWith` 1862), the human branch 1895-1947 (the human record 1898-1902, the nit-pass record 1930, its fix pass 1934), the relaunch `how` text 1212, `handoffComment()`'s approval note 1705; `skills/redline/SKILL.md:157-167` (the plan hand-off and its relaunch)
- **Relevance:** R1-5 is the shared key between the human record (`round: n`) and the nit-pass record (`round: firstRound`).
- **Key patterns:** the skill relays `approveWith.approvedPlans` verbatim, so a key form from the descriptor needs no skill logic, only its description.

### The skill's ingest

- **Location:** `skills/redline-revise/SKILL.md:13-31` (the finding shape and the reviewer login, 16-22; `commentIds`, 25)
- **Relevance:** R1-2's owner login (line 22). R1-4's "one finding per comment" and the thread map. R1-3's "nothing to revise" stop (line 16).

### The GitHub agent

- **Location:** `agents/redline-github.md:23` (the reply, issue-comment and file-only routes and the duplicate check)
- **Relevance:** R1-4 rewords "once per finding". R1-3's option 1 would change the header it names for the already-posted check.

### The harnesses

- **Location:** `tests/gh-test.sh` (the shim's PR 10 endpoints 75-77, the human-review cases 151-177, the summary line at the end), `tests/gh-fixtures/reviews-10.json`, `comments-10.json`, `issue-comments-10.json`; `tests/loop-test.mjs` (`mock()` 33-132, `go()` and its record-commit check 141-161, `replies()` and `replyFor()` 169-177, section 3's plan-dial checks 232-262, section 10 505-593)
- **Relevance:** Task 2's case sits beside the `@login` cases. Tasks 3 and 4 add to section 10, where `h()` defaults every finding to thread 900 and `humanArgs` lets a third argument override `firstRound`.
- **Key patterns:** a case pins a literal (`testing/tests.md:15`); `go()` adds one check per scenario that reaches Finish, which the plan's counts follow.

### The original spec

- **Location:** `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/` (`shape.md` Decisions: the selection rule and the "Un-replied" definition; `plan.md` Task 2 and As built)
- **Relevance:** the assumptions R1-1 and R1-3 would change are its decisions on selection and "un-replied". It is read here, not edited.

### Format reference

- **Location:** `agent-os/specs/2026-10-26-0844-37-review-round-1/` (`shape.md`, `plan.md`)
- **Relevance:** the layout of a Redline round's spec folder in this repository: unattended answers with owners, proportionality in each fix, the counting rule for `go()`, proofs as plain greps.
