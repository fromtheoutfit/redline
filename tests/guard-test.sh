#!/usr/bin/env bash
#
# Regression table for redline-guard.sh. Reads guard-cases.tsv (agent_type, expected, tool,
# command-or-path; see the comment at its top), feeds each case to the guard as the hook input
# Claude Code would send, and prints a markdown table of decisions, marking mismatches. Exit 1
# when any case mismatches.
#
#   allow   exit 0 with a PreToolUse permissionDecision of "allow"
#   deny    exit 2 with a reason on stderr
#   inert   exit 0 with no output at all (not a Redline role)
#
#   tests/guard-test.sh [cases.tsv]
#
# The repository is the one holding the current directory, so run it from a repository that uses
# Redline. From the plugin's own checkout, or outside any repository, it uses an empty repository
# at ~/.cache/redline/guard-test-repo instead: the ordinary rows need a repository that is not
# the plugin (whose directory is protected for every role), and a temp directory is one of the
# roles' scratch areas, so neither can stand in for a repo.
#
# A directive line in the case file switches the hook's cwd for the rows after it: `# @cwd PLUGIN`
# sends them from the plugin's own checkout, where the guard finds the repository and the plugin
# at the same path (Redline reviewing itself), and `# @cwd REPO` (the default) sends them from
# the repository above. Under `# @cwd PLUGIN` a relative path resolves against the checkout.
# `# @cwd ASKRULES` sends them from a fixture repository the harness prepares on every run at
# ~/.cache/redline/guard-test-askrules (#49): a .claude/redline.json with ask rules, the files
# config/project/project.yaml and config/other.yaml, a symlink cfg -> config/project inside it and
# /tmp/redline-guard-askrules-link -> its config/project outside it, and a .claude/redline/checks.json
# declaring one gate variable (REDLINE_MIGRATE_DB) for the prefix rows, and two files whose names hold
# a bracket (app/pages/[id].php, .claude/settings[1].json) for the git add rows (#54); `ASK/` in a row
# is its path.
# `# @cwd ASKRULESBAD` sends them from ~/.cache/redline/guard-test-askrules-bad, whose askRules
# list is malformed (a rule with no reason).
#
# An optional fifth column is text the deny reason must contain; a row with one mismatches when
# the guard denies for another reason.

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GUARD="$PLUGIN/scripts/redline-guard.sh"
CASES="${1:-$PLUGIN/tests/guard-cases.tsv}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/redline"
REPO="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO" || "$(cd "$REPO" && pwd -P)" == "$(cd "$PLUGIN" && pwd -P)" ]]; then
    REPO="$CACHE/guard-test-repo"
    mkdir -p "$REPO" && git -C "$REPO" init -q
fi
REPO="$(cd "$REPO" && pwd)"

# The ask-rules fixture repositories (#49), rebuilt on every run so a row never depends on a
# leftover. The symlink under /tmp is the "outside the repository, resolving into a match" case.
ASK="$CACHE/guard-test-askrules"
ASKBAD="$CACHE/guard-test-askrules-bad"
rm -rf "$ASK" "$ASKBAD"
mkdir -p "$ASK/.claude/redline" "$ASK/config/project" "$ASK/agent-os/specs/x" "$ASKBAD/.claude"
git -C "$ASK" init -q && git -C "$ASKBAD" init -q
cat > "$ASK/.claude/redline.json" <<'JSON'
{
  "maxRounds": 3,
  "askRules": [
    {"id": "craft-config", "when": {"paths": ["config/project/**"]}, "reason": "Craft project config is applied through the control panel"},
    {"id": "yaml-anywhere", "when": {"paths": ["*.secret.yaml"]}, "reason": "A secret file is rotated by hand"},
    {"id": "billing", "when": {"prose": "the change alters what a customer is charged"}, "reason": "Billing changes are reviewed by finance"}
  ]
}
JSON
printf '{"vars": [{"name": "migrate_db", "env": "REDLINE_MIGRATE_DB", "default": "x", "doc": "scratch database"}]}\n' > "$ASK/.claude/redline/checks.json"
printf 'name: x\n' > "$ASK/config/project/project.yaml"
mkdir -p "$ASK/app/pages" && : > "$ASK/app/pages/[id].php" && : > "$ASK/.claude/settings[1].json"
printf 'name: y\n' > "$ASK/config/other.yaml"
ln -s config/project "$ASK/cfg"
ln -sfn "$ASK/config/project" /tmp/redline-guard-askrules-link
printf '{"askRules": [{"id": "no-reason", "when": {"paths": ["config/**"]}}]}\n' > "$ASKBAD/.claude/redline.json"

cd "$REPO"
err="$(mktemp)"
trap 'rm -f "$err"' EXIT
pass=0; fail=0
printf 'Repository: %s\nPlugin: %s\nAsk-rules fixture: %s\n\n' "$REPO" "$PLUGIN" "$ASK" >&2
printf '| Agent | Tool | Command | Expected | Got | Reason |\n|---|---|---|---|---|---|\n'
cwd="$REPO"
while IFS=$'\t' read -r agent expect tool cmd want; do
    case "$agent" in
        "# @cwd PLUGIN") cwd="$PLUGIN"; continue ;;
        "# @cwd REPO") cwd="$REPO"; continue ;;
        "# @cwd ASKRULES") cwd="$ASK"; continue ;;
        "# @cwd ASKRULESBAD") cwd="$ASKBAD"; continue ;;
    esac
    [[ -z "$agent" || "$agent" == \#* ]] && continue
    cmd="${cmd//PLUGIN\//$PLUGIN/}"
    cmd="${cmd//ASK\//$ASK/}"
    cmd="$(printf '%b' "${cmd//REPO\//$REPO/}")"
    json="$(jq -cn --arg cwd "$cwd" --arg agent "$agent" --arg t "$tool" --arg c "$cmd" '
        {tool_name: $t, cwd: $cwd}
        + (if $agent == "-" then {} else {agent_type: $agent} end)
        + (if $t == "Bash" then {tool_input: {command: $c}} else {tool_input: {file_path: $c}} end)')"
    out="$(printf '%s' "$json" | env -u REDLINE_GUARD_LOG CLAUDE_PLUGIN_ROOT="$PLUGIN" "$GUARD" 2>"$err")"
    code=$?
    if [[ $code -eq 2 ]]; then
        got=deny
    elif [[ $code -eq 0 && -z "$out" && ! -s "$err" ]]; then
        got=inert
    elif [[ $code -eq 0 ]] && jq -e '.hookSpecificOutput.permissionDecision == "allow"' <<<"$out" >/dev/null 2>&1; then
        got=allow
    else
        got="exit $code"
    fi
    if [[ "$got" == "$expect" && -n "$want" ]] && ! grep -qF -- "$want" "$err"; then
        got="$got (reason lacks '$want')"
    fi
    if [[ "$got" == "$expect" ]]; then pass=$((pass+1)); mark=""; else fail=$((fail+1)); mark=" **MISMATCH**"; fi
    shown="$(printf '%s' "$cmd" | tr '\n' ' ' | sed -e "s#$PLUGIN/#<plugin>/#g" -e "s#$REPO/#<repo>/#g" -e "s#$ASK/#<ask>/#g" -e 's/|/\\|/g' | cut -c1-90)"
    reason="$(sed -e 's/^redline-guard ([^)]*): //' -e 's/|/\\|/g' "$err" | tr '\n' ' ' | sed -e "s#$PLUGIN#<plugin>#g" | cut -c1-110)"
    printf '| %s | %s | `%s` | %s | %s%s | %s |\n' "$agent" "$tool" "$shown" "$expect" "$got" "$mark" "$reason"
done < "$CASES"
printf '\n%s passed, %s mismatched\n' "$pass" "$fail" >&2
[[ $fail -eq 0 ]]
