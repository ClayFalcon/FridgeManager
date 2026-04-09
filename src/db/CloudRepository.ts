import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FoodItem, StockLevel } from '../types/food';
import { FoodRepository } from './FoodRepository';

function foodItemPath(uid: string) {
  return collection(db, 'users', uid, 'food_items');
}

function toDoc(item: FoodItem): Record<string, unknown> {
  return {
    name: item.name,
    icon: item.icon ?? null,
    stockLevel: item.stockLevel,
    expiryDate: item.expiryDate ?? null,
    tags: item.tags,
    location: item.location,
  };
}

function fromDoc(id: string, data: Record<string, unknown>): FoodItem {
  return {
    id,
    name: data.name as string,
    icon: (data.icon as string | null) ?? undefined,
    stockLevel: data.stockLevel as StockLevel,
    expiryDate: (data.expiryDate as string | null) ?? undefined,
    tags: data.tags as string[],
    location: data.location as FoodItem['location'],
  };
}

export class CloudRepository implements FoodRepository {
  constructor(private readonly uid: string) {}

  async getAll(): Promise<FoodItem[]> {
    const q = query(foodItemPath(this.uid), orderBy('__name__'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
  }

  async add(item: FoodItem): Promise<void> {
    await setDoc(doc(foodItemPath(this.uid), item.id), toDoc(item));
  }

  async update(item: FoodItem): Promise<void> {
    await updateDoc(doc(foodItemPath(this.uid), item.id), toDoc(item));
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(foodItemPath(this.uid), id));
  }

  async updateStock(id: string, level: StockLevel): Promise<void> {
    await updateDoc(doc(foodItemPath(this.uid), id), { stockLevel: level });
  }
}
