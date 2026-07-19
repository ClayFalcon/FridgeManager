import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRepository } from './useRepository';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { getSettings } from '../db/NotificationSettingsStore';
import { rescheduleExpiryNotifications } from '../services/ExpiryNotificationScheduler';
import { FoodItem } from '../types/food';

const DEBOUNCE_MS = 500;

/** 食材データ・通知設定の変化やフォアグラウンド復帰のたびに、賞味期限のローカル通知を再スケジュールする */
export function useExpiryNotificationScheduler(): void {
  const repo = useRepository();
  const { user } = useAuth();
  const { ownerUid } = useSharing();
  const itemsRef = useRef<FoodItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectiveOwnerUid = ownerUid ?? user?.uid ?? 'local';

  useEffect(() => {
    const scheduleDebounced = (items: FoodItem[]) => {
      itemsRef.current = items;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        rescheduleExpiryNotifications(itemsRef.current, getSettings(), effectiveOwnerUid).catch(() => {});
      }, DEBOUNCE_MS);
    };

    let unsubscribe: (() => void) | undefined;
    if (repo.subscribe) {
      unsubscribe = repo.subscribe(scheduleDebounced);
    } else {
      repo.getAll().then(scheduleDebounced);
    }

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        repo.getAll().then(scheduleDebounced);
      }
    });

    return () => {
      unsubscribe?.();
      appStateSub.remove();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [repo, effectiveOwnerUid]);
}
