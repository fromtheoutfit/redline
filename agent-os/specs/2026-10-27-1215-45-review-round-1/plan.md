# PR #45 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 found two correctness bugs and one nit. R1-1 and R1-3 are fixes (Tasks 2 and 3). R1-2 was returned to the person as a judgment call; the author chose (A), every comment must be Redline's (decided 2026-10-27 by @michaelfromtheoutfit), and it is fixed in Task 4. Nothing is deferred. Every commit message starts `redline: ` and references (#39), the PR's issue.

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-27-1215-45-review-round-1/plan.md`
- `agent-os/specs/2026-10-27-1215-45-review-round-1/shape.md`
- `agent-os/specs/2026-10-27-1215-45-review-round-1/standards.md`
- `agent-os/specs/2026-10-27-1215-45-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit or on their own, never with a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #45 (#39)`

## Task 2: R1-1 give the GitHub agent's return block one `skipped` key

Files: `agents/redline-github.md`

Today the JSON block under "What you return" (lines 45-64) holds `"skipped": "",` at line 50 and `"skipped": [{"id": 0, "reason": ""}],` at line 54. When a key repeats, the last one wins, so the contract reads as if `skipped` were always an array. Post-review (line 22) and `POST_SCHEMA` (`workflows/redline-loop.js:303`) still expect a string.

Change:
- Delete line 54 (`"skipped": [{"id": 0, "reason": ""}],`). Keep line 50 and line 53 (`"resolved": ...`) as they are.
- Line 66, "Fill only the fields the operation produced; leave the rest empty.", gains a second sentence: "`skipped` is the one field two operations fill with different types: post-review sets it to the string `already posted` when the round's review already exists, and resolve-threads sets it to the script's list as printed, `[{"id": <comment id>, "reason": "<reason>"}]`, or `[]` when nothing was skipped."
- No other line changes. The resolve-threads operation (line 24) already says "Set `resolved` and `skipped` from its JSON as printed".

Proof:
- `grep -c '"skipped"' agents/redline-github.md` prints `1` (it prints `2` today).
- `grep -n "two operations fill with different types" agents/redline-github.md` prints line 66.
- The gate's `validate` check passes.

Commit: `redline: R1-1 give the GitHub agent's return block one skipped key (#39)`

## Task 3: R1-3 leave a thread already resolved out of the handoff's left open list

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`

Today, in `sweepThreads` (`workflows/redline-loop.js` 2020-2063), a skip whose reason starts `already resolved` sets `c.reason = 'already resolved'` (2047-2049) and never `c.resolved`. `open = candidates.filter((c) => !c.resolved)` (2060) then lists it. `threadsLine` (2066-2073) prints it as `R1-2 (already resolved)` under "left open", and `result().threads.open` (1359) carries it.

Red first, in `tests/loop-test.mjs` section 11 (702-746). Directly after the "a teammate replied after Redline" case (723-724), add:

- `run = await go('threads: the author resolved one by hand', args, { ...scenario, threadsSkipped: { 101: 'already resolved' } })`
- `check('threads: a thread already resolved is neither resolved by the sweep nor left open', comment(run.calls, 'handoff comment').includes('\n\nResolved 2 threads; 0 left open.\n') && JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-3"],"open":[]}', [comment(run.calls, 'handoff comment'), run.res.threads])`
- In the section header comment (702-707), after "dropped and not-changed findings stay open;", add "a thread already resolved is in neither count;".

Run the gate (Task 6's command, or `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`). The `loop` check must print `N checks passed, 1 failed`, and the failure must be the new check (today's line reads `Resolved 2 threads; 1 left open: R1-2 (already resolved).`). The guard refuses `node` to the implementer, so the gate is how the harness runs.

Then, in `workflows/redline-loop.js` `sweepThreads`:

- In the skipped loop (2045-2053), when `c` exists and `s.reason` starts `already resolved`, set `c.alreadyResolved = true` and give it no reason. Otherwise set `c.reason` from the remaining chain: `last comment` becomes `a reply after Redline's`, `opened by` becomes `not Redline's thread`, anything else becomes `no thread`. The `already resolved` branch leaves the chain. A skipped id with no candidate keeps its warning as today.
- In the fallback (2054-2058), a settled candidate gets `not resolved` only when it is neither `resolved` nor `alreadyResolved`.
- `open` (2060) becomes `candidates.filter((c) => !c.resolved && !c.alreadyResolved)`. `resolved` stays the list of what the script resolved. `threadSweep` keeps its `{resolved, open}` shape.
- The docblock (2014-2019) gains: "A thread the script reports already resolved (resolved by hand before Finish) is in neither list: this sweep did not resolve it, and it is not open."
- `threadsLine` is unchanged. With every settled thread already resolved it prints `Resolved 0 threads; 0 left open.`

Unchanged neighbours, all still green:
- the settled-findings cases (713-721);
- the "a teammate replied after Redline" case (723-724), whose `last comment` reason still reads `a reply after Redline's` under left open;
- the dropped cases (726-730);
- the no-sweep loop (732-742);
- the failed sweep (744-745).

Proof: the gate's `loop` check prints `N checks passed, 0 failed`, one more than at baseline, after the red run above.

Commit: `redline: R1-3 leave a thread already resolved out of the handoff's left open list (#39)`

## Task 4: R1-2 keep a thread open when any comment in it is not Redline's

Files: `scripts/redline-gh.sh`, `tests/gh-fixtures/threads-13-page2.json`, `tests/gh-test.sh`, `workflows/redline-loop.js`, `tests/loop-test.mjs`, `agents/redline-github.md`, `README.md`

Decided 2026-10-27 by @michaelfromtheoutfit: (A) Every comment must be Redline's (Decisions in `shape.md`). Lands after Task 3, which rewrites the same reason mapping in `sweepThreads` (`workflows/redline-loop.js:2047`) and adds a case to the same loop-test section.

Today the jq plan in `resolve-threads` (`scripts/redline-gh.sh` 470-483) resolves an open thread when `.comments[0]` and `.comments[-1]` are in the list, so a thread [Redline, teammate, Redline] is resolved and the teammate's comment is folded away.

Red first:

- `tests/gh-fixtures/threads-13-page2.json`: add, as the last node of `reviewThreads.nodes`, `{"id": "PRRT_6", "isResolved": false, "path": "app/f.php", "line": 7, "comments": {"nodes": [{"databaseId": 1311, "author": {"login": "author"}}, {"databaseId": 1312, "author": {"login": "marcamos"}}, {"databaseId": 1313, "author": {"login": "author"}}]}}`. `threads` sorts by path, so it lands last and the index-based cases (`.[1]`, `.[3]`, `.[4]`, 236-237) keep their positions.
- `tests/gh-test.sh`:
  - The header comment (21-23): after "one already resolved, and one Redline thread with no reply yet", add ", and one where a teammate commented between Redline's comment and its reply (#45, R1-2)".
  - The `threads 13` id list (235) becomes `["PRRT_1","PRRT_2","PRRT_3","PRRT_4","PRRT_5","PRRT_6"]`.
  - After the "the reply id alone names its thread too" case (247), add `rm -f "$WORK/pages/resolved.log"`, then `is "resolve-threads: a thread with a teammate's comment between Redline's two is skipped with that comment's id" "$(gh resolve-threads 13 1311 1313 | jq -c '[.resolved, .skipped]')" '[[],[{"id":1311,"reason":"comment 1312 is not Redline'\''s"}]]'` and `is "resolve-threads: a comment between Redline's two means no mutation sent" "$([[ -e "$WORK/pages/resolved.log" ]] && echo yes || echo no)" "no"`.
- `tests/loop-test.mjs` section 11: after the "a teammate replied after Redline" case (723-724) and Task 3's new case, add `run = await go('threads: a teammate commented between Redline\'s two', args, { ...scenario, threadsSkipped: { 101: "comment 150 is not Redline's" } })` and `check('threads: a thread with a comment that is not Redline\'s stays open with that reason', comment(run.calls, 'handoff comment').includes('\n\nResolved 2 threads; 1 left open: R1-2 (a comment that is not Redline\'s).\n') && JSON.stringify(run.res.threads) === '{"resolved":["R1-1","R1-3"],"open":[{"id":"R1-2","reason":"a comment that is not Redline\'s"}]}', [comment(run.calls, 'handoff comment'), run.res.threads])`. In the section header comment (702-707), after Task 3's "a thread already resolved is in neither count;", add "a thread with a comment that is not Redline's anywhere in it stays open;".

Run the gate (Task 6's command, or `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`). The `gh` check must fail on exactly the two new cases (today `resolve-threads 13 1311 1313` prints `[[{"id":1311,"thread":"PRRT_6"}],[]]` and logs a mutation), and the `loop` check on exactly the new case (today the mapping turns `comment 150 ...` into `no thread`). The guard refuses `node` to the implementer, so the gate is how the harnesses run.

Then:

- `scripts/redline-gh.sh`:
  - The jq plan (470-483): `resolve` selects `(.resolved | not) and all(.comments[]; mine)`. `skipped` selects `.resolved or (all(.comments[]; mine) | not)`, with the reason chain, in this order: `already resolved`; `opened by comment <first id>, not Redline's` when `.comments[0]` is not mine; `last comment <last id> is not Redline's` when `.comments[-1]` is not mine; otherwise `comment <id> is not Redline's`, the id of the first comment that is not mine (`first(.comments[] | select(mine | not)).id`). `no thread holds comment <id>` stays last, as today. The existing reasons keep their wording, so the 239-245 case is unchanged.
  - The comment above the jq (467-469): "open, opened by one of the ids and last spoken in by one of the ids" becomes "open and every comment one of the ids".
  - The header (80-92): "A thread is resolved only when it is open and every comment in it is in the list, so a thread a teammate opened or commented in, wherever the comment sits, is never resolved whatever ids are given"; the reason list gains `"comment <id> is not Redline's"` before `"no thread holds comment <id>"`.
- `workflows/redline-loop.js`:
  - `sweepThreads`'s reason mapping (2047, as Task 3 left it): `/^comment /` maps to `a comment that is not Redline's`, ahead of the `no thread` fallback. `/^last comment/` keeps `a reply after Redline's`.
  - The prompt sentence in `resolveThreadsPrompt` (1156): "a thread a teammate opened, or replied in after Redline, is skipped with a reason" becomes "a thread a teammate opened or commented in is skipped with a reason".
  - The `threadCandidates` docblock (1987-1990): "so both ends of the thread are Redline's" becomes "so Redline's comment and its reply are both in the list".
  - The `sweepThreads` docblock (2014-2016): "the script skips any thread whose first or last comment is not one of the ids" becomes "the script skips any thread with a comment that is not one of the ids".
- `agents/redline-github.md` line 24: "resolves only a thread whose first and last comments are both in the list, so a thread a teammate opened, or replied in after Redline, is skipped with a reason" becomes "resolves only a thread every comment of which is in the list, so a thread a teammate opened or commented in is skipped with a reason".
- `README.md`:
  - Line 3: "never one a teammate opened or last spoke in" becomes "never one a teammate opened or commented in".
  - Line 115: "a thread a teammate opened, or replied in after Redline's reply, is theirs and stays open" becomes "a thread a teammate opened or commented in, before or after Redline's reply, is theirs and stays open".
  - Line 160: "**A thread a human opened, or last spoke in, is never resolved by Redline.**" becomes "**A thread a human opened or commented in is never resolved by Redline.**", and "neither is one with a hand-written reply after Redline's" becomes "neither is one with a hand-written comment anywhere in it".
  - Line 319: "a thread is resolved only when it is open and its first and its last comment are both in the list, so a thread a teammate opened or replied in last is never resolved whatever is given" becomes "a thread is resolved only when it is open and every comment in it is in the list, so a thread a teammate opened or commented in is never resolved whatever is given"; the reason list gains `comment <id> is not Redline's` before `no thread holds comment <id>`.
  - Line 326: "resolves nothing whose first or last comment is not one of them" becomes "resolves nothing with a comment that is not one of them".
  - Line 327: "the script skips whatever a teammate opened or last replied in" becomes "the script skips whatever a teammate opened or commented in".

Unchanged neighbours, all still green:
- the `resolve-threads 13 1301 ... 1399` case (239-245): no id names PRRT_6, every reason keeps its wording, one mutation for PRRT_1;
- the "a root given without its reply id" case (246), still `last comment 1302 is not Redline's`;
- the loop-test "a teammate replied after Redline" case, still `a reply after Redline's`, and Task 3's already-resolved case.

Proof:
- The gate's `gh` and `loop` checks pass after the red run above, each with the new cases counted.
- `grep -rn -e "last spoke in" -e "replied in after" -e "first and its last comment" -e "first and last comment" -e "first or last comment" -e "last replied in" -e "replied in last" README.md skills/ agents/ workflows/ scripts/` prints nothing. (`agent-os/standards/` is reworded through Task 5; the test names at `tests/gh-test.sh` 241-242 still describe their own threads truly and stay.)
- The gate's `syntax` and `validate` checks pass.

Commit: `redline: R1-2 keep a thread open when any comment in it is not Redline's (#39)`

## Task 5: Standards retrospective

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`

Items 1 to 3 under "Standards retrospective (proposed)" in `shape.md` are drafted from R1-1 and R1-3, and item 4 from R1-2's decision (A). Items 2 and 4 both edit line 25 of `workflow/agents.md`, in different clauses. Apply only the edits the standards approver approved, in one commit after the finding commits, keeping each file's headings. If none is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Commit (when edits are approved): `redline: record the round 1 review lessons in the standards (#39)`

## Task 6: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-27-1215-45-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Standards retrospective**: Task 5, from the proposed list in `shape.md`, as the standards approver approved it.
11. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.

## As built

Commits, in order:

- `64429fa` redline: save review round 1 spec for PR #45 (#39)
- `ab6d1f8` redline: R1-1 give the GitHub agent's return block one skipped key (#39)
- `8a57ef8` redline: R1-3 leave a thread already resolved out of the handoff's left open list (#39)
- `bec2673` redline: R1-2 keep a thread open when any comment in it is not Redline's (#39)
- `568d179` redline: record the round 1 review lessons in the standards, finishing R1-2 (#39)
- the As built commit that holds these notes

Red before green, through `checks.sh --baseline` (the guard refuses `node` and `claude` to the implementer):

- Task 3: `loop` read `286 checks passed, 1 failed`, the failure the new case with the line `Resolved 2 threads; 1 left open: R1-2 (already resolved).`; after the fix `287 checks passed, 0 failed`. The same run's `validate` passed with Task 2's change, which was committed after it.
- Task 4: `loop` read `288 checks passed, 1 failed` (the new case, reason mapped to `no thread`) and `gh` `93 passed, 2 failed` (exactly the two new cases); after the fix `289 checks passed, 0 failed` and `95 passed, 0 failed`.
- The full gate with the round's snapshot exits 0: nine checks at 0, no unexpected or uncommitted file.

Deviations from the plan:

- Task 2: the new `skipped` sentence sits at line 65 of `agents/redline-github.md`, not 66, because the deleted line 54 is above it. The text is as planned, and `grep -c '"skipped"'` prints `1`.
- Task 4: the `resolve-threads` header in `scripts/redline-gh.sh` is wrapped so its last line stays `mutation after the ones already sent, 2 on usage or a failed read`. The gh harness's case "usage: --help prints the writes section to its last line" pins that line; a first wrap moved it and the case went red, so the header was re-wrapped instead of changing that neighbouring case. The header's words are as planned.
- Task 5: the standards commit's message names R1-2 (`..., finishing R1-2 (#39)`), since option (A) in `shape.md` sends two standards lines of R1-2's fix through the retrospective and Task 4's proof leaves `agent-os/standards/` to Task 5. The R1-1 and R1-3 edits are lessons, so the message does not name those findings.

Noted, not changed: `agent-os/standards/workflow/replay.md` line 12 says the sweep asks GitHub "which threads are open, and who spoke last in them". Since R1-2 the script reads every comment's id. No approved edit covers that line, so it is left for a later retrospective.
