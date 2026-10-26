# Revise from a human review (#36)

Spec folder: `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/`

## Context

The hand-off ends with a second developer's review, and those comments are the best findings the loop ever sees. Today `/redline:redline-revise` takes only a Redline round's findings file, so the author handles the human review by hand (Losers League #778, after two Redline passes). Issue #36 asks for `/redline:redline-revise <pr> review <selector>`: ingest a teammate's review comments as findings, fix the clear ones, return the unclear ones to the author as judgment calls, reply in every thread with the owner, re-review the fix diff once, and post one summary line. No handoff comment, no review request.

Shaped by hand on 2026-10-26 with `/agent-os:shape-spec`. Decisions made with the person:

- **Grammar**: bare word `review <id | @login | latest>`, matching the rest of the grammar; `review` has no other meaning in `redline-revise`.
- **Selection**: `review @login` takes every inline comment by that login with no Redline reply yet, plus the body of their newest submitted review; `review <id>` takes that review's un-replied comments and body; `latest` is the newest non-Redline review that has a body or a comment, then as `<id>`. All three forms are normalised by `redline-gh.sh human-review` into **one comment list**, so everything after selection is one code path.
- **Final nit pass included**: the reviewer reads the fix diff once as `Redline round <firstRound>` (`final-nit-pass`), a correctness bug it finds gets one more fix pass, then the summary comment.
- **Dispositions in a human pass are `fix`, `ask`, `none`**; never `defer` (nothing a human asked for is deferred by Redline on its own; a disproportionate fix is `ask`, and the author may choose defer at the hand-off, which the existing override path handles). `none` is only for a comment that asks for nothing (praise, thanks, an acknowledgement); when in doubt, `ask`. A `defer` from the shaper is a stage error at `shape`.
- **Owners**: a `fix` is `decided by: @<reviewer login>` (the shaper returns `decidedBy: "reviewer"`, the workflow maps it); an `ask` becomes `@<author login>` after the hand-off (existing path, `args.login`); `none` is `decided by: redline`.
- **Labels**: the pass is `Redline human review <n>` everywhere a Redline round says `Redline round <n>` (replies, the summary comment, the record files, `shape.md`). `n` = `redline-gh.sh last-human-review <pr>` + 1, read by the skill before launch, like `firstRound` (replay standard).
- **The unattended template is not changed.** The human-pass rules live in the shaper's prompt and in `agents/redline-shaper.md` ("Rules that override everything else"), since the section says the invoking prompt supplies the inputs and every repository's copy would otherwise need re-inserting.
- Out of scope (from the issue): several reviewers in one pass; resolving threads on GitHub.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/` with `plan.md` (this plan), `shape.md` (scope, the decisions above, context: visuals none, references, product alignment with mission "Decisions stay with people" and "nothing an agent does is hidden from the review thread"), `standards.md` (full text of scripts/bash-conventions, scripts/guard, testing/tests, workflow/agents, workflow/replay, prompts/attribution, process/standards-retrospective, process/internal-notes), `references.md` (below).

References studied:
- `workflows/redline-loop.js:1683-1703` the `A.revise` path; `revise()` 1264-1509; `replyEntry`/`replyBody` 548-578; `outcomesFor` 1185; `finish`/`commitRecord` 1571-1634; `reviewBody` 472; `history()` 1044.
- `scripts/redline-gh.sh` `review-comments` (179), `has-review`/`last-round` (206-222), `pr_files`, the header.
- `tests/gh-test.sh` shim (41-78) and fixtures; `tests/loop-test.mjs` mock (33-127), scenario 8's `reviseArgs` (412-419).
- `skills/redline-revise/SKILL.md`, `skills/redline/SKILL.md` §4-7; `agents/redline-shaper.md`, `redline-github.md`, `redline-reviewer.md`.
- `scripts/redline-guard.sh:67,462` (`GH_READ`), `tests/guard-cases.tsv:136-140` (the `last-round` rows).

## Task 2: `redline-gh.sh human-review` and `last-human-review` (gh-test cases first)

**Files**: `scripts/redline-gh.sh`, `tests/gh-test.sh`, new fixtures `tests/gh-fixtures/reviews-10.json`, `tests/gh-fixtures/comments-10.json`, `tests/gh-fixtures/issue-comments-10.json`, `README.md` (the `redline-gh.sh` read table).

Add two read subcommands (header documented, JSON only on stdout, usage exit 2, gh error exit 2 as `last-round` does):

- `human-review <n> <id | @login | latest>` prints one object:
  ```json
  {"selector": "@marcamos", "reviews": [{"id": 7, "user": "marcamos", "state": "COMMENTED", "body": "...", "submitted_at": "..."}],
   "body": {"review_id": 7, "user": "marcamos", "text": "..."} ,
   "comments": [{"id": 901, "thread_id": 901, "review_id": 7, "user": "marcamos", "path": "app/x.php", "line": 12, "side": "RIGHT", "body": "...", "in_reply_to_id": null, "created_at": "..."}]}
  ```
  Sources: `GET pulls/<n>/reviews` and `GET pulls/<n>/comments`, both `--paginate --slurp`. A **Redline review** is one whose body starts `Redline round N`; a **Redline reply** is a comment whose body matches `^Redline (round|human review) [0-9]+`. Excluded always: comments of a Redline review, Redline replies. A comment is **replied** when a Redline reply with a higher id sits in the same thread (`thread_id` = `in_reply_to_id // id`). Selection: `<id>` keeps that review's un-replied comments and its body when non-empty; `@login` keeps every un-replied comment whose `user.login` is that login (replies inside Redline threads included) and the body of that login's newest non-Redline review with a non-empty body, `body: null` when none; `latest` resolves to the newest non-Redline review with a body or a comment and proceeds as `<id>`. Comments are ordered by path, then line, then id. `body` is `null` when empty. `reviews` lists the reviews the comments and body came from.
- `last-human-review <n>` prints the highest `N` in `^Redline human review N` across the PR's issue comments (`GET issues/<n>/comments`) and review comments, as a bare JSON number, `0` when none.

Shim: add the three PR 10 endpoints. Fixture PR 10: a Redline round 1 review (user `author`, 2 comments, one of which has a `marcamos` reply), a submitted `marcamos` review 7 (body "Two things inline, one general: ...", 3 comments, one already answered by a `Redline human review 1:` reply), a single-comment review 8 by `marcamos` (empty body), an `author` hand-written reply, and issue comments holding one `Redline human review 1` summary. Cases (red first): `@marcamos` yields the 3 un-replied comments (2 from review 7, 1 single, and the reply in the Redline thread) with the body from review 7; `7` yields its 2 un-replied comments plus the body; `latest` picks review 8 (newest, has a comment); `@author` yields nothing with `body: null`; `thread_id` of the reply is its root; ordering; a Redline review's comments never appear; `last-human-review 10` is `1`, and `0` on PR 8; usage errors exit 2. Keep the `--help` last-line case passing (the header gains lines; the case reads the last non-blank line).

## Task 3: The guard knows the two subcommands

**Files**: `scripts/redline-guard.sh` (line 67 comment and `GH_READ` at 462), `tests/guard-cases.tsv`.

Add `human-review` and `last-human-review` to `GH_READ`. Rows beside the `last-round` rows (136-140): allow for `redline:redline-github` and `redline:redline-reviewer`, deny for `redline:redline-standards-approver` and `redline:redline-checker`, for each new subcommand, plus the unchanged `last-round` neighbour. A person makes this commit (CLAUDE.md), which is the case here.

## Task 4: The workflow's human pass (loop-test checks first)

**Files**: `workflows/redline-loop.js`, `tests/loop-test.mjs`.

`args.revise` gains `kind: "human"` with `n`, `reviewer` (login, no `@`), `reviewIds`, `body` (the review body text or `""`), `specFolder`, `findings`, `commentIds` (`{H1-1: thread_id}`), `posted: true`. A finding is `{id: "H1-k", file, line, side, category: "human", severity: "medium", confidence: "confirmed", title: <first line of the comment, at most 80 chars>, description: <comment body>, proposedFix: "", needsDecision: false, knownAs: "", source: "@login", commentId, threadId, reviewId}`; the body finding has `file: ""`, `line: 0`, no thread.

Changes:
1. **A pass descriptor** threaded through `revise()` instead of a bare round: `{round, tag: "r1" | "h1", title: "Redline round 1" | "Redline human review 1", replyFile: (id) => ...}`. Agent labels use `tag` (`shape h1`, `push and reply h1`); reply files are `human-review-<n>-reply-<id>.md`; `replyBody` opens with `title`. Existing Redline rounds produce byte-identical prompts (loop-test's existing checks prove it).
2. **Shape prompt, human variant**: states the pass, the reviewer, the review body, the findings; dispositions `fix | ask | none` with the rules above; a `fix` carries `decidedBy: "reviewer"` and shape.md's entry ends `Decided by: @<reviewer>`; an `ask`'s story quotes the comment and gives the shaper's reading, addressed to the author; `none` is `decided by: redline` with the reason; no `defer`. `SHAPE_SCHEMA`: disposition enum gains `none`, decidedBy enum gains `reviewer`. The workflow rejects `defer` in a human pass (`stageError('shape', ...)`), rejects `reviewer`/`none` in a Redline round the same way, and maps `reviewer` to `@<reviewer>` in `outcomesFor` (owners) and in the plan-dial result.
3. **Outcomes**: new kind `none` → reply `Redline human review 1: no change requested. <reason> · decided by: redline`; `describeOutcome` matches. `needCommits` excludes `none`. The body finding's reply route is `issue-comment` with header `<!-- redline:H1-6 -->\n**H1-6** · from the review by @<reviewer>` (the "already posted" line); `replyEntry` takes the header from the pass descriptor.
4. **After revise**: when `outcome.newHead` exists, run `gather(firstRound)`, `review(firstRound, 'final-nit-pass', {from: startSha, to: newHead}, facts)` with `reviewBody` wording "Final nit pass: reviewed only the fixes from Redline human review 1 (a..b) for correctness bugs they introduced.", `post` as round `firstRound`; if it finds correctness bugs, `revise(roundRecord, correctness, 'correctness')` once (hand-off possible; no re-review; `lastFixUnreviewed: true`). Then `finish('human-summary', record, ...)`.
5. **`finish('human-summary')`**: no PR-description update, no review request; writes `<specFolder>/redline/human-review-<n>-summary.md` and posts it with `comment`; then `commitRecord()` (its folders include the nit-pass round's). The summary is one line: `Redline human review 1 · review by @marcamos: fixed H1-1, H1-2 and H1-4 in 3 commits (pushed); H1-3 and H1-5 were questions for @author, answered in their threads; H1-6 asked for nothing. Final nit pass (Redline round 3): no correctness bugs.` Variants: not pushed; no nit pass (no commits); the nit pass found and fixed N.
6. **Result**: `done` with `humanReview: {n, reviewer, reviewIds, summaryPosted, nitPassRound}`; `rounds[]` carries the human record as `reviewed: "human-review"`; `history()` therefore shows the nit-pass reviewer the H findings and their outcomes.
7. Reviewer prompt's known-findings globs: `agent-os/specs/*-<pr>-review-round-*/` and `*-<pr>-human-review-*/`.
8. Dials: `plan` and `guided` stop as today (the pending calls go to the author); `autopilot` takes the shaper's reading (existing `autopilotDecision`, whose reply already says so).

Loop-test (scenario 10, red first): the mock's id regexes accept `[RH]`; a `human` scenario helper. Checks: the call sequence `shape h1 | plan approver h1 | standards approver h1 | snapshot h1 | baseline | implement h1 | check h1 | push and reply h1 | gather r1 | final nit pass r1 | post r1 | summary comment | record files | record commit`; the fix reply reads `Redline human review 1: fixed in 1bbbbbb (redline: H1-1 fix). · decided by: @marcamos`; an `ask` ends as `handoff (decisions)` after `shape h1`, the relaunch replays the one prompt byte-identically and its reply is `decided by: @author`; `none` reply wording; a body finding routes to `issue-comment` with the `from the review by @marcamos` header; the shaper returning `defer` is `error` at `shape`; no `PR description`, `handoff comment` or `request-review` call; the summary text; the nit pass finding a correctness bug runs `shape r1 … push and reply r1` once and sets `lastFixUnreviewed`; a dry run posts nothing; `reviewer` disposition in a Redline round is refused; existing scenarios unchanged.

## Task 5: The skill and the agents

**Files**: `skills/redline-revise/SKILL.md`, `agents/redline-shaper.md`, `agents/redline-github.md`, `agents/redline-reviewer.md`.

- `redline-revise`: grammar gains `review <id|@login|latest>` (exclusive with `round N`); the settings step unchanged. Precheck as today, including `last-round` → `firstRound`. Then `n` = `last-human-review <pr>` + 1; ingest with `human-review <pr> <selector>`; stop with one line when `comments` is empty and `body` is null; build the findings (`H<n>-<k>` in the printed order, the body last); `specFolder` = `agent-os/specs/<stamp>-<pr>-human-review-<n>`; write `<specFolder>/redline/human-review-<n>.json` (selector, reviews, body, findings; the record #20 reads) and `snapshot-start.json`; launch with `revise: {kind: "human", ...}`; `done` reporting adds the human summary and the nit-pass round.
- `redline-shaper.md`: a "Human review pass" rule: dispositions `fix | ask | none`, owners, the comment quoted in an ask's story, no defer, the commit message names `H<n>-<k>`.
- `redline-github.md` reply rule: in a human pass a thread that already holds a Redline round reply still gets the pass's reply; the duplicate check is a reply opening `Redline human review <n>:`; the new `human-summary` comment operation.
- `redline-reviewer.md` step 3: both spec folder patterns.

## Task 6: README

**Files**: `README.md`. Use (the revise example `/redline:redline-revise 778 review @marcamos`), Settings → "Decided by" (fourth owner: `decided by: @<reviewer login>`, a change a teammate asked for in their review), Files (skill descriptions), Git rules item 1 (`<ts>-<pr>-human-review-<n>/`, the summary comment in the record commit), `redline-gh.sh` read table (two rows), Snapshot section (`human-review-<n>.json`), the loop description line.

## Task 7: Verification Gate

Run `.claude/redline/checks.sh --baseline` (gate steps 1 to 8: syntax, manifest, guard, loop, prefs, gate stamp, setup, gh) until it exits 0; report failures verbatim. No gate text changes, so no restamp and no `checks.json` edit. Then the standards retrospective (gate step 9): list the decisions above; expected edits: workflow/agents (the fourth owner; `fix | ask | none` in a human pass), scripts/bash-conventions (`human-review`, `last-human-review` join `GH_READ`), testing/tests (gh-test covers the ingest; loop-test the H-ids), workflow/replay (`n` enters through args). Present with AskUserQuestion; apply in their own commit, or record "Standards retrospective: no changes". Gate step 10: `plan.md` As built and `shape.md` Decisions reflect deviations.

## Verification

- `tests/gh-test.sh`: the PR 10 cases pass; `tests/guard-test.sh`: `N passed, 0 mismatched`; `node tests/loop-test.mjs`: `N checks passed, 0 failed` (existing checks unchanged, scenario 10 added); `claude plugin validate .`.
- End to end, after the person commits: on a seeded PR with a human review of five inline comments and one body comment, `/redline:redline-revise <pr> review @<login> dry run` writes the spec folder, the replies and the summary under `redline/`; then a live run replies in every thread and posts the summary.

## As built

Built 2026-10-26; the gate (`.claude/redline/checks.sh --baseline`) is green: syntax, validate, guard 374 rows, loop 212 checks, prefs 44, gate 117, setup 240, gh 67. Deviations from the plan above:

- **Task 2, the fixture count.** `review @marcamos` on PR 10 yields four open comments, not three: two from the submitted review, the single comment, and the reply inside the Redline thread. The plan miscounted; the cases assert four. `latest` also skips reviews by the gh user (the author running Redline), which the script reads with `gh api user`, since a hand-written reply by the author creates a review of its own and would otherwise be "latest". `@author` therefore yields that one hand reply, which the case pins.
- **Task 4, the reviewer's label and model.** `review()` keyed the label, the phase and the model on `round === firstRound`; the human pass's final nit pass carries the run's first round number and was labelled `review r3` with the first-round model. It now keys on what is reviewed (`pr` or not), which is the same thing for a Redline round.
- **Task 4, the dry run.** A human review's threads are real even in a dry run, so `replyEntry` routes every reply `file-only` whenever `postToGitHub` is false, instead of relying on empty thread ids; a Redline round's dry run behaves as before. The skill passes `posted: true` for a human review in every mode.
- **Task 4, the owner of a fix.** A `fix` the shaper marks with any owner but `reviewer` in a human pass is attributed to the reviewer with a warning, rather than stopping the run: the instruction is theirs whatever label the shaper wrote. A `defer` still stops at `shape`.
- **Task 4, the summary's "pushed".** The summary reads `push` (the run's setting), not the GitHub agent's `pushed` report, as the handoff comment does.
- **Task 4, the relaunch sequence.** An answered ask adds a `resolve h1` call after `shape h1`; the plan's sequence omitted it.
- **Task 5.** The human-pass rules went into the shaper agent file as rule 8 (the old 8 and 9 became 9 and 10); the unattended template is unchanged, as decided.
