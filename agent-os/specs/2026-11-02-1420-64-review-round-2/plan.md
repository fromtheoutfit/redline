# PR #64 Review Round 2 — Plan

Shaped by Redline in unattended mode. One finding: R2-1 is `fix` (split a same-length hunk line by line only when its lines line up, so a deletion and an addition inside one hunk stay one conflict). Nothing is deferred and nothing is pending a decision.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-2/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. The harnesses run through `.claude/redline/checks.sh`: read the `setup` entry of its JSON (`exit`, and the `N passed, M failed` line in its output). Round 1's As built gives the count before this round: setup 450 passed, 0 failed. If the count you see before Task 2 differs, record it under As built and judge the red and green runs by the change from it (five more passes and two new failures, then seven more passes than the start).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding's commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-02-1420-64-review-round-2/plan.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-2/shape.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-2/standards.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-2/references.md`

**Commit:** `redline: save review round 2 spec for PR #64 (#15)`

## Task 2: R2-1 — split a same-length hunk line by line only when its lines line up, red first

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh`, `README.md`.

1. **Red first.** `tests/setup-test.sh`: insert the block below after line 648 (the last R1-1 case, `check "a conflict beside a template change, --pick 1=ours: the template's line beside it taken" ...`) and before the blank line and `# --keep: the marker alone.` at 650. It reuses `$V4/history` (line 605: the frozen v1 and v2 plus the current template as `$UV`), `$UT`, `$UV`, `$UN` (lines 23-27) and `$WORK/u-before.md` (line 318: the fresh insert at the current marker with `FILL`). The new template's marker is derived from `UN`, never spelled (`testing/tests.md:29`), and fixture copies are made with `sed ... > <copy>` and `awk ... > <copy>`, never `sed -i` (`testing/tests.md:24`).

   ```bash
   # A same-length hunk whose lines do not line up (#64, R2-1): the section deletes point 1 and adds its own
   # line after point 2, and the template rewords point 2. The section's point 2 sits one line up from the
   # base's, so a split by position would pair different lines and a pick would write point 2 twice or drop
   # the rewording; the hunk stays one conflict, and either pick writes each line once.
   V4C="$WORK/v4c"; mkdir -p "$V4C/history"; cp "$V4"/history/shape-spec-unattended.v*.md "$V4C/history/"
   sed -e "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** TEMPLATE REWORDED TWO./' "$UT" > "$V4C/shape-spec-unattended.md"
   SH="$WORK/shifted.md"; awk '/^1\. \*\*Plan mode\./ { next } { print } /^2\. \*\*No questions\./ { print "2a. HAND ADDED LINE." }' "$WORK/u-before.md" > "$SH"; cp "$SH" "$WORK/shifted-before.md"
   REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor in a same-length hunk: one conflict, the whole hunk" '[(.conflicts|length|tostring), (.conflicts[0].base|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs|length|tostring)] | join(",")' "1,2,2,2" unattended "$SH" "${FILL[@]}"
   REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor, --pick 1=theirs: written" '[.changed, .written] | join(",")' "true,true" unattended "$SH" "${FILL[@]}" --merge --pick 1=theirs
   [[ "$(grep -c '^2\. \*\*No questions' "$SH")" == "1" ]] && ok "a shifted anchor, --pick 1=theirs: point 2 once" || bad "a shifted anchor, --pick 1=theirs: point 2 once" "$(grep -c '^2\. \*\*No questions' "$SH")"
   check "a shifted anchor, --pick 1=theirs: the template's wording" grep -q 'TEMPLATE REWORDED TWO' "$SH"
   cp "$WORK/shifted-before.md" "$SH"
   REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor, --pick 1=ours: written" '[.changed, .written] | join(",")' "true,true" unattended "$SH" "${FILL[@]}" --merge --pick 1=ours
   check "a shifted anchor, --pick 1=ours: the hand-added line kept" grep -q '^2a\. HAND ADDED LINE\.$' "$SH"
   [[ "$(grep -c '^1\. \*\*Plan mode\.' "$SH")" == "0" && "$(grep -c '^2\. \*\*No questions' "$SH")" == "1" ]] && ok "a shifted anchor, --pick 1=ours: point 1 stays deleted, point 2 once" || bad "a shifted anchor, --pick 1=ours: point 1 stays deleted, point 2 once" "$(grep -c '^[12]\. \*\*' "$SH")"
   ```

   That is seven cases. Today two fail: "a shifted anchor in a same-length hunk: one conflict, the whole hunk" (got `1,1,1,1`: the split made a one-line conflict) and "a shifted anchor, --pick 1=theirs: point 2 once" (got `2`: the old and the reworded point 2). The other five pass today, since `--pick 1=ours` writes the same lines from a one-line conflict as from the whole hunk. The R1-1 cases just above (lines 635-648) are the neighbouring decision that must not change: their hunks line up, so they stay one-line conflicts.
2. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-2/redline/snapshot.json`. Its `setup` entry must read `455 passed, 2 failed` (from 450), with exactly the two cases above failing. Record the counts and the two names under As built.
3. **Then the fix.** `scripts/redline-setup.sh`. The `merge3` edits are inside the single-quoted `PY_UNATTENDED` string (it opens at line 369), so the new text holds no single quote; none of the text below does.
   - Lines 50-51, the `unattended` header. Replace:

     ```
     #       edit or deletion) is kept, changed only in the template is taken, a hunk of one length on every
     #       side is merged line by line, and a line changed in both differently is a conflict, numbered under conflicts [{n, base, ours, theirs}] and shown diff3-style in
     ```

     with:

     ```
     #       edit or deletion) is kept, changed only in the template is taken, a hunk of one length on every
     #       side whose lines line up (each anchored line at its own offset) is merged line by line, and a line
     #       changed in both differently is a conflict (in any other hunk changed in both, the whole hunk is), numbered under conflicts [{n, base, ours, theirs}] and shown diff3-style in
     ```

   - Lines 508-511, the comment above `merge3`. Replace:

     ```
     # merge3(base, ours, theirs): a diff3 over matching blocks. A hunk changed on one side is taken from that
     # side; changed the same way on both, once; changed differently, a conflict, left as ("conflict", n):
     # in a hunk of one length on every side, each line changed differently on both is a conflict alone,
     # so a pick settles that line and never the lines beside it (#64, R1-1); any other hunk is one conflict.
     ```

     with:

     ```
     # merge3(base, ours, theirs): a diff3 over matching blocks. A hunk changed on one side is taken from that
     # side; changed the same way on both, once; changed differently, a conflict, left as ("conflict", n):
     # in a hunk of one length on every side whose lines line up, each line changed differently on both is a
     # conflict alone, so a pick settles that line and never the lines beside it (#64, R1-1); any other hunk
     # is one conflict, a same-length one with a base line anchored at another offset on a side included,
     # since pairing its lines by position would pair different lines and a pick would write one twice (#64, R2-1).
     ```

   - Lines 537-539 (the branch and its comment; the edits above move them down by three). Replace:

     ```
             elif len(cb) == len(co) == len(ct):
                 # A same-length hunk merges line by line: adjacent lines changed on different sides both come
                 # through, and only a line changed differently on both sides is a conflict, that line alone.
     ```

     with:

     ```
             elif len(cb) == len(co) == len(ct) and all(bo.get(b + k, o + k) == o + k and bt.get(b + k, t + k) == t + k for k in range(len(cb))):
                 # A same-length hunk whose lines line up (a base line anchored on a side sits at its own offset
                 # there; #64, R2-1) merges line by line: adjacent lines changed on different sides both come
                 # through, and only a line changed differently on both sides is a conflict, that line alone.
     ```

     Keep the indentation (eight spaces before `elif`, twelve before `#`). Change nothing else: the per-line loop below it, the `else` whole-hunk conflict, `rendered`, the picks and the stderr lines stay as they are.
4. `README.md`, line 334, the `redline-setup.sh` table's `unattended` row. Replace the phrase `a same-length hunk merged line by line, a line changed differently on both sides a conflict settled by` with `a same-length hunk whose lines line up merged line by line, a line changed differently on both sides (or any other hunk changed on both) a conflict settled by`. Change nothing else in the row.
5. Run the same `checks.sh` command. Its `setup` entry must read `457 passed, 0 failed`. The R1-1 cases (lines 635-648), the adjacency cases (628-632), the one-line conflict cases (605-624), the v1 merge (568-590) and the dogfood merge over this checkout's section (593-602) stay green: their hunks line up or never reach the branch (shape.md, R2-1, Investigation).
6. Proof: `grep -c "#64, R2-1" scripts/redline-setup.sh` prints `2` (the comment above `merge3` and the branch's comment); `grep -c "a shifted anchor" tests/setup-test.sh` prints `7`; `grep -c "whose lines line up merged line by line" README.md` prints `1`.

**Docs (gate step 10):** `scripts/redline-setup.sh`: README's `redline-setup.sh` table, the `unattended` row, updated in this task's commit (a same-length hunk is split only when its lines line up; any other hunk changed on both sides is one conflict). README "Upgrading" (line 36, "asking per conflicting line") and `skills/setup/SKILL.md` step 10 ("On a conflict, ask per number") stay true and are not edited: a conflict is still numbered and asked about one by one. No template changes. No new config key, subcommand, flag, allow rule, JSON key or exit code.

**Commit:** `redline: R2-1 split a same-length hunk line by line only when its lines line up (#15)`

## Task 3: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings.

**Files:**

- `agent-os/standards/scripts/bash-conventions.md` (line 38: item 1)
- `agent-os/standards/testing/tests.md` (line 23: item 2)

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the round 2 review lessons in the standards (#15)`

## Task 4: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 457 passed, 0 failed (seven cases added by Task 2); every other harness at its count before the round.

10. **Docs:** confirm each entry names its commit or its reason:
    - Task 2 (`scripts/redline-setup.sh`): README's `redline-setup.sh` table, `unattended` row, in Task 2's commit;
    - Task 2's cases (`tests/setup-test.sh`), not a Docs directory.
    No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective:** Task 3, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder:** add an "As built" section to this file with Task 2's red counts and failing names, its green count, the proof outputs and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-1420-64-review-round-2/plan.md`, `agent-os/specs/2026-11-02-1420-64-review-round-2/shape.md`.

**Commit:** `redline: record PR #64 round 2 as built (#15)`
