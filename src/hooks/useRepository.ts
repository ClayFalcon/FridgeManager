import { useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { FoodRepository } from '../db/FoodRepository';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';

export function useRepository(): FoodRepository {
  const { user } = useAuth();
  const { ownerUid } = useSharing();
  const localRepo = useRef(new LocalRepository()).current;

  // ownerUid が null の間（ロード中 or 未認証）はローカルリポジトリを使用
  const cloudRepo = useMemo(
    () => (user && !user.isAnonymous && ownerUid ? new CloudRepository(ownerUid) : null),
    [user?.uid, user?.isAnonymous, ownerUid],
  );

  return cloudRepo ?? localRepo;
}
