# PR #45 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #45 (issue #39, "Resolve the threads Redline opened once their findings are settled; never a human's"). The round's three findings, nothing more:

- **R1-1** (nit, low, confirmed): the GitHub agent's return block in `agents/redline-github.md` repeats the `skipped` key with two types (line 50 a string, line 54 an array). **Fix.**
- **R1-2** (correctness, medium, confirmed, needs a decision): `resolve-threads` resolves a thread whose first and last comments are Redline's even when a teammate's comment sits between them (`scripts/redline-gh.sh:476`). Returned as a **judgment call**; the author chose (A), every comment must be Redline's. **Fix.**
- **R1-3** (correctness, low, confirmed): a thread the script skips as `already resolved` is listed under "left open" in the handoff line and in `result().threads.open` (`workflows/redline-loop.js:2047`, `2060`). **Fix.**

## Unattended answers

- **Scope.** The three findings in the invoking prompt. Evidence: the prompt's findings JSON; `redline/round-1-findings.json` and `redline/round-1-review.json` in this folder.
- **Visuals.** None. The change is a wrapper script, the workflow script, an agent file, their harnesses and prose; GitHub's thread view is the only screen.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** `agent-os/product/mission.md`: "nothing an agent does is hidden from the review thread" (Problem) and "**Decisions stay with people.**" (Solution). Both bear on R1-2's options and on R1-3's line; neither settles R1-2's question on its own.
- **Standards.** `workflow/agents` (the #39 sweep bullet at line 25; an agent's JSON contract; judgment calls returned, never decided; an owner on every decision; a message says when it fires in the words of the decision behind it, line 13), `testing/tests` (the loop-test sweep scenario, line 6; the gh harness's thread fixture, line 13; a tested surface gains a case; red before green), `scripts/bash-conventions` (a change to what a subcommand selects rewords every description of it; the GraphQL line), `workflow/replay` (the sweep sits after every stopping point, line 12), `prompts/attribution`, `process/standards-retrospective`, `process/internal-notes`.
- **Already known?** `scripts/redline-gh.sh issues-search "resolve threads"` and `issues-search "redline-github skipped"` return #39 (the issue this PR closes), #17 and #10, none of which covers these findings; `issues-search "already resolved"` returns nothing. `redline-gh.sh pr-comments 45` shows only this round's review. `git ls-tree -d --name-only origin/feature/39-resolve-the-threads-redline-opened-once-their-findings-are-settled-never-a-humans agent-os/specs/` holds no earlier `-45-` review-round folder. All three findings are new.
- **Reproductions.** The reviewer wrote none (`/tmp/redlinerepro/` does not exist). The shaper wrote none: the three findings are settled by reading. The jq plan in `resolve-threads` (lines 470-483) checks `.comments[0]` and `.comments[-1]` only, and the loop's mapping (2045-2060) is a straight read.
- **R1-1: is it real?** Yes. `agents/redline-github.md` line 50 is `"skipped": "",` (post-review's `already posted`, line 22) and line 54 is `"skipped": [{"id": 0, "reason": ""}],`, added by this PR (`git diff main...HEAD -- agents/redline-github.md`). `POST_SCHEMA.skipped` is a string (`workflows/redline-loop.js:303`) and `SWEEP_SCHEMA.skipped` an array (`543`), so each call's schema is right and only the agent's own contract contradicts itself. No harness reads the agent file.
- **R1-3: is it real?** Yes. In `sweepThreads`, a skip whose reason starts `already resolved` sets `c.reason = 'already resolved'` (2047-2049) and never `c.resolved`; `open = candidates.filter((c) => !c.resolved)` (2060) then lists it, and `threadsLine` (2066-2073) prints it under "left open". `result().threads` is `threadSweep` (1359), so the skill's `done` report repeats it (`skills/redline/SKILL.md:204`). The loop-test mock already returns any `threadsSkipped` reason (`tests/loop-test.mjs:70-77`), so the case is one scenario away.
- **R1-3: what does "left open" mean, and what does "Resolved n" count?** Answered from the PR and the code, not escalated:
  - The PR description: "the handoff comment, which gains one line: `Resolved n threads; m left open: <finding ids and why>`". A thread the author already resolved is not open.
  - The original spec's Decisions (`agent-os/specs/2026-10-27-1150-39-resolve-redline-threads/shape.md:15`): "The handoff line reports the wrapper's real result."
  - The wrapper's header (`scripts/redline-gh.sh:86-88`): one mutation per thread, and `resolved` lists the threads it resolved. An already resolved thread gets no mutation.
  - `sweepThreads`'s docblock (2018-2019): "{resolved: [ids], open: [{id, reason}]}".
  - So a thread already resolved when the sweep runs belongs in neither list: this sweep did not resolve it, and it is not open. The code disagrees with that by listing it as open, and that disagreement is the fix. The original plan's Task 4 item 4 listed `already resolved` among the reasons the line renders, which is the same disagreement, and the fix retires that rendering.
- **R1-2: does the question arise?** Yes.
  - Redline posts the finding's inline comment at Post and its reply at Push and reply, after Shape, Implement and Check (`workflows/redline-loop.js:1562-1571`). The review, plan and decisions dials can stop the run in between.
  - The GitHub agent's reply operation checks only for an earlier Redline reply, not for anyone else's comment (`agents/redline-github.md:23`), and no step of a Redline round reads a teammate's reply in a Redline thread. So a teammate's comment, or the author's own hand comment (same login, a different id), can sit between Redline's two comments, unanswered.
  - The jq plan resolves such a thread (`scripts/redline-gh.sh:476`), and no fixture thread has that shape (`tests/gh-fixtures/threads-13-page1.json`, `threads-13-page2.json`), so nothing pins it either way.
- **R1-2: does the PR, the spec or the docblock settle it?** No. They define the rule's mechanics and the code matches them:
  - The PR description: "resolves a thread only when it is open and its first and its last comment are both in the list. A thread a teammate opened, or replied in after Redline, is skipped with a reason".
  - The original shape.md, line 14: "**One id list, both ends must be Redline's** (asked 2026-10-27; chosen over "last comment only" and over two lists in a file)".
  - The README's Known limits (`README.md:160`): "A thread a human opened, or last spoke in, is never resolved by Redline."
  - None of these weighs a comment between Redline's two. The PR's guarantee ("never a human's") and the mission's "Decisions stay with people" point the other way. Changing the both-ends rule changes an assumption the original spec made, and a past spec's decision does not settle a question it did not consider. It goes to the person.

## Decisions

- **R1-1: one `skipped` key in the GitHub agent's return block.** Fix. Keep line 50 (`"skipped": ""`), delete line 54, and add one sentence under the block saying what each operation puts in `skipped`: post-review the string `already posted`, resolve-threads the script's `[{id, reason}]` list as printed. One file, about three lines, in the PR's diff. `plan.md` Task 2.
  Decided by: redline

- **R1-3: a thread already resolved is in neither count.** Fix. In `sweepThreads`, an `already resolved` skip marks the candidate as already resolved instead of giving it a reason. It is left out of `open` and is not added to `resolved`, since the line reports what this sweep resolved and what is still open (Unattended answers above). The handoff line keeps the wording the PR states. The reviewer's optional `; k already resolved` clause is not added, because it would change that stated wording. When every settled thread was already resolved, the line reads `Resolved 0 threads; 0 left open.`, which is true. The `result().threads` shape stays `{resolved, open}`. `plan.md` Task 3, with a loop-test case seen red first.
  Decided by: redline

- **Task order.** R1-3's change (Task 3) lands before anything R1-2's decision brings, because R1-2's option (A) edits the same reason mapping in `sweepThreads` (`workflows/redline-loop.js:2047`) and the same loop-test section.
  Decided by: redline

- **R1-2: should a thread with a comment that is not Redline's anywhere in it stay open?** Decided 2026-10-27: **(A) Every comment must be Redline's.** The author chose to keep a thread open whenever any comment in it is not Redline's, because a teammate's comment anywhere in the thread is a human's and folding it away would break the promise that Redline never resolves a human's thread. `plan.md` Task 4, after Task 3. The story, the options and the recommendation the author saw are under Judgment calls below.
  Decided by: @michaelfromtheoutfit

- **As built deviations.** Three small ones, listed in `plan.md` under As built. The `resolve-threads` header is wrapped so the line the gh harness's `--help` case pins stays last. The standards commit names R1-2, whose fix sends two standards lines through the retrospective. The R1-1 sentence sits one line higher than the plan's line number. None changes behaviour or scope.
  Decided by: redline

### Judgment calls

- **R1-2: should a thread with a comment that is not Redline's anywhere in it stay open?**
  - **Story.** Redline posts its round 1 review in the morning, then stops at the plan dial while the author is in meetings. A teammate opens the PR, sees Redline's comment on a function, and replies in that thread: "This is intended, please don't change it." The author comes back and approves the plan. Redline commits the fix and posts its reply under the teammate's comment, "Fixed in abc1234", which does not answer the objection. At Finish the sweep resolves the thread, because its first and its last comments are Redline's. GitHub collapses resolved threads, so the objection is folded away, and the handoff comment counts the thread as resolved. The PR promises Redline never resolves a human's thread, and this one has a human's comment in it.
  - **Why it goes to the person.** A spec assumption. The original spec chose "both ends must be Redline's" over two other rules, and the README's Known limits promise only that a thread a human opened or last spoke in stays open. A comment between Redline's two was never weighed.
  - **Options:**
    - **(A) Every comment must be Redline's.**
      - Cost: about 40 lines, all in files the PR already changes.
        - `scripts/redline-gh.sh`: the jq plan resolves an open thread only when every comment is in the list. The four skip reasons stay, plus one more, `comment <id> is not Redline's`, for the first foreign comment between two of Redline's. The header documents it.
        - `tests/gh-fixtures/threads-13-page2.json` gains the thread [1311 Redline, 1312 teammate, 1313 Redline]; `tests/gh-test.sh` gets a case where `resolve-threads 13 1311 1313` skips it and logs no mutation.
        - `workflows/redline-loop.js`: the reason maps to `a comment that is not Redline's`, and the prompt sentence and docblocks follow. `tests/loop-test.mjs` gets one case.
        - The wording in `agents/redline-github.md:24` and `README.md` (lines 3, 115, 160, 319, 326, 327), and two standards lines through the retrospective.
      - Effect: a thread anyone else commented in, wherever the comment sits, stays open. The handoff line lists it as `R1-2 (a comment that is not Redline's)`. "Never a human's" then holds as written.
    - **(B) Keep both ends; pin it and say so.**
      - Cost: about 10 lines.
        - The same fixture thread, with a `tests/gh-test.sh` case pinning that `resolve-threads 13 1311 1313` resolves it.
        - The Known limits line (`README.md:160`) and the handoff paragraph (`README.md:115`) say that a comment left between Redline's comment and its reply is resolved with the thread.
        - Two standards lines through the retrospective.
      - Effect: the behaviour stays and is now tested and documented. A teammate's comment in the middle is still folded away by the sweep (expanding the thread or unresolving it shows it again).
    - **(C) Accept as built.**
      - Cost: none. The reply says the both-ends rule is the chosen one.
      - Effect: the case stays untested, and the README's Known limits stays narrower than what the sweep does.
  - **Shaper's recommendation: (A).** The case is reachable whenever a dial stop gives a teammate time to comment. When it fires, it hides a person's comment in the thread the run reports on, which is what the PR and the mission say Redline never does. The full fix costs little and stays inside files the PR already changes.

## Deferred

None.

## Proportionality

- **R1-1.** A nit. Likelihood: the contract is read on every call of the GitHub agent, and a careful reader of the agent file sees `skipped` typed as an array. Impact: none at run time, since each call's schema enforces the right type. Cost: one file in the PR's diff, about three lines, no harness change. Proportionate: fix.
- **R1-3.**
  - Likelihood: reachable whenever the author resolves one of Redline's threads by hand before Finish, the habit #39 replaces. A stop at the review, plan or decisions dial gives them that window, and so does a re-run of the sweep after a partial one (the wrapper exits 1 after the mutations it already sent). Not observed yet.
  - Impact: the handoff comment on GitHub and the `done` report say a resolved thread is left open, and the teammate goes looking for an open thread that is not there. No data is lost.
  - Cost: about six lines in `workflows/redline-loop.js` and one case in `tests/loop-test.mjs`, both in the PR's diff. No new dependency, service or abstraction. Proportionate: fix.
- **R1-2** (recorded for the options, not to choose one).
  - Likelihood: needs a comment by someone other than Redline in a Redline thread between Post and Push and reply of the same round. That is more likely when the run stops at a dial. Not observed.
  - Impact: a human comment Redline never answered is folded under a resolved thread, and the handoff line counts the thread as resolved.
  - Cost: (A) about 40 lines across files the PR already changes; (B) about 10; (C) none. No option adds a dependency, a service or an abstraction, and none is out of proportion. What decides it is the original spec's assumption, which is why it goes to the person.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "nothing an agent does is hidden from the review thread" and "Decisions stay with people": R1-3 keeps the handoff line truthful; R1-2's options are weighed against both.

## Standards Applied

- workflow/agents — line 25, the #39 sweep (the workflow picks, the agent calls; both ends; a skipped thread is a result; the handoff line). Line 13: a message says when it fires in the words of the decision behind it, which R1-3 restores for "left open". Line 7: roles return JSON the workflow reads by field, which R1-1's contract describes. Also: judgment calls are returned, never decided (R1-2), and every decision names its owner.
- testing/tests — line 6, the loop-test thread-sweep scenario, gains R1-3's case. Line 13, the gh harness's PR 13 fixture, gains a thread under either of R1-2's (A) or (B). A tested surface gains a case in the same commit, beside a neighbour that must not change; a bug fix lands red before green.
- scripts/bash-conventions — a change to what a subcommand selects or prints rewords every description of it in `README.md`, `skills/` and `agents/` (R1-2 (A)); `jq` builds every JSON value.
- workflow/replay — the sweep sits after every stopping point (line 12), so R1-3's handoff text and R1-2's (A) prompt sentence change nothing a relaunch replays.
- prompts/attribution — the commit messages in `plan.md` and this folder carry Redline's name only.
- process/standards-retrospective — gate step 10, proposed below.
- process/internal-notes — this folder cites no private note and carries no private detail.

## Standards retrospective (proposed)

1. **R1-1**, `agent-os/standards/workflow/agents.md`, a new bullet after line 7 (the bullet "The reviewer, the shaper, both approvers and the checker return JSON, not prose ..."):
   "- An agent file's return block is one JSON object with each key once. A key two operations fill with different types (the GitHub agent's `skipped`: post-review's `already posted` string, resolve-threads' `[{id, reason}]` list) appears once, and a sentence under the block says what each operation puts there. Each call's schema in the workflow carries the type that call accepts (#45, R1-1)"
2. **R1-3**, `agent-os/standards/workflow/agents.md`, line 25 (the #39 sweep bullet): after "so the comment reports it (`Resolved n threads; m left open: <ids and why>`)", insert ". A thread already resolved when the sweep runs (resolved by hand before Finish) is in neither count, since the line reports what this sweep resolved and what is still open (#45, R1-3)", and turn the clause that follows ("a capped run, a dry run and a `no push` run sweep nothing, ...") into its own sentence starting "A capped run".
3. **R1-3**, `agent-os/standards/testing/tests.md`, line 6: "a skipped thread left open with its reason" becomes "a skipped thread left open with its reason, a thread already resolved in neither count (#45, R1-3)".
4. **R1-2**, drafted from the author's decision (A), every comment must be Redline's (it was held for that decision; the shaper's sketches for (B) and (C) no longer apply):
   - `agent-os/standards/workflow/agents.md`, line 25 (the #39 sweep bullet): "the script resolves only a thread whose first and last comments are both in the list, so a thread a teammate opened, or replied in after Redline, is skipped with a reason, which is a result and not an error" becomes "the script resolves only a thread every comment of which is in the list, so a thread a teammate opened or commented in, wherever the comment sits, is skipped with a reason, which is a result and not an error (#45, R1-2)". Item 2 edits a later clause of the same bullet; the two edits do not overlap.
   - `agent-os/standards/testing/tests.md`, line 13 (the gh harness): the thread-sweep fixture list "a Redline thread with its reply, one a teammate replied in after Redline, one a teammate opened, one already resolved, one with no reply yet; #39" becomes "a Redline thread with its reply, one a teammate replied in after Redline, one a teammate opened, one already resolved, one with no reply yet; #39; one with a teammate's comment between Redline's comment and its reply, which stays open; #45, R1-2".
5. `scripts/bash-conventions`, `scripts/guard`, `workflow/replay`, `prompts/attribution`, `process/standards-retrospective`, `process/internal-notes`, `index.yml`: no changes.

If the standards approver declines items 1 to 4, record "Standards retrospective: no changes" under Decisions instead.
