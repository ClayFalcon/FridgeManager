import { buildSnapshot, computeStockChanges } from '../utils/stockHistory';
import { FoodItem, StockLevel } from '../types/food';

function makeItem(id: string, name: string, stockLevel: StockLevel): FoodItem {
  return { id, name, stockLevel, tags: [], location: 'fridge' };
}

describe('buildSnapshot', () => {
  it('食材一覧をid→{name,level}のマップに変換する', () => {
    const items = [makeItem('1', '牛乳', 2), makeItem('2', '卵', 0)];
    expect(buildSnapshot(items)).toEqual({
      '1': { name: '牛乳', level: 2 },
      '2': { name: '卵', level: 0 },
    });
  });
});

describe('computeStockChanges', () => {
  it('在庫レベルが変化した食材のみを返す', () => {
    const snapshot = {
      '1': { name: '牛乳', level: 0 as StockLevel },
      '2': { name: '卵', level: 2 as StockLevel },
    };
    const items = [makeItem('1', '牛乳', 2), makeItem('2', '卵', 2)];

    expect(computeStockChanges(snapshot, items)).toEqual([
      { foodId: '1', foodName: '牛乳', fromLevel: 0, toLevel: 2 },
    ]);
  });

  it('変化がなければ空配列を返す', () => {
    const snapshot = { '1': { name: '牛乳', level: 2 as StockLevel } };
    const items = [makeItem('1', '牛乳', 2)];
    expect(computeStockChanges(snapshot, items)).toEqual([]);
  });

  it('スナップショットに無い新規食材は無視する', () => {
    const snapshot = { '1': { name: '牛乳', level: 2 as StockLevel } };
    const items = [makeItem('1', '牛乳', 2), makeItem('99', '新食材', 0)];
    expect(computeStockChanges(snapshot, items)).toEqual([]);
  });

  it('現在に無い削除済み食材は無視する', () => {
    const snapshot = {
      '1': { name: '牛乳', level: 2 as StockLevel },
      '2': { name: '卵', level: 0 as StockLevel },
    };
    const items = [makeItem('1', '牛乳', 0)];
    expect(computeStockChanges(snapshot, items)).toEqual([
      { foodId: '1', foodName: '牛乳', fromLevel: 2, toLevel: 0 },
    ]);
  });

  it('foodNameは現在の名前を採用する', () => {
    const snapshot = { '1': { name: '旧名', level: 0 as StockLevel } };
    const items = [makeItem('1', '新名', 2)];
    expect(computeStockChanges(snapshot, items)[0].foodName).toBe('新名');
  });
});
