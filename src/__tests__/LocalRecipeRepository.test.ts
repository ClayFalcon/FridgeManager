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
import { LocalRecipeRepository } from '../db/LocalRecipeRepository';
import initialRecipes from '../data/initialRecipes.json';

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

describe('LocalRecipeRepository', () => {
  beforeEach(() => {
    mockDb.execSync.mockClear();
    mockDb.getFirstSync.mockReset();
    mockDb.getAllSync.mockReset();
    mockDb.runSync.mockClear();
  });

  it('初期化でrecipesテーブルをCREATEする', () => {
    mockDb.getFirstSync.mockReturnValue({ count: 1 });

    new LocalRecipeRepository();

    expect(mockDb.execSync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS recipes'),
    );
  });

  it('テーブルが空のときinitialRecipes.jsonをシードする', () => {
    mockDb.getFirstSync.mockReturnValue({ count: 0 });

    new LocalRecipeRepository();

    expect(mockDb.runSync).toHaveBeenCalledTimes(initialRecipes.length);
    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipes'),
      '1',
      'トマトパスタ',
      JSON.stringify(initialRecipes[0].ingredients),
      '',
    );
  });

  it('既存データがあればシードしない', () => {
    mockDb.getFirstSync.mockReturnValue({ count: 3 });

    new LocalRecipeRepository();

    expect(mockDb.runSync).not.toHaveBeenCalled();
  });

  it('getAllがingredients JSONをパースして返す', async () => {
    mockDb.getFirstSync.mockReturnValue({ count: 1 });
    mockDb.getAllSync.mockReturnValue([
      {
        id: '1',
        name: 'トマトパスタ',
        ingredients: JSON.stringify([{ name: 'トマト', quantity: '2個' }]),
        memo: null,
      },
    ]);

    const repo = new LocalRecipeRepository();
    const recipes = await repo.getAll();

    expect(recipes).toEqual([
      {
        id: '1',
        name: 'トマトパスタ',
        ingredients: [{ name: 'トマト', quantity: '2個' }],
        memo: undefined,
      },
    ]);
  });

  it('addがINSERT文を正しい引数で実行する', async () => {
    mockDb.getFirstSync.mockReturnValue({ count: 1 });
    const repo = new LocalRecipeRepository();
    mockDb.runSync.mockClear();

    await repo.add({
      id: '100',
      name: '新レシピ',
      ingredients: [{ name: '卵' }],
      memo: 'メモ',
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipes'),
      '100',
      '新レシピ',
      JSON.stringify([{ name: '卵' }]),
      'メモ',
    );
  });

  it('updateがUPDATE文を正しい引数で実行する', async () => {
    mockDb.getFirstSync.mockReturnValue({ count: 1 });
    const repo = new LocalRecipeRepository();
    mockDb.runSync.mockClear();

    await repo.update({
      id: '1',
      name: '更新後',
      ingredients: [],
      memo: undefined,
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE recipes SET'),
      '更新後',
      '[]',
      null,
      '1',
    );
  });

  it('deleteがDELETE文を実行する', async () => {
    mockDb.getFirstSync.mockReturnValue({ count: 1 });
    const repo = new LocalRecipeRepository();
    mockDb.runSync.mockClear();

    await repo.delete('1');

    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM recipes WHERE id = ?;', '1');
  });
});
