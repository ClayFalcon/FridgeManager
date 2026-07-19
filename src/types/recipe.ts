export interface RecipeIngredient {
  name: string;
  /** 分量の自由記述（例: '2個', '100g'）。省略可 */
  quantity?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  memo?: string;
}
