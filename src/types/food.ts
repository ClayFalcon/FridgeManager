export type StorageLocation = 'fridge' | 'vegetable' | 'freezer' | 'pantry';

/** 0: 全くない  1: ちょっとある  2: 買ったばかり */
export type StockLevel = 0 | 1 | 2;

export const STOCK_LABELS: Record<StockLevel, string> = {
  0: '全くない',
  1: 'ちょっとある',
  2: '買ったばかり',
};

export const LOCATION_LABELS: Record<StorageLocation, string> = {
  fridge: '冷蔵庫',
  vegetable: '野菜室',
  freezer: '冷凍庫',
  pantry: 'パントリー',
};

export const STORAGE_LOCATIONS: StorageLocation[] = [
  'fridge',
  'vegetable',
  'freezer',
  'pantry',
];

export interface FoodItem {
  id: string;
  name: string;
  icon?: string;
  stockLevel: StockLevel;
  /** ISO date string 'YYYY-MM-DD'、未設定は空文字 */
  expiryDate?: string;
  tags: string[];
  location: StorageLocation;
}
