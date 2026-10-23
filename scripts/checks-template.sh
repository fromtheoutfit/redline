#!/usr/bin/env bash
#
# Redline gate template. The normal path is /redline:setup, which writes the repository's
# .claude/redline/checks.json and generates checks.sh from it and this file
# (<plugin>/scripts/redline-setup.sh checks); checks.sh is then regenerated, never hand-edited.
# The fallback is a hand copy: copy it to <repo>/.claude/redline/checks.sh, make it executable,
# and replace each TODO with the runnable part of the repository's own gate (the
# Verification Gate in .claude/commands/agent-os/shape-spec.md, or whatever file it
# points to). Nothing in it should be new policy. The git block and the output contract
# below are Redline's and stay as they are: the workflow reads them.
#
# Every TODO check fails until it is replaced, so an unedited copy never passes the gate.
#
# Usage:
#   checks.sh <snapshot.json>              full run: commands + git block
#   checks.sh --baseline [snapshot.json]   commands only, git block is null
#   checks.sh --git-only <snapshot.json>   git block only, checks is []
#
# Environment:
#   REDLINE_OCTANE=1   set by the workflow when the approved plan touches app/Providers/,
#                      bootstrap/ or config/octane.php; run a long-lived-process suite
#                      here if the repository has one, else ignore it
#
# Snapshot: {"pr", "start_sha", "base_ref", "files": [...], "plan_paths": [...]}.
# Allowed changes are files + plan_paths + agent-os/specs/ + agent-os/standards/ +
# ALWAYS_ALLOWED; anything else that changed since start_sha is unexpected.
#
# Exit 0 when every non-recorded check passed and git.unexpected_files and
# git.uncommitted are both empty, else 1. Usage errors exit 2. See the Redline
# README for the output contract.
#
# The last line of this header is the gate stamp: a hash of the gate's backticked text, written
# by <plugin>/scripts/redline-gate.sh stamp. A launch recomputes it from the gate and refuses to
# run when the two differ, so a gate step added later cannot go unnoticed. After bringing this
# file up to date with a changed gate, restamp it:
# <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
# The line above the stamp names the template version this file was made from; a launch warns
# when the plugin's template is newer.
# redline-template: checks-template.sh v1
# redline-gate: TODO  stamp it: <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh

set -euo pipefail

# TODO: files every round may change besides the plan's (a generated API contract
# the gate regenerates, such as openapi.json). Repository-relative; a
# trailing / makes an entry a prefix.
ALWAYS_ALLOWED=()

mode="full"
snapshot=""
for arg in "$@"; do
    case "$arg" in
        --baseline) mode="baseline" ;;
        --git-only) mode="git-only" ;;
        -h|--help) sed -n '2,/^$/p' "$0" >&2; exit 2 ;;
        -*) echo "checks.sh: unknown flag $arg" >&2; exit 2 ;;
        *) snapshot="$arg" ;;
    esac
done

if [[ "$mode" != "baseline" && -z "$snapshot" ]]; then
    echo "checks.sh: a snapshot file is required unless --baseline is given" >&2
    exit 2
fi
if [[ -n "$snapshot" ]]; then
    snapshot="$(cd "$(dirname "$snapshot")" && pwd)/$(basename "$snapshot")"
    if ! jq -e '.start_sha and (.files | type == "array")' "$snapshot" >/dev/null 2>&1; then
        echo "checks.sh: $snapshot is not a snapshot (needs start_sha and files[])" >&2
        exit 2
    fi
fi

cd "$(git rev-parse --show-toplevel)"

work="$(mktemp -d "${TMPDIR:-/tmp}/redline-checks.XXXXXX")"
trap 'rm -rf "$work"' EXIT

checks_json="$work/checks.jsonl"
: > "$checks_json"
checks_ran="$work/checks.ran.jsonl"
: > "$checks_ran"
failed=0

# Cap what the checks contribute to the JSON so the whole result stays well under the Bash
# tool's inline limit, however many fail. A passing check keeps its last 20 lines (at most
# 16 KB). The failing checks keep up to 200 lines each and share one 16 KB budget, split
# evenly among them in the final pass after every check has run; within a failing check,
# each stream takes at least half of its share when both are long, and bytes one stream
# leaves unused go to the other (#7, R2-1). truncated is true when a line count or a byte
# allotment cut a stream.
keep_passed=20 keep_failed=200 cap=16384 budget=16384

log() { printf 'checks.sh: %s\n' "$*" >&2; }

# run_check <name> <recorded:0|1> <command string>
# Runs the command through bash -c so composite commands read as one check, and records it
# for the final pass, which writes its JSON once every check has run.
run_check() {
    local name="$1" recorded="$2" cmd="$3" code=0
    log "running $name: $cmd"
    set +e
    bash -c "$cmd" >"$work/$name.out" 2>"$work/$name.err" </dev/null
    code=$?
    set -e
    if [[ $code -ne 0 && $recorded -eq 0 ]]; then
        failed=1
        log "$name FAILED (exit $code)"
    else
        log "$name exit $code"
    fi
    jq -n -c \
        --arg name "$name" --arg cmd "$cmd" --argjson exit "$code" \
        --argjson recorded "$([[ $recorded -eq 1 ]] && echo true || echo false)" \
        '{name: $name, cmd: $cmd, exit: $exit, recorded: $recorded}' \
        >> "$checks_ran"
}

# The final pass, run once after every check: writes each recorded check's JSON object to
# $checks_json in run order, its streams cut to the limits described above. Each failing check's
# share of the budget is budget / (number of failing checks), so the sum stays bounded.
emit_checks() {
    local failing share entry name code keep out_cap err_cap out_kept err_kept truncated
    failing=$(jq -s '[.[] | select(.exit != 0)] | length' "$checks_ran")
    share=$budget
    if [[ $failing -gt 0 ]]; then
        share=$((budget / failing))
    fi
    while IFS= read -r entry; do
        name=$(jq -r '.name' <<<"$entry")
        code=$(jq -r '.exit' <<<"$entry")
        if [[ $code -ne 0 ]]; then
            keep=$keep_failed
            out_kept=$(tail -n "$keep" "$work/$name.out" | wc -c)
            err_kept=$(tail -n "$keep" "$work/$name.err" | wc -c)
            err_cap=$((share / 2))
            if [[ $((share - out_kept)) -gt $err_cap ]]; then
                err_cap=$((share - out_kept))
            fi
            if [[ $err_kept -lt $err_cap ]]; then
                err_cap=$((err_kept))
            fi
            out_cap=$((share - err_cap))
        else
            keep=$keep_passed
            out_cap=$cap
            err_cap=$cap
        fi
        truncated=false
        if [[ $(wc -l <"$work/$name.out") -gt $keep || $(wc -l <"$work/$name.err") -gt $keep \
            || $(wc -c <"$work/$name.out") -gt $out_cap || $(wc -c <"$work/$name.err") -gt $err_cap ]]; then
            truncated=true
        fi
        jq -n \
            --argjson check "$entry" --argjson truncated "$truncated" \
            --rawfile stdout <(tail -n "$keep" "$work/$name.out" | tail -c "$out_cap") \
            --rawfile stderr <(tail -n "$keep" "$work/$name.err" | tail -c "$err_cap") \
            '$check + {truncated: $truncated, stdout: $stdout, stderr: $stderr}' \
            >> "$checks_json"
    done < "$checks_ran"
}

# A check that stands for a gate step not filled in yet: it fails, with a line saying so.
todo() {
    printf "echo 'checks.sh: TODO: %s' >&2; exit 1" "$1"
}

# Hash every file that differs from HEAD (modified, added, untracked) so the
# formatter's touches can be told apart from edits that were already there.
tree_state() {
    git status --porcelain=v1 -z --untracked-files=all \
        | tr '\0' '\n' \
        | sed -n 's/^.. //p' \
        | sed 's/^.* -> //' \
        | while IFS= read -r path; do
            if [[ -f "$path" ]]; then
                printf '%s %s\n' "$(git hash-object "$path")" "$path"
            else
                printf 'deleted %s\n' "$path"
            fi
        done | sort
}

# The PR's base as a ref that resolves here (the snapshot's base_ref, else origin/HEAD, else
# origin/main), for a check that diffs the change against its base. Returns 1 when none does.
base_ref() {
    local ref=""
    if [[ -n "$snapshot" ]]; then
        ref="$(jq -r '.base_ref // empty' "$snapshot")"
    fi
    if [[ -z "$ref" ]]; then
        ref="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)"
    fi
    if git rev-parse --verify --quiet "$ref" >/dev/null; then
        echo "$ref"
    elif git rev-parse --verify --quiet "origin/$ref" >/dev/null; then
        echo "origin/$ref"
    else
        log "base ref $ref resolves neither as $ref nor as origin/$ref"
        return 1
    fi
}

formatter_touched="$work/formatter_touched"
: > "$formatter_touched"

if [[ "$mode" != "git-only" ]]; then
    # 1. The repo-wide formatter, if the gate has one. Recorded, never fails the run; the
    #    git block reports any file it touched outside the allowed list. A Laravel
    #    repository might run `composer fix` (Rector, then Pint). With no formatter, delete this step.
    tree_state > "$work/before_fix"
    run_check fix 1 "$(todo 'the formatter command, or delete this step')"
    tree_state > "$work/after_fix"
    comm -13 "$work/before_fix" "$work/after_fix" | cut -d' ' -f2- > "$formatter_touched"

    # 2. The main check: lint, static analysis and the test suite, as the gate runs them.
    #    One `composer check` that runs them all is one check; `php artisan test --compact`,
    #    `vendor/bin/phpstan analyse` and `npm run type-check` run separately are three.
    run_check check 0 "$(todo 'the main check command')"

    # 3. TODO: one run_check per further runnable gate step, each named for what it proves.
    #    For a Laravel application, for example: `snapshots` (the suite created or changed no Pest
    #    snapshot), `migrations` (migrate from an empty scratch database), `openapi` (the
    #    committed contract matches a fresh export), `env` (every env() the change adds is in
    #    .env.example, diffed from base_ref above). Keep each command a plain pipeline.

    # 4. Long-lived processes, only when the workflow asks for them.
    if [[ "${REDLINE_OCTANE:-0}" == "1" ]]; then
        run_check octane 0 "$(todo 'the long-lived-process suite, or delete this step')"
    fi
fi

git_json="null"
if [[ "$mode" != "baseline" ]]; then
    start_sha="$(jq -r '.start_sha' "$snapshot")"
    if ! git cat-file -e "$start_sha^{commit}" 2>/dev/null; then
        log "start_sha $start_sha is not a commit in this repository"
        exit 2
    fi
    log "git block against $start_sha"

    # Everything that differs between the start SHA and the working tree,
    # committed or not, plus untracked files.
    {
        git diff --name-only "$start_sha"
        git ls-files --others --exclude-standard
    } | sort -u > "$work/changed"

    # Allowed = the PR's files + every path the approved plan names (plan_paths, a
    # trailing slash means a prefix) + what every round may touch. "Unexpected" means
    # outside the approved plan.
    {
        jq -r '.files[]' "$snapshot"
        jq -r '.plan_paths // [] | .[]' "$snapshot"
        printf '%s\n' 'agent-os/specs/' 'agent-os/standards/' ${ALWAYS_ALLOWED[@]+"${ALWAYS_ALLOWED[@]}"}
    } | sed 's#^\./##' | grep -v '^$' | sort -u > "$work/allowed"

    is_allowed() {
        local path="$1" entry
        while IFS= read -r entry; do
            if [[ "$entry" == */ ]]; then
                [[ "$path" == "$entry"* ]] && return 0
            elif [[ "$path" == "$entry" ]]; then
                return 0
            fi
        done < "$work/allowed"
        return 1
    }

    outside_allowed() {
        local path
        while IFS= read -r path; do
            is_allowed "$path" || printf '%s\n' "$path"
        done
    }

    outside_allowed < "$work/changed" > "$work/unexpected"

    # Work left uncommitted outside agent-os/specs/ (the round's reply files and snapshot live
    # there by design): the checks above ran against it, and the push would leave it behind.
    tree_state | cut -d' ' -f2- | grep -v '^agent-os/specs/' | sort -u > "$work/uncommitted" || true

    git log --format='%H%x1f%s' "$start_sha..HEAD" > "$work/commits" || true

    diff_lines="$(git diff --numstat "$start_sha" | awk '{ a += ($1 == "-" ? 0 : $1) + ($2 == "-" ? 0 : $2) } END { print a + 0 }')"
    untracked_lines="$(git ls-files --others --exclude-standard -z | xargs -0 cat 2>/dev/null | wc -l | tr -d ' ')"
    diff_lines=$((diff_lines + untracked_lines))

    if [[ "$mode" == "git-only" ]]; then
        formatter_json="null"
    else
        formatter_json="$(outside_allowed < "$formatter_touched" | jq -R . | jq -s .)"
    fi

    git_json="$(jq -n \
        --arg start_sha "$start_sha" \
        --argjson changed "$(jq -R . "$work/changed" | jq -s .)" \
        --argjson unexpected "$(jq -R . "$work/unexpected" | jq -s .)" \
        --argjson uncommitted "$(jq -R . "$work/uncommitted" | jq -s .)" \
        --argjson commits "$(awk -F'\x1f' '{ printf "%s\x1f%s\n", $1, $2 }' "$work/commits" | jq -R 'split("\u001f") | {sha: .[0], message: .[1]}' | jq -s .)" \
        --argjson diff_lines "$diff_lines" \
        --argjson formatter "$formatter_json" \
        --argjson allowed "$(jq -R . "$work/allowed" | jq -s .)" \
        '{start_sha: $start_sha, allowed: $allowed, changed_files: $changed, unexpected_files: $unexpected, uncommitted: $uncommitted, commits: $commits, diff_lines: $diff_lines, formatter_touched_outside_pr: $formatter}')"

    if [[ -s "$work/unexpected" ]]; then
        failed=1
        log "unexpected files changed: $(tr '\n' ' ' < "$work/unexpected")"
    fi
    if [[ -s "$work/uncommitted" ]]; then
        failed=1
        log "uncommitted changes outside agent-os/specs/: $(tr '\n' ' ' < "$work/uncommitted")"
    fi
fi

emit_checks

jq -n \
    --arg mode "$mode" \
    --argjson ok "$([[ $failed -eq 0 ]] && echo true || echo false)" \
    --argjson checks "$(jq -s . "$checks_json")" \
    --argjson git "$git_json" \
    '{mode: $mode, ok: $ok, checks: $checks, git: $git}'

log "done: $([[ $failed -eq 0 ]] && echo PASS || echo FAIL)"
exit $failed
