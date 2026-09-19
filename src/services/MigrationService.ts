interface Migratable<T> {
  getAll(): Promise<T[]>;
  add(item: T): Promise<void>;
  // 一括書き込みに対応するリポジトリ（Cloud*Repository）はこちらを使う
  addAll?(items: T[]): Promise<void>;
}

export async function migrateToCloud<T>(
  local: Migratable<T>,
  cloud: Migratable<T>,
): Promise<void> {
  const items = await local.getAll();
  if (items.length === 0) return;
  if (cloud.addAll) {
    await cloud.addAll(items);
    return;
  }
  await Promise.all(items.map((item) => cloud.add(item)));
}
