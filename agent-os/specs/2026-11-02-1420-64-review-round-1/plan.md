# PR #64 Review Round 1 — Plan

Shaped by Redline in unattended mode. Two findings: R1-1 is `fix` (a same-length hunk conflicts line by line, so a pick settles only its line). R1-2 (what catches a body change that left the marker unbumped) was returned to the person as a judgment call; they chose pinned hashes (Decided by: @michaelfromtheoutfit), planned as Task 3. Nothing is deferred.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. The harnesses run through `.claude/redline/checks.sh`: read the `setup` entry of its JSON (`exit`, and the `N passed, M failed` line in its output). The PR description gives the count before this round: setup 438 passed. If the count you see before Task 2 differs, record it under As built and judge the red and green runs by the change from it (four new failures, then ten more passes).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before any finding's commit. Never stage anything under its `redline/` folder in this commit.

**Files:**

- `agent-os/specs/2026-11-02-1420-64-review-round-1/plan.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-1/shape.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-1/standards.md`
- `agent-os/specs/2026-11-02-1420-64-review-round-1/references.md`

**Commit:** `redline: save review round 1 spec for PR #64 (#15)`

## Task 2: R1-1 — a same-length hunk conflicts line by line, red first

**Files:** `tests/setup-test.sh` (first), `scripts/redline-setup.sh`.

1. **Red first.** `tests/setup-test.sh`: insert the block below after line 632 (the last adjacency case, `check "adjacent changes: the hand edit kept" ...`) and before the blank line and `# --keep: the marker alone.` at 634. It reuses `$V4` (line 605), `$WORK/u-before.md` (line 318) and `$WORK/u-hand.md` (line 351, line 1 hand-edited). It changes fixture copies with `sed ... > <copy>`, never `sed -i` (`testing/tests.md:23`).

   ```bash
   # A conflicting line beside a one-sided change in the same hunk (#64, R1-1): the conflict is that line
   # alone, so a pick settles it and the change beside it comes through whichever side is picked.
   AC="$WORK/adj-conflict.md"; sed -e 's/^1\. \*\*Plan mode\.\*\*.*/1. **Plan mode.** HAND EDIT kept./' -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** HAND EDIT two./' "$WORK/u-before.md" > "$AC"
   REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "a conflict beside a hand edit: one conflict, that line alone" '[(.conflicts|length|tostring), (.conflicts[0].base|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs|length|tostring), (.conflicts[0].ours[0]|test("HAND EDIT kept")|tostring)] | join(",")' "1,1,1,1,true" unattended "$AC" "${FILL[@]}"
   REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "a conflict beside a hand edit, --pick 1=theirs: written" '[.changed, .written] | join(",")' "true,true" unattended "$AC" "${FILL[@]}" --merge --pick 1=theirs
   check "a conflict beside a hand edit, --pick 1=theirs: the template's line taken" grep -q 'TEMPLATE REWORDED' "$AC"
   check "a conflict beside a hand edit, --pick 1=theirs: the hand edit beside it kept" grep -q 'HAND EDIT two' "$AC"
   # The mirror: the template also rewords line 2, which the section left alone; --pick 1=ours keeps the
   # hand edit on line 1 and still takes the template's line 2.
   V4B="$WORK/v4b"; mkdir -p "$V4B/history"; cp "$V4"/history/shape-spec-unattended.v*.md "$V4B/history/"
   sed 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** TEMPLATE REWORDED TWO./' "$V4/shape-spec-unattended.md" > "$V4B/shape-spec-unattended.md"
   AO="$WORK/adj-ours.md"; cp "$WORK/u-hand.md" "$AO"
   REDLINE_UNATTENDED_TEMPLATE="$V4B/shape-spec-unattended.md" expect_json "a conflict beside a template change: one conflict, that line alone" '[(.conflicts|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs[0]|test("TEMPLATE REWORDED\\.")|tostring)] | join(",")' "1,1,true" unattended "$AO" "${FILL[@]}"
   REDLINE_UNATTENDED_TEMPLATE="$V4B/shape-spec-unattended.md" expect_json "a conflict beside a template change, --pick 1=ours: written" '[.changed, .written] | join(",")' "true,true" unattended "$AO" "${FILL[@]}" --merge --pick 1=ours
   check "a conflict beside a template change, --pick 1=ours: the hand edit kept" grep -q 'HAND EDIT kept' "$AO"
   check "a conflict beside a template change, --pick 1=ours: the template's line beside it taken" grep -q 'TEMPLATE REWORDED TWO' "$AO"
   ```

   That is ten cases. Today four fail: the two "one conflict, that line alone" cases (the conflict holds two lines), "the hand edit beside it kept" and "the template's line beside it taken" (the pick replaced both lines). The other six pass.
2. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-1/redline/snapshot.json`. Its `setup` entry must read `444 passed, 4 failed` (from 438), with exactly the four cases above failing. Record the counts and the four names under As built.
3. **Then the fix.** `scripts/redline-setup.sh`, inside the single-quoted `PY_UNATTENDED` string, so the new text holds no single quote (`bash-conventions.md:22`; the string spells one as `\x27`):
   - Lines 508-509, the comment above `merge3`. Replace:

     ```
     # merge3(base, ours, theirs): a diff3 over matching blocks. A hunk changed on one side is taken from that
     # side; changed the same way on both, once; changed differently, a conflict, left as ("conflict", n).
     ```

     with:

     ```
     # merge3(base, ours, theirs): a diff3 over matching blocks. A hunk changed on one side is taken from that
     # side; changed the same way on both, once; changed differently, a conflict, left as ("conflict", n):
     # in a hunk of one length on every side, each line changed differently on both is a conflict alone,
     # so a pick settles that line and never the lines beside it (#64, R1-1); any other hunk is one conflict.
     ```

   - Lines 535-537. Replace:

     ```
             elif len(cb) == len(co) == len(ct) and all(x == y or x == z or y == z for x, y, z in zip(cb, co, ct)):
                 # Adjacent lines changed on different sides: a same-length hunk merges line by line.
                 out.extend(z if y == x else y for x, y, z in zip(cb, co, ct))
     ```

     with:

     ```
             elif len(cb) == len(co) == len(ct):
                 # A same-length hunk merges line by line: adjacent lines changed on different sides both come
                 # through, and only a line changed differently on both sides is a conflict, that line alone.
                 for x, y, z in zip(cb, co, ct):
                     if y == x or y == z:
                         out.append(z)
                     elif z == x:
                         out.append(y)
                     else:
                         conflicts.append({"n": len(conflicts) + 1, "base": [x], "ours": [y], "theirs": [z]})
                         out.append(("conflict", len(conflicts)))
     ```

     Keep the indentation of the surrounding branches (eight spaces before `elif`). Change nothing else: the `else` at 538-540 stays for hunks whose lengths differ, and `rendered`, the picks and the stderr lines are unchanged.
4. Run the same `checks.sh` command. Its `setup` entry must read `448 passed, 0 failed`. The existing conflict cases (lines 608-624), the adjacency cases (628-632) and the dogfood merge over this checkout's section (597-602) stay green: for a hunk with no conflicting line the new loop gives what `z if y == x else y` gave.
5. Proof: `grep -n "a conflict alone" scripts/redline-setup.sh` prints the new comment line; `grep -c "that line alone" tests/setup-test.sh` prints `2`.

**Docs (gate step 10):** `scripts/redline-setup.sh`, no reader-facing change. The script's header (lines 50-51: "a line changed in both differently is a conflict"), README "Upgrading" ("asking per conflicting line"), the `redline-setup.sh` table's `unattended` row ("a line changed differently on both sides a conflict settled by `--pick`") and `skills/setup/SKILL.md` step 10 ("On a conflict, ask per number") already describe the per-line behaviour; the code now matches them. No new config key, subcommand, flag, allow rule, JSON key or exit code.

**Commit:** `redline: R1-1 conflict a same-length hunk line by line so a pick settles only its line (#15)`

## Task 3: R1-2 — pin each unattended body's sha256 by version, so a body change without a bump fails

Decided by the person: **Pinned hashes** (shape.md, Decisions, R1-2). The options returned were a git-history check, pinned hashes and accept; the git-history check and its `.github/workflows/gate.yml` change are not part of this round.

**Files:** `tests/setup-test.sh` (only).

1. **Red first.** `tests/setup-test.sh`: insert the block below after the history checks, that is after the line `[[ ! -e "$UHIST/shape-spec-unattended.$UV.md" ]] && ok "history: the current version is not frozen" || ...` (line 662 before Task 2's insertion, which moves it down) and before the blank line and `echo "# version"`. In this red step every pin line holds `pending` in place of a hash. It is outside `PY_UNATTENDED`, so single quotes are fine; it uses `shasum -a 256` (on macOS and on the Ubuntu runner alike; `sha256sum` is not on macOS, `bash-conventions.md` on BSD and GNU tools), no bash 4 feature, and changes fixture copies only with `sed ... > <copy>` or `awk ... > <copy>` in `$WORK` (`testing/tests.md:23`). The versions in the fixtures are derived from `UV` and `UN`; only the pins are spelled, which is the exception item 3 of the standards retrospective writes down.

   ```bash
   # Every unattended body is pinned by version (#64, R1-2): the sha256 of the lines after the first ---
   # line, for the current template and each frozen copy under templates/history/. A body change that left
   # the marker where it was, or an edit to a frozen copy, fails here. A bump adds its version's line below,
   # which is the reminder to freeze the previous body in the same commit; the older lines never change.
   ubody_pin() {
       case "$1" in
           v1) echo "pending" ;;
           v2) echo "pending" ;;
           v3) echo "pending" ;;
       esac
   }
   # ubody_sha <file>: the sha256 of the file's body, the lines after its first --- line.
   ubody_sha() { awk 'f { print } /^---$/ { f = 1 }' "$1" | shasum -a 256 | awk '{ print $1 }'; }
   # ubody_ok <template> <history dir>: every version's body matches its pin; prints the first that does not.
   ubody_ok() {
       local t="$1" h="$2" v n got want
       v="$(grep -m1 '^<!-- redline-unattended: v' "$t" | sed 's/^<!-- redline-unattended: \(v[0-9]*\) -->.*/\1/')"
       for ((n=1; n<${v#v}; n++)); do
           want="$(ubody_pin "v$n")"; got="$(ubody_sha "$h/shape-spec-unattended.v$n.md")"
           [[ -n "$want" && "$got" == "$want" ]] || { echo "v$n (frozen): pinned ${want:-nothing}, got $got; a frozen copy never changes"; return 1; }
       done
       want="$(ubody_pin "$v")"; got="$(ubody_sha "$t")"
       [[ -n "$want" && "$got" == "$want" ]] || { echo "$v (current): pinned ${want:-nothing}, got $got; a body change bumps the marker, freezes the previous body under templates/history/ and pins the new version here"; return 1; }
   }
   msg="$(ubody_ok "$UT" "$UHIST")" && ok "history: every unattended body matches its pinned hash ($UV and the frozen copies)" || bad "history: every unattended body matches its pinned hash ($UV and the frozen copies)" "$msg"
   # A reworded body line under the same marker fails, naming the current version.
   PN="$WORK/pin-nobump"; mkdir -p "$PN/history"; cp "$UHIST"/shape-spec-unattended.v*.md "$PN/history/"
   sed 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** REWORDED WITHOUT A BUMP./' "$UT" > "$PN/shape-spec-unattended.md"
   msg="$(ubody_ok "$PN/shape-spec-unattended.md" "$PN/history")"; rc=$?
   [[ $rc -ne 0 && "$msg" == "$UV (current):"* ]] && ok "pins: a body change without a bump fails, naming $UV" || bad "pins: a body change without a bump fails, naming $UV" "exit $rc: $msg"
   # An edit to the previous version's frozen copy fails, naming that version.
   PF="$WORK/pin-frozen"; mkdir -p "$PF/history"; cp "$UT" "$PF/shape-spec-unattended.md"; cp "$UHIST"/shape-spec-unattended.v*.md "$PF/history/"
   awk '{ print } END { print "A FROZEN EDIT." }' "$UHIST/shape-spec-unattended.v$((UN-1)).md" > "$PF/history/shape-spec-unattended.v$((UN-1)).md"
   msg="$(ubody_ok "$PF/shape-spec-unattended.md" "$PF/history")"; rc=$?
   [[ $rc -ne 0 && "$msg" == "v$((UN-1)) (frozen):"* ]] && ok "pins: an edit to a frozen copy fails, naming v$((UN-1))" || bad "pins: an edit to a frozen copy fails, naming v$((UN-1))" "exit $rc: $msg"
   # A bump done right (marker bumped, previous body frozen) with no new pin still fails: the bump touches the test.
   PB="$WORK/pin-bump"; mkdir -p "$PB/history"; cp "$UHIST"/shape-spec-unattended.v*.md "$PB/history/"; cp "$UT" "$PB/history/shape-spec-unattended.$UV.md"
   sed -e "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** REWORDED WITH A BUMP./' "$UT" > "$PB/shape-spec-unattended.md"
   msg="$(ubody_ok "$PB/shape-spec-unattended.md" "$PB/history")"; rc=$?
   [[ $rc -ne 0 && "$msg" == "v$((UN+1)) (current): pinned nothing"* ]] && ok "pins: a bump with no pin for v$((UN+1)) fails" || bad "pins: a bump with no pin for v$((UN+1)) fails" "exit $rc: $msg"
   ```

   The `case` holds one line per version from `v1` to the current `$UV` (today `v1`, `v2`, `v3`); if the marker reads otherwise when you start, write one line per version it implies. That is four cases. With the pins at `pending`, all four fail: the checkout's case and the three fixture cases stop at `v1 (frozen): pinned pending`, so none names the version it expects.
2. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-1/redline/snapshot.json`. Its `setup` entry must read `448 passed, 4 failed` (Task 2's green count), with exactly the four cases above failing. Record the counts and the four names under As built.
3. **Then the pins.** Compute each body's hash with the same pipeline the test uses, one per file, from the repository root: `awk 'f { print } /^---$/ { f = 1 }' templates/history/shape-spec-unattended.v1.md | shasum -a 256`, the same for `templates/history/shape-spec-unattended.v2.md` and for `templates/shape-spec-unattended.md` (the current `$UV`). Replace each `pending` in `ubody_pin` with its 64-hex hash. Change no template file and no frozen copy: the pins record the bodies as they are.
4. Run the same `checks.sh` command. Its `setup` entry must read `452 passed, 0 failed`.
5. Proof: `grep -c 'echo "pending"' tests/setup-test.sh` prints `0`; `grep -c '^        v[0-9]*) echo "[0-9a-f]\{64\}" ;;$' tests/setup-test.sh` prints the current version's number (`3` today); the green run's `setup` output lists the four new case names as `ok`.

**Docs (gate step 10):** `tests/setup-test.sh` is not under a Docs directory. No reader-facing change: README "Contributing" does not describe the bump rule, and the template header (`templates/shape-spec-unattended.md:24-29`, "tests/setup-test.sh checks every version below the current one is frozen") stays true and is not edited, so no template file changes. No new config key, subcommand, flag, allow rule, JSON key or exit code.

**Commit:** `redline: R1-2 pin each unattended body's hash so a body change without a bump fails (#15)`

## Task 4: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings. Item 3 (R1-2, pinned hashes) is drafted and is judged like the others.

**Files:**

- `agent-os/standards/scripts/bash-conventions.md` (line 38: items 1 and 3)
- `agent-os/standards/testing/tests.md` (after line 22: item 2; line 28: item 3)

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the round 1 review lessons in the standards (#15)`

## Task 5: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-1420-64-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** Expect `setup` at 452 passed, 0 failed (ten cases added by Task 2, four by Task 3); every other harness at its count before the round.

10. **Docs:** confirm each entry names its commit or its reason:
    - Task 2 (`scripts/redline-setup.sh`, no reader-facing change: the header, README "Upgrading", the `redline-setup.sh` table and the setup skill already say a conflict is a line);
    - Task 3 and Task 2's cases (`tests/setup-test.sh`), not a Docs directory.
    No new config key, subcommand, allow rule or exit code.
11. **Standards retrospective:** Task 4, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder:** add an "As built" section to this file with Task 2's and Task 3's red counts and failing names, their green counts, the three pinned hashes, and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-1420-64-review-round-1/plan.md`, `agent-os/specs/2026-11-02-1420-64-review-round-1/shape.md`.

**Commit:** `redline: record PR #64 round 1 as built (#15)`
