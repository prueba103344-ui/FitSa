import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { X, Plus, Search, ScanBarcode } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { generateObject } from '@rork/toolkit-sdk';
import { z } from 'zod';
import { Meal, DietPlan } from '@/types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'mid-morning';

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser, updateDietPlan, dietPlans, addDietPlan } = useApp();
  const selectedDay = params.day !== undefined ? parseInt(params.day as string) : (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();
  const [foodName, setFoodName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('100');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualProtein, setManualProtein] = useState<string>('');
  const [manualCarbs, setManualCarbs] = useState<string>('');
  const [manualFat, setManualFat] = useState<string>('');



  const mealTypeLabels: Record<MealType, string> = {
    breakfast: '🌅 Desayuno',
    'mid-morning': '🍎 Almuerzo',
    lunch: '🍽️ Comida',
    snack: '🥤 Merienda',
    dinner: '🌙 Cena',
  };

  const searchFood = async () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de un alimento');
      return;
    }

    setIsAnalyzing(true);
    setSearchResults([]);
    setSelectedFood(null);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          foodName
        )}&page_size=5&json=true`
      );
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        const results = data.products
          .filter((p: any) => p.product_name)
          .map((product: any) => ({
            name: product.product_name,
            calories: product.nutriments?.['energy-kcal_100g'] || 0,
            protein: product.nutriments?.proteins_100g || 0,
            carbs: product.nutriments?.carbohydrates_100g || 0,
            fat: product.nutriments?.fat_100g || 0,
            imageUrl: product.image_url,
          }));
        setSearchResults(results);
      } else {
        const aiResult = await analyzeWithAI(foodName);
        setSearchResults([aiResult]);
      }
    } catch (error) {
      console.error('Error searching food:', error);
      try {
        const aiResult = await analyzeWithAI(foodName);
        setSearchResults([aiResult]);
      } catch {
        Alert.alert('Error', 'No se pudo obtener información del alimento');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWithAI = async (foodName: string) => {
    const schema = z.object({
      name: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    });

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `Proporciona información nutricional por 100g para: ${foodName}. 
Responde con valores exactos basados en bases de datos nutricionales estándar.`,
        },
      ],
      schema,
    });

    return result;
  };

  const addFoodToDiet = async () => {
    if (!currentUser || currentUser.role !== 'student') {
      Alert.alert('Error', 'Solo los estudiantes pueden añadir alimentos');
      return;
    }

    let foodData = selectedFood;

    if (manualMode) {
      if (!foodName.trim() || !manualCalories || !manualProtein || !manualCarbs || !manualFat) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
      foodData = {
        name: foodName.trim(),
        calories: parseFloat(manualCalories),
        protein: parseFloat(manualProtein),
        carbs: parseFloat(manualCarbs),
        fat: parseFloat(manualFat),
      };
    } else if (!selectedFood) {
      Alert.alert('Error', 'Por favor selecciona un alimento');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const multiplier = quantityNum / 100;

    const newFood = {
      name: foodData.name,
      calories: Math.round(foodData.calories * multiplier),
      protein: parseFloat((foodData.protein * multiplier).toFixed(1)),
      carbs: parseFloat((foodData.carbs * multiplier).toFixed(1)),
      fat: parseFloat((foodData.fat * multiplier).toFixed(1)),
      quantity: quantityNum,
      unit: 'g' as const,
      plannedQuantity: quantityNum,
      plannedCalories: Math.round(foodData.calories * multiplier),
      plannedProtein: parseFloat((foodData.protein * multiplier).toFixed(1)),
      plannedCarbs: parseFloat((foodData.carbs * multiplier).toFixed(1)),
      plannedFat: parseFloat((foodData.fat * multiplier).toFixed(1)),
      imageUrl: foodData.imageUrl,
    };

    const studentDiet = dietPlans.find(
      (d) => d.studentId === currentUser.id && 
      (d.dayOfWeek === undefined || d.dayOfWeek === null || d.dayOfWeek === selectedDay)
    );

    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    if (!studentDiet) {
      const mealId = `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const newMeal: Meal = {
        id: mealId,
        name: mealTypeLabels[mealType].split(' ')[1],
        type: mealType,
        foods: [newFood],
        imageUrl: foodData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      };

      const newDiet: DietPlan = {
        id: Date.now().toString(),
        studentId: currentUser.id,
        name: `Plan ${daysOfWeek[selectedDay]}`,
        dayOfWeek: selectedDay,
        meals: [newMeal],
        totalCalories: newFood.calories,
        totalProtein: newFood.protein,
        totalCarbs: newFood.carbs,
        totalFat: newFood.fat,
        createdAt: new Date().toISOString(),
      };

      await addDietPlan(newDiet);

      Alert.alert('¡Éxito!', 'Alimento añadido a tu dieta', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    const mealId = `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const existingMeal = studentDiet.meals.find((m) => m.type === mealType);

    if (existingMeal) {
      existingMeal.foods.push(newFood);

      await updateDietPlan(studentDiet.id, {
        meals: studentDiet.meals,
        totalCalories: studentDiet.totalCalories + newFood.calories,
        totalProtein: studentDiet.totalProtein + newFood.protein,
        totalCarbs: studentDiet.totalCarbs + newFood.carbs,
        totalFat: studentDiet.totalFat + newFood.fat,
      });
    } else {
      const newMeal = {
        id: mealId,
        name: mealTypeLabels[mealType].split(' ')[1],
        type: mealType,
        foods: [newFood],
        imageUrl: foodData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      };

      studentDiet.meals.push(newMeal);

      await updateDietPlan(studentDiet.id, {
        meals: studentDiet.meals,
        totalCalories: studentDiet.totalCalories + newFood.calories,
        totalProtein: studentDiet.totalProtein + newFood.protein,
        totalCarbs: studentDiet.totalCarbs + newFood.carbs,
        totalFat: studentDiet.totalFat + newFood.fat,
      });
    }

    Alert.alert('¡Éxito!', 'Alimento añadido a tu dieta', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const openScanner = () => {
    router.push('/student/scan');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Añadir Alimento</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buscar Alimento</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Ej: Pechuga de pollo, Arroz..."
                  placeholderTextColor={colors.textSecondary}
                  value={foodName}
                  onChangeText={setFoodName}
                  onSubmitEditing={searchFood}
                />
              </View>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={openScanner}
                activeOpacity={0.7}
              >
                <ScanBarcode size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.searchButton]}
                onPress={searchFood}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <Search size={20} color={colors.background} />
                    <Text style={styles.searchButtonText}>Buscar</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.manualButton]}
                onPress={() => setManualMode(!manualMode)}
              >
                <Text style={styles.manualButtonText}>
                  {manualMode ? 'Buscar' : 'Manual'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {manualMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Nutricional (por 100g)</Text>
              <View style={styles.manualInputsGrid}>
                <View style={styles.manualInputWrapper}>
                  <Text style={styles.manualInputLabel}>Calorías (kcal)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={manualCalories}
                    onChangeText={setManualCalories}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.manualInputWrapper}>
                  <Text style={styles.manualInputLabel}>Proteína (g)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={manualProtein}
                    onChangeText={setManualProtein}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.manualInputWrapper}>
                  <Text style={styles.manualInputLabel}>Carbohidratos (g)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={manualCarbs}
                    onChangeText={setManualCarbs}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.manualInputWrapper}>
                  <Text style={styles.manualInputLabel}>Grasas (g)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={manualFat}
                    onChangeText={setManualFat}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {!manualMode && searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resultados</Text>
              {searchResults.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.foodCard,
                    selectedFood === food && styles.foodCardSelected,
                  ]}
                  onPress={() => setSelectedFood(food)}
                  activeOpacity={0.7}
                >
                  <View style={styles.foodCardContent}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <View style={styles.foodMacros}>
                      <Text style={styles.foodMacroText}>
                        {Math.round(food.calories)} kcal
                      </Text>
                      <Text style={styles.foodMacroDivider}>•</Text>
                      <Text style={styles.foodMacroText}>P: {food.protein.toFixed(1)}g</Text>
                      <Text style={styles.foodMacroDivider}>•</Text>
                      <Text style={styles.foodMacroText}>C: {food.carbs.toFixed(1)}g</Text>
                      <Text style={styles.foodMacroDivider}>•</Text>
                      <Text style={styles.foodMacroText}>G: {food.fat.toFixed(1)}g</Text>
                    </View>
                    <Text style={styles.foodNote}>Por 100g</Text>
                  </View>
                  {selectedFood === food && (
                    <View style={styles.selectedCheck}>
                      <View style={styles.checkmark} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(selectedFood || manualMode) && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cantidad</Text>
                <View style={styles.quantityContainer}>
                  <TextInput
                    style={styles.quantityInput}
                    placeholder="100"
                    placeholderTextColor={colors.textSecondary}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                  <Text style={styles.quantityUnit}>gramos</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tipo de Comida</Text>
                <View style={styles.mealTypesGrid}>
                  {(Object.keys(mealTypeLabels) as MealType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        mealType === type && styles.mealTypeButtonActive,
                      ]}
                      onPress={() => setMealType(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.mealTypeButtonText,
                          mealType === type && styles.mealTypeButtonTextActive,
                        ]}
                      >
                        {mealTypeLabels[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={addFoodToDiet}
                activeOpacity={0.8}
              >
                <Plus size={24} color={colors.background} />
                <Text style={styles.addButtonText}>Añadir a mi Dieta</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.white,
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  searchButton: {
    backgroundColor: colors.accent,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  manualButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  manualInputsGrid: {
    gap: 12,
  },
  manualInputWrapper: {
    gap: 8,
  },
  manualInputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  manualInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  foodCardContent: {
    flex: 1,
    gap: 6,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  foodMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  foodMacroText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  foodMacroDivider: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  foodNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  quantityUnit: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  mealTypesGrid: {
    gap: 10,
  },
  mealTypeButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  mealTypeButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  mealTypeButtonTextActive: {
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: colors.background,
  },
  bottomSpacer: {
    height: 40,
  },
});
