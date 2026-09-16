# AW

## Role

`AW` observes the repository's actual execution state and turns workflow evidence into the next actionable research/fix step.

## Loop

```text
TAKE
  ↓
TRANSFORM
  ↓
SHOW
  ↓
OBSERVE
  ↓
AW recap / earliest failed gate
  ↓
next issue
  ↺
```

## Pipeline

```text
TAKE
  connpass profile
    ↓
  event evidence
    ↓
  canonical data/connpass/vonsai.jsonl
    ↓
  DATA GATE: COUNT = 176

TRANSFORM
  canonical JSONL
    ↓
  semantic normalize
    ↓
  semantic query
    ↓
  SQL semantic views

SHOW
  semantic views
    ↓
  JSON
    ↓
  HTML / API

OBSERVE
  workflow run
    ↓
  earliest failed gate
    ↓
  next actionable issue
```

## Canonical rule

1. Read the actual workflow run; do not infer state from source files alone.
2. Identify the earliest failed/cancelled/timed-out gate.
3. Create one AW issue per failed run when no matching open issue exists.
4. Solve the earliest gate before downstream visualization/deployment changes.
5. A green workflow is necessary but not sufficient: verify the data gate and FE output separately.
6. Do not fabricate missing event records.

## Work order

- **TAKE** — collect the 176-event canonical population.
- **TRANSFORM** — derive semantic data and reproducible SQL queries/views.
- **SHOW** — project views to FE/JSON/API.
- **OBSERVE** — record execution evidence and make the earliest failed gate the next task.

## Current gate

The `Crawl connpass` workflow already defines profile collection → event evidence → `vonsai.jsonl` → 176 validation → commit. The repository currently has no verified 176-row canonical dataset, so TAKE remains the active gate.
