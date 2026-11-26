# References for PR #127 by hand: every new key states its place

## The run

- **Run `wf_6478a046-32b`**, the self-review of #127, in this project's workflow records: the run record and its six saved launches, the journal (30 results) and each agent's transcript. The three `shape r2` agents are `a072e6aaccbc75715` (no return), `a0cd89872e7e66565` and `a6069304786f98501`; `shape.md` quotes what the last two returned.
- **Round 2's review** on #127 (R2-1 to R2-7), posted by that run. R2-2 is `templates/shape-spec-unattended.md`, line 92: "The return example recommends an option ending in accept for a recommendation that adds a comment".

## Similar Implementations

### Template v6 (#105, #75, #126)

- **Location:** `agent-os/specs/2026-11-24-1231-105-template-v6-ends-class-rule-defer/` (decision 19, the sweep's check; table B, every place the shaper's return shape is stated or checked; "How the tables were built"); `workflows/redline-loop.js`, `CAUSE_SCHEMA`, `CAUSE_ASK`, `checkCauses`, `checkOptions`, `honourLinks`.
- **Relevance:** It added every key this spec's tables list. Its decision 19 says a sweep returns `cause.swept`; the prose it wrote for the shaper never says so.
- **Key patterns:** A class table built by running the harness loaded up to its first scenario; an ask stated in the prompt so the answer does not depend on the agent file the session loaded; a version bump with the previous body frozen and pinned.

### Round 1 of #127

- **Location:** `agent-os/specs/2026-11-24-1712-127-review-round-1/` (R1-5, R1-6); `workflows/redline-loop.js`, `checkCauses` and `checkOptions`.
- **Relevance:** R1-5 made both checks name every fault of every finding in one error, since a reshape corrects what the error names. This spec's messages keep that: each fault is one entry of the same list. R1-6 worded a stop by the outcome it concerns.
- **Key patterns:** `faults.join('; also, ')`; a message's opening words are what the loop test's own-check list matches, so they do not change.

### The link a pass cannot keep (#75; #127, R1-3)

- **Location:** `workflows/redline-loop.js`, `honourLinks` and `linkFault`.
- **Relevance:** Every link the workflow cannot keep is cleared with a warning that says why. Decisions 6 and 8 give a misplaced link and an unreadable one the same treatment.
- **Key patterns:** `round <n>: the reviewer linked <id> to <id> as one class (sameClassAs), but <why>; the link is cleared`.

### A decision's keys are refused before any agent runs (#105; #108, R2-6)

- **Location:** `workflows/redline-loop.js`, the two loops over `decisions` after `CALL_ENDS`.
- **Relevance:** Decision 7 refuses an entry that is no object in the same place and the same form.
- **Key patterns:** `fail('args.decisions must ...; got <id>: <entry>')`.

### The unattended section's version bump

- **Location:** `scripts/redline-setup.sh`, the `unattended` subcommand (its header and `merge3`); `tests/setup-test.sh`, `ubody_pin`, the history cases and the cases on this checkout's own section; `templates/history/`; `agent-os/standards/process/release.md`, the last line.
- **Relevance:** v6 to v7 follows v5 to v6 step for step, including the one conflicting hunk beside this repository's point 11.
- **Key patterns:** Freeze the previous body with its marker and its `---` line; pin the new version's body hash beside the older lines, which never change; dry-run the merge against this checkout's own section before the body is final.

## The harness

- `tests/loop-test.mjs`: `mock`, `go`, `f`, `prior`, `baseArgs`, `goAhead`, `OWN_CHECKS`, and the sections "ends", "left" and "class", whose fixtures the probe reused.
- The probe itself was a scratch script and is not kept; `shape.md`, "How the tables were built" and "The runs", say what it ran.
