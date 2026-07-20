import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { ShoppingItem } from '../../types/shopping';

interface Props {
  items: ShoppingItem[];
  onAdd: (name: string) => void;
  onToggleChecked: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
  onBought: (item: ShoppingItem) => void;
}

export default function ShoppingListView({
  items,
  onAdd,
  onToggleChecked,
  onDelete,
  onClearChecked,
  onClearAll,
  onBought,
}: Props) {
  const [input, setInput] = useState('');
  const hasChecked = items.some((item) => item.checked);
  const hasItems = items.length > 0;

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  }

  function handleClearAllPress() {
    Alert.alert('すべて削除', '買い物リストを空にしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除する', style: 'destructive', onPress: onClearAll },
    ]);
  }

  return (
    <View style={styles.root}>
      {/* 追加行 */}
      <View style={styles.addRow}>
        <TextInput
          testID="shopping-add-input"
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="品目を追加"
          placeholderTextColor="#aaa"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          testID="btn-shopping-add"
          style={[styles.btnAdd, !input.trim() && styles.btnAddDisabled]}
          onPress={handleAdd}
          disabled={!input.trim()}
        >
          <Text style={styles.btnAddText}>追加</Text>
        </TouchableOpacity>
      </View>

      {/* 一括操作 */}
      <View style={styles.bulkRow}>
        <TouchableOpacity
          testID="btn-clear-checked"
          style={[styles.btnClear, styles.bulkItem, !hasChecked && styles.btnClearDisabled]}
          onPress={onClearChecked}
          disabled={!hasChecked}
        >
          <Text style={[styles.btnClearText, !hasChecked && styles.btnClearTextDisabled]}>
            チェック済みを削除
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="btn-clear-all"
          style={[styles.btnClear, styles.bulkItem, !hasItems && styles.btnClearDisabled]}
          onPress={handleClearAllPress}
          disabled={!hasItems}
        >
          <Text style={[styles.btnClearText, !hasItems && styles.btnClearTextDisabled]}>
            すべて削除
          </Text>
        </TouchableOpacity>
      </View>

      {/* 品目リスト */}
      <FlatList
        testID="shopping-list"
        keyboardShouldPersistTaps="handled"
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>買い物リストは空です</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemRow} testID={`shopping-item-${item.id}`}>
            <TouchableOpacity
              testID={`shopping-check-${item.id}`}
              style={styles.checkArea}
              onPress={() => onToggleChecked(item.id, !item.checked)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.checked }}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`shopping-bought-${item.id}`}
              style={styles.boughtBtn}
              onPress={() => onBought(item)}
              accessibilityLabel={`${item.name}を買ってきた`}
            >
              <Text style={styles.boughtBtnText}>買ってきた</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`shopping-delete-${item.id}`}
              style={styles.deleteBtn}
              onPress={() => onDelete(item.id)}
              accessibilityLabel={`${item.name}を削除`}
            >
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a2e2a',
    backgroundColor: '#f6fbf9',
  },
  btnAdd: {
    backgroundColor: '#0d8f7a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAddDisabled: {
    backgroundColor: '#b0d6cf',
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bulkRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bulkItem: {
    flex: 1,
  },
  btnClear: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(199, 62, 62, 0.45)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  btnClearDisabled: {
    borderColor: 'rgba(92, 122, 114, 0.25)',
  },
  btnClearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c73e3e',
  },
  btnClearTextDisabled: {
    color: '#9ab3ac',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.15)',
    paddingRight: 4,
  },
  checkArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(13, 143, 122, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0d8f7a',
    borderColor: '#0d8f7a',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    color: '#1a2e2a',
    fontWeight: '600',
    flex: 1,
  },
  itemNameChecked: {
    color: '#9ab3ac',
    textDecorationLine: 'line-through',
  },
  boughtBtn: {
    backgroundColor: '#0d8f7a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  boughtBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 48,
    color: '#5c7a72',
    fontSize: 14,
  },
});
