import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFoodEmoji } from '@/constants/foodEmojis';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Student, Meal } from '@/types';
import { ArrowLeft, Heart, Clock, Flame, Check, Sparkles } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

export default function MealDetailScreen() {
  const { currentUser, dietPlans, updateDietPlan } = useApp();
  const router = useRouter();
  const { mealId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'directions'>('ingredients');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completedFoods, setCompletedFoods] = useState<Set<number>>(new Set());
  const [showCompletionAnimation, setShowCompletionAnimation] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');
  const animationScale = useRef(new Animated.Value(0)).current;

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay usuario activo</Text>
      </View>
    );
  }

  const student = currentUser as Student;
  const studentDiet = dietPlans.find(plan => plan.studentId === student.id);
  const meal = studentDiet?.meals.find(m => m.id === mealId);

  if (!meal) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={colors.white} size={24} />
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>Comida no encontrada</Text>
        </SafeAreaView>
      </View>
    );
  }

  const totalCalories = meal.foods.reduce((acc, food) => acc + food.calories, 0);
  const totalProtein = meal.foods.reduce((acc, food) => acc + food.protein, 0);
  const totalFat = meal.foods.reduce((acc, food) => acc + food.fat, 0);
  const totalCarbs = meal.foods.reduce((acc, food) => acc + food.carbs, 0);

  const showAnimation = (message: string, isBig: boolean = false) => {
    setCompletionMessage(message);
    setShowCompletionAnimation(true);
    
    animationScale.setValue(0);
    
    Animated.sequence([
      Animated.spring(animationScale, {
        toValue: isBig ? 1.2 : 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animationScale, {
        toValue: 0,
        duration: 500,
        delay: isBig ? 1500 : 600,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowCompletionAnimation(false);
    });
  };

  const toggleStep = (step: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(step)) {
      newCompleted.delete(step);
    } else {
      newCompleted.add(step);
    }
    setCompletedSteps(newCompleted);
    showAnimation('✓ Paso completado', false);
  };

  const toggleFood = async (foodIndex: number) => {
    const newCompleted = new Set(completedFoods);
    if (newCompleted.has(foodIndex)) {
      newCompleted.delete(foodIndex);
    } else {
      newCompleted.add(foodIndex);
    }
    setCompletedFoods(newCompleted);

    const totalFoods = meal.ingredients?.length || meal.foods.length;
    const allFoodsCompleted = newCompleted.size === totalFoods;

    if (allFoodsCompleted && newCompleted.size > completedFoods.size) {
      showAnimation('🎉 ¡Comida completada!', true);
    } else {
      showAnimation('✓ Alimento completado', false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{meal.name}</Text>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.favoriteButton}>
            <Heart
              size={24}
              color={isFavorite ? colors.accent : colors.white}
              fill={isFavorite ? colors.accent : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' }}
            style={styles.heroImage}
          />

          <View style={styles.detailsContainer}>
            <Text style={styles.mealName}>{meal.name}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Flame size={18} color={colors.accent} />
                <Text style={styles.metaText}>{totalCalories} cal</Text>
              </View>
              {meal.prepTime && (
                <View style={styles.metaItem}>
                  <Clock size={18} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{meal.prepTime} mins</Text>
                </View>
              )}
            </View>

            <View style={styles.macrosContainer}>
              <View style={styles.macroCard}>
                <Text style={styles.macroLabel}>Proteína</Text>
                <Text style={styles.macroValue}>{totalProtein.toFixed(1)}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
              <View style={styles.macroCard}>
                <Text style={styles.macroLabel}>Grasas</Text>
                <Text style={styles.macroValue}>{totalFat.toFixed(1)}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
              <View style={styles.macroCard}>
                <Text style={styles.macroLabel}>Carbos</Text>
                <Text style={styles.macroValue}>{totalCarbs.toFixed(1)}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>



            <View style={styles.ingredientsContainer}>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ingredient, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.ingredientRow,
                        completedFoods.has(index) && styles.ingredientRowCompleted,
                      ]}
                      onPress={() => toggleFood(index)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        completedFoods.has(index) && styles.checkboxCompleted,
                      ]}>
                        {completedFoods.has(index) && <Check size={16} color={colors.background} />}
                      </View>
                      <View style={styles.ingredientIcon}>
                        <Text style={styles.ingredientIconText}>{ingredient.icon || getFoodEmoji(ingredient.name)}</Text>
                      </View>
                      <Text style={[
                        styles.ingredientName,
                        completedFoods.has(index) && styles.ingredientNameCompleted,
                      ]}>
                        {ingredient.name}
                      </Text>
                      <Text style={[
                        styles.ingredientQuantity,
                        completedFoods.has(index) && styles.ingredientQuantityCompleted,
                      ]}>
                        {ingredient.quantity} {ingredient.unit}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  meal.foods.map((food, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.ingredientRow,
                        completedFoods.has(index) && styles.ingredientRowCompleted,
                      ]}
                      onPress={() => toggleFood(index)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        completedFoods.has(index) && styles.checkboxCompleted,
                      ]}>
                        {completedFoods.has(index) && <Check size={16} color={colors.background} />}
                      </View>
                      <View style={styles.ingredientIcon}>
                        <Text style={styles.ingredientIconText}>{getFoodEmoji(food.name)}</Text>
                      </View>
                      <Text style={[
                        styles.ingredientName,
                        completedFoods.has(index) && styles.ingredientNameCompleted,
                      ]}>
                        {food.name}
                      </Text>
                      <Text style={[
                        styles.ingredientQuantity,
                        completedFoods.has(index) && styles.ingredientQuantityCompleted,
                      ]}>
                        {food.quantity || 100} {food.unit || 'g'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
            </View>
          </View>
        </ScrollView>

        {showCompletionAnimation && (
          <View style={styles.animationOverlay}>
            <Animated.View style={[
              styles.animationContent,
              { transform: [{ scale: animationScale }] }
            ]}>
              <Sparkles size={48} color={colors.neon} />
              <Text style={styles.animationText}>{completionMessage}</Text>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: 16,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover' as const,
  },
  detailsContainer: {
    padding: 20,
  },
  mealName: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 2,
  },
  macroUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.primary,
  },
  ingredientsContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ingredientRowCompleted: {
    backgroundColor: colors.neon + '20',
    borderColor: colors.neon,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  ingredientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientIconText: {
    fontSize: 20,
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
  ingredientNameCompleted: {
    color: colors.neon,
  },
  ingredientQuantity: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  ingredientQuantityCompleted: {
    color: colors.neon,
  },
  directionsContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionNumberText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: colors.white,
  },
  directionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
    fontWeight: '500' as const,
  },
  directionTextCompleted: {
    textDecorationLine: 'line-through' as const,
    color: colors.textSecondary,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  animationOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animationContent: {
    backgroundColor: colors.card,
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  animationText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.neon,
    textAlign: 'center' as const,
  },
});
