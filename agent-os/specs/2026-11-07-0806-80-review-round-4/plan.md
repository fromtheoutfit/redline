# PR #80 review round 4: round 3's retrospective, the guard standard after the narrowing, and a resolved finding read back as decided

Spec folder: `agent-os/specs/2026-11-07-0806-80-review-round-4/`

Shaped by Redline in unattended mode, for review round 4 of PR #80 (issue #79), from the round's three findings (`redline/round-4-review.json`, `redline/round-4-findings.json`):

- Two are `fix`, and both are records that did not follow the person's two hand commits (`6ef58a9`, `a70c243`):
  - R4-1: round 3's standards retrospective lands, and round 3's `shape.md` records the R3-4 decision.
  - R4-2: the guard standard says what the narrowed guard does.
- One was a judgment call, which the person decided as option A: R4-3, an earlier run's resolved reply reads as fixed, so a coverage candidate that still reproduces it reopens like a fixed one (`shape.md`, Decision 3; Task 4, and standards item 5 in Task 2).

Both fixes go mostly through the standards retrospective, which is one commit (Task 2). R4-1's record in round 3's folder is its own commit after it (Task 3), since it names Task 2's sha (`shape.md`, Decision 5). R4-3's code is its own commit after that (Task 4); its standards half is item 5 of Task 2's commit. Commits follow "Git rules for Redline agents" in `README.md`: the `redline:` prefix, each commit naming the findings it fixes, files staged by name. Line numbers are at `a70c243`.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-07-0806-80-review-round-4/redline/snapshot.json`.

Run every command below from the repository root. Each is a plain pipeline. The harnesses run only through `.claude/redline/checks.sh`, never by hand with an interpreter. Counts before this round, by reading the commits since round 2's As built (577 loop checks and 589 guard rows there):
- `loop` 579: `6ef58a9` adds two checks.
- `guard` 592: `a70c243` flips one row and adds three.

Every other harness is at round 2's count. Tasks 2 and 3 add no case; Task 4 adds one `gh` case. The first gate run's counts are the evidence: record any difference under As built.

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the findings' commits. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-07-0806-80-review-round-4/plan.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-4/standards.md`
- `agent-os/specs/2026-11-07-0806-80-review-round-4/references.md`

There is no `visuals/`.

**Docs entry:** spec folder only; no reader-facing change.

**Commit:** `redline: save review round 4 spec for PR #80 (#79)`

## Task 2: R4-1, R4-2 and R4-3's standards half: the standards retrospective, as approved

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", worded as approved, in one commit of their own. Keep every file's headings. Item 1 and item 2 are R4-1's standards half. Item 3 is all of R4-2. Item 4 is the round's lesson. Item 5 is R4-3's standards half, drafted for option A, the person's decision (`shape.md`, Decision 3). If the approver approves it, it lands in this same commit; if the approver declines or defers it, it does not, and Task 4 still lands.

**Files:**

- `agent-os/standards/workflow/agents.md`: item 1 (line 35), item 2 (a new bullet after line 15), and item 5 (the disposition bullet, line 25).
- `agent-os/standards/scripts/guard.md`: item 3 (lines 14 and 23).
- `agent-os/standards/process/standards-retrospective.md`: item 4 (a new bullet after line 8).
- `agent-os/standards/testing/tests.md`: item 5 (the gh-test bullet, line 14).

Proof, for each item applied (each prints the count shown, which was `0` before unless it says otherwise):

- Item 1:
  - `grep -c "a reopened finding carries no .knownAs., since the workflow counts" agent-os/standards/workflow/agents.md` prints `1`.
  - `grep -c "stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation" agent-os/standards/workflow/agents.md` prints `1`.
- Item 2: `grep -c "is applied everywhere the prompt and the role's agent file state the old rule" agent-os/standards/workflow/agents.md` prints `1`.
- Item 3:
  - `grep -c "the writes included" agent-os/standards/scripts/guard.md` prints `0` (was `1`).
  - `grep -c "narrowing as pending" agent-os/standards/scripts/guard.md` prints `0` (was `1`).
  - `grep -c "(of .redline-gh.sh., only its read subcommands)" agent-os/standards/scripts/guard.md` prints `1`.
  - `grep -c "read subcommands, .redline-prefs.sh., .redline-gate.sh check." agent-os/standards/scripts/guard.md` prints `1`.
  - Neighbour: `grep -c "Redline never edits Redline" agent-os/standards/scripts/guard.md` prints `1` (unchanged).
- Item 4: `grep -c "#80, R4-1, R4-2" agent-os/standards/process/standards-retrospective.md` prints `1`.
- Item 5:
  - `grep -c "#80, R4-3" agent-os/standards/workflow/agents.md` prints `1`.
  - `grep -c "#80, R4-3" agent-os/standards/testing/tests.md` prints `1`.
  - Neighbour: `grep -c "the one disposition a candidate may reopen" agent-os/standards/workflow/agents.md` prints `1` (unchanged).
- Headings, after the commit: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0`.
- `git diff --name-only HEAD~1 HEAD` lists only files from the **Files** list above.

If the approver approves no item, change no file and make no commit. Record "Standards retrospective: no changes" under Decisions in this folder's `shape.md` in the as-built commit, and record R4-1's standards half and R4-2 as not landed, a deviation. If item 3 is declined, R4-2 is not fixed: record that under Decisions as a deviation and leave it out of the commit message. If items 1 and 2 are both declined, R4-1's standards half is not landed: record that the same way. Task 3 still records the person's R3-4 decision.

**Docs entry:** standards, not under a Docs directory, and no new config key, subcommand, allow rule or exit code; no reader-facing change. The README and `docs/` already describe the narrowing as landed (`shape.md`, Unattended answer 6).

**Commit:** `redline: R4-1, R4-2, R4-3 record round 3's reopen and decided rules, the landed guard narrowing and the resolved-as-fixed reading in the standards (#79)`. Leave out a finding whose item was not applied: without item 5 it reads `redline: R4-1, R4-2 record round 3's reopen and decided rules and the landed guard narrowing in the standards (#79)`.

## Task 3: R4-1: round 3's shape.md records the R3-4 decision, its hand commit and the landed retrospective

**Files:** `agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` only. Do not touch round 3's `plan.md`, `standards.md`, `references.md` or anything under its `redline/` folder.

This records a decision the person made and committed (`shape.md`, Unattended answer 4). It decides nothing. Runs after Task 2, whose short sha it names: `git log -1 --format=%h -- agent-os/standards/` prints it.

1. **Decision 4** (line 28). Replace its opening, "**R3-4: pending decision.**", with:

   ```text
   **R3-4: Should a decided finding whose decision was applied in commits reopen? Decided: B. Keep it settled, say so, and show the gap.**
   ```

   Keep the rest of that line as it is. Below it, at the entry's indentation (three spaces, as Decisions 1 to 3 hold their owner lines), add these lines:

   ```text
      - Chosen: B, by the person, outside the run. The run stopped after shaping, before plan approval (this folder's `redline/` holds no `snapshot.json`). The person applied B by hand in `6ef58a9` (`redline: R3-3, R3-4 keep a decided finding settled and put the reopen exception in the handled-list header (#79)`), in their own words: a decided finding stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation; a coverage candidate that still reproduces one goes under For the person, naming the earlier id, and the run still ends. Plan Task 5's option B is that commit's change. Recorded by Redline round 4 (#80, R4-1).
      Decided by: @michaelfromtheoutfit
   ```

2. **A new Decisions entry after Decision 5**, before the `### Proportionality (correctness findings)` heading:

   ```text
   6. **As built: R3-1 to R3-4 landed by hand in one commit, `6ef58a9`,** not one commit per finding as `plan.md` planned, and in the person's own wording where it differs from Tasks 2 to 5; that commit's diff is the as-built text. No implementer ran this round, so `plan.md` has no As built section. Redline round 4 resolved R3-1 to R3-4 from its carry-forward list at `a70c243` (#80, R4-1).
      Decided by: @michaelfromtheoutfit
   ```

3. **The retrospective heading** (line 105). Replace `## Standards retrospective (proposed)` with `## Standards retrospective`, and directly below it, before item 1, add one paragraph that says what Task 2 landed. As written for the case where the approver approved round 4's items 1 and 2, with `<sha>` being Task 2's short sha:

   ```text
   Landed through Redline round 4's standards retrospective (`agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md`, items 1 and 2) in `<sha>` (#80, R4-1): items 1 and 3 (3 as option B, the person's decision) as round 4's item 1, and item 2 as round 4's item 2. Items 4 and 5: no change, as proposed. The list below is the proposal as shaped.
   ```

   For an item the approver declined, the paragraph says "Standards retrospective: no changes" for it, with the approver's reason, in place of its "as round 4's item" clause. If both round 4 items 1 and 2 were declined, the paragraph reads "Standards retrospective: no changes", with the approver's reasons, and the same line is added under Decisions as entry 7. The proposed list below the heading stays as it is.

Proof:

- `grep -c "R3-4: pending decision" agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `0` (was `1`).
- `grep -c "Decided: B. Keep it settled, say so, and show the gap." agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `1`.
- `grep -c "Decided by: @michaelfromtheoutfit" agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `2` (was `0`).
- `grep -c "^## Standards retrospective (proposed)" agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `0`.
- `grep -c "^## Standards retrospective" agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `1`.
- `grep -c "Decided by: redline" agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md` prints `10`, unchanged. These are Decisions 1, 2, 3 and 5 and Unattended answers 1 to 4, 6 and 7, which stay as they are.
- `git diff --name-only HEAD~1 HEAD | wc -l` prints `1`, and `git diff --name-only HEAD~1 HEAD` prints `agent-os/specs/2026-11-06-1019-80-review-round-3/shape.md`.

**Docs entry:** a spec folder, not under a Docs directory; no reader-facing change.

**Commit:** `redline: R4-1 record the R3-4 decision, its hand commit and the landed retrospective in round 3's shape (#79)`

## Task 4: R4-3: an earlier run's resolved reply reads as fixed

Decided by the person as option A, "Read a resolved reply as fixed" (`shape.md`, Decision 3, which records the story and the four options as the person saw them). A `resolved; first reported as` reply is Redline's own claim that the code no longer has the finding, not a decision a person made, so `prior-findings` reads it as `fixed`. A later run's coverage candidate that still reproduces it is then new under the reopen rule R2-1 set for a fixed finding, and runs one more round within `maxRounds`. Runs after Tasks 2 and 3. Line numbers are at `a70c243`.

Today `resolvedReplies()` posts `resolved; first reported as <id> in Redline round <n>. <why> · decided by: redline` (`workflows/redline-loop.js:2411`), and `classify` (`scripts/redline-gh.sh:335-342`) has no branch for it, so it falls to `else "decided"` and the next run keeps it settled (`workflows/redline-loop.js:1126`, `1169`).

No workflow, prompt or agent file changes. `prior-findings` runs at launch in the skill and reaches the workflow as `args.priorFindings`. The handled-list header (`workflows/redline-loop.js:1126`) and the candidates block (`1169`) already reopen a `fixed` finding that still reproduces, and `fixed` is already in `PRIOR_DISPOSITIONS` (`:86`). So nothing a relaunch replays moves, and `coverage off` prompts stay byte-identical.

**Files:**

- `scripts/redline-gh.sh`
- `docs/scripts.md`
- `tests/gh-fixtures/reviews-14.json`
- `tests/gh-fixtures/comments-14.json`
- `tests/gh-test.sh`
- `docs/running.md`

All but `docs/running.md` are outside the PR's diff. Each is named here so it reaches the snapshot's `plan_paths`, which is how `checks.sh` allows a changed file outside the PR's diff.

1. **`scripts/redline-gh.sh`, `prior-findings`' `classify`.** Directly after line 341, `elif startswith("left to the author") then "left"`, and before line 342, `else "decided" end;`, add this line at the same indentation as the other `elif` lines:

   ```text
   elif startswith("resolved; first reported as ") then "fixed"
   ```

   The comment above `classify` stays as it is.
2. **The script's header, lines 42 to 45.** Each line keeps the header's column: `#` and 34 spaces before the text. Replace these four lines:

   ```text
   #                                  person, #49), any other reply decided, no reply none; a
   #                                  finding a later round's line
   #                                  names as first reported is carried (carried_to that id)
   #                                  whatever its thread says. Exit 2 on a gh error
   ```

   with these five:

   ```text
   #                                  person, #49), "resolved; first reported as" fixed (a later
   #                                  run's reviewer found the code no longer has it, #80, R4-3), any
   #                                  other reply decided, no reply none; a finding a later round's
   #                                  line names as first reported is carried (carried_to that id)
   #                                  whatever its thread says. Exit 2 on a gh error
   ```

   Lines 37 to 41 above them do not change.
3. **`docs/scripts.md`, the quoted `prior-findings` header, lines 52 to 55.** The same replacement, byte for byte as in the script, since this file quotes every script's header verbatim (`process/docs-gate`).
4. **`tests/gh-fixtures/reviews-14.json`.** In the body of the review with id 23 (`Redline round 2`), directly after the R2-3 line under `### Findings`, add one finding line:

   ```text
   - **R2-4** · correctness · low · likely · `app/g.php:6` · Cache key ignores locale
   ```

   In the JSON string it is `\n- **R2-4** · ...` after the R2-3 line's text. The rest of the body stays as it is, the heading's counts included; `prior-findings` does not read them.
5. **`tests/gh-fixtures/comments-14.json`.** After the comment with id 1433 (the last entry), add two entries, pretty-printed like the file's other entries and with the fields 1423 and 1433 carry:
   - The root comment: `id` 1424, `pull_request_review_id` 23, `user` `{"login": "author"}`, `path` `app/g.php`, `line` 6, `side` `RIGHT`, `in_reply_to_id` null, `created_at` `2026-10-27T13:00:00Z`, `body` `**R2-4** · correctness · low · likely\n\n**Cache key ignores locale**\n\nThe cache key leaves out the locale, so one locale's page is served to every other.`
   - Its reply: `id` 1434, `pull_request_review_id` 23, `user` `{"login": "author"}`, `path` `app/g.php`, `line` 6, `side` `RIGHT`, `in_reply_to_id` 1424, `created_at` `2026-10-29T10:00:00Z`, `body` `Redline round 3: resolved; first reported as R2-4 in Redline round 2. The cache key now includes the locale. · decided by: redline`. This is `resolvedReplies()`'s wording (`workflows/redline-loop.js:2411`), posted by a later run's round 3.
6. **`tests/gh-test.sh`.**
   - Line 210, the case that lists every id: its expected value becomes `'["R1-1","R1-2","R1-3","R1-4","R1-5","R1-6","R2-1","R2-2","R2-3","R2-4"]'`.
   - After line 225, the R2-3 `left` case, add a comment line and one case:

     ```text
     # A later run's resolved reply is Redline's own claim that the code no longer has the finding, so it reads fixed, never decided (#80, R4-3).
     is "prior-findings: a later run's resolved reply is fixed, not decided" "$(jq -c '.[9] | [.id, .disposition, .comment_id, .reply.id, .round]' <<<"$pf")" '["R2-4","fixed",1424,1434,2]'
     ```

   - Line 220, `prior-findings: any other reply is decided` (R1-6's reply that keeps the docblock and applies it), does not change. It is the neighbouring decision that must not change, and the indexes 0 to 8 the other cases read do not move, since R2-4 sorts last.
   - The header comment, lines 25 to 29: in PR 14's list, after "a decided one", add ", a round-2 finding a later run's reply resolved".
7. **`docs/running.md`, "Earlier rounds" (line 98).** Directly after the sentence that ends "or `carried` into a later round.", add:

   "A `resolved; first reported as` reply, which a later run posts on an earlier finding its reviewer found the code no longer has, reads as `fixed`: it is Redline's own claim that the bug is gone, the claim a fixed reply makes, not a decision a person made, so a coverage candidate that still reproduces it is new, as one that still reproduces a fixed finding is (#80, R4-3)."

   The rest of the paragraph stays. That includes the "never re-raised" sentence (`shape.md`, Observed, not in scope), which the decision does not fold in.

Proof:

- `grep -c 'startswith("resolved; first reported as ") then "fixed"' scripts/redline-gh.sh` prints `1` (was `0`).
- `grep -c '"resolved; first reported as" fixed' scripts/redline-gh.sh` prints `1` (was `0`), and the same in `docs/scripts.md` prints `1` (was `0`).
- `grep -c "#80, R4-3" docs/running.md` prints `1` (was `0`).
- Neighbour: `grep -c 'else "decided" end' scripts/redline-gh.sh` prints `1` (unchanged).
- The gate (Task 5): `gh` gains one case and passes, including the id-list case, the new case and the `any other reply is decided` case; `loop` stays at 579 and `guard` at 592.
- `git diff --name-only HEAD~1 HEAD` lists only the six files above.

**Docs entry:** `scripts/redline-gh.sh` is `docs/running.md` "Earlier rounds" (the new sentence) and `docs/scripts.md` (the quoted header, changed byte for byte with the script's), both in this commit. No new subcommand, config key, allow rule or exit code. A change to `docs/` needs no entry of its own.

**Commit:** `redline: R4-3 read an earlier run's resolved reply as fixed in prior-findings (#79)`

## Task 5: Verification Gate

**Files:** `agent-os/specs/2026-11-07-0806-80-review-round-4/plan.md` and `agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md` (step 13).

1. Steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-07-0806-80-review-round-4/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expected counts: `loop` 579 and `guard` 592 (see the top of this plan), `gh` one more than its count before the round (Task 4's resolved-reply case, R4-3 option A), and every other harness at its count before the round, since Tasks 2 and 3 add no case.
2. Step 10, Docs: each task's Docs entry above names its section or its reason, and is confirmed against the task's commit.
3. Step 11, Version: `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged. The PR already bumps the minor version, and no task changes what a setup rerun writes (`shape.md`, Decision 4). The setup test's last cases prove the two agree.
4. Step 12, Standards retrospective: Task 2, as approved. If nothing was approved, "Standards retrospective: no changes" goes under Decisions in this folder's `shape.md`.
5. Step 13, Spec folder: add an "As built" section to this file. It records each task's commit, the proof outputs, the gate's counts, and which retrospective items the approver approved, declined or deferred. It also records any deviation, which goes under Decisions in `shape.md` too. This lands in the round's last commit.

**Commit:** `redline: record PR #80 round 4 as built (#79)`

---

## As built

- **Commits, in the plan's order:**
  - Task 1: `0093f66`, `redline: save review round 4 spec for PR #80 (#79)`.
  - Task 2: `2118e85`, `redline: R4-1, R4-2, R4-3 record round 3's reopen and decided rules, the landed guard narrowing and the resolved-as-fixed reading in the standards (#79)`.
  - Task 3: `d7f2a4d`, `redline: R4-1 record the R3-4 decision, its hand commit and the landed retrospective in round 3's shape (#79)`.
  - Task 4: `a8497eb`, `redline: R4-3 read an earlier run's resolved reply as fixed in prior-findings (#79)`.
  - Task 5: this commit.
- **Retrospective.** The standards approver approved items 1 to 5, each as drafted in `shape.md`. Item 6 is no change, as proposed. Nothing was declined or deferred, so item 5 landed in Task 2's commit and the message names R4-1, R4-2 and R4-3.
- **Task 2 proofs**, all as expected:
  - Items 1, 2, 4 and 5 each print `1`, and so do item 3's two new phrases.
  - Item 3's `the writes included` and `narrowing as pending` print `0`.
  - The neighbours (`Redline never edits Redline`, `the one disposition a candidate may reopen`) print `1`.
  - The heading check prints `0`.
  - The commit lists only the four standards files.
- **Task 3 proofs**, all as expected:
  - `R3-4: pending decision` prints `0`.
  - `Decided: B. Keep it settled, say so, and show the gap.` prints `1`.
  - `Decided by: @michaelfromtheoutfit` prints `2`.
  - `^## Standards retrospective (proposed)` prints `0`, and `^## Standards retrospective` prints `1`.
  - `Decided by: redline` prints `10`.
  - The commit lists only round 3's `shape.md`.
  - The retrospective paragraph names `2118e85` and the approved items 1 and 2.
- **Task 4 proofs**, all as expected:
  - The `classify` line, the header phrase in both `scripts/redline-gh.sh` and `docs/scripts.md`, and `#80, R4-3` in `docs/running.md` each print `1`.
  - The neighbour `else "decided" end` prints `1`.
  - The commit lists only the six planned files.
  - Red before green: with the fixtures and the case in place and before the `classify` line, the gate's `gh` check read `113 passed, 1 failed`. The new case got `["R2-4","decided",1424,1434,2]`, and every other case passed, the id list and `any other reply is decided` included. After the fix it read `114 passed, 0 failed`.
- **Gate** (`checks.sh` on this round's snapshot), green on the committed state with nothing unexpected or uncommitted:
  - Every check exits 0.
  - `guard`: 592 passed.
  - `loop`: 581 checks passed.
  - `gh`: 114 passed, one more than before the round.
  - `prefs`: 101, `gate`: 117, `setup`: 468, `background`: 39, none touched by this round.
  - `validate` passes with its usual marketplace-folder warnings.
- **Counts against the plan.** `loop` reads 581, not the 579 the top of this plan expected. No loop case changed this round. The plan counted `6ef58a9`'s two explicit checks but missed the run-record check that `go()` adds for each scenario that reaches Finish (`tests/loop-test.mjs:232-236`). That commit's two new scenarios both reach Finish, so it added four checks, and 577 + 4 = 581. `guard` is 592, as planned.
- **Docs (step 10).** Tasks 2 and 3 touch no Docs directory: no reader-facing change, as their entries say. Task 4's `scripts/redline-gh.sh` change is in `docs/running.md` "Earlier rounds" and in the quoted header in `docs/scripts.md`, both in `a8497eb`.
- **Version (step 11).** `0.2.0` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, unchanged.
- **Deviation (Task 3, step 1).** Round 3's Decision 4 quotes `6ef58a9`'s message verbatim. The planned text said "in their own words" before a close paraphrase of it. The plan approver noted that it was a paraphrase and asked for an exact quote or for the phrase to go. Recorded in `shape.md`, Decision 6.
