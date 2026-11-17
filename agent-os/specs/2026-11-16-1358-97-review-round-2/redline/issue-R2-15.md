# Have the resolve agent name each decision's disposition, so a stray deferred entry beside a fix is not filed

When a person, or autopilot, decides a judgment call, Redline learns that the decision deferred the finding only from the resolve agent's `deferred` list: a decided finding with an entry there is filed as the person's deferral when the entry ships a mitigation or the finding has no planned task with files (`isDeferral` in `workflows/redline-loop.js`). A decision that fixes the finding in full has a task with files and should have no entry, but when the resolve agent also returns one with a mitigation, the workflow cannot tell it from a real "Mitigate" answer, which has the same shape. The fixed finding is then filed as a GitHub issue, with no question on autopilot, and its reply ends "Deferred to #N".

- **Where:** `workflows/redline-loop.js:3693`
- **Why it is not fixed in #97:** Telling the two apart needs a new field in the resolve agent's output and in its agent file, a change to how the pull request's own spec has a chosen deferral reach the workflow; the review round that found it put the rule for when an entry is returned into the resolve prompt instead.
- **Proposed fix:** Add to the resolve agent's JSON the disposition each applied decision ends in (`fix`, `defer` or `accept`), ask for it in `agents/redline-resolve.md` and the resolve prompt, and have `isDeferral` read a decided finding's deferral from it rather than from the entry and the task's files; pin a fix beside a stray mitigated entry, a fix beside a stray empty entry, and a real "Mitigate" answer in `tests/loop-test.mjs`.

Deferred from pull request #97 by Redline (round 2, finding R2-15).
