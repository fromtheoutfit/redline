# #87 follow-up on PR #89: the joiner as a reference, the closing sentence, version 0.2.3 — Shaping Notes

## Scope

Redline's round 1 on PR #89 (posted 2026-11-12) ended with seven For the person notes. This spec acts on three of them.

- **The raw joiner can be lost.** `postedText` (`workflows/redline-loop.js:930`) puts a raw, invisible U+2060 after each neutralised `@`.
  - The review JSON and the handoff reach GitHub only after the GitHub agent copies them into a file with the Write tool (`postPrompt`, `:1439`; `finishPrompt`, `:1774`).
  - Nothing compares that file with what the workflow wrote, so a dropped character makes the mention live again, with no sign.
- **The version.** The #87 spec kept `0.2.2` on purpose (its decision 9) because it was untagged. `agent-os/standards/process/release.md` rejects that reason.
- **The closing sentence.** "Each finding has an inline comment…" (`:876`) is the body's last line, so since #87 it sits under `### Candidates set aside (N)` and reads as part of that section.

What is built:

- **The neutraliser is the word joiner's numeric character reference, `&#8288;`, which is plain ASCII.** It replaces the raw character in the workflow, in readBack, in the tests and fixtures, and in the docs and standards.
- **The closing sentence moves.** It goes after the last finding list and before For the person.
- **The version is `0.2.3`.**

## Decisions

From the brief (2026-11-12, @michaelfromtheoutfit; not reopened):

1. **The version goes to `0.2.3`** in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
   - This supersedes decision 9 of the #87 spec (`agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:47`). That decision kept `0.2.2` because it was untagged.
   - `agent-os/standards/process/release.md`, bullet 5: "being untagged is no reason for a PR to keep a merged version (#83, R2-1)". main has carried `0.2.2` since #86 merged (`b351bd1`).
   - PR #89 round 1's decision 2 (`agent-os/specs/2026-11-12-1044-89-review-round-1/shape.md:17`) followed decision 9, and is superseded with it.
   - The correction is recorded here, under "Deviations from the #87 spec", as #87 recorded its own supersessions of the #85 follow-up spec. The #87 folder is not edited.
2. **The neutralising form must survive being copied.** One alternative was tested against the renderer before planning: the word joiner as the numeric character reference `&#8288;` after the `@`. The renders were shown before the choice (Evidence; answer 8).
3. **If the reference form works, it replaces the raw character everywhere:** in what the workflow writes, in what readBack strips, in the tests and fixtures, and in the docs and standards. No file in the repository then needs the invisible character.
4. **The closing sentence no longer sits under the "Candidates set aside" heading.** Its place was proposed and asked (answer 9).
5. **Out of scope.** These are recorded under "Seen and left" below:
   - wrapping `postedText` where text enters the workflow, instead of at each call site;
   - the heading the backtick sentence sits under in each agent file;
   - a carried title escaped twice when a reviewer copies it from a comment body.
6. **Untouched.**
   - `scripts/redline-guard.sh` and `hooks/hooks.json` are not touched.
   - `coverage off` prompts stay byte-identical.
   - There is no prompt change unless the work needs one, in which case stop and ask. None was needed (see the shaping defaults).
7. **The PR description.** The changed lines are drafted in `plan.md` for the user to paste. The PR is not edited.

Asked at shaping (2026-11-12, one at a time), answered by @michaelfromtheoutfit:

8. **The form is the reference `&#8288;`.** It replaces U+2060 everywhere, in all the places decision 3 names.
   - Rider (a): after the change, a byte search for E2 81 A0 confirms that no file in the repository holds the raw character.
   - Rider (b): the tests standard's bullet on invisible characters (`agent-os/standards/testing/tests.md:11`) stays, since the lesson still stands.
   - Not chosen:
     - Skipping the joiner for an `@` inside a bare URL. The autolink already stops that mention, but skipping it needs a model of where GitHub ends an autolink, and a wrong model makes a mention live.
     - Keeping the raw character and adding a check that refuses to post when the written file lost one. That would change the GitHub agent's prompt or `redline-gh.sh post-review`.
9. **The closing sentence goes after the last of the finding lists,** whichever of Findings, Carried forward, Resolved and Already tracked the round has, and before For the person. Its wording is unchanged.
   - Rider: confirm that no reader in `redline-gh.sh` depends on where the sentence sits. Confirmed by reading the script:
     - `prior-findings` reads finding lines by regex, whatever heading they sit under (`:333-334`);
     - `has-review` and `last-round` grep `^Redline round N` (`:305`, `:315`);
     - `last-human-review` greps `^Redline human review N` in comments (`:440`);
     - `human-review` reads prefixes and markers;
     - `place` appends `### Not placed inline` after the whole body (`:220`).
   - No script, skill or agent file names the sentence (grep for "Each finding has", "placed inline below" and "inline comment with the detail"). The other "closing sentence" in the workflow (`:1221`) is about the reviewer's prompt, not the body.

Shaping defaults (recorded, not asked; shown in the plan and approved with it):

- **readBack strips only `@&#8288;`, with no fallback for the raw character.** No posted title holds it.
  - The raw form has never been on main, so only a run that loaded this branch could post it. PR #89's rounds 1 and 2 are the runs this repository records, and neither posted a finding title with an `@`. Round 1's only finding, R1-1, is titled "The 'neutralised twice' half of the round-trip check cannot fail"; round 2 had none.
  - If such a title were read back, `@` followed by U+2060 would post again as it is: `postedText` adds a reference only before an ASCII letter or digit, so the mention stays neutral.
- **The loop test's "escaped twice" check gains `&amp;#8288;`.**
  - With the reference, a strip readBack missed shows in the posted text: the reference's `&` is escaped again. So the check can now catch a missing strip.
  - R1-1 dropped the old joiner clause because that clause could never fail. This one can, and the mutation proof shows it (see "As built" in `plan.md`).
  - The comment above the check is reworded to match.
- **The post and finish prompts' instructions do not change.** The review JSON and the handoff they carry do change, through the reference form and the sentence's place.
  - That is data, not prompt text, as the #87 PR said of its own escaping.
  - The replay checks and the `coverage off` identity checks compare prompts within one run and across a relaunch, so they stay green.
- **The commits** are grouped as `plan.md` lists them. The user makes each one.

Deviations from the shaped plan, as built (gate step 13; the detail is in `plan.md`, "As built"):

- **A third pin re-pinned.** Task 3 named two pins of the closing sentence. A third, the §15 check that the block opens under its own heading with no For the person entries, pinned the block directly under the findings. It went red after the move and now pins the sentence between them.
- **Two test constants.** The loop test gained `RAW_WJ`, the raw character written as its JavaScript escape for the ASCII-prompt check, and `CLOSING`, the sentence.

## Evidence

All renders used `gh api markdown -f mode=gfm -f context=fromtheoutfit/redline` on invented text, on 2026-11-12, before planning. The text went through standard input, and nothing was posted. The control was `@octocat`, never a teammate's login.

Each case was rendered twice:

- as `postedText` would write it with the reference (`@&#8288;`);
- with today's raw U+2060 (shown below as `[WJ]`, the raw character in the returned HTML).

| Case, as posted | `@&#8288;` renders | Raw U+2060 renders |
|---|---|---|
| plain `Binds @&#8288;click to x` | `@[WJ]click`, no mention | same |
| after `(`: `(@&#8288;click)` | text, no mention | same |
| `**@&#8288;click**` and `_@&#8288;click_` | `<strong>@[WJ]click</strong>`, `<em>…</em>`, no mention | same |
| a path: `path/@&#8288;click` | text, no mention | same |
| a digit: `@&#8288;123` | text, no mention | same |
| an email: `a@&#8288;param.com` | text, no mailto link | same |
| `@@&#8288;click`, `@&#8288;click.`, `@&#8288;click's`, `@&#8288;click,`, a team `@&#8288;github/docs` | text, no mention | same |
| link text: `[ask @&#8288;click](https://example.com)` | a link reading `ask @[WJ]click` | same |
| link destination: `[a](https://x.com/@&#8288;click)` | href `https://x.com/@%E2%81%A0click` | same |
| a set-aside line inside `<details>` | `@[WJ]param`, no mention | same |
| a code span in a text escaped whole (the trigger `://`, and a backslash): `` `@&#8288;param` `` | `<code>@&amp;#8288;param</code>`: the page shows `@&#8288;param` | `<code>@[WJ]param</code>` |
| a bare URL: `https://medium.com/@&#8288;click/post`, `www.x.com/@&#8288;click` | the link text shows `@&#8288;click`, and the href holds the literal reference (`@&amp;#8288;` in the HTML) | the text is clean; the href gets `%E2%81%A0` |
| control: `@octocat, over to you for the human review.` | a live user mention | a live user mention |

- **Outside code, the reference behaves exactly as the raw character does.** GitHub decodes it before its mention filter runs. So copying from the page still carries U+2060, as README Known limits says.
- **The reference shows in two places GitHub does not decode it:**
  - a code span in a text escaped whole, a mode that already shows `&amp;` and `&lt;`;
  - a bare autolink.
- **A raw `@` inside a bare URL is never a mention.** `https://medium.com/@click/post` and `www.x.com/@click` rendered as plain links, because the autolink takes the `@` before the mention filter runs. By contrast, `https://x.com/a @click b` mentions, since the space ends the link. So the reference protects nothing inside a URL, and in both forms it breaks the link.
- **The inverse becomes exact.**
  - `postedText` escapes every typed `&` before it adds `&#8288;`, so each `&#8288;` in a posted text was added after an `@`.
  - readBack strips `@&#8288;`, then decodes `&lt;`, then `&amp;`. So `readBack(postedText(x)) === x` for every x.
  - A typed `@&#8288;x` posts as `@&amp;#8288;x` and reads back as typed. This removes the exception in #87's Round trip ("except for a word joiner x already held after an `@`").
  - `&#8288;` adds no backtick and none of the trigger characters (`](`, `][`, `://`, `www.`, CR, LF, `\`). So `textParts` splits a posted text exactly as it split the raw one, as before.

## Seen and left

Round 1's other For the person notes, recorded as decision 5 says:

- **`workflows/redline-loop.js:929`: `postedText` at each call site.** It is applied at about eleven call sites, not where the finder's and the verifier's fields enter the workflow. So a new posted line must remember to wrap. Left by decision 5.
- **`agents/redline-reviewer.md:107`: the backtick sentence's heading.** The sentence sits under `## Attribution` in the reviewer, shaper and resolve files, and in the Rules list in the implementer file. Left by decision 5.
- **`workflows/redline-loop.js:107`: a carried title copied from `body`.** A reviewer that copies a carried title from a prior finding's `body`, the root comment whose bold title line is still escaped, gets it escaped twice, which shows an entity. This is cosmetic and never a leak. Left by decision 5. It is the same kind of problem as #87's known item about copying from `pr-comments`.
- **#87's `shape.md:230`: the #88 body.** It was checked with `gh issue view 88`, and the body carries no attribution. The hit the reviewer reported was GitHub's `in:body` phrase search, not the body. Nothing to do.

## Context

- **Visuals:** None.
- **References:** see `references.md`.
- **Product alignment:** `agent-os/product/mission.md`, "Honest about its reach". README Known limits names the reference's two visible costs beside the one it keeps. No conflict, no mission edit.

## Standards Applied

- `testing/tests`:
  - escaped text is pinned as the string the workflow writes, with one case per way the reading can go wrong (the typed `@&#8288;`, the ASCII post prompt);
  - red before green;
  - an invisible character is written as its escape in test source (bullet 11, kept by answer 8);
  - a check's name states only what it asserts.
- `workflow/agents`: the #85 bullet's sentence on the word joiner, which this spec changes (retrospective).
- `workflow/replay`: no prompt text changes, and `coverage off` prompts stay byte-identical.
- `process/docs-gate`: a Docs entry per touched plugin file.
- `process/release`: the patch bump to `0.2.3`, superseding #87's decision 9.
- `process/standards-retrospective`: gate step 12.
- `prompts/attribution`: no model or vendor name anywhere, the PR description lines included.

## Deviations from the #87 spec

- **Decision 9** (the version stays `0.2.2`) is superseded by decision 1 here, and so is PR #89 round 1's decision 2, which followed it.
- **Answer 14's form** (a raw U+2060 after the `@`) is superseded by answer 8. So is its rider that every reader strips U+2060: readBack strips `@&#8288;` instead.
- **The Round trip's exception** "`readBack(postedText(x)) === x` except for a word joiner x already held after an `@`" no longer holds. The inverse is exact for every text (Evidence).
- **The README Known limits costs** "an email address or a bare URL holding `@x` keeps its text but loses its link" and "a code span holding `<` or `&`" are restated for the reference: a bare URL shows `&#8288;`, and a span in a text escaped whole shows `@&#8288;x`.

## Standards retrospective

Listed mechanically (gate step 12) from three sources: the Decisions and defaults above, the As built deviations in `plan.md`, and the checks that went red. Presented one at a time on 2026-11-12, approved by @michaelfromtheoutfit, and applied for their own commit:

1. **`workflow/agents.md`, line 38, the #85 bullet.** "A word joiner (U+2060) follows each `@`" contradicted answer 8. It now names `&#8288;`, the word joiner as a numeric character reference, which GitHub decodes. The intake sentence now says readBack strips the workflow's `@&#8288;` before it decodes, so a reference the finder typed reads back as typed. Applied as drafted.
2. **`workflow/agents.md`, a new bullet after line 17.** The lesson this spec turned on was missing. A body the GitHub agent writes byte for byte holds no invisible character the post depends on, since nothing compares its file with the workflow's text. Such a character is written as a numeric character reference GitHub decodes, and the loop test's ASCII-prompt check enforces it. Applied as drafted.
3. **`testing/tests.md`, line 10, the escaped-text case list.** It gains three of this spec's cases: the typed `@&#8288;` read back as typed (proven red by swapping readBack's order), a missed strip caught as `&amp;#8288;`, and the post and handoff prompts holding the reference and no raw joiner. Applied as drafted, inline with semicolons like the rest of the list.

Considered, no edit:

- `testing/tests.md`, line 11: an invisible character in a test is written as its escape. Kept as it reads, per answer 8, rider (b). `RAW_WJ` follows it.
- The version: `process/release.md`, bullet 5, already says that being untagged is no reason to keep a merged version. Decision 1 applies it.
- The closing sentence's place: no standard describes the review body's layout below the set-aside block, and the code comment names answer 9.
- The third pin (deviation 1): covered by `testing/tests.md`'s rule that escaped text is pinned as the string the workflow writes. The pin held the old layout, which is that rule working.
- No pattern was invented outside `agent-os/standards/`. The two test constants follow the existing `WJ`.
