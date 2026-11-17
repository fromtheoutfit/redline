Redline stopped at the round cap

Redline reached its cap of 3 revise rounds with correctness findings still open in the latest review, so it has not requested a review. @michaelfromtheoutfit will pick these up.

### Still open

- **R4-3** · correctness · low · confirmed · `workflows/redline-loop.js:2942` · Dropping the draft of a deferral the person chose throws away their reason for the drop
- **R4-6** · correctness · low · confirmed · `workflows/redline-loop.js:3143` · FOLLOW_UP misses the phrasings the decline rule names: another PR, an issue, a later change
- **R4-7** · correctness · low · confirmed · `workflows/redline-loop.js:4278` · A human review pass's summary omits what its final nit pass deferred, and counts a mitigated deferral as fixed

### Deferred (4)

- **R1-4** With deferTo github, a repository with Issues turned off stops every deferring round at defer, and a resume cannot change it: deferred to #98; mitigated in a25778b · decided by: redline
- **R2-15** isDeferral cannot tell a fix with a stray mitigated resolve entry from a 'mitigate' answer, so that fix is filed as an issue: The author adds one sentence to the resolve prompt saying when a deferred entry is returned, and defers making each decision name its own disposition to a tracked issue, because the slip needs the agent to go against its own instructions, the fix commit is posted either way, and the full fix changes the resolve contract this pull request's spec agreed. Applied in 1825a93. Deferred to #99. · decided by: @michaelfromtheoutfit
- **R3-2** NOTHING_SHIPS reads only a fixed list of whole phrases, so another wording of 'nothing ships' still demands a commit: deferred to #100; mitigated in bbf194a · decided by: redline
- **R3-3** A multi-line draft field is escaped whole, so a filed issue shows &amp;lt;, &amp;amp; and @&amp;#8288; inside its code blocks: deferred to #101; mitigated in 4fb228f · decided by: redline
