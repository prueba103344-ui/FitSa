import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { trpcClient } from '@/lib/trpc';

const BASE_KEYS = {
  CURRENT_USER: '@fitsa_current_user',
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
      const [storedUser, storedProgress] = await Promise.all([
        AsyncStorage.getItem(getKey('CURRENT_USER')),
        AsyncStorage.getItem(getKey('PROGRESS')),
      ]);

      const parsedUser: User | null = storedUser ? JSON.parse(storedUser) : null;
      const parsedProgress: DailyProgress[] = storedProgress ? JSON.parse(storedProgress) : [];

      if (parsedUser?.role === 'trainer') {
        const trainerId = parsedUser.id;
        try {
          const trainerStudents = await trpcClient.students.listByTrainer.query({ trainerId });
          setStudents(trainerStudents);
          const trainerObj: Trainer = { ...(parsedUser as Trainer), clients: trainerStudents };
          setCurrentUser(trainerObj as unknown as User);
        } catch (err) {
          console.error('[AppContext] Failed to fetch students from server:', err);
          setStudents([]);
          setCurrentUser(parsedUser);
        }
      } else if (parsedUser?.role === 'student') {
        setCurrentUser(parsedUser);
        try {
          const [serverWorkouts, serverDiets] = await Promise.all([
            trpcClient.workouts.listByStudent.query({ studentId: parsedUser.id }),
            trpcClient.diets.listByStudent.query({ studentId: parsedUser.id }),
          ]);
          setWorkoutPlans(serverWorkouts);
          setDietPlans(serverDiets);
        } catch (err) {
          console.error('[AppContext] Failed to fetch student data from server:', err);
          setWorkoutPlans([]);
          setDietPlans([]);
        }
      } else {
        setCurrentUser(null);
      }

      setProgress(parsedProgress);
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
    try {
      console.log('[AppContext] Registering trainer (server):', username);
      const res = await trpcClient.auth.signupTrainer.mutate({ username, password, name });
      const trainer: Trainer = { id: res.user.id, name: name, role: 'trainer', clients: [], avatar: res.user.avatar } as Trainer;
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainer));
      setCurrentUser(trainer);
      console.log('[AppContext] Trainer registered successfully (server)');
    } catch (error) {
      console.error('[AppContext] Registration error:', error);
      throw error;
    }
  }, [getKey]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log('[AppContext] Logging in (server):', username);
      const res = await trpcClient.auth.login.mutate({ username, password });
      const user = res.user as User;
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(user));
      setCurrentUser(user);

      if (user.role === 'trainer') {
        try {
          const trainerStudents = await trpcClient.students.listByTrainer.query({ trainerId: user.id });
          setStudents(trainerStudents);
        } catch (err) {
          console.error('[AppContext] Failed to load trainer students after login:', err);
          setStudents([]);
        }
      } else if (user.role === 'student') {
        try {
          const [serverWorkouts, serverDiets] = await Promise.all([
            trpcClient.workouts.listByStudent.query({ studentId: user.id }),
            trpcClient.diets.listByStudent.query({ studentId: user.id }),
          ]);
          setWorkoutPlans(serverWorkouts);
          setDietPlans(serverDiets);
        } catch (err) {
          console.error('[AppContext] Failed to load student plans after login:', err);
          setWorkoutPlans([]);
          setDietPlans([]);
        }
      }

      console.log('[AppContext] Login successful');
    } catch (error) {
      console.error('[AppContext] Login error:', error);
      throw error;
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

    const res = await trpcClient.auth.createStudentAccount.mutate({
      trainerId: currentUser.id,
      username: data.username,
      password: data.password,
      name: data.name,
    });

    const student: Student = {
      ...res.student,
      loginUsername: data.username.toLowerCase(),
      loginPassword: data.password,
    } as Student;

    const updated = [...students, student];
    setStudents(updated);

    if (currentUser?.role === 'trainer') {
      const updatedTrainer: Trainer = { ...(currentUser as Trainer), clients: updated };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
      setCurrentUser(updatedTrainer);
    }

    try { await trpcClient.students.upsert.mutate(student as any); } catch (e) { console.log('[AppContext] Warning: could not persist student extra fields', e); }

    return student;
  }, [currentUser, students, getKey]);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      await trpcClient.workouts.upsert.mutate(plan);
      const updated = [...workoutPlans, plan];
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error adding workout plan:', error);
    }
  }, [workoutPlans]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      await trpcClient.workouts.update.mutate({ id: planId, updates });
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error updating workout plan:', error);
    }
  }, [workoutPlans]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      await trpcClient.diets.upsert.mutate(plan);
      const updated = [...dietPlans, plan];
      setDietPlans(updated);
    } catch (error) {
      console.error('Error adding diet plan:', error);
    }
  }, [dietPlans]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      await trpcClient.diets.update.mutate({ id: planId, updates });
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setDietPlans(updated);
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
      await trpcClient.students.upsert.mutate(student as any);
      const updated = [...students, student];
      setStudents(updated);
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer as unknown as User);
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
      const found = updated.find(s => s.id === studentId);
      if (found) { await trpcClient.students.upsert.mutate(found as any); }
      setStudents(updated);
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer as unknown as User);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  }, [students, currentUser]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      await trpcClient.students.remove.mutate({ id: studentId });
      const updated = students.filter(s => s.id !== studentId);
      setStudents(updated);
      
      if (currentUser?.role === 'trainer') {
        const updatedTrainer: Trainer = { 
          ...(currentUser as Trainer), 
          clients: updated 
        };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
        setCurrentUser(updatedTrainer as unknown as User);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  }, [students, currentUser]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      await trpcClient.workouts.remove.mutate({ id: planId });
      const updated = workoutPlans.filter(p => p.id !== planId);
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  }, [workoutPlans]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      await trpcClient.diets.remove.mutate({ id: planId });
      const updated = dietPlans.filter(p => p.id !== planId);
      setDietPlans(updated);
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
