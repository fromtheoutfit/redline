# List every finding's files in the unattended section's return example

The shaper's output schema in `workflows/redline-loop.js` requires `files` on every finding since a deferral's mitigation is read from the round's record, and the shaper's agent file shows it on every finding of its example, but the return example in point 10 of `templates/shape-spec-unattended.md` (and this repository's copy in `.claude/commands/agent-os/shape-spec.md`) shows no `files` on any finding, and the sentence under it that lists what every finding carries leaves it out. A shaper that copies the template's example returns a result its schema refuses and has to retry.

- **Where:** `templates/shape-spec-unattended.md:75`
- **Why it is not fixed in #103:** The pull request that made `files` required kept the template as it is on purpose, as a patch release with no setup rerun, since the workflow's prompts and the shaper's agent file ask for `files`; a template change is a minor bump with a new section marker and a setup rerun in every repository, which belongs with the next change to the section.
- **Proposed fix:** In `templates/shape-spec-unattended.md`, add `files` to every finding of the point 10 example as `agents/redline-shaper.md` shows it (the fix and the mitigated deferral with their paths, the ask and the decline with an empty list) and to the sentence under it; bump the section marker and the minor version, freeze the previous body under `templates/history/` and pin its hash in `tests/setup-test.sh`, and rerun setup so this repository's copy carries the new body.

Deferred from pull request #103 by Redline (round 1, finding R1-4).
