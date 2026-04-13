import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getOwnerUid } from '../services/SharingService';

interface SharingContextValue {
  ownerUid: string | null;
  isOwner: boolean;
  refresh: () => Promise<void>;
}

const SharingContext = createContext<SharingContextValue>({
  ownerUid: null,
  isOwner: true,
  refresh: async () => {},
});

export function SharingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ownerUid, setOwnerUid] = useState<string | null>(null);

  const fetchOwnerUid = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setOwnerUid(null);
      return;
    }
    try {
      const uid = await getOwnerUid(user.uid);
      setOwnerUid(uid);
    } catch {
      setOwnerUid(user.uid);
    }
  }, [user?.uid, user?.isAnonymous]);

  useEffect(() => {
    fetchOwnerUid();
  }, [fetchOwnerUid]);

  const isOwner = ownerUid === null || ownerUid === user?.uid;

  return (
    <SharingContext.Provider value={{ ownerUid, isOwner, refresh: fetchOwnerUid }}>
      {children}
    </SharingContext.Provider>
  );
}

export function useSharing(): SharingContextValue {
  return useContext(SharingContext);
}
