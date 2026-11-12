Redline handoff

Redline ran 2 review rounds. The last was a final nit pass over the fix diff only, which found no correctness bugs in the nit fixes. The coverage pass reviewed the whole PR at the head of every round but the final nit pass; see [Known limits](https://github.com/fromtheoutfit/redline/blob/main/README.md#known-limits) in Redline's README.

Resolved 1 thread; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 1 (pr): 0 correctness, 1 nit; 3 commits; spec `agent-os/specs/2026-11-12-1044-89-review-round-1`
- Round 2 (final-nit-pass): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-11-12-1044-89-review-round-2`

### Decisions

- **R1-1** The 'neutralised twice' half of the round-trip check cannot fail: fixed in 6ceb736 · decided by: redline

### For the person

- `workflows/redline-loop.js:930` · The joiner reaches GitHub only if the GitHub agent copies an invisible U+2060 byte for byte into its Write call (postPrompt and finishPrompt give it the review JSON and the handoff as fenced text), and nothing compares the written file with that content. A dropped joiner posts a live mention again, as before #87, with no sign. It cannot be reproduced without running the agent; a grep of a run's `round-<n>-review.json` for the bytes E2 81 A0, or a workflow check of the written file, would show it.
- `workflows/redline-loop.js:107` · Only `title` is decoded at intake. The reviewer's carry list shows it next to `body` (the root comment), whose bold title line is still the escaped form. A reviewer that takes a carried title from `body` gets it escaped twice, and the page shows the entity `&lt;` where the verifier wrote a tag. This is cosmetic and never a leak, the same kind of problem as shape.md's known item about copying from pr-comments (line 108), but it comes through the run's own prompt.
- `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:47` · Decision 9 keeps 0.2.2, which main has carried since #86's merge (b351bd1; the only tags are v0.1.0 and v0.2.1). Its reason is the one agent-os/standards/process/release.md rejects: 'being untagged is no reason for a PR to keep a merged version (#83, R2-1)'. Under the Version rule a spec that keeps the version on purpose is not a finding, so it is yours to confirm, or to bump to 0.2.3 together with the marketplace entry.
- `agent-os/specs/2026-11-12-0948-87-posted-text-mentions-and-escaping/shape.md:230` · This line says the follow-up issue body (#88) carries no attribution, and the plan.md Task 8 draft carries none. But a GitHub `in:body` phrase search for the generated-by trailer the coverage pass quotes returns #88 (and #77, #81, #82, #87), while two control phrases do not match #88. If the posted body carries that trailer, CLAUDE.md's No AI attribution rule says to edit it out. Not confirmed: the reviewer's tools cannot read an issue body.
- `workflows/redline-loop.js:908` · In a round with findings and a set-aside block, the new heading puts the closing note ('Each finding has an inline comment … sits under Not placed inline below …', line 876) under `### Candidates set aside (N)`, so a note about the findings reads as part of that section. Before this PR the note sat under For the person or whatever section came before, so it never had a place of its own. This is a layout question.
- `workflows/redline-loop.js:929` · postedText is applied at each call site (about eleven of them) rather than where the finder's and the verifier's fields enter the workflow. A new line that posts a title or a ref has to remember to wrap it, and no test goes red if it does not. The design works today but may not survive the next posted field.
- `agents/redline-reviewer.md:107` · The sentence about writing `@` identifiers in backticks sits under the `## Attribution` heading, which is about model and vendor names, in the reviewer, shaper and resolve files (plan Task 6 put it there), and in the Rules list in the implementer file. So the four files disagree on where it lives. The loop test pins only the sentence, so moving it costs nothing.

### Candidates set aside in round 1 (2)

<details>
<summary>Collapsed, already tracked or dropped</summary>

- `workflows/redline-loop.js:886` · personLine posts entry.file raw inside a hand-built code span, and the comment calls it 'the workflow's', but for a For the person entry the reviewer supplies the file (and for a set-aside line the finder supplies it); a backtick in it ends the span early and the rest of the line is matched up differently than postedText expected. · disproportionate: This needs a For the person or candidate file path that holds a backtick. The finder and the verifier name repository paths, and no real path holds one. The base's personLine posted the file in the same hand-built span, so no guard was removed. The comment's 'the place is the workflow's' is loose wording: the backticks are the workflow's, the path is the reviewer's or the finder's.
- `workflows/redline-loop.js:107` · Intake does not check that a prior finding's title is a string, and readBack skips non-strings. postedText(undefined) then throws in textParts (`text.matchAll`), so the post stage crashes where the old template literal printed 'undefined'. · disproportionate: This needs an args.priorFindings entry with no string title. prior-findings builds `title` with a jq capture, which always yields a string (scripts/redline-gh.sh:349, 357), and the skill passes that array exactly as printed (skills/redline/SKILL.md step 9). The base's template literal printed 'undefined' without any check, so no guard was removed.

</details>

### Commits

- 8d1adb0 redline: save review round 1 spec for PR #89 (#87)
- 6ceb736 redline: R1-1 drop the round-trip check's joiner clause, which cannot fail, and name the check for what it asserts (#87)
- 515f7a7 redline: record PR #89 round 1 as built (#87)
