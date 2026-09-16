# ISSUE-06 — SQL / reproducibility

## Goal
Canonical dataからSQLで統計・Semantic Viewを再生成できる状態を固定する。

## Requirements

- 176件を母集団にする
- Census / Semantic / Relation / Query Result
- event_id → source_url / retrieved_at
- query結果は再現可能

## Gate

canonical 176 gateを通過しない場合は実行しない。
