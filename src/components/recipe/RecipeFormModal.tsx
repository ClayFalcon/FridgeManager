import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Recipe, RecipeIngredient } from '../../types/recipe';
import { FoodItem } from '../../types/food';
import { normalizeIngredientName } from '../../utils/recipeMatching';

interface IngredientRow {
  name: string;
  quantity: string;
}

interface Props {
  visible: boolean;
  /** null = 新規追加、Recipe = 編集 */
  recipe: Recipe | null;
  /** 材料名サジェスト用の在庫食材一覧 */
  foodItems: FoodItem[];
  onSave: (data: Omit<Recipe, 'id'>, id: string | null) => void;
  onClose: () => void;
}

const EMPTY_ROW: IngredientRow = { name: '', quantity: '' };
const MAX_SUGGESTIONS = 6;

export default function RecipeFormModal({ visible, recipe, foodItems, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<IngredientRow[]>([EMPTY_ROW]);
  const [memo, setMemo] = useState('');
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setName(recipe?.name ?? '');
      setRows(
        recipe && recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity ?? '' }))
          : [EMPTY_ROW],
      );
      setMemo(recipe?.memo ?? '');
      setFocusedRow(null);
    }
  }, [visible, recipe]);

  function suggestionsFor(rowIndex: number): FoodItem[] {
    const input = normalizeIngredientName(rows[rowIndex]?.name ?? '');
    return foodItems
      .filter((item) => {
        const itemName = normalizeIngredientName(item.name);
        if (itemName === input) return false; // 入力済みと完全一致なら候補に出さない
        return input === '' || itemName.includes(input);
      })
      .slice(0, MAX_SUGGESTIONS);
  }

  const validIngredients: RecipeIngredient[] = rows
    .filter((row) => row.name.trim())
    .map((row) => ({
      name: row.name.trim(),
      quantity: row.quantity.trim() || undefined,
    }));

  const canSave = !!name.trim() && validIngredients.length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave(
      { name: name.trim(), ingredients: validIngredients, memo: memo.trim() || undefined },
      recipe?.id ?? null,
    );
    onClose();
  }

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? [EMPTY_ROW] : prev.filter((_, i) => i !== index)));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="recipe-form-modal"
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheetWrap}>
          <ScrollView
            testID="recipe-form-sheet"
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{recipe ? 'レシピを編集' : 'レシピを追加'}</Text>

            <Text style={styles.fieldLabel}>レシピ名</Text>
            <TextInput
              testID="recipe-form-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例: トマトパスタ"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>材料</Text>
            <Text style={styles.suggestHint}>在庫の食材名をタップして入力すると在庫と確実に照合できます</Text>
            {rows.map((row, index) => (
              <View key={index}>
                <View style={styles.ingredientRow}>
                  <TextInput
                    testID={`recipe-form-ingredient-name-${index}`}
                    style={[styles.input, styles.ingredientNameInput]}
                    value={row.name}
                    onChangeText={(t) => updateRow(index, { name: t })}
                    onFocus={() => setFocusedRow(index)}
                    placeholder="材料名"
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    testID={`recipe-form-ingredient-qty-${index}`}
                    style={[styles.input, styles.ingredientQtyInput]}
                    value={row.quantity}
                    onChangeText={(t) => updateRow(index, { quantity: t })}
                    onFocus={() => setFocusedRow(null)}
                    placeholder="分量"
                    placeholderTextColor="#aaa"
                  />
                  <TouchableOpacity
                    testID={`recipe-form-remove-ingredient-${index}`}
                    style={styles.removeRowBtn}
                    onPress={() => removeRow(index)}
                    accessibilityLabel={`材料${index + 1}を削除`}
                  >
                    <Text style={styles.removeRowText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {/* 在庫食材のサジェスト（フォーカス中の行のみ） */}
                {focusedRow === index && suggestionsFor(index).length > 0 && (
                  <View style={styles.suggestionRow}>
                    {suggestionsFor(index).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        testID={`recipe-form-suggestion-${index}-${item.id}`}
                        style={styles.suggestionChip}
                        onPress={() => {
                          updateRow(index, { name: item.name });
                          setFocusedRow(null);
                        }}
                      >
                        <Text style={styles.suggestionText}>
                          {item.icon ? `${item.icon} ` : ''}{item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <TouchableOpacity
              testID="recipe-form-add-ingredient"
              onPress={() => setRows((prev) => [...prev, EMPTY_ROW])}
            >
              <Text style={styles.addRowText}>＋ 材料を追加</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>メモ</Text>
            <TextInput
              testID="recipe-form-memo-input"
              style={[styles.input, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="作り方のポイントなど"
              placeholderTextColor="#aaa"
              multiline
            />

            <View style={styles.actions}>
              <TouchableOpacity
                testID="recipe-form-cancel"
                style={styles.btnCancel}
                onPress={onClose}
              >
                <Text style={styles.btnCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="recipe-form-submit"
                style={[styles.btnSubmit, !canSave && styles.btnSubmitDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={styles.btnSubmitText}>{recipe ? '保存' : '追加'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a2e2a',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ingredientNameInput: {
    flex: 2,
  },
  ingredientQtyInput: {
    flex: 1,
  },
  removeRowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fde8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeRowText: {
    fontSize: 14,
    color: '#c73e3e',
    fontWeight: '700',
  },
  addRowText: {
    fontSize: 13,
    color: '#0d8f7a',
    fontWeight: '600',
    paddingVertical: 6,
  },
  suggestHint: {
    fontSize: 11,
    color: '#9ab3ac',
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#eef6f3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.25)',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d8f7a',
  },
  memoInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 143, 122, 0.3)',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5c7a72',
  },
  btnSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0d8f7a',
    alignItems: 'center',
  },
  btnSubmitDisabled: {
    backgroundColor: '#b0d6cf',
  },
  btnSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
