import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FoodItem, StockLevel } from '../types/food';
import { StockChange, StockSnapshot, buildSnapshot, computeStockChanges } from '../utils/stockHistory';

export interface HistoryEntry {
  id: string;
  notifiedByUid: string;
  notifiedByName: string | null;
  notifiedAt: Date | null;
  changes: StockChange[];
}

function historyCol(ownerUid: string) {
  return collection(db, 'users', ownerUid, 'history');
}

function snapshotDoc(ownerUid: string) {
  return doc(db, 'users', ownerUid, 'meta', 'stockSnapshot');
}

async function readFoodItems(ownerUid: string): Promise<FoodItem[]> {
  const snap = await getDocs(collection(db, 'users', ownerUid, 'food_items'));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: data.name as string,
      stockLevel: data.stockLevel as StockLevel,
      tags: (data.tags as string[]) ?? [],
      location: data.location as FoodItem['location'],
    };
  });
}

async function readSnapshot(ownerUid: string): Promise<StockSnapshot> {
  const snap = await getDoc(snapshotDoc(ownerUid));
  if (!snap.exists()) return {};
  return ((snap.data().levels as StockSnapshot) ?? {}) as StockSnapshot;
}

/**
 * 手動通知の実行時に、前回スナップショットからの在庫変化を履歴として記録し、
 * スナップショットを現在の状態に更新する。差分が空でも1件記録する。
 * ベストエフォート（呼び出し側は失敗を握りつぶして通知を継続してよい）。
 */
export async function recordManualNotifyHistory(
  ownerUid: string,
  notifiedByUid: string,
  notifiedByName: string | null,
): Promise<void> {
  const items = await readFoodItems(ownerUid);
  const snapshot = await readSnapshot(ownerUid);
  const changes = computeStockChanges(snapshot, items);

  await addDoc(historyCol(ownerUid), {
    notifiedByUid,
    notifiedByName: notifiedByName ?? null,
    notifiedAt: serverTimestamp(),
    changes,
  });

  await setDoc(snapshotDoc(ownerUid), {
    levels: buildSnapshot(items),
    updatedAt: serverTimestamp(),
  });
}

function fromDoc(id: string, data: Record<string, unknown>): HistoryEntry {
  const ts = data.notifiedAt as Timestamp | null;
  return {
    id,
    notifiedByUid: data.notifiedByUid as string,
    notifiedByName: (data.notifiedByName as string | null) ?? null,
    notifiedAt: ts ? ts.toDate() : null,
    changes: (data.changes as StockChange[]) ?? [],
  };
}

export function subscribeHistory(
  ownerUid: string,
  callback: (entries: HistoryEntry[]) => void,
): () => void {
  const q = query(historyCol(ownerUid), orderBy('notifiedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>)));
  });
}
