#!/usr/bin/env bash
#
# redline-setup.sh: the scriptable parts of /redline:setup, the skill that walks a repository through
# Redline's contract. The skill does the talking; this script does every edit that can be tested:
# the settings.json merge, the .gitignore line, the unattended section of shape-spec.md, redline.json
# from the baseline time, and checks.sh generated from the repository's .claude/redline/checks.json.
# checks.json is the source of truth: a change to the gate is an edit to the JSON and a regenerate,
# never a hand edit of checks.sh.
#
#   redline-setup.sh settings <repoRoot> [--allow <entry>]... [--dry-run]
#       Merge templates/settings.allow.json into <repoRoot>/.claude/settings.json without dropping
#       a key: existing keys keep their order, the template's are appended, and permissions.allow
#       is the existing entries, then the template's not yet present, then each --allow not yet
#       present. Compared as JSON, so a file the plugin CLI reordered is left alone. Prints
#       {file, existed, changed, written, added, keysAdded}.
#   redline-setup.sh gitignore <repoRoot> [--dry-run]
#       Add .claude/redline.local.json after .claude/settings.local.json, else after the last
#       .claude/ entry, else at the end; keeps CRLF. Prints {file, existed, changed, written, line,
#       after, at}.
#   redline-setup.sh unattended <shape-spec.md> --gate-steps <m>-<n> --prose-steps <text>
#           --retro-step <n> (--pr-body-standard <name> | --no-pr-body) [--force] [--dry-run]
#       Insert templates/shape-spec-unattended.md's section after the plan-mode check under
#       Prerequisites with the fill-ins applied, or, when the section is present, read its fill-ins
#       back and compare: equal is up to date; different exits 1 with {differs}, and --force patches
#       those phrases in place without re-pasting the body. Keeps a BOM and CRLF. Prints {file,
#       present, changed, written, fillins, found, differs, insertedAt}.
#   redline-setup.sh config --reviewer <handle> --baseline-seconds <n> [<repoRoot>] [--force] [--dry-run]
#       redline.json from templates/redline.json.example: checker is git-only when the baseline is
#       over 300 s, else full; checkerStallMs is the baseline times 1.7, rounded up to five minutes,
#       never below 300000. With a root, writes <repoRoot>/.claude/redline.json; an existing file
#       that differs exits 1 with {differs} unless --force. Prints {config, file, existed, changed,
#       written, differs}.
#   redline-setup.sh checks <checks.json> <checks.sh> [--dry-run]
#       Generate checks.sh from the JSON and scripts/checks-template.sh: a header naming the gate,
#       the checks and the baseline, the template version line, the stamp (an existing one is kept,
#       else the TODO placeholder), the template's functions verbatim, and one run_check per step.
#       Deterministic; nothing is written when the bytes are unchanged. With --dry-run, nothing is
#       written, not even the target's directory. Prints {file, written, changed, stampKept,
#       checks, templateVersion}.
#   redline-setup.sh read-checks <checks.sh>
#       Read the run_check lines, guards, variables, ALWAYS_ALLOWED and header back, and print them
#       with a best-effort checks.json under "input" (the bootstrap for a hand-written checks.sh).
#   redline-setup.sh version <checks.sh>
#       Compare the file's "# redline-template:" line with the template's. Prints {template, file,
#       match}; exits 1 on a mismatch or a missing line.
#
# Environment: REDLINE_TEMPLATE overrides scripts/checks-template.sh (tests).
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
# step in the template's base_ref guard.
#
# Exit codes: 0; 1 when a compared file differs without --force, a template anchor is missing, or
# the version line is missing or older; 2 on a bad invocation, a file that is not JSON, a settings
# file with a BOM, or a bad checks.json (every reason on stderr). Needs python3 and jq.

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="${REDLINE_TEMPLATE:-$PLUGIN_ROOT/scripts/checks-template.sh}"
SETTINGS_TEMPLATE="$PLUGIN_ROOT/templates/settings.allow.json"
CONFIG_TEMPLATE="$PLUGIN_ROOT/templates/redline.json.example"
UNATTENDED_TEMPLATE="$PLUGIN_ROOT/templates/shape-spec-unattended.md"

usage() {
    echo "usage: redline-setup.sh settings <repoRoot> [--allow <entry>]... [--dry-run] | gitignore <repoRoot> [--dry-run] | unattended <shape-spec.md> --gate-steps <m>-<n> --prose-steps <text> --retro-step <n> (--pr-body-standard <name> | --no-pr-body) [--force] [--dry-run] | config --reviewer <handle> --baseline-seconds <n> [<repoRoot>] [--force] [--dry-run] | checks <checks.json> <checks.sh> [--dry-run] | read-checks <checks.sh> | version <checks.sh>" >&2
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
    local root="" dry=false allows=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --allow) [[ $# -ge 2 && -n "$2" ]] || die2 "--allow needs an entry"; allows+=("$2"); shift 2 ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$root" ]] || usage; root="$1"; shift ;;
        esac
    done
    [[ -n "$root" ]] || usage
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local file="$root/.claude/settings.json" existed=false existing='{}'
    if [[ -f "$file" ]]; then
        existed=true
        if [[ "$(head -c 3 "$file" | od -An -tx1 | tr -d ' \n')" == "efbbbf" ]]; then
            die2 "$file starts with a byte-order mark; remove it before merging"
        fi
        existing="$(jq -c . "$file" 2>/dev/null)" || die2 "$file is not JSON"
    fi
    local extras='[]'
    if [[ ${#allows[@]} -gt 0 ]]; then
        extras="$(printf '%s\n' "${allows[@]}" | jq -R . | jq -s .)"
    fi
    local merged
    merged="$(jq -n --argjson e "$existing" --argjson t "$(jq -c . "$SETTINGS_TEMPLATE")" --argjson x "$extras" '
        def union($a; $b): reduce $b[] as $i ($a; if index([$i]) != null then . else . + [$i] end);
        ($e * $t)
        | .permissions.allow = union(union(($e.permissions.allow // []); ($t.permissions.allow // [])); $x)')"
    local changed=false written=false
    if [[ "$(jq -S -c . <<<"$existing")" != "$(jq -S -c . <<<"$merged")" ]]; then
        changed=true
        if [[ "$dry" == false ]]; then
            local tmp; tmp="$(tmp_beside "$file")"
            jq --indent 2 . <<<"$merged" > "$tmp"
            commit_tmp "$tmp" "$file"
            written=true
        fi
    fi
    jq -n --arg file "$file" --argjson existed "$existed" --argjson changed "$changed" --argjson written "$written" \
        --argjson e "$existing" --argjson m "$merged" '
        {file: $file, existed: $existed, changed: $changed, written: $written,
         added: [($m.permissions.allow // [])[] | select(. as $i | (($e.permissions.allow // []) | index([$i])) == null)],
         keysAdded: [($m | keys_unsorted[]) | select(. as $k | ($e | has($k)) | not)]}'
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
# unattended
PY_UNATTENDED='
import sys, re, json
tpl_path, gate, prose, retro, prbody, force, out = sys.argv[1:8]
force = force == "1"
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
want = {"gateSteps": gate, "proseSteps": prose, "retroStep": int(retro), "prBody": prbody if prbody else False}

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

def apply(sec, found):
    new = []
    for l in sec:
        l = re.sub(r"\(gate steps \d+ to \d+", "(gate steps %s to %s" % tuple(gate.split("-")), l)
        l = re.sub(r"Gate step \d+\x27s edits", "Gate step %s\x27s edits" % retro, l)
        l = re.sub(r"\bSteps? .+? stays? as written", prose_phrase(prose), l)
        if re.match(r"^11\. \*\*The PR description\.\*\*", l):
            if not want["prBody"]:
                continue
            l = re.sub(r"\(per (`[^`]+`|" + re.escape(GENERIC) + r")\)", "(per `%s`)" % want["prBody"], l)
        new.append(l)
    if want["prBody"] and found is not None and found["prBody"] is False:
        tpl11 = [t for t in tpl_section if re.match(r"^11\. \*\*The PR description\.\*\*", t)]
        if tpl11:
            line11 = re.sub(r"\(per " + re.escape(GENERIC) + r"\)", "(per `%s`)" % want["prBody"], tpl11[0])
            for k, l in enumerate(new):
                if l.startswith("Everything not named above"):
                    while k > 0 and new[k - 1] == "":
                        k -= 1
                    new.insert(k, line11)
                    break
    return new

with open(tpl_path, encoding="utf-8") as f:
    tpl = f.read().split("\n")
try:
    cut = tpl.index("---")
except ValueError:
    print("redline-setup: %s has no --- line before its section" % tpl_path, file=sys.stderr)
    sys.exit(2)
tpl_section = tpl[cut + 1:]
while tpl_section and tpl_section[0].strip() == "":
    tpl_section.pop(0)
while tpl_section and tpl_section[-1].strip() == "":
    tpl_section.pop()

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

def write(new_lines):
    with open(out, "wb") as f:
        f.write((b"\xef\xbb\xbf" if bom else b"") + nl.join(new_lines).encode("utf-8"))

if start is not None:
    end = section_end(lines, enc, start, level)
    found = read_fillins(lines[start:end])
    differs = {k: {"have": found[k], "want": want[k]} for k in want if found[k] != want[k]}
    base = {"present": True, "fillins": want, "found": found, "differs": differs, "insertedAt": None}
    if not differs:
        emit(dict(base, changed=False))
    if not force:
        print("redline-setup: the unattended section already exists with different fill-ins (%s); pass --force to patch them" % ", ".join("%s: %s -> %s" % (k, v["have"], v["want"]) for k, v in differs.items()), file=sys.stderr)
        emit(dict(base, changed=False), 1)
    new = lines[:start] + apply(lines[start:end], found) + lines[end:]
    write(new)
    emit(dict(base, changed=True))

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
section = apply(tpl_section, None)
new = lines[:idx] + section + [""] + lines[idx:]
write(new)
emit({"present": False, "changed": True, "fillins": want, "found": None, "differs": {}, "insertedAt": idx + 1})
'
cmd_unattended() {
    local file="" gate="" prose="" retro="" prbody="" nopr=false force=0 dry=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --gate-steps) [[ $# -ge 2 ]] || die2 "--gate-steps needs <m>-<n>"; gate="$2"; shift 2 ;;
            --prose-steps) [[ $# -ge 2 ]] || die2 "--prose-steps needs a value"; prose="$2"; shift 2 ;;
            --retro-step) [[ $# -ge 2 ]] || die2 "--retro-step needs a number"; retro="$2"; shift 2 ;;
            --pr-body-standard) [[ $# -ge 2 && -n "$2" ]] || die2 "--pr-body-standard needs a name"; prbody="$2"; shift 2 ;;
            --no-pr-body) nopr=true; shift ;;
            --force) force=1; shift ;;
            --dry-run) dry=true; shift ;;
            -*) usage ;;
            *) [[ -z "$file" ]] || usage; file="$1"; shift ;;
        esac
    done
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
    local abs tmp res rc=0
    abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
    tmp="$(tmp_beside "$abs")"
    res="$(python3 -I -c "$PY_UNATTENDED" "$UNATTENDED_TEMPLATE" "$gate" "$prose" "$retro" "$prbody" "$force" "$tmp" < "$abs")" || rc=$?
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
cmd_config() {
    local reviewer="" seconds="" root="" force=false dry=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --reviewer) [[ $# -ge 2 ]] || die2 "--reviewer needs a handle"; reviewer="$2"; shift 2 ;;
            --baseline-seconds) [[ $# -ge 2 ]] || die2 "--baseline-seconds needs a number"; seconds="$2"; shift 2 ;;
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
    local config; config="$(jq -c . <<<"$content")"
    if [[ -z "$root" ]]; then
        jq -n --argjson config "$config" '{config: $config, file: null, existed: false, changed: false, written: false, differs: {}}'
        return 0
    fi
    [[ -d "$root" ]] || die2 "$root is not a directory"
    root="$(cd "$root" && pwd)"
    local file="$root/.claude/redline.json" existed=false have='null' differs='{}' changed=true written=false
    if [[ -f "$file" ]]; then
        existed=true
        have="$(jq -c . "$file" 2>/dev/null)" || die2 "$file is not JSON"
        if [[ "$(jq -S -c . <<<"$have")" == "$(jq -S -c . <<<"$config")" ]]; then
            changed=false
        else
            differs="$(jq -n --argjson h "$have" --argjson w "$config" '
                [($h | keys) + ($w | keys) | unique[]] | map(select(($h[.] | tojson) != ($w[.] | tojson)) | {key: ., value: {have: $h[.], want: $w[.]}}) | from_entries')"
            if [[ "$force" == false ]]; then
                jq -n --argjson config "$config" --arg file "$file" --argjson differs "$differs" \
                    '{config: $config, file: $file, existed: true, changed: false, written: false, differs: $differs}'
                echo "redline-setup: $file exists and differs ($(jq -r 'keys | join(", ")' <<<"$differs")); pass --force to overwrite it" >&2
                exit 1
            fi
        fi
    fi
    if [[ "$changed" == true && "$dry" == false ]]; then
        local tmp; tmp="$(tmp_beside "$file")"
        printf '%s\n' "$content" > "$tmp"
        commit_tmp "$tmp" "$file"
        written=true
    fi
    jq -n --argjson config "$config" --arg file "$file" --argjson existed "$existed" --argjson changed "$changed" \
        --argjson written "$written" --argjson differs "$differs" \
        '{config: $config, file: $file, existed: $existed, changed: $changed, written: $written, differs: $differs}'
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
need(isinstance(spec, dict), "the top level must be an object")
if not isinstance(spec, dict):
    spec = {}
repo = spec.get("repo")
gate_file = spec.get("gateFile")
need(isinstance(repo, str) and repo.strip() != "", "repo (the phrase after \x27Redline gate for\x27) is required")
need(isinstance(gate_file, str) and gate_file.strip() != "", "gateFile is required")
self_hosted = spec.get("selfHosted", False)
need(isinstance(self_hosted, bool), "selfHosted must be true or false")
allowed = spec.get("alwaysAllowed", [])
need(isinstance(allowed, list) and all(isinstance(a, str) and a for a in allowed), "alwaysAllowed must be a list of paths")
IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
NAME = re.compile(r"^[a-z][a-z0-9-]*$")
vars_ = spec.get("vars", [])
need(isinstance(vars_, list), "vars must be a list")
for v in (vars_ if isinstance(vars_, list) else []):
    need(isinstance(v, dict) and IDENT.match(str(v.get("name", ""))) and IDENT.match(str(v.get("env", ""))) and isinstance(v.get("default", None), str) and isinstance(v.get("doc", ""), str), "each var needs name, env, default and doc")
baseline = spec.get("baseline")
if baseline is not None:
    ok = isinstance(baseline, dict) and isinstance(baseline.get("seconds"), int) and not isinstance(baseline.get("seconds"), bool) and baseline.get("seconds") >= 0 and isinstance(baseline.get("date"), str) and re.fullmatch(r"\d{4}-\d\d-\d\d", baseline.get("date") or "")
    need(ok, "baseline needs seconds (a non-negative integer) and date (YYYY-MM-DD), or is null")
    need(baseline.get("note") is None or isinstance(baseline.get("note"), str), "baseline.note must be a string") if isinstance(baseline, dict) else None
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
    items.append({"kind": kind, "step": s.get("step"), "name": name, "recorded": rec, "cmd": s.get("cmd") if has_cmd else None, "source": s.get("source") if has_src else None, "title": s.get("title") or name})
fmt = spec.get("formatter")
if fmt is not None:
    ok = isinstance(fmt, dict) and isinstance(fmt.get("step"), int) and NAME.match(str(fmt.get("name", ""))) and one_text(fmt, "cmd")
    need(ok, "formatter needs step, name and cmd, or is null")
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
    H.append("#   %s=%s   %s (default %s)" % (v["env"], v["name"], v.get("doc", "").strip() or "set by the repository", v["default"]))
count = len(items)
H += ["#", "# The %s checks, in the gate\x27s order:" % (WORDS[count] if count < len(WORDS) else str(count))]
w = max(len(i["name"]) for i in items)
for i in items:
    shown = i["cmd"] if i["cmd"] is not None else i["source"]
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
if m:
    gate_file = m.group(1)
else:
    m = re.search(r"(\S*shape-spec\.md)", htext)
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
    m = re.match(r"^#   ([A-Z_][A-Z0-9_]*)=([A-Za-z_][A-Za-z0-9_]*)\s+(.*?) \(default (.*)\)\s*$", l)
    if m:
        docs[m.group(1)] = m.group(3)
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
        allowed = re.findall(r"\x27([^\x27]*)\x27|\"([^\"]*)\"|(\S+)", m.group(1))
        allowed = [a or b or c for a, b, c in allowed]
    m = VAR.match(l)
    if m and not seen_if:
        vars_.append({"name": m.group(1), "env": m.group(2), "default": m.group(3), "doc": docs.get(m.group(2), "")})
    m = COMMENT.match(l)
    if m:
        step = int(m.group(1))
        t = m.group(2).strip()
        t = re.split(r"\.(?:\s|$)|:\s", t, 1)[0].strip()
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
cmd_version() {
    [[ $# -eq 1 ]] || usage
    local file="$1"
    [[ -f "$file" && -r "$file" ]] || die2 "$file is not a readable file"
    [[ -f "$TEMPLATE" ]] || die2 "$TEMPLATE is missing"
    local tv fv
    tv="$(grep -m1 '^# redline-template: checks-template.sh ' "$TEMPLATE" | awk '{print $NF}' || true)"
    fv="$(grep -m1 '^# redline-template: checks-template.sh ' "$file" | awk '{print $NF}' || true)"
    [[ -n "$tv" ]] || die2 "$TEMPLATE has no '# redline-template:' line"
    local match=false
    [[ -n "$fv" && "$fv" == "$tv" ]] && match=true
    jq -n --arg t "$tv" --arg f "$fv" --argjson match "$match" '{template: $t, file: (if $f == "" then null else $f end), match: $match}'
    if [[ "$match" == false ]]; then
        if [[ -z "$fv" ]]; then
            echo "redline-setup: $file carries no template version line; the plugin ships checks-template.sh $tv. Run /redline:setup to port it" >&2
        else
            echo "redline-setup: $file was made from checks-template.sh $fv; the plugin ships $tv. Run /redline:setup to port the change" >&2
        fi
        exit 1
    fi
}

[[ $# -ge 1 ]] || usage
case "$1" in
    settings) shift; cmd_settings "$@" ;;
    gitignore) shift; cmd_gitignore "$@" ;;
    unattended) shift; cmd_unattended "$@" ;;
    config) shift; cmd_config "$@" ;;
    checks) shift; cmd_checks "$@" ;;
    read-checks) shift; cmd_read_checks "$@" ;;
    version) shift; cmd_version "$@" ;;
    *) usage ;;
esac
