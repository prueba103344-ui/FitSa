import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB, ExerciseCatalogItem } from '@/backend/db';

const adminGuard = (inputKey?: string) => {
  const user = process.env.ADMIN_USER || process.env.EXPO_PUBLIC_ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || process.env.EXPO_PUBLIC_ADMIN_PASS || 'admin123';
  const expected = `${user}:${pass}`;
  return inputKey === expected;
};

export default createTRPCRouter({
  list: publicProcedure.query(async () => {
    const db = await readDB();
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
  remove: publicProcedure.input(z.object({ adminKey: z.string(), id: z.string() })).mutation(async ({ input }) => {
    if (!adminGuard(input.adminKey)) throw new Error('No autorizado');
    const db = await readDB();
    db.exercises = db.exercises.filter(e => e.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});