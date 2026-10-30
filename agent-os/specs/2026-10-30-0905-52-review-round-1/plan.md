# PR #52 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 found four correctness bugs, all at the edges of the ask rules #49 adds. R1-1 is in `scripts/redline-guard.sh`, which no Redline role may write, so it is deferred: the round pins today's decisions in `tests/guard-cases.tsv` and corrects the README, and a person changes the guard after the run. R1-2, R1-3 and R1-4 are fixes. Nothing goes back to the person.

- **R1-1** (Task 2, defer): two pinned `allow` rows and a README Known limits correction.
- **R1-2** (Task 3): setup's ask-rules check tests a key's presence and reads only objects' ids.
- **R1-3** (Task 4): the setup skill passes `[]` when the person removes every rule.
- **R1-4** (Task 5): `forceAskRules` leaves a human pass's `none` as it is.

Every commit message starts `redline: ` and references (#49), the issue the PR closes. Every path below is under `/Users/michaelwitwicki/Code/Claude/redline/`.

The guard admits neither `node` nor the `tests/*.sh` harnesses to the implementer (its `tests` group is `php artisan test`, `vendor/bin/pest` and `composer test`, `scripts/redline-guard.sh:60`), so every harness runs through the gate: `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline` for a red run (recorded baseline 78 s, `.claude/redline/checks.json:10`, so it fits one foreground call with `timeout: 600000`), and Task 7's command for the round. No task touches the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`, `.claude/redline/checks.json`, `.claude/redline/checks.sh`, `scripts/checks-template.sh`, `scripts/redline-gate.sh`, `scripts/redline-guard.sh` or `hooks/hooks.json`, so nothing is restamped or regenerated.

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-30-0905-52-review-round-1/plan.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-1/shape.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-1/standards.md`
- `agent-os/specs/2026-10-30-0905-52-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never with a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #52 (#49)`

## Task 2: R1-1 (deferred) pin the wildcard operands a paths rule does not refuse, and name the limit in the README

Files: `tests/guard-cases.tsv`, `README.md`. `scripts/redline-guard.sh` is not changed: the guard refuses it to every role in this repository (`scripts/redline-guard.sh:208-210`), and a person makes the full fix after the run (`shape.md`, Deferred).

What happens today:
- `scripts/redline-guard.sh:406` cuts a Bash write target at its first `*` or `?`; `protected()` and `ask_rule()` see only the prefix (411).
- `ask_rule()` refuses when a rule's regex matches the prefix (343) or the prefix is the rule's literal root or a directory above it (345). `glob_root()` (259-268) is empty when a pattern's first segment holds a wildcard.
- So, in the `# @cwd ASKRULES` fixture, `sed -i '' 's/a/b/' app/*.secret.yaml` (cut to `app/`) and `sed -i '' 's/a/b/' config/proj*/project.yaml` (cut to `config/proj`) are allowed. Row 458, `sed -i '' 's/a/b/' config/project/*.yaml`, cut to the root itself, is denied: the neighbouring decision.
- `README.md:189` says "so a Redline role cannot write under a rule by any of those"; `README.md:128` says "The guard refuses a write under one of its globs by every Redline role".

Red first (these are today's decisions, so the rows pass at once; the red case is the count): `grep -c "#52, R1-1" tests/guard-cases.tsv` prints `0` and `grep -c "checked by its literal prefix only" README.md` prints `0`.

Change 1, `tests/guard-cases.tsv`: directly after line 474 (`redline:redline-implementer	allow	Write	app/x.yaml`) and before line 475 (`# Every writing role: the shaper and the resolve agent are refused by the rule, not only by their prefixes.`), insert these six lines. The two rows have four tab-separated fields each, no fifth column, exactly as the rows around them:

```
# #52, R1-1 (deferred to a person): a Bash operand holding * or ? is checked by its literal prefix only,
# cut at the first wildcard, so these two are allowed today: app/ holds no root of yaml-anywhere (a pattern
# that starts with a wildcard has none), and config/proj stops inside craft-config's root. A person flips
# both to deny, naming yaml-anywhere and craft-config, when the guard checks the operand itself.
redline:redline-implementer	allow	Bash	sed -i '' 's/a/b/' app/*.secret.yaml
redline:redline-implementer	allow	Bash	sed -i '' 's/a/b/' config/proj*/project.yaml
```

Keep them inside the `# @cwd ASKRULES` block (lines 454-481), before `# @cwd ASKRULESBAD` (483).

Change 2, `README.md:189`, the Known limits bullet. Replace the whole line with:

```
- **A paths ask rule refuses the writes the guard can see.** The guard checks every write target it can extract (the Write and Edit tools, redirections, `tee`, `sed -i`, `mv`, `cp`, `rm`, `mkdir`, `touch`, `git add`), so a Redline role cannot write under a rule by any of those with a literal path. A Bash operand holding `*` or `?` is checked by its literal prefix only, cut at the first wildcard: `config/project/*.yaml` and `rm -rf config` are refused, since the prefix is the rule's root or holds it, but `config/proj*/project.yaml` under `config/project/**` (the prefix stops inside a segment of the root) and `app/*.secret.yaml` under `*.secret.yaml` (a pattern with no literal root) are not (#52, R1-1; `tests/guard-cases.tsv` pins both until a person changes the guard). It does not see the files a build tool writes (`php artisan make:`, a formatter, `npm run build`), the operands `xargs` supplies to the implementer, or the files `find -exec` visits (it checks the starting directory). The checker's allowed list is the PR's files plus the approved plan, so a file under a rule that the PR already changes is not caught there either; the guard, the forced `ask` and the plan approver's bounce are the enforcement.
```

Change 3, `README.md:128`, the `paths` bullet under "Ask rules". Replace

> (and a write to a directory that holds the rule's root, such as `rm -rf config`); the target is resolved

with

> (and a write to a directory that holds the rule's root, such as `rm -rf config`; a Bash operand holding `*` or `?` is checked by its literal prefix only, see Known limits); the target is resolved

Leave the rest of the line as it is.

Proof:
- `grep -c "#52, R1-1" tests/guard-cases.tsv` prints `1`; `grep -n "proj\*" tests/guard-cases.tsv` prints one line, an `allow` row.
- `grep -c "checked by its literal prefix only" README.md` prints `2` (lines 128 and 189); `grep -c "#52, R1-1" README.md` prints `1`.
- The gate's `guard` check prints `N passed, 0 mismatched` with two more rows than at baseline (428 at shaping time, so 430), and row 458 still denies.
- `git show --stat HEAD` after the commit lists only `tests/guard-cases.tsv` and `README.md`.

Docs: this task is the README edit itself, in Known limits and Settings → Ask rules. `tests/guard-cases.tsv` is not under a directory the Docs step lists, and `scripts/redline-guard.sh` is not touched.

Commit: `redline: R1-1 pin the wildcard operands a paths ask rule does not refuse, and name the limit in the README (#49)`

## Task 3: R1-2 have setup's ask-rules check fault a null paths or prose and a non-object rule, as the guard does

Files: `scripts/redline-setup.sh`, `tests/setup-test.sh`

What happens today:
- `scripts/redline-setup.sh:464` and `:465` test `$r.when.paths != null`, and `:466` tests `$r.when.prose != null`. Line 463 has already required `when`'s keys to be exactly `["paths"]` or `["prose"]`, so `{"when": {"paths": null}}` passes every line and `config --ask-rules` writes it. The guard (`scripts/redline-guard.sh:285-292`) and the workflow (`workflows/redline-loop.js:132`, `138`) fault the same list, so every later write is refused and the launch stops.
- `:462` reads `[.[:$i][] | .id]`: a string before an object aborts jq ("Cannot index string with string ("id")"), and the substitution at 504 exits the script with jq's code under `set -e`, not 2.

Red first: in `tests/setup-test.sh`, directly after line 237 (the "not a list: exit 2" case) and before line 238, add these seven lines:

```
printf '[{"id": "a", "when": {"paths": null}, "reason": "r"}]\n' > "$WORK/rules-paths-null.json"
expect_stderr "a null paths: exit 2" "rule 'a': paths must be a non-empty list of non-empty strings" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-paths-null.json"
printf '[{"id": "a", "when": {"prose": null}, "reason": "r"}]\n' > "$WORK/rules-prose-null.json"
expect_stderr "a null prose: exit 2" "rule 'a': prose must be a non-empty string" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-prose-null.json"
printf '["x", {"id": "a", "when": {"paths": ["x"]}, "reason": "r"}]\n' > "$WORK/rules-nonobject.json"
expect_stderr "a non-object rule before an object: exit 2 naming it" "askRules\[1\]: not an object" config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-nonobject.json"
expect_exit "a non-object rule before an object: exit 2" 2 config --reviewer sam --baseline-seconds 29 --ask-rules "$WORK/rules-nonobject.json"
```

Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `setup` check must print `N passed, 4 failed`, the four being the new cases: today the two null lists exit 0 with nothing on stderr, and the non-object list prints jq's error and exits 5.

Change, `scripts/redline-setup.sh`, inside `ask_rules_fault`'s jq program only (every message text stays exactly as it is):
- Line 462: `([.[:$i][] | .id] | index($r.id))` becomes `([.[:$i][] | objects | .id] | index($r.id))`.
- Line 464: `elif $r.when.paths != null and (` becomes `elif ($r.when | has("paths")) and (`.
- Line 465: `elif $r.when.paths != null and (` becomes `elif ($r.when | has("paths")) and (`.
- Line 466: `elif $r.when.prose != null and (` becomes `elif ($r.when | has("prose")) and (`.
- The comment at 452-453, after "so a person reads one message.", gains: "It tests what they test: a key's presence, never a non-null value, and the id of an object only (#52, R1-2)."

Proof:
- After the red run, the gate's `setup` check prints `N passed, 0 failed`, with four more cases than at baseline (269 at shaping time, so 273).
- `grep -c "when.paths != null" scripts/redline-setup.sh` prints `0` (red: `2`); `grep -c "when.prose != null" scripts/redline-setup.sh` prints `0` (red: `1`); `grep -c "objects | .id" scripts/redline-setup.sh` prints `1` (red: `0`).
- The existing validation cases (lines 225-239) stay green: the neighbouring decisions.
- `git show --stat HEAD` lists only `scripts/redline-setup.sh` and `tests/setup-test.sh`.

Docs (the file is under `scripts/`): README `redline-setup.sh` table, the `config` row; no template. No reader-facing change: the row already says "a bad rule exits 2 naming it", and the script's header (`scripts/redline-setup.sh:44`, "A bad list exits 2 naming the rule") already states it; the fix makes the script do what both say.

Commit: `redline: R1-2 have setup's ask-rules check fault a null paths or prose and a non-object rule as the guard does (#49)`

## Task 4: R1-3 have setup pass an empty ask-rules list when the person removes every rule

Files: `skills/setup/SKILL.md`, `tests/setup-test.sh`, `README.md`

What happens today:
- `skills/setup/SKILL.md:102`: "When there are rules, write the list ... and pass it as `--ask-rules`; with none, omit the flag."
- Without the flag, `config` keeps the file's `askRules` (`scripts/redline-setup.sh:42-43`; `cmd_config` 527 and 547). So a rerun on which the person removes every rule leaves the old list enforced by the guard and every later launch.
- With `--ask-rules` holding `[]`, `config` already clears it: no fault, 547 rewrites the file with `.askRules = []` and lists `updated.askRules`.

Red first: `grep -c "with none, omit the flag" skills/setup/SKILL.md` prints `1`.

Change 1, `skills/setup/SKILL.md:102`. Replace the sentence

> When there are rules, write the list with the Write tool to `${TMPDIR:-/tmp}/redline-ask-rules.json` as a JSON array of `{id, when, reason}` and pass it as `--ask-rules`; with none, omit the flag.

with

> When the list is new or changes (a rule added, edited or removed), write the whole list with the Write tool to `${TMPDIR:-/tmp}/redline-ask-rules.json` as a JSON array of `{id, when, reason}` and pass it as `--ask-rules`; when the person removes every rule, that list is `[]`, which clears the file's `askRules` (the dry run lists it under `updated.askRules`). Omit the flag only when the file's list stays as it is, or when there is none and the person adds none: without the flag `config` keeps the file's `askRules` as they are.

Keep "Then:" after it and the rest of the line as it is.

Change 2, `tests/setup-test.sh`: directly after line 221 (the "a changed list with a baseline move: the file carries all three and keeps the rest" case) and before line 222 (`--force without the flag drops the list`), add these three lines:

```
printf '[]\n' > "$WORK/no-rules.json"
expect_json "an empty list removes every rule: only askRules updated, written" '[(.updated|keys|join("+")), (.written|tostring), (.askRules|length|tostring)] | join(",")' "askRules,true,0" config --reviewer marcamos --baseline-seconds 1048 "$C5" --ask-rules "$WORK/no-rules.json"
[[ "$(jq -c .askRules "$C5/.claude/redline.json")" == '[]' ]] && ok "an empty list removes every rule: the file holds askRules []" || bad "an empty list removes every rule: the file holds askRules []" "$(jq -c .askRules "$C5/.claude/redline.json")"
```

They pin the script behaviour the new sentence relies on, and pass before and after the skill edit (the defect is in skill text no harness reads). `--baseline-seconds 1048` keeps `checker` and `checkerStallMs` as line 220 set them, so only `askRules` is updated; line 222's `--force` case runs next and still drops the list.

Change 3, `README.md:39` ("Set up a repository", item 2). Replace

> and the rules when a different list is given, and keeps

with

> and the rules when a different list is given (`[]` removes them all), and keeps

Proof:
- `grep -c "with none, omit the flag" skills/setup/SKILL.md` prints `0`; `grep -c "clears the file's" skills/setup/SKILL.md` prints `1`.
- `grep -c "removes them all" README.md` prints `1` (red: `0`).
- The gate's `setup` check prints `N passed, 0 failed`, with two more cases than after Task 3.
- `git show --stat HEAD` lists only `skills/setup/SKILL.md`, `tests/setup-test.sh` and `README.md`.

Docs (the file is under `skills/`): README "Set up a repository", item 2; no template. Updated by this task's Change 3.

Commit: `redline: R1-3 have setup pass an empty ask-rules list when the person removes every rule (#49)`

## Task 5: R1-4 leave a human-pass comment that asks for nothing as none under an ask rule

Files: `workflows/redline-loop.js`, `tests/loop-test.mjs`, `agents/redline-shaper.md`, `README.md`

What happens today:
- `workflows/redline-loop.js:1845-1889`, `forceAskRules`: a paths match on `f.file` (1854) sets `s.disposition = 'ask'` (1865) whatever the disposition, `none` included, with the warning at 1861-1863.
- A `none` reaches it only in a human review pass (`checkDispositions`, 1817-1826, stops a Redline round with one before `forceAskRules` runs, 1999-2000 and 2114-2115).
- Forced, on autopilot it gets `leftDecision` (2024-2025), the `left` reply (922-923) and a Deferred entry; on guided or plan the pass stops for the author. Without a rule a `none` gets outcome `none` (1783-1784) and the reply `no change requested` (926-927).

Red first: in `tests/loop-test.mjs`, scenario 12, directly after line 985 (the check named `rules: the human summary says so`) and before the closing `}` at 986, add:

```js
  // A comment that asks for nothing stays none on a rule-covered file: there is no change to leave to the person (#52, R1-4).
  const praise = await go('rules: a human-pass comment that asks for nothing', { ...ruleArgs, firstRound: 3, interrupt: 'autopilot', revise: { kind: 'human', n: 1, reviewer: 'marcamos', reviewIds: [7], body: '', specFolder: folder, findings: [{ ...hf, description: 'Nice.' }], commentIds: { 'H1-1': 905 }, posted: true } }, { reviews: [], none: ['H1-1'], commitIds: [[]] })
  check('rules: a none on a rule-covered file is not forced: no change requested, nothing left or deferred, no warning', praise.res.status === 'done' && replyFor(praise.calls, 'push and reply h1', 'H1-1').startsWith('Redline human review 1: no change requested.') && praise.res.forced.length === 0 && praise.res.deferred.length === 0 && !praise.res.warnings.some((w) => w.includes('makes it an ask')), [praise.res.status, praise.res.error, replyFor(praise.calls, 'push and reply h1', 'H1-1'), praise.res.forced, praise.res.deferred, praise.res.warnings])
  check('rules: the human summary says the comment asked for nothing', comment(praise.calls, 'summary comment') === 'Redline human review 1 · review by @marcamos: nothing to fix; H1-1 asked for nothing. No commits, so no final nit pass.', comment(praise.calls, 'summary comment'))
```

`ruleArgs`, `folder` and `hf` are scenario 12's own (917, 981, 982). The expected summary is the one the human-pass scenario already pins for a lone `none` with no commits (line 808). Run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline`. The `loop` check must print `N checks passed, 2 failed`, the two being the new checks: today the reply opens `Redline human review 1: left to the author under repository rule craft-config`, `forced` and `deferred` each hold H1-1, the warning `human review 1: the shaper sorted H1-1 as none; repository rule craft-config makes it an ask for the person` is recorded, and the summary reads `... H1-1 left to @author under repository rule craft-config. ...`. If the red output shows a different reply or summary text for reasons other than the forcing, record it under As built.

Change 1, `workflows/redline-loop.js`, in `forceAskRules`: directly after the `if (!s) { continue }` block (1849-1851), add

```js
    // A human pass's none is a comment that asks for nothing: it makes no change, so there is
    // nothing to leave to the person, and it keeps its "no change requested" reply (#52, R1-4).
    if (s.disposition === 'none') {
      continue
    }
```

Change 2, the docblock above it (1838-1844). Replace the seven comment lines with:

```js
// The forcing point (#49): after shaping, whatever fix, defer or ask the shaper returned, a finding
// a repository ask rule covers is an ask to the person. A paths rule is matched on the finding's file
// and on the files the shaper's task would touch; a prose rule is the shaper's own askRule tag. The
// finding becomes ask and pending, loses any deferred entry, gets a judgment call when the shaper
// gave none, and is recorded under record.forced for the replies, the handoff and the thread sweep.
// A human pass's none, a comment that asks for nothing, is left as it is: there is no change to
// leave to the person (#52, R1-4). Deterministic from args and the shaper's JSON, so a relaunch
// replays it. The numeric limits of #25 force here too, when they come.
```

No prompt string changes, so the replay checks (`samePrefix`) stay as they are.

Change 3, `agents/redline-shaper.md:26` (rule 7's ask-rules paragraph). Replace

> the workflow forces `ask` for any finding a `paths` rule covers whatever disposition you return, and the plan approver bounces a task that writes under one.

with

> the workflow forces `ask` for any finding a `paths` rule covers whatever `fix` or `defer` you return, and the plan approver bounces a task that writes under one. In a human review pass, a comment that asks for nothing is `none` (rule 8) whatever file it is on: it changes nothing, so the workflow leaves it as it is.

Change 4, `README.md:126`, the last sentence of the paragraph. Replace

> In a human review pass a teammate's comment under a rule takes the same path.

with

> In a human review pass a teammate's comment under a rule takes the same path, unless it asks for nothing (praise, thanks): that one stays `none` and gets `no change requested`, since there is no change to leave to the person (#52, R1-4).

Proof:
- After the red run, the gate's `loop` check prints `N checks passed, 0 failed`, with two more checks than at baseline (397 at shaping time, so 399). The check at line 984 (a comment the shaper sorts `fix` on the same file is still left to the author) stays green: the neighbouring decision.
- `grep -c "s.disposition === 'none'" workflows/redline-loop.js` prints `1` (red: `0`).
- `grep -c "whatever disposition you return" agents/redline-shaper.md` prints `0` (red: `1`).
- `grep -c "#52, R1-4" README.md` prints `1` (red: `0`).
- Gate step 2 (`claude plugin validate .`, in Task 7) passes, so the agent file still parses.
- `git show --stat HEAD` lists only the four files above.

Docs (the files are under `workflows/` and `agents/`): README Settings → Ask rules (line 126); no template. Updated by this task's Change 4. The Files table rows for `workflows/redline-loop.js` and `agents/redline-*.md` stay true.

Commit: `redline: R1-4 leave a human-pass comment that asks for nothing as none under an ask rule (#49)`

## Task 6: Standards retrospective

Files: `agent-os/standards/scripts/guard.md`, `agent-os/standards/scripts/bash-conventions.md`, `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`

Apply items 1 to 5 under "Standards retrospective (proposed)" in `shape.md`, only those the standards approver approved, in one commit after the finding commits, keeping each file's headings. Item 2's and item 3's bullets go directly after the `config_differs` bullet of `bash-conventions.md`, in that order; item 1's new bullet goes directly after the ask-rules bullet of `guard.md`. If nothing is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead.

Proof: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0` (no heading line changed).

Docs: no reader-facing change. The files are not under a directory the Docs step lists, and the README does not describe `agent-os/standards/`.

Commit: `redline: record the round 1 review lessons in the standards (#49)`

## Docs entries

Gate step 10, one row per file the round touches. Each task above carries the same entry in its own Docs line.

| File | README section (template) | Commit or reason |
| --- | --- | --- |
| `README.md` | Known limits; Settings → Ask rules; Set up a repository, item 2 | Tasks 2, 4 and 5's commits (the README edits themselves). Not under a listed directory |
| `scripts/redline-setup.sh` | `redline-setup.sh` table, `config` row; no template | no reader-facing change: the row and the script's header already say a bad list exits 2 naming the rule, which the fix makes true |
| `skills/setup/SKILL.md` | Set up a repository, item 2; no template | Task 4's commit |
| `workflows/redline-loop.js` | Settings → Ask rules; no template | Task 5's commit |
| `agents/redline-shaper.md` | Settings → Ask rules; Files (`agents/redline-*.md`); no template | Task 5's commit; the Files row stays true |
| `tests/guard-cases.tsv`, `tests/setup-test.sh`, `tests/loop-test.mjs` | none | no reader-facing change: not under a listed directory, and the Files rows describing them stay true |
| `agent-os/standards/...` | none | no reader-facing change: the README does not describe the standards |
| `agent-os/specs/2026-10-30-0905-52-review-round-1/` | none | no reader-facing change: spec folders are the record |

`scripts/redline-guard.sh` is not touched (R1-1 is deferred to a person). The round adds no config key, subcommand, allow rule or exit code, and touches nothing under `templates/`, `hooks/` or `.claude-plugin/`.

## Task 7: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-30-0905-52-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Docs**: every row under Docs entries names its commit or its reason; the README rows' commits are listed by hash in As built.
11. **Standards retrospective**: Task 6, from the proposed list in `shape.md`, as the standards approver approved it.
12. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.
