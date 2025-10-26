import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Student, Meal } from '@/types';
import { Search, Heart, Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function StudentMealsScreen() {
  const { currentUser, dietPlans } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    if (params.day !== undefined) {
      setSelectedDay(parseInt(params.day as string));
    }
  }, [params.day]);
  const [selectedType, setSelectedType] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteMeals, setFavoriteMeals] = useState<Set<string>>(new Set());

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Text style={styles.errorText}>No hay usuario activo</Text>
        </SafeAreaView>
      </View>
    );
  }

  const student = currentUser as Student;
  const studentDiet = dietPlans.find(plan => plan.studentId === student.id && (!plan.dayOfWeek || plan.dayOfWeek === selectedDay));
  const allMeals = studentDiet?.meals || [];

  const filteredMeals = allMeals.filter(meal => {
    const matchesType = selectedType === 'all' || meal.type === selectedType;
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleFavorite = (mealId: string) => {
    const newFavorites = new Set(favoriteMeals);
    if (newFavorites.has(mealId)) {
      newFavorites.delete(mealId);
    } else {
      newFavorites.add(mealId);
    }
    setFavoriteMeals(newFavorites);
  };

  const getMealTypeLabel = (type?: string) => {
    switch (type) {
      case 'breakfast': return 'Desayuno';
      case 'lunch': return 'Almuerzo';
      case 'dinner': return 'Cena';
      case 'snack': return 'Snack';
      default: return 'Comida';
    }
  };

  const handleMealPress = (meal: Meal) => {
    router.push({
      pathname: '/student/meal-detail',
      params: { mealId: meal.id }
    });
  };

  const nextDay = () => {
    setSelectedDay((selectedDay + 1) % 7);
  };

  const prevDay = () => {
    setSelectedDay((selectedDay - 1 + 7) % 7);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Mis Comidas</Text>
            </View>
            
            <View style={styles.daySelector}>
              <TouchableOpacity onPress={prevDay} style={styles.dayArrow}>
                <ChevronLeft size={24} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{daysOfWeek[selectedDay]}</Text>
                <Text style={styles.daySubtext}>Día {selectedDay + 1}</Text>
              </View>
              <TouchableOpacity onPress={nextDay} style={styles.dayArrow}>
                <ChevronRight size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
  
            <View style={styles.searchContainer} testID="meal-search">
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar comidas..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
  
          <View style={styles.filterTabs} testID="meal-segments">
            <TouchableOpacity
              style={[styles.filterTab, selectedType === 'all' && styles.filterTabActive]}
              onPress={() => setSelectedType('all')}
            >
              <Text style={[styles.filterTabText, selectedType === 'all' && styles.filterTabTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedType === 'breakfast' && styles.filterTabActive]}
              onPress={() => setSelectedType('breakfast')}
            >
              <Text style={[styles.filterTabText, selectedType === 'breakfast' && styles.filterTabTextActive]}>
                Desayuno
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedType === 'lunch' && styles.filterTabActive]}
              onPress={() => setSelectedType('lunch')}
            >
              <Text style={[styles.filterTabText, selectedType === 'lunch' && styles.filterTabTextActive]}>
                Almuerzo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedType === 'dinner' && styles.filterTabActive]}
              onPress={() => setSelectedType('dinner')}
            >
              <Text style={[styles.filterTabText, selectedType === 'dinner' && styles.filterTabTextActive]}>
                Cena
              </Text>
            </TouchableOpacity>
          </View>
  
          <View style={styles.mealsCount}>
            <Text style={styles.mealsCountText}>{filteredMeals.length} comidas</Text>
            {selectedType !== 'all' && (
              <View style={styles.caloriesBadge}>
                <Text style={styles.caloriesBadgeText}>Cal bajo a alto</Text>
              </View>
            )}
          </View>
          <View style={styles.grid}>
            {filteredMeals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={styles.tile}
                onPress={() => handleMealPress(meal)}
                activeOpacity={0.85}
                testID={`meal-${meal.id}`}
              >
                <Image
                  source={{ uri: meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' }}
                  style={styles.tileImage}
                />
                <View style={styles.tileOverlay}>
                  <Text style={styles.tileTitle} numberOfLines={1}>{meal.name}</Text>
                  <View style={styles.tileMetaRow}>
                    <View style={styles.metaItem}>
                      <Flame size={14} color={colors.white} />
                      <Text style={styles.tileMetaText}>{meal.foods.reduce((acc, food) => acc + food.calories, 0)} cal</Text>
                    </View>
                    {meal.prepTime && (
                      <View style={styles.metaItem}>
                        <Clock size={14} color={colors.white} />
                        <Text style={styles.tileMetaText}>{meal.prepTime}m</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {filteredMeals.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay comidas disponibles</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  daySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInfo: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  daySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  mealsCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mealsCountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  caloriesBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  caloriesBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover' as const,
  },
  tileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  tileMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileMetaText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700' as const,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600' as const,
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
});
