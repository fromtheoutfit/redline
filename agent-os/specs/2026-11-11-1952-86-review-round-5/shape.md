# PR #86 review round 5: the set-aside block's last edges, pinned and named: Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The four findings of Redline round 5 on PR #86 (issue #85), and nothing more. All four are nits. The round has no correctness finding, so this is the final nit round: after its fixes, a final nit pass reviews them (`docs/running.md`, "Rounds", step 7: "With scope `all`, a round that fixed only nits ends in one final nit pass over the nit fixes"). The round reviewed the fix diff from round 4 (`dbfcd69..dd42671`) and the coverage pass's candidates over the whole pull request at `dd42671`, which is the working tree's HEAD. Line numbers here are at that commit.

- **R5-1** (nit, low, confirmed): `tests/loop-test.mjs:1574`. No escaping case puts `&` inside a code span, so "a span is left as written" is pinned for `<` only.
- **R5-2** (nit, low, confirmed): `tests/loop-test.mjs:1620`. The duplicate-target parse's `\b` end anchor and its `\s+` have no case that turns on them.
- **R5-3** (nit, low, confirmed): `workflows/redline-loop.js:508`. `LISTED_ELSEWHERE`'s comment says a `finding` entry covers Already tracked, but those candidates are `known` and set aside.
- **R5-4** (nit, low, confirmed): `workflows/redline-loop.js:891`. A duplicate of a candidate that became a finding names the target's place and outcome, but not the finding's id.

The round's three For the person lines and its three set-aside candidates are not findings and are not in scope. The `redline/` subfolder is Redline's own record and is untouched. The invoking prompt lists no repository ask rules, and `.claude/redline.json` declares none (its keys are `checker`, `checkerStallMs`, `maxPlanAdjustments`, `maxRounds`, `models`, `push`, `reviewer`).

## Decisions

1. **R5-1: fix, one more case in the escaping scenario.** The `tags` scenario in `tests/loop-test.mjs` section 15 gains a seventh candidate, ``cand('app/g.vue', 7, 'a span `a && b <c>` keeps its ampersands & this one does not')``, accounted for as `outside` with the ref `untouched code`. Its expected line, ``- `app/g.vue:7` · a span `a && b <c>` keeps its ampersands &amp; this one does not · outside: untouched code``, joins `escapedLines`, and both label counts in the scenario's check go from 6 to 7. The case sits in the existing check, beside the six cases it already pins, as `testing/tests.md` line 10 lists the cases of one check. The red run is a temporary mutation of `blockText` that escapes `&` across the whole text before the span pairing, restored before the commit (Unattended answer 4). Plan Task 2.
   Decided by: redline
2. **R5-2: fix, two more forms in the duplicate-forms scenario.** The `forms` scenario gains two candidates and two duplicates: `1st pass missed it` (index 7) and `candidate1` (index 8). One check each pins that the line ends with the ref as written and no addition. One mutation run, `\b` removed and `\s+` loosened to `\s*` together, turns exactly these two checks red, each for its own clause (Unattended answer 5). The forms come from the parse the person decided in round 4 and the follow-up spec's list of forms, so pinning them decides nothing new (Unattended answer 5). Plan Task 3.
   Decided by: redline
3. **R5-3: fix, the comment only.** The comment above `LISTED_ELSEWHERE` (`workflows/redline-loop.js:508-512`) is reworded to say what each listed outcome means after `accountCoverage`, and that a candidate behind a finding under Already tracked is set aside as `known`. It also names Carried forward, the other heading where a `finding` entry's finding can sit (Unattended answer 6). The constant and every line of code are unchanged. Plan Task 4.
   Decided by: redline
4. **R5-4: fix, the finding's id after a `finding` target's outcome.** When a duplicate's target candidate is accounted for as `finding`, `into` also carries that entry's ref, which is the finding's id, and the line renders it after the outcome: ``duplicate: 1 (candidate 1, `app/x.php:3`: finding R1-1)``. A target of any other outcome gets no id, and its line is unchanged. That includes `known`, which the reviewer's proposed fix named too: a `known` target is itself in the block, at the place the addition names, with the finding's id in its own ref (Unattended answer 7). A new loop scenario, seen red before the code changes, pins the id. The existing refuted and For the person targets pin the neighbour. The two comments that state the rule and `docs/running.md`, "The coverage pass", follow. Plan Task 5.
   Decided by: redline
5. **No version change.** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` read `0.2.2`. `git show origin/main:.claude-plugin/plugin.json` reads `0.2.1`, so the PR already carries its patch bump. No task changes anything a setup rerun writes: no template, nothing in `scripts/checks-template.sh`, no allow entry, and not the unattended section's body (`process/release`, line 5).
   Decided by: redline
6. **Docs.** Tasks 2 and 3 commit `tests/loop-test.mjs` only, which is not in a Docs-step directory. Each changes `workflows/redline-loop.js` only for its red run and restores it byte for byte before the commit, so neither needs a Docs entry. Task 4 alters `workflows/redline-loop.js` by a comment only. Its entry names `docs/running.md`, "The coverage pass", which already says the block lists `known` and that a finding under Already tracked counts as already tracked, with "no reader-facing change" because no behaviour, prompt or output changes. Task 5's entry is `docs/running.md`, "The coverage pass", updated in Task 5's commit. The README's "What a clean run means" describes the block by outcome and ref only, so it needs no change (`process/docs-gate`, lines 5 and 8).
   Decided by: redline

### Proportionality

All four findings are nits, so the rule for correctness findings does not apply. For the record:

- **R5-1:** one candidate, one ref and one expected line, plus two count edits, in one file in the PR's diff. One temporary two-line mutation of another file in the PR's diff, restored before the commit.
- **R5-2:** two candidates, two refs and two checks, in one file in the PR's diff. One temporary mutation of one line, restored.
- **R5-3:** one comment of five lines becomes eight, in a file in the PR's diff. No code.
- **R5-4:** one object field and one template expression, in `workflows/redline-loop.js` (lines 891 and 2156); two comments; one sentence of `docs/running.md`; and one scenario of about ten lines in `tests/loop-test.mjs`. All three files are in the PR's diff. No new dependency, schema field, prompt sentence or abstraction. `into` rides on the round record only: the result keeps no `setAsideCandidates`, as the loop test's result check pins, and the round's findings file holds the accounting and the candidate list, not `into` (`workflows/redline-loop.js:2235`).

## Unattended answers

1. **Scope.** The round's four findings (`redline/round-5-findings.json`), as point 6 of the unattended section sets. The invoking prompt says the plan covers the nits only.
   Decided by: redline
2. **Visuals.** None. The round adds loop-test cases, rewords two comments and one docs sentence, and adds one token to a set-aside line.
   Decided by: redline
3. **Product context.** `agent-os/product/mission.md:17`, "Honest about its reach": the set-aside block is how the person sees what the verifier did not act on. R5-4 makes a duplicate's line name the finding it went into, and R5-1 and R5-2 pin what the block already claims. Line 15, "Decisions stay with people": no finding needs a decision (answers 4 to 7). There is no conflict and no mission edit.
   Decided by: redline
4. **R5-1: confirmed, and the red run.** `blockText` (`workflows/redline-loop.js:910-928`) escapes `&` and `<` only in the text between paired spans (line 923), so a span keeps its `&`. The escaping scenario's spans (lines 1574 to 1579) hold `<Head title="x" />`, ``a ` b <c>``, `<c>` and `<b>`, none with an `&`. The one `&` in the scenario is in candidate 1's ref (`Tom & Jerry wrote &lt; by hand`, line 1582), outside every span. So a `blockText` that escaped `&` across the whole text first, then paired spans and escaped `<` only outside them, gives the same six lines.
   - **The mutation.** Line 911, `  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')`, becomes two lines: `  text = text.replace(/&/g, '&amp;')` and `  const escape = (s) => s.replace(/</g, '&lt;')`. This is the finding's own form.
   - **Under the mutation**, candidate 1's ref still reads `Tom &amp; Jerry wrote &amp;lt; by hand`, and the two fallback lines (candidates 5 and 6) hold no `&`. Only the new line changes, to ``a span `a &amp;&amp; b <c>` keeps …``. So the one check at line 1601 goes red, and the loop reads `616 checks passed, 1 failed`.
   - **The trace of the new line, unmutated.** The text holds no newline and no backslash before a backtick. Its two single backticks pair, so ``a && b <c>`` is left as written, and the `&` after the span becomes `&amp;`.

   This is the case `testing/tests.md` line 10 asks for, "one case per way the reading can go wrong".
   Decided by: redline
5. **R5-2: confirmed, and which forms it pins.** The parse is `/^(?:(?:candidate|index)\s+)?(\d+)\b/i.exec(e.ref)` (`workflows/redline-loop.js:2154`). Every duplicate ref in the loop test was traced: `R1-1`, `3` and `candidate 2` (lines 1520 to 1522), and `index 1`, `CANDIDATE 1`, `4`, `99` and `1; #7 tracks the case-folding` (lines 1616 to 1620). With `(\d+)` in place of `(\d+)\b`, or `\s*` in place of `\s+`, each reads the same. `grep -c "outcome: 'duplicate'" tests/loop-test.mjs` prints `8`, so there are no others.
   - **`1st pass missed it`.** Today: the optional group does not match at `1`. `(\d+)` takes `1`, and `\b` between `1` and `s` fails. The match fails, so there is no target, and the line ends at the ref. With `\b` removed it reads index 1, so its line gains ``(candidate 1, `app/z.php:5`: refuted)``. With `\s*` alone it still fails at the `\b`.
   - **`candidate1`.** Today: the group needs whitespace after `candidate` and fails, and `(\d+)` cannot match at `c`. So there is no target. With `\s*` it reads index 1 and gains the same addition. With `\b` removed alone, the group still fails.

   So each new check turns on one mutation only, and with both applied the loop reads `617 checks passed, 2 failed`.

   **Does pinning them decide a question?** No:
   - The follow-up spec's shaping default lists the forms read as an index: "`3`, `candidate 3` or `index 3` (any case)" (`agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/shape.md:64`). It shows "any other ref" as written (line 67).
   - Round 4's Decision 2, decided by the person as option B, keeps "the widened parse that reads a leading index token as the backstop". The regex with `\b` was the option's own text (`agent-os/specs/2026-11-11-1952-86-review-round-4/shape.md`, Decision 2).
   - `1st` is not an index token, and `candidate1` is not the `candidate 3` form. So both are "any other ref", and the checks pin the code as decided.

   `99` stays past the round's candidates (now eight), and `4` still names itself, so round 4's checks hold.
   Decided by: redline
6. **R5-3: confirmed, and what the comment now says.** `accountCoverage` (`workflows/redline-loop.js:1368-1371`) rewrites a `finding` entry whose finding carries a `knownAs` to ``{ index, outcome: 'known', ref: `${finding.id}: ${finding.knownAs}` }``. Under `correctness only` it rewrites one naming a nit to `forThePerson` (lines 1360 to 1366). The set-aside filter (line 2148) runs on the accounting after that. So a `finding` entry there names a finding with no `knownAs`, and `reviewBody` lists it under Findings, or under "Carried forward from earlier rounds" when it carries an earlier one (lines 832, 833 and 843 to 848). The loop test's partly tracked scenario expects a `known` line in the block (lines 1499 and 1500). The follow-up spec records the same in its shaping default "A `known` entry made from a finding with `knownAs`" (`shape.md:62`). The rewording says so. It names Carried forward because that heading is also where a `finding` entry's finding can sit, which the reviewer's wording left out.
   Decided by: redline
7. **R5-4: confirmed, and does it need a decision?** It is confirmed:
   - `into` (`workflows/redline-loop.js:2156`) carries the target's index, file, line and outcome.
   - `setAsideBlock` renders exactly those (line 891).
   - The target of a duplicate accounted for as `finding` is not in the block, since `LISTED_ELSEWHERE` holds `finding`.
   - The accounting sentence asks for a duplicate's ref "opening with the index of the candidate or the id of the finding it collapses into" (line 1244), so a ref that names the target candidate's index is the documented first form.

   **It needs no decision.** The evidence answers it:
   - The follow-up spec's Decision 2, from the brief: "A `duplicate` line names what it collapsed into" (`shape.md:28`).
   - Its shaping default gives the reason for the target's place: "Block lines carry no index, so a bare "3" would mean nothing to the reader" (`shape.md:65`).
   - The PR description says the same: "A `duplicate` line names what it collapsed into."

   A duplicate of a candidate that became a finding collapsed into that finding, in substance. Its line names the candidate's place and the word `finding`, but not the finding, which may be anchored elsewhere. So with several findings the line does not name what it collapsed into. Appending the id makes the brief's sentence hold. It leaves the default's place and outcome, the one-hop rule and "the line still never opens with a finding id" as they are, since the id sits after the outcome inside the parentheses.

   **Why `finding` only.** The reviewer proposed the id for `known` targets too. A `known` target is set aside, so its own line is in the block, at the place the addition names. Its ref holds the finding's id when `accountCoverage` made it from a finding (`R1-2: #7`), or the issue when the verifier wrote it (`#7`). A `forThePerson` target has no id. So only a `finding` target is listed outside the block under an id the line can give.

   **Checks.** `accountCoverage` keeps a `finding` entry only when `byId.get(ref)` found it, with the ref trimmed (lines 1350 to 1352), so the entry's ref is the finding's id exactly. The id rename runs before the accounting (lines 2122 to 2132), so the id is the one the body lists. `redline-gh.sh prior-findings` reads only lines that open `- **R` (`scripts/redline-gh.sh:334`), and a set-aside line opens with the backticked place, so an id mid-line is never read back.
   Decided by: redline
8. **Expected counts.** The loop test reads `617 checks passed, 0 failed` at `dd42671`. That is round 4's As built after its Task 3, and `git diff --stat ee7fbbe dd42671` touches only the round 4 plan and two standards.
   - R5-1 adds no check; its case joins an existing check.
   - R5-2 adds two checks.
   - R5-3 adds none.
   - R5-4 adds one check, plus the run-record check that `go()` adds for a run that reaches its handoff (`tests/loop-test.mjs:233-239`). Its scenario ends as the nine-candidate scenario does, after a re-review with no finding.

   So the round ends at 621. Every other harness keeps its count, since no file one reads changes: guard 592, prefs 101, gate 117, setup 468, gh 114 and background 39 (round 4's As built). `git diff --stat 8807864 dd42671` over `scripts`, `hooks`, the other harnesses, `.claude`, `.claude-plugin` and `templates` prints nothing.
   Decided by: redline
9. **What was run, and what was traced.** No `node` run was attempted. This PR's round 1 shaper recorded the guard's refusal ("'node' is not available to the shaper", `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md`, Unattended answer 7). `/tmp/redlinerepro/` holds only round 1's files, and there is no `reviewer-r5-ReproTest.php`, so the reviewer wrote no reproduction for this round. All four findings were traced from the code. The implementer runs the loop test only through `checks.sh`, and R5-1's and R5-2's red runs are mutations through the gate. Read-only commands run: `git log`, `git status`, `git diff --stat`, `git show origin/main:.claude-plugin/plugin.json`, `grep`, `sed -n`, `awk` (line widths), `jq` over the round files and config, and the `redline-gh.sh` reads below.
   Decided by: redline
10. **Known-finding check.** None of the four is tracked elsewhere:
    - `scripts/redline-gh.sh issues-search` returned nothing for `"set-aside block"`, `"LISTED_ELSEWHERE"`, `"blockText"`, `"duplicate finding id"`, `"escaping code span"`, `"ampersand"`, `"duplicate ref"` or `"coverage accounting"`.
    - `"known finding comment"` returned #85 (this PR's issue), #2, #19 and #73, none of which is one of these.
    - `"relaunch replay"` returned #81, which is the run caution under Context, not a finding.
    - `scripts/redline-gh.sh pr-comments 86` holds no earlier raise of an `&` in a span, a `1st` or `candidate1` ref, the `LISTED_ELSEWHERE` comment or a duplicate's finding id. The only hits are round 5's own Findings lines.
    - The PR's earlier round folders hold none of them: round 1 (R1-1 to R1-4), round 2 (R2-1, R2-2), round 3 (no findings) and round 4 (R4-1, R4-2, the parse these checks pin).
    Decided by: redline
11. **Scratch test.** None written. There is no PHP in this repository, and the shaper cannot run `node`.
    Decided by: redline

## Deferred

None.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** as Unattended answer 3.
- **Run caution (#81): noted for the person, not a decision and not a finding.**
  - #81 is open: "Self-review: a relaunch runs the workflow and agents as the run's own rounds edited them, so replay diverges and a re-run round can wrongly end the run".
  - Tasks 2 and 3 edit `workflows/redline-loop.js` only for their red runs and restore it, so their commits carry `tests/loop-test.mjs` alone.
  - Task 4 commits a comment in `workflows/redline-loop.js`, which changes no prompt.
  - Task 5 commits a change to the set-aside line. It changes a covered round's post prompt only where a duplicate names a candidate accounted for as `finding`. This run's rounds have none: round 4's block holds no duplicate (`redline/round-4-review.json`), and round 5's one duplicate, candidate 5 (`2; same cause, …`), names candidate 2, a `forThePerson` entry (`redline/round-5-findings.json`).
  - **One sign of #81 is already on the PR.** In the posted round 5 body, candidate 5's line ends at its ref, with no ``(candidate 2, `workflows/redline-loop.js:912`: forThePerson)``. The parse at `dd42671` reads `2;` as index 2, since R4-1's `\b` (`ee7fbbe`, 21:16) matches there. The round 5 review file was written at 21:38. So the workflow that posted round 5 predates `ee7fbbe`, as a workflow loaded at launch does. A relaunch that replays round 5 with this checkout's workflow would render that line differently.
- **For the person: the PR description.** "For the reviewer", "Gate:" says "The loop test passes 610 checks with 0 failed." It is 617 at `dd42671` and will be 621 after this round. "What lands" says a duplicate line "also gives that candidate's place and outcome". After Task 5 it also gives the finding's id when that candidate became a finding. This repository has no standard for agent-written PR descriptions, so the round writes no `pr-body.md` (`agent-os/specs/2026-11-11-1409-86-review-round-2/shape.md`, Unattended answer 7). The author can correct both by hand.

## Standards Applied

- `testing/tests`: one case per way the escaped reading can go wrong (line 10; R5-1); a case per accepted and refused form, each seen red under a mutation of its own clause (line 22; R5-2); a check's name states only what it asserts (line 24); red before green, by mutation where the code already holds the behaviour (line 27; R5-1, R5-2), and by the new case first where it does not (R5-4).
- `workflow/agents`: the #85 bullet (line 37), which states the set-aside rule and the duplicate's place and outcome (R5-3, R5-4); the #56 R1-1 sentence in line 22, that a change rewriting a result before a call site stores it rewords every sentence that says what the record keeps (R5-3).
- `workflow/replay`: line 15. Task 5's change renders only inside the set-aside block, which exists only when a pass ran, so a `coverage off` prompt stays byte-identical. No task changes a verify prompt.
- `scripts/guard`: every command the plan gives the implementer has the shape the guard accepts, with no `$`, no backticks and no process substitution (line 13).
- `process/docs-gate`: one entry per touched plugin file, or the reason there is none (Decision 6).
- `process/release`: the version stays `0.2.2` (Decision 5).
- `process/standards-retrospective`: the proposed list below, applied in its own commit.
- `prompts/attribution`: no model or vendor name in the spec, the code or the commits.

## Standards retrospective (proposed)

Listed mechanically from the Decisions and Unattended answers above. Each item is proposed, not applied. The standards approver approves the list, and the implementer applies the approved items in one commit after Task 5's: `redline: record the round 5 review lessons in the standards (#85)`.

1. **R5-1, missing: `agent-os/standards/testing/tests.md` line 10**, the bullet that opens "Text the workflow escapes for GitHub is pinned as the escaped string". In "for the set-aside block, a tag inside a code span, a bare tag,", insert after "a tag inside a code span," (with one space before it):

   ```text
   an `&` inside a span beside one outside it (#86, R5-1),
   ```

   So the case list reads "a tag inside a code span, an `&` inside a span beside one outside it (#86, R5-1), a bare tag, …". A span kept for `<` alone stayed green under an `&` escaped across the whole text before the pairing.
2. **R5-2, missing: `agent-os/standards/testing/tests.md` line 22**, the bullet that opens "A change that touches a tested surface adds a case in the same commit". Append, after its closing "(#86, R4-2)":

   ```text
   ; and a change that widens such a parse pins the form it still refuses beside the one it now accepts: R4-1's word boundary was pinned by a note after the index alone, so dropping it, or loosening the `\s+` after `candidate`, stayed green until a `1st` and a `candidate1` ref were pinned as written (#86, R5-2)
   ```

3. **R5-4, missing: `agent-os/standards/workflow/agents.md` line 37**, the #85 bullet. In "a `duplicate` of another candidate's index also gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide", insert before ", so a duplicate":

   ```text
   , and the finding's id when that candidate became a finding, which the block does not list (#86, R5-4)
   ```

4. **R5-3, missing: `agent-os/standards/workflow/agents.md` line 37**, the same bullet. In "by one rule (`LISTED_ELSEWHERE`), never a list of outcomes, so an outcome added later is listed too;", insert before that semicolon:

   ```text
   , and the rule reads the accounting after `accountCoverage`, which accounts for a candidate behind an Already tracked finding as `known`, so that candidate is in the block too, its ref the finding's id and the issue (#86, R5-3)
   ```

   The general rule is already in line 22, in the #56 R1-1 sentence that a change rewriting a result before a call site stores it rewords every sentence that says what the record keeps. This item puts the set-aside case of it where the block is described, since the comment drifted while the standard was silent on it.
5. **Decisions 1 and 2's mutation runs, already covered: `agent-os/standards/testing/tests.md` line 27** (red before green). For a check over behaviour the code already has, rounds 2 and 4 of this PR showed red by a temporary mutation restored before the commit. No change.
6. **Decision 5, already covered: `agent-os/standards/process/release.md` line 5.** One bump per PR, and this PR already carries it. No change.
7. **Decision 6, already covered: `agent-os/standards/process/docs-gate.md` lines 5 and 8.** A test file is not in a Docs-step directory, a file restored before the commit is not altered, and a comment-only change names its section with "no reader-facing change" and the reason. No change.

No pattern was invented outside `agent-os/standards/`. Tasks 2, 3 and 5 use section 15's existing helpers (`fenced`, `cand`, `go`, `covArgs`, `body`, `two`, `settledAll`, `f`).
