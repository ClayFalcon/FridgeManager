import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import StorageScreen from './src/screens/StorageScreen';

export default function App() {
  return (
    <AuthProvider>
      <StorageScreen />
    </AuthProvider>
  );
}
