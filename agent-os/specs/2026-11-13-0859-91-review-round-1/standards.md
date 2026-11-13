# Standards for PR #91 Review Round 1

The following standards apply to this work. Each is copied as it reads at `1c96b8c`, before this round's retrospective: the whole file where it is short, otherwise the bullets the round applies, as earlier review rounds did.

---

## workflow/replay (whole file)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- Nothing before a stopping point reads the clock: the launch timestamp is `args.launchedAt`, the spec folder name is derived from it, and `Date.now()` and `new Date()` do not appear in `workflows/redline-loop.js`
- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them
- A plan approval is keyed by the pass, not by a bare round number: `passOf(record).planKey` is a Redline round's number, or `h<n>` for a human review pass, since a human pass and its final nit pass can carry the same number (#38, R1-5)
- The skill relaunches with byte-identical `args` plus only what the stop asked for, and `resumeFromRunId` set to the run id it recorded at launch. A run the harness stopped is relaunched the same way with nothing added
- A prompt names its inputs by path (`<specFolder>/redline/round-1-findings.json`), not by content, wherever the content can change between launches
- The GitHub agent never posts a round-N review when one already exists on the PR (`redline-gh.sh has-review`), so a fresh run after a lost session cannot double-post
- The first round number enters through `args.firstRound`: the skill reads the highest posted round with `redline-gh.sh last-round` before the launch and passes the next one, and the workflow never asks GitHub for it, since the answer changes as soon as the run posts (#33; #10, round numbering). A human review pass's number enters the same way, through `args.revise.n` from `redline-gh.sh last-human-review`, with the ingested comments as `args.revise.findings` (#36)
- The findings of the PR's earlier Redline rounds and their dispositions enter through `args.priorFindings`: the skill reads them with `redline-gh.sh prior-findings` after `last-round` and passes the list, and the workflow never reads the threads itself, since the run's own carried-forward replies change them (#35)
- Finish asks GitHub for state that changes as the run posts in two places, the read of the highest posted round (#81) and the thread sweep (which threads are open, and who spoke last in them, #39); both sit after every stopping point, so no prompt a relaunch replays depends on either
- A per-repository list the prompts need (`askRules`, #49) enters through `args` at launch, read by the skill from `.claude/redline.json`, and is injected by appending to an existing interpolation, empty when there is none, so a repository without one keeps byte-identical prompts; the loop test proves it by comparing every prompt of a run with no key against one with `[]`
- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR
- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. A hand commit's paths join `approvedPaths` at that label, never at startup, so the cached snapshot prompt stays byte-identical (#10)
- On an interactive relaunch the harness relays the person's last typed message to every agent with precedence over its task; an `AskUserQuestion` pick is not relayed and a headless session relays nothing. The skill relaunches only from `relaunch` typed alone or a line holding only a Redline command, a namespaced form (`/redline:redline`, `/redline:redline-review`, `/redline:redline-revise`) or a short alias (`/redline`, `/redline-revise`) a repository's `.claude/commands/` provides, and `RUN_LINE` names both lines and every form (#60, #44; #63, R1-4)
- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)
- What changed since launch enters as `args.drift` on a relaunch and is read only at startup and at Finish; the loop test proves every prompt before Finish equals the run without it. A run never finishes from a round below the highest posted: that stop is not resumable (#81)

Applied: line 8 and line 17 are the evidence that an error or stopped resume keeps the marker's args (`shape.md`, Unattended answers 1 and 2). Line 20 is the bullet the retrospective's item 1 rewrites.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- (line 23) A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause: ... (#86, R4-2); and a change that widens such a parse pins the form it still refuses beside the one it now accepts: ... (#86, R5-2)
- (line 24) A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- (line 25, its second sentence) A check's name states only what it asserts: #85's result check was named for the round record keeping the dropped entries and the result keeping counts only, asserted neither, and the result keeps the accounting by design, so a change to either stayed green under a name that said otherwise (#86, R2-2)
- (line 28) A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

Applied: the error and stopped markers each turn on one clause of the `held` condition and are red before the fix; the hand-off marker (existing case) and the reviewed marker (new) are the neighbouring decision. The loop checks require a non-empty prefix, a first changed index above 0 and the agent file in the posted comment, and are shown red by a temporary mutation.

---

## scripts/bash-conventions (excerpt: the bullets this round applies)

# Bash scripts

- (line 10, its first sentences) The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). ...
- (line 11) A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: ... (#38, R2-1)
- (line 13, its first sentence) A script only a skill calls (`redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`) needs no guard group: the guard's default deny refuses it to every role, and `tests/guard-cases.tsv` rows pin it as the skill's (#6); ...
- (line 21) A jq program that holds a quote goes in a quoted heredoc (`prog="$(cat <<'JQ' ... JQ)"`, then `jq "$prog"`), never in a bash single-quoted string: `ask_rules_fault` first wrote `'\($r.id)'` inside `jq -r '...'`, which ended the bash string at the first quote and failed `bash -n` (#49)
- (line 28) `jq` reads and writes every JSON value; no hand-built JSON strings in bash
- (line 29) A JSON value that grows with the pull request (the anchor positions of `place`, megabytes on a 336-file PR) reaches `jq` through `--slurpfile` or `--rawfile` from a temp file, never `--argjson`, which puts it on the command line and fails with "Argument list too long" (#33)

Applied: the header and its `docs/scripts.md` copy change together; every description of the printed `drift` was searched for (`shape.md`, Decision 3); the `held` program holds no single quote; only the small held list goes through `--argjson`, never the marker entry. `run drift` is no new subcommand, so no guard group or row changes. Line 13 is where the retrospective's item 2 adds its bullet.

---

## process/docs-gate (excerpt: the bullets this round applies)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- (line 5) Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- (line 16) A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (excerpt: the first bullet)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## scripts/guard (excerpt: line 6)

# The guard

- Default deny: a command the classifier cannot place is refused. `bash` only as `bash -c <string>`, checked recursively; interpreters (`python3`, `node`, `php -r`), `gh`, `curl`, `eval`, `source` and `sudo` are refused for every role. ...

Applied to the plan: every command given to the implementer is a plain pipeline, with no `$`, no backticks outside single quotes, no process substitution and no interpreter, and the harnesses run only through `.claude/redline/checks.sh`.

---

## prompts/attribution (excerpt)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. ...

---

## process/standards-retrospective

Applied through gate step 12 as the unattended section's point 8 states it: the edits are proposed in `shape.md`, approved by the standards approver, and applied in their own commit, or "Standards retrospective: no changes" is recorded under Decisions. This round has no pending decision, so no item is held.
