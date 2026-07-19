import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Recipe } from '../types/recipe';
import { FoodItem } from '../types/food';
import { useRecipeRepository } from '../hooks/useRecipeRepository';
import { useRepository } from '../hooks/useRepository';
import { matchRecipeAgainstStock } from '../utils/recipeMatching';
import RecipeCard from '../components/recipe/RecipeCard';

export default function RecipeScreen() {
  const recipeRepo = useRecipeRepository();
  const foodRepo = useRepository();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (recipeRepo.subscribe) {
      const unsubscribe = recipeRepo.subscribe((loaded) => {
        setRecipes(loaded);
        setIsLoading(false);
      });
      return unsubscribe;
    }
    recipeRepo.getAll().then((loaded) => {
      setRecipes(loaded);
      setIsLoading(false);
    });
  }, [recipeRepo]);

  useEffect(() => {
    if (foodRepo.subscribe) {
      return foodRepo.subscribe(setFoodItems);
    }
    foodRepo.getAll().then(setFoodItems);
  }, [foodRepo]);

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard recipe={item} match={matchRecipeAgainstStock(item, foodItems)} />
    ),
    [foodItems],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} testID="recipe-screen">
        <ActivityIndicator style={styles.loader} size="large" color="#0d8f7a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} testID="recipe-screen">
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} testID="recipe-title">レシピ</Text>
          <Text style={styles.headerSub}>在庫と照合して作れるレシピを表示</Text>
        </View>
      </View>

      {/* レシピリスト */}
      <FlatList
        testID="recipe-list"
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>レシピがありません</Text>}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9f5',
  },
  loader: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 143, 122, 0.12)',
    backgroundColor: '#ffffff',
  },
  headerText: {
    flex: 1,
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
