# BQMLite adapter

`data/connpass/*.jsonl` を `bonsai/bqmlite-go` で扱える分析用 dataset に変換する。

初期分析:
- 年月・曜日・時間
- online / venue
- organizer / community
- category / technology
- event similarity
- clustering

予測より先に、参加履歴の構造を発見する。
