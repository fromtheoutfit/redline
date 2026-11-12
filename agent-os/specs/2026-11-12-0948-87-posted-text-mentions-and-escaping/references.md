# References for #87: posted text, mentions and the span rule

## Similar Implementations

### The set-aside block and its escaping (the #85 follow-up spec)

- **Location:**
  - `agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/`;
  - `workflows/redline-loop.js`: `setAsideBlock` (`:894`) and `blockText` (`:915`).
- **Relevance:** `blockText` is the function this spec widens into the one function for every finder and verifier field. Its pairing of equal-length backtick runs stays, now for a text that holds no trigger.
- **Key patterns:**
  - read the line's free text as one string;
  - escape `&` before `<`;
  - leave a span as written;
  - pin the escaped string in §15 of the loop test.

### The lines that post finder and verifier text

- **Location:** `workflows/redline-loop.js`:
  - `findingLine` (`:813`);
  - `reviewBody` (`:825`): the summary at `:842`, Resolved at `:855`, Already tracked at `:858`;
  - `personLine` (`:877`);
  - `commentBody` (`:945`);
  - `handoffComment` (`:2871`): Decisions at `:2911`, Deferred at `:2914`;
  - `leftToYou` (`:2946`);
  - the Earlier rounds lines (`:3110-3132`);
  - `capComment` (`:3002`), which calls `findingLine`.
- **Relevance:** every call site of the new function.

### The intake and the fallback carry

- **Location:** `workflows/redline-loop.js`:
  - the `args.priorFindings` intake (`:81-103`);
  - `reconcilePrior`'s fallback (`:2215-2227`).
- **Relevance:** the one place a title read back from GitHub enters the run. The fallback copies `p.title` and `p.body` straight into a new finding.

### The readers

- **Location:** `scripts/redline-gh.sh`:
  - `prior-findings` (`:318-366`): the finding-line regex at `:334`, the suffix strip at `:349`;
  - `has-review` (`:300`);
  - `last-round` (`:311`);
  - `human-review` (`:368`);
  - `place_comments` (`:206-225`), which moves a comment GitHub cannot anchor into the review body word for word.
- **Relevance:** the round trip and the heading rider. None of these is changed by this spec.

### The tests

- **Location:**
  - `tests/loop-test.mjs`: §15 (`:1570-1652`), the `prior()` helper (`:210`), and the carry-forward scenario's pins (`:572`, `:627`, `:639`, `:650`, `:665`);
  - `tests/gh-test.sh`: the PR 14 `prior-findings` cases (`:207-229`) and the fake `gh` shim's routing (`:115-136`).
- **Relevance:** the escaped-string pins this spec re-pins and extends; the fixture pattern for PR 15.
