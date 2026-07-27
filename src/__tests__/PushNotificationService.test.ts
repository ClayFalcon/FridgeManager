jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path) => path.join('/')),
  doc: jest.fn((_db, ...path) => path.join('/')),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {},
}));

jest.mock('../config/firebase', () => ({ db: {} }));

jest.mock('../services/SharingService', () => ({
  getMembers: jest.fn(),
}));

jest.mock('../services/HistoryService', () => ({
  recordManualNotifyHistory: jest.fn().mockResolvedValue(undefined),
}));

import { getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getMembers } from '../services/SharingService';
import { recordManualNotifyHistory } from '../services/HistoryService';
import {
  getManualNotifyState,
  collectGroupPushTokens,
  sendExpoPushBatch,
  sendManualNotifyToGroup,
  ManualNotifyRateLimitedError,
  NoRecipientsError,
  MANUAL_NOTIFY_COOLDOWN_MS,
} from '../services/PushNotificationService';

function makeTokensSnap(tokens: string[]) {
  return { docs: tokens.map((id) => ({ id })) };
}

describe('getManualNotifyState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ドキュメントが存在しない場合はnullを返す', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    const state = await getManualNotifyState('owner-uid');

    expect(state).toEqual({ lastSentAt: null, nextAllowedAt: null });
  });

  it('前回送信時刻からクールダウン後の時刻を計算する', async () => {
    const lastSentAt = new Date('2026-07-19T10:00:00Z');
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ lastSentAt: { toDate: () => lastSentAt } }),
    });

    const state = await getManualNotifyState('owner-uid');

    expect(state.lastSentAt).toEqual(lastSentAt);
    expect(state.nextAllowedAt).toEqual(new Date(lastSentAt.getTime() + MANUAL_NOTIFY_COOLDOWN_MS));
  });
});

describe('collectGroupPushTokens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('オーナーとメンバーのトークンをまとめ、送信者自身は除外する', async () => {
    (getMembers as jest.Mock).mockResolvedValue([{ uid: 'member-a' }, { uid: 'member-b' }]);
    (getDocs as jest.Mock).mockImplementation((colRefPath: string) => {
      if (colRefPath === 'users/owner-uid/pushTokens') return makeTokensSnap(['token-owner']);
      if (colRefPath === 'users/owner-uid/members/member-a/pushTokens') return makeTokensSnap(['token-a']);
      if (colRefPath === 'users/owner-uid/members/member-b/pushTokens') return makeTokensSnap(['token-b']);
      return makeTokensSnap([]);
    });

    const tokens = await collectGroupPushTokens('owner-uid', 'member-a');

    expect(tokens.sort()).toEqual(['token-b', 'token-owner']);
  });

  it('送信者がオーナー自身の場合、オーナーのトークンは除外される', async () => {
    (getMembers as jest.Mock).mockResolvedValue([{ uid: 'member-a' }]);
    (getDocs as jest.Mock).mockImplementation((colRefPath: string) => {
      if (colRefPath === 'users/owner-uid/members/member-a/pushTokens') return makeTokensSnap(['token-a']);
      return makeTokensSnap(['token-owner']);
    });

    const tokens = await collectGroupPushTokens('owner-uid', 'owner-uid');

    expect(tokens).toEqual(['token-a']);
  });
});

describe('sendExpoPushBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it('100件以下は1回のfetchで送信する', async () => {
    const tokens = Array.from({ length: 50 }, (_, i) => `token-${i}`);
    await sendExpoPushBatch(tokens, 'title', 'body', { kind: 'manualNotify' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('100件を超える場合は複数回のfetchに分割する', async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `token-${i}`);
    await sendExpoPushBatch(tokens, 'title', 'body', { kind: 'manualNotify' });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const secondBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(firstBody).toHaveLength(100);
    expect(secondBody).toHaveLength(50);
  });
});

describe('sendManualNotifyToGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it('送信対象がいない場合はNoRecipientsErrorを投げ、Firestoreへの書き込みは行わない', async () => {
    (getMembers as jest.Mock).mockResolvedValue([]);
    (getDocs as jest.Mock).mockResolvedValue(makeTokensSnap([]));

    await expect(
      sendManualNotifyToGroup({ ownerUid: 'owner-uid', senderUid: 'owner-uid', senderDisplayName: 'たろう' }),
    ).rejects.toThrow(NoRecipientsError);

    expect(setDoc).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('レート制限で書き込みが拒否された場合はManualNotifyRateLimitedErrorを投げ、送信しない', async () => {
    (getMembers as jest.Mock).mockResolvedValue([{ uid: 'member-a' }]);
    (getDocs as jest.Mock).mockImplementation((colRefPath: string) => {
      if (colRefPath === 'users/owner-uid/members/member-a/pushTokens') return makeTokensSnap(['token-a']);
      return makeTokensSnap([]);
    });
    (setDoc as jest.Mock).mockRejectedValue(new Error('permission-denied'));
    const nextAllowedAt = new Date('2026-07-19T10:05:00Z');
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ lastSentAt: { toDate: () => new Date(nextAllowedAt.getTime() - MANUAL_NOTIFY_COOLDOWN_MS) } }),
    });

    const promise = sendManualNotifyToGroup({
      ownerUid: 'owner-uid',
      senderUid: 'owner-uid',
      senderDisplayName: 'たろう',
    });

    await expect(promise).rejects.toThrow(ManualNotifyRateLimitedError);
    expect(global.fetch).not.toHaveBeenCalled();
    // レート制限で弾かれた場合は履歴も記録しない
    expect(recordManualNotifyHistory).not.toHaveBeenCalled();
  });

  it('正常系: レート制限書き込み成功後にExpo Push APIへ送信する', async () => {
    (getMembers as jest.Mock).mockResolvedValue([{ uid: 'member-a' }]);
    (getDocs as jest.Mock).mockImplementation((colRefPath: string) => {
      if (colRefPath === 'users/owner-uid/members/member-a/pushTokens') return makeTokensSnap(['token-a']);
      return makeTokensSnap([]);
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await sendManualNotifyToGroup({
      ownerUid: 'owner-uid',
      senderUid: 'owner-uid',
      senderDisplayName: 'たろう',
    });

    expect(setDoc).toHaveBeenCalledWith(
      'users/owner-uid/meta/manualNotify',
      expect.objectContaining({ lastSentByUid: 'owner-uid' }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body[0]).toEqual(
      expect.objectContaining({
        to: 'token-a',
        body: 'たろうさんが在庫状況を最新化しました！',
      }),
    );
    // レート制限を通過したので在庫変更履歴も記録される
    expect(recordManualNotifyHistory).toHaveBeenCalledWith('owner-uid', 'owner-uid', 'たろう');
  });
});
