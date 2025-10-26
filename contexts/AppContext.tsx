import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { mockTrainer, mockStudent, mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEYS = {
  CURRENT_USER: '@fitsync_current_user',
  LAST_SYNC: '@fitsync_last_sync',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(mockWorkoutPlans);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(mockDietPlans);
  const [progress, setProgress] = useState<DailyProgress[]>(mockProgress);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const syncFromBackend = useCallback(async (userId?: string, userRole?: 'trainer' | 'student') => {
    console.log('🔄 Sincronizando datos desde el backend...');
    setIsSyncing(true);
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const activeUserId = userId || (storedUser ? (JSON.parse(storedUser) as User).id : mockStudent.id);
      const activeUserRole = userRole || (storedUser ? (JSON.parse(storedUser) as User).role : 'student');

      let remoteStudents: Student[] = [];
      try {
        remoteStudents = await trpcClient.students.list.query();
        if (remoteStudents && remoteStudents.length > 0) {
          console.log(`✅ ${remoteStudents.length} estudiantes sincronizados`);
          setStudents(remoteStudents);
        }
      } catch {
        console.warn('⚠️ No se pudieron sincronizar estudiantes, usando datos locales');
      }

      if (activeUserRole === 'trainer') {
        const studentIds = remoteStudents.length > 0 ? remoteStudents.map(s => s.id) : students.map(s => s.id);
        
        const allWorkouts: WorkoutPlan[] = [];
        const allDiets: DietPlan[] = [];
        const allProgress: DailyProgress[] = [];

        for (const studentId of studentIds) {
          const [workouts, diets, progress] = await Promise.all([
            trpcClient.workouts.listByStudent.query({ studentId }).catch(() => []),
            trpcClient.diets.listByStudent.query({ studentId }).catch(() => []),
            trpcClient.progress.listByStudent.query({ studentId }).catch(() => []),
          ]);
          allWorkouts.push(...workouts);
          allDiets.push(...diets);
          allProgress.push(...progress);
        }

        if (allWorkouts.length > 0) {
          console.log(`✅ ${allWorkouts.length} planes de entrenamiento sincronizados`);
          setWorkoutPlans(allWorkouts);
        } else {
          console.log('ℹ️ Sin entrenamientos remotos; manteniendo datos locales');
        }

        if (allDiets.length > 0) {
          console.log(`✅ ${allDiets.length} planes de dieta sincronizados`);
          setDietPlans(allDiets);
        } else {
          console.log('ℹ️ Sin dietas remotas; manteniendo datos locales');
        }

        if (allProgress.length > 0) {
          console.log(`✅ ${allProgress.length} registros de progreso sincronizados`);
          setProgress(allProgress);
        } else {
          console.log('ℹ️ Sin progreso remoto; manteniendo datos locales');
        }
      } else {
        const [remoteWorkouts, remoteDiets, remoteProgress] = await Promise.all([
          trpcClient.workouts.listByStudent.query({ studentId: activeUserId }).catch((e) => {
            console.warn('⚠️ No se pudieron sincronizar entrenamientos:', e.message);
            return [];
          }),
          trpcClient.diets.listByStudent.query({ studentId: activeUserId }).catch((e) => {
            console.warn('⚠️ No se pudieron sincronizar dietas:', e.message);
            return [];
          }),
          trpcClient.progress.listByStudent.query({ studentId: activeUserId }).catch((e) => {
            console.warn('⚠️ No se pudo sincronizar progreso:', e.message);
            return [];
          }),
        ]);

        if (remoteWorkouts && remoteWorkouts.length > 0) {
          setWorkoutPlans(remoteWorkouts);
          console.log(`✅ ${remoteWorkouts.length} planes de entrenamiento sincronizados`);
        } else {
          console.log('ℹ️ Sin entrenamientos remotos; manteniendo datos locales');
        }

        if (remoteDiets && remoteDiets.length > 0) {
          setDietPlans(remoteDiets);
          console.log(`✅ ${remoteDiets.length} planes de dieta sincronizados`);
        } else {
          console.log('ℹ️ Sin dietas remotas; manteniendo datos locales');
        }

        if (remoteProgress && remoteProgress.length > 0) {
          setProgress(remoteProgress);
          console.log(`✅ ${remoteProgress.length} registros de progreso sincronizados`);
        } else {
          console.log('ℹ️ Sin progreso remoto; manteniendo datos locales');
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      console.log('✅ Sincronización completada (modo offline si hubo errores)');
    } catch (error) {
      console.error('❌ Error sincronizando desde backend:', error);
      console.log('📱 Continuando en modo offline con datos locales');
    } finally {
      setIsSyncing(false);
    }
  }, [students]);

  const loadData = useCallback(async () => {
    console.log('📱 Cargando datos...');
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        setCurrentUser(user);
        console.log(`👤 Usuario cargado: ${user.name}`);
      }

      await syncFromBackend();
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [syncFromBackend]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loginAsTrainer = useCallback(async () => {
    try {
      const trainerWithClients: Trainer = { ...mockTrainer, clients: students };
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(trainerWithClients));
      setCurrentUser(trainerWithClients);
      console.log('👨‍🏫 Login como entrenador');
      await syncFromBackend(trainerWithClients.id, 'trainer');
    } catch (error) {
      console.error('Error logging in as trainer:', error);
    }
  }, [students, syncFromBackend]);

  const loginAsStudent = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockStudent));
      setCurrentUser(mockStudent);
      console.log('🎓 Login como estudiante');
      await syncFromBackend(mockStudent.id, 'student');
    } catch (error) {
      console.error('Error logging in as student:', error);
    }
  }, [syncFromBackend]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
      console.log('👋 Logout exitoso');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      console.log('➕ Agregando plan de entrenamiento:', plan.name);
      const updated = [...workoutPlans, plan];
      setWorkoutPlans(updated);
      await trpcClient.workouts.upsert.mutate(plan);
      console.log('✅ Plan sincronizado con el backend');
    } catch (error) {
      console.error('❌ Error adding workout plan:', error);
      throw error;
    }
  }, [workoutPlans]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      console.log('✏️ Actualizando plan de entrenamiento:', planId);
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setWorkoutPlans(updated);
      await trpcClient.workouts.update.mutate({ id: planId, updates });
      console.log('✅ Plan actualizado en el backend');
    } catch (error) {
      console.error('❌ Error updating workout plan:', error);
      throw error;
    }
  }, [workoutPlans]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      console.log('➕ Agregando plan de dieta');
      const updated = [...dietPlans, plan];
      setDietPlans(updated);
      await trpcClient.diets.upsert.mutate(plan);
      console.log('✅ Plan sincronizado con el backend');
    } catch (error) {
      console.error('❌ Error adding diet plan:', error);
      throw error;
    }
  }, [dietPlans]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      console.log('✏️ Actualizando plan de dieta:', planId);
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setDietPlans(updated);
      await trpcClient.diets.update.mutate({ id: planId, updates });
      console.log('✅ Plan actualizado en el backend');
    } catch (error) {
      console.error('❌ Error updating diet plan:', error);
      throw error;
    }
  }, [dietPlans]);

  const updateProgress = useCallback(async (dailyProgress: DailyProgress) => {
    try {
      console.log('📊 Actualizando progreso:', dailyProgress.date);
      const existingIndex = progress.findIndex(
        p => p.date === dailyProgress.date && p.studentId === dailyProgress.studentId
      );

      let updated: DailyProgress[];
      if (existingIndex >= 0) {
        updated = [...progress];
        updated[existingIndex] = dailyProgress;
      } else {
        updated = [...progress, dailyProgress];
      }

      setProgress(updated);
      await trpcClient.progress.upsert.mutate(dailyProgress);
      console.log('✅ Progreso sincronizado con el backend');
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }, [progress]);

  const getTodayProgress = useCallback((studentId: string): DailyProgress | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return progress.find(p => p.date === today && p.studentId === studentId);
  }, [progress]);

  const getTodayWorkout = useCallback((studentId: string): WorkoutPlan | undefined => {
    const today = new Date().getDay();
    return workoutPlans.find(
      plan => plan.studentId === studentId && plan.daysOfWeek.includes(today)
    );
  }, [workoutPlans]);

  const getTodayDiet = useCallback((studentId: string): DietPlan | undefined => {
    return dietPlans.find(plan => plan.studentId === studentId);
  }, [dietPlans]);

  const addStudent = useCallback(async (student: Student) => {
    try {
      console.log('➕ Agregando estudiante:', student.name);
      const updated = [...students, student];
      setStudents(updated);
      await trpcClient.students.upsert.mutate(student as any);
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
      console.log('✅ Estudiante sincronizado con el backend');
    } catch (error) {
      console.error('❌ Error adding student:', error);
      throw error;
    }
  }, [students, currentUser]);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      console.log('✏️ Actualizando estudiante:', studentId);
      const updated = students.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
      setStudents(updated);
      const found = updated.find(s => s.id === studentId);
      if (found) {
        await trpcClient.students.upsert.mutate(found as any);
      }
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
      console.log('✅ Estudiante actualizado en el backend');
    } catch (error) {
      console.error('❌ Error updating student:', error);
      throw error;
    }
  }, [students, currentUser]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      console.log('🗑️ Eliminando estudiante:', studentId);
      const updated = students.filter(s => s.id !== studentId);
      setStudents(updated);
      await trpcClient.students.remove.mutate({ id: studentId });
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
      console.log('✅ Estudiante eliminado del backend');
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      throw error;
    }
  }, [students, currentUser]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      console.log('🗑️ Eliminando plan de entrenamiento:', planId);
      const updated = workoutPlans.filter(p => p.id !== planId);
      setWorkoutPlans(updated);
      await trpcClient.workouts.remove.mutate({ id: planId });
      console.log('✅ Plan eliminado del backend');
    } catch (error) {
      console.error('❌ Error deleting workout plan:', error);
      throw error;
    }
  }, [workoutPlans]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      console.log('🗑️ Eliminando plan de dieta:', planId);
      const updated = dietPlans.filter(p => p.id !== planId);
      setDietPlans(updated);
      await trpcClient.diets.remove.mutate({ id: planId });
      console.log('✅ Plan eliminado del backend');
    } catch (error) {
      console.error('❌ Error deleting diet plan:', error);
      throw error;
    }
  }, [dietPlans]);

  return useMemo(() => ({
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
    isSyncing,
    loginAsTrainer,
    loginAsStudent,
    logout,
    addStudent,
    updateStudent,
    deleteStudent,
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    addDietPlan,
    updateDietPlan,
    deleteDietPlan,
    updateProgress,
    getTodayProgress,
    getTodayWorkout,
    getTodayDiet,
    syncFromBackend,
  }), [
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
    isSyncing,
    loginAsTrainer,
    loginAsStudent,
    logout,
    addStudent,
    updateStudent,
    deleteStudent,
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    addDietPlan,
    updateDietPlan,
    deleteDietPlan,
    updateProgress,
    getTodayProgress,
    getTodayWorkout,
    getTodayDiet,
    syncFromBackend,
  ]);
});
