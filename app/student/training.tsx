import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Student } from '@/types';
import { ChevronLeft, ChevronRight, TrendingUp, ChevronDown, ChevronUp, Check, Sparkles, Edit2, X } from 'lucide-react-native';

export default function StudentTrainingScreen() {
  const { currentUser, workoutPlans, updateWorkoutPlan } = useApp();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [showCompletionAnimation, setShowCompletionAnimation] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');
  const animationScale = useMemo(() => new Animated.Value(0), []);
  const [editingSet, setEditingSet] = useState<{workoutId: string, exerciseId: string, setIndex: number} | null>(null);
  const [editReps, setEditReps] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');

  useEffect(() => {
    if (params.day !== undefined) {
      setSelectedDay(parseInt(params.day as string));
    }
  }, [params.day]);

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={styles.container}>
        <View style={styles.safeArea}>
          <Text style={styles.errorText}>No hay usuario activo</Text>
        </View>
      </View>
    );
  }

  const student = currentUser as Student;
  const todayWorkouts = workoutPlans.filter(
    plan => plan.studentId === student.id && plan.daysOfWeek.includes(selectedDay)
  );

  const totalSets = todayWorkouts.reduce(
    (acc, plan) => acc + plan.exercises.reduce((a, ex) => a + ex.sets.length, 0),
    0
  );
  const completedSets = todayWorkouts.reduce(
    (acc, plan) =>
      acc +
      plan.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0),
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const nextDay = () => {
    setSelectedDay((selectedDay + 1) % 7);
  };

  const prevDay = () => {
    setSelectedDay((selectedDay - 1 + 7) % 7);
  };

  const getCurrentWeekDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        dayOfWeek: i,
        dayNumber: date.getDate(),
        label: daysShort[i],
      };
    });
  };

  const weekDays = getCurrentWeekDays();

  const toggleExercise = (exerciseId: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
  };

  const showAnimation = (message: string, isBig: boolean = false) => {
    setCompletionMessage(message);
    setShowCompletionAnimation(true);
    
    animationScale.setValue(0);
    
    Animated.sequence([
      Animated.spring(animationScale, {
        toValue: isBig ? 1.5 : 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(animationScale, {
        toValue: 0,
        duration: 400,
        delay: isBig ? 1000 : 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowCompletionAnimation(false);
    });
  };

  const toggleSetComplete = async (workoutId: string, exerciseId: string, setIndex: number) => {
    const workout = todayWorkouts.find(w => w.id === workoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, idx) => 
      idx === setIndex ? { ...set, completed: !set.completed } : set
    );

    const allSetsCompleted = updatedSets.every(s => s.completed);
    const allExercisesCompleted = workout.exercises.every(ex => 
      ex.id === exerciseId ? allSetsCompleted : ex.sets.every(s => s.completed)
    );

    const updatedExercises = workout.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, sets: updatedSets } : ex
    );

    await updateWorkoutPlan(workoutId, { exercises: updatedExercises });

    if (allSetsCompleted && !exercise.sets.every(s => s.completed)) {
      showAnimation('🎯 ¡Ejercicio completado!', false);
    } else if (allExercisesCompleted) {
      showAnimation('🔥 ¡Entrenamiento completado!', true);
    } else {
      showAnimation('✓ Serie completada', false);
    }
  };

  const openEditSet = (workoutId: string, exerciseId: string, setIndex: number) => {
    const workout = todayWorkouts.find(w => w.id === workoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const set = exercise.sets[setIndex];
    setEditingSet({ workoutId, exerciseId, setIndex });
    setEditReps((set.actualReps ?? set.reps).toString());
    setEditWeight((set.actualWeight ?? set.weight).toString());
  };

  const saveEditSet = async () => {
    if (!editingSet) return;

    const { workoutId, exerciseId, setIndex } = editingSet;
    const workout = todayWorkouts.find(w => w.id === workoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const repsValue = parseInt(editReps) || exercise.sets[setIndex].reps;
    const weightValue = parseFloat(editWeight) || exercise.sets[setIndex].weight;

    const updatedSets = exercise.sets.map((set, idx) => 
      idx === setIndex ? { 
        ...set, 
        actualReps: repsValue,
        actualWeight: weightValue
      } : set
    );

    const updatedExercises = workout.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, sets: updatedSets } : ex
    );

    await updateWorkoutPlan(workoutId, { exercises: updatedExercises });
    setEditingSet(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Plan de Entrenamiento</Text>
            <Text style={styles.subtitle}>Selecciona un día para ver tu rutina</Text>
          </View>

          <View style={styles.weekSelector}>
            <TouchableOpacity onPress={prevDay} style={styles.arrowButton}>
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContent}
            >
              {weekDays.map((day) => {
                const isSelected = selectedDay === day.dayOfWeek;
                const isToday = new Date().getDay() === day.dayOfWeek;
                return (
                  <TouchableOpacity
                    key={day.dayOfWeek}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                    ]}
                    onPress={() => setSelectedDay(day.dayOfWeek)}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        isSelected && styles.dayLabelSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                    {isToday && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={nextDay} style={styles.arrowButton}>
              <ChevronRight size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Progreso del día</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressCircleContainer}>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressInfo}>
                <View style={styles.progressStat}>
                  <TrendingUp size={16} color={colors.neon} />
                  <Text style={styles.progressStatText}>{completedSets}/{totalSets} series</Text>
                </View>
              </View>
            </View>
          </View>

          {todayWorkouts.length === 0 ? (
            <View style={styles.restDay}>
              <Text style={styles.restDayTitle}>Día de Descanso</Text>
              <Text style={styles.restDayText}>
                No tienes entrenamientos programados para {daysOfWeek[selectedDay].toLowerCase()}
              </Text>
            </View>
          ) : (
            todayWorkouts.map((workout) => (
              <View key={workout.id} style={styles.workoutSection}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                {workout.exercises.map((exercise) => {
                  const isExpanded = expandedExercises.has(exercise.id);
                  return (
                    <View key={exercise.id} style={styles.exerciseCard}>
                      <Image
                        source={{
                          uri: exercise.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
                        }}
                        style={styles.exerciseImage}
                      />
                      <View style={styles.exerciseOverlay}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets.length} series
                        </Text>
                      </View>
                      
                      <View style={styles.exerciseContent}>
                        <TouchableOpacity 
                          style={styles.expandButton}
                          onPress={() => toggleExercise(exercise.id)}
                        >
                          <Text style={styles.expandButtonText}>
                            {isExpanded ? 'Ocultar series' : 'Ver series'}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={20} color={colors.neon} />
                          ) : (
                            <ChevronDown size={20} color={colors.neon} />
                          )}
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.setsDetail}>
                            {exercise.sets.map((set, idx) => {
                              const hasActualValues = set.actualReps !== undefined || set.actualWeight !== undefined;
                              const isDifferent = (set.actualReps && set.actualReps !== set.reps) || (set.actualWeight && set.actualWeight !== set.weight);
                              
                              return (
                                <View key={idx} style={[
                                  styles.setRow,
                                  set.completed && styles.setRowCompleted,
                                ]}>
                                  <TouchableOpacity
                                    style={styles.setRowLeft}
                                    onPress={() => toggleSetComplete(workout.id, exercise.id, idx)}
                                  >
                                    <View style={[
                                      styles.checkbox,
                                      set.completed && styles.checkboxCompleted,
                                    ]}>
                                      {set.completed && <Check size={16} color={colors.background} />}
                                    </View>
                                    <View>
                                      <Text style={[
                                        styles.setRowText,
                                        set.completed && styles.setRowTextCompleted,
                                      ]}>
                                        Serie {set.set}
                                      </Text>
                                      {hasActualValues && (
                                        <Text style={styles.plannedLabel}>Pautado: {set.reps} reps • {set.weight} kg</Text>
                                      )}
                                    </View>
                                  </TouchableOpacity>
                                  <View style={styles.setRowRight}>
                                    <View style={styles.valuesContainer}>
                                      <Text style={[
                                        styles.setRowValue,
                                        set.completed && styles.setRowValueCompleted,
                                        hasActualValues && isDifferent && styles.setRowValueModified,
                                      ]}>
                                        {set.actualReps ?? set.reps} reps
                                      </Text>
                                      <Text style={styles.setRowDivider}>•</Text>
                                      <Text style={[
                                        styles.setRowValue,
                                        set.completed && styles.setRowValueCompleted,
                                        hasActualValues && isDifferent && styles.setRowValueModified,
                                      ]}>
                                        {set.actualWeight ?? set.weight} kg
                                      </Text>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.editButton}
                                      onPress={() => openEditSet(workout.id, exercise.id, idx)}
                                    >
                                      <Edit2 size={18} color={colors.neon} />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {exercise.notes && (
                        <View style={styles.exerciseNotes}>
                          <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {showCompletionAnimation && (
          <View style={styles.animationOverlay}>
            <Animated.View style={[
              styles.animationContent,
              { transform: [{ scale: animationScale }] }
            ]}>
              <Sparkles size={48} color={colors.neon} />
              <Text style={styles.animationText}>{completionMessage}</Text>
            </Animated.View>
          </View>
        )}

        <Modal
          visible={editingSet !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingSet(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Serie</Text>
                <TouchableOpacity onPress={() => setEditingSet(null)} style={styles.closeButton}>
                  <X size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalDescription}>
                Registra lo que realmente hiciste en esta serie
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repeticiones</Text>
                <TextInput
                  style={styles.input}
                  value={editReps}
                  onChangeText={setEditReps}
                  keyboardType="number-pad"
                  placeholder="Ej: 10"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 50"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setEditingSet(null)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={saveEditSet}
                >
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  daysScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  dayButton: {
    width: 60,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative' as const,
  },
  dayButtonSelected: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: colors.background,
    fontWeight: '800' as const,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.white,
  },
  dayNumberSelected: {
    color: colors.background,
  },
  todayDot: {
    position: 'absolute' as const,
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressCard: {
    backgroundColor: 'rgba(120, 40, 200, 0.2)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(120, 40, 200, 0.3)',
  },
  progressTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressCircleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.neon,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.neon,
  },
  progressInfo: {
    flex: 1,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressStatText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  restDay: {
    marginHorizontal: 20,
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  workoutSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover' as const,
  },
  exerciseOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.neon,
  },
  exerciseContent: {
    padding: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  expandButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.neon,
  },
  setsDetail: {
    gap: 10,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  setRowCompleted: {
    backgroundColor: colors.neon + '20',
    borderColor: colors.neon,
  },
  setRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  setRowText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  setRowTextCompleted: {
    color: colors.neon,
  },
  setRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setRowValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  setRowValueCompleted: {
    color: colors.neon,
  },
  setRowDivider: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  exerciseNotes: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseNotesText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  animationOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animationContent: {
    backgroundColor: colors.card,
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  animationText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.neon,
    textAlign: 'center' as const,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plannedLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  setRowValueModified: {
    color: '#FFB800',
    fontWeight: '900' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.cardLight,
  },
  modalButtonSave: {
    backgroundColor: colors.neon,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: colors.background,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: colors.white,
  },
});
