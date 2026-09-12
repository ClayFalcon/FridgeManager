import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import { AuthProvider } from './src/context/AuthContext';
import { SharingProvider } from './src/context/SharingContext';
import StorageScreen from './src/screens/StorageScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';
import { useNotificationDeepLink } from './src/hooks/useNotificationDeepLink';
import { useExpiryNotificationScheduler } from './src/hooks/useExpiryNotificationScheduler';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';
import { NOTIFICATIONS_ENABLED } from './src/config/features';

// 履歴タブは通知実行時にのみ記録されるため、通知機能が無効な間はタブ自体を出さない
const TABS = [
  { key: 'storage', label: '食品保管', icon: '🧊' },
  { key: 'recipes', label: 'レシピ', icon: '🍳' },
  ...(NOTIFICATIONS_ENABLED ? [{ key: 'history', label: '履歴', icon: '🕑' }] : []),
];

function AppNavigator() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('storage');
  const authService = useFirebaseAuthService();
  const { pendingTarget, consume } = useNotificationDeepLink();
  useExpiryNotificationScheduler();
  useRegisterPushToken();

  // 通知タップ時の遷移: 賞味期限→食品保管(タブ内でソート表示)、他メンバー通知→履歴タブ
  useEffect(() => {
    if (!pendingTarget) return;
    setShowSettings(false);
    if (pendingTarget.type === 'manualNotify') {
      setActiveTab('history');
      consume();
    } else if (pendingTarget.type === 'expirySorted') {
      setActiveTab('storage');
      // expirySorted は StorageScreen 側で consume する
    }
  }, [pendingTarget, consume]);

  if (showSettings) {
    return (
      <SettingsScreen
        authService={authService}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  const storageDeepLink = pendingTarget?.type === 'expirySorted' ? pendingTarget : null;

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'storage' && (
        <StorageScreen
          onOpenSettings={() => setShowSettings(true)}
          deepLinkTarget={storageDeepLink}
          onDeepLinkConsumed={consume}
        />
      )}
      {activeTab === 'recipes' && <RecipeScreen />}
      {NOTIFICATIONS_ENABLED && activeTab === 'history' && <HistoryScreen />}
      <BottomTabBar tabs={TABS} activeKey={activeTab} onSelect={setActiveTab} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <SharingProvider>
            <AppNavigator />
          </SharingProvider>
        </AuthProvider>
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
