Redline handoff

Redline ran 2 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 3 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 3 (pr): 0 correctness, 3 nit; 6 commits; spec `agent-os/specs/2026-11-12-1337-89-review-round-3`
- Round 4 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-12-1337-89-review-round-4`

### Earlier rounds

- **R1-1** The 'neutralised twice' half of the round-trip check cannot fail: already handled in round 1: fixed in 6ceb736 (redline: R1-1 drop the round-trip check's joiner clause, which cannot fail, and name the check for what it asserts (#87)). · decided by: redline

### Decisions

- **R3-1** Known limits leaves out the broken link of an inline link whose destination holds `@x`: fixed in 90a1214 · decided by: redline
- **R3-2** No check pins the escaped title on the Deferred line's repository-rule branch: fixed in 6a4e327 · decided by: redline
- **R3-3** Any backslash escapes the whole text, so a namespaced line shows entities in its code spans: The author narrows the whole-text trigger to a backslash directly before a backtick, keeping the carriage return, newline and link triggers, because nine texts rendered on 2026-11-12 through a scratch copy of postedText with the backslash trigger narrowed that way (`gh api markdown`, gfm, this repository as context, nothing posted) showed that no other backslash changed which backticks GitHub paired, that the spans matched textParts one for one and matched the unescaped controls, and that no raw tag or mention came through; the one cosmetic case left, a typed backslash before `<` or `&` outside code showing the entity text (`\<b>` reads `&lt;b>`) as it did before, goes in README Known limits. · decided by: @michaelfromtheoutfit

### For the person

- `workflows/redline-loop.js:939` · Already tracked in #88. A newline or a lone carriage return in a summary, ref, title or For the person text, followed by a code fence at the start of the next line, ends the list and opens a code block at the top level, since CommonMark lets a fence interrupt a paragraph. With no closing fence, the block runs to the end of the body and swallows the set-aside block's `</details>`, Not placed inline and, in the handoff, `### Commits`. I traced this from the CommonMark spec but did not render it. #88's Change asks for a newline rule for posted free text, but its Done when names only the readers (`prior-findings`, `has-review`, `last-round`), so the fence case is worth adding there. The base's blockText kept newlines the same way and For the person lines were posted raw, so this PR removed no guard. The comment above setAsideBlock and docs/running.md:48 claim only that no tag can end the block.
- `workflows/redline-loop.js:951` · readBack decodes only the workflow's `@&#8288;`, `&lt;` and `&amp;`. A title posted raw by 0.2.2 or earlier that holds another entity outside a span (`&gt;`, `&quot;`, `&nbsp;`) is reposted on a fresh 0.2.3 launch as `&amp;gt;`, so the page shows the entity where GitHub used to show the character. Rider (a) and the PR body only talk about `&lt;`, so nothing they claim is false. This needs an old title with a literal entity in it, so it is rare and cosmetic. postedText never writes a bare `&gt;` outside a span, so readBack could decode named entities before `&amp;` and stay an exact inverse for new text.
- `workflows/redline-loop.js:2963` · On the Decisions, Deferred, Left to you and Earlier rounds lines, the title goes through postedText alone and the outcome, mitigation or reply after it stays raw. So if a title leaves a backtick open, GitHub pairs it with the first backtick in that raw text. The title's `&lt;`, `&amp;` and `@&#8288;` then show as entities inside the span, and the raw text's own span breaks. It never leaks: what the title's reading left raw stays inside GitHub's span, and the owner's `decided by: @login` closes the line, so no span can hold it. The #87 spec chose this ('A field before raw text is rendered alone'). The sentence 'Fields that share a line are read as one text' at docs/running.md:137 reads wider than that, and could say it applies to the finder's and the verifier's fields.
- `workflows/redline-loop.js:939` · postedText neutralises only account mentions. A cross-repository reference such as `laravel/framework#51234` in a finder's summary or a verifier's ref still adds a backlink to that issue's timeline from every round's body and from the handoff. That happened before this PR too (the base posted the same text), and same-repository issue numbers are links Redline relies on. New with this PR: a commit reference such as `owner/repo@1a2b3c4` gets the joiner after its `@` and probably loses its link. README Known limits does not list that cost next to the email and bare URL. I did not render it.
- `workflows/redline-loop.js:107` · readBack exists because a fresh launch takes earlier titles from the posted review body. The raw titles, keyed by id, are also in each round's committed record (`<specFolder>/redline/round-<n>-findings.json`). Reading them from there would make the round trip a plain copy, with no inverse to keep in step with postedText. The #87 spec's answer 16 chose the decode at intake and kept `prior-findings` a byte-for-byte reader, and a record is on the branch only after a run pushed it. So this is a design option, not a defect.

### Commits

- 953fa44 redline: save review round 3 spec for PR #89 (#87)
- 90a1214 redline: R3-1 name the inline link's broken href among the costs of neutralised text (#87)
- 6a4e327 redline: R3-2 pin an escaped title on the Deferred line a repository rule leaves to the person (#87)
- 6c4a804 redline: R3-3 narrow the whole-text trigger to a backslash before a backtick (#87)
- 13979c7 redline: record the round 3 review lessons in the standards, finishing R3-3 (#87)
- 370d5d8 redline: record PR #89 round 3 as built (#87)
