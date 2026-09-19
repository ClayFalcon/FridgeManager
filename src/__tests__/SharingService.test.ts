import {
  generateInviteCode,
  joinWithCode,
  getOwnerUid,
  getMembers,
  removeMember,
  leaveSharing,
  watchMembership,
  clearMyGroup,
  MEMBER_LIMIT,
} from '../services/SharingService';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path) => path.join('/')),
  // 実際の Firestore と同じく、ドキュメントは偶数階層でないとエラーにする
  doc: jest.fn((_db, ...path) => {
    if (path.length % 2 !== 0) {
      throw new Error(`Invalid document reference: ${path.join('/')}`);
    }
    return path.join('/');
  }),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
}));

jest.mock('../config/firebase', () => ({ db: {} }));

import { getDoc, setDoc, deleteDoc, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';

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

  beforeEach(() => (getDocs as jest.Mock).mockResolvedValue(makeMembersSnap([])));

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

  it(`メンバーが上限（${MEMBER_LIMIT}人）のときは発行しない`, async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      makeMembersSnap(Array.from({ length: MEMBER_LIMIT - 1 }, (_, i) => `member-${i}`)),
    );
    await expect(generateInviteCode('owner-uid')).rejects.toThrow('上限');
    expect(setDoc).not.toHaveBeenCalled();
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

  it('招待コードを添えてメンバー登録し、その後に自分の所属グループを保存する', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await joinWithCode('abc123', 'my-uid');

    expect((setDoc as jest.Mock).mock.calls).toEqual([
      [
        'users/owner-uid/members/my-uid',
        { joinedAt: { _type: 'serverTimestamp' }, inviteCode: 'ABC123' },
      ],
      ['users/my-uid/profile/sharing', { ownerUid: 'owner-uid' }],
    ]);
  });

  it('名前があれば、オーナーのメンバー一覧に表示する名前も登録する', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await joinWithCode('ABC123', 'my-uid', 'はやと');

    expect(setDoc).toHaveBeenCalledWith('users/owner-uid/members/my-uid', {
      joinedAt: { _type: 'serverTimestamp' },
      inviteCode: 'ABC123',
      displayName: 'はやと',
    });
  });

  it('参加する側はオーナーのメンバー一覧を読まない（権限が無いため）', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeInviteSnap('owner-uid', FUTURE));
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await joinWithCode('ABC123', 'my-uid');

    expect(getDocs).not.toHaveBeenCalled();
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

  it('profile/sharing を読む', async () => {
    (getDoc as jest.Mock).mockResolvedValue(makeProfileSnap(null));
    await getOwnerUid('my-uid');
    expect(getDoc).toHaveBeenCalledWith('users/my-uid/profile/sharing');
  });

  it('profileにownerUidがあり、まだメンバーならそのオーナーを返す', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce(makeProfileSnap('other-uid'))
      .mockResolvedValueOnce({ exists: () => true });
    const result = await getOwnerUid('my-uid');
    expect(result).toBe('other-uid');
    expect(getDoc).toHaveBeenLastCalledWith('users/other-uid/members/my-uid');
  });

  it('オーナーに削除されていたら自分のUIDを返す', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce(makeProfileSnap('other-uid'))
      .mockRejectedValueOnce(new Error('permission-denied'));
    const result = await getOwnerUid('my-uid');
    expect(result).toBe('my-uid');
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

  it('メンバーの名前も返す', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      size: 1,
      docs: [{ id: 'uid-a', data: () => ({ joinedAt: null, displayName: 'はやと' }) }],
    });
    const members = await getMembers('owner-uid');
    expect(members[0].displayName).toBe('はやと');
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

  it('membersドキュメントだけを削除する（他人のprofileは書き換えられないため）', async () => {
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await removeMember('owner-uid', 'member-uid');

    expect(deleteDoc).toHaveBeenCalledWith('users/owner-uid/members/member-uid');
    expect(setDoc).not.toHaveBeenCalled();
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
    expect(setDoc).toHaveBeenCalledWith('users/my-uid/profile/sharing', { ownerUid: null });
  });
});

// ── watchMembership / clearMyGroup ────────────────────

describe('watchMembership', () => {
  let onNext: (snap: { exists: () => boolean }) => void;
  let onError: (e: Error) => void;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (onSnapshot as jest.Mock).mockImplementation((_ref, next, error) => {
      onNext = next;
      onError = error;
      return unsubscribe;
    });
  });

  it('オーナー配下の自分のメンバー情報を監視し、解除関数を返す', () => {
    const stop = watchMembership('owner-uid', 'my-uid', jest.fn());
    expect(onSnapshot).toHaveBeenCalledWith('users/owner-uid/members/my-uid', expect.any(Function), expect.any(Function));
    expect(stop).toBe(unsubscribe);
  });

  it('メンバー情報が残っている間は何もしない', () => {
    const onRemoved = jest.fn();
    watchMembership('owner-uid', 'my-uid', onRemoved);
    onNext({ exists: () => true });
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('メンバー情報が消えたら外されたとみなす', () => {
    const onRemoved = jest.fn();
    watchMembership('owner-uid', 'my-uid', onRemoved);
    onNext({ exists: () => false });
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it('読む権限が無くなったら外されたとみなす', () => {
    const onRemoved = jest.fn();
    watchMembership('owner-uid', 'my-uid', onRemoved);
    onError(new Error('permission-denied'));
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });
});

describe('clearMyGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('自分の所属グループを空にする', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    await clearMyGroup('my-uid');
    expect(setDoc).toHaveBeenCalledWith('users/my-uid/profile/sharing', { ownerUid: null });
  });
});
