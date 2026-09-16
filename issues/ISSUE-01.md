# ISSUE-01 — TAKE / canonical 176

## Goal
Connpass profileから参加履歴の実データを取得し、canonical JSONLを176件で確定する。

## Pipeline

`profile → event_urls.jsonl → event evidence → vonsai.jsonl`

## Gate

- exactly 176 events
- unique event_id
- person_id = `connpass:vonsai`
- source_url required
- retrieved_at required
- 176未達ならTRANSFORMへ進まない

## Implementation

- `crawler/connpass_profile.py` deterministic pagination + expected-count gate
- `.github/workflows/crawl-connpass.yml` collection/data gates

## Done

実データ176件が取得され、`data/connpass/vonsai.jsonl` が生成されること。
