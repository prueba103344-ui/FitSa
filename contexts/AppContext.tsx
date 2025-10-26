import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { mockTrainer, mockStudent, mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';
import { trpcClient } from '@/lib/trpc';

type DemoAccount = { username: string; password: string; createdAt: number; lastActive: number };

const BASE_KEYS = {
  CURRENT_USER: '@fitsync_current_user',
  STUDENTS: '@fitsync_students',
  WORKOUT_PLANS: '@fitsync_workout_plans',
  DIET_PLANS: '@fitsync_diet_plans',
  PROGRESS: '@fitsync_progress',
};

const DEMO_ACCOUNTS_KEY = '@fitsa_demo_accounts';
const DEMO_SESSION_KEY = '@fitsa_demo_session';
const DEMO_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(mockWorkoutPlans);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(mockDietPlans);
  const [progress, setProgress] = useState<DailyProgress[]>(mockProgress);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [demoUsername, setDemoUsername] = useState<string | null>(null);

  const getKey = useCallback((k: keyof typeof BASE_KEYS) => {
    if (isDemo && demoUsername) {
      return `${BASE_KEYS[k]}__demo__${demoUsername}`;
    }
    return BASE_KEYS[k];
  }, [isDemo, demoUsername]);

  const withBackend = useCallback(() => !isDemo, [isDemo]);

  const clearNamespace = useCallback(async (username: string) => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(`${BASE_KEYS.CURRENT_USER}__demo__${username}`),
        AsyncStorage.removeItem(`${BASE_KEYS.STUDENTS}__demo__${username}`),
        AsyncStorage.removeItem(`${BASE_KEYS.WORKOUT_PLANS}__demo__${username}`),
        AsyncStorage.removeItem(`${BASE_KEYS.DIET_PLANS}__demo__${username}`),
        AsyncStorage.removeItem(`${BASE_KEYS.PROGRESS}__demo__${username}`),
      ]);
    } catch (e) {
      console.log('clearNamespace error', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const sessionRaw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
      if (sessionRaw) {
        const sess = JSON.parse(sessionRaw) as { username: string };
        setIsDemo(true);
        setDemoUsername(sess.username);
      }

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

      if (withBackend()) {
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getKey, withBackend]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loginAsTrainer = useCallback(async () => {
    try {
      const trainerWithClients: Trainer = { ...mockTrainer, clients: students };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainerWithClients));
      setCurrentUser(trainerWithClients);
      setIsDemo(false);
      setDemoUsername(null);
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    } catch (error) {
      console.error('Error logging in as trainer:', error);
    }
  }, [students, getKey]);

  const loginAsStudent = useCallback(async () => {
    try {
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(mockStudent));
      setCurrentUser(mockStudent);
      setIsDemo(false);
      setDemoUsername(null);
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    } catch (error) {
      console.error('Error logging in as student:', error);
    }
  }, [getKey]);

  const registerOrLoginDemo = useCallback(async (username: string, password: string) => {
    const uname = username.trim().toLowerCase();
    const now = Date.now();
    const accountsRaw = (await AsyncStorage.getItem(DEMO_ACCOUNTS_KEY)) ?? '[]';
    const accounts = JSON.parse(accountsRaw) as DemoAccount[];
    const existing = accounts.find(a => a.username === uname);
    if (existing) {
      if (existing.password !== password) {
        throw new Error('Usuario o contraseña incorrectos');
      }
      existing.lastActive = now;
    } else {
      accounts.push({ username: uname, password, createdAt: now, lastActive: now });
    }
    await AsyncStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ username: uname }));

    const demoTrainer: Trainer = {
      ...mockTrainer,
      id: `demo_trainer_${uname}`,
      name: `Coach ${uname}`,
      clients: [],
    };
    await AsyncStorage.setItem(`${BASE_KEYS.CURRENT_USER}__demo__${uname}`, JSON.stringify(demoTrainer));

    setIsDemo(true);
    setDemoUsername(uname);
    setCurrentUser(demoTrainer);
  }, []);

  const purgeExpiredDemos = useCallback(async () => {
    try {
      const accountsRaw = (await AsyncStorage.getItem(DEMO_ACCOUNTS_KEY)) ?? '[]';
      const accounts = JSON.parse(accountsRaw) as DemoAccount[];
      const now = Date.now();
      const valid: DemoAccount[] = [];
      for (const acc of accounts) {
        if (now - acc.lastActive > DEMO_TTL_MS) {
          await clearNamespace(acc.username);
        } else {
          valid.push(acc);
        }
      }
      await AsyncStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(valid));
    } catch (e) {
      console.log('purgeExpiredDemos error', e);
    }
  }, [clearNamespace]);

  useEffect(() => {
    purgeExpiredDemos();
  }, [purgeExpiredDemos]);

  const logout = useCallback(async () => {
    try {
      if (isDemo && demoUsername) {
        await clearNamespace(demoUsername);
        const accountsRaw = (await AsyncStorage.getItem(DEMO_ACCOUNTS_KEY)) ?? '[]';
        const accounts = JSON.parse(accountsRaw) as DemoAccount[];
        const filtered = accounts.filter(a => a.username !== demoUsername);
        await AsyncStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(filtered));
        await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      } else {
        await AsyncStorage.removeItem(getKey('CURRENT_USER'));
      }
      setCurrentUser(null);
      setIsDemo(false);
      setDemoUsername(null);
      setStudents([]);
      setWorkoutPlans([]);
      setDietPlans([]);
      setProgress([]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [isDemo, demoUsername, getKey, clearNamespace]);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      const updated = [...workoutPlans, plan];
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      if (withBackend()) { try { await trpcClient.workouts.upsert.mutate(plan); } catch {} }
    } catch (error) {
      console.error('Error adding workout plan:', error);
    }
  }, [workoutPlans, getKey, withBackend]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      if (withBackend()) { try { await trpcClient.workouts.update.mutate({ id: planId, updates }); } catch {} }
    } catch (error) {
      console.error('Error updating workout plan:', error);
    }
  }, [workoutPlans, getKey, withBackend]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      const updated = [...dietPlans, plan];
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      if (withBackend()) { try { await trpcClient.diets.upsert.mutate(plan); } catch {} }
    } catch (error) {
      console.error('Error adding diet plan:', error);
    }
  }, [dietPlans, getKey, withBackend]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      if (withBackend()) { try { await trpcClient.diets.update.mutate({ id: planId, updates }); } catch {} }
    } catch (error) {
      console.error('Error updating diet plan:', error);
    }
  }, [dietPlans, getKey, withBackend]);

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
      if (withBackend()) { try { await trpcClient.students.upsert.mutate(student as any); } catch {} }
      
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
  }, [students, currentUser, getKey, withBackend]);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const updated = students.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
      setStudents(updated);
      const found = updated.find(s => s.id === studentId);
      if (found && withBackend()) { try { await trpcClient.students.upsert.mutate(found as any); } catch {} }
      
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
  }, [students, currentUser, getKey, withBackend]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const updated = students.filter(s => s.id !== studentId);
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updated));
      setStudents(updated);
      if (withBackend()) { try { await trpcClient.students.remove.mutate({ id: studentId }); } catch {} }
      
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
  }, [students, currentUser, getKey, withBackend]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      const updated = workoutPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('WORKOUT_PLANS'), JSON.stringify(updated));
      setWorkoutPlans(updated);
      if (withBackend()) { try { await trpcClient.workouts.remove.mutate({ id: planId }); } catch {} }
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  }, [workoutPlans, getKey, withBackend]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      const updated = dietPlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('DIET_PLANS'), JSON.stringify(updated));
      setDietPlans(updated);
      if (withBackend()) { try { await trpcClient.diets.remove.mutate({ id: planId }); } catch {} }
    } catch (error) {
      console.error('Error deleting diet plan:', error);
    }
  }, [dietPlans, getKey, withBackend]);

  return useMemo(() => ({
    currentUser,
    students,
    workoutPlans,
    dietPlans,
    progress,
    isLoading,
    isDemo,
    demoUsername,
    loginAsTrainer,
    loginAsStudent,
    registerOrLoginDemo,
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
    isDemo,
    demoUsername,
    loginAsTrainer,
    loginAsStudent,
    registerOrLoginDemo,
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
