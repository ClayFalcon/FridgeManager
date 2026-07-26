import { stepButtons, isButtonActive } from '../utils/stockDisplay';

describe('stepButtons', () => {
  it('3段階モードは3つのボタンを返す', () => {
    const buttons = stepButtons('3step');
    expect(buttons).toEqual([
      { level: 0, label: '全くない' },
      { level: 1, label: 'ちょっとある' },
      { level: 2, label: '買ったばかり' },
    ]);
  });

  it('2段階モードは「ない」「ある」の2つのボタンを返す', () => {
    const buttons = stepButtons('2step');
    expect(buttons).toEqual([
      { level: 0, label: 'ない' },
      { level: 2, label: 'ある' },
    ]);
  });
});

describe('isButtonActive', () => {
  describe('3段階モード', () => {
    it('ボタンのレベルと現在の在庫が一致するときのみ選択状態', () => {
      expect(isButtonActive('3step', 0, 0)).toBe(true);
      expect(isButtonActive('3step', 1, 1)).toBe(true);
      expect(isButtonActive('3step', 2, 2)).toBe(true);
      expect(isButtonActive('3step', 0, 1)).toBe(false);
      expect(isButtonActive('3step', 2, 1)).toBe(false);
    });
  });

  describe('2段階モード', () => {
    it('「ない」(0)は在庫レベル0のときのみ選択状態', () => {
      expect(isButtonActive('2step', 0, 0)).toBe(true);
      expect(isButtonActive('2step', 0, 1)).toBe(false);
      expect(isButtonActive('2step', 0, 2)).toBe(false);
    });

    it('「ある」(2)は在庫レベル1・2の両方で選択状態（ちょっとある=あり扱い）', () => {
      expect(isButtonActive('2step', 2, 1)).toBe(true);
      expect(isButtonActive('2step', 2, 2)).toBe(true);
      expect(isButtonActive('2step', 2, 0)).toBe(false);
    });
  });
});
