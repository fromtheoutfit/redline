#!/usr/bin/env bash
#
# redline-prefs.sh: the saved launch preferences of /redline:redline, one file per person per
# repository at <repoRoot>/.claude/redline.local.json (ignored by git; the guard refuses it for
# every Redline role). It holds six settings: interrupt (the dial), revise (the revise model id),
# maxRounds, scope, and the two for deferred items (#95): deferAt (when their drafted issues are
# raised with the person: round or end) and deferTo (where a draft goes: github, spec or print).
# The skill calls this script so the merge rules live in one tested place.
#
#   redline-prefs.sh resolve <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>]
#                                       [--defer-at <word>] [--defer-to <word>]
#       Merge: command line over the saved file over the defaults (guided, claude-opus-5-5,
#       redline.json's maxRounds or 3, all, round, redline.json's deferTo or github). Prints JSON:
#       the saved file (null when absent), the defaults, what redline.json supplies of them
#       (repository: {maxRounds, deferTo}, null for a key it does not set), the effective settings,
#       where each came from (command line, saved or default), the fields that apply to the run
#       (review only: the dial and the scope; autopilot: every field but deferAt, since it files
#       each draft in its round and asks nothing), which fields the skill must ask for, whether to
#       show the one-question confirm (a saved file exists), and the confirm's summary line.
#       ask, with no saved file, is every field that applies and is not on the command line. With
#       a saved file the confirm covers the first four, so ask holds only deferAt and deferTo, each
#       when it applies and neither the command line nor the file gives it: a file saved before
#       these two existed, or by runs they did not apply to, is asked for them once. The summary
#       names the first four, then each deferral setting that applies and is not asked. A deferTo
#       in redline.json that is not one of the three words is refused (exit 2): it says where an
#       issue is opened, so it is never guessed.
#   redline-prefs.sh save <repoRoot> --interrupt <word> --revise <model> --max-rounds <n> --scope <word>
#                                    --defer-at <word> --defer-to <word>
#       Write what the run uses as the new saved set, except that autopilot and review only are
#       per-run verbs: the file keeps its previous interrupt (or none). A deferral setting that
#       did not apply to the run (both under review only, deferAt under autopilot) is not written
#       either: the file keeps its previous value, or none, so the next run it applies to is
#       asked. Every other key of the file (the run markers under runs) is kept. Prints the
#       file's JSON.
#
# The same file holds, under runs, one marker per PR for a run that stopped (a hand-off, the
# review dial, an error, a run the harness stopped), so the next /redline:redline <pr> can offer
# to resume it, from the session that launched it (#10):
#
#   redline-prefs.sh run save <repoRoot> <pr> --run-id <id> [--session <id>] [--record <file>]
#       Write the marker from the harness's own record of the run:
#       <config>/projects/*/<session>/workflows/<runId>.json, <config> being the directory
#       CLAUDE_CONFIG_DIR names when it is set and holds the record, else ~/.claude (#137, R1-2), or
#       --record; the entry's record is the file it read, whose args and result it copies. The
#       session is --session, else CLAUDE_CODE_SESSION_ID (set in every Bash tool subprocess). kind
#       is error, handoff or reviewed from the result's status, or stopped when the record has no
#       result; any other status leaves no marker (exit 2). An error whose resumeFrom is null cannot
#       be resumed: exit 1 with the folders to commit or remove, and no marker. specFolders are the
#       result's, plus the start snapshot's folder, from the result's snapshotStart or, without
#       one (a stopped run has no result), from args.snapshotPath. ownCheck is the result's:
#       true when the stop was the workflow's own check of what an agent returned, which needs
#       no hand fix (#116), false for any other stop and for a result that holds none. Prints
#       the entry:
#       {pr, kind, runId, session, record, head, branch, stage, label, attempt, error, ownCheck,
#       round, handoffKind, specFolders, args}.
#   redline-prefs.sh run read <repoRoot> <pr>
#       Prints the entry, or null. Exit 0 either way.
#   redline-prefs.sh run check <repoRoot> <pr> --plugin <dir> [--session <id>]
#       Whether the run can be resumed from here, as {ok, reason, line, marker, head, hand, untracked}:
#       the first failing reason wins, in this order: none (no marker), session (another session
#       launched it; the line gives claude --resume <id>), version (#135: the version the marker's
#       args.launch records is not the one in --plugin's .claude-plugin/plugin.json, the copy this
#       session loaded, or the marker holds no args.launch, written by a build before 0.5.1; the line
#       names both versions, says nothing on GitHub is lost and to start fresh; a marker with no
#       launch is named from args.pluginRoot's manifest when that root is an installed release,
#       under plugins/cache/, else as a build before 0.5.1), branch (not the run's branch),
#       head-moved (HEAD is not the marker's and not on top of it, the marker's kind is not error
#       and HEAD moved at all, or the commits on top touch a path outside .claude/), plugin (the repository is --plugin's directory and HEAD moved: a
#       plugin fix changes what runs, so start fresh), untracked (an untracked or modified path
#       outside the run's spec folders: the listed ones, and every folder the run's launch stamp
#       names for this PR). Hand commits are accepted only on an error marker, since only an error
#       resume carries them into the workflow. hand lists the commits and paths on top of the marker's
#       head, plus the hand list the marker's own label already carries in its args.resume,
#       which the workflow excuses. Exit 0 ok, 1 refused, 2 with no --plugin or a --plugin whose
#       manifest holds no version.
#   redline-prefs.sh run drift <repoRoot> <pr> --plugin <dir>
#       Which script a relaunch runs, and which agent files changed since the run launched (#81,
#       #135), as {self, launch, scriptPath, workflow, agents, drift, line}, on every repository.
#       self is true when the repository is --plugin's directory. First the version: when the
#       marker's args.launch records another version than --plugin's manifest, or none, launch is
#       refuse and line is run check's version line. Then the copy (#137, R1-3): when
#       args.pluginRoot is another directory than --plugin (a checkout and a release, or two
#       checkouts, at one version), launch is refuse when the two copies' agent files differ
#       (#137, R2-1: an agent file is a *.md file under agents/ whose path has no part that
#       starts with a dot, so a .DS_Store or an editor's backup there is none; the two lists are
#       compared by path, then each pair by its bytes, and a copy with no agents/ has none) or
#       args.pluginRoot is no longer a directory, since the launch's script would run under
#       another build's agents; line names both copies. A marker with no args.pluginRoot skips
#       this. Then the script:
#       the live file is --plugin's workflows/redline-loop.js, since a checkout loaded in place
#       can change while it reviews any repository, and the pin is the script path in the
#       marker's record: the copy the
#       harness persisted when the run was launched by name, which holds what the launch ran (in a
#       live session, the copy it loaded, even after the file on disk changed). launch is name
#       while the live file equals the pin (relaunch as before), scriptPath when it differs
#       (relaunch from the pin, given as scriptPath), and, when the record's path is the live file
#       itself (a launch by the scriptPath fallback leaves no pin), name while the live file's git
#       blob id is args.launch.workflow and refuse when it is not; line then names the file and
#       says to finish with a fresh run. agents, on the plugin's own repository only (empty
#       anywhere else), lists every agent file (by the same rule) that differs from the launch
#       commit (args.startSha), uncommitted and untracked ones included; the run goes on, and
#       line is the sentence the skill says. drift is what the skill
#       passes as args.drift ({workflow, pinned, agents}), null when the workflow file is as
#       launched and drift's agents is empty. drift's agents is agents at a hand-off or a reviewed
#       stop; on an error or stopped marker it is the list the marker's own args.drift passed ([]
#       when none), since that resume can rerun Finish from a step after the handoff comment
#       posted, and the comment, the one prompt that names the list, must not change (#91, R1-1).
#       Exit 0, 1 refused, 2 with no --plugin or a --plugin whose manifest holds no version, no
#       marker, or, on the plugin's own repository, no start commit.
#   redline-prefs.sh run clear <repoRoot> <pr>
#       Removes the entry. Prints {cleared: true|false}.
#
# Interrupt words: autopilot | guided | plan | review | review only (also review-only). Scope
# words: all | correctness. Defer-at words: round | end. Defer-to words: github | spec | print.
# Exit 2 on a bad argument. Needs jq, and git for the run markers.

set -euo pipefail

usage() {
    echo "usage: redline-prefs.sh resolve|save <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>] [--defer-at <word>] [--defer-to <word>]" >&2
    exit 2
}

[[ $# -ge 2 ]] || usage
cmd="$1"

# ---------------------------------------------------------------------------
# The run markers (#10).
# ---------------------------------------------------------------------------

run_usage() {
    echo "usage: redline-prefs.sh run save|read|check|drift|clear <repoRoot> <pr> [--run-id <id>] [--session <id>] [--record <file>] [--plugin <dir>] (check and drift need --plugin)" >&2
    exit 2
}

realdir() { (cd "$1" 2>/dev/null && pwd -P); }

# The agent files of a copy (#137, R2-1): a *.md file under agents/ whose path has no part that
# starts with a dot. The roles are the Markdown files under agents/, and a .DS_Store, an editor's
# backup, an AppleDouble ._ file or a scratch note there is no role. A *.md file in a subdirectory
# counts, as the comparison it replaces counted it.
# agent_paths: the paths on stdin, one a line, that are agent files.
agent_paths() {
    local p
    while IFS= read -r p; do
        case "/$p" in */.*) continue ;; esac
        case "$p" in *.md) printf '%s\n' "$p" ;; esac
    done
    return 0
}
# agent_list <copy>: the copy's agent files as paths from its root (agents/...), sorted; nothing
# when it has no agents/.
agent_list() {
    [[ -d "$1/agents" ]] || return 0
    (cd "$1" 2>/dev/null && { find agents -type f 2>/dev/null || true; } | agent_paths | LC_ALL=C sort) || true
    return 0
}

if [[ "$cmd" == "run" ]]; then
    [[ $# -ge 4 ]] || run_usage
    sub="$2" root="$3" pr="$4"
    shift 4
    case "$sub" in save|read|check|drift|clear) ;; *) run_usage ;; esac
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

    # The version a run launched under against the copy this session loaded (#135), shared by check
    # and drift: prints the refusal line when they differ, nothing when they agree, and returns 2 when
    # --plugin's manifest holds no version. A marker with no args.launch was written by a build before
    # 0.5.1, the first that records it. Its version is named from args.pluginRoot's manifest when that
    # root is an installed release, since a cache version directory never changes, and otherwise only
    # as a build before 0.5.1, since a checkout's manifest may have moved on since the launch.
    version_line() {
        local now launched proot pv folders
        now="$(jq -r '.version // ""' "$plugin/.claude-plugin/plugin.json" 2>/dev/null || true)"
        [[ -n "$now" ]] || { echo "redline-prefs: $plugin/.claude-plugin/plugin.json holds no version" >&2; return 2; }
        launched="$(jq -r '.args.launch.version // ""' <<<"$entry")"
        [[ "$launched" != "$now" ]] || return 0
        if [[ -n "$launched" ]]; then
            launched="Redline $launched"
        else
            proot="$(jq -r '.args.pluginRoot // ""' <<<"$entry")" pv=""
            case "$proot" in
                */plugins/cache/*) pv="$(jq -r '.version // ""' "$proot/.claude-plugin/plugin.json" 2>/dev/null || true)" ;;
            esac
            if [[ -n "$pv" ]]; then launched="Redline $pv"; else launched="a Redline build before 0.5.1"; fi
        fi
        folders="$(jq -r '[.specFolders // [] | .[]] | join(", ")' <<<"$entry")"
        echo "The run on #$pr started under $launched, and this session loads Redline $now: a relaunch under another version would rerun steps already recorded. Nothing on GitHub is lost; start fresh after committing or removing ${folders:-its spec folders}"
    }
    if [[ "$sub" == "check" || "$sub" == "drift" ]]; then
        [[ -n "$plugin" && -d "$plugin" ]] || { echo "redline-prefs: run $sub needs --plugin <the root of the Redline copy this session loaded>" >&2; exit 2; }
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
            # The session's config directory holds the record: the one CLAUDE_CONFIG_DIR names when
            # it is set, else ~/.claude. Where Claude Code keeps it under the variable was not
            # measured, so both are searched, in that order, and the first that holds any match is
            # the one read (#137, R1-2).
            dirs=()
            if [[ -n "${CLAUDE_CONFIG_DIR:-}" ]]; then
                dirs+=("${CLAUDE_CONFIG_DIR%/}")
            fi
            dirs+=("$HOME/.claude")
            searched="" matches=()
            shopt -s nullglob
            for dir in "${dirs[@]}"; do
                searched="${searched:+$searched or }$dir/projects/*/$session/workflows/$runid.json"
                matches=("$dir"/projects/*/"$session"/workflows/"$runid".json)
                [[ ${#matches[@]} -eq 0 ]] || break
            done
            shopt -u nullglob
            if [[ ${#matches[@]} -ne 1 ]]; then
                echo "redline-prefs: ${#matches[@]} run records match $searched; pass --record <file>" >&2
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
               ownCheck: ($r.ownCheck == true),
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

    # drift (#81, #135): which script a relaunch runs, and which agent files changed since launch.
    if [[ "$sub" == "drift" ]]; then
        wf="workflows/redline-loop.js"
        [[ "$entry" != "null" ]] || { echo "redline-prefs: no stopped run is recorded for #$pr, so the script it launched with is unknown" >&2; exit 2; }
        self=false
        [[ "$(realdir "$plugin")" == "$(realdir "$root")" ]] && self=true
        # Another version first, on every repository: nothing this session's copy holds is the
        # launch's, so neither the pin nor the live file is read.
        vline="$(version_line)" || exit $?
        if [[ -n "$vline" ]]; then
            jq -n --argjson self "$self" --arg wf "$wf" --arg line "$vline" \
                '{self: $self, launch: "refuse", scriptPath: "", workflow: $wf, agents: [], drift: null, line: $line}'
            exit 1
        fi
        # Then the copy (#137, R1-3). A checkout and a release at one version are two builds, and a
        # relaunch under the session's copy would run the launch's script, or the name, under that
        # copy's agents, which mix with the replayed steps' (the #135 spec's m4-agents-pin-reopen).
        # So when the session loads another copy than the one the run launched from, their agent
        # files must agree (agent_list, #137, R2-1): a copy with no agents/ has none, and a launch
        # copy that is gone cannot be compared. A marker with no args.pluginRoot skips this.
        lroot="$(jq -r '.args.pluginRoot // ""' <<<"$entry")"
        if [[ -n "$lroot" ]]; then
            lreal=""
            if [[ -d "$lroot" ]]; then
                lreal="$(realdir "$lroot")" || lreal=""
            fi
            if [[ "$lreal" != "$(realdir "$plugin")" ]]; then
                differ=false
                if [[ -z "$lreal" ]]; then
                    differ=true
                else
                    lagents="$(agent_list "$lroot")"
                    pagents="$(agent_list "$plugin")"
                    if [[ "$lagents" != "$pagents" ]]; then
                        differ=true
                    elif [[ -n "$lagents" ]]; then
                        while IFS= read -r f; do
                            cmp -s "$lroot/$f" "$plugin/$f" || { differ=true; break; }
                        done <<<"$lagents"
                    fi
                fi
                if [[ "$differ" == true ]]; then
                    now="$(jq -r '.version // ""' "$plugin/.claude-plugin/plugin.json")"
                    folders="$(jq -r '[.specFolders // [] | .[]] | join(", ")' <<<"$entry")"
                    cline="The run on #$pr started from the Redline $now copy at $lroot, and this session loads Redline $now from $plugin, another copy whose agent files differ from that one's or cannot be compared with it: a relaunch would run the rest of the run under another build's agents. Nothing on GitHub is lost; start fresh after committing or removing ${folders:-its spec folders}"
                    jq -n --argjson self "$self" --arg wf "$wf" --arg line "$cline" \
                        '{self: $self, launch: "refuse", scriptPath: "", workflow: $wf, agents: [], drift: null, line: $line}'
                    exit 1
                fi
            fi
        fi
        start=""
        if [[ "$self" == true ]]; then
            start="$(jq -r '.args.startSha // ""' <<<"$entry")"
            if [[ -z "$start" ]] || ! git -C "$root" cat-file -e "$start^{commit}" 2>/dev/null; then
                echo "redline-prefs: the run marker for #$pr holds no start commit this repository knows (args.startSha: '${start}')" >&2
                exit 2
            fi
        fi
        # The live file is the session's copy's, wherever it reviews: a checkout loaded in place can
        # change during a run on any repository. The pin is the script path the harness recorded for
        # the run, unless it is the live file itself (a launch by the scriptPath fallback ran the file,
        # so nothing was persisted). The pin holds what the launch ran, which in a live session is the
        # copy it loaded even after the file on disk changed, so a pin is compared with the live file;
        # with no pin, the launch read the file from disk, whose blob args.launch recorded.
        live="$plugin/$wf"
        mrecord="$(jq -r '.record // ""' <<<"$entry")"
        recorded=""
        [[ -n "$mrecord" && -f "$mrecord" ]] && recorded="$(jq -r '.scriptPath // ""' "$mrecord" 2>/dev/null || true)"
        pin=""
        if [[ -n "$recorded" && -f "$recorded" ]]; then
            if [[ "$(realdir "$(dirname "$recorded")")/$(basename "$recorded")" != "$(realdir "$plugin")/$wf" ]]; then
                pin="$recorded"
            fi
        fi
        changed=false
        if [[ -n "$pin" ]]; then
            cmp -s "$pin" "$live" || changed=true
        else
            [[ "$(git -C "$root" hash-object --no-filters "$live")" == "$(jq -r '.args.launch.workflow // ""' <<<"$entry")" ]] || changed=true
        fi
        # Agent files: only the plugin's own repository lists them (#81), and only agent files
        # (agent_paths, #137, R2-1).
        agents='[]'
        if [[ "$self" == true ]]; then
            agents="$({ git -C "$root" diff --name-only "$start" -- agents/; git -C "$root" ls-files --others --exclude-standard -- agents/; } | agent_paths | sort -u | jq -R . | jq -sc .)"
        fi
        # The agent list drift passes (#91, R1-1). The handoff comment is the one prompt that names
        # it, and an error or stopped resume can rerun Finish from a step after the comment posted,
        # so on those markers drift keeps the list the marker's own args passed; a hand-off or a
        # reviewed stop, both before Finish, reads it afresh (held is null there).
        held="$(jq -c 'if .kind == "error" or .kind == "stopped" then (.args.drift | .agents? // []) else null end' <<<"$entry")"
        jq -n --argjson self "$self" --arg wf "$wf" --arg pin "$pin" --argjson changed "$changed" --argjson agents "$agents" --argjson held "$held" --arg pr "$pr" --arg q "'" '
            (if $changed then (if $pin != "" then "scriptPath" else "refuse" end) else "name" end) as $launch
            | ($held // $agents) as $passed
            | {self: $self, launch: $launch, scriptPath: (if $launch == "scriptPath" then $pin else "" end), workflow: $wf, agents: $agents,
               drift: (if $changed or ($passed | length) > 0 then {workflow: (if $changed then $wf else "" end), pinned: ($pin != ""), agents: $passed} else null end),
               line: (if $launch == "refuse"
                      then "\($wf) changed since this run launched, and the launch ran from the file itself, so no pinned copy exists; a relaunch would rerun recorded rounds under the edited script. Finish with a fresh run: /redline:redline \($pr)"
                      elif ($agents | length) > 0
                      then "Agent files changed since this run launched (\($agents | map("`" + . + "`") | join(", "))): this run\($q)s remaining rounds may run under them, while the workflow\($q)s own prompts are the launch\($q)s."
                      else "" end)}'
        [[ "$changed" == true && -z "$pin" ]] && exit 1
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
    vline="$(version_line)" || exit $?
    [[ -z "$vline" ]] || refuse version "$vline"
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
        if [[ "$(realdir "$plugin")" == "$(realdir "$root")" ]]; then
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

interrupt="" revise="" rounds="" scope="" defer_at="" defer_to=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --interrupt) interrupt="${2:-}"; shift 2 ;;
        --revise) revise="${2:-}"; shift 2 ;;
        --max-rounds) rounds="${2:-}"; shift 2 ;;
        --scope) scope="${2:-}"; shift 2 ;;
        --defer-at) defer_at="${2:-}"; shift 2 ;;
        --defer-to) defer_to="${2:-}"; shift 2 ;;
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
if [[ -n "$defer_at" ]]; then
    defer_at="$(norm "$defer_at")"
    case "$defer_at" in round|end) ;; *) echo "redline-prefs: defer at must be round or end; got '$defer_at'" >&2; exit 2 ;; esac
fi
if [[ -n "$defer_to" ]]; then
    defer_to="$(norm "$defer_to")"
    case "$defer_to" in github|spec|print) ;; *) echo "redline-prefs: defer to must be github, spec or print; got '$defer_to'" >&2; exit 2 ;; esac
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
cli="$(jq -cn --arg i "$interrupt" --arg r "$revise" --arg n "$rounds" --arg s "$scope" --arg a "$defer_at" --arg t "$defer_to" '
    {interrupt: (if $i == "" then null else $i end),
     revise: (if $r == "" then null else $r end),
     maxRounds: (if $n == "" then null else ($n | tonumber) end),
     scope: (if $s == "" then null else $s end),
     deferAt: (if $a == "" then null else $a end),
     deferTo: (if $t == "" then null else $t end)}')"

# The merge, as one jq program shared by both commands.
MERGE='
  def fields: ["interrupt", "revise", "maxRounds", "scope", "deferAt", "deferTo"];
  def deferToWord: if . == "github" or . == "spec" or . == "print" then . else null end;
  # What redline.json supplies as a default: the round cap, and where a deferred draft goes (#95).
  def repository: {maxRounds: (($repo.maxRounds? // null) | if type == "number" and . >= 1 then floor else null end),
                   deferTo: (($repo.deferTo? // null) | deferToWord)};
  def defaults: {interrupt: "guided", revise: "claude-opus-5-5", maxRounds: (repository.maxRounds // 3), scope: "all",
                 deferAt: "round", deferTo: (repository.deferTo // "github")};
  def normWord: if type == "string" then (ascii_downcase | gsub("[-_]+"; " ") | gsub(" +"; " ")) else null end;
  def clean(s): if s == null then {} else
      (s.interrupt | normWord) as $i
      | {interrupt: (if $i != null and ($i | IN("autopilot", "guided", "plan", "review", "review only")) then $i else null end),
       revise: (s.revise | if type == "string" and . != "" then . else null end),
       maxRounds: (s.maxRounds | if type == "number" and . >= 1 then floor else null end),
       scope: (s.scope | if . == "all" or . == "correctness" then . else null end),
       deferAt: (s.deferAt | if . == "round" or . == "end" then . else null end),
       deferTo: (s.deferTo | deferToWord)}
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
    # redline.json's deferTo says where an issue is opened, so a word that is not one of the three
    # stops the launch here instead of falling back to GitHub (#95). It tests the word with the
    # merge's own `deferToWord`, so the two read one list (#97, R1-5).
    bad_defer="$(jq -rn --argjson repo "$repo" "$MERGE"'$repo | if type == "object" and has("deferTo") and ((.deferTo | deferToWord) == null) then (.deferTo | tojson) else "" end')"
    if [[ -n "$bad_defer" ]]; then
        echo "redline-prefs: deferTo in $config must be github, spec or print; got $bad_defer" >&2
        exit 2
    fi
    jq -n --argjson saved "$saved" --argjson cli "$cli" --argjson repo "$repo" --arg file "$file" "$MERGE"'
      merge($saved; $cli) as $m
      | $m.effective.interrupt as $dial
      # A review-only run starts no revise agent: the model and the round cap do not apply, so
      # they are neither asked for nor marked as chosen; scope still shapes the review. It defers
      # nothing either, so neither deferral setting applies. Autopilot files each draft in its
      # round and asks nothing, so when the drafts are raised does not apply to it (#95).
      | (if $dial == "review only" then ["interrupt", "scope"]
         elif $dial == "autopilot" then fields - ["deferAt"]
         else fields end) as $applies
      | ($saved != null) as $hasSaved
      # With a saved file the confirm covers the first four, a default included, as before the
      # deferral settings existed; those two are asked when neither the command line nor the file
      # gives them, so a file saved before them is asked once.
      | (if $hasSaved then [ $applies[] | select(. == "deferAt" or . == "deferTo") | select($m.sources[.] == "default") ]
         else [ $applies[] | select($m.sources[.] != "command line") ] end) as $ask
      | def mark($f): if $m.sources[$f] == "command line" then " (command line)" else "" end;
        def shown($f): ($applies | index($f)) != null and ($ask | index($f)) == null;
        def atWords: if . == "end" then "deferred at the end" else "deferred each round" end;
        def toWords: if . == "spec" then "drafts to the spec folder" elif . == "print" then "drafts printed" else "drafts to GitHub" end;
        {
          savedFile: $file,
          saved: $saved,
          defaults: defaults,
          repository: repository,
          effective: $m.effective,
          sources: $m.sources,
          applies: $applies,
          ask: $ask,
          confirm: $hasSaved,
          summary: ("Run with: " + $m.effective.interrupt + mark("interrupt")
                    + " · " + ($m.effective.revise | modelName) + mark("revise")
                    + " · " + ($m.effective.maxRounds | tostring) + " round" + (if $m.effective.maxRounds == 1 then "" else "s" end) + mark("maxRounds")
                    + " · " + $m.effective.scope + mark("scope")
                    + (if shown("deferAt") then " · " + ($m.effective.deferAt | atWords) + mark("deferAt") else "" end)
                    + (if shown("deferTo") then " · " + ($m.effective.deferTo | toWords) + mark("deferTo") else "" end))
        }'
    exit 0
fi

# save: every field is required, since the skill passes what the run uses.
for name in interrupt revise rounds scope defer_at defer_to; do
    [[ -n "${!name}" ]] || { echo "redline-prefs: save needs --interrupt, --revise, --max-rounds, --scope, --defer-at and --defer-to" >&2; exit 2; }
done
mkdir -p "$root/.claude"
out="$(jq -n --argjson saved "$saved" --argjson cli "$cli" --argjson repo "$repo" "$MERGE"'
  (clean($saved)) as $s
  | {revise: $cli.revise, maxRounds: $cli.maxRounds, scope: $cli.scope}
  # autopilot and review only are per-run verbs, never saved: the previous interrupt stays.
  + (if ($cli.interrupt | IN("autopilot", "review only")) then (if $s.interrupt != null then {interrupt: $s.interrupt} else {} end) else {interrupt: $cli.interrupt} end)
  # A deferral setting the run did not settle is not written (#95): neither applies under review
  # only, and autopilot never asks when. The previous value stays, or none, so the next run the
  # setting applies to is asked for it.
  + {deferAt: (if ($cli.interrupt | IN("autopilot", "review only")) then $s.deferAt else $cli.deferAt end),
     deferTo: (if $cli.interrupt == "review only" then $s.deferTo else $cli.deferTo end)}
  | {interrupt: .interrupt, revise: .revise, maxRounds: .maxRounds, scope: .scope, deferAt: .deferAt, deferTo: .deferTo} | with_entries(select(.value != null))
  # Every other key of the file (the run markers under runs, #10) is kept.
  | (($saved // {}) | del(.interrupt, .revise, .maxRounds, .scope, .deferAt, .deferTo)) + .')"
tmp="$(mktemp "$root/.claude/.redline.local.XXXXXX")"
printf '%s\n' "$out" | jq '.' >"$tmp"
mv "$tmp" "$file"
jq -c '.' "$file"
