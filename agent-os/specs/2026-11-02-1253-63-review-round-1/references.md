# References for PR #63 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened while shaping.

## The original spec

### Short aliases `/redline` and `/redline-revise` (#44)

- **Location:** `agent-os/specs/2026-11-02-1015-44-short-aliases-redline-and-redline-revise/` (`shape.md`, `plan.md`)
- **Relevance:** decision 3 (a file of that name is compared and a person's own is left alone, on any run) answers R1-2. Decision 8 (`RUN_LINE` names `/redline-revise ...` beside the namespaced form) answers R1-4. Plan Task 7 holds the narrower sentence that was built.
- **Key patterns:** the setup-test case style for `command`, the red-first loop check.

## The code each finding names

### R1-1, R1-2: the setup skill

- **Location:** `skills/setup/SKILL.md`, lines 19-25 (the inventory), 71, 143, 145-162 (step 12), 164-175 (Verify, Hand back); `git show main:skills/setup/SKILL.md` for the old numbering.
- **Relevance:** the stale pointer, and the fresh-versus-rerun branch the subcommand does not share.

### R1-2, R1-3: `redline-setup.sh command`

- **Location:** `scripts/redline-setup.sh`, lines 26-32 (header) and 280-325 (`cmd_command`).
- **Relevance:** the status comes from the file alone (`absent`, `unchanged`, `differs`, `foreign`). An absent file is written unless `--dry-run`, and a dry run creates nothing.

### R1-3: the setup test

- **Location:** `tests/setup-test.sh`, lines 502-536 (the `command` block; 504 the fresh write, 528-529 the dry run on an absent file) and 555-567 (the this-checkout block).
- **Key patterns:** the `checks.sh` cases above line 566 work on `$WORK` copies; the alias cases should not write either.

### R1-4: `RUN_LINE` and its pin

- **Location:** `workflows/redline-loop.js:261`; `tests/loop-test.mjs:1228-1240` (`word`, the two relay checks, `samePrefix`); `skills/redline/SKILL.md:3`, `:211`, `:247` (the description's variants, the relaunch rule); `README.md:192` (the relayed-line paragraph).
- **Relevance:** the skill's relaunch set is what `RUN_LINE` should list.

## Model for this folder

- **Location:** `agent-os/specs/2026-11-02-0932-62-review-round-1/` (`plan.md`, `shape.md`, `standards.md`)
- **Relevance:** the last Redline round on this repository. Its As built records the implementer's fixed commit wording for Task 1 and the standards commit, which this plan uses.
