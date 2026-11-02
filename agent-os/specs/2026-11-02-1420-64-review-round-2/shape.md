# PR #64 Review Round 2 — Shaping Notes

Shaped by Redline in unattended mode.

## Scope

Redline round 2 on PR #64 (head `bugfix/15-unattended-section-version-marker-launch-warning-and-a-rerun-that-carries-template-body-changes`, issue #15). The reviewer read only the round 1 fix diff (`0775112..f67708c`) and reported one finding:

- **R2-1** (correctness, low, confirmed): in `merge3` (`scripts/redline-setup.sh:537`), the per-line split that R1-1 added pairs a same-length hunk's lines by position even when a base line inside the hunk is anchored at another offset on one side, so a pick writes a line twice or drops the template's change while the conflict shown claims something else.

Nothing else is in scope. The original spec for the PR is `agent-os/specs/2026-11-02-1346-15-unattended-section-version-marker-and-merge/`; round 1's is `agent-os/specs/2026-11-02-1420-64-review-round-1/`.

## Decisions

### R2-1: fix — split a same-length hunk line by line only when its lines line up

**Investigation.** `merge3` (`scripts/redline-setup.sh:512-552`) builds `bo` and `bt`, the base-to-ours and base-to-theirs line maps from `difflib`'s matching blocks (`:513-519`). A hunk runs from the first base line not anchored on both sides to the next line anchored on both (`:527-532`), so it is bracketed by lines anchored on both sides, and since the matching blocks are monotonic, any line of `co` or `ct` that is anchored maps to a base line inside `cb`. Since R1-1 (`24d5661`) the branch at `:537` is `elif len(cb) == len(co) == len(ct):` with no other condition, and the loop at `:540-547` pairs `cb`, `co` and `ct` by position. At `0775112` the same branch also required `all(x == y or x == z or y == z ...)` (`git show 0775112:scripts/redline-setup.sh`, line 535), so a hunk with any line changed on both sides went to the whole-hunk conflict at what is now `:548-550`.

The reviewer's trace, checked by hand against the code and `difflib`'s matching-block order (the longest block first, then each side recursively). Base `[H, L1, L2, L3]`; ours `[H, L2, X, L3]` (point 1 deleted, a line added after point 2); theirs `[H, L1, L2', L3]` (point 2 reworded). Base against ours matches `H` (0→0), `L2` (2→1) and `L3` (3→3); base against theirs matches `H, L1` (0→0, 1→1) and `L3` (3→3). At `b = 1`, `L1` is not in `bo` and `L2` is not in `bt`, so the hunk ends at `L3`: `cb = [L1, L2]`, `co = [L2, X]`, `ct = [L1, L2']`. Position 0 is `(L1, L2, L1)`: `z == x`, so the loop emits `L2` with no conflict. Position 1 is `(L2, X, L2')`, all three different, so conflict 1 is base `[L2]`, ours `[X]`, theirs `[L2']`. `rendered` (`:631-645`) extends the picked side, so `--pick 1=theirs` writes `[H, L2, L2', L3]`, point 2 twice, and `--pick 1=ours` writes `[H, L2, X, L3]`, which drops the rewording although the conflict told the person that the section replaced `L2` with `X`. The reviewer's reproduction, `/tmp/redlinerepro/reviewer-r2-merge3.py`, is a verbatim copy of `merge3` at `f67708c` with these inputs; I read it. The guard refuses `python3` and `tests/setup-test.sh` to the shaper, so neither was run.

The base line that shows the split is wrong is `L2`: anchored in ours at hunk offset 0 while it sits at base offset 1. In every same-length case the setup test has today, the anchored lines sit at their own offset: the adjacency case (`tests/setup-test.sh:628-632`: base `[L1, L2]`, `L1` in ours at 0, `L2` in theirs at 1), R1-1's conflict-beside-a-hand-edit case (`:635-640`: `L2` in theirs at 1) and its mirror (`:642-648`: `L2` in ours at 1). The one-line conflict case (`:605-624`) is a one-line hunk; the v1 merge (`:568-590`) has its hand edit and the template's changes in different hunks; the dogfood merge over this checkout's section (`:593-602`) is guessed at the current version, so `ct == cb` in every hunk and the branch is never reached.

**Proportionality.** Likelihood: low. It needs a hunk of the same length on all three sides in which the section both deletes a line and adds one next to a line the template changed. Not observed: the dry runs over Chalkboard's, Losers League's and Vestmark's sections reported no conflicts (PR description), and today's template has no newer body to merge. But it is a normal `/redline:setup` rerun after any future body change over a hand-edited section, and R1-1 made it reachable where it was not before. Impact when it fires: the person answers one conflict in setup's step 10 (`skills/setup/SKILL.md`, "On a conflict, ask per number") on a misleading view, and the written section carries point 2 twice or loses the template's rewording without a word; the next launch reads the marker as current, so nothing warns again. Cost: one condition on the branch at `:537` and the comments above it, above `merge3` (`:508-511`) and in the header (`:50-51`) of `scripts/redline-setup.sh`; seven cases in `tests/setup-test.sh`; one phrase in `README.md`'s `redline-setup.sh` table row. All three files are already in the PR's diff. No new dependency, abstraction, JSON key, flag or exit code. Proportionate: `fix`.

**The change.** The same-length branch gains the alignment condition the reviewer proposes: for every offset `k` in the hunk, a base line `b + k` that is anchored on a side maps to offset `k` there (`bo.get(b + k, o + k) == o + k`, and the same for `bt` with `t`). A same-length hunk that fails it falls to the existing `else`, one whole-hunk conflict, as hunks of different lengths do. Checking the base side alone is enough, since every anchored line of `co` and `ct` maps back into `cb`. Every aligned case keeps today's result, so R1-1's per-line conflicts and the adjacency merge are unchanged; the reviewer's input gets one conflict over both lines, and either pick writes each line once.

A same-length hunk none of whose base lines is anchored on either side is still paired by position: nothing in the hunk can say its lines do not correspond, and that pairing is the documented behaviour ("a same-length hunk merged line by line", `README.md:334`). It is not part of this finding; it is recorded here only so the next reader knows the condition does not cover it.

Decided by: redline

## Unattended answers

1. **Is a same-length hunk whose lines do not line up meant to be split line by line? (R2-1)** No; the evidence says the split is for lines that correspond. The original spec, `shape.md` decision 14: "a hunk of one length on every side whose lines each changed on at most one side is merged line by line, and a line changed differently on both sides still conflicts", which pairs each base line with that same line on each side. The comment R1-1 put above `merge3` (`scripts/redline-setup.sh:510-511`): "each line changed differently on both is a conflict alone, so a pick settles that line and never the lines beside it". `README.md:36`, Upgrading: "asking per conflicting line". A pick that writes point 2 twice settles more than its line, so the code disagrees with its own comment, and the fix is in the code, with the comments and the README row saying which hunks are split.
   Decided by: redline
2. **Known already?** `scripts/redline-gh.sh issues-search "merge3"` printed nothing; `"same-length hunk"` and `"unattended merge"` list only #15 (this PR's issue) and #16 (release process), and neither mentions anchors or the per-line split. `scripts/redline-gh.sh pr-comments 64` shows R2-1 only in this round's review. Round 1's spec (`agent-os/specs/2026-11-02-1420-64-review-round-1/shape.md`) introduced the split and does not discuss shifted anchors. The finding is new: a regression of R1-1's fix.
   Decided by: redline
3. **Scope, visuals, references, product context.** The scope is the one finding. No visuals. The references are in `references.md`. Product context: `agent-os/product/roadmap.md`, Phase 1 item 1: "each repository keeps its own contract", the unattended section in `shape-spec` among it; a merge that writes a line twice or drops the template's change damages that section.
   Decided by: redline
4. **Which standards apply?** From `agent-os/standards/index.yml`: `scripts/bash-conventions` (Python inside a script; bash 3.2 with BSD tools; the three-way merge bullet at line 38), `testing/tests` (red before green, a case beside the neighbouring decision, fixture copies with `sed`/`awk ... > <copy>`, a merge case pins a conflict's extent, derived versions), `process/docs-gate`, `process/standards-retrospective` and `prompts/attribution`. `scripts/guard` does not apply: no guard change and no new command shape.
   Decided by: redline

## Context

- **Visuals:** None
- **References:** `scripts/redline-setup.sh` (`merge3`, `rendered`, the `unattended` header), `tests/setup-test.sh` (the fixtures and the merge cases), `README.md` (Upgrading, the `redline-setup.sh` table), `skills/setup/SKILL.md` step 10, the original spec, round 1's spec and the reviewer's reproduction. See `references.md`.
- **Product alignment:** `agent-os/product/roadmap.md`, Phase 1 item 1.
- **Not run.** The guard refuses `python3`, `tests/setup-test.sh` and `redline-setup.sh unattended` to the shaper, so the trace and the red and green counts in `plan.md` are worked out from the code. The starting count, `setup` 450 passed, is round 1's As built.

## Standards Applied

- scripts/bash-conventions — the change stays inside the single-quoted `PY_UNATTENDED` string (`scripts/redline-setup.sh:369`), so its code and comments hold no single quote (the string spells one as `\x27`); the test block uses only bash 3.2 and BSD-safe `sed` and `awk`; line 38 is the merge rule this round sharpens
- testing/tests — red before green (line 22); a merge case pins a conflict's extent (line 23); fixture copies with `sed ... > <copy>` or `awk ... > <copy>` (line 24); the fixture's versions derived from `UV` and `UN` (line 29)
- process/docs-gate — each touched plugin file names its README section
- process/standards-retrospective — the proposed list below
- prompts/attribution — no model or vendor name in commits or spec files

## Standards retrospective (proposed)

1. **R2-1, missing detail** in `agent-os/standards/scripts/bash-conventions.md`, line 38. After "that line alone is the conflict, so a pick never settles the lines beside it (#64, R1-1)" insert: "; a hunk is split line by line only when its lines line up, every base line anchored on a side sitting at its own offset there, so a deletion and an addition inside one hunk stay one conflict and a pick never writes a line twice or drops one (#64, R2-1)".
2. **R2-1, missing detail** in `agent-os/standards/testing/tests.md`, line 23 (the conflict-extent bullet). After "proves a pick settles that line alone (#64, R1-1)" append: "; and a case with a deletion and an addition in the same hunk, beside a template change, proves a hunk whose lines do not line up stays one conflict, so a pick writes each line once (#64, R2-1)".
