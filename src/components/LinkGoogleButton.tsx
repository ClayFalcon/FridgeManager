import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const LINKING_WAIT_MESSAGE = 'この処理には10秒ほどかかることがあります。そのままお待ちください。';

interface Props {
  isLinking: boolean;
  onPress: () => void;
}

// 「家族と共有する」ボタン。Google 承認後にコード交換・アカウントリンク・クラウド移行が続き
// 10秒ほどかかることがあるため、処理中は待ち時間の目安を表示する。
export default function LinkGoogleButton({ isLinking, onPress }: Props) {
  return (
    <View>
      <TouchableOpacity
        testID="btn-link-google"
        style={[styles.button, isLinking && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isLinking}
      >
        {isLinking ? (
          <ActivityIndicator testID="link-loading" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>家族と共有する</Text>
        )}
      </TouchableOpacity>
      {isLinking && (
        <Text testID="link-loading-message" style={styles.message}>
          {LINKING_WAIT_MESSAGE}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0d8f7a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    fontSize: 12,
    color: '#5c7a72',
    lineHeight: 17,
    textAlign: 'center',
  },
});
