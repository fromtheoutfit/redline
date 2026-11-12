# Standards for PR #89 Review Round 3

The following standards apply to this work. Each is copied as it reads at `0e4a537`, before this round's retrospective: the bullets the round applies, as earlier review rounds did.

---

## testing/tests (excerpt: the bullets this round applies)

# Tests

Seven harnesses, no framework, each runnable alone, and all of them through `.claude/redline/checks.sh --baseline`.

- (line 10) Text the workflow escapes for GitHub is pinned as the escaped string the workflow writes, byte for byte, never as the raw input, with one case per way the reading can go wrong: for the set-aside block, a tag inside a code span, an `&` inside a span beside one outside it (#86, R5-1), a bare tag, a double-backtick span, an unclosed backtick, a backtick left open in the summary that pairs with one in the ref, and each fallback; for #87, an `@` before a letter or a digit, outside a span and inside one, and an email; each trigger of the whole-text rule (`](`, `][`, `://`, `www.` in any case, a carriage return, a backslash), with `[` alone as the neighbour that keeps its spans; two fields that share a line, read as one text; the workflow's own mentions left live, and shaper and person text left raw beside an escaped title; and the round trip: a title as the workflow posts it, read back and posted again, comes out byte for byte the same, one case per mode, proven red by removing the decode at intake; for the #87 follow-up, a `@&#8288;` the finder typed, posted with its `&` escaped and read back as typed (proven red by swapping readBack's order), a strip readBack missed, caught as `&amp;#8288;`, and the post and handoff prompts holding the reference and no raw joiner. The loop test cannot render, so a claim about what GitHub shows is checked once through `gh api markdown -f mode=gfm` on invented text and recorded in the spec (the #85 follow-up spec; #87)
- (line 13) A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site: #42's fix covered nine checks and scripted `'""'` at one, so a revert at the other eight stayed green (#43, R1-1)
- (line 25, its second sentence) A check's name states only what it asserts: #85's result check was named for the round record keeping the dropped entries and the result keeping counts only, asserted neither, and the result keeps the accounting by design, so a change to either stayed green under a name that said otherwise (#86, R2-2)
- (line 28) A bug fix lands red before green: the case that reproduces it is added first and seen to fail, then the fix. For the guard, the new rows alone go through `tests/guard-test.sh <file>` for the red run, which takes seconds, and the whole table for the green one (#54)

---

## process/docs-gate (excerpt: the bullets this round applies)

# Docs gate

Every spec names the README, `docs/` and template changes it needs, so a public reader is never behind the code.

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. `docs/scripts.md` quotes every script's header verbatim, so a change under `scripts/` that touches a header names `docs/scripts.md` in its entry and updates it in the same commit (#14)

---

## process/release (excerpt: the first bullet)

# Release

The plugin's version is the manifest's, every PR moves it, and a release is a person's tag and changelog entry after the merge (#16).

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes (`scripts/checks-template.sh` below its header, a file under `templates/`, an allow entry, the unattended section's body), with the template markers it touches bumped in the same PR; major for a contract change a rerun cannot carry; patch otherwise. The gate's Version step says so, and the Redline reviewer reports a missing bump as a nit (`agents/redline-reviewer.md`, the Version bullet), except in a PR whose spec keeps the version on purpose, as #16 keeps `0.1.0` (#65, R1-1)

---

## workflow/agents (excerpt: line 39, the posted-text sentences R3-3 turns on)

# Agents

- (line 39, from "Every finder and verifier field") ... Every finder and verifier field the review body and the handoff post (the block's lines; finding, For the person, Already tracked and Resolved lines; the summary; the handoff's decision and Earlier rounds lines), and an inline comment's title, go through one function, `postedText`, with fields that share a line read as one text. Outside code spans, `&` then `<` are escaped, and `&#8288;`, the word joiner (U+2060) as a numeric character reference, follows each `@` before an ASCII letter or digit, so no tag ends the block or bolds the body and no `@word` notifies; GitHub decodes it, and outside a code span it shows nothing (the #87 follow-up spec). Spans are read as GitHub pairs backtick runs and left as written, unless the text holds `](`, `][`, `://`, `www.` (any case), a backslash, a carriage return or a newline; such a text is escaped whole. ...

---

## scripts/guard (excerpt: line 6)

# The guard

- Default deny: a command the classifier cannot place is refused. `bash` only as `bash -c <string>`, checked recursively; interpreters (`python3`, `node`, `php -r`), `gh`, `curl`, `eval`, `source` and `sudo` are refused for every role. ...

Applied to the plan: every command given to the implementer is a plain pipeline, with no `$`, no backticks, no process substitution and no interpreter, and the harnesses run only through `.claude/redline/checks.sh`.

---

## prompts/attribution (excerpt)

# Attribution

Redline labels its own work as Redline and never as a model or a vendor.

- `Redline round N` review titles, the `redline:` commit prefix, the `Redline handoff` comment and `decided by: redline` are a tool's name and are allowed everywhere
- No `Co-Authored-By`, no "Generated with", no model or vendor name in a commit message, PR body, review, reply, issue, spec file or standard. ...

---

## process/standards-retrospective

Applied through gate step 12 as the unattended section's point 8 states it: the edits are proposed in `shape.md`, approved by the standards approver, and applied in their own commit, or "Standards retrospective: no changes" is recorded under Decisions. An item that depends on a pending decision (R3-3) is listed as held, and the resolve agent drafts it once the person has decided.
