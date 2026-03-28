import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Trainer } from '@/types';
import CircularProgress from '@/components/CircularProgress';

export default function TrainerProgressScreen() {
  const { currentUser, progress, students } = useApp();
  const trainer = currentUser as Trainer;
  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Progreso</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {trainer?.clients.map((student) => {
          const studentProgress = progress.find(
            p => p.studentId === student.id && p.date === today
          );

          const workoutProgress = studentProgress?.workoutCompleted ? 100 : 0;
          const dietProgress = studentProgress
            ? (studentProgress.mealsCompleted / studentProgress.totalMeals) * 100
            : 0;

          return (
            <View key={student.id} style={styles.studentCard}>
              <Text style={styles.studentName}>{student.name}</Text>
              
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <CircularProgress
                    progress={workoutProgress}
                    size={80}
                    strokeWidth={8}
                    color={colors.primary}
                  />
                  <Text style={styles.progressLabel}>Entrenamiento</Text>
                </View>

                <View style={styles.progressItem}>
                  <CircularProgress
                    progress={dietProgress}
                    size={80}
                    strokeWidth={8}
                    color={colors.accent}
                  />
                  <Text style={styles.progressLabel}>Dieta</Text>
                </View>
              </View>

              {studentProgress?.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notas:</Text>
                  <Text style={styles.notesText}>{studentProgress.notes}</Text>
                </View>
              )}

              {studentProgress?.weight && (
                <View style={styles.weightContainer}>
                  <Text style={styles.weightLabel}>Peso:</Text>
                  <Text style={styles.weightValue}>{studentProgress.weight} kg</Text>
                </View>
              )}
            </View>
          );
        })}

        {trainer?.clients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay alumnos registrados</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.white,
  },
  weightContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
