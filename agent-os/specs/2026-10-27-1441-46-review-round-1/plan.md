# PR #46 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 found four correctness bugs and one nit, all at the edges of the carry-forward accounting #35 added. R1-1, R1-3, R1-4 and R1-5 are fixes (Tasks 2 to 5), each red first through the gate. R1-2 went back to the person as a judgment call, and @michaelfromtheoutfit decided it on 2026-10-27: option (B), known by an issue, answered in its thread (Task 6, also red first). Nothing is deferred. Every commit message starts `redline: ` and references (#35), the issue the PR closes.

Every file named below is under `/Users/michaelwitwicki/Code/Claude/redline/`. The guard refuses `node` to the implementer, so the loop harness runs through the gate: `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline` for a red run, and Task 8's command for the round.

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-27-1441-46-review-round-1/plan.md`
- `agent-os/specs/2026-10-27-1441-46-review-round-1/shape.md`
- `agent-os/specs/2026-10-27-1441-46-review-round-1/standards.md`
- `agent-os/specs/2026-10-27-1441-46-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never in the same commit as a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #46 (#35)`

## Task 2: R1-1 clear carriedFrom on a review with no carry-forward list

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`

What happens today:
- `review()` (`workflows/redline-loop.js` 1470-1497) trims `carriedFrom` on every finding (1487).
- When the review is not the first round's `pr` review with prior findings, the else branch (1492-1495) resets `out.carried` and `out.resolved` but leaves each finding's `carriedFrom` alone.
- `reviewBody` (600-612), `commentBody` (629-631) and `carriedReplies` (719-723) all act on `f.carriedFrom` wherever it is set.
- `history()` (1389-1398) shows later reviewers each finding's `carriedFrom`, so a round-3 reviewer can copy R2-1's `R1-2`.

Red first. In `tests/loop-test.mjs` section 8b (479-524), directly after the "carry: none at round 1" case (513-514), add:

- `run = await go('carry: a re-review never carries', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2' })], [f('R3-1', 'correctness', { carriedFrom: 'R1-2' })], []], commitIds: [['R2-1'], ['R3-1']] })`
- `check('carry: a re-review\'s carriedFrom is cleared with a warning', run.res.rounds[1].findings[0].carriedFrom === '' && run.res.warnings.includes('round 3: the reviewer marked R3-1 as carried from R1-2, but this review has no carry-forward list; cleared'), [run.res.rounds[1].findings[0], run.res.warnings])`
- `check('carry: a re-review posts no carried heading and no origin note', !pick(run.calls, 'post r3').prompt.includes('### Carried forward') && !pick(run.calls, 'post r3').prompt.includes('irst reported as R1-2'), pick(run.calls, 'post r3').prompt.slice(0, 1500))`
- `check('carry: a re-review sends no reply to the earlier thread; the first round\'s reply stands', !replies(run.calls, 'push and reply r3').some((x) => x.finding === 'R1-2') && replyFor(run.calls, 'push and reply r2', 'R1-2').startsWith('Redline round 2: carried forward as R2-1; '), [replies(run.calls, 'push and reply r3'), replyFor(run.calls, 'push and reply r2', 'R1-2')])`
- A second pin on the same branch, through its other entry, a first round with no earlier findings: `run = await go('carry: no list at round 1', { ...baseArgs, priorFindings: [] }, { reviews: [[f('R1-1', 'nit', { carriedFrom: 'R0-1' })]], commitIds: [['R1-1']] })`, then `check('carry: a first round with no earlier findings clears a carriedFrom with a warning', run.res.rounds[0].findings[0].carriedFrom === '' && !pick(run.calls, 'post r1').prompt.includes('### Carried forward') && run.res.warnings.includes('round 1: the reviewer marked R1-1 as carried from R0-1, but this review has no carry-forward list; cleared'), [run.res.rounds[0].findings[0], run.res.warnings])`

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must print `N checks passed, 4 failed`, and the four failures must be the new checks. Today round 3's body carries the heading and the note, R1-2's thread gets a round-3 reply, and no warning is recorded.

Then, in `workflows/redline-loop.js` `review()`:
- In the else branch (1492-1495), before resetting `out.carried` and `out.resolved`, clear `carriedFrom` on every finding that has one. Push the warning `round ${round}: the reviewer marked ${f.id} as carried from ${f.carriedFrom}, but this review has no carry-forward list; cleared` before clearing it.
- Above the `if`, add a comment: only the run's first round carries, from the earlier rounds' list (#35, decision 9 of its spec), so any other review clears what a reviewer copied from the history (#46, R1-1).

Unchanged neighbours, all still green: the 8b first-round carry checks (501-506), the cleared-tracked-id check (509) and the 8c posted-side checks (540-570).

Proof: after the red run above, the gate's `loop` check prints `N checks passed, 0 failed`, with four more checks than at baseline.

Commit: `redline: R1-1 clear carriedFrom on a review with no carry-forward list (#35)`

## Task 3: R1-3 number the fallback carry after the highest id in use

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`

What happens today:
- `reconcilePrior` (`workflows/redline-loop.js` 1504-1544) names the fallback finding `R${round}-${out.findings.length + 1}` (1533).
- `review()` renames only ids without this round's prefix (1482-1486). So a gapped list such as `R2-1, R2-3` is kept as it is, and the fallback becomes a second `R2-3`.

Red first. In `tests/loop-test.mjs` section 8b, after Task 2's cases, add:

- `run = await go('carry: a gap in the reviewer\'s ids', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness'), f('R2-3', 'nit')], []], commitIds: [['R2-1', 'R2-3', 'R2-4']] })`
- `check('carry: the fallback carry is numbered after the highest id in use', run.res.rounds[0].findings.map((x) => x.id).join(',') === 'R2-1,R2-3,R2-4' && run.res.rounds[0].findings[2].carriedFrom === 'R1-2' && JSON.stringify(run.res.rounds[0].carried) === '{"R1-2":"R2-4"}', run.res.rounds[0].findings.map((x) => [x.id, x.carriedFrom]))`

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must fail on exactly the new check. Today the ids read `R2-1,R2-3,R2-3`.

Then, in `reconcilePrior`:
- Before the `for (const p of carryList)` loop (1529), add `let next = Math.max(0, ...out.findings.map((x) => Number(x.id.split('-')[1]) || 0))`. Every id has this round's prefix by then (`review()`, 1482-1486).
- Line 1533 becomes `const id = `R${round}-${++next}``.
- The docblock (1499-1503) gains: "A fallback id is numbered after the highest id in use, since the reviewer's ids may skip a number (#46, R1-3)."

Unchanged neighbour: the existing fallback check (503) still expects `R2-3` after `R2-1, R2-2`. The ids there are dense, so the highest plus one equals the count plus one.

Proof: after the red run, the gate's `loop` check prints `N checks passed, 0 failed`.

Commit: `redline: R1-3 number the fallback carry after the highest id in use (#35)`

## Task 4: R1-4 settle an earlier thread whose carrying finding sits in the review body

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`

What happens today:
- `threadCandidates` (`workflows/redline-loop.js` 2147-2191) counts an earlier thread as settled only when `replyIds[newId] > 0 && replyIds[priorId] > 0` (2177).
- A carried finding the post moved into the review body has no `commentIds` entry (1585-1588). Its reply is an issue comment that reports `reply_id` 0 (`agents/redline-github.md:23`), and `keepReplyIds` keeps only ids above 0 (1727-1736).
- So the earlier thread stays open with the reason `no reply posted`, although its reply was posted.

Red first. In `tests/loop-test.mjs` section 8c (527-571), after the "carry: correctness scope" case (569-570), add:

- `run = await go('carry: the carrying finding sits in the review body', carryArgs, { ...scenario, moved: ['R2-1'] })`
- `check('carry: an earlier thread is swept on its own reply when its carrying finding has no thread', ((pick(run.calls, 'resolve threads') || {}).prompt || '').includes('- R1-2 (round 1): comments 12, 203') && !run.res.threads.open.some((o) => o.id === 'R1-2') && comment(run.calls, 'handoff comment').includes('Resolved 4 threads; 0 left open.'), [run.res.threads, comment(run.calls, 'handoff comment')])`
- `check('carry: the body finding\'s reply is an issue comment and the earlier thread\'s stays a thread reply', replies(run.calls, 'push and reply r2').find((x) => x.finding === 'R2-1').route === 'issue-comment' && replies(run.calls, 'push and reply r2').find((x) => x.finding === 'R1-2').route === 'thread', replies(run.calls, 'push and reply r2').map((x) => `${x.finding}=${x.route}`))`

Here `carryArgs` and `scenario` are the 8c block's own (531-539). Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must fail on the first new check: today the handoff reads `Resolved 3 threads; 1 left open: R1-2 (no reply posted).`. The second check already passes and is the neighbour that must stay green. If the reply ids in the red output differ from `203`, use the id the run prints for R1-2's reply and record the change under As built.

Then, in `threadCandidates`:
- Line 2177 becomes `const settled = ['fixed', 'deferred', 'decided'].includes(kind) && replyIds[priorId] > 0 && (replyIds[newId] > 0 || !record.commentIds[newId])`.
- The comment above (2166-2169) gains: "A carrying finding in the review body has no thread, so its earlier thread settles on its own reply (#46, R1-4)."

Unchanged neighbours, all still green: the 8c sweep check (552), the dropped-carried check (559-561), and the section 11 thread-sweep checks.

Proof: after the red run, the gate's `loop` check prints `N checks passed, 0 failed`.

Commit: `redline: R1-4 settle an earlier thread whose carrying finding sits in the review body (#35)`

## Task 5: R1-5 name an earlier run's carry in the handoff's Earlier rounds

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `README.md`

What happens today:
- `earlierRoundsLines` (`workflows/redline-loop.js` 2195-2213) writes `already handled in round ${p.round}: ${p.reply ? p.reply.body : p.carried_to ? ... : p.disposition}` (2210) for an earlier finding this run did not carry or resolve, and prefers the reply text.
- A finding marked `carried` by a later round's `first reported as` line can still hold its own round's `not changed` reply. `tests/gh-test.sh:219` pins exactly that shape for R1-5 on fixture PR 14.
- So that finding's line reads `already handled in round 1: not changed in this round. ...`, which contradicts itself and hides R2-2.

Red first. In `tests/loop-test.mjs` section 8c, after Task 4's cases, add:

- `run = await go('carry: a finding an earlier run carried', { ...baseArgs, firstRound: 3, priorFindings: [prior('R1-5', 'carried', { comment_id: 15, carried_to: 'R2-2', reply: { id: 255, body: 'not changed in this round. Disposition fix; no commit names it. · decided by: redline' } }), prior('R2-2', 'none', { comment_id: 22, carried_from: 'R1-5' })] }, { reviews: [[f('R3-1', 'correctness', { carriedFrom: 'R2-2' })], []], commitIds: [['R3-1']] })`
- `check('carry: the handoff names an earlier run\'s carry by its new id, not the stale reply', comment(run.calls, 'handoff comment').includes('### Earlier rounds\n\n- **R1-5** title R1-5: carried forward as R2-2 in round 2\n- **R2-2** title R2-2: carried forward as R3-1: fixed in '), comment(run.calls, 'handoff comment'))`

The comment ids stay under the mock's `< 200` root rule (`tests/loop-test.mjs:72-77`). Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must fail on exactly the new check. Today the line reads `- **R1-5** title R1-5: already handled in round 1: not changed in this round. Disposition fix; no commit names it. · decided by: redline`.

Then:
- `workflows/redline-loop.js` `earlierRoundsLines`: the tracked branch (2210) checks the disposition first. When `p.disposition === 'carried' && p.carried_to`, write `carried forward as ${p.carried_to} in round ${n}`, where `n` is the number between `R` and `-` in `carried_to`, read as `commentBody` reads a `carriedFrom` (630). Otherwise keep `already handled in round ${p.round}: ${p.reply ? p.reply.body : p.disposition}`. The `p.carried_to` fallback inside that branch is no longer reachable, so it goes.
- `README.md`, the Earlier rounds paragraph (line 117): "`carried forward as R2-1: fixed in ...`, `resolved: ...`, or `already handled in round 1: ...` (#35)" becomes "`carried forward as R2-1: fixed in ...`, `resolved: ...`, `carried forward as R2-2 in round 2` for a finding an earlier run already carried (#46, R1-5), or `already handled in round 1: ...` (#35)".

Unchanged neighbour: the 8c Earlier rounds check (555). Its tracked findings are `fixed` and `dropped`, so they still read `already handled in round 1: <reply>`.

Proof: after the red run, the gate's `loop` check prints `N checks passed, 0 failed`. `grep -n "carried forward as R2-2 in round 2" README.md` prints line 117.

Commit: `redline: R1-5 name an earlier run's carry in the handoff's Earlier rounds (#35)`

## Task 6: R1-2 carry a finding known by a Redline id; answer the earlier thread of one an issue tracks

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `agents/redline-reviewer.md`, `README.md`

Decided on 2026-10-27 by @michaelfromtheoutfit: option (B), known by an issue, answered in its thread (`shape.md`, Decisions, which has the notes; the story and the options are under Judgment calls there).
- A `knownAs` that names a Redline id on a finding counted as carried is cleared, so the finding is carried.
- A `knownAs` that names an issue or a teammate's comment keeps the finding known, and its earlier thread is answered `carried forward as R2-1; already tracked in #41`.

This task lands after Tasks 3 to 5, which change the same functions (`reconcilePrior`, `threadCandidates`, `earlierRoundsLines`) and the same loop-test section. Line numbers below are from the round's start, and Tasks 2 to 5 shift them.

What happens today:
- `reconcilePrior` (`workflows/redline-loop.js` 1507-1518) counts a finding with a valid `carriedFrom` as carrying that id and never reads `knownAs`.
- The main loop then removes every finding with a `knownAs` from `active` (2468-2469). R2-1 (`carriedFrom: 'R1-2'`, `knownAs: 'R1-2'` or `'#41'`) is listed only under `### Already tracked` (619), with no inline comment, no shaping and no reply in R1-2's thread.
- The handoff says `carried forward as R2-1`, and the sweep leaves R1-2 open as `not settled`.
- The next run's `prior-findings` reads R1-2 as `none` again, so it is carried again, every run.

Red first. In `tests/loop-test.mjs` section 8c, after Task 5's cases, add three runs.

About `postDrop` in each run: it scripts what the real GitHub agent returns for a known finding, which is no inline thread, because `post()` sends only the active findings as comments (`workflows/redline-loop.js:1551`). Without it, the mock (`tests/loop-test.mjs:53-57`) takes every `**R…**` in the prompt, the Already tracked line included, and invents a thread the real run never has (`testing/tests`: a mock answers as the real agent would).

1. The reviewer's regression scenario (a Redline id), beside the neighbour that must not change (a fresh finding matched to a tracked Redline finding stays known):
   - `run = await go('carry: carried and known by a Redline id', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-1', 'fixed', { comment_id: 11, reply: { id: 250, body: 'fixed in 1234567 (redline: R1-1 x). · decided by: redline' } }), prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: 'R1-2' }), f('R2-2', 'nit', { knownAs: 'R1-1: fixed' })], []], postDrop: ['R2-2'], commitIds: [['R2-1']] })`
   - `check('carry: a carried finding\'s known mark naming a Redline id is cleared with a warning', run.res.rounds[0].findings[0].knownAs === '' && run.res.warnings.includes('round 2: the reviewer marked R2-1 as carried from R1-2 and as known by "R1-2", which names a Redline finding; knownAs cleared, so it is carried'), [run.res.rounds[0].findings[0], run.res.warnings])`
   - `check('carry: that finding is posted, shaped and answered as carried', pick(run.calls, 'post r2').prompt.includes('### Carried forward from earlier rounds (1 correctness, 0 nit)\\n\\n- **R2-1** · correctness') && ((pick(run.calls, 'shape r2') || {}).prompt || '').includes('"carriedFrom": "R1-2"') && replyFor(run.calls, 'push and reply r2', 'R1-2').startsWith('Redline round 2: carried forward as R2-1; fixed in '), [labels(run.calls), replies(run.calls, 'push and reply r2')])`
   - Neighbour: `check('carry: a fresh finding matched to a tracked Redline finding stays known, with no reply', run.res.rounds[0].findings[1].knownAs === 'R1-1: fixed' && pick(run.calls, 'post r2').prompt.includes('\\n- **R2-2** title R2-2: R1-1: fixed') && !replies(run.calls, 'push and reply r2').some((x) => x.finding === 'R1-1'), [run.res.rounds[0].findings[1], replies(run.calls, 'push and reply r2')])`
2. The issue rule, on a round with no revise pass (`replyStandalone()`):
   - `run = await go('carry: carried and known by an issue', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: '#41' })]], postDrop: ['R2-1'] })`
   - `check('carry: a carried finding known by an issue stays known, listed with its origin, and is not shaped', run.res.rounds[0].findings[0].knownAs === '#41' && JSON.stringify(run.res.rounds[0].carried) === '{"R1-2":"R2-1"}' && pick(run.calls, 'post r2').prompt.includes('### Already tracked\\n\\n- **R2-1** title R2-1: #41 · first reported as R1-2') && !pick(run.calls, 'shape r2'), [run.res.rounds[0], labels(run.calls)])`
   - `check('carry: its earlier thread is told it is carried and already tracked, with no revise pass', labels(run.calls).join('|') === 'gather r2|review r2|post r2|push and reply r2|PR description|handoff comment|record files|record commit' && replies(run.calls, 'push and reply r2').length === 1 && replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline' && replies(run.calls, 'push and reply r2')[0].route === 'thread' && replies(run.calls, 'push and reply r2')[0].comment_id === 12, [labels(run.calls), replies(run.calls, 'push and reply r2')])`
   - `check('carry: that thread stays open as already tracked, and the handoff names the issue', run.res.threads.open.some((o) => o.id === 'R1-2' && o.reason === 'already tracked') && comment(run.calls, 'handoff comment').includes('Resolved 0 threads; 1 left open: R1-2 (already tracked).') && comment(run.calls, 'handoff comment').includes('- **R1-2** title R1-2: carried forward as R2-1: already tracked in #41'), [run.res.threads, comment(run.calls, 'handoff comment')])`
3. The same reply from the second call site, `revise()`'s batch (`testing/tests` line 9), beside a carried finding that is fixed:
   - `run = await go('carry: carried and known by an issue, beside a fix', { ...baseArgs, firstRound: 2, priorFindings: [prior('R1-2', 'none', { comment_id: 12 }), prior('R1-3', 'none', { comment_id: 13 })] }, { reviews: [[f('R2-1', 'correctness', { carriedFrom: 'R1-2', knownAs: '#41' }), f('R2-2', 'correctness', { carriedFrom: 'R1-3' })], []], postDrop: ['R2-1'], commitIds: [['R2-2']] })`
   - `check('carry: the revise pass answers the issue-tracked carry once, beside the fixed carry', replies(run.calls, 'push and reply r2').filter((x) => x.finding === 'R1-2').length === 1 && replyFor(run.calls, 'push and reply r2', 'R1-2') === 'Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline' && replyFor(run.calls, 'push and reply r2', 'R1-3').startsWith('Redline round 2: carried forward as R2-2; fixed in ') && !('R2-1' in (run.res.rounds[0].outcomes || {})) && !pick(run.calls, 'push and reply r3'), replies(run.calls, 'push and reply r2'))`

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must print `N checks passed, 6 failed`, and the six failures must be the new checks other than the neighbour. Today:
- R2-1 keeps `knownAs: 'R1-2'`, so it is set aside with no shaping and no reply.
- The issue-tracked R2-1 is listed with no origin, and R1-2's thread gets no reply in either run.
- The sweep leaves R1-2 open as `not settled`.

The neighbour already passes and must stay green. If the mock's shaper or reply ids differ from what these checks expect, keep each check's rule, use what the run prints, and record the change under As built.

Then, in `workflows/redline-loop.js`:
- **`reconcilePrior`** (1504-1544). In the first loop, directly after `carried[f.carriedFrom] = f.id` (1517), clear a Redline id from a counted carry's `knownAs`:
  - When `/\bR\d+-\d+\b/.test(f.knownAs || '')`, push `round ${round}: the reviewer marked ${f.id} as carried from ${f.carriedFrom} and as known by ${JSON.stringify(f.knownAs)}, which names a Redline finding; knownAs cleared, so it is carried`, then set `f.knownAs = ''`.
  - A `knownAs` naming an issue or a comment (`#41`, `review comment 1234567890`) is left alone.
  - The docblock (1499-1503) gains: "A carried finding is never known by a Redline id, so a knownAs naming one is cleared; one naming an issue or a teammate's comment stays, and the finding's earlier thread is answered as already tracked (#46, R1-2)."
- **`reviewBody`**, the Already tracked line (619): append `${f.carriedFrom ? ` · first reported as ${f.carriedFrom}` : ''}` after `${f.knownAs}`. `prior-findings` never reads this line as a finding, because its regex wants ` · ` straight after the id (`scripts/redline-gh.sh:330`), so the suffix is for the reader.
- **A new `knownCarriedReplies(record)`**, directly after `resolvedReplies` (1693-1703):
  - It runs once per record, through a `record.knownCarriedRecorded` flag set when it returns entries, as `droppedReplies` and `resolvedReplies` do.
  - For each `f` in `record.findings` with `f.knownAs && f.carriedFrom && priorById[f.carriedFrom]`, it returns `priorReplyEntry(pass, priorById[f.carriedFrom], `carried forward as ${f.id}; already tracked in ${f.knownAs}${decidedBy(REDLINE)}`, record.reviewPosted)`.
  - Its comment: "The earlier findings this round carried that an issue or a teammate's comment already tracks (#46, R1-2): the finding stays known and is not shaped, and its earlier thread hears once where it went, so the next run reads it as carried."
  - A carried nit the correctness scope drops is not in `record.findings`, so it still gets no reply.
- **Both call sites** take it:
  - `revise()`'s reply batch (1987) becomes `.concat(carriedReplies(pass, record, inScope, outcomes), droppedReplies(record), resolvedReplies(record), knownCarriedReplies(record))`.
  - `replyStandalone()` (1708) becomes `droppedReplies(record).concat(resolvedReplies(record), knownCarriedReplies(record))`.
  - The comment above `replyStandalone()` (1705-1706) gains "and a carried finding an issue tracks" after "the resolved earlier findings".
- **`threadCandidates`**, the carried loop (2171-2180):
  - Look up `const carrier = record.findings.find((f) => f.id === newId)`. The loop has already checked `ids.has(newId)`.
  - The reason becomes `settled ? '' : carrier.knownAs ? 'already tracked' : dropped.has(newId) ? ...`, with the rest unchanged.
  - The settled test stays as Task 4 left it. A known finding has no outcome kind, so it is never settled, and its thread stays open.
  - The comment above (2166-2169) gains: "A carried finding an issue or a teammate's comment tracks has no outcome: its earlier thread is answered but left open as already tracked (#46, R1-2)."
- **`earlierRoundsLines`** (2195-2213): in the `ids.has(newId)` branch, before the `record.outcomes` lookup, write `carried forward as ${newId}: already tracked in ${carrier.knownAs}` when the finding carrying it (`record.findings.find((f) => f.id === newId)`) has a `knownAs`.

`scripts/redline-gh.sh` does not change. The reply opens `carried forward as R2-1`, which `prior-findings` classifies as `carried` (`scripts/redline-gh.sh:337`) and reads R2-1 from as `carried_to` (`:357`), so the next run does not raise R1-2 again.

Then the docs:
- **`agents/redline-reviewer.md`**, line 66. After the `carriedFrom` sentence, add: "On a carried finding, `knownAs` names only an issue or a teammate's comment that already tracks it (`#41`), never a Redline id: the workflow clears a Redline id there with a warning and carries the finding, and answers the earlier thread of one an issue tracks with `carried forward as R2-1; already tracked in #41`."
- **`README.md`**, the Earlier rounds paragraph (line 117).
  - After "A finding with a disposition is matched into `knownAs` (`R1-1: fixed`) and never re-raised.", insert: "A carried finding that an issue or a teammate's comment already tracks keeps the author's choice. It stays under `### Already tracked` with `first reported as R1-2` on its line and is not shaped. Its earlier thread gets `Redline round 2: carried forward as R2-1; already tracked in #41 · decided by: redline` and stays open as `already tracked`, and the next run reads that reply as carried. A `knownAs` naming a Redline id on a carried finding is cleared with a warning, and the finding is carried (#46, R1-2)."
  - The handoff forms list, as Task 5 left it, gains "`carried forward as R2-1: already tracked in #41` for a carried finding an issue tracks (#46, R1-2)" before "or `already handled in round 1: ...` (#35)".

Unchanged neighbours, all still green:
- the neighbour check in run 1 above;
- the 8c carried-forward reply and sweep checks (547-552) and the dropped-carried checks (560-562);
- the correctness-scope check (570): a carried nit out of scope gets no reply;
- Task 4's and Task 5's cases;
- `tests/gh-test.sh`, since `scripts/redline-gh.sh` does not change.

Proof: after the red run, the gate's `loop` check prints `N checks passed, 0 failed`, with seven more checks than after Task 5. `grep -n "already tracked in #41" README.md agents/redline-reviewer.md` prints `README.md:117` and `agents/redline-reviewer.md:66`.

Commit: `redline: R1-2 carry a finding known by a Redline id; answer one an issue tracks in its earlier thread (#35)`

## Task 7: Standards retrospective

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`

Items 1 to 3 under "Standards retrospective (proposed)" in `shape.md` come from R1-1, R1-3, R1-4 and R1-5. Item 4 (two edits, one per file) comes from R1-2's decision, option (B), and appends after items 1 and 3 where those are approved. Apply only the edits the standards approver approved, in one commit after the finding commits, keeping each file's headings. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when edits are approved): `redline: record the round 1 review lessons in the standards (#35)`

## Task 8: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-27-1441-46-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Standards retrospective**: Task 7, from the proposed list in `shape.md`, as the standards approver approved it.
11. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.

## As built

Every task landed as planned, one commit each, and every fix went red through `checks.sh --baseline` before it went green. No task was blocked, and no file outside the plan changed.

- **Task 1**, `ca4b789`: the four spec files. `redline/` stays with the workflow.
- **Task 2 (R1-1)**, `b08affc`. Red: `336 checks passed, 4 failed`, the four new checks. Green: `340 checks passed, 0 failed`.
- **Task 3 (R1-3)**, `40f80ce`. Red: `341 checks passed, 1 failed`, with the ids reading `R2-1,R2-3,R2-3`. Green: `342 checks passed, 0 failed`. The existing fallback check (`R2-3` after `R2-1, R2-2`) stayed green.
- **Task 4 (R1-4)**, `361496c`. Red: `344 checks passed, 1 failed`, the handoff reading `Resolved 3 threads; 1 left open: R1-2 (no reply posted).`. The route neighbour check was green before and after, and R1-2's reply id was `203`, as planned. Green: `345 checks passed, 0 failed`.
- **Task 5 (R1-5)**, `073dbff`. Red: `346 checks passed, 1 failed`, the line reading `- **R1-5** title R1-5: already handled in round 1: not changed in this round. ...`. Green: `347 checks passed, 0 failed`. `README.md:117` carries the new form.
- **Task 6 (R1-2)**, `d9048d5`, option (B). Red: `351 checks passed, 6 failed`, the six new checks other than the neighbour, which was green before and after. Green: `357 checks passed, 0 failed`. `already tracked in #41` is at `README.md:117` and `agents/redline-reviewer.md:66`.
- **Task 7**, `0c30331`: all five approved edits, three to `workflow/agents.md` (two appended to the #35 bullet and one new bullet after it) and two to `testing/tests.md` line 6. Headings unchanged. Every edit is a lesson, so the message names no finding.

Notes, none of them a deviation:

- **Check counts.** `go()` adds a run-record check to every run that finishes, as the plan approver noted. So Task 2 added 6 checks (4 plus 2), Task 3 added 2, Task 4 added 3, Task 5 added 2, and Task 6 added 10 (7 plus 3), from 334 at the round's start to 357.
- **Comments.** Each new loop-test case has a one-line comment naming its finding. `earlierRoundsLines` has a two-line comment on the new carried branch (#46, R1-5). Neither changes what the plan built.
- **Wording.** The comment above `replyStandalone()` reads "the drops, the resolved earlier findings and a carried finding an issue tracks still get their replies". A comma replaces the first "and", so the list does not read "and ... and".
