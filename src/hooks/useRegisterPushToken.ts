import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { registerPushToken } from '../services/PushTokenService';
import { NOTIFICATIONS_ENABLED } from '../config/features';

/** ログイン確定時・フォアグラウンド復帰時にプッシュ通知トークンを登録する */
export function useRegisterPushToken(): void {
  const { user } = useAuth();
  const { ownerUid } = useSharing();

  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) return; // 通知機能が無効な間はトークン登録しない
    if (!user) return;
    const effectiveOwnerUid = ownerUid ?? user.uid;

    registerPushToken(effectiveOwnerUid, user.uid);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') registerPushToken(effectiveOwnerUid, user.uid);
    });

    return () => subscription.remove();
  }, [user, ownerUid]);
}
