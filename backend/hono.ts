import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initializeDatabase } from "./init-db";

const app = new Hono();

console.log('🚀 Starting backend server...');
console.log('🌍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasRorkApiUrl: !!process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
});

initializeDatabase();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  console.log('✅ Root endpoint hit');
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  console.log('✅ /api endpoint hit');
  return c.json({ status: "ok", message: "tRPC API is running" });
});

app.get("/api/health", (c) => {
  console.log('✅ Health check');
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    message: "Backend is running" 
  });
});

app.all("*", (c) => {
  console.log('⚠️ Unmatched route:', c.req.method, c.req.url);
  return c.json({ error: "Not found", path: c.req.url }, 404);
});

console.log('✅ Backend server ready');

export default {
  fetch: app.fetch,
};
