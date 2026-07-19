import { clampSettingsToTier, FREE_TIER_LIMITS } from '../utils/notificationTier';
import { NotificationSettings } from '../types/notification';

describe('clampSettingsToTier', () => {
  it('無料プランは当日・時刻1つに強制収束する', () => {
    const settings: NotificationSettings = {
      enabled: true,
      isPremium: false,
      rules: [
        { offsetDays: 3, times: ['09:00', '18:00'] },
        { offsetDays: 0, times: ['12:00'] },
      ],
    };
    const clamped = clampSettingsToTier(settings);
    expect(clamped.rules).toEqual([{ offsetDays: FREE_TIER_LIMITS.maxOffsetDays, times: ['09:00'] }]);
  });

  it('無料プランでルールが空の場合はデフォルト時刻を使う', () => {
    const settings: NotificationSettings = { enabled: true, isPremium: false, rules: [] };
    const clamped = clampSettingsToTier(settings);
    expect(clamped.rules).toEqual([{ offsetDays: 0, times: ['09:00'] }]);
  });

  it('有料プランはそのまま返す', () => {
    const settings: NotificationSettings = {
      enabled: true,
      isPremium: true,
      rules: [
        { offsetDays: 3, times: ['09:00', '18:00'] },
        { offsetDays: 0, times: ['12:00'] },
      ],
    };
    expect(clampSettingsToTier(settings)).toBe(settings);
  });
});
