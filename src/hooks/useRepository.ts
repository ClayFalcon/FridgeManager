import { useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { FoodRepository } from '../db/FoodRepository';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';

export function useRepository(): FoodRepository {
  const { user } = useAuth();
  const localRepo = useRef(new LocalRepository()).current;

  const cloudRepo = useMemo(
    () => (user && !user.isAnonymous ? new CloudRepository(user.uid) : null),
    [user?.uid, user?.isAnonymous],
  );

  return cloudRepo ?? localRepo;
}
