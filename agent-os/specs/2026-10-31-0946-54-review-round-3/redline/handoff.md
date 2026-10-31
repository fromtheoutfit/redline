Redline handoff

Redline ran 1 review round; the last one found no correctness bugs.

Resolved 8 threads; 0 left open.

@marcamos, over to you for the human review.

### Rounds

- Round 3 (pr): 0 correctness, 0 nit; 0 commits; spec `agent-os/specs/2026-10-31-0946-54-review-round-3`

### Earlier rounds

- **R1-1** sed -i -e: the script after -e is treated as a write target and now refused: carried forward as R2-2 in round 2
- **R1-2** A wildcard followed by `..` segments gets out of the temp-directory exemption: carried forward as R2-3 in round 2
- **R1-3** Environment reaches git and the approved scripts by routes other than a prefix on git: carried forward as R2-6 in round 2
- **R1-4** git grep runs a program through an abbreviated or bundled -O: carried forward as R2-7 in round 2
- **R1-5** A repository config under the temp directory names a program for git -C: carried forward as R2-8 in round 2
- **R2-1** The main-session approval covers sed, find and the builtins, not only the scripts and read-only git: resolved: check_simple now leaves the main session inert for any wrapper, env, timeout or xargs in front of a command and for any command word other than cd, git or a script_name() hit (scripts/redline-guard.sh:986 and :1022); for the roles, sed_script_refused refuses a w, W or e command and a w or e flag on s (:833-948), and find refuses -fprint, -fprint0, -fprintf and -fls (:1143). · decided by: redline
- **R2-2** sed -i with -e checks the script as a write target, so a regex holding * or [ is refused: resolved: sed_operands (scripts/redline-guard.sh:791-820) separates the script after -e/--expression and the file after -f/--file, in their detached, attached and bundled forms, from the file operands, so only the files reach writable() (:1130). · decided by: redline
- **R2-3** The temp-directory exemption for a pattern ignores the `..` segments after the wildcard: resolved: writable() now refuses a pattern target that has a .. segment anywhere (scripts/redline-guard.sh:527), and grants the temp-directory exemption only when the text after the cut holds no / (:529-533). · decided by: redline
- **R2-4** A file whose name holds [ or { can be edited but never staged: git add refuses it as a pattern: resolved: The git add branch checks a path that holds a pattern character as a literal path when a file of exactly that name exists (scripts/redline-guard.sh:1282-1283), so an existing [id].php can be staged and still goes through the protected and ask-rule checks. · decided by: redline
- **R2-5** A leading `!` or shell keyword hides the next command from the guard, and the main session is now approved for it: resolved: ! and the shell keywords left BUILTINS and are refused as a command word through KEYWORDS (scripts/redline-guard.sh:723 and :1025); the main session is inert for them because of the bare-command-word rule at :1022. · decided by: redline
- **R2-6** GIT_* and other variables reach git and the approved scripts by export, bash -c and BASH_ENV: resolved: Every NAME=value prefix, bare or after env, goes through prefix_refused on every simple command, not only on git, and only REDLINE_OCTANE and the checks.json vars with a plain-word value are exempt (scripts/redline-guard.sh:967-998). Every env option is refused (:993), and export, declare, typeset, set, readonly and local are refused as commands (:1028). · decided by: redline
- **R2-7** git grep -O gets past read_flag_refused when abbreviated or bundled: resolved: read_flag_refused now refuses any word that starts with --op and any single-dash bundle that holds O (scripts/redline-guard.sh:1213), which covers the abbreviated and bundled spellings of -O. · decided by: redline
- **R2-8** git -C into a temp directory runs a program its .git/config names: resolved: The person chose option A: check_git refuses every subcommand unless the working directory, after -C and any cd, is REPO or REPO_REAL (scripts/redline-guard.sh:1235-1237), so git never runs in a repository whose config a role could have written. · decided by: redline
