# Standards for PR #108 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `253052a`, before this round's retrospective. A short file is copied whole. For a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 9 (in part; the four endings, which sort this round):

- The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. Since #95 these are four endings, and `defer` is its own: an item of any kind that is worth doing and not in this pull request, with a mitigation only when a cheap one exists inside it, and always with a drafted issue (a title, what was found, why it is not fixed here, the fix proposed) that the run files; `decline` is for what is not worth doing (the claim is wrong, the conditions will not occur, the spec chose otherwise, or it could not be confirmed) and never points at follow-up work, so the proportionality rule and a refactor that fails a small-refactor test end in `defer`. [...]

Line 16 (in part, its opening and the clause on a condition; R1-2):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words [...]; and a rule the prompt states only on some rounds (with candidates) is stated with the same condition wherever it is restated [...]

Line 37 (in part, its opening; R1-5's checks):

- The workflow checks a result before it acts on it: [...] and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, the agent the error is about [...]

Line 39 (in part, the clauses on a decided deferral and on what the check demands; R1-3, R1-8):

- [...] and a decided finding is a deferral only when its decision made it one: an override names its disposition and that decides, `defer` making it one and `fix` or `accept` never, whatever entry the resolve agent returns beside it (an override to fix beside a filled entry was filed and its fix not demanded until #103, R1-11); a call's decision names none, and is read from what the resolve agent states it ends in, `fix`, `defer` or `accept`, never from the entry or the task beside it, so an entry beside a call stated as a fix or as accepted is dropped with a warning, as beside an override, and what the check demands of a call is its statement alone: until #99 a call was a deferral through the resolve agent's own entry when its mitigation field was filled or the finding had no planned task with files, so a fix beside a stray filled entry was filed as the person's deferral with its fix not demanded, and a deferral worded with nothing beside a planned task was demanded as a fix; [...] and within one agent's list a finding has one deferred entry, the first returned, any later one dropped with a warning [...]

Line 46 (in part; R1-3, R1-5, R1-7):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...] and every agent the list reaches is shown the same one, built where the dispositions are (`effectiveDispositions`) [...]; and a statement held to a record the same agent returned is a consistency check: it stops an output that contradicts itself and cannot see one that is wrong throughout, a 'Mitigate' answer planned and stated as a full fix, which README Known limits says; a check that would see it compares against something stated before that agent ran (#99)

---

## workflow/replay (applied bullets)

Line 21 (whole; Unattended answer 9):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

Line 23 (whole; R1-2):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. The schema requires the new key, and the workflow reads an absent one as empty wherever an unchanged prompt can replay an older result. The prompt states the whole ask, so the answer does not depend on the agent file the session loaded, and the agent file gains the ask and changes no other rule, so an older script reading a newer agent's output behaves as it did (#99, `decided` in the resolve prompt's calls block)

---

## testing/tests (applied bullets)

Line 7 (whole; R1-8's mock key):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for, which leaves out a call the round already decided, or a check added to the reshape goes untested (#61, R1-2); it gives a field the shared checks read only when the reshape prompt asks for it (`secondLook`, #94, R9-3); and it returns every key the agent's schema requires, with the value the real agent would give: the scripted shaper lists a task's files for a fix and for a deferral with a mitigation and none otherwise, so a scenario with no task scripts an empty list (#100); and what an agent states about its own output is scripted by default as a real agent would state it for what the scenario has it return (the scripted resolve agent states `defer` beside its own deferred entry, `accept` for a call it accepted and `fix` otherwise), so only a scenario about a wrong statement scripts one (#99)

Line 13 (whole; R1-2's neighbour):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); and a call site pinned only with input the function returns unchanged is not pinned: the handoff's Deferred line under a repository rule was checked with `title R1-2`, which `postedText` returns as it is, so dropping the call there stayed green until a title with a tag and an `@` was pinned (#89, R3-2); and a message the workflow words two ways by a condition is pinned in each wording: the commit-of-its-own warning's decided form was pinned by no check until #103, R1-12

Line 14 (whole; the new checks read a prompt that may be absent as `''`):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93). A list that may be absent is read as `[]` for the same reason, and a mutation run that prints no count crashed: it is reported as a crash, and the scenario that threw is found before the mutation is called pinned (#95)

Line 28 (in part, its opening; every task's case and neighbour):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 33 (whole; red before green):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

---

## process/docs-gate (applied bullets)

Line 5:

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason

Line 8:

- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)

Line 16:

- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (applied bullet)

Line 5:

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet)

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
