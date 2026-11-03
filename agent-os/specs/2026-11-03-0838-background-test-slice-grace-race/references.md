# References for the background test slice race

### The `killed` case's poll

- **Location:** `tests/background-test.sh:126`, `within 5 -f "$FILES/killed.pid" || bad "the runner writes its pid file" "no $FILES/killed.pid after 5 s"`
- **Relevance:** the same test already waits for the runner's pid file before acting on the run, with the harness's bounded `within` poll (`:52`)
- **Key patterns:** the poll is bounded, and its timeout is a failed case with a message, never a hang

### The grace window

- **Location:** `scripts/redline-background.sh:116` (`grace=$(( slice < 10 ? slice : 10 ))`) and `:148-149` (`no run under <label>; start it first`, exit 5)
- **Relevance:** the slice sets the window the runner has to appear; the role's default slice of 240 gives ten seconds, the test's `--slice 1` gives one
- **Key patterns:** the script is not changed; the test takes the role's conditions back by waiting for the pid file

### The #41 R1-2 rule

- **Location:** `agent-os/standards/testing/tests.md`, the bullet "A harness never waits for a precondition the role cannot wait for"
- **Relevance:** the retrospective's bullet says why this poll is not that wait: the role's own path has the ten-second grace the test shortened away
