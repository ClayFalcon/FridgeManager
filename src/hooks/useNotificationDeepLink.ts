import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NOTIFICATIONS_ENABLED } from '../config/features';

export type DeepLinkTarget = { type: 'expirySorted' } | { type: 'manualNotify' } | null;

function mapDataToTarget(data: Record<string, unknown> | undefined): DeepLinkTarget {
  if (!data) return null;
  if (data.kind === 'expiry') return { type: 'expirySorted' };
  if (data.kind === 'manualNotify') return { type: 'manualNotify' };
  return null;
}

/**
 * 通知タップによる遷移先を、コールドスタート（起動時タップ）と起動中タップの両方から解決する。
 */
export function useNotificationDeepLink(): { pendingTarget: DeepLinkTarget; consume: () => void } {
  const [pendingTarget, setPendingTarget] = useState<DeepLinkTarget>(null);
  const checkedColdStart = useRef(false);

  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) return; // 通知機能が無効な間は通知タップ遷移を処理しない

    if (!checkedColdStart.current) {
      checkedColdStart.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          const data = response?.notification.request.content.data as Record<string, unknown> | undefined;
          const target = mapDataToTarget(data);
          if (target) setPendingTarget(target);
        })
        .catch(() => {});
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const target = mapDataToTarget(data);
      if (target) setPendingTarget(target);
    });

    return () => subscription.remove();
  }, []);

  function consume() {
    setPendingTarget(null);
  }

  return { pendingTarget, consume };
}
