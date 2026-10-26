#!/usr/bin/env bash
#
# Unit test of scripts/redline-background.sh: start runs the repository's .claude/redline/checks.sh
# and keeps its result, wait hands it back exactly as checks.sh printed it, or says it is still
# running (3), past its limit (4) or never coming (5). Runs a stub checks.sh in a throwaway
# repository under the system temp directory, with its own TMPDIR for the script's files.
#
#   tests/background-test.sh
#
# The stub reads STUB_SLEEP (seconds) and STUB_EXIT (0, 1, 2, or 3 for a checks.sh that left its contract) from the environment start passes
# it, and prints one JSON object echoing its arguments and REDLINE_OCTANE. REDLINE_BACKGROUND_POLL
# is set to 0.2 so the waits finish fast; the slice, limit and grace cases take a few seconds each.

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BG="$PLUGIN/scripts/redline-background.sh"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/redline-background-test.XXXXXX")"
trap '{ kill $(jobs -p); wait; } 2>/dev/null; rm -rf "$WORK"' EXIT
REPO="$WORK/repo"
mkdir -p "$REPO/.claude/redline" "$REPO/sub" "$WORK/tmp" "$WORK/plain"
git -C "$REPO" init -q
cat > "$REPO/.claude/redline/checks.sh" <<'STUB'
#!/usr/bin/env bash
echo "checks.sh: running the stub gate" >&2
sleep "${STUB_SLEEP:-0}"
if [[ "${STUB_EXIT:-0}" == 2 ]]; then
    echo "checks.sh: a snapshot file is required unless --baseline is given" >&2
    exit 2
fi
jq -cn --arg args "$*" --arg octane "${REDLINE_OCTANE:-}" --argjson exit "${STUB_EXIT:-0}" \
    '{mode: "stub", ok: ($exit == 0), args: $args, octane: $octane, checks: [], git: null}'
exit "${STUB_EXIT:-0}"
STUB
chmod +x "$REPO/.claude/redline/checks.sh"
export TMPDIR="$WORK/tmp"
export REDLINE_BACKGROUND_POLL=0.2
FILES="$TMPDIR/redline-background"

pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }
# same <name> <got> <want>
same() { [[ "$2" == "$3" ]] && ok "$1" || bad "$1" "$2"; }
# has <name> <text> <needle>
has() { [[ "$2" == *"$3"* ]] && ok "$1" || bad "$1" "$2"; }

# bg <label> [args...]: start in the background from the repository root, as an agent's
# run_in_background call would; returns at once. The environment (STUB_*, REDLINE_OCTANE) passes.
bg() { (cd "$REPO" && exec "$BG" start "$@") >/dev/null 2>&1 & }
# within <seconds> <test expression...>: polls the test every 0.1 s, at most that long; 1 on timeout,
# so a missing script fails the case instead of hanging the table.
within() { local n=$(( $1 * 10 )); shift; while (( n-- > 0 )); do test "$@" && return 0; sleep 0.1; done; return 1; }
# waitfor <label> [opts...]: run wait from the repository, keeping stdout, stderr and the exit code.
waitfor() {
    out="$(cd "$REPO" && "$BG" wait "$@" 2>"$WORK/err")"; code=$?
    err="$(cat "$WORK/err")"
}

echo "# a finished run comes back as checks.sh printed it"
STUB_EXIT=0 bg pass0 --baseline snap.json
waitfor pass0
same "exit 0: stdout is the gate's JSON, verbatim" "$out" '{"mode":"stub","ok":true,"args":"--baseline snap.json","octane":"","checks":[],"git":null}'
same "exit 0: wait exits 0" "$code" "0"
has "exit 0: stderr carries the gate's progress lines" "$err" "checks.sh: running the stub gate"
same "a returned result is read once: the label's files are gone" "$(ls "$FILES" | grep -c '^pass0\.')" "0"
waitfor pass0 --slice 2
same "a wait on a label whose result was read exits 5" "$code" "5"

STUB_EXIT=1 bg fail1 snap.json
waitfor fail1
same "exit 1: wait exits 1" "$code" "1"
same "exit 1: the JSON says so" "$(jq -r '.ok' <<<"$out")" "false"

STUB_EXIT=2 bg usage2 snap.json
waitfor usage2
same "exit 2: wait exits 2" "$code" "2"
same "exit 2: stdout is empty" "$out" ""
has "exit 2: the usage reason is on stderr" "$err" "a snapshot file is required"

STUB_EXIT=3 bg exit3 snap.json
waitfor exit3
same "exit 3 from checks.sh: wait exits 5, not still running" "$code" "5"
has "exit 3 from checks.sh: says checks.sh gave no gate result" "$err" "checks.sh exited 3 without a gate result"

echo "# start"
REDLINE_OCTANE=1 bg octane --git-only snap.json
waitfor octane
same "REDLINE_OCTANE reaches checks.sh" "$(jq -r '.octane' <<<"$out")" "1"
same "the arguments after the label reach checks.sh" "$(jq -r '.args' <<<"$out")" "--git-only snap.json"

got="$(cd "$REPO/sub" && STUB_EXIT=1 "$BG" start fromsub --baseline 2>/dev/null)"; code=$?
same "start from a subdirectory runs the repository's checks.sh, exiting with its code" "$code" "1"
same "start prints its label and the gate's exit code" "$got" '{"label":"fromsub","exit":1}'
same "start keeps the exit code" "$(cat "$FILES/fromsub.exit")" "1"

(cd "$WORK/plain" && "$BG" start nogit) >/dev/null 2>&1; code=$?
same "start outside a git repository exits 2" "$code" "2"
mkdir -p "$WORK/other" && git -C "$WORK/other" init -q
(cd "$WORK/other" && "$BG" start nochecks) >/dev/null 2>"$WORK/err"; code=$?
same "start in a repository without checks.sh exits 2" "$code" "2"
has "start names the missing checks.sh" "$(cat "$WORK/err")" ".claude/redline/checks.sh"

echo "# a run still going, past its limit, or gone"
STUB_SLEEP=3 bg slow
waitfor slow --slice 1
same "--slice: still running exits 3" "$code" "3"
has "--slice: says to run the same wait again" "$err" "run the same wait again"
same "--slice: prints nothing on stdout" "$out" ""
waitfor slow
same "a second wait returns the result" "$code" "0"
same "a second wait prints the JSON" "$(jq -r '.mode' <<<"$out")" "stub"

STUB_SLEEP=6 bg long
waitfor long --limit 1 --slice 5
same "--limit: past the limit exits 4" "$code" "4"
has "--limit: names the limit" "$err" "past the limit of 1 s"

# The runner gets its own process group, so the test can stop it and the stub under it.
set -m
(cd "$REPO" && STUB_SLEEP=30 exec "$BG" start killed) >/dev/null 2>&1 &
runner=$!
set +m
within 5 -f "$FILES/killed.pid" || bad "the runner writes its pid file" "no $FILES/killed.pid after 5 s"
{ kill -TERM -- "-$runner"; wait "$runner"; } 2>/dev/null
waitfor killed --slice 5
same "a run that ended without a result exits 5" "$code" "5"
has "a run that ended without a result says so" "$err" "ended without a result"

waitfor neverstarted --slice 2
same "a label never started exits 5" "$code" "5"
has "a label never started says to start it" "$err" "no run under neverstarted"

echo "# a rerun under the same label"
STUB_EXIT=0 bg again
waitfor again
same "first run under the label passes" "$code" "0"
STUB_SLEEP=2 STUB_EXIT=1 bg again
waitfor again
same "a rerun's wait returns the new result, not the earlier one" "$code" "1"
same "a rerun's wait prints the new run's JSON" "$(jq -r '.ok' <<<"$out")" "false"

echo "# usage"
(cd "$REPO" && "$BG" start ../escape) >/dev/null 2>&1; code=$?
same "start: a label with a slash exits 2" "$code" "2"
waitfor "has space"
same "wait: a label with a space exits 2" "$code" "2"
waitfor pass0 --slice zero
same "wait: a slice that is not a positive integer exits 2" "$code" "2"
(cd "$REPO" && "$BG") >/dev/null 2>&1; code=$?
same "no subcommand exits 2" "$code" "2"
(cd "$REPO" && "$BG" run pass0) >/dev/null 2>&1; code=$?
same "an unknown subcommand exits 2" "$code" "2"

echo
echo "$pass passed, $fail failed"
[[ $fail -eq 0 ]]
