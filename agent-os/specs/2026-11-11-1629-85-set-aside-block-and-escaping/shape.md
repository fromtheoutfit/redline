# #85 follow-up on PR #86: the set-aside block and its escaping — Shaping Notes

## Scope

This spec is a follow-up on PR #86 (issue #85), on the same branch. It acts on three For the person notes from Redline's rounds 1 and 2 on #86, read in the round 1 and round 2 review bodies and the Redline handoff comment:

- **Round 1, coverage candidate 2** (`workflows/redline-loop.js:2102`): a `duplicate` of a dropped index is dropped in effect, but the block filters on each entry's own outcome, so it is not listed.
- **Round 1, coverage candidate 3** (`workflows/redline-loop.js:511`): a candidate accounted for directly as `known` reaches the person only as "N already tracked"; the issue it was matched to appears nowhere.
- **Round 2, coverage candidate 5** (`workflows/redline-loop.js:889`): the dropped line puts the summary and the ref inside the `<details>` block unescaped, so a bare `</details>` ends the collapse early and a bare `<details>` folds what follows.

What is built:

- The block lists every candidate that is neither a finding nor a For the person entry, by one rule. It is renamed the set-aside block.
- A duplicate of another candidate shows that candidate's place and outcome.
- `&` and `<` are escaped outside code spans.
- The verify prompt and the agent file say what the body lists.
- The docs follow.

Out of scope: the other seven For the person notes on #86 (round 1's candidates 9 and 11; round 2's candidates 2, 6, 7, 8 and 10).

## Decisions

From the brief (2026-11-11, @michaelfromtheoutfit; not reopened):

1. **One rule.** The block lists every candidate that is neither a finding nor a For the person entry, by one rule and not by a list of outcomes. That adds `known`, `settled` and `duplicate` to `refuted`, `outside` and `disproportionate`. This supersedes decision 5 of the #85 spec, which named three outcomes.
2. **Each line keeps its shape**: the backticked place, the candidate's own summary, then the outcome and its ref.
   - A `known` line names the issue or comment.
   - A `duplicate` line names what it collapsed into. When that is another candidate's index, the line also gives that candidate's outcome, so a duplicate of a dropped or tracked candidate cannot hide.
   - The line still never opens with a finding id.
3. **Wording.** The block's summary label and the handoff's change to fit the wider rule (wording asked, answer 12). The coverage count sentence in the review body stays as it is.
4. **Escaping.** Inside the block, `&` and then `<` are escaped in the candidate's summary and in the verifier's ref when the line is rendered. "Unedited" means the person reads the finder's words as written, so the loop test pins the rendered text and no longer the raw bytes. A check with a summary holding `</details>`, `<details>` and a Vue tag such as `<Head title="x" />` proves the block stays one collapsed block and the text survives.
5. **The escaping applies to the block only**, in the review body and the handoff. For the person lines and finding lines are unchanged. That they share the problem is known and out of scope (below).
6. **Scope is these two changes.**
   - The other seven For the person notes on #86 are out.
   - No schema change: the #85 spec's decision 11 stands, so there is no `tracks` field.
   - No prompt change unless the wider block needs one; in that case, stop and ask (asked, answer 11).
   - `coverage off` prompts stay byte-identical.
7. **Version and guard.** The version stays 0.2.2. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
8. **Docs and standards.** `docs/running.md`, the README's "What a clean run means" and the `workflow/agents.md` bullet from #85 are brought in line with the wider block. The standards edit goes in the retrospective's own commit.
9. **The PR description.** The replacement text for its "What lands" bullet on the block and its "Deviations" list is drafted in `plan.md` for the person to paste. The PR is not edited.

Asked at shaping (2026-11-11, one at a time), answered by @michaelfromtheoutfit:

10. **Escape outside code spans only.**
    - A span opens and closes on backtick runs of equal length, as GitHub reads them. An unclosed backtick is plain text, so what follows it is escaped.
    - Inside a span the text is left as written: GitHub already shows it literally, and an entity there would show literally too.
    - The loop test covers four cases: a tag inside a span, a bare tag outside one, a double-backtick span, and an unclosed backtick.
    - This refines decision 4's mechanism. Its aim, that the person reads the finder's words as written, held only outside code spans (see Evidence).
11. **The accounting sentence is widened in both places**: the verify prompt (`candidatesBlock`) and the agent file ("Account for every candidate").
    - New wording: "The review body lists every candidate that is neither a finding nor a forThePerson entry after For the person, one line each beside the candidate's own summary, so write each of those refs for the teammate who may overrule it." The agent file puts the outcome names in backticks.
    - A key-phrase check pins `every candidate that is neither a finding nor` in the agent file and in a covered prompt, and its absence from a `coverage off` one.
    - Only covered rounds see the change, since `candidatesBlock` is the branch with candidates.
12. **The code names and the warning are renamed too.** "Dropped" now means only three of the six outcomes, and #86 is not merged yet. "Dropped" stays where it still means exactly `refuted`, `outside` or `disproportionate`, as in the count sentence. The label was offered twice and no option was picked. The plan therefore carries the recommended wording, open to a swap at approval, and the approval kept it:
    - Body: `<summary>Candidates set aside (N): collapsed, already tracked or dropped</summary>`.
    - Handoff: `<summary>Candidates set aside in round <n> (N): collapsed, already tracked or dropped</summary>`.
    - The label echoes the count sentence's three groups, so collapsed + already tracked + dropped = N.
    - Names: `droppedBlock` becomes `setAsideBlock`, and `droppedCandidates` becomes `setAsideCandidates`. `DROPPED_OUTCOMES` is replaced by the rule. The docs term is "the set-aside block". The warning reads "the reviewer set aside coverage candidate N as <outcome> with no reason".

Shaping defaults (recorded, not asked; shown in the plan and approved with it):

- **The rule in code.** `LISTED_ELSEWHERE = ['finding', 'forThePerson']`; the block takes every accounting entry whose outcome is not in it. An outcome the schema adds later lands in the block without an edit.
- **A `known` entry made from a finding with `knownAs`.** `accountCoverage` gives it the ref `R1-2: #7`, and it is listed in the block since its outcome is `known`. The person sees the candidate's own summary beside the issue, as well as the finding under Already tracked.
- **A duplicate's target.**
  - A duplicate ref is read as an index when, trimmed, it is `3`, `candidate 3` or `index 3` (any case), and names another candidate of the round.
  - The line then appends the target's place and outcome: ``duplicate: 3 (candidate 3, `app/z.php:5`: refuted)``. Block lines carry no index, so a bare "3" would mean nothing to the reader.
  - One hop only: a target that is itself a duplicate shows `duplicate`, and its own line is in the block.
  - Any other ref (a finding id, or an index out of range or naming the candidate itself) is shown as written, with no addition and no warning.
- **The escaping reads the line's whole text**: summary, outcome, ref and the duplicate's addition together. GitHub pairs a backtick left open in the summary with one in the ref, so escaping the fields one by one could leave a tag in the ref bare.
- **Two fallbacks escape the whole text.** One is a text that holds a newline: a line break can end the paragraph GitHub pairs backticks in. The other is a backslash before a backtick: GitHub reads that backtick as plain text. In both, GitHub's pairing turns on more than run lengths, so the line falls back to decision 4 as first written. That is safe, and costs only `&lt;` inside such a line's spans.
- **Unchanged:**
  - the empty-ref placeholder (`no reason given`, now for every outcome in the block);
  - the place (`personLine`'s backticked `file:line`, not escaped);
  - the count sentence;
  - the findings file;
  - `result()`, which keeps counts only (#80, R1-5);
  - the handoff's choice of round (#85, decision 14);
  - `record.dropped` (the person's pick) and `droppedNits`, which are other things.
- **Known and out of scope (decision 5).**
  - For the person lines, finding lines and the Already tracked list put the same text into the review body unescaped, so a bare tag there can break the body the same way.
  - A newline in a summary can still end a list line, and a line that opens a fence can swallow the block's close. That is round 1's dropped candidate on #86, ruled disproportionate there.
  - A file path holding a backtick would break the place's own span.

## Evidence

A probe block sent through GitHub's markdown API before shaping (`gh api markdown -f mode=gfm`, invented text only):

- A bare `</details>` inside a list line ended the `<details>` element there; the lines after it rendered outside the block.
- Outside a code span, `&lt;/details&gt;` rendered as `</details>` and `Tom &amp; Jerry` as `Tom & Jerry`.
- Inside a code span, `` `&lt;Head title="x" />` `` rendered as `&lt;Head title="x" />` and `` `a &amp;&amp; b` `` as `a &amp;&amp; b`: an entity is literal text in a code span, as the CommonMark spec says.
- Inside a code span, an unescaped `` `</details>` ``, `` `<Head title="x" />` `` and `` `a && b` `` rendered as text, and the block stayed whole.

## Deviations from the #85 spec

- **Decision 5** (the block lists `refuted`, `disproportionate` and `outside`) is superseded by decision 1 here.
- **Decision 11's "unedited and whole".** It now means the person reads the summary as written once rendered (decisions 4 and 10). The raw bytes in the body differ outside code spans.
- **"The dropped block"** is renamed "the set-aside block" in the code, the docs and the standards (answer 12).

## Context

- **Visuals:** None.
- **References:**
  - the #85 spec folder;
  - the round 1 and round 2 review bodies and the handoff comment on #86;
  - in `workflows/redline-loop.js`: `reviewBody`, `personLine`, `droppedBlock`, `candidatesBlock`, `accountCoverage`, the review normalizer, `handoffComment` and the round record;
  - `agents/redline-reviewer.md`, "Account for every candidate";
  - `tests/loop-test.mjs` section 15.

  See `references.md`.
- **Product alignment:** `agent-os/product/mission.md`. "Honest about its reach": every candidate the round neither raised nor listed is shown, with its ref. "Decisions stay with people": a collapse or a match to an issue can be overruled from the review as a drop can. No conflict, no mission edit.

## Standards Applied

- `workflow/agents`: the #85 bullet this widens. A rule a prompt states is changed everywhere the prompt and the agent file state it (#80, R3-3).
- `workflow/replay`: a `coverage off` prompt stays byte-identical. The record carries what the handoff needs.
- `testing/tests`: red before green. A tested surface gains a case, and the agent file's key phrases are pinned.
- `process/docs-gate`: a Docs entry per touched plugin file, and every statement of the block reworded.
- `process/release`: the version is kept on purpose (decision 7). #86 already carries the patch bump.
- `process/standards-retrospective`: gate step 12.
- `prompts/attribution`: no model or vendor name anywhere.

## Standards retrospective

Listed mechanically (gate step 12) from the Decisions above, the As built notes in `plan.md` and the checks that went red. Presented one at a time on 2026-11-11, approved by @michaelfromtheoutfit, and applied as their own commit:

1. `workflow/agents.md`, the #85 bullet. Its sentences on the block ("Every `refuted`, `outside` and `disproportionate` candidate is listed …") contradicted decisions 1, 2 and 12, and are replaced. The new text covers:
   - the set-aside block by one rule (`LISTED_ELSEWHERE`), its label, and "dropped" meaning the three outcomes only;
   - the line, with the `known` issue and the duplicate's target;
   - the escaping outside code spans, why spans are left as written, and the two fallbacks;
   - the known gap in For the person and finding lines;
   - the handoff's block.

   Applied as drafted.
2. `testing/tests.md`, a new bullet after the key-phrase bullet. Text the workflow escapes for GitHub is pinned as the escaped string the workflow writes, with one case per way the reading can go wrong. A claim about what GitHub shows is checked once through `gh api markdown -f mode=gfm` on invented text. This was missing. Applied with @michaelfromtheoutfit's wording change: "the escaped string the workflow writes" in place of "the rendered string", since the loop test cannot render.

Already covered, so no edit:

- The accounting sentence changed in the prompt and the agent file together, its key phrase pinned in both and absent under `coverage off`: `workflow/agents.md` (#80, R3-3), `testing/tests.md` (the key-phrase bullet), `workflow/replay.md`.
- The version kept on purpose: `process/release.md`.
- A Docs entry per touched file, every statement of the block reworded: `process/docs-gate.md`.

No check went red outside the planned red run, and no pattern was invented outside `agent-os/standards/`.
