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


echo "# the run marker (#10)"
printf '{"interrupt": "plan", "revise": "claude-opus-5-5", "maxRounds": 3, "scope": "all", "runs": {"7": {"kind": "error"}}}\n' > "$REPO/.claude/redline.local.json"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all >/dev/null
saved "save keeps the runs key" '.runs."7".kind' "error"
saved "save still writes its own fields" '.interrupt' "guided"

# A git repository in the throwaway directory: a base commit, then the run's last commit (the
# marker's head), on branch work. The records live outside it, so they never show as untracked.
REC="$(mktemp -d "${TMPDIR:-/tmp}/redline-prefs-records.XXXXXX")"
trap 'rm -rf "$REPO" "$REC"' EXIT
G=(git -C "$REPO" -c user.name=t -c user.email=t@t -c commit.gpgsign=false)
"${G[@]}" init -q
"${G[@]}" symbolic-ref HEAD refs/heads/work
printf '.claude/redline.local.json\n.claude/.redline.local.*\n' > "$REPO/.gitignore"
mkdir -p "$REPO/app" "$REPO/.claude/redline"
printf '{}\n' > "$REPO/.claude/redline/checks.json"
printf 'x\n' > "$REPO/app/x.php"
"${G[@]}" add .gitignore app .claude/redline >/dev/null
"${G[@]}" commit -q -m base
printf 'y\n' > "$REPO/app/x.php"
"${G[@]}" commit -q -am "redline: R1-1 fix"
RUNHEAD="$("${G[@]}" rev-parse HEAD)"
FOLDER="agent-os/specs/2026-11-01-0900-7-review-round-1"
printf '%s\n' '{"runId":"wf_1","args":{"pr":7,"headRef":"work","files":["app/x.php"]},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["'"$FOLDER"'"],"snapshotStart":"'"$REPO/$FOLDER"'/redline/snapshot-start.json"}}' > "$REC/error.json"
printf '%s\n' '{"runId":"wf_2","args":{"pr":7},"result":{"status":"error","stage":"gather","error":"head moved","resumeFrom":null,"specFolders":["'"$FOLDER"'"]}}' > "$REC/gather.json"
printf '%s\n' '{"runId":"wf_3","args":{"pr":7},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/handoff.json"
printf '%s\n' '{"runId":"wf_4","args":{"pr":7},"result":{"status":"reviewed","reviewedRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/reviewed.json"
printf '%s\n' '{"runId":"wf_5","args":{"pr":7}}' > "$REC/stopped.json"
printf '%s\n' '{"runId":"wf_6","args":{"pr":7},"result":{"status":"done"}}' > "$REC/done.json"
# A repository whose own path holds /redline/ (this plugin's checkout does): the start snapshot's
# folder is read off args.repoRoot and the snapshot's fixed tail, never by splitting on /redline/.
printf '%s\n' '{"runId":"wf_7","args":{"pr":7,"repoRoot":"/tmp/redline/app"},"result":{"status":"handoff","handoffRound":2,"specFolders":["agent-os/specs/2026-11-01-0900-7-review-round-2"],"snapshotStart":"/tmp/redline/app/agent-os/specs/2026-11-01-0900-7-review-round-1/redline/snapshot-start.json"}}' > "$REC/nested.json"
SESSION=s1
# run <args...>: the run subcommand under the test's session id
run() { CLAUDE_CODE_SESSION_ID="$SESSION" "$PREFS" run "$@"; }
# runj <name> <jq filter> <expected> <args...>: a field of the printed JSON
runj() {
    local name="$1" filter="$2" want="$3"; shift 3
    local got
    got="$(run "$@" 2>/dev/null | jq -r "$filter")"
    [[ "$got" == "$want" ]] && ok "$name" || bad "$name" "$got"
}
# runx <name> <exit> <args...>: the exit code
runx() {
    local name="$1" want="$2"; shift 2
    run "$@" >/dev/null 2>&1; local got=$?
    [[ $got -eq $want ]] && ok "$name" || bad "$name" "exit $got"
}
# runerr <name> <text> <args...>: the stderr line holds the text
runerr() {
    local name="$1" want="$2"; shift 2
    local got
    got="$(run "$@" 2>&1 >/dev/null)"
    [[ "$got" == *"$want"* ]] && ok "$name" || bad "$name" "$got"
}

echo "# run save"
runj "save: prints the entry" '.kind' "error" save "$REPO" 7 --run-id wf_1 --record "$REC/error.json"
saved "save: kind" '.runs."7".kind' "error"
saved "save: stage, label, attempt" '[.runs."7".stage, .runs."7".label, (.runs."7".attempt|tostring)] | join(" ")' "check recheck r1 2"
saved "save: error text" '.runs."7".error' "checks.sh still fails"
saved "save: session from the environment" '.runs."7".session' "s1"
saved "save: run id and record" '[.runs."7".runId, .runs."7".record] | join(" ")' "wf_1 $REC/error.json"
saved "save: head and branch" '[.runs."7".head, .runs."7".branch] | join(" ")' "$RUNHEAD work"
saved "save: args as launched" '[(.runs."7".args.pr|tostring), .runs."7".args.headRef, .runs."7".args.files[0]] | join(" ")' "7 work app/x.php"
saved "save: spec folders, the start snapshot's folder once" '.runs."7".specFolders | join(",")' "$FOLDER"
saved "save: the prefs keys are untouched" '[.interrupt, .revise, (.maxRounds|tostring), .scope] | join(" ")' "guided claude-opus-5-5 3 all"
runj "save: --session wins over the environment" '.session' "s9" save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" --session s9
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
runx "save: a gather error cannot be resumed, exit 1" 1 save "$REPO" 7 --run-id wf_2 --record "$REC/gather.json"
runerr "save: the line says so and names the folder" "cannot be resumed; start fresh after committing or removing $FOLDER" save "$REPO" 7 --run-id wf_2 --record "$REC/gather.json"
saved "save: a refused save leaves the entry" '.runs."7".runId' "wf_1"
runj "save: a hand-off marker" '[.kind, .handoffKind, (.round|tostring), .label] | join(" ")' "handoff decisions 1 " save "$REPO" 7 --run-id wf_3 --record "$REC/handoff.json"
runj "save: a reviewed marker" '[.kind, (.round|tostring)] | join(" ")' "reviewed 1" save "$REPO" 7 --run-id wf_4 --record "$REC/reviewed.json"
runj "save: the start snapshot's folder under a path holding /redline/" '.specFolders | join(",")' "agent-os/specs/2026-11-01-0900-7-review-round-1,agent-os/specs/2026-11-01-0900-7-review-round-2" save "$REPO" 7 --run-id wf_7 --record "$REC/nested.json"
runj "save: no result is a stopped run" '[.kind, .stage, .specFolders | tostring] | join(" ")' "stopped  []" save "$REPO" 7 --run-id wf_5 --record "$REC/stopped.json"
runx "save: a done record leaves no marker, exit 2" 2 save "$REPO" 7 --run-id wf_6 --record "$REC/done.json"
runx "save: without --run-id exits 2" 2 save "$REPO" 7 --record "$REC/error.json"
env -u CLAUDE_CODE_SESSION_ID "$PREFS" run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "save: no session anywhere exits 2" || bad "save: no session anywhere exits 2" "$?"
runx "save: a missing record exits 2" 2 save "$REPO" 7 --run-id wf_9 --record "$REC/none.json"
runx "run: a bad pr exits 2" 2 read "$REPO" x
runx "run: a bad subcommand exits 2" 2 frob "$REPO" 7
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1

echo "# run read"
runj "read: the entry" '.runId' "wf_1" read "$REPO" 7
runj "read: another pr is null" '.' "null" read "$REPO" 8
runx "read: exit 0 either way" 0 read "$REPO" 8

echo "# run check"
runj "check: same session, same head, clean tree" '[(.ok|tostring), .reason, .line] | join("|")' "true||" check "$REPO" 7
runx "check: ok exits 0" 0 check "$REPO" 7
runj "check: carries the marker and the head" '[.marker.runId, .head] | join(" ")' "wf_1 $RUNHEAD" check "$REPO" 7
runj "check: no marker" '[(.ok|tostring), .reason, .line] | join("|")' "false|none|no stopped run is recorded for #8" check "$REPO" 8
runx "check: refused exits 1" 1 check "$REPO" 8
SESSION=s2
runj "check: another session is refused" '[(.ok|tostring), .reason] | join("|")' "false|session" check "$REPO" 7
runj "check: the line gives the resume command" '.line' "the run on #7 was launched from session s1; reopen it with: claude --resume s1, then type /redline:redline 7 again" check "$REPO" 7
SESSION=s1
"${G[@]}" checkout -q -b other
runj "check: another branch is refused" '[.reason, .line] | join("|")' "branch|check out work" check "$REPO" 7
"${G[@]}" checkout -q work
"${G[@]}" branch -q -D other
mkdir -p "$REPO/$FOLDER/redline"
printf '{}\n' > "$REPO/$FOLDER/redline/round-1-reply-R1-1.md"
runj "check: untracked under the run's folder is fine" '[(.ok|tostring), (.untracked|join(","))] | join("|")' "true|$FOLDER/redline/round-1-reply-R1-1.md" check "$REPO" 7
printf 'stray\n' > "$REPO/stray.txt"
runj "check: untracked outside it is refused" '[.reason, .line] | join("|")' "untracked|commit or remove stray.txt, or start fresh" check "$REPO" 7
rm "$REPO/stray.txt"
printf 'z\n' >> "$REPO/app/x.php"
runj "check: a modified tracked file outside it is refused" '[.reason, .line] | join("|")' "untracked|commit or remove app/x.php, or start fresh" check "$REPO" 7
"${G[@]}" checkout -q -- app/x.php
printf '{"baseline": null}\n' > "$REPO/.claude/redline/checks.json"
"${G[@]}" commit -q -am "Fix the gate config"
HAND="$("${G[@]}" rev-parse HEAD)"
runj "check: a hand commit under .claude/ is allowed" '[(.ok|tostring), .reason, (.hand.commits|join(",")), (.hand.paths|join(","))] | join("|")' "true||$HAND|.claude/redline/checks.json" check "$REPO" 7
runj "check: the plugin's own checkout refuses a moved head" '[.reason, .line] | join("|")' "plugin|the repository is the plugin and HEAD moved since the run stopped (1 commit); a plugin fix changes what runs, so start fresh: the next round carries the findings forward" check "$REPO" 7 --plugin "$REPO"
runj "check: another plugin root is not the plugin case" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$REC"
printf 'w\n' > "$REPO/app/y.php"
"${G[@]}" add app/y.php
"${G[@]}" commit -q -m "Hand fix"
runj "check: a hand commit outside .claude/ is refused" '[.reason, .line] | join("|")' "head-moved|2 commits since the run stopped touch app/y.php outside .claude/; start fresh after committing or removing $FOLDER" check "$REPO" 7
"${G[@]}" reset -q --hard "$RUNHEAD~1"
BELOW="$("${G[@]}" rev-parse HEAD)"
runj "check: a head below the run's commit is refused" '[.reason, .line] | join("|")' "head-moved|HEAD ${BELOW:0:7} is not on top of the run's last commit ${RUNHEAD:0:7}; start fresh after committing or removing $FOLDER" check "$REPO" 7
"${G[@]}" reset -q --hard "$RUNHEAD"
rm -rf "$REPO/agent-os"

echo "# run clear"
runj "clear: removes the entry" '.cleared' "true" clear "$REPO" 7
runj "clear: read is null after it" '.' "null" read "$REPO" 7
runj "clear: a second clear reports false" '.cleared' "false" clear "$REPO" 7
saved "clear: the prefs keys survive" '[.interrupt, .revise, (.maxRounds|tostring), .scope] | join(" ")' "guided claude-opus-5-5 3 all"
saved "clear: an empty runs map is dropped" 'has("runs")' "false"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
