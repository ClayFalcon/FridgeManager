import React, { useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import StorageScreen from './src/screens/StorageScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function AppNavigator() {
  const [screen, setScreen] = useState('storage');

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('storage')} />;
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
