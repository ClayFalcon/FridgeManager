import {
  computeNotificationPlan,
  daysUntil,
  MAX_PENDING_NOTIFICATIONS,
} from '../utils/expiryScheduling';
import { ExpiryNotificationRule } from '../types/notification';
import { FoodItem } from '../types/food';

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function makeItem(id: string, name: string, expiryDate?: string): FoodItem {
  return { id, name, stockLevel: 2, expiryDate, tags: [], location: 'fridge' };
}

describe('daysUntil', () => {
  const now = new Date(2026, 6, 19, 8, 0, 0);

  it('今日が期限日なら0', () => {
    expect(daysUntil(iso(now), now)).toBe(0);
  });

  it('未来の日付は正の日数', () => {
    expect(daysUntil(iso(addDays(now, 3)), now)).toBe(3);
  });

  it('過去の日付は負の日数', () => {
    expect(daysUntil(iso(addDays(now, -2)), now)).toBe(-2);
  });
});

describe('computeNotificationPlan', () => {
  const now = new Date(2026, 6, 19, 8, 0, 0);

  it('同じ日付・同じ時刻に該当する複数食材を1件の通知にまとめる', () => {
    const todayIso = iso(now);
    const items = [
      makeItem('1', '納豆', todayIso),
      makeItem('2', '卵', todayIso),
    ];
    const rules: ExpiryNotificationRule[] = [{ offsetDays: 0, times: ['09:00'] }];

    const plans = computeNotificationPlan(items, rules, 'owner1', now);

    expect(plans).toHaveLength(1);
    expect(plans[0].data.itemIds).toEqual(['1', '2']);
    expect(plans[0].body).toBe('納豆や卵など2つの食材の賞味期限が今日までです。');
  });

  it('オフセット・時刻が異なる場合は別々の通知になる', () => {
    const items = [
      makeItem('1', '納豆', iso(now)),
      makeItem('2', '牛乳', iso(addDays(now, 3))),
    ];
    const rules: ExpiryNotificationRule[] = [
      { offsetDays: 0, times: ['09:00'] },
      { offsetDays: 3, times: ['18:00'] },
    ];

    const plans = computeNotificationPlan(items, rules, 'owner1', now);

    expect(plans).toHaveLength(2);
    expect(plans.map((p) => p.data.itemIds)).toEqual([['1'], ['2']]);
  });

  it('賞味期限未設定の食品は除外する', () => {
    const items = [makeItem('1', '納豆', undefined), makeItem('2', '卵', '')];
    const rules: ExpiryNotificationRule[] = [{ offsetDays: 0, times: ['09:00'] }];

    expect(computeNotificationPlan(items, rules, 'owner1', now)).toHaveLength(0);
  });

  it('現在時刻より過去の発火時刻は除外する', () => {
    const items = [makeItem('1', '納豆', iso(now))];
    const rules: ExpiryNotificationRule[] = [{ offsetDays: 0, times: ['07:00', '11:00'] }];

    const plans = computeNotificationPlan(items, rules, 'owner1', now);

    expect(plans).toHaveLength(1);
    expect(plans[0].identifier).toContain('11:00');
  });

  it(`MAX_PENDING_NOTIFICATIONS(${MAX_PENDING_NOTIFICATIONS})件を超える場合は発火が早い順に切り詰める`, () => {
    const rules: ExpiryNotificationRule[] = [];
    const items: FoodItem[] = [];
    for (let i = 0; i < 70; i++) {
      rules.push({ offsetDays: i, times: ['09:00'] });
      items.push(makeItem(`item-${i}`, `食品${i}`, iso(addDays(now, i))));
    }

    const plans = computeNotificationPlan(items, rules, 'owner1', now);

    expect(plans).toHaveLength(MAX_PENDING_NOTIFICATIONS);
    expect(plans[0].data.offsetDays).toBe(0);
    expect(plans[plans.length - 1].data.offsetDays).toBe(MAX_PENDING_NOTIFICATIONS - 1);
  });
});
