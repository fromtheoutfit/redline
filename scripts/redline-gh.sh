#!/usr/bin/env bash
#
# Redline's one door to GitHub. Every body comes from a file, never inline text.
# Authenticated as whoever ran `gh auth login`. Any gh failure prints gh's own
# error to stderr and exits non-zero; nothing here retries.
#
# Read-only:
#   pr <n>                         PR facts as JSON
#   diff <n>                       the PR diff, built from the per-file patches of the paginated
#                                  files endpoint (GitHub's whole-PR diff refuses a PR over 300
#                                  files): a diff --git header per file, then its patch; a file
#                                  whose patch GitHub omits (binary, or over its size limit) gets
#                                  the header and one "(no patch: ...)" line
#   pr-comments <n>                issue comments and reviews on the PR
#   issues-search <query>          open issues matching the query
#   review-comments <n>            every inline review comment on the PR as JSON:
#                                  [{id, path, line, side, body, in_reply_to_id, pull_request_review_id}]
#   has-review <n> <round>         exit 0 if a review body starts "Redline round <round>", 1 if none, 2 on error
#   last-round <n>                 the highest posted "Redline round N" as a JSON number, 0 when
#                                  none; exit 2 on a gh error
#   human-review <n> <selector>    a teammate's review comments as one list, for a revise pass over
#                                  a human review (#36). <selector> is a review id, @login or
#                                  latest. Prints {selector, reviews: [{id, user, state, body,
#                                  submitted_at}], body: {review_id, user, text} | null, comments:
#                                  [{id, thread_id, review_id, user, path, line, side, body,
#                                  in_reply_to_id, created_at}]}. A comment is left out when it
#                                  belongs to a Redline review (body "Redline round N"), is a
#                                  Redline reply ("Redline round N:" or "Redline human review N:"),
#                                  or is already answered by a Redline reply in its thread
#                                  (thread_id is in_reply_to_id, else the comment's own id): a
#                                  reply whose body carries <!-- redline:answers <ids> --> answers
#                                  only the comments it names, and one without that line answers
#                                  every comment before it. An id keeps that review's open comments
#                                  and its body when not empty and not answered (an issue comment
#                                  opening <!-- redline:H<n>-<k> --> whose next line is
#                                  **H<n>-<k>** · from review <id> by @<login> answers that
#                                  review's body); @login keeps every open comment by that login
#                                  (matched in any case, as GitHub matches logins), replies inside
#                                  Redline threads included, and the body of their newest review
#                                  that has one not answered (one body per pass); latest is the
#                                  newest review that is not Redline's and not by the gh user (the
#                                  author running Redline) with an open comment or an unanswered
#                                  body, then as its id. Comments are ordered by path, line, id; a
#                                  null line (an outdated comment) is original_line.
#                                  Exit 2 on a gh error or a selector of another shape
#   last-human-review <n>          the highest "Redline human review N" among the PR's review
#                                  comments and issue comments as a JSON number, 0 when none;
#                                  exit 2 on a gh error
#   files <n>                      the PR's changed file paths as a JSON array, every page of the
#                                  files endpoint (gh pr view --json files stops at 100)
#   login                          the gh login Redline posts as
#   place <n> <json-file>          the post-review file as it would be posted: comments off the
#                                  hunks of their file's patch moved into the body under "Not
#                                  placed inline", each behind a marker <!-- redline:<finding> -->
#                                  (the id read from the comment body's leading **R1-2**), with a
#                                  `moved` list [{id, path, line, side}]. Nothing is posted
#
# Needs gh 2.48.0 or newer (gh api --slurp); an older gh stops every subcommand that lists the
# PR's files with one line naming the installed version, exit 2.
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

usage() { sed -n '2,/^$/p' "$0" >&2; exit 2; }

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

# Every file of the PR as one JSON array, every page of the files endpoint: each item carries
# filename, status, previous_filename and, unless GitHub omits it (binary, or over its per-file
# limit), patch. The whole-PR diff endpoint refuses a PR over 300 files, so every file list and
# every anchor comes from here. An older gh without --slurp stops with one line, exit 2.
pr_files() {
    local err pages
    err="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    if ! pages="$(gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/files" 2>"$err")"; then
        if grep -q 'unknown flag: --slurp' "$err"; then
            echo "redline-gh.sh: $(gh --version | head -1) does not know --slurp; Redline needs gh 2.48.0 or newer" >&2
            rm -f "$err"
            exit 2
        fi
        cat "$err" >&2
        rm -f "$err"
        exit 1
    fi
    rm -f "$err"
    jq '[.[][]]' <<<"$pages"
}

# The PR diff built from the per-file patches: the header git would write (previous_filename on
# the a/ side of a rename, /dev/null for an added or removed file), then the patch verbatim, or
# one line saying why there is none: "(no patch: renamed, no text changes)" for a rename GitHub
# counts no changed lines in (`changes` 0), and "(no patch: binary or too large for GitHub)" for
# everything else, a rename that changed included. Takes the pr_files JSON on stdin.
synthesize_diff() {
    jq -r '.[]
        | (if .status == "renamed" and .previous_filename != null then .previous_filename else .filename end) as $a
        | "diff --git a/\($a) b/\(.filename)",
          (if .status == "added" then "--- /dev/null" else "--- a/\($a)" end),
          (if .status == "removed" then "+++ /dev/null" else "+++ b/\(.filename)" end),
          (if .patch != null then .patch
           elif .status == "renamed" and (.changes // 0) == 0 then "(no patch: renamed, no text changes)"
           else "(no patch: binary or too large for GitHub)" end)'
}

# Every position an inline comment may sit on: the added, removed and context lines of each
# file's patch, one per line as "path<TAB>side<TAB>line". GitHub resolves a comment on `line` of
# `side` (RIGHT: the new file, LEFT: the old) only inside a hunk; a context line is on both sides.
# Takes the pr_files JSON on stdin; a file without a patch has no position.
diff_positions() {
    jq -r '.[] | select(.patch != null) | "@@@redline-file\t\(.filename)", .patch' | awk '
        /^@@@redline-file\t/ { path = substr($0, 17); inhunk = 0; next }
        /^@@ / {
            split($2, old, ","); split($3, new, ",")
            oldline = substr(old[1], 2) + 0; newline = substr(new[1], 2) + 0
            inhunk = 1; next
        }
        !inhunk { next }
        /^\\ No newline/ { next }
        /^\+/ { print path "\tRIGHT\t" newline; newline++; next }
        /^-/ { print path "\tLEFT\t" oldline; oldline++; next }
        { print path "\tRIGHT\t" newline; print path "\tLEFT\t" oldline; newline++; oldline++ }
    '
}

# The review file with every comment GitHub could not anchor moved into the body: prints
# {body, comments, moved}. `side` defaults to RIGHT, as post-review sends it. A moved comment
# sits behind <!-- redline:<id> --> (its id from the leading **R1-2** of its body), so a later
# round can reply to it with an issue comment that quotes the marker. $1 is the pr_files JSON.
place_comments() {
    # The positions go through a file: on a PR of hundreds of files the list is megabytes, past
    # what --argjson may carry on the command line ("Argument list too long").
    local positions
    positions="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    diff_positions <<<"$1" | jq -R -s 'split("\n") | map(select(length > 0))' > "$positions"
    jq --slurpfile positions "$positions" '
        ($positions[0] | map({key: ., value: true}) | from_entries) as $ok
        | def key: .path + "\t" + (.side // "RIGHT") + "\t" + (.line | tostring);
        def id: (.body | capture("^\\*\\*(?<id>R[0-9]+-[0-9]+)\\*\\*") | .id) // "";
        (.comments | map(select($ok[key] == true))) as $placed
        | (.comments | map(select($ok[key] != true))) as $moved
        | {
            body: (if ($moved | length) == 0 then .body
                   else .body + "\n\n### Not placed inline\n\n" + ($moved | map((if id == "" then "" else "<!-- redline:" + id + " -->\n" end) + "`" + .path + ":" + (.line | tostring) + "`\n\n" + .body) | join("\n\n")) end),
            comments: ($placed | map(.side = (.side // "RIGHT"))),
            moved: ($moved | map({id: id, path, line, side: (.side // "RIGHT")}))
          }' "$2"
    rm -f "$positions"
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
        all="$(pr_files "$1")"
        synthesize_diff <<<"$all"
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
        all="$(pr_files "$1")"
        jq '[.[].filename]' <<<"$all"
        ;;

    login)
        [[ $# -eq 0 ]] || usage
        gh api user --jq .login
        ;;

    place)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_file "$2" "review json"
        all="$(pr_files "$1")"
        place_comments "$all" "$2"
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

    last-round)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        reviews="$(gh api --paginate "repos/{owner}/{repo}/pulls/$1/reviews" --jq '.[].body')" || exit 2
        { grep -o '^Redline round [0-9][0-9]*' <<<"$reviews" || true; } | awk '{ if ($3 + 0 > last) last = $3 + 0 } END { print last + 0 }'
        ;;

    human-review)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        selector="$2"
        me=""
        case "$selector" in
            latest) me="$(gh api user --jq .login)" || exit 2 ;;
            @?*) ;;
            *)
                if ! [[ "$selector" =~ ^[0-9]+$ ]]; then
                    echo "redline-gh.sh: the selector must be a review id, @login or latest, got: $selector" >&2
                    exit 2
                fi
                ;;
        esac
        # The three lists grow with the PR, so they reach jq through files, never the command line.
        reviews_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        comments_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        issues_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        trap 'rm -f "$reviews_file" "$comments_file" "$issues_file"' EXIT
        gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/reviews" | jq '[.[][]]' > "$reviews_file" || exit 2
        gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/comments" | jq '[.[][]]' > "$comments_file" || exit 2
        gh api --paginate --slurp "repos/{owner}/{repo}/issues/$1/comments" | jq '[.[][]]' > "$issues_file" || exit 2
        jq -n --slurpfile reviews "$reviews_file" --slurpfile comments "$comments_file" --slurpfile issues "$issues_file" --arg selector "$selector" --arg me "$me" '
            def redline_review: (.body // "") | test("^Redline round [0-9]+");
            def redline_reply: (.body // "") | test("^Redline (round|human review) [0-9]+");
            def answers: ([(.body // "") | match("<!-- redline:answers ([0-9 ]+) -->") | .captures[0].string] | first) as $s
                | if $s == null then null else [$s | splits(" +") | select(. != "") | tonumber] end;
            ($reviews[0] | map(select(redline_review) | .id)) as $redline_ids
            | ([$issues[0][] | (.body // "") | capture("^<!-- redline:H[0-9]+-[0-9]+ -->\\s+\\*\\*H[0-9]+-[0-9]+\\*\\* · from review (?<id>[0-9]+) by @") | .id | tonumber] | unique) as $answered_bodies
            | def open_body: (.body // "") != "" and (.id as $r | $answered_bodies | index($r) | not);
            ($comments[0] | map(. + {thread_id: (.in_reply_to_id // .id), login: (.user.login // "")})) as $all
            | ($all | map(select(redline_reply) | . + {answers: answers})) as $replies
            | ($all | map(select(
                  (.pull_request_review_id as $r | $redline_ids | index($r) | not)
                  and (redline_reply | not)
                  and (. as $c | any($replies[]; .thread_id == $c.thread_id and (if .answers == null then .id > $c.id else any(.answers[]; . == $c.id) end)) | not)))) as $open
            | ($reviews[0] | map(select(redline_review | not))) as $humans
            | (if $selector == "latest" then
                  ($humans
                   | map(select((.user.login // "") != $me and (open_body or (.id as $r | any($open[]; .pull_request_review_id == $r)))))
                   | sort_by(.submitted_at, .id) | last) as $r
                  | if $r == null then null else {kind: "id", id: $r.id} end
               elif ($selector | startswith("@")) then {kind: "login", login: ($selector[1:] | ascii_downcase)}
               else {kind: "id", id: ($selector | tonumber)} end) as $pick
            | if $pick == null then {selector: $selector, reviews: [], body: null, comments: []} else
              (if $pick.kind == "id" then ($open | map(select(.pull_request_review_id == $pick.id)))
               else ($open | map(select((.login | ascii_downcase) == $pick.login))) end
               | sort_by(.path, (.line // .original_line // 0), .id)) as $picked
              | (if $pick.kind == "id" then ($humans | map(select(.id == $pick.id and open_body)) | first)
                 else ($humans | map(select(((.user.login // "") | ascii_downcase) == $pick.login and open_body)) | sort_by(.submitted_at, .id) | last) end) as $with_body
              | ([$picked[].pull_request_review_id] + (if $with_body == null then [] else [$with_body.id] end) | unique) as $ids
              | {
                  selector: $selector,
                  reviews: ($humans | map(select(.id as $r | $ids | index($r) != null)) | sort_by(.id) | map({id, user: (.user.login // ""), state, body: (.body // ""), submitted_at})),
                  body: (if $with_body == null then null else {review_id: $with_body.id, user: ($with_body.user.login // ""), text: $with_body.body} end),
                  comments: ($picked | map({id, thread_id, review_id: .pull_request_review_id, user: .login, path, line: (.line // .original_line), side: (.side // "RIGHT"), body, in_reply_to_id, created_at}))
                }
              end'
        ;;

    last-human-review)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        replies="$(gh api --paginate "repos/{owner}/{repo}/pulls/$1/comments" --jq '.[].body')" || exit 2
        comments="$(gh api --paginate "repos/{owner}/{repo}/issues/$1/comments" --jq '.[].body')" || exit 2
        { grep -o '^Redline human review [0-9][0-9]*' <<<"$replies"$'\n'"$comments" || true; } | awk '{ if ($4 + 0 > last) last = $4 + 0 } END { print last + 0 }'
        ;;

    post-review)
        [[ $# -eq 2 ]] || usage
        need_int "$1" "pr number"
        need_file "$2" "review json"
        if ! jq -e '(.body | type == "string") and (.comments | type == "array")' "$2" >/dev/null 2>&1; then
            echo "redline-gh.sh: $2 must be JSON with body (string) and comments (array)" >&2
            exit 2
        fi
        all="$(pr_files "$1")"
        placed="$(place_comments "$all" "$2")"
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
