jest.mock('../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn(), setDoc: jest.fn(), updateDoc: jest.fn() }));

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DisplayNameModal, { DISPLAY_NAME_PRIVACY_NOTE } from '../components/DisplayNameModal';

function setup(props: Partial<React.ComponentProps<typeof DisplayNameModal>> = {}) {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onCancel = jest.fn();
  const utils = render(
    <DisplayNameModal visible onSave={onSave} onCancel={onCancel} {...props} />,
  );
  return { ...utils, onSave, onCancel };
}

describe('DisplayNameModal', () => {
  it('空欄から始まり、家族以外には公開されないことを伝える', () => {
    const { getByTestId } = setup();
    expect(getByTestId('display-name-input').props.value).toBe('');
    expect(getByTestId('display-name-privacy-note')).toHaveTextContent(DISPLAY_NAME_PRIVACY_NOTE);
    expect(DISPLAY_NAME_PRIVACY_NOTE).toContain('家族以外には公開されません');
  });

  it('変更のときは今の名前を入れておく', () => {
    const { getByTestId } = setup({ initialName: 'はやと' });
    expect(getByTestId('display-name-input').props.value).toBe('はやと');
  });

  it('共有を始めた直後は一言を添え、キャンセルを「あとで」にできる', () => {
    const { getByText } = setup({ lead: '家族との共有を開始しました', cancelLabel: 'あとで' });
    expect(getByText('家族との共有を開始しました')).toBeTruthy();
    expect(getByText('あとで')).toBeTruthy();
  });

  it('入力した名前（前後の空白を除く）で保存する', async () => {
    const { getByTestId, onSave } = setup();
    fireEvent.changeText(getByTestId('display-name-input'), '  はやと  ');
    fireEvent.press(getByTestId('btn-display-name-save'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('はやと'));
  });

  it('空のまま保存しようとするとエラーを表示し、保存しない', () => {
    const { getByTestId, onSave } = setup();
    fireEvent.press(getByTestId('btn-display-name-save'));
    expect(getByTestId('display-name-error')).toHaveTextContent('名前を入力してください');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('保存に失敗したらエラーを表示する', async () => {
    const { getByTestId, onSave } = setup();
    onSave.mockRejectedValue(new Error('通信エラー'));
    fireEvent.changeText(getByTestId('display-name-input'), 'はやと');
    fireEvent.press(getByTestId('btn-display-name-save'));
    await waitFor(() => expect(getByTestId('display-name-error')).toHaveTextContent('通信エラー'));
  });

  it('キャンセルできる', () => {
    const { getByTestId, onCancel } = setup();
    fireEvent.press(getByTestId('btn-display-name-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
