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
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間有効
  await setDoc(doc(db, 'invites', code), {
    ownerUid,
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  return code;
}

export async function joinWithCode(code: string, myUid: string): Promise<string> {
  const inviteSnap = await getDoc(doc(db, 'invites', code.toUpperCase()));
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

  const membersSnap = await getDocs(collection(db, 'users', ownerUid, 'members'));
  if (membersSnap.size >= MEMBER_LIMIT - 1) {
    throw new Error(`メンバーが上限（${MEMBER_LIMIT}人）に達しています`);
  }

  await setDoc(doc(db, 'users', myUid, 'profile'), { ownerUid });
  await setDoc(doc(db, 'users', ownerUid, 'members', myUid), {
    joinedAt: serverTimestamp(),
  });

  return ownerUid;
}

export async function getOwnerUid(myUid: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', myUid, 'profile'));
  return (snap.data()?.ownerUid as string | null | undefined) ?? myUid;
}

export async function getMembers(ownerUid: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, 'users', ownerUid, 'members'));
  return snap.docs.map((d) => ({
    uid: d.id,
    joinedAt: (d.data().joinedAt as Timestamp | null)?.toDate() ?? new Date(),
  }));
}

export async function removeMember(ownerUid: string, memberUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', ownerUid, 'members', memberUid));
  await setDoc(doc(db, 'users', memberUid, 'profile'), { ownerUid: null });
}

export async function leaveSharing(myUid: string, ownerUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', ownerUid, 'members', myUid));
  await setDoc(doc(db, 'users', myUid, 'profile'), { ownerUid: null });
}
