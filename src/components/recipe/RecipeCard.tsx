import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Recipe } from '../../types/recipe';
import { RecipeMatchResult } from '../../utils/recipeMatching';

interface Props {
  recipe: Recipe;
  match: RecipeMatchResult;
  showDeleteButton?: boolean;
  onPress?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
}

function RecipeCard({ recipe, match, showDeleteButton, onPress, onEdit, onDelete }: Props) {
  function handleDeletePress() {
    Alert.alert('削除確認', `「${recipe.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除する', style: 'destructive', onPress: () => onDelete?.(recipe.id) },
    ]);
  }

  return (
    <View style={styles.card} testID={`recipe-item-${recipe.id}`}>
      <TouchableOpacity
        style={styles.main}
        onPress={() => onPress?.(recipe)}
        accessibilityLabel={`${recipe.name}の詳細を表示`}
      >
        <View style={styles.head}>
          <Text style={styles.name}>{recipe.name}</Text>
          {onEdit && (
            <TouchableOpacity
              testID={`recipe-edit-btn-${recipe.id}`}
              style={styles.iconBtn}
              onPress={() => onEdit(recipe)}
              accessibilityLabel={`${recipe.name}を編集`}
            >
              <Text style={styles.iconBtnText}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.ingredientCount}>材料 {recipe.ingredients.length}品</Text>
          <View
            style={[styles.badge, match.canMake ? styles.badgeCanMake : styles.badgeMissing]}
            testID={`recipe-badge-${recipe.id}`}
          >
            <Text style={[styles.badgeText, match.canMake ? styles.badgeTextCanMake : styles.badgeTextMissing]}>
              {match.canMake ? '作れる' : `不足${match.missingCount}品`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {showDeleteButton && (
        <TouchableOpacity
          testID={`recipe-delete-btn-${recipe.id}`}
          style={styles.deleteBtn}
          onPress={handleDeletePress}
          accessibilityLabel={`${recipe.name}を削除`}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default React.memo(RecipeCard);

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
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2e2a',
    flex: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f9f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconBtnText: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientCount: {
    fontSize: 13,
    color: '#5c7a72',
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeCanMake: {
    backgroundColor: '#0d8f7a',
  },
  badgeMissing: {
    backgroundColor: '#fde8e8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextCanMake: {
    color: '#ffffff',
  },
  badgeTextMissing: {
    color: '#c73e3e',
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
