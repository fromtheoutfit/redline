# Standards for PR #108 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `81565cc`, before this round's retrospective. A short file is copied whole. For a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 16 (in part, its opening; R2-4):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule [...]

Line 37 (in part, its opening; R2-6):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, [...] a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93) [...]

Line 39 (in part, the clauses on a decided deferral and on what the check demands; R2-3, R2-5):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: [...] and a disposition the person changes away from defer drops the shaper's entry, and the resolve agent's entry beside it, with a warning [...]; a call's decision names none, and is read from what the resolve agent states it ends in, `fix`, `defer` or `accept`, never from the entry or the task beside it, so an entry beside a call stated as a fix or as accepted is dropped with a warning, as beside an override, and what the check demands of a call is its statement alone, except a call a reshape leaves to the person under a rule after its resolve, which nothing demands, as `isDeferral` and the outcomes read it: the stated branch of `needCommits` lost the forced test the clause it replaced carried until #108, R1-8 [...]

Line 46 (in part, its opening; R2-6's one list of the three values):

- A fact an agent states that changes what the run does is checked by the workflow against something the run itself recorded, and a claim it cannot honour is cleared with a warning before anything is posted; it is never trusted on its own and never inferred. [...]

Line 49 (in part, its opening; R2-4):

- Whether an optional step happened is read from the run's record, never from the words of a free-text field an agent fills, and the check never demands it (#100) [...] [...] A list the record is read from is required in its schema and asked for in every prompt that returns it, so an empty one means none, never not asked [...]

---

## workflow/replay (applied bullet)

Line 23 (in part; R2-4 changes one clause of the calls block's ask):

- A new ask in a prompt sits in the block that only the calls it concerns carry, and nowhere else in that prompt, so a call it does not concern keeps a byte-identical prompt and still replays after an update. The schema requires the new key, and the workflow reads an absent one as empty wherever an unchanged prompt can replay an older result. The prompt states the whole ask, so the answer does not depend on the agent file the session loaded, and the agent file gains the ask and changes no other rule, so an older script reading a newer agent's output behaves as it did (#99, `decided` in the resolve prompt's calls block)

---

## testing/tests (applied bullets)

Line 7 (in part, its opening and #99's clause; R2-1):

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); [...] and it returns every key the agent's schema requires, with the value the real agent would give [...]; and what an agent states about its own output is scripted by default as a real agent would state it for what the scenario has it return (the scripted resolve agent states `defer` beside its own deferred entry, `accept` for a call it accepted and `fix` otherwise), so only a scenario about a wrong statement scripts one (#99)

Line 13 (in part, its opening; R2-5's second call site):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1) [...]

Line 28 (in part, its opening and #108's clause; R2-6):

- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; [...] and a clause rewritten to read from a new source is listed with every exclusion the clause it replaces carried (a forced finding, an accepted one, a deferral), each kept and pinned or recorded in the spec as dropped: the stated-fix clause of `needCommits` kept the deferral test and dropped the forced one, unpinned, until #108, R1-8

Line 33 (whole; every task with a check):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54); a pin whose outcome already held before the change cannot be red before the build: it is written with the others, the spec says so, and it is seen red under a mutation of the clause it turns on (#99, a real 'Mitigate' answer, which the old inference already filed)

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

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
