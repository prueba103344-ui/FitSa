import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, ScanBarcode, AlertCircle, History, Trash2, Clock, Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { generateText } from '@rork/toolkit-sdk';
import { useApp } from '@/contexts/AppContext';

interface ProductAnalysis {
  score: number;
  reason: string;
  productName?: string;
  ingredients?: string;
  macros?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanHistory, addScannedProduct, deleteScannedProduct, clearScanHistory, currentUser, dietPlans, updateDietPlan } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addQuantity, setAddQuantity] = useState<string>('100');
  const [addMealType, setAddMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'mid-morning'>('breakfast');
  const [isAddingToDiet, setIsAddingToDiet] = useState<boolean>(false);

  if (!permission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando cámara...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear Producto</Text>
          <View style={styles.historyButton} />
        </View>
        <View style={styles.permissionContainer}>
          <AlertCircle size={64} color={colors.accent} />
          <Text style={styles.permissionTitle}>Permiso de Cámara Necesario</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear códigos de barras
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isAnalyzing) return;
    
    console.log('Barcode scanned:', type, data);
    setIsScanning(false);
    setIsAnalyzing(true);
    setError('');
    
    try {
      const productInfo = await fetchProductInfo(data);
      
      if (!productInfo) {
        setError('No se pudo obtener información del producto. Intenta nuevamente.');
        setIsAnalyzing(false);
        return;
      }

      const aiAnalysis = await analyzeProduct(productInfo);
      setAnalysis(aiAnalysis);
      
      await addScannedProduct({
        barcode: data,
        productName: aiAnalysis.productName || 'Producto desconocido',
        score: aiAnalysis.score,
        reason: aiAnalysis.reason,
        ingredients: aiAnalysis.ingredients,
        macros: aiAnalysis.macros,
        studentId: '',
      });
    } catch (err: any) {
      console.error('Error analyzing product:', err);
      setError(err?.message || 'Error al analizar el producto');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchProductInfo = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 0) {
        throw new Error('Producto no encontrado en la base de datos');
      }
      
      const product = data.product;
      return {
        name: product.product_name || 'Producto desconocido',
        ingredients: product.ingredients_text || 'No disponible',
        calories: product.nutriments?.['energy-kcal_100g'],
        protein: product.nutriments?.proteins_100g,
        carbs: product.nutriments?.carbohydrates_100g,
        fat: product.nutriments?.fat_100g,
        sugar: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        sodium: product.nutriments?.sodium_100g,
        nutritionGrade: product.nutrition_grades,
      };
    } catch (err) {
      console.error('Error fetching product info:', err);
      return null;
    }
  };

  const analyzeProduct = async (productInfo: any): Promise<ProductAnalysis> => {
    const prompt = `Eres un nutricionista experto. Analiza este producto alimenticio y proporciona una puntuación de salud PRECISA del 0 al 10 basándote ESTRICTAMENTE en los valores nutricionales e ingredientes reales.

Nombre del producto: ${productInfo.name}
Ingredientes: ${productInfo.ingredients}
Información nutricional por 100g:
- Calorías: ${productInfo.calories || 'N/A'} kcal
- Proteínas: ${productInfo.protein || 'N/A'} g
- Carbohidratos: ${productInfo.carbs || 'N/A'} g
- Grasas: ${productInfo.fat || 'N/A'} g
- Azúcares: ${productInfo.sugar || 'N/A'} g
- Fibra: ${productInfo.fiber || 'N/A'} g
- Sodio: ${productInfo.sodium || 'N/A'} g
- Grado nutricional: ${productInfo.nutritionGrade || 'N/A'}

Criterios de puntuación ESTRICTOS:
- 9-10: Alimentos muy saludables (verduras, frutas frescas, legumbres, proteína magra limpia)
- 7-8: Alimentos saludables con procesamiento mínimo
- 5-6: Alimentos moderadamente procesados, pero aceptables
- 3-4: Alimentos altamente procesados, alto en azúcar/sodio/grasa saturada
- 0-2: Alimentos muy poco saludables (comida chatarra, ultraprocesados, alto en aditivos)

Penaliza fuertemente:
- Alto contenido de azúcar (>15g/100g): -2 puntos
- Alto contenido de sodio (>1g/100g): -2 puntos
- Grasas saturadas altas: -1.5 puntos
- Ingredientes ultraprocesados, aditivos artificiales: -2 puntos
- Bajo valor nutricional (pocas proteínas, fibra): -1 punto

Premie:
- Alto contenido de proteína (>10g/100g): +1.5 puntos
- Alto contenido de fibra (>5g/100g): +1 punto
- Ingredientes naturales y simples: +2 puntos
- Bajo en azúcar (<5g/100g): +1 punto

NO des puntuaciones genéricas de 5/10. Sé ESPECÍFICO y CRÍTICO basándote en los valores reales.

Formato de respuesta:
Puntuación: [número exacto del 0-10]
Razón: [Explicación detallada con emojis relevantes, sin usar asteriscos. Usa emojis para hacer el análisis más visual y amigable]`;

    try {
      const response = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      const scoreMatch = response.match(/Puntuación:\s*(\d+(?:\.\d+)?)/i);
      const reasonMatch = response.match(/Razón:\s*(.+)/is);
      
      let score = 5;
      if (scoreMatch) {
        score = Math.round(parseFloat(scoreMatch[1]));
      }
      
      let reason = reasonMatch ? reasonMatch[1].trim() : response;
      
      reason = reason.replace(/\*/g, '');
      reason = reason.replace(/Razón:\s*/i, '');
      
      return {
        score: Math.min(10, Math.max(0, score)),
        reason,
        productName: productInfo.name,
        ingredients: productInfo.ingredients,
        macros: {
          calories: productInfo.calories,
          protein: productInfo.protein,
          carbs: productInfo.carbs,
          fat: productInfo.fat,
        },
      };
    } catch (err) {
      console.error('Error analyzing with AI:', err);
      return {
        score: 5,
        reason: 'No se pudo analizar el producto con IA. Por favor intenta nuevamente.',
        productName: productInfo.name,
      };
    }
  };

  const resetScan = () => {
    setIsScanning(true);
    setAnalysis(null);
    setError('');
    setShowHistory(false);
  };

  const handleDeleteHistory = (productId: string) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto del historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteScannedProduct(productId),
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Estás seguro de que quieres eliminar todo el historial de escaneos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => clearScanHistory(),
        },
      ]
    );
  };

  const viewHistoryItem = (product: any) => {
    setAnalysis({
      score: product.score,
      reason: product.reason,
      productName: product.productName,
      ingredients: product.ingredients,
      macros: product.macros,
    });
    setShowHistory(false);
    setIsScanning(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4ade80';
    if (score >= 6) return '#fbbf24';
    if (score >= 4) return '#fb923c';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Muy Saludable';
    if (score >= 6) return 'Saludable';
    if (score >= 4) return 'Regular';
    return 'Poco Saludable';
  };

  const openAddToDietModal = () => {
    setShowAddModal(true);
    setAddQuantity('100');
    setAddMealType('breakfast');
  };

  const addProductToDiet = async () => {
    if (!analysis || !currentUser || currentUser.role !== 'student') {
      Alert.alert('Error', 'No se puede añadir el producto');
      return;
    }

    const quantity = parseFloat(addQuantity);
    if (!quantity || quantity <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      return;
    }

    setIsAddingToDiet(true);

    try {
      const multiplier = quantity / 100;
      const newFood = {
        name: analysis.productName || 'Producto',
        calories: Math.round((analysis.macros?.calories || 0) * multiplier),
        protein: parseFloat(((analysis.macros?.protein || 0) * multiplier).toFixed(1)),
        carbs: parseFloat(((analysis.macros?.carbs || 0) * multiplier).toFixed(1)),
        fat: parseFloat(((analysis.macros?.fat || 0) * multiplier).toFixed(1)),
        quantity,
        unit: 'g' as const,
        plannedQuantity: quantity,
        plannedCalories: Math.round((analysis.macros?.calories || 0) * multiplier),
        plannedProtein: parseFloat(((analysis.macros?.protein || 0) * multiplier).toFixed(1)),
        plannedCarbs: parseFloat(((analysis.macros?.carbs || 0) * multiplier).toFixed(1)),
        plannedFat: parseFloat(((analysis.macros?.fat || 0) * multiplier).toFixed(1)),
      };

      console.log('[Scan] Looking for diet for student:', currentUser.id);
      console.log('[Scan] Available diets:', dietPlans.length);
      
      const studentDiet = dietPlans.find(d => d.studentId === currentUser.id);
      
      if (!studentDiet) {
        Alert.alert('Error', 'No hay plan de dieta asignado');
        setIsAddingToDiet(false);
        return;
      }

      console.log('[Scan] Found diet:', studentDiet.id);

      const mealTypeLabels: Record<typeof addMealType, string> = {
        breakfast: 'Desayuno',
        'mid-morning': 'Almuerzo',
        lunch: 'Comida',
        snack: 'Merienda',
        dinner: 'Cena',
      };

      const updatedMeals = [...studentDiet.meals];
      const existingMealIndex = updatedMeals.findIndex(m => m.type === addMealType);

      if (existingMealIndex >= 0) {
        updatedMeals[existingMealIndex] = {
          ...updatedMeals[existingMealIndex],
          foods: [...updatedMeals[existingMealIndex].foods, newFood],
        };
      } else {
        const mealId = `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newMeal = {
          id: mealId,
          name: mealTypeLabels[addMealType],
          type: addMealType,
          foods: [newFood],
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        };
        updatedMeals.push(newMeal);
      }

      console.log('[Scan] Updating diet with', updatedMeals.length, 'meals');

      await updateDietPlan(studentDiet.id, {
        meals: updatedMeals,
        totalCalories: studentDiet.totalCalories + newFood.calories,
        totalProtein: studentDiet.totalProtein + newFood.protein,
        totalCarbs: studentDiet.totalCarbs + newFood.carbs,
        totalFat: studentDiet.totalFat + newFood.fat,
      });

      console.log('[Scan] Diet updated successfully');

      setShowAddModal(false);
      Alert.alert('¡Éxito!', 'Producto añadido a tu dieta');
    } catch (error) {
      console.error('Error adding product to diet:', error);
      Alert.alert('Error', 'No se pudo añadir el producto a tu dieta');
    } finally {
      setIsAddingToDiet(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Producto</Text>
        <TouchableOpacity 
          onPress={() => setShowHistory(!showHistory)} 
          style={styles.historyButton}
        >
          <History color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {showHistory && (
        <ScrollView 
          style={styles.historyContainer}
          contentContainerStyle={[styles.historyContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Historial de Escaneos</Text>
            {scanHistory.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearHistoryText}>Limpiar todo</Text>
              </TouchableOpacity>
            )}
          </View>

          {scanHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <History size={64} color={colors.textSecondary} />
              <Text style={styles.emptyHistoryTitle}>Sin historial</Text>
              <Text style={styles.emptyHistoryText}>
                Escanea productos para ver tu historial aquí
              </Text>
            </View>
          ) : (
            scanHistory
              .slice()
              .reverse()
              .map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.historyItem}
                  onPress={() => viewHistoryItem(product)}
                >
                  <View style={styles.historyItemLeft}>
                    <View style={[styles.historyScoreBadge, { backgroundColor: getScoreColor(product.score) }]}>
                      <Text style={styles.historyScoreText}>{product.score}</Text>
                    </View>
                    <View style={styles.historyItemInfo}>
                      <Text style={styles.historyItemName} numberOfLines={1}>
                        {product.productName}
                      </Text>
                      <View style={styles.historyItemMeta}>
                        <Clock size={12} color={colors.textSecondary} />
                        <Text style={styles.historyItemDate}>
                          {formatDate(product.scannedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteHistory(product.id)}
                    style={styles.deleteHistoryButton}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
          )}
        </ScrollView>
      )}

      {!showHistory && isScanning && !analysis && (
        <>
          <CameraView
            style={styles.camera}
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

      {!showHistory && isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.analyzingText}>Analizando producto...</Text>
          <Text style={styles.analyzingSubtext}>
            Obteniendo información y calculando puntuación de salud
          </Text>
        </View>
      )}

      {!showHistory && error && !analysis && !isScanning && (
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetScan}>
            <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showHistory && analysis && (
        <ScrollView 
          style={styles.resultsContainer}
          contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreCard}>
            <Text style={styles.productName}>{analysis.productName || 'Producto Analizado'}</Text>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(analysis.score) }]}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysis.score) }]}>
                {analysis.score}
              </Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(analysis.score) }]}>
              <Text style={styles.scoreBadgeText}>{getScoreLabel(analysis.score)}</Text>
            </View>
          </View>

          {analysis.macros && (
            <View style={styles.macrosCard}>
              <Text style={styles.macrosTitle}>Información Nutricional (por 100g)</Text>
              <View style={styles.macrosGrid}>
                {analysis.macros.calories !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(analysis.macros.calories)}</Text>
                    <Text style={styles.macroLabel}>kcal</Text>
                  </View>
                )}
                {analysis.macros.protein !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{analysis.macros.protein.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Proteína</Text>
                  </View>
                )}
                {analysis.macros.carbs !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{analysis.macros.carbs.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Carbos</Text>
                  </View>
                )}
                {analysis.macros.fat !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{analysis.macros.fat.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Grasas</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Análisis Detallado</Text>
            <Text style={styles.reasonText}>{analysis.reason}</Text>
          </View>

          {analysis.ingredients && analysis.ingredients !== 'No disponible' && (
            <View style={styles.ingredientsCard}>
              <Text style={styles.ingredientsTitle}>Ingredientes</Text>
              <Text style={styles.ingredientsText}>{analysis.ingredients}</Text>
            </View>
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.addToDietButton} 
              onPress={openAddToDietModal}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.background} />
              <Text style={styles.addToDietButtonText}>Añadir a mi Dieta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.scanAgainButton} onPress={resetScan}>
              <ScanBarcode size={20} color={colors.white} />
              <Text style={styles.scanAgainButtonText}>Escanear otro producto</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir a Dieta</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalProductName}>{analysis?.productName}</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Cantidad (gramos)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="100"
                placeholderTextColor={colors.textSecondary}
                value={addQuantity}
                onChangeText={setAddQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Tipo de Comida</Text>
              <View style={styles.mealTypesContainer}>
                {[
                  { value: 'breakfast', label: '🌅 Desayuno' },
                  { value: 'mid-morning', label: '🍎 Almuerzo' },
                  { value: 'lunch', label: '🍽️ Comida' },
                  { value: 'snack', label: '🥤 Merienda' },
                  { value: 'dinner', label: '🌙 Cena' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.mealTypeBtn,
                      addMealType === type.value && styles.mealTypeBtnActive,
                    ]}
                    onPress={() => setAddMealType(type.value as typeof addMealType)}
                  >
                    <Text
                      style={[
                        styles.mealTypeBtnText,
                        addMealType === type.value && styles.mealTypeBtnTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalAddButton}
              onPress={addProductToDiet}
              disabled={isAddingToDiet}
              activeOpacity={0.8}
            >
              {isAddingToDiet ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Plus size={20} color={colors.background} />
                  <Text style={styles.modalAddButtonText}>Añadir a Dieta</Text>
                </>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
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
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center' as const,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  camera: {
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
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  analyzingText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center' as const,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.white,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
    gap: 20,
  },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center' as const,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardLight,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '900' as const,
    lineHeight: 64,
  },
  scoreMax: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  scoreBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  macrosCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reasonCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  reasonText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  ingredientsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  ingredientsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: 12,
  },
  addToDietButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addToDietButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
  scanAgainButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanAgainButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  historyContainer: {
    flex: 1,
  },
  historyContent: {
    padding: 20,
    gap: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.white,
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.error,
  },
  emptyHistoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyHistoryTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyScoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScoreText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: colors.background,
  },
  historyItemInfo: {
    flex: 1,
    gap: 4,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  historyItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteHistoryButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.white,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  modalSection: {
    gap: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  modalInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypesContainer: {
    gap: 10,
  },
  mealTypeBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeBtnActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  mealTypeBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  mealTypeBtnTextActive: {
    color: colors.primary,
  },
  modalAddButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalAddButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: colors.background,
  },
});
