# Standards for PR #94 Review Round 1

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `3d23086`, before this round's retrospective: the whole file where it is short, otherwise the bullets the round applies, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 9:

- The shaper decides, and a person is asked in named cases only (#93): the verifier states what is true and the shaper sorts every finding into `fix`, `decline` (with the reason a teammate reads), `defer` or `ask`. It returns an `ask`, with a story, options and a recommendation, in five cases (the options differ in what the product does or a user sees; the fix changes an assumption, the approach or the architecture the spec agreed; it reaches outside the pull request; two options are defensible with no clear pick; the finding is still unconfirmed after the shaper's second look and serious if true), beside a repository ask rule and a finding on one of Redline's own files. Everything else it decides, a decline included, as `decided by: redline` with its reason. The rule is cases, never a confidence figure, and the workflow checks it: a judgment call whose `why_human` is outside the round's list stops the run at `shape`. The person decides a call in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49). No other role decides a pending call or reopens a decision made

Line 16:

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted: R2-1's reopen changed the candidates block and two paragraphs of the agent file but left the handled-list header and the `knownAs` example saying a fixed match is never re-raised (#80, R3-3); and a prompt sentence that invites more text into a field the workflow parses (a coverage ref) is checked, in the same change, against every parse of that field, so the prompt keeps the text out of the field or after the parsed token and the parse reads past it: R1-4 kept a partly tracked candidate's issue out of a `finding` ref, which the workflow matches by id alone, and R4-1 had a `duplicate` ref open with the index or the id, a note after it, and widened the target parse, anchored at both ends, to read a leading index token (#86, R1-4, R4-1)

Line 17:

- An agent whose words reach GitHub in a comment or a reply says so in its file. The reviewer, the shaper, the resolve agent and the implementer each carry the sentence: 'An identifier that begins with `@` (a decorator, a directive, a docblock tag) is always written in backticks, because a bare `@word` notifies a GitHub account.' The loop test pins it in each file. The workflow neutralises the finder's and the verifier's short fields itself, but a comment's description, a reply, a mitigation or a commit subject is posted as written. The GitHub agent writes none of its own text, so its file does not carry the sentence. A new role whose text is posted gains it too (#87).

Line 36:

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call, except, on a reshape, one the round already decided, since the reshape returns only the calls still pending or newly raised (#61, R1-2), a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93), and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Applied: line 16 is the rule R1-1's fix follows (every wording of the never-raised rule, not only the one quoted); line 17 is the evidence R1-11 is declined on; lines 9 and 36 are what Tasks 5, 11 and 14 keep true, and what the retrospective's item 2 rewords.

---

## workflow/replay (applied bullet)

- A dial that turns a pass off leaves that pass's call and its block out of every prompt: `coverage off` reaches the workflow as `models.coverage` null, and the coverage call, the candidates block and its rules exist only when a pass ran. The loop test proves it per rule, each key phrase of the block being absent from a `coverage off` prompt (#79). Since #93 the off run follows the same model as the covered one, the reviewer finding and verifying alone, so its prompts are no longer those of the run before the pass existed

Applied: R1-1's history-header exception is a rule of the candidates block, so it is added only on a round with candidates, and the loop test pins its absence from a `coverage off` prompt.

---

## testing/tests (applied bullets)

- `tests/loop-test.mjs` also reads `agents/redline-reviewer.md`: each verifier rule a prompt states is pinned by one check that finds a short key phrase, not a whole sentence, so rewording the text around it stays green, in the agent file and in a covered verify prompt, and not in a `coverage off` one, so a rule restated in one place and not the other is red (#80, R3-3) and the off prompt stays as before. [...] A sentence every review prompt carries, with the pass or without it (the kinds; that the verifier states facts and decides nothing, #93), is pinned in the agent file and in both prompts.
- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)
- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site [...]
- `tests/gh-test.sh` over `tests/gh-fixtures/`: the read subcommands of `scripts/redline-gh.sh` [...]
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change [...]
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix.

Applied: every fix task adds its check first and sees it red; Task 11 is R1-5's neighbour (the human pass keeps its own reasons); Task 9's fixture pins the new tail beside PR 16's cases, which stay.

---

## scripts/bash-conventions (applied bullets)

- The header comment is the documentation, in this order: what the script is, usage, environment variables, the output contract, the exit codes. `docs/scripts.md` quotes it verbatim and `docs/contract.md` carries the output contract, so a header change updates `docs/scripts.md` in the same commit (#14). [...]
- A change to what a subcommand selects or prints rewords every description of it in the same commit, found by searching for the old phrase across `README.md`, `docs/`, `skills/` and `agents/` rather than by editing only the `redline-gh.sh` table row that quotes the header [...]

Applied: Task 9 changes the `redline-gh.sh` header's tail list and its copy in `docs/scripts.md` together.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

Applied: every task that touches a plugin file carries its Docs entry in `plan.md`.

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
