#!/usr/bin/env bash
#
# Unit test of scripts/redline-gate.sh: the Verification Gate parser (extract), the stamp line it
# writes into a repository's .claude/redline/checks.sh (stamp), and the launch-time comparison
# (check). Runs on the synthetic fixtures under tests/gate-fixtures/, one per gate shape seen so far,
# copied into a throwaway directory under the system temp directory and mutated there with sed and
# awk. The last case checks this checkout's own stamp against its own gate.
#
#   tests/gate-test.sh

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GATE="$PLUGIN/scripts/redline-gate.sh"
FIX="$PLUGIN/tests/gate-fixtures"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/redline-gate-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
cp "$FIX"/*.md "$FIX"/*.sh "$WORK"/
TAB="$(printf '\t')"
pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }

# The hashes below were pinned from the implementation's first run; a change to the hash
# definition (what is hashed, how it is normalised or joined) changes them and is a deliberate act.
PLUGIN_SHA="64aed4fb1d9886c4bc87ada452ce15fef1619c178f18d093b6f234e16b1a8867"
LARAVEL_SHA="8419963f720badaa14d4919404fc7d519e23cb4bbcdf9e8b2b4b646831c6c4f4"
FENCED_SHA="eca310d2ffa86f6277513143175f05368c27457ad1ace778a68a4f9c6a2d5d0f"

# expect_json <name> <jq filter> <expected> <args...>
expect_json() {
    local name="$1" filter="$2" want="$3"; shift 3
    local got
    got="$("$GATE" "$@" 2>/dev/null | jq -r "$filter")"
    [[ "$got" == "$want" ]] && ok "$name" || bad "$name" "$got"
}
# expect_exit <name> <code> <args...>
expect_exit() {
    local name="$1" want="$2"; shift 2
    "$GATE" "$@" >/dev/null 2>&1
    local got=$?
    [[ "$got" -eq "$want" ]] && ok "$name" || bad "$name" "exit $got"
}
# expect_stderr <name> <grep pattern> <args...>: stderr matches, stdout ignored
expect_stderr() {
    local name="$1" pattern="$2"; shift 2
    local err
    err="$("$GATE" "$@" 2>&1 >/dev/null)"
    grep -q -- "$pattern" <<<"$err" && ok "$name" || bad "$name" "$err"
}
sha() { "$GATE" extract "$1" 2>/dev/null | jq -r .sha256; }
# same <name> <file a> <file b>: the two files hash the same; differs: they do not
same() { [[ "$(sha "$WORK/$2")" == "$(sha "$WORK/$3")" ]] && ok "$1" || bad "$1" "$(sha "$WORK/$2") vs $(sha "$WORK/$3")"; }
differs() { [[ "$(sha "$WORK/$2")" != "$(sha "$WORK/$3")" ]] && ok "$1" || bad "$1" "both $(sha "$WORK/$2")"; }
# mut <src> <dst> <sed expression>
mut() { sed "$3" "$WORK/$1" > "$WORK/$2"; }

P="$WORK/plugin-shape.md"; L="$WORK/laravel-shape.md"; F="$WORK/fenced-shape.md"

echo "# the script parses"
bash -n "$GATE" && ok "bash -n" || bad "bash -n" "$?"

echo "# extract: the plugin shape (a top-level section after a fenced decoy)"
expect_json "plugin: heading" '.heading' "Verification Gate" extract "$P"
expect_json "plugin: the top-level heading, not the decoy in the Step 7 fence" '.line' "$(grep -n '^## Verification Gate' "$P" | cut -d: -f1)" extract "$P"
expect_json "plugin: not inside a fence" '.in_fence' "false" extract "$P"
expect_json "plugin: seven steps, numbered in order" '[.steps[].n] | join(",")' "1,2,3,4,5,6,7" extract "$P"
expect_json "plugin: step 1 holds its three spans in order" '.steps[0].commands | join("|")' 'ls scripts/*.sh | xargs -n1 bash -n|bash -n|jq -e . hooks/hooks.json' extract "$P"
expect_json "plugin: step 1 title" '.steps[0].title' "Syntax" extract "$P"
expect_json "plugin: the continuation line joins step 5" '.steps[4].commands | index(".claude/redline/checks.sh --baseline") != null' "true" extract "$P"
expect_json "plugin: the nested list joins step 6 without splitting it" '.steps[5].commands | join("|")' 'shape.md|plan.md|agent-os/standards/|shape.md' extract "$P"
expect_json "plugin: the last step's spans" '.steps[6].commands | join("|")' 'plan.md|shape.md' extract "$P"
expect_json "plugin: nothing outside the steps" '.outside | length' "0" extract "$P"
expect_json "plugin: steps_default from the unattended parenthetical" '.steps_default | join("-")' "1-5" extract "$P"
expect_json "plugin: the hash input ends with the last span" '.hashed[-1]' "shape.md" extract "$P"
expect_json "plugin: the section ends before Output Structure" '.end_line' "$(( $(grep -n '^## Output Structure' "$P" | cut -d: -f1) - 1 ))" extract "$P"
expect_json "plugin: file as given outside a repository" '.file' "$P" extract "$P"

echo "# extract: the Laravel shape (sub-bullets and indented fenced commands)"
expect_json "laravel: nine steps" '.steps | length' "9" extract "$L"
expect_json "laravel: step 2's sub-bullet spans in document order" '.steps[1].commands[0:4] | join("|")' 'composer check|fix|pint --test|declare(strict_types=1)' extract "$L"
expect_json "laravel: step 4's fenced command is one item" '.steps[3].commands[0]' 'DB_DATABASE=app_redline_migrate php artisan migrate --force --no-interaction >/dev/null && DB_DATABASE=app_redline_migrate php artisan db:wipe --force --no-interaction && DB_DATABASE=app_redline_migrate php artisan migrate --force --no-interaction' extract "$L"
expect_json "laravel: the line after the fence is scanned again" '.steps[3].commands[1]' 'php artisan migrate --force --no-interaction' extract "$L"
expect_json "laravel: step 6's fenced command is not scanned for spans" '.steps[5].commands | length' "4" extract "$L"
expect_json "laravel: step 7's command" '.steps[6].commands[0]' 'composer test:octane' extract "$L"
expect_json "laravel: steps_default" '.steps_default | join("-")' "1-7" extract "$L"

echo "# extract: the fenced shape (the gate heading inside the plan-template fence)"
expect_json "fenced: the Task N heading" '.heading' "Task N (FINAL — ALWAYS INCLUDED): Verification gate" extract "$F"
expect_json "fenced: inside a fence" '.in_fence' "true" extract "$F"
expect_json "fenced: four steps" '.steps | length' "4" extract "$F"
expect_json "fenced: step 1" '.steps[0].commands[0]' 'php artisan test --compact' extract "$F"
expect_json "fenced: step 3 holds both spans" '.steps[2].commands | join("|")' 'npm run type-check|vue-tsc --noEmit' extract "$F"
expect_json "fenced: step 4's unfenced continuation lines" '.steps[3].commands | join("|")' 'agent-os/standards/process/standards-retrospective.md|agent-os/standards/|index.yml|Standards retrospective: no changes|shape.md' extract "$F"
expect_json "fenced: the section ends at the fence close" '.end_line' "$(( $(grep -n '^Does this plan structure look right' "$F" | cut -d: -f1) ))" extract "$F"
expect_json "fenced: steps_default with a colon after the range" '.steps_default | join("-")' "1-3" extract "$F"
expect_json "fenced: the later prose decoy is not chosen" '.line < 60' "true" extract "$F"

echo "# extract: no gate"
mut plugin-shape.md nogate.md 's/^## Verification Gate$/## Checks/'
expect_exit "no gate: exit 1" 1 extract "$WORK/nogate.md"
expect_stderr "no gate: one line names the problem" "no verification gate" extract "$WORK/nogate.md"
expect_exit "unreadable file: exit 2" 2 extract "$WORK/missing.md"
expect_exit "no arguments: exit 2" 2
expect_exit "unknown subcommand: exit 2" 2 frobnicate "$P"

echo "# hash: stable and whitespace-blind"
[[ "$(sha "$P")" == "$(sha "$P")" ]] && ok "stable across two runs" || bad "stable across two runs" "$(sha "$P")"
[[ "$(sha "$P")" == "$PLUGIN_SHA" ]] && ok "plugin shape hash pinned" || bad "plugin shape hash pinned" "$(sha "$P")"
[[ "$(sha "$L")" == "$LARAVEL_SHA" ]] && ok "laravel shape hash pinned" || bad "laravel shape hash pinned" "$(sha "$L")"
[[ "$(sha "$F")" == "$FENCED_SHA" ]] && ok "fenced shape hash pinned" || bad "fenced shape hash pinned" "$(sha "$F")"
awk '{printf "%s\r\n", $0}' "$P" > "$WORK/crlf.md"
same "a CRLF copy hashes the same" plugin-shape.md crlf.md
mut plugin-shape.md spaces.md 's/claude plugin validate \./claude   plugin validate ./'
same "doubled spaces inside a span hash the same" plugin-shape.md spaces.md
mut plugin-shape.md tab.md "s/^1\. /1.$TAB/"
same "a tab after the step number hashes the same" plugin-shape.md tab.md
expect_json "a tab after the step number still starts the step" '.steps | length' "7" extract "$WORK/tab.md"

echo "# hash: prose edits are free"
mut plugin-shape.md prose.md 's/parses the hook registration/checks the hook registration/'
same "a prose edit inside a step" plugin-shape.md prose.md
mut plugin-shape.md intro.md 's/^Run in this order:$/Run these, in order:/'
same "an edit to the intro line" plugin-shape.md intro.md
mut plugin-shape.md timing.md 's/About 20 seconds on 2026-10-21/About 25 seconds on 2026-11-02/'
same "an edit to the dated timing sentence" plugin-shape.md timing.md
mut plugin-shape.md decoy.md 's/runs them all and prints one JSON object/runs them all/; s/^Run the five commands in the Verification Gate section (`.claude\/redline\/checks.sh --baseline`/Run the five commands (`.claude\/redline\/checks.sh --git-only`/'
same "an edit to the fenced decoy's backticks" plugin-shape.md decoy.md
mut fenced-shape.md decoy2.md 's/^`npm run type-check` all pass, and the standards/`npm run lint` all pass, and the standards/'
same "an edit to the prose decoy's backticks" fenced-shape.md decoy2.md
mut fenced-shape.md caps.md 's/: Verification gate$/: Verification Gate/'
same "the heading's capitalisation" fenced-shape.md caps.md
mut plugin-shape.md title.md 's/^3\. \*\*Guard\*\*/3. **The guard**/'
same "a step's bold title" plugin-shape.md title.md

echo "# hash: backticked edits fire"
mut laravel-shape.md sub.md 's/`pint --test`/`pint --check`/'
differs "a sub-bullet's span" laravel-shape.md sub.md
mut plugin-shape.md cont.md 's/`\.claude\/redline\/checks.sh --baseline` runs, in this order/`.claude\/redline\/checks.sh --git-only` runs, in this order/'
differs "the continuation line's span" plugin-shape.md cont.md
mut laravel-shape.md fence.md 's/php artisan db:wipe --force --no-interaction/php artisan db:wipe --force/'
differs "a line inside a fenced command" laravel-shape.md fence.md
mut plugin-shape.md nested.md 's/not in `agent-os\/standards\/`/not in `agent-os\/standards\/index.yml`/'
differs "a nested list item's span" plugin-shape.md nested.md
awk '/^Only after all seven pass/{print "8. **Shell lint** — `shellcheck scripts/*.sh` prints nothing."} {print}' "$P" > "$WORK/added.md"
differs "a step added" plugin-shape.md added.md
expect_json "a step added: eight steps" '.steps | length' "8" extract "$WORK/added.md"
grep -v '^7\. ' "$P" > "$WORK/removed.md"
differs "a step removed" plugin-shape.md removed.md
expect_json "a step removed: six steps" '.steps | length' "6" extract "$WORK/removed.md"
awk '/^1\. /{hold=$0; next} {print} /^2\. /{print hold}' "$P" > "$WORK/swapped.md"
differs "steps 1 and 2 swapped" plugin-shape.md swapped.md
expect_json "steps 1 and 2 swapped: the numbers follow the text" '[.steps[].n][0:2] | join(",")' "2,1" extract "$WORK/swapped.md"

echo "# stamp: the line"
REPO="$WORK/repo"
mkdir -p "$REPO/.claude/commands/agent-os" "$REPO/.claude/redline"
git -C "$REPO" init -q
cp "$P" "$REPO/.claude/commands/agent-os/shape-spec.md"
SPEC="$REPO/.claude/commands/agent-os/shape-spec.md"
line="$("$GATE" stamp "$SPEC" 2>/dev/null)"
grep -qE '^# redline-gate: \.claude/commands/agent-os/shape-spec\.md steps 1-5 sha256:[0-9a-f]{64}$' <<<"$line" && ok "format, repo-relative path, default range" || bad "format, repo-relative path, default range" "$line"
[[ "$line" == *"sha256:$PLUGIN_SHA" ]] && ok "the stamp carries the extract hash" || bad "the stamp carries the extract hash" "$line"
expect_json "extract inside a repository: repo-relative file" '.file' ".claude/commands/agent-os/shape-spec.md" extract "$SPEC"
line="$("$GATE" stamp "$SPEC" --steps 2-6 2>/dev/null)"
[[ "$line" == *" steps 2-6 "* ]] && ok "--steps overrides the default" || bad "--steps overrides the default" "$line"
mut plugin-shape.md norange.md 's/(gate steps 1 to 5)/(the gate'"'"'s command steps)/'
expect_exit "no parenthetical and no --steps: exit 2" 2 stamp "$WORK/norange.md"
expect_exit "no parenthetical, --steps given: exit 0" 0 stamp "$WORK/norange.md" --steps 1-5
expect_exit "--steps past the last step: exit 2" 2 stamp "$SPEC" --steps 1-9
expect_exit "--steps reversed: exit 2" 2 stamp "$SPEC" --steps 3-2
expect_exit "--steps malformed: exit 2" 2 stamp "$SPEC" --steps x
expect_exit "no gate: exit 1" 1 stamp "$WORK/nogate.md" --steps 1-1
[[ ! -e "$REPO/.claude/redline/checks.sh" ]] && ok "without a checks.sh nothing is written" || bad "without a checks.sh nothing is written" "file exists"

echo "# stamp: writing into checks.sh"
cp "$WORK/checks-no-stamp.sh" "$REPO/.claude/redline/checks.sh"
CHECKS="$REPO/.claude/redline/checks.sh"
err="$("$GATE" stamp "$SPEC" "$CHECKS" 2>&1 >/dev/null)"
n="$(grep -c '^# redline-gate:' "$CHECKS")"
[[ "$n" == "1" ]] && ok "insert: exactly one stamp line" || bad "insert: exactly one stamp line" "$n"
at="$(grep -n '^# redline-gate:' "$CHECKS" | cut -d: -f1)"
[[ "$(sed -n "$((at-1))p" "$CHECKS")" == "#"* && -z "$(sed -n "$((at+1))p" "$CHECKS")" ]] && ok "insert: the last line of the header, before the blank line" || bad "insert: the last line of the header, before the blank line" "line $at"
bash -n "$CHECKS" && ok "insert: the file still parses" || bad "insert: the file still parses" "$?"
[[ -x "$CHECKS" ]] && ok "insert: the executable bit survives" || bad "insert: the executable bit survives" "not executable"
grep -q "2,/^\$/p" <<<"$err" && ok "insert: warns about the numeric --help range" || bad "insert: warns about the numeric --help range" "$err"
grep -q "sed -n '2,10p'" "$CHECKS" && ok "insert: the --help line itself is unchanged" || bad "insert: the --help line itself is unchanged" "$(grep -n 'sed -n' "$CHECKS")"
cp "$CHECKS" "$WORK/stamped-once.sh"
"$GATE" stamp "$SPEC" "$CHECKS" >/dev/null 2>&1
cmp -s "$CHECKS" "$WORK/stamped-once.sh" && ok "stamping twice is byte-identical" || bad "stamping twice is byte-identical" "$(diff "$CHECKS" "$WORK/stamped-once.sh")"
cp "$WORK/added.md" "$SPEC"
err="$("$GATE" stamp "$SPEC" "$CHECKS" --steps 1-6 2>&1 >/dev/null)"
[[ "$(grep -n '^# redline-gate:' "$CHECKS" | cut -d: -f1)" == "$at" && "$(grep -c '^# redline-gate:' "$CHECKS")" == "1" ]] && ok "replace: same line number, still one line" || bad "replace: same line number, still one line" "$(grep -n '^# redline-gate:' "$CHECKS")"
grep -q ' steps 1-6 ' "$CHECKS" && ok "replace: the new range" || bad "replace: the new range" "$(grep '^# redline-gate:' "$CHECKS")"
[[ -z "$err" ]] && ok "replace: no warning" || bad "replace: no warning" "$err"
cp "$P" "$SPEC"
cp "$WORK/checks-todo.sh" "$CHECKS"
"$GATE" stamp "$SPEC" "$CHECKS" >/dev/null 2>&1
! grep -q 'redline-gate: TODO' "$CHECKS" && [[ "$(grep -c '^# redline-gate:' "$CHECKS")" == "1" ]] && ok "the template's TODO placeholder is replaced" || bad "the template's TODO placeholder is replaced" "$(grep -n 'redline-gate' "$CHECKS")"

echo "# check"
expect_exit "match: exit 0" 0 check "$REPO"
expect_json "match: ok true" '.ok' "true" check "$REPO"
expect_json "match: the stamp and the actual hash agree" '.stamp.sha256 == .actual.sha256' "true" check "$REPO"
expect_json "match: the stamped path" '.stamp.path' ".claude/commands/agent-os/shape-spec.md" check "$REPO"
cp "$WORK/sub.md" "$SPEC"; cp "$P" "$WORK/keep.md"
mut plugin-shape.md edited.md 's/`claude plugin validate \.`/`claude plugin validate . --strict`/'
cp "$WORK/edited.md" "$SPEC"
expect_exit "mismatch: exit 1" 1 check "$REPO"
expect_json "mismatch: ok false" '.ok' "false" check "$REPO"
expect_json "mismatch: the hashes differ" '.stamp.sha256 != .actual.sha256' "true" check "$REPO"
expect_stderr "mismatch: one line names the file and the change" "the verification gate in .claude/commands/agent-os/shape-spec.md has changed" check "$REPO"
expect_stderr "mismatch: the line says how to restamp" "redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh" check "$REPO"
[[ "$("$GATE" check "$REPO" 2>&1 >/dev/null | wc -l | tr -d ' ')" == "1" ]] && ok "mismatch: exactly one stderr line" || bad "mismatch: exactly one stderr line" "$("$GATE" check "$REPO" 2>&1 >/dev/null)"
cp "$P" "$SPEC"
cp "$WORK/checks-no-stamp.sh" "$CHECKS"
expect_exit "no stamp: exit 1" 1 check "$REPO"
expect_stderr "no stamp: the line" "carries no gate stamp" check "$REPO"
expect_json "no stamp: stamp is null" '.stamp' "null" check "$REPO"
cp "$WORK/checks-todo.sh" "$CHECKS"
expect_exit "TODO placeholder: exit 1" 1 check "$REPO"
expect_stderr "TODO placeholder: the line" "carries no gate stamp" check "$REPO"
"$GATE" stamp "$SPEC" "$CHECKS" >/dev/null 2>&1
sed 's|^# redline-gate: \.claude/commands/agent-os/shape-spec\.md|# redline-gate: .claude/commands/agent-os/gone.md|' "$CHECKS" > "$WORK/moved.sh" && cat "$WORK/moved.sh" > "$CHECKS"
expect_exit "stamped path missing: exit 1" 1 check "$REPO"
expect_stderr "stamped path missing: the line" "does not exist" check "$REPO"
expect_exit "no argument: exit 2" 2 check
expect_exit "not a directory: exit 2" 2 check "$WORK/plugin-shape.md"
mkdir -p "$WORK/bare"
expect_exit "no checks.sh: exit 2" 2 check "$WORK/bare"

echo "# this checkout"
expect_exit "the plugin's own checks.sh stamp matches its gate" 0 check "$PLUGIN"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
