Redline stopped at the round cap

Redline reached its cap of 3 revise rounds with correctness findings still open in the latest review, so it has not requested a review. @michaelfromtheoutfit will pick these up.

### Still open

- **R4-4** · correctness · low · confirmed · `scripts/redline-gh.sh:380` · A diff.orderFile the repository root cannot read makes the clone's git diff die, so every comment the clone would place goes to the body
- **R4-5** · correctness · medium · confirmed · `scripts/redline-gh.sh:438` · A failing kinds step inside place_comments still yields a well-formed placement, so post-review posts every comment under "not in this pull request"
- **R4-6** · correctness · medium · confirmed · `tests/gh-test.sh:86` · hgit leaves GIT_DIR and GIT_INDEX_FILE in place, so the fixture's commits and index entries land in another repository when they are set
