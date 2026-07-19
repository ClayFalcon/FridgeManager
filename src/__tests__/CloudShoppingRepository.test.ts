jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...path) => path.join('/')),
  doc: jest.fn((colRef, id) => `${colRef}/${id}`),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((colRef) => colRef),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('../config/firebase', () => ({ db: {} }));

import { collection, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { CloudShoppingRepository } from '../db/CloudShoppingRepository';
import { ShoppingItem } from '../types/shopping';

function makeSnapshot(items: ShoppingItem[]) {
  return {
    docs: items.map((item) => ({
      id: item.id,
      data: () => ({ name: item.name, checked: item.checked }),
    })),
  };
}

describe('CloudShoppingRepository', () => {
  const uid = 'test-uid';
  let repo: CloudShoppingRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CloudShoppingRepository(uid);
  });

  it('users/{uid}/shopping_items コレクションを参照する', async () => {
    (getDocs as jest.Mock).mockResolvedValue(makeSnapshot([]));

    await repo.getAll();

    expect(collection).toHaveBeenCalledWith({}, 'users', uid, 'shopping_items');
  });

  it('subscribeがdocsをShoppingItemに変換する', () => {
    let capturedCallback: ((snapshot: ReturnType<typeof makeSnapshot>) => void) | null = null;
    (onSnapshot as jest.Mock).mockImplementation((_q, cb) => {
      capturedCallback = cb;
      return () => {};
    });

    const callback = jest.fn();
    repo.subscribe(callback);
    capturedCallback!(makeSnapshot([{ id: '1', name: '卵', checked: true }]));

    expect(callback).toHaveBeenCalledWith([{ id: '1', name: '卵', checked: true }]);
  });

  it('setCheckedがupdateDocでcheckedのみ更新する', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await repo.setChecked('1', true);

    expect(updateDoc).toHaveBeenCalledWith(`users/${uid}/shopping_items/1`, { checked: true });
  });

  it('clearCheckedがchecked=trueのdocのみ削除する', async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      makeSnapshot([
        { id: '1', name: '卵', checked: true },
        { id: '2', name: '牛乳', checked: false },
        { id: '3', name: 'パン', checked: true },
      ]),
    );
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await repo.clearChecked();

    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenCalledWith(`users/${uid}/shopping_items/1`);
    expect(deleteDoc).toHaveBeenCalledWith(`users/${uid}/shopping_items/3`);
  });

  it('clearAllが全docを削除する', async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      makeSnapshot([
        { id: '1', name: '卵', checked: true },
        { id: '2', name: '牛乳', checked: false },
      ]),
    );
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await repo.clearAll();

    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenCalledWith(`users/${uid}/shopping_items/1`);
    expect(deleteDoc).toHaveBeenCalledWith(`users/${uid}/shopping_items/2`);
  });
});
