import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';

export default createTRPCRouter({
  listByStudent: publicProcedure.input(z.object({ studentId: z.string() })).query(async ({ input }) => {
    const db = await readDB();
    return db.media.filter(m => m.studentId === input.studentId);
  }),
  add: publicProcedure.input(z.object({ id: z.string(), studentId: z.string(), uri: z.string().url(), type: z.enum(['photo', 'video']), createdAt: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.media.push(input);
    await writeDB(db);
    return input;
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.media = db.media.filter(m => m.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  })
});
