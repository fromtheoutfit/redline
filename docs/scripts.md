# Scripts

Each block below is the script's own header, copied verbatim at version 0.1.1 (the comment lines after the shebang, as the file carries them). The header is the source: a change to a script changes its header first, and this file follows in the same commit. With the plugin installed, `claude plugin list` prints the directory it is read from (`Read from:`), and each script's header is the top of the file there. `redline-guard.sh`'s header is quoted in [guard.md](guard.md); the repository's generated `checks.sh` is described in [contract.md](contract.md).

Every script starts `set -euo pipefail`, writes progress to stderr and exits 2 on a usage error. What a subcommand prints is in its header: most print one JSON object, but `redline-gh.sh diff` prints a unified diff, `pr-comments` and `issues-search` print text, `redline-gate.sh stamp` prints the stamp line, and a subcommand whose exit code is the answer (`redline-gh.sh has-review`) says so. Who may run each one is the guard's table ([guard.md](guard.md)): a role runs only what its command groups name, and the skills run the rest by `${CLAUDE_PLUGIN_ROOT}/scripts/<name>`.

## `redline-gh.sh`

The only door to GitHub. The reviewer, the shaper and the plan approver run its read subcommands (the guard group `gh-read`); the GitHub agent runs every subcommand (`gh-all`); `/redline:redline` runs `pr`, `files`, `login`, `last-round` and `prior-findings` in its precheck. `tests/gh-test.sh` pins the read subcommands and `resolve-threads` against a fake `gh` that serves `tests/gh-fixtures/`.

```text
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
#   prior-findings <n>             every finding Redline's posted rounds list, with its disposition,
#                                  for the next run's known-finding check (#35): [{id, round,
#                                  review_id, category, severity, confidence, file, line, title,
#                                  comment_id, body, reply, carried_from, carried_to, disposition}],
#                                  by round then number, [] when no Redline review exists. A
#                                  finding is a review body line "- **R<n>-<k>** · <category> ·
#                                  <severity> · <confidence> · `<file>:<line>` · <title>" (an
#                                  "Already tracked" line has no such fields and is not one);
#                                  " · needs a decision", " · first reported as R<n>-<k>"
#                                  (carried_from) and " · yours under rule <id>" (a repository ask
#                                  rule, #49) are stripped from the title. comment_id and body
#                                  are the root inline comment opening **<id>** · , 0 and "" for a
#                                  finding in the review body. reply is the newest "Redline round
#                                  N: " reply in that thread, else the issue comment opening
#                                  <!-- redline:<id> --> whose next line is **<id>** · ... · from
#                                  the Redline round <n> review body, as {id, body} with the text
#                                  after the prefix, or null. disposition reads the reply's first
#                                  words: "fixed in" fixed, "mitigated" deferred, "not acted on in
#                                  this run." dropped, "not changed in this round." not-changed,
#                                  "carried forward as R<n>-<k>;" carried (carried_to), "left to
#                                  the author" left (a finding a repository ask rule left to the
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
#                                  hunks of their file's patch moved into the body under "Not
#                                  placed inline", each behind a marker <!-- redline:<finding> -->
#                                  (the id read from the comment body's leading **R1-2**), with a
#                                  `moved` list [{id, path, line, side}]. Nothing is posted
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
```

## `redline-prefs.sh`

The saved launch settings and the run markers in `.claude/redline.local.json`. Only `/redline:redline` runs it; the guard refuses it to every role. `tests/prefs-test.sh` pins the merge rules and every `run check` refusal.

```text
#
# redline-prefs.sh: the saved launch preferences of /redline:redline, one file per person per
# repository at <repoRoot>/.claude/redline.local.json (ignored by git; the guard refuses it for
# every Redline role). It holds four settings: interrupt (the dial), revise (the revise model id),
# maxRounds and scope. The skill calls this script so the merge rules live in one tested place.
#
#   redline-prefs.sh resolve <repoRoot> [--interrupt <word>] [--revise <model>] [--max-rounds <n>] [--scope <word>]
#       Merge: command line over the saved file over the defaults (guided, claude-opus-5-5,
#       redline.json's maxRounds or 3, all). Prints JSON: the saved file (null when absent), the
#       effective settings, where each came from, which fields the skill must ask for (no saved
#       file: every field not on the command line that applies to the run), whether to show the
#       one-question confirm instead (a saved file exists), and the confirm's summary line.
#   redline-prefs.sh save <repoRoot> --interrupt <word> --revise <model> --max-rounds <n> --scope <word>
#       Write what the run uses as the new saved set, except that autopilot and review only are
#       per-run verbs: the file keeps its previous interrupt (or none). Every other key of the
#       file (the run markers under runs) is kept. Prints the file's JSON.
#
# The same file holds, under runs, one marker per PR for a run that stopped (a hand-off, the
# review dial, an error, a run the harness stopped), so the next /redline:redline <pr> can offer
# to resume it, from the session that launched it (#10):
#
#   redline-prefs.sh run save <repoRoot> <pr> --run-id <id> [--session <id>] [--record <file>]
#       Write the marker from the harness's own record of the run: ~/.claude/projects/*/<session>/
#       workflows/<runId>.json (or --record), whose args and result it copies. The session is
#       --session, else CLAUDE_CODE_SESSION_ID (set in every Bash tool subprocess). kind is error,
#       handoff or reviewed from the result's status, or stopped when the record has no result;
#       any other status leaves no marker (exit 2). An error whose resumeFrom is null cannot be
#       resumed: exit 1 with the folders to commit or remove, and no marker. specFolders are the
#       result's, plus the start snapshot's folder, from the result's snapshotStart or, without
#       one (a stopped run has no result), from args.snapshotPath. Prints the entry:
#       {pr, kind, runId, session, record, head, branch, stage, label, attempt, error, round,
#       handoffKind, specFolders, args}.
#   redline-prefs.sh run read <repoRoot> <pr>
#       Prints the entry, or null. Exit 0 either way.
#   redline-prefs.sh run check <repoRoot> <pr> [--plugin <dir>] [--session <id>]
#       Whether the run can be resumed from here, as {ok, reason, line, marker, head, hand, untracked}:
#       the first failing reason wins, in this order: none (no marker), session (another session
#       launched it; the line gives claude --resume <id>), branch (not the run's branch),
#       head-moved (HEAD is not the marker's and not on top of it, the marker's kind is not error
#       and HEAD moved at all, or the commits on top touch a path outside .claude/), plugin (the repository is --plugin's directory and HEAD moved: a
#       plugin fix changes what runs, so start fresh), untracked (an untracked or modified path
#       outside the run's spec folders: the listed ones, and every folder the run's launch stamp
#       names for this PR). Hand commits are accepted only on an error marker, since only an error
#       resume carries them into the workflow. hand lists the commits and paths on top of the marker's
#       head, plus the hand list the marker's own label already carries in its args.resume,
#       which the workflow excuses. Exit 0 ok, 1 refused.
#   redline-prefs.sh run clear <repoRoot> <pr>
#       Removes the entry. Prints {cleared: true|false}.
#
# Interrupt words: autopilot | guided | plan | review | review only (also review-only). Scope
# words: all | correctness. Exit 2 on a bad argument. Needs jq, and git for the run markers.
```

## `redline-gate.sh`

The gate stamp. `/redline:setup` runs `extract` and `stamp`; `/redline:redline` runs `check` first in its precheck, which the guard approves for the main session by real path. No role may run it. `tests/gate-test.sh` pins the parser and the stamp on one synthetic `shape-spec.md` per gate shape seen so far, and its last case checks this repository's own stamp.

```text
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
```

## `redline-setup.sh`

The scriptable parts of `/redline:setup`. The setup skill runs the writing subcommands behind the permission prompt, which is the person's confirmation; `version <repoRoot>`, which writes nothing, is approved for the main session by real path and runs at every launch. No role may run it. `tests/setup-test.sh` pins every subcommand on the fixtures under `tests/setup-fixtures/`, and its last cases regenerate this repository's own `checks.sh` from its `checks.json` and compare.

```text
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
#       side whose lines line up (each anchored line at its own offset) is merged line by line, and a line
#       changed in both differently is a conflict (in any other hunk changed in both, the whole hunk is), numbered under conflicts [{n, base, ours, theirs}] and shown diff3-style in
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
#       missing), and whether <repoRoot> is this plugin and loads in place (#16): a root whose
#       .claude-plugin/plugin.json names the same plugin as this script's own manifest is self-hosted,
#       and since the skill runs this script by CLAUDE_PLUGIN_ROOT, this script's own root is the
#       copy the session loaded; a self-hosted root at another real path is the released copy
#       reviewing a checkout, and the line says to start the session with claude --plugin-dir.
#       Prints {checks, unattended, settings: {missing, stale}, plugin: {self, inPlace, pluginRoot}}
#       (inPlace null unless self), one stderr line per
#       warning, and exits 1 when any part warns; 2 when checks.sh or shape-spec.md is missing,
#       settings.json is not JSON or has a byte-order mark, or
#       <repoRoot>/.claude-plugin/plugin.json is not JSON.
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
```

## `redline-background.sh`

A long gate in the background. The checker and the implementer run `start` and `wait` (the guard group `checks`, beside the repository's `checks.sh`) when the recorded baseline is over 480 seconds or unknown; see "Long gates" in [contract.md](contract.md). `tests/background-test.sh` pins both against a stub `checks.sh`.

```text
#
# redline-background.sh: runs the repository's .claude/redline/checks.sh in the background for a
# Redline role, and hands its result back in waits that fit the Bash tool. A gate longer than the
# tool's 600 s foreground cap cannot run in the foreground; a subagent's background task lives only
# while the agent keeps working; and a long foreground sleep is blocked. So the role runs `start`
# with run_in_background (the harness keeps it alive while the role waits, and stops it when the
# role ends), then runs `wait` until it exits other than 3. The workflow gives both commands,
# verbatim, when the recorded baseline is over 480 s or unknown (#40).
#
#   redline-background.sh start <label> [--baseline | --git-only] [<snapshot>]
#       Runs <toplevel>/.claude/redline/checks.sh, for the repository holding the current
#       directory, with the arguments after <label> and this environment (so REDLINE_OCTANE=1
#       reaches it). Only that script runs; start takes no command. Removes the label's earlier
#       files, writes <label>.started (epoch seconds) and <label>.pid, then keeps checks.sh's
#       stdout in <label>.json, its stderr in <label>.err and, last, its exit code in <label>.exit.
#       Prints {"label", "exit"} and exits with checks.sh's exit code.
#   redline-background.sh wait <label> [--limit <seconds>] [--slice <seconds>]
#       Waits for the run under <label> for at most --slice seconds (default 240: under the Bash
#       tool's 600 s cap and the 300 s floor setup gives the checker's stall window, so no one
#       call is long enough to trip either). When the run has finished, prints its stderr to
#       stderr and its stdout to stdout, as checks.sh printed them, and exits with checks.sh's
#       exit code when that is 0, 1 or 2. --limit bounds the whole run, counted from <label>.started: the workflow passes
#       the checker's stall window, which the repeated waits would otherwise keep from firing.
#       A finished result is read once: the wait that returns it removes the label's files, so a
#       later wait under the label waits for the next start's pid and a returned result is never
#       returned again (#41, R1-2). A run stopped before any wait read it leaves a pid and no exit
#       code; a wait sent before the next start clears them exits 5.
#
# Files live under ${TMPDIR:-/tmp}/redline-background/. A label is letters, digits, dots,
# underscores and hyphens, starting with a letter or digit; the workflow builds it from the launch
# stamp, the PR and the agent's label (2026-10-26-1304-790-baseline).
#
# Environment:
#   TMPDIR                    where the files live; start and wait must see the same one
#   REDLINE_BACKGROUND_POLL   seconds between wait's checks (default 1; the test sets 0.2)
#
# Exit codes of wait, which are an answer:
#   0, 1, 2  checks.sh's own: 0 the gate passed, 1 it failed, 2 a usage error (its reason on
#            stderr, no JSON). wait's own usage errors also exit 2, with a "redline-background:"
#            line on stderr.
#   3        still running after --slice seconds: run the same wait again
#   4        the run has gone on longer than --limit seconds
#   5        no result will come: the run ended without recording one (stopped or killed), no
#            run under the label started, or checks.sh exited with a code other than 0, 1 or 2
#            (a command failing under its set -e, a signal), named on stderr (#41, R1-3)
# start exits with checks.sh's exit code, or 2 for its own usage errors (a bad label, no git
# repository, no executable .claude/redline/checks.sh). Needs jq.
```

## `checks-template.sh`

What every repository's `checks.sh` is generated from, by `redline-setup.sh checks` with the repository's `checks.json`; its `# redline-template: checks-template.sh vN` line is the version a generated file carries. A change below its header is a template change (a minor bump, see [upgrading.md](upgrading.md)). `tests/setup-test.sh` pins the generator against it.

```text
#
# Redline gate template. The normal path is /redline:setup, which writes the repository's
# .claude/redline/checks.json and generates checks.sh from it and this file
# (<plugin>/scripts/redline-setup.sh checks); checks.sh is then regenerated, never hand-edited.
# The fallback is a hand copy: copy it to <repo>/.claude/redline/checks.sh, make it executable,
# and replace each TODO with the runnable part of the repository's own gate (the
# Verification Gate in .claude/commands/agent-os/shape-spec.md, or whatever file it
# points to). Nothing in it should be new policy. The git block and the output contract
# below are Redline's and stay as they are: the workflow reads them.
#
# Every TODO check fails until it is replaced, so an unedited copy never passes the gate.
#
# Usage:
#   checks.sh <snapshot.json>              full run: commands + git block
#   checks.sh --baseline [snapshot.json]   commands only, git block is null
#   checks.sh --git-only <snapshot.json>   git block only, checks is []
#
# Environment:
#   REDLINE_OCTANE=1   set by the workflow when the approved plan touches app/Providers/,
#                      bootstrap/ or config/octane.php; run a long-lived-process suite
#                      here if the repository has one, else ignore it
#
# Snapshot: {"pr", "start_sha", "base_ref", "files": [...], "plan_paths": [...]}.
# Allowed changes are files + plan_paths + agent-os/specs/ + agent-os/standards/ +
# ALWAYS_ALLOWED; anything else that changed since start_sha is unexpected.
#
# Exit 0 when every non-recorded check passed and git.unexpected_files and
# git.uncommitted are both empty, else 1. Usage errors exit 2. See the Redline
# README for the output contract.
#
# The last line of this header is the gate stamp: a hash of the gate's backticked text, written
# by <plugin>/scripts/redline-gate.sh stamp. A launch recomputes it from the gate and refuses to
# run when the two differ, so a gate step added later cannot go unnoticed. After bringing this
# file up to date with a changed gate, restamp it:
# <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
# The line above the stamp names the template version this file was made from; a launch warns
# when the plugin's template is newer.
# redline-template: checks-template.sh v2
# redline-gate: TODO  stamp it: <plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh
```

See also: [contract.md](contract.md) for `checks.sh`, [guard.md](guard.md) for who runs what, [running.md](running.md) for where each script is called in a run.
