import * as SQLite from 'expo-sqlite';
import { StatusMode } from '../types/food';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/appSettings';

const db = SQLite.openDatabaseSync('fridgemanager.db');

function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status_mode TEXT NOT NULL DEFAULT '3step'
    );
  `);
}

interface Row {
  status_mode: string;
}

export function getAppSettings(): AppSettings {
  initDB();
  const row = db.getFirstSync<Row>('SELECT status_mode FROM app_settings WHERE id = 1;');
  if (!row) return DEFAULT_APP_SETTINGS;

  return {
    statusMode: (row.status_mode as StatusMode) ?? DEFAULT_APP_SETTINGS.statusMode,
  };
}

export function saveAppSettings(settings: AppSettings): void {
  initDB();
  db.runSync(
    `INSERT INTO app_settings (id, status_mode) VALUES (1, ?)
     ON CONFLICT (id) DO UPDATE SET status_mode = excluded.status_mode;`,
    settings.statusMode,
  );
}
