# Redline

Redline is a Claude Code plugin that reviews a pull request, fixes what it found, and hands the PR to a teammate once no correctness bugs remain. It is one command, `/redline <pr>`, run by the author on their own PR; the second developer's review stays in place. Every decision it makes is posted with its owner, and a finding that needs a product or design decision comes back to you instead of being decided by an agent.

The loop, per round: **review** the PR (the built-in `code-review` skill finds over the whole PR at the round's head, Redline's reviewer verifies) and post one review with inline comments; **shape** a spec for the findings through Agent OS; **approve** the plan; **implement** one commit per finding; **check** the repository's gate; **push** and **reply** in each finding's thread; **re-review**: the coverage pass again over the whole PR at the new head, and the fix diff rechecked. A round whose verifier confirms no new correctness finding ends the run: Redline resolves the threads it opened, requests review from your teammate, and posts the handoff comment. It was built and proven end to end on seeded pull requests in a production Laravel application before it was packaged as a plugin.

## Requirements

- Claude Code with dynamic workflows (proven on 2.1.303 to 2.1.318) and its built-in `code-review` skill, the coverage pass (`coverage off` runs without it)
- `gh` 2.48.0 or newer, signed in as the person who runs Redline
- `jq` and `python3`
- Agent OS in the repository, with a Verification Gate task in `.claude/commands/agent-os/shape-spec.md`. Stock Agent OS has none, so you add one first: two steps are enough ([docs/setup.md](docs/setup.md), "The gate task"; #70 makes it optional)

## Install

From the repository you want to use it in:

```bash
claude plugin marketplace add fromtheoutfit/redline
claude plugin install redline@redline --scope project
```

`--scope project` records the plugin in the repository's `.claude/settings.json`. Commit that file before `/redline:setup`, which needs a clean tree; teammates get the plugin from it. Updating and developing the plugin: [docs/upgrading.md](docs/upgrading.md), [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

1. From the repository's root, on the default branch with the install and the gate task committed, in a Claude Code session: `/redline:setup`. It reads what it can off the repository, asks about the rest, writes the per-repository contract on a branch, runs the gate once, and hands you the files to commit ([docs/setup.md](docs/setup.md)).
2. Check out a PR's branch, clean, at the pushed head, and type the command on a line of its own:

```
/redline 21
/redline 21 review only
/redline 21 dry run review only
/redline 21 autopilot
/redline:redline 21 max 2 rounds correctness only
/redline-revise 21 review @sam
```

`/redline` and `/redline-revise` are the short aliases setup writes; `/redline:redline`, `/redline:redline-review` and `/redline:redline-revise` are the namespaced forms, which always work. The words can come in any order. `review only` posts the review and revises nothing; `dry run` posts and pushes nothing and writes every body under the round's spec folder; `autopilot` never stops for you. The first launch asks for the settings it was not given and remembers them. What happens next, start to finish: [docs/running.md](docs/running.md).

## Dials

Four settings shape a run besides the PR number, typed on the command line or remembered from the last run, and one word, `coverage off`, is typed per run and never remembered. `interrupt` says where the run stops for you:

| Word | Stops | What you do there |
| --- | --- | --- |
| `autopilot` | Never | Nothing. At a judgment call the shaper's recommendation becomes the decision, attributed `redline (autopilot)`, and the run goes on |
| `guided` (default) | Only when the shaper returns a judgment call (`ask`) | Answer the calls, one at a time, in the session (a pick per call, or one line `<id>: <choice>. <reason>`), then type `relaunch`; the run relaunches with the decisions |
| `plan` | After shaping, every round | See every finding's disposition (fix, defer, ask) with the shaper's one-sentence recommendation. Approve as-is, change a disposition to fix, defer or accept, or answer an ask, then type `relaunch`; the run relaunches and stops again after the next round's shaping |
| `review` | After the round 1 review is posted | Pick the findings to act on, then type `relaunch`; each one not picked is dropped with a reason, which is posted in its thread. Later rounds stop as `guided` does |
| `review only` | After the round 1 review | Nothing is revised |

| Setting | Words | Default |
| --- | --- | --- |
| `interrupt` | as above | `guided` |
| `scope` | `correctness only`: no nits, no final nit pass; otherwise correctness bugs and nits, ending in one nit pass | `all` |
| rounds | `max N rounds`: the revise rounds before the run stops with a cap-hit comment | `3` |
| `revise` | `revise fable` or `revise opus`: the model that shapes and implements the fixes; the other roles' models are in `.claude/redline.json` | Opus 5.5 |
| coverage | `coverage off`: every round runs the reviewer alone, without the coverage pass, under the done rule from before the pass existed; the fallback when the `code-review` skill is absent or its recipe has drifted, never the default | on, at `models.coverage` in `.claude/redline.json` |

`reviewer @handle` overrides the configured teammate for one run; `no push` keeps the commits local. A fifth setting, the repository's ask rules (what a person is always brought in for), is declared in `.claude/redline.json` and never typed ([docs/contract.md](docs/contract.md)).

## Files

| Path in the plugin | What |
| --- | --- |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | The manifest and the single-entry marketplace, carrying one semver version |
| `skills/redline/SKILL.md` | `/redline:redline`: the settings, the precheck, the launch, the hand-offs; `redline-review` and `redline-revise` beside it are the two halves |
| `skills/setup/SKILL.md` | `/redline:setup`, the fourteen steps of [docs/setup.md](docs/setup.md) |
| `workflows/redline-loop.js` | The loop: phases, the coverage pass, done rule, cap, the interrupt dial's stopping points, decision owners, the human review pass ([docs/running.md](docs/running.md)) |
| `agents/redline-*.md` | The eight roles: reviewer, shaper, resolve, plan-approver, standards-approver, implementer, checker, github |
| `hooks/hooks.json`, `scripts/redline-guard.sh` | The per-role guard, a `PreToolUse` hook on Bash and the file tools ([docs/guard.md](docs/guard.md)) |
| `scripts/redline-gh.sh` | Every GitHub call |
| `scripts/redline-prefs.sh` | The saved launch settings and the run markers in `.claude/redline.local.json` |
| `scripts/redline-gate.sh` | The gate stamp: `extract`, `stamp`, `check` |
| `scripts/redline-background.sh` | A long gate run in the background for the checker and the implementer |
| `scripts/redline-setup.sh` | The scriptable parts of setup |
| `scripts/checks-template.sh` | What a repository's `checks.sh` is generated from ([docs/contract.md](docs/contract.md)); the headers of every script are quoted in [docs/scripts.md](docs/scripts.md) |
| `templates/` | The per-repository files setup writes: the allow list and its retired entries, `redline.json.example`, the unattended section and its frozen history, the CLAUDE.md sentence, the two alias commands |
| `tests/` | The seven harnesses the gate runs: `guard-test.sh` over `guard-cases.tsv`, `loop-test.mjs`, `prefs-test.sh`, `gate-test.sh`, `setup-test.sh`, `gh-test.sh`, `background-test.sh`, with their fixtures |
| `docs/` | The reference, linked under Documentation below |
| `CONTRIBUTING.md`, `CHANGELOG.md` | Developing, CI, the Docs step and releases; one changelog heading per tagged version |

## Git rules for Redline agents

These apply when the prompt says the session is a Redline run. Outside a Redline run the repo's CLAUDE.md Git section stands unchanged: never commit, push or stage.

1. **One commit per finding.** Each finding fixed in a round is its own commit. The standards retrospective, when it changes anything, is one more commit on its own. The spec folder (`agent-os/specs/<ts>-<pr>-review-round-<n>/`, or `<ts>-<pr>-human-review-<n>/` for a human review pass) is committed in the round's first commit or on its own; never mixed into a finding's commit. Its As built notes land in the round's last commit. So a round makes the spec commit, one commit per finding, the standards commit when there is one, and the as-built commit: three findings make six commits. A run that finishes (handed off, capped, a `review only` run after its post, a revise-only run after its replies) then makes one more, the run-record commit: after the handoff or cap-hit comment (and before it, the PR description when one was posted and the sweep that resolves the settled threads Redline opened), the GitHub agent stages, by name, every file under each round's `<specFolder>/redline/` that no commit holds yet (the replies, the closing comment or a human review pass's summary, the description's backup, the ingested human review, and the review and findings of a round that had no revise pass), plus `snapshot-start.json` if it is untracked, and commits them as `redline: record the run's replies, reviews and handoff for PR #<pr> (#<issue>)`. When nothing is left to stage there is no commit.
2. **Stage files by name.** `git add <path> [<path>...]` only. Never `git add -A`, `git add .`, `git add -u` or `git commit -a`. A file that is not named in the plan task is not staged.
3. **`redline:` prefix.** Every commit message starts with `redline: ` followed by one sentence naming the finding and the change, for example `redline: R1-2 reject a status outside the enum (#42)`. Reference the PR's issue number the way the repo's other commits do.
4. **No AI attribution.** No `Co-Authored-By`, no "Generated with", no model or vendor names, in commits, PR bodies, comments, issues or spec files. Redline labels its own work as Redline (`Redline round 2`, `Redline handoff`, `redline:`), which is a tool name, not vendor attribution.
5. **Push only when `args.push` is true.** The implementer never pushes. The GitHub agent pushes once per round, after the checker passed, and once more after the run-record commit, with `git push` to the PR's head branch and nothing else (no `--force`, no other refs). With `push: false` the commits stay local and the replies say so.
6. **Never merge, approve, rebase or amend.** Reviews post with the `COMMENT` event. History is append-only during a run.
7. **A clean tree at the start and at the end.** A fresh launch requires the PR's head branch, a clean tree and HEAD equal to the PR's head SHA. During a run the only expected uncommitted state is under the spec folders: the round's folder before its commit, and the reply files written after the round's last commit. A run that finishes leaves a clean tree, because the run-record commit holds the rest; a `review only` or revise-only run finishes the same way. A run that stops for the person (a hand-off, the review dial, an error) leaves its spec folder uncommitted and a marker in `.claude/redline.local.json`: a relaunch or a resume picks it up, and a fresh launch names the folders to commit or remove.

## Known limits

- **Correctness inside one function is found reliably; a race between two commands is not.** Across three seeded PRs, every planted bug that sits inside one function was found on the right line, 7 of 7: a missing status filter, a tie counted as a win, a streak one short, a missing value read as 0, an undocumented sort order, a method named for the wrong end of a copy, and a docblock that disagreed with its code. The one planted race was missed.
- **The missed race.** One command copies an archived day file by file. A scheduled prune deletes days once they age out, and the oldest day is the one most worth keeping. When both run at once, part of the day is lost for good, and the copy fails with an error that reads as a storage fault. The reviewer read the prune and its schedule, and tested a failed copy against a mocked disk. It reported only that the failure path had no test, a nit. So round 1 had no correctness finding, and the run handed the PR to the teammate with the race still in it.
- **What a clean run means.** No correctness bug in the changed code that the reviewer could read or reproduce. It says nothing about the change running at the same time as a scheduled command or a queued job. The reviewer is now asked for that overlap (`agents/redline-reviewer.md`, "Scheduled and queued work on the same data"). Until a seed shows the check working, concurrency belongs to the human review.
- **The coverage pass runs outside the guard.** The built-in `code-review` skill, the finder on every whole-PR and fix-diff round, runs as a fork of a plain workflow agent, and the fork carries no Redline `agent_type`, so the guard does not see its commands; a Redline role cannot host the pass either, since the fork would escape the role's row the same way and a role's output schema can swallow the fork's result. The pass's safety is the skill's own read-only recipe (read-only git, `cat`, `grep` and `gh` reads, in every run so far) and the session's permission mode; a default-mode session may be asked once by the fork. `coverage off` runs without it ([docs/running.md](docs/running.md), "The coverage pass").
- **Each coverage pass is a sample.** The skill is stochastic and attends to what moved, so one pass does not find everything a second would; that is why it runs on every round and why the run ends only when a round's verifier confirms no new correctness finding. A hand-run pass after a Redline run can still find something, and `maxRounds` bounds the rounds and their cost, about one skill pass each.
- **A file whose patch GitHub omits anchors nothing.** GitHub leaves `patch` out of a binary file and of a file over its per-file size limit (56 of the 336 files of Losers League #778: built assets, lockfiles, generated code). `diff` shows such a file as a header and one `(no patch: ...)` line, the reviewer opens it in the tree only when a finding points there, and a finding in it goes in the review body behind `<!-- redline:<id> -->`, where later rounds reply with an issue comment quoting the marker. A finding in any other file anchors inline whatever the PR's size.
- **A thread a human opened or commented in is never resolved by Redline.** Redline posts from the author's login, so it tells its own comments by the ids it posted, not by author: a thread from an earlier run is swept only when this run carried its finding forward or resolved it (its root and its replies are then in the list), and never one with a hand-written comment anywhere in it. Those stay open for the teammate to resolve; the handoff comment names them.
- **A paths ask rule refuses the writes the guard can see.** The guard checks every write target it can extract (the Write and Edit tools, redirections, `tee`, `sed -i`, `mv`, `cp`, `rm`, `mkdir`, `touch`, `git add`), so a Redline role cannot write under a rule by any of those with a literal path. A Bash operand holding `*`, `?`, `[` or `{` is refused outside the temp directory, so a role names its files (#53); `git add` of a file whose name holds one is allowed when the file exists, since the path then names it exactly (#54). It does not see the files a build tool writes (`php artisan make:`, a formatter, `npm run build`), the operands `xargs` supplies to the implementer, or the files `find -exec` visits (it checks the starting directory). The checker's allowed list is the PR's files plus the approved plan, so a file under a rule that the PR already changes is not caught there either; the guard, the forced `ask` and the plan approver's bounce are the enforcement.
- **A stopped run resumes only from its own session, and only onto its own HEAD.** The harness replays a run's cached agents from the session that launched it, so a resume from another session is refused with the `claude --resume` command to reopen the right one. Only a run that stopped with an error accepts a hand commit, and only under `.claude/`: a hand commit after a hand-off, the review dial or a stopped run, a hand fix outside `.claude/`, or any hand commit when the repository under review is this plugin, is a fresh run, refused before launch: its first round carries the earlier findings forward (#10).
- **A run on this repository runs the PR's own code only when the plugin loads in place.** Started with `claude --plugin-dir <checkout>` (or from the local-directory marketplace), the skill, workflow, agents and guard that review a Redline PR are the PR branch's; from the GitHub marketplace they are the cached release's, and the launch precheck says so (#16). Loaded in place, the guard refuses the guard script and the hook registration to every role here, so a run cannot loosen the guard that vets it, and everything else the PR changes is what runs. Loaded from a cached release, the guard treats this checkout as an ordinary repository and does not refuse those two files: only point 11 of the unattended section in `.claude/commands/agent-os/shape-spec.md` and the teammate's review keep a change to them out of a run, behind the precheck's warning. A finding in either file is deferred, mitigated by a `tests/guard-cases.tsv` row pinning today's decision or a line here, and a person makes the change after the run. The same holds for `.claude/redline/checks.sh`: a run cannot restamp it, so a finding whose fix changes the gate's backticked text in `shape-spec.md`, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line, is deferred to a person too. So is a finding whose fix touches `scripts/checks-template.sh` below its header, or changes the text `redline-setup.sh checks` writes into this repository's `checks.sh`: the setup test regenerates `checks.sh` from `checks.json` and compares it with the committed file, and no role may regenerate it, so a person makes the change, regenerates `checks.sh` and restamps after the run.
- **The person's last typed line reaches every agent.** On an interactive relaunch the harness relays it with precedence over the agent's task, and a sentence in the prompt was not enough: on PR #59 the answer `Refuse it` stopped the snapshot. Redline relaunches only from `relaunch` or a line holding only a Redline command; an answer reaches the run only through `args.decisions`, `args.selected` and `args.approvedPlans`, and a hand-off answer typed in any other words is a question, not a decision, until it is given as a pick or in the answer form (#60).

## Documentation

- [docs/setup.md](docs/setup.md): what `/redline:setup` reads, asks and writes, step by step, with the by-hand equivalent
- [docs/contract.md](docs/contract.md): the per-repository contract: `checks.json` and `checks.sh`, the output contract, the gate stamp, `redline.json`, `redline.local.json`, the allow list, the unattended section, the CLAUDE.md sentence, the snapshot files
- [docs/running.md](docs/running.md): a run start to finish: precheck, rounds, dispositions, hand-off and relaunch, the handoff comment, the run record, `decided by`
- [docs/guard.md](docs/guard.md): what each role may run and write, the hook, how to read `guard-cases.tsv`, the self-hosted rules
- [docs/upgrading.md](docs/upgrading.md): updating the plugin, and what a template bump means for a set-up repository
- [docs/scripts.md](docs/scripts.md): every script's header, quoted verbatim
- [CONTRIBUTING.md](CONTRIBUTING.md): developing the plugin, CI, the Docs step, releases
- [CHANGELOG.md](CHANGELOG.md): what each version changed and which changes need a rerun of `/redline:setup`
