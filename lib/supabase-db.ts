import { getSession } from '@/lib/supabase';
import { DietPlan, Student, WorkoutPlan } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://bodfawufyjcplkxgyqzb.supabase.co';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZGZhd3VmeWpjcGxreGd5cXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDYyNTIsImV4cCI6MjA3NzEyMjI1Mn0.-joelNsNO1DIGmH5CYSoxlqoDTgKcFoX-En5HTX89S8';

function assertCreds() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Supabase no configurado');
  }
}

async function authHeaders() {
  assertCreds();
  const session = await getSession();
  return {
    apikey: SUPABASE_ANON,
    Authorization: session ? `${session.token_type} ${session.access_token}` : '',
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

async function rest(path: string, init?: RequestInit) {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Supabase REST] ${res.status} ${res.statusText} - ${text}`);
  }
  if (res.status === 204) return null as unknown as any;
  return res.json();
}

export type ProfileRow = {
  id: string;
  role: 'trainer' | 'student';
  name: string;
  trainer_id?: string | null;
  avatar?: string | null;
  created_at?: string;
};

export const supaDB = {
  async upsertProfile(p: ProfileRow) {
    await rest('profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(p),
    });
    return p;
  },
  async getProfile(id: string): Promise<ProfileRow | null> {
    const rows: ProfileRow[] = await rest(`profiles?id=eq.${encodeURIComponent(id)}&select=*`);
    return rows?.[0] ?? null;
  },

  async listStudentsByTrainer(trainerId: string): Promise<Student[]> {
    const rows = await rest(`students?trainerId=eq.${encodeURIComponent(trainerId)}&select=*`);
    return rows as Student[];
  },
  async upsertStudent(student: Student): Promise<Student> {
    await rest('students', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(student),
    });
    return student;
  },
  async deleteStudent(id: string) {
    await rest(`students?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true } as const;
  },

  async listWorkoutsByStudent(studentId: string): Promise<WorkoutPlan[]> {
    const rows = await rest(`workouts?studentId=eq.${encodeURIComponent(studentId)}&select=*`);
    return rows as WorkoutPlan[];
  },
  async upsertWorkout(plan: WorkoutPlan): Promise<WorkoutPlan> {
    await rest('workouts', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(plan),
    });
    return plan;
  },
  async updateWorkout(id: string, updates: Partial<WorkoutPlan>) {
    await rest(`workouts?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async deleteWorkout(id: string) {
    await rest(`workouts?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true } as const;
  },

  async listDietsByStudent(studentId: string): Promise<DietPlan[]> {
    const rows = await rest(`diets?studentId=eq.${encodeURIComponent(studentId)}&select=*`);
    return rows as DietPlan[];
  },
  async upsertDiet(plan: DietPlan): Promise<DietPlan> {
    await rest('diets', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(plan),
    });
    return plan;
  },
  async updateDiet(id: string, updates: Partial<DietPlan>) {
    await rest(`diets?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async deleteDiet(id: string) {
    await rest(`diets?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true } as const;
  },

  async listMediaByStudent(studentId: string) {
    const rows = await rest(`media?studentId=eq.${encodeURIComponent(studentId)}&select=*`);
    return rows as { id: string; studentId: string; uri: string; createdAt: string; type: 'photo' | 'video' }[];
  },
  async addMedia(row: { id: string; studentId: string; uri: string; createdAt: string; type: 'photo' | 'video' }) {
    await rest('media', { method: 'POST', body: JSON.stringify(row) });
    return row;
  },
  async removeMedia(id: string) {
    await rest(`media?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true } as const;
  },
};
