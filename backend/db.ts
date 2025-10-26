import { promises as fs } from 'fs';
import path from 'path';
import { DietPlan, WorkoutPlan, Student } from '@/types';

export type DBData = {
  students: Student[];
  diets: DietPlan[];
  workouts: WorkoutPlan[];
  media: { id: string; studentId: string; uri: string; createdAt: string; type: 'photo' | 'video' }[];
};

const DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');

async function ensureFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    const empty: DBData = { students: [], diets: [], workouts: [], media: [] };
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
  }
}

export async function readDB(): Promise<DBData> {
  await ensureFile();
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(raw) as DBData;
  } catch {
    const empty: DBData = { students: [], diets: [], workouts: [], media: [] };
    await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
    return empty;
  }
}

export async function writeDB(data: DBData): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
