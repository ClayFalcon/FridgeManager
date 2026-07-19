import React, { useEffect, useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { SharingProvider } from './src/context/SharingContext';
import StorageScreen from './src/screens/StorageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';
import { useNotificationDeepLink } from './src/hooks/useNotificationDeepLink';
import { useExpiryNotificationScheduler } from './src/hooks/useExpiryNotificationScheduler';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';

function AppNavigator() {
  const [showSettings, setShowSettings] = useState(false);
  const authService = useFirebaseAuthService();
  const { pendingTarget, consume } = useNotificationDeepLink();
  useExpiryNotificationScheduler();
  useRegisterPushToken();

  useEffect(() => {
    if (pendingTarget) setShowSettings(false);
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
    <StorageScreen
      onOpenSettings={() => setShowSettings(true)}
      deepLinkTarget={pendingTarget}
      onDeepLinkConsumed={consume}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SharingProvider>
        <AppNavigator />
      </SharingProvider>
    </AuthProvider>
  );
}
