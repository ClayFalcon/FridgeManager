import { Recipe } from '../types/recipe';

export interface RecipeRepository {
  getAll(): Promise<Recipe[]>;
  subscribe?(callback: (recipes: Recipe[]) => void): () => void;
  add(recipe: Recipe): Promise<void>;
  update(recipe: Recipe): Promise<void>;
  delete(id: string): Promise<void>;
}
