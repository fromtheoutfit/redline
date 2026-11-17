# References for #100: a deferral ships from the round's record

## Similar Implementations

### The reading this spec replaces (#95, decision 35)

- **Location:** `agent-os/specs/2026-11-16-1026-95-defer-means-tracked/shape.md`, decision 35; `workflows/redline-loop.js`, `hasMitigation` and `NOTHING_SHIPS`
- **Relevance:** "A deferral with no mitigation has no commits of its own; 'no mitigation' is read one way." The one reader was the field's words.
- **Key patterns:** the rule that a commit which only names an id is not its mitigation is kept; what "no mitigation" means moves from the words to the record.

### The phrase list and why it was widened (#97, R1-7 and R3-2)

- **Location:** `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md` (Unattended answer 6, Decision 4); `agent-os/specs/2026-11-16-1358-97-review-round-3/shape.md` (Unattended answer 6, Decision 1, and the drafted issue under Deferred, which became #100)
- **Relevance:** the two rounds that widened the list, and the round that deferred a reading resting on no free text. R3-2's draft offers both signals this spec chose between.
- **Key patterns:** the pinned wording `No code ships in this pull request.` is the residual R3-2 names.

### A task planned with files (#97, R2-6) and a commit of the finding's own (#97, R3-5)

- **Location:** `workflows/redline-loop.js`, `shaperPlanned`, `plannedTask` and `ownCommit`; `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md` (Unattended answer 10); `agent-os/specs/2026-11-16-1358-97-review-round-3/shape.md` (Unattended answer 9)
- **Relevance:** the two records this spec reads. R2-6 split "planned" by who decided the finding; R3-5 defined a commit of a finding's own.
- **Key patterns:** both helpers are reused as they are. R3-5's rule, once the rule for a planned deferral that ships nothing, becomes the rule for every deferral.

### A decided finding is a deferral only when its decision made it one (#97, R1-10 and R2-15)

- **Location:** `workflows/redline-loop.js`, `isDeferral` and `resolveDeferred`; `agent-os/specs/2026-11-16-1358-97-review-round-1/shape.md` (Decision 6); `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md` (Decision 7, the drafted issue that became #99)
- **Relevance:** the one place where the record cannot stand in for the words, and the issue that will replace the test left there.
- **Key patterns:** `strayResolve` and `strayRaised` in `tests/loop-test.mjs` are the pins that must not move.

### The done rule (#93) and the final nit pass

- **Location:** `workflows/redline-loop.js`, `bought` and `fixed` at the end of `revise()`, and the run loop that reads them; `docs/running.md`, "What buys the next round"
- **Relevance:** `bought` is evaluated after the round's commits are read, which is what lets a deferral buy a round by its own commit.
- **Key patterns:** `fixed` already reads each outcome's commits; `bought` now does the same for a deferral.
