# PR #64 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #64 (head `bugfix/15-unattended-section-version-marker-launch-warning-and-a-rerun-that-carries-template-body-changes`, issue #15), two findings:

- **R1-1** (correctness, low): in `merge3` (`scripts/redline-setup.sh:510-542`), a hunk of one length on every side that holds one line changed differently on both sides is reported as one whole-hunk conflict, so `--pick` also overwrites a one-sided change on the neighbouring line in that hunk.
- **R1-2** (nit, low, `needsDecision`, decided by the person: pinned hashes): nothing in `tests/setup-test.sh` fails a change to the template body (or to a frozen copy under `templates/history/`) that leaves the marker where it was.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/`.

## Decisions

### R1-1: fix — a same-length hunk conflicts line by line, so a pick settles only its line

**Investigation.** `merge3` (`scripts/redline-setup.sh:510`) walks matching blocks of base against ours (`bo`) and base against theirs (`bt`). A hunk runs from the first base line not anchored on both sides to the next line anchored on both (`:525-527`). The branch at `:535` merges a hunk of one length on every side line by line only when `all(x == y or x == z or y == z ...)` holds for every line. When a single line fails it, the `else` at `:538-540` appends one conflict holding the whole hunk (`base: cb, ours: co, theirs: ct`) and one `("conflict", n)` placeholder. `rendered(sel)` (`:621-635`) then extends `c["ours"]` or `c["theirs"]` whole, so a pick replaces every line of the hunk.

Traced with the test's own fixtures (`tests/setup-test.sh:300`, `:318`, `:351`, `:605-606`). The fake newer template in `$V4` rewords only `1. **Plan mode.**`. A section that hand-edits both `1. **Plan mode.**` and `2. **No questions.**` gives base `[L1, L2]`, ours `[L1-hand, L2-hand]`, theirs `[L1-tpl, L2]`. L1 is anchored on neither side and L2 only in theirs, so the hunk is `[L1, L2]`. The triple `(L1, L1-hand, L1-tpl)` fails the `all(...)`, so conflict 1 covers both lines, and `--merge --pick 1=theirs` writes `[L1-tpl, L2]`: the hand edit on line 2 is gone. The mirror case (template rewords lines 1 and 2, section hand-edits line 1 only, `--pick 1=ours`) drops the template's line 2. The guard refuses `redline-setup.sh unattended` to the shaper, so the trace was done by reading the code, not by running it. No reviewer reproduction exists for this round: the `reviewer-r1-*` files under `/tmp/redlinerepro/` predate this run's launch and belong to other PRs.

The existing conflict case (`tests/setup-test.sh:607-624`) hand-edits only line 1, so its hunk is one line long and a whole-hunk conflict and a one-line conflict are the same thing; that is why it passes. The adjacency case (`:628-632`) has no conflicting line, so it takes the `all(...)` branch.

**Proportionality.** Likelihood: low. It needs a section with hand edits on two adjacent lines, one of which a later template body also changes. Not observed: the dry runs over Chalkboard's, Losers League's and Vestmark's sections reported no conflicts (PR description). But it is a normal `/redline:setup` rerun after any future body change, and Chalkboard's section already showed the adjacent shape (original spec, `shape.md` decision 14). Impact when it fires: the person answers "ours" or "theirs" for conflict 1 (`skills/setup/SKILL.md:132`: "On a conflict, ask per number"), believing it is about one line, and a hand edit or a template line next to it is lost without a word. The diff3 rendering in `merged` does show both lines, so a careful reader could notice. Cost: one branch of `merge3` in `scripts/redline-setup.sh` (about ten lines, replacing three), and ten cases in `tests/setup-test.sh`. Both files are already in the PR's diff. No new dependency, no new abstraction, no change to any JSON key, flag or exit code. Proportionate: `fix`.

**The change.** In the branch where the hunk has one length on every side, walk the lines one by one: take theirs when ours equals base or ours equals theirs, take ours when theirs equals base, and when all three differ append a one-line conflict `{n, base: [x], ours: [y], theirs: [z]}` with a `("conflict", n)` placeholder at that line. A hunk whose lengths differ keeps today's whole-hunk conflict. For a conflict-free hunk the result equals today's (`z if y == x else y`), so the dogfood merge over this checkout's section and the adjacency case are unchanged. The script header (`:50-51`), README "Upgrading" and the `redline-setup.sh` table already describe this per-line behaviour (Unattended answer 1), so no reader-facing text changes. The comment above `merge3` (`:508-509`) is reworded to say which conflict is whole-hunk and which is one line.

Decided by: redline

### R1-2: Pinned hashes — what catches a body change that left the marker unbumped

**Option chosen:** Pinned hashes.

**Decision (2026-11-02):** The author chose pinned hashes: setup-test.sh holds a sha256 for the current template body and for each frozen copy, keyed by version, because a hash is a fact about the file, gate-test.sh already pins fixture hashes the same way, and a bump that has to touch the test is the visible reminder to freeze the old body.

Planned as plan.md, Task 3. The standards item held for this decision is drafted as item 3 of the proposed retrospective below.

**The judgment call as returned (why a person: new standard).** A contributor rewords a sentence in templates/shape-spec-unattended.md and forgets to bump the marker from v3 and freeze the old body. Every test passes, because the history checks only look at whether frozen files exist. Chalkboard, Losers League and Vestmark carry a v3 marker, so their launches stay quiet and a /redline:setup rerun calls the section current. The reworded sentence never reaches them. That is the bug #15 fixes, now behind a marker that says all is well. Editing a frozen file under templates/history/ by mistake goes unnoticed the same way, and it silently changes every later merge from that version. Today the bump rule is a convention, written in the template header and bash-conventions.md:38, the same way checks-template.sh's bump rule is.

Options:

1. **Git-history check.** Cost: about 20 lines in tests/setup-test.sh: find the commit that introduced the current marker, and the commit that introduced each frozen file, with git log -S, then compare the body below --- with the working tree. Plus fetch-depth: 0 on the checkout step in .github/workflows/gate.yml (today's clone is shallow, where the check would pass without testing anything), a failure on a shallow clone, and one line in testing/tests.md. Effect: a body change or a frozen-copy edit without a bump fails locally, in the checker's gate and in CI. No version or hash is written into the test, so tests.md:28 ('a template bump changes no test') still holds.
2. **Pinned hashes.** Cost: about 10 lines in tests/setup-test.sh holding a sha256 for each frozen body and for the current body, keyed by version. Every future bump edits one line of the test. tests.md:28 needs an exception. Effect: catches the same two mistakes, works in a shallow clone, and needs no git. A hash written into the test cuts against the derived-versions standard (gate-test.sh already pins fixture hashes inline).
3. **Accept.** Cost: none. Effect: the bump stays a convention in the template header and bash-conventions.md:38, as for checks-template.sh today. A forgotten bump is caught only in review.

Recommendation as returned: add the git-history check to setup-test.sh, plus fetch-depth: 0 on CI's checkout so it is not vacuous there.

**Investigation.** The history checks (`tests/setup-test.sh:655-662`) fail a version below the current one that has no frozen file, and a current version that was frozen by mistake. Nothing compares the body itself. If the template body below `---` changes while the marker stays at the current version, `version_unattended` and `PY_UNATTENDED` read a matching marker, take the match path at `scripts/redline-setup.sh:595-600`, and a repository that already has the section never gets the change, with no warning. This is the #15 bug again, now behind a marker that says the section is current. A later edit to a frozen copy under `templates/history/` changes the base of every `templateDiff`, `handEdits` and merge from that version (`load_history`, `:495-502`; `base_lines`, `:618`), and nothing notices that either.

Neither the PR description nor the original spec answers this (Unattended answer 2). The template header (`templates/shape-spec-unattended.md:24-29`) and `agent-os/standards/scripts/bash-conventions.md:38` state the rule as a convention. `agent-os/standards/testing/tests.md:28` asks for derived versions "so a template bump changes no test". The two simplest checks either cut against that line (a pinned hash) or need full git history, which CI's `actions/checkout@v4` step (`.github/workflows/gate.yml:37-39`, no `fetch-depth`) does not fetch. For `checks-template.sh`, the same rule is left to convention today (`bash-conventions.md:37`). Choosing between them sets a new testing standard, so this goes to the person.

Decided by: @michaelfromtheoutfit

### As built: the starting count and the standards commit's message

`setup` read 436 passed before Task 2, not 438, so every planned count sits two lower (red 442/4 and green 446/0 for Task 2, red 446/4 and green 450/0 for Task 3); the cases and the failing names are as planned. The standards commit names R1-2 (`..., finishing R1-2 (#15)`), because its approved item 3 carries the rest of R1-2's decided fix. See plan.md, As built.

Decided by: redline

## Unattended answers

1. **Is a conflict meant to be the whole hunk or the one line? (R1-1)** Answered by the script's own header and the README. `scripts/redline-setup.sh:50-51`: "a hunk of one length on every side is merged line by line, and a line changed in both differently is a conflict". `README.md:36`, Upgrading: "merges the template's changes in while keeping the hand edits (`redline-setup.sh unattended ... --merge`), asking per conflicting line". `README.md:334`: "a same-length hunk merged line by line, a line changed differently on both sides a conflict settled by `--pick <n>=ours|theirs`". The original spec, `shape.md` decision 14: "a hunk of one length on every side whose lines each changed on at most one side is merged line by line, and a line changed differently on both sides still conflicts". The code is what disagrees, so the fix is in the code.
   Decided by: redline
2. **Does the original spec settle what catches an unbumped body change? (R1-2)** No. Decision 3 of `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/plan.md` (Decided by: @michaelwitwicki) sets only "a setup-test case checks every version below the current has a frozen copy whose marker equals its file name and that the current version is not frozen". It says nothing about a body change without a bump, or about an edit to a frozen copy. That is a new question, and a past decision does not close it.
   Decided by: redline
3. **Known already?** `scripts/redline-gh.sh issues-search "unattended marker bump"`, `"merge3 conflict"` and `"frozen history template"` list only #15 (this PR's own issue) and #16 (release process). Neither mentions a whole-hunk conflict or an unbumped body. This is the PR's first Redline round: `agent-os/specs/` holds no other `*-64-review-round-*` folder. Both findings are new.
   Decided by: redline
4. **Scope, visuals, references, product context.** The scope is the two findings. No visuals. The references are listed in `references.md`. Product context: `agent-os/product/roadmap.md:7` says "each repository keeps its own contract", including "the unattended section in shape-spec", and `:13` says "a rerun changes nothing when nothing drifted". R1-1 keeps a repository's hand edits when a rerun merges. R1-2 is about whether drift in the template itself is caught.
   Decided by: redline
5. **Which standards apply?** `scripts/bash-conventions` (lines 22 and 38), `testing/tests`, `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`, from `agent-os/standards/index.yml`. `scripts/guard` does not apply: no guard change and no new command shape.
   Decided by: redline

## Context

- **Visuals:** None
- **References:** `scripts/redline-setup.sh` (`merge3`, `rendered`, the header), `tests/setup-test.sh` (the conflict, adjacency and history cases), `templates/shape-spec-unattended.md` (the header comment), `.github/workflows/gate.yml`, `README.md` (Upgrading, the `redline-setup.sh` table), `skills/setup/SKILL.md` step 10, and the original spec folder. See `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 items 1 and 7 (quoted above).

## Standards Applied

- scripts/bash-conventions — line 22 (Python inside a script: the `merge3` change stays inside the single-quoted `PY_UNATTENDED` string, so it uses no single quote); line 38 (the three-way merge rule R1-1 makes the code follow)
- testing/tests — red before green (line 22); a tested surface gains a case in the same commit (line 18); fixture copies changed with `sed ... > <copy>`, never `sed -i` (line 23); derived versions, never spelled (line 28, the line R1-2's options turn on)
- process/docs-gate — each touched plugin file names its README section or why there is no reader-facing change
- process/standards-retrospective — the proposed list below
- prompts/attribution — no model or vendor name in commits or spec files

## Standards retrospective (proposed)

1. **R1-1, missing detail** in `agent-os/standards/scripts/bash-conventions.md`, line 38. The bullet already says the merge is "merging a same-length hunk line by line ... and asking on a line changed differently on both sides". The code did not do that when a conflicting line shared the hunk. Proposed: after "asking on a line changed differently on both sides (`--pick <n>=ours|theirs`)" insert "; that line alone is the conflict, so a pick never settles the lines beside it (#64, R1-1)".
2. **R1-1, missing** in `agent-os/standards/testing/tests.md`, after line 22 (red before green). Proposed new bullet: "A merge case pins a conflict's extent, not only its count: #15's conflict case hand-edited one line, so its hunk was one line long and a whole-hunk conflict passed; a case with a one-sided change beside the conflicting line, picked both ways, proves a pick settles that line alone (#64, R1-1)".
3. **R1-2, new standard (drafted for the decision: pinned hashes).** Two edits, the derived-versions line and the bump rule it serves:
   - `agent-os/standards/testing/tests.md`, line 28. After "... fails a bump that forgot to freeze the previous body, or froze the current one (#15)" append: "; the one exception is the unattended body's pinned hashes: `tests/setup-test.sh` holds the sha256 of the body below the first `---` line for every version, the current template's and each frozen copy's (`ubody_pin`), so a body change that left the marker where it was, or an edit to a frozen copy, fails, and a bump adds its version's hash to the test, the visible reminder to freeze the previous body, the way `tests/gate-test.sh` pins its fixture hashes (#64, R1-2)".
   - `agent-os/standards/scripts/bash-conventions.md`, line 38. After "freezes the previous file under `templates/history/shape-spec-unattended.v<N-1>.md` in the same commit" insert ", and pins the new body's sha256 in `tests/setup-test.sh` (#64, R1-2)".
