# Standards for PR #114 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `5a6d018`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied bullets)

Line 10 (in part, its last clause; R1-1, R1-7, standards items 1 and 2):

- [...] and a spec shaped by hand settles a class the same way before it plans: every read of the names and every text shown from them is listed with what it reads before and after, and each row is traced to a path a run can take, since a row taken from the issue's words alone (a draft raised after a reshape) had none: a decided deferral's draft is answered before a reshape can run (#106)

Line 17 (in part, its opening and two clauses; R1-3's agent file, R1-6's comment):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...] and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2; and an ask a prompt puts to every item of a block names, with the same condition, every item the workflow does not read it for, so an agent is never asked for what is discarded unread: the resolve prompt asked a statement of a call whose decision names its own disposition, which `asked` leaves out, until #108, R1-2

Line 38 (in part, its last clauses; R1-3, R1-6, standards item 3):

- The workflow checks a result before it acts on it [...] and what the resolve agent states a call's decision ends in is held to the tasks and entries the same resolve returned, before anything is built, filed or posted: a deferral with no deferred entry, a fix with no task with files, an accept beside a task with files, or a call with no statement stops the round at resolve, since the workflow cannot take a task out of `plan.md` and a stop at the check resumes at the build, which cannot replan (#99); and that hold runs again after each reshape, on the list the reshape left: a decided fix with no files, or a decided accept with any, stops the round at that reshape, where a rerun replans, and a deferral is not held, since its mitigation is optional (#106)

Line 47 (in part, its opening and its last clause; R1-6, R1-7):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...] and the list the workflow reads for a finding the person or autopilot decided is its task as last planned: set by the resolve that applied the decision, for the ids that resolve applied, and replaced by each reshape's `files`, which the reshape prompt asks for as the task `plan.md` holds, in a block only a round with such a finding carries. It is read for every decided finding no rule leaves to the person, a fix and an accept as well as a deferral, from the first plan approver pass on. Until #106 it was the resolve agent's tasks alone, shown only beside a deferral (R2-11's scoping, set for a nit fix), so a reshape after a bounced plan left every reader the task as first planned, and a decided fix was shown the shaper's list from before the decision. What a reshape says was decided, its disposition and its deferred entry, is still dropped: the files say how the plan carries the decision, and a change to them is warned about with the decision's owner (#106)

Line 50 (in part; R1-4, R1-6, R1-7, standards item 4):

- Whether an optional step happened is read from the run's record, never from the words of a free-text field an agent fills, and the check never demands it (#100): a deferral's mitigation is the task the round planned with files before the build and a commit of the finding's own after it, the words are shown, in a stop's drafts and the result's deferred list, only beside a mitigation the record says ships [...] and every reader that shows the words beside `ships` states `ships` first, in the words of what the record is at that point (a planned change before the build, a change in its own commit after it), and the words after it, labelled as the words, since they are not checked and can say that nothing ships [...] A list the record is read from is required in its schema and asked for in every prompt that returns it, so an empty one means none, never not asked: the shaper's `files` was asked for only in a repository with ask rules until #100; and it is asked for in one meaning in every sentence of a prompt that asks for it: `FILES_ASK` gave an ask an empty list while the same prompt's ask-rules block asked for the paths its change would touch, which `forceAskRules` reads, until #103, R2-5; and a word list that backs a written rule reads the rule's own examples and leaves alone what the rule allows: `FOLLOW_UP` missed 'another PR', 'a new issue' and 'a later change', the forms of the three the decline rule names, and flagged a decline that cited 'the #85 follow-up spec', until #97, R4-5 and R4-6

---

## workflow/replay (applied bullets)

Line 19 (in part, its last clause; R1-3's stops keep their resume line):

- A resume after an error changes exactly one prompt [...] and the shaper's own sentence, rewrite the folder from scratch, is the wrong one beside entries the resolve agent decided: a reshape stopped by the workflow's check of the task it left a decided finding is told to correct the task and keep them, chosen by how the error opens, and a reshape resumed after any other stop keeps the shaper's sentence (#106)

Line 23 (in part, its opening and its last clause; R1-3, R1-4, standards item 5):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. The schema requires the new key, and the workflow reads an absent one as empty wherever an unchanged prompt can replay an older result. The prompt states the whole ask, so the answer does not depend on the agent file the session loaded, and the agent file gains the ask and changes no other rule, so an older script reading a newer agent's output behaves as it did (#99, `decided` in the resolve prompt's calls block) [...] and a block that only says what an existing field means for the findings it names needs no new key: the reshape prompt's decided-findings block, in a round with a finding the person or autopilot decided and in no other (#106)

---

## testing/tests (applied bullets)

Line 7 (in part, its opening and its last two clauses; R1-3's mock parse, R1-7's case):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2) [...] and the scripted agent leaves out what the prompt says has no entry, read from the prompt as the real agent reads it, never from a key each scenario must remember [...] and a reshape mock asked what a decided finding's task is lists what the scripted resolve planned for it, kept by the mock from the resolve's own result, so only a scenario about a task the reshape changed scripts one (`reshapeFiles`), and no earlier scenario with a bounce and a decision changed its outcome (#106)

Line 16 (whole; R1-4's check over every scenario):

- A rule about every posted body is pinned over every scenario, not in one: `go()` reads each run's prompts and one check at the end names the offenders (`no prompt of any scenario holds a For the person section`), so a later scenario cannot bring back what the rule removed (#93)

Line 35 (whole; every task's red run, R1-7's mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 36 (in part, its opening; R1-3, R1-4 and R1-6 change no prompt of a round without a decided finding):

- A claim that prompts stay byte-identical across a change is proven by a sweep as well as by a check: a copy of the harness in the temp directory runs every scenario under the script as it read before the change and as built (`go()` takes the script as an argument), hashes every call's label, prompt and options, and the spec records the counts and explains every scenario that differs [...]

This round makes no byte-identical claim across all scenarios beyond what its checks pin: R1-3 and R1-4 change only reshape prompts that carry the block, which are new in this pull request, and R1-6 changes no prompt of any existing scenario, since none scripts a path the cleanup changes. So no sweep is planned; the `withoutBlock` check and the check over every scenario stand in for it.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

Line 5 (in part, its opening):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

This pull request bumped `0.4.3` to `0.4.4`; this review round of the same pull request adds no bump.

---

## process/standards-retrospective (applied bullets)

- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- A clause appended to a standards line is read back in the whole line: it closes what it opens and replaces the citation it supersedes. Two round fixes of #112 appended to `testing/tests.md` and left an unclosed parenthesis and a doubled citation for the next round to find (#112, R4-2, R4-3)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
