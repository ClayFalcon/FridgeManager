jest.mock('expo-sqlite', () => {
  const db = {
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
    runSync: jest.fn(),
  };
  return { openDatabaseSync: jest.fn(() => db), __mockDb: db };
});

import * as SQLite from 'expo-sqlite';
import { LocalRepository } from '../db/LocalRepository';
import { FoodItem } from '../types/food';

const mockDb = (
  SQLite as unknown as {
    __mockDb: {
      execSync: jest.Mock;
      getFirstSync: jest.Mock;
      getAllSync: jest.Mock;
      runSync: jest.Mock;
    };
  }
).__mockDb;

describe('LocalRepository', () => {
  beforeEach(() => {
    mockDb.execSync.mockReset();
    mockDb.getFirstSync.mockReset();
    mockDb.getAllSync.mockReset();
    mockDb.runSync.mockClear();
    mockDb.getFirstSync.mockReturnValue({ count: 1 });
  });

  it('初期化で default_expiry_days のマイグレーション（ALTER TABLE）を試みる', () => {
    new LocalRepository();

    expect(mockDb.execSync).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE food_items ADD COLUMN default_expiry_days'),
    );
  });

  it('カラムが既に存在してALTER TABLEが失敗しても初期化は成功する', () => {
    mockDb.execSync.mockImplementation((sql: string) => {
      if (sql.includes('ALTER TABLE')) throw new Error('duplicate column name');
    });

    expect(() => new LocalRepository()).not.toThrow();
  });

  it('getAllが default_expiry_days を defaultExpiryDays にマップして返す', async () => {
    mockDb.getAllSync.mockReturnValue([
      {
        id: '1',
        name: '牛乳',
        icon: '🥛',
        stock_level: 2,
        expiry_date: '2026-04-08',
        tags: '["乳製品"]',
        location: 'fridge',
        default_expiry_days: 7,
      },
      {
        id: '2',
        name: 'ハム',
        icon: null,
        stock_level: 1,
        expiry_date: null,
        tags: '[]',
        location: 'fridge',
        default_expiry_days: null,
      },
    ]);

    const repo = new LocalRepository();
    const items = await repo.getAll();

    expect(items[0].defaultExpiryDays).toBe(7);
    expect(items[1].defaultExpiryDays).toBeUndefined();
  });

  it('addが defaultExpiryDays を含めてINSERTする', async () => {
    const repo = new LocalRepository();
    mockDb.runSync.mockClear();

    const item: FoodItem = {
      id: '100',
      name: '食パン',
      stockLevel: 2,
      tags: [],
      location: 'pantry',
      defaultExpiryDays: 3,
    };
    await repo.add(item);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('default_expiry_days'),
      '100',
      '食パン',
      null,
      2,
      null,
      '[]',
      'pantry',
      3,
    );
  });

  it('updateが defaultExpiryDays を含めてUPDATEする', async () => {
    const repo = new LocalRepository();
    mockDb.runSync.mockClear();

    const item: FoodItem = {
      id: '1',
      name: '牛乳',
      stockLevel: 2,
      tags: [],
      location: 'fridge',
      defaultExpiryDays: 5,
    };
    await repo.update(item);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('default_expiry_days = ?'),
      '牛乳',
      null,
      2,
      null,
      '[]',
      'fridge',
      5,
      '1',
    );
  });
});
