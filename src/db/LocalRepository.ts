import * as SQLite from 'expo-sqlite';
import { FoodItem, StockLevel } from '../types/food';
import { FoodRepository } from './FoodRepository';
import rawInitialData from '../data/initialFoodItems.json';

const db = SQLite.openDatabaseSync('fridgemanager.db');

function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      stock_level INTEGER NOT NULL DEFAULT 2,
      expiry_date TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      location TEXT NOT NULL,
      default_expiry_days INTEGER
    );
  `);

  // 既存インストール向けマイグレーション（カラムが既にあれば失敗するので無視）
  try {
    db.execSync('ALTER TABLE food_items ADD COLUMN default_expiry_days INTEGER;');
  } catch {
    // 既にカラムが存在する
  }

  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM food_items;');
  if (row?.count === 0) {
    const initialItems = rawInitialData as FoodItem[];
    for (const item of initialItems) {
      db.runSync(
        'INSERT INTO food_items (id, name, icon, stock_level, expiry_date, tags, location, default_expiry_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
        item.id,
        item.name,
        item.icon ?? null,
        item.stockLevel,
        item.expiryDate ?? null,
        JSON.stringify(item.tags),
        item.location,
        item.defaultExpiryDays ?? null,
      );
    }
  }
}

interface FoodRow {
  id: string;
  name: string;
  icon: string | null;
  stock_level: number;
  expiry_date: string | null;
  tags: string;
  location: string;
  default_expiry_days: number | null;
}

function rowToFoodItem(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    stockLevel: row.stock_level as StockLevel,
    expiryDate: row.expiry_date ?? undefined,
    defaultExpiryDays: row.default_expiry_days ?? undefined,
    tags: JSON.parse(row.tags) as string[],
    location: row.location as FoodItem['location'],
  };
}

export class LocalRepository implements FoodRepository {
  constructor() {
    initDB();
  }

  async getAll(): Promise<FoodItem[]> {
    const rows = db.getAllSync<FoodRow>('SELECT * FROM food_items ORDER BY CAST(id AS INTEGER), id;');
    return rows.map(rowToFoodItem);
  }

  async add(item: FoodItem): Promise<void> {
    db.runSync(
      'INSERT INTO food_items (id, name, icon, stock_level, expiry_date, tags, location, default_expiry_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      item.id,
      item.name,
      item.icon ?? null,
      item.stockLevel,
      item.expiryDate ?? null,
      JSON.stringify(item.tags),
      item.location,
      item.defaultExpiryDays ?? null,
    );
  }

  async update(item: FoodItem): Promise<void> {
    db.runSync(
      'UPDATE food_items SET name = ?, icon = ?, stock_level = ?, expiry_date = ?, tags = ?, location = ?, default_expiry_days = ? WHERE id = ?;',
      item.name,
      item.icon ?? null,
      item.stockLevel,
      item.expiryDate ?? null,
      JSON.stringify(item.tags),
      item.location,
      item.defaultExpiryDays ?? null,
      item.id,
    );
  }

  async delete(id: string): Promise<void> {
    db.runSync('DELETE FROM food_items WHERE id = ?;', id);
  }

  async updateStock(id: string, level: StockLevel): Promise<void> {
    db.runSync('UPDATE food_items SET stock_level = ? WHERE id = ?;', level, id);
  }
}
