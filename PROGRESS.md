# PROGRESS

最終更新: 2026-04-04

## 現在の状態
Issue #8 (Firebase Anonymous Auth) 実装完了。CIはまだ未実行。

## 次にやること
1. CIが成功することを確認（既存20テストがパスするか）
2. Issue #9: Firestore + CloudRepository の実装
   - `src/db/CloudRepository.ts` を追加（FoodRepositoryインターフェース実装）
   - Firestore の `food_items` コレクションに CRUD
3. Issue #10: 初回サインイン時のSQLite→Firestoreデータ移行
   - LocalRepository からデータ取得 → CloudRepository に全件書き込み
   - 移行完了フラグをAsyncStorageに保存
4. Google アカウントリンク機能（家族共有用）

## 判明した重要事項
- Firebase JS SDK v12（`@react-native-firebase` ではない）
- `./auth/react-native` サブパスは v12 に存在しない → `initializeAuth` + `inMemoryPersistence` で代替
  - auth状態はアプリ再起動ごとにリセットされ、毎回新しい匿名ユーザーが作成される
  - Issue #10 で AsyncStorage 永続化を追加する予定
- `firebaseConfig` ファイルは `.gitignore` 済み（テンプレートとして手元に残す）
- Firebase クライアントキーはソースコードに含めて問題ない（Firebase Security Rules でデータを守る）
- **ローカル Android ビルドの制約**（Windows + AGP 8.8.2 + NDK 27.1 問題）
  - AGP 8.8.2 が Prefab CLI に `--os-version 22` を渡すバグ（x86_64）
  - 回避策: `newArchEnabled=false` + `ndkPath` で `27.1.12297006-2` を指定
  - `android/build.gradle` の ndkPath はローカル専用（コミット不推奨）
- E2Eテスト: `device.launchApp({ delete: true })` でSQLiteを毎回リセット
- 20テスト全部CIでパス済み（Issue #7完了時点）

## 作業ログ
### 2026-04-04
- Issue #8: Firebase Anonymous Auth を実装
  - `npm install firebase` (v12.11.0)
  - `src/config/firebase.ts`: Firebase初期化・`initializeAuth`+`inMemoryPersistence`
  - `src/context/AuthContext.tsx`: `AuthProvider`・`useAuth`・匿名サインイン
  - `App.js`: `AuthProvider` でラップ
  - `firebaseConfig` を `.gitignore` に追加
- Issue #6: 賞味期限警告バッジ実装・E2Eテスト3件追加
- Issue #7: expo-sqlite永続化・LocalRepository実装・E2Eテスト修正（合計20テスト）
- パフォーマンス改善: React.memo + useCallback でFlatList再レンダリング防止

### 2026-04-05
- ローカル Android エミュレーターでの動作確認
- NDK 27.1 不完全インストール問題のデバッグと回避策を確立

### 以前のセッション
- Issue #2〜#5 が完了し、E2E テスト 17 件が CI で全通過済み
