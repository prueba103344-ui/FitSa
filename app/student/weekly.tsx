import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Student, WorkoutPlan, DietPlan } from '@/types';
import { Dumbbell, Apple, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function StudentWeeklyScreen() {
  const { currentUser, workoutPlans, dietPlans } = useApp();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [viewType, setViewType] = useState<'workout' | 'diet' | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<boolean>(true);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Calendar size={28} color={colors.neon} />
            <Text style={styles.title}>Plan Semanal</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>No hay usuario activo</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const student = currentUser as Student;
  const studentWorkouts = workoutPlans.filter(plan => plan.studentId === student.id);
  const studentDiet = dietPlans.find(plan => plan.studentId === student.id);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleDayPress = (dayIndex: number, type: 'workout' | 'diet') => {
    if (type === 'workout') {
      router.push({
        pathname: '/student/training',
        params: { day: dayIndex }
      } as any);
    } else {
      router.push({
        pathname: '/student/meals',
        params: { day: dayIndex }
      } as any);
    }
  };

  const getDayWorkouts = (dayIndex: number): WorkoutPlan[] => {
    return studentWorkouts.filter(plan => plan.daysOfWeek.includes(dayIndex));
  };

  const selectedDayWorkouts = selectedDay !== null ? getDayWorkouts(selectedDay) : [];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendario</Text>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setCalendarView(!calendarView)}
          >
            <Calendar size={20} color={colors.neon} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {calendarView && (
            <View style={styles.calendarSection}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
                  <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{monthName}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
                  <ChevronRight size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarGrid}>
                <View style={styles.weekDaysRow}>
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                    <Text key={index} style={styles.weekDayLabel}>{day}</Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <View key={`empty-${index}`} style={styles.emptyDay} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isToday = day === new Date().getDate() && 
                                   currentMonth.getMonth() === new Date().getMonth() &&
                                   currentMonth.getFullYear() === new Date().getFullYear();
                    const hasWorkout = Math.random() > 0.5;
                    
                    return (
                      <TouchableOpacity 
                        key={day} 
                        style={[
                          styles.calendarDay,
                          isToday && styles.calendarDayToday,
                        ]}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                        ]}>
                          {day}
                        </Text>
                        {hasWorkout && <View style={styles.calendarDayDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.todayPlansSection}>
                <Text style={styles.todayPlansTitle}>Planes de hoy</Text>
                {studentWorkouts.filter(plan => plan.daysOfWeek.includes(new Date().getDay())).slice(0, 2).map(workout => (
                  <TouchableOpacity key={workout.id} style={styles.todayPlanCard}>
                    <View style={styles.todayPlanLeft}>
                      <Text style={styles.todayPlanName}>{workout.name}</Text>
                      <View style={styles.todayPlanDetails}>
                        <Text style={styles.todayPlanDetail}>Duración: 30 minutos</Text>
                        <Text style={styles.todayPlanDetail}>Reps: {workout.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + s.reps, 0), 0)}</Text>
                        <Text style={styles.todayPlanDetail}>Series: {workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}</Text>
                        <Text style={styles.todayPlanDetail}>Ejercicios: {workout.exercises.length}</Text>
                      </View>
                    </View>
                    <Text style={styles.todayPlanTime}>Todo el día</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.weeklySection}>
          {daysOfWeek.map((day, index) => {
            const dayWorkouts = studentWorkouts.filter(plan => 
              plan.daysOfWeek.includes(index)
            );
            const hasWorkout = dayWorkouts.length > 0;
            const hasDiet = !!studentDiet;

            return (
              <View key={index} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day}</Text>
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.cardsRow}>
                  <TouchableOpacity 
                    style={[styles.card, styles.workoutCard, !hasWorkout && styles.cardDisabled]}
                    onPress={() => hasWorkout && handleDayPress(index, 'workout')}
                    activeOpacity={hasWorkout ? 0.7 : 1}
                  >
                    <View style={[styles.cardIcon, styles.workoutIcon]}>
                      <Dumbbell size={28} color={colors.neon} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.cardTitle}>Entrenamiento</Text>
                    {hasWorkout ? (
                      <>
                        <Text style={styles.cardSubtitle}>{dayWorkouts[0].name}</Text>
                        <Text style={styles.cardDetail}>{dayWorkouts[0].exercises.length} ejercicios</Text>
                      </>
                    ) : (
                      <Text style={styles.cardEmpty}>Descanso</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.card, styles.dietCard, !hasDiet && styles.cardDisabled]}
                    onPress={() => hasDiet && handleDayPress(index, 'diet')}
                    activeOpacity={hasDiet ? 0.7 : 1}
                  >
                    <View style={[styles.cardIcon, styles.dietIcon]}>
                      <Apple size={28} color={colors.accent} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.cardTitle}>Dieta</Text>
                    {hasDiet ? (
                      <>
                        <Text style={styles.cardSubtitle}>{studentDiet.totalCalories} kcal</Text>
                        <Text style={styles.cardDetail}>{studentDiet.meals.length} comidas</Text>
                      </>
                    ) : (
                      <Text style={styles.cardEmpty}>Sin plan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {viewType === 'workout' ? (
                  <Dumbbell size={24} color={colors.neon} />
                ) : (
                  <Apple size={24} color={colors.accent} />
                )}
                <Text style={styles.modalTitle}>
                  {selectedDay !== null ? daysOfWeek[selectedDay] : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {viewType === 'workout' && selectedDayWorkouts.length > 0 && (
                <View style={styles.modalSection}>
                  {selectedDayWorkouts.map(workout => (
                    <View key={workout.id} style={styles.modalWorkoutCard}>
                      <Text style={styles.modalWorkoutName}>{workout.name}</Text>
                      {workout.exercises.map(exercise => (
                        <View key={exercise.id} style={styles.modalExercise}>
                          {exercise.imageUrl && (
                            <Image 
                              source={{ uri: exercise.imageUrl }} 
                              style={styles.modalExerciseImage} 
                            />
                          )}
                          <Text style={styles.modalExerciseName}>{exercise.name}</Text>
                          {exercise.notes && (
                            <Text style={styles.modalExerciseNotes}>{exercise.notes}</Text>
                          )}
                          <View style={styles.modalSets}>
                            {exercise.sets.map((set, idx) => (
                              <View key={idx} style={styles.modalSet}>
                                <Text style={styles.modalSetText}>
                                  Serie {set.set}: {set.reps} reps × {set.weight}kg
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {viewType === 'diet' && studentDiet && (
                <View style={styles.modalSection}>
                  <View style={styles.modalDietCard}>
                    <View style={styles.modalMacrosRow}>
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{studentDiet.totalCalories}</Text>
                        <Text style={styles.modalMacroLabel}>kcal</Text>
                      </View>
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{studentDiet.totalProtein}g</Text>
                        <Text style={styles.modalMacroLabel}>Proteína</Text>
                      </View>
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{studentDiet.totalCarbs}g</Text>
                        <Text style={styles.modalMacroLabel}>Carbos</Text>
                      </View>
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{studentDiet.totalFat}g</Text>
                        <Text style={styles.modalMacroLabel}>Grasas</Text>
                      </View>
                    </View>
                    {studentDiet.meals.map(meal => (
                      <View key={meal.id} style={styles.modalMeal}>
                        <View style={styles.modalMealHeader}>
                          <Text style={styles.modalMealName}>{meal.name}</Text>
                          {meal.time && <Text style={styles.modalMealTime}>{meal.time}</Text>}
                        </View>
                        {meal.foods.map((food, idx) => (
                          <View key={idx} style={styles.modalFood}>
                            {food.imageUrl && (
                              <Image 
                                source={{ uri: food.imageUrl }} 
                                style={styles.modalFoodImage} 
                              />
                            )}
                            <View style={styles.modalFoodInfo}>
                              <Text style={styles.modalFoodName}>{food.name}</Text>
                              <Text style={styles.modalFoodDetails}>
                                {food.quantity && food.unit ? `${food.quantity}${food.unit} • ` : ''}
                                {food.calories}kcal • P:{food.protein}g • C:{food.carbs}g • G:{food.fat}g
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.white,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neon,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarSection: {
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    textTransform: 'capitalize' as const,
  },
  calendarGrid: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  calendarDayToday: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600' as const,
  },
  calendarDayTextToday: {
    color: colors.white,
    fontWeight: '900' as const,
  },
  calendarDayDot: {
    position: 'absolute' as const,
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  todayPlansSection: {
    marginBottom: 24,
  },
  todayPlansTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 16,
  },
  todayPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayPlanLeft: {
    marginBottom: 12,
  },
  todayPlanName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 12,
  },
  todayPlanDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  todayPlanDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  todayPlanTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  weeklySection: {
    marginBottom: 24,
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neon + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neon,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: colors.neon,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 2,
  },
  workoutCard: {
    backgroundColor: colors.neon + '10',
    borderColor: colors.neon,
  },
  dietCard: {
    backgroundColor: colors.accent + '10',
    borderColor: colors.accent,
  },
  cardDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIcon: {
    backgroundColor: colors.neon + '20',
  },
  dietIcon: {
    backgroundColor: colors.accent + '20',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cardDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.white,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalWorkoutCard: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  modalWorkoutName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.neon,
    marginBottom: 16,
  },
  modalExercise: {
    marginBottom: 20,
  },
  modalExerciseImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover' as const,
  },
  modalExerciseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 4,
  },
  modalExerciseNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 12,
  },
  modalSets: {
    gap: 8,
  },
  modalSet: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  modalSetText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600' as const,
  },
  modalDietCard: {
    backgroundColor: colors.cardLight,
    borderRadius: 16,
    padding: 16,
  },
  modalMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalMacroItem: {
    alignItems: 'center',
  },
  modalMacroValue: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: colors.accent,
  },
  modalMacroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalMeal: {
    marginBottom: 20,
  },
  modalMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalMealName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  modalMealTime: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  modalFood: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  modalFoodImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover' as const,
  },
  modalFoodInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalFoodName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 4,
  },
  modalFoodDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
