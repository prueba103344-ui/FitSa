import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';
import { DietPlan } from '@/types';

const dietInput = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string().optional(),
  dayOfWeek: z.number().optional(),
  meals: z.any(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  createdAt: z.string(),
});

export default createTRPCRouter({
  listByStudent: publicProcedure.input(z.object({ studentId: z.string() })).query(async ({ input }) => {
    const db = await readDB();
    return db.diets.filter(d => d.studentId === input.studentId);
  }),
  upsert: publicProcedure.input(dietInput).mutation(async ({ input }) => {
    const db = await readDB();
    const idx = db.diets.findIndex(d => d.id === input.id);
    if (idx >= 0) db.diets[idx] = input as DietPlan; else db.diets.push(input as DietPlan);
    await writeDB(db);
    return input;
  }),
  update: publicProcedure.input(z.object({ id: z.string(), updates: z.any() })).mutation(async ({ input }) => {
    const db = await readDB();
    const idx = db.diets.findIndex(d => d.id === input.id);
    if (idx < 0) throw new Error('Diet not found');
    db.diets[idx] = { ...db.diets[idx], ...(input.updates as Partial<DietPlan>) } as DietPlan;
    await writeDB(db);
    return db.diets[idx];
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.diets = db.diets.filter(d => d.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});
