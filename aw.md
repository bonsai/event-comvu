# AW

## Role

`AW` observes the repository's actual execution state and turns workflow evidence into the next actionable research/fix step.

## Loop

```text
push / scheduled crawl
  ↓
GitHub Actions
  ↓
workflow_run
  ↓
observe-workflow.yml
  ↓
read run + jobs + failed gate
  ↓
AW recap / failure issue
  ↓
solve earliest failed gate
  ↓
push
  ↺
```

## Canonical rule

1. Read the actual workflow run; do not infer state from source files alone.
2. Identify the earliest failed/cancelled/timed-out gate.
3. Create one AW issue per failed run when no matching open issue exists.
4. Solve the earliest gate before downstream visualization/deployment changes.
5. A green workflow is necessary but not sufficient: verify the data gate and FE output separately.

## Observed workflows

- `Deploy FE`: canonical semantic normalization → analysis → data gate → Pages deployment.
- `Crawl connpass`: evidence collection and canonical `data/connpass/vonsai.jsonl`.
- `Observe Workflow`: reads completed runs and feeds failures back into AW.

## Outputs

- workflow run evidence
- failed-gate recap
- AW issue for actionable failures
- artifact `aw-workflow-recap-*`
