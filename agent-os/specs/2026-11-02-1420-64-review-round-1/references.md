# References for PR #64 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## The original spec

### Unattended-section version marker and merge (#15)

- **Location:** `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/` (`shape.md`, `plan.md`)
- **Relevance:** `shape.md` decision 14 (a same-length hunk merged line by line, "a line changed differently on both sides still conflicts") answers R1-1's question. `plan.md` decision 3 (the frozen-copy check) is the half of the bump rule that is tested; R1-2 is the other half, which it does not address.
- **Key patterns:** the conflict-case fixtures in its Task 4 (`$WORK/v4`, the reworded "Plan mode" line), reused here.

## The code each finding names

### R1-1: `merge3` and the rendering of a pick

- **Location:** `scripts/redline-setup.sh`, lines 36-61 (the `unattended` header), 508-542 (`merge3`), 617-655 (the three sides, `rendered`, `--pick`, `--merge`).
- **Relevance:** the `all(...)` guard at 535 and the whole-hunk conflict at 538-540; `rendered` extends a conflict's `ours` or `theirs` whole.

### R1-1, R1-2: the setup test

- **Location:** `tests/setup-test.sh`, lines 20-28 (`TV`, `UV`, `UN`, `UHIST`), 297-321 (the fresh insert, `u-before.md`), 351 (`u-hand.md`), 604-632 (the conflict and adjacency cases, `$V4`), 655-662 (the history checks).
- **Key patterns:** `expect_json` with `REDLINE_UNATTENDED_TEMPLATE` as a plain env prefix; fixture copies made with `sed ... > <copy>`.

### R1-2: the template's bump rule and CI's checkout

- **Location:** `templates/shape-spec-unattended.md`, lines 24-29 (the header's marker paragraph); `.github/workflows/gate.yml`, lines 36-39 (`actions/checkout@v4` with no `fetch-depth`, so a shallow clone).
- **Relevance:** the rule is stated as a convention; a git-history check would see one commit in CI.

## Reader-facing text that already describes the fixed behaviour

- `README.md`, line 36 (Upgrading, "asking per conflicting line") and line 334 (the `redline-setup.sh` table's `unattended` row).
- `skills/setup/SKILL.md`, line 132 (step 10, "On a conflict, ask per number").

## Standards and product

- `agent-os/standards/index.yml`, `agent-os/standards/testing/tests.md`, `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/process/docs-gate.md`, `agent-os/standards/process/standards-retrospective.md`, `agent-os/standards/prompts/attribution.md`.
- `agent-os/product/roadmap.md`, lines 7 and 13.
