# ISSUE-04 — OBSERVE / AW loop

## Goal
TAKE → TRANSFORM → SHOW の実行結果をAWが観測し、最初の失敗Gateを次のIssueにする。

## Rules
1. workflow runを実測する
2. earliest failed gateを特定する
3. 下流UIで上流データ欠損を隠さない
4. greenでもdata gateとFE outputを別々に確認する
5. recapをworklogへ残す

## Acceptance

```text
run → recap → earliest failed gate → next issue → push → loop
```
