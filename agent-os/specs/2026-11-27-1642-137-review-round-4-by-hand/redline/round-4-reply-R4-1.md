<!-- redline:R4-1 -->
**R4-1** · `scripts/redline-prefs.sh:439` · from the Redline round 4 review body

Redline round 4: fixed in 959c5d9 (R4-1 read run check's path lists with git's -z, so a path is read as it is named (#135)). A name that `git diff --name-only` itself quotes (a byte above 0x7f, a double quote, a backslash, a control character) still stops at the gate, whose own lists are read in `scripts/checks-template.sh`, which this pull request does not touch: README Known limits says so, and that read is drafted as an issue. · decided by: @michaelfromtheoutfit
