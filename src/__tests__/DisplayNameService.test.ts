jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, ...path) => {
    if (path.length % 2 !== 0) throw new Error(`Invalid document reference: ${path.join('/')}`);
    return path.join('/');
  }),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));
jest.mock('../config/firebase', () => ({ db: {} }));

import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  DISPLAY_NAME_MAX_LENGTH,
  getMyDisplayName,
  getOwnerDisplayName,
  saveMyDisplayName,
  validateDisplayName,
} from '../services/DisplayNameService';

describe('validateDisplayName', () => {
  it('前後の空白を取り除いた名前を返す', () => {
    expect(validateDisplayName('  はやと ')).toEqual({ ok: true, name: 'はやと' });
  });

  it('空（空白だけ）はエラー', () => {
    expect(validateDisplayName('   ')).toEqual({ ok: false, error: '名前を入力してください' });
  });

  it(`${DISPLAY_NAME_MAX_LENGTH}文字までは使え、それを超えるとエラー`, () => {
    expect(validateDisplayName('あ'.repeat(DISPLAY_NAME_MAX_LENGTH)).ok).toBe(true);
    expect(validateDisplayName('あ'.repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: `名前は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`,
    });
  });

  it('絵文字は1文字として数える', () => {
    expect(validateDisplayName('🍙'.repeat(DISPLAY_NAME_MAX_LENGTH)).ok).toBe(true);
  });
});

describe('getMyDisplayName', () => {
  beforeEach(() => jest.clearAllMocks());

  it('本人用の保存場所から名前を読む', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ data: () => ({ displayName: 'はやと' }) });
    await expect(getMyDisplayName('u1')).resolves.toBe('はやと');
    expect(getDoc).toHaveBeenCalledWith('users/u1/profile/name');
  });

  it('未設定なら null', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ data: () => undefined });
    await expect(getMyDisplayName('u1')).resolves.toBeNull();
  });
});

describe('saveMyDisplayName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('自分がオーナーなら、本人用とオーナー名の2か所に保存する', async () => {
    await expect(saveMyDisplayName('u1', ' はやと ', 'u1')).resolves.toBe('はやと');

    expect(setDoc).toHaveBeenCalledWith('users/u1/profile/name', { displayName: 'はやと' });
    expect(setDoc).toHaveBeenCalledWith('users/u1/meta/owner', { displayName: 'はやと' });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('他人のグループに参加中なら、そのメンバー一覧の名前も更新する', async () => {
    await saveMyDisplayName('u1', 'はやと', 'owner-uid');

    expect(updateDoc).toHaveBeenCalledWith('users/owner-uid/members/u1', { displayName: 'はやと' });
  });

  it('不正な名前は保存せずエラー', async () => {
    await expect(saveMyDisplayName('u1', '  ', 'u1')).rejects.toThrow('名前を入力してください');
    expect(setDoc).not.toHaveBeenCalled();
  });
});

describe('getOwnerDisplayName', () => {
  beforeEach(() => jest.clearAllMocks());

  it('オーナーの名前を読む', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ data: () => ({ displayName: 'ママ' }) });
    await expect(getOwnerDisplayName('owner-uid')).resolves.toBe('ママ');
    expect(getDoc).toHaveBeenCalledWith('users/owner-uid/meta/owner');
  });

  it('読めない（権限エラー等）ときは null', async () => {
    (getDoc as jest.Mock).mockRejectedValue(new Error('permission-denied'));
    await expect(getOwnerDisplayName('owner-uid')).resolves.toBeNull();
  });
});
