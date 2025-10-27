import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { getAccessToken } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
    console.log('[TRPC] Using base URL:', envUrl);
    return envUrl;
  }
  console.error(
    "[TRPC] No base URL found in EXPO_PUBLIC_RORK_API_BASE_URL. Please restart the app using 'bun start' command."
  );
  return "";
};

const getUrlSafe = () => {
  const base = getBaseUrl();
  if (!base) {
    return "http://localhost:3000/api/trpc";
  }
  return `${base}/api/trpc`;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getUrlSafe(),
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          const baseUrl = getBaseUrl();
          if (!baseUrl) {
            console.error('[TRPC] Backend not configured. Please restart the app using "bun start" command.');
            throw new Error('Backend no configurado. Por favor, reinicia la aplicación usando el comando "bun start".');
          }

          const token = await getAccessToken();
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              console.error('[TRPC] Received HTML response instead of JSON. This usually means:');
              console.error('  1. Backend is not running');
              console.error('  2. Backend URL is incorrect');
              console.error('  3. Endpoint does not exist');
              console.error('[TRPC] Current URL:', url);
              throw new Error('Backend no disponible. Por favor, reinicia la aplicación usando el comando "bun start".');
            }
          }
          
          return response;
        } catch (error) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('[TRPC] Network error - cannot connect to backend:', error);
            throw new Error('No se pudo conectar al servidor. Por favor, verifica que hayas iniciado la aplicación con "bun start".');
          }
          throw error as Error;
        }
      },
    }),
  ],
});
