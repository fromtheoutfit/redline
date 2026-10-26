# References for PR #37 review round 2

Shaped by Redline in unattended mode.

## Similar Implementations

### `judge()` and the check loop

- **Location:** `workflows/redline-loop.js` (`errorText()` 929-935, `judge()` 968-1015, the check loop 1445-1471)
- **Relevance:** line 1013 builds the warning R2-1 rewords. Line 1003 skips the `checks.sh exited` fallback when every failing check was failing at baseline, which is how a gate that exited 1 reaches the warning branch. Line 1454 prefixes each verdict warning with `round N:`; line 1471 adds `still failing, as at baseline` after a round that passes.
- **Key patterns:** the other warnings in the file (lines 1132-1755) state what happened in plain terms the person can act on; the reworded warning follows them.

### Loop-test section 9

- **Location:** `tests/loop-test.mjs` (`go()` and its record-commit check 136-156, section 9 446-475)
- **Relevance:** the two checks at lines 465 and 472 pin the warning's exact text; the checks at 463 and 474 are the neighbours that must not change.
- **Key patterns:** red before green by changing the expected string first.

### Round 1 of this PR

- **Location:** `agent-os/specs/2026-10-26-0844-37-review-round-1/` (`shape.md` Decisions, R1-3; `plan.md` Task 4)
- **Relevance:** R1-3's decision ("text is carried as a warning or as detail on a failure the data already established") widened the warning's condition; Task 4 kept the string as it was.

### The documents that already say "a round that passes"

- **Location:** `README.md:226`, `agent-os/standards/workflow/agents.md:15`
- **Relevance:** the wording the warning adopts.

### Statements that keep "passing gate"

- **Location:** `workflows/redline-loop.js:931`, `tests/loop-test.mjs:448-449` and the check name at `:465`, `agents/redline-checker.md:44`
- **Relevance:** each describes a gate that does pass, so none changes (`shape.md`, Unattended answers).
