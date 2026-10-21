#!/usr/bin/env bash
#
# redline-gate.sh: the gate stamp. A repository's .claude/redline/checks.sh is a transcription of
# the Verification Gate in its .claude/commands/agent-os/shape-spec.md; when a step is added to the
# gate later, checks.sh goes on passing without it. The stamp is one comment line in checks.sh
# that records a hash of the gate, and a launch refuses to start when the gate no longer matches it.
#
#   redline-gate.sh extract <shape-spec.md>
#       Find the gate and print one JSON object: the heading and its line, whether it sits inside a
#       fenced block, the numbered steps (number, line, title, the backticked spans and fenced
#       blocks each holds), the default step range, the exact list of hashed items, and sha256.
#   redline-gate.sh stamp <shape-spec.md> [<checks.sh>] [--steps <m>-<n>]
#       Print the stamp line. With <checks.sh>, also write it: the first "# redline-gate:" line is
#       replaced in place (the template's TODO placeholder included); when there is none, the line
#       is inserted as the last line of the header comment. --steps is the command-step range for the
#       reader; it defaults to the "(gate steps M to N" parenthetical of the file's unattended section.
#   redline-gate.sh check <repoRoot>
#       Read the stamp from <repoRoot>/.claude/redline/checks.sh, recompute the hash of the file it
#       names and compare. Prints {ok, reason, stamp: {path, steps, sha256} | null,
#       actual: {heading, line, steps, sha256} | null}.
#
# The gate is the one heading whose text contains "verification gate" (any case) and whose section
# holds a numbered list. When more than one qualifies, every subcommand exits 1 naming each heading
# line, and check's reason is "two gates". A section runs to the next heading of the same or a higher level, or, when
# the heading sits inside a fenced block (a gate written into the plan template), to that fence's
# close. The hash covers every backticked span and every fenced block in the section, nested lines
# included, in document order, each with runs of whitespace collapsed; the items are joined with
# newlines and hashed with sha256. Prose outside backticks never changes it. A code span that
# continues on a second line is not recognised.
#
# The stamp line:  # redline-gate: <repo-relative shape-spec path> steps <m>-<n> sha256:<64 hex>
#
# Exit codes: extract 0, or 1 when the file has no gate or two qualifying sections; stamp 0, 1 when
# the file has no gate or two qualifying sections, 2 on a bad or missing --steps; check 0 on a
# match, 1 when the gate moved, the stamp is missing or the placeholder, the stamped path does not
# exist, or it holds two qualifying sections (a failed check, with one line on stderr), 2 when
# <repoRoot> has no .claude/redline/checks.sh. A bad invocation exits 2. Needs python3 and jq.

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SELF="$PLUGIN_ROOT/scripts/redline-gate.sh"

usage() {
    echo "usage: redline-gate.sh extract <shape-spec.md> | stamp <shape-spec.md> [<checks.sh>] [--steps <m>-<n>] | check <repoRoot>" >&2
    exit 2
}

# The parser. Reads the markdown on stdin, prints one JSON object, exits 1 with {"error": ...} when
# the file has no gate.
PARSE='
import sys, re, json, hashlib

text = sys.stdin.read()
if text.startswith("﻿"):
    text = text[1:]
text = text.replace("\r\n", "\n").replace("\r", "\n")
lines = text.split("\n")
n = len(lines)

FENCE = re.compile(r"^([ \t]*)(`{3,}|~{3,})(.*)$")
HEAD = re.compile(r"^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$")
STEP = re.compile(r"^(\d+)\.[ \t]+(.*)$")
LIST1 = re.compile(r"^[ \t]*1\.[ \t]")
SPAN = re.compile(r"(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)")
RANGE = re.compile(r"\(gate steps (\d+) to (\d+)", re.I)
TITLE = re.compile(r"^\*\*(.+?)\*\*")

def norm(s):
    return " ".join(s.split())

# Pass 1: which fence, if any, encloses each line. A fence opens on any ``` or ~~~ run (any indent;
# a backtick opener may not carry a backtick in its info string) and closes on a run of the same
# character at least as long, with nothing after it.
enc = [None] * n
isfence = [False] * n
col = {}
opener = None
for i, line in enumerate(lines):
    m = FENCE.match(line)
    if opener is None:
        if m and not (m.group(2)[0] == "`" and "`" in m.group(3)):
            opener = (i, m.group(2)[0], len(m.group(2)))
            col[i] = len(m.group(1).expandtabs(4))
            enc[i] = i
            isfence[i] = True
        continue
    enc[i] = opener[0]
    if m and m.group(2)[0] == opener[1] and len(m.group(2)) >= opener[2] and m.group(3).strip() == "":
        isfence[i] = True
        opener = None

def section_end(i, level, e):
    j = i + 1
    while j < n:
        if e is not None:
            if enc[j] != e or isfence[j]:
                return j
            h = HEAD.match(lines[j])
            if h and len(h.group(1)) <= level:
                return j
        else:
            if enc[j] is None:
                h = HEAD.match(lines[j])
                if h and len(h.group(1)) <= level:
                    return j
        j += 1
    return n

# Pass 2: every "verification gate" heading whose section holds a numbered list. Exactly one must
# qualify: none is no gate, and more than one is refused, naming each heading line, rather than
# taking the first, so the hash can never move silently onto the wrong section.
found = []
for i, line in enumerate(lines):
    h = HEAD.match(line)
    if not h or not re.search(r"verification gate", h.group(2), re.I):
        continue
    e = enc[i]
    if e is not None and (isfence[i] or col.get(e, 0) != 0):
        continue
    level = len(h.group(1))
    end = section_end(i, level, e)
    if any(enc[j] == e and LIST1.match(lines[j]) for j in range(i + 1, end)):
        found.append((i, h.group(2), level, end, e))
if not found:
    print(json.dumps({"error": "no verification gate section with a numbered list"}))
    sys.exit(1)
if len(found) > 1:
    named = ["%d (\"%s\")" % (f[0] + 1, f[1]) for f in found]
    print(json.dumps({
        "error": "%d verification gate sections hold a numbered list, the headings at lines %s and %s; rewrite one so only the gate holds a numbered list" % (len(found), ", ".join(named[:-1]), named[-1]),
        "reason": "two gates",
        "lines": [f[0] + 1 for f in found],
    }))
    sys.exit(1)

i, heading, level, end, e = found[0]

def title_of(rest):
    t = TITLE.match(rest)
    if t:
        return t.group(1).strip("`")
    for sep in (" — ", " – ", " - ", ": "):
        if sep in rest:
            return rest.split(sep, 1)[0].strip("`*")
    return rest.strip("`*")

# Pass 3: the steps and the hash input, in document order.
hashed, steps, outside = [], [], []
cur = None
j = i + 1
while j < end:
    line = lines[j]
    if isfence[j] and enc[j] == j:
        items = []
        k = j + 1
        while k < end and enc[k] == j and not isfence[k]:
            t = norm(lines[k])
            if t:
                items.append(t)
            k += 1
        (cur["commands"] if cur else outside).extend(items)
        hashed.extend(items)
        j = k + 1 if (k < end and isfence[k]) else k
        continue
    s = STEP.match(line) if enc[j] == e else None
    if s:
        cur = {"n": int(s.group(1)), "line": j + 1, "title": title_of(s.group(2)), "commands": []}
        steps.append(cur)
        rest = s.group(2)
    else:
        rest = line
    items = [norm(m.group(2)) for m in SPAN.finditer(rest)]
    (cur["commands"] if cur else outside).extend(items)
    hashed.extend(items)
    j += 1

digest = hashlib.sha256(("\n".join(hashed) + "\n").encode("utf-8")).hexdigest()
r = RANGE.search(text)
print(json.dumps({
    "heading": heading,
    "line": i + 1,
    "level": level,
    "end_line": end,
    "in_fence": e is not None,
    "steps_default": [int(r.group(1)), int(r.group(2))] if r else None,
    "steps": steps,
    "outside": outside,
    "hashed": hashed,
    "sha256": digest,
}))
'

# The header edit. Reads checks.sh on stdin and the stamp line as its argument; prints the file
# with the first "# redline-gate:" line replaced, or with the line inserted as the last line of the
# header comment (the run of "#" lines that starts at line 2).
STAMP='
import sys, re
line = sys.argv[1]
src = sys.stdin.read()
lines = src.split("\n")
for k, l in enumerate(lines):
    if l.startswith("# redline-gate:"):
        lines[k] = line
        break
else:
    k = 1
    while k < len(lines) and lines[k].startswith("#"):
        k += 1
    lines.insert(k, line)
    for l in lines:
        m = re.search(r"sed -n \x27(2,[0-9]+p)\x27", l)
        if m:
            sys.stderr.write("redline-gate: the --help line prints a numeric sed range (" + m.group(1) + "), which the inserted stamp line shifts; change it to sed -n \x272,/^$/p\x27\n")
            break
sys.stdout.write("\n".join(lines))
'

# extract_to <file>: sets REL (the file's path relative to its repository, or as given) and OUT (the
# parser's JSON with "file" added). Exits 2 when the file is unreadable, 1 when it has no gate.
extract_to() {
    local given="$1" abs top
    if [[ ! -f "$given" || ! -r "$given" ]]; then
        echo "redline-gate: $given is not a readable file" >&2
        exit 2
    fi
    abs="$(cd "$(dirname "$given")" && pwd -P)/$(basename "$given")"
    REL="$given"
    top="$(cd "$(dirname "$abs")" && git rev-parse --show-toplevel 2>/dev/null || true)"
    [[ -n "$top" ]] && top="$(cd "$top" && pwd -P)"
    if [[ -n "$top" && "$abs" == "$top/"* ]]; then
        REL="${abs#"$top"/}"
    fi
    local parsed
    if ! parsed="$(python3 -I -c "$PARSE" < "$abs")"; then
        echo "redline-gate: $(jq -r '.error' <<<"$parsed") in $given" >&2
        exit 1
    fi
    OUT="$(jq --arg file "$REL" '{file: $file} + .' <<<"$parsed")"
}

cmd_extract() {
    [[ $# -eq 1 ]] || usage
    extract_to "$1"
    printf '%s\n' "$OUT"
}

cmd_stamp() {
    local spec="" checks="" range=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --steps)
                [[ $# -ge 2 && -n "$2" ]] || { echo "redline-gate: --steps needs a value, <m>-<n>" >&2; exit 2; }
                range="$2"; shift 2 ;;
            -*) usage ;;
            *)
                if [[ -z "$spec" ]]; then spec="$1"
                elif [[ -z "$checks" ]]; then checks="$1"
                else usage; fi
                shift ;;
        esac
    done
    [[ -n "$spec" ]] || usage
    extract_to "$spec"
    local count sha m n
    count="$(jq -r '.steps | length' <<<"$OUT")"
    sha="$(jq -r '.sha256' <<<"$OUT")"
    if [[ -z "$range" ]]; then
        range="$(jq -r '.steps_default | if . then "\(.[0])-\(.[1])" else "" end' <<<"$OUT")"
        if [[ -z "$range" ]]; then
            echo "redline-gate: $spec has no \"(gate steps M to N\" parenthetical; give the command-step range with --steps <m>-<n>" >&2
            exit 2
        fi
    fi
    if [[ ! "$range" =~ ^([0-9]+)-([0-9]+)$ ]]; then
        echo "redline-gate: --steps must be <m>-<n>; got '$range'" >&2
        exit 2
    fi
    m="${BASH_REMATCH[1]}"; n="${BASH_REMATCH[2]}"
    if (( m < 1 || m > n || n > count )); then
        echo "redline-gate: steps $range is outside the gate's $count steps" >&2
        exit 2
    fi
    local line="# redline-gate: $REL steps $m-$n sha256:$sha"
    if [[ -n "$checks" ]]; then
        if [[ ! -f "$checks" ]]; then
            echo "redline-gate: $checks is not a file" >&2
            exit 2
        fi
        local tmp
        tmp="$(mktemp "${TMPDIR:-/tmp}/redline-gate.XXXXXX")"
        python3 -I -c "$STAMP" "$line" < "$checks" > "$tmp"
        cat "$tmp" > "$checks"
        rm -f "$tmp"
    fi
    printf '%s\n' "$line"
}

# check_fail <reason> <stderr line> [<stamp json>] [<actual json>]
check_fail() {
    jq -n --arg reason "$1" --argjson stamp "${3:-null}" --argjson actual "${4:-null}" \
        '{ok: false, reason: $reason, stamp: $stamp, actual: $actual}'
    echo "$2" >&2
    exit 1
}

cmd_check() {
    [[ $# -eq 1 ]] || usage
    local root="$1" checks line stamp_json actual_json
    [[ -d "$root" ]] || { echo "redline-gate: $root is not a directory" >&2; exit 2; }
    root="$(cd "$root" && pwd)"
    checks="$root/.claude/redline/checks.sh"
    [[ -f "$checks" ]] || { echo "redline-gate: $root has no .claude/redline/checks.sh" >&2; exit 2; }
    line="$(grep -m1 '^# redline-gate:' "$checks" || true)"
    local how=".claude/redline/checks.sh carries no gate stamp; stamp it with $SELF stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh"
    if [[ -z "$line" || "$line" == "# redline-gate: TODO"* ]]; then
        check_fail "no stamp" "$how"
    fi
    if [[ ! "$line" =~ ^#\ redline-gate:\ ([^\ ]+)\ steps\ ([0-9]+-[0-9]+)\ sha256:([0-9a-f]{64})$ ]]; then
        check_fail "malformed stamp" ".claude/redline/checks.sh carries a malformed gate stamp ($line); restamp it with $SELF stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh"
    fi
    local path="${BASH_REMATCH[1]}" steps="${BASH_REMATCH[2]}" stamped="${BASH_REMATCH[3]}"
    stamp_json="$(jq -n --arg path "$path" --arg steps "$steps" --arg sha "$stamped" '{path: $path, steps: $steps, sha256: $sha}')"
    if [[ ! -f "$root/$path" ]]; then
        check_fail "stamped path missing" "the gate stamp in .claude/redline/checks.sh names $path, which does not exist; restamp it with $SELF stamp <shape-spec.md> .claude/redline/checks.sh" "$stamp_json"
    fi
    local parsed
    if ! parsed="$(python3 -I -c "$PARSE" < "$root/$path")"; then
        if [[ "$(jq -r '.reason // empty' <<<"$parsed" 2>/dev/null)" == "two gates" ]]; then
            check_fail "two gates" "the verification gate in $path is ambiguous: $(jq -r '.error' <<<"$parsed"), then run check again" "$stamp_json"
        fi
        check_fail "no gate" "the gate stamp in .claude/redline/checks.sh names $path, which has no verification gate; restamp it with $SELF stamp <shape-spec.md> .claude/redline/checks.sh" "$stamp_json"
    fi
    actual_json="$(jq '{heading: .heading, line: .line, steps: (.steps | length), sha256: .sha256}' <<<"$parsed")"
    local current
    current="$(jq -r '.sha256' <<<"$parsed")"
    if [[ "$current" != "$stamped" ]]; then
        check_fail "gate changed" "the verification gate in $path has changed since .claude/redline/checks.sh was stamped; bring checks.sh up to date, then restamp with $SELF stamp $path .claude/redline/checks.sh" "$stamp_json" "$actual_json"
    fi
    jq -n --argjson stamp "$stamp_json" --argjson actual "$actual_json" \
        '{ok: true, reason: "match", stamp: $stamp, actual: $actual}'
}

[[ $# -ge 1 ]] || usage
case "$1" in
    extract) shift; cmd_extract "$@" ;;
    stamp) shift; cmd_stamp "$@" ;;
    check) shift; cmd_check "$@" ;;
    *) usage ;;
esac
