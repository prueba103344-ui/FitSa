export type Unit = 'g' | 'gramos' | 'ml' | 'unidad' | 'unidades' | 'piece' | 'slice' | 'taza' | 'cup';

export type NutritionItem = {
  name: string;
  per: { unit: Unit; amount: number }; // base amount for the macros
  calories: number; // per base amount
  protein: number; // grams per base amount
  carbs: number; // grams per base amount
  fat: number; // grams per base amount
  aliases?: string[];
};

export const nutritionDB: NutritionItem[] = [
  { name: 'pechuga de pollo', per: { unit: 'g', amount: 100 }, calories: 165, protein: 31, carbs: 0, fat: 3.6, aliases: ['pollo', 'chicken breast'] },
  { name: 'arroz', per: { unit: 'g', amount: 100 }, calories: 130, protein: 2.4, carbs: 28, fat: 0.3, aliases: ['arroz blanco', 'rice'] },
  { name: 'arroz integral', per: { unit: 'g', amount: 100 }, calories: 111, protein: 2.6, carbs: 23, fat: 0.9, aliases: ['brown rice'] },
  { name: 'pasta', per: { unit: 'g', amount: 100 }, calories: 131, protein: 5, carbs: 25, fat: 1.1, aliases: ['espagueti', 'spaghetti'] },
  { name: 'huevo', per: { unit: 'unidad', amount: 1 }, calories: 78, protein: 6, carbs: 0.6, fat: 5, aliases: ['huevos', 'egg'] },
  { name: 'clara de huevo', per: { unit: 'unidad', amount: 1 }, calories: 17, protein: 3.6, carbs: 0.2, fat: 0.05, aliases: ['clara', 'egg white'] },
  { name: 'avena', per: { unit: 'g', amount: 100 }, calories: 389, protein: 17, carbs: 66, fat: 7, aliases: ['oats'] },
  { name: 'leche', per: { unit: 'ml', amount: 100 }, calories: 42, protein: 3.4, carbs: 5, fat: 1, aliases: ['milk'] },
  { name: 'leche desnatada', per: { unit: 'ml', amount: 100 }, calories: 34, protein: 3.4, carbs: 5, fat: 0.1, aliases: ['leche descremada'] },
  { name: 'yogur', per: { unit: 'g', amount: 100 }, calories: 59, protein: 10, carbs: 3.6, fat: 0.4, aliases: ['yoghurt', 'yogurt'] },
  { name: 'platano', per: { unit: 'unidad', amount: 1 }, calories: 105, protein: 1.3, carbs: 27, fat: 0.3, aliases: ['banana', 'plátano'] },
  { name: 'manzana', per: { unit: 'unidad', amount: 1 }, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, aliases: ['apple'] },
  { name: 'salmon', per: { unit: 'g', amount: 100 }, calories: 208, protein: 20, carbs: 0, fat: 13, aliases: ['salmón', 'salmon'] },
  { name: 'atun', per: { unit: 'g', amount: 100 }, calories: 132, protein: 29, carbs: 0, fat: 1, aliases: ['atún', 'tuna'] },
  { name: 'pan', per: { unit: 'g', amount: 100 }, calories: 265, protein: 9, carbs: 49, fat: 3.2, aliases: ['bread'] },
  { name: 'aceite de oliva', per: { unit: 'ml', amount: 10 }, calories: 88, protein: 0, carbs: 0, fat: 10, aliases: ['aceite', 'olive oil'] },
  { name: 'mantequilla de cacahuete', per: { unit: 'g', amount: 15 }, calories: 90, protein: 4, carbs: 3, fat: 8, aliases: ['crema de cacahuete', 'peanut butter'] },
  { name: 'verduras mixtas', per: { unit: 'g', amount: 100 }, calories: 40, protein: 2, carbs: 8, fat: 0.5, aliases: ['mix verduras', 'vegetales', 'veggies'] },
];

export function findNutritionItem(raw: string): NutritionItem | undefined {
  const key = raw.trim().toLowerCase();
  return nutritionDB.find((i) => i.name === key || (i.aliases ?? []).some(a => a.toLowerCase() === key));
}
