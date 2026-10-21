# Standards for #4: Install Agent OS and Redline's own contract

The following standards apply to this work. They were written as part of it (see `shape.md`, Standards retrospective), so this file names them rather than copying them: each is one file under `agent-os/standards/` and reads as it did when this spec was completed.

---

## scripts/guard

Default deny, literal allowlists in the table, every change proven by a row in `tests/guard-cases.tsv`, the self-hosted case: the plugin's source is repository content when the repository is the plugin, except the guard and the hook.

## scripts/bash-conventions

`set -euo pipefail`, one JSON object on stdout and progress on stderr, usage errors exit 2, the header comment is the documentation.

## testing/tests

Three harnesses; a change that touches a tested surface adds a case in the same commit, beside a row for the neighbouring decision that must not change.

## prompts/attribution

Redline labels its own work as Redline; no model or vendor name in anything that lands here or on GitHub.

## process/internal-notes

The public repository carries the tool and its README; the design record stays in `redline-internal`.

## process/standards-retrospective

Every spec ends with one; this spec's is the standards themselves.
