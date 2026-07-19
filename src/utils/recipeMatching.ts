import { FoodItem } from '../types/food';
import { Recipe, RecipeIngredient } from '../types/recipe';

/** 材料名の照合用正規化: NFKC（全角/半角統一）+ trim + 小文字化 */
export function normalizeIngredientName(name: string): string {
  return name.normalize('NFKC').trim().toLowerCase();
}

export interface IngredientStockStatus {
  name: string;
  quantity?: string;
  inStock: boolean;
}

export interface RecipeMatchResult {
  /** 全材料が在庫あり */
  canMake: boolean;
  /** 不足している材料の数 */
  missingCount: number;
  /** 材料順の在庫状況（詳細表示用） */
  statuses: IngredientStockStatus[];
}

function buildStockNameSet(foodItems: FoodItem[]): Set<string> {
  const set = new Set<string>();
  for (const item of foodItems) {
    if (item.stockLevel > 0) {
      set.add(normalizeIngredientName(item.name));
    }
  }
  return set;
}

/** レシピの材料を手持ち食材（stockLevel > 0）と名前で照合する */
export function matchRecipeAgainstStock(recipe: Recipe, foodItems: FoodItem[]): RecipeMatchResult {
  const stockNames = buildStockNameSet(foodItems);

  const statuses: IngredientStockStatus[] = recipe.ingredients.map((ingredient) => ({
    name: ingredient.name,
    quantity: ingredient.quantity,
    inStock: stockNames.has(normalizeIngredientName(ingredient.name)),
  }));

  const missingCount = statuses.filter((s) => !s.inStock).length;

  return { canMake: missingCount === 0, missingCount, statuses };
}

/** 買い物リスト追加用: 不足している材料のみ返す */
export function getMissingIngredients(recipe: Recipe, foodItems: FoodItem[]): RecipeIngredient[] {
  const stockNames = buildStockNameSet(foodItems);
  return recipe.ingredients.filter(
    (ingredient) => !stockNames.has(normalizeIngredientName(ingredient.name)),
  );
}
