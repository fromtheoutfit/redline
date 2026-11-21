# Standards for PR #114 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `b5db022`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied bullets)

Line 17 (in part, its opening and two clauses; R2-4's and R2-5's comments, R2-6's agent file):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2; and an ask a prompt puts to every item of a block names, with the same condition, every item the workflow does not read it for, so an agent is never asked for what is discarded unread: the resolve prompt asked a statement of a call whose decision names its own disposition, which `asked` leaves out, until #108, R1-2

Line 38 (in part, its last clauses; R2-6, standards item 4):

- The workflow checks a result before it acts on it [...] and what the resolve agent states a call's decision ends in is held to the tasks and entries the same resolve returned, before anything is built, filed or posted: a deferral with no deferred entry, a fix with no task with files, an accept beside a task with files, or a call with no statement stops the round at resolve, since the workflow cannot take a task out of `plan.md` and a stop at the check resumes at the build, which cannot replan (#99); and that hold runs again after each reshape, on the list the reshape left: a decided fix with no files, or a decided accept with any, stops the round at that reshape, where a rerun replans, and a deferral is not held, since its mitigation is optional (#106); and the reshape is told what each decided finding's decision ends in, read as the hold reads it, beside its id, since an agent held to a rule by class can follow it only when told each item's class: the block named the decided ids alone, so a fix worded like an accept could be dropped and stop the round, until #114, R1-3

Line 41 (whole; R2-5, standards item 3):

- A value a later pass of a loop rebuilds keeps what an earlier pass recorded once the run rests on it: the round's commits read every implement attempt's report, not the repair's alone (#94, R7-9), and a repository rule's forced entry whose call is decided stands through a reshape (#94, R7-7); and what a round planned is read from every resolve it ran: a reshape that raised a call ran a resolve for that call alone and replaced the first one's tasks, so a stray entry beside the first resolve's fix was filed as a deferral and that task's commit was no longer demanded, until #97, R2-14; and a finding the person or autopilot decided keeps the deferred entry its decision was planned with through a reshape: the reshape's entry for it is dropped with a warning and the draft check skips it, since a reshape's restated entry replaced the resolve agent's, so a restated mitigation undid a chosen deferral and a restated draft swapped the one filed, and a short one stopped the round at shape, until #97, R3-4, R3-6; and a check that reruns on every reshape says what it found once: the run's warnings are de-duplicated as `result()` returns them, since a kept decline repeated its follow-up warning after every bounce until #97, R4-4

Line 47 (in part, its opening and two clauses; R2-2):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...] and an agent that checks a list against the plan is shown the list the workflow reads [...]; and every agent the list reaches is shown the same one, built where the dispositions are (`effectiveDispositions`) [...]; and the list the workflow reads for a finding the person or autopilot decided is its task as last planned: set by the resolve that applied the decision, for the ids that resolve applied, and replaced by each reshape's `files`, which the reshape prompt asks for as the task `plan.md` holds, in a block only a round with such a finding carries. [...] What a reshape says was decided, its disposition and its deferred entry, is still dropped: the files say how the plan carries the decision, and a change to them is warned about with the decision's owner (#106)

Line 50 (in part; R2-2, R2-4, standards item 1):

- Whether an optional step happened is read from the run's record, never from the words of a free-text field an agent fills, and the check never demands it (#100) [...]. A list the record is read from is required in its schema and asked for in every prompt that returns it, so an empty one means none, never not asked: the shaper's `files` was asked for only in a repository with ask rules until #100; and it is asked for in one meaning in every sentence of a prompt that asks for it: `FILES_ASK` gave an ask an empty list while the same prompt's ask-rules block asked for the paths its change would touch, which `forceAskRules` reads, until #103, R2-5; [...] and a list of paths an agent returns is read through one cleanup before it is compared, stored or counted, each path trimmed, the repository root or a leading `./` taken off and a blank dropped (`cleanPaths`), so one file written two ways is one file and a list of blanks is no list: a reshape's `./app/x.php` was warned about as a change from the resolve's `app/x.php`, and `['']` passed the hold that stops a decided fix with no files, until #114, R1-6

---

## workflow/replay (applied bullets)

Line 19 (in part, its last clause; R2-3, left):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun [...]; and the shaper's own sentence, rewrite the folder from scratch, is the wrong one beside entries the resolve agent decided: a reshape stopped by the workflow's check of the task it left a decided finding is told to correct the task and keep them, chosen by how the error opens, and a reshape resumed after any other stop keeps the shaper's sentence (#106)

Line 23 (whole; R2-4, R2-6, standards item 2):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. The schema requires the new key, and the workflow reads an absent one as empty wherever an unchanged prompt can replay an older result. The prompt states the whole ask, so the answer does not depend on the agent file the session loaded, and the agent file gains the ask and changes no other rule, so an older script reading a newer agent's output behaves as it did (#99, `decided` in the resolve prompt's calls block); a rule a later check enforces on the items of a block the new ask is not in, when stating it in that block would change a prompt the spec keeps byte-identical, is stated in the agent file alone, and the stop a script newer than the agent file can meet stays resumable, its resume line telling the rerun to correct what it wrote (#108, R4-9: an override's fix is a task of its own, its `finding` the override's id, in `agents/redline-resolve.md` and not in the overrides block); and a block that only says what an existing field means for the findings it names needs no new key: the reshape prompt's decided-findings block, in a round with a finding the person or autopilot decided and in no other (#106); and a sentence elsewhere in that prompt that states the field's general meaning is qualified under the block's own condition, so no sentence gives a finding the block names a second meaning (workflow/agents, line 50) and a prompt without the block stays byte-identical: the reshape's Return sentence still asked an ask for the paths of its recommended change beside the block until #114, R1-4

---

## testing/tests (applied bullets)

Line 7 (in part, its opening and last clause; R2-5's mock key, standards item 5):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2) [...]; and a reshape mock asked what a decided finding's task is lists what the scripted resolve planned for it, kept by the mock from the resolve's own result, so only a scenario about a task the reshape changed scripts one (`reshapeFiles`), and no earlier scenario with a bounce and a decision changed its outcome (#106)

Line 16 (whole; R2-4's check over every scenario stands):

- A rule about every posted body is pinned over every scenario, not in one: `go()` reads each run's prompts and one check at the end names the offenders (`no prompt of any scenario holds a For the person section`), so a later scenario cannot bring back what the rule removed (#93)

Line 30 (in part, its opening; R2-2's cases):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 35 (whole; every task):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 36 (in part; no prompt of a round without a decided finding changes):

- A claim that prompts stay byte-identical across a change is proven by a sweep as well as by a check: a copy of the harness in the temp directory runs every scenario under the script as it read before the change and as built (`go()` takes the script as an argument), hashes every call's label, prompt and options, and the spec records the counts and explains every scenario that differs [...]

This round claims no new byte-identity beyond what its checks show: every prompt it changes is a reshape prompt that carries the decided block, which is new in this pull request, and `withoutBlock`'s check still compares the decided round's prompt, block cut out, with the undecided round's.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

The pull request bumped `0.4.3` to `0.4.4` (its spec, decision 7); a review round of the same pull request adds no bump.

---

## process/standards-retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A round a person finishes by hand, outside the run (a pending decision applied, a deferred full fix made), still owes its record in the same PR: the round's `shape.md` records the decision with its owner and commit, its proposed retrospective lands or reads 'Standards retrospective: no changes', and every standard that named the change pending says what landed, not only the README and `docs/`: `6ef58a9` applied R3-4 with neither record, and `a70c243` narrowed the guard while `scripts/guard.md` still called it pending, until the next round found both (#80, R4-1, R4-2)
- A clause appended to a standards line is read back in the whole line: it closes what it opens and replaces the citation it supersedes. Two round fixes of #112 appended to `testing/tests.md` and left an unclosed parenthesis and a doubled citation for the next round to find (#112, R4-2, R4-3)
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## prompts/attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
