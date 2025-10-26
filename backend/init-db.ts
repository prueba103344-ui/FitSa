import { readDB, writeDB, DBData } from './db';
import { mockStudents, mockWorkoutPlans, mockDietPlans, mockProgress } from '@/data/mockData';

export async function initializeDatabase() {
  try {
    const db = await readDB();
    
    let needsUpdate = false;

    if (!db.students || db.students.length === 0) {
      console.log('📝 Inicializando estructura de estudiantes...');
      db.students = mockStudents;
      needsUpdate = true;
    }

    if (!db.workouts || db.workouts.length === 0) {
      console.log('💪 Inicializando estructura de entrenamientos...');
      db.workouts = mockWorkoutPlans;
      needsUpdate = true;
    }

    if (!db.diets || db.diets.length === 0) {
      console.log('🍽️ Inicializando estructura de dietas...');
      db.diets = mockDietPlans;
      needsUpdate = true;
    }

    if (!(db as any).progress || (db as any).progress.length === 0) {
      console.log('📊 Inicializando estructura de progreso...');
      (db as any).progress = mockProgress;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await writeDB(db as DBData);
      console.log('✅ Base de datos inicializada y guardada en archivo');
    } else {
      console.log('✅ Base de datos cargada desde archivo');
    }

    console.log(`📊 Estado actual: ${db.workouts?.length || 0} entrenamientos, ${db.diets?.length || 0} dietas`);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}
