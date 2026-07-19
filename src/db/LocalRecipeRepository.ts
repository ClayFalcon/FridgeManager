import * as SQLite from 'expo-sqlite';
import { Recipe, RecipeIngredient } from '../types/recipe';
import { RecipeRepository } from './RecipeRepository';
import rawInitialData from '../data/initialRecipes.json';

const db = SQLite.openDatabaseSync('fridgemanager.db');

function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredients TEXT NOT NULL DEFAULT '[]',
      memo TEXT
    );
  `);

  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM recipes;');
  if (row?.count === 0) {
    const initialRecipes = rawInitialData as Recipe[];
    for (const recipe of initialRecipes) {
      db.runSync(
        'INSERT INTO recipes (id, name, ingredients, memo) VALUES (?, ?, ?, ?);',
        recipe.id,
        recipe.name,
        JSON.stringify(recipe.ingredients),
        recipe.memo ?? null,
      );
    }
  }
}

function rowToRecipe(row: {
  id: string;
  name: string;
  ingredients: string;
  memo: string | null;
}): Recipe {
  return {
    id: row.id,
    name: row.name,
    ingredients: JSON.parse(row.ingredients) as RecipeIngredient[],
    memo: row.memo ?? undefined,
  };
}

export class LocalRecipeRepository implements RecipeRepository {
  constructor() {
    initDB();
  }

  async getAll(): Promise<Recipe[]> {
    const rows = db.getAllSync<{
      id: string;
      name: string;
      ingredients: string;
      memo: string | null;
    }>('SELECT * FROM recipes ORDER BY CAST(id AS INTEGER), id;');
    return rows.map(rowToRecipe);
  }

  async add(recipe: Recipe): Promise<void> {
    db.runSync(
      'INSERT INTO recipes (id, name, ingredients, memo) VALUES (?, ?, ?, ?);',
      recipe.id,
      recipe.name,
      JSON.stringify(recipe.ingredients),
      recipe.memo ?? null,
    );
  }

  async update(recipe: Recipe): Promise<void> {
    db.runSync(
      'UPDATE recipes SET name = ?, ingredients = ?, memo = ? WHERE id = ?;',
      recipe.name,
      JSON.stringify(recipe.ingredients),
      recipe.memo ?? null,
      recipe.id,
    );
  }

  async delete(id: string): Promise<void> {
    db.runSync('DELETE FROM recipes WHERE id = ?;', id);
  }
}
