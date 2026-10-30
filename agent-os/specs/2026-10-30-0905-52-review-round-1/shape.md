# PR #52 review round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 1 of the Redline review of PR #52, which closes issue #49 ("Per-repository ask rules: things a person is always brought in for, declared in the repository"). This round covers its four findings and nothing else. All four sit at the edges of the ask rules the PR adds:

- **R1-1** (correctness, medium, confirmed): a Bash write operand holding `*` or `?` is checked by its literal prefix only, so a glob whose prefix stops inside a segment of a rule's root, or under a pattern with no literal root, gets past a paths rule (`scripts/redline-guard.sh:345`, cut at `:406`). **Defer**: the guard is a person's file; the round pins today's decisions and names the limit in the README.
- **R1-2** (correctness, low, confirmed): setup's ask-rules check passes `{"paths": null}` and `{"prose": null}`, and aborts in jq on a non-object rule before an object (`scripts/redline-setup.sh:462-466`). **Fix.**
- **R1-3** (correctness, low, likely): the setup skill says to omit `--ask-rules` when there are no rules, so a rerun that removes every rule keeps the old list (`skills/setup/SKILL.md:102`). **Fix.**
- **R1-4** (correctness, low, likely): `forceAskRules` turns a human-pass `none` (a comment that asks for nothing) on a rule-covered file into a forced ask (`workflows/redline-loop.js:1861`). **Fix.**

## Unattended answers

- **Scope.** The four findings in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-1-review.json` and `redline/round-1-findings.json` in this folder.
- **Visuals.** None. Every change is a script line, a test case, a table row or a sentence of prose.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** `agent-os/product/tech-stack.md:26`: "this repository carries the tool and its README only". The README is what a public reader sees, which is why R1-1's mitigation is a README correction. No fix changes product scope.
- **Repository ask rules.** The invoking prompt lists none, and `.claude/redline.json` has no `askRules` (`jq -c '{askRules, maxRounds}'` printed `{"askRules":null,"maxRounds":3}`), so no finding is forced to `ask` by a rule.
- **Standards.** These apply: `scripts/guard` (R1-1's deferral route and its rows), `scripts/bash-conventions` (R1-2's jq program, R1-3's rerun semantics), `testing/tests` (a case per change, red before green), `workflow/agents` (R1-4 changes the forcing point the standard describes, and the shaper's agent file), `workflow/replay` (R1-4 must change no prompt), `process/docs-gate` (a Docs entry per touched plugin file), `process/standards-retrospective` and `prompts/attribution`. `process/internal-notes` applies only in that this folder carries no private design text.
- **Already known?**
  - `scripts/redline-gh.sh issues-search "ask rules"` returns #49 (the issue this PR closes) and #14 (public docs). Neither is a bug report on these lines.
  - `issues-search glob` returns #49 and #50; `issues-search wildcard` returns #50 ("Guard and setup-template hardening from vestmark-com#13 review", opened 2026-10-28T19:38:45Z). The read subcommands print titles only, so its body was not read. It was opened before the ask rules existed (`e7d030d`, 2026-10-30 09:03), so it cannot track R1-1 as such; the person may fold the full fix into it. `issues-search "literal prefix"`, `"sed -i"` and `"glob.glob"` return nothing.
  - `issues-search "human review none"` returns nothing; `issues-search "redline-setup config"` returns #49, #16, #50 and #3, none about the validator or the skill's flag.
  - `redline-gh.sh pr-comments 52` shows only this round's review; `redline-gh.sh review-comments 52` shows only this round's four inline comments (4424010517, 4424010526, 4424010534, 4424010539).
  - `git ls-tree -d --name-only origin/feature/49-per-repository-ask-rules-things-a-person-is-always-brought-in-for-declared-in-the-repository agent-os/specs/` lists no `-52-review-round-` folder, so this is the PR's first round. HEAD and the PR ref are both `b005f1d`.

  All four findings are new.
- **Reproductions.** The reviewer wrote no `reviewer-r1-ReproTest.php`; it left `/tmp/redlinerepro/fault.jq` (byte-identical to `scripts/redline-setup.sh:457-469`: `sed -n '457,469p' ... | diff - /tmp/redlinerepro/fault.jq` printed nothing) and two rule lists. This repository has no PHP and no Pest, so the shaper wrote no scratch test. The shaper's guard admits neither `python3` nor the guard script, so R1-1 and R1-4 were confirmed by reading the code paths line by line; R1-2 by running jq.
- **R1-1: is it real?** Yes, by reading.
  - `scripts/redline-guard.sh:406`: `path = path.split("*")[0].split("?")[0] or "."`. Both `protected()` and `ask_rule()` see only that prefix (411).
  - `ask_rule()` refuses when a rule's regex matches the prefix (343) or the prefix is the rule's root or a directory above it (345: `rel == "." or rel == root or root.startswith(rel + "/")`). `glob_root()` (259-268) stops at the first segment holding a wildcard, so `*.secret.yaml` and `**/migrations/*` have the empty root.
  - `sed -i '' 's/a/b/' app/*.secret.yaml`: `sed` takes `files[1:]` of the non-option arguments (776-786), so the target is `app/*.secret.yaml`, cut to `app/`. `yaml-anywhere`'s regex `^(?:.*/)?[^/]*\.secret\.yaml$` does not match `app`; its root is empty; `craft-config`'s root `config/project` does not start with `app/`. The implementer's `REPO` prefix then allows it.
  - `sed -i '' 's/a/b/' config/proj*/project.yaml`: cut to `config/proj`. The regex `^config/project/.*$` does not match it, it is not the root, and `"config/project".startswith("config/proj/")` is false. Allowed.
  - The neighbour, `tests/guard-cases.tsv:458` (`config/project/*.yaml`, cut to the root itself), is denied with "holds the files of repository ask rule 'craft-config'".
  - One correction to the finding: a wildcard operand at the repository root (`*.secret.yaml`, cut to `.`) is refused in the fixture repository, by `craft-config`'s branch at 345 (`rel == "."` with a non-empty root). It gets through only in a repository whose rules all lack a literal root. The rows below do not pin that case.
  - The PR description says "For every role, a write under a `paths` rule's globs ... is refused naming the rule", and `README.md:189` says "so a Redline role cannot write under a rule by any of those". The code disagrees for a wildcard operand, so the README sentence is wrong as written; the README is a file the run may write.
- **R1-1: why defer and not ask?** The unattended section's point 11 and `agent-os/standards/scripts/guard.md` ("A finding there is deferred, mitigated by a pinned `tests/guard-cases.tsv` row or a Known limits line, and a person makes the change after the run") settle the route. The guard refuses `scripts/redline-guard.sh` to every role here (`scripts/redline-guard.sh:208-210`). The full fix needs no product decision; the person chooses its details when they edit the guard.
- **R1-2: is it real?** Yes, by running it.
  - `jq -r -f /tmp/redlinerepro/fault.jq /tmp/redlinerepro/rules-paths-null.json` printed nothing: `[{"id":"a","when":{"paths":null},"reason":"r"}]` passes. Line 463 requires `when`'s keys to be exactly `["paths"]` or `["prose"]`, which `{"paths": null}` meets; 464 and 465 test `$r.when.paths != null` and skip; 466 tests `$r.when.prose != null` and skips.
  - `jq -r -f /tmp/redlinerepro/fault.jq /tmp/redlinerepro/rules-nonobject-first.json` printed `jq: error (at /tmp/redlinerepro/rules-nonobject-first.json:1): Cannot index string with string ("id")`: 462's `[.[:$i][] | .id]` indexes the earlier string. The substitution at 504 runs under the script's `set -euo pipefail` (87), so the script exits with jq's code, not 2.
  - The guard tests presence (`scripts/redline-guard.sh:285`, `if "paths" in when:` then `not isinstance(paths, list)`; 291 for prose) and the workflow tests the key (`workflows/redline-loop.js:128-139`, by `kind`). Both fault on these lists; the guard then refuses every write (331-332).
  - The fix's pieces, checked in jq: `{"paths": null} | [has("paths"), has("prose"), (.paths | type)]` gives `[true,false,"null"]`; `["x", {"id": "a"}, 3, {"id": "b"}] | [.[:3][] | objects | .id]` gives `["a"]`.
  - The documented behaviour is the answer: the script's header (`scripts/redline-setup.sh:44`) says "A bad list exits 2 naming the rule", the README `config` row says "a bad rule exits 2 naming it", and the comment at 452-453 says the wording is the guard's and the workflow's. The code disagrees, so the fix makes it agree.
- **R1-3: is it real?** Yes, by reading.
  - `skills/setup/SKILL.md:102`: "When there are rules, write the list ... and pass it as `--ask-rules`; with none, omit the flag."
  - `scripts/redline-setup.sh:42-43`: "Without the flag an existing askRules is kept". In `cmd_config`, 527 reads the file's list and 547 replaces it only when `--ask-rules` was given.
  - `[]` already clears it: `ask_rules_fault` faults nothing on `[]` (`[] | [range(0; length)] | first // "no fault"` gave `"no fault"`), and 547 finds `[]` differs from the file's list, writes `.askRules = []` and lists `updated.askRules`. The guard (`load_ask_rules`, 310-323) and the workflow (110) read `[]` as no rules.
  - The evidence answers the intent: the #49 plan's Task 4.4 says the skill shows the file's list on a rerun "and keep it unless the person changes it", and the skill itself says "keep it unless the person changes it". Removing every rule is a change, and the instruction cannot carry it.
- **R1-4: is it real?** Yes, by reading.
  - `workflows/redline-loop.js:1845-1889`: `forceAskRules` matches a paths rule on `f.file` (1854) and sets `s.disposition = 'ask'` (1865) with no test of the disposition; 1861-1863 warn "the shaper sorted H1-1 as none; repository rule ... makes it an ask".
  - `none` reaches it only in a human pass: `checkDispositions` (1817-1826) stops a Redline round with a `none` at shape, and runs before `forceAskRules` (1999-2000, 2114-2115).
  - The forced path then gives, on autopilot, `leftDecision` (2024-2025), the `left` reply (922-923, ending "No change made; the person makes it.") and a Deferred entry; on guided or plan, a stop for the author. Without a rule, a `none` gets outcome `none` (1783-1784) and the reply `no change requested` (926-927).
  - Scenario 12's human-pass check (`tests/loop-test.mjs:980-985`) scripts a comment the shaper sorts `fix` ("Rename this handle."), so the `none` case has no check.
- **R1-4: does the evidence answer whether a `none` is forced?** Yes. The PR description's rule is about what Redline may choose: "A finding a rule covers is the person's: Redline never chooses `fix` or `defer` for it, whatever the shaper returned." The README says the same (`README.md:126`). For a human pass the README (line 67) says "a comment that asks for nothing gets "no change requested"", and the #49 spec's decision 2 says "A rule-matched finding is never `fixed` or `deferred` in the run's records". A `none` is neither `fix` nor `defer` and makes no change, so leaving it as `none` keeps every stated guarantee, while forcing it posts "No change made; the person makes it." on a comment that asked for nothing to be made. The forcing point's docblock ("whatever the shaper returned"), the shaper's agent file ("whatever disposition you return", `agents/redline-shaper.md:26`) and `README.md:126`'s last sentence ("a teammate's comment under a rule takes the same path") were written about fix and defer; they are reworded in the same task so the stated behaviour matches the code. The reviewer marked the finding `needsDecision: false`.

## Decisions

- **R1-1: deferred; the round pins today's decisions and corrects the README.** Two `allow` rows under `# @cwd ASKRULES` in `tests/guard-cases.tsv`, after the any-depth rows (474), under a comment naming #52 R1-1: `sed -i '' 's/a/b/' app/*.secret.yaml` and `sed -i '' 's/a/b/' config/proj*/project.yaml`. Row 458 (`config/project/*.yaml`, deny) is the neighbouring decision that must not change. `README.md`'s Known limits bullet (189) says a wildcard operand is checked by its literal prefix only, with both examples, and the Ask rules paths bullet (128) points there. `plan.md` Task 2.
  Decided by: redline

- **R1-1: the root-level case is not pinned.** In the fixture a root-level wildcard is refused by `craft-config`'s "holds" branch, so a row would pin a different rule's decision and could not show the gap. The README sentence covers it ("a pattern with no literal root").
  Decided by: redline

- **R1-2: setup's check tests presence and reads only objects' ids.** In `scripts/redline-setup.sh`, 464 and 465 test `($r.when | has("paths"))` and 466 tests `($r.when | has("prose"))`, never `!= null`; 462 reads `[.[:$i][] | objects | .id]`. Every message stays as written, so the three checks keep one wording. Four `tests/setup-test.sh` cases, red first. `plan.md` Task 3.
  Decided by: redline

- **R1-2: the skill's precheck and the workflow are left alone.** The workflow's launch check already faults these lists (`workflows/redline-loop.js:132`, `138`), and the reviewer reports no gap in the precheck. Scope is the round's findings.
  Decided by: redline

- **R1-3: the skill passes `[]` when the person removes every rule.** `skills/setup/SKILL.md:102` says to pass the whole list whenever it is new or changes, `[]` when every rule is removed, and to omit the flag only when the list stays as it is or there is none and none is added. `README.md:39` (Set up a repository, item 2) gains "(`[]` removes them all)". Two `tests/setup-test.sh` cases pin the script behaviour the sentence relies on (`[]` over a one-rule file updates only `askRules` and leaves `[]` in the file); they pass before and after, since the defect is in skill text no harness reads, and the red case is a `grep` count on the skill. `plan.md` Task 4.
  Decided by: redline

- **R1-3: the script is not changed.** It already clears with `[]` (Unattended answers). A new flag such as `--clear-ask-rules` would add surface for what `[]` already does.
  Decided by: redline

- **R1-4: `forceAskRules` leaves a `none` as it is.** After the `if (!s)` block, `if (s.disposition === 'none') continue`, with the docblock saying a human pass's `none` is left as it is. Two loop-test checks in scenario 12, red first: a human pass on autopilot whose shaper sorts H1-1 on `config/project/project.yaml` as `none` gets a `no change requested` reply, nothing under `forced` or `deferred`, no "makes it an ask" warning, and the summary "H1-1 asked for nothing". The check at `tests/loop-test.mjs:984` (a `fix`-sorted comment on the same file is still left to the author) is the neighbouring decision. `plan.md` Task 5.
  Decided by: redline

- **R1-4: the stated behaviour is reworded with the code.** `agents/redline-shaper.md:26` says the workflow forces `ask` whatever `fix` or `defer` the shaper returns, and that a human-pass comment that asks for nothing is `none` whatever file it is on; `README.md:126`'s last sentence says the same for the reader. The workflow's injected rule block (`rulesBlock`, `workflows/redline-loop.js:330-331`) is not changed: it is prompt text a run with rules replays, the forcing point is what decides, and the agent file is where the shaper's role is stated (`agent-os/standards/workflow/agents.md`: "The agent file holds the role; the workflow's prompt holds the round's inputs").
  Decided by: redline

- **R1-4: no prompt changes.** The fix touches no prompt string, so `workflow/replay`'s byte-identical rule holds and the existing `samePrefix` checks in scenario 12 stay green.
  Decided by: redline

## Deferred

- **R1-1: a wildcard write operand slips past a paths ask rule.**
  - Mitigation this round (`plan.md` Task 2): two `tests/guard-cases.tsv` rows pin today's `allow` for `sed -i '' 's/a/b/' app/*.secret.yaml` and `sed -i '' 's/a/b/' config/proj*/project.yaml` under a comment naming #52 R1-1, and `README.md`'s Known limits says a wildcard operand is checked by its literal prefix only.
  - Full fix, made by a person after the run in `scripts/redline-guard.sh` (no Redline role may write it): in `writable()` (397-424), when the raw target holds `*` or `?`, expand it with `glob.glob` against `cur` (an in-place edit's operands exist when the hook runs) and check every match with `protected()` and `ask_rule()`; in `ask_rule()` also refuse when the cut prefix is a string prefix of a rule's root (`config/proj` against `config/project`), and when the target holds a wildcard, some rule has no literal root, and the expansion found nothing to check. Then flip the two R1-1 rows to `deny` with fifth columns `yaml-anywhere` and `craft-config`, add a row for each new refusal beside its neighbour (CLAUDE.md: "Every guard change updates `tests/guard-cases.tsv`"), and drop the Known limits clause.
  - Observed while reading, not run (the shaper's guard admits neither the guard script nor `python3`): the same cut at 406 feeds `protected()`, so a wildcard operand against Redline's own file patterns may get through the same way (`.claude/settings*.json` cut to `.claude/settings` matches neither the pattern nor its directory test at 388-393). That predates this PR and is outside this round's scope; the full fix above covers it if the expansion happens before both checks. Issue #50 may already hold it (see Unattended answers).

## Proportionality

- **R1-1** (correctness, medium). Likelihood: low. An implementer works from an approved plan whose tasks the plan approver bounces when they name a rule path, and the forced `ask` keeps such a finding out of the plan; a wildcard operand that happens to reach a rule's files is the residual case. Impact when it fires: a Redline role edits a file the repository said a person always handles. Full-fix cost: `scripts/redline-guard.sh`, which no role may write here. That makes it `defer`; the mitigation (two rows and two README sentences) is cheap and inside the PR's files.
- **R1-2** (correctness, low). Likelihood: low. The skill composes the rules file itself, so a `null` or a stray string comes from a hand-written file passed to `--ask-rules`. Impact: a `null` list is written, then the guard refuses every write and the launch stops (visible, naming the rule); a non-object rule ends setup with jq's raw error and exit 5, which the skill does not handle. Cost: three expressions in one jq program and four test cases, both files in the PR's diff, no new dependency. Fix.
- **R1-3** (correctness, low). Likelihood: a person who drops every rule on a rerun; uncommon but a normal use of setup. Impact: the rules stay enforced (writes refused, findings forced to the person) after the person asked to remove them, until someone edits `.claude/redline.json` by hand or runs `--force`, which resets every hand-set value. Cost: one passage of the skill, one README clause and two pinning test cases, all in files the PR changes. Fix.
- **R1-4** (correctness, low). Likelihood: a teammate's praise or acknowledgement as an inline comment on a rule-covered file during a human review pass; plausible on a Craft config change. Impact: guided and plan stop to ask the author about a "Looks good"; autopilot posts "left to the author ... No change made; the person makes it." on it, lists it under Deferred for the triage, and says so in the summary. Cost: one `if` and a docblock in `forceAskRules`, two loop checks, one clause in the shaper's agent file and one in the README, all files in the PR's diff. Fix.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/tech-stack.md:26` (the repository carries the tool and its README only). No product line changes.

## Standards Applied

- **scripts/guard.** The route for R1-1 (deferred, mitigated by a pinned row or a Known limits line, a person changes the guard) and the ask-rules bullet R1-1 shows to be incomplete (retrospective item 1).
- **scripts/bash-conventions.** jq for every JSON value; usage errors exit 2 with a one-line reason, which R1-2 restores; the rerun bullet R1-3 extends (items 2 and 3).
- **testing/tests.** A case per tested surface in the same commit, red before green (R1-2, R1-4), a neighbouring decision kept beside each (row 458; loop check 984; setup line 222). The tests write only under the temp directory and `~/.cache/redline/`.
- **workflow/agents.** The forcing point and the `left` outcome R1-4 narrows (item 4); a human pass sorts into fix, ask or none; the agent file holds the role.
- **workflow/replay.** R1-4 changes no prompt, so every relaunch replays as before.
- **process/docs-gate.** Each task names the README section it updates or the reason there is none (`plan.md`, each task's Docs line and the Docs entries table).
- **process/standards-retrospective.** Items below are proposed; the standards approver approves them and the implementer applies them in one commit (`plan.md` Task 6).
- **prompts/attribution.** Commit messages and this folder carry Redline's name only.

## Standards retrospective (proposed)

Done mechanically over the Decisions above. Nothing has been built, so there is no As built deviation and no red check to list yet.

1. **R1-1** (contradicting a standard), `agent-os/standards/scripts/guard.md`, the ask-rules bullet (line 16). Replace the words

   "refuses a write to a directory that holds a rule's root (`rm -rf config`; a Bash target cut at its first `*`),"

   with

   "refuses a write to a directory that holds a rule's root (`rm -rf config`; a Bash target cut at its first `*` whose literal prefix is the root or above it),"

   and add a new bullet directly after it:

   "- A Bash write operand holding `*` or `?` is checked by its literal prefix only, cut at the first wildcard: a prefix that stops inside a segment of a rule's root (`config/proj*/project.yaml` under `config/project/**`) or under a pattern with no literal root (`app/*.secret.yaml` under `*.secret.yaml`) is not refused. Until a person makes the guard check the operand itself, the README's Known limits names the gap and `tests/guard-cases.tsv` pins both as allowed, rows the fix flips to deny (#52, R1-1)"

2. **R1-2** (missing), `agent-os/standards/scripts/bash-conventions.md`, a new bullet directly after the `config_differs` bullet (line 18):

   "- A validator that shares its messages with another (`ask_rules_fault` in `redline-setup.sh`, `rule_fault` in the guard, the workflow's launch check) shares its tests too: a key's presence (`has("paths")`), never a non-null value, so `{"paths": null}` gets the shared message instead of passing, and a list's elements are filtered to objects (`objects`) before a field of each is read, so a non-object element gets `not an object` and exit 2 instead of jq's own error and exit 5 under `set -e` (#52, R1-2)"

3. **R1-3** (missing), `agent-os/standards/scripts/bash-conventions.md`, a new bullet directly after item 2's:

   "- A flag that replaces a list a rerun otherwise keeps (`config --ask-rules`) clears it with `[]`, and the skill that calls it passes `[]` when the person removes every entry: without the flag the old list stays, so "with none, omit the flag" left a removed list enforced (#52, R1-3)"

4. **R1-4** (contradicting a standard), `agent-os/standards/workflow/agents.md`, the `left` bullet (line 10). Replace the words

   "One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever the shaper returned:"

   with

   "One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned (a human pass's `none`, a comment that asks for nothing, is left as it is, since there is no change to leave to the person; #52, R1-4):"

5. **R1-1 to R1-4** (missing), `agent-os/standards/testing/tests.md`, the ask-rules bullet (line 17). Replace

   "and reads an optional fifth column the deny reason must contain, so a row pins the rule named and not only the decision;"

   with

   "and reads an optional fifth column the deny reason must contain, so a row pins the rule named and not only the decision, and pins as allowed the wildcard operands the guard does not refuse yet (#52, R1-1);"

   replace

   "the refused override and the no-rules prompt identity;"

   with

   "the refused override, the no-rules prompt identity and a human pass's `none` on a rule-covered file left as `none` (#52, R1-4);"

   and replace

   "proves the `config --ask-rules` round trip, every validation message"

   with

   "proves the `config --ask-rules` round trip, an empty list clearing an existing one (#52, R1-3), every validation message (a null `paths` or `prose` and a non-object rule before an object included, #52, R1-2)"

6. The other Decisions teach no further rule: R1-1's deferral route is already `guard.md`'s self-hosted bullet (line 9); leaving the root-level case unpinned, leaving the precheck and the workflow's check alone, not adding a clearing flag, and keeping `rulesBlock` unchanged are one-offs; R1-4's no-prompt-change is already `workflow/replay`. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, `workflow/replay` and `index.yml` (every description stays accurate): no changes. No pattern is used that is not in `agent-os/standards/`.

If the standards approver declines every item, record "Standards retrospective: no changes" under Decisions instead.
