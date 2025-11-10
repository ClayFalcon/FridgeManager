# React Native/Expo E2Eテスト環境の分析と移行プラン

## 目次

1.  [背景](#背景)
2.  [現状の技術スタック](#現状の技術スタック)
3.  [E2Eテストの現状と問題点](#e2eテストの現状と問題点)
4.  [問題の原因分析](#問題の原因分析)
5.  [推奨構成](#推奨構成)
6.  [移行プラン](#移行プラン)

## 背景

本ドキュメントは、React
NativeとExpoを用いたモバイルアプリ開発プロジェクトにおけるエンドツーエンド（E2E）テスト環境について、直近の調査結果をもとに分析し、推奨される構成および移行プランを整理したものです。現在、Expo
SDKを使用したReact
Nativeアプリに対して**Detox**によるE2Eテストを導入していますが、テスト実行時に問題が発生しています。これによりCI/CD上の自動テストが機能せず、本番リリース前の品質確保に支障が出ている状況です。以下では技術スタックと現状を整理し、問題点の分析と解決に向けたプランを提示します。

## 現状の技術スタック

現在のプロジェクトで使用している主な技術スタックとそのバージョンは以下の通りです（2025年1月時点）:

- **React Native**: 0.79.6 （Expo SDK 54推奨は0.81.5）
- **Expo SDK**: \~54.0.0
- **Detox (E2Eテストフレームワーク)**: \^20.44.0
- **Jest (テストランナー)**: \^29.7.0
- **Android NDK**: 26.1.10909125
- **Hermes (JavaScriptエンジン)**: 有効化（`hermesEnabled=true`）

この構成で、TypeScript（\~5.8）やExpoモジュール（expo-modules-core
\^3.0.22）なども使用しています。ネイティブコードのビルドやHermesエンジンの利用のため、Android
NDKがインストール済みです。現在、React NativeはExpo SDK
54における推奨バージョンより古いため、Expoプラットフォームとの互換性に注意が必要な状態です。また、E2EテストにはDetox
20系を導入し、Jest（`jest-circus`ランナー）でテストを実行しています。

## E2Eテストの現状と問題点

**ユニットテスト**はJestを用いて正常に実行できており、全件パスしています。また、Androidアプリのビルドおよびエミュレータへのインストール、手動でのアプリ起動も成功しており、開発中のアプリ自体は正常に動作しています。しかし、**DetoxによるE2Eテスト**はすべて失敗している状況です。下表に現在のテスト結果をまとめます。

---

テスト種類 状態 結果

---

ユニットテスト ✅ 成功 6件すべてパス

APKビルド ✅ 成功 デバッグAPK生成完了

APKエミュレータ導入 ✅ 成功 エミュレータにインストール済み

手動APK起動 ✅ 成功 `adb`コマンドで起動可能

**Detox E2Eテスト** ❌ 失敗 6件すべて失敗（通信エラー）

---

E2Eテスト失敗時の主症状は、**テスト用アプリがDetoxと通信できずタイムアウトする**ことです。具体的には、すべてのE2Eテストケースで`device.launchApp()`の呼び出しがタイムアウトし、Detoxがテスト対象アプリからの応答を受け取れない状態です。ログには以下のようなエラーメッセージが記録されています。

    Failed to run application on the device
    HINT: ... timed out while it was waiting for "ready" message (over WebSocket) from the instrumentation process.

    Detox can't seem to connect to the test app(s)!
    The test app might have crashed prematurely, or has had trouble setting up the connection.

上記のとおり、「**Detox側からテストアプリに接続できない**」「**instrumentationプロセスからの"ready"メッセージを待っている間にタイムアウトした**」といったエラーが報告されています。このため、E2Eテストは全件失敗し、自動テストが完全に機能しない状態です。現在の問題は緊急度が高く、リリース前にこのE2Eテスト環境を修正する必要があります。

## 問題の原因分析

調査の結果、E2Eテストが失敗する原因として以下の点が浮かび上がりました。

1.  **Android側のDetox設定不備** -- **Detox用のインストルメンテーション
    (instrumentation)
    の設定不足が最も有力な原因**です。Androidテスト実行に必要な設定が`android/app/build.gradle`に欠落している可能性があります。特に`testInstrumentationRunner`**の指定がない**ため、Androidのテスト用APK
    (`app-debug-androidTest.apk`)
    が起動しても**Detoxが組み込むインストルメンテーションランナー**が実行されず、テストアプリからDetoxへの「ready」メッセージが送信されていないと考えられます。[\[1\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=defaultConfig%20,)この設定が無い場合、Detoxのテスト用WebSocketサーバーとの通信チャンネルが確立されません。

2.  **Detoxとアプリ間の通信（WebSocket）問題** --
    上記1に起因して、**Detoxとテストアプリ間のWebSocket接続が確立できない**症状が発生しています。本来、Detoxはネイティブ側（Android）のインストルメンテーションテストランナーを通じて、アプリ起動完了時に\"ready\"メッセージを受け取ります。しかしその通信が行われていないため、Detox側では接続エラーとしてタイムアウトしています。エラーログにある「instrumentation
    processが起動しない」「WebSocketサーバーが応答しない」といった記述は、この通信不全を示しています。

3.  **React Nativeバージョンの不整合** -- 現在使用中のReact Native
    0.79.6がExpo SDK
    54における推奨バージョン(0.81.5)より古いため、**バージョン非互換による予期せぬ不具合**の可能性も指摘されます[\[2\]](file://file-DTdzuLdhiztpQBMMNr5tEb#:~:text=3.%20React%20Native%200.79.6%E3%81%A8%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7%20,native%400.79.6%60%20%E3%81%AF%E4%BA%92%E6%8F%9B%E6%80%A7%E5%95%8F%E9%A1%8C%E3%81%AE%E5%8F%AF%E8%83%BD%E6%80%A7)。Expo
    SDKとReact
    Nativeのバージョン差異が大きい場合、ネイティブモジュールの動作やビルド設定に齟齬が生じ、Detoxとの連携にも影響を与えている可能性があります。特にReact
    Native 0.81ではAndroid 16（API
    36）対応など変更が加わっているため、0.79系との差分が無視できません。

4.  **その他の要因の検討** --
    上記が主因と考えられますが、念のため他の要素も検討しました。現在**Hermesエンジン**は有効ですが、Detox自体はHermes対応済みであり通常大きな問題にはならないと考えられます。また、**Expo固有の設定**（Expo
    ModulesやDev
    Clientの使用など）についても確認が必要ですが、ExpoはすでにBareワークフローでビルドされているため通常のReact
    Nativeアプリと同様にDetoxが機能するはずです。さらに**Androidビルド周り**では、GradleやKotlinの設定はDetox導入要件（AndroidX対応やKotlinプラグイン導入など）を満たしているか確認が必要です。今回のケースでは、プロジェクトにKotlinプラグインも導入済みで（ExpoのBareワークフローにより）、ビルド自体は成功していることから、大きな不足はなさそうです。

以上より、主な原因は**Android側のE2Eテスト用設定不足（特に**`testInstrumentationRunner`**の未設定）**であり、加えて**React
Nativeのバージョンアップによる環境整備**が必要と結論付けられました。

## 推奨構成

上記の分析を踏まえ、E2Eテストを安定稼働させるための**推奨構成**は次の通りです。各コンポーネントについて現在の状態と推奨される更新内容をまとめました。

---

コンポーネント 現在の状態 (2025/1) 推奨構成・対応

---

**React Native 本体** 0.79.6 **0.81.5** へアップデート（Expo SDK 54標準）

**Expo SDK** \~54.0.0 **54系を維持**（RN更新に合わせ再ビルド）※必要に応じて次期SDKも検討

**Detox (E2Eテスト)** \^20.44.0 **20系を維持**（※問題未解決なら19系への一時ダウングレード検討）

**Jest \^29.7.0 （jest-circus使用） **現行維持**（Detox公式サポートのJest設定を継続）
(テストランナー)**

**Androidビルド設定** `testInstrumentationRunner` **設定追加**（後述）によりDetox用インストルメンテーション有効化
**未設定** 等

**Android NDK** 26.1.10909125 **現行維持**（RN 0.81.xでも動作可。※将来Android
16対応でNDK更新検討）

**Hermesエンジン** 有効（hermesEnabled=true） **現行維持**（互換性良好。※必要時のみ無効化を検討）

---

**補足:** 上記の推奨構成では、Expo
SDK自体はバージョン据え置き（54系）の前提です。Expo SDK 54はReact Native
0.81系列を採用しているため、まずはRNを0.81.5へ引き上げてExpoとの整合性を取ります。またDetoxは最新の20系を基本としますが、Expoとの相性問題が解決しない場合にはDetox
19系（安定版）へのダウングレードも検討します。Androidのテスト設定については、次節で詳述するようにGradle設定への追記が必要です。

## 移行プラン

上記の推奨構成を実現し、問題を解決するための**移行プラン**を段階的に示します。開発チームは以下のステップに沿って対応を進めてください。

**ステップ1: Androidテスト設定の修正**\
まず最優先で、AndroidアプリのGradle設定に**Detox用インストルメンテーションの設定を追加**します。`android/app/build.gradle`の`defaultConfig`セクションに、以下の行を追記してください。

    defaultConfig {
        ...
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

この`testInstrumentationRunner`の指定により、Detoxのテスト実行時にAndroid側で**AndroidJUnitRunner
(AndroidX)**
が使用されるようになります[\[1\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=defaultConfig%20,)。これがないとテスト用APKが起動してもDetoxはアプリからの通知を受け取れません。必要に応じて、`testBuildType`の指定やDetox公式サンプルの`DetoxTest.java`クラスの配置も確認してください（通常、Detox導入時に`androidTest`ディレクトリに配置済みのはずです）。Gradle設定を変更したら、**Detox用APKの再ビルド**を行いましょう。例えば以下のコマンドでデバッグビルドとテストAPKを生成できます（プロジェクトでスクリプトが用意されている場合はそれを使用）:

    cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..

ビルド後、`android/app/build/outputs/apk/debug/androidTest/`に新しい`app-debug-androidTest.apk`が生成されていることを確認してください。続いて、エミュレータ上でDetoxのE2Eテストを実行し、**問題が解消するかテスト**します。`device.launchApp()`でタイムアウトせずアプリが起動し、テストケースが進行するか確認してください。

**ステップ2: React Nativeのアップグレード**\
ステップ1の対応後も問題が残る場合、または対応後であっても**根本的な安定性向上のため**に、React
Native自体のアップグレードを行います。Expo SDK 54に合わせ、**React
Nativeを0.79.6から0.81.5へ引き上げ**ます。アップグレード手順は以下の通りです。

- **パッケージの更新:**
  `package.json`内の`react-native`バージョンを0.81.5に変更し、`npm install`または`yarn install`を実行します。Expo環境の場合、`npx expo install react-native@0.81.5`を利用するとExpo推奨バージョンに沿ってインストールされます。
- **ネイティブプロジェクトの再構築:** Expo
  Bareワークフローでは、依存関係更新後に`expo prebuild`コマンドを再度実行するか、Androidプロジェクトを手動で調整する必要があります。`expo prebuild`を用いる場合、`app.json`にDetox用の設定プラグイン（`@config-plugins/detox`）を追加してから実行すると、自動的に上記ステップ1のGradle修正が適用される仕組みもあります。もっとも、既に手動でGradle修正を行っている場合は`prebuild`の実行に注意してください（ネイティブプロジェクトへの変更が上書きされる可能性があります）。代わりに、Android
  StudioでGradle同期を行い、新しいRNバージョンに伴うビルド設定の差分（compileSdkVersionの要件やNDKバージョン警告など）を適用します。
- **その他ライブラリの更新:** React
  Nativeのバージョンアップに合わせて、Expo関連ライブラリやその他の依存も最新版にアップデートします。特に`jest-expo`（Expo向けJestプリセット）や各種ExpoモジュールがRN0.81対応版に上がっているか確認してください。`npm outdated`等で主要パッケージのアップデートを確認し、Expo
  SDK 54の変更点（例えばReact 19対応）にも注意します。

React
Nativeをアップグレードしたら、**ユニットテストとE2Eテストを再度実行**して動作確認を行います。アップグレードに伴いAPIの変更や依存関係エラーが発生した場合は適宜修正します。特にAndroid側では、RN0.81で**Android
16 (API Level 36)**
サポートが導入されているため、NDKやビルドツール周りで警告が出る可能性があります。現行のNDK
r26で問題なければそのままで構いませんが、今後のGoogle
Playリリース要件（ネイティブコードの16KBページサイズ対応など）に備えてNDK
r27以降への更新も視野に入れてください。

**ステップ3: Detoxバージョンの検討**\
通常、Detox最新20系で上記対応は問題なく動作するはずですが、もし**依然としてDetox経由のテストが不安定**な場合、**Detoxのバージョンを一時的にダウングレード**することも検討します。Detox
20系はExpo環境でのセットアップに若干複雑さがあるため、実績のある19系（最終版19.\*\*）を使用することで安定するケースもあります[\[3\]](file://file-DTdzuLdhiztpQBMMNr5tEb#:~:text=%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B33%3A%20Detox%2019%E3%81%AB%E3%83%80%E3%82%A6%E3%83%B3%E3%82%B0%E3%83%AC%E3%83%BC%E3%83%89%20,20%E3%81%AE%E8%A4%87%E9%9B%91%E3%81%95%E3%82%92%E9%81%BF%E3%81%91%E3%82%8B%E3%81%9F%E3%82%81%E3%80%81%E5%AE%89%E5%AE%9A%E7%89%88%E3%81%AE19%E3%82%92%E4%BD%BF%E7%94%A8)。ダウングレードする場合は、`package.json`のDetoxバージョンを変更して再インストールし、設定ファイル（`e2e/config.json`や`.detoxrc.js`）のフォーマットが19系に合っているか確認してください。ただし、19系では新しい機能が利用できない点と、今後再アップグレードが必要になる点に留意してください。

**ステップ4: その他のデバッグ・最適化**\
上記主要対応後も問題が解決しない場合、引き続き以下のデバッグや最適化を行います。 -
**詳細ログの解析:** Androidエミュレータ上で`adb logcat`やAndroid
StudioのLogcatを用い、Detoxとアプリのやり取り（特に**WebSocket接続**）に関するログを確認します。`DetoxTest`インストルメンテーションが起動しているか、クラッシュしていないかをチェックしてください。 -
**ネットワークセキュリティ設定:**
Detoxはエミュレータのローカルホスト(10.0.2.2)と非暗号化通信を行うため、AndroidManifestでのネットワークセキュリティ設定（cleartext許可）が必要です[\[4\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=%23%206.%20Enable%20clear,traffic%20for%20Detox)[\[5\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=In%20the%20app%E2%80%99s%20)。ExpoのBareテンプレートでは既に設定済みですが、念のため`android/app/src/main/AndroidManifest.xml`内を確認し、`networkSecurityConfig`の適用が正しいか確認します。 -
**Hermesの無効化試験:**
稀なケースですが、Hermesエンジンを無効にすると挙動が改善する可能性もあります（Detox自体はHermes対応ですが、ネイティブモジュールの違いを見るため）。`android/gradle.properties`で`hermesEnabled=false`に設定しビルドし直すことで試験できます。ただしパフォーマンスへの影響があるため、最終的な解決策とするかは慎重に判断してください。 -
**CI設定更新:**
ローカル環境でテストが通るようになったら、CI/CDパイプライン上の設定も更新します。新しいGradle設定や依存関係を反映するため、CIのビルドスクリプト（Androidビルドやemulator起動、Detoxコマンド実行部分）を見直してください。また、Detox実行用にエミュレータの起動タイミングや`adb devices`の認識待ちなどCI特有のタイミング問題がないか確認します。必要に応じてDetoxの実行前にエミュレータを起動し安定するまで待機する処理や、CI上での環境変数設定（例えば`ANDROID_HOME`やNDKパス）を整備します。

以上のステップを順次実施することで、React
Native/ExpoアプリのE2Eテスト環境は正常化し、Detoxを用いた自動テストが安定して動作することが期待できます。ステップ1のGradle設定追加は特に重要で、これにより「ready」メッセージのやり取りが可能になり通信エラーは解消する見込みです。さらにReact
NativeのアップデートでExpoとの整合性を取り、不具合の温床を減らします。移行完了後は、再度全テストがグリーンで通過すること、そしてCI上でも同様にE2Eテストが安定実行できることを確認してください。

[\[1\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=defaultConfig%20,)
[\[4\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=%23%206.%20Enable%20clear,traffic%20for%20Detox)
[\[5\]](https://wix.github.io/Detox/docs/19.x/introduction/android/#:~:text=In%20the%20app%E2%80%99s%20)
Detox for Android \| Detox

<https://wix.github.io/Detox/docs/19.x/introduction/android/>

[\[2\]](file://file-DTdzuLdhiztpQBMMNr5tEb#:~:text=3.%20React%20Native%200.79.6%E3%81%A8%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7%20,native%400.79.6%60%20%E3%81%AF%E4%BA%92%E6%8F%9B%E6%80%A7%E5%95%8F%E9%A1%8C%E3%81%AE%E5%8F%AF%E8%83%BD%E6%80%A7)
[\[3\]](file://file-DTdzuLdhiztpQBMMNr5tEb#:~:text=%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B33%3A%20Detox%2019%E3%81%AB%E3%83%80%E3%82%A6%E3%83%B3%E3%82%B0%E3%83%AC%E3%83%BC%E3%83%89%20,20%E3%81%AE%E8%A4%87%E9%9B%91%E3%81%95%E3%82%92%E9%81%BF%E3%81%91%E3%82%8B%E3%81%9F%E3%82%81%E3%80%81%E5%AE%89%E5%AE%9A%E7%89%88%E3%81%AE19%E3%82%92%E4%BD%BF%E7%94%A8)
エラー状況

<file://file-DTdzuLdhiztpQBMMNr5tEb>
