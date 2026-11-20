# References for PR #112 Review Round 4, Fixed by Hand

## Similar Implementations

### The #97 round finished by hand

- **Location:** `agent-os/specs/2026-11-17-0929-97-review-round-4-by-hand/`
- **Relevance:** the precedent for a round a person finishes after the cap, and the form this folder follows.
- **Key patterns:** the person's decisions listed first, then the ones made from the code; a change no finding names (SC2010 there) as its own task and commit; one reply per finding in Redline's form after the push; the retrospective in its own commit.

### The hostile-configuration cases in gh-test

- **Location:** `tests/gh-test.sh`, the pinned-configuration cases after "place: the clone as the second source" (the gitconfig at line 191, the cases at 521-542)
- **Relevance:** R4-4's case and `GIT_ATTR_SOURCE`'s sit beside them.
- **Key patterns:** a hostile setting is put on the script's call alone (`GIT_CONFIG_GLOBAL=<file> gh place 21 …`, `GIT_DIFF_OPTS=-u0 gh place 21 …`); every case expects the default placement, `[[1500,98,1300],["R1-3","R1-5"]]`.

### The fixture made again under a hostile environment

- **Location:** `tests/gh-test.sh`, the R2-4 and R3-3 cases (572-579)
- **Relevance:** R4-6's, R4-7's and the ignore file's cases follow them, and those four cases stay unedited as the proof of the prefix unset for the variables they set.
- **Key patterns:** the hostile variable is put on the harness's own function (`GIT_DIFF_OPTS=-u0 GIT_CONFIG_GLOBAL=… whole_diff`), and its output is compared with `diff-20.txt` byte for byte, after the quoted-name case has pinned that file against a literal.

### R1-9's cases

- **Location:** `tests/gh-test.sh` (647-656), with `fresh_posts`, `posts` and `taken`
- **Relevance:** R4-5's case sits after them and reads the same three things: the exit and stdout, the one line on stderr, and that GitHub was sent no review.
- **Key patterns:** `fresh_posts` empties the shim's logs; `posts` counts the payloads sent; `taken` says whether the shim took a review.

### A tool put first on PATH for one call

- **Location:** `tests/gh-test.sh` (232-233, 569, 696): `$WORK/gnu-awk`, holding `awk` as a link to gawk
- **Relevance:** R4-5's jq wrapper is put on PATH the same way, for the one call.

## Records this spec rests on

- `agent-os/specs/2026-11-19-1601-112-review-round-4/redline/`: `round-4-findings.json`, `round-4-review.json`, `cap-hit.md` (the brief). The seven inline comments of review 5986662289 hold each finding's detail and proposed fix.
- `agent-os/specs/2026-11-19-1601-112-review-round-1/shape.md`: unattended answer 8 and decision 1 (R1-4: an environment variable is inside the pinned flags' promise).
- `agent-os/specs/2026-11-19-1601-112-review-round-2/shape.md`: unattended answers 5 and 6 (R2-2: `--text`, and why not one `-c` per source) and 8 and 9 (R2-4: the harness is meant to be independent of the developer's configuration, through one helper).
- `agent-os/specs/2026-11-19-1601-112-review-round-3/shape.md`: unattended answers 4 and 5 (R3-1: the pathspec variables unset) and 8 and 9 (R3-3: configuration given through the environment).
- `agent-os/specs/2026-11-19-1601-112-review-round-3/redline/round-3-reply-R3-1.md`: the form of a reply in a finding's thread.
- `agent-os/specs/2026-11-19-1523-96-place-findings-on-patch-less-files/shape.md`: decisions 12 and 21 (the pinned flags and `--literal-pathspecs`) and the measurement against GitHub's diff.
- git's own manual, as installed (git 2.54.0): git-config(1) for the `diff.*` and `core.*` keys, `safe.directory` and `core.excludesFile`; git(1) for the variables; git-diff(1) for `-O`; git-init(1) for the template order.
- `scripts/redline-gh.sh:21-57`, `prior-findings`: which replies it reads as settled (decision 6).
