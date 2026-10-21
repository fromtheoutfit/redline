#!/usr/bin/env bash
#
# A repository's gate copied from the template and not yet stamped.
#
# Usage:
#   checks.sh <snapshot.json>              full run: commands + git block
#   checks.sh --baseline [snapshot.json]   commands only, git block is null
#
# Exit 0 when every check passed, else 1. Usage errors exit 2.
# redline-gate: TODO  stamp it: <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh

set -euo pipefail

mode="full"
for arg in "$@"; do
    case "$arg" in
        --baseline) mode="baseline" ;;
        -h|--help) sed -n '2,/^$/p' "$0" >&2; exit 2 ;;
    esac
done
echo '{"mode": "'"$mode"'", "ok": true, "checks": [], "git": null}'
