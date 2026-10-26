# Standards for PR #38 review round 2

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time (2026-10-26).

- **Full text:** `scripts/bash-conventions`, the target of the proposed retrospective edit, and the three process and prompt standards.
- **Excerpts:** `testing/tests` and `workflow/agents`. Each excerpt carries only the bullets that bear on this round and says so. The source files under `agent-os/standards/` are the full text.

---

## scripts/bash-conventions

# Bash scripts

Every script under `scripts/` is its own documentation and talks to the workflow in JSON.

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table
- A script a workflow reads emits exactly one JSON object on stdout and everything else on stderr: `checks.sh` logs through `log()` to stderr and prints the envelope last; `redline-prefs.sh resolve` and the read subcommands of `redline-gh.sh` print JSON and nothing else
- `bash -n` reads its first file and treats the rest as arguments; check several with `ls <glob> | xargs -n1 bash -n` (#5, R1-3)
- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header
- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. The README quotes from it rather than restating it. A field added to `checks.sh`'s JSON, or a limit changed in it (`run_check` in `scripts/checks-template.sh`), updates the README's output contract in the same change, and a flag that reports a cut is set by every limit that can cut (#7, R1-14). `checks.sh`'s whole JSON stays bounded however many checks fail: the failing checks share one output budget, split evenly among them in a final pass after every check has run, never consumed in run order, because the checker may not Read a result that spills to a file (#7, R1-13)
- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling
- A script only a skill calls (`redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`) needs no guard group: the guard's default deny refuses it to every role, and `tests/guard-cases.tsv` rows pin it as the skill's (#6); when one of its subcommands is reserved for a person, its rule in the shared allow list (`templates/settings.allow.json`, and the repository's `.claude/settings.json`) names only the subcommand the skill runs unprompted (`Bash(/*/scripts/redline-gate.sh check *)`), so the reserved one stays behind the permission prompt (#7, R1-9); `redline-setup.sh`'s writing subcommands have no allow-list rule, and the permission prompt is the person's confirmation (#6), while `version`, which writes nothing and which `/redline:redline`'s precheck runs at every launch, has the one narrow rule, `Bash(/*/scripts/redline-setup.sh version *)`, on the pattern of `redline-gate.sh check`'s (#12, R1-8)
- A generator that writes a file from a template (`redline-setup.sh checks` from `checks-template.sh`) splices by anchor lines and exits 1 naming a missing one, so the template and the generator cannot drift apart silently, and its output is deterministic: the same input gives the same bytes, and nothing is written when they are unchanged (#6). It validates every input field it writes, not only the commands: a field that lands in a comment is a single line, and one that lands inside quotes holds no character that would end or expand them, so a bad `checks.json` exits 2 rather than writing a `checks.sh` that runs a stray line (#12, R1-6)
- A script that edits a person's file (`.gitignore`, `shape-spec.md`, `settings.json`) preserves the file's line endings and a byte-order mark (`settings.json` refuses a byte-order mark instead, exit 2, as its header says), writes only when the bytes change and reports `changed: false` otherwise, so a rerun can say nothing drifted; a JSON file is compared with `jq -S`, since a CLI that rewrites it (`claude plugin install`) reorders keys and that is not drift (#6)
- A merge into a person's JSON file keeps every value already there, adds only what is missing, and reports each kept value that differs from the template (`conflicts`) rather than overwriting it (#12, R1-3, R1-4); every subcommand that writes takes `--dry-run`, which prints the same JSON with `written: false` and creates nothing, not even the target's directory (#12, R1-2)
- A rerun over a file the script wrote earlier changes only the values the script derives from its inputs (`config` updates `checker` and `checkerStallMs` in place, keeping the file's formatting) and keeps every other value as the person's, the ones the person chose at setup included (`reviewer`), listing each that differs from the template under `differs` without changing it; `--force` is the full reset to the template (#12, R1-5)
- Python inside a script is `python3 -I -c "$PYTHON"` with the standard library only, fed on stdin; it writes no file beside the script
- A path the script receives is made absolute once (`cd "$(dirname "$path")" && pwd`) and used as is; the repository is `git rev-parse --show-toplevel`, never a walk from `$PWD`
- A path compared with `git rev-parse --show-toplevel` is made physical first (`pwd -P`): git prints the physical path, and on macOS `/var` is `/private/var`, so a logical path never matches its prefix (#6)
- A header printed by `-h|--help` is printed with `sed -n '2,/^$/p'`, never a numeric range, which rots on every header edit (#6)
- A script that chooses which part of a file to hash refuses when more than one part qualifies, naming each by line, rather than taking the first: a silent switch moves the hash onto the wrong text and every later check passes against it (#7, R1-6)
- Never print a token, a header or an environment dump; `redline-gh.sh` leaves authentication to `gh`
- `jq` reads and writes every JSON value; no hand-built JSON strings in bash
- A JSON value that grows with the pull request (the anchor positions of `place`, megabytes on a 336-file PR) reaches `jq` through `--slurpfile` or `--rawfile` from a temp file, never `--argjson`, which puts it on the command line and fails with "Argument list too long" (#33)
- `redline-gh.sh` never calls `gh pr diff` or `gh pr view --json files`: the first refuses a PR over 300 files, the second stops at 100, so the paginated files endpoint (`gh api --paginate --slurp`, gh 2.48.0 or newer, which the script names when an older gh rejects the flag) is the one source of the file list, the diff and the anchor positions (#33)
- A read subcommand whose answer is a number (`last-round`) prints it as a bare JSON number, `0` for none; one whose answer is yes or no (`has-review`) uses the exit code
- A GitHub login a selector names is matched case-folded (`ascii_downcase` on both sides of the comparison), since GitHub treats logins case-insensitively, and a skill takes the login it writes as an owner from the script's output, never from the text as typed (#38, R1-2)

**How it applies.** The header bullet (line 9 of the source, the fifth bullet) says the README quotes the header rather than restating it, so the new wording follows `scripts/redline-gh.sh:32-41`. The proposed retrospective bullet goes right after it.

---

## testing/tests (excerpt)

# Tests

Six harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) and the human-review ingest (`human-review`, `last-human-review`, on a PR with a teammate's submitted review, their single comment, their reply inside a Redline thread and the author's hand reply; #36; a thread two teammates share, under a Redline reply that names the one comment it answered; #38, R1-1; a review body a Redline human review comment answered, beside an older open one and a teammate's comment that quotes the header without the marker; #38, R1-3), against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write, and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix

These are source lines 12, 14 and 18, under the file's heading and opening line.

**How it applies.** The "tested surface" and "red before green" bullets apply to a surface a harness reads. No harness reads `README.md`. The gh harness already pins the behaviour the paragraph describes, through its #38, R1-3 cases. So this round adds no case and has no red run. The gate still runs in full, and a grep count in the plan pins the neighbour that must not change (the table row at `README.md:288`).

---

## workflow/agents (excerpt)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36)
- An answered review body is found the same way: a human review pass's body reply is an issue comment whose header line names the review (`**H<n>-<k>** · from review <id> by @<login>`), and `redline-gh.sh human-review` reads the PR's issue comments back and never takes a body whose review such a comment names, so a repeat pass over an answered review stops with nothing to revise. A pass still takes one body, the newest of the selection's that is not yet answered, so an older note comes up on the next pass (#38, R1-3)

These are source lines 8, 9 and 20, under the file's heading and opening line.

**How it applies.** Every decision in `shape.md` names its owner. The "answered review body" bullet is the rule the README paragraph now summarises for the person.

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 9 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

**How it applies.** One proposed bullet for `scripts/bash-conventions.md`, applied in its own commit after approval. The file keeps its one heading, and `index.yml` is unchanged because no standard file is added.

---

## process/internal-notes

# Internal notes

This is the public repository: it carries the tool and its operating documentation, never the design record.

- Step notes, spike notes, API notes and the design document live in the private sibling repository `redline-internal` (`DESIGN.md`, `docs/`). A spec here may cite one by file name; it never copies the text in
- `README.md` is the only long-form document here: what an agent or a teammate needs while a run is going (install, settings, the commit rules, `checks.sh`, `redline-gh.sh`, the snapshot). A rationale goes to the internal repository; a rule goes to a standard
- Seed PRs and their answer keys live outside this repository, so a reviewer cannot read the answers
- `agent-os/specs/` holds the specs of changes to this repository, including the rounds Redline runs on itself. They are public and carry no attribution and no private detail (no token, no cost figure, no person's name beyond a GitHub login where a decision names its owner)

**How it applies.** The README paragraph stays a description of behaviour, with no rationale. This folder carries no private detail.

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)

**How it applies.** The R2-1 commit message and the retrospective commit carry the `redline:` prefix and no model or vendor name. That is also why this file carries excerpts of `testing/tests` and `workflow/agents`: their other bullets name a model and a product.
