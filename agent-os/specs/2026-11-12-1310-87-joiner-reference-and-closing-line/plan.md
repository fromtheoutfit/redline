# #87 follow-up on PR #89: the joiner as a reference, the closing sentence, version 0.2.3

Spec folder: `agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/`

## Context

Redline's round 1 on PR #89 had seven For the person notes. This spec acts on three of them:

1. **The raw joiner can be lost.** `postedText` (`workflows/redline-loop.js:930`) inserts a raw, invisible U+2060 after each neutralised `@`.
   - The body reaches GitHub only after the GitHub agent copies it with the Write tool (`postPrompt` `:1439`, `finishPrompt` `:1774`).
   - Nothing checks the copy, so a dropped character makes a mention live again.
2. **The version is 0.2.2.** The #87 spec's decision 9 kept it because it was untagged. `agent-os/standards/process/release.md`, bullet 5, rejects that reason: "being untagged is no reason for a PR to keep a merged version (#83, R2-1)". main has carried 0.2.2 since #86 merged (`b351bd1`).
3. **The closing sentence reads as part of the block.** It starts "Each finding has an inline comment…" (`:876`), and it now sits under `### Candidates set aside (N)`.

The outcome:

- The neutraliser becomes plain ASCII, `&#8288;`, and no file in the repository holds the invisible character.
- The closing sentence sits with the findings.
- The version is 0.2.3.

The user makes every commit, and the tree is left uncommitted.

## Decisions

From the brief (2026-11-12, @michaelfromtheoutfit, not reopened):

1. **Version 0.2.3** in `plugin.json` and `marketplace.json`.
   - This supersedes the #87 spec's decision 9, and so also PR #89 round 1's decision 2, which followed it.
   - The correction is recorded in this spec, as #87 recorded its supersessions of the #85 follow-up spec. The #87 folder is not edited.
2. **The neutraliser must survive being copied.** The `&#8288;` form was tested against the renderer before planning (Evidence below).
3. **If the reference works, it replaces the raw character everywhere:** the workflow, readBack, the tests, the fixtures, the docs and the standards.
4. **The closing sentence moves.** Where it goes was proposed and asked (answer 9).
5. **Out of scope, seen and left** (recorded in shape.md):
   - wrapping `postedText` where text enters the workflow, instead of at each call site (For the person note on `:929`);
   - the heading the backtick sentence sits under in each agent file (note on `agents/redline-reviewer.md:107`);
   - a carried title escaped twice when a reviewer copies it from a comment `body` (note on `:107`).
6. **Untouched:** `scripts/redline-guard.sh` and `hooks/hooks.json`. `coverage off` prompts stay byte-identical, and there is no prompt change unless the work needs one.
7. **The PR description:** the changed lines are drafted below, and the PR is not edited.

Asked at shaping, one at a time:

8. **Form: the reference `&#8288;`.** It replaces U+2060 everywhere.
   - Rider: after the change, a byte search (E2 81 A0) confirms that no file in the repository holds the raw character.
   - Rider: the tests standard's bullet on invisible characters (`testing/tests.md:11`) stays, since the lesson still stands.
9. **Closing sentence: after the last of the finding lists** (Findings, Carried forward, Resolved, Already tracked, whichever the round has), before For the person.
   - Rider: confirm that no reader in `redline-gh.sh` depends on where the sentence sits. Confirmed by reading the script:
     - `prior-findings` reads finding lines by regex under any heading (`:333-334`);
     - `has-review` and `last-round` grep `^Redline round N` (`:305`, `:315`);
     - `last-human-review` reads comments (`:440`);
     - `human-review` reads markers;
     - `place` appends `### Not placed inline` at the end (`:220`);
     - no script, skill or agent file names the sentence.
     - The other "closing sentence" in the workflow (`:1221`) is about the reviewer prompt, not the body.

Shaping defaults (recorded, shown here for approval):

- **readBack strips only `@&#8288;`.** No posted title holds the raw character:
  - the raw form has never been on main, so only a run that loaded this branch could post it;
  - PR #89 rounds 1 and 2 are those runs, and neither posted a finding title with an `@`.

  If one were read back, `@` followed by U+2060 posts again as it is. `postedText` adds nothing before a non-letter, so the mention stays neutral.
- **The "escaped twice" check gains `&amp;#8288;`** (`tests/loop-test.mjs:1772`).
  - With the reference, a strip that readBack missed is visible: the reference's `&` is escaped again.
  - So the check can now catch it. R1-1 dropped the old joiner clause because that clause could never fail, and this one can.
  - The comment at `:1770-1771` is reworded to match.
- **The prompts.** The post and finish prompts' instructions do not change. The review JSON and the handoff they carry change: the reference form, and the sentence's place.
  - That is data, not prompt text, as the #87 PR said of its own escaping.
  - The replay and `coverage off` checks compare prompts within one run, so they stay green.
- **The #88 note** (`shape.md:230` of #87) was checked. `gh issue view 88` shows no attribution in its body, so the search hit was GitHub's phrase search. It is recorded, and nothing is done.

## Evidence

All renders used `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline` on invented text, on 2026-11-12. Nothing was posted. Each case was rendered twice, as `@&#8288;` and as the raw U+2060 (shown here as `[WJ]`).

| Case | `@&#8288;` renders | Raw renders |
|---|---|---|
| plain, after `(`, `**…**`, `_…_`, a path, a digit, `@@x`, `@x.`/`'s`/`,`, a team `@x/y` | `@[WJ]x`, no mention | same |
| email `a@&#8288;param.com` | text, no mailto | same |
| link text `[ask @&#8288;x](…)` | `ask @[WJ]x` | same |
| link destination | href `@%E2%81%A0x` | same |
| set-aside line inside `<details>` | `@[WJ]param`, no mention | same |
| code span, text escaped whole | `<code>@&amp;#8288;param</code>`: the page shows `@&#8288;param` | `@[WJ]param` |
| bare URL `https://medium.com/@&#8288;x/post`, `www.x.com/@&#8288;x` | link text and href hold the literal `&#8288;` | text clean, href `%E2%81%A0` |
| control `@octocat, over to you…` | live mention | live mention |

- A raw `https://medium.com/@click/post` and `www.x.com/@click` are **not** mentions, because the autolink takes the `@` first. So the joiner protects nothing in a URL, and it breaks the link in both forms.
- GitHub decodes the reference before its mention filter runs. Copying from the page therefore still carries U+2060.
- **The inverse becomes exact.** `postedText` escapes a typed `&` before it adds `&#8288;`, so every `&#8288;` in posted text was added after an `@`. readBack strips `@&#8288;`, then decodes `&lt;`, then `&amp;`, and `readBack(postedText(x)) === x` for every x. That removes #87's one exception, a joiner already in x.
  - `&#8288;` adds no backtick and no trigger character, so `textParts` splits a posted text exactly as it split the raw one.

## Task 1: Save spec documentation

Create the folder above with:

- `plan.md`: this plan.
- `shape.md`:
  - Scope, Decisions 1 to 9 and the defaults, Evidence;
  - **Deviations from the #87 spec:** its decision 9 is superseded (decision 1). Its answer 14's raw form and rider are superseded (answer 8). Its Round trip "except for a word joiner" is now exact;
  - **Seen and left:** decision 5's three items, and the #88 note;
  - Context: Visuals none; References; Product alignment with `agent-os/product/mission.md`, "Honest about its reach": Known limits names the new costs;
  - Standards Applied.
- `standards.md`: `testing/tests`, `workflow/agents`, `workflow/replay`, `process/docs-gate`, `process/release`, `process/standards-retrospective`, `prompts/attribution`, as they read today.
- `references.md`, citing:
  - `postedText`/`readBack`/`textParts` (`redline-loop.js:919-970`);
  - `reviewBody` (`:832-879`);
  - `postPrompt` (`:1431`) and `finishPrompt` (`:1760`);
  - the intake (`:101-107`);
  - `redline-gh.sh` `place_comments` (`:206-225`) and `prior-findings` (`:318-366`);
  - `tests/loop-test.mjs` §15 (`:1582-1654`) and §16 (`:1702-1798`);
  - `tests/gh-test.sh:236-248` and `tests/gh-fixtures/{reviews,comments}-15.json`;
  - the #87 spec folder and PR #89 round 1's folder.

Write U+2060 as words in every spec file, never as the escape typed into a tool call (memory: tool params decode the escape).

## Task 2: The reference form

**`workflows/redline-loop.js`:**

- `postedText` (`:930`): the joiner replacement becomes `'@&#8288;'`. It stays last, after `&` and `<`.
- `readBack` (`:939`): strip `/@&#8288;/g` to `@` first, then decode `&lt;`, then `&amp;`.
- The literals stay inline. A top-level `const` would sit in its temporal dead zone when the intake calls `readBack` (#87's As built).
- Rewrite both docblocks (`:919-928`, `:933-937`):
  - the reference, and why it is ASCII: the GitHub agent's Write copies it visibly;
  - GitHub shows it as U+2060;
  - the inverse is exact;
  - the two costs.

**`tests/loop-test.mjs`**, red first against today's workflow:

- `WJ` (`:36`) becomes `'&#8288;'`, with its comment reworded. Every existing pin then expects the reference: §12 `:1030`, §15 lines 8, 13 and 15, the For the person line, §16 and the modes.
- Update the §15 comment (`:1582-1592`).
- New block candidate: a summary holding a typed `@&#8288;x` posts `@&amp;#8288;x`.
- The same text added to the round-trip `modes` (`:1776`) posts back unchanged.
- New check: in the §16 round trip, a prior title holding `@&amp;#8288;x` reaches the reviewer prompt as `@&#8288;x`. This pins readBack's order.
- New check: the `post r1` prompt and the `handoff comment` prompt hold `@&#8288;` and no U+2060. The test source writes U+2060 as its JavaScript escape. This pins decision 2: what the agent copies is ASCII.
- `:1772` gains `t.includes('&amp;#8288;')`, with its comment reworded (default above).
- **Mutation proof:** with the `@&#8288;` strip removed from readBack, the carry-list check (`:1760`) and the extended `:1772` check go red. Record the counts.

**`tests/gh-test.sh` and its fixtures:**

- Expected strings first, then the fixtures, so the first run is red:
  - `:244` and `:246` expect `Binds @&#8288;click to &lt;b> &amp; more`;
  - `reviews-15.json` and `comments-15.json` change the joiner's JSON escape to `&#8288;`.
- `jq -a` stays, so a stray raw character would print as its escape and fail the match.
- The comments at `:30` and `:236-240` are reworded.

## Task 3: The closing sentence

**`workflows/redline-loop.js` `reviewBody`:** move the `if (active.length)` push (`:875-877`) to just before `const forThePerson` (`:867`). It then follows the last of Findings, Carried forward, Resolved and Already tracked, and the For the person list and the block come after it. The wording is unchanged.

**`tests/loop-test.mjs`:**

- Re-pin `:1316`: the finding list, then the sentence, then `### For the person\n\n- \`app/y.php:9\` · a nit for the person`.
- Re-pin `:1550`: For the person, then the block, and the body ends at `</details>`.
- New check in the §16 first run (Findings, Already tracked, For the person): the sentence sits after the Already tracked line and before `### For the person`.
- New check in the §16 round-trip run (Carried forward, Resolved, Already tracked; no For the person): the sentence is the last line, after Already tracked.
- The no-inline check (`:497`) stays green.

## Task 4: Version 0.2.3

- `.claude-plugin/plugin.json` and the entry in `.claude-plugin/marketplace.json` go from `0.2.2` to `0.2.3`.
- It is a patch bump: nothing a setup rerun writes changes (no template, `checks-template.sh`, allow entry or unattended body).
- The setup test's last cases prove the two agree.

## Task 5: Docs

- **`docs/running.md`, "How the review is posted", the "What is escaped and neutralised" bullet:**
  - `:135`: `&#8288;`, the word joiner's reference, goes after each `@`. GitHub shows it as the invisible U+2060. It is plain ASCII, so the body the GitHub agent writes keeps it visibly.
  - `:137`: a span in a text escaped whole shows `@&#8288;x` too.
  - `:144`: the `&#8288;` after `@` is removed at launch.
- **`README.md`, Known limits, the costs list (`:105-107`):**
  - copying from the page still carries U+2060 (unchanged);
  - an email holding `@x` loses its link, and a bare URL holding `@x` shows `&#8288;` and its link breaks, though an `@` in a URL is never a mention;
  - in a text escaped whole, a code span holding `<`, `&` or `@x` shows the entity.

**Docs entries (gate step 10):**

| File | Where it is described |
|---|---|
| `workflows/redline-loop.js` (form) | running.md "How the review is posted", README Known limits |
| `workflows/redline-loop.js` (sentence) | no reader-facing change: no doc names the sentence's place (grep) |
| `.claude-plugin/plugin.json`, `marketplace.json` | no reader-facing change: only the version |
| tests and fixtures | outside the gate's list |

## Task 6: Verification Gate

- Run `.claude/redline/checks.sh --baseline` until it exits 0. Record each harness's red run and the mutation counts.
- **Byte search (answer 8):** `LC_ALL=C grep -rl $'\xe2\x81\xa0' . --exclude-dir=.git` prints nothing. It printed nothing before the change too, since the source wrote the JavaScript escape.
- **Renderer check:** render the pinned strings once (the block lines, a finding line, For the person, the summary, a Decisions line ending `decided by: @octocat`, and `@octocat, over to you…`), with nothing posted. Record:
  - only the two `@octocat` mentions;
  - one `<details>`;
  - the closing sentence above For the person;
  - the costs where documented.
- **Step 10:** each Docs entry names its commit or its reason.
- **Step 11:** 0.2.3 in both files.
- **Step 12, standards retrospective,** asked one item at a time. Expected items:
  1. `workflow/agents.md:38`: "a word joiner (U+2060) follows each `@`" is now wrong. It becomes the reference, and why.
  2. Possibly new, in `workflow/agents.md`: a text the workflow hands an agent to write byte for byte carries no invisible character with meaning. A neutraliser is a numeric character reference GitHub decodes, since nothing compares the agent's file with the workflow's text.
  3. `testing/tests.md:10`: the case list gains the typed `@&#8288;` round trip and the ASCII post prompt.
  4. `testing/tests.md:11` is kept, as answer 8 says.
  5. `process/release.md` bullet 5 already covers the version: no edit.
- **Step 13:** `plan.md` As built, with deviations under Decisions in shape.md.

Files per intended commit, never staged:

1. the spec folder;
2. Task 2;
3. Task 3;
4. Task 4;
5. Task 5;
6. the standards.

## PR #89 description: changed lines to paste

- **What lands → One function for posted text,** replacing the sentence "A word joiner (U+2060) goes after every `@` … The visible text is unchanged.":
  > `&#8288;`, the word joiner's character reference, goes after every `@` that comes before an ASCII letter or digit. It is plain ASCII, so the body the GitHub agent writes with the Write tool keeps it where anyone can see it. GitHub shows it as the invisible word joiner (U+2060), so outside a code span the text reads as written.
- **The round trip,** appended:
  > The inverse is exact for every text: a `@&#8288;` the finder typed posts as `@&amp;#8288;` and reads back as typed.
- **A heading for the block,** appended:
  > The closing sentence ("Each finding has an inline comment…") moves from after the block to after the last finding list (Findings, Carried forward, Resolved or Already tracked), before For the person.
- **Tests,** two sub-bullets appended:
  > `tests/loop-test.mjs` pins the reference form everywhere. It checks that the post and handoff prompts hold no raw U+2060, adds a typed `@&#8288;` case and its round trip, and catches a missed strip as `&amp;#8288;`.
  >
  > `tests/gh-test.sh`: PR 15's fixtures hold the reference.
- **The spec folder,** with the new one added:
  > `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/` and the follow-up `agent-os/specs/2026-11-12-1310-87-joiner-reference-and-closing-line/`.
- **Gate,** replacing its count sentence and red-run list:
  > `.claude/redline/checks.sh --baseline` exits 0. The loop test passes 676 checks with 0 failed, and the gh harness 121 with 0 failed. The follow-up's red runs:
  >
  > - against the raw-joiner workflow its new pins gave 650 passed, 24 failed;
  > - readBack without the reference strip gave 666 passed, 8 failed, and with its decode order swapped 672 passed, 2 failed;
  > - the closing sentence's pins against the old layout gave 673 passed, 3 failed;
  > - the gh harness against the old fixtures gave 119 passed, 2 failed.
- **Renderer check,** appended:
  > The follow-up rendered each mention case as `@&#8288;` beside the raw joiner. They behaved the same outside code. A span in a text escaped whole, and a bare URL, show the reference.
- **Version,** replacing the whole bullet:
  > **Version:** 0.2.3. main has carried 0.2.2 since #86 merged, and `process/release.md` says that being untagged is no reason to keep a merged version (#83, R2-1). This corrects the #87 spec's decision 9.
- **Known costs,** replacing the second and third items:
  > an email address holding `@x` keeps its text but loses its link, and a bare URL holding `@x` shows `&#8288;` after the `@` and its link breaks;
  >
  > in a text escaped whole, a code span holding `<`, `&` or `@x`, or a backslash before `<` or `&`, shows the entity (`&lt;`, `&amp;`, `@&#8288;x`).
- **Out of scope,** one item added:
  > the round 1 notes left for later: `postedText` at each call site, the heading of the agent files' backtick sentence, and a title copied from a comment `body`.

## As built

**Files:**

- `workflows/redline-loop.js`:
  - `postedText` writes `@&#8288;`, and `readBack` strips `@&#8288;` before it decodes `&lt;` and `&amp;`. Both docblocks are rewritten.
  - `reviewBody` pushes the closing sentence after Already tracked and before For the person, under a comment naming answer 9.
- `tests/loop-test.mjs`:
  - `WJ` is `&#8288;`;
  - new constants: `RAW_WJ`, the raw character as its JavaScript escape, and `CLOSING`, the sentence;
  - four checks for the form: block line 17, the ASCII post and handoff prompts, round trip 11, and the typed reference reaching the reviewer as typed;
  - the "escaped twice" check gains `&amp;#8288;`;
  - three new checks for the sentence's place, and three re-pinned.
- `tests/gh-test.sh`, `tests/gh-fixtures/reviews-15.json` and `comments-15.json`: the reference, with the two comments reworded.
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: `0.2.3`.
- `docs/running.md`, "How the review is posted": the "What is escaped and neutralised" bullet.
- `README.md`, Known limits: the costs list.
- Not touched: `scripts/redline-guard.sh`, `hooks/hooks.json`, `scripts/redline-gh.sh`, `agents/`, `skills/`, `templates/` and `.claude/redline/`.

**Red before green:**

- **Loop test, Task 2.** The new cases against today's workflow gave 650 passed, 24 failed. Every failure was a pin that now expects the reference.
  - Three new checks passed against it: block line 17, round trip 11, and the typed reference reaching the reviewer. They pin readBack's order, which the raw form already had, so the mutations below are their red runs.
  - Green: 674 passed, 0 failed.
- **Mutations, Task 2,** each in a scratch copy of the tree:
  - readBack with no `@&#8288;` strip: 666 passed, 8 failed. Among the failures are the carry-list check and the extended "escaped twice" check. Under the raw form, the same mutation turned only the carry-list check red.
  - readBack decoding `&amp;` before it strips the reference: 672 passed, 2 failed (round trip 11, and the typed reference).
- **Loop test, Task 3.** The re-pins and new checks against the unmoved sentence gave 673 passed, 3 failed. The fourth new check passed: a body with no For the person ends with the sentence in both layouts, and it is the neighbour that must not change.
  - After the move, the result was 675 passed, 1 failed. A third pin held the old layout (deviation 1), and once re-pinned the run gave 676 passed, 0 failed.
- **Gh harness.** The expected strings, changed first, gave 119 passed, 2 failed against the old fixtures, with `jq -a` printing the old joiner as its escape. With the fixtures changed: 121 passed, 0 failed.

**Byte search (answer 8, rider a).** `LC_ALL=C grep -rl` for the bytes E2 81 A0 over the repository, `.git` excluded, printed nothing (exit 1).

**Renderer check.** The pinned strings went into one body:

- the summary, a finding line and an Already tracked line;
- the closing sentence, For the person, and the 17 set-aside lines with the lone CR;
- a Decisions line ending `decided by: @octocat`, and `@octocat, over to you for the human review.`

It was rendered with `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline` (2026-11-12). Nothing was posted. The result:

- Exactly two user-mention links, both to `octocat`.
- One `<details>` and one `</details>`.
- Nine `@` + U+2060 in the HTML: every reference outside code, decoded.
- The closing sentence renders between the Already tracked list and `### For the person`.
- The costs showed where documented. The `](` line's span shows `@&#8288;param`, and the typed `@&amp;#8288;x` shows `@&#8288;x`, as typed. The CR renders as `<br>`.
- The only raw tag was the `<s>` in the Decisions line's restatement. That is the person's text, posted as written by design (the #87 spec's answer 17), and the pin copied here holds it on purpose.

**Gate (2026-11-12).** `.claude/redline/checks.sh --baseline` exited 0, `ok: true`. Every check exited 0:

| Check | Result |
|---|---|
| syntax | exit 0 |
| validate | passed with two warnings, neither from this change: the known icon warning, and "CLAUDE.md at the plugin root is not loaded as project context" |
| guard | 592 passed, 0 mismatched |
| loop | 676 passed, 0 failed |
| prefs | 101 passed, 0 failed |
| gate | 117 passed, 0 failed |
| setup | 468 passed, 0 failed |
| gh | 121 passed, 0 failed |
| background | 39 passed, 0 failed |

**Docs (step 10):**

| File | Entry |
|---|---|
| `workflows/redline-loop.js`, the form | `docs/running.md`, "How the review is posted": the "What is escaped and neutralised" bullet; `README.md`, Known limits: the costs list. In the docs commit |
| `workflows/redline-loop.js`, the sentence | no reader-facing change: no doc names the sentence's place (grep for "Each finding has", "placed inline below" and "inline comment with the detail" over `docs/`, the README, the skills and the agents) |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | no reader-facing change: only the version |
| tests and fixtures | outside the step's list |

**Version (step 11).** `0.2.3` in both files.

**Deviations from the shaped plan** (recorded under Decisions in `shape.md`):

1. **A third pin re-pinned.** Task 3 named the pins at `:1316` and `:1550`. A third, "with no For the person entries the set-aside block still opens under its own heading, after the findings" (§15), pinned the block directly under the findings. It now pins the closing sentence between them, and its name says so.
2. **Two test constants.** `RAW_WJ` holds the raw character as its JavaScript escape, for the ASCII-prompt check. `CLOSING` holds the sentence, for the six checks that place it. Neither puts the character in the file.
3. **One code commit for the reference form and the closing sentence.** It replaces the plan's commits 2 and 3, because both change `workflows/redline-loop.js` and `tests/loop-test.mjs` and share a hunk. Decided by: @michaelfromtheoutfit
