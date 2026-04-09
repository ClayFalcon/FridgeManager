import { migrateToCloud } from '../services/MigrationService';
import { FoodItem } from '../types/food';
import { FoodRepository } from '../db/FoodRepository';

function makeRepo(items: FoodItem[] = []): jest.Mocked<FoodRepository> {
  return {
    getAll: jest.fn().mockResolvedValue(items),
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    updateStock: jest.fn().mockResolvedValue(undefined),
  };
}

const sampleItems: FoodItem[] = [
  { id: '1', name: '牛乳', stockLevel: 2, tags: [], location: 'fridge' },
  { id: '2', name: '卵', stockLevel: 2, tags: [], location: 'fridge' },
];

describe('migrateToCloud', () => {
  it('LocalRepositoryの全アイテムをCloudRepositoryにaddする', async () => {
    const local = makeRepo(sampleItems);
    const cloud = makeRepo();

    await migrateToCloud(local, cloud);

    expect(local.getAll).toHaveBeenCalledTimes(1);
    expect(cloud.add).toHaveBeenCalledTimes(2);
    expect(cloud.add).toHaveBeenCalledWith(sampleItems[0]);
    expect(cloud.add).toHaveBeenCalledWith(sampleItems[1]);
  });

  it('アイテムが0件でもエラーにならない', async () => {
    const local = makeRepo([]);
    const cloud = makeRepo();

    await migrateToCloud(local, cloud);

    expect(cloud.add).not.toHaveBeenCalled();
  });

  it('cloud.addが失敗したときエラーを伝播する', async () => {
    const local = makeRepo(sampleItems);
    const cloud = makeRepo();
    cloud.add.mockRejectedValue(new Error('Firestore write failed'));

    await expect(migrateToCloud(local, cloud)).rejects.toThrow('Firestore write failed');
  });
});
