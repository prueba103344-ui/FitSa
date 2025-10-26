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
    avatar: undefined,
  },
];

export const mockTrainer: Trainer = {
  id: 'trainer1',
  name: 'Laura FitCoach',
  role: 'trainer',
  clients: mockStudents,
  avatar: undefined,
};

export const mockStudent: Student = mockStudents[0];

export const mockWorkoutPlans: WorkoutPlan[] = [
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
          { set: 1, reps: 10, weight: 60, completed: false },
          { set: 2, reps: 8, weight: 65, completed: false },
          { set: 3, reps: 6, weight: 70, completed: false },
        ],
        notes: 'Mantén la espalda pegada al banco',
      },
      {
        id: 'ex2',
        name: 'Sentadilla',
        imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 12, weight: 80, completed: false },
          { set: 2, reps: 10, weight: 85, completed: false },
          { set: 3, reps: 8, weight: 90, completed: false },
        ],
        notes: 'Profundidad completa',
      },
      {
        id: 'ex3',
        name: 'Peso Muerto',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 8, weight: 100, completed: false },
          { set: 2, reps: 6, weight: 110, completed: false },
          { set: 3, reps: 4, weight: 120, completed: false },
        ],
      },
      {
        id: 'ex4',
        name: 'Dominadas',
        imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
        sets: [
          { set: 1, reps: 10, weight: 0, completed: false },
          { set: 2, reps: 8, weight: 0, completed: false },
          { set: 3, reps: 6, weight: 0, completed: false },
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
    date: new Date().toISOString().split('T')[0],
    studentId: 'student1',
    workoutCompleted: false,
    mealsCompleted: 0,
    totalMeals: 5,
    weight: 78,
  },
];
