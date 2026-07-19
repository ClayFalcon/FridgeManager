import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Recipe } from '../../types/recipe';
import { RecipeMatchResult } from '../../utils/recipeMatching';

interface Props {
  visible: boolean;
  recipe: Recipe | null;
  match: RecipeMatchResult | null;
  onAddMissingToShopping: (recipe: Recipe) => void;
  onClose: () => void;
}

export default function RecipeDetailModal({
  visible,
  recipe,
  match,
  onAddMissingToShopping,
  onClose,
}: Props) {
  if (!recipe || !match) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="recipe-detail-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.sheetWrap}>
          <ScrollView
            testID="recipe-detail-sheet"
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
          >
            <Text style={styles.title}>{recipe.name}</Text>

            <Text style={styles.fieldLabel}>材料と在庫状況</Text>
            {match.statuses.map((status, index) => (
              <View style={styles.ingredientRow} key={index} testID={`ingredient-status-${index}`}>
                <Text style={[styles.statusIcon, status.inStock ? styles.inStock : styles.missing]}>
                  {status.inStock ? '✓' : '✕'}
                </Text>
                <Text style={styles.ingredientName}>{status.name}</Text>
                {status.quantity ? (
                  <Text style={styles.ingredientQty}>{status.quantity}</Text>
                ) : null}
                <Text style={[styles.statusLabel, status.inStock ? styles.inStock : styles.missing]}>
                  {status.inStock ? '在庫あり' : '在庫なし'}
                </Text>
              </View>
            ))}

            {recipe.memo ? (
              <>
                <Text style={styles.fieldLabel}>メモ</Text>
                <Text style={styles.memo} testID="recipe-detail-memo">{recipe.memo}</Text>
              </>
            ) : null}

            <TouchableOpacity
              testID="btn-add-missing-to-shopping"
              style={[styles.btnAddMissing, match.missingCount === 0 && styles.btnDisabled]}
              onPress={() => onAddMissingToShopping(recipe)}
              disabled={match.missingCount === 0}
            >
              <Text style={styles.btnAddMissingText}>
                {match.missingCount === 0
                  ? '不足している材料はありません'
                  : `不足${match.missingCount}品を買い物リストに追加`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="recipe-detail-close" style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>閉じる</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '85%',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2e2a',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c7a72',
    marginBottom: 8,
    marginTop: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.1)',
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  ingredientName: {
    fontSize: 15,
    color: '#1a2e2a',
    fontWeight: '600',
    flex: 1,
  },
  ingredientQty: {
    fontSize: 13,
    color: '#5c7a72',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStock: {
    color: '#0d8f7a',
  },
  missing: {
    color: '#c73e3e',
  },
  memo: {
    fontSize: 14,
    color: '#1a2e2a',
    lineHeight: 20,
    backgroundColor: '#f6fbf9',
    borderRadius: 10,
    padding: 12,
  },
  btnAddMissing: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0d8f7a',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#b0d6cf',
  },
  btnAddMissingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnClose: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    alignItems: 'center',
  },
  btnCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5c7a72',
  },
});
