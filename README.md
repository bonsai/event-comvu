# event-comvu

Connpass参加履歴を、**取る → 加工する → 見せる → 観測する** AW loop として扱う。

## Architecture

```text
TAKE
  connpass profile
      ↓
  event evidence
      ↓
  canonical JSONL (176)
      ↓
TRANSFORM
  semantic normalize
      ↓
  semantic query / SQL
      ↓
  semantic views
      ↓
SHOW
  JSON / HTML / API
      ↓
OBSERVE
  workflow evidence / AW recap
      ↓
next issue
  ↺
```

## Canonical data

- source of truth: `data/connpass/vonsai.jsonl`
- population gate: exactly 176 events
- unique `event_id`
- `source_url` and `retrieved_at` are preserved
- registered / attended are not inferred or conflated
- no fabricated event records

## Views

The UI is a projection of data, not the data source.

- Census
- Semantic
- Relation
- Query Result

Cluster / tag / metadata are derived from these views.

## AW

The earliest failed gate becomes the next task. Downstream UI work does not hide an upstream data failure.

See `aw.md` and the current AW execution issue in GitHub Issues.
