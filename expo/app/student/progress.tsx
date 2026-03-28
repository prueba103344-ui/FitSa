import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import LineChart from '@/components/LineChart';
import { useApp } from '@/contexts/AppContext';
import { Student, ExerciseSet } from '@/types';
import { TrendingUp, Calendar, Flame, Dumbbell, X, ChevronDown, Plus } from 'lucide-react-native';
import { useState, useMemo } from 'react';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 80;
const GRAPH_HEIGHT = 200;

export default function StudentProgressScreen() {
  const { currentUser, progress, workoutPlans, updateProgress } = useApp();
  const student = currentUser as Student | null;
  
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [weightModalVisible, setWeightModalVisible] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>('');


  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
  }, []);

  const weekProgress = useMemo(() => {
    if (!student) return [];
    return last7Days.map(date => {
      const dayProgress = progress.find(p => p.date === date && p.studentId === student.id);
      return {
        date,
        workout: dayProgress?.workoutCompleted ? 100 : 0,
        diet: dayProgress ? (dayProgress.mealsCompleted / dayProgress.totalMeals) * 100 : 0,
      };
    });
  }, [last7Days, progress, student]);

  const avgWorkout = weekProgress.reduce((acc, day) => acc + day.workout, 0) / 7;
  const avgDiet = weekProgress.reduce((acc, day) => acc + day.diet, 0) / 7;
  const streak = weekProgress.filter(day => day.workout === 100 && day.diet === 100).length;

  const allExercises = useMemo(() => {
    if (!student) return [];
    const exercises = new Set<string>();
    workoutPlans
      .filter(plan => plan.studentId === student.id)
      .forEach(plan => {
        plan.exercises.forEach(ex => exercises.add(ex.name));
      });
    return Array.from(exercises);
  }, [workoutPlans, student]);

  const exerciseHistory = useMemo(() => {
    if (!selectedExercise || !student) return [];
    
    const history: { date: string; maxWeight: number; totalVolume: number; sets: ExerciseSet[] }[] = [];
    
    workoutPlans
      .filter(plan => plan.studentId === student.id)
      .forEach(plan => {
        plan.exercises.forEach(ex => {
          if (ex.name === selectedExercise) {
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length > 0) {
              const maxWeight = Math.max(...completedSets.map(s => s.actualWeight || s.weight));
              const totalVolume = completedSets.reduce((acc, s) => {
                const weight = s.actualWeight || s.weight;
                const reps = s.actualReps || s.reps;
                return acc + (weight * reps);
              }, 0);
              
              history.push({
                date: plan.createdAt.split('T')[0],
                maxWeight,
                totalVolume,
                sets: completedSets,
              });
            }
          }
        });
      });
    
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [selectedExercise, workoutPlans, student]);

  const today = new Date().toISOString().split('T')[0];

  const studentWeightHistory = useMemo(() => {
    if (!student) return [] as { date: string; weight: number }[];
    return progress
      .filter(p => p.studentId === student.id && typeof p.weight === 'number')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => ({ date: p.date, weight: p.weight as number }));
  }, [progress, student]);

  const addNewWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    const existing = progress.find(p => p.studentId === student?.id && p.date === today);
    if (!existing) {
      Alert.alert('No hay registro de hoy', 'Crea primero un registro de progreso hoy antes de añadir peso.');
      return;
    }
    updateProgress({ ...existing, weight });
    setNewWeight('');
    setWeightModalVisible(false);
  };

  if (!student || student.role !== 'student') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Progreso</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.weightSection}>
            <View style={styles.weightHeader}>
              <Text style={styles.weightTitle}>Peso corporal</Text>
              <TouchableOpacity style={styles.calendarButton}>
                <Calendar size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weightGraph}>
              {studentWeightHistory.length > 1 ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <LineChart
                    data={studentWeightHistory.slice(-12).map(p => ({ x: p.date, y: p.weight }))}
                    width={GRAPH_WIDTH}
                    height={GRAPH_HEIGHT}
                    color={colors.neon}
                    gradientFill={colors.neon}
                    testID="weight-line-chart"
                  />
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aún no hay datos de peso para mostrar</Text>
                </View>
              )}
            </View>



            <View style={styles.weightLogSection}>
              <Text style={styles.weightLogTitle}>Registro semanal de peso</Text>
              <TouchableOpacity 
                style={styles.addWeightButton}
                onPress={() => setWeightModalVisible(true)}
              >
                <Text style={styles.addWeightButtonText}>Añadir nuevo peso</Text>
                <Plus size={20} color={colors.primary} />
              </TouchableOpacity>
              {studentWeightHistory.slice(-4).reverse().map((entry, index) => (
                <View key={`${entry.date}-${index}`} style={styles.weightLogItem}>
                  <Text style={styles.weightLogWeek}>{new Date(entry.date).toLocaleDateString()}</Text>
                  <View style={styles.weightLogRight}>
                    <Text style={styles.weightLogValue}>{entry.weight}kg</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Flame size={32} color={colors.neon} />
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Días Racha</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp size={32} color={colors.neon} />
              <Text style={styles.statValue}>{Math.round(avgWorkout)}%</Text>
              <Text style={styles.statLabel}>Entreno Prom.</Text>
            </View>

            <View style={styles.statCard}>
              <Calendar size={32} color={colors.neon} />
              <Text style={styles.statValue}>{Math.round(avgDiet)}%</Text>
              <Text style={styles.statLabel}>Dieta Prom.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progreso por Ejercicio</Text>
              <Dumbbell size={24} color={colors.neon} />
            </View>
            
            <TouchableOpacity 
              style={styles.exerciseSelector}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.exerciseSelectorText}>
                {selectedExercise || 'Selecciona un ejercicio'}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedExercise && exerciseHistory.length > 0 && (
              <View style={styles.graphCard}>
                <View style={styles.graphTitleRow}>
                  <TrendingUp size={20} color={colors.neon} />
                  <Text style={styles.graphTitle}>Peso Máximo (kg)</Text>
                </View>
                <LineChart
                  data={exerciseHistory.map(h => ({ x: h.date, y: h.maxWeight }))}
                  width={GRAPH_WIDTH}
                  height={GRAPH_HEIGHT}
                  color={colors.neon}
                  gradientFill={colors.neon}
                  testID="exercise-max-line"
                />

                <View style={[styles.graphTitleRow, { marginTop: 32 }]}>
                  <Flame size={20} color={colors.accent} />
                  <Text style={styles.graphTitle}>Volumen Total (kg)</Text>
                </View>
                <LineChart
                  data={exerciseHistory.map(h => ({ x: h.date, y: h.totalVolume }))}
                  width={GRAPH_WIDTH}
                  height={GRAPH_HEIGHT}
                  color={colors.accent}
                  gradientFill={colors.accent}
                  testID="exercise-volume-line"
                />

              </View>
            )}

            {selectedExercise && exerciseHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No hay datos de progreso para este ejercicio
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos 7 Días</Text>
            {weekProgress.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
              const dayNumber = date.getDate();

              return (
                <View key={day.date} style={styles.dayCard}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dayNumber}>{dayNumber}</Text>
                  </View>

                  <View style={styles.progressBars}>
                    <View style={styles.progressBarContainer}>
                      <Text style={styles.progressBarLabel}>Entreno</Text>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${day.workout}%`, backgroundColor: colors.primary }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressBarValue}>{Math.round(day.workout)}%</Text>
                    </View>

                    <View style={styles.progressBarContainer}>
                      <Text style={styles.progressBarLabel}>Dieta</Text>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${day.diet}%`, backgroundColor: colors.accent }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressBarValue}>{Math.round(day.diet)}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {student.weight && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos Personales</Text>
              <View style={styles.personalCard}>
                <View style={styles.personalRow}>
                  <Text style={styles.personalLabel}>Peso</Text>
                  <Text style={styles.personalValue}>{student.weight} kg</Text>
                </View>
                {student.height && (
                  <View style={styles.personalRow}>
                    <Text style={styles.personalLabel}>Altura</Text>
                    <Text style={styles.personalValue}>{student.height} cm</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={weightModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Peso</Text>
              <TouchableOpacity onPress={() => setWeightModalVisible(false)}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="numeric"
              placeholder="Ej: 75"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={styles.modalSaveButton} onPress={addNewWeight}>
              <Text style={styles.modalSaveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona Ejercicio</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {allExercises.map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.exerciseOption,
                    selectedExercise === exercise && styles.exerciseOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedExercise(exercise);
                    setModalVisible(false);
                  }}
                >
                  <Dumbbell 
                    size={20} 
                    color={selectedExercise === exercise ? colors.neon : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.exerciseOptionText,
                    selectedExercise === exercise && styles.exerciseOptionTextSelected,
                  ]}>
                    {exercise}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weightSection: {
    marginBottom: 32,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weightTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.white,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  weightGraph: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative' as const,
  },
  weightGraphBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 12,
  },
  weightBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  weightBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weightBarFill: {
    width: '70%',
    borderRadius: 6,
    minHeight: 8,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  weightBarLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  goalLine: {
    position: 'absolute' as const,
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLineDash: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neon,
    opacity: 0.6,
  },
  goalLineText: {
    fontSize: 11,
    color: colors.neon,
    fontWeight: '700' as const,
  },
  weightStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  weightStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  weightStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightStatValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.primary,
  },
  weightLogSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightLogTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 16,
  },
  addWeightButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addWeightButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  weightLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  weightLogWeek: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600' as const,
  },
  weightLogRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightLogValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
  },
  exerciseSelector: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseSelectorText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600' as const,
  },
  graphCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  graphTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  graph: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: GRAPH_HEIGHT,
    gap: 8,
  },
  graphBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  graphBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  graphBarFill: {
    width: '80%',
    backgroundColor: colors.neon,
    borderRadius: 6,
    minHeight: 8,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  graphBarValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.neon,
  },
  graphBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  dayName: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.white,
  },
  progressBars: {
    flex: 1,
    gap: 12,
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.cardLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarValue: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600' as const,
  },
  personalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  personalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
    marginBottom: 8,
  },
  exerciseOptionSelected: {
    backgroundColor: colors.neon + '20',
    borderWidth: 2,
    borderColor: colors.neon,
  },
  exerciseOptionText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600' as const,
  },
  exerciseOptionTextSelected: {
    color: colors.neon,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
});
