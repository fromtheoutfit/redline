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
expect "no file: ask every field" '.ask | join(",")' "interrupt,revise,maxRounds,scope,deferAt,deferTo"
expect "no file: no confirm" '.confirm' "false"
expect "no file: defaults" '[.effective.interrupt, .effective.revise, (.effective.maxRounds|tostring), .effective.scope] | join(" ")' "guided claude-opus-5-5 3 all"
expect "no file: every source is default" '[.sources[]] | unique | join(",")' "default"
expect "no file: deferred items are raised each round and drafts go to GitHub" '[.effective.deferAt, .effective.deferTo] | join(" ")' "round github"
expect "no file: no repository default for the drafts" '.repository.deferTo | tostring' "null"
expect "no file: command line fields are not asked" '.ask | join(",")' "revise,scope,deferAt,deferTo" --interrupt plan --max-rounds 2
expect "no file: command line words win" '[.effective.interrupt, (.effective.maxRounds|tostring)] | join(" ")' "plan 2" --interrupt plan --max-rounds 2
expect "no file: revise fable maps to the model id" '.effective.revise' "claude-fable-5-1" --revise fable
expect "no file: revise opus maps to the model id" '.effective.revise' "claude-opus-5-5" --revise opus
expect "no file: review only asks only scope" '.ask | join(",")' "scope" --interrupt "review only"
expect "no file: review-only spelling is normalised" '.effective.interrupt' "review only" --interrupt review-only
expect "no file: applies under review only" '.applies | join(",")' "interrupt,scope" --interrupt "review only"
expect "no file: summary marks command line words" '.summary' "Run with: autopilot (command line) · Opus 5.5 · 3 rounds · correctness (command line)" --interrupt AUTOPILOT --scope correctness
expect "no file: 1 round reads singular" '.summary' "Run with: guided · Opus 5.5 · 1 round (command line) · all" --max-rounds 1
expect "no file: savedFile path" '.savedFile' "$REPO/.claude/redline.local.json"

echo "# the two deferral settings (#95)"
expect "no file: every field applies to a guided run" '.applies | join(",")' "interrupt,revise,maxRounds,scope,deferAt,deferTo"
expect "no file: autopilot asks where the drafts go, never when" '.ask | join(",")' "revise,maxRounds,scope,deferTo" --interrupt autopilot
expect "no file: applies under autopilot" '.applies | join(",")' "interrupt,revise,maxRounds,scope,deferTo" --interrupt autopilot
expect "no file: review only asks for neither" '[.ask[] | select(startswith("defer"))] | length' "0" --interrupt "review only"
expect "no file: typed deferral words are not asked" '.ask | join(",")' "interrupt,revise,maxRounds,scope" --defer-at end --defer-to spec
expect "no file: typed deferral words win" '[.effective.deferAt, .effective.deferTo, .sources.deferAt, .sources.deferTo] | join(",")' "end,spec,command line,command line" --defer-at end --defer-to spec
expect "no file: the deferral words are normalised" '[.effective.deferAt, .effective.deferTo] | join(" ")' "end github" --defer-at END --defer-to GitHub
expect "no file: the summary names a typed deferral word, and no asked one" '.summary' "Run with: guided · Opus 5.5 · 3 rounds · all · drafts printed (command line)" --defer-to print
expect "no file: the summary's words for the end and the spec folder" '.summary' "Run with: guided · Opus 5.5 · 3 rounds · all · deferred at the end (command line) · drafts to the spec folder (command line)" --defer-at end --defer-to spec
expect "no file: under review only a typed deferral word is left out of the summary" '.summary' "Run with: review only (command line) · Opus 5.5 · 3 rounds · all" --interrupt "review only" --defer-at end --defer-to spec
expect "no file: under autopilot a typed when is left out of the summary" '.summary' "Run with: autopilot (command line) · Opus 5.5 · 3 rounds · all · drafts to GitHub (command line)" --interrupt autopilot --defer-at end --defer-to github

echo "# redline.json supplies the round default"
printf '{"maxRounds": 5}\n' > "$REPO/.claude/redline.json"
expect "redline.json: maxRounds default" '.effective.maxRounds' "5"
expect "redline.json: command line still wins" '.effective.maxRounds' "2" --max-rounds 2
expect "redline.json without deferTo: drafts go to GitHub" '[.effective.deferTo, (.repository.deferTo | tostring)] | join(" ")' "github null"
printf '{"maxRounds": 5, "deferTo": "spec"}\n' > "$REPO/.claude/redline.json"
expect "redline.json: deferTo is the default, and is named as the repository's" '[.effective.deferTo, .defaults.deferTo, .repository.deferTo, .sources.deferTo] | join(" ")' "spec spec spec default"
expect "redline.json: deferTo is still asked on a first launch" '.ask | join(",")' "interrupt,revise,maxRounds,scope,deferAt,deferTo"
expect "redline.json: a typed word wins over deferTo" '[.effective.deferTo, .repository.deferTo] | join(" ")' "print spec" --defer-to print
expect "redline.json: it holds no default for when" '.effective.deferAt' "round"
printf '{"maxRounds": 5, "deferTo": "folder"}\n' > "$REPO/.claude/redline.json"
"$PREFS" resolve "$REPO" >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "redline.json: a deferTo that is no destination exits 2" || bad "redline.json: a deferTo that is no destination exits 2" "$?"
got="$("$PREFS" resolve "$REPO" 2>&1 >/dev/null)"
[[ "$got" == *"deferTo in $REPO/.claude/redline.json must be github, spec or print; got \"folder\""* ]] && ok "redline.json: the line names the key, the file and the word" || bad "redline.json: the line names the key, the file and the word" "$got"
printf '{"maxRounds": 5, "deferTo": null}\n' > "$REPO/.claude/redline.json"
"$PREFS" resolve "$REPO" >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "redline.json: a null deferTo exits 2 (leave the key out for no default)" || bad "redline.json: a null deferTo exits 2" "$?"
rm "$REPO/.claude/redline.json"

echo "# bad arguments"
"$PREFS" resolve "$REPO" --interrupt yolo >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad interrupt exits 2" || bad "bad interrupt exits 2" "$?"
"$PREFS" resolve "$REPO" --scope nits >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad scope exits 2" || bad "bad scope exits 2" "$?"
"$PREFS" resolve "$REPO" --max-rounds 0 >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "zero rounds exits 2" || bad "zero rounds exits 2" "$?"
"$PREFS" resolve "$REPO" --defer-at sometimes >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad defer-at exits 2" || bad "bad defer-at exits 2" "$?"
"$PREFS" resolve "$REPO" --defer-to jira >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "bad defer-to exits 2" || bad "bad defer-to exits 2" "$?"
"$PREFS" save "$REPO" --interrupt guided >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "save without every field exits 2" || bad "save without every field exits 2" "$?"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "save without the two deferral fields exits 2" || bad "save without the two deferral fields exits 2" "$?"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all --defer-at round --defer-to jira >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "save with a bad defer-to exits 2" || bad "save with a bad defer-to exits 2" "$?"
[[ ! -f "$REPO/.claude/redline.local.json" ]] && ok "a refused save writes nothing" || bad "a refused save writes nothing" "file exists"

echo "# save, then confirm"
"$PREFS" save "$REPO" --interrupt plan --revise fable --max-rounds 2 --scope all --defer-at end --defer-to spec >/dev/null
saved "save: interrupt" '.interrupt' "plan"
saved "save: the two deferral settings" '[.deferAt, .deferTo] | join(" ")' "end spec"
saved "save: revise as the model id" '.revise' "claude-fable-5-1"
saved "save: maxRounds as a number" '.maxRounds' "2"
saved "save: scope" '.scope' "all"
expect "saved file: confirm, nothing asked" '[.confirm, (.ask|length|tostring)] | join(" ")' "true 0"
expect "saved file: summary from the file, six values" '.summary' "Run with: plan · Fable 5.1 · 2 rounds · all · deferred at the end · drafts to the spec folder"
expect "saved file: sources are saved" '[.sources[]] | unique | join(",")' "saved"
expect "saved file: command line overrides and is marked" '.summary' "Run with: review (command line) · Fable 5.1 · 2 rounds · correctness (command line) · deferred at the end · drafts to GitHub (command line)" --interrupt review --scope correctness --defer-to github
expect "saved file: the saved deferral settings are the effective ones" '[.effective.deferAt, .effective.deferTo, .sources.deferAt, .sources.deferTo] | join(",")' "end,spec,saved,saved"
expect "saved file: autopilot leaves when out of the confirm line" '.summary' "Run with: autopilot (command line) · Fable 5.1 · 2 rounds · all · drafts to the spec folder" --interrupt autopilot
expect "saved file: review only leaves both out of the confirm line" '.summary' "Run with: review only (command line) · Fable 5.1 · 2 rounds · all" --interrupt "review only"
expect "saved file: override sources" '[.sources.interrupt, .sources.revise] | join(",")' "command line,saved" --interrupt review
expect "saved file: still a confirm with overrides" '.confirm' "true" --interrupt review
expect "saved file: saved is echoed" '.saved.interrupt' "plan"

echo "# per-run verbs are never saved"
"$PREFS" save "$REPO" --interrupt autopilot --revise opus --max-rounds 4 --scope correctness --defer-at round --defer-to print >/dev/null
saved "autopilot: previous interrupt stays" '.interrupt' "plan"
saved "autopilot: when does not apply, so its saved value stays; where is saved" '[.deferAt, .deferTo] | join(" ")' "end print"
saved "autopilot: the other fields are saved" '[.revise, (.maxRounds|tostring), .scope] | join(" ")' "claude-opus-5-5 4 correctness"
"$PREFS" save "$REPO" --interrupt "review only" --revise opus --max-rounds 4 --scope all --defer-at round --defer-to github >/dev/null
saved "review only: previous interrupt stays" '.interrupt' "plan"
saved "review only: neither deferral setting applies, so both saved values stay" '[.deferAt, .deferTo] | join(" ")' "end print"
saved "review only: scope saved" '.scope' "all"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all --defer-at round --defer-to github >/dev/null
saved "guided: saved" '.interrupt' "guided"
saved "guided: both deferral settings saved" '[.deferAt, .deferTo] | join(" ")' "round github"
"$PREFS" save "$REPO" --interrupt review --revise opus --max-rounds 3 --scope all --defer-at end --defer-to spec >/dev/null
saved "review: saved" '.interrupt' "review"
saved "review: both deferral settings saved" '[.deferAt, .deferTo] | join(" ")' "end spec"

echo "# a first save of a per-run verb leaves interrupt unset"
rm "$REPO/.claude/redline.local.json"
"$PREFS" save "$REPO" --interrupt "review only" --revise opus --max-rounds 3 --scope all --defer-at round --defer-to github >/dev/null
saved "first review only: no interrupt key" 'has("interrupt")' "false"
saved "first review only: no deferral keys, since the run settled neither" '[has("deferAt"), has("deferTo")] | join(",")' "false,false"
expect "first review only: next resolve falls back to guided, from the default" '[.effective.interrupt, .sources.interrupt] | join(" ")' "guided default"
expect "first review only: next resolve is a confirm" '.confirm' "true"
expect "first review only: summary" '.summary' "Run with: review only (command line) · Opus 5.5 · 3 rounds · all" --interrupt "review only"
expect "first review only: the next full run is asked for the two the file lacks" '.ask | join(",")' "deferAt,deferTo"
expect "first review only: the confirm line holds what is not asked" '.summary' "Run with: guided · Opus 5.5 · 3 rounds · all"
expect "first review only: a later review only run is asked nothing" '.ask | length' "0" --interrupt "review only"
"$PREFS" save "$REPO" --interrupt autopilot --revise opus --max-rounds 3 --scope all --defer-at round --defer-to spec >/dev/null
saved "first autopilot: where is saved, when is not" '[has("deferAt"), .deferTo] | join(",")' "false,spec"
expect "first autopilot: the next guided run is asked only when" '.ask | join(",")' "deferAt"
expect "first autopilot: the confirm line holds where, not the asked when" '.summary' "Run with: guided · Opus 5.5 · 3 rounds · all · drafts to the spec folder"
expect "first autopilot: a later autopilot run is asked nothing" '.ask | length' "0" --interrupt autopilot

echo "# a saved file from before the deferral settings (#95)"
printf '{"interrupt": "plan", "revise": "claude-fable-5-1", "maxRounds": 2, "scope": "all", "runs": {"7": {"kind": "error"}}}\n' > "$REPO/.claude/redline.local.json"
expect "older file: a confirm, with the two it lacks asked beside it" '[(.confirm|tostring), (.ask | join(","))] | join(" ")' "true deferAt,deferTo"
expect "older file: the confirm line is its four" '.summary' "Run with: plan · Fable 5.1 · 2 rounds · all"
expect "older file: a typed word is not asked, and joins the line" '[(.ask | join(",")), .summary] | join(" | ")' "deferAt | Run with: plan · Fable 5.1 · 2 rounds · all · drafts printed (command line)" --defer-to print
expect "older file: autopilot is asked only where" '.ask | join(",")' "deferTo" --interrupt autopilot
expect "older file: review only is asked nothing" '.ask | length' "0" --interrupt "review only"
printf '{"deferTo": "spec"}\n' > "$REPO/.claude/redline.json"
expect "older file: the repository default does not settle it; it is still asked, with that default first" '[(.ask | join(",")), .effective.deferTo, .repository.deferTo] | join(" ")' "deferAt,deferTo spec spec"
rm "$REPO/.claude/redline.json"
"$PREFS" save "$REPO" --interrupt plan --revise fable --max-rounds 2 --scope all --defer-at round --defer-to github >/dev/null
expect "older file: once saved, nothing is asked" '[(.confirm|tostring), (.ask|length|tostring)] | join(" ")' "true 0"
expect "older file: once saved, the line has six values" '.summary' "Run with: plan · Fable 5.1 · 2 rounds · all · deferred each round · drafts to GitHub"
saved "older file: the save keeps the run markers" '.runs."7".kind' "error"

echo "# a damaged file"
printf '{"interrupt": "yolo", "maxRounds": "two", "scope": "correctness"}\n' > "$REPO/.claude/redline.local.json"
expect "damaged: bad values fall back to defaults, good ones hold" '[.effective.interrupt, (.effective.maxRounds|tostring), .effective.scope] | join(" ")' "guided 3 correctness"
printf '{"interrupt": "plan", "revise": "claude-opus-5-5", "maxRounds": 3, "scope": "all", "deferAt": "sometimes", "deferTo": "jira"}\n' > "$REPO/.claude/redline.local.json"
expect "damaged: a bad deferral word falls back to the default and is asked" '[.effective.deferAt, .effective.deferTo, (.ask | join(","))] | join(" ")' "round github deferAt,deferTo"
printf 'not json\n' > "$REPO/.claude/redline.local.json"
"$PREFS" resolve "$REPO" >/dev/null 2>&1; [[ $? -eq 2 ]] && ok "not JSON exits 2" || bad "not JSON exits 2" "$?"


echo "# the run marker (#10)"
printf '{"interrupt": "plan", "revise": "claude-opus-5-5", "maxRounds": 3, "scope": "all", "runs": {"7": {"kind": "error"}}}\n' > "$REPO/.claude/redline.local.json"
"$PREFS" save "$REPO" --interrupt guided --revise opus --max-rounds 3 --scope all --defer-at round --defer-to github >/dev/null
saved "save keeps the runs key" '.runs."7".kind' "error"
saved "save still writes its own fields" '.interrupt' "guided"

# A git repository in the throwaway directory: a base commit, then the run's last commit (the
# marker's head), on branch work. The records live outside it, so they never show as untracked.
REC="$(mktemp -d "${TMPDIR:-/tmp}/redline-prefs-records.XXXXXX")"
trap 'rm -rf "$REPO" "$REC"' EXIT
# The copy of Redline a session loads (--plugin, #135): its manifest's version and its workflow file,
# an installed release. Every record's args carry the launch the skill recorded from it: the version
# and the workflow file's blob id, as redline-setup.sh version prints them.
PLUG="$REC/plugin"
mkdir -p "$PLUG/.claude-plugin" "$PLUG/workflows"
printf '{"name": "redline", "version": "1.2.3"}\n' > "$PLUG/.claude-plugin/plugin.json"
printf 'launch script\n' > "$PLUG/workflows/redline-loop.js"
LBLOB="$(git hash-object --no-filters "$PLUG/workflows/redline-loop.js")"
L='"launch":{"version":"1.2.3","workflow":"'"$LBLOB"'"},'
G=(git -C "$REPO" -c user.name=t -c user.email=t@t -c commit.gpgsign=false)
"${G[@]}" init -q
"${G[@]}" symbolic-ref HEAD refs/heads/work
printf '.claude/redline.local.json\n.claude/.redline.local.*\n' > "$REPO/.gitignore"
mkdir -p "$REPO/app" "$REPO/.claude/redline" "$REPO/.claude-plugin"
printf '{}\n' > "$REPO/.claude/redline/checks.json"
printf 'x\n' > "$REPO/app/x.php"
printf '{"name": "redline", "version": "1.2.3"}\n' > "$REPO/.claude-plugin/plugin.json"
"${G[@]}" add .gitignore app .claude/redline .claude-plugin >/dev/null
"${G[@]}" commit -q -m base
printf 'y\n' > "$REPO/app/x.php"
"${G[@]}" commit -q -am "redline: R1-1 fix"
RUNHEAD="$("${G[@]}" rev-parse HEAD)"
FOLDER="agent-os/specs/2026-11-01-0900-7-review-round-1"
printf '%s\n' '{"runId":"wf_1","args":{'"$L"'"pr":7,"headRef":"work","files":["app/x.php"]},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["'"$FOLDER"'"],"snapshotStart":"'"$REPO/$FOLDER"'/redline/snapshot-start.json"}}' > "$REC/error.json"
printf '%s\n' '{"runId":"wf_2","args":{'"$L"'"pr":7},"result":{"status":"error","stage":"gather","error":"head moved","resumeFrom":null,"specFolders":["'"$FOLDER"'"]}}' > "$REC/gather.json"
printf '%s\n' '{"runId":"wf_3","args":{'"$L"'"pr":7},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/handoff.json"
printf '%s\n' '{"runId":"wf_4","args":{'"$L"'"pr":7},"result":{"status":"reviewed","reviewedRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/reviewed.json"
printf '%s\n' '{"runId":"wf_5","args":{'"$L"'"pr":7,"repoRoot":"'"$REPO"'","snapshotPath":"'"$REPO/$FOLDER"'/redline/snapshot-start.json","launchedAt":"2026-11-01T09:00:00-0400"}}' > "$REC/stopped.json"
# An error at post r2: the result lists round 1 only, since a round joins the result after its post.
printf '%s\n' '{"runId":"wf_8","args":{'"$L"'"pr":7,"repoRoot":"'"$REPO"'","launchedAt":"2026-11-01T09:00:00-0400"},"result":{"status":"error","stage":"post","error":"GitHub refused the review","resumeFrom":{"label":"post r2","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/later.json"
printf '%s\n' '{"runId":"wf_6","args":{'"$L"'"pr":7},"result":{"status":"done"}}' > "$REC/done.json"
# A stop that is the workflow's own check of what an agent returned (#116): the result says so.
printf '%s\n' '{"runId":"wf_14","args":{'"$L"'"pr":7},"result":{"status":"error","stage":"resolve","error":"the resolve agent stated no disposition for R1-1","resumeFrom":{"label":"resolve r1","attempt":2},"ownCheck":true,"specFolders":["'"$FOLDER"'"]}}' > "$REC/own.json"
# A repository whose own path holds /redline/ (this plugin's checkout does): the start snapshot's
# folder is read off args.repoRoot and the snapshot's fixed tail, never by splitting on /redline/.
printf '%s\n' '{"runId":"wf_7","args":{'"$L"'"pr":7,"repoRoot":"/tmp/redline/app"},"result":{"status":"handoff","handoffRound":2,"specFolders":["agent-os/specs/2026-11-01-0900-7-review-round-2"],"snapshotStart":"/tmp/redline/app/agent-os/specs/2026-11-01-0900-7-review-round-1/redline/snapshot-start.json"}}' > "$REC/nested.json"
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
# The marker carries the result's ownCheck (#116), which the skill copies into the resume entry:
# true for a stop that is the workflow's own check, false for a result that holds none (one
# written before the field existed, and every stop that is not an error).
saved "save: a result with no ownCheck saves false" '.runs."7".ownCheck | tostring' "false"
runj "save: a stop that is the workflow's own check saves ownCheck true" '[.label, (.ownCheck | tostring)] | join(" ")' "resolve r1 true" save "$REPO" 7 --run-id wf_14 --record "$REC/own.json"
run save "$REPO" 7 --run-id wf_3 --record "$REC/handoff.json" >/dev/null 2>&1
saved "save: a hand-off saves ownCheck false" '.runs."7".ownCheck | tostring' "false"
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
runj "save: --session wins over the environment" '.session' "s9" save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" --session s9
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
runx "save: a gather error cannot be resumed, exit 1" 1 save "$REPO" 7 --run-id wf_2 --record "$REC/gather.json"
runerr "save: the line says so and names the folder" "cannot be resumed; start fresh after committing or removing $FOLDER" save "$REPO" 7 --run-id wf_2 --record "$REC/gather.json"
saved "save: a refused save leaves the entry" '.runs."7".runId' "wf_1"
runj "save: a hand-off marker" '[.kind, .handoffKind, (.round|tostring), .label] | join(" ")' "handoff decisions 1 " save "$REPO" 7 --run-id wf_3 --record "$REC/handoff.json"
runj "save: a reviewed marker" '[.kind, (.round|tostring)] | join(" ")' "reviewed 1" save "$REPO" 7 --run-id wf_4 --record "$REC/reviewed.json"
runj "save: the start snapshot's folder under a path holding /redline/" '.specFolders | join(",")' "agent-os/specs/2026-11-01-0900-7-review-round-1,agent-os/specs/2026-11-01-0900-7-review-round-2" save "$REPO" 7 --run-id wf_7 --record "$REC/nested.json"
runj "save: no result is a stopped run, listing the start snapshot's folder from its args" '[.kind, .stage, .specFolders | tostring] | join(" ")' "stopped  [\"$FOLDER\"]" save "$REPO" 7 --run-id wf_5 --record "$REC/stopped.json"
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
runj "check: same session, same head, clean tree" '[(.ok|tostring), .reason, .line] | join("|")' "true||" check "$REPO" 7 --plugin "$PLUG"
runx "check: ok exits 0" 0 check "$REPO" 7 --plugin "$PLUG"
runj "check: carries the marker and the head" '[.marker.runId, .head] | join(" ")' "wf_1 $RUNHEAD" check "$REPO" 7 --plugin "$PLUG"
runj "check: no marker" '[(.ok|tostring), .reason, .line] | join("|")' "false|none|no stopped run is recorded for #8" check "$REPO" 8 --plugin "$PLUG"
runx "check: refused exits 1" 1 check "$REPO" 8 --plugin "$PLUG"
SESSION=s2
runj "check: another session is refused" '[(.ok|tostring), .reason] | join("|")' "false|session" check "$REPO" 7 --plugin "$PLUG"
runj "check: the line gives the resume command" '.line' "the run on #7 was launched from session s1; reopen it with: claude --resume s1, then type /redline:redline 7 again" check "$REPO" 7 --plugin "$PLUG"
SESSION=s1
"${G[@]}" checkout -q -b other
runj "check: another branch is refused" '[.reason, .line] | join("|")' "branch|check out work" check "$REPO" 7 --plugin "$PLUG"
# The version the run launched under against this session's copy (#135): after session, before branch.
printf '%s\n' '{"runId":"wf_20","args":{"launch":{"version":"1.2.2","workflow":"'"$LBLOB"'"},"pr":7},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/old-version.json"
"${G[@]}" checkout -q work
run save "$REPO" 7 --run-id wf_20 --record "$REC/old-version.json" >/dev/null 2>&1
"${G[@]}" checkout -q other
runj "check: another version comes before the branch" '[(.ok|tostring), .reason] | join("|")' "false|version" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" checkout -q work
runj "check: a marker launched under another version is refused, naming both" '[.reason, .line] | join("|")' "version|The run on #7 started under Redline 1.2.2, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
runx "check: another version exits 1" 1 check "$REPO" 7 --plugin "$PLUG"
SESSION=s2
runj "check: another session still comes first" '.reason' "session" check "$REPO" 7 --plugin "$PLUG"
SESSION=s1
# A marker written before 0.5.1 holds no launch (#135, answer b): refused, naming the version from
# args.pluginRoot's manifest when that root is an installed release, else as a build before 0.5.1.
mkdir -p "$REC/plugins/cache/m/redline/0.4.3/.claude-plugin"
printf '{"name": "redline", "version": "0.4.3"}\n' > "$REC/plugins/cache/m/redline/0.4.3/.claude-plugin/plugin.json"
printf '%s\n' '{"runId":"wf_21","args":{"pr":7,"pluginRoot":"'"$REC"'/plugins/cache/m/redline/0.4.3"},"result":{"status":"error","stage":"check","error":"x","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/no-launch.json"
run save "$REPO" 7 --run-id wf_21 --record "$REC/no-launch.json" >/dev/null 2>&1
runj "check: a marker with no launch is refused, the release named from its cache manifest" '[.reason, .line] | join("|")' "version|The run on #7 started under Redline 0.4.3, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
printf '%s\n' '{"runId":"wf_21","args":{"pr":7,"pluginRoot":"'"$REPO"'"},"result":{"status":"error","stage":"check","error":"x","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/no-launch-inplace.json"
run save "$REPO" 7 --run-id wf_21 --record "$REC/no-launch-inplace.json" >/dev/null 2>&1
runj "check: a marker with no launch from a checkout is a build before 0.5.1, its manifest unread" '[.reason, .line] | join("|")' "version|The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
printf '%s\n' '{"runId":"wf_21","args":{"pr":7},"result":{"status":"error","stage":"check","error":"x","resumeFrom":{"label":"recheck r1","attempt":2},"specFolders":[]}}' > "$REC/no-launch-bare.json"
run save "$REPO" 7 --run-id wf_21 --record "$REC/no-launch-bare.json" >/dev/null 2>&1
runj "check: a marker with no launch and no plugin root is a build before 0.5.1" '.line' "The run on #7 started under a Redline build before 0.5.1, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing its spec folders" check "$REPO" 7 --plugin "$PLUG"
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
"${G[@]}" branch -q -D other
mkdir -p "$REPO/$FOLDER/redline"
printf '{}\n' > "$REPO/$FOLDER/redline/round-1-reply-R1-1.md"
runj "check: untracked under the run's folder is fine" '[(.ok|tostring), (.untracked|join(","))] | join("|")' "true|$FOLDER/redline/round-1-reply-R1-1.md" check "$REPO" 7 --plugin "$PLUG"
printf 'stray\n' > "$REPO/stray.txt"
runj "check: untracked outside it is refused" '[.reason, .line] | join("|")' "untracked|commit or remove stray.txt, or start fresh" check "$REPO" 7 --plugin "$PLUG"
rm "$REPO/stray.txt"
printf 'z\n' >> "$REPO/app/x.php"
runj "check: a modified tracked file outside it is refused" '[.reason, .line] | join("|")' "untracked|commit or remove app/x.php, or start fresh" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" checkout -q -- app/x.php
printf '{"baseline": null}\n' > "$REPO/.claude/redline/checks.json"
"${G[@]}" commit -q -am "Fix the gate config"
HAND="$("${G[@]}" rev-parse HEAD)"
runj "check: a hand commit under .claude/ is allowed" '[(.ok|tostring), .reason, (.hand.commits|join(",")), (.hand.paths|join(","))] | join("|")' "true||$HAND|.claude/redline/checks.json" check "$REPO" 7 --plugin "$PLUG"
runj "check: the plugin's own checkout refuses a moved head" '[.reason, .line] | join("|")' "plugin|the repository is the plugin and HEAD moved since the run stopped (1 commit); a plugin fix changes what runs, so start fresh: the next round carries the findings forward" check "$REPO" 7 --plugin "$REPO"
runj "check: another plugin root is not the plugin case" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$PLUG"
# Only an error resume carries a hand commit into the workflow, so any other stop refuses one.
"${G[@]}" reset -q --hard "$RUNHEAD"
run save "$REPO" 7 --run-id wf_3 --record "$REC/handoff.json" >/dev/null 2>&1
"${G[@]}" reset -q --hard "$HAND"
runj "check: a hand commit after a hand-off is refused" '[.reason, .line] | join("|")' "head-moved|the run stopped at a hand-off and HEAD moved since (1 commit); only a run that stopped with an error accepts a hand commit, so start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" reset -q --hard "$RUNHEAD"
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
"${G[@]}" reset -q --hard "$HAND"
printf 'w\n' > "$REPO/app/y.php"
"${G[@]}" add app/y.php
"${G[@]}" commit -q -m "Hand fix"
runj "check: a hand commit outside .claude/ is refused" '[.reason, .line] | join("|")' "head-moved|2 commits since the run stopped touch app/y.php outside .claude/; start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" reset -q --hard "$RUNHEAD~1"
BELOW="$("${G[@]}" rev-parse HEAD)"
runj "check: a head below the run's commit is refused" '[.reason, .line] | join("|")' "head-moved|HEAD ${BELOW:0:7} is not on top of the run's last commit ${RUNHEAD:0:7}; start fresh after committing or removing $FOLDER" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" reset -q --hard "$RUNHEAD"
rm -rf "$REPO/agent-os"

echo "# run check: the run's own folders come from its args"
run save "$REPO" 7 --run-id wf_5 --record "$REC/stopped.json" >/dev/null 2>&1
mkdir -p "$REPO/$FOLDER/redline"
printf '{}\n' > "$REPO/$FOLDER/redline/snapshot-start.json"
runj "check: a stopped run's untracked start snapshot is the run's own" '[(.ok|tostring), .reason, (.untracked|join(","))] | join("|")' "true||$FOLDER/redline/snapshot-start.json" check "$REPO" 7 --plugin "$PLUG"
rm -rf "$REPO/agent-os"
run save "$REPO" 7 --run-id wf_8 --record "$REC/later.json" >/dev/null 2>&1
LATER="agent-os/specs/2026-11-01-0900-7-review-round-2"
HUMAN="agent-os/specs/2026-11-01-0900-7-human-review-1"
mkdir -p "$REPO/$LATER/redline" "$REPO/$HUMAN/redline"
printf '{}\n' > "$REPO/$LATER/redline/round-2-review.json"
printf '[]\n' > "$REPO/$LATER/redline/round-2-findings.json"
printf '{}\n' > "$REPO/$HUMAN/redline/review.json"
runj "check: a later round the result does not list yet is the run's own" '[(.ok|tostring), .reason] | join("|")' "true|" check "$REPO" 7 --plugin "$PLUG"
rm -rf "$REPO/agent-os"
OTHERSTAMP="agent-os/specs/2026-11-01-0800-7-review-round-2"
OTHERPR="agent-os/specs/2026-11-01-0900-8-review-round-1"
mkdir -p "$REPO/$OTHERSTAMP/redline" "$REPO/$OTHERPR/redline"
printf '{}\n' > "$REPO/$OTHERSTAMP/redline/round-2-review.json"
printf '{}\n' > "$REPO/$OTHERPR/redline/round-1-review.json"
runj "check: a folder of another launch stamp or another PR is refused" '[.reason, .line] | join("|")' "untracked|commit or remove $OTHERSTAMP/redline/round-2-review.json, $OTHERPR/redline/round-1-review.json, or start fresh" check "$REPO" 7 --plugin "$PLUG"
rm -rf "$REPO/agent-os"

echo "# run check: a second resume at the same label keeps the first's hand commits"
H1=1111111111111111111111111111111111111111
printf '%s\n' '{"runId":"wf_9","args":{'"$L"'"pr":7,"resume":{"recheck r1":{"attempt":2,"error":"x","hand":{"commits":["'"$H1"'"],"paths":[".claude/redline/checks.json"]}}}},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":3},"specFolders":["'"$FOLDER"'"]}}' > "$REC/again.json"
printf '%s\n' '{"runId":"wf_10","args":{'"$L"'"pr":7,"resume":{"check r2":{"attempt":2,"error":"x","hand":{"commits":["'"$H1"'"],"paths":[".claude/redline/checks.json"]}}}},"result":{"status":"error","stage":"check","error":"checks.sh still fails","resumeFrom":{"label":"recheck r1","attempt":3},"specFolders":["'"$FOLDER"'"]}}' > "$REC/otherlabel.json"
run save "$REPO" 7 --run-id wf_9 --record "$REC/again.json" >/dev/null 2>&1
runj "check: the label's earlier hand list is printed when HEAD has not moved" '[(.ok|tostring), (.hand.commits|join(",")), (.hand.paths|join(","))] | join("|")' "true|$H1|.claude/redline/checks.json" check "$REPO" 7 --plugin "$PLUG"
printf '{}\n' > "$REPO/.claude/redline/other.json"
"${G[@]}" add .claude/redline/other.json
"${G[@]}" commit -q -m "Fix the gate again"
AGAIN="$("${G[@]}" rev-parse HEAD)"
runj "check: a new hand commit joins the label's earlier one" '[(.ok|tostring), (.hand.commits|join(",")), (.hand.paths|join(","))] | join("|")' "true|$H1,$AGAIN|.claude/redline/checks.json,.claude/redline/other.json" check "$REPO" 7 --plugin "$PLUG"
"${G[@]}" reset -q --hard "$RUNHEAD"
run save "$REPO" 7 --run-id wf_10 --record "$REC/otherlabel.json" >/dev/null 2>&1
runj "check: an entry under another label adds nothing" '[(.ok|tostring), (.hand.commits|length|tostring), (.hand.paths|length|tostring)] | join("|")' "true|0|0" check "$REPO" 7 --plugin "$PLUG"
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1

# The script a relaunch runs (#81): only the plugin's own repository can see its workflow or agent
# files change during a run. The record's scriptPath is the copy the harness persisted at launch
# (the pin), or the live file itself when the launch went by the scriptPath fallback (no pin).
echo "# run drift (#81)"
mkdir -p "$REPO/workflows" "$REPO/agents"
printf 'launch script\n' > "$REPO/workflows/redline-loop.js"
printf 'reviewer v1\n' > "$REPO/agents/redline-reviewer.md"
printf 'shaper v1\n' > "$REPO/agents/redline-shaper.md"
"${G[@]}" add workflows agents >/dev/null
"${G[@]}" commit -q -m "The plugin's own files"
START="$("${G[@]}" rev-parse HEAD)"
PIN="$REC/redline-loop-wf_11.js"
cp "$REPO/workflows/redline-loop.js" "$PIN"
printf '%s\n' '{"runId":"wf_11","scriptPath":"'"$PIN"'","args":{'"$L"'"pr":7,"startSha":"'"$START"'"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned.json"
printf '%s\n' '{"runId":"wf_12","scriptPath":"'"$REPO"'/workflows/redline-loop.js","args":{'"$L"'"pr":7,"startSha":"'"$START"'"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/fallback.json"
run save "$REPO" 7 --run-id wf_11 --record "$REC/pinned.json" >/dev/null 2>&1
DRIFT='[(.self|tostring), .launch, .scriptPath, (.agents|join(",")), (.drift|tostring), .line] | join("|")'
runj "drift: another plugin root is not the plugin's own repository" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$PLUG"
runx "drift: an installed release at the version the run launched with exits 0" 0 drift "$REPO" 7 --plugin "$PLUG"
runx "drift: no --plugin exits 2 (#135)" 2 drift "$REPO" 7
runx "check: no --plugin exits 2 (#135)" 2 check "$REPO" 7
mkdir -p "$REC/noversion/.claude-plugin"; printf '{"name": "redline"}\n' > "$REC/noversion/.claude-plugin/plugin.json"
runx "drift: a --plugin whose manifest holds no version exits 2 (#135)" 2 drift "$REPO" 7 --plugin "$REC/noversion"
runx "check: a --plugin whose manifest holds no version exits 2 (#135)" 2 check "$REPO" 7 --plugin "$REC/noversion"
# The script a relaunch runs, on every repository (#135). A checkout of the plugin loaded in place
# elsewhere can change while it reviews another repository, so the live workflow file is the
# session's copy's (--plugin), compared with the pin, or, with no pin, with the blob the launch
# recorded.
printf 'edited checkout\n' > "$PLUG/workflows/redline-loop.js"
runj "drift: another repository whose loaded checkout changed relaunches from the pin" "$DRIFT" "false|scriptPath|$PIN||{\"workflow\":\"workflows/redline-loop.js\",\"pinned\":true,\"agents\":[]}|" drift "$REPO" 7 --plugin "$PLUG"
runx "drift: from the pin on another repository exits 0" 0 drift "$REPO" 7 --plugin "$PLUG"
printf '%s\n' '{"runId":"wf_22","scriptPath":"'"$PLUG"'/workflows/redline-loop.js","args":{'"$L"'"pr":7},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/fallback-other.json"
run save "$REPO" 7 --run-id wf_22 --record "$REC/fallback-other.json" >/dev/null 2>&1
runj "drift: another repository, a launch that ran the changed file itself, is refused" '[(.self|tostring), .launch, .scriptPath, (.drift.pinned|tostring), .line] | join("|")' "false|refuse||false|workflows/redline-loop.js changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline 7" drift "$REPO" 7 --plugin "$PLUG"
runx "drift: refused on another repository exits 1" 1 drift "$REPO" 7 --plugin "$PLUG"
printf 'launch script\n' > "$PLUG/workflows/redline-loop.js"
runj "drift: another repository, a launch that ran the file itself, as launched: by name" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$PLUG"
# The same release from another install directory: the record's path is the first install's file.
cp -R "$PLUG" "$REC/plugin2"
runj "drift: the same version from another install directory goes by name" "$DRIFT" "false|name|||null|" drift "$REPO" 7 --plugin "$REC/plugin2"
# A live session runs the workflow it loaded until it reloads, so after an edit on disk a launch by
# name runs the cached copy while the launch recorded the edited file's blob: the pin holds what ran,
# and a live file that differs from it relaunches from it, never by name.
printf 'cached script\n' > "$REC/redline-loop-wf_23.js"
printf '%s\n' '{"runId":"wf_23","scriptPath":"'"$REC"'/redline-loop-wf_23.js","args":{'"$L"'"pr":7},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-cached.json"
run save "$REPO" 7 --run-id wf_23 --record "$REC/pinned-cached.json" >/dev/null 2>&1
runj "drift: a pin that is not the file the launch hashed relaunches from the pin" "$DRIFT" "false|scriptPath|$REC/redline-loop-wf_23.js||{\"workflow\":\"workflows/redline-loop.js\",\"pinned\":true,\"agents\":[]}|" drift "$REPO" 7 --plugin "$PLUG"
# Another version (#135): refused on every repository, before the pin is read, naming both versions.
printf '%s\n' '{"runId":"wf_24","scriptPath":"'"$PIN"'","args":{"launch":{"version":"1.2.2","workflow":"'"$LBLOB"'"},"pr":7,"startSha":"'"$START"'"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-old.json"
run save "$REPO" 7 --run-id wf_24 --record "$REC/pinned-old.json" >/dev/null 2>&1
VLINE="The run on #7 started under Redline 1.2.2, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing $FOLDER"
runj "drift: another version on another repository is refused, naming both" "$DRIFT" "false|refuse|||null|$VLINE" drift "$REPO" 7 --plugin "$PLUG"
runx "drift: another version exits 1" 1 drift "$REPO" 7 --plugin "$PLUG"
runj "drift: another version on the plugin's own repository is refused the same way" "$DRIFT" "true|refuse|||null|$VLINE" drift "$REPO" 7 --plugin "$REPO"
# A marker written before 0.5.1 holds no launch: refused, its version named from an installed
# release's manifest, never from a checkout's, which may have moved on since the launch.
mkdir -p "$REC/plugins/cache/m/redline/0.4.3/.claude-plugin"
printf '{"name": "redline", "version": "0.4.3"}\n' > "$REC/plugins/cache/m/redline/0.4.3/.claude-plugin/plugin.json"
printf '%s\n' '{"runId":"wf_25","scriptPath":"'"$PIN"'","args":{"pr":7,"pluginRoot":"'"$REC"'/plugins/cache/m/redline/0.4.3","startSha":"'"$START"'"},"result":{"status":"handoff","handoffKind":"decisions","handoffRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-nolaunch.json"
run save "$REPO" 7 --run-id wf_25 --record "$REC/pinned-nolaunch.json" >/dev/null 2>&1
runj "drift: a marker with no launch is refused, the release named from its cache manifest" '[.launch, .line] | join("|")' "refuse|The run on #7 started under Redline 0.4.3, and this session loads Redline 1.2.3: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing $FOLDER" drift "$REPO" 7 --plugin "$PLUG"
run save "$REPO" 7 --run-id wf_11 --record "$REC/pinned.json" >/dev/null 2>&1
runj "drift: the plugin's own repository, nothing changed: by name" "$DRIFT" "true|name|||null|" drift "$REPO" 7 --plugin "$REPO"
runx "drift: by name exits 0" 0 drift "$REPO" 7 --plugin "$REPO"
runj "drift: names the workflow file" '.workflow' "workflows/redline-loop.js" drift "$REPO" 7 --plugin "$REPO"
printf 'edited script\n' > "$REPO/workflows/redline-loop.js"
"${G[@]}" commit -q -am "redline: R1-1 edit the loop"
runj "drift: a changed workflow with a pinned copy relaunches from the copy" "$DRIFT" "true|scriptPath|$PIN||{\"workflow\":\"workflows/redline-loop.js\",\"pinned\":true,\"agents\":[]}|" drift "$REPO" 7 --plugin "$REPO"
runx "drift: by scriptPath exits 0" 0 drift "$REPO" 7 --plugin "$REPO"
printf 'reviewer v2\n' > "$REPO/agents/redline-reviewer.md"
"${G[@]}" commit -q -am "redline: R1-2 edit the reviewer"
printf 'shaper v2\n' >> "$REPO/agents/redline-shaper.md"
SENTENCE='Agent files changed since this run launched (`agents/redline-reviewer.md`, `agents/redline-shaper.md`): this run'"'"'s remaining rounds may run under them, while the workflow'"'"'s own prompts are the launch'"'"'s.'
runj "drift: changed agent files are named, an uncommitted edit included, and the run goes on" '[.launch, (.agents|join(",")), .line] | join("|")' "scriptPath|agents/redline-reviewer.md,agents/redline-shaper.md|$SENTENCE" drift "$REPO" 7 --plugin "$REPO"
runj "drift: the agent files ride in drift for the workflow" '.drift.agents | join(",")' "agents/redline-reviewer.md,agents/redline-shaper.md" drift "$REPO" 7 --plugin "$REPO"
# An error or a harness stop can be resumed after the handoff comment posted, and the comment is
# the one prompt that names the agent list, so on those markers drift keeps the list the marker's
# own args passed, while agents and line still name every changed file; a hand-off (the case above)
# or a reviewed stop, both before Finish, reads the list afresh (#91, R1-1).
HELD='{"workflow":"workflows/redline-loop.js","pinned":true,"agents":["agents/redline-reviewer.md"]}'
printf '%s\n' '{"runId":"wf_13","scriptPath":"'"$PIN"'","args":{'"$L"'"pr":7,"startSha":"'"$START"'","drift":'"$HELD"'},"result":{"status":"error","stage":"finish","error":"committing the run record failed: push rejected: fetch first","resumeFrom":{"label":"record commit","attempt":2},"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-error.json"
printf '%s\n' '{"runId":"wf_14","scriptPath":"'"$PIN"'","args":{'"$L"'"pr":7,"startSha":"'"$START"'"}}' > "$REC/pinned-stopped.json"
printf '%s\n' '{"runId":"wf_15","scriptPath":"'"$PIN"'","args":{'"$L"'"pr":7,"startSha":"'"$START"'","drift":'"$HELD"'},"result":{"status":"reviewed","reviewedRound":1,"specFolders":["'"$FOLDER"'"]}}' > "$REC/pinned-reviewed.json"
run save "$REPO" 7 --run-id wf_13 --record "$REC/pinned-error.json" >/dev/null 2>&1
runj "drift: an error marker keeps the agent list its args passed" '[.launch, (.agents|join(",")), (.drift|tostring)] | join("|")' "scriptPath|agents/redline-reviewer.md,agents/redline-shaper.md|$HELD" drift "$REPO" 7 --plugin "$REPO"
runj "drift: on an error marker the line still names every changed file" '.line' "$SENTENCE" drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_14 --record "$REC/pinned-stopped.json" >/dev/null 2>&1
runj "drift: a stopped marker whose args passed no drift keeps an empty agent list" '[.launch, (.agents|join(",")), (.drift|tostring)] | join("|")' 'scriptPath|agents/redline-reviewer.md,agents/redline-shaper.md|{"workflow":"workflows/redline-loop.js","pinned":true,"agents":[]}' drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_15 --record "$REC/pinned-reviewed.json" >/dev/null 2>&1
runj "drift: a reviewed marker reads the agent list afresh" '.drift.agents | join(",")' "agents/redline-reviewer.md,agents/redline-shaper.md" drift "$REPO" 7 --plugin "$REPO"
run save "$REPO" 7 --run-id wf_11 --record "$REC/pinned.json" >/dev/null 2>&1
"${G[@]}" checkout -q -- agents/redline-shaper.md
printf 'new role\n' > "$REPO/agents/redline-new.md"
runj "drift: an untracked agent file counts" '.agents | join(",")' "agents/redline-new.md,agents/redline-reviewer.md" drift "$REPO" 7 --plugin "$REPO"
rm "$REPO/agents/redline-new.md"
run save "$REPO" 7 --run-id wf_12 --record "$REC/fallback.json" >/dev/null 2>&1
runj "drift: a changed workflow whose launch ran the live file has no pin and is refused, naming the file" '[.launch, .scriptPath, (.drift.pinned|tostring), .line] | join("|")' "refuse||false|workflows/redline-loop.js changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline 7" drift "$REPO" 7 --plugin "$REPO"
runx "drift: refused exits 1" 1 drift "$REPO" 7 --plugin "$REPO"
"${G[@]}" checkout -q "$START" -- workflows/redline-loop.js
runj "drift: a launch from the live file with the workflow as launched goes by name" '[.launch, .drift.workflow, (.drift.agents|join(","))] | join("|")' "name||agents/redline-reviewer.md" drift "$REPO" 7 --plugin "$REPO"
"${G[@]}" reset -q --hard "$RUNHEAD"
runx "drift: no marker exits 2" 2 drift "$REPO" 8 --plugin "$REPO"
runx "drift: another repository with no marker exits 2, since the launch it records is unknown (#135)" 2 drift "$REPO" 8 --plugin "$PLUG"
run save "$REPO" 7 --run-id wf_1 --record "$REC/error.json" >/dev/null 2>&1
runx "drift: a marker whose args hold no start commit exits 2" 2 drift "$REPO" 7 --plugin "$REPO"

echo "# run clear"
runj "clear: removes the entry" '.cleared' "true" clear "$REPO" 7
runj "clear: read is null after it" '.' "null" read "$REPO" 7
runj "clear: a second clear reports false" '.cleared' "false" clear "$REPO" 7
saved "clear: the prefs keys survive" '[.interrupt, .revise, (.maxRounds|tostring), .scope] | join(" ")' "guided claude-opus-5-5 3 all"
saved "clear: an empty runs map is dropped" 'has("runs")' "false"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
