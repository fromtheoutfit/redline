# PR #56 review round 1 — Plan

Shaped by Redline in unattended mode. Round 1 reviewed the whole pull request and found no correctness bug and one nit, R1-1. This is the final nit round. R1-1 is a fix: the README says the run's `detail.checker` keeps whatever the checker returned, but after a structural override (#55) it holds the copy the workflow read. Nothing goes back to the person and nothing is deferred.

- **R1-1** (Task 2): the README sentence says what `detail.checker` holds after an override, and a loop-test check pins the record.

Every commit message starts `redline: ` and references (#55), the issue the PR closes. Every path below is under `/Users/michaelwitwicki/Code/Claude/redline/`.

The guard does not let the implementer run `node` or the `tests/*.sh` harnesses directly, so every harness runs through the gate: `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh --baseline` while building (recorded baseline 78 s, `.claude/redline/checks.json:10`, so it fits one foreground call with `timeout: 600000`), and Task 4's command for the round.

No task touches any of these, so nothing is restamped or regenerated:
- the Verification Gate section of `.claude/commands/agent-os/shape-spec.md`;
- `.claude/redline/checks.json` and `.claude/redline/checks.sh`;
- `scripts/checks-template.sh` and `scripts/redline-gate.sh`;
- `scripts/redline-guard.sh` and `hooks/hooks.json`;
- `workflows/redline-loop.js` (the code is as the #55 spec designed it; see `shape.md`, Unattended answers).

## Task 1: Save spec documentation

Files:
- `agent-os/specs/2026-10-30-1610-56-review-round-1/plan.md`
- `agent-os/specs/2026-10-30-1610-56-review-round-1/shape.md`
- `agent-os/specs/2026-10-30-1610-56-review-round-1/standards.md`
- `agent-os/specs/2026-10-30-1610-56-review-round-1/references.md`

The shaper already wrote all four. Commit them in the round's first commit, never with a finding's change. Leave `redline/` under the folder to the workflow.

Commit: `redline: save review round 1 spec for PR #56 (#55)`

## Task 2: R1-1 say what detail.checker holds after a structural override, and pin it in the loop test

Files: `README.md`, `tests/loop-test.mjs`

What happens today:
- `workflows/redline-loop.js:1428-1436`: `readStructure()` returns a copy of the checker's result with `status: 'read'` and `reason: ''` when a structural reason (`not_json`, `no_git_block`) meets a gate-shaped result. `checker()` (2008-2016) records the warning and returns that copy.
- On a stop, `stageError('check', ..., { checker: checked })` (2238; the baseline's at 2194) puts that copy in the run's `detail.checker`.
- `README.md:262`, the `checks.sh` → Exit code paragraph, says right after the new #55 sentence: "The run's `detail.checker` keeps whatever the checker returned, its `error` normalized." For a full pass whose checker said `no_git_block` on `git: null`, the record shows `status: 'read'`, `reason: ''`, and the checker's own words are only in `warnings`.
- `tests/loop-test.mjs:671-672` asserts that run's stop and warning, not what the record keeps.

Change, `README.md` line 262. Replace exactly this sentence, and nothing else on the line:

```
The run's `detail.checker` keeps whatever the checker returned, its `error` normalized.
```

with:

```
The run's `detail.checker` keeps what the checker returned, its `error` normalized; after a structural override it holds the copy the workflow read, `status` `read` and `reason` empty, and the warning is where the checker's own reason is kept (#56, R1-1).
```

The sentence before it (the #55 override sentence) and the one after it ("The implementer repairs only failing checks and git-block findings.") stay as they are.

Change, `tests/loop-test.mjs`. Directly after line 672 (the check `'override: a full pass with git null is read, then stops on the missing block'`) and before line 673 (the `run = await go('checker: baseline unreadable', ...` line), add this one line, indented two spaces as its neighbours are:

```
  check('override: the stop record keeps the copy the workflow read, the checker\'s reason only in the warning', kept(run).status === 'read' && kept(run).reason === '' && (kept(run).result || {}).git === null && Array.isArray((kept(run).result || {}).checks), [kept(run), run.res.warnings])
```

`run` there is still the full-pass `git: null` run from line 671, and `kept` is the helper at line 635. The existing check at 672 is not changed.

No red run: the check pins behaviour that is already as the #55 spec designed it, and no code changes, so it passes at once. The sentence is what changes.

Proof:
- The gate's `loop` check prints `N checks passed, 0 failed` with one more check than at baseline: 406 at shaping time (the PR description), so 407. If the baseline count differs, record it under As built.
- `grep -c "keeps whatever the checker returned" /Users/michaelwitwicki/Code/Claude/redline/README.md` prints `0` (before: `1`).
- `grep -c "after a structural override it holds the copy the workflow read" /Users/michaelwitwicki/Code/Claude/redline/README.md` prints `1` (before: `0`).
- `grep -c "the stop record keeps the copy the workflow read" /Users/michaelwitwicki/Code/Claude/redline/tests/loop-test.mjs` prints `1` (before: `0`).
- The neighbouring decisions stay green: the four #55 override checks (666-672), `unreadable: the record keeps what the checker returned` (653, a `spilled` stop keeps `result_unreadable` and `spilled`), and `checker: a stop keeps the checker's error normalized in the record` (681).
- `git show --stat HEAD` after the commit lists only `README.md` and `tests/loop-test.mjs`.

Docs: the change is itself the README edit, in `## checks.sh` → Exit code (`README.md:262`); no template. `tests/loop-test.mjs` is not under a directory the Docs step lists. No config key, subcommand, allow rule or exit code is added.

Commit: `redline: R1-1 say what detail.checker holds after a structural override, and pin it in the loop test (#55)`

## Task 3: Standards retrospective

Files: `agent-os/standards/workflow/agents.md`, `agent-os/standards/testing/tests.md`

Apply items 1 and 2 under "Standards retrospective (proposed)" in `shape.md`, only those the standards approver approved, in one commit after the finding's commit, keeping each file's headings. Item 1 appends one sentence to the end of `agents.md`'s bullet beginning "An agent that could not read what it was asked to relay" (line 20). Item 2 replaces one phrase in the parenthesis of `tests.md`'s bullet "A loop-test scenario scripts the checker's result shape per call" (line 8). If nothing is approved, record "Standards retrospective: no changes" under Decisions in `shape.md` instead, and change no standard.

Proof: `git diff HEAD~1 -- agent-os/standards/ | grep -c "^[-+]#"` prints `0` (no heading line changed). `grep -c "#56, R1-1" /Users/michaelwitwicki/Code/Claude/redline/agent-os/standards/workflow/agents.md` and the same for `agent-os/standards/testing/tests.md` each print `1` for an approved item.

Docs: no reader-facing change. The files are not under a directory the Docs step lists, and the README does not describe `agent-os/standards/`.

Commit: `redline: record the round 1 review lessons in the standards (#55)`

## Docs entries

These are gate step 10's entries, one row per file the round touches. Task 2 carries the same entry in its own Docs line.

| File | README section (template) | Commit or reason |
| --- | --- | --- |
| `README.md` | `## checks.sh` → Exit code; no template | Task 2's commit: the `detail.checker` sentence says what the record holds after a structural override |
| `tests/loop-test.mjs` | none | No reader-facing change: not under a listed directory, and the README's description of the loop test stays true |
| `agent-os/standards/...` | none | No reader-facing change: the README does not describe the standards |
| `agent-os/specs/2026-10-30-1610-56-review-round-1/` | none | No reader-facing change: spec folders are the record |

The round adds no config key, subcommand, allow rule or exit code. It touches nothing under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`.

## Task 4: Verification Gate

Gate steps 1 to 9: run `/Users/michaelwitwicki/Code/Claude/redline/.claude/redline/checks.sh /Users/michaelwitwicki/Code/Claude/redline/agent-os/specs/2026-10-30-1610-56-review-round-1/redline/snapshot.json` until it exits 0. Its JSON is the evidence. Use `timeout: 600000` on the Bash call, or the start/wait pair when the prompt gives one.

10. **Docs**: every row under Docs entries names its commit or its reason. The `README.md` row names Task 2's commit.
11. **Standards retrospective**: Task 3, from the proposed list in `shape.md`, as the standards approver approved it.
12. **Spec folder**: `plan.md` reflects what was actually built, and any deviation from the shaped plan is recorded under Decisions in `shape.md`. The As built notes land in the round's last commit.
