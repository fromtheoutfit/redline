# Standards for PR #94 Review Round 8

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `754aa67`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 9 (the sentence the round contradicts, R8-4):

- ... The person decides a call in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49). ...

Line 10 (whole; R8-4 gives a finding on Redline's own files the same kind):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: never `fixed` or `deferred`, so no commit is demanded, its thread stays open for the person, a human pass's refusal of `defer` is never tripped, and its reply opens `left to the author under repository rule <id>`, which `redline-gh.sh prior-findings` reads as the disposition `left`. One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned (a human pass's `none`, a comment that asks for nothing, is left as it is, since there is no change to leave to the person; #52, R1-4): a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag; the reviewer's tag is advisory and only marks the review. A later numeric limit (#25) forces there too

Line 15 (whole; R8-7):

- A message the run shows the person says when it fires in the words of the decision behind it, so a fix that widens or narrows the condition rewords the message and the loop checks that pin it in the same commit: R1-3 let the checker-text warning fire on a round whose gate exited 1, and it still said 'on a passing gate' next to 'still failing, as at baseline' (#37, R2-1)

Line 37 (its opening and its last clauses; R8-5):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, except, on a reshape, one the round already decided, since the reshape returns only the calls still pending or newly raised (#61, R1-2), a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): ... and a check on a value the shaper returned reads it before any line of the workflow rewrites it (#94, R5-7), a field the shaper's rules ask for is read by a check, a warning at least, or not asked for: `secondLook` rode along unread until #94, R7-5, and a miss is a warning, since a Redline round's shape stops only on the ask cases and a decline's reason; never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Line 38 (whole; R8-3):

- A finding's id is unique in its round: every id the workflow gives (a rename of a reviewer's id outside the round's form, a minted candidate, a carried finding) is numbered after the highest id of the round's form in use, since coverage refs, inline comments and replies are all matched by id (#94, R4-6); an id of the round's form the reviewer repeats is one of them: the second and later findings with it are renamed to the next free number with a warning, and a ref to the id stays with the first (#94, R5-5)

Line 39 (its opening; R8-6):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, ...

Line 40 (whole; R8-4's entry once its call is decided):

- A value a later pass of a loop rebuilds keeps what an earlier pass recorded once the run rests on it: the round's commits read every implement attempt's report, not the repair's alone (#94, R7-9), and a repository rule's forced entry whose call is decided stands through a reshape (#94, R7-7)

Line 42 (the clause the round applies; R8-2):

- The coverage pass is the finder and the reviewer the verifier (#79): ... A candidate the verifier left out, gave an unknown outcome, or accounted for with a ref that names no finding becomes a finding of the round as reported (a new id, `correctness`, `unconfirmed`), with a warning, ... the mirror of carry-forward, so nothing is dropped and nothing is parked; ...

Line 43 (the clause on the duplicate's target; R8-2 keeps it):

- ... the accounting sentence, in the verify prompt and the agent file, has a duplicate's ref open with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it, and the workflow reads the target from a leading index token (`3`, `candidate 3` or `index 3`, any case) whatever follows it, so a note after the index keeps the target (#86, R4-1)

---

## testing/tests (applied bullets)

Line 13 (its opening):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1); ...

Line 32 (whole):

- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

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
