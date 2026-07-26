jest.mock('expo-sqlite', () => {
  const db = {
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  };
  return { openDatabaseSync: jest.fn(() => db), __mockDb: db };
});

import * as SQLite from 'expo-sqlite';
import { getAppSettings, saveAppSettings } from '../db/AppSettingsStore';
import { DEFAULT_APP_SETTINGS } from '../types/appSettings';

const mockDb = (
  SQLite as unknown as {
    __mockDb: { execSync: jest.Mock; getFirstSync: jest.Mock; runSync: jest.Mock };
  }
).__mockDb;

describe('AppSettingsStore', () => {
  beforeEach(() => {
    mockDb.execSync.mockClear();
    mockDb.getFirstSync.mockReset();
    mockDb.runSync.mockClear();
  });

  describe('getAppSettings', () => {
    it('テーブルが空の場合はデフォルト（3段階）を返す', () => {
      mockDb.getFirstSync.mockReturnValue(null);
      expect(getAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
    });

    it('保存済みのステータスモードを読み込む', () => {
      mockDb.getFirstSync.mockReturnValue({ status_mode: '2step' });
      expect(getAppSettings()).toEqual({ statusMode: '2step' });
    });
  });

  describe('saveAppSettings', () => {
    it('status_modeをUPSERTする', () => {
      saveAppSettings({ statusMode: '2step' });
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO app_settings'),
        '2step',
      );
    });
  });

  it('保存→取得の往復', () => {
    saveAppSettings({ statusMode: '2step' });
    const [, statusModeArg] = mockDb.runSync.mock.calls[0];
    mockDb.getFirstSync.mockReturnValue({ status_mode: statusModeArg });
    expect(getAppSettings()).toEqual({ statusMode: '2step' });
  });
});
