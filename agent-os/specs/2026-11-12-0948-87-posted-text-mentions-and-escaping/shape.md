# #87: text Redline posts from the finder and the verifier — Shaping Notes

## Scope

Issue #87 is the whole brief. Since #85 (PR #86), every round's review body and the handoff post the finder's summaries and the verifier's refs in the set-aside block. Rounds on #86 found three ways that text, and the verifier's text beside it, can do something on GitHub it should not:

- **A bare `@word` is a live mention.** It notifies whoever owns that login.
- **A bare tag outside the block breaks the body.** It can sit in a For the person, finding or Already tracked line. This predates #86.
- **The block's hand-made model of GitHub's backtick pairing has holes.**

Also, the block has no heading of its own.

What is built:

- **Mentions.** Every finder and verifier field the workflow posts in the review body and the handoff goes through one function. That function escapes `&` and `<` and neutralises `@` outside code spans. The inline comment's title line goes through it too.
- **The span rule.** It is widened to a fixed list of triggers.
- **The round trip.** A finding's title read back from GitHub is decoded once at intake, so a carried finding is never escaped twice.
- **A heading for the block.**
- **Agent files.** Four agent files gain one sentence asking for `@` identifiers in backticks.
- **Docs.** `docs/running.md` and the README say what is escaped and neutralised.

Out of scope:

- the two "Not in this issue" items of #87:
  - the For the person count check;
  - whether a later coverage pass takes a set-aside line as settled;
- inline comment descriptions, proposed fixes and thread replies (decision 13);
- the forged-line hazard (decision 16).

A follow-up issue body was drafted for both in `plan.md`, Task 8, and opened as #88.

## Decisions

From the brief (2026-11-12, @michaelfromtheoutfit; not reopened):

1. **Scope** is #87's four changes: mentions, tags outside the set-aside block, the simpler span rule, and a heading for the block. The two items under "Not in this issue" stay out.
2. **Mentions.** An `@` outside a code span never produces a mention in free text that came from the finder or the verifier.
   - That covers the set-aside block's lines and the finding, For the person and Already tracked lines, in the review body and the handoff.
   - The mentions the workflow writes on purpose stay live: the hand-off line to the reviewer, and the login after "decided by:".
   - A line that holds both (a decision line with a finding's title and its owner) neutralises the title and keeps the owner.
3. **How to neutralise** is settled against GitHub's renderer, on invented text, with `gh api markdown -f mode=gfm` and the repository as context. Nothing is posted and nobody is notified. The preferred form leaves the visible text as written. Asked before fixing the form (answer 14).
4. **Tags outside the block.** Those same lines get the block's `&` and `<` escaping, through one function shared with the block, so the rules cannot drift apart.
5. **The span rule.** A code span is left as written only when the text holds none of `[`, a carriage return, a backslash or a newline; otherwise the whole text is escaped. This widens the fallback the #85 follow-up spec built and supersedes its pairing-only model. Refined by answer 15.
6. **The heading.** Where the block sits and what it is called was proposed and asked (answer 18).
7. **The round trip.** Before planning, everything that reads these lines back from GitHub was traced. The tests must prove two things: a finding carried forward is not escaped twice, and a title still matches its earlier id (see "Round trip" below and answer 16).
8. **Inline comment bodies and thread replies.** Report whether they carry finder or verifier free text along the same path; if they do, ask. They do, so this was asked (answer 13).
9. **The version stays 0.2.2, on purpose.** 0.2.2 is not tagged and no install has it, so the Version check is not a finding. #87's "Done when" tags 0.2.2 only after this lands.
10. **Tests follow the tests standard's bullet on escaped text.** The escaped string the workflow writes is pinned, with one case per way the reading can go wrong. One check against the renderer is recorded in this spec.
11. **Docs.** `docs/running.md` and the README say what is escaped and neutralised, and no more than the code does.
12. **Untouched.** `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched. `coverage off` prompts stay byte-identical. There is no prompt change unless the work needs one, in which case stop and ask.

Asked at shaping (2026-11-12, one at a time), answered by @michaelfromtheoutfit:

13. **Inline comments and replies join only through the comment's title.**
    - Both carry verifier text. `place` (`scripts/redline-gh.sh:220`) moves a comment GitHub cannot anchor into the review body word for word, under "Not placed inline".
    - The comment's `**title**` line goes through the same function as the finding line. The title is the same text in both places, so neutralising one alone would still let the comment notify.
    - Description, proposed fix and replies stay out. They are multi-line markdown with fences, so the line rule would escape them whole. README Known limits names them, and the follow-up issue body is drafted (plan Task 8), opened as #88.
    - Plus one sentence, word for word, in every agent file whose text is posted in a comment or a reply, pinned by a key-phrase check: "An identifier that begins with `@` (a decorator, a directive, a docblock tag) is always written in backticks, because a bare `@word` notifies a GitHub account."
    - This is a standing instruction in the agent files, not a change to a round's prompt, so `coverage off` prompts stay byte-identical.
14. **The form is a word joiner (U+2060) right after the `@`.** It goes after every `@` directly before an ASCII letter or digit, outside a code span; in a text escaped whole, that is everywhere in the text.
    - The other form that worked, an empty HTML comment, was not chosen. It shows literally inside a code span of a text escaped whole, it cuts a bare URL's link at the `@`, and it puts a raw `<` back into the line.
    - Rider: everything that reads these lines back strips U+2060 before matching or carrying text forward, with a test (answer 16).
15. **The span triggers are `](`, `][`, `://` and `www.` (any case), in place of `[`.** Decision 5's carriage return, backslash and newline triggers stay.
    - Rider: `[` is common in code talk (`$a[0]`, `[data-x]`), so triggering on it would escape most lines whole and show entities inside their code spans.
    - The renderer showed three constructs that read a backtick before code spans pair. Neither `[` nor `](` closes the autolink row, and `](` alone misses the full reference.
    - The three constructs and their renders are recorded under Evidence, with the constructs that needed no trigger, so nobody re-tests them.
16. **Decode at intake.**
    - `readBack` is the exact inverse of the render and shares its span reader. It decodes each prior title once, where `args.priorFindings` enters the workflow.
    - `redline-gh.sh prior-findings` stays a byte-for-byte reader.
    - Rider (a): a title posted before #87 comes back raw and is decoded all the same, so an old title holding a literal `&lt;` then reads `<`. This is accepted. Its posted bytes do not change, since `<` posts as `&lt;`, and GitHub already showed it as `<`.
    - Rider (b): the forged-line hazard stays out of this spec. That is a newline in free text producing a `- **R1-9** · …` or `Redline round N` line that the readers take as real. It goes into the follow-up issue body, #88.
17. **More of the verifier's fields join.** These are the review's summary paragraph, the `why` on each Resolved from earlier rounds line, and, on handoff Earlier rounds lines, the `knownAs` (`already tracked in …`) and the `why` (`resolved: …`).
    - A summary that holds a newline is escaped whole like any other text. Its code spans then show entities; this is accepted and said in `docs/running.md`.
    - Shaper, person and implementer text on the same lines stays raw: mitigation, full fix, decision sentence, commit subject. The agent-file sentence (answer 13) covers it.
18. **The heading is `### Candidates set aside (N)`** in the review body, and `### Candidates set aside in round <n> (N)` in the handoff, in the same places as before.
    - The `<summary>` keeps only the three groups: `Collapsed, already tracked or dropped`.
    - Rider: confirm that no reader in `redline-gh.sh` depends on the order or the set of `###` headings, and add a gh-test case with the new heading present. Confirmed by reading the script:
      - `prior-findings` reads finding lines whatever heading they sit under (`:332-334`);
      - `has-review`, `last-round` and `last-human-review` grep `^Redline round N` or `^Redline human review N`;
      - `human-review` reads prefixes and markers;
      - `place` only writes `### Not placed inline`.

Shaping defaults (recorded, not asked; shown in the plan and approved with it):

- **Fields sharing a line are rendered as one text,** as the block reads summary and ref together:
  - Already tracked: title and `knownAs`;
  - Resolved: title and why;
  - Earlier rounds: the title, the glue and any `knownAs` or why.

  The glue between them is workflow text with no `&`, `<`, `@` or backtick. Read apart, a backtick left open in the first field would pair with one in the second, and a span the second field's reading left raw would sit outside GitHub's span.
- **A field before raw text is rendered alone.** That covers a title before a decision outcome, a mitigation or a reply. GitHub's span can only extend the span the field's own reading found, so what the field leaves raw stays inside a span.
- **Not rendered:**
  - the backticked place in `personLine` and `findingLine`;
  - the workflow's markers, `<details>`/`<summary>` and fixed words;
  - every workflow mention: `@<reviewer>, over to you for the human review`, `decided by: @<login>`, `plan approved by @<login>`, `(@<login>'s pick)`, `dropped by @<login>` in the threads line, and the human pass's `from review <id> by @<login>` header, which `redline-gh.sh human-review` matches.
- **A teammate's text never reaches these lines.** A human review pass posts its H findings in no review body or handoff (`humanSummary` lists ids only), so no teammate's words are neutralised.
- **The agent files that get the sentence:**
  - `redline-reviewer`: findings, summary, refs, `why`, `knownAs`;
  - `redline-shaper`: the recommendation, which becomes the autopilot decision; the mitigation and full fix; a `none` finding's why, in replies and the handoff;
  - `redline-resolve`: the mitigation and full fix;
  - `redline-implementer`: commit subjects, in replies and the handoff's Commits.

  Left out:
  - `redline-github`: it posts the workflow's bodies verbatim and writes none of its own;
  - the two approvers and the checker: nothing they write is posted;
  - the skill's decision restatement (`skills/redline/SKILL.md`): it is not an agent file, so it is out per answer 13's wording.
- **The prompt text does not change.** Decoding at intake alters a reviewer prompt only for a prior title that holds `&lt;`, `&amp;` or U+2060 outside a span. That is data, not prompt text. The loop test's `coverage off` identity checks run on plain titles and stay byte-identical.
- **Known and out of scope.** An agent can copy escaped text from `pr-comments` for the known-finding check and post it again. It then shows an entity once more. That is cosmetic, never a leak, and the word joiner is idempotent.

## Evidence

All renders used `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline`, on invented text, before planning (2026-11-12). Nothing was posted. The controls used `@octocat`, never a teammate's login.

**Mention forms.**

- Still produced a user-mention link:
  - raw `@click`, `@param` and `@csrf` (an org);
  - `\@click` and `&#64;click`;
  - a word joiner placed before the `@`;
  - `path/@click`, `(@click)`, `@click.`, `@click,`, `@click's`, `**@click**`, `_@click_`, `@@click` (the second `@`) and `@123`.

  So the rule cannot depend on the character before the `@`.
- Produced no mention:
  - `@`+U+2060, `@`+U+200B, `@`+U+200C and `@<!-- -->click`;
  - `` `@param` `` and `@-click`;
  - `a@param.com` (a mailto link);
  - `[ask @click](https://example.com)` (link text);
  - `@github/docs` (a team: no link in the API render).
- Costs of the word joiner:
  - `https://medium.com/@\u2060click/post` keeps its text, but the href gets `%E2%81%A0`;
  - with the comment form, that link was cut at `@`.
- Controls: `@octocat, over to you for the human review.` and `decided by: @octocat` stayed live.

**A set-aside block under the proposed rule.** The block had five lines:

- a summary with `@param`, `<b>bold</b>` and `</details>`, and a ref with a span `` `<b>` ``;
- a link with a backtick in its title;
- a lone CR before `</details>`;
- backslashes before `<`, `&` and `@`;
- a span holding `@param`.

A For the person line with a raw `<b>` sat above it.

- The block rendered as one `<details>`, with no mention but the `@octocat` control.
- `<b>` and `</details>` showed as text, the span showed `<b>` literally, the link rendered, and the CR rendered as `<br>` inside the item.
- The raw For the person `<b>` was live HTML, as #87 describes.
- Cost seen: `\<b>` escaped whole renders `&lt;b>`, since the backslash escapes the `&`.

**Constructs that read a backtick before code spans pair.** Each leaked a raw `<i>` under plain pairing:

| Construct | Raw input | GitHub's render | Trigger |
|---|---|---|---|
| Inline link | ``see [a](/u "`") <i>x</i> ` end`` | `<a href="/u" title="`">a</a> <i>x</i> `` ` `` end` | `](` |
| Image | ``see ![a](/i.png "`") <i>x</i> ` end`` | `<img … title="`"> <i>x</i> `` ` `` end` | `](` |
| Full reference, defined in the same body | ``see [a][q`] <i>x</i> `c` end`` with ``[q`]: /defined`` | `<a href="/defined">a</a> <i>x</i> <code>c</code> end` | `][` |
| Bare autolink | ``see http://x.com/a`b <i>x</i> `c` end`` | `<a href="http://x.com/a%60b">http://x.com/a`b</a> <i>x</i> <code>c</code> end` | `://` |
| Bare `www.` autolink | ``see www.x.com/`a <i>x</i> `b` end``, also after `(` | `<a href="http://www.x.com/%60a">www.x.com/`a</a> <i>x</i> <code>b</code> end` | `www.` |
| `ftp://` | ``see ftp://x.com/`a <i>x</i> `b` end`` | ``ftp://x.com/`a <i>x</i> <code>b</code> end``: linked, then the link stripped by GitHub | `://` |

Escaped whole, all of these render `&lt;i&gt;x&lt;/i&gt;` as text:

- ``http://x.com/a`b &lt;i>x&lt;/i> `c` ``
- ``[a][q`] &lt;i>x&lt;/i> `c` ``
- ``[a](/u "`") &lt;i>x&lt;/i> ` ``

**Consistent with plain pairing: no trigger needed.** Each was rendered raw, and GitHub paired the backticks as equal-length runs do:

- a full reference with no definition: ``[a][b`] <i>x</i> `c` `` gave `<code>] &lt;i&gt;x&lt;/i&gt; </code>`;
- a collapsed reference ``[q`][]`` and a shortcut reference ``[q`]``, both with a definition present: the span formed first;
- a footnote ``[^q`]``;
- an email autolink ``a`b@c.com``, and ``mailto:a`b@c.com``;
- uppercase ``WWW.x.com/`a``, which is not autolinked (the trigger is case-insensitive anyway);
- ``xhttp://x.com/`a`` inside a word, which is not autolinked;
- a span inside link text ``[a `<i>x</i>` b](/u)``;
- GitHub math: ``$`<i>x</i>`$`` renders inside `<math-renderer>` with its content escaped, and `$a<i>b</i>$` is plain text, which the `<` escaping already covers;
- `` `$a[0] < $b` `` and `` `[data-x] <i>` `` keep their spans, so `[` alone is not a trigger.

**The check on the written strings** (decision 10) is recorded under "As built" in `plan.md`, once the build pins them.

## Round trip

Traced before planning, every reader of what Redline posts:

- **Only `redline-gh.sh prior-findings` carries posted free text into new posts.** Three of its fields do (`:318-366`):
  - `title`, the finding line's tail with the suffixes stripped (`:334`, `:349`);
  - `body`, the root inline comment;
  - `reply.body`, the reply's text after its prefix.
- **The other readers carry none.** `has-review`, `last-round`, `last-human-review`, `human-review` and `threads` read ids, fixed prefixes and markers only.
- **A relaunch never re-reads GitHub.** It replays cached results with byte-identical args, so the run's own text is escaped once. Only a fresh launch re-reads `prior-findings`.
- **Nothing compares titles: matching is by id.** On an escaped title, the finding-line regex and the suffix strip still hold, since escaping adds no ` · ` and no backtick, and U+2060 is none of the fixed fields' characters.
- **Undecoded, the title would gain one escape per run.** It is posted again in six places:
  - Carried forward lines: the reviewer copies it from the carry list, or `reconcilePrior`'s fallback copies `p.title` (`workflows/redline-loop.js:2221`);
  - the inline comment's title;
  - Resolved from earlier rounds (`:855`);
  - handoff Earlier rounds (`:3131`);
  - Decisions, Deferred and Left to you, for a carried finding;
  - cap-hit Still open.

  So it is decoded once at intake, and the reviewer's prompt lists show it as the finder or verifier wrote it.
- **`body` and `reply.body` are reposted raw, as before, so neither is escaped twice.**
  - The fallback carry reuses `body`, with its escaped title line, as a raw description.
  - Earlier rounds reposts `reply.body`, live `decided by: @author` included.
- **The inverse is exact on the trip that matters.** Escaping moves no backtick and adds no trigger character, so `readBack` finds the same mode and the same spans. Outside spans it removes U+2060 after `@`, then turns `&lt;` into `<`, then `&amp;` into `&`. So:
  - `postedText(readBack(postedText(x))) === postedText(x)` for every x;
  - `readBack(postedText(x)) === x` except for a word joiner x already held after an `@`.

## Context

- **Visuals:** None.
- **References:** see `references.md`. They are:
  - the #85 follow-up spec folder;
  - in `workflows/redline-loop.js`: `blockText`/`setAsideBlock`, `findingLine`, `reviewBody`, `personLine`, `commentBody`, `handoffComment`, the Earlier rounds lines, `reconcilePrior` and the intake;
  - `scripts/redline-gh.sh`: `prior-findings` and `place_comments`;
  - `tests/loop-test.mjs` §15;
  - `tests/gh-test.sh`'s PR 14 cases.
- **Product alignment:** `agent-os/product/mission.md`.
  - "Decisions stay with people": every decision is posted with its owner, so the owner mentions stay live.
  - "Honest about its reach": README Known limits names what is still posted as written.
  - No conflict, no mission edit.

## Standards Applied

- `testing/tests`: escaped text pinned as the escaped string the workflow writes, one case per way the reading can go wrong, one renderer check recorded (decision 10); red before green; a tested surface gains a case; key phrases pinned.
- `workflow/agents`: the #85 bullet's escaping sentences, which this spec supersedes; an instruction an agent file states is pinned by a key phrase.
- `workflow/replay`: no round prompt changes; `coverage off` prompts stay byte-identical; nothing reads the clock or GitHub inside the workflow.
- `process/docs-gate`: a Docs entry per touched plugin file.
- `process/release`: the version is kept on purpose (decision 9).
- `process/standards-retrospective`: gate step 12.
- `process/internal-notes`: no design record copied in. The follow-up issue body is a draft for a public issue, opened as #88.
- `prompts/attribution`: no model or vendor name anywhere, the follow-up issue body (#88) included.

## Deviations from the #85 follow-up spec

- **Its decision 5** (the escaping applies to the block only) is superseded by decisions 2, 4 and 17 here.
- **Its decision 10's pairing-only model and its two fallbacks** (a newline, a backslash before a backtick) are superseded by decision 5 as refined by answer 15. Pairing by equal-length runs now applies only to a text holding no trigger.
- **Its answer 12's summary label** is superseded by answer 18. The count moves to the heading, and the summary keeps the three groups.
- **The "known gap"** in `workflow/agents.md` ("For the person and finding lines are not escaped") is closed. The standards retrospective replaces it.

## Standards retrospective

Listed mechanically (gate step 12) from three sources: the Decisions above, the As built deviations in `plan.md`, and the checks that went red. Presented one at a time on 2026-11-12, approved by @michaelfromtheoutfit, and applied for their own commit:

1. **`workflow/agents.md`, the #85 bullet.** Two passages contradicted answers 14 to 18 and are replaced, as drafted:
   - the block's label: the new heading and summary;
   - "Inside the block … For the person and finding lines are not escaped, a known gap".

   The new text covers one function for every finder and verifier field and the comment title, fields read as one text, the escapes and the word joiner, the triggers, what stays as written, the known gap (descriptions, proposed fixes, replies), and the decode at intake.
2. **`workflow/agents.md`, a new bullet after the "applied everywhere" bullet.** It was missing. An agent whose words reach GitHub carries the backtick sentence: the four files, pinned by the loop test, and not the GitHub agent. Applied as drafted.
3. **`testing/tests.md`, the escaped-text bullet's case list.** "Beside a For the person line that stays raw" was now wrong, and the list lacked #87's cases: mentions, each trigger with `[` as the neighbour, the joint reading, live owners beside raw shaper and person text, and the round trip per mode, proven red by removing the decode. Applied as drafted. The list is written inline with semicolons, since every bullet in the file is one line.
4. **`testing/tests.md`, a new bullet after it.** This came from the gh harness's first red run: a tool call wrote the escape `\u2060` as the character itself. An invisible character is written as its escape, and a bash harness compares through `jq -a`. Applied, then checked as the user asked:
   - where the bullet names the escape, it holds the six ASCII characters `\`, `u`, `2`, `0`, `6`, `0` (`od -c`);
   - `grep` finds no E2 81 A0 bytes in either standards file, nor in any file this spec touched.

Considered, no edit:

- The trigger regex inside `textParts`: an ordinary temporal-dead-zone fix, stated in the code's own placement and in `plan.md`.
- `priorPosted` and `priorFindings`: naming.
- The implementer's bullet form: covered by item 2.
- The version kept on purpose: `process/release.md`.
- Docs entries: `process/docs-gate.md`.
- No pattern was invented outside `agent-os/standards/`. The mock's opt-in `scenario.summary` and `scenario.mitigation` follow its existing opt-in keys.
