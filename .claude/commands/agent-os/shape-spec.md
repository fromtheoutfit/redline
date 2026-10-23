# Shape Spec

Gather context and structure planning for significant work. **Run this command while in plan mode.**

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Offer suggestions** — Present options the user can confirm, adjust, or correct
- **Keep it lightweight** — This is shaping, not exhaustive documentation

## Prerequisites

This command **must be run in plan mode**.

**Before proceeding, check if you are currently in plan mode.**

If NOT in plan mode, **stop immediately** and tell the user:

```
Shape-spec must be run in plan mode. Please enter plan mode first, then run /shape-spec again.
```

Do not proceed with any steps below until confirmed to be in plan mode.

## Unattended mode (Redline)

This section applies only when the invoking prompt declares a Redline run, with the sentence **"This is a Redline run; follow shape-spec in unattended mode."** A person running this command by hand never sees any difference: every step, the gate and the output structure below stay exactly as written, and this section only says what changes when no person is present.

In a Redline run you are the **shaper**: a subagent shaping one review round of a pull request. The invoking prompt gives you the PR number (or a spike name), the round number, the launch timestamp, and the round's findings. Each finding has an ID like `R1-4`, a file and line, a category, a severity, a description and, usually, a proposed fix.

**What changes:**

1. **Plan mode.** Skip the plan-mode check above. You cannot enter plan mode, and nothing below depends on it.
2. **No questions.** `AskUserQuestion` is not available to you, and no person is watching. For every question Steps 1 to 5 would put to a person (scope, visuals, references, product context, standards), answer it yourself from the findings and the code, and record the answer **and its evidence** (the file, line, spec or standard you read) in `shape.md` under a heading `## Unattended answers`. Never invent a citation: cite only files, issues and specs you opened. A question the PR description, the original spec or the code's own docblock already answers is answered from that evidence (quote the line) and recorded here, never escalated as a judgment call, even when a finding asks it: the author has answered it. Where the code disagrees with that answer, the disagreement is the finding to fix (a name, a docblock, a test that pins the stated behaviour).
3. **Judgment calls are returned, never decided.** A question that depends on product intent, on an assumption in the original feature spec, on a standard the codebase does not follow yet, on a fix out of proportion to the finding (see the proportionality rule below) with no cheap mitigation, or on anything you still cannot settle after reading the code, is **not answered**. It becomes a judgment call: a *pending* entry under `## Decisions` in `shape.md`, a task marked `pending decision <id>` in `plan.md`, and an object in the `judgmentCalls` array you return. Do not pick an option, do not implement a default, do not resolve it by reading a past spec and treating the matter as closed. The person decides; a later agent applies the decision.
   **Every decision names its owner.** Each decided entry under `## Decisions` (a `fix`, a `defer`, an unattended answer) ends with the line `Decided by: redline`. A pending entry has no owner line; the agent that applies the decision adds `Decided by: @<login>` (the person) or `Decided by: redline (autopilot)` (the run took your recommendation on autopilot).
4. **Dispositions.** Sort every finding into exactly one of:
   - `fix`: a clear correctness bug or nit with a proportionate fix. It becomes a plan task.
   - `defer`: a real bug whose full fix is out of proportion to its likelihood and impact, where a cheap mitigation exists (a guard, a clear error, a log line, a code comment naming the finding). The mitigation becomes a plan task; the full fix is listed under `## Deferred` in `shape.md`.
   - `ask`: a judgment call, as in point 3.
   **Proportionality rule.** Before choosing `fix` for a correctness finding, record two things in `shape.md`: how likely and visible the failure is (observed? reachable by a normal user? what happens when it fires?) and what the fix costs (files touched, especially outside the PR's diff; new dependencies, services or abstractions; rough size). When the cost is out of proportion to the likelihood and impact, you may not choose the full fix on your own: it is `defer` if a cheap mitigation exists, otherwise `ask`.
5. **Investigate before you sort.** Read the code a finding names and its callers and tests. A finding you cannot confirm or refute after that is `ask` with `why_human: "unsure"`, never silently dropped and never marked `fix` on trust.
6. **Scope and folder name.** Scope is the round's findings, nothing more. The spec folder is `agent-os/specs/YYYY-MM-DD-HHMM-<pr>-review-round-<n>/`, where the timestamp is the launch timestamp **from the invoking prompt**, never the clock, so a relaunch names the same folder. Step 6's slug rule does not apply.
7. **The plan.** Task 1 is "Save spec documentation", as always. Then one task per `fix` or `defer` finding, in finding order, each naming the file, the change and the test that proves it. Then one task per `ask` finding, titled `Pending decision <id>: <title>`, holding the options rather than a change. The final task is the Verification Gate, whose command steps (gate steps 1 to 7) read, in a Redline run: **run `.claude/redline/checks.sh <snapshot>` until it exits 0; its JSON is the evidence.** The script is a transcription of those steps, so the gate text stays the source. Steps 8 and 9 stay as written. You do not run the gate; the implementer and checker do. Every command the plan gives the implementer to run, in a task or in the gate, is a plain pipeline: no `$`, backticks, process substitution (`<(`, `>(`) or interpreter (`python3`, `node`, `php -r`). Those are the Bash rules Redline's agents follow, and the implementer's guard refuses a command that breaks them.
8. **Standards retrospective.** Gate step 8's edits are proposed, not applied. Write the proposed edit list (file, line, the drafted wording, or "no changes") under `## Standards retrospective (proposed)` in `shape.md`. An item whose wording depends on a pending decision is listed as `Held for <id>` with what it would record; the resolve agent drafts it once the person has decided, before the standards approver runs. The standards approver approves the list and the implementer applies it in its own commit. `standards.md` still records each applied standard as it reads at shaping time.
9. **You write only the spec folder.** Create it with Write. Do not edit source files and do not run `gh`. Read-only `git` (`status`, `diff`, `log`, `show`, `blame`) is fine; never stage, commit, check out, stash or create branches. If a referenced file does not exist, say so in `shape.md` rather than creating it.
10. **What you return.** Your final output is JSON, not prose:

    ```json
    {
      "specFolder": "agent-os/specs/2026-10-18-0912-21-review-round-1",
      "findings": [
        {"id": "R1-1", "disposition": "fix", "decidedBy": "redline", "recommendation": "Reject a status outside the enum in the request rules; a feature test proves it."},
        {"id": "R1-2", "disposition": "ask", "decidedBy": "pending", "recommendation": "Accept; add a comment."}
      ],
      "judgmentCalls": [{
        "id": "R1-2",
        "title": "Short summary",
        "story": "A teammate runs the command, does X, Y happens, which is bad because Z.",
        "why_human": "product decision | spec assumption | new standard | unsure | disproportionate fix",
        "options": [{"label": "Full fix", "cost": "...", "effect": "..."}, {"label": "Mitigate", "cost": "...", "effect": "..."}, {"label": "Accept", "cost": "...", "effect": "..."}],
        "recommendation": "Accept; add a comment.",
        "dependsOn": []
      }]
    }
    ```

    The story is plain language about the real-world effect, written for the person who will decide, not a restatement of the finding. Every finding carries `decidedBy` (`"redline"` for a `fix` or `defer`, `"pending"` for an `ask`) and `recommendation`, one sentence a person can act on without opening the spec: the change the plan makes for a `fix`, the mitigation for a `defer`, the option you recommend for an `ask`. Every `ask` finding has exactly one entry in `judgmentCalls`; `fix` and `defer` findings have none. List the calls in the order the person should answer them: a call whose options or recommendation turn on another call's answer comes after it and names it in `dependsOn` (`[]` when it stands alone). The person is asked in exactly that order.
11. **The guard and the hook.** In this repository the guard refuses `scripts/redline-guard.sh` and `hooks/hooks.json` to every role, so a finding whose fix is in either file is `defer`, never `fix`: a person makes the change after the run. Its mitigation, the round's task and commit for the finding, changes only a file the run may write: a `tests/guard-cases.tsv` row pinning today's decision under a comment naming the finding, or, when no row can show it, a line under Known limits in `README.md`. The full fix, under `## Deferred`, names the file and says a person changes it. Use `ask` only when the finding also needs a decision; its options are then ones a person carries out outside the run. The same holds for `.claude/redline/checks.sh` and its gate stamp: a finding whose fix changes the backticked text of the Verification Gate needs a restamp that no role may write, so it is `defer` too, mitigated by a line under Known limits in `README.md` naming the finding, and a person edits the gate and restamps after the run. So is a fix in `scripts/redline-gate.sh` that changes how the hash is computed (what counts as an item, how items are normalised or joined) or how the stamp line is written: either one moves this checkout's stamp, so it is `defer`, mitigated the same way, and a person changes the script, repins the fixture hashes in `tests/gate-test.sh` and restamps after the run. `checks.sh` itself is generated from `.claude/redline/checks.json` by `scripts/redline-setup.sh checks`, and no role may write either file: a finding whose fix changes a check is `defer` the same way, and a person edits `checks.json`, regenerates and restamps after the run. So is a finding whose fix touches `scripts/checks-template.sh` below its header, or changes the text `redline-setup.sh checks` writes into this repository's `checks.sh` (its header, the template version line, the check block): the setup test's last cases regenerate `checks.sh` from `checks.json` and compare it with the committed file, and no role may regenerate it, so such a fix leaves the gate red. It is `defer`, mitigated by a line under Known limits in `README.md` naming the finding; its entry under `## Deferred` records the intended lines, and a person makes the change, regenerates `checks.sh` and restamps after the run.

Everything not named above is unchanged: the file layout under Output Structure, the `shape.md`, `standards.md` and `references.md` content sections, the Verification Gate text, and the Tips.

## Process

### Step 1: Clarify What We're Building

Use AskUserQuestion to understand the scope:

```
What are we building? Please describe the feature or change.

(Be as specific as you like — I'll ask follow-up questions if needed)
```

Based on their response, ask 1-2 clarifying questions if the scope is unclear. Examples:
- "Is this a new feature or a change to existing functionality?"
- "What's the expected outcome when this is done?"
- "Are there any constraints or requirements I should know about?"

### Step 2: Gather Visuals

Use AskUserQuestion:

```
Do you have any visuals to reference?

- Mockups or wireframes
- Screenshots of similar features
- Examples from other apps

(Paste images, share file paths, or say "none")
```

If visuals are provided, note them for inclusion in the spec folder.

### Step 3: Identify Reference Implementations

Use AskUserQuestion:

```
Is there similar code in this codebase I should reference?

Examples:
- "The comments feature is similar to what we're building"
- "Look at how src/features/notifications/ handles real-time updates"
- "No existing references"

(Point me to files, folders, or features to study)
```

If references are provided, read and analyze them to inform the plan.

### Step 4: Check Product Context

Check if `agent-os/product/` exists and contains files.

If it exists, read key files (like `mission.md`, `roadmap.md`, `tech-stack.md`) and use AskUserQuestion:

```
I found product context in agent-os/product/. Should this feature align with any specific product goals or constraints?

Key points from your product docs:
- [summarize relevant points]

(Confirm alignment or note any adjustments)
```

If no product folder exists, skip this step.

### Step 5: Surface Relevant Standards

Read `agent-os/standards/index.yml` to identify relevant standards based on the feature being built.

Use AskUserQuestion to confirm:

```
Based on what we're building, these standards may apply:

1. **api/response-format** — API response envelope structure
2. **api/error-handling** — Error codes and exception handling
3. **database/migrations** — Migration patterns

Should I include these in the spec? (yes / adjust: remove 3, add frontend/forms)
```

Read the confirmed standards files to include their content in the plan context.

### Step 6: Generate Spec Folder Name

Create a folder name using this format:
```
YYYY-MM-DD-HHMM-{feature-slug}/
```

Where:
- Date/time is current timestamp
- Feature slug is derived from the feature description (lowercase, hyphens, max 40 chars)

Example: `2026-01-15-1430-user-comment-system/`

**Note:** If `agent-os/specs/` doesn't exist, create it when saving the spec folder.

### Step 7: Structure the Plan

Now build the plan with **Task 1 always being "Save spec documentation"** and **the final task always being "Verification Gate"** (see the Verification Gate section below).

Present this structure to the user:

```
Here's the plan structure. Task 1 saves all our shaping work before implementation begins. The last task is the verification gate; the spec is not complete until it passes.

---

## Task 1: Save Spec Documentation

Create `agent-os/specs/{folder-name}/` with:

- **plan.md** — This full plan
- **shape.md** — Shaping notes (scope, decisions, context from our conversation)
- **standards.md** — Relevant standards that apply to this work
- **references.md** — Pointers to reference implementations studied
- **visuals/** — Any mockups or screenshots provided

## Task 2: [First implementation task]

[Description based on the feature]

## Task 3: [Next task]

...

## Task N: Verification Gate

Run the seven commands in the Verification Gate section (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then the standards retrospective. Fix anything that fails and rerun. The spec is not complete until the gate is green and the retrospective has either landed in the standards or recorded "no changes".

---

Does this plan structure look right? I'll fill in the implementation tasks next.
```

### Step 8: Complete the Plan

After Task 1 is confirmed, continue building out the remaining implementation tasks based on:
- The feature scope from Step 1
- Patterns from reference implementations (Step 3)
- Constraints from standards (Step 5)

Each task should be specific and actionable.

### Step 9: Ready for Execution

When the full plan is ready:

```
Plan complete. When you approve and execute:

1. Task 1 will save all spec documentation first
2. Then implementation tasks will proceed
3. The final task runs the verification gate, ending with the standards retrospective. The spec is not complete until it is green and the standards are updated or "no changes" is recorded

Ready to start? (approve / adjust)
```

## Verification Gate

**A spec is not complete until every check below passes.** It is the final task of every plan, it is not optional, and it is not skippable for "small" changes. If a check fails, fix the cause and rerun the whole gate. Never mark a spec done on a partial or failing run, and report failing output verbatim.

Run in this order:

1. **Syntax** — `ls scripts/*.sh | xargs -n1 bash -n` parses every script (`bash -n` reads only its first file, so each gets its own), and `jq -e . hooks/hooks.json` parses the hook registration (`hooks/` holds only that JSON file, so `bash -n` is the wrong check for it). Nothing here mutates a file: there is no formatter in this repository.
2. **Manifest** — `claude plugin validate .` passes. It checks `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the agents, the skills and the commands. The plugin directory's icon warning is known and is not a failure; `--strict` is not used.
3. **Guard** — `tests/guard-test.sh` prints `N passed, 0 mismatched`. Every change to `scripts/redline-guard.sh` adds or changes a row in `tests/guard-cases.tsv` in the same commit, and keeps a row for the neighbouring decision that must not change. From this checkout the harness uses the empty repository under `~/.cache/redline/` for the rows that need a repository that is not the plugin, and the checkout itself for the `# @cwd PLUGIN` rows.
4. **Loop** — `node tests/loop-test.mjs` prints `N checks passed, 0 failed`. A change to `workflows/redline-loop.js` that alters which agents run, in what order, with what prompt text, or what the script returns, adds a check.
5. **Prefs** — `tests/prefs-test.sh` prints `N passed, 0 failed`. A change to the merge rules in `scripts/redline-prefs.sh` adds a case.
6. **Gate stamp** — `tests/gate-test.sh` prints `N passed, 0 failed`. A change to `scripts/redline-gate.sh` adds a case; the fixtures under `tests/gate-fixtures/` cover the gate shapes seen so far. Its last case checks this checkout's own stamp, so any change to the backticked text of this list is followed by `scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` in the same commit.
7. **Setup** — `tests/setup-test.sh` prints `N passed, 0 failed`. A change to `scripts/redline-setup.sh` or `scripts/checks-template.sh` adds a case. Its last cases regenerate this checkout's own `checks.sh` from `.claude/redline/checks.json` and compare, so `checks.sh` is never edited by hand: a change to the checks is an edit to `checks.json`, then `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh`, then the restamp above when this list's backticked text moved.
   Steps 1 to 7 are what `.claude/redline/checks.sh --baseline` runs, in this order, as one command that prints one JSON object; a Redline run's checker runs the same script with the round's snapshot. The script's header records the baseline time, almost all of it the guard table.
8. **Standards retrospective** — the standards are a living record, so every spec ends by asking what it taught. Do this mechanically, not from memory:
   1. List every Decision in `shape.md`, every deviation in `plan.md`'s "As built" section, and every check that went red during the build and was fixed by learning something about Claude Code, the harness or the tooling.
   2. Classify each item: already in a standard (cite the file), missing (name the file and draft the line), or contradicting a standard (quote the line that is now wrong). Also confirm no pattern was invented that is not in `agent-os/standards/`; if one was needed, it was proposed and added before use.
   3. Present the proposed edits with AskUserQuestion: apply, adjust, or none.
   4. Apply approved edits in their own commit (the user titles it), separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) goes in a following commit together with the case proving a violation fails.
   5. If nothing changes, add "Standards retrospective: no changes" under Decisions in `shape.md`, so the absence is deliberate and visible.
   The spec is not complete until step 4 or step 5 has happened.
9. **Spec folder** — `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`.

Only after all nine pass, report the spec complete.

## Output Structure

The spec folder will contain:

```
agent-os/specs/{YYYY-MM-DD-HHMM-feature-slug}/
├── plan.md           # The full plan
├── shape.md          # Shaping decisions and context
├── standards.md      # Which standards apply and key points
├── references.md     # Pointers to similar code
└── visuals/          # Mockups, screenshots (if any)
```

## shape.md Content

The shape.md file should capture:

```markdown
# {Feature Name} — Shaping Notes

## Scope

[What we're building, from Step 1]

## Decisions

- [Key decisions made during shaping]
- [Constraints or requirements noted]

## Context

- **Visuals:** [List of visuals provided, or "None"]
- **References:** [Code references studied]
- **Product alignment:** [Notes from product context, or "N/A"]

## Standards Applied

- api/response-format — [why it applies]
- api/error-handling — [why it applies]
```

## standards.md Content

Include the full content of each relevant standard:

```markdown
# Standards for {Feature Name}

The following standards apply to this work.

---

## api/response-format

[Full content of the standard file]

---

## api/error-handling

[Full content of the standard file]
```

## references.md Content

```markdown
# References for {Feature Name}

## Similar Implementations

### {Reference 1 name}

- **Location:** `src/features/comments/`
- **Relevance:** [Why this is relevant]
- **Key patterns:** [What to borrow from this]

### {Reference 2 name}

...
```

## Tips

- **Keep shaping fast** — Don't over-document. Capture enough to start, refine as you build.
- **Visuals are optional** — Not every feature needs mockups.
- **Standards guide, not dictate** — They inform the plan but aren't always mandatory.
- **Specs are discoverable** — Months later, someone can find this spec and understand what was built and why.
- **The gate is the definition of done** — A spec with a red `checks.sh --baseline` is unfinished work, however small the change.
- **Standards are a living record** — The retrospective in gate step 7 is how they grow. A spec that taught nothing says so in `shape.md`; a spec that taught something changes a standard in its own commit.
