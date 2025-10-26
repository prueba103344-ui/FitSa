import { promises as fs } from 'fs';
import path from 'path';
import { DietPlan, WorkoutPlan, Student, Trainer } from '@/types';
import crypto from 'crypto';

export type StoredUser = {
  id: string;
  username: string;
  name: string;
  role: 'trainer' | 'student';
  trainerId?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type DBData = {
  users: StoredUser[];
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
    const empty: DBData = { users: [], students: [], diets: [], workouts: [], media: [] };
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
  }
}

export async function readDB(): Promise<DBData> {
  await ensureFile();
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as Partial<DBData>;
    return {
      users: parsed.users ?? [],
      students: parsed.students ?? [],
      diets: parsed.diets ?? [],
      workouts: parsed.workouts ?? [],
      media: parsed.media ?? [],
    };
  } catch {
    const empty: DBData = { users: [], students: [], diets: [], workouts: [], media: [] };
    await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
    return empty;
  }
}

export async function writeDB(data: DBData): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { salt: s, hash };
}
