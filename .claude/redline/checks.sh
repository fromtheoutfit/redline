#!/usr/bin/env bash
#
# Redline gate for the Redline plugin's own repository. Runs the runnable part of the
# Verification Gate (.claude/commands/agent-os/shape-spec.md, steps 1 to 6) plus the git-state
# checks, and emits exactly one JSON object on stdout. Progress goes to stderr. Nothing in it is
# new policy; the gate text stays the source.
#
# Usage:
#   checks.sh <snapshot.json>              full run: commands + git block
#   checks.sh --baseline [snapshot.json]   commands only, git block is null
#   checks.sh --git-only <snapshot.json>   git block only, checks is []
#
# The six checks, in the gate's order:
#   syntax    bash -n over each of scripts/*.sh, and hooks/hooks.json parses as JSON (it is the only file
#             under hooks/, so bash -n would be wrong for it)
#   validate  claude plugin validate .  (the plugin and marketplace manifests, agents, skills)
#   guard     tests/guard-test.sh  (every row of tests/guard-cases.tsv; from this checkout it uses
#             the empty repository under ~/.cache/redline/ for the rows that need one)
#   loop      node tests/loop-test.mjs  (the workflow under scripted agents)
#   prefs     tests/prefs-test.sh  (the saved-settings merge rules)
#   gate      tests/gate-test.sh  (the gate parser and the stamp, on the fixtures under
#             tests/gate-fixtures/; its last case checks this file's own stamp)
# No formatter, so there is no recorded "fix" step, and no long-lived-process suite, so
# REDLINE_OCTANE is ignored. Baseline on 2026-10-21: 29 seconds, almost all of it the guard
# table (350 rows at about 60 ms each; the gate test adds a few seconds), so `checker: full`
# is the right mode.
#
# Snapshot: {"pr", "start_sha", "base_ref", "files": [...], "plan_paths": [...]}.
# Allowed changes are files + plan_paths + agent-os/specs/ + agent-os/standards/; anything
# else that changed since start_sha is unexpected.
#
# Exit 0 when every non-recorded check passed and git.unexpected_files and
# git.uncommitted are both empty, else 1. Usage errors exit 2. See README.md for the output
# contract.
#
# The last line of this header is the gate stamp: a hash of the gate's backticked text, written
# by scripts/redline-gate.sh stamp. A launch recomputes it and refuses to run when the gate has
# changed since this file was stamped. After bringing this file up to date with a changed gate,
# restamp it: scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
# redline-gate: .claude/commands/agent-os/shape-spec.md steps 1-6 sha256:1333f0cc80f5f1aa9f40aaae1af355d1734bad943947df8bba8bb8fd14e66ff4

set -euo pipefail

# Files every round may change besides the plan's: none here, nothing is generated.
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
failed=0

log() { printf 'checks.sh: %s\n' "$*" >&2; }

# run_check <name> <recorded:0|1> <command string>
# Runs the command through bash -c so composite commands read as one check.
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
    jq -n \
        --arg name "$name" --arg cmd "$cmd" --argjson exit "$code" \
        --argjson recorded "$([[ $recorded -eq 1 ]] && echo true || echo false)" \
        --rawfile stdout <(tail -n 200 "$work/$name.out") \
        --rawfile stderr <(tail -n 200 "$work/$name.err") \
        '{name: $name, cmd: $cmd, exit: $exit, recorded: $recorded, stdout: $stdout, stderr: $stderr}' \
        >> "$checks_json"
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
    # No formatter: nothing touches a file, so formatter_touched stays empty.

    # 1. Syntax: every script parses, and the hook registration is JSON. bash -n reads only its
    #    first file, so each script gets its own.
    run_check syntax 0 "ls scripts/*.sh | xargs -n1 bash -n && jq -e . hooks/hooks.json >/dev/null"

    # 2. Manifest: the plugin and marketplace manifests, agents, skills and commands validate.
    run_check validate 0 "claude plugin validate ."

    # 3. Guard: every row of the regression table decides as expected.
    run_check guard 0 "tests/guard-test.sh"

    # 4. Loop: the workflow under scripted agents.
    run_check loop 0 "node tests/loop-test.mjs"

    # 5. Prefs: the saved-settings merge rules.
    run_check prefs 0 "tests/prefs-test.sh"

    # 6. Gate stamp: the gate parser and the stamp, ending with this file's own stamp.
    run_check gate 0 "tests/gate-test.sh"
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

jq -n \
    --arg mode "$mode" \
    --argjson ok "$([[ $failed -eq 0 ]] && echo true || echo false)" \
    --argjson checks "$(jq -s . "$checks_json")" \
    --argjson git "$git_json" \
    '{mode: $mode, ok: $ok, checks: $checks, git: $git}'

log "done: $([[ $failed -eq 0 ]] && echo PASS || echo FAIL)"
exit $failed
