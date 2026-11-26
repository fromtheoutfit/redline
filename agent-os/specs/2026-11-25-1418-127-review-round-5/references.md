# References for PR #127 Review Round 5

Shaped by Redline in unattended mode. Line numbers are at `10f2630`.

## Similar Implementations

### `resolveWith`'s treatment of a left decision

- **Location:** `workflows/redline-loop.js:4609-4673` (the option pick at 4633-4640; the left block at 4658-4671)
- **Relevance:** R5-3. The one complete statement of what a left finding's decision carries: no non-defer disposition (warned about only when it was typed), `rule`, and `own` for Redline's own files.
- **Key patterns:** a forced pick never takes a non-defer end (4638), so the block's warning fires only for a named disposition; Task 2's helper keeps that condition.

### The R4-4 loop and hold after a reshape

- **Location:** `workflows/redline-loop.js:4988-5071` (`named` and `leftBefore` at 4990-4991; the loop at 4996-5004; the hold at 5032-5071)
- **Relevance:** R5-3. The copy of the left treatment that sets `rule` and `own` alone.
- **Key patterns:** `named.filter((x) => record.forced[x] && !leftBefore.has(x))` picks the decisions a reshape newly left; Task 2 keeps that filter and calls the helper.

### The readers of a left decision's disposition

- **Location:** `workflows/redline-loop.js` — `awayFromDefer` (4559), `tracked` (4575), `endsIn` (4586), `leftDeferred` (4592), `effectiveDispositions` (4885), `isDeferral` (4914), `needCommits` (5196), `outcomesFor`' left branch (3473-3479), `keptDecline` (5329)
- **Relevance:** R5-3. Each was read to confirm that dropping a non-defer disposition from a forced decision changes nothing it computes: forced ids are not tracked or demanded, a left outcome reads only the choice and notes, and only `defer` makes a left deferral.

### The plan approver's and implementer's view of decisions

- **Location:** `workflows/redline-loop.js:2524` (`planPrompt`), `2602` (the implementer's prompt); `agents/redline-plan-approver.md` rules 1 and 6; the comment in `resolvePrompt` at 2446-2448
- **Relevance:** R5-3. Rule 1 reads `rule` as left to the person and pairs only `defer` with it; rule 6 says a decision's `disposition` is the one the plan follows. The decisions shown are `roundDecisions` whole.

### The link section of `review()` and `honourLinks`

- **Location:** `workflows/redline-loop.js:3100-3132` (`honourLinks`), `3159` (`linksAsked`), `3212-3248` (the top-level key, the rename loop, the call), `6074` (the revise-only pass); `reviewSchema` (909-923) and `showsEarlier` (1910)
- **Relevance:** R5-1. The `!asked` reason exists only per id inside `honourLinks`, after the form check and after the two readers in `review()`.
- **Key patterns:** `CLEARED`'s wording (`round N: the reviewer linked X to Y as one class (sameClassAs), but <why>; the link is cleared`) is kept for a well-formed list, so the existing `unasked` pin holds.

### `forceAskRules`, `checkDrafts` and `vetShape`

- **Location:** `workflows/redline-loop.js:3972-4102` (`forceAskRules`; the R4-2 warning at 4043-4045, the relabel at 4084-4091), `3898-3909` (`checkDrafts` and its `decided`), `4422-4453` (`vetShape`), `3632-3646` (`checkCalls`, which lets a reshape keep a decided call beside a re-sorted finding)
- **Relevance:** R5-2. `checkDrafts` and `checkCauses` already take `decided`; `forceAskRules` is given the same list.

### The loop test's scenarios

- **Location:** `tests/loop-test.mjs` — the mock shaper (`reshapeDefer`, `reshapeDrafts`, `acceptedCalls`, `callOf`, 215-298) and resolve (300-340); `reviewKeys` (191-193); `forcedLater`, `forcedNamed` (4040-4061); the `left:` helpers `pickOf`, `typedDefer` (4848-4849), `billing`, `guard`, `later`, `namedLater` (5057-5062), `laterNoEntry`, `keptFix` (5177-5180); `SHORT_DRAFT` (4871-4880); `RELABELLED` (5014); the `class:` link cases (5298-5320, 5400-5404) and the `places:` link cases (5518-5530)
- **Relevance:** every task's new cases reuse these scenarios and sit beside the checks they neighbour.

### Round 4's spec folder

- **Location:** `agent-os/specs/2026-11-25-1418-127-review-round-4/shape.md`
- **Relevance:** R4-4's entry (members 1 to 6, the R4-4 loop's purpose) is the earlier finding R5-3 is linked to; its Unattended answers item 5 records that node is refused to the shaper.
