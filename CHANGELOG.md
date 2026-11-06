# Changelog

One heading per tagged version, newest first, and one line per merged pull request under it, written by the person at tag time from the merged PR titles since the previous tag (see "Releases" in `CONTRIBUTING.md`). Three groups: Features; Fixes; Setup and templates, the changes a rerun of `/redline:setup` carries into a repository (a plugin update alone does not).

## 0.2.0

### Features

- #80 Two-reviewer rounds: the code-review skill as the finder on every round, Redline's reviewer as the verifier; done when a round confirms nothing new (#79)

### Setup and templates

- `redline.json.example` gains `models.coverage`, the coverage pass's model and effort. A rerun of `/redline:setup` keeps an existing `redline.json` as it is and lists the template's `models` under differs without writing them; the key absent means the pass is on at the first-round reviewer's model and effort, so add it by hand only to pick another
- The `/redline` alias's argument hint names `coverage off`; a rerun of `/redline:setup` offers the changed alias

## 0.1.0 (2026-11-03)

The first release: Redline as a single-plugin marketplace.

### Features

- Extracted from Chalkboard as a plugin, with the interrupt dial, finding scope and decision owners, saved launch settings and their docs (the commits before #5, 2026-10-20)
- #5 Set up this repository for Redline: Agent OS, the per-repo contract, and the guard's self-hosted case
- #34 Handle PRs over 100 files and number a fresh run after posted rounds (#33, #10)
- #37 Stop the run on a checker result the implementer cannot change (#9)
- #38 Revise from a human review: ingest a teammate's review comments as findings and fix them (#36)
- #41 Run a long gate in the background for the checker and the implementer (#40)
- #45 Resolve the threads Redline opened once their findings are settled, never a human's (#39)
- #46 Carry forward an earlier round's finding that has no disposition (#35)
- #47 CI: run the gate on every PR push, on Ubuntu and macOS, with stamp, version and clean-tree checks (#17)
- #51 Gate step 10, Docs: every spec names the README changes it needs (#13)
- #59 Resume a run that ended in error from the failed step (#10)
- #61 Check the shaper's spec folder and relaunch only from a typed `relaunch` (#57, #60)
- #65 Release process: semver in plugin.json, `redline--v` tags, update instructions, CHANGELOG (#16)

### Fixes

- #8 Port the shared output budget into this repo's checks.sh (#7 R1-13, R1-14, R2-1)
- #43 Normalize every GitHub agent's error field with errorText (#42)
- #48 ci: make the shellcheck job required, no longer advisory
- #56 Override a checker's structural misread when the JSON it returned is well-formed (#55)

### Setup and templates (rerun `/redline:setup` to carry them)

- #7 Add the gate stamp so a launch refuses a drifted checks.sh (#6, first half)
- #12 Add /redline:setup: generate checks.sh from checks.json and dogfood it here (#6)
- #52 Per-repository ask rules: things a person is always brought in for, declared in the repository (#49); unattended template v3
- #54 Harden the guard: refuse wildcard write targets, vet read-only git, drop the imitable allow-list rules (#53, #50); checks template v2, ten allow entries retired
- #62 Print the checks.sh header as a person types it and bootstrap hand-written gates in read-checks (#18)
- #63 Add /redline and /redline-revise short alias commands (#44)
- #64 Version the unattended section, warn at launch, and merge template body changes on a rerun (#15)
