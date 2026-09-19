import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { clearMyGroup, getOwnerUid, watchMembership } from '../services/SharingService';

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

  // 他人のグループに参加している間は、オーナーに外されたらすぐ自分の冷蔵庫に戻す
  const myUid = user?.uid;
  useEffect(() => {
    if (!myUid || !ownerUid || ownerUid === myUid) return;
    return watchMembership(ownerUid, myUid, () => {
      setOwnerUid(myUid);
      clearMyGroup(myUid).catch(() => {});
    });
  }, [ownerUid, myUid]);

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
