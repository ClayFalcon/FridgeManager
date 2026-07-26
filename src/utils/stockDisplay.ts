import { StockLevel, StatusMode } from '../types/food';

export interface StepButton {
  level: StockLevel;
  label: string;
}

const THREE_STEP: StepButton[] = [
  { level: 0, label: '全くない' },
  { level: 1, label: 'ちょっとある' },
  { level: 2, label: '買ったばかり' },
];

const TWO_STEP: StepButton[] = [
  { level: 0, label: 'ない' },
  { level: 2, label: 'ある' },
];

/** ステータスモードに応じた在庫ボタンの配列を返す */
export function stepButtons(mode: StatusMode): StepButton[] {
  return mode === '2step' ? TWO_STEP : THREE_STEP;
}

/**
 * あるボタンが現在の在庫レベルに対して選択状態かを判定する。
 * 2段階の「ある」(level 2) は在庫レベル1・2の両方で選択状態になる（ちょっとある=あり扱い）。
 */
export function isButtonActive(
  mode: StatusMode,
  buttonLevel: StockLevel,
  current: StockLevel,
): boolean {
  if (mode === '2step') {
    return buttonLevel === 0 ? current === 0 : current >= 1;
  }
  return buttonLevel === current;
}
