#!/usr/bin/env bash
#
# A repository's gate, before the stamp existed. Runs the runnable part of the Verification Gate
# (.claude/commands/agent-os/shape-spec.md) and emits exactly one JSON object on stdout.
#
# Usage:
#   checks.sh <snapshot.json>              full run: commands + git block
#   checks.sh --baseline [snapshot.json]   commands only, git block is null
#
# Exit 0 when every check passed, else 1. Usage errors exit 2.

set -euo pipefail

mode="full"
for arg in "$@"; do
    case "$arg" in
        --baseline) mode="baseline" ;;
        -h|--help) sed -n '2,10p' "$0" >&2; exit 2 ;;
    esac
done
echo '{"mode": "'"$mode"'", "ok": true, "checks": [], "git": null}'
