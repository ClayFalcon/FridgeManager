import {
  generateInviteCode,
  joinWithCode,
  getOwnerUid,
  getMembers,
  removeMember,
  leaveSharing,
  MEMBER_LIMIT,
} from '../services/SharingService';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((_db, ...path) => path.join('/')),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
}));

jest.mock('../config/firebase', () => ({ db: {} }));

import { getDoc, setDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';

// ── ヘルパー ──────────────────────────────────────────

function makeInviteSnap(ownerUid: string, expiresAt: Date) {
  return {
    exists: () => true,
    data: () => ({
      ownerUid,
      expiresAt: { toDate: () => expiresAt },
    }),
  };
}

function makeMembersSnap(uids: string[]) {
  return {
    size: uids.length,
    docs: uids.map((uid) => ({
      id: uid,
      data: () => ({ joinedAt: { toDate: () => new Date() } }),
    })),
  };
}

function makeProfileSnap(ownerUid: string | null) {
  return {
    exists: () => ownerUid !== null,
    data: () => (ownerUid !== null ? { ownerUid } : undefined),
  };
}

const FUTURE = new Date(Date.now() + 60 * 60 * 1000); // 1時間後
const PAST = new Date(Date.now() - 60 * 60 * 1000);   // 1時間前

// ── generateInviteCode ────────────────────────────────

describe('generateInviteCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('6文字のコードを返す', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    const code = await generateInviteCode('owner-uid');
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });

  it('Firestoreに invites/{code} を書き込む', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    const code = await generateInviteCode('owner-uid');
    expect(setDoc).toHaveBeenCalledWith(
      expect.stringContaining(`invites/${code}`),
      expect.objectContaining({ ownerUid: 'owner-uid' }),
    );
  });
});

// ── joinWithCode ──────────────────────────────────────

describe('joinWithCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('有効なコードで参加できる', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap([]));
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const ownerUid = await joinWithCode('ABC123', 'my-uid');
    expect(ownerUid).toBe('owner-uid');
    expect(setDoc).toHaveBeenCalledTimes(2);
  });

  it('存在しないコードはエラー', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    await expect(joinWithCode('INVALID', 'my-uid')).rejects.toThrow('招待コードが無効です');
  });

  it('期限切れコードはエラー', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', PAST));
    await expect(joinWithCode('EXP123', 'my-uid')).rejects.toThrow('有効期限が切れています');
  });

  it('自分自身のコードはエラー', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('my-uid', FUTURE));
    await expect(joinWithCode('ABC123', 'my-uid')).rejects.toThrow('自分自身');
  });

  it(`メンバーが上限（${MEMBER_LIMIT}人）のときはエラー`, async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    // オーナー含むMEMBER_LIMIT人 → メンバー枠は MEMBER_LIMIT - 1 人
    (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap(
      Array.from({ length: MEMBER_LIMIT - 1 }, (_, i) => `member-${i}`),
    ));
    await expect(joinWithCode('ABC123', 'my-uid')).rejects.toThrow('上限');
  });

  it('コードを大文字に正規化して検索する', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap([]));
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await joinWithCode('abc123', 'my-uid');
    expect(getDoc).toHaveBeenCalledWith(expect.stringContaining('invites/ABC123'));
  });
});

// ── getOwnerUid ───────────────────────────────────────

describe('getOwnerUid', () => {
  beforeEach(() => jest.clearAllMocks());

  it('profileにownerUidがあればそれを返す', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeProfileSnap('other-uid'));
    const result = await getOwnerUid('my-uid');
    expect(result).toBe('other-uid');
  });

  it('profileがなければ自分のUIDを返す', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false, data: () => undefined });
    const result = await getOwnerUid('my-uid');
    expect(result).toBe('my-uid');
  });

  it('profile.ownerUidがnullなら自分のUIDを返す', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ ownerUid: null }),
    });
    const result = await getOwnerUid('my-uid');
    expect(result).toBe('my-uid');
  });
});

// ── getMembers ────────────────────────────────────────

describe('getMembers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('メンバー一覧を返す', async () => {
    (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap(['uid-a', 'uid-b']));
    const members = await getMembers('owner-uid');
    expect(members).toHaveLength(2);
    expect(members[0].uid).toBe('uid-a');
    expect(members[1].uid).toBe('uid-b');
  });

  it('メンバーがいない場合は空配列を返す', async () => {
    (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap([]));
    const members = await getMembers('owner-uid');
    expect(members).toHaveLength(0);
  });
});

// ── removeMember ──────────────────────────────────────

describe('removeMember', () => {
  beforeEach(() => jest.clearAllMocks());

  it('membersドキュメントを削除してメンバーのprofileをリセットする', async () => {
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await removeMember('owner-uid', 'member-uid');

    expect(deleteDoc).toHaveBeenCalledWith(
      expect.stringContaining('users/owner-uid/members/member-uid'),
    );
    expect(setDoc).toHaveBeenCalledWith(
      expect.stringContaining('users/member-uid/profile'),
      { ownerUid: null },
    );
  });
});

// ── leaveSharing ──────────────────────────────────────

describe('leaveSharing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('オーナーのmembersから削除して自分のprofileをリセットする', async () => {
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await leaveSharing('my-uid', 'owner-uid');

    expect(deleteDoc).toHaveBeenCalledWith(
      expect.stringContaining('users/owner-uid/members/my-uid'),
    );
    expect(setDoc).toHaveBeenCalledWith(
      expect.stringContaining('users/my-uid/profile'),
      { ownerUid: null },
    );
  });
});
