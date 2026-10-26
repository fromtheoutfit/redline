# References for PR #38 review round 2

Shaped by Redline in unattended mode.

## Similar Implementations

### The `human-review` subcommand's header

- **Location:** `scripts/redline-gh.sh:21-43`
- **Relevance:** the source text for how each selector form selects. `scripts/bash-conventions.md:9` says the README quotes it.
- **Key patterns:**
  - an id: "keeps that review's open comments and its body when not empty and not answered"
  - `@login`: "(matched in any case, as GitHub matches logins)" and "the body of their newest review that has one not answered (one body per pass)"
  - `latest`: "with an open comment or an unanswered body"

### The `human-review` filter

- **Location:** `scripts/redline-gh.sh:281-307`
- **Relevance:** the behaviour the paragraph must describe. `open_body` (line 282) requires a body that is not empty and not answered. `latest` (line 292) needs `open_body` or an open comment. An id (line 301) and `@login` (line 302, newest first) take a body only when `open_body` holds.
- **Key patterns:** one body per pass, the newest unanswered one; a fully answered review is passed over by `latest`.

### The README's `redline-gh.sh` table row

- **Location:** `README.md:288`
- **Relevance:** R1-3's Task 6 step 4 already updated this row (commit `d9b584e`). It is the neighbour that must not change.
- **Key patterns:** "matched in any case"; "the body of their newest review that has one not answered (one body per pass, so an older one comes up on the next pass)".

### The revise skill's step 2

- **Location:** `skills/redline-revise/SKILL.md:16`
- **Relevance:** R1-3's Task 6 step 5 updated this step.
- **Key patterns:** "the review body when there is one that no Redline human review comment has answered". The new paragraph uses the same words.

### Round 1 of this PR

- **Location:** `agent-os/specs/2026-10-26-1023-38-review-round-1/`
- **Relevance:**
  - `shape.md`, Decisions, records the person's R1-3 decision ("keeps one body per pass (the newest one not yet answered), so a repeat pass over an answered review stops with nothing to revise and an older note comes up on the next pass") and the R1-2 fix (match a login in any case).
  - `plan.md`, Task 6 steps 4 and 5, lists the doc lines R1-3 changed. Line 67 is not among them.
- **Key patterns:** the format of a nit round's plan and proofs; the BSD grep note in its As built.

### The #36 spec

- **Location:** `agent-os/specs/2026-10-26-0949-36-revise-from-a-human-review/plan.md:12`
- **Relevance:** the original selection wording ("plus the body of their newest submitted review"; "that review's un-replied comments and body"), which line 67 was written from and which R1-3 changed.
- **Key patterns:** the spec folder is the record of what was built and is not edited.

### An earlier final nit round

- **Location:** `agent-os/specs/2026-10-26-0844-37-review-round-2/`
- **Relevance:** a one-finding nit round on another PR. Its plan, Unattended answers and retrospective follow the same structure.
- **Key patterns:** grep-count proofs for a text change; a neighbour that must not change; a retrospective bullet that records a lesson and names no finding in its commit message.
