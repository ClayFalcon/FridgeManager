/**
 * フィーチャーフラグ。
 *
 * NOTIFICATIONS_ENABLED: 通知機能全体（リモートプッシュ・ローカル通知・履歴タブ）の有効/無効。
 *   プッシュ通知は EAS プロジェクト設定（eas init）と実機2台でのテストが必要で、
 *   テスト環境が整うまでリリースのネックになるため false にして無効化している。
 *   テストできる環境が整ったら true に戻すだけで、以下がまとめて復活する:
 *     - 「共有メンバーに通知する」ボタン + プッシュ送信（StorageScreen / PushNotificationService）
 *     - プッシュトークン登録（useRegisterPushToken）
 *     - 賞味期限リマインダーのローカル通知（useExpiryNotificationScheduler）
 *     - 設定画面の「通知設定」セクション（SettingsScreen）
 *     - 通知タップによる画面遷移（useNotificationDeepLink）
 *     - 履歴タブ（下部バー / HistoryScreen。通知実行時に履歴が記録されるため通知とセット）
 *   フラグを true に戻したら e2e/app.e2e.js の履歴タブE2E（無効前提のアサーション）も戻すこと。
 */
export const NOTIFICATIONS_ENABLED = false;
