# リリース手順（Android / Google Play）

このドキュメントは FridgeManager を Google Play にリリースするための手順書です。
コード側の準備（リリース署名の仕組み・Firestoreデプロイ設定）は済んでいるので、
以下の**手動作業**を上から順に実施してください。

前提:
- このアプリは EAS を使わず、ローカルの `gradlew` で直接ビルドします（bare workflow）。
- 通知機能はフィーチャーフラグ（`src/config/features.ts` の `NOTIFICATIONS_ENABLED=false`）で
  無効化中です。実機2台でテストできる環境が整ったら `true` に戻して再ビルドしてください。
- コマンドは Git Bash（プロジェクトルート `C:\Users\hayab\git\FridgeManager`）想定です。

---

## 1. リリース用キーストアの生成（必須・一度だけ）

> **重要**: このキーストアは今後のアプリ更新すべてに必要です。**紛失すると同じアプリとして更新できなくなります**。
> 必ず安全な場所（パスワード管理ツール等）にバックアップしてください。パスワードも同様。

### 1-1. キーストアを生成する

`keytool` は JDK に含まれます。JDKのbinにパスが通っていない場合は `where keytool`（PowerShell）や
`$JAVA_HOME/bin/keytool` で場所を確認してください。プロジェクトルートで実行:

```bash
keytool -genkeypair -v -storetype JKS \
  -keystore android/app/upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

対話で以下を聞かれます:
- キーストアのパスワード（2回）… 控えておく
- 姓名・組織などの情報（適当でよいが後で変更不可）
- 鍵のパスワード（キーストアと同じでよい場合はEnter）

> `android/app/upload-keystore.jks` と、後述の `android/keystore.properties` は
> `.gitignore` 済みでコミットされません（秘密情報のため）。

### 1-2. keystore.properties を作成する

テンプレートをコピーして値を記入:

```bash
cp android/keystore.properties.example android/keystore.properties
```

`android/keystore.properties` をエディタで開き、1-1で決めた値に書き換える:

```properties
storeFile=app/upload-keystore.jks
storePassword=（キーストアのパスワード）
keyAlias=upload
keyPassword=（鍵のパスワード）
```

このファイルが存在すると、release ビルドが自動的にこのキーストアで署名されます
（存在しなければ debug 署名にフォールバックするので、開発・CIには影響しません）。

---

## 2. Firestore セキュリティルールのデプロイ（必須）

> ルールが未反映だと、DBが「全拒否」または「無防備」の状態になり得ます。
> `firestore.rules` はリポジトリにあり、`firebase.json` / `.firebaserc`（プロジェクト `fridgemanager-64c00`）も
> 用意済みなので、以下を実行するだけです。

```bash
# Firebase CLI 未インストールなら
npm install -g firebase-tools

# ブラウザが開くのでプロジェクトの権限を持つGoogleアカウントでログイン
firebase login

# ルールをデプロイ
firebase deploy --only firestore:rules
```

デプロイ後、Firebase Console → Firestore Database → ルール で反映を確認してください。

---

## 3. リリース署名証明書を Google 認証に登録（共有機能を使うなら必須）

release キーストアで署名したアプリでは、debug 証明書向けの現在の Google Client ID では
**Googleサインインが失敗します**。release 証明書の SHA-1 を登録し直す必要があります。

### 3-1. release キーストアの SHA-1 / SHA-256 を取得

```bash
keytool -list -v -keystore android/app/upload-keystore.jks -alias upload
```

出力の `SHA1:` と `SHA256:` の値をコピーします。

### 3-2. Firebase に登録

1. [Firebase Console](https://console.firebase.google.com/) → プロジェクト `fridgemanager-64c00`
2. ⚙️ プロジェクトの設定 → 「マイアプリ」の Android アプリ（`com.clayfalcon.fridgemanager`）
3. 「フィンガープリントを追加」→ 3-1 の **SHA-1** を貼り付け（SHA-256も推奨）→ 保存
4. `google-services.json` を使っていれば再ダウンロード（このアプリは firebase.ts に直書きのため不要）

### 3-3. Android用 OAuth クライアントIDの確認

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → プロジェクト `fridgemanager-64c00`
2. 「OAuth 2.0 クライアント ID」に、パッケージ名 `com.clayfalcon.fridgemanager` +
   release の SHA-1 に対応する **Android タイプ** のクライアントがあることを確認
   （Firebaseでフィンガープリント登録すると自動生成される場合があります。無ければ手動作成）
3. `.env` の `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` が上記Androidクライアントを指しているか確認
   （Web Client ID `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` は変更不要）

> **確認方法**: release ビルドを実機に入れ、「家族と共有する」でGoogleサインインが通ることを必ず確認。
> 失敗する場合はほぼ SHA-1 の不一致です。

---

## 4. プライバシーポリシー（必須）

Google/匿名認証でユーザーデータ（食材・共有グループ情報・Googleアカウントのメール）を扱うため、
Google Play はプライバシーポリシーURLを要求します。

1. プライバシーポリシーを作成（最低限: 収集するデータ=食材データ・アカウント情報・共有相手のデータ、
   保存先=Google Firebase、第三者提供なし、問い合わせ先）
2. 公開URLを用意（GitHub Pages / Google サイト / Notion 公開ページ 等でOK）
3. Play Console の「ストアの設定」とデータセーフティで URL を登録

---

## 5. AAB（App Bundle）のビルドと Play Console 提出（必須）

### 5-1. リリースビルド

1〜2（署名・ルール）完了後、プロジェクトルートで:

```bash
cd android && ./gradlew.bat bundleRelease
```

成果物: `android/app/build/outputs/bundle/release/app-release.aab`

> 署名が正しいか確認するには `./gradlew.bat :app:signingReport` を実行し、
> `Variant: release` の `Store` が `upload-keystore.jks` になっていることを確認。

### 5-2. Play Console

1. [Google Play Console](https://play.google.com/console/) でアプリを新規作成
2. アプリ内容の申告（対象年齢・データセーフティ・コンテンツのレーティング・広告の有無）
3. ストア掲載情報（アプリ名・説明・スクリーンショット各サイズ・アイコン512px・フィーチャーグラフィック1024x500）
4. 「テスト」→「内部テスト」トラックに AAB をアップロード（いきなり製品版より内部テスト推奨）
5. 審査提出 → 承認後に公開範囲を拡大

> **バージョン更新時**: `android/app/build.gradle` の `versionCode`（現在1）を必ず+1、
> `versionName`（現在1.0.0）も適宜更新してから再ビルド。

---

## 補足・任意対応

- **未使用の通知権限**: `app.json` に `expo-notifications` プラグインが残っており、
  Androidに `POST_NOTIFICATIONS` 権限が注入されます（通知はフラグで無効化中のため実際には使いません）。
  権限をクリーンにしたい場合はプラグイン行を一時的に外して `npx expo prebuild --platform android` で
  android/ を再生成できますが、通知を再有効化する予定なら残しておくのが簡単です。
- **通知機能の再有効化**: `src/config/features.ts` の `NOTIFICATIONS_ENABLED` を `true` にし、
  `eas init` で `app.json` の `extra.eas.projectId` を設定 → 再ビルド。詳細は `e2e/manual/notifications.md`。
