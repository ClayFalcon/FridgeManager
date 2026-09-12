jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// 通知機能が無効な状態を再現する
jest.mock('../config/features', () => ({ NOTIFICATIONS_ENABLED: false }));

import * as Notifications from 'expo-notifications';
import { renderHook } from '@testing-library/react-native';
import { useNotificationDeepLink } from '../hooks/useNotificationDeepLink';

describe('useNotificationDeepLink（通知無効時）', () => {
  beforeEach(() => jest.clearAllMocks());

  it('通知が無効なら通知APIに一切触れず、pendingTargetはnullのまま', () => {
    const { result } = renderHook(() => useNotificationDeepLink());

    expect(result.current.pendingTarget).toBeNull();
    expect(Notifications.getLastNotificationResponseAsync).not.toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
  });
});
