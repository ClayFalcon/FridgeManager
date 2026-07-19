import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getMembers } from './SharingService';
import { formatManualNotifyMessage } from '../utils/notificationMessages';

/** Firestoreルール側の users/{ownerUid}/meta/manualNotify の duration.value(5,'m') と値を一致させること */
export const MANUAL_NOTIFY_COOLDOWN_MS = 5 * 60 * 1000;

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_CHUNK_SIZE = 100;

export interface ManualNotifyState {
  lastSentAt: Date | null;
  nextAllowedAt: Date | null;
}

export class ManualNotifyRateLimitedError extends Error {
  nextAllowedAt: Date;
  constructor(nextAllowedAt: Date) {
    super('rate_limited');
    this.nextAllowedAt = nextAllowedAt;
  }
}

export class NoRecipientsError extends Error {
  constructor() {
    super('no_recipients');
  }
}

export async function getManualNotifyState(ownerUid: string): Promise<ManualNotifyState> {
  const snap = await getDoc(doc(db, 'users', ownerUid, 'meta', 'manualNotify'));
  if (!snap.exists()) return { lastSentAt: null, nextAllowedAt: null };

  const lastSentAt = (snap.data().lastSentAt as Timestamp).toDate();
  const nextAllowedAt = new Date(lastSentAt.getTime() + MANUAL_NOTIFY_COOLDOWN_MS);
  return { lastSentAt, nextAllowedAt };
}

async function collectTokens(path: string[]): Promise<string[]> {
  const snap = await getDocs(collection(db, path[0], ...path.slice(1)));
  return snap.docs.map((d: { id: string }) => d.id);
}

export async function collectGroupPushTokens(ownerUid: string, excludeUid: string): Promise<string[]> {
  const members = await getMembers(ownerUid);
  const uids = [ownerUid, ...members.map((m) => m.uid)].filter((uid) => uid !== excludeUid);

  const tokenLists = await Promise.all(
    uids.map((uid) =>
      uid === ownerUid
        ? collectTokens(['users', ownerUid, 'pushTokens'])
        : collectTokens(['users', ownerUid, 'members', uid, 'pushTokens']),
    ),
  );

  return tokenLists.flat();
}

export async function sendExpoPushBatch(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  for (let i = 0; i < tokens.length; i += EXPO_PUSH_CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + EXPO_PUSH_CHUNK_SIZE);
    await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(chunk.map((to) => ({ to, title, body, data }))),
    });
  }
}

/**
 * 共有メンバー全員に「在庫状況を更新しました」通知を1回だけ送る。
 * 順序: ①トークン収集 ②Firestoreへレート制限ドキュメント書き込み（ルールで5分クールダウンを強制）③Expo Push APIへ送信
 */
export async function sendManualNotifyToGroup(params: {
  ownerUid: string;
  senderUid: string;
  senderDisplayName: string | null;
}): Promise<void> {
  const { ownerUid, senderUid, senderDisplayName } = params;

  const tokens = await collectGroupPushTokens(ownerUid, senderUid);
  if (tokens.length === 0) {
    throw new NoRecipientsError();
  }

  try {
    await setDoc(doc(db, 'users', ownerUid, 'meta', 'manualNotify'), {
      lastSentAt: serverTimestamp(),
      lastSentByUid: senderUid,
    });
  } catch {
    const state = await getManualNotifyState(ownerUid);
    throw new ManualNotifyRateLimitedError(state.nextAllowedAt ?? new Date());
  }

  const { title, body } = formatManualNotifyMessage(senderDisplayName);
  await sendExpoPushBatch(tokens, title, body, {
    kind: 'manualNotify',
    ownerUid,
    senderUid,
    sentAt: new Date().toISOString(),
  });
}
