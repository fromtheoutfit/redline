# Standards for PR #80 Review Round 4

Shaped by Redline in unattended mode. These standards apply to this work. They are quoted as they read at shaping time on the PR branch (`a70c243`). `workflow/agents`, `scripts/guard`, `workflow/replay`, `testing/tests` and `process/docs-gate` are long and mostly about other surfaces, so only the bullets this round applies are quoted, each verbatim; `[...]` marks text left out of a long bullet. The short standards are quoted in full.

---

## workflow/agents (excerpt: the bullets this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49)
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36)
- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)
- A finding an earlier round recorded is not one it dispositioned. The evidence of a disposition is the Redline reply answering the finding (`fixed`, `deferred`, `decided`, `dropped`, or `carried` by a later round), never `shape.md`, which a hand-off never relaunched leaves reading `Decided by: redline` on fixes never made; a finding with no reply, or a `not changed` one, is carried forward: a finding of the current round with `carriedFrom`, re-verified against the head and never copied, listed under its own heading in the review body, replied to in its earlier thread and swept with it, and named in the handoff. The reviewer accounts for every carry-forward id as carried or resolved, and the workflow carries what it did not account for, with a warning, rather than dropping it. [...] (#46, R1-2)
- The coverage pass is the finder and the reviewer the verifier (#79): the built-in `code-review` skill runs over the whole pull request at the round's head on every whole-PR and fix-diff round, since it is stochastic and attends to what moved, so each pass is a sample and the manual loop it replaces ran one per round. The reviewer verifies its candidates and runs no discovery pass of its own over the PR; it keeps the checks its prompt names by rule (scheduled and queued overlap, the Docs nit, the Version nit) and the fix-diff recheck, and accounts for every candidate with one of a fixed set of outcomes (`finding`, `forThePerson`, `duplicate`, `settled`, `known`, `refuted`, `outside`, `disproportionate`). The finder never returns an empty list, so the verifier's collapse is the run's stop rule: the prompt defines new (not collapsed into a finding already reported, settled in an earlier round, carried, or tracked elsewhere); `fixed` is the one disposition a candidate may reopen: a candidate that matches an earlier finding marked fixed but that the verifier reproduces or traces at the round's head is new, reported as a finding of this round with the earlier id named, so a fix that did not fully land keeps the run going under `maxRounds`, while a re-sampled finding the fix did close no longer reproduces and settles (#80, R2-1), the run ends when a round confirms no new correctness finding, and the workflow lists an unaccounted candidate under For the person as reported, with a warning, the mirror of carry-forward. Two guards keep the finder's wider net out of the plan: a candidate anchored outside the diff is never a finding, and one that needs implausible conditions to bite is disproportionate and dropped with that word. What the verifier would not act on but a person should see goes under `### For the person`, no id, never shaped, carried into the handoff, and never read back as a finding, since `redline-gh.sh prior-findings` reads only lines that open with a finding id. The verifier is shown the PR's earlier runs' handled findings on every round that ran a coverage pass, not only on the whole-PR round, since the pass samples the whole PR at every head and can re-sample a finding an earlier run deferred or decided; the carry-forward list stays on the first round (#80, R1-2). The count sentence counts a candidate where the round puts it. Under `correctness only`, a nit reported from a candidate is `forThePerson` and listed there, whether or not it carries a `knownAs`. Otherwise a finding listed under Already tracked is `known`. A `finding` entry whose ref names no finding of the round is listed under For the person as reported, like an unaccounted candidate. The findings file keeps the candidate list beside the accounting its indexes point into (#80, R1-4, R1-5)

---

## scripts/guard (excerpt)

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- When the repository is the plugin (its checkout loaded in place, Redline reviewing itself), the plugin's source is repository content under the roles' usual prefixes, except `scripts/redline-guard.sh` and `hooks/hooks.json`: the guard that vets the run is changed by a person, never by a Redline role (#4). [...]
- Every change to the guard adds or changes a row in `tests/guard-cases.tsv` in the same commit, with the `agent_type` Claude Code sends, beside a row for the neighbouring decision that must not change (`allow Write REPO/scripts/redline-guard.sh` in an ordinary repository, next to the self-hosted `deny`)
- A Redline role is identified by `agent_type` alone (`redline:redline-<role>`, or `redline-<role>` for a copy under `.claude/agents/`); anything else, the main session included, leaves the guard inert with no output, with one exception: a Bash call that is one of the plugin's own scripts by real path (`redline-gh.sh`, `redline-prefs.sh`, `redline-gate.sh check`, `redline-setup.sh version`), the repository's `checks.sh`, or read-only git, each as the bare command word (nothing in front of it: no wrapper, `env`, `timeout` or `xargs`; a `cd` to the repository root before it is fine), is approved for any session, so the shared allow list carries no `Bash(/*/scripts/…)` rule that a script of the same name at any path an agent could write would match, and anything else from such a session, a builtin, `sed` or `find` included, is inert, never a deny, so the permission prompt decides (#50; #54, R2-1)
- The guard does not see a skill fork: a `Skill` call from a Redline role runs the skill's commands with no Redline `agent_type`, so `gh`, `$(...)` and loops the role's row refuses go through unvetted (spike #72). A pass built on a skill is therefore a plain workflow agent, never a role, and its safety is the skill's own read-only recipe and the session's permission mode, except where the fork's Bash call meets #50's main-session approvals: a fork is a non-role session to the guard, so one of the plugin's scripts by real path (every `redline-gh.sh` subcommand, the writes included), the repository's `checks.sh` and read-only git are approved for it with no prompt. `tests/guard-cases.tsv` pins the write approval under #80, R2-5, until a person narrows the main row to `redline-gh.sh`'s read subcommands; the README's Known limits, `docs/running.md` and `docs/guard.md` say so and name the narrowing as pending (#80, R2-5)

(The last two bullets are lines 14 and 23, the two R4-2 corrects.)

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## process/docs-gate (excerpt)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (excerpt)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## workflow/replay (excerpt)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- The findings of the PR's earlier Redline rounds and their dispositions enter through `args.priorFindings`: the skill reads them with `redline-gh.sh prior-findings` after `last-round` and passes the list, and the workflow never reads the threads itself, since the run's own carried-forward replies change them (#35)
- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)

---

## testing/tests (excerpt)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` that a large pull request exercises (`files`, `diff`, `place`, `last-round`, `has-review`) [...] and the prior-findings read (`prior-findings`, on PR 14: one finding per disposition, a body finding answered by an issue comment, a teammate's reply that is not a disposition, an Already tracked line that is not a finding, and a round that carried an earlier finding; #35), against a fake `gh` first on PATH that serves the fixtures by endpoint [...]; nothing reaches GitHub (#33)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
