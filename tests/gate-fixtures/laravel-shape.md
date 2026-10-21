# Shape Spec

## Prerequisites

This command **must be run in plan mode**.

## Unattended mode (Redline)

7. **The plan.** The final task is the Verification Gate, whose command steps (gate steps 1 to 7) read, in a Redline run: **run `.claude/redline/checks.sh <snapshot>` until it exits 0; its JSON is the evidence.** Steps 8 and 9 stay as written.

## Process

### Step 7: Structure the Plan

Present this structure to the user:

```
Here's the plan structure.

## Task N: Verification Gate

Run `composer fix`, then `composer check`, then the remaining checks in the Verification Gate section, ending with the standards retrospective.

---

Does this plan structure look right?
```

## Verification Gate

**A spec is not complete until every check below passes.** If a check fails, fix the cause and rerun the whole gate.

Run in this order:

1. **`composer fix`** — Rector, then Pint. The only step that mutates files. Also required after any `vendor:publish` or `*:install`.
2. **`composer check`** — must be green. Anything it reports after `fix` is a real problem, not noise. It runs:
   - `pint --test` — formatting, including `declare(strict_types=1)` in every file
   - `rector --dry-run` — no pending rewrites
   - `phpstan analyse --memory-limit=1G` — level 8, zero errors across `app`, `database`, `routes`
   - `php artisan test --parallel` — the full Pest suite
3. **Pest snapshots** — `git status --porcelain tests/.pest/snapshots` prints nothing after the suite ran.
4. **Migrations** — they apply from an empty database with no manual steps. Run CI's command against a scratch database that is wiped first:
   ```
   DB_DATABASE=app_redline_migrate php artisan migrate --force --no-interaction >/dev/null && DB_DATABASE=app_redline_migrate php artisan db:wipe --force --no-interaction && DB_DATABASE=app_redline_migrate php artisan migrate --force --no-interaction
   ```
   CI runs `php artisan migrate --force --no-interaction` on an empty service before `composer check`.
5. **API contract** — run `php artisan scramble:export --path=openapi.json` so the regenerated file is part of the change. CI re-exports and runs `git diff --exit-code openapi.json`.
6. **Environment** — every `env('NAME')` the change adds has a `NAME=` line in `.env.example`. This prints nothing when it holds:
   ```
   base=$(git merge-base main HEAD); for name in $(git diff "$base"..HEAD -- app config | grep '^+' | grep -oE "env\(['\"][A-Z0-9_]+" | sed -E "s/^env\(['\"]//" | sort -u); do grep -qE "^$name=" .env.example || echo "$name is missing"; done
   ```
7. **Octane** — `composer test:octane` passes. Required whenever the spec touches service providers, container bindings, static state, or anything that outlives a request.
8. **Standards retrospective** — the standards are a living record, so every spec ends by asking what it taught. Do this mechanically, not from memory:
   1. List every Decision in `shape.md`, every deviation in `plan.md`'s "As built" section.
   2. Classify each item: already in a standard, missing, or contradicting one.
   3. Present the proposed edits with AskUserQuestion: apply, adjust, or none.
   4. Apply approved edits in their own commit (the user titles it), separate from the spec's code.
   5. If nothing changes, add "Standards retrospective: no changes" under Decisions in `shape.md`.
   The spec is not complete until step 4 or step 5 has happened.
9. **Spec folder** — `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`.

Only after all nine pass, report the spec complete.

## Output Structure

The spec folder will contain `plan.md`, `shape.md`, `standards.md` and `references.md`.
