# ISSUE-05 — QUERY / semantic intent

## Goal
Natural languageをSemantic Intentへ落とし、再現可能なSQL queryとして実行できるようにする。

## Schema
`concept / property / relation / constraint`

## Examples
- AI系イベント
- また行きたい
- 2600にまた行きたい
- 東京で多かったイベント

## Rule
LLMは意味変換に限定し、最終抽出はSQLで行う。同一DB + 同一queryなら同一結果を再生成できること。
