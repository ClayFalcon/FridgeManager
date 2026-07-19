# PROGRESS

最終更新: 2026-07-19

## 現在の状態

レシピタブ + 買い物リスト + ボトムタブバーの実装が完了（ローカルコミット済み・未push）。
- ボトムタブバー（自前実装、食品保管/レシピ。将来 #15 履歴タブを配列1行で追加可能）
- レシピCRUD + 在庫照合（作れる/不足n品バッジ、詳細で材料別の在庫状況）
- 買い物リスト（不足材料のワンタップ追加・手動追加・チェック・一括削除）
- データは食材と同じ2層構成（ローカルSQLite / Googleリンク時Firestore共有）。Googleリンク時の移行も対応
- 設定はタブ化せず⚙️ボタン遷移のまま（ユーザー方針: 今後そこに項目を充実させる）

その前のセッションで Issue #11（プッシュ通知）も実装完了・コミット済み（未push）。
Cloud Functions/Blazeは不使用（Expo Push直接呼び出し + ローカル通知 + Firestoreルールでレート制限）。

`npm run test:unit` は全102件成功。Detox E2E はレシピ・買い物リスト関連を14件追加（CIで実行）。

## 次にやること

1. 未pushコミット群（#11プッシュ通知 + レシピ機能5コミット）をpushしてCI（unit/e2e）の成功を確認
2. プッシュ通知のユーザー側手動セットアップ:
   - `eas init` で EAS プロジェクトを作成し `app.json` の `extra.eas.projectId` を埋める
   - `firebase init firestore`（または `firebase.json`/`.firebaserc` を手動作成）→ `firebase deploy --only firestore:rules`
3. Android実機でプッシュ通知の動作確認（`e2e/manual/notifications.md`）→ 確認後 Issue #11 をクローズ
4. レシピ機能をエミュレータで動作確認（タブ切替・バッジ・CRUD・買い物リスト）
5. 残タスク: Issue #12（設定画面の項目充実: ステータスモード切替等）、#13（テーマカラー）、#15（履歴タブ）

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

### 2026-07-19（レシピタブ）
- レシピタブ・買い物リスト・ボトムタブバーを実装（5コミットに分割）
  - 型 + `recipeMatching.ts`（NFKC正規化・在庫照合の純粋関数）
  - リポジトリ層（Local/Cloud × Recipe/Shopping、`initialRecipes.json` シード3件、
    `MigrationService` ジェネリック化、`firestore.rules` に recipes/shopping_items 追加）
  - `BottomTabBar` + `App.js` タブ統合（設定は⚙️遷移のまま。通知ディープリンクは食品保管タブへ）
  - `RecipeScreen`（セグメント切替: レシピ/買い物リスト）+ `RecipeCard`/`RecipeFormModal`/
    `RecipeDetailModal`/`ShoppingListView`
  - ID採番は再起動時の主キー衝突を避けるため `Date.now()` 起点の連番（食品の `nextId=100` 方式は不採用）
  - Jest 44件追加（全102件）、Detox E2E 14件追加
- 設計判断: 買い物リストはレシピタブ内セグメント（第3タブにしない）。レシピデータモデルは
  Reizoukoより大幅簡素化（材料は `{name, quantity?}` のみ、難易度・必須/任意区分なし）

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
