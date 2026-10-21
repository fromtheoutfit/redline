# Shape Spec

## Prerequisites

This command **must be run in plan mode**.

## Unattended mode (Redline)

7. **The plan.** The final task is the Verification Gate, whose command steps (gate steps 1 to 3: `php artisan test --compact`, `vendor/bin/phpstan analyse`, `npm run type-check`) read, in a Redline run: **run `.claude/redline/checks.sh <snapshot>` until it exits 0; its JSON is the evidence.** Step 4, the standards retrospective, stays as written.

## Process

### Step 7: Structure the Plan

Present this structure to the user:

```
Here's the plan structure. Task 1 saves all our shaping work before implementation begins.

---

## Task 1: Save Spec Documentation

Create `agent-os/specs/{folder-name}/` with the plan.

## Task 2: [First implementation task]

[Description based on the feature]

...

## Task N (FINAL — ALWAYS INCLUDED): Verification gate

Run the full verification gate, in order. The spec is not complete until every step passes:

1. `php artisan test --compact` — full test suite must pass
2. `vendor/bin/phpstan analyse` — PHP static analysis must pass with no new errors
3. `npm run type-check` — Vue/TS static analysis (`vue-tsc --noEmit`) must pass with no new errors
4. **Standards retrospective** — per `agent-os/standards/process/standards-retrospective.md`:
   check what this spec taught against `agent-os/standards/`, add any pattern it invented,
   correct anything it proved stale, and keep `index.yml` in step. If the spec taught nothing,
   record `Standards retrospective: no changes` in `shape.md`. "No changes" is valid; silence is not.

If any step fails, fix the underlying issue (do not bypass) and rerun before marking the
spec complete.

---

Does this plan structure look right? I'll fill in the implementation tasks next.
```

### Step 8: Complete the Plan

**Always include the final verification task** (full test suite + PHPStan + `npm run type-check` + the standards retrospective) as the last task in every plan.

## shape.md Content

```markdown
# {Feature Name} — Shaping Notes

## Standards Retrospective

- **Deviation, not a standard change:** [what we did differently and why it stays a one-off]

## Verification Gate

Spec is not complete until `php artisan test --compact`, `vendor/bin/phpstan analyse`, and
`npm run type-check` all pass, and the standards retrospective above is filled in.
```

## standards.md Content

Include the full content of each relevant standard.
