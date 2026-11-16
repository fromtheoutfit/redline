# Standards for PR #94 Review Round 3

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `dae81d4`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 11 (part):

- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), `decided by: redline (autopilot)`, or `decided by: @<reviewer login>` for a change a teammate's review asked for and a human review pass made as asked (#36). A decision Redline makes alone carries its reason beside its owner, in the thread and in the handoff, so the person can audit it and overrule it without a new stop: a typed line at a stop the run already makes in that round, or a reply in the thread and a human review pass over their own login (#93). [...]

Line 16 (part):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule (`not raised again`, `raises it again`): #93's decline reopening reached the candidates block and the handled-list header and left the agent file's "is not raised again", the history header, the README's Known limits and `docs/running.md` unconditional until #94, R1-1 [...]

Line 17 (whole):

- An agent whose words reach GitHub in a comment or a reply says so in its file. The reviewer, the shaper, the resolve agent and the implementer each carry the sentence: 'An identifier that begins with `@` (a decorator, a directive, a docblock tag) is always written in backticks, because a bare `@word` notifies a GitHub account.' The loop test pins it in each file. The workflow neutralises the finder's and the verifier's short fields itself, but a comment's description, a reply, a mitigation or a commit subject is posted as written. The GitHub agent writes none of its own text, so its file does not carry the sentence. A new role whose text is posted gains it too (#87).

Line 36 (part):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call [...], a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93): the shaper's output schema is built per pass, so its enums are that pass's dispositions [...] and that pass's reasons and the rule reasons (#94, R2-3) [...]

Line 38 (part, the coverage-pass bullet):

- [...] A candidate the verifier left out, gave an unknown outcome, or accounted for with a ref that names no finding becomes a finding of the round as reported (a new id, `correctness`, `unconfirmed`), with a warning, at `(no file)`, line 0, when the finder gave no file, so `redline-gh.sh prior-findings` reads its line back (#94, R2-6), the mirror of carry-forward, so nothing is dropped and nothing is parked; a carried finding the verifier left out is carried as `unconfirmed` for the same reason. [...]

Applied: line 17 is the rule R3-2 restores in the inline comment. Line 16 is the search R3-3 extends to the condition the prompt puts on the reopen. Line 38 is the minting R3-4 gives a title and a description. Line 11 states the door R3-7 is about. Line 36 is the check order R3-5 would move.

---

## workflow/replay (applied bullets)

Line 6:

- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them

Line 15:

- A dial that turns a pass off leaves that pass's call and its block out of every prompt: `coverage off` reaches the workflow as `models.coverage` null, and the coverage call, the candidates block and its rules exist only when a pass ran. The loop test proves it per rule, each key phrase of the block being absent from a `coverage off` prompt (#79). Since #93 the off run follows the same model as the covered one, the reviewer finding and verifying alone, so its prompts are no longer those of the run before the pass existed

Line 19 (part):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). [...]

Applied: line 6 is what R3-7 shows broken at a reshape's stop. Line 15 answers R3-3's reading. Line 19 is why this round's script changes do not reach a relaunch of this run.

---

## testing/tests (applied bullets)

- A loop-test mock answers as the real agent would for the run's settings [...]
- Text the workflow escapes for GitHub is pinned as the escaped string the workflow writes, byte for byte, never as the raw input [...]
- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site [...]
- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)

Applied: R3-2's check pins the escaped Would confirm line in the inline comment, the second call site beside the body line's check. Tasks 2 and 4 read a post prompt that may be absent as `''`.

---

## process/docs-gate (applied bullets)

- Gate step 10 in `.claude/commands/agent-os/shape-spec.md`: for each file added or altered under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`, and for each new config key, subcommand, allow rule or exit code, the plan names the README section, or the `docs/` file and section (and template, if any), and either the commit that updated it or "no reader-facing change" with the reason
- A change to `docs/` is reader-facing by nature and needs no Docs entry of its own. [...]

Applied: one entry per touched file under `agents/`, `skills/` and `workflows/`. Task 5 touches `docs/upgrading.md` only.

---

## process/release (applied bullet)

- Every PR bumps `version` in `.claude-plugin/plugin.json`, and the marketplace entry in `.claude-plugin/marketplace.json` carries the same string: minor when the change alters what a setup rerun writes [...]
- `CHANGELOG.md` is written at tag time, dated and committed on `main` before `claude plugin tag` [...]

Applied: this PR already carries 0.3.0, and the round changes nothing a rerun writes. R3-1's note goes in `docs/upgrading.md`; the CHANGELOG is the owner's at release.

---

## prompts/attribution

Redline labels its own work as Redline; never a model or vendor name in a commit, body, comment or spec. Applied to every commit subject and spec file of this round.
