import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/backend/trpc/create-context';
import { readDB, writeDB } from '@/backend/db';
import { DietPlan } from '@/types';

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  icon: z.string().optional(),
});

const directionSchema = z.object({
  step: z.number(),
  instruction: z.string(),
  completed: z.boolean().optional(),
});

const foodSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  quantity: z.number().optional(),
  unit: z.enum(['g', 'ml', 'mg']).optional(),
  completed: z.boolean().optional(),
  imageUrl: z.string().optional(),
  actualQuantity: z.number().optional(),
  plannedQuantity: z.number().optional(),
  plannedCalories: z.number().optional(),
  plannedProtein: z.number().optional(),
  plannedCarbs: z.number().optional(),
  plannedFat: z.number().optional(),
});

const mealSchema = z.object({
  id: z.string(),
  name: z.string(),
  foods: z.array(foodSchema),
  time: z.string().optional(),
  imageUrl: z.string().optional(),
  prepTime: z.number().optional(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  directions: z.array(directionSchema).optional(),
  description: z.string().optional(),
});

const dietInput = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string().optional(),
  dayOfWeek: z.number().optional(),
  meals: z.array(mealSchema),
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
    if (idx >= 0) {
      console.log(`✏️ Actualizando dieta existente: ${input.name || 'Sin nombre'} (ID: ${input.id})`);
      db.diets[idx] = input as DietPlan;
    } else {
      console.log(`➕ Creando nueva dieta: ${input.name || 'Sin nombre'} (ID: ${input.id})`);
      db.diets.push(input as DietPlan);
    }
    await writeDB(db);
    console.log(`✅ Dieta guardada exitosamente. Total: ${db.diets.length}`);
    return input;
  }),
  update: publicProcedure.input(z.object({ id: z.string(), updates: dietInput.partial() })).mutation(async ({ input }) => {
    console.log(`🔄 Solicitud de actualización de dieta: ${input.id}`);
    const db = await readDB();
    const idx = db.diets.findIndex(d => d.id === input.id);
    if (idx < 0) {
      console.error(`❌ Dieta no encontrada: ${input.id}`);
      throw new Error('Diet not found');
    }
    db.diets[idx] = { ...db.diets[idx], ...(input.updates as Partial<DietPlan>) } as DietPlan;
    await writeDB(db);
    console.log(`✅ Dieta actualizada: ${db.diets[idx].name || 'Sin nombre'}`);
    return db.diets[idx];
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const db = await readDB();
    db.diets = db.diets.filter(d => d.id !== input.id);
    await writeDB(db);
    return { ok: true } as const;
  }),
});
