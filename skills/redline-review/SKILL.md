---
name: redline-review
description: "Redline debug entry point: review a pull request once and post (or, with dry run, write) the Redline round 1 review, then stop. /redline:redline-review <pr> [correctness only] [reviewer @handle] [dry run]. Use only when the person types /redline:redline-review."
argument-hint: "<pr> [correctness only] [dry run]"
---

# /redline:redline-review

The review half of Redline, for debugging. Arguments: `$ARGUMENTS`

Read `${CLAUDE_PLUGIN_ROOT}/skills/redline/SKILL.md` and follow it exactly, with these arguments plus `review only`. That file, read this way, shows the plugin's root as the unexpanded CLAUDE_PLUGIN_ROOT variable; it is this plugin's root, `${CLAUDE_PLUGIN_ROOT}`, wherever it appears (in `pluginRoot` too). Everything else is the same: the settings step (a `review only` run asks for, or confirms, the scope only, and the saved file is updated as that step says), the precheck, the start snapshot, the launch of `redline:redline-loop` with `interrupt: "review only"` and `reviewOnly: true`, and the `review-only` result handling. No revise model is asked for.
