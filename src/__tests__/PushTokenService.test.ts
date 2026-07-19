jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({ isDevice: true }));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, ...path) => path.join('/')),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
}));

jest.mock('../config/firebase', () => ({ db: {} }));

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { registerPushToken } from '../services/PushTokenService';

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetToken = Notifications.getExpoPushTokenAsync as jest.Mock;

describe('registerPushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as { isDevice: boolean }).isDevice = true;
    (Constants as unknown as { expoConfig: { extra: { eas: { projectId: string | undefined } } } }).expoConfig = {
      extra: { eas: { projectId: 'test-project-id' } },
    };
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('実機でない場合は何もしない', async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    await registerPushToken('owner-uid', 'owner-uid');

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('通知権限が拒否された場合は何もしない', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    await registerPushToken('owner-uid', 'owner-uid');

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('EASプロジェクトIDが未設定の場合は何もしない', async () => {
    (Constants as unknown as { expoConfig: { extra: { eas: { projectId: string | undefined } } } }).expoConfig = {
      extra: { eas: { projectId: undefined } },
    };

    await registerPushToken('owner-uid', 'owner-uid');

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('オーナー本人の場合は users/{ownerUid}/pushTokens/{token} に書き込む', async () => {
    await registerPushToken('owner-uid', 'owner-uid');

    expect(doc).toHaveBeenCalledWith(
      {},
      'users',
      'owner-uid',
      'pushTokens',
      'ExponentPushToken[abc123]',
    );
    expect(setDoc).toHaveBeenCalledWith(
      'users/owner-uid/pushTokens/ExponentPushToken[abc123]',
      expect.objectContaining({ token: 'ExponentPushToken[abc123]' }),
    );
  });

  it('メンバーの場合は users/{ownerUid}/members/{uid}/pushTokens/{token} に書き込む', async () => {
    await registerPushToken('owner-uid', 'member-uid');

    expect(doc).toHaveBeenCalledWith(
      {},
      'users',
      'owner-uid',
      'members',
      'member-uid',
      'pushTokens',
      'ExponentPushToken[abc123]',
    );
  });

  it('トークン取得でエラーが発生してもthrowしない（フェイルソフト）', async () => {
    mockGetToken.mockRejectedValue(new Error('network error'));

    await expect(registerPushToken('owner-uid', 'owner-uid')).resolves.toBeUndefined();
    expect(setDoc).not.toHaveBeenCalled();
  });
});
