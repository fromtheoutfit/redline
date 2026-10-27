# References for PR #46 review round 1

Every file below was opened while shaping. Line numbers are at the PR's head, at shaping time.

## The code the findings name

### `workflows/redline-loop.js`

- **Location:** `workflows/redline-loop.js`
- **Relevance:** all five findings live here.
- **Key places:**
  - `CARRY`, `carryList`, `trackedList` and `priorById`: 87, 101-103.
  - `findingLine`: 584-589. The `first reported as` suffix is at 587.
  - `reviewBody`: 593-625. The fresh and carried split is at 600-612. The Resolved and Already tracked sections are at 614-620.
  - `commentBody`: 627-640. The origin note is at 629-631, and it reads the round from the id when `priorById` has no entry (630). R1-5 reuses that.
  - `replyEntry`: 688-699. `priorReplyEntry`: 704-715. `carriedReplies`: 719-723 (R1-1).
  - `reviewPrompt`: 815-863. The two prior lists are at 845-851, and the known-finding sentence at 854 (R1-2).
  - `compactFinding` and `history`: 1385-1398. They pass `carriedFrom` to later reviewers (R1-1).
  - `review()`: 1470-1497. The id renaming is at 1482-1486. The else branch at 1492-1495 is R1-1.
  - `reconcilePrior`: 1499-1544. The counted carry is at 1517 (R1-2), and the fallback id at 1533 (R1-3).
  - `post`: 1546-1590. `commentIds` holds inline comments only (1585-1588).
  - `droppedReplies`, `resolvedReplies` and `replyStandalone`: 1673-1722. `keepReplyIds`: 1727-1736 (R1-4).
  - `revise`'s reply batch: 1985-1997.
  - `handoffComment`: 2007-2053. Earlier rounds are at 2036-2039.
  - `threadCandidates`: 2147-2191. The carried earlier threads are at 2171-2180, and the settle test at 2177 (R1-4).
  - `earlierRoundsLines`: 2195-2213. The tracked branch is at 2210 (R1-5).
  - `resolveThreadsPrompt`'s id rendering: 1219, 1226. `sweepThreads`: 2223-2268. `threadsLine`: 2270-2277.
  - The main loop: 2440-2546. `known` and `active` are at 2468-2469, and the paths that end with no revise pass at 2496-2500 and 2519-2523.

### `tests/loop-test.mjs`

- **Location:** `tests/loop-test.mjs`
- **Relevance:** every fix's red-first case lands here.
- **Key places:**
  - The mock: 33-147. Post is at 43-58, where inline ids are `100 + i` and `scenario.moved` puts findings in the body. Push and reply is at 62-69, with `reply_id` `200 + i` for a thread and 0 otherwise. Resolve threads is at 70-77, where only ids below 200 resolve. The reviewer, with `scenario.resolved`, is at 95-99.
  - `f`, `prior`, `baseArgs` and `go`: 149-178. `pick`, `comment`, `replies` and `replyFor`: 181-194.
  - Section 8b, the carry accounting: 479-524. Tasks 2 and 3 add their cases after "carry: none at round 1" (513-514).
  - Section 8c, the posted side: 527-571. Tasks 4 and 5 add their cases after "carry: correctness scope" (569-570). The Earlier rounds check is at 555, and the sweep ids check at 552.
- **Key patterns:** a scenario with `firstRound: 2` and `priorFindings`. Comment ids stay below 200 so the resolve mock treats them as roots.

## The contract the code answers to

- `agent-os/specs/2026-10-27-1345-35-carry-forward-undispositioned-findings/plan.md`:
  - decisions 1-13 (13-27); decision 10, "Only the run's first round carries", is at 24 (R1-1);
  - Task 3's fallback id `R<round>-<n+1>` (60, R1-3);
  - Task 4's sweep rule, "both replies posted" (70, R1-4).
- `agent-os/specs/2026-10-27-1345-35-carry-forward-undispositioned-findings/shape.md`, decisions 1-14 (15-31):
  - decision 3, the earlier thread's sweep ids (19);
  - decision 6, "Issues, teammate comments and human-review folders stay the reviewer's own free check, as today" (22, R1-2);
  - decision 7, "rather than dropped" (23, R1-2);
  - decision 9 (25, R1-1).
- `agents/redline-reviewer.md`: the known-finding steps (14-22), with open issues first (18) and Redline's own rounds third (20). The return block and the `knownAs` and `carriedFrom` sentence are at 42-66 (R1-2, R1-3).
- `agents/redline-github.md:23`: an issue comment reports `reply_id` 0 (R1-4).
- `scripts/redline-gh.sh`, `prior-findings` (314-358): `carried_from` is read only from finding lines (343), and a `carried forward as` reply alone classifies the earlier id as `carried` (337, 357). R1-2's option (B) relies on that and needs no change to the script.
- `tests/gh-test.sh:207-224` and `tests/gh-fixtures/comments-14.json`: PR 14. R1-5 is `carried` to R2-2 while its own thread holds only round 1's `not changed` reply (case 219, comment 1415). This is the shape R1-5's finding describes.
- `README.md`:
  - 117, the Earlier rounds paragraph, which Task 5 amends and option (B) would amend;
  - 158-164, Known limits, which option (C) would amend;
  - 306, the `prior-findings` row ("`carried` whenever a later round's line says `first reported as` this id, whatever its thread says").

## Similar earlier rounds

### PR #45 review round 1

- **Location:** `agent-os/specs/2026-10-27-1215-45-review-round-1/`
- **Relevance:** the previous Redline round on this repository, also on `workflows/redline-loop.js` and `tests/loop-test.mjs`.
- **Key patterns:**
  - red first through `checks.sh --baseline`, because the guard refuses `node` to the implementer;
  - each task names its unchanged neighbours;
  - the judgment call laid out with story, options with cost and effect, and a recommendation;
  - the retrospective items numbered with their target lines.

## The reviewer's reproduction

- `/tmp/redlinerepro/reviewer-r1-repro.mjs`: one node scenario per finding (`known`, `later`, `collide`, `moved`, `handoff`) on a copy of the loop-test mock. The guard refuses `node` to the shaper, so the scenarios were read, and each was traced through the code above. Tasks 2 to 5 adopt them as loop-test cases.
