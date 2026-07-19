import { sortItemsByExpiryAscending } from '../utils/expirySort';
import { FoodItem } from '../types/food';

function makeItem(id: string, expiryDate?: string): FoodItem {
  return { id, name: `item-${id}`, stockLevel: 2, expiryDate, tags: [], location: 'fridge' };
}

describe('sortItemsByExpiryAscending', () => {
  it('賞味期限の近い順に並び替える', () => {
    const items = [
      makeItem('a', '2026-08-01'),
      makeItem('b', '2026-07-20'),
      makeItem('c', '2026-07-25'),
    ];
    const sorted = sortItemsByExpiryAscending(items);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('賞味期限未設定の食品は末尾に回す', () => {
    const items = [
      makeItem('a', undefined),
      makeItem('b', '2026-07-20'),
      makeItem('c', ''),
    ];
    const sorted = sortItemsByExpiryAscending(items);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('元の配列を変更しない', () => {
    const items = [makeItem('a', '2026-08-01'), makeItem('b', '2026-07-20')];
    const original = [...items];
    sortItemsByExpiryAscending(items);
    expect(items).toEqual(original);
  });
});
