# #87: text Redline posts from the finder and the verifier: mentions, tags and the span rule

Spec folder: `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/`

## Context

Since #85 (PR #86), every round's review body and the handoff post the finder's summaries and the verifier's refs in the set-aside block. Rounds on #86 found three problems:

1. A bare `@param` or `@click` is a live mention, so GitHub notifies whoever owns that login.
2. A bare `<b>` outside the block (in a For the person, finding or Already tracked line) bolds the rest of the body. This predates #86.
3. The block's hand-made model of GitHub's backtick pairing has holes.

The block also has no heading, so it reads as part of whatever section comes before it. This spec makes every finder and verifier field the workflow posts in the review body and the handoff inert, through one function, and does the same for the inline comment's title. It decodes a title read back from GitHub once, so a carried finding is never escaped twice. It gives the block a heading, and the docs say exactly what is escaped and neutralised.

Version stays **0.2.2** on purpose: 0.2.2 is untagged and no install has it, so the Version check is not a finding. `scripts/redline-guard.sh`, `hooks/hooks.json` and `scripts/redline-gh.sh` are not touched. No round prompt changes, and `coverage off` prompts stay byte-identical. The user makes every commit; the implementation leaves the tree uncommitted.

## Decisions (shape.md, "Decisions")

From the brief (2026-11-12, not reopened): decisions 1 to 12 as given. Scope is #87's four changes; the two "Not in this issue" items stay out; mentions are neutralised in finder/verifier text; workflow mentions stay live; `&`/`<` go through one function shared with the block; the span rule; the heading; the round trip; inline comments and replies were checked; the version; the tests standard's bullet; docs no more than the code; no guard, hook or prompt change.

Asked at shaping (one at a time), answered by the user:

13. **Inline comments and replies (decision 8).** Both carry verifier text, and `place` (`redline-gh.sh:220`) moves an unanchorable comment into the review body word for word.
    - **Joins:** the comment's `**title**` line only, through the same function.
    - **Stays out:** description, proposed fix and replies. README Known limits names them, and a follow-up issue body is drafted (Task 8), opened as #88.
    - **Plus:** one sentence in each agent file whose text is posted, pinned by a key-phrase check. It is a standing instruction, not a round prompt change: *"An identifier that begins with `@` (a decorator, a directive, a docblock tag) is always written in backticks, because a bare `@word` notifies a GitHub account."*
14. **Form: a word joiner (U+2060) right after the `@`.** It is inserted after every `@` directly before an ASCII letter or digit, outside a code span, or everywhere in a line escaped whole.
    - **Rider (a):** every reader that carries text forward strips U+2060 first, with a test.
15. **Span rule (decision 5, refined by rider (b)).** A code span is left as written only when the text holds none of `](`, `][`, `://`, `www.` (any case), CR, `\` or a newline. Otherwise the whole text is escaped.
    - The three constructs and their renders are recorded under Evidence.
    - So is the list of constructs that needed no trigger, so nobody re-tests them.
16. **Round trip: decode at intake.** `readBack`, the exact inverse of the render, decodes each prior title once where `args.priorFindings` enters the workflow. `prior-findings` stays a byte-for-byte reader.
    - **Rider (a):** a title posted before #87 comes back raw and is decoded all the same. An old title that holds a literal `&lt;` then reads `<` internally, and this is accepted. Its posted bytes are unchanged, and GitHub already showed it as `<`.
    - **Rider (b):** the forged-line hazard stays out of this spec. That is a newline in free text producing a `- **R1-9** · …` or `Redline round N` line that the readers take as real. It goes into the follow-up issue body, #88.
17. **More fields: all three join.** The review summary paragraph, the verifier's `why` on Resolved lines, and on Earlier rounds lines the `knownAs` and the `why`.
    - A summary holding a newline is escaped whole; that its spans then show entities is accepted and said in `docs/running.md`.
    - Shaper, person and implementer text stays raw, covered by the agent-file sentence.
18. **Heading.** `### Candidates set aside (N)` in the body, and `### Candidates set aside in round <n> (N)` in the handoff, in the same places as today.
    - The `<summary>` becomes `Collapsed, already tracked or dropped`.
    - Confirmed: no reader in `redline-gh.sh` uses `###` headings. `prior-findings` reads finding lines under any heading; `last-round` and `has-review` grep `^Redline round N`; `place` only writes `### Not placed inline`.
    - A gh-test case runs the readers with the new heading present.

Shaping defaults (recorded, shown here for approval):

- **Fields sharing a line are rendered as one text,** as the block already reads summary and ref together. Workflow glue between them holds no `&`, `<`, `@` or backtick. An open backtick in one field would pair with one in the next, and read apart, a span could open outside the escaping (see the Already tracked case in Task 3).
- **Not rendered:**
  - the backticked place in `personLine` and `findingLine` (unchanged; a path holding a backtick is still a known limit);
  - the workflow's markers, `<details>`/`<summary>` and fixed words;
  - every workflow mention: `@<reviewer>, over to you`, `decided by: @<login>`, `plan approved by @<login>`, `(@<login>'s pick)`, `dropped by @<login>`, the human pass's `by @<login>` header.
- **A teammate's text never reaches these lines.** H-pass titles are posted in no review body or handoff (`humanSummary` lists ids only), so they are not neutralised.
- **Agent files that get the sentence:** `redline-reviewer`, `redline-shaper` (its recommendation, mitigation, full fix and `none` why are posted in replies and the handoff), `redline-resolve` (its mitigation and full fix) and `redline-implementer` (commit subjects in replies and Commits).
  - Not `redline-github`: it posts the workflow's bodies verbatim and writes none of its own.
  - Not the approvers or the checker: nothing they write is posted.
  - The skill's own decision restatement (`skills/redline/SKILL.md`) is not an agent file and is out, per the answer's wording.
- **Standards retrospective:** proposed at the gate (expected items in Task 9).

## Evidence (shape.md, "Evidence")

All of this is invented text rendered with `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline`. Nothing was posted. The probes are in the session scratchpad; shape.md records the text and results below.

**Mention forms**

- Still a user-mention link:
  - raw `@click`, `@param`, `@csrf` (an org);
  - `\@click` and `&#64;click`;
  - a word joiner *before* the `@`;
  - `path/@click`, `(@click)`, `@click.`, `@click's`, `**@click**`, `_@click_`, `@@click` (the second `@`) and `@123`.
- Not a mention:
  - `@`+U+2060, `@`+U+200B, `@`+U+200C and `@<!-- -->click`;
  - `` `@param` `` and `@-click`;
  - `a@param.com` (a mailto link);
  - `[ask @click](url)` (link text);
  - `@github/docs` (a team: no link in the API render).
- Costs:
  - `https://medium.com/@\u2060click/post` keeps its text, but its href gets `%E2%81%A0`;
  - with the comment form, that link was cut at `@`.
- Controls: `@octocat, over to you` and `decided by: @octocat` stayed live.

**The block under the proposed rule** (a `<details>` with five lines: tags, a link with a backtick in its title, a lone CR, backslashes, a span holding `@param`)

- One `<details>`; no mention except `@octocat`.
- `<b>` and `</details>` showed as text, and the CR rendered as `<br>` inside the item.
- A raw For the person `<b>` above the block bolded as before.
- Cost seen: `\<b>` escaped whole shows `&lt;b>`.

**Constructs that read a backtick before spans pair.** Each leaked a raw `<i>` under plain pairing; each is now a trigger.

| Construct | Raw input | Render |
|---|---|---|
| Inline link or image | `[a](/u "`") <i>x</i> `` ` `` | `<a title="`">a</a> <i>x</i>` (same with `![a](/i.png "`")`) |
| Full reference with a definition in the same body | `[a][q`] <i>x</i> `c`` + `[q`]: /defined` | `<a href="/defined">a</a> <i>x</i>` |
| Bare autolink | `http://x.com/a`b <i>x</i> `c`` | link `http://x.com/a%60b`, then `<i>x</i>` |

- The autolink row also leaks with `www.x.com/`a`, `(www.…` and `ftp://` (GitHub strips the ftp link, but the backtick is already consumed).
- Escaped whole, all three render `&lt;i&gt;` as text.

**Consistent with plain pairing (no trigger needed)**

- a reference with no definition;
- collapsed `[q`][]` and shortcut `[q`]` references, even with a definition;
- footnote `[^q`]`;
- an email autolink `a`b@c.com` and `mailto:a`b@c.com`;
- uppercase `WWW.x.com` (not autolinked);
- `xhttp://` inside a word;
- a span inside link text `[a `<i>` b](/u)`;
- GitHub math: `` $`<i>x</i>`$ `` renders inside `<math-renderer>` with its content escaped, and `$a<i>b</i>$` is plain text that the `<` escaping already covers;
- `` `$a[0] < $b` `` and `` `[data-x] <i>` `` keep their spans, so `[` alone is not a trigger.

## The round trip (shape.md, "Round trip")

- **Only `prior-findings` brings free text back:** `title` (the finding line's tail), `body` (the root inline comment) and `reply.body`.
  - `has-review`, `last-round`, `last-human-review`, `human-review` and `threads` read ids, fixed prefixes and markers only.
  - A relaunch never re-reads GitHub (cached results, byte-identical args), so the run's own text is escaped once.
- **Nothing compares titles: matching is by id.** On an escaped title, the finding-line regex (`redline-gh.sh:334`) and the suffix strip (`:349`) still hold, since escaping adds no ` · ` and no backtick.
- **The title is posted again in six places:**
  - Carried forward lines (the reviewer copies it, or `reconcilePrior`'s fallback copies `p.title`, `redline-loop.js:2221`);
  - the comment title;
  - Resolved (`:855`);
  - handoff Earlier rounds (`:3131`);
  - Decisions/Deferred/Left to you for a carried finding;
  - cap-hit Still open.
  - So it is decoded once at intake (`redline-loop.js:~103`, before `carryList`/`priorById`), and the reviewer's prompt lists show the raw title.
- **`body` and `reply.body` stay raw and are reposted raw.** The fallback reuses `body` (with its escaped title line) as a raw description, and Earlier rounds reposts `reply.body`, live `decided by: @author` included. So nothing is escaped twice.
- **The inverse is exact on the trip that matters:**
  - Escaping moves no backtick and adds no trigger character, so `readBack` finds the same mode and the same spans.
  - Outside spans it removes U+2060 after `@`, then turns `&lt;` into `<`, then `&amp;` into `&`.
  - `postedText(readBack(postedText(x))) === postedText(x)` for every x. `readBack(postedText(x)) === x` except for a word joiner x already held after an `@`.
- **Known, out of scope:** an agent that copies escaped text from `pr-comments` (the known-finding check) and posts it shows an entity once more. That is cosmetic, never a leak, and U+2060 is idempotent.

## Task 1: Save spec documentation

Create the folder above with:

- `plan.md`: this plan.
- `shape.md`:
  - Scope; Decisions 1 to 18 and the defaults; Evidence; Round trip;
  - Context: Visuals none; References; Product alignment with `agent-os/product/mission.md`. "Decisions stay with people": owner mentions stay live. "Honest about its reach": Known limits names what stays raw;
  - Standards Applied;
  - Deviations: from the #85 follow-up spec, decision 5 (escaping limited to the block), decision 10's pairing-only model, the fallbacks and answer 12's summary label are all superseded.
- `standards.md`: the full text of `testing/tests`, `workflow/agents`, `workflow/replay`, `process/docs-gate`, `process/release`, `process/standards-retrospective`, `process/internal-notes` and `prompts/attribution`, as they read today.
- `references.md`, citing:
  - `blockText`/`setAsideBlock` (`redline-loop.js:894-933`);
  - `findingLine` (`:813`), `reviewBody` (`:825`), `personLine` (`:877`), `commentBody` (`:945`), `handoffComment` (`:2871`), the `earlierRoundsLines` body (`:3110-3132`), `reconcilePrior` (`:2215`), the intake (`:81-103`);
  - `redline-gh.sh` prior-findings (`:318-366`) and `place_comments` (`:206-225`);
  - `tests/loop-test.mjs` §15 (`:1570-1652`) and `prior()` (`:210`);
  - `tests/gh-test.sh` PR 14 cases (`:207-229`);
  - the #85 follow-up spec folder.

## Task 2: One function for posted text (`workflows/redline-loop.js`)

Replace `blockText` with three functions:

- `textParts(text)`: the shared reader. It returns `[{span, text}]` and holds today's pairing, unchanged. When `ESCAPE_WHOLE = /\]\(|\]\[|:\/\/|www\.|[\r\n\\]/i` matches, it returns one non-span part.
- `postedText(text)`: outside spans, `&`→`&amp;`, then `<`→`&lt;`, then `@(?=[A-Za-z0-9])`→`@\u2060` (`WORD_JOINER`).
- `readBack(text)` (Task 4): the inverse.

The docblock gives the rule, the reason for each trigger (the Evidence table), and why spans are left as written.

`setAsideBlock` passes the raw joined text to `personLine`, which now renders it (Task 3), so the block is not escaped twice.

**Tests** (red first, in §15 `tags`):

- Re-pin the seven existing lines. All are byte-identical except that the For the person check flips (Task 3).
- Add one case per way the reading can go wrong, each pinned as the exact string written:
  - `@click`, `` `@click` `` in a span, `@123`, `@-x` untouched, `a@b.co` → `a@\u2060b.co`;
  - `](` (a link with a backtick in its title) escaped whole;
  - `][` escaped whole;
  - `://` escaped whole;
  - `WWW.` (any case) escaped whole;
  - a lone CR escaped whole;
  - a backslash before `<` → `\&lt;`, the pinned cost;
  - `@param` inside a span of a line escaped whole → `` `@\u2060param` ``;
  - the neighbour that must not change: `` `$a[0] < $b` and `[data-x] <i>` `` keeps both spans as written.
- `oneBlock` still holds in the body and the handoff.

## Task 3: The lines outside the block

Each change goes through `postedText`, with fields that share a line joined into one text:

- **`findingLine`** (and so Findings, Carried forward and cap-hit Still open): `postedText(f.title)`.
- **Already tracked:** `postedText(`${f.title}: ${f.knownAs}`)`.
- **Resolved:** `postedText(`${title}: ${r.why}`)`.
- **Summary:** `postedText(review.summary.trim())`.
- **`personLine`:** `postedText(entry.text)`, covering For the person in the body and the handoff.
- **`commentBody`:** `**${postedText(f.title)}**`.
- **Handoff Decisions, Deferred (both forms) and Left to you:** `postedText(title)`, with the outcome, mitigation and full fix left raw.
- **Earlier rounds:** split `what` into a rendered part and a raw part. The title plus the glue, and any `knownAs` or `resolved: why`, are rendered as one text. `: ${record.outcomes[id]}`, `: ${p.reply.body}` and `decidedBy(REDLINE)` stay raw.

**Tests** (loop-test; each one a pinned string):

- the finding line and the comment title for `Binds @click to <b> & more` (with `· needs a decision`);
- Already tracked with title ``one ` open`` and knownAs ``#41 `<c>` ``, which becomes ``one ` open: #41 `&lt;c>` ``. This proves the joint reading: read apart, `<c>` would sit outside GitHub's span;
- a summary with `@param` and `<b>`, and a summary with a newline (escaped whole);
- For the person escaped in the body and the handoff (the flipped check);
- a Decisions line whose title is escaped while `decided by: @<login>` stays as written;
- a Deferred line whose shaper mitigation `<b>` stays raw (the neighbour);
- Left to you, with a title holding `<b>`, in §12;
- Earlier rounds `already tracked in` and `resolved:` fields escaped, while `already handled …: <reply>` stays raw with `@author` live;
- `@<teammate>, over to you for the human review.` unchanged.

Existing pins with plain text (`:572`, `:627`, `:639`, `:650`, `:665`) must pass unchanged.

**Renderer check (decision 10).** Copy the pinned strings into one scratch body: the block cases, a finding line, For the person, the summary, Already tracked, a Decisions line, plus `@octocat, over to you`. Render it with `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline -F text=@<scratch file>`. Record the result in shape.md: no mention but the two `@octocat` controls, no formatting leak, one `<details>`, and every line reads as written. Never use a real teammate's login.

## Task 4: The round trip

- Add `readBack(text)` (beside `postedText`, sharing `textParts`). Outside spans it does `@\u2060`→`@`, then `&lt;`→`<`, then `&amp;`→`&`.
- At intake, map `priorFindings` so that each string `title` is `readBack(title)`, before `carryList`, `trackedList` and `priorById`. A comment there names #87 and the round trip.

**Loop-test.** A scenario whose `priorFindings` titles are posted forms:

- **Fallback carry.** R1-1 `Binds @\u2060click to &lt;b> &amp; more` (none) becomes a Carried forward line and a comment title escaped once: no `&amp;lt;`, no `@\u2060\u2060`.
- **Reviewer prompt.** The carry list shows the decoded `Binds @click to <b> & more`. A reviewer finding that copies it is escaped once.
- **Resolved and Earlier rounds.** Each of the posted block strings (cases a, d, e, f, the `](`, `://` and CR cases) as a prior title on a Resolved line reads back identical: `- **R1-k** <posted>: because`. This pins postedText∘readBack∘postedText = postedText, one case per mode.
- **A pre-#87 raw title.** `Old <b> & title` is posted as `Old &lt;b> &amp; title` on the Earlier rounds line.
- **An old literal.** `Escape &lt; by hand` reaches the reviewer prompt as `Escape < by hand`, and its posted bytes are unchanged (rider (a)).
- **Decisions or Deferred** for a carried finding with an escaped title, escaped once.

**gh-test.** A new fixture PR 15 (`reviews-15.json`, `comments-15.json`, `issue-comments-15.json`; the shim routes them and they are added to the `cp` list):

- Round 1 has an `R1-1` line whose title is `Binds @\u2060click to &lt;b> &amp; more · needs a decision`, plus `### For the person` and the new `### Candidates set aside (1)` with its block.
- Round 2 carries it as `R2-1 … · first reported as R1-1`.
- Cases (compare with `jq -a` so U+2060 prints as `\u2060`; bash 3.2 has no `$'\u…'`):
  - the ids are `["R1-1","R2-1"]`;
  - the title bytes are kept and the suffix is stripped (prior-findings stays byte-for-byte; the workflow decodes);
  - `carried_from`/`carried_to` and `disposition` are `carried`;
  - no block, heading or For the person line is a finding;
  - `last-round 15` prints 2 and `has-review 15 2` exits 0 with the heading present.

## Task 5: The block's heading

`setAsideBlock` opens with `### Candidates set aside${where} (${n})`, `''`, then `<details>`, then `<summary>Collapsed, already tracked or dropped</summary>`. Both callers keep their places.

Update the docblock, and the §15 pins (`:1540`, `:1605`, the handoff `in round 1`).

Add a check that a round with no For the person entries still has the heading directly above `<details>`. That is the case #87 names.

## Task 6: The `@` sentence in the agent files

Add the sentence from decision 13, word for word:

- in `agents/redline-reviewer.md`, after line 105;
- in `redline-shaper.md`, after line 54;
- in `redline-resolve.md`, after line 48;
- in `redline-implementer.md`, as a bullet after line 25.

Loop-test reads the four files and checks the key phrase `because a bare \`@word\` notifies a GitHub account` in each. Existing `coverage off` prompt identity checks stay green, since no round prompt changes.

## Task 7: Docs

**`docs/running.md`, "How the review is posted":** add a bullet, "What is escaped and neutralised". It covers:

- the fields: the title everywhere it is posted (finding line, comment title, handoff lines), the summary, For the person, Already tracked (title and `knownAs`), Resolved (title and why), Earlier rounds (`knownAs`, why) and the set-aside lines;
- the three replacements;
- spans left as written unless the text holds `](`, `][`, `://`, `www.` (any case), `\`, CR or a newline, in which case it is escaped whole and a span's `<` or `&` shows as the entity (the summary included);
- fields on one line are read together;
- workflow mentions stay live;
- shaper, person and implementer text, and comment descriptions and proposed fixes, are posted as written;
- a later run decodes a title read back by `prior-findings` once.

**`docs/running.md`, elsewhere:**

- "Rounds" step 1: the block under its own heading.
- "The coverage pass": replace the "Inside the block, `&` and then `<` …" sentence with a pointer to that bullet, and give the new label.
- "The handoff comment": `### Candidates set aside in round <n> (N)`.

**`README.md`, Known limits:** a new line, "A finding's description, its proposed fix and Redline's replies are posted as written". It covers:

- a bare `@word` there notifies;
- the four agent files ask for backticks;
- the follow-up issue, #88;
- the costs: copied text carries U+2060, an email or bare URL holding `@x` loses its link, a backslash before `<` or `&` shows the entity.

No more than the code does.

**Docs entries (gate step 10):**

| File | Where it is described |
|---|---|
| `workflows/redline-loop.js` | the running.md sections above and README Known limits |
| each of the four agent files | running.md "How the review is posted" (the bullet names the instruction) and the README line |
| tests and fixtures | outside the gate's list |

No config key, subcommand, allow rule or exit code changes.

## Task 8: Draft the follow-up issue (no code; opened as #88)

The body goes into `plan.md` for the user to open, with no attribution.

- **Title:** "Inline comment descriptions, proposed fixes and replies can mention accounts, and a newline in posted text can forge a line the readers take as real".
- **What happens:**
  - descriptions, proposed fixes and reply text are posted raw;
  - they are multi-line markdown with fences, so #87's line rule would escape them whole;
  - separately, a newline in any free text can forge `- **R1-9** · …` (read by `prior-findings`) or `Redline round N` (read by `has-review`, `last-round` and `last-human-review`).
- **Change:** a fence-aware rule (mentions at least), and a newline rule for posted free text.
- **Not in it:** the #87 lines.
- **Done when:** a description holding `@param`, `<b>` and a fenced `<template>` posts with no mention, no leak and an intact fence, and a free text holding a newline plus a fake finding line is not read back as a finding.

## Task 9: Verification Gate

Run `.claude/redline/checks.sh --baseline` and repeat until steps 1 to 9 are green (the loop and gh harnesses carry the new cases; run each red before green). Then:

- **Step 10, Docs:** each entry names its commit or its reason.
- **Step 11, Version:** 0.2.2 kept on purpose (decision 9).
- **Step 12, Standards retrospective:** propose with AskUserQuestion, one item at a time. Expected items:
  1. `workflow/agents.md`, the #85 bullet. Its escaping sentences and "For the person and finding lines are not escaped, a known gap" are now wrong. Replace them with the one function, the fields, the triggers, U+2060, live workflow mentions, the decode at intake, and the new heading and summary label.
  2. `testing/tests.md`, the escaped-text bullet's case list: the triggers, the mention cases, the joint reading of two fields, the round trip pinned per mode, the renderer check.
  3. Possibly `workflow/agents.md`: posted agent text writes `@` identifiers in backticks (Task 6).

  Apply the approved edits in their own commit.
- **Step 13:** `plan.md` As built, with deviations under Decisions.

Report the files grouped per intended commit:

1. the spec folder;
2. Tasks 2 to 5;
3. Task 6;
4. Task 7;
5. the standards.

Never stage or commit.

## Follow-up issue (Task 8: the draft, opened as #88)

**Title:** Inline comment descriptions, proposed fixes and replies can mention accounts, and a newline in posted text can forge a line the readers take as real

**Body:**

> ## What happens
>
> #87 makes the finder's and the verifier's short fields inert where the review body, the handoff and an inline comment's title post them. `&` and `<` are escaped and a word joiner follows each `@` before a letter or a digit, outside code spans. Two kinds of text are still posted as written:
>
> - **An inline comment's description and proposed fix,** written by the verifier. A bare `@param` or `@click` there notifies the account it names, and a bare tag formats the rest of that comment. A comment GitHub cannot anchor is moved into the review body under "Not placed inline", where the tag formats the rest of the body after it.
> - **The text of a reply:** the verifier's `why` (resolved) and `knownAs` (carried and tracked), the shaper's mitigation and full fix, the person's decision sentence, and the implementer's commit subject. Each sits on a line with the workflow's `decided by: @login`, which must stay live.
>
> Both are multi-line markdown with code fences. #87's rule escapes a text holding a newline whole, so applied to them it would show `&lt;` inside every fenced block. The agent files ask for `@` identifiers in backticks (#87), but that is an instruction, not a guarantee.
>
> Separately, a newline in any posted free text can forge a line the readers take as real:
>
> - `redline-gh.sh prior-findings` reads every line of a Redline review body shaped like ``- **R<n>-<k>** · <category> · <severity> · <confidence> · `file:line` · <title>``, whatever heading it sits under.
> - `has-review` and `last-round` grep for `Redline round N` at the start of any line of a review body.
> - `last-human-review` greps for `Redline human review N` at the start of any line of a comment.
>
> A summary, a ref or a moved comment's description that holds a newline followed by such a line is read back by a later run as a finding of an earlier round, or as a posted round.
>
> ## Change
>
> - **A fence-aware rule for multi-line text.** It neutralises `@` at least, outside fenced code, indented code and code spans, in comment descriptions, proposed fixes and replies' free text, and keeps the workflow's own mentions live. Decide whether `&` and `<` are escaped there too.
> - **A newline rule for posted free text,** so no free text can start a line the readers parse.
>
> ## Not in this issue
>
> - The lines #87 covers: finding, For the person, Already tracked and Resolved lines, the summary, the set-aside block, the handoff's decision lines, and the inline comment's title.
>
> ## Done when
>
> - A description holding `@param`, `<b>` and a fenced `<template>` block posts with no mention, no formatting leak, and the fence intact and readable.
> - A summary or a ref holding a newline followed by a fake finding line or `Redline round 9` is not read back by `prior-findings` as a finding, and does not move `last-round`.

## As built

**Files:**

- `workflows/redline-loop.js`:
  - `blockText` is replaced by `textParts`, `postedText` and `readBack`;
  - the call sites are `findingLine`, the summary, Resolved, Already tracked, `personLine`, `setAsideBlock` (now with its heading), `commentBody`'s title, the handoff's Decisions, Deferred and Left to you, and `earlierRoundsLines`;
  - the intake decodes `priorFindings` titles.
- `agents/redline-reviewer.md`, `redline-shaper.md`, `redline-resolve.md`, `redline-implementer.md`: the backtick sentence.
- `docs/running.md`: "Rounds" step 1, "The coverage pass", "The handoff comment", and "How the review is posted" (a new bullet).
- `README.md`: a new Known limits line.
- `tests/loop-test.mjs`:
  - §15 re-pinned: the heading, the summary label, the For the person line;
  - §15 gained nine escaping cases and the heading-without-For-the-person check;
  - §12 gained the Left to you check;
  - a new §16 holds the lines outside the block, the decision line, the round trip and the agent files;
  - the mock gained opt-in `scenario.summary` and `scenario.mitigation`.
- `tests/gh-test.sh` and `tests/gh-fixtures/{reviews,comments,issue-comments}-15.json`: the PR 15 fixture and seven cases.
- `scripts/redline-gh.sh`, `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched. The version stays 0.2.2.

**Red before green:**

- **Loop test.** The new `tests/loop-test.mjs`, run against `HEAD`'s workflow and agent files in a scratch tree, gave 636 passed, 34 failed. Each failure was a rule the new cases name.
- **Mutation.** With the intake decode removed, the loop test gave 650 passed, 20 failed: every round-trip check but the mentions-only mode, since the word joiner is idempotent. The carry-list check is the one that pins the joiner's strip (answer 14, rider (a)).
- **Green:** 670 passed, 0 failed.
- **Gh harness.** The first run went red, 119 passed and 2 failed, and the cause was the test's own text. A tool call had decoded the escape `\u2060` in the expected strings into a real word joiner, while `jq -a` prints the escape. The files now hold the escape as text. Green: 121 passed, 0 failed.

**Renderer check (decision 10).** The strings the loop test pins went into one body: 14 set-aside lines, a finding line, Already tracked, For the person, the summary, a Decisions line ending `decided by: @octocat`, and `@octocat, over to you for the human review.`. It was rendered with `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline` (2026-11-12). Nothing was posted. The result:

- Exactly two user-mention links, both to `octocat`: the owner and the hand-off line.
- One `<details>` and one `</details>`, and no raw tag (`<b>`, `<i>`, `<s>`, `<c>`, `<Head`) anywhere.
- Every `@\u2060word` rendered as text.
- The link with a backtick in its title rendered as a link followed by `&lt;/details&gt;` as text. The `http://` autolink kept its backtick, with the tag after it as text. The CR rendered as `<br>` inside its item.
- The costs showed where documented:
  - the `][` and `WWW.` lines, escaped whole, show `&lt;i>` inside the span GitHub pairs;
  - `\<b>` shows `&lt;b>`;
  - the Already tracked title and knownAs pair across the `: ` as one span, with `<c>` after it as text.

**Gate (2026-11-12).** `.claude/redline/checks.sh --baseline` exited 0, `ok: true`. Every check exited 0:

| Check | Result |
|---|---|
| syntax | exit 0 |
| validate | passed, with the known icon warning |
| guard | 592 passed, 0 mismatched |
| loop | 670 passed, 0 failed |
| prefs | 101 passed, 0 failed |
| gate | 117 passed, 0 failed |
| setup | 468 passed, 0 failed |
| gh | 121 passed, 0 failed |
| background | 39 passed, 0 failed |

**Docs (step 10).** Each Docs entry in Task 7 lands in the docs commit, with `docs/running.md` and `README.md` as its sections say. The tests and fixtures are outside the step's list.

**Version (step 11).** 0.2.2 is kept on purpose (decision 9).

**Deviations from the shaped plan:**

- **The trigger regex sits inside `textParts`.** A top-level `const` would be in its temporal dead zone when the intake, near the top of the script, calls `readBack`.
- **The intake validates `priorPosted`, then maps it to `priorFindings`.** The name is kept for every later reader.
- **The implementer's sentence is a bullet with a bold lead,** in its Rules list, with the sentence word for word.
