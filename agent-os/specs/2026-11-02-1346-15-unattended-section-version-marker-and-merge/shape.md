# Unattended-section version marker, launch warning and a rerun that carries template body changes (#15) — Shaping Notes

## Scope

Issue #15, as read on 2026-11-02 with the eight decisions in the shaping prompt and three answered during shaping. The unattended section a repository's `shape-spec.md` carries gets a version marker (`<!-- redline-unattended: vN -->`); `redline-setup.sh unattended` writes it on insert, reads it on a rerun (`--version`), and on a mismatch shows a three-way view (the frozen body at the repository's version, the current template, the repository's section) and merges the template's changes while keeping hand edits, asking on a conflict; the launch precheck warns, never stops, on an older or missing marker and on settings.json entries missing or retired, through one read-only command, `version <repoRoot>`. Past template bodies are frozen under `templates/history/`. This checkout is brought up to date in the same spec.

## Decisions

See `plan.md`, "Decisions" (thirteen, each with its owner). In short:

1. The marker is the section's first line inside it, carried by the template body itself. Decided by: @michaelwitwicki.
2. The precheck warns with the issue's wording, never stops. Decided by: @michaelwitwicki.
3. Frozen copies under `templates/history/shape-spec-unattended.vN.md`, one per past version, with a setup-test case that fails a bump that forgot to freeze. Decided by: @michaelwitwicki.
4. Versions v1, v2, v3 from the template's three git bodies; an unmarked section's base is guessed by fewest differing lines (tie: newest) and reported as guessed. Decided by: @michaelwitwicki.
5. All three merge sides carry the wanted fill-ins before a diff3 merge over difflib matching blocks; hand edits and hand deletions kept, template changes taken, both-changed is a conflict the person picks; the script never writes a conflict marker. Decided by: @michaelwitwicki (the view), redline (the mechanics).
6. The flag table: `--force` governs fill-ins; `--merge` (with `--pick n=ours|theirs`) and `--keep` govern the version and exclude each other; `--force` alone on a version mismatch writes nothing. Decided by: redline (shaping).
7. Settings get no marker; missing and stale entries are derived against the template. Decided by: @michaelwitwicki.
8. One precheck command, `version <repoRoot>`, which the guard already approves; CI runs `version .`. Decided by: @michaelwitwicki.
9. No template bump in this spec: v3 with the marker, history v1 and v2. Decided by: @michaelwitwicki.
10. The issue's tests plus the frozen-copy check, the conflicting-line case, `--keep`, `--dry-run`, this checkout's section as the hand-edit fixture, and `version <repoRoot>`. Decided by: @michaelwitwicki.
11. This checkout is dogfooded in its own task (the marker through the script, the ten retired allow entries removed). Decided by: @michaelwitwicki.
12. Docs: README items 5 and 8, Upgrading, the Files table, the `redline-setup.sh` table, "Template version", Contributing; the setup skill's steps 1, 10, 13; the redline skill's precheck step 1. Decided by: @michaelwitwicki.
13. Standards carried: `scripts/bash-conventions`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `scripts/guard`. Decided by: redline (shaping).
14. **A same-length hunk is merged line by line** (from the build): the dry run over Chalkboard's section showed a diff3 adjacency conflict (its hand-edited story line beside the `why_human` line #49 changed); a hunk of one length on every side whose lines each changed on at most one side is merged line by line, and a line changed differently on both sides still conflicts. Decided by: redline (build), with the case red first.
15. **Standards retrospective: applied** (the proposed edits below, approved on 2026-11-02), in the person's own commit. Decided by: @michaelwitwicki.

## Context

What the survey established, read only, and the questions it raised:

- **The three live external sections are behind the template already.** Diffed against the template's three bodies (`dbb27ec`, `89d0e00`, `e7d030d`): Chalkboard matches the extraction body (4 differing lines, all fill-ins), Losers League and Vestmark the owner-line body (7 and 5), this checkout the current body (8: fill-ins plus three hand edits). So decision 6 of the prompt ("all read as v1 after their next rerun") would have stamped sections that lack #49's sentence as current; the person chose v1, v2, v3 from git history.
- **The guard approves `redline-setup.sh` for the main session only when the subcommand is `version`** (`scripts/redline-guard.sh:1083`); the allow list carries no script rule since #50. `unattended --version` and `settings --dry-run` in the precheck would prompt at every launch; the person chose a root form of `version`.
- **This checkout's contract is stale**: ten retired allow entries in `.claude/settings.json`, no marker in its section; the person chose to dogfood both here.
- **A prototype of the guess and the merge** over the four live files (python difflib, read only): base v1 / v2 / v2 / v3 (guessed), no conflicts, every hand edit kept, every template addition taken.
- **The design review** (a Plan agent over the decided design) added: every merge side takes the wanted fill-ins first, so a fill-in change on a hand-edited line is not a conflict; an insertion at the same slot from both sides is a conflict, not both; a hand deletion of a line the template changed is a conflict, never restored; the guess's known limit (hand deletions of exactly a version's additions); `--pick` as a joined string, never an empty array under `set -u` on bash 3.2; the history directory derived from the override must tolerate being absent.
- **Visuals:** none.
- **References:** `references.md`.
- **Product alignment:** roadmap Phase 1 item 7 ("a rerun changes nothing when nothing drifted"); mission ("each repository keeps its own contract").

## Standards Applied

- scripts/bash-conventions — the script's header as documentation, `--dry-run` on every writing subcommand, `changed: false` on a rerun, templates and generators, the `# redline-template:` version rule this spec extends to the section body
- testing/tests — a case per change, red before green, versions derived never spelled, dogfood cases over this checkout, tests write only under the temp directory
- process/docs-gate — the Docs entries table in `plan.md`
- process/standards-retrospective — the proposed edits below
- prompts/attribution — nothing written names a model or vendor
- scripts/guard — the guard-cases rows for the new command shapes; no guard change

## Standards retrospective (proposed)

- `agent-os/standards/scripts/bash-conventions.md`, after the `# redline-template:` bullet: a template whose body a repository copies (`templates/shape-spec-unattended.md`) carries a version marker in the body; a body change bumps it and freezes the previous file under `templates/history/` in the same commit, since an installed plugin has no git history to show, and a rerun merges three ways (the frozen base, the repository's copy, the current template), every side with the wanted fill-ins applied first, keeping hand edits and asking on a conflict; the marker is bumped alone only on `--keep`, so the launch keeps warning otherwise (#15). A second bullet: a read-only subcommand the launch precheck runs takes the repository root and answers every contract question in one call (`version <repoRoot>`), since the guard approves the main session by subcommand word and a flag on a writing subcommand would prompt (#15).
- `agent-os/standards/testing/tests.md`: the version-case bullet gains `UV`/`UN` from the template's marker and the frozen-copy case; the setup bullet gains the section's marker and `version <repoRoot>` on this checkout; the CI bullet reads `version .`.
- `agent-os/standards/process/docs-gate.md`: no change.
