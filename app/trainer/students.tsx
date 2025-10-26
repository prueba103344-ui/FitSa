import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { Plus, X, Trash2, Eye } from 'lucide-react-native';
import { Trainer, Student } from '@/types';

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, students, isLoading, addStudent, deleteStudent } = useApp();
  const trainer = currentUser?.role === 'trainer' ? (currentUser as Trainer) : null;
  const clients = useMemo<Student[]>(() => {
    if (trainer?.clients && Array.isArray(trainer.clients)) return trainer.clients;
    return students ?? [];
  }, [trainer?.clients, students]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentWeight, setStudentWeight] = useState<string>('');
  const [studentHeight, setStudentHeight] = useState<string>('');
  const [studentAge, setStudentAge] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [studentGoal, setStudentGoal] = useState<string>('');
  const [studentMedicalNotes, setStudentMedicalNotes] = useState<string>('');

  const handleAddStudent = async () => {
    if (!studentName.trim()) {
      Alert.alert('Error', 'Introduce el nombre del alumno');
      return;
    }

    if (!trainer) {
      Alert.alert('Acción no disponible', 'Debes iniciar sesión como entrenador para añadir alumnos.');
      return;
    }

    const newStudent: Student = {
      id: `student${Date.now()}`,
      name: studentName,
      role: 'student',
      trainerId: trainer.id,
      weight: studentWeight ? parseInt(studentWeight) : undefined,
      height: studentHeight ? parseInt(studentHeight) : undefined,
      age: studentAge ? parseInt(studentAge) : undefined,
      email: studentEmail || undefined,
      phone: studentPhone || undefined,
      goal: studentGoal || undefined,
      medicalNotes: studentMedicalNotes || undefined,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=400&h=400&fit=crop`,
    };

    await addStudent(newStudent);
    setModalVisible(false);
    resetForm();
    Alert.alert('Éxito', 'Alumno añadido correctamente');
  };

  const resetForm = () => {
    setStudentName('');
    setStudentWeight('');
    setStudentHeight('');
    setStudentAge('');
    setStudentEmail('');
    setStudentPhone('');
    setStudentGoal('');
    setStudentMedicalNotes('');
  };

  const handleDeleteStudent = async (studentId: string) => {
    Alert.alert(
      'Eliminar alumno',
      '¿Estás seguro de que quieres eliminar este alumno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteStudent(studentId);
            Alert.alert('Éxito', 'Alumno eliminado');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Alumnos</Text>
        {trainer ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} testID="addStudent">
            <Plus color={colors.white} size={24} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        testID="studentsScroll"
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando alumnos...</Text>
          </View>
        ) : (
          <>
            {clients.map((student) => (
              <View key={student.id} style={styles.clientCard} testID={`student-${student.id}`}>
                <Image
                  source={{ uri: student.avatar ?? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' }}
                  style={styles.clientAvatar}
                />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{student.name}</Text>
                  {student.age ? (
                    <Text style={styles.clientDetail}>{student.age} años</Text>
                  ) : null}
                  {student.goal ? (
                    <Text style={styles.clientGoal} numberOfLines={2}>{student.goal}</Text>
                  ) : null}
                  <View style={styles.clientStats}>
                    {typeof student.weight === 'number' ? (
                      <View style={styles.clientStat}>
                        <Text style={styles.clientStatValue}>{student.weight}kg</Text>
                        <Text style={styles.clientStatLabel}>Peso</Text>
                      </View>
                    ) : null}
                    {typeof student.height === 'number' ? (
                      <View style={styles.clientStat}>
                        <Text style={styles.clientStatValue}>{student.height}cm</Text>
                        <Text style={styles.clientStatLabel}>Altura</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.clientActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/trainer/student-profile?studentId=${student.id}` as any)}
                    testID={`view-${student.id}`}
                  >
                    <Eye size={18} color={colors.neon} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteStudent(student.id)}
                    testID={`delete-${student.id}`}
                  >
                    <Trash2 size={18} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {clients.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay alumnos registrados</Text>
                {trainer ? (
                  <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.emptyButtonText}>Añadir primer alumno</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Alumno</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={studentName}
                onChangeText={setStudentName}
                placeholder="Nombre del alumno"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                value={studentAge}
                onChangeText={setStudentAge}
                placeholder="Edad"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={studentWeight}
                onChangeText={setStudentWeight}
                placeholder="Peso en kg"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={studentHeight}
                onChangeText={setStudentHeight}
                placeholder="Altura en cm"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={studentEmail}
                onChangeText={setStudentEmail}
                placeholder="email@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={studentPhone}
                onChangeText={setStudentPhone}
                placeholder="+34 600 000 000"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Objetivo</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={studentGoal}
                onChangeText={setStudentGoal}
                placeholder="Ej: Ganar masa muscular, perder peso..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Notas Médicas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={studentMedicalNotes}
                onChangeText={setStudentMedicalNotes}
                placeholder="Lesiones, condiciones médicas, alergias..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleAddStudent}>
                <Text style={styles.saveButtonText}>Añadir Alumno</Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  clientCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  clientInfo: {
    flex: 1,
    gap: 6,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  clientDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientGoal: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  clientStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  clientStat: {
    gap: 2,
  },
  clientStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.neon,
  },
  clientStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  clientActions: {
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.neon,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.background,
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
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.neon,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: '700' as const,
  },
});
