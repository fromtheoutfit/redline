# References for the #87 follow-up on PR #89

## Similar Implementations

### postedText, readBack and textParts

- **Location:** `workflows/redline-loop.js:919-970`
- **Relevance:**
  - `postedText` (`:930`) writes the neutraliser after `&` and `<` are escaped.
  - `readBack` (`:939`) strips it before decoding `&lt;` and `&amp;`.
  - `textParts` (`:952`) is the span reader both share.
- **Key patterns:**
  - The literals stay inline in both functions: the intake calls `readBack` near the top of the script, where a later top-level `const` is in its temporal dead zone (#87's As built).
  - The order of the replacements is what makes the inverse exact.

### The intake

- **Location:** `workflows/redline-loop.js:101-107`
- **Relevance:** `priorFindings` maps each prior title through `readBack` once. The decode at intake is unchanged; only what it strips changes.

### reviewBody

- **Location:** `workflows/redline-loop.js:832-879`
- **Relevance:** the order of the body's sections, and the closing sentence's push (`:875-877`) after the set-aside block (`:871-874`).
- **Key patterns:** each section is pushed only when the round has entries for it. The sentence's gate stays `active.length`.

### postPrompt and finishPrompt

- **Location:** `workflows/redline-loop.js:1431-1454` and `:1760-1785`
- **Relevance:** the GitHub agent is told to write the review JSON and the handoff "with the Write tool, byte for byte". That copy is what the reference form makes visible. The instructions do not change.

### redline-gh.sh readers

- **Location:**
  - `scripts/redline-gh.sh:206-225` (`place_comments`);
  - `:300-316` (`has-review`, `last-round`);
  - `:318-366` (`prior-findings`);
  - `:435-440` (`last-human-review`).
- **Relevance:** read to confirm that no reader depends on where the closing sentence sits (answer 9's rider), and that `prior-findings` returns a title's bytes unchanged, the reference included.

### The loop test's posted-text sections

- **Location:**
  - `tests/loop-test.mjs:35-36` (`WJ`);
  - `:1030` (§12, Left to you);
  - `:1316` and `:1550` (the closing sentence's pins);
  - `:1582-1654` (§15, the block's escaping);
  - `:1702-1798` (§16: the lines outside the block, the round trip, the modes).
- **Relevance:** every pinned string that holds the neutraliser goes through `WJ`. So changing the constant re-pins them all, and the new checks sit beside the ones they extend.

### The gh harness's PR 15

- **Location:** `tests/gh-test.sh:25-35`, `:236-248`; `tests/gh-fixtures/reviews-15.json`, `comments-15.json`
- **Relevance:** `prior-findings` over an escaped, neutralised title. `jq -a` keeps a stray raw character visible as its escape.

### The #87 spec and PR #89 round 1

- **Location:**
  - `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/`: decision 9, answer 14, Evidence, Round trip;
  - `agent-os/specs/2026-11-12-1044-89-review-round-1/`: decision 2, and the R1-1 fix to the "escaped twice" check.
- **Relevance:** the decisions this spec supersedes, and the check it extends.
