import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';
import { trpcClient } from '@/lib/trpc';
import { getSession, signInWithPassword, signOut, signUp } from '@/lib/supabase';
import { supaDB, type ProfileRow } from '@/lib/supabase-db';

const STORAGE_KEYS = {
  CURRENT_USER: '@fitsa_current_user',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getKey = useCallback((k: keyof typeof STORAGE_KEYS) => STORAGE_KEYS[k], []);

  const loadSession = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(getKey('CURRENT_USER'));
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as User;
        setCurrentUser(parsed);
        setIsLoading(false);
        return;
      }
      const session = await getSession();
      if (session?.user?.id) {
        console.log('[AppContext] Found Supabase session for user:', session.user.id);
        const profile = await supaDB.getProfile(session.user.id);
        if (profile) {
          const user: User = profile.role === 'trainer'
            ? { id: profile.id, name: profile.name, role: 'trainer', avatar: profile.avatar ?? undefined }
            : { id: profile.id, name: profile.name, role: 'student', avatar: profile.avatar ?? undefined };
          await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(user));
          setCurrentUser(user);
        }
      }
    } catch (error) {
      console.error('[AppContext] Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getKey]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!currentUser) {
        setStudents([]);
        setWorkoutPlans([]);
        setDietPlans([]);
        return;
      }
      try {
        const session = await getSession();
        if (session) {
          if (currentUser.role === 'trainer') {
            const list = await supaDB.listStudentsByTrainer(currentUser.id);
            setStudents(list);
          } else {
            const [workouts, diets] = await Promise.all([
              supaDB.listWorkoutsByStudent(currentUser.id),
              supaDB.listDietsByStudent(currentUser.id),
            ]);
            setWorkoutPlans(workouts);
            setDietPlans(diets);
          }
          return;
        }
        if (currentUser.role === 'trainer') {
          const list = await trpcClient.students.listByTrainer.query({ trainerId: currentUser.id });
          setStudents(list);
        } else {
          const [workouts, diets] = await Promise.all([
            trpcClient.workouts.listByStudent.query({ studentId: currentUser.id }),
            trpcClient.diets.listByStudent.query({ studentId: currentUser.id }),
          ]);
          setWorkoutPlans(workouts);
          setDietPlans(diets);
        }
      } catch (error) {
        console.error('[AppContext] Error fetching cloud data:', error);
      }
    };
    fetchCloudData();
  }, [currentUser]);

  const registerTrainer = useCallback(async (username: string, password: string, name: string) => {
    try {
      console.log('[AppContext] Registering trainer via Supabase with username:', username);
      const email = username.includes('@') ? username : `${username}@fit.local`;
      await signUp({ email, password, data: { role: 'trainer', name } });
      const session = await signInWithPassword({ email, password });
      const userId = session.user?.id ?? (session as any).user?.id ?? (session as any).id;
      if (!userId) throw new Error('No se pudo obtener el usuario de Supabase');
      const profile: ProfileRow = { id: userId, role: 'trainer', name, avatar: null };
      await supaDB.upsertProfile(profile);
      const trainer: Trainer = { id: userId, name, role: 'trainer', clients: [], avatar: undefined };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainer));
      setCurrentUser(trainer);
    } catch (error: any) {
      console.error('[AppContext] Registration error:', error?.message || error);
      throw new Error(error?.message ?? 'No se pudo crear la cuenta');
    }
  }, [getKey]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log('[AppContext] Logging in via Supabase with username:', username);
      const email = username.includes('@') ? username : `${username}@fit.local`;
      await signInWithPassword({ email, password });
      const session = await getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error('No se pudo iniciar sesión');
      const profile = await supaDB.getProfile(uid);
      if (!profile) throw new Error('Perfil no encontrado');
      const user: User = profile.role === 'trainer'
        ? { id: profile.id, name: profile.name, role: 'trainer', avatar: profile.avatar ?? undefined }
        : { id: profile.id, name: profile.name, role: 'student', avatar: profile.avatar ?? undefined };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(user));
      setCurrentUser(user);
    } catch (error: any) {
      console.error('[AppContext] Login error:', error?.message || error);
      throw new Error(error?.message ?? 'No se pudo iniciar sesión');
    }
  }, [getKey]);

  const logout = useCallback(async () => {
    try {
      await signOut();
      await AsyncStorage.removeItem(getKey('CURRENT_USER'));
      setCurrentUser(null);
      setStudents([]);
      setWorkoutPlans([]);
      setDietPlans([]);
      setProgress([]);
    } catch (error) {
      console.error('[AppContext] Error logging out:', error);
    }
  }, [getKey]);

  const createStudentAccount = useCallback(async (data: { username: string; password: string; name: string }) => {
    if (!currentUser || currentUser.role !== 'trainer') throw new Error('No autorizado');
    try {
      console.log('[AppContext] Creating student record in Supabase');
      const student: Student = { id: `student_${Date.now()}`, name: data.name, role: 'student', trainerId: currentUser.id };
      await supaDB.upsertStudent(student);
      setStudents(prev => [...prev, student]);
      const trainerUser = currentUser as Trainer;
      const updatedTrainer: Trainer = { ...trainerUser, clients: [...(trainerUser.clients ?? []), student] };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
      setCurrentUser(updatedTrainer);
      return student;
    } catch (error) {
      console.error('[AppContext] Error creating student:', error);
      throw error as Error;
    }
  }, [currentUser, getKey]);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.upsertWorkout(plan);
        const refreshed = await supaDB.listWorkoutsByStudent(plan.studentId);
        setWorkoutPlans(refreshed);
        return;
      }
      await trpcClient.workouts.upsert.mutate(plan);
      const refreshed = await trpcClient.workouts.listByStudent.query({ studentId: plan.studentId });
      setWorkoutPlans(refreshed);
    } catch (error) {
      console.error('[AppContext] Error adding workout plan:', error);
    }
  }, []);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      const session = await getSession();
      const targetStudentId = workoutPlans.find(w => w.id === planId)?.studentId;
      if (session) {
        await supaDB.updateWorkout(planId, updates);
        if (targetStudentId) {
          const refreshed = await supaDB.listWorkoutsByStudent(targetStudentId);
          setWorkoutPlans(refreshed);
        }
        return;
      }
      await trpcClient.workouts.update.mutate({ id: planId, updates });
      if (targetStudentId) {
        const refreshed = await trpcClient.workouts.listByStudent.query({ studentId: targetStudentId });
        setWorkoutPlans(refreshed);
      }
    } catch (error) {
      console.error('[AppContext] Error updating workout plan:', error);
    }
  }, [workoutPlans]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.deleteWorkout(planId);
        setWorkoutPlans(prev => prev.filter(p => p.id !== planId));
        return;
      }
      await trpcClient.workouts.remove.mutate({ id: planId });
      setWorkoutPlans(prev => prev.filter(p => p.id !== planId));
    } catch (error) {
      console.error('[AppContext] Error deleting workout plan:', error);
    }
  }, []);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.upsertDiet(plan);
        const refreshed = await supaDB.listDietsByStudent(plan.studentId);
        setDietPlans(refreshed);
        return;
      }
      await trpcClient.diets.upsert.mutate(plan);
      const refreshed = await trpcClient.diets.listByStudent.query({ studentId: plan.studentId });
      setDietPlans(refreshed);
    } catch (error) {
      console.error('[AppContext] Error adding diet plan:', error);
    }
  }, []);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      const session = await getSession();
      const targetStudentId = dietPlans.find(d => d.id === planId)?.studentId;
      if (session) {
        await supaDB.updateDiet(planId, updates);
        if (targetStudentId) {
          const refreshed = await supaDB.listDietsByStudent(targetStudentId);
          setDietPlans(refreshed);
        }
        return;
      }
      await trpcClient.diets.update.mutate({ id: planId, updates });
      if (targetStudentId) {
        const refreshed = await trpcClient.diets.listByStudent.query({ studentId: targetStudentId });
        setDietPlans(refreshed);
      }
    } catch (error) {
      console.error('[AppContext] Error updating diet plan:', error);
    }
  }, [dietPlans]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.deleteDiet(planId);
        setDietPlans(prev => prev.filter(p => p.id !== planId));
        return;
      }
      await trpcClient.diets.remove.mutate({ id: planId });
      setDietPlans(prev => prev.filter(p => p.id !== planId));
    } catch (error) {
      console.error('[AppContext] Error deleting diet plan:', error);
    }
  }, []);

  const updateProgress = useCallback(async (dailyProgress: DailyProgress) => {
    try {
      setProgress(prev => {
        const idx = prev.findIndex(p => p.date === dailyProgress.date && p.studentId === dailyProgress.studentId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = dailyProgress;
          return copy;
        }
        return [...prev, dailyProgress];
      });
    } catch (error) {
      console.error('[AppContext] Error updating progress:', error);
    }
  }, []);

  const getTodayProgress = useCallback((studentId: string): DailyProgress | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return progress.find(p => p.date === today && p.studentId === studentId);
  }, [progress]);

  const getTodayWorkout = useCallback((studentId: string): WorkoutPlan | undefined => {
    const today = new Date().getDay();
    return workoutPlans.find(plan => plan.studentId === studentId && plan.daysOfWeek.includes(today));
  }, [workoutPlans]);

  const getTodayDiet = useCallback((studentId: string): DietPlan | undefined => {
    return dietPlans.find(plan => plan.studentId === studentId);
  }, [dietPlans]);

  const addStudent = useCallback(async (student: Student) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.upsertStudent(student);
        const list = await supaDB.listStudentsByTrainer(student.trainerId);
        setStudents(list);
        return;
      }
      await trpcClient.students.upsert.mutate(student as any);
      const list = await trpcClient.students.listByTrainer.query({ trainerId: student.trainerId });
      setStudents(list);
    } catch (error) {
      console.error('[AppContext] Error adding student:', error);
    }
  }, []);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const existing = students.find(s => s.id === studentId);
      if (!existing) return;
      const updated: Student = { ...existing, ...updates } as Student;
      const session = await getSession();
      if (session) {
        await supaDB.upsertStudent(updated);
        const list = await supaDB.listStudentsByTrainer(updated.trainerId);
        setStudents(list);
        return;
      }
      await trpcClient.students.upsert.mutate(updated as any);
      const list = await trpcClient.students.listByTrainer.query({ trainerId: updated.trainerId });
      setStudents(list);
    } catch (error) {
      console.error('[AppContext] Error updating student:', error);
    }
  }, [students]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const session = await getSession();
      if (session) {
        await supaDB.deleteStudent(studentId);
        setStudents(prev => prev.filter(s => s.id !== studentId));
        return;
      }
      await trpcClient.students.remove.mutate({ id: studentId });
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('[AppContext] Error deleting student:', error);
    }
  }, []);

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
