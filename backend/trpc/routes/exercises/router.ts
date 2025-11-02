import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB, ExerciseCatalogItem } from '@/backend/db';

const adminGuard = (inputKey?: string) => {
  const user = process.env.ADMIN_USER || process.env.EXPO_PUBLIC_ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || process.env.EXPO_PUBLIC_ADMIN_PASS || 'admin123';
  const expected = `${user}:${pass}`;
  return inputKey === expected;
};

const seedExercises: { name: string; imageUrl: string }[] = [
  { name: 'Press banca', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800' },
  { name: 'Sentadilla', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800' },
  { name: 'Peso muerto', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
  { name: 'Dominadas', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' },
  { name: 'Press militar', imageUrl: 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800' },
  { name: 'Remo con barra', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' },
  { name: 'Curl bíceps', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800' },
  { name: 'Fondos', imageUrl: 'https://images.unsplash.com/photo-1605296866985-34ba3c0bcaea?w=800' },
  { name: 'Zancadas', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa4df6a0?w=800' },
  { name: 'Aperturas con mancuernas', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa4df6a0?w=800' },
  { name: 'Elevaciones laterales', imageUrl: 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800' },
  { name: 'Gemelos de pie', imageUrl: 'https://images.unsplash.com/photo-1596357395104-5e4bba75a3c8?w=800' },
  { name: 'Face pull', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' },
  { name: 'Jalón al pecho', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa4df6a0?w=800' },
  { name: 'Crunch abdominal', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800' },
  { name: 'Mountain climbers', imageUrl: 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800' },
  { name: 'Plancha', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800' },
  { name: 'Hip thrust', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' },
  { name: 'Press inclinado', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800' },
  { name: 'Remo en polea', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' },
];

export default createTRPCRouter({
  list: publicProcedure.query(async () => {
    const db = await readDB();
    if (!db.exercises || db.exercises.length === 0) {
      const now = Date.now();
      db.exercises = seedExercises.map((it, i) => ({ id: `excat_${now}_${i}`, name: it.name, imageUrl: it.imageUrl }));
      await writeDB(db);
    }
    return db.exercises;
  }),
  upsert: publicProcedure.input(z.object({
    adminKey: z.string(),
    id: z.string().optional(),
    name: z.string().min(2),
    imageUrl: z.string().url(),
  })).mutation(async ({ input }) => {
    if (!adminGuard(input.adminKey)) throw new Error('No autorizado');
    const db = await readDB();
    if (input.id) {
      const idx = db.exercises.findIndex(e => e.id === input.id);
      if (idx < 0) throw new Error('Ejercicio no encontrado');
      db.exercises[idx] = { id: input.id, name: input.name, imageUrl: input.imageUrl } as ExerciseCatalogItem;
    } else {
      const id = `excat_${Date.now()}`;
      db.exercises.push({ id, name: input.name, imageUrl: input.imageUrl });
    }
    await writeDB(db);
    return { ok: true } as const;
  }),
  bulkReplace: publicProcedure.input(z.object({
    adminKey: z.string(),
    items: z.array(z.object({ name: z.string().min(2), imageUrl: z.string().url() }))
  })).mutation(async ({ input }) => {
    if (!adminGuard(input.adminKey)) throw new Error('No autorizado');
    const db = await readDB();
    const now = Date.now();
    db.exercises = input.items.map((it, i) => ({ id: `excat_${now}_${i}`, name: it.name, imageUrl: it.imageUrl }));
    await writeDB(db);
    return { ok: true, count: db.exercises.length } as const;
  }),
  remove: publicProcedure.input(z.object({ adminKey: z.string(), id: z.string() })).mutation(async ({ input }) => {
    if (!adminGuard(input.adminKey)) throw new Error('No autorizado');
    const db = await readDB();
    db.exercises = db.exercises.filter(e => e.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});