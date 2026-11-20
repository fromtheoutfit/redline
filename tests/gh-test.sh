#!/usr/bin/env bash
#
# Unit test of the read subcommands of scripts/redline-gh.sh that a large pull request exercises:
# files, diff, place, last-round and has-review, and of defer, the one subcommand that opens an
# issue (#95), against the fixtures under tests/gh-fixtures/.
# Nothing reaches GitHub: a `gh` shim first on PATH serves the fixtures by endpoint (an array of
# pages for --paginate --slurp, the pages' lines for --paginate --jq, applied with the real jq),
# refuses `gh pr diff` the way GitHub does over 300 files, refuses every write but the three named
# below (the thread mutation, `gh issue create` and PR 20's review), and, with
# GH_FAKE_OLD=1, rejects --slurp the way a gh before 2.48.0 does. PR 7 has 150 files over two
# pages (100 generated, then 44 generated and the six special files in files-7-special.json:
# two hunks, no patch, a rename with a patch, a patch-less rename with no text changes, a
# patch-less rename that changed, a removal) and five reviews; PR 8 has one human review. PR 10 is
# the human-review fixture (#36): a Redline round with its replies, a teammate's submitted review of
# three comments (one already answered by a Redline human review reply, one with a null line), their
# reply inside a Redline thread, their single comment outside a review, the author's hand reply, and
# one Redline human review summary among the issue comments. PR 11 is a thread two teammates share
# (#38, R1-1): under a teammate's comment, a Redline human review reply that names the one comment
# it answered, a second teammate's comment and the first teammate's follow-up. PR 12 is an answered
# review body (#38, R1-3): a teammate's review whose comment and body a Redline human review pass
# answered, the body by an issue comment whose header names the review, beside an older review of
# theirs whose body is still open and a comment of theirs that quotes the header without the marker.
# PR 13 is the review-thread fixture (#39), two GraphQL pages served to `threads` and
# `resolve-threads`: a Redline thread with its reply, one a teammate replied in after Redline, one a
# teammate opened, one already resolved, and one Redline thread with no reply yet, and one where a
# teammate commented between Redline's comment and its reply (#45, R1-2). PR 14 is the
# prior-findings fixture (#35): two Redline rounds, one finding per disposition (a fixed reply, no
# reply beside a teammate's, a dropped one, a body finding answered by an issue comment, a not
# changed one that round 2 carried as R2-2, a decided one, a round-2 finding a later run's reply resolved), an Already tracked line that is not a
# finding, and round 2's fresh finding with no reply. PR 15 is the posted-text fixture (#87): a
# finding line whose title is escaped and neutralised as the workflow writes it (`&lt;`, `&amp;`, the
# word joiner's reference `&#8288;` after `@`), carried by round 2, beside a For the person line and the set-aside block
# under its own `### Candidates set aside (N)` heading. PR 16 is the #93 fixture: two rounds in the
# layout that issue's review body has (items by kind, a could-not-confirm item with its Would confirm
# line, a scope-declined line that carries no bold id), with a declined reply in a thread and in an
# issue comment, a decided reply that only mentions a decline, and a rule's tail and reply naming the
# person by login and by the no-login fallback. PR 19 is the #95 fixture: one round whose replies
# open "deferred to #<n>" and "deferred; the issue draft is at", beside a dropped draft's reply and
# a deferral the person chose, which open with the decision. The shim is the
# one place a `gh api graphql` call is read rather than refused: a query serves the pages, a
# mutation appends its thread id and its text to $PAGES/resolved.log, which the cases read to pin
# which threads were resolved and that the mutation is the script's fixed string. It also answers
# `gh issue list` and `gh issue create` for `defer` (#95): each call is appended to
# $PAGES/issue.log (the search; the title and the body), a list is served from
# $PAGES/issues-list.json and a create is answered with an issue URL numbered from 123, so the
# cases pin that an issue is opened once, looked up before it is opened, and never opened twice.
# PR 20 is the patch-less fixture (#96): a listing in which a text file past the listing's limit, a
# removed file, a 22,000-change file and a text file whose changed line holds a NUL past byte 8,000
# (#112, R2-1) have no patch, beside a binary file, a rename with nothing changed and one
# small file with a patch, and a whole diff made by git in a throwaway repository,
# which the shim serves for the pull request's own endpoint under the diff media type (and refuses
# as GitHub does over 300 files when it has none, or with GH_FAKE_DIFF_FAIL=1). Every read is
# appended to $PAGES/api.log, endpoint then header, so the cases pin that the whole diff is read
# once when a comment names such a file and never otherwise. PR 21 is its counterpart past the
# whole diff's limit: 301 files over four pages, two of them without a patch, whose hunks can only
# come from the clone, which is the throwaway repository itself, with a base that moved on after
# the head branched and a rename that changed; the shim serves the pull request's base and head
# shas from $PAGES/pull-<n>.json, and the cases swap in shas the clone does not hold. PR 20's
# review is the one REST write the shim answers, for `post-review` (#96): each payload is appended
# to $PAGES/posts.log, and the post is refused with the 422 bodies GitHub gave the measurement,
# "Diff entry <path> diff is too large" for a comment on a path listed in $PAGES/too-large.txt
# and "Line could not be resolved" for one on a path in $PAGES/unresolved.txt or, with
# GH_FAKE_REFUSE_ALL=1, for every post, each body without its status field with
# GH_FAKE_NO_STATUS=1, as a host may give it; a post it takes is served back as the pull
# request's review comments, so the cases pin how many reviews were sent and what each one held.
# With GH_FAKE_TMP_WATCH=<dir>, a files read logs to $PAGES/tmp-watch.log how many of the
# script's temp files sit directly in <dir> while it is in flight, which is what an interrupt
# then would leave behind (#112, R2-3).
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
# hgit: the harness's own git, with the developer's configuration and environment shut out, so a
# fixture is the same on every machine: no global or system configuration, no user attributes
# file, GIT_DIFF_OPTS unset (#112, R2-4), and no configuration given through the environment,
# GIT_CONFIG_COUNT with its key and value pairs or the GIT_CONFIG_PARAMETERS that git -c hands to
# what it runs (#112, R3-3). The script under test runs its own git, which the
# hostile-configuration cases reach on purpose.
hgit() { env -u GIT_DIFF_OPTS -u GIT_CONFIG_PARAMETERS -u GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -c core.attributesFile=/dev/null "$@"; }
hgit -C "$WORK/repo" init -q
pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }
# is <name> <got> <want>
is() { [[ "$2" == "$3" ]] && ok "$1" || bad "$1" "$2"; }
# has <name> <haystack> <needle>: a fixed-string containment check
has() { [[ "$2" == *"$3"* ]] && ok "$1" || bad "$1" "$(printf '%s' "$2" | head -c 400)"; }
# leftover <dir>: how many of defer's temp files are left in the folder, 0 when none is.
leftover() {
    local f n=0
    for f in "$1"/.redline-deferred.*; do [[ -e "$f" ]] && n=$((n + 1)); done
    printf '%s\n' "$n"
}
# leftover_gh <dir>: how many of redline-gh.sh's temp files or folders are left in the folder.
leftover_gh() {
    local f n=0
    for f in "$1"/redline-gh.*; do [[ -e "$f" ]] && n=$((n + 1)); done
    printf '%s\n' "$n"
}

# The two pages of PR 7's files: generated filler around the special files, 150 in all.
jq -n '[range(100) | {filename: "app/Gen\(.).php", status: "modified", previous_filename: null, patch: "@@ -1,2 +1,2 @@\n-old \(.)\n+new \(.)\n keep"}]' > "$WORK/pages/files-7-page1.json"
jq -n --slurpfile special "$FIX/files-7-special.json" '[range(100; 144) | {filename: "app/Gen\(.).php", status: "modified", previous_filename: null, patch: "@@ -1,2 +1,2 @@\n-old \(.)\n+new \(.)\n keep"}] + $special[0]' > "$WORK/pages/files-7-page2.json"
cp "$FIX/reviews-7.json" "$FIX/reviews-8.json" "$FIX/reviews-10.json" "$FIX/comments-10.json" "$FIX/issue-comments-10.json" "$FIX/reviews-11.json" "$FIX/comments-11.json" "$FIX/issue-comments-11.json" "$FIX/reviews-12.json" "$FIX/comments-12.json" "$FIX/issue-comments-12.json" "$FIX/threads-13-page1.json" "$FIX/threads-13-page2.json" "$FIX/reviews-14.json" "$FIX/comments-14.json" "$FIX/issue-comments-14.json" "$FIX/reviews-15.json" "$FIX/comments-15.json" "$FIX/issue-comments-15.json" "$FIX/reviews-16.json" "$FIX/comments-16.json" "$FIX/issue-comments-16.json" "$FIX/reviews-17.json" "$FIX/comments-17.json" "$FIX/issue-comments-17.json" "$FIX/reviews-18.json" "$FIX/comments-18.json" "$FIX/issue-comments-18.json" "$FIX/reviews-19.json" "$FIX/comments-19.json" "$FIX/issue-comments-19.json" "$WORK/pages/"
# PR 8 has no inline comment and one plain issue comment; the fake gh's user is the author.
echo '[]' > "$WORK/pages/comments-8.json"
echo '[{"id": 1, "user": {"login": "marcamos"}, "body": "Looks fine."}]' > "$WORK/pages/issue-comments-8.json"
echo '{"login": "author"}' > "$WORK/pages/user.json"
# PR 9: one generated file of 60,000 added lines, so the positions list runs to megabytes, past
# what a command-line argument may carry (Losers League #778, 336 files, hit that limit).
jq -n '[{filename: "public/build/vendor.js", status: "added", previous_filename: null, patch: ("@@ -0,0 +1,60000 @@\n" + ([range(60000) | "+line \(.)"] | join("\n")))}]' > "$WORK/pages/files-9-page1.json"
jq -n '{body: "Redline round 1", comments: [{path: "public/build/vendor.js", line: 59999, body: "**R1-1** · nit · low · likely\n\n**Deep in a generated file**"}, {path: "public/build/vendor.js", line: 60001, body: "**R1-2** · nit · low · likely\n\n**Past its end**"}]}' > "$WORK/review-9.json"
# PR 20 (#96): files whose patch the listing omits. The listing is shaped as GitHub gave it for
# the measurement's pull request: a text file past the listing's per-file limit has no patch and
# `changes` above 0, a binary file no patch and `changes` 0. The whole diff is a real one, made by
# git in a throwaway repository, so its sections are what GitHub serves: src/big.js with two hunks
# in a section of about 290 KB, past the 100 KiB at which the listing drops a patch;
# data/huge.json with 22,000 changed lines, the size GitHub refused a comment on; a binary; a
# removed file; a rename with nothing changed. dist/absent.js is in the listing without a patch
# and in no diff, so nothing supplies its hunks.
# lib/nul.txt holds a NUL on its changed line 1500, past the 8,000 bytes git's binary test reads,
# so git diffs it as text and the NUL reaches the recovered hunks. That line is a hunk of its own,
# ahead of the file's other changes, and the file sorts before src/big.js, so the NUL sits in the
# first 32 KiB of the hunk stream, which is all of a file macOS's grep reads to call it binary
# (#112, R2-1).
# The repository that makes the diff is the one the script runs in, so it is also the clone the
# script reads when GitHub's whole diff cannot be had: PR 21 has 301 files, one past what that
# endpoint takes, and two of them without a patch, lib/local.txt and lib/new-name.txt, renamed
# from lib/old-name.txt with 600 of its 2,000 lines changed. Its base has moved on since the head
# branched: the base tip changes line 500 of lib/local.txt, which the head does not, so that line
# is in a diff against the base tip and in none against the merge base, which is the one GitHub
# shows. The shim serves each pull request's base and head shas from $PAGES/pull-<n>.json.
GEN="$WORK/repo"
mkdir -p "$GEN/src" "$GEN/data" "$GEN/assets" "$GEN/lib"
gen_commit() { hgit -C "$GEN" add -A && hgit -C "$GEN" -c user.name=redline -c user.email=redline@example.invalid -c commit.gpgsign=false commit -q -m "$1"; }
seq 1 3000 | awk '{printf "big %05d %080d\n", $1, 0}' > "$GEN/src/big.js"
seq 1 3000 | awk '{printf "nul %05d %080d\n", $1, 0}' > "$GEN/lib/nul.txt"
seq 1 12000 | awk '{printf "huge %05d %040d\n", $1, 0}' > "$GEN/data/huge.json"
seq 1 20 | awk '{print "small " $1}' > "$GEN/src/small.js"
seq 1 2000 | awk '{printf "gone %05d %050d\n", $1, 0}' > "$GEN/lib/gone.txt"
seq 1 5 | awk '{print "was " $1}' > "$GEN/lib/was.txt"
printf 'BIN\0base\n' > "$GEN/assets/logo.png"
seq 1 2400 | awk '{printf "local %05d %080d\n", $1, 0}' > "$GEN/lib/local.txt"
seq 1 2000 | awk '{printf "name %05d %080d\n", $1, 0}' > "$GEN/lib/old-name.txt"
# A name git quotes in a diff header ("b/lib/\345\220\215.txt"), as GitHub's whole diff does.
seq 1 2000 | awk '{printf "quoted %05d %080d\n", $1, 0}' > "$GEN/lib/名.txt"
gen_commit base
awk 'NR==100 || (NR>=1001 && NR<=2500) {print $0 " changed"; next} {print}' "$GEN/src/big.js" > "$GEN/t" && mv "$GEN/t" "$GEN/src/big.js"
awk 'NR>=2001 {print $0 " changed"; next} {print}' "$GEN/lib/nul.txt" > "$GEN/t"
{ head -n 1499 "$GEN/t"; printf 'nul 01500 changed, a NUL \0 past byte 8,000\n'; tail -n +1501 "$GEN/t"; } > "$GEN/lib/nul.txt" && rm "$GEN/t"
awk 'NR<=11000 {print $0 " changed"; next} {print}' "$GEN/data/huge.json" > "$GEN/t" && mv "$GEN/t" "$GEN/data/huge.json"
awk 'NR==10 {print $0 " changed"; next} {print}' "$GEN/src/small.js" > "$GEN/t" && mv "$GEN/t" "$GEN/src/small.js"
rm "$GEN/lib/gone.txt"
mv "$GEN/lib/was.txt" "$GEN/lib/renamed-only.txt"
printf 'BIN\0head\n' > "$GEN/assets/logo.png"
awk 'NR==100 || (NR>=1001 && NR<=2200) {print $0 " changed"; next} {print}' "$GEN/lib/local.txt" > "$GEN/t" && mv "$GEN/t" "$GEN/lib/local.txt"
awk 'NR>=1001 && NR<=1600 {print $0 " changed"; next} {print}' "$GEN/lib/old-name.txt" > "$GEN/lib/new-name.txt" && rm "$GEN/lib/old-name.txt"
awk 'NR>=1001 && NR<=1600 {print $0 " changed"; next} {print}' "$GEN/lib/名.txt" > "$GEN/t" && mv "$GEN/t" "$GEN/lib/名.txt"
gen_commit head
HEAD_SHA="$(hgit -C "$GEN" rev-parse HEAD)"; FORK_SHA="$(hgit -C "$GEN" rev-parse HEAD~1)"
hgit -C "$GEN" checkout -q --detach "$FORK_SHA"
awk 'NR==500 {print $0 " on the base"; next} {print}' "$GEN/lib/local.txt" > "$GEN/t" && mv "$GEN/t" "$GEN/lib/local.txt"
gen_commit "the base moves on"
BASE_TIP_SHA="$(hgit -C "$GEN" rev-parse HEAD)"
hgit -C "$GEN" checkout -q -
jq -n --arg base "$FORK_SHA" --arg head "$HEAD_SHA" '{base: {sha: $base}, head: {sha: $head}}' > "$WORK/pages/pull-20.json"
jq -n --arg base "$BASE_TIP_SHA" --arg head "$HEAD_SHA" '{base: {sha: $base}, head: {sha: $head}}' > "$WORK/pages/pull-21.json"
jq -n '[range(299) | {filename: "app/Gen\(.).php", status: "modified", previous_filename: null, changes: 2, patch: "@@ -1,2 +1,2 @@\n-old \(.)\n+new \(.)\n keep"}] + [
    {filename: "lib/local.txt", status: "modified", previous_filename: null, additions: 1201, deletions: 1201, changes: 2402, patch: null},
    {filename: "lib/new-name.txt", status: "renamed", previous_filename: "lib/old-name.txt", additions: 600, deletions: 600, changes: 1200, patch: null}
]' > "$WORK/pages/files-21-all.json"
jq '.[0:100]' "$WORK/pages/files-21-all.json" > "$WORK/pages/files-21-page1.json"
jq '.[100:200]' "$WORK/pages/files-21-all.json" > "$WORK/pages/files-21-page2.json"
jq '.[200:300]' "$WORK/pages/files-21-all.json" > "$WORK/pages/files-21-page3.json"
jq '.[300:]' "$WORK/pages/files-21-all.json" > "$WORK/pages/files-21-page4.json"
jq -n '{body: "Redline round 1\n\nFive findings.", comments: [
    {path: "lib/local.txt", line: 1500, body: "**R1-1** · nit · low · confirmed\n\n**On an added line**"},
    {path: "lib/local.txt", line: 98, body: "**R1-2** · nit · low · confirmed\n\n**On a context line**"},
    {path: "lib/local.txt", line: 500, body: "**R1-3** · nit · low · confirmed\n\n**Changed on the base only**"},
    {path: "lib/new-name.txt", line: 1300, body: "**R1-4** · nit · low · confirmed\n\n**In a renamed file**"},
    {path: "lib/new-name.txt", line: 5, body: "**R1-5** · nit · low · confirmed\n\n**In its unchanged part**"}
]}' > "$WORK/review-21.json"
# A git configuration that would move every hunk if the script did not pin its own flags.
printf '[diff]\n\tcontext = 0\n\tnoprefix = true\n\talgorithm = patience\n\tinterHunkContext = 40\n\trenames = false\n' > "$WORK/gitconfig"
# The whole diff the shim serves as GitHub's, from the fork to the head.
whole_diff() { hgit -C "$GEN" -c core.quotepath=true diff --no-color --no-ext-diff --src-prefix=a/ --dst-prefix=b/ -M "$FORK_SHA" "$HEAD_SHA"; }
whole_diff > "$WORK/pages/diff-20.txt"
jq -n '[
    {filename: "assets/logo.png", status: "modified", previous_filename: null, additions: 0, deletions: 0, changes: 0, patch: null},
    {filename: "data/huge.json", status: "modified", previous_filename: null, additions: 11000, deletions: 11000, changes: 22000, patch: null},
    {filename: "dist/absent.js", status: "modified", previous_filename: null, additions: 250, deletions: 250, changes: 500, patch: null},
    {filename: "lib/gone.txt", status: "removed", previous_filename: null, additions: 0, deletions: 2000, changes: 2000, patch: null},
    {filename: "lib/nul.txt", status: "modified", previous_filename: null, additions: 1001, deletions: 1001, changes: 2002, patch: null},
    {filename: "lib/renamed-only.txt", status: "renamed", previous_filename: "lib/was.txt", additions: 0, deletions: 0, changes: 0, patch: null},
    {filename: "lib/名.txt", status: "modified", previous_filename: null, additions: 600, deletions: 600, changes: 1200, patch: null},
    {filename: "src/big.js", status: "modified", previous_filename: null, additions: 1501, deletions: 1501, changes: 3002, patch: null},
    {filename: "src/small.js", status: "modified", previous_filename: null, additions: 1, deletions: 1, changes: 2, patch: "@@ -7,7 +7,7 @@ small 6\n small 7\n small 8\n small 9\n-small 10\n+small 10 changed\n small 11\n small 12\n small 13"}
]' > "$WORK/pages/files-20-page1.json"
jq -n '{body: "Redline round 1\n\nThree findings.", comments: [
    {path: "src/big.js", line: 1500, body: "**R1-1** · correctness · high · confirmed\n\n**On an added line**"},
    {path: "src/big.js", line: 1500, side: "LEFT", body: "**R1-2** · correctness · low · confirmed\n\n**On a removed line**"},
    {path: "src/big.js", line: 98, body: "**R1-3** · nit · low · confirmed\n\n**On a context line**"}
]}' > "$WORK/review-20-text.json"
jq -n '{body: "Redline round 1\n\nOne finding.", comments: [
    {path: "assets/logo.png", line: 1, body: "**R1-1** · nit · low · confirmed\n\n**In an image**"}
]}' > "$WORK/review-20-binary.json"
jq -n '{body: "Redline round 1\n\nNine findings.", comments: [
    {path: "src/small.js", line: 10, body: "**R1-1** · nit · low · confirmed\n\n**On a listed patch**"},
    {path: "dist/absent.js", line: 5, body: "**R1-2** · nit · low · confirmed\n\n**No source has it**"},
    {path: "assets/logo.png", line: 1, body: "**R1-3** · nit · low · confirmed\n\n**In an image**"},
    {path: "src/big.js", line: 500, body: "**R1-4** · nit · low · confirmed\n\n**Between the hunks**"},
    {path: "README.md", line: 1, body: "**R1-5** · nit · low · confirmed\n\n**Outside the pull request**"},
    {path: "lib/renamed-only.txt", line: 1, body: "**R1-6** · nit · low · confirmed\n\n**Only renamed**"},
    {path: "src/big.js", line: 1500, body: "**R1-7** · nit · low · confirmed\n\n**On an added line**"},
    {path: "src/small.js", line: 1, body: "**R1-8** · nit · low · confirmed\n\n**Above the hunk**"},
    {path: "lib/gone.txt", line: 10, side: "LEFT", body: "**R1-9** · nit · low · confirmed\n\n**In a removed file**"}
]}' > "$WORK/review-20-causes.json"
jq -n '{body: "Redline round 1\n\nTwo findings.", comments: [
    {path: "lib/nul.txt", line: 1500, body: "**R1-1** · nit · low · confirmed\n\n**On a line that holds a NUL**"},
    {path: "src/big.js", line: 1500, body: "**R1-2** · nit · low · confirmed\n\n**On another patch-less file**"}
]}' > "$WORK/review-20-nul.json"
# GNU awk keeps a NUL that macOS's awk drops, so the NUL cases run under it when it is installed:
# a folder holding awk as a link to gawk goes first on PATH for them. On a Linux runner the
# system awk keeps a NUL already (#112, R2-1).
mkdir -p "$WORK/gnu-awk"
if command -v gawk >/dev/null 2>&1; then ln -s "$(command -v gawk)" "$WORK/gnu-awk/awk"; fi

cat > "$WORK/bin/gh" <<'SHIM'
#!/usr/bin/env bash
# fake gh for tests/gh-test.sh: fixtures from $PAGES, an old gh when GH_FAKE_OLD=1
set -uo pipefail
if [[ "${1:-}" == "--version" ]]; then echo "gh version 2.40.0 (2023-12-01)"; echo "https://github.com/cli/cli/releases/tag/v2.40.0"; exit 0; fi
if [[ "${1:-}" == "pr" && "${2:-}" == "diff" ]]; then echo "could not find pull request diff: HTTP 406: Sorry, the diff exceeded the maximum number of files (300). Consider using 'List pull requests files' API or locally cloning the repository instead." >&2; exit 1; fi
# gh issue (#95), the one write besides the thread mutation that is answered rather than refused.
# `list` is logged with its search and served from $PAGES/issues-list.json ([] when absent);
# `create` is logged with its title and its body (as one JSON string) and answered with an issue
# URL, numbered from 123. GH_FAKE_LIST_FAIL=1 and GH_FAKE_CREATE_FAIL=1 fail them as GitHub would,
# with GH_FAKE_FAIL_CODE as the exit status (1 when unset; gh's own is 4 when it needs a login).
# GH_FAKE_CREATE_WRITES=<file> writes GH_FAKE_CREATE_TEXT into that file before the create answers,
# as a defer for another finding finishing while this one is on GitHub would (#97).
if [[ "${1:-}" == "issue" ]]; then
    sub="${2:-}"; shift 2
    title=""; body=""; search=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --title) title="$2"; shift 2 ;;
            --body-file) body="$2"; shift 2 ;;
            --search) search="$2"; shift 2 ;;
            --state|--json|--limit) shift 2 ;;
            *) echo "fake gh: unexpected issue argument $1" >&2; exit 1 ;;
        esac
    done
    case "$sub" in
        list)
            printf 'list\t%s\n' "$search" >> "$PAGES/issue.log"
            if [[ "${GH_FAKE_LIST_FAIL:-0}" == 1 ]]; then echo "HTTP 503: the search is unavailable" >&2; exit "${GH_FAKE_FAIL_CODE:-1}"; fi
            if [[ -f "$PAGES/issues-list.json" ]]; then cat "$PAGES/issues-list.json"; else echo '[]'; fi ;;
        create)
            if [[ "${GH_FAKE_CREATE_FAIL:-0}" == 1 ]]; then echo "HTTP 403: Resource not accessible by integration" >&2; exit "${GH_FAKE_FAIL_CODE:-1}"; fi
            n=$(( $(grep -c '^create' "$PAGES/issue.log" 2>/dev/null || true) + 123 ))
            printf 'create\t%s\t%s\n' "$title" "$(jq -Rs . "$body")" >> "$PAGES/issue.log"
            if [[ -n "${GH_FAKE_CREATE_WRITES:-}" ]]; then printf '%s\n' "${GH_FAKE_CREATE_TEXT:-}" > "$GH_FAKE_CREATE_WRITES"; fi
            echo "https://github.com/o/r/issues/$n" ;;
        *) echo "fake gh: unexpected issue subcommand $sub" >&2; exit 1 ;;
    esac
    exit 0
fi
if [[ "${1:-}" != "api" ]]; then echo "fake gh: unexpected call: $*" >&2; exit 1; fi
shift
# GraphQL (#39): the one call that carries fields. A query is served from the PR's thread pages; a
# mutation is logged (thread id, tab, the query text) and answered as GitHub would.
if [[ "${1:-}" == "graphql" ]]; then
    shift
    query=""; number=""; thread=""; slurp=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --paginate) shift ;;
            --slurp) slurp=1; shift ;;
            -f) [[ "$2" == query=* ]] || { echo "fake gh: unexpected field $2" >&2; exit 1; }; query="${2#query=}"; shift 2 ;;
            -F) case "$2" in
                    number=*) number="${2#number=}" ;;
                    threadId=*) thread="${2#threadId=}" ;;
                    owner=\{owner\}|name=\{repo\}) ;;
                    *) echo "fake gh: unexpected variable $2" >&2; exit 1 ;;
                esac; shift 2 ;;
            *) echo "fake gh: unexpected graphql argument $1" >&2; exit 1 ;;
        esac
    done
    if [[ "$query" == mutation* ]]; then
        printf '%s\t%s\n' "$thread" "$query" >> "$PAGES/resolved.log"
        jq -n --arg id "$thread" '{data: {resolveReviewThread: {thread: {id: $id, isResolved: true}}}}'
        exit 0
    fi
    case "$number" in
        13) pages=("$PAGES/threads-13-page1.json" "$PAGES/threads-13-page2.json") ;;
        *) echo "fake gh: no thread fixture for PR $number" >&2; exit 1 ;;
    esac
    if [[ "$slurp" == 1 ]]; then jq -s '.' "${pages[@]}"; else cat "${pages[@]}"; fi
    exit 0
fi
paginate=0; slurp=0; filter=""; endpoint=""; header=""; method=""; input=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --paginate) paginate=1; shift ;;
        --slurp) slurp=1; shift ;;
        --jq) filter="$2"; shift 2 ;;
        -H) header="$2"; shift 2 ;;
        --method) method="$2"; shift 2 ;;
        --input) input="$2"; shift 2 ;;
        -X|-f|-F) echo "fake gh: write call refused: $*" >&2; exit 1 ;;
        *) endpoint="$1"; shift ;;
    esac
done
# PR 20's review (#96), the one REST write that is answered: the payload is logged, then refused
# as GitHub refused the measurement's reviews (the JSON on stdout, gh's line on stderr, exit 1) or
# taken, in which case its comments become the pull request's review comments.
if [[ -n "$method" || -n "$input" ]]; then
    if [[ "$method" != "POST" || "$input" != "-" || "$endpoint" != "repos/{owner}/{repo}/pulls/20/reviews" ]]; then
        echo "fake gh: write call refused: $method $endpoint" >&2; exit 1
    fi
    payload="$(cat)"
    jq -c . <<<"$payload" >> "$PAGES/posts.log"
    # GH_FAKE_NO_STATUS=1 leaves the body's status field out, as a host's error body may (#112, R1-10).
    refuse() {
        jq -cn --arg e "$1" --arg nostatus "${GH_FAKE_NO_STATUS:-0}" '{message: "Unprocessable Entity", errors: [$e], documentation_url: "https://docs.github.com/rest/pulls/reviews#create-a-review-for-a-pull-request"} + (if $nostatus == "1" then {} else {status: "422"} end)'
        echo "gh: Unprocessable Entity (HTTP 422)" >&2
        exit 1
    }
    # named <file>: the first comment path of the payload that the file lists, or nothing.
    named() { jq -r --rawfile t "$1" '($t | split("\n") | map(select(length > 0))) as $l | [.comments[].path | select(. as $p | $l | index($p) != null)] | first // ""' <<<"$payload"; }
    large="$(named "$PAGES/too-large.txt")"
    if [[ -n "$large" ]]; then refuse "Diff entry $large diff is too large"; fi
    if [[ -n "$(named "$PAGES/unresolved.txt")" || "${GH_FAKE_REFUSE_ALL:-0}" == 1 ]]; then refuse "Line could not be resolved"; fi
    jq '[.comments | to_entries[] | .value + {id: (9001 + .key), pull_request_review_id: 900, in_reply_to_id: null}]' <<<"$payload" > "$PAGES/comments-20.json"
    echo '{"id": 900, "html_url": "https://github.com/o/r/pull/20#pullrequestreview-900"}'
    exit 0
fi
if [[ "$slurp" == 1 && "${GH_FAKE_OLD:-0}" == 1 ]]; then echo "unknown flag: --slurp" >&2; exit 1; fi
# Every read is logged, endpoint then header, so a case can pin how many calls a subcommand made.
printf '%s\t%s\n' "$endpoint" "$header" >> "$PAGES/api.log"
# GH_FAKE_TMP_WATCH=<dir>: on a files read, how many of redline-gh.sh's temp files sit directly
# in <dir> while the call is in flight, which is what an interrupt then would leave (#112, R2-3).
if [[ -n "${GH_FAKE_TMP_WATCH:-}" && "$endpoint" == */files ]]; then
    n=0
    for f in "$GH_FAKE_TMP_WATCH"/redline-gh.*; do [[ -f "$f" ]] && n=$((n + 1)); done
    printf '%s\n' "$n" >> "$PAGES/tmp-watch.log"
fi
# The whole-pull-request diff (#96): the pull request's own endpoint under the diff media type,
# served from $PAGES/diff-<n>.txt. With no such file, or with GH_FAKE_DIFF_FAIL=1, it is refused
# the way GitHub refuses a pull request over 300 files: the JSON on stdout, gh's line on stderr.
if [[ "$header" == "Accept: application/vnd.github.diff" ]]; then
    n="${endpoint##*/}"
    if [[ "$endpoint" == "repos/{owner}/{repo}/pulls/$n" && -f "$PAGES/diff-$n.txt" && "${GH_FAKE_DIFF_FAIL:-0}" != 1 ]]; then
        cat "$PAGES/diff-$n.txt"
        exit 0
    fi
    echo '{"message":"Sorry, the diff exceeded the maximum number of files (300). Consider using the List pull requests files API or locally cloning the repository instead.","errors":[{"resource":"PullRequest","field":"diff","code":"too_large"}],"status":"406"}'
    echo "gh: Sorry, the diff exceeded the maximum number of files (300). (HTTP 406)" >&2
    exit 1
fi
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
    "repos/{owner}/{repo}/pulls/11/reviews") pages=("$PAGES/reviews-11.json") ;;
    "repos/{owner}/{repo}/pulls/11/comments") pages=("$PAGES/comments-11.json") ;;
    "repos/{owner}/{repo}/issues/11/comments") pages=("$PAGES/issue-comments-11.json") ;;
    "repos/{owner}/{repo}/pulls/12/reviews") pages=("$PAGES/reviews-12.json") ;;
    "repos/{owner}/{repo}/pulls/12/comments") pages=("$PAGES/comments-12.json") ;;
    "repos/{owner}/{repo}/issues/12/comments") pages=("$PAGES/issue-comments-12.json") ;;
    "repos/{owner}/{repo}/pulls/14/reviews") pages=("$PAGES/reviews-14.json") ;;
    "repos/{owner}/{repo}/pulls/14/comments") pages=("$PAGES/comments-14.json") ;;
    "repos/{owner}/{repo}/issues/14/comments") pages=("$PAGES/issue-comments-14.json") ;;
    "repos/{owner}/{repo}/pulls/15/reviews") pages=("$PAGES/reviews-15.json") ;;
    "repos/{owner}/{repo}/pulls/15/comments") pages=("$PAGES/comments-15.json") ;;
    "repos/{owner}/{repo}/issues/15/comments") pages=("$PAGES/issue-comments-15.json") ;;
    "repos/{owner}/{repo}/pulls/16/reviews") pages=("$PAGES/reviews-16.json") ;;
    "repos/{owner}/{repo}/pulls/16/comments") pages=("$PAGES/comments-16.json") ;;
    "repos/{owner}/{repo}/issues/16/comments") pages=("$PAGES/issue-comments-16.json") ;;
    "repos/{owner}/{repo}/pulls/17/reviews") pages=("$PAGES/reviews-17.json") ;;
    "repos/{owner}/{repo}/pulls/17/comments") pages=("$PAGES/comments-17.json") ;;
    "repos/{owner}/{repo}/issues/17/comments") pages=("$PAGES/issue-comments-17.json") ;;
    "repos/{owner}/{repo}/pulls/18/reviews") pages=("$PAGES/reviews-18.json") ;;
    "repos/{owner}/{repo}/pulls/18/comments") pages=("$PAGES/comments-18.json") ;;
    "repos/{owner}/{repo}/issues/18/comments") pages=("$PAGES/issue-comments-18.json") ;;
    "repos/{owner}/{repo}/pulls/19/reviews") pages=("$PAGES/reviews-19.json") ;;
    "repos/{owner}/{repo}/pulls/19/comments") pages=("$PAGES/comments-19.json") ;;
    "repos/{owner}/{repo}/issues/19/comments") pages=("$PAGES/issue-comments-19.json") ;;
    "repos/{owner}/{repo}/pulls/20/files") pages=("$PAGES/files-20-page1.json") ;;
    "repos/{owner}/{repo}/pulls/20") pages=("$PAGES/pull-20.json") ;;
    "repos/{owner}/{repo}/pulls/20/comments") pages=("$PAGES/comments-20.json") ;;
    "repos/{owner}/{repo}/pulls/21/files") pages=("$PAGES/files-21-page1.json" "$PAGES/files-21-page2.json" "$PAGES/files-21-page3.json" "$PAGES/files-21-page4.json") ;;
    "repos/{owner}/{repo}/pulls/21") pages=("$PAGES/pull-21.json") ;;
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

echo "# place: a file whose patch the listing omits (#96)"
# diff_calls: how many times the whole-pull-request diff was read since api.log was emptied.
diff_calls() { grep -c $'\tAccept: application/vnd.github.diff$' "$PAGES/api.log" || true; }
: > "$PAGES/api.log"
text="$(gh place 20 "$WORK/review-20-text.json" 2>"$WORK/err")"; code=$?
is "place: a patch-less text file: exits 0" "$code" "0"
is "place: a patch-less text file: an added, a removed and a context line stay inline" "$(jq -r '[.comments[] | .side + " " + (.line | tostring)] | join(",")' <<<"$text")" "RIGHT 1500,LEFT 1500,RIGHT 98"
is "place: a patch-less text file: nothing is moved" "$(jq -c '.moved' <<<"$text")" "[]"
is "place: a patch-less text file: the body is left alone" "$(jq -r '.body' <<<"$text")" $'Redline round 1\n\nThree findings.'
is "place: a patch-less text file: the whole diff is read once" "$(diff_calls)" "1"
is "place: a patch-less text file: nothing on stderr" "$(cat "$WORK/err")" ""
: > "$PAGES/api.log"
binary="$(gh place 20 "$WORK/review-20-binary.json")"
is "place: a binary file: moved" "$(jq -c '.moved' <<<"$binary")" '[{"id":"R1-1","path":"assets/logo.png","line":1,"side":"RIGHT"}]'
is "place: a binary file: the body says why in one line" "$(jq -r '.body' <<<"$binary")" $'Redline round 1\n\nOne finding.\n\n### Not placed inline\n\nThe file is binary and has no hunks:\n\n<!-- redline:R1-1 -->\n`assets/logo.png:1`\n\n**R1-1** · nit · low · confirmed\n\n**In an image**'
is "place: a binary file: the listing says so, the whole diff is not read" "$(diff_calls)" "0"
: > "$PAGES/api.log"
causes="$(gh place 20 "$WORK/review-20-causes.json")"
is "place: causes: a listed patch, a recovered hunk and a removed file's line stay inline" "$(jq -r '[.comments[].body | capture("^\\*\\*(?<id>R1-[0-9]+)\\*\\*").id] | join(",")' <<<"$causes")" "R1-1,R1-7,R1-9"
is "place: causes: moved keeps the review's order and its shape" "$(jq -c '.moved' <<<"$causes")" '[{"id":"R1-2","path":"dist/absent.js","line":5,"side":"RIGHT"},{"id":"R1-3","path":"assets/logo.png","line":1,"side":"RIGHT"},{"id":"R1-4","path":"src/big.js","line":500,"side":"RIGHT"},{"id":"R1-5","path":"README.md","line":1,"side":"RIGHT"},{"id":"R1-6","path":"lib/renamed-only.txt","line":1,"side":"RIGHT"},{"id":"R1-8","path":"src/small.js","line":1,"side":"RIGHT"}]'
is "place: causes: one line for each cause, in a fixed order, its comments under it" "$(jq -r '.body' <<<"$causes")" $'Redline round 1\n\nNine findings.\n\n### Not placed inline\n\nThe file is not in this pull request:\n\n<!-- redline:R1-5 -->\n`README.md:1`\n\n**R1-5** · nit · low · confirmed\n\n**Outside the pull request**\n\nThe line is not in the pull request\'s diff:\n\n<!-- redline:R1-4 -->\n`src/big.js:500`\n\n**R1-4** · nit · low · confirmed\n\n**Between the hunks**\n\n<!-- redline:R1-8 -->\n`src/small.js:1`\n\n**R1-8** · nit · low · confirmed\n\n**Above the hunk**\n\nThe file is binary and has no hunks:\n\n<!-- redline:R1-3 -->\n`assets/logo.png:1`\n\n**R1-3** · nit · low · confirmed\n\n**In an image**\n\nThe file was renamed with no text changes and has no hunks:\n\n<!-- redline:R1-6 -->\n`lib/renamed-only.txt:1`\n\n**R1-6** · nit · low · confirmed\n\n**Only renamed**\n\nThe file\'s patch could not be had from GitHub\'s listing, its whole diff or this clone:\n\n<!-- redline:R1-2 -->\n`dist/absent.js:5`\n\n**R1-2** · nit · low · confirmed\n\n**No source has it**'
is "place: causes: three patch-less text files named, the whole diff read once" "$(diff_calls)" "1"
: > "$PAGES/api.log"
gh place 7 "$FIX/review-7.json" >/dev/null; gh place 7 "$FIX/review-7-placed.json" >/dev/null
is "place: no patch-less text file named, the whole diff is not read" "$(diff_calls)" "0"
has "place: PR 7's off-hunk comment sits under its cause" "$body" $'### Not placed inline\n\nThe line is not in the pull request\'s diff:\n\n<!-- redline:R1-3 -->'
has "place: PR 7's no-patch comment sits under its cause" "$body" $'The file is binary and has no hunks:\n\n<!-- redline:R1-4 -->'
# A comment with no path, as only a hand-written review file has (#112, R1-8): moved into the
# body, as before #96, never a jq error.
jq -n '{body: "Redline round 1\n\nTwo findings.", comments: [
    {line: 3, body: "**R1-1** · nit · low · confirmed\n\n**No path**"},
    {path: "README.md", line: 1, body: "**R1-2** · nit · low · confirmed\n\n**Outside the pull request**"}
]}' > "$WORK/review-20-nopath.json"
nopath_out="$(gh place 20 "$WORK/review-20-nopath.json" 2>"$WORK/err")"; code=$?
is "place: a comment with no path: exits 0, nothing on stderr" "$code $(cat "$WORK/err")" "0 "
is "place: a comment with no path: moved into the body, with the other" "$(jq -c '.moved' <<<"$nopath_out")" '[{"id":"R1-1","path":null,"line":3,"side":"RIGHT"},{"id":"R1-2","path":"README.md","line":1,"side":"RIGHT"}]'

echo "# place: the clone as the second source (#96)"
# sha_calls <n>: how many times the pull request's base and head shas were read since api.log was emptied.
sha_calls() { grep -c "^repos/{owner}/{repo}/pulls/$1"$'\t$' "$PAGES/api.log" || true; }
: > "$PAGES/api.log"
local_out="$(gh place 21 "$WORK/review-21.json" 2>"$WORK/err")"; code=$?
is "place: over 300 files: exits 0" "$code" "0"
is "place: over 300 files: the listing has 301" "$(gh files 21 | jq 'length')" "301"
is "place: over 300 files: added, context and renamed-file lines are placed from the clone" "$(jq -r '[.comments[].body | capture("^\\*\\*(?<id>R1-[0-9]+)\\*\\*").id] | join(",")' <<<"$local_out")" "R1-1,R1-2,R1-4"
is "place: over 300 files: the diff is against the merge base and follows the rename" "$(jq -r '.moved | map(.id) | join(",")' <<<"$local_out")" "R1-3,R1-5"
has "place: over 300 files: both off-hunk lines sit under their cause" "$(jq -r '.body' <<<"$local_out")" $'### Not placed inline\n\nThe line is not in the pull request\'s diff:\n\n<!-- redline:R1-3 -->\n`lib/local.txt:500`\n\n**R1-3** · nit · low · confirmed\n\n**Changed on the base only**\n\n<!-- redline:R1-5 -->'
is "place: over 300 files: the whole diff is not asked for" "$(diff_calls)" "0"
is "place: over 300 files: the two shas are read once" "$(sha_calls 21)" "1"
is "place: over 300 files: nothing on stderr" "$(cat "$WORK/err")" ""
pinned="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig" gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff is pinned against the user's git configuration" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$pinned")" '[[1500,98,1300],["R1-3","R1-5"]]'
diffopts="$(GIT_DIFF_OPTS=-u0 gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff is pinned against GIT_DIFF_OPTS, which git lets override -U" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$diffopts")" '[[1500,98,1300],["R1-3","R1-5"]]'
# Git's own binary test, which GitHub does not share (#112, R2-2): a user attributes file that
# unsets diff for the file, and a big-file threshold between its size (223,200 bytes) and the
# rename pair's (184,000 and 188,800). The clone's diff reads a wanted file as text, so both
# place as the default run does.
printf 'lib/local.txt -diff\n' > "$WORK/attributes"
printf '[core]\n\tattributesFile = %s\n' "$WORK/attributes" > "$WORK/gitconfig-attributes"
printf '[core]\n\tbigFileThreshold = 200k\n' > "$WORK/gitconfig-bigfile"
attributes="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig-attributes" gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff reads a file a user attributes file marks -diff as text" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$attributes")" '[[1500,98,1300],["R1-3","R1-5"]]'
bigfile="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig-bigfile" gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff reads a file past core.bigFileThreshold as text" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$bigfile")" '[[1500,98,1300],["R1-3","R1-5"]]'
# A diff.orderFile git cannot read (#112, R4-4): a relative one is read against the repository
# root, and git ends a porcelain diff whose order file it cannot read, so the script cancels the
# setting on that call (-O/dev/null), and the run places as the default one does.
printf '[diff]\n\torderFile = .redline-no-such-orderfile\n' > "$WORK/gitconfig-orderfile"
orderfile="$(GIT_CONFIG_GLOBAL="$WORK/gitconfig-orderfile" gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff cancels a diff.orderFile git cannot read" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$orderfile")" '[[1500,98,1300],["R1-3","R1-5"]]'
# A global pathspec setting beside the clone diff's --literal-pathspecs (#112, R3-1): git refuses
# glob or icase together with literal and exits, so the script unsets them on that call, and both
# place as the default run does.
icase="$(GIT_ICASE_PATHSPECS=1 gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff runs with GIT_ICASE_PATHSPECS unset, which git refuses beside literal pathspecs" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$icase")" '[[1500,98,1300],["R1-3","R1-5"]]'
globbed="$(GIT_GLOB_PATHSPECS=1 gh place 21 "$WORK/review-21.json")"
is "place: the clone's diff runs with GIT_GLOB_PATHSPECS unset, which git refuses beside literal pathspecs" "$(jq -c '[[.comments[].line], [.moved[].id]]' <<<"$globbed")" '[[1500,98,1300],["R1-3","R1-5"]]'
cp "$PAGES/pull-21.json" "$WORK/pull-21.json"
echo '{"base": {"sha": "1111111111111111111111111111111111111111"}, "head": {"sha": "2222222222222222222222222222222222222222"}}' > "$PAGES/pull-21.json"
nopatch="$(gh place 21 "$WORK/review-21.json" 2>"$WORK/err")"; code=$?
is "place: commits the clone does not hold: exits 0, nothing on stderr" "$code $(cat "$WORK/err")" "0 "
is "place: commits the clone does not hold: nothing is placed" "$(jq -r '[(.comments | length), (.moved | length)] | join(" ")' <<<"$nopatch")" "0 5"
has "place: commits the clone does not hold: the body says the patch could not be had" "$(jq -r '.body' <<<"$nopatch")" $'### Not placed inline\n\nThe file\'s patch could not be had from GitHub\'s listing, its whole diff or this clone:\n\n<!-- redline:R1-1 -->'
cp "$WORK/pull-21.json" "$PAGES/pull-21.json"
: > "$PAGES/api.log"
refused="$(GH_FAKE_DIFF_FAIL=1 gh place 20 "$WORK/review-20-text.json" 2>"$WORK/err")"; code=$?
is "place: the whole diff refused: exits 0, nothing on stderr" "$code $(cat "$WORK/err")" "0 "
is "place: the whole diff refused: the clone places all three" "$(jq -r '[(.comments | length), (.moved | length)] | join(" ")' <<<"$refused")" "3 0"
is "place: the whole diff refused: asked once, then the shas once" "$(diff_calls) $(sha_calls 20)" "1 1"
: > "$PAGES/api.log"
gh place 20 "$WORK/review-20-text.json" >/dev/null
is "place: the whole diff gave every file: the shas are not read" "$(diff_calls) $(sha_calls 20)" "1 0"
: > "$PAGES/api.log"
gh place 20 "$WORK/review-20-causes.json" >/dev/null
is "place: a file the whole diff lacks: the clone is asked, once" "$(diff_calls) $(sha_calls 20)" "1 1"
jq -n '{body: "Redline round 1\n\nOne finding.", comments: [{path: "lib/名.txt", line: 1300, body: "**R1-1** · nit · low · confirmed\n\n**In a file git quotes the name of**"}]}' > "$WORK/review-20-quoted.json"
: > "$PAGES/api.log"
quoted="$(gh place 20 "$WORK/review-20-quoted.json")"
is "place: a name a diff header quotes: the whole diff holds it quoted" "$(grep -c '^+++ "b/lib/' "$PAGES/diff-20.txt")" "1"
is "place: a name a diff header quotes: placed from the clone, which is asked not to quote it" "$(jq -c '[(.comments | length), (.moved | length)]' <<<"$quoted") $(diff_calls) $(sha_calls 20)" "[1,0] 1 1"
# A NUL in a recovered hunk (#112, R2-1): the file markers are still read, so both patch-less
# files keep their hunks and the whole diff is enough.
: > "$PAGES/api.log"
nul_out="$(PATH="$WORK/gnu-awk:$PATH" gh place 20 "$WORK/review-20-nul.json" 2>"$WORK/err")"; code=$?
is "place: a NUL in a recovered hunk: both patch-less files stay inline, nothing on stderr" "$code $(jq -c '[(.comments | length), (.moved | length)]' <<<"$nul_out") $(cat "$WORK/err")" "0 [2,0] "
is "place: a NUL in a recovered hunk: the whole diff gave both files, so the shas are not read" "$(diff_calls) $(sha_calls 20)" "1 0"
# The fixture's whole diff is the same under a developer's diff settings and GIT_DIFF_OPTS
# (#112, R2-4): made again under the hostile configuration above, it matches byte for byte.
is "the fixture's whole diff ignores the developer's git configuration and GIT_DIFF_OPTS" "$(if GIT_DIFF_OPTS=-u0 GIT_CONFIG_GLOBAL="$WORK/gitconfig" whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"
# The same under configuration given through the environment rather than a file (#112, R3-3):
# GIT_CONFIG_COUNT with a key and value pair, and GIT_CONFIG_PARAMETERS, which git -c hands to
# what it runs (an alias, a hook). Either would shrink the whole diff's context to none.
is "the fixture's whole diff ignores git configuration given through GIT_CONFIG_COUNT" "$(if GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=diff.context GIT_CONFIG_VALUE_0=0 whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"
is "the fixture's whole diff ignores git configuration given through GIT_CONFIG_PARAMETERS" "$(if GIT_CONFIG_PARAMETERS="'diff.context=0'" whole_diff | cmp -s - "$PAGES/diff-20.txt"; then echo same; else echo differs; fi)" "same"

echo "# post-review: a refusal the new sources can cause (#96)"
jq -n '{body: "Redline round 1\n\nFour findings.", comments: [
    {path: "src/small.js", line: 10, body: "**R1-1** · nit · low · confirmed\n\n**On a listed patch**"},
    {path: "src/big.js", line: 1500, body: "**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**"},
    {path: "data/huge.json", line: 5000, body: "**R1-3** · nit · low · confirmed\n\n**In a very large diff**"},
    {path: "assets/logo.png", line: 1, body: "**R1-4** · nit · low · confirmed\n\n**In an image**"}
]}' > "$WORK/review-20-post.json"
jq -n '{body: "Redline round 1\n\nTwo findings.", comments: [
    {path: "src/small.js", line: 10, body: "**R1-1** · nit · low · confirmed\n\n**On a listed patch**"},
    {path: "assets/logo.png", line: 1, body: "**R1-2** · nit · low · confirmed\n\n**In an image**"}
]}' > "$WORK/review-20-listed.json"
# fresh_posts: no review sent yet, and GitHub refuses nothing.
fresh_posts() { : > "$PAGES/posts.log"; : > "$PAGES/too-large.txt"; : > "$PAGES/unresolved.txt"; rm -f "$PAGES/comments-20.json"; }
posts() { wc -l < "$PAGES/posts.log" | tr -d ' '; }
# post_paths <k>: the paths of the inline comments the k-th review sent held.
post_paths() { sed -n "$1p" "$PAGES/posts.log" | jq -r '[.comments[].path] | join(",")'; }
post_body() { sed -n "$1p" "$PAGES/posts.log" | jq -r '.body'; }
BINARY_GROUP=$'The file is binary and has no hunks:\n\n<!-- redline:R1-4 -->\n`assets/logo.png:1`\n\n**R1-4** · nit · low · confirmed\n\n**In an image**'

fresh_posts
out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: a review GitHub takes: exits 0, posted once, nothing on stderr" "$code $(posts) $(cat "$WORK/err")" "0 1 "
is "post-review: a review GitHub takes: the patch-less files' comments go inline" "$(post_paths 1)" "src/small.js,src/big.js,data/huge.json"
is "post-review: a review GitHub takes: the output names the review, its comments and the moved one" "$(jq -c '[.review_id, [.comments[].id], [.moved[].id]]' <<<"$out")" '[900,[9001,9002,9003],["R1-4"]]'

fresh_posts; echo "data/huge.json" > "$PAGES/too-large.txt"
out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: too large: exits 0 after two posts" "$code $(posts)" "0 2"
is "post-review: too large: the first review held the file's comment" "$(post_paths 1)" "src/small.js,src/big.js,data/huge.json"
is "post-review: too large: the second review holds every other inline comment" "$(post_paths 2)" "src/small.js,src/big.js"
is "post-review: too large: the body says why, under the binary file's line" "$(post_body 2)" $'Redline round 1\n\nFour findings.\n\n### Not placed inline\n\n'"$BINARY_GROUP"$'\n\nGitHub takes no comment on a diff this large:\n\n<!-- redline:R1-3 -->\n`data/huge.json:5000`\n\n**R1-3** · nit · low · confirmed\n\n**In a very large diff**'
is "post-review: too large: moved names both, in the review's order" "$(jq -c '[.review_id, (.comments | length), [.moved[].id]]' <<<"$out")" '[900,2,["R1-3","R1-4"]]'
is "post-review: too large: one line on stderr, and not gh's" "$(cat "$WORK/err")" "redline-gh.sh: GitHub takes no comment on data/huge.json (its diff is too large); posting again with its comments in the review body"

fresh_posts; echo "src/big.js" > "$PAGES/unresolved.txt"
out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: a 422 that names no file: exits 0 after two posts" "$code $(posts)" "0 2"
is "post-review: a 422 that names no file: the second review holds only the listing's patches" "$(post_paths 2)" "src/small.js"
is "post-review: a 422 that names no file: the body says so, with GitHub's message" "$(post_body 2)" $'Redline round 1\n\nFour findings.\n\n### Not placed inline\n\n'"$BINARY_GROUP"$'\n\nGitHub refused a review that placed comments through its whole diff or this clone (Line could not be resolved), so these comments, on files its listing gives no patch for, are here:\n\n<!-- redline:R1-2 -->\n`src/big.js:1500`\n\n**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**\n\n<!-- redline:R1-3 -->\n`data/huge.json:5000`\n\n**R1-3** · nit · low · confirmed\n\n**In a very large diff**'
is "post-review: a 422 that names no file: moved names all three" "$(jq -c '[(.comments | length), [.moved[].id]]' <<<"$out")" '[1,["R1-2","R1-3","R1-4"]]'
is "post-review: a 422 that names no file: one line on stderr" "$(cat "$WORK/err")" "redline-gh.sh: GitHub refused the review (Line could not be resolved); posting again with only the comments on files the listing gives a patch for"
# The fallback with a comment the first pass found off the recovered hunks (#112, R1-6): it is
# on a sourced file, so it sits under the refused line too, whose words claim no placement.
jq -n '{body: "Redline round 1\n\nThree findings.", comments: [
    {path: "src/small.js", line: 10, body: "**R1-1** · nit · low · confirmed\n\n**On a listed patch**"},
    {path: "src/big.js", line: 1500, body: "**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**"},
    {path: "src/big.js", line: 500, body: "**R1-3** · nit · low · confirmed\n\n**Off the recovered hunks**"}
]}' > "$WORK/review-20-fallback.json"
fresh_posts; echo "src/big.js" > "$PAGES/unresolved.txt"
out="$(gh post-review 20 "$WORK/review-20-fallback.json" 2>"$WORK/err")"; code=$?
is "post-review: the fallback with an off-hunk comment: exits 0 after two posts, the second from the listing's patch" "$code $(posts) $(post_paths 2)" "0 2 src/small.js"
is "post-review: the fallback with an off-hunk comment: both sit under the refused line, which claims no placement" "$(post_body 2)" $'Redline round 1\n\nThree findings.\n\n### Not placed inline\n\nGitHub refused a review that placed comments through its whole diff or this clone (Line could not be resolved), so these comments, on files its listing gives no patch for, are here:\n\n<!-- redline:R1-2 -->\n`src/big.js:1500`\n\n**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**\n\n<!-- redline:R1-3 -->\n`src/big.js:500`\n\n**R1-3** · nit · low · confirmed\n\n**Off the recovered hunks**'

fresh_posts; echo "data/huge.json" > "$PAGES/too-large.txt"; echo "src/small.js" > "$PAGES/unresolved.txt"
out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: the fallback refused as well: exits 1 after three posts, nothing on stdout" "$code $(posts) $out" "1 3 "
is "post-review: the fallback refused as well: the third review was the listing's patches only" "$(post_paths 3)" "src/small.js"
has "post-review: the fallback refused as well: the too-large file kept its own line in that review" "$(post_body 3)" $'GitHub takes no comment on a diff this large:\n\n<!-- redline:R1-3 -->'
has "post-review: the fallback refused as well: gh's line reaches stderr" "$(cat "$WORK/err")" "gh: Unprocessable Entity (HTTP 422)"
has "post-review: the fallback refused as well: so does GitHub's reason" "$(cat "$WORK/err")" $'Unprocessable Entity\nLine could not be resolved'

fresh_posts
out="$(GH_FAKE_REFUSE_ALL=1 gh post-review 20 "$WORK/review-20-listed.json" 2>"$WORK/err")"; code=$?
is "post-review: a 422 with nothing placed through a source: one post, exit 1, as before" "$code $(posts) $out" "1 1 "
has "post-review: a 422 with nothing placed through a source: GitHub's reason on stderr" "$(cat "$WORK/err")" $'gh: Unprocessable Entity (HTTP 422)\nUnprocessable Entity\nLine could not be resolved'

# Comments the placement cannot read (#112, R1-9): a moved comment whose body is no string, which
# the jq that writes the review body cannot join, so post-review stops before it posts anything.
jq -n '{body: "Redline round 1\n\nOne finding.", comments: [{path: "README.md", line: 1, body: 5}]}' > "$WORK/review-20-unplaceable.json"
# taken: whether the shim took a review since fresh_posts, which a taken post writes comments-20.json for.
taken() { if [[ -e "$PAGES/comments-20.json" ]]; then echo taken; else echo none; fi; }
fresh_posts
out="$(gh post-review 20 "$WORK/review-20-unplaceable.json" 2>"$WORK/err")"; code=$?
is "post-review: comments that cannot be placed: exit 2, nothing on stdout" "$code $out" "2 "
has "post-review: comments that cannot be placed: one line naming the review file" "$(cat "$WORK/err")" "redline-gh.sh: could not place the comments of $WORK/review-20-unplaceable.json; nothing was posted"
is "post-review: comments that cannot be placed: GitHub is sent no review" "$(posts) $(taken)" "0 none"
# A comment that is not an object (#112, R3-2): the review file's own check reads every comment's
# shape, so post-review stops before the listing is read, with its own line and exit 2, never jq's.
jq -n '{body: "Redline round 1", comments: [1]}' > "$WORK/review-20-nonobject.json"
fresh_posts; : > "$PAGES/api.log"
out="$(gh post-review 20 "$WORK/review-20-nonobject.json" 2>"$WORK/err")"; code=$?
is "post-review: a comment that is not an object: exit 2, nothing on stdout" "$code $out" "2 "
is "post-review: a comment that is not an object: one line naming the review file" "$(cat "$WORK/err")" "redline-gh.sh: $WORK/review-20-nonobject.json must be JSON with body (string) and comments (an array of objects)"
is "post-review: a comment that is not an object: nothing is read and no review is sent" "$(wc -l < "$PAGES/api.log" | tr -d ' ') $(posts) $(taken)" "0 0 none"

# A 422 whose body carries no status (#112, R1-10): gh's own line says 422, and the refusal is acted on.
fresh_posts; echo "src/big.js" > "$PAGES/unresolved.txt"
out="$(GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: a 422 body with no status: the fallback still posts, from the listing's patches" "$code $(posts) $(post_paths 2)" "0 2 src/small.js"
is "post-review: a 422 body with no status: one line on stderr" "$(cat "$WORK/err")" "redline-gh.sh: GitHub refused the review (Line could not be resolved); posting again with only the comments on files the listing gives a patch for"
fresh_posts; echo "data/huge.json" > "$PAGES/too-large.txt"
out="$(GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: a too-large 422 with no status: posted again without that file's comment" "$code $(posts) $(post_paths 2)" "0 2 src/small.js,src/big.js"
fresh_posts
out="$(GH_FAKE_REFUSE_ALL=1 GH_FAKE_NO_STATUS=1 gh post-review 20 "$WORK/review-20-listed.json" 2>"$WORK/err")"; code=$?
is "post-review: a 422 with no status and nothing placed through a source: one post, exit 1, as before" "$code $(posts) $out" "1 1 "

# A run that fails leaves no temp file behind (#112, R1-2): every one sits in a folder the trap removes.
mkdir -p "$WORK/tmp-place" "$WORK/tmp-post"
TMPDIR="$WORK/tmp-place" gh place 20 "$WORK/review-20-unplaceable.json" >/dev/null 2>&1
is "place: a run that fails leaves no temp file behind" "$(leftover_gh "$WORK/tmp-place")" "0"
fresh_posts
TMPDIR="$WORK/tmp-post" gh post-review 20 "$WORK/review-20-unplaceable.json" >/dev/null 2>&1
is "post-review: a run that fails leaves no temp file behind" "$(leftover_gh "$WORK/tmp-post")" "0"

# Two files GitHub takes no comment on in one review (#112, R1-11): one post more for each, then the post.
fresh_posts; printf 'data/huge.json\nsrc/big.js\n' > "$PAGES/too-large.txt"
out="$(gh post-review 20 "$WORK/review-20-post.json" 2>"$WORK/err")"; code=$?
is "post-review: two too-large files: exits 0 after three posts, the last with the listing's patch only" "$code $(posts) $(post_paths 3)" "0 3 src/small.js"
is "post-review: two too-large files: both sit under the too-large line, in the review's order" "$(post_body 3)" $'Redline round 1\n\nFour findings.\n\n### Not placed inline\n\n'"$BINARY_GROUP"$'\n\nGitHub takes no comment on a diff this large:\n\n<!-- redline:R1-2 -->\n`src/big.js:1500`\n\n**R1-2** · nit · low · confirmed\n\n**On a recovered hunk**\n\n<!-- redline:R1-3 -->\n`data/huge.json:5000`\n\n**R1-3** · nit · low · confirmed\n\n**In a very large diff**'
is "post-review: two too-large files: one stderr line each, in the order GitHub named them" "$(cat "$WORK/err")" $'redline-gh.sh: GitHub takes no comment on src/big.js (its diff is too large); posting again with its comments in the review body\nredline-gh.sh: GitHub takes no comment on data/huge.json (its diff is too large); posting again with its comments in the review body'

# A NUL in a recovered hunk (#112, R2-1): post-review reads which files were sourced as place
# does, so GitHub's too-large refusal on that file is acted on.
fresh_posts; echo "lib/nul.txt" > "$PAGES/too-large.txt"
out="$(PATH="$WORK/gnu-awk:$PATH" gh post-review 20 "$WORK/review-20-nul.json" 2>"$WORK/err")"; code=$?
is "post-review: a NUL in a recovered hunk: the too-large refusal on that file is acted on" "$code $(posts) $(post_paths 2)" "0 2 src/big.js"
# An interrupt while the listing is read leaves nothing behind (#112, R2-3): pr_files' own temp
# file is made in the scratch folder too, so none sits directly in the temp directory then.
mkdir -p "$WORK/tmp-watch"; : > "$PAGES/tmp-watch.log"
GH_FAKE_TMP_WATCH="$WORK/tmp-watch" TMPDIR="$WORK/tmp-watch" gh place 20 "$WORK/review-20-text.json" >/dev/null 2>&1
fresh_posts
GH_FAKE_TMP_WATCH="$WORK/tmp-watch" TMPDIR="$WORK/tmp-watch" gh post-review 20 "$WORK/review-20-listed.json" >/dev/null 2>&1
is "place and post-review: no temp file sits outside the scratch folder while the listing is read" "$(tr '\n' ' ' < "$PAGES/tmp-watch.log")" "0 0 "

echo "# last-round and has-review"
is "last-round: the highest posted Redline round" "$(gh last-round 7)" "2"
is "last-round: a JSON number" "$(gh last-round 7 | jq -r 'type')" "number"
is "last-round: 0 when no Redline review exists" "$(gh last-round 8)" "0"
gh has-review 7 2 >/dev/null; is "has-review: round 2 is posted (exit 0)" "$?" "0"
gh has-review 7 3 >/dev/null; is "has-review: round 3 is not (exit 1)" "$?" "1"
gh has-review 7 9 >/dev/null; is "has-review: 'Redline roundabout 9' is not round 9" "$?" "1"
gh has-review 8 1 >/dev/null; is "has-review: no Redline review at all (exit 1)" "$?" "1"

echo "# prior-findings"
pf="$(gh prior-findings 14)"; code=$?
is "prior-findings: exits 0" "$code" "0"
is "prior-findings: every posted finding, by round then number; an Already tracked line is not a finding" "$(jq -c '[.[].id]' <<<"$pf")" '["R1-1","R1-2","R1-3","R1-4","R1-5","R1-6","R2-1","R2-2","R2-3","R2-4"]'
is "prior-findings: a fixed reply is fixed, with the thread's comment and reply ids" "$(jq -c '.[0] | [.disposition, .comment_id, .reply.id, .round, .review_id]' <<<"$pf")" '["fixed",1401,1411,1,20]'
is "prior-findings: the finding line's fields" "$(jq -c '.[0] | [.category, .severity, .confidence, .file, .line, .title]' <<<"$pf")" '["correctness","high","confirmed","app/a.php",5,"Missing status filter"]'
is "prior-findings: the inline body is the root comment's" "$(jq -r '.[0].body' <<<"$pf" | head -1)" "**R1-1** · correctness · high · confirmed"
is "prior-findings: no Redline reply is none; a teammate's reply is not a disposition" "$(jq -c '.[1] | [.disposition, .reply, .comment_id]' <<<"$pf")" '["none",null,1402]'
is "prior-findings: needs a decision is stripped from the title" "$(jq -r '.[1].title' <<<"$pf")" "Skin-toned emoji rejected"
is "prior-findings: a dropped reply is dropped, its text after the round prefix" "$(jq -c '.[2] | [.disposition, .reply.body]' <<<"$pf")" '["dropped","not acted on in this run. Fine as is. · decided by: @author"]'
is "prior-findings: a body finding's issue comment is its reply; mitigated is deferred" "$(jq -c '.[3] | [.disposition, .comment_id, .body, .reply.id]' <<<"$pf")" '["deferred",0,"",60]'
is "prior-findings: the issue comment's text after its header and the round prefix" "$(jq -r '.[3].reply.body' <<<"$pf" | head -c 20)" "mitigated in 3456789"
is "prior-findings: a finding a later round carried is carried, whatever its thread says" "$(jq -c '.[4] | [.disposition, .carried_to, .reply.body]' <<<"$pf")" '["carried","R2-2","not changed in this round. Disposition fix; no commit names it. · decided by: redline"]'
is "prior-findings: any other reply is decided" "$(jq -r '.[5].disposition' <<<"$pf")" "decided"
is "prior-findings: a fresh finding of the later round with no reply is none" "$(jq -c '.[6] | [.disposition, .carried_from, .round]' <<<"$pf")" '["none","",2]'
is "prior-findings: the carried finding names its origin, its title carries neither suffix, and not changed carries forward" "$(jq -c '.[7] | [.carried_from, .title, .disposition, .carried_to]' <<<"$pf")" '["R1-5","Streak one short","not-changed",""]'
# A finding a repository ask rule left to the person (#49): the rule tail is stripped from the title
# and its "left to the author" reply reads left, a disposition, so a later run never re-raises it.
is "prior-findings: the ask-rule tail is stripped from the title and a left reply is left" "$(jq -c '.[8] | [.title, .disposition, .comment_id, .reply.id, .file]' <<<"$pf")" '["Field handle renamed in project config","left",1423,1433,"config/project/project.yaml"]'
# A later run's resolved reply is Redline's own claim that the code no longer has the finding, so it reads fixed, never decided (#80, R4-3).
is "prior-findings: a later run's resolved reply is fixed, not decided" "$(jq -c '.[9] | [.id, .disposition, .comment_id, .reply.id, .round]' <<<"$pf")" '["R2-4","fixed",1424,1434,2]'
is "prior-findings: a PR with no Redline review prints an empty list" "$(gh prior-findings 8)" "[]"
gh prior-findings 99 >/dev/null 2>&1; is "prior-findings: a gh error exits 2" "$?" "2"
# Posted text (#87): a title the workflow escaped and neutralised comes back byte for byte (the
# workflow decodes it once at intake, never this script), still matches its id and its root comment,
# and still loses its suffixes; the For the person line, the set-aside block and its new heading are
# not findings, and the readers that count rounds see the heading as any other line. The
# fixture holds the joiner as its reference `&#8288;`, plain ASCII, as the workflow writes it (the #87
# follow-up spec); jq -a prints a raw joiner as its escape, so a stray one fails the match.
pf15="$(gh prior-findings 15)"; code=$?
is "posted text: prior-findings exits 0 with the set-aside heading in both bodies" "$code" "0"
is "posted text: only the two finding lines are findings; no For the person, heading or set-aside line is one" "$(jq -c '[.[].id]' <<<"$pf15")" '["R1-1","R2-1"]'
is "posted text: the escaped title comes back byte for byte, its needs-a-decision suffix stripped" "$(jq -a -c '.[0].title' <<<"$pf15")" '"Binds @&#8288;click to &lt;b> &amp; more"'
is "posted text: the escaped title still matches its root comment by id" "$(jq -c '.[0] | [.comment_id, .file, .line]' <<<"$pf15")" '[1501,"app/a.vue",3]'
is "posted text: the carried line keeps the same bytes, names its origin and carries the earlier finding" "$(jq -a -c '[.[1].title, .[1].carried_from, .[0].disposition, .[0].carried_to]' <<<"$pf15")" '["Binds @&#8288;click to &lt;b> &amp; more","R1-1","carried","R2-1"]'
is "posted text: last-round reads past the set-aside heading" "$(gh last-round 15)" "2"
gh has-review 15 2 >/dev/null; is "posted text: has-review finds round 2 with the heading present" "$?" "0"
# The #93 forms: a reply that opens "declined: " is a disposition of its own, in a thread and in a
# body item's issue comment, while a reply that only mentions a decline stays decided; a line under
# Could not confirm is a finding with that word; the rule's tail and its reply name the person by
# login, or by the no-login fallback, and read as the old "yours under rule" and "left to the
# author" forms do (PR 14 above still pins those). A scope-declined line carries no bold id and a
# Would confirm line no id at all, so neither is a finding.
pf16="$(gh prior-findings 16)"; code=$?
is "#93 forms: prior-findings exits 0" "$code" "0"
is "#93 forms: the lines under the new headings are findings; a scope-declined line, a Would confirm line, an Already tracked line and a line with an unknown fourth word are not" "$(jq -c '[.[].id]' <<<"$pf16")" '["R1-1","R1-2","R1-3","R1-4","R1-5","R2-1","R2-3"]'
is "#93 forms: a reply that opens declined: is declined, with its reason" "$(jq -c '.[0] | [.disposition, .comment_id, .reply.id, .reply.body]' <<<"$pf16")" '["declined",1601,1611,"declined: the pull request'"'"'s spec keeps cancelled orders out on purpose (decision 4 in its shape.md) · decided by: redline"]'
is "#93 forms: a reply that only mentions a decline is still decided" "$(jq -r '.[2].disposition' <<<"$pf16")" "decided"
is "#93 forms: a body item's issue comment that opens declined: is declined" "$(jq -c '.[3] | [.disposition, .comment_id, .reply.id]' <<<"$pf16")" '["declined",0,70]'
is "#93 forms: an unconfirmed line is a finding with that word, its title free of the Would confirm line" "$(jq -c '.[4] | [.confidence, .title, .file, .line, .disposition]' <<<"$pf16")" '["unconfirmed","Two workers can send twice","app/d.php",2,"declined"]'
is "#93 forms: the login tail is stripped from the title and a left to @login reply is left" "$(jq -c '.[1] | [.title, .disposition, .reply.id]' <<<"$pf16")" '["Field handle renamed in project config","left",1612]'
is "#93 forms: with no login the fallback tail is stripped and its reply is left" "$(jq -c '.[5] | [.title, .disposition, .round]' <<<"$pf16")" '["Fresh one","left",2]'
is "#93 forms: a decided reply that opens left to @login without the rule's words is still decided" "$(jq -c '.[6] | [.id, .disposition]' <<<"$pf16")" '["R2-3","decided"]'
is "#93 forms: last-round reads the new layout" "$(gh last-round 16)" "2"
# A final nit pass after a human review pass with no login names the person "the author" in a
# rule's tail (#94, R1-3): the tail is stripped from the title, and the reply still reads as left.
pf17="$(gh prior-findings 17)"
is "author tail: a left to the author under rule tail is stripped from the title" "$(jq -r '.[0].title' <<<"$pf17")" "Rule-covered nit"
is "author tail: its left to the author reply is still left" "$(jq -r '.[0].disposition' <<<"$pf17")" "left"
# A login may hold an underscore: an Enterprise Managed User login is <handle>_<shortcode> (#94,
# R2-1). Its rule tail is stripped from the title and its rule reply reads as left.
pf18="$(gh prior-findings 18)"
is "underscore login: the rule tail of a login with an underscore is stripped from the title" "$(jq -r '.[0].title' <<<"$pf18")" "Field handle renamed"
is "underscore login: its left to @login reply is left" "$(jq -r '.[0].disposition' <<<"$pf18")" "left"
# A finding minted from a candidate with no file is posted at (no file), line 0, so its line reads
# back (#94, R2-6).
is "no file: a finding minted with no file reads back at (no file), line 0" "$(jq -c '.[1] | [.id, .file, .line, .confidence]' <<<"$pf18")" '["R1-2","(no file)",0,"unconfirmed"]'
# The #95 replies (PR 19): a reply that opens "deferred" is deferred, to an issue or to a draft;
# a draft the person dropped and a deferral the person chose are their decisions, whose replies
# open with the decision and only mention a deferral.
pf19="$(gh prior-findings 19)"; code=$?
is "#95 forms: prior-findings exits 0" "$code" "0"
is "#95 forms: a reply that opens deferred to #<n> is deferred" "$(jq -c '.[0] | [.id, .disposition, .reply.id]' <<<"$pf19")" '["R1-1","deferred",1911]'
is "#95 forms: a reply that opens deferred; the issue draft is at is deferred" "$(jq -c '.[1] | [.id, .disposition]' <<<"$pf19")" '["R1-2","deferred"]'
is "#95 forms: a dropped draft's reply, which opens with the person's decision, is decided" "$(jq -c '.[2] | [.id, .disposition]' <<<"$pf19")" '["R1-3","decided"]'
is "#95 forms: a deferral the person chose, whose reply ends Deferred to #<n>, is decided" "$(jq -c '.[3] | [.id, .disposition]' <<<"$pf19")" '["R1-4","decided"]'

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
is "human-review @login: the login matches in any case, and the owner is GitHub's spelling" "$(gh human-review 10 @MarcAmos | jq -c '[[.comments[].id], .body.review_id, .body.user, .selector]')" '[[904,907,905,909],7,"marcamos","@MarcAmos"]'
byid="$(gh human-review 10 7)"
is "human-review <id>: that review's un-replied comments and its body" "$(jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]' <<<"$byid")" "[[907,905],7,[7]]"
latest="$(gh human-review 10 latest)"
is "human-review latest: the newest review not Redline's and not the gh user's, with a comment or a body" "$(jq -c '[[.comments[].id], .body, [.reviews[].id]]' <<<"$latest")" "[[909],null,[8]]"
author="$(gh human-review 10 @author)"
is "human-review @author: Redline's own comments and replies never appear; a hand reply does; no non-empty body" "$(jq -c '[[.comments[].id], .body]' <<<"$author")" "[[910],null]"
is "human-review <id> of a Redline review: nothing" "$(jq -c '[.comments, .body, .reviews]' <<<"$(gh human-review 10 2)")" "[[],null,[]]"
is "human-review: a login with no comment is empty, exit 0" "$(gh human-review 10 @nobody | jq -c '[.comments, .body]')" "[[],null]"
is "human-review 11 @login: a comment in another teammate's thread is open when the Redline reply there does not name it" "$(gh human-review 11 @sam | jq -c '[[.comments[].id], .comments[0].thread_id, .body, [.reviews[].id]]')" '[[911],905,null,[8]]'
is "human-review 11 @login: the follow-up is open, the comment the reply names is answered" "$(gh human-review 11 @marcamos | jq -c '[[.comments[].id], .body, [.reviews[].id]]')" '[[912],null,[10]]'
is "human-review 11 latest: the newest review with a comment no Redline reply names" "$(gh human-review 11 latest | jq -c '[[.comments[].id], .body, [.reviews[].id]]')" '[[912],null,[10]]'
is "human-review 11 <id>: the review whose comment the reply names has nothing open" "$(gh human-review 11 7 | jq -c '[.comments, .body, .reviews]')" '[[],null,[]]'
is "human-review 12 <id>: a body a Redline human review comment names as answered is not taken again" "$(gh human-review 12 7 | jq -c '[.comments, .body, .reviews]')" '[[],null,[]]'
is "human-review 12 @login: the newest body not yet answered, from an older review" "$(gh human-review 12 @marcamos | jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]')" '[[],6,[6]]'
is "human-review 12 latest: skips the review whose body is answered" "$(gh human-review 12 latest | jq -c '[[.comments[].id], .body.review_id, [.reviews[].id]]')" '[[],6,[6]]'
is "human-review 12 <id>: a comment that quotes the header without the marker answers nothing" "$(gh human-review 12 6 | jq -r '.body.text')" "Older note: document the new flag in the README."
is "last-human-review: the highest Redline human review N across replies and issue comments" "$(gh last-human-review 10)" "1"
is "last-human-review: a JSON number" "$(gh last-human-review 10 | jq -r 'type')" "number"
is "last-human-review: 0 when none" "$(gh last-human-review 8)" "0"

echo "# threads and resolve-threads"
rm -f "$WORK/pages/resolved.log"
th="$(gh threads 13)"; code=$?
is "threads: exits 0" "$code" "0"
is "threads: every thread of both pages, in path, line, first comment order" "$(jq -c '[.[].id]' <<<"$th")" '["PRRT_1","PRRT_2","PRRT_3","PRRT_4","PRRT_5","PRRT_6"]'
is "threads: a thread carries its state, place and each comment's id and login" "$(jq -c '.[1] | [.resolved, .path, .line, [.comments[] | [.id, .user]]]' <<<"$th")" '[false,"app/b.php",9,[[1303,"author"],[1304,"author"],[1305,"marcamos"]]]'
is "threads: a resolved thread says so, a null line stays null" "$(jq -c '[.[3].resolved, .[4].line]' <<<"$th")" "[true,null]"
is "threads: reads nothing but the query (no mutation logged)" "$([[ -e "$WORK/pages/resolved.log" ]] && echo yes || echo no)" "no"
rt="$(gh resolve-threads 13 1301 1302 1303 1304 1307 1308 1309 1399)"; code=$?
is "resolve-threads: exits 0" "$code" "0"
is "resolve-threads: resolves the thread whose first and last comments are both in the list" "$(jq -c '.resolved' <<<"$rt")" '[{"id":1301,"thread":"PRRT_1"}]'
is "resolve-threads: skips a thread a human last spoke in, one a human opened (only its reply is Redline's), one already resolved and an id in no thread, each with its reason" "$(jq -c '.skipped' <<<"$rt")" '[{"id":1303,"reason":"last comment 1305 is not Redline'\''s"},{"id":1306,"reason":"opened by comment 1306, not Redline'\''s"},{"id":1308,"reason":"already resolved"},{"id":1399,"reason":"no thread holds comment 1399"}]'
is "resolve-threads: a thread none of the ids name is not touched or listed" "$(jq -c '[.resolved[].id, .skipped[].id] | index(1310)' <<<"$rt")" "null"
is "resolve-threads: one mutation, for the resolved thread only" "$(cut -f1 "$WORK/pages/resolved.log")" "PRRT_1"
is "resolve-threads: the mutation is the pinned string, parameterised by the thread id alone" "$(cut -f2 "$WORK/pages/resolved.log")" 'mutation($threadId: ID!) { resolveReviewThread(input: {threadId: $threadId}) { thread { id isResolved } } }'
rm -f "$WORK/pages/resolved.log"
is "resolve-threads: a root given without its reply id is skipped, since the last comment is not in the list" "$(gh resolve-threads 13 1301 | jq -c '[.resolved, .skipped]')" '[[],[{"id":1301,"reason":"last comment 1302 is not Redline'\''s"}]]'
is "resolve-threads: nothing resolved means no mutation sent" "$([[ -e "$WORK/pages/resolved.log" ]] && echo yes || echo no)" "no"
is "resolve-threads: the reply id alone names its thread too, and the thread is handled once" "$(gh resolve-threads 13 1302 1301 1302 | jq -c '[.resolved, .skipped]')" '[[{"id":1301,"thread":"PRRT_1"}],[]]'
rm -f "$WORK/pages/resolved.log"
is "resolve-threads: a thread with a teammate's comment between Redline's two is skipped with that comment's id" "$(gh resolve-threads 13 1311 1313 | jq -c '[.resolved, .skipped]')" '[[],[{"id":1311,"reason":"comment 1312 is not Redline'\''s"}]]'
is "resolve-threads: a comment between Redline's two means no mutation sent" "$([[ -e "$WORK/pages/resolved.log" ]] && echo yes || echo no)" "no"

echo "# defer: a deferred finding's drafted issue, filed once (#95)"
D="$WORK/repo/agent-os/specs/2026-11-16-1026-94-review-round-2/redline"; mkdir -p "$D"
REL="agent-os/specs/2026-11-16-1026-94-review-round-2/redline"
LOG="$WORK/pages/issue.log"
LAST='Deferred from pull request #94 by Redline (round 2, finding R2-3).'
# draft <file> <title> <last line>: a draft as the workflow writes it.
draft() { printf '%s\n' "# $2" '' 'The job retries at once.' '' '- **Where:** `app/Jobs/SyncOrders.php:88`' '' "$3" > "$1"; }
draft "$D/issue-R2-3.md" 'Back off retries in <b> the queue client for @sam' "$LAST"
REC="$D/round-2-deferred.json"
out="$(gh defer issue R2-3 "$D/issue-R2-3.md" "$REC")"; code=$?
is "defer issue: exits 0" "$code" "0"
is "defer issue: prints the finding, the issue, the draft's path from its repository's root, and that it was opened" "$(jq -c . <<<"$out")" "{\"finding\":\"R2-3\",\"where\":\"issue\",\"number\":123,\"url\":\"https://github.com/o/r/issues/123\",\"path\":\"$REL/issue-R2-3.md\",\"reused\":false}"
is "defer issue: the record holds the finding's entry" "$(jq -c . "$REC")" "{\"R2-3\":{\"where\":\"issue\",\"number\":123,\"url\":\"https://github.com/o/r/issues/123\",\"path\":\"$REL/issue-R2-3.md\"}}"
is "defer issue: one lookup, then one create" "$(cut -f1 "$LOG" | tr '\n' ' ')" "list create "
is "defer issue: the lookup searches issue bodies for the draft's last line" "$(sed -n '1p' "$LOG" | cut -f2)" "\"$LAST\" in:body"
is "defer issue: the title is the draft's first line without its marker, as written" "$(sed -n '2p' "$LOG" | cut -f2)" 'Back off retries in <b> the queue client for @sam'
is "defer issue: the body is everything after the empty second line" "$(sed -n '2p' "$LOG" | cut -f3)" "\"The job retries at once.\\n\\n- **Where:** \`app/Jobs/SyncOrders.php:88\`\\n\\n$LAST\\n\""
out="$(gh defer issue R2-3 "$D/issue-R2-3.md" "$REC")"
is "defer issue, again: the recorded issue is printed as reused" "$(jq -c '[.number, .reused]' <<<"$out")" "[123,true]"
is "defer issue, again: GitHub is not called, so no second issue is opened" "$(wc -l < "$LOG" | tr -d ' ')" "2"
is "defer draft over a recorded issue: the issue stands" "$(gh defer draft R2-3 "$D/issue-R2-3.md" "$REC" | jq -c '[.where, .number, .reused]')" '["issue",123,true]'
draft "$D/issue-R2-6.md" 'Split OrderExporter out of the controller' 'Deferred from pull request #94 by Redline (round 2, finding R2-6).'
is "defer issue, a second finding: its own issue" "$(gh defer issue R2-6 "$D/issue-R2-6.md" "$REC" | jq -c '[.finding, .number, .reused]')" '["R2-6",124,false]'
is "defer issue, a second finding: the record keeps both" "$(jq -c '[keys, .["R2-3"].number, .["R2-6"].number]' "$REC")" '[["R2-3","R2-6"],123,124]'
rm -f "$LOG"
out="$(gh defer draft R2-7 "$D/issue-R2-3.md" "$D/round-2-drafts.json")"; code=$?
is "defer draft: exits 0 and prints the path, with no number" "$code $(jq -c . <<<"$out")" "0 {\"finding\":\"R2-7\",\"where\":\"draft\",\"number\":0,\"url\":\"\",\"path\":\"$REL/issue-R2-3.md\",\"reused\":false}"
is "defer draft: the record holds the path" "$(jq -c . "$D/round-2-drafts.json")" "{\"R2-7\":{\"where\":\"draft\",\"path\":\"$REL/issue-R2-3.md\"}}"
is "defer draft: GitHub is not called" "$([[ -e "$LOG" ]] && echo yes || echo no)" "no"
is "defer issue over a recorded draft: the issue is opened and replaces the entry" "$(gh defer issue R2-7 "$D/issue-R2-3.md" "$D/round-2-drafts.json" | jq -c '[.where, .number, .reused]') $(jq -r '.["R2-7"].where' "$D/round-2-drafts.json")" '["issue",123,false] issue'
rm -f "$LOG"
# The record is gone and the issue is not: the draft's last line finds it, as a whole line of the
# body (GitHub's line ends included), never inside another line.
jq -n --arg last "$LAST" '[{number: 78, url: "https://github.com/o/r/issues/78", body: ("It quotes the line: " + $last + " and goes on")}, {number: 77, url: "https://github.com/o/r/issues/77", body: ("The job retries at once.\r\n\r\n" + $last + "\r\n")}]' > "$WORK/pages/issues-list.json"
out="$(gh defer issue R2-3 "$D/issue-R2-3.md" "$D/lost.json")"
is "defer issue, no record but the issue exists: found by the draft's last line, and reused" "$(jq -c '[.number, .url, .reused]' <<<"$out")" '[77,"https://github.com/o/r/issues/77",true]'
is "defer issue, no record but the issue exists: recorded" "$(jq -c '.["R2-3"] | [.where, .number]' "$D/lost.json")" '["issue",77]'
is "defer issue, no record but the issue exists: nothing is created" "$(cut -f1 "$LOG" | tr '\n' ' ')" "list "
rm -f "$LOG"
jq -n --arg last "$LAST" '[{number: 78, url: "https://github.com/o/r/issues/78", body: ("It quotes the line: " + $last + " and goes on")}]' > "$WORK/pages/issues-list.json"
is "defer issue: a body that only quotes the line inside another is no match, so the issue is opened" "$(gh defer issue R2-3 "$D/issue-R2-3.md" "$D/quoted.json" | jq -c '[.number, .reused]') $(cut -f1 "$LOG" | tr '\n' ' ')" '[123,false] list create '
rm -f "$LOG" "$WORK/pages/issues-list.json"
GH_FAKE_CREATE_FAIL=1 gh defer issue R2-8 "$D/issue-R2-3.md" "$D/failed.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a failed create: exits 1 with gh's error, then the call that failed" "$code $(cat "$WORK/err")" "1 HTTP 403: Resource not accessible by integration"$'\n''redline-gh.sh: the create on GitHub failed'
is "defer issue, a failed create: writes no record" "$([[ -e "$D/failed.json" ]] && echo yes || echo no)" "no"
rm -f "$LOG"
GH_FAKE_LIST_FAIL=1 gh defer issue R2-8 "$D/issue-R2-3.md" "$D/failed.json" >/dev/null 2>&1; code=$?
is "defer issue, a failed lookup: exits 1, creates nothing and writes no record" "$code $(cut -f1 "$LOG" | tr '\n' ' ')$([[ -e "$D/failed.json" ]] && echo yes || echo no)" "1 list no"
rm -f "$LOG"
# gh's own exit status is not the script's (#97, R4-1): a lookup or create that gh fails with 4,
# as it does when it needs a login, still exits 1, names the call and writes no record.
GH_FAKE_FAIL_CODE=4 GH_FAKE_LIST_FAIL=1 gh defer issue R2-8 "$D/issue-R2-3.md" "$D/failed.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a lookup gh fails with status 4: exits 1, names the lookup, creates nothing and writes no record" "$code $(grep -c '^redline-gh.sh: the lookup on GitHub failed$' "$WORK/err") $(cut -f1 "$LOG" | tr '\n' ' ')$([[ -e "$D/failed.json" ]] && echo yes || echo no)" "1 1 list no"
rm -f "$LOG"
GH_FAKE_FAIL_CODE=4 GH_FAKE_CREATE_FAIL=1 gh defer issue R2-8 "$D/issue-R2-3.md" "$D/failed.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a create gh fails with status 4: exits 1, names the create and writes no record" "$code $(grep -c '^redline-gh.sh: the create on GitHub failed$' "$WORK/err") $([[ -e "$D/failed.json" ]] && echo yes || echo no)" "1 1 no"
rm -f "$LOG"
# A defer for another finding that finished while this one was on GitHub (#97, R1-2): the entry is
# merged into the record as the file stands when it is written, so the other entry is kept.
GH_FAKE_CREATE_WRITES="$D/overlap.json" GH_FAKE_CREATE_TEXT='{"R2-5":{"where":"issue","number":90,"url":"https://github.com/o/r/issues/90","path":"x.md"}}' gh defer issue R2-8 "$D/issue-R2-3.md" "$D/overlap.json" >/dev/null
is "defer issue, another finding recorded meanwhile: the record keeps both entries" "$(jq -c 'keys' "$D/overlap.json")" '["R2-5","R2-8"]'
is "defer issue, another finding recorded meanwhile: this finding's entry is the issue it opened" "$(jq -c '[.["R2-8"].number, .["R2-5"].number]' "$D/overlap.json")" '[123,90]'
rm -f "$LOG"
# A record that is no JSON object when the entry is written (#97, R1-3): exit 1, naming the entry
# with the issue it opened, and no temp file left beside the record.
mkdir -p "$D/corrupt"
GH_FAKE_CREATE_WRITES="$D/corrupt/round-2-deferred.json" GH_FAKE_CREATE_TEXT='not json' gh defer issue R2-8 "$D/issue-R2-3.md" "$D/corrupt/round-2-deferred.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a record that is no JSON object when the entry is written: exits 1, naming the issue opened" "$code $(grep -c 'https://github.com/o/r/issues/123' "$WORK/err")" "1 1"
is "defer issue, a record that is no JSON object when the entry is written: no temp file is left beside it" "$(leftover "$D/corrupt")" "0"
rm -f "$LOG"
# A record that cannot be written once the issue is open (#97, R2-1): its folder is a file, so
# making it fails after the create; exit 1, naming the entry with the issue it opened.
printf 'not a folder\n' > "$D/blocked"
gh defer issue R2-8 "$D/issue-R2-3.md" "$D/blocked/round-2-deferred.json" >/dev/null 2>"$WORK/err"; code=$?
is "defer issue, a record whose folder cannot be made once the issue is open: exits 1, naming the issue opened" "$code $(grep -c 'not recorded: .*https://github.com/o/r/issues/123' "$WORK/err")" "1 1"
rm -f "$LOG"
cp "$D/issue-R2-3.md" "$WORK/pages/loose.md"
is "defer draft: a draft outside any repository keeps its path as given" "$(gh defer draft R2-9 "$WORK/pages/loose.md" "$WORK/pages/loose.json" | jq -r .path)" "$WORK/pages/loose.md"
gh defer open R2-3 "$D/issue-R2-3.md" "$REC" 2>/dev/null; is "defer: a mode other than issue or draft exits 2" "$?" "2"
gh defer issue 23 "$D/issue-R2-3.md" "$REC" 2>/dev/null; is "defer: a finding that is no id exits 2" "$?" "2"
gh defer issue R2-3 "$D/missing.md" "$REC" 2>/dev/null; is "defer: a missing draft exits 2" "$?" "2"
printf '%s\n' 'Back off retries' '' 'body' > "$D/untitled.md"
gh defer issue R2-3 "$D/untitled.md" "$D/untitled.json" 2>/dev/null; is "defer: a draft whose first line is no title exits 2" "$?" "2"
printf '%s\n' '# Back off retries' 'body on the second line' > "$D/crowded.md"
gh defer issue R2-3 "$D/crowded.md" "$D/untitled.json" 2>/dev/null; is "defer: a draft whose second line is not empty exits 2" "$?" "2"
echo '[]' > "$D/array.json"
gh defer issue R2-3 "$D/issue-R2-3.md" "$D/array.json" 2>/dev/null; is "defer: a record that is not a JSON object exits 2" "$?" "2"
is "defer: a usage error calls nothing" "$([[ -e "$LOG" ]] && echo yes || echo no)" "no"
gh issue-create "A title" "$D/issue-R2-3.md" 2>/dev/null; is "issue-create is gone: defer is the one way an issue is opened" "$?" "2"
is "issue-create is gone: nothing was opened" "$([[ -e "$LOG" ]] && echo yes || echo no)" "no"

echo "# usage"
gh threads 2>/dev/null; is "usage: threads without a number exits 2" "$?" "2"
gh resolve-threads 13 2>/dev/null; is "usage: resolve-threads without an id exits 2" "$?" "2"
gh resolve-threads 13 1301 x 2>/dev/null; is "usage: resolve-threads with an id that is not a number exits 2" "$?" "2"
gh human-review 10 2>/dev/null; is "usage: human-review without a selector exits 2" "$?" "2"
gh human-review 10 seven 2>/dev/null; is "usage: human-review with a selector that is not an id, @login or latest exits 2" "$?" "2"
gh last-human-review 2>/dev/null; is "usage: last-human-review without a number exits 2" "$?" "2"
gh files 2>/dev/null; is "usage: files without a number exits 2" "$?" "2"
gh last-round x 2>/dev/null; is "usage: last-round with a non-number exits 2" "$?" "2"
gh prior-findings 2>/dev/null; is "usage: prior-findings without a number exits 2" "$?" "2"
gh place 7 "$WORK/missing.json" 2>/dev/null; is "usage: place with a missing file exits 2" "$?" "2"
gh --help 2>"$WORK/err"; code=$?
is "usage: --help exits 2" "$code" "2"
has "usage: --help prints the writes section to its last line" "$(grep -v '^$' "$WORK/err" | tail -1)" "mutation after the ones already sent, 2 on usage or a failed read"
is "usage: --help stops at the header's end" "$(grep -c 'set -euo pipefail' "$WORK/err")" "0"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]]
