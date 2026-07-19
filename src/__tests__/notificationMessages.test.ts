import { formatExpiryMessage, formatManualNotifyMessage } from '../utils/notificationMessages';

describe('formatExpiryMessage', () => {
  it('食品が1件・当日の場合', () => {
    expect(formatExpiryMessage(['納豆'], 0)).toBe('納豆の賞味期限が今日までです。');
  });

  it('食品が1件・N日前の場合', () => {
    expect(formatExpiryMessage(['納豆'], 3)).toBe('納豆の賞味期限が3日以内です。');
  });

  it('食品が2件以上・当日の場合、先頭2件と件数でまとめる', () => {
    expect(formatExpiryMessage(['納豆', '卵', '牛乳', 'ヨーグルト'], 0)).toBe(
      '納豆や卵など4つの食材の賞味期限が今日までです。',
    );
  });

  it('食品が2件以上・N日前の場合', () => {
    expect(formatExpiryMessage(['納豆', '卵', '牛乳', 'ヨーグルト'], 3)).toBe(
      '納豆や卵など4つの食材の賞味期限が3日以内です。',
    );
  });

  it('食品が0件の場合は空文字を返す', () => {
    expect(formatExpiryMessage([], 0)).toBe('');
  });
});

describe('formatManualNotifyMessage', () => {
  it('表示名がある場合はそのまま使う', () => {
    expect(formatManualNotifyMessage('たろう')).toEqual({
      title: 'FridgeManager',
      body: 'たろうさんが在庫状況を最新化しました！',
    });
  });

  it('表示名がnullの場合はフォールバック名を使う', () => {
    expect(formatManualNotifyMessage(null)).toEqual({
      title: 'FridgeManager',
      body: '共有メンバーさんが在庫状況を最新化しました！',
    });
  });

  it('表示名が空文字の場合もフォールバック名を使う', () => {
    expect(formatManualNotifyMessage('  ')).toEqual({
      title: 'FridgeManager',
      body: '共有メンバーさんが在庫状況を最新化しました！',
    });
  });
});
