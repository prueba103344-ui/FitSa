import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Student, Trainer, WorkoutPlan, DietPlan, DailyProgress } from '@/types';

const BASE_KEYS = {
  CURRENT_USER: '@fitsa_current_user',
  PROGRESS: '@fitsa_progress',
  USERS: '@fitsa_users',
  STUDENTS: '@fitsa_students',
  WORKOUTS: '@fitsa_workouts',
  DIETS: '@fitsa_diets',
  ADMIN_AUTHED: '@fitsa_admin_authed',
};

interface StoredUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'trainer' | 'student';
  trainerId?: string;
}

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(false);

  const getKey = useCallback((k: keyof typeof BASE_KEYS) => BASE_KEYS[k], []);

  const loadData = useCallback(async () => {
    try {
      const [storedUser, storedProgress, storedStudents, storedWorkouts, storedDiets, adminFlag] = await Promise.all([
        AsyncStorage.getItem(getKey('CURRENT_USER')),
        AsyncStorage.getItem(getKey('PROGRESS')),
        AsyncStorage.getItem(getKey('STUDENTS')),
        AsyncStorage.getItem(getKey('WORKOUTS')),
        AsyncStorage.getItem(getKey('DIETS')),
        AsyncStorage.getItem(getKey('ADMIN_AUTHED')),
      ]);

      const parsedUser: User | null = storedUser ? JSON.parse(storedUser) : null;
      const parsedProgress: DailyProgress[] = storedProgress ? JSON.parse(storedProgress) : [];
      const parsedStudents: Student[] = storedStudents ? JSON.parse(storedStudents) : [];
      const parsedWorkouts: WorkoutPlan[] = storedWorkouts ? JSON.parse(storedWorkouts) : [];
      const parsedDiets: DietPlan[] = storedDiets ? JSON.parse(storedDiets) : [];

      setIsAdminAuthed(adminFlag === '1');

      if (parsedUser?.role === 'trainer') {
        const trainerStudents = parsedStudents.filter(s => s.trainerId === parsedUser.id);
        setStudents(trainerStudents);
        const trainerObj: Trainer = { ...(parsedUser as Trainer), clients: trainerStudents };
        setCurrentUser(trainerObj as unknown as User);
      } else if (parsedUser?.role === 'student') {
        setCurrentUser(parsedUser);
        const studentWorkouts = parsedWorkouts.filter(w => w.studentId === parsedUser.id);
        const studentDiets = parsedDiets.filter(d => d.studentId === parsedUser.id);
        setWorkoutPlans(studentWorkouts);
        setDietPlans(studentDiets);
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

  const adminLogin = useCallback(async (username: string, password: string) => {
    const envUser = process.env.EXPO_PUBLIC_ADMIN_USER ?? 'admin';
    const envPass = process.env.EXPO_PUBLIC_ADMIN_PASS ?? 'admin123';
    console.log('[AppContext] Admin login attempt for:', username);
    if (username === envUser && password === envPass) {
      await AsyncStorage.setItem(getKey('ADMIN_AUTHED'), '1');
      setIsAdminAuthed(true);
      console.log('[AppContext] Admin login success');
      return true;
    }
    console.log('[AppContext] Admin login failed');
    throw new Error('Credenciales de admin inválidas');
  }, [getKey]);

  const adminLogout = useCallback(async () => {
    await AsyncStorage.removeItem(getKey('ADMIN_AUTHED'));
    setIsAdminAuthed(false);
  }, [getKey]);

  const registerTrainer = useCallback(async (username: string, password: string, name: string) => {
    try {
      console.log('[AppContext] Registering trainer (local):', username);
      const usersData = await AsyncStorage.getItem(getKey('USERS'));
      const users: StoredUser[] = usersData ? JSON.parse(usersData) : [];
      
      const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
      if (existing) {
        console.log('[AppContext] User already exists:', username);
        throw new Error('Usuario ya existe');
      }

      const id = `trainer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const newUser: StoredUser = {
        id,
        username: username.toLowerCase().trim(),
        password,
        name: name.trim(),
        role: 'trainer',
      };
      
      users.push(newUser);
      await AsyncStorage.setItem(getKey('USERS'), JSON.stringify(users));
      
      const trainer: Trainer = { 
        id, 
        name: name.trim(), 
        role: 'trainer', 
        clients: [] 
      };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainer));
      setCurrentUser(trainer);
      setStudents([]);
      console.log('[AppContext] Trainer registered successfully (local)', trainer.id);
    } catch (error: any) {
      console.error('[AppContext] Registration error:', error);
      const message = error?.message || error?.toString() || 'Error al registrar';
      throw new Error(message);
    }
  }, [getKey]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log('[AppContext] Logging in (local):', username);
      const usersData = await AsyncStorage.getItem(getKey('USERS'));
      const users: StoredUser[] = usersData ? JSON.parse(usersData) : [];
      
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
      if (!user) {
        console.log('[AppContext] User not found:', username);
        throw new Error('Credenciales inválidas');
      }
      
      if (user.password !== password) {
        console.log('[AppContext] Invalid password for user:', username);
        throw new Error('Credenciales inválidas');
      }

      console.log('[AppContext] Login successful for user:', user.id, 'role:', user.role);

      if (user.role === 'trainer') {
        const studentsData = await AsyncStorage.getItem(getKey('STUDENTS'));
        const allStudents: Student[] = studentsData ? JSON.parse(studentsData) : [];
        const trainerStudents = allStudents.filter(s => s.trainerId === user.id);
        setStudents(trainerStudents);
        
        const trainer: Trainer = { id: user.id, name: user.name, role: 'trainer', clients: trainerStudents };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(trainer));
        setCurrentUser(trainer);
        console.log('[AppContext] Loaded', trainerStudents.length, 'students for trainer');
      } else if (user.role === 'student') {
        const student: Student = { id: user.id, name: user.name, role: 'student', trainerId: user.trainerId ?? '' };
        await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(student));
        setCurrentUser(student);
        
        const [workoutsData, dietsData] = await Promise.all([
          AsyncStorage.getItem(getKey('WORKOUTS')),
          AsyncStorage.getItem(getKey('DIETS')),
        ]);
        const allWorkouts: WorkoutPlan[] = workoutsData ? JSON.parse(workoutsData) : [];
        const allDiets: DietPlan[] = dietsData ? JSON.parse(dietsData) : [];
        const studentWorkouts = allWorkouts.filter(w => w.studentId === user.id);
        const studentDiets = allDiets.filter(d => d.studentId === user.id);
        setWorkoutPlans(studentWorkouts);
        setDietPlans(studentDiets);
        console.log('[AppContext] Loaded plans for student');
      }
    } catch (error: any) {
      console.error('[AppContext] Login error:', error);
      const message = error?.message || error?.toString() || 'Error al iniciar sesión';
      throw new Error(message);
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

    console.log('[AppContext] Creating student account (local):', data.username);
    
    const usersData = await AsyncStorage.getItem(getKey('USERS'));
    const users: StoredUser[] = usersData ? JSON.parse(usersData) : [];
    
    const exists = users.find(u => u.username.toLowerCase() === data.username.toLowerCase().trim());
    if (exists) {
      console.log('[AppContext] Student username already exists:', data.username);
      throw new Error('Usuario ya existe');
    }

    const id = `student_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newUser: StoredUser = {
      id,
      username: data.username.toLowerCase().trim(),
      password: data.password,
      name: data.name.trim(),
      role: 'student',
      trainerId: currentUser.id,
    };
    
    users.push(newUser);
    await AsyncStorage.setItem(getKey('USERS'), JSON.stringify(users));

    const student: Student = {
      id,
      name: data.name.trim(),
      role: 'student',
      trainerId: currentUser.id,
      loginUsername: data.username.toLowerCase().trim(),
      loginPassword: data.password,
    };

    const studentsData = await AsyncStorage.getItem(getKey('STUDENTS'));
    const allStudents: Student[] = studentsData ? JSON.parse(studentsData) : [];
    allStudents.push(student);
    await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(allStudents));

    const updated = [...students, student];
    setStudents(updated);

    if (currentUser?.role === 'trainer') {
      const updatedTrainer: Trainer = { ...(currentUser as Trainer), clients: updated };
      await AsyncStorage.setItem(getKey('CURRENT_USER'), JSON.stringify(updatedTrainer));
      setCurrentUser(updatedTrainer);
    }

    console.log('[AppContext] Student account created successfully (local):', student.id);
    return student;
  }, [currentUser, students, getKey]);

  const addWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    try {
      const workoutsData = await AsyncStorage.getItem(getKey('WORKOUTS'));
      const allWorkouts: WorkoutPlan[] = workoutsData ? JSON.parse(workoutsData) : [];
      allWorkouts.push(plan);
      await AsyncStorage.setItem(getKey('WORKOUTS'), JSON.stringify(allWorkouts));
      const updated = [...workoutPlans, plan];
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error adding workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const updateWorkoutPlan = useCallback(async (planId: string, updates: Partial<WorkoutPlan>) => {
    try {
      const workoutsData = await AsyncStorage.getItem(getKey('WORKOUTS'));
      const allWorkouts: WorkoutPlan[] = workoutsData ? JSON.parse(workoutsData) : [];
      const updatedAll = allWorkouts.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('WORKOUTS'), JSON.stringify(updatedAll));
      const updated = workoutPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error updating workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const addDietPlan = useCallback(async (plan: DietPlan) => {
    try {
      const dietsData = await AsyncStorage.getItem(getKey('DIETS'));
      const allDiets: DietPlan[] = dietsData ? JSON.parse(dietsData) : [];
      allDiets.push(plan);
      await AsyncStorage.setItem(getKey('DIETS'), JSON.stringify(allDiets));
      const updated = [...dietPlans, plan];
      setDietPlans(updated);
    } catch (error) {
      console.error('Error adding diet plan:', error);
    }
  }, [dietPlans, getKey]);

  const updateDietPlan = useCallback(async (planId: string, updates: Partial<DietPlan>) => {
    try {
      const dietsData = await AsyncStorage.getItem(getKey('DIETS'));
      const allDiets: DietPlan[] = dietsData ? JSON.parse(dietsData) : [];
      const updatedAll = allDiets.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      await AsyncStorage.setItem(getKey('DIETS'), JSON.stringify(updatedAll));
      const updated = dietPlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      );
      setDietPlans(updated);
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
      const studentsData = await AsyncStorage.getItem(getKey('STUDENTS'));
      const allStudents: Student[] = studentsData ? JSON.parse(studentsData) : [];
      allStudents.push(student);
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(allStudents));
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
  }, [students, currentUser, getKey]);

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const studentsData = await AsyncStorage.getItem(getKey('STUDENTS'));
      const allStudents: Student[] = studentsData ? JSON.parse(studentsData) : [];
      const updatedAll = allStudents.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updatedAll));
      const updated = students.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      );
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
  }, [students, currentUser, getKey]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const studentsData = await AsyncStorage.getItem(getKey('STUDENTS'));
      const allStudents: Student[] = studentsData ? JSON.parse(studentsData) : [];
      const updatedAll = allStudents.filter(s => s.id !== studentId);
      await AsyncStorage.setItem(getKey('STUDENTS'), JSON.stringify(updatedAll));
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
  }, [students, currentUser, getKey]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    try {
      const workoutsData = await AsyncStorage.getItem(getKey('WORKOUTS'));
      const allWorkouts: WorkoutPlan[] = workoutsData ? JSON.parse(workoutsData) : [];
      const updatedAll = allWorkouts.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('WORKOUTS'), JSON.stringify(updatedAll));
      const updated = workoutPlans.filter(p => p.id !== planId);
      setWorkoutPlans(updated);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
    }
  }, [workoutPlans, getKey]);

  const deleteDietPlan = useCallback(async (planId: string) => {
    try {
      const dietsData = await AsyncStorage.getItem(getKey('DIETS'));
      const allDiets: DietPlan[] = dietsData ? JSON.parse(dietsData) : [];
      const updatedAll = allDiets.filter(p => p.id !== planId);
      await AsyncStorage.setItem(getKey('DIETS'), JSON.stringify(updatedAll));
      const updated = dietPlans.filter(p => p.id !== planId);
      setDietPlans(updated);
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
    isAdminAuthed,
    adminLogin,
    adminLogout,
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
    isAdminAuthed,
    adminLogin,
    adminLogout,
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
