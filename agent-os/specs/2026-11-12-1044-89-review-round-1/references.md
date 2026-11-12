# References for PR #89 Review Round 1

Shaped by Redline in unattended mode. Every file below was opened at `1a7bf67`.

## Similar Implementations

### postedText and readBack

- **Location:** `workflows/redline-loop.js:918-940`
- **Relevance:** `postedText` (line 930) adds the word joiner with `/@(?=[A-Za-z0-9])/g`, and `readBack` (line 939) strips it. These are the only two places in the workflow that write or read the joiner (`grep -n 'u2060' workflows/redline-loop.js`). Neither changes in this round.
- **Key patterns:** a joiner is added only before an ASCII letter or digit, so two joiners in a row are never written.

### readBack at intake

- **Location:** `workflows/redline-loop.js:107`
- **Relevance:** `priorFindings` decodes each prior finding's `title` once with `readBack`, so the reviewer's carry list and every posted line start from the raw title.

### The round-trip scenario

- **Location:** `tests/loop-test.mjs:1749-1770`
- **Relevance:** line 1715 defines `posted`, the title as the workflow posts it; line 1760 is the carry-list check that pins the joiner strip by reading the reviewer's prompt; line 1770 is the check this round renames.
- **Key patterns:** a check over every posted body (`r2.body`, each inline comment body, `handoff`) for a string that would only appear if a title were escaped twice.

### Earlier round with the same kind of task

- **Location:** `agent-os/specs/2026-11-11-1952-86-review-round-5/plan.md`, Task 4
- **Relevance:** a test-or-comment-only nit task, with grep proofs and a one-file commit, the layout this plan follows.

### The #87 spec

- **Location:** `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md`, decisions 7 and 9 (lines 45 and 47); `plan.md`, the gate table (lines 404 to 410).
- **Relevance:** decision 7 states what the round-trip tests must prove; decision 9 keeps the version; the gate table gives the harness counts this round starts from.
