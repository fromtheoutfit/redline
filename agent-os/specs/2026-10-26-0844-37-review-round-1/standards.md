# Standards for PR #37 review round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time (the PR's head, `71c2e17`).

---

## workflow/agents

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Frontmatter carries `model` (overridden per call from `.claude/redline.json`) and `disallowedTools` as whole tools. Per-command limits are the guard's job: `Bash(git push *)` in `disallowedTools` would remove all of Bash, and a plugin agent's own `hooks` are ignored
- A prompt opens with "This is a Redline agent run on pull request #N" and names the plugin's README path for the git rules. The agent file holds the role; the workflow's prompt holds the round's inputs
- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text. The checker's pass or fail comes from `checks.sh`'s JSON (`ok`, `unexpected_files`, `uncommitted`)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), or `decided by: redline (autopilot)`
- A role's prompt names only the commands the guard allows it, in the exact spelling the guard accepts (`<plugin>/scripts/redline-gh.sh diff <pr>`, `vendor/bin/pest <file>`)
- Haiku for the roles that move files and post (github, checker); Opus for the ones that read code (reviewer, plan approver); the revise model is picked at launch and saved per person
- A role that finds a problem with its own instructions (a command the guard refuses, a file that does not exist) reports it in its JSON rather than working around it
- A degraded result is data, not an error: the GitHub agent returns a posted review with no inline comment as `posted` true with every finding in `movedToBody`, the workflow records a warning, and `error` is reserved for an operation that failed. The workflow does not take an agent's `error` on trust in either direction: an `error` on a review that is posted, has a review id and accounts for every finding (inline or in `movedToBody`) is recorded as a warning and the run continues, while one on a result that fails that check still stops the run (#33: a review with every finding in the body ended the run at `post`; #34, R1-8; #9)
- An agent that could not read what it was asked to relay returns a distinct status (the checker's `result_unreadable`, with a reason from a fixed set) and whatever it did get, never a partial object that looks like a failing result. The workflow stops on that status, and on any result the implementer cannot change (no result, exit 2, no git block), naming the cause and the fix; it sends to repair only failing checks and git-block findings. The checker's `error` is text: a warning on a passing gate, part of the reason on a failing one, and `""`, `''` and `null` as its text are empty (#9; #34 round 2)
- A check that something was already posted looks for text only that post carries. `redline-gh.sh pr-comments` prints review bodies and issue comments together, so a body finding's marker, which the review body also holds, proves nothing; the reply's own `from the Redline round N review body` line does (#34, R1-1)
- A reply's route comes from whether a review is on GitHub, never from a missing thread id alone: a thread id replies in the thread, a body finding of a posted review gets an issue comment behind its marker, and a dry run or an unposted review writes the reply file and posts nothing (#34, R1-7)
- A count a skill or prompt needs comes from a command that prints the number (`git diff --shortstat`, `jq length`), never from counting printed lines by eye (#34, R1-5)

---

## testing/tests

# Tests

Six harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input Claude Code would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 350 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7)
- A loop-test scenario scripts the checker's result shape per call (a passing gate with a stray `error`, a failing gate, an unreadable result, a baseline that cannot be read), as it scripts the reviewer's findings, so the stop and the repair paths are both asserted (#9)
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- `tests/gate-test.sh` over `tests/gate-fixtures/`: the gate parser and the stamp of `scripts/redline-gate.sh`, on one synthetic `shape-spec.md` per gate shape seen so far, mutated with `sed` and `awk` in the temp directory; the fixture hashes are pinned inline, and the last case checks this checkout's own stamp (#6)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6)
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`), against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write, and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33)
- A fixture is made large enough to hit the limit it guards: the gh harness's 150 small files passed while Losers League #778 (336 files, a 1.8 MB diff) overflowed the command line, so it also carries a 60,000-line patch (#33)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)
- `.claude/redline/checks.sh` carries the gate stamp (`# redline-gate:`); a change to the backticked text of the gate list in `shape-spec.md`, or to how `scripts/redline-gate.sh` computes the hash or writes the stamp line, restamps it in the same commit, and the gate test's last case proves it (#6; #7, R1-1). `checks.sh` is generated: a change to a check edits `.claude/redline/checks.json` and regenerates with `scripts/redline-setup.sh checks .claude/redline/checks.json .claude/redline/checks.sh` in the same commit, never a hand edit, and the setup test's last cases prove the two agree (#6)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix
- The tests write only under the temp directory and `~/.cache/redline/`, never into the checkout; a fixture copy is changed with `sed ... > <copy>` (or `awk`) in the temp directory, never `sed -i`, whose argument differs between BSD and GNU sed (#12, R1-9)
- A stand-in checkout (a copy of the working tree made to prove a rerun or a fresh setup) goes outside the temp directory: the guard's `TMP` prefix lets every role write there, so the guard test's write rows show false allows from a checkout under it (#6)
- The gate records its baseline time in `.claude/redline/checks.sh`'s header; a test that doubles it says why in its own header

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

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
