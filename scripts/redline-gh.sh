#!/usr/bin/env bash
#
# Redline's one door to GitHub. Every body comes from a file, never inline text.
# Authenticated as whoever ran `gh auth login`. Any gh failure prints gh's own
# error to stderr and exits non-zero; nothing here retries.
#
# Read-only:
#   pr <n>                         PR facts as JSON
#   diff <n>                       the PR diff
#   pr-comments <n>                issue comments and reviews on the PR
#   issues-search <query>          open issues matching the query
#   review-comments <n>            every inline review comment on the PR as JSON:
#                                  [{id, path, line, side, body, in_reply_to_id, pull_request_review_id}]
#   has-review <n> <round>         exit 0 if a review body starts "Redline round <round>", 1 if none, 2 on error
#   files <n>                      the PR's changed file paths as a JSON array
#   login                          the gh login Redline posts as
#   place <n> <json-file>          the post-review file as it would be posted: comments off the
#                                  diff's hunks moved into the body under "Not placed inline",
#                                  with a `moved` list. Nothing is posted
#
# Writes (GitHub agent only):
#   post-review <n> <json-file>    {body, comments:[{path,line,side,body}]} posted with event COMMENT
#                                  after `place` (a comment GitHub could not anchor would fail the
#                                  whole post with a 422 that names no line); prints
#                                  {review_id, html_url, comments:[{id,path,line,side,body}], moved}
#   reply <n> <comment-id> <file>  reply in an inline comment's thread
#   comment <n> <file>             issue comment on the PR
#   request-review <n> <user>      add a reviewer
#   issue-create <title> <file>    open an issue; prints its URL
#   update <n> <title|-> <file> [<copy>]
#                                  edit the PR title and body, with backup and read-back;
#                                  "-" keeps the current title. Backup dir: $REDLINE_BACKUP_DIR
#                                  (default $TMPDIR/redline-backups). <copy> also gets the backup,
#                                  unless it already exists (a re-run keeps the first, older body)

set -euo pipefail

usage() { sed -n '2,34p' "$0" >&2; exit 2; }

need_file() {
    if [[ ! -f "$1" ]]; then
        echo "redline-gh.sh: $2 must be a file path, got: $1" >&2
        exit 2
    fi
}

need_int() {
    if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        echo "redline-gh.sh: $2 must be a number, got: $1" >&2
        exit 2
    fi
}

# Every position an inline comment may sit on: the added, removed and context lines of the PR
# diff's hunks, one per line as "path<TAB>side<TAB>line". GitHub resolves a comment on `line` of
# `side` (RIGHT: the new file, LEFT: the old) only inside a hunk; a context line is on both sides.
diff_positions() {
    gh pr diff "$1" | awk '
        /^diff --git / { path = ""; inhunk = 0; next }
        !inhunk && /^\+\+\+ / { path = ($2 == "/dev/null") ? "" : substr($2, 3); next }
        !inhunk && /^--- / { next }
        /^@@ / {
            split($2, old, ","); split($3, new, ",")
            oldline = substr(old[1], 2) + 0; newline = substr(new[1], 2) + 0
            inhunk = 1; next
        }
        !inhunk || path == "" { next }
        /^\\ No newline/ { next }
        /^\+/ { print path "\tRIGHT\t" newline; newline++; next }
        /^-/ { print path "\tLEFT\t" oldline; oldline++; next }
        { print path "\tRIGHT\t" newline; print path "\tLEFT\t" oldline; newline++; oldline++ }
    '
}

# The review file with every comment GitHub could not anchor moved into the body: prints
# {body, comments, moved}. `side` defaults to RIGHT, as post-review sends it.
place_comments() {
    local positions
    positions="$(diff_positions "$1" | jq -R -s 'split("\n") | map(select(length > 0))')"
    jq --argjson positions "$positions" '
        ($positions | map({key: ., value: true}) | from_entries) as $ok
        | def key: .path + "\t" + (.side // "RIGHT") + "\t" + (.line | tostring);
        (.comments | map(select($ok[key] == true))) as $placed
        | (.comments | map(select($ok[key] != true))) as $moved
        | {
            body: (if ($moved | length) == 0 then .body
                   else .body + "\n\n### Not placed inline\n\n" + ($moved | map("`" + .path + ":" + (.line | tostring) + "`\n\n" + .body) | join("\n\n")) end),
            comments: ($placed | map(.side = (.side // "RIGHT"))),
            moved: ($moved | map({path, line, side: (.side // "RIGHT")}))
          }' "$2"
}

cd "$(git rev-parse --show-toplevel)"

cmd="${1:-}"
[[ -n "$cmd" ]] || usage
shift

case "$cmd" in
    pr)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        gh pr view "$1" --json number,title,body,state,baseRefName,headRefName,headRefOid,url
        ;;

    diff)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        gh pr diff "$1"
        ;;

    pr-comments)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        gh pr view "$1" --comments
        ;;

    issues-search)
        [[ $# -eq 1 ]] || usage
        gh issue list --state open --search "$1"
        ;;

    review-comments)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/comments" \
            | jq '[.[][] | {id, path, line, side, body, in_reply_to_id, pull_request_review_id}]'
        ;;

    files)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        gh pr view "$1" --json files --jq '[.files[].path]'
        ;;

    login)
        [[ $# -eq 0 ]] || usage
        gh api user --jq .login
        ;;

    place)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_file "$2" "review json"
        place_comments "$1" "$2"
        ;;

    has-review)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_int "$2" "round"
        reviews="$(gh api --paginate "repos/{owner}/{repo}/pulls/$1/reviews" --jq '.[].body')" || exit 2
        if grep -q "^Redline round $2\b" <<<"$reviews"; then
            exit 0
        fi
        exit 1
        ;;

    post-review)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_file "$2" "review json"
        if ! jq -e '(.body | type == "string") and (.comments | type == "array")' "$2" >/dev/null 2>&1; then
            echo "redline-gh.sh: $2 must be JSON with body (string) and comments (array)" >&2
            exit 2
        fi
        placed="$(place_comments "$1" "$2")"
        payload="$(jq '{event: "COMMENT", body: .body, comments: [.comments[] | {path, line, side, body}]}' <<<"$placed")"
        response="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        trap 'rm -f "$response"' EXIT
        if ! gh api --method POST "repos/{owner}/{repo}/pulls/$1/reviews" --input - <<<"$payload" >"$response"; then
            # gh prints only the status line; the body carries GitHub's reason.
            jq -r '.message, (.errors // [] | .[] | tostring)' "$response" >&2 2>/dev/null || cat "$response" >&2
            exit 1
        fi
        review_id="$(jq -r '.id' "$response")"
        review="$(cat "$response")"
        # The reviews/{id}/comments endpoint omits `line`; the PR comments list has it. Slurp the
        # pages and filter once: --paginate --jq filters each page on its own and prints one array
        # per page, which jq --argjson rejects once the PR has more than one page of comments.
        comments="$(gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/comments" | jq --argjson id "$review_id" '[.[][] | select(.pull_request_review_id == $id) | {id, path, line, side, body}]')"
        jq -n --argjson review "$review" --argjson comments "$comments" --argjson moved "$(jq '.moved' <<<"$placed")" \
            '{review_id: $review.id, html_url: $review.html_url, comments: $comments, moved: $moved}'
        ;;

    reply)
        [[ $# -eq 3 ]] || usage
        need_int "$1" "pr number"
        need_int "$2" "comment id"
        need_file "$3" "reply body"
        jq -n --rawfile body "$3" '{body: $body}' \
            | gh api --method POST "repos/{owner}/{repo}/pulls/$1/comments/$2/replies" --input - \
            | jq '{id, html_url}'
        ;;

    comment)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_file "$2" "comment body"
        gh pr comment "$1" --body-file "$2"
        ;;

    request-review)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        gh pr edit "$1" --add-reviewer "$2"
        ;;

    issue-create)
        [[ $# -eq 2 ]] || usage
        need_file "$2" "issue body"
        gh issue create --title "$1" --body-file "$2"
        ;;

    update)
        [[ $# -eq 3 || $# -eq 4 ]] || usage
        need_int "$1" "pr number"
        need_file "$3" "pr body"
        backup_dir="${REDLINE_BACKUP_DIR:-${TMPDIR:-/tmp}/redline-backups}"
        mkdir -p "$backup_dir"
        backup="$backup_dir/pr-$1-$(date -u +%Y%m%dT%H%M%SZ).json"
        gh pr view "$1" --json number,title,body,url > "$backup"
        echo "redline-gh.sh: backup of PR #$1 title and body: $backup" >&2
        copy="${4:-}"
        if [[ -n "$copy" && -e "$copy" ]]; then
            echo "redline-gh.sh: $copy already exists; kept as the older backup" >&2
        elif [[ -n "$copy" ]]; then
            mkdir -p "$(dirname "$copy")"
            cp "$backup" "$copy"
            echo "redline-gh.sh: backup copied to $copy" >&2
        fi
        title="$2"
        if [[ "$title" == "-" ]]; then
            title="$(jq -r '.title' "$backup")"
        fi
        gh pr edit "$1" --title "$title" --body-file "$3" >/dev/null
        after="$(gh pr view "$1" --json title,body)"
        if [[ "$(jq -r '.title' <<<"$after")" != "$title" ]]; then
            echo "redline-gh.sh: read-back title differs from what was sent; backup at $backup" >&2
            exit 1
        fi
        # Compare with trailing newlines and CRs normalised; GitHub keeps the body otherwise byte for byte.
        sent_body="$(sed 's/\r$//' "$3")"
        read_body="$(jq -r '.body' <<<"$after" | sed 's/\r$//')"
        if [[ "$sent_body" != "$read_body" ]]; then
            echo "redline-gh.sh: read-back body differs from $3; backup at $backup" >&2
            exit 1
        fi
        jq -n --arg backup "$backup" --arg copy "$copy" --argjson after "$after" '{title: $after.title, body_bytes: ($after.body | length), backup: $backup, copy: $copy}'
        ;;

    -h|--help|help)
        usage
        ;;

    *)
        echo "redline-gh.sh: unknown subcommand $cmd" >&2
        usage
        ;;
esac
