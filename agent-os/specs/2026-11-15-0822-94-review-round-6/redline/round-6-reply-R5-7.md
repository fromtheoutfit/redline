<!-- redline:R5-7 -->
**R5-7** · `workflows/redline-loop.js:2618` · from the Redline round 5 review body

Redline round 6: resolved; first reported as R5-7 in Redline round 5. checkDispositions now runs the `bad` filter before the loop that rewrites a decline's decidedBy (workflows/redline-loop.js:2665-2682), so a decline marked reviewer stops the run, as a fix marked reviewer does. · decided by: redline