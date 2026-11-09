# References for PR #83 review round 2

## In this repository

### The bullet R2-2 corrects

- **Location:** `agent-os/standards/process/release.md`, line 12.
- **Relevance:** the clause round 1's `9dfa88b` inserted, and the "in both" it now sits in front of.
- **Key patterns:** `CONTRIBUTING.md:7`, the same kind of drift R1-1 fixed.

### The record R2-1 reads against

- **Location:** `agent-os/specs/2026-11-09-0858-76-inline-session-auto-mode-warning/shape.md` (Decisions 4, 5, 8 and 9 at lines 16, 17, 23 and 27; the open item at line 42) and its `plan.md` (lines 20, 65, 73, 88 and 91).
- **Relevance:** the walk, the kept version, the done rule, and what the path check already showed.

### What moves an install

- **Location:** `agent-os/standards/process/release.md`, line 9; `docs/upgrading.md`, line 7; `CONTRIBUTING.md`, "Releases" (line 29).
- **Relevance:** an install moves on the manifest's version, not on the tag.

### The installed copy on this machine (outside the repository, read only)

- **Location:** `~/.claude/plugins/installed_plugins.json`, lines 54 to 62; `~/.claude/plugins/cache/redline/redline/0.2.0/skills/redline/SKILL.md`.
- **Relevance:** 0.2.0 from `94f4616`, with no "Inline session" text.

### The warning's condition

- **Location:** `skills/redline/SKILL.md`, line 87.
- **Relevance:** the warning fires only when `${CLAUDE_PLUGIN_ROOT}` is outside `/plugins/cache/`, so a stale cached copy costs nobody the warning.

### The version as it stands

- **Location:** `.claude-plugin/plugin.json`, line 4; `.claude-plugin/marketplace.json`, line 11; `CHANGELOG.md`, line 5.
- **Relevance:** R2-1's bump option. `git tag --list` prints only `redline--v0.1.0`.

### Round 1, and how a standards correction reaches a standard

- **Location:** `agent-os/specs/2026-11-09-1423-83-review-round-1/shape.md` (Decision 5, Decision 7, retrospective item 5); `agent-os/specs/2026-11-07-0806-80-review-round-4/shape.md` (Decision 2, R4-2); `agent-os/specs/2026-11-03-0852-65-review-round-2/shape.md` (Unattended answer 4); `agent-os/standards/process/standards-retrospective.md`, line 7; `agents/redline-implementer.md`, line 19; `agents/redline-standards-approver.md`; `workflows/redline-loop.js`, line 1049.
- **Relevance:** what R1-6 decided, and the route R2-2 takes.

## Elsewhere

- Issue #76: https://github.com/fromtheoutfit/redline/issues/76
- PR #83: https://github.com/fromtheoutfit/redline/pull/83
