import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FoodItem, StorageLocation, StockLevel } from '../types/food';
import rawInitialData from '../data/initialFoodItems.json';
import LocationTabs from '../components/storage/LocationTabs';
import FoodItemCard from '../components/storage/FoodItemCard';
import AddFoodModal from '../components/storage/AddFoodModal';
import EditFoodModal from '../components/storage/EditFoodModal';

const initialItems = rawInitialData as FoodItem[];

let nextId = 100;

export default function StorageScreen() {
  const [items, setItems] = useState<FoodItem[]>(initialItems);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation>('fridge');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isSimpleGlobal, setIsSimpleGlobal] = useState(false);
  const [simpleOverrides, setSimpleOverrides] = useState<Record<string, boolean>>({});
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const visibleItems = items.filter((item) => item.location === selectedLocation);

  const isSimpleForItem = useCallback(
    (id: string) => {
      if (id in simpleOverrides) return simpleOverrides[id];
      return isSimpleGlobal;
    },
    [isSimpleGlobal, simpleOverrides],
  );

  function handleStockChange(id: string, level: StockLevel) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stockLevel: level } : item)),
    );
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleEdit(updated: FoodItem) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
  }

  function handleToggleView(id: string) {
    setSimpleOverrides((prev) => {
      const current = id in prev ? prev[id] : isSimpleGlobal;
      return { ...prev, [id]: !current };
    });
  }

  function handleBulkToggle() {
    setIsSimpleGlobal((prev) => !prev);
    setSimpleOverrides({});
  }

  function handleAdd(itemData: Omit<FoodItem, 'id'>) {
    const newItem: FoodItem = { ...itemData, id: String(nextId++) };
    setItems((prev) => [...prev, newItem]);
  }

  function handleTabChange(location: StorageLocation) {
    setSelectedLocation(location);
    setIsDeleteMode(false);
  }

  return (
    <SafeAreaView style={styles.root} testID="storage-screen">
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} testID="storage-title">食品保管</Text>
        <Text style={styles.headerSub}>保管場所をタブで切り替え</Text>
      </View>

      {/* 保管場所タブ */}
      <LocationTabs selected={selectedLocation} onSelect={handleTabChange} />

      {/* ツールバー */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          testID="btn-add-food"
          style={styles.btnAdd}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.btnAddText}>＋ 食品追加</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="btn-delete-mode"
          style={[styles.btnDelete, isDeleteMode && styles.btnDeleteActive]}
          onPress={() => setIsDeleteMode((prev) => !prev)}
          accessibilityState={{ selected: isDeleteMode }}
        >
          <Text style={[styles.btnDeleteText, isDeleteMode && styles.btnDeleteTextActive]}>
            削除
          </Text>
        </TouchableOpacity>
      </View>

      {/* 一括表示切替 */}
      <View style={styles.toolbarSecondary}>
        <TouchableOpacity
          testID="btn-bulk-view"
          style={styles.btnBulk}
          onPress={handleBulkToggle}
        >
          <Text style={styles.btnBulkText}>
            一括: {isSimpleGlobal ? '詳細表示' : '簡易表示'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 食品リスト */}
      <FlatList
        testID="food-list"
        data={visibleItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>この保管場所に食品はありません</Text>
        }
        renderItem={({ item }) => (
          <FoodItemCard
            item={item}
            isSimple={isSimpleForItem(item.id)}
            showDeleteButton={isDeleteMode}
            onStockChange={handleStockChange}
            onDelete={handleDelete}
            onEdit={setEditingItem}
            onToggleView={() => handleToggleView(item.id)}
          />
        )}
      />

      {/* 食品追加モーダル */}
      <AddFoodModal
        visible={isAddModalVisible}
        location={selectedLocation}
        onAdd={handleAdd}
        onClose={() => setIsAddModalVisible(false)}
      />

      {/* 食品編集モーダル */}
      <EditFoodModal
        visible={editingItem !== null}
        item={editingItem}
        onSave={handleEdit}
        onClose={() => setEditingItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.12)',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2e2a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#5c7a72',
    marginTop: 2,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    backgroundColor: '#ffffff',
  },
  btnAdd: {
    flex: 1,
    backgroundColor: '#0d8f7a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDelete: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fde8e8',
    alignItems: 'center',
  },
  btnDeleteActive: {
    backgroundColor: '#fde8e8',
    borderColor: '#c73e3e',
  },
  btnDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c73e3e',
  },
  btnDeleteTextActive: {
    fontWeight: '700',
  },
  toolbarSecondary: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  btnBulk: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(13, 143, 122, 0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f6fbf9',
  },
  btnBulkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a2e2a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 48,
    color: '#5c7a72',
    fontSize: 14,
  },
});
