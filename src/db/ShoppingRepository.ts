import { ShoppingItem } from '../types/shopping';

export interface ShoppingRepository {
  getAll(): Promise<ShoppingItem[]>;
  subscribe?(callback: (items: ShoppingItem[]) => void): () => void;
  add(item: ShoppingItem): Promise<void>;
  delete(id: string): Promise<void>;
  setChecked(id: string, checked: boolean): Promise<void>;
  /** チェック済みの品目を一括削除する */
  clearChecked(): Promise<void>;
  /** 全品目を一括削除する（全部買ってきた時用） */
  clearAll(): Promise<void>;
}
