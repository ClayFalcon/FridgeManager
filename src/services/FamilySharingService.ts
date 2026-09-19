import { auth } from '../config/firebase';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';
import { LocalRecipeRepository } from '../db/LocalRecipeRepository';
import { CloudRecipeRepository } from '../db/CloudRecipeRepository';
import { LocalShoppingRepository } from '../db/LocalShoppingRepository';
import { CloudShoppingRepository } from '../db/CloudShoppingRepository';
import { migrateToCloud } from './MigrationService';

// 端末内の食品・レシピ・買い物リストをクラウドへ移す（3種類は互いに独立なので並行して行う）
export async function migrateAllToCloud(uid: string): Promise<void> {
  await Promise.all([
    migrateToCloud(new LocalRepository(), new CloudRepository(uid)),
    migrateToCloud(new LocalRecipeRepository(), new CloudRecipeRepository(uid)),
    migrateToCloud(new LocalShoppingRepository(), new CloudShoppingRepository(uid)),
  ]);
}

interface LinkDeps {
  signInAnon: () => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  getCurrentUid?: () => string | null;
  migrateAll?: (uid: string) => Promise<void>;
}

// 「家族と共有する」の本体。匿名ログイン → Google アカウントとリンク → 端末データをクラウドへ移行。
// 移行先の uid は画面が持つ user（押した時点の値で、初回は null）ではなく、
// リンク完了後の auth.currentUser から取る。
export async function linkGoogleAndMigrate({
  signInAnon,
  linkWithGoogle,
  getCurrentUid = () => auth.currentUser?.uid ?? null,
  migrateAll = migrateAllToCloud,
}: LinkDeps): Promise<void> {
  await signInAnon();
  await linkWithGoogle();
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('ログイン中のユーザーが見つかりません');
  }
  await migrateAll(uid);
}
