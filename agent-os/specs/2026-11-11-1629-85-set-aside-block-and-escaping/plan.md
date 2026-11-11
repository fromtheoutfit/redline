# #85 follow-up on PR #86: the set-aside block lists every candidate that is neither a finding nor For the person, escaped outside code spans

Spec folder: `agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/`

## Context

PR #86 (issue #85) added the dropped block: a collapsed `<details>` after For the person, with one line per `refuted`, `outside` and `disproportionate` candidate. Redline's rounds 1 and 2 on #86 raised three For the person notes that this spec acts on:

- **Round 1, coverage candidate 2** (`workflows/redline-loop.js:2102`). A `duplicate` whose ref is a dropped candidate's index is dropped in effect, but it is not listed, and the count sentence calls it collapsed.
- **Round 1, coverage candidate 3** (`workflows/redline-loop.js:511`). A candidate accounted for directly as `known` reaches the person only as "N already tracked". The issue it was matched to appears nowhere, which is fault 1's path if a verifier still treats a partly tracked candidate as tracked whole.
- **Round 2, coverage candidate 5** (`workflows/redline-loop.js:889`). The summary and the ref enter the block unescaped. A bare `</details>` ends the collapse early, and a bare `<details>` folds everything after it.

The outcome: the block lists every candidate the round neither raised nor put under For the person, each with its outcome and ref. A `known` line names the issue, and a duplicate points at where it went. No text in a summary or ref can break the block.

This was checked against GitHub's markdown API before shaping (`POST /markdown`, `gfm`, a probe block):

- A bare `</details>` in a list line closes the block.
- `&lt;/details>` in plain text shows as `</details>`.
- Inside a backtick code span an entity shows literally: `` `&lt;Head title="x" />` `` reads `&lt;Head …`, and `` `a &amp;&amp; b` `` reads `a &amp;&amp; b`.
- Unescaped, `` `</details>` `` and `` `<Head title="x" />` `` inside a code span showed as text, and the block stayed whole.

## Decisions

From the brief (2026-11-11, @michaelfromtheoutfit; not reopened):

1. **One rule.** The block lists every candidate that is neither a finding nor a For the person entry, by one rule and not by a list of outcomes. That adds `known`, `settled` and `duplicate` to `refuted`, `outside` and `disproportionate`. This supersedes decision 5 of the #85 spec.
2. **Each line keeps its shape.** It has the backticked place, the candidate's own summary, then the outcome and its ref.
   - A `known` line names the issue or comment.
   - A `duplicate` line names what it collapsed into. When that is another candidate's index, the line also gives that candidate's outcome.
   - A line never opens with a finding id.
3. **Wording.** The summary label and the handoff's change to fit the wider rule. The coverage count sentence stays as it is.
4. **Escaping.** Inside the block, `&` and then `<` are escaped in the summary and the ref when the line is rendered. "Unedited" means the person reads the finder's words as written. The loop test pins the rendered text, not the raw bytes, and adds a check with `</details>`, `<details>` and a Vue tag.
5. **The block only.** The escaping applies to the block only, in the review body and the handoff. For the person lines and finding lines are unchanged. That they share the problem is recorded here as known and out of scope.
6. **Scope.**
   - These two changes only. The other seven For the person notes on #86 are out.
   - No schema change: #85's decision 11 stands, so there is no `tracks` field.
   - A prompt change only where the wider block needs one (asked, answer 11).
   - `coverage off` prompts stay byte-identical.
7. **Version and guard.** The version stays 0.2.2. `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
8. **Docs and standards.** `docs/running.md`, the README's "What a clean run means" and the `workflow/agents.md` bullet from #85 are brought in line. The standards edit goes in the retrospective's own commit.
9. **The PR description.** Its "What lands" bullet on the block and its "Deviations" list are drafted below for the person to paste. The PR is not edited.

Asked at shaping (2026-11-11, one at a time), answered by @michaelfromtheoutfit:

10. **Escape outside code spans only.** Spans are read as GitHub reads them: a run of n backticks opens a span that the next run of exactly n closes. A backtick with no closer is plain text, so what follows it is escaped. Inside a span the text is left as written, since GitHub already shows it literally there, and an entity there would show literally too. The loop test covers four cases: a tag inside a span, a bare tag outside one, a double-backtick span, and an unclosed backtick.
11. **The accounting sentence is widened in both places**: the verify prompt (`candidatesBlock`) and the agent file ("Account for every candidate"). The new wording is "The review body lists every candidate that is neither a finding nor a forThePerson entry after For the person, one line each beside the candidate's own summary, so write each of those refs for the teammate who may overrule it". The agent file puts the outcome names in backticks. A key-phrase check pins `every candidate that is neither a finding nor` in the agent file and the covered prompt, and its absence in `coverage off`.
12. **Rename the code names and the warning.** "Dropped" now covers only three of the six outcomes, and #86 is not merged. "Dropped" stays wherever it means exactly `refuted`, `outside` or `disproportionate`, as in the count sentence.
    - **Label (yours to swap at approval):** "Candidates set aside". This was the recommended wording, and no other label was picked at shaping.
    - Body: `<summary>Candidates set aside (N): collapsed, already tracked or dropped</summary>`.
    - Handoff: `<summary>Candidates set aside in round <n> (N): …</summary>`.
    - The label echoes the count sentence's three groups, so collapsed + already tracked + dropped = N.
    - Names: `droppedBlock` → `setAsideBlock`, `droppedCandidates` → `setAsideCandidates`, `DROPPED_OUTCOMES` removed (see the rule below). The docs term becomes "the set-aside block".

Shaping defaults (recorded, not asked; strike any at approval):

- **The rule in code.** `const LISTED_ELSEWHERE = ['finding', 'forThePerson']`, and the block takes every accounting entry whose outcome is not in it. An outcome the schema adds later lands in the block without an edit.
- **A `known` entry the workflow made from a finding with `knownAs`** (`accountCoverage`, ref `R1-2: #7`) is listed too, since its outcome is `known`. The person sees the candidate's own summary beside the issue as well as the finding under Already tracked.
- **A duplicate's target.**
  - A duplicate ref is read as an index when, trimmed, it is `3`, `candidate 3` or `index 3` (any case), and names another candidate of the round.
  - The line then appends the target's place and outcome. Block lines carry no index, so a bare "3" would mean nothing to the reader: ``duplicate: 3 (candidate 3, `app/z.php:5`: refuted)``.
  - One hop only. A target that is itself a duplicate shows `duplicate`, and its own line is in the block.
  - Any other ref (a finding id, or an index that is out of range or names the candidate itself) is shown as written, with no addition and no warning.
- **The escaping reads the line's whole text**: summary, outcome, ref and the duplicate's addition together. A backtick left open in the summary pairs with one in the ref on GitHub, so escaping the fields one by one could leave a tag in the ref bare.
- **Two fallbacks escape the whole text.** One is a text that holds a newline (a line break can end the paragraph GitHub pairs backticks in). The other is a backslash before a backtick (GitHub reads that backtick as plain text). In both cases GitHub's pairing turns on more than run lengths, so the line falls back to decision 4 as first written. It is safe, and costs only `&lt;` inside such a line's spans.
- **Unchanged:**
  - the empty-ref placeholder (`no reason given`, for every outcome in the block);
  - the place (`personLine`'s backticked `file:line`, not escaped);
  - the count sentence;
  - the findings file and `result()` (counts only, #80 R1-5);
  - the handoff's choice of round (#85, decision 14).
- **Known and out of scope.**
  - For the person lines, finding lines and the Already tracked list put the same text into the body unescaped (decision 5).
  - A newline in a summary can still end a list line, and a line that opens a fence can swallow the block's close. That was round 1's dropped candidate, ruled disproportionate.
  - A file path holding a backtick would break the place's own span.
- No visuals. Product alignment: the mission's "Honest about its reach" (every candidate the round neither raised nor listed is shown, with its ref) and "Decisions stay with people". No conflict and no mission edit.
- Standards applied: `workflow/agents`, `workflow/replay`, `testing/tests`, `process/docs-gate`, `process/release`, `process/standards-retrospective`, `prompts/attribution`.

## Task 1: Save spec documentation

Create the spec folder with:

- `plan.md`: this plan.
- `shape.md`: Scope, the Decisions above (brief, shaping answers, defaults), the GitHub probe as evidence, Context, Standards Applied, and the out-of-scope notes. Add a "Deviations from the #85 spec" section:
  - decision 5 is superseded by decision 1;
  - decision 11's "unedited" now means the rendered text (decision 4);
  - "the dropped block" is renamed "the set-aside block".
- `standards.md`: the full text of the seven standards above, as they read at shaping.
- `references.md`:
  - the #85 spec folder;
  - the three For the person notes, cited by review (round 1 and round 2 review bodies on #86) and by the handoff comment;
  - the CommonMark code-span rule;
  - the code and tests below.

## Task 2: Loop-test checks first (red)

`tests/loop-test.mjs`, section 15. Run `node tests/loop-test.mjs` and see the new and changed checks fail before Tasks 3 and 4.

- **The prompt sentence.** Add `['the review body lists every candidate that is neither a finding nor a For the person entry', 'every candidate that is neither a finding nor']` to the rule loop at line 1471.
- **The wider rule.** Extend the `the dropped block` scenario (lines 1498–1522) and rename it `the set-aside block`. Its candidate list gains:
  - a `known` (`#7`);
  - a `duplicate` of `R1-1`;
  - a `duplicate` of `3` (the refuted one);
  - a `duplicate` of `candidate 2` (the For the person one).

  Pin the whole block byte for byte:
  - index order;
  - the summary line `Candidates set aside (7): collapsed, already tracked or dropped`;
  - ``known: #7``;
  - ``duplicate: R1-1``;
  - ``duplicate: 3 (candidate 3, `app/z.php:5`: refuted)``;
  - ``duplicate: candidate 2 (candidate 2, `app/y.php:9`: forThePerson)``.

  Also pin that the count sentence's collapsed, already tracked and dropped figures add up to the label's count. The handoff's `lastBlock` (round 2, `settledAll`) now reads `Candidates set aside in round 2 (2)` with the `settled: R1-1` line first. Update the result check (line 1528): `candidates === 9`, and no `setAsideCandidates` field.
- **A known finding from a candidate** (line 1403 scenario). The block lists ``- `app/x.php:3` · the real one · known: R1-1: #7``.
- **Partly tracked** (line 1492). The old "no block" check is replaced. Round 1's body and the handoff (round 2) list ``- `app/x.php:8` · the lookup ignores case · known: #7``, which names the issue (decision 2).
- **No block.**
  - `every`'s round 1 (finding and forThePerson only) has no `<details>`.
  - The no-reason scenario (line 1538): round 2 becomes forThePerson-only, so check 1543 still proves "the last covered round's block, not the last round with one".
  - The final-nit-pass check (line 1534) now expects round 2's two lines (`settled`, `refuted`).
- **Escaping**, a new scenario. Its set-aside candidates hold:
  - bare `</details>` and `<details>`: escaped to `&lt;/details>` and `&lt;details>`;
  - `` `<Head title="x" />` `` in a span: as written;
  - a double-backtick span holding a single backtick and `<c>`: as written;
  - an unclosed backtick followed by `<i>`: escaped;
  - `Tom & Jerry`, and a ref holding `&lt;`: escaped to `&amp;` and `&amp;lt;`;
  - a summary whose unclosed backtick pairs with the ref's first backtick, so the ref's `<c>` after it is escaped;
  - a newline, and a backslash before a backtick: escaped whole.

  Assertions:
  - each rendered line is pinned byte for byte;
  - the body and the handoff each hold exactly one raw `<details>` and one raw `</details>`, the block's own;
  - `<summary>` is intact;
  - the same lines appear in the handoff;
  - a For the person entry holding `<b> & c` in the same round stays raw, so the escaping is the block's alone (decision 5).
- **Empty ref.** The warning reads `round 1: the reviewer set aside coverage candidate 2 as refuted with no reason; listed as "no reason given"`.
- Rename the check names and comments in section 15 that say "dropped block" or "dropped candidate" for the block. Keep "dropped" where it means the three outcomes.
- Unchanged and green: every `coverage off` check (`offRules`, line 1546), the count-sentence checks (lines 1308–1309), and every pre-coverage scenario.

## Task 3: The accounting sentence (agent file and verify prompt)

- `workflows/redline-loop.js`, `candidatesBlock`, the accounting sentence (line 1208). Replace "The review body lists every refuted, outside and disproportionate candidate after For the person, one line each beside the candidate's own summary, so write each of those refs for the teammate who may overrule the drop." with answer 11's wording. Update the comment above the function (lines 1187–1188, "posted in the review body's dropped block"). Only the branch with candidates changes, so `coverage off` prompts are byte-identical.
- `agents/redline-reviewer.md`, "Account for every candidate" (line 50): the same sentence, with `finding` and `forThePerson` in backticks. Search for the old wording (`refuted`, `outside` and `disproportionate` candidate after For the person; `overrule the drop`), as `workflow/agents.md` requires (#80, R3-3).
- Docs entry: the docs commit. `docs/running.md` "The coverage pass" restates what the body lists; no template.

## Task 4: The set-aside block (workflow)

`workflows/redline-loop.js`:

- **Lines 508–511.** Replace `DROPPED_OUTCOMES` and its comment with `LISTED_ELSEWHERE = ['finding', 'forThePerson']`. The comment says the block holds every other outcome, by one rule (#86).
- **The normalizer** (lines 2103–2120): `out.setAsideCandidates`.
  - It holds the accounting entries whose outcome is not in `LISTED_ELSEWHERE`: `{ index, file, line, summary, outcome, ref, into }`.
  - `into` is `{ index, file, line, outcome }` for a duplicate whose ref reads as another candidate's index (the default above), else `null`.
  - An empty ref pushes the renamed warning. Without a pass, the list is `[]`.
- **New `blockText(text)`** beside `personLine`, about 15 lines:
  - escape `&` then `<` outside code spans;
  - find spans from the backtick runs (`/`+/g`): a run opens a span that the first later run of the same length closes, and a run with no closer is plain text;
  - a text matching `/\n|\\`/` is escaped whole.
- **`droppedBlock` → `setAsideBlock(entries, round)`.**
  - The new label, with ` in round <n>` only when `round` is given.
  - Each line is `personLine({ file, line, text: blockText(\`${summary} · ${outcome}: ${ref || 'no reason given'}${into ? \` (candidate ${into.index}, \\\`${into.file}:${into.line}\\\`: ${into.outcome})\` : ''}\`) })`.
  - `personLine` itself is unchanged, so For the person lines are too.
  - Rewrite the comment (lines 876–882): the one rule, the duplicate's target, the escaping and why code spans are left alone. It keeps "#86, R1-3".
- **`reviewBody`** (lines 859–862), **`handoffComment`** (lines 2877–2883) and **the round record** (line 3352). The renamed field and function; the comments say "set-aside block". `record.dropped` (the person's pick) and `droppedNits` are a different thing and stay.
- Docs entry: the docs commit. `docs/running.md` "Rounds" step 1, "The coverage pass" and "The handoff comment", and README "Known limits" ("What a clean run means"); no template.

## Task 5: Docs

- **`docs/running.md`.**
  - **"Rounds" step 1** (line 36): "a collapsed block listing every candidate the verifier dropped, with its reason" becomes "a collapsed block listing every candidate it set aside (collapsed, already tracked or dropped), with its outcome and ref".
  - **"The coverage pass"** (line 48): the block sentence widens to the one rule. The new text says:
    - each line is the place, the summary as the finder wrote it, the outcome and the verifier's ref;
    - a `known` line names the issue or comment;
    - a `duplicate` line names what it collapsed into, and for another candidate, that candidate's place and outcome;
    - inside the block, `&` and `<` outside code spans are escaped, so no tag in a summary or ref can end the block or open another, while the text reads as written;
    - a round that set nothing aside has no block (`no reason given` as before).
  - **"The handoff comment"** (line 83): "the dropped block … since earlier rounds' drops stay in their own review bodies" becomes the set-aside block, and earlier rounds' blocks stay in their own bodies.
- **`README.md` "What a clean run means"** (line 100). The #85 sentence becomes "Every candidate the last covered round's verifier set aside (collapsed, already tracked, refuted, outside the diff or disproportionate) is listed in the handoff, collapsed, with its outcome and ref, so you can overrule one (#85)".
- No `docs/contract.md` entry, since no per-repository file changes. No mission edit.

## Task 6: Verification Gate

- **Steps 1–9:** run `.claude/redline/checks.sh --baseline` until every check passes. Its JSON is the evidence, and failing output is reported verbatim.
- **Step 10, Docs:** each entry in the table below names its commit or its reason.
- **Step 11, Version:** 0.2.2 in both files, kept on purpose (decision 7). #86 already carries the patch bump.
- **Step 12, Standards retrospective:** list, classify and present with AskUserQuestion. Approved edits land in their own commit. Expected items:
  - `workflow/agents.md`, the #85 bullet (line 37), on the set-aside block:
    - every candidate that is neither a finding nor For the person, by one rule;
    - the label;
    - a `known` line names the issue;
    - a duplicate of another candidate shows that candidate's place and outcome;
    - `&` then `<` escaped outside code spans only, with the GitHub fact that an entity inside a span shows literally.
  - `testing/tests.md`, possibly: a block rendered for GitHub is pinned as rendered text, with one case per way the escaping can go wrong.
- **Step 13:** `plan.md` As built and `shape.md` Decisions record any deviation.

## Docs entries (gate step 10)

| File | Section | Commit or reason |
| --- | --- | --- |
| `workflows/redline-loop.js` (the set-aside block: the rule, the label, the duplicate's target, the escaping, the renames) | `docs/running.md` "Rounds" step 1, "The coverage pass", "The handoff comment"; README "Known limits" ("What a clean run means"); no template | the docs commit (3) |
| `workflows/redline-loop.js` (the verify prompt's accounting sentence), `agents/redline-reviewer.md` | `docs/running.md` "The coverage pass"; no template | the docs commit (3) |

No new config key, subcommand, allow rule or exit code.

## Commits (yours; nothing is staged)

1. Spec folder (Task 1).
2. The set-aside block and the accounting sentence: `workflows/redline-loop.js`, `agents/redline-reviewer.md`, `tests/loop-test.mjs`. They are one commit because their hunks interleave in the workflow and the test, as in #85's commit 2.
3. Docs: `docs/running.md`, `README.md`.
4. Standards retrospective edits, on their own.
5. As built: `plan.md`, `shape.md`.

## PR description drafts (for you to paste)

**"What lands", replacing the dropped-block bullet:**

> - `workflows/redline-loop.js` adds the set-aside block: a collapsed `<details>` after For the person, with one line per candidate that is neither a finding nor a For the person entry (`duplicate`, `settled`, `known`, `refuted`, `outside`, `disproportionate`). Each line has the candidate's file and line, its own summary as the finder wrote it, then the outcome and the verifier's ref. A `known` line names the issue or comment. A `duplicate` line names what it collapsed into, and when that is another candidate, that candidate's place and outcome, so a duplicate of a dropped or tracked candidate cannot hide. Inside the block, `&` and then `<` are escaped outside code spans, so a tag in a summary or a ref can neither close the block nor open another, and code in backticks reads as written. With nothing set aside there is no block, and an empty ref reads `no reason given`, with a warning. The handoff carries the block of the last round that ran the coverage pass, naming that round. The verify prompt and the agent file say the body lists every such candidate.

**"Deviations", replacing the list:**

> - **Deviations from #85's text,** recorded in `shape.md` of the #85 spec (decisions 12–14) and of the follow-up spec `agent-os/specs/2026-11-11-1629-85-set-aside-block-and-escaping/`:
>   - The "structural test" of the agent file did not exist. The key-phrase checks were built in its place.
>   - `docs/contract.md` has no entry, because neither change alters a per-repository file.
>   - "The last round" is read as the last round that ran the coverage pass.
>   - #85 lists the `refuted`, `disproportionate` and `outside` candidates. The block lists every candidate that is neither a finding nor For the person, so a candidate collapsed or matched to an issue is shown with its ref too. This supersedes decision 5 of the #85 spec.
>   - "Unedited" means the person reads the finder's words as written. Inside the block, `&` and `<` are escaped outside code spans, where GitHub would otherwise read a tag. For the person and finding lines are not escaped; that is known and out of scope.

(The "For the reviewer" Gate line's loop-test counts will move. As built gives the new ones.)

## Verification

- `node tests/loop-test.mjs`: the new and changed checks are red after Task 2 and green after Tasks 3 and 4. Every `coverage off` check is unchanged.
- `.claude/redline/checks.sh --baseline`: all nine checks exit 0.
- Read the escaping scenario's rendered body from the loop test. Optionally, send that one block through `gh api markdown -f mode=gfm` to confirm it renders as one collapsed block with the text as written.

## As built

- **Task 1.** The spec folder as planned. `standards.md` holds the full text of the seven standards as they read before the retrospective's edits.
- **Task 2, red.** `node tests/loop-test.mjs` printed `601 checks passed, 9 failed` (the baseline was `603 checks passed, 0 failed`). The nine were:
  - the accounting-sentence rule check;
  - the partly tracked `known` line;
  - the known finding from a candidate;
  - the set-aside block in the body, its count, and the handoff's block;
  - the final-nit-pass handoff;
  - the empty-ref warning;
  - the escaping.

  Four checks passed on the red run by design, since each pins a neighbouring decision that must not change:
  - a round of findings and For the person only has no block;
  - no set-aside line opens with a finding id;
  - the last covered round that set nothing aside leaves no block in the handoff;
  - a For the person line stays raw.
- **Task 3.** The accounting sentence in `candidatesBlock` and in `agents/redline-reviewer.md` ("Account for every candidate"), each applied by an exact single match, plus the comment above `candidatesBlock`. A search found no other statement of the three-outcome block in the agent file.
- **Task 4.** As planned:
  - `LISTED_ELSEWHERE` in place of `DROPPED_OUTCOMES`;
  - `out.setAsideCandidates` with `into` for a duplicate of another candidate's index;
  - `setAsideBlock` and `blockText` after `personLine`;
  - the renamed round-record field.

  A search for `droppedCandidates`, `droppedBlock`, `DROPPED_OUTCOMES` and "dropped block" in the workflow found none left.
- **Green.** `node tests/loop-test.mjs`: `610 checks passed, 0 failed`.
- **Rendered on GitHub.** The escaping scenario's pinned body went through `gh api markdown -f mode=gfm`, and the block rendered as one collapsed `<details>`:
  - the bare tags show as text;
  - the Vue tag and the double-backtick span read as written;
  - the unclosed backtick is literal;
  - the summary's open backtick pairs with the ref's, leaving the ref's `<c>` as text;
  - the newline line shows `&lt;b>` in its span, the fallback's accepted cost;
  - the backslash line shows its `<i>` as text.

  The same render showed the known gap of decision 5 reaching the block: the unescaped For the person line `a <b> & c note` opened a `<b>` that bolded the rest of the body, set-aside block included. It is out of scope, as decided, and recorded here as evidence.
- **Task 5.** `docs/running.md` "Rounds" step 1, "The coverage pass" and "The handoff comment"; README "Known limits" ("What a clean run means").
- **Task 6.**
  - `.claude/redline/checks.sh --baseline` exited 0, every check `exit` 0: syntax, validate, guard, loop, prefs, gate, setup, gh, background.
  - Version 0.2.2 in both files.
  - Standards retrospective: two edits approved and applied (see `shape.md`).
- No deviation from the plan.
