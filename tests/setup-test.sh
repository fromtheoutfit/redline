#!/usr/bin/env bash
#
# Unit test of scripts/redline-setup.sh: the scriptable parts of /redline:setup. The settings.json
# merge, the .gitignore line, the unattended section of shape-spec.md, redline.json from a baseline
# time, checks.sh generated from checks.json (and read back), the alias command files (#44), and the
# template version line, and the plugin's own manifest, marketplace entry and workflow constant (one semver version, #16, #135). Runs
# on the fixtures under tests/setup-fixtures/ (and two of tests/gate-fixtures/), copied into a
# throwaway directory under the system temp directory. The last cases regenerate this checkout's own
# .claude/redline/checks.sh from its committed .claude/redline/checks.json and compare.
#
#   tests/setup-test.sh

set -uo pipefail
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SETUP="$PLUGIN/scripts/redline-setup.sh"
GATE="$PLUGIN/scripts/redline-gate.sh"
FIX="$PLUGIN/tests/setup-fixtures"
GFIX="$PLUGIN/tests/gate-fixtures"
TEMPLATE="$PLUGIN/scripts/checks-template.sh"
# The template's version (v3 on 2026-11-15, #68); the version cases are relative to it, never spelled.
TV="$(grep -m1 '^# redline-template: checks-template.sh ' "$TEMPLATE" | awk '{print $NF}')"
TN="${TV#v}"
UT="$PLUGIN/templates/shape-spec-unattended.md"
# The unattended section's version (v7 on 2026-11-25, the follow-up of #127), read off the template's marker line; the
# section cases are relative to it, never spelled (#15).
UV="$(grep -m1 '^<!-- redline-unattended: v' "$UT" | sed 's/^<!-- redline-unattended: \(v[0-9]*\) -->.*/\1/')"
UN="${UV#v}"
UHIST="$PLUGIN/templates/history"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/redline-setup-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
# The claude CLI version <repoRoot> reads the plugin's installs from (#135): a stub for every case, so
# no case reads this machine's installs. It prints the file STUB_LIST names ([] when unset) for
# claude plugin list --json and exits STUB_EXIT (0 when unset).
mkdir -p "$WORK/bin"
cat > "$WORK/bin/claude" <<'STUB'
#!/usr/bin/env bash
[[ "$*" == "plugin list --json" ]] || exit 64
if [[ -n "${STUB_LIST:-}" ]]; then cat "$STUB_LIST"; else echo '[]'; fi
exit "${STUB_EXIT:-0}"
STUB
chmod +x "$WORK/bin/claude"
export REDLINE_CLAUDE="$WORK/bin/claude"
pass=0; fail=0
ok() { pass=$((pass+1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail+1)); printf 'FAIL %s\n     got: %s\n' "$1" "$2"; }

# expect_json <name> <jq filter> <expected> <args...>
expect_json() {
    local name="$1" filter="$2" want="$3"; shift 3
    local got
    got="$("$SETUP" "$@" 2>/dev/null | jq -r "$filter")"
    [[ "$got" == "$want" ]] && ok "$name" || bad "$name" "$got"
}
# expect_exit <name> <code> <args...>
expect_exit() {
    local name="$1" want="$2"; shift 2
    "$SETUP" "$@" >/dev/null 2>&1
    local got=$?
    [[ "$got" -eq "$want" ]] && ok "$name" || bad "$name" "exit $got"
}
# expect_stderr <name> <grep pattern> <args...>
expect_stderr() {
    local name="$1" pattern="$2"; shift 2
    local err
    err="$("$SETUP" "$@" 2>&1 >/dev/null)"
    grep -q -- "$pattern" <<<"$err" && ok "$name" || bad "$name" "$err"
}
# same <name> <a> <b>: the two files are byte-identical
same() { cmp -s "$2" "$3" && ok "$1" || bad "$1" "$(diff "$2" "$3" | head -5)"; }
# check <name> <condition...>: a plain test
check() { local name="$1"; shift; "$@" >/dev/null 2>&1 && ok "$name" || bad "$name" "condition false"; }
sorted() { jq -S -c . "$1"; }

echo "# the script parses, and usage errors exit 2"
bash -n "$SETUP" && ok "bash -n" || bad "bash -n" "$?"
expect_exit "no arguments: exit 2" 2
expect_exit "unknown subcommand: exit 2" 2 bogus
expect_exit "settings without a root: exit 2" 2 settings
expect_exit "gitignore without a root: exit 2" 2 gitignore
expect_exit "unattended without a file: exit 2" 2 unattended
expect_exit "config without a reviewer: exit 2" 2 config --baseline-seconds 10
expect_exit "checks with one argument: exit 2" 2 checks "$FIX/checks-input-laravel.json"
expect_exit "checks with an unknown flag: exit 2" 2 checks "$FIX/checks-input-laravel.json" "$WORK/x.sh" --bogus
expect_exit "read-checks without a file: exit 2" 2 read-checks
expect_exit "version without a file: exit 2" 2 version

echo "# settings: a fresh file"
R1="$WORK/r1"; mkdir -p "$R1"
expect_json "fresh: not existed, changed, written" '[.existed, .changed, .written] | join(",")' "false,true,true" settings "$R1" --allow 'Bash(composer check:*)'
want="$(jq -S -c '.permissions.allow += ["Bash(composer check:*)"]' "$PLUGIN/templates/settings.allow.json")"
[[ "$(sorted "$R1/.claude/settings.json")" == "$want" ]] && ok "fresh: the template plus the extra" || bad "fresh: the template plus the extra" "$(sorted "$R1/.claude/settings.json")"
expect_json "fresh rerun: unchanged, not written" '[.changed, .written] | join(",")' "false,false" settings "$R1" --allow 'Bash(composer check:*)'
cp "$R1/.claude/settings.json" "$WORK/r1-before.json"
"$SETUP" settings "$R1" --allow 'Bash(composer check:*)' >/dev/null 2>&1
same "fresh rerun: byte-identical" "$R1/.claude/settings.json" "$WORK/r1-before.json"
mkdir -p "$WORK/r1b" "$WORK/r1c"
expect_json "fresh: the extra is listed among added" '.added | index(["Bash(composer check:*)"]) != null' "true" settings "$WORK/r1b" --allow 'Bash(composer check:*)'
check "the template carries no script path rule, no temp edit rule and no git diff/log/show rule (#50)" jq -e '[.permissions.allow[] | select(test("scripts/|^Edit\\(//tmp|git (diff|log|show)"))] == []' "$PLUGIN/templates/settings.allow.json"
check "the retired list holds the old version rule and the git diff rule" jq -e '(index(["Bash(/*/scripts/redline-setup.sh version *)"]) != null) and (index(["Bash(git diff:*)"]) != null)' "$PLUGIN/templates/settings.retired.json"
"$SETUP" settings "$WORK/r1c" >/dev/null 2>&1
[[ "$(jq -r 'keys_unsorted[0]' "$WORK/r1c/.claude/settings.json")" == "extraKnownMarketplaces" ]] && ok "fresh: written in the template's key order" || bad "fresh: written in the template's key order" "$(jq -r 'keys_unsorted[0]' "$WORK/r1c/.claude/settings.json")"
expect_json "fresh: nothing stale, nothing removed" '[(.stale|length|tostring), (.removed|length|tostring)] | join(",")' "0,0" settings "$WORK/r1c"

echo "# settings: stale entries an earlier template added (#50)"
R8="$WORK/r8"; mkdir -p "$R8/.claude"; cp "$FIX/settings-stale.json" "$R8/.claude/settings.json"
expect_json "stale: the retired entries are listed, in file order" '.stale | join(",")' "Bash(/*/scripts/redline-gh.sh *),Edit(//tmp/redlinerepro/**),Bash(git diff:*)" settings "$R8"
expect_json "stale: kept, nothing changes, nothing written" '[.changed, .written, (.removed|length|tostring)] | join(",")' "false,false,0" settings "$R8"
expect_json "stale: a personal entry is never stale" '.stale | index(["Bash(composer check:*)"])' "null" settings "$R8"
cp "$R8/.claude/settings.json" "$WORK/r8-before.json"
expect_json "--remove-stale --dry-run: removed lists them, not written" '[(.removed|length|tostring), .changed, .written] | join(",")' "3,true,false" settings "$R8" --remove-stale --dry-run
same "--remove-stale --dry-run: untouched" "$R8/.claude/settings.json" "$WORK/r8-before.json"
expect_json "--remove-stale: written, removed lists them, stale now empty" '[.written, (.removed|length|tostring), (.stale|length|tostring)] | join(",")' "true,3,0" settings "$R8" --remove-stale
check "--remove-stale: the retired entries are gone" jq -e '[.permissions.allow[] | select(test("redlinerepro|redline-gh|git diff"))] == []' "$R8/.claude/settings.json"
check "--remove-stale: the personal entry and the template's survive, in order" jq -e '(.permissions.allow | index(["Bash(composer check:*)"])) != null and (.permissions.allow | index(["Bash(git status:*)"])) < (.permissions.allow | index(["Bash(composer check:*)"]))' "$R8/.claude/settings.json"
check "--remove-stale: the other keys survive" jq -e '.enabledPlugins["redline@redline"] == true' "$R8/.claude/settings.json"
expect_json "rerun after removal: nothing stale, unchanged" '[(.stale|length|tostring), .changed] | join(",")' "0,false" settings "$R8"
expect_json "--remove-stale with nothing stale: unchanged" '[.changed, (.removed|length|tostring)] | join(",")' "false,0" settings "$R8" --remove-stale

echo "# settings: an existing file with other keys"
R2="$WORK/r2"; mkdir -p "$R2/.claude"; cp "$FIX/settings-other-keys.json" "$R2/.claude/settings.json"
printf '{"permissions": {"allow": ["Bash(mine:*)"]}}\n' > "$R2/.claude/settings.local.json"
cp "$R2/.claude/settings.local.json" "$WORK/local-before.json"
expect_json "other keys: existed, changed, written" '[.existed, .changed, .written] | join(",")' "true,true,true" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)' --allow 'Bash(php artisan test:*)'
S2="$R2/.claude/settings.json"
check "other keys: hooks survive" jq -e '.hooks.PostToolUse[0].matcher == "Edit"' "$S2"
check "other keys: env survives" jq -e '.env.APP_ENV == "testing"' "$S2"
check "other keys: deny survives" jq -e '.permissions.deny == ["Bash(rm -rf:*)"]' "$S2"
check "other keys: the other plugin survives beside redline" jq -e '.enabledPlugins == {"other@other": true, "redline@redline": true}' "$S2"
check "other keys: the existing key order is kept" jq -e 'keys_unsorted[0] == "hooks"' "$S2"
check "other keys: existing allow entries come first, in order" jq -e '.permissions.allow[0:2] == ["Bash(git status:*)", "Bash(custom:*)"]' "$S2"
check "other keys: the template's entries follow, minus the one already present" jq -e '(.permissions.allow | index(["Bash(git status:*)"])) == 0 and ([.permissions.allow[] | select(. == "Bash(git status:*)")] | length) == 1' "$S2"
check "other keys: an extra given twice is added once" jq -e '[.permissions.allow[] | select(. == "Bash(php artisan test:*)")] | length == 1' "$S2"
check "other keys: an extra already present is not added again" jq -e '[.permissions.allow[] | select(. == "Bash(custom:*)")] | length == 1' "$S2"
check "other keys: the extras come last" jq -e '.permissions.allow[-1] == "Bash(php artisan test:*)"' "$S2"
check "other keys: the marketplace is added" jq -e '.extraKnownMarketplaces.redline.source.repo == "fromtheoutfit/redline"' "$S2"
same "other keys: settings.local.json is untouched" "$R2/.claude/settings.local.json" "$WORK/local-before.json"
expect_json "other keys: added names only what was added" '.added | index(["Bash(custom:*)"]) == null and (index(["Bash(php artisan test:*)"]) == null)' "true" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)'
expect_json "other keys: keysAdded" '.keysAdded | join(",")' "" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)'
cp "$S2" "$WORK/r2-before.json"
expect_json "other keys rerun: unchanged" '[.changed, .written] | join(",")' "false,false" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)'
same "other keys rerun: byte-identical" "$S2" "$WORK/r2-before.json"
expect_json "other keys: no conflicts" '.conflicts | length' "0" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)'
jq -S . "$S2" > "$WORK/r2-sorted.json"; cp "$WORK/r2-sorted.json" "$S2"
expect_json "a reordered copy reads as unchanged" '.changed' "false" settings "$R2" --allow 'Bash(custom:*)' --allow 'Bash(php artisan test:*)'
same "a reordered copy keeps its bytes" "$S2" "$WORK/r2-sorted.json"
R3="$WORK/r3"; mkdir -p "$R3"
expect_json "dry run: changed but not written" '[.changed, .written] | join(",")' "true,false" settings "$R3" --dry-run
[[ ! -e "$R3/.claude/settings.json" ]] && ok "dry run: no file" || bad "dry run: no file" "file exists"
R4="$WORK/r4"; mkdir -p "$R4/.claude"; printf 'not json\n' > "$R4/.claude/settings.json"
expect_exit "not JSON: exit 2" 2 settings "$R4"
expect_stderr "not JSON: one line names the file" "settings.json" settings "$R4"
R5="$WORK/r5"; mkdir -p "$R5/.claude"; { printf '\xef\xbb\xbf'; cat "$FIX/settings-other-keys.json"; } > "$R5/.claude/settings.json"
expect_exit "a BOM: exit 2 rather than a silent rewrite" 2 settings "$R5"
R7="$WORK/r7"; mkdir -p "$R7/.claude"; awk '{printf "%s\r\n", $0}' "$FIX/settings-other-keys.json" > "$R7/.claude/settings.json"
"$SETUP" settings "$R7" --allow 'Bash(custom:*)' >/dev/null 2>&1
[[ "$(grep -c $'\r$' "$R7/.claude/settings.json")" == "$(wc -l < "$R7/.claude/settings.json" | tr -d ' ')" ]] && ok "settings CRLF: kept on every line" || bad "settings CRLF: kept on every line" "$(grep -c $'\r$' "$R7/.claude/settings.json") of $(wc -l < "$R7/.claude/settings.json" | tr -d ' ')"
check "settings CRLF: still merged" jq -e '.extraKnownMarketplaces.redline.source.repo == "fromtheoutfit/redline"' "$R7/.claude/settings.json"
cp "$R7/.claude/settings.json" "$WORK/r7-before.json"
"$SETUP" settings "$R7" --allow 'Bash(custom:*)' >/dev/null 2>&1
same "settings CRLF rerun: byte-identical" "$R7/.claude/settings.json" "$WORK/r7-before.json"
[[ "$(grep -c $'\r' "$S2")" == "0" ]] && ok "settings LF: stays LF" || bad "settings LF: stays LF" "$(grep -c $'\r' "$S2") lines with a carriage return"
expect_exit "a root that is not a directory: exit 2" 2 settings "$WORK/nope"

echo "# settings: values already there are kept"
R6="$WORK/r6"; mkdir -p "$R6/.claude"; cp "$FIX/settings-conflicts.json" "$R6/.claude/settings.json"
expect_json "conflicts: both are reported" '[.conflicts[] | (.path | join("."))] | sort | join(",")' "enabledPlugins.redline@redline,extraKnownMarketplaces.redline" settings "$R6" --dry-run
expect_json "conflicts: have and want" '.conflicts[] | select(.path == ["enabledPlugins", "redline@redline"]) | "\(.have)->\(.want)"' "false->true" settings "$R6" --dry-run
"$SETUP" settings "$R6" >/dev/null 2>&1
check "conflicts: a differing marketplace source is kept whole" jq -e '.extraKnownMarketplaces.redline.source == {"source": "git", "url": "https://example.com/redline-fork.git"}' "$R6/.claude/settings.json"
check "conflicts: a disabled plugin stays disabled" jq -e '.enabledPlugins["redline@redline"] == false' "$R6/.claude/settings.json"
check "conflicts: the template's allow entries are still added" jq -e '.permissions.allow | index(["Workflow(redline:redline-loop)"]) != null' "$R6/.claude/settings.json"

echo "# gitignore"
G1="$WORK/g1"; mkdir -p "$G1"; printf '.DS_Store\n*.log\n.claude/settings.local.json\n/.idea\n' > "$G1/.gitignore"
expect_json "beside settings.local.json: placed after it" '[.changed, .after, (.at|tostring)] | join(",")' "true,.claude/settings.local.json,4" gitignore "$G1"
[[ "$(sed -n '4p' "$G1/.gitignore")" == ".claude/redline.local.json" ]] && ok "beside settings.local.json: the line is there" || bad "beside settings.local.json: the line is there" "$(cat "$G1/.gitignore")"
cp "$G1/.gitignore" "$WORK/g1-before"
expect_json "rerun: unchanged" '[.changed, .written] | join(",")' "false,false" gitignore "$G1"
same "rerun: byte-identical" "$G1/.gitignore" "$WORK/g1-before"
G2="$WORK/g2"; mkdir -p "$G2"; printf '.DS_Store\n.claude/foo\n*.log\n/.claude/bar\nnode_modules\n' > "$G2/.gitignore"
expect_json "no settings.local line: after the last .claude/ entry" '[.after, (.at|tostring)] | join(",")' "/.claude/bar,5" gitignore "$G2"
G3="$WORK/g3"; mkdir -p "$G3"; printf '.DS_Store\n*.log\n' > "$G3/.gitignore"
expect_json "no .claude line: appended" '[(.after|tostring), (.at|tostring)] | join(",")' "null,3" gitignore "$G3"
[[ "$(tail -c 27 "$G3/.gitignore" | od -An -c | tr -d ' \n')" == '.claude/redline.local.json\n' ]] && ok "appended: ends with the line and one newline" || bad "appended: ends with the line and one newline" "$(tail -c 30 "$G3/.gitignore" | od -c | tail -3)"
G4="$WORK/g4"; mkdir -p "$G4"; printf '.DS_Store\n*.log' > "$G4/.gitignore"
"$SETUP" gitignore "$G4" >/dev/null 2>&1
[[ "$(cat "$G4/.gitignore")" == $'.DS_Store\n*.log\n.claude/redline.local.json' ]] && ok "no final newline: one is added before the line" || bad "no final newline: one is added before the line" "$(od -c "$G4/.gitignore" | tail -3)"
G5="$WORK/g5"; mkdir -p "$G5"
expect_json "no file: created" '[.existed, .changed, .written] | join(",")' "false,true,true" gitignore "$G5"
[[ "$(cat "$G5/.gitignore")" == ".claude/redline.local.json" ]] && ok "no file: holds the one line" || bad "no file: holds the one line" "$(cat "$G5/.gitignore")"
G6="$WORK/g6"; mkdir -p "$G6"; printf '/.claude/redline.local.json\n' > "$G6/.gitignore"
expect_json "a leading-slash spelling counts as present" '.changed' "false" gitignore "$G6"
G7="$WORK/g7"; mkdir -p "$G7"; printf '.DS_Store\r\n.claude/settings.local.json\r\n/.idea\r\n' > "$G7/.gitignore"
"$SETUP" gitignore "$G7" >/dev/null 2>&1
[[ "$(grep -c $'\r$' "$G7/.gitignore")" == "4" && "$(wc -l < "$G7/.gitignore" | tr -d ' ')" == "4" ]] && ok "CRLF: kept on every line, the new one included" || bad "CRLF: kept on every line, the new one included" "$(od -c "$G7/.gitignore" | head)"
G8="$WORK/g8"; mkdir -p "$G8"; printf '*.log\n' > "$G8/.gitignore"
expect_json "dry run: not written" '[.changed, .written] | join(",")' "true,false" gitignore "$G8" --dry-run
[[ "$(cat "$G8/.gitignore")" == "*.log" ]] && ok "dry run: file untouched" || bad "dry run: file untouched" "$(cat "$G8/.gitignore")"

echo "# config: checker and stall from the baseline time"
stall() { expect_json "$1 s: $2 / $3" '[.config.checker, (.config.checkerStallMs|tostring)] | join(" / ")' "$2 / $3" config --reviewer sam --baseline-seconds "$1"; }
stall 0 full 300000
stall 29 full 300000
stall 299 full 600000
stall 300 full 600000
stall 301 git-only 600000
stall 1048 git-only 1800000
stall 1050 git-only 1800000
stall 1059 git-only 2100000
expect_json "the @ is stripped from the handle" '.config.reviewer' "marcamos" config --reviewer @marcamos --baseline-seconds 29
expect_json "maxRounds 3, push true" '[(.config.maxRounds|tostring), (.config.push|tostring)] | join(",")' "3,true" config --reviewer sam --baseline-seconds 29
[[ "$("$SETUP" config --reviewer sam --baseline-seconds 29 2>/dev/null | jq -S -c .config.models)" == "$(jq -S -c .models "$PLUGIN/templates/redline.json.example")" ]] && ok "models as the template" || bad "models as the template" "differ"
expect_json "no root: nothing written" '[(.file|tostring), (.written|tostring)] | join(",")' "null,false" config --reviewer sam --baseline-seconds 29
C1="$WORK/c1"; mkdir -p "$C1"
expect_json "written: not existed, changed, written" '[.existed, .changed, .written] | join(",")' "false,true,true" config --reviewer marcamos --baseline-seconds 29 "$C1"
sed -e 's/"reviewer": "[^"]*"/"reviewer": "marcamos"/' "$PLUGIN/templates/redline.json.example" > "$WORK/c1-want.json"
same "written: byte-identical to the template with the values substituted" "$C1/.claude/redline.json" "$WORK/c1-want.json"
same "written: byte-identical to this checkout's redline.json" "$C1/.claude/redline.json" "$PLUGIN/.claude/redline.json"
expect_json "rerun: unchanged" '[.changed, .written] | join(",")' "false,false" config --reviewer marcamos --baseline-seconds 29 "$C1"
sed -e 's/"checker": "full"/"checker": "git-only"/' -e 's/"checkerStallMs": 300000/"checkerStallMs": 1800000/' "$PLUGIN/templates/redline.json.example" | sed 's/"reviewer": "[^"]*"/"reviewer": "marcamos"/' > "$WORK/c1-ll.json"
C2="$WORK/c2"; mkdir -p "$C2"; "$SETUP" config --reviewer marcamos --baseline-seconds 1048 "$C2" >/dev/null 2>&1
same "a 1048 s baseline writes git-only and 1800000" "$C2/.claude/redline.json" "$WORK/c1-ll.json"
jq '.maxRounds = 5' "$C1/.claude/redline.json" > "$WORK/c1-5.json"; cp "$WORK/c1-5.json" "$C1/.claude/redline.json"
expect_exit "a hand-changed maxRounds: exit 0" 0 config --reviewer marcamos --baseline-seconds 29 "$C1"
expect_json "a hand-changed maxRounds: differs names it" '.differs.maxRounds | "\(.have)->\(.want)"' "5->3" config --reviewer marcamos --baseline-seconds 29 "$C1"
expect_json "a hand-changed maxRounds: nothing to update" '[(.changed|tostring), (.written|tostring), (.updated|tojson)] | join(",")' "false,false,{}" config --reviewer marcamos --baseline-seconds 29 "$C1"
same "a hand-changed maxRounds: untouched" "$C1/.claude/redline.json" "$WORK/c1-5.json"
expect_json "a baseline move, dry run: updated names checker and stall" '.updated | keys | join(",")' "checker,checkerStallMs" config --reviewer marcamos --baseline-seconds 1048 "$C1" --dry-run
same "a baseline move, dry run: untouched" "$C1/.claude/redline.json" "$WORK/c1-5.json"
expect_json "a baseline move: changed, written" '[.changed, .written] | join(",")' "true,true" config --reviewer marcamos --baseline-seconds 1048 "$C1"
sed -e 's/"checker": "full"/"checker": "git-only"/' -e 's/"checkerStallMs": 300000/"checkerStallMs": 1800000/' "$WORK/c1-5.json" > "$WORK/c1-5-ll.json"
same "a baseline move: only checker and stall change, maxRounds 5 and the formatting survive" "$C1/.claude/redline.json" "$WORK/c1-5-ll.json"
expect_json "a different reviewer: kept, listed under differs" '.differs.reviewer | "\(.have)->\(.want)"' "marcamos->sam" config --reviewer sam --baseline-seconds 1048 "$C1"
same "a different reviewer: the file is untouched" "$C1/.claude/redline.json" "$WORK/c1-5-ll.json"
C4="$WORK/c4"; mkdir -p "$C4/.claude"; jq 'del(.checker)' "$WORK/c1-5-ll.json" > "$C4/.claude/redline.json"; cp "$C4/.claude/redline.json" "$WORK/c4-before.json"
expect_exit "a derived key that cannot be updated in place: exit 1" 1 config --reviewer marcamos --baseline-seconds 29 "$C4"
same "a derived key that cannot be updated in place: untouched" "$C4/.claude/redline.json" "$WORK/c4-before.json"
# #95: a redline.json from before deferTo. A rerun names the key under differs and writes nothing;
# the team adds it by hand, and until then the drafts go to GitHub.
C6="$WORK/c6"; mkdir -p "$C6/.claude"; jq 'del(.deferTo)' "$WORK/c1-want.json" > "$C6/.claude/redline.json"; cp "$C6/.claude/redline.json" "$WORK/c6-before.json"
expect_json "a redline.json without deferTo: differs names it" '.differs.deferTo | "\(.have)->\(.want)"' "null->github" config --reviewer marcamos --baseline-seconds 29 "$C6"
expect_json "a redline.json without deferTo: nothing to update, nothing written" '[(.changed|tostring), (.written|tostring), (.updated|tojson)] | join(",")' "false,false,{}" config --reviewer marcamos --baseline-seconds 29 "$C6"
same "a redline.json without deferTo: untouched" "$C6/.claude/redline.json" "$WORK/c6-before.json"
expect_json "a fresh redline.json sends deferred drafts to GitHub" '.config.deferTo' "github" config --reviewer sam --baseline-seconds 29
expect_json "--force: rewritten" '[.changed, .written] | join(",")' "true,true" config --reviewer marcamos --baseline-seconds 29 "$C1" --force
same "--force: the template's values again" "$C1/.claude/redline.json" "$WORK/c1-want.json"
C3="$WORK/c3"; mkdir -p "$C3"
expect_json "dry run: not written" '[.changed, .written] | join(",")' "true,false" config --reviewer sam --baseline-seconds 29 "$C3" --dry-run
[[ ! -e "$C3/.claude/redline.json" ]] && ok "dry run: no file" || bad "dry run: no file" "file exists"
expect_exit "negative seconds: exit 2" 2 config --reviewer sam --baseline-seconds -1
expect_exit "non-integer seconds: exit 2" 2 config --reviewer sam --baseline-seconds abc
expect_exit "no seconds: exit 2" 2 config --reviewer sam

echo "# ask rules (#49): the config round trip"
C5="$WORK/c5"; mkdir -p "$C5"
expect_json "--ask-rules, fresh write: written with the list" '[(.written|tostring), (.askRules|length|tostring), (.config.askRules|length|tostring)] | join(",")' "true,2,2" config --reviewer marcamos --baseline-seconds 29 "$C5" --ask-rules "$FIX/ask-rules.json"
[[ "$(jq -S -c .askRules "$C5/.claude/redline.json")" == "$(jq -S -c . "$FIX/ask-rules.json")" ]] && ok "--ask-rules, fresh write: the file's list is the fixture's" || bad "--ask-rules, fresh write: the file's list is the fixture's" "$(jq -c .askRules "$C5/.claude/redline.json")"
[[ "$(jq -S -c 'del(.askRules)' "$C5/.claude/redline.json")" == "$(jq -S -c . "$WORK/c1-want.json")" ]] && ok "--ask-rules, fresh write: the rest is the template's" || bad "--ask-rules, fresh write: the rest is the template's" "$(jq -c 'del(.askRules)' "$C5/.claude/redline.json")"
cp "$C5/.claude/redline.json" "$WORK/c5-before.json"
expect_json "rerun without the flag: unchanged, the list printed, not under differs" '[(.changed|tostring), (.askRules|length|tostring), (.differs|has("askRules")|tostring)] | join(",")' "false,2,false" config --reviewer marcamos --baseline-seconds 29 "$C5"
same "rerun without the flag: untouched" "$C5/.claude/redline.json" "$WORK/c5-before.json"
expect_json "the same list again: unchanged" '[(.changed|tostring), (.updated|has("askRules")|tostring)] | join(",")' "false,false" config --reviewer marcamos --baseline-seconds 29 "$C5" --ask-rules "$FIX/ask-rules.json"
jq '.[0:1]' "$FIX/ask-rules.json" > "$WORK/one-rule.json"
expect_json "a changed list, dry run: updated names askRules with have and want, nothing written" '[(.updated.askRules.have|length|tostring), (.updated.askRules.want|length|tostring), (.written|tostring)] | join(",")' "2,1,false" config --reviewer marcamos --baseline-seconds 29 "$C5" --ask-rules "$WORK/one-rule.json" --dry-run
same "a changed list, dry run: untouched" "$C5/.claude/redline.json" "$WORK/c5-before.json"
expect_json "a changed list with a baseline move: all three updated, written" '[(.updated|keys|join("+")), (.written|tostring), (.askRules|length|tostring)] | join(",")' "askRules+checker+checkerStallMs,true,1" config --reviewer marcamos --baseline-seconds 1048 "$C5" --ask-rules "$WORK/one-rule.json"
[[ "$(jq -c '[.checker, .checkerStallMs, (.askRules|length), .maxRounds]' "$C5/.claude/redline.json")" == '["git-only",1800000,1,3]' ]] && ok "a changed list with a baseline move: the file carries all three and keeps the rest" || bad "a changed list with a baseline move: the file" "$(jq -c . "$C5/.claude/redline.json")"
printf '[]\n' > "$WORK/no-rules.json"
expect_json "an empty list removes every rule: only askRules updated, written" '[(.updated|keys|join("+")), (.written|tostring), (.askRules|length|tostring)] | join(",")' "askRules,true,0" config --reviewer marcamos --baseline-seconds 1048 "$C5" --ask-rules "$WORK/no-rules.json"
[[ "$(jq -c .askRules "$C5/.claude/redline.json")" == '[]' ]] && ok "an empty list removes every rule: the file holds askRules []" || bad "an empty list removes every rule: the file holds askRules []" "$(jq -c .askRules "$C5/.claude/redline.json")"
expect_json "--force without the flag drops the list" '[(.written|tostring), (.askRules|tostring)] | join(",")' "true,null" config --reviewer marcamos --baseline-seconds 29 "$C5" --force
expect_json "no root: the list rides in config" '[(.config.askRules|length|tostring), (.askRules|length|tostring)] | join(",")' "2,2" config --reviewer sam --baseline-seconds 29 --ask-rules "$FIX/ask-rules.json"
expect_json "no root, no flag: askRules null" '.askRules' "null" config --reviewer sam --baseline-seconds 29
printf '[{"id": "Bad", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-bad-id.json"
expect_stderr "a bad id: exit 2 naming the rule" "askRules\[1\]: id must match \[a-z\]\[a-z0-9-\]\*" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-bad-id.json"
expect_exit "a bad id: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-bad-id.json"
printf '[{"id": "a\\n", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-id-newline.json"
expect_stderr "an id ending in a newline: exit 2 naming the rule, as the guard and the workflow refuse it" "askRules\[1\]: id must match \[a-z\]\[a-z0-9-\]\*" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-newline.json"
expect_exit "an id ending in a newline: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-newline.json"
printf '[{"id": "a-1", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-id-digit.json"
expect_json "an id with a digit and a hyphen: still accepted" '.askRules[0].id' "a-1" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-id-digit.json"
printf '[{"id": "a", "when": {"paths": ["x"]}, "reason": "r"}, {"id": "a", "when": {"prose": "y"}, "reason": "r"}]\n' > "$WORK/rules-dup.json"
expect_stderr "a duplicate id: exit 2 naming it" "askRules\[2\]: id 'a' is not unique" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-dup.json"
printf '[{"id": "a", "when": {"paths": ["x"], "prose": "y"}, "reason": "r"}]\n' > "$WORK/rules-both.json"
expect_stderr "both paths and prose: exit 2" "rule 'a': when must hold exactly one of paths or prose" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-both.json"
printf '[{"id": "a", "when": {"paths": ["!x"]}, "reason": "r"}]\n' > "$WORK/rules-neg.json"
expect_stderr "a negated pattern: exit 2" "a path pattern may not hold ! or \[" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-neg.json"
printf '[{"id": "a", "when": {"paths": ["x"]}, "reason": " "}]\n' > "$WORK/rules-reason.json"
expect_stderr "an empty reason: exit 2" "rule 'a': reason must be one non-empty line" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-reason.json"
printf '{"id": "a"}\n' > "$WORK/rules-obj.json"
expect_stderr "not a list: exit 2" "askRules is not a list" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-obj.json"
printf '[{"id": "a", "when": {"paths": null}, "reason": "r"}]\n' > "$WORK/rules-paths-null.json"
expect_stderr "a null paths: exit 2" "rule 'a': paths must be a non-empty list of non-empty strings" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-paths-null.json"
printf '[{"id": "a", "when": {"prose": null}, "reason": "r"}]\n' > "$WORK/rules-prose-null.json"
expect_stderr "a null prose: exit 2" "rule 'a': prose must be a non-empty string" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-prose-null.json"
printf '["x", {"id": "a", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-nonobject.json"
expect_stderr "a non-object rule before an object: exit 2 naming it" "askRules\[1\]: not an object" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-nonobject.json"
expect_exit "a non-object rule before an object: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-nonobject.json"
expect_exit "a missing rules file: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/no-such-rules.json"
expect_exit "--ask-rules without a file: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules

echo "# ask rules (#49): the stack suggestions"
S1="$WORK/s1"; mkdir -p "$S1"; cp "$FIX/composer-craft.json" "$S1/composer.json"
expect_json "a Craft repository suggests config/project/** with its reason" '.suggestions | map([.id, .when.paths[0], .reason, .because] | join("|")) | join(";")' "craft-project-config|config/project/**|Craft project config is applied through the control panel|composer.json requires craftcms/cms" suggest-ask-rules "$S1"
S2="$WORK/s2"; mkdir -p "$S2"; cp "$FIX/composer-laravel.json" "$S2/composer.json"
expect_json "a Laravel repository suggests database/migrations/*" '.suggestions | map([.id, .when.paths[0]] | join("|")) | join(";")' "migrations|database/migrations/*" suggest-ask-rules "$S2"
S3="$WORK/s3"; mkdir -p "$S3"
expect_json "no composer.json: no suggestions" '.suggestions | length' "0" suggest-ask-rules "$S3"
S4="$WORK/s4"; mkdir -p "$S4"; printf '{"name": "x", "require": {}}\n' > "$S4/composer.json"
expect_json "a composer.json with no known dependency: no suggestions" '.suggestions | length' "0" suggest-ask-rules "$S4"
S5="$WORK/s5"; mkdir -p "$S5"; printf 'not json\n' > "$S5/composer.json"
expect_exit "a composer.json that is not JSON: exit 2" 2 suggest-ask-rules "$S5"
expect_exit "suggest-ask-rules without a root: exit 2" 2 suggest-ask-rules
[[ "$(ls -A "$S1" | sort | tr '\n' ' ')" == "composer.json " ]] && ok "suggest-ask-rules writes nothing" || bad "suggest-ask-rules writes nothing" "$(ls -A "$S1")"

echo "# unattended: a fresh insert"
U="$WORK/shape-spec-bare.md"; cp "$FIX/shape-spec-bare.md" "$U"
sha0="$("$GATE" extract "$U" 2>/dev/null | jq -r .sha256)"
FILL=(--gate-steps 1-5 --prose-steps "6 and 7" --retro-step 6 --no-pr-body)
expect_json "fresh: not present, changed, written" '[.present, .changed, .written] | join(",")' "false,true,true" unattended "$U" "${FILL[@]}"
[[ "$(grep -c '^## Unattended mode (Redline)$' "$U")" == "1" ]] && ok "fresh: the heading once" || bad "fresh: the heading once" "$(grep -c '^## Unattended' "$U")"
H="$(grep -n '^## Unattended mode (Redline)$' "$U" | cut -d: -f1)"; PRE="$(grep -n '^## Prerequisites$' "$U" | cut -d: -f1)"; PRO="$(grep -n '^## Process$' "$U" | cut -d: -f1)"
[[ "$H" -gt "$PRE" && "$H" -lt "$PRO" ]] && ok "fresh: between Prerequisites and Process" || bad "fresh: between Prerequisites and Process" "$PRE < $H < $PRO"
[[ -z "$(sed -n "$((H-1))p" "$U")" && -z "$(sed -n "$((PRO-1))p" "$U")" && -n "$(sed -n "$((PRO-2))p" "$U")" ]] && ok "fresh: one blank line on each side" || bad "fresh: one blank line on each side" "$(sed -n "$((H-1))p;$((PRO-2)),$((PRO-1))p" "$U")"
[[ "$(sed -n "$((H+1))p" "$U")" == "<!-- redline-unattended: $UV -->" ]] && ok "fresh: the marker is the template's version (#15)" || bad "fresh: the marker is the template's version (#15)" "$(sed -n "$((H+1))p" "$U")"
[[ "$(sed -n "$((H+2))p" "$U")" == "" ]] && ok "fresh: a blank line after the marker" || bad "fresh: a blank line after the marker" "$(sed -n "$((H+2))p" "$U")"
check "fresh: gate steps filled in" grep -q '(gate steps 1 to 5)' "$U"
check "fresh: prose steps filled in" grep -q 'Steps 6 and 7 stay as written' "$U"
check "fresh: retrospective step filled in" grep -q "Gate step 6's edits" "$U"
[[ "$(grep -c '^11\. \*\*The PR description' "$U")" == "0" ]] && ok "fresh: --no-pr-body drops point 11" || bad "fresh: --no-pr-body drops point 11" "present"
check "fresh: the closing paragraph is there" grep -q '^Everything not named above is unchanged' "$U"
cp "$FIX/shape-spec-bare.md" "$WORK/u-fresh-copy.md"
expect_json "fresh: insertedAt is the heading's line" '.insertedAt' "$H" unattended "$WORK/u-fresh-copy.md" "${FILL[@]}" --dry-run
[[ "$("$GATE" extract "$U" 2>/dev/null | jq -r .sha256)" == "$sha0" ]] && ok "fresh: the gate hash did not move" || bad "fresh: the gate hash did not move" "$("$GATE" extract "$U" 2>/dev/null | jq -r .sha256) vs $sha0"
[[ "$("$GATE" extract "$U" 2>/dev/null | jq -r '.steps_default | join("-")')" == "1-5" ]] && ok "fresh: steps_default comes from the new section" || bad "fresh: steps_default comes from the new section" "$("$GATE" extract "$U" 2>/dev/null | jq -r .steps_default)"
"$GATE" extract "$U" >/dev/null 2>&1 && ok "fresh: still exactly one gate" || bad "fresh: still exactly one gate" "exit $?"
cp "$U" "$WORK/u-before.md"
expect_json "rerun: present, unchanged" '[.present, .changed, .written] | join(",")' "true,false,false" unattended "$U" "${FILL[@]}"
same "rerun: byte-identical" "$U" "$WORK/u-before.md"
expect_json "rerun: found reads the fill-ins back" '[.found.gateSteps, .found.proseSteps, (.found.retroStep|tostring), (.found.prBody|tostring)] | join("|")' "1-5|6 and 7|6|false" unattended "$U" "${FILL[@]}"

echo "# unattended --version: the section's marker against the template's (#15)"
expect_exit "--version: a fresh insert matches" 0 unattended --version "$U"
expect_json "--version: template, file, match, newer" '[.template, .file, (.match|tostring), (.newer|tostring)] | join(",")' "$UV,$UV,true,false" unattended --version "$U"
sed "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN-1)) -->/" "$U" > "$WORK/u-old.md"
expect_exit "--version: an older marker: exit 1" 1 unattended --version "$WORK/u-old.md"
expect_json "--version: an older marker: match false, newer false" '[.file, (.match|tostring), (.newer|tostring)] | join(",")' "v$((UN-1)),false,false" unattended --version "$WORK/u-old.md"
expect_stderr "--version: an older marker says to run /redline:setup" "was made from template v$((UN-1)); the plugin ships $UV. Run /redline:setup to see the change" unattended --version "$WORK/u-old.md"
sed "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" "$U" > "$WORK/u-new.md"
expect_exit "--version: a newer marker: exit 1" 1 unattended --version "$WORK/u-new.md"
expect_json "--version: a newer marker: newer true" '[.file, (.match|tostring), (.newer|tostring)] | join(",")' "v$((UN+1)),false,true" unattended --version "$WORK/u-new.md"
expect_stderr "--version: a newer marker says to update the plugin" "update the plugin" unattended --version "$WORK/u-new.md"
newerr="$("$SETUP" unattended --version "$WORK/u-new.md" 2>&1 >/dev/null)"
[[ -n "$newerr" && "$newerr" != *"/redline:setup"* ]] && ok "--version: a newer marker does not suggest /redline:setup" || bad "--version: a newer marker does not suggest /redline:setup" "$newerr"
grep -v '^<!-- redline-unattended:' "$U" > "$WORK/u-nomark.md"
expect_exit "--version: no marker: exit 1" 1 unattended --version "$WORK/u-nomark.md"
expect_json "--version: no marker: file null" '.file' "null" unattended --version "$WORK/u-nomark.md"
expect_stderr "--version: no marker says so" "carries no version marker" unattended --version "$WORK/u-nomark.md"
expect_exit "--version: no section: exit 1" 1 unattended --version "$FIX/shape-spec-bare.md"
expect_json "--version: no section: file null" '.file' "null" unattended --version "$FIX/shape-spec-bare.md"
expect_stderr "--version: no section says so" "has no unattended section" unattended --version "$FIX/shape-spec-bare.md"
expect_exit "--version with a fill-in flag: exit 2" 2 unattended --version "$U" --gate-steps 1-5
expect_exit "--version with a missing file: exit 2" 2 unattended --version "$WORK/missing.md"

echo "# unattended: a rerun whose fill-ins differ"
expect_exit "a different range: exit 1" 1 unattended "$U" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body
expect_json "a different range: differs names have and want" '.differs.gateSteps | "\(.have)->\(.want)"' "1-5->1-6" unattended "$U" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body
same "a different range: untouched" "$U" "$WORK/u-before.md"
[[ "$("$SETUP" unattended "$U" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body 2>&1 >/dev/null | wc -l | tr -d ' ')" == "1" ]] && ok "a different range: one stderr line" || bad "a different range: one stderr line" "$("$SETUP" unattended "$U" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body 2>&1 >/dev/null)"
sed 's/^1\. \*\*Plan mode\.\*\*.*/1. **Plan mode.** HAND EDIT kept./' "$U" > "$WORK/u-hand.md"; cp "$WORK/u-hand.md" "$U"
expect_json "--force: changed and written" '[.changed, .written] | join(",")' "true,true" unattended "$U" --gate-steps 1-6 --prose-steps "7 and 8" --retro-step 7 --no-pr-body --force
[[ "$(diff "$WORK/u-hand.md" "$U" | grep -c '^[<>]')" == "4" ]] && ok "--force: the diff is exactly the two patched lines" || bad "--force: the diff is exactly the two patched lines" "$(diff "$WORK/u-hand.md" "$U")"
check "--force: the hand edit survives" grep -q 'HAND EDIT kept' "$U"
check "--force: the new range" grep -q '(gate steps 1 to 6)' "$U"
check "--force: the new prose steps" grep -q 'Steps 7 and 8 stay as written' "$U"
check "--force: the new retrospective step" grep -q "Gate step 7's edits" "$U"
U2="$WORK/u2.md"; cp "$FIX/shape-spec-bare.md" "$U2"
"$SETUP" unattended "$U2" --gate-steps 1-3 --prose-steps 4 --retro-step 4 --pr-body-standard global/pr-descriptions >/dev/null 2>&1
check "pr-body standard: point 11 names it" grep -q '^11\. \*\*The PR description\.\*\* .*(per `global/pr-descriptions`)' "$U2"
check "a single prose step reads singular" grep -q 'Step 4 stays as written' "$U2"
expect_json "pr-body standard: read back" '.found.prBody' "global/pr-descriptions" unattended "$U2" --gate-steps 1-3 --prose-steps 4 --retro-step 4 --pr-body-standard global/pr-descriptions
expect_exit "dropping point 11 later: exit 1" 1 unattended "$U2" --gate-steps 1-3 --prose-steps 4 --retro-step 4 --no-pr-body
"$SETUP" unattended "$U2" --gate-steps 1-3 --prose-steps 4 --retro-step 4 --no-pr-body --force >/dev/null 2>&1
[[ "$(grep -c '^11\. ' "$U2")" == "0" ]] && ok "dropping point 11 with --force removes the line" || bad "dropping point 11 with --force removes the line" "$(grep '^11\. ' "$U2")"
U3="$WORK/u3.md"; cp "$FIX/shape-spec-bare.md" "$U3"
expect_json "dry run: not written" '[.changed, .written] | join(",")' "true,false" unattended "$U3" "${FILL[@]}" --dry-run
same "dry run: untouched" "$U3" "$FIX/shape-spec-bare.md"
U4="$WORK/u4.md"; sed 's/^## Prerequisites$/## Before you start/' "$FIX/shape-spec-bare.md" > "$U4"
expect_exit "no Prerequisites heading: exit 2" 2 unattended "$U4" "${FILL[@]}"
expect_exit "bad --gate-steps: exit 2" 2 unattended "$U3" --gate-steps x --prose-steps 6 --retro-step 6 --no-pr-body
expect_exit "a descending range: exit 2" 2 unattended "$U3" --gate-steps 3-2 --prose-steps 6 --retro-step 6 --no-pr-body
expect_exit "no --gate-steps: exit 2" 2 unattended "$U3" --prose-steps 6 --retro-step 6 --no-pr-body
expect_exit "neither --no-pr-body nor a standard: exit 2" 2 unattended "$U3" --gate-steps 1-5 --prose-steps 6 --retro-step 6
expect_exit "a missing file: exit 2" 2 unattended "$WORK/missing.md" "${FILL[@]}"
U5="$WORK/u5.md"; { printf '\xef\xbb\xbf'; awk '{printf "%s\r\n", $0}' "$FIX/shape-spec-bare.md"; } > "$U5"
"$SETUP" unattended "$U5" "${FILL[@]}" >/dev/null 2>&1
[[ "$(head -c 3 "$U5" | od -An -tx1 | tr -d ' ')" == "efbbbf" ]] && ok "BOM: kept at byte 0" || bad "BOM: kept at byte 0" "$(head -c 3 "$U5" | od -An -tx1)"
[[ "$(grep -c $'\r$' "$U5")" == "$(wc -l < "$U5" | tr -d ' ')" ]] && ok "CRLF: every line, the inserted ones included" || bad "CRLF: every line, the inserted ones included" "$(grep -c $'\r$' "$U5") of $(wc -l < "$U5")"
"$GATE" extract "$U5" >/dev/null 2>&1 && ok "BOM + CRLF: the gate parser still reads it" || bad "BOM + CRLF: the gate parser still reads it" "exit $?"

echo "# checks: the Laravel shape"
LJ="$FIX/checks-input-laravel.json"; LC="$WORK/laravel-checks.sh"
expect_json "generate: written, changed" '[.written, .changed, .stampKept] | join(",")' "true,true,false" checks "$LJ" "$LC"
bash -n "$LC" && ok "generated: bash -n" || bad "generated: bash -n" "$?"
[[ -x "$LC" ]] && ok "generated: executable" || bad "generated: executable" "not executable"
B="$(grep -n '^$' "$LC" | head -1 | cut -d: -f1)"
[[ "$(sed -n "$((B-1))p" "$LC")" == "# redline-gate: TODO"* ]] && ok "generated: the header's last line is the stamp placeholder" || bad "generated: the header's last line is the stamp placeholder" "$(sed -n "$((B-1))p" "$LC")"
[[ "$(sed -n "$((B-2))p" "$LC")" == "$(grep -m1 '^# redline-template:' "$TEMPLATE")" ]] && ok "generated: the version line sits above it, equal to the template's" || bad "generated: the version line sits above it, equal to the template's" "$(sed -n "$((B-2))p" "$LC")"
[[ "$(sed -n '2,/^$/p' "$LC" | tail -1)" == "" && "$(sed -n '2,/^$/p' "$LC" | tail -2 | head -1)" == "# redline-gate: TODO"* ]] && ok "generated: --help's sed range prints the whole header" || bad "generated: --help's sed range prints the whole header" "$(sed -n '2,/^$/p' "$LC" | tail -2)"
[[ "$(sed -n "2,$((B-1))p" "$LC" | grep -vc '^#')" == "0" ]] && ok "generated: no empty line inside the header" || bad "generated: no empty line inside the header" "$(sed -n "2,$((B-1))p" "$LC" | grep -vn '^#')"
[[ "$(grep -c '^todo()' "$LC")" == "0" ]] && ok "generated: no todo() helper" || bad "generated: no todo() helper" "present"
check "generated: the header names the repository" grep -q '^# Redline gate for an example Laravel application\.' "$LC"
check "generated: the header lists the steps range" grep -q 'steps 1 to 7' "$LC"
check "generated: the header lists a check with its gate step and title" grep -q '^#   snapshots .*(gate step 3: Pest snapshots)' "$LC"
check "generated: a source step's header line reads as bash -c receives it, unescaped (#18)" grep -qF '#   env         base=$(git merge-base $env_base HEAD) || { echo "no merge base between $env_base and HEAD"; exit 1; }; for name in $(git diff "$base"..HEAD' "$LC"
check "generated: the run_check line keeps the escapes a source step needs" grep -qF 'run_check env 0 "base=\$(git merge-base $env_base HEAD) || { echo \"no merge base' "$LC"
check "generated: the header records the baseline" grep -q '^# Baseline on 2026-10-20: 412 seconds, most of it the Pest suite, so `checker: git-only` is the right mode\.' "$LC"
check "generated: a var's line reads ENV=<name>   doc (default value) (#18)" grep -q '^#   REDLINE_MIGRATE_DB=<name>   scratch database for the migrations check (default chalkboard_redline_migrate)$' "$LC"
check "generated: the environment block says octane runs" grep -q 'Runs `composer test:octane` here (gate step 7)' "$LC"
check "generated: allowed names the always-allowed file" grep -q '^# Allowed changes are files + plan_paths + agent-os/specs/ + agent-os/standards/ + openapi.json;' "$LC"
check "generated: the header says the file is generated from checks.json" grep -q 'Generated from .claude/redline/checks.json' "$LC"
check "generated: the plugin path prefix when not self-hosted" grep -q '<plugin>/scripts/redline-gate.sh stamp' "$LC"
[[ "$(grep -c '^migrate_db="${REDLINE_MIGRATE_DB:-chalkboard_redline_migrate}"$' "$LC")" == "1" ]] && ok "generated: the variable line after trap" || bad "generated: the variable line after trap" "$(grep -n migrate_db= "$LC")"
check "generated: ALWAYS_ALLOWED" grep -q "^ALWAYS_ALLOWED=('openapi.json')$" "$LC"
check "generated: the formatter block" grep -q '^    run_check fix 1 "composer fix"$' "$LC"
check "generated: tree_state before the formatter" grep -q '^    tree_state > "\$work/before_fix"$' "$LC"
check "generated: the base-diff guard" grep -q '^    if env_base="\$(base_ref)"; then$' "$LC"
check "generated: the base-diff fallback" grep -q "run_check env 0 \"echo 'the base ref (the snapshot base_ref, else origin/HEAD, else origin/main) does not resolve here; fetch it'; exit 1\"" "$LC"
check "generated: the octane guard" grep -q '^    if \[\[ "\${REDLINE_OCTANE:-0}" == "1" \]\]; then$' "$LC"
check "generated: the octane check inside it" grep -q '^        run_check octane 0 "composer test:octane"$' "$LC"
check "generated: steps are commented with their number and title" grep -q '^    # 3\. Pest snapshots\.' "$LC"
RC="$("$SETUP" read-checks "$LC" 2>/dev/null)"
[[ "$(jq -c '[.checks[] | select(.cmd != null and .guard != "base_ref") | [.step, .name, .recorded, .cmd]]' <<<"$RC")" == "$(jq -c '[.formatter | [.step, .name, true, .cmd]] + [.steps[] | select(.cmd != null) | [.step, .name, (.recorded == 1), .cmd]] + [[.octane.step, "octane", false, .octane.cmd]]' "$LJ")" ]] && ok "read-checks: every cmd step round-trips, in order" || bad "read-checks: every cmd step round-trips, in order" "$(jq -c '[.checks[] | [.step, .name, .recorded, .cmd]]' <<<"$RC")"
[[ "$(jq -r '.checks[] | select(.name == "snapshots") | .cmd' <<<"$RC")" == "$(jq -r '.steps[] | select(.name == "snapshots") | .cmd' "$LJ")" ]] && ok "read-checks: a command holding quotes and \$( round-trips exactly" || bad "read-checks: a command holding quotes and \$( round-trips exactly" "$(jq -r '.checks[] | select(.name == "snapshots") | .cmd' <<<"$RC")"
[[ "$(jq -r '.checks[] | select(.name == "fix") | .recorded' <<<"$RC")" == "true" ]] && ok "read-checks: fix is recorded" || bad "read-checks: fix is recorded" "$(jq -c '.checks[] | select(.name == "fix")' <<<"$RC")"
[[ "$(jq -r '[.checks[] | select(.name == "env")] | length' <<<"$RC")" == "2" && "$(jq -r '[.checks[] | select(.name == "env") | .guard] | unique | join(",")' <<<"$RC")" == "base_ref" ]] && ok "read-checks: env twice under the base_ref guard" || bad "read-checks: env twice under the base_ref guard" "$(jq -c '[.checks[] | select(.name == "env")]' <<<"$RC")"
[[ "$(jq -r '.checks[] | select(.name == "env") | .source' <<<"$RC" | head -1)" == "$(jq -r '.steps[] | select(.name == "env") | .source' "$LJ")" ]] && ok "read-checks: a source step comes back verbatim" || bad "read-checks: a source step comes back verbatim" "$(jq -r '.checks[] | select(.name == "env") | .source' <<<"$RC" | head -1)"
[[ "$(jq -r '.checks[] | select(.name == "migrations") | [.cmd, .source != null] | @csv' <<<"$RC")" == ",true" ]] && ok "read-checks: a step expanding a variable is source, not cmd" || bad "read-checks: a step expanding a variable is source, not cmd" "$(jq -c '.checks[] | select(.name == "migrations")' <<<"$RC")"
[[ "$(jq -r '.checks[] | select(.name == "octane") | .guard' <<<"$RC")" == "REDLINE_OCTANE" ]] && ok "read-checks: octane under its guard" || bad "read-checks: octane under its guard" "$(jq -c '.checks[] | select(.name == "octane")' <<<"$RC")"
[[ "$(jq -r '.templateVersion' <<<"$RC")" == "$TV" && "$(jq -r '.stamp' <<<"$RC")" == "null" ]] && ok "read-checks: the version line and no stamp yet" || bad "read-checks: the version line and no stamp yet" "$(jq -c '{templateVersion, stamp}' <<<"$RC")"
sed 's/^#   REDLINE_MIGRATE_DB=[^ ]*   scratch database for the migrations check (default chalkboard_redline_migrate)$/#   REDLINE_MIGRATE_DB=<name> scratch database for the migrations check/' "$LC" > "$WORK/hand-vars.sh"
expect_json "read-checks: a hand-written var line without its default still yields the doc (#18)" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/hand-vars.sh"
sed 's/^#   REDLINE_MIGRATE_DB=[^ ]*   /#   REDLINE_MIGRATE_DB=migrate_db   /' "$LC" > "$WORK/old-vars.sh"
expect_json "read-checks: a header generated before #18 (ENV=identifier) still yields the doc" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/old-vars.sh"
# A var default may hold a parenthesis (checks.json refuses only " $ ` \ }), so the reader's
# "(default ...)" tail runs to the last ")" on the line (#62, R1-1).
jq '.vars[0].default = "tcp(db)/x"' "$LJ" > "$WORK/paren-default.json"
"$SETUP" checks "$WORK/paren-default.json" "$WORK/paren-default.sh" >/dev/null 2>&1
expect_json "read-checks: a default holding a parenthesis stays out of the doc and reads back whole (#62, R1-1)" '[.input.vars[0].doc, .input.vars[0].default] | join("|")' "scratch database for the migrations check|tcp(db)/x" read-checks "$WORK/paren-default.sh"
sed -e 's/^#   REDLINE_MIGRATE_DB=[^ ]*   /#   REDLINE_MIGRATE_DB=migrate_db   /' -e 's#(default chalkboard_redline_migrate)$#(default a)b)#' "$LC" > "$WORK/old-paren-default.sh"
expect_json "read-checks: a header generated before #18 with a default holding a parenthesis still yields the doc alone (#62, R1-1)" '.input.vars[0].doc' "scratch database for the migrations check" read-checks "$WORK/old-paren-default.sh"
jq '.input' <<<"$RC" > "$WORK/laravel-bootstrap.json"
[[ "$(jq -S -c . "$WORK/laravel-bootstrap.json")" == "$(jq -S -c '. + {selfHosted: false}' "$LJ")" ]] && ok "read-checks: input recovers the whole checks.json" || bad "read-checks: input recovers the whole checks.json" "$(diff <(jq -S . "$WORK/laravel-bootstrap.json") <(jq -S '. + {selfHosted: false}' "$LJ"))"
"$SETUP" checks "$WORK/laravel-bootstrap.json" "$WORK/laravel-bootstrap.sh" >/dev/null 2>&1
same "read-checks: regenerating from input reproduces the file (the bootstrap)" "$WORK/laravel-bootstrap.sh" "$LC"
expect_json "generate again: unchanged, not written" '[.changed, .written] | join(",")' "false,false" checks "$LJ" "$LC"
sed -e 's/, steps 1 to 7)/)/' -e '/^ALWAYS_ALLOWED=(/d' -e "s/\${ALWAYS_ALLOWED\[@\]+.*}\"}\$/'openapi.json'/" "$LC" > "$WORK/hand.sh"
expect_json "read-checks: a hand-written gate gives gateFile without the parenthesis and the hard-coded allowed list (#18)" '[.input.gateFile, (.input.alwaysAllowed | join(","))] | join(" ")' ".claude/commands/agent-os/shape-spec.md openapi.json" read-checks "$WORK/hand.sh"
expect_json "read-checks: the gate fixture's hand-written header, split across two lines, gives gateFile without the parenthesis (#18)" '.input.gateFile' ".claude/commands/agent-os/shape-spec.md" read-checks "$GFIX/checks-no-stamp.sh"
expect_json "read-checks: the template form reads alwaysAllowed from ALWAYS_ALLOWED, not the printf line" '.input.alwaysAllowed | join(",")' "openapi.json" read-checks "$LC"
cp "$LC" "$WORK/laravel-before.sh"
"$GATE" stamp "$GFIX/laravel-shape.md" "$LC" >/dev/null 2>&1
check "stamp: the placeholder is replaced" grep -q '^# redline-gate: .* sha256:[0-9a-f]\{64\}$' "$LC"
expect_json "regenerate after stamping: unchanged, stamp kept" '[.changed, .written, .stampKept] | join(",")' "false,false,true" checks "$LJ" "$LC"
[[ "$(grep -c '^# redline-gate:' "$LC")" == "1" ]] && ok "regenerate after stamping: one stamp line" || bad "regenerate after stamping: one stamp line" "$(grep -n '^# redline-gate:' "$LC")"
[[ "$(grep -c 'TODO' "$LC")" == "0" ]] && ok "a stamped generated file holds no TODO" || bad "a stamped generated file holds no TODO" "$(grep -n TODO "$LC")"
expect_json "checks dry run: a new file is reported, not written" '[.changed, .written] | join(",")' "true,false" checks "$LJ" "$WORK/dry/checks.sh" --dry-run
[[ ! -e "$WORK/dry" ]] && ok "checks dry run: not even the directory is created" || bad "checks dry run: not even the directory is created" "$(ls -la "$WORK/dry")"
expect_json "checks dry run: an up-to-date file is unchanged" '[.changed, .written] | join(",")' "false,false" checks "$LJ" "$LC" --dry-run
sed 's/^# Baseline on .*/# Baseline: stale./' "$LC" > "$WORK/stale.sh"; cp "$WORK/stale.sh" "$WORK/stale-before.sh"
expect_json "checks dry run: a stale file is reported" '[.changed, .written] | join(",")' "true,false" checks "$LJ" "$WORK/stale.sh" --dry-run
same "checks dry run: the stale file is untouched" "$WORK/stale.sh" "$WORK/stale-before.sh"
jq '.baseline = null' "$LJ" > "$WORK/nobase.json"
"$SETUP" checks "$WORK/nobase.json" "$WORK/nobase.sh" >/dev/null 2>&1
check "baseline null: the header says it is not recorded yet" grep -q '^# Baseline: not recorded yet' "$WORK/nobase.sh"
jq '.baseline = {seconds: 61, date: "2026-10-22"}' "$LJ" > "$WORK/base.json"
"$SETUP" checks "$WORK/base.json" "$WORK/nobase.sh" >/dev/null 2>&1
check "baseline filled: the header records it without a note" grep -q '^# Baseline on 2026-10-22: 61 seconds, so `checker: full` is the right mode\.' "$WORK/nobase.sh"

echo "# checks: a generated file runs"
# A run keeps its full result under TMPDIR/redline-checks/ (#68), so every run from here on keeps it
# inside the throwaway directory.
export TMPDIR="$WORK/tmp"; mkdir -p "$TMPDIR"
SR="$WORK/scratch-repo"; mkdir -p "$SR/.claude/redline"
( cd "$SR" && git init -q && git -c user.email=t@t -c user.name=t commit -q --allow-empty -m init )
cat > "$WORK/scratch.json" <<'JSON'
{"repo": "a scratch repository", "gateFile": "gate.md", "baseline": {"seconds": 1, "date": "2026-10-22"},
 "steps": [{"step": 1, "name": "passes", "recorded": 0, "cmd": "echo fine"}, {"step": 2, "name": "fails", "recorded": 0, "cmd": "echo broken >&2; exit 3"}]}
JSON
"$SETUP" checks "$WORK/scratch.json" "$SR/.claude/redline/checks.sh" >/dev/null 2>&1
OUT="$(cd "$SR" && .claude/redline/checks.sh --baseline 2>/dev/null)"; RCODE=$?
[[ "$RCODE" == "1" ]] && ok "runs: a failing check exits 1" || bad "runs: a failing check exits 1" "exit $RCODE"
[[ "$(jq -r '[.mode, (.ok|tostring), (.checks | map(.name) | join(","))] | join(" ")' <<<"$OUT")" == "baseline false passes,fails" ]] && ok "runs: the output contract" || bad "runs: the output contract" "$OUT"
[[ "$(jq -r '.checks[1] | [(.exit|tostring), .stderr] | join(" ")' <<<"$OUT")" == "3 broken"* ]] && ok "runs: the failing check's exit and stderr" || bad "runs: the failing check's exit and stderr" "$(jq -c '.checks[1]' <<<"$OUT")"
[[ "$(jq -r '.result.checks[0].stdout' "$(jq -r '.kept' <<<"$OUT")" 2>/dev/null)" == "fine"* ]] && ok "runs: the passing check's stdout is in the kept result (#68)" || bad "runs: the passing check's stdout is in the kept result (#68)" "$(jq -c '{kept, first: .checks[0]}' <<<"$OUT")"
check "runs: no formatter means no fix check" jq -e '[.checks[] | select(.name == "fix")] | length == 0' <<<"$OUT"
# #50: an untracked file that cannot be read (a symlink to a directory) must not stop the git block before its JSON:
# cat fails on the link, xargs exits 123, and under pipefail the untracked-lines assignment used to end the script.
cat > "$WORK/scratch-pass.json" <<'JSON'
{"repo": "a scratch repository", "gateFile": "gate.md", "baseline": {"seconds": 1, "date": "2026-10-22"},
 "steps": [{"step": 1, "name": "passes", "recorded": 0, "cmd": "echo fine"}]}
JSON
"$SETUP" checks "$WORK/scratch-pass.json" "$SR/.claude/redline/checks.sh" >/dev/null 2>&1
( cd "$SR" && git add .claude && git -c user.email=t@t -c user.name=t commit -q -m checks )
mkdir -p "$SR/somedir" && ln -s somedir "$SR/link" && printf 'a\nb\n' > "$SR/readable.txt"
printf '{"pr": 1, "start_sha": "%s", "base_ref": "HEAD", "files": [], "plan_paths": []}\n' "$(git -C "$SR" rev-parse HEAD)" > "$WORK/scratch-snapshot.json"
OUT2="$(cd "$SR" && .claude/redline/checks.sh "$WORK/scratch-snapshot.json" 2>/dev/null)"; RCODE2=$?
[[ "$(jq -r '[.mode, (.git.diff_lines|tostring)] | join(" ")' <<<"$OUT2" 2>/dev/null)" == "full 2" ]] && ok "runs: an untracked symlink to a directory still gets one JSON object, counting the readable file's lines" || bad "runs: an untracked symlink to a directory still gets one JSON object, counting the readable file's lines" "exit $RCODE2: ${OUT2:-no output}"

echo "# checks: the printed result is bounded (#68)"
# brun <dir> <script> <args...>: run a checks.sh from inside a repository. BOUT is its stdout, BERR its
# stderr, BCODE its exit code and BBYTES both streams together, which is what the Bash tool shows.
brun() {
    local dir="$1" script="$2"; shift 2
    BOUT="$(cd "$dir" && "$script" "$@" 2>"$WORK/brun.err")"; BCODE=$?
    BERR="$(cat "$WORK/brun.err")"
    BBYTES=$(( $(printf '%s\n' "$BOUT" | wc -c) + $(wc -c < "$WORK/brun.err") ))
}
bgit() { git -C "$1" -c user.email=t@t -c user.name=t -c commit.gpgsign=false "${@:2}"; }
# rootkey <dir>: the key a repository's kept result is filed under.
rootkey() { printf '%s' "$(cd "$1" && pwd -P)" | git hash-object --stdin; }
# keptfiles <dir>: how many kept results are filed under the repository's key, 0 when none is.
keptfiles() {
    local key f n=0
    key="$(rootkey "$1")"
    for f in "$TMPDIR/redline-checks/$key"-*; do [[ -e "$f" ]] && n=$((n + 1)); done
    printf '%s\n' "$n"
}

# ANSI escapes are stripped before anything is measured, and a passing check prints no output.
AR="$WORK/ansi-repo"; mkdir -p "$AR"
( cd "$AR" && git init -q && git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init )
cat > "$WORK/ansi.json" <<'JSON'
{"repo": "a scratch repository", "gateFile": "gate.md", "baseline": {"seconds": 1, "date": "2026-11-15"},
 "steps": [{"step": 1, "name": "quiet", "recorded": 0, "cmd": "echo fine"},
           {"step": 2, "name": "colour", "recorded": 0, "cmd": "printf '\\033[31mred\\033[0m plain\\033]0;title\\007\\n'; printf 'bad \\377 byte\\n' >&2; exit 1"}]}
JSON
"$SETUP" checks "$WORK/ansi.json" "$WORK/ansi.sh" >/dev/null 2>&1
brun "$AR" "$WORK/ansi.sh" --baseline
[[ "$BCODE" == "1" ]] && ok "bounded: a failing check still exits 1" || bad "bounded: a failing check still exits 1" "exit $BCODE: $BERR"
[[ "$(jq -c '.checks[0]' <<<"$BOUT" 2>/dev/null)" == '{"name":"quiet","exit":0,"recorded":false}' ]] && ok "bounded: a passing check prints its name, its exit code and recorded, nothing else" || bad "bounded: a passing check prints its name, its exit code and recorded, nothing else" "$(jq -c '.checks[0]' <<<"$BOUT" 2>&1)"
[[ "$(jq -r '.checks[1].stdout' <<<"$BOUT" 2>/dev/null)" == "red plain" ]] && ok "bounded: a failing check's output has its colour and title escapes stripped" || bad "bounded: a failing check's output has its colour and title escapes stripped" "$(jq -c '.checks[1]' <<<"$BOUT" 2>&1)"
[[ -n "$BOUT" && "$(grep -c 'u001b\|u0007' <<<"$BOUT")" == "0" ]] && ok "bounded: no escape byte reaches the JSON" || bad "bounded: no escape byte reaches the JSON" "$BOUT"
[[ "$(jq -r '.checks[1].stderr' <<<"$BOUT" 2>/dev/null)" == "bad "*" byte" ]] && ok "bounded: a byte that is not UTF-8 does not stop the strip" || bad "bounded: a byte that is not UTF-8 does not stop the strip" "$(jq -c '.checks[1]' <<<"$BOUT" 2>&1)"
[[ -n "$BOUT" && "$(printf '%s\n' "$BOUT" | wc -l | tr -d ' ')" == "1" ]] && ok "bounded: stdout is one line" || bad "bounded: stdout is one line" "$(printf '%s\n' "$BOUT" | wc -l)"
grep -q '^checks.sh: running colour$' <<<"$BERR" && ! grep -q 'printf' <<<"$BERR" && ok "bounded: a progress line names the check and leaves its command out" || bad "bounded: a progress line names the check and leaves its command out" "$BERR"
[[ "$(jq -r '.result.checks[0].stdout' "$(jq -r '.kept' <<<"$BOUT" 2>/dev/null)" 2>/dev/null)" == "fine" ]] && ok "bounded: the kept result holds the passing check's output" || bad "bounded: the kept result holds the passing check's output" "$(jq -r '.kept' <<<"$BOUT" 2>&1)"
brun "$AR" "$WORK/ansi.sh" --verdict --baseline
[[ "$BCODE" == "1" && "$(jq -c '[.verdict, (.checks[1] | keys | join("+"))]' <<<"$BOUT" 2>/dev/null)" == '[true,"cmd+exit+name+recorded"]' ]] && ok "--verdict after a failing run: the run's exit code, the failing check without its output" || bad "--verdict after a failing run: the run's exit code, the failing check without its output" "exit $BCODE: $BOUT $BERR"
# The cap is measured on the stripped text: 3000 coloured dots are 30 KB raw and 3 KB stripped.
cat > "$WORK/dots.json" <<'JSON'
{"repo": "a scratch repository", "gateFile": "gate.md", "baseline": {"seconds": 1, "date": "2026-11-15"},
 "steps": [{"step": 1, "name": "dots", "recorded": 0, "cmd": "for i in $(seq 3000); do printf '\\033[32m.\\033[0m'; done; echo; exit 1"}]}
JSON
"$SETUP" checks "$WORK/dots.json" "$WORK/dots.sh" >/dev/null 2>&1
brun "$AR" "$WORK/dots.sh" --baseline
[[ "$(jq -c '.checks[0] | [.truncated, (.stdout | length)]' <<<"$BOUT" 2>/dev/null)" == "[false,3001]" ]] && ok "bounded: a stream over the cap only by its escapes is whole and not truncated" || bad "bounded: a stream over the cap only by its escapes is whole and not truncated" "$(jq -c '.checks[0] | [.truncated, (.stdout | length)]' <<<"$BOUT" 2>&1)"
sed 's/seq 3000/seq 6000/' "$WORK/dots.json" > "$WORK/dots-over.json"
"$SETUP" checks "$WORK/dots-over.json" "$WORK/dots-over.sh" >/dev/null 2>&1
brun "$AR" "$WORK/dots-over.sh" --baseline
[[ "$(jq -c '.checks[0] | [.truncated, ((.stdout | length) <= 5120)]' <<<"$BOUT" 2>/dev/null)" == "[true,true]" ]] && ok "bounded: a stream over the cap once stripped is cut to the budget and truncated" || bad "bounded: a stream over the cap once stripped is cut to the budget and truncated" "$(jq -c '.checks[0] | [.truncated, (.stdout | length)]' <<<"$BOUT" 2>&1)"

# The git block: counts for the lists nobody reads, this round's commits, subjects cut with their ids kept.
GR="$WORK/git-repo"; mkdir -p "$GR/.claude/redline"
( cd "$GR" && git init -q )
"$SETUP" checks "$WORK/scratch-pass.json" "$GR/.claude/redline/checks.sh" >/dev/null 2>&1
bgit "$GR" add .claude; bgit "$GR" commit -q -m checks
GS="$(git -C "$GR" rev-parse HEAD)"
printf 'a\n' > "$GR/a.txt"; bgit "$GR" add a.txt; bgit "$GR" commit -q -m "redline: R1-1 a first fix (#68)"
G1="$(git -C "$GR" rev-parse HEAD)"
# Ids past column 100 only (the standards commit's shape), with a look-alike that is no id.
PAST="redline: $(printf 'word %.0s' $(seq 20))finishing R12-3 and H2-10, not ABR7-7 (#68)"
bgit "$GR" commit -q --allow-empty -m "$PAST"
# An id across column 100: a cut at the column itself would leave R5-1, a different finding.
STRADDLE="redline: $(printf 'x%.0s' $(seq 87)) R5-10 and the rest of a long subject line"
bgit "$GR" commit -q --allow-empty -m "$STRADDLE"
WANT_PAST="redline: $(printf 'word %.0s' $(seq 17))word..."
WANT_STRADDLE="redline: $(printf 'x%.0s' $(seq 87))..."
GSNAP='{"pr": 1, "start_sha": "%s", %s"base_ref": "HEAD", "files": ["a.txt"], "plan_paths": ["docs/"]}\n'
printf "$GSNAP" "$GS" "" > "$WORK/git-all.json"
printf "$GSNAP" "$GS" "\"round_sha\": \"$G1\", " > "$WORK/git-round.json"
printf "$GSNAP" "$GS" '"round_sha": "0000000000000000000000000000000000000000", ' > "$WORK/git-badround.json"
GC="$GR/.claude/redline/checks.sh"
brun "$GR" "$GC" "$WORK/git-all.json"
[[ "$BCODE" == "0" ]] && ok "git block: a clean round passes" || bad "git block: a clean round passes" "exit $BCODE: $BOUT $BERR"
[[ "$(jq -c '.git | [.allowed_count, .changed_count, .commits_count, (.commits | length), .round_sha]' <<<"$BOUT" 2>/dev/null)" == "[4,1,3,3,\"$GS\"]" ]] && ok "git block: counts for allowed and changed, and without round_sha every commit since the start" || bad "git block: counts for allowed and changed, and without round_sha every commit since the start" "$(jq -c '.git' <<<"$BOUT" 2>&1)"
[[ "$(jq -c '.git | [has("allowed"), has("changed_files"), has("formatter_touched_outside_pr"), has("unexpected_files"), has("uncommitted")]' <<<"$BOUT" 2>/dev/null)" == "[false,false,false,true,true]" ]] && ok "git block: the allowed and changed lists are not printed; unexpected_files and uncommitted are" || bad "git block: the allowed and changed lists are not printed; unexpected_files and uncommitted are" "$(jq -c '.git | keys' <<<"$BOUT" 2>&1)"
GK="$(jq -r '.kept' <<<"$BOUT" 2>/dev/null)"
[[ "$GK" == "$TMPDIR/redline-checks/$(rootkey "$GR")-$(git -C "$GR" rev-parse HEAD).json" ]] && ok "kept: the path is the temp directory, the root's key and the commit" || bad "kept: the path is the temp directory, the root's key and the commit" "$GK"
[[ "$(jq -c '[.root, .head, .mode, .snapshot, .exit] | map(tostring) | join(" ")' "$GK" 2>/dev/null)" == "\"$(cd "$GR" && pwd -P) $(git -C "$GR" rev-parse HEAD) full $(cd "$WORK" && pwd)/git-all.json 0\"" ]] && ok "kept: the file names its root, commit, mode, snapshot and exit code" || bad "kept: the file names its root, commit, mode, snapshot and exit code" "$(jq -c 'del(.result, .printed)' "$GK" 2>&1)"
[[ "$(jq -c '.result.git | [(.allowed | length), .changed_files, (.commits | length), .commits[1].message]' "$GK" 2>/dev/null)" == "$(jq -c -n --arg m "$PAST" '[4, ["a.txt"], 3, $m]')" ]] && ok "kept: the full lists and whole subjects are in the kept result" || bad "kept: the full lists and whole subjects are in the kept result" "$(jq -c '.result.git' "$GK" 2>&1)"
[[ "$(jq -r '.git.commits[2].message' <<<"$BOUT" 2>/dev/null)" == "redline: R1-1 a first fix (#68)" ]] && ok "the cut: a subject of 100 characters or fewer is whole" || bad "the cut: a subject of 100 characters or fewer is whole" "$(jq -r '.git.commits[2].message' <<<"$BOUT" 2>&1)"
[[ "$(jq -r '.git.commits[1].message' <<<"$BOUT" 2>/dev/null)" == "$WANT_PAST R12-3 H2-10" ]] && ok "the cut: a subject whose only mention of an id is past the cut still carries it, in both forms, and no look-alike" || bad "the cut: a subject whose only mention of an id is past the cut still carries it, in both forms, and no look-alike" "$(jq -r '.git.commits[1].message' <<<"$BOUT" 2>&1)"
[[ "$(jq -r '.git.commits[0].message' <<<"$BOUT" 2>/dev/null)" == "$WANT_STRADDLE R5-10" ]] && ok "the cut: it falls at a space, so an id across column 100 is never split into another id" || bad "the cut: it falls at a space, so an id across column 100 is never split into another id" "$(jq -r '.git.commits[0].message' <<<"$BOUT" 2>&1)"
# The same case against a template with the rescue line removed: the id is lost, so the case above is the rescue's.
grep -v '# the id rescue' "$TEMPLATE" > "$WORK/norescue-template.sh"
REDLINE_TEMPLATE="$WORK/norescue-template.sh" "$SETUP" checks "$WORK/scratch-pass.json" "$WORK/norescue.sh" >/dev/null 2>&1
brun "$GR" "$WORK/norescue.sh" "$WORK/git-all.json"
[[ "$(jq -r '.git.commits[1].message' <<<"$BOUT" 2>/dev/null)" == "$WANT_PAST" ]] && ok "the cut, with the rescue line removed from the template: the id past the cut is lost" || bad "the cut, with the rescue line removed from the template: the id past the cut is lost" "$(jq -r '.git.commits[1].message' <<<"$BOUT" 2>&1)"
brun "$GR" "$GC" "$WORK/git-round.json"; GROUND="$BOUT"
[[ "$(jq -c '.git | [(.commits | length), .commits_count, .round_sha, ([.commits[].sha] | index("'"$G1"'"))]' <<<"$BOUT" 2>/dev/null)" == "[2,3,\"$G1\",null]" ]] && ok "git block: with round_sha, only the commits after it are listed and the count still covers the start" || bad "git block: with round_sha, only the commits after it are listed and the count still covers the start" "$(jq -c '.git' <<<"$BOUT" 2>&1)"
brun "$GR" "$GC" "$WORK/git-badround.json"
[[ "$BCODE" == "2" && "$BERR" == *"round_sha"*"not a commit"* ]] && ok "git block: a round_sha that is no commit exits 2, named" || bad "git block: a round_sha that is no commit exits 2, named" "exit $BCODE: $BERR"

# --verdict: the kept result's smallest form, only for this root, this commit, this mode and this snapshot.
brun "$GR" "$GC" "$WORK/git-round.json"
brun "$GR" "$GC" --verdict "$WORK/git-round.json"
[[ "$BCODE" == "0" && "$(jq -c '.verdict' <<<"$BOUT" 2>/dev/null)" == "true" && "$(jq -c 'del(.verdict)' <<<"$BOUT" 2>/dev/null)" == "$(jq -c . <<<"$GROUND")" ]] && ok "--verdict after a passing run: exit 0 and the run's own result, marked verdict" || bad "--verdict after a passing run: exit 0 and the run's own result, marked verdict" "exit $BCODE: $BOUT $BERR"
[[ -z "$(git -C "$GR" status --porcelain)" ]] && ok "kept: a run leaves the working tree clean" || bad "kept: a run leaves the working tree clean" "$(git -C "$GR" status --porcelain)"
brun "$GR" "$GC" --verdict --git-only "$WORK/git-round.json"
[[ "$BCODE" == "2" && "$BERR" == *"is for full"* ]] && ok "--verdict for another mode than the kept run's: exit 2" || bad "--verdict for another mode than the kept run's: exit 2" "exit $BCODE: $BERR"
brun "$GR" "$GC" --verdict "$WORK/git-all.json"
[[ "$BCODE" == "2" && "$BERR" == *"git-round.json"* ]] && ok "--verdict for another snapshot than the kept run's: exit 2" || bad "--verdict for another snapshot than the kept run's: exit 2" "exit $BCODE: $BERR"
# Two worktrees of one repository never read each other's kept result.
bgit "$GR" worktree add -q "$WORK/wt" HEAD >/dev/null 2>&1
brun "$WORK/wt" "$WORK/wt/.claude/redline/checks.sh" --verdict "$WORK/git-round.json"
[[ "$BCODE" == "2" && "$BERR" == *"no kept result for"* ]] && ok "--verdict in a second worktree at the same commit: exit 2, it has no kept result of its own" || bad "--verdict in a second worktree at the same commit: exit 2, it has no kept result of its own" "exit $BCODE: $BERR"
brun "$WORK/wt" "$WORK/wt/.claude/redline/checks.sh" --git-only "$WORK/git-round.json"
brun "$GR" "$GC" --verdict "$WORK/git-round.json"
[[ "$BCODE" == "0" && "$(jq -r '.mode' <<<"$BOUT" 2>/dev/null)" == "full" && "$(keptfiles "$GR")" == "1" && "$(keptfiles "$WORK/wt")" == "1" ]] && ok "kept: a run in the second worktree leaves the first one's result as it was" || bad "kept: a run in the second worktree leaves the first one's result as it was" "exit $BCODE: $(jq -c '.mode' <<<"$BOUT" 2>&1) $(keptfiles "$GR") $(keptfiles "$WORK/wt")"
# The stale case: HEAD moved since the kept result.
GOLD="$(git -C "$GR" rev-parse HEAD)"
bgit "$GR" commit -q --allow-empty -m "redline: R1-2 one more commit (#68)"
brun "$GR" "$GC" --verdict "$WORK/git-round.json"
[[ "$BCODE" == "2" && -z "$BOUT" && "$BERR" == *"is for commit $GOLD"*"HEAD is now $(git -C "$GR" rev-parse HEAD)"* ]] && ok "--verdict after HEAD moved: exit 2, no JSON, both commits named" || bad "--verdict after HEAD moved: exit 2, no JSON, both commits named" "exit $BCODE: $BOUT $BERR"
brun "$GR" "$GC" "$WORK/git-round.json"
[[ "$(keptfiles "$GR")" == "1" && ! -e "$GK" ]] && ok "kept: the next run replaces the root's kept result, one file a root" || bad "kept: the next run replaces the root's kept result, one file a root" "$(ls "$TMPDIR/redline-checks")"

# The budget (the arithmetic is in the template's comment): both streams together, as the Bash tool shows them.
PB="$WORK/budget-repo"; mkdir -p "$PB/.claude/redline"
( cd "$PB" && git init -q )
jq -n '{repo: "a scratch repository", gateFile: "gate.md", baseline: {seconds: 1, date: "2026-11-15"}, steps: [range(1; 13) | {step: ., name: "check-number-\(.)", recorded: 0, cmd: "echo passed"}]}' > "$WORK/budget-pass.json"
"$SETUP" checks "$WORK/budget-pass.json" "$PB/.claude/redline/checks.sh" >/dev/null 2>&1
bgit "$PB" add .claude; bgit "$PB" commit -q -m checks
PS0="$(git -C "$PB" rev-parse HEAD)"
LONG="$(printf 'word %.0s' $(seq 24))"
# batch <letter>: 300 files at 75-character paths in one commit, then 99 more commits, every subject over 100 characters.
batch() {
    local d="$PB/app/Http/Controllers/Api/V1/Feature$1" i
    mkdir -p "$d"
    for i in $(seq 300); do printf 'x\n' > "$d/ResourceControllerWithALongName$((i + 99)).php"; done
    bgit "$PB" add app; bgit "$PB" commit -q -m "redline: R1-1 ${LONG}(#68)"
    for i in $(seq 99); do bgit "$PB" commit -q --allow-empty -m "redline: R1-$i ${LONG}(#68)"; done
}
batch A; PMID="$(git -C "$PB" rev-parse HEAD)"
batch B; PROUND="$(git -C "$PB" rev-parse HEAD~40)"
bsnap() { git -C "$PB" diff --name-only "$1" HEAD | jq -R . | jq -s --arg s "$1" --arg r "$PROUND" '{pr: 1, start_sha: $s, round_sha: $r, base_ref: "HEAD", files: ., plan_paths: []}'; }
bsnap "$PMID" > "$WORK/budget-300.json"; bsnap "$PS0" > "$WORK/budget-600.json"
brun "$PB" "$PB/.claude/redline/checks.sh" "$WORK/budget-300.json"; B300=$BBYTES
[[ "$BCODE" == "0" && "$(jq -c '[(.checks | length), .git.changed_count, .git.allowed_count, .git.commits_count, (.git.commits | length)]' <<<"$BOUT" 2>/dev/null)" == "[12,300,302,100,40]" ]] && ok "budget: the passing run is 12 checks, 300 files, 100 commits since the start and 40 in the round" || bad "budget: the passing run is 12 checks, 300 files, 100 commits since the start and 40 in the round" "exit $BCODE: $(jq -c '[(.checks | length), .git.changed_count, .git.allowed_count, .git.commits_count, (.git.commits | length)]' <<<"$BOUT" 2>&1) $BERR"
[[ "$B300" -lt 10000 ]] && ok "budget: that passing result is under 10 KB" || bad "budget: that passing result is under 10 KB" "$B300 bytes"
brun "$PB" "$PB/.claude/redline/checks.sh" "$WORK/budget-600.json"; B600=$BBYTES
[[ "$(jq -c '[.git.changed_count, .git.commits_count, (.git.commits | length)]' <<<"$BOUT" 2>/dev/null)" == "[600,200,40]" && $(( B600 > B300 ? B600 - B300 : B300 - B600 )) -lt 20 ]] && ok "budget: twice the files and twice the commits since the start change the size by under 20 bytes" || bad "budget: twice the files and twice the commits since the start change the size by under 20 bytes" "$B300 then $B600 bytes: $(jq -c '[.git.changed_count, .git.commits_count, (.git.commits | length)]' <<<"$BOUT" 2>&1)"
WORSTCMD="$(cat <<'CMD'
for i in $(seq 300); do printf '\033[31mE a failing assertion line padded with words until it is one hundred and twenty characters long, to the end\033[0m\n'; done; for i in $(seq 300); do printf '\033[33mW a warning line on stderr padded with words until it is one hundred and twenty characters long, right to the end\033[0m\n' >&2; done; exit 1
CMD
)"
jq -n --arg cmd "$WORSTCMD" '{repo: "a scratch repository", gateFile: "gate.md", baseline: {seconds: 1, date: "2026-11-15"}, steps: [range(1; 13) | {step: ., name: "check-number-\(.)", recorded: 0, cmd: $cmd}]}' > "$WORK/budget-worst.json"
"$SETUP" checks "$WORK/budget-worst.json" "$WORK/worst.sh" >/dev/null 2>&1
brun "$PB" "$WORK/worst.sh" "$WORK/budget-300.json"; BWORST=$BBYTES
[[ "$BCODE" == "1" && "$(jq -c '[(.checks | length), ([.checks[] | .truncated and (.stdout | length) > 0 and (.stderr | length) > 0 and (.cmd | length) <= 123] | all), (.git.commits | length)]' <<<"$BOUT" 2>/dev/null)" == "[12,true,40]" ]] && ok "budget: the worst run is 12 failing checks, each with cut output on both streams and a cut command" || bad "budget: the worst run is 12 failing checks, each with cut output on both streams and a cut command" "exit $BCODE: $(jq -c '[.checks[] | [.truncated, (.stdout | length), (.stderr | length), (.cmd | length)]]' <<<"$BOUT" 2>&1) $BERR"
[[ "$BWORST" -lt 25000 ]] && ok "budget: that worst case is under 25 KB" || bad "budget: that worst case is under 25 KB" "$BWORST bytes"
printf '     measured: passing %s bytes, twice the size %s bytes, every check failing %s bytes\n' "$B300" "$B600" "$BWORST"

echo "# checks: bad input"
jq '.steps[0].name = "snapshots"' "$LJ" > "$WORK/dup.json"
expect_exit "duplicate names: exit 2" 2 checks "$WORK/dup.json" "$WORK/x.sh"
expect_stderr "duplicate names: named" "snapshots" checks "$WORK/dup.json" "$WORK/x.sh"
jq '.steps[0].source = "x"' "$LJ" > "$WORK/both.json"
expect_exit "cmd and source together: exit 2" 2 checks "$WORK/both.json" "$WORK/x.sh"
jq '(.steps[] | select(.kind == "base-diff")) |= (del(.source) | .cmd = "x")' "$LJ" > "$WORK/nosrc.json"
expect_exit "base-diff without source: exit 2" 2 checks "$WORK/nosrc.json" "$WORK/x.sh"
jq 'del(.baseline.date)' "$LJ" > "$WORK/nodate.json"
expect_exit "a baseline without a date: exit 2" 2 checks "$WORK/nodate.json" "$WORK/x.sh"
jq '.steps[0].cmd = "a\nb"' "$LJ" > "$WORK/nl.json"
expect_exit "a command with a newline: exit 2" 2 checks "$WORK/nl.json" "$WORK/x.sh"
jq '.steps[0].name = "Bad Name"' "$LJ" > "$WORK/badname.json"
expect_exit "a bad check name: exit 2" 2 checks "$WORK/badname.json" "$WORK/x.sh"
jq 'del(.repo)' "$LJ" > "$WORK/norepo.json"
expect_exit "no repo: exit 2" 2 checks "$WORK/norepo.json" "$WORK/x.sh"
printf 'nope\n' > "$WORK/notjson.json"
expect_exit "not JSON: exit 2" 2 checks "$WORK/notjson.json" "$WORK/x.sh"
jq '.steps[0].title = "a\nb"' "$LJ" > "$WORK/title-nl.json"
expect_exit "a title with a newline: exit 2" 2 checks "$WORK/title-nl.json" "$WORK/x.sh"
expect_stderr "a title with a newline: named" "title" checks "$WORK/title-nl.json" "$WORK/x.sh"
jq '.formatter.title = "a\nb"' "$LJ" > "$WORK/fmt-title-nl.json"
expect_exit "a formatter title with a newline: exit 2" 2 checks "$WORK/fmt-title-nl.json" "$WORK/x.sh"
jq '.vars[0].doc = "a\nb"' "$LJ" > "$WORK/doc-nl.json"
expect_exit "a var doc with a newline: exit 2" 2 checks "$WORK/doc-nl.json" "$WORK/x.sh"
jq '.vars[0].default = "a\"b"' "$LJ" > "$WORK/default-quote.json"
expect_exit "a var default with a double quote: exit 2" 2 checks "$WORK/default-quote.json" "$WORK/x.sh"
jq '.vars[0].default = "a}b"' "$LJ" > "$WORK/default-brace.json"
expect_exit "a var default with a closing brace: exit 2" 2 checks "$WORK/default-brace.json" "$WORK/x.sh"
jq '.baseline.note = "a\nb"' "$LJ" > "$WORK/note-nl.json"
expect_exit "a baseline note with a newline: exit 2" 2 checks "$WORK/note-nl.json" "$WORK/x.sh"
jq '.gateFile = "a\nb"' "$LJ" > "$WORK/gatefile-nl.json"
expect_exit "a gateFile with a newline: exit 2" 2 checks "$WORK/gatefile-nl.json" "$WORK/x.sh"
jq --arg entry "it's" '.alwaysAllowed = [$entry]' "$LJ" > "$WORK/aa-quote.json"
expect_exit "an alwaysAllowed entry with a single quote: exit 2" 2 checks "$WORK/aa-quote.json" "$WORK/x.sh"
[[ ! -e "$WORK/x.sh" ]] && ok "bad input: nothing written" || bad "bad input: nothing written" "file exists"
jq '.vars[0].doc = ""' "$LJ" > "$WORK/emptydoc.json"
expect_exit "a var with an empty doc is still accepted" 0 checks "$WORK/emptydoc.json" "$WORK/emptydoc.sh"
sed '/^if \[\[ "\$mode" != "git-only" \]\]; then$/d' "$TEMPLATE" > "$WORK/broken-template.sh"
REDLINE_TEMPLATE="$WORK/broken-template.sh" "$SETUP" checks "$LJ" "$WORK/x.sh" >/dev/null 2>&1; [[ $? -eq 1 ]] && ok "a template missing an anchor: exit 1" || bad "a template missing an anchor: exit 1" "exit $?"
[[ "$(REDLINE_TEMPLATE="$WORK/broken-template.sh" "$SETUP" checks "$LJ" "$WORK/x.sh" 2>&1 >/dev/null)" == *'git-only'* ]] && ok "a template missing an anchor: the anchor is named" || bad "a template missing an anchor: the anchor is named" "$(REDLINE_TEMPLATE="$WORK/broken-template.sh" "$SETUP" checks "$LJ" "$WORK/x.sh" 2>&1 >/dev/null)"
grep -v '^# redline-template:' "$TEMPLATE" > "$WORK/noversion-template.sh"
REDLINE_TEMPLATE="$WORK/noversion-template.sh" "$SETUP" checks "$LJ" "$WORK/x.sh" >/dev/null 2>&1; [[ $? -eq 1 ]] && ok "a template without a version line: exit 1" || bad "a template without a version line: exit 1" "exit $?"

echo "# command: the alias files (#44)"
A1="$WORK/a1"; mkdir -p "$A1"
expect_json "fresh: absent, changed, written" '[.existed, .status, .changed, .written] | join(",")' "false,absent,true,true" command "$A1" redline
same "fresh: byte-identical to the template" "$A1/.claude/commands/redline.md" "$PLUGIN/templates/command-redline.md"
expect_json "fresh: the file and template are named" '[.name, (.file | sub(".*/"; "")), (.template | sub(".*/"; ""))] | join(",")' "redline,redline.md,command-redline.md" command "$A1" redline
"$SETUP" command "$A1" redline-revise >/dev/null 2>&1
same "fresh: the revise name writes redline-revise.md from its template" "$A1/.claude/commands/redline-revise.md" "$PLUGIN/templates/command-redline-revise.md"
cp "$A1/.claude/commands/redline.md" "$WORK/a1-before.md"
expect_json "drift-free rerun: unchanged, not written" '[.existed, .status, .changed, .written] | join(",")' "true,unchanged,false,false" command "$A1" redline
same "drift-free rerun: byte-identical" "$A1/.claude/commands/redline.md" "$WORK/a1-before.md"
sed 's/exactly as if/just as if/' "$PLUGIN/templates/command-redline.md" > "$A1/.claude/commands/redline.md"; cp "$A1/.claude/commands/redline.md" "$WORK/a1-changed.md"
expect_exit "a changed file: exit 1" 1 command "$A1" redline
expect_json "a changed file: differs, not written, the diff carries both lines" '[.status, .written, (.diff | test("\n-.*exactly as if")), (.diff | test("\n\\+.*just as if"))] | map(tostring) | join(",")' "differs,false,true,true" command "$A1" redline
same "a changed file: untouched" "$A1/.claude/commands/redline.md" "$WORK/a1-changed.md"
[[ "$("$SETUP" command "$A1" redline 2>&1 >/dev/null | wc -l | tr -d ' ')" == "1" ]] && ok "a changed file: one stderr line" || bad "a changed file: one stderr line" "$("$SETUP" command "$A1" redline 2>&1 >/dev/null)"
expect_json "a changed file, dry run: still exit 1's shape, not written" '[.status, .changed, .written] | join(",")' "differs,true,false" command "$A1" redline --dry-run
same "a changed file, dry run: untouched" "$A1/.claude/commands/redline.md" "$WORK/a1-changed.md"
expect_json "--force: rewritten" '[.status, .changed, .written] | join(",")' "differs,true,true" command "$A1" redline --force
same "--force: the template again" "$A1/.claude/commands/redline.md" "$PLUGIN/templates/command-redline.md"
A2="$WORK/a2"; mkdir -p "$A2/.claude/commands"; printf 'Deploy the thing with $ARGUMENTS\n' > "$A2/.claude/commands/redline.md"; cp "$A2/.claude/commands/redline.md" "$WORK/a2-before.md"
expect_exit "a foreign file (no marker line): exit 0" 0 command "$A2" redline
expect_json "a foreign file: reported, not changed, no diff" '[.existed, .status, .changed, .written, (.diff|tostring)] | join(",")' "true,foreign,false,false,null" command "$A2" redline
same "a foreign file: untouched" "$A2/.claude/commands/redline.md" "$WORK/a2-before.md"
expect_json "a foreign file with --force: still left alone" '[.status, .written] | join(",")' "foreign,false" command "$A2" redline --force
same "a foreign file with --force: untouched" "$A2/.claude/commands/redline.md" "$WORK/a2-before.md"
A3="$WORK/a3"; mkdir -p "$A3"
expect_json "dry run on an absent file: changed, not written" '[.status, .changed, .written] | join(",")' "absent,true,false" command "$A3" redline --dry-run
[[ ! -e "$A3/.claude" ]] && ok "dry run on an absent file: not even the directory is created" || bad "dry run on an absent file: not even the directory is created" "$(ls -la "$A3/.claude")"
expect_exit "command without a root: exit 2" 2 command
expect_exit "command without a name: exit 2" 2 command "$A3"
expect_exit "an unknown name: exit 2" 2 command "$A3" setup
expect_stderr "an unknown name: named" "setup" command "$A3" setup
expect_exit "a root that is not a directory: exit 2" 2 command "$WORK/nope" redline
[[ ! -e "$A3/.claude" ]] && ok "usage errors write nothing" || bad "usage errors write nothing" "$(ls -la "$A3/.claude")"

echo "# unattended rerun: a section made from an older body is merged three ways (#15)"
# A section inserted from the frozen v1 (the override points at the frozen file; its missing history/history is tolerated).
V1="$WORK/v1.md"; cp "$FIX/shape-spec-bare.md" "$V1"
REDLINE_UNATTENDED_TEMPLATE="$UHIST/shape-spec-unattended.v1.md" "$SETUP" unattended "$V1" "${FILL[@]}" >/dev/null 2>&1
check "v1 insert: the marker is v1" grep -q '^<!-- redline-unattended: v1 -->$' "$V1"
sed 's/^1\. \*\*Plan mode\.\*\*.*/1. **Plan mode.** HAND EDIT kept./' "$V1" > "$WORK/v1-hand.md"; cp "$WORK/v1-hand.md" "$V1"
expect_exit "v1 section, no flag: exit 1" 1 unattended "$V1" "${FILL[@]}"
expect_json "v1 section: version, base, not guessed, no conflicts" '[.version.file, .version.template, .base, (.guessed|tostring), (.conflicts|length|tostring)] | join(",")' "v1,$UV,v1,false,0" unattended "$V1" "${FILL[@]}"
expect_json "v1 section: the report carries the template diff, the hand edits and the merged text" '[(.templateDiff|type), (.handEdits|test("HAND EDIT")|tostring), (.merged|test("HAND EDIT")|tostring), (.merged|test("Every decision names its owner")|tostring)] | join(",")' "string,true,true,true" unattended "$V1" "${FILL[@]}"
expect_stderr "v1 section, no flag: the line names --merge and --keep" "\-\-merge.*\-\-keep" unattended "$V1" "${FILL[@]}"
same "v1 section, no flag: untouched" "$V1" "$WORK/v1-hand.md"
expect_exit "v1 section, --force alone: exit 1" 1 unattended "$V1" "${FILL[@]}" --force
same "v1 section, --force alone: untouched" "$V1" "$WORK/v1-hand.md"
expect_json "v1 section, --merge --dry-run: changed, not written" '[.changed, .written] | join(",")' "true,false" unattended "$V1" "${FILL[@]}" --merge --dry-run
same "v1 section, --merge --dry-run: untouched" "$V1" "$WORK/v1-hand.md"
expect_json "v1 section, --merge: changed and written" '[.changed, .written] | join(",")' "true,true" unattended "$V1" "${FILL[@]}" --merge
check "--merge: the hand edit survives" grep -q 'HAND EDIT kept' "$V1"
check "--merge: v2's owner line arrived" grep -q 'Every decision names its owner' "$V1"
check "--merge: v3's ask-rules sentence arrived" grep -q 'repository rule <id>' "$V1"
check "--merge: v4's decline and its ask cases arrived (#93)" grep -q 'asked in five cases only' "$V1"
check "--merge: v5's deferral and its drafted issue arrived (#95)" grep -q 'drafted issue that stands on its own' "$V1"
check "--merge: v6's option ends arrived (#105)" grep -q 'Every option of a call states what choosing it ends in' "$V1"
check "--merge: v6's files on every finding of the example arrived (#105), its ask worded as v7 has it (#127, R2-2)" grep -q '"recommendation": "Accept, no change.", "files": \[\]}' "$V1"
check "--merge: v6's instance or class arrived (#75)" grep -q '\*\*Instance or class\.\*\*' "$V1"
check "--merge: v6's drafted option of a call left to the person arrived (#126)" grep -q 'carries its drafted issue in `draft`' "$V1"
check "--merge: v7's place for a sweep's list arrived, in point 5 and under the example (the follow-up of #127)" grep -q 'returned inside `cause`, as `cause.swept`' "$V1"
check "--merge: v7's sweep arrived in the example, its list inside cause" grep -q '"outcome": "sweep", "why": "[^"]*", "swept": \[{"member": ' "$V1"
check "--merge: the marker is the template's version" grep -q "^<!-- redline-unattended: $UV -->\$" "$V1"
check "--merge: the fill-ins are the wanted ones" grep -q '(gate steps 1 to 5)' "$V1"
[[ "$(grep -c '^## Unattended mode (Redline)$' "$V1")" == "1" ]] && ok "--merge: the heading once" || bad "--merge: the heading once" "$(grep -c '^## Unattended mode (Redline)$' "$V1")"
[[ "$("$GATE" extract "$V1" 2>/dev/null | jq -r '.steps_default | join("-")')" == "1-5" ]] && ok "--merge: the gate still reads the range" || bad "--merge: the gate still reads the range" "$("$GATE" extract "$V1" 2>&1 | head -3)"
expect_json "--merge, then a rerun: nothing drifted" '[.present, .changed, .written] | join(",")' "true,false,false" unattended "$V1" "${FILL[@]}"
expect_exit "--merge, then --version: current" 0 unattended --version "$V1"

# This checkout's own section is the hand-edit fixture (decision 4): three hand edits beside the fill-ins.
SELF="$WORK/self.md"; grep -v '^<!-- redline-unattended:' "$PLUGIN/.claude/commands/agent-os/shape-spec.md" > "$SELF"
SFILL=(--gate-steps 1-9 --prose-steps "10, 11, 12 and 13" --retro-step 12 --no-pr-body)
sha_self="$("$GATE" extract "$SELF" 2>/dev/null | jq -r .sha256)"
expect_exit "this checkout's section without its marker: exit 1" 1 unattended "$SELF" "${SFILL[@]}"
expect_json "this checkout's section: base guessed as the current version, no conflicts" '[(.version.file|tostring), .base, (.guessed|tostring), (.conflicts|length|tostring)] | join(",")' "null,$UV,true,0" unattended "$SELF" "${SFILL[@]}"
expect_json "this checkout's section: the hand edits are reported" '[(.handEdits|test("gate step 10, Docs")|tostring), (.handEdits|test("A teammate runs the command")|tostring), (.handEdits|test("The guard and the hook")|tostring)] | join(",")' "true,true,true" unattended "$SELF" "${SFILL[@]}"
expect_json "this checkout's section, --merge: written" '[.changed, .written] | join(",")' "true,true" unattended "$SELF" "${SFILL[@]}" --merge
same "this checkout's section, --merge: only the marker was added (the three hand edits kept)" "$SELF" "$PLUGIN/.claude/commands/agent-os/shape-spec.md"
[[ "$("$GATE" extract "$SELF" 2>/dev/null | jq -r .sha256)" == "$sha_self" ]] && ok "this checkout's section, --merge: the gate hash did not move" || bad "this checkout's section, --merge: the gate hash did not move" "moved"

# A conflicting line: a fake newer template rewords the Plan mode line the section hand-edited.
V4="$WORK/v4"; mkdir -p "$V4/history"; cp "$UHIST"/shape-spec-unattended.v*.md "$V4/history/"; cp "$UT" "$V4/history/shape-spec-unattended.$UV.md"
sed -e "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" -e 's/^1\. \*\*Plan mode\.\*\*.*/1. **Plan mode.** TEMPLATE REWORDED./' "$UT" > "$V4/shape-spec-unattended.md"
C="$WORK/conflict.md"; cp "$WORK/u-hand.md" "$C"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "conflict, no flag: exit 1" 1 unattended "$C" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "conflict: one conflict, numbered 1, ours holds the hand edit" '[(.conflicts|length|tostring), (.conflicts[0].n|tostring), (.conflicts[0].ours[0]|test("HAND EDIT")|tostring), (.conflicts[0].theirs[0]|test("TEMPLATE REWORDED")|tostring), (.base), (.guessed|tostring)] | join(",")' "1,1,true,true,$UV,false" unattended "$C" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "conflict: merged renders it diff3-style" '.merged | test("<<<<<<<")' "true" unattended "$C" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "conflict, --merge without a pick: exit 1" 1 unattended "$C" "${FILL[@]}" --merge
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_stderr "conflict, --merge without a pick: names the number" "1" unattended "$C" "${FILL[@]}" --merge
same "conflict, --merge without a pick: untouched" "$C" "$WORK/u-hand.md"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "--pick without --merge: exit 2" 2 unattended "$C" "${FILL[@]}" --pick 1=ours
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "--pick naming no conflict: exit 2" 2 unattended "$C" "${FILL[@]}" --merge --pick 2=ours
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "--pick with a bad side: exit 2" 2 unattended "$C" "${FILL[@]}" --merge --pick 1=mine
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_exit "--merge --keep: exit 2" 2 unattended "$C" "${FILL[@]}" --merge --keep
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "--pick 1=theirs: written" '[.changed, .written] | join(",")' "true,true" unattended "$C" "${FILL[@]}" --merge --pick 1=theirs
check "--pick 1=theirs: the template's wording" grep -q 'TEMPLATE REWORDED' "$C"
check "--pick 1=theirs: the newer marker" grep -q "^<!-- redline-unattended: v$((UN+1)) -->\$" "$C"
[[ "$(grep -c '<<<<<<<' "$C")" == "0" ]] && ok "--pick: no conflict marker written" || bad "--pick: no conflict marker written" "$(grep -c '<<<<<<<' "$C")"
cp "$WORK/u-hand.md" "$C"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "--pick 1=ours: written" '[.changed, .written] | join(",")' "true,true" unattended "$C" "${FILL[@]}" --merge --pick 1=ours
check "--pick 1=ours: the hand edit kept" grep -q 'HAND EDIT kept' "$C"

# Adjacent lines changed on different sides (Chalkboard's hand-edited story line beside the why_human line #49
# changed): a same-length hunk is merged line by line, not reported as a conflict.
ADJ="$WORK/adjacent.md"; sed 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** HAND EDIT beside the reworded line./' "$WORK/u-before.md" > "$ADJ"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "adjacent changes: no conflict" '.conflicts | length' "0" unattended "$ADJ" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "adjacent changes, --merge: written" '[.changed, .written] | join(",")' "true,true" unattended "$ADJ" "${FILL[@]}" --merge
check "adjacent changes: the template's line taken" grep -q 'TEMPLATE REWORDED' "$ADJ"
check "adjacent changes: the hand edit kept" grep -q 'HAND EDIT beside' "$ADJ"
# A conflicting line beside a one-sided change in the same hunk (#64, R1-1): the conflict is that line
# alone, so a pick settles it and the change beside it comes through whichever side is picked.
AC="$WORK/adj-conflict.md"; sed -e 's/^1\. \*\*Plan mode\.\*\*.*/1. **Plan mode.** HAND EDIT kept./' -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** HAND EDIT two./' "$WORK/u-before.md" > "$AC"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "a conflict beside a hand edit: one conflict, that line alone" '[(.conflicts|length|tostring), (.conflicts[0].base|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs|length|tostring), (.conflicts[0].ours[0]|test("HAND EDIT kept")|tostring)] | join(",")' "1,1,1,1,true" unattended "$AC" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4/shape-spec-unattended.md" expect_json "a conflict beside a hand edit, --pick 1=theirs: written" '[.changed, .written] | join(",")' "true,true" unattended "$AC" "${FILL[@]}" --merge --pick 1=theirs
check "a conflict beside a hand edit, --pick 1=theirs: the template's line taken" grep -q 'TEMPLATE REWORDED' "$AC"
check "a conflict beside a hand edit, --pick 1=theirs: the hand edit beside it kept" grep -q 'HAND EDIT two' "$AC"
# The mirror: the template also rewords line 2, which the section left alone; --pick 1=ours keeps the
# hand edit on line 1 and still takes the template's line 2.
V4B="$WORK/v4b"; mkdir -p "$V4B/history"; cp "$V4"/history/shape-spec-unattended.v*.md "$V4B/history/"
sed 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** TEMPLATE REWORDED TWO./' "$V4/shape-spec-unattended.md" > "$V4B/shape-spec-unattended.md"
AO="$WORK/adj-ours.md"; cp "$WORK/u-hand.md" "$AO"
REDLINE_UNATTENDED_TEMPLATE="$V4B/shape-spec-unattended.md" expect_json "a conflict beside a template change: one conflict, that line alone" '[(.conflicts|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs[0]|test("TEMPLATE REWORDED\\.")|tostring)] | join(",")' "1,1,true" unattended "$AO" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4B/shape-spec-unattended.md" expect_json "a conflict beside a template change, --pick 1=ours: written" '[.changed, .written] | join(",")' "true,true" unattended "$AO" "${FILL[@]}" --merge --pick 1=ours
check "a conflict beside a template change, --pick 1=ours: the hand edit kept" grep -q 'HAND EDIT kept' "$AO"
check "a conflict beside a template change, --pick 1=ours: the template's line beside it taken" grep -q 'TEMPLATE REWORDED TWO' "$AO"
# A same-length hunk whose lines do not line up (#64, R2-1): the section deletes point 1 and adds its own
# line after point 2, and the template rewords point 2. The section's point 2 sits one line up from the
# base's, so a split by position would pair different lines and a pick would write point 2 twice or drop
# the rewording; the hunk stays one conflict, and either pick writes each line once.
V4C="$WORK/v4c"; mkdir -p "$V4C/history"; cp "$V4"/history/shape-spec-unattended.v*.md "$V4C/history/"
sed -e "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** TEMPLATE REWORDED TWO./' "$UT" > "$V4C/shape-spec-unattended.md"
SH="$WORK/shifted.md"; awk '/^1\. \*\*Plan mode\./ { next } { print } /^2\. \*\*No questions\./ { print "2a. HAND ADDED LINE." }' "$WORK/u-before.md" > "$SH"; cp "$SH" "$WORK/shifted-before.md"
REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor in a same-length hunk: one conflict, the whole hunk" '[(.conflicts|length|tostring), (.conflicts[0].base|length|tostring), (.conflicts[0].ours|length|tostring), (.conflicts[0].theirs|length|tostring)] | join(",")' "1,2,2,2" unattended "$SH" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor, --pick 1=theirs: written" '[.changed, .written] | join(",")' "true,true" unattended "$SH" "${FILL[@]}" --merge --pick 1=theirs
[[ "$(grep -c '^2\. \*\*No questions' "$SH")" == "1" ]] && ok "a shifted anchor, --pick 1=theirs: point 2 once" || bad "a shifted anchor, --pick 1=theirs: point 2 once" "$(grep -c '^2\. \*\*No questions' "$SH")"
check "a shifted anchor, --pick 1=theirs: the template's wording" grep -q 'TEMPLATE REWORDED TWO' "$SH"
cp "$WORK/shifted-before.md" "$SH"
REDLINE_UNATTENDED_TEMPLATE="$V4C/shape-spec-unattended.md" expect_json "a shifted anchor, --pick 1=ours: written" '[.changed, .written] | join(",")' "true,true" unattended "$SH" "${FILL[@]}" --merge --pick 1=ours
check "a shifted anchor, --pick 1=ours: the hand-added line kept" grep -q '^2a\. HAND ADDED LINE\.$' "$SH"
[[ "$(grep -c '^1\. \*\*Plan mode\.' "$SH")" == "0" && "$(grep -c '^2\. \*\*No questions' "$SH")" == "1" ]] && ok "a shifted anchor, --pick 1=ours: point 1 stays deleted, point 2 once" || bad "a shifted anchor, --pick 1=ours: point 1 stays deleted, point 2 once" "$(grep -c '^[12]\. \*\*' "$SH")"

# --keep: the marker alone.
K="$WORK/keep.md"; cp "$WORK/u-old.md" "$K"
expect_exit "--keep: exit 0" 0 unattended "$K" "${FILL[@]}" --keep
[[ "$(diff "$WORK/u-old.md" "$K" | grep -c '^[<>]')" == "2" ]] && ok "--keep: the diff is the marker line alone" || bad "--keep: the diff is the marker line alone" "$(diff "$WORK/u-old.md" "$K")"
check "--keep: the marker is the template's version" grep -q "^<!-- redline-unattended: $UV -->\$" "$K"
cp "$WORK/u-old.md" "$K"
expect_json "--keep --dry-run: changed, not written" '[.changed, .written] | join(",")' "true,false" unattended "$K" "${FILL[@]}" --keep --dry-run
same "--keep --dry-run: untouched" "$K" "$WORK/u-old.md"
expect_exit "--keep with a changed range: exit 1" 1 unattended "$K" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body --keep
same "--keep with a changed range: untouched" "$K" "$WORK/u-old.md"
expect_exit "--keep --force with a changed range: exit 0" 0 unattended "$K" --gate-steps 1-6 --prose-steps "6 and 7" --retro-step 6 --no-pr-body --keep --force
check "--keep --force: the range patched" grep -q '(gate steps 1 to 6)' "$K"
check "--keep --force: the marker written" grep -q "^<!-- redline-unattended: $UV -->\$" "$K"
# A newer section is never merged down; a marked section with no frozen copy exits 2.
expect_exit "a newer section: exit 1, no merge" 1 unattended "$WORK/u-new.md" "${FILL[@]}" --merge
expect_json "a newer section: newer true" '.version.newer' "true" unattended "$WORK/u-new.md" "${FILL[@]}" --merge
E="$WORK/empty"; mkdir -p "$E/history"; cp "$UT" "$E/shape-spec-unattended.md"
REDLINE_UNATTENDED_TEMPLATE="$E/shape-spec-unattended.md" expect_exit "a marked section whose frozen copy is missing: exit 2" 2 unattended "$WORK/u-old.md" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$E/shape-spec-unattended.md" expect_stderr "a marked section whose frozen copy is missing: names the file" "shape-spec-unattended.v$((UN-1)).md" unattended "$WORK/u-old.md" "${FILL[@]}"
REDLINE_UNATTENDED_TEMPLATE="$E/shape-spec-unattended.md" expect_json "an unmarked section with an empty history: the template is the only candidate" '[.base, (.guessed|tostring)] | join(",")' "$UV,true" unattended "$WORK/u-nomark.md" "${FILL[@]}"

echo "# unattended template: every version below the current one is frozen under templates/history (#15)"
[[ "$UV" =~ ^v[0-9]+$ ]] && ok "the template carries a version marker" || bad "the template carries a version marker" "'$UV'"
for ((n=1; n<UN; n++)); do
    hf="$UHIST/shape-spec-unattended.v$n.md"
    [[ -f "$hf" ]] && grep -q "^<!-- redline-unattended: v$n -->\$" "$hf" && grep -q '^---$' "$hf" \
        && ok "history: v$n is frozen with its marker and its --- line" || bad "history: v$n is frozen with its marker and its --- line" "$hf"
done
[[ ! -e "$UHIST/shape-spec-unattended.$UV.md" ]] && ok "history: the current version is not frozen" || bad "history: the current version is not frozen" "$UHIST/shape-spec-unattended.$UV.md exists"
# Every unattended body is pinned by version (#64, R1-2): the sha256 of the lines after the first ---
# line, for the current template and each frozen copy under templates/history/. A body change that left
# the marker where it was, or an edit to a frozen copy, fails here. A bump adds its version's line below,
# which is the reminder to freeze the previous body in the same commit; the older lines never change.
ubody_pin() {
    case "$1" in
        v1) echo "a408539181c8e3bc9719ad4b8544705158b0ce48a9cd69f25be3b2f3e6836421" ;;
        v2) echo "223a713c121ca604bdc5aba264485b3af64a5d49a0730d0ed9382ac94bacf9d4" ;;
        v3) echo "e89c83447394d1317aabfe79a4b9dff0030d12157dfebc02934848402435229a" ;;
        v4) echo "d88ad3f0ea4188a5a93a4b49e9c88634f81e314e45ce4f04aa8b995bd472586b" ;;
        v5) echo "23048ad3b9c0bd45a77a640666bf6f38560466d8050c46e32ffa9cc594da6949" ;;
        v6) echo "68e54bbaf1c3d931cbf95f9c8418aeec5d15356d0676a65e99602734727eaa31" ;;
        v7) echo "82cd30a72d62b93a53bd93845ecba9890c4e557ee2edcc426eecdc233ff2cc36" ;;
    esac
}
# ubody_sha <file>: the sha256 of the file's body, the lines after its first --- line.
ubody_sha() { awk 'f { print } /^---$/ { f = 1 }' "$1" | shasum -a 256 | awk '{ print $1 }'; }
# ubody_ok <template> <history dir>: every version's body matches its pin; prints the first that does not.
ubody_ok() {
    local t="$1" h="$2" v n got want
    v="$(grep -m1 '^<!-- redline-unattended: v' "$t" | sed 's/^<!-- redline-unattended: \(v[0-9]*\) -->.*/\1/')"
    for ((n=1; n<${v#v}; n++)); do
        want="$(ubody_pin "v$n")"; got="$(ubody_sha "$h/shape-spec-unattended.v$n.md")"
        [[ -n "$want" && "$got" == "$want" ]] || { echo "v$n (frozen): pinned ${want:-nothing}, got $got; a frozen copy never changes"; return 1; }
    done
    want="$(ubody_pin "$v")"; got="$(ubody_sha "$t")"
    [[ -n "$want" && "$got" == "$want" ]] || { echo "$v (current): pinned ${want:-nothing}, got $got; a body change bumps the marker, freezes the previous body under templates/history/ and pins the new version here"; return 1; }
}
msg="$(ubody_ok "$UT" "$UHIST")" && ok "history: every unattended body matches its pinned hash ($UV and the frozen copies)" || bad "history: every unattended body matches its pinned hash ($UV and the frozen copies)" "$msg"
# A reworded body line under the same marker fails, naming the current version.
PN="$WORK/pin-nobump"; mkdir -p "$PN/history"; cp "$UHIST"/shape-spec-unattended.v*.md "$PN/history/"
sed 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** REWORDED WITHOUT A BUMP./' "$UT" > "$PN/shape-spec-unattended.md"
msg="$(ubody_ok "$PN/shape-spec-unattended.md" "$PN/history")"; rc=$?
[[ $rc -ne 0 && "$msg" == "$UV (current):"* ]] && ok "pins: a body change without a bump fails, naming $UV" || bad "pins: a body change without a bump fails, naming $UV" "exit $rc: $msg"
# An edit to the previous version's frozen copy fails, naming that version.
PF="$WORK/pin-frozen"; mkdir -p "$PF/history"; cp "$UT" "$PF/shape-spec-unattended.md"; cp "$UHIST"/shape-spec-unattended.v*.md "$PF/history/"
awk '{ print } END { print "A FROZEN EDIT." }' "$UHIST/shape-spec-unattended.v$((UN-1)).md" > "$PF/history/shape-spec-unattended.v$((UN-1)).md"
msg="$(ubody_ok "$PF/shape-spec-unattended.md" "$PF/history")"; rc=$?
[[ $rc -ne 0 && "$msg" == "v$((UN-1)) (frozen):"* ]] && ok "pins: an edit to a frozen copy fails, naming v$((UN-1))" || bad "pins: an edit to a frozen copy fails, naming v$((UN-1))" "exit $rc: $msg"
# A bump done right (marker bumped, previous body frozen) with no new pin still fails: the bump touches the test.
PB="$WORK/pin-bump"; mkdir -p "$PB/history"; cp "$UHIST"/shape-spec-unattended.v*.md "$PB/history/"; cp "$UT" "$PB/history/shape-spec-unattended.$UV.md"
sed -e "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN+1)) -->/" -e 's/^2\. \*\*No questions\.\*\*.*/2. **No questions.** REWORDED WITH A BUMP./' "$UT" > "$PB/shape-spec-unattended.md"
msg="$(ubody_ok "$PB/shape-spec-unattended.md" "$PB/history")"; rc=$?
[[ $rc -ne 0 && "$msg" == "v$((UN+1)) (current): pinned nothing"* ]] && ok "pins: a bump with no pin for v$((UN+1)) fails" || bad "pins: a bump with no pin for v$((UN+1)) fails" "exit $rc: $msg"

echo "# version"
expect_exit "the template matches itself" 0 version "$TEMPLATE"
expect_json "the template: match" '[.template, .file, (.match|tostring)] | join(",")' "$TV,$TV,true" version "$TEMPLATE"
sed "s/^# redline-template: checks-template.sh $TV\$/# redline-template: checks-template.sh v$((TN-1))/" "$TEMPLATE" > "$WORK/older.sh"
expect_exit "an older version: exit 1" 1 version "$WORK/older.sh"
expect_json "an older version: match false" '[.file, (.match|tostring)] | join(",")' "v$((TN-1)),false" version "$WORK/older.sh"
expect_json "an older version: newer false" '.newer' "false" version "$WORK/older.sh"
expect_stderr "an older version: still says to run /redline:setup" "Run /redline:setup" version "$WORK/older.sh"
sed "s/^# redline-template: checks-template.sh $TV\$/# redline-template: checks-template.sh v$((TN+1))/" "$TEMPLATE" > "$WORK/newer.sh"
expect_exit "a newer version: exit 1" 1 version "$WORK/newer.sh"
expect_json "a newer version: newer true" '[.file, (.match|tostring), (.newer|tostring)] | join(",")' "v$((TN+1)),false,true" version "$WORK/newer.sh"
expect_stderr "a newer version: says to update the plugin" "update the plugin" version "$WORK/newer.sh"
newererr="$("$SETUP" version "$WORK/newer.sh" 2>&1 >/dev/null)"
[[ -n "$newererr" && "$newererr" != *"/redline:setup"* ]] && ok "a newer version: does not suggest /redline:setup" || bad "a newer version: does not suggest /redline:setup" "$newererr"
expect_exit "no version line: exit 1" 1 version "$GFIX/checks-no-stamp.sh"
expect_json "no version line: file null" '.file' "null" version "$GFIX/checks-no-stamp.sh"
expect_exit "a missing file: exit 2" 2 version "$WORK/missing.sh"
expect_exit "this checkout's checks.sh carries the current version" 0 version "$PLUGIN/.claude/redline/checks.sh"
expect_exit "this checkout's unattended section carries the current version (#15)" 0 unattended --version "$PLUGIN/.claude/commands/agent-os/shape-spec.md"

echo "# version <repoRoot>: the whole contract in one read-only call (#15)"
VR="$WORK/vroot"; mkdir -p "$VR/.claude/redline" "$VR/.claude/commands/agent-os"
cp "$TEMPLATE" "$VR/.claude/redline/checks.sh"
cp "$FIX/shape-spec-bare.md" "$VR/.claude/commands/agent-os/shape-spec.md"
"$SETUP" unattended "$VR/.claude/commands/agent-os/shape-spec.md" "${FILL[@]}" >/dev/null 2>&1
"$SETUP" settings "$VR" >/dev/null 2>&1
expect_exit "a current root: exit 0" 0 version "$VR"
expect_json "a current root: checks, unattended and settings all current" '[(.checks.match|tostring), (.unattended.match|tostring), (.settings.missing|length|tostring), (.settings.stale|length|tostring)] | join(",")' "true,true,0,0" version "$VR"
expect_json "a current root: the two version objects have the file form's shape" '[(.checks|keys|join("+")), (.unattended|keys|join("+"))] | join(",")' "file+match+newer+template,file+match+newer+template" version "$VR"
[[ -z "$("$SETUP" version "$VR" 2>&1 >/dev/null)" ]] && ok "a current root: no stderr line" || bad "a current root: no stderr line" "$("$SETUP" version "$VR" 2>&1 >/dev/null)"
cp "$VR/.claude/redline/checks.sh" "$WORK/vroot-checks.sh"; cp "$WORK/older.sh" "$VR/.claude/redline/checks.sh"
expect_exit "an older checks.sh: exit 1" 1 version "$VR"
expect_json "an older checks.sh: checks.match false, the rest current" '[(.checks.match|tostring), (.unattended.match|tostring), (.settings.missing|length|tostring)] | join(",")' "false,true,0" version "$VR"
expect_stderr "an older checks.sh: the checks line" "was made from checks-template.sh v$((TN-1)); the plugin ships $TV. Run /redline:setup" version "$VR"
cp "$WORK/vroot-checks.sh" "$VR/.claude/redline/checks.sh"
cp "$VR/.claude/commands/agent-os/shape-spec.md" "$WORK/vroot-spec.md"
sed "s/^<!-- redline-unattended: $UV -->\$/<!-- redline-unattended: v$((UN-1)) -->/" "$WORK/vroot-spec.md" > "$VR/.claude/commands/agent-os/shape-spec.md"
expect_exit "an older section: exit 1" 1 version "$VR"
expect_json "an older section: unattended.file is the older version" '[(.checks.match|tostring), .unattended.file, (.unattended.match|tostring)] | join(",")' "true,v$((UN-1)),false" version "$VR"
expect_stderr "an older section: the issue's line" "the unattended section in .*shape-spec.md was made from template v$((UN-1)); the plugin ships $UV. Run /redline:setup to see the change" version "$VR"
cp "$WORK/vroot-spec.md" "$VR/.claude/commands/agent-os/shape-spec.md"
cp "$VR/.claude/settings.json" "$WORK/vroot-settings.json"
jq 'del(.permissions.allow[] | select(. == "Bash(git status:*)"))' "$WORK/vroot-settings.json" > "$VR/.claude/settings.json"
expect_exit "a settings.json missing an entry: exit 1" 1 version "$VR"
expect_json "a settings.json missing an entry: missing names it" '.settings.missing | join(",")' "Bash(git status:*)" version "$VR"
expect_stderr "a settings.json missing an entry: the line counts and names it" "settings.json lacks 1 entry the plugin now expects (Bash(git status:\*)); run /redline:setup" version "$VR"
jq '.permissions.allow += ["Bash(/*/scripts/redline-gh.sh *)"]' "$WORK/vroot-settings.json" > "$VR/.claude/settings.json"
expect_exit "a settings.json with a retired entry: exit 1" 1 version "$VR"
expect_json "a settings.json with a retired entry: stale names it, missing empty" '[(.settings.stale|join(",")), (.settings.missing|length|tostring)] | join("|")' "Bash(/*/scripts/redline-gh.sh *)|0" version "$VR"
expect_stderr "a settings.json with a retired entry: the line counts and names it" "settings.json carries 1 entry the plugin retired (Bash(/\*/scripts/redline-gh.sh \*)); run /redline:setup" version "$VR"
rm "$VR/.claude/settings.json"
expect_exit "no settings.json: exit 1" 1 version "$VR"
expect_json "no settings.json: every template entry is missing" '.settings.missing | length' "$(jq '.permissions.allow | length' "$PLUGIN/templates/settings.allow.json")" version "$VR"
printf '\xef\xbb\xbf{}' > "$VR/.claude/settings.json"
expect_exit "a settings.json with a BOM: exit 2" 2 version "$VR"
cp "$WORK/vroot-settings.json" "$VR/.claude/settings.json"

echo "# version <repoRoot>: a self-hosted root, and whether the run loads it in place (#16)"
# The script runs from the plugin the session loaded (the skill calls it by CLAUDE_PLUGIN_ROOT), so its own
# root is what loads; a root whose manifest names the same plugin from another path is the released copy
# reviewing a checkout.
expect_json "a root that is not the plugin: self false, inPlace null, pluginRoot the plugin" '[(.plugin.self|tostring), (.plugin.inPlace|tostring), .plugin.pluginRoot] | join(",")' "false,null,$PLUGIN" version "$VR"
# What a run records as args.launch (#135): the loaded copy's manifest version and its workflow file's git
# blob id, read off this script's own root whatever root is under review.
expect_json "the plugin's version and workflow blob are the loaded copy's (#135)" '[.plugin.version, .plugin.workflow] | join(",")' "$(jq -r .version "$PLUGIN/.claude-plugin/plugin.json"),$(git hash-object --no-filters "$PLUGIN/workflows/redline-loop.js")" version "$VR"
# A copy of the plugin at another version, with an edited workflow, reports its own pair, not this checkout's.
CP="$WORK/plugin-copy"; mkdir -p "$CP"; cp -R "$PLUGIN/scripts" "$PLUGIN/templates" "$PLUGIN/.claude-plugin" "$PLUGIN/workflows" "$CP/"
jq '.version = "9.8.7"' "$PLUGIN/.claude-plugin/plugin.json" > "$CP/.claude-plugin/plugin.json"
# The copy's workflow carries the copy's version too: a copy whose two places disagree is stopped (#137, R4-2, below).
sed "s/^const REDLINE_VERSION = .*\$/const REDLINE_VERSION = '9.8.7'/" "$PLUGIN/workflows/redline-loop.js" > "$CP/workflows/redline-loop.js"
printf '\n// an edit\n' >> "$CP/workflows/redline-loop.js"
CPW="$(git hash-object --no-filters "$CP/workflows/redline-loop.js")"
[[ "$CPW" != "$(git hash-object --no-filters "$PLUGIN/workflows/redline-loop.js")" ]] && ok "the copy's workflow blob differs from this checkout's" || bad "the copy's workflow blob differs from this checkout's" "$CPW"
cpout="$("$CP/scripts/redline-setup.sh" version "$VR" 2>/dev/null)"
[[ "$(jq -r '[.plugin.version, .plugin.workflow, .plugin.pluginRoot] | join(",")' <<<"$cpout")" == "9.8.7,$CPW,$(cd "$CP" && pwd)" ]] && ok "a copy at another version reports its own version, blob and root (#135)" || bad "a copy at another version reports its own version, blob and root (#135)" "$(jq -c .plugin <<<"$cpout")"

echo "# version <repoRoot>: the loaded copy's own two version places agree, or the launch stops (#137, R4-2, R3-5)"
# A run records the version in the loaded copy's plugin.json as args.launch, and the workflow compares
# it with its own REDLINE_VERSION. A copy whose manifest holds no version string, or whose two places
# disagree, got every fresh launch refused or thrown at the workflow, and the reopen the skill then
# advises loads the same files. So version stops such a copy itself, exit 2, with a line naming both
# files and both values; it prints no JSON, so the skill has no version to record.
# vcopy <dir> <jq filter for the manifest> <the workflow's REDLINE_VERSION line>
vcopy() {
    rm -rf "$1"; mkdir -p "$1"; cp -R "$PLUGIN/scripts" "$PLUGIN/templates" "$PLUGIN/.claude-plugin" "$PLUGIN/workflows" "$1/"
    jq "$2" "$PLUGIN/.claude-plugin/plugin.json" > "$1/.claude-plugin/plugin.json"
    sed "s|^const REDLINE_VERSION = .*\$|$3|" "$PLUGIN/workflows/redline-loop.js" > "$1/workflows/redline-loop.js"
}
SHIPPED="$(jq -r .version "$PLUGIN/.claude-plugin/plugin.json")"
SHIPPED_LINE="const REDLINE_VERSION = '$SHIPPED'"
VC="$WORK/v-copy"; VCP="$(mkdir -p "$VC" && cd "$VC" && pwd)"
# vstop <name> <the line's text>: exit 2, the line on stderr, nothing on stdout
vstop() {
    local out err rc=0
    out="$("$VC/scripts/redline-setup.sh" version "$VR" 2>"$WORK/v-copy.err")" || rc=$?
    err="$(cat "$WORK/v-copy.err")"
    [[ $rc -eq 2 && -z "$out" && "$err" == *"$2"* ]] && ok "$1" || bad "$1" "exit $rc, stdout '${out:0:80}', stderr: $err"
}
vcopy "$VC" '.version = "9.8.7"' "$SHIPPED_LINE"
vstop "a copy whose plugin.json is ahead of its workflow's REDLINE_VERSION stops, exit 2, naming both files and both values (#137, R4-2)" "redline-setup: this copy of Redline disagrees with itself: $VCP/.claude-plugin/plugin.json says version 9.8.7 and $VCP/workflows/redline-loop.js says REDLINE_VERSION $SHIPPED."
vstop "its line says what to do: make the two agree, then reopen the session (#137, R4-2)" "Make the two agree, and the entry in .claude-plugin/marketplace.json with them, then reopen the session so it loads the corrected files"
vcopy "$VC" '.' "const REDLINE_VERSION = '9.9.9'"
vstop "a copy whose workflow is ahead of its plugin.json stops the same way (#137, R4-2)" "$VCP/.claude-plugin/plugin.json says version $SHIPPED and $VCP/workflows/redline-loop.js says REDLINE_VERSION 9.9.9."
vcopy "$VC" 'del(.version)' "$SHIPPED_LINE"
vstop "a copy whose plugin.json holds no version stops with a line naming the file (#137, R3-5)" "redline-setup: $VCP/.claude-plugin/plugin.json holds no version string, so a run from this copy of Redline has no version to record."
vcopy "$VC" '.version = 5' "$SHIPPED_LINE"
vstop "a version that is not a string is no version string (#137, R4-2)" "$VCP/.claude-plugin/plugin.json holds no version string"
vcopy "$VC" '.' "// no version constant"
vstop "a copy whose workflow holds no REDLINE_VERSION line stops with a line naming the file (#137, R4-2)" "redline-setup: $VCP/workflows/redline-loop.js holds no line of the form const REDLINE_VERSION = '<version>', so the workflow's version cannot be compared with the $SHIPPED in $VCP/.claude-plugin/plugin.json."
vcopy "$VC" '.' "const REDLINE_VERSION = 0.5"
vstop "a REDLINE_VERSION that is not a quoted string is no such line (#137, R4-2)" "$VCP/workflows/redline-loop.js holds no line of the form const REDLINE_VERSION = '<version>'"
# The neighbours: a copy whose two places agree is reported as before, in either quote style.
vcopy "$VC" '.' "const REDLINE_VERSION = \"$SHIPPED\""
vout="$("$VC/scripts/redline-setup.sh" version "$VR" 2>/dev/null)"
[[ "$(jq -r '[.plugin.version, .plugin.pluginRoot] | join(",")' <<<"$vout")" == "$SHIPPED,$VCP" ]] && ok "a copy whose constant is in double quotes and agrees is reported as before" || bad "a copy whose constant is in double quotes and agrees is reported as before" "$(jq -c .plugin <<<"$vout")"
vcopy "$VC" '.' "$SHIPPED_LINE"
"$VC/scripts/redline-setup.sh" version "$VR" >/dev/null 2>&1; vrc=$?
"$SETUP" version "$VR" >/dev/null 2>&1; src=$?
[[ $vrc -eq $src && $vrc -ne 2 ]] && ok "a copy as shipped exits as this checkout does, never 2" || bad "a copy as shipped exits as this checkout does, never 2" "copy $vrc, checkout $src"

echo "# version <repoRoot>: the installs this repository sees, and the launch warning (#135)"
# A session runs the install listed first among the ones it sees (user, and project or local for its
# directory), and an install or update elsewhere reorders the list, so a session that reloads can
# switch versions mid-run. claude plugin list --json lists every install; the ones whose installPath
# is this script's root run this session's files, and installs at one version share one cache
# folder, so there can be more than one (#137, R3-6).
PP="$(cd "$PLUGIN" && pwd -P)"; VRP="$(cd "$VR" && pwd -P)"; VRL="$(cd "$VR" && pwd)"
# installs <file> <scope:version:path>...: a list as the CLI prints one; path is self (this script's
# root), root (the fixture root, for a project or local install) or any other path.
installs() {
    local out="$1"; shift
    local e scope ver at json='[]'
    for e in "$@"; do
        IFS=: read -r scope ver at <<<"$e"
        case "$at" in self) at="$PP" ;; esac
        json="$(jq -c --arg s "$scope" --arg v "$ver" --arg at "$at" --arg pp "$PP" --arg root "$VRP" '. + [{id: "redline@m", scope: $s, version: $v, enabled: true,
            installPath: (if $at == $pp then $pp else "/c/redline/" + $v end)}
            + (if $s == "user" then {} else {projectPath: (if $at == "root" then $root else $at end)} end)]' <<<"$json")"
    done
    printf '%s\n' "$json" > "$out"
}
LINE_TAIL="; a reload or a reopen runs whichever is listed first, and a run that switches stops at its next relaunch."
installs "$WORK/i-self-behind.json" user:0.4.3:self project:0.5.1:root
export STUB_LIST="$WORK/i-self-behind.json"
expect_exit "installs: this session's install behind another: exit 1" 1 version "$VR"
expect_json "installs: each seen install with its scope, version and whether this session runs it" '[.installs[] | "\(.scope):\(.version):\(.running)"] | join(",")' "user:0.4.3:true,project:0.5.1:false" version "$VR"
err="$("$SETUP" version "$VR" 2>&1 >/dev/null)"
want="redline-setup: the Redline installs this repository sees differ: user 0.4.3 (this session's), project 0.5.1$LINE_TAIL Update the older one: claude plugin update redline@m --scope user; then restart the session or run /reload-plugins"
[[ "$err" == "$want" ]] && ok "installs: this session's behind: the line names both and updates the user install, from anywhere" || bad "installs: this session's behind: the line names both and updates the user install, from anywhere" "$err"
installs "$WORK/i-other-behind.json" user:0.5.1:self project:0.4.3:root
export STUB_LIST="$WORK/i-other-behind.json"
expect_exit "installs: another install behind this session's: exit 1" 1 version "$VR"
err="$("$SETUP" version "$VR" 2>&1 >/dev/null)"
want="redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.4.3$LINE_TAIL Update the older one: claude plugin update redline@m --scope project, run from $VRL; then restart the session or run /reload-plugins"
[[ "$err" == "$want" ]] && ok "installs: the other behind: the project update runs from the repository root" || bad "installs: the other behind: the project update runs from the repository root" "$err"
installs "$WORK/i-three.json" user:0.5.1:self project:0.4.3:root local:0.5.0:root
export STUB_LIST="$WORK/i-three.json"
err="$("$SETUP" version "$VR" 2>&1 >/dev/null)"
want="redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.4.3, local 0.5.0$LINE_TAIL Update the older ones: claude plugin update redline@m --scope project, run from $VRL; claude plugin update redline@m --scope local, run from $VRL; then restart the session or run /reload-plugins"
[[ "$err" == "$want" ]] && ok "installs: two behind: one line, an update for each" || bad "installs: two behind: one line, an update for each" "$err"
installs "$WORK/i-numeric.json" user:0.10.0:self project:0.9.0:root
export STUB_LIST="$WORK/i-numeric.json"
expect_stderr "installs: versions compare by number, so 0.9.0 is older than 0.10.0" "Update the older one: claude plugin update redline@m --scope project," version "$VR"
installs "$WORK/i-agree.json" user:0.5.1:self project:0.5.1:root
export STUB_LIST="$WORK/i-agree.json"
expect_exit "installs: every seen install at one version: exit 0" 0 version "$VR"
[[ -z "$("$SETUP" version "$VR" 2>&1 >/dev/null)" ]] && ok "installs: at one version: no line" || bad "installs: at one version: no line" "$("$SETUP" version "$VR" 2>&1 >/dev/null)"
expect_json "installs: at one version: both listed" '.installs | length' "2" version "$VR"
installs "$WORK/i-elsewhere.json" user:0.5.1:self project:0.4.3:/elsewhere local:0.4.0:/elsewhere
export STUB_LIST="$WORK/i-elsewhere.json"
expect_exit "installs: another repository's project and local installs are not seen: exit 0" 0 version "$VR"
expect_json "installs: and are not listed" '[.installs[] | .scope] | join(",")' "user" version "$VR"
installs "$WORK/i-other-id.json" user:0.5.1:self
jq -c '. + [{id: "other@m", scope: "user", version: "9.9.9", installPath: "/c/other/9.9.9"}, {id: "redline@n", scope: "user", version: "0.1.0", installPath: "/c/redline-n/0.1.0"}]' "$WORK/i-other-id.json" > "$WORK/i-other-id2.json"
export STUB_LIST="$WORK/i-other-id2.json"
expect_exit "installs: another plugin, or this one from another marketplace, is not compared: exit 0" 0 version "$VR"
installs "$WORK/i-inplace.json" user:0.5.1:/c/one project:0.4.3:root
jq -c 'map(.installPath = "/c/redline/" + .version)' "$WORK/i-inplace.json" > "$WORK/i-inplace2.json"
export STUB_LIST="$WORK/i-inplace2.json"
expect_exit "installs: a session that runs no install (a checkout loaded in place): exit 0" 0 version "$VR"
expect_json "installs: in place: none listed" '.installs | length' "0" version "$VR"
# An install directory that only another repository's install uses is not one this session can run.
installs "$WORK/i-not-seen.json" user:0.5.1:/c/redline/0.5.1 project:0.4.3:root project:0.2.0:/elsewhere
jq -c 'map(if .version == "0.2.0" then .installPath = $pp else . end)' --arg pp "$PP" "$WORK/i-not-seen.json" > "$WORK/i-not-seen2.json"
export STUB_LIST="$WORK/i-not-seen2.json"
expect_exit "installs: a root that only another repository's install uses is no install this session runs: exit 0" 0 version "$VR"
expect_json "installs: and none is listed" '.installs | length' "0" version "$VR"
export STUB_LIST="$WORK/i-other-behind.json"
STUB_EXIT=1 expect_exit "installs: the CLI fails: exit 0" 0 version "$VR"
printf 'not json\n' > "$WORK/i-notjson.json"
export STUB_LIST="$WORK/i-notjson.json"
expect_exit "installs: the CLI prints no list: exit 0" 0 version "$VR"
expect_json "installs: no list: none listed" '.installs | length' "0" version "$VR"
export STUB_LIST="$WORK/i-other-behind.json"
REDLINE_CLAUDE="$WORK/bin/no-such-claude" expect_exit "installs: no claude CLI: exit 0" 0 version "$VR"
REDLINE_CLAUDE="$WORK/bin/no-such-claude" expect_json "installs: no CLI: none listed" '.installs | length' "0" version "$VR"
# A CLI output the program cannot read is no stop (#137, R1-4). A version or a path that is not a
# string is read as its text: jq 1.8's rtrimstr fails on a non-string, and jq 1.7's, CI's, returns
# it unchanged, so as text a list reads alike under both. Only one whole list is read.
INSTALLS='[.installs[] | "\(.scope):\(.version):\(.running)"] | join(",")'
jq -cn --arg pp "$PP" '[{id: "redline@m", scope: "user", version: 5, enabled: true, installPath: $pp}]' > "$WORK/i-numver.json"
export STUB_LIST="$WORK/i-numver.json"
expect_exit "installs: a version that is a number is read as text: exit 0" 0 version "$VR"
expect_json "installs: and is listed" "$INSTALLS" "user:5:true" version "$VR"
jq -cn --arg pp "$PP" '[{id: "redline@m", scope: "user", version: "0.5.1", enabled: true, installPath: $pp}, {id: "redline@m", scope: "project", version: "0.4.3", enabled: true, installPath: "/c/redline/0.4.3", projectPath: 7}]' > "$WORK/i-numproject.json"
export STUB_LIST="$WORK/i-numproject.json"
expect_exit "installs: a projectPath that is not a string is read as its text: exit 0" 0 version "$VR"
expect_json "installs: so that project install is not seen, and the user install is listed" "$INSTALLS" "user:0.5.1:true" version "$VR"
jq -cn --arg pp "$PP" '[{id: "redline@m", scope: "user", version: "0.5.1", enabled: true, installPath: $pp}, {id: "redline@m", scope: "user", version: "0.5.1", enabled: true, installPath: 7}]' > "$WORK/i-numinstall.json"
export STUB_LIST="$WORK/i-numinstall.json"
expect_exit "installs: an installPath that is not a string is read as its text: exit 0" 0 version "$VR"
expect_json "installs: so that install is listed, and is not this session's" "$INSTALLS" "user:0.5.1:true,user:0.5.1:false" version "$VR"
installs "$WORK/i-one.json" user:0.5.1:self
cat "$WORK/i-one.json" "$WORK/i-one.json" > "$WORK/i-twolists.json"
export STUB_LIST="$WORK/i-twolists.json"
expect_exit "installs: an output of two lists is no list: exit 0" 0 version "$VR"
expect_json "installs: two lists: none listed" '.installs | length' "0" version "$VR"
# Installs at one version share the plugin cache's version folder, so each whose installPath is this
# script's root runs this session's files, and each is marked so (#137, R3-6).
jq -cn --arg pp "$PP" --arg root "$VRP" '[{id: "redline@m", scope: "user", version: "0.5.1", enabled: true, installPath: $pp}, {id: "redline@m", scope: "project", version: "0.5.1", enabled: true, installPath: $pp, projectPath: $root}, {id: "redline@m", scope: "local", version: "0.4.3", enabled: true, installPath: "/c/redline/0.4.3", projectPath: $root}]' > "$WORK/i-shared.json"
export STUB_LIST="$WORK/i-shared.json"
expect_json "installs: two installs sharing this session's folder are each marked running (#137, R3-6)" "$INSTALLS" "user:0.5.1:true,project:0.5.1:true,local:0.4.3:false" version "$VR"
err="$("$SETUP" version "$VR" 2>&1 >/dev/null)"
want="redline-setup: the Redline installs this repository sees differ: user 0.5.1 (this session's), project 0.5.1 (this session's), local 0.4.3$LINE_TAIL Update the older one: claude plugin update redline@m --scope local, run from $VRL; then restart the session or run /reload-plugins"
[[ "$err" == "$want" ]] && ok "installs: both are labelled this session's, and only the older one is updated (#137, R3-6)" || bad "installs: both are labelled this session's, and only the older one is updated (#137, R3-6)" "$err"
unset STUB_LIST
# The script prints the root as cd && pwd does: one slash where TMPDIR ends in one.
SR="$WORK/selfroot"; cp -R "$VR" "$SR"; mkdir -p "$SR/.claude-plugin"; SRP="$(cd "$SR" && pwd)"; printf '{"name": "redline", "version": "0.0.0"}\n' > "$SR/.claude-plugin/plugin.json"
expect_exit "a self-hosted root loaded from elsewhere: exit 1" 1 version "$SR"
expect_json "a self-hosted root loaded from elsewhere: self true, inPlace false, the rest current" '[(.plugin.self|tostring), (.plugin.inPlace|tostring), (.checks.match|tostring), (.unattended.match|tostring), (.settings.missing|length|tostring)] | join(",")' "true,false,true,true,0" version "$SR"
expect_stderr "a self-hosted root loaded from elsewhere: the line names the loaded copy and claude --plugin-dir" "this repository is the plugin, but the run loads Redline from $PLUGIN; start the session with claude --plugin-dir $SRP to run this checkout's own code" version "$SR"
printf '{"name": "other"}\n' > "$SR/.claude-plugin/plugin.json"
expect_exit "a root that is another plugin: exit 0" 0 version "$SR"
expect_json "a root that is another plugin: self false" '.plugin.self' "false" version "$SR"
printf 'not json\n' > "$SR/.claude-plugin/plugin.json"
expect_exit "a root whose manifest is not JSON: exit 2" 2 version "$SR"
mv "$VR/.claude/commands/agent-os/shape-spec.md" "$WORK/vroot-spec-moved.md"
expect_exit "no shape-spec.md: exit 2" 2 version "$VR"
mv "$WORK/vroot-spec-moved.md" "$VR/.claude/commands/agent-os/shape-spec.md"
rm "$VR/.claude/redline/checks.sh"
expect_exit "no checks.sh: exit 2" 2 version "$VR"
expect_exit "neither a file nor a directory: exit 2" 2 version "$WORK/nothing-here"
expect_exit "version with two arguments: exit 2" 2 version "$VR" "$VR"

echo "# this checkout: checks.sh is checks.json generated and stamped"
PJ="$PLUGIN/.claude/redline/checks.json"
[[ -f "$PJ" ]] && ok "this checkout has a committed checks.json" || bad "this checkout has a committed checks.json" "missing"
"$SETUP" checks "$PJ" "$WORK/plugin-checks.sh" >/dev/null 2>&1
"$GATE" stamp "$PLUGIN/.claude/commands/agent-os/shape-spec.md" "$WORK/plugin-checks.sh" >/dev/null 2>&1
same "generated from checks.json and stamped, it equals the committed checks.sh" "$WORK/plugin-checks.sh" "$PLUGIN/.claude/redline/checks.sh"
cp "$PLUGIN/.claude/redline/checks.sh" "$WORK/plugin-rerun.sh"
expect_json "regenerating over the committed file is a no-op" '[.changed, .written, .stampKept] | join(",")' "false,false,true" checks "$PJ" "$WORK/plugin-rerun.sh"
same "regenerating over the committed file leaves it byte-identical" "$WORK/plugin-rerun.sh" "$PLUGIN/.claude/redline/checks.sh"

echo "# this checkout: the manifest, the marketplace entry and the workflow carry one semver version (#16, #135)"
PV="$(jq -r .version "$PLUGIN/.claude-plugin/plugin.json")"
MV="$(jq -r '.plugins[0].version' "$PLUGIN/.claude-plugin/marketplace.json")"
# The workflow's own constant is what its startup check compares a run's args.launch.version with (#135):
# a release that bumps two of the three fails here.
WV="$(sed -n "s/^const REDLINE_VERSION = '\([^']*\)'\$/\1/p" "$PLUGIN/workflows/redline-loop.js")"
[[ "$PV" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && ok "plugin.json carries a semver version" || bad "plugin.json carries a semver version" "$PV"
[[ "$MV" == "$PV" ]] && ok "the marketplace entry carries the same version (claude plugin tag refuses a disagreement)" || bad "the marketplace entry carries the same version (claude plugin tag refuses a disagreement)" "entry $MV, manifest $PV"
[[ "$WV" == "$PV" ]] && ok "the workflow's REDLINE_VERSION is the same version (#135)" || bad "the workflow's REDLINE_VERSION is the same version (#135)" "workflow '${WV}', manifest $PV"
[[ "$(grep -c "^const REDLINE_VERSION = " "$PLUGIN/workflows/redline-loop.js")" == 1 ]] && ok "the workflow declares REDLINE_VERSION once (#135)" || bad "the workflow declares REDLINE_VERSION once (#135)" "$(grep -c "^const REDLINE_VERSION = " "$PLUGIN/workflows/redline-loop.js") declarations"
[[ "$(jq -r '.plugins[0].name' "$PLUGIN/.claude-plugin/marketplace.json")" == "$(jq -r .name "$PLUGIN/.claude-plugin/plugin.json")" ]] && ok "the marketplace entry's name is the manifest's name" || bad "the marketplace entry's name is the manifest's name" "$(jq -c '{entry: .plugins[0].name}' "$PLUGIN/.claude-plugin/marketplace.json")"

# A dry run: a missing alias file reads absent and stays missing, never written into the checkout (#63, R1-3).
expect_json "this checkout's /redline alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline --dry-run
expect_json "this checkout's /redline-revise alias is the template (#44)" '.status' "unchanged" command "$PLUGIN" redline-revise --dry-run
# The whole contract, as the launch precheck reads it (#15): checks.sh, the section and settings.json current.
expect_exit "this checkout's contract is current: version <repoRoot> exits 0 (#15)" 0 version "$PLUGIN"
expect_json "this checkout is the plugin and loads in place: self true, inPlace true (#16)" '[(.plugin.self|tostring), (.plugin.inPlace|tostring)] | join(",")' "true,true" version "$PLUGIN"

printf '\n%s passed, %s failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
