import { NotificationSettings } from '../types/notification';

/** 無料プランで許可される通知設定の上限 */
export const FREE_TIER_LIMITS = {
  maxOffsetDays: 0,
  maxTimesPerRule: 1,
  maxRules: 1,
};

/** 無料プランの場合、当日・時刻1つだけに強制的に収束させる */
export function clampSettingsToTier(settings: NotificationSettings): NotificationSettings {
  if (settings.isPremium) return settings;

  const firstTime = settings.rules[0]?.times?.[0] ?? '09:00';

  return {
    ...settings,
    rules: [{ offsetDays: FREE_TIER_LIMITS.maxOffsetDays, times: [firstTime] }],
  };
}
