jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// 通知タップ遷移のロジックそのものを検証するため、このテストではフラグを有効にする
// （リリース時は features.ts で無効化。再有効化時にロジックが壊れていないことをここで担保）
jest.mock('../config/features', () => ({ NOTIFICATIONS_ENABLED: true }));

import * as Notifications from 'expo-notifications';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useNotificationDeepLink } from '../hooks/useNotificationDeepLink';

const mockGetLastResponse = Notifications.getLastNotificationResponseAsync as jest.Mock;
const mockAddListener = Notifications.addNotificationResponseReceivedListener as jest.Mock;

function makeResponse(data: Record<string, unknown>) {
  return { notification: { request: { content: { data } } } };
}

describe('useNotificationDeepLink', () => {
  let capturedListener: ((response: unknown) => void) | undefined;

  beforeEach(() => {
    capturedListener = undefined;
    mockGetLastResponse.mockReset().mockResolvedValue(null);
    mockAddListener.mockReset().mockImplementation((listener: (response: unknown) => void) => {
      capturedListener = listener;
      return { remove: jest.fn() };
    });
  });

  it('コールドスタート時、expiry通知のタップからexpirySortedへ遷移する', async () => {
    mockGetLastResponse.mockResolvedValue(makeResponse({ kind: 'expiry' }));

    const { result } = renderHook(() => useNotificationDeepLink());

    await waitFor(() => {
      expect(result.current.pendingTarget).toEqual({ type: 'expirySorted' });
    });
  });

  it('コールドスタート時、通知応答がなければpendingTargetはnullのまま', async () => {
    const { result } = renderHook(() => useNotificationDeepLink());

    await waitFor(() => {
      expect(mockGetLastResponse).toHaveBeenCalled();
    });
    expect(result.current.pendingTarget).toBeNull();
  });

  it('起動中のタップで、manualNotify通知からmanualNotifyへ遷移する', () => {
    const { result } = renderHook(() => useNotificationDeepLink());

    act(() => {
      capturedListener?.(makeResponse({ kind: 'manualNotify' }));
    });

    expect(result.current.pendingTarget).toEqual({ type: 'manualNotify' });
  });

  it('未知のkindは無視する', () => {
    const { result } = renderHook(() => useNotificationDeepLink());

    act(() => {
      capturedListener?.(makeResponse({ kind: 'unknown' }));
    });

    expect(result.current.pendingTarget).toBeNull();
  });

  it('consume()を呼ぶとpendingTargetがクリアされる', () => {
    const { result } = renderHook(() => useNotificationDeepLink());

    act(() => {
      capturedListener?.(makeResponse({ kind: 'expiry' }));
    });
    expect(result.current.pendingTarget).toEqual({ type: 'expirySorted' });

    act(() => {
      result.current.consume();
    });
    expect(result.current.pendingTarget).toBeNull();
  });
});
