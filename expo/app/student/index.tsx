import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { Dumbbell, Apple, LogOut, ChevronRight, X, Flame } from 'lucide-react-native';
import { Student } from '@/types';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, getTodayWorkout, getTodayDiet, updateWorkoutPlan, updateDietPlan, logout } = useApp();

  const student = currentUser as Student | null;
  const todayWorkout = student ? getTodayWorkout(student.id) : undefined;
  const todayDiet = student ? getTodayDiet(student.id) : undefined;

  const [workoutPlan, setWorkoutPlan] = useState(todayWorkout);
  const [dietPlan, setDietPlan] = useState(todayDiet);
  const [workoutExpanded, setWorkoutExpanded] = useState<boolean>(false);
  const [dietExpanded, setDietExpanded] = useState<boolean>(false);
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; setIndex: number } | null>(null);
  const [actualReps, setActualReps] = useState<string>('');
  const [actualWeight, setActualWeight] = useState<string>('');
  const [editingFood, setEditingFood] = useState<{ mealId: string; foodIndex: number } | null>(null);
  const [actualQuantity, setActualQuantity] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openEditSet = (exerciseId: string, setIndex: number) => {
    if (!workoutPlan) return;
    const exercise = workoutPlan.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const set = exercise.sets[setIndex];
    setEditingSet({ exerciseId, setIndex });
    setActualReps(set.actualReps?.toString() || set.reps.toString());
    setActualWeight(set.actualWeight?.toString() || set.weight.toString());
  };

  const saveActualPerformance = () => {
    if (!workoutPlan || !editingSet) return;

    const reps = parseInt(actualReps) || 0;
    const weight = parseInt(actualWeight) || 0;

    const updatedExercises = workoutPlan.exercises.map(ex => {
      if (ex.id === editingSet.exerciseId) {
        const updatedSets = ex.sets.map((s, idx) => {
          if (idx === editingSet.setIndex) {
            return { 
              ...s, 
              completed: true,
              actualReps: reps,
              actualWeight: weight,
            };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updatedPlan = { ...workoutPlan, exercises: updatedExercises };
    setWorkoutPlan(updatedPlan);
    updateWorkoutPlan(workoutPlan.id, { exercises: updatedExercises });
    setEditingSet(null);
    setActualReps('');
    setActualWeight('');
  };

  const toggleExerciseSet = (exerciseId: string, setIndex: number) => {
    if (!workoutPlan) return;

    const updatedExercises = workoutPlan.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.map((s, idx) => {
          if (idx === setIndex) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updatedPlan = { ...workoutPlan, exercises: updatedExercises };
    setWorkoutPlan(updatedPlan);
    updateWorkoutPlan(workoutPlan.id, { exercises: updatedExercises });
  };

  const openEditFood = (mealId: string, foodIndex: number) => {
    if (!dietPlan) return;
    const meal = dietPlan.meals.find(m => m.id === mealId);
    if (!meal) return;
    const food = meal.foods[foodIndex];
    setEditingFood({ mealId, foodIndex });
    setActualQuantity(food.actualQuantity?.toString() || food.quantity?.toString() || '');
  };

  const saveActualFood = () => {
    if (!dietPlan || !editingFood) return;

    const quantity = parseInt(actualQuantity) || undefined;

    const updatedMeals = dietPlan.meals.map(meal => {
      if (meal.id === editingFood.mealId) {
        const updatedFoods = meal.foods.map((food, idx) => {
          if (idx === editingFood.foodIndex) {
            if (!food.plannedQuantity && food.quantity) {
              const ratio = quantity && food.quantity ? quantity / food.quantity : 1;
              return { 
                ...food, 
                completed: true,
                actualQuantity: quantity,
                plannedQuantity: food.quantity,
                plannedCalories: food.calories,
                plannedProtein: food.protein,
                plannedCarbs: food.carbs,
                plannedFat: food.fat,
                calories: Math.round(food.calories * ratio),
                protein: Math.round(food.protein * ratio),
                carbs: Math.round(food.carbs * ratio),
                fat: Math.round(food.fat * ratio),
              };
            }
            return { 
              ...food, 
              completed: true,
              actualQuantity: quantity,
            };
          }
          return food;
        });
        return { ...meal, foods: updatedFoods };
      }
      return meal;
    });

    const updatedPlan = { ...dietPlan, meals: updatedMeals };
    setDietPlan(updatedPlan);
    updateDietPlan(dietPlan.id, { meals: updatedMeals });
    setEditingFood(null);
    setActualQuantity('');
  };

  const toggleFood = (mealId: string, foodIndex: number) => {
    if (!dietPlan) return;

    const updatedMeals = dietPlan.meals.map(meal => {
      if (meal.id === mealId) {
        const updatedFoods = meal.foods.map((food, idx) => {
          if (idx === foodIndex) {
            return { ...food, completed: !food.completed };
          }
          return food;
        });
        return { ...meal, foods: updatedFoods };
      }
      return meal;
    });

    const updatedPlan = { ...dietPlan, meals: updatedMeals };
    setDietPlan(updatedPlan);
    updateDietPlan(dietPlan.id, { meals: updatedMeals });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (!student) return null;

  const calculateWorkoutProgress = () => {
    if (!workoutPlan) return 0;
    const totalSets = workoutPlan.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = workoutPlan.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    );
    return totalSets > 0 ? completedSets / totalSets : 0;
  };

  const calculateDietProgress = () => {
    if (!dietPlan) return 0;
    const totalFoods = dietPlan.meals.reduce((acc, meal) => acc + meal.foods.length, 0);
    const completedFoods = dietPlan.meals.reduce(
      (acc, meal) => acc + meal.foods.filter(f => f.completed).length,
      0
    );
    return totalFoods > 0 ? completedFoods / totalFoods : 0;
  };

  const calculateConsumedMacros = () => {
    if (!dietPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return dietPlan.meals.reduce((acc, meal) => {
      meal.foods.forEach(food => {
        if (food.completed) {
          acc.calories += food.calories;
          acc.protein += food.protein;
          acc.carbs += food.carbs;
          acc.fat += food.fat;
        }
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const workoutProgress = calculateWorkoutProgress();
  const dietProgress = calculateDietProgress();
  const consumedMacros = calculateConsumedMacros();
  const remainingCalories = dietPlan ? dietPlan.totalCalories - consumedMacros.calories : 0;

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const overallProgress = (workoutProgress + dietProgress) / 2;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.dateText}>{today}</Text>
              <Text style={styles.userName}>Hola, {student.name} 👋</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} testID="logout-button">
              <LogOut size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatCard}>
              <View style={styles.heroStatIcon}>
                <Flame size={24} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.heroStatValue}>{Math.round(overallProgress * 100)}%</Text>
              <Text style={styles.heroStatLabel}>Progreso Hoy</Text>
            </View>
            <View style={styles.heroStatCard}>
              <View style={[styles.heroStatIcon, { backgroundColor: colors.neon + '20' }]}>
                <Dumbbell size={24} color={colors.neon} strokeWidth={2.5} />
              </View>
              <Text style={styles.heroStatValue}>{workoutPlan?.exercises.length || 0}</Text>
              <Text style={styles.heroStatLabel}>Ejercicios</Text>
            </View>
            <View style={styles.heroStatCard}>
              <View style={[styles.heroStatIcon, { backgroundColor: colors.accent + '20' }]}>
                <Apple size={24} color={colors.accent} strokeWidth={2.5} />
              </View>
              <Text style={styles.heroStatValue}>{dietPlan?.meals.length || 0}</Text>
              <Text style={styles.heroStatLabel}>Comidas</Text>
            </View>
          </View>
        </View>

        <View style={styles.caloriesHero}>
          <View style={styles.caloriesMain}>
            <Text style={styles.caloriesValue}>{consumedMacros.calories}</Text>
            <Text style={styles.caloriesLabel}>kcal consumidas</Text>
          </View>
          <View style={styles.caloriesDivider} />
          <View style={styles.caloriesRemaining}>
            <Text style={styles.caloriesRemainingValue}>{remainingCalories}</Text>
            <Text style={styles.caloriesRemainingLabel}>restantes</Text>
          </View>
        </View>

        <View style={styles.macrosGrid}>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{consumedMacros.protein}g</Text>
            <Text style={styles.macroLabel}>Proteína</Text>
            <View style={[styles.macroIndicator, { backgroundColor: colors.neon }]} />
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{consumedMacros.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbos</Text>
            <View style={[styles.macroIndicator, { backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{consumedMacros.fat}g</Text>
            <Text style={styles.macroLabel}>Grasas</Text>
            <View style={[styles.macroIndicator, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {workoutPlan && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.planVisualCard}
              onPress={() => {
                console.log('Navigating to training today');
                router.push('/student/training');
              }}
              activeOpacity={0.9}
              testID="flashcard-training"
            >
              <Image
                source={{ uri: (workoutPlan.exercises[0]?.imageUrl) || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200' }}
                style={styles.planCardImage}
              />
              <View style={styles.planCardOverlay}>
                <View style={styles.planCardHeader}>
                  <View style={styles.planIconBadge}>
                    <Dumbbell size={28} color={colors.neon} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.planCardTitle}>Entrenamiento de hoy</Text>
                </View>
                <View style={styles.planCardViewButton}>
                  <Text style={styles.planCardViewText}>Ver entrenamiento</Text>
                  <ChevronRight size={20} color={colors.background} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {dietPlan && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.planVisualCard, { borderColor: colors.accent }]}
              onPress={() => {
                console.log('Navigating to meals today');
                router.push('/student/meals');
              }}
              activeOpacity={0.9}
              testID="flashcard-diet"
            >
              <Image
                source={{ uri: (dietPlan.meals[0]?.imageUrl) || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200' }}
                style={styles.planCardImage}
              />
              <View style={styles.planCardOverlay}>
                <View style={styles.planCardHeader}>
                  <View style={[styles.planIconBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}> 
                    <Apple size={28} color={colors.accent} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.planCardTitle}>Dieta de hoy</Text>
                </View>
                <View style={[styles.planCardViewButton, { backgroundColor: colors.accent }]}>
                  <Text style={styles.planCardViewText}>Ver dieta</Text>
                  <ChevronRight size={20} color={colors.background} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={editingSet !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Rendimiento Real</Text>
              <TouchableOpacity onPress={() => setEditingSet(null)}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Repeticiones realizadas</Text>
            <TextInput
              style={styles.modalInput}
              value={actualReps}
              onChangeText={setActualReps}
              keyboardType="numeric"
              placeholder="Reps"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.modalLabel}>Peso utilizado (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={actualWeight}
              onChangeText={setActualWeight}
              keyboardType="numeric"
              placeholder="Kg"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={styles.modalSaveButton} onPress={saveActualPerformance} testID="save-set-performance">
              <Text style={styles.modalSaveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editingFood !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Cantidad Real</Text>
              <TouchableOpacity onPress={() => setEditingFood(null)}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Cantidad consumida</Text>
            <TextInput
              style={styles.modalInput}
              value={actualQuantity}
              onChangeText={setActualQuantity}
              keyboardType="numeric"
              placeholder="Cantidad"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={styles.modalSaveButton} onPress={saveActualFood} testID="save-food-quantity">
              <Text style={styles.modalSaveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  userName: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
  },
  heroStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  caloriesHero: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  caloriesMain: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: colors.neon,
    lineHeight: 64,
  },
  caloriesLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  caloriesDivider: {
    width: 80,
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  caloriesRemaining: {
    alignItems: 'center',
  },
  caloriesRemainingValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.white,
  },
  caloriesRemainingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
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
  macroValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  macroIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  section: {
    gap: 12,
  },
  planVisualCard: {
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.neon,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  planCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover' as const,
  },
  planCardOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
    justifyContent: 'space-between',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  planIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neon + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.neon,
  },
  planCardTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
    flex: 1,
  },
  planCardViewButton: {
    backgroundColor: colors.neon,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  planCardViewText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: colors.white,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSaveButton: {
    backgroundColor: colors.neon,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
});
