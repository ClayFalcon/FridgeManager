import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LinkGoogleButton, { LINKING_WAIT_MESSAGE } from '../components/LinkGoogleButton';

describe('LinkGoogleButton', () => {
  it('待機中でなければボタン文言を表示し、待ち時間の案内は出さない', () => {
    const { getByText, queryByTestId } = render(
      <LinkGoogleButton isLinking={false} onPress={jest.fn()} />,
    );
    expect(getByText('家族と共有する')).toBeTruthy();
    expect(queryByTestId('link-loading')).toBeNull();
    expect(queryByTestId('link-loading-message')).toBeNull();
  });

  it('タップすると onPress が呼ばれる', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<LinkGoogleButton isLinking={false} onPress={onPress} />);
    fireEvent.press(getByTestId('btn-link-google'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('処理中はローディングと「10秒ほどかかる」案内を表示する', () => {
    const { getByTestId, queryByText } = render(
      <LinkGoogleButton isLinking onPress={jest.fn()} />,
    );
    expect(getByTestId('link-loading')).toBeTruthy();
    expect(getByTestId('link-loading-message')).toHaveTextContent(LINKING_WAIT_MESSAGE);
    expect(LINKING_WAIT_MESSAGE).toContain('10秒ほどかかる');
    expect(queryByText('家族と共有する')).toBeNull();
  });

  it('処理中は二重タップできない', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<LinkGoogleButton isLinking onPress={onPress} />);
    fireEvent.press(getByTestId('btn-link-google'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
