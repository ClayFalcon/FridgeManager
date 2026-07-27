import { FoodItem, StockLevel } from '../types/food';

export interface StockChange {
  foodId: string;
  foodName: string;
  fromLevel: StockLevel;
  toLevel: StockLevel;
}

export interface SnapshotEntry {
  name: string;
  level: StockLevel;
}

export type StockSnapshot = Record<string, SnapshotEntry>;

/** 現在の食材一覧から在庫レベルのスナップショットを作る */
export function buildSnapshot(items: FoodItem[]): StockSnapshot {
  const snapshot: StockSnapshot = {};
  for (const item of items) {
    snapshot[item.id] = { name: item.name, level: item.stockLevel };
  }
  return snapshot;
}

/**
 * スナップショットと現在の食材を比較し、在庫レベルが変化した食材のみを返す。
 * スナップショットと現在の両方に存在するものだけを対象とし（新規追加・削除は無視）、
 * foodName は現在の名前を採用する。
 */
export function computeStockChanges(snapshot: StockSnapshot, items: FoodItem[]): StockChange[] {
  const changes: StockChange[] = [];
  for (const item of items) {
    const prev = snapshot[item.id];
    if (!prev) continue; // 新規追加食材は対象外
    if (prev.level !== item.stockLevel) {
      changes.push({
        foodId: item.id,
        foodName: item.name,
        fromLevel: prev.level,
        toLevel: item.stockLevel,
      });
    }
  }
  return changes;
}
