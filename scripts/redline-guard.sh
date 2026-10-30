#!/usr/bin/env bash
#
# redline-guard.sh: PreToolUse hook for Redline's subagents, registered by the plugin's
# hooks/hooks.json on Bash, Write, Edit, MultiEdit and NotebookEdit.
#
# A plugin hook fires in every session where the plugin is enabled, and a plugin agent's
# frontmatter hooks are ignored, so the guard learns its role from the hook input:
# agent_type is "redline:redline-<role>" for the plugin's agents (or "redline-<role>" for a
# copy installed into .claude/agents/). Any other agent_type, or none (the main session), is
# not a Redline role: the guard exits 0 with no output and the call goes on as if the hook
# were not there. An agent_type of the Redline form whose role is not in the table is refused.
#
# Reads the hook JSON on stdin. For a Bash call it tokenises tool_input.command,
# splits it into simple commands, and exits 2 with a one-line reason unless BOTH
# hold for every simple command: (a) the command (and for git, gh, composer, php
# and the Redline scripts, its subcommand) is on the role's allowlist, and (b)
# every write target it can extract (>, >>, tee, sed -i, mv/cp, rm, mkdir, touch,
# git add paths, ...) is under one of the role's write prefixes. For a Write,
# Edit, MultiEdit or NotebookEdit call it checks tool_input.file_path against the
# same prefixes. Default deny: anything it cannot classify is refused.
#
# What it allows it also approves: it prints a PreToolUse permissionDecision of
# "allow" on stdout, so a guarded Redline role never meets a permission prompt for
# a command the guard vetted, and the shared settings.json needs no git write
# rules that would reach every other session in the repository.
#
# The repository is the one holding the hook's cwd. The plugin's own files are found through
# CLAUDE_PLUGIN_ROOT, which Claude Code exports to plugin hooks (this script's parent directory
# when it is run by hand, as tests/guard-test.sh does). When the two are the same directory
# (Redline loaded in place from its own checkout, reviewing itself), the plugin's source is the
# repository's content and the roles write it by the same rules as any other; see the table.
#
# Needs python3 (macOS command line tools) and jq. Set REDLINE_GUARD_LOG=<file> in the
# environment Claude Code starts from to append one line per decision for tuning, inert ones
# included: agent_type (- for the main session), decision, reason, command or path.

set -euo pipefail

input="$(cat)"

# Fast path: most calls in most sessions are not a Redline role's, so they leave here without
# starting Python. When jq cannot read the input, Python decides.
agent_type="$(jq -r '.agent_type // ""' <<<"$input" 2>/dev/null)" || agent_type="?"
redline_role='^(redline:)?redline-'
if [[ "$agent_type" != "?" && ! "$agent_type" =~ $redline_role ]]; then
    # Not a Redline role. One shape of Bash call reaches Python anyway: one that may be one of the
    # plugin's own scripts, the repository's checks.sh or read-only git, which the guard approves
    # for any session by real path, so the shared allow list carries no Bash(/*/scripts/...) rule
    # that a script of the same name anywhere would match (#50). Everything else is inert here.
    tool_name="$(jq -r '.tool_name // ""' <<<"$input" 2>/dev/null)" || tool_name=""
    main_shape='redline-(gh|prefs|gate|setup)\.sh|checks\.sh|(^|[^A-Za-z0-9_./-])git[[:space:]]'
    if [[ "$tool_name" == "Bash" ]] && jq -r '.tool_input.command // ""' <<<"$input" 2>/dev/null | grep -Eq "$main_shape"; then
        export REDLINE_GUARD_MAIN=1
    else
        if [[ -n "${REDLINE_GUARD_LOG:-}" ]]; then
            printf '%s\tinert\t\t%s\n' "${agent_type:--}" "$tool_name" 2>/dev/null >>"$REDLINE_GUARD_LOG" || true
        fi
        exit 0
    fi
fi

REDLINE_GUARD_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
export REDLINE_GUARD_PLUGIN_ROOT

# ---------------------------------------------------------------------------
# The allowlist. One line per role: role | command groups | write prefixes.
#
# Command groups (defined in the Python below):
#   read       file and text tools, read-only php artisan commands, read-only git
#   tests      php artisan test, vendor/bin/pest, composer test
#   build      composer check/fix/lint/test*, vendor/bin/{pint,phpstan,rector,pest},
#              php artisan <anything except tinker, db:wipe, migrate:fresh, migrate:reset>, npm run
# A vendor/bin tool is accepted in any spelling that resolves to the repository's own copy
# (vendor/bin/pest, ./vendor/bin/pest, <repo>/vendor/bin/pest), and in no other. So is
# artisan after php (php artisan, php ./artisan, php <repo>/artisan).
#   checks     the repository's .claude/redline/checks.sh, and the plugin's scripts/redline-background.sh
#              start | wait, which runs that checks.sh in the background for a long gate (#40)
#   gh-read    the plugin's scripts/redline-gh.sh pr | diff | pr-comments | issues-search | review-comments | has-review | last-round | prior-findings | files | login | place | human-review | last-human-review | threads
#   gh-all     the plugin's scripts/redline-gh.sh, every subcommand
#   git-read   read-only git alone (status, log, rev-parse, ...), without the file tools of read
#   git-add    git add <paths>  (never -A, --all, -u, ., *)
#   git-commit git commit -m/-F (never -a, --amend, --no-verify; message starts "redline:", no attribution)
#   git-push   git push [remote [branch]]  (never --force, -f, --force-with-lease, --delete, +ref)
#
# Write prefixes:
#   NONE   no write target of any kind (/dev/null is never a write)
#   TMP    the system temp dir, $TMPDIR and the hook's scratchpad_dir
#   REPO   anywhere inside the repository
#   <path> a repository-relative prefix
# .git/ and Redline's own files (the plugin's directory, .claude/redline/, .claude/redline*.json,
# .claude/settings*.json, and the copies .claude/agents/redline-*, .claude/workflows/redline-*,
# .claude/skills/redline* an install into .claude/ would add) are refused for every role (Redline
# never edits Redline), and so is a write that would take them along (rm -rf .claude). The
# rest of .claude/ (commands, other skills and agents, CLAUDE.md beside it) is ordinary repository
# content: the implementer may write it when the approved plan names it, and the checker's
# allowed list is what holds the implementer to the plan.
# A Bash write target holding *, ?, [ or { is refused for every role unless it is under the temp
# directory: the guard checks paths, not patterns, so a role names its files (#53). A tool's
# file_path is literal.
# When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the
# plugin's directory is the repository, so it is not refused as a whole: agents/, scripts/,
# workflows/, skills/, tests/, templates/, hooks/ and the README are repository content under the
# same prefixes. Two files stay refused for every role there, because they are the guard that
# vets the run: scripts/redline-guard.sh and hooks/hooks.json. A person changes those.
# A repository's ask rules (askRules[].when.paths in <repo>/.claude/redline.json, #49) name the files
# a person is always brought in for: a write under one is refused for every role, naming the rule,
# and so is a write to a directory that holds a rule's root (rm -rf config). The target is resolved
# through symlinks first, so a path outside the repository that resolves into a match is refused
# too. Globs: ** spans directories, * and ? stay inside one segment, a pattern with no / matches at
# any depth, a trailing / takes the directory and everything in it; matched case-folded against the
# repository-relative path (the same dialect as workflows/redline-loop.js). A malformed askRules
# list refuses every write by a role, naming the fault, until a person fixes the file.
# ---------------------------------------------------------------------------
REDLINE_GUARD_TABLE='
reviewer           | read tests gh-read                                | TMP
shaper             | read tests gh-read                                | TMP agent-os/specs/
resolve            | read                                              | agent-os/specs/
plan-approver      | read gh-read                                      | NONE
standards-approver | read                                              | NONE
implementer        | read tests build checks git-add git-commit        | TMP REPO
checker            | checks                                            | NONE
github             | gh-all git-read git-add git-commit git-push       | TMP agent-os/specs/
'
export REDLINE_GUARD_TABLE

# read -d '' takes the whole heredoc; it returns 1 at end of input, hence || true.
IFS= read -r -d '' PYTHON <<'PY' || true
import fnmatch, json, os, re, shlex, sys, tempfile

AGENT = "?"
ROLE = "?"
PLUGIN = os.path.normpath(os.environ["REDLINE_GUARD_PLUGIN_ROOT"])
ROLE_NAME = re.compile(r"(?:redline:)?redline-(.*)", re.S)  # the same prefix the fast path tests

ROLES = {}
for line in os.environ["REDLINE_GUARD_TABLE"].splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    name, groups, prefixes = [part.strip() for part in line.split("|")]
    ROLES[name] = (set(groups.split()), prefixes.split())


def log(decision, reason, command):
    path = os.environ.get("REDLINE_GUARD_LOG")
    if not path:
        return
    try:
        with open(path, "a") as fh:
            fh.write(f"{AGENT or '-'}\t{decision}\t{reason}\t{command}\n".replace("\n", " ") + "\n")
    except OSError:
        pass


def deny(reason, command=""):
    log("deny", reason, command)
    print(f"redline-guard ({ROLE}): {reason}", file=sys.stderr)
    sys.exit(2)


def allow(reason, command):
    """Exit 0 with the hook decision that skips the permission prompt for this vetted call."""
    log("allow", reason, command)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason": f"redline-guard {ROLE}: vetted",
    }}))
    sys.exit(0)


try:
    data = json.load(sys.stdin)
except Exception:
    deny("hook input is not JSON")

AGENT = data.get("agent_type") or ""
match = ROLE_NAME.fullmatch(AGENT)
tool = data.get("tool_name") or ""
# MAIN: not a Redline role (the main session, any other agent), sent here by the bash fast path for
# a Bash call that may be approvable (#50). It gets the plugin's scripts and read-only git by real
# path, writes nothing, and a reason is never a deny: the call is left to the permission prompt.
MAIN = False
if not match:
    if os.environ.get("REDLINE_GUARD_MAIN") == "1" and tool == "Bash":
        MAIN = True
        ROLE = "main"
        GROUPS, PREFIXES = {"main", "git-read"}, []
    else:
        log("inert", "", tool)
        sys.exit(0)
else:
    ROLE = match.group(1)
    if ROLE not in ROLES:
        deny(f"unknown Redline role '{AGENT}'")
    GROUPS, PREFIXES = ROLES[ROLE]


def refuse(reason, command=""):
    """A role is denied; the main session is left to the permission prompt instead."""
    if MAIN:
        log("inert", reason, command)
        sys.exit(0)
    deny(reason, command)


tool_input = data.get("tool_input") or {}
CWD = data.get("cwd") or os.getcwd()


def find_repo(start):
    cur = os.path.abspath(start)
    while True:
        if os.path.exists(os.path.join(cur, ".git")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return os.environ.get("CLAUDE_PROJECT_DIR") or os.path.abspath(start)
        cur = parent


REPO = find_repo(CWD)

# Both spellings of each temp dir: a target under a directory the same command creates
# (mkdir -p /tmp/x && cat > /tmp/x/f) cannot be resolved when the hook runs, so it is
# compared as written (/tmp/...) as well as resolved (/private/tmp/...).
_TMP_RAW = [tempfile.gettempdir(), "/tmp", "/private/tmp", os.environ.get("TMPDIR") or "",
            data.get("scratchpad_dir") or ""]
TMP_DIRS = {f(d) for d in _TMP_RAW if d for f in (os.path.normpath, os.path.realpath)}
# Directories and file patterns no role may write, nor remove or move along with a parent.
PROTECTED_DIRS = [".git/", ".claude/redline/"]
PROTECTED_FILES = [".claude/redline*.json", ".claude/settings*.json",
                   ".claude/agents/redline-*", ".claude/workflows/redline-*", ".claude/skills/redline*"]
# The plugin's own directory, wherever it is installed: a marketplace cache, a local checkout
# loaded in place, a --plugin-dir under a temp directory.
PLUGIN_DIRS = {PLUGIN, os.path.realpath(PLUGIN)}
# The repository is the plugin itself: Redline loaded in place, reviewing its own checkout. Its
# source is then repository content, except the guard and the hook that registers it.
SELF_HOSTED = os.path.realpath(REPO) in {os.path.realpath(p) for p in PLUGIN_DIRS}
SELF_HOSTED_FILES = ["scripts/redline-guard.sh", "hooks/hooks.json"]
if SELF_HOSTED:
    PROTECTED_FILES = PROTECTED_FILES + SELF_HOSTED_FILES
NEVER_WRITES = {"/dev/null", "/dev/stdout", "/dev/stderr", "/dev/tty"}
ENV_OK = {"TMPDIR": os.environ.get("TMPDIR", "/tmp"), "CLAUDE_PROJECT_DIR": os.environ.get("CLAUDE_PROJECT_DIR", REPO)}
REPO_REAL = os.path.realpath(REPO)


# --- Repository ask rules (#49) ---------------------------------------------
# askRules[].when.paths in <repo>/.claude/redline.json: the files a person is always brought in
# for. A write under one is refused for every role. The glob dialect is shared with the workflow
# (globToRegExp in workflows/redline-loop.js) and pinned by the same cases on both sides.

RULE_ID = re.compile(r"[a-z][a-z0-9-]*")


def glob_regex(pattern):
    """The shared dialect: ** spans segments, * and ? stay inside one, a pattern with no slash
    (a trailing one aside) matches at any depth, a leading slash only anchors, a trailing slash
    takes the directory and everything in it. Case-folded, as the protected paths are."""
    p = pattern.casefold()
    anchored = "/" in p.rstrip("/")
    p = p.lstrip("/")
    dir_only = p.endswith("/")
    p = p.rstrip("/")
    out = ""
    i = 0
    while i < len(p):
        c = p[i]
        if p.startswith("**", i):
            if p.startswith("**/", i):
                out += "(?:.*/)?"
                i += 3
                continue
            out += ".*"
            i += 2
            continue
        if c == "*":
            out += "[^/]*"
        elif c == "?":
            out += "[^/]"
        else:
            out += re.escape(c)
        i += 1
    if not anchored:
        out = "(?:.*/)?" + out
    if dir_only:
        out += "(?:/.*)?"
    return re.compile("^" + out + "$")


def glob_root(pattern):
    """The literal leading segments of a pattern (config/project for config/project/**): a write
    to that directory or one above it takes the rule's files along, so it is refused as well.
    Empty when the first segment holds a wildcard."""
    segments = []
    for segment in pattern.casefold().strip("/").split("/"):
        if "*" in segment or "?" in segment:
            break
        segments.append(segment)
    return "/".join(segments)


def rule_fault(rule, ids):
    """Why a rule is malformed, or None. The same wording the skill's precheck and
    redline-setup.sh config use."""
    if not isinstance(rule, dict):
        return "not an object"
    rid = rule.get("id")
    if not isinstance(rid, str) or not RULE_ID.fullmatch(rid):
        return "id must match [a-z][a-z0-9-]*"
    if rid in ids:
        return f"id '{rid}' is not unique"
    ids.add(rid)
    when = rule.get("when")
    if not isinstance(when, dict) or sorted(when.keys()) not in (["paths"], ["prose"]):
        return f"rule '{rid}': when must hold exactly one of paths or prose"
    if "paths" in when:
        paths = when["paths"]
        if not isinstance(paths, list) or not paths or any(not isinstance(p, str) or not p.strip() for p in paths):
            return f"rule '{rid}': paths must be a non-empty list of non-empty strings"
        if any("!" in p or "[" in p for p in paths):
            return f"rule '{rid}': a path pattern may not hold ! or ["
    elif not isinstance(when["prose"], str) or not when["prose"].strip():
        return f"rule '{rid}': prose must be a non-empty string"
    reason = rule.get("reason")
    if not isinstance(reason, str) or not reason.strip() or "\n" in reason.strip():
        return f"rule '{rid}': reason must be one non-empty line"
    return None


def load_ask_rules(repo):
    """(rules, fault): the paths rules as (id, pattern, reason, regex, root), or a fault string
    when the file or its askRules cannot be trusted, which refuses every write (fail closed)."""
    path = os.path.join(repo, ".claude", "redline.json")
    if not os.path.isfile(path):
        return [], None
    try:
        with open(path) as fh:
            config = json.load(fh)
    except Exception:
        return [], ".claude/redline.json is not JSON"
    rules = config.get("askRules") if isinstance(config, dict) else None
    if rules is None:
        return [], None
    if not isinstance(rules, list):
        return [], "askRules is not a list"
    out, ids = [], set()
    for n, rule in enumerate(rules, 1):
        fault = rule_fault(rule, ids)
        if fault:
            return [], f"askRules[{n}]: {fault}"
        if "paths" in rule["when"]:
            for pattern in rule["when"]["paths"]:
                out.append((rule["id"], pattern, rule["reason"].strip(), glob_regex(pattern), glob_root(pattern)))
    return out, None


ASK_RULES, ASK_FAULT = load_ask_rules(REPO)


def ask_rule(raw, absolute, real):
    """A reason when the target is under a repository ask rule, or holds a rule's root."""
    if ASK_FAULT:
        return f"'{raw}': askRules in .claude/redline.json is malformed ({ASK_FAULT}); a person fixes the file before a Redline role writes anything"
    if not ASK_RULES:
        return None
    rels = []
    for path, base in ((absolute, REPO), (real, REPO_REAL)):
        rel = os.path.relpath(path, base).replace(os.sep, "/")
        if rel == ".." or rel.startswith("../"):
            continue
        rels.append(rel.casefold())
    for rid, pattern, reason, regex, root in ASK_RULES:
        for rel in rels:
            if rel != "." and regex.match(rel):
                return f"'{raw}' is under repository ask rule '{rid}' ({pattern}): {reason}; a person makes this change, never a Redline role"
            if root and (rel == "." or rel == root or root.startswith(rel + "/")):
                return f"'{raw}' holds the files of repository ask rule '{rid}' ({pattern}): {reason}; a person makes this change, never a Redline role"
    return None


def expand(path):
    """Expand the few variables we know; anything else stays unresolved."""
    def sub(m):
        name = m.group(1) or m.group(2)
        return ENV_OK.get(name, m.group(0))
    return re.sub(r"\$\{(\w+)\}|\$(\w+)", sub, path)


def under(path, prefix):
    prefix = prefix.rstrip("/") + "/"
    return path == prefix.rstrip("/") or path.startswith(prefix)


def protected(raw, absolute, real):
    """A reason when the target is one of Redline's own files, or a directory holding one.

    Every comparison is case-folded: on a case-insensitive volume (the macOS default)
    Scripts/redline-guard.sh is the guard. Folding only ever refuses more (#5, R1-4)."""
    paths = (absolute.casefold(), real.casefold())
    repo = REPO.casefold()
    for plugin in ([] if SELF_HOSTED else PLUGIN_DIRS):
        plugin = plugin.casefold()
        for path in paths:
            if under(path, plugin):
                return f"'{raw}' is inside the Redline plugin ({PLUGIN}), which no Redline role may write"
            if path != repo and path != "/" and under(plugin, path):
                return f"'{raw}' holds the Redline plugin ({PLUGIN}), which no Redline role may write"
    for prot in PROTECTED_DIRS:
        full = os.path.join(repo, prot.casefold())
        for path in paths:
            if under(path, full):
                return f"'{raw}' is under {prot}, which no Redline role may write"
            if path != repo and under(full.rstrip("/"), path):
                return f"'{raw}' holds {prot}, which no Redline role may write"
    for pattern in PROTECTED_FILES:
        full = os.path.join(repo, pattern.casefold())
        what = "the guard that vets this run" if pattern in SELF_HOSTED_FILES else "Redline's own files"
        for path in paths:
            if fnmatch.fnmatchcase(path, full):
                if pattern in SELF_HOSTED_FILES:
                    return f"'{raw}' is {what} ({pattern}); a person changes it, never a Redline role"
                return f"'{raw}' is one of {what} ({pattern}), which no Redline role may write"
            if path != repo and under(os.path.dirname(full), path):
                return f"'{raw}' holds {what} ({pattern}), which no Redline role may write"
    return None


PATTERN = re.compile(r"[*?\[{]")


def could_reach(rel, pattern):
    """True when a path that starts with rel could match the glob pattern (* and ? only): the two
    are walked together until rel runs out, a * in the pattern admits anything after it."""
    i = 0
    for ch in rel:
        if i >= len(pattern):
            return False
        if pattern[i] == "*":
            return True
        if pattern[i] != "?" and pattern[i] != ch:
            return False
        i += 1
    return True


def reachable(absolute, real):
    """What a pattern could expand to past its literal prefix: the first protected path or ask rule
    a path starting with the prefix could match (scripts/redline-guar reaches
    scripts/redline-guard.sh; .claude/redline.js reaches .claude/redline*.json; config/proj reaches
    craft-config's root), or a rule with no literal root, which any pattern can reach. None when
    the prefix is outside the repository."""
    rels = []
    for path, base in ((absolute, REPO), (real, REPO_REAL)):
        rel = os.path.relpath(path, base).replace(os.sep, "/")
        if rel == ".." or rel.startswith("../"):
            continue
        rels.append("" if rel == "." else rel.casefold())
    for rel in rels:
        for prot in PROTECTED_DIRS:
            if could_reach(rel, prot.casefold()):
                return f"{prot}, which no Redline role may write"
        for pattern in PROTECTED_FILES:
            if could_reach(rel, pattern.casefold()):
                what = "the guard that vets this run" if pattern in SELF_HOSTED_FILES else "Redline's own files"
                return f"{what} ({pattern})"
        for rid, pattern, _reason, _regex, root in ASK_RULES:
            if not root or could_reach(rel, root):
                return f"repository ask rule '{rid}' ({pattern})"
    return None


def writable(raw, cur, literal=False):
    """Return a reason string when raw may not be written by this role, else None.

    A tool's file_path is literal. A Bash operand holding *, ?, [ or { is a pattern the shell
    expands, which the guard cannot check (a pattern that matches nothing when the hook runs can
    match a file an earlier command in the same call creates), so it is refused for every role
    unless its literal prefix is under the temp directory (#53). The prefix still goes through
    protected() and ask_rule() first, so an operand already inside a protected directory or a
    rule's root keeps that reason."""
    if raw in NEVER_WRITES:
        return None
    path = expand(raw)
    if "$" in path or "`" in path:
        return f"write target '{raw}' uses a shell variable or substitution; use a literal path"
    if path.startswith("~"):
        return f"write target '{raw}' is under the home directory"
    pattern = not literal and PATTERN.search(path) is not None
    if pattern:
        path = PATTERN.split(path, 1)[0] or "."
    absolute = os.path.normpath(os.path.join(cur, path))
    # Resolved whether or not the parent exists yet: a link above a missing parent still points
    # into the repository, and resolving only ever refuses more (#49).
    real = os.path.realpath(absolute)
    reason = protected(raw, absolute, real) or ask_rule(raw, absolute, real)
    if reason:
        return reason
    if pattern:
        if "TMP" in PREFIXES and any(under(real, d) or under(absolute, d) for d in TMP_DIRS):
            return None
        reach = reachable(absolute, real)
        return (f"write target '{raw}' holds a wildcard, character class or brace list, which the guard cannot check; "
                f"name the file" + (f"; it could reach {reach}" if reach else ""))
    for prefix in PREFIXES:
        if prefix == "NONE":
            continue
        if prefix == "TMP" and any(under(real, d) or under(absolute, d) for d in TMP_DIRS):
            return None
        if prefix == "REPO" and (under(absolute, REPO) or under(real, REPO)):
            return None
        if prefix not in ("TMP", "REPO") and (under(absolute, os.path.join(REPO, prefix)) or under(real, os.path.join(REPO, prefix))):
            return None
    allowed = ", ".join(PREFIXES) if PREFIXES else "nothing"
    return f"'{raw}' is outside this role's write prefixes ({allowed})"


# --- Write/Edit tools -------------------------------------------------------

if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
    target = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    reason = writable(target, CWD, literal=True) if target else "no file_path in tool input"
    if reason:
        deny(f"{tool} refused: {reason}", target)
    allow(tool, target)

if tool != "Bash":
    sys.exit(0)

command = tool_input.get("command") or ""
if not command.strip():
    sys.exit(0)

# --- Tokenise ----------------------------------------------------------------

HEREDOC = re.compile(r"<<-?\s*(['\"]?)(\w+)\1")
BACKTICKS = "backticks are refused outside single quotes; use $(...) outside quotes"


def runnable_backtick(text):
    """True when text holds a backtick the shell could run, which is any backtick not inside a
    single-quoted string ('a `b` c' is literal; greps of markdown need it). Read as the shell reads
    it: a backslash outside single quotes escapes the next character, so an escaped quote opens
    nothing, and a # that starts a word comments out the rest of its line, quotes in it included.
    A backtick escaped, inside double quotes, after an unterminated single quote, or anywhere in a
    command with a heredoc (whose body may run it) counts."""
    if "`" not in text:
        return False
    if HEREDOC.search(text):
        return True
    i, n, word_start = 0, len(text), True
    while i < n:
        ch = text[i]
        if ch == "'":
            end = text.find("'", i + 1)
            if end == -1:
                return True
            i, word_start = end + 1, False
        elif ch == '"':
            i += 1
            while i < n and text[i] != '"':
                if text[i] == "`" or text[i:i + 2] == "\\`":
                    return True
                i += 2 if text[i] == "\\" else 1
            i, word_start = i + 1, False
        elif ch == "\\":
            if text[i + 1:i + 2] == "`":
                return True
            i, word_start = i + 2, False
        elif ch == "#" and word_start:
            end = text.find("\n", i)
            i = n if end == -1 else end
        elif ch == "`":
            return True
        else:
            word_start = ch in " \t\n;&|()<>"
            i += 1
    return False


if runnable_backtick(command):
    refuse(BACKTICKS, command)


def strip_heredocs(text):
    """Drop heredoc bodies so their lines are not parsed as commands."""
    out, lines, i = [], text.split("\n"), 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        m = HEREDOC.search(line)
        i += 1
        if m:
            delim = m.group(2)
            while i < len(lines) and lines[i].strip() != delim:
                i += 1
            i += 1
    return "\n".join(out)


# No comment syntax: shlex ends a comment only at a newline, which is gone by now, and it starts one
# at a # inside a word (x#y), where the shell does not, so either way it would hide every command
# after the #. A real comment is checked as words instead, which can only refuse more.
text = strip_heredocs(command).replace("\\\n", " ").replace("\n", " ; ")
try:
    lexer = shlex.shlex(text, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    lexer.commenters = ""
    tokens = list(lexer)
except ValueError as exc:
    refuse(f"cannot parse command ({exc})", command)

for tok in tokens:
    if "$(" in tok:
        refuse("command substitution inside a quoted string is refused", command)

SEPARATORS = {";", "&&", "||", "|", "|&", "&", "(", ")", ";;", "{", "}"}
REDIRECT_OUT = {">", ">>", ">|", "&>", "&>>"}
REDIRECT_IN = {"<", "<<", "<<<", "<<-", "<&"}


def split_simple(tokens):
    """Yield (words, write_targets, nested_token_lists) per simple command."""
    cur, writes, nested = [], [], []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok in SEPARATORS:
            if cur or writes or nested:
                yield cur, writes, nested
            cur, writes, nested = [], [], []
            i += 1
            continue
        if tok in REDIRECT_OUT or tok == ">&":
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
            if nxt == "(":  # >(cmd) process substitution
                depth, j, inner = 1, i + 2, []
                while j < len(tokens) and depth:
                    depth += tokens[j] == "("
                    depth -= tokens[j] == ")"
                    if depth:
                        inner.append(tokens[j])
                    j += 1
                nested.append(inner)
                i = j
                continue
            if tok == ">&" and (nxt.isdigit() or nxt == "-"):
                i += 2
                continue
            if cur and cur[-1].isdigit() and len(cur[-1]) == 1:
                cur.pop()  # the fd number of 2>file
            writes.append(nxt)
            i += 2
            continue
        if tok in REDIRECT_IN:
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
            if nxt == "(":
                depth, j, inner = 1, i + 2, []
                while j < len(tokens) and depth:
                    depth += tokens[j] == "("
                    depth -= tokens[j] == ")"
                    if depth:
                        inner.append(tokens[j])
                    j += 1
                nested.append(inner)
                i = j
                continue
            if cur and cur[-1].isdigit() and len(cur[-1]) == 1:
                cur.pop()
            i += 2
            continue
        cur.append(tok)
        i += 1
    if cur or writes or nested:
        yield cur, writes, nested


# --- Classification ------------------------------------------------------------

READ_CMDS = {"cat", "head", "tail", "less", "more", "ls", "find", "grep", "rg", "egrep", "fgrep", "awk", "gawk",
             "wc", "sort", "uniq", "cut", "tr", "diff", "cmp", "file", "stat", "jq", "column", "basename", "dirname",
             "realpath", "readlink", "which", "type", "tree", "du", "df", "date", "printenv", "seq", "nl", "od",
             "strings", "md5", "shasum", "comm", "paste", "fold", "tac", "sed", "php", "git", "composer", "xargs",
             "env", "sleep", "hostname", "uname", "whoami", "id", "tee"}
BUILTINS = {"cd", "export", "set", "unset", "true", "false", ":", "exit", "return", "echo", "printf", "test", "[",
            "pwd", "read", "shift", "local", "declare", "typeset", "wait", "break", "continue", "if", "then",
            "else", "elif", "fi", "for", "do", "done", "while", "until", "case", "esac", "in", "!"}
WRAPPERS = {"time", "nice", "nohup", "command"}
GIT_READ = {"status", "diff", "log", "show", "rev-parse", "ls-files", "blame", "merge-base", "grep", "describe",
            "cat-file", "name-rev", "shortlog", "diff-tree", "rev-list", "symbolic-ref", "ls-tree", "check-ignore",
            "var", "version", "--version"}
GIT_GLOBAL_WITH_ARG = {"-C"}
ARTISAN_READ = {"route:list", "config:show", "about", "db:show", "db:table", "model:show", "schedule:list", "list",
                "help", "env", "--version", "-V", "inspire"}
ARTISAN_NEVER = {"tinker", "db:wipe", "migrate:fresh", "migrate:reset"}
COMPOSER_BUILD = {"check", "fix", "lint", "test", "test:octane", "test:explain", "dump-autoload", "dumpautoload",
                  "validate", "show", "--version"}
VENDOR_BIN = {"pint", "phpstan", "rector", "pest"}
BACKGROUND = {"start", "wait"}
GH_READ = {"pr", "diff", "pr-comments", "issues-search", "review-comments", "has-review", "last-round", "prior-findings", "files", "login", "place", "human-review", "last-human-review", "threads"}
ATTRIBUTION = re.compile(r"co-authored-by|generated with|claude|anthropic|🤖", re.IGNORECASE)
# The path spellings a commit may name without tripping the attribution filter.
PATH_SPELLINGS = re.compile(r"\.claude/|CLAUDE\.md")
ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")


def non_options(args):
    return [a for a in args if not a.startswith("-") or a == "-"]


def script_name(word, cur):
    """The script's name when word resolves to the one copy of a Redline script a role or the main
    session may run (the repository's .claude/redline/checks.sh, the plugin's scripts/redline-gh.sh,
    redline-background.sh, redline-prefs.sh, redline-gate.sh and redline-setup.sh), 'bad-path:<name>'
    for any other file by that name (a copy under /tmp, say), else None."""
    homes = {"checks.sh": os.path.join(REPO, ".claude", "redline")}
    for script in ("redline-gh.sh", "redline-background.sh", "redline-prefs.sh", "redline-gate.sh", "redline-setup.sh"):
        homes[script] = os.path.join(PLUGIN, "scripts")
    for name, home in homes.items():
        if word == name or word.endswith("/" + name):
            wanted = os.path.realpath(os.path.join(home, name))
            actual = os.path.realpath(os.path.normpath(os.path.join(cur, expand(word))))
            return name if actual == wanted else f"bad-path:{name}"
    return None


def vendor_tool(word, cur):
    """The tool's name when word resolves to the repository's own vendor/bin/<tool>, in any
    spelling, 'bad-path:<tool>' for a vendor/bin/<tool> anywhere else, else None."""
    if "/vendor/bin/" not in "/" + word:
        return None
    name = word.rsplit("/", 1)[1]
    wanted = os.path.realpath(os.path.join(REPO, "vendor", "bin", name))
    actual = os.path.realpath(os.path.normpath(os.path.join(cur, expand(word))))
    return name if actual == wanted else f"bad-path:{name}"


def repo_artisan(word, cur):
    """True when word resolves to the repository's own artisan (artisan, ./artisan,
    <repo>/artisan, ../artisan from a subdirectory), False for an artisan anywhere else,
    None when word is not an artisan path at all."""
    if word != "artisan" and not word.endswith("/artisan"):
        return None
    wanted = os.path.realpath(os.path.join(REPO, "artisan"))
    return os.path.realpath(os.path.normpath(os.path.join(cur, expand(word)))) == wanted


WRITERS = {"rm", "mkdir", "touch", "mv", "cp", "tee"}


def sed_in_place(args):
    return any(a == "-i" or a.startswith("-i") and not a.startswith("-in") or a.startswith("--in-place") for a in args) \
        or any(a.startswith("-") and "i" in a[1:] and not a.startswith("--") and a not in ("-n", "-E", "-r", "-e", "-f", "-s", "-u") for a in args)


def check_simple(words, writes, nested, cur):
    """Return (reason_or_None, new_cwd)."""
    for target in writes:
        reason = writable(target, cur)
        if reason:
            return reason, cur
    for inner in nested:
        reason, _ = check_tokens(inner, cur)
        if reason:
            return reason, cur
    if not words:
        return None, cur

    # VAR=value prefixes and transparent wrappers; the names are kept for git (#50)
    assigned = []
    while words and ASSIGN.match(words[0]):
        assigned.append(words[0].split("=", 1)[0])
        words = words[1:]
    if not words:
        return None, cur
    while words and words[0] in WRAPPERS:
        words = words[1:]
    if words and words[0] == "env":
        words = words[1:]
        while words and (ASSIGN.match(words[0]) or words[0].startswith("-")):
            if ASSIGN.match(words[0]):
                assigned.append(words[0].split("=", 1)[0])
            words = words[1:]
    if words and words[0] == "timeout":
        words = words[1:]
        while words and words[0].startswith("-"):
            words = words[1:]
        words = words[1:]  # the duration
    via_xargs = False
    if words and words[0] == "xargs":
        via_xargs = True
        words = words[1:]
        while words and words[0].startswith("-"):
            opt = words.pop(0)
            if opt in ("-n", "-I", "-L", "-P", "-d", "-s", "-E") and words:
                words.pop(0)
        if not words:
            return "xargs without a command", cur
    if not words:
        return None, cur

    cmd, args = words[0], words[1:]

    # A GIT_* variable can name a program (GIT_PAGER, GIT_EXTERNAL_DIFF, GIT_EDITOR) or set any
    # configuration key (GIT_CONFIG_PARAMETERS, GIT_CONFIG_COUNT), so none reaches git (#50).
    if cmd == "git":
        for name in assigned:
            if name.startswith("GIT_") or name == "PAGER":
                return f"a {name} prefix on git is refused for every role; it can name a program or set any configuration key", cur

    # Operands that exist only at run time cannot be checked. A role without the REPO prefix may
    # not write through them at all; with REPO, the implementer's writes stay inside the
    # repository by the same rule as any other path it names.
    if via_xargs and "REPO" not in PREFIXES and (cmd in WRITERS or (cmd == "sed" and sed_in_place(args)) or cmd == "git"):
        return f"xargs supplies the operands of {cmd}, which the guard cannot see; the {ROLE} may not write through it", cur

    if cmd in ("bash", "sh", "zsh"):
        if args[:1] == ["-c"] and len(args) >= 2:
            return check_text(args[1], cur)
        return f"'{cmd}' may only be used as '{cmd} -c <string>'", cur

    if cmd == "cd":
        target = expand(args[0]) if args else REPO
        if "$" in target or target.startswith("~"):
            return "cd to a variable or home path is refused", cur
        return None, os.path.normpath(os.path.join(cur, target))

    if cmd in BUILTINS:
        return None, cur

    if cmd in ("eval", "source", ".", "exec", "sudo", "su", "curl", "wget", "ssh", "scp", "python", "python3",
               "perl", "ruby", "node", "npx", "open", "osascript", "dd", "chmod", "chown", "kill", "pkill", "patch",
               "install", "ln", "truncate", "rmdir", "gh", "brew"):
        return f"'{cmd}' is not available to the {ROLE}", cur

    # Redline's own scripts
    name = script_name(cmd, cur)
    if name:
        if name == "bad-path:checks.sh":
            return f"'{cmd}' is not the repository's .claude/redline/checks.sh", cur
        if name.startswith("bad-path:"):
            return f"'{cmd}' is not the Redline plugin's scripts/{name[len('bad-path:'):]}", cur
        if name == "checks.sh":
            return (None if "checks" in GROUPS or "main" in GROUPS else f"checks.sh is not available to the {ROLE}"), cur
        sub = args[0] if args else ""
        if name == "redline-background.sh":
            if "checks" in GROUPS and sub in BACKGROUND:
                return None, cur
            return f"redline-background.sh {sub or '<none>'} is not available to the {ROLE}", cur
        if name == "redline-gh.sh":
            if "gh-all" in GROUPS or "main" in GROUPS:
                return None, cur
            if "gh-read" in GROUPS and sub in GH_READ:
                return None, cur
            return f"redline-gh.sh {sub or '<none>'} is not available to the {ROLE}", cur
        # The skill's scripts (#50): the main session runs them, never a role, and of redline-gate.sh
        # and redline-setup.sh only the subcommand the skill runs unprompted; the writing ones stay
        # behind the permission prompt, which is the person's confirmation.
        if name == "redline-prefs.sh" and "main" in GROUPS:
            return None, cur
        if name == "redline-gate.sh" and "main" in GROUPS and sub == "check":
            return None, cur
        if name == "redline-setup.sh" and "main" in GROUPS and sub == "version":
            return None, cur
        return f"{name} {sub or '<none>'} is not available to the {ROLE}", cur

    # Writers whose targets are their arguments
    if cmd in ("rm", "mkdir", "touch", "mv", "cp", "tee"):
        if "REPO" not in PREFIXES and all(p in ("NONE",) for p in PREFIXES):
            return f"'{cmd}' writes, and the {ROLE} may not write through Bash", cur
        targets = non_options(args)
        if cmd == "cp":
            targets = targets[-1:] if targets else []
        if cmd == "tee":
            targets = [t for t in targets if t != "-"]
        if cmd == "rm" and any(a.startswith("-") and "r" in a.lstrip("-").lower() for a in args):
            roots = {REPO} | {os.path.normpath(os.path.join(REPO, p)) for p in PREFIXES if p not in ("TMP", "REPO", "NONE")}
            for t in targets:
                absolute = os.path.normpath(os.path.join(cur, expand(t)))
                if t in (".", "./", "*", "/") or absolute in roots:
                    return "recursive rm of the repository, the current directory or an allowed root is refused", cur
        if not targets and cmd != "tee":
            return f"'{cmd}' without a path", cur
        for t in targets:
            reason = writable(t, cur)
            if reason:
                return reason, cur
        return None, cur

    if cmd == "sed":
        if sed_in_place(args):
            files = [a for a in non_options(args) if a != ""]  # '' is BSD sed's empty backup suffix
            if not any(a in ("-e", "--expression", "-f", "--file") for a in args):
                files = files[1:]
            if not files and not via_xargs:
                return "sed -i without a file to edit", cur
            for f in files:
                reason = writable(f, cur)
                if reason:
                    return reason, cur
        return None, cur

    if cmd in ("awk", "gawk") and any(a in ("-i", "--in-place") or a.startswith("-iinplace") for a in args):
        return "awk in-place editing is refused", cur

    if cmd == "find":
        if "-delete" in args:
            return "find -delete is refused", cur
        # The starting points are the operands before the first predicate; {} in an -exec
        # command stands for a path under one of them, so the command is checked once per
        # starting point with {} replaced by it, never as a file literally named {}.
        roots = []
        for a in args:
            if a.startswith("-") or a in ("(", "!", ")"):
                break
            roots.append(a)
        roots = roots or ["."]
        for flag in ("-exec", "-execdir", "-ok", "-okdir"):
            if flag in args:
                i = args.index(flag) + 1
                inner = []
                while i < len(args) and args[i] not in (";", "+", "\\;"):
                    inner.append(args[i])
                    i += 1
                for root in roots:
                    reason, _ = check_tokens([a.replace("{}", root) for a in inner], cur)
                    if reason:
                        return f"find {flag} over {root}: {reason}", cur
        return None, cur

    if cmd == "git":
        return check_git(args, cur), cur

    if cmd == "php":
        return check_php(args, cur), cur

    if cmd == "composer":
        sub = next((a for a in args if not a.startswith("-")), args[0] if args else "")
        if sub in ("test", "test:octane") and ("tests" in GROUPS or "build" in GROUPS):
            return None, cur
        if sub in COMPOSER_BUILD and "build" in GROUPS:
            return None, cur
        if sub in ("show", "validate", "--version") and "read" in GROUPS:
            return None, cur
        return f"composer {sub} is not available to the {ROLE}", cur

    binary = vendor_tool(cmd, cur)
    if binary:
        if binary.startswith("bad-path:"):
            return f"'{cmd}' is not the repository's vendor/bin/{binary[len('bad-path:'):]}", cur
        if binary == "pest" and ("tests" in GROUPS or "build" in GROUPS):
            return None, cur
        if binary in VENDOR_BIN and "build" in GROUPS:
            return None, cur
        return f"vendor/bin/{binary} is not available to the {ROLE}", cur

    if cmd == "npm":
        if args[:1] == ["run"] and "build" in GROUPS:
            return None, cur
        return f"npm {' '.join(args[:1])} is not available to the {ROLE}", cur

    if cmd in READ_CMDS and "read" in GROUPS:
        return None, cur

    return f"'{cmd}' is not on the {ROLE}'s allowlist", cur


def read_flag_refused(rest):
    """The first flag of a read-only git command that writes a file (--output) or runs a program
    (-O/--open-files-in-pager, --ext-diff), or None; pathspecs after -- are not flags (#50)."""
    for a in rest:
        if a == "--":
            return None
        if a == "--output" or a.startswith("--output=") or a.startswith("-O") or a.startswith("--open-files-in-pager") or a == "--ext-diff":
            return a
    return None


def check_git(args, cur):
    args = list(args)
    while args and args[0].startswith("-"):
        opt = args.pop(0)
        # A configuration key can name a program (diff.external, core.pager, core.fsmonitor,
        # gpg.program, filter.*.clean), so -c and --config-env are refused for every role (#50).
        if opt == "-c" or opt.startswith("--config-env"):
            return "git -c is refused for every role; a configuration key can name a program (diff.external, core.pager, core.fsmonitor)"
        if opt.startswith("--exec-path") or opt.startswith("--git-dir") or opt.startswith("--work-tree"):
            return "git --exec-path/--git-dir/--work-tree is refused"
        if opt in GIT_GLOBAL_WITH_ARG and args:
            if opt == "-C":
                cur = os.path.normpath(os.path.join(cur, args[0]))
            args.pop(0)
    if not args:
        return "git without a subcommand"
    sub, rest = args[0], args[1:]

    if sub in GIT_READ and ("read" in GROUPS or "git-read" in GROUPS):
        bad = read_flag_refused(rest)
        if bad:
            return f"git {sub} {bad} is refused for every role; it writes a file or runs a program"
        return None
    if sub == "branch" and "read" in GROUPS:
        if any(a in ("-d", "-D", "-m", "-M", "-c", "-C", "-f", "--delete", "--move", "--copy", "--force", "-u",
                     "--set-upstream-to", "--unset-upstream") for a in rest) or non_options(rest):
            return "git branch may only list"
        return None
    if sub == "remote" and "read" in GROUPS:
        return None if not non_options(rest) or rest[:1] == ["show"] or rest[:1] == ["get-url"] else "git remote may only show"
    if sub == "config" and "read" in GROUPS:
        return None if any(a in ("--get", "-l", "--list", "--get-all", "--get-regexp") for a in rest) else "git config may only read"
    if sub == "tag" and "read" in GROUPS:
        return None if not non_options(rest) or "-l" in rest or "--list" in rest else "git tag may only list"
    if sub == "worktree" and "read" in GROUPS:
        return None if rest[:1] == ["list"] else "git worktree may only list"
    if sub == "stash" and "read" in GROUPS:
        return None if rest[:1] in (["list"], ["show"]) else "git stash may only list or show"

    if sub == "add":
        if "git-add" not in GROUPS:
            return f"git add is not available to the {ROLE}"
        paths = []
        for a in rest:
            if a == "--":
                continue
            if a in ("-A", "--all", "-u", "--update", ".", "./", "*", "-i", "--interactive", "-p", "--patch", "-e", "--edit"):
                return f"git add {a} is refused; stage files by name"
            if a.startswith("-") and a not in ("-N", "--intent-to-add", "-f", "--force", "-v", "--verbose"):
                return f"git add {a} is refused; stage files by name"
            if not a.startswith("-"):
                paths.append(a)
        if not paths:
            return "git add needs file paths"
        for p in paths:
            if "*" in p or "?" in p:
                return f"git add {p} is refused; stage files by name, not by glob"
            reason = writable(p, cur)
            if reason:
                return reason
        return None

    if sub == "commit":
        if "git-commit" not in GROUPS:
            return f"git commit is not available to the {ROLE}"
        message = None
        i = 0
        while i < len(rest):
            a = rest[i]
            if a in ("-a", "--all", "--amend", "--no-verify", "-n", "-i", "--include", "-p", "--patch", "--interactive",
                     "-C", "-c", "--reuse-message", "--reedit-message", "--allow-empty-message"):
                return f"git commit {a} is refused"
            if a in ("-m", "--message") and i + 1 < len(rest):
                message = (message + "\n\n" if message else "") + rest[i + 1]
                i += 2
                continue
            if a.startswith("-m") and len(a) > 2:
                message = (message + "\n\n" if message else "") + a[2:]
            if a.startswith("--message="):
                message = (message + "\n\n" if message else "") + a.split("=", 1)[1]
            if a in ("-F", "--file") and i + 1 < len(rest):
                path = os.path.normpath(os.path.join(cur, expand(rest[i + 1])))
                try:
                    message = open(path).read()
                except OSError:
                    return f"git commit -F {rest[i + 1]}: cannot read the message file"
                i += 2
                continue
            i += 1
        if message is None:
            return "git commit needs -m or -F; the editor is not available"
        if not message.lstrip().startswith("redline:"):
            return "commit message must start with 'redline:'"
        if ATTRIBUTION.search(PATH_SPELLINGS.sub("", message)):
            return "commit message carries an attribution marker (Co-Authored-By, Generated with, a model or vendor name)"
        return None

    if sub == "push":
        if "git-push" not in GROUPS:
            return f"git push is not available to the {ROLE}"
        for a in rest:
            if a in ("-f", "--force", "--force-with-lease", "--force-if-includes", "-d", "--delete", "--mirror",
                     "--all", "--tags", "--prune") or a.startswith("--force") or a.startswith("+"):
                return f"git push {a} is refused"
            if a.startswith("-") and a not in ("-u", "--set-upstream", "-q", "--quiet", "-v", "--verbose", "--no-verify"):
                return f"git push {a} is refused"
            if ":" in a:
                return f"git push refspec {a} is refused; push the branch by name"
        if len(non_options(rest)) > 2:
            return "git push takes at most a remote and one branch"
        return None

    return f"git {sub} is not available to the {ROLE}"


def check_php(args, cur):
    if not args:
        return "php without arguments"
    if args[0] in ("-l", "-v", "--version", "-m", "-i", "--ini") and "read" in GROUPS:
        return None
    if args[0] == "-r":
        return "php -r is refused; reproduce with a scratch Pest test (vendor/bin/pest <file>)"
    artisan = repo_artisan(args[0], cur)
    if artisan is False:
        return f"'{args[0]}' is not the repository's artisan"
    if artisan is None:
        return f"php {args[0]} is not available to the {ROLE}"
    sub = next((a for a in args[1:] if not a.startswith("-")), "")
    if sub in ARTISAN_NEVER:
        return f"php artisan {sub} is refused for every role"
    if sub == "test" and "tests" in GROUPS:
        return None
    if sub in ARTISAN_READ and "read" in GROUPS:
        return None
    if "build" in GROUPS:
        return None
    return f"php artisan {sub or '<none>'} is not available to the {ROLE}"


def check_tokens(tokens, cur):
    for words, writes, nested in split_simple(tokens):
        reason, cur = check_simple(words, writes, nested, cur)
        if reason:
            return reason, cur
    return None, cur


def check_text(text, cur):
    if runnable_backtick(text):
        return BACKTICKS, cur
    try:
        lexer = shlex.shlex(strip_heredocs(text).replace("\n", " ; "), posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        lexer.commenters = ""
        inner = list(lexer)
    except ValueError as exc:
        return f"cannot parse nested command ({exc})", cur
    for tok in inner:
        if "$(" in tok:
            return "command substitution inside a quoted string is refused", cur
    return check_tokens(inner, cur)


reason, _ = check_tokens(tokens, CWD)
if reason:
    refuse(reason, command)
allow("", command)
PY

exec python3 -I -c "$PYTHON" <<<"$input"
