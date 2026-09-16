# ISSUE-02 — TRANSFORM / semantic data

## Goal
Canonical JSONLを壊さず、再現可能なsemantic dataへ加工する。

## Pipeline

`vonsai.jsonl → semantic-normalize → semantic query → SQL views`

## Requirements

- concept / property / relation / constraint
- event_id → source_url / retrieved_at trace
- same input + same query → same result
- 176 data gate passed before execution

## Views

- census
- semantic
- relation
- query-result

## Rule

SQLがoutputを作る。自然言語はSemantic Intentへ変換し、最終抽出は再現可能なqueryとして実行する。
