import { auth } from '../config/firebase';
import { LocalRepository } from '../db/LocalRepository';
import { CloudRepository } from '../db/CloudRepository';
import { LocalRecipeRepository } from '../db/LocalRecipeRepository';
import { CloudRecipeRepository } from '../db/CloudRecipeRepository';
import { LocalShoppingRepository } from '../db/LocalShoppingRepository';
import { CloudShoppingRepository } from '../db/CloudShoppingRepository';
import { migrateToCloud } from './MigrationService';
import { GoogleLinkResult } from './AuthService';

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
  linkWithGoogle: () => Promise<GoogleLinkResult>;
  getCurrentUid?: () => string | null;
  migrateAll?: (uid: string) => Promise<void>;
}

// 「家族と共有する」の本体。匿名ログイン → Google アカウントとリンク → 端末データをクラウドへ移行。
// 移行先の uid は画面が持つ user（押した時点の値で、初回は null）ではなく、
// リンク完了後の auth.currentUser から取る。
// その Google アカウントが既存ユーザーにつながっていた場合（入れ直し・機種変更）は、そのユーザーで
// ログインし直すだけで端末データは移行しない。端末側の ID（1, 2, ...）はクラウドの既存ドキュメントと
// 重なるため、移行すると家族が使っているデータを上書きしてしまう。
export async function linkGoogleAndMigrate({
  signInAnon,
  linkWithGoogle,
  getCurrentUid = () => auth.currentUser?.uid ?? null,
  migrateAll = migrateAllToCloud,
}: LinkDeps): Promise<GoogleLinkResult> {
  await signInAnon();
  const result = await linkWithGoogle();
  if (result === 'signedIn') return result;
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('ログイン中のユーザーが見つかりません');
  }
  await migrateAll(uid);
  return result;
}
