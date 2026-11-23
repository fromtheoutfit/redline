# Standards for PR #120 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `96eb7aa`, before this round's tasks and retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/replay (applied bullets)

Line 19 (in part, its opening and the clauses on the shaper's sentences; R2-2, R2-3, standards item 1):

- A resume after an error changes exactly one prompt: `run()` appends a resume line to the agent label the error result's `resumeFrom` names (`args.resume`), so every prompt before it replays and that agent and all after rerun; a cached result the script rejected replays unchanged on a plain relaunch, which is why the line exists. [...] A reshape is known by its label, and its sentence goes by what its stop was: after the workflow's own check of what it returned, correct what the error names; after any other stop (a missing spec file, a call that returned nothing), restore what is missing, and never write from memory a decided entry the folder no longer holds. The from-scratch sentence stays for a round's first shape, which no decision of the person or the autopilot can precede in a round folder its own launch created, as the #117 spec measured over every scenario of the loop test; a revise-only pass over a round an earlier run shaped and resolved (`/redline:redline-revise <pr> round <N>`) shapes in that run's folder, so a resume of its first shape rewrites that run's decided entries, as it always has, and that run's record commit keeps them in git history (#120, R1-1); [...] and a resume sentence that states an exception restates the rule it leaves standing: the correct-in-place sentence left out the from-scratch sentence's ban on touching `redline/`, until #114, R4-1; and a resume clause that tells the rerun to keep what the step's own prompt may change says which instruction wins: the restore clause told a resumed reshape to keep each decided entry's task, beside a reshape prompt that applies each adjustment and a run that follows the plan as reshaped (#106), until #120, R1-2

Line 20 (whole; R2-5, standards item 2):

- A fact about a stop that the rerun must act on crosses the relaunch by one road: the error result, the harness's record of the run, the run marker (`redline-prefs.sh run save`, which copies named keys and nothing else), the skill, and `args.resume[label]`. A field the skill alone reads needs only the result; a field `resumeLine` reads needs every step of the road, the script, its quoted header in `docs/scripts.md` and its test included. A spec costs that road before it scopes its files: #117's brief kept `scripts/` untouched until `ownCheck` needed the marker to carry it (#116); and the fact is set by the check whose stop the person must act on, which runs before any check whose stop would hide it: the shaper's result checks ran before the spec check, so an attempt that left a file out, which a refused Write causes and a person fixes, and returned a result a check refused stopped with `ownCheck` true, and the skill said nothing needed fixing by hand, until #120, R1-3

Line 21 (whole; R2-3's rewording, answer 12):

- `args.resume` keeps every earlier entry, and each entry's line is built again on every relaunch, so a change to what the line says for a stop a run may already have resumed from changes that run's recorded prompt: after an update the step and everything after it run again, a round already built included. A spec that rewords a resume sentence says which entries change, keeps byte for byte the ones it need not touch (a first shape's line for an entry with no `ownCheck`, which would otherwise be rerun from scratch over its round's decisions), pins that with a case and the sweep, and says the rest in `docs/upgrading.md`. A fallback for the older entries is weighed against the runs in flight: #117 kept none, since none was (#116, #117)

---

## workflow/agents (applied bullets)

Line 17 (in part, its opening and two of its clauses; R2-3):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`): [...] and a comment in the workflow that restates the rule is changed with it: the shape schema's comment on `reason` still said a decline names where the finding belongs, the rule before #95, until #97, R4-2; [...] and an exception a change adds to a rule is stated wherever the rule is, every section of the docs included: #106's correct-in-place resume after the hold reached rule 9 of the shaper's file and the reshape bullet of `docs/running.md`, while the resume section of the same file still said every shape-stage resume rewrites the four spec files, until #114, R3-2; [...]

Line 38 (in part, its opening and the clauses on the label; R2-1):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, [...] and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, the agent the error is about, passed by name when another agent ran after it (`checkWhy` runs after the `spec status` call and names the shaper, #94, R2-9), [...] the checks on the shaper's output run in one function after the shape and after every reshape, so a check is added to both or neither and a reshape cannot skip one the shape runs (#94, R8-5); [...]

Line 46 (whole; R2-1):

- `stageError` falls back to the last agent label, so a stop that must not be resumed says so itself (the `fresh` flag on Finish's re-run stop); a failed read of the same step stays resumable at its label (#81); a call made on a step's behalf after it (the verdict after a spilled check) hands the label back, so a stop that follows resumes at the step and the gate runs again (#68), and so does that call's own failure: `run()` builds the stop from the label it was called with, so the call's stage error is given the step's label before it is thrown (#94, R6-10)

---

## testing/tests (applied bullets)

Line 14 (whole; R2-1's `|| {}`):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 15 (whole; R2-1, standards item 3):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9); a call that returns nothing is scripted with the mock's `scenario.nothing` (a list of labels), since no per-agent override can return null through the mock's fallback, and the stop it causes is pinned by its label too (#94, R6-10)

Line 30 (in part, its opening; every task):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 32 (in part, its second sentence; R2-1's renamed check):

- [...] A check's name states only what it asserts: #85's result check was named for the round record keeping the dropped entries and the result keeping counts only, asserted neither, and the result keeps the accounting by design, so a change to either stayed green under a name that said otherwise (#86, R2-2)

Line 35 (whole; every task, and R2-1's mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

Line 36 (in part, its opening and its last clause; answers 6 and 11):

- A claim that prompts stay byte-identical across a change is proven by a sweep as well as by a check: a copy of the harness in the temp directory runs every scenario under the script as it read before the change and as built (`go()` takes the script as an argument), hashes every call's label, prompt and options, and the spec records the counts and explains every scenario that differs (#106: 564 scenarios, 451 identical, the 113 that differ each holding a decided finding). [...] and a mutation run goes through the same door: the harness is loaded with its read of `workflows/redline-loop.js` pointed at a mutated copy in the temp directory, so the checkout is never edited and nothing has to be restored, a mutation whose text does not match is reported by its count, and one that prints no count is reported as a crash (#117)

Line 37 (whole; the expected counts):

- A count a question or a plan states (how many scenarios pass a resume entry, how many sites raise a check) is read off a run of the harness or a search of the source before it is stated, never estimated: #117's questions said eleven resume cases and nine result checks where the harness held 24 and the source eight, and a rider the user wrote on the wrong count had to be put back to them; and a claim measured over the loop test's scenarios is stated for the entry points they script and no wider: the #117 spec measured over one launch, whose round folders its own stamp names, that no decision can be on disk when a round's first shape is resumed, and the `resumeLine` comment, `docs/running.md` and the replay standard stated it for every first shape, `/redline:redline-revise <pr> round <N>` included, which shapes in the newest folder of that round, one an earlier run may have shaped and resolved, until #120, R1-1

---

## process/docs-gate (applied bullets)

Line 5 (whole):

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 7 (whole):

- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)

Line 16 (whole):

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

Line 19 (whole; R2-2, standards item 4):

- A sentence the docs keep about what a reader was shown before a change is read off the base's code, through every branch of its condition, never off a summary of it: the `Before #106` sentence named only a deferral set as a disposition, while the base's condition, `shown.disposition === 'defer'`, read a reshape's disposition for a call too, until #114, R3-1

Line 20 (whole; answer 12):

- A change to what a run stopped under an older release does when it is relaunched under the new one (a marker key the older release did not write, a resume line that now reads differently) gets a section in `docs/upgrading.md`, in the PR that makes the change, saying what the person does first: #116 and #117 changed what a resumed step is told, and the section says to finish or restart a stopped run before updating across 0.4.5

---

## process/release (applied bullet)

Line 5 (in part):

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

---

## process/standards-retrospective (applied bullets)

Line 7 (whole):

- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit

Line 10 (whole):

- A clause appended to a standards line is read back in the whole line: it closes what it opens and replaces the citation it supersedes. Two round fixes of #112 appended to `testing/tests.md` and left an unclosed parenthesis and a doubled citation for the next round to find (#112, R4-2, R4-3)

Line 11 (whole; R2-2's and R2-3's replay clauses):

- A standards sentence that states what the code does (the replay standard's resume clause) changes in the commit of the code it describes, as a doc does, so the standard is never behind the code between two commits of one spec; what the spec taught lands in the retrospective's own commit, as above (#117, decision 6)

---

## prompts/attribution (applied bullet)

Line 6 (whole):

- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
