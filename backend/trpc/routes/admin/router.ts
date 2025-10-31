import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB } from '@/backend/db';

export default createTRPCRouter({
  listTrainersWithCounts: publicProcedure.query(async () => {
    const db = await readDB();
    const trainers = db.users.filter(u => u.role === 'trainer');

    const items = trainers.map(t => {
      const students = db.students.filter(s => s.trainerId === t.id);
      const studentIds = new Set(students.map(s => s.id));
      const workouts = db.workouts.filter(w => studentIds.has(w.studentId));
      const diets = db.diets.filter(d => studentIds.has(d.studentId));

      return {
        id: t.id,
        username: t.username,
        name: t.name,
        createdAt: t.createdAt,
        counts: {
          students: students.length,
          workouts: workouts.length,
          diets: diets.length,
        },
      };
    });

    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return { totalTrainers: items.length, items } as const;
  }),

  trainerDetail: publicProcedure.input(z.object({ trainerId: z.string() })).query(async ({ input }) => {
    const db = await readDB();
    const trainer = db.users.find(u => u.id === input.trainerId && u.role === 'trainer');
    if (!trainer) throw new Error('Entrenador no encontrado');

    const students = db.students.filter(s => s.trainerId === trainer.id);
    const studentIds = new Set(students.map(s => s.id));
    const workouts = db.workouts.filter(w => studentIds.has(w.studentId));
    const diets = db.diets.filter(d => studentIds.has(d.studentId));

    return {
      trainer: {
        id: trainer.id,
        username: trainer.username,
        name: trainer.name,
        createdAt: trainer.createdAt,
      },
      students,
      workouts,
      diets,
    } as const;
  }),
});
