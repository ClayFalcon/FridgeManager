import { FoodItem } from '../types/food';

function hasExpiry(item: FoodItem): boolean {
  return !!item.expiryDate && item.expiryDate.trim() !== '';
}

/** 賞味期限の近い順に並び替える。未設定の食品は末尾に回す */
export function sortItemsByExpiryAscending(items: FoodItem[]): FoodItem[] {
  return [...items].sort((a, b) => {
    const aHas = hasExpiry(a);
    const bHas = hasExpiry(b);
    if (!aHas && !bHas) return 0;
    if (!aHas) return 1;
    if (!bHas) return -1;
    return a.expiryDate!.localeCompare(b.expiryDate!);
  });
}
