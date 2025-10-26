import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';
import { WorkoutPlan } from '@/types';

const workoutInput = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string(),
  exercises: z.any(),
  daysOfWeek: z.array(z.number()),
  createdAt: z.string(),
});

export default createTRPCRouter({
  listByStudent: publicProcedure.input(z.object({ studentId: z.string() })).query(async ({ input }) => {
    const db = await readDB();
    return db.workouts.filter(w => w.studentId === input.studentId);
  }),
  upsert: publicProcedure.input(workoutInput).mutation(async ({ input }) => {
    const db = await readDB();
    const idx = db.workouts.findIndex(w => w.id === input.id);
    if (idx >= 0) db.workouts[idx] = input as WorkoutPlan; else db.workouts.push(input as WorkoutPlan);
    await writeDB(db);
    return input;
  }),
  update: publicProcedure.input(z.object({ id: z.string(), updates: z.any() })).mutation(async ({ input }) => {
    const db = await readDB();
    const idx = db.workouts.findIndex(w => w.id === input.id);
    if (idx < 0) throw new Error('Workout not found');
    db.workouts[idx] = { ...db.workouts[idx], ...(input.updates as Partial<WorkoutPlan>) } as WorkoutPlan;
    await writeDB(db);
    return db.workouts[idx];
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.workouts = db.workouts.filter(w => w.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});
