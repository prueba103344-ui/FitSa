import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';
import { Student } from '@/types';

const studentInput = z.object({
  id: z.string(),
  name: z.string(),
  role: z.literal('student'),
  trainerId: z.string(),
  weight: z.number().optional(),
  height: z.number().optional(),
  age: z.number().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  goal: z.string().optional(),
  medicalNotes: z.string().optional(),
  avatar: z.string().optional(),
});

export default createTRPCRouter({
  list: publicProcedure.query(async () => {
    const db = await readDB();
    return db.students;
  }),
  upsert: publicProcedure.input(studentInput).mutation(async ({ input }) => {
    const db = await readDB();
    const idx = db.students.findIndex(s => s.id === input.id);
    if (idx >= 0) db.students[idx] = input as Student; else db.students.push(input as Student);
    await writeDB(db);
    return input;
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.students = db.students.filter(s => s.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});
