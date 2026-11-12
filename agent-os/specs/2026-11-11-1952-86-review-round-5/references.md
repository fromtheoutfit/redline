# References for PR #86 Review Round 5

Every file below was opened at `dd42671` while shaping this round. Line numbers are at that commit.

## Similar Implementations

### The set-aside block and its escaping

- **Location:** `workflows/redline-loop.js`: `COVERAGE_OUTCOMES` and `LISTED_ELSEWHERE` with their comments (lines 506 to 513), `reviewBody` (from line 822, with the Findings, Carried forward and Already tracked headings at lines 832 to 856 and the set-aside block at lines 861 to 864), `personLine` (line 874), `setAsideBlock` and its comment (lines 878 to 900), `blockText` (lines 910 to 928), `accountCoverage` (lines 1324 to 1387), the accounting sentence in `candidatesBlock` (line 1244), the id rename (lines 2080 to 2088 and 2122 to 2132), the set-aside build with the target parse and `into` (lines 2139 to 2158), and the findings file (line 2235).
- **Relevance:** R5-1's span pairing, R5-2's parse, R5-3's comment and R5-4's `into` all live here. `accountCoverage` is why a candidate behind an Already tracked finding is `known` and set aside (R5-3), and why a `finding` entry's ref is the finding's id exactly (R5-4).
- **Key patterns:** the block takes every accounting entry whose outcome is not in `LISTED_ELSEWHERE`; `into` is built once at the set-aside build and rendered by `setAsideBlock`; the line's whole text goes through `blockText`; the round's findings file holds the accounting and the candidate list, not `into`.

### The loop test's coverage section

- **Location:** `tests/loop-test.mjs`: `f` (line 208), `go()` and its run-record check (lines 219 to 241), section 15's helpers `covArgs`, `cand`, `fenced`, `two` and `body` (lines 1277 to 1284) and `settledAll` (line 1322), the partly tracked scenario (lines 1490 to 1500), the nine-candidate set-aside scenario (lines 1503 to 1550), the escaping scenario (lines 1568 to 1601), the duplicate-forms scenario (lines 1603 to 1628) and the `coverage off` check (lines 1630 and 1631).
- **Relevance:** Tasks 2 and 3 extend the escaping and duplicate-forms scenarios. Task 5's scenario takes the nine-candidate scenario's run shape (a correctness finding in round 1, then a re-review with `two` and `settledAll`), and the nine-candidate and duplicate-forms scenarios pin its neighbour, a target of another outcome with no id.
- **Key patterns:** a set-aside line is pinned by an `includes` of the line between two newlines, or by the whole block joined with newlines; the label's count is pinned in the body and the handoff; a scenario that reaches its handoff gets `go()`'s run-record check; a check over behaviour the code already has is seen red by a temporary mutation restored before the commit (round 4's Task 2).

### The PR's own earlier round and follow-up specs

- **Location:** `agent-os/specs/2026-11-11-1952-86-review-round-4/` (`shape.md`, `plan.md`), `agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/shape.md`, `agent-os/specs/2026-11-11-1409-86-review-round-1/shape.md` and `agent-os/specs/2026-11-11-1409-86-review-round-2/shape.md`.
- **Relevance:** round 4's Decision 2 (option B, decided by the person) is the parse R5-2 pins; the follow-up spec's Decision 2 and its shaping defaults "A `known` entry made from a finding with `knownAs`" and "A duplicate's target" answer R5-3 and R5-4; round 1's Unattended answer 7 records that the shaper cannot run `node`; round 2's Unattended answer 7 is why no round writes a `pr-body.md`.
- **Key patterns:** the plan's shape (one task per finding, each with its files, change, red run and greps), the For the person notes and the #81 run caution, as round 4 laid them out.

### The round's own record

- **Location:** `agent-os/specs/2026-11-11-1952-86-review-round-5/redline/round-5-review.json` and `round-5-findings.json`, and `agent-os/specs/2026-11-11-1952-86-review-round-4/redline/round-4-review.json`.
- **Relevance:** the four findings and their proposed fixes; the round 5 accounting, whose one duplicate names a `forThePerson` candidate; and the posted round 5 line for that duplicate, which shows no target (`shape.md`, Context).

### Docs and standards read

- **Location:** `docs/running.md` ("Rounds", steps 1 and 7; "The coverage pass", line 48; "The handoff comment", line 83), `README.md` ("Git rules for Redline agents", "What a clean run means"), `agent-os/product/mission.md` (lines 13 to 17), `.claude/redline.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `scripts/redline-gh.sh` (`prior-findings`, line 334), and the standards copied in `standards.md`.
- **Relevance:** the Docs entry for Task 5 and the reason Task 4 has none; the version; the absence of ask rules; and that `prior-findings` never reads a set-aside line back.
