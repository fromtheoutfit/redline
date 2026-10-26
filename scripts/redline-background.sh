#!/usr/bin/env bash
#
# redline-background.sh: runs the repository's .claude/redline/checks.sh in the background for a
# Redline role, and hands its result back in waits that fit the Bash tool. A gate longer than the
# tool's 600 s foreground cap cannot run in the foreground; a subagent's background task lives only
# while the agent keeps working; and a long foreground sleep is blocked. So the role runs `start`
# with run_in_background (the harness keeps it alive while the role waits, and stops it when the
# role ends), then runs `wait` until it exits other than 3. The workflow gives both commands,
# verbatim, when the recorded baseline is over 480 s or unknown (#40).
#
#   redline-background.sh start <label> [--baseline | --git-only] [<snapshot>]
#       Runs <toplevel>/.claude/redline/checks.sh, for the repository holding the current
#       directory, with the arguments after <label> and this environment (so REDLINE_OCTANE=1
#       reaches it). Only that script runs; start takes no command. Removes the label's earlier
#       files, writes <label>.started (epoch seconds) and <label>.pid, then keeps checks.sh's
#       stdout in <label>.json, its stderr in <label>.err and, last, its exit code in <label>.exit.
#       Prints {"label", "exit"} and exits with checks.sh's exit code.
#   redline-background.sh wait <label> [--limit <seconds>] [--slice <seconds>]
#       Waits for the run under <label> for at most --slice seconds (default 240: under the Bash
#       tool's 600 s cap and the 300 s floor setup gives the checker's stall window, so no one
#       call is long enough to trip either). When the run has finished, prints its stderr to
#       stderr and its stdout to stdout, as checks.sh printed them, and exits with checks.sh's
#       exit code. --limit bounds the whole run, counted from <label>.started: the workflow passes
#       the checker's stall window, which the repeated waits would otherwise keep from firing.
#
# Files live under ${TMPDIR:-/tmp}/redline-background/. A label is letters, digits, dots,
# underscores and hyphens, starting with a letter or digit; the workflow builds it from the launch
# stamp, the PR and the agent's label (2026-10-26-1304-790-baseline).
#
# Environment:
#   TMPDIR                    where the files live; start and wait must see the same one
#   REDLINE_BACKGROUND_POLL   seconds between wait's checks (default 1; the test sets 0.2)
#
# Exit codes of wait, which are an answer:
#   0, 1, 2  checks.sh's own: 0 the gate passed, 1 it failed, 2 a usage error (its reason on
#            stderr, no JSON). wait's own usage errors also exit 2, with a "redline-background:"
#            line on stderr.
#   3        still running after --slice seconds: run the same wait again
#   4        the run has gone on longer than --limit seconds
#   5        no result will come: the run ended without recording one (stopped or killed), or no
#            run under the label started
# start exits with checks.sh's exit code, or 2 for its own usage errors (a bad label, no git
# repository, no executable .claude/redline/checks.sh). Needs jq.

set -euo pipefail

usage() {
    echo "usage: redline-background.sh start <label> [--baseline | --git-only] [<snapshot>]" >&2
    echo "       redline-background.sh wait <label> [--limit <seconds>] [--slice <seconds>]" >&2
    exit 2
}

[[ $# -ge 2 ]] || usage
cmd="$1"
label="$2"
shift 2
[[ "$cmd" == "start" || "$cmd" == "wait" ]] || usage
if [[ ! "$label" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
    echo "redline-background: a label is letters, digits, dots, underscores and hyphens; got '$label'" >&2
    exit 2
fi
dir="${TMPDIR:-/tmp}"
dir="${dir%/}/redline-background"
base="$dir/$label"

if [[ "$cmd" == "start" ]]; then
    top="$(git rev-parse --show-toplevel 2>/dev/null)" || {
        echo "redline-background: $(pwd -P) is not inside a git repository" >&2
        exit 2
    }
    checks="$top/.claude/redline/checks.sh"
    [[ -x "$checks" ]] || {
        echo "redline-background: $checks is missing or not executable" >&2
        exit 2
    }
    mkdir -p "$dir"
    rm -f "$base.json" "$base.json.part" "$base.err" "$base.exit" "$base.exit.part" "$base.pid" "$base.started"
    date +%s > "$base.started"
    printf '%s\n' "$$" > "$base.pid"
    # checks.sh exits 1 for a failing gate; that is a result to keep, not a reason to stop here.
    set +e
    "$checks" "$@" > "$base.json.part" 2> "$base.err" < /dev/null
    code=$?
    set -e
    mv "$base.json.part" "$base.json"
    printf '%s\n' "$code" > "$base.exit.part"
    mv "$base.exit.part" "$base.exit"
    jq -cn --arg label "$label" --argjson exit "$code" '{label: $label, exit: $exit}'
    exit "$code"
fi

limit=""
slice=240
while [[ $# -gt 0 ]]; do
    case "$1" in
        --limit) limit="${2:-}"; shift 2 || usage ;;
        --slice) slice="${2:-}"; shift 2 || usage ;;
        *) echo "redline-background: unknown option $1" >&2; usage ;;
    esac
done
for value in "$slice" ${limit:+"$limit"}; do
    if [[ ! "$value" =~ ^[1-9][0-9]*$ ]]; then
        echo "redline-background: --limit and --slice take a positive number of seconds; got '$value'" >&2
        exit 2
    fi
done
poll="${REDLINE_BACKGROUND_POLL:-1}"

begin="$(date +%s)"
# A start launched a moment ago may not have written its pid yet.
grace=$(( slice < 10 ? slice : 10 ))
while :; do
    if [[ -f "$base.exit" ]]; then
        code="$(cat "$base.exit")"
        [[ -f "$base.err" ]] && cat "$base.err" >&2
        [[ -f "$base.json" ]] && cat "$base.json"
        exit "$code"
    fi
    now="$(date +%s)"
    elapsed=$(( now - begin ))
    if [[ -f "$base.started" ]]; then
        elapsed=$(( now - $(cat "$base.started") ))
    fi
    if [[ -f "$base.pid" ]]; then
        if ! kill -0 "$(cat "$base.pid")" 2>/dev/null; then
            # It may have finished between the two checks.
            [[ -f "$base.exit" ]] && continue
            echo "redline-background: the run under $label ended without a result (stopped or killed) after $elapsed s" >&2
            exit 5
        fi
        if [[ -n "$limit" ]] && (( elapsed > limit )); then
            echo "redline-background: the run under $label has gone on $elapsed s, past the limit of $limit s" >&2
            exit 4
        fi
    elif (( now - begin >= grace )); then
        echo "redline-background: no run under $label; start it first" >&2
        exit 5
    fi
    if (( now - begin >= slice )); then
        echo "redline-background: the run under $label is still running after $elapsed s; run the same wait again" >&2
        exit 3
    fi
    sleep "$poll"
done
