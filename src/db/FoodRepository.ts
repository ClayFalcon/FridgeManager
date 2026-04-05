import { FoodItem, StockLevel } from '../types/food';

export interface FoodRepository {
  getAll(): Promise<FoodItem[]>;
  add(item: FoodItem): Promise<void>;
  update(item: FoodItem): Promise<void>;
  delete(id: string): Promise<void>;
  updateStock(id: string, level: StockLevel): Promise<void>;
}
