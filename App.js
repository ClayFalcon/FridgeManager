import React, { useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import StorageScreen from './src/screens/StorageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';

// Google.useAuthRequest を常にマウントするため AppNavigator に引き上げる
function AppNavigator() {
  const [screen, setScreen] = useState('storage');
  const authService = useFirebaseAuthService();

  if (screen === 'settings') {
    return <SettingsScreen authService={authService} onBack={() => setScreen('storage')} />;
  }
  return <StorageScreen onOpenSettings={() => setScreen('settings')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
