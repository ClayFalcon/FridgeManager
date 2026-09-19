import { writeBatch, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';

// Firestore の1バッチあたりの書き込み上限
export const FIRESTORE_BATCH_LIMIT = 500;

// 複数ドキュメントを一括書き込みで保存する。1件ずつ setDoc するとサーバー往復が件数分かかるため、
// 移行のような大量書き込みではバッチにまとめて往復回数を減らす。
export async function setAllInBatches<T>(
  items: T[],
  toEntry: (item: T) => [DocumentReference, DocumentData],
): Promise<void> {
  for (let start = 0; start < items.length; start += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const item of items.slice(start, start + FIRESTORE_BATCH_LIMIT)) {
      const [ref, data] = toEntry(item);
      batch.set(ref, data);
    }
    await batch.commit();
  }
}
