# Standards for PR #114 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `9ea3ea9`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied bullets)

Line 10 (in part, its opening; R3-3's class table):

- A finding of a class an earlier round of the same pull request already fixed is fixed as the class, not as one more instance (the reviewer's 'the same class as R1-4, R2-2 and R3-1' is the signal): name the promise each earlier fix patched, list every member of the class from its source (git-config(1)'s `diff.*` and `core.*` keys, git(1)'s variables), set each against the code and record the table in `shape.md`, and take a mechanism that needs no list where one exists (the gh harness takes out every `GIT_` variable it finds by prefix). [...]

Line 17 (in part, its opening and last clauses; R3-2, standards item 3; the comments of R3-3 and R3-4):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2; and an ask a prompt puts to every item of a block names, with the same condition, every item the workflow does not read it for, so an agent is never asked for what is discarded unread: the resolve prompt asked a statement of a call whose decision names its own disposition, which `asked` leaves out, until #108, R1-2

Line 47 (in part, its opening and last clauses; R3-4, standards item 1):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...] and a statement held to a record the same agent returned is a consistency check: it stops an output that contradicts itself and cannot see one that is wrong throughout [...] (#99); and the list the workflow reads for a finding the person or autopilot decided is its task as last planned: set by the resolve that applied the decision, for the ids that resolve applied, and replaced by each reshape's `files`, which the reshape prompt asks for as the task `plan.md` holds, in a block only a round with such a finding carries. It is read for every decided finding no rule leaves to the person, a fix and an accept as well as a deferral, from the first plan approver pass on. [...] What a reshape says was decided, its disposition and its deferred entry, is still dropped: the files say how the plan carries the decision, and a change to them is warned about with the decision's owner (#106)

Line 50 (in part, its last clauses; R3-3, standards item 2):

- Whether an optional step happened is read from the run's record, never from the words of a free-text field an agent fills, and the check never demands it (#100) [...]; and a list of paths an agent returns is read through one cleanup before it is compared, stored or counted, each path trimmed, its repeated slashes made one and its `./` segments folded, the repository root and then a leading `./` taken off as the ask rules take them (`relPath`), a trailing slash dropped, and a blank or a bare `.` dropped (`cleanPaths`), so one file written two ways is one file and a list of blanks is no list: a reshape's `./app/x.php` was warned about as a change from the resolve's `app/x.php`, and `['']` passed the hold that stops a decided fix with no files, until #114, R1-6; and a cleanup that promises one file written two ways is one file is traced through every form it names and every way they combine: R1-6's took off the root or a leading `./`, never both, and kept `app//x.php`, `app/./x.php` and a trailing slash as written, so a reshape that wrote the resolve's file one of those ways was still warned about as a change, until #114, R2-2

---

## workflow/replay (applied bullets)

Line 19 (in part, its last clause; R3-2's docs):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun [...]; and the shaper's own sentence, rewrite the folder from scratch, is the wrong one beside entries the resolve agent decided: a reshape stopped by the workflow's check of the task it left a decided finding is told to correct the task and keep them, chosen by how the error opens, and a reshape resumed after any other stop keeps the shaper's sentence (#106)

Line 23 (in part, its opening; this round changes no prompt):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. [...] and a block that only says what an existing field means for the findings it names needs no new key: the reshape prompt's decided-findings block, in a round with a finding the person or autopilot decided and in no other (#106) [...]

---

## testing/tests (applied bullets)

Line 7 (in part, its last clauses; R3-4's mock key, standards item 5):

- A loop-test mock answers as the real agent would for the run's settings [...]; and a reshape mock asked what a decided finding's task is lists what the scripted resolve planned for it, kept by the mock from the resolve's own result, so only a scenario about a task the reshape changed scripts one (`reshapeFiles`), and no earlier scenario with a bounce and a decision changed its outcome (#106); and a task one reshape alone changed is scripted by that reshape's label (`reshapeFilesAt`), so a scenario can keep a task through one reshape and change it at the next, which a later reshape's hold needs (#114, R2-5)

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 30 (in part, its opening; R3-3's cases):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]; and a change that widens such a parse pins the form it still refuses beside the one it now accepts [...]

Line 35 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 36 (in part):

- A claim that prompts stay byte-identical across a change is proven by a sweep as well as by a check [...]. A mutation that stays green is called an equivalent only with the reason no input can tell the two apart and with the red mutation that pins the neighbouring clause (#106, the hold's filter over findings left to the person, pinned through the update loop's)

---

## process/docs-gate (applied bullets)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 7:

- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)

Line 16:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

Line 18 (the last bullet, after which standards item 4 adds one):

- A behaviour a spec records as unmeasured is stated as expected, never as fact, everywhere a reader meets it (the README, `docs/`, a line the skill says), and README Known limits lists every case of it: the #81 spec recorded a pinned relaunch's permission prompt as unmeasured both in bypass-permissions and outside it, and `docs/running.md` and the skill's spoken line stated both as fact while Known limits listed only the second, until #91, R2-1

---

## process/release (applied bullet)

Line 5 (in part):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes [...]; patch otherwise. [...]

---

## process/standards-retrospective (applied bullets)

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- A clause appended to a standards line is read back in the whole line: it closes what it opens and replaces the citation it supersedes. Two round fixes of #112 appended to `testing/tests.md` and left an unclosed parenthesis and a doubled citation for the next round to find (#112, R4-2, R4-3)

---

## prompts/attribution (applied bullet)

- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
