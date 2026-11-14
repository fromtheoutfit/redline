# Standards for PR #94 Review Round 4

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `4227e11`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 9 (part, its end):

- [...] The person decides a call in their session, or autopilot takes the recommendation and says so, except for a finding a repository ask rule covers, which autopilot leaves to the person with the rule as its reason (#49). No other role decides a pending call or reopens a decision made

Line 10 (part):

- [...] One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]: a paths rule on the finding's file and on the `files` the shaper lists for its task, a prose rule by the shaper's `askRule` tag; the reviewer's tag is advisory and only marks the review. [...]

Line 11 (part):

- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment [...]. A decision Redline makes alone carries its reason beside its owner, in the thread and in the handoff, so the person can audit it and overrule it without a new stop: a typed line at a stop the run already makes in that round that no plan approver of the round has run before [...], or a reply in the thread and a human review pass over their own login [...]

Line 12 (part):

- A human review pass (`/redline:redline-revise <pr> review <selector>`) sorts a teammate's comment into `fix` [...], `ask` [...] or `none` [...], never `defer` and never `decline` [...]. The pass is unchanged by #93: its prompts keep "Judgment calls are returned, never decided", its lines say "the author", [...]

Line 16 (part):

- A decision that changes a rule a prompt states is applied everywhere the prompt and the role's agent file state the old rule, found by searching both for the rule's own words (`never re-raise`, the example values), not only in the sentence the finding quoted, and every other wording of the same rule [...]

Line 18 (whole):

- A command a posted line tells a reader to run is the namespaced form (`/redline:redline-revise <pr> review @<login>`), since the short aliases are a repository's own optional files and the workflow is never told whether they exist; the session's own summaries may name the short form with the namespaced one beside it (#94, R3-6)

Line 37 (part):

- The workflow checks a result before it acts on it: the shaper's spec folder is listed by the GitHub agent's read-only `spec-status` operation, an `ask` must have its judgment call [...], a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93) [...]

Applied: line 9's last sentence is what R4-4 and R4-5 make the resolve and approver prompts say precisely. Line 10 is why R4-2 leaves `forceAskRules` as it is. Line 11 is the overrule door R4-8 keeps open and R4-11 states. Line 12 is the human pass whose prompts R4-12 leaves unchanged. Line 16 is the search R4-2 applies to the dispositions list. Line 18 is the command R4-11 rewords. Line 37 is where R4-9's check on stray deferred entries sits.

---

## workflow/replay (applied bullets)

Line 6 (whole):

- Decisions, approved plans and selected findings enter the workflow only after the prompt they answer (`args.decisions` after shaping, `args.approvedPlans` for the plan dial, `args.selected` for the review dial); a prompt before that point never mentions them; and a stop takes only a decision whose prompt comes after it, so a decline overrule, which the round's first resolve applies, is taken only at a stop no plan approver of the round has run before (#94, R3-7)

Line 16 (whole):

- `tests/loop-test.mjs` proves the rule: its relaunch scenarios assert that the prompts before the stopping point equal the first launch's, and a change that breaks that fails there before it reaches a PR

Line 19 (part):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). [...]

Applied: line 6 is why R4-8's restated override reruns only the round's first resolve, whose prompt comes after the stop. Line 16 is the `samePrefix` checks Task 3 names as neighbours. Line 19 is the run caution (Decision 14).

---

## testing/tests (applied bullets)

Line 7 (part):

- A loop-test mock answers as the real agent would for the run's settings [...]; a reshape mock returns what the reshape prompt asks for [...]

Line 13 (part):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site [...]

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)

Applied: line 7 is why Task 6 relies on the mock's reshape keeping a deferred entry for a re-sorted defer, which is the stray case a real shaper can return. Line 13 is why Task 2 pins the implementer's prompt beside the resolve agent's. Line 14 is why every new check reads an absent prompt or reply as `''`.

---

## process/docs-gate

A Docs entry for every touched file under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`: the README section or the `docs/` file and section it updates, or "no reader-facing change" with the reason. Applied: each task names its entry.

---

## process/release (first bullet, part)

- Every PR bumps the version [...]; a change that alters what a setup rerun writes bumps the minor version [...]. Applied: this round changes nothing a setup rerun writes, and the PR already carries `0.3.0` against `main`'s `0.2.4` (Decision 13).
