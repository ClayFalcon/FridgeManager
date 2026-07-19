import { defaultExpiryDateFor, initialPurchaseExpiryDate, getExpiryStatus } from '../utils/expiryUtils';

describe('defaultExpiryDateFor', () => {
  const from = new Date(2026, 6, 20); // 2026-07-20

  it('目安日数が設定されていれば今日+日数のISO日付を返す', () => {
    expect(defaultExpiryDateFor({ defaultExpiryDays: 7 }, from)).toBe('2026-07-27');
  });

  it('月をまたぐ加算も正しく計算する', () => {
    expect(defaultExpiryDateFor({ defaultExpiryDays: 14 }, from)).toBe('2026-08-03');
  });

  it('0日なら今日を返す', () => {
    expect(defaultExpiryDateFor({ defaultExpiryDays: 0 }, from)).toBe('2026-07-20');
  });

  it('目安日数が未設定ならundefinedを返す', () => {
    expect(defaultExpiryDateFor({}, from)).toBeUndefined();
    expect(defaultExpiryDateFor(null, from)).toBeUndefined();
    expect(defaultExpiryDateFor(undefined, from)).toBeUndefined();
  });
});

describe('initialPurchaseExpiryDate', () => {
  const from = new Date(2026, 6, 20); // 2026-07-20

  it('目安日数が設定されていれば今日+日数を返す', () => {
    expect(initialPurchaseExpiryDate({ defaultExpiryDays: 14 }, from)).toBe('2026-08-03');
  });

  it('目安日数が未設定なら翌日を返す', () => {
    expect(initialPurchaseExpiryDate({}, from)).toBe('2026-07-21');
  });

  it('該当食材がない（新規品目）場合も翌日を返す', () => {
    expect(initialPurchaseExpiryDate(null, from)).toBe('2026-07-21');
    expect(initialPurchaseExpiryDate(undefined, from)).toBe('2026-07-21');
  });

  it('目安0日なら今日を返す（翌日フォールバックしない）', () => {
    expect(initialPurchaseExpiryDate({ defaultExpiryDays: 0 }, from)).toBe('2026-07-20');
  });
});

describe('getExpiryStatus', () => {
  it('未設定はnone', () => {
    expect(getExpiryStatus(undefined)).toBe('none');
    expect(getExpiryStatus('')).toBe('none');
  });

  it('過去日はexpired', () => {
    expect(getExpiryStatus('2000-01-01')).toBe('expired');
  });

  it('遠い未来はok', () => {
    expect(getExpiryStatus('2099-12-31')).toBe('ok');
  });
});
