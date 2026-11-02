#!/usr/bin/env bash
#
# redline-prefs.sh: the saved launch preferences of /redline:redline, one file per person per
# repository at <repoRoot>/.claude/redline.local.json (ignored by git; the guard refuses it for
# every Redline role). It holds four settings: interrupt (the dial), revise (the revise model id),
# maxRounds and scope. The skill calls this script so the merge rules live in one tested place.
#
#   redline-prefs.sh resolve <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>]
#       Merge: command line over the saved file over the defaults (guided, claude-opus-5-5,
#       redline.json's maxRounds or 3, all). Prints JSON: the saved file (null when absent), the
#       effective settings, where each came from, which fields the skill must ask for (no saved
#       file: every field not on the command line that applies to the run), whether to show the
#       one-question confirm instead (a saved file exists), and the confirm's summary line.
#   redline-prefs.sh save <repoRoot> --interrupt <word> --revise <model> --max-rounds <n> --scope <word>
#       Write what the run uses as the new saved set, except that autopilot and review only are
#       per-run verbs: the file keeps its previous interrupt (or none). Every other key of the
#       file (the run markers under runs) is kept. Prints the file's JSON.
#
# The same file holds, under runs, one marker per PR for a run that stopped (a hand-off, the
# review dial, an error, a run the harness stopped), so the next /redline:redline <pr> can offer
# to resume it, from the session that launched it (#10):
#
#   redline-prefs.sh run save <repoRoot> <pr> --run-id <id> [--session <id>] [--record <file>]
#       Write the marker from the harness's own record of the run: ~/.claude/projects/*/<session>/
#       workflows/<runId>.json (or --record), whose args and result it copies. The session is
#       --session, else CLAUDE_CODE_SESSION_ID (set in every Bash tool subprocess). kind is error,
#       handoff or reviewed from the result's status, or stopped when the record has no result;
#       any other status leaves no marker (exit 2). An error whose resumeFrom is null cannot be
#       resumed: exit 1 with the folders to commit or remove, and no marker. specFolders are the
#       result's, plus the start snapshot's folder, from the result's snapshotStart or, without
#       one (a stopped run has no result), from args.snapshotPath. Prints the entry:
#       {pr, kind, runId, session, record, head, branch, stage, label, attempt, error, round,
#       handoffKind, specFolders, args}.
#   redline-prefs.sh run read <repoRoot> <pr>
#       Prints the entry, or null. Exit 0 either way.
#   redline-prefs.sh run check <repoRoot> <pr> [--plugin <dir>] [--session <id>]
#       Whether the run can be resumed from here, as {ok, reason, line, marker, head, hand, untracked}:
#       the first failing reason wins, in this order: none (no marker), session (another session
#       launched it; the line gives claude --resume <id>), branch (not the run's branch),
#       head-moved (HEAD is not the marker's and not on top of it, the marker's kind is not error
#       and HEAD moved at all, or the commits on top touch a path outside .claude/), plugin (the repository is --plugin's directory and HEAD moved: a
#       plugin fix changes what runs, so start fresh), untracked (an untracked or modified path
#       outside the run's spec folders: the listed ones, and every folder the run's launch stamp
#       names for this PR). Hand commits are accepted only on an error marker, since only an error
#       resume carries them into the workflow. hand lists the commits and paths on top of the marker's
#       head, plus the hand list the marker's own label already carries in its args.resume,
#       which the workflow excuses. Exit 0 ok, 1 refused.
#   redline-prefs.sh run clear <repoRoot> <pr>
#       Removes the entry. Prints {cleared: true|false}.
#
# Interrupt words: autopilot | guided | plan | review | review only (also review-only). Scope
# words: all | correctness. Exit 2 on a bad argument. Needs jq, and git for the run markers.

set -euo pipefail

usage() {
    echo "usage: redline-prefs.sh resolve|save <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>]" >&2
    exit 2
}

[[ $# -ge 2 ]] || usage
cmd="$1"

# ---------------------------------------------------------------------------
# The run markers (#10).
# ---------------------------------------------------------------------------

run_usage() {
    echo "usage: redline-prefs.sh run save|read|check|clear <repoRoot> <pr> [--run-id <id>] [--session <id>] [--record <file>] [--plugin <dir>]" >&2
    exit 2
}

realdir() { (cd "$1" 2>/dev/null && pwd -P); }

if [[ "$cmd" == "run" ]]; then
    [[ $# -ge 4 ]] || run_usage
    sub="$2" root="$3" pr="$4"
    shift 4
    case "$sub" in save|read|check|clear) ;; *) run_usage ;; esac
    [[ -d "$root" ]] || { echo "redline-prefs: $root is not a directory" >&2; exit 2; }
    [[ "$pr" =~ ^[1-9][0-9]*$ ]] || { echo "redline-prefs: pr must be a positive integer; got '$pr'" >&2; exit 2; }
    runid="" session="${CLAUDE_CODE_SESSION_ID:-}" record="" plugin=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --run-id) runid="${2:-}"; shift 2 ;;
            --session) session="${2:-}"; shift 2 ;;
            --record) record="${2:-}"; shift 2 ;;
            --plugin) plugin="${2:-}"; shift 2 ;;
            *) echo "redline-prefs: unknown option $1" >&2; run_usage ;;
        esac
    done
    file="$root/.claude/redline.local.json"
    saved='null'
    if [[ -f "$file" ]]; then
        if ! saved="$(jq -c '.' "$file" 2>/dev/null)"; then
            if [[ "$sub" == "read" ]]; then
                echo null
                exit 0
            fi
            echo "redline-prefs: $file is not JSON" >&2
            exit 2
        fi
    fi
    entry="$(jq -c --arg pr "$pr" '.runs[$pr] // null' <<<"$saved")"
    write_saved() {
        mkdir -p "$root/.claude"
        local tmp
        tmp="$(mktemp "$root/.claude/.redline.local.XXXXXX")"
        printf '%s\n' "$1" | jq '.' >"$tmp"
        mv "$tmp" "$file"
    }

    if [[ "$sub" == "read" ]]; then
        printf '%s\n' "$entry" | jq '.'
        exit 0
    fi

    if [[ "$sub" == "clear" ]]; then
        if [[ "$entry" == "null" ]]; then
            echo '{"cleared": false}'
            exit 0
        fi
        write_saved "$(jq -c --arg pr "$pr" 'del(.runs[$pr]) | if (.runs | length) == 0 then del(.runs) else . end' <<<"$saved")"
        echo '{"cleared": true}'
        exit 0
    fi

    if [[ "$sub" == "save" ]]; then
        [[ -n "$runid" ]] || { echo "redline-prefs: run save needs --run-id" >&2; exit 2; }
        [[ -n "$session" ]] || { echo "redline-prefs: no session id; pass --session or run from a Claude Code session" >&2; exit 2; }
        if [[ -z "$record" ]]; then
            shopt -s nullglob
            matches=("$HOME"/.claude/projects/*/"$session"/workflows/"$runid".json)
            shopt -u nullglob
            if [[ ${#matches[@]} -ne 1 ]]; then
                echo "redline-prefs: ${#matches[@]} run records match ~/.claude/projects/*/$session/workflows/$runid.json; pass --record <file>" >&2
                exit 2
            fi
            record="${matches[0]}"
        fi
        [[ -f "$record" ]] || { echo "redline-prefs: $record does not exist" >&2; exit 2; }
        rec="$(jq -c '.' "$record" 2>/dev/null)" || { echo "redline-prefs: $record is not JSON" >&2; exit 2; }
        status="$(jq -r '.result.status // ""' <<<"$rec")"
        case "$status" in
            error|handoff|reviewed) kind="$status" ;;
            "") kind="stopped" ;;
            *) echo "redline-prefs: a run with status $status leaves no marker" >&2; exit 2 ;;
        esac
        if [[ "$kind" == "error" && "$(jq -r '.result.resumeFrom.label // ""' <<<"$rec")" == "" ]]; then
            folders="$(jq -r '[.result.specFolders // [] | .[]] | join(", ")' <<<"$rec")"
            echo "redline-prefs: the run on #$pr stopped at $(jq -r '.result.stage // "an unknown stage"' <<<"$rec") and cannot be resumed; start fresh after committing or removing ${folders:-its spec folders}" >&2
            exit 1
        fi
        head="$(git -C "$root" rev-parse HEAD 2>/dev/null)" || { echo "redline-prefs: $root is not a git repository" >&2; exit 2; }
        branch="$(git -C "$root" rev-parse --abbrev-ref HEAD)"
        entry="$(jq -cn --argjson rec "$rec" --arg pr "$pr" --arg kind "$kind" --arg runid "$runid" --arg session "$session" \
            --arg record "$record" --arg head "$head" --arg branch "$branch" --arg root "$root" '
            ($rec.result // {}) as $r
            | {pr: ($pr | tonumber), kind: $kind, runId: $runid, session: $session, record: $record, head: $head, branch: $branch,
               stage: ($r.stage // ""), label: ($r.resumeFrom.label // ""), attempt: ($r.resumeFrom.attempt // 0), error: ($r.error // ""),
               round: ($r.handoffRound // $r.reviewedRound // (($r.rounds // []) | if length > 0 then last.round else 0 end)),
               handoffKind: ($r.handoffKind // ""),
               specFolders: ((($r.specFolders // []) + [($r.snapshotStart // "") | (if . == "" then ($rec.args.snapshotPath // "") else . end) | select(. != "")
                                 | ltrimstr((($rec.args.repoRoot // $root) | rtrimstr("/")) + "/") | sub("/redline/snapshot-start\\.json$"; "")
                                 | select(startswith("/") | not)])
                             | map(select(. != "")) | unique | sort),
               args: ($rec.args // {})}')"
        write_saved "$(jq -c --arg pr "$pr" --argjson e "$entry" '(. // {}) | .runs[$pr] = $e' <<<"$saved")"
        printf '%s\n' "$entry" | jq '.'
        exit 0
    fi

    # check
    head="" hand='{"commits":[],"paths":[]}' untracked_json='[]'
    refuse() {
        jq -n --arg reason "$1" --arg line "$2" --argjson marker "$entry" --arg head "$head" \
            --argjson hand "$hand" --argjson untracked "$untracked_json" \
            '{ok: false, reason: $reason, line: $line, marker: $marker, head: $head, hand: $hand, untracked: $untracked}'
        exit 1
    }
    if [[ "$entry" == "null" ]]; then
        refuse none "no stopped run is recorded for #$pr"
    fi
    head="$(git -C "$root" rev-parse HEAD 2>/dev/null)" || { echo "redline-prefs: $root is not a git repository" >&2; exit 2; }
    msession="$(jq -r '.session // ""' <<<"$entry")"
    if [[ -z "$session" || "$session" != "$msession" ]]; then
        refuse session "the run on #$pr was launched from session $msession; reopen it with: claude --resume $msession, then type /redline:redline $pr again"
    fi
    mbranch="$(jq -r '.branch // ""' <<<"$entry")"
    branch="$(git -C "$root" rev-parse --abbrev-ref HEAD)"
    if [[ "$branch" != "$mbranch" ]]; then
        refuse branch "check out $mbranch"
    fi
    mhead="$(jq -r '.head // ""' <<<"$entry")"
    folders="$(jq -r '[.specFolders // [] | .[]] | join(", ")' <<<"$entry")"
    fresh="start fresh after committing or removing ${folders:-its spec folders}"
    if [[ "$head" != "$mhead" ]]; then
        if ! git -C "$root" merge-base --is-ancestor "$mhead" "$head" 2>/dev/null; then
            refuse head-moved "HEAD ${head:0:7} is not on top of the run's last commit ${mhead:0:7}; $fresh"
        fi
        commits="$(git -C "$root" rev-list "$mhead..$head")"
        paths="$(git -C "$root" diff --name-only "$mhead" "$head")"
        hand="$(jq -cn --arg c "$commits" --arg p "$paths" '{commits: ($c | split("\n") | map(select(. != ""))), paths: ($p | split("\n") | map(select(. != "")))}')"
        n="$(jq -r '.commits | length' <<<"$hand")"
        plural="commits"; [[ "$n" -eq 1 ]] && plural="commit"
        # Only an error resume carries the hand list into the workflow (args.resume), so a hand
        # commit after any other stop would fail the relaunch at the checker: refuse it here.
        mkind="$(jq -r '.kind // ""' <<<"$entry")"
        if [[ "$mkind" != "error" ]]; then
            case "$mkind" in
                handoff) where="at a hand-off" ;;
                reviewed) where="after posting a review" ;;
                *) where="before returning a result" ;;
            esac
            refuse head-moved "the run stopped $where and HEAD moved since ($n $plural); only a run that stopped with an error accepts a hand commit, so $fresh"
        fi
        if [[ -n "$plugin" && -d "$plugin" && "$(realdir "$plugin")" == "$(realdir "$root")" ]]; then
            refuse plugin "the repository is the plugin and HEAD moved since the run stopped ($n $plural); a plugin fix changes what runs, so start fresh: the next round carries the findings forward"
        fi
        outside="$(jq -r '[.paths[] | select(startswith(".claude/") | not)] | join(", ")' <<<"$hand")"
        if [[ -n "$outside" ]]; then
            refuse head-moved "$n $plural since the run stopped touch $outside outside .claude/; $fresh"
        fi
    fi
    # The hand list is cumulative: the hand list the marker's own label already carries in its
    # args.resume (an earlier resume at the same step) comes first, then the commits and paths on
    # top of the marker's head, each once, whether or not HEAD moved.
    hand_prog="$(cat <<'JQ'
def once: reduce .[] as $x ([]; if any(.[]; . == $x) then . else . + [$x] end);
def list: if type == "array" then map(select(type == "string" and . != "")) else [] end;
(($marker.label // "") as $label
 | if $label == "" then null else (try $marker.args.resume[$label].hand catch null) end) as $earlier
| if ($earlier | type) != "object" then .
  else {commits: ((($earlier.commits | list) + .commits) | once), paths: ((($earlier.paths | list) + .paths) | once)} end
JQ
)"
    hand="$(jq -c --argjson marker "$entry" "$hand_prog" <<<"$hand")"
    untracked_json="$(git -C "$root" status --porcelain --untracked-files=all | cut -c4- | sed 's/^.* -> //' | jq -R . | jq -sc .)"
    # The run's own paths: under a folder the marker lists, or under any folder the run's launch
    # stamp names for this PR (the workflow's specFolderFor and humanFolderFor), so the start
    # snapshot and a round its result does not list yet count as the run's.
    stray_prog="$(cat <<'JQ'
(($marker.args.launchedAt // "") | if type == "string" then (capture("^(?<d>[0-9]{4}-[0-9]{2}-[0-9]{2})T(?<h>[0-9]{2}):(?<m>[0-9]{2})") // null) else null end) as $at
| (if $at == null then [] else ["review-round-", "human-review-"] | map("agent-os/specs/" + $at.d + "-" + $at.h + $at.m + "-" + $pr + "-" + .) end) as $stamped
| ((($marker.specFolders // []) | map(. + "/")) + $stamped) as $prefixes
| [.[] | select(. as $p | ($prefixes | any(. as $f | $p | startswith($f))) | not)] | join(", ")
JQ
)"
    stray="$(jq -r --argjson marker "$entry" --arg pr "$pr" "$stray_prog" <<<"$untracked_json")"
    if [[ -n "$stray" ]]; then
        refuse untracked "commit or remove $stray, or start fresh"
    fi
    jq -n --argjson marker "$entry" --arg head "$head" --argjson hand "$hand" --argjson untracked "$untracked_json" \
        '{ok: true, reason: "", line: "", marker: $marker, head: $head, hand: $hand, untracked: $untracked}'
    exit 0
fi

root="$2"
shift 2
[[ "$cmd" == "resolve" || "$cmd" == "save" ]] || usage
[[ -d "$root" ]] || { echo "redline-prefs: $root is not a directory" >&2; exit 2; }

interrupt="" revise="" rounds="" scope=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --interrupt) interrupt="${2:-}"; shift 2 ;;
        --revise) revise="${2:-}"; shift 2 ;;
        --max-rounds) rounds="${2:-}"; shift 2 ;;
        --scope) scope="${2:-}"; shift 2 ;;
        *) echo "redline-prefs: unknown option $1" >&2; usage ;;
    esac
done

# Normalise the words: case, hyphens and runs of spaces. The canonical spellings are the
# command-line ones ("review only").
norm() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr '_-' '  ' | tr -s ' ' | sed -e 's/^ //' -e 's/ $//'; }
if [[ -n "$interrupt" ]]; then
    interrupt="$(norm "$interrupt")"
    case "$interrupt" in autopilot|guided|plan|review|"review only") ;; *) echo "redline-prefs: interrupt must be autopilot, guided, plan, review or review only; got '$interrupt'" >&2; exit 2 ;; esac
fi
if [[ -n "$scope" ]]; then
    scope="$(norm "$scope")"
    case "$scope" in all|correctness) ;; *) echo "redline-prefs: scope must be all or correctness; got '$scope'" >&2; exit 2 ;; esac
fi
if [[ -n "$rounds" && ! "$rounds" =~ ^[1-9][0-9]*$ ]]; then
    echo "redline-prefs: max rounds must be a positive integer; got '$rounds'" >&2
    exit 2
fi
case "$revise" in
    fable) revise="claude-fable-5-1" ;;
    opus) revise="claude-opus-5-5" ;;
esac

file="$root/.claude/redline.local.json"
config="$root/.claude/redline.json"
saved='null'
if [[ -f "$file" ]]; then
    saved="$(jq -c '.' "$file" 2>/dev/null)" || { echo "redline-prefs: $file is not JSON" >&2; exit 2; }
fi
repo='{}'
if [[ -f "$config" ]]; then
    repo="$(jq -c '.' "$config" 2>/dev/null)" || repo='{}'
fi
cli="$(jq -cn --arg i "$interrupt" --arg r "$revise" --arg n "$rounds" --arg s "$scope" '
    {interrupt: (if $i == "" then null else $i end),
     revise: (if $r == "" then null else $r end),
     maxRounds: (if $n == "" then null else ($n | tonumber) end),
     scope: (if $s == "" then null else $s end)}')"

# The merge, as one jq program shared by both commands.
MERGE='
  def fields: ["interrupt", "revise", "maxRounds", "scope"];
  def defaults: {interrupt: "guided", revise: "claude-opus-5-5", maxRounds: (($repo.maxRounds? // 3) | if type == "number" and . >= 1 then floor else 3 end), scope: "all"};
  def normWord: if type == "string" then (ascii_downcase | gsub("[-_]+"; " ") | gsub(" +"; " ")) else null end;
  def clean(s): if s == null then {} else
      (s.interrupt | normWord) as $i
      | {interrupt: (if $i != null and ($i | IN("autopilot", "guided", "plan", "review", "review only")) then $i else null end),
       revise: (s.revise | if type == "string" and . != "" then . else null end),
       maxRounds: (s.maxRounds | if type == "number" and . >= 1 then floor else null end),
       scope: (s.scope | if . == "all" or . == "correctness" then . else null end)}
      | with_entries(select(.value != null)) end;
  def modelName: if . == "claude-opus-5-5" then "Opus 5.5" elif . == "claude-fable-5-1" then "Fable 5.1" else . end;
  def merge($saved; $cli):
      (clean($saved)) as $s
      | reduce fields[] as $f ({effective: {}, sources: {}};
          if $cli[$f] != null then .effective[$f] = $cli[$f] | .sources[$f] = "command line"
          elif $s[$f] != null then .effective[$f] = $s[$f] | .sources[$f] = "saved"
          else .effective[$f] = defaults[$f] | .sources[$f] = "default" end);
'

if [[ "$cmd" == "resolve" ]]; then
    jq -n --argjson saved "$saved" --argjson cli "$cli" --argjson repo "$repo" --arg file "$file" "$MERGE"'
      merge($saved; $cli) as $m
      | ($m.effective.interrupt == "review only") as $reviewOnly
      # A review-only run starts no revise agent: the model and the round cap do not apply, so
      # they are neither asked for nor marked as chosen; scope still shapes the review.
      | (if $reviewOnly then ["interrupt", "scope"] else fields end) as $applies
      | ($saved != null) as $hasSaved
      | (if $hasSaved then [] else [ $applies[] | select($m.sources[.] != "command line") ] end) as $ask
      | def mark($f): if $m.sources[$f] == "command line" then " (command line)" else "" end;
        {
          savedFile: $file,
          saved: $saved,
          defaults: defaults,
          effective: $m.effective,
          sources: $m.sources,
          applies: $applies,
          ask: $ask,
          confirm: $hasSaved,
          summary: ("Run with: " + $m.effective.interrupt + mark("interrupt")
                    + " · " + ($m.effective.revise | modelName) + mark("revise")
                    + " · " + ($m.effective.maxRounds | tostring) + " round" + (if $m.effective.maxRounds == 1 then "" else "s" end) + mark("maxRounds")
                    + " · " + $m.effective.scope + mark("scope"))
        }'
    exit 0
fi

# save: every field is required, since the skill passes what the run uses.
for name in interrupt revise rounds scope; do
    [[ -n "${!name}" ]] || { echo "redline-prefs: save needs --interrupt, --revise, --max-rounds and --scope" >&2; exit 2; }
done
mkdir -p "$root/.claude"
out="$(jq -n --argjson saved "$saved" --argjson cli "$cli" "$MERGE"'
  (clean($saved)) as $s
  | {revise: $cli.revise, maxRounds: $cli.maxRounds, scope: $cli.scope}
  # autopilot and review only are per-run verbs, never saved: the previous interrupt stays.
  + (if ($cli.interrupt | IN("autopilot", "review only")) then (if $s.interrupt != null then {interrupt: $s.interrupt} else {} end) else {interrupt: $cli.interrupt} end)
  | {interrupt: .interrupt, revise: .revise, maxRounds: .maxRounds, scope: .scope} | with_entries(select(.value != null))
  # Every other key of the file (the run markers under runs, #10) is kept.
  | (($saved // {}) | del(.interrupt, .revise, .maxRounds, .scope)) + .')"
tmp="$(mktemp "$root/.claude/.redline.local.XXXXXX")"
printf '%s\n' "$out" | jq '.' >"$tmp"
mv "$tmp" "$file"
jq -c '.' "$file"
