import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { ArrowLeft, TrendingUp, Dumbbell, Apple, Edit3, X, Plus, Trash2, ChefHat, ImagePlus } from 'lucide-react-native';
import { Student, WorkoutPlan, DietPlan, Exercise, ExerciseSet, Meal, Food } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAvoidingView } from 'react-native';

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { students, workoutPlans, dietPlans, updateStudent, updateWorkoutPlan, updateDietPlan, addWorkoutPlan, addDietPlan, deleteWorkoutPlan, deleteDietPlan } = useApp();

  const student = students.find(s => s.id === studentId) as Student | undefined;
  const studentWorkouts = workoutPlans.filter(plan => plan.studentId === studentId);
  const studentDiets = dietPlans.filter(plan => plan.studentId === studentId);

  const [activeTab, setActiveTab] = useState<'progress' | 'workouts' | 'diets'>('workouts');
  
  const [editProgressModal, setEditProgressModal] = useState<boolean>(false);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editHeight, setEditHeight] = useState<string>('');
  const [editGoal, setEditGoal] = useState<string>('');

  const [editWorkoutModal, setEditWorkoutModal] = useState<boolean>(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [workoutName, setWorkoutName] = useState<string>('');
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState<boolean>(false);

  const [editExerciseModal, setEditExerciseModal] = useState<boolean>(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(-1);
  const [exerciseName, setExerciseName] = useState<string>('');
  const [exerciseNotes, setExerciseNotes] = useState<string>('');
  const [exerciseImage, setExerciseImage] = useState<string>('');
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);

  const [editMealModal, setEditMealModal] = useState<boolean>(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(-1);
  const [mealName, setMealName] = useState<string>('');
  const [mealImage, setMealImage] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealFoods, setMealFoods] = useState<Food[]>([]);

  const [editFoodModal, setEditFoodModal] = useState<boolean>(false);
  const [selectedFoodIndex, setSelectedFoodIndex] = useState<number>(-1);
  const [foodName, setFoodName] = useState<string>('');
  const [foodQuantity, setFoodQuantity] = useState<string>('');
  const [foodUnit, setFoodUnit] = useState<'g' | 'ml' | 'mg'>('g');
  const [foodCalories, setFoodCalories] = useState<string>('');
  const [foodProtein, setFoodProtein] = useState<string>('');
  const [foodCarbs, setFoodCarbs] = useState<string>('');
  const [foodFat, setFoodFat] = useState<string>('');
  const [foodImage, setFoodImage] = useState<string>('');

  if (!student) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alumno no encontrado</Text>
        </View>
      </View>
    );
  }

  const pickImage = async (setImage: (uri: string) => void) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso requerido', 'Necesitas otorgar permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const openEditProgress = () => {
    setEditWeight(student.weight?.toString() || '');
    setEditHeight(student.height?.toString() || '');
    setEditGoal(student.goal || '');
    setEditProgressModal(true);
  };

  const saveProgress = async () => {
    await updateStudent(student.id, {
      weight: editWeight ? parseInt(editWeight) : undefined,
      height: editHeight ? parseInt(editHeight) : undefined,
      goal: editGoal || undefined,
    });
    setEditProgressModal(false);
    Alert.alert('Éxito', 'Progreso actualizado');
  };

  const openCreateWorkout = () => {
    setIsCreatingWorkout(true);
    setSelectedWorkout(null);
    setWorkoutName('');
    setWorkoutDays([]);
    setExercises([]);
    setEditWorkoutModal(true);
  };

  const openEditWorkout = (workout: WorkoutPlan) => {
    setIsCreatingWorkout(false);
    setSelectedWorkout(workout);
    setWorkoutName(workout.name);
    setWorkoutDays(workout.daysOfWeek);
    setExercises(workout.exercises);
    setEditWorkoutModal(true);
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'El nombre del entrenamiento es requerido');
      return;
    }

    if (isCreatingWorkout) {
      const newWorkout: WorkoutPlan = {
        id: `workout-${Date.now()}`,
        studentId: student.id,
        name: workoutName,
        daysOfWeek: workoutDays,
        exercises,
        createdAt: new Date().toISOString(),
      };
      await addWorkoutPlan(newWorkout);
    } else if (selectedWorkout) {
      await updateWorkoutPlan(selectedWorkout.id, {
        name: workoutName,
        daysOfWeek: workoutDays,
        exercises,
      });
    }
    
    setEditWorkoutModal(false);
    setSelectedWorkout(null);
    Alert.alert('Éxito', isCreatingWorkout ? 'Entrenamiento creado' : 'Entrenamiento actualizado');
  };

  const deleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutPlan(workoutId);
            Alert.alert('Éxito', 'Entrenamiento eliminado');
          },
        },
      ]
    );
  };

  const openCreateExercise = () => {
    console.log('Opening create exercise modal');
    setSelectedExerciseIndex(-1);
    setExerciseName('');
    setExerciseNotes('');
    setExerciseImage('');
    setExerciseSets([{ set: 1, reps: 10, weight: 0 }]);
    setTimeout(() => setEditExerciseModal(true), 100);
  };

  const openEditExercise = (index: number) => {
    console.log('Opening edit exercise modal for index:', index);
    const exercise = exercises[index];
    setSelectedExerciseIndex(index);
    setExerciseName(exercise.name);
    setExerciseNotes(exercise.notes || '');
    setExerciseImage(exercise.imageUrl || '');
    setExerciseSets(exercise.sets);
    setTimeout(() => setEditExerciseModal(true), 100);
  };

  const saveExercise = () => {
    console.log('Saving exercise');
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'El nombre del ejercicio es requerido');
      return;
    }

    const newExercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: exerciseName,
      notes: exerciseNotes,
      imageUrl: exerciseImage,
      sets: exerciseSets,
    };

    if (selectedExerciseIndex >= 0) {
      const updated = [...exercises];
      updated[selectedExerciseIndex] = newExercise;
      setExercises(updated);
    } else {
      setExercises([...exercises, newExercise]);
    }

    setEditExerciseModal(false);
  };

  const deleteExercise = (index: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este ejercicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updated = exercises.filter((_, i) => i !== index);
            setExercises(updated);
          },
        },
      ]
    );
  };

  const addSet = () => {
    const newSet: ExerciseSet = {
      set: exerciseSets.length + 1,
      reps: 10,
      weight: 0,
    };
    setExerciseSets([...exerciseSets, newSet]);
  };

  const removeSet = (index: number) => {
    if (exerciseSets.length > 1) {
      const updated = exerciseSets.filter((_, i) => i !== index)
        .map((set, idx) => ({ ...set, set: idx + 1 }));
      setExerciseSets(updated);
    }
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const updated = [...exerciseSets];
    updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
    setExerciseSets(updated);
  };

  const openCreateMeal = () => {
    setSelectedMealIndex(-1);
    setMealName('');
    setMealImage('');
    setMealType('breakfast');
    setMealFoods([]);
    setEditMealModal(true);
  };

  const openEditMeal = (index: number) => {
    if (!studentDiets[0]) return;
    const meal = studentDiets[0].meals[index];
    setSelectedMealIndex(index);
    setMealName(meal.name);
    setMealImage(meal.imageUrl || '');
    setMealType(meal.type || 'breakfast');
    setMealFoods(meal.foods);
    setEditMealModal(true);
  };

  const saveMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'El nombre de la comida es requerido');
      return;
    }

    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: mealName,
      imageUrl: mealImage,
      type: mealType,
      foods: mealFoods,
    };

    let diet = studentDiets[0];
    
    if (!diet) {
      diet = {
        id: `diet-${Date.now()}`,
        studentId: student.id,
        meals: [newMeal],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        createdAt: new Date().toISOString(),
      };
      await addDietPlan(diet);
    } else {
      const updatedMeals = selectedMealIndex >= 0
        ? diet.meals.map((m, i) => i === selectedMealIndex ? newMeal : m)
        : [...diet.meals, newMeal];

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      updatedMeals.forEach(meal => {
        meal.foods.forEach(food => {
          totalCalories += food.calories;
          totalProtein += food.protein;
          totalCarbs += food.carbs;
          totalFat += food.fat;
        });
      });

      await updateDietPlan(diet.id, {
        meals: updatedMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
    }

    setEditMealModal(false);
    Alert.alert('Éxito', selectedMealIndex >= 0 ? 'Comida actualizada' : 'Comida creada');
  };

  const deleteMeal = async (index: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta comida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!studentDiets[0]) return;
            const diet = studentDiets[0];
            const updatedMeals = diet.meals.filter((_, i) => i !== index);
            await updateDietPlan(diet.id, { meals: updatedMeals });
            Alert.alert('Éxito', 'Comida eliminada');
          },
        },
      ]
    );
  };

  const openCreateFood = () => {
    console.log('Opening create food modal');
    setSelectedFoodIndex(-1);
    setFoodName('');
    setFoodQuantity('100');
    setFoodUnit('g');
    setFoodCalories('');
    setFoodProtein('');
    setFoodCarbs('');
    setFoodFat('');
    setFoodImage('');
    setTimeout(() => setEditFoodModal(true), 100);
  };

  const openEditFood = (index: number) => {
    console.log('Opening edit food modal for index:', index);
    const food = mealFoods[index];
    setSelectedFoodIndex(index);
    setFoodName(food.name);
    setFoodQuantity(food.quantity?.toString() || '100');
    setFoodUnit(food.unit || 'g');
    setFoodCalories(food.calories.toString());
    setFoodProtein(food.protein.toString());
    setFoodCarbs(food.carbs.toString());
    setFoodFat(food.fat.toString());
    setFoodImage(food.imageUrl || '');
    setTimeout(() => setEditFoodModal(true), 100);
  };

  const saveFood = () => {
    console.log('Saving food');
    if (!foodName.trim()) {
      Alert.alert('Error', 'El nombre del alimento es requerido');
      return;
    }

    const newFood: Food = {
      name: foodName,
      quantity: parseInt(foodQuantity) || 100,
      unit: foodUnit,
      calories: parseInt(foodCalories) || 0,
      protein: parseFloat(foodProtein) || 0,
      carbs: parseFloat(foodCarbs) || 0,
      fat: parseFloat(foodFat) || 0,
      imageUrl: foodImage,
    };

    if (selectedFoodIndex >= 0) {
      const updated = [...mealFoods];
      updated[selectedFoodIndex] = newFood;
      setMealFoods(updated);
    } else {
      setMealFoods([...mealFoods, newFood]);
    }

    setEditFoodModal(false);
  };

  const deleteFood = (index: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este alimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updated = mealFoods.filter((_, i) => i !== index);
            setMealFoods(updated);
          },
        },
      ]
    );
  };

  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Alumno</Text>
      </View>

      <View style={styles.profileHeader}>
        <Image
          source={{ uri: student.avatar }}
          style={styles.profileAvatar}
        />
        <Text style={styles.profileName}>{student.name}</Text>
        {student.age && <Text style={styles.profileDetail}>{student.age} años</Text>}
        {student.email && <Text style={styles.profileDetail}>{student.email}</Text>}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          onPress={() => setActiveTab('progress')}
        >
          <TrendingUp size={20} color={activeTab === 'progress' ? colors.neon : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>Progreso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workouts' && styles.tabActive]}
          onPress={() => setActiveTab('workouts')}
        >
          <Dumbbell size={20} color={activeTab === 'workouts' ? colors.neon : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.tabTextActive]}>Entrenos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diets' && styles.tabActive]}
          onPress={() => setActiveTab('diets')}
        >
          <Apple size={20} color={activeTab === 'diets' ? colors.neon : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'diets' && styles.tabTextActive]}>Dietas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'progress' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Datos Personales</Text>
              <TouchableOpacity onPress={openEditProgress}>
                <Edit3 size={20} color={colors.neon} />
              </TouchableOpacity>
            </View>
            <View style={styles.progressCard}>
              {student.weight && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Peso</Text>
                  <Text style={styles.progressValue}>{student.weight} kg</Text>
                </View>
              )}
              {student.height && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Altura</Text>
                  <Text style={styles.progressValue}>{student.height} cm</Text>
                </View>
              )}
              {student.goal && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Objetivo</Text>
                  <Text style={styles.progressValue}>{student.goal}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'workouts' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Entrenamientos</Text>
              <TouchableOpacity onPress={openCreateWorkout} style={styles.addButton}>
                <Plus size={18} color={colors.background} />
              </TouchableOpacity>
            </View>
            {studentWorkouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <View style={styles.workoutActions}>
                    <TouchableOpacity onPress={() => openEditWorkout(workout)} style={styles.iconButton}>
                      <Edit3 size={18} color={colors.neon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteWorkout(workout.id)} style={styles.iconButton}>
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.workoutDays}>
                  {daysOfWeek.map((day, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dayBadge,
                        workout.daysOfWeek.includes(idx) && styles.dayBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          workout.daysOfWeek.includes(idx) && styles.dayBadgeTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.workoutExercises}>{workout.exercises.length} ejercicios</Text>
              </View>
            ))}
            {studentWorkouts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay entrenamientos asignados</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'diets' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Comidas</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={openCreateMeal}
              >
                <Plus size={18} color={colors.background} />
              </TouchableOpacity>
            </View>
            
            {studentDiets.length > 0 && studentDiets[0].meals.length > 0 ? (
              <View style={styles.mealsGrid}>
                {studentDiets[0].meals.map((meal, index) => {
                  const totalCalories = meal.foods.reduce((acc, food) => acc + food.calories, 0);
                  
                  return (
                    <View key={meal.id} style={styles.mealCard}>
                      <Image
                        source={{ uri: meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
                        style={styles.mealCardImage}
                      />
                      <View style={styles.mealCardContent}>
                        <Text style={styles.mealCardName}>{meal.name}</Text>
                        <Text style={styles.mealCardCalories}>{totalCalories} cal</Text>
                        <View style={styles.mealCardActions}>
                          <TouchableOpacity onPress={() => openEditMeal(index)} style={styles.iconButton}>
                            <Edit3 size={16} color={colors.neon} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteMeal(index)} style={styles.iconButton}>
                            <Trash2 size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ChefHat size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No hay comidas asignadas</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={editProgressModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Progreso</Text>
                <TouchableOpacity onPress={() => setEditProgressModal(false)}>
                  <X color={colors.white} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  placeholder="Peso"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={editHeight}
                  onChangeText={setEditHeight}
                  placeholder="Altura"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.label}>Objetivo</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editGoal}
                  onChangeText={setEditGoal}
                  placeholder="Objetivo del alumno"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={styles.saveButton} onPress={saveProgress}>
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={editWorkoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isCreatingWorkout ? 'Crear' : 'Editar'} Entrenamiento</Text>
                <TouchableOpacity onPress={() => setEditWorkoutModal(false)}>
                  <X color={colors.white} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Nombre del entrenamiento"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.label}>Días de la semana</Text>
                <View style={styles.daysSelector}>
                  {daysOfWeek.map((day, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayOption,
                        workoutDays.includes(idx) && styles.dayOptionSelected,
                      ]}
                      onPress={() => {
                        if (workoutDays.includes(idx)) {
                          setWorkoutDays(workoutDays.filter(d => d !== idx));
                        } else {
                          setWorkoutDays([...workoutDays, idx]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dayOptionText,
                          workoutDays.includes(idx) && styles.dayOptionTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.exercisesSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Ejercicios</Text>
                    <TouchableOpacity onPress={openCreateExercise} style={styles.addButtonSmall}>
                      <Plus size={16} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                  {exercises.map((exercise, idx) => (
                    <View key={idx} style={styles.exerciseItem}>
                      <View style={styles.exerciseItemHeader}>
                        <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                        <View style={styles.exerciseItemActions}>
                          <TouchableOpacity onPress={() => openEditExercise(idx)} style={styles.iconButtonSmall}>
                            <Edit3 size={14} color={colors.neon} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteExercise(idx)} style={styles.iconButtonSmall}>
                            <Trash2 size={14} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.exerciseItemSets}>{exercise.sets.length} series</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
                  <Text style={styles.saveButtonText}>Guardar Entrenamiento</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={editExerciseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedExerciseIndex >= 0 ? 'Editar' : 'Crear'} Ejercicio</Text>
                <TouchableOpacity onPress={() => setEditExerciseModal(false)}>
                  <X color={colors.white} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={exerciseName}
                  onChangeText={setExerciseName}
                  placeholder="Nombre del ejercicio"
                  placeholderTextColor={colors.textSecondary}
                />
                
                <Text style={styles.label}>Imagen</Text>
                <TouchableOpacity 
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(setExerciseImage)}
                >
                  <ImagePlus size={20} color={colors.white} />
                  <Text style={styles.imagePickerText}>
                    {exerciseImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Text>
                </TouchableOpacity>
                {exerciseImage && (
                  <Image source={{ uri: exerciseImage }} style={styles.previewImage} />
                )}

                <Text style={styles.label}>Notas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={exerciseNotes}
                  onChangeText={setExerciseNotes}
                  placeholder="Notas e instrucciones"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.setsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Series</Text>
                    <TouchableOpacity onPress={addSet} style={styles.addButtonSmall}>
                      <Plus size={16} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                  {exerciseSets.map((set, idx) => (
                    <View key={idx} style={styles.setRow}>
                      <Text style={styles.setLabel}>Serie {set.set}</Text>
                      <View style={styles.setInputs}>
                        <View style={styles.setInputGroup}>
                          <Text style={styles.setInputLabel}>Reps</Text>
                          <TextInput
                            style={styles.setInput}
                            value={set.reps.toString()}
                            onChangeText={(val) => updateSet(idx, 'reps', val)}
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <View style={styles.setInputGroup}>
                          <Text style={styles.setInputLabel}>Kg</Text>
                          <TextInput
                            style={styles.setInput}
                            value={set.weight.toString()}
                            onChangeText={(val) => updateSet(idx, 'weight', val)}
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        {exerciseSets.length > 1 && (
                          <TouchableOpacity onPress={() => removeSet(idx)} style={styles.removeButton}>
                            <X size={16} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveExercise}>
                  <Text style={styles.saveButtonText}>Guardar Ejercicio</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={editMealModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedMealIndex >= 0 ? 'Editar' : 'Crear'} Comida</Text>
                <TouchableOpacity onPress={() => setEditMealModal(false)}>
                  <X color={colors.white} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Nombre de la comida"
                  placeholderTextColor={colors.textSecondary}
                />
                
                <Text style={styles.label}>Imagen</Text>
                <TouchableOpacity 
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(setMealImage)}
                >
                  <ImagePlus size={20} color={colors.white} />
                  <Text style={styles.imagePickerText}>
                    {mealImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Text>
                </TouchableOpacity>
                {mealImage && (
                  <Image source={{ uri: mealImage }} style={styles.previewImage} />
                )}

                <Text style={styles.label}>Tipo</Text>
                <View style={styles.mealTypeSelector}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealTypeOption,
                        mealType === type && styles.mealTypeOptionSelected,
                      ]}
                      onPress={() => setMealType(type)}
                    >
                      <Text
                        style={[
                          styles.mealTypeText,
                          mealType === type && styles.mealTypeTextSelected,
                        ]}
                      >
                        {type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Almuerzo' : type === 'dinner' ? 'Cena' : 'Snack'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.foodsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Alimentos</Text>
                    <TouchableOpacity onPress={openCreateFood} style={styles.addButtonSmall}>
                      <Plus size={16} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                  {mealFoods.map((food, idx) => (
                    <View key={idx} style={styles.foodItem}>
                      <View style={styles.foodItemHeader}>
                        <Text style={styles.foodItemName}>{food.name}</Text>
                        <View style={styles.foodItemActions}>
                          <TouchableOpacity onPress={() => openEditFood(idx)} style={styles.iconButtonSmall}>
                            <Edit3 size={14} color={colors.neon} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteFood(idx)} style={styles.iconButtonSmall}>
                            <Trash2 size={14} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.foodItemDetails}>
                        {food.quantity}{food.unit} • {food.calories}cal
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
                  <Text style={styles.saveButtonText}>Guardar Comida</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={editFoodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedFoodIndex >= 0 ? 'Editar' : 'Crear'} Alimento</Text>
                <TouchableOpacity onPress={() => setEditFoodModal(false)}>
                  <X color={colors.white} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="Nombre del alimento"
                  placeholderTextColor={colors.textSecondary}
                />
                
                <Text style={styles.label}>Imagen</Text>
                <TouchableOpacity 
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(setFoodImage)}
                >
                  <ImagePlus size={20} color={colors.white} />
                  <Text style={styles.imagePickerText}>
                    {foodImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Text>
                </TouchableOpacity>
                {foodImage && (
                  <Image source={{ uri: foodImage }} style={styles.previewImage} />
                )}

                <View style={styles.quantityRow}>
                  <View style={styles.quantityInputGroup}>
                    <Text style={styles.label}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      value={foodQuantity}
                      onChangeText={setFoodQuantity}
                      placeholder="100"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.unitInputGroup}>
                    <Text style={styles.label}>Unidad</Text>
                    <View style={styles.unitSelector}>
                      {(['g', 'ml', 'mg'] as const).map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitOption,
                            foodUnit === unit && styles.unitOptionSelected,
                          ]}
                          onPress={() => setFoodUnit(unit)}
                        >
                          <Text
                            style={[
                              styles.unitOptionText,
                              foodUnit === unit && styles.unitOptionTextSelected,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Calorías</Text>
                <TextInput
                  style={styles.input}
                  value={foodCalories}
                  onChangeText={setFoodCalories}
                  placeholder="Calorías"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Proteína (g)</Text>
                <TextInput
                  style={styles.input}
                  value={foodProtein}
                  onChangeText={setFoodProtein}
                  placeholder="Proteína"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Carbohidratos (g)</Text>
                <TextInput
                  style={styles.input}
                  value={foodCarbs}
                  onChangeText={setFoodCarbs}
                  placeholder="Carbohidratos"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Grasas (g)</Text>
                <TextInput
                  style={styles.input}
                  value={foodFat}
                  onChangeText={setFoodFat}
                  placeholder="Grasas"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity style={styles.saveButton} onPress={saveFood}>
                  <Text style={styles.saveButtonText}>Guardar Alimento</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.neon,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: colors.neon,
    backgroundColor: colors.neon + '20',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.neon,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    flex: 1,
    textAlign: 'right',
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonSmall: {
    padding: 2,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  workoutDays: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeActive: {
    backgroundColor: colors.neon,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  dayBadgeTextActive: {
    color: colors.background,
  },
  workoutExercises: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  mealsGrid: {
    gap: 16,
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealCardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover' as const,
  },
  mealCardContent: {
    padding: 16,
  },
  mealCardName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 8,
  },
  mealCardCalories: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.accent,
    marginBottom: 12,
  },
  mealCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover' as const,
  },
  saveButton: {
    backgroundColor: colors.neon,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: '700' as const,
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayOptionSelected: {
    borderColor: colors.neon,
    backgroundColor: colors.neon + '20',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  dayOptionTextSelected: {
    color: colors.neon,
  },
  exercisesSection: {
    marginTop: 16,
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  exerciseItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseItemSets: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  setsSection: {
    marginTop: 16,
    gap: 12,
  },
  setRow: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 12,
  },
  setInputs: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  setInputGroup: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  setInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  mealTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeOptionSelected: {
    borderColor: colors.neon,
    backgroundColor: colors.neon + '20',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  mealTypeTextSelected: {
    color: colors.neon,
  },
  foodsSection: {
    marginTop: 16,
    gap: 12,
  },
  foodItem: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  foodItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  foodItemDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInputGroup: {
    flex: 2,
  },
  unitInputGroup: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitOptionSelected: {
    borderColor: colors.neon,
    backgroundColor: colors.neon + '20',
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  unitOptionTextSelected: {
    color: colors.neon,
  },
  keyboardView: {
    flex: 1,
  },
});
