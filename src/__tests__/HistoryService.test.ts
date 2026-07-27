jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path) => path.join('/')),
  doc: jest.fn((_db, ...path) => path.join('/')),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn((colRef) => colRef),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {},
}));

jest.mock('../config/firebase', () => ({ db: {} }));

import { collection, addDoc, getDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { recordManualNotifyHistory, subscribeHistory } from '../services/HistoryService';

function makeFoodDocs(items: { id: string; name: string; stockLevel: number }[]) {
  return {
    docs: items.map((i) => ({
      id: i.id,
      data: () => ({ name: i.name, stockLevel: i.stockLevel, tags: [], location: 'fridge' }),
    })),
  };
}

describe('recordManualNotifyHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (addDoc as jest.Mock).mockResolvedValue({ id: 'entry-1' });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('前回スナップショットからの在庫変化を history に記録し、スナップショットを更新する', async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      makeFoodDocs([
        { id: '1', name: '牛乳', stockLevel: 2 },
        { id: '2', name: '卵', stockLevel: 0 },
      ]),
    );
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ levels: { '1': { name: '牛乳', level: 0 }, '2': { name: '卵', level: 0 } } }),
    });

    await recordManualNotifyHistory('owner-uid', 'sender-uid', 'たろう');

    // history コレクションへ追加
    expect(collection).toHaveBeenCalledWith({}, 'users', 'owner-uid', 'history');
    const entry = (addDoc as jest.Mock).mock.calls[0][1];
    expect(entry.notifiedByUid).toBe('sender-uid');
    expect(entry.notifiedByName).toBe('たろう');
    expect(entry.changes).toEqual([{ foodId: '1', foodName: '牛乳', fromLevel: 0, toLevel: 2 }]);

    // スナップショットを現在の状態で更新
    const snap = (setDoc as jest.Mock).mock.calls[0][1];
    expect(snap.levels).toEqual({
      '1': { name: '牛乳', level: 2 },
      '2': { name: '卵', level: 0 },
    });
  });

  it('スナップショットが存在しない初回は差分空で記録する', async () => {
    (getDocs as jest.Mock).mockResolvedValue(makeFoodDocs([{ id: '1', name: '牛乳', stockLevel: 2 }]));
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    await recordManualNotifyHistory('owner-uid', 'sender-uid', null);

    const entry = (addDoc as jest.Mock).mock.calls[0][1];
    expect(entry.changes).toEqual([]);
    expect(entry.notifiedByName).toBeNull();
    // スナップショットは作成される
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('subscribeHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('onSnapshotのdocsをHistoryEntryに変換してコールバックする', () => {
    let captured: ((snap: unknown) => void) | null = null;
    (onSnapshot as jest.Mock).mockImplementation((_q, cb) => {
      captured = cb;
      return () => {};
    });

    const callback = jest.fn();
    subscribeHistory('owner-uid', callback);

    captured!({
      docs: [
        {
          id: 'e1',
          data: () => ({
            notifiedByUid: 'u1',
            notifiedByName: 'たろう',
            notifiedAt: { toDate: () => new Date('2026-07-26T10:00:00Z') },
            changes: [{ foodId: '1', foodName: '牛乳', fromLevel: 0, toLevel: 2 }],
          }),
        },
      ],
    });

    expect(callback).toHaveBeenCalledWith([
      {
        id: 'e1',
        notifiedByUid: 'u1',
        notifiedByName: 'たろう',
        notifiedAt: new Date('2026-07-26T10:00:00Z'),
        changes: [{ foodId: '1', foodName: '牛乳', fromLevel: 0, toLevel: 2 }],
      },
    ]);
  });

  it('返り値の関数で購読解除できる', () => {
    const unsub = jest.fn();
    (onSnapshot as jest.Mock).mockReturnValue(unsub);
    const off = subscribeHistory('owner-uid', jest.fn());
    off();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
