# event-comvu

## Goal

connpass の `v0n5ai` 参加申込イベント履歴を、再現可能なデータセットとして収集し、**JSONL → 統計 → グラフ → BQMLite / ML → AW** へ接続する。

対象: https://connpass.com/user/vonsai/

### ゴール

- 参加履歴を可能な範囲で全件取得する（現在の目標: 176件）
- 1イベント = 1 JSON object / 1 line の JSONL にする
- `source_url` を必須の証拠として保存する
- 申込と実出席を混同しない
- イベントページから日時、主催者、会場、オンライン、カテゴリ、技術キーワード等を正規化する
- 画像・フライヤー URLも evidence として保持できるようにする
- 年/月/曜日/時間/地域/主催者/技術等の簡単統計を作る
- 統計をグラフ化する
- BQMLite dataset に変換して探索的MLを行う
- AWで `seed → crawl → evidence → JSONL → analysis → next research` を回す

## Data flow

```text
connpass profile
      ↓
profile crawler
      ↓
event URLs
      ↓
event crawler
      ↓
raw / normalized JSONL
      ↓
statistics
      ↓
graph
      ↓
BQMLite dataset
      ↓
ML / clustering / hypothesis
      ↓
AW next research
```

## Layout

```text
data/connpass/       # raw/normalized JSONL
schema/               # event schema
crawler/              # profile/event collectors
analysis/             # statistics and graphs
bqmlite/              # BQMLite adapter
aw/                   # research workflow
```

## Minimum record

```json
{"person_id":"connpass:v0n5ai","event_id":"connpass:EVENT_ID","title":"EVENT TITLE","started_at":null,"status":"registered","organizer":null,"venue":null,"online":null,"source_url":"https://connpass.com/event/EVENT_ID/","image_url":null,"flyer_url":null,"retrieved_at":"YYYY-MM-DD"}
```

## Rules

1. 公開ページを対象にする。
2. `source_url` と `retrieved_at` を保存する。
3. 事実と推定を分離する。
4. `registered` を `attended` と推定しない。
5. `event_id` で重複排除する。
6. rawに近い値を残し、正規化値を別フィールドとして扱えるようにする。

## ML direction

まず予測より探索を優先する。

- 年月別参加パターン
- 曜日 × 時間
- 主催者 / コミュニティ
- 技術キーワード
- オンライン / 現地
- 地域
- イベント類似性
- K-means 等によるクラスタリング

## Non-goals

- 非公開データの取得
- 認証情報の保存
- 申込履歴からの出席断定
- 最初から高度な推薦モデルを作ること

## Related

- `bonsai/bqmlite-go`: local BQMLite engine
