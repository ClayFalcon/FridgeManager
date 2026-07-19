jest.mock('expo-sqlite', () => {
  const db = {
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  };
  return { openDatabaseSync: jest.fn(() => db), __mockDb: db };
});

import * as SQLite from 'expo-sqlite';
import { getSettings, saveSettings } from '../db/NotificationSettingsStore';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../types/notification';

const mockDb = (SQLite as unknown as { __mockDb: { execSync: jest.Mock; getFirstSync: jest.Mock; runSync: jest.Mock } }).__mockDb;

describe('NotificationSettingsStore', () => {
  beforeEach(() => {
    mockDb.execSync.mockClear();
    mockDb.getFirstSync.mockReset();
    mockDb.runSync.mockClear();
  });

  describe('getSettings', () => {
    it('テーブルが空の場合はデフォルト設定を返す', () => {
      mockDb.getFirstSync.mockReturnValue(null);

      expect(getSettings()).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    });

    it('保存済みの設定を読み込める', () => {
      mockDb.getFirstSync.mockReturnValue({
        enabled: 0,
        is_premium: 1,
        rules: JSON.stringify([{ offsetDays: 3, times: ['09:00'] }]),
      });

      expect(getSettings()).toEqual({
        enabled: false,
        isPremium: true,
        rules: [{ offsetDays: 3, times: ['09:00'] }],
      });
    });
  });

  describe('saveSettings', () => {
    it('enabled/isPremium/rulesを正しい形式でUPSERTする', () => {
      saveSettings({
        enabled: true,
        isPremium: false,
        rules: [{ offsetDays: 0, times: ['09:00'] }],
      });

      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_settings'),
        1,
        0,
        JSON.stringify([{ offsetDays: 0, times: ['09:00'] }]),
      );
    });
  });

  describe('保存→取得の往復', () => {
    it('saveSettingsで書き込んだ内容をgetSettingsで再現できる', () => {
      const settings = {
        enabled: false,
        isPremium: true,
        rules: [{ offsetDays: 1, times: ['08:00', '20:00'] }],
      };

      saveSettings(settings);
      const [, enabledArg, isPremiumArg, rulesArg] = mockDb.runSync.mock.calls[0];
      mockDb.getFirstSync.mockReturnValue({
        enabled: enabledArg,
        is_premium: isPremiumArg,
        rules: rulesArg,
      });

      expect(getSettings()).toEqual(settings);
    });
  });
});
