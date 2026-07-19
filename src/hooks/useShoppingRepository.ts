import { useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { ShoppingRepository } from '../db/ShoppingRepository';
import { LocalShoppingRepository } from '../db/LocalShoppingRepository';
import { CloudShoppingRepository } from '../db/CloudShoppingRepository';

export function useShoppingRepository(): ShoppingRepository {
  const { user } = useAuth();
  const { ownerUid } = useSharing();
  const localRepo = useRef(new LocalShoppingRepository()).current;

  // ownerUid が null の間（ロード中 or 未認証）はローカルリポジトリを使用
  const cloudRepo = useMemo(
    () => (user && !user.isAnonymous && ownerUid ? new CloudShoppingRepository(ownerUid) : null),
    [user?.uid, user?.isAnonymous, ownerUid],
  );

  return cloudRepo ?? localRepo;
}
