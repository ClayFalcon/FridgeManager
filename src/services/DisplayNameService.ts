import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// 家族（共有メンバー）に表示する名前。firestore.rules の isValidDisplayName と上限を合わせること
export const DISPLAY_NAME_MAX_LENGTH = 20;

export type DisplayNameValidation = { ok: true; name: string } | { ok: false; error: string };

export function validateDisplayName(raw: string): DisplayNameValidation {
  const name = raw.trim();
  if (name.length === 0) {
    return { ok: false, error: '名前を入力してください' };
  }
  if ([...name].length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: `名前は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください` };
  }
  return { ok: true, name };
}

// 自分の名前の保存先（本人だけが読み書きできる）
function myNameDoc(uid: string) {
  return doc(db, 'users', uid, 'profile', 'name');
}

// オーナーとしての名前（自分のグループのメンバーが読める）
function ownerNameDoc(ownerUid: string) {
  return doc(db, 'users', ownerUid, 'meta', 'owner');
}

export async function getMyDisplayName(uid: string): Promise<string | null> {
  const snap = await getDoc(myNameDoc(uid));
  return (snap.data()?.displayName as string | undefined) ?? null;
}

// 名前を保存し、家族から見える場所にも反映する。
// 自分のグループのオーナー名と、他人のグループに参加中ならそのメンバー一覧の名前も更新する。
export async function saveMyDisplayName(
  uid: string,
  rawName: string,
  ownerUid: string | null,
): Promise<string> {
  const result = validateDisplayName(rawName);
  if (!result.ok) {
    throw new Error(result.error);
  }
  const { name } = result;
  await setDoc(myNameDoc(uid), { displayName: name });
  await setDoc(ownerNameDoc(uid), { displayName: name });
  if (ownerUid && ownerUid !== uid) {
    await updateDoc(doc(db, 'users', ownerUid, 'members', uid), { displayName: name });
  }
  return name;
}

export async function getOwnerDisplayName(ownerUid: string): Promise<string | null> {
  try {
    const snap = await getDoc(ownerNameDoc(ownerUid));
    return (snap.data()?.displayName as string | undefined) ?? null;
  } catch {
    return null;
  }
}
