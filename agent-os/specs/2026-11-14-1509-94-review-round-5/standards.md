# Standards for PR #94 Review Round 5

Shaped by Redline in unattended mode. The following standards apply to this work. Each is copied as it reads at `583ac3b`, before this round's retrospective. A short file is copied whole; for a long one, the bullets the round applies are copied, a long bullet in part, as earlier review rounds did.

---

## workflow/agents (applied bullets)

Line 10 (part):

- A finding a repository ask rule covers (#49) has its own outcome kind, `left`: never `fixed` or `deferred` [...]. One function in the workflow (`forceAskRules`) applies the rules after every shape and reshape, whatever `fix`, `defer` or `ask` the shaper returned [...]

Line 30 (whole):

- An id the workflow mints beside the reviewer's is numbered after the highest in use, never by count: a reviewer's ids can skip a number, and every record of a run (comment ids, dispositions, outcomes, reply ids, the carried map) is keyed by id (#46, R1-3). When the workflow renames an id the reviewer returned, every ref to it in the same result (a coverage `finding` or `duplicate` entry) is renamed with it before anything reads the refs, or the entry looks like one naming no finding (#80, R2-3)

Line 37 (part):

- The workflow checks a result before it acts on it: [...] a `decline` must carry its reason, and on a Redline round a judgment call's `why_human` must be one of the round's cases (#93) [...]; the workflow's test is the second layer, run after `forceAskRules`, so a call a repository rule covers is judged by the reason the rule gives it (#94, R1-5, R1-12, R1-13), and an unusable result is a stage error with `resumeFrom` naming the agent to rerun, the agent the error is about, passed by name when another agent ran after it (`checkWhy` runs after the `spec status` call and names the shaper, #94, R2-9), never a synthetic judgment call; the one call the workflow writes is the repository-rule ask (#57)

Line 38 (whole):

- A finding's id is unique in its round: every id the workflow gives (a rename of a reviewer's id outside the round's form, a minted candidate, a carried finding) is numbered after the highest id of the round's form in use, since coverage refs, inline comments and replies are all matched by id (#94, R4-6)

Line 39 (whole):

- A list posted under an outcome's heading is read off each finding's final outcome, never off a list an agent returned beside the dispositions: a deferred entry beside a decline or a fix was listed under Deferred as shipped until #94, R4-9, so the shaper's stray entries are dropped with a warning and a reshape's re-sort drops the earlier one

Applied: line 30 is the rename R5-3 extends to a ref with a note. Line 37 is where R5-6 moves the reason check and why it names the shaper's label, and the check R5-7 reorders. Line 38 is the rule R5-5 completes for a repeated id. Line 39 is the rule R5-9 keeps for a disposition the person changed, and R5-8's label follows it. Line 10 is why a rule-covered decline is asked, never stopped (R5-6) or listed as a change left open (R5-8).

---

## workflow/replay (applied bullets)

Line 9 (whole):

- Every item a stop hands back is one the skill asks about and counts in `decisionsNeeded`: an override the resolve agent could not apply comes back as `overridesUnresolved` with its why, for the person to restate, since a stop with nothing to ask relaunches with the same args and replays the same refusal every time (#94, R4-8)

Line 20 (part):

- A relaunch runs the script the run launched with: by name while `workflows/redline-loop.js` is as launched, from the copy the harness persisted (as `scriptPath`) once it differs, which only the plugin's own repository can see (`redline-prefs.sh run drift`). [...]

Applied: line 9 is the hand-off R5-4's note now describes. Line 20 is the run caution (Decision 12).

---

## testing/tests (applied bullets)

Line 7 (part):

- A loop-test mock answers as the real agent would for the run's settings [...]; a reshape mock returns what the reshape prompt asks for [...]

Line 13 (part):

- A fix for a value one call site mishandled is pinned at a second call site too, so the test proves the rule and not only the site [...]

Line 14 (whole):

- A check fails, it does not throw, when the run it reads took another path: a prompt or a body that may be absent is read as `''`, so a red run reports its count. A `TypeError` in one check hides every check after it (#93)

Line 15 (whole):

- A stage error is pinned by its `resumeFrom` label as well as its text, since the label is what a resume reruns: R1-13 moved a check after another agent's call and its As built called the label unchanged, which only a `resumeFrom` check would have caught (#94, R2-9)

Applied: line 7 is why the two new mock keys (`resolveDeferred`, `ownerOf`) return what a real resolve agent or shaper could. Line 13 is why R5-3 runs a space and a colon after the id, and R5-9 runs with and without a reshape. Line 14 is why every new check reads an absent round, list or comment as empty. Line 15 is why R5-6's move keeps the `resumeFrom` neighbour (`tests/loop-test.mjs:2089`) and R5-7's check pins the label.

---

## process/docs-gate

A Docs entry for every touched file under `scripts/`, `skills/`, `agents/`, `templates/`, `workflows/`, `hooks/` or `.claude-plugin/`: the README section or the `docs/` file and section it updates, or "no reader-facing change" with the reason. Applied: each task names its entry for `workflows/redline-loop.js`, the only such file this round touches.

---

## process/release (first bullet, part)

- Every PR bumps the version [...]; a change that alters what a setup rerun writes bumps the minor version [...]. Applied: this round changes nothing a setup rerun writes, and the PR already carries `0.3.0` against `main`'s `0.2.4` (Decision 11).
