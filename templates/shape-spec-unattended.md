<!--
Redline: the unattended-mode section for a repository's Agent OS shape-spec.

Paste everything below the line into the repository's .claude/commands/agent-os/shape-spec.md,
right after the plan-mode check under Prerequisites, as its own `## Unattended mode (Redline)`
section. A person running shape-spec by hand sees no difference; the section applies only when
the invoking prompt carries the sentence "This is a Redline run; follow shape-spec in unattended
mode.", which the Redline shaper's prompt does.

Then adjust the parts that are this repository's own (the text below comes from one repository and names its gate):

- Point 7, "gate steps 1 to 7": the Verification Gate's command steps, the ones
  .claude/redline/checks.sh transcribes. "Steps 8 and 9": the gate's prose steps that stay as
  written (for example the standards retrospective and a spec-folder check).
- Point 8, "Gate step 8": the gate's standards retrospective step.
- Point 11, "the repository's standard for agent-written PR descriptions": name the standard
  that tells an agent to redraft a stale PR description as pr-body.md, or drop point 11 if the
  repository has none.
- "Steps 1 to 5" and "Step 6's slug rule" follow Agent OS's shape-spec numbering; check them
  against the repository's copy.

If the gate text names a variable its checks.sh also reads (a scratch database for a migrations
step, say), keep the two in step.
-->

---

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
   - `ask`: a judgment call, as in point 3. A finding the invoking prompt's repository ask rules cover (a `paths` rule on its file or on a file its task would touch, or a `prose` rule's sentence) is `ask` with `why_human: "repository rule <id>"`, never `fix` or `defer`; the person acts on it outside the run.
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
        "story": "A user opens the app, does X, Y happens, which is bad because Z.",
        "why_human": "product decision | spec assumption | new standard | unsure | disproportionate fix | repository rule <id>",
        "options": [{"label": "Full fix", "cost": "...", "effect": "..."}, {"label": "Mitigate", "cost": "...", "effect": "..."}, {"label": "Accept", "cost": "...", "effect": "..."}],
        "recommendation": "Accept; add a comment.",
        "dependsOn": []
      }]
    }
    ```

    The story is plain language about the real-world effect, written for the person who will decide, not a restatement of the finding. Every finding carries `decidedBy` (`"redline"` for a `fix` or `defer`, `"pending"` for an `ask`) and `recommendation`, one sentence a person can act on without opening the spec: the change the plan makes for a `fix`, the mitigation for a `defer`, the option you recommend for an `ask`. Every `ask` finding has exactly one entry in `judgmentCalls`; `fix` and `defer` findings have none. List the calls in the order the person should answer them: a call whose options or recommendation turn on another call's answer comes after it and names it in `dependsOn` (`[]` when it stands alone). The person is asked in exactly that order.
11. **The PR description.** When the round's spec redrafts a stale PR description as `pr-body.md` (per the repository's standard for agent-written PR descriptions), the person's go is the Redline run itself: Redline's Finish phase posts the newest round's `pr-body.md` before it requests review.

Everything not named above is unchanged: the file layout under Output Structure, the `shape.md`, `standards.md` and `references.md` content sections, the Verification Gate text, and the Tips.
