# Standards for PR #97 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `1dc6048`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 9 (its opening; the four endings every disposition here follows, R1-4's `defer` included):

- The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. Since #95 these are four endings, and `defer` is its own: an item of any kind that is worth doing and not in this pull request, with a mitigation only when a cheap one exists inside it, and always with a drafted issue (a title, what was found, why it is not fixed here, the fix proposed) that the run files; `decline` is for what is not worth doing (the claim is wrong, the conditions will not occur, the spec chose otherwise, or it could not be confirmed) and never points at follow-up work, so the proportionality rule and a refactor that fails a small-refactor test end in `defer`. ...

Line 39 (its clauses on stray entries and a decided call; R1-10):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, so the shaper's stray entries are dropped with a warning and a reshape's re-sort drops the earlier one; and a disposition the person changes away from defer drops the shaper's entry, while the resolve agent's entry for a decision it planned replaces an earlier one for the same id (#94, R5-9); ... and a finding whose call the person or autopilot decided is theirs in every list, whatever disposition a reshape later gives it: a stop's list of Redline's declines left out only a disposition override until #94, R8-6; and an outcome that changes after its round (a draft held to the end of the run, then filed or dropped) rewrites that round's outcome, its kind and its decided entry before Finish composes anything, so the handoff lists the item as what it became (#95)

Line 46 (whole; R1-14's decline):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. The verifier's `inFixDiff` holds only on a round that read a fix diff and for a file under the paths the previous round's plan named, which each round keeps on its own record (`record.planPaths`), since the run's `approvedPaths` is every round's (#95)

Line 47 (whole; R1-8, and R1-4's full fix, which waits for a measurement of `gh`):

- Text is made safe for the surface that renders it, and the rule for a new surface comes from a measurement of that surface, recorded in the spec's Evidence, never from the Markdown specification: an issue's body goes through `postedText` field by field, though its words are the shaper's, since an issue is read where the pull request is not; its title is filed as written, made one line, with control characters removed and cut to 256 characters, since GitHub shows a title as plain text, decoding no entity and linking no `@word` (GraphQL `titleHTML`, read-only, #95)

Line 48 (whole; R1-2, R1-3):

- A write that must not happen twice keeps its own record beside what it writes: `redline-gh.sh defer` writes the issue it opened into the round's record before any reply is posted, a relaunch, a resumed round or a rerun of the step is given what the record holds, and the lookup on GitHub for text only that issue carries (the draft's last line) is the second layer, for a run that died between the two, and is best effort. A fresh run matches neither, so the README's Known limits says what covers it (#95)

---

## workflow/replay (applied bullets)

Line 6 (whole; R1-11 and R1-12 change no prompt before a stop):

- Decisions, approved plans, selected findings and the answers to deferred drafts enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial, `args.deferrals` at a stop check, at filing and in the text posted after it); a prompt before that point never mentions them; and a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve: a later stop of the round (a reshape after a bounced plan, a draft the resolve agent wrote) takes none and lists no declines (#94, R3-7, stated then as no plan approver having run; #95)

Line 21 (whole; a run in flight keeps the script it launched with):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

---

## testing/tests (applied bullets)

Line 11 (its opening; Task 6's control characters):

- An invisible or non-ASCII character a test or a fixture needs is written as its escape (`\u2060` in JavaScript and JSON source), never as the character itself. ...

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 17 (whole; Tasks 3, 4 and 8):

- The statements of the endings and the done rule that a person or an agent meets are pinned by key phrase in the loop test (#95): the README's opening and its Known limits entries, both plugin descriptions, the skill's description, the mission, the reviewer file's opening, the workflow's `meta.description` and the facts-only sentence of every review prompt. #79 left three of them on the old rule until a fifth round, and #93 left `meta.description` stale until #95

Line 28 (its opening and its last clause; Tasks 5, 6 and 7):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause: ... and a change that widens such a parse pins the form it still refuses beside the one it now accepts: ...

Line 33 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## scripts/bash-conventions (applied bullets)

Line 5 (whole):

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table

Line 8 (whole; Task 9's exit 1):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header

Line 10 (its opening; Tasks 2 and 9):

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). ...

Line 11 (whole; R1-1):

- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header: R1-3 changed which review body `human-review` takes and updated the header, the README's `redline-gh.sh` row and the revise skill, and left the README's paragraph on `/redline:redline-revise <pr> review` describing the old selection (#38, R2-1)

Line 12 (whole; R1-1, and the guard group R1-4's full fix may need):

- A subcommand added to `redline-gh.sh` or `redline-prefs.sh` is added to the guard's groups in the same change (`GH_READ` for a read subcommand; `gh-all` already covers a write one), and the agent or skill that calls it names the exact spelling; a subcommand removed (`issue-create`, replaced by `defer`) takes its callers with it in the same commit: the skill section that ran it, the agent operation, its guard rows and `docs/scripts.md` (#95)

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)
- A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it: ...

How the round applies the last bullet: what `gh` does on a repository with Issues off was not measured (`shape.md`, Unattended answer 9), so Task 3's sentences, R1-4's mitigation, state only what GitHub needs to open an issue, never what `gh` does there; the drafted issue asks for the measurement first.

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
