# References for PR #64 Review Round 2

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## The earlier specs

### Unattended-section version marker and merge (#15)

- **Location:** `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/shape.md`
- **Relevance:** decision 14 ("a hunk of one length on every side whose lines each changed on at most one side is merged line by line") is the intent R2-1's fix restores for hunks whose lines do not line up.

### PR #64 review round 1

- **Location:** `agent-os/specs/2026-11-02-1420-64-review-round-1/` (`shape.md`, `plan.md`)
- **Relevance:** R1-1 introduced the per-line split R2-1 narrows; its Task 2 cases (the conflict beside a hand edit and its mirror) are the neighbouring decision that must not change; its As built gives the starting count (setup 450 passed).
- **Key patterns:** the fixture recipe (`$V4/history`, a fake newer template derived from `UN`, `sed ... > <copy>`), reused here.

## The code the finding names

### `merge3` and the rendering of a pick

- **Location:** `scripts/redline-setup.sh`, lines 36-61 (the `unattended` header, 50-51 the merge sentence), 369 (`PY_UNATTENDED` opens, single-quoted), 508-552 (`merge3`: the anchors at 513-519, the hunk bounds at 527-532, the same-length branch at 537-547, the whole-hunk conflict at 548-550), 631-645 (`rendered`).
- **Relevance:** the branch at 537 pairs by position with no alignment condition; `rendered` extends the picked side of a conflict whole.
- **Before R1-1:** `git show 0775112:scripts/redline-setup.sh`, line 535, the branch with its `all(...)` condition.

### The setup test

- **Location:** `tests/setup-test.sh`, lines 23-28 (`UT`, `UV`, `UN`, `UHIST`), 297-321 (the fresh insert, `u-before.md`), 351 (`u-hand.md`), 567-602 (the v1 merge and the dogfood merge), 604-648 (the conflict, adjacency and R1-1 cases, `$V4`, `$V4B`), 650 (`# --keep`).
- **Key patterns:** `expect_json` with `REDLINE_UNATTENDED_TEMPLATE` as a plain env prefix; `ok`, `bad`, `check` (lines 32-59).

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r2-merge3.py`
- **Relevance:** a verbatim copy of `merge3` at `f67708c` over the finding's inputs; read, not run (the guard refuses `python3` to the shaper).

## Reader-facing text

- `README.md`, line 36 (Upgrading, "asking per conflicting line", stays true) and line 334 (the `redline-setup.sh` table's `unattended` row, "a same-length hunk merged line by line", narrowed by Task 2).
- `skills/setup/SKILL.md`, step 10 ("On a conflict, ask per number", stays true).

## Standards and product

- `agent-os/standards/index.yml`, `agent-os/standards/testing/tests.md`, `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/process/docs-gate.md`, `agent-os/standards/process/standards-retrospective.md`, `agent-os/standards/prompts/attribution.md`.
- `agent-os/product/roadmap.md`, Phase 1 item 1.
