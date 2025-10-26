import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { mockTrainer, mockStudent, mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEYS = {
  CURRENT_USER: '@fitsync_current_user',
  STUDENTS: '@fitsync_students',
  WORKOUT_PLANS: '@fitsync_workout_plans',
  DIET_PLANS: '@fitsync_diet_plans',
  PROGRESS: '@fitsync_progress',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(mockWorkoutPlans);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(mockDietPlans);
  const [progress, setProgress] = useState<DailyProgress[]>(mockProgress);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [storedUser, storedStudents, storedWorkouts, storedDiets, storedProgress] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.STUDENTS),
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.DIET_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS),
      ]);

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedStudents) setStudents(JSON.parse(storedStudents));
      if (storedWorkouts) setWorkoutPlans(JSON.parse(storedWorkouts));
      if (storedDiets) setDietPlans(JSON.parse(storedDiets));
      if (storedProgress) setProgress(JSON.parse(storedProgress));

      try {
        const remoteStudents = await trpcClient.students.list.query();
        if (remoteStudents && remoteStudents.length > 0) setStudents(remoteStudents);
        const sid = storedUser ? (JSON.parse(storedUser) as User).id : mockStudent.id;
        const [remoteWorkouts, remoteDiets] = await Promise.all([
          trpcClient.workouts.listByStudent.query({ studentId: sid }).catch(() => []),
          trpcClient.diets.listByStudent.query({ studentId: sid }).catch(() => []),
        ]);
        if (remoteWorkouts && remoteWorkouts.length > 0) setWorkoutPlans(remoteWorkouts);
        if (remoteDiets && remoteDiets.length > 0) setDietPlans(remoteDiets);
      } catch (e) {
        console.log('Backend not available, using local data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loginAsTrainer = useCallback(async () => {
    try {
      const trainerWithClients: Trainer = { ...mockTrainer, clients: students };
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(trainerWithClients));
      setCurrentUser(trainerWithClients);
    } catch (error) {
      console.error('Error logging in as trainer:', error);
    }
  }, [students]);

  const loginAsStudent = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockStudent));
      setCurrentUser(mockStudent);
    } catch (error) {
      console.error('Error logging in as student:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      const updated = [...workoutPlans, plan];
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.upsert.mutate(plan); } catch {}
    } catch (error) {
      console.error('Error adding workout plan:', error);
    }
  }, [workoutPlans]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.update.mutate({ id: planId, updates }); } catch {}
    } catch (error) {
      console.error('Error updating workout plan:', error);
    }
  }, [workoutPlans]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      const updated = [...dietPlans, plan];
      await AsyncStorage.setItem(STORAGE_KEYS.DIET_PLANS, JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.upsert.mutate(plan); } catch {}
    } catch (error) {
      console.error('Error adding diet plan:', error);
    }
  }, [dietPlans]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(STORAGE_KEYS.DIET_PLANS, JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.update.mutate({ id: planId, updates }); } catch {}
    } catch (error) {
      console.error('Error updating diet plan:', error);
    }
  }, [dietPlans]);

  const updateProgress = useCallback(async (dailyProgress: DailyProgress) => {
    try {
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

      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
      setProgress(updated);
    } catch (error) {
      console.error('Error updating progress:', error);
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
      const updated = [...students, student];
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      setStudents(updated);
      try { await trpcClient.students.upsert.mutate(student as any); } catch {}
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  }, [students, currentUser]);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const updated = students.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      setStudents(updated);
      const found = updated.find(s => s.id === studentId);
      if (found) { try { await trpcClient.students.upsert.mutate(found as any); } catch {} }
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  }, [students, currentUser]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const updated = students.filter(s => s.id !== studentId);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      setStudents(updated);
      try { await trpcClient.students.remove.mutate({ id: studentId }); } catch {}
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  }, [students, currentUser]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      const updated = workoutPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.remove.mutate({ id: planId }); } catch {}
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  }, [workoutPlans]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      const updated = dietPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(STORAGE_KEYS.DIET_PLANS, JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.remove.mutate({ id: planId }); } catch {}
    } catch (error) {
      console.error('Error deleting diet plan:', error);
    }
  }, [dietPlans]);

  return useMemo(() => ({
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
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
  }), [
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
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
  ]);
});
