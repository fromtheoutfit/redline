# Internal notes

This is the public repository: it carries the tool and its operating documentation, never the design record.

- Step notes, spike notes, API notes and the design document live in the private sibling repository `redline-internal` (`DESIGN.md`, `docs/`). A spec here may cite one by file name; it never copies the text in
- `README.md`, `docs/` and `CONTRIBUTING.md` are the long-form documents here: the README for installation and use (what it is, requirements, install, quick start, the dials, the Files table, the git rules for agents, Known limits), `docs/` for the reference (setup, contract, running, guard, upgrading, scripts), `CONTRIBUTING.md` for developing, CI, the Docs step and releases. A rationale goes to the internal repository; a rule goes to a standard (#14)
- Seed PRs and their answer keys live outside this repository, so a reviewer cannot read the answers
- `agent-os/specs/` holds the specs of changes to this repository, including the rounds Redline runs on itself. They are public and carry no attribution and no private detail (no token, no cost figure, no person's name beyond a GitHub login where a decision names its owner)
