<!--
Redline: the two edits to a repository's CLAUDE.md.

1. Append the sentence below to the rule in the Git section that keeps agents from committing
   (for example "Never commit, push, or amend commits. Only stage files when explicitly
   asked."). The Redline agents' prompts open with "This is a Redline agent run on pull request
   #N. Git operations follow "Git rules for Redline agents" in <plugin root>/README.md", which is
   what the sentence keys on.

2. If CLAUDE.md forbids AI attribution, add the paragraph below to that section, so a model
   reading the rule does not take Redline's own label for attribution, nor the `models` keys
   setup writes into .claude/redline.json (its last sentence; a rerun appends it to a paragraph
   that predates it).
-->

When the prompt identifies the session as a Redline agent run, git operations follow "Git rules for Redline agents" in the Redline plugin's README, at the path that prompt gives; otherwise this rule is unchanged.

Redline labels its own work as "Redline" (review titles such as `Redline round 2`, the `redline:`
commit-message prefix, the `Redline handoff` comment). That is a tool name, not AI attribution,
and is allowed; a model or vendor name next to it is not. Configuration that selects a model, such
as `models` in `.claude/redline.json`, is not attribution and is allowed.
