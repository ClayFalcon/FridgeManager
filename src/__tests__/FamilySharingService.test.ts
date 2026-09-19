const mockAuth: { currentUser: { uid: string } | null } = { currentUser: null };
const mockMigrateToCloud = jest.fn().mockResolvedValue(undefined);

// import より先に評価されるため、参照はゲッター経由で遅らせる
jest.mock('../config/firebase', () => ({
  get auth() {
    return mockAuth;
  },
}));
jest.mock('../services/MigrationService', () => ({
  migrateToCloud: (...args: unknown[]) => mockMigrateToCloud(...args),
}));
jest.mock('../db/LocalRepository', () => ({ LocalRepository: jest.fn(() => ({ kind: 'local-food' })) }));
jest.mock('../db/LocalRecipeRepository', () => ({
  LocalRecipeRepository: jest.fn(() => ({ kind: 'local-recipe' })),
}));
jest.mock('../db/LocalShoppingRepository', () => ({
  LocalShoppingRepository: jest.fn(() => ({ kind: 'local-shopping' })),
}));
jest.mock('../db/CloudRepository', () => ({
  CloudRepository: jest.fn((uid: string) => ({ kind: 'cloud-food', uid })),
}));
jest.mock('../db/CloudRecipeRepository', () => ({
  CloudRecipeRepository: jest.fn((uid: string) => ({ kind: 'cloud-recipe', uid })),
}));
jest.mock('../db/CloudShoppingRepository', () => ({
  CloudShoppingRepository: jest.fn((uid: string) => ({ kind: 'cloud-shopping', uid })),
}));

import { linkGoogleAndMigrate, migrateAllToCloud } from '../services/FamilySharingService';

describe('linkGoogleAndMigrate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
  });

  it('初回（押した時点で未ログイン）でも、リンク後のユーザーのクラウドへ移行する', async () => {
    const signInAnon = jest.fn(async () => {
      mockAuth.currentUser = { uid: 'new-anon-uid' };
    });
    const linkWithGoogle = jest.fn().mockResolvedValue('linked');
    const migrateAll = jest.fn().mockResolvedValue(undefined);

    await expect(linkGoogleAndMigrate({ signInAnon, linkWithGoogle, migrateAll })).resolves.toBe(
      'linked',
    );

    expect(signInAnon).toHaveBeenCalledTimes(1);
    expect(linkWithGoogle).toHaveBeenCalledTimes(1);
    expect(migrateAll).toHaveBeenCalledWith('new-anon-uid');
  });

  it('匿名ログイン → リンク → 移行 の順に行う', async () => {
    const order: string[] = [];
    await linkGoogleAndMigrate({
      signInAnon: async () => {
        order.push('signIn');
      },
      linkWithGoogle: async () => {
        order.push('link');
        return 'linked';
      },
      getCurrentUid: () => 'uid',
      migrateAll: async () => {
        order.push('migrate');
      },
    });
    expect(order).toEqual(['signIn', 'link', 'migrate']);
  });

  it('リンクに失敗したら移行しない', async () => {
    const migrateAll = jest.fn();

    await expect(
      linkGoogleAndMigrate({
        signInAnon: jest.fn().mockResolvedValue(undefined),
        linkWithGoogle: jest.fn().mockRejectedValue(new Error('Google sign-in cancelled or failed')),
        getCurrentUid: () => 'uid',
        migrateAll,
      }),
    ).rejects.toThrow('Google sign-in cancelled or failed');
    expect(migrateAll).not.toHaveBeenCalled();
  });

  it('既存ユーザーでログインし直した場合（入れ直し・機種変更）は、端末データを移行しない', async () => {
    const migrateAll = jest.fn();

    await expect(
      linkGoogleAndMigrate({
        signInAnon: jest.fn().mockResolvedValue(undefined),
        linkWithGoogle: jest.fn().mockResolvedValue('signedIn'),
        getCurrentUid: () => 'existing-uid',
        migrateAll,
      }),
    ).resolves.toBe('signedIn');
    expect(migrateAll).not.toHaveBeenCalled();
  });

  it('リンク後もユーザーが取れなければエラーにして移行しない', async () => {
    const migrateAll = jest.fn();

    await expect(
      linkGoogleAndMigrate({
        signInAnon: jest.fn().mockResolvedValue(undefined),
        linkWithGoogle: jest.fn().mockResolvedValue('linked'),
        getCurrentUid: () => null,
        migrateAll,
      }),
    ).rejects.toThrow('ログイン中のユーザーが見つかりません');
    expect(migrateAll).not.toHaveBeenCalled();
  });
});

describe('migrateAllToCloud', () => {
  beforeEach(() => jest.clearAllMocks());

  it('食品・レシピ・買い物リストを、指定した uid のクラウドへ移行する', async () => {
    await migrateAllToCloud('u1');

    expect(mockMigrateToCloud).toHaveBeenCalledTimes(3);
    expect(mockMigrateToCloud).toHaveBeenCalledWith({ kind: 'local-food' }, { kind: 'cloud-food', uid: 'u1' });
    expect(mockMigrateToCloud).toHaveBeenCalledWith(
      { kind: 'local-recipe' },
      { kind: 'cloud-recipe', uid: 'u1' },
    );
    expect(mockMigrateToCloud).toHaveBeenCalledWith(
      { kind: 'local-shopping' },
      { kind: 'cloud-shopping', uid: 'u1' },
    );
  });

  it('3種類の移行を並行して始める（1つ目の完了を待たない）', async () => {
    let releaseFirst!: () => void;
    mockMigrateToCloud.mockImplementationOnce(
      () => new Promise<void>((resolve) => (releaseFirst = resolve)),
    );

    const done = migrateAllToCloud('u1');
    await Promise.resolve();

    expect(mockMigrateToCloud).toHaveBeenCalledTimes(3);
    releaseFirst();
    await done;
  });
});
