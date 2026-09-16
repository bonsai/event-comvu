# Issue Solving Chain

`Issue → Plan → Implement → Verify → Report → Close → Next Issue`

## LOOP

1. **SEED** — read the issue and define the smallest acceptance criteria.
2. **PLAN** — choose files, branch, and non-goals before editing.
3. **IMPLEMENT** — make the smallest working change on the issue branch.
4. **VERIFY** — inspect the changed files and validate the acceptance criteria.
5. **REPORT** — comment the issue with changed files, verification, and remaining work.
6. **CLOSE** — close only when all acceptance criteria are satisfied.
7. **NEXT** — select the next open issue and repeat the loop.

## event-comvu FE loop

```text
Issue #9
  ↓
fe-deploy
  ↓
sample.jsonl
  ↓
fetch + JSONL parse
  ↓
p5.js timeline
  ↓
GitHub Pages artifact
  ↓
verify
  ↓
close #9
  ↓
next issue
```

## Rules

- Real connpass crawling is out of scope for #9.
- `source_url` is preserved as the primary evidence field.
- Dummy data must remain clearly marked as sample data.
- FE remains static; no API server is introduced.
