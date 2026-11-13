# Standards for PR #94 Review Round 2

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `e788107`, before this round's retrospective: the whole file where it is short, otherwise the bullets the round applies, quoted in part where a bullet is long, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 12 (part):

- A human review pass (`/redline:redline-revise <pr> review <selector>`) sorts a teammate's comment into `fix` (theirs: the shaper returns `decidedBy: "reviewer"` and the workflow maps it to their login), `ask` (the author's) or `none` (asks for nothing), never `defer` and never `decline`: nothing a teammate asked for is deferred or declined by Redline on its own [...]

Line 16 (part):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`) [...]; and a prompt sentence that invites more text into a field the workflow parses (a coverage ref) is checked, in the same change, against every parse of that field, so the prompt keeps the text out of the field or after the parsed token and the parse reads past it: R1-4 kept a partly tracked candidate's issue out of a `finding` ref, which the workflow matches by id alone, and R4-1 had a `duplicate` ref open with the index or the id, a note after it, and widened the target parse, anchored at both ends, to read a leading index token (#86, R1-4, R4-1)

Line 38 (part, the coverage-pass bullet):

- [...] A candidate the verifier left out, gave an unknown outcome, or accounted for with a ref that names no finding becomes a finding of the round as reported (a new id, `correctness`, `unconfirmed`), with a warning, the mirror of carry-forward, so nothing is dropped and nothing is parked; a carried finding the verifier left out is carried as `unconfirmed` for the same reason. [...] The done rule is the workflow's, read off the shaper's decisions (#93): a round is bought by what it finds, not by what it commits; a new correctness finding the shaper fixes, defers or asks about, or a decline the person overrules to a fix, buys the next round whatever the answer and with or without a commit; every other round ends the run, at the handoff when no commit names a finding and after one final nit pass over the fixes when one does [...]

Line 39 (part, the #85 verifier-rules bullet):

- [...] a partly tracked candidate is accounted for by what its remainder became, with the issue named in the finding's description or another outcome's ref, never in a `verified` or `unconfirmed` ref, which the workflow matches by id alone (#86, R1-4), `known` being for one tracked whole [...]

Line 36 (part):

- The workflow checks a result before it acts on it: [...] a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): the shaper's output schema is built per pass, so its enum is that pass's reasons and the rule reasons and a value from the other pass is refused in the shaper's own run, which then decides the finding or asks again with an allowed reason; the workflow's test is the second layer, run after `forceAskRules`, so a call a repository rule covers is judged by the reason the rule gives it (#94, R1-5, R1-12, R1-13), and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Applied: line 16 is the rule R2-2 follows (the kinds sentence changed in the prompt and the agent file alike) and R2-5's fix (the parse reads past a note after the id, as the `duplicate` parse does); line 39 is what R2-5 rewords in the retrospective; line 38 is the minting R2-6 gives a place, and the done rule R2-11 and R2-12 keep; line 36 is what R2-3 extends and R2-9 makes true of `checkWhy`; line 12 is the human pass's values R2-3's schema carries.

---

## workflow/replay (applied bullet)

Line 19:

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). Replay follows the prompt sequence: script path, script text outside the prompts, an agent's label and the agent file's body are not in the key. The `Workflow(<name>)` allow rule does not cover a `scriptPath` launch. Measured headless under `--plugin-dir` on 2.1.322 (#81)

Applied: this round changes `workflows/redline-loop.js` and, in Task 8, `agents/redline-reviewer.md`; the later rounds of this run run under the agent-file edit (`shape.md`, Decision 17).

---

## testing/tests (applied bullets)

- A loop-test mock answers as the real agent would for the run's settings (the post mock returns no comments in a dry run), or the path the setting changes goes untested (#34, R1-7; #37, R1-1); a reshape mock returns what the reshape prompt asks for [...]
- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` [...]
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change [...]
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix.

Applied: every fix task adds its check first and sees it red; Tasks 3, 5, 7 and 15 name the neighbour that stays green; Task 6 adds one reshape key to the shaper mock, which answers what a reshape that breaks its prompt would return; Task 2's fixture pins the underscore beside PR 16's and PR 17's cases, which stay.

---

## scripts/bash-conventions (applied bullet)

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]

Applied: Task 2 changes two patterns and a comment inside the `prior-findings` jq program, not the header, so `docs/scripts.md` stays as it is.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own.

Applied: every task that touches a plugin file carries its Docs entry in `plan.md`; Tasks 3, 4, 5 and 14 update `docs/running.md` in their own commits.

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. [...]

Applied: this PR already carries `0.3.0` (main `0.2.4`), and this round writes nothing a setup rerun carries, so it keeps the version.

---

## prompts/attribution (whole file)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)

Applied: every commit line in `plan.md` follows it.
