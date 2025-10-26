import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Plus, X, Trash2, UtensilsCrossed, Edit2, Sparkles, ImageUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { DietPlan, Meal, Food, Trainer } from '@/types';
import { generateObject } from '@rork/toolkit-sdk';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';

export default function TrainerDietsScreen() {
  const { currentUser, dietPlans, students, addDietPlan, updateDietPlan, deleteDietPlan } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentMealName, setCurrentMealName] = useState<string>('');
  const [currentMealTime, setCurrentMealTime] = useState<string>('');
  const [currentFoods, setCurrentFoods] = useState<Food[]>([]);
  const [foodName, setFoodName] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'mg'>('g');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [isGeneratingMacros, setIsGeneratingMacros] = useState<boolean>(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);
  const [editingMeal, setEditingMeal] = useState<{ planId: string; mealIndex: number } | null>(null);
  const [editingFood, setEditingFood] = useState<{ mealIndex: number; foodIndex: number } | null>(null);
  const [foodImageUrl, setFoodImageUrl] = useState<string>('');

  const trainer = currentUser as Trainer;
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const pickFoodImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              setFoodImageUrl(event.target.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const dataUri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
          setFoodImageUrl(dataUri);
        } else if (asset.uri) {
          setFoodImageUrl(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const generateMacrosWithAI = async () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Escribe el nombre del alimento primero');
      return;
    }

    setIsGeneratingMacros(true);
    try {
      const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;
      
      if (!toolkitUrl) {
        console.warn('EXPO_PUBLIC_TOOLKIT_URL not configured');
        Alert.alert(
          'Función no disponible',
          'La generación automática de macros con IA no está configurada. Por favor, introduce los valores manualmente.'
        );
        setIsGeneratingMacros(false);
        return;
      }

      const macrosSchema = z.object({
        calories: z.number().describe('Calorías totales del alimento'),
        protein: z.number().describe('Proteínas en gramos'),
        carbs: z.number().describe('Carbohidratos en gramos'),
        fat: z.number().describe('Grasas en gramos'),
        suggestedQuantity: z.number().optional().describe('Cantidad sugerida en gramos o ml'),
        suggestedUnit: z.enum(['g', 'ml', 'mg']).optional().describe('Unidad sugerida'),
      });

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Proporciona los macronutrientes para: ${foodName}. Si es posible, sugiere una cantidad típica de porción.`,
          },
        ],
        schema: macrosSchema,
      });

      setCalories(result.calories.toString());
      setProtein(result.protein.toString());
      setCarbs(result.carbs.toString());
      setFat(result.fat.toString());
      if (result.suggestedQuantity) {
        setQuantity(result.suggestedQuantity.toString());
      }
      if (result.suggestedUnit) {
        setUnit(result.suggestedUnit);
      }
    } catch (error) {
      console.error('Error generating macros:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert(
        'Error',
        `No se pudieron generar los macros automáticamente: ${errorMessage}. Por favor, introduce los valores manualmente.`
      );
    } finally {
      setIsGeneratingMacros(false);
    }
  };

  const handleAddFood = () => {
    if (!foodName.trim() || !calories) {
      Alert.alert('Error', 'Añade nombre y calorías');
      return;
    }

    const newFood: Food = {
      name: foodName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      quantity: parseInt(quantity) || undefined,
      unit: quantity ? unit : undefined,
      completed: false,
      imageUrl: foodImageUrl || undefined,
    };

    if (editingFood !== null && editingPlan) {
      const updatedMeals = [...meals];
      const meal = updatedMeals[editingFood.mealIndex];
      if (meal) {
        const updatedFoods = [...meal.foods];
        updatedFoods[editingFood.foodIndex] = newFood;
        meal.foods = updatedFoods;
        setMeals(updatedMeals);
      }
      setEditingFood(null);
    } else {
      setCurrentFoods([...currentFoods, newFood]);
    }

    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setQuantity('');
    setUnit('g');
    setFoodImageUrl('');
  };

  const handleAddMeal = () => {
    if (!currentMealName.trim() || currentFoods.length === 0) {
      Alert.alert('Error', 'Añade nombre y al menos un alimento');
      return;
    }

    const newMeal: Meal = {
      id: `meal${Date.now()}`,
      name: currentMealName,
      time: currentMealTime,
      foods: currentFoods,
    };

    setMeals([...meals, newMeal]);
    setCurrentMealName('');
    setCurrentMealTime('');
    setCurrentFoods([]);
  };

  const handleSavePlan = async () => {
    if (!selectedStudent || meals.length === 0) {
      Alert.alert('Error', 'Selecciona un alumno y añade al menos una comida');
      return;
    }

    const planName = `Plan ${daysOfWeek[selectedDayOfWeek]}`;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach(meal => {
      meal.foods.forEach(food => {
        totalCalories += food.calories;
        totalProtein += food.protein;
        totalCarbs += food.carbs;
        totalFat += food.fat;
      });
    });

    if (editingPlan) {
      await updateDietPlan(editingPlan.id, {
        studentId: selectedStudent,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
      Alert.alert('Éxito', 'Plan de dieta actualizado');
    } else {
      const newPlan: DietPlan = {
        id: `diet${Date.now()}`,
        studentId: selectedStudent,
        name: planName,
        dayOfWeek: selectedDayOfWeek,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        createdAt: new Date().toISOString(),
      };
      await addDietPlan(newPlan);
      Alert.alert('Éxito', 'Plan de dieta creado');
    }

    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStudent('');
    setMeals([]);
    setCurrentMealName('');
    setCurrentMealTime('');
    setCurrentFoods([]);
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setQuantity('');
    setUnit('g');
    setEditingPlan(null);
    setSelectedDayOfWeek(0);
    setEditingMeal(null);
    setEditingFood(null);
    setFoodImageUrl('');
  };

  const handleEditPlan = (plan: DietPlan) => {
    setEditingPlan(plan);
    setSelectedStudent(plan.studentId);
    setMeals(plan.meals);
    setSelectedDayOfWeek(plan.dayOfWeek || 0);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dietas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {dietPlans.map((plan) => {
          const student = students.find(s => s.id === plan.studentId);
          const isExpanded = expandedPlan === plan.id;
          return (
            <View key={plan.id} style={styles.planCard}>
              <TouchableOpacity 
                style={styles.planHeaderButton}
                onPress={() => setExpandedPlan(isExpanded ? null : plan.id)}
                activeOpacity={0.7}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.studentName}>{student?.name}</Text>
                  {plan.name && <Text style={styles.planDayName}>{plan.name}</Text>}
                  <View style={styles.macrosRow}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{plan.totalCalories}</Text>
                      <Text style={styles.macroLabel}>kcal</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{plan.totalProtein}g</Text>
                      <Text style={styles.macroLabel}>Proteína</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{plan.totalCarbs}g</Text>
                      <Text style={styles.macroLabel}>Carbos</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{plan.totalFat}g</Text>
                      <Text style={styles.macroLabel}>Grasas</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.planHeaderActions}>
                <TouchableOpacity onPress={() => handleEditPlan(plan)} style={styles.actionButton}>
                  <Edit2 color={colors.accent} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'Confirmar eliminación',
                    '¿Estás seguro de que quieres eliminar este plan de dieta?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDietPlan(plan.id) }
                    ]
                  );
                }} style={styles.actionButton}>
                  <Trash2 color={colors.error} size={20} />
                </TouchableOpacity>
              </View>
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {plan.meals.map((meal) => (
                    <View key={meal.id} style={styles.expandedMeal}>
                      <View style={styles.expandedMealHeader}>
                        <Text style={styles.expandedMealName}>{meal.name}</Text>
                        {meal.time && <Text style={styles.expandedMealTime}>{meal.time}</Text>}
                      </View>
                      {meal.foods.map((food, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.expandedFood}
                          onPress={() => {
                            const mealIdx = plan.meals.findIndex(m => m.id === meal.id);
                            setEditingFood({ mealIndex: mealIdx, foodIndex: idx });
                            setEditingPlan(plan);
                            setFoodName(food.name);
                            setCalories(food.calories.toString());
                            setProtein(food.protein.toString());
                            setCarbs(food.carbs.toString());
                            setFat(food.fat.toString());
                            setQuantity(food.quantity?.toString() || '');
                            setUnit(food.unit || 'g');
                            setFoodImageUrl(food.imageUrl || '');
                            setModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          {food.imageUrl && (
                            <Image source={{ uri: food.imageUrl }} style={styles.expandedFoodImage} />
                          )}
                          <View style={styles.expandedFoodInfo}>
                            <Text style={styles.expandedFoodName}>{food.name}</Text>
                            <Text style={styles.expandedFoodDetails}>
                              {food.quantity && food.unit ? `${food.quantity}${food.unit} • ` : ''}
                              {food.calories}kcal • P:{food.protein}g • C:{food.carbs}g • G:{food.fat}g
                            </Text>
                          </View>
                          <Edit2 color={colors.textSecondary} size={16} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {!isExpanded && (
                <View style={styles.mealsList}>
                  {plan.meals.map((meal) => (
                    <View key={meal.id} style={styles.mealItem}>
                      <UtensilsCrossed color={colors.accent} size={16} />
                      <Text style={styles.mealName}>{meal.name}</Text>
                      {meal.time && <Text style={styles.mealTime}>{meal.time}</Text>}
                      <Text style={styles.mealFoods}>{meal.foods.length} alimentos</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFood !== null ? 'Editar Alimento' : editingPlan ? 'Editar Plan de Dieta' : 'Nuevo Plan de Dieta'}
              </Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editingFood === null && (
                <>
              <Text style={styles.label}>Alumno</Text>
              <View style={styles.studentSelector}>
                {trainer?.clients.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentOption,
                      selectedStudent === student.id && styles.studentOptionSelected,
                    ]}
                    onPress={() => setSelectedStudent(student.id)}
                  >
                    <Text style={[
                      styles.studentOptionText,
                      selectedStudent === student.id && styles.studentOptionTextSelected,
                    ]}>
                      {student.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Día de la Semana</Text>
              <View style={styles.daysSelector}>
                {daysOfWeek.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayOption,
                      selectedDayOfWeek === index && styles.dayOptionSelected,
                    ]}
                    onPress={() => setSelectedDayOfWeek(index)}
                  >
                    <Text style={[
                      styles.dayOptionText,
                      selectedDayOfWeek === index && styles.dayOptionTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
                </>
              )}

              {editingFood === null && (
                <>
              <Text style={styles.label}>Comidas</Text>
              {meals.map((meal, idx) => (
                <View key={meal.id} style={styles.addedMeal}>
                  <View style={styles.addedMealInfo}>
                    <Text style={styles.addedMealName}>{meal.name}</Text>
                    {meal.time && <Text style={styles.addedMealTime}>{meal.time}</Text>}
                    <Text style={styles.addedMealFoods}>{meal.foods.length} alimentos</Text>
                  </View>
                  <TouchableOpacity onPress={() => setMeals(meals.filter((_, i) => i !== idx))}>
                    <Trash2 color={colors.error} size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.mealForm}>
                <Text style={styles.subLabel}>Nueva Comida</Text>
                <TextInput
                  style={styles.input}
                  value={currentMealName}
                  onChangeText={setCurrentMealName}
                  placeholder="Nombre (ej: Desayuno)"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  value={currentMealTime}
                  onChangeText={setCurrentMealTime}
                  placeholder="Hora (opcional, ej: 08:00)"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.subLabel}>Alimentos</Text>
                {currentFoods.map((food, idx) => (
                  <View key={idx} style={styles.addedFood}>
                    <Text style={styles.addedFoodName}>{food.name}</Text>
                    <Text style={styles.addedFoodMacros}>
                      {food.calories}kcal | P:{food.protein}g C:{food.carbs}g G:{food.fat}g
                    </Text>
                    <TouchableOpacity onPress={() => setCurrentFoods(currentFoods.filter((_, i) => i !== idx))}>
                      <Trash2 color={colors.error} size={16} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.foodNameRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={foodName}
                    onChangeText={setFoodName}
                    placeholder="Nombre del alimento"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity 
                    style={styles.aiButton} 
                    onPress={generateMacrosWithAI}
                    disabled={isGeneratingMacros || !foodName.trim()}
                  >
                    {isGeneratingMacros ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Sparkles color={colors.white} size={20} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.macrosInputRow}>
                  <TextInput
                    style={styles.macroInput}
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="Kcal"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={styles.macroInput}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="Proteína"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.macrosInputRow}>
                  <TextInput
                    style={styles.macroInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="Carbos"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={styles.macroInput}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="Grasas"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Cantidad (opcional)"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <View style={styles.unitSelector}>
                    {(['g', 'ml', 'mg'] as const).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitOption,
                          unit === u && styles.unitOptionSelected,
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[
                          styles.unitOptionText,
                          unit === u && styles.unitOptionTextSelected,
                        ]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={styles.subLabel}>Foto del alimento (opcional)</Text>
                {foodImageUrl ? (
                  <View>
                    <Image source={{ uri: foodImageUrl }} style={styles.foodImagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => setFoodImageUrl('')}
                    >
                      <X size={16} color={colors.white} />
                      <Text style={styles.removeImageText}>Quitar foto</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerEmptyState}>
                    <ImageUp size={28} color={colors.textSecondary} />
                    <Text style={styles.imagePickerEmptyText}>Añade una foto del alimento</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.imageUploadButton} onPress={pickFoodImage}>
                  <ImageUp size={20} color={colors.white} />
                  <Text style={styles.imageUploadButtonText}>{foodImageUrl ? 'Cambiar foto' : 'Subir foto'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addFoodButton} onPress={handleAddFood}>
                  <Text style={styles.addFoodText}>+ Añadir Alimento</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addMealButton} onPress={handleAddMeal}>
                  <Text style={styles.addMealText}>Añadir Comida</Text>
                </TouchableOpacity>
              </View>
                </>
              )}

              {editingFood !== null ? (
                <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan}>
                  <Text style={styles.saveButtonText}>Guardar Alimento</Text>
                </TouchableOpacity>
              ) : (
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan}>
                <Text style={styles.saveButtonText}>Guardar Plan</Text>
              </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealsList: {
    gap: 8,
    marginTop: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
  },
  mealTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mealFoods: {
    fontSize: 12,
    color: colors.textSecondary,
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
    marginBottom: 12,
    marginTop: 16,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: 8,
    marginTop: 12,
  },
  studentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  studentOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  studentOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  studentOptionTextSelected: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    marginBottom: 12,
  },
  addedMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  addedMealInfo: {
    flex: 1,
  },
  addedMealName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600' as const,
  },
  addedMealTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addedMealFoods: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealForm: {
    marginTop: 12,
  },
  addedFood: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  addedFoodName: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
    fontWeight: '600' as const,
  },
  addedFoodMacros: {
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 8,
  },
  macrosInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroInput: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.white,
  },
  addFoodButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addFoodText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600' as const,
  },
  addMealButton: {
    backgroundColor: colors.accent + '20',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addMealText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700' as const,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700' as const,
  },
  planHeaderButton: {
    flex: 1,
  },
  planHeaderActions: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardLight,
  },
  expandedMeal: {
    marginBottom: 16,
  },
  expandedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedMealName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  expandedMealTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  expandedFood: {
    flexDirection: 'row',
    backgroundColor: colors.cardLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },
  expandedFoodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: 'cover' as const,
  },
  expandedFoodInfo: {
    flex: 1,
  },
  expandedFoodName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: 4,
  },
  expandedFoodDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.white,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  unitOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  unitOptionTextSelected: {
    color: colors.accent,
  },
  foodNameRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.cardLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  dayOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dayOptionTextSelected: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  planDayName: {
    fontSize: 13,
    color: colors.accent,
    marginTop: 2,
  },
  foodImagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover' as const,
    marginBottom: 12,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageUploadButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  imagePickerEmptyState: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.cardLight,
    borderStyle: 'dashed' as const,
  },
  imagePickerEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeImageText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
