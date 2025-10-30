import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Plus, X, Trash2, Dumbbell, ImageUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { WorkoutPlan, Exercise, ExerciseSet, Trainer } from '@/types';
import { Edit2, PlayCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDefaultExerciseVideo } from '@/constants/exerciseVideos';

export default function TrainerWorkoutsScreen() {
  const { currentUser, workoutPlans, students, addWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [currentExercise, setCurrentExercise] = useState<string>('');
  const [currentExerciseImage, setCurrentExerciseImage] = useState<string>('');
  const [picking, setPicking] = useState<boolean>(false);
  const [currentSets, setCurrentSets] = useState<ExerciseSet[]>([]);
  const guessedVideo = getDefaultExerciseVideo(currentExercise);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  const trainer = currentUser as Trainer;
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleAddSet = () => {
    const newSet: ExerciseSet = {
      set: currentSets.length + 1,
      reps: 10,
      weight: 0,
      completed: false,
    };
    setCurrentSets([...currentSets, newSet]);
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const updated = [...currentSets];
    updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
    setCurrentSets(updated);
  };

  const pickExerciseImage = async () => {
    try {
      setPicking(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para continuar');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8 });
      if (!res.canceled && res.assets && res.assets[0]) {
        const a = res.assets[0];
        if (a.base64) setCurrentExerciseImage(`data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`);
        else if (a.uri) setCurrentExerciseImage(a.uri);
      }
    } catch (e) {
      console.log('pick image error', e);
    } finally {
      setPicking(false);
    }
  };

  const handleAddExercise = () => {
    if (!currentExercise.trim() || currentSets.length === 0) {
      Alert.alert('Error', 'Añade un nombre y al menos una serie');
      return;
    }

    const newExercise: Exercise = {
      id: `ex${Date.now()}`,
      name: currentExercise,
      sets: currentSets,
      imageUrl: currentExerciseImage || undefined,
      videoUrl: guessedVideo || undefined,
    };

    setExercises([...exercises, newExercise]);
    setCurrentExercise('');
    setCurrentSets([]);
    setCurrentExerciseImage('');
  };

  const handleSavePlan = async () => {
    if (!selectedStudent || !planName.trim() || exercises.length === 0 || selectedDays.length === 0) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (editingPlan) {
      await updateWorkoutPlan(editingPlan.id, {
        studentId: selectedStudent,
        name: planName,
        exercises,
        daysOfWeek: selectedDays,
      });
      Alert.alert('Éxito', 'Plan de entrenamiento actualizado');
    } else {
      const newPlan: WorkoutPlan = {
        id: `workout${Date.now()}`,
        studentId: selectedStudent,
        name: planName,
        exercises,
        daysOfWeek: selectedDays,
        createdAt: new Date().toISOString(),
      };
      await addWorkoutPlan(newPlan);
      Alert.alert('Éxito', 'Plan de entrenamiento creado');
    }

    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStudent('');
    setPlanName('');
    setExercises([]);
    setSelectedDays([]);
    setCurrentExercise('');
    setCurrentSets([]);
    setCurrentExerciseImage('');
    setEditingPlan(null);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setSelectedStudent(plan.studentId);
    setPlanName(plan.name);
    setExercises(plan.exercises);
    setSelectedDays(plan.daysOfWeek);
    setModalVisible(true);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Entrenamientos</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Plus color={colors.white} size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {workoutPlans.map((plan) => {
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
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.studentName}>{student?.name}</Text>
                  <View style={styles.daysContainer}>
                    {plan.daysOfWeek.map(day => (
                      <View key={day} style={styles.dayBadge}>
                        <Text style={styles.dayText}>{daysOfWeek[day]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.planHeaderActions}>
                <TouchableOpacity onPress={() => handleEditPlan(plan)} style={styles.actionButton}>
                  <Edit2 color={colors.primary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteWorkoutPlan(plan.id)} style={styles.actionButton}>
                  <Trash2 color={colors.error} size={20} />
                </TouchableOpacity>
              </View>
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {plan.exercises.map((ex) => (
                    <View key={ex.id} style={styles.expandedExercise}>
                      <Image 
                        source={{ uri: ex.imageUrl || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }} 
                        style={styles.expandedExerciseImage} 
                      />
                      <View style={styles.exerciseOverlay}>
                        <Text style={styles.expandedExerciseName}>{ex.name}</Text>
                      </View>
                      {ex.notes && (
                        <Text style={styles.expandedExerciseNotes}>{ex.notes}</Text>
                      )}
                      <View style={styles.expandedSets}>
                        {ex.sets.map((set, idx) => (
                          <View key={idx} style={styles.expandedSet}>
                            <Text style={styles.expandedSetText}>
                              Serie {set.set}: {set.reps} reps × {set.weight}kg
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {!isExpanded && (
                <View style={styles.exercisesList}>
                  {plan.exercises.map((ex) => (
                    <View key={ex.id} style={styles.exerciseItem}>
                      <Dumbbell color={colors.primary} size={16} />
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseSets}>{ex.sets.length} series</Text>
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
              <Text style={styles.modalTitle}>{editingPlan ? 'Editar Plan de Entrenamiento' : 'Nuevo Plan de Entrenamiento'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              <Text style={styles.label}>Nombre del Plan</Text>
              <TextInput
                style={styles.input}
                value={planName}
                onChangeText={setPlanName}
                placeholder="Ej: Rutina de Fuerza A"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Días de Entrenamiento</Text>
              <View style={styles.daysSelector}>
                {daysOfWeek.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayOption,
                      selectedDays.includes(index) && styles.dayOptionSelected,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[
                      styles.dayOptionText,
                      selectedDays.includes(index) && styles.dayOptionTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Ejercicios</Text>
              {exercises.map((ex, idx) => (
                <View key={ex.id} style={styles.addedExercise}>
                  <Text style={styles.addedExerciseName}>{ex.name}</Text>
                  <Text style={styles.addedExerciseSets}>{ex.sets.length} series</Text>
                  <TouchableOpacity onPress={() => setExercises(exercises.filter((_, i) => i !== idx))}>
                    <Trash2 color={colors.error} size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.exerciseForm}>
                <TextInput
                  style={styles.input}
                  value={currentExercise}
                  onChangeText={setCurrentExercise}
                  placeholder="Nombre del ejercicio"
                  placeholderTextColor={colors.textSecondary}
                />

                {currentSets.map((set, idx) => (
                  <View key={idx} style={styles.setRow}>
                    <Text style={styles.setText}>Serie {set.set}</Text>
                    <TextInput
                      style={styles.setInput}
                      value={set.reps.toString()}
                      onChangeText={(val) => handleUpdateSet(idx, 'reps', val)}
                      keyboardType="numeric"
                      placeholder="Reps"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                      style={styles.setInput}
                      value={set.weight.toString()}
                      onChangeText={(val) => handleUpdateSet(idx, 'weight', val)}
                      keyboardType="numeric"
                      placeholder="Kg"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                ))}

                <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
                  <Text style={styles.addSetText}>+ Añadir Serie</Text>
                </TouchableOpacity>

                {currentExerciseImage ? (
                  <Image source={{ uri: currentExerciseImage }} style={{ width: '100%', height: 140, borderRadius: 12, marginTop: 8 }} />
                ) : null}

                {guessedVideo ? (
                  <View style={styles.videoHint}>
                    <PlayCircle color={colors.primary} size={18} />
                    <Text style={styles.videoHintText}>Video predeterminado listo</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(guessedVideo)} testID="preview-default-video">
                      <Text style={styles.videoHintLink}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity style={styles.addExerciseButton} onPress={pickExerciseImage} disabled={picking}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ImageUp color={colors.primary} size={18} />
                    <Text style={styles.addExerciseText}>{picking ? 'Cargando...' : 'Añadir imagen (opcional)'}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
                  <Text style={styles.addExerciseText}>Añadir Ejercicio</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan}>
                <Text style={styles.saveButtonText}>Guardar Plan</Text>
              </TouchableOpacity>
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
  planName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
  },
  exerciseSets: {
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
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  studentOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  studentOptionTextSelected: {
    color: colors.primary,
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
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  dayOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dayOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  addedExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  addedExerciseName: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    fontWeight: '600' as const,
  },
  addedExerciseSets: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  exerciseForm: {
    marginTop: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setText: {
    fontSize: 14,
    color: colors.white,
    width: 60,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.white,
  },
  addSetButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  videoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoHintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  videoHintLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800' as const,
  },
  addExerciseButton: {
    backgroundColor: colors.primary + '20',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addExerciseText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  saveButton: {
    backgroundColor: colors.primary,
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
  expandedExercise: {
    marginBottom: 16,
  },
  expandedExerciseImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 12,
  },
  exerciseOverlay: {
    position: 'absolute' as const,
    bottom: 12,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  expandedExerciseName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  expandedExerciseNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  expandedSets: {
    gap: 6,
  },
  expandedSet: {
    backgroundColor: colors.cardLight,
    padding: 10,
    borderRadius: 8,
  },
  expandedSetText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600' as const,
  },
});
