# Standards for PR #43 review round 1

Shaped by Redline in unattended mode. The following standards apply to this work, as they read at shaping time on the PR branch. Where a standard names a model or the coding harness by product name, this copy puts a bracketed description in its place; the standard files themselves are unchanged.

---

## workflow/agents

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Frontmatter carries `model` (overridden per call from `.claude/redline.json`) and `disallowedTools` as whole tools. Per-command limits are the guard's job: `Bash(git push *)` in `disallowedTools` would remove all of Bash, and a plugin agent's own `hooks` are ignored
- A prompt opens with "This is a Redline agent run on pull request #N" and names the plugin's README path for the git rules. The agent file holds the role; the workflow's prompt holds the round's inputs
- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text. The checker's pass or fail comes from `checks.sh`'s JSON: each check's `exit` against the baseline, the exit code and the git block (`unexpected_files`, `uncommitted`, `commits`), never `ok` and never the checker's error text (#37, R1-3)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36)
- A human review pass (`/redline:redline-revise <pr> review <selector>`) sorts a teammate's comment into `fix` (theirs: the shaper returns `decidedBy: "reviewer"` and the workflow maps it to their login), `ask` (the author's) or `none` (asks for nothing), never `defer`: nothing a teammate asked for is deferred by Redline on its own, and the author chooses a mitigation at the hand-off if they want one. The workflow refuses the other pass's values at `shape`. Every label, reply file, title and log line of a pass comes from one descriptor (`passOf` in `workflows/redline-loop.js`), so a Redline round's prompts stay byte-identical to what they were before human passes existed, and the loop test proves it (#36)
- A role's prompt names only the commands the guard allows it, in the exact spelling the guard accepts (`<plugin>/scripts/redline-gh.sh diff <pr>`, `vendor/bin/pest <file>`)
- A message the run shows the person names a plugin file by its absolute path from `pluginRoot`, as a prompt names a plugin script (`${pluginRoot}/scripts/redline-gh.sh`): the person reads it from the repository under review, where a path relative to the plugin does not exist (#37, R1-2)
- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)
- [Which model each role runs on: the lighter model for the roles that move files and post (github, checker), the stronger one for the ones that read code (reviewer, plan approver); the revise model is picked at launch and saved per person]
- A role that finds a problem with its own instructions (a command the guard refuses, a file that does not exist) reports it in its JSON rather than working around it
- A degraded result is data, not an error: the GitHub agent returns a posted review with no inline comment as `posted` true with every finding in `movedToBody`, the workflow records a warning, and `error` is reserved for an operation that failed. The workflow does not take an agent's `error` on trust in either direction: an `error` on a review that is posted, has a review id and accounts for every finding (inline or in `movedToBody`) is recorded as a warning and the run continues, while one on a result that fails that check still stops the run (#33: a review with every finding in the body ended the run at `post`; #34, R1-8; #9)
- An agent that could not read what it was asked to relay returns a distinct status (the checker's `result_unreadable`, with a reason from a fixed set) and whatever it did get, never a partial object that looks like a failing result. The workflow stops on that status, and on any result the implementer cannot change (no result, exit 2, no git block), naming the cause and the fix; it sends to repair only failing checks and git-block findings. The checker's `error` is text and never a verdict input: the verdict comes from each check's `exit` against the baseline, the git block and the gate's exit code, and the text is a warning on a round that passes (a round whose only failing checks were failing at baseline included) or detail added to a failure the data already established; `""`, `''` and `null` as its text are empty (#9; #34 round 2; #37, R1-3). A usage error (exit 2) prints no JSON, so the checker's instructions and `stopReason()` test it before the unreadable status it would otherwise fall under: a specific case comes before the general rule, in the agent's steps and in the workflow's check order (#37, R1-1). Two causes with two different fixes are two reasons, since the message is what the person acts on: a foreground run the Bash tool moved to the background is `backgrounded` (re-record the baseline), not `spilled` (cap the output) (#40)
- A role never ends its turn to wait on a background task: a subagent's background task is killed when the agent gives its final response, and [the coding harness] blocks a long foreground `sleep`. A gate the recorded baseline says will not fit in one foreground Bash call (over 480 s of `args.baselineSeconds`, or none recorded) runs through `redline-background.sh`: `start` with `run_in_background`, then `wait` in the foreground, again while it exits 3, each call under the tool's 600 s cap and the stall window. The stall watchdog restarts only a silent agent and every wait is activity, so the wait's own `--limit` (the stall window in seconds) is what bounds a hung gate (#40)
- A check that something was already posted looks for text only that post carries. `redline-gh.sh pr-comments` prints review bodies and issue comments together, so a body finding's marker, which the review body also holds, proves nothing; the reply's own `from the Redline round N review body` line does (#34, R1-1)
- A reply names what it answers, in a line only that reply carries: a human review pass's thread reply ends with a hidden `<!-- redline:answers <ids> -->` listing its findings' comment ids, and `redline-gh.sh human-review` counts a comment as answered only when a Redline reply in its thread names it. A Redline reply without the line (a Redline round's, or a human-pass reply posted before the line existed) answers every comment before it in its thread, the fallback that keeps older replies valid. Counting by thread alone lost a second teammate's comment and a follow-up left in a shared thread (#38, R1-1)
- An answered review body is found the same way: a human review pass's body reply is an issue comment whose header line names the review (`**H<n>-<k>** · from review <id> by @<login>`), and `redline-gh.sh human-review` reads the PR's issue comments back and never takes a body whose review such a comment names, so a repeat pass over an answered review stops with nothing to revise. A pass still takes one body, the newest of the selection's that is not yet answered, so an older note comes up on the next pass (#38, R1-3)
- A reply's route comes from whether a review is on GitHub, never from a missing thread id alone: a thread id replies in the thread, a body finding of a posted review gets an issue comment behind its marker, and a dry run or an unposted review writes the reply file and posts nothing (#34, R1-7). A dry run routes every reply file-only whatever threads exist, since a teammate's threads are real even then (#36)
- A thread gets one reply per pass. In a human review pass two open comments of one thread (a teammate's comment and their own follow-up) are two findings with one thread root, so their replies merge into one that opens with the pass's title and gives each finding's outcome on its own `**H<n>-<k>**:` line; the GitHub agent never replies twice in one thread (#38, R1-4)
- A count a skill or prompt needs comes from a command that prints the number (`git diff --shortstat`, `jq length`), never from counting printed lines by eye (#34, R1-5)

---

## testing/tests

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/guard-test.sh` over `tests/guard-cases.tsv`: every row is the hook input [the coding harness] would send (`agent_type`, tool, command or path) and the decision expected. A `# @cwd PLUGIN` line sends the rows after it from the checkout, where the repository is the plugin. About 60 ms a row; 350 rows on 2026-10-21
- `node tests/loop-test.mjs`: `workflows/redline-loop.js` under scripted `agent()` and `parallel()`; it asserts which agents ran, in what order, with what prompt text, and what the script returned. No model, no GitHub, no repository. Its human-pass scenario proves the H ids, the reviewer and the author as owners, the final nit pass as a Redline round and the summary comment in place of the handoff (#36)
- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1)
- A loop-test scenario scripts the checker's result shape per call (a passing gate with a stray `error`, a failing gate, an unreadable result, a baseline that cannot be read), as it scripts the reviewer's findings, so the stop and the repair paths are both asserted (#9)
- `tests/prefs-test.sh`: the merge rules of `scripts/redline-prefs.sh`, in a throwaway repository under the temp directory
- `tests/gate-test.sh` over `tests/gate-fixtures/`: the gate parser and the stamp of `scripts/redline-gate.sh`, on one synthetic `shape-spec.md` per gate shape seen so far, mutated with `sed` and `awk` in the temp directory; the fixture hashes are pinned inline, and the last case checks this checkout's own stamp (#6)
- `tests/setup-test.sh` over `tests/setup-fixtures/`: the subcommands of `scripts/redline-setup.sh`, on a settings file with other keys, a bare `shape-spec.md` and a Laravel-shaped `checks.json`, in the temp directory; its last cases regenerate this checkout's own `checks.sh` from its committed `.claude/redline/checks.json`, stamp it and compare, and prove a regenerate over the committed file is a no-op (#6)
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) and the human-review ingest (`human-review`, `last-human-review`, on a PR with a teammate's submitted review, their single comment, their reply inside a Redline thread and the author's hand reply; #36; a thread two teammates share, under a Redline reply that names the one comment it answered; #38, R1-1; a review body a Redline human review comment answered, beside an older open one and a teammate's comment that quotes the header without the marker; #38, R1-3), against a fake `gh` first on PATH that serves the fixtures by endpoint (an array of pages for `--paginate --slurp`, a `--jq` filter applied with the real jq), refuses `gh pr diff` as GitHub does over 300 files, refuses every write, and plays an older gh that rejects `--slurp`; nothing reaches GitHub (#33)
- `tests/background-test.sh`: `start` and `wait` of `scripts/redline-background.sh` against a stub `checks.sh` in a throwaway repository with its own `TMPDIR`: results passed through as printed (exit 0, 1 and 2), still running, past the limit, a run that died or never started, a rerun under the same label with its wait sent at once, a result read once (#41, R1-2), a gate exit outside 0, 1 and 2 reported as no result (#41, R1-3); `REDLINE_BACKGROUND_POLL` shortens the waits (#40)
- A harness that polls for a file the script under test writes bounds the poll (`within <seconds> <test>`), so a red run, where the script is missing, fails the case instead of hanging the table (#40). A harness never waits for a precondition the role cannot wait for: `background-test.sh` waited for the old result to vanish before calling `wait`, which hid the race the role's back-to-back calls hit (#41, R1-2)
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

## workflow/replay

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- A plan approval is keyed by the pass, not by a bare round number: `passOf(record).planKey` is a Redline round's number, or `h<n>` for a human review pass, since a human pass and its final nit pass can carry the same number (#38, R1-5)
- The skill relaunches with byte-identical `args` plus only what the stop asked for, and `resumeFromRunId` set to the run id it recorded at launch. A run the harness stopped is relaunched the same way with nothing added
- A prompt names its inputs by path (`<specFolder>/redline/round-1-findings.json`), not by content, wherever the content can change between launches
- The GitHub agent never posts a round-N review when one already exists on the PR (`redline-gh.sh has-review`), so a fresh run after a lost session cannot double-post
- The first round number enters through `args.firstRound`: the skill reads the highest posted round with `redline-gh.sh last-round` before the launch and passes the next one, and the workflow never asks GitHub for it, since the answer changes as soon as the run posts (#33; #10, round numbering). A human review pass's number enters the same way, through `args.revise.n` from `redline-gh.sh last-human-review`, with the ingested comments as `args.revise.findings` (#36)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
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
