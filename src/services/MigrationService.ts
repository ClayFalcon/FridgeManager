interface Migratable<T> {
  getAll(): Promise<T[]>;
  add(item: T): Promise<void>;
}

export async function migrateToCloud<T>(
  local: Migratable<T>,
  cloud: Migratable<T>,
): Promise<void> {
  const items = await local.getAll();
  await Promise.all(items.map((item) => cloud.add(item)));
}
