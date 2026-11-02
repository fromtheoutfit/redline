#!/usr/bin/env bash
#
# redline-setup.sh: the scriptable parts of /redline:setup, the skill that walks a repository through
# Redline's contract. The skill does the talking; this script does every edit that can be tested:
# the settings.json merge, the .gitignore line, the alias command files, the unattended section of
# shape-spec.md, redline.json from the baseline time, and checks.sh generated from the repository's
# .claude/redline/checks.json.
# checks.json is the source of truth: a change to the gate is an edit to the JSON and a regenerate,
# never a hand edit of checks.sh.
#
#   redline-setup.sh settings <repoRoot> [--allow <entry>]... [--remove-stale] [--dry-run]
#       Merge templates/settings.allow.json into <repoRoot>/.claude/settings.json without dropping
#       a key or changing a value already there: a top-level key the file lacks is appended, and
#       under a top-level object both have, each entry the file lacks is appended while each entry
#       it has is kept whole. permissions.allow is the existing entries, then the template's not
#       yet present, then each --allow not yet present. Every kept value that differs from the
#       template's is listed under conflicts. An allow entry an earlier template added and this one
#       no longer carries (templates/settings.retired.json, #50) is listed under stale and kept;
#       --remove-stale drops those entries instead and lists them under removed. Compared as JSON,
#       so a file the plugin CLI reordered is left alone. Keeps CRLF. Prints
#       {file, existed, changed, written, added, removed, stale, keysAdded, conflicts}.
#   redline-setup.sh gitignore <repoRoot> [--dry-run]
#       Add .claude/redline.local.json after .claude/settings.local.json, else after the last
#       .claude/ entry, else at the end; keeps CRLF. Prints {file, existed, changed, written, line,
#       after, at}.
#   redline-setup.sh command <repoRoot> <redline|redline-revise> [--force] [--dry-run]
#       Write the short alias command file <repoRoot>/.claude/commands/<name>.md verbatim from
#       templates/command-<name>.md (#44): a one-line project command that invokes the namespaced
#       skill with $ARGUMENTS. The template is the file, so a rerun compares bytes: status is absent
#       (written), unchanged, differs (the file carries the "<!-- redline-alias:" marker line but
#       not the template's bytes: exits 1 with the unified diff under diff, and --force rewrites it)
#       or foreign (no marker line: a person's own command of that name, never written, --force or
#       not). Prints {file, name, template, existed, status, changed, written, diff}.
#   redline-setup.sh unattended <shape-spec.md> --gate-steps <m>-<n> --prose-steps <text>
#           --retro-step <n> (--pr-body-standard <name> | --no-pr-body)
#           [--force] [--merge [--pick <n>=ours|theirs]... | --keep] [--dry-run]
#       Insert templates/shape-spec-unattended.md's section after the plan-mode check under
#       Prerequisites with the fill-ins applied; its first line inside the section is the template's
#       version marker, <!-- redline-unattended: vN --> (#15). When the section is present, compare
#       its marker with the template's first, then read its fill-ins back. Marker equal: equal
#       fill-ins is up to date; different exits 1 with {differs}, and --force patches those phrases
#       in place without re-pasting the body. Marker older, or none: exits 1 with the three-way
#       view, and nothing is written without --merge or --keep. The base is the frozen body under
#       templates/history/ at the section's version (exit 2 when that file is missing), or, with no
#       marker, the candidate (every frozen body and the current template) with the fewest lines
#       differing from the section, the newest on a tie, reported as guessed: a section whose hand
#       deletions are exactly a version's additions is guessed older and the merge would restore
#       them, so read templateDiff before --merge. Every side carries the wanted fill-ins before
#       the merge (fill-in phrases never conflict); a hunk changed only in the section (a hand
#       edit or deletion) is kept, changed only in the template is taken, a hunk of one length on every
#       side is merged line by line, and a line changed in both differently is a conflict, numbered under conflicts [{n, base, ours, theirs}] and shown diff3-style in
#       merged, which is never written: --merge writes the merged section with the wanted fill-ins
#       and the current marker when there is no conflict (it implies --force), and with conflicts
#       needs one --pick <n>=ours|theirs per conflict, else exits 1 unchanged; --keep writes the
#       current marker alone and keeps the body as it stands (the warning then stops; fill-ins
#       must match, or --force with it); --force alone writes nothing on a mismatch. A newer marker
#       than the template's exits 1 and is never merged down. templateDiff is the unified diff from
#       the base to the template, handEdits from the base to the section. A wanted --pr-body-standard
#       over a section that hand-wrote its own point 11 inserts the template's beside it. Keeps a
#       BOM and CRLF. Prints {file, present, changed, written, fillins, found, differs, insertedAt,
#       version, base, guessed, templateDiff, handEdits, merged, conflicts}.
#   redline-setup.sh unattended --version <shape-spec.md>
#       Compare the section's version marker with the template's. Prints {template, file, match,
#       newer} as version does; exits 1 on a mismatch, a missing marker or a missing section, and
#       the stderr line says which: run /redline:setup for an older or missing one, update the
#       plugin for a newer one.
#   redline-setup.sh config --reviewer <handle> --baseline-seconds <n> [<repoRoot>] [--ask-rules <file>] [--force] [--dry-run]
#       redline.json from templates/redline.json.example: checker is git-only when the baseline is
#       over 300 s, else full; checkerStallMs is the baseline times 1.7, rounded up to five minutes,
#       never below 300000. With a root, writes <repoRoot>/.claude/redline.json. Over an existing
#       file, updates only checker and checkerStallMs in place (listed under updated) and keeps every
#       other value, reviewer included, as the person's: each that differs from the template's is
#       listed under differs and left alone. Exits 1 when checker or checkerStallMs cannot be updated
#       in place. --force rewrites the whole file from the template.
#       --ask-rules <file> (#49) is the repository's ask rules as a JSON list of {id, when, reason}
#       (id [a-z][a-z0-9-]*, unique; when exactly one of {paths: [globs]} or {prose: "<sentence>"};
#       reason one line; a pattern holds no ! or [): a fresh file carries it as askRules; an existing
#       file whose askRules differ is rewritten with the list (listed under updated.askRules), one
#       whose list is equal is left alone. Without the flag an existing askRules is kept, and never
#       listed under differs; --force without the flag drops it. askRules in the output is the
#       file's list after the call (null when it has none). A bad list exits 2 naming the rule.
#       Prints {config, file, existed, changed, written, updated, differs, askRules}.
#   redline-setup.sh suggest-ask-rules <repoRoot>
#       The ask rules the repository's stack suggests (#49), read off composer.json: craftcms/cms
#       suggests config/project/** (Craft project config is applied through the control panel),
#       laravel/framework suggests database/migrations/*. Prints {suggestions: [{id, when, reason,
#       because}]}, [] with no composer.json or no known dependency; exits 2 on a composer.json
#       that is not JSON. Writes nothing.
#   redline-setup.sh checks <checks.json> <checks.sh> [--dry-run]
#       Generate checks.sh from the JSON and scripts/checks-template.sh: a header naming the gate,
#       the checks (each command as a person types it, a source step unescaped; each var as
#       ENV=<name>   doc (default value)) and the baseline, the template version line, the stamp
#       (an existing one is kept, else the TODO placeholder), the template's functions verbatim,
#       and one run_check per step. Deterministic; nothing is written when the bytes are
#       unchanged. With --dry-run, nothing is written, not even the target's directory. Prints
#       {file, written, changed, stampKept, checks, templateVersion}.
#   redline-setup.sh read-checks <checks.sh>
#       Read the run_check lines, guards, variables, ALWAYS_ALLOWED (or the allowed list a
#       hand-written git block hard-codes after 'agent-os/specs/' 'agent-os/standards/') and header
#       back (the gate file with or without the generated "steps m to n"; a var's doc with or
#       without its "(default ...)"), and print them with a best-effort checks.json under "input"
#       (the bootstrap for a hand-written checks.sh).
#   redline-setup.sh version <checks.sh>
#       Compare the file's "# redline-template:" line with the template's. Prints {template, file,
#       match, newer}; exits 1 on a mismatch or a missing line, and the stderr line says which: run
#       /redline:setup for an older or missing line, update the plugin for a newer one.
#   redline-setup.sh version <repoRoot>
#       The whole contract in one read-only call, the one /redline:redline's precheck makes (#15):
#       <repoRoot>/.claude/redline/checks.sh as above, the unattended section of
#       <repoRoot>/.claude/commands/agent-os/shape-spec.md as unattended --version, and
#       <repoRoot>/.claude/settings.json against templates/settings.allow.json and
#       settings.retired.json (missing: the template's entries the file lacks; stale: the retired
#       ones it carries; the repository's own entries are never listed; no file is every entry
#       missing). Prints {checks, unattended, settings: {missing, stale}}, one stderr line per
#       warning, and exits 1 when any part warns; 2 when checks.sh or shape-spec.md is missing or
#       settings.json is not JSON or has a byte-order mark.
#
# Environment: REDLINE_TEMPLATE overrides scripts/checks-template.sh, and REDLINE_UNATTENDED_TEMPLATE
# templates/shape-spec-unattended.md, whose history/ directory sits beside it (tests).
#
# checks.json: {"repo": "<phrase after 'Redline gate for'>", "gateFile": ".claude/commands/agent-os/shape-spec.md",
#   "selfHosted": false, "alwaysAllowed": ["openapi.json"],
#   "vars": [{"name": "migrate_db", "env": "REDLINE_MIGRATE_DB", "default": "app_redline_migrate", "doc": "..."}],
#   "formatter": {"step": 1, "name": "fix", "cmd": "composer fix", "title": "Fix"} | null,
#   "octane": {"step": 7, "cmd": "composer test:octane"} | null,
#   "baseline": {"seconds": 412, "date": "2026-10-20", "note": "..."} | null,
#   "steps": [{"step": 2, "name": "check", "recorded": 0, "cmd": "composer check", "title": "Check"},
#             {"step": 6, "name": "env", "recorded": 0, "kind": "base-diff", "source": "...$env_base..."}]}
# A step's "cmd" is the exact string bash -c runs (quoted for you); "source" is emitted verbatim
# inside double quotes for a step that must expand a shell variable. "kind": "base-diff" wraps the
# step in the template's base_ref guard. Every text field is a single line; a var's default holds
# none of " $ ` \ }, and an alwaysAllowed entry no '.
#
# Exit codes: 0; 1 when a compared file differs without --force (for config, when checker or
# checkerStallMs cannot be updated in place), a template anchor is missing, the version line or the
# section marker is missing, older or newer, or a merge has a conflict without its --pick; 2 on a bad
# invocation, a file that is not JSON, a settings file with a BOM, a bad checks.json, or a section
# whose frozen template is missing (every reason on stderr). Needs python3 and jq.

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="${REDLINE_TEMPLATE:-$PLUGIN_ROOT/scripts/checks-template.sh}"
SETTINGS_TEMPLATE="$PLUGIN_ROOT/templates/settings.allow.json"
RETIRED_TEMPLATE="$PLUGIN_ROOT/templates/settings.retired.json"
CONFIG_TEMPLATE="$PLUGIN_ROOT/templates/redline.json.example"
UNATTENDED_TEMPLATE="${REDLINE_UNATTENDED_TEMPLATE:-$PLUGIN_ROOT/templates/shape-spec-unattended.md}"
UNATTENDED_HISTORY="$(dirname "$UNATTENDED_TEMPLATE")/history"

usage() {
    echo "usage: redline-setup.sh settings <repoRoot> [--allow <entry>]... [--remove-stale] [--dry-run] | gitignore <repoRoot> [--dry-run] | command <repoRoot> <redline|redline-revise> [--force] [--dry-run] | unattended <shape-spec.md> --gate-steps <m>-<n> --prose-steps <text> --retro-step <n> (--pr-body-standard <name> | --no-pr-body) [--force] [--merge [--pick <n>=ours|theirs]... | --keep] [--dry-run] | unattended --version <shape-spec.md> | config --reviewer <handle> --baseline-seconds <n> [<repoRoot>] [--ask-rules <file>] [--force] [--dry-run] | suggest-ask-rules <repoRoot> | checks <checks.json> <checks.sh> [--dry-run] | read-checks <checks.sh> | version <checks.sh|repoRoot>" >&2
    exit 2
}
die2() { echo "redline-setup: $*" >&2; exit 2; }

# tmp_beside <target>: a temp file in the target's directory, so the final cat keeps the mode bit.
tmp_beside() { mkdir -p "$(dirname "$1")"; mktemp "$(dirname "$1")/.redline-setup.XXXXXX"; }
# commit_tmp <tmp> <target>: move the content into place and drop the temp file.
commit_tmp() { cat "$1" > "$2"; rm -f "$1"; }

# ---------------------------------------------------------------------------------------------
# settings
cmd_settings() {
    local root="" dry=false remove=false allows=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --allow) [[ $# -ge 2 && -n "$2" ]] || die2 "--allow needs an entry"; allows+=("$2"); shift 2 ;;
            --remove-stale) remove=true; shift ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$root" ]] || usage; root="$1"; shift ;;
        esac
    done
    [[ -n "$root" ]] || usage
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local file="$root/.claude/settings.json" existed=false existing='{}' crlf=false
    if [[ -f "$file" ]]; then
        existed=true
        if [[ "$(head -c 3 "$file" | od -An -tx1 | tr -d ' \n')" == "efbbbf" ]]; then
            die2 "$file starts with a byte-order mark; remove it before merging"
        fi
        existing="$(jq -c . "$file" 2>/dev/null)" || die2 "$file is not JSON"
        if grep -q $'\r$' "$file"; then
            crlf=true
        fi
    fi
    local extras='[]'
    if [[ ${#allows[@]} -gt 0 ]]; then
        extras="$(printf '%s\n' "${allows[@]}" | jq -R . | jq -s .)"
    fi
    local template retired merged
    template="$(jq -c . "$SETTINGS_TEMPLATE")"
    retired="$(jq -c . "$RETIRED_TEMPLATE")"
    # Entry-level, the file's values win: a top-level key the file lacks is appended; under a
    # top-level object both have, an entry the file lacks is appended and one it has is kept whole.
    # A retired entry (one an earlier template added) is kept too, unless --remove-stale (#50).
    merged="$(jq -n --argjson e "$existing" --argjson t "$template" --argjson x "$extras" --argjson r "$retired" --argjson rm "$remove" '
        def union($a; $b): reduce $b[] as $i ($a; if index([$i]) != null then . else . + [$i] end);
        (reduce ($t | keys_unsorted[]) as $k ($e;
            if has($k) | not then .[$k] = $t[$k]
            elif (.[$k] | type) == "object" and ($t[$k] | type) == "object" then
                reduce ($t[$k] | keys_unsorted[]) as $j (.; if (.[$k] | has($j)) then . else .[$k][$j] = $t[$k][$j] end)
            else . end)
         | .permissions.allow = union(union(($e.permissions.allow // []); ($t.permissions.allow // [])); $x)
         | if $rm then .permissions.allow -= $r else . end)')"
    local changed=false written=false
    if [[ "$(jq -S -c . <<<"$existing")" != "$(jq -S -c . <<<"$merged")" ]]; then
        changed=true
        if [[ "$dry" == false ]]; then
            local tmp; tmp="$(tmp_beside "$file")"
            if [[ "$crlf" == true ]]; then
                jq --indent 2 . <<<"$merged" | awk '{printf "%s\r\n", $0}' > "$tmp"
            else
                jq --indent 2 . <<<"$merged" > "$tmp"
            fi
            commit_tmp "$tmp" "$file"
            written=true
        fi
    fi
    jq -n --arg file "$file" --argjson existed "$existed" --argjson changed "$changed" --argjson written "$written" \
        --argjson e "$existing" --argjson m "$merged" --argjson t "$template" --argjson r "$retired" --argjson rm "$remove" '
        {file: $file, existed: $existed, changed: $changed, written: $written,
         added: [($m.permissions.allow // [])[] | select(. as $i | (($e.permissions.allow // []) | index([$i])) == null)],
         removed: (if $rm then [($e.permissions.allow // [])[] | select(. as $i | ($r | index([$i])) != null)] else [] end),
         stale: [($m.permissions.allow // [])[] | select(. as $i | ($r | index([$i])) != null)],
         keysAdded: [($m | keys_unsorted[]) | select(. as $k | ($e | has($k)) | not)],
         conflicts: [$t | keys_unsorted[] as $k | select($e | has($k))
            | if ($e[$k] | type) == "object" and ($t[$k] | type) == "object" then
                  $t[$k] | keys_unsorted[] as $j
                  | select(($e[$k] | has($j)) and [$k, $j] != ["permissions", "allow"] and $e[$k][$j] != $t[$k][$j])
                  | {path: [$k, $j], have: $e[$k][$j], want: $t[$k][$j]}
              elif $e[$k] != $t[$k] then {path: [$k], have: $e[$k], want: $t[$k]}
              else empty end]}'
}

# ---------------------------------------------------------------------------------------------
# gitignore
PY_GITIGNORE='
import sys, json
out = sys.argv[1]
data = sys.stdin.buffer.read()
bom = data.startswith(b"\xef\xbb\xbf")
if bom:
    data = data[3:]
text = data.decode("utf-8")
crlf = "\r\n" in text
nl = "\r\n" if crlf else "\n"
lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
if lines and lines[-1] == "":
    lines.pop()
LINE = ".claude/redline.local.json"
def is_line(l, name):
    s = l.strip()
    return s == name or s == "/" + name
at = None
for i, l in enumerate(lines):
    if is_line(l, LINE):
        at = i + 1
        break
res = {"line": LINE, "changed": False, "after": None, "at": at}
if at is None:
    idx = None
    after = None
    for i, l in enumerate(lines):
        if is_line(l, ".claude/settings.local.json"):
            idx, after = i, l.strip()
            break
    if idx is None:
        for i, l in enumerate(lines):
            s = l.strip()
            if s.startswith(".claude/") or s.startswith("/.claude/"):
                idx, after = i, s
    if idx is None:
        lines.append(LINE)
        at = len(lines)
    else:
        lines.insert(idx + 1, LINE)
        at = idx + 2
    res.update({"changed": True, "after": after, "at": at})
    with open(out, "wb") as f:
        f.write((b"\xef\xbb\xbf" if bom else b"") + (nl.join(lines) + nl).encode("utf-8"))
print(json.dumps(res))
'
cmd_gitignore() {
    local root="" dry=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$root" ]] || usage; root="$1"; shift ;;
        esac
    done
    [[ -n "$root" ]] || usage
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local file="$root/.gitignore" existed=false tmp res
    [[ -f "$file" ]] && existed=true
    tmp="$(tmp_beside "$file")"
    if [[ "$existed" == true ]]; then
        res="$(python3 -I -c "$PY_GITIGNORE" "$tmp" < "$file")"
    else
        res="$(python3 -I -c "$PY_GITIGNORE" "$tmp" < /dev/null)"
    fi
    local changed written=false
    changed="$(jq -r '.changed' <<<"$res")"
    if [[ "$changed" == true && "$dry" == false ]]; then
        commit_tmp "$tmp" "$file"
        written=true
    else
        rm -f "$tmp"
    fi
    jq --arg file "$file" --argjson existed "$existed" --argjson written "$written" \
        '{file: $file, existed: $existed} + . + {written: $written}' <<<"$res"
}

# ---------------------------------------------------------------------------------------------
# command (#44): the short alias files, written verbatim from templates/command-<name>.md.
cmd_command() {
    local root="" name="" force=false dry=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --force) force=true; shift ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *)
                if [[ -z "$root" ]]; then root="$1"
                elif [[ -z "$name" ]]; then name="$1"
                else usage; fi
                shift ;;
        esac
    done
    [[ -n "$root" && -n "$name" ]] || usage
    [[ "$name" == "redline" || "$name" == "redline-revise" ]] || die2 "'$name' is not an alias name; give redline or redline-revise"
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local template="$PLUGIN_ROOT/templates/command-$name.md" file="$root/.claude/commands/$name.md"
    [[ -f "$template" ]] || die2 "$template is missing"
    local existed=false status changed=false written=false diff=null
    if [[ ! -e "$file" ]]; then
        status=absent; changed=true
    elif cmp -s "$template" "$file"; then
        existed=true; status=unchanged
    elif grep -q '^<!-- redline-alias:' "$file"; then
        existed=true; status=differs; changed=true
        diff="$(diff -u "$template" "$file" || true)"
        diff="$(jq -Rs . <<<"$diff")"
    else
        existed=true; status=foreign
    fi
    if [[ "$changed" == true && "$dry" == false && ( "$status" == absent || "$force" == true ) ]]; then
        local tmp
        tmp="$(tmp_beside "$file")"
        cat "$template" > "$tmp"
        commit_tmp "$tmp" "$file"
        written=true
    fi
    jq -n --arg file "$file" --arg name "$name" --arg template "$template" --argjson existed "$existed" \
        --arg status "$status" --argjson changed "$changed" --argjson written "$written" --argjson diff "$diff" \
        '{file: $file, name: $name, template: $template, existed: $existed, status: $status, changed: $changed, written: $written, diff: $diff}'
    if [[ "$status" == differs && "$written" == false ]]; then
        echo "redline-setup: $file differs from $template; show the diff and rerun with --force to rewrite it" >&2
        exit 1
    fi
}

# ---------------------------------------------------------------------------------------------
# unattended
PY_UNATTENDED='
import sys, re, json, os, difflib
mode, tpl_path, hist_dir, gate, prose, retro, prbody, force, merge, keep, picks, out = sys.argv[1:13]
force, merge, keep = force == "1", merge == "1", keep == "1"
picks = dict(p.split("=", 1) for p in picks.split(",") if p)
data = sys.stdin.buffer.read()
bom = data.startswith(b"\xef\xbb\xbf")
if bom:
    data = data[3:]
text = data.decode("utf-8")
crlf = "\r\n" in text
nl = "\r\n" if crlf else "\n"
lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")

FENCE = re.compile(r"^([ \t]*)(`{3,}|~{3,})(.*)$")
HEAD = re.compile(r"^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$")
UNHEAD = re.compile(r"^(#{2,6})[ \t]+Unattended mode \(Redline\)[ \t]*$")
MARK = re.compile(r"^<!-- redline-unattended: (v\d+) -->[ \t]*$")
def fenced(ls):
    enc = [False] * len(ls)
    opener = None
    for i, line in enumerate(ls):
        m = FENCE.match(line)
        if opener is None:
            if m and not (m.group(2)[0] == "`" and "`" in m.group(3)):
                opener = (m.group(2)[0], len(m.group(2)))
                enc[i] = True
            continue
        enc[i] = True
        if m and m.group(2)[0] == opener[0] and len(m.group(2)) >= opener[1] and m.group(3).strip() == "":
            opener = None
    return enc

def section_end(ls, enc, i, level):
    j = i + 1
    while j < len(ls):
        if not enc[j]:
            h = HEAD.match(ls[j])
            if h and len(h.group(1)) <= level:
                return j
        j += 1
    return len(ls)

def prose_phrase(p):
    return "Step %s stays as written" % p if re.fullmatch(r"\d+", p) else "Steps %s stay as written" % p

GENERIC = "the repository\x27s standard for agent-written PR descriptions"
want = {"gateSteps": gate, "proseSteps": prose, "retroStep": int(retro) if retro else None, "prBody": prbody if prbody else False}

def read_fillins(sec):
    found = {"gateSteps": None, "proseSteps": None, "retroStep": None, "prBody": False}
    for l in sec:
        m = re.search(r"\(gate steps (\d+) to (\d+)", l)
        if m and found["gateSteps"] is None:
            found["gateSteps"] = "%s-%s" % (m.group(1), m.group(2))
        m = re.search(r"Gate step (\d+)\x27s edits", l)
        if m and found["retroStep"] is None:
            found["retroStep"] = int(m.group(1))
        m = re.search(r"\bSteps? (.+?) stays? as written", l)
        if m and found["proseSteps"] is None:
            found["proseSteps"] = m.group(1)
        if re.match(r"^11\. \*\*The PR description\.\*\*", l):
            m = re.search(r"\(per `([^`]+)`\)", l)
            found["prBody"] = m.group(1) if m else GENERIC
    return found

# apply(sec, found, fill): the section with fill-ins `fill` written in (a field fill lacks falls back to
# the wanted one); `found` is what the section carried, so a wanted point 11 missing from it is inserted.
def apply(sec, found, fill):
    f = dict(want)
    for k, v in (fill or {}).items():
        if v is not None:
            f[k] = v
    new = []
    for l in sec:
        l = re.sub(r"\(gate steps \d+ to \d+", "(gate steps %s to %s" % tuple(f["gateSteps"].split("-")), l)
        l = re.sub(r"Gate step \d+\x27s edits", "Gate step %s\x27s edits" % f["retroStep"], l)
        l = re.sub(r"\bSteps? .+? stays? as written", prose_phrase(f["proseSteps"]), l)
        if re.match(r"^11\. \*\*The PR description\.\*\*", l):
            if not f["prBody"]:
                continue
            l = re.sub(r"\(per (`[^`]+`|" + re.escape(GENERIC) + r")\)", "(per `%s`)" % f["prBody"], l)
        new.append(l)
    if f["prBody"] and found is not None and found["prBody"] is False:
        tpl11 = [t for t in tpl_section if re.match(r"^11\. \*\*The PR description\.\*\*", t)]
        if tpl11:
            line11 = re.sub(r"\(per " + re.escape(GENERIC) + r"\)", "(per `%s`)" % f["prBody"], tpl11[0])
            for k, l in enumerate(new):
                if l.startswith("Everything not named above"):
                    while k > 0 and new[k - 1] == "":
                        k -= 1
                    new.insert(k, line11)
                    break
    return new

# body_of(path): a template file section, everything below its --- line, trimmed.
def body_of(path):
    with open(path, encoding="utf-8") as f:
        t = f.read().split("\n")
    try:
        cut = t.index("---")
    except ValueError:
        print("redline-setup: %s has no --- line before its section" % path, file=sys.stderr)
        sys.exit(2)
    sec = t[cut + 1:]
    while sec and sec[0].strip() == "":
        sec.pop(0)
    while sec and sec[-1].strip() == "":
        sec.pop()
    return sec

def marker_of(sec):
    for l in sec:
        m = MARK.match(l)
        if m:
            return m.group(1)
    return None

def strip_marker(sec):
    return [l for l in sec if not MARK.match(l)]

def vnum(v):
    m = re.fullmatch(r"v(\d+)", v or "")
    return int(m.group(1)) if m else None

# load_history(): every frozen body under history/, by version; a missing directory is no history.
def load_history():
    hist = {}
    if os.path.isdir(hist_dir):
        for name in sorted(os.listdir(hist_dir)):
            m = re.fullmatch(r"shape-spec-unattended\.(v\d+)\.md", name)
            if m:
                hist[m.group(1)] = body_of(os.path.join(hist_dir, name))
    return hist

def ndiff(a, b):
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    return sum((i2 - i1) + (j2 - j1) for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != "equal")

# merge3(base, ours, theirs): a diff3 over matching blocks. A hunk changed on one side is taken from that
# side; changed the same way on both, once; changed differently, a conflict, left as ("conflict", n):
# in a hunk of one length on every side, each line changed differently on both is a conflict alone,
# so a pick settles that line and never the lines beside it (#64, R1-1); any other hunk is one conflict.
def merge3(base, ours, theirs):
    def anchors(a, b):
        m = {}
        for i, j, n in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(n):
                m[i + k] = j + k
        return m
    bo, bt = anchors(base, ours), anchors(base, theirs)
    out, conflicts = [], []
    b = o = t = 0
    while b < len(base) or o < len(ours) or t < len(theirs):
        if b < len(base) and bo.get(b) == o and bt.get(b) == t:
            out.append(base[b])
            b += 1; o += 1; t += 1
            continue
        nb = b
        while nb < len(base) and not (nb in bo and nb in bt):
            nb += 1
        no = bo[nb] if nb < len(base) else len(ours)
        nt = bt[nb] if nb < len(base) else len(theirs)
        cb, co, ct = base[b:nb], ours[o:no], theirs[t:nt]
        if co == cb or co == ct:
            out.extend(ct)
        elif ct == cb:
            out.extend(co)
        elif len(cb) == len(co) == len(ct):
            # A same-length hunk merges line by line: adjacent lines changed on different sides both come
            # through, and only a line changed differently on both sides is a conflict, that line alone.
            for x, y, z in zip(cb, co, ct):
                if y == x or y == z:
                    out.append(z)
                elif z == x:
                    out.append(y)
                else:
                    conflicts.append({"n": len(conflicts) + 1, "base": [x], "ours": [y], "theirs": [z]})
                    out.append(("conflict", len(conflicts)))
        else:
            conflicts.append({"n": len(conflicts) + 1, "base": cb, "ours": co, "theirs": ct})
            out.append(("conflict", len(conflicts)))
        b, o, t = nb, no, nt
    return out, conflicts

def udiff(a, b, na, nb):
    return "\n".join(difflib.unified_diff(a, b, na, nb, lineterm=""))

tpl_section = body_of(tpl_path)
tv = marker_of(tpl_section)

enc = fenced(lines)
start = None
for i, l in enumerate(lines):
    if not enc[i] and UNHEAD.match(l):
        start = i
        level = len(UNHEAD.match(l).group(1))
        break

def emit(obj, code=0):
    print(json.dumps(obj))
    sys.exit(code)

if mode == "version":
    if start is None:
        emit({"present": False, "file": None})
    emit({"present": True, "file": marker_of(lines[start:section_end(lines, enc, start, level)])})

def write(new_lines):
    with open(out, "wb") as f:
        f.write((b"\xef\xbb\xbf" if bom else b"") + nl.join(new_lines).encode("utf-8"))

# with_marker(sec): the section with the template marker as its first line inside it.
def with_marker(sec):
    sec = strip_marker(sec)
    return sec[:1] + ["<!-- redline-unattended: %s -->" % tv] + sec[1:]

if start is not None:
    end = section_end(lines, enc, start, level)
    sec = lines[start:end]
    tail = []
    while sec and sec[-1].strip() == "":
        tail.insert(0, sec.pop())
    found = read_fillins(sec)
    differs = {k: {"have": found[k], "want": want[k]} for k in want if found[k] != want[k]}
    fv = marker_of(sec)
    newer = vnum(fv) is not None and vnum(tv) is not None and vnum(fv) > vnum(tv)
    version = {"template": tv, "file": fv, "match": fv == tv, "newer": newer}
    base = {"present": True, "fillins": want, "found": found, "differs": differs, "insertedAt": None, "version": version,
            "base": None, "guessed": False, "templateDiff": None, "handEdits": None, "merged": None, "conflicts": []}
    def finish(section):
        write(lines[:start] + section + tail + lines[end:])
        emit(dict(base, changed=True))
    def refuse_fillins():
        print("redline-setup: the unattended section already exists with different fill-ins (%s); pass --force to patch them" % ", ".join("%s: %s -> %s" % (k, v["have"], v["want"]) for k, v in differs.items()), file=sys.stderr)
        emit(dict(base, changed=False), 1)
    if version["match"]:
        if not differs:
            emit(dict(base, changed=False))
        if not force and not merge:
            refuse_fillins()
        finish(apply(sec, found, want))
    if newer:
        print("redline-setup: the unattended section was made from template %s, newer than the %s this plugin ships; update the plugin" % (fv, tv), file=sys.stderr)
        emit(dict(base, changed=False), 1)
    # An older or unmarked section: the three-way view, then --merge or --keep.
    hist = load_history()
    cands = dict(hist)
    cands[tv] = tpl_section
    if fv is None:
        scores = {v: ndiff(strip_marker(apply(body, None, found)), strip_marker(sec)) for v, body in cands.items()}
        bv = min(sorted(scores, key=vnum, reverse=True), key=lambda v: scores[v])
        guessed = True
    else:
        if fv not in hist:
            print("redline-setup: the unattended section was made from template %s, and %s has no shape-spec-unattended.%s.md to merge from" % (fv, hist_dir, fv), file=sys.stderr)
            sys.exit(2)
        bv, guessed = fv, False
    ours = strip_marker(apply(sec, found, want))
    base_lines = strip_marker(apply(cands[bv], None, want))
    theirs = strip_marker(apply(tpl_section, None, want))
    merged, conflicts = merge3(base_lines, ours, theirs)
    def rendered(sel=None):
        outl = []
        for l in merged:
            if isinstance(l, tuple):
                c = conflicts[l[1] - 1]
                side = (sel or {}).get(str(c["n"]))
                if side == "ours":
                    outl.extend(c["ours"])
                elif side == "theirs":
                    outl.extend(c["theirs"])
                else:
                    outl += ["<<<<<<< shape-spec.md"] + c["ours"] + ["======="] + c["theirs"] + [">>>>>>> template %s" % tv]
            else:
                outl.append(l)
        return outl
    base = dict(base, base=bv, guessed=guessed,
                templateDiff=udiff(base_lines, theirs, "template %s" % bv, "template %s" % tv),
                handEdits=udiff(base_lines, ours, "template %s" % bv, "shape-spec.md"),
                merged="\n".join(with_marker(rendered())), conflicts=conflicts)
    for n in picks:
        if n not in {str(c["n"]) for c in conflicts}:
            print("redline-setup: --pick %s names no conflict; the merge has %d" % (n, len(conflicts)), file=sys.stderr)
            sys.exit(2)
    if keep:
        if differs and not force:
            refuse_fillins()
        finish(with_marker(apply(sec, found, want)))
    if merge:
        unpicked = [str(c["n"]) for c in conflicts if str(c["n"]) not in picks]
        if unpicked:
            print("redline-setup: the merge has %d conflicting hunk(s); pass --pick <n>=ours|theirs for %s" % (len(conflicts), ", ".join(unpicked)), file=sys.stderr)
            emit(dict(base, changed=False), 1)
        finish(with_marker(rendered(picks)))
    print("redline-setup: the unattended section was made from template %s%s; the plugin ships %s: --merge takes the template\x27s changes (%d conflicting hunk(s) need --pick), --keep marks it %s as it stands" % (bv, " (guessed)" if guessed else "", tv, len(conflicts), tv), file=sys.stderr)
    emit(dict(base, changed=False), 1)

pre = None
for i, l in enumerate(lines):
    h = HEAD.match(l)
    if not enc[i] and h and h.group(2).strip().lower() == "prerequisites":
        pre, plevel = i, len(h.group(1))
        break
if pre is None:
    print("redline-setup: no Prerequisites heading in the file", file=sys.stderr)
    sys.exit(2)
idx = section_end(lines, enc, pre, plevel)
if idx >= len(lines):
    print("redline-setup: no heading follows Prerequisites to insert the section before", file=sys.stderr)
    sys.exit(2)
section = apply(tpl_section, None, want)
new = lines[:idx] + section + [""] + lines[idx:]
write(new)
emit({"present": False, "changed": True, "fillins": want, "found": None, "differs": {}, "insertedAt": idx + 1,
      "version": {"template": tv, "file": tv, "match": True, "newer": False},
      "base": None, "guessed": False, "templateDiff": None, "handEdits": None, "merged": None, "conflicts": []})
'
cmd_unattended() {
    local file="" gate="" prose="" retro="" prbody="" nopr=false force=0 dry=false vfile="" merge=0 keep=0 picks=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --version) [[ $# -ge 2 ]] || die2 "--version needs a file"; vfile="$2"; shift 2 ;;
            --gate-steps) [[ $# -ge 2 ]] || die2 "--gate-steps needs <m>-<n>"; gate="$2"; shift 2 ;;
            --prose-steps) [[ $# -ge 2 ]] || die2 "--prose-steps needs a value"; prose="$2"; shift 2 ;;
            --retro-step) [[ $# -ge 2 ]] || die2 "--retro-step needs a number"; retro="$2"; shift 2 ;;
            --pr-body-standard) [[ $# -ge 2 && -n "$2" ]] || die2 "--pr-body-standard needs a name"; prbody="$2"; shift 2 ;;
            --no-pr-body) nopr=true; shift ;;
            --force) force=1; shift ;;
            --merge) merge=1; shift ;;
            --keep) keep=1; shift ;;
            --pick) [[ $# -ge 2 && "$2" =~ ^[0-9]+=(ours|theirs)$ ]] || die2 "--pick needs <n>=ours|theirs; got '${2:-}'"; picks="${picks:+$picks,}$2"; shift 2 ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$file" ]] || usage; file="$1"; shift ;;
        esac
    done
    if [[ -n "$vfile" ]]; then
        # --version takes no other argument: the read-only form, shared with version <repoRoot>.
        [[ -z "$file$gate$prose$retro$prbody$picks" && "$nopr" == false && $force -eq 0 && $merge -eq 0 && $keep -eq 0 && "$dry" == false ]] || usage
        version_unattended "$vfile"
        return
    fi
    [[ -n "$file" ]] || usage
    [[ -f "$file" && -r "$file" ]] || die2 "$file is not a readable file"
    [[ "$gate" =~ ^([0-9]+)-([0-9]+)$ ]] || die2 "--gate-steps must be <m>-<n>; got '$gate'"
    (( BASH_REMATCH[1] >= 1 && BASH_REMATCH[1] <= BASH_REMATCH[2] )) || die2 "--gate-steps $gate is not an ascending range"
    [[ -n "$prose" ]] || die2 "--prose-steps is required (the gate's prose steps, such as '8 and 9')"
    [[ "$retro" =~ ^[0-9]+$ ]] || die2 "--retro-step must be a step number; got '$retro'"
    if [[ "$nopr" == true && -n "$prbody" ]] || [[ "$nopr" == false && -z "$prbody" ]]; then
        die2 "give exactly one of --pr-body-standard <name> and --no-pr-body"
    fi
    [[ -f "$UNATTENDED_TEMPLATE" ]] || die2 "$UNATTENDED_TEMPLATE is missing"
    [[ $merge -eq 1 && $keep -eq 1 ]] && die2 "--merge and --keep exclude each other"
    [[ -n "$picks" && $merge -eq 0 ]] && die2 "--pick needs --merge"
    local abs tmp res rc=0
    abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
    tmp="$(tmp_beside "$abs")"
    res="$(python3 -I -c "$PY_UNATTENDED" write "$UNATTENDED_TEMPLATE" "$UNATTENDED_HISTORY" "$gate" "$prose" "$retro" "$prbody" "$force" "$merge" "$keep" "$picks" "$tmp" < "$abs")" || rc=$?
    if [[ $rc -ne 0 ]]; then
        rm -f "$tmp"
        [[ -n "$res" ]] && jq --arg file "$abs" '{file: $file} + . + {written: false}' <<<"$res"
        exit $rc
    fi
    local written=false
    if [[ "$(jq -r .changed <<<"$res")" == true && "$dry" == false ]]; then
        commit_tmp "$tmp" "$abs"
        written=true
    else
        rm -f "$tmp"
    fi
    jq --arg file "$abs" --argjson written "$written" '{file: $file} + . + {written: $written}' <<<"$res"
}

# ---------------------------------------------------------------------------------------------
# config
# ask_rules_fault <list json>: the first reason the list is malformed, or nothing. The wording is
# the guard's (rule_fault in redline-guard.sh) and the workflow's, so a person reads one message.
# It tests what they test: a key's presence, never a non-null value, and the id of an object only
# (#52, R1-2), matched against the whole string with \A and \z, since jq's $ also matches before a
# final newline, which the guard's fullmatch and the workflow's /^...$/ refuse (#52, R2-1).
ask_rules_fault() {
    local prog
    prog="$(cat <<'JQ'
def clean: gsub("^\\s+|\\s+$"; "");
if type != "array" then "askRules is not a list" else
([range(0; length) as $i | .[$i] as $r
    | if ($r | type) != "object" then "askRules[\($i + 1)]: not an object"
      elif ($r.id | type) != "string" or ($r.id | test("\\A[a-z][a-z0-9-]*\\z") | not) then "askRules[\($i + 1)]: id must match [a-z][a-z0-9-]*"
      elif ([.[:$i][] | objects | .id] | index($r.id)) != null then "askRules[\($i + 1)]: id '\($r.id)' is not unique"
      elif ($r.when | type) != "object" or (($r.when | keys) != ["paths"] and ($r.when | keys) != ["prose"]) then "askRules[\($i + 1)]: rule '\($r.id)': when must hold exactly one of paths or prose"
      elif ($r.when | has("paths")) and (($r.when.paths | type) != "array" or ($r.when.paths | length) == 0 or ($r.when.paths | any(type != "string" or clean == ""))) then "askRules[\($i + 1)]: rule '\($r.id)': paths must be a non-empty list of non-empty strings"
      elif ($r.when | has("paths")) and ($r.when.paths | any(test("[!\\[]"))) then "askRules[\($i + 1)]: rule '\($r.id)': a path pattern may not hold ! or ["
      elif ($r.when | has("prose")) and (($r.when.prose | type) != "string" or ($r.when.prose | clean) == "") then "askRules[\($i + 1)]: rule '\($r.id)': prose must be a non-empty string"
      elif ($r.reason | type) != "string" or ($r.reason | clean) == "" or ($r.reason | clean | test("\n")) then "askRules[\($i + 1)]: rule '\($r.id)': reason must be one non-empty line"
      else empty end] | first // empty)
end
JQ
)"
    jq -r "$prog" <<<"$1"
}

cmd_config() {
    local reviewer="" seconds="" root="" force=false dry=false rules_file="" rules=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --reviewer) [[ $# -ge 2 ]] || die2 "--reviewer needs a handle"; reviewer="$2"; shift 2 ;;
            --baseline-seconds) [[ $# -ge 2 ]] || die2 "--baseline-seconds needs a number"; seconds="$2"; shift 2 ;;
            --ask-rules) [[ $# -ge 2 ]] || die2 "--ask-rules needs a file"; rules_file="$2"; shift 2 ;;
            --force) force=true; shift ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$root" ]] || usage; root="$1"; shift ;;
        esac
    done
    reviewer="${reviewer#@}"
    [[ "$reviewer" =~ ^[A-Za-z0-9-]+$ ]] || die2 "--reviewer must be a GitHub login; got '$reviewer'"
    [[ "$seconds" =~ ^[0-9]+$ ]] || die2 "--baseline-seconds must be a non-negative integer; got '$seconds'"
    local checker=full stall
    (( seconds > 300 )) && checker=git-only
    stall=$(( seconds * 1700 ))
    stall=$(( (stall + 299999) / 300000 * 300000 ))
    (( stall < 300000 )) && stall=300000
    local content
    content="$(sed -e "s/\"reviewer\": \"[^\"]*\"/\"reviewer\": \"$reviewer\"/" \
                   -e "s/\"checker\": \"[^\"]*\"/\"checker\": \"$checker\"/" \
                   -e "s/\"checkerStallMs\": [0-9]*/\"checkerStallMs\": $stall/" "$CONFIG_TEMPLATE")"
    jq -e . <<<"$content" >/dev/null 2>&1 || die2 "$CONFIG_TEMPLATE did not substitute into valid JSON"
    if [[ -n "$rules_file" ]]; then
        [[ -f "$rules_file" ]] || die2 "--ask-rules: $rules_file is not a file"
        rules="$(jq -c . "$rules_file" 2>/dev/null)" || die2 "--ask-rules: $rules_file is not JSON"
        local fault; fault="$(ask_rules_fault "$rules")"
        [[ -z "$fault" ]] || die2 "--ask-rules: $fault"
        # The list rides in the template's output; jq re-indents the whole file (#49).
        content="$(jq --indent 2 --argjson r "$rules" '. + {askRules: $r}' <<<"$content")"
    fi
    local config; config="$(jq -c . <<<"$content")"
    if [[ -z "$root" ]]; then
        jq -n --argjson config "$config" '{config: $config, file: null, existed: false, changed: false, written: false, updated: {}, differs: {}, askRules: ($config.askRules // null)}'
        return 0
    fi
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local file="$root/.claude/redline.json" existed=false have='null' differs='{}' updated='{}' changed=true written=false tmp="" ask_rules='null'
    [[ -z "$rules" ]] || ask_rules="$rules"
    if [[ -f "$file" ]]; then
        existed=true
        have="$(jq -c . "$file" 2>/dev/null)" || die2 "$file is not JSON"
        differs="$(config_differs "$have" "$config")"
        if [[ "$force" == true ]]; then
            if [[ "$(jq -S -c . <<<"$have")" == "$(jq -S -c . <<<"$config")" ]]; then
                changed=false
            fi
        else
            ask_rules="$(jq -c '.askRules // null' <<<"$have")"
            # A rerun updates only the two values derived from the baseline, in place, so the file's
            # formatting and every other value, reviewer included, stay the person's (#12, R1-5).
            tmp="$(tmp_beside "$file")"
            sed -e "s/\"checker\": \"[^\"]*\"/\"checker\": \"$checker\"/" \
                -e "s/\"checkerStallMs\": [0-9]*/\"checkerStallMs\": $stall/" "$file" > "$tmp"
            if ! jq -e --argjson h "$have" --arg c "$checker" --argjson s "$stall" \
                    '. == ($h | .checker = $c | .checkerStallMs = $s)' "$tmp" >/dev/null 2>&1; then
                rm -f "$tmp"
                jq -n --argjson config "$config" --arg file "$file" --argjson differs "$differs" \
                    '{config: $config, file: $file, existed: true, changed: false, written: false, updated: {}, differs: $differs}'
                echo "redline-setup: $file: checker or checkerStallMs cannot be updated in place; pass --force to rewrite it from the template" >&2
                exit 1
            fi
            updated="$(jq -n --argjson h "$have" --arg c "$checker" --argjson s "$stall" '
                [{key: "checker", want: $c}, {key: "checkerStallMs", want: $s}]
                | map(select($h[.key] != .want) | {key: .key, value: {have: $h[.key], want: .want}}) | from_entries')"
            differs="$(config_differs "$(jq -c . "$tmp")" "$config")"
            # A given list that differs from the file's replaces it; the file is rewritten by jq
            # for that, since a list cannot be patched in place (#49).
            if [[ -n "$rules" && "$(jq -S -c . <<<"$ask_rules")" != "$(jq -S -c . <<<"$rules")" ]]; then
                local tmp2; tmp2="$(tmp_beside "$file")"
                jq --indent 2 --argjson r "$rules" '.askRules = $r' "$tmp" > "$tmp2"
                rm -f "$tmp"; tmp="$tmp2"
                updated="$(jq -c --argjson h "$ask_rules" --argjson r "$rules" '. + {askRules: {have: $h, want: $r}}' <<<"$updated")"
                ask_rules="$rules"
            fi
            if [[ "$(jq -c . <<<"$updated")" == '{}' ]]; then
                changed=false
            fi
        fi
    fi
    if [[ "$changed" == true && "$dry" == false ]]; then
        if [[ -z "$tmp" ]]; then
            tmp="$(tmp_beside "$file")"
            printf '%s\n' "$content" > "$tmp"
        fi
        commit_tmp "$tmp" "$file"
        written=true
    elif [[ -n "$tmp" ]]; then
        rm -f "$tmp"
    fi
    jq -n --argjson config "$config" --arg file "$file" --argjson existed "$existed" --argjson changed "$changed" \
        --argjson written "$written" --argjson updated "$updated" --argjson differs "$differs" --argjson rules "$ask_rules" \
        '{config: $config, file: $file, existed: $existed, changed: $changed, written: $written, updated: $updated, differs: $differs, askRules: $rules}'
}
# config_differs <have> <want>: {<key>: {have, want}} for each top-level key whose values differ.
# askRules is the person's list, never the template's, so it is never drift (#49).
config_differs() {
    jq -n --argjson h "$1" --argjson w "$2" '
        [($h | keys) + ($w | keys) | unique[] | select(. != "askRules")] | map(select(($h[.] | tojson) != ($w[.] | tojson)) | {key: ., value: {have: $h[.], want: $w[.]}}) | from_entries'
}

# suggest-ask-rules <repoRoot>: the ask rules the stack suggests, read off composer.json (#49).
cmd_suggest_ask_rules() {
    [[ $# -eq 1 ]] || usage
    local root="$1"
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local composer="$root/composer.json" deps='[]'
    if [[ -f "$composer" ]]; then
        deps="$(jq -c '[(.require // {}), (."require-dev" // {}) | keys[]]' "$composer" 2>/dev/null)" || die2 "$composer is not JSON"
    fi
    jq -n --argjson deps "$deps" '
        {suggestions: [
            (if ($deps | index("craftcms/cms")) != null
             then {id: "craft-project-config", when: {paths: ["config/project/**"]}, reason: "Craft project config is applied through the control panel", because: "composer.json requires craftcms/cms"}
             else empty end),
            (if ($deps | index("laravel/framework")) != null
             then {id: "migrations", when: {paths: ["database/migrations/*"]}, reason: "A migration changes the schema; the person reviews it before it runs", because: "composer.json requires laravel/framework"}
             else empty end)
        ]}'
}

# ---------------------------------------------------------------------------------------------
# checks: the generator
PY_CHECKS='
import sys, re, json, textwrap
tpl_path, stamp_line, out, version_line = sys.argv[1:5]
try:
    spec = json.load(sys.stdin)
except Exception as e:
    print("redline-setup: checks.json is not JSON: %s" % e, file=sys.stderr)
    sys.exit(2)
errors = []
def need(cond, msg):
    if not cond:
        errors.append(msg)
# line: a text field that lands in a comment or inside quotes is one line (empty allowed).
def line(v):
    return isinstance(v, str) and "\n" not in v and "\r" not in v
need(isinstance(spec, dict), "the top level must be an object")
if not isinstance(spec, dict):
    spec = {}
repo = spec.get("repo")
gate_file = spec.get("gateFile")
need(isinstance(repo, str) and repo.strip() != "", "repo (the phrase after \x27Redline gate for\x27) is required")
need(isinstance(gate_file, str) and gate_file.strip() != "", "gateFile is required")
need(not isinstance(gate_file, str) or line(gate_file), "gateFile must be a single line")
self_hosted = spec.get("selfHosted", False)
need(isinstance(self_hosted, bool), "selfHosted must be true or false")
allowed = spec.get("alwaysAllowed", [])
need(isinstance(allowed, list) and all(isinstance(a, str) and a for a in allowed), "alwaysAllowed must be a list of paths")
for a in (allowed if isinstance(allowed, list) else []):
    if isinstance(a, str):
        need(line(a), "alwaysAllowed entry %r must be a single line" % a)
        need("\x27" not in a, "alwaysAllowed entry %r must not hold a single quote" % a)
IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
NAME = re.compile(r"^[a-z][a-z0-9-]*$")
vars_ = spec.get("vars", [])
need(isinstance(vars_, list), "vars must be a list")
for v in (vars_ if isinstance(vars_, list) else []):
    if not (isinstance(v, dict) and IDENT.match(str(v.get("name", ""))) and IDENT.match(str(v.get("env", ""))) and isinstance(v.get("default", None), str) and isinstance(v.get("doc", ""), str)):
        errors.append("each var needs name, env, default and doc")
        continue
    need(line(v.get("doc", "")), "var %s: doc must be a single line" % v["name"])
    need(line(v["default"]), "var %s: default must be a single line" % v["name"])
    held = [c for c in "\"$`\\}" if c in v["default"]]
    need(not held, "var %s: default must not hold %s (it is written inside \"${%s:-...}\")" % (v["name"], " ".join(held), v["env"]))
baseline = spec.get("baseline")
if baseline is not None:
    ok = isinstance(baseline, dict) and isinstance(baseline.get("seconds"), int) and not isinstance(baseline.get("seconds"), bool) and baseline.get("seconds") >= 0 and isinstance(baseline.get("date"), str) and re.fullmatch(r"\d{4}-\d\d-\d\d", baseline.get("date") or "")
    need(ok, "baseline needs seconds (a non-negative integer) and date (YYYY-MM-DD), or is null")
    if isinstance(baseline, dict):
        note = baseline.get("note")
        need(note is None or isinstance(note, str), "baseline.note must be a string")
        need(not isinstance(note, str) or line(note), "baseline.note must be a single line")
items = []
def one_text(d, key):
    v = d.get(key)
    return isinstance(v, str) and v != "" and "\n" not in v and "\r" not in v
def recorded_of(v):
    if v is True or v == 1:
        return 1
    if v is False or v == 0 or v is None:
        return 0
    return None
steps = spec.get("steps")
need(isinstance(steps, list) and len(steps) > 0, "steps must be a non-empty list")
for s in (steps if isinstance(steps, list) else []):
    if not isinstance(s, dict):
        errors.append("each step must be an object")
        continue
    name = str(s.get("name", ""))
    need(NAME.match(name) is not None, "step name %r must match [a-z][a-z0-9-]*" % name)
    need(isinstance(s.get("step"), int) and not isinstance(s.get("step"), bool) and s.get("step") >= 1, "step %s needs a gate step number" % name)
    rec = recorded_of(s.get("recorded", 0))
    need(rec is not None, "step %s: recorded must be 0 or 1" % name)
    has_cmd, has_src = one_text(s, "cmd"), one_text(s, "source")
    need(has_cmd != has_src, "step %s needs exactly one of cmd and source, a single line" % name)
    kind = s.get("kind", "command")
    need(kind in ("command", "base-diff"), "step %s: kind must be command or base-diff" % name)
    if kind == "base-diff":
        need(has_src, "step %s: a base-diff step needs source" % name)
    need(s.get("title") is None or isinstance(s.get("title"), str), "step %s: title must be a string" % name)
    need(not isinstance(s.get("title"), str) or line(s.get("title")), "step %s: title must be a single line" % name)
    items.append({"kind": kind, "step": s.get("step"), "name": name, "recorded": rec, "cmd": s.get("cmd") if has_cmd else None, "source": s.get("source") if has_src else None, "title": s.get("title") or name})
fmt = spec.get("formatter")
if fmt is not None:
    ok = isinstance(fmt, dict) and isinstance(fmt.get("step"), int) and NAME.match(str(fmt.get("name", ""))) and one_text(fmt, "cmd")
    need(ok, "formatter needs step, name and cmd, or is null")
    if isinstance(fmt, dict):
        need(fmt.get("title") is None or line(fmt.get("title")), "formatter: title must be a string on a single line")
    if ok:
        items.append({"kind": "formatter", "step": fmt["step"], "name": fmt["name"], "recorded": 1, "cmd": fmt["cmd"], "source": None, "title": fmt.get("title") or fmt["name"]})
octane = spec.get("octane")
if octane is not None:
    ok = isinstance(octane, dict) and isinstance(octane.get("step"), int) and one_text(octane, "cmd")
    need(ok, "octane needs step and cmd, or is null")
    if ok:
        items.append({"kind": "octane", "step": octane["step"], "name": "octane", "recorded": 0, "cmd": octane["cmd"], "source": None, "title": "Octane"})
names = [i["name"] for i in items]
for n in sorted(set(names)):
    if names.count(n) > 1:
        errors.append("check name %s is used more than once" % n)
nums = [i["step"] for i in items]
for n in sorted(set(nums)):
    if nums.count(n) > 1:
        errors.append("gate step %s is used by more than one check" % n)
if errors:
    for e in errors:
        print("redline-setup: " + e, file=sys.stderr)
    sys.exit(2)
items.sort(key=lambda i: i["step"])

with open(tpl_path, encoding="utf-8") as f:
    tpl = f.read().split("\n")
def anchor(pred, desc, start=0):
    for k in range(start, len(tpl)):
        if pred(tpl[k]):
            return k
    print("redline-setup: template anchor missing: %s" % desc, file=sys.stderr)
    sys.exit(1)
i_set = anchor(lambda l: l == "set -euo pipefail", "set -euo pipefail")
i_aa = anchor(lambda l: l.startswith("ALWAYS_ALLOWED=("), "ALWAYS_ALLOWED=(", i_set)
i_aa_c = i_aa
while i_aa_c > 0 and tpl[i_aa_c - 1].startswith("#"):
    i_aa_c -= 1
i_trap = anchor(lambda l: l.startswith("trap \x27rm -rf \"$work\"\x27 EXIT"), "trap rm -rf $work EXIT", i_aa)
i_todo_c = anchor(lambda l: l.startswith("# A check that stands for a gate step not filled in yet"), "the todo() comment", i_trap)
i_todo = anchor(lambda l: l.startswith("todo() {"), "todo() {", i_todo_c)
i_todo_end = anchor(lambda l: l == "}", "the end of todo()", i_todo)
if i_todo_end + 1 < len(tpl) and tpl[i_todo_end + 1] == "":
    i_todo_end += 1
i_if = anchor(lambda l: l == "if [[ \"$mode\" != \"git-only\" ]]; then", "if [[ \"$mode\" != \"git-only\" ]]; then", i_todo_end)
i_fi = anchor(lambda l: l == "fi", "the fi closing the check block", i_if)

pfx = "" if self_hosted else "<plugin>/"
readme = "README.md" if self_hosted else "the Redline plugin\x27s README"
def dq(s):
    return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("$", "\\$").replace("`", "\\`")
# unq: the inverse of dq, for the header only: a source step is shown as bash -c receives it (#18).
def unq(s):
    out, k = [], 0
    while k < len(s):
        if s[k] == "\\" and k + 1 < len(s) and s[k + 1] in "\\\"$`":
            out.append(s[k + 1])
            k += 2
        else:
            out.append(s[k])
            k += 1
    return "".join(out)
def wrap(t):
    return textwrap.fill(t, width=100, initial_indent="# ", subsequent_indent="# ", break_long_words=False, break_on_hyphens=False).split("\n")
WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
m, n = min(nums), max(nums)
H = ["#!/usr/bin/env bash", "#"]
H += wrap("Redline gate for %s. Runs the runnable part of the Verification Gate (%s, steps %d to %d) plus the git-state checks, and emits exactly one JSON object on stdout. Progress goes to stderr. Nothing in it is new policy; the gate text stays the source." % (repo, gate_file, m, n))
H += ["#", "# Usage:",
      "#   checks.sh <snapshot.json>              full run: commands + git block",
      "#   checks.sh --baseline [snapshot.json]   commands only, git block is null",
      "#   checks.sh --git-only <snapshot.json>   git block only, checks is []",
      "#", "# Environment:",
      "#   REDLINE_OCTANE=1   set by the workflow when the approved plan touches app/Providers/,"]
oct_text = "Runs `%s` here (gate step %d)." % (octane["cmd"], octane["step"]) if octane else "Ignored here: no long-lived-process suite."
H += ["#                      bootstrap/ or config/octane.php. " + oct_text]
for v in vars_:
    H.append("#   %s=<name>   %s (default %s)" % (v["env"], v.get("doc", "").strip() or "set by the repository", v["default"]))
count = len(items)
H += ["#", "# The %s checks, in the gate\x27s order:" % (WORDS[count] if count < len(WORDS) else str(count))]
w = max(len(i["name"]) for i in items)
for i in items:
    shown = i["cmd"] if i["cmd"] is not None else unq(i["source"])
    H.append("#   %s  %s  (gate step %d: %s%s)" % (i["name"].ljust(w), shown, i["step"], i["title"], ", recorded" if i["kind"] == "formatter" else ""))
if fmt is None:
    H.append("# No formatter, so there is no recorded \"fix\" step.")
if baseline is None:
    H.append("# Baseline: not recorded yet; /redline:setup records it after the first green run and regenerates this file.")
else:
    mode = "git-only" if baseline["seconds"] > 300 else "full"
    note = (", " + baseline["note"].strip()) if baseline.get("note") else ""
    H.append("# Baseline on %s: %d seconds%s, so `checker: %s` is the right mode." % (baseline["date"], baseline["seconds"], note, mode))
H += ["#", "# Snapshot: {\"pr\", \"start_sha\", \"base_ref\", \"files\": [...], \"plan_paths\": [...]}."]
extra = "".join(" + " + a for a in allowed)
H += wrap("Allowed changes are files + plan_paths + agent-os/specs/ + agent-os/standards/%s; anything else that changed since start_sha is unexpected." % extra)
H += ["#"]
H += wrap("Exit 0 when every non-recorded check passed and git.unexpected_files and git.uncommitted are both empty, else 1. Usage errors exit 2. See %s for the output contract." % readme)
H += ["#"]
H += wrap("Generated from .claude/redline/checks.json by %sscripts/redline-setup.sh checks: edit the JSON and regenerate; do not edit this file by hand. The last line of this header is the gate stamp: a hash of the gate\x27s backticked text, written by %sscripts/redline-gate.sh stamp. A launch recomputes it from the gate and refuses to run when the two differ, so a gate step added later cannot go unnoticed. After bringing checks.json up to date with a changed gate, regenerate and restamp:" % (pfx, pfx))
H += ["# %sscripts/redline-gate.sh stamp %s .claude/redline/checks.sh" % (pfx, gate_file)]
H += [version_line]
stamp_kept = bool(stamp_line)
H += [stamp_line if stamp_line else "# redline-gate: TODO  stamp it: %sscripts/redline-gate.sh stamp %s .claude/redline/checks.sh" % (pfx, gate_file)]
for k, l in enumerate(H[1:-1], 1):
    if l == "" or l.startswith("# redline-gate:"):
        print("redline-setup: the generated header would hold an empty or stamp-like line (%r); shorten the input" % l, file=sys.stderr)
        sys.exit(2)

block = []
for i in items:
    if block or i["kind"] != "formatter":
        block.append("")
    if i["kind"] == "formatter":
        block += ["    # %d. %s. Recorded: never fails the run; the git block reports any file it touched" % (i["step"], i["title"]),
                  "    #    outside the allowed list.",
                  "    tree_state > \"$work/before_fix\"",
                  "    run_check %s 1 \"%s\"" % (i["name"], dq(i["cmd"])),
                  "    tree_state > \"$work/after_fix\"",
                  "    comm -13 \"$work/before_fix\" \"$work/after_fix\" | cut -d\x27 \x27 -f2- > \"$formatter_touched\""]
    elif i["kind"] == "octane":
        block += ["    # %d. Octane. Only when the workflow asks for it (REDLINE_OCTANE=1)." % i["step"],
                  "    if [[ \"${REDLINE_OCTANE:-0}\" == \"1\" ]]; then",
                  "        run_check octane 0 \"%s\"" % dq(i["cmd"]),
                  "    fi"]
    elif i["kind"] == "base-diff":
        block += ["    # %d. %s. A base that does not resolve fails the check with a reason." % (i["step"], i["title"]),
                  "    if env_base=\"$(base_ref)\"; then",
                  "        run_check %s %d \"%s\"" % (i["name"], i["recorded"], i["source"]),
                  "    else",
                  "        run_check %s %d \"echo \x27the base ref (the snapshot base_ref, else origin/HEAD, else origin/main) does not resolve here; fetch it\x27; exit 1\"" % (i["name"], i["recorded"]),
                  "    fi"]
    else:
        body = dq(i["cmd"]) if i["cmd"] is not None else i["source"]
        block += ["    # %d. %s." % (i["step"], i["title"]),
                  "    run_check %s %d \"%s\"" % (i["name"], i["recorded"], body)]
if fmt is None:
    block = ["    # No formatter: nothing touches a file, so formatter_touched stays empty."] + block
elif block and block[0] == "":
    block = block[1:]

aa = "ALWAYS_ALLOWED=(%s)" % " ".join("\x27%s\x27" % a for a in allowed)
aa_comment = ["# Files every round may change besides the plan\x27s (a generated contract the gate regenerates,",
              "# say). Repository-relative; a trailing / makes an entry a prefix."]
var_lines = [""] + ["%s=\"${%s:-%s}\"" % (v["name"], v["env"], v["default"]) for v in vars_] if vars_ else []
body = (tpl[i_set:i_aa_c] + aa_comment + [aa] + tpl[i_aa + 1:i_trap + 1] + var_lines + tpl[i_trap + 1:i_todo_c]
        + tpl[i_todo_end + 1:i_if + 1] + block + tpl[i_fi:])
text = "\n".join(H + [""] + body)
if not text.endswith("\n"):
    text += "\n"
with open(out, "w", encoding="utf-8") as f:
    f.write(text)
print(json.dumps({"checks": [i["name"] for i in items], "stampKept": stamp_kept, "templateVersion": version_line.split()[-1]}))
'
cmd_checks() {
    local pos=() dry=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) pos+=("$1"); shift ;;
        esac
    done
    [[ ${#pos[@]} -eq 2 ]] || usage
    local input="${pos[0]}" target="${pos[1]}"
    [[ -f "$input" && -r "$input" ]] || die2 "$input is not a readable file"
    jq -e . "$input" >/dev/null 2>&1 || die2 "$input is not JSON"
    [[ -f "$TEMPLATE" ]] || die2 "$TEMPLATE is missing"
    local version_line
    version_line="$(grep -m1 '^# redline-template:' "$TEMPLATE" || true)"
    if [[ -z "$version_line" ]]; then
        echo "redline-setup: template anchor missing: the '# redline-template:' line in $TEMPLATE" >&2
        exit 1
    fi
    local existed=false stamp=""
    if [[ -f "$target" ]]; then
        existed=true
        stamp="$(grep -m1 '^# redline-gate:' "$target" || true)"
        [[ "$stamp" == "# redline-gate: TODO"* ]] && stamp=""
    fi
    local tmp res rc=0
    if [[ "$dry" == true ]]; then
        # Under the system temp directory: tmp_beside would create the target's directory.
        tmp="$(mktemp "${TMPDIR:-/tmp}/redline-setup.XXXXXX")"
    else
        tmp="$(tmp_beside "$target")"
    fi
    res="$(python3 -I -c "$PY_CHECKS" "$TEMPLATE" "$stamp" "$tmp" "$version_line" < "$input")" || rc=$?
    if [[ $rc -ne 0 ]]; then
        rm -f "$tmp"
        exit $rc
    fi
    local changed=false written=false
    if [[ "$existed" == true ]] && cmp -s "$tmp" "$target"; then
        rm -f "$tmp"
    else
        changed=true
        if [[ "$dry" == true ]]; then
            rm -f "$tmp"
        else
            commit_tmp "$tmp" "$target"
            chmod +x "$target"
            written=true
        fi
    fi
    local abs="$target"
    if [[ -d "$(dirname "$target")" ]]; then
        abs="$(cd "$(dirname "$target")" && pwd)/$(basename "$target")"
    fi
    jq --arg file "$abs" --argjson changed "$changed" --argjson written "$written" \
        '{file: $file, written: $written, changed: $changed, stampKept: .stampKept, checks: .checks, templateVersion: .templateVersion}' <<<"$res"
}

# ---------------------------------------------------------------------------------------------
# read-checks
PY_READ='
import sys, re, json
text = sys.stdin.read()
lines = text.split("\n")
res = {"templateVersion": None, "stamp": None}
header = []
for l in lines[1:]:
    if not l.startswith("#"):
        break
    header.append(l)
htext = " ".join(h[1:].strip() for h in header)
for l in header:
    m = re.match(r"^# redline-template: checks-template\.sh (v\d+)\s*$", l)
    if m:
        res["templateVersion"] = m.group(1)
    m = re.match(r"^# redline-gate: (.*)$", l)
    if m and not m.group(1).startswith("TODO"):
        res["stamp"] = m.group(1)
repo = None
m = re.search(r"Redline gate for (.+?)\. Runs", htext)
if m:
    repo = m.group(1)
gate_file = None
m = re.search(r"\((\S+), steps \d+ to \d+\)", htext)
if not m:
    # The hand-written forms: "Verification Gate (<file>)", else any shape-spec.md path, never
    # starting on a parenthesis (#18).
    m = re.search(r"Verification Gate\s*\(([^\s()]+)\)", htext) or re.search(r"([^\s()]*shape-spec\.md)", htext)
if m:
    gate_file = m.group(1)
self_hosted = "See README.md for" in htext
baseline = None
m = re.search(r"Baseline on (\d{4}-\d\d-\d\d): (\d+) seconds(?:, (.*?))?, so `checker", htext)
if m:
    baseline = {"seconds": int(m.group(2)), "date": m.group(1)}
    if m.group(3):
        baseline["note"] = m.group(3)
docs = {}
for l in header:
    # ENV=<name> (generated since #18) or ENV=<identifier> (generated before it); the "(default ...)"
    # tail is optional, since a hand-written header may carry it on the next line, and runs to the
    # last ")" on the line, since a default may hold one (#62, R1-1).
    m = re.match(r"^#   ([A-Z_][A-Z0-9_]*)=(?:<name>|[A-Za-z_][A-Za-z0-9_]*)\s+(.*?)(?:\s+\(default .*\))?\s*$", l)
    if m:
        docs[m.group(1)] = m.group(2)
allowed = []
vars_ = []
checks = []
RUN = re.compile(r"^(\s*)run_check\s+([A-Za-z0-9_-]+)\s+([01])\s+\"(.*)\"\s*$")
COMMENT = re.compile(r"^\s*#\s*(?:Gate step\s*)?(\d+)[.:]\s*(.*)$")
VAR = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=\"\$\{([A-Z_][A-Z0-9_]*):-([^}]*)\}\"\s*$")
def unescape(raw):
    out = []
    k = 0
    while k < len(raw):
        c = raw[k]
        if c == "\\" and k + 1 < len(raw) and raw[k + 1] in "\\\"$`":
            out.append(raw[k + 1])
            k += 2
            continue
        out.append(c)
        k += 1
    return "".join(out)
def expands(raw):
    k = 0
    while k < len(raw):
        c = raw[k]
        if c == "\\":
            k += 2
            continue
        if c in "$`":
            return True
        k += 1
    return False
guards = []
aa_seen = False
hard = []
step = None
title = None
in_formatter = False
seen_if = False
for idx, l in enumerate(lines):
    s = l.strip()
    if l.startswith("if [[ \"$mode\" != \"git-only\" ]]; then"):
        seen_if = True
    m = re.match(r"^ALWAYS_ALLOWED=\((.*)\)\s*$", l)
    if m:
        aa_seen = True
        allowed = re.findall(r"\x27([^\x27]*)\x27|\"([^\"]*)\"|(\S+)", m.group(1))
        allowed = [a or b or c for a, b, c in allowed]
    # A hand-written git block hard-codes its allowed entries after the two fixed ones, where the
    # template expands ALWAYS_ALLOWED (#18).
    m = re.match(r"^\s*printf \x27%s\\n\x27 \x27agent-os/specs/\x27 \x27agent-os/standards/\x27(.*)$", l)
    if m:
        rest = m.group(1).replace("${ALWAYS_ALLOWED[@]+\"${ALWAYS_ALLOWED[@]}\"}", "")
        hard = [a or b or c for a, b, c in re.findall(r"\x27([^\x27]*)\x27|\"([^\"]*)\"|(\S+)", rest)]
        hard = [t for t in hard if t and not t.startswith("$")]
    m = VAR.match(l)
    if m and not seen_if:
        vars_.append({"name": m.group(1), "env": m.group(2), "default": m.group(3), "doc": docs.get(m.group(2), "")})
    m = COMMENT.match(l)
    if m:
        step = int(m.group(1))
        t = m.group(2).strip()
        t = re.split(r"\.(?:\s|$)|:\s", t, maxsplit=1)[0].strip()
        title = t or None
    if re.match(r"^\s*if \[\[ \"\$\{REDLINE_OCTANE", l):
        guards.append(("REDLINE_OCTANE", len(l) - len(l.lstrip())))
    elif re.match(r"^\s*if env_base=\"\$\(base_ref\)\"; then", l):
        guards.append(("base_ref", len(l) - len(l.lstrip())))
    elif guards and s == "fi" and len(l) - len(l.lstrip()) == guards[-1][1]:
        guards.pop()
    if "tree_state > \"$work/before_fix\"" in l:
        in_formatter = True
    if "tree_state > \"$work/after_fix\"" in l:
        in_formatter = False
    m = RUN.match(l)
    if m:
        raw = m.group(4)
        entry = {"line": idx + 1, "step": step, "name": m.group(2), "recorded": m.group(3) == "1",
                 "cmd": None if expands(raw) else unescape(raw), "source": raw if expands(raw) else None,
                 "guard": guards[-1][0] if guards else None, "title": title, "formatter": in_formatter}
        checks.append(entry)
if not aa_seen:
    allowed = hard
inp = {"repo": repo, "gateFile": gate_file, "selfHosted": self_hosted, "alwaysAllowed": allowed, "vars": vars_,
       "formatter": None, "octane": None, "baseline": baseline, "steps": []}
seen_base = set()
for c in checks:
    if c["formatter"]:
        f = {"step": c["step"], "name": c["name"], "cmd": c["cmd"] if c["cmd"] is not None else c["source"]}
        if c["title"]:
            f["title"] = c["title"]
        inp["formatter"] = f
        continue
    if c["guard"] == "REDLINE_OCTANE" and c["name"] == "octane":
        inp["octane"] = {"step": c["step"], "cmd": c["cmd"] if c["cmd"] is not None else c["source"]}
        continue
    if c["guard"] == "base_ref":
        if c["name"] in seen_base:
            continue
        seen_base.add(c["name"])
    s = {"step": c["step"], "name": c["name"], "recorded": 1 if c["recorded"] else 0}
    if c["cmd"] is not None:
        s["cmd"] = c["cmd"]
    else:
        s["source"] = c["source"]
    if c["title"]:
        s["title"] = c["title"]
    if c["guard"] == "base_ref":
        s["kind"] = "base-diff"
    inp["steps"].append(s)
res["checks"] = [{k: v for k, v in c.items() if k not in ("title", "formatter")} for c in checks]
res["input"] = inp
print(json.dumps(res))
'
cmd_read_checks() {
    [[ $# -eq 1 ]] || usage
    local file="$1"
    [[ -f "$file" && -r "$file" ]] || die2 "$file is not a readable file"
    local abs; abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
    python3 -I -c "$PY_READ" < "$abs" | jq --arg file "$abs" '{file: $file} + .'
}

# ---------------------------------------------------------------------------------------------
# version
# version_compare <template version> <file version>: prints {template, file, match, newer} and
# returns 1 on a mismatch (the caller says which on stderr). Compared as numbers when both read
# v<digits>: a newer file is not ported back to an older template.
version_compare() {
    local tv="$1" fv="$2" match=false newer=false fnum=""
    [[ -n "$fv" && "$fv" == "$tv" ]] && match=true
    if [[ "$fv" =~ ^v([0-9]+)$ ]]; then
        fnum="${BASH_REMATCH[1]}"
        if [[ "$tv" =~ ^v([0-9]+)$ ]] && (( 10#$fnum > 10#${BASH_REMATCH[1]} )); then
            newer=true
        fi
    fi
    jq -n --arg t "$tv" --arg f "$fv" --argjson match "$match" --argjson newer "$newer" \
        '{template: $t, file: (if $f == "" then null else $f end), match: $match, newer: $newer}'
    [[ "$match" == true ]]
}
# version_checks <checks.sh>: the file's "# redline-template:" line against the template's.
version_checks() {
    local file="$1"
    [[ -f "$file" && -r "$file" ]] || die2 "$file is not a readable file"
    [[ -f "$TEMPLATE" ]] || die2 "$TEMPLATE is missing"
    local tv fv
    tv="$(grep -m1 '^# redline-template: checks-template.sh ' "$TEMPLATE" | awk '{print $NF}' || true)"
    fv="$(grep -m1 '^# redline-template: checks-template.sh ' "$file" | awk '{print $NF}' || true)"
    [[ -n "$tv" ]] || die2 "$TEMPLATE has no '# redline-template:' line"
    version_compare "$tv" "$fv" && return 0
    if [[ -z "$fv" ]]; then
        echo "redline-setup: $file carries no template version line; the plugin ships checks-template.sh $tv. Run /redline:setup to port it" >&2
    elif [[ "$fv" =~ ^v([0-9]+)$ && "$tv" =~ ^v([0-9]+)$ ]] && (( 10#${fv#v} > 10#${tv#v} )); then
        echo "redline-setup: $file was made from checks-template.sh $fv, newer than the $tv this plugin ships; update the plugin" >&2
    else
        echo "redline-setup: $file was made from checks-template.sh $fv; the plugin ships $tv. Run /redline:setup to port the change" >&2
    fi
    return 1
}
# version_unattended <shape-spec.md>: the section's "<!-- redline-unattended: vN -->" marker against
# the template's (#15). No section or no marker reads as file null.
version_unattended() {
    local file="$1"
    [[ -f "$file" && -r "$file" ]] || die2 "$file is not a readable file"
    [[ -f "$UNATTENDED_TEMPLATE" ]] || die2 "$UNATTENDED_TEMPLATE is missing"
    local tv res present fv
    tv="$(grep -m1 '^<!-- redline-unattended: v' "$UNATTENDED_TEMPLATE" | sed 's/^<!-- redline-unattended: \(v[0-9]*\) -->.*/\1/' || true)"
    [[ -n "$tv" ]] || die2 "$UNATTENDED_TEMPLATE has no '<!-- redline-unattended:' marker"
    res="$(python3 -I -c "$PY_UNATTENDED" version "$UNATTENDED_TEMPLATE" "$UNATTENDED_HISTORY" "" "" "" "" 0 0 0 "" "" < "$file")" || exit $?
    present="$(jq -r .present <<<"$res")"
    fv="$(jq -r '.file // ""' <<<"$res")"
    version_compare "$tv" "$fv" && return 0
    if [[ "$present" == false ]]; then
        echo "redline-setup: $file has no unattended section; run /redline:setup" >&2
    elif [[ -z "$fv" ]]; then
        echo "redline-setup: the unattended section in $file carries no version marker; the plugin ships template $tv. Run /redline:setup to see the change" >&2
    elif [[ "$fv" =~ ^v([0-9]+)$ && "$tv" =~ ^v([0-9]+)$ ]] && (( 10#${fv#v} > 10#${tv#v} )); then
        echo "redline-setup: the unattended section in $file was made from template $fv, newer than the $tv this plugin ships; update the plugin" >&2
    else
        echo "redline-setup: the unattended section in $file was made from template $fv; the plugin ships $tv. Run /redline:setup to see the change" >&2
    fi
    return 1
}
# version_settings <repoRoot>: the allow entries the template carries that settings.json lacks
# (missing) and the retired ones it still carries (stale), as settings --dry-run reports them under
# added and stale; the repository's own entries are never reported. Returns 1 when either list has an
# entry; exits 2 as settings does on a file that is not JSON or starts with a byte-order mark.
version_settings() {
    local root="$1" res rc=0
    res="$(cmd_settings "$root" --dry-run)" || rc=$?
    [[ $rc -eq 0 ]] || exit $rc
    jq '{missing: .added, stale: .stale}' <<<"$res"
    local nm ns
    nm="$(jq '.added | length' <<<"$res")"
    ns="$(jq '.stale | length' <<<"$res")"
    [[ $nm -eq 0 ]] || echo "redline-setup: settings.json lacks $nm $(entries "$nm") the plugin now expects ($(jq -r '.added | join(", ")' <<<"$res")); run /redline:setup" >&2
    [[ $ns -eq 0 ]] || echo "redline-setup: settings.json carries $ns $(entries "$ns") the plugin retired ($(jq -r '.stale | join(", ")' <<<"$res")); run /redline:setup" >&2
    [[ $nm -eq 0 && $ns -eq 0 ]]
}
entries() { [[ "$1" -eq 1 ]] && echo entry || echo entries; }
# version <checks.sh>: the file form. version <repoRoot>: the root form, the one call the launch
# precheck makes (#15): checks.sh, the unattended section and settings.json, one stderr line per
# warning, exit 1 when any warns.
cmd_version() {
    [[ $# -eq 1 ]] || usage
    if [[ -f "$1" ]]; then
        version_checks "$1"
        return
    fi
    [[ -d "$1" ]] || die2 "$1 is neither a file nor a directory"
    local root c u st rc=0 part
    root="$(cd "$1" && pwd)"
    [[ -f "$root/.claude/redline/checks.sh" ]] || die2 "$root/.claude/redline/checks.sh is missing"
    [[ -f "$root/.claude/commands/agent-os/shape-spec.md" ]] || die2 "$root/.claude/commands/agent-os/shape-spec.md is missing"
    # Each part prints its JSON and returns 1 on a warning; a part that exits 2 (its reason already on
    # stderr) ends the call with 2.
    part=0; c="$(version_checks "$root/.claude/redline/checks.sh")" || part=$?
    [[ $part -ne 2 ]] || exit 2; [[ $part -eq 0 ]] || rc=1
    part=0; u="$(version_unattended "$root/.claude/commands/agent-os/shape-spec.md")" || part=$?
    [[ $part -ne 2 ]] || exit 2; [[ $part -eq 0 ]] || rc=1
    part=0; st="$(version_settings "$root")" || part=$?
    [[ $part -ne 2 ]] || exit 2; [[ $part -eq 0 ]] || rc=1
    jq -n --argjson c "$c" --argjson u "$u" --argjson s "$st" '{checks: $c, unattended: $u, settings: $s}'
    return $rc
}

[[ $# -ge 1 ]] || usage
case "$1" in
    settings) shift; cmd_settings "$@" ;;
    gitignore) shift; cmd_gitignore "$@" ;;
    command) shift; cmd_command "$@" ;;
    unattended) shift; cmd_unattended "$@" ;;
    config) shift; cmd_config "$@" ;;
    suggest-ask-rules) shift; cmd_suggest_ask_rules "$@" ;;
    checks) shift; cmd_checks "$@" ;;
    read-checks) shift; cmd_read_checks "$@" ;;
    version) shift; cmd_version "$@" ;;
    *) usage ;;
esac
