# 手動テスト手順書: 設定画面

## 自動化できない理由

Firebase Auth の `onAuthStateChanged` リスナー登録時に内部で `setTimeout` が発行される。
React Native 0.79 New Architecture (Fabric) 上では、この setTimeout が Detox の
`ReactNativeTimersIdlingResource` を占有し、`waitFor` が永遠にタイムアウトする。

- 環境: RN 0.79.x New Architecture + Detox 20.x + Firebase JS SDK v12 + Android API 33
- 試みた回避策: `device.setURLBlacklist()` で Firebase URL を除外 → タイマー同期は除外不可
- 参考: Detox メンテナー推奨の回避は `newArchEnabled=false` だが本プロジェクトでは採用しない
- 再自動化の条件: Firebase Auth Emulator 導入 + `disableSynchronization` の安定化、または Detox の New Architecture 対応改善

---

## テスト実施条件

- 実機またはエミュレーター（Android API 33 以上）
- アプリをクリーンインストール済み（`adb shell pm clear com.yourapp` またはアプリ削除→再インストール）
- Firebase 接続が有効な状態（インターネット接続あり）

---

## テストケース

### TC-S-01: 設定画面に遷移できる

**手順**
1. アプリを起動する
2. 食品保管画面が表示されるまで待つ（`btn-add-food` が見える状態）
3. 設定ボタン（`btn-settings`）をタップする

**期待結果**
- 設定画面（`settings-screen`）が表示される
- 画面タイトルに「設定」が表示される

---

### TC-S-02: 設定画面から戻ることができる

**手順**
1. TC-S-01 を実施し設定画面を表示する
2. 「← 戻る」ボタン（`btn-back`）をタップする

**期待結果**
- 食品保管画面（`storage-screen`）に戻る
- 保管場所タブ・食品リストが表示されている

---

### TC-S-03: 設定画面に「家族と共有する」ボタンが表示される

**前提条件**: Google アカウントとまだリンクしていない状態

**手順**
1. TC-S-01 を実施し設定画面を表示する
2. 「データ共有」セクションを確認する

**期待結果**
- 「家族と共有する」ボタン（`btn-link-google`）が表示される
- ボタンは緑色（`#0d8f7a`）で活性状態

---

### TC-S-04: 「家族と共有する」ボタンをタップするとエラーが表示される（現状の暫定動作）

> **注意**: Google OAuth は未設定のため、現状はエラーダイアログが表示される正常動作

**手順**
1. TC-S-03 の状態で「家族と共有する」ボタンをタップする

**期待結果**
- エラーダイアログが表示される
- メッセージ: 「Google OAuth は未設定です。Android Client ID を設定してください。」

---

## 実施記録

| 日付 | 実施者 | TC-S-01 | TC-S-02 | TC-S-03 | TC-S-04 | 備考 |
|------|--------|---------|---------|---------|---------|------|
|      |        |         |         |         |         |      |
