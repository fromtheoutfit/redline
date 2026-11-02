# PR #62 Review Round 1 — Plan

Shaped by Redline in unattended mode. One finding, `fix`: R1-1 (the `read-checks` docs regex stops a var default at its first `)`). No judgment calls, nothing deferred.

Snapshot for the gate: `/Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0932-62-review-round-1/redline/snapshot.json`.

Every command below is a plain pipeline run from the repository root. The setup test runs through `.claude/redline/checks.sh`: read the `setup` entry of its JSON (`exit`, and the `N passed, M failed` line in its output).

---

## Task 1: Save spec documentation

Commit the spec folder on its own, before the finding's commit:

- `agent-os/specs/2026-11-02-0932-62-review-round-1/plan.md`
- `agent-os/specs/2026-11-02-0932-62-review-round-1/shape.md`
- `agent-os/specs/2026-11-02-0932-62-review-round-1/standards.md`
- `agent-os/specs/2026-11-02-0932-62-review-round-1/references.md`

Never stage anything under its `redline/` folder in this commit.

**Files:** the four above.

**Commit:** `redline: shape PR #62 review round 1 (#18)`

## Task 2: R1-1 — the docs regex's default tail runs to the last `)` on the line

**Files:** `tests/setup-test.sh`, `scripts/redline-setup.sh`.

**Red first** (testing/tests line 22: a bug fix lands red before green).

1. `tests/setup-test.sh`: insert these lines right after the "a header generated before #18 (ENV=identifier) still yields the doc" case (line 394) and before `jq '.input' <<<"$RC" > "$WORK/laravel-bootstrap.json"` (line 395). Copy them exactly:

   ```bash
   # A var default may hold a parenthesis (checks.json refuses only " $ ` \ }), so the reader's
   # "(default ...)" tail runs to the last ")" on the line (#62, R1-1).
   jq '.vars[0].default = "tcp(db)/x"' "$LJ" > "$WORK/paren-default.json"
   "$SETUP" checks "$WORK/paren-default.json" "$WORK/paren-default.sh" >/dev/null 2>&1
   expect_json "read-checks: a default holding a parenthesis stays out of the doc and reads back whole (#62, R1-1)" '[.input.vars[0].doc, .input.vars[0].default] | join("|")' "scratch database for the migrations check|tcp(db)/x" read-checks "$WORK/paren-default.sh"
   sed -e 's/^#   REDLINE_MIGRATE_DB=[^ ]*   /#   REDLINE_MIGRATE_DB=migrate_db   /' -e 's#(default chalkboard_redline_migrate)$#(default a)b)#' "$LC" > "$WORK/old-paren-default.sh"
   expect_json "read-checks: a header generated before #18 with a default holding a parenthesis still yields the doc alone (#62, R1-1)" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/old-paren-default.sh"
   ```

   The first case generates a header from a `checks.json` whose default holds a parenthesis and reads it back. The second is a `sed` copy of the generated Laravel file in the temp directory (testing/tests line 30), in the pre-#18 `ENV=identifier` form, with a default that closes a parenthesis early.

   The neighbours that must not change are already in the table: "a hand-written var line without its default still yields the doc" (line 392), "a header generated before #18 (ENV=identifier) still yields the doc" (line 394), and "input recovers the whole checks.json" (line 396).
2. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0932-62-review-round-1/redline/snapshot.json`.
   - The `setup` entry must show exactly the two new cases failing. The first gets `scratch database for the migrations check (default tcp(db)/x)|tcp(db)/x`; the second gets `scratch database for the migrations check (default a)b)`.
   - Every other setup case must pass. Record the counts under As built.

**Then the fix.**

3. `scripts/redline-setup.sh`, line 958, in `PY_READ`: change the tail `(?:\s+\(default [^)]*\))?\s*$` to `(?:\s+\(default .*\))?\s*$`. Leave the rest of the pattern unchanged. The line becomes:

   ```python
       m = re.match(r"^#   ([A-Z_][A-Z0-9_]*)=(?:<name>|[A-Za-z_][A-Za-z0-9_]*)\s+(.*?)(?:\s+\(default .*\))?\s*$", l)
   ```

4. `scripts/redline-setup.sh`, the comment above it (lines 956-957). Replace it with these three lines:

   ```python
       # ENV=<name> (generated since #18) or ENV=<identifier> (generated before it); the "(default ...)"
       # tail is optional, since a hand-written header may carry it on the next line, and runs to the
       # last ")" on the line, since a default may hold one (#62, R1-1).
   ```

   `PY_READ` is a single-quoted bash string (it opens at line 917), so the new text must contain no `'`. Neither line above has one.
5. Run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0932-62-review-round-1/redline/snapshot.json` until it exits 0. The `setup` entry must show 0 failed, with two more passed than before this round (the PR description reports 299, so 301).

**Docs (gate step 10):** `scripts/redline-setup.sh` has no reader-facing change. The fix makes the existing descriptions true for a default that holds a parenthesis, without changing what they say:

- README "`checks.sh`" (line 227): "`redline-setup.sh read-checks` reads a `checks.sh` back into this shape".
- README "`redline-setup.sh`", the `read-checks` row (line 332).
- The script's own header (lines 63-67): "a var's doc with or without its "(default ...)"".

No new subcommand, config key, allow rule or exit code. `tests/setup-test.sh` is not under a Docs directory, and its README row (line 163) does not list cases.

**Commit:** `redline: R1-1 read a var default holding a parenthesis back out of the doc (#18)`

## Task 3: Standards retrospective (as approved)

Apply the edits the standards approver approves from `shape.md`'s "Standards retrospective (proposed)", in one commit of their own. Keep each file's headings.

**Files:** `agent-os/standards/scripts/bash-conventions.md` (line 40).

If the approver approves none, change no file and record "Standards retrospective: no changes" under Decisions in `shape.md`, in the as-built commit.

**Commit:** `redline: record the PR #62 round 1 lesson in the standards (#18)`

## Task 4: Verification Gate

Gate steps 1 to 9: **run `.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-11-02-0932-62-review-round-1/redline/snapshot.json` until it exits 0; its JSON is the evidence.** The `setup` check must show 0 failed, with passed equal to the count before this round plus the two new cases.

10. **Docs:** confirm the entry names its reason: Task 2 (`scripts/redline-setup.sh`, no reader-facing change: README "`checks.sh`" line 227, README "`redline-setup.sh`" `read-checks` row, and the script header already describe the round trip the fix restores).
11. **Standards retrospective:** Task 3, as approved, or "Standards retrospective: no changes" under Decisions in `shape.md`.
12. **Spec folder:** add an "As built" section to this file with the red counts from Task 2 step 2, the green count, and any deviation. Record each deviation under Decisions in `shape.md` too. This lands in the round's last commit.

**Files:** `agent-os/specs/2026-11-02-0932-62-review-round-1/plan.md`, `agent-os/specs/2026-11-02-0932-62-review-round-1/shape.md`.

**Commit:** `redline: record PR #62 round 1 as built (#18)`

---

## As built

- **Task 1:** the spec folder's four files, committed alone; nothing under `redline/` staged.
- **Task 2, red:** with the two new cases in `tests/setup-test.sh` and no fix, the gate's `setup` entry showed `299 passed, 2 failed`. Exactly the two new cases failed, with the values the plan predicted: `scratch database for the migrations check (default tcp(db)/x)|tcp(db)/x` and `scratch database for the migrations check (default a)b)`. Every other check exited 0.
- **Task 2, green:** after the tail became `(?:\s+\(default .*\))?\s*$` and the comment the three lines the plan gives, the gate exited 0 with `setup` at `301 passed, 0 failed`. The test and the fix went in one commit, `redline: R1-1 read a var default holding a parenthesis back out of the doc (#18)`.
- **Task 3:** the approved edit to `agent-os/standards/scripts/bash-conventions.md` line 40, applied as worded, in its own commit. It is a lesson only (R1-1's fix is whole in Task 2), so the message names no finding.
- **Task 4:** the gate exits 0; the Docs entry in Task 2 names its reason (no reader-facing change).
- **Deviation:** two commit messages follow the implementer's fixed wording for Redline rounds rather than the plan's: Task 1 is `redline: save review round 1 spec for PR #62 (#18)` (the plan said `redline: shape PR #62 review round 1 (#18)`), and Task 3 is `redline: record the round 1 review lessons in the standards (#18)` (the plan said `redline: record the PR #62 round 1 lesson in the standards (#18)`). The commits' contents are as planned.
