# Standards for PR #94 Review Round 7

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `8739d8b`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 15 (whole):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)

Line 16 (its opening and its last clause):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`): ... and a new disposition is added to every rule that lists the old ones, found by searching for the list itself (`fixed or deferred`): after #93 added decline, the ask-rules block still said a covered finding is 'never fixed or deferred by Redline' until #94, R4-2

Line 37 (its opening and the clause the round applies):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, except, on a reshape, one the round already decided, since the reshape returns only the calls still pending or newly raised (#61, R1-2), a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): ... and a check on a value the shaper returned reads it before any line of the workflow rewrites it (#94, R5-7), never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Line 39 (whole):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, so the shaper's stray entries are dropped with a warning and a reshape's re-sort drops the earlier one; and a disposition the person changes away from defer drops the shaper's entry, while the resolve agent's entry for a decision it planned replaces an earlier one for the same id (#94, R5-9)

Applied: R7-10's log line and its list (15, 39); R7-4, including the skill's grammar table (16); R7-5's check, read before `forceAskRules` (37). The retrospective proposes edits to 37 and 39 and one new bullet.

---

## testing/tests (applied bullets)

Line 11 (its opening):

- An invisible or non-ASCII character a test or a fixture needs is written as its escape (`⁠` in JavaScript and JSON source), never as the character itself. ...

Line 13 (its opening):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); ...

Line 32 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

Applied: Task 7 builds its em dash with `String.fromCharCode(0x2014)` (11); Task 2 pins both final-nit-pass paths (13); every task with a loop check adds it red first (32).

---

## scripts/bash-conventions (applied bullet)

Line 45 (whole):

- A script that cuts text the workflow matches on keeps what the workflow matches: the cut falls at a word boundary, so no token becomes another one (`R5-10` cut to `R5-1`), and the tokens in the part cut off are put back after the cut (the finding ids of a commit subject, in every form the workflow looks for, with the boundaries the workflow's own test uses). The length is stated in the script's comment (#68). Text posted for a person (a reply, the handoff's Commits list) is not taken from the cut: the workflow quotes the whole subject the implementer reported for the commit when it opens with the part the cut kept, and matches only on git's own text (#94, R6-5)

Applied: R7-6 and R7-9 change only which reported subject is quoted. The retrospective proposes a sentence on recognising the cut by its marker.

---

## scripts/guard (applied bullet)

Line 9 (the clause the round applies): "A finding whose fix touches `scripts/checks-template.sh` below its header, or changes the text `redline-setup.sh checks` writes into this repository's `checks.sh` (its header, the template version line, the check block), is deferred the same way: the setup test's last cases regenerate `checks.sh` from `checks.json` and compare it with the committed file, and no role may regenerate it, so such a fix leaves the gate red. The round records the intended lines in its Deferred entry, mitigated by a Known limits line, and a person makes the change, regenerates `checks.sh` and restamps after the run (#7, R1-14; #12, R1-1)."

Applied: R7-2, declined rather than deferred, since it is a simplification with no failure to mitigate (as round 6 declined R6-3 and R6-6); the retrospective proposes saying so.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

Applied: every task that touches `workflows/` or `skills/` carries its entry.

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. ...

Applied: the version stays 0.3.0; the pull request already carries its minor bump and this round changes nothing a rerun writes.

---

## prompts/attribution (whole)

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
