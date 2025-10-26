import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import dietsRouter from "./routes/diets/router";
import workoutsRouter from "./routes/workouts/router";
import mediaRouter from "./routes/media/router";
import studentsRouter from "./routes/students/router";
import progressRouter from "./routes/progress/router";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  diets: dietsRouter,
  workouts: workoutsRouter,
  media: mediaRouter,
  students: studentsRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
