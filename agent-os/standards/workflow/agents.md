# Agents

One role per file under `agents/`, loaded as `redline:redline-<role>`, with its model and its denied tools in the frontmatter.

- Frontmatter carries `model` (overridden per call from `.claude/redline.json`) and `disallowedTools` as whole tools. Per-command limits are the guard's job: `Bash(git push *)` in `disallowedTools` would remove all of Bash, and a plugin agent's own `hooks` are ignored
- A prompt opens with "This is a Redline agent run on pull request #N" and names the plugin's README path for the git rules. The agent file holds the role; the workflow's prompt holds the round's inputs
- The reviewer, the shaper, both approvers and the checker return JSON, not prose, and the workflow reads fields, never text. The checker's pass or fail comes from `checks.sh`'s JSON (`ok`, `unexpected_files`, `uncommitted`)
- Judgment calls are returned, never decided: a shaper that cannot settle a question from the code returns it as `ask` with a story, options and a recommendation. The person decides in their session, or autopilot takes the recommendation and says so
- Every decision carries its owner, in `shape.md`, in each finding's reply and in the handoff comment: `decided by: redline`, `decided by: @<login>` (the login `redline-gh.sh login` prints), or `decided by: redline (autopilot)`
- A role's prompt names only the commands the guard allows it, in the exact spelling the guard accepts (`<plugin>/scripts/redline-gh.sh diff <pr>`, `vendor/bin/pest <file>`)
- Haiku for the roles that move files and post (github, checker); Opus for the ones that read code (reviewer, plan approver); the revise model is picked at launch and saved per person
- A role that finds a problem with its own instructions (a command the guard refuses, a file that does not exist) reports it in its JSON rather than working around it
- A degraded result is data, not an error: the GitHub agent returns a posted review with no inline comment as `posted` true with every finding in `movedToBody`, the workflow records a warning, and `error` is reserved for an operation that failed (#33: a review with every finding in the body ended the run at `post`)
