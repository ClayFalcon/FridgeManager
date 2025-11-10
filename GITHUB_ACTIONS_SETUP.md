# GitHub Actions E2Eテスト設定ガイド

このドキュメントでは、GitHub ActionsでDetox E2Eテストを実行するための設定手順を説明します。

## 📋 概要

GitHub Actionsのワークフローファイル（`.github/workflows/ci.yml`）を作成しました。このワークフローは以下のジョブを実行します：

1. **ユニットテスト**: Jestによるユニットテストの実行
2. **Detox Androidテスト**: AndroidエミュレータでのE2Eテスト
3. **Detox iOSテスト**: iOSシミュレータでのE2Eテスト（オプション）
4. **コード品質チェック**: ESLint、TypeScriptチェック、フォーマットチェック

## 🔧 GitHub上で必要な設定

### 1. リポジトリの設定確認

GitHubリポジトリの設定を確認してください：

1. リポジトリの **Settings** → **Actions** → **General** に移動
2. **Workflow permissions** が **Read and write permissions** に設定されていることを確認
3. **Allow GitHub Actions to create and approve pull requests** を有効化（オプション）

### 2. ブランチ保護ルールの設定（推奨）

mainブランチにプッシュする前に、CIテストが通ることを必須にする設定：

1. リポジトリの **Settings** → **Branches** に移動
2. **Add rule** をクリック
3. **Branch name pattern** に `main` を入力
4. **Require status checks to pass before merging** にチェック
5. 以下のステータスチェックを必須にする：
   - `unit-tests`
   - `detox-android`
   - `code-quality`

### 3. シークレットの設定（必要に応じて）

現在のワークフローでは、シークレットは不要です。将来的に以下のシークレットが必要になる場合があります：

#### Firebase設定（将来必要になる場合）

1. リポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリック
3. 以下のシークレットを追加（必要に応じて）：
   - `FIREBASE_API_KEY`: Firebase APIキー
   - `FIREBASE_AUTH_DOMAIN`: Firebase認証ドメイン
   - `FIREBASE_PROJECT_ID`: FirebaseプロジェクトID
   - `FIREBASE_STORAGE_BUCKET`: Firebaseストレージバケット
   - `FIREBASE_MESSAGING_SENDER_ID`: Firebaseメッセージング送信者ID
   - `FIREBASE_APP_ID`: FirebaseアプリID

#### Codecov設定（カバレッジレポート用、オプション）

1. [Codecov](https://codecov.io/) にアカウントを作成
2. リポジトリをCodecovに接続
3. Codecovトークンを取得
4. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
5. `CODECOV_TOKEN` という名前でシークレットを追加

## 🚀 ワークフローの動作

### トリガー

以下のイベントでワークフローが実行されます：

- `main` または `develop` ブランチへのプッシュ
- `main` ブランチへのプルリクエスト

### ジョブの説明

#### 1. unit-tests

- **実行環境**: Ubuntu Latest
- **実行内容**:
  - ユニットテストの実行
  - カバレッジレポートの生成
  - Codecovへのアップロード（オプション）

#### 2. detox-android

- **実行環境**: Ubuntu Latest
- **実行内容**:
  - Android SDKのセットアップ
  - Androidエミュレータの起動（API 36）
  - Androidアプリのビルド
  - Detox E2Eテストの実行
- **タイムアウト**: 30分

#### 3. detox-ios

- **実行環境**: macOS 14
- **実行内容**:
  - CocoaPods依存関係のインストール
  - iOSアプリのビルド
  - Detox E2Eテストの実行
- **タイムアウト**: 30分
- **注意**: iOSテストは現在 `continue-on-error: true` が設定されているため、失敗してもワークフローは続行されます

#### 4. code-quality

- **実行環境**: Ubuntu Latest
- **実行内容**:
  - ESLintによるコード品質チェック
  - TypeScriptの型チェック
  - Prettierによるフォーマットチェック
- **注意**: 各チェックは `continue-on-error: true` が設定されているため、失敗してもワークフローは続行されます

## 🔍 トラブルシューティング

### Androidテストが失敗する場合

1. **エミュレータの起動エラー**
   - エミュレータの起動に時間がかかっている可能性があります
   - タイムアウト時間を延長するか、エミュレータの設定を確認してください

2. **ビルドエラー**
   - Android SDKのバージョンを確認してください
   - `android/gradle.properties` の設定を確認してください

3. **Detox接続エラー**
   - 現在のWebSocket接続エラーが解消されていない可能性があります
   - ローカル環境でテストが成功することを確認してから、CI環境で実行してください

### iOSテストが失敗する場合

1. **CocoaPodsエラー**
   - `ios/Podfile` の設定を確認してください
   - CocoaPodsのバージョンを確認してください

2. **Xcodeビルドエラー**
   - Xcodeのバージョンを確認してください
   - iOSシミュレータの設定を確認してください

### ワークフローが実行されない場合

1. **ブランチ名の確認**
   - ワークフローは `main` または `develop` ブランチへのプッシュ、または `main` へのPRでのみ実行されます
   - 他のブランチでは実行されません

2. **ワークフローファイルの場所**
   - `.github/workflows/ci.yml` が正しい場所にあることを確認してください

3. **GitHub Actionsの有効化**
   - リポジトリの **Settings** → **Actions** で、GitHub Actionsが有効になっていることを確認してください

## 📝 次のステップ

1. **ブランチをプッシュ**
   ```bash
   git push origin feature/github-actions-e2e-test
   ```

2. **プルリクエストを作成**
   - GitHub上でプルリクエストを作成
   - ワークフローが自動的に実行されることを確認

3. **ワークフローの結果を確認**
   - プルリクエストページの **Checks** タブで結果を確認
   - 失敗した場合は、ログを確認して問題を特定

4. **必要に応じて設定を調整**
   - エラーが発生した場合は、ワークフローファイルを修正
   - タイムアウト時間や環境変数を調整

## ⚠️ 注意事項

- **iOSテスト**: 現在、iOSテストは `continue-on-error: true` が設定されているため、失敗してもワークフローは続行されます。iOSテストを必須にする場合は、この設定を削除してください。

- **Detox接続エラー**: 現在、ローカル環境でDetoxのWebSocket接続エラーが発生しています。この問題が解消されるまで、CI環境でのテストも失敗する可能性があります。

- **実行時間**: E2Eテストは時間がかかります。特にAndroidエミュレータの起動には数分かかることがあります。

- **コスト**: GitHub Actionsの無料枠は月2000分です。E2Eテストは時間がかかるため、実行頻度に注意してください。

- **CI環境用設定**: CI環境では、`android.emu.debug.ci` という設定を使用します。この設定は、CI環境用のエミュレータ（`test_avd`）を使用するように設定されています。ローカル環境では、引き続き `android.emu.debug` 設定を使用してください。

## 🔗 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Detox ドキュメント](https://wix.github.io/Detox/)
- [reactivecircus/android-emulator-runner](https://github.com/reactivecircus/android-emulator-runner)
- [Codecov ドキュメント](https://docs.codecov.com/)

---

**最終更新**: 2025年1月28日  
**作成者**: Auto (AI Assistant)

