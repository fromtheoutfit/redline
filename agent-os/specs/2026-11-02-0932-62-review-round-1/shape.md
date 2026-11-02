# PR #62 Review Round 1 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 1 on PR #62 (head `bugfix/18-redline-setupsh-checks-header-shows-escaped-commands-and-a-wrong-vars-line-read-checks-misses-gatefile-and-alwaysallowed`, issue #18), one finding:

- **R1-1** (correctness, low): the docs regex in `redline-setup.sh read-checks` (`scripts/redline-setup.sh:958`) stops the `(default …)` tail at the first `)`, so a var default that holds a parenthesis leaks into the doc.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/`.

## Decisions

### R1-1: fix — the docs regex's default tail runs to the line's last `)`

**Investigation.**

- `scripts/redline-setup.sh:958` (this PR) reads a var's doc with `^#   ([A-Z_][A-Z0-9_]*)=(?:<name>|[A-Za-z_][A-Za-z0-9_]*)\s+(.*?)(?:\s+\(default [^)]*\))?\s*$`. The tail is optional and its default is `[^)]*`, which cannot cross a `)`.
- On a line such as `#   REDLINE_DSN=<name>   scratch DSN (default tcp(db)/x)`, the tail fails at ` (default `, because `[^)]*` stops at `tcp(db` and the following `\)` is not followed by end of line. The optional tail is then skipped, and the lazy doc group grows to the end of the line. The doc becomes `scratch DSN (default tcp(db)/x)`.
- A default may hold a parenthesis. The checks.json validation at `scripts/redline-setup.sh:659-661` refuses only a multi-line default and `" $ ` \ }`. The header comment at `:85-86` says the same ("a var's default holds none of `" $ ` \ }`").
- The generator writes the line at `:780` as `"#   %s=<name>   %s (default %s)" % (env, doc, default)`. When the doc already holds the default, a regenerate from `input` prints `(default …)` twice.
- That breaks the round trip described at README line 227 ("`redline-setup.sh read-checks` reads a `checks.sh` back into this shape") and pinned by `tests/setup-test.sh:396-399` ("input recovers the whole checks.json", "regenerating from input reproduces the file"). Those cases pass today only because the Laravel fixture's default (`chalkboard_redline_migrate`) holds no parenthesis.
- Before this PR the pattern was `^#   ([A-Z_][A-Z0-9_]*)=([A-Za-z_][A-Za-z0-9_]*)\s+(.*?) \(default (.*)\)\s*$` (`git show main:scripts/redline-setup.sh`, line 941). Its default group is greedy, so it read these lines correctly. The PR therefore regresses headers generated before #18 as well.
- The VAR line reader (`:966`, `([^}]*)`) and the default it returns are unaffected. Only the doc is wrong.
- The guard refused `redline-setup.sh read-checks` to the shaper, so a scratch run of it was not possible; the reviewer's sample lines are at `/tmp/redlinerepro/reviewer-r1-vars.txt`. The regex semantics are direct enough to confirm from reading.

**Known?** `redline-gh.sh issues-search "read-checks default"` lists #18 (this PR's issue, which does not mention it) and nothing that covers it. The PR's only Redline comment is this round's review. This is round 1, so no earlier round's folder exists. The finding is new.

**Proportionality.**

- **Likelihood:** low. It needs a var whose default holds `)`. Chalkboard's only var (`chalkboard_redline_migrate`) does not, and this repository's `checks.json` declares no vars. It is reachable from a normal setup, though: a DSN or a `host(port)` style default passes validation.
- **Impact when it fires:** `/redline:setup`'s bootstrap and rerun take the doc with the default inside it. The regenerated header shows the default twice, and the rerun reports drift where the person changed nothing. Nothing breaks at run time, since the default itself reads back correctly.
- **Cost:**
  - One regex tail in `scripts/redline-setup.sh`, already in the PR's diff: `[^)]*` becomes `.*`, plus its two-line comment.
  - Two cases in `tests/setup-test.sh`, also in the diff.
  - No new dependency and no change to the generated `checks.sh`. Only the `read-checks` reader moves. This repository's `checks.sh` is untouched, so unattended point 11's defer rule for `checks.sh` text does not apply.
- **Verdict:** proportionate, `fix`.

**The change.** Make the tail greedy: `(?:\s+\(default .*\))?\s*$`. The doc group stays lazy, so it still stops at the first ` (default ` from which a `)` closes the line.

- On the reviewer's samples it gives `scratch database for the migrations check`, `port of the scratch server`, `scratch DSN` and `doc of a pre-#18 line`.
- A line with no default still gives its whole doc, as decision 4 of the original spec requires (the `(default …)` tail stays optional).
- Where a doc itself holds ` (default `, the doc is cut at the first one. That matches the pre-#18 pattern's lazy `(.*?) \(default`, so nothing that read correctly before regresses.

**Tests, red first.**

- A generated round trip: a Laravel `checks.json` whose default is `tcp(db)/x`, generated with `checks`, then `read-checks` gives back the doc and the default unchanged.
- A pre-#18 header (`ENV=identifier`) with a default holding a parenthesis, made with `sed` from the generated Laravel file, as `testing/tests` line 30 asks, still gives the doc.
- Neighbours that must not change are already in the table: a var line without its default (`tests/setup-test.sh:392`), the pre-#18 form (`:394`), and the whole-input round trip (`:396`).

Decided by: redline

### Standards retrospective

Proposed below, applied by the implementer once the standards approver approves it. If none is approved, the implementer records "Standards retrospective: no changes" here.

## Unattended answers

1. **Scope** (Step 1). The round's one finding, R1-1. Evidence: the invoking prompt's findings list. This repository's `checks.sh` stays out of scope: `.claude/redline/checks.json` declares no vars, and the PR description says it was regenerated byte-identical.
2. **Should the `(default …)` tail stay optional?** Yes. The original spec's decision 4 answers it: "with the `(default …)` tail optional (Chalkboard's hand-written line had it on the next line)" (`agent-os/specs/2026-11-02-0851-18-setup-header-and-read-checks/shape.md:18`). The PR description agrees: "with the `(default …)` tail optional, so a header generated before this change, one generated after it and Chalkboard's hand-written line … all yield the doc". The fix keeps it optional and changes only how far it reaches. Decided by: redline
3. **May a default hold a parenthesis?** Yes. The script's header says "a var's default holds none of `" $ ` \ }`" (`scripts/redline-setup.sh:85-86`), and the validation at `:660` refuses only those characters. The reader must therefore accept `(` and `)` in a default. Where the code disagrees, as `[^)]*` does, that disagreement is the finding to fix. Decided by: redline
4. **Visuals** (Step 2): none. A shell script's reader.
5. **References** (Step 3): the pre-PR pattern (`git show main:scripts/redline-setup.sh`, line 941), the generator's line (`:780`), the validation (`:655-661`), and the existing #18 cases in `tests/setup-test.sh:365-402`. See `references.md`.
6. **Product context** (Step 4): `agent-os/product/` does not exist in this repository. N/A.
7. **Standards** (Step 5): `scripts/bash-conventions` (the #18 reader rule, line 40), `testing/tests` (red before green, line 22; a case beside the neighbour that must not change, line 18; hand-written shapes as `sed` copies of the Laravel fixture, line 30), `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`. These are the same set the original spec carried, per its decision 9. See `standards.md`.
8. **Docs** (gate step 10): `scripts/redline-setup.sh` is the only file under a Docs directory that changes. Its README descriptions already say what the fix makes true, so there is no reader-facing change. Decided by: redline
   - README "`checks.sh`", line 227: "`redline-setup.sh read-checks` reads a `checks.sh` back into this shape".
   - README "`redline-setup.sh`", the `read-checks` row, line 332.
   - The script's header, `:63-67`: "a var's doc with or without its "(default ...)"".

## Context

- **Visuals:** None.
- **References:** `scripts/redline-setup.sh` (`:655-661`, `:780`, `:954-960`, `:1015`), `tests/setup-test.sh` (`:352`, `:365-402`, `:475-478`), `main:scripts/redline-setup.sh:941`, `/tmp/redlinerepro/reviewer-r1-vars.txt`.
- **Product alignment:** N/A.

## Standards Applied

- scripts/bash-conventions — the #18 reader rule (line 40) is what this regex implements; the header-as-documentation rule keeps the in-code comment accurate.
- testing/tests — red before green (line 22), a case plus its neighbour (line 18), `sed` copies of the Laravel fixture for hand-written shapes (line 30), tests write only under the temp directory (line 23).
- process/docs-gate — the Docs entry for `scripts/redline-setup.sh` in `plan.md` Task 2.
- process/standards-retrospective — the proposed edit below.
- prompts/attribution — commit messages and this folder carry no model or vendor name.

## Deferred

None.

## Standards retrospective (proposed)

1. `agent-os/standards/scripts/bash-conventions.md`, line 40 (the #18 reader rule). Append before the final `(#18)`, so the bullet ends: "… since the escaping belongs to the `run_check` line alone; a pattern that skips past a field the generator wrote accepts every character the field's validator lets through, so the reader's optional `(default …)` tail is `\(default .*\)` to the line's last `)`, never `[^)]*`, since a default may hold a parenthesis (#18; #62, R1-1)". The lesson: an optional, narrower tail fails silently, and the lazy group before it swallows the field.
2. `agent-os/standards/testing/tests.md`, line 30: no change. The new pre-#18 case is one more `sed` copy of the Laravel fixture, which the line already covers, and the generated round-trip case uses `jq` on the fixture JSON, as the validation cases at `tests/setup-test.sh:475-478` already do.
3. `process/docs-gate`, `process/standards-retrospective`, `prompts/attribution`: no changes.
