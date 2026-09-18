# 🧊 FridgeManager - 冷蔵庫管理アプリ

家族や同居者が冷蔵庫の中身をリアルタイムで共有し、買い物の重複を防ぎ、食品の無駄を減らすことを目的とした冷蔵庫管理アプリケーション。

## 📱 アプリ概要

### 🎯 目的
- **リアルタイム共有**: 別端末でも冷蔵庫の中身を即座に確認可能
- **重複購入防止**: 買い物前に在庫状況を確認
- **食品管理**: 賞味期限管理で食品ロス削減
- **シンプル操作**: スライド操作で簡単に在庫状況更新

### 👥 ターゲットユーザー
- 家族（夫婦、親子）
- 子育て世代
- ルームメイト
- 複数人で生活を共にする人々

## 🏗️ アプリ機能

### コア機能

#### 🧊 冷蔵庫管理
- **4つの保管場所**: 冷蔵庫、野菜室、冷凍庫、パントリー
- **食品テンプレート**: 各保管場所に適した定番食品を事前配置
- **在庫ステータス管理**: 
  - 3段階: 「全くない」「ちょっとある」「買ったばかり」
  - 2段階: 「ある」「ない」（設定で切り替え可能）

#### 🍎 食品管理
- **カテゴリ分類**: 野菜、肉、魚、乳製品、調味料、飲料など
- **賞味期限管理**: 自動入力ポップアップ（スキップ可能）
- **食品アイコン**: フリー素材の絵文字・イラスト

#### 👤 ユーザー管理
- **招待システム**: 
  - 招待URL生成（LINE等で共有）
  - ユーザーコードによる同期リクエスト
- **権限管理**: 全員が編集可能（将来的に権限設定予定）

### 🔔 通知機能
- **更新通知**: 他のユーザーが在庫状況を更新した時
- **賞味期限通知**: 朝9:00頃に賞味期限1日前の食品を通知
- **設定可能項目**: 通知時刻、何日前に通知するか

### 🚀 将来実装予定機能
- **家計管理**: 月々の食品費記録・予算管理
- **買い物リスト**: 必需品リストから自動生成
- **レシピ機能**: 在庫食品の組み合わせで料理提案

## 🔧 技術スタック

### 📱 フロントエンド
| 技術 | バージョン | 用途 |
|------|------------|------|
| **React Native** | 0.76.5 | モバイルアプリフレームワーク |
| **Expo** | ^53.0.0 | 開発・ビルド・配布プラットフォーム |
| **React** | 18.2.0 | UIライブラリ |
| **TypeScript** | ~5.8.3 | 型安全なJavaScript |
| **Expo Router** | ~3.4.7 | ファイルベースルーティング |

### 🎨 UI/UX ライブラリ
| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| **@expo/vector-icons** | ^14.0.0 | アイコンセット |
| **@gorhom/bottom-sheet** | ^5.2.6 | ボトムシートUI |
| **@shopify/flash-list** | ^2.0.3 | 高性能リスト表示 |
| **react-native-gesture-handler** | ~2.16.2 | ジェスチャー処理 |
| **react-native-reanimated** | ~3.16.1 | アニメーション |
| **react-native-safe-area-context** | ~4.10.5 | セーフエリア対応 |
| **react-native-screens** | ~3.36.0 | ネイティブ画面最適化 |

### 🔥 バックエンド・データ
| サービス | バージョン | 用途 |
|----------|------------|------|
| **Firebase** | ^12.2.1 | バックエンドサービス |
| **Firestore** | - | NoSQLデータベース |
| **Firebase Auth** | - | ユーザー認証 |
| **Firebase Cloud Messaging** | - | プッシュ通知 |

### 🛠️ 状態管理・データ処理
| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| **Zustand** | ^5.0.8 | 状態管理 |
| **@tanstack/react-query** | ^5.87.4 | サーバー状態管理 |
| **react-hook-form** | ^7.62.0 | フォーム管理 |
| **use-debounce** | ^10.0.6 | デバウンス処理 |

### 🧪 テスト・品質保証
| ツール | バージョン | 用途 |
|--------|------------|------|
| **Jest** | ^29.7.0 | ユニットテスト |
| **Detox** | ^20.44.0 | E2Eテスト |
| **Playwright** | - | Web E2Eテスト |
| **@testing-library/react-native** | ^13.3.3 | React Nativeテスト |

### 🔨 開発・ビルドツール
| ツール | バージョン | 用途 |
|--------|------------|------|
| **@expo/cli** | 0.10.17 | Expo開発ツール |
| **Babel** | ^7.25.2 | JavaScript変換 |
| **EAS Build** | - | クラウドビルド |
| **cross-env** | ^10.0.0 | 環境変数管理 |

## 📁 プロジェクト構造

```
Reizouko/
├── app/                           # Expo Router アプリケーション
├── src/                           # アプリケーションロジック
│   └── lib/
│       └── firebase.ts           # Firebase初期化・設定
├── firebase/                      # Firebase設定ファイル
│   ├── firestore.rules           # Firestoreセキュリティルール
│   ├── firestore.production.rules # 本番環境ルール
│   └── firestore.indexes.json    # データベースインデックス
├── tests/                         # テストファイル
│   ├── e2e/                      # E2Eテスト
│   ├── cases/                    # テストケース
│   └── generated/                # 生成されたテストレポート
├── scripts/                      # 自動化スクリプト
├── documents/                    # プロジェクトドキュメント
├── android/                      # Androidネイティブコード
├── artifacts/                    # Detoxテスト結果
├── .env.development             # 開発環境用環境変数
├── .env.production              # 本番環境用環境変数
├── app.config.ts                # Expo設定
├── detox.config.js              # Detox設定
├── eas.json                     # EAS Build設定
└── package.json                 # 依存関係・スクリプト
```

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.development`ファイルにFirebase設定値を入力してください。

### 3. アプリ起動
```bash
npm run start:dev      # 開発環境
npm run start:prod     # 本番環境
```

詳細な手順は [QUICKSTART.md](./QUICKSTART.md) を参照してください。

## 🛠️ 利用可能なスクリプト

### 📱 開発・本番環境
```bash
npm run start:dev      # 開発環境起動
npm run start:prod     # 本番環境起動
npm run android        # Android実機/エミュレーター起動
npm run ios           # iOS実機/シミュレーター起動
npm run web           # Web版起動
```

### 🔥 Firebase操作
```bash
npm run firebase:use:dev           # 開発プロジェクトに切り替え
npm run firebase:use:prod          # 本番プロジェクトに切り替え
npm run firebase:deploy:rules:dev  # 開発環境にルールデプロイ
npm run firebase:deploy:rules:prod # 本番環境にルールデプロイ
npm run firebase:emulators         # ローカルエミュレーター起動
```

### 📦 ビルド・配布
```bash
npm run build:android:dev    # Android開発版ビルド
npm run build:android:prod   # Android本番版ビルド
npm run build:ios:dev        # iOS開発版ビルド
npm run build:ios:prod       # iOS本番版ビルド
```

### 🧪 テスト
```bash
npm run test:unit            # ユニットテスト
npm run test:e2e             # Web E2Eテスト
npm run test:detox:build     # Detox Androidビルド
npm run test:detox:test      # Detox Androidテスト
npm run test:detox:ios:build # Detox iOSビルド
npm run test:detox:ios:test  # Detox iOSテスト
npm run test:all             # 全テスト実行
npm run test:coverage        # カバレッジレポート生成
```

### 🔧 ユーティリティ
```bash
npm run check:env            # 環境設定チェック
npm run test:manual:start    # 手動テスト開始
npm run test:generate        # テストケース生成
```

## 🔥 Firebase連携

### 使用サービス
- **Firestore** - データベース（リアルタイム同期）
- **Authentication** - ユーザー認証（メール認証）
- **Cloud Messaging** - プッシュ通知
- **Analytics** - 使用状況分析
- **Crashlytics** - クラッシュレポート

### 環境分離
- `reizouko-dev` - 開発環境
- `reizouko-prod` - 本番環境

### データベース設計
- **Users** - ユーザー情報・設定
- **Refrigerators** - 冷蔵庫情報・メンバー管理
- **FoodItems** - 食品情報・在庫状況
- **Invitations** - 招待管理

## 📊 対応プラットフォーム

| プラットフォーム | 最小バージョン | 配布方法 |
|------------------|----------------|----------|
| **iOS** | iOS 13.0以上 | App Store |
| **Android** | Android 8.0以上 (API 26) | Google Play |
| **Web** | モダンブラウザ | Firebase Hosting |

## 🔐 セキュリティ・認証

### 認証方式
- **Firebase Authentication** + メールアドレス認証
- セキュアなトークンベース認証
- 招待システムによる家族アカウント管理

### データ保護
- Firestoreセキュリティルールによるアクセス制御
- 家族メンバーのみデータアクセス可能
- 招待承認後のみデータ同期

## 📚 ドキュメント

- [DEVELOPMENT_FLOW.md](./DEVELOPMENT_FLOW.md) - 開発フロー
- [DETOX_CI_SETUP.md](./DETOX_CI_SETUP.md) - Detox自動テストとCI/CD設定
- [RELEASE_AUTOMATION.md](./RELEASE_AUTOMATION.md) - リリース・バージョンアップ自動化
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 開発フロー完全ガイド
- [QUICKSTART.md](./QUICKSTART.md) - クイックスタートガイド
- [SPECIFICATION.md](./SPECIFICATION.md) - 詳細仕様書
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase設定手順
- [DevSetUp.md](./DevSetUp.md) - 開発環境セットアップ
- [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) - 手動テストチェックリスト
- [DETOX_STABLE_VERSION_ANALYSIS.md](./DETOX_STABLE_VERSION_ANALYSIS.md) - Detox安定化分析

## 🆘 サポート・トラブルシューティング

### よくある問題
1. **Firebase接続エラー** - 環境変数ファイルの設定確認
2. **ビルドエラー** - Node.js・npmバージョン確認
3. **テスト失敗** - Androidエミュレーター・iOSシミュレーター起動確認

### 開発環境要件
- **Node.js**: 18.x以上
- **npm**: 9.x以上
- **Android Studio**: 最新版（Android開発時）
- **Xcode**: 最新版（iOS開発時）

## 📄 ライセンス・著作権

このプロジェクトはプライベートプロジェクトです。

---

**開発者**: Terrastrix  
**最終更新**: 2025年1月27日  
**バージョン**: 1.0.0  
**ステータス**: 開発中
