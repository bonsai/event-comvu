# Crawler

TAKE stage of the AW pipeline.

## Canonical flow

```text
connpass profile
  ↓
connection event URLs
  ↓
event evidence
  ↓
data/connpass/vonsai.jsonl
```

The canonical population is exactly 176 events. The collector fails before evidence normalization when the profile does not yield 176 unique events.
