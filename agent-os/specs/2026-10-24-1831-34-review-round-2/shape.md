# PR #34 review round 2 (launch 2026-10-24-1831) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The one finding of Redline round 2 on PR #34 (large PRs, #33, and the round-numbering half of #10): R2-1, a nit in `tests/gh-test.sh`. The round reviewed only the round 1 fix diff (`2744c4b..dafef60`, `redline/round-2-findings.json`) and found no correctness issue, so this is the final nit round. Nothing else is in scope. R2-1 is planned as a fix.

## Unattended answers

- **What are we building?** A tighter assertion in one gh-test case, from the finding. Nothing in `scripts/redline-gh.sh` changes.
  Decided by: redline
- **Visuals?** None; a test change.
  Decided by: redline
- **References?** The R1-2 case it tightens (`tests/gh-test.sh:139-144`, added in `cb40600`), the header it checks (`scripts/redline-gh.sh:1-47`) and the round 1 spec (`agent-os/specs/2026-10-24-1831-34-review-round-1/plan.md`, Task 4, which suggested the current needle). See `references.md`.
  Decided by: redline
- **Product context?** `agent-os/product/tech-stack.md:16` lists `tests/gh-test.sh` over `tests/gh-fixtures/` with a fake `gh` among the Bash harnesses; the change stays inside that harness and touches no product behaviour.
  Decided by: redline
- **Standards?** `testing/tests.md` (a tested surface gains a case; red before green), `scripts/bash-conventions.md` (the `--help` header rule the case protects) and `process/standards-retrospective.md`. See `standards.md`.
  Decided by: redline
- **Is the finding real?** Confirmed by reading the file. `scripts/redline-gh.sh:42` is `#   update <n> <title|-> <file> [<copy>]`, the header continues to line 46 (`#                                  unless it already exists (a re-run keeps the first, older body)`), and line 47 is blank. `sed -n '2,/^$/p' scripts/redline-gh.sh | grep -v '^$' | tail -1` prints line 46, while the same pipeline on `sed -n '2,42p'` (a header cut short) prints line 42, which today's needle at `tests/gh-test.sh:143` still matches. So the case named "prints the writes section to its last line" passes on a header cut four lines short.
  Decided by: redline
- **Which of the reviewer's two proposals?** The containment check on the last non-blank line, which combines both. `tail -1` on the raw stderr reads the blank line 47, because `sed -n '2,/^$/p'` prints the line that ends its range (confirmed: the output ends in `body)\n\n`), so the `tail -1` variant as written would compare against an empty line and fail. `has` on the whole output catches a cut but not a header that grows past line 46 without the case following; the last non-blank line catches both, which is what the case name says.
  Decided by: redline
- **Red before green?** `testing/tests.md`: "A bug fix lands red before green". There is no bug in the script: R1-2 already fixed `usage()` (`scripts/redline-gh.sh:50`, `sed -n '2,/^$/p' "$0" >&2`). The change tightens a passing case, so it passes on its first run; the proof instead shows the needle moved from line 42's text to line 46's.
  Decided by: redline
- **Already tracked?** The only other review-round folder for PR #34 is round 1's (`agent-os/specs/2026-10-24-1831-34-review-round-1/`), which fixed R1-2 and suggested today's needle without discussing it; the finding carries no `knownAs`. It is new.
  Decided by: redline

## Decisions

- **R2-1 · fix.** `tests/gh-test.sh:143` matches the last non-blank line of `--help`'s stderr (`grep -v '^$' "$WORK/err" | tail -1`) against `unless it already exists (a re-run keeps the first, older body)`, keeping the case name, the `has` helper and the neighbouring cases. Likelihood and impact: low; the script is right today, and the loose case only matters if a later edit cuts the header between its last two entries, when `--help` would silently drop the `update` continuation lines and the test would not notice. Cost: one line in one file inside the PR's diff, no new helper. Proportionate.
  Decided by: redline

## Deferred

None.

## Standards retrospective (proposed)

1. **R2-1**: missing from `agent-os/standards/testing/tests.md`. Proposed new bullet after "A comparison of two command outputs passes when both are empty, ...": "A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)".

If the approver declines item 1, record "Standards retrospective: no changes" under Decisions instead.

## Context

- **Visuals:** None
- **References:** `tests/gh-test.sh` (the `# usage` section, lines 137-144, and the `is`/`has` helpers, lines 27-30), `scripts/redline-gh.sh` (header, lines 1-47; `usage()`, line 50), round 1 spec Task 4
- **Product alignment:** N/A beyond `agent-os/product/tech-stack.md:16`

## Standards Applied

- testing/tests — the gh harness is a tested surface; the tightened case replaces the loose one in the same commit; red before green, and why it does not bite here
- scripts/bash-conventions — `sed -n '2,/^$/p'` for `--help`, the rule the case protects
- process/standards-retrospective — the proposed edit above
