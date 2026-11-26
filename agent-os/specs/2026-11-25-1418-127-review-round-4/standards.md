# Standards for PR #127 Review Round 4

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `20a7603`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied bullets, in part)

Line 10 (R4-1, Task 2; R4-4, Task 4; standards item 1):

- A finding of a class an earlier round of the same pull request already fixed is fixed as the class, not as one more instance (the reviewer's 'the same class as R1-4, R2-2 and R3-1' is the signal): name the promise each earlier fix patched, list every member of the class from its source [...], set each against the code and record the table in `shape.md`, and take a mechanism that needs no list where one exists [...]; and since #75 the rule is a step with fields: every fix the shaper sorts states `cause` (where the cause lives, and `one-place`, `sweep` with what the sweep covered, or `instance`), the verifier states `sameClassAs` in a review that is shown earlier findings, the workflow keeps a link only to a finding its record shows as fixed, and an `instance` fix under a link that stands stops the round at shape; that the cause is where the shaper says, and that a sweep was measured by running and is complete, stay the plan approver's judgement [...] (#105)

Line 11 (R4-1, Task 2; R4-2, Task 3; R4-4, Task 4; standards item 2):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: never `fixed` or `deferred`, so no commit is demanded, [...]. One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]: a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag; the reviewer's tag is advisory and only marks the review. [...] and the person may defer what is left to them (#126): an option of the finding's call that ends in `defer` carries a drafted issue, the shaper's own or the one `forceAskRules` keeps from the shaper's deferral of the finding, and a pick of it, or a defer typed for the finding, has the run file that draft. [...]

Line 16 (R4-1, R4-2 and R4-3: each new warning; R4-4, Task 4: the hold's two wordings after adjustment 1, each naming what its case asks; standards item 3):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit [...]; and a stop's message says what its rule asks of the case that reached it [...]

Line 17 (R4-4, Task 4's clause in `agents/redline-shaper.md`):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words [...], not only in the sentence the finding quoted [...]

Line 47 (R4-4, Task 4):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...]

---

## workflow/replay (applied line)

The file's opening line (R4-4, Task 4: a reshape prompt that names no left decided finding stays byte-identical): "A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch."

---

## testing/tests (applied bullets, in part)

Line 35 (every task):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. [...] a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on [...]; and a red count a spec records is the harness's own summary line, read off the run [...] (the follow-up of #127)

Line 30 (every task):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...]

Line 37 (Task 4's `resume:` pins, unchanged):

- A count a question or a plan states (how many scenarios pass a resume entry, how many sites raise a check) is read off a run of the harness or a search of the source before it is stated, never estimated [...]

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading [...] (#51, R1-2)

---

## process/release (applied bullet, in part)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes [...]; patch otherwise. [...]

This pull request bumped it to `0.5.0`; a review round of the same pull request adds no bump, and this round changes no template body.

---

## prompts/attribution (applied bullets)

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard [...]
