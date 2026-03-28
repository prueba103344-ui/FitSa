import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB, hashPassword, StoredUser } from '@/backend/db';
import { Student, Trainer } from '@/types';

const usernameSchema = z.string().min(3).max(32).regex(/^[a-z0-9_.-]+$/i);
const passwordSchema = z.string().min(6).max(128);

export default createTRPCRouter({
  signupTrainer: publicProcedure.input(z.object({
    username: usernameSchema,
    password: passwordSchema,
    name: z.string().min(2).max(64),
  })).mutation(async ({ input }) => {
    console.log('[Auth] Signup trainer request:', input.username);
    const db = await readDB();
    const existing = db.users.find(u => u.username.toLowerCase() === input.username.toLowerCase());
    if (existing) {
      console.log('[Auth] User already exists:', input.username);
      throw new Error('Usuario ya existe');
    }

    const id = `trainer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { salt, hash } = hashPassword(input.password);
    const user: StoredUser = {
      id,
      username: input.username.toLowerCase(),
      name: input.name,
      role: 'trainer',
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDB(db);
    console.log('[Auth] Trainer created successfully:', id);

    const trainer: Trainer = { id, name: input.name, role: 'trainer', clients: [] };
    return { user: trainer };
  }),

  createStudentAccount: publicProcedure.input(z.object({
    trainerId: z.string(),
    username: usernameSchema,
    password: passwordSchema,
    name: z.string().min(2).max(64),
  })).mutation(async ({ input }) => {
    console.log('[Auth] Create student account request:', input.username, 'for trainer:', input.trainerId);
    const db = await readDB();
    const trainer = db.users.find(u => u.id === input.trainerId && u.role === 'trainer');
    if (!trainer) {
      console.log('[Auth] Trainer not found:', input.trainerId);
      throw new Error('Entrenador no encontrado');
    }
    const exists = db.users.find(u => u.username.toLowerCase() === input.username.toLowerCase());
    if (exists) {
      console.log('[Auth] Student username already exists:', input.username);
      throw new Error('Usuario ya existe');
    }

    const id = `student_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { salt, hash } = hashPassword(input.password);
    const user: StoredUser = {
      id,
      username: input.username.toLowerCase(),
      name: input.name,
      role: 'student',
      trainerId: input.trainerId,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    const student: Student = {
      id,
      name: input.name,
      role: 'student',
      trainerId: input.trainerId,
      loginUsername: input.username.toLowerCase(),
      loginPassword: input.password,
    };
    const idx = db.students.findIndex(s => s.id === id);
    if (idx >= 0) db.students[idx] = student; else db.students.push(student);

    await writeDB(db);
    console.log('[Auth] Student created successfully:', id);

    return { student };
  }),

  login: publicProcedure.input(z.object({
    username: usernameSchema,
    password: passwordSchema,
  })).mutation(async ({ input }) => {
    console.log('[Auth] Login request for username:', input.username);
    const db = await readDB();
    const user = db.users.find(u => u.username.toLowerCase() === input.username.toLowerCase());
    if (!user) {
      console.log('[Auth] User not found:', input.username);
      throw new Error('Credenciales inválidas');
    }
    const { hash } = hashPassword(input.password, user.salt);
    if (hash !== user.passwordHash) {
      console.log('[Auth] Invalid password for user:', input.username);
      throw new Error('Credenciales inválidas');
    }

    console.log('[Auth] Login successful for user:', user.id, 'role:', user.role);

    if (user.role === 'trainer') {
      const trainer: Trainer = { id: user.id, name: user.name, role: 'trainer', clients: [] };
      return { user: trainer };
    } else {
      const student: Student = { id: user.id, name: user.name, role: 'student', trainerId: user.trainerId ?? '' };
      return { user: student };
    }
  }),
});
