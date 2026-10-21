# References for PR #7 review round 2 (launch 2026-10-21-1533)

Shaped by Redline in unattended mode.

## Similar Implementations

### The checks template's final pass

- **Location:** `scripts/checks-template.sh` (the comment above the caps 78-84, `run_check` 88-109, `emit_checks` 111-149)
- **Relevance:** R2-1. `emit_checks` divides the 16 KB budget among the failing checks and splits each share between stdout and stderr (`:124-131`); `truncated` compares each whole stream with its allotment (`:137-141`).
- **Key patterns:** each stream is cut by `tail -n "$keep" | tail -c "<allotment>"`; `err_kept` is counted the same way the cut is made, so `out_kept` follows it.

### This repository's live `checks.sh`

- **Location:** `.claude/redline/checks.sh:100-101`
- **Relevance:** R2-1's deferral. It still carries the per-check cap from before round 1 (`local keep=20 cap=16384`); the author carries round 1's final pass and R2-1's split into it by hand.

### The README's output contract

- **Location:** `README.md:187-215`, the `truncated` bullet at 213
- **Relevance:** R2-1. The parenthetical that states the asymmetric split.

### Round 1 of this launch

- **Location:** `agent-os/specs/2026-10-21-1533-7-review-round-1/` (`shape.md`, R1-13's decision and options; `plan.md`, Task 5 and As built)
- **Relevance:** the effect the person accepted with option (b) ("a single failing check keeps today's 16 KB"), the plan line that set the split ("stderr gets at most half the share and stdout the rest"), and the folder's format.

### The reviewer's scratch reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r2-checks.sh`
- **Relevance:** a verbatim copy of `run_check` and `emit_checks` with synthetic checks (a long stdout, a long stderr, both). The review says it was not run; the shaping note settles the finding by reading.

### The self-hosted deferral rule

- **Location:** `agent-os/standards/scripts/guard.md` (the bullet starting "When the repository is the plugin"), `.claude/commands/agent-os/shape-spec.md:69` (unattended point 11)
- **Relevance:** R2-1's `defer`: a fix to `.claude/redline/checks.sh`'s own lines is a person's, and the run fixes the template and the README.
