import { readDB, writeDB, DBData } from './db';
import { mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';

export async function initializeDatabase() {
  try {
    const db = await readDB();
    
    let needsUpdate = false;
    let isFirstRun = false;

    if (!db.students) {
      console.log('📝 Inicializando estructura de estudiantes (primera ejecución)...');
      db.students = mockStudents;
      needsUpdate = true;
      isFirstRun = true;
    }

    if (!db.workouts) {
      console.log('💪 Inicializando estructura de entrenamientos (primera ejecución)...');
      db.workouts = mockWorkoutPlans;
      needsUpdate = true;
      isFirstRun = true;
    }

    if (!db.diets) {
      console.log('🍽️ Inicializando estructura de dietas (primera ejecución)...');
      db.diets = mockDietPlans;
      needsUpdate = true;
      isFirstRun = true;
    }

    if (!(db as any).progress) {
      console.log('📊 Inicializando estructura de progreso (primera ejecución)...');
      (db as any).progress = mockProgress;
      needsUpdate = true;
      isFirstRun = true;
    }

    if (needsUpdate) {
      await writeDB(db as DBData);
      if (isFirstRun) {
        console.log('✅ Base de datos inicializada con datos de ejemplo y guardada en archivo');
      } else {
        console.log('✅ Base de datos guardada');
      }
    } else {
      console.log('✅ Base de datos cargada desde archivo');
    }

    console.log(`📊 Estado actual: ${db.students?.length || 0} estudiantes, ${db.workouts?.length || 0} entrenamientos, ${db.diets?.length || 0} dietas`);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}
