# Checker reports no_git_block on a baseline whose git key is null (#55)

Spec folder: `agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/`

Shaped by hand on 2026-10-30 with `/agent-os:shape-spec`; the person makes the commits. Issue #55 is the source of truth: both changes as written there, with the decisions below.

## Context

On #54 round 1, `checks.sh --baseline` exited 0 with `ok: true` and `git: null` (the documented baseline value). The checker (Haiku) returned `status: "result_unreadable", reason: "no_git_block"`, saying the key was "present as null" and then applying the missing-key rule of `agents/redline-checker.md:50`. The workflow took the status at face value (`stopReason()`, `workflows/redline-loop.js:1423-1431`) and stopped the run at baseline, before any commit.

What the survey established (read only; nothing changed in the tree):

- `agents/redline-checker.md:45` already says `null` in `--baseline` mode is a key; line 50 (`no_git_block`: "the object parses but has no `git` key") is the rule the checker applied. The workflow's own checker prompt (`workflows/redline-loop.js:1268`, `:1284`) says "has no git key", is accurate, and is pinned byte-for-byte by `tests/loop-test.mjs:733`.
- `stopReason(out, command, needGit)` (`workflows/redline-loop.js:1416`) is called for the baseline with `needGit: false` (`:2162`) and from `judge()` with `needGit: true` (`:1448`). It tests exit 2, then `result_unreadable`, then a null result, then a missing git block. The checker's `error` is normalized in `run()` (`:359-366`).
- `checker()` (`:1983`) is the one call site both the baseline (`:2161`) and the per-pass check (`:2199`) go through. Warnings beside those calls use the prefixes `baseline:` (`:2168`) and `${pass.name}:` (`:2203`).
- `CHECKER_SCHEMA` (`:586`) fixes `reason` to `['', 'spilled', 'not_json', 'no_git_block', 'backgrounded', 'no_result']`; unchanged by this spec.
- `tests/loop-test.mjs` section 9 (`:623-675`) scripts the checker per label (`baseline`, `check r1`, `recheck r1`); the default baseline result has `git: null` (`:146`), and the existing `no_git_block` check (`:658-659`) scripts an object with no `git` key and asserts the stop. That check is the neighbour that must keep passing.
- `README.md:262` (`## checks.sh`, the **Exit code** paragraph) names every `result_unreadable` reason, so the Docs step lands there. `agents/redline-checker.md` has no row of its own in the Files table (`agents/redline-*.md` is one row).
- `agent-os/product/`: `mission.md` says the verdict comes from the script, never an agent ("Decisions stay with people"; the agents standard: "The script decides, never an agent"). The override is that rule applied to the checker's structural claims. No product adjustment.

## Decisions (the prompt's, plus three answered 2026-10-30)

1. **Both changes as the issue writes them**: the checker sentence and the workflow override, plus the loop-test check. Known limits: nothing added; the warning is the record.
2. **The override covers the two structural reasons, `not_json` and `no_git_block`** (answered 2026-10-30, recommended option). A valid structure is a `result` that is a non-null, non-array object whose `checks` is an array and that has a `git` key with any value, so `null` at baseline counts. `spilled`, `backgrounded` and `no_result` claim the output went where the checker could not read it, which the JSON cannot refute: they stop as today. In a full pass a `git: null` is overridden to `read` and then stops on the existing "the checker result has no git block" check, so a real missing block is never hidden.
3. **The warning names the reason, the evidence and the override** (answered 2026-10-30): `<prefix>: the checker said result_unreadable (<reason>), but the JSON it returned is one object with a checks array and a git key; the workflow overrode the status and read the result`, with `baseline:` or `round N:` as its neighbours use.
4. **The checker role change is one sentence with the baseline example**, on line 50 of `agents/redline-checker.md`. The workflow's prompt text (`:1268`, `:1284`) is unchanged: it is already accurate and the loop test pins it.
5. **Docs step**: the README's `## checks.sh` Exit code paragraph names the statuses, so it gains one sentence; see the Docs entries.
6. **Standards carried** (answered 2026-10-30): `workflow/agents`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. `workflow/replay` was offered and declined: no prompt text changes and warnings are not prompts.
7. The person makes every commit. Visuals: none. References: the files above.

## Task 1: Save spec documentation

Create `agent-os/specs/2026-10-30-1558-55-checker-overrides-structural-unreadable/` with:

- `plan.md`: this plan, with the Docs entries table and an As built section filled at the gate.
- `shape.md`: scope (the issue's two changes), the seven decisions above with the three answers of 2026-10-30 and their reasons, context (visuals none; references; product N/A with the mission line), `## Standards retrospective (proposed)` (Task 6's list), Standards Applied.
- `standards.md`: full text of `workflow/agents`, `testing/tests`, `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`, as they read at shaping time.
- `references.md`: `workflows/redline-loop.js` 359-366 (`run()` normalization, the model for a once-per-result rule), 1408-1440 (`stopReason`), 1447-1495 (`judge`), 1983-1987 (`checker()`), 2156-2170 and 2197-2209 (the two call sites and their warning prefixes); `agents/redline-checker.md` 43-52; `tests/loop-test.mjs` 141-152 (the checker mock) and 623-675 (section 9); `README.md` 262; `agent-os/specs/2026-10-29-1559-13-docs-gate-step/` (last hand-shaped spec, plan shape).

## Task 2: The checker role sentence

**File:** `agents/redline-checker.md`, line 50.

Replace the `no_git_block` bullet with:

> - `no_git_block`: the object parses but has no `git` key at all; `git: null`, which `--baseline` prints, is a present key and the object is `read`. Return the object you have as `result`.

Nothing else in the file changes. `claude plugin validate .` still passes (frontmatter untouched).

## Task 3: The workflow override and the loop-test checks

**Files:** `workflows/redline-loop.js`, `tests/loop-test.mjs` (same commit; the checks land first and are seen red).

1. **Red first.** In `tests/loop-test.mjs` section 9, after the existing `no_git_block` check (line 659), add four scenarios using the section's helpers (`unreadable`, `stopped`, `repaired`, `pick`, `labels`, `brief`):
   - `checker: baseline git null read as no_git_block`: `checker: (label, out) => (label === 'baseline' ? { ...out, status: 'result_unreadable', reason: 'no_git_block' } : null)`. Assert `run.res.status === 'done'`, `pick(run.calls, 'implement r1')` present, `!repaired(run)`, and `run.res.warnings.includes('baseline: the checker said result_unreadable (no_git_block), but the JSON it returned is one object with a checks array and a git key; the workflow overrode the status and read the result')`. This is the issue's case.
   - `checker: not_json with a complete result is read`: same shape at `label === 'check r1'` with `reason: 'not_json'`. Assert `done`, no repair, and the `round 1:` warning with `(not_json)`.
   - `checker: spilled with a complete result still stops`: `label === 'check r1'` with `reason: 'spilled'` and the full `out.result`. Assert `stopped(run)`, the error includes `exceeded the Bash tool's inline limit`, and no warning containing `overrode`. The neighbouring decision for a run-level reason.
   - `checker: full pass git null read as no_git_block`: `label === 'check r1'` with `reason: 'no_git_block'` and `result: { ...out.result, git: null }`. Assert `stopped(run)`, the error includes `the checker result has no git block`, and the `round 1:` override warning is present (the override fired; the downstream check stopped the run).
   Run `node tests/loop-test.mjs`; the first two fail, the last two pass (they assert today's behaviour), and every existing check (656-659, 671-672 among them) stays green.
2. **Then the override.** In `workflows/redline-loop.js`, beside `stopReason` (above line 1414), add a comment naming #55 and #54 round 1, a `STRUCTURAL_REASONS = ['not_json', 'no_git_block']` constant, a `gateShaped(result)` predicate (non-null, non-array object; `Array.isArray(result.checks)`; `Object.prototype.hasOwnProperty.call(result, 'git')`), and a `readStructure(out)` that returns `{ out, warning: null }` unless `out.status === 'result_unreadable'`, the reason is structural and `gateShaped(out.result)`, in which case it returns a copy with `status: 'read'`, `reason: ''` and the decision 3 warning text.
3. Apply it once, in `checker(flag, snapshot, octane, label, prefix)`: after `run(...)`, `const read = readStructure(out)`; when `read.warning` is set, `warnings.push(\`${prefix}: ${read.warning}\`)`; return `read.out`. The baseline call passes `'baseline'`, the per-pass call passes `pass.name`. `stopReason()` and `judge()` are unchanged, so a run-level reason, a null result, exit 2 and a missing block stop exactly as before.
4. `node tests/loop-test.mjs` prints `N checks passed, 0 failed`, N up by four.

No prompt text changes, so the replay checks are unaffected; `CHECKER_SCHEMA` is unchanged.

## Task 4: README

**File:** `README.md`, `## checks.sh`, the **Exit code** paragraph (line 262). After "...or a result with no `git` block (#9)." add:

> A `result_unreadable` whose reason describes the JSON's shape (`not_json`, `no_git_block`) is checked against the JSON the checker returned: when that is one object with a `checks` array and a `git` key (`null` at baseline), the workflow reads it and records the checker's misread as a warning naming the reason; `spilled`, `backgrounded` and `no_result` describe where the output went, which the JSON cannot refute, so they stop as before (#55).

Known limits: no entry (decision 1).

## Task 5: Docs entries

| File | README section | Commit or reason |
| --- | --- | --- |
| `agents/redline-checker.md` | `## checks.sh`, Exit code paragraph | Task 4's commit |
| `workflows/redline-loop.js` | `## checks.sh`, Exit code paragraph | Task 4's commit |
| `tests/loop-test.mjs` | Files table (`tests/loop-test.mjs` row) | no reader-facing change: the row lists scenario families, not individual checker cases, and `tests/` is not a listed directory |
| `README.md` | `## checks.sh` | Task 4's commit (the change itself) |
| `agent-os/specs/2026-10-30-1558-55-.../` | none | no reader-facing change: spec folders are the record |
| `agent-os/standards/` (retrospective edits, if approved) | none | no reader-facing change: the README does not describe the standards |

## Task 6: Verification Gate

Run `.claude/redline/checks.sh --baseline` (steps 1 to 9; expect exit 0 with every check at its baseline exit; `node tests/loop-test.mjs` shows the four new checks), then:

- Step 10, Docs: every row of Task 5 names a commit or a reason.
- Step 11, standards retrospective, presented with AskUserQuestion (apply, adjust, none). Proposed:
  - `agent-os/standards/workflow/agents.md`, the bullet beginning "An agent that could not read what it was asked to relay returns a distinct status": append "A reason that claims something the workflow can check from the JSON it holds (`not_json`, `no_git_block`) is checked: when the result is one object with a `checks` array and a `git` key, the workflow reads it and records the misread as a warning naming the reason, since a Haiku checker read `git: null` as a missing key and stopped #54 at baseline. A reason about where the output went (`spilled`, `backgrounded`, `no_result`) stops as before: the JSON cannot refute it (#55)."
  - `agent-os/standards/testing/tests.md`, the bullet "A loop-test scenario scripts the checker's result shape per call (...)": add "a structural misread the workflow overrides, beside the run-level reason that still stops (#55)" to the parenthetical.
  - Approved edits land in their own commit; otherwise record "Standards retrospective: no changes" under Decisions in `shape.md`.
- Step 12: `plan.md` As built; any deviation under Decisions in `shape.md`.

Also from the repository root: `scripts/redline-gate.sh check .` exit 0 (no gate text changes, so the stamp stands), `scripts/redline-setup.sh version .claude/redline/checks.sh` exit 0, `git status --porcelain` empty after the commits. CI runs the same on the PR.

## Verification (end to end)

1. After Task 3 step 1 only: `node tests/loop-test.mjs` reports exactly two failures, both named `checker: baseline git null...` and `checker: not_json with a complete result...`.
2. After Task 3 step 3: `node tests/loop-test.mjs` prints `N checks passed, 0 failed`.
3. `claude plugin validate .` passes after Task 2.
4. `.claude/redline/checks.sh --baseline` exits 0; `scripts/redline-gate.sh check .` reports `match`.
5. Read the README sentence and the checker bullet aloud against decision 2: the same two reasons, the same structure test, the same three reasons that still stop.

## Suggested commit split (the person commits)

1. spec folder (Task 1); 2. checker role sentence (Task 2); 3. workflow override with the four loop-test checks (Task 3); 4. README (Task 4); 5. standards, if approved (Task 6); 6. the As built commit.

## As built (2026-10-30)

- Built as shaped, with one deviation: after Task 3 step 1, `node tests/loop-test.mjs` reported three failures, not two. The fourth check (a full pass with `git: null`) asserts the override warning beside the downstream stop, so it was red until the override landed. Recorded under Decisions in `shape.md`.
- After Task 3 step 3, `node tests/loop-test.mjs` prints `406 checks passed, 0 failed`.
- The override is `readStructure()` beside `stopReason()` in `workflows/redline-loop.js`, applied once in `checker()`, which now takes the warning prefix (`'baseline'` or `pass.name`) as its fifth argument. `stopReason()`, `judge()` and `CHECKER_SCHEMA` are unchanged.
- `.claude/redline/checks.sh --baseline`: `ok: true`, all nine checks exit 0 (syntax, validate, guard, loop, prefs, gate, setup, gh, background). `scripts/redline-gate.sh check .` reports `match`; `scripts/redline-setup.sh version` matches v1.
- Step 10 (Docs): every row of Task 5 names its task's commit or its reason; the README sentence sits in the `## checks.sh` Exit code paragraph.
- Step 11 (retrospective): both proposed edits approved and applied (`workflow/agents.md`, `testing/tests.md`); see `shape.md`.
- The person makes the commits; the Task 5 entries name them by task.
