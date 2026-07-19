import {
  normalizeIngredientName,
  matchRecipeAgainstStock,
  getMissingIngredients,
} from '../utils/recipeMatching';
import { Recipe } from '../types/recipe';
import { FoodItem, StockLevel } from '../types/food';

function makeFood(name: string, stockLevel: StockLevel): FoodItem {
  return { id: `food-${name}`, name, stockLevel, tags: [], location: 'fridge' };
}

function makeRecipe(ingredientNames: string[]): Recipe {
  return {
    id: 'r1',
    name: 'テストレシピ',
    ingredients: ingredientNames.map((name) => ({ name })),
  };
}

describe('normalizeIngredientName', () => {
  it('前後の空白をtrimする', () => {
    expect(normalizeIngredientName('  トマト  ')).toBe('トマト');
  });

  it('大文字小文字を無視する', () => {
    expect(normalizeIngredientName('Tomato')).toBe('tomato');
  });

  it('NFKCで全角半角を統一する', () => {
    expect(normalizeIngredientName('ＴＯＭＡＴＯ')).toBe('tomato');
    expect(normalizeIngredientName('ﾄﾏﾄ')).toBe('トマト');
  });
});

describe('matchRecipeAgainstStock', () => {
  it('全材料が在庫ありなら作れる', () => {
    const result = matchRecipeAgainstStock(makeRecipe(['トマト', 'パスタ']), [
      makeFood('トマト', 2),
      makeFood('パスタ', 1),
    ]);

    expect(result.canMake).toBe(true);
    expect(result.missingCount).toBe(0);
  });

  it('stockLevel 0 の食材は在庫なし扱いになる', () => {
    const result = matchRecipeAgainstStock(makeRecipe(['卵']), [makeFood('卵', 0)]);

    expect(result.canMake).toBe(false);
    expect(result.missingCount).toBe(1);
  });

  it('不足数を正しく数える', () => {
    const result = matchRecipeAgainstStock(makeRecipe(['鶏もも肉', '卵', '米']), [
      makeFood('鶏もも肉', 0),
      makeFood('卵', 0),
      makeFood('米', 2),
    ]);

    expect(result.canMake).toBe(false);
    expect(result.missingCount).toBe(2);
  });

  it('材料名の空白・大文字小文字・全角半角の違いでも一致する', () => {
    const result = matchRecipeAgainstStock(makeRecipe([' tomato ', 'ﾊﾟｽﾀ']), [
      makeFood('Tomato', 2),
      makeFood('パスタ', 1),
    ]);

    expect(result.canMake).toBe(true);
  });

  it('statusesが材料の順番どおりに並ぶ', () => {
    const result = matchRecipeAgainstStock(makeRecipe(['米', '卵', 'のり']), [
      makeFood('米', 2),
      makeFood('卵', 0),
    ]);

    expect(result.statuses).toEqual([
      { name: '米', quantity: undefined, inStock: true },
      { name: '卵', quantity: undefined, inStock: false },
      { name: 'のり', quantity: undefined, inStock: false },
    ]);
  });

  it('材料が空のレシピは作れる扱い（missingCount 0）', () => {
    const result = matchRecipeAgainstStock(makeRecipe([]), []);

    expect(result.canMake).toBe(true);
    expect(result.missingCount).toBe(0);
    expect(result.statuses).toEqual([]);
  });
});

describe('getMissingIngredients', () => {
  it('不足している材料のみ返す', () => {
    const recipe: Recipe = {
      id: 'r1',
      name: '親子丼',
      ingredients: [
        { name: '鶏もも肉', quantity: '200g' },
        { name: '卵', quantity: '2個' },
        { name: '米', quantity: '2合' },
      ],
    };
    const missing = getMissingIngredients(recipe, [
      makeFood('鶏もも肉', 0),
      makeFood('卵', 0),
      makeFood('米', 2),
    ]);

    expect(missing).toEqual([
      { name: '鶏もも肉', quantity: '200g' },
      { name: '卵', quantity: '2個' },
    ]);
  });

  it('全材料が在庫ありなら空配列を返す', () => {
    const missing = getMissingIngredients(makeRecipe(['トマト']), [makeFood('トマト', 1)]);

    expect(missing).toEqual([]);
  });
});
