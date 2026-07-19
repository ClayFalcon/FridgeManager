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

import { collection, setDoc, onSnapshot } from 'firebase/firestore';
import { CloudRecipeRepository } from '../db/CloudRecipeRepository';
import { Recipe } from '../types/recipe';

const sampleRecipe: Recipe = {
  id: '1',
  name: 'トマトパスタ',
  ingredients: [{ name: 'トマト', quantity: '2個' }, { name: 'パスタ' }],
  memo: 'メモ',
};

function makeSnapshot(recipes: Recipe[]) {
  return {
    docs: recipes.map((r) => ({
      id: r.id,
      data: () => ({
        name: r.name,
        ingredients: r.ingredients.map((i) => ({ name: i.name, quantity: i.quantity ?? null })),
        memo: r.memo ?? null,
      }),
    })),
  };
}

describe('CloudRecipeRepository', () => {
  const uid = 'test-uid';
  let repo: CloudRecipeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new CloudRecipeRepository(uid);
  });

  it('users/{uid}/recipes コレクションを参照する', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await repo.add(sampleRecipe);

    expect(collection).toHaveBeenCalledWith({}, 'users', uid, 'recipes');
  });

  it('addがsetDocでingredientsをマップ配列に変換して書き込む', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await repo.add(sampleRecipe);

    expect(setDoc).toHaveBeenCalledWith(`users/${uid}/recipes/1`, {
      name: 'トマトパスタ',
      ingredients: [
        { name: 'トマト', quantity: '2個' },
        { name: 'パスタ', quantity: null },
      ],
      memo: 'メモ',
    });
  });

  it('subscribeがonSnapshotのdocsをRecipeに変換する（quantity nullはundefinedに）', () => {
    let capturedCallback: ((snapshot: ReturnType<typeof makeSnapshot>) => void) | null = null;
    (onSnapshot as jest.Mock).mockImplementation((_q, cb) => {
      capturedCallback = cb;
      return () => {};
    });

    const callback = jest.fn();
    repo.subscribe(callback);
    capturedCallback!(makeSnapshot([sampleRecipe]));

    expect(callback).toHaveBeenCalledWith([
      {
        id: '1',
        name: 'トマトパスタ',
        ingredients: [{ name: 'トマト', quantity: '2個' }, { name: 'パスタ', quantity: undefined }],
        memo: 'メモ',
      },
    ]);
  });

  it('返り値の関数で購読解除できる', () => {
    const unsubscribeMock = jest.fn();
    (onSnapshot as jest.Mock).mockReturnValue(unsubscribeMock);

    const unsubscribe = repo.subscribe(jest.fn());
    unsubscribe();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
