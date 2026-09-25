# 総合計画書

## 1. 目的

イベント情報を個別のドメイン別リポジトリから統合し、**収集 → 精製 → 検索 → 分析 → カレンダー反映**までを一貫して扱えるイベント基盤を構築する。

対象は以下の4領域。

- アイドルLIVE
- お笑いLIVE
- 寄席・落語
- アートイベント

最終的には、日付・場所・料金などの共通イベント情報を `events` に集約し、Gemini / gws から Google Calendar 等へ利用できる状態にする。

---

## 2. リポジトリ構成

### 中核

`bonsai/event-comvu`

イベント情報の**統合・収集・検索・分析基盤**。

### ドメイン別

- `idol-live` → `event-comvu/idol/`
- `owarai-live` → `event-comvu/owarai/`
- `yose-db` → `event-comvu/yose/`
- `art-event` → `event-comvu/art/`

### カレンダー正本

`bonsai/events`

収集したイベントから、予定として扱うイベントを週別ファイルで管理する。

```
event-comvu
├── idol/
├── owarai/
├── yose/
└── art/

events
├── events.md
├── events/
│   ├── W39.md
│   ├── W40.md
│   ├── W41.md
│   ├── W42.md
│   ├── W43.md
│   └── W44.md
└── template/
    ├── event.yaml
    ├── event.json
    ├── event.ics
    ├── event.xml
    └── event.ttl
```

---

## 3. データフロー

```
各種ソース
  ↓
collect
  ↓
domain data
  ↓
normalize
  ↓
event-comvu
  ↓
search / dedupe / enrich
  ↓
calendar candidates
  ↓
bonsai/events
  ↓
Wxx.md
  ↓
Gemini
  ↓
gws
  ↓
Google Calendar
```

**GHを正本**とし、外部サービスは利用先・表示先として扱う。

---

## 4. 共通イベント型

最低限、以下を共通インターフェースとする。

```yaml
id: string
date: YYYY-MM-DD
start: HH:MM
end: HH:MM
title: string
place: string
address: string
price: string
paid: YES | NO | UNKNOWN
status: candidate | confirmed | cancelled
source: string
note: string
```

ドメイン固有情報は共通型を壊さず、各ドメイン側の拡張フィールドとして保持する。

---

## 5. ドメイン別責務

### idol

`idol-live` のLIVE情報を統合。

主な情報:

- アーティスト
- 出演者
- 会場
- 開演 / 開場
- チケット
- URL
- イベント種別

### owarai

`owarai-live` の公演情報を統合。

主な情報:

- 芸人 / 出演者
- 劇場
- 公演時間
- 料金
- 公演種別
- URL

### yose

`yose-db` の寄席・落語情報を統合。

主な情報:

- 落語家
- 演目
- 寄席
- 会場
- 公演期間
- 木戸銭
- URL

### art

`art-event` のアートイベントを統合。

主な情報:

- 展覧会名
- 作家
- 会場
- 開催期間
- 入場料
- URL

---

## 6. 正規化

同一イベントが複数ソースから取得された場合は重複排除する。

候補キー:

1. 日付
2. 会場
3. イベント名
4. 開始時刻
5. 出演者

完全一致だけでなく、表記揺れを吸収する。

例:

- 全角 / 半角
- 会場名の略称
- イベント名の記号
- 出演者名の表記差

---

## 7. 料金管理

料金不明を無料として扱わない。

- 無料 → `paid: NO`
- 有料 → `paid: YES`
- 不明 → `paid: UNKNOWN`

表示上は、

- `⚠️ 有料`
- `⚠️ 料金要確認`

を使用する。

特に「イベント自体は無料だが、有料チケット・入場条件がある」ケースは注記する。

---

## 8. events との接続

`event-comvu` は「イベントを探して整える場所」。

`events` は「予定として採用したイベントの正本」。

したがって、

```
event-comvu = research / collection / integration
events     = calendar canonical
```

と責務を分離する。

`events/events.md` は週別ファイルへのインデックスとし、実データは `events/Wxx.md` に置く。

---

## 9. 自動化

GitHub Actions / AW を中心に以下を自動化する。

### Phase A — Collect

各ドメインの情報を取得。

### Phase B — Normalize

共通イベント型へ変換。

### Phase C — Dedupe

重複イベントを統合。

### Phase D — Validate

日付、時刻、場所、料金、URL等を検証。

### Phase E — Publish

カレンダー候補を `bonsai/events` に反映。

### Phase F — Calendar

Gemini → gws に渡し、Google Calendarへ登録可能にする。

---

## 10. ステータス

イベントには状態を持たせる。

- `candidate` — 候補
- `confirmed` — 確認済み
- `cancelled` — 中止

情報源が変化した場合は、既存イベントを更新し履歴を残せる構造にする。

---

## 11. 開発フェーズ

### Phase 1 — 統合設計

- 共通イベント型を確定
- ドメイン責務を確定
- `event-comvu` を統合先にする
- `events` をカレンダー正本にする

### Phase 2 — データ移行

- `idol-live` を移行
- `owarai-live` を移行
- `yose-db` を移行
- `art-event` を移行

旧リポジトリは、移行確認後にアーカイブ等を検討する。無断削除はしない。

### Phase 3 — 正規化

- 共通型への変換
- 重複排除
- 表記揺れ吸収
- 料金状態の統一

### Phase 4 — 自動収集

- AW / GitHub Actions
- 定期収集
- 差分更新
- エラー記録

### Phase 5 — カレンダー連携

- 週別イベント生成
- Geminiによる候補整理
- gwsによるCalendar反映
- 変更 / キャンセル同期

### Phase 6 — 検索・分析

- 日付検索
- 地域検索
- ジャンル検索
- 料金検索
- 出演者検索
- イベント間比較
- 開催傾向分析

---

## 12. エラー管理

エラーはデータそのものと分離して記録する。

例:

```
errors/
├── collect/
├── normalize/
├── dedupe/
├── publish/
└── calendar/
```

最低限、

- 発生日時
- 対象repo
- 対象イベント
- 処理段階
- エラー内容
- 再試行状態

を記録する。

---

## 13. 完了条件

以下を満たした時点を統合完了とする。

- [ ] 4ドメインのデータが `event-comvu` に存在
- [ ] 共通イベント型で扱える
- [ ] 重複排除できる
- [ ] 料金不明を無料扱いしない
- [ ] `events` に週別イベントを生成できる
- [ ] Gemini → gws に渡せる
- [ ] Google Calendarへ登録可能
- [ ] 更新・キャンセルを追跡できる
- [ ] AW / GitHub Actionsで再実行できる
- [ ] エラーを追跡できる

---

## 14. 最終形

```
                 ┌──────── idol-live
                 │
                 ├──────── owarai-live
sources ─────────┼──────── yose-db
                 │
                 └──────── art-event
                         ↓
                   event-comvu
                collect / normalize
                dedupe / search / analysis
                         ↓
                       events
                    weekly canonical
                         ↓
                   Gemini → gws
                         ↓
                  Google Calendar
```

**原則: 「集める場所」と「予定の正本」を分ける。**

`event-comvu` がイベント知識基盤、`events` がカレンダー基盤となる。
