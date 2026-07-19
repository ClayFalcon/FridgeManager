# PROGRESS

最終更新: 2026-07-19

## 現在の状態

Issue #11（プッシュ通知）の実装が完了（未コミット・未push）。
Firebase Cloud Functions / Blazeプランは導入せず、以下の構成で実現した:
- 他メンバー通知: クライアントからExpo Push APIを直接呼び出し、Firestoreルールで5分間のレート制限を強制
- 賞味期限リマインダー: 端末ローカルの `expo-notifications` スケジュール通知（サーバー非依存）
- 通知タップ時の画面遷移: 既存の`useState`ベースの画面切替パターンを拡張

`npm run test:unit` は全69件（うち新規39件）成功。

## 次にやること

1. `git status` で差分を確認し、コミット・push（ユーザーの指示待ち）
2. ユーザー側の手動セットアップを実施:
   - `eas init` で EAS プロジェクトを作成し `app.json` の `extra.eas.projectId` を埋める
   - `firebase init firestore`（または `firebase.json`/`.firebaserc` を手動作成）→ `firebase deploy --only firestore:rules`
3. Android実機/エミュレータで動作確認（`e2e/manual/notifications.md` の手順に沿って）
4. GitHub Issue #14 は実装済みでクローズ済み。Issue #11 も実装完了後にクローズする
5. 残タスク: Issue #12（設定画面）、#13（テーマカラー）、#15（履歴タブ、#11から派生・新規作成）

## 判明した重要事項

- `src/config/firebase.ts` は `initializeAuth(app, { persistence: inMemoryPersistence })` を使用しており、
  **Auth状態はアプリ再起動で失われる**（Detoxの `onAuthStateChanged`/`setTimeout` ハング回避のための意図的な設計）。
  そのため通知設定は `request.auth.uid` に依存するFirestoreではなく、端末ローカルSQLite
  （`src/db/NotificationSettingsStore.ts`）を正として実装した。Firestoreへのミラーは複数端末同期用の保存のみ。
- Firestoreルールをこのプロジェクトで初めて `firestore.rules` として追加した（従来はFirebase Console管理のみ）。
  デプロイには `firebase deploy --only firestore:rules` が必要（ユーザーの手動対応）。
- Expo Push APIはサーバー不要でクライアントから直接呼べる（`https://exp.host/--/api/v2/push/send`）。
  ただしこれは「正規アプリ間の協調的なレート制限」であり、改造クライアントに対する強制力はない
  （Firestoreルールの5分クールダウンチェックが実効的な防御線）。
- `expo-notifications` のプッシュトークン取得には EAS プロジェクトID（`app.json` の `extra.eas.projectId`）が必須。
  未設定の間は `PushTokenService.registerPushToken` がフェイルソフトでno-opになる設計にしてある。
- iOSはローカル通知の同時予約上限が64件。`src/utils/expiryScheduling.ts` の `computeNotificationPlan` で
  同日・同時刻の複数食材を1通知にバッチ化し、上限で発火が早い順にトリムする設計にした。
- Jest単体テストで `expo-sqlite` をモックする際、`const mockDb = {...}` を jest.mock ファクトリの**外側**で定義すると
  Babelのimport hoistingにより `TypeError: Cannot read properties of undefined` になる（TDZではなく`var`化により
  無言でundefinedになる）。モック対象オブジェクトは必ずファクトリ**内部**で生成し、`__mockXxx` のような形で
  再エクスポートしてテスト側から参照すること（`src/__tests__/NotificationSettingsStore.test.ts` 参照）。
- このリポジトリの `npm run test:coverage` のカバレッジ80%閾値は、CI（`unit-test.yml`）では
  `npm run test:unit`（`--coverage`なし）しか実行されないため**実質的にCIをゲートしていない**。
  画面コンポーネント（StorageScreen/SettingsScreen等）は元々0%カバレッジで、新規実装も同様の方針
  （ロジックは純粋関数に分離してテストし、JSX配線自体は未テスト）で問題ない。
- `npx tsc --noEmit` はこのプロジェクトのtsconfig.json自体の設定不備（`customConditions`と`moduleResolution`の
  不整合、pre-existing）でリポジトリ全体としては失敗する。個別ファイルは
  `npx tsc --noEmit --jsx react-native --skipLibCheck --moduleResolution bundler ...` のような一時オプションで
  型チェック可能。
- `npx eslint` も `.eslintrc.json` が参照する `eslint-config-prettier` が未解決でリポジトリ全体として動かない
  （pre-existing、本セッションでは対応せず）。

## 作業ログ

### 2026-07-19
- Issue #14を実装済みとしてクローズ、未コミット差分（.gitignore整備・CLAUDE.md・docsモックアップ）をコミットしてpush
- Issue #11（プッシュ通知）の要件をヒアリングし、Plan Modeでアーキテクチャを設計
  - Cloud Functions/Blazeプランを避け、Expo Push直接呼び出し + ローカル通知 + Firestoreルールでのレート制限方式に決定
- 実装:
  - 依存関係追加（expo-notifications, expo-device, expo-constants）、`app.json`設定、`firestore.rules`新規作成
  - 純粋関数群: `notificationMessages.ts`, `expiryScheduling.ts`, `notificationTier.ts`, `expirySort.ts`（+テスト22件）
  - `NotificationSettingsStore.ts`（SQLite）、`ExpiryNotificationScheduler.ts`、`useExpiryNotificationScheduler.ts`
  - `SettingsScreen.tsx`に通知設定UI（無料/有料プラン、`TimePickerField.tsx`新規）を追加
  - `StorageScreen.tsx`に賞味期限順表示モード・「共有メンバーに通知する」ボタンを追加、`FoodItemCard.tsx`に保管場所バッジ追加
  - `useNotificationDeepLink.ts`（通知タップ遷移）、`App.js`に各フックを配線
  - `PushTokenService.ts`・`PushNotificationService.ts`（Expo Push直接送信・レート制限）+テスト
  - Detox E2E: 賞味期限順表示のローカル完結テストを`e2e/app.e2e.js`に追加
  - `e2e/manual/notifications.md`（手動テスト手順書）を新規作成
- 履歴タブ用の別Issue #15 を作成（#11から派生、Firestore権限・遷移導線は転用できるよう設計済み）
- 全69件のJest単体テストが成功（新規39件）
