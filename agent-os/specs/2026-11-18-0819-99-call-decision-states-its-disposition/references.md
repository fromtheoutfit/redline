# References for #99: a call's decision states its disposition

## Similar Implementations

### The finding and its drafted issue (#97, R2-15)

- **Location:** `agent-os/specs/2026-11-16-1358-97-review-round-2/shape.md`, Decision 7 and `## Deferred`.
- **Relevance:** the judgment call this issue comes from, with the story, the three options and the drafted issue the run filed as #99.
- **Key patterns:** the full fix as first costed (a field in the resolve agent's JSON, the prompt and the agent file asking for it, `isDeferral` reading it, three loop cases); the mitigation that shipped, one sentence in `resolvePrompt` saying when a deferred entry is returned, which this spec's ask replaces and keeps the rule of.

### The inference this spec replaces (#100, decisions 13 and 14)

- **Location:** `agent-os/specs/2026-11-17-1535-100-deferral-ships-from-the-record/shape.md`; `workflows/redline-loop.js`, `mitigationFilled` and `isDeferral`.
- **Relevance:** #100 left one emptiness test at the line #99 replaces, and made every deferral's commit optional, which is why a fix read as a deferral now passes the check with a warning.
- **Key patterns:** what ships is read from the round's record and never from a field's words; a list the record is read from is required in its schema and asked for in every prompt that returns it.

### An override names its disposition, and its stray entry is dropped (#103, R1-11 and R2-8)

- **Location:** `agent-os/specs/2026-11-17-1643-103-review-round-1/shape.md` (Decision 3) and `-round-2/shape.md` (Decision 2); `workflows/redline-loop.js`, `awayFromDefer`, `strayOverride` in `resolveWith`, and the first branch of `isDeferral`.
- **Relevance:** the rule for an override is the one this spec gives a call: the named disposition decides, and an entry beside a fix or an accept is dropped with a warning before the round's list takes it, ahead of the draft check.
- **Key patterns:** the drop sits in `resolveWith`, so neither the plan approver nor the implementer is shown the entry and no draft stop is raised; the loop check reads both prompts and the warning.

### A result the run cannot use stops at resolve (#95; #97, R2-13)

- **Location:** `workflows/redline-loop.js`, the `undrafted` and `unentered` stops in `resolveWith`; `tests/loop-test.mjs`, "defer: a deferral the resolve agent returns with no drafted issue stops at resolve" and "defer: a defer override with no deferred entry stops at resolve".
- **Relevance:** the form of this spec's stops: a stage error at `resolve` whose `resumeFrom` is the resolve label, pinned by its text and its label.
- **Key patterns:** `stageError('resolve', …)` after the resolve's own `run`, so the label falls to the resolve call; one sentence that says what the agent returned and what the rule is.

### A reshape and a decided finding (#94, R8-6; #97, R3-6; #103, R3-4, now #106)

- **Location:** `agent-os/specs/2026-11-17-1643-103-review-round-3/shape.md` (Decision 1); `workflows/redline-loop.js`, the reshape loop in `revise()`, `plannedFiles` and `effectiveDispositions`.
- **Relevance:** what this spec leaves alone, and the one path of #106 it closes: `isDeferral` stops reading the resolve's tasks, while `plannedFiles` keeps reading them.
- **Key patterns:** a decision stands whatever a reshape lists for its finding; the reshape's entry for a decided finding is dropped with a warning.

### A run in flight (#81)

- **Location:** `agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/shape.md`, "What the probes did and showed"; `scripts/redline-prefs.sh`, `run check` and `run drift`.
- **Relevance:** what replays and what is read fresh: replay follows the prompt sequence, the agent file's body is not in the key, the session reads its agent files at its start and again when reopened, and only the plugin's own repository pins the script.
- **Key patterns:** a change to a prompt reruns that step and every step after it on a relaunch that loads the new script, so an ask is placed where the calls it does not concern keep their bytes.

## Code read

- `workflows/redline-loop.js`: `DEFERRED_SCHEMA`, `mitigationFilled`, `firstPerId`, `RESOLVE_SCHEMA`, `autopilotDecision`, `resolvePrompt`, `planPrompt`, `implementPrompt`, `outcomesFor`, `checkDispositions`, and in `revise()`: `resolveWith`, `effectiveDispositions`, `plannedFiles`, `isDeferral`, `draftStop`, the reshape loop, `needCommits`, the filing and the outcomes.
- `agents/redline-resolve.md`, step 3 and the return block; `agents/redline-shaper.md`, rule 10, for the option shape the noted follow-up would change.
- `tests/loop-test.mjs`: the scripted resolve agent, and the filing section's cases from `chosen` to `unbuilt`.
- `skills/redline/SKILL.md`, the `decisions` hand-off and "Record each answer"; `docs/running.md`, "Dispositions", "Deferred items" and "Hand-off and relaunch".
