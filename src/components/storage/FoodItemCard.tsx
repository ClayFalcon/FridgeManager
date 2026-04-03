import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FoodItem, StockLevel } from '../../types/food';
import StockLevelSelector from './StockLevelSelector';

interface Props {
  item: FoodItem;
  isSimple: boolean;
  showDeleteButton: boolean;
  onStockChange: (id: string, level: StockLevel) => void;
  onDelete: (id: string) => void;
  onToggleView: () => void;
}

function formatExpiry(iso: string | undefined): string | null {
  if (!iso || !iso.trim()) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

export default function FoodItemCard({
  item,
  isSimple,
  showDeleteButton,
  onStockChange,
  onDelete,
  onToggleView,
}: Props) {
  const expiry = formatExpiry(item.expiryDate);

  return (
    <View style={styles.card} testID={`food-item-${item.id}`}>
      <View style={styles.main}>
        {/* ヘッダー行: アイコン + 名前 + 詳細/簡易切替 */}
        <View style={styles.head}>
          <View style={styles.nameRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{item.icon ?? '🍽️'}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
          </View>
          <TouchableOpacity
            testID={`view-toggle-${item.id}`}
            style={styles.toggleBtn}
            onPress={onToggleView}
            accessibilityLabel={isSimple ? `${item.name}を詳細表示` : `${item.name}を簡易表示`}
          >
            <Text style={styles.toggleLabel}>{isSimple ? '詳細' : '簡易'}</Text>
          </TouchableOpacity>
        </View>

        {/* 詳細表示のみ: 賞味期限・タグ */}
        {!isSimple && (
          <>
            <Text style={styles.expiry} testID={`expiry-${item.id}`}>
              賞味期限{' '}
              <Text style={styles.expiryValue}>
                {expiry ?? '未設定'}
              </Text>
            </Text>
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 在庫レベルセレクター */}
        <StockLevelSelector
          itemId={item.id}
          level={item.stockLevel}
          onChange={(level) => onStockChange(item.id, level)}
        />
      </View>

      {/* 削除ボタン */}
      {showDeleteButton && (
        <TouchableOpacity
          testID={`delete-btn-${item.id}`}
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
          accessibilityLabel={`${item.name}を削除`}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.15)',
    overflow: 'hidden',
    shadowColor: '#0d2f28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  main: {
    flex: 1,
    padding: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#c5ebe2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2e2a',
    flex: 1,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.35)',
    marginLeft: 8,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d8f7a',
  },
  expiry: {
    fontSize: 13,
    color: '#5c7a72',
    marginBottom: 8,
  },
  expiryValue: {
    color: '#1a2e2a',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#eef6f3',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5c7a72',
  },
  deleteBtn: {
    width: 52,
    backgroundColor: '#fde8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
});
