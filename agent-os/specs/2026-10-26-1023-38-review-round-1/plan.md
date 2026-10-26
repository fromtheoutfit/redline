# PR #38 review round 1 (launch 2026-10-26-1023): address R1-1 to R1-5

Shaped by Redline in unattended mode.

## Context

Redline round 1 on PR #38 (#36: `/redline:redline-revise <pr> review <id | @login | latest>`, a revise pass over a teammate's review comments) reviewed the whole PR. All five findings are about how a teammate's comment is selected, answered and approved:

- **R1-1** (correctness, needs a decision): a Redline reply at a thread's root counts every earlier comment in that thread as answered. **Decided** by @michaelfromtheoutfit: name the comments in the reply (Task 5).
- **R1-2** (correctness, low): `@login` matches case-sensitively, and the skill writes the typed text as the owner. **Fix** (Task 2).
- **R1-3** (correctness, needs a decision): an answered review body is ingested again on every later pass. **Decided** by @michaelfromtheoutfit: name the review in the reply, newest unanswered body (Task 6, after Task 5).
- **R1-4** (correctness): two findings in one thread get two reply entries for one thread, and the second is skipped as a duplicate. **Fix** (Task 3).
- **R1-5** (correctness): approving the human pass's plan also approves its final nit pass's fix plan when `n === firstRound`. **Fix** (Task 4).

Nothing is deferred. See `shape.md` for the evidence behind each disposition.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them, and no task changes the gate's text, so nothing needs a restamp.
- A file a task does not name is not changed in this round. The #36 spec folder (`agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/`) is the record of what was built and is not edited. `tests/gh-fixtures/reviews-10.json`, `comments-10.json` and `issue-comments-10.json` are not changed by Tasks 2 to 6: Tasks 5 and 6 add new fixtures (PR 11 and PR 12) beside them, so every PR 10 case keeps its expected value.
- One commit per finding, in task order, each with the `redline:` prefix and the finding's ID, referencing #36 as the branch's other commits do (for example `redline: R1-2 match a login in any case in human-review (#36)`). The spec folder goes in the round's first commit or on its own.
- **A Redline round's prompts stay byte-identical** (`agent-os/standards/workflow/agents.md:10`). Tasks 3 to 6 change only the human pass's prompts, replies and body header and the plan dial's key; every existing loop check outside section 10 must pass unchanged.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script. Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-1023-38-review-round-1/redline/snapshot.json` and read the `gh` and `loop` checks' `stdout` in its JSON. Every other proof is a plain `grep` from the repository root. At the start of the round the harnesses printed `67 passed, 0 failed` (gh) and `212 checks passed, 0 failed` (loop), per the #36 spec's As built. If a starting count differs, record the actual numbers in As built; the differences below still hold.
- **How the loop harness counts.** `go()` in `tests/loop-test.mjs` (lines 155-159) adds one check of its own, `<name>: the run-record commit is the last call, after the closing comment`, to every scenario that reaches Finish (status `capped`, `handoffPosted` or `humanReview` in the result) without `recordFiles`. A scenario that ends in a hand-off adds none. Each expected count below follows from that.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-26-1023-38-review-round-1/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` belongs to the workflow and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R1-2, `@login` matches a login in any case

Files: `tests/gh-test.sh`, `scripts/redline-gh.sh`, `skills/redline-revise/SKILL.md`, `README.md`.

Red first (`agent-os/standards/testing/tests.md:18`).

1. **`tests/gh-test.sh`**: after the case `human-review @login: the selector is echoed` (line 161), add:

   ```bash
   is "human-review @login: the login matches in any case, and the owner is GitHub's spelling" "$(gh human-review 10 @MarcAmos | jq -c '[[.comments[].id], .body.review_id, .body.user, .selector]')" '[[904,907,905,909],7,"marcamos","@MarcAmos"]'
   ```

   The expected value is a literal (`testing/tests.md:15`): the same comments and body that `@marcamos` yields (line 154 and line 159), GitHub's spelling `marcamos` as the body's user, and the selector echoed as typed. Run the gate script before step 2 and record in As built that this case fails (expected `67 passed, 1 failed`; today it prints `[[],null,null,"@MarcAmos"]`, as the shaper reproduced over the same fixtures).

2. **`scripts/redline-gh.sh`, the `human-review` filter**: compare logins case-folded.
   - Line 282: `elif ($selector | startswith("@")) then {kind: "login", login: $selector[1:]}` becomes `elif ($selector | startswith("@")) then {kind: "login", login: ($selector[1:] | ascii_downcase)}`.
   - Line 286: `else ($open | map(select(.login == $pick.login))) end` becomes `else ($open | map(select((.login | ascii_downcase) == $pick.login))) end`.
   - Line 289: in `($humans | map(select((.user.login // "") == $pick.login and (.body // "") != "")) | ...)`, the comparison becomes `((.user.login // "") | ascii_downcase) == $pick.login`; the rest of the line is unchanged.
   - The `selector` field still echoes `$selector` as typed, and the `latest` branch's `!= $me` test is unchanged (both sides are GitHub's spelling).
   - Header, line 32: "@login keeps every open comment by that login, replies inside" becomes "@login keeps every open comment by that login (matched in any case, as GitHub matches logins), replies inside"; rewrap the header lines that follow if needed, keeping the `#` column.

3. **`README.md`, the `human-review` row** of the `redline-gh.sh` read table (line 288): "`@login` keeps every open comment by that login, replies inside Redline threads included" becomes "`@login` keeps every open comment by that login (matched in any case), replies inside Redline threads included". Nothing else in the row changes.

4. **`skills/redline-revise/SKILL.md:22`**: replace the last sentence, "The reviewer login is the selection's: the `@login` typed, or `reviews[0].user` for an id or `latest`.", with "The reviewer login is the one the script printed, never the text as typed (GitHub matches a login in any case, and every `decided by:` line and the summary name this one): `body.user` when `body` is not null, else `comments[0].user`." Nothing else in the step changes.

Proof:
- The gate's `gh` check `stdout` ends `68 passed, 0 failed` and lists `ok   human-review @login: the login matches in any case, and the owner is GitHub's spelling`.
- `grep -c "ascii_downcase" scripts/redline-gh.sh` prints 3.
- `grep -c "matched in any case" scripts/redline-gh.sh README.md` prints `scripts/redline-gh.sh:1` and `README.md:1`.
- `grep -c "the .@login. typed" skills/redline-revise/SKILL.md` prints 0, and `grep -c "never the text as typed" skills/redline-revise/SKILL.md` prints 1.

## Task 3: R1-4, one reply per thread in a human review pass

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`, `agents/redline-github.md`.

Red first.

1. **`tests/loop-test.mjs`, section 10.** After the check `human: the fix is still the reviewer's, with a warning` (line 579) and before the dry-run case (line 581), add:

   ```js
   run = await go('human: two comments in one thread', humanArgs([h('H1-1'), h('H1-2', { commentId: 912, description: 'Also rename baz.' })]), { reviews: [[]], commitIds: [['H1-1', 'H1-2']] })
   const shared = replies(run.calls, 'push and reply h1')
   check('human: two findings in one thread get one reply that names both', run.res.status === 'done' && shared.length === 1 && shared[0].comment_id === 900 && shared[0].route === 'thread' && JSON.stringify(shared[0].findings) === '["H1-1","H1-2"]' && shared[0].file === `/r/${folder}/redline/human-review-1-reply-H1-1-H1-2.md` && shared[0].body === 'Redline human review 1:\n\n**H1-1**: fixed in 1bbbbbb (redline: H1-1 fix). · decided by: @marcamos\n\n**H1-2**: fixed in 2bbbbbb (redline: H1-2 fix). · decided by: @marcamos', shared)
   check('human: the push prompt says one entry can answer several findings', pick(run.calls, 'push and reply h1').prompt.includes('One entry may answer several findings of one thread (its findings list names them); it is still one reply.'))
   ```

   Both findings keep `h()`'s default `threadId` 900, so `humanArgs` maps both to thread 900, which is the reviewer's `@marcamos` shape (`[905,905]` and `[912,905]`). Leave the `four` scenario unchanged: its findings sit in threads 900, 901 and 902 plus the body, so nothing merges, and `human: reply files carry the pass name` must still pass. Run the gate script before step 2 and record in As built that the two new checks fail (expected `213 checks passed, 2 failed`: the scenario reaches Finish, so `go()`'s record-commit check for it passes before and after the fix).

2. **`workflows/redline-loop.js`**: add a helper after `replyEntry()` (line 621):

   ```js
   // A thread gets one reply per pass (#38, R1-4). In a human review pass two open comments of one
   // thread (a teammate's comment and their own follow-up) are two findings with one root, so their
   // entries merge: one reply that opens with the pass's title and gives each finding's outcome on
   // its own line. A Redline round's findings each have their own root, so it never merges.
   function mergeThreadReplies(pass, entries) {
     if (!pass.human) {
       return entries
     }
     const groups = []
     const byThread = new Map()
     for (const entry of entries) {
       const group = entry.comment_id ? byThread.get(entry.comment_id) : null
       if (group) {
         group.push(entry)
         continue
       }
       const fresh = [entry]
       groups.push(fresh)
       if (entry.comment_id) {
         byThread.set(entry.comment_id, fresh)
       }
     }
     return groups.map((group) => {
       if (group.length === 1) {
         return group[0]
       }
       const ids = group.map((entry) => entry.finding)
       return {
         finding: ids[0],
         findings: ids,
         comment_id: group[0].comment_id,
         route: group[0].route,
         file: abs(pass.replyFile(ids.join('-'))),
         body: `${pass.title}:\n\n${group.map((entry) => `**${entry.finding}**: ${entry.body.slice(pass.title.length + 2)}`).join('\n\n')}`,
       }
     })
   }
   ```

   Every entry with a non-zero `comment_id` is a `thread` entry, or `file-only` in a dry run, and its body is `replyBody()`'s, which opens `${pass.title}: `. The slice therefore keeps each finding's outcome and owner. A body finding (`comment_id` 0) never merges. Entries keep the order of their first finding.

3. **`workflows/redline-loop.js`, `revise()`** (line 1664): wrap the inline replies, not the dropped ones:

   ```js
   const replies = mergeThreadReplies(pass, inScope.map((f) => replyEntry(pass, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted))).concat(droppedReplies(record))
   ```

   `record.files.push(...)` on line 1672 needs no change: it takes each entry's `file`.

4. **`workflows/redline-loop.js`, `pushReplyPrompt()`**: the human `twice` text (lines 947-949) gains one sentence at its end, after "The duplicate check is a reply in that thread opening \`${pass.title}:\`.": ` One entry may answer several findings of one thread (its findings list names them); it is still one reply.` The Redline round branch (`''`) is unchanged.

5. **`agents/redline-github.md:23`**, the **reply** bullet: "`redline-gh.sh reply <pr> <comment-id> <file>` once per finding, in the thread the review created." becomes "`redline-gh.sh reply <pr> <comment-id> <file>` once per reply entry, in the thread the review created: one entry per finding, except in a human review pass, where the findings that share a thread answer in one entry that lists them under `findings`." The rest of the bullet is unchanged.

Proof:
- The gate's `loop` check `stdout` ends `215 checks passed, 0 failed` and lists `ok` for `human: two findings in one thread get one reply that names both`, `human: the push prompt says one entry can answer several findings` and `human: two comments in one thread: the run-record commit is the last call, after the closing comment`.
- `grep -c "function mergeThreadReplies" workflows/redline-loop.js` prints 1, and `grep -c "mergeThreadReplies(pass, inScope.map" workflows/redline-loop.js` prints 1.
- `grep -c "it is still one reply" workflows/redline-loop.js` prints 1.
- `grep -c "once per reply entry" agents/redline-github.md` prints 1, and `grep -c "once per finding, in the thread" agents/redline-github.md` prints 0.

## Task 4: R1-5, a plan approval is keyed by the pass

Files: `tests/loop-test.mjs`, `workflows/redline-loop.js`, `skills/redline/SKILL.md`.

Red first. Runs after Task 3, so the loop harness starts at `215 checks passed, 0 failed`.

1. **`tests/loop-test.mjs`, section 10.** After the check `human: the plan dial lists the fix as the reviewer's` (line 573), add:

   ```js
   check('human: the plan dial approves the pass by its key, h1', JSON.stringify(run.res.approveWith) === '{"approvedPlans":["h1"]}', run.res.approveWith)
   const nitBug = { reviews: [[f('R1-1', 'correctness')]], commitIds: [['H1-1'], ['R1-1']] }
   run = await go('human: plan dial, a round number does not approve the pass', humanArgs([h('H1-1')], {}, { firstRound: 1, interrupt: 'plan', approvedPlans: [1] }), nitBug)
   check('human: approvedPlans [1] does not approve h1, even when the nit pass is round 1', run.res.status === 'handoff' && run.res.handoffKind === 'plan' && labels(run.calls).join('|') === 'shape h1' && JSON.stringify(run.res.approveWith) === '{"approvedPlans":[1,"h1"]}', [run.res.status, labels(run.calls), run.res.approveWith])
   run = await go('human: plan dial, h1 approved, the nit pass finds a bug', humanArgs([h('H1-1')], {}, { firstRound: 1, interrupt: 'plan', approvedPlans: ['h1'] }), nitBug)
   check('human: approving h1 leaves the round-1 fix plan to stop for the person', run.res.status === 'handoff' && run.res.handoffKind === 'plan' && run.res.handoffRound === 1 && labels(run.calls).join('|') === 'shape h1|plan approver h1|standards approver h1|snapshot h1|baseline|implement h1|check h1|push and reply h1|gather r1|final nit pass r1|post r1|shape r1' && JSON.stringify(run.res.approveWith) === '{"approvedPlans":["h1",1]}', [run.res.status, labels(run.calls), run.res.approveWith])
   ```

   `humanArgs` spreads its third argument after `firstRound: 3`, so `firstRound: 1` takes effect, which is the case where `n === firstRound`. Leave the Redline plan-dial checks in section 3 unchanged (`plan: says how to approve` expects `{"approvedPlans":[1]}`, and `plan: approveWith accumulates` expects `{"approvedPlans":[1,2]}`). Run the gate script before step 2 and record in As built that the three new checks fail (expected `216 checks passed, 3 failed`). Before the fix, `approvedPlans: [1]` approves both passes, so that scenario runs to `done` and `go()` adds its record-commit check, which passes. `approvedPlans: ["h1"]` is dropped by today's numeric parse and stops after `shape h1`. After the fix both scenarios end in a hand-off, so `go()` adds nothing, and the green run is 215 + 3 = 218.

2. **`workflows/redline-loop.js`, `passOf()`** (lines 174-193): the human descriptor gains `planKey: \`h${n}\`` and the round descriptor gains `planKey: n`, each after `tag`. The docblock above it is unchanged: no prompt reads `planKey`, so every prompt stays byte-identical.

3. **`workflows/redline-loop.js`, the `approvedPlans` parse** (lines 112-113) becomes:

   ```js
   // plan dial: the passes whose disposition list the person approved (relaunch carries them all):
   // a Redline round by its number, a human review pass as h<n> (passOf's planKey), so a pass and
   // its final nit pass never share a key when their numbers are equal (#38, R1-5).
   const approvedPlans = Array.isArray(A.approvedPlans)
     ? A.approvedPlans.map((key) => (typeof key === 'string' && /^h\d+$/.test(key) ? key : Number(key))).filter((key) => typeof key === 'string' || Number.isInteger(key))
     : []
   ```

   A number, or a numeric string, parses as today, so every existing relaunch arg stays valid.

4. **`workflows/redline-loop.js`, `revise()`** (line 1451): `if (interrupt === 'plan' && !approvedPlans.includes(round)) {` becomes `if (interrupt === 'plan' && !approvedPlans.includes(pass.planKey)) {`. In the comment above it (lines 1448-1450), "carries this round in args.approvedPlans" becomes "carries this pass's key in args.approvedPlans".

5. **`workflows/redline-loop.js`, `handoffResult()`** (line 1862): `approveWith: { approvedPlans: unique(approvedPlans.concat(record.round)) },` becomes `approveWith: { approvedPlans: unique(approvedPlans.concat(passOf(record).planKey)) },`.

6. **`workflows/redline-loop.js`, the relaunch `how` text** (line 1212): "handoff (plan): approvedPlans with this round added," becomes "handoff (plan): approvedPlans as approveWith gives it (this round's number added, or h<n> for a human review pass),". Nothing else in the string changes. `handoffComment()`'s `approvedPlans.includes(record.round)` (line 1705) is left as it is: it lists a Redline run's rounds, whose key is their number.

7. **`skills/redline/SKILL.md:167`**: "(every round approved so far, this one added)" becomes "(every pass approved so far, this one added: a Redline round by its number, a human review pass as `h<n>`; pass the list exactly as given)". Nothing else in the paragraph changes.

Proof:
- The gate's `loop` check `stdout` ends `218 checks passed, 0 failed` and lists `ok` for `human: the plan dial approves the pass by its key, h1`, `human: approvedPlans [1] does not approve h1, even when the nit pass is round 1`, `human: approving h1 leaves the round-1 fix plan to stop for the person`, `plan: says how to approve` and `plan: approveWith accumulates`.
- `grep -c "approvedPlans.includes(round)" workflows/redline-loop.js` prints 0, and `grep -c "approvedPlans.includes(record.round)" workflows/redline-loop.js` prints 1 (`handoffComment()`, unchanged).
- `grep -n "planKey" workflows/redline-loop.js` prints the comment above the parse, the two `passOf()` descriptors, the plan-dial check in `revise()` and `approveWith` in `handoffResult()`, and no other line.
- `grep -c "a human review pass as .h<n>." skills/redline/SKILL.md` prints 1.

## Task 5: R1-1, a human-pass reply names the comments it answers

Decided by @michaelfromtheoutfit on 2026-10-26 (`shape.md`, Decisions, R1-1): **Name the comments in the reply.** Each human-pass thread reply ends with a hidden `<!-- redline:answers <ids> -->` line, and `human-review` counts a comment as answered only when a Redline reply in its thread names it, with today's thread rule kept for a reply without the line.

Files: `tests/gh-fixtures/reviews-11.json` (new), `tests/gh-fixtures/comments-11.json` (new), `tests/gh-test.sh`, `scripts/redline-gh.sh`, `README.md`, `tests/loop-test.mjs`, `workflows/redline-loop.js`.

Runs after Tasks 2 to 4, so the harnesses start at `68 passed, 0 failed` (gh) and `218 checks passed, 0 failed` (loop). Line numbers below are the PR head's (`d7b7c86`); where an earlier task moved a line, the quoted text locates it. Red first. Commit as, for example, `redline: R1-1 name the comments a human-pass reply answers (#36)`.

1. **Fixtures, PR 11: a thread two teammates share.** Shaped like the reviewer's `/tmp/redlinerepro/s2-reviews.json` and `s3-comments.json`, with reply 950 naming the one comment it answered:
   - `tests/gh-fixtures/reviews-11.json`:

     ```json
     [
       {"id": 7, "user": {"login": "marcamos"}, "state": "COMMENTED", "body": "", "submitted_at": "2026-10-21T09:00:00Z"},
       {"id": 8, "user": {"login": "sam"}, "state": "COMMENTED", "body": "", "submitted_at": "2026-10-21T10:00:00Z"},
       {"id": 10, "user": {"login": "marcamos"}, "state": "COMMENTED", "body": "", "submitted_at": "2026-10-21T11:00:00Z"},
       {"id": 20, "user": {"login": "author"}, "state": "COMMENTED", "body": "", "submitted_at": "2026-10-22T09:00:00Z"}
     ]
     ```

   - `tests/gh-fixtures/comments-11.json`:

     ```json
     [
       {"id": 905, "pull_request_review_id": 7, "user": {"login": "marcamos"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Rename foo to bar.", "in_reply_to_id": null, "created_at": "2026-10-21T09:00:00Z"},
       {"id": 911, "pull_request_review_id": 8, "user": {"login": "sam"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Agreed, and the same function also needs a null check.", "in_reply_to_id": 905, "created_at": "2026-10-21T10:00:00Z"},
       {"id": 912, "pull_request_review_id": 10, "user": {"login": "marcamos"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Also rename baz while you are there.", "in_reply_to_id": 905, "created_at": "2026-10-21T11:00:00Z"},
       {"id": 950, "pull_request_review_id": 20, "user": {"login": "author"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Redline human review 1: fixed in 1234567 (redline: H1-1 rename foo). · decided by: @marcamos\n\n<!-- redline:answers 905 -->", "in_reply_to_id": 905, "created_at": "2026-10-22T09:00:00Z"}
     ]
     ```

2. **`tests/gh-test.sh`** (red):
   - The `cp` line (line 39) also copies `"$FIX/reviews-11.json" "$FIX/comments-11.json"`.
   - Two shim endpoints after the PR 10 ones (after line 77): `"repos/{owner}/{repo}/pulls/11/reviews") pages=("$PAGES/reviews-11.json") ;;` and `"repos/{owner}/{repo}/pulls/11/comments") pages=("$PAGES/comments-11.json") ;;`.
   - The header comment (lines 11-15) gains one sentence after the PR 10 one: "PR 11 is a thread two teammates share (#38, R1-1): under a teammate's comment, a Redline human review reply that names the one comment it answered, a second teammate's comment and the first teammate's follow-up."
   - After the case `human-review: a login with no comment is empty, exit 0` (line 169), add:

     ```bash
     is "human-review 11 @login: a comment in another teammate's thread is open when the Redline reply there does not name it" "$(gh human-review 11 @sam | jq -c '[[.comments[].id], .comments[0].thread_id, .body, [.reviews[].id]]')" '[[911],905,null,[8]]'
     is "human-review 11 @login: the follow-up is open, the comment the reply names is answered" "$(gh human-review 11 @marcamos | jq -c '[[.comments[].id], .body, [.reviews[].id]]')" '[[912],null,[10]]'
     is "human-review 11 latest: the newest review with a comment no Redline reply names" "$(gh human-review 11 latest | jq -c '[[.comments[].id], .body, [.reviews[].id]]')" '[[912],null,[10]]'
     is "human-review 11 <id>: the review whose comment the reply names has nothing open" "$(gh human-review 11 7 | jq -c '[.comments, .body, .reviews]')" '[[],null,[]]'
     ```

   Run the gate script before step 3 and record in As built that the first three fail (expected `69 passed, 3 failed`: today reply 950 answers every earlier comment in thread 905, so all three print empty lists; the fourth passes before and after and is the neighbour that must not change). PR 10's case `human-review @login: the comment a Redline human review reply answered is left out` (line 158) stays green after the fix: reply 908 carries no answers line, so the thread rule still answers 906.

3. **`scripts/redline-gh.sh`, the `human-review` filter**:
   - After `def redline_reply` (line 268), add:

     ```jq
     def answers: ([(.body // "") | match("<!-- redline:answers ([0-9 ]+) -->") | .captures[0].string] | first) as $s
         | if $s == null then null else [$s | splits(" +") | select(. != "") | tonumber] end;
     ```

   - Line 271, `| ($all | map(select(redline_reply))) as $replies`, becomes `| ($all | map(select(redline_reply) | . + {answers: answers})) as $replies`.
   - Line 275, `and (. as $c | any($replies[]; .thread_id == $c.thread_id and .id > $c.id) | not)))) as $open`, becomes `and (. as $c | any($replies[]; .thread_id == $c.thread_id and (if .answers == null then .id > $c.id else any(.answers[]; . == $c.id) end)) | not)))) as $open`.
   - Header (lines 29-31): "or is already answered by a Redline reply later in its thread (thread_id is in_reply_to_id, else the comment's own id)." becomes "or is already answered by a Redline reply in its thread (thread_id is in_reply_to_id, else the comment's own id): a reply whose body carries <!-- redline:answers <ids> --> answers only the comments it names, and one without that line answers every comment before it." Rewrap the lines that follow, keeping the `#` column.
   - The resolve agent ran this filter, with Task 2's `ascii_downcase` edits, over the PR 10 fixtures and the PR 11 data above with the real jq (1.8.2): every PR 10 case prints its current expected value, and the four PR 11 cases print the literals in step 2.

4. **`README.md`, the `human-review` row** (line 288): "the selection's comments that no Redline reply (`Redline round N:` or `Redline human review N:`, later in the same thread) has answered" becomes "the selection's comments that no Redline reply in the same thread has answered (a reply carrying `<!-- redline:answers <ids> -->`, as every human-pass thread reply does, answers only the comments it names; one without it, `Redline round N:` or an earlier `Redline human review N:`, answers every comment before it)". Nothing else in the row changes in this task.

5. **`tests/loop-test.mjs`, section 10** (red). Every human-pass thread reply now ends with the line, so these checks' expected literals gain `\n\n<!-- redline:answers <id> -->` at their end, the id being the finding's own `commentId`:
   - `human: a fix is decided by the reviewer` (line 537): `'Redline human review 1: fixed in 1bbbbbb (redline: H1-1 fix). · decided by: @marcamos\n\n<!-- redline:answers 900 -->'`.
   - `human: an answered ask is decided by the author` (line 538): `'Redline human review 1: The author keeps the default because the board already shows it. Applied in 2bbbbbb (redline: H1-2 fix). · decided by: @author\n\n<!-- redline:answers 901 -->'`.
   - `human: a comment that asks for nothing says so, decided by redline` (line 539): `'Redline human review 1: no change requested. none H1-3 this way · decided by: redline\n\n<!-- redline:answers 902 -->'`.
   - `human: autopilot takes the shaper's reading and the reply says so` (line 569): `'Redline human review 1: Autopilot took the shaper\'s recommendation: Keep it. Applied in 2bbbbbb (redline: H1-2 fix). · decided by: redline (autopilot)\n\n<!-- redline:answers 901 -->'`.
   - `human: the fix is still the reviewer's, with a warning` (line 579): `.endsWith('· decided by: @marcamos')` becomes `.endsWith('· decided by: @marcamos\n\n<!-- redline:answers 900 -->')`.
   - Task 3's `human: two findings in one thread get one reply that names both`: the expected body ends `· decided by: @marcamos\n\n<!-- redline:answers 900 912 -->` (H1-1's `commentId` 900 and H1-2's 912, in the findings' order).

   After `human: reply files carry the pass name` (line 542), add:

   ```js
   check('human: the body reply names no comment, so only thread replies carry the answers line', !replyFor(second.calls, 'push and reply h1', 'H1-4').includes('redline:answers'), replyFor(second.calls, 'push and reply h1', 'H1-4'))
   ```

   Leave `human: the round-3 fix reply is a Redline round reply` (its exact `Redline round 3: fixed in 4bbbbbb (redline: R3-1 fix). · decided by: redline`) and the dry-run check (an `includes`) as they are: the first proves a Redline round's reply carries no line. Run the gate script before step 6 and record in As built that the six changed checks fail (expected `213 checks passed, 6 failed`: 219 checks, the new check passes before and after, and no scenario is added, so `go()` adds no check).

6. **`workflows/redline-loop.js`**: add after `mergeThreadReplies()` (Task 3):

   ```js
   // A human-pass thread reply names the comments it answers (#38, R1-1): its last line is a hidden
   // <!-- redline:answers <ids> --> with each of its findings' own commentId, so redline-gh.sh
   // human-review counts a comment in a shared thread as answered only when a reply names it. A
   // body reply (no thread) and a Redline round's replies carry no such line; the script answers
   // a reply without it by the thread rule.
   function withAnswers(pass, findings, entries) {
     if (!pass.human) {
       return entries
     }
     const commentOf = Object.fromEntries(findings.map((f) => [f.id, Number(f.commentId) || 0]))
     return entries.map((entry) => {
       if (!entry.comment_id) {
         return entry
       }
       const ids = unique((entry.findings || [entry.finding]).map((id) => commentOf[id] || entry.comment_id))
       return { ...entry, body: `${entry.body}\n\n<!-- redline:answers ${ids.join(' ')} -->` }
     })
   }
   ```

   In `revise()`, the reply build (line 1664 as Task 3 left it) becomes:

   ```js
   const replies = withAnswers(pass, inScope, mergeThreadReplies(pass, inScope.map((f) => replyEntry(pass, f, outcomes[f.id], record.commentIds[f.id] || 0, record.reviewPosted)))).concat(droppedReplies(record))
   ```

   The line is added after the merge, once per reply, so `mergeThreadReplies()`'s slice of each body is unchanged. A dry run's file-only entry keeps its `comment_id`, so its file carries the line too and is the reply as it would be posted. A Redline round returns its entries untouched, so its prompts stay byte-identical.

Proof:
- The gate's `gh` check `stdout` ends `72 passed, 0 failed` and lists `ok` for the four `human-review 11` cases and for `human-review @login: the comment a Redline human review reply answered is left out`.
- The gate's `loop` check `stdout` ends `219 checks passed, 0 failed` and lists `ok` for the six changed checks, `human: the body reply names no comment, so only thread replies carry the answers line` and `human: the round-3 fix reply is a Redline round reply`.
- `grep -c "function withAnswers" workflows/redline-loop.js` prints 1, and `grep -c "withAnswers(pass, inScope, mergeThreadReplies(" workflows/redline-loop.js` prints 1.
- `grep -c 'match("<!-- redline:answers' scripts/redline-gh.sh` prints 1, and `grep -c "redline:answers" README.md` prints 1.

## Task 6: R1-3, a body reply names its review, and an answered body is not taken again

Decided by @michaelfromtheoutfit on 2026-10-26 (`shape.md`, Decisions, R1-3): **Name the review in the reply, newest unanswered body.** The body reply's header names the review it answers; `human-review` reads the PR's issue comments and skips a body whose review a Redline human review comment names; one body per pass, the newest not yet answered.

Files: `tests/gh-fixtures/issue-comments-11.json` (new), `tests/gh-fixtures/reviews-12.json` (new), `tests/gh-fixtures/comments-12.json` (new), `tests/gh-fixtures/issue-comments-12.json` (new), `tests/gh-test.sh`, `scripts/redline-gh.sh`, `README.md`, `skills/redline-revise/SKILL.md`, `tests/loop-test.mjs`, `workflows/redline-loop.js`, `agents/redline-github.md`.

Runs after Task 5, so the harnesses start at `72 passed, 0 failed` (gh) and `219 checks passed, 0 failed` (loop). Line numbers below are the PR head's (`d7b7c86`); the header rewraps of Tasks 2 and 5, Task 5's two-line `def answers` and the lines Tasks 3 to 5 add to `tests/loop-test.mjs` and `workflows/redline-loop.js` can move them, and the quoted text locates each one. Red first. Commit as, for example, `redline: R1-3 name the review in a body reply and skip an answered body (#36)`.

1. **Fixtures.**
   - `tests/gh-fixtures/issue-comments-11.json`: `[]`. After this task `human-review` reads the issue comments of every PR it runs on, so PR 11 needs the endpoint.
   - PR 12, an answered review body beside an older open one. `tests/gh-fixtures/reviews-12.json`:

     ```json
     [
       {"id": 6, "user": {"login": "marcamos"}, "state": "COMMENTED", "body": "Older note: document the new flag in the README.", "submitted_at": "2026-10-20T09:00:00Z"},
       {"id": 7, "user": {"login": "marcamos"}, "state": "COMMENTED", "body": "One general thing: the empty case needs a test somewhere.", "submitted_at": "2026-10-21T09:00:00Z"},
       {"id": 20, "user": {"login": "author"}, "state": "COMMENTED", "body": "", "submitted_at": "2026-10-22T09:00:00Z"}
     ]
     ```

     `tests/gh-fixtures/comments-12.json`:

     ```json
     [
       {"id": 905, "pull_request_review_id": 7, "user": {"login": "marcamos"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Rename foo to bar.", "in_reply_to_id": null, "created_at": "2026-10-21T09:00:00Z"},
       {"id": 950, "pull_request_review_id": 20, "user": {"login": "author"}, "path": "app/c.php", "line": 3, "side": "RIGHT", "body": "Redline human review 1: fixed in 1234567 (redline: H1-1 rename foo). · decided by: @marcamos\n\n<!-- redline:answers 905 -->", "in_reply_to_id": 905, "created_at": "2026-10-22T09:00:00Z"}
     ]
     ```

     `tests/gh-fixtures/issue-comments-12.json` (the body reply in the new header form, the pass's summary, and a teammate's comment that quotes the header without the marker):

     ```json
     [
       {"id": 60, "user": {"login": "author"}, "body": "<!-- redline:H1-2 -->\n**H1-2** · from review 7 by @marcamos\n\nRedline human review 1: fixed in 2345678 (redline: H1-2 test the empty case). · decided by: @marcamos"},
       {"id": 61, "user": {"login": "author"}, "body": "Redline human review 1 · review by @marcamos: fixed H1-1 and H1-2 in 2 commits (pushed)."},
       {"id": 62, "user": {"login": "marcamos"}, "body": "**H1-9** · from review 6 by @marcamos is how Redline would head it; this comment is not one."}
     ]
     ```

2. **`tests/gh-test.sh`** (red):
   - The `cp` line (line 39) also copies `"$FIX/issue-comments-11.json" "$FIX/reviews-12.json" "$FIX/comments-12.json" "$FIX/issue-comments-12.json"`.
   - Four shim endpoints after Task 5's PR 11 ones: `"repos/{owner}/{repo}/issues/11/comments") pages=("$PAGES/issue-comments-11.json") ;;`, `"repos/{owner}/{repo}/pulls/12/reviews") pages=("$PAGES/reviews-12.json") ;;`, `"repos/{owner}/{repo}/pulls/12/comments") pages=("$PAGES/comments-12.json") ;;` and `"repos/{owner}/{repo}/issues/12/comments") pages=("$PAGES/issue-comments-12.json") ;;`.
   - The header comment gains one sentence after Task 5's: "PR 12 is an answered review body (#38, R1-3): a teammate's review whose comment and body a Redline human review pass answered, the body by an issue comment whose header names the review, beside an older review of theirs whose body is still open and a comment of theirs that quotes the header without the marker."
   - After Task 5's four `human-review 11` cases, add:

     ```bash
     is "human-review 12 <id>: a body a Redline human review comment names as answered is not taken again" "$(gh human-review 12 7 | jq -c '[.comments, .body, .reviews]')" '[[],null,[]]'
     is "human-review 12 @login: the newest body not yet answered, from an older review" "$(gh human-review 12 @marcamos | jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]')" '[[],6,[6]]'
     is "human-review 12 latest: skips the review whose body is answered" "$(gh human-review 12 latest | jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]')" '[[],6,[6]]'
     is "human-review 12 <id>: a comment that quotes the header without the marker answers nothing" "$(gh human-review 12 6 | jq -r '.body.text')" "Older note: document the new flag in the README."
     ```

   Run the gate script before step 3 and record in As built that the first three fail (expected `73 passed, 3 failed`: today each takes review 7's body; the fourth passes before and after). PR 10's body cases (`human-review @login: the body is the newest non-empty review body by that login`, `human-review <id>: that review's un-replied comments and its body`) stay green after the fix: no PR 10 issue comment carries the marker and the header form.

3. **`scripts/redline-gh.sh`, `human-review`**:
   - A third list through a temp file, as the other two (`scripts/bash-conventions.md`): `issues_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"` beside the other two; the trap (line 263) becomes `trap 'rm -f "$reviews_file" "$comments_file" "$issues_file"' EXIT`; after the comments read (line 265) add `gh api --paginate --slurp "repos/{owner}/{repo}/issues/$1/comments" | jq '[.[][]]' > "$issues_file" || exit 2`; the comment above them (line 260) says "The three lists grow with the PR"; the `jq -n` call (line 266) gains `--slurpfile issues "$issues_file"`.
   - In the filter, after the `$redline_ids` binding (line 269, `($reviews[0] | map(select(redline_review) | .id)) as $redline_ids`), add:

     ```jq
     | ([$issues[0][] | (.body // "") | capture("^<!-- redline:H[0-9]+-[0-9]+ -->\\s+\\*\\*H[0-9]+-[0-9]+\\*\\* · from review (?<id>[0-9]+) by @") | .id | tonumber] | unique) as $answered_bodies
     | def open_body: (.body // "") != "" and (.id as $r | $answered_bodies | index($r) | not);
     ```

     The next line (line 270), `| ($comments[0] | map(. + {thread_id: ...})) as $all`, drops its leading `| `: a `def` is followed directly by the expression it scopes. `\\s+` takes the `\r\n` GitHub may store as well as `\n`.
   - `open_body` replaces the non-empty-body test in its three places: `latest` (line 279), `((.body // "") != "" or (.id as $r | ...))` becomes `(open_body or (.id as $r | ...))`; the id branch (line 288), `select(.id == $pick.id and (.body // "") != "")` becomes `select(.id == $pick.id and open_body)`; the `@login` branch (line 289 as Task 2 left it), `and (.body // "") != ""` becomes `and open_body`, and its `sort_by(.submitted_at, .id) | last` stays, so it takes the newest body not yet answered.
   - Header (lines 31-36, as Tasks 2 and 5 rewrapped them): "An id keeps that review's open comments and its body when not empty" becomes "An id keeps that review's open comments and its body when not empty and not answered (an issue comment opening <!-- redline:H<n>-<k> --> whose next line is **H<n>-<k>** · from review <id> by @<login> answers that review's body)"; "and the body of their newest review that has one" becomes "and the body of their newest review that has one not answered (one body per pass)"; "with an open comment or a body" becomes "with an open comment or an unanswered body". Rewrap, keeping the `#` column.
   - The resolve agent ran this filter, with the Task 2 and Task 5 edits, over the PR 10 fixtures, the PR 11 data and the PR 12 data above with the real jq (1.8.2): every PR 10 and PR 11 case prints its expected value, the four PR 12 cases print the literals in step 2, and review 7 is still answered when comment 60's line breaks are `\r\n`.

4. **`README.md`, the `human-review` row** (line 288): the second column, "reviews list and `GET /pulls/<n>/comments`, both paginated; `gh api user` for `latest`", becomes "reviews list, `GET /pulls/<n>/comments` and `GET /issues/<n>/comments`, all paginated; `gh api user` for `latest`". In the third column, "An id keeps that review's open comments and its body when not empty;" becomes "An id keeps that review's open comments and its body when not empty and not answered (a Redline human review issue comment whose header line is `**H<n>-<k>** · from review <id> by @<login>` answers it);"; "and the body of their newest review that has one;" becomes "and the body of their newest review that has one not answered (one body per pass, so an older one comes up on the next pass);"; "with an open comment or a body" becomes "with an open comment or an unanswered body".

5. **`skills/redline-revise/SKILL.md:16`**: "and the review body when there is one (see the README's" becomes "and the review body when there is one that no Redline human review comment has answered (see the README's". Nothing else in the step changes.

6. **`tests/loop-test.mjs`, section 10** (red):
   - `human: the body finding is an issue comment headed by the reviewer's name` (line 540): the `startsWith` literal becomes `'<!-- redline:H1-4 -->\n**H1-4** · from review 7 by @marcamos\n\nRedline human review 1: fixed in 3bbbbbb'` (H1-4 carries `h()`'s default `reviewId` 7).
   - `human: the push prompt names the pass, the header line and the duplicate rule` (line 544): '`**<id>** · from the review by @marcamos`' becomes '`**<id>** · from review <review id> by @marcamos`'.

   Run the gate script before step 7 and record in As built that both fail (expected `217 checks passed, 2 failed`; no check or scenario is added).

7. **`workflows/redline-loop.js`, `passOf()`**, the human descriptor (lines 181-182):

   ```js
   bodyHeader: (f) => `**${f.id}** · from review ${f.reviewId} by ${reviewer}`,
   bodyHeaderHint: `\`**<id>** · from review <review id> by ${reviewer}\``,
   ```

   The body finding carries `reviewId: <body.review_id>` (`skills/redline-revise/SKILL.md`, step 2). In `replyEntry()`'s docblock, the last sentence ("In a human review pass the body finding ... with a header naming the teammate's review instead of a Redline round's body.") gains: "(`from review <id> by @<login>`), which `redline-gh.sh human-review` reads back so it never takes an answered body again (#38, R1-3)". The Redline round descriptor is unchanged, so a Redline round's prompts stay byte-identical.

8. **`agents/redline-github.md:23`**, the **reply** bullet: "`**<finding>** · from the review by @<login>`" becomes "`**<finding>** · from review <review id> by @<login>`". The rest of the bullet is unchanged.

Proof:
- The gate's `gh` check `stdout` ends `76 passed, 0 failed` and lists `ok` for the four `human-review 12` cases, the four `human-review 11` cases and `human-review @login: the body is the newest non-empty review body by that login`.
- The gate's `loop` check `stdout` ends `219 checks passed, 0 failed` and lists `ok` for the two changed checks.
- `grep -c 'issues/$1/comments' scripts/redline-gh.sh` prints 2 (`human-review` and `last-human-review`), and `grep -c "open_body" scripts/redline-gh.sh` prints 4.
- `grep -c "from the review by" workflows/redline-loop.js agents/redline-github.md tests/loop-test.mjs` prints 0 for each file, and `grep -c "from review <review id> by" workflows/redline-loop.js agents/redline-github.md tests/loop-test.mjs` prints 1 for each.
- `grep -c "that no Redline human review comment has answered" skills/redline-revise/SKILL.md` prints 1.

## Task 7: Verification Gate

Files: `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/workflow/agents.md`, `agent-os/standards/workflow/replay.md`, `agent-os/standards/testing/tests.md` (step 9, the retrospective commit; `tests.md` is named by items 4 and 5); `agent-os/specs/2026-10-26-1023-38-review-round-1/plan.md` and `shape.md` (step 10).

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-26-1023-38-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. Items 1 to 3 are drafted by the shaper. Items 4 and 5 were held for R1-1 and R1-3 and are now drafted from the person's decisions, before the standards approver runs. The standards approver approves the list, and the implementer applies it in its own commit, touching only the standards files the approved items name. The commit's message names no finding unless a finding's plan sends part of its fix through the retrospective, and none here does. If the approver approves no edit, the implementer records "Standards retrospective: no changes" under Decisions in `shape.md` instead.
- **Step 10, spec folder.** `plan.md` gets an As built section with each red run's failing check names and counts, and any deviation is recorded under Decisions in `shape.md`.

Proof (step 9, for each item the approver approves):
- Item 1: `grep -c "#38, R1-2" agent-os/standards/scripts/bash-conventions.md` prints 1.
- Item 2: `grep -c "#38, R1-4" agent-os/standards/workflow/agents.md` prints 1.
- Item 3: `grep -c "#38, R1-5" agent-os/standards/workflow/replay.md` prints 1.
- Item 4: `grep -c "#38, R1-1" agent-os/standards/workflow/agents.md` prints 1, and `grep -c "#38, R1-1" agent-os/standards/testing/tests.md` prints 1.
- Item 5: `grep -c "#38, R1-3" agent-os/standards/workflow/agents.md` prints 1, and `grep -c "#38, R1-3" agent-os/standards/testing/tests.md` prints 1.
