const mockBatches: { set: jest.Mock; commit: jest.Mock }[] = [];

jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(() => {
    const batch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
    mockBatches.push(batch);
    return batch;
  }),
}));
jest.mock('../config/firebase', () => ({ db: {} }));

import { setAllInBatches, FIRESTORE_BATCH_LIMIT } from '../db/batchWrite';

const toEntry = (n: number) => [`ref-${n}`, { n }] as never;

describe('setAllInBatches', () => {
  beforeEach(() => {
    mockBatches.length = 0;
  });

  it('全件を1つのバッチにまとめて1回だけコミットする', async () => {
    await setAllInBatches([1, 2, 3], toEntry);

    expect(mockBatches).toHaveLength(1);
    expect(mockBatches[0].set).toHaveBeenCalledTimes(3);
    expect(mockBatches[0].set).toHaveBeenCalledWith('ref-1', { n: 1 });
    expect(mockBatches[0].commit).toHaveBeenCalledTimes(1);
  });

  it('上限（500件）を超えたらバッチを分ける', async () => {
    const items = Array.from({ length: FIRESTORE_BATCH_LIMIT * 2 + 1 }, (_, i) => i);

    await setAllInBatches(items, toEntry);

    expect(mockBatches.map((b) => b.set.mock.calls.length)).toEqual([
      FIRESTORE_BATCH_LIMIT,
      FIRESTORE_BATCH_LIMIT,
      1,
    ]);
    mockBatches.forEach((b) => expect(b.commit).toHaveBeenCalledTimes(1));
  });

  it('0件なら何も書き込まない', async () => {
    await setAllInBatches([], toEntry);
    expect(mockBatches).toHaveLength(0);
  });

  it('コミットの失敗を伝える', async () => {
    const { writeBatch } = jest.requireMock('firebase/firestore');
    writeBatch.mockImplementationOnce(() => ({
      set: jest.fn(),
      commit: jest.fn().mockRejectedValue(new Error('permission-denied')),
    }));

    await expect(setAllInBatches([1], toEntry)).rejects.toThrow('permission-denied');
  });
});
