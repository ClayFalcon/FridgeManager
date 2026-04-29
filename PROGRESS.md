# PROGRESS

最終更新: 2026-04-29

## 現在の状態
Google OAuth（`expo-auth-session` の `useIdTokenAuthRequest`）を実装。Client ID を `.env` ファイルで管理する構成にした。
GitHub Issues #5〜#10 をすべてクローズ済み。
残りの未実装機能は #11（プッシュ通知）・#13（テーマカラー）の2件のみ。

## 次にやること
1. **Google OAuth を実際に動かす**（Client ID を取得して `.env` に設定）
   - Firebase Console → Authentication → Sign-in method → Google を有効化
   - Google Cloud Console で Android 用 OAuth クライアント ID を作成
     - デバッグ用 SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - `.env` に `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` と `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` を設定
   - 手動テスト TC-S-03/04 を実施して動作確認
2. 手動テスト TC-SH-01〜08（共有）・TC-C-01〜04（リアルタイム同期）を1周実施して記録を埋める
3. Issue #11: プッシュ通知（在庫更新・賞味期限）← 最後の大型機能
4. Issue #13: テーマカラーカスタマイズ ← 軽微

## 判明した重要事項
- Firebase JS SDK v12 (`@react-native-firebase` ではない)
- `initializeAuth` + `inMemoryPersistence` を使用（auth状態はアプリ再起動でリセット）
- **Google OAuth 実装方針**:
  - `Google.useIdTokenAuthRequest` でIDトークンを取得（暗黙フロー）
  - `result.params.id_token` → `GoogleAuthProvider.credential(idToken)` → `linkWithCredential`
  - Client ID は `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` として `.env` で管理
  - `.env.example` に取得手順コメント付きで記載済み
- **設定画面遷移テストを自動化から除外した理由**:
  - Firebase Auth の `onAuthStateChanged` 内部 `setTimeout` が Detox の `ReactNativeTimersIdlingResource` をブロック
  - RN 0.79 New Architecture + Detox 20.x + Firebase Auth の既知の非互換問題
  - 手動テスト手順書: `e2e/manual/settings-screen.md`（TC-S-01〜04）
- **ローカル Android ビルドの制約**（Windows + AGP 8.8.2 + NDK 27.1 問題）
  - AGP 8.8.2 が Prefab CLI に `--os-version 22` を渡すバグ（x86_64）
  - 回避策: `newArchEnabled=false` + `ndkPath` で `27.1.12297006-2` を指定
  - `android/build.gradle` の ndkPath はローカル専用（コミット不推奨）
- E2Eテスト: `device.launchApp({ delete: true })` でSQLiteを毎回リセット
- 共有機能: 招待コードは6文字（混同しやすい文字除外）・24時間有効・メンバー上限5人（オーナー含む）

## 作業ログ
### 2026-04-29
- Google OAuth を `expo-auth-session` で実装（`FirebaseAuthService.ts`）
- `.env.example` を作成（取得手順コメント付き）
- `.gitignore` に `.env` を追加
- TC-S-04 を正常フロー向けに更新
- GitHub Issues #5〜#10 をクローズ

### 2026-04-27
- PROGRESS.md を最新状態に更新

### 2026-04-12〜04-27
- Firestore `onSnapshot` によるリアルタイムリスナーを追加
- 冷蔵庫の共有・招待機能を実装（`SharingService`、`SharingContext`）
  - 招待コード生成・参加・メンバー一覧取得・メンバー削除・グループ脱退

### 2026-04-12
- 設定画面遷移 E2E テスト 3 件を `app.e2e.js` から削除（CIで6回連続失敗）
- `e2e/manual/settings-screen.md` を新規作成（手動テスト手順書 TC-S-01〜04）
- 除外理由をコード内コメントと手順書に記録

### 2026-04-04〜04-05
- Issue #8: Firebase Anonymous Auth 実装
- Issue #9+#10: CloudRepository + useRepository フック実装
- Issue #11: Googleリンク + MigrationService 実装（Jest単体テスト3件）
- ローカル Android ビルド回避策確立

### 以前のセッション
- Issue #2〜#7 完了、E2E テスト 20 件が CI で全通過済み
