import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Recipe, RecipeIngredient } from '../types/recipe';
import { RecipeRepository } from './RecipeRepository';

function recipePath(uid: string) {
  return collection(db, 'users', uid, 'recipes');
}

function toDoc(recipe: Recipe): Record<string, unknown> {
  return {
    name: recipe.name,
    ingredients: recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? null,
    })),
    memo: recipe.memo ?? null,
  };
}

function fromDoc(id: string, data: Record<string, unknown>): Recipe {
  const rawIngredients = (data.ingredients as { name: string; quantity: string | null }[]) ?? [];
  return {
    id,
    name: data.name as string,
    ingredients: rawIngredients.map(
      (i): RecipeIngredient => ({ name: i.name, quantity: i.quantity ?? undefined }),
    ),
    memo: (data.memo as string | null) ?? undefined,
  };
}

export class CloudRecipeRepository implements RecipeRepository {
  constructor(private readonly uid: string) {}

  async getAll(): Promise<Recipe[]> {
    const q = query(recipePath(this.uid), orderBy('__name__'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
  }

  subscribe(callback: (recipes: Recipe[]) => void): () => void {
    const q = query(recipePath(this.uid), orderBy('__name__'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>)));
    });
  }

  async add(recipe: Recipe): Promise<void> {
    await setDoc(doc(recipePath(this.uid), recipe.id), toDoc(recipe));
  }

  async update(recipe: Recipe): Promise<void> {
    await updateDoc(doc(recipePath(this.uid), recipe.id), toDoc(recipe));
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(recipePath(this.uid), id));
  }
}
