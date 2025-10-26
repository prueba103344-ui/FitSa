import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { ArrowLeft, Plus, X, Trash2, Sparkles, ImageUp } from 'lucide-react-native';
import { Meal, Ingredient, Direction, Food } from '@/types';
import { generateText } from '@rork/toolkit-sdk';
import KeyboardAware from '@/components/KeyboardAware';
import * as ImagePicker from 'expo-image-picker';

export default function CreateMealScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { addDietPlan, dietPlans, updateDietPlan } = useApp();

  const [mealName, setMealName] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [prepTime, setPrepTime] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [foodImageUrl, setFoodImageUrl] = useState<string>('');
  const [picking, setPicking] = useState<boolean>(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [isGeneratingMacros, setIsGeneratingMacros] = useState<boolean>(false);

  const [newIngredientName, setNewIngredientName] = useState<string>('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState<string>('');
  const [newIngredientUnit, setNewIngredientUnit] = useState<string>('g');

  const [newDirection, setNewDirection] = useState<string>('');

  const addIngredient = () => {
    if (!newIngredientName || !newIngredientQuantity) {
      Alert.alert('Error', 'Por favor completa todos los campos del ingrediente');
      return;
    }

    const ingredient: Ingredient = {
      name: newIngredientName,
      quantity: parseFloat(newIngredientQuantity),
      unit: newIngredientUnit,
      icon: '🥗',
    };

    setIngredients([...ingredients, ingredient]);
    setNewIngredientName('');
    setNewIngredientQuantity('');
    setNewIngredientUnit('g');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addDirection = () => {
    if (!newDirection.trim()) {
      Alert.alert('Error', 'Por favor escribe una instrucción');
      return;
    }

    const direction: Direction = {
      step: directions.length + 1,
      instruction: newDirection.trim(),
    };

    setDirections([...directions, direction]);
    setNewDirection('');
  };

  const removeDirection = (index: number) => {
    const updated = directions
      .filter((_, i) => i !== index)
      .map((dir, i) => ({ ...dir, step: i + 1 }));
    setDirections(updated);
  };

  const generateMacrosWithAI = async () => {
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Añade ingredientes primero');
      return null;
    }

    setIsGeneratingMacros(true);
    try {
      const ingredientsList = ingredients
        .map(ing => `${ing.quantity}${ing.unit} de ${ing.name}`)
        .join(', ');

      const prompt = `Eres un nutricionista experto. Calcula los macros nutricionales totales aproximados para una comida con estos ingredientes: ${ingredientsList}.

Responde SOLO con un objeto JSON válido en este formato exacto (sin texto adicional):
{"calories": número, "protein": número, "carbs": número, "fat": número}

Los valores deben ser:
- calories: calorías totales en kcal
- protein: proteínas totales en gramos
- carbs: carbohidratos totales en gramos  
- fat: grasas totales en gramos

Ejemplo de respuesta: {"calories": 450, "protein": 35, "carbs": 40, "fat": 15}`;

      console.log('Generando macros para:', ingredientsList);
      const response = await generateText(prompt);
      console.log('Respuesta de IA:', response);
      
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      }
      
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.error('No se encontró JSON en la respuesta:', cleanedResponse);
        throw new Error('No se encontró JSON válido en la respuesta');
      }
      
      console.log('JSON extraído:', jsonMatch[0]);
      const macros = JSON.parse(jsonMatch[0]);
      
      if (!macros.calories || !macros.protein || !macros.carbs || !macros.fat) {
        console.error('Macros incompletos:', macros);
        throw new Error('Respuesta incompleta de la IA');
      }
      
      console.log('Macros generados:', macros);
      return macros;
    } catch (error) {
      console.error('Error generating macros:', error);
      Alert.alert(
        'Error al generar macros', 
        'No se pudieron calcular los macros automáticamente. Por favor, inténtalo de nuevo o ingresa los valores manualmente.'
      );
      return null;
    } finally {
      setIsGeneratingMacros(false);
    }
  };

  const pickImage = async (onPicked: (uri: string) => void) => {
    try {
      setPicking(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para continuar');
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
          onPicked(dataUri);
        } else if (asset.uri) {
          onPicked(asset.uri);
        }
      }
    } catch (e) {
      console.log('pickImage error', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setPicking(false);
    }
  };

  const saveMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la comida');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Error', 'Añade al menos un ingrediente');
      return;
    }

    const macros = await generateMacrosWithAI();
    if (!macros) return;

    const foods: Food[] = [{
      name: mealName,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      imageUrl: foodImageUrl || undefined,
    }];

    const meal: Meal = {
      id: Date.now().toString(),
      name: mealName,
      foods,
      type: mealType,
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      ingredients,
      directions,
    };

    const existingDiet = dietPlans.find(plan => plan.studentId === studentId);

    if (existingDiet) {
      const updatedMeals = [...existingDiet.meals, meal];
      const totalCalories = updatedMeals.reduce((acc, m) => 
        acc + m.foods.reduce((a, f) => a + f.calories, 0), 0
      );
      const totalProtein = updatedMeals.reduce((acc, m) => 
        acc + m.foods.reduce((a, f) => a + f.protein, 0), 0
      );
      const totalCarbs = updatedMeals.reduce((acc, m) => 
        acc + m.foods.reduce((a, f) => a + f.carbs, 0), 0
      );
      const totalFat = updatedMeals.reduce((acc, m) => 
        acc + m.foods.reduce((a, f) => a + f.fat, 0), 0
      );

      await updateDietPlan(existingDiet.id, {
        meals: updatedMeals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
    } else {
      await addDietPlan({
        id: Date.now().toString(),
        studentId: studentId as string,
        name: 'Plan de Dieta',
        meals: [meal],
        totalCalories: macros.calories,
        totalProtein: macros.protein,
        totalCarbs: macros.carbs,
        totalFat: macros.fat,
        createdAt: new Date().toISOString(),
      });
    }

    Alert.alert('Éxito', 'Comida creada correctamente');
    router.back();
  };

  const mealTypes = [
    { value: 'breakfast' as const, label: 'Desayuno' },
    { value: 'lunch' as const, label: 'Almuerzo' },
    { value: 'dinner' as const, label: 'Cena' },
    { value: 'snack' as const, label: 'Snack' },
  ];

  return (
    <KeyboardAware style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Comida</Text>
          <View style={{ width: 40 }} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <Text style={styles.label}>Nombre de la comida</Text>
            <TextInput
              style={styles.input}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Ej: Salmón con espárragos"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Tipo de comida</Text>
            <View style={styles.typeSelector}>
              {mealTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    mealType === type.value && styles.typeOptionActive,
                  ]}
                  onPress={() => setMealType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      mealType === type.value && styles.typeOptionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tiempo de preparación (minutos)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="15"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Foto del plato (Visible en el menú del alumno)</Text>
            {imageUrl ? (
              <View>
                <Image source={{ uri: imageUrl }} style={styles.preview} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setImageUrl('')}
                >
                  <X size={16} color={colors.white} />
                  <Text style={styles.removeImageText}>Quitar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerEmptyState}>
                <ImageUp size={32} color={colors.textSecondary} />
                <Text style={styles.imagePickerEmptyText}>Añade una foto del plato para que el alumno la vea en su menú</Text>
              </View>
            )}
            <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setImageUrl)} disabled={picking}>
              <ImageUp size={20} color={colors.white} />
              <Text style={styles.imageButtonText}>{picking ? 'Cargando...' : imageUrl ? 'Cambiar foto del plato' : 'Subir foto del plato'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>URL de imagen (opcional)</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagen del alimento principal</Text>
            <Text style={styles.sectionDescription}>Esta foto se mostrará junto al nombre del alimento en la app del alumno</Text>
            {foodImageUrl ? (
              <View>
                <Image source={{ uri: foodImageUrl }} style={styles.foodPreview} />
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
            <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setFoodImageUrl)} disabled={picking}>
              <ImageUp size={20} color={colors.white} />
              <Text style={styles.imageButtonText}>{picking ? 'Cargando...' : foodImageUrl ? 'Cambiar foto' : 'Subir foto del alimento'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientQuantity}>
                    {ingredient.quantity} {ingredient.unit}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Trash2 size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addIngredientForm}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                value={newIngredientName}
                onChangeText={setNewIngredientName}
                placeholder="Nombre del ingrediente"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={newIngredientQuantity}
                  onChangeText={setNewIngredientQuantity}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={newIngredientUnit}
                  onChangeText={setNewIngredientUnit}
                  placeholder="Unidad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                <Plus size={20} color={colors.background} />
                <Text style={styles.addButtonText}>Añadir Ingrediente</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            
            {directions.map((direction, index) => (
              <View key={index} style={styles.directionCard}>
                <View style={styles.directionNumber}>
                  <Text style={styles.directionNumberText}>
                    {String(direction.step).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.directionText}>{direction.instruction}</Text>
                <TouchableOpacity onPress={() => removeDirection(index)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}

            <TextInput
              style={[styles.input, styles.textArea]}
              value={newDirection}
              onChangeText={setNewDirection}
              placeholder="Escribe una instrucción..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDirection}>
              <Plus size={20} color={colors.background} />
              <Text style={styles.addButtonText}>Añadir Instrucción</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isGeneratingMacros && styles.saveButtonDisabled]} 
            onPress={saveMeal}
            disabled={isGeneratingMacros}
          >
            {isGeneratingMacros ? (
              <>
                <ActivityIndicator color={colors.background} />
                <Text style={styles.saveButtonText}>Generando macros...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color={colors.background} />
                <Text style={styles.saveButtonText}>Crear Comida con IA</Text>
              </>
            )}
          </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </KeyboardAware>
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
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover' as const,
  },
  foodPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover' as const,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.primary,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 4,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addIngredientForm: {
    marginTop: 16,
    gap: 12,
  },
  ingredientInput: {
    marginBottom: 0,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neon,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.background,
  },
  directionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionNumberText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: colors.white,
  },
  directionText: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.background,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  imagePickerEmptyState: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
  },
  imagePickerEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  removeImageText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
