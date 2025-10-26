import { DietPlan, WorkoutPlan, Student } from '@/types';
import fs from 'fs';
import path from 'path';

export type DBData = {
  students: Student[];
  diets: DietPlan[];
  workouts: WorkoutPlan[];
  media: { id: string; studentId: string; uri: string; createdAt: string; type: 'photo' | 'video' }[];
  progress?: any[];
};

const DB_PATH = path.join(process.cwd(), 'data.json');

let memoryDB: DBData | null = null;

export async function readDB(): Promise<DBData> {
  if (memoryDB) {
    return memoryDB;
  }

  try {
    if (fs.existsSync(DB_PATH)) {
      const data = await fs.promises.readFile(DB_PATH, 'utf-8');
      memoryDB = JSON.parse(data);
      console.log('✅ Base de datos cargada desde archivo');
      return memoryDB!;
    }
  } catch (error) {
    console.error('⚠️ Error leyendo base de datos:', error);
  }

  memoryDB = {
    students: [],
    diets: [],
    workouts: [],
    media: [],
    progress: [],
  };
  
  return memoryDB;
}

export async function writeDB(data: DBData): Promise<void> {
  memoryDB = data;
  
  try {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Base de datos guardada en archivo (${data.students?.length || 0} estudiantes, ${data.workouts?.length || 0} entrenamientos, ${data.diets?.length || 0} dietas)`);
  } catch (error) {
    console.error('❌ Error guardando base de datos:', error);
    throw error;
  }
}
