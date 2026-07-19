import * as SQLite from 'expo-sqlite';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types/notification';

const db = SQLite.openDatabaseSync('fridgemanager.db');

function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 1,
      is_premium INTEGER NOT NULL DEFAULT 0,
      rules TEXT NOT NULL DEFAULT '[]'
    );
  `);
}

interface Row {
  enabled: number;
  is_premium: number;
  rules: string;
}

export function getSettings(): NotificationSettings {
  initDB();
  const row = db.getFirstSync<Row>('SELECT enabled, is_premium, rules FROM notification_settings WHERE id = 1;');
  if (!row) return DEFAULT_NOTIFICATION_SETTINGS;

  return {
    enabled: row.enabled === 1,
    isPremium: row.is_premium === 1,
    rules: JSON.parse(row.rules),
  };
}

export function saveSettings(settings: NotificationSettings): void {
  initDB();
  db.runSync(
    `INSERT INTO notification_settings (id, enabled, is_premium, rules) VALUES (1, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET enabled = excluded.enabled, is_premium = excluded.is_premium, rules = excluded.rules;`,
    settings.enabled ? 1 : 0,
    settings.isPremium ? 1 : 0,
    JSON.stringify(settings.rules),
  );
}
