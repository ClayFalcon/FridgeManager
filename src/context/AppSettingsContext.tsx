import React, { createContext, useContext, useState, useCallback } from 'react';
import { StatusMode } from '../types/food';
import { getAppSettings, saveAppSettings } from '../db/AppSettingsStore';

interface AppSettingsContextValue {
  statusMode: StatusMode;
  setStatusMode: (mode: StatusMode) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  statusMode: '3step',
  setStatusMode: () => {},
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  // マウント時にローカルSQLiteから初期値を読み込む（同期API）
  const [statusMode, setStatusModeState] = useState<StatusMode>(() => getAppSettings().statusMode);

  const setStatusMode = useCallback((mode: StatusMode) => {
    setStatusModeState(mode);
    saveAppSettings({ statusMode: mode });
  }, []);

  return (
    <AppSettingsContext.Provider value={{ statusMode, setStatusMode }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  return useContext(AppSettingsContext);
}
