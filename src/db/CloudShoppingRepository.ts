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
import { ShoppingItem } from '../types/shopping';
import { ShoppingRepository } from './ShoppingRepository';

function shoppingPath(uid: string) {
  return collection(db, 'users', uid, 'shopping_items');
}

function toDoc(item: ShoppingItem): Record<string, unknown> {
  return {
    name: item.name,
    checked: item.checked,
  };
}

function fromDoc(id: string, data: Record<string, unknown>): ShoppingItem {
  return {
    id,
    name: data.name as string,
    checked: (data.checked as boolean) ?? false,
  };
}

export class CloudShoppingRepository implements ShoppingRepository {
  constructor(private readonly uid: string) {}

  async getAll(): Promise<ShoppingItem[]> {
    const q = query(shoppingPath(this.uid), orderBy('__name__'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
  }

  subscribe(callback: (items: ShoppingItem[]) => void): () => void {
    const q = query(shoppingPath(this.uid), orderBy('__name__'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>)));
    });
  }

  async add(item: ShoppingItem): Promise<void> {
    await setDoc(doc(shoppingPath(this.uid), item.id), toDoc(item));
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(shoppingPath(this.uid), id));
  }

  async setChecked(id: string, checked: boolean): Promise<void> {
    await updateDoc(doc(shoppingPath(this.uid), id), { checked });
  }

  async clearChecked(): Promise<void> {
    const items = await this.getAll();
    await Promise.all(
      items.filter((item) => item.checked).map((item) => this.delete(item.id)),
    );
  }

  async clearAll(): Promise<void> {
    const items = await this.getAll();
    await Promise.all(items.map((item) => this.delete(item.id)));
  }
}
