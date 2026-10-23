# Shape Spec

Gather context and structure planning for significant work. **Run this command while in plan mode.**

## Prerequisites

This command **must be run in plan mode**.

If NOT in plan mode, **stop immediately** and tell the user:

```
Shape-spec must be run in plan mode. Please enter plan mode first, then run /shape-spec again.
```

Do not proceed with any steps below until confirmed to be in plan mode.

## Process

### Step 7: Structure the Plan

Present this structure to the user:

```
Here's the plan structure. Task 1 saves all our shaping work before implementation begins.

## Task 1: Save Spec Documentation

Create `agent-os/specs/{folder-name}/` with the plan.

## Task N: Verification Gate

Run the five commands in the Verification Gate section (`.claude/redline/checks.sh --baseline` runs them all and prints one JSON object), then the standards retrospective.

---

Does this plan structure look right?
```

### Step 9: Ready for Execution

When the full plan is ready:

```
Plan complete. When you approve and execute:

1. Task 1 will save all spec documentation first
2. Then implementation tasks will proceed
```

## Verification Gate

**A spec is not complete until every check below passes.** It is the final task of every plan, it is not optional, and it is not skippable for "small" changes.

Run in this order:

1. **Syntax** — `ls scripts/*.sh | xargs -n1 bash -n` parses every script (`bash -n` reads only its first file, so each gets its own), and `jq -e . hooks/hooks.json` parses the hook registration.
2. **Manifest** — `claude plugin validate .` passes. The plugin directory's icon warning is known and is not a failure.
3. **Guard** — `tests/guard-test.sh` prints `N passed, 0 mismatched`. Every change to the guard adds a row in `tests/guard-cases.tsv`.
4. **Loop** — `node tests/loop-test.mjs` prints `N checks passed, 0 failed`.
5. **Prefs** — `tests/prefs-test.sh` prints `N passed, 0 failed`. A change to the merge rules adds a case.
   Steps 1 to 5 are what `.claude/redline/checks.sh --baseline` runs, in this order, as one command that prints one JSON object. About 20 seconds on 2026-10-21, almost all of it the guard table.
6. **Standards retrospective** — the standards are a living record, so every spec ends by asking what it taught. Do this mechanically, not from memory:
   1. List every Decision in `shape.md`, every deviation in `plan.md`'s "As built" section.
   2. Classify each item: already in a standard, missing, or contradicting one. Also confirm no pattern was invented that is not in `agent-os/standards/`.
   3. Present the proposed edits with AskUserQuestion: apply, adjust, or none.
   4. Apply approved edits in their own commit, separate from the spec's code.
   5. If nothing changes, add "Standards retrospective: no changes" under Decisions in `shape.md`.
   The spec is not complete until step 4 or step 5 has happened.
7. **Spec folder** — `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`.

Only after all seven pass, report the spec complete.

## Output Structure

The spec folder will contain:

```
agent-os/specs/{YYYY-MM-DD-HHMM-feature-slug}/
├── plan.md           # The full plan
└── shape.md          # Shaping decisions and context
```

## Tips

- **The gate is the definition of done** — A spec with a red `checks.sh --baseline` is unfinished work.
