import React, { useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import StorageScreen from './src/screens/StorageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';

function AppNavigator() {
  const [showSettings, setShowSettings] = useState(false);
  const authService = useFirebaseAuthService();

  if (showSettings) {
    return (
      <SettingsScreen
        authService={authService}
        onBack={() => setShowSettings(false)}
      />
    );
  }
  return <StorageScreen onOpenSettings={() => setShowSettings(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
