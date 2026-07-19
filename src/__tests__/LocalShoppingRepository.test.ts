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
import { LocalShoppingRepository } from '../db/LocalShoppingRepository';

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

describe('LocalShoppingRepository', () => {
  beforeEach(() => {
    mockDb.execSync.mockClear();
    mockDb.getAllSync.mockReset();
    mockDb.runSync.mockClear();
  });

  it('初期化でshopping_itemsテーブルをCREATEする', () => {
    new LocalShoppingRepository();

    expect(mockDb.execSync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS shopping_items'),
    );
  });

  it('getAllがchecked数値をbooleanに変換して返す', async () => {
    mockDb.getAllSync.mockReturnValue([
      { id: '1', name: '卵', checked: 1 },
      { id: '2', name: '牛乳', checked: 0 },
    ]);

    const repo = new LocalShoppingRepository();
    const items = await repo.getAll();

    expect(items).toEqual([
      { id: '1', name: '卵', checked: true },
      { id: '2', name: '牛乳', checked: false },
    ]);
  });

  it('addがchecked booleanを0/1に変換してINSERTする', async () => {
    const repo = new LocalShoppingRepository();
    mockDb.runSync.mockClear();

    await repo.add({ id: '100', name: 'パン', checked: false });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shopping_items'),
      '100',
      'パン',
      0,
    );
  });

  it('deleteがDELETE文を実行する', async () => {
    const repo = new LocalShoppingRepository();
    mockDb.runSync.mockClear();

    await repo.delete('1');

    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM shopping_items WHERE id = ?;', '1');
  });

  it('setCheckedが0/1で更新する', async () => {
    const repo = new LocalShoppingRepository();
    mockDb.runSync.mockClear();

    await repo.setChecked('1', true);
    await repo.setChecked('2', false);

    expect(mockDb.runSync).toHaveBeenNthCalledWith(
      1,
      'UPDATE shopping_items SET checked = ? WHERE id = ?;',
      1,
      '1',
    );
    expect(mockDb.runSync).toHaveBeenNthCalledWith(
      2,
      'UPDATE shopping_items SET checked = ? WHERE id = ?;',
      0,
      '2',
    );
  });

  it('clearCheckedがchecked=1の行を一括削除する', async () => {
    const repo = new LocalShoppingRepository();
    mockDb.runSync.mockClear();

    await repo.clearChecked();

    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM shopping_items WHERE checked = 1;');
  });
});
