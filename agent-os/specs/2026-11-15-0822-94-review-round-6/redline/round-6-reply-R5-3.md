<!-- redline:R5-3 -->
**R5-3** · `workflows/redline-loop.js:1567` · from the Redline round 5 review body

Redline round 6: resolved; first reported as R5-3 in Redline round 5. review() now renames a verified or unconfirmed ref's leading token when the rename map holds it and keeps the note after it (workflows/redline-loop.js:2435-2438), so accountCoverage reads the ref by its new id. · decided by: redline