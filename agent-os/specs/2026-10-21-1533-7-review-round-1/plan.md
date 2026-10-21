# PR #7 review round 1 (launch 2026-10-21-1533): address R1-11 to R1-14

Shaped by Redline in unattended mode.

## Context

This launch's Redline round 1 on PR #7 (the gate stamp, first half of #6) found one correctness issue and three nits. Two are planned as fixes (R1-11, R1-12), one as a deferral with a mitigation (R1-14), and one was decided by the person (R1-13: the failing checks share one output budget, split in a final pass, with the live copy in `.claude/redline/checks.sh` carried by the author after the round). See `shape.md`.

Constraints for every task:

- This checkout's gate hash must not move: no Redline role may restamp `.claude/redline/checks.sh`. Do not edit `.claude/commands/agent-os/shape-spec.md` or `scripts/redline-gate.sh` in this round. The `gate` check's case "the plugin's own checks.sh stamp matches its gate" proves it.
- `.claude/redline/checks.sh` is not changed by any role. Its copy of `run_check` (R1-13, R1-14) is a person's change after the run; do not report it as blocked.

Commands for the implementer: every proof goes through the gate script or a plain `grep` run from the repository root. Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1533-7-review-round-1/redline/snapshot.json` and read the named check's `stdout` in its JSON.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-21-1533-7-review-round-1/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` is the workflow's and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R1-11, setup stamps checks.sh after step 5 adds the parenthetical

Files: `README.md` (Set up a repository, steps 1 and 5, lines 38 and 42).

`stamp` with no `--steps` reads its range from the unattended section's `(gate steps M to N` parenthetical, which step 5 adds, so step 1's command exits 2 on a new repository.

- **Step 1 (line 38).** Replace the sentence starting "Then stamp it:" with one that leaves the TODO line for later. Suggested wording:

  > Leave the header's `# redline-gate: TODO` line as it is: it is stamped in step 5, once the unattended section gives the stamp its step range.

- **Step 5 (line 42).** After "Start from `templates/shape-spec-unattended.md`.", add the stamp. Suggested wording:

  > Then stamp `checks.sh`: `<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` replaces the header's `# redline-gate: TODO` line with the gate's hash, taking the step range from point 7's `(gate steps M to N` parenthetical (see "Gate stamp"). The unattended section sits outside the gate, so adding it never moves the hash.

Leave Upgrading (lines 24 to 32), step 7 and `scripts/checks-template.sh`'s TODO line unchanged.

Proof:
- `grep -c "it is stamped in step 5" README.md` prints 1.
- `grep -c "Then stamp it:" README.md` prints 0.
- `grep -c "taking the step range from point 7" README.md` prints 1.

## Task 3: R1-12, the Gate stamp paragraph says which steps move the hash

Files: `README.md` (Gate stamp, line 226), `tests/gate-test.sh` (the "# hash: backticked edits fire" block, after line 154).

- **`README.md:226`.** Replace "Prose outside backticks never changes it; any backticked change does, so a step added, removed, reordered or given a new flag moves the hash." Suggested wording:

  > Prose outside backticks never changes it; any backticked change does, so adding or removing a step that holds a backticked span or a fenced block moves the hash, as does giving one a new flag or swapping two such steps. A step written wholly in prose changes nothing when it is added, removed or moved, so a command step keeps its command in backticks.

  The rest of the paragraph stays as it is.

- **`tests/gate-test.sh`.** Pin the stated behaviour beside its neighbour. After the case `expect_json "a step added: eight steps" ...` (line 154), add a prose-only step and assert the hash is unchanged while the step count grows:

  ```
  awk '/^Only after all seven pass/{print "8. **Review** — read the diff once more before reporting."} {print}' "$P" > "$WORK/proseadded.md"
  same "a step with no backticks added: hash unchanged" plugin-shape.md proseadded.md
  expect_json "a step with no backticks added: eight steps" '.steps | length' "8" extract "$WORK/proseadded.md"
  ```

  The two cases pass on today's code: they pin behaviour the README now states, not a bug. The neighbour that must not change is "a step added" (line 153), which must still differ.

Proof:
- The `gate` check passes, with both new cases `ok`, "a step added" `ok`, and "the plugin's own checks.sh stamp matches its gate" `ok`.
- `grep -c "written wholly in prose" README.md` prints 1.
- `grep -c "so a step added, removed, reordered" README.md` prints 0.

## Task 4: R1-14 (defer), `truncated` covers the byte cap and the README contract matches the template

Files: `scripts/checks-template.sh` (`run_check`, lines 93 to 108), `README.md` (Output contract, line 194, and the bullets after it, lines 209 to 214).

Mitigation for a deferred finding: the live copy in `.claude/redline/checks.sh` is a person's change after the run (see Deferred in `shape.md`). Do not touch it.

- **`scripts/checks-template.sh`.**
  - Count each stream's bytes next to its lines, for example `out_bytes=$(wc -c <"$work/$name.out")` and `err_bytes=$(wc -c <"$work/$name.err")`, declared `local` with the line counts.
  - `truncated` is true when either stream has more lines than `keep` or more bytes than `cap`: add the two byte comparisons to the existing `[[ ... ]]` condition on line 104.
  - The comment above (lines 93 to 95) gains: `truncated` is true when either limit cut a stream.
  - Keep `keep=20`, `keep=200` and `cap=16384` as they are; R1-13 decides whether they change.
- **`README.md`, the contract line (194).** Show the template's numbers and the field. Suggested wording:

  ```
  {"name": "check", "cmd": "composer check", "exit": 0, "recorded": false, "truncated": false, "stdout": "the last 20 lines, 200 when the check failed, at most 16 KB", "stderr": "the same"}
  ```

- **`README.md`, the bullets (after line 212, the `recorded: true` bullet).** Add one. Suggested wording:

  > - `truncated: true` marks a check whose stdout or stderr was cut, by the line count (20, or 200 for a failing check) or by the 16 KB cap. Nothing in the workflow reads it yet.

Proof:
- The `syntax` check passes (`bash -n` over `scripts/*.sh`).
- `grep -c "wc -c" scripts/checks-template.sh` prints 2.
- `grep -c "last 200 lines" README.md` prints 0.
- `grep -c '"truncated": false' README.md` prints 1.
- `grep -c "truncated: true" README.md` prints 1.

No harness runs the template's `run_check`, so there is no red-first case: the template's TODO checks print one line each and cannot reach either limit.

## Task 5: R1-13, the failing checks share one 16 KB output budget, split in a final pass

Files: `scripts/checks-template.sh` (`run_check`, lines 80 to 109, the comment Task 4 extended, and the final `jq -n` that assembles `checks`, lines 264 to 269), `README.md` (Output contract: the contract line and the `truncated` bullet Task 4 wrote).

Decided by @michaelfromtheoutfit, option (b): one total budget shared by the failing checks, split evenly among them in a final pass rather than consumed in run order. Do it after Task 4; it replaces the byte comparison Task 4 added to `truncated`. The same change in `.claude/redline/checks.sh` is the author's, by hand after the round (see Deferred in `shape.md`). Do not touch it, and do not report it as blocked.

- **`scripts/checks-template.sh`, `run_check`.** Keep running the check and logging as today, but stop writing its JSON there. Record what the final pass needs instead: append one line per check (name, exit code, recorded flag, and the command) to a file in `$work`, for example a `jq -c` object to `$work/checks.ran.jsonl`, leaving `$work/$name.out` and `$work/$name.err` in place.
- **`scripts/checks-template.sh`, a final pass before the closing `jq -n`.** A function, for example `emit_checks`, run once after every check (and the git block) has finished:
  - Count the failing checks, those with exit not 0 (the same condition that sets `keep=200` today), as `n`.
  - Each failing check's share is `budget / n` bytes, with `budget=16384` declared once beside `keep`, as integer division. Within a check, stderr gets at most half the share and stdout the rest, so a check with an empty stderr gives its whole share to stdout. One failing check alone keeps today's 16 KB.
  - For each recorded check in run order, write its JSON object to `$checks_json` as `run_check` does today: a failing check's streams are `tail -n 200 | tail -c <its allotment>`; a passing check keeps its last 20 lines with the existing 16 KB cap, outside the budget.
  - `truncated` is true when either stream has more lines than `keep` or more bytes than the allotment it was cut to (for a passing check, the 16 KB cap), replacing the byte comparison Task 4 added against `cap`.
  - The closing `jq -n` reads `$checks_json` as it does today. `--git-only` mode runs no checks, so the pass writes nothing and `checks` stays `[]`.
- **The comment above the caps.** Rewrite it to say what bounds the whole result: a passing check keeps its last 20 lines (at most 16 KB); the failing checks keep up to 200 lines each and share one 16 KB budget, split evenly among them after every check has run, so the result stays well under the Bash tool's inline limit however many fail; `truncated` is true when a line count or a byte allotment cut a stream.
- **`README.md`, the contract line.** Replace the `stdout` and `stderr` values Task 4 wrote. Suggested wording:

  ```
  {"name": "check", "cmd": "composer check", "exit": 0, "recorded": false, "truncated": false, "stdout": "the last 20 lines; a failing check keeps up to 200, within its share of 16 KB", "stderr": "the same"}
  ```

- **`README.md`, the `truncated` bullet.** Replace Task 4's wording with one that names the shared budget. Suggested wording:

  > - `truncated: true` marks a check whose stdout or stderr was cut, by the line count (20, or 200 for a failing check) or by bytes. The failing checks share one 16 KB budget, split evenly among them once every check has run (stderr takes at most half of a check's share), so the result stays bounded however many fail; a passing check is cut at 16 KB. Nothing in the workflow reads `truncated` yet.

Proof:
- The `syntax` check passes (`bash -n` over `scripts/*.sh`).
- `grep -c "budget=16384" scripts/checks-template.sh` prints 1.
- `grep -c "emit_checks" scripts/checks-template.sh` prints 2 (the definition and the call), or the name the implementer chose, the same count.
- `grep -c "share one 16 KB budget" README.md` prints 1.
- `grep -c "within its share of 16 KB" README.md` prints 1.
- Task 4's README proofs still hold (`"truncated": false` and `truncated: true` each print 1, `last 200 lines` prints 0). Its `wc -c` count may change once the byte counts move into the final pass; that grep is Task 4's proof, checked before this task.
- The `gate` check's case "the plugin's own checks.sh stamp matches its gate" stays `ok`: nothing here touches the gate or `.claude/redline/checks.sh`.

No harness runs the template's `run_check` (as in Task 4), and the guard does not let a role run the template directly, so there is no red-first case; the template's TODO checks print one line each and cannot reach the budget. A harness for the budget would have to be added to `.claude/redline/checks.sh`, which no role may write.

## Task 6: Verification Gate

Gate steps 1 to 6, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1533-7-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 7 and 8 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 7, standards retrospective.** The proposed edits are under `## Standards retrospective (proposed)` in `shape.md`. The standards approver approves the list. The implementer applies it in its own commit, touching only the files the list names: `agent-os/standards/scripts/bash-conventions.md` and `agent-os/standards/scripts/guard.md`. Item 3 (R1-13, the shared budget) is drafted now that the person has decided, and goes to the standards approver with the others; it touches only `agent-os/standards/scripts/bash-conventions.md`.
- **Step 8, spec folder.** `plan.md` gets an As built section, and any deviation is recorded under Decisions in `shape.md`.
