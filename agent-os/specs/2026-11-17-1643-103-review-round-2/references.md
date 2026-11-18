# References for PR #103 Review Round 2

Shaped by Redline in unattended mode. Every location below was opened at `363e445`.

## The pull request's own specs

### #100: a deferral ships from the round's record

- **Location:** `agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/shape.md`
- **Relevance:** "Behaviour that changes on purpose" (a mention-only commit is posted as shipping nothing; R2-6), decisions 11 to 13 (no commit demanded of a deferral; the record decides; "planned" split by who decided; R2-7, R2-9, R2-11), and decision 14 (`isDeferral` reads the field as filled or empty; R2-3).

### PR #103 review round 1

- **Location:** `agent-os/specs/2026-11-17-1643-103-review-round-1/` (`shape.md`, `plan.md`)
- **Relevance:**
  - R1-2's `approverFindings` (Decision 1), which R2-11 folds into `effectiveDispositions`.
  - R1-11's `isDeferral` override branch and its comment (Decision 3), which R2-8 and R2-2 complete.
  - R1-7's comment and doc sentence (Decision 7), which R2-4 narrows.
  - R1-6's override, the person's answer to a removal the pull request made necessary, read beside R2-9's small-refactor test.

## Code the findings name

### The deferred entry, the draft view and the plan dial

- **Location:** `workflows/redline-loop.js`:
  - 3381-3393, `deferredEntry`;
  - 3395-3411, `draftView`;
  - 4664-4689, `handoffResult`'s plan dial, with `deferredPlanned` at 4681;
  - 4308, the handoff's Deferred line.
- **Relevance:** R2-7 (`ships` is in the view, not in the entry) and R2-4 (the plan dial returns the shaper's words as written).

### The comments on the field

- **Location:** `workflows/redline-loop.js:766-784` (`DEFERRED_SCHEMA`, `mitigationFilled`), `851-853` (the schema comment on `files`), `864-866` (`FILES_ASK`), `516-518` (`rulesBlock`)
- **Relevance:** R2-3, R2-4, R2-5, R2-9.

### The round's resolves, dispositions and planned files

- **Location:** `workflows/redline-loop.js`:
  - 3635-3655, `shaperFiles`, `draftsOf`, `shaperDrafts`;
  - 3696-3773, `awayFromDefer` and `resolveWith`, including the merge at 3771;
  - 3774-3822, `effectiveDispositions`, `plannedTask`, `shaperPlanned`, `plannedFiles`, `approverFindings`, `isDeferral`;
  - 3851, the plan approver's call;
  - 3870-3913, the reshape, `raised` and the second resolve;
  - 3966-3976, `roundDeferred`, `needCommits`, `ctx`.
- **Relevance:** R2-8, R2-9, R2-10, R2-11.

### Outcomes, replies, warnings and the done rule

- **Location:** `workflows/redline-loop.js`:
  - 588-598, `mentions`, `ownCommit`;
  - 1513-1546, `replyBody`;
  - 2917-2968, `outcomesFor`;
  - 2986-3003, `describeOutcome`;
  - 4049-4064, `landed` and the two warnings;
  - 4113-4138, the done rule's comment, `buys`, `bought`, `fixed`.
- **Relevance:** R2-6, R2-1, R2-12.

### Prompts

- **Location:** `workflows/redline-loop.js`:
  - 1956, the shape prompt's return sentence;
  - 1995, the human-pass prompt's;
  - 2003-2013, the reshape prompt, its "a decision the person made ... stays as it is" at 2011;
  - 2046-2056, the resolve prompt's call and override sentences;
  - 2158-2164, the implement prompt's dispositions block.
- **Relevance:** R2-5 (`FILES_ASK` in all three shape prompts), R2-8 (the resolve agent is not asked for an entry beside a non-defer override), R2-10, R2-11.

### Ask rules

- **Location:** `workflows/redline-loop.js:3217-3289` (`forceAskRules`); `docs/contract.md:139-155` ("Ask rules"); `agents/redline-shaper.md:30` (rule 7) and its example R1-3
- **Relevance:** R2-5: the only reader of an ask's `files`, and the sources that already give the ask reading.

## Tests

### The loop harness

- **Location:** `tests/loop-test.mjs`:
  - 190-259, the scripted shaper and resolve agent: `files`, `acceptedCalls`, `resolveDeferred`, `reshapeAsk`;
  - 344-350, the run-record check;
  - 373, `FILES_ASKED`;
  - 2825-2849, the defer section's statement loop and source checks;
  - 2851-2925, the defer section: `mitigated`, `bare`, the no-task loop, `pinned`, `unbuiltMitigation`, the mirror, `unlisted`, `deferAccepted`, `fixAccepted`, `mentionedBare`;
  - 3079-3173, the filing section: `chosen`, `approverFiles`, `declineToDefer`, `fixToDefer`, `ownDefer`, `strayResolve`, `strayWorded`, `strayReshape`, `overrideUnbuilt`, `overrideBuilt`, `chosenBare`, `chosenUnbuilt`, `chosenUnlisted`;
  - 3214-3223, the first stop's view;
  - 3285-3290, the end-of-run stop's view.
- **Relevance:** every new check sits beside the scenario it neighbours. The scripted agents answer as the real ones would (testing/tests, line 7).

### The reviewer's reproduction

- **Location:** `/tmp/redlinerepro/reviewer-r2-repro.mjs`
- **Relevance:** the probes behind R2-8 (c1), R2-11 (c3), R2-10 (c2), R2-7 (c5), R2-6 (c6) and R2-2 (c10, with the mutant R2-2 names). The guard refuses `node` to the shaper, so it was read, not run. Each claim was traced through the code above.

## Docs, skill and standards

- `skills/redline/SKILL.md`:
  - 184, the plan dial's field list (R2-4, R2-5);
  - 217 and 220, the drafts stop's `ships` and "a planned change";
  - 264 and 268, the `done` and `capped` summaries (R2-7).
- `docs/running.md`:
  - 44, "What buys the next round" (R2-1);
  - 118, the closing summary;
  - 125, "Whether a mitigation shipped" (R2-4);
  - 139, the `plan` dial.
- `README.md:5` (the loop paragraph), `:103` ("What a clean run means") and `:111` (Known limits, "No commit is demanded of a deferral"): R2-1, R2-6.
- `agent-os/standards/workflow/agents.md`, lines 16, 39, 42, 44, 46 and 49: R2-1, R2-3, R2-4, R2-5, R2-7, R2-8, R2-11.
- `agents/redline-implementer.md:16, 18` (rules 1 and 3), `agents/redline-plan-approver.md:16` (rule 1), `agents/redline-resolve.md:20-23`: R2-6, R2-8, R2-10, R2-11.

## Issues

- #99 (open): "Have the resolve agent name each decision's disposition, so a stray deferred entry beside a fix is not filed". Its subject is a call's decision. R2-8 is an override's, which names its disposition.
- #100 (open): the issue this pull request closes.
- #104 (open): "Count a deferred draft's version over what its stop shows" (round 1's R1-9), and #105 (open): "List every finding's files in the unattended section's return example" (round 1's R1-4). Neither covers a round 2 finding.
- No open issue covers R2-1 to R2-12. Searched with `redline-gh.sh issues-search` for `plannedFiles`, `effectiveDispositions`, `deferral`, `reshape`, `closing summary` and `No code change`.
