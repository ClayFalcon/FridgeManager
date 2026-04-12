import { FoodItem, StockLevel } from '../types/food';

export interface FoodRepository {
  getAll(): Promise<FoodItem[]>;
  subscribe?(callback: (items: FoodItem[]) => void): () => void;
  add(item: FoodItem): Promise<void>;
  update(item: FoodItem): Promise<void>;
  delete(id: string): Promise<void>;
  updateStock(id: string, level: StockLevel): Promise<void>;
}
