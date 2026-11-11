# References for the #85 follow-up: the set-aside block and its escaping

Line numbers are as read at shaping time (2026-11-11, branch head `7a6587b`).

## Similar Implementations

### The block and its line

- **Location:** `workflows/redline-loop.js`:
  - `DROPPED_OUTCOMES` beside `COVERAGE_OUTCOMES` (507–511);
  - `reviewBody` (820–867, the block at 859–862);
  - `personLine` (872–874);
  - `droppedBlock` (876–893);
  - `coverageSentence` (896–903).
- **Relevance:** the block is built by `personLine`, so a line opens with the backticked place and `redline-gh.sh prior-findings` never reads it back (#86, R1-3). The escaping has to wrap the text it is given, not `personLine` itself, which For the person lines share (decision 5).
- **Key patterns:** the summary line names the round only in the handoff. The count sentence's three groups (collapsed, already tracked, dropped) are the label's.

### The accounting the block reads

- **Location:** `workflows/redline-loop.js`:
  - `accountCoverage` (1296–1351): a `finding` entry whose finding has a `knownAs` becomes `known` with ref `<id>: <knownAs>`, and unaccounted, unknown-outcome and no-finding-ref entries become `forThePerson`;
  - the review normalizer (2085–2121): the rename of duplicate refs at 2089–2097, and `out.droppedCandidates` at 2106–2114;
  - the round record (3352);
  - `handoffComment` (2820–2891, the block at 2877–2883).
- **Relevance:** the block's rule runs on the accounting after `accountCoverage`, so every rewritten entry is placed where the round lists it. A duplicate's target outcome is read from the same accounting, by index.

### The verify prompt and the agent file

- **Location:** `workflows/redline-loop.js` `candidatesBlock` (1195–1211; the accounting sentence at 1208, the comment at 1178–1194); `agents/redline-reviewer.md`, "Account for every candidate" (50).
- **Relevance:** the sentence naming what the body lists, widened in both (answer 11). Only the branch with candidates carries it, so a `coverage off` prompt is unchanged.

### The loop test's coverage section

- **Location:** `tests/loop-test.mjs` section 15:
  - the helpers `cand`, `fenced`, `two`, `three`, `settledAll`, `body()` and `comment()`;
  - the rule loop (1471);
  - the partly tracked scenario (1483–1492);
  - the dropped block scenario (1498–1528);
  - the final nit pass (1532–1534);
  - the empty reason (1538–1543);
  - `coverage off` (1546);
  - the known finding from a candidate (1403–1405).
- **Relevance:** each check that pinned the three-outcome block or the raw summary moves to the rendered text and the wider rule.

### What reads a review body back

- **Location:** `scripts/redline-gh.sh` `prior-findings`, `finding_lines` (matches `^- \*\*R<n>-<k>\*\* · `).
- **Relevance:** a block line opens with ``- ` ``, so it is never read as a finding. No gh-test change.

## The notes acted on

- The round 1 review body on PR #86 (2026-11-11, "Redline round 1"), For the person: coverage candidates 2 and 3.
- The round 2 review body on PR #86 (2026-11-11, "Redline round 2"), For the person: coverage candidate 5.
- The Redline handoff comment on PR #86 (2026-11-11), which carries all ten For the person entries of the run.

## The rendering rule

- CommonMark, "Code spans": a backtick string opens a code span that the next backtick string of the same length closes; one with no match is literal. "Entity and numeric character references": not recognized in code spans or code blocks. A backslash escape makes a backtick literal outside a span.
- The probe through GitHub's markdown API, recorded under Evidence in `shape.md`.

## Precedents

- `agent-os/specs/2026-11-11-1322-85-partly-tracked-and-dropped-candidates/`: decisions 5, 11 and 14, the shaping defaults (the empty reason, the line's shape), and the key-phrase checks (decision 12).
- #80's R3-3 (a rule changed everywhere the prompt and the agent file state it) and R1-5 (the result keeps counts only).
