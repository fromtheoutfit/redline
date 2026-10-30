# PR #52 review round 2 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Round 2 of the Redline review of PR #52, which closes issue #49 ("Per-repository ask rules: things a person is always brought in for, declared in the repository"). The reviewer read only the fix diff from round 1 (`b005f1d..da5b577`) and found one thing. This round covers that finding and nothing else:

- **R2-1** (correctness, low, confirmed): setup's ask-rules check accepts an id that ends in a newline, which the guard and the workflow refuse (`scripts/redline-setup.sh:463`). **Fix.**

## Unattended answers

- **Scope.** The one finding in the invoking prompt. Evidence: the prompt's findings JSON, and `redline/round-2-findings.json` and `redline/round-2-review.json` in this folder.
- **Visuals.** None. The change is one line of a jq program, a comment and five lines of a test harness.
- **References.** See `references.md`. Every file cited there was opened while shaping.
- **Product context.** No product line changes. The fix makes setup refuse what the guard and the workflow already refuse.
- **Repository ask rules.** The invoking prompt lists none, and `.claude/redline.json` has no `askRules` key (read in full while shaping). No finding is forced to `ask` by a rule.
- **Standards.** These apply: `scripts/bash-conventions` (the validator bullet R1-2 added, line 19, which this finding extends; usage errors exit 2), `testing/tests` (a case per change, red before green, a neighbouring decision kept; the ask-rules bullet, line 17), `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`. `scripts/guard`, `workflow/agents` and `workflow/replay` do not apply: no guard, workflow, agent or prompt text changes.
- **Already known?**
  - `scripts/redline-gh.sh issues-search "ask_rules_fault"` and `issues-search "trailing newline"` return nothing; `issues-search "ask rules"` returns #49 (the issue this PR closes) and #14 (public docs). Neither tracks this.
  - `scripts/redline-gh.sh review-comments 52` shows round 1's four inline comments and their replies, and this round's R2-1 comment (4424368158). R1-2's thread (4424010526, reply 4424339677) covered a null `paths`/`prose` and a non-object rule, not the id pattern.
  - `git ls-tree -d --name-only origin/feature/49-per-repository-ask-rules-things-a-person-is-always-brought-in-for-declared-in-the-repository agent-os/specs/` lists `2026-10-30-0905-52-review-round-1` only. Its `shape.md` (read in full) decides R1-2 as "setup's check tests presence and reads only objects' ids"; the id regex is not mentioned. HEAD and the PR ref are both `da5b577`.
  - `git blame -L 463,463 scripts/redline-setup.sh` gives `e7d030db`, the feature commit: the line predates round 1 and R1-2 left it as it was.

  R2-1 is new.
- **R2-1: is it real?** Yes, by running it.
  - `jq -n -c '["a\nB", "a\n", "ab", "a-1", "B\nab", "\nab"] | map(test("^[a-z][a-z0-9-]*$"))'` printed `[false,true,true,true,false,false]` (jq 1.8.2): `"a\n"` passes, as the reviewer reported.
  - Setup's whole program, as committed: `sed -n 459,471p scripts/redline-setup.sh | jq -r -f /dev/stdin /dev/fd/3` with `[{"id": "a\n", "when": {"paths": ["x"]}, "reason": "r"}]` on fd 3 printed nothing, so `ask_rules_fault` returns no fault and `cmd_config` (503-509) writes the list. The same pipe with the id `"Bad"` printed `askRules[1]: id must match [a-z][a-z0-9-]*`.
  - The guard: `scripts/redline-guard.sh:221` is `RULE_ID = re.compile(r"[a-z][a-z0-9-]*")` and `rule_fault` (277) tests `RULE_ID.fullmatch(rid)`, which cannot match the trailing `"\n"`. Read, not run: the shaper's guard admits neither `python3` nor the guard script. `agent-os/standards/scripts/guard.md`'s ask-rules bullet says a malformed list fails closed, "refusing every write until a person fixes the file".
  - The workflow: `workflows/redline-loop.js:109` is `const RULE_ID = /^[a-z][a-z0-9-]*$/`, with no `m` flag, so `$` matches only at the end of the input; 120-121 fail the launch with `args.askRules[0]: id must match [a-z][a-z0-9-]*; got "a\n"`. Read, not run (`node` is likewise refused to the shaper; the semantics are the language's).
- **R2-1: does the evidence say what setup should do with such an id?** Yes, it says to refuse it with the shared message. The #49 spec's decision 1 (`agent-os/specs/2026-10-30-0826-49-per-repository-ask-rules/shape.md:13`) gives "one validation wording shared by the skill's precheck, `redline-setup.sh config --ask-rules` and the guard: `id` matches `[a-z][a-z0-9-]*`". The script's header (`scripts/redline-setup.sh:39`, 44) says "(id [a-z][a-z0-9-]*, unique; ...)" and "A bad list exits 2 naming the rule". The README's `config` row (`README.md:310`) says "a bad rule exits 2 naming it", and the comment above the function (454-455) says "It tests what they test". The code disagrees for `"a\n"`, so the fix makes the code match those statements. Trimming the id is not an option the evidence leaves open: setup writes the list as given (`. + {askRules: $r}`, 509).
- **R2-1: does the proposed fix do it?** Yes, by running it. The same pipe with the id line rewritten to `test("\\A[a-z][a-z0-9-]*\\z")` (by `sed` on the pipe, not on the file) printed `askRules[1]: id must match [a-z][a-z0-9-]*` for `"a\n"`, `askRules[2]: ...` for `"\nab"` after a valid `"a-1"`, the same message for `"Bad"`, and nothing for `tests/setup-fixtures/ask-rules.json` (`craft-project-config`, `billing`). `jq -n -c '[...] | map(test("\\A[a-z][a-z0-9-]*\\z"))'` printed `[false,false,true,true,false,false,false]` for `["a\nB", "a\n", "ab", "a-1", "B\nab", "\nab", ""]`.
- **R2-1: does the planned test fixture hold the id it claims?** Yes. `printf '[{"id": "a\\n", "when": {"paths": ["x"]}, "reason": "r"}]\n' | jq -c '[.[0].id, (.[0].id | length)]'` printed `["a\n",2]`, and the same after a `jq -c .` pass, as `cmd_config` reads the file (505).
- **Reproductions.** The reviewer left no round 2 reproduction; `/tmp/redlinerepro/` holds only round 1's `fault.jq` and two rule lists. This repository has no PHP and no Pest, so the shaper wrote no scratch test; every run above was a read-only pipe.

## Decisions

- **R2-1: setup's ask-rules check matches the id against the whole string.** In `scripts/redline-setup.sh`, inside `ask_rules_fault`'s jq program, line 463's `test("^[a-z][a-z0-9-]*$")` becomes `test("\\A[a-z][a-z0-9-]*\\z")`. `\A` and `\z` anchor to the start and end of the string, where jq's `$` also matches before a final newline. The message text stays exactly as it is, so the three checks keep one wording. The comment above the function (454-455) gains the reason and the finding id. `plan.md` Task 2.
  Decided by: redline

- **R2-1: refuse, never trim.** The documented behaviour answers this (Unattended answers): a bad list exits 2 naming the rule, with the guard's wording. Setup writes the list the person gave, so a trimmed check would let the file disagree with the guard all the same.
  Decided by: redline

- **R2-1: the tests.** Three `tests/setup-test.sh` cases directly after the bad-id pair (228-230). An id `"a\n"` exits 2 naming the rule, two cases written red first. An id `"a-1"` is still accepted, a neighbouring decision that pins the digit and the hyphen through the new anchors. The bad-id pair itself is the other neighbour. `plan.md` Task 2.
  Decided by: redline

- **R2-1: the guard, the workflow and the skill's precheck are left alone.** The guard (`fullmatch`) and the workflow (`/^...$/` with no `m`) already refuse `"a\n"`, the guard is a person's file in this repository, and the skill's precheck is read by the skill, not matched by a regex. Scope is the round's finding.
  Decided by: redline

- **R2-1: no guard row or loop check pins `"a\n"` at the other two sites.** `testing/tests` line 9 asks for a second call site when one fix covers several. Here only setup's site was wrong. A guard row would need a new malformed fixture, which `tests/guard-test.sh` builds and no finding asks for.
  Decided by: redline

## Deferred

None.

## Proportionality

- **R2-1** (correctness, low). Likelihood: very low. The setup skill writes the rules file itself from ids it asks the person for, so an id ending in a newline comes from a hand-written file passed to `--ask-rules`, or from a stray newline the skill puts inside an id string. Impact when it fires: setup writes the list. After that the guard fails closed and refuses every write by every Redline role, and every launch stops with a line naming the rule. The failure is loud and is fixed by editing `.claude/redline.json` by hand, but setup told the person their list was good. Cost: one jq expression and two comment lines in `scripts/redline-setup.sh`, plus five lines in `tests/setup-test.sh`. Both files are in the PR's diff. There is no new dependency, and no message or output shape changes. Fix.

## Observed while reading, outside this round's scope

- `scripts/redline-setup.sh:636-637` (in `PY_CHECKS`, the `checks` generator) builds `IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")` and `NAME = re.compile(r"^[a-z][a-z0-9-]*$")`, used with `.match` for a var's name and env (641), a step name (673) and the formatter's name (688). Python's `$` also matches before a final newline, so by reading, a `checks.json` step name such as `"tests\n"` passes that check. It was not run, because the shaper's guard refuses `python3`, and what the generator then writes was not traced. The code predates #49, sits outside this PR's diff and outside the round's finding, so it is not planned here. A person may open an issue for it. A fix there would touch the checks generator, which `shape-spec.md`'s unattended point 11 routes with care.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** N/A. No product line changes.

## Standards Applied

- **scripts/bash-conventions.** The validator bullet (line 19) that R1-2 added says a validator sharing its messages with another shares its tests too. R2-1 is a third case of that rule, so it is retrospective item 1. Usage errors exit 2 with a one-line reason, which is what the fixed check gives `"a\n"`. jq reads and writes every JSON value. A jq program that holds a quote goes in a quoted heredoc, as this one already does.
- **testing/tests.** A case per tested surface in the same commit, red before green (the `"a\n"` pair), with a neighbouring decision beside it (the `"a-1"` case; the bad-id pair). The ask-rules bullet (line 17) lists the validation messages setup's harness proves (retrospective item 2). The tests write only under the temp directory.
- **process/docs-gate.** Task 2 names the README section for `scripts/redline-setup.sh` and the reason there is no reader-facing change (`plan.md`, the task's Docs line and the Docs entries table).
- **process/standards-retrospective.** The items below are proposed. The standards approver approves them and the implementer applies them in one commit (`plan.md` Task 3).
- **prompts/attribution.** Commit messages and this folder carry only Redline's name.

## Standards retrospective (proposed)

This was done mechanically over the Decisions above. Nothing has been built yet, so there is no As built deviation and no red check to list.

1. **R2-1** (missing), `agent-os/standards/scripts/bash-conventions.md`, the validator bullet (line 19). Replace its ending

   "so a non-object element gets `not an object` and exit 2 instead of jq's own error and exit 5 under `set -e` (#52, R1-2)"

   with

   "so a non-object element gets `not an object` and exit 2 instead of jq's own error and exit 5 under `set -e` (#52, R1-2), and a pattern is matched against the whole string, `\A...\z` in jq: jq's `$` also matches before a final newline, so `^[a-z][a-z0-9-]*$` passed the id `"a\n"`, which the guard's `fullmatch` and the workflow's `/^...$/` refuse, and setup wrote a list that then stopped every run (#52, R2-1)"

   After this round all three validators the bullet names follow it. The bullet stays limited to validators that share messages. It is not widened to every pattern in `scripts/`, because the `checks` generator's `NAME` and `IDENT` (Observed while reading) would not follow a wider rule yet, and a standard the codebase does not follow is the person's call.

2. **R2-1** (missing), `agent-os/standards/testing/tests.md`, the ask-rules bullet (line 17). Replace

   "every validation message (a null `paths` or `prose` and a non-object rule before an object included, #52, R1-2)"

   with

   "every validation message (a null `paths` or `prose` and a non-object rule before an object included, #52, R1-2; an id ending in a newline, #52, R2-1)"

3. The other Decisions teach no further rule. Refusing rather than trimming is already the header's "A bad list exits 2 naming the rule". Leaving the guard, the workflow and the precheck alone is a one-off of scope. Not pinning the other two sites is `testing/tests` line 9 read as written. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution` and `index.yml` (every description stays accurate): no changes. No pattern is used that is not in `agent-os/standards/`.

If the standards approver declines every item, record "Standards retrospective: no changes" under Decisions instead.
