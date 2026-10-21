# PR #7 review round 1: address R1-1 to R1-10

Shaped by Redline in unattended mode.

## Context

Redline round 1 on PR #7 (the gate stamp, first half of #6) found three correctness issues and seven nits. Eight were planned as fixes by the shaper. Two went to the person, who decided both on 2026-10-21 (see Decisions in `shape.md`): R1-6, refuse when two sections qualify (Task 10), and R1-9, narrow the allow rule to `check` (Task 11).

Every fix in this round must leave this checkout's gate hash where it is. No Redline role may restamp `.claude/redline/checks.sh`, and the gate test's last case (`check` on this checkout) fails if the hash moves. So:

- In the Verification Gate section of `.claude/commands/agent-os/shape-spec.md` (lines 234 to 256), add no backticks and edit none of the existing backticked spans.
- In `scripts/redline-gate.sh`, change neither the parser (`PARSE`) nor the stamp line's format. The one exception is Task 10, which changes only pass 2 (which section is chosen) and the no-gate error JSON: pass 1, `section_end`, pass 3 and the digest stay byte-identical, so a file with one qualifying section hashes exactly as before.
- Add no new `(gate steps` parenthetical anywhere in `shape-spec.md`.

The `gate` check in `checks.sh`'s JSON proves each of these, through its case "the plugin's own checks.sh stamp matches its gate".

Commands for the implementer: the guard does not run `tests/gate-test.sh` for a role directly, so every proof below goes through the gate script. Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1422-7-review-round-1/redline/snapshot.json` and read the named check's `stdout` in its JSON. Every grep below is a plain pipeline run from the repository root.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-21-1422-7-review-round-1/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` is the workflow's and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R1-1, point 11 also defers a fix that moves this checkout's hash

Files: `.claude/commands/agent-os/shape-spec.md` (unattended point 11, line 69), `README.md` (Known limits, line 147).

- **`shape-spec.md`, point 11.** Append one sentence after "...and a person edits the gate and restamps after the run.". Suggested wording:

  > So is a fix in `scripts/redline-gate.sh` that changes how the hash is computed (what counts as an item, how items are normalised or joined) or how the stamp line is written: either one moves this checkout's stamp, so it is `defer`, mitigated the same way, and a person changes the script, repins the fixture hashes in `tests/gate-test.sh` and restamps after the run.

  Point 11 sits outside the gate section, so backticks are fine here. Do not write the words "(gate steps" in it.
- **`README.md:147`.** The last sentence of the "A run on this repository runs the PR's own code" bullet ends "...is deferred to a person too." Extend it. Suggested wording:

  > ...so a finding whose fix changes the gate's backticked text in `shape-spec.md`, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line, is deferred to a person too.

Proof:
- The `gate` check passes, including "the plugin's own checks.sh stamp matches its gate". That case shows the hash did not move.
- `grep -c "how the stamp line is written" .claude/commands/agent-os/shape-spec.md` prints 1.
- `grep -c "writes the stamp line" README.md` prints 1.

## Task 3: R1-2, rule 7's self-hosted exception names checks.sh

Files: `agents/redline-shaper.md` (rule 7, line 25).

Rule 7 ends: "When the repository is the plugin itself (its checkout loaded in place), the plugin's source is repository content planned like any other file, except `scripts/redline-guard.sh` and `hooks/hooks.json`: a finding there is `defer`, as the repository's unattended-mode section says."

Change the exception so it matches point 11. Suggested wording:

> ...except `scripts/redline-guard.sh`, `hooks/hooks.json` and `.claude/redline/checks.sh`: a finding there, or one whose fix needs `checks.sh` restamped, is `defer`, as the repository's unattended-mode section says.

The rest of rule 7 stays as it is: outside the self-hosted case a finding on `.claude/redline/` is still `ask`, and `.claude/settings*.json` and `.claude/redline*.json` stay `ask` everywhere.

Proof:
- The `validate` check (`claude plugin validate .`) passes.
- `grep -c "hooks/hooks.json. and .\.claude/redline/checks.sh" agents/redline-shaper.md` prints 1.

## Task 4: R1-3, gate step 6 stops restating the baseline time

Files: `.claude/commands/agent-os/shape-spec.md` (gate step 6's continuation line, line 246).

`agent-os/standards/testing/tests.md` keeps the baseline time in `checks.sh`'s header. Drop the second copy and point to the header. Replace the closing sentence "About 20 seconds on 2026-10-21, almost all of it the guard table." with plain prose. Suggested wording:

> The script's header records the baseline time, almost all of it the guard table.

This line is inside the gate section. Use no backticks, and leave the line's existing span (`.claude/redline/checks.sh --baseline`) exactly as it is.

Proof:
- The `gate` check passes, including "the plugin's own checks.sh stamp matches its gate".
- `grep -c "About 20 seconds" .claude/commands/agent-os/shape-spec.md` prints 0.

## Task 5: R1-4, Upgrading covers a PR branch cut before the stamp

Files: `README.md` (Upgrading, line 32).

Insert one sentence before "Until `/redline:setup` exists (the second half of #6), that is the whole upgrade." Suggested wording:

> A PR branch cut before that commit reached its base carries no stamp, and a launch on it stops with the same line: merge the base into the branch, or stamp it on the branch and commit and push, before launching on it.

The reason: the precheck reads `checks.sh` from the checkout, which must be the PR's head, clean (`skills/redline/SKILL.md` section 4, items 3 to 5).

Proof: `grep -c "PR branch cut before that commit" README.md` prints 1.

## Task 6: R1-5, the template writes the restamp command out

Files: `scripts/checks-template.sh` (header, lines 29 to 33).

Replace "restamp it with the command in the TODO line." with the command itself, as this repository's `checks.sh` does at lines 38 and 39:

```
# file up to date with a changed gate, restamp it:
# <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
# redline-gate: TODO  stamp it: <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

Three constraints:
- The `# redline-gate: TODO` line stays the header's last line.
- No other line may start with `# redline-gate:`. Both `stamp` and `check` act on the first such line.
- The header stays an unbroken run of `#` lines up to the blank line. `--help` prints up to that blank line, and `stamp` inserts after that run.

Proof:
- The `syntax` check passes.
- `grep -c "command in the TODO line" scripts/checks-template.sh` prints 0.
- `grep -c "^# redline-gate:" scripts/checks-template.sh` prints 1.

## Task 7: R1-7, `stamp ... --steps` with no value exits 2 with a reason

Files: `tests/gate-test.sh`, `scripts/redline-gate.sh` (`cmd_stamp`, line 241).

Red first:
1. In `tests/gate-test.sh`, after the case "--steps malformed: exit 2" (line 171), add two cases:
   - `expect_exit "--steps with no value: exit 2" 2 stamp "$SPEC" --steps`
   - `expect_exit "--steps with an empty value: exit 2" 2 stamp "$SPEC" --steps ""`
2. Run the gate and see both FAIL in the `gate` check's output. Today the first exits 1, because `shift 2` fails under `set -e`. The second exits 0, because the empty value falls back to the default range.

Then the fix: the `--steps)` arm refuses a missing or empty value with a one-line reason on stderr and exit 2, and only then reads `$2` and shifts. For example:

```
--steps) [[ $# -ge 2 && -n "$2" ]] || { echo "redline-gate: --steps needs a value, <m>-<n>" >&2; exit 2; }; range="$2"; shift 2 ;;
```

Touch nothing in `PARSE`, `STAMP` or the stamp line.

Two existing cases are the neighbours that must not change: "no parenthetical, --steps given: exit 0" and "--steps overrides the default".

Proof: the `gate` check passes, with both new cases `ok` and both neighbours `ok`.

## Task 8: R1-8, the precheck's references to section 1

Files: `skills/redline/SKILL.md` (section 4, lines 73 and 79).

- Line 73: "On exit 2, stop as step 1 does" becomes "On exit 2, stop as section 1 does".
- Line 79: "which step 1 established is inside the checkout" becomes "which section 1 established is inside the checkout".

Proof:
- `grep -c "section 1 does\|section 1 established" skills/redline/SKILL.md` prints 2.
- The `validate` check passes.

## Task 9: R1-10, `differs` requires two real hashes

Files: `tests/gate-test.sh` (the helpers at lines 50 to 53, and one new case after the "# extract: no gate" block, lines 98 to 104).

Red first:
1. Split the comparison out of `differs` into a helper that only returns a status, keeping today's logic. For example, `hashes_differ <file a> <file b>` compares `sha` of the two files. `differs` then calls it and records ok or bad as now.
2. Add a case after `nogate.md` is created (line 99). It asserts that `hashes_differ plugin-shape.md nogate.md` is false, and records `ok "differs: a copy with no gate is not a change"` if so, `bad` otherwise.
3. Run the gate and see that case FAIL: today an empty hash differs from the pinned one.

Then the fix: `hashes_differ` is true only when both outputs are 64 lowercase hex characters and they are not equal. The bad message shows both values.

The four cases at lines 137 to 143 that rely on `differs` must stay `ok`. They show that each mutated fixture still parses.

Proof: the `gate` check passes, with the new case `ok` and every existing `differs` case `ok`.

## Task 10: R1-6, the gate script refuses when two sections qualify

Decided by @michaelfromtheoutfit on 2026-10-21: option (a). When more than one "verification gate" section holds a numbered list, `extract`, `stamp` and `check` refuse and name the heading lines, so a stamp can never move silently to the plan-template task. No `--heading-line` flag: it waits until a repository needs one.

Files: `tests/gate-fixtures/two-gates-shape.md` (new), `tests/gate-test.sh`, `scripts/redline-gate.sh` (pass 2 of `PARSE`, `cmd_check`, the header comment), `README.md` ("Gate stamp" under `checks.sh`: the paragraph listing the precheck's stop lines, and the subcommand table).

Red first:
1. Create `tests/gate-fixtures/two-gates-shape.md`: a copy of `tests/gate-fixtures/plugin-shape.md` in which the plan-template task `## Task N: Verification Gate` (inside the column-0 fence, before the real gate) holds a numbered list, the form Losers League uses. For example, replace its prose line with two numbered items, item 1 running the backticked `.claude/redline/checks.sh --baseline` and item 2 the standards retrospective. Nothing else changes: the top-level `## Verification Gate` stays as it is.
2. In `tests/gate-test.sh`, add a block `echo "# two qualifying sections"` before `echo "# this checkout"` (line 231). Set `T="$WORK/two-gates-shape.md"` and compute the two heading lines with `grep -n` (the `Task N` heading and the `^## Verification Gate` heading). Cases:
   - `expect_exit "two gates: extract exits 1" 1 extract "$T"`
   - `expect_stderr "two gates: extract names both heading lines" "<first line>.*<second line>" extract "$T"` (both line numbers in one stderr line)
   - `expect_exit "two gates: stamp exits 1" 1 stamp "$T" --steps 1-1`, and a `cmp -s` case showing a stamp into a copy of `checks-no-stamp.sh` leaves the file byte-identical ("two gates: stamp writes nothing").
   - For `check`: `cp "$P" "$SPEC"`, stamp `$CHECKS` from it, then `cp "$T" "$SPEC"`. Then `expect_exit "two gates: check exits 1" 1 check "$REPO"`, `expect_json "two gates: check's own reason" '.reason' "two gates" check "$REPO"`, `expect_stderr "two gates: check names both heading lines" "<first line>.*<second line>" check "$REPO"`, and "two gates: exactly one stderr line", written the way "mismatch: exactly one stderr line" is (line 213).
   - Neighbours that must not change, already in the file: "plugin: the top-level heading, not the decoy in the Step 7 fence" (line 64), "fenced: the later prose decoy is not chosen" (line 96), "no gate: one line names the problem" (line 101), the three pinned hashes (lines 108 to 110), and "the plugin's own checks.sh stamp matches its gate" (line 232).
3. Run the gate and see the new cases FAIL in the `gate` check's output: today the template task is chosen silently, so `extract` and `stamp` exit 0 and `check` reports "gate changed".

Then the fix, in `scripts/redline-gate.sh`:
- **Pass 2 of `PARSE`** (lines 108 to 121): collect every heading that passes today's test (same regex, same fence rule, same `section_end`, same `LIST1` scan) instead of breaking on the first. None: today's `{"error": "no verification gate section with a numbered list"}` and exit 1, unchanged. More than one: print `{"error": ..., "reason": "two gates", "lines": [<heading line numbers, 1-based>]}` and exit 1, where `error` names every qualifying heading with its line, for example `two verification gate sections hold a numbered list, the headings at lines 30 ("Task N: Verification Gate") and 50 ("Verification Gate"); rewrite one so only the gate holds a numbered list`. Exactly one: `chosen` is that one, and pass 3 and the digest run as now.
- **`extract_to`** needs no change: it already prints the parser's `error` on one stderr line with the file name and exits 1, which `extract` and `stamp` inherit, so `stamp` writes nothing.
- **`cmd_check`** (the `no gate` branch, lines 312 to 314): read `.reason` from the parser's JSON. For `two gates`, `check_fail "two gates"` with one stderr line: `the verification gate in $path is ambiguous: <the parser's error>; rewrite one of them, then run check again`. Anything else keeps today's `no gate` reason and line.
- **The header comment**: "The gate is the first heading whose text contains ..." becomes "The gate is the one heading whose text contains ...", plus a sentence that when more than one qualifies, every subcommand exits 1 naming each heading line, and `check`'s reason is `two gates`. The exit-code paragraph adds "or two qualifying sections" to extract's and stamp's 1, and to check's 1.

In `README.md`, "Gate stamp" under `checks.sh`:
- The precheck's list of stop lines gains the `two gates` line, and "stops on either line" becomes "stops on any of these lines".
- The table's `extract` row: "the first "verification gate" heading" becomes "the one "verification gate" heading"; its exit column becomes "0; 1 when the file has no gate, or two sections qualify". `stamp`'s 1 reads "1 no gate or two"; `check`'s 1 adds "two gates".

Constraints: the stamp line's format, `STAMP`, pass 1, `section_end`, pass 3 and the digest are untouched; no edit to `.claude/commands/agent-os/shape-spec.md`. Only one section qualifies in this checkout, so its hash does not move.

Proof:
- The `gate` check passes, with every new case `ok`, every neighbour above `ok`, and "the plugin's own checks.sh stamp matches its gate" `ok` (the hash did not move).
- The `syntax` check passes.
- `grep -c "two gates" README.md` prints at least 1.

## Task 11: R1-9, the allow rule pre-approves only `check`

Decided by @michaelfromtheoutfit on 2026-10-21: narrow the rule to `check`, so every restamp prompts a person. The precheck (`${CLAUDE_PLUGIN_ROOT}/scripts/redline-gate.sh check <repoRoot>`, `skills/redline/SKILL.md:73`) still matches the narrowed rule and never prompts.

Files (in the run): `templates/settings.allow.json` (line 15).

- `"Bash(/*/scripts/redline-gate.sh *)"` becomes `"Bash(/*/scripts/redline-gate.sh check *)"`. No other line changes; the `redline-gh.sh` and `redline-prefs.sh` rules stay blanket.

Not in the run: `.claude/settings.json` (line 7) carries the same rule, and no Redline role may write that file (`tests/guard-cases.tsv:366`). The author edits that line to the same narrowed rule by hand when reviewing the round. The implementer does not touch it and does not report it as blocked; the As built section notes it as the person's step. `/redline:setup` adds its own rule when it lands.

Proof:
- `jq -e . templates/settings.allow.json` exits 0.
- `grep -c 'redline-gate.sh check \*' templates/settings.allow.json` prints 1.
- `grep -c 'redline-gate.sh \*' templates/settings.allow.json` prints 0.

## Task 12: Verification Gate

Gate steps 1 to 6, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1422-7-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 7 and 8 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 7, standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver approves the list. The implementer applies it in its own commit, touching only the files the list names: `agent-os/standards/scripts/guard.md`, `agent-os/standards/testing/tests.md` and `agent-os/standards/scripts/bash-conventions.md` (items 4 and 5, drafted after the person's decisions on R1-9 and R1-6). No item is held any longer.
- **Step 8, spec folder.** `plan.md` gets an As built section, and any deviation is recorded under Decisions in `shape.md`.

## As built

Every task landed as planned, one commit per finding, and the gate is green with "the plugin's own checks.sh stamp matches its gate" `ok`: this checkout's hash did not move.

- **Task 7 (R1-7), Task 9 (R1-10), Task 10 (R1-6)** went red first in the `gate` check: the two `--steps` cases (exit 1 and exit 0), the "a copy with no gate is not a change" case, and six of the eight two-gates cases, as the plan predicted.
- **Task 10, cmd_check's line.** The `no gate` branch the plan cites at lines 312 to 314 is at 315 to 316, as the plan approver noted. The parser's error already ends with "rewrite one so only the gate holds a numbered list", so `check`'s `two gates` line reads `the verification gate in <path> is ambiguous: <the parser's error>, then run check again` instead of repeating "rewrite one of them". The error counts the sections ("2 verification gate sections ...") rather than spelling "two", so it stays true for three. The README's stop line quotes this wording.
- **Task 10, the stamp-writes-nothing case** stamps into a copy of `checks-no-stamp.sh` in the temp directory and compares it with the fixture copy, so nothing touches the repository under test.
- **Task 11, not in the run.** `.claude/settings.json` line 7 still carries `Bash(/*/scripts/redline-gate.sh *)`. The author narrows it to `Bash(/*/scripts/redline-gate.sh check *)` by hand when reviewing the round; no Redline role may write that file.
- **Standards retrospective.** The five approved edits landed in one commit, with the text from `shape.md`'s proposed list. No finding's fix runs through it, so its message names none.
