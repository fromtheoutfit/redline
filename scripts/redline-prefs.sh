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
#       per-run verbs: the file keeps its previous interrupt (or none). Prints the file's JSON.
#
# Interrupt words: autopilot | guided | plan | review | review only (also review-only). Scope
# words: all | correctness. Exit 2 on a bad argument. Needs jq.

set -euo pipefail

usage() {
    echo "usage: redline-prefs.sh resolve|save <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>]" >&2
    exit 2
}

[[ $# -ge 2 ]] || usage
cmd="$1"
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
  | {interrupt: .interrupt, revise: .revise, maxRounds: .maxRounds, scope: .scope} | with_entries(select(.value != null))')"
tmp="$(mktemp "$root/.claude/.redline.local.XXXXXX")"
printf '%s\n' "$out" | jq '.' >"$tmp"
mv "$tmp" "$file"
jq -c '.' "$file"
