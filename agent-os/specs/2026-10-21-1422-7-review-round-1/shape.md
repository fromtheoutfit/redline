# PR #7 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The ten findings of Redline round 1 on PR #7, the gate stamp (first half of #6). The findings are in `redline/round-1-findings.json`, and the review was posted to the PR.

- **R1-1** · correctness · Point 11 does not defer a fix that changes how this checkout's hash is computed.
- **R1-2** · nit · Point 11's `defer` for `checks.sh` contradicts rule 7 of `agents/redline-shaper.md`.
- **R1-3** · nit · Gate step 6 says about 20 seconds; the `checks.sh` header records 29.
- **R1-4** · nit · Upgrading says "stamped once", but a PR branch cut before the stamp is refused too.
- **R1-5** · nit · The template says to restamp "with the command in the TODO line", which stamping removes.
- **R1-6** · correctness · Gate selection can switch silently to the plan-template decoy (needs a decision).
- **R1-7** · nit · `stamp ... --steps` with no value exits 1 silently.
- **R1-8** · nit · The precheck says "step 1" for section 1 after the renumbering.
- **R1-9** · correctness · The allow rule pre-approves `stamp`, the step reserved for a person (needs a decision).
- **R1-10** · nit · `differs` in the gate test passes when the mutated copy fails to parse.

Scope is these findings and nothing more.

## Investigation

### Already known?

- `redline-gh.sh issues-search gate` lists only #6 (this feature) and #1 (planners beyond Agent OS). Neither tracks any of these findings.
- `redline-gh.sh pr-comments 7` holds only this round's review.
- The PR's only other round folder, `agent-os/specs/2026-10-21-1359-7-review-round-1/` (an earlier launch, committed in 6adcf2b), holds a review and findings R1-1 to R1-7 but no `shape.md`, so no finding there has a disposition. Every finding is new.

### R1-1

Confirmed by reading.
- The guard lets the implementer edit `scripts/redline-gate.sh` in this checkout (`tests/guard-cases.tsv:332`, under `# @cwd PLUGIN`). It refuses it `Edit .claude/redline/checks.sh` (`:368`) and `redline-gate.sh stamp` (`:296`).
- `tests/gate-test.sh:232` runs `check "$PLUGIN"` as its last case, and `checks.sh` runs the gate test as its `gate` check.
- A change to the hash definition in `PARSE` (`scripts/redline-gate.sh:67-167`) or to the stamp line (`:271`) therefore turns the round's gate red, and only a restamp turns it green again.
- The implementer's only exit is `blocked`, which `workflows/redline-loop.js:1351-1352` turns into a stage error.
- Point 11 (`.claude/commands/agent-os/shape-spec.md:69`) and Known limits (`README.md:147`) name only a change to the gate's backticked text.

### R1-2

Confirmed by reading.
- `agents/redline-shaper.md:25` (rule 7, "Rules that override everything else") says a finding on `.claude/redline/` is `ask`. Its self-hosted exception names only `scripts/redline-guard.sh` and `hooks/hooks.json`.
- Point 11 says the same holds for `.claude/redline/checks.sh`, which makes such a finding `defer`.
- The original spec chose `defer` (see Unattended answers), so rule 7 is the text that is wrong.

### R1-3

Confirmed.
- `shape-spec.md:246` ends "About 20 seconds on 2026-10-21".
- `.claude/redline/checks.sh:24` says "Baseline on 2026-10-21: 29 seconds".
- The sentence is prose outside backticks inside the gate section, so editing it does not move the hash. `tests/gate-test.sh:124-125` pins exactly this ("an edit to the dated timing sentence"), on the fixture's copy of the line.

### R1-4

Confirmed by reading.
- The precheck reads `checks.sh` from the checkout: `scripts/redline-gate.sh:298-301`, called from `skills/redline/SKILL.md:73`.
- Items 3 to 5 of SKILL.md section 4 require that checkout to be the PR's head branch, clean, at the pushed head. So a branch cut before the stamp commit carries no stamp and is refused with "carries no gate stamp".
- `README.md:32` says nothing about such branches.

### R1-5

Confirmed.
- `scripts/checks-template.sh:32` says "restamp it with the command in the TODO line".
- `STAMP` (`scripts/redline-gate.sh:191-194`) replaces that TODO line with the stamp. A restamp is only ever needed in a file that is already stamped, so the line it points to is gone by then.
- `.claude/redline/checks.sh:38-39` writes the command out instead.

### R1-6

Confirmed by reading; the question is real.
- Pass 2 (`scripts/redline-gate.sh:108-121`) takes the first "verification gate" heading whose section holds a `1.` line. A heading inside a column-0 fence counts.
- In this repository, `## Task N: Verification Gate` (`shape-spec.md:202`, inside the fence from 179 to 209) comes before the real gate at 234. It is skipped today only because its section is prose.
- `stamp` prints only the stamp line (`:283`). `check`'s stderr lines name the file, not the heading (`:302-322`), and the skill shows only that stderr line (`SKILL.md:73`). The heading and line appear only in `check`'s JSON `actual`.
- The fixtures cover only prose decoys (`tests/gate-test.sh:64`, `:96`).

### R1-7

Confirmed.
- `bash -c 'set -euo pipefail; set -- --steps; shift 2; echo reached-after-shift'` exits non-zero without printing, so `cmd_stamp`'s `shift 2` (`scripts/redline-gate.sh:241`) ends the script with status 1 and no message.
- The header (`:32-33`) and the README table (`README.md:236`) document exit 2 for "a bad or missing --steps".
- `--steps ""` falls back to the default range and exits 0. That is a bad `--steps` too, under the same line.

### R1-8

Confirmed.
- `skills/redline/SKILL.md:73` says "stop as step 1 does", and `:79` says "which step 1 established". Both mean section 1, "Resolve the repository" (`:13`).
- Since the renumbering, item 1 of section 4 is the gate check itself.
- The original plan's Task 5 (`agent-os/specs/2026-10-21-1329-6-gate-stamp/plan.md:99`) says "as section 1 does".

### R1-9

Confirmed by reading; the question is real.
- `templates/settings.allow.json:15` and `.claude/settings.json:7` allow `Bash(/*/scripts/redline-gate.sh *)`, `stamp` included, for every session where the guard is inert.
- `SKILL.md:82` reserves stamping for a person.
- The original plan's Task 4 (`plan.md:94`) gives the rule's purpose as "so the precheck never prompts", and says nothing about `stamp`.
- The sibling rules for `redline-gh.sh` and `redline-prefs.sh` are blanket too.
- `.claude/settings.json` is one of Redline's own files, refused to every role (`tests/guard-cases.tsv:366`).

### R1-10

Confirmed by reading.
- `sha` (`tests/gate-test.sh:50`) sends stderr to /dev/null and prints nothing when `extract` exits 1.
- `differs` (`:53`) passes on any inequality, so an empty output passes against any pinned hash.
- The cases at `:137`, `:139`, `:141` and `:143` have no follow-up assertion on the mutated file.
- The standard's bullet on empty outputs (`agent-os/standards/testing/tests.md`) covers only the case where both sides are empty.

### Nothing in this round moves the gate hash

- None of the planned edits touches a backticked span inside the gate section (`shape-spec.md:234-256`), the parser, or the stamp format. Point 11 (line 69) sits outside the section. R1-3's edit is prose.
- `RANGE` (`scripts/redline-gate.sh:64`) takes the first `(gate steps` parenthetical in the file, which is point 7's. The plan forbids adding another.
- The gate test's last case proves the hash did not move.

## Unattended answers

- **Scope.** The ten findings above. Evidence: the findings JSON in the invoking prompt, also at `redline/round-1-findings.json`.
- **Visuals.** None; this is a shell-script and documentation change.
- **References.** See `references.md`. Each one is a file opened during shaping.
- **Product context.** `agent-os/product/roadmap.md`, Phase 1 item 7: "Setup and the gate stamp (#6): first the stamp ... Then `/redline:setup`". Every fix keeps to that split; nothing here starts `/redline:setup`.
- **Standards.** `testing/tests`, `scripts/bash-conventions`, `scripts/guard`, `workflow/agents`, `process/standards-retrospective` and `prompts/attribution`, from `agent-os/standards/index.yml`. Full text in `standards.md`.
- **R1-2: is a finding on `checks.sh` in this repository `defer` or `ask`?** Answered by the original spec and the PR description. The disagreeing text, rule 7, is the thing to fix.
  - Original spec, `agent-os/specs/2026-10-21-1329-6-gate-stamp/shape.md`, Investigation: "`.claude/redline/` is refused for every role (guard lines 190 to 192), so no Redline run can restamp `checks.sh`. A finding whose fix changes the gate's backticked text is therefore a `defer` in a run here, like a guard finding (unattended point 11)."
  - PR description: "a Known limits line: a Redline run cannot restamp `checks.sh`, so a finding that changes the gate's backticked text is deferred to a person."
- **R1-1: does a fix that moves the hash through the script need the same route?** Answered by point 11's own reason: "a finding whose fix changes the backticked text of the Verification Gate needs a restamp that no role may write, so it is `defer` too". A hash-definition or stamp-format change needs the same restamp, so the same reason applies. The rule's wording is narrower than its reason, and that is the finding to fix.
- **R1-3: where does the baseline time live?** `agent-os/standards/testing/tests.md`: "The gate records its baseline time in `.claude/redline/checks.sh`'s header". The gate text's second copy is what drifted.
- **R1-7: what should a missing `--steps` value exit with?** The script's own header, `scripts/redline-gate.sh:32-33`: "stamp 0, 1 when the file has no gate, 2 on a bad or missing --steps". The code disagrees, so the code is fixed. `agent-os/standards/scripts/bash-conventions.md` agrees: "Usage errors exit 2 with a one-line reason on stderr".
- **R1-8: what does "step 1" mean there?** The original plan's Task 5: "stop with 'this repository is not set up for Redline yet' as section 1 does".
- **R1-6 and R1-9 are not answered by the evidence.**
  - R1-6: the PR description and the script header state the rule, the first qualifying heading. They do not say what should happen when two headings qualify, or whether the choice must be visible.
  - R1-9: the original plan states why the rule exists ("so the precheck never prompts"). It does not say whether `stamp` should be pre-approved.
  - Both go to the person.

## Decisions

- **R1-1: fix.** Extend point 11 (`shape-spec.md:69`) and the Known limits line (`README.md:147`). A fix in `scripts/redline-gate.sh` that changes how the hash is computed or how the stamp line is written is `defer`, and a person changes it and restamps. Both edits sit outside the gate section, so the hash does not move. Proven by the gate test's last case.
  Decided by: redline
- **R1-2: fix.** Rule 7's self-hosted exception in `agents/redline-shaper.md:25` gains `.claude/redline/checks.sh`, and a finding whose fix needs `checks.sh` restamped. It now matches point 11 and the original spec. Outside the self-hosted case rule 7 is unchanged.
  Decided by: redline
- **R1-3: fix.** Gate step 6's continuation line drops the duplicate time and points to the script's header, in prose with no backticks. The hash does not move.
  Decided by: redline
- **R1-4: fix.** One sentence in README Upgrading: a PR branch cut before the stamp commit carries no stamp; merge the base in, or stamp, commit and push, before launching on it.
  Decided by: redline
- **R1-5: fix.** The template's header writes the restamp command out, as this repository's `checks.sh` does. The TODO line stays last, and no other line starts with `# redline-gate:`.
  Decided by: redline
- **R1-6: Which section the gate stamp hashes when two qualify. Chosen: (a) Refuse when two sections qualify.** Planned as Task 10 in `plan.md`.
  - Decision: When more than one "verification gate" section holds a numbered list, the gate script refuses and names both heading lines, so a stamp can never move silently to the plan-template task; a --heading-line override waits until a repository actually needs one.
  - Date: 2026-10-21
  - The question as the shaper put it: when two "verification gate" sections both hold a numbered list, should the parser refuse, prefer one, say which one it hashed, or keep today's first-wins rule?
  - Story: The stamp hashes the first 'verification gate' heading whose section holds a numbered list. Today, in this repository and in Chalkboard, the plan template's 'Task N: Verification Gate' comes first but is prose, so the real gate is hashed. Say someone rewrites that template task as a numbered list, the form Losers League already uses. The next launch refuses with 'gate changed', and the person restamps as the message says. Nothing tells them the stamp now covers the template task instead of the real gate. From then on, adding or changing a step in the real gate never moves the hash: checks.sh silently falls behind, which is exactly the drift the stamp exists to catch.
  - Why it went to the person: spec assumption.
  - Options:
    - (a) Refuse when two sections qualify. Cost: about twenty lines in the parser, plus a new fixture with two qualifying sections and three or four gate-test cases. check needs its own failure reason. It can ship in a run, since only one section qualifies in this checkout and the hash does not move. Effect: the silent switch is gone. A repository that writes the template task as a list is stopped with both heading lines named, and must rewrite one of them before it can stamp.
    - (b) Prefer a section outside any fence. Cost: a few lines in the parser, a fixture and cases. It can ship in a run. Effect: this repository and Chalkboard keep the real gate even if the template gains a list. The choice is still silent. Losers League, whose real gate sits in a fence, would switch the other way if a later top-level section ever gained a numbered list.
    - (c) Say which section was hashed. Cost: stamp prints the chosen heading and line on stderr, and check's 'gate changed' line names it. The gate-test case expecting an empty stderr on replace changes. Writing the heading line into the stamp itself changes the stamp format, which no run can restamp, so that part would be a person's change after the run. Effect: the person sees what was hashed each time they stamp. Nothing stops a wrong choice; it is only visible.
    - (d) Accept. Cost: a sentence in the script header and the README, plus a fixture case pinning today's first-wins choice. Effect: the behaviour stays as it is, documented: the plan-template task must stay prose. The silent switch remains possible.
  - Shaper's recommendation: Option (a): refuse and name both heading lines, with no --heading-line flag until a repository needs one.
  Decided by: @michaelfromtheoutfit
- **R1-7: fix.** The `--steps)` arm refuses a missing or empty value with a one-line reason and exit 2. Two new gate-test cases, written red first. The parser and the stamp format are untouched.
  Decided by: redline
- **R1-8: fix.** "step 1" becomes "section 1" at `skills/redline/SKILL.md:73` and `:79`.
  Decided by: redline
- **R1-9: Whether the allow list pre-approves stamp as well as check. Chosen: Narrow the rule to check.** Planned as Task 11 in `plan.md`.
  - Decision: The allow rule is narrowed to redline-gate.sh check so every restamp prompts a person; the run changes templates/settings.allow.json, and the author edits the matching line in .claude/settings.json by hand when reviewing the round, since no Redline role may write that file.
  - Date: 2026-10-21
  - The question as the shaper put it: should `Bash(/*/scripts/redline-gate.sh *)` be narrowed to `check`, keep `stamp` behind an ask rule, or stay as it is? Whatever is chosen, `.claude/settings.json` is changed by a person: no role may write it.
  - Story: A launch refuses because the gate changed, and its message prints the full stamp command. The person asks the main session to get the run going. Because the shared allow rule covers every redline-gate.sh subcommand, the session can run stamp with no permission prompt. That restamps checks.sh without bringing it up to date with the new gate, which approves the drift the stamp is meant to catch. Today only the skill's prose stops it.
  - Why it went to the person: new standard.
  - Options:
    - Narrow the rule to check. Cost: one line in templates/settings.allow.json, which the run can change. The same line in .claude/settings.json must be changed by a person, since no role may write it. /redline:setup adds its own rule when it lands. Per-subcommand rules are a new pattern here: the redline-gh.sh and redline-prefs.sh rules are blanket. Effect: the precheck still never prompts. Every stamp asks the person first.
    - Keep the blanket rule and add an ask rule for stamp. Cost: an ask entry in the same two files, with the same split between the run and the person. It relies on the harness's ask list taking precedence over allow, a pattern this repository does not use yet. Effect: same protection as narrowing, while other subcommands, extract included, stay pre-approved.
    - Accept. Cost: none. Effect: stamp stays pre-approved, consistent with the other script rules. The skill's prose is the only guard against an unprompted restamp.
  - Shaper's recommendation: Narrow the rule to check.
  Decided by: @michaelfromtheoutfit
- **R1-10: fix.** The gate test's `differs` passes only when both sides are 64-hex hashes and they differ. A new case, red first, shows a copy with no gate is not counted as a change.
  Decided by: redline

- **As built, R1-6: `check`'s `two gates` line does not repeat the parser's advice.** The parser's error already says "rewrite one so only the gate holds a numbered list", so `check` appends only ", then run check again". Recorded in `plan.md`'s As built.
  Decided by: redline

### Proportionality

- **R1-1.**
  - Likelihood: low. It takes a finding on the hash definition; R1-6's option (c) would be one.
  - Impact when it fires: the round stops at Implement with nothing pushed, and the stage error does not say why a restamp was needed.
  - Cost: two sentences in two files the PR already changes. No code.
  - Fix.
- **R1-6.**
  - Likelihood: low. It takes the plan-template task being rewritten as a numbered list, the form Losers League's gate already uses.
  - Impact: silent and lasting. After one restamp, edits to the real gate never move the hash.
  - Cost: (a) to (d) range from a header sentence to about twenty lines plus a fixture.
  - The choice changes the selection rule the original spec set, so it is the person's. No option is picked here.
- **R1-9.**
  - Likelihood: low. It takes a main session asked to get a refused launch going.
  - Impact: a restamp without bringing `checks.sh` up to date, which approves the drift.
  - Cost: one line in two files, one of which no role may write.
  - Whether `stamp` should prompt is a policy choice, and a per-subcommand rule would be a new pattern here. The person's.
- The nits (R1-2, R1-3, R1-4, R1-5, R1-7, R1-8, R1-10) are each a line or two in a file the PR already changes. R1-7 and R1-10 each add a test case.

## Deferred

None. No finding is `defer` in this round.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 7 (#6). This round tightens the stamp's first half and leaves `/redline:setup` to its own spec.

## Standards Applied

- testing/tests: R1-7 and R1-10 are bug fixes and land red before green. A gate case accompanies each change to `scripts/redline-gate.sh`. The baseline time lives in the `checks.sh` header (R1-3). The stamp rule constrains every edit to the gate section.
- scripts/bash-conventions: R1-7. Usage errors exit 2 with a one-line reason; the header is the documentation.
- scripts/guard: R1-1 and R1-2 extend the self-hosted rule (what a run here may not change).
- workflow/agents: R1-2 changes the shaper's role file. Judgment calls R1-6 and R1-9 are returned, not decided.
- process/standards-retrospective: gate step 7, proposed below.
- prompts/attribution: nothing in this folder names a model or vendor.

## Standards retrospective (proposed)

Items, classified:

- **R1-1 and R1-2 (missing).** `scripts/guard.md`'s self-hosted bullet names only the guard and the hook.
- **R1-1 (contradicting, in part).** `testing/tests.md`'s stamp bullet names only "a change to the backticked text of the gate list".
- **R1-10 (missing).** `testing/tests.md`'s empty-outputs bullet covers both sides empty, not one.
- **R1-3 (already in a standard).** `testing/tests.md`: "The gate records its baseline time in `.claude/redline/checks.sh`'s header".
- **R1-7 (already in a standard).** `scripts/bash-conventions.md`: "Usage errors exit 2 with a one-line reason on stderr".
- **R1-4, R1-5, R1-8 (none).** Documentation corrections that follow no pattern a standard should hold.

Proposed edits:

1. `agent-os/standards/scripts/guard.md`, the bullet starting "When the repository is the plugin". Append:
   > The same holds for a finding whose fix needs `.claude/redline/checks.sh` restamped, which no role may write: one that changes the gate's backticked text, or how `scripts/redline-gate.sh` computes the hash or writes the stamp line. It is deferred with a Known limits line, and a person makes the change and restamps (#7, R1-1, R1-2)
2. `agent-os/standards/testing/tests.md`, the bullet starting "`.claude/redline/checks.sh` carries the gate stamp". Reword to:
   > `.claude/redline/checks.sh` carries the gate stamp (`# redline-gate:`); a change to the backticked text of the gate list in `shape-spec.md`, or to how `scripts/redline-gate.sh` computes the hash or writes the stamp line, restamps it in the same commit, and the gate test's last case proves it (#6; #7, R1-1)
3. `agent-os/standards/testing/tests.md`, the bullet starting "A comparison of two command outputs passes when both are empty". Append:
   > ; a check that two outputs differ also requires each side to be a well-formed value, since the empty output of a failed command differs from everything (#7, R1-10)
4. **R1-9 (missing), drafted after the person's decision to narrow the rule to `check`.** `agent-os/standards/scripts/bash-conventions.md`, line 11, the bullet starting "A script only the skill calls". Append, after "(#6)":
   > ; when one of its subcommands is reserved for a person, its rule in the shared allow list (`templates/settings.allow.json`, and the repository's `.claude/settings.json`) names only the subcommand the skill runs unprompted (`Bash(/*/scripts/redline-gate.sh check *)`), so the reserved one stays behind the permission prompt (#7, R1-9)
   The wording keeps the `redline-prefs.sh` and `redline-gh.sh` rules blanket, since no subcommand of theirs is reserved for a person.
5. **R1-6 (missing), drafted after the person's decision to refuse when two sections qualify.** The choice introduces a convention: ambiguity in what a stamp covers is a failure, never a silent first-wins. `agent-os/standards/scripts/bash-conventions.md`, a new bullet after line 15 (the bullet starting "A header printed by `-h|--help`"):
   > - A script that chooses which part of a file to hash refuses when more than one part qualifies, naming each by line, rather than taking the first: a silent switch moves the hash onto the wrong text and every later check passes against it (#7, R1-6)
   The selection rule itself stays in the script's header and the README, as the shaper noted.
