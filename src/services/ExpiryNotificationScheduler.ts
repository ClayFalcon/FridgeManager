import * as Notifications from 'expo-notifications';
import { FoodItem } from '../types/food';
import { NotificationSettings } from '../types/notification';
import { computeNotificationPlan } from '../utils/expiryScheduling';

export async function rescheduleExpiryNotifications(
  items: FoodItem[],
  settings: NotificationSettings,
  ownerUid: string,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  const plans = computeNotificationPlan(items, settings.rules, ownerUid);

  for (const plan of plans) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.identifier,
      content: { title: plan.title, body: plan.body, data: plan.data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.triggerAt },
    });
  }
}
