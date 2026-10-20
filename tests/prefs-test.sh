#!/usr/bin/env bash
#
# Unit test of scripts/redline-prefs.sh: the merge rules for the saved launch preferences
# (.claude/redline.local.json). Runs in a throwaway repository under the system temp directory.
#
#   tests/prefs-test.sh

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFS="$PLUGIN/scripts/redline-prefs.sh"
REPO="$(mktemp -d "${TMPDIR:-/tmp}/redline-prefs-test.XXXXXX")"
trap 'rm -rf "$REPO"' EXIT
mkdir -p "$REPO/.claude"
pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }
# expect <name> <jq filter> <expected> <resolve args...>
expect() {
    local name="$1" filter="$2" want="$3"; shift 3
    local got
    got="$("$PREFS" resolve "$REPO" "$@" | jq -r "$filter")"
    [[ "$got" == "$want" ]] && ok "$name" || bad "$name" "$got"
}
# saved <name> <jq filter> <expected>: inspects the file after a save
saved() {
    local got
    got="$(jq -r "$2" "$REPO/.claude/redline.local.json")"
    [[ "$got" == "$3" ]] && ok "$1" || bad "$1" "$got"
}

echo "# no saved file"
expect "no file: ask every field" '.ask | join(",")' "interrupt,revise,maxRounds,scope"
expect "no file: no confirm" '.confirm' "false"
expect "no file: defaults" '[.effective.interrupt, .effective.revise, (.effective.maxRounds|tostring), .effective.scope] | join(" ")' "guided claude-opus-5-5 3 all"
expect "no file: every source is default" '[.sources[]] | unique | join(",")' "default"
expect "no file: command line fields are not asked" '.ask | join(",")' "revise,scope" --interrupt plan --max-rounds 2
expect "no file: command line words win" '[.effective.interrupt, (.effective.maxRounds|tostring)] | join(" ")' "plan 2" --interrupt plan --max-rounds 2
expect "no file: revise fable maps to the model id" '.effective.revise' "claude-fable-5-1" --revise fable
expect "no file: revise opus maps to the model id" '.effective.revise' "claude-opus-5-5" --revise opus
expect "no file: review only asks only scope" '.ask | join(",")' "scope" --interrupt "review only"
expect "no file: review-only spelling is normalised" '.effective.interrupt' "review only" --interrupt review-only
expect "no file: applies under review only" '.applies | join(",")' "interrupt,scope" --interrupt "review only"
expect "no file: summary marks command line words" '.summary' "Run with: autopilot (command line) · Opus 5.5 · 3 rounds · correctness (command line)" --interrupt AUTOPILOT --scope correctness
expect "no file: 1 round reads singular" '.summary' "Run with: guided · Opus 5.5 · 1 round (command line) · all" --max-rounds 1
expect "no file: savedFile path" '.savedFile' "$REPO/.claude/redline.local.json"

echo "# redline.json supplies the round default"
printf '{"maxRounds": 5}\n' > "$REPO/.claude/redline.json"
expect "redline.json: maxRounds default" '.effective.maxRounds' "5"
expect "redline.json: command line still wins" '.effective.maxRounds' "2" --max-rounds 2
rm "$REPO/.claude/redline.json"

echo "# bad arguments"
"$PREFS" resolve "$REPO" --interrupt yolo >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad interrupt exits 2" || bad "bad interrupt exits 2" "$?"
"$PREFS" resolve "$REPO" --scope nits >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad scope exits 2" || bad "bad scope exits 2" "$?"
"$PREFS" resolve "$REPO" --max-rounds 0 >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "zero rounds exits 2" || bad "zero rounds exits 2" "$?"
"$PREFS" save "$REPO" --interrupt guided >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "save without every field exits 2" || bad "save without every field exits 2" "$?"
[[ ! -f "$REPO/.claude/redline.local.json" ]] && ok "a refused save writes nothing" || bad "a refused save writes nothing" "file exists"

echo "# save, then confirm"
"$PREFS" save "$REPO" --interrupt plan --revise fable --max-rounds 2 --scope all >/dev/null
saved "save: interrupt" '.interrupt' "plan"
saved "save: revise as the model id" '.revise' "claude-fable-5-1"
saved "save: maxRounds as a number" '.maxRounds' "2"
saved "save: scope" '.scope' "all"
expect "saved file: confirm, nothing asked" '[.confirm, (.ask|length|tostring)] | join(" ")' "true 0"
expect "saved file: summary from the file" '.summary' "Run with: plan · Fable 5.1 · 2 rounds · all"
expect "saved file: sources are saved" '[.sources[]] | unique | join(",")' "saved"
expect "saved file: command line overrides and is marked" '.summary' "Run with: review (command line) · Fable 5.1 · 2 rounds · correctness (command line)" --interrupt review --scope correctness
expect "saved file: override sources" '[.sources.interrupt, .sources.revise] | join(",")' "command line,saved" --interrupt review
expect "saved file: still a confirm with overrides" '.confirm' "true" --interrupt review
expect "saved file: saved is echoed" '.saved.interrupt' "plan"

echo "# per-run verbs are never saved"
"$PREFS" save "$REPO" --interrupt autopilot --revise opus --max-rounds 4 --scope correctness >/dev/null
saved "autopilot: previous interrupt stays" '.interrupt' "plan"
saved "autopilot: the other fields are saved" '[.revise, (.maxRounds|tostring), .scope] | join(" ")' "claude-opus-5-5 4 correctness"
"$PREFS" save "$REPO" --interrupt "review only" --revise opus --max-rounds 4 --scope all >/dev/null
saved "review only: previous interrupt stays" '.interrupt' "plan"
saved "review only: scope saved" '.scope' "all"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all >/dev/null
saved "guided: saved" '.interrupt' "guided"
"$PREFS" save "$REPO" --interrupt review --revise opus --max-rounds 3 --scope all >/dev/null
saved "review: saved" '.interrupt' "review"

echo "# a first save of a per-run verb leaves interrupt unset"
rm "$REPO/.claude/redline.local.json"
"$PREFS" save "$REPO" --interrupt "review only" --revise opus --max-rounds 3 --scope all >/dev/null
saved "first review only: no interrupt key" 'has("interrupt")' "false"
expect "first review only: next resolve falls back to guided, from the default" '[.effective.interrupt, .sources.interrupt] | join(" ")' "guided default"
expect "first review only: next resolve is a confirm" '.confirm' "true"
expect "first review only: summary" '.summary' "Run with: review only (command line) · Opus 5.5 · 3 rounds · all" --interrupt "review only"

echo "# a damaged file"
printf '{"interrupt": "yolo", "maxRounds": "two", "scope": "correctness"}\n' > "$REPO/.claude/redline.local.json"
expect "damaged: bad values fall back to defaults, good ones hold" '[.effective.interrupt, (.effective.maxRounds|tostring), .effective.scope] | join(" ")' "guided 3 correctness"
printf 'not json\n' > "$REPO/.claude/redline.local.json"
"$PREFS" resolve "$REPO" >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "not JSON exits 2" || bad "not JSON exits 2" "$?"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
