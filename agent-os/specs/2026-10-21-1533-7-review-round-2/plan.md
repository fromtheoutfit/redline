# PR #7 review round 2 (launch 2026-10-21-1533): address R2-1

Shaped by Redline in unattended mode.

## Context

This launch's Redline round 2 on PR #7 (the gate stamp, first half of #6) reviewed round 1's fix diff and found no correctness issue and one nit. R2-1 is planned as a deferral with a mitigation: the run makes the template's split symmetric and brings the docs along; the live copy in `.claude/redline/checks.sh` is the author's, by hand after the round. See `shape.md`.

Constraints for every task:

- This checkout's gate hash must not move: no Redline role may restamp `.claude/redline/checks.sh`. Do not edit `.claude/commands/agent-os/shape-spec.md` or `scripts/redline-gate.sh` in this round. The `gate` check's case "the plugin's own checks.sh stamp matches its gate" proves it.
- `.claude/redline/checks.sh` is not changed by any role. Its copy of `emit_checks` (round 1's R1-13 and R1-14, and R2-1 here) is a person's change after the run; do not report it as blocked.

Commands for the implementer: every proof goes through the gate script or a plain `grep`. Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1533-7-review-round-2/redline/snapshot.json` and read the named check's `stdout` in its JSON.

## Task 1: Save spec documentation

Files: `agent-os/specs/2026-10-21-1533-7-review-round-2/` (`plan.md`, `shape.md`, `standards.md`, `references.md`; `redline/` is the workflow's and is left alone).

The shaper has written these four files. Commit the folder in the round's first commit or on its own, never mixed into a finding's commit.

## Task 2: R2-1 (defer), a failing check's unused stream bytes go to the other stream

Files: `scripts/checks-template.sh` (the comment above the caps, lines 78 to 83; `emit_checks`, lines 115 to 131), `README.md` (Output contract, the `truncated` bullet, line 213).

Mitigation for a deferred finding: the live copy in `.claude/redline/checks.sh` is a person's change after the run (see Deferred in `shape.md`). Do not touch it.

- **`scripts/checks-template.sh`, `emit_checks`.**
  - Add `out_kept` to the `local` line (115).
  - In the failing branch, count stdout's kept bytes beside stderr's, and let stderr's cap rise to what stdout leaves when that is more than half the share. Suggested lines, replacing 126 to 131:

    ```
                out_kept=$(tail -n "$keep" "$work/$name.out" | wc -c)
                err_kept=$(tail -n "$keep" "$work/$name.err" | wc -c)
                err_cap=$((share / 2))
                if [[ $((share - out_kept)) -gt $err_cap ]]; then
                    err_cap=$((share - out_kept))
                fi
                if [[ $err_kept -lt $err_cap ]]; then
                    err_cap=$((err_kept))
                fi
                out_cap=$((share - err_cap))
    ```

    That is `err_cap = min(err_kept, max(share / 2, share - out_kept))` and `out_cap = share - err_cap`. Both long: half each, as today. stderr short: stdout gets the rest, as today. stdout short: stderr gets the rest, which is the change. The per-check total stays `share`.
  - The passing branch, the `truncated` condition and the `jq -n` that writes the object stay as they are.
- **`scripts/checks-template.sh`, the comment above the caps (lines 81 to 83).** Replace "within a failing check, stderr takes at most half of its share and stdout the rest." Suggested wording, keeping the sentence that follows it:

  > within a failing check, each stream takes at least half of its share when both are long, and bytes one stream leaves unused go to the other.

- **`README.md:213`, the `truncated` bullet.** Replace the parenthetical "(stderr takes at most half of a check's share)". Suggested wording:

  > (each stream takes at least half of a check's share when both are long, and a short stream's unused bytes go to the other)

  The rest of the bullet stays as it is.

Proof:
- The `syntax` check passes (`bash -n` over `scripts/*.sh`).
- `grep -c "out_kept" /Users/michaelwitwicki/Code/Claude/redline/scripts/checks-template.sh` prints 4 with the suggested lines (the `local` line, the count, the comparison and the assignment).
- `grep -c "at most half" /Users/michaelwitwicki/Code/Claude/redline/scripts/checks-template.sh` prints 0.
- `grep -c "at most half" /Users/michaelwitwicki/Code/Claude/redline/README.md` prints 0.
- `grep -c "at least half" /Users/michaelwitwicki/Code/Claude/redline/scripts/checks-template.sh` prints 1.
- `grep -c "at least half" /Users/michaelwitwicki/Code/Claude/redline/README.md` prints 1.
- The `gate` check's case "the plugin's own checks.sh stamp matches its gate" stays `ok`.

No harness runs the template's `emit_checks` (round 1, Tasks 4 and 5), and the guard does not let a role run the template directly, so there is no red-first case. The template's TODO checks print one line each and cannot reach a share. A harness for the budget would belong in `.claude/redline/checks.sh`, which no role may write.

## Task 3: Verification Gate

Gate steps 1 to 6, in a Redline run: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-21-1533-7-review-round-2/redline/snapshot.json` until it exits 0. Its JSON is the evidence. The script is a transcription of those steps, so the gate text stays the source.

Steps 7 and 8 stay as written in `.claude/commands/agent-os/shape-spec.md`:

- **Step 7, standards retrospective.** The proposed list under `## Standards retrospective (proposed)` in `shape.md` is "no changes": R2-1's lesson is already in `agent-os/standards/scripts/bash-conventions.md` and its deferral in `agent-os/standards/scripts/guard.md`. The standards approver approves the list. With no edits there is no standards commit; `shape.md` already records "Standards retrospective: no changes".
- **Step 8, spec folder.** `plan.md` gets an As built section, and any deviation is recorded under Decisions in `shape.md`.

## As built

- **Task 1.** The four spec files, committed on their own; `redline/` left to the workflow.
- **Task 2 (R2-1, defer).** `emit_checks` in `scripts/checks-template.sh` takes the suggested lines as written: `out_kept` joins the `local` line, and stderr's cap is `min(err_kept, max(share / 2, share - out_kept))`, with `out_cap = share - err_cap` unchanged. The comment above the caps and the README `truncated` bullet take the suggested wording. `.claude/redline/checks.sh` is untouched, as planned.
- **Proof.** `grep -c "out_kept"` on the template prints 4; `grep -c "at most half"` prints 0 on the template and on `README.md`; `grep -c "at least half"` prints 1 on each. The gate's `syntax` check passes, and the `gate` check's case "the plugin's own checks.sh stamp matches its gate" is `ok`.
- **Deviation.** The template comment ends its new sentence with "(#7, R2-1)", since a deferred finding's mitigation names its finding in its code comment; the comment now wraps over four lines instead of three, with "at least half" on one line. No decision turned on it.
- **Task 3.** `checks.sh` passed on its first run after the R2-1 commit: every check exit 0, no unexpected or uncommitted files. Standards retrospective: no changes, so there is no standards commit.
