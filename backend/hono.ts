import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use("/api/trpc/*", async (c, next) => {
  console.log('[HONO] tRPC request:', c.req.method, c.req.url);
  try {
    await next();
    console.log('[HONO] tRPC response status:', c.res?.status);
  } catch (err) {
    console.error('[HONO] tRPC middleware error:', err);
    throw err;
  }
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path, input }) {
      console.error('[TRPC Server Error]', {
        type,
        path,
        error: error.message,
        code: error.code,
        input,
      });
    },
  })
);

app.get("/", (c) => {
  console.log('[HONO] Root endpoint hit');
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API endpoint" });
});

app.notFound((c) => {
  console.log('[HONO] 404 Not Found:', c.req.url);
  return c.json({ error: 'Not Found', path: c.req.url }, 404);
});

app.onError((err, c) => {
  console.error('[HONO] Error:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

export default app;
