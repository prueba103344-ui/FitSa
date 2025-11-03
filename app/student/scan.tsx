import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, ScanBarcode, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { generateText } from '@rork/toolkit-sdk';

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
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState<string>('');

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
          <View style={styles.placeholder} />
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
    const prompt = `Analiza el siguiente producto alimenticio y proporciona una puntuación de salud del 0 al 10 y una explicación detallada.

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

Por favor proporciona:
1. Una puntuación del 0 al 10 (donde 10 es muy saludable y 0 es muy poco saludable)
2. Una explicación clara y concisa de por qué tiene esa puntuación, considerando:
   - Calidad de los ingredientes
   - Balance de macronutrientes
   - Presencia de aditivos o ingredientes procesados
   - Contenido de azúcar, sodio, grasas saturadas
   - Valor nutricional general

Formato de respuesta (texto plano):
Puntuación: [número del 0-10]
Razón: [explicación detallada]`;

    try {
      const response = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      const scoreMatch = response.match(/Puntuación:\s*(\d+)/i);
      const reasonMatch = response.match(/Razón:\s*(.+)/is);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      const reason = reasonMatch ? reasonMatch[1].trim() : response;
      
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Producto</Text>
        <View style={styles.placeholder} />
      </View>

      {isScanning && !analysis && (
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

      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.analyzingText}>Analizando producto...</Text>
          <Text style={styles.analyzingSubtext}>
            Obteniendo información y calculando puntuación de salud
          </Text>
        </View>
      )}

      {error && !analysis && !isScanning && (
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetScan}>
            <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      )}

      {analysis && (
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

          <TouchableOpacity style={styles.scanAgainButton} onPress={resetScan}>
            <ScanBarcode size={20} color={colors.background} />
            <Text style={styles.scanAgainButtonText}>Escanear otro producto</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  placeholder: {
    width: 40,
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
  scanAgainButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanAgainButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.background,
  },
});
