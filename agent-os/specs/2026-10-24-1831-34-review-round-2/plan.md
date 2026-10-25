# PR #34 review round 2 (launch 2026-10-24-1831): address R2-1

Shaped by Redline in unattended mode.

## Context

Redline round 2 on PR #34 (large PRs, #33; round numbering, first half of #10) reviewed only the round 1 fix diff (`2744c4b..dafef60`) and found no correctness issue and one nit, R2-1: the `--help` case added for R1-2 is named for the header's last line but matches a line four lines before it. This is the final nit round; the plan covers that nit only. R2-1 is planned as a fix. Nothing is deferred and nothing is returned as a judgment call. See `shape.md`.

Constraints for every task:

- **Files no role may write stay untouched:** `scripts/redline-guard.sh`, `hooks/hooks.json`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `.claude/settings*.json`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, and the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`. No task here needs them.
- A file a task does not name is not changed in this round. In particular `scripts/redline-gh.sh` is not changed: its `usage()` is already right (`sed -n '2,/^$/p'`, line 50).
- One commit per finding, in task order; the spec folder in the round's first commit or on its own.
- **Commands for the implementer.** The guard does not let a role run the harnesses directly, so every harness result comes from the gate script: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-24-1831-34-review-round-2/redline/snapshot.json` and read the `gh` check's `stdout` in its JSON. Every other proof is a plain `grep` from the repository root. At the start of the round the summary was `gh 47 passed, 0 failed` (round 1 As built).

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-24-1831-34-review-round-2/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` is the workflow's and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R2-1, the `--help` case checks the header's real last line

Files: `tests/gh-test.sh`.

`gh --help` prints `sed -n '2,/^$/p'` of `scripts/redline-gh.sh`: lines 2 to 47, where line 47 is the blank line that ends the range. The last non-blank line is line 46, `#                                  unless it already exists (a re-run keeps the first, older body)`. The case at `tests/gh-test.sh:143` matches `update <n> <title|-> <file> [<copy>]`, which is line 42, so a cut between lines 42 and 46 would still pass it.

- **`tests/gh-test.sh:143`**: replace the line with

  ```bash
  has "usage: --help prints the writes section to its last line" "$(grep -v '^$' "$WORK/err" | tail -1)" "unless it already exists (a re-run keeps the first, older body)"
  ```

  The haystack is the last non-blank line of the captured stderr, so the case fails both when the header is cut before line 46 and when the text is no longer the header's last line. `tail -1` alone would read the blank line 47, which `sed` prints as the end of its range, so the blank lines are dropped first. Keep the case name, the `has` helper (a fixed-string containment check, line 30) and the two neighbouring cases at lines 142 and 144 unchanged.

Red before green does not apply in the usual way: the script is already right (R1-2 fixed it in `cb40600`), so the tightened case passes on the first run. It replaces a case, so the count stays the same.

Proof:
- The `gh` check passes with `47 passed, 0 failed`, and its `stdout` has the line `ok   usage: --help prints the writes section to its last line`.
- `grep -cF 'older body)"' tests/gh-test.sh` prints 1.
- `grep -cF '"update <n> <title|-> <file> [<copy>]"' tests/gh-test.sh` prints 0.

## Task 3: Verification Gate

Gate steps 1 to 8, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-24-1831-34-review-round-2/redline/snapshot.json` until it exits 0; its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 9 and 10 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 9, standards retrospective.** The proposed edit is under `## Standards retrospective (proposed)` in `shape.md`. The standards approver approves the list, and the implementer applies it in its own commit, touching only the file the list names: `agent-os/standards/testing/tests.md`. If the approver approves no edit, the implementer records "Standards retrospective: no changes" under Decisions in `shape.md` instead.
- **Step 10, spec folder.** `plan.md` gets an As built section, and any deviation is recorded under Decisions in `shape.md`.

## As built

Commits, in task order: the spec folder (`5bca2ad`), R2-1 (`72ebef0`), and the standards retrospective (`61f02e2`), which applies the one approved edit, a new bullet in `agent-os/standards/testing/tests.md` after the empty-comparison bullet. Its message names no finding: R2-1's plan in `shape.md` does not send part of its fix through the retrospective, so the edit is a lesson.

Task 2 passed on its first run, as the plan predicted. Proofs: the gate's `gh` check printed `47 passed, 0 failed` with `ok   usage: --help prints the writes section to its last line`; `grep -cF 'older body)"' tests/gh-test.sh` printed 1 and `grep -cF '"update <n> <title|-> <file> [<copy>]"' tests/gh-test.sh` printed 0.

Deviations: none.
