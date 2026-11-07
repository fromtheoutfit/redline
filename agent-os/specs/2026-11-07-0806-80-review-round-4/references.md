# References for PR #80 Review Round 4

Shaped by Redline in unattended mode. Everything below was opened at `a70c243`.

## Similar Implementations

### #65 round 2: a finding on a standard, fixed through the retrospective

- **Location:** `agent-os/specs/2026-11-03-0852-65-review-round-2/` (`shape.md`, Unattended answer 4 and the proposed list; `plan.md`, Task 3 and As built)
- **Relevance:** R2-1's fourth sentence sat in `agent-os/standards/scripts/guard.md`, and the round corrected it as retrospective item 1, in a standards task of its own before the gate.
- **Key patterns:** the standards commit names the finding its item finishes. Its proofs are `grep -c` counts before and after. A heading check runs on the standards diff. If the item is declined, it is recorded as a deviation rather than edited outside the approved list.

### Round 2 of this PR: a person's decision recorded in shape.md

- **Location:** `agent-os/specs/2026-11-06-1019-80-review-round-2/shape.md`, Decisions 4 and 5, retrospective item 5
- **Relevance:** the shape a decided entry takes once the person answers (Chosen, Notes, Date, `Decided by: @michaelfromtheoutfit`). Task 3 follows it for round 3's Decision 4. Item 5 is the guard-standard sentence R4-2 corrects, and its note that the narrowing would be "recorded in this bullet by the person's own change".
- **Key patterns:** the owner line sits at the entry's indentation as its last line. The login is the one Redline's replies carry for the person (`redline/round-2-reply-R2-1.md`, `round-2-reply-R2-5.md`).

### Round 3 of this PR

- **Location:** `agent-os/specs/2026-11-06-1019-80-review-round-3/` (`shape.md` Decision 4 and the proposed retrospective; `plan.md` Task 5's options; `redline/` holding only the findings and the review)
- **Relevance:** R4-1's subject. Items 1 to 3 of its list are carried into this round's items 1 and 2.

### The two hand commits

- **Location:** `git show 6ef58a9`, `git show a70c243`
- **Relevance:** `6ef58a9` built R3-1 to R3-4, with R3-4 as option B, in one commit: the handled-list header, the candidates block, `agents/redline-reviewer.md`, `docs/running.md`, `agent-os/product/tech-stack.md` and two loop checks. `a70c243` narrowed the guard's main group to `GH_READ`, flipped and added `tests/guard-cases.tsv` rows, and updated the README, `docs/guard.md` and `docs/running.md`. Neither touched `agent-os/standards/` or round 3's `shape.md`.

## Code studied

### The prior-findings read and the resolved reply (R4-3)

- **Location:** `scripts/redline-gh.sh:21-45` (header), `:317-364` (`prior-findings`, `classify` at `:335-342`); `docs/scripts.md:52` (the header quoted)
- **Relevance:** a reply opening `resolved; first reported as` matches no branch and is `decided`. Option A adds the branch; B and C name the disposition elsewhere.
- **Key patterns:** dispositions are read by fixed opening words, one per reply wording `replyBody` and the prior-reply builders write.

### The workflow's earlier-run lists and the verify rules (R4-3)

- **Location:** `workflows/redline-loop.js:86-103` (`PRIOR_DISPOSITIONS`, `CARRY`, `carryList`, `trackedList`), `:1111-1131` (history line, handled list and header, carry-forward list), `:1151-1174` (`candidatesBlock()`), `:1887-1896` (`history()`), `:2402-2412` (`resolvedReplies()`), and the uses of `resolvedPrior` at `:1924`, `:2986`, `:3008`, `:3295`
- **Relevance:** where a resolved finding is shown, or not shown, to a later round of the same run and to a later run.

### The reviewer's contract (R4-3)

- **Location:** `agents/redline-reviewer.md:20` (the known-finding check's item 3), `:22`, `:30` ("New carries the run's done rule"), `:98` (the `knownAs` contract)

### The guard's redline-gh.sh approval (R4-2)

- **Location:** `scripts/redline-guard.sh:738` (`GH_READ`), `:1071-1078` (the `redline-gh.sh` branch of `check_simple`); `tests/guard-cases.tsv`, the #50 and R2-5 rows under "the one exception"
- **Relevance:** what `guard.md` lines 14 and 23 must now say.

### Tests

- **Location:** `tests/gh-test.sh:207-227` (prior-findings cases; `:220` "any other reply is decided"), `tests/gh-fixtures/reviews-14.json` and `comments-14.json` (the PR 14 fixture), `tests/loop-test.mjs:630` (the resolved reply's text), `:1357-1363` (the R3-4 and R3-3 checks `6ef58a9` added)
- **Relevance:** the cases R4-3's options extend; the fixture an option A or B case adds a resolved reply to.

### Docs

- **Location:** `docs/running.md` step 7 (line 42), "The coverage pass" (line 48), "Earlier rounds" (line 98); `docs/guard.md` "The hook"; `README.md` "Git rules for Redline agents" and Known limits
- **Relevance:** the sections R4-3's options edit, and the docs R4-2 checks the standard against.

### Specs read for the evidence

- `agent-os/specs/2026-10-27-1345-35-carry-forward-undispositioned-findings/shape.md` (Decision 2: the tracked labels)
- `agent-os/specs/2026-11-05-1443-79-two-reviewer-whole-pr-round/shape.md` (Decision 15, the version; the done rule)
- This round's `redline/round-4-review.json` and `redline/round-4-findings.json`
