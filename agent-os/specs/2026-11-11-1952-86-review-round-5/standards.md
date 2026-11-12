# Standards for PR #86 Review Round 5

The following standards apply to this work. Each is copied as it reads at `dd42671`, before this round's retrospective: whole where the round applies all of it, otherwise the bullets the round applies, as rounds 2 and 4 of this PR did. A long bullet the round cites for one sentence is quoted for that sentence and marked as such.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- Text the workflow escapes for GitHub is pinned as the escaped string the workflow writes, byte for byte, never as the raw input, with one case per way the reading can go wrong: for the set-aside block, a tag inside a code span, a bare tag, a double-backtick span, an unclosed backtick, a backtick left open in the summary that pairs with one in the ref, and each fallback, beside a For the person line that stays raw. The loop test cannot render, so a claim about what GitHub shows is checked once through `gh api markdown -f mode=gfm` on invented text and recorded in the spec (the #85 follow-up spec)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change; a rule a spec states as a list of accepted and refused forms gets a case per form, each turning on one clause of the code and seen red under a mutation of that clause: the #85 follow-up's duplicate-ref parse (`3`, `candidate 3` or `index 3`, any case; the candidate itself or an index out of range shown as written) was pinned by `3` and a lower-case `candidate 2` alone, so dropping `index`, the case flag or the self guard stayed green (#86, R4-2)
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1). A check's name states only what it asserts: #85's result check was named for the round record keeping the dropped entries and the result keeping counts only, asserted neither, and the result keeps the accounting by design, so a change to either stayed green under a name that said otherwise (#86, R2-2)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## workflow/agents (excerpt: the bullet and the sentence this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- (line 22, the last sentence of the bullet on an agent that could not read what it was asked to relay) The run record's `detail.checker` then holds the copy the workflow read (`status` `read`, `reason` empty), and the warning is where the checker's own reason is kept; a change that rewrites a result before a call site stores it rewords every sentence that says what the record keeps, as #55 left the README saying `detail.checker` kept whatever the checker returned (#56, R1-1)
- The verifier's rules from the #817 rerun (#85). An issue or a teammate's comment that tracks only part of a candidate leaves the remainder to be judged as its own candidate: one caused in the diff is a finding naming the issue, `knownAs` empty, accounted for as `finding`, unless another rule puts it elsewhere as it would any candidate (a collapse, a refutation, the disproportionate rule, or For the person for a removed guard or a candidate plausible but not reproduced), so a neighbouring issue never decides where a remainder goes (#86, R2-1); a partly tracked candidate is accounted for by what its remainder became, with the issue named in the finding's description, the For the person line or another outcome's ref, never in a `finding` ref, which the workflow matches by id alone (#86, R1-4), `known` being for one tracked whole; two candidates are not one because one issue's title fits both. A refutation answers the candidate's claim, and its ref states that claim and the evidence against it; evidence for a neighbouring claim, or a comment or docblock stating intent, does not refute, and such a candidate goes under For the person. A guard this pull request removed is never disproportionate: a candidate the base branch handled and the PR stopped handling goes under For the person naming the removed line. Every candidate that is neither a finding nor a For the person entry is listed after For the person in the set-aside block, a collapsed `<details>` headed `Candidates set aside (N): collapsed, already tracked or dropped`, by one rule (`LISTED_ELSEWHERE`), never a list of outcomes, so an outcome added later is listed too; "dropped" means `refuted`, `outside` or `disproportionate` and nothing wider. One line each, with the candidate's own file, line and summary, whole, so a refutation that answers another claim shows as a mismatch, then the outcome and the ref (`no reason given`, with a warning, when none): a `known` line names the issue, and a `duplicate` of another candidate's index also gives that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide: the accounting sentence, in the verify prompt and the agent file, has a duplicate's ref open with the index of the candidate or the id of the finding it collapses into, anything meant for the reader after it, and the workflow reads the target from a leading index token (`3`, `candidate 3` or `index 3`, any case) whatever follows it, so a note after the index keeps the target (#86, R4-1); nothing set aside, no block. Inside the block, `&` then `<` are escaped outside code spans, read over the line's whole text as GitHub pairs backtick runs (equal lengths; an unclosed run is plain text), so no tag ends the block or opens another; a span is left as written, since GitHub shows an entity inside one literally, and a text holding a newline or a backslash before a backtick is escaped whole. For the person and finding lines are not escaped, a known gap. The handoff carries the block of the last round that ran the pass, naming it; earlier rounds' blocks stay in their own bodies (the #85 follow-up spec). The line is built by `personLine`, as a For the person line is, so it opens with the backticked place, never a finding id, and `redline-gh.sh prior-findings` never reads it back (#86, R1-3)

---

## workflow/replay (excerpt: the bullet this round applies)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)

---

## scripts/guard (excerpt: the bullet this round applies)

# The guard

`scripts/redline-guard.sh` is a default-deny allowlist per role, and every change to it is proven by a row in `tests/guard-cases.tsv`.

- An agent's prompt tells it the shape of a command the guard accepts: no `$`, no backticks, no process substitution, one command per call, redirection only into the temp directory. When a prompt and the table disagree, the table wins and the prompt is fixed

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
