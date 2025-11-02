import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use("/api/trpc/*", async (c, next) => {
  console.log('[HONO] tRPC request:', c.req.method, c.req.url);
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  console.log('[HONO] Root endpoint hit');
  return c.json({ status: "ok", message: "API is running" });
});

app.notFound((c) => {
  console.log('[HONO] 404 Not Found:', c.req.url);
  return c.json({ error: 'Not Found', path: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[HONO] Error:', err);
  return c.json({ error: err.message }, 500);
});

export default app;
