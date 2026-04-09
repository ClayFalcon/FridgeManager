import { FoodRepository } from '../db/FoodRepository';

export async function migrateToCloud(
  local: FoodRepository,
  cloud: FoodRepository,
): Promise<void> {
  const items = await local.getAll();
  await Promise.all(items.map((item) => cloud.add(item)));
}
