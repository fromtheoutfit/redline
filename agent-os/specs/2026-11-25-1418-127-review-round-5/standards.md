# Standards for PR #127 Review Round 5

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `10f2630`, before this round's retrospective. For a long file, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did; `[...]` marks what is left out.

---

## workflow/agents (applied bullets, in part)

Line 10 (R5-3, Task 2; R5-1, Task 3; standards item 1):

- A finding of a class an earlier round of the same pull request already fixed is fixed as the class, not as one more instance (the reviewer's 'the same class as R1-4, R2-2 and R3-1' is the signal): name the promise each earlier fix patched, list every member of the class from its source (git-config(1)'s `diff.*` and `core.*` keys, git(1)'s variables), set each against the code and record the table in `shape.md`, and take a mechanism that needs no list where one exists (the gh harness takes out every `GIT_` variable it finds by prefix). [...]

Line 11 (R5-2, Task 4; R5-3, Task 2; standards item 2):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: never `fixed` or `deferred`, so no commit is demanded, its thread stays open for the person unless they defer it to an issue (below), [...]. One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]: a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag; the reviewer's tag is advisory and only marks the review. [...] and the person may defer what is left to them (#126): an option of the finding's call that ends in `defer` carries a drafted issue, the shaper's own or the one `forceAskRules` keeps from the shaper's deferral of the finding, and a pick of it, or a defer typed for the finding, has the run file that draft. [...]

Line 16 (R5-1, Task 3; R5-2, Task 4; R5-3's warning for a named disposition, Task 2; standards item 3):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit [...]; and a stop's message says what its rule asks of the case that reached it [...]; and a cleared link's reason is true on every path that clears it: a revise-only pass said the earlier finding was never recorded, when it only held no record to check it against, until #127, R1-3; and a stop a resume is asked to correct names a correction that clears it for every input that reaches it [...] (#127, R4-4, adjustment 1)

---

## workflow/replay (applied line)

The file's opening line (R5-3, Task 2: the plan approver's and implementer's prompts change only after a reshape that newly leaves a decided fix or accept):

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

---

## testing/tests (applied bullets, in part)

Line 30 (every task: a case per changed surface, with its neighbour):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause [...]

Line 35 (every task: red before green; Tasks 2 and 3: a neighbour pin seen red under a mutation):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. [...] a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on [...]; and a red count a spec records is the harness's own summary line, read off the run [...]

---

## process/docs-gate (applied bullets, in part)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`

---

## process/release (applied bullet, in part)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string [...]

(PR #127 bumped it to `0.5.0` once; this review round adds no bump, as rounds 1 to 4 did not.)

---

## prompts/attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
