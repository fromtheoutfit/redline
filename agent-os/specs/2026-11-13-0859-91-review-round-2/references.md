# References for PR #91 Review Round 2

Every location is at `ff3f8d5`, the PR head the round reviewed.

## Similar Implementations

### The three statements R2-1 rewords

- **Location:**
  - `docs/running.md:84`, "Hand-off and relaunch", the bullet "The workflow file changed";
  - `skills/redline/SKILL.md:223`, section 7, "The script a relaunch runs (#81)", the `scriptPath` bullet and the line the skill says;
  - `README.md:104`, "Known limits", the bullet "A self-review that edits an agent file runs its later rounds under the edit".
- **Relevance:** the only places that state a `scriptPath` relaunch's prompt behaviour (`shape.md`, Decision 3, gives the search).
- **Key patterns:** `docs/running.md:88` already words an unmeasured fact the way the fix needs, in the same section: "whether an interactive session reloads them mid-session was not measured, and nothing above depends on it". README line 104 already lists unmeasured facts as "Two things were not measured: ...".

### The #81 spec and plan

- **Location:** `agent-os/specs/2026-11-12-1852-81-pin-relaunch-script-finish-rule/`:
  - `shape.md:39`, decision 4 and its rider (what the docs and the skill's line say about the prompt);
  - `shape.md:75-76`, probe d (the headless denial, the only measurement);
  - `shape.md:78-81`, "Unmeasured";
  - `plan.md:25-27`, "Unmeasured, recorded as such";
  - `plan.md:128-136`, "How this PR's own Redline review should be run".
- **Relevance:** the evidence that both prompt cases are unmeasured, and the rider whose content the rewording keeps (`shape.md`, Unattended answers 1 and 2).
- **Key patterns:** none copied. The probe facts it records are cited, not repeated.

### Round 1 of this PR

- **Location:** `agent-os/specs/2026-11-13-0859-91-review-round-1/shape.md:31`, Decision 4; `plan.md`, "As built" (the gate's counts).
- **Relevance:** Decision 4 says the bypass case is "still unmeasured", and the As built counts are this round's expected counts.
- **Key patterns:** the spec layout, the Docs entries and the proof greps follow round 1's.
