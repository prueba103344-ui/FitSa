import { readDB, writeDB, DBData } from './db';
import { mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';

export async function initializeDatabase() {
  try {
    const db = await readDB();
    
    let needsUpdate = false;

    if (!db.students) {
      console.log('📝 Inicializando estructura de estudiantes...');
      db.students = mockStudents;
      needsUpdate = true;
    }

    if (!db.workouts) {
      console.log('💪 Inicializando estructura de entrenamientos...');
      db.workouts = mockWorkoutPlans;
      needsUpdate = true;
    }

    if (!db.diets) {
      console.log('🍽️ Inicializando estructura de dietas...');
      db.diets = mockDietPlans;
      needsUpdate = true;
    }

    if (!(db as any).progress) {
      console.log('📊 Inicializando estructura de progreso...');
      (db as any).progress = mockProgress;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await writeDB(db as DBData);
      console.log('✅ Base de datos inicializada');
    } else {
      console.log('✅ Base de datos lista');
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}
