import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';
import { DailyProgress } from '@/types';

const progressInput = z.object({
  date: z.string(),
  studentId: z.string(),
  workoutCompleted: z.boolean(),
  mealsCompleted: z.number(),
  totalMeals: z.number(),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

export default createTRPCRouter({
  listByStudent: publicProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ input }) => {
      const db = await readDB();
      return (db as any).progress?.filter((p: DailyProgress) => p.studentId === input.studentId) || [];
    }),
  
  upsert: publicProcedure
    .input(progressInput)
    .mutation(async ({ input }) => {
      const db = await readDB();
      if (!(db as any).progress) (db as any).progress = [];
      
      const idx = (db as any).progress.findIndex(
        (p: DailyProgress) => p.date === input.date && p.studentId === input.studentId
      );
      
      if (idx >= 0) {
        (db as any).progress[idx] = input as DailyProgress;
      } else {
        (db as any).progress.push(input as DailyProgress);
      }
      
      await writeDB(db);
      return input;
    }),
  
  remove: publicProcedure
    .input(z.object({ date: z.string(), studentId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await readDB();
      if ((db as any).progress) {
        (db as any).progress = (db as any).progress.filter(
          (p: DailyProgress) => !(p.date === input.date && p.studentId === input.studentId)
        );
      }
      await writeDB(db);
      return { ok: true } as const;
    }),
});
