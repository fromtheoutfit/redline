#!/usr/bin/env bash
#
# Redline's one door to GitHub. Every body comes from a file, never inline text.
# Authenticated as whoever ran `gh auth login`. Any gh failure prints gh's own
# error to stderr and exits non-zero; nothing here retries a call that failed.
# post-review alone posts again, a different review, in the two cases its entry names.
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
#   prior-findings <n>             every finding Redline's posted rounds list, with its disposition,
#                                  for the next run's known-finding check (#35): [{id, round,
#                                  review_id, category, severity, confidence, file, line, title,
#                                  comment_id, body, reply, carried_from, carried_to, disposition}],
#                                  by round then number, [] when no Redline review exists. A
#                                  finding is a review body line "- **R<n>-<k>** · <category> ·
#                                  <severity> · <confidence> · `<file>:<line>` · <title>", under
#                                  whatever heading (an "Already tracked" line has no such fields
#                                  and is not one, nor is a scope-declined line, whose id is not
#                                  bold, #93); <confidence> is confirmed or unconfirmed, and likely
#                                  or unsure in a review posted before #93. " · needs a decision",
#                                  " · first reported as R<n>-<k>" (carried_from) and a repository
#                                  ask rule's tail (#49), " · left to <person> under rule <id>" or,
#                                  before #93, " · yours under rule <id>", are stripped from the
#                                  title; <person> is @<login>, or "the person running Redline"
#                                  when the run had no login ("the author" in a final nit pass
#                                  after a human review pass with none). comment_id and body
#                                  are the root inline comment opening **<id>** · , 0 and "" for a
#                                  finding in the review body. reply is the newest "Redline round
#                                  N: " reply in that thread, else the issue comment opening
#                                  <!-- redline:<id> --> whose next line is **<id>** · ... · from
#                                  the Redline round <n> review body, as {id, body} with the text
#                                  after the prefix, or null. disposition reads the reply's first
#                                  words: "fixed in" fixed, "deferred" (since #95: "deferred to
#                                  #<n>", "deferred; the issue draft is at") or, before it,
#                                  "mitigated" deferred, "declined: "
#                                  declined (Redline's own decision not to act, #93; a reply that
#                                  only mentions a decline is decided), "not acted on in this
#                                  run." dropped, "not changed in this round." not-changed,
#                                  "carried forward as R<n>-<k>;" carried (carried_to), "left to
#                                  <person> under repository rule" or, before #93, "left to the
#                                  author" left (a finding a repository ask rule left to the
#                                  person, #49), "resolved; first reported as" fixed (a later
#                                  run's reviewer found the code no longer has it, #80, R4-3), any
#                                  other reply decided, no reply none; a finding a later round's
#                                  line names as first reported is carried (carried_to that id)
#                                  whatever its thread says. Exit 2 on a gh error
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
#                                  hunks of their file moved into the body under "Not placed
#                                  inline", each behind a marker <!-- redline:<finding> --> (the
#                                  id read from the comment body's leading **R1-2**), with a
#                                  `moved` list [{id, path, line, side}]. A file's hunks are its
#                                  patch in the files listing or, when GitHub omits that from a
#                                  text file (a patch over about 100 KiB), the file's section of
#                                  the whole-PR diff, read once and only when a comment names such
#                                  a file on a PR of 300 files or fewer, or else, when this clone
#                                  holds the base and the head commit (their shas read in one
#                                  call), a local git diff of their merge base against the head
#                                  for that path (#96). The moved comments
#                                  are grouped under one line per cause: the file is not in the
#                                  pull request, the line is not in its diff, the file is binary,
#                                  it was renamed with nothing changed, or its patch could not be
#                                  had. A file GitHub takes no comment on is known only to
#                                  post-review, which learns it by posting. Nothing is posted
#   threads <n>                    every review thread on the PR (GraphQL reviewThreads, every
#                                  page) as JSON [{id, resolved, path, line, comments: [{id, user}]}]:
#                                  id is the thread's node id (what resolveReviewThread takes),
#                                  each comment's id its review-comment id (what `reply` takes),
#                                  threads in path, line, first-comment order; exit 2 on a gh error
#
# Needs gh 2.48.0 or newer (gh api --slurp); an older gh stops every subcommand that lists the
# PR's files with one line naming the installed version, exit 2.
#
# Writes (GitHub agent only):
#   post-review <n> <json-file>    {body, comments:[{path,line,side,body}]} posted with event COMMENT
#                                  after `place` (a comment GitHub could not anchor would fail the
#                                  whole post with a 422 that names no line); prints
#                                  {review_id, html_url, comments:[{id,path,line,side,body}], moved}.
#                                  A refused post posts nothing, and two refusals are answered
#                                  with a different review, never the same one again (#96). A
#                                  refusal is a 422 by the status in GitHub's body or, when the
#                                  body has none, by the "(HTTP 422)" gh prints (#112, R1-10). A 422
#                                  naming "Diff entry <path> diff is too large", for a file whose
#                                  hunks did not come from the listing: GitHub takes no comment on
#                                  that file (its limit, measured between 290 KB and 1.25 MB of
#                                  diff), so its comments move into the body under that cause, once
#                                  per such file. Any other 422 while a comment sits on such a
#                                  file: all of those move into the body under GitHub's message
#                                  and the review is posted from the listing's patches only, once.
#                                  Each says so in one line on stderr, and the exit is still 0.
#                                  A 422 with no such comment, or after the second case, is the
#                                  failure it always was: GitHub's reason on stderr, exit 1.
#                                  Comments the placement cannot read (its jq fails on one) stop
#                                  it before anything is posted: one line on stderr naming the
#                                  review file, exit 2
#   reply <n> <comment-id> <file>  reply in an inline comment's thread
#   comment <n> <file>             issue comment on the PR
#   request-review <n> <user>      add a reviewer
#   defer <issue|draft> <finding> <draft-file> <record-file>
#                                  file a deferred finding's drafted issue, safe to repeat (#95).
#                                  The draft's first line is "# <title>", its second is empty and
#                                  the rest is the body, so no title crosses the command line. The
#                                  record is a JSON object of the round's filed drafts, by finding
#                                  id. issue: a finding the record holds as an issue is printed
#                                  again and nothing is called; else an issue whose body carries
#                                  the draft's last line (the pull request, round and finding it
#                                  came from, text only that issue has) is looked up, recorded and
#                                  printed; else the issue is opened and recorded as {where:
#                                  "issue", number, url, path}. Each entry is merged into the
#                                  record as the file stands when it is written, so an entry
#                                  another defer recorded meanwhile is kept. draft: the path is
#                                  recorded as {where: "draft", path} and GitHub is not called.
#                                  Prints {finding, where, number, url, path, reused}: path is the
#                                  draft's, relative to its repository; number 0 and url "" for a
#                                  draft; reused true when the issue was already there. A failed
#                                  lookup or create exits 1 and writes no record; so does a record
#                                  that cannot be read, written or moved into place, or is no JSON
#                                  object, when the entry is written, which names the entry it
#                                  could not record, the issue opened by then included
#   update <n> <title|-> <file> [<copy>]
#                                  edit the PR title and body, with backup and read-back;
#                                  "-" keeps the current title. Backup dir: $REDLINE_BACKUP_DIR
#                                  (default $TMPDIR/redline-backups). <copy> also gets the backup,
#                                  unless it already exists (a re-run keeps the first, older body)
#   resolve-threads <n> <id>...    resolve the review threads the ids name, where every id is a
#                                  review comment Redline posted (a finding's inline comment and
#                                  the replies in its thread, this run's or, for an earlier round's
#                                  finding this run carried forward, that round's). A thread is resolved only
#                                  when it is open and every comment in it is in the list, so a
#                                  thread a teammate opened or commented in, wherever the comment
#                                  sits, is never resolved whatever ids are given; one
#                                  resolveReviewThread mutation per thread (#39). Prints
#                                  {resolved: [{id, thread}], skipped: [{id, reason}]}: id is the
#                                  thread's first comment (the finding's), thread its node id,
#                                  reason one of "already resolved", "opened by comment <id>, not
#                                  Redline's", "last comment <id> is not Redline's",
#                                  "comment <id> is not Redline's", "no thread holds comment <id>".
#                                  Nothing retries: exit 1 on a failed
#                                  mutation after the ones already sent, 2 on usage or a failed read

set -euo pipefail

# The two GraphQL documents, fixed strings parameterised by -F variables only (owner, name, number,
# endCursor; threadId), never built from an argument. --paginate follows pageInfo through $endCursor.
THREADS_QUERY='query($owner: String!, $name: String!, $number: Int!, $endCursor: String) { repository(owner: $owner, name: $name) { pullRequest(number: $number) { reviewThreads(first: 100, after: $endCursor) { pageInfo { hasNextPage endCursor } nodes { id isResolved path line comments(first: 100) { nodes { databaseId author { login } } } } } } } }'
RESOLVE_MUTATION='mutation($threadId: ID!) { resolveReviewThread(input: {threadId: $threadId}) { thread { id isResolved } } }'

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

# The temp files `defer` makes, removed on every way out (#97, R1-3): the issue body, and the
# record's next version beside it until it is moved into place. One EXIT trap names both, since a
# later `trap ... EXIT` replaces an earlier one.
defer_body='' defer_tmp=''
defer_cleanup() {
    if [[ -n "$defer_body" ]]; then rm -f "$defer_body"; fi
    if [[ -n "$defer_tmp" ]]; then rm -f "$defer_tmp"; fi
}

# defer_lost <record file> <finding> <entry> <what is wrong>: a write of the record that failed
# after the lookup or the create on GitHub, so the issue opened by then may be in no record: one
# line naming the entry it could not record, never a tool's own message alone, and exit 1 (#97,
# R1-3, R2-1).
defer_lost() {
    echo "redline-gh.sh: $1 $4 when $2's entry is written; not recorded: $3" >&2
    exit 1
}

# defer_record <record file> <finding> <entry>: the record with the finding's entry set, merged
# into the record as the file stands now, not as `defer` read it before the lookup and the create
# on GitHub, so an entry another defer recorded in between is kept (#97, R1-2); written beside
# itself and moved into place, so a reader never sees half a file. Every step that can fail exits
# through defer_lost, which names the entry (#97, R2-1).
defer_record() {
    local current='{}'
    if ! mkdir -p "$(dirname "$1")" || ! defer_tmp="$(mktemp "$(dirname "$1")/.redline-deferred.XXXXXX")"; then
        defer_lost "$1" "$2" "$3" "cannot be written"
    fi
    if [[ -f "$1" ]]; then
        if ! current="$(cat "$1")"; then
            defer_lost "$1" "$2" "$3" "cannot be read"
        fi
    fi
    if ! jq -e --arg id "$2" --argjson e "$3" 'if type == "object" then . + {($id): $e} else error("not an object") end' <<<"$current" > "$defer_tmp" 2>/dev/null; then
        defer_lost "$1" "$2" "$3" "is no JSON object"
    fi
    if ! mv "$defer_tmp" "$1"; then
        defer_lost "$1" "$2" "$3" "cannot be moved into place"
    fi
    defer_tmp=''
}

# defer_print <finding> <entry> <reused>: what `defer` prints for one finding.
defer_print() {
    jq -n --arg id "$1" --argjson e "$2" --argjson reused "$3" \
        '{finding: $id, where: $e.where, number: ($e.number // 0), url: ($e.url // ""), path: $e.path, reused: $reused}'
}

# Every file of the PR as one JSON array, every page of the files endpoint: each item carries
# filename, status, previous_filename and, unless GitHub omits it (binary, or over its per-file
# limit), patch. The whole-PR diff endpoint refuses a PR over 300 files, so every file list comes
# from here, and every anchor but those of a file whose patch is omitted (recover_hunks, #96). An
# older gh without --slurp stops with one line, exit 2.
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

# The files a comment of the review names whose patch the listing omits though their text changed
# (`changes` above 0; a binary file and a rename with nothing changed have `changes` 0 and no
# hunks to find), one per line as "path<TAB>previous path", the second empty unless renamed (#96).
# Takes the pr_files JSON on stdin; $1 is the review file.
wanted_files() {
    jq -r --slurpfile review "$1" '
        ([$review[0].comments[].path] | unique) as $named
        | .[] | select(.patch == null and (.changes // 0) > 0)
        | select(.filename as $f | $named | index($f) != null)
        | [.filename, (if .status == "renamed" then (.previous_filename // "") else "" end)] | join("\t")'
}

# diff_sections <wanted> <diff>: the hunks of the files <wanted> lists (a path per line, before the
# first tab) as a unified diff holds them, in the stream diff_positions reads: one line
# "@@@redline-file<TAB>path", then that file's hunks. A section's path is read from its "+++ b/"
# line, or "--- a/" for a removed file, while still in the section's header, so a hunk line that
# looks like one is never taken for it; a section without hunks (a binary file) prints nothing.
# <wanted> is never empty: recover_hunks returns before this when it is.
diff_sections() {
    awk -F'\t' '
        NR == FNR { want[$1] = 1; next }
        /^diff --git / { header = 1; emit = 0; path = ""; old = ""; next }
        header && /^--- a\// { old = substr($0, 7); sub(/\t$/, "", old); next }
        header && /^\+\+\+ b\// { path = substr($0, 7); sub(/\t$/, "", path); next }
        header && /^\+\+\+ \/dev\/null/ { path = old; next }
        header && /^@@ / { header = 0; if (path in want) { emit = 1; print "@@@redline-file\t" path } }
        emit && !header { print }
    ' "$1" "$2"
}

# recover_hunks <pr> <pr_files JSON> <review file> <out>: the hunks of the wanted files, from a
# source other than the listing, written to <out> in the stream diff_positions reads (#96). GitHub
# omits a patch over about 100 KiB from the listing and still takes a comment on the file's lines.
# With no wanted file nothing is called and <out> is empty. Otherwise, in order:
# 1. The whole-PR diff: the pull request's own endpoint under the diff media type, one call
#    however many files are wanted, made only when the listing counts 300 files or fewer (past
#    that GitHub refuses it). These are GitHub's own hunks.
# 2. For a file still without hunks (a PR over 300 files, a refused call, a section the diff does
#    not hold): this clone. One call reads the base and head shas; when both commits are here,
#    `git diff` of their merge base against the head for that path, and for a rename its previous
#    path, gives the hunks, measured byte-identical to GitHub's whole diff. Its flags are pinned
#    (algorithm, context, prefixes, rename detection, no external diff, no textconv), and it
#    runs with GIT_DIFF_OPTS unset, which git lets override -U (#112, R1-4), so the user's git
#    configuration and environment cannot move a hunk; the paths are literal, never patterns.
#    A diff header quotes a path that holds a byte outside ASCII ("b/lib/\345\220\215.txt"), which
#    step 1 does not match, so such a file is found here, where git is told not to quote it. A
#    path git quotes regardless (a tab, a newline, a quote or a backslash in it) is found by
#    neither and stays without hunks.
# Neither source failing is an error: the file stays without hunks, and place_comments says why
# its comments are in the body.
recover_hunks() {
    local wanted whole count found missing shas base head fork one path prev
    : > "$4"
    wanted="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    wanted_files "$3" <<<"$2" > "$wanted"
    if [[ ! -s "$wanted" ]]; then
        rm -f "$wanted"
        return 0
    fi
    count="$(jq 'length' <<<"$2")"
    if [[ "$count" -le 300 ]]; then
        whole="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        if gh api "repos/{owner}/{repo}/pulls/$1" -H "Accept: application/vnd.github.diff" > "$whole" 2>/dev/null; then
            diff_sections "$wanted" "$whole" >> "$4"
        fi
        rm -f "$whole"
    fi
    found="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    missing="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    { grep $'^@@@redline-file\t' "$4" || true; } | cut -f2 > "$found"
    awk -F'\t' -v found="$found" 'BEGIN { while ((getline line < found) > 0) have[line] = 1 } !($1 in have)' "$wanted" > "$missing"
    if [[ -s "$missing" ]] && shas="$(gh api "repos/{owner}/{repo}/pulls/$1" --jq '.base.sha, .head.sha' 2>/dev/null)"; then
        base="$(sed -n 1p <<<"$shas")"
        head="$(sed -n 2p <<<"$shas")"
        if [[ "$base" =~ ^[0-9a-f]{40,64}$ && "$head" =~ ^[0-9a-f]{40,64}$ ]] \
            && git cat-file -e "$base^{commit}" 2>/dev/null && git cat-file -e "$head^{commit}" 2>/dev/null \
            && fork="$(git merge-base "$base" "$head" 2>/dev/null)"; then
            one="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
            while IFS=$'\t' read -r path prev; do
                if env -u GIT_DIFF_OPTS git --literal-pathspecs -c core.quotepath=off diff --diff-algorithm=myers -U3 --inter-hunk-context=0 --indent-heuristic -M \
                    --no-color --no-ext-diff --no-textconv --src-prefix=a/ --dst-prefix=b/ \
                    "$fork" "$head" -- "$path" ${prev:+"$prev"} > "$one" 2>/dev/null; then
                    diff_sections "$missing" "$one" >> "$4"
                fi
            done < "$missing"
            rm -f "$one"
        fi
    fi
    rm -f "$wanted" "$found" "$missing"
}

# Every position an inline comment may sit on: the added, removed and context lines of each
# file's patch, one per line as "path<TAB>side<TAB>line". GitHub resolves a comment on `line` of
# `side` (RIGHT: the new file, LEFT: the old) only inside a hunk; a context line is on both sides.
# Takes the pr_files JSON on stdin and, as $1, the hunks recover_hunks found for the files the
# listing gives no patch for; a file with neither has no position.
diff_positions() {
    { jq -r '.[] | select(.patch != null) | "@@@redline-file\t\(.filename)", .patch'; cat "$1"; } | awk '
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
# round can reply to it with an issue comment that quotes the marker. $1 is the pr_files JSON, $2
# the review file, $3 the hunks recover_hunks found. The rest is post-review's, after a refusal:
# $4 a file listing the paths GitHub took no comment on, $5 1 to place from the listing's patches
# only, and $6 GitHub's message for the refusal that caused that.
# The moved comments are grouped by why they could not be anchored, each group under one line
# that says so, in this order, the comments of a group in the review's order (#96): the file is
# not in the pull request; the line is outside the file's hunks; the file is binary (no patch and
# `changes` 0 in the listing); it was renamed with nothing changed (the same, status renamed); no
# source gave its patch (the listing, the whole diff, the clone). Two more follow a refused post:
# GitHub took no comment on the file ($4), listed before the missing patch; and, last, the file's
# hunks came from a source and GitHub refused the review that used them ($5). `moved` keeps the
# review's order.
place_comments() {
    # The positions go through a file: on a PR of hundreds of files the list is megabytes, past
    # what --argjson may carry on the command line ("Argument list too long"). So does the kind
    # of each file, which grows with the listing.
    local positions kinds recovered large="${4:-/dev/null}" only="${5:-0}" message="${6:-}"
    positions="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    kinds="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    recovered="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    diff_positions "$3" <<<"$1" | jq -R -s 'split("\n") | map(select(length > 0))' > "$positions"
    { grep $'^@@@redline-file\t' "$3" || true; } | cut -f2 > "$recovered"
    jq --rawfile recovered "$recovered" --rawfile large "$large" --arg only "$only" '
        def set: split("\n") | map(select(length > 0) | {key: ., value: true}) | from_entries;
        ($recovered | set) as $found
        | ($large | set) as $refused
        | map({key: .filename, value: (
            if .patch != null then "hunks"
            elif (.changes // 0) == 0 then (if .status == "renamed" then "renamed" else "binary" end)
            elif $refused[.filename] == true then "toolarge"
            elif $found[.filename] == true then (if $only == "1" then "refused" else "hunks" end)
            else "nopatch" end)}) | from_entries' <<<"$1" > "$kinds"
    jq --slurpfile positions "$positions" --slurpfile kinds "$kinds" \
        --arg absent "The file is not in this pull request:" \
        --arg offhunk "The line is not in the pull request's diff:" \
        --arg binary "The file is binary and has no hunks:" \
        --arg renamed "The file was renamed with no text changes and has no hunks:" \
        --arg toolarge "GitHub takes no comment on a diff this large:" \
        --arg nopatch "The file's patch could not be had from GitHub's listing, its whole diff or this clone:" \
        --arg refused "GitHub refused a review that placed comments through its whole diff or this clone ($message), so these comments, on files its listing gives no patch for, are here:" '
        ($positions[0] | map({key: ., value: true}) | from_entries) as $ok
        | $kinds[0] as $kind
        | [["absent", $absent], ["offhunk", $offhunk], ["binary", $binary], ["renamed", $renamed], ["toolarge", $toolarge], ["nopatch", $nopatch], ["refused", $refused]] as $causes
        | def key: .path + "\t" + (.side // "RIGHT") + "\t" + (.line | tostring);
        def id: (.body | capture("^\\*\\*(?<id>R[0-9]+-[0-9]+)\\*\\*") | .id) // "";
        def placed: $kind[(.path // "")] == "hunks" and $ok[key] == true;
        def cause: ($kind[(.path // "")] // "absent") as $k | if $k == "hunks" then "offhunk" else $k end;
        def block: (if id == "" then "" else "<!-- redline:" + id + " -->\n" end) + "`" + .path + ":" + (.line | tostring) + "`\n\n" + .body;
        (.comments | map(select(placed))) as $placed
        | (.comments | map(select(placed | not))) as $moved
        | {
            body: (if ($moved | length) == 0 then .body
                   else .body + "\n\n### Not placed inline\n\n" + ([$causes[] | . as $c | ($moved | map(select(cause == $c[0]))) | select(length > 0) | $c[1] + "\n\n" + (map(block) | join("\n\n"))] | join("\n\n")) end),
            comments: ($placed | map(.side = (.side // "RIGHT"))),
            moved: ($moved | map({id: id, path, line, side: (.side // "RIGHT")}))
          }' "$2"
    rm -f "$positions" "$kinds" "$recovered"
}

# Every review thread of PR $1 as the `threads` list: the pages slurped into a temp file (a PR of
# hundreds of threads is megabytes), one jq pass. Returns 1 when gh fails, with gh's own error.
review_threads() {
    local pages
    pages="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
    if ! gh api graphql --paginate --slurp -F owner='{owner}' -F name='{repo}' -F number="$1" -f query="$THREADS_QUERY" > "$pages"; then
        rm -f "$pages"
        return 1
    fi
    jq '[.[].data.repository.pullRequest.reviewThreads.nodes[]
         | {id, resolved: .isResolved, path, line, comments: [.comments.nodes[] | {id: .databaseId, user: (.author.login // "")}]}]
        | sort_by(.path, (.line // 0), .comments[0].id)' "$pages"
    rm -f "$pages"
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
        hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        trap 'rm -f "$hunks"' EXIT
        recover_hunks "$1" "$all" "$2" "$hunks"
        place_comments "$all" "$2" "$hunks"
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

    prior-findings)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        # The three lists grow with the PR, so they reach jq through files, never the command line.
        reviews_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        comments_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        issues_file="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        trap 'rm -f "$reviews_file" "$comments_file" "$issues_file"' EXIT
        gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/reviews" | jq '[.[][]]' > "$reviews_file" || exit 2
        gh api --paginate --slurp "repos/{owner}/{repo}/pulls/$1/comments" | jq '[.[][]]' > "$comments_file" || exit 2
        gh api --paginate --slurp "repos/{owner}/{repo}/issues/$1/comments" | jq '[.[][]]' > "$issues_file" || exit 2
        jq -n --slurpfile reviews "$reviews_file" --slurpfile comments "$comments_file" --slurpfile issues "$issues_file" '
            def redline_review: (.body // "") | test("^Redline round [0-9]+");
            def round_of: (.body // "") | capture("^Redline round (?<n>[0-9]+)") | .n | tonumber;
            # The finding lines of a review body, whatever heading they sit under (reviewBody in the workflow).
            def finding_lines: [(.body // "") | split("\n")[]
                | capture("^- \\*\\*(?<id>R[0-9]+-[0-9]+)\\*\\* · (?<category>correctness|nit) · (?<severity>high|medium|low) · (?<confidence>confirmed|unconfirmed|likely|unsure) · `(?<file>[^`]+):(?<line>[0-9]+)` · (?<tail>.*)$")];
            # The disposition a reply states, by the fixed wording replyBody in the workflow writes.
            # A decline opens "declined: " (#93); a reply that only mentions one is decided. The
            # person a repository rule leaves a finding to is named by login since #93, or as "the
            # person running Redline" when the run had none; "the author" is the wording before it,
            # and a human review pass with no login writes it in the rule tail of a final nit pass
            # too (#94, R1-3). A login may hold an underscore, as an Enterprise Managed User login
            # does (#94, R2-1).
            def classify:
                if startswith("fixed in ") then "fixed"
                elif startswith("mitigated") or startswith("deferred") then "deferred"
                elif startswith("declined: ") then "declined"
                elif startswith("not acted on in this run.") then "dropped"
                elif startswith("not changed in this round.") then "not-changed"
                elif startswith("carried forward as R") then "carried"
                elif startswith("left to the author") then "left"
                elif test("^left to (@[A-Za-z0-9_-]+|the person running Redline) under repository rule ") then "left"
                elif startswith("resolved; first reported as ") then "fixed"
                else "decided" end;
            ($comments[0]) as $all
            | ($issues[0]) as $issue_comments
            | [$reviews[0][] | select(redline_review) | . as $r | round_of as $n
                | finding_lines[] | . as $f
                | ($f.tail | capture("^(?<title>.*?)(?<decision> · needs a decision)?(?<carried> · first reported as (?<from>R[0-9]+-[0-9]+))?(?<rule> · (yours|left to (@[A-Za-z0-9_-]+|the person running Redline|the author)) under rule [a-z][a-z0-9-]*)?$")) as $t
                | ($all | map(select(.in_reply_to_id == null and ((.body // "") | startswith("**" + $f.id + "** · ")))) | first) as $root
                | ($root.id // 0) as $cid
                | (if $cid > 0
                   then ($all | map(select(.in_reply_to_id == $cid and ((.body // "") | test("^Redline round [0-9]+: ")))) | sort_by(.id) | last)
                   else ($issue_comments | map(select((.body // "") | test("^<!-- redline:" + $f.id + " -->\n\\*\\*" + $f.id + "\\*\\* · [^\n]*from the Redline round " + ($n | tostring) + " review body\n"))) | sort_by(.id) | last)
                   end) as $reply
                | {id: $f.id, round: $n, review_id: $r.id, category: $f.category, severity: $f.severity, confidence: $f.confidence,
                   file: $f.file, line: ($f.line | tonumber), title: $t.title, comment_id: $cid, body: ($root.body // ""),
                   reply: (if $reply == null then null else {id: $reply.id, body: ($reply.body | sub("^Redline round [0-9]+: "; "") | sub("^[\\s\\S]*?Redline round [0-9]+: "; ""))} end),
                   carried_from: ($t.from // ""), carried_to: "", disposition: ""}] as $list
            | $list | map(. as $p
                | ($list | map(select(.carried_from == $p.id)) | first) as $later
                | (if $p.reply == null then "none" else ($p.reply.body | classify) end) as $d
                | .carried_to = (if $later != null then $later.id elif $d == "carried" then ($p.reply.body | capture("carried forward as (?<to>R[0-9]+-[0-9]+)") | .to) else "" end)
                | .disposition = (if $later != null then "carried" else $d end))
            | sort_by(.round, (.id | capture("-(?<k>[0-9]+)$") | .k | tonumber))'
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

    threads)
        [[ $# -eq 1 ]] || usage
        need_int "$1" "pr number"
        review_threads "$1" || exit 2
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
        hunks="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        response="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        gh_err="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        sourced="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        too_large="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        trap 'rm -f "$hunks" "$response" "$gh_err" "$sourced" "$too_large"' EXIT
        recover_hunks "$1" "$all" "$2" "$hunks"
        # The files whose hunks did not come from the listing: the only ones a refusal is acted on for.
        { grep $'^@@@redline-file\t' "$hunks" || true; } | cut -f2 > "$sourced"
        listing_only=0 refusal=''
        # Each pass ends the loop, adds one sourced file to too_large, or sets listing_only, which
        # is set once: at most one post per sourced file, one more, and the last (#96).
        while :; do
            placed="$(place_comments "$all" "$2" "$hunks" "$too_large" "$listing_only" "$refusal")"
            # place_comments runs in a command substitution, where bash clears -e, so a jq that
            # fails inside it does not stop it: what it printed is checked before anything is
            # posted (#112, R1-9).
            if ! jq -e '(.body | type == "string") and (.comments | type == "array") and (.moved | type == "array")' <<<"$placed" >/dev/null 2>&1; then
                echo "redline-gh.sh: could not place the comments of $2; nothing was posted" >&2
                exit 2
            fi
            payload="$(jq '{event: "COMMENT", body: .body, comments: [.comments[] | {path, line, side, body}]}' <<<"$placed")"
            if gh api --method POST "repos/{owner}/{repo}/pulls/$1/reviews" --input - <<<"$payload" >"$response" 2>"$gh_err"; then
                cat "$gh_err" >&2
                break
            fi
            status="$(jq -r '.status // ""' "$response" 2>/dev/null || true)"
            # A host's error body may carry no status; gh's own line names the code whatever the
            # body holds (#112, R1-10).
            if [[ -z "$status" ]] && grep -qF '(HTTP 422)' "$gh_err"; then status=422; fi
            if [[ "$status" == "422" && "$listing_only" == 0 ]]; then
                named="$(jq -r '[.errors[]? | strings | capture("^Diff entry (?<path>.+) diff is too large$").path] | first // ""' "$response" 2>/dev/null || true)"
                if [[ -n "$named" ]] && grep -qxF -- "$named" "$sourced" && ! grep -qxF -- "$named" "$too_large"; then
                    printf '%s\n' "$named" >> "$too_large"
                    echo "redline-gh.sh: GitHub takes no comment on $named (its diff is too large); posting again with its comments in the review body" >&2
                    continue
                fi
                on_sourced="$(jq --rawfile sourced "$sourced" '($sourced | split("\n") | map(select(length > 0))) as $s | [.comments[].path | select(. as $p | $s | index($p) != null)] | length' <<<"$placed")"
                if [[ "$on_sourced" -gt 0 ]]; then
                    refusal="$(jq -r '[.errors[]? | if type == "string" then . else (.message // tostring) end] | if length > 0 then join("; ") else "" end' "$response" 2>/dev/null || true)"
                    if [[ -z "$refusal" ]]; then refusal="$(jq -r '.message // "422"' "$response" 2>/dev/null || echo 422)"; fi
                    refusal="${refusal//$'\n'/ }"
                    listing_only=1
                    echo "redline-gh.sh: GitHub refused the review ($refusal); posting again with only the comments on files the listing gives a patch for" >&2
                    continue
                fi
            fi
            # gh prints only the status line; the body carries GitHub's reason.
            cat "$gh_err" >&2
            jq -r '.message, (.errors // [] | .[] | tostring)' "$response" >&2 2>/dev/null || cat "$response" >&2
            exit 1
        done
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

    defer)
        [[ $# -eq 4 ]] || usage
        trap defer_cleanup EXIT
        trap 'exit 130' INT
        trap 'exit 143' TERM
        mode="$1" finding="$2" draft="$3" record="$4"
        case "$mode" in
            issue|draft) ;;
            *) echo "redline-gh.sh: defer takes issue or draft, got: $mode" >&2; exit 2 ;;
        esac
        if ! [[ "$finding" =~ ^[RH][0-9]+-[0-9]+$ ]]; then
            echo "redline-gh.sh: finding must be an id such as R1-4, got: $finding" >&2
            exit 2
        fi
        need_file "$draft" "issue draft"
        title="$(head -n 1 "$draft")"
        if [[ "$title" != "# "?* || -n "$(sed -n '2p' "$draft")" ]]; then
            echo "redline-gh.sh: $draft must open with \"# <title>\" and an empty line" >&2
            exit 2
        fi
        title="${title#\# }"
        # The draft's last line names the pull request, the round and the finding: text only the
        # issue made from this draft carries, which is what the lookup below searches for.
        marker="$(grep -v '^[[:space:]]*$' "$draft" | tail -n 1)"
        # The draft's path as the record, the reply and the handoff give it: from its repository's
        # root, or as given when it sits in none.
        dir="$(cd "$(dirname "$draft")" && pwd)"
        if prefix="$(git -C "$dir" rev-parse --show-prefix 2>/dev/null)"; then
            path="$prefix$(basename "$draft")"
        else
            path="$draft"
        fi
        existing='{}'
        if [[ -f "$record" ]] && ! existing="$(jq -ce 'select(type == "object")' "$record" 2>/dev/null)"; then
            echo "redline-gh.sh: $record is not a JSON object" >&2
            exit 2
        fi
        held="$(jq -c --arg id "$finding" '.[$id] // null' <<<"$existing")"
        if [[ "$(jq -r '.where // ""' <<<"$held")" == "issue" ]]; then
            defer_print "$finding" "$held" true
            exit 0
        fi
        if [[ "$mode" == "draft" ]]; then
            entry="$(jq -cn --arg path "$path" '{where: "draft", path: $path}')"
            defer_record "$record" "$finding" "$entry"
            defer_print "$finding" "$entry" false
            exit 0
        fi
        # The second layer under the record: an issue opened by a run that died before it wrote
        # the record is found by the draft's last line, matched as a whole line of the body, never
        # by the search's own idea of a match. GitHub's search can lag by seconds, so this is best
        # effort; the record is what makes a repeat safe. A failed call exits 1, as the header says,
        # whatever status gh gave it: 4 when it needs a login (#97, R4-1).
        found="$(gh issue list --state all --search "\"$marker\" in:body" --json number,url,body --limit 20)" || { echo 'redline-gh.sh: the lookup on GitHub failed' >&2; exit 1; }
        match="$(jq -c --arg m "$marker" '[.[] | select((.body // "") | split("\n") | map(sub("\r$"; "")) | index($m) != null)] | sort_by(.number) | first // null' <<<"$found")"
        if [[ "$match" != "null" ]]; then
            entry="$(jq -c --arg path "$path" '{where: "issue", number: .number, url: .url, path: $path}' <<<"$match")"
            defer_record "$record" "$finding" "$entry"
            defer_print "$finding" "$entry" true
            exit 0
        fi
        defer_body="$(mktemp "${TMPDIR:-/tmp}/redline-gh.XXXXXX")"
        tail -n +3 "$draft" > "$defer_body"
        url="$(gh issue create --title "$title" --body-file "$defer_body")" || { echo 'redline-gh.sh: the create on GitHub failed' >&2; exit 1; }
        number="${url##*/}"
        if ! [[ "$number" =~ ^[0-9]+$ ]]; then
            echo "redline-gh.sh: gh issue create printed no issue URL: $url" >&2
            exit 1
        fi
        entry="$(jq -cn --arg path "$path" --arg url "$url" --argjson number "$number" '{where: "issue", number: $number, url: $url, path: $path}')"
        defer_record "$record" "$finding" "$entry"
        defer_print "$finding" "$entry" false
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

    resolve-threads)
        [[ $# -ge 2 ]] || usage
        need_int "$1" "pr number"
        pr_n="$1"
        shift
        for id in "$@"; do need_int "$id" "comment id"; done
        threads="$(review_threads "$pr_n")" || exit 2
        ids="$(jq -cn '$ARGS.positional | map(tonumber)' --args "$@")"
        # Which threads the ids name, and which of those to resolve: open and every comment one of
        # the ids. The rest are skipped with the reason; an id in no thread is skipped last.
        plan="$(jq -c --argjson ids "$ids" '
            ($ids | map({key: tostring, value: true}) | from_entries) as $given
            | def mine: $given[(.id | tostring)] == true;
            [.[] | select(any(.comments[]; mine))] as $hit
            | ($hit | map(.comments[].id)) as $covered
            | {
                resolve: [$hit[] | select((.resolved | not) and all(.comments[]; mine)) | {id: .comments[0].id, thread: .id}],
                skipped: ([$hit[] | select(.resolved or (all(.comments[]; mine) | not))
                           | {id: .comments[0].id, reason: (
                               if .resolved then "already resolved"
                               elif (.comments[0] | mine | not) then "opened by comment \(.comments[0].id), not Redline'"'"'s"
                               elif (.comments[-1] | mine | not) then "last comment \(.comments[-1].id) is not Redline'"'"'s"
                               else "comment \(first(.comments[] | select(mine | not)).id) is not Redline'"'"'s" end)}]
                          + [$ids[] | select(. as $i | $covered | index($i) | not) | {id: ., reason: "no thread holds comment \(.)"}])
              }' <<<"$threads")"
        resolved='[]'
        while IFS=$'\t' read -r cid tid; do
            [[ -n "$tid" ]] || continue
            gh api graphql -f query="$RESOLVE_MUTATION" -F threadId="$tid" >/dev/null || exit 1
            resolved="$(jq --argjson cid "$cid" --arg tid "$tid" '. + [{id: $cid, thread: $tid}]' <<<"$resolved")"
        done <<<"$(jq -r '.resolve[] | "\(.id)\t\(.thread)"' <<<"$plan")"
        jq -n --argjson resolved "$resolved" --argjson skipped "$(jq '.skipped' <<<"$plan")" '{resolved: $resolved, skipped: $skipped}'
        ;;

    -h|--help|help)
        usage
        ;;

    *)
        echo "redline-gh.sh: unknown subcommand $cmd" >&2
        usage
        ;;
esac
