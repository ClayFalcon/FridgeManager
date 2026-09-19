import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const MEMBER_LIMIT = 5; // オーナー含む上限人数

// 自分がどの共有グループ（オーナー）に属しているかを保存する場所。
// Firestore のドキュメントは「コレクション/ドキュメント」の偶数階層で指定する必要がある。
function profileDoc(uid: string) {
  return doc(db, 'users', uid, 'profile', 'sharing');
}

function memberDoc(ownerUid: string, memberUid: string) {
  return doc(db, 'users', ownerUid, 'members', memberUid);
}

export interface Member {
  uid: string;
  joinedAt: Date;
}

function generateCode(): string {
  // 0/O・1/I など混同しやすい文字を除外
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateInviteCode(ownerUid: string): Promise<string> {
  // 参加する側はオーナーのメンバー一覧を読めないため、上限の確認は招待コードを発行する時点で行う
  const membersSnap = await getDocs(collection(db, 'users', ownerUid, 'members'));
  if (membersSnap.size >= MEMBER_LIMIT - 1) {
    throw new Error(`メンバーが上限（${MEMBER_LIMIT}人）に達しています`);
  }
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間有効
  await setDoc(doc(db, 'invites', code), {
    ownerUid,
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  return code;
}

export async function joinWithCode(code: string, myUid: string): Promise<string> {
  const normalizedCode = code.toUpperCase();
  const inviteSnap = await getDoc(doc(db, 'invites', normalizedCode));
  if (!inviteSnap.exists()) {
    throw new Error('招待コードが無効です');
  }

  const data = inviteSnap.data();
  const expiresAt = (data.expiresAt as Timestamp).toDate();
  if (expiresAt < new Date()) {
    throw new Error('招待コードの有効期限が切れています');
  }

  const ownerUid = data.ownerUid as string;
  if (ownerUid === myUid) {
    throw new Error('自分自身の招待コードは使用できません');
  }

  // メンバー登録には有効な招待コードが必要（Firestore ルールで inviteCode を検証する）
  await setDoc(memberDoc(ownerUid, myUid), {
    joinedAt: serverTimestamp(),
    inviteCode: normalizedCode,
  });
  await setDoc(profileDoc(myUid), { ownerUid });

  return ownerUid;
}

export async function getOwnerUid(myUid: string): Promise<string> {
  const snap = await getDoc(profileDoc(myUid));
  const ownerUid = snap.data()?.ownerUid as string | null | undefined;
  if (!ownerUid || ownerUid === myUid) return myUid;
  // オーナーに削除されていれば自分の冷蔵庫に戻る（削除後はメンバー情報を読めず権限エラーになる）
  try {
    const member = await getDoc(memberDoc(ownerUid, myUid));
    return member.exists() ? ownerUid : myUid;
  } catch {
    return myUid;
  }
}

export async function getMembers(ownerUid: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, 'users', ownerUid, 'members'));
  return snap.docs.map((d) => ({
    uid: d.id,
    joinedAt: (d.data().joinedAt as Timestamp | null)?.toDate() ?? new Date(),
  }));
}

// オーナーは他人の profile を書き換えられないため、メンバー情報の削除だけ行う。
// 削除されたメンバーは getOwnerUid で自分の冷蔵庫に戻る。
export async function removeMember(ownerUid: string, memberUid: string): Promise<void> {
  await deleteDoc(memberDoc(ownerUid, memberUid));
}

export async function leaveSharing(myUid: string, ownerUid: string): Promise<void> {
  await deleteDoc(memberDoc(ownerUid, myUid));
  await setDoc(profileDoc(myUid), { ownerUid: null });
}
