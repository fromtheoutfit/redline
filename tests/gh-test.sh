#!/usr/bin/env bash
#
# Unit test of the read subcommands of scripts/redline-gh.sh that a large pull request exercises:
# files, diff, place, last-round and has-review, against the fixtures under tests/gh-fixtures/.
# Nothing reaches GitHub: a `gh` shim first on PATH serves the fixtures by endpoint (an array of
# pages for --paginate --slurp, the pages' lines for --paginate --jq, applied with the real jq),
# refuses `gh pr diff` the way GitHub does over 300 files, refuses every write, and, with
# GH_FAKE_OLD=1, rejects --slurp the way a gh before 2.48.0 does. PR 7 has 150 files over two
# pages (100 generated, then 44 generated and the six special files in files-7-special.json:
# two hunks, no patch, a rename with a patch, a patch-less rename with no text changes, a
# patch-less rename that changed, a removal) and five reviews; PR 8 has one human review. PR 10 is
# the human-review fixture (#36): a Redline round with its replies, a teammate's submitted review of
# three comments (one already answered by a Redline human review reply, one with a null line), their
# reply inside a Redline thread, their single comment outside a review, the author's hand reply, and
# one Redline human review summary among the issue comments.
# Runs in a throwaway repository under the system temp directory.
#
#   tests/gh-test.sh

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GH_SH="$PLUGIN/scripts/redline-gh.sh"
FIX="$PLUGIN/tests/gh-fixtures"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/redline-gh-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/bin" "$WORK/repo" "$WORK/pages"
git -C "$WORK/repo" init -q
pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }
# is <name> <got> <want>
is() { [[ "$2" == "$3" ]] && ok "$1" || bad "$1" "$2"; }
# has <name> <haystack> <needle>: a fixed-string containment check
has() { [[ "$2" == *"$3"* ]] && ok "$1" || bad "$1" "$(printf '%s' "$2" | head -c 400)"; }

# The two pages of PR 7's files: generated filler around the special files, 150 in all.
jq -n '[range(100) | {filename: "app/Gen\(.).php", status: "modified", previous_filename: null, patch: "@@ -1,2 +1,2 @@\n-old \(.)\n+new \(.)\n keep"}]' > "$WORK/pages/files-7-page1.json"
jq -n --slurpfile special "$FIX/files-7-special.json" '[range(100; 144) | {filename: "app/Gen\(.).php", status: "modified", previous_filename: null, patch: "@@ -1,2 +1,2 @@\n-old \(.)\n+new \(.)\n keep"}] + $special[0]' > "$WORK/pages/files-7-page2.json"
cp "$FIX/reviews-7.json" "$FIX/reviews-8.json" "$FIX/reviews-10.json" "$FIX/comments-10.json" "$FIX/issue-comments-10.json" "$WORK/pages/"
# PR 8 has no inline comment and one plain issue comment; the fake gh's user is the author.
echo '[]' > "$WORK/pages/comments-8.json"
echo '[{"id": 1, "user": {"login": "marcamos"}, "body": "Looks fine."}]' > "$WORK/pages/issue-comments-8.json"
echo '{"login": "author"}' > "$WORK/pages/user.json"
# PR 9: one generated file of 60,000 added lines, so the positions list runs to megabytes, past
# what a command-line argument may carry (Losers League #778, 336 files, hit that limit).
jq -n '[{filename: "public/build/vendor.js", status: "added", previous_filename: null, patch: ("@@ -0,0 +1,60000 @@\n" + ([range(60000) | "+line \(.)"] | join("\n")))}]' > "$WORK/pages/files-9-page1.json"
jq -n '{body: "Redline round 1", comments: [{path: "public/build/vendor.js", line: 59999, body: "**R1-1** · nit · low · likely\n\n**Deep in a generated file**"}, {path: "public/build/vendor.js", line: 60001, body: "**R1-2** · nit · low · likely\n\n**Past its end**"}]}' > "$WORK/review-9.json"

cat > "$WORK/bin/gh" <<'SHIM'
#!/usr/bin/env bash
# fake gh for tests/gh-test.sh: fixtures from $PAGES, an old gh when GH_FAKE_OLD=1
set -uo pipefail
if [[ "${1:-}" == "--version" ]]; then echo "gh version 2.40.0 (2023-12-01)"; echo "https://github.com/cli/cli/releases/tag/v2.40.0"; exit 0; fi
if [[ "${1:-}" == "pr" && "${2:-}" == "diff" ]]; then echo "could not find pull request diff: HTTP 406: Sorry, the diff exceeded the maximum number of files (300). Consider using 'List pull requests files' API or locally cloning the repository instead." >&2; exit 1; fi
if [[ "${1:-}" != "api" ]]; then echo "fake gh: unexpected call: $*" >&2; exit 1; fi
shift
paginate=0; slurp=0; filter=""; endpoint=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --paginate) paginate=1; shift ;;
        --slurp) slurp=1; shift ;;
        --jq) filter="$2"; shift 2 ;;
        --method|--input|-X|-f|-F) echo "fake gh: write call refused: $*" >&2; exit 1 ;;
        *) endpoint="$1"; shift ;;
    esac
done
if [[ "$slurp" == 1 && "${GH_FAKE_OLD:-0}" == 1 ]]; then echo "unknown flag: --slurp" >&2; exit 1; fi
case "$endpoint" in
    "repos/{owner}/{repo}/pulls/7/files") pages=("$PAGES/files-7-page1.json" "$PAGES/files-7-page2.json") ;;
    "repos/{owner}/{repo}/pulls/7/reviews") pages=("$PAGES/reviews-7.json") ;;
    "repos/{owner}/{repo}/pulls/9/files") pages=("$PAGES/files-9-page1.json") ;;
    "repos/{owner}/{repo}/pulls/8/reviews") pages=("$PAGES/reviews-8.json") ;;
    "repos/{owner}/{repo}/pulls/8/comments") pages=("$PAGES/comments-8.json") ;;
    "repos/{owner}/{repo}/issues/8/comments") pages=("$PAGES/issue-comments-8.json") ;;
    "repos/{owner}/{repo}/pulls/10/reviews") pages=("$PAGES/reviews-10.json") ;;
    "repos/{owner}/{repo}/pulls/10/comments") pages=("$PAGES/comments-10.json") ;;
    "repos/{owner}/{repo}/issues/10/comments") pages=("$PAGES/issue-comments-10.json") ;;
    "user") pages=("$PAGES/user.json") ;;
    *) echo "fake gh: no fixture for $endpoint" >&2; exit 1 ;;
esac
if [[ "$slurp" == 1 ]]; then
    jq -s '.' "${pages[@]}"
elif [[ -n "$filter" ]]; then
    for p in "${pages[@]}"; do jq -r "$filter" "$p"; done
else
    cat "${pages[@]}"
fi
SHIM
chmod +x "$WORK/bin/gh"
export PATH="$WORK/bin:$PATH" PAGES="$WORK/pages"
cd "$WORK/repo"
gh() { "$GH_SH" "$@"; }   # the script under test, not the shim

echo "# files"
out="$(GH_FAKE_OLD=1 gh files 7 2>"$WORK/err")"; code=$?
is "old gh: files exits 2" "$code" "2"
has "old gh: names the installed version and the minimum" "$(cat "$WORK/err")" "redline-gh.sh: gh version 2.40.0 (2023-12-01) does not know --slurp; Redline needs gh 2.48.0 or newer"
is "old gh: prints nothing on stdout" "$out" ""
files="$(gh files 7)"; code=$?
is "files: exits 0" "$code" "0"
is "files: 150 paths, past the 100 of gh pr view" "$(jq 'length' <<<"$files")" "150"
is "files: page order, first" "$(jq -r '.[0]' <<<"$files")" "app/Gen0.php"
is "files: page order, 101st is the first of page 2" "$(jq -r '.[100]' <<<"$files")" "app/Gen100.php"
is "files: page order, last" "$(jq -r '.[-1]' <<<"$files")" "app/Legacy/Gone.php"
is "files: a file without a patch is still listed" "$(jq -r 'index("public/build/app.js") != null' <<<"$files")" "true"
is "files: a renamed file is listed under its new name" "$(jq -r 'index("app/Services/NewName.php") != null and index("app/Services/OldName.php") == null' <<<"$files")" "true"

echo "# diff"
diff_out="$(gh diff 7 2>"$WORK/err")"; code=$?
is "diff: exits 0 (never gh pr diff, which the shim refuses)" "$code" "0"
is "diff: one header per file" "$(grep -c '^diff --git ' <<<"$diff_out")" "150"
has "diff: a modified file's header" "$diff_out" $'diff --git a/app/Models/Order.php b/app/Models/Order.php\n--- a/app/Models/Order.php\n+++ b/app/Models/Order.php\n@@ -10,3 +10,4 @@ class Order'
has "diff: both hunks verbatim" "$diff_out" $'+added two\n context b\n@@ -40,2 +41,3 @@\n context c\n+added three\n context d'
has "diff: a rename's old name on the a/ side" "$diff_out" $'diff --git a/app/Services/OldName.php b/app/Services/NewName.php\n--- a/app/Services/OldName.php\n+++ b/app/Services/NewName.php'
has "diff: an added file comes from /dev/null" "$diff_out" $'diff --git a/public/build/app.js b/public/build/app.js\n--- /dev/null\n+++ b/public/build/app.js\n(no patch: binary or too large for GitHub)'
has "diff: a removed file goes to /dev/null" "$diff_out" $'--- a/app/Legacy/Gone.php\n+++ /dev/null\n@@ -1,2 +0,0 @@'
is "diff: two binary-or-too-large lines" "$(grep -c '^(no patch: binary or too large for GitHub)$' <<<"$diff_out")" "2"
has "diff: a rename with no text changes says so" "$diff_out" $'diff --git a/app/Services/Was.php b/app/Services/Moved.php\n--- a/app/Services/Was.php\n+++ b/app/Services/Moved.php\n(no patch: renamed, no text changes)'
has "diff: a changed rename without a patch is not called unchanged" "$diff_out" $'+++ b/public/build/vendor.min.js\n(no patch: binary or too large for GitHub)'

echo "# place"
placed="$(gh place 7 "$FIX/review-7.json")"; code=$?
is "place: exits 0" "$code" "0"
is "place: the comments on hunk lines stay inline" "$(jq -r '[.comments[].body | capture("^\\*\\*(?<id>R1-[0-9]+)\\*\\*").id] | join(",")' <<<"$placed")" "R1-1,R1-2,R1-5"
is "place: side defaults to RIGHT" "$(jq -r '[.comments[].side] | join(",")' <<<"$placed")" "RIGHT,LEFT,RIGHT"
is "place: off-hunk and no-patch comments are moved, with their ids" "$(jq -c '.moved' <<<"$placed")" '[{"id":"R1-3","path":"app/Models/Order.php","line":30,"side":"RIGHT"},{"id":"R1-4","path":"public/build/app.js","line":1,"side":"RIGHT"}]'
body="$(jq -r '.body' <<<"$placed")"
has "place: the body keeps its text and gains the section" "$body" $'Five findings.\n\n### Not placed inline\n\n'
has "place: a moved comment carries its marker before its path and line" "$body" $'<!-- redline:R1-3 -->\n`app/Models/Order.php:30`\n\n**R1-3** · nit · low · likely'
has "place: the second moved comment too" "$body" $'<!-- redline:R1-4 -->\n`public/build/app.js:1`\n\n**R1-4**'
is "place: no marker for a placed comment" "$(grep -c 'redline:R1-1' <<<"$body")" "0"
placed2="$(gh place 7 "$FIX/review-7-placed.json")"
is "place: a context line of the second hunk anchors" "$(jq -r '.comments | length' <<<"$placed2")" "1"
is "place: nothing moved leaves the body alone" "$(jq -r '.body' <<<"$placed2")" $'Redline round 1\n\nOne finding, on a hunk.'
is "place: nothing moved is an empty list" "$(jq -c '.moved' <<<"$placed2")" "[]"

big="$(gh place 9 "$WORK/review-9.json" 2>"$WORK/err")"; code=$?
is "place: a megabyte of positions does not overflow the command line" "$code" "0"
is "place: the deep line anchors and the one past the end moves" "$(jq -r '[(.comments | length), (.moved | map(.id) | join(","))] | join(" ")' <<<"$big")" "1 R1-2"
is "place: positions never reach a command-line argument" "$(grep -c 'Argument list too long' "$WORK/err")" "0"

echo "# last-round and has-review"
is "last-round: the highest posted Redline round" "$(gh last-round 7)" "2"
is "last-round: a JSON number" "$(gh last-round 7 | jq -r 'type')" "number"
is "last-round: 0 when no Redline review exists" "$(gh last-round 8)" "0"
gh has-review 7 2 >/dev/null; is "has-review: round 2 is posted (exit 0)" "$?" "0"
gh has-review 7 3 >/dev/null; is "has-review: round 3 is not (exit 1)" "$?" "1"
gh has-review 7 9 >/dev/null; is "has-review: 'Redline roundabout 9' is not round 9" "$?" "1"
gh has-review 8 1 >/dev/null; is "has-review: no Redline review at all (exit 1)" "$?" "1"

echo "# human-review and last-human-review"
hr="$(gh human-review 10 @marcamos)"; code=$?
is "human-review @login: exits 0" "$code" "0"
is "human-review @login: every un-replied comment by that login, in path, line, id order" "$(jq -c '[.comments[].id]' <<<"$hr")" "[904,907,905,909]"
is "human-review @login: a reply inside a Redline thread carries its root as thread_id" "$(jq -c '.comments[0] | [.thread_id, .in_reply_to_id, .review_id, .user, .path, .line]' <<<"$hr")" '[902,902,5,"marcamos","app/b.php",9]'
is "human-review @login: a top-level comment is its own thread" "$(jq -c '.comments[2] | [.thread_id, .in_reply_to_id]' <<<"$hr")" "[905,null]"
is "human-review @login: a null line falls back to original_line, side as given" "$(jq -c '.comments[1] | [.line, .side, .body]' <<<"$hr")" '[1,"LEFT","Nice."]'
is "human-review @login: the comment a Redline human review reply answered is left out" "$(jq -c '[.comments[].id] | index(906)' <<<"$hr")" "null"
is "human-review @login: the body is the newest non-empty review body by that login" "$(jq -c '.body' <<<"$hr")" '{"review_id":7,"user":"marcamos","text":"Two things inline, one general: the empty case needs a test somewhere."}'
is "human-review @login: reviews lists the ones the comments and body came from" "$(jq -c '[.reviews[] | [.id, .user, .state]]' <<<"$hr")" '[[5,"marcamos","COMMENTED"],[7,"marcamos","COMMENTED"],[8,"marcamos","COMMENTED"]]'
is "human-review @login: the selector is echoed" "$(jq -r '.selector' <<<"$hr")" "@marcamos"
byid="$(gh human-review 10 7)"
is "human-review <id>: that review's un-replied comments and its body" "$(jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]' <<<"$byid")" "[[907,905],7,[7]]"
latest="$(gh human-review 10 latest)"
is "human-review latest: the newest review not Redline's and not the gh user's, with a comment or a body" "$(jq -c '[[.comments[].id], .body, [.reviews[].id]]' <<<"$latest")" "[[909],null,[8]]"
author="$(gh human-review 10 @author)"
is "human-review @author: Redline's own comments and replies never appear; a hand reply does; no non-empty body" "$(jq -c '[[.comments[].id], .body]' <<<"$author")" "[[910],null]"
is "human-review <id> of a Redline review: nothing" "$(jq -c '[.comments, .body, .reviews]' <<<"$(gh human-review 10 2)")" "[[],null,[]]"
is "human-review: a login with no comment is empty, exit 0" "$(gh human-review 10 @nobody | jq -c '[.comments, .body]')" "[[],null]"
is "last-human-review: the highest Redline human review N across replies and issue comments" "$(gh last-human-review 10)" "1"
is "last-human-review: a JSON number" "$(gh last-human-review 10 | jq -r 'type')" "number"
is "last-human-review: 0 when none" "$(gh last-human-review 8)" "0"

echo "# usage"
gh human-review 10 2>/dev/null; is "usage: human-review without a selector exits 2" "$?" "2"
gh human-review 10 seven 2>/dev/null; is "usage: human-review with a selector that is not an id, @login or latest exits 2" "$?" "2"
gh last-human-review 2>/dev/null; is "usage: last-human-review without a number exits 2" "$?" "2"
gh files 2>/dev/null; is "usage: files without a number exits 2" "$?" "2"
gh last-round x 2>/dev/null; is "usage: last-round with a non-number exits 2" "$?" "2"
gh place 7 "$WORK/missing.json" 2>/dev/null; is "usage: place with a missing file exits 2" "$?" "2"
gh --help 2>"$WORK/err"; code=$?
is "usage: --help exits 2" "$code" "2"
has "usage: --help prints the writes section to its last line" "$(grep -v '^$' "$WORK/err" | tail -1)" "unless it already exists (a re-run keeps the first, older body)"
is "usage: --help stops at the header's end" "$(grep -c 'set -euo pipefail' "$WORK/err")" "0"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]]
