import { Trainer, Student, WorkoutPlan, DietPlan, DailyProgress } from '@/types';

export const mockStudents: Student[] = [
  {
    id: 'student1',
    name: 'Carlos Pérez',
    role: 'student',
    trainerId: 'trainer1',
    weight: 78,
    height: 180,
    age: 28,
    email: 'carlos.perez@email.com',
    phone: '+34 612 345 678',
    goal: 'Ganar masa muscular y mejorar fuerza',
    medicalNotes: 'Sin lesiones previas',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
  },
];

export const mockTrainer: Trainer = {
  id: 'trainer1',
  name: 'Laura FitCoach',
  role: 'trainer',
  clients: mockStudents,
  avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop',
};

export const mockStudent: Student = mockStudents[0];

export const mockWorkoutPlans: WorkoutPlan[] = [];

export const mockDietPlans: DietPlan[] = [];

export const mockProgress: DailyProgress[] = [];
