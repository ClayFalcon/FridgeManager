import { useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSharing } from '../context/SharingContext';
import { RecipeRepository } from '../db/RecipeRepository';
import { LocalRecipeRepository } from '../db/LocalRecipeRepository';
import { CloudRecipeRepository } from '../db/CloudRecipeRepository';

export function useRecipeRepository(): RecipeRepository {
  const { user } = useAuth();
  const { ownerUid } = useSharing();
  const localRepo = useRef(new LocalRecipeRepository()).current;

  // ownerUid が null の間（ロード中 or 未認証）はローカルリポジトリを使用
  const cloudRepo = useMemo(
    () => (user && !user.isAnonymous && ownerUid ? new CloudRecipeRepository(ownerUid) : null),
    [user?.uid, user?.isAnonymous, ownerUid],
  );

  return cloudRepo ?? localRepo;
}
