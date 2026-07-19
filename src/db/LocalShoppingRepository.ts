import * as SQLite from 'expo-sqlite';
import { ShoppingItem } from '../types/shopping';
import { ShoppingRepository } from './ShoppingRepository';

const db = SQLite.openDatabaseSync('fridgemanager.db');

function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function rowToShoppingItem(row: { id: string; name: string; checked: number }): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    checked: row.checked === 1,
  };
}

export class LocalShoppingRepository implements ShoppingRepository {
  constructor() {
    initDB();
  }

  async getAll(): Promise<ShoppingItem[]> {
    const rows = db.getAllSync<{ id: string; name: string; checked: number }>(
      'SELECT * FROM shopping_items ORDER BY CAST(id AS INTEGER), id;',
    );
    return rows.map(rowToShoppingItem);
  }

  async add(item: ShoppingItem): Promise<void> {
    db.runSync(
      'INSERT INTO shopping_items (id, name, checked) VALUES (?, ?, ?);',
      item.id,
      item.name,
      item.checked ? 1 : 0,
    );
  }

  async delete(id: string): Promise<void> {
    db.runSync('DELETE FROM shopping_items WHERE id = ?;', id);
  }

  async setChecked(id: string, checked: boolean): Promise<void> {
    db.runSync('UPDATE shopping_items SET checked = ? WHERE id = ?;', checked ? 1 : 0, id);
  }

  async clearChecked(): Promise<void> {
    db.runSync('DELETE FROM shopping_items WHERE checked = 1;');
  }

  async clearAll(): Promise<void> {
    db.runSync('DELETE FROM shopping_items;');
  }
}
