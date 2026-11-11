# Standards for PR #86 Review Round 1

The following standards apply to this work, as they read at shaping time (`beb1913`). The long files are excerpted to the bullets this round applies, each excerpt under its file's own title and opening line.

---

## workflow/agents (excerpt: the bullets this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted: R2-1's reopen changed the candidates block and two paragraphs of the agent file but left the handled-list header and the `knownAs` example saying a fixed match is never re-raised (#80, R3-3)
- The coverage pass is the finder and the reviewer the verifier (#79): the built-in `code-review` skill runs over the whole pull request at the round's head on every whole-PR and fix-diff round, since it is stochastic and attends to what moved, so each pass is a sample and the manual loop it replaces ran one per round. The reviewer verifies its candidates and runs no discovery pass of its own over the PR; it keeps the checks its prompt names by rule (scheduled and queued overlap, the Docs nit, the Version nit) and the fix-diff recheck, and accounts for every candidate with one of a fixed set of outcomes (`finding`, `forThePerson`, `duplicate`, `settled`, `known`, `refuted`, `outside`, `disproportionate`). The finder never returns an empty list, so the verifier's collapse is the run's stop rule: the prompt defines new (not collapsed into a finding already reported, settled in an earlier round, carried, or tracked elsewhere); `fixed` is the one disposition a candidate may reopen: a candidate that matches an earlier finding marked fixed but that the verifier reproduces or traces at the round's head is new, reported as a finding of this round with the earlier id named, so a fix that did not fully land keeps the run going under `maxRounds`, while a re-sampled finding the fix did close no longer reproduces and settles (#80, R2-1); a reopened finding carries no `knownAs`, since the workflow counts a finding with one as already tracked and a round of those confirms nothing new, and every sentence the verifier reads states the reopen rule, the handled-list header of an earlier run's findings included, which names the exception only when the pass ran, so a `coverage off` prompt is as before (#80, R3-3); a `decided` finding stays settled whatever its commits, since an applied decision is often a deliberate keep or mitigation: a candidate that still reproduces one goes under For the person naming the earlier id and is accounted for as `forThePerson`, never as a finding, so the run still ends (#80, R3-4), the run ends when a round confirms no new correctness finding, and the workflow lists an unaccounted candidate under For the person as reported, with a warning, the mirror of carry-forward. Two guards keep the finder's wider net out of the plan: a candidate anchored outside the diff is never a finding, and one that needs implausible conditions to bite is disproportionate and dropped with that word. What the verifier would not act on but a person should see goes under `### For the person`, no id, never shaped, carried into the handoff, and never read back as a finding, since `redline-gh.sh prior-findings` reads only lines that open with a finding id. The verifier is shown the PR's earlier runs' handled findings on every round that ran a coverage pass, not only on the whole-PR round, since the pass samples the whole PR at every head and can re-sample a finding an earlier run deferred or decided; the carry-forward list stays on the first round (#80, R1-2). The count sentence counts a candidate where the round puts it. Under `correctness only`, a nit reported from a candidate is `forThePerson` and listed there, whether or not it carries a `knownAs`. Otherwise a finding listed under Already tracked is `known`. A `finding` entry whose ref names no finding of the round is listed under For the person as reported, like an unaccounted candidate. The findings file keeps the candidate list beside the accounting its indexes point into (#80, R1-4, R1-5)
- The verifier's rules from the #817 rerun (#85). An issue or a teammate's comment that tracks only part of a candidate leaves the remainder to be judged as its own candidate: one caused in the diff is a finding naming the issue, `knownAs` empty, accounted for as `finding`; a partly tracked candidate is accounted for by what its remainder became, `known` being for one tracked whole; two candidates are not one because one issue's title fits both. A refutation answers the candidate's claim, and its ref states that claim and the evidence against it; evidence for a neighbouring claim, or a comment or docblock stating intent, does not refute, and such a candidate goes under For the person. A guard this pull request removed is never disproportionate: a candidate the base branch handled and the PR stopped handling goes under For the person naming the removed line. Every `refuted`, `outside` and `disproportionate` candidate is listed after For the person in a collapsed `<details>` block, one line each with the candidate's own file, line and summary, unedited and whole, so a refutation that answers another claim shows as a mismatch, then the outcome and the reason (`no reason given`, with a warning, when none); no drops, no block. The handoff carries the block of the last round that ran the pass, naming it; earlier rounds' drops stay in their own bodies. The line opens with the backticked place, never a finding id, so `redline-gh.sh prior-findings` never reads it back

---

## workflow/replay (excerpt: the bullets this round applies)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)
- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/loop-test.mjs` also reads `agents/redline-reviewer.md`: each verifier rule a prompt states is pinned by one check that finds a short key phrase, not a whole sentence, so rewording the text around it stays green, in the agent file and in a covered verify prompt, and not in a `coverage off` one, so a rule restated in one place and not the other is red (#80, R3-3) and the off prompt stays as before. #85's three rules (partly tracked, a refutation answers the claim, a removed guard) are the first; the issue named a structural test of the agent file that did not exist (#85)
- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A comparison of two command outputs passes when both are empty, so a harness pins at least one output against a literal before it compares outputs with each other (#6); a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## process/docs-gate (excerpt: the bullets this round applies)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- No commit exists at shaping time: a plan's entry names the README section, or the `docs/` file and section (and template), its task updates, or the reason there is no reader-facing change, and its commit is that task's own, named in `plan.md`'s As built when it lands and confirmed at the gate. The plan approver checks the section or the reason only: its check 8 first asked for the commit too, which no reshape could supply, so a plan written as point 7 says could be bounced until the run ran out of adjustments (#51, R1-3)

---

## process/release (excerpt: the bullet this round applies)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## process/standards-retrospective

# Standards retrospective

Every spec ends by asking what it taught, mechanically, and the answer lands in a standard or is recorded as "no changes".

- Gate step 12 in `.claude/commands/agent-os/shape-spec.md`: list every Decision in `shape.md`, every deviation in `plan.md`'s As built, and every check that went red and was fixed by learning something; classify each as already in a standard, missing, or contradicting one
- Approved edits land in their own commit, separate from the spec's code. Code that enforces a new rule (a guard-cases row, a loop-test check) follows in its own commit with the case proving a violation fails
- In a Redline run the shaper proposes the edits under `## Standards retrospective (proposed)` in `shape.md`, the standards approver approves the list, and the implementer applies it in one commit
- When nothing changes, `shape.md` records "Standards retrospective: no changes" under Decisions, so the absence is deliberate and visible
- A round a person finishes by hand, outside the run (a pending decision applied, a deferred full fix made), still owes its record in the same PR: the round's `shape.md` records the decision with its owner and commit, its proposed retrospective lands or reads 'Standards retrospective: no changes', and every standard that named the change pending says what landed, not only the README and `docs/`: `6ef58a9` applied R3-4 with neither record, and `a70c243` narrowed the guard while `scripts/guard.md` still called it pending, until the next round found both (#80, R4-1, R4-2)
- A standards edit keeps the file's headings: they diff empty against `main` unless the spec names the section it adds, renames or removes
- `index.yml` lists every standard and nothing else; a new file is added to it in the same commit, alphabetised by folder and file

---

## prompts/attribution

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. The guard refuses a commit message that carries one (`ATTRIBUTION` in `scripts/redline-guard.sh`), after stripping path spellings such as `.claude/` and `CLAUDE.md`
- A repository's CLAUDE.md gets the paragraph from `templates/claude-md-git-sentence.md`, so a model reading its no-attribution rule does not take Redline's label for attribution
- This repository's own commits, issues and specs follow the same rule; the plugin manifest names its author, who is a person
- An agent prompt never says which model is running; a role is named by what it does (reviewer, shaper, checker)
