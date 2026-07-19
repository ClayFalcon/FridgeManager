import { FoodItem } from '../types/food';
import { ExpiryNotificationRule } from '../types/notification';
import { formatExpiryMessage } from './notificationMessages';

/** iOSのローカル通知同時予約上限 */
export const MAX_PENDING_NOTIFICATIONS = 64;

export interface ScheduledNotificationPlan {
  identifier: string;
  triggerAt: Date;
  title: string;
  body: string;
  data: {
    kind: 'expiry';
    ownerUid: string;
    offsetDays: number;
    date: string;
    itemIds: string[];
  };
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** expiryDate（今日から見て何日後か）を計算する。過去はマイナス */
export function daysUntil(expiryDate: string, from: Date = new Date()): number {
  const today = startOfDay(from);
  const expiry = startOfDay(new Date(expiryDate));
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map((s) => parseInt(s, 10));
  return { hours, minutes };
}

/**
 * 食品一覧・通知ルールから、実際にスケジュールすべきローカル通知の一覧を計算する。
 * 同じ日付・時刻に該当する食品は1件の通知にまとめ（iOSの64件上限対策）、
 * 過去の発火時刻は除外し、上限件数でトリムする。
 */
export function computeNotificationPlan(
  items: FoodItem[],
  rules: ExpiryNotificationRule[],
  ownerUid: string,
  now: Date = new Date(),
): ScheduledNotificationPlan[] {
  const itemsByDate = new Map<string, FoodItem[]>();
  for (const item of items) {
    if (!item.expiryDate || !item.expiryDate.trim()) continue;
    const list = itemsByDate.get(item.expiryDate) ?? [];
    list.push(item);
    itemsByDate.set(item.expiryDate, list);
  }

  const plans: ScheduledNotificationPlan[] = [];

  for (const rule of rules) {
    for (const [expiryDate, dateItems] of itemsByDate) {
      if (daysUntil(expiryDate, now) !== rule.offsetDays) continue;

      for (const time of rule.times) {
        const { hours, minutes } = parseTime(time);
        const triggerAt = new Date(expiryDate);
        triggerAt.setHours(hours, minutes, 0, 0);
        if (triggerAt.getTime() <= now.getTime()) continue;

        plans.push({
          identifier: `expiry-${expiryDate}-${rule.offsetDays}-${time}`,
          triggerAt,
          title: 'FridgeManager',
          body: formatExpiryMessage(dateItems.map((i) => i.name), rule.offsetDays),
          data: {
            kind: 'expiry',
            ownerUid,
            offsetDays: rule.offsetDays,
            date: expiryDate,
            itemIds: dateItems.map((i) => i.id),
          },
        });
      }
    }
  }

  plans.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
  return plans.slice(0, MAX_PENDING_NOTIFICATIONS);
}
