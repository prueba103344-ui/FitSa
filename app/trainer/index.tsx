import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { Dumbbell, Apple, Users, LogOut, CalendarDays, TrendingUp } from 'lucide-react-native';
import { Trainer } from '@/types';

export default function TrainerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, workoutPlans, dietPlans, logout } = useApp();

  if (!currentUser || currentUser.role !== 'trainer') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const trainer = currentUser as Trainer;

  const handleLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  const studentWorkouts = workoutPlans.filter(plan => 
    trainer.clients.some(client => client.id === plan.studentId)
  );
  const studentDiets = dietPlans.filter(plan => 
    trainer.clients.some(client => client.id === plan.studentId)
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: trainer.avatar }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.welcomeText}>Hola Coach!</Text>
              <Text style={styles.userName}>{trainer.name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={28} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.statValue}>{trainer.clients.length}</Text>
            <Text style={styles.statLabel}>Alumnos</Text>
          </View>

          <View style={styles.statCard}>
            <Dumbbell size={28} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.statValue}>{studentWorkouts.length}</Text>
            <Text style={styles.statLabel}>Rutinas</Text>
          </View>

          <View style={styles.statCard}>
            <Apple size={28} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.statValue}>{studentDiets.length}</Text>
            <Text style={styles.statLabel}>Dietas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Resumen de Alumnos</Text>
          </View>

          {trainer.clients.slice(0, 3).map((student) => (
            <TouchableOpacity 
              key={student.id} 
              style={styles.clientCard}
              onPress={() => router.push(`/trainer/progress?studentId=${student.id}` as any)}
            >
              <Image
                source={{ uri: student.avatar }}
                style={styles.clientAvatar}
              />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{student.name}</Text>
                <View style={styles.clientStats}>
                  {student.weight && (
                    <View style={styles.clientStat}>
                      <Text style={styles.clientStatValue}>{student.weight}kg</Text>
                      <Text style={styles.clientStatLabel}>Peso</Text>
                    </View>
                  )}
                  {student.height && (
                    <View style={styles.clientStat}>
                      <Text style={styles.clientStatValue}>{student.height}cm</Text>
                      <Text style={styles.clientStatLabel}>Altura</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {trainer.clients.length > 3 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/trainer/students' as any)}
            >
              <Text style={styles.viewAllText}>Ver todos los alumnos</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Dumbbell size={24} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Planes de Entrenamiento</Text>
          </View>

          {studentWorkouts.slice(0, 3).map((workout) => (
            <View key={workout.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{workout.name}</Text>
                <View style={styles.planBadge}>
                  <CalendarDays size={14} color={colors.neon} />
                  <Text style={styles.planBadgeText}>{workout.daysOfWeek.length} días</Text>
                </View>
              </View>
              <Text style={styles.planDetails}>
                {workout.exercises.length} ejercicios • {trainer.clients.find(c => c.id === workout.studentId)?.name}
              </Text>
              <View style={styles.planDays}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dayBadge,
                      workout.daysOfWeek.includes(idx === 6 ? 0 : idx + 1) && styles.dayBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBadgeText,
                        workout.daysOfWeek.includes(idx === 6 ? 0 : idx + 1) && styles.dayBadgeTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {studentWorkouts.length > 3 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/trainer/workouts' as any)}
            >
              <Text style={styles.viewAllText}>Ver todos los entrenamientos</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Apple size={24} color={colors.neon} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Planes de Alimentación</Text>
          </View>

          {studentDiets.slice(0, 3).map((diet) => (
            <View key={diet.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Plan Nutricional</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{diet.totalCalories} kcal</Text>
                </View>
              </View>
              <Text style={styles.planDetails}>
                {diet.meals.length} comidas • {trainer.clients.find(c => c.id === diet.studentId)?.name}
              </Text>
              <View style={styles.macrosRow}>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>P:</Text>
                  <Text style={styles.macroChipValue}>{diet.totalProtein}g</Text>
                </View>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>C:</Text>
                  <Text style={styles.macroChipValue}>{diet.totalCarbs}g</Text>
                </View>
                <View style={styles.macroChip}>
                  <Text style={styles.macroChipLabel}>G:</Text>
                  <Text style={styles.macroChipValue}>{diet.totalFat}g</Text>
                </View>
              </View>
            </View>
          ))}

          {studentDiets.length > 3 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/trainer/diets' as any)}
            >
              <Text style={styles.viewAllText}>Ver todas las dietas</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
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
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.white,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  clientInfo: {
    flex: 1,
    gap: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  clientStats: {
    flexDirection: 'row',
    gap: 20,
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
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.neon,
  },
  planDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  planDays: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBadgeActive: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  dayBadgeTextActive: {
    color: colors.background,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  macroChipLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  macroChipValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  viewAllButton: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.neon,
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
});
