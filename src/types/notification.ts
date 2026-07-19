export interface ExpiryNotificationRule {
  /** 賞味期限の何日前に通知するか。0 = 当日 */
  offsetDays: number;
  /** 'HH:mm' 形式の通知時刻の配列 */
  times: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  isPremium: boolean;
  rules: ExpiryNotificationRule[];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  isPremium: false,
  rules: [{ offsetDays: 0, times: ['09:00'] }],
};
