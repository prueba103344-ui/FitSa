import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB } from '@/backend/db';

const adminGuard = (inputKey?: string) => {
  const user = process.env.ADMIN_USER || process.env.EXPO_PUBLIC_ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || process.env.EXPO_PUBLIC_ADMIN_PASS || 'admin123';
  const expected = `${user}:${pass}`;
  return inputKey === expected;
};

export default createTRPCRouter({
  login: publicProcedure.input(z.object({ username: z.string(), password: z.string() })).mutation(async ({ input }) => {
    console.log('[ADMIN ROUTER] Login attempt for:', input.username);
    const expectedUser = process.env.ADMIN_USER || process.env.EXPO_PUBLIC_ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASS || process.env.EXPO_PUBLIC_ADMIN_PASS || 'admin123';
    console.log('[ADMIN ROUTER] Expected user:', expectedUser);
    if (input.username === expectedUser && input.password === expectedPass) {
      console.log('[ADMIN ROUTER] Login successful');
      return { adminKey: `${expectedUser}:${expectedPass}` };
    }
    console.log('[ADMIN ROUTER] Login failed - invalid credentials');
    throw new Error('Credenciales inválidas');
  }),
  overview: publicProcedure.input(z.object({ adminKey: z.string() })).query(async ({ input }) => {
    if (!adminGuard(input.adminKey)) throw new Error('No autorizado');
    const db = await readDB();
    const trainers = db.users.filter(u => u.role === 'trainer');
    const trainerSummaries = trainers.map(t => {
      const clients = db.students.filter(s => s.trainerId === t.id);
      const activeClients = clients.length;
      const workouts = db.workouts.filter(w => clients.some(c => c.id === w.studentId)).length;
      const diets = db.diets.filter(d => clients.some(c => c.id === d.studentId)).length;
      return {
        id: t.id,
        username: t.username,
        name: t.name,
        activeClients,
        workouts,
        diets,
      };
    });
    return { trainers: trainerSummaries };
  }),
});