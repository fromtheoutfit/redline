# References for PR #94 Review Round 3

Shaped by Redline in unattended mode. Every file below was opened at `dae81d4`.

## Similar Implementations

### Rounds 1 and 2 of this pull request

- **Location:** `agent-os/specs/2026-11-13-1329-94-review-round-1/` and `agent-os/specs/2026-11-13-1329-94-review-round-2/`
- **Relevance:**
  - Round 2's folder gives the format this plan follows: a task per finding, files by path, a Docs entry, a commit line, the gate task with expected counts, an As built section, and the format of the shaping notes. Its As built gives this round's starting counts.
  - Round 1's Decision 1 (R1-1) kept the history header unchanged under `coverage off` on purpose, which answers R3-3.
  - Round 2's R2-6 (the `(no file)` place) and R2-15 (a decline already overruled left out of a second stop) sit next to R3-4 and R3-7.

### The #93 spec (the pull request's own)

- **Location:** `agent-os/specs/2026-11-13-1139-93-verify-facts-shaper-decides/shape.md`
- **Relevance:** Its decision 7 (line 48) states the two doors to overrule a decline, which R3-7's options keep or narrow. Line 80 says a bought round with `coverage off` that changed no code ends the run.

### Code read for each finding

- `workflows/redline-loop.js`:
  - `findingLine` and `scopedLine` (902-917);
  - `postedText` and `readBack` (1046-1060);
  - `commentBody` (1105-1128);
  - `reviewPrompt`'s history and handled-list headers and its end (1335-1395);
  - `coverageCandidates` (1460-1493);
  - `accountCoverage` and its constants (1511-1590);
  - `compactFinding` (2172) and `result()`'s round entries (2190-2215);
  - `checkCalls`, `checkWhy`, `checkSpec` and `forceAskRules` (2625-2755);
  - `revise()` from the shaper through the approve loop (2850-3005);
  - `handoffComment`'s Declined heading (3255-3270);
  - `handoffResult` (3632-3665);
  - the round loop's scope and record (3795-3825).
- `git show origin/main:workflows/redline-loop.js`: the order of `checkSpec` and `forceAskRules` (lines 2689-2691, 2806-2808).
- `agents/redline-reviewer.md`: lines 12, 15-30 and 44.
- `README.md`: Known limits, lines 100-108.
- `docs/running.md`: lines 11-24, 36, 40-48, 67-75, 105-116, 200-210 and 226.
- `docs/upgrading.md`: the whole file.
- `skills/redline/SKILL.md`: lines 118-122, 166-172, 183, 208 and 240. `skills/setup/SKILL.md`: lines 148 and 152.
- `tests/loop-test.mjs`:
  - the scope scenario (420-444);
  - the coverage helpers and accounting checks (1365-1400, 1436-1500);
  - the key-phrase checks (1583);
  - the escaping scenario (1725-1770);
  - the overrule and layout checks (2252-2352).
- `agent-os/standards/workflow/agents.md` (lines 11, 16, 17, 36 and 38), `agent-os/standards/workflow/replay.md` (whole), `agent-os/standards/testing/tests.md` (lines 1-16), `agent-os/standards/process/docs-gate.md` and `agent-os/standards/process/release.md`.
