import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import { AuthProvider } from './src/context/AuthContext';
import { SharingProvider } from './src/context/SharingContext';
import StorageScreen from './src/screens/StorageScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';
import { useNotificationDeepLink } from './src/hooks/useNotificationDeepLink';
import { useExpiryNotificationScheduler } from './src/hooks/useExpiryNotificationScheduler';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';

const TABS = [
  { key: 'storage', label: '食品保管', icon: '🧊' },
  { key: 'recipes', label: 'レシピ', icon: '🍳' },
];

function AppNavigator() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('storage');
  const authService = useFirebaseAuthService();
  const { pendingTarget, consume } = useNotificationDeepLink();
  useExpiryNotificationScheduler();
  useRegisterPushToken();

  useEffect(() => {
    if (pendingTarget) {
      setShowSettings(false);
      setActiveTab('storage');
    }
  }, [pendingTarget]);

  if (showSettings) {
    return (
      <SettingsScreen
        authService={authService}
        onBack={() => setShowSettings(false)}
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'storage' ? (
        <StorageScreen
          onOpenSettings={() => setShowSettings(true)}
          deepLinkTarget={pendingTarget}
          onDeepLinkConsumed={consume}
        />
      ) : (
        <RecipeScreen />
      )}
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
