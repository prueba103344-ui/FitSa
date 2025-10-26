export type UserRole = 'trainer' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Trainer extends User {
  role: 'trainer';
  clients: Student[];
}

export interface Student extends User {
  role: 'student';
  trainerId: string;
  weight?: number;
  height?: number;
  age?: number;
  email?: string;
  phone?: string;
  goal?: string;
  medicalNotes?: string;
}

export interface ExerciseSet {
  set: number;
  reps: number;
  weight: number;
  completed?: boolean;
  actualReps?: number;
  actualWeight?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  imageUrl?: string;
}

export interface WorkoutPlan {
  id: string;
  studentId: string;
  name: string;
  exercises: Exercise[];
  daysOfWeek: number[];
  createdAt: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  icon?: string;
}

export interface Direction {
  step: number;
  instruction: string;
  completed?: boolean;
}

export interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: number;
  unit?: 'g' | 'ml' | 'mg';
  completed?: boolean;
  imageUrl?: string;
  actualQuantity?: number;
  plannedQuantity?: number;
  plannedCalories?: number;
  plannedProtein?: number;
  plannedCarbs?: number;
  plannedFat?: number;
}

export interface Meal {
  id: string;
  name: string;
  foods: Food[];
  time?: string;
  imageUrl?: string;
  prepTime?: number;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients?: Ingredient[];
  directions?: Direction[];
  description?: string;
}

export interface DietPlan {
  id: string;
  studentId: string;
  name?: string;
  dayOfWeek?: number;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

export interface DailyProgress {
  date: string;
  studentId: string;
  workoutCompleted: boolean;
  mealsCompleted: number;
  totalMeals: number;
  weight?: number;
  notes?: string;
}

export interface ExerciseHistory {
  id: string;
  studentId: string;
  exerciseName: string;
  date: string;
  sets: ExerciseSet[];
}
