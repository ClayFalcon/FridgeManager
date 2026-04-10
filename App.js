import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import StorageScreen from './src/screens/StorageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useFirebaseAuthService } from './src/services/FirebaseAuthService';

function AppNavigator() {
  const [showSettings, setShowSettings] = useState(false);
  const authService = useFirebaseAuthService();

  return (
    <View style={styles.root}>
      <StorageScreen onOpenSettings={() => setShowSettings(true)} />
      {showSettings && (
        <View style={StyleSheet.absoluteFill}>
          <SettingsScreen
            authService={authService}
            onBack={() => setShowSettings(false)}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
