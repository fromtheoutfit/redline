# References for #117 and #116: a resumed step is told what its stop was

## Similar Implementations

### The hold after a reshape, and its resume clause (#106)

- **Location:** `agent-os/specs/2026-11-20-1552-106-decided-task-follows-the-reshape/` (decision 13; "Left alone", `shape.md:115`); `workflows/redline-loop.js`, the stop after `vetShape` in the approve loop.
- **Relevance:** It added the correct-task clause for its own stop and left every other reshape stop on from-scratch, which is #117.
- **Key patterns:** A stop whose resume line tells the rerun to correct what it wrote; the clause ends with the `redline/` ban.

### The by-hand round of #114 (R4-1, R4-6)

- **Location:** `agent-os/specs/2026-11-21-1501-114-review-round-4-by-hand/`.
- **Relevance:** R4-1 made the correct-task clause restate the `redline/` ban; R4-6 made the hold name every failure in one error, since the line says "correct what the error names".
- **Key patterns:** A resume sentence that states an exception restates the rule it leaves standing.

### The resolve's resume clause (#108, R3-4 and R4-4)

- **Location:** `agent-os/specs/2026-11-18-1026-108-review-round-3/` and `agent-os/specs/2026-11-18-1026-108-review-round-4/`; `agents/redline-resolve.md`, "On a resume".
- **Relevance:** The first clause chosen by the stop, and the reason it is not appended to every resolve resume (the autopilot stop). The field replaces its `startsWith`.
- **Key patterns:** The agent file states the clause as the line states it.

### The resume itself (#10)

- **Location:** `agent-os/specs/2026-11-01-0911-10-resume-a-run-that-ended-in-error/`; `run()` and `resumeLine` in `workflows/redline-loop.js`; `redline-prefs.sh run save|check`.
- **Relevance:** Where `args.resume`, the marker and the from-scratch sentence come from.
- **Key patterns:** One line appended to one prompt; the marker written from the harness's own record.

### A new key that an older result lacks (#99)

- **Location:** `agent-os/specs/2026-11-18-0819-99-call-decision-states-its-disposition/` (decisions 11 to 18).
- **Relevance:** An absent key reads as empty, with no fallback to the old inference and no version check. Decision 15 follows it.

## Issues

- #117 and #116: the two this spec closes.
- #75, the 2026-11-20 comment: why a finding is settled by class.
- #104, #105, #109, #115, #118, #119: out of scope, none touched.
