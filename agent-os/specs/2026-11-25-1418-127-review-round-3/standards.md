# Standards for PR #127 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `b696aee`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/replay (applied bullets)

The file's opening line: "A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch."

Line 6 (R3-4, Task 2; standards item 1):

- Decisions, approved plans, selected findings and the answers to deferred drafts enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial, `args.deferrals` at a stop check, at filing and in the text posted after it); a prompt before that point never mentions them; and a stop takes only a decision whose prompt comes after it, so a disposition override, which the round's first resolve applies, is taken only at a stop the round reaches before that resolve: a later stop of the round (a reshape after a bounced plan, a draft the resolve agent wrote) takes none and lists no declines (#94, R3-7, stated then as no plan approver having run; #95)

---

## workflow/agents (applied bullets, in part)

Line 11 (R3-6, Task 4; R3-10, Task 5; standards item 2):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: never `fixed` or `deferred`, so no commit is demanded, [...]. One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]: a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag; the reviewer's tag is advisory and only marks the review. [...] and the person may defer what is left to them (#126): an option of the finding's call that ends in `defer` carries a drafted issue, the shaper's own or the one `forceAskRules` keeps from the shaper's deferral of the finding, and a pick of it, or a defer typed for the finding, has the run file that draft. That is the one end of a left finding the workflow acts on: the kind stays `left`, no task is planned and nothing is demanded, the reply keeps its opening and closes with where the draft went, and the thread is resolved once the draft is filed. [...]

Line 16 (R3-8, Task 10; R3-11, Task 12):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit [...]; and a stop's message says what its rule asks of the case that reached it [...]; and a cleared link's reason is true on every path that clears it [...] (#127, R1-3)

Line 17 (R3-2, Task 7; R3-3, Task 8; standards item 4):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words [...], not only in the sentence the finding quoted, and every other wording of the same rule [...]; and a key an agent returns inside another object is stated with its place in every sentence that tells the agent to write it, the prompt's ask, the agent file and the template alike, is shown in that place by a return example, and is named by its full path in the stop that reads it, which says where it found one a level out [...] (the follow-up of #127)

Line 31 (R3-5, Task 3; standards item 3):

- An id the workflow mints beside the reviewer's is numbered after the highest in use, never by count [...]. When the workflow renames an id the reviewer returned, every ref to it in the same result (a coverage `finding` or `duplicate` entry) is renamed with it before anything reads the refs, or the entry looks like one naming no finding (#80, R2-3); [...]

Line 47 (R3-5, Task 3):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...]

---

## testing/tests (applied bullets, in part)

Line 35 (every task):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. [...] a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on [...]; and a red count a spec records is the harness's own summary line, read off the run [...] (the follow-up of #127)

Line 30 (every task):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 37 (Task 5's `resume:` pins):

- A count a question or a plan states (how many scenarios pass a resume entry, how many sites raise a check) is read off a run of the harness or a search of the source before it is stated, never estimated [...]

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. [...] (#51, R1-3)

---

## process/release (applied bullet, in part)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

This pull request bumped it to `0.5.0`; a review round of the same pull request adds no bump, and this round changes no template body.

---

## prompts/attribution (applied bullets)

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
