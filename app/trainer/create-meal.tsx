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
import { ArrowLeft, Plus, X, Trash2, Sparkles, ImageUp, ScanBarcode } from 'lucide-react-native';
import { Meal, Ingredient, Direction, Food } from '@/types';
import { Modal } from 'react-native';
import { generateObject } from '@rork/toolkit-sdk';
import KeyboardAware from '@/components/KeyboardAware';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { z } from 'zod';
import { findNutritionItem, NutritionItem } from '@/constants/nutrition';

 type MacroTotals = { calories: number; protein: number; carbs: number; fat: number };

export default function CreateMealScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { addDietPlan, dietPlans, updateDietPlan } = useApp();
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);

  const [mealName, setMealName] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [prepTime, setPrepTime] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [foodImageUrl, setFoodImageUrl] = useState<string>('');
  const [picking, setPicking] = useState<boolean>(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [isGeneratingMacros, setIsGeneratingMacros] = useState<boolean>(false);
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isScanAnalyzing, setIsScanAnalyzing] = useState<boolean>(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const [newIngredientName, setNewIngredientName] = useState<string>('');
  const [newIngredientQuantity, setNewIngredientQuantity] = useState<string>('');
  const [newIngredientUnit, setNewIngredientUnit] = useState<string>('g');

  const [newDirection, setNewDirection] = useState<string>('');

  const openScanModal = async () => {
    if (!cameraPermission) {
      return;
    }
    
    if (!cameraPermission.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear productos');
        return;
      }
    }
    
    setShowScanModal(true);
    setIsScanning(true);
    setIsScanAnalyzing(false);
  };

  const closeScanModal = () => {
    setShowScanModal(false);
    setIsScanning(true);
    setIsScanAnalyzing(false);
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isScanAnalyzing) return;
    
    console.log('Barcode scanned:', type, data);
    setIsScanning(false);
    setIsScanAnalyzing(true);
    
    try {
      const productInfo = await fetchProductInfo(data);
      
      if (!productInfo) {
        Alert.alert('Error', 'No se pudo obtener información del producto');
        setIsScanAnalyzing(false);
        setIsScanning(true);
        return;
      }

      setNewIngredientName(productInfo.name);
      setNewIngredientQuantity('100');
      setNewIngredientUnit('g');
      
      closeScanModal();
      Alert.alert('Producto escaneado', `${productInfo.name} añadido. Ajusta la cantidad y presiona añadir ingrediente.`);
    } catch (err: any) {
      console.error('Error analyzing product:', err);
      Alert.alert('Error', 'Error al escanear el producto');
      setIsScanAnalyzing(false);
      setIsScanning(true);
    }
  };

  const fetchProductInfo = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const product = data.product;
      return {
        name: product.product_name || 'Producto desconocido',
        ingredients: product.ingredients_text || 'No disponible',
        calories: product.nutriments?.['energy-kcal_100g'],
        protein: product.nutriments?.proteins_100g,
        carbs: product.nutriments?.carbohydrates_100g,
        fat: product.nutriments?.fat_100g,
      };
    } catch (err) {
      console.error('Error fetching product info:', err);
      return null;
    }
  };

  const addIngredient = () => {
    if (!newIngredientName || !newIngredientName.trim()) {
      Alert.alert('Error', 'El nombre del ingrediente es obligatorio');
      return;
    }
    if (!newIngredientQuantity || !newIngredientQuantity.trim()) {
      Alert.alert('Error', 'La cantidad del ingrediente es obligatoria');
      return;
    }
    const qty = parseFloat(newIngredientQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    const ingredient: Ingredient = {
      name: newIngredientName.trim(),
      quantity: qty,
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
      .map((dir, i) => ({ ...dir, step: i + 1 } as Direction));
    setDirections(updated);
  };

  function coerceNumber(n: unknown): number | null {
    const raw = String(n ?? '').trim();
    const normalized = raw.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    const parsed = typeof n === 'number' ? n : parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeUnit(u: string | undefined): 'g' | 'ml' | 'unidad' {
    const key = (u ?? '').trim().toLowerCase();
    if (['g', 'gramo', 'gramos'].includes(key)) return 'g';
    if (['ml', 'mililitro', 'mililitros'].includes(key)) return 'ml';
    if (['unidad', 'unidades', 'u', 'pz', 'piece', 'pieza', 'pieces'].includes(key)) return 'unidad';
    if (['taza', 'cup', 'cups'].includes(key)) return 'g';
    return 'g';
  }

  function scaleFromItem(item: NutritionItem, qty: number, unit: string): MacroTotals {
    const baseUnit = item.per.unit;
    const normalized = normalizeUnit(unit);
    let factor = 1;

    if (baseUnit === 'unidad' && normalized === 'unidad') {
      factor = qty / item.per.amount;
    } else if (baseUnit !== 'unidad' && normalized !== 'unidad') {
      factor = qty / item.per.amount;
    } else if (baseUnit === 'unidad' && normalized !== 'unidad') {
      const approxPerUnitG = 50;
      factor = qty / approxPerUnitG;
    } else if (baseUnit !== 'unidad' && normalized === 'unidad') {
      const approxUnitG = 50;
      factor = (qty * approxUnitG) / item.per.amount;
    }

    return {
      calories: item.calories * factor,
      protein: item.protein * factor,
      carbs: item.carbs * factor,
      fat: item.fat * factor,
    };
  }

  function estimateMacrosFallback(ings: Ingredient[]): MacroTotals {
    console.log('[Macros][Fallback] estimating with local DB for', ings);
    return ings.reduce<MacroTotals>((acc, ing) => {
      const qty = coerceNumber(ing.quantity) ?? 0;
      const unit = normalizeUnit(ing.unit);
      const item = findNutritionItem(ing.name.toLowerCase());
      if (item) {
        const scaled = scaleFromItem(item, qty, unit);
        return {
          calories: acc.calories + scaled.calories,
          protein: acc.protein + scaled.protein,
          carbs: acc.carbs + scaled.carbs,
          fat: acc.fat + scaled.fat,
        };
      }
      const key = ing.name.toLowerCase();
      let p = 0.15, c = 0.7, f = 0.15;
      if (/(pollo|carne|pavo|atun|atún|huevo|claras|queso|yogur|tofu|prote)/.test(key)) p = 0.7, c = 0.05, f = 0.25;
      if (/(aceite|mantequilla|nuez|aguacate|almendra|cacahuete|oliva)/.test(key)) p = 0.05, c = 0.05, f = 0.9;
      const grams = unit === 'unidad' ? qty * 50 : qty;
      const kcal = grams * (p * 4 + c * 4 + f * 9);
      return {
        calories: acc.calories + kcal,
        protein: acc.protein + grams * p,
        carbs: acc.carbs + grams * c,
        fat: acc.fat + grams * f,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  const generateMacrosWithAI = async (): Promise<MacroTotals | null> => {
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Añade ingredientes primero');
      return null;
    }

    const invalidIngredients = ingredients.filter((ing) => {
      const qty = coerceNumber(ing.quantity);
      return !ing.name || !ing.name.trim() || !qty || qty <= 0;
    });

    if (invalidIngredients.length > 0) {
      Alert.alert('Error', 'Todos los ingredientes deben tener nombre y cantidad válida');
      return null;
    }

    console.log('[Macros] Calculando para ingredientes:', ingredients);
    setIsGeneratingMacros(true);
    try {
      const known = ingredients.filter((ing) => !!findNutritionItem(ing.name.toLowerCase()));
      const unknown = ingredients.filter((ing) => !findNutritionItem(ing.name.toLowerCase()));

      const knownTotals = known.reduce<MacroTotals>((acc, ing) => {
        const item = findNutritionItem(ing.name.toLowerCase());
        const qty = coerceNumber(ing.quantity) ?? 0;
        const unit = ing.unit ?? 'g';
        if (!item || !Number.isFinite(qty) || qty <= 0) return acc;
        const scaled = scaleFromItem(item, qty, unit);
        return {
          calories: acc.calories + scaled.calories,
          protein: acc.protein + scaled.protein,
          carbs: acc.carbs + scaled.carbs,
          fat: acc.fat + scaled.fat,
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      let unknownTotals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      if (unknown.length > 0) {
        const ingredientsList = unknown.map((ing) => ({
          nombre: ing.name.trim(),
          cantidad: coerceNumber(ing.quantity) ?? 0,
          unidad: ing.unit ?? 'g',
        }));
        console.log('[Macros][IA] Enviando a IA:', ingredientsList);

        const schema = z.object({
          items: z.array(
            z.object({
              nombre: z.string(),
              calories: z.number().min(0),
              protein: z.number().min(0),
              carbs: z.number().min(0),
              fat: z.number().min(0),
            })
          ),
        });

        const ai = await generateObject({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    'Eres nutricionista experto. Tu tarea es calcular los macronutrientes EXACTOS para cada ingrediente usando la cantidad y unidad especificadas.\n\n' +
                    'REGLAS OBLIGATORIAS:\n' +
                    '1. NOMBRE y CANTIDAD son OBLIGATORIOS para el cálculo\n' +
                    '2. NUNCA normalices a 100g\n' +
                    '3. NUNCA uses porciones genéricas\n' +
                    '4. Calcula para la cantidad EXACTA proporcionada\n' +
                    '5. Si la unidad es "unidad" y no conoces el peso exacto, asume 1 unidad ≈ 50g\n' +
                    '6. Si la unidad es "ml", trata líquidos: agua/leche ~1g/ml, aceites ~0.92g/ml\n\n' +
                    'Formato de salida JSON: { items: [{ nombre, calories, protein, carbs, fat }] }\n' +
                    '- calories: kcal totales para ESA cantidad específica (NO por 100g)\n' +
                    '- protein: gramos totales de proteína para ESA cantidad (NO por 100g)\n' +
                    '- carbs: gramos totales de carbohidratos para ESA cantidad (NO por 100g)\n' +
                    '- fat: gramos totales de grasa para ESA cantidad (NO por 100g)\n\n' +
                    'EJEMPLO CORRECTO:\n' +
                    'Entrada: [{"nombre":"arroz","cantidad":80,"unidad":"g"}]\n' +
                    'Si arroz tiene 130 kcal y 28g carbs por 100g:\n' +
                    'Salida: {"items":[{"nombre":"arroz","calories":104,"protein":2.08,"carbs":22.4,"fat":0.24}]}\n' +
                    '(Calculado para 80g: 130*0.8=104 kcal, 28*0.8=22.4g carbs)\n\n' +
                    'EJEMPLO INCORRECTO que NO debes hacer:\n' +
                    'Salida: {"items":[{"nombre":"arroz","calories":130,...}]} <- ESTO ESTÁ MAL porque son valores por 100g'
                },
                { type: 'text', text: 'Ingredientes a analizar: ' + JSON.stringify(ingredientsList) },
              ],
            },
          ],
          schema,
        });

        console.log('[Macros][IA] Respuesta de IA:', ai.items);

        unknownTotals = ai.items.reduce<MacroTotals>(
          (acc, it) => {
            console.log(`[Macros][IA] Procesando ${it.nombre}: cal=${it.calories}, prot=${it.protein}g, carbs=${it.carbs}g, fat=${it.fat}g`);
            return {
              calories: acc.calories + (Number.isFinite(it.calories) ? it.calories : 0),
              protein: acc.protein + (Number.isFinite(it.protein) ? it.protein : 0),
              carbs: acc.carbs + (Number.isFinite(it.carbs) ? it.carbs : 0),
              fat: acc.fat + (Number.isFinite(it.fat) ? it.fat : 0),
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        unknownTotals = {
          calories: Math.max(0, Math.round(unknownTotals.calories)),
          protein: Math.max(0, Math.round(unknownTotals.protein)),
          carbs: Math.max(0, Math.round(unknownTotals.carbs)),
          fat: Math.max(0, Math.round(unknownTotals.fat)),
        };
      }

      const summed: MacroTotals = {
        calories: Math.round(knownTotals.calories + unknownTotals.calories),
        protein: Math.round(knownTotals.protein + unknownTotals.protein),
        carbs: Math.round(knownTotals.carbs + unknownTotals.carbs),
        fat: Math.round(knownTotals.fat + unknownTotals.fat),
      };

      console.log('[Macros] Totales conocidos (DB):', knownTotals);
      console.log('[Macros] Totales desconocidos (IA):', unknownTotals);
      console.log('[Macros] TOTAL FINAL:', summed);
      return summed;
    } catch (error) {
      console.error('Error generating macros, using fallback 100% local:', error);
      const fallback = estimateMacrosFallback(ingredients);
      const rounded: MacroTotals = {
        calories: Math.round(fallback.calories),
        protein: Math.round(fallback.protein),
        carbs: Math.round(fallback.carbs),
        fat: Math.round(fallback.fat),
      };
      Alert.alert(
        'Cálculo alternativo aplicado',
        'Hicimos el cálculo con la base local respetando las cantidades exactas.'
      );
      return rounded;
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

    const existingDiet = dietPlans.find(plan => 
      plan.studentId === studentId && plan.dayOfWeek === selectedDayOfWeek
    );

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
        name: `Plan ${daysOfWeek[selectedDayOfWeek]}`,
        dayOfWeek: selectedDayOfWeek,
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
                  <Text
                    style={[
                      styles.dayOptionText,
                      selectedDayOfWeek === index && styles.dayOptionTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
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
              <Text style={styles.label}>Nombre del ingrediente *</Text>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                value={newIngredientName}
                onChangeText={setNewIngredientName}
                placeholder="Ej: Pollo, arroz, aceite..."
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.label}>Cantidad y Unidad *</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={newIngredientQuantity}
                  onChangeText={setNewIngredientQuantity}
                  placeholder="Ej: 150"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={newIngredientUnit}
                  onChangeText={setNewIngredientUnit}
                  placeholder="g, ml, unidad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.addIngredientButtons}>
                <TouchableOpacity style={styles.scanIngredientButton} onPress={openScanModal}>
                  <ScanBarcode size={20} color={colors.white} />
                  <Text style={styles.scanIngredientButtonText}>Escanear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addButton, styles.addIngredientButton]} onPress={addIngredient}>
                  <Plus size={20} color={colors.background} />
                  <Text style={styles.addButtonText}>Añadir</Text>
                </TouchableOpacity>
              </View>
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
            testID="create-meal-ai-submit"
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

      <Modal
        visible={showScanModal}
        transparent
        animationType="slide"
        onRequestClose={closeScanModal}
      >
        <View style={styles.scanModalContainer}>
          <SafeAreaView edges={['top']} style={styles.scanModalSafeArea}>
            <View style={styles.scanModalHeader}>
              <Text style={styles.scanModalTitle}>Escanear Producto</Text>
              <TouchableOpacity onPress={closeScanModal} style={styles.scanModalCloseButton}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>

            {isScanning && !isScanAnalyzing && (
              <>
                <CameraView
                  style={styles.scanCamera}
                  facing="back"
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                  }}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanBox}>
                    <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
                    <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
                    <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
                    <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
                  </View>
                  <View style={styles.scanInstructionContainer}>
                    <ScanBarcode size={32} color={colors.white} />
                    <Text style={styles.scanInstruction}>
                      Centra el código de barras del producto
                    </Text>
                  </View>
                </View>
              </>
            )}

            {isScanAnalyzing && (
              <View style={styles.scanAnalyzingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.scanAnalyzingText}>Obteniendo información del producto...</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
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
    backgroundColor: (colors as any).primary + '20',
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
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dayOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: (colors as any).primary + '20',
  },
  dayOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dayOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  addIngredientButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scanIngredientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  scanIngredientButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addIngredientButton: {
    flex: 1,
  },
  scanModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scanModalSafeArea: {
    flex: 1,
  },
  scanModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scanModalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  scanModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCamera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanBox: {
    width: 280,
    height: 280,
    position: 'relative' as const,
  },
  scanCorner: {
    position: 'absolute' as const,
    width: 40,
    height: 40,
    borderColor: colors.accent,
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanInstructionContainer: {
    position: 'absolute' as const,
    bottom: 100,
    alignItems: 'center',
    gap: 12,
  },
  scanInstruction: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    textAlign: 'center' as const,
  },
  scanAnalyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  scanAnalyzingText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center' as const,
  },
});
