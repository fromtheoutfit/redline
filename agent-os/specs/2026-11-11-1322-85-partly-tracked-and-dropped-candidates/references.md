# References for #85: partly tracked candidates and the dropped block

Line numbers are as read at shaping time (2026-11-11, `main` at `acd8b97`).

## Similar Implementations

### The verifier's instructions

- **Location:** `agents/redline-reviewer.md`: "Check for known findings first" (lines 14–22), "Candidates from the coverage pass" (24–47: the done rule at 30, collapse by cause at 34, the known-finding bullet at 35, the two guards at 42–43, the accounting at 47), the For the person bullet (62), the return block and `knownAs` paragraph (71–98).
- **Relevance:** where the three rules land. Every place that states the old rule's words (`already tracked in #N`, `the line #N lacks`, `knownAs`, `disproportionate`, `refuted`) is edited, not only the one sentence the issue quotes (#80, R3-3).

### The verify prompt

- **Location:** `workflows/redline-loop.js`, `candidatesBlock` (1158–1174); the known-finding sentence of the review prompt (1140), which every review prompt carries.
- **Relevance:** the rules enter the branch with candidates only, so a `coverage off` prompt is unchanged, as #80 R3-3 did for the handled-list header (1126).

### The accounting and the review body

- **Location:** `workflows/redline-loop.js`: `COVERAGE_OUTCOMES` and `COVERAGE_SCHEMA` (506–512), `accountCoverage` (1251–1314), the review normalizer (2026–2073, where `out.coverageList` is set at 2065), `reviewBody` (814–859), `personLine` (861–866), `coverageSentence` (868–876), the round record (3295), `result()` (1898–1931), `handoffComment` (2770–2834).
- **Relevance:** `accountCoverage` already maps a `finding` entry whose finding has a `knownAs` to `known`, so a partly tracked finding with `knownAs` empty stays `finding` with no workflow change. The dropped block joins the accounting to the candidate list by index after `accountCoverage`, renders after For the person, and the record keeps the entries for the handoff while `result()` keeps counts only (#80, R1-5).
- **Key patterns:** `personLine`'s backticked `file:line` opening; the handoff's every-round For the person section, before `### Commits`.

### What reads a review body back

- **Location:** `scripts/redline-gh.sh` `prior-findings` (318–363), `finding_lines`.
- **Relevance:** it matches only `^- \*\*R<n>-<k>\*\* · <category> · ...`, so a dropped line opening with ``- ` `` is never read as a finding; no gh-test change.

### The loop test's coverage section

- **Location:** `tests/loop-test.mjs` section 15 (1267–1458): `cand`, `fenced`, `two`, `three`, `settledAll`, the `body()` reader of the post prompt, `comment()` for the handoff; the `every` scenario (1284–1315), the known finding from a candidate (1400–1402), `coverage: off` (1451–1455).
- **Relevance:** the scenarios and readers the new checks reuse; the workflow source is read at line 18, beside which the agent file is read.

### Precedents

- `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/`: the coverage pass, the eight outcomes, the two guards and For the person.
- #80's rounds: R1-4 (a finding entry counted where the round puts it), R1-5 (the findings file keeps the candidate list, the result keeps counts), R3-3 (a rule change applied everywhere the prompt and the agent file state it), R5-1 (every statement of the done rule reworded).

## Evidence

- `SPIKE-72-NOTES.md` §10 (redline-internal, `docs/`): the #817 rerun on the built plugin, the verifier's dispositions (§10.1, §10.2), the exposure of the coverage fork to the merged PR's round folders (§10, "Exposure"), and what follows (§10.5). Cited by name; nothing copied.
