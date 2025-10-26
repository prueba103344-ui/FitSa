import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { trpcClient } from '@/lib/trpc';

const BASE_KEYS = {
  CURRENT_USER: '@fitsa_current_user',
  STUDENTS: '@fitsa_students',
  WORKOUT_PLANS: '@fitsa_workout_plans',
  DIET_PLANS: '@fitsa_diet_plans',
  PROGRESS: '@fitsa_progress',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getKey = useCallback((k: keyof typeof BASE_KEYS) => BASE_KEYS[k], []);

  const loadData = useCallback(async () => {
    try {
      const [storedUser, storedStudents, storedWorkouts, storedDiets, storedProgress] = await Promise.all([
        AsyncStorage.getItem(getKey('CURRENT_USER')),
        AsyncStorage.getItem(getKey('STUDENTS')),
        AsyncStorage.getItem(getKey('WORKOUT_PLANS')),
        AsyncStorage.getItem(getKey('DIET_PLANS')),
        AsyncStorage.getItem(getKey('PROGRESS')),
      ]);

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedStudents) setStudents(JSON.parse(storedStudents));
      if (storedWorkouts) setWorkoutPlans(JSON.parse(storedWorkouts));
      if (storedDiets) setDietPlans(JSON.parse(storedDiets));
      if (storedProgress) setProgress(JSON.parse(storedProgress));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const registerTrainer = useCallback(async (username: string, password: string, name: string) => {
    const res = await trpcClient.auth.signupTrainer.mutate({ username, password, name });
    const trainer: Trainer = { id: res.user.id, name: res.user.name, role: 'trainer', clients: [], avatar: res.user.avatar };
    await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainer));
    setCurrentUser(trainer);
    const trainerStudents = await trpcClient.students.listByTrainer.query({ trainerId: trainer.id }).catch(() => []);
    setStudents(trainerStudents);
  }, [getKey]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await trpcClient.auth.login.mutate({ username, password });
    const u = res.user as User;
    await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(u));
    setCurrentUser(u);
    if (u.role === 'trainer') {
      const trainerStudents = await trpcClient.students.listByTrainer.query({ trainerId: u.id }).catch(() => []);
      setStudents(trainerStudents);
    } else {
      const [remoteWorkouts, remoteDiets] = await Promise.all([
        trpcClient.workouts.listByStudent.query({ studentId: u.id }).catch(() => []),
        trpcClient.diets.listByStudent.query({ studentId: u.id }).catch(() => []),
      ]);
      setWorkoutPlans(remoteWorkouts);
      setDietPlans(remoteDiets);
    }
  }, [getKey]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(getKey('CURRENT_USER'));
      setCurrentUser(null);
      setStudents([]);
      setWorkoutPlans([]);
      setDietPlans([]);
      setProgress([]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [getKey]);

  const createStudentAccount = useCallback(async (data: { username: string; password: string; name: string }) => {
    if (!currentUser || currentUser.role !== 'trainer') throw new Error('No autorizado');
    const res = await trpcClient.auth.createStudentAccount.mutate({ trainerId: currentUser.id, ...data });
    const student = res.student;
    const updated = [...students, student];
    await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
    setStudents(updated);
    const updatedTrainer: Trainer | null = currentUser.role === 'trainer' ? { ...(currentUser as Trainer), clients: updated } : null;
    if (updatedTrainer) {
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
      setCurrentUser(updatedTrainer);
    }
    return student;
  }, [currentUser, students, getKey]);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      const updated = [...workoutPlans, plan];
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.upsert.mutate(plan); } catch {}
    } catch (error) {
      console.error('Error adding workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.update.mutate({ id: planId, updates }); } catch {}
    } catch (error) {
      console.error('Error updating workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      const updated = [...dietPlans, plan];
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.upsert.mutate(plan); } catch {}
    } catch (error) {
      console.error('Error adding diet plan:', error);
    }
  }, [dietPlans, getKey]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.update.mutate({ id: planId, updates }); } catch {}
    } catch (error) {
      console.error('Error updating diet plan:', error);
    }
  }, [dietPlans, getKey]);

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

      await AsyncStorage.setItem(getKey('PROGRESS'), JSON.stringify(updated));
      setProgress(updated);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [progress, getKey]);

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
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
      setStudents(updated);
      try { await trpcClient.students.upsert.mutate(student as any); } catch {}
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  }, [students, currentUser, getKey]);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const updated = students.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
      setStudents(updated);
      const found = updated.find(s => s.id === studentId);
      if (found) { try { await trpcClient.students.upsert.mutate(found as any); } catch {} }
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  }, [students, currentUser, getKey]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const updated = students.filter(s => s.id !== studentId);
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
      setStudents(updated);
      try { await trpcClient.students.remove.mutate({ id: studentId }); } catch {}
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  }, [students, currentUser, getKey]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      const updated = workoutPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      try { await trpcClient.workouts.remove.mutate({ id: planId }); } catch {}
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      const updated = dietPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      try { await trpcClient.diets.remove.mutate({ id: planId }); } catch {}
    } catch (error) {
      console.error('Error deleting diet plan:', error);
    }
  }, [dietPlans, getKey]);

  return useMemo(() => ({
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
    registerTrainer,
    login,
    logout,
    createStudentAccount,
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
    registerTrainer,
    login,
    logout,
    createStudentAccount,
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
