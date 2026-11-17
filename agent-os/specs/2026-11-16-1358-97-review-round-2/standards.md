# Standards for PR #97 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `54b13f1`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did. One bullet of `testing/tests.md` names an escape that a tool call decodes when it is typed; it is copied with the escape spelled out in words.

---

## workflow/agents (applied bullets)

Line 9 (in part; the four endings, R2-7 and R2-8's declines, R2-15's case):

- The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. Since #95 these are four endings, and `defer` is its own: an item of any kind that is worth doing and not in this pull request, with a mitigation only when a cheap one exists inside it, and always with a drafted issue (a title, what was found, why it is not fixed here, the fix proposed) that the run files; `decline` is for what is not worth doing (the claim is wrong, the conditions will not occur, the spec chose otherwise, or it could not be confirmed) and never points at follow-up work, so the proportionality rule and a refactor that fails a small-refactor test end in `defer`. It returns an `ask`, with a story, options and a recommendation, in five cases (the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the spec agreed; it reaches outside the pull request; two options are defensible with no clear pick; the finding is still unconfirmed after the shaper's second look and serious if true), beside a repository ask rule and a finding on one of Redline's own files. Everything else it decides, a decline included, as `decided by: redline` with its reason. [...]

Line 19 (whole; R2-2):

- A body the GitHub agent writes with the Write tool, byte for byte, holds no invisible character the post depends on: nothing compares the file it writes with the workflow's text, so a character it drops goes unseen. Such a character is written as a numeric character reference GitHub decodes, as `postedText` writes the word joiner as `&#8288;`, and the loop test checks that the post and handoff prompts hold no raw joiner (the #87 follow-up spec)

Line 37 (in part; R2-13):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, except, on a reshape, one the round already decided, since the reshape returns only the calls still pending or newly raised (#61, R1-2), a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): [...] and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, the agent the error is about, passed by name when another agent ran after it [...]; the checks on the shaper's output run in one function after the shape and after every reshape, so a check is added to both or neither and a reshape cannot skip one the shape runs (#94, R8-5); [...] never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Line 39 (whole; R2-6, R2-12, R2-15):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, so the shaper's stray entries are dropped with a warning and a reshape's re-sort drops the earlier one; and a disposition the person changes away from defer drops the shaper's entry, while the resolve agent's entry for a decision it planned replaces an earlier one for the same id (#94, R5-9); and a verified item the workflow does not act on is declined with its reason and listed, never dropped with a log line and a count: a final nit pass's nits until #94, R7-10, now declined under the pass's scope as the correctness-only scope declines one; and a finding whose call the person or autopilot decided is theirs in every list, whatever disposition a reshape later gives it: a stop's list of Redline's declines left out only a disposition override until #94, R8-6; and an outcome that changes after its round (a draft held to the end of the run, then filed or dropped) rewrites that round's outcome, its kind and its decided entry before Finish composes anything, so the handoff lists the item as what it became (#95); and a decided finding is a deferral only when its decision made it one: a `defer` override, or the resolve agent's own entry when that entry ships a mitigation or the finding has no planned task with files; a reshape's entry beside a decided call made it one, its fix commits zeroed and an issue filed for it, until #97, R1-10

Line 40 (whole; R2-14):

- A value a later pass of a loop rebuilds keeps what an earlier pass recorded once the run rests on it: the round's commits read every implement attempt's report, not the repair's alone (#94, R7-9), and a repository rule's forced entry whose call is decided stands through a reshape (#94, R7-7)

Line 47 (whole; R2-3, R2-2):

- Text is made safe for the surface that renders it, and the rule for a new surface comes from a measurement of that surface, recorded in the spec's Evidence, never from the Markdown specification: an issue's body goes through `postedText` field by field, though its words are the shaper's, since an issue is read where the pull request is not; its title is filed as written, made one line, with control characters removed and cut to 256 characters, since GitHub shows a title as plain text, decoding no entity and linking no `@word` (GraphQL `titleHTML`, read-only, #95); a value cleaned before it is used is cleaned before a fallback chooses between candidates, and the check that it is present reads it cleaned: a person's title of spaces won over the shaper's and filed `# `, and a shaper title of control characters passed the draft check, until #97, R1-8

---

## workflow/replay (applied bullets)

Line 6 (whole; no prompt before a stop changes):

- Decisions, approved plans, selected findings and the answers to deferred drafts enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial, `args.deferrals` at a stop check, at filing and in the text posted after it); a prompt before that point never mentions them; and a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve: a later stop of the round (a reshape after a bounced plan, a draft the resolve agent wrote) takes none and lists no declines (#94, R3-7, stated then as no plan approver having run; #95)

Line 21 (whole; the run caution in `shape.md`, Context):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

---

## testing/tests (applied bullets)

Line 7 (whole; the mock's `deferTwice`):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2); it gives a field the shared checks read only when the reshape prompt asks for it (`secondLook`, #94, R9-3)

Line 11 (whole, its escape spelled out in words; R2-2):

- An invisible or non-ASCII character a test or a fixture needs is written as its escape (backslash, `u`, `2060` in JavaScript and JSON source), never as the character itself. A bash harness compares it through `jq -a`, since bash 3.2 has no dollar-quoted backslash-u form. A tool call that is given that escape writes the character, which no reader of the file can see, so check a new file with `grep` for the bytes before trusting a red run (#87, the gh harness's first red run).

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 15 (whole; R2-13):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9); a call that returns nothing is scripted with the mock's `scenario.nothing` (a list of labels), since no per-agent override can return null through the mock's fallback, and the stop it causes is pinned by its label too (#94, R6-10)

Line 17 (whole; R2-3, R2-4):

- The statements of the endings and the done rule that a person or an agent meets are pinned by key phrase in the loop test (#95): the README's opening and its Known limits entries, both plugin descriptions, the skill's description, the mission, the reviewer file's opening, the workflow's `meta.description` and the facts-only sentence of every review prompt. #79 left three of them on the old rule until a fifth round, and #93 left `meta.description` stale until #95

Line 28 (in part; the neighbour each task names):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 33 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## scripts/bash-conventions (applied bullets)

Line 5 (whole):

- Every script starts `#!/usr/bin/env bash` and `set -euo pipefail` (`redline-gh.sh`, `redline-guard.sh`, `redline-prefs.sh`, `redline-gate.sh`, `redline-setup.sh`, `checks-template.sh`). The test harnesses use `set -uo pipefail` instead, because one failing case must not stop the table

Line 8 (whole):

- Usage errors exit 2 with a one-line reason on stderr. A check that fails exits 1. A script whose exit code is an answer (`redline-gh.sh has-review`: 0, 1 or 2) says so in its header

Line 10 (in part; R2-1's header):

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]

Line 13 (whole; R2-1):

- A record a subcommand keeps beside what it writes is merged into as the file stands when the entry is written, never into the copy read when the subcommand began, and the temp file it writes beside the record is removed on every way out that does not end in its `mv`, through one `EXIT` trap that names every temp file the subcommand makes: `redline-gh.sh defer` read the round's record before a lookup and a create on GitHub and wrote that copy back, so an entry recorded in between would be lost, and left `.redline-deferred.*` behind on a failed write, where the run-record commit stages every untracked file (#97, R1-2, R1-3)

---

## process/docs-gate (applied bullets)

Line 5 (whole):

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 15 (in part; R2-16):

- A change to the run's done rule rewords every statement of it a reader meets, found by searching for the old rule's words, not only in the file the change touched: the README's opening paragraph and its Known limits ("What a clean run means", which the handoff links), `docs/`, the skills' descriptions, both `.claude-plugin/` descriptions, the workflow's `meta.description`, the reviewer agent file's opening sentence, the facts-only sentence of the review prompts and `agent-os/product/mission.md` [...]. A change to what a pass reads rewords the sentences that name what it read, found the same way: since #95 the final nit pass after a round that fixed a low-severity correctness finding says `round <n>'s fixes`, never "the nit fixes"

Line 16 (whole):

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

This pull request already carries 0.4.0, a minor bump; nothing this round changes what a setup rerun writes.

---

## prompts/attribution (whole)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
