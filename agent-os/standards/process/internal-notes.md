# Internal notes

This is the public repository: it carries the tool and its operating documentation, never the design record.

- Step notes, spike notes, API notes and the design document live in the private sibling repository `redline-internal` (`DESIGN.md`, `docs/`). A spec here may cite one by file name; it never copies the text in
- `README.md` is the only long-form document here: what an agent or a teammate needs while a run is going (install, settings, the commit rules, `checks.sh`, `redline-gh.sh`, the snapshot). A rationale goes to the internal repository; a rule goes to a standard
- Seed PRs and their answer keys live outside this repository, so a reviewer cannot read the answers
- `agent-os/specs/` holds the specs of changes to this repository, including the rounds Redline runs on itself. They are public and carry no attribution and no private detail (no token, no cost figure, no person's name beyond a GitHub login where a decision names its owner)
