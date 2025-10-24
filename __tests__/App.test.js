import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';

// Alert.alertをモック
jest.spyOn(Alert, 'alert');

describe('App Component', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  it('アプリが正常にレンダリングされる', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('FridgeManager')).toBeTruthy();
    expect(getByText('ダイアログを表示')).toBeTruthy();
  });

  it('ボタンを押すとダイアログが表示される', async () => {
    const { getByText } = render(<App />);
    const button = getByText('ダイアログを表示');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'メッセージ',
        'ボタンが押されました！',
        [
          {
            text: 'OK',
            onPress: expect.any(Function),
          },
        ],
        { cancelable: false }
      );
    });
  });

  it('ダイアログのメッセージが正しく表示される', async () => {
    const { getByText } = render(<App />);
    const button = getByText('ダイアログを表示');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'メッセージ',
        'ボタンが押されました！',
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it('ダイアログのタイトルが正しく設定される', async () => {
    const { getByText } = render(<App />);
    const button = getByText('ダイアログを表示');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'メッセージ',
        expect.any(String),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it('OKボタンが正しく設定される', async () => {
    const { getByText } = render(<App />);
    const button = getByText('ダイアログを表示');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      const callArgs = Alert.alert.mock.calls[0];
      const buttons = callArgs[2];
      
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toEqual({
        text: 'OK',
        onPress: expect.any(Function),
      });
    });
  });

  it('ダイアログがキャンセル不可に設定される', async () => {
    const { getByText } = render(<App />);
    const button = getByText('ダイアログを表示');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      const callArgs = Alert.alert.mock.calls[0];
      const options = callArgs[3];
      
      expect(options).toEqual({ cancelable: false });
    });
  });
});
