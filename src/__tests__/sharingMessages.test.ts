import { JOINED_TITLE, joinedMessage, sharingStatusLabel } from '../utils/sharingMessages';

describe('共有の文言', () => {
  it('参加完了: オーナーの名前で、何が共有されるかを伝える', () => {
    expect(JOINED_TITLE).toBe('参加しました');
    expect(joinedMessage('ママ')).toBe(
      'ママ さんの冷蔵庫を一緒に使えるようになりました。食品・レシピ・買い物リストが共有されます。',
    );
  });

  it('共有状態: オーナーの名前で表示する', () => {
    expect(sharingStatusLabel('ママ')).toBe('ママ さんの冷蔵庫を共有中');
  });

  it('オーナーが名前を決めていなければ「招待した人」と呼ぶ', () => {
    expect(joinedMessage(null)).toContain('招待した人の冷蔵庫を一緒に使えるようになりました');
    expect(sharingStatusLabel(undefined)).toBe('招待した人の冷蔵庫を共有中');
  });

  it('分かりにくい「フリッジ」という言葉を使わない', () => {
    expect(joinedMessage('ママ')).not.toContain('フリッジ');
    expect(sharingStatusLabel('ママ')).not.toContain('フリッジ');
  });
});
