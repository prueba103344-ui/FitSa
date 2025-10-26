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

const today = new Date();
const getDateDaysAgo = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const mockWorkoutPlans: WorkoutPlan[] = [
  {
    id: 'workout-week1',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 1',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(49),
    exercises: [
      {
        id: 'ex1-w1',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 55, completed: true, actualReps: 10, actualWeight: 55 },
          { set: 2, reps: 8, weight: 60, completed: true, actualReps: 8, actualWeight: 60 },
          { set: 3, reps: 6, weight: 65, completed: true, actualReps: 6, actualWeight: 65 },
        ],
        notes: 'Mantén la espalda pegada al banco',
      },
      {
        id: 'ex2-w1',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 70, completed: true, actualReps: 12, actualWeight: 70 },
          { set: 2, reps: 10, weight: 75, completed: true, actualReps: 10, actualWeight: 75 },
          { set: 3, reps: 8, weight: 80, completed: true, actualReps: 8, actualWeight: 80 },
        ],
        notes: 'Profundidad completa',
      },
      {
        id: 'ex3-w1',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 90, completed: true, actualReps: 8, actualWeight: 90 },
          { set: 2, reps: 6, weight: 100, completed: true, actualReps: 6, actualWeight: 100 },
          { set: 3, reps: 4, weight: 110, completed: true, actualReps: 4, actualWeight: 110 },
        ],
      },
      {
        id: 'ex4-w1',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 0, completed: true, actualReps: 8, actualWeight: 0 },
          { set: 2, reps: 6, weight: 0, completed: true, actualReps: 6, actualWeight: 0 },
          { set: 3, reps: 5, weight: 0, completed: true, actualReps: 5, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week2',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 2',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(42),
    exercises: [
      {
        id: 'ex1-w2',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 57, completed: true, actualReps: 10, actualWeight: 57 },
          { set: 2, reps: 8, weight: 62, completed: true, actualReps: 8, actualWeight: 62 },
          { set: 3, reps: 6, weight: 67, completed: true, actualReps: 5, actualWeight: 67 },
        ],
      },
      {
        id: 'ex2-w2',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 72, completed: true, actualReps: 12, actualWeight: 72 },
          { set: 2, reps: 10, weight: 77, completed: true, actualReps: 10, actualWeight: 77 },
          { set: 3, reps: 8, weight: 82, completed: true, actualReps: 8, actualWeight: 82 },
        ],
      },
      {
        id: 'ex3-w2',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 95, completed: true, actualReps: 8, actualWeight: 95 },
          { set: 2, reps: 6, weight: 105, completed: true, actualReps: 6, actualWeight: 105 },
          { set: 3, reps: 4, weight: 115, completed: true, actualReps: 4, actualWeight: 115 },
        ],
      },
      {
        id: 'ex4-w2',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 9, weight: 0, completed: true, actualReps: 9, actualWeight: 0 },
          { set: 2, reps: 7, weight: 0, completed: true, actualReps: 7, actualWeight: 0 },
          { set: 3, reps: 5, weight: 0, completed: true, actualReps: 5, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week3',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 3',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(35),
    exercises: [
      {
        id: 'ex1-w3',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 58, completed: true, actualReps: 10, actualWeight: 58 },
          { set: 2, reps: 8, weight: 63, completed: true, actualReps: 8, actualWeight: 63 },
          { set: 3, reps: 6, weight: 68, completed: true, actualReps: 6, actualWeight: 68 },
        ],
      },
      {
        id: 'ex2-w3',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 75, completed: true, actualReps: 12, actualWeight: 75 },
          { set: 2, reps: 10, weight: 80, completed: true, actualReps: 10, actualWeight: 80 },
          { set: 3, reps: 8, weight: 85, completed: true, actualReps: 8, actualWeight: 85 },
        ],
      },
      {
        id: 'ex3-w3',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 98, completed: true, actualReps: 8, actualWeight: 98 },
          { set: 2, reps: 6, weight: 108, completed: true, actualReps: 6, actualWeight: 108 },
          { set: 3, reps: 4, weight: 118, completed: true, actualReps: 4, actualWeight: 118 },
        ],
      },
      {
        id: 'ex4-w3',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 0, completed: true, actualReps: 10, actualWeight: 0 },
          { set: 2, reps: 8, weight: 0, completed: true, actualReps: 8, actualWeight: 0 },
          { set: 3, reps: 6, weight: 0, completed: true, actualReps: 6, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week4',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 4',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(28),
    exercises: [
      {
        id: 'ex1-w4',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 60, completed: true, actualReps: 10, actualWeight: 60 },
          { set: 2, reps: 8, weight: 65, completed: true, actualReps: 8, actualWeight: 65 },
          { set: 3, reps: 6, weight: 70, completed: true, actualReps: 6, actualWeight: 70 },
        ],
      },
      {
        id: 'ex2-w4',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 78, completed: true, actualReps: 12, actualWeight: 78 },
          { set: 2, reps: 10, weight: 83, completed: true, actualReps: 10, actualWeight: 83 },
          { set: 3, reps: 8, weight: 88, completed: true, actualReps: 8, actualWeight: 88 },
        ],
      },
      {
        id: 'ex3-w4',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 102, completed: true, actualReps: 8, actualWeight: 102 },
          { set: 2, reps: 6, weight: 112, completed: true, actualReps: 6, actualWeight: 112 },
          { set: 3, reps: 4, weight: 122, completed: true, actualReps: 4, actualWeight: 122 },
        ],
      },
      {
        id: 'ex4-w4',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 11, weight: 0, completed: true, actualReps: 11, actualWeight: 0 },
          { set: 2, reps: 9, weight: 0, completed: true, actualReps: 9, actualWeight: 0 },
          { set: 3, reps: 7, weight: 0, completed: true, actualReps: 7, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week5',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 5',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(21),
    exercises: [
      {
        id: 'ex1-w5',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 62, completed: true, actualReps: 10, actualWeight: 62 },
          { set: 2, reps: 8, weight: 67, completed: true, actualReps: 8, actualWeight: 67 },
          { set: 3, reps: 6, weight: 72, completed: true, actualReps: 6, actualWeight: 72 },
        ],
      },
      {
        id: 'ex2-w5',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 80, completed: true, actualReps: 12, actualWeight: 80 },
          { set: 2, reps: 10, weight: 85, completed: true, actualReps: 10, actualWeight: 85 },
          { set: 3, reps: 8, weight: 90, completed: true, actualReps: 8, actualWeight: 90 },
        ],
      },
      {
        id: 'ex3-w5',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 105, completed: true, actualReps: 8, actualWeight: 105 },
          { set: 2, reps: 6, weight: 115, completed: true, actualReps: 6, actualWeight: 115 },
          { set: 3, reps: 4, weight: 125, completed: true, actualReps: 4, actualWeight: 125 },
        ],
      },
      {
        id: 'ex4-w5',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 0, completed: true, actualReps: 12, actualWeight: 0 },
          { set: 2, reps: 10, weight: 0, completed: true, actualReps: 10, actualWeight: 0 },
          { set: 3, reps: 8, weight: 0, completed: true, actualReps: 8, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week6',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 6',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(14),
    exercises: [
      {
        id: 'ex1-w6',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 63, completed: true, actualReps: 10, actualWeight: 63 },
          { set: 2, reps: 8, weight: 68, completed: true, actualReps: 8, actualWeight: 68 },
          { set: 3, reps: 6, weight: 73, completed: true, actualReps: 6, actualWeight: 73 },
        ],
      },
      {
        id: 'ex2-w6',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 82, completed: true, actualReps: 12, actualWeight: 82 },
          { set: 2, reps: 10, weight: 87, completed: true, actualReps: 10, actualWeight: 87 },
          { set: 3, reps: 8, weight: 92, completed: true, actualReps: 8, actualWeight: 92 },
        ],
      },
      {
        id: 'ex3-w6',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 108, completed: true, actualReps: 8, actualWeight: 108 },
          { set: 2, reps: 6, weight: 118, completed: true, actualReps: 6, actualWeight: 118 },
          { set: 3, reps: 4, weight: 128, completed: true, actualReps: 4, actualWeight: 128 },
        ],
      },
      {
        id: 'ex4-w6',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 0, completed: true, actualReps: 12, actualWeight: 0 },
          { set: 2, reps: 10, weight: 0, completed: true, actualReps: 10, actualWeight: 0 },
          { set: 3, reps: 9, weight: 0, completed: true, actualReps: 9, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout-week7',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Semana 7',
    daysOfWeek: [1, 3, 5],
    createdAt: getDateDaysAgo(7),
    exercises: [
      {
        id: 'ex1-w7',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 65, completed: true, actualReps: 10, actualWeight: 65 },
          { set: 2, reps: 8, weight: 70, completed: true, actualReps: 8, actualWeight: 70 },
          { set: 3, reps: 6, weight: 75, completed: true, actualReps: 6, actualWeight: 75 },
        ],
      },
      {
        id: 'ex2-w7',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 85, completed: true, actualReps: 12, actualWeight: 85 },
          { set: 2, reps: 10, weight: 90, completed: true, actualReps: 10, actualWeight: 90 },
          { set: 3, reps: 8, weight: 95, completed: true, actualReps: 8, actualWeight: 95 },
        ],
      },
      {
        id: 'ex3-w7',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 110, completed: true, actualReps: 8, actualWeight: 110 },
          { set: 2, reps: 6, weight: 120, completed: true, actualReps: 6, actualWeight: 120 },
          { set: 3, reps: 4, weight: 130, completed: true, actualReps: 4, actualWeight: 130 },
        ],
      },
      {
        id: 'ex4-w7',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 13, weight: 0, completed: true, actualReps: 13, actualWeight: 0 },
          { set: 2, reps: 11, weight: 0, completed: true, actualReps: 11, actualWeight: 0 },
          { set: 3, reps: 9, weight: 0, completed: true, actualReps: 9, actualWeight: 0 },
        ],
      },
    ],
  },
  {
    id: 'workout1',
    studentId: 'student1',
    name: 'Rutina de Fuerza - Día A',
    daysOfWeek: [1, 3, 5],
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: 'ex1',
        name: 'Press Banca',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 67, completed: false },
          { set: 2, reps: 8, weight: 72, completed: false },
          { set: 3, reps: 6, weight: 77, completed: false },
        ],
        notes: 'Mantén la espalda pegada al banco',
      },
      {
        id: 'ex2',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 87, completed: false },
          { set: 2, reps: 10, weight: 92, completed: false },
          { set: 3, reps: 8, weight: 97, completed: false },
        ],
        notes: 'Profundidad completa',
      },
      {
        id: 'ex3',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 112, completed: false },
          { set: 2, reps: 6, weight: 122, completed: false },
          { set: 3, reps: 4, weight: 132, completed: false },
        ],
      },
      {
        id: 'ex4',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 14, weight: 0, completed: false },
          { set: 2, reps: 12, weight: 0, completed: false },
          { set: 3, reps: 10, weight: 0, completed: false },
        ],
      },
    ],
  },
];

export const mockDietPlans: DietPlan[] = [
  {
    id: 'diet1',
    studentId: 'student1',
    totalCalories: 2800,
    totalProtein: 180,
    totalCarbs: 320,
    totalFat: 80,
    createdAt: new Date().toISOString(),
    meals: [
      {
        id: 'meal1',
        name: 'Bowl de Avena con Proteína',
        type: 'breakfast',
        time: '08:00',
        prepTime: 10,
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800',
        description: 'Desayuno energético rico en proteínas y carbohidratos complejos',
        foods: [
          { 
            name: 'Bowl de Avena', 
            calories: 545, 
            protein: 21, 
            carbs: 73, 
            fat: 21, 
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=400&fit=crop'
          },
        ],
        ingredients: [
          { name: 'Avena', quantity: 80, unit: 'g', icon: '🌾' },
          { name: 'Leche desnatada', quantity: 250, unit: 'ml', icon: '🥛' },
          { name: 'Plátano', quantity: 1, unit: 'unidad', icon: '🍌' },
          { name: 'Mantequilla de cacahuete', quantity: 20, unit: 'g', icon: '🥜' },
          { name: 'Miel', quantity: 10, unit: 'g', icon: '🍯' },
        ],
        directions: [
          { step: 1, instruction: 'Calienta la leche en el microondas durante 1-2 minutos.' },
          { step: 2, instruction: 'Añade la avena a la leche caliente y mezcla bien.' },
          { step: 3, instruction: 'Deja reposar 2-3 minutos hasta que la avena absorba la leche.' },
          { step: 4, instruction: 'Corta el plátano en rodajas y colócalo encima.' },
          { step: 5, instruction: 'Añade la mantequilla de cacahuete y la miel por encima.' },
        ],
      },
      {
        id: 'meal2',
        name: 'Pollo Teriyaki con Arroz',
        type: 'lunch',
        time: '13:00',
        prepTime: 25,
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800',
        description: 'Almuerzo completo con proteína magra y vegetales',
        foods: [
          { 
            name: 'Pollo Teriyaki', 
            calories: 670, 
            protein: 66, 
            carbs: 56, 
            fat: 23, 
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop'
          },
        ],
        ingredients: [
          { name: 'Pechuga de pollo', quantity: 200, unit: 'g', icon: '🍗' },
          { name: 'Arroz integral', quantity: 100, unit: 'g', icon: '🍚' },
          { name: 'Brócoli', quantity: 150, unit: 'g', icon: '🥦' },
          { name: 'Salsa teriyaki', quantity: 30, unit: 'ml', icon: '🥢' },
          { name: 'Aceite de oliva', quantity: 10, unit: 'ml', icon: '🫒' },
          { name: 'Ajo', quantity: 2, unit: 'dientes', icon: '🧄' },
        ],
        directions: [
          { step: 1, instruction: 'Cocina el arroz integral según las instrucciones del paquete.' },
          { step: 2, instruction: 'Corta el pollo en tiras y sazónalo con sal y pimienta.' },
          { step: 3, instruction: 'Calienta el aceite en una sartén y añade el ajo picado.' },
          { step: 4, instruction: 'Cocina el pollo hasta que esté dorado por todos los lados.' },
          { step: 5, instruction: 'Añade el brócoli y cocina 3-4 minutos.' },
          { step: 6, instruction: 'Vierte la salsa teriyaki y cocina 2 minutos más.' },
          { step: 7, instruction: 'Sirve el pollo y vegetales sobre el arroz.' },
        ],
      },
      {
        id: 'meal3',
        name: 'Batido Pre-Entreno',
        type: 'snack',
        time: '17:00',
        prepTime: 5,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800',
        description: 'Energía rápida antes del entrenamiento',
        foods: [
          { 
            name: 'Batido Energético', 
            calories: 215, 
            protein: 24, 
            carbs: 28, 
            fat: 1, 
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop'
          },
        ],
        ingredients: [
          { name: 'Proteína en polvo', quantity: 30, unit: 'g', icon: '💪' },
          { name: 'Manzana', quantity: 1, unit: 'unidad', icon: '🍎' },
          { name: 'Agua', quantity: 300, unit: 'ml', icon: '💧' },
          { name: 'Hielo', quantity: 5, unit: 'cubos', icon: '🧊' },
        ],
        directions: [
          { step: 1, instruction: 'Corta la manzana en trozos pequeños.' },
          { step: 2, instruction: 'Añade todos los ingredientes a la batidora.' },
          { step: 3, instruction: 'Bate durante 30-45 segundos hasta que esté suave.' },
          { step: 4, instruction: 'Sirve inmediatamente y consume 30 minutos antes de entrenar.' },
        ],
      },
      {
        id: 'meal4',
        name: 'Salmón con Espárragos',
        type: 'dinner',
        time: '21:00',
        prepTime: 20,
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
        description: 'Cena ligera rica en omega-3 y proteínas',
        foods: [
          { 
            name: 'Salmón al Horno', 
            calories: 587, 
            protein: 48, 
            carbs: 49, 
            fat: 22, 
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'
          },
        ],
        ingredients: [
          { name: 'Filete de salmón', quantity: 200, unit: 'g', icon: '🐟' },
          { name: 'Espárragos', quantity: 200, unit: 'g', icon: '🌿' },
          { name: 'Patata dulce', quantity: 150, unit: 'g', icon: '🍠' },
          { name: 'Limón', quantity: 1, unit: 'unidad', icon: '🍋' },
          { name: 'Aceite de oliva', quantity: 10, unit: 'ml', icon: '🫒' },
          { name: 'Sal y pimienta', quantity: 1, unit: 'al gusto', icon: '🧂' },
        ],
        directions: [
          { step: 1, instruction: 'Precalienta el horno a 200°C.' },
          { step: 2, instruction: 'Coloca el salmón en una bandeja de horno con papel.' },
          { step: 3, instruction: 'Rocía con aceite de oliva y jugo de limón.' },
          { step: 4, instruction: 'Sazona con sal y pimienta al gusto.' },
          { step: 5, instruction: 'Hornea durante 12-15 minutos hasta que esté cocido.' },
          { step: 6, instruction: 'Mientras tanto, hierve la patata dulce cortada en cubos.' },
          { step: 7, instruction: 'Saltea los espárragos en una sartén con aceite durante 5 minutos.' },
          { step: 8, instruction: 'Sirve el salmón con los espárragos y la patata.' },
        ],
      },
      {
        id: 'meal5',
        name: 'Snack Proteico Nocturno',
        type: 'snack',
        time: '23:00',
        prepTime: 2,
        imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800',
        description: 'Proteína de digestión lenta para la noche',
        foods: [
          { 
            name: 'Queso y Nueces', 
            calories: 348, 
            protein: 32, 
            carbs: 10, 
            fat: 20, 
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop'
          },
        ],
        ingredients: [
          { name: 'Queso cottage', quantity: 150, unit: 'g', icon: '🧀' },
          { name: 'Nueces', quantity: 30, unit: 'g', icon: '🌰' },
          { name: 'Canela', quantity: 1, unit: 'pizca', icon: '✨' },
        ],
        directions: [
          { step: 1, instruction: 'Coloca el queso cottage en un bowl.' },
          { step: 2, instruction: 'Añade las nueces troceadas por encima.' },
          { step: 3, instruction: 'Espolvorea con canela al gusto.' },
        ],
      },
    ],
  },
];

export const mockProgress: DailyProgress[] = [
  {
    date: getDateDaysAgo(49).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 82,
  },
  {
    date: getDateDaysAgo(42).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 80,
  },
  {
    date: getDateDaysAgo(35).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 78,
  },
  {
    date: getDateDaysAgo(28).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 4,
    totalMeals: 5,
    weight: 79,
  },
  {
    date: getDateDaysAgo(21).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 77,
  },
  {
    date: getDateDaysAgo(14).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 76,
  },
  {
    date: getDateDaysAgo(7).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 75,
  },
  {
    date: getDateDaysAgo(6).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 75,
  },
  {
    date: getDateDaysAgo(5).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 4,
    totalMeals: 5,
    weight: 74.5,
  },
  {
    date: getDateDaysAgo(4).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 74,
  },
  {
    date: getDateDaysAgo(3).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 73.5,
  },
  {
    date: getDateDaysAgo(2).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 5,
    totalMeals: 5,
    weight: 73,
  },
  {
    date: getDateDaysAgo(1).split('T')[0],
    studentId: 'student1',
    workoutCompleted: true,
    mealsCompleted: 4,
    totalMeals: 5,
    weight: 73,
  },
  {
    date: new Date().toISOString().split('T')[0],
    studentId: 'student1',
    workoutCompleted: false,
    mealsCompleted: 0,
    totalMeals: 5,
    weight: 73,
  },
];
