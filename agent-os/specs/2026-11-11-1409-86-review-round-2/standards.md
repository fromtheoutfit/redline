# Standards for PR #86 Review Round 2

These standards apply to this work, as they read at shaping time (`fd65cb4`). The long files are cut to the bullets this round applies. Each excerpt sits under its file's own title and opening line.

---

## workflow/agents (excerpt: the bullets this round applies)

# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted: R2-1's reopen changed the candidates block and two paragraphs of the agent file but left the handled-list header and the `knownAs` example saying a fixed match is never re-raised (#80, R3-3)
- The verifier's rules from the #817 rerun (#85). An issue or a teammate's comment that tracks only part of a candidate leaves the remainder to be judged as its own candidate: one caused in the diff is a finding naming the issue, `knownAs` empty, accounted for as `finding`; a partly tracked candidate is accounted for by what its remainder became, with the issue named in the finding's description, the For the person line or another outcome's ref, never in a `finding` ref, which the workflow matches by id alone (#86, R1-4), `known` being for one tracked whole; two candidates are not one because one issue's title fits both. A refutation answers the candidate's claim, and its ref states that claim and the evidence against it; evidence for a neighbouring claim, or a comment or docblock stating intent, does not refute, and such a candidate goes under For the person. A guard this pull request removed is never disproportionate: a candidate the base branch handled and the PR stopped handling goes under For the person naming the removed line. Every `refuted`, `outside` and `disproportionate` candidate is listed after For the person in a collapsed `<details>` block, one line each with the candidate's own file, line and summary, unedited and whole, so a refutation that answers another claim shows as a mismatch, then the outcome and the reason (`no reason given`, with a warning, when none); no drops, no block. The handoff carries the block of the last round that ran the pass, naming it; earlier rounds' drops stay in their own bodies. The line is built by `personLine`, as a For the person line is, so it opens with the backticked place, never a finding id, and `redline-gh.sh prior-findings` never reads it back (#86, R1-3)

How this round applies them:

- The first bullet (#80, R3-3) is why Task 2 changes line 37 of the agent file as well as the two lines the finding named.
- The second bullet states the rule without R2-1's condition. Its edit is proposed in `shape.md`, Standards retrospective item 1.

---

## workflow/replay (excerpt: the dial bullet)

# Replay

A relaunch replays every agent before the stopping point from cache, so every prompt before that point is byte-identical between the first launch and the relaunch.

- A dial that turns a pass off keeps every prompt byte-identical to the run before the pass existed: `coverage off` reaches the workflow as `models.coverage` null, the coverage call and the candidates block exist only when a pass ran, and the loop test proves it by running every pre-existing scenario under the off value, so every earlier check holds unchanged (#79)

How this round applies it: R2-1's prompt text enters `candidatesBlock`'s branch with candidates only. The new key-phrase check asserts its absence from a `coverage off` prompt.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- `tests/loop-test.mjs` also reads `agents/redline-reviewer.md`: each verifier rule a prompt states is pinned by one check that finds a short key phrase, not a whole sentence, so rewording the text around it stays green, in the agent file and in a covered verify prompt, and not in a `coverage off` one, so a rule restated in one place and not the other is red (#80, R3-3) and the off prompt stays as before. #85's three rules (partly tracked, a refutation answers the claim, a removed guard) are the first; the issue named a structural test of the agent file that did not exist (#85). A sentence only the agent file states, because its prompt counterpart is left as it was so a `coverage off` prompt is unchanged, is pinned in the agent file alone: the known-finding check's opening, narrowed to what is tracked in full (#86, R1-1)
- A change that touches a tested surface adds a case in the same commit: a guard row, a loop check, a prefs case, a gate case or a setup case, and a row beside it for the neighbouring decision that must not change
- A case named for a boundary asserts the boundary itself: one that says it checks a header's last line matches the last non-blank line of the output, not text a few lines before it, or a cut between the two still passes (#34, R2-1)
- A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

How this round applies them:

- The key-phrase bullet and the tested-surface bullet: R2-1's fifth key-phrase entry.
- The boundary bullet: R2-2's check is named for what it asserts. Its generalisation is proposed in `shape.md`, Standards retrospective item 2.
- The red-first bullet: R2-1's entry is seen red before its wording lands, and R2-2's check is seen red under the mutation the finding describes.

---

## process/docs-gate (excerpt: the bullets this round applies)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- The entries are written at shaping time, one per touched file, in `plan.md`: in the task that touches the file (as point 7 of the unattended section has a Redline shaper write them) or together under one Docs entries heading (as the #13 spec did); either placement meets this rule, and the gate confirms each names its commit or its reason (#51, R1-2)
- In a Redline run the shaper writes them from the unattended section's point 7, so the round's commits carry the README or `docs/` edit; the plan approver bounces a plan missing one; the reviewer reports a change with no entry as a nit with the fix "update section X of the README" or of `docs/<file>`
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

How this round applies them: Task 2 updates `docs/running.md` "Rounds" step 1 and "The coverage pass" in its own commit, and says why the README's "What a clean run means" does not change. Task 3's plugin file ends unchanged.

---

## process/release (excerpt: the bump bullet)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

How this round applies it: the PR already carries its patch bump to `0.2.2`, and this round changes nothing a setup rerun writes (`shape.md`, Decision 3).

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
