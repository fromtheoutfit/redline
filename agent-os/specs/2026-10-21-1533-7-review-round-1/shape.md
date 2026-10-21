# PR #7 review round 1 (launch 2026-10-21-1533) — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

The four findings of this launch's Redline round 1 on PR #7, the gate stamp (first half of #6). They are in `redline/round-1-findings.json`, and the review was posted to the PR. They continue the numbering of the previous launch's round (`agent-os/specs/2026-10-21-1422-7-review-round-1/`, R1-1 to R1-10).

- **R1-11** · nit · README setup step 1 stamps before step 5 adds the parenthetical `stamp` reads its range from.
- **R1-12** · nit · README's Gate stamp paragraph says any step added or removed moves the hash; a step with no backticks does not.
- **R1-13** · correctness · `run_check`'s output cap is per check and per stream, so the checker's whole result is still unbounded (decided: one budget shared by the failing checks).
- **R1-14** · nit · `truncated` misses the byte cap, and the README output contract still says 200 lines.

Scope is these findings and nothing more.

## Investigation

### Already known?

- `redline-gh.sh issues-search` for `truncated`, `checks-template` and `gate stamp` lists only #6 (this feature), #1 (planners beyond Agent OS) and #3 (configurable stack). None tracks these findings.
- `redline-gh.sh pr-comments 7`: no earlier comment raises the output cap, `truncated`, the setup order or the "step added" sentence.
- The PR's other round folders: `2026-10-21-1359-7-review-round-1/` (findings R1-1 to R1-7, no `shape.md`) and `2026-10-21-1422-7-review-round-1/` (R1-1 to R1-10, dispositioned). None of their findings covers these four. The cap itself landed after that round, in e5be593.

### R1-11

Confirmed by reading.
- `README.md:38` (setup step 1) ends "Then stamp it: `<plugin>/scripts/redline-gate.sh stamp .claude/commands/agent-os/shape-spec.md .claude/redline/checks.sh` ...", with no `--steps`.
- Without `--steps`, `cmd_stamp` takes the range from the parser's `steps_default` (`scripts/redline-gate.sh:268-273`), which is `RANGE`, the first `(gate steps M to N` parenthetical in the file (`:66`, `:179`, `:186`). When there is none it exits 2 with "has no "(gate steps M to N" parenthetical; give the command-step range with --steps <m>-<n>".
- That parenthetical is in point 7 of the unattended section (`templates/shape-spec-unattended.md:47`), which setup step 5 (`README.md:42`) adds. Followed in order on a new repository, step 1's command runs before it exists.
- `tests/gate-test.sh:175` pins the exit 2. The message is clear, so the cost is a retry, not a wrong stamp. Upgrading (`README.md:26-32`) is unaffected: a repository set up before the stamp already has the unattended section.

### R1-12

Confirmed by reading.
- `README.md:226`: "any backticked change does, so a step added, removed, reordered or given a new flag moves the hash".
- Pass 3 of the parser (`scripts/redline-gate.sh:148-178`) adds to `hashed` only fenced lines (`:163`) and backticked spans (`:173-175`). A step's number and title never enter it.
- So a step written wholly in prose can be added or removed without moving the hash, and moving a step changes the hash only when it changes the order of backticked items (two steps that both hold spans swap).
- The script header (`:28`, "Prose outside backticks never changes it") and the original spec agree with the code. The README's "so" clause is the one text that claims more.
- The gate test's add, remove and swap cases (`tests/gate-test.sh:152-160`) all use steps that hold spans; nothing pins the prose-only case.

### R1-13

Confirmed by reading; the question is real.
- `run_check` (`scripts/checks-template.sh:93-108`, and `.claude/redline/checks.sh:97-112`) keeps 20 lines of a passing check's streams and, for a failing check, 200 lines cut to 16384 bytes, for stdout and stderr separately. Nothing caps the sum.
- The comment above it says the cap exists "so the whole result stays well under the Bash tool's inline limit". The commit that added it (e5be593) says this repository's guard check alone was 30 KB and "spilled the checker's result to a file it may not read". `agents/redline-checker.md:5` disallows `Read`.
- One failing check with two long streams, or two failing checks with long stdout, reaches about 32 KB before JSON escaping, the passing checks' tails and the git block. That is past the size the commit observed spilling.
- When it spills, `judge` (`workflows/redline-loop.js:897-945`) records a checker error or no result, and `failingExcerpt` (`:947-953`) has no checks to excerpt, so the implementer's repair prompt (`:1361`) carries no failing output.
- The workflow itself reads at most the last 3000 characters of a failing check's stdout and 1500 of stderr (`:951`). The implementer reads more: it runs `checks.sh` itself and can Read a spilled result (`agents/redline-implementer.md:20`). In this repository the previous round's plan notes that the guard does not let a role run the harnesses directly, so `checks.sh`'s JSON is the only place the implementer sees a failing harness's output.
- The exact inline limit of the Bash tool is not stated in any file opened here; the 30 KB figure is the commit message's observation.

### R1-14

Confirmed by reading.
- `truncated` (`scripts/checks-template.sh:104`) is true only when a stream has more lines than `keep`. A stream within the line count but over 16384 bytes is cut by `tail -c` (`:105-106`) and still reports `false`.
- `README.md:194`, the output contract, still shows `"stdout": "last 200 lines"` for a passing check and has no `truncated` field.
- Nothing reads `truncated` yet: no match in `workflows/`, `agents/`, `skills/`, `tests/` or the README.
- `.claude/redline/checks.sh:103-111` carries the same lines. No Redline role may write that file (`tests/guard-cases.tsv`, the self-hosted rows; `agents/redline-shaper.md` rule 7; unattended point 11).

### Nothing in this round moves the gate hash

None of the planned edits touches `.claude/commands/agent-os/shape-spec.md` or `scripts/redline-gate.sh`. The gate test's last case ("the plugin's own checks.sh stamp matches its gate") proves it.

## Unattended answers

- **Scope.** The four findings above. Evidence: the findings JSON in the invoking prompt, also at `redline/round-1-findings.json`.
- **Visuals.** None; this is a shell-script and documentation change.
- **References.** See `references.md`. Each one is a file opened during shaping.
- **Product context.** `agent-os/product/roadmap.md`, Phase 1 item 7 (#6): the stamp first, then `/redline:setup`. Nothing here starts `/redline:setup`; R1-11 only orders the manual steps it will later replace.
- **Standards.** `testing/tests`, `scripts/bash-conventions`, `scripts/guard`, `workflow/agents`, `process/standards-retrospective` and `prompts/attribution`, from `agent-os/standards/index.yml`. Full text in `standards.md`.
- **R1-12: should a prose-only step move the hash?** Answered by the code's own header and the PR description. `scripts/redline-gate.sh:28`: "Prose outside backticks never changes it." PR description: "Prose edits never change it; any backticked change does." The README sentence disagrees with both, so the README is fixed and a gate-test case pins the stated behaviour.
  Decided by: redline
- **R1-14: what should `truncated` mean?** Answered by the code's own comment, `scripts/checks-template.sh:93-95`: a failing check "keeps up to 200 lines and 16 KB of tail", so both limits cut the stream. A flag that reports a cut by one of them and not the other disagrees with that comment; the flag is fixed.
  Decided by: redline
- **R1-14: who changes `.claude/redline/checks.sh`?** Answered by `agents/redline-shaper.md` rule 7 ("except `scripts/redline-guard.sh`, `hooks/hooks.json` and `.claude/redline/checks.sh`: a finding there ... is `defer`") and unattended point 11. A person carries the template's lines into it after the run.
  Decided by: redline
- **R1-13: what bounds the checker's whole result?** Not answered by the evidence. The comment states the goal ("so the whole result stays well under the Bash tool's inline limit"), but which bound meets it trades the checker's limit against how much of a failing check the implementer sees. That is the person's. The stated goal does mean that accepting the overflow (option (c)) also corrects the comment, so the code stops claiming a bound it does not have.

## Decisions

- **R1-11: fix.** Setup step 1 (`README.md:38`) stops stamping and says the `# redline-gate: TODO` line is stamped in step 5. Step 5 (`README.md:42`) ends with the stamp command and says the range comes from point 7's parenthetical, which that section adds. The template's TODO line is unchanged: it names the command, not the order. Proven by grep.
  Decided by: redline
- **R1-12: fix.** The README's "so" clause matches the code: adding, removing or swapping steps that hold backticked spans moves the hash; a step written wholly in prose does not, so a command step keeps its command in backticks. A gate-test case pins that a prose-only step added leaves the hash unchanged, beside the existing "a step added" case that must still differ.
  Decided by: redline
- **R1-13: What bounds the checker's whole result.** Decided: (b) One total budget shared by the failing checks. Planned as Task 5 in `plan.md`; the live copy in `.claude/redline/checks.sh` is under Deferred.
  - Decision: The author chose a single shared output budget for checks.sh, split evenly among the failing checks in a final pass rather than consumed in run order, so the checker's result stays bounded however many checks fail, and will carry the matching change into .claude/redline/checks.sh by hand after the round.
  - Date: 2026-10-21.
  - The question: the cap is per check and per stream, and nothing bounds the sum. Should each stream shrink to what the workflow reads, should the failing checks share one budget, or should the overflow be accepted and the comment corrected?
  - Story: a round in this repository breaks two things at once, say a guard row and a loop check. The checker runs `checks.sh`, whose JSON now carries up to 16 KB from each failing harness and passes 30 KB. The tool spills it to a file the checker may not read, so the checker returns no result. The round records a checker error, and the implementer's next attempt gets no failing output to work from, at the moment it most needs it.
  - Why it goes to the person: product decision (how much of a failure the implementer sees, against a hard bound for the checker), and the live copy in `.claude/redline/checks.sh` is a person's change in every option.
  - Options:
    - (a) Size each stream to what the workflow reads. Cost: three numbers in the template's `run_check`, the README contract, and the same in `.claude/redline/checks.sh` by a person. Effect: about 3 KB of a failing check's stdout, 1.5 KB of stderr, 1 KB for a passing check; six failing checks stay under about 27 KB. The implementer's own run shows a few dozen lines of a failing harness, and in this repository it has no other way to see that output.
    - (b) One total budget shared by the failing checks, for example 16 KB. Cost: about twenty lines in the template (a final pass over the collected checks that divides the budget among the failing ones), the README contract, and the same in `.claude/redline/checks.sh` by a person. Effect: the bound holds however many checks fail, and a single failing check keeps today's 16 KB.
    - (c) Accept. Cost: the comment above the cap says it bounds each check, not the whole result, and a Known limits line says more than one long failing check can overflow the checker's result; `.claude/redline/checks.sh`'s comment is a person's. Effect: the overflow stays possible.
  - Shaper's recommendation: (b), one shared budget: it is the only option that bounds the result however many checks fail while keeping today's output for the common single-failure round.
  Decided by: @michaelfromtheoutfit
- **R1-14: defer.** The run fixes what it may write: `scripts/checks-template.sh`'s `truncated` is true when either limit cut a stream (more lines than `keep`, or more bytes than `cap`), and the README output contract shows the template's numbers, a `truncated` field and one bullet saying what it means. The same `truncated` change in this repository's `.claude/redline/checks.sh` is a person's, after the run (see Deferred).
  Decided by: redline

### Proportionality

- **R1-13.**
  - Likelihood: medium in a repository whose harnesses print long logs. It takes two failing checks with long output in one round, or one failing check with long stdout and stderr. In this repository the guard harness prints one table row per case and the loop harness two lines per scenario, so a failing harness reaches the cap.
  - Impact when it fires: the checker cannot return the JSON, the round records a checker error, and the implementer's repair prompt carries no failing output, just when it is needed.
  - Cost: from a comment and a Known limits line (accept) to about twenty lines in `run_check` or a final pass (a shared budget), in the template; the same change in `.claude/redline/checks.sh` is a person's in every option.
  - Which bound to pick trades the checker's limit against the implementer's view of a failure. The person's; no option is picked here.
- **R1-14.** Nothing reads `truncated`, so the impact today is accuracy. Cost: two `wc -c` lines and one condition in the template, and one contract line plus one bullet in the README, both files the PR already changes. Proportionate; it is `defer` only because the live copy is a file no role may write.
- **R1-11, R1-12.** Documentation nits in a file the PR already changes; R1-12 adds one gate-test case.

## Deferred

- **R1-14, `.claude/redline/checks.sh`.**
  - Mitigation, this round: the template's `truncated` covers the byte cap, and the README contract matches the template.
  - Full fix, open: a person makes the same `truncated` change in `.claude/redline/checks.sh` (the `run_check` block, lines 97 to 112), after the run. It changes no part of the header, so no restamp is needed. R1-13 chose the shared budget, so the person carries Task 5's `run_check` and final-pass lines in the same edit (see the R1-13 entry below).
- **R1-13, `.claude/redline/checks.sh`.**
  - Mitigation, this round: `scripts/checks-template.sh` records each check and, in a final pass, splits one 16 KB budget evenly among the failing checks; the README output contract and the `truncated` bullet describe it (Task 5). Every repository set up from the template after this round is bounded.
  - Full fix, open: the author carries the matching change into this repository's `.claude/redline/checks.sh` by hand after the round (the `run_check` block and the final `jq -n` that assembles `checks`). Until then this repository's checker result is still unbounded when more than one long check fails. The change sits below the header, so no restamp is needed.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 7 (#6). This round corrects the stamp's documentation and the template's output contract; `/redline:setup` keeps its own spec.

## Standards Applied

- testing/tests: R1-12 adds a gate case beside its neighbour. R1-14's template has no harness, so its proof is grep and the `syntax` check. The stamp rule constrains every edit: none touches the gate or the parser.
- scripts/bash-conventions: R1-14 and R1-13. The header and comments are the documentation, and the README quotes rather than restates; R1-12 is a README sentence that restated and drifted.
- scripts/guard: R1-14's deferral. No role writes `.claude/redline/checks.sh`.
- workflow/agents: R1-13 is returned, not decided; each decision names its owner.
- process/standards-retrospective: gate step 7, proposed below.
- prompts/attribution: nothing in this folder names a model or vendor.

## Standards retrospective (proposed)

Items, classified:

- **R1-11 (none).** A documentation ordering fix that follows no pattern a standard should hold.
- **R1-12 (already in a standard).** `scripts/bash-conventions.md`: "The README quotes from it rather than restating it". The README restated the header and claimed more.
- **R1-14 (missing).** No standard says the README's output contract follows a change to `checks.sh`'s JSON.
- **R1-14 (missing).** `scripts/guard.md`'s self-hosted bullet names a finding whose fix needs `checks.sh` restamped, not one whose fix changes `checks.sh`'s own lines with no restamp. Rule 7 of `agents/redline-shaper.md` covers both.
- **R1-13 (missing).** No standard says what bounds `checks.sh`'s whole JSON, or why the bound must cover the sum rather than each check.

Proposed edits:

1. `agent-os/standards/scripts/bash-conventions.md`, the bullet starting "The header comment is the documentation". Append:
   > . A field added to `checks.sh`'s JSON, or a limit changed in it (`run_check` in `scripts/checks-template.sh`), updates the README's output contract in the same change, and a flag that reports a cut is set by every limit that can cut (#7, R1-14)
2. `agent-os/standards/scripts/guard.md`, the bullet starting "When the repository is the plugin". Append:
   > . A finding whose fix changes `.claude/redline/checks.sh`'s own lines, with no restamp, is deferred the same way: the run fixes `scripts/checks-template.sh` and the README, and a person carries the same lines into `checks.sh` (#7, R1-14)
3. `agent-os/standards/scripts/bash-conventions.md`, the same bullet (line 9, starting "The header comment is the documentation"), after item 1's text. Append:
   > . `checks.sh`'s whole JSON stays bounded however many checks fail: the failing checks share one output budget, split evenly among them in a final pass after every check has run, never consumed in run order, because the checker may not Read a result that spills to a file (#7, R1-13)

   Drafted after R1-13 was decided by @michaelfromtheoutfit (option (b)); the standards approver judges it.
